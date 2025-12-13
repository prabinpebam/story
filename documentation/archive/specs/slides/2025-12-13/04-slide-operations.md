# Slide Operations - CRUD, Copy/Paste, Transitions

**Version:** 1.0  
**Last Updated:** December 7, 2025

## 1. Overview

This document specifies all slide manipulation operations including creation, duplication, deletion, copy/paste behavior, transitions, and batch operations.

---

## 2. Basic Slide Operations

### 2.1 Create New Slide

**Methods:**

**1. Toolbar Button**
- Click "New Slide" button
- Dropdown shows layout options
- Default: Adds slide with same layout as current

**2. Keyboard Shortcut**
- **Ctrl + M**: New slide after current
- **Ctrl + Shift + M**: New slide at end
- **Enter** (in thumbnail panel): New slide after selected

**3. Context Menu**
- Right-click thumbnail → "New Slide"
- Right-click canvas → "Insert Slide"

**Layout Selection Dialog:**
```
┌───────────────────────────────────────────────┐
│  New Slide - Choose Layout                 ✕  │
├───────────────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐     │
│  │Title │  │Title │  │Two   │  │Blank │     │
│  │      │  │+Body │  │Column│  │      │     │
│  └──────┘  └──────┘  └──────┘  └──────┘     │
│  [✓]       [ ]       [ ]       [ ]           │
│                                               │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐     │
│  │Title │  │Comp  │  │Picture│  │Quote │     │
│  │Only  │  │arison│  │+Cap  │  │      │     │
│  └──────┘  └──────┘  └──────┘  └──────┘     │
│  [ ]       [ ]       [ ]       [ ]           │
│                                               │
│  [ Cancel ]           [ Create Slide ]        │
└───────────────────────────────────────────────┘
```

**Insertion Logic:**
```javascript
function insertSlide(layout, position = 'after-current') {
  const newSlide = {
    id: generateId(),
    masterId: currentSlide.masterId,  // Inherit master
    layoutId: layout.id,
    sectionId: currentSlide.sectionId, // Inherit section
    position: calculatePosition(position),
    elements: clonePlaceholders(layout),
    notes: '',
    transition: getDefaultTransition(),
    animations: []
  };
  
  presentation.slides.splice(newSlide.position, 0, newSlide);
  reindexSlides();
  selectSlide(newSlide.id);
  
  return newSlide;
}
```

### 2.2 Duplicate Slide

**Behavior:**
- Creates exact copy of selected slide(s)
- Includes all elements, animations, transitions
- Inserted immediately after source slide
- Multi-select: Duplicates all selected slides in order

**Keyboard:** **Ctrl + D**

**What Gets Duplicated:**
- ✅ All elements (shapes, text, images, etc.)
- ✅ Element properties (position, size, fill, stroke)
- ✅ Animations and timings
- ✅ Slide transition
- ✅ Slide notes
- ✅ Layout and master assignment
- ✅ Background override (if any)
- ❌ Slide ID (new ID generated)
- ❌ Comments (not duplicated)

**Implementation:**
```javascript
function duplicateSlide(slideId) {
  const source = presentation.slides.find(s => s.id === slideId);
  const duplicate = deepClone(source);
  
  // Generate new IDs
  duplicate.id = generateId();
  duplicate.elements.forEach(el => el.id = generateId());
  
  // Insert after source
  const insertIndex = source.position + 1;
  presentation.slides.splice(insertIndex, 0, duplicate);
  
  reindexSlides();
  return duplicate;
}

function duplicateSlides(slideIds) {
  const duplicates = [];
  const sortedIds = sortByPosition(slideIds);
  
  sortedIds.forEach((id, index) => {
    const duplicate = duplicateSlide(id);
    duplicates.push(duplicate);
  });
  
  return duplicates;
}
```

### 2.3 Delete Slide

**Behavior:**
- Removes slide from presentation
- If last slide, creates new blank slide
- Multi-select: Deletes all selected slides
- Undo supported

**Keyboard:** **Delete** or **Backspace**

**Confirmation:**
```
┌───────────────────────────────────────┐
│  Delete Slide?                     ✕  │
├───────────────────────────────────────┤
│  Are you sure you want to delete      │
│  slide 5?                              │
│                                        │
│  ☐ Don't ask again                    │
│                                        │
│  [ Cancel ]  [ Delete ]                │
└───────────────────────────────────────┘
```

**Multi-Delete Confirmation:**
```
┌───────────────────────────────────────┐
│  Delete Multiple Slides?           ✕  │
├───────────────────────────────────────┤
│  Are you sure you want to delete      │
│  5 slides?                             │
│                                        │
│  Slides: 3, 5, 7, 9, 11                │
│                                        │
│  ☐ Don't ask again                    │
│                                        │
│  [ Cancel ]  [ Delete All ]            │
└───────────────────────────────────────┘
```

**Edge Cases:**
```javascript
function deleteSlides(slideIds) {
  // Cannot delete if it would leave 0 slides
  if (slideIds.length === presentation.slides.length) {
    // Keep first slide, delete others
    slideIds = slideIds.slice(1);
    if (slideIds.length === 0) {
      // Create new blank slide instead
      const newSlide = createBlankSlide();
      presentation.slides = [newSlide];
      return;
    }
  }
  
  // Remove slides
  presentation.slides = presentation.slides.filter(
    s => !slideIds.includes(s.id)
  );
  
  // Select next available slide
  const nextSlide = findNextSlide(slideIds[0]);
  selectSlide(nextSlide.id);
  
  reindexSlides();
}
```

---

## 3. Copy, Cut, and Paste

### 3.1 Copy Slide

**Keyboard:** **Ctrl + C**

**Behavior:**
- Copies selected slide(s) to clipboard
- Supports multi-select
- Does not remove slides from presentation
- Clipboard persists until overwritten

**Clipboard Format:**
```javascript
{
  type: 'application/story-slides',
  version: '1.0',
  slides: [
    {
      // Full slide data including elements
    }
  ],
  metadata: {
    sourcePresentation: presentationId,
    copyTime: new Date(),
    slideCount: 1
  }
}
```

### 3.2 Cut Slide

**Keyboard:** **Ctrl + X**

**Behavior:**
- Copies slide(s) to clipboard
- Removes slide(s) from presentation
- Visual feedback: Slides appear dimmed/ghosted
- Paste or Undo restores slides

**Visual State:**
```css
.slide-thumbnail.cut {
  opacity: 0.4;
  pointer-events: none;
  position: relative;
}

.slide-thumbnail.cut::after {
  content: 'Cut';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--color-bg-tooltip);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
}
```

### 3.3 Paste Slide

**Keyboard:** **Ctrl + V**

**Behavior:**
- Inserts clipboard slides after current slide
- Maintains relative order of copied slides
- Updates master if pasting from different presentation
- Resolves ID conflicts

**Paste Options Dialog:**
```
┌───────────────────────────────────────────────┐
│  Paste Slides                              ✕  │
├───────────────────────────────────────────────┤
│  You are pasting 3 slides from another       │
│  presentation.                                 │
│                                                │
│  Master Slide Options:                        │
│  ○ Use Current Presentation Master            │
│  ● Keep Source Presentation Master            │
│                                                │
│  Formatting:                                   │
│  ☑ Keep source formatting                     │
│  ☐ Use destination theme colors               │
│                                                │
│  [ Cancel ]  [ Paste ]                         │
└───────────────────────────────────────────────┘
```

**Implementation:**
```javascript
function pasteSlides(position = 'after-current') {
  const clipboardData = getClipboard();
  
  if (!clipboardData || clipboardData.type !== 'application/story-slides') {
    return;
  }
  
  const slides = clipboardData.slides;
  const insertIndex = calculateInsertIndex(position);
  
  slides.forEach((slide, index) => {
    const newSlide = processClipboardSlide(slide);
    newSlide.position = insertIndex + index;
    presentation.slides.splice(newSlide.position, 0, newSlide);
  });
  
  reindexSlides();
  selectSlides(slides.map(s => s.id));
}

function processClipboardSlide(clipboardSlide) {
  const newSlide = deepClone(clipboardSlide);
  
  // Generate new IDs
  newSlide.id = generateId();
  newSlide.elements.forEach(el => {
    el.id = generateId();
  });
  
  // Handle master compatibility
  if (!masterExists(newSlide.masterId)) {
    newSlide.masterId = presentation.defaultMaster;
    newSlide.layoutId = findCompatibleLayout(clipboardSlide.layoutId);
  }
  
  // Resolve asset references
  newSlide.elements.forEach(el => {
    if (el.type === 'image' || el.type === 'video') {
      resolveAssetReference(el);
    }
  });
  
  return newSlide;
}
```

### 3.4 Cross-Presentation Paste

**Challenges:**
1. **Master Compatibility**: Source master may not exist in target
2. **Asset References**: Images/videos need to be copied
3. **Font Availability**: Fonts may not be available
4. **Color Themes**: Color references may need mapping

**Resolution Strategy:**
```javascript
function pasteCrossPresentation(slides, targetPresentation) {
  slides.forEach(slide => {
    // 1. Map master
    const targetMaster = findOrCreateMaster(
      slide.masterId,
      targetPresentation
    );
    slide.masterId = targetMaster.id;
    
    // 2. Copy assets
    slide.elements.forEach(el => {
      if (el.type === 'image' || el.type === 'video') {
        const asset = copyAsset(el.assetId, targetPresentation);
        el.assetId = asset.id;
      }
    });
    
    // 3. Map fonts
    slide.elements.forEach(el => {
      if (el.type === 'text') {
        el.font = mapFont(el.font, targetPresentation);
      }
    });
    
    // 4. Map colors (optional)
    if (options.useDestinationTheme) {
      mapThemeColors(slide, targetPresentation.theme);
    }
  });
}
```

---

## 4. Slide Transitions

### 4.1 Transition Types

**None (Cut)**
- Instant switch
- No animation
- Default for new slides

**Fade**
- Crossfade between slides
- Duration: 0.3s - 3s
- Smooth: Uses ease-in-out

**Push**
- Current slide pushed out by incoming slide
- Direction: Left, Right, Up, Down
- Duration: 0.3s - 2s

**Wipe**
- Incoming slide wipes over current
- Direction: Left, Right, Up, Down
- Duration: 0.3s - 2s

**Cover/Uncover**
- Incoming slide covers current (Cover)
- Current slide uncovers next (Uncover)
- Direction: Left, Right, Up, Down

**Zoom**
- Current slide zooms out while next zooms in
- Variants: Zoom In, Zoom Out
- Duration: 0.3s - 2s

**Rotate**
- 3D rotation between slides
- Variants: Cube, Flip, Rotate
- Duration: 0.5s - 2s

**Dissolve**
- Pixelated dissolve effect
- Block size: 8px - 64px
- Duration: 0.5s - 1.5s

**Future Transitions:**
- Morph (object-level animation)
- Curtain
- Origami
- Fracture

### 4.2 Transition Settings

**Interface:**
```
┌───────────────────────────────────────────────┐
│  Transition                                    │
├───────────────────────────────────────────────┤
│  Effect: [Fade          ▼]                    │
│                                                │
│  Duration: [━━●──────] 0.5s                   │
│                                                │
│  Direction: ○ Left  ● Right  ○ Up  ○ Down     │
│                                                │
│  Sound: [None           ▼]                    │
│                                                │
│  ☑ Smooth (ease-in-out)                       │
│  ☐ Apply to all slides                        │
│                                                │
│  [Preview]                                     │
└───────────────────────────────────────────────┘
```

**Data Model:**
```typescript
interface SlideTransition {
  type: TransitionType;
  duration: number;        // milliseconds
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  direction?: 'left' | 'right' | 'up' | 'down';
  sound?: {
    src: string;
    volume: number;        // 0.0 - 1.0
  };
  delay?: number;          // milliseconds before transition starts
}

type TransitionType = 
  | 'none' 
  | 'fade' 
  | 'push' 
  | 'wipe' 
  | 'cover' 
  | 'uncover'
  | 'zoom-in'
  | 'zoom-out'
  | 'rotate'
  | 'dissolve';
```

### 4.3 Apply Transition

**Single Slide:**
1. Select slide
2. Open Transitions panel
3. Choose effect
4. Adjust settings
5. Preview

**Multiple Slides:**
1. Select multiple slides
2. Choose transition
3. Confirm: "Apply to 5 slides?"
4. Apply

**All Slides:**
1. Check "Apply to all slides"
2. Choose transition
3. Confirmation: "This will replace all existing transitions. Continue?"

### 4.4 Transition Preview

**Preview Button Behavior:**
- Shows mini animation in thumbnail
- Full-size preview in canvas
- Can scrub through transition with slider

**Preview Controls:**
```
┌────────────────────────────────────┐
│  Transition Preview                │
├────────────────────────────────────┤
│  ┌──────────────────────────────┐  │
│  │                              │  │
│  │      [Animation playing]     │  │
│  │                              │  │
│  └──────────────────────────────┘  │
│  [◀] [━━━●────────] [▶]    ⟲      │
│                                    │
│  [Close]                           │
└────────────────────────────────────┘
```

---

## 5. Batch Operations

### 5.1 Apply to Selected

Operations that work on multiple selected slides:

| Operation | Multi-Select Support |
|-----------|---------------------|
| **Delete** | ✅ Yes |
| **Duplicate** | ✅ Yes |
| **Cut/Copy/Paste** | ✅ Yes |
| **Change Layout** | ✅ Yes |
| **Apply Transition** | ✅ Yes |
| **Hide/Show** | ✅ Yes |
| **Move to Section** | ✅ Yes |
| **Change Master** | ✅ Yes |
| **Reset to Layout** | ✅ Yes |

### 5.2 Change Layout (Batch)

**Dialog:**
```
┌───────────────────────────────────────────────┐
│  Change Layout for 5 Slides                ✕  │
├───────────────────────────────────────────────┤
│  Select new layout:                           │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐     │
│  │Title │  │Title │  │Two   │  │Blank │     │
│  │      │  │+Body │  │Column│  │      │     │
│  └──────┘  └──────┘  └──────┘  └──────┘     │
│  [ ]       [✓]       [ ]       [ ]           │
│                                               │
│  Content Handling:                            │
│  ● Reflow content to match new layout        │
│  ○ Keep existing positions (may overflow)    │
│  ○ Clear content (keep layout only)          │
│                                               │
│  [ Cancel ]           [ Apply ]               │
└───────────────────────────────────────────────┘
```

### 5.3 Reset to Layout

**Purpose:** Removes all user overrides and restores original layout

**Confirmation:**
```
┌───────────────────────────────────────────────┐
│  Reset Slides to Layout?                   ✕  │
├───────────────────────────────────────────────┤
│  This will remove all customizations and      │
│  restore the original layout for 3 slides.    │
│                                                │
│  The following will be reset:                 │
│  ✓ Background                                 │
│  ✓ Placeholder positions                      │
│  ✓ Master elements visibility                 │
│                                                │
│  Content will be preserved:                   │
│  ✓ Text and images in placeholders           │
│  ✓ Custom elements you added                  │
│                                                │
│  [ Cancel ]           [ Reset ]               │
└───────────────────────────────────────────────┘
```

---

## 6. Slide Hiding

### 6.1 Hide Slide Feature

**Purpose:** Temporarily skip slides during presentation without deleting

**Methods:**
- Right-click slide → "Hide Slide"
- Keyboard: **H**
- Slide menu → Hide

**Visual Indication:**
```
┌──────────────────┐
│ ┌──────────────┐ │
│ │ 5        👁‍🗨 │ │ ← Eye icon with slash
│ │              │ │
│ │   Content    │ │ ← Dimmed (opacity: 0.5)
│ │              │ │
│ └──────────────┘ │
│ Hidden Slide     │
└──────────────────┘
```

**Presentation Behavior:**
- Hidden slides skipped in normal navigation
- Accessible via slide number (e.g., type "5" + Enter)
- Shown in presenter view with "Hidden" indicator
- Included in slide count (e.g., "Slide 4 of 12 (1 hidden)")

### 6.2 Show All Hidden Slides

**Bulk Operation:**
```
Right-click any slide → Show All Hidden Slides
```

**Confirmation:**
```
┌───────────────────────────────────────┐
│  Show All Hidden Slides?           ✕  │
├───────────────────────────────────────┤
│  This will show 3 hidden slides:      │
│                                        │
│  • Slide 5: Old Data                  │
│  • Slide 9: Outdated Chart            │
│  • Slide 12: Archived Content         │
│                                        │
│  [ Cancel ]  [ Show All ]              │
└───────────────────────────────────────┘
```

---

## 7. Slide Reordering

### 7.1 Drag and Drop

**Normal View (Thumbnail Panel):**
- Drag thumbnail to new position
- Drop indicator line shows insert position
- Multi-select: All selected slides move together
- Maintains relative order

**Slide Sorter View:**
- Drag anywhere on thumbnail
- Grid layout adjusts dynamically
- Smooth animation during reorder

**Implementation:**
```javascript
function reorderSlide(slideId, newPosition) {
  const slide = presentation.slides.find(s => s.id === slideId);
  const oldPosition = slide.position;
  
  // Remove from old position
  presentation.slides.splice(oldPosition, 1);
  
  // Insert at new position
  presentation.slides.splice(newPosition, 0, slide);
  
  // Reindex all slides
  reindexSlides();
  
  // Update section membership if needed
  updateSectionMembership(slideId);
}

function reorderMultipleSlides(slideIds, newPosition) {
  const slides = slideIds.map(id => 
    presentation.slides.find(s => s.id === id)
  );
  
  // Sort by current position
  slides.sort((a, b) => a.position - b.position);
  
  // Remove all from current positions
  presentation.slides = presentation.slides.filter(
    s => !slideIds.includes(s.id)
  );
  
  // Insert all at new position
  presentation.slides.splice(newPosition, 0, ...slides);
  
  reindexSlides();
}
```

### 7.2 Move to Position

**Dialog:**
```
┌───────────────────────────────────────┐
│  Move Slide to Position            ✕  │
├───────────────────────────────────────┤
│  Current position: 5                  │
│                                        │
│  New position: [3_]                   │
│                                        │
│  (1 = beginning, 12 = end)            │
│                                        │
│  [ Cancel ]  [ Move ]                  │
└───────────────────────────────────────┘
```

---

## 8. Undo/Redo for Slide Operations

### 8.1 Supported Operations

All slide operations are undoable:

| Operation | Undo Behavior |
|-----------|---------------|
| **New Slide** | Delete created slide |
| **Delete Slide** | Restore deleted slide at original position |
| **Duplicate** | Delete duplicate |
| **Reorder** | Restore original order |
| **Cut** | Restore cut slides |
| **Paste** | Delete pasted slides |
| **Change Layout** | Restore previous layout |
| **Apply Transition** | Restore previous transition |
| **Hide/Show** | Toggle visibility |

### 8.2 Undo Stack

```javascript
class SlideUndoManager {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
    this.maxStackSize = 50;
  }
  
  pushAction(action) {
    this.undoStack.push({
      type: action.type,
      timestamp: Date.now(),
      data: action.data,
      undo: action.undo,
      redo: action.redo
    });
    
    // Clear redo stack
    this.redoStack = [];
    
    // Limit stack size
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift();
    }
  }
  
  undo() {
    if (this.undoStack.length === 0) return;
    
    const action = this.undoStack.pop();
    action.undo();
    this.redoStack.push(action);
  }
  
  redo() {
    if (this.redoStack.length === 0) return;
    
    const action = this.redoStack.pop();
    action.redo();
    this.undoStack.push(action);
  }
}
```

---

**Next**: See [05-slide-thumbnails.md](./05-slide-thumbnails.md) for thumbnail generation and caching details.
