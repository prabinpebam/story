# Slide Transitions (Phase 1) — Delivery Ledger & Gate Plan

**Goal**: ship Phase 1 Slide Transitions with **no spec/implementation gaps**, enforced by tests.

Phase 1 scope:
- Cross fade
- Wipe (directional)
- Push (directional)
- Cover (directional)
- Uncover (directional)

Non-goal (Phase 2): Morph

References:
- Presentation Mode ledger discipline: `documentation/01-specs/slides/presentation-mode/23-ledger-and-gate-plan.md`

---

## Current Status (as of December 21, 2025)
Status legend: ✅ Done (locked) · 🟡 In progress · ❌ Not started · ⛔ Blocked

- ✅ Gate 0 (contracts): canonical config + coercion + resolver + storage model implemented and unit-tested
- 🟡 Gate 1 (PI UX): Transition section + picker + reset implemented and unit-tested; ARIA-role specifics + Playwright coverage pending
- 🟡 Gate 2 (readiness): readiness probe + renderer-level gating implemented; Playwright audience-clean assertions pending
- 🟡 Gate 3 (rendering): Phase 1 transition runtime implemented and unit-tested; Playwright per-type visual/stacking assertions pending
- 🟡 Gate 4 (reduced motion + fallbacks): legacy/unsupported + missing-engine fallbacks implemented and unit-tested; reduced-motion Playwright coverage pending
- ❌ Gate 5 (perf + telemetry): telemetry + perf gates not implemented

Verification evidence (run-once):
- `npm test -- tests/unit/core/AnimationManager.test.js` → ✅ 1 file, 54 tests passed
- `npm test -- tests/unit/ui/components/NumberInput.test.js` → ✅ 1 file, 62 tests passed
- `npm test -- tests/unit/ui/SlideSection.test.js` → ✅ 1 file, 28 tests passed
- `npm test` → ✅ 187 files passed, 1 skipped; 4578 tests passed, 43 skipped

---

## What “120% Complete” Means Here

A transitions implementation is only “120% complete” when:
- There is a complete MUST index (`MUST-index.md`) covering MUST/MUST NOT clauses across the transitions spec suite.
- Every MUST is mechanically verifiable via:
  - Vitest (logic) and/or
  - Playwright (DOM + UX + lifecycle)
- Performance and readiness gating are proven:
  - no half-decoded media visible during transitions
  - no audience loader ever
- Reduced motion is proven across all transition types.
- Fallback behavior is proven (unsupported types, missing animation engine).

---

## Non‑negotiable rules (shipping discipline)
- Red → Green → Refactor for every increment.
- Every increment adds/updates Playwright assertions for:
  - transition lifecycle attributes
  - audience-clean invariants
- Every logic increment adds Vitest tests.
- Every bug fix starts with a failing regression test.
- This ledger must be kept current.

---

## Gate plan (Phase 1)

### Gate 0 — Baseline contracts
Exit criteria:
- Transition config types and validation are implemented.
- Effective transition resolution is implemented and unit-tested.
- Property Inspector section exists (hidden behind feature flag if needed).

Evidence required:
- Vitest: config + resolver tests


### Gate 1 — Property Inspector UX + inheritance
Exit criteria:
- Transition section supports:
  - display of effective transition name
  - source row (Slide / Layout / Master)
  - inherited vs override badges
  - reset to inherited
- Transition picker flyout reuses layout picker interaction model.

Evidence required:
- Playwright: transition picker + inheritance behavior


### Gate 2 — Readiness gating integration
Exit criteria:
- Transition cannot start until readiness probe passes.
- Presenter-only waiting indicator allowed; audience-only indicator forbidden.

Evidence required:
- Playwright: readiness delays block transitions; audience-clean asserted
- Vitest: readiness orchestration and failure bounds


### Gate 3 — Transition rendering (Phase 1)
Exit criteria:
- `crossFade`, `wipe`, `push`, `cover`, `uncover` render correctly.
- Direction controls apply to the correct subset.
- DOM is cleaned after transitions.

Evidence required:
- Playwright: per-type assertions (stacking, clip-path/transform invariants)


### Gate 4 — Reduced motion + fallback correctness
Exit criteria:
- Reduced motion forces `none`.
- Unsupported types fall back to `none`.
- Missing animation engine falls back to `none`.

Evidence required:
- Playwright: reduced motion
- Vitest: fallback mapping


### Gate 5 — Performance + reliability (quality gate)
Exit criteria:
- Transition FPS baseline verified.
- No regressions vs Presentation Mode performance bar.
- Stress navigation does not leak DOM nodes.

Evidence required:
- Perf bench (automated if available)
- Playwright: stress loop

---

## Traceability row template (required)
```yaml
id: ST-001
level: MUST # MUST|SHOULD|MAY
spec:
  - file: documentation/01-specs/slides/transitions/01-phase-1-slide-transitions-spec.md
    section: "8) Readiness gating"
    clauses:
      - "Transitions MUST NOT start until the incoming slide is ready"
impl:
  owners: ["core", "ui"]
  files:
    - src/core/renderer/PresentationRenderer.js
    - src/core/AnimationManager.js
tests:
  unit:
    - file: tests/unit/core/transitions/TransitionReadiness.test.js
      assertions:
        - "blocks until decode complete"
  e2e:
    - file: tests/e2e/specs/functional/transitions/transition-readiness-gating.spec.ts
      assertions:
        - "status=loading until ready"
        - "audience sees no loader"
telemetry:
  events:
    - "transition_blocked_for_readiness"
    - "transition_started"
doneWhen:
  - "All tests pass"
  - "No TODO/NOTE remains in cited spec clauses"
```

---

## MUST index (source of truth)
The transitions MUST index lives in: `documentation/01-specs/slides/transitions/MUST-index.md`

Rules:
- MUST-ID is derived deterministically (spec filename + line number) or an equivalent stable method.
- Until a generator exists, the `TRN-P1-<doc>-<nnn>` scheme in `MUST-index.md` is the stable method.
- Every MUST and MUST NOT clause must appear.
- Each MUST must map to exactly one ledger row `ST-###`.

---

## Ledger (Phase 1)

| ST-ID | Gate | Status | Requirement summary | Spec location | Implementation | Automated verification |
|---|---|---|---|---|---|---|
| ST-001 | Gate 0 | ✅ | MUST reuse existing design system components and CSS variables. | 01-phase-1-slide-transitions-spec.md — 1) Goals | src/ui/properties/SlideSection.js | tests/unit/ui/SlideSection.test.js (Transition Section) |
| ST-002 | Gate 0 | 🟡 | MUST avoid introducing new inline-style-heavy UI patterns (prefer existing classes + CSS variables). | 01-phase-1-slide-transitions-spec.md — 1) Goals | src/ui/properties/SlideSection.js | TBD (manual audit / Playwright) |
| ST-003 | Gate 0 | 🟡 | MUST be compatible with undo/redo. | 01-phase-1-slide-transitions-spec.md — 1) Goals | src/ui/properties/SlideSection.js; src/core/store/handlers/SlideHandlers.js; src/core/store/handlers/MasterHandlers.js | TBD (undo/redo regression tests) |
| ST-004 | Gate 0 | 🟡 | MUST be compatible with file storage/serialization and realtime collaboration. | 01-phase-1-slide-transitions-spec.md — 1) Goals | src/core/store/handlers/SlideHandlers.js; src/core/store/handlers/MasterHandlers.js | tests/unit/utils/StyleResolver.test.js (reads canonical + legacy) |
| ST-005 | Gate 0 | ✅ | The transition system MUST use **canonical type IDs** (string literals) as follows: | 01-phase-1-slide-transitions-spec.md — 5.1 Canonical type IDs | src/core/presentation/SlideTransitionUtils.js | tests/unit/utils/StyleResolver.test.js; tests/unit/core/AnimationManager.test.js |
| ST-006 | Gate 0 | ✅ | // MUST clamp to [0, 5000] at read time. durationMs: number; | 01-phase-1-slide-transitions-spec.md — 5.2 Parameters (common) | src/core/presentation/SlideTransitionUtils.js | tests/unit/utils/StyleResolver.test.js (clamp duration) |
| ST-007 | Gate 0 | ✅ | // Direction MUST be present for directional transitions and MUST be absent for non-directional. // - wipe: direction8 // - push/cover/uncover: direction4 direction?: SlideTransitionDirection4 \| SlideTransitionDirection8; | 01-phase-1-slide-transitions-spec.md — 5.2 Parameters (common) | src/core/presentation/SlideTransitionUtils.js | tests/unit/utils/StyleResolver.test.js (direction normalization); tests/unit/core/AnimationManager.test.js (directional types) |
| ST-008 | Gate 0 | ✅ | // MUST accept CSS easing string. easing?: string; | 01-phase-1-slide-transitions-spec.md — 5.2 Parameters (common) | src/core/presentation/SlideTransitionUtils.js | tests/unit/utils/StyleResolver.test.js (easing normalization) |
| ST-009 | Gate 0 | ✅ | The **system default** transition MUST be: - `type: 'crossFade'` - `durationMs: 300` - `easing: 'ease-in-out'` | 01-phase-1-slide-transitions-spec.md — 5.3 Default config | src/core/presentation/SlideTransitionUtils.js | tests/unit/utils/StyleResolver.test.js (SYSTEM_DEFAULT_TRANSITION) |
| ST-010 | Gate 0 | ✅ | If a slide resolves to no transition config through inheritance, the system MUST use the system default. | 01-phase-1-slide-transitions-spec.md — 5.3 Default config | src/utils/StyleResolver.js | tests/unit/utils/StyleResolver.test.js (system default fallback) |
| ST-011 | Gate 0 | 🟡 | If `prefers-reduced-motion: reduce` is active, the system MUST force `type: 'none'` regardless of config. | 01-phase-1-slide-transitions-spec.md — 5.3 Default config | src/core/renderer/PresentationRenderer.js | TBD (Playwright reduced-motion assertions) |
| ST-012 | Gate 0 | ✅ | Phase 1 MUST standardize a single runtime API surface so duration/direction can be honored: | 01-phase-1-slide-transitions-spec.md — 5.4 Runtime integration contract (alignment to current app) | src/core/renderer/PresentationRenderer.js; src/core/AnimationManager.js | tests/unit/core/AnimationManager.test.js |
| ST-013 | Gate 0 | ✅ | `AnimationManager.transition(container, outgoingEl, incomingEl, transition)` MUST accept: - either a legacy string (back-compat), or - a `SlideTransitionConfig` object. | 01-phase-1-slide-transitions-spec.md — 5.4 Runtime integration contract (alignment to current app) | src/core/AnimationManager.js | tests/unit/core/AnimationManager.test.js |
| ST-014 | Gate 0 | ✅ | If a legacy string is provided (e.g. `'fade'\|'push'\|'slide'\|'none'\|'magic'`), the implementation MUST map it to a Phase 1 `SlideTransitionConfig` or fall back safely. | 01-phase-1-slide-transitions-spec.md — 5.4 Runtime integration contract (alignment to current app) | src/core/presentation/SlideTransitionUtils.js | tests/unit/core/AnimationManager.test.js; tests/unit/utils/StyleResolver.test.js |
| ST-015 | Gate 0 | ✅ | `'magic'` MUST NOT silently behave as Morph in Phase 1. It MUST fall back (see Section 12). | 01-phase-1-slide-transitions-spec.md — 5.4 Runtime integration contract (alignment to current app) | src/core/presentation/SlideTransitionUtils.js; src/core/AnimationManager.js | tests/unit/core/AnimationManager.test.js (magic type) |
| ST-016 | Gate 0 | ✅ | The mapping MUST be centralized (single function/module) so UI, renderer, and tests share the same semantics. | 01-phase-1-slide-transitions-spec.md — 5.4 Runtime integration contract (alignment to current app) | src/core/presentation/SlideTransitionUtils.js | tests/unit/utils/StyleResolver.test.js; tests/unit/core/AnimationManager.test.js |
| ST-017 | Gate 0 | 🟡 | Directional transitions MUST use a single consistent semantic: | 01-phase-1-slide-transitions-spec.md — 6) Direction semantics (normative) | src/core/presentation/SlideTransitionUtils.js; src/core/AnimationManager.js | TBD (Playwright directional visual assertions) |
| ST-018 | Gate 0 | ✅ | During an animated transition, both outgoing and incoming slides MUST be present in the DOM simultaneously. | 01-phase-1-slide-transitions-spec.md — 7.1 General | src/core/AnimationManager.js | tests/unit/core/AnimationManager.test.js (in-flight DOM presence) |
| ST-019 | Gate 0 | 🟡 | The incoming slide MUST already be fully rendered and asset-ready before the transition begins (see readiness gating). | 01-phase-1-slide-transitions-spec.md — 7.1 General | src/core/renderer/PresentationRenderer.js; src/core/presentation/AssetReadiness.js | tests/unit/core/presentation/AssetReadiness.test.js; TBD (renderer integration test / Playwright) |
| ST-020 | Gate 0 | ✅ | Slides MUST be positioned so that animation does not reflow the document. | 01-phase-1-slide-transitions-spec.md — 7.1 General | src/core/AnimationManager.js | tests/unit/core/AnimationManager.test.js (position styles) |
| ST-021 | Gate 0 | 🟡 | Animations MUST use compositor-friendly properties only (translate/opacity/clip-path) and MUST NOT animate layout-affecting properties (top/left/width/height). | 01-phase-1-slide-transitions-spec.md — 7.1 General | src/core/AnimationManager.js | TBD (Playwright style invariants / perf check) |
| ST-022 | Gate 3 | 🟡 | incoming MUST be above outgoing - outgoing MAY remain stationary | 01-phase-1-slide-transitions-spec.md — 7.2 Per-type stacking order | src/core/AnimationManager.js | TBD (Playwright stacking assertions) |
| ST-023 | Gate 3 | 🟡 | outgoing MUST be above incoming - incoming remains stationary (revealed as outgoing moves away) | 01-phase-1-slide-transitions-spec.md — 7.2 Per-type stacking order | src/core/AnimationManager.js | TBD (Playwright stacking assertions) |
| ST-024 | Gate 2 | 🟡 | Transitions MUST NOT start until the incoming slide is ready: | 01-phase-1-slide-transitions-spec.md — 8) Readiness gating (hard requirement) | src/core/renderer/PresentationRenderer.js; src/core/presentation/AssetReadiness.js | tests/unit/core/presentation/AssetReadiness.test.js; TBD (Playwright) |
| ST-025 | Gate 2 | ✅ | The readiness probe is DOM-based (`waitForSlideAssetsReady(rootEl)`), and Phase 1 MUST NOT weaken it. | 01-phase-1-slide-transitions-spec.md — 8) Readiness gating (hard requirement) | src/core/presentation/AssetReadiness.js | tests/unit/core/presentation/AssetReadiness.test.js |
| ST-026 | Gate 2 | 🟡 | The probe MUST consider: - `<img>` elements (load + optional `decode()`) - `<video>` elements (at least first-frame `loadeddata`) - CSS `background-image: url(...)` assets | 01-phase-1-slide-transitions-spec.md — 8) Readiness gating (hard requirement) | src/core/presentation/AssetReadiness.js | tests/unit/core/presentation/AssetReadiness.test.js (partial) |
| ST-027 | Gate 2 | 🟡 | navigation MUST block until readiness succeeds | 01-phase-1-slide-transitions-spec.md — 8) Readiness gating (hard requirement) | src/core/renderer/PresentationRenderer.js | TBD (Playwright navigation gating) |
| ST-028 | Gate 2 | 🟡 | a loading indicator MUST NOT be shown to the audience surface | 01-phase-1-slide-transitions-spec.md — 8) Readiness gating (hard requirement) | src/core/renderer/PresentationRenderer.js | TBD (Playwright audience-clean) |
| ST-029 | Gate 2 | 🟡 | The transition system MUST expose a minimal lifecycle: | 01-phase-1-slide-transitions-spec.md — 9.1 State machine | src/core/renderer/PresentationRenderer.js | TBD (Playwright) |
| ST-030 | Gate 2 | 🟡 | The playback surface MUST surface this lifecycle on the root container via attributes so Playwright can assert: | 01-phase-1-slide-transitions-spec.md — 9.1 State machine | src/core/renderer/PresentationRenderer.js | TBD (Playwright) |
| ST-031 | Gate 0 | 🟡 | outgoing slide DOM element MUST be present and stable | 01-phase-1-slide-transitions-spec.md — 9.2 DOM contract | src/core/AnimationManager.js | tests/unit/core/AnimationManager.test.js (DOM swap mechanics) |
| ST-032 | Gate 0 | 🟡 | incoming slide DOM element MUST be present and stable | 01-phase-1-slide-transitions-spec.md — 9.2 DOM contract | src/core/AnimationManager.js | tests/unit/core/AnimationManager.test.js (DOM swap mechanics) |
| ST-033 | Gate 0 | ✅ | both MUST share a common container coordinate space | 01-phase-1-slide-transitions-spec.md — 9.2 DOM contract | src/core/AnimationManager.js | tests/unit/core/AnimationManager.test.js (absolute positioning) |
| ST-034 | Gate 0 | ✅ | outgoing slide element MUST be removed (or fully hidden and detached without leaving interactive remnants) | 01-phase-1-slide-transitions-spec.md — 9.2 DOM contract | src/core/AnimationManager.js | tests/unit/core/AnimationManager.test.js (remove old content) |
| ST-035 | Gate 0 | ✅ | incoming slide MUST become the only active slide | 01-phase-1-slide-transitions-spec.md — 9.2 DOM contract | src/core/AnimationManager.js | tests/unit/core/AnimationManager.test.js (append new + remove old) |
| ST-036 | Gate 0 | ❌ | Outgoing slide MUST not retain interactive focusable elements that remain tabbable after removal (no focus leaks). | 01-phase-1-slide-transitions-spec.md — 9.2 DOM contract | TBD | TBD |
| ST-037 | Gate 0 | 🟡 | the system MUST queue the newest target and transition to it after the current transition completes (no partial mid-flight jumps) | 01-phase-1-slide-transitions-spec.md — 9.3 Cancellation / re-entrancy | src/core/renderer/PresentationRenderer.js | TBD |
| ST-038 | Gate 0 | 🟡 | the system MUST NOT leak DOM nodes from abandoned intermediate targets | 01-phase-1-slide-transitions-spec.md — 9.3 Cancellation / re-entrancy | src/core/renderer/PresentationRenderer.js | TBD |
| ST-039 | Gate 3 | 🟡 | If both are animated, the sum of opacities MUST NOT exceed 1.2 in a way that causes unacceptable brightness pumping. | 01-phase-1-slide-transitions-spec.md — 10.1 Cross fade (`crossFade`) | src/core/AnimationManager.js | TBD (Playwright visual assertions) |
| ST-040 | Gate 3 | 🟡 | Implementation MUST use `clip-path` (preferred) or an equivalent masking strategy. | 01-phase-1-slide-transitions-spec.md — 10.2 Wipe (`wipe`) | src/core/AnimationManager.js | TBD (Playwright / unit style assertion) |
| ST-041 | Gate 4 | 🟡 | Reduced motion MUST force `type: 'none'`. | 01-phase-1-slide-transitions-spec.md — 11) Accessibility, reduced motion, and user settings | src/core/renderer/PresentationRenderer.js | TBD (Playwright reduced-motion) |
| ST-042 | Gate 4 | 🟡 | The transition system MUST NOT interfere with keyboard focus: - focus MUST remain logically within the presentation chrome (HUD) or within the slide content as designed - no focus traps | 01-phase-1-slide-transitions-spec.md — 11) Accessibility, reduced motion, and user settings | src/core/renderer/PresentationRenderer.js; src/core/AnimationManager.js | TBD (focus regression tests / Playwright) |
| ST-043 | Gate 4 | 🟡 | focus MUST remain logically within the presentation chrome (HUD) or within the slide content as designed - no focus traps | 01-phase-1-slide-transitions-spec.md — 11) Accessibility, reduced motion, and user settings | src/core/renderer/PresentationRenderer.js; src/core/AnimationManager.js | TBD (focus regression tests / Playwright) |
| ST-044 | Gate 4 | 🟡 | Transitions MUST NOT rely on color for meaning. | 01-phase-1-slide-transitions-spec.md — 11) Accessibility, reduced motion, and user settings | src/core/AnimationManager.js | TBD |
| ST-045 | Gate 4 | 🟡 | Any UI that configures transitions MUST use existing PI components and tokens (no hardcoded colors; no new shadows/fonts). | 01-phase-1-slide-transitions-spec.md — 11) Accessibility, reduced motion, and user settings | src/ui/properties/SlideSection.js | tests/unit/ui/SlideSection.test.js (structure only; token audit pending) |
| ST-046 | Gate 4 | 🟡 | MUST fall back to `none` for that navigation event - MUST still perform readiness gating | 01-phase-1-slide-transitions-spec.md — 12) Error handling and fallbacks | src/core/presentation/SlideTransitionUtils.js; src/core/AnimationManager.js; src/core/renderer/PresentationRenderer.js | tests/unit/core/AnimationManager.test.js (fallbacks); tests/unit/core/presentation/AssetReadiness.test.js |
| ST-047 | Gate 4 | 🟡 | MUST still perform readiness gating | 01-phase-1-slide-transitions-spec.md — 12) Error handling and fallbacks | src/core/renderer/PresentationRenderer.js; src/core/presentation/AssetReadiness.js | tests/unit/core/presentation/AssetReadiness.test.js |
| ST-048 | Gate 4 | ✅ | Unsupported transition types MUST fall back to `none`. | 01-phase-1-slide-transitions-spec.md — 12) Error handling and fallbacks | src/core/presentation/SlideTransitionUtils.js | tests/unit/utils/StyleResolver.test.js; tests/unit/core/AnimationManager.test.js |
| ST-049 | Gate 4 | 🟡 | Errors MUST be logged without including slide content or speaker notes. | 01-phase-1-slide-transitions-spec.md — 12) Error handling and fallbacks | src/core/AnimationManager.js; src/core/renderer/PresentationRenderer.js | TBD |
| ST-050 | Gate 4 | ❌ | Fallback decisions MUST emit telemetry using privacy-safe payloads only. | 01-phase-1-slide-transitions-spec.md — 12) Error handling and fallbacks | TBD | UT |
| ST-051 | Gate 5 | ❌ | At minimum, transitions MUST emit privacy-safe telemetry: | 01-phase-1-slide-transitions-spec.md — 13) Telemetry (required for quality gates) | TBD | UT |
| ST-052 | Gate 5 | ❌ | Payload MUST NOT include slide content, notes, or PII. | 01-phase-1-slide-transitions-spec.md — 13) Telemetry (required for quality gates) | TBD | TBD |
| ST-053 | Gate 5 | ❌ | Transitions are user-authored slide/master properties and MUST therefore: | 01-phase-1-slide-transitions-spec.md — 15) Undo/redo, serialization, and collaboration | TBD | TBD |
| ST-054 | Gate 5 | ✅ | When reading stored configs, the runtime MUST clamp and normalize values (duration bounds, direction validity) so that corrupted/old documents cannot crash playback. | 01-phase-1-slide-transitions-spec.md — 15) Undo/redo, serialization, and collaboration | src/core/presentation/SlideTransitionUtils.js; src/utils/StyleResolver.js | tests/unit/utils/StyleResolver.test.js (clamp + direction normalization) |
| ST-055 | Gate 1 | ✅ | It MUST mirror the cascade model used by color themes: | 02-transition-inheritance-and-property-inspector-ux.md — 0) Scope | src/utils/StyleResolver.js | tests/unit/utils/StyleResolver.test.js (cascade + source) |
| ST-056 | Gate 0 | ✅ | Slide Transition configuration MUST cascade through the same hierarchy as color themes: | 02-transition-inheritance-and-property-inspector-ux.md — 1.1 Hierarchy | src/utils/StyleResolver.js | tests/unit/utils/StyleResolver.test.js (slide→layout→master→default) |
| ST-057 | Gate 0 | ✅ | **`null` MUST mean “inherit”.** | 02-transition-inheritance-and-property-inspector-ux.md — 1.3 Null-clears-override rule | src/utils/StyleResolver.js | tests/unit/utils/StyleResolver.test.js (null = inherit) |
| ST-058 | Gate 0 | ✅ | The UI MUST provide a “Reset to inherited” action that writes `null` at that level. | 02-transition-inheritance-and-property-inspector-ux.md — 1.3 Null-clears-override rule | src/ui/properties/SlideSection.js | tests/unit/ui/SlideSection.test.js (reset dispatch) |
| ST-059 | Gate 0 | ✅ | Phase 1 MUST store transition configuration in a way that: | 02-transition-inheritance-and-property-inspector-ux.md — 1.4 Canonical storage (Phase 1) | src/core/store/handlers/SlideHandlers.js; src/core/store/handlers/MasterHandlers.js; src/utils/StyleResolver.js | tests/unit/utils/StyleResolver.test.js |
| ST-060 | Gate 0 | ✅ | Slide records MUST support both: - legacy `transition` (string) (already present today), and - `styleAssignments.slideTransition` (object or null) (Phase 1 canonical). | 02-transition-inheritance-and-property-inspector-ux.md — 1.4 Canonical storage (Phase 1) | src/utils/StyleResolver.js; src/core/store/handlers/SlideHandlers.js | tests/unit/utils/StyleResolver.test.js (legacy + canonical) |
| ST-061 | Gate 0 | ✅ | Layout master records (type `layoutMaster`) MUST store the optional override under: - `styleAssignments.slideTransition` | 02-transition-inheritance-and-property-inspector-ux.md — 1.4 Canonical storage (Phase 1) | src/core/store/handlers/MasterHandlers.js; src/utils/StyleResolver.js | tests/unit/utils/StyleResolver.test.js (layout override) |
| ST-062 | Gate 0 | ✅ | Master preset records (type `slideMasterPreset`) MUST store the default under: - `styleAssignments.slideTransition` | 02-transition-inheritance-and-property-inspector-ux.md — 1.4 Canonical storage (Phase 1) | src/core/store/handlers/MasterHandlers.js; src/utils/StyleResolver.js | tests/unit/utils/StyleResolver.test.js (master override) |
| ST-063 | Gate 0 | ✅ | A missing `styleAssignments` object MUST be treated as “no override set here”. | 02-transition-inheritance-and-property-inspector-ux.md — 1.4 Canonical storage (Phase 1) | src/utils/StyleResolver.js | tests/unit/utils/StyleResolver.test.js (missing styleAssignments) |
| ST-064 | Gate 0 | ✅ | The current store has a legacy `slide.transition` string. Phase 1 MUST define a migration behavior: | 02-transition-inheritance-and-property-inspector-ux.md — 1.5 Backward compatibility (existing `slide.transition`) | src/utils/StyleResolver.js; src/core/presentation/SlideTransitionUtils.js | tests/unit/utils/StyleResolver.test.js (legacy mapping rules) |
| ST-065 | Gate 0 | 🟡 | it MUST be mapped to `styleAssignments.slideTransition` using the following rules: - `'fade'` → `{ type: 'crossFade', durationMs: 300, easing: 'ease-in-out' }` - `'push'` → `{ type: 'push', direction: 'right', durationMs: 300, easing: 'ease-in-out' }` (default direction) - `'slide'` → `{ type: 'cover', direction: 'right', durationMs: 300, easing: 'ease-in-out' }` (closest Phase 1 semantic) - `'magic'` → Phase 1 MUST treat as unsupported (Morph is Phase 2) and MUST fall back safely (and MUST report telemetry `transition_fallback_to_none` or `transition_unsupported`). | 02-transition-inheritance-and-property-inspector-ux.md — 1.5 Backward compatibility (existing `slide.transition`) | src/core/presentation/SlideTransitionUtils.js; src/utils/StyleResolver.js | tests/unit/utils/StyleResolver.test.js; tests/unit/core/AnimationManager.test.js (mapping; telemetry pending) |
| ST-066 | Gate 0 | 🟡 | `'magic'` → Phase 1 MUST treat as unsupported (Morph is Phase 2) and MUST fall back safely (and MUST report telemetry `transition_fallback_to_none` or `transition_unsupported`). | 02-transition-inheritance-and-property-inspector-ux.md — 1.5 Backward compatibility (existing `slide.transition`) | src/core/presentation/SlideTransitionUtils.js | tests/unit/core/AnimationManager.test.js (fallback; telemetry pending) |
| ST-067 | Gate 0 | ❌ | Migration MUST be deterministic and run through undo/redo-safe store actions when triggered by user edits. | 02-transition-inheritance-and-property-inspector-ux.md — 1.5 Backward compatibility (existing `slide.transition`) | TBD | TBD |
| ST-068 | Gate 0 | ❌ | File load migration (if any) MUST be idempotent (loading/saving repeatedly must not drift values). | 02-transition-inheritance-and-property-inspector-ux.md — 1.5 Backward compatibility (existing `slide.transition`) | TBD | TBD |
| ST-069 | Gate 0 | ✅ | The effective transition for a slide MUST be computed as: | 02-transition-inheritance-and-property-inspector-ux.md — 1.6 Effective transition resolution | src/utils/StyleResolver.js | tests/unit/utils/StyleResolver.test.js |
| ST-070 | Gate 0 | ✅ | The resolver MUST also return a source descriptor used by UI: | 02-transition-inheritance-and-property-inspector-ux.md — 1.6 Effective transition resolution | src/utils/StyleResolver.js | tests/unit/utils/StyleResolver.test.js (source + sourceId) |
| ST-071 | Gate 1 | ✅ | A new **Slide Transition** section MUST appear in the Property Inspector when a slide is selected. | 02-transition-inheritance-and-property-inspector-ux.md — 2.1 Placement | src/ui/properties/SlideSection.js | tests/unit/ui/SlideSection.test.js (Transition Section) |
| ST-072 | Gate 1 | ✅ | It MUST be shown only when the selection is empty (same display condition as Slide properties). | 02-transition-inheritance-and-property-inspector-ux.md — 2.1 Placement | src/ui/properties/SlideSection.js | tests/unit/ui/SlideSection.test.js (SlideSection visibility rules) |
| ST-073 | Gate 1 | ✅ | The Transition section MUST be implemented inside the existing `SlideSection` architecture (same surface as Layout/Colors/Typography). | 02-transition-inheritance-and-property-inspector-ux.md — 2.1 Placement | src/ui/properties/SlideSection.js | tests/unit/ui/SlideSection.test.js |
| ST-074 | Gate 1 | 🟡 | It MUST use existing components (`Section`, `Button`, `NumberInput`, `SegmentedControl`, and `Flyout`) and existing CSS tokens. | 02-transition-inheritance-and-property-inspector-ux.md — 2.1 Placement | src/ui/properties/SlideSection.js | tests/unit/ui/SlideSection.test.js (uses Section/Button/NumberInput/Flyout; SegmentedControl pending) |
| ST-075 | Gate 1 | 🟡 | It MUST NOT introduce new colors/shadows/fonts; it MUST use global CSS variables. | 02-transition-inheritance-and-property-inspector-ux.md — 2.1 Placement | src/ui/properties/SlideSection.js | TBD (token audit / Playwright) |
| ST-076 | Gate 1 | ✅ | The section MUST be collapsible, consistent with other PI sections. | 02-transition-inheritance-and-property-inspector-ux.md — 2.2 Section header | src/ui/properties/SlideSection.js | tests/unit/ui/SlideSection.test.js (Section structure) |
| ST-077 | Gate 1 | ✅ | The first row MUST show: | 02-transition-inheritance-and-property-inspector-ux.md — 2.3 Primary row (transition picker) | src/ui/properties/SlideSection.js | tests/unit/ui/SlideSection.test.js (Transition Section: effective name + primary row) |
| ST-078 | Gate 1 | ✅ | The transition section MUST reuse the badge semantics from the Slide section theme controls: | 02-transition-inheritance-and-property-inspector-ux.md — 2.4 Inheritance badge rules | src/ui/properties/SlideSection.js | tests/unit/ui/SlideSection.test.js (Transition Section: Inherited/Override badge) |
| ST-079 | Gate 1 | ✅ | The section MUST also display a source line: | 02-transition-inheritance-and-property-inspector-ux.md — 2.4 Inheritance badge rules | src/ui/properties/SlideSection.js; src/utils/StyleResolver.js | tests/unit/ui/SlideSection.test.js (Transition Section: source line) |
| ST-080 | Gate 1 | ✅ | clicking reset MUST set `styleAssignments.slideTransition = null` for that slide | 02-transition-inheritance-and-property-inspector-ux.md — 2.5 “Reset to inherited” | src/ui/properties/SlideSection.js | tests/unit/ui/SlideSection.test.js (reset dispatch) |
| ST-081 | Gate 1 | 🟡 | The picker MUST use the same implementation pattern as the existing layout picker flyout (`SlideSection.openLayoutFlyout()`): | 02-transition-inheritance-and-property-inspector-ux.md — 2.6 Transition picker flyout (reuse existing component) | src/ui/properties/SlideSection.js | tests/unit/ui/SlideSection.test.js (flyout opens) |
| ST-082 | Gate 1 | ✅ | Flyout root element MUST set `role="dialog"` and `aria-label="Select Transition"`. | 02-transition-inheritance-and-property-inspector-ux.md — 2.6 Transition picker flyout (reuse existing component) | src/ui/properties/SlideSection.js; src/ui/components/Flyout.js | tests/unit/ui/SlideSection.test.js (Transition Section ARIA) |
| ST-083 | Gate 1 | ✅ | The options container MUST set `role="listbox"`. | 02-transition-inheritance-and-property-inspector-ux.md — 2.6 Transition picker flyout (reuse existing component) | src/ui/properties/SlideSection.js | tests/unit/ui/SlideSection.test.js (Transition Section ARIA) |
| ST-084 | Gate 1 | ✅ | Each option MUST set `role="option"` and `aria-selected`. | 02-transition-inheritance-and-property-inspector-ux.md — 2.6 Transition picker flyout (reuse existing component) | src/ui/properties/SlideSection.js | tests/unit/ui/SlideSection.test.js (Transition Section ARIA) |
| ST-085 | Gate 1 | ✅ | Escape MUST close the flyout. | 02-transition-inheritance-and-property-inspector-ux.md — 2.6 Transition picker flyout (reuse existing component) | src/ui/properties/SlideSection.js; src/ui/components/Flyout.js | tests/unit/ui/SlideSection.test.js (Escape closes flyout) |
| ST-086 | Gate 1 | ✅ | The flyout MUST present options as a grid (thumbnail + label): | 02-transition-inheritance-and-property-inspector-ux.md — 2.6 Transition picker flyout (reuse existing component) | src/ui/properties/SlideSection.js | tests/unit/ui/SlideSection.test.js (Transition Section ARIA: grid + thumbnail + label) |
| ST-087 | Gate 1 | ✅ | Clicking an option MUST apply it immediately and close the flyout. | 02-transition-inheritance-and-property-inspector-ux.md — 2.6 Transition picker flyout (reuse existing component) | src/ui/properties/SlideSection.js | tests/unit/ui/SlideSection.test.js (selection applies + closes flyout) |
| ST-088 | Gate 1 | ✅ | The current option MUST have `aria-selected="true"`. | 02-transition-inheritance-and-property-inspector-ux.md — 2.6 Transition picker flyout (reuse existing component) | src/ui/properties/SlideSection.js | tests/unit/ui/SlideSection.test.js (Transition Section ARIA) |
| ST-089 | Gate 1 | ✅ | After a specific transition is selected, the section MUST show controls: | 02-transition-inheritance-and-property-inspector-ux.md — 2.7 Controls shown after selection | src/ui/properties/SlideSection.js | tests/unit/ui/SlideSection.test.js (controls visibility); tests/unit/ui/components/NumberInput.test.js (shiftStep) |
| ST-090 | Gate 1 | ✅ | The duration control MUST use the existing `NumberInput` component. | 02-transition-inheritance-and-property-inspector-ux.md — 2.7 Controls shown after selection | src/ui/properties/SlideSection.js | tests/unit/ui/SlideSection.test.js (duration input exists) |
| ST-091 | Gate 1 | ✅ | Direction UI MUST be a compact button grid (segmented control style) using existing button primitives. | 02-transition-inheritance-and-property-inspector-ux.md — 2.7 Controls shown after selection | src/ui/properties/SlideSection.js | tests/unit/ui/SlideSection.test.js (direction grid) |
| ST-092 | Gate 1 | ✅ | Each direction button MUST have an aria-label like: - `"Direction: from left"` - `"Direction: from top-left"` | 02-transition-inheritance-and-property-inspector-ux.md — 2.7 Controls shown after selection | src/ui/properties/SlideSection.js | tests/unit/ui/SlideSection.test.js (direction aria-labels) |
| ST-093 | Gate 1 | ✅ | Duration and Direction controls MUST be hidden (or disabled) because they have no effect. | 02-transition-inheritance-and-property-inspector-ux.md — 2.8 None | src/ui/properties/SlideSection.js | tests/unit/ui/SlideSection.test.js (none hides rows) |
| ST-094 | Gate 1 | ✅ | Changing any control MUST be recorded as an undoable store action (except transient scrubbing if the existing `skipHistory` pattern is used). | 02-transition-inheritance-and-property-inspector-ux.md — 2.8 None | src/ui/properties/SlideSection.js | tests/unit/ui/SlideSection.test.js (skipHistory transient only) |
| ST-095 | Gate 1 | 🟡 | the Transition section MUST be available | 02-transition-inheritance-and-property-inspector-ux.md — 3.1 Master preset default | src/ui/properties/SlideSection.js | TBD |
| ST-096 | Gate 1 | 🟡 | the Transition section MUST be available | 02-transition-inheritance-and-property-inspector-ux.md — 3.2 Layout master override | src/ui/properties/SlideSection.js | TBD |
| ST-097 | Gate 1 | 🟡 | it MUST show inheritance information from the parent master preset | 02-transition-inheritance-and-property-inspector-ux.md — 3.2 Layout master override | src/ui/properties/SlideSection.js; src/utils/StyleResolver.js | TBD |
| ST-098 | Gate 1 | ✅ | Master/layout transition values MUST live on the master entities (in `slideMasterPresets`) so that they serialize and sync exactly like other master properties. | 02-transition-inheritance-and-property-inspector-ux.md — 3.2 Layout master override | src/core/store/handlers/MasterHandlers.js; src/utils/StyleResolver.js | tests/unit/utils/StyleResolver.test.js (master override) |
| ST-099 | Gate 1 | ❌ | Phase 1 MUST define behavior for future multi-slide selection: - If multiple slides are selected and their effective transitions differ, the transition picker MUST show a `Mixed` state. - Applying a transition in mixed state MUST set overrides on all selected slides. | 02-transition-inheritance-and-property-inspector-ux.md — 4) Mixed / multi-selection | TBD | TBD |
| ST-100 | Gate 1 | ❌ | If multiple slides are selected and their effective transitions differ, the transition picker MUST show a `Mixed` state. - Applying a transition in mixed state MUST set overrides on all selected slides. | 02-transition-inheritance-and-property-inspector-ux.md — 4) Mixed / multi-selection | TBD | TBD |
| ST-101 | Gate 1 | ❌ | Applying a transition in mixed state MUST set overrides on all selected slides. | 02-transition-inheritance-and-property-inspector-ux.md — 4) Mixed / multi-selection | TBD | TBD |
| ST-102 | Gate 1 | ❌ | All transition changes MUST be undoable: | 02-transition-inheritance-and-property-inspector-ux.md — 5) Undo/Redo | TBD | TBD |
| ST-103 | Gate 1 | ❌ | The Transition section MUST follow the Property Inspector v2 ARIA conventions. | 02-transition-inheritance-and-property-inspector-ux.md — 6) Accessibility requirements | TBD | TBD |
| ST-104 | Gate 1 | ❌ | Screen reader announcements MUST be emitted for: - “Transition changed to …” - “Transition duration … ms” - “Transition direction …” - “Transition reset to inherited …” | 02-transition-inheritance-and-property-inspector-ux.md — 6) Accessibility requirements | TBD | TBD |
| ST-105 | Gate 1 | ❌ | The Transition UI MUST NOT expose slide content in accessibility labels beyond the transition name and control values. | 02-transition-inheritance-and-property-inspector-ux.md — 6) Accessibility requirements | TBD | TBD |
| ST-106 | Gate 2 | 🟡 | Transitions MUST NOT begin until the incoming slide is fully ready: | 03-performance-readiness-and-caching.md — 1.1 Decode-first transitions | src/core/renderer/PresentationRenderer.js; src/core/presentation/AssetReadiness.js | tests/unit/core/presentation/AssetReadiness.test.js; TBD (Playwright) |
| ST-107 | Gate 2 | 🟡 | the system MUST NOT show a loading indicator in the audience surface | 03-performance-readiness-and-caching.md — 1.2 Audience must never see loading UI | src/core/renderer/PresentationRenderer.js | TBD (Playwright audience surface) |
| ST-108 | Gate 2 | 🟡 | If user requests Next/Prev and the incoming slide is not ready, navigation MUST block until ready. | 03-performance-readiness-and-caching.md — 1.3 Navigation gating | src/core/renderer/PresentationRenderer.js | TBD (Playwright navigation gating) |
| ST-109 | Gate 2 | ❌ | Blocking MUST be bounded by error handling; if readiness fails due to permanent error, fallback behavior MUST occur (see Section 6). | 03-performance-readiness-and-caching.md — 1.3 Navigation gating | TBD | TBD |
| ST-110 | Gate 2 | ✅ | Readiness gating MUST be implemented as a single shared utility (no duplicated per-transition readiness code). | 03-performance-readiness-and-caching.md — 1.3 Navigation gating | src/core/presentation/AssetReadiness.js | tests/unit/core/presentation/AssetReadiness.test.js |
| ST-111 | Gate 2 | 🟡 | Readiness gating MUST be compatible with performance targets (avoid layout thrashing). | 03-performance-readiness-and-caching.md — 1.3 Navigation gating | src/core/presentation/AssetReadiness.js | TBD (perf profiling / Playwright stress) |
| ST-112 | Gate 5 | ❌ | The transition system MUST cooperate with the Presentation Mode cache tiers: | 03-performance-readiness-and-caching.md — 2) Cache tiers (Phase 1 alignment) | TBD | TBD |
| ST-113 | Gate 5 | ❌ | Navigation to HOT tier slides MUST be instant *after readiness gating*. | 03-performance-readiness-and-caching.md — 2) Cache tiers (Phase 1 alignment) | TBD | TBD |
| ST-114 | Gate 5 | ❌ | HOT tier MUST be “fully load + fully decode + render-ready”. | 03-performance-readiness-and-caching.md — 2) Cache tiers (Phase 1 alignment) | TBD | TBD |
| ST-115 | Gate 5 | ❌ | MUST preload HOT tier (±1) | 03-performance-readiness-and-caching.md — 3.1 Prefetch on enter | TBD | TBD |
| ST-116 | Gate 5 | ❌ | MUST deprioritize background prefetch to avoid jank. | 03-performance-readiness-and-caching.md — 3.2 Deprioritize prefetch during navigation | TBD | TBD |
| ST-117 | Gate 2 | 🟡 | The readiness probe MUST validate: | 03-performance-readiness-and-caching.md — 4.1 Readiness probe | src/core/presentation/AssetReadiness.js | tests/unit/core/presentation/AssetReadiness.test.js (partial) |
| ST-118 | Gate 2 | 🟡 | Phase 1 MUST preserve this behavior so transitions never show half-ready assets. | 03-performance-readiness-and-caching.md — 4.2 What counts as “visible” | src/core/renderer/PresentationRenderer.js; src/core/presentation/AssetReadiness.js | TBD (Playwright golden deck) |
| ST-119 | Gate 2 | ❌ | If future optimization is desired (e.g., excluding assets hidden for builds), it MUST not reduce correctness and MUST be proven by tests (no regressions where a build asset becomes visible immediately after transition). | 03-performance-readiness-and-caching.md — 4.2 What counts as “visible” | TBD | TBD |
| ST-120 | Gate 5 | ❌ | Transitions MUST not cause performance regressions: | 03-performance-readiness-and-caching.md — 5) Timing budgets | TBD | Perf |
| ST-121 | Gate 5 | ❌ | First frame after transition completes MUST present within the overall Presentation Mode performance bar. | 03-performance-readiness-and-caching.md — 5) Timing budgets | TBD | Perf |
| ST-122 | Gate 5 | ❌ | The transition animation itself MUST maintain 60fps under normal conditions. | 03-performance-readiness-and-caching.md — 5) Timing budgets | TBD | Perf |
| ST-123 | Gate 2 | ❌ | The system MUST proceed with navigation after a bounded wait (configurable; default 2000ms). | 03-performance-readiness-and-caching.md — 6.1 Asset readiness fails | TBD | TBD |
| ST-124 | Gate 2 | ❌ | The bounded wait MUST be implemented without blocking the UI thread. | 03-performance-readiness-and-caching.md — 6.1 Asset readiness fails | TBD | TBD |
| ST-125 | Gate 2 | ❌ | The transition MUST fall back to `none` for that navigation event. | 03-performance-readiness-and-caching.md — 6.1 Asset readiness fails | TBD | TBD |
| ST-126 | Gate 2 | ❌ | The audience view MUST render a safe placeholder (no crash, no broken DOM). | 03-performance-readiness-and-caching.md — 6.1 Asset readiness fails | TBD | TBD |
| ST-127 | Gate 2 | ❌ | The readiness probe already applies a per-asset timeout (default 8000ms). Phase 1 MUST define which timeout governs the bounded-wait behavior to avoid double timeouts. | 03-performance-readiness-and-caching.md — 6.1 Asset readiness fails | TBD | TBD |
| ST-128 | Gate 2 | ✅ | The transition MUST fall back to `none`. | 03-performance-readiness-and-caching.md — 6.2 Animation engine missing | src/core/AnimationManager.js | tests/unit/core/AnimationManager.test.js (missing anime gracefully) |
| ST-129 | Gate 2 | 🟡 | Readiness gating MUST still be enforced. | 03-performance-readiness-and-caching.md — 6.2 Animation engine missing | src/core/renderer/PresentationRenderer.js; src/core/presentation/AssetReadiness.js | tests/unit/core/presentation/AssetReadiness.test.js; TBD (Playwright integration) |
| ST-130 | Gate 5 | ❌ | The following telemetry events MUST exist for quality gates: | 03-performance-readiness-and-caching.md — 7) Telemetry requirements | TBD | UT |
| ST-131 | Gate 5 | ❌ | Readiness code MUST NOT leak URLs or asset identifiers into telemetry. | 03-performance-readiness-and-caching.md — 8) Security & privacy constraints | TBD | UT |
| ST-132 | Gate 5 | ❌ | Test-only hooks (e.g., deterministic readiness delays) MUST remain explicitly test-only and MUST NOT be documented as a user feature. | 03-performance-readiness-and-caching.md — 8) Security & privacy constraints | TBD | TBD |
| ST-133 | Gate 5 | ❌ | Transition animations MUST be GPU-friendly (transform/opacity/clip-path) and MUST not animate layout properties. | 03-performance-readiness-and-caching.md — 9) Performance constraints | TBD | TBD |
| ST-134 | Gate 5 | ❌ | Readiness probing MUST avoid repeated `getComputedStyle` calls in tight loops during navigation; any expensive scanning SHOULD be bounded and amortized. | 03-performance-readiness-and-caching.md — 9) Performance constraints | TBD | TBD |
| ST-135 | Gate 5 | ❌ | Unit tests MUST cover: | 04-testing-and-verification.md — 1.1 Unit tests (Vitest) | TBD | UT |
| ST-136 | Gate 5 | ❌ | Playwright MUST enforce: | 04-testing-and-verification.md — 1.2 E2E tests (Playwright) | TBD | E2E |
| ST-137 | Gate 5 | ❌ | At minimum, Playwright MUST include deterministic assertions for: | 04-testing-and-verification.md — 1.3 Visual verification | TBD | E2E |
| ST-138 | Gate 5 | ❌ | A deterministic fixture deck MUST exist that covers: | 04-testing-and-verification.md — 2) Golden decks (required fixtures) | TBD | TBD |
| ST-139 | Gate 5 | ❌ | The fixture MUST document expected behavior. | 04-testing-and-verification.md — 2) Golden decks (required fixtures) | TBD | TBD |
| ST-140 | Gate 5 | ❌ | A perf gate MUST validate: | 04-testing-and-verification.md — 4) Performance validation | TBD | Perf |
| ST-141 | Gate 5 | ❌ | Every MUST/MUST NOT clause in the transitions spec suite MUST map to at least one automated verification: | 04-testing-and-verification.md — 5) Traceability requirements | TBD | TBD |

This table is generated from the normative requirements (see `MUST-index.md`); keep it in sync when the requirements change.
