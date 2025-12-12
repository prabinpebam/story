# Slide Master Preset — Comprehensive UX + UI Specification

**Version:** 1.0  
**Last Updated:** December 12, 2025  
**Status:** Draft (Implementation-aligned)

---

## 0. Why this spec exists

This document defines the end-to-end UX for **Slide Master Presets**: creating, editing, applying, overriding, importing/exporting, and collaborating.

This spec is explicitly aligned with:
- The authoritative terminology in [documentation/01-specs/slides/TERMINOLOGY-AND-ARCHITECTURE.md](TERMINOLOGY-AND-ARCHITECTURE.md)
- Current Master Mode interaction rules in [documentation/01-specs/slides/master-mode-interaction.md](master-mode-interaction.md)
- Placeholder behavior in [documentation/01-specs/slides/master-placeholder-integration.md](master-placeholder-integration.md)
- Product principles in [documentation/00-product/principles.md](../00-product/principles.md)

---

## 1. Principles (non-negotiable)

### 1.1 Architectural principles
- **Strict separation:** Slide Master Presets must **never embed** colors or typography definitions.
  - They only **reference** `colorThemeId` and `typographyStyleId` (pointers).
- **Cascading overrides:** Master → Layout → Slide → Element (priority order).
- **Single editing engine:** Master Mode uses the same selection/manipulation/PI logic as Edit Mode via the “active container” abstraction.

### 1.2 UX principles
- **Small, incremental mental model:** Users should not need to understand data model jargon to be productive.
- **Safe-by-default:** Editing a master should clearly communicate blast radius.
- **No surprise loss:** Layout changes should preserve content when a compatible placeholder exists.
- **No “mystery styling”:** The UI must communicate what is inherited vs overridden.

### 1.3 Design system principles
- Only use existing design system primitives: existing buttons, dropdowns, panels, grid rows, and global tokens.
- Avoid new one-off components; prefer variants.
- Dark and light themes must remain correct (no hardcoded colors).

---

## 2. Definitions (user-facing and internal)

### 2.1 User-facing definitions
- **Master (Slide Master Preset):** A reusable “theme + structure package” that defines global layout templates and shared background elements.
- **Layout:** A template slide within a master (Title Slide, Title + Content, Two Column…).
- **Placeholder:** A template element that appears on slides and is filled with user content (Title, Body, Image, etc.).

### 2.2 Internal system constraints (implementation-aligned)
- Masters and layouts live in `state.slideMasterPresets`.
- A slide references the applied layout via `slide.layoutId`.
- Layouts reference their parent master via `layout.parentMasterId`.
- Colors/typography are assigned through style assignment references (IDs), not embedded values.

---

## 3. Goals / Non-goals

### 3.1 Goals
- Create, edit, and manage multiple Slide Master Presets in a single presentation.
- Support layout creation and placeholder editing.
- Apply a layout (and thereby its master) to slides, preserving content where possible.
- Enable overrides for color and typography at master/layout/slide/element levels.
- Enable sharing via import/export packages that bundle dependencies.

### 3.2 Non-goals (explicitly out of scope)
- Full PowerPoint parity for every master feature.
- Per-element permissioning beyond existing collaboration primitives.
- Advanced template “auto-layout” / responsive constraints (can be a later phase).

---

## 4. Information architecture (where users find it)

### 4.1 Entry points
- **Menu:** View → Master → Slide Master
- **Keyboard:** `Shift + Ctrl + M`
- **From slide list (context):** Right-click slide thumbnail → Change Layout / Change Master

### 4.2 Core surfaces
- **Master View (Mode):** dedicated editing mode for masters/layouts.
- **Slide List sidebar:** shows masters + layouts in Master View; shows slides in Edit View.
- **Property Inspector:**
  - In Master View: edits the active master/layout and its elements.
  - In Edit View: slide-level settings (layout selection, overrides) when nothing is selected.

---

## 5. Primary user journeys (task flows)

Each task flow is written as: **Trigger → Steps → Result → Undo/redo behavior → Failure states**.

### 5.1 Enter Master View
**Trigger**
- User selects View → Master → Slide Master

**Steps**
1. App switches `editor.mode` to `master`.
2. App shows a persistent **Master Mode indicator** (orange border overlay per existing spec).
3. Sidebar switches from “Slides list” to “Masters + Layouts list”.
4. Active container becomes the current master or layout (depending on selection).

**Result**
- User can edit the master structure and elements.

**Undo/redo**
- Mode switch itself is not an undoable action.
- All edits inside master mode are undoable.

**Failure states**
- If no master exists, a default master must be created and selected.

---

### 5.2 Create a Slide Master Preset
**Trigger**
- User clicks “Add Master” in Master View.

**UI**
- Modal/dialog (existing dialog style):
  - Create new master: ( ) Blank  ( ) Duplicate existing  ( ) Import from file
  - Master name input
  - Optional: select initial Color Theme preset and Typography preset (dropdowns)

**Steps**
1. User chooses creation method.
2. User confirms.
3. System creates a new master entry in `slideMasterPresets`.
4. System creates a minimal default set of layouts (at least one), or prompts to add layouts.

**Result**
- New master appears in sidebar and becomes active.

**Undo/redo**
- Creating a master is undoable.

**Failure states**
- Import fails (invalid file) → show non-blocking error toast + keep dialog open.

---

### 5.3 Manage layouts within a master
**Trigger**
- User clicks “Insert Layout” in Master View.

**Steps**
1. User chooses base: Blank / Duplicate existing layout.
2. User names the layout.
3. Layout appears under the active master.

**Result**
- Layout becomes selectable and editable.

**Undo/redo**
- Insert/duplicate/rename/delete layouts must be undoable.

**Failure states**
- Cannot delete last layout (block with clear message).

---

### 5.4 Edit master-level elements (logo/footer/background)
**Trigger**
- User selects the master node (not a layout) and edits the canvas.

**Interaction model**
- In Master Mode, master elements behave like normal elements: selectable, movable, resizable.
- Master elements are rendered in all layouts/slides that inherit from that master.

**Result**
- Global elements update across dependent layouts/slides.

**Safety affordances**
- Master Mode indicator + “Theme Master” breadcrumb in the UI header.

---

### 5.5 Add placeholders to a layout
**Trigger**
- In Master Mode (layout selected), user uses “Insert Placeholder”.

**Steps**
1. User chooses placeholder type (Title, Body, Image, etc.).
2. User drags to place and size.
3. Placeholder appears on the layout.

**Result**
- New slides created from this layout will include the placeholder.

**Undo/redo**
- Placeholder creation and edits are undoable.

**Dependencies**
- Must follow placeholder data model and lifecycle rules in master-placeholder integration spec.

---

### 5.6 Apply a layout to slides (and preserve content)

**Trigger**
- In Edit Mode, user changes a slide’s layout from the Slide PI.

**Steps**
1. User opens Layout dropdown.
2. User selects a new layout.
3. System reconciles placeholders:
   - Preserve content when placeholder types match.
   - Add new placeholders as empty.
   - Remove placeholders that no longer exist.
   - Keep non-placeholder slide elements.

**Result**
- Slide changes to new layout without losing meaningful content.

**Undo/redo**
- Layout change is undoable.

**Failure states**
- New layout missing required master → block selection and show warning.

---

### 5.7 Override Color Theme / Typography at master, layout, and slide levels

**Trigger**
- User opens Color Theme manager or Typography Style manager.

**Rules**
- Overrides are stored at the relevant level:
  - Master: updates master style assignments / referenced IDs.
  - Layout: layout-level style assignment / referenced IDs.
  - Slide: slide-level style assignment / referenced IDs.

**UX requirements**
- UI must show whether the current selection is inherited or overridden.
- “Reset to inherited” must be available where overrides exist.

**Dependencies**
- Must remain consistent with cascade behavior used by style resolution.

---

### 5.8 Detach / Reset behavior for inherited elements

**Baseline rule (aligned with existing specs)**
- In a child context (layout inheriting from master, slide inheriting from layout), inherited elements may be:
  - **Non-interactive** (visual only) in layout view for master elements (per master-mode-interaction current decision).
  - **Editable content** for placeholders on slides (per placeholder integration).

**User actions**
- For slide placeholders:
  - Reset to Master: clears overrides.
  - Detach from Master: converts placeholder to regular element.

---

### 5.9 Export / Import Slide Master Preset packages (.strmaster)

**Export trigger**
- In Master View, user chooses Export Master Preset.

**Export content**
- `manifest.json`
- `master.json`
- `layouts/*.json`
- Referenced `theme.json` (if custom)
- Referenced `typography.json` (if custom)
- `assets/*` for referenced images/videos

**Import trigger**
- “Import Master” in the create master dialog.

**Import rules**
- IDs should be re-namespaced or conflict-resolved safely.
- Missing dependencies (fonts/assets) should degrade gracefully with warnings.

---

## 6. Detailed UI specification (aligned with current app)

### 6.1 Master View layout
- **Left sidebar:**
  - Master list (multiple masters)
  - Under each master: layout list
  - Active item highlight
- **Canvas:** edits the active container
- **Property Inspector:** context-aware

### 6.2 Mode indicator
- An orange border overlay around the workspace (pointer-events none), per master-mode-interaction spec.
- Title/breadcrumb in the header:
  - “Theme Master” when editing master
  - “Layout: {layoutName}” when editing a layout

### 6.3 Property Inspector behavior
- With no selection:
  - In Edit Mode: Slide properties + layout selection + theme/typography overrides
  - In Master Mode: master/layout properties (name, referenced theme/typography IDs)
- With element selection:
  - Same element editing sections as Edit Mode
  - Inherited elements in child contexts must be clearly locked and explain why

### 6.4 Sidebar interactions
- Right-click master:
  - Rename
  - Duplicate
  - Export
  - Delete (disabled if in use without confirmation)
- Right-click layout:
  - Rename
  - Duplicate
  - Delete
  - Set as default layout (optional if supported)

---

## 7. Critique of current doc set + improvements (gaps & resolutions)

### 7.1 Terminology drift risk
**Observation**
- Some docs refer to “masterId”, “layoutId”, and sometimes “masters” collection vs `slideMasterPresets`.

**Risk**
- Implementation may diverge or duplicate data.

**Improvement**
- Standardize: “Master = slideMasterPreset”, “Layout = layout master” and store-level names in one authoritative mapping section.

---

### 7.2 Inherited element editability inconsistency
**Observation**
- master-mode-interaction: inherited elements in layout view are non-interactive.
- placeholder integration expects placeholders to be editable on slides and allow overrides.

**Risk**
- Users may expect to select master elements while editing a layout.

**Improvement**
- Keep current decision (non-interactive in layout view) but add:
  - A clear “Editing Layout (Master elements locked)” hint.
  - A quick jump to “Edit Master” when clicking a locked inherited element.

---

### 7.3 Content preservation edge cases
**Risk**
- Layout change mapping by placeholder type can fail when there are multiple placeholders of the same type (e.g., two images).

**Improvement**
- Define PowerPoint-like behavior: **auto-preserve whenever the mapping is deterministic; prompt only on true ambiguity or potential loss**.

**Matching strategy (deterministic, stable)**
1) **Exact identity match**: preserve content when the source and target placeholders share the same stable identity (e.g., `masterElementId` / consistent placeholder key).
2) **Type + role match (if available)**: if placeholders have roles (e.g., `image.left` / `image.right`, `body.primary` / `body.secondary`), match by `(placeholderType, role)`.
3) **Type + geometry similarity**: for remaining placeholders of identical type, match one-to-one by closest bounding box similarity:
   - center distance + size similarity (width/height)
   - tie-breakers: top-to-bottom then left-to-right ordering
4) **Type + index fallback**: if geometry is not usable (or ties remain), match by deterministic order (top→bottom, left→right).

**When to prompt (only if necessary)**
- Prompt the user only if:
  - two or more targets are effectively tied (ambiguous) and an automatic choice could be incorrect, **or**
  - some filled placeholders cannot be mapped to any target (content would be dropped), **or**
  - multiple filled placeholders would collapse into fewer targets.

**No-surprise-loss fallback**
- If mapping is ambiguous or lossy, do not discard content.
- Default fallback: **detach the unmatched content onto the slide as normal elements** (placed near the original placeholder position), leaving the new placeholder(s) empty.

**Minimal prompt UX (PowerPoint-like, but consistent with this app)**
- A small confirmation dialog shown only when needed:
  - “Preserve placeholder content?”
  - For each filled source placeholder, show a row with a dropdown to select the target placeholder.
  - Include an option: “Keep as independent elements” (detach) to guarantee no loss.

---

### 7.4 Fonts and packaging dependencies
**Risk**
- Export/import must bundle assets; fonts are externally loaded (Google) and may not be shippable.

**Improvement**
- Spec explicitly states:
  - Export bundles images/videos.
  - Export does not bundle Google font binaries by default; instead records font families and warns on import if unavailable.

---

## 8. Risks, dependencies, and mitigations (implementation checklist)

### 8.1 Undo/redo integration
- **Dependency:** store actions must be undoable across master/layout edits.
- **Mitigation:** treat master/layout entries like slides with consistent UPDATE/ADD/DELETE actions.

### 8.2 Serialization and file format
- **Dependency:** `.strmaster` package writer/reader.
- **Mitigation:** versioned `manifest.json` and migration strategy.

### 8.3 Collaboration
- **Dependency:** concurrent edits on masters/layouts.
- **Mitigation:** locking or conflict resolution strategy for master assets and layout structure.

### 8.4 Performance
- **Dependency:** rendering master layer + slide layer.
- **Mitigation:** cache static master render where possible; invalidate on master changes.

---

## 9. Acceptance criteria (UX)

- Users can create multiple masters and layouts with clear navigation.
- Entering Master View communicates system-level editing.
- Applying a different layout preserves placeholder content when reasonable.
- Overrides are visible, reversible (“reset to inherited”), and correctly cascade.
- Export/import works without breaking the presentation; missing dependencies degrade gracefully.

---

## 10. Open questions

- Should “Change Master” be a distinct action from “Change Layout”, or always implied by choosing a layout?
- Should layout-level theme/typography overrides be edited from the same managers used in Edit Mode (recommended), or from a dedicated master-only surface?
- (Resolved) Placeholder content preservation with multiple identical types: **auto-match with deterministic rules; prompt only on ambiguity/loss; fallback to detach to avoid loss.**
