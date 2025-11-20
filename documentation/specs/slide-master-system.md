# Slide Master & Layout System Specification

## 1. Overview
The Slide Master system introduces a hierarchical templating engine to Story. It allows users to define global styles, layouts, and recurring elements (logos, footers) once, and have them propagate to all associated slides.

### Terminology
1.  **Theme Master (Root):** The top-level template. Defines the global background, default fonts, color palette, and elements common to *all* layouts (e.g., a company logo in the corner).
2.  **Layout Master (Child):** Inherits from the Theme Master. Defines specific content arrangements (e.g., "Title Slide", "Two Column", "Blank"). It can add its own elements and override properties from the Theme Master.
3.  **Slide (Instance):** The actual content slide. It is assigned a specific **Layout Master**. It inherits everything from the Layout (and thus the Theme) but holds the actual user content.

## 2. Data Model & Schema

### 2.1 Store Structure Updates
We need to add a `masters` collection to the global store.

```javascript
const State = {
  // ... existing state
  masters: {
    "theme-1": {
      id: "theme-1",
      type: "theme",
      name: "Modern Dark",
      background: { type: "solid", value: "#1E1E1E" },
      elements: { "el-logo": { ... } },
      elementOrder: ["el-logo"],
      themeSettings: { // Global design tokens
        colors: {
          accent: "#18A0FB",
          textPrimary: "#FFFFFF",
          textSecondary: "#AAAAAA"
        },
        fonts: { heading: "Inter", body: "Roboto" }
      }
    },
    "layout-1-title": {
      id: "layout-1-title",
      type: "layout",
      parentId: "theme-1", // Inheritance link
      name: "Title Slide",
      background: null, // null = inherit from parent
      hideBackgroundGraphics: false, // If true, hides Theme Master elements
      elements: { "el-title-placeholder": { ... } },
      elementOrder: ["el-title-placeholder"]
    }
  },
  slides: {
    "slide-1": {
      id: "slide-1",
      layoutId: "layout-1-title", // Link to Layout
      hideBackgroundGraphics: false, // If true, hides Layout/Theme elements
      // ... existing slide properties
    }
  }
};
```

### 2.2 Inheritance Logic
Properties are resolved in a cascading manner (bottom-up for overrides, top-down for rendering):

**Property Resolution (e.g., Background):**
1.  Does **Slide** have a specific background set? -> Use it.
2.  Else, does **Layout** have a background? -> Use it.
3.  Else, does **Theme Master** have a background? -> Use it.
4.  Else -> Default White/Black.

**Element Rendering Order (Z-Index):**
1.  **Theme Master Elements** (Bottom) - *Unless `hideBackgroundGraphics` is true on Layout/Slide*
2.  **Layout Master Elements** - *Unless `hideBackgroundGraphics` is true on Slide*
3.  **Slide Elements** (Top)

## 3. Placeholders System
Placeholders are special elements defined on Masters/Layouts that define *where* content should go on the child slide.

### 3.1 Placeholder Element Type
```javascript
const PlaceholderElement = {
  type: "placeholder",
  placeholderType: "title", // 'title', 'body', 'image', 'chart'
  mappingId: "title-1", // Critical for remapping content when switching layouts
  prompt: "Click to add title",
  style: { ... } // Default styling for the text/content
};
```

### 3.2 Interaction
- On the **Master View**, placeholders are editable rectangles.
- On the **Slide View**, placeholders appear as dotted-line zones.
- Clicking a placeholder on a Slide converts it into a real element (Text/Image) linked to that placeholder.
- **Content Remapping:** When switching layouts, the system looks for a placeholder with the same `mappingId` (or `placeholderType` as fallback) to transfer content.

## 4. User Experience (UX)

### 4.1 Accessing Master View
- **Entry:** `View > Slide Master` menu item or a button in the bottom status bar.
- **Exit:** "Close Master View" button in the toolbar (prominent).

### 4.2 The Master View Interface
When in Master Mode:
1.  **Sidebar (Left):**
    - Replaces the normal Slide List.
    - Displays a tree structure:
        - **Theme Master (Large Thumbnail)**
            - └ Layout 1 (Small Thumbnail)
            - └ Layout 2
            - └ Layout 3
    - **Actions:** Add Layout, Duplicate Layout, Rename, Delete.
    - **Safety:** Cannot delete a Layout if it is currently used by slides (show warning).
2.  **Canvas (Center):**
    - Edits the selected Master/Layout.
    - Visual indicator (watermark or border) showing "Editing Master: [Name]".
3.  **Property Inspector (Right):**
    - **Theme Selected:** Edit global background, theme colors, fonts.
    - **Layout Selected:** Edit layout name, background (override), toggle "Hide Background Graphics".
    - **Element Selected:** Standard element properties + "Placeholder" settings.

### 4.3 Applying Layouts
In Normal View:
- Select a slide.
- Property Inspector shows a "Layout" dropdown (with visual previews if possible).
- Changing layout attempts to remap content:
    - "Title" placeholder content -> New "Title" placeholder.
    - "Body" -> "Body".
    - Unmapped content remains as a standard element on the slide.

## 5. UI Design Implications

### 5.1 Visual Hierarchy
- **Master Slides** in the sidebar should look distinct (maybe slightly larger or indented).
- **Inheritance Visualization:** When editing a Layout, elements inherited from the Theme Master should be visible but **locked/dimmed** (or unselectable) to indicate they belong to the parent. To edit them, the user must select the Theme Master.

### 5.2 Property Inspector Updates
- **Slide Context:** Needs a "Layout" selector section.
- **Master Context:** Needs "Rename Master", "Preserve Master" options.

## 6. Technical Implications & Risks

### 6.1 Rendering Pipeline (`SlideRenderer.js`)
- **Current:** Iterates `slide.elements`.
- **New:** Must iterate `theme.elements` -> `layout.elements` -> `slide.elements`.
- **Theme Variable Injection:** The renderer should inject CSS variables (e.g., `--theme-accent`) into the slide container based on the active Theme Master's settings. This allows elements to use `var(--theme-accent)` and update dynamically.
- **Risk:** Performance hit if we naively merge arrays every frame.
- **Mitigation:** Cache the "composed background layer" (Theme + Layout) since it rarely changes.

### 6.2 Selection Manager (`SelectionManager.js`)
- Must ensure users cannot select/drag Master elements while in Normal View.
- Must ensure users cannot select Theme elements while in Layout View (unless we allow "hiding" them).

### 6.3 Z-Index & Stacking
- Master elements are always behind Slide elements.
- We cannot easily interleave them (e.g., a Slide element *between* two Master elements) without breaking the model. This is a standard limitation in presentation software.

## 7. Implementation Plan

### Phase 1: Data Structure & Store (Days 1-2)
1.  Update `Store.js` to include `masters` state.
2.  Create default "Theme" and "Layouts" (Title, Title & Body, Blank) on app initialization.
3.  **Migration:** Write a utility to migrate existing slides (assign them to "Blank" or "Title" layout based on heuristics).
4.  Implement `getEffectiveSlide(slideId)` selector that merges the hierarchy for the renderer.

### Phase 2: Rendering Engine Update (Days 3-4)
1.  Refactor `SlideRenderer.js` to accept a composed stack of elements.
2.  Implement the "Background Layer" rendering (Theme + Layout).
3.  Implement **CSS Variable Injection** for theme colors.
4.  Ensure `CodeRunner` and other effects work on Master backgrounds.

### Phase 3: Master View UI (Days 5-7)
1.  Create `MasterSlideList` component (Tree view).
2.  Implement "Master Mode" toggle in `Editor` state.
3.  Update `PropertyInspector` to handle Master/Layout selection.
4.  Implement "Insert Placeholder" tool.

### Phase 4: Layout Application & Remapping (Days 8-9)
1.  Implement "Change Layout" logic in Store.
2.  Implement basic content remapping (Title -> Title).
3.  Implement "Hide Background Graphics" toggle logic.

### Phase 5: Polish & Optimization (Day 10)
1.  Visual polish of the Master View.
2.  Performance testing (caching background layers).
3.  Dark mode verification.
4.  **Undo/Redo:** Ensure Master edits are captured in the history stack.
