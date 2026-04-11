# Slide Transitions (Phase 1) — MUST Index

This file is the **source of truth** for Phase 1 transitions scope.

## Status
This MUST index is **exhaustive** for the normative Phase 1 transitions spec docs as of **December 21, 2025**.

Scope (included in extraction):
- `01-phase-1-slide-transitions-spec.md`
- `02-transition-inheritance-and-property-inspector-ux.md`
- `03-performance-readiness-and-caching.md`
- `04-testing-and-verification.md`

Explicit exclusions:
- `00-slide-transitions-notes.md` (non-normative)
- `05-ledger-and-gate-plan.md` (tracker; intentionally repeats MUST text and would cause recursive extraction)
- `README.md` (index)
- this file (`MUST-index.md`)

Rules:
- Include both **MUST** and **MUST NOT** clauses across the transitions spec suite.
- Each MUST maps to exactly one ledger row `ST-###` in `05-ledger-and-gate-plan.md`.
- MUST-ID MUST be stable. Recommended: `spec filename + line number`.

Stable ID scheme used in this file (until a generator exists):
- `TRN-P1-<doc>-<nnn>`
	- `<doc>` is one of: `01` (core spec), `02` (inheritance/UX), `03` (perf/readiness), `04` (testing)
	- `<nnn>` is a zero-padded sequence within that document

Regeneration helper:
- Extraction script: `node scripts/specs/extract-transitions-musts.mjs` (produces a JSON listing of MUST lines)

> Note: Unlike Presentation Mode, Phase 1 transitions do not yet have a generator script; the process is defined in `05-ledger-and-gate-plan.md` and can be automated later.

| MUST-ID | Spec file | Section heading | Requirement summary | Maps to | Automated verification |
|---|---|---|---|---|---|
| TRN-P1-01-001 | 01-phase-1-slide-transitions-spec.md | 1) Goals | MUST reuse existing design system components and CSS variables. | ST-001 | TBD |
| TRN-P1-01-002 | 01-phase-1-slide-transitions-spec.md | 1) Goals | MUST avoid introducing new inline-style-heavy UI patterns (prefer existing classes + CSS variables). | ST-002 | TBD |
| TRN-P1-01-003 | 01-phase-1-slide-transitions-spec.md | 1) Goals | MUST be compatible with undo/redo. | ST-003 | TBD |
| TRN-P1-01-004 | 01-phase-1-slide-transitions-spec.md | 1) Goals | MUST be compatible with file storage/serialization and realtime collaboration. | ST-004 | TBD |
| TRN-P1-01-005 | 01-phase-1-slide-transitions-spec.md | 5.1 Canonical type IDs | The transition system MUST use **canonical type IDs** (string literals) as follows: | ST-005 | TBD |
| TRN-P1-01-006 | 01-phase-1-slide-transitions-spec.md | 5.2 Parameters (common) | // MUST clamp to [0, 5000] at read time. durationMs: number; | ST-006 | TBD |
| TRN-P1-01-007 | 01-phase-1-slide-transitions-spec.md | 5.2 Parameters (common) | // Direction MUST be present for directional transitions and MUST be absent for non-directional. // - wipe: direction8 // - push/cover/uncover: direction4 direction?: SlideTransitionDirection4 \| SlideTransitionDirection8; | ST-007 | TBD |
| TRN-P1-01-008 | 01-phase-1-slide-transitions-spec.md | 5.2 Parameters (common) | // MUST accept CSS easing string. easing?: string; | ST-008 | TBD |
| TRN-P1-01-009 | 01-phase-1-slide-transitions-spec.md | 5.3 Default config | The **system default** transition MUST be: - `type: 'crossFade'` - `durationMs: 300` - `easing: 'ease-in-out'` | ST-009 | TBD |
| TRN-P1-01-010 | 01-phase-1-slide-transitions-spec.md | 5.3 Default config | If a slide resolves to no transition config through inheritance, the system MUST use the system default. | ST-010 | TBD |
| TRN-P1-01-011 | 01-phase-1-slide-transitions-spec.md | 5.3 Default config | If `prefers-reduced-motion: reduce` is active, the system MUST force `type: 'none'` regardless of config. | ST-011 | TBD |
| TRN-P1-01-012 | 01-phase-1-slide-transitions-spec.md | 5.4 Runtime integration contract (alignment to current app) | Phase 1 MUST standardize a single runtime API surface so duration/direction can be honored: | ST-012 | TBD |
| TRN-P1-01-013 | 01-phase-1-slide-transitions-spec.md | 5.4 Runtime integration contract (alignment to current app) | `AnimationManager.transition(container, outgoingEl, incomingEl, transition)` MUST accept: - either a legacy string (back-compat), or - a `SlideTransitionConfig` object. | ST-013 | TBD |
| TRN-P1-01-014 | 01-phase-1-slide-transitions-spec.md | 5.4 Runtime integration contract (alignment to current app) | If a legacy string is provided (e.g. `'fade'\|'push'\|'slide'\|'none'\|'magic'`), the implementation MUST map it to a Phase 1 `SlideTransitionConfig` or fall back safely. | ST-014 | TBD |
| TRN-P1-01-015 | 01-phase-1-slide-transitions-spec.md | 5.4 Runtime integration contract (alignment to current app) | `'magic'` MUST NOT silently behave as Morph in Phase 1. It MUST fall back (see Section 12). | ST-015 | TBD |
| TRN-P1-01-016 | 01-phase-1-slide-transitions-spec.md | 5.4 Runtime integration contract (alignment to current app) | The mapping MUST be centralized (single function/module) so UI, renderer, and tests share the same semantics. | ST-016 | TBD |
| TRN-P1-01-017 | 01-phase-1-slide-transitions-spec.md | 6) Direction semantics (normative) | Directional transitions MUST use a single consistent semantic: | ST-017 | TBD |
| TRN-P1-01-018 | 01-phase-1-slide-transitions-spec.md | 7.1 General | During an animated transition, both outgoing and incoming slides MUST be present in the DOM simultaneously. | ST-018 | TBD |
| TRN-P1-01-019 | 01-phase-1-slide-transitions-spec.md | 7.1 General | The incoming slide MUST already be fully rendered and asset-ready before the transition begins (see readiness gating). | ST-019 | TBD |
| TRN-P1-01-020 | 01-phase-1-slide-transitions-spec.md | 7.1 General | Slides MUST be positioned so that animation does not reflow the document. | ST-020 | TBD |
| TRN-P1-01-021 | 01-phase-1-slide-transitions-spec.md | 7.1 General | Animations MUST use compositor-friendly properties only (translate/opacity/clip-path) and MUST NOT animate layout-affecting properties (top/left/width/height). | ST-021 | TBD |
| TRN-P1-01-022 | 01-phase-1-slide-transitions-spec.md | 7.2 Per-type stacking order | incoming MUST be above outgoing - outgoing MAY remain stationary | ST-022 | TBD |
| TRN-P1-01-023 | 01-phase-1-slide-transitions-spec.md | 7.2 Per-type stacking order | outgoing MUST be above incoming - incoming remains stationary (revealed as outgoing moves away) | ST-023 | TBD |
| TRN-P1-01-024 | 01-phase-1-slide-transitions-spec.md | 8) Readiness gating (hard requirement) | Transitions MUST NOT start until the incoming slide is ready: | ST-024 | TBD |
| TRN-P1-01-025 | 01-phase-1-slide-transitions-spec.md | 8) Readiness gating (hard requirement) | The readiness probe is DOM-based (`waitForSlideAssetsReady(rootEl)`), and Phase 1 MUST NOT weaken it. | ST-025 | TBD |
| TRN-P1-01-026 | 01-phase-1-slide-transitions-spec.md | 8) Readiness gating (hard requirement) | The probe MUST consider: - `<img>` elements (load + optional `decode()`) - `<video>` elements (at least first-frame `loadeddata`) - CSS `background-image: url(...)` assets | ST-026 | TBD |
| TRN-P1-01-027 | 01-phase-1-slide-transitions-spec.md | 8) Readiness gating (hard requirement) | navigation MUST block until readiness succeeds | ST-027 | TBD |
| TRN-P1-01-028 | 01-phase-1-slide-transitions-spec.md | 8) Readiness gating (hard requirement) | a loading indicator MUST NOT be shown to the audience surface | ST-028 | TBD |
| TRN-P1-01-029 | 01-phase-1-slide-transitions-spec.md | 9.1 State machine | The transition system MUST expose a minimal lifecycle: | ST-029 | TBD |
| TRN-P1-01-030 | 01-phase-1-slide-transitions-spec.md | 9.1 State machine | The playback surface MUST surface this lifecycle on the root container via attributes so Playwright can assert: | ST-030 | E2E |
| TRN-P1-01-031 | 01-phase-1-slide-transitions-spec.md | 9.2 DOM contract | outgoing slide DOM element MUST be present and stable | ST-031 | TBD |
| TRN-P1-01-032 | 01-phase-1-slide-transitions-spec.md | 9.2 DOM contract | incoming slide DOM element MUST be present and stable | ST-032 | TBD |
| TRN-P1-01-033 | 01-phase-1-slide-transitions-spec.md | 9.2 DOM contract | both MUST share a common container coordinate space | ST-033 | TBD |
| TRN-P1-01-034 | 01-phase-1-slide-transitions-spec.md | 9.2 DOM contract | outgoing slide element MUST be removed (or fully hidden and detached without leaving interactive remnants) | ST-034 | TBD |
| TRN-P1-01-035 | 01-phase-1-slide-transitions-spec.md | 9.2 DOM contract | incoming slide MUST become the only active slide | ST-035 | TBD |
| TRN-P1-01-036 | 01-phase-1-slide-transitions-spec.md | 9.2 DOM contract | Outgoing slide MUST not retain interactive focusable elements that remain tabbable after removal (no focus leaks). | ST-036 | TBD |
| TRN-P1-01-037 | 01-phase-1-slide-transitions-spec.md | 9.3 Cancellation / re-entrancy | the system MUST queue the newest target and transition to it after the current transition completes (no partial mid-flight jumps) | ST-037 | TBD |
| TRN-P1-01-038 | 01-phase-1-slide-transitions-spec.md | 9.3 Cancellation / re-entrancy | the system MUST NOT leak DOM nodes from abandoned intermediate targets | ST-038 | TBD |
| TRN-P1-01-039 | 01-phase-1-slide-transitions-spec.md | 10.1 Cross fade (`crossFade`) | If both are animated, the sum of opacities MUST NOT exceed 1.2 in a way that causes unacceptable brightness pumping. | ST-039 | TBD |
| TRN-P1-01-040 | 01-phase-1-slide-transitions-spec.md | 10.2 Wipe (`wipe`) | Implementation MUST use `clip-path` (preferred) or an equivalent masking strategy. | ST-040 | TBD |
| TRN-P1-01-041 | 01-phase-1-slide-transitions-spec.md | 11) Accessibility, reduced motion, and user settings | Reduced motion MUST force `type: 'none'`. | ST-041 | TBD |
| TRN-P1-01-042 | 01-phase-1-slide-transitions-spec.md | 11) Accessibility, reduced motion, and user settings | The transition system MUST NOT interfere with keyboard focus: - focus MUST remain logically within the presentation chrome (HUD) or within the slide content as designed - no focus traps | ST-042 | TBD |
| TRN-P1-01-043 | 01-phase-1-slide-transitions-spec.md | 11) Accessibility, reduced motion, and user settings | focus MUST remain logically within the presentation chrome (HUD) or within the slide content as designed - no focus traps | ST-043 | TBD |
| TRN-P1-01-044 | 01-phase-1-slide-transitions-spec.md | 11) Accessibility, reduced motion, and user settings | Transitions MUST NOT rely on color for meaning. | ST-044 | TBD |
| TRN-P1-01-045 | 01-phase-1-slide-transitions-spec.md | 11) Accessibility, reduced motion, and user settings | Any UI that configures transitions MUST use existing PI components and tokens (no hardcoded colors; no new shadows/fonts). | ST-045 | TBD |
| TRN-P1-01-046 | 01-phase-1-slide-transitions-spec.md | 12) Error handling and fallbacks | MUST fall back to `none` for that navigation event - MUST still perform readiness gating | ST-046 | TBD |
| TRN-P1-01-047 | 01-phase-1-slide-transitions-spec.md | 12) Error handling and fallbacks | MUST still perform readiness gating | ST-047 | TBD |
| TRN-P1-01-048 | 01-phase-1-slide-transitions-spec.md | 12) Error handling and fallbacks | Unsupported transition types MUST fall back to `none`. | ST-048 | TBD |
| TRN-P1-01-049 | 01-phase-1-slide-transitions-spec.md | 12) Error handling and fallbacks | Errors MUST be logged without including slide content or speaker notes. | ST-049 | TBD |
| TRN-P1-01-050 | 01-phase-1-slide-transitions-spec.md | 12) Error handling and fallbacks | Fallback decisions MUST emit telemetry using privacy-safe payloads only. | ST-050 | UT |
| TRN-P1-01-051 | 01-phase-1-slide-transitions-spec.md | 13) Telemetry (required for quality gates) | At minimum, transitions MUST emit privacy-safe telemetry: | ST-051 | UT |
| TRN-P1-01-052 | 01-phase-1-slide-transitions-spec.md | 13) Telemetry (required for quality gates) | Payload MUST NOT include slide content, notes, or PII. | ST-052 | TBD |
| TRN-P1-01-053 | 01-phase-1-slide-transitions-spec.md | 15) Undo/redo, serialization, and collaboration | Transitions are user-authored slide/master properties and MUST therefore: | ST-053 | TBD |
| TRN-P1-01-054 | 01-phase-1-slide-transitions-spec.md | 15) Undo/redo, serialization, and collaboration | When reading stored configs, the runtime MUST clamp and normalize values (duration bounds, direction validity) so that corrupted/old documents cannot crash playback. | ST-054 | TBD |
| TRN-P1-02-001 | 02-transition-inheritance-and-property-inspector-ux.md | 0) Scope | It MUST mirror the cascade model used by color themes: | ST-055 | TBD |
| TRN-P1-02-002 | 02-transition-inheritance-and-property-inspector-ux.md | 1.1 Hierarchy | Slide Transition configuration MUST cascade through the same hierarchy as color themes: | ST-056 | TBD |
| TRN-P1-02-003 | 02-transition-inheritance-and-property-inspector-ux.md | 1.3 Null-clears-override rule | **`null` MUST mean “inherit”.** | ST-057 | TBD |
| TRN-P1-02-004 | 02-transition-inheritance-and-property-inspector-ux.md | 1.3 Null-clears-override rule | The UI MUST provide a “Reset to inherited” action that writes `null` at that level. | ST-058 | TBD |
| TRN-P1-02-005 | 02-transition-inheritance-and-property-inspector-ux.md | 1.4 Canonical storage (Phase 1) | Phase 1 MUST store transition configuration in a way that: | ST-059 | TBD |
| TRN-P1-02-006 | 02-transition-inheritance-and-property-inspector-ux.md | 1.4 Canonical storage (Phase 1) | Slide records MUST support both: - legacy `transition` (string) (already present today), and - `styleAssignments.slideTransition` (object or null) (Phase 1 canonical). | ST-060 | TBD |
| TRN-P1-02-007 | 02-transition-inheritance-and-property-inspector-ux.md | 1.4 Canonical storage (Phase 1) | Layout master records (type `layoutMaster`) MUST store the optional override under: - `styleAssignments.slideTransition` | ST-061 | TBD |
| TRN-P1-02-008 | 02-transition-inheritance-and-property-inspector-ux.md | 1.4 Canonical storage (Phase 1) | Master preset records (type `slideMasterPreset`) MUST store the default under: - `styleAssignments.slideTransition` | ST-062 | TBD |
| TRN-P1-02-009 | 02-transition-inheritance-and-property-inspector-ux.md | 1.4 Canonical storage (Phase 1) | A missing `styleAssignments` object MUST be treated as “no override set here”. | ST-063 | TBD |
| TRN-P1-02-010 | 02-transition-inheritance-and-property-inspector-ux.md | 1.5 Backward compatibility (existing `slide.transition`) | The current store has a legacy `slide.transition` string. Phase 1 MUST define a migration behavior: | ST-064 | TBD |
| TRN-P1-02-011 | 02-transition-inheritance-and-property-inspector-ux.md | 1.5 Backward compatibility (existing `slide.transition`) | it MUST be mapped to `styleAssignments.slideTransition` using the following rules: - `'fade'` → `{ type: 'crossFade', durationMs: 300, easing: 'ease-in-out' }` - `'push'` → `{ type: 'push', direction: 'right', durationMs: 300, easing: 'ease-in-out' }` (default direction) - `'slide'` → `{ type: 'cover', direction: 'right', durationMs: 300, easing: 'ease-in-out' }` (closest Phase 1 semantic) - `'magic'` → Phase 1 MUST treat as unsupported (Morph is Phase 2) and MUST fall back safely (and MUST report telemetry `transition_fallback_to_none` or `transition_unsupported`). | ST-065 | UT |
| TRN-P1-02-012 | 02-transition-inheritance-and-property-inspector-ux.md | 1.5 Backward compatibility (existing `slide.transition`) | `'magic'` → Phase 1 MUST treat as unsupported (Morph is Phase 2) and MUST fall back safely (and MUST report telemetry `transition_fallback_to_none` or `transition_unsupported`). | ST-066 | UT |
| TRN-P1-02-013 | 02-transition-inheritance-and-property-inspector-ux.md | 1.5 Backward compatibility (existing `slide.transition`) | Migration MUST be deterministic and run through undo/redo-safe store actions when triggered by user edits. | ST-067 | TBD |
| TRN-P1-02-014 | 02-transition-inheritance-and-property-inspector-ux.md | 1.5 Backward compatibility (existing `slide.transition`) | File load migration (if any) MUST be idempotent (loading/saving repeatedly must not drift values). | ST-068 | TBD |
| TRN-P1-02-015 | 02-transition-inheritance-and-property-inspector-ux.md | 1.6 Effective transition resolution | The effective transition for a slide MUST be computed as: | ST-069 | TBD |
| TRN-P1-02-016 | 02-transition-inheritance-and-property-inspector-ux.md | 1.6 Effective transition resolution | The resolver MUST also return a source descriptor used by UI: | ST-070 | TBD |
| TRN-P1-02-017 | 02-transition-inheritance-and-property-inspector-ux.md | 2.1 Placement | A new **Slide Transition** section MUST appear in the Property Inspector when a slide is selected. | ST-071 | TBD |
| TRN-P1-02-018 | 02-transition-inheritance-and-property-inspector-ux.md | 2.1 Placement | It MUST be shown only when the selection is empty (same display condition as Slide properties). | ST-072 | TBD |
| TRN-P1-02-019 | 02-transition-inheritance-and-property-inspector-ux.md | 2.1 Placement | The Transition section MUST be implemented inside the existing `SlideSection` architecture (same surface as Layout/Colors/Typography). | ST-073 | TBD |
| TRN-P1-02-020 | 02-transition-inheritance-and-property-inspector-ux.md | 2.1 Placement | It MUST use existing components (`Section`, `Button`, `NumberInput`, `SegmentedControl`, and `Flyout`) and existing CSS tokens. | ST-074 | TBD |
| TRN-P1-02-021 | 02-transition-inheritance-and-property-inspector-ux.md | 2.1 Placement | It MUST NOT introduce new colors/shadows/fonts; it MUST use global CSS variables. | ST-075 | TBD |
| TRN-P1-02-022 | 02-transition-inheritance-and-property-inspector-ux.md | 2.2 Section header | The section MUST be collapsible, consistent with other PI sections. | ST-076 | TBD |
| TRN-P1-02-023 | 02-transition-inheritance-and-property-inspector-ux.md | 2.3 Primary row (transition picker) | The first row MUST show: | ST-077 | TBD |
| TRN-P1-02-024 | 02-transition-inheritance-and-property-inspector-ux.md | 2.4 Inheritance badge rules | The transition section MUST reuse the badge semantics from the Slide section theme controls: | ST-078 | TBD |
| TRN-P1-02-025 | 02-transition-inheritance-and-property-inspector-ux.md | 2.4 Inheritance badge rules | The section MUST also display a source line: | ST-079 | TBD |
| TRN-P1-02-026 | 02-transition-inheritance-and-property-inspector-ux.md | 2.5 “Reset to inherited” | clicking reset MUST set `styleAssignments.slideTransition = null` for that slide | ST-080 | TBD |
| TRN-P1-02-027 | 02-transition-inheritance-and-property-inspector-ux.md | 2.6 Transition picker flyout (reuse existing component) | The picker MUST use the same implementation pattern as the existing layout picker flyout (`SlideSection.openLayoutFlyout()`): | ST-081 | TBD |
| TRN-P1-02-028 | 02-transition-inheritance-and-property-inspector-ux.md | 2.6 Transition picker flyout (reuse existing component) | Flyout root element MUST set `role="dialog"` and `aria-label="Select Transition"`. | ST-082 | TBD |
| TRN-P1-02-029 | 02-transition-inheritance-and-property-inspector-ux.md | 2.6 Transition picker flyout (reuse existing component) | The options container MUST set `role="listbox"`. | ST-083 | TBD |
| TRN-P1-02-030 | 02-transition-inheritance-and-property-inspector-ux.md | 2.6 Transition picker flyout (reuse existing component) | Each option MUST set `role="option"` and `aria-selected`. | ST-084 | TBD |
| TRN-P1-02-031 | 02-transition-inheritance-and-property-inspector-ux.md | 2.6 Transition picker flyout (reuse existing component) | Escape MUST close the flyout. | ST-085 | TBD |
| TRN-P1-02-032 | 02-transition-inheritance-and-property-inspector-ux.md | 2.6 Transition picker flyout (reuse existing component) | The flyout MUST present options as a grid (thumbnail + label): | ST-086 | TBD |
| TRN-P1-02-033 | 02-transition-inheritance-and-property-inspector-ux.md | 2.6 Transition picker flyout (reuse existing component) | Clicking an option MUST apply it immediately and close the flyout. | ST-087 | TBD |
| TRN-P1-02-034 | 02-transition-inheritance-and-property-inspector-ux.md | 2.6 Transition picker flyout (reuse existing component) | The current option MUST have `aria-selected="true"`. | ST-088 | TBD |
| TRN-P1-02-035 | 02-transition-inheritance-and-property-inspector-ux.md | 2.7 Controls shown after selection | After a specific transition is selected, the section MUST show controls: | ST-089 | TBD |
| TRN-P1-02-036 | 02-transition-inheritance-and-property-inspector-ux.md | 2.7 Controls shown after selection | The duration control MUST use the existing `NumberInput` component. | ST-090 | TBD |
| TRN-P1-02-037 | 02-transition-inheritance-and-property-inspector-ux.md | 2.7 Controls shown after selection | Direction UI MUST be a compact button grid (segmented control style) using existing button primitives. | ST-091 | TBD |
| TRN-P1-02-038 | 02-transition-inheritance-and-property-inspector-ux.md | 2.7 Controls shown after selection | Each direction button MUST have an aria-label like: - `"Direction: from left"` - `"Direction: from top-left"` | ST-092 | TBD |
| TRN-P1-02-039 | 02-transition-inheritance-and-property-inspector-ux.md | 2.8 None | Duration and Direction controls MUST be hidden (or disabled) because they have no effect. | ST-093 | TBD |
| TRN-P1-02-040 | 02-transition-inheritance-and-property-inspector-ux.md | 2.8 None | Changing any control MUST be recorded as an undoable store action (except transient scrubbing if the existing `skipHistory` pattern is used). | ST-094 | TBD |
| TRN-P1-02-041 | 02-transition-inheritance-and-property-inspector-ux.md | 3.1 Master preset default | the Transition section MUST be available | ST-095 | TBD |
| TRN-P1-02-042 | 02-transition-inheritance-and-property-inspector-ux.md | 3.2 Layout master override | the Transition section MUST be available | ST-096 | TBD |
| TRN-P1-02-043 | 02-transition-inheritance-and-property-inspector-ux.md | 3.2 Layout master override | it MUST show inheritance information from the parent master preset | ST-097 | TBD |
| TRN-P1-02-044 | 02-transition-inheritance-and-property-inspector-ux.md | 3.2 Layout master override | Master/layout transition values MUST live on the master entities (in `slideMasterPresets`) so that they serialize and sync exactly like other master properties. | ST-098 | TBD |
| TRN-P1-02-045 | 02-transition-inheritance-and-property-inspector-ux.md | 4) Mixed / multi-selection | Phase 1 MUST define behavior for future multi-slide selection: - If multiple slides are selected and their effective transitions differ, the transition picker MUST show a `Mixed` state. - Applying a transition in mixed state MUST set overrides on all selected slides. | ST-099 | TBD |
| TRN-P1-02-046 | 02-transition-inheritance-and-property-inspector-ux.md | 4) Mixed / multi-selection | If multiple slides are selected and their effective transitions differ, the transition picker MUST show a `Mixed` state. - Applying a transition in mixed state MUST set overrides on all selected slides. | ST-100 | TBD |
| TRN-P1-02-047 | 02-transition-inheritance-and-property-inspector-ux.md | 4) Mixed / multi-selection | Applying a transition in mixed state MUST set overrides on all selected slides. | ST-101 | TBD |
| TRN-P1-02-048 | 02-transition-inheritance-and-property-inspector-ux.md | 5) Undo/Redo | All transition changes MUST be undoable: | ST-102 | TBD |
| TRN-P1-02-049 | 02-transition-inheritance-and-property-inspector-ux.md | 6) Accessibility requirements | The Transition section MUST follow the Property Inspector v2 ARIA conventions. | ST-103 | TBD |
| TRN-P1-02-050 | 02-transition-inheritance-and-property-inspector-ux.md | 6) Accessibility requirements | Screen reader announcements MUST be emitted for: - “Transition changed to …” - “Transition duration … ms” - “Transition direction …” - “Transition reset to inherited …” | ST-104 | TBD |
| TRN-P1-02-051 | 02-transition-inheritance-and-property-inspector-ux.md | 6) Accessibility requirements | The Transition UI MUST NOT expose slide content in accessibility labels beyond the transition name and control values. | ST-105 | TBD |
| TRN-P1-03-001 | 03-performance-readiness-and-caching.md | 1.1 Decode-first transitions | Transitions MUST NOT begin until the incoming slide is fully ready: | ST-106 | TBD |
| TRN-P1-03-002 | 03-performance-readiness-and-caching.md | 1.2 Audience must never see loading UI | the system MUST NOT show a loading indicator in the audience surface | ST-107 | TBD |
| TRN-P1-03-003 | 03-performance-readiness-and-caching.md | 1.3 Navigation gating | If user requests Next/Prev and the incoming slide is not ready, navigation MUST block until ready. | ST-108 | TBD |
| TRN-P1-03-004 | 03-performance-readiness-and-caching.md | 1.3 Navigation gating | Blocking MUST be bounded by error handling; if readiness fails due to permanent error, fallback behavior MUST occur (see Section 6). | ST-109 | TBD |
| TRN-P1-03-005 | 03-performance-readiness-and-caching.md | 1.3 Navigation gating | Readiness gating MUST be implemented as a single shared utility (no duplicated per-transition readiness code). | ST-110 | TBD |
| TRN-P1-03-006 | 03-performance-readiness-and-caching.md | 1.3 Navigation gating | Readiness gating MUST be compatible with performance targets (avoid layout thrashing). | ST-111 | TBD |
| TRN-P1-03-007 | 03-performance-readiness-and-caching.md | 2) Cache tiers (Phase 1 alignment) | The transition system MUST cooperate with the Presentation Mode cache tiers: | ST-112 | TBD |
| TRN-P1-03-008 | 03-performance-readiness-and-caching.md | 2) Cache tiers (Phase 1 alignment) | Navigation to HOT tier slides MUST be instant *after readiness gating*. | ST-113 | TBD |
| TRN-P1-03-009 | 03-performance-readiness-and-caching.md | 2) Cache tiers (Phase 1 alignment) | HOT tier MUST be “fully load + fully decode + render-ready”. | ST-114 | TBD |
| TRN-P1-03-010 | 03-performance-readiness-and-caching.md | 3.1 Prefetch on enter | MUST preload HOT tier (±1) | ST-115 | TBD |
| TRN-P1-03-011 | 03-performance-readiness-and-caching.md | 3.2 Deprioritize prefetch during navigation | MUST deprioritize background prefetch to avoid jank. | ST-116 | TBD |
| TRN-P1-03-012 | 03-performance-readiness-and-caching.md | 4.1 Readiness probe | The readiness probe MUST validate: | ST-117 | TBD |
| TRN-P1-03-013 | 03-performance-readiness-and-caching.md | 4.2 What counts as “visible” | Phase 1 MUST preserve this behavior so transitions never show half-ready assets. | ST-118 | TBD |
| TRN-P1-03-014 | 03-performance-readiness-and-caching.md | 4.2 What counts as “visible” | If future optimization is desired (e.g., excluding assets hidden for builds), it MUST not reduce correctness and MUST be proven by tests (no regressions where a build asset becomes visible immediately after transition). | ST-119 | TBD |
| TRN-P1-03-015 | 03-performance-readiness-and-caching.md | 5) Timing budgets | Transitions MUST not cause performance regressions: | ST-120 | TBD |
| TRN-P1-03-016 | 03-performance-readiness-and-caching.md | 5) Timing budgets | First frame after transition completes MUST present within the overall Presentation Mode performance bar. | ST-121 | TBD |
| TRN-P1-03-017 | 03-performance-readiness-and-caching.md | 5) Timing budgets | The transition animation itself MUST maintain 60fps under normal conditions. | ST-122 | TBD |
| TRN-P1-03-018 | 03-performance-readiness-and-caching.md | 6.1 Asset readiness fails | The system MUST proceed with navigation after a bounded wait (configurable; default 2000ms). | ST-123 | TBD |
| TRN-P1-03-019 | 03-performance-readiness-and-caching.md | 6.1 Asset readiness fails | The bounded wait MUST be implemented without blocking the UI thread. | ST-124 | TBD |
| TRN-P1-03-020 | 03-performance-readiness-and-caching.md | 6.1 Asset readiness fails | The transition MUST fall back to `none` for that navigation event. | ST-125 | TBD |
| TRN-P1-03-021 | 03-performance-readiness-and-caching.md | 6.1 Asset readiness fails | The audience view MUST render a safe placeholder (no crash, no broken DOM). | ST-126 | TBD |
| TRN-P1-03-022 | 03-performance-readiness-and-caching.md | 6.1 Asset readiness fails | The readiness probe already applies a per-asset timeout (default 8000ms). Phase 1 MUST define which timeout governs the bounded-wait behavior to avoid double timeouts. | ST-127 | TBD |
| TRN-P1-03-023 | 03-performance-readiness-and-caching.md | 6.2 Animation engine missing | The transition MUST fall back to `none`. | ST-128 | TBD |
| TRN-P1-03-024 | 03-performance-readiness-and-caching.md | 6.2 Animation engine missing | Readiness gating MUST still be enforced. | ST-129 | TBD |
| TRN-P1-03-025 | 03-performance-readiness-and-caching.md | 7) Telemetry requirements | The following telemetry events MUST exist for quality gates: | ST-130 | UT |
| TRN-P1-03-026 | 03-performance-readiness-and-caching.md | 8) Security & privacy constraints | Readiness code MUST NOT leak URLs or asset identifiers into telemetry. | ST-131 | UT |
| TRN-P1-03-027 | 03-performance-readiness-and-caching.md | 8) Security & privacy constraints | Test-only hooks (e.g., deterministic readiness delays) MUST remain explicitly test-only and MUST NOT be documented as a user feature. | ST-132 | TBD |
| TRN-P1-03-028 | 03-performance-readiness-and-caching.md | 9) Performance constraints | Transition animations MUST be GPU-friendly (transform/opacity/clip-path) and MUST not animate layout properties. | ST-133 | TBD |
| TRN-P1-03-029 | 03-performance-readiness-and-caching.md | 9) Performance constraints | Readiness probing MUST avoid repeated `getComputedStyle` calls in tight loops during navigation; any expensive scanning SHOULD be bounded and amortized. | ST-134 | TBD |
| TRN-P1-04-001 | 04-testing-and-verification.md | 1.1 Unit tests (Vitest) | Unit tests MUST cover: | ST-135 | UT |
| TRN-P1-04-002 | 04-testing-and-verification.md | 1.2 E2E tests (Playwright) | Playwright MUST enforce: | ST-136 | E2E |
| TRN-P1-04-003 | 04-testing-and-verification.md | 1.3 Visual verification | At minimum, Playwright MUST include deterministic assertions for: | ST-137 | E2E |
| TRN-P1-04-004 | 04-testing-and-verification.md | 2) Golden decks (required fixtures) | A deterministic fixture deck MUST exist that covers: | ST-138 | TBD |
| TRN-P1-04-005 | 04-testing-and-verification.md | 2) Golden decks (required fixtures) | The fixture MUST document expected behavior. | ST-139 | TBD |
| TRN-P1-04-006 | 04-testing-and-verification.md | 4) Performance validation | A perf gate MUST validate: | ST-140 | Perf |
| TRN-P1-04-007 | 04-testing-and-verification.md | 5) Traceability requirements | Every MUST/MUST NOT clause in the transitions spec suite MUST map to at least one automated verification: | ST-141 | TBD |
