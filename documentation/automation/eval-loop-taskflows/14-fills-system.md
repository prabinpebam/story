# 14 — Fills System

> Taskflows for fill stack management, SolidTab, GradientTab, ImageTab, VideoTab, CodeTab, theme linking, and multi-selection behavior.

## Fill Stack Management

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| FIL-01 | Add fill layer | Click + in Fill section header | New fill pushed to start of array; defaults to `#D9D9D9` solid for first fill | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-02 | Delete fill layer | Click delete on fill row | Fill removed from array | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-03 | Toggle fill visibility | Click eye icon on fill row | Fill layer enabled/disabled | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-04 | Reorder fills (drag) | Drag fill row handle | Fill moved in stack order | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-05 | Set fill blend mode | Click blend mode button → select from overlay | Per-fill blend mode set (same 16 modes as Appearance) | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-06 | Edit fill hex input | Type in hex input on fill row | Solid fill color updated; shows disabled for gradient/image/video/code | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-07 | Edit fill opacity | Edit opacity NumberInput on fill row | Fill opacity updated (0–100%) | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-08 | Open fill flyout | Click fill swatch on row | FillFlyout opens with 5-type selector | — |
| FIL-09 | Legacy fill migration | Element with old `backgroundColor`/`fillType` | Auto-migrated to `style.fills` array on read | — |

## Fill Flyout — Header

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| FIL-10 | Switch to Custom tab | Click "Custom" tab | Shows fill type selector + active type content | — |
| FIL-11 | Switch to Libraries tab | Click "Libraries" tab | Shows saved fill styles | — |
| FIL-12 | Add fill style | Click + in flyout header | Save current fill as named style | — |
| FIL-13 | Close flyout | Click × or click outside | Flyout closes | — |
| FIL-14 | Switch fill type | Click type icon: Solid, Gradient, Image, Video, Code | Fill type changed; PropertyMemory saves and restores per-type values | `UPDATE_ELEMENT({style:{fills}})` |

## SolidTab

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| FIL-15 | Drag HSB area | Mousedown+drag on 2D saturation×brightness field | Saturation (x%) and brightness (100-y%) update in real time; fill previews live | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-16 | Drag hue slider | Mousedown+drag on horizontal rainbow bar | Hue (0–360°) updates; HSB area background tint changes | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-17 | Drag alpha slider | Mousedown+drag on horizontal alpha bar | Alpha (0–100%) updates | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-18 | Eyedropper pick | Click eyedropper button → click anywhere on screen | EyeDropper API picks color; h/s/b set from picked color; unlinks from theme | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-19 | Edit hex input | Type #RGB or #RRGGBB in hex field | Color parsed → h/s/b updated; unlinks from theme | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-20 | Edit opacity input | Edit opacity NumberInput (0–100%) | Alpha updated | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-21 | Click theme swatch | Click one of 12 theme swatches | Fill linked to theme slot: `fill.themeSlot = slotIndex` | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-22 | Click default color | Click one of 16 default palette colors | Color set; theme unlinked (`themeSlot` cleared) | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-23 | Theme link indicator | Fill has `themeSlot` set | Link icon shown; hex input shows slot label instead of value | — |
| FIL-24 | Unlink from theme | Edit hex, drag HSB, use eyedropper, or pick default color | `themeSlot` cleared; fill becomes manual color | `UPDATE_ELEMENT({style:{fills}})` |

## GradientTab

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| FIL-25 | Select gradient type | Choose from dropdown: Linear, Radial, Angular, Diamond | Gradient type changed | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-26 | Set gradient angle | Edit angle NumberInput (0–360°) | Angle updated; only for linear/angular/diamond | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-27 | Rotate angle 90° | Click rotate button | Angle incremented by 90° | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-28 | Reverse gradient | Click reverse button | Stop order reversed; positions inverted (1-pos) | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-29 | Add gradient stop | Click on empty area of gradient bar | New stop added at click position with interpolated color | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-30 | Drag gradient stop | Drag stop handle on gradient bar | Stop position updated (0–100%) | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-31 | Select gradient stop | Click stop handle | Stop selected; color picker opens for that stop | — |
| FIL-32 | Edit stop color | Use ColorPickerFlyout (SolidTab wrapper) | Stop color updated via nested color picker | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-33 | Edit stop position | Edit position NumberInput per stop | Stop position set to exact value | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-34 | Delete gradient stop | Click delete button on stop (min 2 stops) | Stop removed from gradient | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-35 | Diamond gradient storage | Diamond gradient applied | Stored as CSS comment metadata `/* diamond|angle|stops */` | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-36 | Theme-linked gradient stop | Stop has `themeSlot` | Stop handle shows accent border + glow | — |

## ImageTab

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| FIL-37 | Upload image via click | Click upload area → select file | File loaded via hidden `<input type="file">`; preview shown | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-38 | Upload image via drag | Drag image file onto upload area | File dropped and loaded; drag feedback shown | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-39 | Remove image | Click × on preview | Image cleared; `mediaAssetManager.release()` called | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-40 | Set scale mode: Fill | Click Fill button | Image crops to fill; shows position grid | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-41 | Set scale mode: Fit | Click Fit button | Image contained within bounds; shows position grid | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-42 | Set scale mode: Stretch | Click Stretch button | Image stretches to dimensions; hides position grid | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-43 | Set scale mode: Tile | Click Tile button | Image tiled across surface; hides position grid | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-44 | Set image position | Click cell in 3×3 position grid | Image anchor set (only for Fill/Fit modes) | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-45 | Set image opacity | Edit opacity NumberInput | Image fill opacity updated | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-46 | Adjust brightness | Edit brightness NumberInput (-100 to 100) | `fill.filters.brightness` updated | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-47 | Adjust contrast | Edit contrast NumberInput (-100 to 100) | `fill.filters.contrast` updated | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-48 | Adjust saturation | Edit saturation NumberInput (-100 to 100) | `fill.filters.saturation` updated | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-49 | Adjust temperature | Edit temperature NumberInput (-100 to 100) | `fill.filters.temperature` updated | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-50 | Adjust blur | Edit blur NumberInput (0–100) | `fill.filters.blur` updated | `UPDATE_ELEMENT({style:{fills}})` |

## VideoTab

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| FIL-51 | Upload video | Click or drag video file | Video loaded; hover-to-play preview | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-52 | Remove video | Click × on preview | Video cleared; media released | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-53 | Set video scale: Fill | Click Fill button | Video crops to fill bounds | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-54 | Set video scale: Fit | Click Fit button | Video contained within bounds | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-55 | Set video scale: Stretch | Click Stretch button | Video stretches (no Tile for video) | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-56 | Toggle autoplay | Click autoplay checkbox | `fill.playback.autoplay` toggled | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-57 | Toggle loop | Click loop checkbox | `fill.playback.loop` toggled | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-58 | Set video opacity | Edit opacity NumberInput | Video fill opacity | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-59 | Video adjustments | Edit brightness/contrast/saturation | Same 5 filters as ImageTab (minus temperature/blur → 3 filters) | `UPDATE_ELEMENT({style:{fills}})` |

## CodeTab

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| FIL-60 | Switch to Presets | Click Presets segment | Shows preset grid of code patterns | — |
| FIL-61 | Apply code preset | Click PresetCard | Preset code applied to fill | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-62 | Switch to Custom | Click Custom segment | Shows AI prompt + code editor | — |
| FIL-63 | Enter AI prompt | Type in prompt textarea | Describes desired pattern/animation | — |
| FIL-64 | Generate code from AI | Click Generate button | AI creates new code; preview updates live on 240×140 canvas | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-65 | Update code from AI | Click Update button | AI modifies existing code using prompt | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-66 | Toggle refine prompt | Check/uncheck Refine checkbox | Controls whether AI prompt is refined before generation | — |
| FIL-67 | Edit code manually | Type in code editor textarea | Live-updates canvas preview; monospace font | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-68 | Save as preset | Click Save as Preset button | Opens save dialog for naming custom preset | — |
| FIL-69 | Open code panel | Click ↗ button | Opens `CodeFillPanel` (expanded editor view) | — |

## Theme & Inheritance

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| FIL-70 | Inherited fill badge | Slide bg has fill from master | "Inherited" badge shown; fill row inactive at bottom of stack | — |
| FIL-71 | Override inherited fill | Edit inherited fill | Creates local override; badge changes to "Override" | `UPDATE_ELEMENT({style:{fills}})` |
| FIL-72 | Theme updates propagate | Theme color slot changed | All fills with matching `themeSlot` update automatically | — |

## Multi-Selection

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| FIL-73 | Compatible stacks | Multi-select with same fill count | Per-field mixed detection across fill layers | — |
| FIL-74 | Incompatible stacks | Multi-select with different fill counts | "Mixed" empty state shown | — |
