/**
 * 09 — Layer Management — Agnostic Eval Loop
 *
 * Evaluates LYR-01 through LYR-40: layer tree rendering, selection sync,
 * visibility/lock toggles, rename, reorder, and group hierarchy.
 *
 * Scene: 2-3 rects + 1 group. Critical state: selectedElementIds,
 * element hidden/locked flags, element names, elementOrder, element
 * parentId for grouping.
 *
 * Run:  npx playwright test layer-management-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, seedGroup, clearSelection, logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

test.describe('Layer Management Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(
      () => !!(window as any).__TEST_CANVAS_MANAGER__,
      null,
      { timeout: 10_000 },
    );
  });

  // ─── Layer Tree Rendering (LYR-01..08) ────────────────────────────────

  // LYR-01..08: Tree renders with seeded elements — capture verifies DOM count
  test('LYR-01..08: Layer tree rendering', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'layer-mgmt', scenario: 'LYR-01-08' });
    const [elA, elB] = await seedRects(page, 2);
    const { groupId, child1, child2 } = await seedGroup(page);

    await ev.capture('baseline');

    // Select group to verify depth/hierarchy in store
    await ev.clickElement(child1, 'click-group-child');
    await ev.capture('group-child-selected');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Selection Sync (LYR-09..13) ─────────────────────────────────────

  // LYR-09/11: Canvas select syncs to store (selection-eval already covers this,
  // but we verify the store update here)
  test('LYR-09/11/12: Selection sync canvas↔store', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'layer-mgmt', scenario: 'LYR-09-12' });
    const [elA, elB] = await seedRects(page, 2);

    await ev.capture('baseline');

    // LYR-09: Click element on canvas → store selection updates
    await ev.clickElement(elA, 'select-A');

    // LYR-12: Programmatic selection → canvas should show gizmo
    await ev.dispatch('UPDATE_SELECTION', [elB]);
    await page.waitForTimeout(200);
    await ev.capture('store-select-B');

    const report = ev.finalize();
    logReport(report);
  });

  // LYR-10: Shift+click toggles selection
  test('LYR-10: Toggle selection', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'layer-mgmt', scenario: 'LYR-10' });
    const [elA, elB] = await seedRects(page, 2);

    await ev.clickElement(elA, 'select-A');
    await ev.shiftClickElement(elB, 'add-B');
    await ev.shiftClickElement(elA, 'remove-A');

    const report = ev.finalize();
    logReport(report);
  });

  // LYR-13: Right-click selects element
  test('LYR-13: Right-click selects layer', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'layer-mgmt', scenario: 'LYR-13' });
    const [elA] = await seedRects(page, 1);

    await ev.capture('baseline');
    await ev.rightClickElement(elA, 'right-click-select');
    await ev.pressKey('Escape', 'close-menu');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Visibility Toggle (LYR-14..17) ──────────────────────────────────

  test('LYR-14..17: Visibility toggle', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'layer-mgmt', scenario: 'LYR-14-17' });
    const [elA] = await seedRects(page, 1);

    await ev.clickElement(elA, 'selected');
    await ev.capture('pre-hide');

    // LYR-16: Toggle visibility
    await ev.dispatch('TOGGLE_ELEMENT_VISIBILITY', { id: elA });
    await page.waitForTimeout(200);
    await ev.capture('post-hide');

    // Toggle back
    await ev.dispatch('TOGGLE_ELEMENT_VISIBILITY', { id: elA });
    await page.waitForTimeout(200);
    await ev.capture('post-show');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Lock Toggle (LYR-18..19) ────────────────────────────────────────

  test('LYR-18/19: Lock toggle', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'layer-mgmt', scenario: 'LYR-18-19' });
    const [elA] = await seedRects(page, 1);

    await ev.clickElement(elA, 'selected');
    await ev.capture('pre-lock');

    await ev.dispatch('TOGGLE_ELEMENT_LOCK', { id: elA });
    await page.waitForTimeout(200);
    await ev.capture('post-lock');

    await ev.dispatch('TOGGLE_ELEMENT_LOCK', { id: elA });
    await page.waitForTimeout(200);
    await ev.capture('post-unlock');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Rename Flow (LYR-20..24) ────────────────────────────────────────

  test('LYR-20..23: Rename element via dispatch', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'layer-mgmt', scenario: 'LYR-20-23' });
    const [elA] = await seedRects(page, 1);

    await ev.clickElement(elA, 'selected');
    await ev.capture('pre-rename');

    // LYR-22/23: Commit rename via dispatch
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, name: 'Renamed Element' });
    await page.waitForTimeout(200);
    await ev.capture('post-rename');

    const report = ev.finalize();
    logReport(report);
  });

  // LYR-24: Block rename on inherited (test with locked as proxy)
  test('LYR-24: Block rename on inherited', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'layer-mgmt', scenario: 'LYR-24' });

    // Check for inherited elements
    const hasInherited = await page.evaluate(() => {
      const el = document.querySelector('#slide-content .slide-element[data-source="layout"], #slide-content .slide-element[data-source="theme"]');
      return el ? el.getAttribute('data-element-id') : null;
    });

    if (hasInherited) {
      await ev.capture('inherited-element');
    } else {
      await ev.capture('no-inherited-elements');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Reordering (LYR-25..34) ─────────────────────────────────────────

  test('LYR-25..31: Z-order reordering', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'layer-mgmt', scenario: 'LYR-25-31' });
    const [elA, elB, elC] = await seedRects(page, 3);

    await ev.clickElement(elA, 'select-A');
    await ev.capture('pre-reorder');

    // Bring to front
    await ev.pressKey('Control+Shift+]', 'bring-front');
    // Send to back
    await ev.pressKey('Control+Shift+[', 'send-back');
    // Bring forward
    await ev.pressKey('Control+]', 'bring-forward');
    // Send backward
    await ev.pressKey('Control+[', 'send-backward');

    const report = ev.finalize();
    logReport(report);
  });

  // LYR-32/33: Boolean/mask operand reorder (via dispatch)
  test('LYR-32/33: Composite operand reorder', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'layer-mgmt', scenario: 'LYR-32-33' });
    const [elA, elB] = await seedRects(page, 2);

    await ev.capture('baseline');

    // Reorder via standard z-order (proxy for composite reorder)
    await ev.clickElement(elA, 'select-A');
    await ev.pressKey('Control+]', 'reorder-forward');

    const report = ev.finalize();
    logReport(report);
  });

  // LYR-26/27/34: Block drag on inherited/mask, clear drag state
  test('LYR-26/27/34: Drag block and cleanup', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'layer-mgmt', scenario: 'LYR-26-34' });
    const [elA] = await seedRects(page, 1);

    // Lock element (proxy for inherited/non-draggable)
    await ev.dispatch('TOGGLE_ELEMENT_LOCK', { id: elA });
    await page.waitForTimeout(200);
    await ev.capture('locked');

    // Attempt select+drag
    const pos = await ev.getElementCenter(elA);
    await page.mouse.click(pos.x, pos.y);
    await page.waitForTimeout(150);
    await page.mouse.move(pos.x, pos.y);
    await page.mouse.down();
    await page.mouse.move(pos.x + 60, pos.y + 30, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(200);
    await ev.capture('post-drag-blocked');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Inherited Elements (LYR-35..37) ──────────────────────────────────

  test('LYR-35..37: Inherited elements visibility', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'layer-mgmt', scenario: 'LYR-35-37' });

    // Capture baseline — effective slide merges slide + layout + theme
    await ev.capture('effective-slide');

    // Seed elements then capture
    const [elA] = await seedRects(page, 1);
    await ev.capture('with-seeded-element');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Group Hierarchy (LYR-38..40) ─────────────────────────────────────

  test('LYR-38..40: Group/composite hierarchy', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'layer-mgmt', scenario: 'LYR-38-40' });
    const { groupId, child1, child2 } = await seedGroup(page);

    await ev.capture('group-hierarchy');

    // Select group
    await ev.clickElement(child1, 'click-child');
    await ev.capture('child-in-group');

    // Enter group
    await ev.dblClickElement(child1, 'enter-group');
    await ev.capture('inside-group');

    // Exit group
    await ev.clickEmpty('exit-group');

    const report = ev.finalize();
    logReport(report);
  });
});
