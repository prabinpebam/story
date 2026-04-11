# 32 — Export System

> Taskflows for SVG export engine, multi-format raster export, export to clipboard, and preset management.

## SVG Export Engine

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| EXP-01 | Export element as SVG | Export with format=SVG | `buildSvgMarkup()` generates pure SVG markup (no DOM); portable SVG subset | — |
| EXP-02 | SVG shape support | Export rectangle, ellipse, text, vector, boolean | SVG `<path>` elements with fills and strokes | — |
| EXP-03 | SVG boolean resolution | Export boolean element | `resolveBooleanDerivedPaths()` computes final paths; rendered as vector geometry | — |
| EXP-04 | SVG mask handling | Export masked element | Masks skipped (relationship node); content exported with `clip-path` | — |
| EXP-05 | SVG solid fill | Element with solid fill | `<path fill="#color">` with theme slot resolution | — |
| EXP-06 | SVG gradient fill | Element with linear/radial gradient | `<linearGradient>` or `<radialGradient>` defs with stop colors | — |
| EXP-07 | SVG image fill | Element with image fill | `<pattern>` with `<image>` and `preserveAspectRatio="xMidYMid slice"` | — |
| EXP-08 | SVG code fill | Element with code fill | Rasterized to `<pattern>` (code cannot run in static SVG) | — |
| EXP-09 | SVG video fill | Element with video fill | Poster frame extracted to `<pattern>` | — |
| EXP-10 | SVG stroke support | Element with solid/gradient stroke | SVG stroke attributes applied | — |
| EXP-11 | SVG transforms | Rotated/flipped elements | `translate`, `rotate`, `scale(-1)` transform attributes | — |
| EXP-12 | SVG clip paths | Masked elements | `computeUnifiedClipPathCss()` resolved to SVG `<clipPath>` | — |
| EXP-13 | SVG warnings metadata | Missing assets | `<metadata>` contains warnings: missing hrefs, unrasterized code fills, missing video posters | — |

## Raster Export (PNG, JPG, WEBP)

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| EXP-14 | Export as PNG | Export with format=PNG | Canvas-based rendering; supports transparency | — |
| EXP-15 | Export as JPG | Export with format=JPG | Canvas-based rendering; white background (no transparency) | — |
| EXP-16 | Export as WEBP | Export with format=WEBP | Canvas-based rendering; WebP compression | — |
| EXP-17 | Export with scale | Select scale: 0.5x, 0.75x, 1x, 1.5x, 2x, 3x, 4x | Raster dimensions scaled accordingly | — |
| EXP-18 | Export with fixed size | Select 512w or 512h | One dimension fixed at 512px; other proportional | — |
| EXP-19 | Custom suffix | Set suffix (e.g., "@2x") | Filename includes suffix: `element-name@2x.png` | — |
| EXP-20 | Rotation/flip in raster | Rotated or flipped element | Canvas transforms applied during rendering | — |

## Export to Clipboard

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| EXP-21 | Copy as PNG to clipboard | Alt+click Export or export-to-clipboard | `navigator.clipboard.write()` with `ClipboardItem({'image/png': blob})`; default 2x scale | — |
| EXP-22 | HTTPS requirement | Attempt clipboard on HTTP | Clipboard API requires HTTPS or localhost; fallback behavior | — |

## Batch Export

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| EXP-23 | Export all presets | Click Export with multiple presets | Iterates all presets; continues on individual failure | — |
| EXP-24 | Multi-selection export | Export with multiple elements selected | Each element exported per its presets; label shows "Export Selection" | — |

## Preset Management

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| EXP-25 | Add export preset | Click + in Export section | New preset: `{scale:'1x', format:'png', suffix:''}` | `UPDATE_ELEMENT({exportPresets})` |
| EXP-26 | Set preset scale | Select from scale dropdown | Scale updated on specific preset index | `UPDATE_ELEMENT({exportPresets})` |
| EXP-27 | Set preset format | Select from format dropdown (PNG/JPG/SVG/PDF/WEBP) | Format updated on specific preset index | `UPDATE_ELEMENT({exportPresets})` |
| EXP-28 | Set preset suffix | Edit suffix text input | Suffix updated on specific preset index | `UPDATE_ELEMENT({exportPresets})` |
| EXP-29 | Remove export preset | Click – on preset row | Preset removed from array | `UPDATE_ELEMENT({exportPresets})` |
| EXP-30 | Mixed preset stacks | Multi-select with different preset counts | "Mixed" indicator; fields non-editable | — |

## Export Preview

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| EXP-31 | Generate preview | Element selected with presets | `ExportPreviewRenderer` renders canvas (max 200×200); target <300ms | — |
| EXP-32 | Placeholder preview | Empty/transient state | Placeholder canvas shown | — |
| EXP-33 | Aspect ratio preservation | Preview renders | Fits within max bounds preserving original aspect ratio | — |
