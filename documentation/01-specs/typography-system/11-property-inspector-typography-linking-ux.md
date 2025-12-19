# Property Inspector Typography Linking — Expected UX (Strict Linking)

This document specifies the **expected user experience** for Typography in Story, focused on:
- Slide-level Typography (when nothing is selected)
- Text-level Typography Style linking (when a text object is selected)

This is a **UX spec** (what the user sees and can do). It intentionally avoids technical architecture details.

> Key UX rule: When a text object has a Typography Style applied, the style **dictates** its typography properties.
> Users change its look by either **changing the style** (affects all linked text) or **detaching** (affects only that text).

---

## 1. Terminology (User-Facing)

- **Typography Preset (Slide Typography)**: The slide’s overall typography choice (e.g., “Default”, “Modern”, etc.). It determines which text styles exist and which fonts they use.
- **Text Style (Typography Style)**: A named style a text object can use (e.g., “Title”, “Body”, “Caption”).
- **Linked text**: A text object that is currently using a Text Style.
- **Detached text**: A text object with no Text Style applied. Its typography is edited directly and does not change when Typography Preset/styles change.

---

## 2. Canvas Behavior

### 2.1 Linked Text (Text Style applied)

When a text object is linked to a Text Style:
- It visually matches the Text Style definition (font family, weight, size, spacing, alignment, fill, etc.).
- If the Typography Preset is changed for the slide (or via inheritance), the linked text updates automatically.
- If the Text Style definition is edited, the linked text updates automatically.

### 2.2 Detached Text (No Text Style)

When a text object is detached:
- Its typography remains exactly as it currently appears.
- It does **not** change if the slide Typography Preset changes.
- It does **not** change if any Text Style definitions are edited.

### 2.3 Detach must not visually change the text

Detaching a linked text object must:
- Keep the text’s appearance unchanged.
- Only change its relationship to the style going forward.

---

## 3. Property Inspector — Slide Mode (Nothing Selected)

When nothing is selected on the canvas, the Property Inspector shows **Slide Properties**.

### 3.1 Typography row (Theme section)

The Slide Properties UI includes a Typography row that:
- Shows the slide’s Typography Preset name.
- Shows inheritance/override state (Inherited vs Override).
- Shows **Heading** and **Body** font labels.

#### Required Heading/Body labels
The Typography row must always display two resolved font family names:
- **Heading:** `<Font Family>`
- **Body:** `<Font Family>`

These labels must reflect the **effective slide typography** (what the slide will actually use), even if inherited.

### 3.2 States

#### A) Inherited Typography
- A visible “Inherited” indicator (badge or subtitle).
- No reset button.
- Heading/Body labels show the inherited fonts.

#### B) Slide Override Typography
- A visible “Override” indicator.
- A visible **Reset to inherited** action.
- Heading/Body labels show the overridden fonts.

#### C) Typography unavailable or missing (edge)
If the slide cannot resolve a Typography Preset (e.g., corrupted data), the row:
- Still renders without breaking the inspector.
- Shows a safe fallback name (e.g., “Default”).
- Heading/Body labels show safe fallback values.

### 3.3 Interactions

- Clicking the Typography row (or an Edit control within it) opens the Typography editor/manager.
- After the user changes Typography and returns:
  - The preset name updates.
  - The Inherited/Override indicator updates.
  - **Heading/Body labels update immediately**.

### 3.4 Acceptance criteria (Slide Mode)

- Changing slide Typography updates the Heading/Body labels immediately.
- Reset-to-inherited reverts preset and updates Heading/Body labels.
- Inherited state shows no reset action.

---

## 4. Property Inspector — Text Selected (Typography section)

When a single text object is selected, the Property Inspector shows a Typography section.

### 4.1 Style selector row (Top of Typography section)

The first row is the Text Style selector.

It contains:
- A **Style dropdown** showing either a style name (e.g., “Title”) or “No Style”.
- A **Detach/Unlink action** visible only when a style is applied.
- An **Edit Style** action (optional UI affordance) visible only when a style is applied.

### 4.2 Behavior when a style is applied (Linked)

When the selected text is linked:
- The Style dropdown shows the current style name.
- The typography controls show the effective values.
- Typography controls are **locked/read-only** for any property governed by the style.

**Exception: Alignment overrides are allowed while linked.**
- The user may change **horizontal alignment** (`textAlign`: left/center/right/justify as supported by the UI) from the Property Inspector.
- The user may change **vertical alignment** (`verticalAlign`: top/middle/bottom) from the Property Inspector.
- These alignment changes apply immediately to the selected text element(s).
- When the user changes the Text Style via the dropdown (i.e., re-applies a style), the style **wins back** alignment: any local alignment overrides are cleared and alignment follows the newly selected style.

**Locked controls include (at minimum):**
- Font family
- Font weight
- Font size
- Line height
- Letter spacing

**Not locked (editable while linked):**
- Alignment (horizontal + vertical)
- Text fill/color

The UI must make it clear that:
- The text is controlled by a style.
- To change the look, the user must either:
  - Change the style (via dropdown), or
  - Edit the style definition (Edit Style), or
  - Detach (No Style / Unlink).

### 4.3 Changing the style (still linked)

When the user picks a different Text Style from the dropdown:
- The canvas updates immediately to the new style.
- The controls remain locked.
- The displayed values update to match the new style.

### 4.4 Detach / Unlink

When the user detaches a linked text object (via Unlink button or selecting “No Style”):
- The text appearance does not change.
- The Style dropdown becomes “No Style”.
- The typography controls become editable.

### 4.5 Behavior when no style is applied (Detached)

When the selected text is detached:
- The Style dropdown shows “No Style”.
- Typography controls are editable.
- Changes apply only to the selected text object.

### 4.6 Missing style (edge case)

If a text object references a style that no longer exists:
- The UI clearly indicates the style is missing (e.g., “Missing Style”).
- The user can detach to “No Style” without visual change.
- The inspector must not show empty/blank controls.

### 4.7 Acceptance criteria (Text Selected)

- Selecting a Text Style applies it and locks the controls.
- Unlink keeps appearance and unlocks controls.
- Editing the style updates all linked text.
- The inspector never displays unresolved tokens (it shows user-readable font names/weights/colors).

---

## 5. Multi-Selection Behavior

### 5.1 Multiple text objects selected

- If all selected text objects share the same Text Style:
  - The Style dropdown shows that style.
  - Controls behave as linked (locked).

- If selected text objects have different styles:
  - The Style dropdown shows a mixed state.
  - Direct typography controls remain disabled to avoid accidental partial edits.
  - **Exception: Alignment remains editable** (horizontal + vertical), so users can align multiple selected text objects even when their styles differ.
  - The user may set a single style from the dropdown to apply uniformly.

### 5.2 Mixed selection including non-text elements
- Typography section is hidden.

---

## 6. Inline Text Editing (Caret/range selection)

When a text object is being edited inline:

### 6.1 Linked text
- Since style dictates typography, typography controls that would create per-range overrides are not available.
- If the user attempts to apply inline typography changes (e.g., weight), the UI should:
  - Prevent the action, and
  - Encourage detaching if local formatting is desired.

### 6.2 Detached text
- Inline formatting actions may apply to a selected range of characters.
- The PI reflects the effective formatting of the selection (or shows mixed state if needed).

---

## 7. Non-Goals (Explicitly out of scope)

This UX spec intentionally does **not** include:
- Linked-with-local-overrides behavior (i.e., “Title but font size overridden”).
- Per-property override indicators and reset actions.

This spec **does** allow one narrow override case while linked:
- Alignment overrides (horizontal + vertical) are permitted.
- No override indicator UI is required for alignment overrides.

If/when local overrides are introduced, a separate UX doc should define:
- Which properties can be overridden while linked
- How overrides are indicated
- Reset-to-style behavior at property vs section level

---

## 8. Test Scenarios (UX-oriented)

### Slide mode
1. Deselect all → Typography row shows preset + Heading/Body labels.
2. Change Typography preset → Heading/Body update.
3. Reset to inherited → preset and Heading/Body revert.

### Text selected
1. Select a styled text → dropdown shows style name; controls locked; values visible.
2. Switch style → canvas updates; controls remain locked; values update.
3. Unlink → appearance unchanged; controls unlock.
4. Select detached text → dropdown “No Style”; controls editable.

### Edge
1. Delete a style used by text → text shows “Missing Style” in PI; user can detach without changing appearance.
