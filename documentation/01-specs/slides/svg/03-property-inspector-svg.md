# Property Inspector — SVG Object

**Status:** Planned
**Last updated:** Dec 13, 2025

This document specifies the SVG-specific UI in the Property Inspector (PI).

## 1) Selection behavior

- When an SVG object is selected, PI shows standard shared sections (Transform, Arrange, etc.).
- A new **SVG** section appears for `type: 'svg'` elements.

Grouping / hierarchy notes (MVP):

- If a **Story group** is selected (even if it contains SVG children), PI shows the group’s existing group behavior (appearance/effects/etc.) per the core PI specs.
- If an **SVG object** inside a group is selected, PI shows the SVG object’s controls (fit, replace, limited paint overrides) as specified here.
- The PI does not offer controls to browse/select SVG internal layers or `<g>` groups.

Principles alignment:

- Reuse the existing Property Inspector design system components.
- Do not introduce new color pickers/inputs; reuse Fill/Stroke controls where applicable.
- Must work in dark and light mode.

## 2) SVG section contents

### 2.1 Summary (read-only)

- Name: derived from filename or embedded `<title>` if present; fallback “SVG”.
- Intrinsic size: `width × height` if present.
- `viewBox`: display the normalized viewBox.

If the SVG is not rendered as vector (fallback):

- Show a warning badge: “Raster fallback”
- Show a short reason (e.g., “too complex”, “uses unsupported filters”, “blocked external references”).

### 2.2 Actions

- **Replace…**
  - Opens file picker.
  - Replaces the stored SVG markup + metadata.
  - Preserves object transforms (position/size/rotation) by default.

- **Open original (advanced/debug)** (optional)
  - Shows the sanitized SVG text in a read-only viewer.
  - This is not an editor.

### 2.3 Fit / sizing

SVG sizing must map the SVG’s internal coordinate space (`viewBox`) to the object’s bounds.

Expose a simple fit mode:

- **Contain** (default): preserve aspect ratio, fit entire SVG inside bounds.
- **Cover**: preserve aspect ratio, fill bounds (may clip).
- **Stretch**: ignore aspect ratio, fill bounds.

Normative mapping:

- Contain → `preserveAspectRatio="xMidYMid meet"`
- Cover → `preserveAspectRatio="xMidYMid slice"` (requires clipping to bounds)
- Stretch → `preserveAspectRatio="none"`

Notes:

- If SVG has no viewBox, we compute a synthetic viewBox from width/height when possible.

### 2.4 Color manipulation (deliberately limited)

SVG is often multi-colored and complex; we should avoid promising full per-shape editing.

Define a “single-color icon” heuristic:

- Eligible if the sanitized SVG has:
  - no gradients/patterns/filters/masks,
  - no embedded images,
  - no `<style>` blocks (or only trivial style blocks without paint overrides),
  - and all visible fills/strokes resolve to a single solid color.

If eligible:

- Show **Tint** control (color picker).
- Tint applies as a top-level override.

Constraints:

- Tint must not promise “theme linking” in MVP.
- Tint must not attempt multi-color remapping.

## 2.5 Fill/Stroke compatibility (required)

SVG objects must remain compatible with the app’s Fill/Stroke architecture.

Rule:

- If the SVG is classified as **paint-overridable** (e.g., single-color icon), the PI should expose the existing **Fill** and **Stroke** sections, backed by the element’s existing `style.fills` and `style.strokes` fields.
- If the SVG is **not** paint-overridable, the Fill/Stroke sections should be present but disabled (or replaced with a clear “Not applicable for this SVG” message) to avoid implying internal SVG editing.

MVP constraints (for SVG overrides):

- Allow at most **one** fill and **one** stroke.
- Only **solid** colors for fill/stroke overrides.
- Opacity uses the same numeric control pattern as Fill/Stroke opacity.

User expectation:

- Fill/Stroke applies to the SVG as a whole (object-level override), not to individual paths.
If not eligible:

- Show a read-only note: “Colors are defined inside this SVG and are not editable in Story (yet).”

### 2.5 Stroke/fill sections

- Fill/Stroke should not attempt per-node editing of SVG internals.
- Fill/Stroke may apply only object-level overrides when allowed (see compatibility section).
- Any future internal editing (Phase 2+) must be explicit and constrained.

## 3) What PI does not offer (initial)

- Editing internal layers, groups, or paths.
- Selecting or editing text within SVG.
- Recoloring multi-color SVGs.

## 4) UX copy requirements

Because “SVG support as much as possible” can still degrade, the UI must be honest:

- If an SVG is raster-fallback, PI shows “Rendered as raster for compatibility” and why.
- If an SVG was sanitized (e.g., scripts removed), import confirmation should mention it.

If an SVG is rejected at import:

- Error message must be specific (e.g., “SVG contains external URL references which are not allowed”).
