# Slides — Architecture & Data Model (Canonical)

**Last updated:** Dec 13, 2025

This document describes the *current* (canonical) slide architecture as implemented.

## 1) Core entities

The presentation state is primarily composed of:

- **Slides** — normal editable slides (`state.slides`)
- **Masters** — both master roots and layout masters (`state.slideMasterPresets`)
  - Master root: `type: 'slideMasterPreset'`
  - Layout master: `type: 'layoutMaster'`

A normal slide selects a layout via `slide.layoutId`.

## 2) Master hierarchy

Implemented hierarchy:

- **Master root** (`slideMasterPreset`)
  - Contains master-level elements (optional)
  - References style presets via IDs
  - Owns `layoutIds` (child layouts)

- **Layout master** (`layoutMaster`)
  - Child of a master root via `parentMasterId`
  - Defines placeholders and/or layout-level elements
  - Can override style assignments (or inherit)

- **Slide**
  - Instance that uses a layout master via `layoutId`
  - Can override style assignments (or inherit)

## 3) Style assignments (references only)

**Critical invariant (implemented):** master/layout/slide records store **references**, not embedded theme or typography definitions.

- `colorThemeId` is an ID into the color theme preset library.
- `typographyStyleId` is an ID into the typography style preset library.

These are resolved at runtime via `StyleResolver`.

See the theme sub-specs for details:
- [themes/color-theme-cascade-architecture.md](themes/color-theme-cascade-architecture.md)
- [themes/typography-style-manager.md](themes/typography-style-manager.md)

## 4) Inheritance rules

### 4.1 Style inheritance (Color Theme / Typography)

Effective style assignment follows the cascade:

1) Slide override (`slide.colorThemeId` / `slide.typographyStyleId`)
2) Layout override (`layoutMaster.colorThemeId` / `layoutMaster.typographyStyleId`)
3) Master default (`slideMasterPreset.colorThemeId` / `slideMasterPreset.typographyStyleId`)

### 4.2 Layout Guide inheritance

Layout Guide data also cascades:

1) Slide override (`slide.layoutGuide`)
2) Layout override (`layoutMaster.layoutGuide`)
3) Master default (`slideMasterPreset.layoutGuide`)
4) System defaults (fallback)

Within a `layoutGuide` object, fields can be partially overridden and merged (field-level merge).

## 5) Placeholders (implemented behavior)

Layouts define placeholder elements (typically text/image) using:

- `isPlaceholder: true`
- `placeholderType` (e.g. `title`, `body`, `subtitle`, `picture`)

Slides created from a layout start with corresponding placeholder elements derived from the layout definition.

The runtime also tracks placeholder UX state (e.g. whether a placeholder has user content) and uses it for:

- Layer Tree placeholder badges (empty vs has-content)
- Placeholder-specific operations (e.g. resetting placeholder content to the master prompt)

(Exact reconciliation mechanics are implementation-driven and may evolve; the user-facing behavior is “content is preserved when possible when changing layouts/masters”.)

## 6) Where to look in code

- Default master/layout templates: `src/core/store/InitialState.js` (`DEFAULT_MASTERS`)
- Preset materialization: `src/core/masterPresets/MasterPresetLibrary.js`
- Preset apply handler: `src/core/store/handlers/MasterHandlers.js` (`APPLY_MASTER_PRESET_TO_MASTER`)
- Cascade resolution: `src/utils/StyleResolver.js`
