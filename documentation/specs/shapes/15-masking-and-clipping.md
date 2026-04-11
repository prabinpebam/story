# Masking & Clipping (Unified: Shapes/Text/Image/Video)

**Status**: Draft

Defines a **single masking model** that works consistently across:
- shapes (including multi-fill, code fill)
- image/video elements
- text

Hard requirement: Story must not have separate masking semantics per element type.

---

## 1. Current implementation constraints (must remain compatible)

- Story content is rendered via DOM elements; editing overlays are drawn on a Canvas overlay.
- Shapes currently render fills as stacked DOM layers and strokes as SVG layers; fills can be image/video/code.
- `.str` persistence is JSON-only and uses a “copy all properties” save/load strategy; masking fields must round-trip without losing unknown fields.

See also: `documentation/specs/shapes/15-current-implementation-alignment.md`.

---

## 2. Unified mask data model

We standardize on a **mask node** in the element tree.

### 2.1 Mask node
- `type: 'shape'`
- `shapeKind: 'mask'`
- `maskShapeId: elementId`
- `contentIds: elementId[]`
- `mode: 'clip' | 'alpha'` (default: `clip`)
- `invert?: boolean` (default: false)

Notes:
- `contentIds` may refer to **any element type** (shape, image, video, text, group).
- The mask’s visual output is defined by `mode`:
  - `clip`: binary containment (vector clip)
  - `alpha`: grayscale/alpha masking (when supported)

### 2.2 Mask shape requirements

The mask shape (`maskShapeId`) must be resolvable into a vector outline for `clip`.

Minimum v1 requirement:
- mask shape supports shapes (`type:'shape'`) and SVG (`type:'svg'`).

Out of scope for v1:
- allow text-as-mask (text outline → path)
- allow image/video-as-mask (alpha mask)

---

## 3. Evaluation order and nesting

### 3.1 Local stacking order
- A mask node conceptually defines a scope: `maskShapeId` + `contentIds`.
- The renderer must treat the mask as a non-destructive grouping construct; content remains editable as independent elements.

### 3.2 Nesting
- Nested masks are permitted.
- Nesting semantics must be deterministic and stable under reorder:
  - A mask applies to its `contentIds` only.
  - A content element that is itself a mask node composes (mask-of-mask) by applying inner mask first, then outer mask.

### 3.3 Transform propagation
- Masking must respect transforms consistently:
  - mask shape geometry is evaluated in its own local space and transformed into the content’s world space for application.
  - if content is a group (`parentId` chain), the effective world transform must include parent transforms.

---

## 4. Rendering strategy (aligned to current renderer)

### 4.1 DOM-first rendering
Masking must work with Story’s current DOM rendering stack:
- shapes with multi-fill layers
- shapes with media fills (image/video)
- shapes with code fill (canvas)
- text elements

Therefore, masking MUST be representable as DOM-applied clipping/masking (e.g. via SVG `<clipPath>`/`<mask>` defs referenced by DOM/SVG layers), not as a renderer-specific side system.

Mask application scope (important):
- A mask applies to the **entire rendered output** of each content element:
  - fills (including multi-fill, media fills, and code fills)
  - strokes (all stroke layers)
  - effects applied to that element
  - child elements if the content element is a group

Figma-class learnings (pitfalls to avoid):
- Avoid per-element masking semantics (text vs image vs shape). This becomes unmaintainable and breaks user expectations.
- Be explicit about platform constraints:
  - DOM/CSS/SVG masking has browser differences; we must define which subset is guaranteed in v1.
  - Masking must apply to multi-layer fills and embedded canvases (code fills) without special-case rendering paths.
- Nesting must be deterministic (define evaluation order and tie-breakers) so undo/redo and export remain stable.

### 4.2 Clip vs alpha
- `clip` uses vector outlines (preferred baseline for determinism and export).
- `alpha` is allowed when required for fidelity, but must have an explicit fallback story for environments where DOM alpha masking is limited.

DOM/SVG implementation guidance (v1):
- For `clip`:
  - generate `<clipPath>` in a shared `<svg><defs>` scope (per slide/container) with stable IDs.
  - apply `clip-path: url(#id)` (or SVG attribute equivalent) to each visual layer.
- For `alpha`:
  - generate `<mask>` defs with explicit units and dimensions.
  - if alpha masking proves unreliable for a target browser, fallback must be deterministic:
    - prefer falling back to `clip` when the mask source is vector, OR
    - rasterize the masked result at a chosen resolution for export-only (not for in-editor rendering).

### 4.3 Presentation mode parity
- Presentation mode uses a different viewport mapping and suppresses editing overlays.
- Masking must render identically in `edit`, `master`, and `presentation` modes.

Quality critique (gaps + risks)
- The hardest real-world failures are “mask doesn’t apply to code/video fills” and “mask applies to fills but not strokes”. The scope rule above must be treated as a testable contract.
- Browser differences in CSS/SVG masking can create subtle regressions; v1 must constrain the guaranteed subset and define deterministic fallbacks.

---

## 5. UX flows

- “Use as mask”: create a mask node containing the selected mask shape and content.
- Enter/exit mask edit:
  - edit mask shape geometry without breaking the mask relationship
  - edit content while still previewing the mask
- Visual boundary indication:
  - highlight mask boundary
  - clearly indicate current edit context (mask vs content)

---

## 6. Serialization requirements

- Mask nodes MUST be plain JSON and round-trip through `.str`.
- No derived mask artifacts (clipPath markup, cached paths) are serialized.
- Legacy fields on elements referenced by masks MUST not be deleted during migration/normalization.

---

## 7. Tests / acceptance

- Masking works the same for shapes, image/video elements, and text.
- Mask edits update content live.
- Masking clips code fills and media fills correctly.
- Nested masks behave predictably (deterministic evaluation).
