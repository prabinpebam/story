# Boolean Geometry System (Non-destructive)

**Status**: Draft

Defines boolean operations and how they are represented, resolved, cached, and edited.

---

## 1. Operations
- Union / Subtract / Intersect / Exclude

## 2. Data model
- Boolean node stores:
  - operation
  - ordered operand element IDs

Reference invariants:
- Operands must refer to elements in the same active container (slide or master).
- No cycles (a boolean cannot reference itself directly or indirectly).
- Operand ordering is semantically meaningful and must be preserved through undo/redo and serialization.

## 3. Resolution pipeline
- Resolve operands to paths
- Apply transforms
- Normalize winding
- Compute boolean
- Output derived path(s)

Stroke/paint interaction:
- Booleans operate on **filled geometry paths**.
- Stroke expansion is optional and must be explicitly chosen if needed for hit testing/export; it must not silently change boolean results.

## 4. Caching & invalidation
- Cache derived paths
- Invalidate when operands or their styles that affect geometry change

Progressive refinement requirement:
- If boolean resolution is too expensive for pointer-move, the system must provide a fast preview during drag and refine on release (see [17-caching-and-performance.md](./17-caching-and-performance.md)).

## 5. Failure handling
- Empty results
- Degenerate intersections
- Numeric instability + repair strategy

Figma-class learnings (practical guardrails):
- Booleans must handle adversarial inputs without corrupting state:
  - coincident/overlapping edges
  - near-tangent intersections
  - sliver polygons
  - self-intersecting inputs
  - mixed fill rules
- Determinism requirements:
  - stable output ordering
  - stable winding/fill-rule normalization
  - stable intersection ordering and tie-breakers
- Repair strategy must be specified (even if minimal in v1):
  - prune tiny segments
  - merge near-duplicate vertices
  - simplify micro-loops below epsilon
  - if repair fails: return a safe fallback (e.g. empty path) + surface a non-fatal warning

## 6. UX requirements
- Operands remain editable (drill-in)
- Flatten is explicit and irreversible

## 7. Tests / acceptance
- Boolean output is stable under repeated edits.

Additional acceptance:
- Editing operands does not reorder operands.
- Failures are non-fatal: document state remains valid and undoable even when boolean computation fails.
- Presentation mode renders the same derived output (no edit-only differences).

## 8. Quality critique (gaps + risks)
- This spec should eventually name the boolean library/algorithm constraints and define numeric robustness expectations per operation; otherwise implementation choices will drift.
- Operand style/visibility interactions (hidden/locked operands, inherited operands) require explicit rules to avoid surprising outputs.

Additional required testing:
- Fuzz tests for boolean operations (randomized but seeded inputs) to prevent regressions.
- A growing on-disk “corpus” of real-world failure cases (minimal reproduction shapes) used in CI.
