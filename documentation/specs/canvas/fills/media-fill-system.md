# Media Fill System Specification

## Overview

Images and videos in Story are implemented as **fill layers** on shapes, not as separate element types. This unified approach provides:

- **Consistency**: Same interaction model as solid, gradient, and code fills
- **Flexibility**: Multiple media fills can be stacked with blending modes
- **Power**: Combine media with other fill types (e.g., gradient overlay on image)
- **Simplicity**: One element type (shape) handles all visual content

## Design Philosophy

### Why Fills Instead of Separate Elements?

| Approach | Pros | Cons |
|----------|------|------|
| **Separate Image/Video Elements** | Intuitive for basic use | Duplicates transform logic, limits compositing |
| **Media as Fill (Our Approach)** | Unified system, powerful compositing, cleaner architecture | Slightly higher learning curve |

The fill-based approach mirrors professional tools like Figma and After Effects, where images are fills that can be masked, blended, and composed.

---

## Fill Types

### Current Fill Types
1. **Solid** - Single color
2. **Gradient** - Linear, radial, angular, diamond
3. **Code** - Programmatic canvas animations
4. **Image** - Static images (JPEG, PNG, WebP, SVG)
5. **Video** - Video files (MP4, WebM, MOV)
6. **Animated Image** - GIF and animated WebP (special handling)

### Animated GIF / WebP Handling

Animated images (GIF, animated WebP) require special treatment:

| Property | Static Image | Animated Image | Video |
|----------|--------------|----------------|-------|
| **Type** | `image` | `image` with `animated: true` | `video` |
| **Loops** | N/A | Always (by default) | Configurable |
| **Has audio** | No | No | Yes |
| **Playback controls** | No | Play/Pause only | Full controls |
| **Poster frame** | N/A | First frame auto | Configurable |
| **Trim** | N/A | No | Yes |

```javascript
// Animated image detection
const isAnimated = (file) => {
    // Check for animated GIF
    if (file.type === 'image/gif') {
        return checkGifAnimation(file); // Parse GIF header
    }
    // Check for animated WebP
    if (file.type === 'image/webp') {
        return checkWebPAnimation(file); // Parse WebP header
    }
    return false;
};

// Animated image fill has extra flag
{
    type: 'image',
    animated: true,        // Flag for animated images
    playing: true,         // Control playback
    // ... other image properties
}
```

### Unified Data Model

```javascript
// Fill layer structure (applies to all types)
{
    type: 'solid' | 'gradient' | 'code' | 'image' | 'video',
    visible: true,
    opacity: 100,           // 0-100
    blendMode: 'normal',    // CSS blend modes
    
    // Type-specific properties
    // For solid:
    color: '#FF5500',
    
    // For gradient:
    value: { type: 'linear', angle: 90, stops: [...] },
    
    // For code:
    code: 'return { draw: function(t) {...} }',
    
    // For image:
    src: 'data:image/...' | 'https://...',
    scaleMode: 'fill',      // fill, fit, stretch, tile
    position: { x: 0.5, y: 0.5 },  // 0-1 normalized anchor
    scale: 1,               // Additional scale factor
    rotation: 0,            // Degrees, independent of shape rotation
    filters: {...},         // Image adjustments
    originalWidth: 1920,    // Original dimensions for reset
    originalHeight: 1080,
    
    // For video:
    src: 'blob:...' | 'https://...',
    scaleMode: 'fill',
    position: { x: 0.5, y: 0.5 },
    scale: 1,
    rotation: 0,
    filters: {...},
    originalWidth: 1920,
    originalHeight: 1080,
    // Video-specific:
    playbackRate: 1,
    volume: 0,              // 0-1, default muted
    loop: true,
    autoplay: true,
    startTime: 0,           // Seconds
    endTime: null,          // null = full duration
    posterFrame: 0          // Timestamp for thumbnail
}
```

---

## User Interface

### 1. Fill Type Selector (In Flyout)

```
┌──────────────────────────────────────────────┐
│ [Custom] [Libraries]                   [+][X]│
├──────────────────────────────────────────────┤
│                                              │
│  ●    ◐    ▣    🎬    </>    [⊕]    [👁]   │
│  │    │    │     │     │      │      │      │
│  │    │    │     │     │      │      └─ Visibility
│  │    │    │     │     │      └─ Blend Mode
│  │    │    │     │     └─ Code Fill
│  │    │    │     └─ Video Fill (NEW)
│  │    │    └─ Image Fill
│  │    └─ Gradient
│  └─ Solid
│                                              │
├──────────────────────────────────────────────┤
│           [Fill Type Content]                │
└──────────────────────────────────────────────┘
```

### 2. Image Fill Tab

```
┌──────────────────────────────────────────────┐
│ [Custom] [Libraries]                   [+][X]│
├──────────────────────────────────────────────┤
│  ●   ◐   [▣]   🎬   </>        [⊕]   [👁]  │
├──────────────────────────────────────────────┤
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │                                        │  │
│  │         [Image Preview]                │  │
│  │         (with position indicator)      │  │
│  │                                        │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │  Drop image here or click to browse    │ │
│  │              [Browse...]               │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  ─────────── Scale Mode ───────────         │
│                                              │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│  │ Fill │ │ Fit  │ │Stretch│ │ Tile │       │
│  │  ▣   │ │  ◫   │ │  ⤢   │ │  ⊞   │       │
│  └──────┘ └──────┘ └──────┘ └──────┘       │
│                                              │
│  ─────────── Position ───────────           │
│                                              │
│  ┌─────────────────┐  X [  0  ] %           │
│  │  ┌───┬───┬───┐  │  Y [  0  ] %           │
│  │  │ ● │ ● │ ● │  │                        │
│  │  ├───┼───┼───┤  │  Scale [100] %         │
│  │  │ ● │ ● │ ● │  │  Rotation [0] °        │
│  │  ├───┼───┼───┤  │                        │
│  │  │ ● │ ● │ ● │  │  [↻ Reset to Original] │
│  │  └───┴───┴───┘  │                        │
│  └─────────────────┘                        │
│                                              │
│  ─────────── Adjustments ───────────        │
│                                              │
│  Exposure    [────●────] 0                  │
│  Contrast    [────●────] 0                  │
│  Saturation  [────●────] 0                  │
│  Temperature [────●────] 0                  │
│  Tint        [────●────] 0                  │
│  Highlights  [────●────] 0                  │
│  Shadows     [────●────] 0                  │
│  Blur        [────●────] 0                  │
│                                              │
│  [Reset Adjustments]                        │
│                                              │
└──────────────────────────────────────────────┘
```

### 3. Video Fill Tab

```
┌──────────────────────────────────────────────┐
│ [Custom] [Libraries]                   [+][X]│
├──────────────────────────────────────────────┤
│  ●   ◐   ▣   [🎬]   </>        [⊕]   [👁]  │
├──────────────────────────────────────────────┤
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │                                        │  │
│  │         [Video Preview]                │  │
│  │         (shows current frame)          │  │
│  │                                        │  │
│  │    ▶ advancement indicator             │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  [▶ 00:05.2 / 00:30.0] ──●────────────────  │
│                       Timeline scrubber      │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │  Drop video here or click to browse    │ │
│  │              [Browse...]               │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  ─────────── Playback ───────────           │
│                                              │
│  Speed  [0.5x] [1x] [1.5x] [2x]             │
│                                              │
│  ☑ Loop          ☑ Autoplay                 │
│                                              │
│  🔇────●──────🔊  Volume                    │
│                                              │
│  ─────────── Trim ───────────               │
│                                              │
│  Start  [00:00.0]    End [00:30.0]          │
│  ──●──────────────────────────●──           │
│  (Dual-handle range slider)                 │
│                                              │
│  ─────────── Scale Mode ───────────         │
│  (Same as Image: Fill, Fit, Stretch, Tile)  │
│                                              │
│  ─────────── Position ───────────           │
│  (Same as Image)                            │
│                                              │
│  ─────────── Adjustments ───────────        │
│  (Same as Image)                            │
│                                              │
└──────────────────────────────────────────────┘
```

### 4. On-Canvas Video Controls Overlay

When a shape with video fill is selected, show floating controls:

```
     ┌─────────────────────────────────────────────┐
     │                                             │
     │                                             │
     │              [Video Content]                │
     │                                             │
     │                                             │
     │                                             │
     │   ┌─────────────────────────────────────┐   │
     │   │ ◀◀  ▶/❚❚  ▶▶  │ 00:05/00:30  🔇 ⛶  │   │
     │   └─────────────────────────────────────┘   │
     └─────────────────────────────────────────────┘
            ↑
            Floating control bar (appears on hover/select)
```

**Controls:**
- **◀◀** - Skip back 5 seconds
- **▶/❚❚** - Play/Pause toggle
- **▶▶** - Skip forward 5 seconds
- **Timestamp** - Current time / Duration
- **🔇** - Mute toggle (click to unmute, shows volume slider)
- **⛶** - Fullscreen preview

---

## Scale Modes

### Visual Comparison

```
Original Image (16:9)          Shape (1:1 square)
┌──────────────────┐           ┌──────────┐
│                  │     →     │          │
│   [  Image  ]    │           │          │
│                  │           │          │
└──────────────────┘           └──────────┘

FILL (cover) - Image fills shape, cropped
┌──────────┐
│ ████████ │  Image scaled to cover entire shape
│ ████████ │  Some parts cropped
│ ████████ │
└──────────┘

FIT (contain) - Entire image visible, letterboxed
┌──────────┐
│          │  Empty space (transparent or solid)
│ ████████ │  Entire image visible
│          │
└──────────┘

STRETCH - Image distorted to exact shape size
┌──────────┐
│ ████████ │  Image stretched
│ ████████ │  Aspect ratio NOT preserved
│ ████████ │
└──────────┘

TILE - Image repeated
┌──────────┐
│ ██ ██ ██ │  Image tiled at original size
│ ██ ██ ██ │  
│ ██ ██ ██ │
└──────────┘
```

### Scale Mode Details

| Mode | Behavior | Use Case | Implementation |
|------|----------|----------|----------------|
| **Fill** (default) | Cover entire shape, crop excess | Hero images, backgrounds | `object-fit: cover` on `<img>/<video>` |
| **Fit** | Show entire image, add letterboxing | Product photos, logos | `object-fit: contain` on `<img>/<video>` |
| **Stretch** | Distort to exact shape dimensions | Abstract textures | `object-fit: fill` on `<img>/<video>` |
| **Tile** | Repeat at original size | Patterns, textures | `background-image` + `background-repeat: repeat` |

**Note on Tile Mode:** Tile mode uses CSS `background-image` instead of `<img>` element because HTML img elements cannot be tiled. The fill layer switches rendering strategy for this mode.

### Position Controls

Position determines which part of the image is visible (especially important for Fill mode):

```
Position Grid (3x3):
┌───┬───┬───┐
│TL │TC │TR │  TL = Top-Left, TC = Top-Center, etc.
├───┼───┼───┤
│ML │MC │MR │  MC = Middle-Center (default)
├───┼───┼───┤
│BL │BC │BR │
└───┴───┴───┘

Custom position: X% and Y% from top-left
- X: 0% = left edge, 50% = center, 100% = right edge
- Y: 0% = top edge, 50% = center, 100% = bottom edge
```

---

## Reset to Original Size

### Behavior

"Reset to Original" resizes the shape to exactly match the image/video dimensions:

```
Before Reset:
Shape: 200x200                Image: 1920x1080
┌────────────┐               (stored as originalWidth/Height)
│  cropped   │
│   image    │
└────────────┘

After Reset:
Shape: 1920x1080 (matches image)
┌──────────────────────────────────────────────┐
│                                              │
│              Full image visible              │
│                                              │
└──────────────────────────────────────────────┘
```

### Reset Options

1. **Reset Size** - Match shape to media dimensions
2. **Reset Position** - Center media in shape (X: 50%, Y: 50%)
3. **Reset All** - Size + Position + Scale (100%) + Rotation (0°)

---

## Image Adjustments / Effects

### Available Filters

| Filter | Range | Default | Description |
|--------|-------|---------|-------------|
| **Exposure** | -100 to +100 | 0 | Overall brightness |
| **Contrast** | -100 to +100 | 0 | Difference between lights/darks |
| **Saturation** | -100 to +100 | 0 | Color intensity (-100 = grayscale) |
| **Temperature** | -100 to +100 | 0 | Warm (yellow) to cool (blue) |
| **Tint** | -100 to +100 | 0 | Green to magenta shift |
| **Highlights** | -100 to +100 | 0 | Adjust bright areas only |
| **Shadows** | -100 to +100 | 0 | Adjust dark areas only |
| **Blur** | 0 to 100 | 0 | Gaussian blur radius |
| **Hue Rotate** | 0 to 360 | 0 | Shift all colors around wheel |
| **Invert** | 0 to 100 | 0 | Negative effect |
| **Sepia** | 0 to 100 | 0 | Vintage brown tone |
| **Grayscale** | 0 to 100 | 0 | Remove color |

### Filter Data Model

```javascript
filters: {
    exposure: 0,
    contrast: 0,
    saturation: 0,
    temperature: 0,
    tint: 0,
    highlights: 0,
    shadows: 0,
    blur: 0,
    hueRotate: 0,
    invert: 0,
    sepia: 0,
    grayscale: 0
}
```

### CSS Filter Mapping

**Filter Pipeline Order (applied in this exact sequence):**

```
┌─────────────────────────────────────────────────────────────┐
│                    FILTER PIPELINE                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Temperature/Tint (SVG feColorMatrix)                   │
│     ↓                                                       │
│  2. Highlights/Shadows (SVG feComponentTransfer)           │
│     ↓                                                       │
│  3. Exposure (CSS brightness)                              │
│     ↓                                                       │
│  4. Contrast (CSS contrast)                                │
│     ↓                                                       │
│  5. Saturation (CSS saturate)                              │
│     ↓                                                       │
│  6. Hue Rotate (CSS hue-rotate)                            │
│     ↓                                                       │
│  7. Grayscale (CSS grayscale)                              │
│     ↓                                                       │
│  8. Sepia (CSS sepia)                                      │
│     ↓                                                       │
│  9. Invert (CSS invert)                                    │
│     ↓                                                       │
│  10. Blur (CSS blur) - always last for performance         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Order rationale:**
- Color adjustments (temperature/tint) first, before brightness changes
- Tonal adjustments (exposure/contrast) in middle
- Stylistic effects (sepia/invert) near end
- Blur always last (most expensive, affects already-processed pixels)

```javascript
// Convert our model to CSS filter string
function buildCssFilter(filters) {
    const parts = [];
    
    // Order matters! Apply in pipeline sequence
    
    // Brightness (exposure)
    // exposure: -100 to +100 → brightness: 0 to 2
    const brightness = 1 + (filters.exposure / 100);
    if (filters.exposure) parts.push(`brightness(${brightness})`);
    
    // Contrast: -100 to +100 → contrast: 0 to 2
    const contrast = 1 + (filters.contrast / 100);
    if (filters.contrast) parts.push(`contrast(${contrast})`);
    
    // Saturation: -100 to +100 → saturate: 0 to 2
    const saturate = 1 + (filters.saturation / 100);
    if (filters.saturation) parts.push(`saturate(${saturate})`);
    
    // Hue rotation
    if (filters.hueRotate) parts.push(`hue-rotate(${filters.hueRotate}deg)`);
    
    // Color effect filters
    if (filters.grayscale) parts.push(`grayscale(${filters.grayscale}%)`);
    if (filters.sepia) parts.push(`sepia(${filters.sepia}%)`);
    if (filters.invert) parts.push(`invert(${filters.invert}%)`);
    
    // Blur last (most expensive)
    if (filters.blur) parts.push(`blur(${filters.blur}px)`);
    
    // Temperature/Tint require SVG filters or canvas manipulation
    // (handled separately with SVG filter)
    
    return parts.join(' ') || 'none';
}
```

---

## Transparency & Blending

### Opacity

Fill layer opacity (0-100%) controls transparency:

```
Image at 50% opacity over gradient:
┌──────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░ │  Image (50% opacity)
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  + Gradient (100% opacity)
│ ████████████████████ │  = Blended result
└──────────────────────┘
```

### Blend Modes

Available blend modes (CSS mix-blend-mode):

| Mode | Effect |
|------|--------|
| **Normal** | No blending |
| **Multiply** | Darkens (good for shadows) |
| **Screen** | Lightens (good for highlights) |
| **Overlay** | Contrast boost |
| **Darken** | Keeps darker pixels |
| **Lighten** | Keeps lighter pixels |
| **Color Dodge** | Brightens base |
| **Color Burn** | Darkens base |
| **Hard Light** | High contrast |
| **Soft Light** | Subtle contrast |
| **Difference** | Invert based on brightness |
| **Exclusion** | Lower contrast invert |
| **Hue** | Apply hue only |
| **Saturation** | Apply saturation only |
| **Color** | Apply hue + saturation |
| **Luminosity** | Apply brightness only |

### Fill Layer Stacking

```
Element with 3 fill layers:
┌─────────────────────────────────────┐
│  Layer 3: Image (Overlay, 80%)      │  ← Top
│  Layer 2: Gradient (Normal, 100%)   │
│  Layer 1: Solid color (Normal, 100%)│  ← Bottom
└─────────────────────────────────────┘
```

---

## Interactions

### Adding Media Fill

1. **From Toolbar**: Select shape → Open Fill flyout → Click Image/Video icon
2. **Drag & Drop**: Drop image/video file directly onto shape
3. **Paste**: Cmd/Ctrl+V to paste image from clipboard onto selected shape
4. **Context Menu**: Right-click shape → Add Fill → Image/Video

### Drag & Drop Behavior

| Drop Target | Result |
|-------------|--------|
| Empty canvas | Create new shape with media fill at drop location |
| Existing shape | Add new fill layer with media |
| Fill layer (in flyout) | Replace that layer's media |

### On-Canvas Media Manipulation

When a shape with media fill is selected:

1. **Pan media within shape**: Hold `Space` + drag
2. **Scale media**: Hold `Alt/Option` + scroll wheel
3. **Rotate media**: Hold `Cmd/Ctrl` + `Alt/Option` + drag

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + Shift + K` | Replace media (opens file picker) |
| `Space` (while selected) | Toggle video play/pause |
| `←` / `→` | Frame step (video) |
| `Shift + ←` / `→` | Skip 5 seconds (video) |
| `Tab` | Cycle through scale modes |
| `Arrow keys` (with Alt) | Nudge media position |
| `Cmd/Ctrl + 0` | Reset to original size |
| `Cmd/Ctrl + Shift + 0` | Reset all (size + position + scale + rotation) |
| `M` | Toggle mute (video) |
| `L` | Toggle loop (video) |

---

## Video-Specific Features

### Playback in Editor

- Videos **autoplay** and **loop** by default in editor
- Audio is **muted** by default
- Videos pause when shape is not visible (performance optimization)
- Scrubbing in flyout allows frame-accurate preview

### Playback in Presentation

- Videos respect their autoplay/loop settings
- Can be controlled via presentation mode controls
- Audio plays if unmuted

### Video Timeline Integration

```
Slide Timeline:
────────────────────────────────────────────────
│ Video 1: [████████████████████             ] │
│ Video 2: [       ████████████████████      ] │
│ Audio:   [████████████████████████████████ ] │
────────────────────────────────────────────────
           0s        5s       10s       15s
```

- Videos can be trimmed (start/end points)
- Multiple videos on same slide play simultaneously
- Future: Keyframe animation support

### Poster Frame

The poster frame is shown:
- Before video loads
- When video is paused at start
- In thumbnail/preview contexts

Set via:
- Scrub to desired frame → "Set as Poster" button
- Numeric input (seconds)

---

## File Handling

### Supported Formats

**Images:**
| Format | Support | Notes |
|--------|---------|-------|
| JPEG | ✅ Full | Lossy, good for photos |
| PNG | ✅ Full | Lossless, supports transparency |
| WebP | ✅ Full | Modern, efficient |
| GIF | ✅ Full | Animated supported |
| SVG | ✅ Full | Vector, scalable |
| AVIF | ⚠️ Partial | Modern browsers only |

**Videos:**
| Format | Support | Notes |
|--------|---------|-------|
| MP4 (H.264) | ✅ Full | Universal support |
| WebM (VP9) | ✅ Full | Open format |
| MOV | ⚠️ Partial | Safari-focused |
| GIF | ✅ Full | Treated as video for animation |

### Storage Strategy

1. **Small files (<5MB)**: Base64 data URL embedded in project JSON
2. **Large files (>5MB)**: Stored as separate assets in project bundle
3. **Remote URLs**: Referenced directly (for web images/videos)
4. **Session blobs**: Temporary blob URLs with reference counting

**Note:** See [File Format & Storage Specification](../../collaboration/storage/file-format-storage.md) for complete bundling strategy.

### Blob URL Lifecycle

Blob URLs are volatile - they become invalid on page reload. The system must:

1. **Reference Counting**: Track how many fills reference each blob URL
2. **History Integration**: Keep blobs alive while in undo/redo stack
3. **Copy Safety**: Convert blob URLs to data URLs when copying to clipboard
4. **Save Conversion**: Convert all blob URLs to embedded assets on project save

```
┌─────────────────────────────────────────────────────────────────┐
│                    BLOB URL STATE MACHINE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [File Import] ──→ CREATE ──→ refCount: 1                      │
│                        │                                        │
│  [Shape Copy] ────────→│──→ refCount++                         │
│                        │                                        │
│  [Fill Removed] ──────→│──→ refCount--                         │
│                        │                                        │
│  [In Undo Stack?] ────→│──→ Keep alive (don't revoke)          │
│                        │                                        │
│  refCount == 0         │                                        │
│  AND not in history ──→ REVOKE                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Import Flow

```
User drops/selects file
        ↓
[File size check]
        ↓
    ┌───────┴───────┐
    ↓               ↓
  <5MB            >5MB
    ↓               ↓
Base64 encode   Create Blob URL
    ↓               ↓
Store in fill   Store blob ref
    ↓           + add to registry
    ↓           + refCount = 1
    └───────┬───────┘
            ↓
    Update element
            ↓
     Re-render
```

---

## Performance Considerations

### Image Optimization

1. **Lazy loading**: Only decode visible images
2. **Resolution limiting**: Cap at 4K for preview
3. **Format conversion**: Convert to WebP where supported
4. **Caching**: LRU cache for decoded images

### Video Optimization

1. **Pause off-screen videos**: Use IntersectionObserver
2. **Lower resolution in editor**: Full res only on export
3. **Frame extraction**: Use requestVideoFrameCallback
4. **Memory management**: Release video elements when not visible
5. **Concurrent limit**: Maximum 5 playing videos simultaneously

### Video Lifecycle per Slide State

| Slide State | Video Behavior |
|-------------|----------------|
| **Entering (active)** | If autoplay: start from startTime |
| **Visible (active)** | Continues playing based on settings |
| **Exiting (navigating away)** | Pause immediately |
| **Off-screen (not active)** | Pause, release resources after 30s |
| **Returning (navigating back)** | If autoplay: restart from startTime |
| **Selected in editor** | Pause (allow manual control) |
| **Deselected in editor** | Resume if autoplay was on |

### Memory Limits

| Content | Recommended Max | Warning Threshold |
|---------|-----------------|-------------------|
| Single image | 10MB | 5MB |
| Single video | 100MB | 50MB |
| Total per slide | 200MB | 100MB |
| Total per project | 1GB | 500MB |
| Concurrent videos | 5 | 3 |
| Media cache size | 500MB | 300MB |

---

## Accessibility

### Alt Text

Media fills support alt text for screen readers. Alt text is editable via the Image/Video tab in the property inspector.

```javascript
{
    type: 'image',
    src: '...',
    alt: 'A sunset over the ocean',
    // ... other properties
}
```

**Alt Text UI:**
```
┌─────────────────────────────────────────┐
│ Alt Text                                │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ A sunset over the ocean with       │ │
│ │ vibrant orange and purple colors   │ │
│ └─────────────────────────────────────┘ │
│ [Generate with AI]                      │
└─────────────────────────────────────────┘
```

### Video Captions

Future feature: Support for VTT caption tracks.

---

## Error States

### Image Load Failure

```
┌──────────────────────┐
│    ┌────────────┐    │
│    │     ⚠️     │    │
│    │   Image    │    │
│    │  not found │    │
│    └────────────┘    │
│   [Retry] [Remove]   │
└──────────────────────┘
```

### Video Load/Playback Error

```
┌──────────────────────┐
│    ┌────────────┐    │
│    │     ⚠️     │    │
│    │  Video     │    │
│    │  error     │    │
│    └────────────┘    │
│   "Format not supported"
│   [Try another file] │
└──────────────────────┘
```

### Corrupted File Error

```
┌──────────────────────┐
│    ┌────────────┐    │
│    │     ⚠️     │    │
│    │  Corrupted │    │
│    │    file    │    │
│    └────────────┘    │
│  "Could not read file"
│   [Choose another]   │
└──────────────────────┘
```

### Cross-Origin Error (CORS)

```
┌──────────────────────┐
│    ┌────────────┐    │
│    │     🔒     │    │
│    │   Access   │    │
│    │   denied   │    │
│    └────────────┘    │
│  "Cannot load remote │
│   image. Download    │
│   and re-upload."    │
│   [Download] [Cancel]│
└──────────────────────┘
```

### Storage Quota Exceeded

```
┌──────────────────────────────────────┐
│  ⚠️ Storage limit reached            │
├──────────────────────────────────────┤
│  Your project has reached the        │
│  recommended size limit.             │
│                                      │
│  Current: 1.2GB / 1GB recommended    │
│                                      │
│  Suggestions:                        │
│  • Remove unused media               │
│  • Compress large images             │
│  • Use lower resolution videos       │
│                                      │
│  [Manage Media] [Add Anyway] [Cancel]│
└──────────────────────────────────────┘
```

---

## Integration with Other Systems

### Export

- **PNG/JPEG export**: Flatten all fills including media
- **PDF export**: Embed images, video as poster frame
- **HTML export**: Proper `<img>` and `<video>` tags
- **Video export**: Include video content in timeline
- **Project save (.str)**: Bundle all media assets (see [File Format spec](../../collaboration/storage/file-format-storage.md))

### Copy/Paste

Copy shape with media fill requires special handling:

| Scenario | Behavior |
|----------|----------|
| **Copy within session** | Share blob URL reference, increment refCount |
| **Paste from clipboard** | Convert blob URL → data URL before stringify |
| **Cross-tab paste** | Re-import from data URL, create new blob |
| **Cross-document paste** | Embed full data URL (may be slow for large files) |

```javascript
// Copy handler must convert blobs for clipboard safety
async function prepareForClipboard(elements) {
    const prepared = await Promise.all(elements.map(async (el) => {
        if (el.style?.fills) {
            const fills = await Promise.all(el.style.fills.map(async (fill) => {
                if ((fill.type === 'image' || fill.type === 'video') && 
                    fill.src?.startsWith('blob:')) {
                    // Convert blob to data URL for clipboard safety
                    const dataUrl = await blobToDataUrl(fill.src);
                    return { ...fill, src: dataUrl };
                }
                return fill;
            }));
            return { ...el, style: { ...el.style, fills } };
        }
        return el;
    }));
    return prepared;
}
```

### Undo/Redo

- Media changes are fully undoable
- Blob URLs are preserved while in undo/redo stack (reference counting)
- Large media operations may trigger "compress history" to save memory
- When history entry is evicted, decrement blob refCount

### Drag-Drop Behavior

The drop target determines the action:

| Drop Target | Action |
|-------------|--------|
| **Empty canvas area** | Create new image element |
| **Selected shape** | Add as fill layer to shape |
| **Unselected shape** | Select shape, then add as fill |
| **Existing media element** | Replace the source |

Detection priority:
1. Check if drop position hits a selected shape
2. Check if drop position hits any shape
3. Fall back to creating new element

---

## Future Enhancements

1. **Crop tool**: Direct on-canvas cropping
2. **Mask support**: Use shapes as masks for media
3. **Smart crop**: AI-powered content-aware cropping
4. **Video trimming on canvas**: Visual timeline editor
5. **Live camera feed**: Webcam as video fill source
6. **3D transforms**: Perspective and 3D rotation
7. **Image AI**: Remove background, upscale, style transfer
