/**
 * 29 — Keyboard Shortcuts — Agnostic Eval Loop
 * Evaluates KEY-01..52. Triggers via keyboard.
 */
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, seedText, logReport } from '../../helpers/eval-seeders';
let editor: EditorPage;
test.describe('Keyboard Shortcuts Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page); await editor.goto(); await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // KEY-01..10: Tool shortcuts
  test('KEY-01..10: Tool activation shortcuts', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'shortcuts', scenario: 'KEY-01-10' });
    await ev.capture('baseline');
    for (const key of ['v', 'r', 'o', 'l', 't', 'h']) {
      await ev.pressKey(key, `tool-${key}`);
    }
    await ev.pressKey('v', 'back-to-select');
    logReport(ev.finalize());
  });

  // KEY-11..20: Element operations
  test('KEY-11..20: Element operation shortcuts', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'shortcuts', scenario: 'KEY-11-20' });
    const [elA, elB] = await seedRects(page, 2);
    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');
    await ev.pressKey('Control+d', 'duplicate');
    await ev.pressKey('Control+z', 'undo');
    await ev.pressKey('Control+c', 'copy');
    await ev.pressKey('Control+v', 'paste');
    await ev.pressKey('Delete', 'delete');
    await ev.pressKey('Control+z', 'undo-delete');
    logReport(ev.finalize());
  });

  // KEY-21..30: Nudge and arrangement
  test('KEY-21..30: Nudge and arrange shortcuts', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'shortcuts', scenario: 'KEY-21-30' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');
    await ev.pressKey('ArrowRight', 'nudge-r');
    await ev.pressKey('Shift+ArrowRight', 'nudge-r-10');
    await ev.pressKey('Control+]', 'bring-forward');
    await ev.pressKey('Control+[', 'send-backward');
    logReport(ev.finalize());
  });

  // KEY-31..40: Zoom and viewport
  test('KEY-31..40: Viewport shortcuts', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'shortcuts', scenario: 'KEY-31-40' });
    await ev.capture('baseline');
    await ev.pressKey('Control+=', 'zoom-in');
    await ev.pressKey('Control+-', 'zoom-out');
    await ev.pressKey('Control+1', 'zoom-100');
    await ev.pressKey('Shift+1', 'fit-view');
    logReport(ev.finalize());
  });

  // KEY-41..52: Selection and misc
  test('KEY-41..52: Selection and misc shortcuts', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'shortcuts', scenario: 'KEY-41-52' });
    const [elA, elB] = await seedRects(page, 2);
    await ev.capture('baseline');
    await ev.clickEmpty('deselect');
    await ev.selectAll('select-all');
    await ev.pressKey('Escape', 'deselect-esc');
    await ev.pressKey('Control+g', 'group');
    await ev.pressKey('Control+Shift+g', 'ungroup');
    logReport(ev.finalize());
  });
});
