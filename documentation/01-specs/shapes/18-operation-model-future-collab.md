# Operation Model (Future Collaboration Readiness)

**Status**: Draft

Story currently uses snapshot-based undo/redo. This spec defines the **intent-level operation model** we align to conceptually so that collaboration/event logs remain possible later.

Constraint: This doc must not contradict [11-undo-redo-and-operations.md](./11-undo-redo-and-operations.md).

---

## 1. Goals
- Idempotent operations
- Deterministic replay
- Minimal payloads
- Commutativity when possible

Non-goals (for current Story implementation):
- Do not replace snapshot history today.
- Do not introduce CRDT/OT infrastructure as part of Shapes v1.
- Do not persist derived geometry outputs (boolean result meshes, stroke outlines, etc.).

## 2. Operation categories
- Structural (create/delete/reparent/reorder)
- Transform (set transform)
- Geometry (set param, move point, set handle, continuity)
- Style (update fill/stroke/effect)
- Boolean/mask (create, update)

## 3. Absolute over delta
- Persist absolute target values, not deltas, to avoid drift.

Clarification:
- “Absolute” means absolute in the node’s declared space (typically local space for geometry; world space only for viewport interactions).
- Continuous drags may internally use deltas, but the persisted intent (future op log) must resolve to a stable final state.

## 4. Derived data prohibition
- No ops that set bounding boxes, derived boolean results, stroke outlines, meshes.

## 5. Conflict policies (high-level)
- Different nodes commute.
- Same property: last-writer-wins.
- Delete wins over edit.

Important limitation:
- These conflict policies are conceptual guidance only. Real collaboration semantics require explicit per-field policies, especially for ordered arrays (point lists, fill/stroke stacks, operand order).

## 6. How this coexists with snapshots
- Snapshots can be derived from ops in the future.
- For now, ops are a spec-level contract guiding implementation.

Practical alignment with current app:
- Shape interactions MUST continue to bracket snapshot history using `START_INTERACTION`/`END_INTERACTION` (and inspector scrubs with `UI_INTERACTION_START/END`).
- “Future op log” thinking should influence how we structure state updates today:
	- prefer setting explicit properties
	- avoid hidden derived fields
	- keep stable IDs for referenced entities

## 7. Minimum viable operation schema (guidance)
Even without persisting ops, Shapes features should be implementable as if we could record:
- `opId` (uuid), `timestamp`, `actorId` (future), `docVersion` (future)
- `targetId` (element/node), `kind` (one of categories)
- `payload` containing explicit fields (JSON-safe)

Identity requirements:
- Points/segments/handles that can be edited individually should have stable IDs (or a stable addressing scheme) so intent can survive reordering and repairs.

## 8. Quality critique (gaps + risks)
- Current doc under-specifies ordering conflicts (operand order, point list order, fill/stroke stack order) which are the most failure-prone in collab.
- Without stable sub-IDs (points/segments), “deterministic replay” is not achievable for vector edits.
- “Last-writer-wins” is unsafe for ordered collections; ordered collections MUST define explicit per-field policies.

Required minimum for ordered collections:
- All ordered arrays that are user-visible and editable MUST be addressable by stable IDs (or a stable addressing scheme) so edits can target items without relying on index.
- Reorder operations MUST be explicit (e.g., move item A before item B) rather than implicit index swaps.
- Concurrent edits to different items commute; concurrent edits to the same item resolve per-field (not blanket LWW).
