# Slide Transitions — Testing & Verification (Phase 1)

## 0) Goal
Provide an enforceable verification plan that prevents spec/implementation gaps.

This is modeled after the Presentation Mode gate discipline.

---

## 1) Test layers

### 1.1 Unit tests (Vitest)
Unit tests MUST cover:
- transition config validation (clamping duration, allowed directions)
- effective transition resolution (slide → layout → master → default)
- reduced motion forcing `none`
- mapping from legacy `slide.transition` to `styleAssignments.slideTransition`
- transition lifecycle state machine (idle/loading/transitioning)
- readiness gating orchestration

### 1.2 E2E tests (Playwright)
Playwright MUST enforce:
- DOM contract attributes:
  - `data-pm-transition-status`
  - `data-pm-transition-target`
- readiness gating:
  - status becomes `loading` and stays until assets are ready
  - status becomes `transitioning` only after readiness passes
- audience-clean rule:
  - no presenter-only loading indicator visible to audience
- reduced motion:
  - with `prefers-reduced-motion: reduce`, transitions are instant

### 1.3 Visual verification
At minimum, Playwright MUST include deterministic assertions for:
- `cover` places incoming above outgoing
- `uncover` places outgoing above incoming
- `wipe` uses a masking strategy (clip-path present) and reveals correctly

If visual regression tooling exists, transitions SHOULD be included.

---

## 2) Golden decks (required fixtures)
A deterministic fixture deck MUST exist that covers:
- every Phase 1 transition type
- each directional option
- combinations with:
  - images
  - video (first-frame gating)
  - custom fonts
  - builds (assets used only after builds)

The fixture MUST document expected behavior.

---

## 3) Mandatory Playwright specs (Phase 1)
Suggested minimum suite (names are normative; exact filenames may vary):

- `functional/transitions/transition-picker-inheritance.spec.ts`
  - set master default transition
  - override layout
  - override slide
  - reset to inherited
  - verify source labels

- `functional/transitions/transition-readiness-gating.spec.ts`
  - simulate slow image decode
  - assert transition does not start until decode complete
  - assert audience sees no loader

- `functional/transitions/transition-types-render.spec.ts`
  - for each transition type, assert the expected DOM/styling contract is present during transitioning

- `functional/transitions/reduced-motion.spec.ts`
  - force reduced motion
  - assert no animation and correct fallback telemetry

---

## 4) Performance validation
A perf gate MUST validate:
- transitions maintain 60fps on baseline deck
- transition start latency meets Presentation Mode targets once HOT is ready

---

## 5) Traceability requirements
Every MUST/MUST NOT clause in the transitions spec suite MUST map to at least one automated verification:
- unit (Vitest) and/or
- e2e (Playwright)

The ledger file `05-ledger-and-gate-plan.md` is the authoritative tracker.
