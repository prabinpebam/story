# Slide Master Preset — Implementation Plan (No Legacy)

**Version:** 0.2
**Last Updated:** December 13, 2025
**Status:** In progress

## Current repo status (as of Dec 13, 2025)

This section tracks what is already implemented in the codebase vs. what remains from the milestones below.

### Implemented

- **M0 “No legacy support” cleanup (foundation)**
  - Canonical master types are now consistently used in the Master Preset + Master/Layout runtime flow:
    - Master slide: `type: 'slideMasterPreset'`
    - Layout master: `type: 'layoutMaster'` with `parentMasterId`
  - Legacy master/layout schema support has been removed/quarantined in core runtime codepaths (no `type: 'theme'` / `type: 'layout'` branches in the master/layout domain).
  - The preset materializer now produces canonical `slideMasterPreset` + `layoutMaster` records (no legacy `parentId` linkage in the master/layout domain):
    - [src/core/store/SlideMasterPresets.js](../../src/core/store/SlideMasterPresets.js)
  - Tests are green after this cleanup (Vitest full suite).

- **M4 Reconciliation engine (content preservation)**
  - Implemented in [src/core/master/Reconciliation.js](../../src/core/master/Reconciliation.js) and wired into layout changes in [src/core/store/handlers/SlideHandlers.js](../../src/core/store/handlers/SlideHandlers.js).
  - Provenance on detach (`origin.placeholderType`, `origin.sourceLayoutId`, `origin.sourceMasterElementId`, `origin.detachedAt`) is implemented and covered.
  - Tests:
    - Unit: [tests/unit/core/master/Reconciliation.test.js](../../tests/unit/core/master/Reconciliation.test.js)
    - E2E: [tests/e2e/specs/functional/layout-reconciliation-detach-restore.spec.ts](../../tests/e2e/specs/functional/layout-reconciliation-detach-restore.spec.ts)

- **M6 Layout Picker grouped by master**
  - Implemented earlier and covered by Playwright in [tests/e2e/specs/functional/layout-picker.spec.ts](../../tests/e2e/specs/functional/layout-picker.spec.ts).

- **M5 Notification system integration (blocked flows)**
  - Bottom-center popover notification service exists:
    - [src/ui/services/NotificationService.js](../../src/ui/services/NotificationService.js)
  - Store-level blocked flows emit a notification event from [src/core/Store.js](../../src/core/Store.js), which is forwarded to the UI in [src/main.js](../../src/main.js).
  - Master preset changes blocked due to “master in use” use the shared notification pathway.

- **M3 Apply master preset to a master slide (store action)**
  - `APPLY_MASTER_PRESET_TO_MASTER` exists (handled in [src/core/Store.js](../../src/core/Store.js)) and is wired from the UI.
  - Precondition gating (blocked when master is in use) is enforced in the handler and covered by unit tests:
    - [src/core/store/handlers/MasterHandlers.js](../../src/core/store/handlers/MasterHandlers.js)
    - [tests/unit/core/handlers/ApplyMasterPresetToMaster.test.js](../../tests/unit/core/handlers/ApplyMasterPresetToMaster.test.js)
  - Allowed path replaces the master’s layout set (deletes old child layouts and materializes new `layoutMaster` children from the preset definition):
    - [tests/unit/core/handlers/ApplyMasterPresetToMaster.allowedReplacement.test.js](../../tests/unit/core/handlers/ApplyMasterPresetToMaster.allowedReplacement.test.js)

- **M1 Master Preset Library (data)**
  - Implemented as a dedicated module:
    - [src/core/masterPresets/MasterPresetLibrary.js](../../src/core/masterPresets/MasterPresetLibrary.js)
  - Materialization outputs canonical entities (`slideMasterPreset` + `layoutMaster` with `parentMasterId`) and avoids embedded `themeSettings`.
  - Covered by unit tests:
    - [tests/unit/core/masterPresets/MasterPresetLibrary.test.js](../../tests/unit/core/masterPresets/MasterPresetLibrary.test.js)

- **M2 Master Preset Picker panel (UI surface)**
  - Implemented as a PanelManager/DraggablePanel surface:
    - [src/ui/panels/MasterPresetPicker.js](../../src/ui/panels/MasterPresetPicker.js)
  - Wired into app bootstrap + Property Inspector (Master View, master selection):
    - [src/main.js](../../src/main.js)
    - [src/ui/properties/SlideSection.js](../../src/ui/properties/SlideSection.js)
  - Playwright flows updated for panel selectors and Apply/Cancel behavior:
    - [tests/e2e/specs/functional/master-preset-flyout.spec.ts](../../tests/e2e/specs/functional/master-preset-flyout.spec.ts)
    - [tests/e2e/specs/functional/master-preset-blocked.spec.ts](../../tests/e2e/specs/functional/master-preset-blocked.spec.ts)

### Validation status

- **Vitest:** green (full suite).
- **Playwright:** green (full suite) and now treated as a stable CI-like gate.
  - Hardening includes IPv4 baseURL (`127.0.0.1`), strict dev-server port, capped default parallel workers, and store-based readiness waits (avoids `networkidle` flake).
  - Recent stabilization work was captured in commits `977b665` (gate hardening + flake fixes) and `79816cf` (notification dismiss selector + E2E validation).

### Partially implemented

Even though M0–M6 user-facing milestones are implemented and validated, the following **cleanup items** are still required to make the “No legacy” architecture airtight and easier to maintain:

- **Remove remaining master-preset action aliasing**
  - Today both `APPLY_SLIDE_MASTER_PRESET` and `APPLY_MASTER_PRESET_TO_MASTER` route to the same handler.
  - Goal: keep only the canonical action(s) and align handler naming with the canonical model.

- **Quarantine / eliminate `themeSettings` usage in the master/layout domain**
  - Some `themeSettings` references still exist in core runtime (migration, renderer, linked-property resolution). Some are legitimate for backwards-compatible file loading, but they must not be required for canonical runtime behavior.
  - Goal: master/layout records use **references** (`colorThemeId`, `typographyStyleId`) and resolution happens via `StyleResolver` (cascade-aware), with any legacy compatibility confined to a single adapter/migration layer.

- **Tighten invariants with tests**
  - Add/maintain unit tests asserting canonical master/layout records do not persist embedded `themeSettings` and that layout masters link via `parentMasterId`.

### Not started / still required by this plan

See milestones below for remaining work not covered by the implemented items above.

This plan implements the UX defined in:
- [documentation/01-specs/slides/05-slide-master-preset-ux-spec.md](05-slide-master-preset-ux-spec.md)
- [documentation/01-specs/ui-system/notification-system.md](../ui-system/notification-system.md)

Automation workflow requirements are defined in:
- [documentation/03-automation/06-automation-driven-debugging.md](../../03-automation/06-automation-driven-debugging.md)

It must respect product principles in:
- [documentation/00-product/principles.md](../../00-product/principles.md)

---

## 1. Non‑negotiables (constraints)

- **No legacy support**
  - Do not maintain dual schema paths (e.g. “old embedded themeSettings” vs “new references”).
  - Remove/replace legacy codepaths that read or write embedded master theme/typography values.

- **Design system compliance**
  - Use existing panels/components (Section/Dropdown/Button/Flyout/etc).
  - Use existing global CSS variables and module CSS patterns.
  - No hardcoded colors/shadows/inline styles.
  - Must work in both light/dark app themes.

- **No regressions / no breakage**
  - Preserve existing task flows unless this spec explicitly replaces them.
  - Prefer "rewire behind the same UI" over removing UI entry points.
  - Any removed/changed UI affordance must be covered by Playwright regression tests for adjacent flows.

- **No drastic UI changes**
  - Do not introduce new surfaces or interaction paradigms.
  - Prefer reusing existing patterns already present in the app (Flyout, PanelManager panels, PI rows).
  - New UI should look and behave like existing panels/rows; only small, incremental adjustments are allowed.

- **App integrity**
  - Small incremental changes, behind stable store actions.
  - Every milestone has **Vitest** coverage; Playwright for every user-facing task flow.

- **Compatibility**
  - Must be compatible with undo/redo.
  - Must be compatible with serialization.
  - Must be compatible with collaboration merges.

---

## 1.1 Critique of the current system (what must change)

This plan is intentionally “no legacy”, but the current codebase still contains competing master/preset concepts that must be resolved early.

- **Two master models exist today**
  - Canonical (required): `type: 'slideMasterPreset'` + `type: 'layoutMaster'` with `parentMasterId` (see [src/core/store/InitialState.js](../../src/core/store/InitialState.js)).
  - Legacy (must remove): `type: 'theme'` / `type: 'layout'` with `parentId` and embedded `themeSettings`.
    - As of Dec 12, 2025: core master/layout runtime codepaths have been migrated to the canonical model; remaining uses of the word “theme” in code (e.g. `source.type === 'theme'`) refer to **color-linking semantics**, not the master/layout schema.

- **Slide Property Inspector currently exposes a “Template / Select Template” UI**
  - Implemented in [src/ui/properties/SlideSection.js](../../src/ui/properties/SlideSection.js) and wired to the legacy preset generator.
  - This conflicts with the UX spec: Master preset selection must exist **only** for Master slides in Master View.
  - Also note: the surface must remain scoped to Master View + Master slide selection (not layout masters).

- **Notifications are duplicated and not aligned to the new spec**
  - There are multiple ad-hoc toast implementations in the UI.
  - For Master Preset blocking, we must use the bottom-center popover notification spec and avoid adding another one-off.

---

## 1.2 Test‑Driven Debugging (mandatory delivery workflow)

We follow the strict loop in [documentation/03-automation/06-automation-driven-debugging.md](../../03-automation/06-automation-driven-debugging.md):

1) Write the Playwright test **first** (assume correct behavior).
2) Run it (expect failures if not implemented).
3) Debug using **UI mode**, **trace viewer**, and browser `console`/`pageerror` capture.
4) Fix the app code (store/handlers/UI) and re-run until green.
5) Add/adjust Vitest coverage for core logic introduced.

### Required: DOM-level UI validation

For every milestone that adds UI, tests must assert:
- Correct surface appears (panel/row/notification) via stable `data-testid`.
- Correct copy is visible (DOM assertions), not just that “something happened”.
- Correct state mutation occurs (prefer reading `window.__TEST_STORE__` in test mode where appropriate).

### Required: stable selectors

Add `data-testid` for:
- Master preset row button
- Master preset picker panel root
- Preset cards/list items
- Apply/Cancel actions
- Blocked notification root + dismiss

---

## 1.3 UI change budget (to prevent "drastic" UI changes)

Allowed changes:
- Adding `data-testid` attributes.
- Reusing existing **PanelManager** panels and existing PI row layout.
- Small copy tweaks that clarify scope (Master vs Layout vs Slide).

Not allowed:
- Introducing new navigation concepts (new pages/modes) beyond what already exists.
- Replacing Flyouts/Panels with custom one-off UI.
- Large visual restyles, new color tokens, or inline styles.

---

## 2. Canonical architecture decisions (source of truth)

### 2.1 Entities (canonical)

- `slideMasterPresets` is the authoritative collection containing:
  - **Master slides** (`type: 'slideMasterPreset'`)
  - **Layout masters** (`type: 'layoutMaster'`, `parentMasterId: <masterId>`)

- **Preset libraries** are separate:
  - `colorThemePresets` (colors only)
  - `typographyStylePresets` (typography only)

### 2.2 References (no embedded colors/typography)

- Master and layout store only references:
  - `colorThemeId: string | null`
  - `typographyStyleId: string | null`
- All resolved/derived values come from **StyleResolver** (cascade-aware).

### 2.3 Cascade rules (must match implementation)

Priority: **Master → Layout → Slide → Element**
- Master provides default `colorThemeId` / `typographyStyleId`.
- Layout can override either by setting its own IDs (otherwise inherit).
- Slide can override either by setting its own IDs (otherwise inherit).
- Element-level style assignment/overrides remain as-is.

---

## 3. Milestones (ordered, shippable)

### M0 — Normalize state + remove legacy drift (foundation)

**Goal:** eliminate competing “theme master” concepts and embedded themeSettings branches.

**Work**
- Make `DEFAULT_MASTERS` shape (in [src/core/store/InitialState.js](../../src/core/store/InitialState.js)) the single supported model.
- Delete or quarantine legacy preset generator logic that produces `type: 'theme'` / `type: 'layout'` items and embedded `themeSettings`.
  - Candidate: [src/core/store/SlideMasterPresets.js](../../src/core/store/SlideMasterPresets.js)
- Audit code that checks `master.type === 'theme'` / `layout.parentId` and update to canonical:
  - master root: `type: 'slideMasterPreset'`
  - layout: `type: 'layoutMaster'` + `parentMasterId`
- Ensure UI lists (Master View sidebar) and renderers only use canonical types.
- Do not remove UI entry points abruptly.
  - Keep the existing PI section structure and interaction paradigm.
  - Rewire behavior so the "Template" row (if present) becomes the **Master preset row** only when in Master View and a Master slide is selected (per UX spec).
  - Ensure it is **not** shown for layout masters.
  - Ensure Edit Mode continues to use the Layout picker row unchanged.

**Acceptance**
- App boots and master mode works with only canonical types.
- No codepath depends on embedded `themeSettings` for master/layout theme/typography.

**TDD gate (required)**
- Playwright: enter Master View and verify masters/layouts render and are selectable.
- Playwright: verify no existing Edit Mode slide layout flow is broken (open Layout picker and change layout).
- Vitest: invariant helpers for “is master slide” vs “is layout master” and parent linkage.

**Risks / mitigations**
- Risk: breakage where old `parentId` is assumed.
- Mitigation: one-time repo-wide search and mechanical updates; add unit tests for helpers that find a master/layout.

---

### M1 — Introduce “Master Preset Library” (data)

**Goal:** define the preset *templates* that can be applied to a master slide (structure + references).

**Data model**
- `MasterPresetDefinition` (library-only, not the same as a master slide instance):
  - `id`, `name`, `description`
  - `colorThemeId`, `typographyStyleId`
  - `masterBackground`, `masterElements` (optional)
  - `layouts: Array<{ id, name, placeholders/elements, elementOrder }>`

**Key rule**
- Preset definitions may include element geometry and placeholder definitions, but **must not embed colors/typography**; they may only use design tokens / theme slot references if needed.

**Work**
- Add a new module (example): `src/core/masterPresets/MasterPresetLibrary.js`
  - Exports list + lookup by ID.
  - Provides a factory that materializes a preset into:
    - a new master slide object
    - a set of child layout masters
- Decide mapping keys for layouts/placeholders (critical for reconciliation):
  - Layout: stable `layoutKey` (e.g. `title`, `title-content`, `two-column`)
  - Placeholder: stable `placeholderKey` / `placeholderRole` where possible

**Acceptance**
- Library can create a consistent master + layouts set with stable IDs/keys.

**TDD gate (required)**
- Vitest: preset materialization produces valid `slideMasterPreset` + `layoutMaster[]` with stable keys.
- Vitest: preset materialization produces references only (no embedded `themeSettings`).

---

### M2 — Master Preset Picker panel (UI surface)

**Goal:** a single panel that lists master presets and applies them to the currently selected master slide (Master View only).

**Rules (from UX spec)**
- Visible only when:
  - `editor.mode === 'master'`
  - active selection is a **Master slide** (not a Layout master)
  - no element is selected

**Work**
- Implement panel using existing panel framework (like other managers):
  - `src/ui/panels/MasterPresetPicker.js` (or similar)
- Property Inspector wiring:
  - Add a “Master preset” row in the Master slide PI (only in the above conditions).
  - Row opens the Master Preset Picker panel.
- Layout previews:
  - Use existing thumbnail renderer utilities rather than custom markup.

**TDD-first UI tasks (mandatory)**
- Add `data-testid` for row + panel + preset items + Apply.
- Playwright: click through: enter Master View → select a Master slide → open picker → assert preset list renders.

**Acceptance**
- Panel opens from PI and lists available master presets.
- Uses existing UI primitives and design tokens only.

---

### M3 — Apply master preset to a master slide (store action)

**Goal:** replacing a master slide’s template container in a single undoable action.

**Store API**
- New action: `APPLY_MASTER_PRESET_TO_MASTER`
  - Payload: `{ masterId, presetId }`

**Precondition gating (required)**
- Block if any normal slide uses any layout under `masterId`.
  - Determine layouts under a master via the master’s `layoutIds` (or by scanning for `parentMasterId === masterId`).

**Work**
- In handler, if blocked:
  - Do not mutate state.
  - Trigger notification event (see M5).
- If allowed:
  - Replace the master slide’s:
    - references (`colorThemeId`, `typographyStyleId`)
    - master-level elements/background (if preset defines)
    - layout set (delete old child layouts, create new child layouts)
  - Update `editor.activeMasterId` if needed to keep selection valid.

**Undo/redo**
- Action must be fully undoable:
  - deterministic IDs or stored “before” snapshot in history layer.

**Acceptance**
- Master preset can be applied when master is not in use.
- Undo restores exact previous master+layouts.

**TDD gate (required)**
- Playwright: blocked flow shows the correct notification and the master state is unchanged.
- Vitest: handler tests for blocked vs allowed (including undo/redo behavior).

---

### M4 — Reconciliation engine (content preservation)

**Goal:** preserve user content on regular slides when layouts/masters change.

**Where used**
- Layout changes in Normal Edit Mode
- (Future) Master preset replacement once/if the “blocked when in use” rule changes.

**Implementation**
- Add a pure module: `src/core/master/Reconciliation.js`
  - `mapPlaceholders(sourceLayout, targetLayout, sourceSlide)`
  - `detachUnmappedPlaceholderContent(slide)` with provenance
  - `restoreDetachedContent(slide, targetLayout)`

**Provenance**
- Add `origin` metadata for detached elements:
  - `origin.placeholderType`
  - `origin.sourceLayoutId`
  - `origin.sourceMasterElementId` (or stable placeholder key)

**Mapping strategy (deterministic first)**
1) Stable identity match (placeholder key)
2) Type + role match
3) Geometry similarity
4) Deterministic ordering fallback

**Acceptance**
- No user content is dropped.
- Only prompts when mapping is ambiguous or lossy (if prompts are implemented later).

**TDD gate (required)**
- Playwright: layout change preserves filled placeholder content across at least 2 layout transitions.
- Vitest: placeholder mapping determinism + provenance persistence across serialization.

---

### M5 — Notification system integration (blocked flows)

**Goal:** show a bottom-center popover notification when Master preset change is blocked.

**Work**
- Implement a shared notification service/component per spec (do not add one-off toasts):
  - `src/ui/services/NotificationService.js`
  - CSS module in `styles/modules/…` using only global tokens
- Add an event API (example):
  - `notifications.show({ kind: 'blocked', title, message, actions? })`

**Note (principles)**
- Consolidate existing ad-hoc toasts behind the same notification service where practical, but do it as a follow-up once Master Preset is complete (avoid scope creep).

**Master preset blocked copy (baseline)**
- Title: “Can’t change Master preset”
- Message: “Some slides still use layouts from this Master. Move them to another layout first.”

**Acceptance**
- Notification appears at bottom-center above toolbar.
- Blocked notifications require manual dismiss.

**TDD gate (required)**
- Playwright: blocked notification placement and dismiss behavior (DOM assertions).

---

### M6 — Layout Picker (Normal Edit Mode) grouped by master

**Goal:** single Layout Picker panel grouped by master; user selects a layout directly.

**Work**
- Ensure the Layout Picker panel data source lists all `layoutMaster` grouped by parent `slideMasterPreset`.
- Selecting a layout sets `slide.layoutId` (master implied by layout).
- Use reconciliation engine (M4) for placeholder/content mapping.

**TDD-first UI tasks (mandatory)**
- Playwright: open Layout Picker from Slide PI and assert:
  - group headers exist
  - layouts are present under the correct group
  - selecting a layout updates the slide

**Acceptance**
- No two-step “pick master then layout”.
- Layout change updates slide correctly and preserves content.

---

### M7 — Tests (Vitest + Playwright)

**Vitest (unit/integration)**
- `isMasterInUse(masterId)` correctness
- `APPLY_MASTER_PRESET_TO_MASTER`:
  - blocked path does not mutate state
  - allowed path replaces master+layouts and is undoable
- Reconciliation module:
  - deterministic mapping
  - detach + provenance persistence

**Playwright (E2E)**
- Master View:
  - Master slide selection shows Master preset row
  - Layout master selection does not show it
  - blocked apply shows bottom-center notification
- Layout Picker:
  - grouped layout list
  - single-click layout selection changes slide layout
  - placeholder content preserved

**Acceptance**
- Tests are added to existing suites and run in CI/locally.

---

## 4. File touchpoints (expected)

- State and handlers
  - [src/core/store/InitialState.js](../../src/core/store/InitialState.js)
  - [src/core/store/handlers/MasterHandlers.js](../../src/core/store/handlers/MasterHandlers.js)
  - [src/core/Store.js](../../src/core/Store.js)
- Resolution and rendering
  - [src/utils/StyleResolver.js](../../src/utils/StyleResolver.js)
  - [src/core/renderer/ThumbnailRenderer.js](../../src/core/renderer/ThumbnailRenderer.js)
- UI
  - [src/ui/properties/SlideSection.js](../../src/ui/properties/SlideSection.js)
  - `src/ui/panels/MasterPresetPicker.js` (new)
  - `src/ui/services/NotificationService.js` (new)

---

## 5. Risks & mitigations (principles checklist)

- **Undo/redo complexity**
  - Mitigation: keep preset application as one store action; snapshot affected subtree (master + child layouts).

- **Serialization / file format churn**
  - Mitigation: since no legacy support, update loader/writer in one pass and add schema version gating.

- **Collaboration conflicts on master/layout edits**
  - Mitigation: prefer stable IDs/keys; keep operations deterministic; validate merges by invariant checks.

- **Design system regressions**
  - Mitigation: build notifications/picker UI as variants of existing components; no inline styles.

---

## 6. Definition of done

- Master preset picker exists and is only accessible in Master View on Master slide selection.
- Applying a preset is blocked when the master is in use and shows the correct notification.
- When allowed, applying a preset is undoable and results in a consistent master/layout tree.
- Layout picker is grouped by master and remains single-step.
- All changes are covered by Vitest and key Playwright regressions.

---

## 7. Execution discipline (how we “perfect every phase”)

For each milestone M0–M6:

- Write/extend a Playwright spec that performs a full **UI click-through** for that milestone.
- Assert the DOM for:
  - visibility/hidden rules (e.g. Master preset row appears only on Master slide selection)
  - correct copy
  - correct selection state
- Assert store invariants via `window.__TEST_STORE__` where appropriate (only in dev/test modes).
- Keep the test even if it initially fails (test-fail-fix-verify loop).
- Use trace artifacts and UI mode to debug failures.
