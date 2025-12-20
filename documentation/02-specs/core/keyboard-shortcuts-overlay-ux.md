# Keyboard Shortcuts Overlay - UI/UX Specification

Canonical ledger: `documentation/02-specs/core/keyboard-shortcuts-ledger.md`

## Overview

A fast, responsive, multi-column keyboard shortcuts panel optimized for quick access and learning. Users can bring it up instantly with `?` (Shift+`/`) or `Cmd/Ctrl+/`, scan shortcuts across multiple columns, and dismiss it just as quickly.

**Key Features:**
- **Instant access**: Opens in <100ms with `?` shortcut
- **Multi-column layout**: Shows 50+ shortcuts at once
- **Responsive**: 3 columns (desktop) → 2 (tablet) → 1 (mobile)
- **Quick dismiss**: Escape, backdrop click, or same shortcut
- **Live search**: Find any shortcut in <2 seconds

---

## Design System Compliance

**✅ Strict adherence to Story design principles:**

### Global Design System Usage
- **All CSS variables**: No hardcoded colors, spacing, or typography
- **Light & Dark mode**: Uses semantic color tokens that adapt to theme
- **Interaction color philosophy**: All interactions use accent color
  - Hover: `--color-accent-subtle` (15% opacity)
  - Active: `--color-accent-muted` (25% opacity)
  - Selected: `--color-accent` (100%)
- **Consistent spacing**: 4px base grid via `--spacing-*` tokens
- **Typography scale**: Uses `--font-size-*` and `--font-weight-*` tokens

### Theme Support
This component is **theme-ready**. When accent color changes from blue → purple:
- All hover states → purple
- All active states → purple
- Tab selection → purple
- Close button → purple
- Search clear button → purple
- No hardcoded colors remain

### Missing Design Tokens
The following tokens should be added to `variables.css` for complete support:
```css
--spacing-3-5: 14px;  /* For tab padding (6px-14px) */
--spacing-7: 28px;    /* For column gap */
```

### Reusable Components
This overlay uses the **modal pattern** that should be consistent with:
- Alert modals (backdrop, close button, header)
- Context menus (hover states, interaction colors)
- Dropdowns (search input, list items)
- Panels (surface hierarchy, borders)

---

## 1. Design Principles

1. **Fast Access** - Opens instantly (<100ms), autofocus search
2. **High Density** - Multi-column layout shows maximum shortcuts
3. **Scannable** - Clear visual hierarchy, grouped by category
4. **Learnable** - Usage tracking shows frequently used shortcuts
5. **Responsive** - Adapts to screen size (3 → 2 → 1 columns)
6. **Accessible** - Keyboard-only navigation, screen reader support

---

## 2. Layout & Dimensions

Note: the overlay’s shortcut content must be generated from the canonical ledger (`documentation/02-specs/core/keyboard-shortcuts-ledger.md`). Any diagrams below are illustrative of layout density, not a hardcoded source of truth.

### 2.1 Desktop Layout (3 Columns)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  Keyboard Shortcuts                                     Press ? or Cmd/Ctrl+/ to toggle [×] │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  🔍 Search shortcuts...                                                                  │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  All  Recent  Slides  Tools  Edit  Arrange  Text  Panels  Presentation  →                │
├───────────────────────────┬───────────────────────────┬─────────────────────────────────┤
│ TOOLS                     │ EDIT                      │ TEXT                            │
│ Select / Move        V    │ Copy                 ⌘C   │ Bold                       ⌘B   │
│ Hand (Pan)           H    │ Paste                ⌘V   │ Italic                     ⌘I   │
│ Rectangle            R    │ Duplicate             ⌘D   │ Underline                  ⌘U   │
│ Ellipse              O    │ Delete             Del/⌫  │ Exit text edit           Esc/⌘↵  │
│ Line                 L    │ Undo                 ⌘Z   │                               │
│ Arrow            Shift+L  │ Redo                ⌘⇧Z  │                               │
│                           │                           │                               │
│ ARRANGE                   │ CANVAS                    │ PRESENTATION                    │
│ Bring forward        ⌘]   │ Pan (hold)        Space+drag │ Next (→/Space/Enter/…)         │
│ Send backward        ⌘[   │ Nudge             Arrows  │ Prev (←/Backspace/…)           │
│ Bring to front      ⌘⇧]   │ Nudge fast     Shift+Arrows │ Black/White/Laser/Grid keys    │
│ Send to back        ⌘⇧[   │                           │ Exit presentation          Esc  │
└───────────────────────────┴───────────────────────────┴─────────────────────────────────┘
```

**Dimensions:**
- Width: 1200px (desktop), scales down responsively
- Max height: 85vh
- Columns: 3 (desktop), 2 (tablet), 1 (mobile)
- Column gap: `var(--spacing-6)` (24px)
- Padding: `var(--spacing-6)` (24px)
- Border radius: `var(--radius-2xl)` (16px)
- Backdrop: `var(--color-backdrop)` with 8px blur

### 2.2 Tablet Layout (2 Columns)

**Breakpoint:** `max-width: 960px`

```
┌─────────────────────────────────────────────────────────┐
│  Keyboard Shortcuts                           Press ? [×]│
├─────────────────────────────────────────────────────────┤
│  🔍 Search...                                            │
├─────────────────────────────────────────────────────────┤
│  All  Recent  Tools  Edit  View  →                      │
├───────────────────────────┬─────────────────────────────┤
│ SELECTION                 │ TOOLS                       │
│ Select All      Ctrl+A    │ Move Tool         V    ⭐   │
│ Select None     Ctrl+Sh+A │ Hand Tool         H    ⭐   │
│ ...                       │ ...                         │
│                           │                             │
│ ARRANGE                   │ EDIT                        │
│ Bring Forward   Ctrl+]    │ Copy              Ctrl+C    │
│ ...                       │ ...                         │
└───────────────────────────┴─────────────────────────────┘
```

**Dimensions:**
- Width: 95vw (max 900px)
- Columns: 2
- Column gap: `var(--spacing-5)` (20px)
- Padding: `var(--spacing-5)` (20px)

### 2.3 Mobile Layout (1 Column)

**Breakpoint:** `max-width: 640px`

```
┌──────────────────────────────┐
│  Shortcuts             [×]   │
├──────────────────────────────┤
│  🔍 Search...                │
├──────────────────────────────┤
│  All  Recent  Tools  →       │
├──────────────────────────────┤
│ SELECTION                    │
│ Select All                   │
│ Ctrl+A                       │
│                              │
│ Select None                  │
│ Ctrl+Shift+A                 │
│                              │
│ TOOLS                        │
│ Move Tool              ⭐    │
│ V                            │
│                              │
│ Hand Tool              ⭐    │
│ H                            │
│                              │
│ ...                          │
└──────────────────────────────┘
```

**Dimensions:**
- Width: 100vw
- Height: 100vh (full screen)
- Columns: 1
- Padding: `var(--spacing-4)` (16px)
- Border radius: 0
- Swipe down to close

---

## 3. Component Specifications

### 3.1 Panel Container

```html
<div class="shortcut-overlay" role="dialog" aria-modal="true" aria-labelledby="shortcuts-title">
  <div class="shortcut-overlay__backdrop"></div>
  <div class="shortcut-overlay__panel">
    <!-- Header, Search, Tabs, Content -->
  </div>
</div>
```

**CSS:**
```css
.shortcut-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.shortcut-overlay__backdrop {
  position: absolute;
  inset: 0;
  background: var(--color-backdrop);
  backdrop-filter: blur(8px);
  cursor: var(--cursor-pointer);
}

.shortcut-overlay__panel {
  position: relative;
  width: 1200px;
  max-width: 95vw;
  max-height: 85vh;
  background: var(--color-bg-elevated);
  border: var(--border-width-1) solid var(--color-border);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-2xl);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Tablet: 2 columns */
@media (max-width: 1280px) {
  .shortcut-overlay__panel {
    width: 900px;
  }
}

/* Tablet/Mobile transition */
@media (max-width: 960px) {
  .shortcut-overlay__panel {
    width: 95vw;
  }
}

/* Mobile: Full screen */
@media (max-width: 640px) {
  .shortcut-overlay__panel {
    width: 100vw;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }
}
```

### 3.2 Header

```html
<div class="shortcut-overlay__header">
  <div class="shortcut-overlay__title-group">
    <h2 id="shortcuts-title">Keyboard Shortcuts</h2>
    <span class="shortcut-overlay__hint">
      Press <kbd>?</kbd> or <kbd>Cmd/Ctrl+/</kbd> to toggle
    </span>
  </div>
  <button class="shortcut-overlay__close" aria-label="Close (Escape)">
    <svg width="20" height="20" viewBox="0 0 20 20">
      <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" stroke-width="2"/>
    </svg>
  </button>
</div>
```

**CSS:**
```css
.shortcut-overlay__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: var(--control-size-2xl);
  padding: var(--spacing-4) var(--spacing-6);
  border-bottom: var(--border-width-1) solid var(--color-border);
  background: var(--color-bg-elevated);
}

.shortcut-overlay__title-group {
  display: flex;
  ```
  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
  │  Keyboard Shortcuts                                     Press ? or Cmd/Ctrl+/ to toggle [×] │
  ├─────────────────────────────────────────────────────────────────────────────────────────┤
  │  🔍 Search shortcuts...                                                                  │
  ├─────────────────────────────────────────────────────────────────────────────────────────┤
  │  All  Recent  Slides  Tools  Edit  Arrange  Text  Panels  Presentation  →                │
  ├───────────────────────────┬───────────────────────────┬─────────────────────────────────┤
  │ TOOLS                     │ EDIT                      │ TEXT                            │
  │ Select / Move        V    │ Copy                 ⌘C   │ Bold                       ⌘B   │
  │ Hand (Pan)           H    │ Paste                ⌘V   │ Italic                     ⌘I   │
  │ Rectangle            R    │ Duplicate             ⌘D   │ Underline                  ⌘U   │
  │ Ellipse              O    │ Delete             Del/⌫  │ Exit text edit           Esc/⌘↵  │
  │ Line                 L    │ Undo                 ⌘Z   │                               │
  │ Arrow            Shift+L  │ Redo                ⌘⇧Z  │                               │
  │                           │                           │                               │
  │ ARRANGE                   │ CANVAS                    │ PRESENTATION                    │
  │ Bring forward        ⌘]   │ Pan (hold)        Space+drag │ Next (→/Space/Enter/…)         │
  │ Send backward        ⌘[   │ Nudge             Arrows  │ Prev (←/Backspace/…)           │
  │ Bring to front      ⌘⇧]   │ Nudge fast     Shift+Arrows │ Black/White/Laser/Grid keys    │
  │ Send to back        ⌘⇧[   │                           │ Exit presentation          Esc  │
  └───────────────────────────┴───────────────────────────┴─────────────────────────────────┘
  ```

```html
<div class="shortcut-overlay__search">
  <svg class="shortcut-overlay__search-icon" width="16" height="16">
    <path d="M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10zm5-1l3 3"/>
  </svg>
  <input 
    type="text"
    class="shortcut-overlay__search-input"
    placeholder="Search shortcuts..."
    autofocus
    aria-label="Search shortcuts"
  />
  <button class="shortcut-overlay__search-clear" aria-label="Clear search">
    <svg width="16" height="16">
      <path d="M12 4L4 12M4 4l8 8"/>
    </svg>
  </button>
</div>
```

**CSS:**
```css
.shortcut-overlay__search {
  position: relative;
  display: flex;
  align-items: center;
  height: var(--control-size-2xl);
  padding: 0 var(--spacing-5);
  border-bottom: var(--border-width-1) solid var(--color-border);
  background: var(--color-bg-elevated);
}

.shortcut-overlay__search-icon {
  position: absolute;
  left: var(--spacing-6);
  width: var(--icon-size-md);
  height: var(--icon-size-md);
  color: var(--color-text-secondary);
  pointer-events: none;
}

.shortcut-overlay__search-input {
  flex: 1;
  height: 100%;
  padding: 0 var(--spacing-10) 0 var(--spacing-10);
  font-size: var(--font-size-xl);
  font-family: var(--font-ui);
  border: none;
  background: transparent;
  outline: none;
  color: var(--color-text-primary);
}

.shortcut-overlay__search-input::placeholder {
  color: var(--color-text-tertiary);
}

.shortcut-overlay__search-clear {
  position: absolute;
  right: var(--spacing-5);
  width: var(--control-size-sm);
  height: var(--control-size-sm);
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  cursor: var(--cursor-pointer);
  color: var(--color-text-secondary);
  display: none;
  transition: var(--transition-fast);
}

.shortcut-overlay__search-input:not(:placeholder-shown) + .shortcut-overlay__search-clear {
  display: block;
}

.shortcut-overlay__search-clear:hover {
  background: var(--color-accent-subtle);
  color: var(--color-accent);
}

.shortcut-overlay__search-clear:active {
  background: var(--color-accent-muted);
}
```

**JavaScript (Search Logic):**
```javascript
class ShortcutSearch {
  constructor(input, shortcuts) {
    this.input = input;
    this.shortcuts = shortcuts;
    this.debounceTimer = null;
    
    this.input.addEventListener('input', () => this.handleSearch());
  }
  
  handleSearch() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      const query = this.input.value.toLowerCase().trim();
      this.filterShortcuts(query);
    }, 150); // Debounce 150ms
  }
  
  filterShortcuts(query) {
    if (!query) {
      // Show all shortcuts
      this.shortcuts.forEach(s => s.element.style.display = '');
      return;
    }
    
    // Fuzzy search: match action name or keys
    this.shortcuts.forEach(shortcut => {
      const matchName = shortcut.name.toLowerCase().includes(query);
      const matchKeys = shortcut.keys.toLowerCase().includes(query);
      const matchCategory = shortcut.category.toLowerCase().includes(query);
      
      shortcut.element.style.display = 
        (matchName || matchKeys || matchCategory) ? '' : 'none';
    });
    
    // Hide empty groups
    this.updateGroupVisibility();
  }
  
  updateGroupVisibility() {
    document.querySelectorAll('.shortcut-group').forEach(group => {
      const visibleItems = group.querySelectorAll('.shortcut-item:not([style*="display: none"])');
      group.style.display = visibleItems.length > 0 ? '' : 'none';
    });
  }
}
```

### 3.4 Category Tabs

```html
<div class="shortcut-overlay__tabs" role="tablist">
  <button role="tab" aria-selected="true" class="shortcut-tab is-active">All</button>
  <button role="tab" aria-selected="false" class="shortcut-tab">
    <span class="shortcut-tab__icon">⭐</span>
    Recent
  </button>
  <button role="tab" class="shortcut-tab">Tools</button>
  <button role="tab" class="shortcut-tab">Edit</button>
  <button role="tab" class="shortcut-tab">View</button>
  <button role="tab" class="shortcut-tab">Text</button>
  <button role="tab" class="shortcut-tab">Arrange</button>
  <button role="tab" class="shortcut-tab">Transform</button>
  <button role="tab" class="shortcut-tab">Slides</button>
</div>
```

**CSS:**
```css
.shortcut-overlay__tabs {
  display: flex;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-5);
  border-bottom: var(--border-width-1) solid var(--color-border);
  background: var(--color-bg-elevated);
  overflow-x: auto;
  scrollbar-width: none;
}

.shortcut-overlay__tabs::-webkit-scrollbar {
  display: none;
}

.shortcut-tab {
  padding: var(--spacing-1-5) var(--spacing-3-5);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  font-family: var(--font-ui);
  color: var(--color-text-secondary);
  background: transparent;
  border: var(--border-width-1) solid var(--color-border);
  border-radius: var(--radius-full);
  cursor: var(--cursor-pointer);
  white-space: nowrap;
  transition: var(--transition-normal);
  display: flex;
  align-items: center;
  gap: var(--spacing-1-5);
}

.shortcut-tab:hover {
  background: var(--color-accent-subtle);
  color: var(--color-accent);
  border-color: var(--color-accent);
}

.shortcut-tab:active {
  background: var(--color-accent-muted);
}

.shortcut-tab.is-active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-text-on-accent);
}

.shortcut-tab__icon {
  font-size: 14px;
}
```

### 3.5 Content Area (Multi-Column)

```html
<div class="shortcut-overlay__content">
  <div class="shortcut-columns">
    <!-- Column 1 -->
    <div class="shortcut-column">
      <div class="shortcut-group">
        <h3 class="shortcut-group__title">Selection</h3>
        <div class="shortcut-group__items">
          <div class="shortcut-item" data-used="true">
            <span class="shortcut-item__name">Select All</span>
            <kbd class="shortcut-item__key">Ctrl+A</kbd>
          </div>
          <div class="shortcut-item">
            <span class="shortcut-item__name">Select None</span>
            <kbd class="shortcut-item__key">Ctrl+Shift+A</kbd>
          </div>
        </div>
      </div>
      
      <div class="shortcut-group">
        <h3 class="shortcut-group__title">Arrange</h3>
        <div class="shortcut-group__items">
          <!-- More items -->
        </div>
      </div>
    </div>
    
    <!-- Column 2 -->
    <div class="shortcut-column">
      <!-- More groups -->
    </div>
    
    <!-- Column 3 -->
    <div class="shortcut-column">
      <!-- More groups -->
    </div>
  </div>
</div>
```

**CSS:**
```css
.shortcut-overlay__content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--spacing-6);
}

/* Multi-column grid layout */
.shortcut-columns {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-7);
  align-items: start;
}

.shortcut-column {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
  min-width: 0;
}

/* Tablet: 2 columns */
@media (max-width: 960px) {
  .shortcut-columns {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-6);
  }
}

/* Mobile: 1 column */
@media (max-width: 640px) {
  .shortcut-overlay__content {
    padding: var(--spacing-4);
  }
  
  .shortcut-columns {
    grid-template-columns: 1fr;
    gap: var(--spacing-5);
  }
}

/* Smooth scrolling */
.shortcut-overlay__content {
  scroll-behavior: smooth;
}
```

### 3.6 Shortcut Group

```css
.shortcut-group {
  break-inside: avoid; /* Prevent column breaks */
}

.shortcut-group__title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-ui);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wider);
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-2-5) 0;
  padding-bottom: var(--spacing-1-5);
  border-bottom: var(--border-width-1) solid var(--color-border-subtle);
}

.shortcut-group__items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}
```

### 3.7 Shortcut Item

```css
.shortcut-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: var(--control-size-lg);
  padding: var(--spacing-1-5) var(--spacing-2-5);
  border-radius: var(--radius-md);
  transition: var(--transition-fast);
  gap: var(--spacing-3);
  cursor: var(--cursor-pointer);
}

.shortcut-item:hover {
  background: var(--color-accent-subtle);
}

.shortcut-item:active {
  background: var(--color-accent-muted);
}

.shortcut-item__name {
  font-size: var(--font-size-lg);
  font-family: var(--font-ui);
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: var(--line-height-normal);
  flex: 1;
}

/* Star indicator for used shortcuts */
.shortcut-item[data-used="true"] .shortcut-item__name::before {
  content: '⭐';
  font-size: var(--icon-size-xs);
  margin-right: var(--spacing-1-5);
  opacity: var(--opacity-80);
}

.shortcut-item__key {
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  padding: var(--spacing-1) var(--spacing-2);
  background: var(--color-bg-input);
  border: var(--border-width-1) solid var(--color-border);
  border-radius: var(--radius-sm);
  white-space: nowrap;
  flex-shrink: 0;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

/* Multiple key combinations */
.shortcut-item__key + .shortcut-item__key {
  margin-left: var(--spacing-1);
}

/* Mobile: Larger touch targets (44px minimum per WCAG) */
@media (max-width: 640px) {
  .shortcut-item {
    min-height: 44px;
    padding: var(--spacing-2-5) var(--spacing-3-5);
  }
  
  .shortcut-item__name {
    font-size: var(--font-size-xl);
  }
  
  .shortcut-item__key {
    font-size: var(--font-size-md);
    padding: var(--spacing-1-5) var(--spacing-2-5);
  }
}
```

---

## 4. Interaction Patterns

### 4.1 Opening the Overlay

**Triggers:**
1. Press `?` (single key, not in text input)
2. Press `Cmd/Ctrl+/` (works everywhere)
3. Click "Shortcuts" in help menu

**Behavior:**
```javascript
class ShortcutOverlay {
  constructor() {
    this.panel = this.createPanel();
    this.isOpen = false;
    this.setupKeyboardListeners();
  }
  
  setupKeyboardListeners() {
    document.addEventListener('keydown', (e) => {
      // Toggle with Cmd/Ctrl+/
      const modKey = e.metaKey || e.ctrlKey;
      if (modKey && e.key === '/') {
        e.preventDefault();
        this.toggle();
        return;
      }
      
      // Toggle with ? (not in input)
      if (e.key === '?' && !this.isInputFocused()) {
        e.preventDefault();
        this.toggle();
        return;
      }
      
      // Close with Escape
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }
  
  isInputFocused() {
    const active = document.activeElement;
    return active && (
      active.tagName === 'INPUT' ||
      active.tagName === 'TEXTAREA' ||
      active.isContentEditable
    );
  }
  
  toggle() {
    this.isOpen ? this.close() : this.open();
  }
  
  open() {
    this.panel.style.display = 'flex';
    requestAnimationFrame(() => {
      this.panel.classList.add('is-open');
      this.searchInput.focus();
    });
    this.isOpen = true;
  }
  
  close() {
    this.panel.classList.remove('is-open');
    setTimeout(() => {
      this.panel.style.display = 'none';
    }, 200);
    this.isOpen = false;
  }
}
```

### 4.2 Search Interaction

**Flow:**
1. Overlay opens → Search gets autofocus
2. User types → Results filter live (150ms debounce)
3. No results → Show "No shortcuts found" message
4. Clear with X button or Escape (if search has text)

### 4.3 Dismissing

**Methods:**
1. **Escape key** - Fastest
2. **Backdrop click** - Natural
3. **Same shortcut** - `?` or `Cmd/Ctrl+/`
4. **Close button** - Visible option

### 4.4 Category Filtering

**Behavior:**
- Click tab → Show only that category
- "All" tab → Show everything
- "Recent" tab → Show last 20 used shortcuts (with usage tracking)
- Horizontal scroll on mobile

---

## 5. Animations

### 5.1 Open Animation

```css
@keyframes overlay-enter {
  from {
    opacity: var(--opacity-0);
    transform: scale(0.95);
  }
  to {
    opacity: var(--opacity-100);
    transform: scale(1);
  }
}

.shortcut-overlay.is-open .shortcut-overlay__panel {
  animation: overlay-enter var(--duration-moderate) cubic-bezier(0.16, 1, 0.3, 1);
}

.shortcut-overlay.is-open .shortcut-overlay__backdrop {
  animation: fade-in var(--duration-moderate) var(--ease-out);
}

@keyframes fade-in {
  from { opacity: var(--opacity-0); }
  to { opacity: var(--opacity-100); }
}
```

### 5.2 Close Animation

```css
@keyframes overlay-exit {
  from {
    opacity: var(--opacity-100);
    transform: scale(1);
  }
  to {
    opacity: var(--opacity-0);
    transform: scale(0.95);
  }
}

.shortcut-overlay:not(.is-open) .shortcut-overlay__panel {
  animation: overlay-exit var(--duration-normal) cubic-bezier(0.4, 0, 1, 1);
}
```

### 5.3 Reduced Motion Support

**Critical for accessibility:**

```css
@media (prefers-reduced-motion: reduce) {
  .shortcut-overlay.is-open .shortcut-overlay__panel,
  .shortcut-overlay:not(.is-open) .shortcut-overlay__panel {
    animation: none;
  }
  
  .shortcut-overlay__panel {
    transition: none;
  }
  
  .shortcut-item,
  .shortcut-tab,
  .shortcut-overlay__close,
  .shortcut-overlay__search-clear {
    transition: none;
  }
}
```

### 5.4 Mobile Swipe (Optional)
```

### 5.3 Mobile Swipe (Optional)

```javascript
// Swipe down to close on mobile
let startY = 0;
panel.addEventListener('touchstart', (e) => {
  startY = e.touches[0].clientY;
});

panel.addEventListener('touchmove', (e) => {
  const deltaY = e.touches[0].clientY - startY;
  if (deltaY > 0 && panel.scrollTop === 0) {
    panel.style.transform = `translateY(${deltaY}px)`;
  }
});

panel.addEventListener('touchend', (e) => {
  const deltaY = e.changedTouches[0].clientY - startY;
  if (deltaY > 100) {
    overlay.close();
  } else {
    panel.style.transform = '';
  }
});
```

---

## 6. Accessibility

### 6.1 Keyboard Navigation

**Within overlay:**
- `Tab` / `Shift+Tab` - Navigate between search, tabs, close button
- `Arrow keys` - Navigate shortcuts (when not searching)
- `Enter` - Activate selected item
- `Escape` - Close overlay
- `Ctrl+F` - Re-focus search from anywhere

**Focus Management:**
```javascript
class FocusManager {
  constructor(overlay) {
    this.overlay = overlay;
    this.previousFocus = null;
  }
  
  trapFocus() {
    this.previousFocus = document.activeElement;
    
    const focusable = this.overlay.querySelectorAll(
      'input, button, [tabindex]:not([tabindex="-1"])'
    );
    
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    
    this.overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }
  
  restoreFocus() {
    if (this.previousFocus) {
      this.previousFocus.focus();
    }
  }
}
```

### 6.2 Screen Reader Support

```html
<div 
  class="shortcut-overlay" 
  role="dialog" 
  aria-modal="true" 
  aria-labelledby="shortcuts-title"
  aria-describedby="shortcuts-desc"
>
  <div class="shortcut-overlay__panel">
    <h2 id="shortcuts-title">Keyboard Shortcuts</h2>
    <p id="shortcuts-desc" class="sr-only">
      A list of all available keyboard shortcuts. Use search to filter.
    </p>
    
    <!-- Search -->
    <input 
      type="text"
      role="searchbox"
      aria-label="Search shortcuts"
      aria-controls="shortcut-list"
    />
    
    <!-- Tabs -->
    <div role="tablist" aria-label="Shortcut categories">
      <button role="tab" aria-selected="true" aria-controls="panel-all">
        All
      </button>
    </div>
    
    <!-- Content -->
    <div id="shortcut-list" role="list" aria-live="polite">
      <div role="listitem">
        <span>Select All</span>
        <kbd aria-label="Control plus A">Ctrl+A</kbd>
      </div>
    </div>
  </div>
</div>
```

**Announcements:**
```javascript
function announceSearchResults(count) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.className = 'sr-only';
  announcement.textContent = `${count} shortcuts found`;
  document.body.appendChild(announcement);
  setTimeout(() => announcement.remove(), 1000);
}
```

### 6.3 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .shortcut-overlay.is-open .shortcut-overlay__panel,
  .shortcut-overlay:not(.is-open) .shortcut-overlay__panel {
    animation: none;
  }
  
  .shortcut-overlay__panel {
    transition: none;
  }
}
```

---

## 7. Performance Optimization

### 7.1 Instant Open (<100ms)

**Strategy: Pre-render panel on page load**

```javascript
class ShortcutOverlayOptimized {
  constructor() {
    // Create panel immediately on page load
    this.panel = this.createPanel();
    this.panel.style.display = 'none';
    document.body.appendChild(this.panel);
    
    // Pre-populate shortcuts
    this.shortcuts = this.loadShortcuts();
    this.renderAllShortcuts();
    
    this.setupListeners();
  }
  
  open() {
    // Just show (no DOM creation = instant)
    performance.mark('overlay-open-start');
    
    this.panel.style.display = 'flex';
    requestAnimationFrame(() => {
      this.panel.classList.add('is-open');
      this.searchInput.focus();
      
      performance.mark('overlay-open-end');
      performance.measure('overlay-open', 'overlay-open-start', 'overlay-open-end');
      
      // Log performance (should be <100ms)
      const measure = performance.getEntriesByName('overlay-open')[0];
      console.log(`Overlay opened in ${measure.duration.toFixed(2)}ms`);
    });
  }
  
  close() {
    // Keep DOM, just hide (fast to reopen)
    this.panel.classList.remove('is-open');
    setTimeout(() => {
      this.panel.style.display = 'none';
      this.searchInput.value = ''; // Clear search
    }, 200);
  }
}
```

### 7.2 Search Performance

```javascript
class OptimizedSearch {
  constructor(shortcuts) {
    this.shortcuts = shortcuts;
    this.debounceTimer = null;
    
    // Pre-compute search indexes
    this.searchIndex = this.buildSearchIndex();
  }
  
  buildSearchIndex() {
    return this.shortcuts.map(shortcut => ({
      id: shortcut.id,
      searchText: [
        shortcut.name,
        shortcut.keys,
        shortcut.category,
        shortcut.description || ''
      ].join(' ').toLowerCase()
    }));
  }
  
  search(query) {
    clearTimeout(this.debounceTimer);
    
    this.debounceTimer = setTimeout(() => {
      const q = query.toLowerCase().trim();
      
      if (!q) {
        this.showAll();
        return;
      }
      
      // Fast string includes (not regex)
      const matches = this.searchIndex
        .filter(item => item.searchText.includes(q))
        .map(item => item.id);
      
      this.updateVisibility(matches);
    }, 150);
  }
  
  updateVisibility(matchIds) {
    // Use CSS classes (faster than style.display)
    this.shortcuts.forEach(shortcut => {
      shortcut.element.classList.toggle(
        'is-hidden',
        !matchIds.includes(shortcut.id)
      );
    });
  }
}
```

**CSS:**
```css
.shortcut-item.is-hidden {
  display: none;
}
```

### 7.3 Multi-Column Layout Performance

**Why CSS Grid > JavaScript:**
- Browser handles layout (GPU accelerated)
- Responsive without JS media queries
- Smooth resizing
- Better paint performance

```css
/* Let browser do the work */
.shortcut-columns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

/* No JavaScript needed for responsive */
@media (max-width: 960px) {
  .shortcut-columns {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

### 7.4 Scroll Performance

```css
.shortcut-overlay__content {
  /* Smooth scrolling */
  scroll-behavior: smooth;
  
  /* Optimize scrolling */
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  
  /* Enable GPU acceleration */
  will-change: scroll-position;
}
```

### 7.5 Memory Optimization

```javascript
class MemoryOptimizedOverlay {
  constructor() {
    // Keep panel in DOM (don't create/destroy)
    this.panel = this.createPanel();
    
    // Reuse event listeners
    this.boundHandlers = {
      handleSearch: this.handleSearch.bind(this),
      handleKeydown: this.handleKeydown.bind(this),
      handleBackdropClick: this.handleBackdropClick.bind(this)
    };
    
    this.setupListeners();
  }
  
  destroy() {
    // Clean up if needed
    this.removeListeners();
    this.panel.remove();
  }
}
```

---

## 8. Implementation Priorities

### P0: Fast Access MVP + Design System Compliance (Week 1)

**Goal: Users can bring up overlay quickly + theme switching works perfectly**

**Core Functionality:**
- [ ] Multi-column layout (3 → 2 → 1 responsive)
- [ ] Instant open (<100ms): `?` and `Cmd/Ctrl+/`
- [ ] Autofocus search on open
- [ ] Live search with 150ms debounce
- [ ] ESC / backdrop / same-key to dismiss
- [ ] All 150+ shortcuts rendered and grouped
- [ ] Mobile responsive (full screen)

**Design System Compliance (CRITICAL):**
- [ ] **Zero hardcoded values**: All colors, spacing, typography use CSS variables
- [ ] **Theme test passing**: Accent color switch blue→purple works everywhere
- [ ] **Light mode support**: Component works in both light and dark themes
- [ ] **Interaction colors**: All hover/active states use accent color tokens
- [ ] **Typography consistency**: Uses `--font-ui` and `--font-mono` families
- [ ] **Spacing on grid**: All spacing values use 4px base grid tokens
- [ ] **Border radius consistency**: Uses radius tokens from design system
- [ ] **Animation tokens**: Duration and easing use design system tokens
- [ ] **Reduced motion**: Respects `prefers-reduced-motion` preference

**Success Criteria:**
- Opens in <100ms from keypress ✅
- Search responds in <200ms ✅
- Works on mobile ✅
- Shows 50+ shortcuts at once (desktop) ✅
- **Theme switch test passes** 🎨
- **Light mode works** ☀️
- **No hardcoded colors found** 🔍

**Deliverables:**
```
src/ui/ShortcutOverlay.js                    # Main component
styles/components/shortcut-overlay.css       # All styles with design tokens
tests/unit/ShortcutOverlay.test.js          # Including theme tests
```

**Risk Mitigation:**
- Add missing tokens to `variables.css` (`--spacing-3-5`, `--spacing-7`)
- Test with light mode from day 1
- Validate against other modal components for consistency

### P1: Discoverability (Week 2)

**Goal: Make finding shortcuts effortless**

- [ ] Category tabs with filtering
- [ ] Platform detection (Mac: ⌘, Windows: Ctrl)
- [ ] Search result highlighting
- [ ] "Recent" tab (last 20 used)
- [ ] Empty state: "No shortcuts found"
- [ ] Smooth animations (scale, fade)
- [ ] Keyboard navigation (Tab, Arrow keys)
- [ ] Usage tracking foundation

**Success Criteria:**
- Can find any shortcut in <3 seconds
- Tab filtering works
- Platform-appropriate keys shown
- Keyboard navigation complete

### P2: Learning & Tracking (Week 3)

**Goal: Help users learn through patterns**

- [ ] ⭐ Star indicators for used shortcuts
- [ ] "Recently used" sorting
- [ ] Frequency-based recommendations
- [ ] Context-aware display
- [ ] ⚠️ Conflict indicators
- [ ] Tooltips/descriptions
- [ ] Print-friendly view

**Success Criteria:**
- Users see which shortcuts they use most
- Recent shortcuts highlighted
- Conflicts clearly marked

### P3: Customization

Shortcut customization is a non-goal for Story.

---

## 9. Testing Strategy

### 9.1 Performance Tests

```javascript
describe('Overlay Performance', () => {
  it('opens in <100ms', async () => {
    const start = performance.now();
    overlay.open();
    await waitForAnimation();
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(100);
  });
  
  it('search responds in <200ms', async () => {
    overlay.open();
    const start = performance.now();
    overlay.search('duplicate');
    await waitForDebounce();
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(200);
  });
  
  it('scrolls at 60fps', async () => {
    overlay.open();
    const fps = await measureScrollFPS(overlay.content);
    expect(fps).toBeGreaterThan(55); // Allow some variance
  });
});
```

### 9.2 Responsive Tests

```javascript
describe('Responsive Layout', () => {
  it('shows 3 columns on desktop', () => {
    setViewport(1400, 900);
    expect(getColumnCount()).toBe(3);
  });
  
  it('shows 2 columns on tablet', () => {
    setViewport(900, 700);
    expect(getColumnCount()).toBe(2);
  });
  
  it('shows 1 column on mobile', () => {
    setViewport(375, 667);
    expect(getColumnCount()).toBe(1);
  });
  
  it('is full screen on mobile', () => {
    setViewport(375, 667);
    const panel = overlay.panel;
    expect(panel.offsetWidth).toBe(window.innerWidth);
    expect(panel.offsetHeight).toBe(window.innerHeight);
  });
});
```

### 9.3 Interaction Tests

```javascript
describe('Quick Access', () => {
  it('opens with ? key', () => {
    pressKey('?');
    expect(overlay.isOpen).toBe(true);
  });
  
  it('opens with Cmd/Ctrl+/', () => {
    pressKey('/', { ctrlKey: true });
    expect(overlay.isOpen).toBe(true);
  });
  
  it('autofocuses search on open', () => {
    overlay.open();
    expect(document.activeElement).toBe(overlay.searchInput);
  });
  
  it('closes with Escape', () => {
    overlay.open();
    pressKey('Escape');
    expect(overlay.isOpen).toBe(false);
  });
  
  it('closes with backdrop click', () => {
    overlay.open();
    overlay.backdrop.click();
    expect(overlay.isOpen).toBe(false);
  });
  
  it('toggles with same shortcut', () => {
    pressKey('?');
    expect(overlay.isOpen).toBe(true);
    
    pressKey('?');
    expect(overlay.isOpen).toBe(false);
  });
});
```

### 9.4 Accessibility Tests

```javascript
describe('Accessibility', () => {
  it('traps focus within modal', () => {
    overlay.open();
    const focusable = overlay.getFocusableElements();
    
    focusable[focusable.length - 1].focus();
    pressKey('Tab');
    
    expect(document.activeElement).toBe(focusable[0]);
  });
  
  it('has proper ARIA attributes', () => {
    expect(overlay.panel.getAttribute('role')).toBe('dialog');
    expect(overlay.panel.getAttribute('aria-modal')).toBe('true');
    expect(overlay.panel.getAttribute('aria-labelledby')).toBeTruthy();
  });
  
  it('announces search results', () => {
    overlay.open();
    overlay.search('duplicate');
    
    const announcement = document.querySelector('[role="status"]');
    expect(announcement.textContent).toContain('shortcuts found');
  });
  
  it('respects prefers-reduced-motion', () => {
    setMediaQuery('(prefers-reduced-motion: reduce)');
    overlay.open();
    
    const panel = overlay.panel;
    const computedStyle = window.getComputedStyle(panel);
    expect(computedStyle.animation).toBe('none');
  });
});
```

### 9.5 Theme Compatibility Tests (Critical)

**These tests ensure design system compliance:**

```javascript
describe('Theme Switching', () => {
  it('uses no hardcoded colors', () => {
    const overlay = document.querySelector('.shortcut-overlay');
    const allElements = overlay.querySelectorAll('*');
    
    allElements.forEach(el => {
      const styles = window.getComputedStyle(el);
      
      // Check background colors use CSS variables
      if (styles.backgroundColor && styles.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        const elem = el.style.backgroundColor || 
                     getComputedCSSVar(el, 'background-color');
        expect(elem).toMatch(/var\(--color-/);
      }
      
      // Check text colors use CSS variables
      if (styles.color) {
        const elem = el.style.color || getComputedCSSVar(el, 'color');
        expect(elem).toMatch(/var\(--color-/);
      }
    });
  });
  
  it('switches accent color correctly', () => {
    // Change accent from blue to purple
    document.documentElement.style.setProperty('--color-accent', '#9333EA');
    document.documentElement.style.setProperty('--color-accent-subtle', 'rgba(147, 51, 234, 0.20)');
    document.documentElement.style.setProperty('--color-accent-muted', 'rgba(147, 51, 234, 0.35)');
    
    overlay.open();
    
    // Test tab active state
    const activeTab = document.querySelector('.shortcut-tab.is-active');
    const tabBg = window.getComputedStyle(activeTab).backgroundColor;
    expect(tabBg).toBe('rgb(147, 51, 234)'); // Purple
    
    // Test hover states
    const closeButton = document.querySelector('.shortcut-overlay__close');
    closeButton.dispatchEvent(new MouseEvent('mouseenter'));
    const closeBg = window.getComputedStyle(closeButton).backgroundColor;
    expect(closeBg).toContain('147, 51, 234'); // Purple subtle
    
    // Test shortcut item hover
    const item = document.querySelector('.shortcut-item');
    item.dispatchEvent(new MouseEvent('mouseenter'));
    const itemBg = window.getComputedStyle(item).backgroundColor;
    expect(itemBg).toContain('147, 51, 234'); // Purple subtle
  });
  
  it('works in light mode', () => {
    document.body.classList.add('theme-light');
    overlay.open();
    
    // Verify surface colors inverted
    const panel = document.querySelector('.shortcut-overlay__panel');
    const bg = window.getComputedStyle(panel).backgroundColor;
    expect(bg).not.toBe('rgb(51, 51, 51)'); // Not dark mode color
    
    // Verify text readable on light background
    const text = document.querySelector('.shortcut-item__name');
    const color = window.getComputedStyle(text).color;
    const contrast = getContrastRatio(color, bg);
    expect(contrast).toBeGreaterThan(4.5); // WCAG AA
    
    document.body.classList.remove('theme-light');
  });
  
  it('all interactive elements use accent color', () => {
    const interactiveElements = [
      '.shortcut-overlay__close:hover',
      '.shortcut-tab:hover',
      '.shortcut-item:hover',
      '.shortcut-overlay__search-clear:hover'
    ];
    
    interactiveElements.forEach(selector => {
      const el = document.querySelector(selector.split(':')[0]);
      el.dispatchEvent(new MouseEvent('mouseenter'));
      
      const bg = window.getComputedStyle(el).backgroundColor;
      // Should contain accent color values (24, 160, 251) for default blue
      expect(bg).toMatch(/24.*160.*251|rgba\(var\(--color-accent/);
    });
  });
});
```

---

## 10. Summary

### Key Features
- ✅ **Multi-column layout**: 3 columns (desktop) → 2 (tablet) → 1 (mobile)
- ✅ **Instant access**: Opens in <100ms with `?` or `Cmd/Ctrl+/`
- ✅ **High density**: Shows 50+ shortcuts at once
- ✅ **Quick dismiss**: Escape, backdrop, or same shortcut
- ✅ **Live search**: Fuzzy search with 150ms debounce
- ✅ **Fully responsive**: Adapts to all screen sizes
- ✅ **Accessible**: Keyboard navigation, screen readers, ARIA
- ✅ **Performant**: <100ms open, 60fps scrolling

### User Flow (Target: <5 seconds)
```
1. User needs shortcut info
2. Press ? (anywhere in app)
3. Overlay opens instantly (<100ms)
4. Cursor already in search (autofocus)
5. Type "duplic"
6. See result: "Duplicate - Ctrl+D"
7. Press Escape to dismiss
8. Use the shortcut

Total: ~3 seconds
```

### Implementation Size
- **JavaScript**: ~400 lines (ShortcutOverlay class)
- **CSS**: ~500 lines (multi-column layout, responsive)
- **HTML**: Pre-rendered panel structure
- **Total**: ~1,000 lines, highly maintainable

### Browser Support
- Chrome/Edge: 90+
- Firefox: 88+
- Safari: 14+
- Mobile: iOS 14+, Android 10+

