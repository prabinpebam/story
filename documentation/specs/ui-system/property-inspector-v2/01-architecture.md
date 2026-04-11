# Property Inspector - Architecture

> **Part of:** [Property Inspector Specification v2.0](./00-overview.md)

---

## 1. Component Architecture

### 1.1 Main Container Class

```javascript
// PropertyInspector.js - Main orchestrator
export class PropertyInspector {
    constructor(containerId)
    - containerId: DOM element ID for PI container
    - Initializes all section instances
    - Sets up store subscriptions
    
    // Section Instances
    - positionSection: PositionSection
    - layoutSection: LayoutSection
    - appearanceSection: AppearanceSection
    - textSection: TextSection
    - fillSection: FillSection
    - strokeSection: StrokeSection
    - effectsSection: EffectsSection
    - exportSection: ExportSection
    - slideSection: SlideSection
    - placeholderSection: PlaceholderSection
    
    // Key Methods
    - init(): Set up event listeners
    - render(): Re-render all visible sections
    - updateHeaderTitle(): Update sidebar header
    - getElement(): Resolve element from state
}
```

### 1.2 Section Base Pattern

All sections follow a consistent pattern:

```javascript
export class [Name]Section {
    constructor() {
        this.section = new Section({ title: '...', actions: [...] })
        this.createContent()
    }
    
    createContent() {
        // Build static DOM structure
        // Create input components
        // Append to section
    }
    
    update(selection) {
        // Called on state change
        // Show/hide section based on selection
        // Update input values from element
    }
    
    getElement(state, id) {
        // Resolve element from slide or master
    }
    
    updateProperty(prop, value, isTransient) {
        // Dispatch UPDATE_ELEMENT action
    }
}
```

---

## 2. State Management

### 2.1 Store Integration

The PI integrates with the central Store using an observer pattern:

```javascript
// Subscription
store.on('state-changed', (state) => {
    if (state.ui && state.ui.isInteracting) return; // Skip during scrub
    this.render();
});

store.on('selection-changed', () => this.render());

// Dispatching Changes
store.dispatch('UPDATE_ELEMENT', { 
    id: elementId, 
    [property]: value 
}, { 
    skipHistory: isTransient  // True for scrubbing
});
```

### 2.2 Element Resolution

Elements are resolved differently based on editor mode:

```javascript
getElement(state, id) {
    const mode = state.editor.mode;
    
    if (mode === 'master') {
        const master = state.slideMasterPresets[state.editor.activeMasterId];
        return master?.elements[id];
    } else {
        const slide = state.slides[state.editor.activeSlideId];
        return slide?.elements[id];
    }
}
```

### 2.3 Transient Updates

During interactive operations (scrubbing), updates are marked as transient:

```javascript
// Transient: Don't create history entry
updateProperty('x', value, true);  // skipHistory: true

// Committed: Create history entry
updateProperty('x', value, false); // skipHistory: false
```

### 2.4 Bidirectional State Synchronization (CRITICAL)

> **⚠️ CRITICAL ARCHITECTURE PRINCIPLE:** The Property Inspector and Viewport MUST always display consistent state. Any disconnect between what is shown in the Property Inspector and what is rendered in the Viewport is a **critical bug**.

#### 2.4.1 The Synchronization Problem

Properties can be changed from two sources:
1. **Property Inspector** - User edits values in input fields, dropdowns, sliders
2. **Viewport** - User directly manipulates elements (drag, resize, rotate, transform)

Without a robust synchronization strategy, these scenarios cause bugs:
- User drags element in viewport → PI shows stale X/Y
- User scrubs opacity in PI → Viewport doesn't update during scrub
- User resizes via bounding box → PI width/height outdated
- Undo/redo → PI and viewport show different states

#### 2.4.2 Single Source of Truth Pattern

**The ONLY source of truth is the Store.** Both PI and Viewport are views of Store state.

```
┌─────────────────────────────────────────────────────────────────────┐
│                            STORE                                    │
│                    (Single Source of Truth)                         │
│                                                                     │
│   state.slides[slideId].elements[elementId] = {                     │
│       x: 100, y: 200, width: 300, height: 150,                     │
│       rotation: 45, opacity: 0.8, fills: [...], ...                │
│   }                                                                 │
└─────────────────────────────────────────────────────────────────────┘
              │                                 │
              │ state-changed event             │ state-changed event
              ▼                                 ▼
    ┌─────────────────┐               ┌─────────────────┐
    │ Property        │               │ Viewport        │
    │ Inspector       │               │ (Canvas)        │
    │                 │               │                 │
    │ Reads state     │               │ Reads state     │
    │ Renders inputs  │               │ Renders element │
    └─────────────────┘               └─────────────────┘
              │                                 │
              │ User edits input                │ User drags element
              ▼                                 ▼
    ┌─────────────────┐               ┌─────────────────┐
    │ dispatch        │               │ dispatch        │
    │ UPDATE_ELEMENT  │               │ UPDATE_ELEMENT  │
    └─────────────────┘               └─────────────────┘
              │                                 │
              └─────────────────┬───────────────┘
                                │
                                ▼
                        ┌─────────────┐
                        │   STORE     │
                        │  (updates)  │
                        └─────────────┘
                                │
                                │ Emits 'state-changed'
                                ▼
                    BOTH PI and Viewport re-render
```

#### 2.4.3 Synchronization Rules

**Rule 1: Never Cache State Locally**
```javascript
// ❌ WRONG - Local state becomes stale
class PositionSection {
    constructor() {
        this.currentX = 0;  // Stale! Never do this
    }
    updateFromViewport(x) {
        this.currentX = x;  // May not match store
    }
}

// ✅ CORRECT - Always read from store
class PositionSection {
    update(selection) {
        const state = store.getState();
        const element = this.getElement(state, selection[0]);
        this.xInput.setValue(element.x);  // Fresh from store
    }
}
```

**Rule 2: All Modifications Go Through Store**
```javascript
// ❌ WRONG - Direct DOM manipulation
element.style.opacity = 0.5;  // Viewport out of sync with PI

// ✅ CORRECT - Dispatch action
store.dispatch('UPDATE_ELEMENT', { 
    id: elementId, 
    opacity: 0.5 
});
// Store updates → Both PI and Viewport receive state-changed → Both re-render
```

**Rule 3: Transient Updates Must Still Go Through Store**
```javascript
// During scrubbing, still use store but skip history
store.dispatch('UPDATE_ELEMENT', { 
    id: elementId, 
    x: newValue 
}, { 
    skipHistory: true  // Transient - no undo entry
});
// Viewport updates immediately
// PI updates after scrub ends (isInteracting guard)
```

**Rule 4: Use isInteracting Guard Correctly**
```javascript
store.on('state-changed', (state) => {
    // Skip PI re-render during active scrub to prevent input fighting
    if (state.ui?.isInteracting) return;
    
    // But viewport ALWAYS updates (no guard)
    this.render();
});
```

#### 2.4.4 Interaction Lifecycle

```
User starts scrubbing X input
│
├── 1. dispatch('UI_INTERACTION_START')
│       └── Sets state.ui.isInteracting = true
│
├── 2. dispatch('UPDATE_ELEMENT', {x: 101}, {skipHistory: true})
│       ├── Store updates element.x = 101
│       ├── Emits 'state-changed'
│       ├── Viewport re-renders with x=101 ✓
│       └── PI skips re-render (isInteracting=true) ✓
│
├── 3. ... many more transient updates ...
│
├── 4. User releases mouse
│
├── 5. dispatch('UI_INTERACTION_END')
│       └── Sets state.ui.isInteracting = false
│
└── 6. dispatch('UPDATE_ELEMENT', {x: 150}, {skipHistory: false})
        ├── Store updates element.x = 150
        ├── Creates history entry for undo
        ├── Emits 'state-changed'
        ├── Viewport already at x=150 (no visual change)
        └── PI re-renders with final x=150 ✓
```

#### 2.4.5 Viewport Modification Handling

When user modifies elements directly in viewport (drag, resize, rotate):

```javascript
// Viewport.js (or TransformManager.js)
onElementDrag(elementId, newX, newY, isDragging) {
    store.dispatch('UPDATE_ELEMENT', {
        id: elementId,
        x: newX,
        y: newY
    }, {
        skipHistory: isDragging  // Transient during drag
    });
}

onElementDragEnd(elementId, finalX, finalY) {
    store.dispatch('UPDATE_ELEMENT', {
        id: elementId,
        x: finalX,
        y: finalY
    }, {
        skipHistory: false  // Commit to history
    });
}
```

**Result:** PI automatically updates when viewport drag ends (isInteracting becomes false).

#### 2.4.6 Edge Cases & Solutions

| Scenario | Problem | Solution |
|----------|---------|----------|
| Simultaneous edits | User types in PI while another user drags in viewport | Last-write-wins at store level; collaboration layer handles conflicts |
| Rapid undo/redo | PI shows stale values after undo | Always re-read from store on `state-changed` |
| Multi-select with different values | X input shows "Mixed" but user drags | Dispatch relative delta, not absolute value |
| Computed properties | Width shown as "auto" but viewport shows 250px | PI shows model value, viewport shows computed; add "computed" indicator |
| Animation preview | Properties animate in viewport | Use `isAnimating` flag similar to `isInteracting` |

#### 2.4.7 Validation Checklist

Before any PI or Viewport change is approved, verify:

- [ ] All property changes dispatch to Store (no direct mutation)
- [ ] Both PI and Viewport subscribe to `state-changed`
- [ ] PI uses `isInteracting` guard correctly
- [ ] Viewport does NOT use `isInteracting` guard (always updates)
- [ ] Transient operations bracket with `UI_INTERACTION_START/END`
- [ ] Final commit uses `skipHistory: false`
- [ ] No local state caching of element properties
- [ ] Multi-select shows "Mixed" correctly
- [ ] Undo/redo updates both PI and Viewport

#### 2.4.8 Debugging Synchronization Issues

```javascript
// Add to Store for debugging
store.on('state-changed', (state, action) => {
    console.log('[SYNC DEBUG]', {
        action: action?.type,
        isInteracting: state.ui?.isInteracting,
        elementX: state.slides[...]?.elements[...]?.x
    });
});

// In PropertyInspector
render() {
    console.log('[PI RENDER]', {
        reason: 'state-changed',
        skipped: this.state.ui?.isInteracting
    });
}

// In Viewport
render() {
    console.log('[VIEWPORT RENDER]', {
        reason: 'state-changed',
        elementX: this.getElementX()
    });
}
```

---

## 3. Design System Component Integration

> **Reference:** See `documentation/specs/ui-system/component-library.md` for complete component API documentation.
> **Reference:** See `documentation/specs/ui-system/design-tokens-reference.md` for all design tokens.

### 3.1 Core Components Used in Property Inspector

The Property Inspector uses a **minimal set of centralized components** from the design system. All components are reusable across the application - **never create duplicate or one-off implementations**.

| Component | File | Purpose | Variants Used |
|-----------|------|---------|---------------|
| `Section` | `Section.js` | Collapsible container with header and actions | — |
| `NumberInput` | `NumberInput.js` | Numeric input with scrubbable label, pointer lock | `scrubbable: true/false` |
| `Dropdown` | `Dropdown.js` | Select menu with custom styling | `size`, `height` variants |
| `Button` | `Button.js` | Unified button with all styles | `xs`, `sm`, `md`, `lg` sizes; `primary`, `secondary`, `text`, `danger` variants |
| `ColorInput` | `ColorInput.js` | Color swatch with hex input | `compact: true/false` |
| `SliderControl` | `SliderControl.js` | Range slider with scrubbable label | Bidirectional fill |
| `SegmentedControl` | `SegmentedControl.js` | Mutually exclusive button group | Icons or labels |
| `Switch` | `Switch.js` | Boolean toggle | — |
| `TextInput` | `TextInput.js` | Plain text input field | — |
| `Flyout` | `Flyout.js` | Floating panel anchored to trigger | `left`, `right`, `bottom` positions |
| `EmptyState` | `EmptyState.js` | "No X" placeholder message | — |

### 3.2 Component Consolidation Rules

**CRITICAL:** Do not create new component variants. Use existing components:

| Instead of... | Use... |
|---------------|--------|
| Creating a new `IconButton` | `Button` with `icon` and no `label` |
| Custom numeric inputs | `NumberInput` with `scrubbable: true` |
| Inline scrubbing | `NumberInput` or `SliderControl` (built-in) |
| Custom toggle buttons | `Button` with `active` state or `SegmentedControl` |
| Custom color picker trigger | `ColorInput` component |

### 3.3 Section Component API

```javascript
import { Section } from './src/ui/components/Section.js';

new Section({
    title: 'Section Name',           // Header text
    id: 'unique-id',                 // For state persistence
    collapsed: false,                // Initial collapsed state
    onToggle: (collapsed) => {},     // Collapse callback
    actions: [                       // Header action buttons (uses Button internally)
        { icon: Icons.PLUS, title: 'Add', onClick: () => {} }
    ]
})

// Methods
section.appendChild(element)         // Add to content area
section.clear()                      // Clear content
section.setCollapsed(boolean)        // Programmatic collapse
section.toggle()                     // Toggle collapse
```

### 3.4 NumberInput Component API (with Scrubbing)

**DO NOT modify the scrubbing implementation** - it includes pointer lock, transient updates, and precise gesture detection.

```javascript
import { NumberInput } from './src/ui/components/NumberInput.js';

new NumberInput({
    label: 'X',                      // Prefix label (scrubbable if enabled)
    value: 0,                        // Initial value
    min: 0,                          // Minimum value
    max: 100,                        // Maximum value
    step: 1,                         // Increment step
    precision: 2,                    // Decimal places
    units: 'px',                     // Suffix unit display
    scrubbable: true,                // Enable label scrubbing (pointer lock)
    onChange: (value, isTransient) => {}  // isTransient=true during scrub
})

// Interaction Features (DO NOT MODIFY):
// - Pointer lock for infinite scrubbing
// - Shift+drag for 10x step
// - Alt+drag for 0.1x precision
// - Click to focus and select all
// - Arrow Up/Down ±1, Shift+Arrow ±10
// - Enter to commit, Escape to revert

// Methods
numberInput.setValue(value, notify = true)
numberInput.setDisabled(boolean)
```

### 3.5 Button Component API

**All buttons should use the unified `Button` component**, not custom button elements.

```javascript
import { Button } from './src/ui/components/Button.js';

// Standard button
new Button({
    label: 'Save',
    variant: 'primary',    // primary | secondary | text | danger
    size: 'md',            // xs (24px) | sm (28px) | md (32px) | lg (40px)
    onClick: () => {}
});

// Icon-only button (replaces IconButton pattern)
new Button({
    icon: Icons.PLUS,
    size: 'xs',
    variant: 'text',
    title: 'Add Item',     // Required for accessibility
    onClick: () => {}
});

// Toggle/active state
new Button({
    icon: Icons.EYE,
    size: 'xs',
    active: true,          // Highlighted state
    onClick: () => this.toggleVisibility()
});
```

### 3.6 Dropdown Component API

```javascript
import { Dropdown } from './src/ui/components/Dropdown.js';

new Dropdown({
    options: [
        { label: 'Inside', value: 'inside' },
        { label: 'Center', value: 'center' },
        { label: 'Outside', value: 'outside' },
        { divider: true },                         // Separator
        { label: 'Add Custom...', value: 'add', action: true }  // Action item
    ],
    value: 'center',
    placeholder: 'Select...',
    size: 'md',             // xs | sm | md | lg | xl | fill | auto
    height: null,           // sm | md (default) | lg
    onChange: (value) => {}
});

// Methods
dropdown.setValue(value)
dropdown.setOptions([...newOptions])
dropdown.open() / dropdown.close() / dropdown.toggle()
```

### 3.7 SliderControl Component API (with Scrubbing)

Used for opacity, blur radius, and other continuous values.

```javascript
import { SliderControl } from './src/ui/components/SliderControl.js';

new SliderControl({
    label: 'Opacity',
    value: 100,
    min: 0,
    max: 100,
    step: 1,
    defaultValue: 100,     // Reset on double-click
    unit: '%',
    labelWidth: 80,
    inputWidth: 48,
    disabled: false,
    onChange: (value) => {}
});

// Features:
// - Scrubbable label (pointer lock)
// - Click-to-jump on track
// - Draggable thumb
// - Double-click to reset
// - Keyboard: Arrow keys, Home/End
// - Bidirectional fill when min < 0 < max
```

### 3.8 ColorInput Component API

```javascript
import { ColorInput } from './src/ui/components/ColorInput.js';

new ColorInput(
    '#FF5500',              // Initial color
    (color) => {},          // onChange callback
    {
        width: '100%',
        showHex: true,      // Show hex text input
        compact: false      // Compact mode (swatch only)
    }
);

// Features:
// - Auto-border detection (light colors get dark border)
// - Hex input with validation
// - Native color picker integration
```

### 3.9 SegmentedControl Component API

Used for alignment buttons and exclusive options.

```javascript
import { SegmentedControl } from './src/ui/components/SegmentedControl.js';

// With icons
new SegmentedControl({
    options: [
        { label: 'Align Left', value: 'left', icon: Icons.ALIGN_LEFT },
        { label: 'Align Center', value: 'center', icon: Icons.ALIGN_CENTER },
        { label: 'Align Right', value: 'right', icon: Icons.ALIGN_RIGHT }
    ],
    value: 'left',
    onChange: (value) => {}
});

// With labels
new SegmentedControl({
    options: [
        { label: 'Auto', value: 'auto' },
        { label: 'Fixed', value: 'fixed' }
    ],
    value: 'auto',
    onChange: (value) => {}
});
```

---

## 4. Rendering Flow

### 4.1 Initial Render

```
1. PropertyInspector.init()
   ├── Bind store events
   └── Call render()
   
2. PropertyInspector.render()
   ├── Clear container
   ├── Get selection from state
   ├── Update header title
   │
   ├── IF selection.length > 0:
   │   ├── positionSection.update(selection)
   │   ├── layoutSection.update(selection)
   │   ├── appearanceSection.update(selection)
   │   ├── textSection.update(selection)
   │   ├── fillSection.update(selection) (if not text)
   │   ├── strokeSection.update(selection)
   │   ├── effectsSection.update(selection)
   │   └── exportSection.update(selection)
   │
   └── ELSE (no selection):
       ├── slideSection.update([])
       └── placeholderSection.update([])
```

### 4.2 Section Update Flow

```
section.update(selection)
   ├── IF selection empty:
   │   └── Hide section
   │
   └── ELSE:
       ├── Show section
       ├── Get element from state
       ├── Read element properties
       └── Update input values (without triggering onChange)
```

### 4.3 User Interaction Flow

```
User modifies input
   ├── Input onChange fires
   │
   ├── section.updateProperty(prop, value, isTransient)
   │   └── store.dispatch('UPDATE_ELEMENT', {...})
   │
   ├── Store updates state
   │
   ├── Store emits 'state-changed'
   │
   └── PropertyInspector.render() (if not isInteracting)
       └── All sections update from new state
```

---

## 5. CSS Architecture & Design Tokens

> **CRITICAL:** All numeric values MUST use design tokens. No magic numbers.
> **Reference:** See `styles/modules/variables.css` for the single source of truth.

### 5.1 Design Token Usage

The Property Inspector uses global design tokens with minimal local overrides:

```css
/* ✅ CORRECT - Using design tokens */
.pi-section {
    padding: var(--spacing-2);                  /* 8px */
    border-radius: var(--radius-sm);            /* 4px */
    background: var(--color-bg-panel);
    border: var(--border-width-1) solid var(--color-border);
}

.pi-input {
    height: var(--input-height-md);             /* 28px */
    font-size: var(--font-size-md);             /* 12px */
    color: var(--color-text-primary);
    background: var(--color-bg-input);
}

.pi-label {
    font-size: var(--font-size-sm);             /* 11px */
    color: var(--color-text-secondary);
    font-weight: var(--font-weight-medium);     /* 500 */
}

/* ❌ WRONG - Magic numbers */
.pi-section {
    padding: 8px;           /* Use var(--spacing-2) */
    border-radius: 4px;     /* Use var(--radius-sm) */
    background: #2D2D2D;    /* Use var(--color-bg-panel) */
}
```

### 5.2 Property Inspector Token Mapping

| Purpose | Design Token | Value |
|---------|--------------|-------|
| **Spacing** | | |
| Row gap | `--spacing-2` | 8px |
| Section padding | `--spacing-3` | 12px |
| Inline gap | `--spacing-1` | 4px |
| **Sizing** | | |
| Input height | `--input-height-md` | 28px |
| Row height | `--control-size-lg` | 32px |
| Icon button | `--control-size-sm` | 24px |
| **Typography** | | |
| Label text | `--font-size-sm` | 11px |
| Value text | `--font-size-md` | 12px |
| Section title | `--font-size-lg` | 13px |
| **Colors** | | |
| Panel background | `--color-bg-panel` | #2D2D2D |
| Input background | `--color-bg-input` | #383838 |
| Label text | `--color-text-secondary` | #A0A0A0 |
| Value text | `--color-text-primary` | #E8E8E8 |
| Hover state | `--color-bg-hover` | accent-subtle |
| **Border** | | |
| Standard border | `--color-border` | #404040 |
| Border radius | `--radius-sm` | 4px |
| Focus ring | `--color-border-focus` | #18A0FB |

### 5.3 Class Naming Convention (BEM)

```css
/* Block */
.pi-section { }

/* Block__Element */
.pi-section__header { }
.pi-section__title { }
.pi-section__content { }
.pi-section__actions { }

/* Block--Modifier */
.pi-section--collapsed { }
.pi-row--hidden { }
.pi-input--disabled { }

/* Component-specific (use for fill/stroke/effect rows) */
.fill-row { }
.fill-row__swatch { }
.fill-row__controls { }
.fill-row--inherited { }
```

### 5.4 Hover & Active States

Per design system principles, all interactive states use accent color:

```css
/* Standard hover pattern */
.pi-row:hover {
    background: var(--color-accent-subtle);     /* 15% accent */
}

/* Active/selected pattern */
.pi-row.active {
    background: var(--color-accent-muted);      /* 25% accent */
}

/* Button hover (uses Button component tokens) */
.btn:hover {
    background: var(--color-bg-hover);
}
```

### 5.5 Disabled States

```css
.pi-input:disabled,
.pi-input--disabled {
    opacity: 0.5;
    pointer-events: none;
    color: var(--color-text-disabled);
}

/* Alternative: Use component's setDisabled() method */
numberInput.setDisabled(true);
```

---

## 6. Testing Strategy

### 6.1 Unit Test Structure

```javascript
describe('PropertyInspector', () => {
    describe('Rendering', () => {
        it('renders position section when element selected');
        it('hides fill section for text elements');
        it('shows slide section when no selection');
    });
    
    describe('Updates', () => {
        it('updates element when input changes');
        it('handles transient updates during scrub');
    });
    
    describe('Multi-Selection', () => {
        it('shows common properties only');
        it('displays mixed values indicator');
    });
});
```

### 6.2 Test Utilities

```javascript
// Create mock element
const mockElement = {
    id: 'test-1',
    type: 'rectangle',
    x: 100, y: 200,
    width: 300, height: 150,
    style: { backgroundColor: '#FF0000' }
};

// Create mock state
const mockState = {
    editor: {
        mode: 'slide',
        activeSlideId: 'slide-1',
        selectedElementIds: ['test-1']
    },
    slides: {
        'slide-1': {
            elements: { 'test-1': mockElement }
        }
    }
};
```

---

## 7. Performance Considerations

### 7.1 Render Optimization

- **Interacting Flag**: Skip renders during active scrubbing
- **Selective Updates**: Only update changed sections
- **DOM Reuse**: Reuse existing DOM elements when possible

### 7.2 Memory Management

- **Event Cleanup**: Remove listeners when sections are destroyed
- **Flyout Lifecycle**: Close flyouts before re-rendering
- **Style References**: Weak references to style objects

---

## 8. Component Lifecycle

### 8.1 Initialization Lifecycle

```
Application Start
       │
       ▼
┌──────────────────┐
│ PropertyInspector│
│   constructor()  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────────┐
│ Create Section   │────▶│ Section.ctor()   │
│   Instances      │     │ createContent()  │
└────────┬─────────┘     └──────────────────┘
         │
         ▼
┌──────────────────┐
│     init()       │
│ - Bind events    │
│ - Initial render │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Ready State     │
└──────────────────┘
```

### 8.2 Update Lifecycle

```
Store Event
    │
    ├── 'state-changed'
    │         │
    │         ▼
    │   ┌─────────────────┐
    │   │ Check isInteract│──Yes──▶ Skip Render
    │   └────────┬────────┘
    │            │ No
    │            ▼
    │   ┌─────────────────┐
    │   │    render()     │
    │   └────────┬────────┘
    │            │
    │            ▼
    │   ┌─────────────────┐
    │   │ section.update()│ (for each section)
    │   └─────────────────┘
    │
    └── 'selection-changed'
              │
              ▼
        ┌─────────────────┐
        │    render()     │
        └─────────────────┘
```

### 8.3 Teardown Lifecycle

```javascript
// Section teardown pattern
destroy() {
    // 1. Close any open flyouts
    this.closeFlyout();
    
    // 2. Remove event listeners
    this.unbindEvents();
    
    // 3. Clear DOM references
    this.element = null;
    this.inputs = null;
    
    // 4. Remove from parent
    this.section.element.remove();
}
```

---

## 9. Memory Management

### 9.1 Event Listener Patterns

```javascript
// CORRECT: Store reference for cleanup
this.boundHandler = this.handleChange.bind(this);
element.addEventListener('change', this.boundHandler);

// In destroy():
element.removeEventListener('change', this.boundHandler);

// INCORRECT: Anonymous functions (memory leak)
element.addEventListener('change', () => this.handleChange()); // Can't remove!
```

### 9.2 Flyout Memory Management

```javascript
// Close flyouts before re-render to prevent orphans
render() {
    this.closeAllFlyouts();
    // ... render logic
}

closeAllFlyouts() {
    document.querySelectorAll('.pi-flyout').forEach(f => f.remove());
}
```

### 9.3 Store Subscription Cleanup

```javascript
// Store reference to unsubscribe function
this.unsubscribe = store.on('state-changed', this.handleStateChange);

// In destroy():
if (this.unsubscribe) {
    this.unsubscribe();
}
```

### 9.4 DOM Node Pooling

For performance with large lists (fills, strokes):

```javascript
class FillRowPool {
    constructor() {
        this.pool = [];
    }
    
    acquire() {
        return this.pool.pop() || this.createNew();
    }
    
    release(row) {
        row.reset();
        this.pool.push(row);
    }
}
```

---

## 10. Accessibility

### 10.1 Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Move between inputs |
| Arrow Up/Down | Increment/decrement by 1 |
| Shift + Arrow | Increment/decrement by 10 |
| Enter | Commit input value |
| Escape | Cancel flyout / revert input |

### 10.2 ARIA Attributes

```html
<div class="pi-section" role="group" aria-label="Position">
    <button aria-expanded="true" aria-controls="position-content">
        Position
    </button>
    <div id="position-content" role="region">
        <!-- Section content -->
    </div>
</div>
```

### 10.3 Focus Management

```javascript
// Focus trap in flyout
flyout.open = () => {
    this.previousFocus = document.activeElement;
    this.firstFocusable.focus();
};

flyout.close = () => {
    this.previousFocus?.focus();
};
```

### 10.4 Screen Reader Announcements

```javascript
// Announce value changes
announceChange(message) {
    const announcer = document.getElementById('sr-announcer');
    announcer.textContent = message;
    // aria-live="polite" will announce
}

// Usage
announceChange('Width changed to 300 pixels');
```

---

## 11. Test Scenarios - Bidirectional Sync

> **Reference:** [TEST-AUTOMATION-PLAN.md](./TEST-AUTOMATION-PLAN.md) §5

These test scenarios validate the critical PI↔Viewport synchronization described in §2.4.

### 11.1 Core Sync Tests

| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| **Input → Store → Viewport Flow** |
| SYNC-01 | PI input changes update viewport | Type value in PI → element moves on canvas | P0 |
| SYNC-02 | PI slider changes update viewport | Drag slider in PI → element property changes live | P0 |
| SYNC-03 | PI dropdown changes update viewport | Select option in PI → element updates immediately | P0 |
| **Viewport → Store → PI Flow** |
| SYNC-10 | Viewport drag updates PI | Drag element on canvas → X/Y inputs update | P0 |
| SYNC-11 | Viewport resize updates PI | Resize element → W/H inputs update | P0 |
| SYNC-12 | Viewport rotate updates PI | Rotate element → rotation input updates | P0 |
| SYNC-13 | Viewport fill change updates PI | Use eyedropper → fill swatch updates | P1 |

### 11.2 Transient Update Tests

| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| SYNC-20 | Scrubbing doesn't create history | Scrub value from 100→200 → only one undo entry | P0 |
| SYNC-21 | PI skips update during scrub | While scrubbing, PI doesn't fight with input | P1 |
| SYNC-22 | Final value commits correctly | After scrub release, final value is committed | P0 |
| SYNC-23 | Viewport updates during scrub | While scrubbing, viewport reflects changes live | P0 |

### 11.3 Undo/Redo Sync Tests

| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| SYNC-30 | Undo reverts both PI and canvas | Ctrl+Z after PI change → both revert | P0 |
| SYNC-31 | Redo restores both PI and canvas | Ctrl+Y after undo → both restore | P0 |
| SYNC-32 | Multiple undos maintain sync | Undo 5 times → PI and canvas stay in sync | P1 |
| SYNC-33 | Undo after viewport change | Change on canvas, Ctrl+Z → PI updates too | P1 |

### 11.4 Multi-Select Sync Tests

| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| SYNC-40 | Multi-select shows mixed | 2 elements with different X → PI shows "–" | P0 |
| SYNC-41 | Multi-select shared value | 2 elements with same X → PI shows value | P0 |
| SYNC-42 | Multi-select change applies to all | Change X when 3 selected → all 3 move | P0 |
| SYNC-43 | Multi-select relative drag | Drag multi-selection → all move by same delta | P1 |

### 11.5 Edge Case Sync Tests

| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| SYNC-50 | Rapid changes don't desync | Click fast between elements → PI always shows correct values | P1 |
| SYNC-51 | External state change syncs | Redux DevTools change → both update | P2 |
| SYNC-52 | Conflict resolution | Two rapid changes → last-write-wins, both show final | P2 |
| SYNC-53 | Delete element clears PI | Delete selected element → PI shows empty state | P1 |

### 11.6 Debugging Sync Issues (Test Utilities)

```javascript
// test-utils/sync-debugger.js

/**
 * Verify PI and Viewport are synchronized
 * Add to tests to catch sync bugs early
 */
export async function verifySyncState(page, elementId, property) {
    // Get PI value
    const piValue = await page.locator(`[data-testid="${property}-input"]`).inputValue();
    
    // Get Viewport/Store value
    const storeValue = await page.evaluate((id, prop) => {
        const state = window.__STORE__.getState();
        return state.slides[state.editor.activeSlideId].elements[id][prop];
    }, elementId, property);
    
    // Verify match
    expect(piValue).toBe(String(storeValue));
}

/**
 * Test transient update behavior
 */
export async function testTransientUpdates(page, inputLocator, dragDistance) {
    // Get initial undo stack size
    const initialUndoSize = await page.evaluate(() => 
        window.__STORE__.getState().history.past.length
    );
    
    // Perform scrub
    await inputLocator.hover();
    await page.mouse.down();
    await page.mouse.move(dragDistance, 0);
    await page.mouse.up();
    
    // Verify only one undo entry created
    const finalUndoSize = await page.evaluate(() => 
        window.__STORE__.getState().history.past.length
    );
    
    expect(finalUndoSize).toBe(initialUndoSize + 1);
}
```

---

## 12. Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PROPERTY INSPECTOR                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                        HEADER                                │   │
│  │  [←] Title                                              [⋮] │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  POSITION SECTION                                    [═══] │   │
│  │  ┌─────────────────────────────────────────────────────┐   │   │
│  │  │ AlignmentRow: [◧][◨][◩] [◪][◫][◬]                  │   │   │
│  │  │ CoordinatesRow: X [___] Y [___]                     │   │   │
│  │  │ TransformRow: ⟲ [___] [↔][↕]                        │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  LAYOUT SECTION                                              │   │
│  │  ┌─────────────────────────────────────────────────────┐   │   │
│  │  │ DimensionsRow: W [___] [🔗] H [___]                 │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  FILL SECTION                                         [+]   │   │
│  │  ┌─────────────────────────────────────────────────────┐   │   │
│  │  │ FillRow: [≡][█] #FFFFFF 100% [👁][🗑]               │   │   │
│  │  │ FillRow: [≡][▦] gradient      [👁][🗑]               │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  STROKE SECTION                                       [+]   │   │
│  │  ┌─────────────────────────────────────────────────────┐   │   │
│  │  │ StrokeRow: [≡][█] #000000 100% [2px][⚙️][👁][🗑]    │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  EFFECTS SECTION                                      [+]   │   │
│  │  ┌─────────────────────────────────────────────────────┐   │   │
│  │  │ EffectRow: [💧] Drop Shadow   [⚙️]          [👁][🗑] │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

LEGEND:
[█] = Color swatch          [≡] = Drag handle
[👁] = Visibility toggle    [🗑] = Delete button
[⚙️] = Settings flyout      [+] = Add button
[🔗] = Constrain toggle     [↔] = Flip horizontal
```

---

## Next Section: [02 - Position Section](./02-position-section.md)
