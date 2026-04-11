# State Seeding Guide: Bypassing UI for Test Setup

## 1. The Problem
Building complex test scenarios via UI interactions is:
- **Slow:** Creating 20 slides = 20+ clicks + animations.
- **Flaky:** Race conditions, timing issues, animation delays.
- **Hard to Maintain:** If UI changes, all setup code breaks.

**Example of the problem:**
```typescript
// BAD: Slow and flaky
test('User can reorder 10 slides', async ({ page }) => {
    await page.goto('/editor');
    
    // Create 10 slides by clicking "Add Slide" 10 times
    for (let i = 0; i < 10; i++) {
        await page.click('[data-testid="add-slide-btn"]');
        await page.waitForTimeout(500); // Wait for animation... flaky!
    }
    
    // Now test reordering...
});
```

## 2. The Solution: State Seeding
Instead of building state via UI, **inject state directly into the Redux store** before the test starts.

### 2.1 Architecture Overview
1. **Expose Store in Test Mode:** Add `window.__TEST_STORE__` in the app.
2. **Create State Builders:** TypeScript factories to generate valid state objects.
3. **Seed State via `page.evaluate()`:** Inject state before test assertions.

---

## 3. Step 1: Expose Store in Test Mode

### Modify `src/main.js`
```javascript
// At the bottom of main.js
if (import.meta.env.MODE === 'test' || import.meta.env.DEV) {
    window.__TEST_STORE__ = store;
}
```

### Verify in DevTools Console
```javascript
window.__TEST_STORE__.getState(); // Should return current state
```

---

## 4. Step 2: Create State Builders

### File: `tests/e2e/utils/state-builders.ts`
```typescript
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a minimal slide with default properties
 */
export function createSlide(overrides?: Partial<Slide>): Slide {
    const id = overrides?.id || `slide-${Date.now()}-${Math.random()}`;
    return {
        id,
        layoutId: 'layout-blank',
        title: `Slide ${id}`,
        width: 1920,
        height: 1080,
        background: null,
        styleAssignments: {
            colorTheme: null,
            typographyStyle: null,
        },
        elements: {},
        elementOrder: [],
        notes: '',
        transition: 'magic',
        ...overrides,
    };
}

/**
 * Create a presentation with N slides
 */
export function createPresentation(slideCount: number) {
    const slides: Record<string, Slide> = {};
    const slideOrder: string[] = [];
    
    for (let i = 0; i < slideCount; i++) {
        const slide = createSlide({ title: `Slide ${i + 1}` });
        slides[slide.id] = slide;
        slideOrder.push(slide.id);
    }
    
    return { slides, slideOrder };
}

/**
 * Create a text element
 */
export function createTextElement(overrides?: Partial<TextElement>): TextElement {
    const id = overrides?.id || `text-${Date.now()}`;
    return {
        id,
        type: 'text',
        x: 400,
        y: 300,
        width: 600,
        height: 100,
        content: '<p>Sample Text</p>',
        style: {
            fontSize: 32,
            fontFamily: 'Inter',
            textAlign: 'left',
            textFill: { type: 'solid', color: '#000000', opacity: 100 },
        },
        ...overrides,
    };
}

/**
 * Add an element to a slide
 */
export function addElementToSlide(slide: Slide, element: Element): Slide {
    return {
        ...slide,
        elements: {
            ...slide.elements,
            [element.id]: element,
        },
        elementOrder: [...slide.elementOrder, element.id],
    };
}
```

---

## 5. Step 3: Seed State in Tests

### Basic Example
```typescript
import { test, expect } from '../fixtures/base-test';
import { createPresentation, createSlide, createTextElement, addElementToSlide } from '../utils/state-builders';

test('User can reorder slides', async ({ page }) => {
    // Create a presentation with 10 slides
    const { slides, slideOrder } = createPresentation(10);
    
    // Seed the state
    await page.goto('/editor');
    await page.evaluate((state) => {
        window.__TEST_STORE__.restoreState({
            ...window.__TEST_STORE__.getState(),
            slides: state.slides,
            slideOrder: state.slideOrder,
            editor: {
                ...window.__TEST_STORE__.getState().editor,
                activeSlideId: state.slideOrder[0],
            },
        });
    }, { slides, slideOrder });
    
    // Now test reordering (the 10 slides are already there!)
    await page.dragAndDrop('[data-slide-id="slide-1"]', '[data-slide-id="slide-5"]');
    
    // Verify
    const newOrder = await page.evaluate(() => {
        return window.__TEST_STORE__.getState().slideOrder;
    });
    expect(newOrder[0]).not.toBe(slideOrder[0]);
});
```

### Advanced Example: Complex Slide Setup
```typescript
test('Theme changes propagate to all elements', async ({ page }) => {
    // Create a slide with 5 text elements, each using a theme slot
    let slide = createSlide({ id: 'test-slide' });
    
    for (let i = 0; i < 5; i++) {
        const textEl = createTextElement({
            id: `text-${i}`,
            y: 100 + i * 150,
            style: {
                textFill: { 
                    type: 'solid', 
                    themeSlot: i, // Link to theme slot
                    color: '#000000' // Fallback
                },
            },
        });
        slide = addElementToSlide(slide, textEl);
    }
    
    // Seed state
    await page.goto('/editor');
    await page.evaluate((slideData) => {
        const store = window.__TEST_STORE__;
        store.restoreState({
            ...store.getState(),
            slides: { [slideData.id]: slideData },
            slideOrder: [slideData.id],
            editor: {
                ...store.getState().editor,
                activeSlideId: slideData.id,
            },
        });
    }, slide);
    
    // Now test theme switching
    await page.click('[data-testid="theme-picker"]');
    await page.click('[data-theme-id="preset_tropical_paradise"]');
    
    // Verify all text elements updated
    for (let i = 0; i < 5; i++) {
        const textEl = page.locator(`[data-element-id="text-${i}"]`);
        // Visual check or computed style verification
        await expect(textEl).toHaveCSS('color', /^rgb\(/); // Should have updated color
    }
});
```

---

## 6. Best Practices

### ✅ Do: Use State Seeding for Setup
```typescript
test('Complex scenario', async ({ page }) => {
    // FAST: Seed 50 slides instantly
    const { slides, slideOrder } = createPresentation(50);
    await seedState(page, { slides, slideOrder });
    
    // Test the actual behavior
    await page.click('[data-testid="presentation-mode"]');
});
```

### ❌ Don't: Overuse for Simple Cases
```typescript
test('User can click Add Slide button', async ({ page }) => {
    // This is fine via UI, no need to seed
    await page.goto('/editor');
    await page.click('[data-testid="add-slide-btn"]');
});
```

### ✅ Do: Validate Seeded State
```typescript
await seedState(page, { slides, slideOrder });

// Verify state was applied
const actualSlideCount = await page.evaluate(() => {
    return window.__TEST_STORE__.getState().slideOrder.length;
});
expect(actualSlideCount).toBe(50);
```

---

## 7. Helper Utility: `seedState()`

Create a reusable helper:

### File: `tests/e2e/utils/state-seeder.ts`
```typescript
import { Page } from '@playwright/test';

export async function seedState(page: Page, partialState: Partial<AppState>) {
    await page.evaluate((partial) => {
        const store = window.__TEST_STORE__;
        if (!store) {
            throw new Error('Test store not exposed! Ensure app is running in test mode.');
        }
        
        const currentState = store.getState();
        store.restoreState({
            ...currentState,
            ...partial,
        });
    }, partialState);
}

export async function getState(page: Page): Promise<AppState> {
    return await page.evaluate(() => {
        return window.__TEST_STORE__.getState();
    });
}

export async function dispatchAction(page: Page, action: string, payload?: any) {
    await page.evaluate(({ type, data }) => {
        window.__TEST_STORE__.dispatch(type, data);
    }, { type: action, data: payload });
}
```

---

## 8. Integration with Fixtures

Add state seeding to your base test fixture:

### File: `tests/e2e/fixtures/base-test.ts`
```typescript
import { test as base } from '@playwright/test';
import { seedState, getState } from '../utils/state-seeder';

export const test = base.extend({
    seedState: async ({ page }, use) => {
        await use((partialState) => seedState(page, partialState));
    },
    getState: async ({ page }, use) => {
        await use(() => getState(page));
    },
});

export { expect } from '@playwright/test';
```

**Usage:**
```typescript
test('Test with seeded state', async ({ page, seedState, getState }) => {
    await page.goto('/editor');
    
    // Seed state using fixture
    await seedState({ slides: {...}, slideOrder: [...] });
    
    // Get state
    const state = await getState();
    expect(state.slideOrder.length).toBe(10);
});
```

---

## 9. Debugging Seeded State

### View State in Playwright Inspector
```typescript
test('Debug seeded state', async ({ page }) => {
    await page.goto('/editor');
    await seedState(page, { slides, slideOrder });
    
    // Pause to inspect
    await page.pause();
    
    // Or log state
    const state = await getState(page);
    console.log('Seeded state:', JSON.stringify(state, null, 2));
});
```

---

## 10. When NOT to Use State Seeding

- **Testing the UI itself:** If you're testing "Add Slide" button, click it.
- **Testing state transitions:** If the test is about how state changes via UI interactions, don't bypass it.
- **Simple scenarios:** 1-2 slides don't need seeding.

---

## Next Steps
1. Add `window.__TEST_STORE__` to `src/main.js`.
2. Create `state-builders.ts` and `state-seeder.ts`.
3. Write tests using state seeding for complex scenarios (10+ slides, multiple themes, etc.).
