# Code Fill Panel Specification

## Overview
The **Code Fill Panel** is a dedicated draggable, resizable flyout panel for managing, creating, and customizing code-based dynamic fills (CodeFill). It provides a focused workspace for working with canvas-based animations, including preset browsing, custom code editing, and AI-powered generation.

**Panel Type:** Draggable, Resizable Flyout Panel

> **Design Consistency:** This panel follows the same UI patterns as the Typography Style Manager and Color Theme Manager panels to ensure a consistent user experience across the application.

---

## 1. Purpose & Goals

### 1.1 Primary Goals
1. **Dedicated Workspace**: Provide a larger, persistent workspace for complex CodeFill operations that exceed the compact FillFlyout's capabilities
2. **Direct Object Editing**: Allow users to select objects and directly apply/update code fills without navigating through the Property Inspector
3. **Fill Layer Management**: Enable comprehensive control over code fill layers including selection, addition, deletion, and reordering
4. **Preset Discovery**: Larger preview area for browsing and selecting CodeFill presets
5. **Enhanced Code Editing**: More spacious code editor with better visibility

### 1.2 Relationship to FillFlyout
- The FillFlyout Code tab remains the quick-access entry point for simple operations
- A button in the Code tab opens the dedicated Code Fill Panel for advanced work
- Both share the same underlying CodeFill system and preset library

---

## 2. Entry Points (Information Architecture)

The Code Fill Panel can be accessed from multiple locations:

| Location | Trigger | Context |
|----------|---------|---------|
| **FillFlyout Code Tab** | "Open Panel" button | When Code fill type selected |
| **Main Menu** | `View → Code Fill Panel` | Global access |
| **Toolbar** | Click code/script icon button | Always visible in toolbar (alongside Theme/Typography) |
| **Property Inspector (Fill)** | "Edit in Panel..." button on code fill row | When element with code fill selected |
| **Keyboard Shortcut** | `Ctrl+Shift+K` (Windows) / `Cmd+Shift+K` (Mac) | Global |

### Toolbar Integration
```
┌─────────────────────────────────────────────────────────────────────────┐
│  [V] [H] [□] [T] [🖼] [📦]  │  [🎨 Theme] [Aa Styles] [</> Code]  │  [⚙] │
└─────────────────────────────────────────────────────────────────────────┘
                                                     ↑
                                              Code Fill Panel
```

---

## 3. Visual Design

### 3.1 Panel Specifications
- **Type**: Draggable, Resizable Flyout
- **Default Size**: `380px × 600px`
- **Min Size**: `340px × 500px`
- **Max Size**: `600px × 900px`
- **Background**: `--color-bg-panel`
- **Border**: `1px solid --color-border`
- **Corner Radius**: `--radius-md`
- **Shadow**: `--shadow-floating` or `0 8px 32px rgba(0,0,0,0.5)`

### 3.2 Resize & Drag Behavior
- **Drag Handle**: Panel header (title bar)
- **Resize Handles**: All four corners and edges
- **Snap to Edges**: Optional snap to viewport edges with `--spacing-4` margin
- **Position Memory**: Remembers last position/size per session

---

## 4. Panel Layout

### 4.1 Overall Structure
```
┌─────────────────────────────────────────────────────────────────┐
│ ≡  Code Fill                                              ─ □ × │  ← Header (Draggable)
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ [●] [●] [◐] [▣]    [    ] [     ] [     ]          [+]   │   │  ← Fill Layer Bar
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                 │
│ │   Presets   │ │   Custom    │ │     AI      │                 │  ← Tab Switcher
│ └─────────────┘ └─────────────┘ └─────────────┘                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                    [Tab Content Area]                           │  ← Scrollable Content
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  [Apply Changes]                            [Save as Preset]    │  ← Footer Actions
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Header
| Element | Description | Design Token |
|---------|-------------|--------------|
| **Drag Handle** | `≡` icon (hamburger) - indicates draggable | `--icon-size-md` |
| **Title** | "Code Fill" | `--font-size-lg`, `--font-weight-semibold` |
| **Minimize** | `─` collapses to title bar only | `--control-size-xs` |
| **Float/Dock** | `□` toggles between floating and docked mode | `--control-size-xs` |
| **Close** | `×` closes the panel | `--control-size-xs` |

### 4.3 Fill Layer Bar
The Fill Layer Bar displays all fill layers of the currently selected object, with special handling for code fills:

```
┌─────────────────────────────────────────────────────────────────┐
│  [●]  [●]  [◐]  [▣]  |  [    ]  [     ]  [     ]         [+]   │
│   ↑    ↑    ↑    ↑       ↑                                  ↑   │
│ solid solid grad code  empty    (non-code fills disabled)  add │
│       (dimmed)  (sel)                                           │
└─────────────────────────────────────────────────────────────────┘
```

#### Fill Layer Swatch Specifications

| Element | Size | Border Radius | States |
|---------|------|---------------|--------|
| **Swatch** | `24px × 24px` | `--radius-xs` | default, selected, disabled |
| **Add Button** | `24px × 24px` | `--radius-xs` | default, hover |
| **Gap** | `--spacing-1` between swatches | | |

#### Visual States

| State | Description | Visual Treatment |
|-------|-------------|------------------|
| **Code Fill (Selectable)** | Code type fills | Normal opacity, clickable, code icon indicator |
| **Code Fill (Selected)** | Currently active code fill | `--color-accent` border (`--border-width-2`), elevated shadow |
| **Non-Code Fill** | Solid, gradient, image, video | `--opacity-40`, cursor: not-allowed, no interaction |
| **Empty Slot** | Available slot for new fill | Dashed border `--color-border`, `+` icon on hover |
| **Add Button** | Add new code fill | `+` icon, `--color-bg-tertiary` background |

#### Interactions

| Action | Target | Behavior |
|--------|--------|----------|
| **Click** | Code fill swatch | Select this code fill for editing |
| **Click** | Non-code fill | No action (disabled) |
| **Click** | Add button | Create new code fill layer, select it |
| **Right-click** | Code fill swatch | Context menu: Delete, Duplicate, Move Up, Move Down |
| **Hover** | Any swatch | Tooltip showing fill type and index |

#### Context Menu (Right-click on Code Fill)
```
┌──────────────────────┐
│ ↑ Move Up            │
│ ↓ Move Down          │
├──────────────────────┤
│ ⎘ Duplicate          │
├──────────────────────┤
│ 🗑 Delete             │  ← Danger style
└──────────────────────┘
```

### 4.4 Tab Switcher
Three main tabs matching Typography/Color Theme pattern:
- **Presets**: Browse and apply pre-built CodeFill presets
- **Custom**: Edit current code fill manually
- **AI**: Generate code using AI assistance

---

## 5. Tab 1: Presets

### 5.1 Layout
```
┌─────────────────────────────────────────────────────────────────┐
│  Search: [🔍 Search presets...                        ]         │
├─────────────────────────────────────────────────────────────────┤
│  Category: [All Categories ▼]                                   │
├─────────────────────────────────────────────────────────────────┤
│  ─── Built-in ───────────────────────────────────────────────   │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                 │
│  │  [Canvas]  │  │  [Canvas]  │  │  [Canvas]  │                 │
│  │ Mesh Grad  │  │  Particles │  │   Waves    │                 │
│  └────────────┘  └────────────┘  └────────────┘                 │
│                                                                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                 │
│  │  [Canvas]  │  │  [Canvas]  │  │  [Canvas]  │                 │
│  │  Starfield │  │   Aurora   │  │   Noise    │                 │
│  └────────────┘  └────────────┘  └────────────┘                 │
│                                                                 │
│  ─── My Presets ─────────────────────────────────────────────   │
│  ┌────────────┐  ┌────────────┐                                 │
│  │  [Canvas]  │  │  [Canvas]  │  [+ Create]                     │
│  │ My Effect  │  │  Custom 2  │                                 │
│  │         [⋮]│  │         [⋮]│                                 │
│  └────────────┘  └────────────┘                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Preset Categories
| Category | Description |
|----------|-------------|
| **All** | Show all presets |
| **Gradients** | Dynamic gradient effects (mesh, aurora) |
| **Particles** | Particle system effects |
| **Geometric** | Shapes, patterns, grids |
| **Organic** | Natural, flowing effects |
| **Interactive** | Mouse-reactive effects |

### 5.3 Preset Card Specifications
```
┌────────────────────────────┐
│                            │
│    [Live Canvas Preview]   │  ← 4:3 aspect ratio, running animation
│                            │
├────────────────────────────┤
│  Preset Name          [⋮]  │  ← Name + options (user presets only)
└────────────────────────────┘
```

| Element | Specification |
|---------|---------------|
| **Card Size** | Flexible based on grid (3 columns typically) |
| **Preview Aspect** | 4:3 |
| **Preview Size** | Full card width, proportional height |
| **Name Font** | `--font-size-sm` |
| **Border Radius** | `--radius-md` |
| **Background** | `--color-bg-tertiary` |

### 5.4 Preset Interactions

| Action | Behavior |
|--------|----------|
| **Hover** | Preview plays (if paused). Slight scale up (`1.02`). After 300ms delay, enlarged tooltip preview appears. |
| **Click** | Apply preset to selected code fill layer, switch to Custom tab |
| **Right-click** (user presets) | Context menu: Rename, Duplicate, Delete |
| **Options menu** (user presets) | Same as right-click |

---

## 6. Tab 2: Custom

### 6.1 Layout
```
┌─────────────────────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │                   [Live Canvas Preview]                   │  │  ← Larger preview area
│  │                                                           │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ // JavaScript canvas code                                 │  │
│  │ function draw(ctx, t, w, h) {                             │  │
│  │   ctx.fillStyle = '#000';                                 │  │  ← Code Editor
│  │   ctx.fillRect(0, 0, w, h);                               │  │     (Resizable)
│  │   // ...                                                  │  │
│  │ }                                                         │  │
│  └───────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  [▶ Play/Pause]  [↻ Reset]           [Errors: None ✓]          │  ← Playback Controls
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Canvas Preview
- **Size**: Full panel width minus padding, 16:9 or 4:3 aspect ratio
- **Min Height**: `160px`
- **Border**: `1px solid --color-border`
- **Border Radius**: `--radius-md`
- **Background**: `#000000` (black for contrast)

### 6.3 Code Editor
- **Font**: `--font-mono`
- **Font Size**: `--font-size-sm`
- **Background**: `--color-bg-app`
- **Border**: `1px solid --color-border`
- **Padding**: `--spacing-3`
- **Min Height**: `120px`
- **Resizable**: Yes (vertical only)
- **Line Numbers**: Optional (future enhancement)
- **Syntax Highlighting**: Basic (future enhancement)

### 6.4 Playback Controls

| Control | Icon | Action |
|---------|------|--------|
| **Play/Pause** | ▶ / ⏸ | Toggle animation playback |
| **Reset** | ↻ | Reset animation to t=0 |
| **Error Indicator** | ✓ / ⚠ | Show code execution status |

---

## 7. Tab 3: AI

### 7.1 Layout
```
┌─────────────────────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │                   [Live Canvas Preview]                   │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  Describe your animation:                                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Create a subtle flowing gradient with gentle movement...  │  │  ← Prompt Input
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ☑ Refine prompt before generating                              │  ← Refinement Option
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐                       │
│  │     Update      │  │    Generate     │                       │  ← Action Buttons
│  │  (modify code)  │  │   (new code)    │                       │
│  └─────────────────┘  └─────────────────┘                       │
├─────────────────────────────────────────────────────────────────┤
│  Generation History:                                            │
│  ┌────────┐ ┌────────┐ ┌────────┐                               │  ← History Thumbnails
│  │ Ver 1  │ │ Ver 2  │ │ Ver 3  │                               │
│  └────────┘ └────────┘ └────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 AI Controls

| Element | Description |
|---------|-------------|
| **Prompt Input** | Textarea for describing desired animation |
| **Refine Checkbox** | Pre-processes prompt for better AI results |
| **Update Button** | Modifies existing code based on prompt |
| **Generate Button** | Creates entirely new code from prompt |
| **History** | Thumbnails of previous generations for quick revert |

---

## 8. Fill Layer Bar - Deep Dive

### 8.1 Data Model Integration
The Fill Layer Bar reflects the `element.style.fills` array:

```javascript
// Example fills array
element.style.fills = [
  { type: 'solid', color: '#FF0000', opacity: 100, visible: true },
  { type: 'gradient', value: {...}, opacity: 80, visible: true },
  { type: 'code', code: '...', opacity: 100, visible: true },  // ← Editable in panel
  { type: 'code', code: '...', opacity: 50, visible: false }   // ← Also editable
];
```

### 8.2 Rendering Logic

```javascript
// Pseudo-code for rendering fill layer bar
fills.forEach((fill, index) => {
  const swatch = createSwatch();
  
  if (fill.type === 'code') {
    swatch.classList.add('code-fill', 'selectable');
    swatch.onclick = () => selectCodeFill(index);
    swatch.oncontextmenu = (e) => showContextMenu(e, index);
    
    if (index === selectedCodeFillIndex) {
      swatch.classList.add('selected');
    }
    
    // Render code icon or mini preview
    swatch.innerHTML = Icons.CODE;
  } else {
    swatch.classList.add('non-code', 'disabled');
    swatch.style.opacity = '0.4';
    swatch.style.cursor = 'not-allowed';
    
    // Render appropriate preview based on type
    if (fill.type === 'solid') {
      swatch.style.backgroundColor = fill.color;
    } else if (fill.type === 'gradient') {
      swatch.style.background = getGradientCSS(fill.value);
    }
    // etc.
  }
  
  bar.appendChild(swatch);
});

// Add "+" button at end
bar.appendChild(createAddButton());
```

### 8.3 Selection Behavior

1. **No Selection**: When panel opens with no code fills, show empty state prompt
2. **Single Code Fill**: Auto-select it
3. **Multiple Code Fills**: Select first code fill by default, allow switching
4. **No Object Selected**: Show "Select an object" empty state

### 8.4 Empty States

#### No Object Selected
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                         [ Icon: Cursor ]                        │
│                                                                 │
│                    Select an object to edit                     │
│                        its code fills                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Object Has No Code Fills
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                         [ Icon: Code ]                          │
│                                                                 │
│                     No code fills yet                           │
│                                                                 │
│                     [+ Add Code Fill]                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Slide Background Support

The Code Fill Panel also works with slide backgrounds:

### 9.1 Context Detection
```javascript
// Determine editing context
if (selection.length === 0) {
  // No element selected - check if we're in slide context
  if (contextMode === 'slide-background') {
    // Edit slide background fills
    fills = currentSlide.background.fills || [];
  } else {
    // Show "Select an object" state
  }
} else {
  // Element selected
  fills = selectedElement.style.fills || [];
}
```

### 9.2 UI Indicator
When editing slide background, show indicator:
```
┌─────────────────────────────────────────────────────────────────┐
│  📄 Editing: Slide Background                                   │
├─────────────────────────────────────────────────────────────────┤
│  [Fill Layer Bar...]                                            │
```

---

## 10. Interactions & Workflows

### 10.1 Basic Workflow: Apply Preset
1. User selects an object with existing fills
2. Opens Code Fill Panel
3. Clicks "+" to add new code fill layer
4. New code fill appears in Fill Layer Bar (selected)
5. Browse Presets tab, click desired preset
6. Switches to Custom tab with preset applied
7. User adjusts if needed
8. Panel auto-saves changes

### 10.2 Editing Existing Code Fill
1. User selects object with code fills
2. Opens Code Fill Panel
3. Code fills appear in Fill Layer Bar
4. Click desired code fill to select
5. Edit in Custom or AI tab
6. Changes apply in real-time

### 10.3 Deleting Code Fill
1. Right-click code fill swatch in Fill Layer Bar
2. Select "Delete" from context menu
3. Confirmation: "Delete this code fill?" (optional, could be immediate with undo)
4. Fill removed, next code fill auto-selected (or empty state)

---

## 11. Design System Integration

### 11.1 CSS Classes & Variables Used

| Component | CSS Class | Key Variables |
|-----------|-----------|---------------|
| **Panel** | `.code-fill-panel`, `.draggable-panel` | `--color-bg-panel`, `--shadow-floating` |
| **Header** | `.draggable-panel-header` | `--font-size-lg`, `--control-size-xs` |
| **Fill Bar** | `.cfp-fill-layer-bar` | `--spacing-2`, `--radius-xs` |
| **Swatch** | `.cfp-fill-swatch` | `--icon-size-xl` (24px) |
| **Tabs** | `.tsm-tabs`, `.segmented-control` | Existing tab styles |
| **Content** | `.draggable-panel-content` | `--spacing-3` padding |
| **Preset Grid** | `.cfp-preset-grid` | Grid with 3 columns |
| **Preset Card** | `.cfp-preset-card` | `--radius-md`, `--color-bg-tertiary` |
| **Code Editor** | `.cfp-code-editor` | `--font-mono`, `--color-bg-app` |

### 11.2 Shared Components

| Component | Import From | Usage |
|-----------|-------------|-------|
| `DraggablePanel` | `../components/DraggablePanel.js` | Base class |
| `SegmentedControl` | `../components/SegmentedControl.js` | Tab switcher |
| `IconButton` | `../components/IconButton.js` | Header/action buttons |
| `ContextMenu` | `../components/ContextMenu.js` | Right-click menus |
| `PresetsTab` | `../FillFlyout/PresetsTab.js` | Reuse preset display |
| `CodeRunner` | `../../../core/effects/CodeRunner.js` | Canvas execution |

---

## 12. UX Critique & Enhancements

### 12.1 Potential UX Issues

| Issue | Concern | Recommendation |
|-------|---------|----------------|
| **Fill Layer Confusion** | Users may not understand why non-code fills are disabled | Add tooltip: "Only code fills can be edited here. Use Property Inspector for other fill types." |
| **No Visual Distinction** | Code fill swatches look similar to each other | Consider adding mini-preview or unique icon per code fill, or show a portion of the animation |
| **Selection Persistence** | Changing tabs might lose context | Maintain selected code fill index across tab switches |
| **Live Preview Performance** | Multiple running canvases could be heavy | Pause previews in Presets tab when not visible; only run active preview |
| **Undo/Redo** | Code changes should be undoable | Integrate with existing history system |

### 12.2 Missing Interaction Details

1. **Keyboard Navigation**
   - `Tab` to move between swatches in Fill Layer Bar
   - `Enter` to select focused swatch
   - `Delete` to delete focused code fill
   - Arrow keys to navigate preset grid

2. **Drag & Drop for Reordering**
   - Allow dragging code fill swatches to reorder
   - Visual feedback: insertion indicator line

3. **Copy/Paste**
   - `Ctrl+C` on selected code fill copies the code
   - `Ctrl+V` creates new code fill with pasted code
   - Cross-object pasting should work

4. **Duplicate Shortcut**
   - `Ctrl+D` duplicates selected code fill
   - New fill added immediately after original

### 12.3 Visual Enhancements

1. **Code Fill Mini-Preview**
   - Instead of just code icon, show tiny animated preview in swatch
   - Performance: Very small canvas (24x24) with reduced frame rate

2. **Fill Layer Reorder Animation**
   - Smooth reorder animation when dragging
   - Use `--duration-normal` for transitions

3. **Selection Highlight**
   - Subtle glow effect on selected code fill swatch
   - `box-shadow: 0 0 0 2px var(--color-accent)`

### 12.4 Accessibility Considerations

1. **ARIA Labels**
   - `aria-label="Code fill layer 2 of 3"` on swatches
   - `aria-selected="true"` for selected swatch
   - `role="listbox"` on Fill Layer Bar

2. **Focus Indicators**
   - Visible focus ring on all interactive elements
   - Use `--color-border-focus` for focus styles

3. **Screen Reader Announcements**
   - Announce when code fill is selected/added/deleted
   - Announce tab changes

---

## 13. Technical Considerations

### 13.1 State Management
- Panel state (position, size, selected tab) persisted to localStorage
- Selected code fill index is per-object, not persisted
- Code changes trigger store updates for undo/redo

### 13.2 Performance
- Use `requestAnimationFrame` throttling for code editor input
- Debounce store updates (300ms delay)
- Lazy-load presets tab canvas previews

### 13.3 Error Handling
- Code syntax errors shown in footer indicator
- Runtime errors caught and displayed
- Fallback to last working code on error

---

## 14. Future Enhancements

1. **Code Templates**: Quick-insert common patterns
2. **Variable Controls**: UI sliders for code parameters
3. **Export/Import**: Share presets as files
4. **Collaboration**: Preset sharing in team libraries
5. **Syntax Highlighting**: Full Monaco editor integration
6. **Version Control**: History of code changes with diff view

---

## 15. Open Questions

1. **Fill Layer Limit**: Should there be a max number of fills?
2. **Code Fill Naming**: Should each code fill have a user-defined name?
3. **Preview Quality**: What canvas resolution for swatches?
4. **Offline Support**: How to handle AI features offline?
