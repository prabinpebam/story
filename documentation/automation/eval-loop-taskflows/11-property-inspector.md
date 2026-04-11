# 11 — Property Inspector

> Taskflows for all Property Inspector sections: Position, Layout, Appearance, Text, Shape, SVG, Mask, Boolean, Slide (no selection), Placeholder, and Export. Fill, Stroke, Effects, Typography, and Color Picker have their own dedicated files (14–18).

## Position Section

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| PI-01 | Align left | Click align-left button | Selected elements aligned to leftmost edge | `ALIGN_ELEMENTS('left')` |
| PI-02 | Align center | Click align-center button | Horizontal center alignment of selection | `ALIGN_ELEMENTS('center')` |
| PI-03 | Align right | Click align-right button | Right-edge alignment | `ALIGN_ELEMENTS('right')` |
| PI-04 | Align top | Click align-top button | Top-edge alignment | `ALIGN_ELEMENTS('top')` |
| PI-05 | Align middle | Click align-middle button | Vertical center alignment | `ALIGN_ELEMENTS('middle')` |
| PI-06 | Align bottom | Click align-bottom button | Bottom-edge alignment | `ALIGN_ELEMENTS('bottom')` |
| PI-07 | Distribute horizontal | Click distribute-H button | Even horizontal spacing; disabled if selection < 3 | `DISTRIBUTE_ELEMENTS('horizontal')` |
| PI-08 | Distribute vertical | Click distribute-V button | Even vertical spacing; disabled if selection < 3 | `DISTRIBUTE_ELEMENTS('vertical')` |
| PI-09 | Set X position | Edit X NumberInput | Element moves to exact X; multi-select applies delta (preserves relative spacing) | `UPDATE_ELEMENT({id, x})` |
| PI-10 | Set Y position | Edit Y NumberInput | Element moves to exact Y; same delta behavior | `UPDATE_ELEMENT({id, y})` |
| PI-11 | Set rotation | Edit Rotation NumberInput | Rotation set to exact value | `UPDATE_ELEMENT({id, rotation})` |
| PI-12 | Rotate -90° | Click rotate button | `rotation = currentRotation - 90` per element | `UPDATE_ELEMENT({id, rotation})` |
| PI-13 | Flip horizontal | Click flip-H button | `flipX = !current` per element | `UPDATE_ELEMENT({id, flipX})` |
| PI-14 | Flip vertical | Click flip-V button | `flipY = !current` per element | `UPDATE_ELEMENT({id, flipY})` |
| PI-15 | Multi-select X shows bounding box | Select multiple elements | X input shows bounding-box min X, not individual values | — |
| PI-16 | Multi-select delta movement | Edit X/Y with multi-selection | All elements move by same delta, not to absolute position | `UPDATE_ELEMENT` per element |

## Layout Section

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| PI-17 | Set auto-size mode | Click auto-size button | Width + height grow to fit content; only for text elements | `UPDATE_ELEMENT({id, resizing: 'autoSize'})` |
| PI-18 | Set fixed-width mode | Click fixed-width button | Width fixed, height auto (default for text) | `UPDATE_ELEMENT({id, resizing: 'fixedWidth'})` |
| PI-19 | Set fixed-size mode | Click fixed-size button | Both dimensions fixed | `UPDATE_ELEMENT({id, resizing: 'fixed'})` |
| PI-20 | Resize mode buttons hidden | Non-text element selected | Layout mode row hidden (`.visible` class removed) | — |
| PI-21 | Set width | Edit W NumberInput | Width updated; if constrained, height adjusts proportionally | `UPDATE_ELEMENT({id, width, [height]})` |
| PI-22 | Set height | Edit H NumberInput | Height updated; if constrained, width adjusts proportionally | `UPDATE_ELEMENT({id, height, [width]})` |
| PI-23 | Toggle constrain proportions | Click link/link-broken button | Toggles proportional constraint; icon switches LINK ↔ LINK_BROKEN | `TOGGLE_CONSTRAIN_PROPORTIONS` |
| PI-24 | Width disabled for auto-size text | Text element in autoSize mode | W NumberInput disabled | — |
| PI-25 | Height disabled for auto-size text | Text element in autoSize mode | H NumberInput disabled | — |
| PI-26 | Mixed resizing modes | Multi-select text with different modes | No mode button active; all clickable | — |

## Appearance Section

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| PI-27 | Set opacity | Edit opacity NumberInput (0–100%) | Element opacity set (stored as 0–1 float) | `UPDATE_ELEMENT({id, opacity})` |
| PI-28 | Set blend mode | Select from dropdown (16 modes) | Blend mode applied: normal, multiply, screen, overlay, darken, lighten, color-dodge, color-burn, hard-light, soft-light, difference, exclusion, hue, saturation, color, luminosity | `UPDATE_ELEMENT({id, blendMode})` |
| PI-29 | Toggle visibility | Click eye icon in section header | Element hidden/shown; same as `Ctrl+Shift+H` | `UPDATE_ELEMENT({id, hidden})` |
| PI-30 | Set uniform corner radius | Edit radius NumberInput | All 4 corners set to same value; `cornerRadii: null` | `UPDATE_ELEMENT({id, borderRadius})` |
| PI-31 | Toggle per-corner mode | Click link/unlink button | Switches uniform ↔ per-corner; shows 4 individual inputs | — |
| PI-32 | Set top-left radius | Edit TL NumberInput (per-corner) | `cornerRadii.tl` updated; `borderRadius: null` | `UPDATE_ELEMENT({id, cornerRadii})` |
| PI-33 | Set top-right radius | Edit TR NumberInput | `cornerRadii.tr` updated | `UPDATE_ELEMENT({id, cornerRadii})` |
| PI-34 | Set bottom-left radius | Edit BL NumberInput | `cornerRadii.bl` updated | `UPDATE_ELEMENT({id, cornerRadii})` |
| PI-35 | Set bottom-right radius | Edit BR NumberInput | `cornerRadii.br` updated | `UPDATE_ELEMENT({id, cornerRadii})` |
| PI-36 | Radius hidden for non-rectangle | Ellipse, text, or line selected | Corner radius controls hidden entirely | — |
| PI-37 | Mixed per-corner values | Multi-select with differing corner radii | Each corner input independently shows "Mixed" | — |

## Text Section

> Only visible when ALL selected elements are `type === 'text'`.

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| PI-38 | Select text style | Choose from text style dropdown | Style properties applied; `textStyleId` set | `applyTextStyle()` |
| PI-39 | Unlink from style | Click unlink button | `textStyleId` cleared; properties become local | `unlinkFromStyle()` |
| PI-40 | Reset style overrides | Click reset button | Overridden props reverted to style definition | `resetToStyle()` |
| PI-41 | Change font family | Select from font family dropdown | Font family updated | `UPDATE_ELEMENT({id, fontFamily})` |
| PI-42 | Change font weight | Select from weight dropdown (100–900) | Font weight updated | `UPDATE_ELEMENT({id, fontWeight})` |
| PI-43 | Change font size | Edit font size NumberInput | Font size updated; respects style lock | `UPDATE_ELEMENT({id, fontSize})` |
| PI-44 | Open text fill flyout | Click text fill swatch | FillFlyout opens for `textFill` property | — |
| PI-45 | Edit text fill hex | Type in text fill hex input | Text fill color updated | `UPDATE_ELEMENT` via `updateTextFill()` |
| PI-46 | Edit text fill opacity | Edit text fill opacity NumberInput | Text fill opacity updated | `updateTextFillOpacity()` |
| PI-47 | Set line height | Edit line height NumberInput | Line height updated | `UPDATE_ELEMENT({id, lineHeight})` |
| PI-48 | Set letter spacing | Edit letter spacing NumberInput (%) | Letter spacing updated | `UPDATE_ELEMENT({id, letterSpacing})` |
| PI-49 | Align text left | Click text-align-left button | `textAlign: 'left'` | `UPDATE_ELEMENT({id, textAlign})` |
| PI-50 | Align text center | Click text-align-center button | `textAlign: 'center'` | `UPDATE_ELEMENT({id, textAlign})` |
| PI-51 | Align text right | Click text-align-right button | `textAlign: 'right'` | `UPDATE_ELEMENT({id, textAlign})` |
| PI-52 | Vertical align top | Click vertical-align-top button | `verticalAlign: 'top'` | `UPDATE_ELEMENT({id, verticalAlign})` |
| PI-53 | Vertical align middle | Click vertical-align-middle button | `verticalAlign: 'middle'` | `UPDATE_ELEMENT({id, verticalAlign})` |
| PI-54 | Vertical align bottom | Click vertical-align-bottom button | `verticalAlign: 'bottom'` | `UPDATE_ELEMENT({id, verticalAlign})` |
| PI-55 | Open type settings | Click ⚙ button | TypeSettingsFlyout opens (see file 17) | — |
| PI-56 | Style-locked fields blocked | Font family/weight/size etc. when textStyleId set | Controls disabled; must unlink first to edit | — |
| PI-57 | Text fill not style-locked | Change text fill color | Always editable even when style linked (driven by Color Theme) | `updateTextFill()` |
| PI-58 | Inline format from PI | Click B/I/U while in text edit mode with selection | Format applied to selection only via `execCommand`; selection restored | — |

## Shape Section

> Only visible when ALL selected elements are polygon or star `shapeKind`, and all same kind.

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| PI-59 | Set polygon sides | Edit sides NumberInput (3–20) | Polygon regenerated with new side count | `UPDATE_ELEMENT({id, params: {sides}})` |
| PI-60 | Set polygon rotation | Edit rotation NumberInput (-360° to 360°) | Polygon shape rotated | `UPDATE_ELEMENT({id, params: {rotation}})` |
| PI-61 | Set star points | Edit points NumberInput (3–20) | Star regenerated with new point count | `UPDATE_ELEMENT({id, params: {points}})` |
| PI-62 | Set star inner radius | Edit inner radius NumberInput (0.01–0.99) | Star inner radius ratio updated | `UPDATE_ELEMENT({id, params: {innerRadiusRatio}})` |
| PI-63 | Set star rotation | Edit rotation NumberInput | Star shape rotated | `UPDATE_ELEMENT({id, params: {rotation}})` |
| PI-64 | Section hidden for non-shape | Rectangle, ellipse, text, etc. selected | Shape section not rendered | — |

## SVG Section

> Only visible when ALL selected elements have `type === 'svg'`.

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| PI-65 | Set fit mode | Select from dropdown: Fit, Fill, Stretch | SVG fit mode changed | `UPDATE_ELEMENT({id, fitMode})` |

## Mask Section

> Only visible when ALL selected elements have `shapeKind === 'mask'`.

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| PI-66 | Toggle invert mask | Click invert switch | Mask inversion toggled | `SET_MASK_INVERT({id, invert})` |
| PI-67 | Enter mask shape edit | Click "Edit Mask Shape" button | Deep edit mode entered for mask shape | `SET_DEEP_EDIT({kind:'mask', elementId, mode:'shape'})` |
| PI-68 | Exit mask shape edit | Click "Done" button | Deep edit mode exited | `SET_DEEP_EDIT(null)` |
| PI-69 | Mask status warning | Single mask with degraded state | Warning label displayed | — |

## Boolean Section

> Only visible when ALL selected elements have `shapeKind === 'boolean'`.

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| PI-70 | Set boolean operation | Select from dropdown: Union, Subtract, Intersect, Exclude | Operation changed; paths recomputed | `SET_BOOLEAN_OPERATION({id, operation})` |
| PI-71 | Enter boolean operand edit | Click "Edit Operands" button | Deep edit mode entered for boolean operands | `SET_DEEP_EDIT({kind:'boolean', elementId, mode:'operands'})` |
| PI-72 | Exit boolean operand edit | Click "Done" button | Deep edit mode exited | `SET_DEEP_EDIT(null)` |
| PI-73 | Boolean status warning | Single boolean with degraded/fallback | Warning label displayed | — |

## Slide Section (No Element Selected)

### Slide Name (Master Mode)

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| PI-74 | Edit master name | Edit name TextInput | Master preset name updated | `updateName()` |

### Layout Picker (Slide Mode)

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| PI-75 | Open layout picker | Click layout picker button | Flyout with thumbnail grid of available layouts | — |
| PI-76 | Apply layout | Click layout thumbnail | Layout assigned to current slide | `CHANGE_SLIDE_LAYOUT` |
| PI-77 | Set slide width | Edit W NumberInput | Slide dimension updated | `updateDimension('width')` |
| PI-78 | Set slide height | Edit H NumberInput | Slide dimension updated | `updateDimension('height')` |

### Transition

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| PI-79 | Open transition picker | Click transition button | Flyout: None, Cross fade, Morph, Wipe, Push, Cover, Uncover | — |
| PI-80 | Select transition type | Click transition option | Transition applied | `UPDATE_SLIDE_STYLE_ASSIGNMENTS({slideTransition})` |
| PI-81 | Show inheritance badge | Transition inherited from layout/master | Badge shows source level | — |
| PI-82 | Reset to inherited | Click reset button | Override cleared, inherits from parent | clears `styleAssignments.slideTransition` |
| PI-83 | Set transition duration | Edit duration NumberInput (0–5000ms, step 50) | Duration updated | `updateSlideTransitionDuration()` |
| PI-84 | Set transition direction | Click direction in grid | Direction updated; 8-direction for wipe, 4-direction for push/cover/uncover | `updateSlideTransitionDirection()` |
| PI-85 | Direction grid hidden | Transition is None, Cross fade, or Morph | Direction grid not shown | — |

### Layout Guides (Master Mode)

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| PI-86 | Show inherited badge | Guides inherited from parent | Badge shows source; reset button available | — |
| PI-87 | Toggle margin linking | Click link/unlink button | Linked: one input for all margins; Unlinked: 4 separate inputs | `toggleLayoutGuideMarginsLinked()` |
| PI-88 | Set all margins (linked) | Edit margin NumberInput | All 4 margins set to same value | `updateLayoutGuideMargin('all')` |
| PI-89 | Set left margin | Edit left margin NumberInput (unlinked) | Left margin only | `updateLayoutGuideMargin('left')` |
| PI-90 | Set top margin | Edit top margin NumberInput | Top margin only | `updateLayoutGuideMargin('top')` |
| PI-91 | Set right margin | Edit right margin NumberInput | Right margin only | `updateLayoutGuideMargin('right')` |
| PI-92 | Set bottom margin | Edit bottom margin NumberInput | Bottom margin only | `updateLayoutGuideMargin('bottom')` |
| PI-93 | Set column count | Edit columns NumberInput (1–24) | Column count updated | `updateLayoutGuideColumnsCount()` |
| PI-94 | Set gutter | Edit gutter NumberInput | Column gutter updated | `updateLayoutGuideGutter()` |
| PI-95 | Set guide color | Click color swatch → FillFlyout | Guide color updated | `updateLayoutGuideAppearance({color})` |
| PI-96 | Set guide color hex | Edit hex input | Guide color updated | `updateLayoutGuideAppearance({color})` |
| PI-97 | Set guide opacity | Edit opacity NumberInput (0–100%) | Guide overlay opacity | `updateLayoutGuideAppearance({opacity})` |

### Background

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| PI-98 | Edit slide background | Interact with embedded FillSection | Background fill managed via fill stack | (see Fill System file 14) |

## Placeholder Section (Master Mode)

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| PI-99 | Add title placeholder | Click title palette item (H1) | Title placeholder added at default position; max 1 | `ADD_ELEMENT_TO_MASTER` |
| PI-100 | Add subtitle placeholder | Click subtitle palette item (H2) | Subtitle placeholder added; max 1 | `ADD_ELEMENT_TO_MASTER` |
| PI-101 | Add content placeholder | Click content palette item (¶) | Content placeholder added; max 1 | `ADD_ELEMENT_TO_MASTER` |
| PI-102 | Add text placeholder | Click text palette item (T) | Text placeholder added; unlimited | `ADD_ELEMENT_TO_MASTER` |
| PI-103 | Add picture placeholder | Click picture palette item | Picture placeholder added; unlimited | `ADD_ELEMENT_TO_MASTER` |
| PI-104 | Add media placeholder | Click media palette item (▶) | Media placeholder added; unlimited | `ADD_ELEMENT_TO_MASTER` |
| PI-105 | Drag placeholder to canvas | Drag palette item to canvas | `SET_DRAG_PLACEHOLDER` + `application/x-placeholder-type` dataTransfer | `SET_DRAG_PLACEHOLDER` |
| PI-106 | Limited type disabled | Title/subtitle/content already placed | Button disabled with checkmark overlay | — |
| PI-107 | Unlimited type count badge | Multiple text/picture/media placed | Badge shows current count | — |

## Export Section

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| PI-108 | Add export preset | Click + button | New preset added: `{scale:'1x', format:'png', suffix:''}` | `UPDATE_ELEMENT({exportPresets})` |
| PI-109 | Set export scale | Select scale dropdown (0.5x–4x, 512w, 512h) | Preset scale updated | `UPDATE_ELEMENT({exportPresets})` |
| PI-110 | Set export suffix | Edit suffix TextInput | Preset suffix updated | `UPDATE_ELEMENT({exportPresets})` |
| PI-111 | Set export format | Select format dropdown (PNG, JPG, SVG, PDF, WEBP) | Preset format updated | `UPDATE_ELEMENT({exportPresets})` |
| PI-112 | Remove export preset | Click – button on preset row | Preset removed from array | `UPDATE_ELEMENT({exportPresets})` |
| PI-113 | Export element | Click Export button | Element exported using all preset configs | `exportElements()` |
| PI-114 | Export to clipboard | Alt+click Export button | Element rendered to clipboard | `exportToClipboard()` |
| PI-115 | Mixed export presets | Multi-select with differing preset counts | "Mixed" empty state shown | — |
