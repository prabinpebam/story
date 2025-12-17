# Figma Clipboard Paste → Editable Story Elements

**Status**: Draft
**Last Updated**: December 17, 2025

This spec defines how Story MUST support pasting from Figma such that the result becomes **fully editable Story elements** (shapes, vector networks/paths, masks, groups, and text where representable).

This spec is intentionally **implementation-oriented**: it defines clipboard formats, extraction order, parsing, conversion, determinism, failure policy, and CI-verifiable fixtures.

---

## 0. Goals and non-goals

### 0.1 Goals (required)
- Pasting from Figma into Story produces **editable** Story content.
- Paste is **safe** (no script execution, no external loads) and **non-destructive**.
- Paste is **deterministic** given the same clipboard payload and insertion context.
- Paste is **atomic** (one undo step) and never leaves the document in a partially-imported state.

### 0.2 What “fully editable” means (required)
“Fully editable” means:
- Imported geometry is represented using Story’s canonical data model (see [02-data-model-and-serialization.md](./02-data-model-and-serialization.md)):
  - `type:'shape'` with `shapeKind` primitives and/or `shapeKind:'vector'` (vector paths / vector networks)
  - `shapeKind:'mask'` for clipping/alpha masks
  - `type:'group'` for hierarchy
  - `type:'text'` when text is representable in Story’s text model
- If an imported construct cannot be represented in Story without losing editability, Story MUST fall back to a representation that remains editable **as vector shapes** (usually: convert to paths).

Examples:
- Text-on-path or per-glyph transforms may become vector outlines (editable as vector, not as text).
- Unsupported effects may be dropped (geometry remains editable) with an import warning.

### 0.3 Non-goals
- Perfect fidelity for arbitrary SVG from unknown sources.
- Mirroring Figma’s full feature set (constraints/layout, prototyping links, components/variants, variables).
- Preserving Figma’s internal node IDs or private metadata.

---

## 1. Clipboard inputs and extraction

### 1.1 Supported clipboard sources
Story MUST support paste from:
- System clipboard (`Ctrl/Cmd+V`) when the editor is not in text-editing focus.
- Browser Clipboard API (`navigator.clipboard.read()` / `readText()`) when available.
- Event-based paste payload (`ClipboardEvent.clipboardData`) when available (fallback path).

Mode gating:
- In `presentation` mode, paste MUST not mutate state.
- In `edit`/`master`, paste is enabled.

### 1.2 Recognized MIME types (required)
Import pipeline MUST attempt these types (order matters):
1) `image/svg+xml` (preferred: vector)
2) `text/html` (common: Figma may place SVG/metadata here)
3) `text/plain` (fallback: may include raw `<svg>`)
4) raster `image/*` (fallback: creates an image element; still editable as a Story element)

### 1.3 Extraction algorithm (deterministic)
Given a paste action, the importer MUST:
- Enumerate available clipboard items/types.
- Select the **highest-priority supported type** from the list above.
- If multiple items of the same priority exist, select the first in stable iteration order.

For `text/html`:
- Extract the first `<svg>` element found in the HTML (DOM parse, not regex).
- If the SVG is embedded via `<img src="data:image/svg+xml,...">`, decode it.
- Ignore any `foreignObject` and disallowed content (security rules apply).

For `text/plain`:
- If it contains an `<svg` root, treat as SVG markup.

For raster `image/*`:
- Import as `type:'image'` element centered at insertion point.

### 1.4 Concrete extraction pseudocode (required)
Given a paste request, the importer MUST implement the following decision process:

1) If editor is in `presentation` mode: return `{status:'no-op', warnings:[]}`.
2) If focus is inside text editing: delegate to text editor (no shapes import).
3) Attempt to read system clipboard (preferred):
  - If `navigator.clipboard.read()` is available and succeeds:
    - For each clipboard item in iteration order:
      - If item contains `image/svg+xml`: select it.
      - Else if item contains `text/html`: select it.
      - Else if item contains `text/plain`: select it.
      - Else if item contains any `image/*`: select it.
  - Else fall back to `ClipboardEvent.clipboardData`:
    - Try `text/html`, then `text/plain`, then file/image payloads.
4) If selected payload is `text/html`:
  - Parse as HTML and extract first `<svg>` node; else attempt to decode first `<img src="data:image/svg+xml,...">`.
5) If selected payload is `text/plain`:
  - If it contains an `<svg` root, treat as SVG markup; otherwise no-op.
6) Continue with sanitization + conversion pipeline.

This algorithm MUST be deterministic for a given environment and payload.

---

## 2. Security, limits, and hardening

### 2.1 Sanitization (required)
Any imported SVG markup MUST be sanitized before parsing and before serialization into `.str`.

Sanitization requirements:
- Remove scripts, event handlers, and inline styles.
- Disallow external URLs (no network fetches).
- Enforce maximum payload size and node count.
- Clamp numeric attributes to finite ranges.

Sanitization is mandatory even for “trusted” sources.

### 2.2 Limits (required)
Importer MUST enforce guardrails to prevent paste from freezing the app.

Hard limits (v1, required):
- Maximum SVG input bytes: **500,000 bytes**.
- Maximum SVG DOM nodes: **5,000 nodes**.
- Maximum generated Story elements per paste: **2,000 elements**.

Limit policy:
- If the SVG payload exceeds size/node limits, importer MUST abort editable import and return a no-op with `WARN_IMPORT_TOO_LARGE`.
- If conversion would exceed element limit, importer MUST stop generating new elements, still commit what has been generated only if it can preserve internal consistency (e.g. no dangling mask references); otherwise it MUST abort and return `WARN_IMPORT_TOO_COMPLEX`.

Note: these limits are intentionally aligned with the current sanitizer defaults.

### 2.3 Numeric clamping (required)
Importer MUST validate and clamp numeric fields to avoid pathological rendering and broken geometry.

Clamps (v1, required):
- Any numeric parsed from SVG MUST be finite; otherwise treat as missing.
- Coordinates (including transform matrix components when baking): clamp to $[-10^6, +10^6]$.
- Width/height/radius/stroke widths: clamp to $[0, 10^5]$.
- Opacity values: clamp to $[0, 1]$.

If clamping occurs, importer MUST emit `WARN_NUMERIC_CLAMPED`.

---

## 3. Conversion pipeline (SVG/HTML → Story elements)

### 3.1 Pipeline stages
The paste import MUST be implemented as a pure(ish) pipeline:
1) Extract clipboard payload (Section 1)
2) Sanitize (Section 2)
3) Parse to SVG DOM
4) Convert to an **Import IR** (intermediate representation)
5) Convert IR to Story elements
6) Commit atomically (one undo step)

Stages (3–5) MUST be deterministic for the same payload.

### 3.2 Import IR (required)
The importer MUST use an intermediate representation to avoid coupling parsing details to Story’s element schema.

Minimum IR node types:
- `Group`
- `ShapePrimitive` (rect/ellipse/line)
- `Path` (vector)
- `Text`
- `Image`
- `MaskGroup` (mask + content)

Minimum IR properties:
- Local transform matrix (2D affine)
- Paint (fills, strokes)
- Effects (supported subset)
- Opacity + blend mode

IR schema (concrete, required):
- Each IR node MUST be JSON-serializable and use explicit field names.
- Minimum shape:
  - `kind: 'group'|'rect'|'ellipse'|'line'|'path'|'text'|'image'|'maskGroup'`
  - `transform: [a,b,c,d,e,f]` (SVG matrix form)
  - `opacity: number` (0..1)
  - `blendMode: string` (normalized)
  - `fills: Array<FillIR>`
  - `strokes: Array<StrokeIR>`
  - `effects: Array<EffectIR>`
  - `children?: IRNode[]`

FillIR (minimum):
- `type: 'solid'|'linearGradient'|'radialGradient'`
- `opacity?: number`
- If `solid`: `color: {r,g,b,a}` (0..1 floats)
- If gradient:
  - `stops: Array<{offset:number,color:{r,g,b,a}}>` (offset 0..1)
  - `transform?: [a,b,c,d,e,f]` (gradient space)

StrokeIR (minimum):
- `width:number`
- `color:{r,g,b,a}`
- `cap:'butt'|'round'|'square'`
- `join:'miter'|'round'|'bevel'`
- `miterLimit?:number`
- `dashArray?: number[]`
- `dashOffset?: number`

EffectIR (minimum):
- `type:'dropShadow'|'innerShadow'|'layerBlur'`
- `visible?: boolean`
- `params: object` (effect-specific)

### 3.3 Element identity and determinism
Importer MUST produce:
- Stable ordering of created elements.
- Deterministic geometry canonicalization (see [04-precision-and-numerics.md](./04-precision-and-numerics.md)).

ID generation policy:
- Runtime: IDs MUST be unique.
- Tests: importer MUST support a deterministic `idSeed` so fixtures can be byte-stable.

Deterministic ordering rules (required):
- SVG traversal order MUST be pre-order, left-to-right in document order.
- When converting `defs` references (gradients/masks), the resolved paint/mask MUST be inlined into the IR in a deterministic way.

Deterministic ID rules (required):
- In runtime, element IDs MAY use UUIDs.
- In tests, IDs MUST be generated by a seeded counter, e.g. `imp-${seed}-${n}`.

---

## 4. Geometry mapping rules

### 4.0 Supported SVG subset (concrete)
For Figma clipboard paste, Story MUST support this SVG subset as “editable import inputs”. Anything outside this MUST degrade per Section 8.

Tags (required support):
- `svg`, `g`, `path`, `rect`, `circle`, `ellipse`, `line`
- `defs`, `linearGradient`, `radialGradient`, `stop`
- `clipPath`, `mask`
- `text`, `tspan` (best-effort; see Section 6)

Attributes (required support):
- Geometry: `d`, `x`, `y`, `width`, `height`, `rx`, `ry`, `cx`, `cy`, `r`, `x1`, `y1`, `x2`, `y2`, `points`
- Paint: `fill`, `fill-opacity`, `stroke`, `stroke-width`, `stroke-opacity`, `stroke-linecap`, `stroke-linejoin`, `stroke-miterlimit`, `opacity`
- Transforms: `transform`
- Masks: `clip-path`, `mask`

Explicitly unsupported (must warn + degrade):
- `foreignObject` (drop) → `WARN_SVG_UNSUPPORTED_FEATURE`
- SVG filters (`filter`, `fe*`) (drop or degrade) → `WARN_EFFECT_DROPPED`
- External refs (`href`/`xlink:href` to remote URLs) (strip) → `WARN_EXTERNAL_REFERENCE_STRIPPED`

### 4.1 Transforms
Story elements use `x/y/width/height/rotation` plus element-local geometry.

Rules:
- Importer MUST correctly handle general SVG affine transforms (`translate/scale/rotate/skew/matrix`) deterministically.
- Importer MAY map simple transforms to Story transform fields (e.g. `x/y/rotation`) when it can do so without losing editability.
- Importer MAY instead **bake transforms into geometry** and import as `shapeKind:'vector'` (this is acceptable for v1 and is the preferred fallback for non-axis-aligned transforms).

Concrete transform detection:
- Decompose the 2×2 matrix part; if it contains shear above numeric epsilon or non-uniform rotation+scale that cannot be represented by Story’s rotation+axis-aligned bounds model, treat as “general affine” and bake.
- When baking, the resulting path MUST be canonicalized (see [04-precision-and-numerics.md](./04-precision-and-numerics.md)) and clamped (Section 2.3).

### 4.2 Rectangles
SVG `<rect>` imports as:
- `shapeKind:'rectangle'` when representable (including per-corner radii if supported by Story params).
- Otherwise, bake to path and import as `shapeKind:'vector'`.

Corner radii rules:
- If SVG provides `rx/ry`, importer MUST map to Story’s `cornerRadii` in a deterministic way.
- If per-corner radii are encoded via paths (common after export), importer will import as vector.

### 4.3 Ellipses/circles
- `<circle>`/`<ellipse>` imports as `shapeKind:'ellipse'` when representable.
- Otherwise bake to vector.

### 4.4 Paths
- `<path d>` imports as `shapeKind:'vector'`.
- Non-cubic segments (quadratic/arc) MUST be normalized to cubic per [02-data-model-and-serialization.md](./02-data-model-and-serialization.md).
- Fill rule MUST be mapped to `fillRule`.

### 4.5 Groups and hierarchy
- `<g>` MAY be imported as `type:'group'`, or MAY be flattened into leaf elements as long as paint/geometry results are deterministic.
- Group opacity/blend mode MUST be applied deterministically (either via group nodes or by pushing properties down during flattening).

### 4.6 Masks and clips
SVG clipping/masking MUST map into Story’s mask node model:
- Importer MUST create a `shapeKind:'mask'` relationship node that references:
  - `maskShapeId` (the imported mask shape element), and
  - `contentIds` (the element(s) being masked).
- Importer SHOULD set `mode:'clip'|'alpha'` when known, but `mode` is optional in v1.

Nested masks MUST be supported.

If the SVG mask semantics cannot be represented (units/coordinate spaces too complex), importer MUST:
- bake the masked output to paths where possible (still editable), OR
- degrade to raster image element (last resort) with warning.

---

## 5. Paint and effects mapping

### 5.1 Fill mapping
Importer MUST map fills into Story’s existing `style.fills[]` model (see [14-style-and-paint-integration.md](./14-style-and-paint-integration.md)).

Minimum required fill support for Figma paste:
- Solid color fills (including alpha)
- Linear gradients
- Radial gradients

Concrete mapping table (required):
- SVG `fill` + `fill-opacity` → `style.fills[].type:'solid'` with RGBA color.
- SVG `linearGradient`/`radialGradient` + `stop-color`/`stop-opacity` → `style.fills[].type:'gradient'` with deterministic stop ordering by `offset`.

Stop normalization rules (required):
- Offsets MUST be normalized to 0..1.
- If two stops share the same offset, preserve SVG order.
- If offsets are missing/invalid, assign evenly spaced offsets and emit `WARN_GRADIENT_NORMALIZED`.

If the clipboard SVG contains paints that Story cannot represent:
- Prefer baking paint into geometry (not usually possible for gradients), otherwise drop paint with warning.

### 5.2 Stroke mapping
Importer MUST map strokes into Story’s existing `style.strokes[]` model.

Minimum required stroke support:
- width
- join/cap
- dash arrays
- stroke alignment when representable

Concrete mapping table (required):
- SVG `stroke` + `stroke-opacity` → `style.strokes[].color` RGBA.
- SVG `stroke-width` → `style.strokes[].width`.
- SVG `stroke-linecap` → `style.strokes[].dashCap` or `cap` equivalent.
- SVG `stroke-linejoin` → `style.strokes[].join`.
- SVG `stroke-miterlimit` → `style.strokes[].miterLimit`.
- SVG `stroke-dasharray`/`stroke-dashoffset` (if present) → `style.strokes[].dashArray` and offset when supported.

Stroke alignment (required degrade):
- If the source implies inside/outside stroke and Story cannot represent it, importer MUST expand stroke to outline path and import as filled vector, emitting `WARN_STROKE_EXPANDED`.

If stroke alignment cannot be represented, importer MUST expand stroke to filled path and import as `shapeKind:'vector'` (editable).

### 5.3 Blend modes and opacity
- Element `opacity` MUST map to Story’s opacity.
- Supported blend modes MUST map to the closest existing Story blend modes.
- Unsupported blend modes MUST degrade to `normal` with warning.

### 5.4 Effects mapping (required subset)
Figma commonly uses:
- Drop shadow
- Inner shadow
- Layer blur

Importer MUST map these to Story’s existing effects system when available.

Fallback rules:
- If an effect cannot be represented, geometry remains editable and the effect is dropped with warning.
- Importer MUST NOT rasterize the entire element solely to preserve an effect unless the user is already falling back to raster for other reasons.

Concrete effect mapping (required):
- If an SVG represents a drop/inner shadow via a filter graph, importer MAY approximate it by mapping to Story shadow effects only when parameters can be recovered deterministically; otherwise emit `WARN_EFFECT_DROPPED`.
- For blur-like effects, importer MAY map to Story blur effect if available; otherwise drop with warning.

---

## 6. Text and fonts

### 6.1 Import as editable text when representable
Importer MUST attempt to import SVG text as `type:'text'` when:
- Text can be represented as a rectangular text box or point text in Story’s model.
- No per-glyph transforms are required.
- Writing direction is supported.

Mapping requirements:
- content
- font family
- font size
- font weight
- line height when available
- letter spacing when available
- alignment

Concrete representability rules (required):
Importer MUST import as `type:'text'` only if ALL are true:
- The SVG text has a single baseline direction (no vertical writing modes).
- No per-glyph transforms are needed (i.e. no per-character `x/y/dx/dy/rotate` sequences that produce non-uniform positioning).
- Text is not on a path.

If any are false, outline fallback MUST apply.

### 6.2 Outline fallback (required)
If text cannot be represented as Story text, importer MUST convert text to vector outlines and import as `shapeKind:'vector'`.

Determinism requirements:
- Outline conversion MUST be deterministic given the same font availability and the same inputs.
- If fonts are missing, importer MUST use a deterministic fallback font for outline conversion (or skip outline conversion and leave as text with fallback rendering) and MUST record an import warning.

Concrete policy (required):
- If outline conversion is available, it MUST be attempted for non-representable text.
- If outline conversion is not available in the runtime environment, importer MUST import the text as `type:'text'` (best-effort) and emit `WARN_TEXT_IMPORTED_WITH_LIMITS`.
- If fonts are missing and outline conversion would change glyph shapes unpredictably, importer MUST emit `WARN_FONT_FALLBACK`.

### 6.3 Font availability policy
- Imported text SHOULD preserve the requested font family name in the element’s style.
- If the font is not available, rendering MUST fall back deterministically.
- The document MUST remain stable across save/load.

---

## 7. Placement and selection behavior

### 7.1 Placement
Pasted content MUST be placed relative to the current viewport/selection:
- Default: center the pasted group at the viewport center.
- If a single element is selected and the paste is a paint-only payload (e.g. an image intended as fill), that behavior is defined by product rules outside this spec.

### 7.2 Selection
After paste:
- The top-level imported group (or all top-level elements if no group) MUST become the selection.

---

## 8. Failure policy and user-visible warnings

### 8.1 Total function requirement
Paste import MUST be a total function:
- Never throw uncaught exceptions.
- Never produce NaN/Infinity in stored geometry.
- Never partially commit.

### 8.2 Degrade ladder (required)
When fidelity cannot be preserved, importer MUST degrade in this order:
1) Editable primitives (`rectangle/ellipse/...`)
2) Editable vectors (`shapeKind:'vector'`)
3) Editable masks/groups (if representable)
4) Raster image element (last resort)

### 8.3 Warnings
Importer MUST produce a structured warning list per paste (stored in telemetry/logs and surfaced as non-blocking status per [34-feedback-and-status.md](./34-feedback-and-status.md)).

Warnings MUST be stable and testable.

#### 8.3a Warning codes (required, canonical list)
Importer MUST emit warning **codes** from this list (strings). New codes require a spec update.

Security/limits:
- `WARN_IMPORT_TOO_LARGE`
- `WARN_IMPORT_TOO_COMPLEX`
- `WARN_EXTERNAL_REFERENCE_STRIPPED`
- `WARN_SVG_SANITIZED`

Parsing/extraction:
- `WARN_NO_SVG_FOUND`
- `WARN_HTML_SVG_EXTRACTED`

Geometry:
- `WARN_NUMERIC_CLAMPED`
- `WARN_TRANSFORM_BAKED`
- `WARN_STROKE_EXPANDED`
- `WARN_PATH_NORMALIZED`
- `WARN_SVG_UNSUPPORTED_FEATURE`

Paint/effects:
- `WARN_GRADIENT_NORMALIZED`
- `WARN_BLENDMODE_DEGRADED`
- `WARN_EFFECT_DROPPED`

Text/fonts:
- `WARN_TEXT_OUTLINED`
- `WARN_TEXT_IMPORTED_WITH_LIMITS`
- `WARN_FONT_FALLBACK`

Raster fallback:
- `WARN_RASTER_FALLBACK`

---

## 9. Undo/redo and operation model
- Paste is a single atomic operation.
- Paste MUST bracket history as one undo step (see [11-undo-redo-and-operations.md](./11-undo-redo-and-operations.md)).
- Import must not create intermediate invalid states.

---

## 10. Tests and CI acceptance (required)

### 10.1 Fixture corpus
Repo MUST contain:
- `tests/corpus/shapes/figma-paste/`

Each fixture MUST include:
- clipboard payloads (at least `text/html` and/or `image/svg+xml` or `text/plain`)
- expected Story element output canonical hash
- expected warnings list

Concrete fixture schema (required):
- `id: string`
- `description: string`
- `clipboard: { imageSvgXml?: string, textHtml?: string, textPlain?: string }`
- `importOptions: { idSeed: string, placement?: 'viewportCenter' }`
- `expected: { elementsCanonicalHash: string, warnings: string[], elementCount: number, topLevelCount: number }`

Canonical hashing scope (required):
- Hash MUST be computed over the **created elements only** (not the full slide), using canonical JSON ordering.
- Hash MUST ignore runtime-only fields.

### 10.1a Required representative fixtures
The corpus MUST include at minimum:
- a simple shape+fill+stroke
- a gradient example
- a group with transforms
- a clipPath mask case
- a text case that imports as editable text
- a text case that forces outline fallback
- a case that triggers at least one warning (e.g. unsupported feature)

### 10.2 Golden checks
- Golden outputs MUST be asserted via canonical JSON + hashing.
- Playwright E2E MUST cover at least one representative Figma paste case.

---

## 11. Quality critique (risks)
- SVG→editable conversion is where editors usually become flaky; without corpus + goldens, regressions will ship.
- Text is the hardest part: exact fidelity requires a robust text model and font availability strategy.
- Effects/blend modes will diverge unless the mapping rules are explicit and tested.
