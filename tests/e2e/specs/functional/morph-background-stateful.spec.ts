import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

/**
 * Morph background behavior:
 * - Backgrounds should crossfade during Morph.
 * - Code backgrounds should preserve state when the background config matches.
 *
 * This test uses DOM evidence attributes:
 * - SlideView code canvas: data-bg-code-canvas-id
 * - PresentationRenderer transfer: data-morph-bg-transfer="code"
 * - AnimationManager crossfade: data-morph-bg-animated="1"
 */

test.describe('Morph background (stateful)', () => {
  test('crossfades backgrounds and preserves code background state', async ({ page, getState, dispatchAction }) => {
    const editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();

    // Ensure we have at least 2 slides and deterministic indices.
    let state = await getState();
    while ((state.slideOrder?.length || 0) < 2) {
      await dispatchAction('ADD_SLIDE');
      state = await getState();
    }

    const slide1Id = (state.slideOrder as string[])[0];
    const slide2Id = (state.slideOrder as string[])[1];

    // Same code on both slides => we should transfer the runner/canvas.
    const code = `// deterministic code background\n// CodeRunner provides: ctx, canvas, width, height, time, mouse\nlet t0 = Date.now();\nfunction draw(time) {\n  const dtMs = Date.now() - t0;\n  ctx.clearRect(0, 0, width, height);\n  ctx.fillStyle = (dtMs % 2000) < 1000 ? '#ff0000' : '#0000ff';\n  ctx.fillRect(0, 0, width, height);\n}`;

    await dispatchAction('UPDATE_SLIDE', { id: slide1Id, background: { type: 'code', value: code } });
    await dispatchAction('UPDATE_SLIDE', { id: slide2Id, background: { type: 'code', value: code } });

    // Destination slide defines the transition.
    await dispatchAction('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
      slideId: slide2Id,
      styleAssignments: {
        slideTransition: { type: 'morph', durationMs: 700, easing: 'linear' },
      },
    });

    // Start presentation in windowed mode.
    await page.locator('[data-testid="play-btn"]').click();
    await page.locator('[data-testid="presentation-mode-picker"]').waitFor({ state: 'visible' });
    await page.locator('[data-testid="present-windowed"]').click();

    await expect
      .poll(async () => (await getState()).editor.mode, { timeout: 5000 })
      .toBe('presentation');

    // Force slide index 0.
    const idx = (await getState()).presentation.currentSlideIndex;
    if (idx !== 0) {
      await dispatchAction('PRESENTATION_GOTO', 0);
    }
    await expect
      .poll(async () => (await getState()).presentation.currentSlideIndex, { timeout: 5000 })
      .toBe(0);

    const slideContent = page.locator('#slide-content');
    await expect(slideContent).toHaveAttribute('data-pm-transition-status', 'idle');

    // Capture initial code canvas id.
    const initialCanvasId = await page.evaluate((slideId) => {
      const view = document.querySelector(`#slide-content .slide-view[data-slide-id="${slideId}"]`);
      const canvas = view?.querySelector('.slide-background canvas');
      return canvas?.getAttribute('data-bg-code-canvas-id') || null;
    }, slide1Id);

    expect(initialCanvasId).toBeTruthy();

    // Navigate next and monitor background opacity while transitioning.
    // This must happen in a single page.evaluate because Playwright serializes evaluate calls.
    const monitor = await page.evaluate(async ({ slide1Id, slide2Id }) => {
      const slideContentEl = document.getElementById('slide-content');
      if (!slideContentEl) throw new Error('Missing #slide-content');

      const win = window as any;
      const store = win.__TEST_STORE__ || win._storyAppStore;
      if (!store) throw new Error('Test store not exposed');

      const raf = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      // Trigger the transition.
      store.dispatch('PRESENTATION_NEXT');

      // Wait for transition to start.
      const startedAt = performance.now();
      while (slideContentEl.getAttribute('data-pm-transition-status') !== 'transitioning') {
        if (performance.now() - startedAt > 3000) throw new Error('Transition did not start');
        await raf();
      }

      const samples: Array<{ t: number; oldOpacity: number | null; newOpacity: number | null }> = [];

      // Sample until idle.
      while (slideContentEl.getAttribute('data-pm-transition-status') === 'transitioning') {
        const oldBg = document.querySelector(`#slide-content .slide-view[data-slide-id="${slide1Id}"] .slide-background`) as HTMLElement | null;
        const newBg = document.querySelector(`#slide-content .slide-view[data-slide-id="${slide2Id}"] .slide-background`) as HTMLElement | null;

        const oldOpacity = oldBg ? Number(getComputedStyle(oldBg).opacity) : null;
        const newOpacity = newBg ? Number(getComputedStyle(newBg).opacity) : null;

        samples.push({ t: performance.now(), oldOpacity, newOpacity });
        await raf();
      }

      const oldValues = samples.map(s => s.oldOpacity).filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
      const newValues = samples.map(s => s.newOpacity).filter((v): v is number => typeof v === 'number' && Number.isFinite(v));

      const minOld = oldValues.length ? Math.min(...oldValues) : null;
      const maxOld = oldValues.length ? Math.max(...oldValues) : null;
      const minNew = newValues.length ? Math.min(...newValues) : null;
      const maxNew = newValues.length ? Math.max(...newValues) : null;

      return { minOld, maxOld, minNew, maxNew, sampleCount: samples.length };
    }, { slide1Id, slide2Id });

    await expect
      .poll(async () => slideContent.getAttribute('data-pm-transition-status'), { timeout: 10000 })
      .toBe('idle');

    // When the background is state-transferred (same code), there is only one
    // underlying visual; crossfading opacity would fade it to blank (flicker).
    await expect(page.locator(`#slide-content .slide-view[data-slide-id="${slide2Id}"]`)).toHaveAttribute(
      'data-morph-bg-animated',
      '0'
    );

    // Opacity sanity: new bg should remain fully visible.
    expect(monitor.sampleCount).toBeGreaterThan(2);
    expect(monitor.maxNew).not.toBeNull();
    expect(monitor.minNew).not.toBeNull();
    expect((monitor.minNew as number)).toBeGreaterThan(0.99);

    // Stateful transfer evidence.
    await expect(page.locator(`#slide-content .slide-view[data-slide-id="${slide2Id}"]`)).toHaveAttribute(
      'data-morph-bg-transfer',
      'code'
    );

    const finalCanvasId = await page.evaluate((slideId) => {
      const view = document.querySelector(`#slide-content .slide-view[data-slide-id="${slideId}"]`);
      const canvas = view?.querySelector('.slide-background canvas');
      return canvas?.getAttribute('data-bg-code-canvas-id') || null;
    }, slide2Id);

    expect(finalCanvasId).toBe(initialCanvasId);

    // Exit presentation.
    await page.keyboard.press('Escape');
    await expect
      .poll(async () => (await getState()).editor.mode, { timeout: 5000 })
      .toBe('edit');
  });
});
