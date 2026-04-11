/**
 * 06 — Element Rotation — Agnostic Eval Loop
 *
 * Evaluates ROT-01 through ROT-08: rotation via handle drag,
 * constrained 15° snapping, and rotation via keyboard/dispatch.
 *
 * Scene: 1 rect. Critical state: element rotation, interaction state,
 * mutation timeline for rotation deltas.
 *
 * Run:  npx playwright test rotation-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

test.describe('Element Rotation Eval Loop', () => {
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

  // ROT-01: Free rotation via handle drag
  test('ROT-01: Rotate element via handle', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'rotation', scenario: 'ROT-01' });
    const [elA] = await seedRects(page, 1, { width: 150, height: 100 });

    await ev.clickElement(elA, 'selected');
    await ev.capture('pre-rotate');

    // Rotation handle is above the top-center of the element
    const rect = await ev.getElementRect(elA);
    const handleX = rect.x + rect.width / 2;
    const handleY = rect.y - 20; // rotation handle sits ~20px above

    await page.mouse.move(handleX, handleY);
    await page.mouse.down();
    // Drag in an arc to rotate ~45°
    await page.mouse.move(handleX + 60, handleY + 30, { steps: 8 });
    await page.waitForTimeout(50);
    await ev.capture('mid-rotate');
    await page.mouse.move(handleX + 80, handleY + 60, { steps: 6 });
    await page.mouse.up();
    await page.waitForTimeout(200);
    await ev.capture('post-rotate');

    const report = ev.finalize();
    logReport(report);
  });

  // ROT-02: Shift+drag snaps to 15° increments
  test('ROT-02: Constrained rotation (15° snap)', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'rotation', scenario: 'ROT-02' });
    const [elA] = await seedRects(page, 1, { width: 150, height: 100 });

    await ev.clickElement(elA, 'selected');
    await ev.capture('pre-rotate');

    const rect = await ev.getElementRect(elA);
    const handleX = rect.x + rect.width / 2;
    const handleY = rect.y - 20;

    await page.mouse.move(handleX, handleY);
    await page.keyboard.down('Shift');
    await page.mouse.down();
    await page.mouse.move(handleX + 70, handleY + 50, { steps: 10 });
    await page.mouse.up();
    await page.keyboard.up('Shift');
    await page.waitForTimeout(200);
    await ev.capture('post-constrained-rotate');

    const report = ev.finalize();
    logReport(report);
  });

  // ROT-03/04: Rotation via store dispatch (simulating PI actions)
  test('ROT-03/04: Rotation via dispatch', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'rotation', scenario: 'ROT-03-04' });
    const [elA] = await seedRects(page, 1, { width: 150, height: 100 });

    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');

    // Rotate -90° via dispatch
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, rotation: -90 });
    await page.waitForTimeout(200);
    await ev.capture('post-rotate-neg90');

    // Set rotation to 45°
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, rotation: 45 });
    await page.waitForTimeout(200);
    await ev.capture('post-rotate-45');

    // Reset to 0
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, rotation: 0 });
    await page.waitForTimeout(200);
    await ev.capture('post-reset');

    const report = ev.finalize();
    logReport(report);
  });

  // ROT-05/06: Rotation handle visibility based on element size
  test('ROT-05/06: Rotation handle visibility by size', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'rotation', scenario: 'ROT-05-06' });

    // ROT-06: Normal-sized element — handle should be visible
    const [elA] = await seedRects(page, 1, { width: 150, height: 100 });
    await ev.clickElement(elA, 'select-large');
    await ev.capture('large-element-selected');

    // ROT-05: Create tiny element — handle should be hidden at < 50px
    await ev.dispatch('ADD_ELEMENT', {
      id: `eval-tiny-${Date.now()}`,
      type: 'rect', x: 500, y: 200, width: 30, height: 20,
      rotation: 0, opacity: 1, name: 'Tiny Rect',
      fills: [{ type: 'solid', color: '#EF4444' }],
    });
    await page.waitForTimeout(200);
    const tinyId = await page.evaluate(() => {
      const state = (window as any).__TEST_STORE__.getState();
      const slideId = state.editor.activeSlideId;
      const elements = state.slides[slideId].elements;
      return Object.keys(elements).find(id => elements[id].name === 'Tiny Rect') || '';
    });
    await ev.clickElement(tinyId, 'select-tiny');
    await ev.capture('tiny-element-selected');

    const report = ev.finalize();
    logReport(report);
  });

  // ROT-07/08: Rotated resize cursor changes based on element angle
  test('ROT-07/08: Rotation-aware resize cursor', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'rotation', scenario: 'ROT-07-08' });
    const [elA] = await seedRects(page, 1, { width: 150, height: 100 });

    // Set rotation to 45° via dispatch
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, rotation: 45 });
    await page.waitForTimeout(200);

    await ev.clickElement(elA, 'select-rotated');
    await ev.capture('rotated-45');

    // Hover over the east handle area
    const rect = await ev.getElementRect(elA);
    const handleX = rect.x + rect.width;
    const handleY = rect.y + rect.height / 2;
    await page.mouse.move(handleX, handleY);
    await page.waitForTimeout(200);
    await ev.capture('hover-handle-rotated');

    // Set rotation to 90° and check again
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, rotation: 90 });
    await page.waitForTimeout(200);
    await ev.capture('rotated-90');

    const report = ev.finalize();
    logReport(report);
  });
});
