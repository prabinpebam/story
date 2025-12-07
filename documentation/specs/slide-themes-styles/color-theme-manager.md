# Color Theme Manager Specification

## Overview
The **Color Theme Manager** is a draggable, resizable flyout panel that allows users to manage, create, and customize color themes for their presentations. It provides preset themes, AI-powered generation, and image-based palette extraction.

**Panel Type:** Draggable, Resizable Flyout Panel

> **📖 User Experience Guide**: For a comprehensive understanding of how users should think about and use the Color Theme system, see the [Presentation Design UX Guide](./presentation-design-ux-guide.md).

---

## 1. Entry Points (Information Architecture)

The Color Theme Manager can be accessed from multiple locations:

| Location | Trigger | Context |
|----------|---------|---------|
| **Main Menu** | `View → Color Theme Manager` | Global access |
| **Toolbar** | Click theme/palette icon button | Always visible in toolbar |
| **Property Inspector (Slide)** | "Edit Theme Colors..." button in Theme Colors section | When no element selected |
| **Property Inspector (Master)** | "Customize Colors..." button | When editing Slide Master |
| **Color Picker** | "Theme Colors" section → gear icon | When picking any color |
| **Keyboard Shortcut** | `Ctrl+Shift+C` (Windows) / `Cmd+Shift+C` (Mac) | Global |

### Toolbar Integration
```
┌─────────────────────────────────────────────────────────────────┐
│  [V] [H] [□] [T] [🖼] [📦]  │  [🎨 Theme] [Aa Styles]  │  [⚙]   │
└─────────────────────────────────────────────────────────────────┘
                               ↑
                        Color Theme Manager
```

---

## 2. Visual Design

### 2.1 Panel Specifications
- **Type**: Draggable, Resizable Flyout
- **Default Size**: `320px × 480px`
- **Min Size**: `280px × 400px`
- **Max Size**: `500px × 800px`
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
│ ≡  Color Theme Manager                        ─ □ × │  ← Header (Draggable)
├─────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐                 │
│ │ Presets │ │ Custom  │ │   AI    │                 │  ← Tab Switcher
│ └─────────┘ └─────────┘ └─────────┘                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│              [Tab Content Area]                     │  ← Scrollable Content
│                                                     │
├─────────────────────────────────────────────────────┤
│  [Apply to Presentation]              [Save Theme]  │  ← Footer Actions
└─────────────────────────────────────────────────────┘
```

### 3.1 Header
| Element | Description |
|---------|-------------|
| **Drag Handle** | `≡` icon (hamburger) - indicates draggable |
| **Title** | "Color Theme Manager" |
| **Minimize** | `─` collapses to title bar only |
| **Float/Dock** | `□` toggles between floating and docked mode |
| **Close** | `×` closes the panel |

### 3.2 Tab Switcher
Three main tabs for different workflows:
- **Presets**: Browse and apply pre-built color themes
- **Custom**: Edit current theme colors manually
- **AI**: Generate themes using AI or image extraction

---

## 4. Tab 1: Presets

### 4.1 Layout
```
┌─────────────────────────────────────────────────────┐
│  Search: [🔍 Search themes...              ]        │
├─────────────────────────────────────────────────────┤
│  Category: [All Categories ▼]                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ ■■■■■■■■■   │  │ ■■■■■■■■■   │  │ ■■■■■■■■■   │ │
│  │ Modern Dark │  │ Ocean Blue  │  │ Forest      │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
│                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ ■■■■■■■■■   │  │ ■■■■■■■■■   │  │ ■■■■■■■■■   │ │
│  │ Sunset      │  │ Corporate   │  │ Minimal     │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
│                                                     │
│  ... (scrollable)                                   │
└─────────────────────────────────────────────────────┘
```

### 4.2 Preset Categories
| Category | Description |
|----------|-------------|
| **All** | Show all themes |
| **Professional** | Business, corporate themes |
| **Creative** | Bold, artistic themes |
| **Minimal** | Clean, simple themes |
| **Dark** | Dark mode optimized |
| **Light** | Light mode optimized |
| **Colorful** | Vibrant, multi-color themes |
| **Monochromatic** | Single-hue themes |

### 4.3 Built-in Presets

#### Professional Themes
| Theme Name | Background 1 | Background 2 | Text 1 | Text 2 | Accent 1 | Accent 2 |
|------------|--------------|--------------|--------|--------|----------|----------|
| **Corporate Blue** | #FFFFFF | #F5F5F5 | #1A1A2E | #4A4A68 | #0066CC | #004499 |
| **Executive** | #FFFFFF | #F8F8F8 | #2C3E50 | #7F8C8D | #2980B9 | #8E44AD |
| **Professional Gray** | #FFFFFF | #EEEEEE | #333333 | #666666 | #444444 | #888888 |

#### Creative Themes
| Theme Name | Background 1 | Background 2 | Text 1 | Text 2 | Accent 1 | Accent 2 |
|------------|--------------|--------------|--------|--------|----------|----------|
| **Sunset Gradient** | #FFF5E6 | #FFE0B2 | #5D4037 | #8D6E63 | #FF6B35 | #F7C59F |
| **Ocean Breeze** | #E3F2FD | #BBDEFB | #1565C0 | #42A5F5 | #0288D1 | #00BCD4 |
| **Forest Green** | #E8F5E9 | #C8E6C9 | #2E7D32 | #66BB6A | #4CAF50 | #8BC34A |

#### Dark Themes
| Theme Name | Background 1 | Background 2 | Text 1 | Text 2 | Accent 1 | Accent 2 |
|------------|--------------|--------------|--------|--------|----------|----------|
| **Modern Dark** | #1E1E1E | #2D2D2D | #FFFFFF | #AAAAAA | #18A0FB | #7B61FF |
| **Midnight** | #0D1117 | #161B22 | #C9D1D9 | #8B949E | #58A6FF | #F78166 |
| **Deep Purple** | #1A1A2E | #16213E | #E8E8E8 | #A8A8B8 | #7B68EE | #9D4EDD |

#### Minimal Themes
| Theme Name | Background 1 | Background 2 | Text 1 | Text 2 | Accent 1 | Accent 2 |
|------------|--------------|--------------|--------|--------|----------|----------|
| **Pure White** | #FFFFFF | #FAFAFA | #000000 | #555555 | #000000 | #333333 |
| **Soft Gray** | #F5F5F5 | #EBEBEB | #212121 | #757575 | #424242 | #9E9E9E |
| **Paper** | #FFFEF5 | #F5F4E8 | #3D3D3D | #6B6B6B | #C9A227 | #8B7355 |

### 4.4 Preset Card Interactions
| Action | Behavior |
|--------|----------|
| **Hover** | Shows full color palette, highlights card |
| **Click** | Selects theme, shows preview on canvas |
| **Double-click** | Applies theme immediately |
| **Right-click** | Context menu: Apply, Duplicate, Edit Copy |

---

## 5. Tab 2: Custom

### 5.1 Layout
```
┌─────────────────────────────────────────────────────┐
│  Current Theme: [Modern Dark ▼]                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  BACKGROUND COLORS                                  │
│  ┌────────────────────────────────────────────────┐│
│  │ Background 1    [■] #1E1E1E    [Edit]         ││
│  │ Background 2    [■] #2D2D2D    [Edit]         ││
│  └────────────────────────────────────────────────┘│
│                                                     │
│  TEXT COLORS                                        │
│  ┌────────────────────────────────────────────────┐│
│  │ Text Primary    [■] #FFFFFF    [Edit]         ││
│  │ Text Secondary  [■] #AAAAAA    [Edit]         ││
│  └────────────────────────────────────────────────┘│
│                                                     │
│  ACCENT COLORS                                      │
│  ┌────────────────────────────────────────────────┐│
│  │ Accent 1        [■] #18A0FB    [Edit]         ││
│  │ Accent 2        [■] #7B61FF    [Edit]         ││
│  │ Accent 3        [■] #1BC47D    [Edit]         ││
│  │ Accent 4        [■] #F24822    [Edit]         ││
│  │ Accent 5        [■] #FFBE0B    [Edit]         ││
│  │ Accent 6        [■] #FF006E    [Edit]         ││
│  └────────────────────────────────────────────────┘│
│                                                     │
│  SEMANTIC COLORS                                    │
│  ┌────────────────────────────────────────────────┐│
│  │ Hyperlink       [■] #0066CC    [Edit]         ││
│  │ Followed Link   [■] #954F72    [Edit]         ││
│  └────────────────────────────────────────────────┘│
│                                                     │
│  [Reset to Default]                                 │
└─────────────────────────────────────────────────────┘
```

### 5.2 Color Role Definitions

| Role | Purpose | Usage |
|------|---------|-------|
| **Background 1** | Primary slide background | Main canvas color |
| **Background 2** | Secondary/alternate background | Sections, cards, containers |
| **Text Primary** | Main text color | Titles, body text |
| **Text Secondary** | Secondary text | Subtitles, captions, muted text |
| **Accent 1** | Primary accent | Key highlights, primary buttons |
| **Accent 2** | Secondary accent | Secondary highlights, icons |
| **Accent 3-6** | Additional accents | Charts, decorations, variety |
| **Hyperlink** | Link text | Clickable links |
| **Followed Link** | Visited link | Previously clicked links |

### 5.3 Color Editor Flyout
Clicking [Edit] opens the standard Color Picker with:
- Full HSB/RGB/Hex editing
- Eyedropper tool
- Recent colors from document

---

## 6. Tab 3: AI

### 6.1 Layout
```
┌─────────────────────────────────────────────────────┐
│  GENERATE FROM IMAGE                                │
│  ┌────────────────────────────────────────────────┐│
│  │                                                ││
│  │     ┌──────────────────────┐                   ││
│  │     │   📷                 │                   ││
│  │     │   Drop image here    │                   ││
│  │     │   or click to upload │                   ││
│  │     └──────────────────────┘                   ││
│  │                                                ││
│  └────────────────────────────────────────────────┘│
│                                                     │
│  ─────────────── OR ───────────────                 │
│                                                     │
│  GENERATE WITH AI                                   │
│  ┌────────────────────────────────────────────────┐│
│  │ Describe the theme you want:                   ││
│  │ ┌────────────────────────────────────────────┐││
│  │ │ A warm, autumnal palette with rich         │││
│  │ │ oranges and deep browns...                 │││
│  │ │                                            │││
│  │ └────────────────────────────────────────────┘││
│  │                                                ││
│  │ Style hints: [Professional ▼]                 ││
│  │                                                ││
│  │             [✨ Generate Theme]                ││
│  └────────────────────────────────────────────────┘│
│                                                     │
│  GENERATED RESULTS                                  │
│  ┌────────────────────────────────────────────────┐│
│  │  (Results appear here after generation)       ││
│  └────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

### 6.2 Image-Based Palette Extraction

#### Drag & Drop Area
- **Visual**: Dashed border, icon, instructional text
- **States**: Default, Drag Over (highlight), Processing, Complete
- **Supported Formats**: JPG, PNG, WebP, GIF

#### Extraction Process
1. User drops/uploads image
2. Image thumbnail appears in drop zone
3. "Extracting colors..." loading state
4. Algorithm extracts dominant colors
5. Generated palette preview appears
6. User can adjust/accept

#### Extraction Algorithm
```
Input: Image file
Output: 10-color palette mapped to theme roles

Process:
1. Resize image to 200x200 for performance
2. Apply k-means clustering (k=10) to find dominant colors
3. Sort colors by luminance
4. Map to theme roles:
   - Darkest → Background 1 (dark theme) or Text 1 (light theme)
   - Lightest → Background 1 (light theme) or Text 1 (dark theme)
   - Most saturated → Accent colors
   - Mid-tones → Text Secondary, Background 2
5. Ensure sufficient contrast ratios (WCAG AA)
6. Generate complementary colors if needed
```

### 6.3 AI Generation

#### Prompt Input
- **Type**: Multi-line text area
- **Placeholder**: "Describe your ideal color theme..."
- **Examples**:
  - "A calm, professional theme with navy blue and silver accents"
  - "Vibrant startup energy with electric purple and cyan"
  - "Earthy, organic feel with greens and warm browns"

#### Style Hints Dropdown
| Option | Description |
|--------|-------------|
| **Auto** | AI determines best style |
| **Professional** | Corporate, trustworthy |
| **Creative** | Bold, artistic |
| **Playful** | Fun, energetic |
| **Elegant** | Sophisticated, refined |
| **Technical** | Modern, digital |

#### AI Generation Flow
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ User enters  │ ──► │ AI processes │ ──► │ 3 variations │
│ prompt       │     │ request      │     │ generated    │
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
│  │ Variation 1                          [Apply]   ││
│  │ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■                           ││
│  └─────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────┐│
│  │ Variation 2                          [Apply]   ││
│  │ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■                           ││
│  └─────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────┐│
│  │ Variation 3                          [Apply]   ││
│  │ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■                           ││
│  └─────────────────────────────────────────────────┘│
│                                                     │
│  [🔄 Regenerate]  [✏️ Modify: "Make it warmer..."] │
└─────────────────────────────────────────────────────┘
```

### 6.5 Modify Existing Theme
- **Input**: Text field for modification instructions
- **Examples**:
  - "Make the accents more vibrant"
  - "Shift towards cooler tones"
  - "Increase contrast between text and background"
  - "Add a complementary accent color"

---

## 7. Export/Import Themes

### 7.1 Export Theme to JSON
Users can export any theme (presets or custom) as a JSON file for backup or sharing.

#### Export Button Location
- Located in the theme editor header (right side, next to duplicate button)
- Icon: File export icon
- Tooltip: "Export Theme as JSON"

#### Export File Format
```javascript
{
  "schemaVersion": "1.0",
  "exportedAt": "2025-12-02T12:00:00.000Z",
  "theme": {
    "name": "My Custom Theme",
    "slots": [
      { "h": 220, "s": 15 },  // Slot 1: hue (0-360), saturation (0-100)
      { "h": 220, "s": 20 },  // Slot 2
      // ... 12 slots total
    ],
    "adjustments": {
      "brightness": 0,      // -100 to +100
      "contrast": 0,
      "highlights": 0,
      "shadows": 0,
      "whites": 0,
      "blacks": 0,
      "saturation": 0
    }
  }
}
```

#### Export Behavior
1. Click export button on any theme
2. JSON file downloads automatically
3. Filename: `{theme-name}.theme.json` (sanitized)

### 7.2 Import Theme from JSON
Users can import previously exported theme files.

#### Import Button Location
- Located in the theme list header (top left, next to "New Theme" and "Extract from Image")
- Icon: File import icon
- Tooltip: "Import Theme from JSON"

#### Import Process
1. Click import button
2. File picker opens (accepts `.json` files)
3. File is validated against schema
4. If valid, theme is added to Custom Themes
5. Newly imported theme is auto-selected

#### Validation Rules
| Field | Validation |
|-------|------------|
| **schemaVersion** | Required, must be compatible version |
| **theme.name** | Required, non-empty string |
| **theme.slots** | Required, exactly 12 slot objects |
| **slots[].h** | Number, 0-360 (hue) |
| **slots[].s** | Number, 0-100 (saturation) |
| **adjustments** | Optional, all values -100 to +100 |

#### Error Handling
| Error | Message |
|-------|---------|
| Invalid JSON | "Invalid JSON format. Please check the file contents." |
| Missing schema | "Missing schema version. This may not be a valid theme file." |
| Future version | "Theme file version X is newer than supported. Please update." |
| Invalid slots | "Theme must have exactly 12 color slots." |
| Invalid hue | "Slot N: hue must be a number between 0 and 360." |
| Invalid saturation | "Slot N: saturation must be a number between 0 and 100." |

---

## 8. Footer Actions

| Button | Behavior |
|--------|----------|
| **Apply to Presentation** | Applies selected/edited theme to entire presentation |
| **Save Theme** | Saves current theme to user's custom themes library |

---

## 9. Data Model

### 9.1 Color Theme Schema
```javascript
ColorTheme: {
  id: "theme-uuid",
  name: "My Custom Theme",
  category: "custom",     // "preset" | "custom" | "ai-generated"
  source: null,           // null | "preset-name" | "ai" | "image"
  
  colors: {
    // Background colors
    background1: "#1E1E1E",
    background2: "#2D2D2D",
    
    // Text colors
    text1: "#FFFFFF",
    text2: "#AAAAAA",
    
    // Accent colors
    accent1: "#18A0FB",
    accent2: "#7B61FF",
    accent3: "#1BC47D",
    accent4: "#F24822",
    accent5: "#FFBE0B",
    accent6: "#FF006E",
    
    // Semantic colors
    hyperlink: "#0066CC",
    followedHyperlink: "#954F72"
  },
  
  metadata: {
    createdAt: "2025-11-25T12:00:00Z",
    modifiedAt: "2025-11-25T12:00:00Z",
    aiPrompt: null,       // Stores AI prompt if AI-generated
    sourceImage: null     // Stores image data URL if image-extracted
  }
}
```

### 9.2 Store Integration
```javascript
// In presentation store
presentation: {
  theme: {
    colorTheme: { /* ColorTheme object */ },
    typographyStyles: { /* TypographyStyles object */ }
  },
  // ... rest of presentation
}
```

---

## 10. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+C` | Open Color Theme Manager |
| `Escape` | Close panel |
| `Enter` (in AI prompt) | Generate theme |
| `Tab` | Navigate between sections |
| `Arrow keys` | Navigate preset grid |

---

## 11. Accessibility

- Full keyboard navigation
- ARIA labels for all interactive elements
- Color contrast indicators (WCAG AA/AAA badges)
- Screen reader announcements for state changes
- Focus trap within panel when open

---

## 12. Implementation Notes

### 12.1 Image Color Extraction
- Use canvas API for pixel access
- Implement k-means clustering in worker thread
- Cache extracted palettes for performance

### 12.2 AI Integration
- Use existing AI service infrastructure
- Structured prompt for consistent output
- Fallback to preset if AI unavailable

### 12.3 Real-time Preview
- Apply theme temporarily during hover/selection
- Debounce preview updates (100ms)
- Revert on cancel/close

---

## 13. Related Documents
- [Presentation Design UX Guide](./presentation-design-ux-guide.md) - Mental model and user experience
- [Color Picker UI](../fills/color-picker-ui.md)
- [Slide Master System](../slides/slide-master-system.md)
- [App UI Design System](../app-ui-design-system/ui-design-system.md)
- [Typography Style Manager](./typography-style-manager.md)
