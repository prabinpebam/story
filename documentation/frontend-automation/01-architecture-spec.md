# Architecture Specification: Playwright Framework

## 1. Overview
This document defines the technical architecture for the frontend automation framework. We will use **Playwright with TypeScript** to ensure type safety and better developer experience.

## 2. Directory Structure
We will create a dedicated `tests/e2e` directory to separate these from unit tests.

```
story/
├── tests/
│   ├── unit/                  # Existing Vitest unit tests
│   └── e2e/                   # NEW: Playwright E2E tests
│       ├── config/            # Global configuration and setup
│       │   ├── global-setup.ts
│       │   └── global-teardown.ts
│       ├── fixtures/          # Custom Playwright fixtures (test data, extensions)
│       │   └── base-test.ts   # Extends standard 'test' object
│       ├── pages/             # Page Object Models (POM)
│       │   ├── base.page.ts   # Shared methods (click, type, wait)
│       │   ├── editor.page.ts # Editor specific interactions
│       │   └── dashboard.page.ts
│       ├── specs/             # Actual Test Files
│       │   ├── auth/
│       │   ├── editor/
│       │   │   ├── slide-creation.spec.ts
│       │   │   └── theme-switching.spec.ts
│       │   └── visual/        # Visual regression specific tests
│       └── utils/             # Helper functions (random data gen, API helpers)
├── playwright.config.ts       # Main Playwright configuration
└── package.json
```

## 3. Design Pattern: Page Object Model (POM)
We will strictly adhere to the **Page Object Model**.
*   **Goal:** Decouple test logic (assertions) from implementation details (selectors).
*   **Rule:** Test files (`*.spec.ts`) should NEVER contain CSS/XPath selectors. They should only call methods on Page Objects.

### Example Structure
**`tests/e2e/pages/editor.page.ts`**
```typescript
import { Page, Locator } from '@playwright/test';

export class EditorPage {
    readonly page: Page;
    readonly addSlideBtn: Locator;
    readonly canvas: Locator;

    constructor(page: Page) {
        this.page = page;
        this.addSlideBtn = page.getByTestId('add-slide-btn');
        this.canvas = page.locator('#slide-canvas');
    }

    async addSlide() {
        await this.addSlideBtn.click();
    }
}
```

## 4. Advanced Patterns (Critical for "Story" App)

### 4.1 State Seeding (Bypassing UI)
Since "Story" is a complex state-driven application, building complex scenarios (e.g., "A deck with 20 slides and specific themes") via the UI is slow and flaky.
We will implement a **State Seeder** that injects data directly into the application store.

**`tests/e2e/utils/state-seeder.ts`**
```typescript
export async function seedState(page: Page, initialState: any) {
    await page.evaluate((state) => {
        // Assuming 'window.store' is exposed in Dev/Test mode
        window.store.dispatch({ type: 'RESET_STATE', payload: state });
    }, initialState);
}
```

### 4.2 Canvas Interaction Helper
Interacting with a canvas requires coordinate-based actions rather than standard DOM selectors. We will create a helper to abstract this.

**`tests/e2e/pages/canvas.helper.ts`**
```typescript
export class CanvasHelper {
    constructor(private page: Page) {}

    /**
     * Drag an element by a relative offset
     */
    async dragElement(elementId: string, xOffset: number, yOffset: number) {
        const box = await this.page.locator(`[data-element-id="${elementId}"]`).boundingBox();
        if (!box) throw new Error(`Element ${elementId} not found`);
        
        await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await this.page.mouse.down();
        await this.page.mouse.move(box.x + box.width / 2 + xOffset, box.y + box.height / 2 + yOffset);
        await this.page.mouse.up();
    }
}
```

## 5. Configuration Strategy (`playwright.config.ts`)
*   **Base URL:** Configured via environment variable `BASE_URL` (default: `http://localhost:5173`).
*   **Browsers:** Chromium (primary), Firefox, WebKit.
*   **Parallelism:** Enabled by default (fully parallel).
*   **Retries:** 1 retry on CI, 0 locally.
*   **Reporting:** HTML Reporter (for local debugging) and GitHub Actions annotations.
*   **Tracing:** `on-first-retry` (captures screenshots, video, and network trace only when a test fails).

## 6. Custom Fixtures
We will extend the default `test` object to automatically initialize Page Objects. This reduces boilerplate in test files.

**`tests/e2e/fixtures/base-test.ts`**
```typescript
import { test as base } from '@playwright/test';
import { EditorPage } from '../pages/editor.page';
import { CanvasHelper } from '../pages/canvas.helper';

type MyFixtures = {
    editorPage: EditorPage;
    canvas: CanvasHelper;
};

export const test = base.extend<MyFixtures>({
    editorPage: async ({ page }, use) => {
        await use(new EditorPage(page));
    },
    canvas: async ({ page }, use) => {
        await use(new CanvasHelper(page));
    },
});
export { expect } from '@playwright/test';
```

## 7. Visual Regression Testing
*   We will use `expect(page).toHaveScreenshot()` for visual checks.
*   Snapshots will be stored in `tests/e2e/specs/__snapshots__`.
*   **Strategy:** Visual tests should be separate from functional tests or clearly marked to avoid slowing down the fast feedback loop.
