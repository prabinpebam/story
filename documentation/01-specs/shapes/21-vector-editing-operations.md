# Vector Editing Operations (Semantics)

**Status**: Draft

Defines the canonical set of vector edit operations and their semantics.

---

## 1. Operations
- Select point(s)
- Move point(s)
- Move handle(s)
- Add point on segment
- Delete point
- Split path
- Join endpoints
- Convert point type (corner/smooth/symmetric)

## 2. Constraints
- Enforce continuity constraints during edits.
- Operations must be reversible via snapshot-based undo.

Figma-class learnings (practical constraints):
- Avoid “geometry drift” during interactive edits:
	- compute edits in element-local space
	- keep parametric sources parametric; only convert when required
- Maintain pointer capture stability:
	- once a point/handle is captured on mouse-down, keep it captured until mouse-up (no retargeting mid-drag)
- Make operations idempotent within tolerance:
	- repeated split/join/convert shouldn’t accumulate tiny segments or reorder segments unpredictably

## 3. UI/task flows (summary)
- Click segment → insert point
- Double-click point → toggle corner ↔ smooth (v1 rule):
	- Corner → Smooth: create symmetric handles with a default length based on adjacent segment lengths (clamped by epsilon policy).
	- Smooth → Corner: collapse handles to zero while preserving anchor position.
- Modifier to break handles

## 4. Tests / acceptance
- Each operation is one undo step (drag coalesced).

Additional acceptance:
- Dragging a point near other points does not “jump” selection (sticky capture).
- Replaying the same edit sequence yields the same path output (determinism).

## 5. Quality critique (gaps + risks)
- Without explicit default handle length rules, toggling corner/smooth produces inconsistent results and makes undo/redo feel “random”.
- Insert-point must not introduce micro-segments; it must apply canonicalization (prune near-duplicates) per epsilon policy.
