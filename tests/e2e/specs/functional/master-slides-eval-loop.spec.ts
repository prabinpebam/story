/**
 * Eval Loop: Master Slides & Layouts (MST-01 → MST-09)
 */
import { expect } from '@playwright/test';
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import {
  capture, waitForCanvasManager, assertNoCriticalAnomalies,
} from '../../helpers/eval-loop';

test.describe('Eval Loop: Master Slides', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await waitForCanvasManager(page);
  });

  // ─── MST-01: Default master exists ────────────────────────────────────────
  test('MST-01: Default master preset exists in store', async ({ page }) => {
    const master = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      return s.slideMasterPresets?.['master-default'] ?? null;
    });

    expect(master).not.toBeNull();
    expect(master.id).toBe('master-default');

    const snap = await capture(page, 'master-default');
    assertNoCriticalAnomalies(snap);
  });

  // ─── MST-02: Layout masters linked to master ─────────────────────────────
  test('MST-02: Layout masters have parentMasterId', async ({ page }) => {
    const layouts = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const master = s.slideMasterPresets?.['master-default'];
      if (!master?.layoutIds) return [];
      return master.layoutIds.map((lid: string) => ({
        id: lid,
        parentMasterId: s.slideMasterPresets?.[lid]?.parentMasterId,
      }));
    });

    expect(layouts.length).toBeGreaterThan(0);
    for (const layout of layouts) {
      expect(layout.parentMasterId).toBe('master-default');
    }
  });

  // ─── MST-03: Slide has layoutId ───────────────────────────────────────────
  test('MST-03: Active slide references a layout', async ({ page }) => {
    const layoutId = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      return s.slides[s.editor.activeSlideId]?.layoutId ?? null;
    });

    expect(layoutId).not.toBeNull();
    expect(typeof layoutId).toBe('string');
  });

  // ─── MST-04: Change slide layout ─────────────────────────────────────────
  test('MST-04: Change slide layout via UPDATE_SLIDE', async ({ page }) => {
    // Get available layouts
    const { slideId, layouts } = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const sid = s.editor.activeSlideId;
      const master = s.slideMasterPresets?.['master-default'];
      return { slideId: sid, layouts: master?.layoutIds ?? [] };
    });

    if (layouts.length < 2) {
      test.skip();
      return;
    }

    const currentLayout = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      return s.slides[s.editor.activeSlideId]?.layoutId;
    });

    // Pick a different layout
    const newLayout = layouts.find((l: string) => l !== currentLayout) ?? layouts[0];

    await page.evaluate(({ sid, lid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE', { id: sid, layoutId: lid });
    }, { sid: slideId, lid: newLayout });
    await page.waitForTimeout(200);

    const updatedLayout = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      return s.slides[s.editor.activeSlideId]?.layoutId;
    });
    expect(updatedLayout).toBe(newLayout);

    const snap = await capture(page, 'layout-changed');
    assertNoCriticalAnomalies(snap);
  });

  // ─── MST-05: Update master name ───────────────────────────────────────────
  test('MST-05: Update master name via UPDATE_MASTER', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_MASTER', {
        id: 'master-default',
        name: 'Test Updated Name',
      });
    });
    await page.waitForTimeout(200);

    const name = await page.evaluate(() => {
      return (window as any).__TEST_STORE__.getState().slideMasterPresets?.['master-default']?.name;
    });
    expect(name).toBe('Test Updated Name');
  });

  // ─── Cross-cutting ────────────────────────────────────────────────────────
  test('Invariant: Master slide structure is consistent', async ({ page }) => {
    const isConsistent = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const master = s.slideMasterPresets?.['master-default'];
      if (!master) return false;
      // All layouts should reference this master
      for (const lid of master.layoutIds ?? []) {
        if (s.slideMasterPresets?.[lid]?.parentMasterId !== master.id) return false;
      }
      return true;
    });
    expect(isConsistent).toBe(true);

    const snap = await capture(page, 'master-invariant');
    assertNoCriticalAnomalies(snap);
  });
});
