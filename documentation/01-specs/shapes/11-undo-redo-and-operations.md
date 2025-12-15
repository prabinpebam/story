# Shapes: Undo/Redo & Operation Semantics

**Status**: Draft
**Owner**: Engineering
**Last Updated**: December 15, 2025

This document specifies how Shapes editing integrates with Story’s existing undo/redo.

Key constraint: Story currently uses **snapshot-based history** for most actions. Shapes must align to this model first, while remaining compatible with collaboration/event-log approaches.

Principles reference: `documentation/00-product/principles.md`

---

## 1. Existing mechanism (must remain correct)

- `Store.snapshot(description)` records a full state snapshot through `HistoryManager.push`.
- Snapshotting is disabled when `Store.isInteracting === true`.
- The Store exposes interaction bracketing:
  - `START_INTERACTION`: snapshot once, then set `isInteracting=true`
  - `END_INTERACTION`: set `isInteracting=false`

Implication:
- Continuous interactions must call `START_INTERACTION` once at gesture start.
- During the gesture, state updates must not create snapshots.
- On gesture end, one final state exists as the post-interaction result.

Mode constraints:
- `presentation` is view-only; it must not create shape history entries.
- `master` mode edits the active master container; undo/redo must still behave as a single coherent history timeline.

---

## 2. Required undo granularity (UX contract)

- Drag move = 1 undo step
- Drag resize = 1 undo step
- Drag rotate = 1 undo step
- Drag corner radius = 1 undo step
- Vector point drag = 1 undo step
- Multi-point drag = 1 undo step
- Boolean create / change op = 1 undo step
- Mask create / edit = 1 undo step

---

## 3. Interaction bracketing rules

### 3.1 Canvas gestures
When a gesture begins (mouse down + hit result):
- Dispatch `START_INTERACTION` with description:
  - e.g., `Move`, `Resize`, `Rotate`, `Edit Corner Radius`, `Move Point`

During mouse move:
- Dispatch `UPDATE_ELEMENT` (or equivalent) without triggering snapshot.

On mouse up:
- Dispatch `END_INTERACTION`.

### 3.2 Property Inspector scrubbing
Property inspector uses `state.ui.isInteracting` to prevent rerenders that destroy inputs.
- On scrub start: dispatch `UI_INTERACTION_START`
- During scrub: dispatch updates (no snapshots if bracketed with `START_INTERACTION`)
- On scrub end: dispatch `UI_INTERACTION_END` and `END_INTERACTION`

---

## 4. Atomicity requirements

Even with snapshots, we must ensure that each user action is logically atomic:
- Multi-selection transforms must update all selected elements consistently.
- Boolean creation must create/replace nodes in a single coherent state transition.

---

## 5. Collaboration readiness (event log)

While the current implementation uses snapshots, the specs define intent-level operations for shapes so the system remains collaboration-ready.

Constraints to keep now:
- Avoid storing derived geometry in document state.
- Prefer absolute values (not deltas) in any operation representation.

---

## 6. Failure modes & mitigations

- Risk: repeated snapshots during drag → undo becomes unusable.
  - Mitigation: enforce `START_INTERACTION` bracketing in all shape gestures.

- Risk: inspector rerenders mid-scrub → lost pointer capture / jumpy inputs.
  - Mitigation: use `UI_INTERACTION_START/END` consistently.

- Risk: adding shape features that update multiple subsystems inconsistently.
  - Mitigation: define per-feature transaction boundaries and test with Playwright flows.

## 7. Quality critique (gaps + risks)
- This spec should explicitly forbid history mutations in `presentation` mode across all entry points (canvas gestures, inspector, keyboard shortcuts).
- Multi-step commands (e.g. “Use as mask”, “Create boolean”) must be implemented as a single atomic reducer action to prevent intermediate inconsistent states from being undoable.
