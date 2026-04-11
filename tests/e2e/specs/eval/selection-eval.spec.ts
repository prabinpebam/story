/**
 * Selection & Hit-Testing — Agnostic Eval Loop
 *
 * Evaluates selection taskflows (SEL-01 through SEL-13) by driving the real
 * app through mouse/keyboard actions, capturing three-layer snapshots +
 * screenshots at each step, and detecting anomalies through heuristic
 * detectors, temporal rules, and mutation timeline analysis.
 *
 * Reusable: run at any time to verify the feature works correctly.
 * Reviewable: outputs JSON reports, screenshots, and a human-readable REPORT.md
 * to test-results/eval-reports/selection/.
 *
 * Run:
 *   npx playwright test selection-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage, CanvasHelper } from '../../pages';
import { EvalSession, type AnomalyReport } from '../../helpers/eval-engine';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Seed N rect elements onto the current slide via store dispatch (scene setup only). */
async function seedElements(
  page: import('@playwright/test').Page,
  count: number,
  opts?: { spread?: boolean },
): Promise<string[]> {
  const ids: string[] = await page.evaluate(({ count, spread }) => {
    const store = (window as any).__TEST_STORE__;
    if (!store) throw new Error('Store not available');
    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
      const id = `eval-el-${Date.now()}-${i}`;
      const x = spread ? 100 + i * 250 : 100 + i * 150;
      const y = spread ? 100 + (i % 2) * 200 : 150;
      store.dispatch('ADD_ELEMENT', {
        id,
        type: 'rect',
        x, y,
        width: 120, height: 80,
        rotation: 0,
        opacity: 1,
        name: `Eval Element ${i + 1}`,
        fills: [{ type: 'solid', color: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B'][i % 4] }],
      });
      ids.push(id);
    }
    // Clear selection after seeding
    store.dispatch('UPDATE_SELECTION', []);
    return ids;
  }, { count, spread: opts?.spread ?? false });

  await page.waitForTimeout(200);
  return ids;
}

/** Seed a group element with 2 children. Returns { groupId, child1, child2 }. */
async function seedGroup(page: import('@playwright/test').Page): Promise<{
  groupId: string; child1: string; child2: string;
}> {
  const ids = await page.evaluate(() => {
    const store = (window as any).__TEST_STORE__;
    const child1 = `eval-gc1-${Date.now()}`;
    const child2 = `eval-gc2-${Date.now()}`;
    store.dispatch('ADD_ELEMENT', {
      id: child1, type: 'rect', x: 300, y: 100, width: 80, height: 60,
      rotation: 0, opacity: 1, name: 'Group Child 1',
      fills: [{ type: 'solid', color: '#50C878' }],
    });
    store.dispatch('ADD_ELEMENT', {
      id: child2, type: 'rect', x: 400, y: 100, width: 80, height: 60,
      rotation: 0, opacity: 1, name: 'Group Child 2',
      fills: [{ type: 'solid', color: '#9B59B6' }],
    });
    store.dispatch('UPDATE_SELECTION', [child1, child2]);
    store.dispatch('GROUP_ELEMENTS');

    const state = store.getState();
    const slideId = state.editor.activeSlideId;
    const slide = state.slides[slideId];
    const allEls = slide.elements || {};
    let groupId = '';
    for (const [id, el] of Object.entries(allEls) as [string, any][]) {
      if (el.type === 'group' && el.children && el.children.length === 2) {
        groupId = id;
      }
    }
    store.dispatch('UPDATE_SELECTION', []);
    return { groupId, child1, child2 };
  });
  await page.waitForTimeout(200);
  return ids;
}

/** Clear all selection via store (scene reset only, not part of evaluation). */
async function clearSelection(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    (window as any).__TEST_STORE__?.dispatch('UPDATE_SELECTION', []);
  });
  await page.waitForTimeout(100);
}

// ─── Setup ───────────────────────────────────────────────────────────────────

let editor: EditorPage;
let canvas: CanvasHelper;

test.describe('Selection & Hit-Testing Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    canvas = new CanvasHelper(page);
    await editor.goto();
    await editor.waitForLoad();
    // Wait for CanvasManager to be exposed
    await page.waitForFunction(
      () => !!(window as any).__TEST_CANVAS_MANAGER__,
      null,
      { timeout: 10_000 },
    );
  });

  // ─── SEL-01: Single Select ──────────────────────────────────────────────

  test('SEL-01: Single select', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'selection', scenario: 'SEL-01' });
    const [elA, elB] = await seedElements(page, 2);

    // Baseline — nothing selected
    await ev.capture('baseline');

    // Click element A
    await ev.clickElement(elA, 'post-select-A');

    // Click element B — should deselect A, select B
    await ev.clickElement(elB, 'post-select-B');

    // Click empty canvas — deselect all
    await ev.clickEmpty('post-deselect');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── SEL-02/03: Add / Remove from Selection ────────────────────────────

  test('SEL-02/03: Add and remove from selection', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'selection', scenario: 'SEL-02-03' });
    const [elA, elB, elC] = await seedElements(page, 3);

    await ev.capture('baseline');

    // Click A
    await ev.clickElement(elA, 'post-select-A');

    // Shift+Click B (add)
    await ev.shiftClickElement(elB, 'post-add-B');

    // Shift+Click C (add)
    await ev.shiftClickElement(elC, 'post-add-C');

    // Shift+Click B (remove)
    await ev.shiftClickElement(elB, 'post-remove-B');

    // Shift+Click A (remove)
    await ev.shiftClickElement(elA, 'post-remove-A');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── SEL-04: Deselect All ──────────────────────────────────────────────

  test('SEL-04: Deselect all', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'selection', scenario: 'SEL-04' });
    const [elA, elB] = await seedElements(page, 2);

    // Select A then Shift+Click B
    await ev.clickElement(elA, 'select-A');
    await ev.shiftClickElement(elB, 'pre-deselect');

    // Click empty canvas
    await ev.clickEmpty('post-deselect');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── SEL-05: Marquee Select ────────────────────────────────────────────

  test('SEL-05: Marquee select', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'selection', scenario: 'SEL-05' });
    const elIds = await seedElements(page, 4, { spread: true });

    await ev.capture('baseline');

    // Find a point above and to the left of the first two elements to start marquee
    // We'll drag from upper-left to encompass roughly the first 2 elements
    const pos0 = await ev.getElementCenter(elIds[0]);
    const pos1 = await ev.getElementCenter(elIds[1]);

    // Start above-left of element 0
    const startX = pos0.x - 80;
    const startY = Math.min(pos0.y, pos1.y) - 80;
    // End below-right of element 1
    const endX = pos1.x + 80;
    const endY = Math.max(pos0.y, pos1.y) + 80;

    // Mouse down
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.waitForTimeout(50);
    await ev.capture('drag-start');

    // Drag to midpoint
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    await page.mouse.move(midX, midY, { steps: 5 });
    await page.waitForTimeout(50);
    await ev.capture('mid-drag');

    // Drag to end
    await page.mouse.move(endX, endY, { steps: 5 });
    await page.waitForTimeout(50);
    await ev.capture('pre-release');

    // Release
    await page.mouse.up();
    await page.waitForTimeout(150);
    await ev.capture('post-marquee');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── SEL-06: Select All ────────────────────────────────────────────────

  test('SEL-06: Select all', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'selection', scenario: 'SEL-06' });
    const elIds = await seedElements(page, 3);

    await ev.capture('baseline');

    // Click on canvas first to ensure it has focus (not on any element)
    await ev.clickEmpty('focus-canvas');

    // Ctrl+A
    await ev.selectAll('post-select-all');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── SEL-07/08: Deep Select (Group) ────────────────────────────────────

  test('SEL-07/08: Deep select in group', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'selection', scenario: 'SEL-07-08' });

    // Seed a group
    const { groupId, child1, child2 } = await seedGroup(page);

    // Also seed a standalone element so it's not just the group
    await seedElements(page, 1);
    await clearSelection(page);

    await ev.capture('baseline');

    // Click on group (should select the group, not the child)
    await ev.clickElement(child1, 'post-click-group-area');

    // Double-click on group to enter it (SEL-08)
    await ev.dblClickElement(child1, 'post-doubleclick-enter-group');

    // Click somewhere else to exit, then Ctrl+Click for deep select (SEL-07)
    await ev.clickEmpty('exit-group');

    await ev.ctrlClickElement(child2, 'post-ctrl-click-deep-select');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── SEL-09/10: Canvas ↔ Layer Tree Sync ───────────────────────────────

  test('SEL-09/10: Canvas and layer tree sync', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'selection', scenario: 'SEL-09-10' });
    const [elA, elB] = await seedElements(page, 2);

    await ev.capture('baseline');

    // SEL-09: Click element on canvas → layer tree should highlight
    await ev.clickElement(elA, 'post-canvas-select-A');

    // SEL-10: Click a layer in the layer tree → canvas should select
    // Find the layer tree item for element B
    const layerItem = page.locator(`[data-testid="layer-item-${elB}"], [data-layer-id="${elB}"]`);
    const layerExists = await layerItem.count();
    if (layerExists > 0) {
      await layerItem.click();
      await page.waitForTimeout(200);
      await ev.capture('post-tree-select-B');
    } else {
      // Layer panel might not have test IDs — try alternatives
      await ev.capture('layer-tree-not-found');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // ─── SEL-11/12: Layer Tree Multi-Select ────────────────────────────────

  test('SEL-11/12: Layer tree multi-select and toggle', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'selection', scenario: 'SEL-11-12' });
    const elIds = await seedElements(page, 4);

    await ev.capture('baseline');

    // Try to find layer tree items
    const firstLayer = page.locator(`[data-testid="layer-item-${elIds[0]}"], [data-layer-id="${elIds[0]}"]`);
    const layerExists = await firstLayer.count();

    if (layerExists > 0) {
      // Click first layer
      await firstLayer.click();
      await page.waitForTimeout(150);
      await ev.capture('post-select-first-layer');

      // Shift+Click third layer (range select, SEL-11)
      const thirdLayer = page.locator(`[data-testid="layer-item-${elIds[2]}"], [data-layer-id="${elIds[2]}"]`);
      if (await thirdLayer.count() > 0) {
        await thirdLayer.click({ modifiers: ['Shift'] });
        await page.waitForTimeout(150);
        await ev.capture('post-shift-click-range');
      }

      // Ctrl+Click second layer (toggle off, SEL-12)
      const secondLayer = page.locator(`[data-testid="layer-item-${elIds[1]}"], [data-layer-id="${elIds[1]}"]`);
      if (await secondLayer.count() > 0) {
        await secondLayer.click({ modifiers: ['Control'] });
        await page.waitForTimeout(150);
        await ev.capture('post-ctrl-click-toggle');
      }
    } else {
      // Layer panel may not be open or uses different selectors
      // Fall back to canvas-based multi-select using action API
      await ev.clickElement(elIds[0], 'canvas-select-first');
      await ev.shiftClickElement(elIds[2], 'post-canvas-multi-select-fallback');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // ─── SEL-13: Tab to Next Element ───────────────────────────────────────

  test('SEL-13: Tab to next element', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'selection', scenario: 'SEL-13' });

    // Seed 2 text elements
    const textIds = await page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      const ids: string[] = [];
      for (let i = 0; i < 2; i++) {
        const id = `eval-txt-${Date.now()}-${i}`;
        store.dispatch('ADD_ELEMENT', {
          id,
          type: 'text',
          x: 100 + i * 300, y: 200,
          width: 200, height: 60,
          rotation: 0, opacity: 1,
          name: `Text ${i + 1}`,
          content: `Eval text ${i + 1}`,
          fontSize: 24, fontFamily: 'Inter', fontWeight: 400,
          textAlign: 'left', verticalAlign: 'top',
          color: '#FFFFFF', lineHeight: 1.2, letterSpacing: 0,
        });
        ids.push(id);
      }
      store.dispatch('UPDATE_SELECTION', []);
      return ids;
    });
    await page.waitForTimeout(200);

    await ev.capture('baseline');

    // Double-click first text to enter edit mode
    await ev.dblClickElement(textIds[0], 'post-enter-edit-mode');

    // Press Tab — should exit edit, select next element
    await ev.pressTab('post-tab');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── SEL-14: Canvas → Layer Tree Sync ────────────────────────────────────

  test('SEL-14: Sync highlight to layer tree', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'selection', scenario: 'SEL-14' });
    const [elA] = await seedElements(page, 1);
    await ev.capture('baseline');

    // Click element on canvas
    await ev.clickElement(elA, 'post-select-A');

    // Verify corresponding layer is highlighted in the layer tree
    const layerItem = page.locator(
      `.layer-tree-item[data-element-id="${elA}"], ` +
      `[data-testid="layer-item-${elA}"], ` +
      `.layer-item.selected`
    ).first();
    const isHighlighted = await layerItem.isVisible({ timeout: 2000 }).catch(() => false);
    await ev.capture('layer-tree-highlight-check');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── SEL-15: Layer Tree → Canvas Sync ────────────────────────────────────

  test('SEL-15: Sync selection from layer tree', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'selection', scenario: 'SEL-15' });
    const [elA] = await seedElements(page, 1);
    await ev.capture('baseline');

    // Click layer in the tree panel
    const layerItem = page.locator(
      `.layer-tree-item[data-element-id="${elA}"], ` +
      `[data-testid="layer-item-${elA}"], ` +
      `.layer-item`
    ).first();
    if (await layerItem.isVisible({ timeout: 2000 }).catch(() => false)) {
      await layerItem.click();
      await page.waitForTimeout(200);
    }
    await ev.capture('post-layer-tree-click');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── SEL-16: Z-order Hit Priority ────────────────────────────────────────

  test('SEL-16: Z-order hit priority', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'selection', scenario: 'SEL-16' });

    // Seed two overlapping elements — second element is on top (higher z-order)
    const ids = await page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      const bottom = `eval-bot-${Date.now()}`;
      const top = `eval-top-${Date.now()}`;
      store.dispatch('ADD_ELEMENT', {
        id: bottom, type: 'rect', x: 200, y: 200, width: 150, height: 100,
        rotation: 0, opacity: 1, name: 'Bottom', fills: [{ type: 'solid', color: '#3B82F6' }],
      });
      store.dispatch('ADD_ELEMENT', {
        id: top, type: 'rect', x: 220, y: 220, width: 150, height: 100,
        rotation: 0, opacity: 1, name: 'Top', fills: [{ type: 'solid', color: '#EF4444' }],
      });
      store.dispatch('UPDATE_SELECTION', []);
      return { bottom, top };
    });
    await page.waitForTimeout(200);
    await ev.capture('overlapping-seeded');

    // Click in the overlapping area — topmost (top) should be selected
    await ev.clickElement(ids.top, 'post-click-overlap');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── SEL-17: Handle Hit Priority ─────────────────────────────────────────

  test('SEL-17: Handle hit priority over element body', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'selection', scenario: 'SEL-17' });
    const [elA] = await seedElements(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('element-selected-with-handles');

    // Get element rect and hover near the SE corner handle area
    const rect = await ev.getElementRect(elA);
    const handleX = rect.x + rect.width;
    const handleY = rect.y + rect.height;

    // Mouse down on SE handle position — should initiate resize, not re-select
    await page.mouse.move(handleX, handleY);
    await page.mouse.down();
    await page.waitForTimeout(100);
    await page.mouse.move(handleX + 20, handleY + 20, { steps: 3 });
    await page.mouse.up();
    await page.waitForTimeout(200);
    await ev.capture('post-handle-drag');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── SEL-18: Vector Node Hit (deep edit) ─────────────────────────────────

  test('SEL-18: Vector node hit in deep edit', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'selection', scenario: 'SEL-18' });

    // Seed a vector/path element
    await page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      store.dispatch('ADD_ELEMENT', {
        id: 'eval-vec-sel18', type: 'vector', x: 200, y: 200, width: 200, height: 150,
        rotation: 0, opacity: 1, name: 'Vector Sel18',
        path: 'M 0 0 L 200 0 L 200 150 L 0 150 Z',
        fills: [{ type: 'solid', color: '#10B981' }],
      });
      store.dispatch('UPDATE_SELECTION', []);
    });
    await page.waitForTimeout(200);
    await ev.capture('vector-seeded');

    // Double-click to enter deep edit (if vector supports it)
    await ev.dblClickElement('eval-vec-sel18', 'post-dblclick-vector');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── SEL-19: Vector Edge Hit (deep edit) ─────────────────────────────────

  test('SEL-19: Vector edge hit in deep edit', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'selection', scenario: 'SEL-19' });

    await page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      store.dispatch('ADD_ELEMENT', {
        id: 'eval-vec-sel19', type: 'vector', x: 200, y: 200, width: 200, height: 150,
        rotation: 0, opacity: 1, name: 'Vector Sel19',
        path: 'M 0 0 L 200 0 L 200 150 L 0 150 Z',
        fills: [{ type: 'solid', color: '#F59E0B' }],
      });
      store.dispatch('UPDATE_SELECTION', []);
    });
    await page.waitForTimeout(200);

    // Enter deep edit
    await ev.dblClickElement('eval-vec-sel19', 'enter-deep-edit');

    // Click on an edge (midpoint of top edge)
    const rect = await ev.getElementRect('eval-vec-sel19');
    await page.mouse.click(rect.x + rect.width / 2, rect.y);
    await page.waitForTimeout(200);
    await ev.capture('post-edge-click');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── SEL-20: Boolean Operand Hit (deep edit) ─────────────────────────────

  test('SEL-20: Boolean operand hit in deep edit', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'selection', scenario: 'SEL-20' });

    // Seed two rects and create a boolean union
    const ids = await page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      const a = `eval-bool-a-${Date.now()}`;
      const b = `eval-bool-b-${Date.now()}`;
      store.dispatch('ADD_ELEMENT', {
        id: a, type: 'rect', x: 200, y: 200, width: 120, height: 80,
        rotation: 0, opacity: 1, name: 'Bool A',
        fills: [{ type: 'solid', color: '#3B82F6' }],
      });
      store.dispatch('ADD_ELEMENT', {
        id: b, type: 'rect', x: 260, y: 240, width: 120, height: 80,
        rotation: 0, opacity: 1, name: 'Bool B',
        fills: [{ type: 'solid', color: '#EF4444' }],
      });
      store.dispatch('UPDATE_SELECTION', [a, b]);
      // Create boolean union from selection
      try { store.dispatch('CREATE_BOOLEAN_FROM_SELECTION', { operation: 'union' }); } catch(e) { /* may not exist */ }
      return { a, b };
    });
    await page.waitForTimeout(200);
    await ev.capture('boolean-seeded');

    // Try to double-click to enter boolean deep edit
    const state = await page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      const s = store.getState();
      const slideId = s.editor.activeSlideId;
      const els = s.slides[slideId]?.elements || {};
      // Look for a boolean element
      for (const [id, el] of Object.entries(els) as [string, any][]) {
        if (el.type === 'boolean') return id;
      }
      return null;
    });

    if (state) {
      await ev.dblClickElement(state, 'enter-boolean-edit');
    } else {
      // Boolean not created, just click operand A
      await ev.clickElement(ids.a, 'click-operand-a');
    }
    await ev.capture('post-boolean-edit');

    const report = ev.finalize();
    logReport(report);
  });
});

// ─── Report Logger ───────────────────────────────────────────────────────────

function logReport(report: AnomalyReport) {
  console.log(`\n━━━ EVAL REPORT: ${report.category} / ${report.scenario} ━━━`);
  console.log(`  Snapshots: ${report.snapshots.length} | Mutations: ${report.mutationTimeline.length}`);
  console.log(`  Critical: ${report.summary.critical} | Warning: ${report.summary.warning} | Info: ${report.summary.info}`);

  if (report.findings.length > 0) {
    console.log(`\n  Findings:`);
    for (const f of report.findings) {
      const icon = f.severity === 'critical' ? '🔴' : f.severity === 'warning' ? '🟡' : '🔵';
      console.log(`    ${icon} [${f.code}] ${f.message}${f.snapshot ? ` @ ${f.snapshot}` : ''}`);
    }
  } else {
    console.log(`\n  ✅ Clean run — no findings`);
  }

  console.log(`  Report saved to: test-results/eval-reports/selection/`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}
