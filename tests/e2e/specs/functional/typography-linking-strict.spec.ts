import { test, expect, type Page, type Locator } from '@playwright/test';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';

async function openDropdownAndPick(page: Page, dropdownLocator: Locator, preferredLabel?: string) {
  await dropdownLocator.click();
  await page.waitForTimeout(100);

  const menu = page.locator('.dropdown-menu');
  await expect(menu).toBeVisible();

  if (preferredLabel) {
    const preferred = page.locator('.dropdown-item').filter({ hasText: preferredLabel }).first();
    if (await preferred.count()) {
      await preferred.click();
      await page.waitForTimeout(150);
      return;
    }
  }

  // Pick first non-action, non-divider, non "No Style" item
  const items = page.locator('.dropdown-item');
  const count = await items.count();
  for (let i = 0; i < count; i++) {
    const item = items.nth(i);
    const text = (await item.textContent())?.trim() || '';
    if (!text) continue;
    if (text === 'No Style') continue;
    if (text.startsWith('+')) continue;
    await item.click();
    await page.waitForTimeout(150);
    return;
  }

  throw new Error('No selectable dropdown item found');
}

function getActiveSlideTextElements(state: any): any[] {
  const slideId = state.editor.activeSlideId;
  const slide = state.slides?.[slideId];
  if (!slide) return [];

  const order: string[] = Array.isArray(slide.elementOrder) ? slide.elementOrder : [];
  const elementsMap = slide.elements || {};
  return order
    .map((id) => elementsMap[id])
    .filter((el) => el && el.type === 'text');
}

function pickUserTextElement(state: any): any {
  const texts = getActiveSlideTextElements(state);
  const nonPlaceholder = texts.filter((t) => !t.isPlaceholder);
  return (nonPlaceholder.length ? nonPlaceholder : texts)[(nonPlaceholder.length ? nonPlaceholder : texts).length - 1];
}

test.describe('Typography UX (Strict Linking)', () => {
  let editor: EditorPage;
  let canvas: CanvasHelper;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    canvas = new CanvasHelper(page);
    await editor.goto();
    await editor.waitForLoad();
    await editor.waitForFonts();
  });

  test('Slide mode: shows Heading/Body labels and updates when typography preset changes', async ({ page }) => {
    // Ensure at least one slide exists
    const slideCount = await editor.getSlideCount();
    if (slideCount === 0) await editor.addSlide();
    await editor.selectSlide(0);

    // Deselect everything
    await editor.setActiveTool('select');
    await canvas.clickAt(0.95, 0.95);
    await page.waitForTimeout(200);

    const headingFont = editor.propertyInspector.locator('[data-testid="slide-typography-heading-font"]');
    const bodyFont = editor.propertyInspector.locator('[data-testid="slide-typography-body-font"]');

    await expect(headingFont).toBeVisible();
    await expect(bodyFont).toBeVisible();

    const initialHeading = (await headingFont.textContent())?.trim() || '';
    const initialBody = (await bodyFont.textContent())?.trim() || '';

    expect(initialHeading.length).toBeGreaterThan(0);
    expect(initialBody.length).toBeGreaterThan(0);

    // Deterministic update: pick two different presets from state and assign them
    const state = await editor.getState();
    const presets = Object.keys(state.typographyStylePresets || {});
    test.skip(presets.length === 0, 'No typography presets available in this build');

    const presetA = presets[0];
    const presetB = presets.find((id: string) => id !== presetA) || presetA;

    await editor.dispatchAction('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
      slideId: state.editor.activeSlideId,
      styleAssignments: { typographyStyle: presetA }
    });
    await page.waitForTimeout(250);

    const aState = await editor.getState();
    const aFonts = aState.typographyStylePresets?.[presetA]?.fonts;
    if (aFonts?.heading) await expect(headingFont).toHaveText(aFonts.heading);
    if (aFonts?.body) await expect(bodyFont).toHaveText(aFonts.body);

    await editor.dispatchAction('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
      slideId: aState.editor.activeSlideId,
      styleAssignments: { typographyStyle: presetB }
    });
    await page.waitForTimeout(250);

    const bState = await editor.getState();
    const bFonts = bState.typographyStylePresets?.[presetB]?.fonts;
    if (bFonts?.heading) await expect(headingFont).toHaveText(bFonts.heading);
    if (bFonts?.body) await expect(bodyFont).toHaveText(bFonts.body);
  });

  test('Text selected: applying a style locks typography controls; unlink keeps values and unlocks', async ({ page }) => {
    // Create a text element
    await editor.setActiveTool('text');
    await canvas.clickAt(0.3, 0.3);
    await page.keyboard.type('Styled text');
    // Commit & exit editing mode (more reliable than Escape)
    await canvas.clickAt(0.1, 0.1);

    // Select the created text element via store (most deterministic)
    let state = await editor.getState();
    const created = pickUserTextElement(state);
    expect(created?.id).toBeTruthy();
    await editor.dispatchAction('UPDATE_SELECTION', [created.id]);
    await page.waitForTimeout(200);

    await editor.setActiveTool('select');

    const styleDropdown = editor.propertyInspector.locator('[data-testid="text-style-dropdown"]');
    await expect(styleDropdown).toBeVisible();

    // Apply a style (prefer Title if available)
    await openDropdownAndPick(page, styleDropdown, 'Title');

    // Verify state has textStyleId set (on the element we created)
    const stateAfter = await editor.getState();
    const slideAfter = stateAfter.slides[stateAfter.editor.activeSlideId];
    const updated = slideAfter?.elements?.[created.id];
    expect(updated?.textStyleId).toBeTruthy();

    // Snapshot displayed values
    const fontFamilyText = (await editor.fontFamilySelect.locator('.dropdown-trigger').textContent())?.trim() || '';
    const fontWeightText = (await editor.fontWeightSelect.locator('.dropdown-trigger').textContent())?.trim() || '';
    const fontSizeVal = await editor.fontSizeInput.inputValue();
    const colorHexVal = (await editor.textColorHex.inputValue()).trim();

    // Typography-related controls should be locked, but text color remains editable.
    await expect(editor.textColorHex).toBeEnabled();
    await expect(editor.alignLeftBtn).toBeDisabled();

    const ffPointer = await editor.fontFamilySelect.evaluate((el: HTMLElement) => getComputedStyle(el).pointerEvents);
    expect(ffPointer).toBe('none');

    // Font dropdown should not open when locked
    const menuCountBefore = await page.locator('.dropdown-menu').count();
    await editor.fontFamilySelect.click({ force: true });
    await page.waitForTimeout(100);
    const menuCountAfter = await page.locator('.dropdown-menu').count();
    expect(menuCountAfter).toBe(menuCountBefore);

    // Style dropdown should still open (style switching allowed)
    await styleDropdown.click();
    await expect(page.locator('.dropdown-menu')).toBeVisible();
    await page.keyboard.press('Escape');

    // Unlink should keep values and unlock
    const unlinkBtn = editor.propertyInspector.locator('[data-testid="text-style-unlink"]');
    await expect(unlinkBtn).toBeVisible();
    await unlinkBtn.click();
    await page.waitForTimeout(250);

    await expect(editor.textColorHex).toBeEnabled();
    await expect(editor.alignLeftBtn).toBeEnabled();

    const ffPointerAfter = await editor.fontFamilySelect.evaluate((el: HTMLElement) => getComputedStyle(el).pointerEvents);
    expect(ffPointerAfter).toBe('auto');

    // Values displayed should remain the same right after unlink (appearance preserved)
    const fontFamilyText2 = (await editor.fontFamilySelect.locator('.dropdown-trigger').textContent())?.trim() || '';
    const fontWeightText2 = (await editor.fontWeightSelect.locator('.dropdown-trigger').textContent())?.trim() || '';
    const fontSizeVal2 = await editor.fontSizeInput.inputValue();
    const colorHexVal2 = (await editor.textColorHex.inputValue()).trim();

    expect(fontFamilyText2).toBe(fontFamilyText);
    expect(fontWeightText2).toBe(fontWeightText);
    expect(fontSizeVal2).toBe(fontSizeVal);
    expect(colorHexVal2).toBe(colorHexVal);

    // Verify state is detached
    const stateDetached = await editor.getState();
    const slideDetached = stateDetached.slides[stateDetached.editor.activeSlideId];
    const detachedEl = slideDetached?.elements?.[created.id];
    expect(detachedEl?.textStyleId).toBeFalsy();
  });

  test('Linked Title text updates when slide typography preset is overridden', async ({ page }) => {
    // Create a text element
    await editor.setActiveTool('text');
    await canvas.clickAt(0.35, 0.35);
    await page.keyboard.type('Cascade check');
    await canvas.clickAt(0.1, 0.1);

    // Select created element deterministically
    let state = await editor.getState();
    const created = pickUserTextElement(state);
    expect(created?.id).toBeTruthy();
    await editor.dispatchAction('UPDATE_SELECTION', [created.id]);
    await page.waitForTimeout(200);

    // Apply Title style (linked)
    const styleDropdown = editor.propertyInspector.locator('[data-testid="text-style-dropdown"]');
    await expect(styleDropdown).toBeVisible();
    await openDropdownAndPick(page, styleDropdown, 'Title');

    // Pick two different typography presets
    state = await editor.getState();
    const presets = Object.keys(state.typographyStylePresets || {});
    test.skip(presets.length < 2, 'Need at least 2 typography presets for cascade test');

    const presetA = presets[0];
    const presetB = presets.find((id: string) => id !== presetA) as string;

    // Force slide preset A then B
    await editor.dispatchAction('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
      slideId: state.editor.activeSlideId,
      styleAssignments: { typographyStyle: presetA }
    });
    await page.waitForTimeout(250);

    const stateA = await editor.getState();
    const expectedHeadingA = stateA.typographyStylePresets?.[presetA]?.fonts?.heading;

    await editor.dispatchAction('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
      slideId: stateA.editor.activeSlideId,
      styleAssignments: { typographyStyle: presetB }
    });
    await page.waitForTimeout(350);

    const stateB = await editor.getState();
    const expectedHeadingB = stateB.typographyStylePresets?.[presetB]?.fonts?.heading;

    // Assert something actually changed (avoid false positives)
    if (expectedHeadingA && expectedHeadingB) {
      expect(expectedHeadingB).not.toBe(expectedHeadingA);
    }

    // TextSection should update resolved values for linked text
    if (expectedHeadingB) {
      await expect(editor.fontFamilySelect.locator('.dropdown-trigger')).toHaveText(expectedHeadingB);
    }

    // Viewport should update the actual rendered font family
    const el = page.locator(`.slide-element[data-element-id="${created.id}"]`).first();
    await expect(el).toBeVisible();
    if (expectedHeadingB) {
      const computedFamily = await el.evaluate((node: HTMLElement) => getComputedStyle(node).fontFamily);
      expect(computedFamily).toContain(expectedHeadingB);
    }
  });

  test('Text selected: missing style is surfaced (Missing Style) and can be detached without breaking UI', async ({ page }) => {
    // Create a text element
    await editor.setActiveTool('text');
    await canvas.clickAt(0.4, 0.4);
    await page.keyboard.type('Missing style');
    await canvas.clickAt(0.1, 0.1);

    // Force its style id to a missing one via store
    const state = await editor.getState();
    const textEl = pickUserTextElement(state);
    expect(textEl).toBeTruthy();

    await editor.dispatchAction('UPDATE_ELEMENT', { id: textEl.id, textStyleId: 'missing-style-id' });

    // Select it so PI updates
    await editor.dispatchAction('UPDATE_SELECTION', [textEl.id]);
    await page.waitForTimeout(200);

    await editor.setActiveTool('select');
    await page.waitForTimeout(200);

    const styleDropdown = editor.propertyInspector.locator('[data-testid="text-style-dropdown"]');
    await styleDropdown.click();
    await page.waitForTimeout(100);

    await expect(page.locator('.dropdown-item').filter({ hasText: /Missing Style/ })).toBeVisible();

    // Detach by selecting No Style
    const noStyle = page.locator('.dropdown-item').filter({ hasText: 'No Style' }).first();
    await noStyle.click();
    await page.waitForTimeout(200);

    const stateAfter = await editor.getState();
    const slideAfter = stateAfter.slides[stateAfter.editor.activeSlideId];
    const updated = slideAfter?.elements?.[textEl.id];
    expect(updated.textStyleId).toBeFalsy();

    // Inspector should remain usable
    await expect(editor.fontSizeInput).toBeVisible();
  });
});
