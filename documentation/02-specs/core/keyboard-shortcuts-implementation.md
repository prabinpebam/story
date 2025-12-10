# Keyboard Shortcuts - Technical Implementation Guide

## Overview

This document provides technical guidance for implementing the keyboard shortcut system defined in `keyboard-shortcuts.md`. It covers architecture, priority handling, context awareness, design system compliance, and testing strategies.

**Key Requirements:**
- **Design System Compliance**: Zero hardcoded values, all CSS variables
- **Theme Compatibility**: Works in light/dark mode, accent color switchable
- **Multi-Column Overlay**: 3-column responsive layout (3 → 2 → 1)
- **Instant Access**: <100ms open time for overlay
- **Browser Conflict Resolution**: Smart preventDefault() handling
- **Accessibility**: Keyboard-only navigation, screen reader support

---

## 1. Architecture

### 1.1 System Components

```
┌─────────────────────────────────────────────────────────┐
│                   Keyboard Event                         │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              KeyboardManager (Central Hub)               │
│  • Event normalization (Mac/Windows)                     │
│  • Context detection (7-level priority)                  │
│  • Browser conflict prevention                           │
│  • Priority routing                                      │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┬──────────────┐
        ▼              ▼              ▼              ▼
   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌──────────┐
   │  Input  │   │ Context │   │ Global  │   │ Overlay  │
   │ Handler │   │ Handler │   │ Handler │   │  (? or   │
   └─────────┘   └─────────┘   └─────────┘   │ Ctrl+/)  │
        │              │              │       └──────────┘
        ▼              ▼              ▼              │
   Block if      Route to       Execute          ▼
   text input    specific       default     ┌──────────────┐
                 context        action      │  Shortcut    │
                                            │  Overlay UI  │
                                            │ (3 columns)  │
                                            └──────────────┘
```

### 1.2 Core Classes

#### KeyboardManager
**Location:** `src/core/keyboard/KeyboardManager.js`

**Responsibilities:**
- Register and manage all keyboard shortcuts
- Normalize events across platforms (Mac ↔ Windows)
- Route to appropriate handlers
- Handle conflicts and priorities (7-level system)
- Browser conflict prevention (preventDefault strategy)
- Track usage for overlay UI
- Integrate with ShortcutOverlay component

```javascript
class KeyboardManager {
    constructor() {
        this.shortcuts = new Map(); // shortcut -> handler map
        this.contexts = new Map();  // context -> shortcuts map
        this.activeContext = null;
        this.usageTracking = new Map(); // shortcut -> usage count
        this.overlay = null; // ShortcutOverlay instance
        this.conflictDetector = new ConflictDetector();
    }

    register(shortcut, handler, options = {}) {
        // options: { 
        //   context, priority, description, category,
        //   preventDefault, browserConflict, fallback
        // }
    }

    handleKeyEvent(event) {
        // 1. Check if overlay toggle (? or Ctrl+Shift+/)
        // 2. Normalize event
        // 3. Check browser conflicts
        // 4. Check input context
        // 5. Check active context
        // 6. Execute handler with preventDefault if needed
        // 7. Track usage for overlay
    }
    
    trackUsage(shortcutId) {
        const count = this.usageTracking.get(shortcutId) || 0;
        this.usageTracking.set(shortcutId, count + 1);
    }
    
    getRecentShortcuts(limit = 20) {
        return Array.from(this.usageTracking.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([id]) => this.shortcuts.get(id));
    }
}
```
```

#### ShortcutRegistry
**Location:** `src/core/keyboard/ShortcutRegistry.js`

**Responsibilities:**
- Store shortcut definitions
- Provide searchable shortcut list
- Generate shortcut panel UI
- Handle conflict detection

```javascript
class ShortcutRegistry {
    constructor() {
        this.shortcuts = [];
    }

    register(definition) {
        // definition: { 
        //   key, mac, windows, action, description, 
        //   category, context, priority 
        // }
    }

    findByKey(keyCombo) {}
    findByAction(actionName) {}
    getByCategory(category) {}
    getByContext(context) {}
}
```

#### ShortcutOverlay
**Location:** `src/ui/ShortcutOverlay.js`  
**Styles:** `styles/components/shortcut-overlay.css`

**Responsibilities:**
- Display all shortcuts in multi-column layout (3 → 2 → 1)
- Real-time fuzzy search (debounced 150ms)
- Category filtering with tabs
- Usage tracking indicators (⭐ stars)
- Platform-aware display (Mac: ⌘, Windows: Ctrl)
- Instant open/close (<100ms target)
- Full design system compliance (zero hardcoded values)

```javascript
class ShortcutOverlay {
    constructor(keyboardManager) {
        this.manager = keyboardManager;
        this.isOpen = false;
        this.searchQuery = '';
        this.activeCategory = 'all';
        
        // Pre-render for instant access
        this.panel = this.createPanel();
        this.panel.style.display = 'none';
        document.body.appendChild(this.panel);
        
        this.setupEventListeners();
        this.renderShortcuts();
    }
    
    open() {
        performance.mark('overlay-open-start');
        
        this.panel.style.display = 'flex';
        requestAnimationFrame(() => {
            this.panel.classList.add('is-open');
            this.searchInput.focus();
            
            performance.mark('overlay-open-end');
            const duration = performance.measure(
                'overlay-open', 
                'overlay-open-start', 
                'overlay-open-end'
            ).duration;
            
            console.log(`Overlay opened in ${duration.toFixed(2)}ms`);
        });
        
        this.isOpen = true;
    }
    
    close() {
        this.panel.classList.remove('is-open');
        setTimeout(() => {
            this.panel.style.display = 'none';
            this.searchInput.value = '';
            this.filterShortcuts('');
        }, 200); // Animation duration
        
        this.isOpen = false;
    }
    
    toggle() {
        this.isOpen ? this.close() : this.open();
    }
    
    createPanel() {
        // Return DOM structure with all CSS variables
        // Structure: backdrop, panel, header, search, tabs, content
        // See keyboard-shortcuts-overlay-ux.md for complete HTML/CSS
    }
    
    renderShortcuts() {
        const shortcuts = this.manager.getAll();
        const byCategory = this.groupByCategory(shortcuts);
        
        // Distribute across 3 columns
        const columns = this.distributeToColumns(byCategory, 3);
        
        // Render each column with groups
        columns.forEach((groups, index) => {
            const column = this.panel.querySelector(
                `.shortcut-column:nth-child(${index + 1})`
            );
            column.innerHTML = this.renderGroups(groups);
        });
    }
    
    filterShortcuts(query) {
        // Debounced fuzzy search (150ms)
        clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => {
            const items = this.panel.querySelectorAll('.shortcut-item');
            
            items.forEach(item => {
                const name = item.dataset.name.toLowerCase();
                const keys = item.dataset.keys.toLowerCase();
                const category = item.dataset.category.toLowerCase();
                
                const matches = !query || 
                    name.includes(query) || 
                    keys.includes(query) || 
                    category.includes(query);
                
                item.classList.toggle('is-hidden', !matches);
            });
            
            this.updateGroupVisibility();
        }, 150);
    }
    
    // Design system compliance check
    validateDesignSystem() {
        const hasHardcodedColors = this.panel.innerHTML.match(
            /#[0-9a-f]{3,6}|rgb\(|rgba\(/gi
        );
        
        if (hasHardcodedColors) {
            console.error('⚠️ Hardcoded colors found in overlay!');
            return false;
        }
        
        return true;
    }
}
```

**Design System Requirements:**
- **All colors**: Use `var(--color-*)` tokens only
- **All spacing**: Use `var(--spacing-*)` tokens (4px grid)
- **All typography**: Use `var(--font-*)` tokens
- **All interactions**: Use accent color (hover: `--color-accent-subtle`, active: `--color-accent-muted`)
- **Surface hierarchy**: Use `--color-bg-elevated` for modal
- **Responsive**: CSS Grid with media queries (no JS)
- **Animations**: Use `--duration-*` and `--ease-*` tokens
- **Reduced motion**: Support `prefers-reduced-motion`

#### ContextManager
**Location:** `src/core/keyboard/ContextManager.js`

**Responsibilities:**
- Track active context (text editing, presentation, canvas)
- Enable/disable context-specific shortcuts
- Context stack management

```javascript
class ContextManager {
    constructor() {
        this.contextStack = ['canvas']; // default context
    }

    push(context) { /* Add context to stack */ }
    pop() { /* Remove top context */ }
    current() { /* Get active context */ }
    has(context) { /* Check if context is active */ }
}
```

---

## 2. Design System Compliance Requirements

### 2.1 Zero Hardcoded Values

**CRITICAL: All visual properties MUST use CSS variables from the design system.**

#### Colors
❌ **NEVER:**
```css
background: #2D2D2D;
color: rgba(255, 255, 255, 0.8);
border: 1px solid #404040;
```

✅ **ALWAYS:**
```css
background: var(--color-bg-elevated);
color: var(--color-text-primary);
border: var(--border-width-1) solid var(--color-border);
```

#### Spacing
❌ **NEVER:**
```css
padding: 16px 24px;
gap: 12px;
margin-bottom: 8px;
```

✅ **ALWAYS:**
```css
padding: var(--spacing-4) var(--spacing-6);
gap: var(--spacing-3);
margin-bottom: var(--spacing-2);
```

#### Typography
❌ **NEVER:**
```css
font-size: 13px;
font-weight: 500;
font-family: 'Inter', sans-serif;
```

✅ **ALWAYS:**
```css
font-size: var(--font-size-lg);
font-weight: var(--font-weight-medium);
font-family: var(--font-ui);
```

### 2.2 Interaction Color Philosophy

**All interactive elements MUST use accent color (not gray):**

```css
/* Hover state - 15% opacity accent */
.interactive-element:hover {
    background: var(--color-accent-subtle);
    color: var(--color-accent);
}

/* Active/pressed state - 25% opacity accent */
.interactive-element:active {
    background: var(--color-accent-muted);
}

/* Selected state - 100% accent */
.interactive-element.is-active {
    background: var(--color-accent);
    color: var(--color-text-on-accent);
}
```

**Applies to:**
- Close button
- Search clear button
- Category tabs
- Shortcut items
- All clickable elements

### 2.3 Theme Compatibility Test

**The Litmus Test: Accent color switching**

```javascript
// Change accent from blue to purple
document.documentElement.style.setProperty('--color-accent', '#9333EA');
document.documentElement.style.setProperty(
    '--color-accent-subtle', 
    'rgba(147, 51, 234, 0.20)'
);

// Result: ALL interactions should now be purple
// If ANY blue remains → hardcoded value found ❌
```

### 2.4 Light Mode Support

Component MUST work in both themes:

```css
/* Uses semantic tokens that adapt automatically */
.shortcut-overlay__panel {
    background: var(--color-bg-elevated);  /* Dark: #333, Light: #FFF */
    color: var(--color-text-primary);      /* Dark: #E8E8E8, Light: #1E1E1E */
    border: var(--border-width-1) solid var(--color-border);
}
```

Test with:
```javascript
document.body.classList.toggle('theme-light');
```

### 2.5 Missing Tokens to Add

Add to `styles/modules/variables.css`:

```css
:root {
    /* For keyboard shortcuts overlay */
    --spacing-3-5: 14px;  /* Tab padding (between spacing-3 and spacing-4) */
    --spacing-7: 28px;    /* Column gap (7 × 4px base grid) */
}
```

### 2.6 Validation Checklist

Before committing any CSS:

- [ ] Run regex: No `#[0-9a-f]{3,6}` in CSS
- [ ] Run regex: No `rgb\(` or `rgba\(` in CSS
- [ ] Run regex: No hardcoded `px` values (except 0, 1px borders)
- [ ] Test theme switching (blue → purple)
- [ ] Test light mode (`body.theme-light`)
- [ ] Test with reduced motion
- [ ] All hover states use `--color-accent-subtle`
- [ ] All active states use `--color-accent-muted`
- [ ] All typography uses `--font-ui` or `--font-mono`
- [ ] All spacing uses `--spacing-*` tokens

---

## 3. Priority & Routing

### 2.1 Priority Levels

Shortcuts are handled in this order:

```
1. CRITICAL (P0)    - Browser/system level (Cmd+Q, F5)
2. INPUT (P1)       - Text editing context
3. MODAL (P2)       - Dialog/modal specific
4. PANEL (P3)       - Panel-specific shortcuts
5. CONTEXT (P4)     - Mode-specific (presentation, master)
6. TOOL (P5)        - Tool shortcuts (V, R, T)
7. GLOBAL (P6)      - Always available (Esc, Cmd+S)
```

### 2.2 Context Hierarchy

```javascript
const CONTEXT_PRIORITY = {
    'system': 0,           // Don't intercept
    'text-editing': 1,     // Highest priority
    'modal': 2,            // Dialog open
    'presentation': 3,     // Presentation mode
    'panel-focused': 4,    // Panel has focus
    'master-mode': 5,      // Master editing mode
    'canvas': 6,           // Default canvas context
    'idle': 7              // No specific context
};
```

### 2.3 Routing Logic

```javascript
handleKeyEvent(event) {
    // 1. Check if input is active
    if (InputManager.isInputActive()) {
        if (this.isInputAllowedShortcut(event)) {
            return; // Let browser handle (Cmd+C, arrows, etc.)
        }
        if (this.isInputOverrideShortcut(event)) {
            // Special case: Cmd+S should save even in input
            event.preventDefault();
            this.executeShortcut(event);
            return;
        }
        return; // Block all other shortcuts
    }

    // 2. Get current context
    const context = this.contextManager.current();

    // 3. Find matching shortcut
    const shortcut = this.findShortcut(event, context);

    // 4. Execute if found
    if (shortcut) {
        event.preventDefault();
        event.stopPropagation();
        shortcut.handler(event);
    }
}
```

---

## 3. Shortcut Definition Format

### 3.1 Registration Format

```javascript
keyboardManager.register({
    // Identification
    id: 'duplicate',
    
    // Key combinations
    mac: 'cmd+d',
    windows: 'ctrl+d',
    
    // Handler
    action: (event) => {
        store.dispatch('DUPLICATE_ELEMENTS', { 
            offset: true 
        });
    },
    
    // Metadata
    description: 'Duplicate selection',
    category: 'edit',
    context: ['canvas', 'master-mode'],
    
    // Options
    priority: 5,
    preventDefault: true,
    stopPropagation: true,
    
    // Conditions
    when: (state) => state.editor.selectedElementIds.length > 0,
    
    // UI
    showInPanel: true,
    showInTooltip: true
});
```

### 3.2 Key Format Normalization

**Input formats:**
- `'cmd+d'` or `'ctrl+d'`
- `'shift+cmd+z'` or `'shift+ctrl+z'`
- `'alt+a'` or `'opt+a'`
- `'cmd+shift+?'`

**Normalized format:**
- Lowercase
- Order: `[ctrl/cmd]+[shift]+[alt/opt]+[key]`
- Platform-aware: `cmd` on Mac → `ctrl` on Windows

```javascript
function normalizeShortcut(shortcut, platform) {
    const parts = shortcut.toLowerCase().split('+');
    const modifiers = [];
    let key = parts[parts.length - 1];
    
    // Map modifiers
    if (parts.includes('cmd') || parts.includes('ctrl')) {
        modifiers.push(platform === 'mac' ? 'cmd' : 'ctrl');
    }
    if (parts.includes('shift')) modifiers.push('shift');
    if (parts.includes('alt') || parts.includes('opt')) {
        modifiers.push('alt');
    }
    
    return [...modifiers, key].join('+');
}
```

### 3.3 Event to Shortcut String

```javascript
function eventToShortcut(event) {
    const parts = [];
    
    // Modifiers (in order)
    if (event.metaKey || event.ctrlKey) parts.push('ctrl');
    if (event.shiftKey) parts.push('shift');
    if (event.altKey) parts.push('alt');
    
    // Key (lowercase)
    const key = event.key.toLowerCase();
    
    // Skip if only modifier pressed
    if (['control', 'shift', 'alt', 'meta'].includes(key)) {
        return null;
    }
    
    parts.push(key);
    
    return parts.join('+');
}
```

---

## 4. Context Management

### 4.1 Context Detection

```javascript
class ContextDetector {
    static detect(state, event) {
        // Priority order
        if (InputManager.isInputActive()) return 'text-editing';
        if (state.ui.modalOpen) return 'modal';
        if (state.editor.mode === 'presentation') return 'presentation';
        if (state.editor.mode === 'master') return 'master-mode';
        if (state.ui.activePanelId) return 'panel-focused';
        
        return 'canvas'; // default
    }
}
```

### 4.2 Context-Specific Shortcuts

```javascript
// Register tool shortcut (only in canvas context)
keyboardManager.register({
    id: 'tool-rectangle',
    mac: 'r',
    windows: 'r',
    action: () => store.dispatch('SET_ACTIVE_TOOL', 'rectangle'),
    context: ['canvas', 'master-mode'],
    description: 'Rectangle tool'
});

// Register text formatting (only in text-editing context)
keyboardManager.register({
    id: 'text-bold',
    mac: 'cmd+b',
    windows: 'ctrl+b',
    action: () => textEditManager.toggleBold(),
    context: ['text-editing'],
    description: 'Toggle bold'
});

// Register save (works in all contexts)
keyboardManager.register({
    id: 'file-save',
    mac: 'cmd+s',
    windows: 'ctrl+s',
    action: () => fileService.save(),
    context: ['*'], // all contexts
    priority: 1, // high priority
    description: 'Save file'
});
```

### 4.3 Context Stack Example

```javascript
// User starts editing text
contextManager.push('text-editing');
// contextStack: ['canvas', 'text-editing']

// User presses Cmd+B → routes to text-bold

// User presses Esc → exits text editing
textEditManager.on('exit', () => {
    contextManager.pop(); // Remove 'text-editing'
});
// contextStack: ['canvas']

// User presses Cmd+B → no handler (not in text-editing context)
```

---

## 5. Input Blocking

### 5.1 When to Block Shortcuts

Block shortcuts when:
- User is typing in `<input>`, `<textarea>`, or `[contenteditable]`
- Modal/dialog is open (except modal-specific shortcuts)
- Drag operation in progress (except `Esc` to cancel)

**Exceptions (always allow):**
- `Cmd/Ctrl+S` (Save)
- `Cmd/Ctrl+Z` (Undo)
- `Cmd/Ctrl+Shift+Z` (Redo)
- `Esc` (Cancel/Exit)

### 5.2 InputManager Enhancement

```javascript
// src/core/InputManager.js (existing)
export class InputManager {
    static isInputActive() {
        const el = document.activeElement;
        const tagName = el.tagName.toLowerCase();
        
        return (
            tagName === 'input' || 
            tagName === 'textarea' ||
            el.isContentEditable
        );
    }

    static shouldBlockShortcut(event) {
        if (!this.isInputActive()) return false;
        
        // Allow critical shortcuts even in inputs
        const shortcut = eventToShortcut(event);
        const criticalShortcuts = [
            'ctrl+s',     // Save
            'ctrl+z',     // Undo
            'ctrl+shift+z', // Redo
            'escape'      // Cancel
        ];
        
        if (criticalShortcuts.includes(shortcut)) {
            return false; // Don't block
        }
        
        return true; // Block everything else
    }
}
```

---

## 6. Tool Shortcuts

### 6.1 Single-Key Tool Shortcuts

Tools use single letters (Figma standard):

```javascript
const TOOL_SHORTCUTS = {
    'v': 'select',
    'h': 'hand',
    'r': 'rectangle',
    'o': 'ellipse',
    't': 'text',
    'l': 'line',
    'p': 'pen',
    'f': 'frame',
    'i': 'eyedropper'
};

// Registration
Object.entries(TOOL_SHORTCUTS).forEach(([key, tool]) => {
    keyboardManager.register({
        id: `tool-${tool}`,
        mac: key,
        windows: key,
        action: () => store.dispatch('SET_ACTIVE_TOOL', tool),
        context: ['canvas', 'master-mode'],
        description: `${capitalize(tool)} tool`,
        category: 'tools',
        showInPanel: true
    });
});
```

### 6.2 Tool Conflicts

**Problem:** `V` for select vs typing "V" in text

**Solution:** Context detection
```javascript
// V key is blocked when InputManager.isInputActive() returns true
// V key activates tool only when in 'canvas' or 'master-mode' context
```

---

## 7. Modifier Key Handling

### 7.1 Hold Modifiers for Temporary Tools

```javascript
// Hold Space for Hand tool (pan)
keyboardManager.register({
    id: 'tool-hand-temporary',
    mac: 'space',
    windows: 'space',
    action: (event) => {
        if (event.type === 'keydown') {
            store.dispatch('SET_TEMPORARY_TOOL', 'hand');
        } else if (event.type === 'keyup') {
            store.dispatch('RESTORE_PREVIOUS_TOOL');
        }
    },
    context: ['canvas'],
    eventType: 'both', // keydown and keyup
    description: 'Hand tool (hold)'
});
```

### 7.2 Modifier During Actions

**Transform modifiers:**
- `Shift` - Constrain proportions
- `Alt` - Resize from center
- `Shift+Alt` - Both

**Implementation:**
```javascript
// Check modifiers during mouse move
handleMouseMove(e) {
    const state = store.getState();
    
    if (this.interactionState === 'RESIZING') {
        const constrainProportions = e.shiftKey;
        const resizeFromCenter = e.altKey;
        
        // Apply transform with constraints
        this.applyResize(delta, {
            constrain: constrainProportions,
            center: resizeFromCenter
        });
    }
}
```

---

## 8. Shortcut Panel UI

### 8.1 Panel Component

**Location:** `src/ui/panels/ShortcutPanel.js`

```javascript
class ShortcutPanel {
    constructor() {
        this.registry = keyboardManager.registry;
        this.searchQuery = '';
        this.activeCategory = 'all';
    }

    render() {
        return `
            <div class="shortcut-panel">
                <div class="shortcut-panel__header">
                    <input 
                        type="search" 
                        placeholder="Search shortcuts..."
                        class="shortcut-panel__search"
                    />
                    <div class="shortcut-panel__tabs">
                        ${this.renderCategoryTabs()}
                    </div>
                </div>
                <div class="shortcut-panel__content">
                    ${this.renderShortcuts()}
                </div>
            </div>
        `;
    }

    renderShortcuts() {
        const shortcuts = this.getFilteredShortcuts();
        const platform = getPlatform();
        
        return shortcuts.map(shortcut => `
            <div class="shortcut-item ${shortcut.used ? 'used' : ''}">
                <span class="shortcut-item__description">
                    ${shortcut.description}
                </span>
                <kbd class="shortcut-item__key">
                    ${this.formatKey(shortcut[platform])}
                </kbd>
            </div>
        `).join('');
    }

    formatKey(key) {
        // Convert 'cmd+shift+d' to '⌘⇧D'
        return key
            .split('+')
            .map(k => SYMBOL_MAP[k] || k.toUpperCase())
            .join('');
    }
}

const SYMBOL_MAP = {
    'cmd': '⌘',
    'ctrl': 'Ctrl',
    'shift': '⇧',
    'alt': '⌥',
    'opt': '⌥',
    'return': '↵',
    'enter': '↵',
    'delete': '⌫',
    'backspace': '⌫',
    'escape': 'Esc',
    'space': 'Space'
};
```

### 8.2 Usage Tracking

Track which shortcuts user has used:

```javascript
class ShortcutRegistry {
    constructor() {
        this.shortcuts = [];
        this.usageStats = new Map(); // shortcut id -> count
    }

    trackUsage(shortcutId) {
        const count = this.usageStats.get(shortcutId) || 0;
        this.usageStats.set(shortcutId, count + 1);
        
        // Mark as used
        const shortcut = this.shortcuts.find(s => s.id === shortcutId);
        if (shortcut) {
            shortcut.used = true;
            shortcut.useCount = count + 1;
        }
        
        // Save to localStorage
        this.saveUsageStats();
    }
}
```

---

## 9. Testing

### 9.1 Unit Tests

**File:** `tests/unit/core/keyboard/KeyboardManager.test.js`

```javascript
describe('KeyboardManager', () => {
    let manager;

    beforeEach(() => {
        manager = new KeyboardManager();
    });

    describe('shortcut registration', () => {
        it('registers shortcut with handler', () => {
            const handler = vi.fn();
            manager.register({
                id: 'test',
                mac: 'cmd+t',
                windows: 'ctrl+t',
                action: handler
            });

            const event = new KeyboardEvent('keydown', {
                key: 't',
                metaKey: true
            });

            manager.handleKeyEvent(event);
            expect(handler).toHaveBeenCalled();
        });

        it('handles conflicts with priority', () => {
            const handler1 = vi.fn();
            const handler2 = vi.fn();

            manager.register({
                id: 'test1',
                mac: 'cmd+t',
                action: handler1,
                priority: 5
            });

            manager.register({
                id: 'test2',
                mac: 'cmd+t',
                action: handler2,
                priority: 1 // higher priority
            });

            const event = new KeyboardEvent('keydown', {
                key: 't',
                metaKey: true
            });

            manager.handleKeyEvent(event);
            expect(handler2).toHaveBeenCalled();
            expect(handler1).not.toHaveBeenCalled();
        });
    });

    describe('context handling', () => {
        it('routes to correct context', () => {
            const canvasHandler = vi.fn();
            const textHandler = vi.fn();

            manager.register({
                id: 'canvas-action',
                mac: 'r',
                action: canvasHandler,
                context: ['canvas']
            });

            manager.register({
                id: 'text-action',
                mac: 'cmd+b',
                action: textHandler,
                context: ['text-editing']
            });

            // Canvas context
            manager.contextManager.push('canvas');
            const event1 = new KeyboardEvent('keydown', { key: 'r' });
            manager.handleKeyEvent(event1);
            expect(canvasHandler).toHaveBeenCalled();

            // Text editing context
            manager.contextManager.push('text-editing');
            const event2 = new KeyboardEvent('keydown', {
                key: 'b',
                metaKey: true
            });
            manager.handleKeyEvent(event2);
            expect(textHandler).toHaveBeenCalled();
        });
    });
});
```

### 9.2 E2E Tests

**File:** `tests/e2e/keyboard-shortcuts.spec.js`

```javascript
describe('Keyboard Shortcuts', () => {
    it('activates rectangle tool with R key', async () => {
        await page.goto('http://localhost:3000');
        
        // Press R
        await page.keyboard.press('r');
        
        // Check tool is active
        const activeTool = await page.evaluate(() => {
            return window.store.getState().editor.activeTool;
        });
        
        expect(activeTool).toBe('rectangle');
    });

    it('duplicates selection with Cmd+D', async () => {
        // Create element
        await page.click('[data-tool="rectangle"]');
        await page.mouse.click(100, 100);
        
        // Select element
        await page.keyboard.press('v');
        await page.mouse.click(150, 150);
        
        // Duplicate
        await page.keyboard.down('Meta');
        await page.keyboard.press('d');
        await page.keyboard.up('Meta');
        
        // Check two elements exist
        const elementCount = await page.evaluate(() => {
            const state = window.store.getState();
            const slide = state.slides.find(s => s.id === state.editor.activeSlideId);
            return slide.elements.length;
        });
        
        expect(elementCount).toBe(2);
    });

    it('blocks tool shortcuts when typing in input', async () => {
        // Focus input
        await page.focus('input[type="text"]');
        
        // Type 'r'
        await page.keyboard.press('r');
        
        // Tool should NOT activate
        const activeTool = await page.evaluate(() => {
            return window.store.getState().editor.activeTool;
        });
        
        expect(activeTool).not.toBe('rectangle');
        
        // Input should contain 'r'
        const value = await page.$eval('input[type="text"]', el => el.value);
        expect(value).toContain('r');
    });
});
```

---

## 10. Migration Plan

### 10.1 Current State Audit

**Existing shortcuts locations:**
1. `src/main.js` - Global keyboard handler (Cmd+S, Cmd+N, Cmd+Z, etc.)
2. `src/ui/Toolbar.js` - Tool shortcuts (V, H, R, T)
3. `src/core/CanvasManager.js` - Canvas interactions (arrows, delete)
4. `src/ui/PanelManager.js` - Panel shortcuts (Cmd+Shift+C)
5. `src/ui/properties/*` - Property-specific shortcuts

### 10.2 Migration Steps

**Phase 1: Create Infrastructure**
- [ ] Create `KeyboardManager` class
- [ ] Create `ShortcutRegistry` class
- [ ] Create `ContextManager` class
- [ ] Create `ShortcutPanel` component

**Phase 2: Migrate Existing Shortcuts**
- [ ] Migrate global shortcuts from `main.js`
- [ ] Migrate tool shortcuts from `Toolbar.js`
- [ ] Migrate canvas shortcuts from `CanvasManager.js`
- [ ] Migrate panel shortcuts from `PanelManager.js`

**Phase 3: Add New Shortcuts**
- [ ] Implement missing tool shortcuts (O, L, P, F)
- [ ] Implement arrange shortcuts (Cmd+]/[)
- [ ] Implement alignment shortcuts (Alt+A/W/H/T/S/V)
- [ ] Implement presentation shortcuts

**Phase 4: Polish**
- [ ] Create shortcut panel UI (Cmd+Shift+?)
- [ ] Add tooltips with shortcuts
- [ ] Add usage tracking
- [ ] Add keyboard layout support

### 10.3 Example Migration

**Before (main.js):**
```javascript
window.addEventListener('keydown', (e) => {
    if (InputManager.shouldBlockShortcut(e)) return;
    
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        fileService.save();
        return;
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
            store.dispatch('REDO');
        } else {
            store.dispatch('UNDO');
        }
    }
});
```

**After (migrated):**
```javascript
// In app initialization
keyboardManager.register({
    id: 'file-save',
    mac: 'cmd+s',
    windows: 'ctrl+s',
    action: () => fileService.save(),
    context: ['*'],
    priority: 1,
    description: 'Save file',
    category: 'file'
});

keyboardManager.register({
    id: 'edit-undo',
    mac: 'cmd+z',
    windows: 'ctrl+z',
    action: () => store.dispatch('UNDO'),
    context: ['*'],
    priority: 1,
    description: 'Undo',
    category: 'edit'
});

keyboardManager.register({
    id: 'edit-redo',
    mac: 'cmd+shift+z',
    windows: 'ctrl+shift+z',
    action: () => store.dispatch('REDO'),
    context: ['*'],
    priority: 1,
    description: 'Redo',
    category: 'edit'
});
```

---

## 11. Performance Considerations

### 11.1 Event Handler Optimization

```javascript
// Use single global listener
document.addEventListener('keydown', (e) => {
    keyboardManager.handleKeyEvent(e);
}, { passive: false });

// Don't add listener to every element
// ❌ BAD
document.querySelectorAll('.element').forEach(el => {
    el.addEventListener('keydown', handler);
});

// ✅ GOOD
// Use event delegation from single listener
```

### 11.2 Lookup Optimization

```javascript
class KeyboardManager {
    constructor() {
        // Use Map for O(1) lookup
        this.shortcuts = new Map();
        
        // Cache normalized shortcuts
        this.normalizedCache = new Map();
    }

    findShortcut(event, context) {
        // Create shortcut string once
        const shortcutStr = eventToShortcut(event);
        if (!shortcutStr) return null;
        
        // Check cache first
        const cacheKey = `${context}:${shortcutStr}`;
        if (this.normalizedCache.has(cacheKey)) {
            return this.normalizedCache.get(cacheKey);
        }
        
        // Find and cache
        const shortcut = this.shortcuts.get(shortcutStr);
        if (shortcut && shortcut.context.includes(context)) {
            this.normalizedCache.set(cacheKey, shortcut);
            return shortcut;
        }
        
        return null;
    }
}
```

---

## 12. Browser Compatibility

### 12.1 Key Event Differences

| Feature | Chrome | Firefox | Safari | Solution |
|---------|--------|---------|--------|----------|
| `event.key` | ✅ | ✅ | ✅ | Use `event.key` |
| `event.code` | ✅ | ✅ | ✅ | Use for position-independent |
| `event.metaKey` | ✅ Mac | ✅ Mac | ✅ Mac | Check for Cmd on Mac |
| `event.ctrlKey` | ✅ | ✅ | ✅ | Check for Ctrl on Windows |

### 12.2 Platform Detection

```javascript
function getPlatform() {
    const platform = navigator.platform.toLowerCase();
    if (platform.includes('mac')) return 'mac';
    if (platform.includes('win')) return 'windows';
    if (platform.includes('linux')) return 'linux';
    return 'unknown';
}

function getModifierKey() {
    return getPlatform() === 'mac' ? 'metaKey' : 'ctrlKey';
}
```

---

## 13. Accessibility

### 13.1 Screen Reader Announcements

```javascript
function announceShortcut(description) {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = description;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
        announcement.remove();
    }, 1000);
}

// Usage
keyboardManager.register({
    id: 'duplicate',
    mac: 'cmd+d',
    action: () => {
        store.dispatch('DUPLICATE_ELEMENTS');
        announceShortcut('Selection duplicated');
    }
});
```

### 13.2 Keyboard Navigation

Ensure all UI is keyboard accessible:
- Tab through all interactive elements
- Enter/Space to activate buttons
- Escape to close modals/panels
- Arrow keys for list navigation

---

## 14. Configuration

### 14.1 Disable Shortcuts

```javascript
// Disable specific shortcut
keyboardManager.disable('tool-rectangle');

// Disable category
keyboardManager.disableCategory('tools');

// Disable all shortcuts (presentation mode)
keyboardManager.disableAll();

// Re-enable
keyboardManager.enable('tool-rectangle');
keyboardManager.enableAll();
```

### 14.2 Custom Shortcuts (Future)

```javascript
// Allow user customization
class CustomShortcutManager {
    constructor() {
        this.customizations = this.loadFromStorage();
    }

    customize(shortcutId, newKey) {
        // Validate no conflicts
        if (this.hasConflict(newKey)) {
            throw new Error('Shortcut already in use');
        }
        
        // Update
        this.customizations.set(shortcutId, newKey);
        
        // Re-register
        keyboardManager.updateShortcut(shortcutId, newKey);
        
        // Save
        this.saveToStorage();
    }

    reset(shortcutId) {
        this.customizations.delete(shortcutId);
        keyboardManager.resetShortcut(shortcutId);
        this.saveToStorage();
    }
}
```

---

## 15. Implementation Checklist

### Phase 1: Foundation + Design System Compliance (Week 1)
**Priority: P0 - CRITICAL**

#### Core Architecture
- [ ] Create `KeyboardManager` class with event handling
- [ ] Create `ShortcutRegistry` for shortcut storage
- [ ] Create `ContextManager` for context tracking (7-level priority)
- [ ] Create `ConflictDetector` for browser conflict handling
- [ ] Create `eventToShortcut()` utility function
- [ ] Create `normalizeShortcut()` utility function
- [ ] Add platform detection (Mac vs Windows)

#### ShortcutOverlay Component
- [ ] Create `ShortcutOverlay.js` component
- [ ] Create `shortcut-overlay.css` with **ZERO hardcoded values**
- [ ] Implement multi-column layout (3 → 2 → 1 responsive)
- [ ] Add instant open (<100ms target)
- [ ] Add `?` and `Ctrl+Shift+/` shortcuts
- [ ] Add autofocus search
- [ ] Add live search with 150ms debounce
- [ ] Add ESC/backdrop/same-key dismiss

#### Design System Compliance (CRITICAL)
- [ ] **Validate zero hardcoded colors** (use only `var(--color-*)`)
- [ ] **Validate all spacing uses tokens** (`var(--spacing-*)`)
- [ ] **Validate typography tokens** (`var(--font-*)`, `--font-ui`, `--font-mono`)
- [ ] **Implement interaction color philosophy** (accent-subtle hover, accent-muted active)
- [ ] **Add light mode support** (test with `body.theme-light`)
- [ ] **Add reduced motion support** (`prefers-reduced-motion`)
- [ ] **Test theme switching** (blue → purple accent color)
- [ ] Add missing tokens to `variables.css`:
  - `--spacing-3-5: 14px`
  - `--spacing-7: 28px`

#### Testing
- [ ] Unit tests: KeyboardManager
- [ ] Unit tests: ShortcutOverlay
- [ ] **Theme switching tests** (accent color change)
- [ ] **Light/dark mode tests**
- [ ] **No hardcoded values test**
- [ ] Performance test: Open time <100ms
- [ ] Performance test: Search response <200ms

**Success Criteria:**
- ✅ Overlay opens in <100ms
- ✅ Theme switch test passes (blue → purple)
- ✅ Light mode works
- ✅ Zero hardcoded values found
- ✅ All interactions use accent color
- ✅ Works on mobile (responsive)

---

### Phase 2: Core Shortcuts (Week 2)
**Priority: P0 - Required for MVP**

#### Migrate Existing Shortcuts
- [ ] Migrate file operations (Cmd+S, Cmd+N, Cmd+O) from `main.js`
- [ ] Migrate edit operations (Cmd+C/X/V, Cmd+Z/Shift+Z)
- [ ] Migrate tool shortcuts (V, H, R, T) from `Toolbar.js`
- [ ] Add missing tools (O, L, P, F, K, I)
- [ ] Migrate canvas shortcuts from `CanvasManager.js`
- [ ] Fix `Toolbar.js` to use `InputManager.shouldBlockShortcut()`

#### Selection & Transform
- [ ] Add selection shortcuts (Cmd+A, Ctrl+Shift+A, Ctrl+Shift+I)
- [ ] Add multi-select (Shift+click)
- [ ] Add transform shortcuts (arrows, Shift+arrows)
- [ ] Add duplicate (Cmd+D)
- [ ] Add delete (Delete/Backspace)

#### Browser Conflict Handling
- [ ] Implement preventDefault whitelist
- [ ] Add context-aware preventDefault
- [ ] Handle critical shortcuts (never prevent: Cmd+Q/W/T, F5, F12)
- [ ] Handle conditional shortcuts (Cmd+D, Cmd+H, Backspace, Space)
- [ ] Add fallback shortcuts for conflicts

**Success Criteria:**
- ✅ All existing shortcuts migrated
- ✅ No regressions in functionality
- ✅ Browser shortcuts don't interfere
- ✅ Input fields block shortcuts correctly

---

### Phase 3: Advanced Shortcuts (Week 3)
**Priority: P1 - High Value**

#### Arrange & Group
- [ ] Add arrange shortcuts (Cmd+]/[, Cmd+Shift+]/[)
- [ ] Add group shortcuts (Cmd+G, Cmd+Shift+G)
- [ ] Add lock/unlock
- [ ] Add hide/show

#### Alignment
- [ ] Add alignment shortcuts (Ctrl+Alt+←/→/↑/↓)
- [ ] Add center horizontal (Ctrl+Alt+H)
- [ ] Add center vertical (Ctrl+Alt+V)
- [ ] Add distribute shortcuts

#### Zoom & View
- [ ] Add zoom shortcuts (Cmd+±, Cmd+0/1/2)
- [ ] Add pan (Space+drag)
- [ ] Add grid toggle
- [ ] Add rulers toggle

#### Text Formatting
- [ ] Add text shortcuts (Cmd+B/I/U)
- [ ] Add font size (Cmd+Shift+>/<)
- [ ] Add alignment (Cmd+L/E/R/J)

**Success Criteria:**
- ✅ All P1 shortcuts implemented
- ✅ No conflicts detected
- ✅ Shortcuts visible in overlay

---

### Phase 4: Overlay Enhancements (Week 4)
**Priority: P2 - Nice to Have**

#### Discoverability
- [ ] Add category tabs with filtering
- [ ] Add platform detection display (⌘ vs Ctrl)
- [ ] Add search result highlighting
- [ ] Add "Recent" tab (last 20 used)
- [ ] Add empty state: "No shortcuts found"
- [ ] Add smooth animations (scale, fade)
- [ ] Add keyboard navigation (Tab, Arrow keys)

#### Usage Tracking
- [ ] Add ⭐ star indicators for used shortcuts
- [ ] Add recently used shortcuts sorting
- [ ] Add frequency-based recommendations
- [ ] Add context-aware display
- [ ] Add ⚠️ conflict indicators

#### Tooltips & Menus
- [ ] Add tooltips with shortcuts
- [ ] Show shortcuts in context menus
- [ ] Show shortcuts in toolbar buttons
- [ ] Add keyboard shortcut hints in panels

**Success Criteria:**
- ✅ Users can find any shortcut in <3 seconds
- ✅ Recently used shortcuts highlighted
- ✅ Conflicts clearly marked

---

### Phase 5: Customization (Future - Week 5+)
**Priority: P3 - Power Users**

#### Custom Shortcuts
- [ ] Add edit mode (inline recording)
- [ ] Add preset management (Figma/Adobe/Story)
- [ ] Add import/export JSON
- [ ] Add reset to defaults
- [ ] Add custom shortcut validation
- [ ] Add conflict resolution UI

#### Advanced Features
- [ ] Add chord shortcuts (e.g., Cmd+K Cmd+S)
- [ ] Add sequence shortcuts
- [ ] Add macro recording
- [ ] Add shortcut profiles per project

---

### Phase 6: Cross-Platform Testing (Ongoing)
**Priority: P0 - Required**

#### Browser Testing
- [ ] Test on Chrome/Edge (Cmd+D conflict)
- [ ] Test on Firefox (Cmd+K conflict)
- [ ] Test on Safari (Cmd+L conflict)
- [ ] Test preventDefault strategy
- [ ] Test fallback shortcuts

#### Platform Testing
- [ ] Test on macOS (Cmd key)
- [ ] Test on Windows (Ctrl key)
- [ ] Test on Linux
- [ ] Test keyboard layouts (QWERTY, AZERTY, QWERTZ)

#### Accessibility Testing
- [ ] Test with screen readers (NVDA, JAWS, VoiceOver)
- [ ] Test keyboard-only navigation
- [ ] Test with reduced motion
- [ ] Test high contrast mode
- [ ] Verify WCAG AA compliance

#### Theme Testing (CRITICAL)
- [ ] Test dark mode (default)
- [ ] Test light mode (`body.theme-light`)
- [ ] Test accent color switch (blue → purple)
- [ ] Test accent color switch (blue → green)
- [ ] Test accent color switch (blue → red)
- [ ] Verify no hardcoded values remain
- [ ] Test all hover states use accent color
- [ ] Test all active states use accent color

**Success Criteria:**
- ✅ Works on all major browsers
- ✅ Works on Mac, Windows, Linux
- ✅ Screen reader compatible
- ✅ Theme switching perfect (no blue remains)
- ✅ Light mode fully functional

---

### Phase 7: Documentation & Polish (Week 6)
**Priority: P2 - User Experience**

#### User Documentation
- [ ] Update help documentation
- [ ] Create keyboard shortcuts reference page
- [ ] Create video tutorial
- [ ] Add onboarding hints
- [ ] Create printable quick reference (PDF)

#### Developer Documentation
- [ ] Document KeyboardManager API
- [ ] Document ShortcutRegistry API
- [ ] Document how to add new shortcuts
- [ ] Document design system compliance requirements
- [ ] Add code examples for common patterns

#### Analytics
- [ ] Track shortcut usage
- [ ] Track overlay open rate
- [ ] Track search queries
- [ ] Identify unused shortcuts

---

## 16. Risk Mitigation

### High Risk
1. **Browser conflicts breaking core functionality**
   - Mitigation: Comprehensive preventDefault strategy, fallback shortcuts
   
2. **Theme switching revealing hardcoded values**
   - Mitigation: Automated tests for hardcoded colors, strict code review
   
3. **Performance degradation (<100ms open time)**
   - Mitigation: Pre-render overlay, virtual scrolling, performance budgets

### Medium Risk
1. **Keyboard layout incompatibility**
   - Mitigation: Test on AZERTY, QWERTZ, test on Mac/Windows
   
2. **Screen reader compatibility**
   - Mitigation: ARIA attributes, semantic HTML, manual testing

### Low Risk
1. **User confusion with too many shortcuts**
   - Mitigation: Progressive disclosure, category filtering, search

---

**Last Updated:** December 10, 2025  
**Version:** 2.0  
**Status:** Updated with Design System Compliance  
**Breaking Changes:** None (additive changes only)
