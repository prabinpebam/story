# Interaction Patterns

> **Comprehensive guide to interaction behaviors and patterns in the Story Design System**

## Table of Contents

1. [Overview](#1-overview)
2. [Input Interactions](#2-input-interactions)
3. [Selection Patterns](#3-selection-patterns)
4. [Drag & Drop](#4-drag--drop)
5. [Keyboard Navigation](#5-keyboard-navigation)
6. [Focus Management](#6-focus-management)
7. [Hover & Active States](#7-hover--active-states)
8. [Feedback Patterns](#8-feedback-patterns)
9. [Modal & Overlay Patterns](#9-modal--overlay-patterns)
10. [Touch & Gesture Support](#10-touch--gesture-support)

---

## 1. Overview

### 1.1 Interaction Philosophy

Story follows a **professional creative tool** interaction model, similar to Figma, Sketch, and Adobe applications:

| Principle | Description |
|-----------|-------------|
| **Direct Manipulation** | Users interact directly with content |
| **Immediate Feedback** | Every action has instant visual response |
| **Predictable Behavior** | Same action always produces same result |
| **Recoverable Actions** | Undo/redo available for all changes |
| **Keyboard First** | Power users can work without mouse |

### 1.2 Interaction State Model

Every interactive element supports these states:

```
┌─────────────────────────────────────────────────────────────────┐
│                    INTERACTION STATE MODEL                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Default  ──hover──►  Hover  ──mousedown──►  Active/Pressed     │
│     │                   │                          │             │
│     │                   │                          │             │
│     ▼                   ▼                          ▼             │
│  Focused  ◄──────────────────────────────── (on release)        │
│     │                                                            │
│     ▼                                                            │
│  Disabled (overlay state - blocks all interactions)             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Interaction Color Philosophy

All interactive states use **accent color** for brand consistency:

| State | Color Token | Visual Effect |
|-------|-------------|---------------|
| **Default** | Base colors | No accent |
| **Hover** | `--color-accent-subtle` | 20% accent background |
| **Active/Pressed** | `--color-accent-muted` | 35% accent background |
| **Selected** | `--color-accent` | Full accent background |
| **Focus** | `--color-border-focus` | Accent focus ring |

---

## 2. Input Interactions

### 2.1 Text Input

**Behaviors:**
- Click to focus and place cursor
- Double-click to select word
- Triple-click to select all
- Escape to blur without saving (revert)
- Enter to confirm and blur

**Implementation:**
```javascript
input.addEventListener('focus', () => {
    initialValue = input.value;
});

input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        input.value = initialValue;
        input.blur();
    }
    if (e.key === 'Enter') {
        input.blur(); // Triggers change event
    }
});
```

### 2.2 Numeric Input

**Standard Behaviors:**
| Action | Result |
|--------|--------|
| Click input | Focus, select all |
| Arrow Up/Down | Increment/decrement by step |
| Shift + Arrow | 10x step increment |
| Type value | Direct entry |
| Enter | Confirm value |
| Escape | Revert to initial |

**Scrubbing Behaviors:**
| Action | Result |
|--------|--------|
| Drag label | Adjust value with pointer lock |
| Shift + Drag | 10x step (coarse) |
| Alt + Drag | 0.1x step (fine) |
| Release | Commit final value |

**Visual Feedback:**
- Cursor changes to `ew-resize` on scrubbable elements
- Pointer lock hides cursor during scrub
- Value updates live during drag

### 2.3 Color Input

**Click Behavior:**
1. Click swatch → Open color picker flyout
2. Select color → Apply and close
3. Click outside → Close without change

**Swatch Visual States:**
```css
/* Default */
.color-swatch {
    border: 1px solid var(--color-border);
}

/* Hover */
.color-swatch:hover {
    border-color: var(--color-border-hover);
}

/* Active (picker open) */
.color-swatch.active {
    border-color: var(--color-accent);
    box-shadow: 0 0 0 2px var(--color-accent-subtle);
}
```

### 2.4 Slider Interaction

**Track Click:**
- Click anywhere on track → Jump to that position
- Continue dragging after click

**Thumb Drag:**
- Mousedown on thumb → Begin drag
- Move mouse → Adjust value proportionally
- Release → Commit value

**Label Scrubbing:**
- Mousedown on label → Begin scrub
- Horizontal mouse movement adjusts value
- Works like numeric input scrubbing

**Keyboard:**
| Key | Action |
|-----|--------|
| Arrow Left/Down | Decrease by step |
| Arrow Right/Up | Increase by step |
| Shift + Arrow | 10x step |
| Home | Jump to minimum |
| End | Jump to maximum |

---

## 3. Selection Patterns

### 3.1 Single Selection

**Click Behavior:**
- Click item → Select (deselect others)
- Item shows selected state

**Visual Indicators:**
```css
.item {
    background: transparent;
}

.item:hover {
    background: var(--color-accent-subtle);
}

.item.selected {
    background: var(--color-accent);
    color: var(--color-text-on-accent);
}
```

### 3.2 Multi-Selection

**Click Modifiers:**
| Action | Result |
|--------|--------|
| Click | Select only this item |
| Cmd/Ctrl + Click | Toggle item selection |
| Shift + Click | Range select (from last selection) |
| Cmd/Ctrl + A | Select all |
| Escape | Deselect all |

**Implementation Pattern:**
```javascript
handleItemClick(e, item) {
    if (e.metaKey || e.ctrlKey) {
        // Toggle selection
        this.toggleSelection(item);
    } else if (e.shiftKey && this.lastSelected) {
        // Range select
        this.selectRange(this.lastSelected, item);
    } else {
        // Single select
        this.clearSelection();
        this.select(item);
    }
    this.lastSelected = item;
}
```

### 3.3 Dropdown Selection

**Opening:**
- Click trigger → Toggle menu
- Focus + Enter/Space → Open menu
- Focus + Arrow Down → Open and select first

**Navigation:**
- Arrow Up/Down → Move selection
- Enter → Confirm selection
- Escape → Close without selection
- Click outside → Close

**Search (if enabled):**
- Type characters → Filter options
- Debounced search (150ms)

### 3.4 Segmented Control

**Behavior:**
- Click segment → Select (instant)
- Tab → Focus control
- Arrow Left/Right → Change selection
- Only one segment can be active

**Visual States:**
```css
.segment {
    background: transparent;
    color: var(--color-text-primary);
}

.segment:hover {
    background: var(--color-accent-subtle);
}

.segment.active {
    background: var(--color-accent);
    color: var(--color-text-on-accent);
}
```

---

## 4. Drag & Drop

### 4.1 Drag Initiation

**Threshold:**
- Mousedown + move 3-5px → Begin drag
- Prevents accidental drags from clicks

**Implementation:**
```javascript
handleMouseDown(e) {
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.isDragging = false;
    
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseup', this.handleMouseUp);
}

handleMouseMove(e) {
    const dx = Math.abs(e.clientX - this.startX);
    const dy = Math.abs(e.clientY - this.startY);
    
    if (!this.isDragging && (dx > 3 || dy > 3)) {
        this.isDragging = true;
        this.onDragStart();
    }
    
    if (this.isDragging) {
        this.onDrag(e);
    }
}
```

### 4.2 Drag Visual Feedback

**Cursor Changes:**
```css
/* Draggable element */
.draggable {
    cursor: grab;
}

/* While dragging */
.draggable.dragging,
body.is-dragging {
    cursor: grabbing;
}
```

**Ghost/Preview:**
- Semi-transparent copy follows cursor
- Or outline indicates drop position

### 4.3 Drop Zones

**Visual Indicators:**
```css
.drop-zone {
    border: 2px dashed transparent;
    transition: border-color var(--transition-fast);
}

.drop-zone.drag-over {
    border-color: var(--color-accent);
    background: var(--color-accent-subtle);
}
```

### 4.4 Pointer Lock Dragging

For infinite scrubbing (numeric inputs):

```javascript
startScrub(e) {
    this.element.requestPointerLock();
    store.dispatch('UI_INTERACTION_START');
}

handleScrubMove(e) {
    // e.movementX gives relative movement
    const delta = e.movementX * this.sensitivity;
    this.setValue(this.value + delta);
}

endScrub() {
    document.exitPointerLock();
    store.dispatch('UI_INTERACTION_END');
}
```

---

## 5. Keyboard Navigation

### 5.1 Tab Order

**Principles:**
- Logical reading order (left-to-right, top-to-bottom)
- Skip decorative elements
- Group related controls

**Implementation:**
```html
<!-- Proper tab order -->
<button tabindex="0">First</button>
<input tabindex="0">
<button tabindex="0">Second</button>

<!-- Skip element -->
<div tabindex="-1" aria-hidden="true">Decorative</div>

<!-- Forced order (avoid if possible) -->
<button tabindex="1">Forced first</button>
```

### 5.2 Global Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + Z` | Undo |
| `Cmd/Ctrl + Shift + Z` | Redo |
| `Cmd/Ctrl + S` | Save |
| `Cmd/Ctrl + A` | Select all |
| `Delete/Backspace` | Delete selection |
| `Escape` | Cancel/Deselect |
| `Space` | Play/Pause (presentation) |
| `F` | Fit to screen |
| `1-9` | Zoom levels |

### 5.3 Component Keyboard Patterns

**Button:**
- `Enter` or `Space` → Activate

**Dropdown:**
- `Enter/Space` → Open
- `Arrow Up/Down` → Navigate
- `Escape` → Close
- `Enter` → Select

**Modal:**
- `Escape` → Close
- `Tab` → Cycle focus within modal
- Focus trapped inside modal

**Slider:**
- `Arrow Keys` → Adjust value
- `Home/End` → Min/Max

### 5.4 Keyboard Accessibility

```javascript
// Handle keyboard for custom elements
element.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.activate();
    }
});

// Ensure element is focusable
element.setAttribute('tabindex', '0');
element.setAttribute('role', 'button');
```

---

## 6. Focus Management

### 6.1 Focus Ring Styling

```css
/* Keyboard focus only */
.interactive:focus-visible {
    outline: 2px solid var(--color-border-focus);
    outline-offset: 2px;
}

/* Remove default focus for mouse users */
.interactive:focus {
    outline: none;
}
```

### 6.2 Focus Trapping

For modals and dialogs:

```javascript
class FocusTrap {
    constructor(container) {
        this.container = container;
        this.focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        this.firstElement = this.focusableElements[0];
        this.lastElement = this.focusableElements[this.focusableElements.length - 1];
    }
    
    handleKeyDown(e) {
        if (e.key !== 'Tab') return;
        
        if (e.shiftKey) {
            if (document.activeElement === this.firstElement) {
                e.preventDefault();
                this.lastElement.focus();
            }
        } else {
            if (document.activeElement === this.lastElement) {
                e.preventDefault();
                this.firstElement.focus();
            }
        }
    }
    
    activate() {
        this.firstElement?.focus();
        this.container.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
    
    deactivate() {
        this.container.removeEventListener('keydown', this.handleKeyDown.bind(this));
    }
}
```

### 6.3 Focus Restoration

When closing modals/popovers:

```javascript
openModal() {
    this.previouslyFocused = document.activeElement;
    this.modal.style.display = 'block';
    this.focusTrap.activate();
}

closeModal() {
    this.modal.style.display = 'none';
    this.focusTrap.deactivate();
    this.previouslyFocused?.focus();
}
```

---

## 7. Hover & Active States

### 7.1 Hover Timing

```css
/* Instant hover (no delay) */
.button:hover {
    background: var(--color-accent-subtle);
    transition: background-color var(--transition-fast);
}

/* Delayed hover for tooltips */
.tooltip-trigger {
    --tooltip-delay: 500ms;
}
```

### 7.2 Active/Pressed State

```css
.button:active {
    background: var(--color-accent-muted);
    transform: scale(0.98); /* Subtle press effect */
}
```

### 7.3 Toggle/Selected State

```css
/* Toggle button (not currently active) */
.toggle-btn {
    background: transparent;
}

.toggle-btn:hover {
    background: var(--color-accent-subtle);
}

/* Toggle button (active) */
.toggle-btn.active {
    background: var(--color-accent);
    color: var(--color-text-on-accent);
}

.toggle-btn.active:hover {
    background: var(--color-accent-hover);
}
```

### 7.4 Disabled State

```css
.element:disabled,
.element.disabled {
    opacity: var(--opacity-disabled); /* 0.4 */
    cursor: not-allowed;
    pointer-events: none;
}
```

---

## 8. Feedback Patterns

### 8.1 Loading States

**Button Loading:**
```javascript
button.setLoading(true);
// Shows spinner, disables interaction
// aria-busy="true" for screen readers
```

**Visual Pattern:**
```css
.btn--loading {
    position: relative;
    pointer-events: none;
}

.btn--loading .btn__label,
.btn--loading .btn__icon {
    opacity: 0;
}

.btn__spinner {
    position: absolute;
    /* Centered spinner */
}
```

### 8.2 Success/Error Feedback

**Transient States:**
```javascript
// Flash success
element.classList.add('success');
setTimeout(() => element.classList.remove('success'), 1500);

// Flash error
element.classList.add('error');
setTimeout(() => element.classList.remove('error'), 1500);
```

**Visual:**
```css
.input.success {
    border-color: var(--color-success);
}

.input.error {
    border-color: var(--color-danger);
}
```

### 8.3 Toast Notifications

**Pattern:**
- Appear in corner (usually bottom-right)
- Auto-dismiss after 3-5 seconds
- Dismissible on click
- Stack multiple toasts

### 8.4 Progress Indicators

**Determinate Progress:**
```css
.progress-bar {
    height: 4px;
    background: var(--color-bg-tertiary);
}

.progress-bar__fill {
    height: 100%;
    background: var(--color-accent);
    transition: width var(--transition-normal);
}
```

**Indeterminate Progress:**
```css
.progress-bar--indeterminate .progress-bar__fill {
    width: 30%;
    animation: indeterminate 1.5s infinite ease-in-out;
}

@keyframes indeterminate {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(400%); }
}
```

---

## 9. Modal & Overlay Patterns

### 9.1 Modal Structure

```html
<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <div class="modal-backdrop" aria-hidden="true"></div>
    <div class="modal-content">
        <header class="modal-header">
            <h2 id="modal-title">Modal Title</h2>
            <button class="modal-close" aria-label="Close">×</button>
        </header>
        <div class="modal-body">
            <!-- Content -->
        </div>
        <footer class="modal-footer">
            <button class="btn btn--secondary">Cancel</button>
            <button class="btn btn--primary">Confirm</button>
        </footer>
    </div>
</div>
```

### 9.2 Modal Behavior

**Opening:**
1. Show backdrop (animate opacity)
2. Show modal (animate scale/opacity)
3. Trap focus inside modal
4. Focus first focusable element

**Closing:**
1. Animate out
2. Release focus trap
3. Restore previous focus
4. Remove from DOM or hide

### 9.3 Backdrop Click

```javascript
backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
        this.close();
    }
});
```

### 9.4 Flyout/Popover Pattern

**Positioning:**
```javascript
position() {
    const triggerRect = this.trigger.getBoundingClientRect();
    const flyoutRect = this.element.getBoundingClientRect();
    
    // Preferred: below trigger
    let top = triggerRect.bottom + 8;
    let left = triggerRect.left;
    
    // Flip if off screen
    if (top + flyoutRect.height > window.innerHeight) {
        top = triggerRect.top - flyoutRect.height - 8;
    }
    
    // Clamp to viewport
    left = Math.max(8, Math.min(left, window.innerWidth - flyoutRect.width - 8));
    
    this.element.style.top = `${top}px`;
    this.element.style.left = `${left}px`;
}
```

**Dismissal:**
- Click outside → Close
- Escape → Close
- Scroll (outside flyout) → Close
- Window resize → Reposition or close

---

## 10. Touch & Gesture Support

### 10.1 Touch Targets

**Minimum Size:**
- Touch targets should be at least **44x44px**
- Or have adequate spacing between smaller targets

```css
.touch-target {
    min-width: 44px;
    min-height: 44px;
    /* Or use padding to achieve touch area */
}
```

### 10.2 Gesture Mapping

| Touch Gesture | Mouse Equivalent |
|---------------|------------------|
| Tap | Click |
| Double Tap | Double Click |
| Long Press | Right Click |
| Drag | Click + Drag |
| Pinch | Scroll + Ctrl (zoom) |
| Two-finger Pan | Scroll |

### 10.3 Preventing Touch Issues

```css
/* Prevent text selection during touch */
.interactive {
    -webkit-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
}

/* Prevent highlight on tap */
.interactive {
    -webkit-tap-highlight-color: transparent;
}
```

### 10.4 Touch vs Mouse Detection

```javascript
// Detect primary input type
const isTouchDevice = 'ontouchstart' in window || 
    navigator.maxTouchPoints > 0;

// Or detect per-interaction
element.addEventListener('pointerdown', (e) => {
    const isTouch = e.pointerType === 'touch';
    const isPen = e.pointerType === 'pen';
    const isMouse = e.pointerType === 'mouse';
});
```

---

## Appendix: Pattern Quick Reference

### State Transitions

```
DEFAULT
    │
    ├──hover──► HOVER ──mousedown──► ACTIVE
    │              │                    │
    │              │                    │
    ├──focus──► FOCUSED               │
    │              │                    │
    │              ◄────────────────────┘
    │
    └──disable──► DISABLED
```

### Color States Reference

| State | Background | Border | Text |
|-------|------------|--------|------|
| Default | `--color-bg-input` | `--color-border` | `--color-text-primary` |
| Hover | `--color-accent-subtle` | `--color-border-hover` | `--color-text-primary` |
| Active | `--color-accent-muted` | `--color-accent` | `--color-text-primary` |
| Selected | `--color-accent` | `--color-accent` | `--color-text-on-accent` |
| Focus | — | `--color-border-focus` | — |
| Disabled | `--opacity-40` | — | — |

### Keyboard Shortcuts by Category

**Navigation:**
- `Tab` - Next focusable
- `Shift + Tab` - Previous focusable
- `Arrow Keys` - Navigate within component

**Actions:**
- `Enter` / `Space` - Activate
- `Escape` - Cancel / Close
- `Delete` - Remove

**Modifiers:**
- `Shift` - Extend selection / Large step
- `Cmd/Ctrl` - Toggle selection / Modifier action
- `Alt` - Fine adjustment

---

*Last Updated: December 2024*
*Version: 1.0*
