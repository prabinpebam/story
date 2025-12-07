# Slide Master System - Presets, Layouts, Cascading Styles

**Version:** 2.0  
**Last Updated:** December 7, 2025

## 1. Overview

The Slide Master system is the foundation of presentation design, providing template-based consistency across all slides. This document specifies the complete master slide architecture with clear separation of concerns:

- **Slide Master Presets**: Structure and layout templates (NEVER embed colors/typography)
- **Color Theme Presets**: Reusable color palettes (12 semantic colors)
- **Typography Style Presets**: Reusable font systems (families, sizes, weights)

**Critical Principle:** Slide Master Presets ONLY reference Color Theme and Typography Style Presets via IDs. They never embed actual color values or font definitions. This separation enables independent manipulation without conflicts.

For complete terminology definitions, see [TERMINOLOGY-AND-ARCHITECTURE.md](./TERMINOLOGY-AND-ARCHITECTURE.md).

---

## 2. Master Slide Hierarchy

### 2.1 Architecture with Preset Separation

```
PRESENTATION
│
├─► COLOR THEME PRESETS (Library, reusable)
│   ├─ Default Colors (12 semantic colors)
│   ├─ Ocean Blue
│   ├─ Sunset Warm
│   └─ Forest Green ...
│
├─► TYPOGRAPHY STYLE PRESETS (Library, reusable)
│   ├─ Modern Sans (Inter, size scale)
│   ├─ Formal Serif (Merriweather)
│   └─ Technical Mono ...
│
├─► SLIDE MASTER PRESETS (Multiple allowed)
│   │
│   ├─ SLIDE MASTER: "Corporate"
│   │   ├─ colorThemeId: "color-theme-default" ← REFERENCE
│   │   ├─ typographyStyleId: "typo-style-modern" ← REFERENCE
│   │   ├─ Background
│   │   ├─ Master elements (logo, footer, etc.)
│   │   │
│   │   └─► LAYOUT MASTERS (1+ per master)
│   │       ├─ Title Slide Layout
│   │       ├─ Title + Content Layout
│   │       ├─ Two Column Layout
│   │       ├─ Blank Layout
│   │       └─ Custom Layouts...
│   │           │
│   │           └─► SLIDES (instances)
│   │               ├─ Slide 1 (uses Title Layout)
│   │               │   ├─ colorThemeId: null (inherit)
│   │               │   └─ typographyStyleId: null (inherit)
│   │               │
│   │               ├─ Slide 2 (uses Content Layout)
│   │               │   ├─ colorThemeId: "sunset" (OVERRIDE)
│   │               │   └─ typographyStyleId: null (inherit)
│   │               │
│   │               └─ Slide 3 (uses Two Column)
```

### 2.2 Component Purposes

**Slide Master Preset:**
- Defines presentation-wide structure and layout templates
- REFERENCES color theme preset (via `colorThemeId`)
- REFERENCES typography style preset (via `typographyStyleId`)
- Contains master elements that appear on all slides (logo, footer)
- Can have multiple master presets per presentation
- **NEVER embeds actual colors or font definitions**

**Layout Master:**
- Defines specific slide arrangements within a master preset
- Contains placeholders for content (position, size, type)
- Inherits color theme and typography from parent master (if not overridden)
- Can override with different color theme or typography style

**Slide:**
- Instance of a layout master
- Contains actual content (text, images, shapes)
- Inherits color theme and typography from layout (if not overridden)
- Can override with different color theme or typography style
- Preserves content through template changes

**Color Theme Preset:**
- Standalone 12-color palette (background1-2, text1-2, accent1-6, hyperlink, followedHyperlink)
- Reusable across ANY master preset
- Can be applied at master/layout/slide/element level
- Stored in separate `colorThemePresets` library

**Typography Style Preset:**
- Standalone font system (heading/body fonts + text style definitions)
- Reusable across ANY master preset
- Can be applied at master/layout/slide/element level
- Stored in separate `typographyStylePresets` library

---

## 3. Slide Master Editor

### 3.1 Accessing Master View

**Methods:**
- View menu → Master → Slide Master
- Keyboard: **Shift + Ctrl + M**
- Right-click master thumbnail → Edit Master

**Mode Transition:**
```
EDIT MODE
    ↓
[Enter Master View]
    ↓
MASTER EDIT MODE
• Different toolbar
• Master-specific tools
• Layout management
• Placeholder tools
    ↓
[Close Master View]
    ↓
EDIT MODE (changes applied)
```

### 3.2 Master View Interface

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Master View - Office Theme                        [Close Master View] ✕  │
├──────────────────────────────────────────────────────────────────────────┤
│ [Insert Layout] [Delete] [Rename] [Preserve] | [Insert Placeholder ▼]   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────┐     ┌──────────────────────────────────────────────────┐  │
│  │Master   │     │                                                  │  │
│  │ [Theme] │     │   MASTER SLIDE                                   │  │
│  │  ┌───┐  │     │                                                  │  │
│  │  │   │  │     │   Click to edit Master title style              │  │
│  │  └───┘  │     │                                                  │  │
│  ├─────────┤     │   • Edit Master text styles                     │  │
│  │Layout 1 │     │     • Second level                              │  │
│  │ Title   │     │       • Third level                             │  │
│  │  ┌───┐  │     │                                                  │  │
│  │  │   │  │     │                                                  │  │
│  │  └───┘  │     │   [Logo]                    #  Date  Footer     │  │
│  ├─────────┤     └──────────────────────────────────────────────────┘  │
│  │Layout 2 │                                                            │
│  │Title+Txt│     Instructions:                                          │
│  │  ┌───┐  │     • This is the Slide Master                            │
│  │  │   │  │     • Changes here apply to all layouts                   │
│  │  └───┘  │     • Use layouts below for specific slide types          │
│  ├─────────┤                                                            │
│  │Layout 3 │                                                            │
│  │2-Column │                                                            │
│  └─────────┘                                                            │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Master Slide Elements

**Global Elements (appear on all layouts):**
- Logo/branding
- Footer text
- Date/time
- Slide number
- Background graphics

**Text Styles:**
- Title style (font, size, color, effects)
- Body text levels (5 levels of bullet points)
- Hyperlink style
- Followed hyperlink style

---

## 4. Multiple Slide Masters

### 4.1 Use Cases

**Multiple Masters in One Presentation:**
1. **Section Branding**: Different masters for different sections
2. **Content Types**: Data-heavy vs visual sections
3. **Audience Segments**: Technical vs executive slides
4. **Transitions**: Before/after, problem/solution
5. **Themed Sections**: Different color schemes per topic

### 4.2 Adding New Master

**Dialog:**
```
┌────────────────────────────────────────────────┐
│  Add Slide Master                           ✕  │
├────────────────────────────────────────────────┤
│  Create new master:                            │
│  ● Blank master                                │
│  ○ Duplicate existing master                   │
│  ○ From theme file                             │
│                                                │
│  Master name: [Technical Slides_____]          │
│                                                │
│  Theme:                                        │
│  ○ Create new theme                            │
│  ● Use existing: [Office Theme     ▼]          │
│                                                │
│  [ Cancel ]           [ Create ]               │
└────────────────────────────────────────────────┘
```

### 4.3 Master Management

**Operations:**
- Create new master
- Duplicate master
- Rename master
- Delete master (if no slides use it)
- Reorder masters
- Set default master
- Merge masters

**Master Properties:**
```typescript
interface SlideMaster {
  id: string;
  name: string;
  theme: PresentationTheme;
  layouts: LayoutMaster[];
  preserveAspectRatio: boolean;
  
  // Global elements that appear on all layouts
  headerFooter: HeaderFooterSettings;
  backgroundGraphics: Element[];
  
  // Text styles
  titleStyle: TextStyle;
  bodyStyles: TextStyle[];  // 5 levels
  
  // Used by slides
  usedBy: string[];  // Slide IDs using this master
}
```

### 4.4 Switching Slide Master

**For Individual Slides:**
```
Right-click slide → Change Layout → [Different Master] → [Layout]
```

**For Multiple Slides:**
```
Select slides → Right-click → Change Master → [Choose Master]
```

**Confirmation Dialog:**
```
┌────────────────────────────────────────────────┐
│  Change Slide Master?                       ✕  │
├────────────────────────────────────────────────┤
│  You are changing 5 slides to use a different  │
│  master. This may affect formatting.           │
│                                                │
│  Current master: Office Theme                  │
│  New master: Technical Theme                   │
│                                                │
│  Content handling:                             │
│  ● Keep content, reflow to new layouts        │
│  ○ Keep content and positions (may overflow)  │
│                                                │
│  [ Cancel ]           [ Change Master ]        │
└────────────────────────────────────────────────┘
```

---

## 5. Layout Masters

### 5.1 Built-in Layouts

**Standard Layouts (PowerPoint-Compatible):**

1. **Title Slide**
   - Title placeholder (large, centered)
   - Subtitle placeholder
   - No header/footer/slide number

2. **Title and Content**
   - Title placeholder (top)
   - Content placeholder (body)

3. **Section Header**
   - Large title (vertical center)
   - Subtitle
   - Background accent

4. **Two Content**
   - Title
   - Two side-by-side content placeholders

5. **Comparison**
   - Title
   - Two content placeholders with headings

6. **Title Only**
   - Title placeholder
   - Empty canvas for free-form design

7. **Blank**
   - No placeholders
   - Full creative control

8. **Content with Caption**
   - Large content area
   - Side caption panel

9. **Picture with Caption**
   - Large picture placeholder
   - Caption below

10. **Vertical Title and Text**
    - Vertical title bar (left)
    - Content area (right)

### 5.2 Creating Custom Layouts

**Process:**
1. Enter Master View
2. Click "Insert Layout"
3. Name the layout
4. Insert placeholders
5. Format background
6. Add graphics
7. Save layout

**Dialog:**
```
┌────────────────────────────────────────────────┐
│  Create New Layout                          ✕  │
├────────────────────────────────────────────────┤
│  Layout name: [Three Column Split______]       │
│                                                │
│  Based on:                                     │
│  ○ Blank layout                                │
│  ● Duplicate existing: [Two Content   ▼]       │
│                                                │
│  Settings:                                     │
│  ☑ Show master background graphics            │
│  ☑ Show header and footer                     │
│  ☐ Hide background graphics by default        │
│                                                │
│  [ Cancel ]           [ Create ]               │
└────────────────────────────────────────────────┘
```

### 5.3 Layout Management

**Operations:**
- Insert new layout
- Duplicate layout
- Rename layout
- Delete layout
- Reorder layouts
- Set default layout

**Layout Picker UI:**
```
┌──────────────────────────────────────────────────────────────┐
│  Choose Layout                                            ✕  │
├──────────────────────────────────────────────────────────────┤
│  Office Theme ▼                                              │
│                                                              │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐         │
│  │TITLE │  │TITLE │  │      │  │TITLE │  │TITLE │         │
│  │      │  │──────│  │TITLE │  │──────│  │────┬─│         │
│  │Subt. │  │BODY  │  │      │  │  │  │  │BODY│C│         │
│  └──────┘  └──────┘  └──────┘  └──────┘  └────┴─┘         │
│  Title     Title &    Section   Two       Content          │
│  Slide     Content    Header    Content   w/ Caption       │
│  [✓]       [ ]        [ ]       [ ]       [ ]              │
│                                                              │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐         │
│  │TITLE │  │      │  │TITLE │  │  │PIC│  │T│BODY│         │
│  │      │  │      │  │────┬─│  │──┴───│  │I│     │         │
│  │      │  │      │  │BODY│B│  │BODY  │  │T│     │         │
│  └──────┘  └──────┘  └──────┘  └──────┘  └─┴─────┘         │
│  Title     Blank     Comparison Picture   Vertical         │
│  Only                           Caption    Title            │
│  [ ]       [ ]       [ ]        [ ]        [ ]              │
│                                                              │
│  [Apply to Selected]  [Set as Default]                      │
└──────────────────────────────────────────────────────────────┘
```

### 5.4 Layout Data Model

```typescript
interface LayoutMaster {
  id: string;
  name: string;
  masterId: string;  // Parent master
  
  placeholders: Placeholder[];
  elements: Element[];  // Non-placeholder graphics
  
  background: {
    type: 'inherit' | 'override';
    fill?: FillSettings;
  };
  
  showMasterShapes: boolean;  // Background graphics
  showHeaderFooter: boolean;
  
  // Layout preview thumbnail
  thumbnail?: string;
  
  // Usage tracking
  usedBy: string[];  // Slide IDs
}
```

---

## 6. Placeholder System

### 6.1 Placeholder Types

**Content Placeholders:**

1. **Title Placeholder**
   - Single-line or multi-line
   - Large font
   - Top of slide typically

2. **Text Placeholder**
   - Body text
   - Bullet lists
   - Multiple paragraphs

3. **Content Placeholder** (Mixed)
   - Can accept: text, image, video, chart, table, SmartArt
   - Shows icon grid when empty
   - Most versatile type

4. **Picture Placeholder**
   - Image only
   - Shows picture icon when empty
   - Maintains aspect ratio

5. **Chart Placeholder**
   - Chart/graph only
   - Opens chart editor

6. **Table Placeholder**
   - Table grid
   - Opens table creator

7. **SmartArt Placeholder**
   - Diagram layouts
   - Opens SmartArt picker

8. **Media Placeholder**
   - Video or audio
   - Shows media icon

9. **Slide Number Placeholder**
   - Auto-populated number
   - Can't be edited directly

10. **Date Placeholder**
    - Auto-updating date
    - Multiple formats

11. **Footer Placeholder**
    - Text defined in header/footer settings

### 6.2 Placeholder Properties

```typescript
interface Placeholder {
  id: string;
  type: PlaceholderType;
  
  // Position and size
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  
  // Content constraints
  contentType: ContentType[];  // What can go in this placeholder
  
  // Formatting
  defaultText?: string;  // Prompt text
  textStyle?: TextStyle;
  fill?: FillSettings;
  border?: StrokeSettings;
  
  // Behavior
  editable: boolean;
  deletable: boolean;  // Can users delete this?
  required: boolean;   // Must have content?
  
  // Inheritance
  overrideAllowed: boolean;  // Can slides override format?
}

type PlaceholderType = 
  | 'title'
  | 'body'
  | 'text'
  | 'content'
  | 'picture'
  | 'chart'
  | 'table'
  | 'smartart'
  | 'media'
  | 'slide-number'
  | 'date'
  | 'footer';

type ContentType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'chart'
  | 'table'
  | 'shape'
  | 'smartart';
```

### 6.3 Inserting Placeholders

**Master View Toolbar:**
```
[Insert Placeholder ▼]
  ├─ Content
  ├─ Text
  ├─ Picture
  ├─ Chart
  ├─ Table
  ├─ SmartArt
  ├─ Media
  ├─ ─────────────
  ├─ Slide Number
  ├─ Date
  └─ Footer
```

**Insert Process:**
1. Click "Insert Placeholder"
2. Choose type
3. Click and drag on canvas to size
4. Format placeholder
5. Set default content

### 6.4 Placeholder Visual States

**Empty State (on slide):**
```
┌──────────────────────────────────────┐
│  Click to add title                  │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│  Click icon to add content           │
│                                      │
│       [📄] [🖼] [📊] [📋] [🎬]         │
│                                      │
│  Or click to add text                │
└──────────────────────────────────────┘
```

**Edit State:**
```
┌──────────────────────────────────────┐
│  [Cursor here] |                     │
└──────────────────────────────────────┘
```

**Filled State:**
```
┌──────────────────────────────────────┐
│  Quarterly Results                   │
└──────────────────────────────────────┘
```

### 6.5 Content Placeholder Icon Grid

**Behavior:**
- Shows 5-6 icons for content types
- Click icon to insert that content type
- Or click anywhere to add text
- Icons disappear when content added

**Implementation:**
```typescript
class ContentPlaceholder {
  constructor(config) {
    this.types = config.contentType || [
      'text', 'image', 'chart', 'table', 'media'
    ];
  }
  
  render() {
    if (this.hasContent()) {
      return this.renderContent();
    } else {
      return this.renderEmptyState();
    }
  }
  
  renderEmptyState() {
    return `
      <div class="placeholder-empty">
        <div class="placeholder-prompt">
          Click icon to add content
        </div>
        <div class="placeholder-icons">
          ${this.types.map(type => this.renderIcon(type)).join('')}
        </div>
        <div class="placeholder-prompt-secondary">
          Or click to add text
        </div>
      </div>
    `;
  }
  
  onIconClick(type) {
    switch(type) {
      case 'text':
        this.startTextEditing();
        break;
      case 'image':
        this.openImagePicker();
        break;
      case 'chart':
        this.openChartEditor();
        break;
      case 'table':
        this.openTableCreator();
        break;
      case 'media':
        this.openMediaPicker();
        break;
    }
  }
}
```

---

## 7. Theme System

### 7.1 Theme Components

**PowerPoint Theme (.thmx) Equivalent:**

1. **Theme Colors** (12-color palette)
   - Background (Light/Dark)
   - Text (Light/Dark)
   - Accent 1-6
   - Hyperlink
   - Followed Hyperlink

2. **Theme Fonts**
   - Heading font
   - Body font

3. **Theme Effects**
   - Line styles
   - Fill effects
   - Shadow/reflection/glow presets

4. **Background Styles**
   - Solid fills
   - Gradients
   - Textures
   - Patterns

### 7.2 Theme Data Model

```typescript
interface PresentationTheme {
  id: string;
  name: string;
  
  colors: ThemeColors;
  fonts: ThemeFonts;
  effects: ThemeEffects;
  
  // Predefined color variants
  colorSchemes: ColorScheme[];
}

interface ThemeColors {
  // Core colors
  background1: string;  // Light background
  text1: string;        // Dark text (on light bg)
  background2: string;  // Dark background
  text2: string;        // Light text (on dark bg)
  
  // Accent colors
  accent1: string;
  accent2: string;
  accent3: string;
  accent4: string;
  accent5: string;
  accent6: string;
  
  // Hyperlinks
  hyperlink: string;
  followedHyperlink: string;
}

interface ThemeFonts {
  heading: FontFamily;
  body: FontFamily;
}

interface ThemeEffects {
  lineStyles: LineEffect[];
  fillEffects: FillEffect[];
  shadowEffects: ShadowEffect[];
  reflectionEffects: ReflectionEffect[];
  glowEffects: GlowEffect[];
}

interface ColorScheme {
  name: string;  // "Blue", "Green", "Orange", etc.
  colors: ThemeColors;
  thumbnail: string;
}
```

### 7.3 Theme Picker UI

```
┌────────────────────────────────────────────────────────────┐
│  Themes                                                 ✕  │
├────────────────────────────────────────────────────────────┤
│  [Search themes...]                                        │
│                                                            │
│  Built-in Themes:                                          │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐       │
│  │Office│  │Facet │  │Ion   │  │Basis │  │Retro │       │
│  │      │  │      │  │      │  │      │  │      │       │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘       │
│  [✓]       [ ]       [ ]       [ ]       [ ]             │
│                                                            │
│  Color Variants (Office Theme):                           │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐                          │
│  │▓▓│ │▓▓│ │▓▓│ │▓▓│ │▓▓│ │▓▓│                          │
│  │▓▓│ │░░│ │▓▓│ │▓▓│ │▓▓│ │▓▓│                          │
│  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘                          │
│  [✓]  [ ]  [ ]  [ ]  [ ]  [ ]                            │
│                                                            │
│  [Customize Colors...]  [Customize Fonts...]              │
│  [Import Theme...]      [Save Current Theme...]           │
│                                                            │
│  [ Close ]              [ Apply ]                          │
└────────────────────────────────────────────────────────────┘
```

### 7.4 Custom Theme Colors

**Color Customization Dialog:**
```
┌────────────────────────────────────────────────┐
│  Create New Theme Colors                    ✕  │
├────────────────────────────────────────────────┤
│  Theme color name: [Custom 1________]          │
│                                                │
│  Theme colors:                                 │
│  ┌─────────────────────┬───────────────────┐  │
│  │ Background 1        │ [███] #FFFFFF     │  │
│  │ Text 1              │ [███] #000000     │  │
│  │ Background 2        │ [███] #1F2937     │  │
│  │ Text 2              │ [███] #FFFFFF     │  │
│  ├─────────────────────┼───────────────────┤  │
│  │ Accent 1            │ [███] #0078D4     │  │
│  │ Accent 2            │ [███] #2B5797     │  │
│  │ Accent 3            │ [███] #00B7C3     │  │
│  │ Accent 4            │ [███] #8764B8     │  │
│  │ Accent 5            │ [███] #E01E5A     │  │
│  │ Accent 6            │ [███] #FDB800     │  │
│  ├─────────────────────┼───────────────────┤  │
│  │ Hyperlink           │ [███] #0078D4     │  │
│  │ Followed Hyperlink  │ [███] #954F72     │  │
│  └─────────────────────┴───────────────────┘  │
│                                                │
│  Preview:                                      │
│  ┌────────────────────────────────────────┐   │
│  │  Sample Title                          │   │
│  │  • Sample text                         │   │
│  │  • More text                           │   │
│  └────────────────────────────────────────┘   │
│                                                │
│  [ Cancel ]  [ Reset ]  [ Save ]               │
└────────────────────────────────────────────────┘
```

---

## 8. Header and Footer System

### 8.1 Header/Footer Settings

**Dialog:**
```
┌────────────────────────────────────────────────┐
│  Header and Footer                          ✕  │
├────────────────────────────────────────────────┤
│  Apply to: ● Slides  ○ Notes and Handouts     │
│                                                │
│  Include on slide:                             │
│  ☑ Date and time                               │
│    ● Update automatically                      │
│      [12/7/2025        ▼]                      │
│    ○ Fixed                                     │
│      [December 7, 2025___________]             │
│                                                │
│  ☑ Slide number                                │
│                                                │
│  ☑ Footer                                      │
│    [Confidential - Internal Use Only___]       │
│                                                │
│  ☐ Don't show on title slide                  │
│                                                │
│  Preview:                                      │
│  ┌────────────────────────────────────────┐   │
│  │                                        │   │
│  │                                        │   │
│  │  12/7/2025        Footer Text        5 │   │
│  └────────────────────────────────────────┘   │
│                                                │
│  [ Cancel ]  [ Apply to All ]  [ Apply ]       │
└────────────────────────────────────────────────┘
```

### 8.2 Header/Footer Placeholders

**Master View Placeholders:**
- Date placeholder (left footer)
- Footer text placeholder (center footer)
- Slide number placeholder (right footer)
- Header placeholder (notes/handouts only)

**Positioning:**
```typescript
interface HeaderFooterSettings {
  showDate: boolean;
  dateFormat: 'auto' | 'fixed';
  dateValue: string;  // Fixed date or format string
  
  showSlideNumber: boolean;
  numberFormat: string;  // "1", "Slide 1", etc.
  
  showFooter: boolean;
  footerText: string;
  
  // Position on slide
  datePosition: Position;
  footerPosition: Position;
  numberPosition: Position;
  
  // Visibility
  hideOnTitleSlide: boolean;
  hideOnSlides: string[];  // Specific slide IDs to hide
}
```

---

## 9. Master Inheritance and Overrides

### 9.1 Inheritance Chain

```
MASTER → LAYOUT → SLIDE

Master defines:
  ✓ Theme colors/fonts
  ✓ Background
  ✓ Master shapes (logos, etc.)
  ✓ Header/footer
  ✓ Text styles

Layout inherits but can override:
  ↓ Background (use master or custom)
  ↓ Visibility of master shapes
  + Adds placeholders
  + Adds layout-specific elements

Slide inherits but can override:
  ↓ Background (layout or custom)
  ↓ Placeholder positions/sizes
  ↓ Visibility of master/layout elements
  + Adds content
  + Adds free-form elements
```

### 9.2 Reset to Layout

**Purpose:** Remove all user overrides and restore layout defaults

**Operation:**
```
Right-click slide → Reset to Layout
```

**Confirmation:**
```
┌────────────────────────────────────────────────┐
│  Reset Slide to Layout?                     ✕  │
├────────────────────────────────────────────────┤
│  This will reset the slide to match the        │
│  layout, removing customizations.              │
│                                                │
│  The following will be reset:                  │
│  • Background                                  │
│  • Placeholder positions and sizes             │
│  • Visibility of master elements               │
│                                                │
│  Content in placeholders will be preserved.    │
│                                                │
│  [ Cancel ]           [ Reset ]                │
└────────────────────────────────────────────────┘
```

### 9.3 Preserve Master Option

**Purpose:** Lock slide to current master even if moved to different presentation

**Use Case:**
- Importing slides from another presentation
- Maintaining original design

**Setting:**
```
Master View → Select Master → [✓] Preserve
```

**When Preserve is enabled:**
- Master travels with slides
- Importing slides brings their master
- Master not affected by destination presentation themes

---

## 10. Background Management

### 10.1 Background Types

1. **Solid Fill**
2. **Gradient Fill** (linear, radial, rectangular, path)
3. **Picture Fill** (with tiling options)
4. **Texture Fill** (built-in patterns)
5. **Pattern Fill** (dots, stripes, grid, etc.)

### 10.2 Format Background Panel

```
┌────────────────────────────────────────────────┐
│  Format Background                          ✕  │
├────────────────────────────────────────────────┤
│  Fill: [Solid ▼]                               │
│                                                │
│  Color: [████] #1E1E1E                         │
│                                                │
│  Transparency: [━━━━━━━━●─] 0%                 │
│                                                │
│  ─────────────────────────────────────         │
│                                                │
│  Picture or Texture Fill:                      │
│  [Choose Picture...]  [Online Pictures...]     │
│                                                │
│  Texture: [None         ▼]                     │
│                                                │
│  ─────────────────────────────────────         │
│                                                │
│  ☐ Hide background graphics                   │
│                                                │
│  [Apply to All]  [Reset Background]            │
│                                                │
│  [ Close ]                                     │
└────────────────────────────────────────────────┘
```

### 10.3 Hide Background Graphics

**Toggle:**
- Per-slide setting
- Hides master shapes (logos, decorations)
- Keeps background fill
- Useful for special slides (title, section)

**Implementation:**
```typescript
interface SlideBackground {
  type: 'inherit' | 'override';
  
  fill?: FillSettings;
  
  hideMasterShapes: boolean;  // Hide logos, graphics
  hideHeaderFooter: boolean;   // Hide footer elements
}
```

---

## 11. Implementation Guide

### 11.1 Master Manager Class

```typescript
class SlideMasterManager {
  constructor(presentation) {
    this.presentation = presentation;
    this.masters = presentation.slideMasters;
    this.currentMaster = null;
  }
  
  // Master CRUD
  createMaster(name, theme) {
    const master = {
      id: generateId(),
      name,
      theme,
      layouts: [this.createDefaultLayout()],
      preserveAspectRatio: true,
      headerFooter: this.getDefaultHeaderFooter(),
      backgroundGraphics: [],
      titleStyle: theme.fonts.heading,
      bodyStyles: this.createDefaultBodyStyles(theme.fonts.body)
    };
    
    this.masters.push(master);
    return master;
  }
  
  duplicateMaster(masterId) {
    const source = this.getMaster(masterId);
    const duplicate = deepClone(source);
    duplicate.id = generateId();
    duplicate.name = `${source.name} Copy`;
    
    // Generate new IDs for layouts
    duplicate.layouts.forEach(layout => {
      layout.id = generateId();
      layout.placeholders.forEach(ph => ph.id = generateId());
    });
    
    this.masters.push(duplicate);
    return duplicate;
  }
  
  deleteMaster(masterId) {
    const slidesUsingMaster = this.presentation.slides.filter(
      s => s.masterId === masterId
    );
    
    if (slidesUsingMaster.length > 0) {
      throw new Error(`Cannot delete master used by ${slidesUsingMaster.length} slides`);
    }
    
    this.masters = this.masters.filter(m => m.id !== masterId);
  }
  
  // Layout CRUD
  createLayout(masterId, name) {
    const master = this.getMaster(masterId);
    const layout = {
      id: generateId(),
      name,
      masterId,
      placeholders: [],
      elements: [],
      background: { type: 'inherit' },
      showMasterShapes: true,
      showHeaderFooter: true,
      usedBy: []
    };
    
    master.layouts.push(layout);
    return layout;
  }
  
  // Theme application
  applyTheme(masterId, theme) {
    const master = this.getMaster(masterId);
    master.theme = theme;
    
    // Update all slides using this master
    this.propagateThemeChange(masterId);
  }
  
  propagateThemeChange(masterId) {
    const slides = this.presentation.slides.filter(
      s => s.masterId === masterId
    );
    
    slides.forEach(slide => {
      // Update theme-dependent properties
      this.updateSlideTheme(slide);
    });
  }
  
  // Helper methods
  getMaster(id) {
    return this.masters.find(m => m.id === id);
  }
  
  getLayout(masterId, layoutId) {
    const master = this.getMaster(masterId);
    return master.layouts.find(l => l.id === layoutId);
  }
  
  getDefaultLayout(masterId) {
    const master = this.getMaster(masterId);
    return master.layouts[0];  // First layout is default
  }
}
```

### 11.2 Placeholder Manager

```typescript
class PlaceholderManager {
  createPlaceholder(type, bounds) {
    return {
      id: generateId(),
      type,
      ...bounds,
      contentType: this.getContentTypesForPlaceholder(type),
      defaultText: this.getDefaultText(type),
      textStyle: this.getDefaultTextStyle(type),
      editable: true,
      deletable: true,
      required: false,
      overrideAllowed: true
    };
  }
  
  getContentTypesForPlaceholder(type) {
    const contentMap = {
      'title': ['text'],
      'body': ['text'],
      'text': ['text'],
      'content': ['text', 'image', 'video', 'chart', 'table', 'smartart'],
      'picture': ['image'],
      'chart': ['chart'],
      'table': ['table'],
      'smartart': ['smartart'],
      'media': ['video', 'audio']
    };
    
    return contentMap[type] || ['text'];
  }
  
  getDefaultText(type) {
    const textMap = {
      'title': 'Click to add title',
      'body': 'Click to add text',
      'text': 'Click to add text',
      'content': 'Click to add content',
      'picture': 'Click icon to add picture',
      'chart': 'Click icon to add chart',
      'table': 'Click icon to add table'
    };
    
    return textMap[type] || '';
  }
}
```

---

**Next**: See [10-slide-animations.md](./10-slide-animations.md) for animation system details.
