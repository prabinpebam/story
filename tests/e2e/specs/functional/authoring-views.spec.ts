import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

test.describe('Canonical authoring views', () => {
  test('switches all five views with shared document and selection context', async ({ page, getState, dispatchAction }) => {
    const editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();

    const switcher = page.getByTestId('authoring-view-switcher');
    await expect(switcher).toBeVisible();
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

    await page.getByTestId('view-canvas').click();
    await expect(page.locator('#canvas-viewport')).toBeVisible();
    await expect.poll(async () => (await getState()).context.view).toBe('Canvas');
    await expect.poll(async () => (await getState()).editor.activeSlideId).toBe(secondSlideId);

    await dispatchAction('SET_ACTIVE_SLIDE', firstSlideId);
    await dispatchAction('ENTER_RUNTIME', {
      mode: 'Preview',
      surfaceRole: 'Audience',
      placement: 'Embedded preview'
    });
    await expect(switcher).toBeHidden();
    await dispatchAction('EXIT_RUNTIME');
    await expect(switcher).toBeVisible();
    await expect.poll(async () => (await getState()).context.runtimeMode).toBeNull();

    await page.setViewportSize({ width: 800, height: 900 });
    await expect(page.getByTestId('compact-navigator-trigger')).toBeVisible();
    const stageWidth = await page.locator('#main-stage').evaluate((element) => element.getBoundingClientRect().width);
    expect(stageWidth).toBeGreaterThanOrEqual(799);

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