/**
 * 06 — Element Rotation — Agnostic Eval Loop
 *
 * Evaluates ROT-01 through ROT-08: freeform rotation, snap to 15°,
 * rotation via PI, handle visibility, and rotation-aware cursors.
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
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // ROT-01: Rotate element via rotation handle
  test('ROT-01: Rotate element via handle', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'rotation', scenario: 'ROT-01' });
    const [elA] = await seedRects(page, 1, { width: 200, height: 150 });
    await ev.clickElement(elA, 'selected');

    // Rotation handle is canvas-drawn, positioned above top-center of element
    const rect = await ev.getElementRect(elA);
    const handleX = rect.x + rect.width / 2;
    const handleY = rect.y - 20; // ~20px above element top
    await page.mouse.move(handleX, handleY);
    await page.mouse.down();
    // Drag in an arc to rotate
    await page.mouse.move(handleX + 60, handleY + 30, { steps: 5 });
    await page.mouse.move(handleX + 80, handleY + 80, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(200);
    await ev.capture('post-rotate');

    const report = ev.finalize();
    logReport(report);
  });

  // ROT-02: Snap to 15° increments (Shift+drag)
  test('ROT-02: Snap rotation to 15° increments', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'rotation', scenario: 'ROT-02' });
    const [elA] = await seedRects(page, 1, { width: 200, height: 150 });
    await ev.clickElement(elA, 'selected');

    const rect = await ev.getElementRect(elA);
    const handleX = rect.x + rect.width / 2;
    const handleY = rect.y - 20;
    await page.keyboard.down('Shift');
    await page.mouse.move(handleX, handleY);
    await page.mouse.down();
    await page.mouse.move(handleX + 80, handleY + 80, { steps: 8 });
    await page.mouse.up();
    await page.keyboard.up('Shift');
    await page.waitForTimeout(200);
    await ev.capture('post-snap-rotate');

    const report = ev.finalize();
    logReport(report);
  });

  // ROT-03: Rotate -90° via Property Inspector button
  test('ROT-03: Rotate -90° via PI', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'rotation', scenario: 'ROT-03' });
    const [elA] = await seedRects(page, 1, { width: 200, height: 150 });
    await ev.clickElement(elA, 'selected');

    // Click rotate -90° button in PI
    const rotateBtn = page.locator('[data-testid="rotate-ccw-btn"], [data-testid="rotate-minus-90"]').first();
    if (await rotateBtn.isVisible()) {
      await rotateBtn.click();
      await page.waitForTimeout(200);
    }
    await ev.capture('post-rotate-90');

    const report = ev.finalize();
    logReport(report);
  });

  // ROT-04: Set rotation via PI input
  test('ROT-04: Set rotation via PI input', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'rotation', scenario: 'ROT-04' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    // Find rotation input in PI
    const rotInput = page.locator('[data-testid="rotation-input"] input, [data-testid="element-rotation"] input').first();
    if (await rotInput.isVisible()) {
      await rotInput.fill('45');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
    }
    await ev.capture('post-set-rotation-45');

    const report = ev.finalize();
    logReport(report);
  });
});
