# Theming & Visual Polish (Presentation Runtime)

## Goals
- Ensure presentation UI (HUD, pointers) is readable in real environments.
- Keep slide content theming separate from presentation UI theming.

---

## 1) Theme Separation
### Requirements
- MUST treat slide content theme as independent from HUD theme.
- MUST avoid HUD styling that affects slide layout.

---

## 2) Readability & Contrast
### Requirements
- MUST meet contrast requirements for HUD and text.
- SHOULD provide "projector friendly" defaults.
- SHOULD support high-contrast mode (`prefers-contrast: high`).

---

## 3) Motion & Polish
### Requirements
- MUST respect reduced motion preferences (`prefers-reduced-motion: reduce`).
- HUD fades/animations must not introduce jank.
- Reduced motion mode SHOULD simplify transitions to instant cuts.

---

## 4) Design Tokens (Required)
### Requirements
- MUST define and use tokens for all presentation runtime UI:
  - `--color-presentation-stage-bg`
  - `--color-presentation-overlay-bg` (black/white screen)
  - `--color-presentation-hud-bg`
  - `--color-presentation-laser`
  - `--color-presentation-grid-overlay-bg`
  - `--color-hud-button-hover`
  - `--color-hud-button-active`
  - `--color-hud-divider`
  - `--color-hud-text`
- MUST NOT use hardcoded colors in presentation CSS.
- MUST document token usage in component library.

---

## Telemetry
- Theme selection (if configurable)
- Reduced motion preference usage

## Test plan
- Dark room simulation (high contrast)
- Reduced motion verification
- Light/dark theme toggle (verify HUD updates)

## Edge cases
- HDR displays
- OS high-contrast mode
