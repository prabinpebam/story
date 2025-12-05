# Canvas Testing Guide

## 1. The Challenge
Story renders slides using a custom canvas-based system (`BaseRenderer`, `SlideView`, `CanvasManager`). Unlike standard DOM-based apps, you cannot use CSS selectors like `.button` or `#text-field` to interact with canvas elements.

**Canvas Rendering Architecture:**
- The visible canvas is an HTML `<canvas>` element or a DIV with absolutely positioned DOM elements.
- Elements (shapes, text, images) are rendered as child DIVs with `data-element-id` attributes.
- Transformations (position, size, rotation) are applied via inline styles or CSS transforms.

## 2. Interaction Strategies

### 2.1 Locating Canvas Elements
Elements rendered inside the canvas have `data-element-id` attributes:

```typescript
// Locate an element by its ID
const textElement = page.locator('[data-element-id="text-123"]');
await expect(textElement).toBeVisible();
```

**Best Practice:** Ensure all canvas elements have `data-element-id` set in `ShapeElement.js`, `TextElement.js`, etc.

### 2.2 Coordinate-Based Interactions
For dragging, resizing, or clicking specific points on the canvas:

```typescript
export class CanvasHelper {
    constructor(private page: Page) {}

    /**
     * Click at a specific coordinate on the canvas
     */
    async clickAt(x: number, y: number) {
        const canvas = await this.page.locator('#slide-canvas');
        const box = await canvas.boundingBox();
        if (!box) throw new Error('Canvas not found');
        
        await this.page.mouse.click(box.x + x, box.y + y);
    }

    /**
     * Drag an element from one point to another
     */
    async dragElement(elementId: string, xOffset: number, yOffset: number) {
        const element = this.page.locator(`[data-element-id="${elementId}"]`);
        const box = await element.boundingBox();
        if (!box) throw new Error(`Element ${elementId} not found`);
        
        const centerX = box.x + box.width / 2;
        const centerY = box.y + box.height / 2;
        
        await this.page.mouse.move(centerX, centerY);
        await this.page.mouse.down();
        await this.page.mouse.move(centerX + xOffset, centerY + yOffset, { steps: 10 });
        await this.page.mouse.up();
    }

    /**
     * Resize an element using the resize handle
     */
    async resizeElement(elementId: string, widthDelta: number, heightDelta: number) {
        // Locate the bottom-right resize handle
        const handle = this.page.locator(`[data-element-id="${elementId}"] .resize-handle-br`);
        const box = await handle.boundingBox();
        if (!box) throw new Error(`Resize handle for ${elementId} not found`);
        
        await this.page.mouse.move(box.x, box.y);
        await this.page.mouse.down();
        await this.page.mouse.move(box.x + widthDelta, box.y + heightDelta, { steps: 10 });
        await this.page.mouse.up();
    }
}
```

**Usage in Tests:**
```typescript
test('User can drag a text element', async ({ page, canvas }) => {
    await page.goto('/editor');
    
    // Add a text element via toolbar (assume helper exists)
    await editorPage.addTextElement();
    
    // Drag it 100px to the right
    await canvas.dragElement('text-123', 100, 0);
    
    // Verify new position
    const element = page.locator('[data-element-id="text-123"]');
    const box = await element.boundingBox();
    expect(box.x).toBeGreaterThan(100);
});
```

## 3. Verifying Visual State

### 3.1 Element Position Assertions
```typescript
async function assertElementPosition(
    page: Page,
    elementId: string,
    expectedX: number,
    expectedY: number,
    tolerance: number = 5
) {
    const element = page.locator(`[data-element-id="${elementId}"]`);
    const box = await element.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(expectedX - tolerance);
    expect(box.x).toBeLessThanOrEqual(expectedX + tolerance);
    expect(box.y).toBeGreaterThanOrEqual(expectedY - tolerance);
    expect(box.y).toBeLessThanOrEqual(expectedY + tolerance);
}
```

### 3.2 Canvas Region Screenshots
Instead of full-page screenshots (which include UI chrome), capture only the canvas:

```typescript
test('Slide renders correctly with theme', async ({ page }) => {
    await page.goto('/editor');
    
    // Apply a theme
    await editorPage.applyTheme('Tropical Paradise');
    
    // Screenshot just the canvas
    const canvas = page.locator('#slide-canvas');
    await expect(canvas).toHaveScreenshot('tropical-theme.png', {
        maxDiffPixelRatio: 0.01, // Allow 1% difference for anti-aliasing
    });
});
```

### 3.3 Handling Animations
Canvas interactions often trigger animations (fade in, slide transition). Ensure animations complete before assertions:

```typescript
// Wait for animation to finish (if using CSS transitions)
await page.waitForTimeout(300); // Last resort, prefer waiting for a stable state

// Better: Wait for element to reach final position
await page.waitForFunction(() => {
    const el = document.querySelector('[data-element-id="text-123"]');
    const style = window.getComputedStyle(el);
    return style.transform === 'matrix(1, 0, 0, 1, 200, 100)'; // Expected final transform
});
```

## 4. Testing Canvas-Specific Features

### 4.1 Selection & Bounding Box
```typescript
test('Selecting an element shows bounding box', async ({ page }) => {
    await page.goto('/editor');
    await editorPage.addTextElement();
    
    // Click on the element to select it
    const element = page.locator('[data-element-id="text-123"]');
    await element.click();
    
    // Verify bounding box is visible
    const boundingBox = page.locator('.selection-box, [class*="bounding-box"]');
    await expect(boundingBox).toBeVisible();
});
```

### 4.2 Multi-Select
```typescript
test('User can select multiple elements with Shift+Click', async ({ page }) => {
    await page.goto('/editor');
    await editorPage.addTextElement(); // text-1
    await editorPage.addShapeElement(); // shape-2
    
    // Select first element
    await page.locator('[data-element-id="text-1"]').click();
    
    // Shift+Click second element
    await page.keyboard.down('Shift');
    await page.locator('[data-element-id="shape-2"]').click();
    await page.keyboard.up('Shift');
    
    // Verify both are selected (check store state or UI indicators)
    const selectedCount = await page.evaluate(() => {
        return window.__TEST_STORE__.getState().editor.selectedElementIds.length;
    });
    expect(selectedCount).toBe(2);
});
```

## 5. Common Pitfalls

### ❌ Don't: Use fixed delays
```typescript
await page.waitForTimeout(2000); // Flaky!
```

### ✅ Do: Wait for specific conditions
```typescript
await page.waitForSelector('[data-element-id="text-123"]');
await page.waitForFunction(() => document.readyState === 'complete');
```

### ❌ Don't: Assume instant rendering
Canvas rendering might be deferred. Always verify the element exists before interacting.

### ✅ Do: Use Playwright's auto-waiting
Playwright's `click()`, `fill()` automatically wait for elements to be actionable.

## 6. Debugging Canvas Tests

### Enable Visual Debugging
```typescript
test('Debug canvas interaction', async ({ page }) => {
    await page.goto('/editor');
    
    // Slow down actions for visual inspection
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.pause(); // Opens Playwright Inspector
});
```

### Capture State Before/After
```typescript
const stateBefore = await page.evaluate(() => window.__TEST_STORE__.getState());
await canvas.dragElement('text-123', 100, 0);
const stateAfter = await page.evaluate(() => window.__TEST_STORE__.getState());

console.log('Position changed:', {
    before: stateBefore.slides['slide-1'].elements['text-123'].x,
    after: stateAfter.slides['slide-1'].elements['text-123'].x,
});
```

---

## Next Steps
1. Add `data-element-id` to all canvas elements in the source code.
2. Create `CanvasHelper` class in `tests/e2e/pages/canvas.helper.ts`.
3. Write smoke tests for basic canvas interactions (click, drag, select).
