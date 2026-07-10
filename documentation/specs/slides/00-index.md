# Slides - Specification Index

**Last updated:** July 10, 2026

This folder contains requirements and technical contracts for slides, masters, layouts, themes, transitions, notes, SVG objects, and presentation runtime behavior.

## Authority

- Product intent: [Story Product Specification](../../product/product-spec.md)
- Current implementation status: [Capability Audit](../../product/capability-audit.md)
- This index routes to domain behavior. A specification does not prove implementation.
- Production code defines what the current build does; a difference from an accepted specification is a recorded gap.

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
- [05-slide-notes.md](05-slide-notes.md) — Slide notes / presenter notes (editor panel + presenter view contract)

## Related (kept as separate sub-specs)

- SVG objects (planned):
  - [svg/00-index.md](svg/00-index.md)

- Theme system (cascade + linked properties):
  - [themes/color-theme-cascade-architecture.md](themes/color-theme-cascade-architecture.md)
  - [themes/color-themes-spec.md](themes/color-themes-spec.md)
  - [themes/typography-style-manager.md](themes/typography-style-manager.md)
  - [themes/linked-properties-system.md](themes/linked-properties-system.md)

- Presentation runtime and presenter tools:
  - [presentation-mode/00-master-outline.md](presentation-mode/00-master-outline.md) - normative suite entry
  - [presentation-mode/23-ledger-and-gate-plan.md](presentation-mode/23-ledger-and-gate-plan.md) - point-in-time delivery evidence; verify against current code and tests

- Slide transitions and Morph:
  - [transitions/README.md](transitions/README.md)

## Pending Consolidation

The older `presentation/` documents contain useful requirements but are not a second authority. Unique valid requirements must be reconciled into `presentation-mode/`; contradictory or superseded material then moves to the archive.

## Archive

Older specs, temporary plans, and superseded documents were moved to:
- `documentation/archive/specs/slides/2025-12-13/`
