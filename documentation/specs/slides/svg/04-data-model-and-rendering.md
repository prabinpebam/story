# SVG Data Model & Rendering

**Status:** Planned
**Last updated:** Dec 13, 2025

This document defines the high-level data model for an SVG object and the rendering pipeline.

## 1) Data model (conceptual)

An SVG element should store:

- Sanitized SVG markup (string)
- Metadata extracted at import time
  - `intrinsicWidth`, `intrinsicHeight` (if present)
  - `viewBox` (or synthesized)
  - optional `title`
  - compatibility flags (e.g., “requires raster fallback”)

Recommended additional metadata (for UX + debugging):

- `sourceFileName` (if imported from disk)
- `importWarnings[]` (e.g., “scripts removed”, “external URLs removed”)
- `complexity` summary (node count / path count estimates)

Storage preference (serialization-aligned):

- For `.str` files, prefer storing the SVG source as an **asset** and referencing it from the element.
- Avoid embedding large SVG strings directly in slide JSON.

See: [06-serialization-and-str-format.md](06-serialization-and-str-format.md)

## 1.2 Groups and layer nesting hierarchy

Story has a concept of a hierarchical element tree (e.g., “group” elements that own `children[]`, and elements that may reference a `parentId`).

Rules for SVG elements:

- An SVG element is a **leaf** in the Story element tree (MVP):
  - It does not own `children[]`.
  - It may have a `parentId` pointing to a Story group (or be top-level on the slide).
- Story grouping is orthogonal to SVG-internal structure:
  - SVG-internal `<g>` groups / nesting are kept inside the stored sanitized SVG markup for rendering.
  - SVG-internal groups are **not** represented as Story child elements.

Implications:

- Z-order and nesting behavior is defined by Story’s existing element ordering:
  - Top-level elements use the slide’s `elementOrder`.
  - Group children use the parent group’s `children[]` ordering.
- Any transforms applied at the Story group level affect the SVG object as part of the group composition.
- Any fit-mode and object-level paint overrides apply at the SVG object boundary (not to internal nodes).

Concrete example (diagram):

```
Slide (root)
└─ Group: "Logo Cluster" (type: group, id: g1)
  ├─ SVG: "Brand Mark" (type: svg, id: s1)
  └─ Text: "Tagline" (type: text, id: t1)
```

Conceptual ordering fields implied by this structure:

- `slide.elementOrder = ['g1', ...]`
- `slide.elements['g1'].children = ['s1', 't1']`
- `slide.elements['s1'].parentId = 'g1'`

Note: `s1` stores (or references) SVG markup, but does not expose SVG-internal `<g>` nodes as Story children.

## 1.1 Fill/Stroke compatibility model

SVG paint is defined internally by the SVG document.

To remain compatible with Story’s Fill/Stroke system without promising per-path editing:

- The SVG element may support **object-level** paint overrides using the existing `style.fills` / `style.strokes` structures.
- These overrides are only applied when the SVG is classified as **paint-overridable** (e.g., single-color icon).
- If the SVG is not paint-overridable, fills/strokes in the PI are either disabled or shown as “not applicable” (see PI spec).

Constraints (MVP):

- Support at most 1 fill (solid) and 1 stroke (solid) as object-level overrides.
- No gradients/images/videos/code fills for SVG overrides.
- The goal is compatibility with existing controls and serialization, not full SVG styling.
Transform fields reuse the common element transform model (x/y/width/height/rotation).

## 2) Rendering pipeline

### 2.1 Preferred: inline SVG rendering

- Render as inline SVG in the DOM layer.
- Apply object transforms via the same mechanism as other elements.
- Map the object bounds to the SVG viewport with the chosen fit mode.

Rendering must be safe-by-default:

- Render *sanitized* markup only.
- Do not permit runtime mutation by the SVG document.

If object-level Fill/Stroke overrides are enabled:

- Apply paint overrides at the **root** of the SVG rendering (not per internal node editing).
- If applying overrides would require unsafe rewriting of complex SVG, disable overrides and/or fall back.

### 2.2 Fallback: rasterization

Some SVGs may be unsuitable for inline rendering (policy-driven):

- Too complex
- Contains disallowed features that are essential to appearance
- Performance risk

In those cases:

- Preserve original sanitized SVG in the model.
- Render a cached raster preview for canvas + thumbnails.
- Allow “Attempt vector rendering” toggle only if we intentionally expose advanced overrides (optional; not MVP).

Deterministic selection:

- Fallback decision is based on: sanitization outcome + complexity limits + disallowed essential features.
- Fallback should be consistent across sessions.

## 3) Thumbnails

- Thumbnail rendering should reuse the same resolution rules.
- Avoid per-frame re-parsing; cache sanitized markup and derived DOM/raster forms.

## 4) Performance constraints

We should define protective limits:

- Max SVG text size (bytes)
- Max node count
- Max path count
- Max filter complexity

On limit breach:

- reject import, or
- raster-fallback with warning.

Recommended MVP defaults (tunable):

- Max SVG bytes: 1 MB
- Max element nodes: 10,000
- Max paths: 2,000
- Max `filter` elements: 20

If an SVG exceeds limits:

- Prefer raster-fallback (if renderable) rather than hard reject.
- Reject only if even rasterization is too expensive or the SVG is unsafe.

## 5) Copy/paste and duplication

- Duplicating an SVG object duplicates sanitized markup and metadata.
- Pasting SVG should re-run sanitization (defense in depth).

## 6) Serialization

- Store SVG markup and metadata in the slide document model.
- Ensure stable behavior on load across sessions.

Storage rule:

- Store the **sanitized** SVG as the persisted source of truth.
- Do not store unsanitized originals in the document.
- Prefer storing SVG as `assets/vectors/<hash>.svg` and referencing it from the element.

(Exact file format details belong in storage specs; this doc focuses on slide-level behavior.)
