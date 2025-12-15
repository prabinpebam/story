# Style & Paint Integration (Shapes)

**Status**: Draft

This spec describes how shapes geometry integrates with the existing Fill/Stroke/Effects systems.

Hard rule: do not duplicate paint systems; reuse what exists.

---

## 1. Current reality (must remain compatible)
- Shapes are rendered via DOM layers (`ShapeElement`) using the existing `style` model.
- **Multi-fill** is implemented as `style.fills[]` rendered as stacked `.fill-layer` DOM nodes.
  - Per fill layer, current renderer behavior includes: `visible`, `opacity`, `blendMode`.
  - Supported fill types in current renderer include:
    - `solid` (including theme-linked fills via `themeSlot` → CSS vars)
    - `gradient`
    - `image` (via `assetId`; deterministic missing-asset fallback when missing)
    - `video` (via `assetId`; deterministic missing-asset fallback when missing)
    - `code` (embedded `<canvas>` via `CodeRunner`)
- **Single “code fill” shortcut** exists: `style.fillType === 'code'` uses a dedicated code-canvas path for legacy/compat.
- **Multi-stroke** is implemented as `style.strokes[]` rendered as stacked SVG `.stroke-layer` elements.
  - Current stroke behavior includes: `visible`, `opacity`, `blendMode`, `width`, `position` (`inside|center|outside`), dash styles (`style`/`dashArray`), `dashCap`, `join`, `miterLimit`, and theme-linked stroke colors (`themeSlot`).
- Effects are applied via the existing effects pipeline; media layers may use `FilterEngine`-driven SVG filter defs.

Hard constraint:
- Shapes geometry MUST plug into this paint model; the Shapes system MUST NOT introduce a second fill/stroke/effects representation.

## 2. Geometry vs paint responsibilities
- Geometry engine produces paths/bounds.
- Renderer applies fills/strokes/effects via existing mechanisms.

Geometry-affecting vs non-geometry-affecting style changes:
- Geometry-affecting (may impact hit testing/booleans/export): stroke width/position when stroke expansion is used, fill rule, dash styles when using stroke hit-testing.
- Non-geometry-affecting (do not change geometry caches): solid color changes, opacity/blendMode changes, most effects.

## 3. Strokes and geometry
- Define when we need stroke expansion (booleans/export/hit testing).
- Rendering can remain “visual stroke” first if DOM supports it.

## 4. SVG-first constraints
- Define mapping for:
  - gradients
  - image fills
  - blend modes
  - effects (filters or raster fallback)

Figma-class learning to incorporate:
- Treat SVG mapping as a contract: if a paint feature can’t be represented as SVG, the spec must explicitly state the fallback (bake geometry vs rasterize) and the expected fidelity.

Fallback policy (interop):
- `code` fills: rasterize to image for export; in-editor remains live canvas.
- `video` fills: export as raster snapshot (default) or a deterministic fallback visual with metadata.
- Effects that can’t map to SVG filters: rasterize affected element for export (explicitly best-effort).

Import mapping requirement:
- Figma clipboard paste MUST map imported paints/effects into the existing `style` model (fills/strokes/effects) per [19a-figma-clipboard-import.md](./19a-figma-clipboard-import.md).
- Minimum required effect mapping for Figma paste:
  - drop shadow
  - inner shadow
  - layer blur
- Unsupported effects MUST be dropped with a stable warning; geometry remains editable.

## 5. Inspector alignment
- Continue using `FillSection`, `StrokeSection`, `EffectsSection`.
- Any new geometry controls must not introduce new tokens/components.

Boolean/mask styling responsibilities:
- Boolean nodes (`shapeKind:'boolean'`) own the rendered output style. Operand styles are preserved but not used for the boolean output unless the user drills into operands.
- Mask nodes (`shapeKind:'mask'`) do not introduce a new paint surface; styling applies to the content elements and the mask shape as independent elements.

## 6. Tests / acceptance
- Theme-linked fill slots continue to auto-update.
- Multiple fills remain ordered and correct.

Quality critique (gaps + risks)
- Without an explicit rule for boolean styling, implementations drift between “use top operand style” vs “boolean owns style”, leading to UX confusion and broken exports.
- Export fallback must be deterministic (resolution choices, ordering) or tests will become flaky.
