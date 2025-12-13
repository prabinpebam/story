import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

function getContentBounds(slideWidth: number, slideHeight: number, margins: any) {
  const left = Number(margins?.left ?? 0);
  const right = Number(margins?.right ?? 0);
  const top = Number(margins?.top ?? 0);
  const bottom = Number(margins?.bottom ?? 0);
  return {
    x: left,
    y: top,
    width: Math.max(0, slideWidth - left - right),
    height: Math.max(0, slideHeight - top - bottom),
  };
}

function getColumnEdgesX(contentBounds: { x: number; width: number }, count: number, gutter: number) {
  const columnCount = Math.max(1, Math.floor(Number(count ?? 1)));
  const gutterWidth = Math.max(0, Number(gutter ?? 0));
  const totalGutter = gutterWidth * Math.max(0, columnCount - 1);
  const usable = Math.max(0, contentBounds.width - totalGutter);
  const colW = usable / columnCount;

  const edges: number[] = [];
  let x = contentBounds.x;
  for (let i = 0; i < columnCount; i++) {
    edges.push(x);
    edges.push(x + colW);
    x += colW + gutterWidth;
  }
  return edges;
}

function expectAlignedToEdges(value: number, edges: number[]) {
  const asInt = Math.round(value);
  expect(value).toBe(asInt);
  expect(edges).toContain(asInt);
}

const EXPECTED_LAYOUT_COLUMNS: Record<string, number> = {
  'layout-title': 1,
  'layout-title-content': 1,
  'layout-section-header': 1,
  'layout-two-column': 2,
  'layout-comparison': 2,
  'layout-title-only': 1,
  'layout-content-caption': 3,
  'layout-picture-with-caption': 3,
  'layout-quote': 1,
  'layout-big-number': 1,
  'layout-three-column': 3,
  'layout-blank': 1,
};

test.describe('Master presets/layouts respect Layout Guide system', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
  });

  test('default master defines margins/gutter; layouts override only columns.count; placeholders align to column edges', async ({ getState }) => {
    const state = await getState();

    const master = state.slideMasterPresets['master-default'];
    expect(master?.type).toBe('slideMasterPreset');

    const lg = master.layoutGuide;
    expect(lg).toBeTruthy();
    expect(lg.enabled).toBe(true);
    expect(lg.margins).toMatchObject({ top: 40, right: 40, bottom: 40, left: 40 });
    expect(lg.columns?.gutter).toBe(20);

    const slideW = 1920;
    const slideH = 1080;
    const content = getContentBounds(slideW, slideH, lg.margins);

    const layoutIds: string[] = master.layoutIds;
    expect(Array.isArray(layoutIds)).toBe(true);
    expect(layoutIds.length).toBeGreaterThan(0);

    for (const layoutId of layoutIds) {
      const layout = state.slideMasterPresets[layoutId];
      expect(layout?.type).toBe('layoutMaster');
      expect(layout.parentMasterId).toBe('master-default');

      const expectedCols = EXPECTED_LAYOUT_COLUMNS[layoutId];
      expect(expectedCols).toBeTruthy();

      // Layout master should not override margin/gutter; only column count.
      expect(layout.layoutGuide?.margins).toBeFalsy();
      expect(layout.layoutGuide?.columns?.gutter).toBeFalsy();
      expect(layout.layoutGuide?.columns?.count).toBe(expectedCols);

      const edges = getColumnEdgesX(content, expectedCols, lg.columns.gutter);

      for (const el of Object.values(layout.elements || {}) as any[]) {
        if (!el || !el.isPlaceholder) continue;
        expect(el.x).toBeGreaterThanOrEqual(content.x);
        expect(el.y).toBeGreaterThanOrEqual(content.y);
        expect(el.x + el.width).toBeLessThanOrEqual(content.x + content.width);
        expect(el.y + el.height).toBeLessThanOrEqual(content.y + content.height);

        expectAlignedToEdges(el.x, edges);
        expectAlignedToEdges(el.x + el.width, edges);
      }
    }
  });

  test('applying a master preset materializes masters/layouts with layoutGuide + aligned placeholders', async ({ dispatchAction, getState }) => {
    const before = await getState();
    const masters = { ...before.slideMasterPresets };

    masters['master-unused'] = {
      id: 'master-unused',
      type: 'slideMasterPreset',
      name: 'Unused Master',
      colorThemeId: masters['master-default']?.colorThemeId || 'preset_neutral',
      typographyStyleId: masters['master-default']?.typographyStyleId || 'typo-style-default',
      background: masters['master-default']?.background || { type: 'solid', value: '#FFFFFF' },
      elements: {},
      elementOrder: [],
      layoutIds: [],
    };

    await dispatchAction('LOAD_PRESENTATION', {
      slides: Object.values(before.slides),
      masters,
    });

    await dispatchAction('APPLY_MASTER_PRESET_TO_MASTER', {
      masterId: 'master-unused',
      presetId: 'master-preset-minimal',
    });

    const after = await getState();
    const master = after.slideMasterPresets['master-unused'];
    expect(master?.type).toBe('slideMasterPreset');
    expect(master.layoutGuide).toBeTruthy();
    expect(master.layoutGuide.margins).toMatchObject({ top: 40, right: 40, bottom: 40, left: 40 });
    expect(master.layoutGuide.columns?.gutter).toBe(20);

    const content = getContentBounds(1920, 1080, master.layoutGuide.margins);

    for (const layoutId of master.layoutIds as string[]) {
      const layout = after.slideMasterPresets[layoutId];
      expect(layout?.type).toBe('layoutMaster');

      // Each layoutId is like master-unused-layout-title -> derive template key.
      const layoutKey = String(layout.layoutKey || '').trim();
      const expectedCols = EXPECTED_LAYOUT_COLUMNS[`layout-${layoutKey}`];
      expect(expectedCols).toBeTruthy();

      expect(layout.layoutGuide?.margins).toBeFalsy();
      expect(layout.layoutGuide?.columns?.gutter).toBeFalsy();
      expect(layout.layoutGuide?.columns?.count).toBe(expectedCols);

      const edges = getColumnEdgesX(content, expectedCols, master.layoutGuide.columns.gutter);

      for (const el of Object.values(layout.elements || {}) as any[]) {
        if (!el || !el.isPlaceholder) continue;
        expect(el.x).toBeGreaterThanOrEqual(content.x);
        expect(el.y).toBeGreaterThanOrEqual(content.y);
        expect(el.x + el.width).toBeLessThanOrEqual(content.x + content.width);
        expect(el.y + el.height).toBeLessThanOrEqual(content.y + content.height);

        expectAlignedToEdges(el.x, edges);
        expectAlignedToEdges(el.x + el.width, edges);
      }
    }
  });
});
