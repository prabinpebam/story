# Slide Transitions — Inheritance Model + Property Inspector UX (Phase 1)

## 0) Scope
This document specifies:
- the **exact inheritance model** for slide transitions
- the **Property Inspector UX** for configuring transitions

It MUST mirror the cascade model used by color themes:
- Reference: `documentation/01-specs/slides/themes/color-themes-spec.md`
- Resolver pattern reference: `src/utils/StyleResolver.js` (slide → layout → master)

Morph is out of scope (Phase 2).

App principles alignment (normative):
- Must reuse existing design system components and global CSS variables.
- Must avoid introducing new one-off components.
- Must be undo/redo compatible.
- Must be compatible with file serialization and realtime collaboration.

---

## 1) Inheritance model (normative)

### 1.1 Hierarchy
Slide Transition configuration MUST cascade through the same hierarchy as color themes:

```
MASTER PRESET (presentation-level default)
└── LAYOUT MASTER (optional override)
    └── SLIDE (optional override)
```

### 1.2 Override semantics
- Each node in the hierarchy MAY define a transition override.
- If a node does not define an override, it inherits the effective transition from its parent.

### 1.3 Null-clears-override rule
To mirror the theme system:
- **`null` MUST mean “inherit”.**
- The UI MUST provide a “Reset to inherited” action that writes `null` at that level.

### 1.4 Canonical storage (Phase 1)
Phase 1 MUST store transition configuration in a way that:
- matches the existing cascade pattern (slide → layout → master)
- is compatible with the current store shape (which already mixes legacy top-level fields and `styleAssignments`)
- is safe for serialization/sync

Therefore:

- Slide records MUST support both:
  - legacy `transition` (string) (already present today), and
  - `styleAssignments.slideTransition` (object or null) (Phase 1 canonical).

- Layout master records (type `layoutMaster`) MUST store the optional override under:
  - `styleAssignments.slideTransition`

- Master preset records (type `slideMasterPreset`) MUST store the default under:
  - `styleAssignments.slideTransition`

Null semantics (same as themes):
- `styleAssignments.slideTransition === null` means inherit.
- A missing `styleAssignments` object MUST be treated as “no override set here”.
- A present `styleAssignments.slideTransition` object means “override set here”.

### 1.5 Backward compatibility (existing `slide.transition`)
The current store has a legacy `slide.transition` string. Phase 1 MUST define a migration behavior:

- If `styleAssignments.slideTransition` exists (even if null), it is the source of truth.
- Else if `slide.transition` exists:
  - it MUST be mapped to `styleAssignments.slideTransition` using the following rules:
    - `'fade'` → `{ type: 'crossFade', durationMs: 300, easing: 'ease-in-out' }`
    - `'push'` → `{ type: 'push', direction: 'right', durationMs: 300, easing: 'ease-in-out' }` (default direction)
    - `'slide'` → `{ type: 'cover', direction: 'right', durationMs: 300, easing: 'ease-in-out' }` (closest Phase 1 semantic)
    - `'magic'` → Phase 1 MUST treat as unsupported (Morph is Phase 2) and MUST fall back safely (and MUST report telemetry `transition_fallback_to_none` or `transition_unsupported`).

Notes:
- This mapping is intentionally conservative to avoid inventing Morph semantics.
- Migration MUST be deterministic and run through undo/redo-safe store actions when triggered by user edits.
- File load migration (if any) MUST be idempotent (loading/saving repeatedly must not drift values).

### 1.6 Effective transition resolution
The effective transition for a slide MUST be computed as:

1) If slide override exists: use it.
2) Else if layout master override exists: use it.
3) Else if master preset default exists: use it.
4) Else use system default (from `01-phase-1-slide-transitions-spec.md`).

The resolver MUST also return a source descriptor used by UI:

```ts
interface EffectiveSlideTransition {
  config: SlideTransitionConfig;
  source: 'slide' | 'layout' | 'master' | 'default';
  sourceId?: string;
  sourceLabel: string; // e.g. "Slide", "Layout: Title Slide", "Master preset".
}
```

---

## 2) Property Inspector UX (slide selected)

### 2.1 Placement
- A new **Slide Transition** section MUST appear in the Property Inspector when a slide is selected.
- It MUST be shown only when the selection is empty (same display condition as Slide properties).

Design system alignment:
- The Transition section MUST be implemented inside the existing `SlideSection` architecture (same surface as Layout/Colors/Typography).
- It MUST use existing components (`Section`, `Button`, `NumberInput`, `SegmentedControl`, and `Flyout`) and existing CSS tokens.
- It MUST NOT introduce new colors/shadows/fonts; it MUST use global CSS variables.

### 2.2 Section header
- Title: **“Transition”**
- The section MUST be collapsible, consistent with other PI sections.

### 2.3 Primary row (transition picker)
The first row MUST show:
- current effective transition name
- an inheritance badge
- a button that opens the transition picker flyout

Example (slide inherits):
- `Cross fade` + badge `Inherited` + (source: `Layout: Title Slide`)

Example (slide overrides):
- `Wipe` + badge `Override` + `Reset` button

### 2.4 Inheritance badge rules
The transition section MUST reuse the badge semantics from the Slide section theme controls:
- `Inherited` when `styleAssignments.slideTransition === null` at that level
- `Override` when a config object is set at that level

The section MUST also display a source line:
- “Source: Slide”
- “Source: Layout: <layout name>”
- “Source: Master preset”

### 2.5 “Reset to inherited”
When the slide has an override:
- show a reset button (icon consistent with other reset patterns)
- clicking reset MUST set `styleAssignments.slideTransition = null` for that slide

### 2.6 Transition picker flyout (reuse existing component)
The picker MUST use the same implementation pattern as the existing layout picker flyout (`SlideSection.openLayoutFlyout()`):
- Build flyout content DOM and mount it via the existing `Flyout` component.
- Single-step selection: click an option applies immediately and closes.

Accessibility requirements (to match PI v2 expectations and improve the current Flyout baseline):
- Flyout root element MUST set `role="dialog"` and `aria-label="Select Transition"`.
- The options container MUST set `role="listbox"`.
- Each option MUST set `role="option"` and `aria-selected`.
- Escape MUST close the flyout.
- Focus SHOULD be moved to the selected option on open and restored to the trigger on close.

Implementation constraint:
- Do not add a new Flyout component; extend the existing pattern by adding attributes/handlers to the flyout content.

The flyout MUST present options as a grid (thumbnail + label):
- None
- Cross fade
- Wipe
- Push
- Cover
- Uncover

Selection rules:
- Clicking an option MUST apply it immediately and close the flyout.
- The current option MUST have `aria-selected="true"`.

No additional “Apply/Cancel” footer is allowed in Phase 1 for the transition picker (match layout picker, not master preset picker).

### 2.7 Controls shown after selection
After a specific transition is selected, the section MUST show controls:

**Duration**
- Number input (spinbutton)
- label: `Duration`
- units: `ms`
- clamp: [0, 5000]
- increment step: 50ms
- shift increment: 200ms

Design system alignment:
- The duration control MUST use the existing `NumberInput` component.
- Do not introduce inline styles; if styling is required, add/extend a CSS class in the existing property inspector stylesheet.

**Direction**
- Only for directional transitions:
  - Wipe: 8-direction control
  - Push/Cover/Uncover: 4-direction control

Direction UI MUST be a compact button grid (segmented control style) using existing button primitives.
- Each direction button MUST have an aria-label like:
  - `"Direction: from left"`
  - `"Direction: from top-left"`

### 2.8 None
If transition is set to `none`:
- Duration and Direction controls MUST be hidden (or disabled) because they have no effect.

Undo/redo:
- Changing any control MUST be recorded as an undoable store action (except transient scrubbing if the existing `skipHistory` pattern is used).

---

## 3) Property Inspector UX (master mode)

### 3.1 Master preset default
When editing a master preset (type `slideMasterPreset`):
- the Transition section MUST be available
- it edits `master.styleAssignments.slideTransition`

### 3.2 Layout master override
When editing a layout master (type `layoutMaster`):
- the Transition section MUST be available
- it edits `layout.styleAssignments.slideTransition`
- it MUST show inheritance information from the parent master preset

Storage alignment:
- Master/layout transition values MUST live on the master entities (in `slideMasterPresets`) so that they serialize and sync exactly like other master properties.

---

## 4) Mixed / multi-selection
Slide Transition is a slide property.
- In current UX, multiple slides are not edited simultaneously via the Property Inspector Slide section.
- Phase 1 MUST define behavior for future multi-slide selection:
  - If multiple slides are selected and their effective transitions differ, the transition picker MUST show a `Mixed` state.
  - Applying a transition in mixed state MUST set overrides on all selected slides.

(This is a forward-compat requirement; implementation may be deferred but the behavior is defined here to prevent ambiguity.)

---

## 5) Undo/Redo
All transition changes MUST be undoable:
- selecting a different transition
- changing duration
- changing direction
- resetting to inherited

---

## 6) Accessibility requirements
- The Transition section MUST follow the Property Inspector v2 ARIA conventions.
- Flyout must trap focus only within itself while open (as defined by PI v2 architecture) and must restore focus to the trigger on close.
- Screen reader announcements MUST be emitted for:
  - “Transition changed to …”
  - “Transition duration … ms”
  - “Transition direction …”
  - “Transition reset to inherited …”

Security/privacy:
- The Transition UI MUST NOT expose slide content in accessibility labels beyond the transition name and control values.
