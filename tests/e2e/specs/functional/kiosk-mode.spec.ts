import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

test.describe('Kiosk / autoplay (Gate 10)', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    // Enable kiosk entry in mode picker (feature-flagged).
    await page.addInitScript(() => {
      localStorage.setItem('story-feature-kiosk', '1');
      (window as any).__PM_TEST_SHOW_KIOSK = true;
    });

    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
  });

  test('auto-advances and can loop', async ({ page }) => {
    // Ensure we have at least 2 slides.
    await editor.addSlideBtn.click();

    // Make autoplay fast + deterministic.
    await page.evaluate(() => {
      (window as any).__PM_TEST_KIOSK_CONFIG = {
        enabled: true,
        autoAdvanceSeconds: 0.2,
        loop: true,
        disableInput: false
      };
    });

    await editor.playBtn.click();
    await page.locator('[data-testid="presentation-mode-picker"]').waitFor({ state: 'visible' });
    await page.locator('[data-testid="present-kiosk"]').click();

    // Wait until it advances to slide 2.
    await page.waitForFunction(() => {
      const st = (window as any).__TEST_STORE__?.getState?.();
      return st?.editor?.mode === 'presentation' && st?.presentation?.currentSlideIndex === 1;
    });

    // Wait until it loops back to slide 1.
    await page.waitForFunction(() => {
      const st = (window as any).__TEST_STORE__?.getState?.();
      return st?.editor?.mode === 'presentation' && st?.presentation?.currentSlideIndex === 0;
    });
  });

  test('disableInput blocks manual navigation but Escape exits', async ({ page }) => {
    await editor.addSlideBtn.click();
    // New slides often become active; ensure we start from slide 1 for deterministic assertions.
    await editor.selectSlide(0);

    await page.evaluate(() => {
      (window as any).__PM_TEST_KIOSK_CONFIG = {
        enabled: true,
        autoAdvanceSeconds: 1000,
        loop: true,
        disableInput: true
      };
    });

    await editor.playBtn.click();
    await page.locator('[data-testid="presentation-mode-picker"]').waitFor({ state: 'visible' });
    await page.locator('[data-testid="present-kiosk"]').click();

    // Manual navigation should be blocked.
    await page.keyboard.press('ArrowRight');

    const idxAfter = await page.evaluate(() => {
      const st = (window as any).__TEST_STORE__?.getState?.();
      return st?.presentation?.currentSlideIndex ?? -1;
    });
    expect(idxAfter).toBe(0);

    // Escape still exits.
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => {
      const st = (window as any).__TEST_STORE__?.getState?.();
      return st?.editor?.mode === 'edit';
    });
  });

  test('user input resets the autoplay countdown', async ({ page }) => {
    await editor.addSlideBtn.click();
    await editor.selectSlide(0);

    await page.evaluate(() => {
      (window as any).__PM_TEST_KIOSK_CONFIG = {
        enabled: true,
        autoAdvanceSeconds: 1,
        loop: false,
        disableInput: false
      };
    });

    await editor.playBtn.click();
    await page.locator('[data-testid="presentation-mode-picker"]').waitFor({ state: 'visible' });
    await page.locator('[data-testid="present-kiosk"]').click();

    // Wait for part of the interval, then interrupt with a non-navigation key.
    await page.waitForTimeout(600);
    await page.keyboard.press('Shift');

    // Without interruption, the slide would have advanced at ~1000ms.
    await page.waitForTimeout(600);
    const idxAfter = await page.evaluate(() => {
      const st = (window as any).__TEST_STORE__?.getState?.();
      return st?.presentation?.currentSlideIndex ?? -1;
    });
    expect(idxAfter).toBe(0);

    // After enough time from the interruption, it should advance.
    await page.waitForTimeout(700);
    await page.waitForFunction(() => {
      const st = (window as any).__TEST_STORE__?.getState?.();
      return st?.presentation?.currentSlideIndex === 1;
    });
  });
});
