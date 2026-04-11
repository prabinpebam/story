# 21 — Master Slides & Layouts

> Taskflows for the Master → Layout → Slide hierarchy, master editing, layout management, style cascade, and preset library.

## Master ↔ Layout Hierarchy

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| MST-01 | View master list | Switch to master editing mode | Masters shown as collapsible groups with layouts underneath | `SET_MODE('master')` |
| MST-02 | Collapse master group | Click disclosure chevron | Layout children hidden | — |
| MST-03 | Expand master group | Click disclosure chevron | Layout children shown | — |
| MST-04 | Select master | Click master thumbnail | Master becomes active for editing; PI shows SlideSection in master mode | `SET_ACTIVE_MASTER` |
| MST-05 | Select layout | Click layout thumbnail under master | Layout becomes active for editing; inherits master settings | `SET_ACTIVE_LAYOUT` |

## Master Editing

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| MST-06 | Edit master name | Edit name TextInput in PI | Master preset name updated | `UPDATE_MASTER({name})` |
| MST-07 | Rename master from context menu | Right-click master → Rename | Inline rename on master thumbnail | — |
| MST-08 | Set master color theme | Apply theme via ColorThemeManager | `colorThemeId` set on theme master | `APPLY_LUMA_THEME` |
| MST-09 | Set master typography | Apply typography preset via PI | `typographyStyleId` set on theme master | `APPLY_FONT_PRESET` |
| MST-10 | Set master color mode | Toggle light/dark mode | `colorModeId: 'light'|'dark'` on theme master | `SET_COLOR_MODE` |
| MST-11 | Set master transition | Configure transition in PI | `styleAssignments.slideTransition` on master; cascades to all slides using this master | `UPDATE_MASTER_STYLE_ASSIGNMENTS` |
| MST-12 | Edit master background | Modify background fill | FillSection for master background | `UPDATE_MASTER({background})` |
| MST-13 | Add element to master | Create shape/text on master canvas | Element added to master's elementOrder | `ADD_ELEMENT_TO_MASTER` |

## Layout Management

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| MST-14 | Add layout to master | Create new layout under master | New layout with `parentMasterId` pointing to theme master | `ADD_LAYOUT` |
| MST-15 | Layout inherits background | Layout without override | `effectiveBackground.type === 'inherited'` from parent master | — |
| MST-16 | Layout inherits color theme | Layout without colorTheme override | `colorThemeId` resolved from parent master | — |
| MST-17 | Add placeholder to layout | Drag/click from PlaceholderSection | Placeholder element added to layout master's elements | `ADD_ELEMENT_TO_MASTER` |

## Layout Guides

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| MST-18 | Configure layout margins | Edit margin controls in PI (master mode) | Stores margin values (linked or per-side) | `updateLayoutGuideMargin()` |
| MST-19 | Set column count | Edit columns NumberInput (1–24) | Column grid count updated | `updateLayoutGuideColumnsCount()` |
| MST-20 | Set column gutter | Edit gutter NumberInput | Space between columns | `updateLayoutGuideGutter()` |
| MST-21 | Layout guide inheritance | Layout inherits from parent | Badge shows inheritance source; reset button available | — |

## Master Presets

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| MST-22 | Open preset picker | Click preset button in PI | `MasterPresetPicker` DraggablePanel (520×520) with thumbnail grid + color swatches | — |
| MST-23 | Apply preset | Click preset thumbnail → Apply | Master materialized from preset; presets reference color/typography IDs, not embed them | `APPLY_MASTER_PRESET_TO_MASTER` |
| MST-24 | Browse 10 built-in presets | View preset grid | Neutral, Electric Dreams, Sunset Boulevard, Tropical Paradise, Berry Bliss, Emerald & Gold, Cosmic Nebula, Citrus Burst, Ocean Sunset, Rose Garden | — |
| MST-25 | Master usage check | Delete or modify master | `isMasterInUseBySlides()` checks if any slide's layout points to this master | — |

## Reorder

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| MST-26 | Reorder masters | Drag master thumbnail in panel | Master moved in list order | `REORDER_MASTERS` |
| MST-27 | Reorder layouts | Drag layout under master | Layout order within master updated | `REORDER_LAYOUTS` |

## Style Cascade

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| MST-28 | Theme cascades to slides | Change master color theme | All slides using this master (via layouts) see updated theme unless overridden at slide level | — |
| MST-29 | Transition cascades | Change master transition | All slides without slide-level override inherit new transition | — |
| MST-30 | Typography cascades | Change master typography | All text styles resolved via StyleResolver update | — |
