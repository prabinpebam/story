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

describe('PresentationRenderer readiness bounded-wait fallback', () => {
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
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('proceeds after 2000ms with none transition and safe placeholder class', async () => {
    vi.useFakeTimers();

    const events = [];
    const { telemetry } = await import('../../../../src/core/telemetry/Telemetry.js');
    telemetry.setSink((ev) => events.push(ev));

    const { StyleResolver } = await import('../../../../src/utils/StyleResolver.js');
    vi.spyOn(StyleResolver, 'getEffectiveSlideTransition').mockReturnValue({
      transition: { type: 'wipe', direction: 'right', durationMs: 300, easing: 'ease-in-out' },
    });

    const { waitForSlideAssetsReady } = await import('../../../../src/core/presentation/AssetReadiness.js');
    // First slide resolves readiness, second slide never resolves -> should hit bounded wait.
    waitForSlideAssetsReady
      .mockResolvedValueOnce(undefined)
      .mockImplementationOnce(() => new Promise(() => {}));

    const { animationManager } = await import('../../../../src/core/AnimationManager.js');
    const transitionSpy = vi.spyOn(animationManager, 'transition').mockResolvedValue(undefined);

    const { PresentationRenderer } = await import('../../../../src/core/renderer/PresentationRenderer.js');
    const renderer = new PresentationRenderer('pm-root');

    renderer.calculateBuilds = vi.fn();
    renderer.hideBuilds = vi.fn();
    renderer.playEntranceAnimations = vi.fn();
    renderer.getEffectiveSlideData = vi.fn(() => ({ width: 1, height: 1, elements: {}, elementOrder: [] }));

    // Establish oldId.
    await renderer.handleSlideChange('slide-1');
    events.length = 0;
    transitionSpy.mockClear();

    // Trigger slide change that will time out readiness.
    const pending = renderer.handleSlideChange('slide-2');

    // Advance bounded wait.
    vi.advanceTimersByTime(2000);
    await Promise.resolve();
    await pending;

    const view2 = renderer.activeSlideViews.get('slide-2');
    expect(view2).toBeTruthy();
    expect(view2.domElement.classList.contains('slide-view--readiness-fallback')).toBe(true);

    // Should force transition to none for this navigation.
    expect(transitionSpy).toHaveBeenCalled();
    const passedTransition = transitionSpy.mock.calls[0][3];
    expect(passedTransition?.type).toBe('none');

    // Telemetry should record the fallback reason.
    const types = events.map((e) => e.type);
    expect(types).toContain('transition_fallback_to_none');
    const fallback = events.find((e) => e.type === 'transition_fallback_to_none');
    expect(fallback?.data?.reason).toBe('readiness-timeout');

    renderer.destroy();
    telemetry.setSink(null);
  });

  it('still enforces readiness gating when animation engine is missing', async () => {
    const { StyleResolver } = await import('../../../../src/utils/StyleResolver.js');
    vi.spyOn(StyleResolver, 'getEffectiveSlideTransition').mockReturnValue({
      transition: { type: 'wipe', direction: 'right', durationMs: 300, easing: 'ease-in-out' },
    });

    const { waitForSlideAssetsReady } = await import('../../../../src/core/presentation/AssetReadiness.js');
    waitForSlideAssetsReady.mockResolvedValue(undefined);

    const { animationManager } = await import('../../../../src/core/AnimationManager.js');
    // Simulate missing engine.
    Object.defineProperty(animationManager, 'anime', {
      get() {
        return null;
      },
      configurable: true,
    });
    vi.spyOn(animationManager, 'transition').mockResolvedValue(undefined);

    const { PresentationRenderer } = await import('../../../../src/core/renderer/PresentationRenderer.js');
    const renderer = new PresentationRenderer('pm-root');

    renderer.calculateBuilds = vi.fn();
    renderer.hideBuilds = vi.fn();
    renderer.playEntranceAnimations = vi.fn();
    renderer.getEffectiveSlideData = vi.fn(() => ({ width: 1, height: 1, elements: {}, elementOrder: [] }));

    await renderer.handleSlideChange('slide-1');
    expect(waitForSlideAssetsReady).toHaveBeenCalled();

    renderer.destroy();
  });
});
