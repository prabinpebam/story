# Supported SVG & Compatibility

**Status:** Planned
**Last updated:** Dec 13, 2025

This document defines what SVG “standard/version” we support and how we handle unsupported or risky content.

## 1) Version policy

### 1.1 Baseline

- **Baseline target:** SVG 1.1 (Second Edition) for *static* documents.
- Rationale: widest interoperability, and browser engines have mature support.

Baseline in practice:

- SVG is rendered by the browser’s SVG engine (inline SVG in the DOM).
- Our **guarantee** applies to a defined subset of SVG 1.1 features that also pass sanitization.
- Rendering details may still differ slightly by browser, but we target “modern Chromium” as the primary engine.

### 1.2 Best-effort SVG 2

- We accept SVGs authored as “SVG 2” and render via the browser.
- However, we only guarantee behavior for the baseline subset.

Practical interpretation:

- If the browser renders it and it passes our sanitizer, it should display.
- If it relies on features we strip or disallow, we may degrade.

Best-effort does not mean “fully editable”:

- Even if it renders, the object is still manipulated as a single bounding box.

### 1.3 Explicit exclusions

Regardless of SVG version claims, we do **not** support:

- JavaScript execution (`<script>`, `onload=`, `onclick=`, etc.)
- External network fetches or remote resources (`http(s)://…`)
- `<foreignObject>` (HTML embedding)
- `<iframe>`, `<object>`, `<embed>` inside SVG

Also excluded:

- Any form of scriptable interactivity (SMIL/CSS animations are treated as unsupported for MVP).

## 2) Feature support (intended)

### 2.1 Supported (initial target)

Rendered inline via the browser’s SVG engine:

- Basic shapes: `path`, `rect`, `circle`, `ellipse`, `line`, `polyline`, `polygon`
- Groups: `g`

Note (MVP): `g` groups and nested layer structure are supported for **rendering fidelity**, but are not mapped to Story’s Layer Tree hierarchy and are not selectable individually.
- Transforms: `transform` (translate/scale/rotate/matrix)
- Painting: `fill`, `stroke`, `stroke-width`, joins/caps, opacity
- Basic paint servers for self-contained artwork (`defs` + local references)
- Gradients: `linearGradient`, `radialGradient` (when self-contained)
- Clipping and masking: `clipPath`, `mask` (best-effort; may be limited by sanitizer rules)
- Viewport: `viewBox`, `preserveAspectRatio`

### 2.2 Best-effort / partial

- Filters (`filter`, blur, drop shadows): allowed only if complexity limits permit; otherwise stripped or raster-fallback.
- Patterns (`pattern`): best-effort.
- Embedded images (`image`): only if `data:image/*` URIs (size-limited); no remote URLs.
- Text (`text`, `tspan`): displayed as SVG text, but fonts may not match if the font is not available in Story.

### 2.3 Not supported initially

- SMIL animation (`<animate>`, `<animateTransform>`, etc.)
- CSS animations embedded in SVG
- External stylesheets (linked via URL)

## 3) Fonts and text policy

- If an SVG references a font family not present in Story, rendering falls back to browser font resolution.
- We do not attempt to import fonts embedded via remote URLs.

Embedded fonts:

- Embedded fonts (data URI) are potentially large and also complicate licensing expectations.
- MVP policy: **strip/ignore embedded fonts** and rely on browser fallback.
- Phase 2 can revisit with explicit size limits + UX.

## 4) Behavior on incompatibility

SVG import outcomes:

1) **Supported + safe** → store sanitized SVG markup; render inline.
2) **Unsafe** → reject with clear warning.
3) **Too complex / too heavy** → raster-fallback by default; optionally reject if even rasterization is too expensive.
4) **Partially supported** → render with degradation; optionally show a non-blocking warning.

Import should be deterministic:

- The same SVG should lead to the same outcome (inline vs raster vs reject) given the same limits.

## 5) Test corpus

To keep “support as much as possible” honest, we should maintain an SVG corpus:

- Icons (single-path, multi-path)
- Illustrations (gradients, clipPaths)
- Logos (text)
- Filter-heavy samples
- Large/complex path samples

The goal is regression coverage (visual + functional) rather than a formal conformance suite.

Recommended outcome tagging:

- Each fixture is tagged: `inline-ok`, `inline-degrade`, `raster-fallback`, `reject`.
