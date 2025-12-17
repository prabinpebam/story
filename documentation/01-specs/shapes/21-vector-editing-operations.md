# Vector Editing Operations (Semantics)

**Status**: Implemented (v1, partial)
**Last Updated**: December 17, 2025

Defines the canonical set of vector edit operations and their semantics.

V1 scope note:
- V1 edits vector elements as **paths/segments**.
- Graph-based Vector Networks and derived face topology are a **V1 NON-GOAL** per [08a-vector-networks.md](./08a-vector-networks.md).

---

## 1. Operations
Vector edit targets (canonical):
- Node (anchor)
- Node handles (in/out handles on a node)
- Edge (segment between nodes; may be line/cubic)

V1 does not support face selection.

Required operations (v1, implemented):
- Select node(s) / edge(s) / handle(s)
- Move node(s)
- Move handle(s) (for cubic segments)
- Insert node on **line** edge (via double-click)
- Delete node (via Backspace/Delete)
- Delete edge (via Backspace/Delete)
- Convert node type corner ↔ smooth (via double-click)
- Arrow-key nudge for selected node(s)

V1 non-goals (explicit):
- Connect nodes (create new edge)
- Convert edge type (line ↔ cubic)
- Symmetric handle constraints + explicit break gestures
- Face extraction/selection
- Stable network-level IDs across topology edits (v1 uses deterministic path-index-based IDs)

Derived/path interoperability operations (required):
- Convert selection to closed path subgraph (when the operation requires a simple path)
- Normalize/rebuild derived faces after topology edits

## 2. Constraints
- Enforce continuity constraints during edits.
- Operations must be reversible via snapshot-based undo.

Vector Network constraints (required):
- Node IDs and Edge IDs MUST be stable across:
	- undo/redo
	- save/load
	- “no-op” edits (e.g. select/deselect)
- Topology edits MUST preserve ordering deterministically:
	- stable edge ordering per node
	- stable traversal ordering for derived faces
- All edits MUST be expressed in element-local space.

Figma-class learnings (practical constraints):
- Avoid “geometry drift” during interactive edits:
	- compute edits in element-local space
	- keep parametric sources parametric; only convert when required
- Maintain pointer capture stability:
	- once a point/handle is captured on mouse-down, keep it captured until mouse-up (no retargeting mid-drag)
- Make operations idempotent within tolerance:
	- repeated split/join/convert shouldn’t accumulate tiny segments or reorder segments unpredictably

Determinism requirements (required):
- Replaying the same edit sequence MUST produce the same canonical Vector Network and the same derived faces.
- When multiple valid repairs exist (e.g. near-coincident nodes), the choice MUST follow an explicit deterministic tie-break (stable ordering by IDs, then geometry).

## 3. UI/task flows (summary)
- Click segment → insert point
- Double-click point → toggle corner ↔ smooth (v1 rule):
	- Corner → Smooth: create symmetric handles with a default length based on adjacent segment lengths (clamped by epsilon policy).
	- Smooth → Corner: collapse handles to zero while preserving anchor position.
- Modifier to break handles

Network-aware task flows (required):
- Click edge → select edge
- Double-click edge → insert node on edge at closest parameter $t$ (deterministic)
- Click face (when faces exist) → select face
- Drag from a node to another node (with the “connect” modifier / tool active) → create edge
- Backspace/Delete on selected edge(s) → delete edge(s)

Default handle length rule (required):
- When converting Corner → Smooth/Symmetric:
	- compute adjacent edge directions in local space
	- choose handle length as a deterministic function of adjacent edge lengths (e.g. median of neighbor edge lengths clamped to [min,max] derived from epsilon policy)
	- store handle vectors in local space

## 4. Tests / acceptance
- Each operation is one undo step (drag coalesced).

Additional acceptance:
- Dragging a point near other points does not “jump” selection (sticky capture).
- Replaying the same edit sequence yields the same path output (determinism).

Network-specific acceptance (required):
- Creating/removing edges updates derived faces deterministically.
- Deleting a node deterministically repairs topology:
	- if degree becomes 2 and merge is legal, edges are merged into a single edge deterministically
	- otherwise incident edges are removed and faces recomputed
- Insert-node-on-edge does not create micro-segments; it canonicalizes per epsilon policy.
- Edge conversion (line↔curve) preserves endpoints and keeps handles canonicalized.

## 5. Quality critique (gaps + risks)
- Without explicit default handle length rules, toggling corner/smooth produces inconsistent results and makes undo/redo feel “random”.
- Insert-point must not introduce micro-segments; it must apply canonicalization (prune near-duplicates) per epsilon policy.

Additional risks:
- Network edits can produce ambiguous faces near self-intersections; face extraction MUST follow [08a-vector-networks.md](./08a-vector-networks.md) deterministically.
