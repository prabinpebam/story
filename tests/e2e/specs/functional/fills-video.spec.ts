import { test, expect } from '@playwright/test';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';

test.describe('Fills - Video System', () => {
  let editor: EditorPage;
  let canvas: CanvasHelper;

  test.beforeEach(async ({ page }) => {
    // Mock video element behavior to bypass codec issues in headless mode
    await page.addInitScript(() => {
        const originalCreateElement = document.createElement;
        // @ts-ignore
        document.createElement = function(tagName) {
            const element = originalCreateElement.call(document, tagName);
            if (tagName.toLowerCase() === 'video') {
                console.log('Mock: Creating video element');

                // Mock properties needed by MediaAssetManager
                Object.defineProperty(element, 'videoWidth', { value: 1920, writable: true });
                Object.defineProperty(element, 'videoHeight', { value: 1080, writable: true });
                Object.defineProperty(element, 'duration', { value: 10, writable: true });
                
                // Shadow event handlers to prevent browser from triggering real errors
                let _onloadedmetadata: any = null;
                Object.defineProperty(element, 'onloadedmetadata', {
                    get() { return _onloadedmetadata; },
                    set(val) { 
                        console.log('Mock: Setting onloadedmetadata');
                        _onloadedmetadata = val; 
                    }
                });

                let _onerror: any = null;
                Object.defineProperty(element, 'onerror', {
                    get() { return _onerror; },
                    set(val) { 
                        console.log('Mock: Setting onerror');
                        _onerror = val; 
                    }
                });
                
                // Intercept src setter to trigger success
                let _src = '';
                Object.defineProperty(element, 'src', {
                    get() { return _src; },
                    set(val) {
                        console.log('Mock: Setting src to', val);
                        _src = val;
                        setTimeout(() => {
                            console.log('Mock: Triggering loadedmetadata');
                            // Trigger our shadowed handler
                            // @ts-ignore
                            if (_onloadedmetadata) _onloadedmetadata(new Event('loadedmetadata'));
                            // Also dispatch event for addEventListener listeners
                            element.dispatchEvent(new Event('loadedmetadata'));
                        }, 50);
                    }
                });

                // Mock load method
                // @ts-ignore
                element.load = () => {
                    console.log('Mock: load() called');
                };

                return element;
            }
            return element;
        };
    });

    editor = new EditorPage(page);
    canvas = new CanvasHelper(page);
    
    await editor.goto();
    await editor.waitForLoad();
  });

  test('FL24: Switch Fill Type to Video', async ({ page }) => {
    // 1. Create a rectangle
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.1, 0.1, 0.2, 0.2);
    
    // 2. Open Fill Flyout
    const fillSection = page.locator('.pi-section', { hasText: 'Fill' });
    await fillSection.locator('.fill-swatch-trigger').click();
    
    // 3. Switch to Video Tab
    const flyout = page.locator('.fill-flyout');
    await flyout.locator('.fill-type-selector button[title="Video"]').click();
    
    // 4. Verify Video Tab UI
    const previewArea = flyout.locator('.media-preview-area');
    await expect(previewArea).toBeVisible();
    
    const emptyState = previewArea.locator('.media-empty-state');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('Drop video here');
  });

  test('FL25: Upload Video file', async ({ page }) => {
    page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));

    // 1. Create a rectangle
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.35, 0.1, 0.2, 0.2);
    
    // 2. Open Fill Flyout & Switch to Video
    const fillSection = page.locator('.pi-section', { hasText: 'Fill' });
    await fillSection.locator('.fill-swatch-trigger').click();
    
    const flyout = page.locator('.fill-flyout');
    await flyout.locator('.fill-type-selector button[title="Video"]').click();
    
    // 3. Upload Video
    const fileInput = flyout.locator('input[type="file"]');
    
    // Use a dummy buffer (content doesn't matter due to mock)
    const buffer = Buffer.from('dummy-video-content');
    
    await fileInput.setInputFiles({
      name: 'test-video.webm',
      mimeType: 'video/webm',
      buffer: buffer
    });
    
    // 4. Verify Video Loaded
    const previewArea = flyout.locator('.media-preview-area');
    const video = previewArea.locator('video');
    await expect(video).toBeVisible();
    
    // Verify empty state is gone
    const emptyState = previewArea.locator('.media-empty-state');
    await expect(emptyState).not.toBeVisible();
    
    // 5. Verify PI Swatch update
    // Close flyout
    await flyout.locator('button[title="Close"]').click();
    
    const piSwatch = fillSection.locator('.fill-swatch-trigger > .fill-preview').first();
    const icon = piSwatch.locator('i.fa-play');
    await expect(icon).toBeVisible();
  });
});
