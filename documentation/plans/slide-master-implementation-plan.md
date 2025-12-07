# Slide Master System Implementation Plan (v3)

This comprehensive plan details the implementation of the enhanced Slide Master System with full Color Theme Manager and Typography Style Manager integration, as specified in the updated specs.

**Last Updated:** November 26, 2025

---

## Principles
- **Small Incremental Steps:** Each phase should be testable independently.
- **Non-breaking:** Existing slide editing functionality must remain operational at every step.
- **Design System:** Use existing components (`Dropdown`, `NumberInput`, `IconButton`, `Flyout`, `Section`, `FillSection`) and create new ones only if necessary.
- **Validation:** Verify against the spec at each step.

---

## ✅ Completed (v1 Foundation)

The following phases from the original implementation are complete and provide the foundation:

- [x] **Phase 1-2:** Core data structure, rendering engine with inheritance
- [x] **Phase 3-5:** Master mode foundation, UI panel, rendering in master mode
- [x] **Phase 6-7:** Editing masters, advanced features (snapping, clipboard, placeholders)
- [x] **Phase 8:** Basic theme settings with CSS variables
- [x] **Phase 9-10:** Polish, undo/redo, hide graphics, rename, insert placeholder

---

## ✅ Completed (v2 Theme Panels)

- [x] **Phase 11.1:** Expand Theme Color Schema to 12 colors
- [x] **Phase 12.1:** DraggablePanel Component
- [x] **Phase 12.2:** PanelManager Service
- [x] **Phase 13 (Color Theme Manager):** Complete
  - ColorPresets.js with 20 presets
  - Store actions (APPLY_COLOR_PRESET, RESET_THEME_COLORS, UPDATE_THEME_COLOR)
  - ColorThemeManager.js panel with Presets, Custom, AI tabs
  - Registered in main.js with Ctrl+Shift+C shortcut
- [x] **Phase 14 (Typography Style Manager):** Complete
  - FontPresets.js with typography presets
  - TypographyStyleManager.js panel with Fonts, Styles tabs
  - Registered in main.js with Ctrl+Shift+T shortcut

---

## ✅ Completed (v3 Core Features - Current Session)

- [x] **PlaceholderSection v3:** Simplified click-to-add placeholders at default positions
- [x] **Store Routing Fix:** ADD_ELEMENT_TO_MASTER and DELETE_ELEMENT_FROM_MASTER properly routed
- [x] **9 Built-in Layouts:** Title Slide, Title and Content, Section Header, Two Content, Comparison, Title Only, Blank, Content with Caption, Picture with Caption
- [x] **Placeholder Visual Styling:** Dashed border in master mode (TextElement.js)
- [x] **Empty Placeholder Styling:** Dimmed prompt text with dashed border on slides
- [x] **Master Mode Keyboard Shortcut:** Shift+Ctrl/Cmd+M to toggle master mode
- [x] **Visual Layout Picker:** Thumbnail grid in SlideSection with mini-previews
- [x] **Content Remapping:** Intelligent remapping when changing layouts (mappingId, type match, overflow)
- [x] **Inherited Elements Dimming:** Master/layout elements shown at 50% opacity on child containers
- [x] **Left Panel Accordion:** Collapsible Slides/Layers sections with draggable resizer

---

## 🔲 Remaining Implementation

### Phase 15: Master/Layout Management Actions
**Goal:** Complete CRUD operations for masters and layouts
**Priority:** High
**Estimated Time:** 4-6 hours

#### 15.1 Add New Layout
- [ ] Add "+" button to create new blank layout
- [ ] Store action: `ADD_LAYOUT` - creates layout under current theme master
- [ ] Default name: "Custom Layout 1", "Custom Layout 2", etc.
- [ ] New layout should be selected after creation

#### 15.2 Duplicate Master/Layout
- [ ] Right-click context menu on thumbnails
- [ ] Store action: `DUPLICATE_MASTER` - deep copies master with all layouts
- [ ] Store action: `DUPLICATE_LAYOUT` - copies layout with new ID
- [ ] Append "(Copy)" to duplicated name

#### 15.3 Delete Master/Layout
- [ ] Store action: `DELETE_LAYOUT` with validation
- [ ] Cannot delete last layout in a master
- [ ] Warning dialog if layout is in use by slides
- [ ] Reassign affected slides to another layout
- [ ] Store action: `DELETE_MASTER` (future - low priority)

#### 15.4 Rename Master/Layout
- [ ] Double-click or F2 to rename in thumbnail panel
- [ ] Inline text editing with Enter to confirm, Escape to cancel
- [ ] Store action: `RENAME_MASTER` / already have UPDATE_MASTER

---

### Phase 16: Context Menu System
**Goal:** Add right-click context menus throughout the app
**Priority:** Medium
**Estimated Time:** 6-8 hours

#### 16.1 Create ContextMenu Component
- [ ] New file: `src/ui/components/ContextMenu.js`
- [ ] Positioned at click location
- [ ] Closes on click outside or Escape
- [ ] Supports nested submenus (optional)
- [ ] Keyboard navigation (arrow keys)

#### 16.2 Slide Thumbnail Context Menu
- [ ] Actions: Duplicate, Delete, Add New Slide, Edit Slide Master
- [ ] "Edit Slide Master" jumps to master mode with that slide's layout selected

#### 16.3 Master/Layout Thumbnail Context Menu
- [ ] Actions: Duplicate, Delete, Rename, Add Layout (on master only)
- [ ] Disabled states for protected actions

#### 16.4 Layer Tree Context Menu
- [ ] Actions: Duplicate, Delete, Lock/Unlock, Group, Ungroup
- [ ] Bring to Front, Send to Back, Bring Forward, Send Backward

---

### Phase 17: Placeholder Editing Workflow
**Goal:** Implement full placeholder interaction on slides
**Priority:** Medium
**Estimated Time:** 4-6 hours

#### 17.1 Click-to-Edit Placeholders on Slides
- [ ] Clicking empty placeholder activates text editing mode
- [ ] Placeholder prompt text is replaced with cursor
- [ ] Content saves to slide's elements (not master)

#### 17.2 Reset Placeholder
- [ ] "Reset to Placeholder" option in context menu
- [ ] Clears content, returns to empty placeholder state
- [ ] Removes slide-level element, shows layout placeholder again

#### 17.3 Visual States
- [ ] Empty: Dashed border, prompt text, 50% opacity ✅
- [ ] Focused: Solid border, cursor blinking
- [ ] Filled: Normal element appearance, no dashed border

---

### Phase 18: Master Elements Visibility Controls
**Goal:** Per-layout control over master element visibility
**Priority:** Medium
**Estimated Time:** 3-4 hours

#### 18.1 Master Elements Checkboxes
- [ ] In Layout property inspector: checkboxes for each master element type
- [ ] Logo, Footer, Date, Slide Number visibility toggles
- [ ] Stored as `hiddenMasterElements: ['footer', 'date']` on layout

---

### Phase 19: Slide Properties Enhancement
**Goal:** Complete slide property inspector per spec
**Priority:** Low
**Estimated Time:** 2-3 hours

#### 19.1 Reset Slide Button
- [ ] Clears all slide-level content
- [ ] Returns all placeholders to empty state
- [ ] Confirmation dialog: "This will clear all content. Continue?"

#### 19.2 Edit Master Button
- [ ] Quick jump to master mode from slide properties
- [ ] Opens master mode with current slide's layout selected

---

### Phase 20: Banner and Watermark Indicators
**Goal:** Visual indicators when editing masters/layouts
**Priority:** Low
**Estimated Time:** 2-3 hours

#### 20.1 Editing Banner
- [ ] "Editing: [Master/Layout Name]" banner at top of canvas
- [ ] Subtle, non-intrusive styling
- [ ] Click to see which slides use this layout

#### 20.2 Watermark
- [ ] Subtle "MASTER" or "LAYOUT" watermark on canvas
- [ ] Low opacity, doesn't interfere with editing
- [ ] Optional/configurable

---

### Phase 21: Advanced Features (Future)
**Goal:** Enhanced features for power users
**Priority:** Low
**Estimated Time:** Variable

#### 21.1 Multiple Slide Masters
- [ ] Support multiple theme masters in one presentation
- [ ] Different themes for different sections
- [ ] "Apply to All" vs "Apply to Section" options

#### 21.2 Master Templates Library
- [ ] Save custom masters as templates
- [ ] Import/export masters between presentations
- [ ] Built-in template gallery

#### 21.3 Animation Masters
- [ ] Define default animations on master
- [ ] Entrance/exit effects inherited by slides

---

## Current State Summary

### Fully Working ✅
1. Master mode toggle (Edit Master / Close Master buttons + keyboard shortcut)
2. Slide master and layout structure in store
3. 9 built-in layouts with proper placeholders
4. Placeholder creation in master mode (click palette to add)
5. Visual layout picker with thumbnails
6. Background inheritance via Fill System
7. Theme color management (Color Theme Manager panel)
8. Typography style management (Typography Style Manager panel)
9. Content remapping when changing layouts
10. Inherited elements shown dimmed (50% opacity)
11. Accordion-style left panel with collapsible sections

### Partially Working 🟡
1. Placeholder editing on slides (basic - needs click-to-edit flow)
2. Master element visibility (hideBackgroundGraphics exists)
3. Layer tree for masters (works, may need refinement)

### Not Yet Implemented 🔲
1. Add/Duplicate/Delete layouts
2. Context menus (right-click)
3. Reset placeholder / Reset slide
4. Per-element master visibility toggles
5. Editing banner/watermark indicators
6. Inline rename for masters/layouts

---

## Recommended Next Steps

1. **Phase 15.1-15.3** - Add/Duplicate/Delete layout actions (high value)
2. **Phase 16.1-16.2** - Context menu for slides (improves UX significantly)
3. **Phase 17.1** - Click-to-edit placeholders on slides (core workflow)
4. **Phase 18.1** - Master element visibility checkboxes

---

## Files Modified in Current Session

- `src/core/Store.js` - Fixed action routing
- `src/core/store/InitialState.js` - 9 layout masters
- `src/core/store/handlers/SlideHandlers.js` - Content remapping
- `src/core/renderer/elements/TextElement.js` - Placeholder styling
- `src/core/renderer/elements/VisualElement.js` - Inherited element dimming
- `src/core/renderer/BaseRenderer.js` - Mark inherited elements
- `src/main.js` - Master mode shortcut, LeftPanel init
- `src/ui/LeftPanel.js` - New accordion panel component
- `src/ui/properties/SlideSection.js` - Layout thumbnail grid
- `styles/modules/layout.css` - Accordion styles
- `styles/modules/property-inspector.css` - Layout thumbnail styles
- [ ] New color variables are available in CSS
- [ ] Old presentations migrate correctly
- [ ] No visual regressions on existing slides

### 11.2 Add Typography Styles Schema
**Estimated Time:** 2-3 hours  
**Risk Level:** Low (additive change)

**Tasks:**
1. **Define Text Styles in Theme:**
   ```javascript
   textStyles: {
     title: { fontSize: 44, fontWeight: "700", lineHeight: 1.2, letterSpacing: -0.02, color: "text1" },
     subtitle: { fontSize: 32, fontWeight: "400", lineHeight: 1.3, color: "text2" },
     bodyLevel1: { fontSize: 28, fontWeight: "400", lineHeight: 1.5, color: "text1" },
     bodyLevel2: { fontSize: 24, fontWeight: "400", lineHeight: 1.5, color: "text1" },
     bodyLevel3: { fontSize: 20, fontWeight: "400", lineHeight: 1.5, color: "text2" },
     bodyLevel4: { fontSize: 18, fontWeight: "400", lineHeight: 1.5, color: "text2" },
     bodyLevel5: { fontSize: 16, fontWeight: "400", lineHeight: 1.5, color: "text2" },
     caption: { fontSize: 14, fontWeight: "400", lineHeight: 1.4, color: "text2" }
   }
   ```

2. **Update Placeholder Defaults:**
   - Title placeholder → uses `textStyles.title`
   - Subtitle placeholder → uses `textStyles.subtitle`
   - Body placeholder → uses `textStyles.bodyLevel1`

**Validation Checklist:**
- [ ] Text styles are defined in state
- [ ] Placeholders reference text styles
- [ ] No breaking changes to existing elements

### 11.3 Update Background to Fill System
**Estimated Time:** 2-3 hours  
**Risk Level:** Medium (changes data format)

**Tasks:**
1. **Standardize Background Format:**
   - All backgrounds use Fill System array: `[{ type, value, color, opacity, visible }]`
   - `null` or `[]` = inherit from parent
   - Non-empty array = override

2. **Update SlideSection.js:**
   - Already partially done, verify full compatibility
   - Remove "Hide Background Graphics" option (per spec update)

3. **Update InheritanceResolver:**
   ```javascript
   function resolveBackground(slide, layout, master) {
     const hasFills = (bg) => Array.isArray(bg) && bg.length > 0;
     
     if (hasFills(slide.background)) return slide.background;
     if (hasFills(layout?.background)) return layout.background;
     if (hasFills(master?.background)) return master.background;
     
     return [{ type: 'solid', color: '#FFFFFF', opacity: 100, visible: true }];
   }
   ```

**Validation Checklist:**
- [ ] Backgrounds resolve correctly through inheritance
- [ ] FillSection works for slide/layout/master backgrounds
- [ ] No "Hide Background Graphics" option in UI

---

## Phase 12: Draggable Panel Framework
**Goal:** Create reusable panel infrastructure for theme managers.

### 12.1 Create DraggablePanel Component
**Estimated Time:** 4-5 hours  
**Risk Level:** Low (new component)

**Tasks:**
1. **Create Base Component:**
   - File: `src/ui/components/DraggablePanel.js` (new)
   - Features: Draggable header, resizable edges/corners, min/max constraints

2. **Implementation Details:**
   ```javascript
   export class DraggablePanel {
     constructor(options = {}) {
       this.options = {
         title: 'Panel',
         defaultWidth: 320,
         defaultHeight: 480,
         minWidth: 280,
         minHeight: 400,
         maxWidth: 600,
         maxHeight: 900,
         resizable: true,
         ...options
       };
       this.element = this.createElement();
       this.setupDrag();
       this.setupResize();
       this.loadPosition();
     }
     
     createElement() { /* Header, content area, resize handles */ }
     setupDrag() { /* Mouse events on header */ }
     setupResize() { /* Mouse events on edges/corners */ }
     loadPosition() { /* From localStorage */ }
     savePosition() { /* To localStorage */ }
     open() { /* Show panel, bring to front */ }
     close() { /* Hide panel, save position */ }
     minimize() { /* Collapse to title bar */ }
   }
   ```

3. **CSS Styling:**
   - File: `styles/modules/draggable-panel.css` (new)
   - Consistent with UI design system
   - Resize cursors, drag feedback

**Validation Checklist:**
- [ ] Panel can be dragged by header
- [ ] Panel can be resized from edges/corners
- [ ] Min/max size constraints work
- [ ] Position persists in localStorage
- [ ] Close/minimize buttons work

### 12.2 Create PanelManager
**Estimated Time:** 2-3 hours  
**Risk Level:** Low (new utility)

**Tasks:**
1. **Panel Management:**
   - File: `src/ui/PanelManager.js` (new)
   - Track open panels, manage z-index
   - Keyboard shortcut registration

2. **Implementation:**
   ```javascript
   class PanelManager {
     constructor() {
       this.panels = new Map();
       this.topZIndex = 1000;
     }
     
     register(id, panel) { /* Add to map */ }
     open(id) { /* Show panel, bring to front */ }
     close(id) { /* Hide panel */ }
     toggle(id) { /* Toggle visibility */ }
     bringToFront(id) { /* Update z-index */ }
     closeAll() { /* Close all panels */ }
   }
   
   export const panelManager = new PanelManager();
   ```

**Validation Checklist:**
- [ ] Panels can be registered
- [ ] Opening panel brings it to front
- [ ] Multiple panels stack correctly
- [ ] Clicking panel brings it to front

---

## Phase 13: Color Theme Manager Panel
**Goal:** Implement the full Color Theme Manager as specified.

### 13.1 Panel Structure & Tabs
**Estimated Time:** 3-4 hours  
**Risk Level:** Low

**Tasks:**
1. **Create ColorThemeManager:**
   - File: `src/ui/panels/ColorThemeManager.js` (new)
   - Extends DraggablePanel
   - Three tabs: Presets, Custom, AI

2. **Tab Navigation:**
   - Use SegmentedControl or custom tab component
   - Tab content areas with show/hide

3. **Footer Actions:**
   - "Apply to Presentation" button
   - "Save Theme" button

**Validation Checklist:**
- [ ] Panel opens and closes
- [ ] Tabs switch correctly
- [ ] Footer buttons are present

### 13.2 Presets Tab
**Estimated Time:** 4-5 hours  
**Risk Level:** Low

**Tasks:**
1. **Create Color Presets:**
   - File: `src/core/constants/ColorPresets.js` (new)
   - 16+ presets across categories (Professional, Creative, Dark, Minimal)
   - Each preset has all 12 color roles

2. **Preset Card Component:**
   - Grid of preset cards
   - Each card shows color swatches, name
   - Hover: expand to show all colors
   - Click: select and preview
   - Double-click: apply

3. **Search & Filter:**
   - Search input
   - Category dropdown filter

**Validation Checklist:**
- [ ] All presets display correctly
- [ ] Search filters presets
- [ ] Category filter works
- [ ] Click/double-click apply correctly

### 13.3 Custom Tab
**Estimated Time:** 4-5 hours  
**Risk Level:** Medium (affects theme state)

**Tasks:**
1. **Color Role List:**
   - List all 12 color roles
   - Each row: Label, Color Swatch, Hex Value, Edit button

2. **Color Editing:**
   - Click swatch or Edit → Open ColorPicker flyout
   - Changes dispatch `UPDATE_THEME_SETTINGS`

3. **Reset Button:**
   - "Reset to Default" restores preset values

**Validation Checklist:**
- [ ] All 12 colors are editable
- [ ] ColorPicker opens on click
- [ ] Changes update theme immediately
- [ ] Reset works correctly

### 13.4 AI Tab (Skeleton)
**Estimated Time:** 2-3 hours  
**Risk Level:** Low (UI only, AI integration later)

**Tasks:**
1. **Image Drop Zone:**
   - Drag/drop area for image upload
   - "Extracting colors..." placeholder state

2. **AI Prompt Area:**
   - Text area for prompt input
   - Style hints dropdown
   - Generate button (disabled/placeholder)

3. **Results Area:**
   - Placeholder for generated variations

**Note:** Full AI integration deferred to future phase.

**Validation Checklist:**
- [ ] Image drop zone renders
- [ ] Prompt area is functional
- [ ] UI is complete (even if AI not connected)

### 13.5 Entry Points
**Estimated Time:** 2-3 hours  
**Risk Level:** Low

**Tasks:**
1. **Toolbar Button:**
   - Add palette icon to toolbar
   - Opens ColorThemeManager

2. **View Menu:**
   - Add "Color Theme Manager" to View menu

3. **Property Inspector Links:**
   - "Customize Colors..." in SlideSection (Master mode)
   - "Edit Theme Colors..." in SlideSection (Slide mode)

4. **Keyboard Shortcut:**
   - `Ctrl+Shift+C` → Toggle panel

**Validation Checklist:**
- [ ] Toolbar button opens panel
- [ ] Menu item opens panel
- [ ] Property Inspector links work
- [ ] Keyboard shortcut works

---

## Phase 14: Typography Style Manager Panel
**Goal:** Implement the full Typography Style Manager as specified.

### 14.1 Panel Structure & Tabs
**Estimated Time:** 3-4 hours  
**Risk Level:** Low

**Tasks:**
1. **Create TypographyStyleManager:**
   - File: `src/ui/panels/TypographyStyleManager.js` (new)
   - Extends DraggablePanel
   - Three tabs: Presets, Custom, AI

2. **Tab Navigation:**
   - Same pattern as ColorThemeManager

**Validation Checklist:**
- [ ] Panel opens and closes
- [ ] Tabs switch correctly

### 14.2 Presets Tab
**Estimated Time:** 4-5 hours  
**Risk Level:** Low

**Tasks:**
1. **Create Font Presets:**
   - File: `src/core/constants/FontPresets.js` (new)
   - 15+ font pairing presets
   - Categories: Sans-Serif, Serif, Mixed, Display, Monospace

2. **Preset Card Component:**
   - List of preset cards
   - Each shows heading/body preview with actual fonts
   - Font family names displayed

3. **Font Loading:**
   - Integrate with FontManager
   - Load fonts on-demand for preview

**Validation Checklist:**
- [ ] All presets display with correct fonts
- [ ] Fonts load correctly
- [ ] Click/apply works

### 14.3 Custom Tab
**Estimated Time:** 5-6 hours  
**Risk Level:** Medium

**Tasks:**
1. **Theme Fonts Section:**
   - Heading font: Family dropdown, Weight dropdown
   - Body font: Family dropdown, Weight dropdown

2. **Text Styles List:**
   - List of 8 text styles (Title, Subtitle, Body 1-5, Caption)
   - Each shows preview, font info
   - Edit button expands inline editor

3. **Style Editor:**
   - Font family, weight, size
   - Line height, letter spacing
   - Color (theme color reference or custom)
   - Live preview

**Validation Checklist:**
- [ ] Theme fonts editable
- [ ] All text styles listed
- [ ] Inline editor works
- [ ] Changes update theme

### 14.4 AI Tab (Skeleton)
**Estimated Time:** 2-3 hours  
**Risk Level:** Low

**Tasks:**
1. **Prompt Area:**
   - Text area for style description
   - Mood dropdown
   - Industry dropdown

2. **Results Area:**
   - Placeholder for generated variations

**Validation Checklist:**
- [ ] UI complete for future AI integration

### 14.5 Entry Points
**Estimated Time:** 2-3 hours  
**Risk Level:** Low

**Tasks:**
1. **Toolbar Button:**
   - Add "Aa" icon to toolbar

2. **View Menu:**
   - Add "Typography Style Manager"

3. **Property Inspector Links:**
   - "Customize Fonts..." in SlideSection
   - "Manage Styles..." in TextSection style dropdown

4. **Keyboard Shortcut:**
   - `Ctrl+Shift+T` → Toggle panel

**Validation Checklist:**
- [ ] All entry points work

---

## Phase 15: Integration & Rendering Updates
**Goal:** Ensure theme changes propagate correctly through rendering.

### 15.1 CSS Variable Injection Update
**Estimated Time:** 2-3 hours  
**Risk Level:** Medium

**Tasks:**
1. **Update SlideRenderer:**
   - Inject all 12 color variables
   - Inject font family variables with fallbacks
   - Inject text style variables (optional, or direct resolution)

2. **Variable Naming:**
   ```css
   --theme-bg1: #FFFFFF;
   --theme-bg2: #F5F5F5;
   --theme-text1: #333333;
   --theme-text2: #666666;
   --theme-accent1: #18A0FB;
   /* ... etc */
   --theme-font-heading: "Inter", system-ui, sans-serif;
   --theme-font-body: "Inter", system-ui, sans-serif;
   ```

**Validation Checklist:**
- [ ] All variables injected
- [ ] Elements using variables update on theme change
- [ ] No performance regression

### 15.2 Text Style Resolution
**Estimated Time:** 3-4 hours  
**Risk Level:** Medium

**Tasks:**
1. **Create StyleResolver Utility:**
   - File: `src/core/utils/StyleResolver.js` (new or update)
   - `resolveTextStyle(element, theme)` → Returns computed style

2. **Update Text Rendering:**
   - Placeholders reference text styles
   - Resolve style at render time

**Validation Checklist:**
- [ ] Placeholders use text styles
- [ ] Style changes update placeholders
- [ ] Custom overrides respected

---

## Phase 16: Placeholder System Enhancement
**Goal:** Complete placeholder implementation per spec.

### 16.1 Placeholder Types
**Estimated Time:** 3-4 hours  
**Risk Level:** Medium

**Tasks:**
1. **Define All Placeholder Types:**
   - Title, Subtitle, Body/Content, Text
   - Picture, Media
   - Date, Footer, Slide Number
   - Table (future - stub only)

2. **Placeholder Schema:**
   ```javascript
   {
     id: "ph-title-1",
     type: "placeholder",
     placeholderType: "title",
     promptText: "Click to add title",
     defaultStyle: "title", // Reference to textStyles
     constraints: { minWidth: 200, maxWidth: null, minHeight: 50 }
   }
   ```

3. **Placeholder Rendering:**
   - Empty: Dashed border, prompt text, type icon
   - Filled: Normal element rendering

**Validation Checklist:**
- [ ] All placeholder types defined
- [ ] Correct visual rendering
- [ ] Proper state handling

### 16.2 Placeholder Editing
**Estimated Time:** 3-4 hours  
**Risk Level:** Medium

**Tasks:**
1. **Content Creation:**
   - Click empty placeholder → Create content element
   - Content stored in slide, keyed by placeholder ID

2. **Edit Behavior:**
   - Text placeholders: Enter text edit mode
   - Picture placeholders: Open file picker
   - Date/Footer/SlideNumber: Auto-populate or manual edit

**Validation Checklist:**
- [ ] Can fill all placeholder types
- [ ] Content persists correctly
- [ ] Edit mode works properly

---

## Phase 17: Polish & Edge Cases
**Goal:** Handle edge cases, optimize, document.

### 17.1 Error Handling
**Estimated Time:** 2-3 hours

**Tasks:**
1. **Orphaned References:**
   - Detect slides referencing deleted layouts
   - Auto-assign to first available layout
   - User notification

2. **Font Loading Failures:**
   - Fallback fonts
   - Error state in UI

### 17.2 Performance Optimization
**Estimated Time:** 2-3 hours

**Tasks:**
1. **Caching:**
   - Cache resolved backgrounds
   - Cache resolved text styles
   - Invalidate on theme changes

2. **Panel Performance:**
   - Lazy load preset previews
   - Debounce search/filter

### 17.3 Accessibility
**Estimated Time:** 2-3 hours

**Tasks:**
1. **Keyboard Navigation:**
   - Tab navigation in panels
   - Arrow keys for grids
   - Escape to close

2. **Screen Reader:**
   - ARIA labels
   - State announcements

### 17.4 Documentation
**Estimated Time:** 1-2 hours

**Tasks:**
1. **Tooltips:**
   - All panel controls
   - Entry point buttons

2. **Help Text:**
   - Empty states
   - Feature explanations

---

## Risk Assessment

### High Risk Items
| Item | Risk | Mitigation |
|------|------|------------|
| Data migration | Existing presentations break | Comprehensive migration, testing |
| Theme variable changes | Rendering bugs | Incremental changes, visual tests |
| State complexity | Memory/performance | Efficient selectors, caching |

### Medium Risk Items
| Item | Risk | Mitigation |
|------|------|------------|
| Panel positioning | Edge cases | Bounds checking, reset option |
| Font loading | Network failures | Fallbacks, error handling |
| Inheritance bugs | Wrong values | Unit tests for resolver |

### Low Risk Items
| Item | Risk | Mitigation |
|------|------|------------|
| New UI components | Minor bugs | Isolated testing |
| Entry points | Broken links | Verification checklist |

---

## Dependencies

### Internal
- `FillSection.js` - Background editing
- `Store.js` - State management
- `SlideRenderer.js` - Rendering
- `FontManager.js` - Font loading

### External
- Google Fonts API
- AI Service (future)

---

## Timeline Estimate

| Phase | Estimated Hours | Dependencies |
|-------|-----------------|--------------|
| Phase 11: Data Model | 6-9 hrs | None |
| Phase 12: Panel Framework | 6-8 hrs | None |
| Phase 13: Color Theme Manager | 15-20 hrs | Phase 11, 12 |
| Phase 14: Typography Style Manager | 16-21 hrs | Phase 11, 12 |
| Phase 15: Integration | 5-7 hrs | Phase 13, 14 |
| Phase 16: Placeholders | 6-8 hrs | Phase 11 |
| Phase 17: Polish | 7-11 hrs | All |

**Total: 61-84 hours (8-11 working days)**

---

## Testing Checklist

### Unit Tests
- [ ] Color migration utility
- [ ] Inheritance resolver
- [ ] Style resolver

### Integration Tests
- [ ] Theme changes propagate to slides
- [ ] Panel open/close/drag/resize
- [ ] Preset application

### Manual Testing
- [ ] Create new presentation → Default theme applied
- [ ] Change theme color → All slides update
- [ ] Change theme font → All text updates
- [ ] Apply preset → All values change
- [ ] Open existing presentation → Migration works
- [ ] Multiple panels open → Z-index correct
- [ ] Keyboard shortcuts → All work

---

## Next Steps

1. **Start with Phase 11.1:** Expand color schema
2. **Create feature branch:** `feature/theme-managers-v2`
3. **Implement incrementally, commit after each sub-task**
4. **Run full test suite after each phase**

---

## Related Documents

- [Slide Master System Spec](../specs/slides/slide-master-system.md)
- [Color Theme Manager Spec](../specs/design-system/color-theme-manager.md)
- [Typography Style Manager Spec](../specs/design-system/typography-style-manager.md)
- [UI Design System](../specs/design-system/ui-design-system.md)

