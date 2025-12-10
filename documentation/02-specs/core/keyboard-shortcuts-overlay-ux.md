# Keyboard Shortcuts Overlay - UI/UX Specification

## Overview

A beautiful, accessible, and intuitive keyboard shortcuts panel that helps users discover, learn, and customize shortcuts. Inspired by Figma's shortcuts panel but optimized for Story's workflow.

---

## 1. Design Principles

### 1.1 Core Values

1. **Discoverable** - Easy to find and open (Ctrl/Cmd+Shift+?)
2. **Scannable** - Visual hierarchy makes finding shortcuts fast
3. **Learnable** - Progressive disclosure helps users learn gradually
4. **Customizable** - Power users can personalize their workflow
5. **Accessible** - Keyboard-only navigation, screen reader support
6. **Beautiful** - Polished design that fits Story's aesthetic

### 1.2 User Goals

**Beginner:** "What keyboard shortcuts are available?"
**Intermediate:** "How do I do [specific action] faster?"
**Advanced:** "Can I customize this shortcut to match my workflow?"
**Power User:** "Show me all shortcuts in a category"

---

## 2. Panel Layout & Structure

### 2.1 Overall Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Keyboard Shortcuts                                    [×]    │
├──────────────────────────────────────────────────────────────┤
│  [🔍 Search shortcuts...]                                    │
├──────────────────────────────────────────────────────────────┤
│  [Tools] [Edit] [View] [Selection] [All] [⭐ Recent]        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Tools                                                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ ⭐ Move/Select                            [V]      │ ✓  │
│  │    Rectangle                              [R]         │  │
│  │    Ellipse                                [O]         │  │
│  │    Text                                   [T]         │  │
│  │    Hand (Pan)                             [H]         │  │
│  │    Line                                   [L]         │  │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  Edit                                                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ ⭐ Copy                                 [⌘C]       │ ✓  │
│  │ ⭐ Paste                                [⌘V]       │ ✓  │
│  │    Cut                                  [⌘X]          │  │
│  │ ⭐ Duplicate                            [⌘D]       │ ✓  │
│  │    Undo                                 [⌘Z]          │  │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  [Show 47 more shortcuts ↓]                                  │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Dimensions & Positioning

**Desktop:**
- Width: 640px (fixed)
- Max Height: 80vh (scrollable)
- Position: Centered overlay (modal)
- Background: Semi-transparent backdrop (rgba(0,0,0,0.4))

**Tablet/Mobile:**
- Width: 100% (with 16px padding)
- Height: 100vh (full screen on mobile)
- Position: Full screen overlay
- Swipe down to close

### 2.3 Visual Hierarchy

```
┌─ Header (56px)
│  Title + Close button
│
├─ Search Bar (48px)
│  Large search input
│
├─ Category Tabs (44px)
│  Pill-style navigation
│
├─ Content Area (flexible, scrollable)
│  Shortcut groups
│  │
│  ├─ Group Header (32px)
│  │  Category name
│  │
│  └─ Shortcut Items (40px each)
│     Action + Key + Status
│
└─ Footer (Optional, 56px)
   Keyboard layout switcher
```

---

## 3. Component Specifications

### 3.1 Header

```html
<div class="shortcuts-panel__header">
    <h2 class="shortcuts-panel__title">Keyboard Shortcuts</h2>
    <button class="shortcuts-panel__close" aria-label="Close">
        <i class="fa-solid fa-xmark"></i>
    </button>
</div>
```

**Styles:**
```css
.shortcuts-panel__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--color-border);
}

.shortcuts-panel__title {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
}

.shortcuts-panel__close {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    background: transparent;
    border: none;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.15s ease;
}

.shortcuts-panel__close:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
}
```

### 3.2 Search Bar

```html
<div class="shortcuts-panel__search">
    <i class="fa-solid fa-search shortcuts-panel__search-icon"></i>
    <input 
        type="search"
        placeholder="Search shortcuts..."
        class="shortcuts-panel__search-input"
        autofocus
        autocomplete="off"
        spellcheck="false"
    />
    <kbd class="shortcuts-panel__search-hint">Ctrl+F</kbd>
</div>
```

**Styles:**
```css
.shortcuts-panel__search {
    position: relative;
    margin: 12px 20px;
}

.shortcuts-panel__search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-text-tertiary);
    pointer-events: none;
}

.shortcuts-panel__search-input {
    width: 100%;
    height: 40px;
    padding: 0 80px 0 40px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    font-size: 14px;
    transition: all 0.15s ease;
}

.shortcuts-panel__search-input:focus {
    outline: none;
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px var(--color-accent-alpha-10);
}

.shortcuts-panel__search-hint {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 11px;
    color: var(--color-text-tertiary);
    padding: 2px 6px;
    border-radius: 4px;
    background: var(--color-bg-tertiary);
}
```

**Behavior:**
- Focus on panel open
- Real-time filtering (debounced 150ms)
- Fuzzy search (match action name or key)
- Clear button appears when typing
- Escape clears search
- Show "No results" state

### 3.3 Category Tabs

```html
<div class="shortcuts-panel__tabs">
    <button class="shortcuts-panel__tab shortcuts-panel__tab--active">
        All
        <span class="shortcuts-panel__tab-count">156</span>
    </button>
    <button class="shortcuts-panel__tab">
        <i class="fa-solid fa-star"></i> Recent
    </button>
    <button class="shortcuts-panel__tab">Tools</button>
    <button class="shortcuts-panel__tab">Edit</button>
    <button class="shortcuts-panel__tab">View</button>
    <button class="shortcuts-panel__tab">Selection</button>
    <button class="shortcuts-panel__tab shortcuts-panel__tab--more">
        More <i class="fa-solid fa-chevron-down"></i>
    </button>
</div>
```

**Styles:**
```css
.shortcuts-panel__tabs {
    display: flex;
    gap: 6px;
    padding: 0 20px 12px;
    overflow-x: auto;
    scrollbar-width: none; /* Firefox */
}

.shortcuts-panel__tabs::-webkit-scrollbar {
    display: none; /* Chrome, Safari */
}

.shortcuts-panel__tab {
    height: 32px;
    padding: 0 12px;
    border: 1px solid var(--color-border);
    border-radius: 16px;
    background: transparent;
    color: var(--color-text-secondary);
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    gap: 6px;
}

.shortcuts-panel__tab:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
}

.shortcuts-panel__tab--active {
    background: var(--color-accent);
    color: white;
    border-color: var(--color-accent);
}

.shortcuts-panel__tab-count {
    font-size: 11px;
    opacity: 0.8;
}
```

**Behavior:**
- Keyboard navigation (Tab, Arrow keys)
- Smooth scroll to category on click
- Active state follows scroll position
- "More" dropdown for overflow categories

### 3.4 Shortcut Item

```html
<div class="shortcuts-panel__item shortcuts-panel__item--used">
    <div class="shortcuts-panel__item-left">
        <i class="fa-solid fa-star shortcuts-panel__item-star"></i>
        <span class="shortcuts-panel__item-action">Duplicate</span>
        <span class="shortcuts-panel__item-context">Canvas, Master Mode</span>
    </div>
    <div class="shortcuts-panel__item-right">
        <kbd class="shortcuts-panel__key">⌘</kbd>
        <kbd class="shortcuts-panel__key">D</kbd>
        <button class="shortcuts-panel__item-edit" aria-label="Edit shortcut">
            <i class="fa-solid fa-pen"></i>
        </button>
    </div>
    <div class="shortcuts-panel__item-badge shortcuts-panel__item-badge--conflict">
        ⚠️
    </div>
</div>
```

**Styles:**
```css
.shortcuts-panel__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 40px;
    padding: 0 20px;
    transition: background 0.1s ease;
    position: relative;
}

.shortcuts-panel__item:hover {
    background: var(--color-bg-tertiary);
}

/* Used shortcuts are highlighted */
.shortcuts-panel__item--used {
    background: linear-gradient(
        to right,
        var(--color-accent-alpha-05) 0%,
        transparent 100%
    );
}

.shortcuts-panel__item-left {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0; /* Allow text truncation */
}

.shortcuts-panel__item-star {
    width: 16px;
    color: var(--color-warning);
    opacity: 0;
    transition: opacity 0.15s ease;
}

.shortcuts-panel__item--used .shortcuts-panel__item-star {
    opacity: 1;
}

.shortcuts-panel__item-action {
    font-size: 14px;
    color: var(--color-text-primary);
    font-weight: 500;
}

.shortcuts-panel__item-context {
    font-size: 11px;
    color: var(--color-text-tertiary);
    opacity: 0;
    transition: opacity 0.15s ease;
}

.shortcuts-panel__item:hover .shortcuts-panel__item-context {
    opacity: 1;
}

.shortcuts-panel__item-right {
    display: flex;
    align-items: center;
    gap: 4px;
}

.shortcuts-panel__key {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    height: 24px;
    padding: 0 6px;
    border-radius: 4px;
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-primary);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.shortcuts-panel__item-edit {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    background: transparent;
    border: none;
    color: var(--color-text-tertiary);
    cursor: pointer;
    opacity: 0;
    transition: all 0.15s ease;
}

.shortcuts-panel__item:hover .shortcuts-panel__item-edit {
    opacity: 1;
}

.shortcuts-panel__item-edit:hover {
    background: var(--color-bg-elevated);
    color: var(--color-accent);
}

.shortcuts-panel__item-badge {
    position: absolute;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
}

.shortcuts-panel__item-badge--conflict {
    color: var(--color-warning);
}
```

**States:**
- **Default** - Normal appearance
- **Hover** - Background highlight, context appears, edit button visible
- **Used** - Gradient background, star icon visible
- **Conflict** - Warning badge
- **Disabled** - Grayed out (unavailable in current context)
- **Editing** - Inline edit mode (see Customization section)

### 3.5 Group Header

```html
<div class="shortcuts-panel__group-header">
    <h3 class="shortcuts-panel__group-title">
        <i class="fa-solid fa-mouse-pointer"></i>
        Tools
    </h3>
    <button class="shortcuts-panel__group-toggle">
        <i class="fa-solid fa-chevron-up"></i>
    </button>
</div>
```

**Styles:**
```css
.shortcuts-panel__group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 32px;
    padding: 0 20px;
    margin-top: 16px;
    position: sticky;
    top: 0;
    background: var(--color-bg-primary);
    z-index: 1;
}

.shortcuts-panel__group-title {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-secondary);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
}

.shortcuts-panel__group-toggle {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    background: transparent;
    border: none;
    color: var(--color-text-tertiary);
    cursor: pointer;
    transition: all 0.15s ease;
}

.shortcuts-panel__group-toggle:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
}

.shortcuts-panel__group--collapsed .shortcuts-panel__group-toggle i {
    transform: rotate(180deg);
}
```

**Behavior:**
- Sticky header (stays visible on scroll)
- Collapse/expand group
- Keyboard navigation (Enter/Space to toggle)

---

## 4. Advanced Features

### 4.1 Usage Tracking

**Visual Indicator:**
- Star icon for used shortcuts
- Gradient background for frequently used
- "Recent" tab shows last 20 used shortcuts
- Usage count tooltip on hover

**Implementation:**
```javascript
class ShortcutUsageTracker {
    constructor() {
        this.usage = this.loadFromStorage();
    }
    
    track(shortcutId) {
        const now = Date.now();
        const data = this.usage.get(shortcutId) || {
            count: 0,
            firstUsed: now,
            lastUsed: now
        };
        
        data.count++;
        data.lastUsed = now;
        
        this.usage.set(shortcutId, data);
        this.saveToStorage();
        
        // Update UI
        this.updateShortcutUI(shortcutId, data);
    }
    
    getRecent(limit = 20) {
        return Array.from(this.usage.entries())
            .sort((a, b) => b[1].lastUsed - a[1].lastUsed)
            .slice(0, limit);
    }
}
```

### 4.2 Conflict Indicators

**Visual Treatment:**
```html
<div class="shortcuts-panel__item shortcuts-panel__item--conflict">
    <div class="shortcuts-panel__item-left">
        <span class="shortcuts-panel__item-action">Duplicate</span>
    </div>
    <div class="shortcuts-panel__item-right">
        <kbd>⌘</kbd><kbd>D</kbd>
        <span class="shortcuts-panel__conflict-badge" title="May conflict with browser bookmark">
            ⚠️
        </span>
    </div>
</div>
```

**Tooltip on hover:**
```
⚠️ Browser Conflict
This shortcut may conflict with your browser's
bookmark action. Consider using Cmd+Shift+D instead.

[Use Alternative] [Keep Current]
```

### 4.3 Context-Aware Display

**Show only relevant shortcuts based on current mode:**

```javascript
function getContextualShortcuts() {
    const context = contextManager.current();
    
    switch (context) {
        case 'text-editing':
            return shortcutRegistry.getByContext('text-editing');
            // Shows: Bold, Italic, Font size, etc.
            
        case 'canvas':
            return shortcutRegistry.getByContext('canvas');
            // Shows: Tools, Arrange, Group, etc.
            
        case 'presentation':
            return shortcutRegistry.getByContext('presentation');
            // Shows: Next/Prev slide, Exit, etc.
            
        default:
            return shortcutRegistry.getAll();
    }
}
```

**UI Indicator:**
```html
<div class="shortcuts-panel__context-badge">
    <i class="fa-solid fa-layer-group"></i>
    Showing shortcuts for: <strong>Canvas Mode</strong>
</div>
```

---

## 5. Customization Interface

### 5.1 Edit Mode

**Click edit button on any shortcut:**

```html
<div class="shortcuts-panel__item shortcuts-panel__item--editing">
    <div class="shortcuts-panel__item-left">
        <span class="shortcuts-panel__item-action">Duplicate</span>
    </div>
    <div class="shortcuts-panel__item-right">
        <div class="shortcuts-panel__edit-input">
            <kbd class="shortcuts-panel__key shortcuts-panel__key--recording">
                Press shortcut...
            </kbd>
            <button class="shortcuts-panel__edit-cancel">✕</button>
            <button class="shortcuts-panel__edit-save">✓</button>
        </div>
    </div>
</div>
```

**Recording State:**
1. Click edit button
2. Input becomes active (glowing border)
3. Press new shortcut combination
4. Check for conflicts
5. Show preview/confirmation
6. Save or cancel

**Conflict Resolution:**
```html
<div class="shortcuts-panel__edit-conflict">
    <i class="fa-solid fa-triangle-exclamation"></i>
    <span>Cmd+K is already used for <strong>Scale Tool</strong></span>
    <div class="shortcuts-panel__edit-actions">
        <button>Swap Shortcuts</button>
        <button>Try Another</button>
        <button>Cancel</button>
    </div>
</div>
```

### 5.2 Preset Management

**Quick access to shortcut presets:**

```html
<div class="shortcuts-panel__presets">
    <button class="shortcuts-panel__preset shortcuts-panel__preset--active">
        <i class="fa-solid fa-star"></i>
        Story Default
    </button>
    <button class="shortcuts-panel__preset">
        <i class="fa-brands fa-figma"></i>
        Figma Style
    </button>
    <button class="shortcuts-panel__preset">
        <i class="fa-brands fa-adobe"></i>
        Adobe XD
    </button>
    <button class="shortcuts-panel__preset shortcuts-panel__preset--custom">
        <i class="fa-solid fa-user"></i>
        My Custom
    </button>
    <button class="shortcuts-panel__preset-add">
        <i class="fa-solid fa-plus"></i>
        New Preset
    </button>
</div>
```

**Preset Switcher Modal:**
```
┌─────────────────────────────────────────┐
│ Switch Keyboard Shortcuts Preset        │
├─────────────────────────────────────────┤
│                                          │
│  ● Story Default                         │
│    Our carefully designed shortcuts      │
│                                          │
│  ○ Figma Style                          │
│    Match Figma's keyboard shortcuts      │
│                                          │
│  ○ Adobe XD                             │
│    Match Adobe XD shortcuts              │
│                                          │
│  ○ My Custom                            │
│    Your personalized shortcuts           │
│    [Edit] [Duplicate] [Delete]          │
│                                          │
├─────────────────────────────────────────┤
│             [Cancel] [Apply]             │
└─────────────────────────────────────────┘
```

### 5.3 Import/Export

```html
<div class="shortcuts-panel__footer">
    <button class="shortcuts-panel__footer-btn">
        <i class="fa-solid fa-download"></i>
        Export
    </button>
    <button class="shortcuts-panel__footer-btn">
        <i class="fa-solid fa-upload"></i>
        Import
    </button>
    <button class="shortcuts-panel__footer-btn">
        <i class="fa-solid fa-rotate-left"></i>
        Reset All
    </button>
    <div class="shortcuts-panel__footer-spacer"></div>
    <select class="shortcuts-panel__keyboard-layout">
        <option value="qwerty">QWERTY</option>
        <option value="azerty">AZERTY</option>
        <option value="qwertz">QWERTZ</option>
        <option value="dvorak">Dvorak</option>
    </select>
</div>
```

**Export Format (JSON):**
```json
{
    "name": "My Custom Shortcuts",
    "version": "1.0",
    "platform": "mac",
    "layout": "qwerty",
    "shortcuts": {
        "duplicate": {
            "key": "cmd+d",
            "description": "Duplicate selection",
            "category": "edit"
        },
        "tool-rectangle": {
            "key": "r",
            "description": "Rectangle tool",
            "category": "tools"
        }
    },
    "metadata": {
        "created": "2025-12-10T12:00:00Z",
        "modified": "2025-12-10T14:30:00Z",
        "author": "User Name"
    }
}
```

---

## 6. Responsive Design

### 6.1 Desktop (>1024px)

- **Width:** 640px fixed
- **Height:** Max 80vh
- **Position:** Centered modal
- **Layout:** Two columns (action + shortcut)
- **Search:** Always visible
- **Tabs:** Horizontal scroll if needed

### 6.2 Tablet (768px - 1024px)

- **Width:** 90% (max 600px)
- **Height:** Max 90vh
- **Position:** Centered modal
- **Layout:** Two columns (action + shortcut)
- **Search:** Always visible
- **Tabs:** Horizontal scroll

### 6.3 Mobile (<768px)

- **Width:** 100% (full screen)
- **Height:** 100vh (full screen)
- **Position:** Slide up from bottom
- **Layout:** Stacked (action above shortcut)
- **Search:** Collapsible
- **Tabs:** Horizontal scroll with momentum

**Mobile-specific features:**
- Swipe down to close
- Pull to refresh shortcuts
- Haptic feedback on tap
- Bottom sheet animation

---

## 7. Interactions & Animations

### 7.1 Panel Open/Close

**Opening:**
```css
@keyframes shortcuts-panel-enter {
    0% {
        opacity: 0;
        transform: scale(0.95) translateY(-10px);
    }
    100% {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

.shortcuts-panel {
    animation: shortcuts-panel-enter 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
```

**Closing:**
```css
@keyframes shortcuts-panel-exit {
    0% {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
    100% {
        opacity: 0;
        transform: scale(0.95) translateY(-10px);
    }
}

.shortcuts-panel--closing {
    animation: shortcuts-panel-exit 0.15s cubic-bezier(0.4, 0, 1, 1);
}
```

### 7.2 Search Results

**Filter animation:**
```css
@keyframes shortcuts-item-filter {
    0% {
        opacity: 1;
        max-height: 40px;
    }
    100% {
        opacity: 0;
        max-height: 0;
    }
}

.shortcuts-panel__item--filtered-out {
    animation: shortcuts-item-filter 0.2s ease-out forwards;
}
```

**Highlight match:**
```css
.shortcuts-panel__item-action mark {
    background: var(--color-accent-alpha-20);
    color: var(--color-accent);
    border-radius: 2px;
    padding: 0 2px;
}
```

### 7.3 Edit Mode Transition

```css
.shortcuts-panel__item-right {
    transition: all 0.2s ease;
}

.shortcuts-panel__item--editing .shortcuts-panel__item-right {
    background: var(--color-bg-elevated);
    border-radius: 6px;
    padding: 4px 8px;
    box-shadow: 0 0 0 2px var(--color-accent);
}
```

### 7.4 Micro-interactions

**Usage star:**
```css
@keyframes star-pop {
    0% {
        transform: scale(0);
    }
    50% {
        transform: scale(1.2);
    }
    100% {
        transform: scale(1);
    }
}

.shortcuts-panel__item-star {
    animation: star-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

**Conflict badge pulse:**
```css
@keyframes conflict-pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}

.shortcuts-panel__item-badge--conflict {
    animation: conflict-pulse 2s ease-in-out infinite;
}
```

---

## 8. Keyboard Navigation

### 8.1 Navigation Pattern

```
Ctrl/Cmd+Shift+?  → Open panel
Ctrl/Cmd+F        → Focus search
Tab               → Next element
Shift+Tab         → Previous element
Enter/Space       → Activate button/toggle
Escape            → Close panel (or clear search if focused)
Arrow Up/Down     → Navigate shortcuts list
Arrow Left/Right  → Switch categories
Ctrl/Cmd+1-9      → Jump to category
```

### 8.2 Focus Management

**Focus order:**
1. Search input (auto-focus on open)
2. Category tabs
3. Shortcut items
4. Edit buttons
5. Footer buttons

**Focus styles:**
```css
.shortcuts-panel *:focus {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
}

.shortcuts-panel *:focus:not(:focus-visible) {
    outline: none;
}
```

### 8.3 Screen Reader Support

```html
<div 
    role="dialog"
    aria-labelledby="shortcuts-panel-title"
    aria-modal="true"
    class="shortcuts-panel"
>
    <h2 id="shortcuts-panel-title">Keyboard Shortcuts</h2>
    
    <div role="search">
        <input 
            type="search"
            aria-label="Search shortcuts"
            aria-describedby="search-hint"
        />
        <span id="search-hint" class="sr-only">
            Start typing to filter shortcuts
        </span>
    </div>
    
    <div role="tablist" aria-label="Shortcut categories">
        <button role="tab" aria-selected="true">All</button>
        <button role="tab" aria-selected="false">Tools</button>
    </div>
    
    <div role="list" aria-label="Keyboard shortcuts">
        <div role="listitem" class="shortcuts-panel__item">
            <span>Duplicate</span>
            <kbd aria-label="Command D">⌘D</kbd>
        </div>
    </div>
</div>
```

---

## 9. Empty States & Edge Cases

### 9.1 No Search Results

```html
<div class="shortcuts-panel__empty">
    <i class="fa-solid fa-magnifying-glass"></i>
    <h3>No shortcuts found</h3>
    <p>Try searching for an action or key combination</p>
    <button class="shortcuts-panel__empty-action">
        Clear Search
    </button>
</div>
```

### 9.2 No Shortcuts in Category

```html
<div class="shortcuts-panel__empty">
    <i class="fa-solid fa-keyboard"></i>
    <h3>No shortcuts in this category</h3>
    <p>This category doesn't have any shortcuts yet</p>
</div>
```

### 9.3 Conflicting Shortcuts Warning

```html
<div class="shortcuts-panel__banner shortcuts-panel__banner--warning">
    <i class="fa-solid fa-triangle-exclamation"></i>
    <div class="shortcuts-panel__banner-content">
        <strong>3 shortcuts may conflict with your browser</strong>
        <p>Some shortcuts might not work as expected</p>
    </div>
    <button class="shortcuts-panel__banner-action">
        View Conflicts
    </button>
    <button class="shortcuts-panel__banner-close">✕</button>
</div>
```

### 9.4 Custom Shortcuts Active

```html
<div class="shortcuts-panel__banner shortcuts-panel__banner--info">
    <i class="fa-solid fa-user"></i>
    <div class="shortcuts-panel__banner-content">
        <strong>Custom shortcuts active</strong>
        <p>Using "My Custom" preset</p>
    </div>
    <button class="shortcuts-panel__banner-action">
        Reset to Default
    </button>
</div>
```

---

## 10. Performance Optimization

### 10.1 Virtual Scrolling

For large shortcut lists (100+ items):

```javascript
class VirtualShortcutList {
    constructor(items, itemHeight = 40, visibleCount = 15) {
        this.items = items;
        this.itemHeight = itemHeight;
        this.visibleCount = visibleCount;
        this.scrollTop = 0;
    }
    
    getVisibleItems() {
        const startIndex = Math.floor(this.scrollTop / this.itemHeight);
        const endIndex = startIndex + this.visibleCount;
        
        return this.items.slice(startIndex, endIndex + 1);
    }
    
    render() {
        const visibleItems = this.getVisibleItems();
        const offsetY = Math.floor(this.scrollTop / this.itemHeight) * this.itemHeight;
        
        return `
            <div style="height: ${this.items.length * this.itemHeight}px">
                <div style="transform: translateY(${offsetY}px)">
                    ${visibleItems.map(item => this.renderItem(item)).join('')}
                </div>
            </div>
        `;
    }
}
```

### 10.2 Search Debouncing

```javascript
class ShortcutSearch {
    constructor(debounceMs = 150) {
        this.debounceTimeout = null;
        this.debounceMs = debounceMs;
    }
    
    search(query) {
        clearTimeout(this.debounceTimeout);
        
        this.debounceTimeout = setTimeout(() => {
            this.performSearch(query);
        }, this.debounceMs);
    }
    
    performSearch(query) {
        const results = fuzzySearch(query, this.shortcuts);
        this.renderResults(results);
    }
}
```

### 10.3 Lazy Loading

Load shortcut descriptions and help text on demand:

```javascript
class ShortcutRegistry {
    async getShortcut(id) {
        const shortcut = this.shortcuts.get(id);
        
        // Lazy load description if not present
        if (!shortcut.description) {
            shortcut.description = await this.loadDescription(id);
        }
        
        return shortcut;
    }
}
```

---

## 11. Accessibility Checklist

- [ ] ARIA labels on all interactive elements
- [ ] Keyboard navigation for all features
- [ ] Focus trap within modal
- [ ] Focus restoration on close
- [ ] Screen reader announcements for state changes
- [ ] High contrast mode support
- [ ] Reduced motion support
- [ ] Sufficient color contrast (WCAG AA)
- [ ] Touch target size (44x44px minimum on mobile)
- [ ] Alternative text for icons

---

## 12. Implementation Priority

### P0 - MVP (Week 1)
- [ ] Basic panel layout (header, search, content)
- [ ] Shortcut list rendering
- [ ] Category filtering
- [ ] Search functionality
- [ ] Open/close with Ctrl+Shift+?
- [ ] Basic styling (matches design system)

### P1 - Core Features (Week 2)
- [ ] Usage tracking (star indicators)
- [ ] Recent shortcuts tab
- [ ] Keyboard navigation
- [ ] Responsive design (mobile)
- [ ] Conflict indicators
- [ ] Context-aware display

### P2 - Customization (Week 3)
- [ ] Edit shortcut functionality
- [ ] Conflict resolution UI
- [ ] Preset management
- [ ] Import/export

### P3 - Polish (Week 4)
- [ ] Animations & micro-interactions
- [ ] Virtual scrolling (performance)
- [ ] Keyboard layout switcher
- [ ] Help tooltips
- [ ] Onboarding tour

---

## 13. Testing Strategy

### 13.1 Visual Testing

- [ ] Screenshot comparison across themes
- [ ] Responsive breakpoints (320px, 768px, 1024px, 1440px)
- [ ] Browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Light/Dark mode
- [ ] High contrast mode

### 13.2 Interaction Testing

- [ ] Open/close with keyboard
- [ ] Search filtering
- [ ] Category switching
- [ ] Edit shortcut workflow
- [ ] Conflict detection
- [ ] Import/export

### 13.3 Accessibility Testing

- [ ] Keyboard-only navigation
- [ ] Screen reader (NVDA, JAWS, VoiceOver)
- [ ] Focus management
- [ ] ARIA attributes
- [ ] Color contrast

### 13.4 Performance Testing

- [ ] Panel open time (<200ms)
- [ ] Search latency (<150ms)
- [ ] Scroll performance (60fps)
- [ ] Memory usage (<10MB)

---

**Last Updated:** December 10, 2025
**Version:** 1.0
**Status:** Ready for Implementation
