# Slide Transitions — Automated Testing & Verification

## 0) Goal
Lock in transition correctness with automated tests (unit + Playwright), so regressions are caught without manual QA.

---

## 1) Test layers

### 1.1 Unit tests (Vitest)
Key unit coverage lives in:
- `tests/unit/core/AnimationManager.test.js`
- `tests/unit/utils/StyleResolver.test.js`
- `tests/unit/core/renderer/PresentationRenderer.readiness-timeout.test.js`
- `tests/unit/core/renderer/PresentationRenderer.transition-visibility.test.js`
- `tests/unit/core/renderer/PresentationRenderer.legacy-transition-telemetry.test.js`
- `tests/unit/core/store/Store.loadPresentation.transitionMigration.test.js`
- `tests/unit/core/handlers/SlideHandlers.transitionLegacyCleanup.test.js`
- `tests/unit/storage/SlideTransition.storage-roundtrip.test.js`

### 1.2 E2E tests (Playwright)
Key Playwright coverage lives in:
- `tests/e2e/specs/functional/presentation-transition-no-blank.spec.ts`
  - Samples multiple frames during a transition and asserts the stage never becomes “blank”.
- `tests/e2e/specs/functional/transition-picker-lottie-hover.spec.ts`
  - Verifies transition picker previews do not autoplay, animate on hover, and reset on mouseout.

### 1.3 Visual assertions (how we do “visual” in E2E)
We prefer deterministic DOM/style assertions over screenshot diffs:
- computed `transform` / `opacity` / `clip-path` changes during transitions
- lifecycle attributes (`data-pm-transition-status`, `data-pm-transition-target`)

---

## 2) How to run
- Unit: `npm test`
- E2E (single spec):
  - `npm run test:e2e -- tests/e2e/specs/functional/presentation-transition-no-blank.spec.ts`
  - `npm run test:e2e -- tests/e2e/specs/functional/transition-picker-lottie-hover.spec.ts`

---

## 3) Traceability
This repo uses code + tests as the source of truth. Historical process/ledger docs are archived (see [README.md](README.md)).
