# Serialization & Interop (Shapes)

**Status**: Draft

Defines how shapes are stored and exchanged, with SVG-first export as the primary interoperability target.

---

## 1. Internal serialization
- Canonical shapes schema (see [02-data-model-and-serialization.md](./02-data-model-and-serialization.md)).
- Versioning and migrations are mandatory.
- Derived caches are never serialized.

## 2. SVG export (primary interop)
- Paths serialize to SVG `d`.
- Fill rules map to `fill-rule`.
- Gradients map to SVG gradients.
- Masks/clips map to `<clipPath>` or `<mask>`.
- Booleans are exported as flattened paths (unless we intentionally preserve structure).

Paint mapping constraints (must match current paint reality):
- Solid/theme-slot fills export as resolved colors (theme linkage is not preserved in raw SVG unless we embed Story-specific metadata).
- Gradients export as SVG gradients with stable IDs.
- Image fills export using `<pattern>` (preferred) or an `<image>` + clip (fallback), referencing embedded assets when available.
- Video fills do not have a portable SVG equivalent; export strategy is one of:
	- rasterize current frame into an `<image>` (default), OR
	- emit Story-specific metadata and a deterministic fallback visual.
- Code fills (canvas via CodeRunner) do not have a portable vector form; export must rasterize to an `<image>` at an explicit resolution.

Composition mapping:
- Masks/clips map to `<clipPath>` (for `clip`) or `<mask>` (for `alpha`) where supported.
- Booleans export as flattened paths by default to maximize compatibility; in-app non-destructive intent remains in `.str`.

Figma-class learning to incorporate:
- Export must be deterministic (stable ordering/canonicalization) or “golden tests” become flaky and diffs become meaningless.
- Preserve authoring intent in the document model even if export flattens it (e.g. booleans/masks remain editable in-app).

## 3. Import (deferred but spec’d)
Import is required for two distinct user-facing paths:
1) **Figma clipboard paste → editable Story elements** (required): see [19a-figma-clipboard-import.md](./19a-figma-clipboard-import.md).
2) **Raw SVG element import** (optional, lower-fidelity): importing arbitrary SVG markup as `type:'svg'` elements.

Shared requirements:
- SVG parsing safety is mandatory (sanitization).
- Importer must be explicit about what is supported vs baked vs dropped.

### 3.1 Figma clipboard paste (required)
The Figma paste pathway is the primary “editable import” contract.

Minimum required support for Figma paste (v1):
- SVG extraction from `image/svg+xml`, `text/html`, and `text/plain` clipboard payloads.
- Groups, transforms, paths.
- Solid fills, linear/radial gradients.
- Strokes (width/join/cap/dash; alignment via bake-to-path when needed).
- Clips/masks where representable.
- Text import as `type:'text'` when representable; otherwise outline-to-path fallback.

Not guaranteed for Figma paste (v1) but MUST degrade safely per [19a-figma-clipboard-import.md](./19a-figma-clipboard-import.md):
- Unsupported blend modes.
- Complex filter graphs.
- Text-on-path / per-glyph transforms.

### 3.2 Raw SVG import (optional)
Raw SVG import is explicitly not required to be high-fidelity for arbitrary SVG.
It MUST be sanitized and it MUST not break the document.

Explicitly not guaranteed (v1) for raw SVG import:
- Filters/effects fidelity, complex blend modes, nested masks with non-trivial units.
- SVG animation, scripts, external references.

## 4. Security
- Sanitization rules must apply for any imported markup.

Security requirements:
- Strip scripts, event handlers, and external URL references.
- Validate and clamp numeric attributes to avoid pathological rendering.

## 5. Tests / acceptance
- Round-trip stability for supported subset.

Determinism acceptance:
- Export ordering is stable:
	- stable traversal order
	- stable gradient/defs ID generation
	- stable path canonicalization (winding, tiny-segment pruning per epsilon policy)
- Golden SVG tests should not flap across runs.

Quality critique (gaps + risks):
- This doc was previously too hand-wavy about non-vector paints (video/code). Without explicit rasterization policy, exports will be inconsistent and user-hostile.
- “Preserve authoring intent” must be paired with “export is best-effort”: exported SVG may flatten structure and lose editability, but `.str` must not.
