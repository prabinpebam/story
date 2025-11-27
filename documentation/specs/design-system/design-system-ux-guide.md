# Design System UX Guide: Color Themes & Typography Styles

## Overview

This document describes the **mental model** and **user experience** for working with Color Themes and Typography Styles in the presentation application. Understanding this mental model helps users leverage these systems effectively to create consistent, professional presentations.

---

## Core Mental Model

### The Design System Hierarchy

Think of your presentation's design as having three layers:

```
┌─────────────────────────────────────────────────────────────────┐
│                     DESIGN SYSTEM LAYER                          │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐│
│  │      COLOR THEME            │  │    TYPOGRAPHY STYLES        ││
│  │  • 12 semantic colors       │  │  • 2 font families          ││
│  │  • Backgrounds, text,       │  │  • 8+ text styles           ││
│  │    accents                  │  │  • Size, weight, spacing    ││
│  └─────────────────────────────┘  └─────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     SLIDE MASTER LAYER                           │
│  Master slides inherit from the Design System and define         │
│  layouts, placeholder positions, and default styling             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     CONTENT LAYER                                │
│  Individual slides inherit from Masters. Users can override      │
│  any property at this level for specific needs                   │
└─────────────────────────────────────────────────────────────────┘
```

### Key Concept: "Use Theme" vs "Override"

Every color and text style in your presentation can be either:

1. **Theme-Linked (Recommended)**: Uses a semantic reference like "Accent 1" or "Title Style"
2. **Overridden**: Uses a specific hardcoded value like "#FF5500" or "Arial 24pt"

**Why This Matters:**
- When you change the theme, all theme-linked elements update automatically
- Overridden elements stay fixed, allowing intentional exceptions

---

## Part 1: Color Theme System

### What is a Color Theme?

A Color Theme is a palette of **12 semantic colors** that define the visual identity of your presentation:

| Category | Colors | Purpose |
|----------|--------|---------|
| **Backgrounds** | Background 1, Background 2 | Slide backgrounds, containers, sections |
| **Text** | Text Primary, Text Secondary | Headlines, body copy, captions |
| **Accents** | Accent 1–6 | Highlights, buttons, icons, charts, decorations |
| **Links** | Hyperlink, Followed Link | Clickable text elements |

### User Journey: Choosing a Color Theme

#### Scenario A: "I want a quick, polished look"

1. **Open Color Theme Manager** (`Ctrl+Shift+C` or click "Colors" button in Property Inspector)
2. **Browse Presets Tab**: Filter by category (Professional, Creative, Dark, etc.)
3. **Hover on a preset**: See live preview on your canvas
4. **Click "Apply"**: Theme is applied to entire presentation
5. **Done!** All theme-linked colors update instantly

```
User thinks: "I want a dark, modern look for my tech presentation"
                              ↓
Action: Opens Color Theme Manager → Filters "Dark" → Clicks "Modern Dark"
                              ↓
Result: All slides update with dark backgrounds, light text, blue/purple accents
```

#### Scenario B: "I like this preset but want to tweak it"

1. **Start with a preset** (as above)
2. **Switch to Custom Tab**: See all 12 color slots
3. **Click a color swatch**: Opens color picker
4. **Adjust the color**: Use the picker, enter hex value, or use AI suggestion
5. **Changes are live**: See updates on canvas in real-time

```
User thinks: "Modern Dark is great but I want orange accents to match my brand"
                              ↓
Action: Applies "Modern Dark" → Custom Tab → Clicks Accent 1 → Changes to #FF6B00
                              ↓
Result: All elements using "Accent 1" (buttons, highlights, icons) turn orange
```

#### Scenario C: "I want AI to generate something unique"

1. **Open Color Theme Manager** → **AI Tab**
2. **Option 1 - From Image**: Drop your brand image, logo, or mood board
3. **Option 2 - From Description**: Describe what you want ("Warm sunset colors for a travel agency")
4. **Review Generated Options**: 3 variations to choose from
5. **Apply or Refine**: Select one, or ask AI to adjust ("Make it more vibrant")

### Using Theme Colors Throughout the App

#### In the Color Picker

Every color picker in the app shows **Theme Swatches** at the top:

```
┌──────────────────────────────────────────┐
│  Theme Colors  [Modern Dark ▼]            │  ← Quick preset switcher
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐           │
│  │B1│ │B2│ │T1│ │T2│ │A1│ │A2│           │  ← Click to use theme color
│  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘           │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐           │
│  │A3│ │A4│ │A5│ │A6│ │HL│ │FL│           │
│  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘           │
├──────────────────────────────────────────┤
│  [Color Picker / Custom Color Below]     │
└──────────────────────────────────────────┘
```

**Best Practice**: Always pick from Theme Colors when possible. This ensures:
- Consistency across your presentation
- Easy theme switching later
- Accessibility compliance (themes are designed with contrast in mind)

#### When to Override

Override with a custom color when:
- You need a one-off accent (e.g., a specific brand color on one slide)
- You're embedding external content that doesn't match the theme
- You intentionally want an element to NOT change with theme updates

### Color Theme Mental Model Summary

```
┌────────────────────────────────────────────────────────────────────┐
│                        YOUR PRESENTATION                            │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │                      COLOR THEME                              │  │
│   │   "Modern Dark" (or your custom theme)                        │  │
│   │                                                               │  │
│   │   B1: #1E1E1E  B2: #2D2D2D  T1: #FFFFFF  T2: #AAAAAA         │  │
│   │   A1: #18A0FB  A2: #7B61FF  A3: #1BC47D  A4: #F24822         │  │
│   │   A5: #FFBE0B  A6: #FF006E  HL: #0066CC  FL: #954F72         │  │
│   └────────────────────────────────┬─────────────────────────────┘  │
│                                    │                                 │
│                 References cascade down                              │
│                                    ↓                                 │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│   │    Slide 1      │  │    Slide 2      │  │    Slide 3      │    │
│   │  bg: "B1" ✓     │  │  bg: "B1" ✓     │  │  bg: #000 ✗     │    │
│   │  text: "T1" ✓   │  │  text: "T1" ✓   │  │  text: "T1" ✓   │    │
│   │  box: "A1" ✓    │  │  icon: "A2" ✓   │  │  logo: brand ✗  │    │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘    │
│         ↑                    ↑                    ↑                  │
│   Theme-linked         Theme-linked         Mixed: bg is            │
│   (updates with        (updates with        overridden, text        │
│   theme change)        theme change)        still theme-linked      │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

---

## Part 2: Typography Style System

### What are Typography Styles?

Typography Styles define the **fonts and text formatting** for your presentation:

| Component | What It Defines |
|-----------|-----------------|
| **Theme Fonts** | 2 font families: Heading Font & Body Font |
| **Text Styles** | Pre-defined combinations: Title, Subtitle, Body 1-5, Caption |

Each Text Style specifies:
- Which Theme Font to use (Heading or Body)
- Font weight (Bold, Regular, Light, etc.)
- Font size
- Line height
- Letter spacing
- Text transform (uppercase, etc.)

### User Journey: Setting Up Typography

#### Scenario A: "I want a cohesive font system quickly"

1. **Open Typography Style Manager** (`Ctrl+Shift+T` or click "Fonts" button)
2. **Browse Presets Tab**: Filter by category (Sans Serif, Serif, Mixed, etc.)
3. **Hover on a preset**: See live preview on canvas (title + body text)
4. **Click "Apply"**: Fonts and all text styles update
5. **Done!** Consistent typography across all slides

```
User thinks: "I want modern, clean fonts for a startup pitch"
                              ↓
Action: Opens Typography Manager → Filters "Sans Serif" → Clicks "Tech Forward"
                              ↓
Result: Titles become Space Grotesk Bold, body text becomes DM Sans Regular
```

#### Scenario B: "I want to customize text styles"

1. **Start with a preset** (as above)
2. **Switch to Custom Tab**: See Theme Fonts and all Text Styles
3. **Change Theme Fonts**: Select different font families for Heading/Body
4. **Edit Individual Styles**: Click "Edit" on Title, Subtitle, etc.
5. **Adjust properties**: Size, weight, spacing, color reference

```
User thinks: "I like Modern Sans but titles should be larger and use Accent 1 color"
                              ↓
Action: Custom Tab → Edit "Title" → Size: 44pt → 56pt, Color: "Accent 1"
                              ↓
Result: All Title text across presentation updates to larger, colored headings
```

#### Scenario C: "I need a custom style for quotes"

1. **Custom Tab** → Scroll to bottom → **"+ Add Custom Style"**
2. **Name it**: "Pull Quote"
3. **Configure**: Body Font, Italic, 24pt, Text Secondary color
4. **Save**: Style appears in Style dropdown when editing text
5. **Apply**: Select text → Choose "Pull Quote" from Style dropdown

### Text Style Inheritance

Understanding how text styles flow through your presentation:

```
┌────────────────────────────────────────────────────────────────────┐
│                      TYPOGRAPHY STYLES                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Theme Fonts                                                  │  │
│  │    Heading: Space Grotesk    Body: DM Sans                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                    │                                │
│                      Style definitions use                          │
│                      these as base fonts                            │
│                                    ↓                                │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │  Text Styles                                                    ││
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  ││
│  │  │   Title    │ │  Subtitle  │ │   Body 1   │ │  Caption   │  ││
│  │  │ Heading    │ │ Body       │ │ Body       │ │ Body       │  ││
│  │  │ Bold, 44pt │ │ Reg, 32pt  │ │ Reg, 28pt  │ │ Reg, 14pt  │  ││
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘  ││
│  └────────────────────────────────────────────────────────────────┘│
│                                    │                                │
│            Text elements reference these styles                     │
│                                    ↓                                │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                         SLIDES                                 │ │
│  │  ┌─────────────────────────┐  ┌─────────────────────────────┐ │ │
│  │  │  "Welcome!"             │  │  "Our Mission"              │ │ │
│  │  │   Style: Title ✓        │  │   Style: Title ✓            │ │ │
│  │  │                         │  │                             │ │ │
│  │  │  "Introduction to..."   │  │  "We believe in..."         │ │ │
│  │  │   Style: Body 1 ✓       │  │   Style: Body 1 ✓           │ │ │
│  │  └─────────────────────────┘  └─────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  When you change "Heading Font" to Poppins, all Title text updates! │
└────────────────────────────────────────────────────────────────────┘
```

### When to Override Text Styles

Use the text style system for most text. Override only when:
- You need a one-off formatting (e.g., a specific font for a logo recreation)
- You're matching external content that can't use your theme fonts
- You want manual control over specific text that should NOT auto-update

### Typography Mental Model Summary

```
User mindset:

"I pick fonts (Theme Fonts) and define how they're used (Text Styles).
 Then I just tag my text with style names. If I change my mind about
 fonts later, I change it in ONE place and everything updates."

Workflow:
                    
  1. Choose Fonts                2. Text Styles Auto-Update
     ┌─────────┐                    ┌─────────────────┐
     │ Heading │──┐                 │ Title: 44pt     │
     │ Poppins │  │   References    │ Subtitle: 32pt  │
     └─────────┘  ├────────────────►│ Body 1: 28pt    │
     ┌─────────┐  │                 │ Body 2: 24pt    │
     │  Body   │──┘                 │ ...             │
     │ Roboto  │                    └─────────────────┘
     └─────────┘                            │
                                            │
                                            ↓
                              3. All Tagged Text Updates
                                 ┌─────────────────────┐
                                 │ Slide 1: Title      │
                                 │ Slide 2: Title      │
                                 │ Slide 3: Body 1     │
                                 │ ...                 │
                                 └─────────────────────┘
```

---

## Part 3: Unified Design Workflow

### The Complete Mental Model

Color Themes and Typography Styles work together as your presentation's **Design System**:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              DESIGN SYSTEM                                │
│                                                                           │
│   ┌───────────────────────────┐    ┌────────────────────────────────┐   │
│   │      COLOR THEME          │    │      TYPOGRAPHY STYLES          │   │
│   │                           │    │                                 │   │
│   │  Visual Identity          │    │  Typographic Identity           │   │
│   │  • Brand colors           │    │  • Font personalities           │   │
│   │  • Mood & tone            │    │  • Hierarchy & rhythm           │   │
│   │  • Accessibility          │    │  • Readability                  │   │
│   └─────────────┬─────────────┘    └───────────────┬─────────────────┘   │
│                 │                                  │                      │
│                 └──────────────┬───────────────────┘                      │
│                                ↓                                          │
│                    ┌───────────────────────┐                             │
│                    │    SLIDE MASTERS      │                             │
│                    │                       │                             │
│                    │  Layouts that combine │                             │
│                    │  colors + typography  │                             │
│                    │  into reusable slides │                             │
│                    └───────────┬───────────┘                             │
│                                ↓                                          │
│                    ┌───────────────────────┐                             │
│                    │    YOUR CONTENT       │                             │
│                    │                       │                             │
│                    │  Focus on your        │                             │
│                    │  message, not         │                             │
│                    │  formatting!          │                             │
│                    └───────────────────────┘                             │
└──────────────────────────────────────────────────────────────────────────┘
```

### Recommended Workflow

#### Step 1: Start with Theme Selection
```
"Before creating content, choose your design system"

1. Open a new presentation
2. Open Color Theme Manager (Ctrl+Shift+C)
3. Browse presets or use AI to generate
4. Apply a theme that matches your brand/mood

5. Open Typography Style Manager (Ctrl+Shift+T)
6. Browse presets or customize
7. Apply fonts that complement your theme
```

#### Step 2: Create Content Using Theme References
```
"Always use theme colors and text styles"

When adding text:
  - Apply text styles (Title, Body 1, etc.)
  - Don't manually set font/size

When setting colors:
  - Pick from Theme Swatches in color picker
  - Use semantic names (Accent 1, Text Primary)
  - Avoid hardcoded hex values
```

#### Step 3: Iterate on the Design System
```
"Change the system, not individual elements"

Need different colors?
  - Go to Color Theme Manager → Custom tab
  - Edit the color slot
  - All linked elements update

Need different fonts?
  - Go to Typography Manager → Custom tab
  - Change Theme Fonts or edit Text Styles
  - All tagged text updates
```

### Quick Reference: Entry Points

| Task | Entry Point | Shortcut |
|------|-------------|----------|
| Change entire color palette | Color Theme Manager → Presets | `Ctrl+Shift+C` |
| Adjust specific theme color | Color Theme Manager → Custom | `Ctrl+Shift+C` |
| Generate colors from image/AI | Color Theme Manager → AI | `Ctrl+Shift+C` |
| Pick theme color for element | Any color picker → Theme Swatches | - |
| Change entire font system | Typography Manager → Presets | `Ctrl+Shift+T` |
| Adjust specific text style | Typography Manager → Custom | `Ctrl+Shift+T` |
| Apply text style to selection | Property Inspector → Style dropdown | - |

---

## Part 4: Common Scenarios & Solutions

### Scenario: "I need to match our brand guidelines"

**Solution:**
1. Open Color Theme Manager → Custom tab
2. Replace Accent 1 with your primary brand color
3. Replace Accent 2 with your secondary brand color
4. Adjust Background and Text colors as needed
5. Open Typography Manager → Custom tab
6. Set Heading Font to your brand headline font
7. Set Body Font to your brand body font
8. Save your theme for future presentations

### Scenario: "I'm presenting at a conference with a dark stage"

**Solution:**
1. Open Color Theme Manager → Presets → Filter "Dark"
2. Choose a dark theme (Modern Dark, Midnight, etc.)
3. All slides instantly adapt to dark backgrounds
4. Text becomes light, accents pop on dark

### Scenario: "My text is hard to read"

**Solution:**
1. Check if text uses theme colors (look for "T1" or "T2" swatch)
2. Open Color Theme Manager → Custom tab
3. Ensure sufficient contrast between Text Primary and Background 1
4. Themes are designed with WCAG accessibility in mind
5. If using overridden colors, switch to theme colors

### Scenario: "I want to try different looks quickly"

**Solution:**
1. Use the Theme Swatches preset dropdown in any color picker
2. Switch between presets without opening the full panel
3. Changes preview in real-time
4. When satisfied, the theme is already applied

### Scenario: "Some elements shouldn't change with the theme"

**Solution:**
1. This is an "override" situation
2. Set the element's color to a specific hex value (not a theme swatch)
3. Set text formatting manually instead of using a text style
4. These elements will be "immune" to theme changes
5. Use sparingly to maintain consistency

---

## Part 5: Best Practices

### DO ✓

- **Start with a preset** - Even if you'll customize, presets are professionally designed
- **Use theme colors everywhere** - Consistency is key to professional-looking presentations
- **Apply text styles** - Don't manually format each text element
- **Make global changes** - Edit the theme/styles, not individual elements
- **Save custom themes** - Reuse your brand setup across presentations

### DON'T ✗

- **Don't hardcode colors** - Use theme swatches instead of hex values
- **Don't skip text styles** - Always tag text with a style (Title, Body, etc.)
- **Don't over-customize** - Too many overrides defeat the purpose of a design system
- **Don't ignore contrast** - Ensure text is readable on backgrounds
- **Don't mix too many fonts** - Stick to the 2-font system (Heading + Body)

---

## Summary

The Color Theme and Typography Style systems are designed around one core principle:

> **Separate content from presentation**

By using semantic references (theme colors, text styles) instead of hardcoded values, you gain:

1. **Consistency** - Every slide looks cohesive
2. **Flexibility** - Change entire designs with a few clicks  
3. **Efficiency** - Focus on your message, not formatting
4. **Professionalism** - Leverage expertly designed presets

Think of it like CSS for presentations: define your design system once, apply it everywhere, update it globally.

---

## Related Documentation

- [Color Theme Manager Specification](./color-theme-manager.md)
- [Typography Style Manager Specification](./typography-style-manager.md)
- [Slide Master System](../slides/slide-master-system.md)
- [UI Design System](./ui-design-system.md)
- [Color Picker UI](../fills/color-picker-ui.md)
