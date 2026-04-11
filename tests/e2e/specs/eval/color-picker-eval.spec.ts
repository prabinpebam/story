/**
 * 18 — Color Picker — Agnostic Eval Loop
 * Evaluates CLR-01..39. Scene: 1 rect. Triggers via dispatch.
 * Run:  npx playwright test color-picker-eval --project=chromium --headed
 */
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;
test.describe('Color Picker Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // CLR-01..10: HSB area, hue slider, alpha slider
  test('CLR-01..10: Color selection', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'color-picker', scenario: 'CLR-01-10' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');
    await ev.dispatch('UPDATE_FILL', { id: elA, fillIndex: 0, color: '#FF5500' });
    await page.waitForTimeout(200);
    await ev.capture('post-color');
    await ev.dispatch('UPDATE_FILL', { id: elA, fillIndex: 0, color: '#00CC88' });
    await page.waitForTimeout(200);
    await ev.capture('post-color-2');
    const report = ev.finalize();
    logReport(report);
  });

  // CLR-11..20: Hex input, opacity input, eyedropper
  test('CLR-11..20: Hex and opacity', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'color-picker', scenario: 'CLR-11-20' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');
    await ev.dispatch('UPDATE_FILL', { id: elA, fillIndex: 0, color: '#123456', opacity: 0.75 });
    await page.waitForTimeout(200);
    await ev.capture('hex-and-opacity');
    const report = ev.finalize();
    logReport(report);
  });

  // CLR-21..30: Theme swatches, link/unlink
  test('CLR-21..30: Theme colors', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'color-picker', scenario: 'CLR-21-30' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');
    const report = ev.finalize();
    logReport(report);
  });

  // CLR-31..39: Gradient picker, stops, angle
  test('CLR-31..39: Gradient picker', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'color-picker', scenario: 'CLR-31-39' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');
    await ev.dispatch('UPDATE_FILL', { id: elA, fillIndex: 0, type: 'linear-gradient', angle: 90,
      stops: [{ color: '#FF0000', position: 0 }, { color: '#0000FF', position: 1 }] });
    await page.waitForTimeout(200);
    await ev.capture('gradient-applied');
    const report = ev.finalize();
    logReport(report);
  });
});
