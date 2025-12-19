# Property Inspector - Slide & Master Section

> **Part of:** [Property Inspector Specification v2.0](./00-overview.md)  
> **Implementation:** `src/ui/properties/SlideSection.js`, `src/ui/properties/PlaceholderSection.js`  
> **Uses:** `Section`, `Button` (xs, primary, secondary), `Dropdown`, `ColorInput`, `NumberInput`  
> **DO NOT** create custom layout cards, buttons, or selectors. Use design system components with variants.

---

## 1. Overview

The Slide section displays slide-level properties when no elements are selected on the canvas. The content varies based on editor mode (Slide mode vs. Master mode) and includes layout selection, theme configuration, and background controls.

### Display Condition
- **Shown when:** No element is selected (selection is empty)
- **Mode-dependent:** Different UI for Slide mode vs. Master mode

### Multi-Selection & Mixed State

This section does **not** participate in element multi-selection semantics from [17-multi-selection-and-mixed-state.md](./17-multi-selection-and-mixed-state.md) because it is only shown when the canvas element selection is empty.

- **Baseline/Target:** Not applicable for element multi-selection.
- If Story later supports selecting multiple slides/masters at once, this spec MUST be updated to define mixed display + edit semantics for slide/master properties.

---

## 2. Mode-Specific Layout

### 2.1 Slide Mode (Normal Editing)

```
┌─────────────────────────────────────────────────────────────────┐
│  Slide                                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Layout                                                      ▼  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  [     Title Slide               ▾]                       │ │
│  └───────────────────────────────────────────────────────────┘ │
│  W [  1920  ]   H [  1080  ]                                   │
│                                                                 │
│  Colors                                                      ▼  │
│  🎨 Default Theme    [■■■■■■]    Inherited   [✏️]              │
│                                                                 │
│  Typography                                                  ▼  │
│  Aa Inter / Inter                Inherited   [→]               │
│                                                                 │
│  Background                                              [+] ▼  │
│  [■] #FFFFFF  100%                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Master Mode (Layout Editing)

```
┌─────────────────────────────────────────────────────────────────┐
│  Master                                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [     Master Layout Name        ]         <- Name Input       │
│                                                                 │
│  Template                                                    ▼  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  [     Corporate Template        ▾]                       │ │
│  └───────────────────────────────────────────────────────────┘ │
│  This layout inherits from the Corporate theme template.       │
│                                                                 │
│  Colors                                                      ▼  │
│  🎨 Brand Colors     [■■■■■■]    Override    [✏️] [↺]         │
│                                                                 │
│  Typography                                                  ▼  │
│  Aa Roboto / Open Sans           Override    [→] [↺]          │
│                                                                 │
│  Background                                              [+] ▼  │
│  [■] Inherited                               Inherited        │
│                                                                 │
│  Placeholders                                                ▼  │
│  [H1][H2][¶][T][🖼][▶]                      <- Placeholder Grid │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Layout Section

### 3.1 Layout Picker Button

Triggers a flyout showing available layouts:

```
┌─────────────────────────────────────────────────────────────────┐
│  Select Layout                                            [×]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                              │
│  │Title│ │Title│ │ Two │ │Blank│                              │
│  │Slide│ │+Body│ │ Col │ │     │                              │
│  └─────┘ └─────┘ └─────┘ └─────┘                              │
│   Title   Title   Section  Blank                               │
│   Slide   + Body  Header                                       │
│                                                                 │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                              │
│  │Image│ │Quote│ │Chart│ │ ... │                              │
│  │Focus│ │     │ │     │ │     │                              │
│  └─────┘ └─────┘ └─────┘ └─────┘                              │
│   Image   Quote   Chart    More                                │
│   Focus                                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Layout Thumbnails

Each layout shows:
- Mini preview of placeholder arrangement
- Layout name below thumbnail
- Selected state (highlight border)

### 3.3 Dimension Inputs

| Input | Purpose | Behavior |
|-------|---------|----------|
| W | Slide width | Changes canvas width |
| H | Slide height | Changes canvas height |

**Note:** Changing dimensions affects all slides in the presentation.

---

## 4. Name Row (Master Mode)

### 4.1 Specification

| Property | Value |
|----------|-------|
| Type | Text Input |
| Placeholder | "Layout Name" |
| Location | Top of section (not in a collapsible section) |

### 4.2 Behavior

- Editable name for the master layout
- Changes propagate to layout picker
- Auto-save on blur or Enter

---

## 5. Template/Preset Section (Master Mode)

### 5.1 Purpose

Allows selecting a base template that the master layout inherits from.

### 5.2 Template Picker

Similar to layout picker, shows available templates:
- Corporate
- Creative
- Minimal
- Custom templates

### 5.3 Description Text

Shows inheritance relationship:
> "This layout inherits from the Corporate theme template."

---

## 6. Colors Section

### 6.1 Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Colors                                                      ▼  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🎨 Theme Name       [■■■■■■]         Badge   [✏️] [↺]         │
│     ^Icon            ^Swatches        ^State  ^Edit ^Reset     │
│                                                                 │
│  Source: Master Layout                        <- Source Row    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Theme Swatches

Display 8 color swatches showing current theme palette:
- Size: 16×16px each
- Show accent and neutral colors
- Click opens Color Theme Manager panel

### 6.3 Inheritance Badge

| Badge | Meaning |
|-------|---------|
| Inherited | Using parent theme (no override) |
| Override | Local theme applied |
| (none) | Root level / no inheritance |

### 6.4 Actions

| Button | Action |
|--------|--------|
| Edit (✏️) | Open Color Theme Manager panel |
| Reset (↺) | Clear override, revert to inherited |

### 6.5 Source Row

Shows where the theme comes from:
- "Source: Theme Master"
- "Source: Layout: Title Slide"
- "Source: Presentation default"

---

## 7. Typography Section

### 7.1 Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Typography                                                  ▼  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Aa Heading Font / Body Font     Badge   [→] [↺]               │
│     ^Preview                     ^State  ^Go ^Reset            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Font Preview

Shows heading and body font names:
- Format: "Heading Font / Body Font"
- Example: "Inter / Inter", "Roboto / Open Sans"

### 7.3 Actions

| Button | Action |
|--------|--------|
| Go (→) | Open Typography Style Manager panel |
| Reset (↺) | Clear override, revert to inherited |

---

## 8. Background Section

### 8.1 Reuse of Fill Section

The background uses the same FillSection component with custom configuration:

```javascript
this.fillSection = new FillSection({
    title: 'Background',
    manualVisibility: true,
    contextKey: 'fill.slide',
    getElement: (selection) => currentSlide,
    onUpdate: (fills, isTransient) => this.updateBackground(fills, isTransient)
});
```

**Note:** Background editing targets a single slide/master object at a time. It reuses FillSection UI, but it is not an element multi-selection list editor.

### 8.2 Inherited Background

For slides using layout background:

```
┌─────────────────────────────────────────────────────────────────┐
│  [■] Solid           Inherited                                  │
│   ^Swatch  ^Type     ^Badge (read-only)                        │
└─────────────────────────────────────────────────────────────────┘
```

### 8.3 Override Behavior

- Adding a fill creates an override
- Removing all fills reverts to inherited

---

## 9. Placeholder Section (Master Mode Only)

### 9.1 Overview

Displays a palette of placeholder types that can be added to master layouts.

### 9.2 Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Placeholders                                                ▼  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────┐ ┌─────┐ ┌─────┐                                      │
│  │ H1  │ │ H2  │ │  ¶  │                                      │
│  │Title│ │ Sub │ │Body │                                      │
│  └─────┘ └─────┘ └─────┘                                      │
│   Title  Subtitle Content                                      │
│                                                                 │
│  ┌─────┐ ┌─────┐ ┌─────┐                                      │
│  │  T  │ │ 🖼  │ │  ▶  │                                      │
│  │Text │ │ Pic │ │Media│                                      │
│  └─────┘ └─────┘ └─────┘                                      │
│   Text   Picture  Media                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 9.3 Placeholder Types

| Type | Icon | Max Count | Description |
|------|------|-----------|-------------|
| Title | H1 | 1 | Main slide title |
| Subtitle | H2 | 1 | Slide subtitle |
| Content/Body | ¶ | 1 | Main content area |
| Text | T | ∞ | Generic text box |
| Picture | 🖼 | ∞ | Image placeholder |
| Media | ▶ | ∞ | Video/audio placeholder |

### 9.4 Interaction Model

| Action | Behavior |
|--------|----------|
| Click | Add placeholder at default position |
| Drag to canvas | Add at drop location |

### 9.5 Disabled State

Limited placeholders (Title, Subtitle, Content) are disabled after being placed:
- Dimmed appearance
- Checkmark overlay
- Not draggable

### 9.6 Count Badge

Unlimited placeholders show count when multiple exist:
- Small badge in corner
- Example: "2" for two Picture placeholders

---

## 10. Light/Dark Mode Toggle

### 10.1 Location

Within Colors section or as separate control:

```
┌─────────────────────────────────────────────────────────────────┐
│  Mode:   [☀️ Light]  [🌙 Dark]                                  │
│              ●          ○                                       │
└─────────────────────────────────────────────────────────────────┘
```

### 10.2 Behavior

Toggles presentation color mode:
- Shadow slots ↔ Highlight slots mapping
- All theme-linked colors update
- Persisted with presentation

---

## 11. Data Flow

### 11.1 Slide Mode Reading

```javascript
update(selection) {
    const state = store.getState();
    const slide = state.slides[state.editor.activeSlideId];
    
    // Layout
    this.layoutSelect.setValue(slide.layoutId);
    
    // Dimensions (from presentation settings)
    this.wInput.setValue(state.presentation.width);
    this.hInput.setValue(state.presentation.height);
    
    // Theme (cascade resolution)
    const resolvedTheme = StyleResolver.resolveTheme(slide);
    this.updateThemeDisplay(resolvedTheme);
    
    // Background
    this.fillSection.update([slide]);
}
```

### 11.2 Master Mode Reading

```javascript
update(selection) {
    const state = store.getState();
    const master = state.slideMasterPresets[state.editor.activeMasterId];
    
    // Name
    this.nameInput.setValue(master.name);
    
    // Template
    this.presetSelect.setValue(master.presetId);
    
    // Colors/Typography with inheritance
    const resolved = StyleResolver.resolveStyleAssignments(master);
    this.updateStyleDisplay(resolved);
    
    // Placeholders
    this.placeholderSection.update([]);
}
```

---

## 12. CSS Specifications

### 12.1 Slide Properties Container

```css
.slide-properties {
    display: flex;
    flex-direction: column;
    gap: 0; /* Sections have their own margins */
}

.slide-properties .pi-row {
    padding: 0 8px;
}
```

### 12.2 Layout Picker

```css
.layout-picker-row {
    margin-bottom: var(--pi-spacing-row);
}

.layout-trigger-btn {
    width: 100%;
    text-align: left;
    justify-content: flex-start;
}
```

### 12.3 Theme Row

```css
.theme-detail-header {
    display: flex;
    align-items: center;
    gap: 8px;
}

.theme-detail-name {
    flex: 1;
    font-weight: 500;
}

.theme-detail-badge {
    font-size: 11px;
    color: var(--color-text-secondary);
    padding: 2px 6px;
    background: var(--color-bg-tertiary);
    border-radius: 4px;
}
```

### 12.4 Placeholder Grid

```css
.placeholder-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
}

.placeholder-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 8px;
    background: var(--color-bg-secondary);
    border-radius: 8px;
    cursor: pointer;
}

.placeholder-item.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.placeholder-item .placeholder-checkmark {
    position: absolute;
    top: 4px;
    right: 4px;
    color: var(--color-success);
}
```

---

## 13. Industry Benchmark Comparison

| Feature | Story | Figma | Sketch | Keynote | PowerPoint |
|---------|-------|-------|--------|---------|------------|
| Layout Picker | ✅ | N/A | N/A | ✅ | ✅ |
| Slide Dimensions | ✅ | ✅ (Frame) | ✅ (Artboard) | ✅ | ✅ |
| Theme Colors | ✅ | ✅ (Variables) | ✅ | ✅ | ✅ |
| Master Layouts | ✅ | ❌ | ❌ | ✅ | ✅ |
| Placeholder System | ✅ | ❌ | ❌ | ✅ | ✅ |
| Light/Dark Mode | ✅ | ✅ (Modes) | ❌ | ❌ | ❌ |
| Background Inheritance | ✅ | ❌ | ❌ | ✅ | ✅ |

---

## 14. Accessibility (ARIA)

### 14.1 ARIA Attributes by Control

| Control | Role | ARIA Attributes | Notes |
|---------|------|-----------------|-------|
| Layout Picker | `button` | `aria-label="Select layout: Title Slide"`, `aria-haspopup="dialog"` | Dynamic current layout |
| Layout Grid | `listbox` | `aria-label="Available layouts"` | In flyout |
| Layout Option | `option` | `aria-label="Title Slide"`, `aria-selected` | Grid item |
| Width Input | `spinbutton` | `aria-label="Slide width"`, `aria-valuenow` | Pixels |
| Height Input | `spinbutton` | `aria-label="Slide height"`, `aria-valuenow` | Pixels |
| Theme Dropdown | `combobox` | `aria-label="Color theme"`, `aria-expanded`, `aria-haspopup="listbox"` | Theme selection |
| Theme Edit | `button` | `aria-label="Edit theme colors"` | Opens editor |
| Theme Reset | `button` | `aria-label="Reset to inherited theme"` | Master mode |
| Typography Dropdown | `combobox` | `aria-label="Typography theme"`, `aria-expanded` | Font selection |
| Typography Navigate | `button` | `aria-label="Go to typography settings"` | Navigation |
| Background Add | `button` | `aria-label="Add background fill"` | Adds fill |
| Placeholder Item | `button` | `aria-label="Add Title placeholder"`, `aria-disabled` | When maxed |
| Inheritance Badge | `status` | `aria-label="Inherited from master"` | Visual indicator |

### 14.2 Section Container

```html
<section 
  aria-labelledby="slide-section-heading"
  class="pi-section"
>
  <h3 id="slide-section-heading" class="pi-section-header">Slide</h3>
  
  <!-- Layout Subsection -->
  <div role="region" aria-labelledby="layout-heading">
    <h4 id="layout-heading">Layout</h4>
    <button 
      aria-label="Select layout: Title Slide"
      aria-haspopup="dialog"
      aria-expanded="false"
    >
      Title Slide
    </button>
  </div>
  
  <!-- Colors Subsection -->
  <div role="region" aria-labelledby="colors-heading">
    <h4 id="colors-heading">Colors</h4>
    <!-- Theme controls -->
  </div>
</section>
```

### 14.3 Layout Picker Flyout

```html
<div 
  role="dialog"
  aria-label="Select Layout"
  aria-modal="true"
>
  <div role="listbox" aria-label="Available layouts">
    <div 
      role="option" 
      aria-selected="true"
      aria-label="Title Slide"
      tabindex="0"
    >
      <img src="..." alt="" aria-hidden="true" />
      <span>Title Slide</span>
    </div>
    <div 
      role="option" 
      aria-selected="false"
      aria-label="Title and Body"
      tabindex="-1"
    >
      <img src="..." alt="" aria-hidden="true" />
      <span>Title + Body</span>
    </div>
  </div>
</div>
```

### 14.4 Placeholder Grid Accessibility

```html
<div role="group" aria-label="Add placeholders to layout">
  <button 
    aria-label="Add Title placeholder. 0 of 1 used."
    aria-disabled="false"
  >
    <span aria-hidden="true">H1</span>
  </button>
  <button 
    aria-label="Add Body placeholder. 1 of 1 used. Maximum reached."
    aria-disabled="true"
    disabled
  >
    <span aria-hidden="true">¶</span>
    <span class="checkmark" aria-hidden="true">✓</span>
  </button>
</div>
```

### 14.5 Inheritance Status

```html
<span 
  role="status" 
  aria-live="polite"
  class="theme-detail-badge"
>
  Inherited from Corporate Template
</span>
```

### 14.6 Keyboard Navigation

| Key | Behavior |
|-----|----------|
| Tab | Move between sections and controls |
| Enter/Space | Open flyout, select layout |
| Arrow Keys | Navigate layout grid |
| Escape | Close flyout |
| Home/End | First/last layout in grid |

### 14.7 Screen Reader Announcements

- **Layout changed:** "Layout changed to Title and Body"
- **Theme applied:** "Corporate Colors theme applied"
- **Theme inherited:** "Theme inherited from master layout"
- **Placeholder added:** "Title placeholder added to layout"
- **Placeholder maxed:** "Maximum body placeholders reached"
- **Background change:** "Background color changed to #FFFFFF"

### 14.8 Mode Context

Announce mode context for clarity:

```html
<div role="banner" aria-live="polite">
  Currently editing: Master Layout "Title Slide"
</div>
```

---

## 15. Future Enhancements

### 15.1 Planned
- [ ] **Slide notes section:** Add presenter notes
- [ ] **Transition settings:** Slide transition configuration

### 15.2 Considered
- [ ] **Slide timing:** Duration for auto-advance
- [ ] **Animation overview:** List of animations on slide
- [ ] **Accessibility checker:** Alt text, contrast warnings

---

## Next Section: [11 - Placeholder Section](./11-placeholder-section.md)
