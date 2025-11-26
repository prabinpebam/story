# CodeFill Presets Specification

## Overview

The CodeFill Presets system provides a curated library of canvas-based animations that users can quickly apply to fills. This replaces the standalone MeshGradient implementation by converting it to a CodeFill preset, unifying all dynamic fills under a single CodeRunner-based architecture.

## Goals

1. **Simplify Architecture**: Remove separate MeshGradient WebGL implementation in favor of unified CodeRunner system
2. **Improve Discoverability**: Provide visual preset gallery with live hover previews
3. **Enable Customization**: Allow users to save their own CodeFill creations as reusable presets
4. **Maintain Quality**: Include professionally designed built-in presets (mesh gradient, particles, waves, etc.)

## User Interface

### 1. CodeFill Flyout Layout

When Code fill type is selected, the flyout shows two tabs:

```
┌──────────────────────────────────────┐
│ [Custom] [Libraries]           [+][X]│
│──────────────────────────────────────│
│ ● ◐ ◑ ▣ ▦ </>              [⊕] [👁] │ ← Fill type selector
│──────────────────────────────────────│
│ ┌─ Presets ─┬─ Custom ─┐             │ ← Sub-tabs for Code type
│ │           │          │             │
│ ├───────────┴──────────┤             │
│ │                      │             │
│ │   [Preset Grid]      │             │ ← "Presets" tab content
│ │                      │             │
│ └──────────────────────┘             │
└──────────────────────────────────────┘
```

### 2. Presets Tab

The Presets tab displays a scrollable grid of available presets.

#### Layout
- **Grid**: 3 columns, fixed aspect ratio (4:3) thumbnails
- **Sections**:
  - **Built-in Presets**: Non-removable, professionally designed
  - **My Presets**: User-saved presets (collapsible section)

#### Preset Card
```
┌────────────────────┐
│                    │
│   [Live Preview]   │  ← Canvas running the preset code
│                    │
├────────────────────┤
│ Mesh Gradient      │  ← Preset name
│                 [⋮]│  ← Options menu (only for user presets)
└────────────────────┘
```

#### Interactions

| Action | Behavior |
|--------|----------|
| **Hover** | Thumbnail plays animation (if paused). Larger tooltip preview appears after 300ms delay |
| **Click** | Apply preset to current fill, switch to Custom tab |
| **Right-click** (user presets) | Context menu: Rename, Duplicate, Delete |
| **Options menu** (user presets) | Same as right-click |

### 3. Custom Tab

The existing CodeTab UI with additions:

```
┌──────────────────────────────────────┐
│ ┌─ Presets ─┬─ Custom ─┐             │
│ │           │ ████████ │             │
│ ├───────────┴──────────┤             │
│ │ ┌──────────────────┐ │             │
│ │ │                  │ │             │
│ │ │  [Live Canvas]   │ │             │
│ │ │                  │ │             │
│ │ └──────────────────┘ │             │
│ │                      │             │
│ │ [Prompt input...]    │             │
│ │ ☑ Refine prompt      │             │
│ │ [Update] [Generate]  │             │
│ │                      │             │
│ │ ┌──────────────────┐ │             │
│ │ │ // Code editor   │ │             │
│ │ │                  │ │             │
│ │ └──────────────────┘ │             │
│ │                      │             │
│ │ [Save as Preset]     │  ← NEW      │
│ └──────────────────────┘             │
└──────────────────────────────────────┘
```

#### Save as Preset Flow

1. User clicks "Save as Preset" button
2. Modal dialog appears:
   ```
   ┌─────────────────────────────┐
   │ Save Preset                 │
   │                             │
   │ Name: [Mesh Gradient v2  ]  │
   │                             │
   │ Preview:                    │
   │ ┌───────────────────────┐   │
   │ │                       │   │
   │ │   [Live Thumbnail]    │   │
   │ │                       │   │
   │ └───────────────────────┘   │
   │                             │
   │        [Cancel] [Save]      │
   └─────────────────────────────┘
   ```
3. On save, preset is added to "My Presets" section

### 4. Hover Preview Tooltip

When hovering over a preset for 300ms+:

```
┌────────────────────────────────┐
│                                │
│                                │
│    [Large Live Preview]        │  ← 240x160 canvas
│    (Actual animation running)  │
│                                │
│                                │
├────────────────────────────────┤
│ Mesh Gradient                  │
│ Smooth animated color blending │  ← Optional description
└────────────────────────────────┘
```

Position: Above or beside the grid item, within viewport bounds.

## Data Model

### Preset Structure

```javascript
{
  id: 'mesh-gradient',           // Unique identifier
  name: 'Mesh Gradient',         // Display name
  description: 'Smooth animated color blending with floating orbs',
  category: 'built-in',          // 'built-in' | 'user'
  code: `return { draw: function(t) { ... } }`,
  thumbnail: null,               // Optional: data URL for static preview
  createdAt: 1700000000000,      // Timestamp
  updatedAt: 1700000000000
}
```

### Storage

**Built-in Presets**: Stored in `/src/core/constants/CodeFillPresets.js`

**User Presets**: Stored in localStorage under key `story-codefill-presets`

```javascript
// localStorage structure
{
  "story-codefill-presets": [
    { id: 'user-preset-1', name: 'My Gradient', code: '...', ... },
    { id: 'user-preset-2', name: 'Cool Waves', code: '...', ... }
  ]
}
```

## Built-in Presets

### 1. Mesh Gradient
Replaces the WebGL MeshGradient class with Canvas 2D equivalent.
- Smooth animated color blobs
- 4 color control (uses existing meshColors structure)
- Metaball-like blending

### 2. Gradient Wave
- Animated gradient that shifts colors over time
- Smooth, professional look

### 3. Particles
- Floating particle system
- Gentle motion with blur effects

### 4. Noise
- Animated Perlin/simplex noise pattern
- Organic, natural movement

### 5. Geometric
- Animated geometric patterns
- Clean, modern aesthetic

### 6. Plasma
- Classic plasma effect
- Colorful, psychedelic animation

### 7. Aurora
- Northern lights inspired
- Flowing, ethereal effect

### 8. Bokeh
- Soft focus light circles
- Dreamy, photographic feel

## Technical Implementation

### Component Architecture

```
src/
├── core/
│   ├── constants/
│   │   └── CodeFillPresets.js     # Built-in presets data
│   └── effects/
│       └── CodeRunner.js          # Existing (unchanged)
│       └── MeshGradient.js        # DELETE
└── ui/
    └── components/
        └── FillFlyout/
            ├── CodeTab.js         # Update: add save preset button
            ├── PresetsTab.js      # NEW: preset grid component
            └── PresetCard.js      # NEW: individual preset card
```

### Preset Manager Service

```javascript
// src/core/services/PresetManager.js
export class PresetManager {
  static getBuiltInPresets() { ... }
  static getUserPresets() { ... }
  static getAllPresets() { ... }
  static saveUserPreset(preset) { ... }
  static deleteUserPreset(id) { ... }
  static updateUserPreset(id, updates) { ... }
}
```

### Migration from MeshGradient

When loading old data with `fillType: 'mesh'`:
1. Convert to `fillType: 'code'` 
2. Use mesh gradient preset code
3. Transfer `meshColors` to code parameters

## Accessibility

- Keyboard navigation through preset grid
- Focus indicators on preset cards
- ARIA labels for preset actions
- Reduced motion: pause animations when `prefers-reduced-motion` is set

## Performance Considerations

1. **Lazy Loading**: Only run animation on visible cards
2. **Hover Delay**: 300ms delay before showing large preview
3. **Throttled Rendering**: Limit preview canvas framerate in grid (15fps)
4. **Pause on Scroll**: Stop animations while user is scrolling

## Future Enhancements

1. **Export/Import**: Share presets as JSON files
2. **Community Presets**: Online preset gallery
3. **Preset Parameters**: Expose configurable variables per preset
4. **Categories/Tags**: Filter presets by category
5. **Search**: Search presets by name/description
