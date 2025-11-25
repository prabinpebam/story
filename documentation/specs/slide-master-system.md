# Slide Master & Layout System Specification

## 1. Overview

The Slide Master system provides a hierarchical templating engine inspired by Microsoft PowerPoint. It enables users to define consistent visual identity, reusable layouts, and global design changes that automatically propagate to all associated slides.

### 1.1 Core Benefits
- **Consistency**: Ensure uniform branding across all slides
- **Efficiency**: Make global changes in one place, affecting all slides
- **Flexibility**: Create multiple layouts for different content types
- **Professionalism**: Maintain design standards throughout presentations

### 1.2 Terminology

| Term | Definition |
|------|------------|
| **Slide Master** | The top-level template that controls the overall theme. Defines the default background, color scheme, fonts, and elements that appear on ALL slides (e.g., logo, footer). Every presentation has at least one Slide Master. |
| **Layout Master** | A child template that inherits from a Slide Master. Defines specific content arrangements (e.g., "Title Slide", "Title and Content", "Two Column"). Each Layout belongs to exactly one Slide Master. |
| **Placeholder** | A special container element on a Layout that defines where specific content types should go. Users fill placeholders with actual content on slides. |
| **Slide** | An individual page in the presentation. Each slide is assigned to a specific Layout Master and inherits its structure. |

### 1.3 Hierarchy Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      SLIDE MASTER                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  • Background (gradient, image, solid, pattern)     │   │
│  │  • Color Scheme (accent, text, hyperlink colors)    │   │
│  │  • Font Scheme (heading font, body font)            │   │
│  │  • Master Elements (logo, footer, page numbers)     │   │
│  │  • Default text styles (Title, Body, etc.)          │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                │
│              ┌─────────────┼─────────────┐                  │
│              ▼             ▼             ▼                  │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐     │
│  │ Title Layout  │ │ Content Layout│ │ Two Column    │     │
│  │               │ │               │ │ Layout        │     │
│  │ • Title PH    │ │ • Title PH    │ │ • Title PH    │     │
│  │ • Subtitle PH │ │ • Content PH  │ │ • Left PH     │     │
│  │               │ │               │ │ • Right PH    │     │
│  └───────┬───────┘ └───────┬───────┘ └───────┬───────┘     │
│          │                 │                 │              │
└──────────┼─────────────────┼─────────────────┼──────────────┘
           ▼                 ▼                 ▼
    ┌────────────┐    ┌────────────┐    ┌────────────┐
    │  Slide 1   │    │  Slide 2   │    │  Slide 5   │
    │ (Title)    │    │ (Content)  │    │ (Two Col)  │
    └────────────┘    └────────────┘    └────────────┘
```

---

## 2. Slide Master

### 2.1 Definition
The Slide Master is the top-level template that controls the overall look of the presentation. Changes made to the Slide Master affect ALL slides that use any of its associated Layouts.

### 2.2 Slide Master Elements

#### Background (Using Fill System)
The Slide Master background uses the same **Fill System** as all other elements in the app. This provides consistency and access to all fill types:

- **Solid Color**: Single color fill
- **Gradient**: Linear, radial, or custom gradient fills  
- **Image**: Background image with positioning and scaling options
- **Code**: Programmable backgrounds using Canvas/WebGL
- **Video** (Future): Looping background video

The Fill System supports multiple stacked fills with individual opacity and visibility controls.

**Inheritance Behavior:**
- **No Fill (Empty)**: When a Slide Master has no fill defined, it defaults to white (#FFFFFF)
- The Slide Master background is the "root" level - it cannot inherit from anything above it

#### Design Tokens (Theme Settings)
The Slide Master defines reusable design tokens:

```javascript
themeSettings: {
  colors: {
    // Background colors
    background1: "#FFFFFF",
    background2: "#F5F5F5",
    
    // Text colors  
    text1: "#333333",       // Primary text
    text2: "#666666",       // Secondary text
    
    // Accent colors (used for emphasis, links, highlights)
    accent1: "#18A0FB",     // Primary accent
    accent2: "#7B61FF",     // Secondary accent
    accent3: "#1BC47D",     // Tertiary accent
    accent4: "#F24822",     // Quaternary accent
    accent5: "#FFBE0B",     // Quinary accent
    accent6: "#FF006E",     // Senary accent
    
    // Semantic colors
    hyperlink: "#0066CC",
    followedHyperlink: "#954F72"
  },
  
  fonts: {
    heading: {
      family: "Inter",
      weight: "700"
    },
    body: {
      family: "Inter", 
      weight: "400"
    }
  }
}
```

#### Master Elements
Elements placed directly on the Slide Master appear on ALL slides:
- **Logo**: Company/brand logo (typically corner-positioned)
- **Footer Text**: Copyright, confidentiality notice, etc.
- **Date**: Auto-updating or fixed date
- **Slide Number**: Automatic page numbering
- **Decorative Elements**: Lines, shapes, watermarks

### 2.3 Text Styles
The Slide Master defines default text formatting for different content levels:

| Style Level | Typical Use | Example Defaults |
|-------------|-------------|------------------|
| **Title** | Slide titles | 44pt, Bold, Color: text1 |
| **Subtitle** | Slide subtitles | 32pt, Regular, Color: text2 |
| **Body Level 1** | Main bullet points | 28pt, Regular, Color: text1 |
| **Body Level 2** | Sub-bullets | 24pt, Regular, Color: text1 |
| **Body Level 3** | Sub-sub-bullets | 20pt, Regular, Color: text2 |
| **Body Level 4** | Deeper nesting | 18pt, Regular, Color: text2 |
| **Body Level 5** | Deepest nesting | 16pt, Regular, Color: text2 |

---

## 3. Layout Masters

### 3.1 Definition
Layout Masters are child templates of a Slide Master. Each Layout defines a specific arrangement of placeholders for different content types.

### 3.2 Built-in Layouts
Every new presentation should include these default layouts:

| Layout Name | Description | Placeholders |
|-------------|-------------|--------------|
| **Title Slide** | Opening slide | Title (centered), Subtitle |
| **Title and Content** | Standard content slide | Title, Content (large area) |
| **Section Header** | Section divider | Title (large), Subtitle |
| **Two Content** | Side-by-side content | Title, Left Content, Right Content |
| **Comparison** | Compare two items | Title, Left Header, Left Content, Right Header, Right Content |
| **Title Only** | Just a title | Title |
| **Blank** | Empty slide | None (inherits master elements only) |
| **Content with Caption** | Content with description | Title, Content, Caption |
| **Picture with Caption** | Image-focused | Title, Picture, Caption |

### 3.3 Layout Properties

```javascript
LayoutMaster: {
  id: "layout-title-slide",
  parentId: "slide-master-1",     // Links to Slide Master
  name: "Title Slide",
  
  // Background - uses the Fill System
  // null/empty array = inherit from parent Slide Master
  // Any fill array = override
  background: null,
  
  // Layout-specific elements
  elements: { ... },
  elementOrder: [ ... ],
  
  // Placeholder definitions
  placeholders: {
    "ph-title": { ... },
    "ph-subtitle": { ... }
  }
}
```

### 3.4 Layout Background (Using Fill System)

Each Layout uses the existing **Fill System** for its background, with inheritance support:

| Fill State | Behavior |
|------------|----------|
| **No Fill (Empty)** | Inherits background from parent Slide Master |
| **Any Fill Applied** | Overrides the Slide Master background |

**How It Works:**
1. In the Property Inspector, the Layout shows the Fill Section for "Layout Background"
2. If no fills are added (empty state shows "No fill"), the Layout inherits the Slide Master's background
3. Adding any fill (solid, gradient, image, code) creates an override
4. Removing all fills (delete button) returns to inheritance mode

This leverages the existing Fill System's "No fill" empty state as the inheritance indicator, maintaining UI consistency across the app.

---

## 4. Placeholder System

### 4.1 Definition
Placeholders are special elements that define WHERE and HOW content should be placed. They act as "slots" that users fill with actual content.

### 4.2 Placeholder Types

| Type | Purpose | Default Content |
|------|---------|-----------------|
| **Title** | Slide title text | "Click to add title" |
| **Subtitle** | Secondary title text | "Click to add subtitle" |
| **Body/Content** | Main content area | "Click to add text" |
| **Text** | Generic text area | "Click to add text" |
| **Picture** | Image placeholder | Image icon + "Click to add picture" |
| **Media** | Video/audio | Media icon + "Click to add media" |
| **Table** *(future)* | Table placeholder | Table icon + "Click to add table" |
| **Date** | Auto/manual date | Current date or "[Date]" |
| **Footer** | Footer text | "[Footer text]" |
| **Slide Number** | Page number | "#" |

### 4.3 Placeholder Schema

```javascript
Placeholder: {
  id: "ph-title-1",
  type: "placeholder",
  placeholderType: "title",      // Type from above list
  
  // Position and size
  x: 100,
  y: 50,
  width: 800,
  height: 100,
  
  // Unique identifier for content remapping
  mappingId: "title",            // Used when switching layouts
  index: 0,                      // Order for same-type placeholders
  
  // Prompt text shown when empty
  prompt: "Click to add title",
  
  // Default styling
  style: {
    fontSize: 44,
    fontFamily: "var(--theme-font-heading)",
    fontWeight: "700",
    textAlign: "center",
    verticalAlign: "middle",
    color: "var(--theme-text-primary)"
  },
  
  // Constraints
  constraints: {
    canResize: true,
    canMove: true,
    canDelete: false,            // On master only
    canChangeType: false
  }
}
```

### 4.4 Placeholder Interaction

#### On Layout Master (Edit Mode)
- Placeholders appear as **dashed rectangles** with type labels
- Can be repositioned, resized, and styled
- Cannot be deleted from built-in layouts (protection)
- Custom placeholders can be added and removed

#### On Slides (Normal View)
- Empty placeholders show **prompt text** (grayed out)
- Clicking a placeholder:
  1. Activates it for editing
  2. Converts it to actual content element
  3. Maintains link to placeholder for remapping
- Filled placeholders behave like normal elements
- Can "Reset to Placeholder" to clear content

### 4.5 Content Remapping

When a user changes a slide's layout, content must intelligently transfer:

**Remapping Priority:**
1. **mappingId Match**: Exact match between old and new placeholder IDs
2. **Type + Index Match**: Same placeholder type with same index
3. **Type Match**: Same placeholder type (first available)
4. **Overflow**: Content without matching placeholder becomes a free element

**Example:**
```
Old Layout: "Title and Content"          New Layout: "Two Content"
┌─────────────────────────────┐          ┌─────────────────────────────┐
│ [Title: "Q3 Results"]       │    →     │ [Title: "Q3 Results"]       │
├─────────────────────────────┤          ├──────────────┬──────────────┤
│                             │          │              │              │
│ [Content: bullet points]    │    →     │ [Left:       │ [Right:      │
│                             │          │  bullets]    │  empty]      │
│                             │          │              │              │
└─────────────────────────────┘          └──────────────┴──────────────┘

- Title → Title (mappingId match)
- Content → Left Content (type match, index 0)
- Right Content remains empty
```

---

## 5. User Interface

### 5.1 Accessing Slide Master View

**Entry Points:**
1. **Menu**: View → Slide Master
2. **Keyboard**: Shift + Cmd/Ctrl + M
3. **Status Bar**: "Master View" button
4. **Right-Click**: On slide thumbnail → "Edit Slide Master"

**Exit Points:**
1. **Close Button**: Prominent "Close Master View" in toolbar
2. **Menu**: View → Normal
3. **Keyboard**: Escape (if nothing selected) or Shift + Cmd/Ctrl + M
4. **Status Bar**: Click "Normal View"

### 5.2 Master View Interface

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [← Close Master View]        SLIDE MASTER VIEW        [Insert ▼] [?]  │
├─────────────┬───────────────────────────────────────────┬───────────────┤
│             │                                           │               │
│  MASTERS    │              CANVAS                       │  PROPERTIES   │
│             │                                           │               │
│ ┌─────────┐ │   ┌─────────────────────────────────┐    │ Master        │
│ │ Slide   │ │   │                                 │    │ ───────────── │
│ │ Master  │◄├───│     "Editing: Slide Master"     │    │ Name: [     ] │
│ │ (large) │ │   │                                 │    │               │
│ └─────────┘ │   │    ┌───────────────────────┐   │    │ Background    │
│   │         │   │    │  LOGO                 │   │    │ ───────────── │
│   ├─ Title  │   │    └───────────────────────┘   │    │ [Solid ▼]     │
│   │  Slide  │   │                                 │    │ #1E1E1E [□]   │
│   │         │   │    ╔═══════════════════════╗   │    │               │
│   ├─ Title  │   │    ║ Click to edit Master  ║   │    │ Colors        │
│   │  & Body │   │    ║ title style           ║   │    │ ───────────── │
│   │         │   │    ╚═══════════════════════╝   │    │ [Edit Theme   │
│   ├─ Two    │   │                                 │    │  Colors...]   │
│   │  Column │   │    ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐   │    │               │
│   │         │   │    │ Click to edit Master │    │    │ Fonts         │
│   ├─ Blank  │   │    │ text styles          │    │    │ ───────────── │
│   │         │   │    └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘   │    │ Heading: Inter│
│   └─ [+]    │   │                                 │    │ Body: Inter   │
│             │   │   ┌─────┐  ┌─────┐   #         │    │               │
│ [+ Master]  │   │   │Date │  │Footr│   Slide #   │    │ [Edit Theme   │
│             │   │   └─────┘  └─────┘              │    │  Fonts...]    │
│             │   └─────────────────────────────────┘    │               │
│             │                                           │               │
└─────────────┴───────────────────────────────────────────┴───────────────┘
```

### 5.3 Master Thumbnail Panel (Left)

**Structure:**
- **Slide Master**: Large thumbnail at top, shows complete design
- **Layouts**: Smaller thumbnails indented below, connected by lines
- **Visual Indicators**:
  - Selected item has highlight border
  - Layout count badge on Slide Master
  - "In Use" indicator for layouts used by slides

**Actions:**
| Action | Trigger | Behavior |
|--------|---------|----------|
| Select | Click | Shows in canvas, updates properties |
| Rename | Double-click name or F2 | Inline edit |
| Duplicate | Right-click → Duplicate | Creates copy with "(Copy)" suffix |
| Delete | Right-click → Delete | Removes if not in use, prompts if used |
| Add Layout | Click [+] or right-click | Creates new blank layout |
| Add Master | Click [+ Master] | Creates new Slide Master with default layouts |
| Reorder | Drag and drop | Rearranges within same master |

**Contextual Restrictions:**
- Cannot delete the last Slide Master
- Cannot delete the last Layout in a Slide Master
- Warning when deleting a Layout used by slides
- Warning when deleting a Slide Master (affects all its layouts and slides)

### 5.4 Canvas (Center)

**Visual Indicators:**
- **Banner**: "Editing: [Master/Layout Name]" at top
- **Watermark**: Subtle "MASTER" or "LAYOUT" watermark
- **Inherited Elements**: Shown with 50% opacity and lock icon
- **Placeholders**: Dashed borders with type labels

**Editing Behavior:**
| Context | What's Editable | What's Locked |
|---------|-----------------|---------------|
| Slide Master | All master elements | N/A |
| Layout (editing) | Layout elements, placeholders | Slide Master elements (shown dimmed) |

### 5.5 Property Inspector (Right)

**When Slide Master Selected:**
```
┌─────────────────────────────┐
│ SLIDE MASTER                │
├─────────────────────────────┤
│ Name                        │
│ ┌─────────────────────────┐ │
│ │ Modern Dark             │ │
│ └─────────────────────────┘ │
│                             │
│ Background                  │
│ ┌───────────┬─────────────┐ │
│ │ ▣ Solid   │ #1E1E1E [□] │ │
│ └───────────┴─────────────┘ │
│                             │
│ Theme Colors                │
│ [Customize Colors...]       │
│ ┌──┬──┬──┬──┬──┬──┬──┬──┐  │
│ │■ │■ │■ │■ │■ │■ │■ │■ │  │
│ └──┴──┴──┴──┴──┴──┴──┴──┘  │
│                             │
│ Theme Fonts                 │
│ [Customize Fonts...]        │
│ Heading: Inter Bold         │
│ Body: Inter Regular         │
│                             │
│ Master Elements             │
│ ☑ Logo                      │
│ ☑ Footer                    │
│ ☑ Date                      │
│ ☑ Slide Number              │
│                             │
│ [Preserve Master]           │
│ [Rename...]                 │
└─────────────────────────────┘
```

**When Layout Selected:**
```
┌─────────────────────────────┐
│ LAYOUT MASTER               │
├─────────────────────────────┤
│ Name                        │
│ ┌─────────────────────────┐ │
│ │ Title and Content       │ │
│ └─────────────────────────┘ │
│                             │
│ Background                  │
│ (Uses Fill System)          │
│ ┌───────────────────────────│
│ │ [Empty = inherits master] │
│ │ [Add Fill] to override    │
│ └───────────────────────────│
│                             │
│ Master Elements             │
│ ☑ Logo                      │
│ ☐ Footer (hidden)           │
│ ☑ Date                      │
│ ☑ Slide Number              │
│                             │
│ Placeholders                │
│ [+ Add Placeholder]         │
│ • Title                     │
│ • Content                   │
│                             │
│ [Rename...]                 │
│ [Delete Layout]             │
└─────────────────────────────┘
```

### 5.6 Placeholder Editing

**Insert Placeholder Menu:**
```
┌─────────────────────┐
│ Insert Placeholder  │
├─────────────────────┤
│ ▸ Content           │
│ ▸ Text              │
│ ▸ Picture           │
│ ▸ Media             │
│ ───────────────────│
│ ▸ Date              │
│ ▸ Footer            │
│ ▸ Slide Number      │
└─────────────────────┘
```

*Note: Table placeholder will be added when table support is implemented.*

**Placeholder Properties:**
```
┌─────────────────────────────┐
│ PLACEHOLDER                 │
├─────────────────────────────┤
│ Type: [Content ▼]           │
│                             │
│ Prompt Text                 │
│ ┌─────────────────────────┐ │
│ │ Click to add content    │ │
│ └─────────────────────────┘ │
│                             │
│ Default Text Style          │
│ Font: [Body ▼]              │
│ Size: [28] pt               │
│ Align: [≡] [≡] [≡]          │
│                             │
│ Position                    │
│ X: [100]    Y: [200]        │
│ W: [800]    H: [400]        │
│                             │
│ [Delete Placeholder]        │
└─────────────────────────────┘
```

---

## 6. Normal View Integration

### 6.1 Layout Selection (Slide Properties)

When a slide (or no element) is selected in Normal View:

```
┌─────────────────────────────┐
│ SLIDE                       │
├─────────────────────────────┤
│ Layout                      │
│ ┌─────────────────────────┐ │
│ │ [■] Title and Content ▼ │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ ┌───┐ ┌───┐ ┌───┐ ┌───┐ │ │
│ │ │T&C│ │2Co│ │Ttl│ │Blk│ │ │
│ │ └───┘ └───┘ └───┘ └───┘ │ │
│ │ ┌───┐ ┌───┐ ┌───┐       │ │
│ │ │Cmp│ │Sec│ │Pic│       │ │
│ │ └───┘ └───┘ └───┘       │ │
│ └─────────────────────────┘ │
│                             │
│ Dimensions                  │
│ W: [1920]    H: [1080]      │
│                             │
│ [Reset Slide]               │
│ [Edit Master...]            │
└─────────────────────────────┘

┌─────────────────────────────┐
│ SLIDE BACKGROUND            │
├─────────────────────────────┤
│ (Fill System UI)            │
│                             │
│ [No fill] ← Inherits from   │
│              Layout/Master  │
│                             │
│ -- OR --                    │
│                             │
│ [■ #FF5500] [👁] [×]        │
│ [+ Add Fill]                │
└─────────────────────────────┘
```

**Background Inheritance via Fill System:**
- **No Fill**: Shows "No fill" empty state - background is inherited from Layout (which may inherit from Slide Master)
- **Fill Added**: Any fill (solid, gradient, image, code) overrides the inherited background
- **Remove Fill**: Deleting all fills returns to "No fill" state, restoring inheritance

### 6.2 Working with Placeholders on Slides

**Visual States:**
| State | Appearance | Interaction |
|-------|------------|-------------|
| Empty | Dashed border, prompt text, placeholder icon | Click to activate, shows content type options |
| Focused | Solid border, cursor inside | Type to add content |
| Filled | Normal element appearance | Standard editing |
| Selected | Selection handles | Move, resize, delete |

**Actions:**
- **Click Empty Placeholder**: Activates for content entry
- **Double-Click**: Enter text editing mode
- **Delete Content**: Returns to empty placeholder state
- **Delete Placeholder**: Removes from slide (can be reset)
- **Reset Slide**: Returns all placeholders to empty state

### 6.3 Inherited vs. Slide Elements

**Visual Distinction:**
- **Master Elements**: Shown but unselectable in Normal View (locked icon when hovered)
- **Layout Placeholders**: Interactive, fillable
- **Slide Elements**: Fully editable, independent

**Selection Behavior:**
- Clicking a master element shows a tooltip: "To edit, go to View → Slide Master"

---

## 7. Data Model

### 7.1 Complete Store Structure

```javascript
const State = {
  // Slide Masters and Layout Masters
  masters: {
    // Slide Master
    "master-1": {
      id: "master-1",
      type: "slideMaster",
      name: "Modern Dark",
      
      // Background - uses Fill System format
      // Array of fills, supporting multiple stacked backgrounds
      background: [
        {
          type: "solid",        // solid | gradient | image | code
          value: "#1E1E1E",
          color: "#1E1E1E",
          opacity: 100,
          visible: true
        }
      ],
      
      // Theme Design Tokens
      themeSettings: {
        colors: {
          background1: "#1E1E1E",
          background2: "#2D2D2D",
          text1: "#FFFFFF",
          text2: "#AAAAAA",
          accent1: "#18A0FB",
          accent2: "#7B61FF",
          accent3: "#1BC47D",
          accent4: "#F24822",
          accent5: "#FFBE0B",
          accent6: "#FF006E",
          hyperlink: "#18A0FB",
          followedHyperlink: "#7B61FF"
        },
        fonts: {
          heading: { family: "Inter", weight: "700" },
          body: { family: "Inter", weight: "400" }
        }
      },
      
      // Text Styles (for different content levels)
      textStyles: {
        title: { fontSize: 44, fontWeight: "700", color: "var(--theme-text1)" },
        subtitle: { fontSize: 32, fontWeight: "400", color: "var(--theme-text2)" },
        body1: { fontSize: 28, fontWeight: "400", color: "var(--theme-text1)" },
        body2: { fontSize: 24, fontWeight: "400", color: "var(--theme-text1)" },
        body3: { fontSize: 20, fontWeight: "400", color: "var(--theme-text2)" },
        body4: { fontSize: 18, fontWeight: "400", color: "var(--theme-text2)" },
        body5: { fontSize: 16, fontWeight: "400", color: "var(--theme-text2)" }
      },
      
      // Master elements (appear on ALL slides)
      elements: {
        "el-logo": {
          type: "image",
          x: 50, y: 30, width: 120, height: 40,
          src: "logo.png",
          masterElementType: "logo"
        },
        "el-footer": {
          type: "text",
          x: 50, y: 680, width: 400, height: 30,
          content: "Confidential",
          masterElementType: "footer"
        },
        "el-date": {
          type: "text",
          x: 500, y: 680, width: 200, height: 30,
          content: "{{date}}",
          masterElementType: "date",
          dateFormat: "MMMM D, YYYY"
        },
        "el-slidenum": {
          type: "text",
          x: 900, y: 680, width: 80, height: 30,
          content: "{{slideNumber}}",
          masterElementType: "slideNumber"
        }
      },
      elementOrder: ["el-logo", "el-footer", "el-date", "el-slidenum"],
      
      // Associated layout IDs
      layoutIds: ["layout-1", "layout-2", "layout-3", "layout-4"]
    },
    
    // Layout Master
    "layout-1": {
      id: "layout-1",
      type: "layoutMaster",
      parentId: "master-1",       // Link to Slide Master
      name: "Title Slide",
      
      // Background - uses Fill System format
      // null or empty array [] = inherit from parent Slide Master
      // Any fills = override
      background: null,
      
      // Layout-specific elements
      elements: {},
      elementOrder: [],
      
      // Placeholders
      placeholders: {
        "ph-title": {
          id: "ph-title",
          type: "placeholder",
          placeholderType: "title",
          mappingId: "title",
          index: 0,
          x: 100, y: 250, width: 800, height: 100,
          prompt: "Click to add title",
          style: {
            fontSize: 60,
            fontWeight: "700",
            textAlign: "center",
            verticalAlign: "middle"
          }
        },
        "ph-subtitle": {
          id: "ph-subtitle",
          type: "placeholder",
          placeholderType: "subtitle",
          mappingId: "subtitle",
          index: 0,
          x: 100, y: 370, width: 800, height: 60,
          prompt: "Click to add subtitle",
          style: {
            fontSize: 32,
            fontWeight: "400",
            textAlign: "center",
            verticalAlign: "middle"
          }
        }
      },
      placeholderOrder: ["ph-title", "ph-subtitle"]
    }
  },
  
  // Slides
  slides: {
    "slide-1": {
      id: "slide-1",
      layoutId: "layout-1",           // Link to Layout Master
      
      // Background - uses Fill System format
      // null or empty array [] = inherit from Layout (which may inherit from Slide Master)
      // Any fills = override
      background: null,
      
      // Filled placeholder content
      placeholderContent: {
        "title": {                    // Uses mappingId
          content: "<h1>Welcome</h1>",
          // Style overrides (optional)
        },
        "subtitle": {
          content: "<p>2024 Annual Report</p>"
        }
      },
      
      // Free elements (not in placeholders)
      elements: {
        "el-custom-1": { ... }
      },
      elementOrder: ["el-custom-1"]
    }
  }
};
```

### 7.2 Background Inheritance (Using Fill System)

The Fill System's "No fill" state is used to indicate inheritance:

| Level | Background State | Behavior |
|-------|------------------|----------|
| **Slide Master** | Has fills | Root level - defines the base background |
| **Slide Master** | No fills | Defaults to white (#FFFFFF) |
| **Layout** | Has fills | Overrides Slide Master background |
| **Layout** | No fills (null/[]) | Inherits from Slide Master |
| **Slide** | Has fills | Overrides Layout/Slide Master background |
| **Slide** | No fills (null/[]) | Inherits from Layout (which may inherit from Master) |

**Background Resolution:**
```javascript
function getEffectiveBackground(slideId) {
  const slide = state.slides[slideId];
  const layout = state.masters[slide.layoutId];
  const master = state.masters[layout.parentId];
  
  // Check if background has fills (not null, not empty array)
  const hasFills = (bg) => bg && Array.isArray(bg) && bg.length > 0;
  
  // 1. Slide-level override
  if (hasFills(slide.background)) {
    return slide.background;
  }
  
  // 2. Layout-level override
  if (hasFills(layout.background)) {
    return layout.background;
  }
  
  // 3. Master-level background (root)
  if (hasFills(master.background)) {
    return master.background;
  }
  
  // 4. Default fallback
  return [{ type: 'solid', value: '#FFFFFF', color: '#FFFFFF', opacity: 100, visible: true }];
}
```

### 7.3 Element Stack Resolution

```javascript
function getElementStack(slideId) {
  const slide = state.slides[slideId];
  const layout = state.masters[slide.layoutId];
  const master = state.masters[layout.parentId];
  
  const stack = [];
  
  // 1. Master elements (always shown)
  master.elementOrder.forEach(id => {
    const el = master.elements[id];
    stack.push({ ...el, source: 'master', locked: true });
  });
  
  // 2. Layout elements
  layout.elementOrder.forEach(id => {
    stack.push({ ...layout.elements[id], source: 'layout', locked: true });
  });
  
  // 3. Placeholders (with content if filled)
  layout.placeholderOrder.forEach(phId => {
    const ph = layout.placeholders[phId];
    const content = slide.placeholderContent[ph.mappingId];
    
    stack.push({
      ...ph,
      source: 'placeholder',
      filled: !!content,
      content: content?.content || null,
      locked: false
    });
  });
  
  // 4. Slide elements
  slide.elementOrder.forEach(id => {
    stack.push({ ...slide.elements[id], source: 'slide', locked: false });
  });
  
  return stack;
}
```

---

## 8. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Shift + Cmd/Ctrl + M** | Toggle Slide Master View |
| **Cmd/Ctrl + M** | Insert new slide with same layout |
| **Cmd/Ctrl + Shift + N** | Insert new slide, choose layout |
| **F2** | Rename selected master/layout |
| **Delete** | Delete selected layout (with confirmation) |
| **Cmd/Ctrl + D** | Duplicate selected layout |
| **Escape** | Exit Master View (if nothing selected) |

---

## 9. Edge Cases & Error Handling

### 9.1 Protection Rules

| Scenario | Behavior |
|----------|----------|
| Delete last Slide Master | **Blocked** - "Cannot delete the only Slide Master" |
| Delete last Layout | **Blocked** - "Every Master needs at least one Layout" |
| Delete Layout in use | **Warning** - "This layout is used by X slides. They will be reassigned to [Layout Name]." |
| Delete Slide Master in use | **Warning** - "This will delete X layouts and affect Y slides. Continue?" |
| Delete built-in Layout | **Blocked** on Title/Blank - Can delete others |

### 9.2 Content Orphaning

When switching layouts and content cannot be remapped:

1. **Preserve Content**: Create free-floating elements on slide
2. **Notify User**: Toast notification "Some content could not be mapped to the new layout"
3. **Easy Recovery**: Undo immediately restores previous state

### 9.3 Theme/Layout Corruption Recovery

If a slide references a non-existent layout:
1. Auto-assign to first available layout in first Slide Master
2. Log warning for debugging
3. Show user notification

---

## 10. Future Enhancements

### 10.1 Multiple Slide Masters
- Support multiple Slide Masters in one presentation
- Different themes for different sections
- "Apply to All" vs "Apply to Section" options

### 10.2 Master Templates Library
- Save custom masters as templates
- Import/export masters between presentations
- Built-in template gallery

### 10.3 Smart Layout Suggestions
- AI-powered layout recommendations based on content
- Auto-detect content type and suggest appropriate layout
- Diagram/flowchart style content transformation

### 10.4 Animation Masters
- Define default animations on master
- Entrance/exit effects inherited by slides
- Animation themes

---

## 11. Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Update Store structure for masters
- [ ] Create default Slide Master with basic layouts
- [ ] Implement inheritance resolution functions
- [ ] Update renderer to handle element stack

### Phase 2: Master View UI (Week 2)
- [ ] Create Master thumbnail panel
- [ ] Implement Master View toggle
- [ ] Build master/layout property inspector
- [ ] Add visual indicators (locked elements, watermarks)

### Phase 3: Placeholder System (Week 3)
- [ ] Implement placeholder element type
- [ ] Create placeholder insertion tool
- [ ] Build content remapping logic
- [ ] Handle placeholder states (empty/focused/filled)

### Phase 4: Integration (Week 4)
- [ ] Add layout selector to slide properties
- [ ] Implement background inheritance via Fill System
- [ ] Integrate Color Theme Manager panel (see [color-theme-manager.md](./color-theme-manager.md))
- [ ] Integrate Typography Style Manager panel (see [typography-style-manager.md](./typography-style-manager.md))
- [ ] Add keyboard shortcuts

### Phase 5: Polish (Week 5)
- [ ] Refine UI/UX based on testing
- [ ] Performance optimization (caching)
- [ ] Edge case handling
- [ ] Documentation and help text

---

## 12. Related Documents

- [Color Theme Manager](./color-theme-manager.md) - Draggable panel for managing color themes
- [Typography Style Manager](./typography-style-manager.md) - Draggable panel for managing text styles
- [Property Inspector: Slide](./property-inspector-slide.md) - Slide-level property inspector
- [Property Inspector: Typography](./property-inspector-typography.md) - Text element typography controls
- [UI Design System](./ui-design-system.md) - Core design tokens and components
- [Color Picker UI](./color-picker-ui.md) - Unified color picker component
