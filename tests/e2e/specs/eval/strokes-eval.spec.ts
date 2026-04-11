/**
 * 15 — Strokes System — Agnostic Eval Loop
 *
 * Evaluates STK-01 through STK-28: stroke stack management, stroke properties,
 * dash patterns, joins, and multi-selection stroke behavior.
 *
 * Run:  npx playwright test strokes-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

test.describe('Strokes System Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // STK-01: Add stroke layer
  test('STK-01: Add stroke layer', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'strokes', scenario: 'STK-01' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    const addBtn = page.locator('[data-testid="add-stroke"], [data-testid="stroke-add-btn"]').first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(200);
      await ev.capture('post-add-stroke');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // STK-06: Edit stroke hex
  test('STK-06: Edit stroke hex color', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'strokes', scenario: 'STK-06' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    // Add stroke first
    const addBtn = page.locator('[data-testid="add-stroke"], [data-testid="stroke-add-btn"]').first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(200);
    }

    const hexInput = page.locator('[data-testid="stroke-hex-input"] input, .stroke-layer .hex-input input').first();
    if (await hexInput.isVisible()) {
      await hexInput.fill('00FF00');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      await ev.capture('post-stroke-hex');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // STK-14: Set stroke weight
  test('STK-14: Set stroke weight', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'strokes', scenario: 'STK-14' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    const addBtn = page.locator('[data-testid="add-stroke"], [data-testid="stroke-add-btn"]').first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(200);
    }

    const weightInput = page.locator('[data-testid="stroke-weight-input"] input, .stroke-layer .weight-input input').first();
    if (await weightInput.isVisible()) {
      await weightInput.fill('4');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      await ev.capture('post-stroke-weight-4');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // STK-15: Set stroke position (inside/center/outside)
  test('STK-15: Set stroke position', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'strokes', scenario: 'STK-15' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    const addBtn = page.locator('[data-testid="add-stroke"], [data-testid="stroke-add-btn"]').first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(200);
    }

    const posSelect = page.locator('[data-testid="stroke-position-select"], .stroke-layer select').first();
    if (await posSelect.isVisible()) {
      await posSelect.selectOption('inside');
      await page.waitForTimeout(200);
      await ev.capture('post-stroke-position-inside');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // STK-02: Delete stroke layer
  test('STK-02: Delete stroke layer', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'strokes', scenario: 'STK-02' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    const addBtn = page.locator('[data-testid="add-stroke"], [data-testid="stroke-add-btn"]').first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(200);
      await ev.capture('stroke-added');
    }

    const delBtn = page.locator('[data-testid="stroke-delete-btn"], .stroke-layer .delete-btn').first();
    if (await delBtn.isVisible()) {
      await delBtn.click();
      await page.waitForTimeout(200);
      await ev.capture('post-delete-stroke');
    }

    const report = ev.finalize();
    logReport(report);
  });
});
