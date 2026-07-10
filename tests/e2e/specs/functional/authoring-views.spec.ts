import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

test.describe('Canonical authoring views', () => {
  test('switches all five views with shared document and selection context', async ({ page, getState, dispatchAction }) => {
    const editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();

    const switcher = page.getByTestId('authoring-view-switcher');
    const cueLine = page.getByTestId('cue-line');
    await expect(switcher).toBeVisible();
    await expect(cueLine).toBeVisible();
    await expect(cueLine).toContainText('Default Master');
    await expect(cueLine).toContainText('Title Slide');
    await expect(cueLine).toContainText('Unavailable');
    await expect(cueLine).not.toContainText('Story System');
    await expect(page.getByTestId('view-canvas')).toHaveAttribute('aria-selected', 'true');

    await page.getByTestId('view-grid').click();
    await expect(page.getByTestId('authoring-grid')).toBeVisible();
    await expect.poll(async () => (await getState()).context.view).toBe('Grid');

    const firstSlideId = (await getState()).slideOrder[0];
    const secondSlideId = (await getState()).slideOrder[1];
    await page.locator(`.authoring-grid__item[data-slide-id="${secondSlideId}"]`).click();
    await expect.poll(async () => (await getState()).editor.activeSlideId).toBe(secondSlideId);

    await page.getByTestId('view-outline').click();
    await expect(page.getByTestId('authoring-outline')).toBeVisible();
    await expect.poll(async () => (await getState()).context.view).toBe('Outline');
    const secondTitle = page.locator(`.authoring-outline__slide[data-slide-id="${secondSlideId}"] .authoring-outline__title`);
    await secondTitle.fill('Evidence revised');
    await secondTitle.press('Tab');
    await expect.poll(async () => (await getState()).slides[secondSlideId].title).toBe('Evidence revised');
    await expect.poll(async () => (await getState()).editor.activeSlideId).toBe(secondSlideId);

    await page.getByTestId('view-notes').click();
    const notes = page.locator('.authoring-notes__editor');
    await expect(notes).toBeVisible();
    await notes.fill('A focused speaker note');
    await notes.blur();
    await expect.poll(async () => (await getState()).slides[secondSlideId].notesDoc?.blocks?.[0]?.inlines?.[0]?.text).toBe('A focused speaker note');

    await page.getByTestId('view-system').click();
    const system = page.getByTestId('authoring-system');
    await expect(system).toBeVisible();
    await expect(system).toContainText('Story System');
    await expect(system).toContainText('Not created');
    await expect.poll(async () => (await getState()).context.view).toBe('System');

    await dispatchAction('UPDATE_VIEWPORT', { zoom: 1.4, pan: { x: 31, y: 47 } });
    const activeLayoutId = (await getState()).slides[secondSlideId].layoutId;
    const activeLayoutName = (await getState()).slideMasterPresets[activeLayoutId].name;
    await page.locator('[data-cue-kind="layout"]').click();
    await expect.poll(async () => (await getState()).context.editScope).toBe('Layout');
    await expect.poll(async () => (await getState()).editor.activeMasterId).toBe(activeLayoutId);
    await expect(cueLine).toContainText(activeLayoutName);
    await expect(page.locator('[data-cue-kind="return"]')).toBeVisible();
    await page.locator('[data-cue-kind="return"]').click();
    await expect.poll(async () => (await getState()).context.view).toBe('System');
    await expect.poll(async () => (await getState()).context.editScope).toBe('Slide');
    await expect.poll(async () => (await getState()).editor.activeSlideId).toBe(secondSlideId);

    await page.getByTestId('view-canvas').click();
    await expect(page.locator('#canvas-viewport')).toBeVisible();
    await expect.poll(async () => (await getState()).context.view).toBe('Canvas');
    await expect.poll(async () => (await getState()).editor.activeSlideId).toBe(secondSlideId);
    await expect.poll(async () => page.locator('#slide-content').evaluate((element) => getComputedStyle(element).transform)).toBe('matrix(1.4, 0, 0, 1.4, 31, 47)');

    await dispatchAction('SET_ACTIVE_SLIDE', firstSlideId);
    await dispatchAction('UPDATE_VIEWPORT', { zoom: 1.5, pan: { x: 23, y: 37 } });
    await dispatchAction('ENTER_RUNTIME', {
      mode: 'Preview',
      surfaceRole: 'Audience',
      placement: 'Embedded preview'
    });
    expect(await cueLine.evaluate((element) => getComputedStyle(element).display)).toBe('none');
    await expect(switcher).toBeHidden();
    await expect(cueLine).toBeHidden();
    await dispatchAction('EXIT_RUNTIME');
    await expect(switcher).toBeVisible();
    await expect.poll(async () => (await getState()).context.runtimeMode).toBeNull();
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    expect((await getState()).editor.zoom).toBe(1.5);
    expect((await getState()).editor.pan).toEqual({ x: 23, y: 37 });
    await expect.poll(async () => page.locator('#slide-content').evaluate((element) => getComputedStyle(element).transform)).toBe('matrix(1.5, 0, 0, 1.5, 23, 37)');

    await page.getByTestId('btn-fit').click();
    await page.setViewportSize({ width: 800, height: 900 });
    await expect(page.getByTestId('compact-navigator-trigger')).toBeVisible();
    const stageWidth = await page.locator('#main-stage').evaluate((element) => element.getBoundingClientRect().width);
    expect(stageWidth).toBeGreaterThanOrEqual(799);
    const controlsDoNotOverlap = await page.evaluate(() => {
      const tools = document.querySelector('#floating-toolbar')!.getBoundingClientRect();
      const viewport = document.querySelector('#viewport-controls')!.getBoundingClientRect();
      return tools.right <= viewport.left || viewport.right <= tools.left || tools.bottom <= viewport.top || viewport.bottom <= tools.top;
    });
    expect(controlsDoNotOverlap).toBe(true);
    await page.getByTestId('view-canvas').click();
    await expect.poll(async () => page.locator('#slide-content').evaluate((element) => {
      const slide = element.getBoundingClientRect();
      const canvas = document.querySelector('#canvas-viewport')!.getBoundingClientRect();
      return slide.left >= canvas.left && slide.top >= canvas.top && slide.right <= canvas.right && slide.bottom <= canvas.bottom;
    })).toBe(true);
    await expect(page.locator('.cue-line__expand')).toBeVisible();
    const expand = page.locator('.cue-line__expand');
    const expandBox = await expand.boundingBox();
    expect(expandBox?.width).toBeGreaterThanOrEqual(44);
    expect(expandBox?.height).toBeGreaterThanOrEqual(44);
    await expand.focus();
    await expand.press('Enter');
    await expect(cueLine).toHaveClass(/cue-line--expanded/);
    await expect(expand).toBeFocused();

    await page.getByTestId('compact-navigator-trigger').click();
    await expect(page.locator('#sidebar-left')).toBeInViewport();
    await expect(page.getByTestId('compact-rail-backdrop')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('compact-rail-backdrop')).toBeHidden();

    await page.getByTestId('compact-inspector-trigger').click();
    await expect(page.locator('#sidebar-right')).toBeInViewport();
    await page.getByTestId('compact-rail-backdrop').click();
    await expect(page.getByTestId('compact-rail-backdrop')).toBeHidden();

    await page.setViewportSize({ width: 1600, height: 1000 });
    await expect(page.getByTestId('compact-navigator-trigger')).toBeVisible();
    await expect(page.locator('#main-stage')).toHaveCSS('width', '1600px');

    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.getByTestId('compact-navigator-trigger')).toBeHidden();
    const dockedStageWidth = await page.locator('#main-stage').evaluate((element) => element.getBoundingClientRect().width);
    expect(dockedStageWidth).toBeGreaterThanOrEqual(1100);
  });
});