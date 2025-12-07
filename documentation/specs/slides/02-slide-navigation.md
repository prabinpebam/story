# Slide Navigation & User Experience

**Version:** 1.0  
**Last Updated:** December 7, 2025

## 1. Overview

This document specifies the complete navigation system for slides, including thumbnails, keyboard shortcuts, mouse interactions, and navigation patterns adapted from Microsoft PowerPoint.

---

## 2. Navigation Views

### 2.1 Normal View (Primary Editing)

The default working view with three main areas:

```
┌────────────────────────────────────────────────────────────┐
│  Toolbar                                                   │
├─────────┬──────────────────────────────────┬──────────────┤
│ Slide   │                                  │  Properties  │
│ Thumbs  │      Main Canvas                 │  Inspector   │
│         │                                  │              │
│ [1] ✓   │  ┌────────────────────────────┐  │  Fill        │
│ [2]     │  │                            │  │  ▪ Solid     │
│ [3]     │  │    Active Slide            │  │  ▪ Gradient  │
│ [4]     │  │    Content Here            │  │              │
│ [5]     │  │                            │  │  Stroke      │
│         │  └────────────────────────────┘  │  ▪ Weight    │
│         │                                  │              │
└─────────┴──────────────────────────────────┴──────────────┘
```

**Interaction:**
- **Thumbnails**: Click to navigate, drag to reorder
- **Canvas**: Edit slide content
- **Properties**: Adjust selected element

### 2.2 Slide Sorter View

Grid view for organizing slides at scale:

```
┌────────────────────────────────────────────────────────────┐
│  View: Slide Sorter               Zoom: [━━━●─────] 150%  │
├────────────────────────────────────────────────────────────┤
│  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐ │
│  │ 1  │  │ 2  │  │ 3  │  │ 4  │  │ 5  │  │ 6  │  │ 7  │ │
│  │    │  │    │  │    │  │    │  │    │  │    │  │    │ │
│  └────┘  └────┘  └────┘  └────┘  └────┘  └────┘  └────┘ │
│                                                            │
│  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐         │
│  │ 8  │  │ 9  │  │ 10 │  │ 11 │  │ 12 │  │ 13 │         │
│  │    │  │    │  │    │  │    │  │    │  │    │         │
│  └────┘  └────┘  └────┘  └────┘  └────┘  └────┘         │
└────────────────────────────────────────────────────────────┘
```

**Features:**
- Zoom slider (50% - 400%)
- Multi-select with Ctrl/Shift
- Drag-and-drop reordering
- Section headers visible
- Transition indicators

### 2.3 Reading View

Simplified navigation for reviewing presentations:

```
┌────────────────────────────────────────────────────────────┐
│  ◀  ▶  ⏹  [Slide 3 of 12]                          ⚙ ✕  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│                                                            │
│                   Current Slide                            │
│                   (Fit to Window)                          │
│                                                            │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Click anywhere to advance
- Previous/Next buttons
- Escape to exit
- No editing allowed

---

## 3. Thumbnail Panel

### 3.1 Layout & Behavior

**Default State:**
- Width: 200px (adjustable 150-300px)
- Thumbnail aspect ratio: Matches slide size
- Vertical scrolling
- Auto-scroll to active slide

**Thumbnail Components:**

```
┌──────────────────┐
│ ┌──────────────┐ │ ← Slide number badge
│ │ 5            │ │
│ │              │ │ ← Thumbnail preview
│ │   Content    │ │
│ │              │ │
│ └──────────────┘ │
│ "Marketing Plan" │ ← Slide title (optional)
│ [Section: Q2]    │ ← Section indicator
└──────────────────┘
    ↑
    Selection indicator (blue border)
```

### 3.2 Thumbnail States

| State | Visual Treatment |
|-------|------------------|
| **Default** | Border: 1px solid var(--color-border) |
| **Selected** | Border: 2px solid var(--color-accent)<br>Background: var(--color-accent-subtle) |
| **Hover** | Border: 1px solid var(--color-accent)<br>Cursor: pointer |
| **Hidden** | Opacity: 0.4<br>Eye icon with slash overlay |
| **Dragging** | Opacity: 0.5<br>Drop indicator line shows |

### 3.3 Context Menu

Right-click on thumbnail:

```
New Slide                 Ctrl+M
Duplicate Slide           Ctrl+D
Delete Slide              Delete
────────────────────────
Hide Slide                H
Skip Slide (Presentation)
────────────────────────
Cut                       Ctrl+X
Copy                      Ctrl+C
Paste                     Ctrl+V
────────────────────────
Move to Section        ▶  [Section List]
────────────────────────
Slide Properties
```

### 3.4 Thumbnail Performance

**Optimization Strategy:**
1. **Virtual Scrolling**: Only render visible thumbnails +/- 5 buffer
2. **Progressive Loading**: Load in priority order (visible → nearby → distant)
3. **Thumbnail Cache**: Store rendered thumbnails as ImageBitmap
4. **Debounced Updates**: Throttle thumbnail regeneration during editing

**Cache Strategy:**
```javascript
thumbnailCache: {
  small: {},   // 120px width (list view)
  medium: {},  // 200px width (normal view)
  large: {}    // 300px width (zoomed view)
}
```

---

## 4. Keyboard Shortcuts

### 4.1 Navigation Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| **Page Down** / **↓** | Next slide | Normal/Reading/Presenter |
| **Page Up** / **↑** | Previous slide | Normal/Reading/Presenter |
| **Home** | First slide | All views |
| **End** | Last slide | All views |
| **Ctrl + Home** | Go to slide 1 and select first element | Normal view |
| **Ctrl + End** | Go to last slide | Normal view |
| **Ctrl + G** | Go to slide (number dialog) | All views |
| **Slide number + Enter** | Jump to specific slide | Presentation mode |

### 4.2 Selection Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| **Click** | Select slide | Thumbnail panel |
| **Ctrl + Click** | Toggle selection (multi-select) | Thumbnail panel |
| **Shift + Click** | Select range | Thumbnail panel |
| **Ctrl + A** | Select all slides | Thumbnail panel focused |
| **Ctrl + Shift + Click** | Select to end of section | Thumbnail panel |

### 4.3 Editing Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| **Ctrl + M** | New slide (after current) | Normal view |
| **Ctrl + Shift + M** | New slide (at end) | Normal view |
| **Ctrl + D** | Duplicate selected slides | Any view |
| **Delete** / **Backspace** | Delete selected slides | Thumbnail panel |
| **Ctrl + X** | Cut selected slides | Any view |
| **Ctrl + C** | Copy selected slides | Any view |
| **Ctrl + V** | Paste slides (after current) | Any view |

### 4.4 View Shortcuts

| Shortcut | Action |
|----------|--------|
| **F5** | Start presentation from beginning |
| **Shift + F5** | Start presentation from current slide |
| **Alt + F5** | Presenter view |
| **Escape** | Exit presentation/reading view |
| **Alt + 1** | Normal view |
| **Alt + 2** | Slide sorter view |
| **Alt + 3** | Reading view |
| **Ctrl + F1** | Toggle ribbon/toolbar |

### 4.5 Zoom & View Shortcuts

| Shortcut | Action |
|----------|--------|
| **Ctrl + Mouse Wheel** | Zoom in/out on canvas |
| **Ctrl + 0** | Fit slide to window |
| **Ctrl + 1** | Zoom to 100% |
| **Ctrl + 2** | Zoom to 200% |
| **Alt + W, Q** | Open zoom dialog |

---

## 5. Mouse Interactions

### 5.1 Thumbnail Drag & Drop

**Behavior:**
1. **Drag Start**: Press and hold on thumbnail for 200ms
2. **Visual Feedback**: 
   - Thumbnail becomes semi-transparent (50%)
   - Drop indicator line appears between slides
3. **Drop Zones**:
   - Between slides: Insert at position
   - On section header: Move to section
   - Outside panel: Cancel (cursor shows prohibition)
4. **Multi-Select Drag**: All selected slides move together

**Drop Indicator:**
```
┌──────────────┐
│   Slide 1    │
└──────────────┘
━━━━━━━━━━━━━━  ← Blue line (3px, animated pulse)
┌──────────────┐
│   Slide 2    │
└──────────────┘
```

### 5.2 Thumbnail Panel Resizing

**Drag Handle:**
- Located on right edge of thumbnail panel
- Width: 4px hitbox (1px visible line)
- Cursor: `col-resize`
- Min width: 150px
- Max width: 400px
- Snaps to: 200px, 250px, 300px (magnetic snap)

### 5.3 Click Behaviors

| Click Type | Action | Modifier |
|------------|--------|----------|
| **Single Click** | Select slide, show in canvas | None |
| **Double Click** | Enter slide, focus first element | None |
| **Right Click** | Show context menu | None |
| **Ctrl + Click** | Toggle selection (add/remove) | Ctrl |
| **Shift + Click** | Select range from last selected | Shift |
| **Middle Click** | Open slide in new tab (future) | None |

---

## 6. Slide Sorter Advanced Features

### 6.1 Grid Layout

**Responsive Columns:**
```javascript
calculateColumns(containerWidth) {
  const thumbnailWidth = 180;
  const gap = 16;
  const padding = 32;
  
  const availableWidth = containerWidth - (padding * 2);
  const columns = Math.floor((availableWidth + gap) / (thumbnailWidth + gap));
  
  return Math.max(2, Math.min(columns, 8)); // 2-8 columns
}
```

**Zoom Levels:**
| Level | Thumbnail Width | Columns (1920px screen) | Visible Slides |
|-------|----------------|------------------------|----------------|
| 50% | 90px | 8-10 | ~60 slides |
| 75% | 135px | 6-8 | ~40 slides |
| 100% | 180px | 4-6 | ~24 slides |
| 150% | 270px | 3-4 | ~12 slides |
| 200% | 360px | 2-3 | ~8 slides |

### 6.2 Section Headers in Sorter

```
┌────────────────────────────────────────────────────────────┐
│  ▼ Introduction (3 slides)                      [⚙] [✕]   │
├────────────────────────────────────────────────────────────┤
│  ┌────┐  ┌────┐  ┌────┐                                   │
│  │ 1  │  │ 2  │  │ 3  │                                   │
│  └────┘  └────┘  └────┘                                   │
├────────────────────────────────────────────────────────────┤
│  ▶ Main Content (8 slides)                      [⚙] [✕]   │
└────────────────────────────────────────────────────────────┘
     ↑                                              ↑   ↑
     Collapse/Expand                        Section  Delete
                                             Options
```

**Section Interactions:**
- Click header to collapse/expand
- Right-click for section options
- Drag header to reorder entire section
- Settings icon for section properties

### 6.3 Multi-Select Operations

**Selection Modes:**

1. **Individual Selection** (Ctrl+Click):
   ```
   [✓] Slide 2
   [ ] Slide 3
   [✓] Slide 5
   [✓] Slide 7
   ```

2. **Range Selection** (Shift+Click):
   ```
   [✓] Slide 3  ← First click
   [✓] Slide 4
   [✓] Slide 5
   [✓] Slide 6  ← Shift+click
   ```

3. **Rectangular Selection** (Drag):
   ```
   ┌- - - - - - - - - - - -┐
   │ ┌────┐  ┌────┐  ┌────┐│
   │ │ 1  │  │ 2  │  │ 3  ││
   │ └────┘  └────┘  └────┘│
   │                        │
   │ ┌────┐  ┌────┐  ┌────┐│
   │ │ 4  │  │ 5  │  │ 6  ││
   │ └────┘  └────┘  └────┘│
   └- - - - - - - - - - - -┘
   All slides within dotted box selected
   ```

---

## 7. Navigation HUD (Presentation Mode)

### 7.1 Hidden Navigation Bar

Appears on hover at bottom of screen during presentation:

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│                     Presentation Content                    │
│                                                            │
│ ╔════════════════════════════════════════════════════╗     │
│ ║ ◀  ▶  ⏸  🖊  📱  [Slide 5 of 12]    ⚙  ✕         ║     │
│ ╚════════════════════════════════════════════════════╝     │
└────────────────────────────────────────────────────────────┘
```

**Controls:**
- ◀ Previous | ▶ Next
- ⏸ Pause (black screen)
- 🖊 Pen/Pointer tools
- 📱 Show notes (if available)
- Slide counter
- ⚙ Presentation settings
- ✕ Exit

**Auto-Hide Behavior:**
- Appears on mouse movement
- Fades out after 3 seconds of no movement
- Always visible if mouse is over bar
- Can be permanently shown via settings

### 7.2 Jump to Slide (Presentation Mode)

**Activation:**
- Type slide number (e.g., "5")
- Press Enter to jump
- Numbers appear in HUD as typed
- Escape to cancel

**Visual Feedback:**
```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│                     Slide 3 Content                         │
│                                                            │
│                     [Go to: 5_]                            │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 8. Slide Transition Indicators

### 8.1 Visual Indicators on Thumbnails

```
┌──────────────────┐
│ ┌──────────────┐ │
│ │ 5         ⚡ │ │ ← Transition icon (top-right)
│ │              │ │
│ │   Content    │ │
│ │              │ │
│ └──────────────┘ │
│  0.5s            │ ← Duration badge (bottom)
└──────────────────┘
```

**Icons by Transition Type:**
- ⚡ Fade
- ▶ Push
- ↗ Wipe
- ⭐ Zoom
- 🌀 Morph (future)

### 8.2 Transition Preview

**Hover on Transition Icon:**
- Shows tooltip with transition name and duration
- Click to preview transition (mini animation)
- Right-click for quick transition options

---

## 9. Performance Optimization

### 9.1 Virtual Scrolling Implementation

```javascript
class VirtualThumbnailList {
  constructor(slides, containerHeight) {
    this.slides = slides;
    this.containerHeight = containerHeight;
    this.thumbnailHeight = 120; // Including gap
    this.buffer = 5; // Extra slides above/below viewport
  }
  
  getVisibleRange(scrollTop) {
    const start = Math.floor(scrollTop / this.thumbnailHeight);
    const end = Math.ceil((scrollTop + this.containerHeight) / this.thumbnailHeight);
    
    return {
      start: Math.max(0, start - this.buffer),
      end: Math.min(this.slides.length, end + this.buffer)
    };
  }
  
  render(scrollTop) {
    const { start, end } = this.getVisibleRange(scrollTop);
    const visibleSlides = this.slides.slice(start, end);
    
    // Render only visible + buffer slides
    return visibleSlides.map((slide, index) => ({
      slide,
      position: (start + index) * this.thumbnailHeight
    }));
  }
}
```

### 9.2 Thumbnail Generation Strategy

**Priority Queue:**
1. **Immediate**: Currently visible thumbnails
2. **High**: Selected slide + adjacent slides
3. **Medium**: Visible section slides
4. **Low**: All other slides in background

**Web Worker Pipeline:**
```javascript
// Main Thread
const worker = new Worker('thumbnail-generator.js');
worker.postMessage({
  slideData: slide,
  width: 200,
  quality: 0.85,
  priority: 'high'
});

// Worker Thread
self.onmessage = async (e) => {
  const { slideData, width, quality } = e.data;
  const canvas = await renderSlideToCanvas(slideData, width);
  const blob = await canvas.convertToBlob({ quality });
  const bitmap = await createImageBitmap(blob);
  
  self.postMessage({ slideId: slideData.id, bitmap }, [bitmap]);
};
```

---

## 10. Accessibility

### 10.1 Keyboard Navigation

**Focus Management:**
- Tab through thumbnails
- Arrow keys navigate list
- Space to select/deselect
- Enter to activate (show in canvas)

**Screen Reader Announcements:**
```javascript
// Example ARIA labels
<div 
  role="listbox" 
  aria-label="Slide thumbnails"
  aria-multiselectable="true">
  
  <div 
    role="option"
    aria-selected="true"
    aria-label="Slide 3 of 12: Marketing Plan. In section Q2 Goals."
    aria-describedby="slide-3-notes">
    
    <img 
      src="thumbnail-3.png" 
      alt="Slide 3 thumbnail" 
      aria-hidden="true" />
  </div>
</div>
```

### 10.2 High Contrast Mode

**Adjustments:**
- Increase selection border to 3px
- Use system accent colors
- Add text labels to icon-only buttons
- Increase gap between thumbnails to 24px

---

## 11. Mobile & Touch Support

### 11.1 Touch Gestures

| Gesture | Action |
|---------|--------|
| **Tap** | Select slide |
| **Double Tap** | Zoom to slide |
| **Long Press** | Show context menu |
| **Swipe Left/Right** | Navigate slides |
| **Pinch** | Zoom thumbnail grid |
| **Two-Finger Drag** | Reorder slides |

### 11.2 Mobile Thumbnail Panel

**Responsive Behavior:**
- < 768px: Bottom drawer (swipe up)
- Horizontal scroll on mobile
- Larger touch targets (48px minimum)
- Simplified context menu

---

## 12. Future Enhancements

### 12.1 Slide Timeline View

Horizontal timeline showing all slides with time indicators:

```
├──[1]──┼──[2]──┼──[3]──┼──[4]──┼──[5]──┤
0:00    0:30    1:00    1:30    2:00    2:30
```

### 12.2 Search & Filter

- Search slide content
- Filter by section
- Filter by layout type
- Filter by transition type
- Show only slides with comments

### 12.3 Slide Overview Grid

Matrix view showing all slides at once:
- 4x3, 5x4, 6x5 layouts
- Click any slide to jump
- Useful for large presentations (50+ slides)

---

**Next**: See [03-slide-sections.md](./03-slide-sections.md) for section management details.
