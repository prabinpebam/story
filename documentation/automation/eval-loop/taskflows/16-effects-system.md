# 16 — Effects System

> Taskflows for effect stack management, shadow flyout, blur flyout, effect type switching, and multi-selection.

## Effect Stack Management

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| EFX-01 | Add drop shadow | Click + → Drop Shadow | New drop shadow added: `{type:'dropShadow', x:0, y:4, blur:8, spread:0, color:'#000', opacity:25}` | `UPDATE_ELEMENT({style:{effects}})` |
| EFX-02 | Add inner shadow | Click + → Inner Shadow | New inner shadow with same defaults | `UPDATE_ELEMENT({style:{effects}})` |
| EFX-03 | Add layer blur | Click + → Layer Blur | New layer blur: `{type:'layerBlur', radius:12, mode:'uniform'}` | `UPDATE_ELEMENT({style:{effects}})` |
| EFX-04 | Add background blur | Click + → Background Blur | New background blur: `{type:'backgroundBlur', radius:12}` | `UPDATE_ELEMENT({style:{effects}})` |
| EFX-05 | Delete effect | Click delete on effect row | Effect removed from array by unique `id` | `UPDATE_ELEMENT({style:{effects}})` |
| EFX-06 | Toggle effect visibility | Click eye icon on effect row | Effect enabled/disabled | `UPDATE_ELEMENT({style:{effects}})` |
| EFX-07 | Reorder effects (drag) | Drag effect row handle | Effect moved in stack order | `UPDATE_ELEMENT({style:{effects}})` |
| EFX-08 | Open effect flyout | Click effect row | Flyout opens with type-specific controls | — |
| EFX-09 | Open effect styles | Click 💎 button | Effect styles library (future) | — |

## Shadow Flyout (Drop Shadow / Inner Shadow)

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| EFX-10 | Switch effect type | Select from type dropdown | Can switch between all 4 types from within flyout | `UPDATE_ELEMENT({style:{effects}})` |
| EFX-11 | Set shadow blend mode | Select from blend mode dropdown | Per-effect blend mode from 16 modes | `UPDATE_ELEMENT({style:{effects}})` |
| EFX-12 | Set shadow X offset | Edit X NumberInput | `effect.x` updated; default 0 | `UPDATE_ELEMENT({style:{effects}})` |
| EFX-13 | Set shadow Y offset | Edit Y NumberInput | `effect.y` updated; default 4 | `UPDATE_ELEMENT({style:{effects}})` |
| EFX-14 | Set shadow blur | Edit blur NumberInput (min 0) | `effect.blur` updated; default 8 | `UPDATE_ELEMENT({style:{effects}})` |
| EFX-15 | Set shadow spread | Edit spread NumberInput | `effect.spread` updated; default 0 | `UPDATE_ELEMENT({style:{effects}})` |
| EFX-16 | Set shadow color | Click color swatch → ColorInput | `effect.color` updated via inline color picker | `UPDATE_ELEMENT({style:{effects}})` |
| EFX-17 | Set shadow color hex | Edit hex input in color control | Shadow color from hex value | `UPDATE_ELEMENT({style:{effects}})` |
| EFX-18 | Set shadow opacity | Edit opacity NumberInput (0–100%) | `effect.opacity` updated; default 25% | `UPDATE_ELEMENT({style:{effects}})` |

## Blur Flyout (Layer Blur / Background Blur)

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| EFX-19 | Switch effect type | Select from type dropdown | Can switch between all 4 types | `UPDATE_ELEMENT({style:{effects}})` |
| EFX-20 | Set blur mode: Uniform | Click Uniform in SegmentedControl | `effect.mode = 'uniform'`; only for layerBlur | `UPDATE_ELEMENT({style:{effects}})` |
| EFX-21 | Set blur mode: Progressive | Click Progressive in SegmentedControl | `effect.mode = 'progressive'`; only for layerBlur | `UPDATE_ELEMENT({style:{effects}})` |
| EFX-22 | Set blur radius | Edit radius NumberInput (min 0) | `effect.radius` updated; default 12 | `UPDATE_ELEMENT({style:{effects}})` |
| EFX-23 | Mode control hidden | Background blur selected | Mode SegmentedControl not shown (only for layer blur) | — |

## Multi-Selection

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| EFX-24 | Compatible stacks | Multi-select with same effect count and types | Per-field mixed detection at each index | — |
| EFX-25 | Incompatible stacks | Multi-select with different counts or types | "Mixed" empty state shown | — |
