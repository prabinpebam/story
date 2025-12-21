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

describe('PresentationRenderer transition telemetry', () => {
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

    // Reset store state to avoid constructor-driven render side effects.
    const { store } = await import('../../../../src/core/Store.js');
    const { createInitialState } = await import('../../../../src/core/store/InitialState.js');
    store.restoreState(createInitialState());
    store.state.editor.activeSlideId = null;

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

  it('emits required transition events during a slide change', async () => {
    const events = [];

    const { telemetry } = await import('../../../../src/core/telemetry/Telemetry.js');
    telemetry.setSink((ev) => events.push(ev));

    const { StyleResolver } = await import('../../../../src/utils/StyleResolver.js');
    vi.spyOn(StyleResolver, 'getEffectiveSlideTransition').mockReturnValue({
      transition: { type: 'wipe', direction: 'right', durationMs: 300, easing: 'ease-in-out' },
    });

    const { animationManager } = await import('../../../../src/core/AnimationManager.js');
    vi.spyOn(animationManager, 'transition').mockResolvedValue(undefined);

    // Make timing deterministic.
    const nowValues = [0, 100, 100, 400];
    const nowSpy = vi.spyOn(performance, 'now').mockImplementation(() => {
      return nowValues.length ? nowValues.shift() : 500;
    });

    const { PresentationRenderer } = await import('../../../../src/core/renderer/PresentationRenderer.js');

    const renderer = new PresentationRenderer('pm-root');

    // Avoid unrelated store writes during this test.
    renderer.calculateBuilds = vi.fn();
    renderer.hideBuilds = vi.fn();
    renderer.playEntranceAnimations = vi.fn();
    renderer.getEffectiveSlideData = vi.fn(() => ({ width: 1, height: 1, elements: {}, elementOrder: [] }));

    // First slide: establishes oldId.
    await renderer.handleSlideChange('slide-1');
    events.length = 0;

    // Second slide: emits transition lifecycle + metrics.
    await renderer.handleSlideChange('slide-2');

    // The transition completion is chained via .then() in the renderer.
    await new Promise((r) => setTimeout(r, 0));

    const types = events.map((e) => e.type);

    expect(types).toContain('transition_requested');
    expect(types).toContain('transition_blocked_for_readiness');
    expect(types).toContain('transition_ready_latency');
    expect(types).toContain('transition_started');
    expect(types).toContain('transition_animation_duration');
    expect(types).toContain('transition_completed');

    // Privacy: no URLs or slide content fields are emitted.
    for (const ev of events) {
      expect(ev.data.url).toBeUndefined();
      expect(ev.data.assetUrl).toBeUndefined();
      expect(ev.data.slideContent).toBeUndefined();
      expect(ev.data.notes).toBeUndefined();
    }

    renderer.destroy();
    nowSpy.mockRestore();
    telemetry.setSink(null);
  });
});
