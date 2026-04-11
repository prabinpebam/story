# Property Inspector Test Automation Plan

> **Spec as Source of Truth:** All tests validate behaviors documented in the Property Inspector v2.0 specification. If a test fails, either the implementation is wrong OR the spec needs updating—never silently skip.

## Table of Contents

1. [Philosophy & Principles](#1-philosophy--principles)
2. [Test Architecture](#2-test-architecture)
3. [Test Categories](#3-test-categories)
4. [Section-by-Section Test Scenarios](#4-section-by-section-test-scenarios)
5. [Automation-Driven Debugging Workflow](#5-automation-driven-debugging-workflow)
6. [Test Data & Fixtures](#6-test-data--fixtures)
7. [Page Object Model](#7-page-object-model)
8. [CI/CD Integration](#8-cicd-integration)
9. [Status Tracking & Metrics](#9-status-tracking--metrics)
10. [Maintenance & Evolution](#10-maintenance--evolution)

---

## 1. Philosophy & Principles

### 1.1 Spec-Driven Testing

| Principle | Description |
|-----------|-------------|
| **Spec Authority** | Tests validate spec claims. A passing test = implementation matches spec. |
| **Traceability** | Every test maps to a specific section/table in the spec via `[SPEC:XX-section.md#anchor]`. |
| **Discovery Mode** | Failing tests discover bugs; they are never deleted, only marked for fix. |
| **Bidirectional Sync** | Tests verify PI↔Viewport sync per `01-architecture.md §2.4`. |

### 1.2 Test Pyramid for Property Inspector

```
                    ┌─────────────┐
                    │   Visual    │  5%  - Screenshot comparison
                    │   Tests     │       - Design system compliance
                    ├─────────────┤
                    │    E2E      │ 20%  - Full PI↔Viewport flows
                    │   Tests     │       - Multi-section scenarios
                    ├─────────────┤
                    │ Integration │ 25%  - Section↔Store interaction
                    │   Tests     │       - Component coordination
                    ├─────────────┤
                    │    Unit     │ 50%  - Individual section logic
                    │   Tests     │       - Input validation
                    └─────────────┘
```

### 1.3 Key Testing Tenets

1. **Never Hardcode Magic Numbers:** Test against spec-defined values (e.g., opacity range `0-100`, not arbitrary).
2. **Design System Compliance:** Tests verify CSS variables, not hardcoded colors.
3. **Accessibility First:** Every interactive element must pass ARIA audits.
4. **State Isolation:** Each test starts with a clean state; no test depends on another.

---

## 2. Test Architecture

### 2.1 Directory Structure

```
tests/
├── unit/
│   └── ui/
│       └── properties/
│           ├── PositionSection.test.js       # [SPEC: 02-position-section.md]
│           ├── AppearanceSection.test.js     # [SPEC: 03-appearance-section.md]
│           ├── FillSection.test.js           # [SPEC: 04-fill-section.md]
│           ├── StrokeSection.test.js         # [SPEC: 05-stroke-section.md]
│           ├── TextSection.test.js           # [SPEC: 06-text-section.md]
│           ├── EffectsSection.test.js        # [SPEC: 07-effects-section.md]
│           ├── ArrangeSection.test.js        # [SPEC: 08-arrange-section.md]
│           ├── ExportSection.test.js         # [SPEC: 09-export-section.md]
│           ├── SlideSection.test.js          # [SPEC: 10-slide-section.md]
│           ├── PlaceholderSection.test.js    # [SPEC: 11-placeholder-section.md]
│           └── __fixtures__/
│               └── element-states.json       # Standard element configurations
├── integration/
│   └── property-inspector/
│       ├── pi-viewport-sync.test.js          # [SPEC: 01-architecture.md §2.4]
│       ├── multi-select-behavior.test.js     # Mixed value handling
│       ├── section-visibility.test.js        # Context-based visibility
│       └── input-validation.test.js          # Cross-section validation
├── e2e/
│   └── specs/
│       └── functional/
│           ├── property-inspector/
│           │   ├── pi-position.spec.ts       # Full PI position flow
│           │   ├── pi-fills.spec.ts          # Fill interactions
│           │   ├── pi-typography.spec.ts     # Text styling
│           │   ├── pi-effects.spec.ts        # Effects panel
│           │   └── pi-sync-regression.spec.ts# Sync bug prevention
│           └── pages/
│               └── PropertyInspectorPage.ts  # Page Object Model
└── visual/
    └── property-inspector/
        ├── pi-light-mode.spec.ts             # Light mode screenshots
        ├── pi-dark-mode.spec.ts              # Dark mode screenshots
        └── snapshots/                        # Baseline images
```

### 2.2 Test Framework Configuration

| Layer | Framework | Config File |
|-------|-----------|-------------|
| Unit | Vitest | `vitest.config.js` |
| Integration | Vitest | `vitest.config.js` |
| E2E | Playwright | `playwright.config.ts` |
| Visual | Playwright | `playwright.config.ts` (+ percy/snapshots) |

### 2.3 Test Naming Convention

```
[SECTION]-[SCENARIO]-[EXPECTED_BEHAVIOR].test.js

Examples:
- position-x-input-updates-element.test.js
- fill-gradient-stop-add-creates-stop.test.js
- text-mixed-selection-shows-dash.test.js
```

---

## 3. Test Categories

### 3.1 Unit Tests (Vitest)

**Purpose:** Test individual section components in isolation.

| Category | Tests Per Section | Priority |
|----------|-------------------|----------|
| Initialization | 3-5 | P0 |
| State Reading | 5-10 | P0 |
| Input Handling | 5-15 | P0 |
| Validation | 3-5 | P1 |
| Edge Cases | 5-10 | P1 |

**Standard Unit Test Template:**

```javascript
/**
 * @spec 02-position-section.md
 * @section Position Section
 */
describe('PositionSection', () => {
    // SPEC: §1.1 - Section shows for all element types
    describe('Visibility Rules [SPEC:02§1.1]', () => {
        it('should show for single rectangle element', () => {
            // Test implementation
        });
        
        it('should show for multiple selected elements', () => {
            // Test implementation
        });
        
        it('should hide when no elements selected', () => {
            // Test implementation
        });
    });
    
    // SPEC: §2.1 - X/Y Position Display
    describe('Position Display [SPEC:02§2.1]', () => {
        it('should display X value from selected element', () => {
            // Verify store.element.x → input.value
        });
        
        it('should show "–" for mixed X values in multi-select', () => {
            // Test mixed value behavior
        });
    });
});
```

### 3.2 Integration Tests (Vitest)

**Purpose:** Test PI↔Store↔Viewport coordination.

| Scenario | Priority | Spec Reference |
|----------|----------|----------------|
| Input → Store → Viewport | P0 | 01-architecture.md §2.4 |
| Viewport Change → PI Update | P0 | 01-architecture.md §2.4 |
| Multi-select value aggregation | P1 | 01-architecture.md §2.2 |
| Undo/Redo state sync | P1 | 01-architecture.md §2.4.4 |

### 3.3 E2E Tests (Playwright)

**Purpose:** Test complete user workflows.

| Flow | Test Count | Priority |
|------|------------|----------|
| Select element → Edit position → Verify canvas | 5 | P0 |
| Add fill → Change color → See element update | 10 | P0 |
| Type text → Change font → Verify rendering | 8 | P0 |
| Multi-select → Bulk edit → All elements update | 5 | P1 |

### 3.4 Visual Regression Tests

**Purpose:** Ensure PI looks correct per design system.

| Check | Tool | Frequency |
|-------|------|-----------|
| Component styling | Playwright Snapshots | Every PR |
| Dark/Light mode | Percy.io (optional) | Weekly |
| Design token compliance | Automated CSS audit | Every PR |

---

## 4. Section-by-Section Test Scenarios

### 4.1 Position Section [SPEC: 02-position-section.md]

| ID | Scenario | Priority | Spec Reference |
|----|----------|----------|----------------|
| **Display Tests** |
| POS-01 | X input shows element.x value | P0 | §2.1 |
| POS-02 | Y input shows element.y value | P0 | §2.1 |
| POS-03 | W input shows element.width | P0 | §2.2 |
| POS-04 | H input shows element.height | P0 | §2.2 |
| POS-05 | Rotation shows element.rotation | P0 | §2.3 |
| POS-06 | Multi-select mixed values show "–" | P0 | §3.1 |
| **Input Tests** |
| POS-10 | Typing X value updates element | P0 | §2.1 |
| POS-11 | Scrubbing W updates element live | P0 | §2.2 |
| POS-12 | Constraint toggle locks proportions | P1 | §2.2 |
| POS-13 | Tab key moves to next input | P1 | §4.1 |
| POS-14 | Enter commits and blurs | P1 | §4.1 |
| **Validation Tests** |
| POS-20 | Negative position values allowed | P1 | §5.1 |
| POS-21 | Zero width/height rejected | P1 | §5.1 |
| POS-22 | Rotation clamps to 0-360 | P1 | §5.1 |
| **Sync Tests** |
| POS-30 | Canvas drag → PI updates | P0 | 01-arch §2.4 |
| POS-31 | Canvas resize → PI updates | P0 | 01-arch §2.4 |
| POS-32 | PI change → Undo restores both | P1 | 01-arch §2.4.4 |

### 4.2 Appearance Section [SPEC: 03-appearance-section.md]

| ID | Scenario | Priority | Spec Reference |
|----|----------|----------|----------------|
| **Display Tests** |
| APP-01 | Opacity slider shows 0-100% range | P0 | §1.1 |
| APP-02 | Blend mode dropdown shows current mode | P0 | §1.2 |
| APP-03 | Corner radius shows per-corner values | P1 | §1.3 |
| APP-04 | Visibility toggle reflects hidden state | P0 | §1.4 |
| **Input Tests** |
| APP-10 | Dragging opacity slider updates element | P0 | §2.1 |
| APP-11 | Selecting blend mode applies immediately | P0 | §2.2 |
| APP-12 | Uniform radius applies to all corners | P1 | §2.3 |
| APP-13 | Independent radius editing works | P2 | §2.3 |
| **Edge Cases** |
| APP-20 | Circles don't show corner radius | P1 | §3.1 |
| APP-21 | Groups show opacity but not blend mode | P2 | §3.2 |

### 4.3 Fill Section [SPEC: 04-fill-section.md]

| ID | Scenario | Priority | Spec Reference |
|----|----------|----------|----------------|
| **Solid Fill Tests** |
| FIL-01 | Color swatch shows current fill color | P0 | §1.1 |
| FIL-02 | Hex input accepts valid colors | P0 | §1.1 |
| FIL-03 | Opacity slider adjusts fill opacity | P0 | §1.2 |
| FIL-04 | Clicking swatch opens color picker | P0 | §2.1 |
| **Gradient Fill Tests** |
| FIL-10 | Gradient bar shows current stops | P1 | §2.1 |
| FIL-11 | Adding stop inserts at midpoint | P1 | §2.2 |
| FIL-12 | Dragging stop repositions it | P1 | §2.3 |
| FIL-13 | Double-click stop opens color picker | P1 | §2.4 |
| **Multi-Fill Tests** |
| FIL-20 | Add fill button creates new layer | P1 | §3.1 |
| FIL-21 | Drag to reorder fill layers | P2 | §3.2 |
| FIL-22 | Delete removes fill layer | P1 | §3.3 |
| **Sync Tests** |
| FIL-30 | Eyedropper from canvas updates fill | P2 | §4.1 |
| FIL-31 | Fill change reflects on canvas immediately | P0 | 01-arch §2.4 |

### 4.4 Stroke Section [SPEC: 05-stroke-section.md]

| ID | Scenario | Priority | Spec Reference |
|----|----------|----------|----------------|
| STR-01 | Color swatch shows stroke color | P0 | §1.1 |
| STR-02 | Width input shows stroke width | P0 | §1.2 |
| STR-03 | Position dropdown shows Inside/Center/Outside | P1 | §1.3 |
| STR-04 | Dash pattern inputs work | P2 | §1.4 |
| STR-10 | Multi-stroke layers display correctly | P2 | §2.1 |
| STR-20 | Stroke change reflects on canvas | P0 | 01-arch §2.4 |

### 4.5 Text Section [SPEC: 06-text-section.md]

| ID | Scenario | Priority | Spec Reference |
|----|----------|----------|----------------|
| **Typography Tests** |
| TXT-01 | Font family dropdown shows current font | P0 | §1.1 |
| TXT-02 | Font weight dropdown shows available weights | P0 | §1.2 |
| TXT-03 | Font size accepts numeric input | P0 | §1.3 |
| TXT-04 | Line height supports auto and fixed | P1 | §1.4 |
| TXT-05 | Letter spacing accepts positive/negative | P1 | §1.5 |
| **Alignment Tests** |
| TXT-10 | Horizontal align buttons work | P0 | §2.1 |
| TXT-11 | Vertical align buttons work | P0 | §2.2 |
| **Formatting Tests** |
| TXT-20 | Bold/Italic toggles work | P1 | §3.1 |
| TXT-21 | Text decoration toggles work | P2 | §3.2 |
| TXT-22 | Text case transforms work | P2 | §3.3 |
| **Character-Level Tests** |
| TXT-30 | Selected text range shows character styles | P2 | §4.1 |
| TXT-31 | Mixed character styles show "–" | P2 | §4.2 |

### 4.6 Effects Section [SPEC: 07-effects-section.md]

| ID | Scenario | Priority | Spec Reference |
|----|----------|----------|----------------|
| EFX-01 | Add drop shadow effect | P1 | §1.1 |
| EFX-02 | Shadow X/Y offset inputs work | P1 | §1.2 |
| EFX-03 | Shadow blur input works | P1 | §1.3 |
| EFX-04 | Shadow color picker works | P1 | §1.4 |
| EFX-05 | Inner shadow toggle works | P2 | §2.1 |
| EFX-06 | Layer blur effect works | P2 | §3.1 |
| EFX-10 | Multiple effects stack correctly | P2 | §4.1 |
| EFX-20 | Effect visibility toggle works | P1 | §5.1 |

### 4.7 Arrange Section [SPEC: 08-arrange-section.md]

| ID | Scenario | Priority | Spec Reference |
|----|----------|----------|----------------|
| ARR-01 | Bring forward moves element up | P1 | §1.1 |
| ARR-02 | Send backward moves element down | P1 | §1.2 |
| ARR-03 | Bring to front moves to top | P1 | §1.3 |
| ARR-04 | Send to back moves to bottom | P1 | §1.4 |
| ARR-10 | Alignment buttons align elements | P1 | §2.1 |
| ARR-11 | Distribute buttons space elements | P2 | §2.2 |
| ARR-20 | Group creates new group | P1 | §3.1 |
| ARR-21 | Ungroup dissolves group | P1 | §3.2 |

### 4.8 Export Section [SPEC: 09-export-section.md]

| ID | Scenario | Priority | Spec Reference |
|----|----------|----------|----------------|
| EXP-01 | Format dropdown shows PNG/SVG/PDF | P2 | §1.1 |
| EXP-02 | Scale dropdown shows 1x/2x/3x | P2 | §1.2 |
| EXP-03 | Export button triggers download | P2 | §2.1 |

### 4.9 Slide Section [SPEC: 10-slide-section.md]

| ID | Scenario | Priority | Spec Reference |
|----|----------|----------|----------------|
| SLD-01 | Background color picker works | P1 | §1.1 |
| SLD-02 | Background image upload works | P2 | §1.2 |
| SLD-03 | Slide size shows current dimensions | P1 | §2.1 |
| SLD-04 | Transition dropdown works | P2 | §3.1 |

### 4.10 Placeholder Section [SPEC: 11-placeholder-section.md]

| ID | Scenario | Priority | Spec Reference |
|----|----------|----------|----------------|
| PLH-01 | Shows only in master mode | P1 | §1.1 |
| PLH-02 | Placeholder type dropdown works | P1 | §2.1 |
| PLH-03 | Binding badge shows linked data | P2 | §3.1 |

---

## 5. Automation-Driven Debugging Workflow

### 5.1 The Test-Fail-Fix-Verify Loop

```
┌──────────────────────────────────────────────────────────────┐
│  1. SELECT TEST                                               │
│     Pick scenario from Section 4 (e.g., POS-01)              │
├──────────────────────────────────────────────────────────────┤
│  2. IMPLEMENT TEST                                            │
│     Write test assuming feature works per spec               │
├──────────────────────────────────────────────────────────────┤
│  3. EXECUTE (DISCOVERY)                                       │
│     • Pass → Mark ✅ in tracking table                       │
│     • Fail → Confirms bug, proceed to step 4                 │
├──────────────────────────────────────────────────────────────┤
│  4. ANALYZE (DEBUGGING)                                       │
│     Use debugging toolkit:                                    │
│     • Vitest: --reporter=verbose, console.log in test        │
│     • Playwright: --ui mode, trace viewer                    │
│     Identify: Is it Selector? State? Rendering? Race?        │
├──────────────────────────────────────────────────────────────┤
│  5. FIX (IMPLEMENTATION)                                      │
│     Modify src/ code to match spec                           │
├──────────────────────────────────────────────────────────────┤
│  6. VERIFY                                                    │
│     Re-run test until pass                                   │
├──────────────────────────────────────────────────────────────┤
│  7. REGRESSION CHECK                                          │
│     Run related tests to ensure no breakage                  │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 Failure Categorization

| Type | Symptoms | Debug Strategy | Fix Location |
|------|----------|----------------|--------------|
| **Selector** | Element not found, not clickable | Check `data-testid`, z-index | `src/ui/` |
| **State** | Action happens but wrong result | Debug Redux actions/reducers | `src/core/` |
| **Rendering** | State correct but canvas wrong | Debug renderer logic | `src/ui/canvas/` |
| **Race** | Intermittent failures | Add waitFor, check async | Test or App |
| **Not Impl** | Feature completely missing | Implement per spec | `src/` |
| **Spec Wrong** | Impl correct but spec outdated | Update spec, then test | Spec docs |

### 5.3 Debugging Toolkit

#### Unit/Integration (Vitest)

```bash
# Run single test with verbose output
npm run test -- --reporter=verbose PositionSection.test.js

# Run with debugging
node --inspect-brk node_modules/vitest/vitest.mjs run PositionSection.test.js

# Coverage for specific file
npm run test -- --coverage --coverage.include=src/ui/properties/PositionSection.js
```

#### E2E (Playwright)

```bash
# UI Mode (time-travel debugging)
npx playwright test pi-position.spec.ts --ui

# With tracing
npx playwright test pi-position.spec.ts --trace on

# View trace
npx playwright show-trace trace.zip

# Debug mode (step through)
npx playwright test pi-position.spec.ts --debug
```

### 5.4 Console Logging Strategy

```typescript
// In Playwright tests
page.on('console', msg => console.log(`[BROWSER] ${msg.text()}`));
page.on('pageerror', err => console.error(`[ERROR] ${err.message}`));

// In app code (temporary debugging)
console.log('[PI-DEBUG] State after update:', store.getState().editor);
```

---

## 6. Test Data & Fixtures

### 6.1 Standard Element Fixtures

```json
// tests/unit/ui/properties/__fixtures__/element-states.json
{
    "singleRect": {
        "id": "rect-1",
        "type": "rect",
        "x": 100,
        "y": 100,
        "width": 200,
        "height": 150,
        "rotation": 0,
        "opacity": 100,
        "blendMode": "normal",
        "fills": [{ "type": "solid", "color": "#3B82F6", "opacity": 100 }],
        "strokes": [],
        "effects": []
    },
    "singleText": {
        "id": "text-1",
        "type": "text",
        "x": 50,
        "y": 50,
        "width": 300,
        "height": 100,
        "text": "Sample Text",
        "fontFamily": "Inter",
        "fontSize": 16,
        "fontWeight": 400,
        "textAlign": "left",
        "verticalAlign": "top"
    },
    "multiSelectSame": {
        "elements": ["rect-1", "rect-2"],
        "sharedOpacity": 80,
        "sharedBlendMode": "normal"
    },
    "multiSelectMixed": {
        "elements": ["rect-1", "rect-2"],
        "mixedOpacity": true,
        "rect1Opacity": 80,
        "rect2Opacity": 60
    }
}
```

### 6.2 Store State Fixtures

```javascript
// tests/unit/ui/properties/__fixtures__/store-states.js
export const singleElementSelected = {
    editor: {
        mode: 'edit',
        activeSlideId: 'slide-1',
        selectedElementIds: ['element-1']
    },
    slides: {
        'slide-1': {
            id: 'slide-1',
            elements: {
                'element-1': { /* element data */ }
            }
        }
    }
};

export const multipleElementsSelected = { /* ... */ };
export const noSelection = { /* ... */ };
export const masterModeState = { /* ... */ };
```

---

## 7. Page Object Model

### 7.1 PropertyInspectorPage.ts

```typescript
// tests/e2e/pages/PropertyInspectorPage.ts

import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object for Property Inspector interactions
 * 
 * @spec documentation/specs/ui-system/property-inspector-v2/
 */
export class PropertyInspectorPage {
    readonly page: Page;
    readonly panel: Locator;
    
    // Sections
    readonly positionSection: PositionSectionPO;
    readonly appearanceSection: AppearanceSectionPO;
    readonly fillSection: FillSectionPO;
    readonly strokeSection: StrokeSectionPO;
    readonly textSection: TextSectionPO;
    readonly effectsSection: EffectsSectionPO;
    readonly arrangeSection: ArrangeSectionPO;
    readonly exportSection: ExportSectionPO;
    readonly slideSection: SlideSectionPO;
    
    constructor(page: Page) {
        this.page = page;
        this.panel = page.locator('[data-testid="property-inspector"]');
        
        // Initialize section page objects
        this.positionSection = new PositionSectionPO(this.panel);
        this.appearanceSection = new AppearanceSectionPO(this.panel);
        this.fillSection = new FillSectionPO(this.panel);
        this.strokeSection = new StrokeSectionPO(this.panel);
        this.textSection = new TextSectionPO(this.panel);
        this.effectsSection = new EffectsSectionPO(this.panel);
        this.arrangeSection = new ArrangeSectionPO(this.panel);
        this.exportSection = new ExportSectionPO(this.panel);
        this.slideSection = new SlideSectionPO(this.panel);
    }
    
    /** Verify PI is visible */
    async expectVisible() {
        await expect(this.panel).toBeVisible();
    }
    
    /** Verify PI is hidden */
    async expectHidden() {
        await expect(this.panel).not.toBeVisible();
    }
    
    /** Verify specific section is visible */
    async expectSectionVisible(sectionName: string) {
        const section = this.panel.locator(`[data-testid="section-${sectionName}"]`);
        await expect(section).toBeVisible();
    }
}

/**
 * Position Section Page Object
 * @spec 02-position-section.md
 */
class PositionSectionPO {
    readonly container: Locator;
    readonly xInput: Locator;
    readonly yInput: Locator;
    readonly wInput: Locator;
    readonly hInput: Locator;
    readonly rotationInput: Locator;
    readonly constraintToggle: Locator;
    
    constructor(parent: Locator) {
        this.container = parent.locator('[data-testid="section-position"]');
        this.xInput = this.container.locator('[data-testid="position-x"] input');
        this.yInput = this.container.locator('[data-testid="position-y"] input');
        this.wInput = this.container.locator('[data-testid="position-w"] input');
        this.hInput = this.container.locator('[data-testid="position-h"] input');
        this.rotationInput = this.container.locator('[data-testid="position-rotation"] input');
        this.constraintToggle = this.container.locator('[data-testid="constraint-toggle"]');
    }
    
    /** Get current X value */
    async getX(): Promise<string> {
        return await this.xInput.inputValue();
    }
    
    /** Set X value */
    async setX(value: number) {
        await this.xInput.fill(String(value));
        await this.xInput.press('Enter');
    }
    
    /** Verify X displays expected value */
    async expectX(value: number | string) {
        await expect(this.xInput).toHaveValue(String(value));
    }
    
    /** Verify mixed value indicator */
    async expectXMixed() {
        await expect(this.xInput).toHaveValue('–');
    }
}

// Similar pattern for other sections...
```

### 7.2 Usage in Tests

```typescript
// tests/e2e/specs/functional/property-inspector/pi-position.spec.ts

import { test, expect } from '@playwright/test';
import { EditorPage } from '../../../pages/EditorPage';
import { PropertyInspectorPage } from '../../../pages/PropertyInspectorPage';

/**
 * @spec 02-position-section.md
 */
test.describe('Position Section', () => {
    let editor: EditorPage;
    let pi: PropertyInspectorPage;
    
    test.beforeEach(async ({ page }) => {
        editor = new EditorPage(page);
        pi = new PropertyInspectorPage(page);
        await editor.goto();
    });
    
    test('[POS-01] X input shows element.x value', async ({ page }) => {
        // Arrange: Create element at x=150
        await editor.createRectangle(150, 100, 200, 200);
        
        // Act: Select element
        await editor.selectElement('rect-1');
        
        // Assert: PI shows x=150
        await pi.positionSection.expectX(150);
    });
    
    test('[POS-10] Typing X value updates element', async ({ page }) => {
        // Arrange
        await editor.createRectangle(100, 100, 200, 200);
        await editor.selectElement('rect-1');
        
        // Act: Change X in PI
        await pi.positionSection.setX(250);
        
        // Assert: Canvas element moved
        await editor.expectElementPosition('rect-1', 250, 100);
    });
    
    test('[POS-30] Canvas drag updates PI [SYNC]', async ({ page }) => {
        // Arrange
        await editor.createRectangle(100, 100, 200, 200);
        await editor.selectElement('rect-1');
        
        // Act: Drag element on canvas
        await editor.dragElement('rect-1', { x: 50, y: 30 });
        
        // Assert: PI updated
        await pi.positionSection.expectX(150); // 100 + 50
        await pi.positionSection.expectY(130); // 100 + 30
    });
});
```

---

## 8. CI/CD Integration

### 8.1 Test Execution Pipeline

```yaml
# .github/workflows/property-inspector-tests.yml

name: Property Inspector Tests

on:
  pull_request:
    paths:
      - 'src/ui/properties/**'
      - 'tests/**/properties/**'
      - 'tests/**/property-inspector/**'

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - name: Run Unit Tests
        run: npm run test:unit -- --coverage
      - name: Upload Coverage
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - name: Run Integration Tests
        run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - name: Install Playwright
        run: npx playwright install --with-deps
      - name: Run E2E Tests
        run: npx playwright test tests/e2e/specs/functional/property-inspector/
      - name: Upload Traces
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-traces
          path: test-results/

  visual-tests:
    runs-on: ubuntu-latest
    if: github.event.pull_request.draft == false
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - name: Run Visual Tests
        run: npx playwright test tests/visual/property-inspector/
```

### 8.2 Required Test Thresholds

| Metric | Threshold | Action if Failed |
|--------|-----------|------------------|
| Unit Test Pass Rate | 100% | Block merge |
| Integration Test Pass Rate | 100% | Block merge |
| E2E Test Pass Rate | 95%* | Block merge |
| Code Coverage (src/ui/properties/) | 80% | Warning |

*5% tolerance for flaky tests that are being addressed

---

## 9. Status Tracking & Metrics

### 9.1 Test Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| ✅ | Passing | None |
| 🔴 | Failing (Bug) | File issue, prioritize fix |
| ⚠️ | Flaky | Investigate root cause |
| ⬜ | Not Implemented | Add to backlog |
| 🚧 | In Progress | Being worked on |

### 9.2 Section Coverage Dashboard

| Section | Unit | Integration | E2E | Visual | Overall |
|---------|------|-------------|-----|--------|---------|
| Position | ⬜ 0/15 | ⬜ 0/5 | ⬜ 0/8 | ⬜ | 0% |
| Appearance | ✅ 15/15 | ⬜ 0/3 | ⬜ 0/5 | ⬜ | 33% |
| Fill | ✅ 10/20 | ⬜ 0/5 | ⬜ 0/10 | ⬜ | 17% |
| Stroke | ✅ 8/12 | ⬜ 0/3 | ⬜ 0/5 | ⬜ | 20% |
| Text | ✅ 12/25 | ⬜ 0/5 | ⬜ 0/15 | ⬜ | 13% |
| Effects | ✅ 10/15 | ⬜ 0/3 | ⬜ 0/8 | ⬜ | 19% |
| Arrange | ⬜ 0/10 | ⬜ 0/3 | ⬜ 0/5 | ⬜ | 0% |
| Export | ⬜ 0/5 | ⬜ 0/2 | ⬜ 0/3 | ⬜ | 0% |
| Slide | ⬜ 0/8 | ⬜ 0/3 | ⬜ 0/5 | ⬜ | 0% |
| Placeholder | ⬜ 0/5 | ⬜ 0/2 | ⬜ 0/3 | ⬜ | 0% |

### 9.3 Sync Coverage (Critical)

| Sync Scenario | Covered | Status |
|---------------|---------|--------|
| Input → Store → Viewport | ⬜ | |
| Viewport Drag → Store → PI | ⬜ | |
| Multi-select Aggregation | ⬜ | |
| Undo/Redo State Restore | ⬜ | |
| Element Type Change | ⬜ | |

---

## 10. Maintenance & Evolution

### 10.1 Spec-Test Sync Protocol

When the spec changes:

1. **Identify Affected Tests:** Search for `[SPEC:XX-section.md]` tags.
2. **Update Test Scenarios:** Add/remove/modify tests to match new spec.
3. **Run Full Suite:** Verify no regressions.
4. **Update Tracking Tables:** Reflect new test counts.

When tests consistently fail:

1. **Verify Spec Accuracy:** Is the spec describing intended behavior?
2. **If Spec Correct:** Fix implementation.
3. **If Spec Wrong:** Update spec, then update test.

### 10.2 Adding New Tests

```markdown
## Checklist for New Test

- [ ] Test has `@spec` JSDoc referencing spec file
- [ ] Test ID matches section naming (e.g., POS-XX, FIL-XX)
- [ ] Test uses Page Objects, not raw selectors
- [ ] Test is independent (no reliance on other tests)
- [ ] Test added to tracking table in Section 4
- [ ] Test follows naming convention: `[SECTION]-[SCENARIO]-[EXPECTED]`
```

### 10.3 Quarterly Review

Every quarter, review:

1. **Test Coverage:** Are new features covered?
2. **Flaky Tests:** Identify and fix or mark as known issues.
3. **Spec Drift:** Are tests still aligned with spec?
4. **Performance:** Are tests running in acceptable time?

---

## Appendix A: Quick Reference

### Test Commands

```bash
# Unit tests (PI sections)
npm run test -- src/ui/properties/

# Integration tests (PI)
npm run test -- tests/integration/property-inspector/

# E2E tests (PI)
npx playwright test tests/e2e/specs/functional/property-inspector/

# Single E2E test with UI
npx playwright test pi-position.spec.ts --ui

# Coverage report
npm run test -- --coverage --coverage.include=src/ui/properties/
```

### Key Files

| Purpose | Location |
|---------|----------|
| PI Spec | `documentation/specs/ui-system/property-inspector-v2/` |
| Unit Tests | `tests/unit/ui/properties/` |
| Integration Tests | `tests/integration/property-inspector/` |
| E2E Tests | `tests/e2e/specs/functional/property-inspector/` |
| Page Objects | `tests/e2e/pages/PropertyInspectorPage.ts` |
| Fixtures | `tests/unit/ui/properties/__fixtures__/` |

---

**Document Version:** 1.0  
**Created:** Based on Property Inspector v2.0 Spec  
**Spec Reference:** `documentation/specs/ui-system/property-inspector-v2/`
