# Continuity & Smoothness

**Status**: Implemented (v1, minimal)

Defines corner/smooth/symmetric constraints and how they are enforced.

---

## 1. Continuity levels
- C0 (position) always
- C1 (tangent) for smooth/symmetric

## 2. Types
V1 supports two continuity states for an anchor:
- **Corner**: node-adjacent handles are collapsed to the anchor.
- **Smooth**: node-adjacent handles are expanded away from the anchor.

**V1 decision**: symmetric continuity (equal-length handles) is deferred.

## 3. Enforcement rules
V1 enforcement is performed during edit operations in local space.

Current v1 behavior:
- Continuity is toggled explicitly by the vector edit action (double-click node) and updates the node-adjacent handles deterministically.
- V1 does not enforce full C1 continuity constraints (collinearity and tangent matching) across branching topology; it only expands/collapses adjacent handles.
- “Break/unlink” and “relink” modifier semantics are deferred to the dedicated UX spec and v2+.

V1 interaction contract (ties to UX specs):
- Break/unlink modifier semantics are not shipped in v1.
- Relink UI actions are not shipped in v1.
- Switching continuity must not move the anchor; it adjusts handles deterministically.

See UX: [29-continuity-curve-ux.md](./29-continuity-curve-ux.md)

## 4. Tests / acceptance
V1 acceptance:
- Switching continuity updates handles deterministically and is undoable.

## 5. Quality critique (gaps + risks)
- Continuity semantics are one of the most “feel” dependent systems; without explicit rules, different implementers will ship incompatible behaviors.
- Continuity enforcement must operate in local space to avoid drift under transforms.
