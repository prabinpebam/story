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
      this.domElement.className = 'slide-view';
      this.domElement.setAttribute('data-slide-id', id);

      const bg = document.createElement('div');
      bg.className = 'slide-background';
      this.domElement.appendChild(bg);

      const content = document.createElement('div');
      content.className = 'mock-content';
      this.domElement.appendChild(content);
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

describe('PresentationRenderer transition DOM visibility', () => {
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

  it('keeps incoming slide hidden until AnimationManager begins the transition (prevents white flash)', async () => {
    const { StyleResolver } = await import('../../../../src/utils/StyleResolver.js');
    vi.spyOn(StyleResolver, 'getEffectiveSlideTransition').mockReturnValue({
      transition: { type: 'cover', direction: 'right', durationMs: 300, easing: 'linear' },
    });

    const { animationManager } = await import('../../../../src/core/AnimationManager.js');

    // Delay resolution so we can inspect DOM state at call time.
    let resolveTransition;
    const transitionPromise = new Promise((resolve) => {
      resolveTransition = resolve;
    });

    const transitionSpy = vi
      .spyOn(animationManager, 'transition')
      .mockImplementation(async (_container, _oldEl, newEl, _transitionConfig) => {
        // Renderer must NOT have revealed the incoming slide before calling AnimationManager.
        expect(newEl.style.visibility).toBe('hidden');

        // Simulate AnimationManager revealing the slide after start state is applied.
        newEl.style.visibility = 'visible';
        await transitionPromise;
      });

    const { PresentationRenderer } = await import('../../../../src/core/renderer/PresentationRenderer.js');
    const renderer = new PresentationRenderer('pm-root');

    renderer.calculateBuilds = vi.fn();
    renderer.hideBuilds = vi.fn();
    renderer.playEntranceAnimations = vi.fn();
    renderer.getEffectiveSlideData = vi.fn(() => ({ width: 1, height: 1, elements: {}, elementOrder: [] }));

    // Establish oldId.
    await renderer.handleSlideChange('slide-1');

    // Trigger a real transition.
    const pending = renderer.handleSlideChange('slide-2');
    await pending;

    expect(transitionSpy).toHaveBeenCalled();

    resolveTransition();

    renderer.destroy();
  });
});
