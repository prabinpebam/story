/**
 * 13 — Snapping & Alignment — Agnostic Eval Loop
 *
 * Evaluates SNP-01 through SNP-19: snap to slide center/edge, snap to elements,
 * snap threshold, ctrl-suppress, resize snap, spacing snap, and guide visuals.
 *
 * Run:  npx playwright test snapping-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

test.describe('Snapping & Alignment Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // SNP-01/02: Snap to slide center
  test('SNP-01/02: Snap to slide center X/Y', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'snapping', scenario: 'SNP-01-02' });
    const [elA] = await seedRects(page, 1, { startX: 50, startY: 50, width: 100, height: 60 });
    await ev.clickElement(elA, 'selected');

    // Drag toward slide center — snapping should kick in
    await ev.dragElement(elA, 350, 250, 'post-drag-toward-center', { steps: 20 });

    const report = ev.finalize();
    logReport(report);
  });

  // SNP-04/05: Snap to other element
  test('SNP-04/05: Snap to other element edge/center', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'snapping', scenario: 'SNP-04-05' });
    const [elA, elB] = await seedRects(page, 2, { startX: 100, startY: 150, spacingX: 300 });
    await ev.clickElement(elA, 'select-A');

    // Drag A toward B's left edge
    await ev.dragElement(elA, 170, 0, 'post-snap-to-element', { steps: 20 });

    const report = ev.finalize();
    logReport(report);
  });

  // SNP-07: No snap with Ctrl held
  test('SNP-07: Ctrl suppresses snapping', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'snapping', scenario: 'SNP-07' });
    const [elA, elB] = await seedRects(page, 2, { spacingX: 300 });
    await ev.clickElement(elA, 'selected');

    // Drag with Ctrl held — no snapping
    const pos = await ev.getElementCenter(elA);
    await page.mouse.move(pos.x, pos.y);
    await page.keyboard.down('Control');
    await page.mouse.down();
    await page.mouse.move(pos.x + 170, pos.y, { steps: 15 });
    await page.mouse.up();
    await page.keyboard.up('Control');
    await page.waitForTimeout(200);
    await ev.capture('post-ctrl-drag-no-snap');

    const report = ev.finalize();
    logReport(report);
  });

  // SNP-12/13: Equal spacing snap
  test('SNP-12/13: Equal spacing snap', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'snapping', scenario: 'SNP-12-13' });
    // Three elements in a row
    const [elA, elB, elC] = await seedRects(page, 3, { startX: 100, spacingX: 200 });
    await ev.clickElement(elB, 'select-B');

    // Drag B to adjust spacing evenly
    await ev.dragElement(elB, 10, 0, 'post-spacing-snap', { steps: 15 });

    const report = ev.finalize();
    logReport(report);
  });

  // SNP-17/19: Guide lines appear and clear
  test('SNP-17/19: Snap guides appear and clear on drop', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'snapping', scenario: 'SNP-17-19' });
    const [elA] = await seedRects(page, 1, { startX: 50, startY: 50 });
    await ev.clickElement(elA, 'selected');

    // Start drag toward center (capture mid-drag for guide visibility)
    const pos = await ev.getElementCenter(elA);
    await page.mouse.move(pos.x, pos.y);
    await page.mouse.down();
    await page.mouse.move(pos.x + 200, pos.y + 150, { steps: 15 });
    await page.waitForTimeout(100);
    await ev.capture('mid-drag-guides');

    // Release — guides should clear
    await page.mouse.up();
    await page.waitForTimeout(200);
    await ev.capture('post-drop-guides-cleared');

    const report = ev.finalize();
    logReport(report);
  });
});
