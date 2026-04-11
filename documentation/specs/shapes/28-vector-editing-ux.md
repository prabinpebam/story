# Vector Editing UX (Vector Networks)

**Status**: Implemented (v1, partial)
**Last Updated**: December 17, 2025

Defines how Vector Network edit targets (nodes/handles/edges/faces) are visualized and manipulated.

V1 scope note:
- V1 vector editing is **path/segment-based** and does not ship Vector Networks.
- Vector Networks and derived faces are **V1 NON-GOAL** per [08a-vector-networks.md](./08a-vector-networks.md).

---

## 1. Visualization
Required edit target visuals:
- Nodes (anchors)
- Handle lines + handle endpoints (when node has handles)
- Edges (highlight on hover/selection)

V1 non-goal:
- Face visualization/selection is not shipped in v1.

Selection styling:
- Selected vs unselected styling MUST be accent-token driven.
- Hover styling MUST be subtle and MUST NOT obscure the selected target.

Face visualization rule:
- Face selection highlight MUST follow derived faces computed from the network; it is not a separate stored geometry.

## 2. Interaction
- Click select
- Drag point
- Drag handle

Required interactions (v1):
- Click node → select node
- Click edge → select edge
- Drag selected node(s) → move nodes (sticky capture)
- Drag handle endpoint → move handle (sticky capture)

Box selection (required):
- Dragging on empty canvas in Vector Edit mode performs a box selection.
- Box selection can select nodes and edges; faces may be included only when the selection rectangle fully contains the face bounds.

Modifiers (required):
- Add to selection: Shift
- Toggle selection membership: Ctrl/Cmd

Double-click behaviors (required):
- Double-click edge → insert node on edge at closest parameter $t$ (deterministic)
- Double-click node → toggle node type corner ↔ smooth (see operations spec)

## 3. Context actions
- Insert point
- Delete point
- Split/join

Network context actions (required):
- Insert node on edge
- Delete node
- Delete edge
- Connect nodes (when a tool/modifier is active)
- Convert node type (corner/smooth/symmetric)
- Convert edge type (line/curve)

## 4. Accessibility
- Keyboard escape
- Focus rules

Additional requirements:
- Keyboard nudge moves selected nodes by the canonical nudge step used elsewhere.
- Escape exits Vector Edit mode to Object mode without mutating document state.

## 5. Figma-class UX learnings (editing stability)
- Sticky capture: once a point/handle is grabbed, keep it as the target until pointer up (no mid-drag retargeting).
- Use zoom-scaled hit slop for anchors/handles; at low zoom, handles remain pickable without pixel-hunting.
- Avoid “jitter” when hovering dense geometry: use hysteresis (enter/exit thresholds) and deterministic tie-breaking.
- Keep handle math local-space first; avoid drift from repeated world-space conversions during long drags.
- If an operation would create degenerate segments, clamp/repair deterministically and provide quiet feedback (status hint), not modal errors.

Deterministic targeting contract (required):
- All hover and click targeting MUST follow [12-hit-testing.md](./12-hit-testing.md), including deterministic tie-break and stable `hitKey`.
- Once a target is captured on pointer-down, it MUST remain the active drag target until pointer-up.

## 6. Quality critique (gaps + risks)
- Box selection is required (defined above). Any additional selection tools beyond box selection are out of scope unless already present in the product.
