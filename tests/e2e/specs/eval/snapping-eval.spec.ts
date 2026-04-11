/**
 * 13 — Snapping & Alignment — Agnostic Eval Loop
 *
 * Evaluates SNP-01 through SNP-19: snap to slide center/edge,
 * element-to-element snap, resize snap, equal spacing, column snap,
 * snap guides, and Ctrl-disable.
 *
 * Scene: 2-3 rects for snap targets. Critical state: activeGuides,
 * element positions, interaction layer snap data.
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

  // SNP-01..06: Snap to slide center, edge, and element
  test('SNP-01..06: Drag snap to slide and element', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'snapping', scenario: 'SNP-01-06' });
    const [elA, elB] = await seedRects(page, 2, { spacingX: 300 });

    await ev.clickElement(elA, 'selected');
    await ev.capture('pre-drag');

    // Drag toward center of canvas (slide center snap)
    const posA = await ev.getElementCenter(elA);
    await page.mouse.move(posA.x, posA.y);
    await page.mouse.down();
    // Move slowly toward canvas center
    const box = await page.locator('#canvas-container').boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 15 });
      await page.waitForTimeout(50);
      await ev.capture('near-center');
    }
    await page.mouse.up();
    await page.waitForTimeout(200);
    await ev.capture('post-snap-drop');

    const report = ev.finalize();
    logReport(report);
  });

  // SNP-07: Ctrl disables snapping
  test('SNP-07: Ctrl disables snap', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'snapping', scenario: 'SNP-07' });
    const [elA, elB] = await seedRects(page, 2, { spacingX: 200 });

    await ev.clickElement(elA, 'selected');
    await ev.capture('pre-drag');

    // Drag with Ctrl held (snapping disabled)
    const pos = await ev.getElementCenter(elA);
    await page.keyboard.down('Control');
    await page.mouse.move(pos.x, pos.y);
    await page.mouse.down();
    await page.mouse.move(pos.x + 100, pos.y, { steps: 8 });
    await page.mouse.up();
    await page.keyboard.up('Control');
    await page.waitForTimeout(200);
    await ev.capture('post-ctrl-drag');

    const report = ev.finalize();
    logReport(report);
  });

  // SNP-09..11: Resize snap
  test('SNP-09..11: Resize snap', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'snapping', scenario: 'SNP-09-11' });
    const [elA, elB] = await seedRects(page, 2, { spacingX: 250, width: 120, height: 80 });

    await ev.clickElement(elA, 'selected');
    await ev.capture('pre-resize');

    // Resize east handle toward elB
    const posB = await ev.getElementCenter(elB);
    const rectA = await ev.getElementRect(elA);
    const handleX = rectA.x + rectA.width;
    const handleY = rectA.y + rectA.height / 2;
    await page.mouse.move(handleX, handleY);
    await page.mouse.down();
    await page.mouse.move(posB.x - 60, handleY, { steps: 12 });
    await page.waitForTimeout(50);
    await ev.capture('during-resize-snap');
    await page.mouse.up();
    await page.waitForTimeout(200);
    await ev.capture('post-resize-snap');

    const report = ev.finalize();
    logReport(report);
  });

  // SNP-12..14: Equal spacing snap
  test('SNP-12..14: Equal spacing snap', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'snapping', scenario: 'SNP-12-14' });
    const [elA, elB, elC] = await seedRects(page, 3, { spacingX: 200 });

    await ev.clickElement(elB, 'select-middle');
    await ev.capture('pre-spacing');

    // Drag middle element to test equal spacing
    await ev.dragElement(elB, 0, 50, 'post-spacing-drag');

    const report = ev.finalize();
    logReport(report);
  });

  // SNP-15..16: Column and margin snap
  test('SNP-15..16: Column and margin snap', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'snapping', scenario: 'SNP-15-16' });
    const [elA] = await seedRects(page, 1);

    await ev.clickElement(elA, 'selected');
    await ev.capture('pre-column-snap');

    // Drag toward left edge (margin snap)
    const pos = await ev.getElementCenter(elA);
    await page.mouse.move(pos.x, pos.y);
    await page.mouse.down();
    await page.mouse.move(100, pos.y, { steps: 10 });
    await page.waitForTimeout(50);
    await ev.capture('near-margin');
    await page.mouse.up();
    await page.waitForTimeout(200);
    await ev.capture('post-margin-snap');

    const report = ev.finalize();
    logReport(report);
  });

  // SNP-17..19: Guide rendering and cleanup
  test('SNP-17..19: Snap guides render and clear', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'snapping', scenario: 'SNP-17-19' });
    const [elA, elB] = await seedRects(page, 2, { spacingX: 250 });

    await ev.clickElement(elA, 'selected');

    // Drag near B to trigger guides
    const posA = await ev.getElementCenter(elA);
    const posB = await ev.getElementCenter(elB);
    await page.mouse.move(posA.x, posA.y);
    await page.mouse.down();
    await page.mouse.move(posB.x, posA.y, { steps: 12 });
    await page.waitForTimeout(50);
    await ev.capture('guides-visible');
    await page.mouse.up();
    await page.waitForTimeout(200);
    await ev.capture('guides-cleared');

    const report = ev.finalize();
    logReport(report);
  });

  // SNP-08: Deep edit snap awareness
  test('SNP-08: Deep edit snap', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'snapping', scenario: 'SNP-08' });
    const [elA] = await seedRects(page, 1);

    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');

    // Nudge as proxy for deep edit movement
    await ev.pressKey('ArrowRight', 'nudge');
    await ev.pressKey('ArrowRight', 'nudge-2');

    const report = ev.finalize();
    logReport(report);
  });
});
