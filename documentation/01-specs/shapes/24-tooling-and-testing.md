# Tooling & Testing (Shapes)

**Status**: Draft

Defines developer tooling and test strategy needed to ship robust shapes.

Principle: tests are mandatory; use Vitest and Playwright.

---

## 1. Debug tooling
- Geometry visualizer overlays (points/handles)
- Boolean debug view (operand outlines, result outline)
- Cache inspectors (debug-only)

## 2. Testing strategy
- Unit tests (Vitest): geometry conversion, bounds, hit testing math, continuity enforcement.
- Stress/fuzz tests (Vitest): boolean stability, degenerate inputs.
- E2E (Playwright): create/edit/undo/redo; inspector-driven edits; multi-selection; snapping.

Project hygiene requirements (CI-gated, required):
- Add a dedicated on-disk corpus folder for geometry failures and regressions and run it in CI.
- Add deterministic (canonicalized) golden output tests for booleans and for exports.
- Add a small “stress scene” fixture used for manual profiling and for perf smoke checks with wide thresholds.

### 2.1 Corpus (required)
The repo MUST contain an on-disk corpus of minimal reproduction cases.

Required location:
- `tests/corpus/shapes/`
	- `booleans/` — boolean operation repros
	- `paths/` — general path robustness repros (self-intersections, degenerates)
	- `figma-paste/` — Figma clipboard paste repros (SVG/HTML payloads + expected editable output)

### 2.1a Figma paste corpus (required)
Figma paste is a high-risk integration (clipboard → SVG/HTML → editable elements). CI MUST pin behavior via fixtures.

Required location:
- `tests/corpus/shapes/figma-paste/`

Fixture requirements (JSON, stable and hand-editable):
- Each fixture MUST include:
	- `id` (stable string)
	- `description`
	- `clipboard`:
		- optional `imageSvgXml` (string SVG markup)
		- optional `textHtml` (string HTML)
		- optional `textPlain` (string)
	- `importOptions`:
		- `idSeed` (string) for deterministic IDs
		- optional `placement: 'viewportCenter'`
	- `expected`:
		- `elementsCanonicalHash` (hash of canonicalized created elements)
		- `warnings` (stable list of warning codes)
		- `elementCount` (number)
		- `topLevelCount` (number)

Acceptance invariants:
- Import MUST be a total function: no crash, no NaN/Infinity, no partial commit.
- Same fixture + same `idSeed` MUST produce identical canonical hash across runs.
- Unsupported features MUST yield stable warning codes (see [19a-figma-clipboard-import.md](./19a-figma-clipboard-import.md)).

Hashing scope (required):
- `elementsCanonicalHash` MUST hash only the newly created elements (not the full slide) and MUST ignore runtime-only fields.

Corpus entry format (JSON, stable and hand-editable):
- Each fixture MUST include:
	- `id` (stable string)
	- `description`
	- `operation` (`union` | `subtract` | `intersect` | `exclude`) when applicable
	- `operands` as either:
		- serialized Story element(s), OR
		- resolved path data in the canonical path schema used by shapes specs
	- `fillRule` if relevant
	- `expected`:
		- `status`: `ok` | `repaired` | `fallback`
		- `canonicalHash`: stable hash of canonical output
		- optionally `canonicalOutput` for debugging (kept small)

Corpus invariants:
- Fixtures MUST be deterministic and platform-independent.
- Any bug found in the wild or in fuzzing MUST be reduced to a minimal repro and checked in as a new corpus entry.

### 2.2 Canonical hashing (required)
All geometry goldens MUST be asserted via canonicalization + hashing (not screenshots).

Canonicalization rules:
- Apply the canonicalization defined by the shapes specs (winding, ordering, stable tie-breaks).
- Bucket numeric values using the epsilon policy defined in [04-precision-and-numerics.md](./04-precision-and-numerics.md).

Hashing rules:
- Hash MUST be computed over the canonical JSON representation with stable key ordering.
- Hash algorithm choice is implementation-defined, but it MUST be stable and collision-resistant in practice.

### 2.3 Boolean fuzzing (required)
Fuzz tests MUST be:
- seeded and reproducible
- asserted for: no crash, no NaN/Infinity, canonical determinism (same input => same canonical hash)
- self-promoting: any failure MUST record the seed and a minimized repro into `tests/corpus/shapes/booleans/`

### 2.4 Export goldens (required)
Add export golden tests for a supported subset (SVG preferred):
- Goldens MUST verify exported output via canonicalization/hashing of exported geometry (not pixel screenshots).
- If an export format contains non-deterministic metadata, tests MUST strip/normalize it before hashing.

## 2.5 Performance smoke gates (required, wide thresholds)
Performance tests MUST be smoke checks (not microbenchmarks):
- Use one or more “stress scene” fixtures under `tests/fixtures/shapes/stress/`.
- Assertions MUST be coarse (e.g. completes within a wide time budget) to avoid flakiness.
- Any performance gate MUST be paired with a deterministic fixture and an explicit budget per operation class (hit-test, boolean resolve, tessellation if used).

Figma-class learnings (what actually prevents regressions):
- Maintain a growing **boolean failure corpus** (minimal reproductions) and run it in CI.
- Run fuzz tests with fixed seeds for reproducibility; store any newly found failures back into the corpus.
- Add determinism checks for derived geometry:
	- same inputs produce byte-stable (or canonicalized-stable) outputs
- Add basic performance regression tests where feasible (e.g. “N shapes + M booleans” must remain interactive).

## 3. Determinism tests
- Replay same action sequence produces same geometry outputs.

Figma paste determinism:
- For a fixed clipboard payload and a fixed `idSeed`, imported Story elements MUST be byte-stable after canonicalization.

## 4. Feature flags
- Gate experimental booleans/vector edit mode behind flags if needed.

Quality critique (gaps + risks)
- Without golden export tests, determinism regressions won’t be detected until users report flaky exports.
- Performance tests are often flaky; treat them as smoke checks with wide thresholds, and rely on profiling fixtures for deeper work.
