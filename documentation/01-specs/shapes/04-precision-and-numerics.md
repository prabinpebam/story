# Precision & Numerics (Shapes)

**Status**: Draft

This spec defines numeric stability rules so geometry is deterministic and robust.

---

## 1. Numeric policy
- CPU geometry computations use float64 semantics (JS `Number`).
- Rendering uses platform-native precision (DOM/SVG/Canvas/WebGL) but must be fed stable values.

Learning to incorporate:
- Most “vector editor bugs” eventually trace to unstable numeric thresholds. Treat epsilon policy as a first-class shared dependency (not ad hoc per feature).

## 2. Epsilon rules
Define centralized epsilons (required):
- `EPS_POINT = 1e-6` (world units)
- `EPS_LENGTH = 1e-6` (world units)
- `EPS_ANGLE = 1e-6` (radians)
- `EPS_AREA = 1e-10` (worldUnits^2) for degenerate polygon checks

Hard rule:
- All geometry subsystems (parametric conversion, booleans, stroke expansion, hit testing, snapping, tessellation flattening) MUST consume epsilons from a single shared module and MUST NOT define their own thresholds.

Test requirement:
- The epsilon module must have unit tests that assert relative ordering and sanity (e.g., `EPS_AREA <= EPS_LENGTH^2`) and corpus tests that validate boolean robustness does not regress when epsilons are tuned.

All comparisons must use epsilons; avoid exact equality.

## 3. Degenerate geometry handling
- Remove / ignore segments shorter than epsilon.
- Prevent NaNs by clamping divisions and normalizing vectors.
- Avoid self-intersection in generated parametric conversions when possible.

## 4. Snapping vs true geometry
- Snapping is an **interaction constraint**, not a geometry mutation rule.
- Persist snapped coordinates as authoritative results of user intent.

## 5. Determinism constraints
- Stable ordering of intersections and produced segments.
- Stable operand ordering in booleans.

Additional determinism requirements:
- Canonicalize output paths for any derived geometry (booleans, stroke expansion): stable winding, stable segment ordering, stable subpath ordering.
- Parametric→path conversion should be **idempotent within tolerance**: applying conversion repeatedly should not drift.

## 6. Tests / acceptance
- Replaying same state changes yields identical path outputs.
- Booleans do not “flip” output order nondeterministically.

## 7. Quality critique (gaps + risks)
- If the epsilon policy is not centralized, determinism and UX continuity will fail in subtle ways.
- If different subsystems (booleans, snapping, hit testing) pick different thresholds, users will observe discontinuities (e.g. can select but can’t boolean).
- Canonicalization must be explicitly defined for derived outputs; otherwise determinism claims will fail under floating-point noise.
