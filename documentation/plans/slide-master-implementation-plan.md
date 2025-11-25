# Slide Master System Implementation Plan (v2)

This comprehensive plan details the implementation of the enhanced Slide Master System with full Color Theme Manager and Typography Style Manager integration, as specified in the updated specs.

---

## Principles
- **Small Incremental Steps:** Each phase should be testable independently.
- **Non-breaking:** Existing slide editing functionality must remain operational at every step.
- **Design System:** Use existing components (`Dropdown`, `NumberInput`, `IconButton`, `Flyout`, `Section`, `FillSection`) and create new ones only if necessary.
- **Validation:** Verify against the spec at each step.

---

## Previously Completed (v1)

The following phases from the original implementation are complete and provide the foundation:

- [x] **Phase 1-2:** Core data structure, rendering engine with inheritance
- [x] **Phase 3-5:** Master mode foundation, UI panel, rendering in master mode
- [x] **Phase 6-7:** Editing masters, advanced features (snapping, clipboard, placeholders)
- [x] **Phase 8:** Basic theme settings with CSS variables
- [x] **Phase 9-10:** Polish, undo/redo, hide graphics, rename, insert placeholder

---

## Current State Analysis

### What Exists
1. **Store:** `masters` object, `MasterHandlers.js`, `SET_ACTIVE_MASTER`, `SET_MODE`
2. **Initial State:** Basic master/layout structure, placeholders, basic theme settings
3. **UI:** `SlideSection.js` with layout picker, `FillSection.js` with Fill System
4. **Rendering:** Inheritance-aware rendering, CSS variable injection

### What Needs Enhancement
1. **Data Model:** Expand to full 10-color schema, full typography styles
2. **Fill System Integration:** Background inheritance via Fill System array format
3. **Theme Panels:** Color Theme Manager and Typography Style Manager as draggable panels
4. **Placeholder System:** Enhanced types, editing workflow
5. **Entry Points:** Multiple access points for theme panels

---

## Phase 11: Data Model Enhancement
**Goal:** Update schemas to match the comprehensive spec.

### 11.1 Expand Theme Color Schema
**Estimated Time:** 2-3 hours  
**Risk Level:** Medium (affects existing presentations)

**Tasks:**
1. **Update `InitialState.js`:**
   ```javascript
   themeSettings: {
     colors: {
       background1: "#FFFFFF",
       background2: "#F5F5F5",
       text1: "#333333",
       text2: "#666666",
       accent1: "#18A0FB",
       accent2: "#7B61FF",
       accent3: "#1BC47D",
       accent4: "#F24822",
       accent5: "#FFBE0B",
       accent6: "#FF006E",
       hyperlink: "#0066CC",
       followedHyperlink: "#954F72"
     },
     fonts: {
       heading: { family: "Inter", weight: "700", fallback: "system-ui, sans-serif" },
       body: { family: "Inter", weight: "400", fallback: "system-ui, sans-serif" }
     }
   }
   ```

2. **Create Migration Utility:**
   - File: `src/core/utils/StateMigration.js` (new)
   - Detect old 3-color format, migrate to 12-color format
   - Preserve existing values, add defaults for new ones

3. **Update CSS Variable Injection:**
   - File: `src/core/renderer/SlideRenderer.js`
   - Inject all 12 color variables
   - Inject font variables with fallbacks

**Validation Checklist:**
- [ ] App loads without errors with existing data
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

- [Slide Master System Spec](../specs/slide-master-system.md)
- [Color Theme Manager Spec](../specs/color-theme-manager.md)
- [Typography Style Manager Spec](../specs/typography-style-manager.md)
- [UI Design System](../specs/ui-design-system.md)

