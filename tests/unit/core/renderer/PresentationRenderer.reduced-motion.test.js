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

describe('PresentationRenderer reduced-motion transition fallback', () => {
  const originalNavigator = globalThis.navigator;
  const originalMatchMedia = globalThis.window?.matchMedia;

  beforeEach(async () => {
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

    // Force reduced motion on.
    if (typeof window !== 'undefined') {
      window.matchMedia = vi.fn(() => ({ matches: true }));
    }
  });

  afterEach(() => {
    if (typeof window !== 'undefined') {
      window.matchMedia = originalMatchMedia;
    }

    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true,
    });

    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('forces morph to none when prefers-reduced-motion is enabled', async () => {
    const { StyleResolver } = await import('../../../../src/utils/StyleResolver.js');
    vi.spyOn(StyleResolver, 'getEffectiveSlideTransition').mockReturnValue({
      transition: { type: 'morph', durationMs: 300, easing: 'linear' },
    });

    const { animationManager } = await import('../../../../src/core/AnimationManager.js');
    const transitionSpy = vi.spyOn(animationManager, 'transition').mockResolvedValue(undefined);

    const { PresentationRenderer } = await import('../../../../src/core/renderer/PresentationRenderer.js');
    const renderer = new PresentationRenderer('pm-root');

    renderer.calculateBuilds = vi.fn();
    renderer.hideBuilds = vi.fn();
    renderer.playEntranceAnimations = vi.fn();
    renderer.getEffectiveSlideData = vi.fn(() => ({ width: 1, height: 1, elements: {}, elementOrder: [] }));

    await renderer.handleSlideChange('slide-1');
    transitionSpy.mockClear();

    await renderer.handleSlideChange('slide-2');

    expect(transitionSpy).toHaveBeenCalled();
    const passedTransition = transitionSpy.mock.calls[0][3];
    expect(passedTransition?.type).toBe('none');

    renderer.destroy();
  });
});
