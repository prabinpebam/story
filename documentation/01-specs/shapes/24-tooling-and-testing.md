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

Project hygiene requirements:
- Add a dedicated on-disk corpus folder for boolean/path failure repros (JSON fixtures) and run it in CI.
- Add golden SVG export tests for a supported subset with deterministic canonicalization.
- Add a small “stress scene” fixture used for manual profiling and (optionally) automated perf smoke checks.

Figma-class learnings (what actually prevents regressions):
- Maintain a growing **boolean failure corpus** (minimal reproductions) and run it in CI.
- Run fuzz tests with fixed seeds for reproducibility; store any newly found failures back into the corpus.
- Add determinism checks for derived geometry:
	- same inputs produce byte-stable (or canonicalized-stable) outputs
- Add basic performance regression tests where feasible (e.g. “N shapes + M booleans” must remain interactive).

## 3. Determinism tests
- Replay same action sequence produces same geometry outputs.

## 4. Feature flags
- Gate experimental booleans/vector edit mode behind flags if needed.

Quality critique (gaps + risks)
- Without golden export tests, determinism regressions won’t be detected until users report flaky exports.
- Performance tests are often flaky; treat them as smoke checks with wide thresholds, and rely on profiling fixtures for deeper work.
