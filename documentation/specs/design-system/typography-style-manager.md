# Typography Style Manager Specification

## Overview
The **Typography Style Manager** is a draggable, resizable flyout panel that allows users to manage, create, and customize typography styles (text styles) for their presentations. It provides preset style sets, manual customization, and AI-powered style generation.

**Panel Type:** Draggable, Resizable Flyout Panel

> **📖 User Experience Guide**: For a comprehensive understanding of how users should think about and use the Typography Style system, see the [Design System UX Guide](./design-system-ux-guide.md).

---

## 1. Entry Points (Information Architecture)

The Typography Style Manager can be accessed from multiple locations:

| Location | Trigger | Context |
|----------|---------|---------|
| **Main Menu** | `View → Typography Style Manager` | Global access |
| **Toolbar** | Click typography/Aa icon button | Always visible in toolbar |
| **Property Inspector (Slide)** | "Edit Theme Fonts..." button in Theme Fonts section | When no element selected |
| **Property Inspector (Master)** | "Customize Fonts..." button | When editing Slide Master |
| **Property Inspector (Text)** | "Manage Styles..." in Style Selector dropdown | When text element selected |
| **Keyboard Shortcut** | `Ctrl+Shift+T` (Windows) / `Cmd+Shift+T` (Mac) | Global |

### Toolbar Integration
```
┌─────────────────────────────────────────────────────────────────┐
│  [V] [H] [□] [T] [🖼] [📦]  │  [🎨 Theme] [Aa Styles]  │  [⚙]   │
└─────────────────────────────────────────────────────────────────┘
                                            ↑
                                    Typography Style Manager
```

---

## 2. Visual Design

### 2.1 Panel Specifications
- **Type**: Draggable, Resizable Flyout
- **Default Size**: `360px × 560px`
- **Min Size**: `320px × 450px`
- **Max Size**: `600px × 900px`
- **Background**: `--color-bg-panel` (`#2C2C2C`)
- **Border**: `1px solid --color-border` (`#444444`)
- **Corner Radius**: `--radius-md` (`8px`)
- **Shadow**: `0 8px 32px rgba(0,0,0,0.5)`

### 2.2 Resize & Drag Behavior
- **Drag Handle**: Panel header (title bar)
- **Resize Handles**: All four corners and edges
- **Snap to Edges**: Optional snap to viewport edges with 16px margin
- **Position Memory**: Remembers last position/size per session

---

## 3. Panel Layout

```
┌─────────────────────────────────────────────────────┐
│ ≡  Typography Style Manager                   ─ □ × │  ← Header (Draggable)
├─────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐                 │
│ │ Presets │ │ Custom  │ │   AI    │                 │  ← Tab Switcher
│ └─────────┘ └─────────┘ └─────────┘                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│              [Tab Content Area]                     │  ← Scrollable Content
│                                                     │
├─────────────────────────────────────────────────────┤
│  [Apply to Presentation]             [Save Styles]  │  ← Footer Actions
└─────────────────────────────────────────────────────┘
```

### 3.1 Header
| Element | Description |
|---------|-------------|
| **Drag Handle** | `≡` icon (hamburger) - indicates draggable |
| **Title** | "Typography Style Manager" |
| **Minimize** | `─` collapses to title bar only |
| **Float/Dock** | `□` toggles between floating and docked mode |
| **Close** | `×` closes the panel |

### 3.2 Tab Switcher
Three main tabs for different workflows:
- **Presets**: Browse and apply pre-built typography style sets
- **Custom**: Edit current styles manually
- **AI**: Generate styles using AI assistance

---

## 4. Tab 1: Presets

### 4.1 Layout
```
┌─────────────────────────────────────────────────────┐
│  Search: [🔍 Search style sets...          ]        │
├─────────────────────────────────────────────────────┤
│  Category: [All Categories ▼]                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────────┐│
│  │ Modern Sans                              [Apply]││
│  │ ┌─────────────────────────────────────────────┐ ││
│  │ │ Heading                                     │ ││
│  │ │ Body text sample                            │ ││
│  │ └─────────────────────────────────────────────┘ ││
│  │ Inter Bold / Inter Regular                      ││
│  └─────────────────────────────────────────────────┘│
│                                                     │
│  ┌─────────────────────────────────────────────────┐│
│  │ Classic Serif                            [Apply]││
│  │ ┌─────────────────────────────────────────────┐ ││
│  │ │ Heading                                     │ ││
│  │ │ Body text sample                            │ ││
│  │ └─────────────────────────────────────────────┘ ││
│  │ Playfair Display / Source Serif Pro             ││
│  └─────────────────────────────────────────────────┘│
│                                                     │
│  ... (scrollable)                                   │
└─────────────────────────────────────────────────────┘
```

### 4.2 Preset Categories
| Category | Description |
|----------|-------------|
| **All** | Show all style sets |
| **Sans Serif** | Clean, modern sans-serif pairings |
| **Serif** | Classic, traditional serif pairings |
| **Mixed** | Serif + Sans combinations |
| **Display** | Decorative headings with readable body |
| **Monospace** | Technical, code-focused styles |
| **Handwritten** | Casual, personal feel |

### 4.3 Built-in Preset Style Sets

#### Modern Sans Serif Sets
| Set Name | Heading Font | Body Font | Character |
|----------|--------------|-----------|-----------|
| **Modern Clean** | Inter Bold | Inter Regular | Professional, neutral |
| **Geometric** | Poppins SemiBold | Poppins Regular | Friendly, approachable |
| **Swiss** | Helvetica Neue Bold | Helvetica Neue | Classic, reliable |
| **Tech Forward** | Space Grotesk Bold | DM Sans Regular | Modern, digital |
| **Humanist** | Open Sans Bold | Open Sans Regular | Warm, readable |

#### Classic Serif Sets
| Set Name | Heading Font | Body Font | Character |
|----------|--------------|-----------|-----------|
| **Editorial** | Playfair Display Bold | Source Serif Pro | Elegant, refined |
| **Traditional** | Georgia Bold | Georgia Regular | Reliable, familiar |
| **Literary** | Merriweather Bold | Merriweather Regular | Scholarly, serious |
| **Elegant** | Cormorant Garamond SemiBold | EB Garamond | Sophisticated, classic |

#### Mixed Pairings
| Set Name | Heading Font | Body Font | Character |
|----------|--------------|-----------|-----------|
| **Professional Mix** | Montserrat Bold | Lora Regular | Modern + traditional |
| **Creative Mix** | Oswald Medium | Roboto Regular | Bold + clean |
| **Contrast** | Playfair Display | Raleway Regular | Elegant + geometric |
| **Editorial Modern** | DM Serif Display | DM Sans Regular | Striking + readable |

#### Display Sets
| Set Name | Heading Font | Body Font | Character |
|----------|--------------|-----------|-----------|
| **Bold Statement** | Anton Regular | Roboto Regular | Impactful, strong |
| **Startup** | Righteous Regular | Nunito Regular | Energetic, modern |
| **Fashion** | Bebas Neue | Lato Regular | Stylish, high-impact |

#### Monospace Sets
| Set Name | Heading Font | Body Font | Character |
|----------|--------------|-----------|-----------|
| **Developer** | JetBrains Mono Bold | JetBrains Mono Regular | Technical, precise |
| **Retro Tech** | IBM Plex Mono Bold | IBM Plex Mono Regular | Nostalgic, functional |
| **Code** | Fira Code Medium | Fira Code Regular | Modern coding |

### 4.4 Preset Card Details

Each preset card shows:
- **Set Name**: Title of the style set
- **Preview**: Live preview with heading and body text samples
- **Font Names**: Heading and body font families
- **Apply Button**: One-click application

### 4.5 Preset Card Interactions
| Action | Behavior |
|--------|----------|
| **Hover** | Expands to show full style details |
| **Click** | Selects set, shows live preview on canvas |
| **Double-click** | Applies set immediately |
| **Right-click** | Context menu: Apply, Duplicate, Edit Copy |

---

## 5. Tab 2: Custom

### 5.1 Layout
```
┌─────────────────────────────────────────────────────┐
│  Current Style Set: [Modern Clean ▼]                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  THEME FONTS                                        │
│  ┌────────────────────────────────────────────────┐│
│  │ Heading Font                                   ││
│  │ Family: [Inter            ▼]                  ││
│  │ Weight: [Bold             ▼]                  ││
│  │                                                ││
│  │ Body Font                                      ││
│  │ Family: [Inter            ▼]                  ││
│  │ Weight: [Regular          ▼]                  ││
│  └────────────────────────────────────────────────┘│
│                                                     │
│  TEXT STYLES                                        │
│  ┌────────────────────────────────────────────────┐│
│  │ ┌──────────────────────────────────────────┐  ││
│  │ │ Title                              [Edit]│  ││
│  │ │ Inter Bold, 44pt                         │  ││
│  │ └──────────────────────────────────────────┘  ││
│  │ ┌──────────────────────────────────────────┐  ││
│  │ │ Subtitle                           [Edit]│  ││
│  │ │ Inter Regular, 32pt                      │  ││
│  │ └──────────────────────────────────────────┘  ││
│  │ ┌──────────────────────────────────────────┐  ││
│  │ │ Body Level 1                       [Edit]│  ││
│  │ │ Inter Regular, 28pt                      │  ││
│  │ └──────────────────────────────────────────┘  ││
│  │ ┌──────────────────────────────────────────┐  ││
│  │ │ Body Level 2                       [Edit]│  ││
│  │ │ Inter Regular, 24pt                      │  ││
│  │ └──────────────────────────────────────────┘  ││
│  │ ┌──────────────────────────────────────────┐  ││
│  │ │ Body Level 3                       [Edit]│  ││
│  │ │ Inter Regular, 20pt                      │  ││
│  │ └──────────────────────────────────────────┘  ││
│  │                                                ││
│  │ [+ Add Custom Style]                          ││
│  └────────────────────────────────────────────────┘│
│                                                     │
│  [Reset to Default]                                 │
└─────────────────────────────────────────────────────┘
```

### 5.2 Theme Fonts Section
The two primary font definitions used throughout the presentation:

| Font Role | Purpose | Usage |
|-----------|---------|-------|
| **Heading Font** | Display text | Titles, headers, callouts |
| **Body Font** | Reading text | Paragraphs, lists, captions |

### 5.3 Text Style Definitions

| Style Name | Default Font | Default Size | Usage |
|------------|--------------|--------------|-------|
| **Title** | Heading, Bold | 44pt | Slide titles |
| **Subtitle** | Body, Regular | 32pt | Slide subtitles |
| **Body Level 1** | Body, Regular | 28pt | Main bullet points |
| **Body Level 2** | Body, Regular | 24pt | Sub-bullets |
| **Body Level 3** | Body, Regular | 20pt | Sub-sub-bullets |
| **Body Level 4** | Body, Regular | 18pt | Deeper nesting |
| **Body Level 5** | Body, Regular | 16pt | Deepest nesting |
| **Caption** | Body, Regular | 14pt | Image captions, footnotes |

### 5.4 Style Editor Flyout
Clicking [Edit] expands inline or opens a sub-panel:

```
┌─────────────────────────────────────────────────────┐
│  EDITING: Title                              [Done] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Font                                               │
│  Family: [Inter            ▼]                       │
│  Weight: [Bold             ▼]                       │
│  Style:  [Normal           ▼]                       │
│                                                     │
│  Size                                               │
│  Size:   [44    ] pt                                │
│                                                     │
│  Spacing                                            │
│  Line Height:    [Auto     ] ▼                      │
│  Letter Spacing: [0        ] %                      │
│                                                     │
│  Color                                              │
│  Use Theme Color: [Text Primary ▼]                  │
│  Or Custom:       [■] #333333                       │
│                                                     │
│  Transform                                          │
│  Case: [None ▼]  (None, Uppercase, Lowercase, etc.) │
│                                                     │
│  Preview                                            │
│  ┌─────────────────────────────────────────────────┐│
│  │                                                 ││
│  │     Sample Title Text                           ││
│  │                                                 ││
│  └─────────────────────────────────────────────────┘│
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 5.5 Custom Styles
Users can create additional named styles beyond the defaults:
- Click [+ Add Custom Style]
- Name the style (e.g., "Quote", "Code Block", "Highlight")
- Configure all typography properties
- Style appears in text element Style Selector dropdown

---

## 6. Tab 3: AI

### 6.1 Layout
```
┌─────────────────────────────────────────────────────┐
│  GENERATE WITH AI                                   │
│  ┌────────────────────────────────────────────────┐│
│  │ Describe the typography style you want:        ││
│  │ ┌────────────────────────────────────────────┐ ││
│  │ │ Professional and modern, easy to read      │ ││
│  │ │ with a slight tech feel. Good for          │ ││
│  │ │ software product presentations...          │ ││
│  │ └────────────────────────────────────────────┘ ││
│  │                                                ││
│  │ Mood:     [Professional  ▼]                   ││
│  │ Industry: [Technology    ▼]                   ││
│  │                                                ││
│  │             [✨ Generate Styles]               ││
│  └────────────────────────────────────────────────┘│
│                                                     │
│  MODIFY EXISTING                                    │
│  ┌────────────────────────────────────────────────┐│
│  │ Current: Modern Clean                          ││
│  │                                                ││
│  │ Modification request:                          ││
│  │ ┌────────────────────────────────────────────┐ ││
│  │ │ Make headings more impactful, increase     │ ││
│  │ │ the size contrast between title and body   │ ││
│  │ └────────────────────────────────────────────┘ ││
│  │                                                ││
│  │             [✨ Modify Styles]                 ││
│  └────────────────────────────────────────────────┘│
│                                                     │
│  GENERATED RESULTS                                  │
│  ┌────────────────────────────────────────────────┐│
│  │  (Results appear here after generation)       ││
│  └────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

### 6.2 AI Generation Options

#### Mood Dropdown
| Option | Description | Typical Output |
|--------|-------------|----------------|
| **Professional** | Business, corporate | Clean sans-serif, moderate sizes |
| **Creative** | Artistic, expressive | Display fonts, varied weights |
| **Playful** | Fun, casual | Rounded fonts, larger sizes |
| **Elegant** | Sophisticated, refined | Serif headings, graceful proportions |
| **Bold** | Strong, impactful | Heavy weights, large titles |
| **Minimal** | Simple, understated | Light weights, tight spacing |

#### Industry Dropdown
| Option | Description |
|--------|-------------|
| **Technology** | Modern, digital feel |
| **Finance** | Traditional, trustworthy |
| **Healthcare** | Clean, accessible |
| **Education** | Readable, friendly |
| **Fashion** | Stylish, contemporary |
| **Food & Beverage** | Warm, inviting |
| **Real Estate** | Professional, established |
| **Entertainment** | Dynamic, engaging |

### 6.3 AI Generation Flow
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ User enters  │ ──► │ AI processes │ ──► │ 3 variations │
│ prompt/mood  │     │ request      │     │ generated    │
└──────────────┘     └──────────────┘     └──────────────┘
                                                │
                                                ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ User selects │ ◄── │ Preview on   │ ◄── │ User reviews │
│ & applies    │     │ canvas       │     │ options      │
└──────────────┘     └──────────────┘     └──────────────┘
```

### 6.4 Generated Results Display
```
┌─────────────────────────────────────────────────────┐
│  GENERATED RESULTS                                  │
│  ┌─────────────────────────────────────────────────┐│
│  │ Variation 1: "Tech Professional"        [Apply]││
│  │ ┌─────────────────────────────────────────────┐ ││
│  │ │ Heading Sample                              │ ││
│  │ │ Body text sample here                       │ ││
│  │ └─────────────────────────────────────────────┘ ││
│  │ Space Grotesk Bold / DM Sans Regular            ││
│  └─────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────┐│
│  │ Variation 2: "Modern Clarity"           [Apply]││
│  │ ┌─────────────────────────────────────────────┐ ││
│  │ │ Heading Sample                              │ ││
│  │ │ Body text sample here                       │ ││
│  │ └─────────────────────────────────────────────┘ ││
│  │ Inter Bold / Inter Regular                      ││
│  └─────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────┐│
│  │ Variation 3: "Sharp & Clean"            [Apply]││
│  │ ┌─────────────────────────────────────────────┐ ││
│  │ │ Heading Sample                              │ ││
│  │ │ Body text sample here                       │ ││
│  │ └─────────────────────────────────────────────┘ ││
│  │ Barlow SemiBold / Source Sans Pro Regular       ││
│  └─────────────────────────────────────────────────┘│
│                                                     │
│  [🔄 Regenerate]  [✏️ Refine: "More contrast..."]  │
└─────────────────────────────────────────────────────┘
```

### 6.5 Modification Examples
Common modification requests the AI can handle:
- "Make the headings larger and bolder"
- "Use a serif font for headings only"
- "Increase line spacing for better readability"
- "Make it feel more casual/friendly"
- "Reduce the number of font sizes used"
- "Add more contrast between heading levels"

---

## 7. Footer Actions

| Button | Behavior |
|--------|----------|
| **Apply to Presentation** | Applies selected/edited styles to entire presentation |
| **Save Styles** | Saves current style set to user's custom library |

---

## 8. Data Model

### 8.1 Typography Style Set Schema
```javascript
TypographyStyleSet: {
  id: "styles-uuid",
  name: "Modern Clean",
  category: "custom",     // "preset" | "custom" | "ai-generated"
  source: null,           // null | "preset-name" | "ai"
  
  // Theme-level fonts
  fonts: {
    heading: {
      family: "Inter",
      weight: "700",
      fallback: "system-ui, sans-serif"
    },
    body: {
      family: "Inter",
      weight: "400",
      fallback: "system-ui, sans-serif"
    }
  },
  
  // Named text styles
  styles: {
    title: {
      fontFamily: "heading",    // References fonts.heading
      fontSize: 44,
      fontWeight: "700",
      lineHeight: 1.2,
      letterSpacing: -0.02,
      textTransform: "none",
      color: "text1"            // References theme color
    },
    subtitle: {
      fontFamily: "body",
      fontSize: 32,
      fontWeight: "400",
      lineHeight: 1.3,
      letterSpacing: 0,
      textTransform: "none",
      color: "text2"
    },
    bodyLevel1: {
      fontFamily: "body",
      fontSize: 28,
      fontWeight: "400",
      lineHeight: 1.5,
      letterSpacing: 0,
      textTransform: "none",
      color: "text1"
    },
    bodyLevel2: {
      fontFamily: "body",
      fontSize: 24,
      fontWeight: "400",
      lineHeight: 1.5,
      letterSpacing: 0,
      textTransform: "none",
      color: "text1"
    },
    bodyLevel3: {
      fontFamily: "body",
      fontSize: 20,
      fontWeight: "400",
      lineHeight: 1.5,
      letterSpacing: 0,
      textTransform: "none",
      color: "text2"
    },
    bodyLevel4: {
      fontFamily: "body",
      fontSize: 18,
      fontWeight: "400",
      lineHeight: 1.5,
      letterSpacing: 0,
      textTransform: "none",
      color: "text2"
    },
    bodyLevel5: {
      fontFamily: "body",
      fontSize: 16,
      fontWeight: "400",
      lineHeight: 1.5,
      letterSpacing: 0,
      textTransform: "none",
      color: "text2"
    },
    caption: {
      fontFamily: "body",
      fontSize: 14,
      fontWeight: "400",
      lineHeight: 1.4,
      letterSpacing: 0,
      textTransform: "none",
      color: "text2"
    }
    // Custom styles can be added here
  },
  
  metadata: {
    createdAt: "2025-11-25T12:00:00Z",
    modifiedAt: "2025-11-25T12:00:00Z",
    aiPrompt: null        // Stores AI prompt if AI-generated
  }
}
```

### 8.2 Store Integration
```javascript
// In presentation store
presentation: {
  theme: {
    colorTheme: { /* ColorTheme object */ },
    typographyStyles: { /* TypographyStyleSet object */ }
  },
  // ... rest of presentation
}
```

---

## 9. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+T` | Open Typography Style Manager |
| `Escape` | Close panel |
| `Enter` (in AI prompt) | Generate styles |
| `Tab` | Navigate between sections |
| `Arrow keys` | Navigate preset list |

---

## 10. Accessibility

- Full keyboard navigation
- ARIA labels for all interactive elements
- Live preview updates announced to screen readers
- Font size previews use actual fonts for visual accuracy
- Focus trap within panel when open
- High contrast mode support

---

## 11. Font Loading & Availability

### 11.1 Google Fonts Integration
- All preset fonts are Google Fonts for universal availability
- Fonts are loaded on-demand when selected
- Font loading status indicator in UI

### 11.2 Font Picker
- Searchable font list
- Recently used fonts section
- Font preview in dropdown
- Group by: All, Sans-Serif, Serif, Display, Monospace, Handwriting

### 11.3 Custom Font Upload *(Future)*
- Upload .woff, .woff2, .ttf, .otf files
- Font stored with presentation
- Licensing responsibility notice

---

## 12. Implementation Notes

### 12.1 Live Preview
- Apply styles temporarily during hover/selection
- Debounce preview updates (100ms)
- Revert on cancel/close

### 12.2 AI Integration
- Use existing AI service infrastructure
- Structured prompt for font pairing recommendations
- Include readability and contrast considerations
- Fallback to presets if AI unavailable

### 12.3 Font Loading Strategy
```javascript
// Lazy load fonts only when needed
async function loadFont(family, weight) {
  const font = new FontFace(family, `url(${getFontUrl(family, weight)})`);
  await font.load();
  document.fonts.add(font);
}
```

---

## 13. State Memory System

The Typography Style Manager and typography controls implement a memory system to preserve user preferences. See [Property Memory System](../core/property-memory-system.md) for full specification.

### 13.1 Session Memory

While editing typography, settings are preserved:

| Setting | Remembered |
|---------|------------|
| Font Family | ✅ |
| Font Weight | ✅ |
| Font Style | ✅ |
| Font Size | ✅ |
| Line Height | ✅ |
| Letter Spacing | ✅ |
| Text Align | ✅ |
| Vertical Align | ✅ |
| Text Decoration | ✅ |
| Text Transform | ✅ |
| Active Tab | ✅ |

### 13.2 Persistent Memory (Across Sessions)

Only commonly-reused settings persist to localStorage:

| Setting | Persisted | Reason |
|---------|-----------|--------|
| Font Family | ✅ Yes | Users have brand fonts |
| Font Weight | ✅ Yes | Common preference |
| Font Style | ✅ Yes | Italic preference |
| Text Align | ✅ Yes | User preference |
| Vertical Align | ✅ Yes | User preference |
| Font Size | ❌ No | Too context-specific |
| Line Height | ❌ No | Too context-specific |
| Letter Spacing | ❌ No | Rarely default |
| Text Decoration | ❌ No | Rarely default |
| Text Transform | ❌ No | Rarely default |

### 13.3 Storage Key

Typography memory is stored at:
```
story.memory.typography
```

### 13.4 Text Color Memory

Text color uses the fill memory system with context key `fill.text`. This is separate from object fills and stroke colors.

---

## 14. Related Documents
- [Design System UX Guide](./design-system-ux-guide.md) - Mental model and user experience
- [Property Memory System](../core/property-memory-system.md) - Memory persistence rules
- [Property Inspector: Typography](../property-inspector/property-inspector-typography.md)
- [Slide Master System](../slides/slide-master-system.md)
- [UI Design System](./ui-design-system.md)
- [Color Theme Manager](./color-theme-manager.md)
