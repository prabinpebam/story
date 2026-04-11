/**
 * 31 — Cursor Behavior — Agnostic Eval Loop
 * Evaluates CUR-01..23. Triggers via mouse move + keyboard.
 */
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, logReport } from '../../helpers/eval-seeders';
let editor: EditorPage;
test.describe('Cursor Behavior Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page); await editor.goto(); await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // CUR-01..08: Cursor on canvas regions
  test('CUR-01..08: Canvas region cursors', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'cursor', scenario: 'CUR-01-08' });
    const [elA] = await seedRects(page, 1);
    await ev.capture('baseline');

    // Hover over element
    const pos = await ev.getElementCenter(elA);
    await page.mouse.move(pos.x, pos.y);
    await page.waitForTimeout(200);
    await ev.capture('hover-element');

    // Hover over empty canvas
    await page.mouse.move(50, 50);
    await page.waitForTimeout(200);
    await ev.capture('hover-empty');

    logReport(ev.finalize());
  });

  // CUR-09..15: Cursor on handles
  test('CUR-09..15: Handle hover cursors', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'cursor', scenario: 'CUR-09-15' });
    const [elA] = await seedRects(page, 1, { width: 150, height: 100 });
    await ev.clickElement(elA, 'selected');
    await ev.capture('selected');

    // Hover corners
    const rect = await ev.getElementRect(elA);
    await page.mouse.move(rect.x, rect.y); // NW
    await page.waitForTimeout(150); await ev.capture('hover-nw');
    await page.mouse.move(rect.x + rect.width, rect.y + rect.height); // SE
    await page.waitForTimeout(150); await ev.capture('hover-se');

    logReport(ev.finalize());
  });

  // CUR-16..23: Tool-specific cursors
  test('CUR-16..23: Tool cursors', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'cursor', scenario: 'CUR-16-23' });
    await ev.capture('select-tool');

    // Switch tools and capture
    await ev.pressKey('r', 'rect-tool');
    await ev.pressKey('t', 'text-tool');
    await ev.pressKey('h', 'hand-tool');
    await ev.pressKey('v', 'back-to-select');

    logReport(ev.finalize());
  });
});
