# Slides — Layout Guides & Snapping (Implementation)

**Last updated:** Dec 13, 2025

This document describes the Layout Guide system as implemented.

## 1) Layout Guide model

Layout Guides are persisted on:

- Master root (`slideMasterPreset.layoutGuide`) — defaults for the master
- Layout master (`layoutMaster.layoutGuide`) — optional overrides
- Slide (`slide.layoutGuide`) — optional overrides

Effective guide is resolved via the cascade:

Slide → Layout → Master → System defaults.

Default values:

- Margins: 40px on all sides (linked)
- Columns: 3
- Gutter: 20px
- Overlay appearance: red `#FF0000` at 10% opacity

## 2) Overlay rendering

- The overlay is rendered above slide content.
- It is **non-interactive** (`pointer-events: none`).
- Visibility is controlled by a viewport UI flag (`editor.showLayoutGuides`).
  - Default is OFF.

## 3) Editing (Property Inspector)

The Layout Guide section is shown only when:

- `editor.mode === 'master'`, and
- the active container is a slide-level master entity (master root or layout master), and
- no element is selected.

Inputs clamp to valid ranges and update the active master entity.

## 4) Snapping options (viewport flyout)

Snapping options are exposed as exactly **three toggles**:

- **Snap to Object**
- **Snap to slide** (includes slide edges, slide center, and margin edges)
- **Snap to columns**

These toggles map to editor state:

- `editor.snapToObject`
- `editor.snapToSlide`
- `editor.snapToColumns`

Snapping to columns uses the effective layout guide geometry.

## 5) Validation

The Layout Guide system is covered by Playwright E2E tests (DOM + store validation), including:

- section visibility rules
- viewport toggle behavior
- snapping flyout toggles
- drag snapping behavior
- layout master inheritance + reset behaviors
