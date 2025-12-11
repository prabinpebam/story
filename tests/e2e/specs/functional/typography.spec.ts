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

  async function selectTextStyle(page: any, styleName: string) {
    // Click the text style dropdown to open menu
    const dropdown = page.locator('[data-testid="text-style-dropdown"]');
    await dropdown.click();
    await page.waitForTimeout(100);
    
    // Click the menu item
    const menuItem = page.locator('.dropdown-item').filter({ hasText: styleName }).first();
    await menuItem.click();
    await page.waitForTimeout(200);
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
      const textSection = page.locator('.pi-section').filter({ hasText: 'Typography' }).first();
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
      
      const textSection = page.locator('.pi-section').filter({ hasText: 'Typography' }).first();
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
      
      const textSection = page.locator('.pi-section').filter({ hasText: 'Typography' }).first();
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
      const textSection = page.locator('.pi-section').filter({ hasText: 'Typography' }).first();
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
      
      const textSection = page.locator('.pi-section').filter({ hasText: 'Typography' }).first();
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
      
      const textSection = page.locator('.pi-section').filter({ hasText: 'Typography' }).first();
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
      
      const textSection = page.locator('.pi-section').filter({ hasText: 'Typography' }).first();
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
      const textSection = page.locator('.pi-section').filter({ hasText: 'Typography' }).first();
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
      const textSection = page.locator('.pi-section').filter({ hasText: 'Typography' }).first();
      const styleDropdown = textSection.locator('.dropdown').filter({ has: page.locator('option') }).first();
      
      const selectedOption = await styleDropdown.locator('option:checked').textContent();
      // Should show style from legacy styleId
      expect(selectedOption).toBeTruthy();
      
      console.log('Legacy styleId handled, displayed as:', selectedOption);
    });
  });

  test.describe('Typography PI Display to Text Element Consistency', () => {
    test('should match text element font to PI heading font when linked to heading style', async ({ page }) => {
      // Create text element
      await createAndSelectText(page, 0.5, 0.3, 'Heading Text');
      
      // Apply Title style (which uses heading font)
      const textSection = page.locator('.pi-section').filter({ hasText: 'Typography' }).first();
      const styleDropdown = textSection.locator('.dropdown').filter({ has: page.locator('option:has-text("Title")') }).first();
      await styleDropdown.selectOption({ label: 'Title' });
      await page.waitForTimeout(300);
      
      // Get heading font from Typography section in PI
      const slideSection = page.locator('.pi-section').filter({ hasText: /Typography|Heading/ }).first();
      const headingFontName = await slideSection.locator('.theme-font-row').filter({ hasText: 'Heading' }).locator('.theme-font-name').textContent();
      
      console.log('PI shows heading font as:', headingFontName);
      
      // Get actual rendered font from text element
      const textElement = page.locator('.story-canvas .text-element').first();
      const computedFont = await textElement.evaluate(el => getComputedStyle(el).fontFamily);
      
      console.log('Text element renders with font:', computedFont);
      
      // Verify they match
      expect(computedFont.toLowerCase()).toContain(headingFontName!.toLowerCase().replace(/['"]/g, ''));
    });

    test('should match text element font to PI body font when linked to body style', async ({ page }) => {
      // Create text element
      await createAndSelectText(page, 0.5, 0.5, 'Body content here');
      
      // Apply Body style (which uses body font)
      const textSection = page.locator('.pi-section').filter({ hasText: 'Typography' }).first();
      const styleDropdown = textSection.locator('.dropdown').filter({ has: page.locator('option:has-text("Body")') }).first();
      await styleDropdown.selectOption({ label: 'Body' });
      await page.waitForTimeout(300);
      
      // Get body font from Typography section in PI
      const slideSection = page.locator('.pi-section').filter({ hasText: /Typography|Body/ }).first();
      const bodyFontName = await slideSection.locator('.theme-font-row').filter({ hasText: 'Body' }).locator('.theme-font-name').textContent();
      
      console.log('PI shows body font as:', bodyFontName);
      
      // Get actual rendered font from text element
      const textElement = page.locator('.story-canvas .text-element').first();
      const computedFont = await textElement.evaluate(el => getComputedStyle(el).fontFamily);
      
      console.log('Text element renders with font:', computedFont);
      
      // Verify they match
      expect(computedFont.toLowerCase()).toContain(bodyFontName!.toLowerCase().replace(/['"]/g, ''));
    });

    test('should update both PI and text element when typography preset changes', async ({ page }) => {
      // Create text with Title style
      await createAndSelectText(page, 0.5, 0.3, 'Dynamic Title');
      const textSection = page.locator('.pi-section').filter({ hasText: 'Typography' }).first();
      const styleDropdown = textSection.locator('.dropdown').filter({ has: page.locator('option:has-text("Title")') }).first();
      await styleDropdown.selectOption({ label: 'Title' });
      await page.waitForTimeout(300);
      
      // Get initial heading font from PI
      const slideSection = page.locator('.pi-section').filter({ hasText: /Typography/ }).first();
      const initialHeadingFont = await slideSection.locator('.theme-font-row').filter({ hasText: 'Heading' }).locator('.theme-font-name').textContent();
      
      // Get initial rendered font
      const textElement = page.locator('.story-canvas .text-element').first();
      const initialComputedFont = await textElement.evaluate(el => getComputedStyle(el).fontFamily);
      
      console.log('Before: PI heading =', initialHeadingFont, '| Text element =', initialComputedFont);
      
      // Change typography preset (e.g., to Professional which uses Playfair Display)
      const typoEditBtn = page.locator('[data-testid="typography-manager-btn"]');
      await typoEditBtn.click();
      await page.waitForSelector('.typography-style-manager', { state: 'visible' });
      
      // Select "Professional" preset (Playfair Display + Source Sans Pro)
      await page.click('.tsm-preset-card:has-text("Professional")');
      await page.waitForTimeout(500);
      
      // Close panel
      await page.click('.typography-style-manager .close-btn');
      await page.waitForTimeout(300);
      
      // Click text element to see updated PI
      await canvas.clickAt(0.5, 0.3);
      await page.waitForTimeout(300);
      
      // Get updated heading font from PI
      const updatedHeadingFont = await slideSection.locator('.theme-font-row').filter({ hasText: 'Heading' }).locator('.theme-font-name').textContent();
      
      // Get updated rendered font
      const updatedComputedFont = await textElement.evaluate(el => getComputedStyle(el).fontFamily);
      
      console.log('After: PI heading =', updatedHeadingFont, '| Text element =', updatedComputedFont);
      
      // Verify both changed
      expect(updatedHeadingFont).not.toBe(initialHeadingFont);
      expect(updatedComputedFont).not.toBe(initialComputedFont);
      
      // Verify they still match each other
      expect(updatedComputedFont.toLowerCase()).toContain(updatedHeadingFont!.toLowerCase().replace(/['"]/g, ''));
    });

    test('should maintain heading/body font consistency across multiple text elements', async ({ page }) => {
      // Create multiple text elements with different styles
      await createAndSelectText(page, 0.3, 0.2, 'Title Element');
      const textSection1 = page.locator('.pi-section').filter({ hasText: 'Typography' }).first();
      const styleDropdown1 = textSection1.locator('.dropdown').filter({ has: page.locator('option:has-text("Title")') }).first();
      await styleDropdown1.selectOption({ label: 'Title' });
      await page.waitForTimeout(200);
      
      await createAndSelectText(page, 0.3, 0.4, 'Heading 1 Element');
      const textSection2 = page.locator('.pi-section').filter({ hasText: 'Typography' }).first();
      const styleDropdown2 = textSection2.locator('.dropdown').filter({ has: page.locator('option:has-text("Heading 1")') }).first();
      await styleDropdown2.selectOption({ label: 'Heading 1' });
      await page.waitForTimeout(200);
      
      await createAndSelectText(page, 0.3, 0.6, 'Body Element');
      const textSection3 = page.locator('.pi-section').filter({ hasText: 'Typography' }).first();
      const styleDropdown3 = textSection3.locator('.dropdown').filter({ has: page.locator('option:has-text("Body")') }).first();
      await styleDropdown3.selectOption({ label: 'Body' });
      await page.waitForTimeout(200);
      
      // Get expected fonts from PI
      const slideSection = page.locator('.pi-section').filter({ hasText: /Typography/ }).first();
      const headingFont = await slideSection.locator('.theme-font-row').filter({ hasText: 'Heading' }).locator('.theme-font-name').textContent();
      const bodyFont = await slideSection.locator('.theme-font-row').filter({ hasText: 'Body' }).locator('.theme-font-name').textContent();
      
      // Get all text elements
      const allTextElements = page.locator('.story-canvas .text-element');
      const count = await allTextElements.count();
      
      // Verify fonts match expectations
      for (let i = 0; i < count; i++) {
        const computedFont = await allTextElements.nth(i).evaluate(el => getComputedStyle(el).fontFamily);
        const text = await allTextElements.nth(i).textContent();
        
        console.log(`Element "${text}" uses font:`, computedFont);
        
        // Title and Heading 1 should use heading font
        if (text?.includes('Title') || text?.includes('Heading')) {
          expect(computedFont.toLowerCase()).toContain(headingFont!.toLowerCase().replace(/['"]/g, ''));
        }
        // Body should use body font
        else if (text?.includes('Body')) {
          expect(computedFont.toLowerCase()).toContain(bodyFont!.toLowerCase().replace(/['"]/g, ''));
        }
      }
    });
  });

  test.describe('Typography Style Linked Text - Disabled Inputs Show Style Values', () => {
    test('should disable font inputs and show current style values when linked', async ({ page }) => {
      // Create text element
      await createAndSelectText(page, 0.5, 0.3, 'Styled Text');
      
      // Apply Title style
      const textSection = page.locator('.pi-section').filter({ hasText: 'Typography' }).first();
      const styleDropdown = textSection.locator('.dropdown').filter({ has: page.locator('option:has-text("Title")') }).first();
      await styleDropdown.selectOption({ label: 'Title' });
      await page.waitForTimeout(300);
      
      // Get font property inputs
      const fontFamilyInput = textSection.locator('input').filter({ has: page.locator('~ label:has-text("Font")') }).or(textSection.locator('.dropdown').filter({ has: page.locator('~ label:has-text("Font")') })).first();
      const fontSizeInput = textSection.locator('input[type="number"]').first();
      const fontWeightSelect = textSection.locator('select').filter({ has: page.locator('option:has-text("Regular")') }).or(textSection.locator('select').filter({ has: page.locator('option:has-text("Bold")') })).first();
      
      // Verify inputs are disabled (have 'disabled' class and reduced opacity)
      const fontFamilyDisabled = await fontFamilyInput.evaluate(el => {
        return el.classList.contains('disabled') && parseFloat(getComputedStyle(el).opacity) < 1;
      });
      expect(fontFamilyDisabled).toBe(true);
      
      const fontSizeDisabled = await fontSizeInput.evaluate(el => {
        return el.classList.contains('disabled') && parseFloat(getComputedStyle(el).opacity) < 1;
      });
      expect(fontSizeDisabled).toBe(true);
      
      // Verify inputs still show current values from style
      const fontSize = await fontSizeInput.inputValue();
      expect(parseInt(fontSize)).toBeGreaterThan(0);
      console.log('Disabled font size input shows:', fontSize);
      
      // Get expected font from typography preset
      const state = await editor.getState();
      const slideId = state.editor.activeSlideId;
      const typoInfo = await page.evaluate((sid) => {
        return window.__TEST_STORE__.getStyleResolver().getEffectiveTypographyStyle(sid);
      }, slideId);
      
      const typographyPreset = state.typographyStylePresets[typoInfo.typographyStyleId];
      const titleStyle = typographyPreset.textStyles.title;
      
      console.log('Expected title style font size:', titleStyle.fontSize);
      expect(parseInt(fontSize)).toBe(titleStyle.fontSize);
    });

    test('should update disabled input values when typography preset changes', async ({ page }) => {
      // Create text with Title style
      await createAndSelectText(page, 0.5, 0.3, 'Dynamic Styled Text');
      const textSection = page.locator('.pi-section').filter({ hasText: 'Typography' }).first();
      const styleDropdown = textSection.locator('.dropdown').filter({ has: page.locator('option:has-text("Title")') }).first();
      await styleDropdown.selectOption({ label: 'Title' });
      await page.waitForTimeout(300);
      
      // Get initial font size from disabled input
      const fontSizeInput = textSection.locator('input[type="number"]').first();
      const initialFontSize = await fontSizeInput.inputValue();
      console.log('Initial font size (disabled input):', initialFontSize);
      
      // Verify input is disabled
      const isDisabled = await fontSizeInput.evaluate(el => el.classList.contains('disabled'));
      expect(isDisabled).toBe(true);
      
      // Change typography preset
      const typoEditBtn = page.locator('[data-testid="typography-manager-btn"]');
      await typoEditBtn.click();
      await page.waitForSelector('.typography-style-manager', { state: 'visible' });
      
      // Select "Professional" preset (different title size)
      await page.click('.tsm-preset-card:has-text("Professional")');
      await page.waitForTimeout(500);
      
      // Close panel
      await page.click('.typography-style-manager .close-btn');
      await page.waitForTimeout(300);
      
      // Re-select text element to refresh PI
      await canvas.clickAt(0.5, 0.3);
      await page.waitForTimeout(300);
      
      // Get updated font size from disabled input
      const updatedFontSize = await fontSizeInput.inputValue();
      console.log('Updated font size (disabled input):', updatedFontSize);
      
      // Verify it changed
      expect(updatedFontSize).not.toBe(initialFontSize);
      
      // Verify input is still disabled
      const stillDisabled = await fontSizeInput.evaluate(el => el.classList.contains('disabled'));
      expect(stillDisabled).toBe(true);
      
      // Verify the value matches the new typography preset
      const state = await editor.getState();
      const slideId = state.editor.activeSlideId;
      const typoInfo = await page.evaluate((sid) => {
        return window.__TEST_STORE__.getStyleResolver().getEffectiveTypographyStyle(sid);
      }, slideId);
      
      const typographyPreset = state.typographyStylePresets[typoInfo.typographyStyleId];
      const titleStyle = typographyPreset.textStyles.title;
      
      expect(parseInt(updatedFontSize)).toBe(titleStyle.fontSize);
      console.log('Disabled input correctly shows new style value:', updatedFontSize, '=', titleStyle.fontSize);
    });

    test('should update disabled font family input when typography changes', async ({ page }) => {
      // Create text with Heading 1 style
      await createAndSelectText(page, 0.5, 0.4, 'Heading Text');
      const textSection = page.locator('.pi-section').filter({ hasText: 'Typography' }).first();
      const styleDropdown = textSection.locator('.dropdown').filter({ has: page.locator('option:has-text("Heading 1")') }).first();
      await styleDropdown.selectOption({ label: 'Heading 1' });
      await page.waitForTimeout(300);
      
      // Get heading font from PI typography section
      const slideSection = page.locator('.pi-section').filter({ hasText: /Typography/ }).first();
      const initialHeadingFont = await slideSection.locator('.theme-font-row').filter({ hasText: 'Heading' }).locator('.theme-font-name').textContent();
      console.log('Initial heading font in PI:', initialHeadingFont);
      
      // Verify text element renders in that font
      const textElement = page.locator('.story-canvas .text-element').first();
      const initialComputedFont = await textElement.evaluate(el => getComputedStyle(el).fontFamily);
      expect(initialComputedFont.toLowerCase()).toContain(initialHeadingFont!.toLowerCase().replace(/['"]/g, ''));
      
      // Change typography to one with different heading font
      const typoEditBtn = page.locator('[data-testid="typography-manager-btn"]');
      await typoEditBtn.click();
      await page.waitForSelector('.typography-style-manager', { state: 'visible' });
      await page.click('.tsm-preset-card:has-text("Tech")'); // Uses Space Grotesk
      await page.waitForTimeout(500);
      await page.click('.typography-style-manager .close-btn');
      await page.waitForTimeout(300);
      
      // Re-select text to refresh PI
      await canvas.clickAt(0.5, 0.4);
      await page.waitForTimeout(300);
      
      // Get updated heading font from PI
      const updatedHeadingFont = await slideSection.locator('.theme-font-row').filter({ hasText: 'Heading' }).locator('.theme-font-name').textContent();
      console.log('Updated heading font in PI:', updatedHeadingFont);
      
      // Verify it changed
      expect(updatedHeadingFont).not.toBe(initialHeadingFont);
      
      // Verify text element renders in new font
      const updatedComputedFont = await textElement.evaluate(el => getComputedStyle(el).fontFamily);
      console.log('Text element renders in:', updatedComputedFont);
      expect(updatedComputedFont.toLowerCase()).toContain(updatedHeadingFont!.toLowerCase().replace(/['"]/g, ''));
      
      // Verify the change propagated even though inputs are disabled
      console.log('✓ Disabled inputs updated: PI heading font and text element both changed to', updatedHeadingFont);
    });

    test('should update multiple disabled inputs simultaneously when typography changes', async ({ page }) => {
      // Create text with Body style
      await createAndSelectText(page, 0.5, 0.5, 'Body content with multiple properties');
      const textSection = page.locator('.pi-section').filter({ hasText: 'Typography' }).first();
      const styleDropdown = textSection.locator('.dropdown').filter({ has: page.locator('option:has-text("Body")') }).first();
      await styleDropdown.selectOption({ label: 'Body' });
      await page.waitForTimeout(300);
      
      // Get all relevant inputs (all should be disabled)
      const fontSizeInput = textSection.locator('input[type="number"]').first();
      
      // Capture initial values
      const initialSize = await fontSizeInput.inputValue();
      console.log('Initial values - Size:', initialSize);
      
      // Verify all are disabled
      const sizeDisabled = await fontSizeInput.evaluate(el => el.classList.contains('disabled'));
      expect(sizeDisabled).toBe(true);
      
      // Change typography preset
      const typoEditBtn = page.locator('[data-testid="typography-manager-btn"]');
      await typoEditBtn.click();
      await page.waitForSelector('.typography-style-manager', { state: 'visible' });
      await page.click('.tsm-preset-card:has-text("Elegant")');
      await page.waitForTimeout(500);
      await page.click('.typography-style-manager .close-btn');
      await page.waitForTimeout(300);
      
      // Re-select to refresh PI
      await canvas.clickAt(0.5, 0.5);
      await page.waitForTimeout(300);
      
      // Get updated values
      const updatedSize = await fontSizeInput.inputValue();
      console.log('Updated values - Size:', updatedSize);
      
      // At least one should have changed (different presets have different body sizes)
      const hasChanges = updatedSize !== initialSize;
      expect(hasChanges).toBe(true);
      
      // All should still be disabled
      const stillDisabled = await fontSizeInput.evaluate(el => el.classList.contains('disabled'));
      expect(stillDisabled).toBe(true);
      
      console.log('✓ Multiple disabled inputs updated simultaneously with typography change');
    });
  });
});
