/**
 * Eval Loop Seeders — Shared element/scene creation helpers
 *
 * Used by all eval spec files to set up scenes via store dispatch.
 * These are NOT part of the evaluation — they prepare the canvas
 * so the eval loop can drive real user interactions.
 */

import type { Page } from '@playwright/test';

// ─── Basic Elements ──────────────────────────────────────────────────────────

/** Seed N rect elements at spread positions. Returns their IDs. */
export async function seedRects(
  page: Page,
  count: number,
  opts?: { startX?: number; startY?: number; spacingX?: number; spacingY?: number; width?: number; height?: number },
): Promise<string[]> {
  const o = {
    startX: opts?.startX ?? 100,
    startY: opts?.startY ?? 150,
    spacingX: opts?.spacingX ?? 180,
    spacingY: opts?.spacingY ?? 0,
    width: opts?.width ?? 120,
    height: opts?.height ?? 80,
  };
  const ids: string[] = await page.evaluate(({ count, o }) => {
    const store = (window as any).__TEST_STORE__;
    if (!store) throw new Error('Store not available');
    const ids: string[] = [];
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
    for (let i = 0; i < count; i++) {
      const id = `eval-rect-${Date.now()}-${i}`;
      store.dispatch('ADD_ELEMENT', {
        id, type: 'rect',
        x: o.startX + i * o.spacingX,
        y: o.startY + i * o.spacingY,
        width: o.width, height: o.height,
        rotation: 0, opacity: 1,
        name: `Rect ${i + 1}`,
        fills: [{ type: 'solid', color: colors[i % colors.length] }],
      });
      ids.push(id);
    }
    store.dispatch('UPDATE_SELECTION', []);
    return ids;
  }, { count, o });
  await page.waitForTimeout(200);
  return ids;
}

/** Seed a single ellipse. */
export async function seedEllipse(
  page: Page,
  opts?: { x?: number; y?: number; width?: number; height?: number },
): Promise<string> {
  const id = await page.evaluate((o) => {
    const store = (window as any).__TEST_STORE__;
    const id = `eval-ellipse-${Date.now()}`;
    store.dispatch('ADD_ELEMENT', {
      id, type: 'ellipse',
      x: o?.x ?? 200, y: o?.y ?? 200,
      width: o?.width ?? 120, height: o?.height ?? 120,
      rotation: 0, opacity: 1,
      name: 'Ellipse',
      fills: [{ type: 'solid', color: '#8B5CF6' }],
    });
    store.dispatch('UPDATE_SELECTION', []);
    return id;
  }, opts);
  await page.waitForTimeout(200);
  return id;
}

/** Seed a text element. */
export async function seedText(
  page: Page,
  opts?: {
    x?: number; y?: number; width?: number; height?: number;
    content?: string; fontSize?: number;
  },
): Promise<string> {
  const id = await page.evaluate((o) => {
    const store = (window as any).__TEST_STORE__;
    const id = `eval-text-${Date.now()}`;
    store.dispatch('ADD_ELEMENT', {
      id, type: 'text',
      x: o?.x ?? 100, y: o?.y ?? 200,
      width: o?.width ?? 200, height: o?.height ?? 60,
      rotation: 0, opacity: 1,
      name: 'Text',
      content: o?.content ?? 'Eval text content',
      fontSize: o?.fontSize ?? 24,
      fontFamily: 'Inter', fontWeight: 400,
      textAlign: 'left', verticalAlign: 'top',
      color: '#FFFFFF', lineHeight: 1.2, letterSpacing: 0,
    });
    store.dispatch('UPDATE_SELECTION', []);
    return id;
  }, opts);
  await page.waitForTimeout(200);
  return id;
}

/** Seed N text elements. */
export async function seedTexts(page: Page, count: number): Promise<string[]> {
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    const id = await seedText(page, {
      x: 100 + i * 260, y: 200,
      content: `Text ${i + 1}`,
    });
    ids.push(id);
  }
  return ids;
}

/** Seed a line element. */
export async function seedLine(
  page: Page,
  opts?: { x?: number; y?: number; width?: number; height?: number },
): Promise<string> {
  const id = await page.evaluate((o) => {
    const store = (window as any).__TEST_STORE__;
    const id = `eval-line-${Date.now()}`;
    store.dispatch('ADD_ELEMENT', {
      id, type: 'line',
      x: o?.x ?? 100, y: o?.y ?? 300,
      width: o?.width ?? 200, height: o?.height ?? 0,
      rotation: 0, opacity: 1,
      name: 'Line',
      strokes: [{ type: 'solid', color: '#FFFFFF', weight: 2 }],
    });
    store.dispatch('UPDATE_SELECTION', []);
    return id;
  }, opts);
  await page.waitForTimeout(200);
  return id;
}

// ─── Composite Elements ──────────────────────────────────────────────────────

/** Seed a group with 2 child rects. */
export async function seedGroup(page: Page): Promise<{
  groupId: string; child1: string; child2: string;
}> {
  const result = await page.evaluate(() => {
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
      if (el.type === 'group' && el.children?.length === 2) groupId = id;
    }
    store.dispatch('UPDATE_SELECTION', []);
    return { groupId, child1, child2 };
  });
  await page.waitForTimeout(200);
  return result;
}

// ─── Scene Helpers ───────────────────────────────────────────────────────────

/** Clear selection. */
export async function clearSelection(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as any).__TEST_STORE__?.dispatch('UPDATE_SELECTION', []);
  });
  await page.waitForTimeout(100);
}

/** Select elements by IDs. */
export async function selectElements(page: Page, ids: string[]): Promise<void> {
  await page.evaluate((ids) => {
    (window as any).__TEST_STORE__?.dispatch('UPDATE_SELECTION', ids);
  }, ids);
  await page.waitForTimeout(100);
}

/** Set active tool via store. */
export async function setTool(page: Page, tool: string): Promise<void> {
  await page.evaluate((tool) => {
    (window as any).__TEST_STORE__?.dispatch('SET_ACTIVE_TOOL', tool);
  }, tool);
  await page.waitForTimeout(100);
}

/** Get store state. */
export async function getState(page: Page): Promise<any> {
  return page.evaluate(() => {
    const store = (window as any).__TEST_STORE__;
    return store ? store.getState() : null;
  });
}

/** Add a slide and return its ID. */
export async function addSlide(page: Page): Promise<string> {
  const id = await page.evaluate(() => {
    const store = (window as any).__TEST_STORE__;
    store.dispatch('ADD_SLIDE');
    const state = store.getState();
    return state.slideOrder[state.slideOrder.length - 1];
  });
  await page.waitForTimeout(200);
  return id;
}

// ─── Common report logger ────────────────────────────────────────────────────

import type { AnomalyReport } from './eval-engine';

export function logReport(report: AnomalyReport): void {
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
  console.log(`  Output: ${report.category}/${report.scenario}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}
