# Shapes UI: Design System Alignment

**Status**: Implemented (v1, partial)
**Owner**: Engineering
**Last Updated**: December 17, 2025

This document defines **how the Shapes UI must be built** so it remains one coherent Story app.

It is a strict extension of:
- `documentation/product/principles.md`
- `documentation/specs/ui-system/ui-design-system.md`

---

## 1. Hard constraints

- No new hardcoded colors, spacing, font sizes, shadows.
- Use only global design tokens (e.g., `--color-*`, `--spacing-*`, `--radius-*`, `--z-*`).
- Use existing common components (Dropdown, NumberInput, PropertyRow, IconButton, etc.).
- Dark/light compatibility is mandatory.
- Interaction states must use accent tokens (`--color-accent*`).

Additional hard constraints:
- Do not introduce new panels, drawers, or modal flows for Shapes by default; Shapes controls must live in existing inspector sections and existing context menus.
- Do not introduce new iconography sets; use existing icon assets and icon button variants.
- Do not introduce new bespoke pointer cursors beyond what the editor already uses (selection, move, resize, rotate) unless the base editor cursor system is extended globally.

V1 implementation notes:
- Shapes UI work in G5 stays inside existing surfaces: Property Inspector sections and the existing layer tree.
- No new color tokens or bespoke styles are introduced for Shapes UI; new indicators use existing tokens.
- Layer indentation is token-driven (no new hard-coded spacing introduced in G5 changes).

---

## 2. Where Shapes UI lives (information architecture)

Shapes UI must integrate into existing editor surfaces:
- Canvas overlay (handles, points, guides): `CanvasManager` + `GizmoRenderer`
- Property Inspector sections: `src/ui/PropertyInspector.js` sections
- Context menu/app menu actions: existing menu config system

No new panels or modal surfaces are introduced by default.

---

## 3. Component usage rules

### 3.1 Property Inspector
- Prefer extending existing sections:
  - Shape geometry controls belong in `AppearanceSection` or a new `ShapeSection` *only if required*.
  - Fills/strokes/effects must keep using existing `FillSection`, `StrokeSection`, `EffectsSection`.

### 3.2 Canvas overlay
- Handles and points must remain consistent with existing gizmo visuals.
- Hit targets must scale with zoom (so editing remains possible at any zoom level).

Canvas overlay constraint:
- Canvas overlay must be purely presentational and interaction-oriented; it must not become a second “inspector”. Any persistent, inspectable value must exist in the inspector as well.

---

## 4. Theme compatibility checks (required)

Before shipping any Shapes UI changes:
- Switch accent color (blue → purple) and confirm:
  - hover states
  - selected states
  - focus rings
  - gizmo/handle highlights

If any fixed color remains, the change violates the principles.

---

## 5. Visual translation principle (applied to shapes)

- Any “pick from list” interaction (e.g., continuity type, boolean op type) must use existing dropdown/context menu styling.
- Numeric edits must use `NumberInput` / scrubbable patterns already present.

---

## 6. Accessibility baseline

- Vector edit mode must remain keyboard-escapable.
- Focus rings must use the standard design tokens.
- Hit targets for points/handles must be large enough at typical zoom levels.

---

## 7. Quality critique (gaps + risks)
- Current doc defines principles but lacks an implementation checklist that reviewers can apply consistently.
- Canvas overlay is historically a common source of theme regressions (hardcoded colors) and accessibility gaps (non-focusable controls); this doc needs explicit audit steps.
- Without strict “no new surfaces” guidance, Shapes UI can sprawl into divergent panels and fracture Story’s IA.

## 8. Review checklist (required for PRs touching Shapes UI)
- Tokens only: search for hard-coded colors/sizes in modified CSS/JS.
- Theme swap: verify dark/light + at least one alternate accent theme.
- Zoom sanity: verify handle sizing + hit slop at min and max zoom.
- Mode sanity: verify `presentation` mode shows no edit affordances.
- Inspector parity: any canvas-only control has an inspector equivalent (or is explicitly labeled as a non-goal).
