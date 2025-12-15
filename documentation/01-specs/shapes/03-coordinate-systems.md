# Coordinate Systems (Shapes)

**Status**: Draft

This spec defines coordinate spaces and conversion rules used by the Shapes engine and editor.

Existing baseline: `documentation/01-specs/canvas/canvas-interaction.md` (screen↔canvas math).

Compatibility note:
- Story has multiple editor modes (`edit`, `master`, `presentation`). Shapes coordinate rules MUST match how the app currently computes world coordinates and chooses the active container.

---

## 1. Spaces
- **Element local space**: shape geometry lives here (paths/points/params).
- **Parent space**: coordinates relative to group/parent element.
- **Container (world) space**: absolute coordinates in the currently active container coordinate system.
	- In normal edit mode this is the active slide.
	- In master view this is the active master/layout container.
	- In presentation view this is still the active slide, but mapped to fullscreen via presentation scale/offset.
- **Viewport/screen space**: CSS pixels in the viewport / browser window.

## 2. Canonical storage rule
- Vector points are stored in **element-local space**.
- Handle vectors are **relative** (dx,dy) to anchor point.

Element placement fields (`x`, `y`, `width`, `height`, `rotation`) are interpreted in **container space** and must remain consistent across all modes.

## 3. Conversion contracts

### 3.1 Active container selection (mode-aware)
The current implementation resolves the “active container” as:
- `state.editor.mode === 'master'` → `state.slideMasterPresets[state.editor.activeMasterId]`
- otherwise → `state.slides[state.editor.activeSlideId]`

Shapes logic MUST always compute coordinates relative to the active container returned by:
- `CanvasManager.getActiveContainer(state)` (runtime)
- `store.getActiveContainer()` (state helper)

### 3.2 Screen ↔ container(world) mapping

**Edit mode** and **Master view** (current behavior):
- The editor applies a viewport transform to the content/background layers:
	- `translate(pan.x, pan.y) scale(zoom)` (transform origin 0,0)
- Therefore conversions are:
	- Screen → Container: `(screenX - pan.x) / zoom`, `(screenY - pan.y) / zoom`
	- Container → Screen: `(containerX * zoom) + pan.x`, `(containerY * zoom) + pan.y`

**Presentation view** (current behavior):
- `ViewportController` and `CanvasManager` stop applying pan/zoom transforms.
- `PresentationManager` scales the entire `#viewport` to fit fullscreen and centers it.
- Cached presentation mapping is:
	- Screen → Container: `(screenX - presentationOffsetX) / presentationScale`, `(screenY - presentationOffsetY) / presentationScale`
	- Container → Screen: `(containerX * presentationScale) + presentationOffsetX`, `(containerY * presentationScale) + presentationOffsetY`

Important implication:
- Any shapes feature that needs pointer → world coords MUST branch on mode and use the same mapping as the app.
	- In `edit`/`master`: use `state.editor.pan` + `state.editor.zoom`.
	- In `presentation`: use `PresentationManager`’s scale/offset (or an equivalent shared utility if introduced).

### 3.3 Container(world) ↔ element local mapping
- Container → element local uses the inverse of the element transform chain (including group/parent offsets).
- Element local → container uses the forward transform chain.

This must align with `GeometryUtils.getAbsoluteElement(...)` and the current group-relative coordinate rules.

## 4. DPI / devicePixelRatio
- Gizmos/hit targets must be sized in **screen pixels** and scale with zoom.
- Canvas overlay should account for DPR when drawing crisp lines.

Current implementation note:
- The interaction canvas is sized to the container’s CSS pixel dimensions. DPR-aware rendering may be added later, but coordinate math must remain correct in CSS pixels.

## 5. Integration points (current code)
- `src/core/canvas/ViewportController.js`
- `src/core/PresentationManager.js` (presentation scale/offset + pointer→world mapping)
- `src/core/CanvasManager.js` (`getActiveContainer`, mode gates)
- `src/core/canvas/HitTesting.js`
- `src/core/canvas/GeometryUtils.js`

## 6. Tests / acceptance
- Same cursor location selects same object across zoom levels.
- Hit target sizes feel consistent across zoom + DPR.

Additional mode acceptance:
- In master view, pointer interactions use the same pan/zoom mapping as edit mode.
- In presentation view, pointer/world mapping uses presentation scale/offset (no dependence on `editor.pan`/`editor.zoom`).
- Switching modes does not change stored element geometry (only the view transform changes).

## 7. Quality critique (gaps + risks)
- The most common bug class is mixing screen-space tolerances with world-space geometry without applying the correct mode mapping.
- DPR handling must not leak into geometry math; keep geometry in CSS pixel space and apply DPR only at canvas draw time.
- Group/parent transform chains must be handled consistently across hit testing, code fill bounds, and export; any divergence causes “works in edit, breaks in master/presentation”.
