/**
 * Eval Loop: Cursor Behavior (CUR-01 → CUR-06)
 */
import { expect } from '@playwright/test';
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import {
  capture, waitForCanvasManager, assertNoCriticalAnomalies,
} from '../../helpers/eval-loop';

test.describe('Eval Loop: Cursor Behavior', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await waitForCanvasManager(page);
  });

  function getBodyClasses(page: import('@playwright/test').Page) {
    return page.evaluate(() => document.body.className);
  }

  // ─── CUR-01: Select tool cursor ──────────────────────────────────────────
  test('CUR-01: Select tool sets cursor-select class', async ({ page }) => {
    await page.keyboard.press('v');
    await page.waitForTimeout(200);

    const classes = await getBodyClasses(page);
    expect(classes).toContain('cursor-select');

    const snap = await capture(page, 'cursor-select');
    assertNoCriticalAnomalies(snap);
  });

  // ─── CUR-02: Hand tool cursor ─────────────────────────────────────────────
  test('CUR-02: Hand tool sets cursor-hand class', async ({ page }) => {
    await page.keyboard.press('h');
    await page.waitForTimeout(200);

    const classes = await getBodyClasses(page);
    expect(classes).toContain('cursor-hand');
  });

  // ─── CUR-03: Shape tool cursor ────────────────────────────────────────────
  test('CUR-03: Shape tool sets cursor-shape class', async ({ page }) => {
    await page.keyboard.press('r');
    await page.waitForTimeout(200);

    const classes = await getBodyClasses(page);
    expect(classes).toContain('cursor-shape');
  });

  // ─── CUR-04: Text tool cursor ─────────────────────────────────────────────
  test('CUR-04: Text tool sets cursor-text class', async ({ page }) => {
    await page.keyboard.press('t');
    await page.waitForTimeout(200);

    const classes = await getBodyClasses(page);
    expect(classes).toContain('cursor-text');
  });

  // ─── CUR-05: Cursor changes on tool switch ───────────────────────────────
  test('CUR-05: Cursor class updates on tool switch', async ({ page }) => {
    await page.keyboard.press('r');
    await page.waitForTimeout(200);
    let classes = await getBodyClasses(page);
    expect(classes).toContain('cursor-shape');

    await page.keyboard.press('v');
    await page.waitForTimeout(200);
    classes = await getBodyClasses(page);
    expect(classes).toContain('cursor-select');
    expect(classes).not.toContain('cursor-shape');
  });

  // ─── Cross-cutting ────────────────────────────────────────────────────────
  test('Invariant: Cursor state consistent with active tool', async ({ page }) => {
    const tools = ['v', 'r', 't'];
    const expectedClasses = ['cursor-select', 'cursor-shape', 'cursor-text'];

    for (let i = 0; i < tools.length; i++) {
      await page.keyboard.press(tools[i]);
      await page.waitForTimeout(200);
      const classes = await getBodyClasses(page);
      expect(classes).toContain(expectedClasses[i]);
    }

    const snap = await capture(page, 'cursor-invariant');
    assertNoCriticalAnomalies(snap);
  });
});
