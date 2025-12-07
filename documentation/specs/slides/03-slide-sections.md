# Slide Sections - Organization & Management

**Version:** 1.0  
**Last Updated:** December 7, 2025

## 1. Overview

Sections provide a powerful organizational layer for managing large presentations. They allow users to group related slides, collapse sections for better overview, and apply batch operations to groups of slides.

---

## 2. Section Concept

### 2.1 What is a Section?

A section is a logical grouping of slides that:
- Has a **name** (e.g., "Introduction", "Q2 Results", "Conclusion")
- Contains one or more **slides**
- Can be **collapsed** or **expanded** in thumbnail view
- Can be **rearranged** as a unit
- Supports **batch operations** on all slides within

### 2.2 Section Properties

```typescript
interface Section {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  position: number;              // 0-based index in presentation
  collapsed: boolean;            // UI state for thumbnail panel
  slideIds: string[];            // Ordered list of slide IDs
  color?: string;                // Optional color coding
  metadata?: {
    created: Date;
    modified: Date;
    notes?: string;              // Section-level notes
  };
}
```

### 2.3 Default Behavior

- **New presentations**: Start with one default section (unnamed)
- **Adding slides**: Slides added to current section
- **Section limit**: No technical limit, but UX degrades beyond 20 sections
- **Slide limit per section**: Recommended 10-20 slides per section

---

## 3. Section Visual Design

### 3.1 Section Header in Thumbnail Panel

```
┌────────────────────────────────────────────────────────────┐
│ ▼ Introduction                                    (3) ⋮    │ ← Header
├────────────────────────────────────────────────────────────┤
│  ┌──────────┐                                              │
│  │    1     │  Title Slide                                 │
│  └──────────┘                                              │
│  ┌──────────┐                                              │
│  │    2     │  Agenda                                      │
│  └──────────┘                                              │
│  ┌──────────┐                                              │
│  │    3     │  About Us                                    │
│  └──────────┘                                              │
├────────────────────────────────────────────────────────────┤
│ ▶ Main Content                                    (8) ⋮    │ ← Collapsed
└────────────────────────────────────────────────────────────┘
```

**Header Components:**
- **Chevron** (▼/▶): Expand/collapse control
- **Name**: Section title (editable inline)
- **Count**: Number of slides in parentheses
- **Menu** (⋮): Section options

**Styling:**
```css
.section-header {
  height: 36px;
  padding: var(--spacing-2) var(--spacing-3);
  background: var(--color-bg-panel);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.section-header:hover {
  background: var(--color-bg-hover);
  cursor: pointer;
}

.section-header.collapsed {
  border-bottom: 2px solid var(--color-border);
}
```

### 3.2 Section Color Coding (Optional)

```
┌────────────────────────────────────────────────────────────┐
│ █ ▼ Introduction                                  (3) ⋮    │
│   ↑ Color bar (4px wide, accent color)                     │
```

**Color Options:**
- Blue (default)
- Red
- Green
- Orange
- Purple
- Teal
- Custom hex

---

## 4. Section Operations

### 4.1 Creating Sections

**Method 1: Context Menu**
1. Right-click between slides in thumbnail panel
2. Select "Add Section"
3. Section created at cursor position
4. Name defaults to "Untitled Section"

**Method 2: Ribbon/Toolbar**
1. Click "Section" button in toolbar
2. Select "Add Section"
3. Section created before current slide

**Method 3: Keyboard Shortcut**
- **Ctrl + Shift + S**: Add section before current slide

**Dialog for New Section:**
```
┌─────────────────────────────────┐
│  Add Section                 ✕  │
├─────────────────────────────────┤
│  Name:                          │
│  [Introduction____________]     │
│                                 │
│  Color (optional):              │
│  ⬤ ⬤ ⬤ ⬤ ⬤ ⬤ [Custom]          │
│                                 │
│  [ Cancel ]  [ Create Section ] │
└─────────────────────────────────┘
```

### 4.2 Renaming Sections

**Method 1: Inline Editing**
1. Click on section name
2. Name becomes editable input
3. Press Enter to save, Esc to cancel

**Method 2: Section Menu**
1. Click section menu (⋮)
2. Select "Rename Section"
3. Opens inline editor

**Method 3: Keyboard**
1. Focus section header (Tab navigation)
2. Press F2 to rename
3. Edit and press Enter

### 4.3 Deleting Sections

**Behavior:**
- Deleting a section does NOT delete its slides
- Slides are moved to previous section
- If deleting first section, slides move to next section
- Cannot delete the last remaining section (auto-creates "Untitled")

**Confirmation Dialog:**
```
┌───────────────────────────────────────┐
│  Delete Section?                   ✕  │
├───────────────────────────────────────┤
│  Are you sure you want to delete      │
│  "Main Content"?                       │
│                                        │
│  The 8 slides in this section will    │
│  be moved to "Introduction".          │
│                                        │
│  [ Cancel ]  [ Delete Section ]       │
└───────────────────────────────────────┘
```

### 4.4 Reordering Sections

**Drag & Drop:**
1. Click and drag section header
2. Drop indicator line shows valid drop positions
3. All slides in section move with header
4. Slide numbers update automatically

**Visual Feedback:**
```
┌────────────────────────────────────────┐
│ ▼ Introduction               (3)       │
├────────────────────────────────────────┤
│ [Slides 1-3]                           │
├────────────────────────────────────────┤
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ← Drop indicator (blue, 3px)
│ ▼ Main Content               (8)       │
├────────────────────────────────────────┤
│ [Slides 4-11]                          │
└────────────────────────────────────────┘
    ↑
   Dragging "Conclusion" section here
```

### 4.5 Collapse/Expand Sections

**Interaction:**
- Click chevron (▼/▶) to toggle
- Click anywhere on header to toggle
- Double-click to expand and select first slide

**Keyboard:**
- **Arrow Right**: Expand focused section
- **Arrow Left**: Collapse focused section
- **Ctrl + Shift + E**: Expand all sections
- **Ctrl + Shift + C**: Collapse all sections

**State Persistence:**
- Collapsed state saved in presentation metadata
- Persists across sessions
- Per-user preference (in collaborative editing)

### 4.6 Moving Slides Between Sections

**Method 1: Drag & Drop**
- Drag slide(s) onto section header
- Slides inserted at end of target section

**Method 2: Context Menu**
1. Right-click slide(s)
2. Select "Move to Section" →
3. Choose target section from submenu

**Method 3: Keyboard**
1. Select slide(s)
2. Press **Ctrl + Shift + M**
3. Choose section from dialog

**Multi-Select Behavior:**
- All selected slides move together
- Original order preserved
- Slide numbers update automatically

---

## 5. Section Context Menu

Right-click on section header:

```
Rename Section                    F2
Delete Section                    Del
────────────────────────────────
Collapse This Section
Expand This Section
────────────────────────────────
Collapse All Sections          Ctrl+Shift+C
Expand All Sections            Ctrl+Shift+E
────────────────────────────────
Move Section Up                Ctrl+Shift+↑
Move Section Down              Ctrl+Shift+↓
────────────────────────────────
Select All Slides in Section   Ctrl+A
Delete All Slides in Section
Duplicate Section
────────────────────────────────
Section Color                 ▶
  ⬤ Blue
  ⬤ Red
  ⬤ Green
  ⬤ Orange
  ⬤ Purple
  ⬤ Teal
  ⬤ Custom...
────────────────────────────────
Section Properties
```

---

## 6. Section Properties Dialog

**Access:** Right-click section → "Section Properties"

```
┌───────────────────────────────────────────────┐
│  Section Properties                        ✕  │
├───────────────────────────────────────────────┤
│  Name:                                        │
│  [Main Content_____________________]          │
│                                               │
│  Color:                                       │
│  ⬤ Blue  ⬤ Red  ⬤ Green  ⬤ Orange           │
│  ⬤ Purple  ⬤ Teal  [Custom: #______]         │
│                                               │
│  Slides:                                      │
│  • 8 slides (Slides 4-11)                    │
│  • Created: Nov 15, 2025 3:42 PM             │
│  • Modified: Dec 7, 2025 10:23 AM            │
│                                               │
│  Notes (optional):                            │
│  ┌───────────────────────────────────────┐   │
│  │ This section covers Q2 financial      │   │
│  │ performance and key metrics...        │   │
│  └───────────────────────────────────────┘   │
│                                               │
│  [ Cancel ]  [ Apply ]  [ OK ]                │
└───────────────────────────────────────────────┘
```

---

## 7. Section Zoom (Future Enhancement)

### 7.1 Concept

Section Zoom creates a dynamic "hub" slide that shows thumbnails of all sections. Clicking a section thumbnail jumps to that section.

**Example Use Case:**
- Create agenda slide
- Add section zoom links
- During presentation, click section to jump
- Return to agenda automatically

### 7.2 Visual Design

```
┌────────────────────────────────────────────────────┐
│                   Agenda                           │
│                                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │          │  │          │  │          │        │
│  │ Intro    │  │ Main     │  │ Conclusion│       │
│  │ (3)      │  │ (8)      │  │ (2)      │        │
│  └──────────┘  └──────────┘  └──────────┘        │
│                                                    │
└────────────────────────────────────────────────────┘
        ↑              ↑              ↑
   Click to jump to section (during presentation)
```

---

## 8. Section Navigation in Presentation Mode

### 8.1 Section Menu

**Access:** Press "S" during presentation or click section button in HUD

```
┌─────────────────────────────────────┐
│  Jump to Section                 ✕  │
├─────────────────────────────────────┤
│  ▶ Introduction            (3)      │ ← Highlights current section
│  □ Main Content            (8)      │
│  □ Case Studies            (5)      │
│  □ Conclusion              (2)      │
└─────────────────────────────────────┘
```

**Interaction:**
- Arrow keys to navigate
- Enter to jump to first slide of section
- Numbers (1-9) for quick jump
- Escape to close

### 8.2 Section Indicator in HUD

```
┌────────────────────────────────────────────────────────────┐
│  ◀  ▶  ⏸  [Slide 5 of 12]  Main Content (3/8)    ⚙  ✕    │
│                              └──────┬────────┘              │
│                            Section name (position/total)    │
└────────────────────────────────────────────────────────────┘
```

---

## 9. Slide Sorter with Sections

### 9.1 Grid Layout with Section Breaks

```
┌────────────────────────────────────────────────────────────┐
│  ▼ Introduction                                   (3) ⋮    │
├────────────────────────────────────────────────────────────┤
│  ┌────┐  ┌────┐  ┌────┐                                   │
│  │ 1  │  │ 2  │  │ 3  │                                   │
│  └────┘  └────┘  └────┘                                   │
├────────────────────────────────────────────────────────────┤
│  ▼ Main Content                                   (8) ⋮    │
├────────────────────────────────────────────────────────────┤
│  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐                 │
│  │ 4  │  │ 5  │  │ 6  │  │ 7  │  │ 8  │                 │
│  └────┘  └────┘  └────┘  └────┘  └────┘                 │
│  ┌────┐  ┌────┐  ┌────┐                                   │
│  │ 9  │  │ 10 │  │ 11 │                                   │
│  └────┘  └────┘  └────┘                                   │
├────────────────────────────────────────────────────────────┤
│  ▼ Conclusion                                     (2) ⋮    │
├────────────────────────────────────────────────────────────┤
│  ┌────┐  ┌────┐                                           │
│  │ 12 │  │ 13 │                                           │
│  └────┘  └────┘                                           │
└────────────────────────────────────────────────────────────┘
```

### 9.2 Section Filtering

**Filter Controls:**
```
[All Sections ▼]  [🔍 Search sections...]  [⚙ Section options]
```

**Filter Menu:**
- Show All Sections (default)
- Show Current Section Only
- Show Selected Sections... (multi-select)
- Hide Empty Sections

---

## 10. Section Templates & Presets

### 10.1 Common Section Structures

**Business Presentation:**
1. Introduction (1-2 slides)
2. Agenda (1 slide)
3. Main Content (10-15 slides)
4. Case Studies (3-5 slides)
5. Call to Action (1-2 slides)
6. Q&A (1 slide)

**Academic Lecture:**
1. Title & Overview (1-2 slides)
2. Learning Objectives (1 slide)
3. Key Concepts (8-12 slides)
4. Examples (4-6 slides)
5. Summary (1-2 slides)
6. Assessment (1-2 slides)

**Product Pitch:**
1. Problem Statement (2-3 slides)
2. Solution Overview (3-4 slides)
3. Product Demo (5-8 slides)
4. Market Analysis (3-4 slides)
5. Business Model (2-3 slides)
6. Team & Traction (2-3 slides)
7. Ask & Timeline (1-2 slides)

### 10.2 Section Templates UI

**Access:** File → New → From Template

```
┌───────────────────────────────────────────────┐
│  Choose Presentation Template             ✕  │
├───────────────────────────────────────────────┤
│  [Business]  [Academic]  [Pitch]  [Custom]   │
├───────────────────────────────────────────────┤
│  Business Presentation                        │
│  ┌─────────────────────────────────────────┐ │
│  │ ✓ Introduction (2 slides)               │ │
│  │ ✓ Agenda (1 slide)                      │ │
│  │ ✓ Main Content (10 slides)              │ │
│  │ □ Case Studies (5 slides)               │ │
│  │ ✓ Call to Action (2 slides)             │ │
│  │ □ Q&A (1 slide)                         │ │
│  └─────────────────────────────────────────┘ │
│                                               │
│  [ Cancel ]  [ Create Presentation ]          │
└───────────────────────────────────────────────┘
```

---

## 11. Data Model & Implementation

### 11.1 Storage Structure

```typescript
interface Presentation {
  id: string;
  sections: Section[];
  slides: Slide[];
  sectionOrder: string[];  // Ordered array of section IDs
}

interface Section {
  id: string;
  name: string;
  position: number;
  collapsed: boolean;
  color?: SectionColor;
  metadata: {
    created: Date;
    modified: Date;
    notes?: string;
  };
}

interface Slide {
  id: string;
  sectionId: string;  // Parent section
  position: number;   // Position within section
  // ... other slide properties
}
```

### 11.2 Section Management API

```javascript
class SectionManager {
  constructor(presentation) {
    this.presentation = presentation;
    this.sections = new Map();
  }
  
  createSection(name, position, slideIds = []) {
    const section = {
      id: generateId(),
      name,
      position,
      collapsed: false,
      slideIds,
      metadata: {
        created: new Date(),
        modified: new Date()
      }
    };
    
    this.sections.set(section.id, section);
    this.reorderSlides();
    return section;
  }
  
  deleteSection(sectionId) {
    const section = this.sections.get(sectionId);
    if (!section) return;
    
    // Move slides to adjacent section
    const targetSection = this.getAdjacentSection(sectionId);
    section.slideIds.forEach(slideId => {
      targetSection.slideIds.push(slideId);
      this.updateSlide(slideId, { sectionId: targetSection.id });
    });
    
    this.sections.delete(sectionId);
    this.reorderSlides();
  }
  
  moveSlideToSection(slideId, targetSectionId) {
    const slide = this.getSlide(slideId);
    const oldSection = this.sections.get(slide.sectionId);
    const newSection = this.sections.get(targetSectionId);
    
    // Remove from old section
    oldSection.slideIds = oldSection.slideIds.filter(id => id !== slideId);
    
    // Add to new section
    newSection.slideIds.push(slideId);
    slide.sectionId = targetSectionId;
    
    this.reorderSlides();
  }
  
  reorderSlides() {
    let globalPosition = 0;
    
    this.sections.forEach(section => {
      section.slideIds.forEach(slideId => {
        const slide = this.getSlide(slideId);
        slide.position = globalPosition++;
      });
    });
  }
  
  collapseSection(sectionId, collapsed = true) {
    const section = this.sections.get(sectionId);
    if (section) {
      section.collapsed = collapsed;
      this.emit('section-collapsed', { sectionId, collapsed });
    }
  }
  
  getSectionBySlideId(slideId) {
    const slide = this.getSlide(slideId);
    return this.sections.get(slide.sectionId);
  }
}
```

---

## 12. Performance Considerations

### 12.1 Large Presentations

**Optimization for 100+ slides:**
- Virtual scrolling in thumbnail panel
- Lazy thumbnail rendering
- Section-level caching
- Progressive loading of collapsed sections

### 12.2 Collapsed Section Rendering

**Strategy:**
```javascript
renderSection(section) {
  if (section.collapsed) {
    return `<div class="section-header collapsed">
      ${section.name} (${section.slideIds.length})
    </div>`;
  }
  
  // Full render only when expanded
  return `<div class="section-expanded">
    <div class="section-header">${section.name}</div>
    ${section.slideIds.map(renderThumbnail).join('')}
  </div>`;
}
```

---

## 13. Accessibility

### 13.1 Keyboard Navigation

| Key | Action |
|-----|--------|
| **Tab** | Focus next section |
| **Shift+Tab** | Focus previous section |
| **Space** | Toggle expand/collapse |
| **Enter** | Select first slide in section |
| **F2** | Rename focused section |
| **Delete** | Delete focused section |

### 13.2 Screen Reader Support

```html
<div role="tree" aria-label="Presentation sections">
  <div 
    role="treeitem" 
    aria-level="1"
    aria-expanded="true"
    aria-label="Introduction section, 3 slides">
    
    <div role="group" aria-label="Slides in Introduction">
      <div role="treeitem" aria-level="2" aria-label="Slide 1: Title">
        <!-- Slide 1 thumbnail -->
      </div>
      <!-- More slides -->
    </div>
  </div>
</div>
```

---

## 14. Future Enhancements

### 14.1 Section-Level Features

- **Section Transitions**: Apply transition to entire section
- **Section Themes**: Override master theme per section
- **Section Templates**: Save/load section structures
- **Section Analytics**: Track time spent in each section (presentation mode)
- **Section Export**: Export individual sections as separate presentations

### 14.2 Advanced Organization

- **Nested Sections**: Sub-sections within sections (max 2 levels)
- **Section Tags**: Tag sections for filtering/search
- **Section Links**: Create hyperlinks between sections
- **Section Variants**: A/B versions of same section
- **Section Lock**: Prevent accidental changes to sections

---

**Next**: See [04-slide-operations.md](./04-slide-operations.md) for detailed slide editing operations.
