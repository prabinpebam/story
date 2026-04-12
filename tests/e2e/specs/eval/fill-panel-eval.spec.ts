/**
 * 14B — Fill Panel & Color Picker — Agnostic Eval Loop
 *
 * Captures a DOM snapshot for each fill panel taskflow.
 * No judgment. No assertions. Just: action → capture.
 * Evaluation is deferred — the snapshots record what the user sees.
 */

import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

async function seedRect(page: any, color = '#3B82F6'): Promise<string> {
  const id = await page.evaluate((c: string) => {
    const store = (window as any).__TEST_STORE__;
    const id = `eval-fp-${Date.now()}`;
    store.dispatch('ADD_ELEMENT', {
      id, type: 'rect', x: 200, y: 150, width: 200, height: 150,
      rotation: 0, opacity: 1, name: 'Fill Rect',
      style: { fills: [{ type: 'solid', color: c, value: c, opacity: 100, visible: true, blendMode: 'normal' }] },
    });
    return id;
  }, color);
  await page.waitForTimeout(300);
  return id;
}

async function clickSwatch(page: any, index = 0) {
  await page.evaluate((idx: number) => {
    const el = document.querySelectorAll('.fill-swatch-trigger')[idx] as HTMLElement;
    if (el) el.click();
  }, index);
  await page.waitForTimeout(500);
}

test.describe('Fill Panel & Color Picker Snapshots', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // ── Fill Section in PI ───────────────────────────────────────────────

  test('FP-01: Fill section with one solid fill', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fill-panel', scenario: 'FP-01' });
    const el = await seedRect(page, '#3B82F6');
    await ev.clickElement(el, 'selected');
    await page.waitForTimeout(500);
    await ev.capture('fill-section-one-solid');
    logReport(ev.finalize());
  });

  test('FP-02: Fill section with two fills', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fill-panel', scenario: 'FP-02' });
    const el = await seedRect(page);
    await page.evaluate((id: string) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', { id, style: { fills: [
        { type: 'solid', color: '#3B82F6', value: '#3B82F6', opacity: 100, visible: true, blendMode: 'normal' },
        { type: 'solid', color: '#EF4444', value: '#EF4444', opacity: 100, visible: true, blendMode: 'normal' },
      ] } });
    }, el);
    await page.waitForTimeout(300);
    await ev.clickElement(el, 'selected');
    await page.waitForTimeout(500);
    await ev.capture('fill-section-two-fills');
    logReport(ev.finalize());
  });

  test('FP-03: Fill section with gradient fill', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fill-panel', scenario: 'FP-03' });
    const el = await seedRect(page);
    await page.evaluate((id: string) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', { id, style: { fills: [{
        type: 'gradient', opacity: 100, visible: true, blendMode: 'normal',
        value: { type: 'linear', angle: 90, stops: [
          { position: 0, color: '#FF0000' }, { position: 100, color: '#0000FF' }
        ] }
      }] } });
    }, el);
    await page.waitForTimeout(300);
    await ev.clickElement(el, 'selected');
    await page.waitForTimeout(500);
    await ev.capture('fill-section-gradient');
    logReport(ev.finalize());
  });

  // ── Open Fill Flyout ─────────────────────────────────────────────────

  test('FP-04: Open fill flyout (solid)', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fill-panel', scenario: 'FP-04' });
    const el = await seedRect(page, '#EF4444');
    await ev.clickElement(el, 'selected');
    await page.waitForTimeout(500);
    await ev.capture('before-flyout');
    await clickSwatch(page);
    await ev.capture('flyout-open-solid');
    logReport(ev.finalize());
  });

  test('FP-05: Open fill flyout (gradient)', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fill-panel', scenario: 'FP-05' });
    const el = await seedRect(page);
    await page.evaluate((id: string) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', { id, style: { fills: [{
        type: 'gradient', opacity: 100, visible: true, blendMode: 'normal',
        value: { type: 'linear', angle: 90, stops: [
          { position: 0, color: '#FF0000' }, { position: 50, color: '#00FF00' }, { position: 100, color: '#0000FF' }
        ] }
      }] } });
    }, el);
    await page.waitForTimeout(300);
    await ev.clickElement(el, 'selected');
    await page.waitForTimeout(500);
    await clickSwatch(page);
    await ev.capture('flyout-open-gradient-3stops');
    logReport(ev.finalize());
  });

  // ── Color Picker: HSB ────────────────────────────────────────────────

  test('FP-06: HSB area click - bright saturated', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fill-panel', scenario: 'FP-06' });
    const el = await seedRect(page, '#FF0000');
    await ev.clickElement(el, 'selected');
    await page.waitForTimeout(500);
    await clickSwatch(page);
    await ev.capture('picker-open');
    // Click in HSB area (bright + saturated = bottom-right)
    const hsbBox = await page.evaluate(() => {
      const el = document.querySelector('.color-hsb-area');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    });
    if (hsbBox) {
      await page.mouse.click(hsbBox.x + hsbBox.w * 0.8, hsbBox.y + hsbBox.h * 0.2);
      await page.waitForTimeout(400);
    }
    await ev.capture('hsb-bright-saturated');
    logReport(ev.finalize());
  });

  test('FP-07: HSB area click - dark desaturated', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fill-panel', scenario: 'FP-07' });
    const el = await seedRect(page, '#FF0000');
    await ev.clickElement(el, 'selected');
    await page.waitForTimeout(500);
    await clickSwatch(page);
    // Click bottom-left (low sat, low brightness)
    const hsbBox = await page.evaluate(() => {
      const el = document.querySelector('.color-hsb-area');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    });
    if (hsbBox) {
      await page.mouse.click(hsbBox.x + hsbBox.w * 0.1, hsbBox.y + hsbBox.h * 0.9);
      await page.waitForTimeout(400);
    }
    await ev.capture('hsb-dark-desaturated');
    logReport(ev.finalize());
  });

  // ── Color Picker: Hex Input ──────────────────────────────────────────

  test('FP-08: Type hex in panel input', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fill-panel', scenario: 'FP-08' });
    const el = await seedRect(page, '#3B82F6');
    await ev.clickElement(el, 'selected');
    await page.waitForTimeout(500);
    await ev.capture('before-hex-edit');
    const hexInput = page.locator('[data-testid="fill-hex-0"]');
    await hexInput.click({ clickCount: 3 });
    await page.keyboard.type('FF6600');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    await ev.capture('after-hex-orange');
    logReport(ev.finalize());
  });

  // ── Color Picker: Opacity ────────────────────────────────────────────

  test('FP-09: Change opacity in panel', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fill-panel', scenario: 'FP-09' });
    const el = await seedRect(page, '#EF4444');
    await ev.clickElement(el, 'selected');
    await page.waitForTimeout(500);
    await ev.capture('opacity-100');
    const opInput = page.locator('[data-testid="fill-opacity-0"]');
    if (await opInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await opInput.click({ clickCount: 3 });
      await page.keyboard.type('50');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(400);
    }
    await ev.capture('opacity-50');
    logReport(ev.finalize());
  });

  // ── Fill Type Switching ──────────────────────────────────────────────

  test('FP-10: Switch to gradient in flyout', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fill-panel', scenario: 'FP-10' });
    const el = await seedRect(page, '#3B82F6');
    await ev.clickElement(el, 'selected');
    await page.waitForTimeout(500);
    await clickSwatch(page);
    await ev.capture('flyout-solid');
    // Click gradient type icon
    const typeIcons = page.locator('.fill-type-selector button, .fill-type-selector .type-icon');
    if (await typeIcons.nth(1).isVisible({ timeout: 2000 }).catch(() => false)) {
      await typeIcons.nth(1).click();
      await page.waitForTimeout(500);
    }
    await ev.capture('flyout-switched-to-gradient');
    logReport(ev.finalize());
  });

  test('FP-11: Switch to image in flyout', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fill-panel', scenario: 'FP-11' });
    const el = await seedRect(page, '#3B82F6');
    await ev.clickElement(el, 'selected');
    await page.waitForTimeout(500);
    await clickSwatch(page);
    await ev.capture('flyout-solid');
    const typeIcons = page.locator('.fill-type-selector button, .fill-type-selector .type-icon');
    if (await typeIcons.nth(2).isVisible({ timeout: 2000 }).catch(() => false)) {
      await typeIcons.nth(2).click();
      await page.waitForTimeout(500);
    }
    await ev.capture('flyout-switched-to-image');
    logReport(ev.finalize());
  });

  test('FP-12: Switch to code in flyout', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fill-panel', scenario: 'FP-12' });
    const el = await seedRect(page, '#3B82F6');
    await ev.clickElement(el, 'selected');
    await page.waitForTimeout(500);
    await clickSwatch(page);
    await ev.capture('flyout-solid');
    const typeIcons = page.locator('.fill-type-selector button, .fill-type-selector .type-icon');
    if (await typeIcons.nth(4).isVisible({ timeout: 2000 }).catch(() => false)) {
      await typeIcons.nth(4).click();
      await page.waitForTimeout(500);
    }
    await ev.capture('flyout-switched-to-code');
    logReport(ev.finalize());
  });

  // ── Gradient: Types & Angle ──────────────────────────────────────────

  test('FP-13: Gradient flyout with angle rotation', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fill-panel', scenario: 'FP-13' });
    const el = await seedRect(page);
    await page.evaluate((id: string) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', { id, style: { fills: [{
        type: 'gradient', opacity: 100, visible: true, blendMode: 'normal',
        value: { type: 'linear', angle: 0, stops: [
          { position: 0, color: '#FF0000' }, { position: 100, color: '#0000FF' }
        ] }
      }] } });
    }, el);
    await page.waitForTimeout(300);
    await ev.clickElement(el, 'selected');
    await page.waitForTimeout(500);
    await clickSwatch(page);
    await ev.capture('gradient-flyout-angle-0');
    // Click rotate button if visible
    const rotateBtn = page.locator('.fill-flyout button, .ui-flyout button').filter({ hasText: '' });
    // Try to find rotate by icon class
    const rotIcon = await page.evaluate(() => {
      const btns = document.querySelectorAll('.fill-flyout button, .ui-flyout button');
      for (const b of btns) {
        if (b.querySelector('.fa-rotate-right, .fa-redo')) {
          (b as HTMLElement).click();
          return true;
        }
      }
      return false;
    });
    if (rotIcon) await page.waitForTimeout(400);
    await ev.capture('gradient-flyout-after-rotate');
    logReport(ev.finalize());
  });

  // ── Gradient: Stops ──────────────────────────────────────────────────

  test('FP-14: Gradient with 2 stops', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fill-panel', scenario: 'FP-14' });
    const el = await seedRect(page);
    await page.evaluate((id: string) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', { id, style: { fills: [{
        type: 'gradient', opacity: 100, visible: true, blendMode: 'normal',
        value: { type: 'linear', angle: 90, stops: [
          { position: 0, color: '#FF0000' }, { position: 100, color: '#0000FF' }
        ] }
      }] } });
    }, el);
    await page.waitForTimeout(300);
    await ev.clickElement(el, 'selected');
    await page.waitForTimeout(500);
    await clickSwatch(page);
    await ev.capture('gradient-2-stops');
    logReport(ev.finalize());
  });

  test('FP-15: Gradient with 5 stops (rainbow)', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fill-panel', scenario: 'FP-15' });
    const el = await seedRect(page);
    await page.evaluate((id: string) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', { id, style: { fills: [{
        type: 'gradient', opacity: 100, visible: true, blendMode: 'normal',
        value: { type: 'linear', angle: 90, stops: [
          { position: 0, color: '#FF0000' },
          { position: 25, color: '#FF8800' },
          { position: 50, color: '#00FF00' },
          { position: 75, color: '#0088FF' },
          { position: 100, color: '#8800FF' }
        ] }
      }] } });
    }, el);
    await page.waitForTimeout(300);
    await ev.clickElement(el, 'selected');
    await page.waitForTimeout(500);
    await clickSwatch(page);
    await ev.capture('gradient-5-stops-rainbow');
    logReport(ev.finalize());
  });

  test('FP-16: Radial gradient flyout', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fill-panel', scenario: 'FP-16' });
    const el = await seedRect(page);
    await page.evaluate((id: string) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', { id, style: { fills: [{
        type: 'gradient', opacity: 100, visible: true, blendMode: 'normal',
        value: { type: 'radial', angle: 0, stops: [
          { position: 0, color: '#FFFFFF' }, { position: 100, color: '#000000' }
        ] }
      }] } });
    }, el);
    await page.waitForTimeout(300);
    await ev.clickElement(el, 'selected');
    await page.waitForTimeout(500);
    await clickSwatch(page);
    await ev.capture('radial-gradient-flyout');
    logReport(ev.finalize());
  });

  // ── Theme Swatches ───────────────────────────────────────────────────

  test('FP-17: Theme swatches in flyout', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fill-panel', scenario: 'FP-17' });
    const el = await seedRect(page, '#3B82F6');
    await ev.clickElement(el, 'selected');
    await page.waitForTimeout(500);
    await clickSwatch(page);
    await ev.capture('flyout-with-theme-swatches');
    // Click first theme swatch
    await page.evaluate(() => {
      const swatch = document.querySelector('.theme-swatch, .color-swatch') as HTMLElement;
      if (swatch) swatch.click();
    });
    await page.waitForTimeout(400);
    await ev.capture('after-theme-swatch-click');
    logReport(ev.finalize());
  });

  // ── Blend Mode ───────────────────────────────────────────────────────

  test('FP-18: Blend mode button on fill row', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fill-panel', scenario: 'FP-18' });
    const el = await seedRect(page, '#3B82F6');
    await ev.clickElement(el, 'selected');
    await page.waitForTimeout(500);
    await ev.capture('fill-row-with-blend-button');
    logReport(ev.finalize());
  });

  // ── Visibility Toggle ────────────────────────────────────────────────

  test('FP-19: Fill visibility toggle', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fill-panel', scenario: 'FP-19' });
    const el = await seedRect(page, '#EF4444');
    await ev.clickElement(el, 'selected');
    await page.waitForTimeout(500);
    await ev.capture('fill-visible');
    // Click eye icon
    await page.evaluate(() => {
      const btn = document.querySelector('.pi-property-row__visibility') as HTMLElement;
      if (btn) btn.click();
    });
    await page.waitForTimeout(400);
    await ev.capture('fill-hidden');
    await page.evaluate(() => {
      const btn = document.querySelector('.pi-property-row__visibility') as HTMLElement;
      if (btn) btn.click();
    });
    await page.waitForTimeout(400);
    await ev.capture('fill-visible-again');
    logReport(ev.finalize());
  });

  // ── Add and Delete Fill ──────────────────────────────────────────────

  test('FP-20: Add fill via + button', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fill-panel', scenario: 'FP-20' });
    const el = await seedRect(page, '#3B82F6');
    await ev.clickElement(el, 'selected');
    await page.waitForTimeout(500);
    await ev.capture('one-fill');
    // Click + in fill section
    await page.evaluate(() => {
      // Find the fill section's add button
      const sections = document.querySelectorAll('.pi-section');
      for (const sec of sections) {
        if (sec.textContent?.includes('FILL') || sec.querySelector('.fill-list')) {
          const btn = sec.querySelector('.pi-section__actions button') as HTMLElement;
          if (btn) { btn.click(); return; }
        }
      }
    });
    await page.waitForTimeout(500);
    await ev.capture('two-fills-after-add');
    logReport(ev.finalize());
  });

  test('FP-21: Delete fill via - button', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fill-panel', scenario: 'FP-21' });
    const el = await seedRect(page);
    await page.evaluate((id: string) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', { id, style: { fills: [
        { type: 'solid', color: '#3B82F6', value: '#3B82F6', opacity: 100, visible: true, blendMode: 'normal' },
        { type: 'solid', color: '#EF4444', value: '#EF4444', opacity: 100, visible: true, blendMode: 'normal' },
      ] } });
    }, el);
    await page.waitForTimeout(300);
    await ev.clickElement(el, 'selected');
    await page.waitForTimeout(500);
    await ev.capture('two-fills');
    // Click - on first fill
    await page.evaluate(() => {
      const btn = document.querySelector('.pi-property-row__delete') as HTMLElement;
      if (btn) btn.click();
    });
    await page.waitForTimeout(500);
    await ev.capture('one-fill-after-delete');
    logReport(ev.finalize());
  });

  // ── Theme-Linked Fill ────────────────────────────────────────────────

  test('FP-22: Theme-linked fill in panel', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fill-panel', scenario: 'FP-22' });
    const el = await seedRect(page);
    await page.evaluate((id: string) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', { id, style: { fills: [
        { type: 'solid', color: '#3B82F6', value: '#3B82F6', opacity: 100, visible: true, blendMode: 'normal', themeSlot: 0 },
      ] } });
    }, el);
    await page.waitForTimeout(300);
    await ev.clickElement(el, 'selected');
    await page.waitForTimeout(500);
    await ev.capture('theme-linked-fill-panel');
    logReport(ev.finalize());
  });
});
