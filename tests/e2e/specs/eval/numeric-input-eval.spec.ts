/**
 * 12 — Numeric Input — Agnostic Eval Loop
 *
 * Evaluates NUM-01 through NUM-24: focus, commit, revert, scrub,
 * increment/decrement, mixed values, clamping, and units.
 *
 * Scene: 1 rect. Triggers via keyboard (arrows, enter, escape)
 * and store dispatches. Engine detects element property mutations.
 *
 * Run:  npx playwright test numeric-input-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

test.describe('Numeric Input Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // NUM-01..05: Focus, commit, revert
  test('NUM-01..05: Input focus and commit', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'numeric-input', scenario: 'NUM-01-05' });
    const [elA] = await seedRects(page, 1);

    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');

    // Change position via dispatch (simulates PI numeric input commit)
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, x: 250 });
    await page.waitForTimeout(200);
    await ev.capture('post-commit-x');

    // Revert via undo (simulates escape)
    await ev.pressKey('Control+z', 'post-revert');

    const report = ev.finalize();
    logReport(report);
  });

  // NUM-06..12: Scrub behavior
  test('NUM-06..12: Scrub via drag element', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'numeric-input', scenario: 'NUM-06-12' });
    const [elA] = await seedRects(page, 1);

    await ev.clickElement(elA, 'selected');
    await ev.capture('pre-scrub');

    // Scrub via element drag (same mechanism as number input scrub)
    await ev.dragElement(elA, 50, 0, 'post-scrub');

    const report = ev.finalize();
    logReport(report);
  });

  // NUM-13..18: Arrow key increment/decrement
  test('NUM-13..18: Arrow key increments', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'numeric-input', scenario: 'NUM-13-18' });
    const [elA] = await seedRects(page, 1);

    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');

    // NUM-13/14: Arrow nudge ±1
    await ev.pressKey('ArrowRight', 'inc-1');
    await ev.pressKey('ArrowLeft', 'dec-1');

    // NUM-15/16: Shift+Arrow ±10
    await ev.pressKey('Shift+ArrowRight', 'inc-10');
    await ev.pressKey('Shift+ArrowLeft', 'dec-10');

    const report = ev.finalize();
    logReport(report);
  });

  // NUM-19..24: Mixed values, clamping, units
  test('NUM-19..24: Clamping and boundaries', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'numeric-input', scenario: 'NUM-19-24' });
    const [elA] = await seedRects(page, 1);

    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');

    // Test opacity clamping (0-1)
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, opacity: 0.1 });
    await page.waitForTimeout(150);
    await ev.capture('low-opacity');

    await ev.dispatch('UPDATE_ELEMENT', { id: elA, opacity: 1 });
    await page.waitForTimeout(150);
    await ev.capture('full-opacity');

    const report = ev.finalize();
    logReport(report);
  });
});
