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
- **Master (Slide Master Preset / “Master slide”):** A complete reusable template container (PowerPoint-like) that contains:
  - references to Color Theme + Typography Style presets
  - all nested Layout Masters
  - master-level content (images/videos/code fills/shapes/etc.)
  - placeholder definitions that layouts use
- **Layout:** A template slide within a master (Title Slide, Title + Content, Two Column…).
- **Placeholder:** A template element that appears on slides and is filled with user content (Title, Body, Image, etc.).

**Key UX rule (scope):**
- **Change Master** switches the slide to a different **Master preset** (and therefore to that master’s layout set, theme + typography references, and master-level content).
- **Change Layout** switches the slide to a different **Layout Master within the currently-applied Master**.

**Key UX rule (Property Inspector visibility):**
- The **Master preset** selector is shown in the Property Inspector **only when the user is editing the Master slide itself** (Master Mode, master selected, no element selected).
- The Master preset selector is **not shown** when editing a Layout Master.

### 2.2 Internal system constraints (implementation-aligned)
- Masters and layouts live in `state.slideMasterPresets`.
- A slide references the applied layout via `slide.layoutId`.
- Layouts reference their parent master via `layout.parentMasterId`.
- Colors/typography are assigned through style assignment references (IDs), not embedded values.

---

## 3. Goals / Non-goals

### 3.1 Goals
- Create, edit, and manage multiple Slide Master Presets in a single presentation.
- Support multiple Master slides in the same `.str` file (PowerPoint-like), where each Master slide can reference a different Master preset.
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
- **Master Preset Picker (Panel):** a panel surface for choosing a Master preset to apply (used by “Change Master” and by the Master slide’s PI row).

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

**Scope**
- This action only selects among layouts that belong to the slide’s currently applied Master preset.

**Steps**
1. User opens Layout dropdown.
2. User selects a new layout.
3. System reconciles placeholders:
   - Preserve content when placeholder types match.
   - Add new placeholders as empty.
  - Remove placeholders that no longer exist **only when they have no user content**.
  - If a placeholder no longer exists and it contains user content, apply the detach/provenance rules in 5.6.1 (never drop content).
   - Keep non-placeholder slide elements.

#### 5.6.1 Case analysis (PowerPoint-like)

The system must behave differently based on **whether user-authored content exists** and **whether a deterministic mapping exists**.

**CASE 1: Slide placeholders have no user content**
- Example: placeholder text boxes still show prompt content (empty/untouched).
- User changes layout.
- Behavior:
  - Replace the old layout placeholder set with the new layout placeholder set.
  - No content preservation logic needed (no user content).
  - No prompts.

**CASE 2: Slide contains user content inside placeholder(s)**

**CASE 2A: Deterministic mapping exists (safe preserve)**
- Example: Title placeholder → Title placeholder in new layout.
- Behavior:
  - Preserve the user content by mapping from source placeholder → target placeholder.
  - Preserve overrides where valid (style overrides remain on the placeholder element per placeholder integration rules).
  - No prompts.

**CASE 2B: No mapping exists (e.g., switching to Blank layout)**
- Example: current layout has Title/Body placeholders, new layout has none.
- Behavior:
  - Convert placeholder-origin user content into **regular slide elements** (detached content) so nothing is lost.
  - The new layout placeholders (if any) are created empty.
  - Crucially: the system must still remember where the detached elements came from so a later layout change can “put them back”.

#### 5.6.2 Provenance tracking (required for restore)

When placeholder-origin content is detached (CASE 2B), each resulting regular element must carry origin metadata.

**Required metadata fields (conceptual)**
- `origin.placeholderType` (e.g., `title`, `body`, `caption`)
- `origin.sourceLayoutId` (the layout the placeholder came from)
- `origin.sourceMasterElementId` (stable placeholder identity if available)
- `origin.detachedAt` timestamp/version (for debugging and conflict resolution)

This metadata must survive:
- undo/redo
- serialization
- collaboration merges

#### 5.6.3 Restore rules when switching to another layout later

If a slide has detached elements with `origin.*` metadata and the user changes to a layout where matching placeholders exist:

1) Attempt to map detached elements back into placeholders using the same deterministic strategy defined in “Content preservation edge cases”.
2) If a match is found:
   - Move the element’s content into the placeholder element.
   - Delete the detached regular element (or mark as migrated) to avoid duplicates.
3) If no match is found:
   - Keep the detached element as a normal slide element.

**PowerPoint-like UX rule:** restoring should be automatic and silent when deterministic; never drop content; only prompt if mapping is ambiguous or would overwrite existing filled placeholder content.

#### 5.6.4 Conflict rules (avoid overwriting user work)

If the target placeholder is already filled with user content and a detached element also wants to map there:
- Do not overwrite.
- Default behavior:
  - Keep the existing placeholder content.
  - Keep the detached element as a normal slide element.
- Prompt only if the user is about to lose track of content placement (rare) and offer:
  - “Replace placeholder content”
  - “Keep both (detach)” (default)
  - “Choose another placeholder”

**Result**
- Slide changes to new layout without losing meaningful content.

**Undo/redo**
- Layout change is undoable.

**Failure states**
- New layout missing required master → block selection and show warning.

---

### 5.6A Change Master for slide(s) (distinct from Change Layout)

**Trigger**
- In Edit Mode, user chooses “Change Master” (context menu on slide thumbnail, or slide-level PI action).

**Scope**
- This action changes the slide’s **Master preset** (the full template container). It implies a master switch and then a layout selection within the new master.

**Steps**
1. User opens “Change Master…”.
2. App opens the **Master Preset Picker panel**.
3. User selects a target Master preset.
4. Panel shows the layouts within the selected master and preselects a best-guess layout:
  - Prefer a “same-named” layout (Title → Title), else
  - Prefer the master’s default layout, else
  - Fall back to the first layout.
5. User confirms Apply.
6. System runs the same placeholder reconciliation described in 5.6 (including detach/provenance/restore rules).

**Result**
- Slide now uses the new master’s structure + visuals (master-level content, referenced theme/typography), while preserving user content where possible.

**Undo/redo**
- Change Master is undoable (restores previous master + layout + reconciled content).

**Failure states**
- Target master has no layouts → block and show error.

---

### 5.7 Override Color Theme / Typography at master, layout, and slide levels

**Trigger**
- User opens Color Theme manager or Typography Style manager.

**Core intention (comprehension check)**
- There is **one** Color Theme Manager and **one** Typography Style Manager in the product.
- They are the **same panels with the same behaviors** in Edit Mode and Master Mode.
- We do **not** introduce a master-only theme/typography surface.
- The only thing that changes between contexts is the **scope that an “Apply” targets** (Master vs Layout vs Slide) and the **inherit/override messaging**.

**Important distinction: editing a preset vs applying a preset**
- **Editing** in the manager modifies a preset in the preset library (e.g., `state.colorThemePresets`, `state.typographyStylePresets`).
  - This affects **everything** that references that preset ID.
- **Applying** in the manager (or via the PI row that opens it) sets the referencing ID at the current scope (Master/Layout/Slide) to point to a chosen preset.
  - This is how we create “overrides” while still obeying the architecture rule: masters/layouts/slides **reference IDs** and never embed values.

**Rules**
- Overrides are stored at the relevant level:
  - Master: updates master style assignments / referenced IDs.
  - Layout: layout-level style assignment / referenced IDs.
  - Slide: slide-level style assignment / referenced IDs.

**Scope selection (how the same manager applies to different levels)**
- When the manager is opened from a context with **no element selected**:
  - In **Master Mode** with a master selected: default apply target is **Master**.
  - In **Master Mode** with a layout selected: default apply target is **Layout**.
  - In **Edit Mode** with slide-level context (no element selected): default apply target is **Slide**.
- The manager must show a clear, persistent scope indicator (e.g., “Applying to: Layout • Title + Content”).
- “Reset to inherited” uses the same cascade model:
  - Layout reset → inherit from Master
  - Slide reset → inherit from Layout (then Master)

**UX requirements**
- UI must show whether the current selection is inherited or overridden.
- “Reset to inherited” must be available where overrides exist.
- Applying a preset at Layout/Master level is a **template edit** and should be messaged as such (blast radius), but still uses the same manager panel.

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

### 5.10 Reset slide to layout (preserve content)

**Trigger**
- In Edit Mode, user chooses “Reset to Layout” for a slide (context menu).

**Steps**
1. User triggers “Reset to Layout”.
2. App shows a confirmation describing blast radius (resets layout-related overrides).
3. System resets slide-level overrides back to its referenced layout defaults.
4. Placeholder content is preserved (consistent with the Master system spec).

**Result**
- Slide matches the layout geometry/visibility defaults while keeping user content.

**Undo/redo**
- Reset is undoable.

---

### 5.11 Preserve master (master travels with slides)

**Trigger**
- In Master View, user toggles “Preserve” on the active Master slide (toolbar).

**Behavior**
- When Preserve is enabled for a master, slides using that master carry it during import/export/merge flows (PowerPoint-like intent).
- Preserve must not change day-to-day editing behavior; it only changes packaging / dependency behavior.

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
  - In Master Mode:
    - Master selected: show master properties including **Master preset** selector (opens Master Preset Picker panel)
    - Layout selected: show layout properties and layout-level theme/typography overrides; do **not** show Master preset selector
- With element selection:
  - Same element editing sections as Edit Mode
  - Inherited elements in child contexts must be clearly locked and explain why

### 6.5 Master Preset Picker (Panel)

**Purpose**
- Provide one consistent surface to choose a Master preset, without duplicating UI or inventing master-only variants.

**Where it is used**
- Edit Mode: invoked by “Change Master…” for selected slide(s).
- Master Mode: invoked from the Master slide Property Inspector “Master preset” row.

**Panel contents (minimal)**
- Master preset list/grid (search optional only if already exists elsewhere).
- For the selected master preset: a layout picker grid (same visual language as the existing layout picker).
- Primary action: Apply.

**Behavioral requirements**
- Must never drop user content; uses the reconciliation rules in 5.6.
- Must be explicit about blast radius when applying from Master Mode (changes affect all slides using that master).

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

- (Resolved) “Change Master” is distinct from “Change Layout”. “Change Master” switches the template container; “Change Layout” selects within the current master.
- (Resolved) Layout-level theme/typography overrides are edited/applied from the **same Theme and Typography manager panels** used in Edit Mode; the panel is scope-aware (Apply to Master/Layout/Slide) and does not fork into a master-only UI.
- (Resolved) Placeholder content preservation with multiple identical types: **auto-match with deterministic rules; prompt only on ambiguity/loss; fallback to detach to avoid loss.**
