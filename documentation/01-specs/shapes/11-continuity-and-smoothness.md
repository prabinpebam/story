# Continuity & Smoothness

**Status**: Draft

Defines corner/smooth/symmetric constraints and how they are enforced.

---

## 1. Continuity levels
- C0 (position) always
- C1 (tangent) for smooth/symmetric

## 2. Types
- Corner: handles independent
- Smooth: handles collinear
- Symmetric: handles collinear + equal length

## 3. Enforcement rules
- Enforced during edit operations.
- Must specify:
  - how to break handles
  - how to relink handles
  - how modifiers affect constraints

V1 interaction contract (ties to UX specs):
- Break/unlink is explicit (e.g. Alt-drag) and must not happen implicitly.
- Relink is explicit (toolbar/inspector action) and must be undoable.
- Switching continuity must not move the anchor; it may adjust handles deterministically.

See UX: [29-continuity-curve-ux.md](./29-continuity-curve-ux.md)

## 4. Tests / acceptance
- Switching continuity updates handles as expected.

## 5. Quality critique (gaps + risks)
- Continuity semantics are one of the most “feel” dependent systems; without explicit rules, different implementers will ship incompatible behaviors.
- Continuity enforcement must operate in local space to avoid drift under transforms.
