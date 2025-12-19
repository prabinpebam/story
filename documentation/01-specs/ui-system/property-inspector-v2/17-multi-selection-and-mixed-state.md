# Property Inspector v2 — Multi-Selection & Mixed State (Figma-Referenced)

> **Part of:** [Property Inspector Specification v2.0](./00-overview.md)  
> **Related:** [Interaction Patterns](./12-interactions.md), [Typography Section](./08-typography-section.md), [Theme Linked Properties](./16-theme-linked-properties.md), [Control Inventory & Coverage Matrix](./18-control-inventory-and-coverage-matrix.md)  
> **Primary goal:** Figma-referenced parity for multi-selection + mixed-state editing (display, edit semantics, undo behavior) **only where Story and Figma offer a comparable interaction**.

---

## 0. Figma-referenced parity contract (normative)

“Parity” in this spec refers to **Figma-referenced parity**:
- When Story and Figma both have a comparable control and interaction, Story SHOULD match Figma’s **UI state**, **edit semantics**, and **gesture-level undo** for the same scenario.
- When Story has Story-specific features or intentionally different behavior, this spec does **not** attempt to force Figma equivalence; it requires that the behavior be **internally consistent**, clearly specified, and testable.

Concretely, Figma-referenced parity here means:
- The **display state** (“Mixed”, “—”, indeterminate) matches Figma for the same selection scenario.
- The **edit semantics** match Figma for the same interaction (typing, arrows, scrub/drag, toggles, dropdown picks).
- The **undo semantics** match Figma at the gesture level (one gesture = one undo step).

Because Figma behavior can vary by property type, this document defines a **canonical model** and then property-type-specific rules.

### 0.1 Parity verification requirement

Any implementation claiming compliance MUST be validated against Figma **for comparable interactions** using a maintained “parity matrix” of scenarios:
- **Selection shape:** 1 item, 2 items same type, 2 items different type, N items
- **Value state:** uniform / mixed / unset
- **Interaction:** type+commit, arrow step, scrub/drag, toggle click, dropdown pick

This spec includes a “Test Scenarios” section; implementers MUST keep it in sync with the parity matrix.

If Story intentionally diverges from Figma for an overlapping feature, the divergence MUST be documented as a **Story-specific exception** in the owning section spec and tracked in [13-gaps-and-roadmap.md](./13-gaps-and-roadmap.md) (as a deliberate divergence, not an untracked gap).

### 0.2 Implementation compatibility (non-breaking)

This document describes a **target model** for multi-selection + mixed-state behavior.

To avoid breaking existing implementations, we define two compliance levels:

- **Baseline (Current Story):** what the app may do today without being considered “incorrect” in this spec. Baseline behavior MUST be internally consistent and MUST NOT silently apply partial edits.
- **Target (Figma-referenced parity):** the recommended behavior for overlapping interactions, as defined in the canonical model below.

If a section/control is not yet Target-compliant, it MUST:
- be listed as a **parity gap** in [18-control-inventory-and-coverage-matrix.md](./18-control-inventory-and-coverage-matrix.md), and
- specify its current multi-select behavior in the owning section spec.

#### 0.2.1 Baseline rules (Current Story)

Baseline allows the following patterns (they are common in the current PI codebase):
- **Single-source display:** in multi-selection, a section may render values derived from the first selected element or a computed aggregate (e.g., bounding box) rather than a mixed indicator.
- **Absolute-set on multi-selection:** typing/picking values may set the same value onto all selected elements (even if it collapses differences).
- **List editors:** list-style controls (fills/strokes/effects) may display the first selected element’s list, and edits may overwrite the entire list onto all selected elements.
- **Partial application is forbidden unless explicit:** if an edit applies to only a subset of the selection, UI MUST clearly communicate “partial” and MUST NOT do it silently.

Baseline does NOT allow:
- “Accidental partial edits” (only first element changes) unless explicitly presented as “applies to first/active only.”
- Controls claiming “mixed-safe” behavior when they actually mirror the first element.

#### 0.2.2 Target rules (Figma-referenced parity)

All requirements in Sections 3–9 describe the Target model unless explicitly labeled as Baseline.

---

## 1. Scope

This spec defines how Property Inspector behaves when **multiple elements are selected**, including:
- Value display (uniform vs mixed vs unset)
- Editing rules per control type (absolute set vs relative delta)
- Applicability rules when selection includes incompatible element types
- Structured properties (objects/arrays) such as corner radii, fills, effects

### 1.1 In scope controls / patterns
- Numeric inputs (`NumberInput`)
- Dropdowns (`Dropdown`)
- Text inputs (string fields)
- Sliders (if present; same semantics as scrubbable numeric)
- Toggles / switches (boolean)
- Segmented controls / icon-button groups
- Color controls (swatch + model + opacity where applicable)
- List editors (fills/strokes/effects) including per-row mixed state

### 1.2 Out of scope
- Inline text range selection (“mixed within a single text element”) — governed by text editing specs
- Which sections show/hide for a given selection (owned by each section spec)

---

## 2. Terminology

- **Selection**: `state.editor.selectedElementIds`.
- **Applicable**: a property can be meaningfully read/written for an element.
- **Uniform**: all applicable selected elements share the same effective value.
- **Mixed**: 2+ distinct effective values exist across the selection.
- **Unset**: a property is `undefined`/`null` for all applicable selected elements.
- **Indeterminate**: boolean UI state representing mixed true/false.
- **Gesture**: a user action sequence treated as a single operation for undo (e.g., scrub drag from mouse-down to mouse-up).

---

## 3. Display State Model (canonical)

Every control MUST compute a display state from the selection.

### 3.1 Canonical states

| State | Meaning | Canonical UI |
|------|---------|--------------|
| `uniform` | All applicable values are equal | Show the value normally |
| `mixed` | Values differ across selection | Show mixed indicator (“Mixed” or “—”) |
| `unset` | All applicable values are undefined/null | Show empty placeholder (not mixed) |
| `not-applicable` | Property cannot apply to this selection | Disable or hide control (section-owned) |

### 3.2 Applicability strategies (selection contains incompatible types)

Figma uses property-specific logic. Story MUST explicitly choose one of these strategies per control:

1) **Intersection-only (default)**
- If the property does not apply to every selected element, treat as `not-applicable`.
- Rationale: avoids partial edits and matches many Figma panels.

2) **Applicable-subset allowed (opt-in, explicit)**
- Control remains enabled if property applies to at least one selected element.
- Edits apply only to the applicable subset.
- UI MUST clearly indicate partial application (e.g., tooltip or label suffix “(partial)”); do not silently partial-apply.

3) **Section hidden / “Mixed selection” messaging (section-owned)**
- Some sections may hide entirely when selection includes non-supported types.

**Current Story baseline:** most sections behave like intersection-only.

### 3.3 Canonical resolution algorithm (intersection-only)

Given:
- `elements`: selected element objects
- `prop`: property path (supports dot notation via `SelectionUtils.getMixedValue`)
- `isApplicable(el)`: predicate for applicability

Resolve:
1. `applicable = elements.filter(isApplicable)`
2. If `applicable.length === 0`: `not-applicable`
3. If `applicable.length !== elements.length`: `not-applicable`
4. `{ value, mixed } = getMixedValue(applicable, prop)`
5. If `mixed`: `mixed`
6. Else if `value === undefined || value === null`: `unset`
7. Else: `uniform`

**Implementation alignment:**
- `SelectionUtils.getMixedValue(elements, prop)` returns `{ value, mixed }`.
- `SelectionUtils.getUniqueValues(elements, prop)` exists for future “Mixed (N)” display.

### 3.4 Equality rules for mixed detection

Mixed detection MUST treat values as equal when:
- primitives are strictly equal
- objects/arrays are deeply equal

**Current implementation detail:** `SelectionUtils.getMixedValue()` uses `JSON.stringify` for deep equality.
- This is acceptable for parity only if property objects have stable key order.
- If not stable, parity requires replacing it with a stable deep-equality.

---

## 4. Edit Semantics Model (canonical)

Figma differentiates between **absolute set** vs **relative delta** operations.

### 4.1 Absolute-set interactions
Absolute set overwrites each applicable element with the same final value:
- typing a number and committing
- picking a dropdown option
- clicking a segmented button
- choosing a color

### 4.2 Relative-delta interactions
Relative delta preserves differences and applies a delta to each element’s own start value:
- numeric arrow up/down
- scrubbing / drag-to-adjust
- sliders (if present)

**Parity rule:** In `mixed` state, relative-delta MUST remain relative.

### 4.3 Undo/redo grouping

For parity:
- Each gesture produces exactly one undo step.
- Multi-selection edits MUST not create one undo entry per element.

**Current Story mechanism:**
- transient updates: `skipHistory: true`
- commit update: `skipHistory: false`
- UI interaction lifecycle: `UI_INTERACTION_START` / `UI_INTERACTION_END`

**Required enhancement for parity:** History must support grouping/batching so multi-select commits remain single-step.

---

## 5. Control-Type Specs

### 5.1 Numeric input (`NumberInput`)

**Current primitives (ground truth):**
- Mixed display: `NumberInput.setMixed(true)` → placeholder `—` + `.mixed` class
- Scrub gesture: pointer lock, emits transient updates via `onChange(value, isTransient)`
- Keyboard deltas: ArrowUp/ArrowDown; Shift increases step; Alt reduces step
- Escape reverts to `initialValue`

#### 5.1.1 Display
- `uniform`: show formatted numeric value (with units).
- `mixed`: show placeholder `—` (mixed styling).
- `unset`: show empty input (no mixed styling).
- `not-applicable`: disable input; show placeholder `—`.

#### 5.1.2 Parse/format rules
- Units are display-only and MUST be ignored when parsing.
- Invalid numeric text MUST NOT silently coerce to 0 on commit for multi-selection; it must either revert to previous display or show validation state.

**Note:** Current `NumberInput.setValue()` coerces NaN to 0. Parity requires tightening this behavior.

#### 5.1.3 Editing semantics (Figma-referenced)

| Interaction | `uniform` | `mixed` | `unset` |
|------------|-----------|---------|---------|
| Type + commit | Absolute set on all applicable | Absolute set on all applicable | Absolute set on all applicable |
| ArrowUp/Down | Relative delta | Relative delta | Relative delta from default |
| Scrub/drag | Relative delta from gesture-start | Relative delta from gesture-start | Relative delta from default |

“Default” here is property-specific and defined by the owning section (e.g., opacity default = 100%).

#### 5.1.4 Transient vs committed
- During scrubbing: call onChange with `isTransient=true` and dispatch with `skipHistory: true`.
- On mouse-up: emit one final commit with `skipHistory: false`.
- On Enter/Blur: commit with `skipHistory: false`.

#### 5.1.5 Mixed + relative delta: required implementation behavior

To satisfy Figma-referenced parity in multi-selection mixed state, scrubbing/arrow MUST apply:
$$\text{newValue}_i = \text{startValue}_i + \Delta$$

This requires capturing per-element start values at gesture-start.

---

### 5.2 Dropdown (`Dropdown`)

**Current primitives (ground truth):**
- Mixed display: `Dropdown.setMixed(true)` → label “Mixed” + `.mixed` and `.placeholder` classes
- Menu highlights option based on `this.value` (so mixed-state must avoid highlighting a stale value)

#### 5.2.1 Display
- `uniform`: show selected option label.
- `mixed`: show “Mixed”.
- `unset`: show placeholder if provided.
- `not-applicable`: disable.

#### 5.2.2 Editing semantics
- Picking an option applies absolute set to all applicable elements.
- In mixed state, the menu MUST show **no selected option** (no highlight).

---

### 5.3 Text input (string)

Examples: URL, name fields, label text (not contentEditable), etc.

#### 5.3.1 Display
- `uniform`: show value.
- `mixed`: show placeholder `—` (or “Mixed”), and do not show a concatenated value.
- `unset`: show empty.

#### 5.3.2 Editing semantics
- Typing + commit performs absolute set on all applicable elements.
- Escape reverts to pre-edit display.

---

### 5.4 Boolean toggles (Switch / icon toggle)

#### 5.4.1 Display
- `uniform true`: on
- `uniform false`: off
- `mixed`: indeterminate UI (aria `mixed`)
- `not-applicable`: disabled

#### 5.4.2 Editing semantics (Figma-referenced)
- Click when `mixed` → set all to true
- Click when `uniform true` → set all to false
- Click when `uniform false` → set all to true

---

### 5.5 Segmented controls / icon-button groups

Examples: text alignment, vertical alignment, distribution, corner mode.

#### 5.5.1 Display
- `uniform`: highlight the active option
- `mixed`: highlight none
- `not-applicable`: disable entire group

#### 5.5.2 Editing semantics
- Click performs absolute set on all applicable elements.

---

### 5.6 Color controls (swatch + model)

#### 5.6.1 Display
- `uniform`: show swatch and model/hex.
- `mixed`: show placeholder `—` for the text value; swatch may show the first value but must visually indicate mixed.

#### 5.6.2 Editing semantics
- Picking a color is absolute set.
- Dragging within a color picker is transient; release is committed.

---

### 5.7 List editors (fills / strokes / effects)

Figma-referenced parity depends heavily on list behavior. Story MUST support the following conceptual model.

#### 5.7.1 Two levels of mixed state
1) **List-level mixed**: the list shape differs across selection (different length, different ordering, different types)
2) **Row-level mixed**: a given row exists across selection but properties differ (e.g., opacity differs)

#### 5.7.2 Canonical row addressing (required for Figma-referenced parity)

To safely apply row edits across multiple elements, a row MUST be addressable consistently.

Parity requires one of:
- Stable per-row IDs shared across elements (preferred), OR
- A deterministic “row key” scheme that maps across elements (e.g., by index only if list shapes are guaranteed identical)

**Current Story reality:**
- Effects have `effect.id`.
- Fills are typically updated by index.

If fills can diverge in count/order, parity requires migrating fills to stable IDs or implementing a robust mapping layer.

#### 5.7.3 Display rules
- If list-level is uniform: render the list normally; each row can still be mixed at the property level.
- If list-level is mixed: the section MUST show a mixed state that does not lie.
  - Allowed UI patterns (choose per section):
    - show “Mixed” summary row with limited actions (add/remove/apply preset)
    - show only actions that can safely apply across all selected (e.g., “Add fill to all”)

#### 5.7.4 Editing rules
- Row property edits:
  - If a row can be mapped across all elements: apply edits to that mapped row.
  - If a row cannot be mapped: disable row editing and expose only safe list-level actions.
- Add row:
  - Adds a new row to all selected elements at the same relative position (top/bottom per section convention).
- Remove row:
  - Removes the mapped row across all selected elements.
- Reorder:
  - Only allowed when list shape is uniform across selection.

#### 5.7.5 Undo
- List edits are gestures and must be single-step undo.

---

## 6. Typography-specific multi-selection rules

### 6.1 Text style dropdown
- Different `textStyleId` values → dropdown shows `mixed`.
- Selecting a style applies it to all selected text elements.

### 6.2 Alignment remains editable (explicit parity requirement)

Alignment controls remain editable for multi-selection of text elements even when:
- `textStyleId` differs across selection
- text is linked to typography styles

This is already aligned with Story’s typography-linking UX.

---

## 7. Accessibility + keyboard parity

### 7.1 Mixed indicators
- Mixed state must be perceivable (placeholder + style) and should not rely on color alone.

### 7.2 Focus behavior
- Tab navigation must traverse controls deterministically.
- Escape cancels in-progress edits without mutating selection state.

### 7.3 Indeterminate toggles
- Indeterminate state must use `aria-checked="mixed"`.

---

## 8. Acceptance Criteria

This spec uses two acceptance tiers to avoid breaking existing implementations.

### 8.1 Baseline acceptance (Current Story, non-breaking)
- Multi-selection edits MUST be internally consistent (no “sometimes first, sometimes all”).
- A control MUST NOT silently apply an edit to only the first/active element unless the UI explicitly communicates that scope.
- If a section uses first-element or aggregate display in multi-select, it MUST NOT claim mixed indicators that it does not actually compute.
- List editors MAY mirror the first selected element’s list, but this MUST be documented in the owning section spec and listed as a parity gap in 18.

### 8.2 Target acceptance (Figma-referenced parity for overlapping interactions)
- Numeric fields show `—` when mixed; empty when unset.
- Dropdowns show “Mixed” when mixed and do not highlight a stale selected option.
- Segmented controls show no active option when mixed.
- Toggles show indeterminate when mixed.
- List editors provide truthful mixed-list presentation (no fake “first item only” display).
- Absolute-set operations overwrite all applicable elements.
- Relative delta operations preserve per-element differences in mixed state.
- Mixed toggle click follows the toggle rule defined in Section 5.4.
- A single gesture across multi-selection produces a single undo step (no per-element undo spam).

---

## 9. Test Scenarios (parity matrix starter)

### 9.1 Scalar numeric (opacity)
- Select 2 rectangles with different opacity → field shows `—`.
- ArrowUp → both increase by +1% relative.
- Type `50` + Enter → both set to 50%.

### 9.2 Segmented (text align)
- Select 2 text boxes with different align → no button highlighted.
- Click “Center” → both become centered.

### 9.3 Toggle (visibility)
- Select layers with mixed visibility → indeterminate.
- Click toggle → all visible.

### 9.4 Dropdown (blend mode)
- Select 2 shapes with different blend mode → dropdown shows “Mixed”.
- Open menu → no option highlighted.
- Choose “Multiply” → both set to multiply.

### 9.5 List editor (fills)
- Select 2 shapes with different fill stack counts → list-level mixed state.
- “Add fill” → adds a fill to both.
- Reorder is disabled unless fill list shapes match.

### 9.6 Figma benchmark protocol (how to verify)

This repository cannot directly observe or automate Figma’s UI, so this spec defines a repeatable **benchmark protocol** to validate the Target behaviors for overlapping interactions.

**Benchmark setup (recommended):**
- Figma desktop or web (record exact version/date)
- Same OS as Story testing where possible
- Create a small benchmark file with:
  - 3 rectangles (different fills, opacity, blend modes)
  - 2 text nodes (different font sizes, alignment, styles)
  - 2 frames/groups (to observe applicability differences)

**How to record results:**
- For each scenario below: capture a short screen recording or 2 screenshots (before/after)
- Record: selection contents, displayed UI state, interaction performed, resulting values, and undo stack behavior

**Benchmark matrix (fill in during manual run):**

| Control type | Property | Selection | Display in Figma | Edit in Figma | Undo in Figma | Notes |
|---|---|---|---|---|---|---|
| NumberInput | Opacity | 2 rects, different | TBD | ArrowUp / scrub / type commit | TBD | |
| Dropdown | Blend mode | 2 rects, different | TBD | pick option | TBD | |
| Segmented | Text align | 2 texts, different | TBD | click Center | TBD | |
| Toggle | Visibility | mixed | TBD | click | TBD | |
| List editor | Fills | same stack | TBD | change row opacity | TBD | |
| List editor | Fills | different stack | TBD | add fill | TBD | |

**How this maps to Story:**
- If Figma behavior matches the Target model in this doc, mark Story as a **parity gap** until implemented.
- If Figma behavior differs or is ambiguous, record it as a **Story-specific exception** (owning section spec + 13 roadmap).

---

## 10. Implementation mapping (non-normative, current Story)

### 10.1 Existing primitives
- Mixed detection: `SelectionUtils.getMixedValue()` / `getUniqueValues()`
- Mixed display:
  - `NumberInput.setMixed(true)` uses placeholder `—`
  - `Dropdown.setMixed(true)` uses label “Mixed”
- Transient updates: `skipHistory: true` + `UI_INTERACTION_START/END`

### 10.2 Known gaps to reach parity
- Per-element relative delta for multi-selection scrubbing/arrow operations (requires capturing per-element start values)
- History grouping for multi-selection commit (single undo step)
- Robust list-row mapping for fills (stable IDs or mapping layer)
- Stricter numeric parsing/validation (avoid coercing invalid text to 0)
