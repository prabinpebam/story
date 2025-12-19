# Property Inspector v2 — Control Inventory & Mixed-State Coverage Matrix

> **Part of:** [Property Inspector Specification v2.0](./00-overview.md)  
> **Related:** [Multi-Selection & Mixed State (Figma-Referenced)](./17-multi-selection-and-mixed-state.md), section specs `02`–`11`

This document is the **omission-proof checklist** for Property Inspector v2.

- **Inventory source of truth:** `src/ui/properties/*.js` (sections) and any direct DOM controls created within those sections.
- **Coverage goal:** every control listed here MUST be covered by:
  - its owning section spec (e.g. [02-position-section.md](./02-position-section.md)), and
  - the canonical mixed-state rules (where multi-selection applies) in [17-multi-selection-and-mixed-state.md](./17-multi-selection-and-mixed-state.md).

If a control is not listed here, it is either:
- not part of the Property Inspector, or
- the inventory is out of date and must be updated.

---

## 1. How to use this matrix (normative)

For each control:
1. Identify **property path(s)** it reads/writes.
2. Identify the **control type** (NumberInput, Dropdown, IconButton group, raw `<input>`, Flyout, etc.).
3. Specify **mixed display** and **edit semantics**:
   - Absolute-set (typing/picking)
   - Relative-delta (arrow/scrub)
   - Gesture undo grouping requirement (one gesture → one undo step)
4. Mark **applicability strategy** for incompatible selections:
   - Intersection-only (default)
   - Applicable-subset (explicit)
   - Hidden/section-owned
5. If current implementation is not compliant with the Figma-referenced behaviors defined in [17-multi-selection-and-mixed-state.md](./17-multi-selection-and-mixed-state.md), record it under **Notes / parity gaps**.

### 1.1 Baseline vs Target (non-breaking)

This matrix tracks two tiers:
- **Baseline (Current Story):** behavior currently allowed/expected by the shipped implementation.
- **Target (Figma-referenced parity):** recommended behavior for overlapping interactions per 17.

When a control is not Target-compliant, record:
- **Current (Baseline):** what actually happens today (so we don’t break it accidentally)
- **Recommended (Target):** what we want per 17

---

## 2. Global control-type rules (pointer)

All control-type semantics come from [17-multi-selection-and-mixed-state.md](./17-multi-selection-and-mixed-state.md).

This matrix only records:
- which control types exist for each section,
- which property paths they touch,
- and which parity gaps are known.

---

## 3. Section inventory (authoritative)

### 3.1 Position (src/ui/properties/PositionSection.js)

**Controls**
- Align buttons (IconButton group)
  - **Actions:** `ALIGN_ELEMENTS` (left/center/right/top/middle/bottom)
  - **Mixed state:** not a value display control
  - **Applicability:** section-owned
- Distribute buttons (IconButton)
  - **Actions:** `DISTRIBUTE_ELEMENTS` (horizontal/vertical)
  - **Enablement:** disabled unless `selection.length >= 3`
- X / Y (NumberInput)
  - **Props:** `x`, `y`
  - **Current display:** for multi-select, shows selection bounding box origin (`getBoundingBox`)
  - **Mixed display:** not used for x/y in multi-select (uses computed bounds)
  - **Edit semantics:** absolute set for typed value; relative-delta required for arrows/scrub for Figma-referenced parity
- Rotation (NumberInput)
  - **Prop:** `rotation`
  - **Mixed display:** uses `SelectionUtils.getMixedValue` → shows mixed when rotations differ
- Rotate -90° (IconButton)
  - **Action:** per-element `UPDATE_ELEMENT` of `rotation = current + (-90)`
  - **Parity note:** multi-select should be single undo step (requires batching)
- Flip H / Flip V (IconButton)
  - **Current behavior:** logs only (no property updates)

**Notes / parity gaps**
- **Current (Baseline):** X/Y display uses bounding-box origin, but edits set the same `x`/`y` on every selected element (can collapse the layout).
- **Recommended (Target):** treat X/Y edits as “move selection bounds to X/Y” (delta move), and preserve per-element differences for arrow/scrub (per-element start values).

---

### 3.2 Layout (src/ui/properties/LayoutSection.js)

**Controls**
- Text resizing mode buttons (IconButton group; text-only)
  - **Prop:** `resizing` (root-level)
  - **Values:** `autoSize`, `fixedWidth`, `fixed`
  - **Applicability:** only for `el.type === 'text'`
- Width / Height (NumberInput)
  - **Props:** `width`, `height`
  - **Mixed display:** not currently computed; shows first element values
  - **Edit semantics:** absolute set; constrained proportional updates when global constrain is enabled
- Constrain proportions toggle (IconButton)
  - **State:** `state.editor.constrainProportions` (global)
  - **UI:** icon switches between link / broken link

**Notes / parity gaps**
- **Current (Baseline):** W/H show first element values in multi-select; constrain uses first element aspect ratio.
- **Recommended (Target):** W/H show mixed `—` when values differ; constrain uses per-element ratios.

---

### 3.3 Appearance (src/ui/properties/AppearanceSection.js)

**Controls**
- Opacity (NumberInput)
  - **Prop:** `opacity` (stored 0–1, UI displays 0–100%)
  - **Mixed display:** uses `getMixedValue(elements, 'opacity')`
- Blend mode (Dropdown)
  - **Prop:** `blendMode`
  - **Mixed display:** uses `Dropdown.setMixed(true)`
- Corner radius (NumberInput + Button + 4× NumberInput)
  - **Props:** `borderRadius` (uniform), `cornerRadii.{tl,tr,bl,br}` (per-corner)
  - **Mode toggle:** link/unlink button toggles uniform vs per-corner UI
  - **Mixed display:** radius currently uses **first element only**
- Visibility toggle (section header action)
  - **Prop:** `hidden` (toggles based on first selected element)

**Notes / parity gaps**
- Corner radius multi-select is explicitly not parity (first element only).

---

### 3.4 Fill (src/ui/properties/FillSection.js)

This section is a **list editor**.

**List-level controls**
- “Add Fill” (section header action)
  - **Effect:** inserts a new fill at index 0, using PropertyMemory defaults
- Reorder fills (PropertyRow drag/drop)
  - **Effect:** reorder via `reorderFills(element, fromIndex, toIndex)`
- Inherited fill row (read-only)
  - **Shown when:** `element.inheritedFill` exists

**Row-level controls (per fill)**
- Visibility toggle (PropertyRow)
  - **Prop:** `style.fills[i].visible`
- Delete (PropertyRow)
  - **Effect:** remove fill at index
- Swatch trigger (div `.fill-swatch-trigger`)
  - **Edits:** opens FillFlyout; sets `fill.color/value` and/or `fill.opacity`
- Hex input (raw `<input>.fill-hex-input`)
  - **Edits:** for solid fills, commits a hex color; if linked to theme, editing unlinks
  - **Mixed display:** not implemented for multi-select
- Opacity (NumberInput)
  - **Prop:** `style.fills[i].opacity`
  - **Mixed display:** not implemented for multi-select
- Blend mode (button; raw DOM menu)
  - **Prop:** `style.fills[i].blendMode`

**Flyouts / menus**
- FillFlyout (FillFlyout)
  - **Edits:** fill type + color/gradient/image/video/code, theme slot link/unlink, opacity
- Blend mode menu (custom DOM menu)

**Notes / parity gaps**
- **Current (Baseline):** section renders list from the first selected element; edits typically overwrite list-style state across the full selection (index-based).
- **Recommended (Target):** implement list-level mixed state + row-level mixed state, and use stable row addressing (id-based rows or robust mapping).

---

### 3.5 Stroke (src/ui/properties/StrokeSection.js)

This section is a **list editor**.

**List-level controls**
- “Add Stroke” (section header action)
- “Stroke Presets” (section header action; currently logs only)
- Reorder strokes (PropertyRow drag/drop)

**Row-level controls (per stroke)**
- Visibility toggle (PropertyRow)
  - **Prop:** `style.strokes[i].visible`
- Delete (PropertyRow)
- Swatch trigger (div `.stroke-swatch-trigger`)
  - **Flyout:** StrokeSettingsFlyout
- Hex input (raw `<input>.stroke-hex-input`)
  - **Prop:** `style.strokes[i].color` (solid only)
- Opacity (NumberInput)
  - **Prop:** `style.strokes[i].opacity`
- Blend mode (IconButton + menu)
  - **Prop:** `style.strokes[i].blendMode`

**Flyouts / menus**
- StrokeSettingsFlyout (StrokeSettingsFlyout)
  - **Edits:** width, position/align, dash pattern, caps/joins, etc. (see stroke flyout spec)
- Blend mode menu (custom DOM menu)

**Notes / parity gaps**
- **Current (Baseline):** section renders list from the first selected element; edits can overwrite list-style state across the selection (index-based).
- **Recommended (Target):** same list-editor parity requirements as Fill (stable row addressing, mixed row state, safe multi-select semantics).

---

### 3.6 Effects (src/ui/properties/EffectsSection.js)

This section is a **list editor** with per-effect flyouts.

**List-level controls**
- “Add Effect” (section header action)
- “Effect Styles” (section header action)
- Reorder effects (PropertyRow drag/drop)

**Row-level controls (per effect)**
- Visibility toggle (PropertyRow)
  - **Prop:** `style.effects[i].visible`
- Delete (PropertyRow)
- Row click / open flyout
  - **Flyout:** shadow or blur flyout content

**Flyout controls (shadow effects)**
- Type dropdown (Dropdown): dropShadow / innerShadow
- Blend mode dropdown (Dropdown)
- Close (IconButton)
- X / Y (NumberInput)
- Blur / Spread (NumberInput)
- Color (ColorInput or swatch) + Opacity (NumberInput)

**Flyout controls (blur effects)**
- Type dropdown (Dropdown): layerBlur / backgroundBlur
- Mode control (SegmentedControl) (layer blur only)
- Blur radius (NumberInput)

**Notes / parity gaps**
- **Current (Baseline):** section renders list from the first selected element; edits overwrite list-style state across selection. Effects have per-row IDs, but multi-select row mapping is not yet implemented.
- **Recommended (Target):** same list-editor parity requirements as Fill/Stroke, using effect IDs for row mapping.

---

### 3.7 Typography (src/ui/properties/TextSection.js)

**Controls**
- Text style dropdown (Dropdown)
  - **Prop:** `textStyleId`
  - **Mixed display:** selection of multiple text nodes with different `textStyleId` treated as mixed style selection
- Link/unlink (IconButton)
  - **Action:** unlink from typography style (clears `textStyleId` and preserves certain properties)
- Reset-to-style (Button)
  - **Action:** clears local overrides (section-owned)
- Font family (Dropdown)
  - **Prop:** `fontFamily`
- Font weight (Dropdown)
  - **Prop:** `fontWeight`
- Font size (NumberInput)
  - **Prop:** `fontSize`
- Text fill swatch + hex + opacity (raw DOM + NumberInput)
  - **Prop:** `fill` / `color` / opacity (see section impl)
- Line height (NumberInput)
  - **Prop:** `lineHeight`
- Letter spacing (NumberInput)
  - **Prop:** `letterSpacing` (stored as percent string)
- Alignment buttons (IconButton group)
  - **Props:** `textAlign`, `verticalAlign`
  - **Linking rule:** alignment remains editable even when `textStyleId` is set
- Type settings (IconButton)
  - **Flyout:** TypeSettingsFlyout
- FillFlyout (FillFlyout)

**Notes / parity gaps**
- **Baseline:** Style-linking disables “styleable” controls, except alignment (intentional UX).
- **Baseline:** Text fill controls are implemented via a mix of raw DOM + flyouts; mixed display and “edit applies to all” semantics are not consistently enforced across all sub-controls.
- **Target:** Mixed indicators are explicit for typography controls (including text fill); edits always apply to the full selection unless explicitly labeled otherwise.
- **Target:** Mixed + relative-delta parity for numeric edits requires per-element start values (canonical requirement).

---

### 3.8 SVG (src/ui/properties/SvgSection.js)

**Controls**
- Fit mode (Dropdown)
  - **Prop:** `fitMode` (`fit` / `fill` / `stretch`)
  - **Selection:** single element only; svg only

---

### 3.9 Shape (src/ui/properties/ShapeSection.js)

Shown only for single selection of polygon/star shapes.

**Controls**
- Polygon: Sides (NumberInput) → `params.sides`
- Polygon: Rotation (NumberInput) → `params.rotation`
- Star: Points (NumberInput) → `params.points`
- Star: Inner radius ratio (NumberInput) → `params.innerRadiusRatio`
- Star: Rotation (NumberInput) → `params.rotation`

---

### 3.10 Mask (src/ui/properties/MaskSection.js)

Shown only for single selection of mask shapes.

**Controls**
- Invert (Switch)
  - **Prop/action:** `SET_MASK_INVERT` (`invert: boolean`)
- Edit mask shape (Button)
  - **Action:** toggles `SET_DEEP_EDIT` `{ kind:'mask', elementId, mode:'shape' }`
- Status row (read-only)

---

### 3.11 Boolean (src/ui/properties/BooleanSection.js)

Shown only for single selection of boolean shapes.

**Controls**
- Operation (Dropdown)
  - **Action:** `SET_BOOLEAN_OPERATION` (`union/subtract/intersect/exclude`)
- Edit operands (Button)
  - **Action:** toggles `SET_DEEP_EDIT` `{ kind:'boolean', elementId, mode:'operands' }`
- Status row (read-only)

---

### 3.12 Export (src/ui/properties/ExportSection.js)

**Controls**
- Add export preset (section header action)
- Preset rows (repeatable)
  - Scale (Dropdown) → `exportPresets[i].scale`
  - Suffix (TextInput) → `exportPresets[i].suffix`
  - Format (Dropdown) → `exportPresets[i].format`
  - Remove preset (IconButton)
- Export button (Button)
- Preview (read-only; renders an `<img>`)

**Notes / parity gaps**
- **Current (Baseline):** presets UI is sourced from the first/active selected element and preset edits write to the first/active selected element only (this MUST be explicitly communicated in the UI to avoid silent partial edits).
- **Recommended (Target):** explicitly choose an applicability strategy for multi-select (intersection-only disable, explicit “apply to all”, or explicit “active only”), and represent the scope in the UI.

---

### 3.13 Slide properties (src/ui/properties/SlideSection.js)

This is not element multi-selection; it targets slide/master objects.

**Controls**
- Name (TextInput) (master mode)
  - **Prop:** `master.name`
- Master preset (Button + MasterPresetFlyout)
  - **Action:** apply preset (flyout-owned)
- Layout picker (Button + Flyout + hidden Dropdown)
  - **Prop:** `slide.layoutId`
- Slide/master width & height (NumberInput)
  - **Props:** `width`, `height` on slide/master
- Theme → Colors
  - Edit colors (Button) opens panel
  - Reset to inherited (Button)
  - Mode toggle (SegmentedControl): light/dark (dispatches `SET_COLOR_MODE`)
  - Theme swatches (ThemeSwatches) display-only
- Theme → Typography
  - Edit typography (Button) opens panel
  - Reset to inherited (Button)
  - Heading/body font name display-only
- Layout guides (master mode)
  - Reset to inherited (Button)
  - Link margins (Button)
  - Margin inputs (NumberInput): all or left/top/right/bottom depending on link state
  - Columns count (NumberInput)
  - Gutter (NumberInput)
  - Color swatch + hex (raw DOM) + opacity (NumberInput)
  - FillFlyout for guide color
- Background (FillSection)
  - Delegated list editor; see Fill inventory above

---

### 3.14 Placeholders palette (src/ui/properties/PlaceholderSection.js)

Shown only in master mode for layout masters.

**Controls**
- Placeholder type tiles (custom DOM)
  - Click: adds placeholder element
  - Drag: sets drag payload + dispatches `SET_DRAG_PLACEHOLDER`
  - Disabled/enabled state based on maxCount
  - Count badge + checkmark overlay (visual indicators)

---

## 4. Inventory maintenance rules

- This file MUST be updated whenever a new control is added to any `src/ui/properties/*Section.js` file.
- If a section spec changes UI/controls, it MUST be reconciled with this inventory.
- Parity gaps should be tracked here and in [13-gaps-and-roadmap.md](./13-gaps-and-roadmap.md).
