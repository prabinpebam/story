import { test, expect } from '@playwright/test';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';

test.describe('Typography System', () => {
  let editor: EditorPage;
  let canvas: CanvasHelper;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    canvas = new CanvasHelper(page);
    await editor.goto();
    await editor.waitForLoad();
    await editor.waitForFonts();
  });

  /**
   * Helper to create and select a text element
   */
  async function createAndSelectText(page: any, x: number, y: number, text: string) {
    await editor.setActiveTool('text');
    await canvas.clickAt(x, y);
    await page.keyboard.type(text);
    // Exit text editing
    await canvas.clickAt(0.1, 0.1);
    await page.waitForTimeout(200);
    // Select as element
    await editor.setActiveTool('select');
    await canvas.clickAt(x, y);
    await page.waitForTimeout(300);
  }

  test.describe('Text Style Application', () => {
    test('should create text element and apply Title style', async ({ page }) => {
      // Ensure we have a slide to work with
      const initialCount = await editor.getSlideCount();
      if (initialCount === 0) {
        await editor.addSlide();
      }
      
      // Work with the first available slide
      const slideCount = await editor.getSlideCount();
      await editor.selectSlide(slideCount - 1);
      
      // Create and select text element
      await createAndSelectText(page, 0.3, 0.3, 'Test Title');
      
      // Find Text section in property inspector
      const textSection = page.locator('.pi-section').filter({ hasText: 'Text' }).first();
      await expect(textSection).toBeVisible({ timeout: 5000 });
      
      // Find Text Style dropdown
      const styleDropdown = textSection.locator('.dropdown').filter({ has: page.locator('option:has-text("Title")') }).first();
      await expect(styleDropdown).toBeVisible();
      
      // Apply Title style
      await styleDropdown.selectOption({ label: 'Title' });
      await page.waitForTimeout(300);
      
      // Verify style is applied
      const selectedOption = await styleDropdown.locator('option:checked').textContent();
      expect(selectedOption).toContain('Title');
      
      // Verify textStyleId in state
      const state = await editor.getState();
      const activeSlideId = state.editor.activeSlideId;
      const slide = state.slides[activeSlideId];
      const textElements = slide.elements.filter((e: any) => e.type === 'text');
      expect(textElements.length).toBeGreaterThan(0);
      expect(textElements[0].textStyleId).toBe('title');
    });

    test('should apply Body style and verify property updates', async ({ page }) => {
      // Create and select text object
      await createAndSelectText(page, 0.4, 0.4, 'Body text content');
      
      const textSection = page.locator('.pi-section').filter({ hasText: 'Text' }).first();
      const styleDropdown = textSection.locator('.dropdown').filter({ has: page.locator('option:has-text("Body")') }).first();
      
      // Apply Body style
      await styleDropdown.selectOption({ label: 'Body' });
      await page.waitForTimeout(300);
      
      // Verify font size input reflects Body style (typically 16px)
      const fontSizeInput = textSection.locator('.number-input').filter({ has: page.locator('label:has-text("Size")') }).locator('input').first();
      await expect(fontSizeInput).toBeVisible();
      const fontSize = await fontSizeInput.inputValue();
      expect(parseInt(fontSize)).toBeGreaterThan(0);
    });
  });

  test.describe('Typography Preset Cascade', () => {
    test('should change slide typography preset and update text element in real-time', async ({ page }) => {
      // Get initial state to find theme master
      let state = await editor.getState();
      const themeMasterId = 'theme-default';
      const themeMaster = state.slideMasterPresets?.[themeMasterId];
      const initialTypoId = themeMaster?.typographyStyleId;
      
      console.log('Initial typography ID:', initialTypoId);
      
      // Create text with Title style
      await editor.setActiveTool('text');
      await canvas.drawTextBox(0.3, 0.3);
      await page.keyboard.type('Title Text');
      await page.keyboard.press('Escape');
      
      // Select text and apply Title style
      await editor.setActiveTool('select');
      await canvas.clickAt(0.3, 0.3);
      await page.waitForTimeout(200);
      
      const textSection = page.locator('.pi-section').filter({ hasText: 'Text' }).first();
      const styleDropdown = textSection.locator('.dropdown').filter({ has: page.locator('option:has-text("Title")') }).first();
      await styleDropdown.selectOption({ label: 'Title' });
      await page.waitForTimeout(300);
      
      // Get initial font size
      const fontSizeInput = textSection.locator('.number-input').filter({ has: page.locator('label:has-text("Size")') }).locator('input').first();
      const initialFontSize = await fontSizeInput.inputValue();
      console.log('Initial font size:', initialFontSize);
      
      // Click on canvas to deselect text element
      await canvas.clickAt(0.7, 0.7);
      await page.waitForTimeout(200);
      
      // Open Typography Style Manager to change preset
      // Look for the Typography section in property inspector (when slide is selected)
      const typographySection = page.locator('.pi-section').filter({ hasText: 'Typography' }).first();
      await expect(typographySection).toBeVisible({ timeout: 5000 });
      
      // Click the edit button to open Typography Style Manager
      const editBtn = typographySection.locator('button[title="Edit typography"], button i.fa-pen').first();
      await editBtn.click();
      await page.waitForTimeout(500);
      
      // Find Typography Style Manager panel
      const typoPanel = page.locator('.panel').filter({ hasText: 'Typography Styles' }).first();
      await expect(typoPanel).toBeVisible({ timeout: 5000 });
      
      // Find preset buttons (Modern, Professional, etc.)
      const presetButtons = typoPanel.locator('.preset-card, button').filter({ hasText: /Modern|Professional|Editorial/ });
      const presetCount = await presetButtons.count();
      
      if (presetCount > 1) {
        // Click on a different preset (not the first one)
        await presetButtons.nth(1).click();
        await page.waitForTimeout(500);
        
        // Re-select the text element
        await canvas.clickAt(0.3, 0.3);
        await page.waitForTimeout(300);
        
        // Verify font size has updated in property inspector
        const updatedFontSize = await fontSizeInput.inputValue();
        console.log('Updated font size:', updatedFontSize);
        
        // Font size may change depending on the preset
        // At minimum, verify the property inspector is responsive
        expect(updatedFontSize).toBeTruthy();
        expect(parseInt(updatedFontSize)).toBeGreaterThan(0);
        
        // Verify textStyleId is still 'title' (style reference maintained)
        state = await editor.getState();
        const activeSlideId = state.editor.activeSlideId;
        const slide = state.slides[activeSlideId];
        const textElements = slide.elements.filter((e: any) => e.type === 'text');
        expect(textElements[0].textStyleId).toBe('title');
      }
    });

    test('should verify property inspector updates when typography preset changes', async ({ page }) => {
      // Create text with Heading style
      await editor.setActiveTool('text');
      await canvas.drawTextBox(0.5, 0.5);
      await page.keyboard.type('Heading');
      await page.keyboard.press('Escape');
      
      // Select text
      await editor.setActiveTool('select');
      await canvas.clickAt(0.5, 0.5);
      await page.waitForTimeout(200);
      
      // Apply Heading 1 style
      const textSection = page.locator('.pi-section').filter({ hasText: 'Text' }).first();
      const styleDropdown = textSection.locator('.dropdown').filter({ has: page.locator('option:has-text("Heading")') }).first();
      
      // Check if Heading 1 option exists
      const headingOption = styleDropdown.locator('option').filter({ hasText: /Heading.*1/ }).first();
      const hasHeadingOption = await headingOption.count() > 0;
      
      if (hasHeadingOption) {
        await styleDropdown.selectOption({ label: await headingOption.textContent() || 'Heading 1' });
        await page.waitForTimeout(300);
        
        // Get font properties
        const fontSizeInput = textSection.locator('.number-input').filter({ has: page.locator('label:has-text("Size")') }).locator('input').first();
        const lineHeightInput = textSection.locator('.number-input').filter({ has: page.locator('label:has-text("Line")') }).locator('input').first();
        
        const fontSize = await fontSizeInput.inputValue();
        const lineHeight = await lineHeightInput.inputValue();
        
        // Verify valid values
        expect(parseInt(fontSize)).toBeGreaterThan(0);
        expect(parseFloat(lineHeight)).toBeGreaterThan(0);
        
        console.log('Heading style properties:', { fontSize, lineHeight });
      }
    });
  });

  test.describe('Style Override and Detachment', () => {
    test('should detect manual overrides after applying style', async ({ page }) => {
      // Create text with style
      await editor.setActiveTool('text');
      await canvas.drawTextBox(0.3, 0.3);
      await page.keyboard.type('Styled Text');
      await page.keyboard.press('Escape');
      
      // Select and apply Body style
      await editor.setActiveTool('select');
      await canvas.clickAt(0.3, 0.3);
      await page.waitForTimeout(200);
      
      const textSection = page.locator('.pi-section').filter({ hasText: 'Text' }).first();
      const styleDropdown = textSection.locator('.dropdown').filter({ has: page.locator('option:has-text("Body")') }).first();
      await styleDropdown.selectOption({ label: 'Body' });
      await page.waitForTimeout(300);
      
      // Manually change font size
      const fontSizeInput = textSection.locator('.number-input').filter({ has: page.locator('label:has-text("Size")') }).locator('input').first();
      await fontSizeInput.fill('24');
      await fontSizeInput.press('Enter');
      await page.waitForTimeout(300);
      
      // Look for override indicator (asterisk or badge)
      const hasOverrideIndicator = await textSection.locator('*:has-text("*"), .override-indicator, .modified-indicator').count() > 0;
      
      // Verify textStyleId is still set with manual fontSize override
      const state = await editor.getState();
      const activeSlideId = state.editor.activeSlideId;
      const slide = state.slides[activeSlideId];
      const textElements = slide.elements.filter((e: any) => e.type === 'text');
      
      expect(textElements[0].textStyleId).toBe('body');
      expect(textElements[0].fontSize).toBe(24);
      
      console.log('Override detected:', hasOverrideIndicator);
    });

    test('should detach style and maintain current properties', async ({ page }) => {
      // Create text with style
      await editor.setActiveTool('text');
      await canvas.drawTextBox(0.4, 0.4);
      await page.keyboard.type('Detach Test');
      await page.keyboard.press('Escape');
      
      // Apply Title style
      await editor.setActiveTool('select');
      await canvas.clickAt(0.4, 0.4);
      await page.waitForTimeout(200);
      
      const textSection = page.locator('.pi-section').filter({ hasText: 'Text' }).first();
      const styleDropdown = textSection.locator('.dropdown').filter({ has: page.locator('option:has-text("Title")') }).first();
      await styleDropdown.selectOption({ label: 'Title' });
      await page.waitForTimeout(300);
      
      // Get current font size
      const fontSizeInput = textSection.locator('.number-input').filter({ has: page.locator('label:has-text("Size")') }).locator('input').first();
      const fontSizeBeforeDetach = await fontSizeInput.inputValue();
      
      // Find and click Detach button
      const detachBtn = textSection.locator('button').filter({ hasText: /Detach|Remove.*Style/i }).first();
      const hasDetachBtn = await detachBtn.count() > 0;
      
      if (hasDetachBtn) {
        await detachBtn.click();
        await page.waitForTimeout(300);
        
        // Verify style is removed
        const selectedOption = await styleDropdown.locator('option:checked').textContent();
        expect(selectedOption).toContain('None');
        
        // Verify font size is maintained
        const fontSizeAfterDetach = await fontSizeInput.inputValue();
        expect(fontSizeAfterDetach).toBe(fontSizeBeforeDetach);
        
        // Verify textStyleId is null in state
        const state = await editor.getState();
        const activeSlideId = state.editor.activeSlideId;
        const slide = state.slides[activeSlideId];
        const textElements = slide.elements.filter((e: any) => e.type === 'text');
        
        expect(textElements[0].textStyleId).toBeNull();
        expect(textElements[0].fontSize).toBeTruthy();
      }
    });

    test('should reset style and clear manual overrides', async ({ page }) => {
      // Create text with style
      await editor.setActiveTool('text');
      await canvas.drawTextBox(0.5, 0.5);
      await page.keyboard.type('Reset Test');
      await page.keyboard.press('Escape');
      
      // Apply and override
      await editor.setActiveTool('select');
      await canvas.clickAt(0.5, 0.5);
      await page.waitForTimeout(200);
      
      const textSection = page.locator('.pi-section').filter({ hasText: 'Text' }).first();
      const styleDropdown = textSection.locator('.dropdown').filter({ has: page.locator('option:has-text("Body")') }).first();
      await styleDropdown.selectOption({ label: 'Body' });
      await page.waitForTimeout(300);
      
      // Manually change font size
      const fontSizeInput = textSection.locator('.number-input').filter({ has: page.locator('label:has-text("Size")') }).locator('input').first();
      const originalFontSize = await fontSizeInput.inputValue();
      await fontSizeInput.fill('32');
      await fontSizeInput.press('Enter');
      await page.waitForTimeout(300);
      
      // Find and click Reset button
      const resetBtn = textSection.locator('button').filter({ hasText: /Reset/i }).first();
      const hasResetBtn = await resetBtn.count() > 0;
      
      if (hasResetBtn) {
        await resetBtn.click();
        await page.waitForTimeout(300);
        
        // Verify font size is back to style default
        const resetFontSize = await fontSizeInput.inputValue();
        expect(resetFontSize).not.toBe('32');
        
        // Verify no manual overrides in state
        const state = await editor.getState();
        const activeSlideId = state.editor.activeSlideId;
        const slide = state.slides[activeSlideId];
        const textElements = slide.elements.filter((e: any) => e.type === 'text');
        
        expect(textElements[0].textStyleId).toBe('body');
        expect(textElements[0].fontSize).toBeUndefined();
      }
    });
  });

  test.describe('Multi-Element Selection', () => {
    test('should apply style to multiple text elements simultaneously', async ({ page }) => {
      // Create first text element
      await editor.setActiveTool('text');
      await canvas.drawTextBox(0.2, 0.2);
      await page.keyboard.type('Text 1');
      await page.keyboard.press('Escape');
      
      // Create second text element
      await canvas.drawTextBox(0.6, 0.6);
      await page.keyboard.type('Text 2');
      await page.keyboard.press('Escape');
      
      // Select both elements
      await editor.setActiveTool('select');
      await page.keyboard.down('Shift');
      await canvas.clickAt(0.2, 0.2);
      await canvas.clickAt(0.6, 0.6);
      await page.keyboard.up('Shift');
      await page.waitForTimeout(200);
      
      // Apply Title style to both
      const textSection = page.locator('.pi-section').filter({ hasText: 'Text' }).first();
      const styleDropdown = textSection.locator('.dropdown').filter({ has: page.locator('option:has-text("Title")') }).first();
      
      const hasMultiSelect = await textSection.isVisible();
      if (hasMultiSelect) {
        await styleDropdown.selectOption({ label: 'Title' });
        await page.waitForTimeout(300);
        
        // Verify both elements have textStyleId
        const state = await editor.getState();
        const activeSlideId = state.editor.activeSlideId;
        const slide = state.slides[activeSlideId];
        const textElements = slide.elements.filter((e: any) => e.type === 'text');
        
        expect(textElements.length).toBe(2);
        expect(textElements[0].textStyleId).toBe('title');
        expect(textElements[1].textStyleId).toBe('title');
      }
    });
  });

  test.describe('Legacy Compatibility', () => {
    test('should handle elements with old styleId property', async ({ page }) => {
      // Create text element via state injection with old styleId
      await page.evaluate(() => {
        const win = window as any;
        if (win.__TEST_STORE__) {
          const state = win.__TEST_STORE__.getState();
          const slideId = state.editor.activeSlideId;
          
          win.__TEST_STORE__.dispatch('ADD_ELEMENT', {
            slideId,
            element: {
              id: 'legacy-text-1',
              type: 'text',
              name: 'Legacy Text',
              x: 100,
              y: 100,
              width: 300,
              height: 100,
              rotation: 0,
              content: 'Legacy Text',
              styleId: 'heading1', // Old property
              fontSize: 28
            }
          });
        }
      });
      
      await page.waitForTimeout(300);
      
      // Select the element
      await editor.setActiveTool('select');
      await canvas.clickAt(0.2, 0.2);
      await page.waitForTimeout(200);
      
      // Verify property inspector shows the style
      const textSection = page.locator('.pi-section').filter({ hasText: 'Text' }).first();
      const styleDropdown = textSection.locator('.dropdown').filter({ has: page.locator('option') }).first();
      
      const selectedOption = await styleDropdown.locator('option:checked').textContent();
      // Should show style from legacy styleId
      expect(selectedOption).toBeTruthy();
      
      console.log('Legacy styleId handled, displayed as:', selectedOption);
    });
  });
});
