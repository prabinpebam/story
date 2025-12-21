import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../../../src/core/presentation/AssetReadiness.js', () => ({
  waitForSlideAssetsReady: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../../../src/core/presentation/PresentationPrefetchManager.js', () => ({
  PresentationPrefetchManager: class MockPrefetch {
    destroy() {}
    onNavigation() {}
    updateFromState() {}
  },
}));

vi.mock('../../../../src/core/renderer/SlideView.js', () => ({
  SlideView: class MockSlideView {
    constructor(id) {
      this.id = id;
      this.domElement = document.createElement('div');
      this.domElement.setAttribute('data-slide-id', id);
    }
    mount(layer) {
      layer.appendChild(this.domElement);
    }
    update() {}
    unmount() {
      this.domElement.remove();
    }
  },
}));

describe('PresentationRenderer legacy transition telemetry', () => {
  const originalNavigator = globalThis.navigator;

  beforeEach(async () => {
    // Ensure telemetry is enabled.
    Object.defineProperty(globalThis, 'navigator', {
      value: { doNotTrack: '0' },
      configurable: true,
    });

    if (typeof window !== 'undefined') {
      window.__TELEMETRY_DISABLED__ = false;
    }

    const { store } = await import('../../../../src/core/Store.js');
    const { createInitialState } = await import('../../../../src/core/store/InitialState.js');
    store.restoreState(createInitialState());
    store.state.editor.activeSlideId = null;

    // Minimal slide state so StyleResolver can resolve legacy transition.
    store.state.slides = {
      'slide-1': {
        id: 'slide-1',
        layoutId: null,
        elements: {},
        elementOrder: [],
        styleAssignments: {
          slideTransition: { type: 'wipe', direction: 'right', durationMs: 300, easing: 'ease-in-out' },
        },
      },
      'slide-2': {
        id: 'slide-2',
        layoutId: null,
        elements: {},
        elementOrder: [],
        transition: 'magic',
        // no styleAssignments => legacy path
      },
    };

    document.body.innerHTML = '<div id="pm-root"></div>';
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true,
    });
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('emits a fallback telemetry event for legacy magic transitions', async () => {
    const events = [];

    const { telemetry } = await import('../../../../src/core/telemetry/Telemetry.js');
    telemetry.setSink((ev) => events.push(ev));

    const { animationManager } = await import('../../../../src/core/AnimationManager.js');
    vi.spyOn(animationManager, 'transition').mockResolvedValue(undefined);

    const { PresentationRenderer } = await import('../../../../src/core/renderer/PresentationRenderer.js');

    const renderer = new PresentationRenderer('pm-root');

    renderer.calculateBuilds = vi.fn();
    renderer.hideBuilds = vi.fn();
    renderer.playEntranceAnimations = vi.fn();
    renderer.getEffectiveSlideData = vi.fn(() => ({ width: 1, height: 1, elements: {}, elementOrder: [] }));

    // Establish oldId.
    await renderer.handleSlideChange('slide-1');
    events.length = 0;

    await renderer.handleSlideChange('slide-2');

    // The transition completion is chained via .then() in the renderer.
    await new Promise((r) => setTimeout(r, 0));

    const fallback = events.find((e) => e.type === 'transition_fallback_to_none');
    expect(fallback).toBeTruthy();
    expect(fallback.data.reason).toBe('legacy-magic');

    renderer.destroy();
    telemetry.setSink(null);
  });
});
