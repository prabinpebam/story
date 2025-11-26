# Media Fill System - Implementation Plan

## Overview

This plan details the phased implementation of the media fill system, which treats images and videos as fill layers on shapes rather than separate element types.

**Estimated Total Time**: 44-54 hours (revised with validation gates)

---

## Pre-Implementation Checklist

Before starting, verify these dependencies exist and understand their current state:

### Must Verify

- [ ] **HistoryManager.js** - Does it have extensible eviction? (Answer: No, needs modification)
- [ ] **FillFlyout structure** - Does `FillFlyout.js` exist? (Check actual file structure)
- [ ] **ShapeElement.applyFills()** - Review current 200+ line implementation
- [ ] **Store action patterns** - Review how existing fills are updated
- [ ] **FillSection layer display** - How are solid/gradient fills shown in list?

### Must Create First

- [ ] **HistoryManager `onEvict` callback** - Add before Phase 9
- [ ] **MediaAssetManager skeleton** - Create empty class to unblock parallel work

---

## Micro-Phase Implementation

Each micro-phase is ~2 hours, independently testable, and has explicit validation criteria.

---

## PHASE 1: Core Infrastructure (6-8 hours)

### 1.1 Constants & Types (1.5 hours)

**File**: `src/core/constants/MediaDefaults.js`

**Tasks**:
```javascript
// Create this file with:
export const DEFAULT_IMAGE_FILL = { /* all defaults */ };
export const DEFAULT_VIDEO_FILL = { /* all defaults */ };
export const SUPPORTED_IMAGE_FORMATS = ['image/jpeg', 'image/png', ...];
export const SUPPORTED_VIDEO_FORMATS = ['video/mp4', 'video/webm', ...];
export const FILE_SIZE_LIMITS = { image: 50*1024*1024, video: 500*1024*1024 };
export const ASSET_ID_PREFIX = { image: 'img_', video: 'vid_' };
```

**Validation Gate 1.1**:
```javascript
// In browser console:
import { DEFAULT_IMAGE_FILL } from './core/constants/MediaDefaults.js';
console.assert(DEFAULT_IMAGE_FILL.type === 'image');
console.assert(DEFAULT_IMAGE_FILL.scaleMode === 'fill');
console.assert(DEFAULT_IMAGE_FILL.filters.exposure === 0);
// ✅ PASS: All imports work, no syntax errors
```

---

### 1.2 MediaAssetManager Skeleton (2 hours)

**File**: `src/core/media/MediaAssetManager.js`

**Tasks** (implement stubs first, real logic later):
```javascript
class MediaAssetManager {
    constructor() {
        this.assets = new Map();
    }
    
    // STUB: Returns fake assetId for testing
    async importFile(file) {
        const assetId = `img_test_${Date.now()}`;
        // TODO: Real implementation
        return { assetId, blobUrl: URL.createObjectURL(file), metadata: {} };
    }
    
    getBlobUrl(assetId) {
        // TODO: Real implementation
        return this.assets.get(assetId)?.blobUrl || null;
    }
    
    has(assetId) { return this.assets.has(assetId); }
    retain(assetId) { /* TODO */ }
    release(assetId) { /* TODO */ }
}

export const mediaAssetManager = new MediaAssetManager();
```

**Validation Gate 1.2**:
```javascript
import { mediaAssetManager } from './core/media/MediaAssetManager.js';
const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
const result = await mediaAssetManager.importFile(file);
console.assert(result.assetId.startsWith('img_'));
console.assert(result.blobUrl.startsWith('blob:'));
// ✅ PASS: Basic import works
```

---

### 1.3 Asset ID Generation (1.5 hours)

**File**: `src/core/media/MediaAssetManager.js` (continue)

**Tasks**:
```javascript
async generateAssetId(file) {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    const prefix = file.type.startsWith('video/') ? 'vid' : 'img';
    const ext = file.type.split('/')[1]?.split('+')[0] || 'bin';
    
    return `${prefix}_${hashHex.substring(0, 12)}.${ext}`;
}
```

**Validation Gate 1.3**:
```javascript
const file1 = new File(['hello'], 'a.jpg', { type: 'image/jpeg' });
const file2 = new File(['hello'], 'b.jpg', { type: 'image/jpeg' }); // Same content
const file3 = new File(['world'], 'c.jpg', { type: 'image/jpeg' }); // Different

const id1 = await mediaAssetManager.generateAssetId(file1);
const id2 = await mediaAssetManager.generateAssetId(file2);
const id3 = await mediaAssetManager.generateAssetId(file3);

console.assert(id1 === id2, 'Same content = same ID (deduplication)');
console.assert(id1 !== id3, 'Different content = different ID');
console.assert(id1.startsWith('img_'), 'Correct prefix');
// ✅ PASS: Deduplication works
```

---

### 1.4 ImageProcessor (1.5 hours)

**File**: `src/core/media/ImageProcessor.js`

**Tasks**:
```javascript
export class ImageProcessor {
    async process(file) {
        const { assetId, blobUrl } = await mediaAssetManager.importFile(file);
        const { width, height } = await this.getDimensions(blobUrl);
        
        return {
            ...DEFAULT_IMAGE_FILL,
            assetId,
            originalWidth: width,
            originalHeight: height,
            fileName: file.name,
            fileSize: file.size
        };
    }
    
    getDimensions(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
            img.onerror = reject;
            img.src = src;
        });
    }
}
```

**Validation Gate 1.4**:
```javascript
const processor = new ImageProcessor();
// Use a real image file
const fill = await processor.process(realImageFile);

console.assert(fill.type === 'image');
console.assert(fill.originalWidth > 0);
console.assert(fill.originalHeight > 0);
console.assert(fill.assetId.startsWith('img_'));
// ✅ PASS: Image processing works
```

---

### 1.5 FilterEngine (1.5 hours)

**File**: `src/core/media/FilterEngine.js`

**Tasks**:
```javascript
export class FilterEngine {
    static buildCssFilter(filters) {
        const parts = [];
        
        // ORDER MATTERS: temperature/tint handled separately via SVG
        if (filters.exposure !== 0) parts.push(`brightness(${1 + filters.exposure/100})`);
        if (filters.contrast !== 0) parts.push(`contrast(${1 + filters.contrast/100})`);
        if (filters.saturation !== 0) parts.push(`saturate(${1 + filters.saturation/100})`);
        if (filters.hueRotate !== 0) parts.push(`hue-rotate(${filters.hueRotate}deg)`);
        if (filters.grayscale !== 0) parts.push(`grayscale(${filters.grayscale}%)`);
        if (filters.sepia !== 0) parts.push(`sepia(${filters.sepia}%)`);
        if (filters.invert !== 0) parts.push(`invert(${filters.invert}%)`);
        // Blur ALWAYS last
        if (filters.blur !== 0) parts.push(`blur(${filters.blur}px)`);
        
        return parts.join(' ') || 'none';
    }
}
```

**Validation Gate 1.5**:
```javascript
const css = FilterEngine.buildCssFilter({ 
    exposure: 20, contrast: -10, blur: 5, saturation: 0, 
    hueRotate: 0, grayscale: 0, sepia: 0, invert: 0,
    temperature: 0, tint: 0, highlights: 0, shadows: 0
});

console.assert(css.includes('brightness(1.2)'));
console.assert(css.includes('contrast(0.9)'));
console.assert(css.endsWith('blur(5px)'), 'Blur must be last');
// ✅ PASS: Filter string generation works
```

---

## PHASE 2: Renderer Integration (6-8 hours)

### 2.1 ShapeElement Media Methods (3 hours)

**File**: `src/core/renderer/elements/ShapeElement.js` (MODIFY)

**Strategy**: Add new methods without modifying existing `applyFills()` yet.

**Tasks**:
```javascript
// ADD these new methods (don't modify applyFills yet):

applyImageFill(layer, fill, el) {
    // Clear any previous content
    layer.innerHTML = '';
    
    const blobUrl = mediaAssetManager.getBlobUrl(fill.assetId);
    if (!blobUrl) {
        layer.style.background = '#f0f0f0'; // Error state
        return;
    }
    
    if (fill.scaleMode === 'tile') {
        // Tile mode: use CSS background
        layer.style.backgroundImage = `url(${blobUrl})`;
        layer.style.backgroundRepeat = 'repeat';
        layer.style.backgroundSize = 'auto';
    } else {
        // Other modes: use img element
        const img = document.createElement('img');
        img.src = blobUrl;
        img.style.position = 'absolute';
        img.style.pointerEvents = 'none';
        this.applyMediaScaleMode(img, fill, el);
        this.applyMediaFilters(img, fill, el.id);
        layer.appendChild(img);
    }
}

applyMediaScaleMode(mediaEl, fill, el) {
    const { scaleMode, position, scale, rotation } = fill;
    
    // Calculate dimensions based on scale mode
    // ... (implementation from spec)
}

applyMediaFilters(mediaEl, fill, elementId) {
    const cssFilter = FilterEngine.buildCssFilter(fill.filters);
    mediaEl.style.filter = cssFilter;
}
```

**Validation Gate 2.1**:
```javascript
// In browser: Create a shape, manually add image fill to state
const testFill = {
    type: 'image',
    assetId: 'img_test123',
    scaleMode: 'fill',
    position: { x: 0.5, y: 0.5 },
    scale: 1,
    rotation: 0,
    filters: { /* all zeros */ },
    visible: true,
    opacity: 100
};

// Manually call applyImageFill on a test layer
// Verify: Image displays, no console errors
// ✅ PASS: Image renders in shape
```

---

### 2.2 Integrate into applyFills() (2 hours)

**File**: `src/core/renderer/elements/ShapeElement.js` (MODIFY)

**Tasks**: Add routing for image/video types in existing `applyFills()`:

```javascript
// In the fills.forEach loop, add cases:
if (fill.type === 'image') {
    this.applyImageFill(layer, fill, el);
} else if (fill.type === 'video') {
    this.applyVideoFill(layer, fill, el);
} else if (fill.type === 'code') {
    // existing code fill logic
} else {
    // existing solid/gradient logic
}
```

**Validation Gate 2.2**:
```javascript
// Create shape with image fill via store:
store.dispatch('UPDATE_ELEMENT', {
    id: shapeId,
    style: {
        fills: [{ 
            type: 'image', 
            assetId: testAssetId,
            /* ... defaults */
        }]
    }
});

// Verify: Shape shows image
// Verify: Can still add solid fill on top
// Verify: Existing shapes with solid/gradient still work
// ✅ PASS: Mixed fill types work
```

---

### 2.3 Scale Mode Implementation (2 hours)

**Tasks**: Implement all 4 scale modes:

```javascript
applyMediaScaleMode(mediaEl, fill, el) {
    const { scaleMode, position, scale } = fill;
    const { originalWidth, originalHeight } = fill;
    const shapeRatio = el.width / el.height;
    const mediaRatio = originalWidth / originalHeight;
    
    switch (scaleMode) {
        case 'fill':
            if (mediaRatio > shapeRatio) {
                mediaEl.style.height = '100%';
                mediaEl.style.width = 'auto';
            } else {
                mediaEl.style.width = '100%';
                mediaEl.style.height = 'auto';
            }
            break;
        case 'fit':
            if (mediaRatio > shapeRatio) {
                mediaEl.style.width = '100%';
                mediaEl.style.height = 'auto';
            } else {
                mediaEl.style.height = '100%';
                mediaEl.style.width = 'auto';
            }
            break;
        case 'stretch':
            mediaEl.style.width = '100%';
            mediaEl.style.height = '100%';
            break;
        case 'tile':
            // Handled in applyImageFill via CSS
            break;
    }
    
    // Apply position offset
    mediaEl.style.left = `${(position.x - 0.5) * 100}%`;
    mediaEl.style.top = `${(position.y - 0.5) * 100}%`;
    mediaEl.style.transform = `translate(-50%, -50%) scale(${scale})`;
}
```

**Validation Gate 2.3**:
```javascript
// For each scale mode:
// 1. Create square shape with wide image → verify mode works
// 2. Create tall shape with wide image → verify mode works
// 3. Toggle between modes → verify updates correctly

// Visual check:
// - 'fill': Image covers shape, may crop
// - 'fit': Image fits inside, may letterbox
// - 'stretch': Image distorts to fill exactly
// - 'tile': Image repeats

// ✅ PASS: All 4 scale modes render correctly
```

---

### 2.4 Media Fill CSS (1 hour)

**File**: `src/styles/modules/_media-fills.scss`

**Tasks**:
```scss
.fill-layer {
    // Image/video fills
    img, video {
        position: absolute;
        pointer-events: none;
        user-select: none;
        -webkit-user-drag: none;
    }
    
    &.error {
        background: repeating-linear-gradient(
            45deg,
            #f0f0f0,
            #f0f0f0 10px,
            #e0e0e0 10px,
            #e0e0e0 20px
        );
        
        &::after {
            content: '⚠';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 24px;
        }
    }
}
```

**Validation Gate 2.4**:
```css
/* In browser: */
/* - Media doesn't capture mouse events (can select shape behind) */
/* - Media can't be dragged */
/* - Error state shows striped background */
// ✅ PASS: CSS styles applied correctly
```

---

## PHASE 3: UI Components (8-10 hours)

### 3.1 Locate Existing UI Structure (1 hour)

**Pre-task**: Find actual file structure for fill UI.

```bash
# Run in terminal:
grep -r "FillFlyout\|fill.*tab\|ImageTab" src/ui --include="*.js"
ls src/ui/components/
```

**Validation Gate 3.1**:
- [ ] Document actual UI structure
- [ ] Identify where Image/Video tabs should be added
- [ ] Update this plan with correct file paths

---

### 3.2-3.6 (UI Components - 7-9 hours)

*Implementation details as in original plan, but each component gets its own validation gate.*

---

## PHASE 4-8: (As in original plan)

---

## PHASE 9: Blob Lifecycle & Reference Counting (4-5 hours)

**File**: `src/ui/components/FillFlyout/FillFlyout.js` (MODIFY)

**Tasks**:
- [ ] Add Image type button (▣ icon)
- [ ] Add Video type button (🎬 icon)
- [ ] Route to ImageTab/VideoTab based on type

**Validation**:
- [ ] Clicking Image/Video buttons switches tab
- [ ] Active state shows correctly

---

### 3.2 ImageTab Component

**File**: `src/ui/components/FillFlyout/ImageTab.js` (NEW)

**Tasks**:
- [ ] Create ImageTab class
- [ ] Add MediaPreview component
- [ ] Add drop zone with browse button
- [ ] Add ScaleModeSelector
- [ ] Add PositionControl (grid + numeric inputs)
- [ ] Add FilterControls
- [ ] Handle file import via drag/drop and browse
- [ ] Wire up onChange for all controls

**Validation**:
- [ ] Drop zone accepts images
- [ ] Browse button opens file picker
- [ ] Scale mode changes reflected immediately
- [ ] Position controls update preview
- [ ] Filter sliders affect preview

---

### 3.3 VideoTab Component

**File**: `src/ui/components/FillFlyout/VideoTab.js` (NEW)

**Tasks**:
- [ ] Create VideoTab class
- [ ] Extend ImageTab with video-specific controls
- [ ] Add VideoControls (play/pause, timeline, speed)
- [ ] Add trim controls (start/end range slider)
- [ ] Add loop/autoplay/muted toggles
- [ ] Add volume slider
- [ ] Add "Set as Poster" button

**Validation**:
- [ ] Video preview plays/pauses
- [ ] Timeline scrubbing works
- [ ] Speed changes take effect
- [ ] Trim handles update fill
- [ ] Poster frame extraction works

---

### 3.4 Shared Sub-Components

**Files**: 
- `MediaPreview.js`
- `ScaleModeSelector.js`
- `PositionControl.js`
- `FilterControls.js`
- `VideoControls.js`

**Tasks**:
- [ ] MediaPreview: Canvas/video preview with aspect ratio handling
- [ ] ScaleModeSelector: 4-button toggle (fill/fit/stretch/tile)
- [ ] PositionControl: 9-grid + X/Y inputs + scale + rotation + reset
- [ ] FilterControls: Sliders for all filter properties
- [ ] VideoControls: Full playback controls

**Validation**:
- [ ] Each component works in isolation
- [ ] All callbacks fire correctly
- [ ] Visual styling matches design system

---

## Phase 4: Canvas Interactions (4-6 hours)

### 4.1 Drag & Drop onto Canvas

**File**: `src/core/CanvasManager.js` (MODIFY)

**Tasks**:
- [ ] Add `setupMediaDragDrop()` method
- [ ] Detect media files in dragover
- [ ] Show drop indicator on canvas
- [ ] Handle drop on empty area (create new shape)
- [ ] Handle drop on existing shape (add fill layer)

**Validation**:
- [ ] Drag image file shows drop cursor
- [ ] Drop on canvas creates shape at location
- [ ] Drop on shape adds fill layer
- [ ] Shape sized to image dimensions

---

### 4.2 Paste from Clipboard

**File**: `src/core/CanvasManager.js` (MODIFY)

**Tasks**:
- [ ] Detect image in clipboard on paste
- [ ] If shape selected: add as fill layer
- [ ] If no selection: create new shape with fill

**Validation**:
- [ ] Cmd+V with image in clipboard works
- [ ] Correct behavior based on selection state

---

### 4.3 Video Control Overlay

**File**: `src/ui/overlays/VideoControlOverlay.js` (NEW)

**Tasks**:
- [ ] Create overlay component
- [ ] Position at bottom of selected video shape
- [ ] Play/pause, skip, timeline, volume, fullscreen
- [ ] Show on hover/select, hide on deselect
- [ ] Wire to actual video element

**Validation**:
- [ ] Overlay appears on video shape selection
- [ ] Controls affect video playback
- [ ] Overlay disappears on deselect

---

### 4.4 On-Canvas Media Manipulation

**Tasks**:
- [ ] Space+drag to pan media within shape
- [ ] Alt+scroll to scale media
- [ ] Cmd+Alt+drag to rotate media

**Validation**:
- [ ] Pan updates fill.position
- [ ] Scale updates fill.scale
- [ ] Rotate updates fill.rotation
- [ ] All operations feel smooth

---

## Phase 5: Reset & Advanced Features (3-4 hours)

### 5.1 Reset to Original Size

**Tasks**:
- [ ] "Reset to Original" button in PositionControl
- [ ] Dispatch special action to resize shape
- [ ] Reset position/scale/rotation to defaults

**Validation**:
- [ ] Shape resizes to exact media dimensions
- [ ] All transform properties reset
- [ ] Undo/redo works

---

### 5.2 FillSection Display

**File**: `src/ui/properties/FillSection.js` (MODIFY)

**Tasks**:
- [ ] Show thumbnail for image/video fills in layer list
- [ ] Display filename or "Image"/"Video" label
- [ ] Handle remove (cleanup blob URLs)

**Validation**:
- [ ] Layer list shows media thumbnails
- [ ] Labels display correctly
- [ ] Remove properly cleans up

---

### 5.3 Error States

**Tasks**:
- [ ] Handle image load failure
- [ ] Handle video load/playback failure
- [ ] Show error UI with retry/remove options
- [ ] Log errors for debugging

**Validation**:
- [ ] Broken image URL shows error state
- [ ] Unsupported video format shows message
- [ ] Retry works if source becomes available

---

## Phase 6: Store & Persistence (2-3 hours)

### 6.1 Store Actions

**File**: `src/core/Store.js` (MODIFY)

**Tasks**:
- [ ] Add `IMPORT_MEDIA_FILL` action
- [ ] Add `UPDATE_MEDIA_FILL` action
- [ ] Add `RESIZE_SHAPE_TO_MEDIA` action
- [ ] Handle blob URL cleanup on fill removal

**Validation**:
- [ ] Actions dispatch correctly
- [ ] State updates as expected
- [ ] Undo/redo works for all actions

---

### 6.2 Export/Import

**Tasks**:
- [ ] Large media exported as separate asset files
- [ ] Asset references in JSON
- [ ] Re-import resolves asset references

**Validation**:
- [ ] Export with media produces valid package
- [ ] Import with media restores correctly

---

## Phase 7: Presentation Mode (2-3 hours)

### 7.1 Video Playback Sync

**File**: `src/core/PresentationManager.js` (MODIFY)

**Tasks**:
- [ ] Videos play according to their settings
- [ ] Videos can be controlled via presentation controls
- [ ] Multiple videos on same slide play simultaneously

**Validation**:
- [ ] Enter presentation → videos autoplay if set
- [ ] Audio plays if unmuted
- [ ] Exit presentation → videos stop

---

## Phase 8: Testing & Polish (3-4 hours)

### 8.1 Unit Tests

- [ ] MediaManager tests
- [ ] ImageProcessor tests
- [ ] VideoProcessor tests
- [ ] FilterEngine tests

### 8.2 Integration Tests

- [ ] Drag & drop scenarios
- [ ] Fill layer stacking
- [ ] Scale mode rendering
- [ ] Video playback

### 8.3 Visual Regression

- [ ] All scale modes
- [ ] All filter effects
- [ ] All blend modes

### 8.4 Performance Testing

- [ ] Large file handling
- [ ] Many video elements
- [ ] Memory leak detection

---

## Implementation Order Summary

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| 1. Core Infrastructure | 6-8h | None |
| 2. Renderer Integration | 6-8h | Phase 1 |
| 3. Fill Flyout UI | 8-10h | Phase 1, 2 |
| 4. Canvas Interactions | 4-6h | Phase 1, 2, 3 |
| 5. Reset & Advanced | 3-4h | Phase 2, 3 |
| 6. Store & Persistence | 2-3h | Phase 1-5 |
| 7. Presentation Mode | 2-3h | Phase 2, 6 |
| 8. Testing & Polish | 3-4h | All phases |

**Total: 32-40 hours** (original estimate)
**Revised Total: 44-54 hours** (with additional phases below)

---

## Phase 9: Blob Lifecycle & Reference Counting (4-5 hours)

### 9.1 Reference Counting System

**File**: `src/core/media/MediaManager.js` (MODIFY)

**Tasks**:
- [ ] Change blobRegistry to store `{ file, refCount, createdAt }`
- [ ] Implement `retainMediaUrl(url)` - increment refCount
- [ ] Update `releaseMediaUrl(url, inHistoryStack)` - decrement with checks
- [ ] Implement `blobToDataUrl(blobUrl)` - for clipboard
- [ ] Implement `getFileForBlobUrl(blobUrl)` - for project save
- [ ] Add `getBlobStats()` for debugging

**Validation**:
- [ ] refCount increments on element copy
- [ ] refCount decrements on element delete
- [ ] Blob not revoked while in undo stack
- [ ] Blob revoked when refCount=0 and not in history

---

### 9.2 History Manager Integration

**File**: `src/core/HistoryManager.js` (MODIFY)

**Tasks**:
- [ ] Add `onEvict` callback option
- [ ] Implement `extractBlobUrls(state)` - scan for blob URLs
- [ ] Store blobUrls set with each history entry
- [ ] Call onEvict when entries are removed

**Validation**:
- [ ] Blob URLs tracked in history entries
- [ ] onEvict called when history limit exceeded
- [ ] Released blobs not accessible after eviction

---

### 9.3 Copy/Paste Safety

**File**: `src/core/CanvasManager.js` (MODIFY)

**Tasks**:
- [ ] Implement `prepareForClipboard(elements)` - convert blobs to data URLs
- [ ] Update copy handler to use async blob conversion
- [ ] Handle cross-tab paste with data URL re-import

**Validation**:
- [ ] Copy element with blob URL → data URL in clipboard
- [ ] Paste in new tab works
- [ ] Large files warn about clipboard size

---

## Phase 10: Video Lifecycle Management (3-4 hours)

### 10.1 VideoLifecycleManager

**File**: `src/core/media/VideoLifecycleManager.js` (NEW)

**Tasks**:
- [ ] Create VideoLifecycleManager class
- [ ] Implement registration/unregistration
- [ ] Setup IntersectionObserver for visibility
- [ ] Implement concurrent video limit (max 5)
- [ ] Implement off-screen resource release (30s timeout)
- [ ] Implement video restore on visibility

**Validation**:
- [ ] Off-screen videos pause
- [ ] Max 5 videos play concurrently
- [ ] Resources released after 30s off-screen
- [ ] Resources restored when scrolled back

---

### 10.2 Slide Transition Handling

**File**: `src/core/media/VideoLifecycleManager.js` (CONTINUE)

**Tasks**:
- [ ] Implement `onSlideChange(oldSlide, newSlide)`
- [ ] Implement `onModeChange(oldMode, newMode)`
- [ ] Implement `onElementSelected(id)` / `onElementDeselected(id)`
- [ ] Integrate with Store state changes

**Validation**:
- [ ] Videos pause on slide exit
- [ ] Autoplay videos start on slide enter
- [ ] Videos pause when selected in editor
- [ ] Videos resume when deselected (if autoplay)

---

## Phase 11: Animated Image Support (2-3 hours)

### 11.1 Animation Detection

**File**: `src/core/media/ImageProcessor.js` (MODIFY)

**Tasks**:
- [ ] Add `checkIfAnimated(file)` method
- [ ] Implement `checkGifAnimation(file)` - parse GIF header
- [ ] Implement `checkWebPAnimation(file)` - parse WebP header
- [ ] Add `animated` and `playing` flags to ImageFill

**Validation**:
- [ ] Animated GIF detected correctly
- [ ] Animated WebP detected correctly
- [ ] Static images not flagged as animated

---

### 11.2 Animated Image Playback Control

**File**: `src/ui/components/FillFlyout/ImageTab.js` (MODIFY)

**Tasks**:
- [ ] Show play/pause button for animated images
- [ ] Control animation via CSS or canvas
- [ ] Persist playing state

**Validation**:
- [ ] Animated GIF can be paused
- [ ] State persists across selection changes

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Large files crash browser | Enforce size limits, show warnings |
| Video autoplay blocked | Fallback to muted, show play button |
| CORS issues with remote media | Proxy through server or show error |
| Memory leaks from blob URLs | Reference counting + history integration |
| Filter performance issues | Debounce filter updates, limit real-time preview resolution |
| Blob URLs invalid after reload | Convert to data URLs in project save |
| Undo breaks with media | Keep blobs alive while in history stack |

---

## Comprehensive Validation Plan

### Checkpoint 1: After Phase 1 (Infrastructure)

**Duration**: 30 minutes  
**When**: After 1.5 is complete

| Test | Command/Action | Expected | Actual |
|------|----------------|----------|--------|
| MediaAssetManager imports | `import { mediaAssetManager } from '...'` | No errors | ☐ |
| Import JPEG | `await mediaAssetManager.importFile(jpegFile)` | Returns assetId starting with `img_` | ☐ |
| Import PNG | Same as above | Returns assetId | ☐ |
| Import MP4 | Same with video file | Returns assetId starting with `vid_` | ☐ |
| Deduplication | Import same file twice | Same assetId both times | ☐ |
| getBlobUrl | `mediaAssetManager.getBlobUrl(assetId)` | Returns valid `blob:` URL | ☐ |
| FilterEngine | `FilterEngine.buildCssFilter({exposure:20, blur:5})` | Returns `brightness(1.2) blur(5px)` | ☐ |

**Pass Criteria**: 7/7 tests pass  
**Fail Action**: Debug before proceeding to Phase 2

---

### Checkpoint 2: After Phase 2 (Rendering)

**Duration**: 1 hour  
**When**: After 2.4 is complete

| Test | Action | Expected | Actual |
|------|--------|----------|--------|
| Image displays in shape | Add image fill via console | Image visible inside shape | ☐ |
| Scale mode: fill | Change scaleMode to 'fill' | Image covers shape, may crop | ☐ |
| Scale mode: fit | Change to 'fit' | Image fits inside, may letterbox | ☐ |
| Scale mode: stretch | Change to 'stretch' | Image distorts to fill | ☐ |
| Scale mode: tile | Change to 'tile' | Image repeats | ☐ |
| Filters work | Apply exposure: 50 | Image is brighter | ☐ |
| Blur works | Apply blur: 10 | Image is blurred | ☐ |
| Existing fills unbroken | Create solid fill | Solid fill still works | ☐ |
| Code fill unbroken | Create code fill | Code fill still works | ☐ |
| Multi-fill stacking | Add solid + image + gradient | All layers visible with correct z-order | ☐ |

**Pass Criteria**: 10/10 tests pass  
**Fail Action**: Fix rendering before proceeding to UI

---

### Checkpoint 3: After Phase 3 (UI)

**Duration**: 1 hour  
**When**: After Phase 3 complete

| Test | Action | Expected | Actual |
|------|--------|----------|--------|
| Image tab opens | Click Image fill type button | Image tab visible | ☐ |
| Drag-drop import | Drop image onto drop zone | Image imports, shows preview | ☐ |
| Browse button | Click browse, select file | Image imports | ☐ |
| Scale mode buttons | Click each mode button | Mode changes, preview updates | ☐ |
| Position sliders | Adjust X/Y | Image position changes | ☐ |
| Filter sliders | Adjust exposure | Image filters update | ☐ |
| Video tab opens | Click Video fill type | Video tab visible | ☐ |
| Video plays | Import video | Video plays in preview | ☐ |
| Play/pause works | Click play/pause | Video toggles playback | ☐ |
| Volume slider | Adjust volume | Video volume changes | ☐ |

**Pass Criteria**: 10/10 tests pass  
**Fail Action**: Fix UI before proceeding

---

### Checkpoint 4: After Phase 4 (Canvas Interactions)

**Duration**: 45 minutes  
**When**: After Phase 4 complete

| Test | Action | Expected | Actual |
|------|--------|----------|--------|
| Drop on canvas | Drop image on empty canvas | Creates new shape with image fill | ☐ |
| Drop on shape | Drop image on existing shape | Adds image fill layer | ☐ |
| Paste image | Cmd+V with image in clipboard | Creates shape or adds fill | ☐ |
| Space+drag | Hold Space, drag inside shape | Pans image position | ☐ |
| Alt+scroll | Hold Alt, scroll wheel | Scales image | ☐ |

**Pass Criteria**: 5/5 tests pass

---

### Checkpoint 5: After Phase 6 (Store/Persistence)

**Duration**: 1 hour  
**When**: After Phase 6 complete

| Test | Action | Expected | Actual |
|------|--------|----------|--------|
| Undo add image | Add image fill, Cmd+Z | Image removed, shape returns to previous | ☐ |
| Redo add image | Cmd+Shift+Z | Image returns | ☐ |
| Undo delete shape | Delete shape with image, Cmd+Z | Shape and image return | ☐ |
| Multiple undos | Add 3 images, undo 3 times | All 3 removed correctly | ☐ |
| Copy shape with image | Cmd+C shape with image fill | Copies to clipboard | ☐ |
| Paste shape with image | Cmd+V | New shape has working image | ☐ |
| Paste in new tab | Copy, open new tab, paste | Image displays (data URL fallback) | ☐ |

**Pass Criteria**: 7/7 tests pass  
**Critical**: If undo/redo fails, blob lifecycle is broken. Debug thoroughly.

---

### Checkpoint 6: Memory & Performance

**Duration**: 1.5 hours  
**When**: After Phase 9-10 complete

| Test | Action | Expected | Actual |
|------|--------|----------|--------|
| Memory baseline | Open DevTools Memory | Record initial heap size | ☐ |
| Add/remove cycle | Add 10 images, delete all | Heap size returns to near baseline | ☐ |
| Blob cleanup | Check `mediaAssetManager.getBlobStats()` | 0 orphaned blobs | ☐ |
| Video limit | Add 6 videos to slide | Only 5 play, 1 paused | ☐ |
| Off-screen pause | Scroll video off screen | Video pauses within 1 second | ☐ |
| 10 images on slide | Add 10 large images | No visible lag when navigating | ☐ |
| Filter adjustment | Rapidly adjust exposure slider | Smooth, no frame drops | ☐ |

**Pass Criteria**: 7/7 tests pass  
**Fail Action**: Profile and optimize before release

---

### Checkpoint 7: Edge Cases & Error Handling

**Duration**: 1 hour  
**When**: Final testing

| Test | Action | Expected | Actual |
|------|--------|----------|--------|
| Unsupported format | Drop .tiff file | Shows error message, no crash | ☐ |
| Corrupt image | Import corrupt JPEG | Shows error state | ☐ |
| 100MB file | Import huge file | Shows size warning | ☐ |
| CORS image | Use cross-origin URL | Shows CORS error or loads | ☐ |
| Browser refresh | Refresh with images on canvas | Images lost gracefully (no crash) | ☐ |
| Slow network | Use network throttling | Loading state shows | ☐ |

**Pass Criteria**: 6/6 graceful failures

---

## Implementation Order Summary

| Phase | Duration | Dependencies | Validation Checkpoint |
|-------|----------|--------------|----------------------|
| 1. Core Infrastructure | 6-8h | None | Checkpoint 1 |
| 2. Renderer Integration | 6-8h | Phase 1 | Checkpoint 2 |
| 3. Fill Flyout UI | 8-10h | Phase 1, 2 | Checkpoint 3 |
| 4. Canvas Interactions | 4-6h | Phase 1, 2, 3 | Checkpoint 4 |
| 5. Reset & Advanced | 3-4h | Phase 2, 3 | - |
| 6. Store & Persistence | 2-3h | Phase 1-5 | Checkpoint 5 |
| 7. Presentation Mode | 2-3h | Phase 2, 6 | - |
| 8. Testing & Polish | 3-4h | All phases | Checkpoints 6, 7 |
| 9. Blob Lifecycle | 4-5h | Phase 1, 6 | Part of Checkpoint 6 |
| 10. Video Lifecycle | 3-4h | Phase 2, 9 | Part of Checkpoint 6 |
| 11. Animated Images | 2-3h | Phase 1, 2 | - |

**Total: 44-54 hours**

---

## Go/No-Go Decision Points

### After Phase 2: Can We Ship Image-Only?

| Criterion | Required | Nice-to-Have |
|-----------|----------|--------------|
| Images display in shapes | ✅ | |
| All 4 scale modes work | ✅ | |
| Basic filters work | ✅ | |
| UI to add image fills | ✅ | |
| Undo/redo works | | ✅ |
| Save/load persists | | ✅ |

**Decision**: If core rendering works, can ship limited beta.

### After Phase 6: Can We Ship Full Feature?

| Criterion | Required | Nice-to-Have |
|-----------|----------|--------------|
| All Phase 2 criteria | ✅ | |
| Undo/redo fully works | ✅ | |
| Copy/paste works | ✅ | |
| No memory leaks | ✅ | |
| Videos play | ✅ | |
| Auto-save to IndexedDB | | ✅ |

**Decision**: If undo/redo and memory are stable, can ship v1.

---

## Known Limitations (Acceptable for v1)

1. **Large files session-only**: Files > 5MB use blob URLs, lost on refresh until .str save implemented
2. **No cloud save**: Requires file-format implementation (separate project)
3. **Limited video trim UI**: No visual timeline scrubber, just number inputs
4. **No animated GIF pause**: GIFs always animate (add in Phase 11)
5. **No HEIC support**: Requires transcoding, out of scope

---

## Success Criteria

1. **Functional**
   - [ ] Images load and display in all scale modes
   - [ ] Videos play with all controls working
   - [ ] Filters apply without visual artifacts
   - [ ] Drag/drop and paste work smoothly
   - [ ] Reset to original works correctly
   - [ ] Undo/redo works with media fills
   - [ ] Copy/paste works across tabs

2. **Performance**
   - [ ] 10+ media fills on single slide without lag
   - [ ] No memory leaks after 10 add/remove cycles
   - [ ] Filter adjustments feel responsive (<100ms)
   - [ ] Max 5 concurrent videos enforced
   - [ ] Off-screen videos don't consume resources

3. **UX**
   - [ ] Flyout UI is intuitive and matches existing patterns
   - [ ] Error states are clear and actionable
   - [ ] Keyboard shortcuts are discoverable
   - [ ] Animated GIFs can be controlled

---

## File Creation Checklist

### New Files
- [ ] `src/core/constants/MediaDefaults.js`
- [ ] `src/core/media/MediaAssetManager.js` (central asset registry)
- [ ] `src/core/media/ImageProcessor.js`
- [ ] `src/core/media/VideoProcessor.js`
- [ ] `src/core/media/FilterEngine.js`
- [ ] `src/core/media/VideoLifecycleManager.js`
- [ ] `src/ui/components/FillFlyout/ImageTab.js`
- [ ] `src/ui/components/FillFlyout/VideoTab.js`
- [ ] `src/ui/components/FillFlyout/MediaPreview.js`
- [ ] `src/ui/components/FillFlyout/ScaleModeSelector.js`
- [ ] `src/ui/components/FillFlyout/PositionControl.js`
- [ ] `src/ui/components/FillFlyout/FilterControls.js`
- [ ] `src/ui/components/FillFlyout/VideoControls.js`
- [ ] `src/ui/overlays/VideoControlOverlay.js`
- [ ] `src/styles/modules/_media-fills.scss`

### Modified Files
- [ ] `src/core/renderer/elements/ShapeElement.js`
- [ ] `src/core/HistoryManager.js`
- [ ] `src/ui/components/FillFlyout/FillFlyout.js`
- [ ] `src/ui/properties/FillSection.js`
- [ ] `src/core/Store.js`
- [ ] `src/core/CanvasManager.js`
- [ ] `src/core/PresentationManager.js`
- [ ] `src/styles/main.scss` (import new module)
