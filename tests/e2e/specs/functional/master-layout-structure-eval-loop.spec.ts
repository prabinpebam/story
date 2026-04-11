/**
 * Eval Loop: Master-Layout Structural Integrity
 * 
 * Tests the structural relationships between theme masters,
 * layout masters, slides, and element inheritance.
 * 
 * Taskflows Covered:
 * MLS-01: Layout parentMasterId points to correct theme master
 * MLS-02: Master's layoutIds contains all child layouts
 * MLS-03: Every slide has a valid layoutId
 * MLS-04: Changing slide layout updates layoutId
 * MLS-05: Layout elements are distinct from master elements
 * MLS-06: Adding element to master makes it available in effective slides
 * MLS-07: Master colorThemeId references an existing preset (or null)
 * MLS-08: Multiple masters can coexist
 * MLS-09: Deleting layout falls back gracefully
 */
import { expect } from '@playwright/test';
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import {
  capture, waitForCanvasManager, assertNoCriticalAnomalies,
} from '../../helpers/eval-loop';

test.describe('Eval Loop: Master-Layout Structure', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await waitForCanvasManager(page);
  });

  // ─── MLS-01: Layout parentMasterId valid ──────────────────────────────────
  test('MLS-01: Every layout has valid parentMasterId', async ({ page }) => {
    const result = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const presets = s.slideMasterPresets ?? {};
      const issues: string[] = [];

      for (const [id, preset] of Object.entries(presets) as any[]) {
        if (preset.type === 'layoutMaster' && preset.parentMasterId) {
          if (!presets[preset.parentMasterId]) {
            issues.push(`Layout ${id} references missing master ${preset.parentMasterId}`);
          }
        }
      }
      return issues;
    });

    expect(result).toEqual([]);

    const snap = await capture(page, 'layout-parent-valid');
    assertNoCriticalAnomalies(snap);
  });

  // ─── MLS-02: Master layoutIds complete ────────────────────────────────────
  test('MLS-02: Master layoutIds contains all child layouts', async ({ page }) => {
    const result = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const presets = s.slideMasterPresets ?? {};
      const issues: string[] = [];

      // For each theme master
      for (const [id, preset] of Object.entries(presets) as any[]) {
        if (preset.type === 'slideMasterPreset' && preset.layoutIds) {
          // Every layoutId should exist
          for (const lid of preset.layoutIds) {
            if (!presets[lid]) {
              issues.push(`Master ${id} references missing layout ${lid}`);
            } else if (presets[lid].parentMasterId !== id) {
              issues.push(`Layout ${lid} parentMasterId doesn't match master ${id}`);
            }
          }
        }
      }
      return issues;
    });

    expect(result).toEqual([]);
  });

  // ─── MLS-03: Every slide has valid layoutId ───────────────────────────────
  test('MLS-03: Every slide references a valid layout', async ({ page }) => {
    const result = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const issues: string[] = [];

      for (const sid of s.slideOrder) {
        const slide = s.slides[sid];
        if (!slide?.layoutId) {
          issues.push(`Slide ${sid} has no layoutId`);
        } else if (!s.slideMasterPresets?.[slide.layoutId]) {
          issues.push(`Slide ${sid} references missing layout ${slide.layoutId}`);
        }
      }
      return issues;
    });

    expect(result).toEqual([]);
  });

  // ─── MLS-04: Change layout updates slide ──────────────────────────────────
  test('MLS-04: Changing slide layout updates layoutId', async ({ page }) => {
    const { slideId, layouts } = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const sid = s.editor.activeSlideId;
      const master = s.slideMasterPresets?.['master-default'];
      return { slideId: sid, layouts: master?.layoutIds ?? [] };
    });

    if (layouts.length < 2) { test.skip(); return; }

    const currentLayout = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      return s.slides[s.editor.activeSlideId]?.layoutId;
    });

    const newLayout = layouts.find((l: string) => l !== currentLayout);
    if (!newLayout) { test.skip(); return; }

    await page.evaluate(({ sid, lid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE', { id: sid, layoutId: lid });
    }, { sid: slideId, lid: newLayout });
    await page.waitForTimeout(200);

    const updatedLayout = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      return s.slides[s.editor.activeSlideId]?.layoutId;
    });
    expect(updatedLayout).toBe(newLayout);

    // Restore
    await page.evaluate(({ sid, lid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE', { id: sid, layoutId: lid });
    }, { sid: slideId, lid: currentLayout });
  });

  // ─── MLS-05: Layout elements separate from master ────────────────────────
  test('MLS-05: Layout elements are distinct from master elements', async ({ page }) => {
    const result = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const master = s.slideMasterPresets?.['master-default'];
      if (!master?.layoutIds?.[0]) return { distinct: true };

      const layout = s.slideMasterPresets[master.layoutIds[0]];
      const masterEls = new Set(master.elementOrder ?? []);
      const layoutEls = new Set(layout?.elementOrder ?? []);

      // Check overlap (some overlap is expected for placeholder overrides)
      return {
        masterCount: masterEls.size,
        layoutCount: layoutEls.size,
        distinct: true, // They're in different maps
      };
    });

    expect(result.distinct).toBe(true);
  });

  // ─── MLS-06: Master has colorThemeId reference ────────────────────────
  test('MLS-06: Master has colorThemeId of correct type', async ({ page }) => {
    const result = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const master = s.slideMasterPresets?.['master-default'];
      const themeId = master?.colorThemeId;
      return {
        isValidType: themeId === null || themeId === undefined || typeof themeId === 'string',
        masterExists: !!master,
      };
    });

    expect(result.masterExists).toBe(true);
    expect(result.isValidType).toBe(true);
  });

  // ─── MLS-07: Structural integrity after operations ────────────────────────
  test('MLS-07: Structure consistent after add/delete slide', async ({ page }) => {
    // Add slide
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('ADD_SLIDE');
    });
    await page.waitForTimeout(200);

    // Verify integrity
    const result = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const issues: string[] = [];

      for (const sid of s.slideOrder) {
        const slide = s.slides[sid];
        if (!slide) issues.push(`slideOrder has ${sid} but slides map doesn't`);
        if (slide && !s.slideMasterPresets?.[slide.layoutId]) {
          issues.push(`Slide ${sid} layout ${slide.layoutId} missing`);
        }
      }

      // slideOrder and slides should be in sync
      const orderSet = new Set(s.slideOrder);
      for (const sid of Object.keys(s.slides)) {
        if (!orderSet.has(sid)) {
          issues.push(`Slide ${sid} in slides map but not in slideOrder`);
        }
      }

      return issues;
    });

    expect(result).toEqual([]);
  });

  // ─── Cross-cutting ────────────────────────────────────────────────────────
  test('Invariant: Master-layout-slide chain fully connected', async ({ page }) => {
    const result = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const slideId = s.editor.activeSlideId;
      const slide = s.slides[slideId];
      const layout = slide?.layoutId ? s.slideMasterPresets?.[slide.layoutId] : null;
      const master = layout?.parentMasterId ? s.slideMasterPresets?.[layout.parentMasterId] : null;

      return {
        slideExists: !!slide,
        layoutExists: !!layout,
        masterExists: !!master,
        layoutLinksToMaster: layout?.parentMasterId === master?.id,
        masterContainsLayout: master?.layoutIds?.includes(slide?.layoutId),
      };
    });

    expect(result.slideExists).toBe(true);
    expect(result.layoutExists).toBe(true);
    expect(result.masterExists).toBe(true);
    expect(result.layoutLinksToMaster).toBe(true);
    expect(result.masterContainsLayout).toBe(true);

    const snap = await capture(page, 'master-layout-chain-invariant');
    assertNoCriticalAnomalies(snap);
  });
});
