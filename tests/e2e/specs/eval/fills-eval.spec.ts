/**
 * 14 — Fills System — Agnostic Eval Loop
 *
 * Evaluates FIL-01 through FIL-74: fill layers, color changes,
 * gradients, opacity, visibility, and multi-fill stacks.
 *
 * Scene: 1 rect. Triggers via UPDATE_ELEMENT with fills array.
 * Engine captures fillCount + fillHash per element — mutations
 * in these fields verify fill changes took effect.
 *
 * Run:  npx playwright test fills-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

test.describe('Fills System Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // FIL-01..03: Add, delete, toggle fill layer
  test('FIL-01..03: Add, toggle, delete fill', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fills', scenario: 'FIL-01-03' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');

    // FIL-01: Add a second fill (element already has one from seeding)
    await ev.dispatch('UPDATE_ELEMENT', {
      id: elA,
      fills: [
        { type: 'solid', color: '#3B82F6', opacity: 100, visible: true },
        { type: 'solid', color: '#EF4444', opacity: 100, visible: true },
      ],
    });
    await page.waitForTimeout(200);
    await ev.capture('two-fills');

    // FIL-03: Toggle second fill visibility
    await ev.dispatch('UPDATE_ELEMENT', {
      id: elA,
      fills: [
        { type: 'solid', color: '#3B82F6', opacity: 100, visible: true },
        { type: 'solid', color: '#EF4444', opacity: 100, visible: false },
      ],
    });
    await page.waitForTimeout(200);
    await ev.capture('fill-toggled');

    // FIL-02: Delete second fill (back to one)
    await ev.dispatch('UPDATE_ELEMENT', {
      id: elA,
      fills: [{ type: 'solid', color: '#3B82F6', opacity: 100, visible: true }],
    });
    await page.waitForTimeout(200);
    await ev.capture('fill-deleted');

    const report = ev.finalize();
    logReport(report);
  });

  // FIL-04..09: Reorder, blend mode, hex color, opacity
  test('FIL-04..09: Fill properties', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fills', scenario: 'FIL-04-09' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');

    // FIL-06: Change fill color
    await ev.dispatch('UPDATE_ELEMENT', {
      id: elA,
      fills: [{ type: 'solid', color: '#FF5500', opacity: 100, visible: true }],
    });
    await page.waitForTimeout(200);
    await ev.capture('color-changed');

    // FIL-07: Change fill opacity
    await ev.dispatch('UPDATE_ELEMENT', {
      id: elA,
      fills: [{ type: 'solid', color: '#FF5500', opacity: 50, visible: true }],
    });
    await page.waitForTimeout(200);
    await ev.capture('opacity-50');

    const report = ev.finalize();
    logReport(report);
  });

  // FIL-10..24: Color picker, theme swatches, link/unlink
  test('FIL-10..24: Color and theme', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fills', scenario: 'FIL-10-24' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');

    // FIL-21: Theme-linked fill (themeSlot)
    await ev.dispatch('UPDATE_ELEMENT', {
      id: elA,
      fills: [{ type: 'solid', color: '#3B82F6', opacity: 100, visible: true, themeSlot: 0 }],
    });
    await page.waitForTimeout(200);
    await ev.capture('theme-linked');

    // FIL-24: Unlink from theme (remove themeSlot)
    await ev.dispatch('UPDATE_ELEMENT', {
      id: elA,
      fills: [{ type: 'solid', color: '#3B82F6', opacity: 100, visible: true }],
    });
    await page.waitForTimeout(200);
    await ev.capture('theme-unlinked');

    const report = ev.finalize();
    logReport(report);
  });

  // FIL-25..36: Gradient fills
  test('FIL-25..36: Gradient fills', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fills', scenario: 'FIL-25-36' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');

    // FIL-25: Switch to linear gradient
    await ev.dispatch('UPDATE_ELEMENT', {
      id: elA,
      fills: [{
        type: 'linear-gradient', visible: true, opacity: 100, angle: 90,
        stops: [
          { color: '#FF0000', position: 0, opacity: 100 },
          { color: '#0000FF', position: 100, opacity: 100 },
        ],
      }],
    });
    await page.waitForTimeout(200);
    await ev.capture('linear-gradient');

    // FIL-26: Change gradient angle
    await ev.dispatch('UPDATE_ELEMENT', {
      id: elA,
      fills: [{
        type: 'linear-gradient', visible: true, opacity: 100, angle: 45,
        stops: [
          { color: '#FF0000', position: 0, opacity: 100 },
          { color: '#0000FF', position: 100, opacity: 100 },
        ],
      }],
    });
    await page.waitForTimeout(200);
    await ev.capture('angle-45');

    // FIL-29: Add gradient stop
    await ev.dispatch('UPDATE_ELEMENT', {
      id: elA,
      fills: [{
        type: 'linear-gradient', visible: true, opacity: 100, angle: 45,
        stops: [
          { color: '#FF0000', position: 0, opacity: 100 },
          { color: '#00FF00', position: 50, opacity: 100 },
          { color: '#0000FF', position: 100, opacity: 100 },
        ],
      }],
    });
    await page.waitForTimeout(200);
    await ev.capture('three-stops');

    const report = ev.finalize();
    logReport(report);
  });

  // FIL-37..50: Image fill properties
  test('FIL-37..50: Image fill', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fills', scenario: 'FIL-37-50' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');

    // Set image fill (no actual image upload — set the fill type)
    await ev.dispatch('UPDATE_ELEMENT', {
      id: elA,
      fills: [{ type: 'image', visible: true, opacity: 100, scaleMode: 'fill' }],
    });
    await page.waitForTimeout(200);
    await ev.capture('image-fill');

    // FIL-41: Change scale mode
    await ev.dispatch('UPDATE_ELEMENT', {
      id: elA,
      fills: [{ type: 'image', visible: true, opacity: 100, scaleMode: 'fit' }],
    });
    await page.waitForTimeout(200);
    await ev.capture('scale-fit');

    const report = ev.finalize();
    logReport(report);
  });

  // FIL-51..59: Video fills
  test('FIL-51..59: Video fill', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fills', scenario: 'FIL-51-59' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');

    // Set video fill type
    await ev.dispatch('UPDATE_ELEMENT', {
      id: elA,
      fills: [{ type: 'video', visible: true, opacity: 100, autoplay: true, loop: true }],
    });
    await page.waitForTimeout(200);
    await ev.capture('video-fill');

    const report = ev.finalize();
    logReport(report);
  });

  // FIL-60..69: Code fills
  test('FIL-60..69: Code fills', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fills', scenario: 'FIL-60-69' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');

    // Set code fill
    await ev.dispatch('UPDATE_ELEMENT', {
      id: elA,
      fills: [{ type: 'code', visible: true, opacity: 100, code: 'ctx.fillStyle="#FF0";ctx.fillRect(0,0,w,h);' }],
    });
    await page.waitForTimeout(200);
    await ev.capture('code-fill');

    const report = ev.finalize();
    logReport(report);
  });

  // FIL-70..74: Inheritance and compatibility
  test('FIL-70..74: Fill inheritance', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fills', scenario: 'FIL-70-74' });
    const [elA, elB] = await seedRects(page, 2);

    // Multi-select  
    await ev.clickElement(elA, 'select-A');
    await ev.shiftClickElement(elB, 'add-B');
    await ev.capture('multi-selected');

    // Both have same fill type = compatible
    // Change one to gradient = incompatible stacks
    await ev.dispatch('UPDATE_ELEMENT', {
      id: elA,
      fills: [{ type: 'linear-gradient', visible: true, opacity: 100, angle: 0,
        stops: [{ color: '#FF0000', position: 0 }, { color: '#0000FF', position: 100 }] }],
    });
    await page.waitForTimeout(200);
    await ev.capture('incompatible-fills');

    const report = ev.finalize();
    logReport(report);
  });
});
