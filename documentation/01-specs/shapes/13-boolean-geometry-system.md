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

Required failure contract (non-negotiable):
- Boolean resolution MUST be total: it never throws, never returns NaNs/Infinity, never returns invalid geometry, and never corrupts document state.
- On failure, the system MUST return a deterministic fallback derived output (see 5.4) and surface a non-blocking status (see [34-feedback-and-status.md](./34-feedback-and-status.md)).
- Failures MUST be undo-safe: undo/redo must remain correct even if intermediate boolean computation fails.

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

### 5.1 Canonicalization and determinism (required)
Before emitting a derived path result, the boolean system MUST canonicalize:
- subpath ordering
- segment ordering within a subpath
- winding normalization consistent with the chosen fill rule
- stable intersection ordering using explicit tie-break rules

Determinism acceptance:
- Same operand geometry + operation + fill rule + epsilon policy MUST produce canonically-identical derived paths across runs.

### 5.2 Adversarial input classes (required)
The system MUST handle these adversarial classes without crashing and without producing NaNs/Infinity:
- coincident/overlapping edges
- near-tangent intersections
- sliver polygons
- self-intersecting inputs
- hole-touching outer contour
- nested holes (multi-level)
- extremely acute angles
- extreme scale transforms (very large/small coordinates)

### 5.3 Test corpus + goldens (required, CI-gated)
Maintain an on-disk boolean corpus of minimal repro cases and run it in CI.

Corpus entry requirements:
- Each entry MUST define:
  - operands (as Story elements or resolved paths)
  - operation
  - expected canonical derived output (golden hash)
  - expected status: `ok` | `repaired` | `fallback`
- Corpus MUST include at least one example of each adversarial class in 5.2.

Golden output requirements:
- Golden verification MUST be based on canonical path output (not screenshots).
- Use a stable hash of canonicalized paths with numeric bucketing consistent with [04-precision-and-numerics.md](./04-precision-and-numerics.md).

### 5.4 Fallback policy (required)
If boolean resolution fails after repair:
- Return a deterministic fallback derived output:
  - `union`/`exclude`: fallback to the *first operand’s* resolved fill path(s) (canonicalized)
  - `subtract`/`intersect`: fallback to an empty output

Rationale:
- Fallback must preserve editability (operands still exist) and avoid random disappearance across operations.

### 5.5 Performance coupling (required)
- During pointer-move, a fast preview path is allowed but MUST be deterministic for a given input state.
- On pointer-up, the system MUST attempt the full-quality resolve and update the derived output.
- Preview vs final must not change the authoritative state; it only changes derived outputs.

## 6. UX requirements
- Operands remain editable (drill-in)
- Flatten is explicit and irreversible

## 7. Tests / acceptance
- Boolean output is stable under repeated edits.

Additional acceptance:
- Editing operands does not reorder operands.
- Failures are non-fatal: document state remains valid and undoable even when boolean computation fails.
- Presentation mode renders the same derived output (no edit-only differences).

Fuzzing requirements:
- Fuzz tests MUST be seeded and reproducible.
- Fuzz MUST assert:
  - no crash
  - no NaNs/Infinity
  - canonical output determinism (same input => same canonical output)
  - output validity invariants (closedness/winding rules as applicable)
- On any failure, the failing seed and minimized input MUST be saved back into the corpus.

## 8. Quality critique (gaps + risks)
- This spec should eventually name the boolean library/algorithm constraints and define numeric robustness expectations per operation; otherwise implementation choices will drift.
- Operand style/visibility interactions (hidden/locked operands, inherited operands) require explicit rules to avoid surprising outputs.

Additional required testing:
- Fuzz tests for boolean operations (randomized but seeded inputs) to prevent regressions.
- A growing on-disk “corpus” of real-world failure cases (minimal reproduction shapes) used in CI.
