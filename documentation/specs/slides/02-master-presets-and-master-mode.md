# Slides — Master Presets & Master Mode (Implementation)

**Last updated:** Dec 13, 2025

This document describes how Master Presets and Master Mode work in the current implementation.

## 1) Master Mode

### 1.1 Active container

Editing uses a single interaction model with an “active container”:

- **Edit mode:** active container is the active normal slide.
- **Master mode:** active container is the active master entity:
  - a master root (`type: 'slideMasterPreset'`), or
  - a layout master (`type: 'layoutMaster'`).

### 1.2 Inherited elements in layout masters

When editing a **layout master**, elements inherited from the **master root** are rendered as visual reference and are **not interactive**.

Only elements defined directly on the layout master are selectable/editable.

## 2) Master Presets

### 2.1 What a Master Preset does

Applying a Master Preset to a master root:

- Sets the master root’s `presetId`.
- Replaces the master root’s template-driven geometry (background + master elements).
- Replaces *all child layouts* under that master root with the materialized layouts from the preset template.
- Updates canonical style references:
  - `colorThemeId`
  - `typographyStyleId`
- Includes the master’s `layoutGuide` defaults.

### 2.2 Blocking rule (safe-by-default)

A master preset **cannot be changed** if that master root is currently used by any normal slides.

The UI surfaces this as a blocked flow (notification) and directs the user to resolve usage first.

### 2.3 Materialization rules

Preset materialization derives layout structure from a template master (currently the default templates):

- A new master root is created/updated.
- Layout masters are created under it.
- Placeholder elements ensure stable `placeholderKey` identity when applicable.

## 3) Inheritance/reset UI

The Property Inspector indicates inheritance and supports reset behaviors consistent with the cascade:

- Layout masters can inherit from their master root and can reset to inherited values.
- Slides can inherit from their layout/master and can reset to inherited values.

(Exact UI affordances are implemented in the Property Inspector sections; behavior is verified via Playwright tests.)
