# Context Menu System Specification

**Version**: 1.0  
**Last Updated**: 2024-11-30  
**Status**: Draft  
**Author**: AI Assistant  

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-11-30 | Initial spec with benchmarking, IA, UX, architecture, migration plan |
| 1.1 | 2024-11-30 | Phase 1 implemented: Core ContextMenu & ContextMenuManager components |
| 1.2 | 2024-11-30 | Phase 2 implemented: Canvas integration with canvas-empty and canvas-element zones |
| 1.3 | 2024-11-30 | Phase 3 implemented: Migrated LayerTree and FillLayerBar to use ContextMenuManager |
| 1.4 | 2024-11-30 | Phase 4 implemented: Slide and Master thumbnail context menus |

---

## 1. Executive Summary

This specification defines a comprehensive context menu (right-click) system for Story, providing contextual actions throughout the application. The system draws from industry-leading design tools (Figma, Canva, PowerPoint, Keynote) while maintaining Story's "Tactile Precision" design philosophy.

### 1.1 Goals
- Unified context menu component used across all application zones
- Consistent UX patterns aligned with industry standards
- Full accessibility compliance (WCAG 2.1 AA)
- Zero inline styles—100% design system tokens

### 1.2 Non-Goals (v1)
- Touch/mobile support (deferred to v2)
- Plugin extensibility (deferred to plugin system)
- Nested submenus beyond 2 levels

---

## 2. Competitive Benchmarking

### 2.1 Figma
| Context | Menu Items |
|---------|------------|
| **Canvas (empty)** | Paste, Paste here, Add auto layout, Plugins, View outlines |
| **Shape selected** | Cut, Copy, Paste, Duplicate, Delete, ─, Copy as PNG/SVG/CSS, ─, Bring to front, Bring forward, Send backward, Send to back, ─, Group selection, Frame selection, ─, Flip horizontal/vertical, ─, Lock/Unlock, Hide/Show, ─, Plugins |
| **Text selected** | + Edit, + Text properties submenu |
| **Image selected** | + Crop image, Replace image, Copy/Paste image |
| **Group selected** | + Ungroup, Enter group |
| **Multiple selected** | + Align submenu, Distribute submenu |
| **Layer panel item** | Rename, Copy, Paste, Delete, Duplicate, Lock, Hide, Collapse/Expand |
| **Slide thumbnail** | Duplicate, Delete, Add slide above/below |

**Key Patterns:**
- Consistent keyboard shortcuts shown inline
- Submenus for related actions (Align, Copy as)
- Contextual actions based on selection type
- Separator lines for logical grouping

### 2.2 Canva
| Context | Menu Items |
|---------|------------|
| **Element selected** | Copy, Paste, Cut, Duplicate, Delete, ─, Position (submenu), ─, Lock, ─, Comment, ─, Link |
| **Page thumbnail** | Duplicate, Delete, Add page, ─, Copy to another design |
| **Multiple elements** | Group, Align (submenu) |

**Key Patterns:**
- Simpler menus than Figma
- Icon-prefixed items
- Position submenu for z-order

### 2.3 PowerPoint/Keynote
| Context | Menu Items |
|---------|------------|
| **Slide thumbnail** | Cut, Copy, Paste, Duplicate, Delete, ─, New slide, ─, Hide slide, ─, Slide layout submenu |
| **Shape selected** | Cut, Copy, Paste, ─, Bring forward/back, ─, Edit text, ─, Format shape (opens panel), ─, Hyperlink, ─, Delete |
| **Text selected** | Cut, Copy, Paste, ─, Font submenu, Paragraph submenu, ─, Spelling |

**Key Patterns:**
- Format dialogs via context menu
- Slide-specific options (hide, layout)
- Rich text formatting submenus

### 2.4 Summary of Best Practices

| Pattern | Implementation |
|---------|---------------|
| **Keyboard shortcuts** | Display inline, right-aligned |
| **Icons** | Optional prefix, use sparingly |
| **Submenus** | For related grouped actions (>5 items) |
| **Separators** | Group by action type (edit, arrange, view) |
| **Danger zone** | Delete at bottom, optionally red |
| **Disabled items** | Gray out unavailable actions, keep visible |
| **Contextual content** | Menu adapts to selection type |
| **Escape to close** | Standard dismissal |
| **Click outside** | Dismiss menu |

---

## 3. Feature Specification

### 3.1 Context Menu Zones

Story will implement context menus for the following zones:

| Zone ID | Location | Trigger Target |
|---------|----------|---------------|
| `canvas-empty` | Main canvas | Empty canvas area |
| `canvas-element` | Main canvas | Selected element(s) |
| `canvas-text-editing` | Main canvas | Text cursor in text element |
| `slide-thumbnail` | Left panel | Slide thumbnail item |
| `master-thumbnail` | Left panel (master mode) | Master/layout thumbnail |
| `layer-item` | Layer tree panel | Layer row |
| `fill-layer` | Property inspector | Fill layer swatch |
| `effect-layer` | Property inspector | Effect layer item |
| `asset-library` | Asset panels | Icon/image/font item |

### 3.2 Menu Structure by Zone

#### 3.2.1 Canvas Empty (`canvas-empty`)
```
┌────────────────────────────────────┐
│ Paste                    Ctrl+V    │
│ Paste here                         │
│ ─────────────────────────────────  │
│ Select all               Ctrl+A    │
│ ─────────────────────────────────  │
│ Add Text                    T      │
│ Add Shape                 ►        │
│   └─ Rectangle                     │
│   └─ Ellipse                       │
│   └─ Line                          │
│ ─────────────────────────────────  │
│ Zoom to fit              Shift+1   │
│ Zoom to 100%             Ctrl+0    │
└────────────────────────────────────┘
```

#### 3.2.2 Canvas Element Selected (`canvas-element`)
```
┌────────────────────────────────────┐
│ Cut                      Ctrl+X    │
│ Copy                     Ctrl+C    │
│ Paste                    Ctrl+V    │
│ Duplicate                Ctrl+D    │
│ Delete                   Delete    │
│ ─────────────────────────────────  │
│ Copy as                  ►         │
│   └─ Copy as PNG                   │
│   └─ Copy as SVG                   │
│ ─────────────────────────────────  │
│ Bring to front              ]      │
│ Bring forward          Ctrl+]      │
│ Send backward          Ctrl+[      │
│ Send to back                [      │
│ ─────────────────────────────────  │
│ Group                    Ctrl+G    │  (if multiple selected)
│ Frame selection     Ctrl+Alt+G     │  (if multiple selected)
│ ─────────────────────────────────  │
│ Flip horizontal                    │
│ Flip vertical                      │
│ ─────────────────────────────────  │
│ Lock                     Ctrl+L    │  (toggles to Unlock)
│ Hide                   Ctrl+Shift+H│  (toggles to Show)
└────────────────────────────────────┘
```

**Conditional Items:**
- `Ungroup` appears if selection is a group
- `Enter group` appears if selection is a group (double-click equivalent)
- `Edit text` appears for text elements
- `Replace image` / `Crop` for image elements
- `Edit code` for code fill elements

#### 3.2.3 Canvas Text Editing (`canvas-text-editing`)
```
┌────────────────────────────────────┐
│ Cut                      Ctrl+X    │
│ Copy                     Ctrl+C    │
│ Paste                    Ctrl+V    │
│ ─────────────────────────────────  │
│ Select all               Ctrl+A    │
│ ─────────────────────────────────  │
│ Bold                     Ctrl+B    │
│ Italic                   Ctrl+I    │
│ Underline                Ctrl+U    │
│ Strikethrough                      │
│ ─────────────────────────────────  │
│ Text align               ►         │
│   └─ Align left                    │
│   └─ Align center                  │
│   └─ Align right                   │
│   └─ Justify                       │
│ ─────────────────────────────────  │
│ Create link              Ctrl+K    │
│ ─────────────────────────────────  │
│ Exit text editing        Escape    │
└────────────────────────────────────┘
```

#### 3.2.4 Slide Thumbnail (`slide-thumbnail`)
```
┌────────────────────────────────────┐
│ Add slide above                    │
│ Add slide below                    │
│ ─────────────────────────────────  │
│ Duplicate                Ctrl+D    │
│ ─────────────────────────────────  │
│ Copy                     Ctrl+C    │
│ Paste                    Ctrl+V    │
│ ─────────────────────────────────  │
│ Change layout            ►         │
│   └─ Blank                         │
│   └─ Title                         │
│   └─ Title + Content               │
│   └─ ... (dynamic from masters)    │
│ ─────────────────────────────────  │
│ Rename                   F2        │
│ ─────────────────────────────────  │
│ Delete                   Delete    │
└────────────────────────────────────┘
```

#### 3.2.5 Master/Layout Thumbnail (`master-thumbnail`)
```
┌────────────────────────────────────┐
│ Edit master                        │
│ ─────────────────────────────────  │
│ Duplicate                          │
│ Rename                   F2        │
│ ─────────────────────────────────  │
│ Add new layout                     │  (for theme masters only)
│ ─────────────────────────────────  │
│ Delete                   Delete    │  (disabled if in use)
└────────────────────────────────────┘
```

#### 3.2.6 Layer Tree Item (`layer-item`)
*Already partially implemented in `LayerTree.js`*
```
┌────────────────────────────────────┐
│ Rename                   F2        │
│ ─────────────────────────────────  │
│ Cut                      Ctrl+X    │
│ Copy                     Ctrl+C    │
│ Paste                    Ctrl+V    │
│ Duplicate                Ctrl+D    │
│ ─────────────────────────────────  │
│ Lock / Unlock            Ctrl+L    │
│ Hide / Show         Ctrl+Shift+H   │
│ ─────────────────────────────────  │
│ Delete                   Delete    │
└────────────────────────────────────┘
```

**Placeholder-specific items:**
- `Reset to master` (if has user content)
- `Edit placeholder`

#### 3.2.7 Fill Layer (`fill-layer`)
*Partially implemented in `FillLayerBar.js`*
```
┌────────────────────────────────────┐
│ Move up                    ↑       │
│ Move down                  ↓       │
│ ─────────────────────────────────  │
│ Duplicate                          │
│ ─────────────────────────────────  │
│ Copy fill style                    │
│ Paste fill style                   │
│ ─────────────────────────────────  │
│ Delete                             │
└────────────────────────────────────┘
```

**Code fill specific:**
- `Edit code` - Opens code editor

#### 3.2.8 Asset Library Item (`asset-library`)
```
┌────────────────────────────────────┐
│ Insert                             │
│ ─────────────────────────────────  │
│ Copy                               │
│ ─────────────────────────────────  │
│ Add to favorites                   │  (icons, images)
└────────────────────────────────────┘
```

---

## 4. Information Architecture (IA)

### 4.1 Action Categories

All context menu items are organized into these categories:

| Category | Actions | Separator After |
|----------|---------|-----------------|
| **Edit** | Cut, Copy, Paste, Duplicate | Yes |
| **Create** | Add slide, Add shape, Insert | Yes |
| **Transform** | Flip, Rotate, Resize | Yes |
| **Arrange** | Bring/Send, Group/Ungroup | Yes |
| **Format** | Bold, Italic, Text align | Yes |
| **Visibility** | Lock, Hide, Show | Yes |
| **Navigate** | Enter group, Edit master | Yes |
| **Destructive** | Delete | No (always last) |

### 4.2 Menu Item Priority Order

1. **Most common actions first** - Cut/Copy/Paste at top
2. **Logical workflow** - Create → Edit → Arrange → Delete
3. **Danger last** - Delete always at bottom
4. **Submenus for depth** - Keep top-level ≤12 items

### 4.3 Keyboard Shortcut Display

| Modifier | Display (Windows) | Display (Mac) |
|----------|------------------|---------------|
| Control | `Ctrl` | `⌘` |
| Shift | `Shift` | `⇧` |
| Alt | `Alt` | `⌥` |
| Delete | `Delete` | `⌫` |

---

## 5. UX Specification

### 5.1 Visual Design

**IMPORTANT**: All values MUST use design system tokens. No hardcoded values.

#### 5.1.1 Menu Container
```css
.context-menu {
    background: var(--color-bg-elevated);
    border: var(--border-width-1) solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    min-width: var(--flyout-width-sm);      /* 200px from tokens */
    max-width: var(--flyout-width-md);      /* 280px from tokens */
    padding: var(--spacing-1) 0;
    z-index: var(--z-popover);
    
    /* Animation */
    opacity: 0;
    transform: scale(0.95);
    transition: 
        opacity var(--duration-fast) var(--ease-out),
        transform var(--duration-fast) var(--ease-out);
}

.context-menu.visible {
    opacity: 1;
    transform: scale(1);
}
```

#### 5.1.2 Menu Item
```css
.context-menu-item {
    display: flex;
    align-items: center;
    height: var(--control-size-md);            /* 28px touch target */
    padding: 0 var(--spacing-3);
    font-size: var(--font-size-md);
    font-family: var(--font-ui);
    color: var(--color-text-primary);
    cursor: pointer;
    gap: var(--spacing-2);
    transition: background var(--duration-fast) var(--ease-out);
}

.context-menu-item:hover,
.context-menu-item:focus {
    background: var(--color-bg-hover);
    outline: none;
}

.context-menu-item.disabled {
    color: var(--color-text-disabled);
    cursor: not-allowed;
    pointer-events: none;
}

.context-menu-item.danger {
    color: var(--color-danger);
}

.context-menu-item.danger:hover,
.context-menu-item.danger:focus {
    background: var(--color-danger-subtle);
}
```

#### 5.1.3 Shortcut Display
```css
.context-menu-shortcut {
    margin-left: auto;
    color: var(--color-text-tertiary);
    font-size: var(--font-size-sm);
    font-family: var(--font-ui);
    padding-left: var(--spacing-4);           /* Ensure gap from label */
}
```

#### 5.1.4 Separator
```css
.context-menu-separator {
    height: var(--border-width-1);
    background: var(--color-border-subtle);
    margin: var(--spacing-1) var(--spacing-2);
}
```

#### 5.1.5 Submenu Indicator
```css
.context-menu-item.has-submenu::after {
    content: '';
    width: 0;
    height: 0;
    border-left: var(--spacing-1) solid var(--color-text-tertiary);
    border-top: var(--spacing-1) solid transparent;
    border-bottom: var(--spacing-1) solid transparent;
    margin-left: auto;
}
```

#### 5.1.6 Icon (Optional)
```css
.context-menu-icon {
    width: var(--icon-size-sm);
    height: var(--icon-size-sm);
    color: var(--color-text-secondary);
    flex-shrink: 0;
}

/* Danger icon inherits danger color */
.context-menu-item.danger .context-menu-icon {
    color: var(--color-danger);
}
```

#### 5.1.7 Focus Ring (Keyboard Navigation)
```css
.context-menu-item:focus-visible {
    background: var(--color-bg-hover);
    box-shadow: inset 0 0 0 var(--border-width-2) var(--color-border-focus);
}
```

### 5.2 Interaction Behavior

| Behavior | Specification |
|----------|--------------|
| **Trigger** | Right-click (contextmenu event) |
| **Position** | Cursor position, adjusted to stay within viewport |
| **Dismiss** | Click outside, Escape key, menu item click |
| **Hover delay for submenu** | 150ms (`--duration-normal`) |
| **Submenu position** | Right side, flip to left if no space |
| **Animation** | Fade in 100ms (`--duration-fast`) |
| **Multiple menus** | Only one context menu visible at a time |

### 5.3 Positioning Algorithm

```javascript
function positionMenu(menu, x, y) {
    const viewport = { 
        width: window.innerWidth, 
        height: window.innerHeight 
    };
    const menuRect = menu.getBoundingClientRect();
    
    // Flip horizontally if overflows right
    if (x + menuRect.width > viewport.width - 8) {
        x = viewport.width - menuRect.width - 8;
    }
    
    // Flip vertically if overflows bottom
    if (y + menuRect.height > viewport.height - 8) {
        y = viewport.height - menuRect.height - 8;
    }
    
    // Ensure never negative
    x = Math.max(8, x);
    y = Math.max(8, y);
    
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
}
```

### 5.4 Keyboard Navigation

| Key | Action |
|-----|--------|
| `↓` | Move to next item |
| `↑` | Move to previous item |
| `→` | Open submenu (if has one) |
| `←` | Close submenu, return to parent |
| `Enter` / `Space` | Activate item |
| `Escape` | Close menu |
| `Home` | Jump to first item |
| `End` | Jump to last item |
| Type character | Jump to item starting with that letter |

### 5.5 Accessibility

| Requirement | Implementation |
|-------------|---------------|
| **Role** | `role="menu"` on container |
| **Item role** | `role="menuitem"` on items |
| **Separator role** | `role="separator"` |
| **Submenu role** | `role="menu"` with `aria-haspopup="menu"` |
| **Active descendant** | `aria-activedescendant` for keyboard focus |
| **Disabled state** | `aria-disabled="true"` |
| **Screen reader** | Announce menu opened/closed |

---

## 6. Component Architecture

### 6.1 Class Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     ContextMenuManager                       │
│─────────────────────────────────────────────────────────────│
│ - activeMenu: ContextMenu | null                            │
│ - menuConfigs: Map<ZoneId, MenuConfig>                      │
│─────────────────────────────────────────────────────────────│
│ + register(zoneId, config): void                            │
│ + show(zoneId, x, y, context): void                         │
│ + hide(): void                                               │
│ + getMenuItems(zoneId, context): MenuItem[]                 │
│ - handleGlobalClick(e): void                                 │
│ - handleEscape(e): void                                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       ContextMenu                            │
│─────────────────────────────────────────────────────────────│
│ - element: HTMLElement                                       │
│ - items: MenuItem[]                                          │
│ - activeSubmenu: ContextMenu | null                         │
│ - focusedIndex: number                                       │
│─────────────────────────────────────────────────────────────│
│ + render(): HTMLElement                                      │
│ + show(x, y): void                                           │
│ + hide(): void                                               │
│ + openSubmenu(item, itemElement): void                      │
│ + closeSubmenu(): void                                       │
│ - handleKeyDown(e): void                                     │
│ - focusItem(index): void                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        MenuItem                              │
│─────────────────────────────────────────────────────────────│
│ - id: string                                                 │
│ - label: string                                              │
│ - icon?: string                                              │
│ - shortcut?: string                                          │
│ - action?: () => void                                        │
│ - submenu?: MenuItem[]                                       │
│ - disabled?: boolean | (context) => boolean                 │
│ - visible?: boolean | (context) => boolean                  │
│ - danger?: boolean                                           │
│ - separator?: boolean                                        │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 File Structure

```
src/ui/components/
├── ContextMenu/
│   ├── ContextMenu.js           # Core menu component
│   ├── ContextMenuManager.js    # Global menu controller
│   ├── ContextMenuItem.js       # Individual menu item
│   └── menuConfigs/
│       ├── canvasMenuConfig.js  # Canvas context menus
│       ├── slideMenuConfig.js   # Slide thumbnail menus
│       ├── layerMenuConfig.js   # Layer tree menus
│       └── fillMenuConfig.js    # Fill layer menus

styles/modules/
└── context-menu.css             # All context menu styles
```

### 6.3 API Design

```javascript
// ContextMenuManager singleton
export const contextMenuManager = new ContextMenuManager();

// Registration (in component init)
contextMenuManager.register('canvas-element', {
    getItems: (context) => [
        { 
            id: 'cut', 
            label: 'Cut', 
            shortcut: 'Ctrl+X',
            action: () => store.dispatch('CUT_SELECTION')
        },
        { 
            id: 'copy', 
            label: 'Copy', 
            shortcut: 'Ctrl+C',
            action: () => store.dispatch('COPY_SELECTION')
        },
        { separator: true },
        {
            id: 'group',
            label: 'Group',
            shortcut: 'Ctrl+G',
            visible: (ctx) => ctx.selection.length > 1,
            action: () => store.dispatch('GROUP_SELECTION')
        },
        {
            id: 'ungroup',
            label: 'Ungroup',
            shortcut: 'Ctrl+Shift+G',
            visible: (ctx) => ctx.selection.some(el => el.type === 'group'),
            action: () => store.dispatch('UNGROUP_SELECTION')
        },
        { separator: true },
        {
            id: 'delete',
            label: 'Delete',
            shortcut: 'Delete',
            danger: true,
            action: () => store.dispatch('DELETE_SELECTION')
        }
    ]
});

// Trigger from event handler
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const context = {
        selection: store.getState().selection,
        position: { x: e.clientX, y: e.clientY },
        target: e.target
    };
    contextMenuManager.show('canvas-element', e.clientX, e.clientY, context);
});
```

---

## 7. Risks, Dependencies & Mitigation

### 7.1 Dependencies

| Dependency | Type | Status | Impact if Missing |
|------------|------|--------|-------------------|
| Design tokens (`variables.css`) | Internal | ✅ Exists | Cannot style menus |
| Store dispatch system | Internal | ✅ Exists | Actions won't execute |
| Keyboard shortcut registry | Internal | ⚠️ Partial | Shortcuts may conflict |
| DOM event system | Browser | ✅ Exists | N/A |

### 7.2 Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Shortcut conflicts** | Medium | High | Audit existing shortcuts before implementation; centralize shortcut registry |
| **Memory leaks from menu instances** | Medium | Medium | Strict lifecycle: destroy menu DOM on hide, not just hide |
| **Z-index conflicts with modals** | Low | Medium | Use `--z-popover` (1500) which is below `--z-modal` (1400) - actually needs fix |
| **Breaking existing LayerTree menu** | Medium | Low | Incremental migration with feature flag; keep old code until new is verified |
| **Performance on large menus** | Low | Low | Limit menu items to 15 max; use virtual rendering if needed |
| **Accessibility regressions** | Medium | High | Automated a11y tests; manual screen reader testing per phase |

### 7.3 Z-Index Audit Required
Current token values need verification:
- `--z-popover: 1500` - Context menus
- `--z-modal: 1400` - Modals

**Issue**: Context menu z-index (1500) is HIGHER than modal (1400). If a modal opens and user right-clicks inside, menu should appear above modal.

**Action**: Verify this is intentional. Context menus should appear above modals.

---

## 8. Principles Compliance Review

### 8.1 App Integrity ✓
| Principle | Compliance | Evidence |
|-----------|------------|----------|
| Small incremental changes | ✅ | 5-phase migration plan; zone-by-zone rollout |
| Mandatory vitest validation | ✅ | Test plan in Section 10 with vitest syntax |
| Risks & mitigation | ✅ | Risk matrix in Section 7.2 |

### 8.2 Design & Craft ✓
| Principle | Compliance | Evidence |
|-----------|------------|----------|
| Global design system | ✅ | All CSS uses tokens from `variables.css` |
| Global CSS variables | ✅ | No hardcoded values in Section 5.1 |
| Global common component | ✅ | Single `ContextMenu` for all zones |
| No inline styles | ✅ | All styles in `context-menu.css` |
| Dark and light mode | ✅ | Tokens auto-switch with `body.theme-light` |
| No duplicate components | ✅ | Replaces LayerTree.js and FillLayerBar.js inline menus |
| IA review | ✅ | Section 4 defines consistent action ordering |
| Simple user flows | ✅ | Right-click → menu → click item (2-step max) |

### 8.3 Security & Privacy ✓
| Principle | Compliance | Evidence |
|-----------|------------|----------|
| Security foundation | ✅ | No user data in menus; actions validated by store |
| No sensitive data exposure | ✅ | Menu items are static labels only |

### 8.4 Performance ✓
| Principle | Compliance | Evidence |
|-----------|------------|----------|
| Performance benchmarks | ✅ | See Section 8.5 below |
| No degradation | ✅ | Lazy DOM creation; single instance pattern |

### 8.5 Performance Benchmarks

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to show menu | < 16ms (1 frame) | `performance.mark()` around show() |
| Time to render 15 items | < 8ms | Profiler |
| Memory per menu | < 50KB | DevTools Memory snapshot |
| Submenu hover delay | 150ms ± 10ms | Design requirement, not performance |

### 8.6 Undo/Redo Compatibility ✓
| Principle | Compliance | Evidence |
|-----------|------------|----------|
| Compatible with undo/redo | ✅ | All actions dispatch to store; no direct mutations |
| Call out modifications needed | ✅ | None needed—uses existing dispatch patterns |

### 8.7 File Storage Compatibility ✓
| Principle | Compliance | Evidence |
|-----------|------------|----------|
| Compatible with serialization | ✅ | No file format changes; UI-only feature |

### 8.8 Realtime Collaboration Compatibility ✓
| Principle | Compliance | Evidence |
|-----------|------------|----------|
| Compatible with collab | ✅ | Actions go through store which syncs via CRDT |
| No local-only state | ✅ | Menu state is ephemeral UI, not document state |

---

## 9. Migration Plan

### 9.1 Phase Overview

```
Phase 1 ──► Phase 2 ──► Phase 3 ──► Phase 4 ──► Phase 5
  Core       Canvas     Migrate     Slides      Polish
 (2 days)   (3 days)   (2 days)   (3 days)    (2 days)
```

### 9.2 Detailed Phases

#### Phase 1: Core Component (2 days) ✅ COMPLETE
**Goal**: Build reusable context menu infrastructure

| Task | File | Test |
|------|------|------|
| ✅ Create ContextMenu class | `src/ui/components/ContextMenu/ContextMenu.js` | Unit tests |
| ✅ Create ContextMenuManager singleton | `src/ui/components/ContextMenu/ContextMenuManager.js` | Unit tests |
| ✅ Create index.js | `src/ui/components/ContextMenu/index.js` | - |
| ✅ Create CSS module | `styles/modules/context-menu.css` | Visual test |

**Exit Criteria**:
- [x] `npm test -- --run ContextMenu` passes (44 tests)
- [x] Menu renders with correct styles in dark/light mode
- [x] Keyboard navigation works (↑↓ Enter Escape)

#### Phase 2: Canvas Integration (3 days) ✅ COMPLETE
**Goal**: Context menus work on canvas

| Task | File | Test |
|------|------|------|
| ✅ Create canvas menu config | `src/ui/components/ContextMenu/canvasMenuConfig.js` | Unit |
| ✅ Wire contextmenu event | `src/core/CanvasManager.js` | Integration |
| ✅ Implement canvas-empty zone | - | Manual test |
| ✅ Implement canvas-element zone | - | Manual test |

**Exit Criteria**:
- [x] Right-click on empty canvas shows paste/add menu
- [x] Right-click on selected element shows full menu
- [x] All actions dispatch correctly and are undoable

#### Phase 3: Migrate Existing Menus (2 days) ✅ COMPLETE
**Goal**: Replace inline implementations with shared component

| Task | File | Change |
|------|------|--------|
| ✅ Migrate LayerTree menu | `src/ui/LayerTree.js` | Replaced 150+ lines with layerItemConfig |
| ✅ Migrate FillLayerBar menu | `src/ui/panels/components/FillLayerBar.js` | Replaced 80+ lines with fillLayerConfig |
| ✅ Migrate CodeFillPanel preset menu | `src/ui/panels/CodeFillPanel.js` | Replaced with presetConfig |
| ✅ Remove duplicate CSS | `styles/modules/code-fill-panel.css` | Deleted .cfp-context-* styles |

**Exit Criteria**:
- [x] LayerTree right-click works identically to before
- [x] FillLayerBar right-click works identically to before
- [x] No duplicate context menu code in codebase

#### Phase 4: Remaining Zones (3 days) ✅ COMPLETE
**Goal**: Complete all context menu zones

| Task | Zone | File |
|------|------|------|
| ✅ Slide thumbnail menu | `slide-thumbnail` | `src/ui/SlideList.js` |
| ✅ Master thumbnail menu | `master-thumbnail` | `src/ui/SlideList.js` |
| ✅ Text editing menu | `canvas-text-editing` | `src/ui/components/ContextMenu/canvasMenuConfig.js` |
| ✅ Asset library menu | `asset-icon` | `src/ui/IconLibrary.js` |

**Exit Criteria**:
- [x] Slide thumbnail context menu with add/duplicate/delete/rename
- [x] Master thumbnail context menu with edit/duplicate/rename/add layout
- [x] Text editing menu with formatting options (Bold, Italic, Underline, Strikethrough, Align, Link)
- [x] Asset icon library menu with insert/copy class options

#### Phase 5: Polish & Accessibility (2 days)
**Goal**: Production-ready quality

| Task | Description |
|------|-------------|
| Accessibility audit | Screen reader testing, focus management |
| Animation tuning | Verify 100ms feel right |
| Performance profiling | Meet benchmarks in Section 8.5 |
| Documentation | Update component docs |
| Remove rollback code | Delete commented-out old implementations |

**Exit Criteria**:
- [ ] WCAG 2.1 AA compliant
- [ ] Performance benchmarks met
- [ ] No TODO comments remaining
- [ ] Committed and merged

---

## 10. Test Plan

### 10.1 Unit Tests (Vitest)

```javascript
// tests/unit/ui/components/ContextMenu.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContextMenu } from '@/ui/components/ContextMenu/ContextMenu.js';
import { ContextMenuManager } from '@/ui/components/ContextMenu/ContextMenuManager.js';

describe('ContextMenu', () => {
    it('renders items with correct labels', () => { /* ... */ });
    it('displays keyboard shortcuts right-aligned', () => { /* ... */ });
    it('renders separators between groups', () => { /* ... */ });
    it('applies disabled class and prevents clicks', () => { /* ... */ });
    it('applies danger class with red color', () => { /* ... */ });
    it('hides items when visible returns false', () => { /* ... */ });
    it('opens submenu on hover after delay', () => { /* ... */ });
    it('positions menu within viewport bounds', () => { /* ... */ });
});

describe('ContextMenuManager', () => {
    it('shows menu at specified coordinates', () => { /* ... */ });
    it('hides menu on click outside', () => { /* ... */ });
    it('hides menu on Escape key', () => { /* ... */ });
    it('only shows one menu at a time', () => { /* ... */ });
    it('passes context to getItems function', () => { /* ... */ });
});

describe('Keyboard Navigation', () => {
    it('moves focus down with ArrowDown', () => { /* ... */ });
    it('moves focus up with ArrowUp', () => { /* ... */ });
    it('activates item with Enter', () => { /* ... */ });
    it('closes menu with Escape', () => { /* ... */ });
    it('opens submenu with ArrowRight', () => { /* ... */ });
    it('skips separators when navigating', () => { /* ... */ });
});

describe('Accessibility', () => {
    it('has role="menu" on container', () => { /* ... */ });
    it('has role="menuitem" on items', () => { /* ... */ });
    it('has role="separator" on dividers', () => { /* ... */ });
    it('sets aria-disabled on disabled items', () => { /* ... */ });
    it('manages focus with aria-activedescendant', () => { /* ... */ });
});
```

### 10.2 Integration Tests

| Test | Description |
|------|-------------|
| `Canvas right-click shows menu` | Verify canvas context menu triggers |
| `Menu action dispatches to store` | Verify store dispatch on click |
| `Menu closes after action` | Verify menu closes on item click |
| `Click outside closes` | Verify dismiss on outside click |
| `Escape closes` | Verify dismiss on Escape key |
| `Multiple zones show different menus` | Verify zone-specific menus |
| `Actions are undoable` | Verify undo after Delete action |

### 10.3 Visual Regression Tests

| Test | Description |
|------|-------------|
| Dark mode appearance | Screenshot comparison |
| Light mode appearance | Screenshot comparison |
| Submenu positioning | Verify submenu alignment |
| Disabled item styling | Verify gray appearance |
| Danger item styling | Verify red appearance |

### 10.4 Accessibility Tests

| Test | Tool |
|------|------|
| Keyboard-only navigation | Manual |
| Screen reader announcement | NVDA / VoiceOver |
| Color contrast | axe-core |
| Focus management | Manual |

---

## 11. Open Questions

1. **Should menus have icons?** - Figma doesn't use them in canvas menus, but Canva does. 
   - **Decision**: Optional. Use sparingly for visual distinction (e.g., delete icon for danger items).

2. **Touch device support?** - Long-press to trigger? 
   - **Decision**: Deferred to v2. Focus on desktop for v1.

3. **Plugin extensibility?** - Should plugins be able to add menu items? 
   - **Decision**: Deferred to plugin system design. API should support future extensibility.

4. **Undo for clipboard?** - Should Cut store undo point before clearing? 
   - **Decision**: Yes, align with existing clipboard implementation.

---

## 12. Appendix

### A. Existing Code References

| File | Current Implementation | Migration |
|------|----------------------|-----------|
| `src/ui/LayerTree.js:549-725` | Inline context menu for layers | Replace with ContextMenuManager |
| `src/ui/panels/components/FillLayerBar.js:70-160` | Inline context menu for fills | Replace with ContextMenuManager |

### B. Related Specifications

- [UI Design System](../design-system/ui-design-system.md)
- [Interaction Model](../../tech-specs/core/interaction-model.md)
- [Master Slide System](../slides/slide-master-system.md)

### C. Keyboard Shortcuts Reference

| Action | Windows | Mac |
|--------|---------|-----|
| Cut | Ctrl+X | ⌘X |
| Copy | Ctrl+C | ⌘C |
| Paste | Ctrl+V | ⌘V |
| Duplicate | Ctrl+D | ⌘D |
| Delete | Delete | ⌫ |
| Select All | Ctrl+A | ⌘A |
| Group | Ctrl+G | ⌘G |
| Ungroup | Ctrl+Shift+G | ⌘⇧G |
| Lock | Ctrl+L | ⌘L |
| Hide | Ctrl+Shift+H | ⌘⇧H |
| Bring to Front | ] | ] |
| Send to Back | [ | [ |
| Bring Forward | Ctrl+] | ⌘] |
| Send Backward | Ctrl+[ | ⌘[ |
| Rename | F2 | F2 |
| Zoom to Fit | Shift+1 | ⇧1 |
| Bold | Ctrl+B | ⌘B |
| Italic | Ctrl+I | ⌘I |
| Underline | Ctrl+U | ⌘U |
