# Slides — Specs (Implementation-aligned)

**Last updated:** Dec 13, 2025

This folder contains the *current, implementation-aligned* documentation for the slide system.

## Source of truth

- The running app + the codebase are the source of truth.
- These specs describe what exists today (and only lightly note what’s explicitly not implemented).

## What’s in scope here

- Slide data model (slides, masters, layouts)
- Master Presets + Master Mode behavior
- Cascading style assignments (Color Theme + Typography)
- Layout Guide system + snapping toggles
- Slide navigation, thumbnails, and core slide operations

## Specs

- [01-architecture.md](01-architecture.md) — Canonical data model + inheritance rules
- [02-master-presets-and-master-mode.md](02-master-presets-and-master-mode.md) — Master Mode interaction + preset application
- [03-layout-guides-and-snapping.md](03-layout-guides-and-snapping.md) — Layout Guide overlay, PI controls, snapping options
- [04-navigation-thumbnails-and-operations.md](04-navigation-thumbnails-and-operations.md) — Slide list, thumbnails, add/duplicate/delete

## Related (kept as separate sub-specs)

- Theme system (cascade + linked properties):
  - [themes/color-theme-cascade-architecture.md](themes/color-theme-cascade-architecture.md)
  - [themes/color-themes-spec.md](themes/color-themes-spec.md)
  - [themes/typography-style-manager.md](themes/typography-style-manager.md)
  - [themes/linked-properties-system.md](themes/linked-properties-system.md)

- Presentation modes (partial / experimental):
  - [presentation/presentation-mode.md](presentation/presentation-mode.md)
  - [presentation/presentation-mode-caching.md](presentation/presentation-mode-caching.md)
  - [presentation/animation-transitions.md](presentation/animation-transitions.md)

## Archive

Older specs, temporary plans, and superseded documents were moved to:
- `documentation/archive/specs/slides/2025-12-13/`
