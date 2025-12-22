# Morph (PowerPoint-style) — Delivery Ledger & Gate Plan

**Goal**: ship Morph with **no spec/implementation gaps**, enforced by tests.

Primary spec:
- `documentation/01-specs/slides/transitions/05-morph-slide-transition-spec.md`

References (shared contracts Morph must not contradict):
- `documentation/01-specs/slides/transitions/01-phase-1-slide-transitions-spec.md`
- `documentation/01-specs/slides/transitions/03-performance-readiness-and-caching.md`
- `documentation/01-specs/slides/transitions/04-testing-and-verification.md`
- App principles: `documentation/00-product/principles.md`

---

## Principles alignment (non-negotiable)

This plan MUST satisfy the app principles:
- Small incremental changes with mandatory validation.
- Tests are mandatory:
  - Unit tests MUST use **Vitest** (not Jest).
  - E2E MUST use Playwright.
- Design system and theming discipline:
  - UI MUST use global components and global CSS variables.
  - No hardcoded colors, fonts, shadows.
  - UI MUST work in light and dark mode.
- Security & privacy:
  - No slide content, URLs, asset identifiers, or code content in telemetry.
  - Third-party dependencies must be justified and reviewed.
- Performance:
  - Transition must not regress the Presentation performance baseline.
- Compatibility:
  - Must be compatible with undo/redo.
  - Must be compatible with storage/serialization.
  - Must be compatible with realtime collaboration.

---

## Version meaning (implementation contract)

- **V1**: implements **everything currently described** in the Morph spec.
  - If something is not implementable in V1, it MUST be removed from the spec or explicitly moved to V2/V3.
  - “Spec complete” means: the implementation + tests reach the exit criteria of all V1 gates.

- **V2**: best‑in‑class upgrades that do **not** change V1’s core contracts (readiness, no-blank-stage, privacy, determinism), but improve visual quality per element category.

- **V3**: major capability expansions that may require new product decisions and/or larger architectural change (still must preserve V1 contracts).

---

## Scope by version

### V1 (ship)
- Add transition type: `morph`.
- Matching: L0-only, name-based, deterministic duplicates handling.
- Interpolation: base geometry + opacity, plus “shared PI” interpolation with zero-equivalent semantics.
- Fallbacks: per-element cross-fade when incompatible; per-navigation fallback to `none` under readiness bounded-wait timeout.
- Readiness: MUST use the shared readiness contract and maintain “no audience loader” rules.
- Backgrounds: solid/gradient/image/video/code MUST cross-fade during Morph.
- Video + Code continuity: preserve runtime state when identities match using **state transfer or instance reuse** (per spec).
- Telemetry: emit the same transition + readiness/perf telemetry events as other transitions (privacy-safe).
- Testing: Vitest + Playwright coverage per spec, including continuity assertions.

V1 explicit non-goals:
- No new UI surfaces beyond existing Transition/Layer patterns.
- No third-party libraries required for V1.

### V2 (quality upgrades)
These items are explicitly **out of V1** and must not block V1 shipping.

- Image morphing quality upgrades (best-in-class):
  - Image→Image “warp morph” for different images (e.g., optical flow / feature-based warp) while preserving V1 readiness and perf budgets.
  - A deterministic precompute pipeline with bounded time budgets; fall back to V1 cross-fade when compute is too slow.

V2 dependency constraints (required):
- Any optical-flow / vision approach MUST be evaluated for:
  - bundle size impact
  - CPU/GPU cost
  - startup/initialization cost
  - determinism across devices
  - security/privacy implications
- If a third-party library is used (e.g., WASM vision stack), it MUST be gated behind:
  - explicit perf budgets
  - graceful fallback to V1
  - tests proving “no blank stage” and “no audience loader” invariants still hold

- Shape morphing quality upgrades:
  - Vector/path morphing for compatible vector shapes (same topology constraints), otherwise fallback to V1 cross-fade.

- Text morphing quality upgrades:
  - Per-line or per-run interpolation for typography changes (still deterministic), otherwise fallback.

### V3 (capability expansions)
These items likely require new product decisions:

- Matching beyond L0 (groups/nested children), including explainability and conflict UI.
- Per-character/glyph text morph.
- Cross-type semantic morphing beyond the current pairing matrix (e.g., smart conversions).

---

## Non‑negotiable shipping discipline
- Small, incremental changes.
- Red → Green → Refactor for every increment.
- Every increment adds/updates Playwright assertions for:
  - transition lifecycle attributes
  - audience-clean invariants
  - no-blank-stage invariant
- Every logic increment adds Vitest tests (no Jest).
- Every bug fix starts with a failing regression test.
- This ledger must be kept current.

Design system discipline (required):
- Any new UI for Morph configuration MUST reuse existing Property Inspector components/variants.
- Any visual indicators (e.g., duplicate-name conflicts) MUST be implemented with tokens/variables and verified in light/dark.

Traceability discipline (required):
- Every MUST/MUST NOT clause added to the Morph spec MUST map to a ledger row.
- Every ledger row MUST map to at least one automated verification (Vitest and/or Playwright).

---

## Gate plan (V1)

### Gate 0 — Contracts + storage + normalization
Exit criteria:
- `morph` is a recognized transition type in the normalization/resolution pipeline.
- Storage/serialization round-trip supports `morph`.
- Reduced motion forces `none` for `morph`.
- Legacy `magic` handling is explicitly defined (do not silently behave as morph unless intentionally migrated).

Principles alignment (required):
- No document mutations during playback (undo/redo + collaboration safe).
- Telemetry payloads are privacy-safe.

Evidence required:
- Vitest: storage round-trip + normalization + reduced-motion mapping

Suggested evidence commands:
- `npm test`

### Gate 1 — Runtime orchestration + readiness integration
Exit criteria:
- Incoming slide is fully ready before morph starts (shared readiness contract).
- Bounded-wait timeout forces fallback to `none` with correct marker class.
- Audience never sees a loading indicator.
- Both outgoing + incoming exist in DOM during transition; no blank stage.

Principles alignment (required):
- Reuse shared readiness utility; no per-transition readiness code.
- Must not regress presentation performance baseline.

Evidence required:
- Vitest: readiness timeout + fallback behavior
- Playwright: no-blank-stage + DOM overlap + audience-clean

### Gate 2 — Matching engine (L0 name-based)
Exit criteria:
- Deterministic matching by layer name.
- Duplicate conflicts resolved deterministically (top-most) and exposed for tests.

Design/theming requirements (required):
- Conflict indicator uses existing components/variants and global tokens; verified in light/dark.

Evidence required:
- Vitest: matching determinism, duplicate tie-breaks

### Gate 3 — Interpolation engine (PI-driven)
Exit criteria:
- Base geometry/opacity interpolation for matched pairs.
- Shared PI property interpolation when compatible.
- Zero-equivalent semantics for missing properties.
- Per-element cross-fade fallback when incompatible.

Performance requirements (required):
- Favor compositor-friendly animation (transform/opacity).
- Avoid per-frame heavy DOM queries.

Evidence required:
- Vitest: property interpolation + zero-equivalent mapping + fallback decisions

### Gate 4 — Stateful fill continuity (Video + Code)
Exit criteria:
- Same-identity video: preserve playback position + play/pause (best-effort under autoplay policies).
- Same-identity code fill: preserve timebase (no restart).
- No duplicated instances after completion (no double video decode, no double RAF loops).

Security/privacy requirements (required):
- No asset identifiers or code content in telemetry.

Evidence required:
- Playwright: continuity assertions + leak/duplication guard

### Gate 5 — Performance + telemetry quality gate
Exit criteria:
- Transition animation stays within perf budgets under normal conditions.
- No DOM/node leaks after repeated navigation.
- Telemetry coverage matches existing transition telemetry events (privacy-safe).

Reliability requirements (required):
- Rapid navigation (re-entrancy) does not leak DOM nodes or leave multiple active transitions.

Evidence required:
- Playwright: stress navigation loop
- Telemetry unit tests (privacy-safe payloads)

---

## Traceability row template (required)
```yaml
id: MOR-001
level: MUST # MUST|SHOULD|MAY
spec:
  - file: documentation/01-specs/slides/transitions/05-morph-slide-transition-spec.md
    section: "11) Readiness gating & lifecycle"
    clauses:
      - "Morph MUST rely on the shared readiness utility"
impl:
  owners: ["core", "ui"]
  files:
    - src/core/renderer/PresentationRenderer.js
    - src/core/presentation/AssetReadiness.js
    - src/core/AnimationManager.js
tests:
  unit:
    - file: tests/unit/...
      assertions:
        - "blocks until ready"
  e2e:
    - file: tests/e2e/...
      assertions:
        - "no blank stage"
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

## Ledger (V1)

Status legend: ✅ Done (locked) · 🟡 In progress · ❌ Not started · ⛔ Blocked

| MOR-ID | Gate | Status | Requirement summary | Spec location | Implementation | Automated verification |
|---|---|---|---|---|---|---|
| MOR-001 | Gate 0 | ✅ | `morph` is a canonical transition type and normalizes safely; storage round-trip supports `morph`. | 05-morph-slide-transition-spec.md — 3) Transition configuration | `src/core/presentation/SlideTransitionUtils.js` + storage | Vitest: `tests/unit/core/presentation/SlideTransitionUtils.morph.test.js`, `tests/unit/storage/SlideTransition.storage-roundtrip.test.js` |
| MOR-002 | Gate 1 | ✅ | Morph MUST NOT start until incoming slide is ready; bounded wait fallback to `none`. | 05-morph-slide-transition-spec.md — 11) Readiness gating & lifecycle | `src/core/renderer/PresentationRenderer.js` (readiness gate) | Vitest: `tests/unit/core/renderer/PresentationRenderer.readiness-timeout.test.js` |
| MOR-003A | Gate 1 | ✅ | Outgoing+incoming overlap in DOM during transition (no gap/blank stage risk). | 05-morph-slide-transition-spec.md — 10.1 Core invariant | `src/core/AnimationManager.js` + renderer orchestration | Playwright: `tests/e2e/specs/functional/presentation-transition-no-blank.spec.ts` (overlap window check) |
| MOR-003B | Gate 1 | ✅ | No blank stage frame during morph transition. | 05-morph-slide-transition-spec.md — 10.1 Core invariant | `src/core/AnimationManager.js` + renderer orchestration | Playwright: `tests/e2e/specs/functional/presentation-transition-no-blank.spec.ts` (per-frame background sampling) |
| MOR-003C | Gate 1 | ✅ | Incoming slide stays hidden until AnimationManager applies start state (prevents flash). | 05-morph-slide-transition-spec.md — 10.1 Core invariant | `src/core/renderer/PresentationRenderer.js` + `src/core/AnimationManager.js` | Vitest: `tests/unit/core/renderer/PresentationRenderer.transition-visibility.test.js` |
| MOR-003D | Gate 1 | ✅ | Legacy `magic` remains unsupported unless explicitly mapped (no silent morph). | 05-morph-slide-transition-spec.md — 3) Transition configuration | `src/core/presentation/SlideTransitionUtils.js` + `src/utils/StyleResolver.js` | Vitest: `tests/unit/core/renderer/PresentationRenderer.legacy-transition-telemetry.test.js` |
| MOR-003E | Gate 1 | ✅ | Reduced-motion forces `none` for `morph` (forced transition fallback). | 05-morph-slide-transition-spec.md — 3) Transition configuration | `src/core/renderer/PresentationRenderer.js` | Vitest: `tests/unit/core/renderer/PresentationRenderer.reduced-motion.test.js` |
| MOR-004 | Gate 2 | ✅ | Name-based deterministic matching; duplicates resolved top-most; exposed for tests. | 05-morph-slide-transition-spec.md — 5) Matching model | `src/core/presentation/MorphMatching.js` + `src/core/AnimationManager.js` | Vitest: `tests/unit/core/presentation/MorphMatching.test.js` · Playwright: `tests/e2e/specs/functional/presentation-transition-no-blank.spec.ts` (duplicate determinism) |
| MOR-004B | Gate 2 | ✅ | Duplicate-name conflict indicator is shown in Layers (non-blocking; theme-safe via tokens). | 05-morph-slide-transition-spec.md — 5.2 Duplicate names | `src/ui/LayerTree.js` + `styles/modules/components.css` | Playwright: `tests/e2e/specs/ui/layer-name-conflict-indicator.spec.ts` |
| MOR-005A | Gate 3 | ✅ | Morph interpolates base geometry + opacity for matched L0 elements; unmatched elements fade; slide background cross-fades. | 05-morph-slide-transition-spec.md — 10.2, 10.3 | `src/core/AnimationManager.js` | Vitest: `tests/unit/core/AnimationManager.test.js` · Playwright: `tests/e2e/specs/functional/morph-element-coverage.spec.ts`, `tests/e2e/specs/functional/morph-background-stateful.spec.ts` |
| MOR-005B | Gate 3 | ✅ | Shared PI interpolation + zero-equivalent missing properties + per-element fallback when incompatible. | 05-morph-slide-transition-spec.md — 6) Property model | `src/core/AnimationManager.js` | Vitest: `tests/unit/core/AnimationManager.test.js` |
| MOR-006 | Gate 4 | ✅ | Background continuity: same-identity code/video preserves runtime state; different identities cross-fade while both continue during the transition; no duplicate instances after completion. | 05-morph-slide-transition-spec.md — 12) Animated fill state continuity | `src/core/renderer/PresentationRenderer.js` (bg transfer) + `src/core/AnimationManager.js` (bg cross-fade) | Playwright: `tests/e2e/specs/functional/morph-background-stateful.spec.ts` (code continuity), `tests/e2e/specs/functional/morph-background-video.spec.ts` (video continuity) |
| MOR-007 | Gate 5 | ✅ | Telemetry events and privacy constraints enforced (privacy-safe payloads). | 05-morph-slide-transition-spec.md — 13) Telemetry | `src/core/telemetry/Telemetry.js` + `src/core/renderer/PresentationRenderer.js` | Vitest: `tests/unit/core/telemetry/Telemetry.test.js`, `tests/unit/core/renderer/PresentationRenderer.telemetry.test.js` |

Ledger expansions status:
- MOR-003 has been split into MOR-003A–MOR-003C and is now verified.
- Legacy `magic` policy is verified via MOR-003D.
- Reduced-motion coverage is tracked as MOR-003E (verified via unit evidence).
- Lifecycle attributes + audience-clean + leak-free rapid navigation will be tracked under Gate 5 (to add rows when implementing Gate 5 stress/telemetry work).

---

## Ledger (V2/V3) — placeholders

These rows are intentionally placeholders until V2/V3 specs are written.

| MORX-ID | Version | Status | Theme | Notes |
|---|---|---|---|---|
| MORX-201 | V2 | ❌ | Image→Image warp morph | Consider optical flow / feature-based warp with bounded precompute + fallback |
| MORX-202 | V2 | ❌ | Vector path morphing | Only for compatible topology; otherwise fallback |
| MORX-301 | V3 | ❌ | Matching beyond L0 | Requires product decision + explainability UX |
