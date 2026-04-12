import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

async function seedRectWithFill(page: any, color = '#3B82F6'): Promise<string> {
  const id = await page.evaluate((c: string) => {
    const store = (window as any).__TEST_STORE__;
    const id = `eval-fill-${Date.now()}`;
    store.dispatch('ADD_ELEMENT', {
      id, type: 'rect', x: 200, y: 150, width: 200, height: 150,
      rotation: 0, opacity: 1, name: 'Fill Rect',
      style: { fills: [{ type: 'solid', color: c, value: c, opacity: 100, visible: true, blendMode: 'normal' }] },
    });
    store.dispatch('UPDATE_SELECTION', []);
    return id;
  }, color);
  await page.waitForTimeout(200);
  return id;
}

async function setFills(page: any, elId: string, fills: unknown[]) {
  await page.evaluate(({ id, fills }: any) => {
    (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', { id, style: { fills } });
  }, { id: elId, fills });
  await page.waitForTimeout(250);
}

test.describe('Fills System Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page); await editor.goto(); await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  test('FIL-01: Add fill layers', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fills', scenario: 'FIL-01' });
    const el = await seedRectWithFill(page, '#3B82F6');
    await ev.clickElement(el, 'sel'); await ev.capture('one-fill');
    await setFills(page, el, [
      { type: 'solid', color: '#3B82F6', value: '#3B82F6', opacity: 100, visible: true, blendMode: 'normal' },
      { type: 'solid', color: '#D9D9D9', value: '#D9D9D9', opacity: 100, visible: true, blendMode: 'normal' },
    ]); await ev.capture('two-fills');
    await setFills(page, el, [
      { type: 'solid', color: '#3B82F6', value: '#3B82F6', opacity: 100, visible: true, blendMode: 'normal' },
      { type: 'solid', color: '#D9D9D9', value: '#D9D9D9', opacity: 100, visible: true, blendMode: 'normal' },
      { type: 'solid', color: '#EF4444', value: '#EF4444', opacity: 100, visible: true, blendMode: 'normal' },
    ]); await ev.capture('three-fills');
    logReport(ev.finalize());
  });

  test('FIL-02: Delete fill layer', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fills', scenario: 'FIL-02' });
    const el = await seedRectWithFill(page);
    await ev.clickElement(el, 'sel');
    await setFills(page, el, [
      { type: 'solid', color: '#3B82F6', value: '#3B82F6', opacity: 100, visible: true, blendMode: 'normal' },
      { type: 'solid', color: '#EF4444', value: '#EF4444', opacity: 100, visible: true, blendMode: 'normal' },
    ]); await ev.capture('two-fills');
    await setFills(page, el, [
      { type: 'solid', color: '#3B82F6', value: '#3B82F6', opacity: 100, visible: true, blendMode: 'normal' },
    ]); await ev.capture('one-fill');
    await setFills(page, el, []); await ev.capture('no-fills');
    logReport(ev.finalize());
  });

  test('FIL-03: Toggle fill visibility', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fills', scenario: 'FIL-03' });
    const el = await seedRectWithFill(page, '#EF4444');
    await ev.clickElement(el, 'sel'); await ev.capture('visible');
    await setFills(page, el, [{ type: 'solid', color: '#EF4444', value: '#EF4444', opacity: 100, visible: false, blendMode: 'normal' }]);
    await ev.capture('hidden');
    await setFills(page, el, [{ type: 'solid', color: '#EF4444', value: '#EF4444', opacity: 100, visible: true, blendMode: 'normal' }]);
    await ev.capture('shown');
    logReport(ev.finalize());
  });

  test('FIL-04: Reorder fills', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fills', scenario: 'FIL-04' });
    const el = await seedRectWithFill(page);
    await ev.clickElement(el, 'sel');
    await setFills(page, el, [
      { type: 'solid', color: '#3B82F6', value: '#3B82F6', opacity: 100, visible: true, blendMode: 'normal' },
      { type: 'solid', color: '#EF4444', value: '#EF4444', opacity: 100, visible: true, blendMode: 'normal' },
    ]); await ev.capture('blue-top-red-bottom');
    await setFills(page, el, [
      { type: 'solid', color: '#EF4444', value: '#EF4444', opacity: 100, visible: true, blendMode: 'normal' },
      { type: 'solid', color: '#3B82F6', value: '#3B82F6', opacity: 100, visible: true, blendMode: 'normal' },
    ]); await ev.capture('red-top-blue-bottom');
    logReport(ev.finalize());
  });

  test('FIL-05: Set blend mode', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fills', scenario: 'FIL-05' });
    const el = await seedRectWithFill(page);
    await ev.clickElement(el, 'sel'); await ev.capture('normal');
    await setFills(page, el, [{ type: 'solid', color: '#3B82F6', value: '#3B82F6', opacity: 100, visible: true, blendMode: 'multiply' }]);
    await ev.capture('multiply');
    await setFills(page, el, [{ type: 'solid', color: '#3B82F6', value: '#3B82F6', opacity: 100, visible: true, blendMode: 'screen' }]);
    await ev.capture('screen');
    logReport(ev.finalize());
  });

  test('FIL-06: Change hex color', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fills', scenario: 'FIL-06' });
    const el = await seedRectWithFill(page, '#3B82F6');
    await ev.clickElement(el, 'sel'); await ev.capture('blue');
    await setFills(page, el, [{ type: 'solid', color: '#FF5500', value: '#FF5500', opacity: 100, visible: true, blendMode: 'normal' }]);
    await ev.capture('orange');
    await setFills(page, el, [{ type: 'solid', color: '#10B981', value: '#10B981', opacity: 100, visible: true, blendMode: 'normal' }]);
    await ev.capture('green');
    logReport(ev.finalize());
  });

  test('FIL-07: Change opacity', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fills', scenario: 'FIL-07' });
    const el = await seedRectWithFill(page, '#EF4444');
    await ev.clickElement(el, 'sel'); await ev.capture('100pct');
    await setFills(page, el, [{ type: 'solid', color: '#EF4444', value: '#EF4444', opacity: 50, visible: true, blendMode: 'normal' }]);
    await ev.capture('50pct');
    await setFills(page, el, [{ type: 'solid', color: '#EF4444', value: '#EF4444', opacity: 0, visible: true, blendMode: 'normal' }]);
    await ev.capture('0pct');
    logReport(ev.finalize());
  });

  test('FIL-14: Switch fill types', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fills', scenario: 'FIL-14' });
    const el = await seedRectWithFill(page);
    await ev.clickElement(el, 'sel'); await ev.capture('solid');
    await setFills(page, el, [{ type: 'gradient', opacity: 100, visible: true, blendMode: 'normal',
      value: { type: 'linear', angle: 90, stops: [{ position: 0, color: '#F00' }, { position: 100, color: '#00F' }] } }]);
    await ev.capture('gradient');
    await setFills(page, el, [{ type: 'code', opacity: 100, visible: true, blendMode: 'normal',
      code: 'ctx.fillStyle="gold";ctx.fillRect(0,0,200,150);', value: '' }]);
    await ev.capture('code');
    await setFills(page, el, [{ type: 'solid', color: '#8B5CF6', value: '#8B5CF6', opacity: 100, visible: true, blendMode: 'normal' }]);
    await ev.capture('back-solid');
    logReport(ev.finalize());
  });

  test('FIL-21/24: Theme link and unlink', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fills', scenario: 'FIL-21-24' });
    const el = await seedRectWithFill(page);
    await ev.clickElement(el, 'sel'); await ev.capture('unlinked');
    await setFills(page, el, [{ type: 'solid', color: '#3B82F6', value: '#3B82F6', opacity: 100, visible: true, blendMode: 'normal', themeSlot: 0 }]);
    await ev.capture('linked-0');
    await setFills(page, el, [{ type: 'solid', color: '#FF6633', value: '#FF6633', opacity: 100, visible: true, blendMode: 'normal' }]);
    await ev.capture('unlinked-after-edit');
    logReport(ev.finalize());
  });

  test('FIL-25: All gradient types', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fills', scenario: 'FIL-25' });
    const el = await seedRectWithFill(page);
    await ev.clickElement(el, 'sel'); await ev.capture('solid-base');
    const stops = [{ position: 0, color: '#FF0000' }, { position: 100, color: '#0000FF' }];
    for (const gt of ['linear', 'radial', 'angular', 'diamond']) {
      await setFills(page, el, [{ type: 'gradient', opacity: 100, visible: true, blendMode: 'normal',
        value: { type: gt, angle: 90, stops } }]);
      await ev.capture(`${gt}-gradient`);
    }
    logReport(ev.finalize());
  });

  test('FIL-26/27: Gradient angle and rotate 90', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fills', scenario: 'FIL-26-27' });
    const el = await seedRectWithFill(page);
    await ev.clickElement(el, 'sel');
    const stops = [{ position: 0, color: '#FF0000' }, { position: 100, color: '#FFFF00' }];
    for (const angle of [0, 90, 180, 270]) {
      await setFills(page, el, [{ type: 'gradient', opacity: 100, visible: true, blendMode: 'normal',
        value: { type: 'linear', angle, stops } }]);
      await ev.capture(`angle-${angle}`);
    }
    logReport(ev.finalize());
  });

  test('FIL-28: Reverse gradient', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fills', scenario: 'FIL-28' });
    const el = await seedRectWithFill(page);
    await ev.clickElement(el, 'sel');
    await setFills(page, el, [{ type: 'gradient', opacity: 100, visible: true, blendMode: 'normal',
      value: { type: 'linear', angle: 90, stops: [{ position: 0, color: '#FF0000' }, { position: 100, color: '#0000FF' }] } }]);
    await ev.capture('original');
    await setFills(page, el, [{ type: 'gradient', opacity: 100, visible: true, blendMode: 'normal',
      value: { type: 'linear', angle: 90, stops: [{ position: 0, color: '#0000FF' }, { position: 100, color: '#FF0000' }] } }]);
    await ev.capture('reversed');
    logReport(ev.finalize());
  });

  test('FIL-29/34: Add and remove gradient stops', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fills', scenario: 'FIL-29-34' });
    const el = await seedRectWithFill(page);
    await ev.clickElement(el, 'sel');
    await setFills(page, el, [{ type: 'gradient', opacity: 100, visible: true, blendMode: 'normal',
      value: { type: 'linear', angle: 90, stops: [{ position: 0, color: '#F00' }, { position: 100, color: '#00F' }] } }]);
    await ev.capture('two-stops');
    await setFills(page, el, [{ type: 'gradient', opacity: 100, visible: true, blendMode: 'normal',
      value: { type: 'linear', angle: 90, stops: [{ position: 0, color: '#F00' }, { position: 50, color: '#0F0' }, { position: 100, color: '#00F' }] } }]);
    await ev.capture('three-stops');
    await setFills(page, el, [{ type: 'gradient', opacity: 100, visible: true, blendMode: 'normal',
      value: { type: 'linear', angle: 90, stops: [
        { position: 0, color: '#F00' }, { position: 25, color: '#F80' },
        { position: 50, color: '#0F0' }, { position: 75, color: '#08F' }, { position: 100, color: '#00F' }] } }]);
    await ev.capture('five-stops');
    await setFills(page, el, [{ type: 'gradient', opacity: 100, visible: true, blendMode: 'normal',
      value: { type: 'linear', angle: 90, stops: [{ position: 0, color: '#F00' }, { position: 100, color: '#00F' }] } }]);
    await ev.capture('back-to-two');
    logReport(ev.finalize());
  });

  test('FIL-30/33: Move gradient stop position', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fills', scenario: 'FIL-30-33' });
    const el = await seedRectWithFill(page);
    await ev.clickElement(el, 'sel');
    await setFills(page, el, [{ type: 'gradient', opacity: 100, visible: true, blendMode: 'normal',
      value: { type: 'linear', angle: 90, stops: [{ position: 0, color: '#F00' }, { position: 50, color: '#0F0' }, { position: 100, color: '#00F' }] } }]);
    await ev.capture('mid-at-50');
    await setFills(page, el, [{ type: 'gradient', opacity: 100, visible: true, blendMode: 'normal',
      value: { type: 'linear', angle: 90, stops: [{ position: 0, color: '#F00' }, { position: 25, color: '#0F0' }, { position: 100, color: '#00F' }] } }]);
    await ev.capture('mid-at-25');
    await setFills(page, el, [{ type: 'gradient', opacity: 100, visible: true, blendMode: 'normal',
      value: { type: 'linear', angle: 90, stops: [{ position: 0, color: '#F00' }, { position: 75, color: '#0F0' }, { position: 100, color: '#00F' }] } }]);
    await ev.capture('mid-at-75');
    logReport(ev.finalize());
  });

  test('FIL-32: Edit stop color', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fills', scenario: 'FIL-32' });
    const el = await seedRectWithFill(page);
    await ev.clickElement(el, 'sel');
    await setFills(page, el, [{ type: 'gradient', opacity: 100, visible: true, blendMode: 'normal',
      value: { type: 'linear', angle: 90, stops: [{ position: 0, color: '#FF0000' }, { position: 100, color: '#0000FF' }] } }]);
    await ev.capture('red-blue');
    await setFills(page, el, [{ type: 'gradient', opacity: 100, visible: true, blendMode: 'normal',
      value: { type: 'linear', angle: 90, stops: [{ position: 0, color: '#FFFF00' }, { position: 100, color: '#8B00FF' }] } }]);
    await ev.capture('yellow-purple');
    logReport(ev.finalize());
  });

  test('FIL-37..45: Image fill modes', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fills', scenario: 'FIL-37-45' });
    const el = await seedRectWithFill(page);
    await ev.clickElement(el, 'sel'); await ev.capture('solid');
    for (const mode of ['fill', 'fit', 'stretch', 'tile']) {
      await setFills(page, el, [{ type: 'image', opacity: 100, visible: true, blendMode: 'normal', scaleMode: mode, position: { x: 0.5, y: 0.5 } }]);
      await ev.capture(`image-${mode}`);
    }
    logReport(ev.finalize());
  });

  test('FIL-46..50: Image filters', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fills', scenario: 'FIL-46-50' });
    const el = await seedRectWithFill(page);
    await ev.clickElement(el, 'sel');
    await setFills(page, el, [{ type: 'image', opacity: 100, visible: true, blendMode: 'normal', scaleMode: 'fill',
      filters: { brightness: 0, contrast: 0, saturation: 0, temperature: 0, blur: 0 } }]);
    await ev.capture('no-filters');
    await setFills(page, el, [{ type: 'image', opacity: 100, visible: true, blendMode: 'normal', scaleMode: 'fill',
      filters: { brightness: 50, contrast: 30, saturation: -20, temperature: 10, blur: 5 } }]);
    await ev.capture('all-filters');
    logReport(ev.finalize());
  });

  test('FIL-51..58: Video fill', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fills', scenario: 'FIL-51-58' });
    const el = await seedRectWithFill(page);
    await ev.clickElement(el, 'sel'); await ev.capture('solid');
    await setFills(page, el, [{ type: 'video', opacity: 100, visible: true, blendMode: 'normal',
      scaleMode: 'fill', playback: { autoplay: true, loop: true } }]);
    await ev.capture('video-autoplay-loop');
    await setFills(page, el, [{ type: 'video', opacity: 75, visible: true, blendMode: 'normal',
      scaleMode: 'fit', playback: { autoplay: false, loop: false } }]);
    await ev.capture('video-fit-75');
    logReport(ev.finalize());
  });

  test('FIL-59: Video adjustments', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fills', scenario: 'FIL-59' });
    const el = await seedRectWithFill(page);
    await ev.clickElement(el, 'sel');
    await setFills(page, el, [{ type: 'video', opacity: 100, visible: true, blendMode: 'normal',
      scaleMode: 'fill', playback: { autoplay: false, loop: false },
      filters: { brightness: 0, contrast: 0, saturation: 0 } }]);
    await ev.capture('video-no-filters');
    await setFills(page, el, [{ type: 'video', opacity: 100, visible: true, blendMode: 'normal',
      scaleMode: 'fill', playback: { autoplay: false, loop: false },
      filters: { brightness: 30, contrast: -15, saturation: 20 } }]);
    await ev.capture('video-with-filters');
    logReport(ev.finalize());
  });

  test('FIL-61/67: Code fill', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fills', scenario: 'FIL-61-67' });
    const el = await seedRectWithFill(page);
    await ev.clickElement(el, 'sel'); await ev.capture('solid');
    await setFills(page, el, [{ type: 'code', opacity: 100, visible: true, blendMode: 'normal',
      code: 'var g=ctx.createLinearGradient(0,0,200,150);g.addColorStop(0,"red");g.addColorStop(1,"blue");ctx.fillStyle=g;ctx.fillRect(0,0,200,150);', value: '' }]);
    await ev.capture('code-gradient');
    await setFills(page, el, [{ type: 'code', opacity: 100, visible: true, blendMode: 'normal',
      code: 'for(var i=0;i<10;i++){ctx.fillStyle="hsl("+i*36+",100%,50%)";ctx.fillRect(i*20,0,20,150);}', value: '' }]);
    await ev.capture('code-rainbow');
    logReport(ev.finalize());
  });

  test('FIL-73/74: Multi-selection compatibility', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fills', scenario: 'FIL-73-74' });
    const elA = await seedRectWithFill(page, '#3B82F6');
    const elB = await page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      const id = `eval-fill-b-${Date.now()}`;
      store.dispatch('ADD_ELEMENT', { id, type: 'rect', x: 450, y: 150, width: 200, height: 150,
        rotation: 0, opacity: 1, name: 'Fill B',
        style: { fills: [{ type: 'solid', color: '#EF4444', value: '#EF4444', opacity: 100, visible: true, blendMode: 'normal' }] } });
      store.dispatch('UPDATE_SELECTION', []);
      return id;
    });
    await page.waitForTimeout(200);
    await ev.clickElement(elA, 'selA');
    await ev.shiftClickElement(elB, 'addB');
    await ev.capture('compatible');
    await setFills(page, elA, [
      { type: 'solid', color: '#3B82F6', value: '#3B82F6', opacity: 100, visible: true, blendMode: 'normal' },
      { type: 'solid', color: '#D9D9D9', value: '#D9D9D9', opacity: 100, visible: true, blendMode: 'normal' },
    ]);
    await ev.capture('incompatible');
    logReport(ev.finalize());
  });
});
