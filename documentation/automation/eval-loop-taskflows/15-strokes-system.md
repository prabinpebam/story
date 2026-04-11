# 15 — Strokes System

> Taskflows for stroke stack management, StrokeSettingsFlyout, stroke properties, gradient strokes, and multi-selection.

## Stroke Stack Management

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| STK-01 | Add stroke layer | Click + in Stroke section header | New stroke added; first defaults to `#000000, width 1`; subsequent: `#000000, opacity 25%` | `UPDATE_ELEMENT({style:{strokes}})` |
| STK-02 | Delete stroke layer | Click delete on stroke row | Stroke removed from array | `UPDATE_ELEMENT({style:{strokes}})` |
| STK-03 | Toggle stroke visibility | Click eye icon on stroke row | Stroke layer enabled/disabled | `UPDATE_ELEMENT({style:{strokes}})` |
| STK-04 | Reorder strokes (drag) | Drag stroke row handle | Stroke moved in stack order | `UPDATE_ELEMENT({style:{strokes}})` |
| STK-05 | Set stroke blend mode | Click blend mode button → select | Per-stroke blend mode from 16 modes | `UPDATE_ELEMENT({style:{strokes}})` |
| STK-06 | Edit stroke hex | Type in hex input on stroke row | Solid stroke color updated; disabled for gradient | `UPDATE_ELEMENT({style:{strokes}})` |
| STK-07 | Edit stroke opacity | Edit opacity NumberInput on stroke row | Stroke opacity updated | `UPDATE_ELEMENT({style:{strokes}})` |
| STK-08 | Open stroke flyout | Click stroke swatch on row | StrokeSettingsFlyout opens | — |
| STK-09 | Legacy stroke migration | Element with old `borderWidth`/`borderColor`/`strokeAlign` | Auto-migrated to `style.strokes` array | — |

## StrokeSettingsFlyout — Color

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| STK-10 | Set solid stroke color | Interact with embedded SolidTab | Stroke color from HSB area, hex input, theme swatches, or default palette | `UPDATE_ELEMENT({style:{strokes}})` |
| STK-11 | Switch to gradient stroke | Click Gradient type icon | Stroke fill switches to gradient; GradientTab shown | `UPDATE_ELEMENT({style:{strokes}})` |
| STK-12 | Edit gradient stroke | Interact with embedded GradientTab | Gradient type, angle, stops — same controls as FillFlyout GradientTab | `UPDATE_ELEMENT({style:{strokes}})` |
| STK-13 | Theme-link stroke | Click theme swatch in stroke color picker | Stroke linked to theme slot | `UPDATE_ELEMENT({style:{strokes}})` |

## Stroke Properties

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| STK-14 | Set stroke weight | Edit W NumberInput (0–100) | `stroke.width` updated; scrubbable | `UPDATE_ELEMENT({style:{strokes}})` |
| STK-15 | Set stroke position | Select from dropdown: Center, Inside, Outside | `stroke.position` updated | `UPDATE_ELEMENT({style:{strokes}})` |
| STK-16 | Set stroke style: Solid | Click Solid in SegmentedControl | `stroke.style = 'solid'`; hides dash controls | `UPDATE_ELEMENT({style:{strokes}})` |
| STK-17 | Set stroke style: Dashed | Click Dashed in SegmentedControl | `stroke.style = 'dashed'`; shows dash controls | `UPDATE_ELEMENT({style:{strokes}})` |
| STK-18 | Set dash array | Edit dash input (e.g. "2, 4") | `stroke.dashArray` updated; only visible when dashed | `UPDATE_ELEMENT({style:{strokes}})` |
| STK-19 | Set dash cap: Butt | Click Butt in cap SegmentedControl | `stroke.dashCap = 'butt'`; only visible when dashed | `UPDATE_ELEMENT({style:{strokes}})` |
| STK-20 | Set dash cap: Square | Click Square | `stroke.dashCap = 'square'` | `UPDATE_ELEMENT({style:{strokes}})` |
| STK-21 | Set dash cap: Round | Click Round | `stroke.dashCap = 'round'` | `UPDATE_ELEMENT({style:{strokes}})` |
| STK-22 | Set join: Miter | Click Miter in join SegmentedControl | `stroke.join = 'miter'`; shows miter limit | `UPDATE_ELEMENT({style:{strokes}})` |
| STK-23 | Set join: Bevel | Click Bevel | `stroke.join = 'bevel'`; hides miter limit | `UPDATE_ELEMENT({style:{strokes}})` |
| STK-24 | Set join: Round | Click Round | `stroke.join = 'round'`; hides miter limit | `UPDATE_ELEMENT({style:{strokes}})` |
| STK-25 | Set miter limit | Edit miter NumberInput (°) | `stroke.miterLimit` updated; only visible when join = Miter | `UPDATE_ELEMENT({style:{strokes}})` |

## Multi-Selection

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| STK-26 | Compatible stacks | Multi-select with same stroke count | Per-field mixed detection across stroke layers | — |
| STK-27 | Incompatible stacks | Multi-select with different stroke counts | "Mixed" empty state shown | — |
| STK-28 | Mixed stroke properties | Multi-select with same count but different values | Individual fields show "Mixed" independently | — |
