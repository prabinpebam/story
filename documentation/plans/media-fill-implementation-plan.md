# Media Fill System - Implementation Plan

## Overview

This plan details the phased implementation of the media fill system, which treats images and videos as fill layers on shapes rather than separate element types.

**Estimated Total Time**: 32-40 hours

---

## Phase 1: Core Infrastructure (6-8 hours)

### 1.1 Data Structures & Constants

**File**: `src/core/constants/MediaDefaults.js`

```javascript
// Default values for image and video fills
export const DEFAULT_IMAGE_FILL = { ... };
export const DEFAULT_VIDEO_FILL = { ... };
export const SUPPORTED_IMAGE_FORMATS = [...];
export const SUPPORTED_VIDEO_FORMATS = [...];
export const FILE_SIZE_LIMITS = { ... };
```

**Tasks**:
- [ ] Create MediaDefaults.js with all default values
- [ ] Add to existing BlendModes.js if needed
- [ ] Add format validation constants

**Validation**:
- [ ] Constants importable without errors
- [ ] Default values match spec

---

### 1.2 MediaManager Singleton

**File**: `src/core/media/MediaManager.js`

**Tasks**:
- [ ] Create MediaManager class
- [ ] Implement `importFile(file)` method
- [ ] Implement `importUrl(url)` method
- [ ] Implement `importFromClipboard(clipboardData)` method
- [ ] Implement `createMediaUrl(file, threshold)` - data URL vs blob URL
- [ ] Implement `releaseMediaUrl(url)` - blob cleanup
- [ ] Implement LRU cache for decoded media
- [ ] Export singleton instance

**Validation**:
- [ ] Import JPEG, PNG, WebP, GIF, SVG successfully
- [ ] Import MP4, WebM successfully
- [ ] Small files return data URLs
- [ ] Large files return blob URLs
- [ ] Blob URLs are properly revoked on release

---

### 1.3 ImageProcessor

**File**: `src/core/media/ImageProcessor.js`

**Tasks**:
- [ ] Create ImageProcessor class
- [ ] Implement `process(file)` - returns ImageFill object
- [ ] Implement `getDimensions(src)` - extract width/height
- [ ] Implement `resize(src, maxWidth, maxHeight)` - optimization
- [ ] Implement `loadImage(src)` - cached loading

**Validation**:
- [ ] Returns complete ImageFill object with all fields
- [ ] Dimensions extracted correctly for various formats
- [ ] Resize produces valid WebP output
- [ ] Cache hit/miss works correctly

---

### 1.4 VideoProcessor

**File**: `src/core/media/VideoProcessor.js`

**Tasks**:
- [ ] Create VideoProcessor class
- [ ] Implement `process(file)` - returns VideoFill object
- [ ] Implement `getMetadata(src)` - duration, dimensions
- [ ] Implement `extractPosterFrame(src, time)` - frame capture
- [ ] Implement time formatting utilities

**Validation**:
- [ ] Returns complete VideoFill object
- [ ] Duration and dimensions correct
- [ ] Poster frame extraction works
- [ ] Time formatting correct (00:05.2)

---

### 1.5 FilterEngine

**File**: `src/core/media/FilterEngine.js`

**Tasks**:
- [ ] Create FilterEngine static class
- [ ] Implement `buildCssFilter(filters)` - CSS filter string
- [ ] Implement `buildTemperatureTintFilter(filters, id)` - SVG filter
- [ ] Implement `buildHighlightsShadowsFilter(filters, id)` - SVG filter

**Validation**:
- [ ] CSS filters render correctly in browser
- [ ] SVG filters generate valid SVG
- [ ] All filter ranges produce expected visual results

---

## Phase 2: Renderer Integration (6-8 hours)

### 2.1 ShapeElement Media Rendering

**File**: `src/core/renderer/elements/ShapeElement.js` (MODIFY)

**Tasks**:
- [ ] Import FilterEngine
- [ ] Add `applyImageFill(layer, fill, el)` method
- [ ] Add `applyVideoFill(layer, fill, el)` method
- [ ] Add `applyMediaScaleMode(mediaEl, fill, el)` helper
- [ ] Add `applyMediaPosition(mediaEl, fill)` helper
- [ ] Add `applyMediaTransform(mediaEl, fill)` helper
- [ ] Add `applyAdvancedFilters(layer, fill, elementId)` helper
- [ ] Update `applyFills()` to route image/video types

**Validation**:
- [ ] Image fills render with correct scale mode
- [ ] Video fills render and play
- [ ] All scale modes work correctly (fill, fit, stretch, tile)
- [ ] Position offset works
- [ ] Scale and rotation transforms work
- [ ] CSS filters apply correctly
- [ ] SVG filters for temperature/tint work

---

### 2.2 Video Lifecycle Management

**Tasks**:
- [ ] Videos autoplay when visible
- [ ] Videos pause when off-screen (IntersectionObserver)
- [ ] Videos respect loop/muted/volume settings
- [ ] Trim points (startTime/endTime) work
- [ ] Videos cleanup on element removal

**Validation**:
- [ ] Scroll video into view → plays
- [ ] Scroll video out of view → pauses
- [ ] Loop resets to startTime correctly
- [ ] No memory leaks on repeated add/remove

---

### 2.3 Media Fill CSS

**File**: `src/styles/modules/_media-fills.scss` (NEW)

**Tasks**:
- [ ] Style `.fill-layer` for media containment
- [ ] Style `.media-fill` (img/video elements)
- [ ] Style tile mode with background-repeat
- [ ] Style error states
- [ ] Ensure no pointer events on media

**Validation**:
- [ ] Media doesn't capture mouse events
- [ ] Tile mode repeats correctly
- [ ] Error placeholder displays properly

---

## Phase 3: Fill Flyout UI (8-10 hours)

### 3.1 FillFlyout Type Buttons

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
- [ ] `src/core/media/MediaManager.js`
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
