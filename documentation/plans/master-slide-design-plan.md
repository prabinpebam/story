# Master Slide Design Plan

## ✅ Implementation Status: COMPLETE

All improvements have been implemented in `src/core/store/InitialState.js`.

## Overview

This document outlines the design improvements for the default theme and layout masters to create professional, modern, and visually appealing presentation templates.

## Design Principles

### 1. Visual Hierarchy
- Clear distinction between title, subtitle, and body content
- Consistent spacing using an 8px grid system
- Strategic use of whitespace for breathing room

### 2. Professional Typography
- Larger, bolder titles for impact (Title Slide: 80px)
- Readable body text (20-24px)
- Proper line heights and letter spacing
- Font pairing: Inter for headings, Inter for body (or different weights)

### 3. Modern Aesthetics
- Contemporary color palette with vibrant accents
- Subtle visual elements (dividers, accent shapes)
- Clean, minimal design that doesn't distract from content

### 4. Consistent Grid System
- Standard margins: 100px on all sides
- Content area: 1720px wide × 880px tall (on 1920×1080)
- Consistent element spacing: 40px between major sections

---

## Theme Settings Improvements

### Color Palette
Using a modern, professional color scheme:

```
Background 1: #FFFFFF (Pure white)
Background 2: #F8FAFC (Light gray-blue)
Text Primary: #0F172A (Slate 900 - Near black)
Text Secondary: #64748B (Slate 500 - Medium gray)
Accent 1: #3B82F6 (Blue 500 - Primary brand)
Accent 2: #8B5CF6 (Violet 500 - Creative)
Accent 3: #10B981 (Emerald 500 - Success/Growth)
Accent 4: #F59E0B (Amber 500 - Warning/Attention)
Accent 5: #EF4444 (Red 500 - Alert/Important)
Accent 6: #EC4899 (Pink 500 - Vibrant)
Hyperlink: #2563EB (Blue 600)
Followed Hyperlink: #7C3AED (Violet 600)
```

### Typography Scale
Using a harmonious type scale (1.25 ratio):

| Style | Size | Weight | Line Height | Use Case |
|-------|------|--------|-------------|----------|
| Display | 80px | 800 | 1.0 | Title slides |
| Title | 56px | 700 | 1.1 | Section headers |
| Heading 1 | 44px | 700 | 1.2 | Main headings |
| Heading 2 | 36px | 600 | 1.25 | Subheadings |
| Body Large | 24px | 400 | 1.5 | Main content |
| Body | 20px | 400 | 1.6 | Regular text |
| Body Small | 16px | 400 | 1.5 | Secondary text |
| Caption | 14px | 500 | 1.4 | Annotations |
| Label | 12px | 600 | 1.3 | Tags, badges |

---

## Layout Designs

### 1. Title Slide
**Purpose:** Opening slide, maximum visual impact

**Design:**
- Title: Centered vertically (slightly above center)
- Large display text (80px)
- Subtitle: Below title with generous spacing
- Optional: Subtle accent line between title and subtitle

```
+--------------------------------------------------+
|                                                  |
|                                                  |
|              [TITLE - 80px, Bold]                |
|                  ──────────                      |
|            [Subtitle - 32px, Light]              |
|                                                  |
|                                                  |
+--------------------------------------------------+
```

**Measurements:**
- Title: x=160, y=380, w=1600, h=180
- Divider line: x=760, y=580, w=400 (decorative rectangle)
- Subtitle: x=160, y=620, w=1600, h=80

### 2. Title and Content
**Purpose:** Standard content slide with title

**Design:**
- Top-aligned title with ample space below
- Full-width content area
- Clean separation between title and content

```
+--------------------------------------------------+
| [TITLE - 44px]                                   |
|                                                  |
| [Content Area - 24px]                            |
|                                                  |
|                                                  |
|                                                  |
|                                                  |
+--------------------------------------------------+
```

**Measurements:**
- Title: x=100, y=80, w=1720, h=80
- Content: x=100, y=200, w=1720, h=800

### 3. Section Header
**Purpose:** Divide presentation into sections

**Design:**
- Title left-aligned, vertically centered
- Large text for visual break
- Subtitle as supporting context

```
+--------------------------------------------------+
|                                                  |
|                                                  |
| [SECTION TITLE - 64px]                           |
| [Description - 24px, secondary color]            |
|                                                  |
|                                                  |
+--------------------------------------------------+
```

**Measurements:**
- Title: x=100, y=420, w=1720, h=120
- Subtitle: x=100, y=560, w=1200, h=60

### 4. Two Column
**Purpose:** Compare or parallel content

**Design:**
- Shared title at top
- Equal-width columns with gutter
- Clear visual separation

```
+--------------------------------------------------+
| [TITLE - 44px]                                   |
|                                                  |
| [Column 1]            |  [Column 2]              |
|                       |                          |
|                       |                          |
|                       |                          |
+--------------------------------------------------+
```

**Measurements:**
- Title: x=100, y=80, w=1720, h=80
- Column 1: x=100, y=200, w=820, h=800
- Column 2: x=1000, y=200, w=820, h=800
- Gutter: 60px

### 5. Comparison
**Purpose:** Side-by-side comparison with headers

**Design:**
- Main title at top
- Two columns with individual headers
- Headers styled as H2

```
+--------------------------------------------------+
| [TITLE - 44px]                                   |
|                                                  |
| [Header 1 - 28px]     |  [Header 2 - 28px]       |
| [Content]             |  [Content]               |
|                       |                          |
|                       |                          |
+--------------------------------------------------+
```

**Measurements:**
- Title: x=100, y=80, w=1720, h=80
- Left Header: x=100, y=200, w=820, h=50
- Left Content: x=100, y=270, w=820, h=730
- Right Header: x=1000, y=200, w=820, h=50
- Right Content: x=1000, y=270, w=820, h=730

### 6. Title Only
**Purpose:** Slides where user adds custom content

**Design:**
- Title at top
- Empty space for creative layouts

**Measurements:**
- Title: x=100, y=80, w=1720, h=80

### 7. Blank
**Purpose:** Fully custom slides

**Design:**
- No placeholders
- Clean canvas

### 8. Content with Caption
**Purpose:** Main content with sidebar notes

**Design:**
- Title at top
- Large content area (2/3 width)
- Caption sidebar (1/3 width)

```
+--------------------------------------------------+
| [TITLE - 44px]                                   |
|                                                  |
| [Main Content Area]          | [Caption]        |
|                              |                   |
|                              |                   |
|                              |                   |
+--------------------------------------------------+
```

**Measurements:**
- Title: x=100, y=80, w=1720, h=80
- Content: x=100, y=200, w=1200, h=800
- Caption: x=1360, y=200, w=460, h=800

### 9. Picture with Caption
**Purpose:** Image-focused with descriptive text

**Design:**
- Title at top
- Large image placeholder (2/3 width)
- Caption sidebar for context

**Measurements:**
- Same as Content with Caption
- Image placeholder has subtle background

### 10. Quote (NEW)
**Purpose:** Feature a quote or key statement

**Design:**
- Large quote in center
- Attribution below
- Decorative quotation marks

```
+--------------------------------------------------+
|                                                  |
|      ❝                                           |
|      [Quote Text - 36px, italic]                 |
|                                                  |
|                      — [Attribution - 18px]      |
|                                                  |
+--------------------------------------------------+
```

### 11. Big Number (NEW)
**Purpose:** Highlight statistics or key metrics

**Design:**
- Large number centered
- Label above, description below

```
+--------------------------------------------------+
|                                                  |
|              [Label - 18px]                      |
|              [NUMBER - 120px, Bold]              |
|              [Description - 24px]                |
|                                                  |
+--------------------------------------------------+
```

---

## Implementation Notes

1. **Placeholder Styling:**
   - Placeholders show ghost text when empty
   - On click, placeholder text is replaced
   - Style inherits from theme variables

2. **Theme Variables:**
   - Use CSS custom properties where possible
   - `var(--theme-font-heading)`, `var(--theme-font-body)`
   - `var(--theme-text-primary)`, `var(--theme-text-secondary)`
   - `var(--theme-accent-1)` through `var(--theme-accent-6)`

3. **Responsive Considerations:**
   - All measurements based on 1920×1080
   - Scale proportionally for other aspect ratios

4. **Accessibility:**
   - Maintain sufficient contrast ratios
   - Clear visual hierarchy
   - Readable font sizes (minimum 14px for captions)
