# Snapping & Guides (Shapes delta)

**Status**: Draft

This spec defines snapping behavior specific to shapes/vector editing, building on the existing snapping system.

Existing baseline: `src/core/canvas/SnappingSystem.js` and `documentation/01-specs/canvas/canvas-interaction.md`.

---

## 1. Snap targets
- Slide edges/center
- Other element edges/centers
- Grid
- (Vector mode) anchor points, handles (optional), and segment midpoints

Vector-mode snap rules (required):
- Snap candidates are derived from authoritative geometry (points/segments), not from tessellation meshes.
- Segment midpoints are defined in curve-parameter space:
	- For line segments: midpoint of endpoints.
	- For cubic segments: the point at $t=0.5$ (de Casteljau), not the midpoint of a flattened polyline.
- Snap tolerance is screen-space and uses the shared snapping hysteresis strategy (sticky capture) so snap behavior does not change across zoom levels.

## 2. Feedback
- Guide lines
- Measurement overlays

## 3. Modifier semantics
- Temporarily disable snapping
- Angle constraints

Mode constraints:
- Snapping that mutates geometry is active only in `edit`/`master`.
- In `presentation`, snapping UI may show measurements but must not mutate document state.

## 4. Tests / acceptance
- Snapping works during move/resize and does not introduce jitter.

Determinism requirement:
- Shapes snapping MUST follow the canonical snapping rules defined in `documentation/01-specs/canvas/canvas-interaction.md`:
	- sticky capture + hysteresis
	- deterministic tie-break
	- stable `targetKey` strings for candidates

Figma-class learnings (anti-jitter):
- Snapping must use hysteresis:
	- once snapped to a target, maintain snap until the cursor exits a slightly larger threshold
- Avoid rapid target switching between nearby guides (stable tie-breaking).

## 5. Quality critique (gaps + risks)
- Without explicit tie-break rules, snapping will feel “random” in dense layouts; define deterministic ordering and stickiness.
- Vector-mode snapping (points/segments) must not require flattening at zoom-dependent thresholds that change snap behavior between zoom levels.
