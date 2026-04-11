# 12 — Numeric Input (NumberInput)

> Taskflows for the NumberInput component including scrubbing, keyboard interaction, mixed state, and value pipeline.

## Click-to-Edit

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| NUM-01 | Focus input | Click on NumberInput | Input focused, text selected | — |
| NUM-02 | Commit value on Enter | Press Enter in focused input | Value parsed, validated, dispatched; input blurs | Per-property dispatch |
| NUM-03 | Commit value on blur | Click elsewhere | Value committed on blur event | Per-property dispatch |
| NUM-04 | Revert on Escape | Press Escape in focused input | Value reverted to original; input blurs | — |
| NUM-05 | Empty input reverts | Clear input and blur | Reverts to last valid value instead of setting 0 | — |

## Scrubbing

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| NUM-06 | Start scrub detection | Mousedown on NumberInput label/icon | 3px movement threshold; no scrub if released within 3px (treated as click) | — |
| NUM-07 | Enter scrub mode | Move mouse >3px after mousedown | Pointer locked (`requestPointerLock`); cursor hidden | — |
| NUM-08 | Scrub value | Mousemove during scrub | Value changes based on `movementX` × sensitivity; live preview on canvas | Per-property dispatch (throttled) |
| NUM-09 | Scrub with Shift | Shift+scrub | 10× multiplier per pixel movement | Per-property dispatch |
| NUM-10 | Scrub with Alt | Alt+scrub | 0.1× multiplier per pixel movement (fine control) | Per-property dispatch |
| NUM-11 | End scrub | Mouseup during scrub | Pointer lock released; final value committed; entire scrub = one undo step | Per-property dispatch |
| NUM-12 | Scrub boundary | Scrub to min or max | Value clamped at configured min/max bounds | — |

## Keyboard Increment

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| NUM-13 | Increment by 1 | ArrowUp in focused input | Value incremented by step (default 1) | Per-property dispatch |
| NUM-14 | Decrement by 1 | ArrowDown in focused input | Value decremented by step | Per-property dispatch |
| NUM-15 | Increment by 10 | Shift+ArrowUp | Value incremented by step × 10 | Per-property dispatch |
| NUM-16 | Decrement by 10 | Shift+ArrowDown | Value decremented by step × 10 | Per-property dispatch |
| NUM-17 | Fine increment | Alt+ArrowUp | Value incremented by step × 0.1 | Per-property dispatch |
| NUM-18 | Fine decrement | Alt+ArrowDown | Value decremented by step × 0.1 | Per-property dispatch |

## Mixed State

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| NUM-19 | Show mixed placeholder | Multi-select with differing values | Input shows "Mixed" placeholder; empty value | — |
| NUM-20 | Edit mixed value | Type new value in mixed input | All selected elements set to typed value | Per-property dispatch per element |
| NUM-21 | Scrub from mixed | Scrub from mixed state | All elements get same delta applied | Per-property dispatch per element |

## Value Pipeline

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| NUM-22 | Min/max clamping | Value entered beyond bounds | Clamped to configured min/max | — |
| NUM-23 | Step rounding | Value entered between steps | Rounded to nearest step if integer-only | — |
| NUM-24 | Unit suffix display | NumberInput with unit (e.g. %, °, px) | Unit shown after value in display mode | — |
