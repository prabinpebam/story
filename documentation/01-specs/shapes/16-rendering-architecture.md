# Rendering Architecture (Shapes)

**Status**: Draft

Defines how resolved geometry becomes pixels in Story, without coupling model geometry to render artifacts.

---

## 1. Current rendering baselines (must stay working)
- Shapes: DOM-based rendering via `ShapeElement` (multi-fill layers including image/video/code, multi-stroke, effects).
- SVG elements: `SvgElement` hosts SVG markup.
- Canvas overlay: gizmos/guides drawn via Canvas 2D.

Mode constraints (must match current behavior):
- `edit` / `master`: viewport uses pan+zoom.
- `presentation`: viewport uses `PresentationManager` scale/offset, and editing overlays are suppressed.
- Rendering output (pixels) must be mode-invariant; only interaction affordances change.

## 2. Rendering pipeline (conceptual)
- Scene traversal → resolve geometry → apply paint → draw order.

Figma-class learning to incorporate:
- Do not couple geometry model to a specific renderer backend (DOM vs Canvas vs WebGL). Backend changes must not force document migrations.
- Prefer “resolve geometry once” + render adapters, not “renderer is the geometry engine”.

## 3. SVG-first contract
- For vector geometry, we must be able to produce an SVG path representation for export and (optionally) DOM rendering.

DOM-first requirement (v1):
- The primary renderer remains DOM-based. New geometry must be representable as DOM/SVG primitives without requiring a GPU backend.
- For `shapeKind:'vector'`, DOM rendering should prefer a single SVG subtree per element (when feasible) so fill-rule, masking, and strokes behave consistently.

## 4. Tessellation + AA (required)
Story must implement a deterministic tessellation pipeline that produces fill/stroke triangle meshes and defines anti-aliasing behavior.

Canonical spec (required):
- [16a-tessellation-and-aa.md](./16a-tessellation-and-aa.md)

Key rule:
- Tessellation output is derived and never serialized; it must be cacheable and invalidatable.

## 5. Anti-aliasing
- DOM/SVG native AA is the baseline.
- For any triangle renderer, analytic edge AA is the default (see [16a-tessellation-and-aa.md](./16a-tessellation-and-aa.md)).

## 6. Integration points
- `src/core/renderer/elements/ShapeElement.js`
- `src/core/renderer/elements/SvgElement.js`
- `src/core/canvas/GizmoRenderer.js`

Related constraints:
- Code fills use `CodeRunner` and require correct element world bounds (including parent transforms) for interaction.

Mask/boolean integration requirements:
- Masks must be representable via SVG `<defs>` referenced by fill layers and stroke layers.
- Booleans render as a derived path (preview/final) rendered like a vector shape.
  - Operand nodes remain editable via drill-in UI, but the boolean node’s on-canvas rendering is the derived result.
  - Rendering must not depend on a special “boolean group” DOM strategy.

Quality critique (gaps + risks):
- Without an explicit DOM strategy for vector shapes (single SVG subtree vs mixed div+svg layers), we risk inconsistent fill-rule/mask behavior across browsers.
- Code fills are a common integration trap: clipping/masking must apply to the `<canvas>` output without a special-case rendering path.

## 7. Tests / acceptance
- No regression in existing fill/stroke/effects rendering.
- SVG export is stable and visually equivalent within tolerance.
