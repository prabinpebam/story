# 23 — Transitions

> Taskflows for 7 transition types, direction grids, duration, 5-level cascade resolution, and legacy mapping.

## Transition Type Selection

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| TRN-01 | Set none | Select None from transition picker | No transition between slides; `durationMs: 0` | `UPDATE_SLIDE_STYLE_ASSIGNMENTS({slideTransition})` |
| TRN-02 | Set cross fade | Select Cross Fade | Opacity crossfade; default 300ms; system default | `UPDATE_SLIDE_STYLE_ASSIGNMENTS` |
| TRN-03 | Set morph | Select Morph | Name-based element matching (L0 only); default 1000ms | `UPDATE_SLIDE_STYLE_ASSIGNMENTS` |
| TRN-04 | Set wipe | Select Wipe | Directional wipe; 8-direction grid shown; default 300ms | `UPDATE_SLIDE_STYLE_ASSIGNMENTS` |
| TRN-05 | Set push | Select Push | Incoming pushes outgoing; 4-direction grid shown | `UPDATE_SLIDE_STYLE_ASSIGNMENTS` |
| TRN-06 | Set cover | Select Cover | Incoming covers outgoing; 4-direction grid | `UPDATE_SLIDE_STYLE_ASSIGNMENTS` |
| TRN-07 | Set uncover | Select Uncover | Outgoing reveals incoming; 4-direction grid | `UPDATE_SLIDE_STYLE_ASSIGNMENTS` |

## Direction Grid

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| TRN-08 | 8-direction grid (wipe) | Wipe transition selected | 3×3 grid (8 positions); includes diagonals: left, right, up, down, upLeft, upRight, downLeft, downRight | `updateSlideTransitionDirection()` |
| TRN-09 | 4-direction grid (push/cover/uncover) | Push, Cover, or Uncover selected | Cross-shaped grid (4 positions): left, right, up, down | `updateSlideTransitionDirection()` |
| TRN-10 | Direction grid hidden | None, Cross Fade, or Morph selected | Direction grid not rendered | — |
| TRN-11 | Select direction | Click direction cell in grid | Transition direction updated | `updateSlideTransitionDirection()` |

## Duration

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| TRN-12 | Set duration | Edit duration NumberInput | Clamped 0–5000ms, step 50; morph default 1000ms, others 300ms | `updateSlideTransitionDuration()` |
| TRN-13 | Duration for none | None transition selected | Duration forced to 0ms | — |

## Cascade Resolution (5 Levels)

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| TRN-14 | Slide-level override | Set transition on specific slide | `styleAssignments.slideTransition` on slide (highest priority) | `UPDATE_SLIDE_STYLE_ASSIGNMENTS` |
| TRN-15 | Legacy slide transition | Old slide with `transition` field | `mapLegacyTransitionToConfig()`: fade→crossFade, push→push right, slide→cover right, none→none, magic→none | — |
| TRN-16 | Layout-level transition | Set transition on layout master | Cascades to all slides using this layout without slide-level override | `UPDATE_MASTER_STYLE_ASSIGNMENTS` |
| TRN-17 | Master-level transition | Set transition on theme master | Cascades through layout to slides without overrides at either level | `UPDATE_MASTER_STYLE_ASSIGNMENTS` |
| TRN-18 | System default | No transition set at any level | Cross fade, 300ms, ease-in-out | — |
| TRN-19 | Show inheritance badge | Transition inherited from layout/master | Badge shows source: "From [layout name]" or "From [master name]" | — |
| TRN-20 | Reset to inherited | Click reset button on slide transition | Clears `styleAssignments.slideTransition`; inherits from parent | `UPDATE_SLIDE_STYLE_ASSIGNMENTS({slideTransition: null})` |

## Morph Matching

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| TRN-21 | Morph name matching | Morph transition between slides | L0 elements matched by name (trimmed, case-sensitive); matched elements animate between positions | — |
| TRN-22 | Morph duplicate handling | Multiple elements with same name | Top-most element chosen deterministically for match | — |
| TRN-23 | Morph unmatched enter/exit | Elements without match on other slide | Unmatched elements dissolve (fade in/out) | — |
