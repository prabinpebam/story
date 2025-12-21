# Presentation Mode — Delivery Ledger & Gate Plan

**Goal**: ship Presentation Mode with **no spec/implementation gaps**, enforced by tests.

Non-negotiable outcomes:
- ✅ Audience DOM stays **clean** (no editor chrome, no presenter-only UI, no notes/diagnostics leaks).
- ✅ MUST requirements across the Presentation Mode spec suite are implemented and **mechanically verifiable**.
- ✅ Gates exit only when backed by **strict TDD** (Vitest) and **DOM/UI validation** (Playwright).

References (must stay in sync):
- Strict TDD rules: [documentation/02-implementation/00-strict-tdd-and-dom-validation.md](../../../02-implementation/00-strict-tdd-and-dom-validation.md)
- Global app principles: [documentation/00-product/principles.md](../../../00-product/principles.md)
- Presentation Mode principles: [01-principles.md](01-principles.md)
- Slide Notes / Presenter Notes (canonical format + sanitization contract): [../05-slide-notes.md](../05-slide-notes.md)

---

## Current Status (as of December 21, 2025)

Status legend: ✅ Done (locked) · 🟡 In progress · ❌ Not started · ⛔ Blocked

- ✅ Gates 0–6: Complete and enforced.
  - Playwright includes required-ID DOM contract + audience-clean forbidden-selector audit + enter→exit cleanup invariants.
  - Visual surface: aspect-fit scaling with letterboxing, token-based stage background, DPR-correct canvas rendering.
  - HUD: tokenized styling (no hardcoded HUD colors), focus-visible support, reduced-motion handling, forced-colors fallback.
  - Validation: `npm test` green; `npm run test:e2e` green (suite).

- ✅ Gate 7: Presenter View + security/privacy boundary.
  - Implemented: presenter view window + BroadcastChannel allowlist; presenter panel only renders during presentation mode.
  - ✅ Multi-page Playwright: `tests/e2e/specs/functional/presenter-view.spec.ts` green (popup open + slide/build lockstep + privacy payload audit + malformed message rejected + close→reopen recovery).
  - ✅ Notes: presenter notes render via canonical `NotesDoc v1` → safe HTML renderer (sanitization contract in [../05-slide-notes.md](../05-slide-notes.md)); per-slide editing validated by `tests/e2e/specs/functional/slide-notes.spec.ts`.

- 🟡 Gate 8: Accessibility + theming discipline.
  - Implemented: live region scaffolding + HUD ARIA groundwork; reduced-motion/forced-colors CSS rules.
  - ✅ Playwright a11y: `tests/e2e/specs/functional/presentation-accessibility.spec.ts` green (live region updates, HUD aria + toggle semantics, keyboard-only exit, prefers-reduced-motion disables transitions, forced-colors/contrast smoke, token-discipline checks for stage/HUD colors).
  - ✅ Theming assertions: same spec validates light/dark changes propagate to presentation tokens and accent theme updates the grid active indicator.
  - Remaining: expand forced-colors/contrast coverage beyond smoke.

- 🟡 Gate 9: In progress (observability/CI quality gates).
- 🟡 Gates 10–11: In progress (Gate 10 complete; remaining: final parity audit).

---

## Non‑Negotiable Rules (How work is allowed to ship)

- Red → Green → Refactor for every increment.
- Every increment adds/updates Playwright assertions that enforce **audience-clean DOM** and required IDs.
- Add Vitest tests whenever the increment introduces logic (navigation, readiness gating, sync protocol, a11y state).
- Every bug fix requires a regression test first.
- Each change updates this ledger’s status markers (✅/🟡/❌/⛔) so “done” is always visible.

---

## Execution Gates (The only roadmap)

Gate details live in **Section 6**. This section is the quick status index.

- ✅ Gate 0 — Baseline safety net (DOM contract + audience-clean audit + cleanup invariants)
- ✅ Gate 1 — Mode lifecycle correctness (windowed + fullscreen)
- ✅ Gate 2 — Input model + interactive element priority
- ✅ Gate 3 — Navigation + builds baseline parity
- ✅ Gate 4 — Transition readiness gating (decode-first) WITHOUT cache tiers
- ✅ Gate 5 — Cache tiers (ACTIVE/HOT/WARM/COLD) + perf baselines
- ✅ Gate 6 — HUD + Grid + Laser parity (audience-safe)
- ✅ Gate 7 — Presenter View + security/privacy boundary
- 🟡 Gate 8 — Accessibility + theming discipline
- 🟡 Gate 9 — Observability + CI quality gates
- ✅ Gate 10 — Kiosk/autoplay/rehearsal modes
- ❌ Gate 11 — Final parity audit (“no spec/impl gaps”)

---

## 0) Hardening Recommendations (So This Plan Actually Prevents Gaps)

This section exists because a gate plan can still fail the “no spec/implementation gap” goal if it is not **enforceable**.

### 0.1 Make traceability mandatory (not optional)
**Problem:** A surface-only ledger (PM-001, PM-010, …) is too coarse; teams will “feel done” while still missing spec details.

**Rule:** Every `PM-###` item MUST have a completed traceability row using the template below before the final audit gate can exit.

#### Traceability row template (required)
```yaml
id: PM-041
level: MUST # MUST|SHOULD|MAY
spec:
  - file: documentation/01-specs/slides/presentation-mode/02-performance-and-caching.md
    section: "Transition readiness gating"
    clauses:
      - "Transitions MUST NOT begin until next slide assets are fully loaded and decoded"
impl:
  owners: ["core"]
  files:
    - src/core/renderer/PresentationRenderer.js
    - src/core/AssetReadiness.js # if created
  publicContracts:
    - "presentation.transition.readiness" # event/flag name(s)
tests:
  unit:
    - file: tests/unit/core/presentation/AssetReadiness.test.js
      assertions:
        - "image decode awaited"
        - "font readiness awaited"
  e2e:
    - file: tests/e2e/presentation/transition-readiness.spec.ts
      assertions:
        - "transition-start timestamp occurs after readiness=true"
        - "audience DOM never shows placeholder/pixelated frame"
telemetry:
  events:
    - "pm_transition_blocked"
    - "pm_transition_started"
flags:
  - "presentation.transitionReadiness.enabled" # if behind flag
doneWhen:
  - "All tests above pass"
  - "No TODO/NOTE remains in the cited spec clauses"
```

### 0.2 Maintain a MUST index (single source of truth for scope)
**Problem:** “All MUST requirements” is ambiguous unless there is an explicit list.

**Rule:** Maintain a **MUST Index** table in this file (or a dedicated `MUST-index.md`) that enumerates every MUST requirement and maps it to a `PM-###`.

Minimum format:
- `Spec file` + `section heading` + `requirement summary` + `PM-###` + `test(s)`

#### MUST Index (seeded — expand to 100% before final gate)

Notes:
- This table is intentionally **not complete** yet. It is seeded with the top MUSTs so scope is unambiguous on day one.
- Each row must map to exactly one `PM-###` (split a clause into multiple rows if it spans multiple surfaces).
- Include both **MUST** and **MUST NOT** clauses.

| MUST-ID | Spec file | Section heading | Requirement summary (verbatim or tight paraphrase) | Maps to | Test(s) (planned) |
|---|---|---|---|---|---|
| MUST-001 | 06-mode-taxonomy-and-entry-exit.md | 2) Entry Points / Requirements | MUST support entry via toolbar/menu and shortcuts. | PM-001 | E2E: entry via menu/shortcut |
| MUST-002 | 06-mode-taxonomy-and-entry-exit.md | 2) Entry Points / Requirements | MUST support start-from-beginning and start-from-current as distinct actions. | PM-001 | E2E: begin vs current asserts starting slide |
| MUST-003 | 06-mode-taxonomy-and-entry-exit.md | 2) Entry Points / Requirements | MUST provide mode picker UI (fullscreen vs windowed, single vs dual-screen). | PM-001 | E2E: mode picker surfaces + state |
| MUST-004 | 06-mode-taxonomy-and-entry-exit.md | 1) Modes / Present in Window | Present in Window MUST be user-selectable (not just fullscreen-denied fallback). | PM-001 | E2E: windowed entry path |
| MUST-005 | 06-mode-taxonomy-and-entry-exit.md | 3) Exit Points / Requirements | MUST support exit via `Esc`, HUD button, and menu. | PM-003 | E2E: exit via Esc/HUD/menu |
| MUST-006 | 06-mode-taxonomy-and-entry-exit.md | 3) Exit Points / Requirements | MUST restore editor to previous state (active slide, zoom level). | PM-003 | E2E: enter→exit restores store + DOM |
| MUST-007 | 06-mode-taxonomy-and-entry-exit.md | 4) Fullscreen Handling / Requirements | MUST request fullscreen on entry (if mode is fullscreen viewer). | PM-002 | E2E: fullscreen requested (stubbed) |
| MUST-008 | 06-mode-taxonomy-and-entry-exit.md | 4) Fullscreen Handling / Requirements | MUST handle browser denial gracefully (continue in window). | PM-002 | E2E: fullscreen denied still presents |
| MUST-009 | 06-mode-taxonomy-and-entry-exit.md | 4) Fullscreen Handling / Requirements | MUST track fullscreen state and provide re-request option in HUD. | PM-002 | E2E: HUD shows re-request control |
| MUST-010 | 02-performance-and-caching.md | 1) Performance Bar / Requirements | First frame MUST render <300ms from entry (target), <800ms max. | PM-130 | Perf gate: benchmark deck(s) |
| MUST-011 | 02-performance-and-caching.md | 1) Performance Bar / Requirements | Next/Prev slide MUST respond <50ms (target), <150ms max. | PM-130 | Perf gate: next/prev latency |
| MUST-012 | 02-performance-and-caching.md | 1) Performance Bar / Requirements | Grid overlay open MUST render <200ms (target), <500ms max. | PM-130 | Perf gate: grid open latency |
| MUST-013 | 02-performance-and-caching.md | 1) Performance Bar / Continuous Verification | MUST instrument KPIs with telemetry (privacy-safe aggregates). | PM-130 | UT: telemetry payload; E2E: event emitted |
| MUST-014 | 02-performance-and-caching.md | 1) Performance Bar / Continuous Verification | MUST fail builds if KPIs regress beyond max thresholds. | PM-130 | CI gate: threshold enforcement |
| MUST-015 | 02-performance-and-caching.md | 3) Prefetch Strategy / Requirements | MUST preload HOT tier (±1) on entering presentation mode. | PM-090 | UT: cache tier state; E2E: HOT marked ready |
| MUST-016 | 02-performance-and-caching.md | 3) Prefetch Strategy / Requirements | MUST prefetch WARM tier (±3) in idle cycles. | PM-091 | UT: scheduler; E2E: prefetch requested |
| MUST-017 | 02-performance-and-caching.md | 3) Prefetch Strategy / Requirements | MUST deprioritize prefetch during active navigation (no jank). | PM-091 | UT: deprioritize policy |
| MUST-018 | 02-performance-and-caching.md | 2) Cache Tiers / HOT (Immediate Neighbors) | Transition MUST NOT start until next slide is fully loaded (no pixelated images, no decode-in-progress artifacts). | PM-041 | E2E: transition-start after readiness=true |
| MUST-019 | 02-performance-and-caching.md | 3) Prefetch Strategy / Requirements | MUST block navigation if next slide is not fully loaded (presenter-only indicator, never to audience). | PM-041 | E2E: audience sees no loader |
| MUST-020 | 02-performance-and-caching.md | 5) Resource Handling / Images | MUST ensure HOT tier images are fully decoded before transition starts. | PM-041 | UT: decode awaited; E2E: readiness markers |
| MUST-021 | 02-performance-and-caching.md | 5) Resource Handling / Images | MUST NOT initiate transition while HOT tier images are still loading/decoding. | PM-041 | E2E: blocked until decoded |
| MUST-022 | 02-performance-and-caching.md | 5) Resource Handling / Video | MUST decode and cache first frame for HOT tier video before transition starts. | PM-041 | UT: first-frame readiness; E2E: blocked until ready |
| MUST-023 | 02-performance-and-caching.md | 5) Resource Handling / Video | MUST NOT initiate transition while HOT tier video first frame is still decoding. | PM-041 | E2E: blocked until ready |
| MUST-024 | 02-performance-and-caching.md | 5) Resource Handling / Fonts | MUST ensure all fonts are loaded before first frame. | PM-090 | E2E: no font-swap on entry |
| MUST-025 | 02-performance-and-caching.md | 5) Resource Handling / Fonts | MUST ensure HOT tier slides have all required fonts loaded (no font-swap flash during transition). | PM-090 | E2E: readiness includes fonts |
| MUST-026 | 02-performance-and-caching.md | 6) Network Resilience / Requirements | MUST cache all assets in Service Worker (offline-first). | PM-090 | E2E: offline run uses cached assets |
| MUST-027 | 02-performance-and-caching.md | 6) Network Resilience / Requirements | MUST handle offline gracefully (disable prefetch, use cached assets only). | PM-091 | E2E: offline disables prefetch |
| MUST-028 | 09-visual-surface-and-scaling.md | 1) Aspect Ratio Handling / Requirements | MUST maintain slide aspect ratio. | PM-030 | UT: scale calc; E2E: viewport assertions |
| MUST-029 | 09-visual-surface-and-scaling.md | 1) Aspect Ratio Handling / Requirements | MUST letterbox when viewport aspect differs. | PM-030 | E2E: letterbox exists |
| MUST-030 | 09-visual-surface-and-scaling.md | 1) Aspect Ratio Handling / Requirements | MUST use theme design token for letterbox color (not hardcoded). | PM-030 | DOM/CSS check: uses var() |
| MUST-031 | 09-visual-surface-and-scaling.md | 2) Scaling / Requirements | MUST use a single scaling transform at the container level (avoid per-element jitter). | PM-030 | E2E: transform only on container |
| MUST-032 | 09-visual-surface-and-scaling.md | 3) High DPI / Requirements | MUST account for `devicePixelRatio` in canvas/WebGL back buffers. | PM-031 | UT: canvas sizing uses DPR |
| MUST-033 | 09-visual-surface-and-scaling.md | 3) High DPI / Requirements | Canvas resize operations MUST reset transforms before applying DPI scaling: `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`. | PM-031 | UT: setTransform called |
| MUST-034 | 07-input-and-controls.md | 1) Keyboard Shortcuts / Requirements | MUST support specified keyboard shortcuts for next/prev/home/end/esc/overlays/grid/laser. | PM-010 | E2E: keyboard script |
| MUST-035 | 07-input-and-controls.md | 1) Keyboard Shortcuts / Input Processing Rules | Key repeat throttle: Ignore key events if last event was <100ms ago. | PM-010 | UT: throttle logic |
| MUST-036 | 07-input-and-controls.md | 1) Keyboard Shortcuts / Input Processing Rules | Modifier keys: `Ctrl`/`Cmd`/`Alt` + shortcut should be ignored. | PM-010 | UT: modifier guard |
| MUST-037 | 07-input-and-controls.md | 1) Keyboard Shortcuts / Input Processing Rules | Numeric entry: accumulate digits; `Enter` commits; `Esc` cancels; auto-commit after 3s timeout. | PM-010 | UT: buffer FSM; E2E: jump-by-number |
| MUST-038 | 07-input-and-controls.md | 2) Mouse Input / Requirements | MUST support click-to-advance (configurable: next build or next slide). | PM-011 | E2E: click advances per config |
| MUST-039 | 07-input-and-controls.md | 2) Mouse Input / Click handling | Default excludeRegions must prevent advance on `.hud`, links, buttons, inputs, video. | PM-012 | E2E: click on link/button does not advance |
| MUST-040 | 07-input-and-controls.md | 3) Touch Input / Requirements | MUST support swipe gestures (left/right for prev/next) and tap-to-reveal HUD. | PM-011 | E2E: touch gestures |
| MUST-041 | 08-navigation-model.md | 1) Linear Navigation / Requirements | MUST track build index per slide; Next from last build MUST advance to next slide; Prev from first build MUST return to previous slide's last build. | PM-020 | UT: nav state machine |
| MUST-042 | 08-navigation-model.md | 2) Non-linear Navigation / Requirements | MUST support jump-to-slide by index (grid navigator, numeric entry). | PM-021 | E2E: grid jump + numeric jump |
| MUST-043 | 08-navigation-model.md | 4) Hidden Slides / Requirements | Hidden slides MUST be accessible via direct jump (grid, numeric entry). | PM-022 | E2E: hidden slide jump works |
| MUST-044 | 10-playback-system.md | 1) Slide Transitions / Requirements | MUST apply author-defined transitions (if supported) and MUST fall back to instant cut if unsupported. | PM-040 | UT: transition selection |
| MUST-045 | 10-playback-system.md | 1) Slide Transitions / Requirements | MUST respect reduced motion preference (disable transitions). | PM-042 | E2E: prefers-reduced-motion disables |
| MUST-046 | 10-playback-system.md | 2) Builds / Requirements | MUST execute builds in author-defined order; MUST support Next/Prev for build navigation; MUST track build index per slide. | PM-020 | UT: build ordering; E2E: build navigation |
| MUST-047 | 12-hud-and-audience-controls.md | 1) Visibility Rules / Requirements | MUST appear on mouse movement and auto-hide after inactivity (~3s). | PM-050 | E2E: reveal + auto-hide timing |
| MUST-048 | 12-hud-and-audience-controls.md | 1) Visibility Rules / Requirements | MUST be accessible via keyboard (focus management) and MUST not permanently obscure content. | PM-050 | E2E: tab focus + overlay bounds |
| MUST-049 | 12-hud-and-audience-controls.md | 2) Controls / Requirements | MUST provide Next/Prev, slide counter, grid access, fullscreen toggle (if supported), and exit button. | PM-050 | E2E: controls exist + work |
| MUST-050 | 12-hud-and-audience-controls.md | 5) Design Tokens (Required) | MUST use design tokens for HUD surfaces and MUST NOT use hardcoded colors. | PM-050 | DOM/CSS check: var() only |
| MUST-051 | 11-presenter-tools.md | 1) Presenter View Window / Requirements | MUST open as separate window (not modal) and MUST survive accidental close (prompt to reopen). | PM-080 | Manual + E2E (where possible) |
| MUST-052 | 11-presenter-tools.md | 4) Sync Protocol / Requirements | MUST keep presenter and audience windows in lockstep (slide/build position) and MUST handle close/reopen without losing position. | PM-080 | UT: protocol; E2E: multi-page sync |
| MUST-053 | 11-presenter-tools.md | 3) Privacy Boundary / Requirements | MUST enforce strict separation: notes/diagnostics never appear in audience DOM. | PM-081 | E2E: audience DOM audit |
| MUST-054 | 11-presenter-tools.md | Privacy Boundary | Speaker notes MUST NOT be in sync messages. | PM-121 | UT: message schema; E2E: payload audit |
| MUST-069 | ../05-slide-notes.md | 4) Rendering + sanitization contract | Notes MUST render via `NotesDoc v1` → safe HTML renderer and MUST NOT inject raw user-provided HTML (links sanitized, no `javascript:`). | PM-120 | UT: `tests/unit/core/notes/NotesDoc.test.js`; E2E: `tests/e2e/specs/functional/slide-notes.spec.ts`; E2E: `tests/e2e/specs/functional/presenter-view.spec.ts` |
| MUST-055 | 16-security-privacy-and-safety.md | 2) Content Security / Requirements | MUST sanitize all user-generated content and MUST prevent XSS via script injection in slides. | PM-120 | UT: sanitizer; E2E: XSS fixture deck |
| MUST-056 | 16-security-privacy-and-safety.md | 2) Content Security / Requirements | MUST validate cross-window messages (postMessage/BroadcastChannel). | PM-121 | UT: validator; E2E: reject malformed |
| MUST-057 | 16-security-privacy-and-safety.md | 1) Privacy Boundaries / Requirements | Speaker notes MUST never appear in audience DOM; diagnostics MUST be presenter-only; sync messages MUST NOT include note content. | PM-081 | E2E: privacy boundary checks |
| MUST-058 | 16-security-privacy-and-safety.md | 3) Audience-Safe Errors / Requirements | MUST not display presenter-only error messages in audience view; MUST fallback gracefully for media failures; MUST log errors to telemetry without sensitive data. | PM-051 | E2E: audience-safe error rendering |
| MUST-059 | 16-security-privacy-and-safety.md | 4) Network Privacy / Requirements | MUST respect Do Not Track (DNT) if enabled. | PM-130 | UT: tests/unit/core/telemetry/Telemetry.test.js |
| MUST-060 | 17-observability-and-quality-gates.md | 1) KPIs / Requirements | MUST instrument KPIs; MUST aggregate telemetry (privacy-safe, no PII); MUST fail CI builds on regression. | PM-130 | E2E: tests/e2e/specs/functional/telemetry.spec.ts; CI perf gate: npm run perf:bench:gate |
| MUST-061 | 17-observability-and-quality-gates.md | 2) Telemetry Events / Requirements | MUST NOT track PII (user identity, deck content, speaker notes). | PM-130 | UT: tests/unit/core/telemetry/Telemetry.test.js; E2E: tests/e2e/specs/functional/telemetry.spec.ts |
| MUST-062 | 17-observability-and-quality-gates.md | 4) Crash Reporting / Requirements | MUST capture stack traces, include context, and sanitize stack traces (remove deck content, notes). | PM-130 | Impl: src/core/telemetry/Telemetry.js + PresentationManager crash hooks |
| MUST-063 | 15-accessibility.md | Requirements | MUST announce slide/build changes to screen readers. | PM-110 | E2E: aria-live announcements |
| MUST-064 | 15-accessibility.md | Requirements | MUST support keyboard-only navigation and MUST not trap focus in presentation mode. | PM-111 | E2E: keyboard-only completion |
| MUST-065 | 03-rendering-in-presentation-mode.md | 2.1 Chrome Hiding | MUST hide editor-only file metadata UI (e.g., file indicator pill) in presentation output. | PM-032 | E2E: file indicator not visible |
| MUST-066 | 03-rendering-in-presentation-mode.md | 2.1 Chrome Hiding | Placeholder authoring affordances MUST NOT appear in presentation (no dashed borders, no prompt text, no placeholder icons). | PM-032 | E2E: empty placeholders not visible |
| MUST-067 | 03-rendering-in-presentation-mode.md | 2.1 Chrome Hiding | Layout guides / guide overlays MUST NOT appear in presentation (renderer DOM overlays such as `.layout-guide-overlay`). | PM-032 | E2E: forbidden selector audit includes `.layout-guide-overlay` |
| MUST-068 | 03-rendering-in-presentation-mode.md | 2.1 Chrome Hiding | Selection boxes / resize handles / rotation handles MUST NOT appear in presentation; if rendered via canvas, they MUST be logically cleared/disabled (not just CSS-hidden). | PM-032 | E2E (planned): no gizmo/selection overlay rendered in presentation |

### 0.3 Use deterministic fixtures (“Golden Decks”) for tests
**Problem:** Without canonical fixtures, coverage is accidental and regressions slip through.

**Rule:** Create and maintain “golden decks” for Playwright/perf that are deterministic and cover edge cases:
- 01-baseline-10-slides (text-only, mixed layouts)
- 02-media-heavy (large images + videos)
- 03-font-stress (multiple families, weights)
- 04-build-stress (many entrance animations / build steps)
- 05-theme-variance (light/dark + accent switch)

Each golden deck MUST document:
- what it covers,
- expected navigation/build counts,
- expected timings bounds.

### 0.4 Rewrite exit criteria into measurable assertions
**Problem:** Vague exits (e.g., “verified in Playwright”, “meets perf”) allow premature gate exits.

**Rule:** Each gate MUST define:
- exact selectors / DOM attributes,
- exact events or markers,
- exact thresholds (with tolerance),
- and what is allowed to be flaky (ideally: nothing).

### 0.5 Be honest about what CI can and cannot prove
Some requirements are perception/hardware dependent (e.g., “pixelation”, multi-display hotplug). CI should validate **proxies** (decode gating, readiness markers, sync protocol correctness) and reserve hardware-specific checks for a documented manual/soak checklist.

### 0.6 Split high-blast-radius gates
**Problem:** Big gates (cache tiers + readiness + perf budgets) encourage half-done merges.

**Rule:** Prefer more gates with smaller scope, each with unambiguous exit criteria.

### 0.7 Feature flag lifecycle is part of “done”
If a feature ships behind a flag, “done” MUST include:
- default state decisions,
- removal plan and date/criteria,
- parity tests for both flag states until removal.

---

## 1) What Can Break In The Existing App (Risk Ledger)

This is a list of **high-probability breakages** when implementing world-class Presentation Mode, grounded in current implementation patterns.

### R1 — Mode transitions can corrupt editor state
- Current behavior: entering presentation toggles editor mode, alters transforms, and changes global input listeners.
- Breakage modes:
  - Exiting presentation can leave transforms/styles applied to `#viewport`, `#slide-content`, `#slide-background`.
  - Global listeners (keydown/mouse) can keep firing in edit mode if guardrails regress.
- Mitigation:
  - Gate 0 adds Playwright assertions for “enter → exit returns to identical DOM + store invariants”.
  - Gate 0 adds Vitest tests for store mode transitions and cleanup invariants.

### R2 — DOM contract breakages (IDs, attributes, structure)
- Presentation code and tests currently assume these DOM nodes exist:
  - `#play-btn`, `#app`, `#viewport`, `#slide-content`, `#slide-background`, `#presentation-hud`, `#presentation-grid-view`, `#grid-content`, `#laser-canvas`, `#overlay-black`, `#overlay-white`
- Breakage modes:
  - Renaming or restructuring breaks PresentationManager/HUD/GridView and Playwright page objects.
- Mitigation:
  - Freeze these as a **compatibility surface** until Gate 8.
  - Gate 0 introduces Playwright DOM contract tests to lock the surface.

### R3 — Fullscreen behavior can regress (and currently has spec mismatch risk)
- Current behavior: on `fullscreenchange`, if fullscreen exits while in presentation, it calls `stopPresentation()`.
- Breakage / mismatch risk:
  - “Present in window” (spec) becomes impossible if fullscreen exit always exits presentation.
  - Automated tests often cannot enter fullscreen; presentation must still function.
- Mitigation:
  - Gate 2 explicitly implements the spec’s fullscreen policy and updates tests.
  - Gate 2 introduces feature-flagged fullscreen policy to avoid breaking existing flows.

### R4 — Input handling conflicts (global keyboard + interactive elements)
- Current behavior: global `keydown` handler advances slides/builds even when focus is inside an editable or interactive element.
- Breakage modes:
  - Links, form elements, media controls can become unusable.
  - Accessibility focus flows can regress.
- Mitigation:
  - Gate 3 enforces focus + “interactive element priority” rules from [07-input-and-controls.md](07-input-and-controls.md).
  - Playwright tests validate focus behavior and that interactive controls win.

### R5 — Transitions can reveal partially loaded assets (pixelation)
- Current behavior: `PresentationRenderer` mounts the next slide view and begins transition immediately; no decode readiness gate.
- Breakage modes:
  - Pixelated images/videos during fade/magic transitions.
  - Fonts pop-in after transition.
- Mitigation:
  - Gate 4 adds transition readiness gating defined in [02-performance-and-caching.md](02-performance-and-caching.md).
  - Gate 4 adds Playwright “no-pixelation” validation hooks and deterministic readiness checks.

### R6 — Build semantics mismatch
- Current behavior: builds are derived from `el.animations.entrance !== 'none'` and ordered by element order.
- Spec requires:
  - A formal navigation/build model and deterministic semantics (see [08-navigation-model.md](08-navigation-model.md) and [10-playback-system.md](10-playback-system.md)).
- Mitigation:
  - Gate 5 introduces spec-defined build detection/ordering and migrates safely.

### R7 — Theming regressions via hardcoded colors
- Spec requires: tokens/CSS variables, no new hardcoded colors (see [01-principles.md](01-principles.md), [13-theming-and-polish.md](13-theming-and-polish.md)).
- Current code contains some hardcoded fallback values (e.g., default slide background).
- Mitigation:
  - Gate 1 adds “no-hardcoded-color” lint/grep checks for the presentation surface.
  - Gate 7 validates Light/Dark and theme accent switching.

### R8 — Serialization / collaboration / undo-redo regressions
- Presentation Mode touches navigation state, notes, and potentially per-slide transient runtime state.
- Breakage modes:
  - Polluting persisted `.str` format with runtime-only data.
  - Collab engine syncing transient runtime state across collaborators.
  - Undo/redo stacks recording runtime-only state.
- Mitigation:
  - Gate 6 formalizes persistence boundaries (runtime-only vs saved) per [19-implementation-boundaries-and-extensibility.md](19-implementation-boundaries-and-extensibility.md).

---

## 2) Prerequisites Not Satisfied In Current Implementation (Gap Ledger)

This section answers: **“What prerequisites are not satisfied in the current implementation for the world-class Presentation Mode spec to work?”**

Each gap includes **handling strategy** (how we will close it without breaking the app).

### G1 — Presenter View is not implemented
- Evidence (historical): previously missing.
- Current: implemented via menu action `present-presenter` → `startPresenterView()` and `presentation:open-presenter-view`, opening a `?presenter=1` popup with lockstep sync.
- Spec source: [11-presenter-tools.md](11-presenter-tools.md)
- Handling:
  - Gate 6 adds a dedicated presenter surface and a typed sync protocol.
  - Privacy boundary enforced: notes never appear in audience DOM.

### G2 — Transition readiness gating (decode-first) is not implemented
- Evidence: `AnimationManager.transition()` runs immediately; no `Image.decode()`, video first-frame readiness, or font readiness gating.
- Spec source: [02-performance-and-caching.md](02-performance-and-caching.md), [10-playback-system.md](10-playback-system.md)
- Handling:
  - Gate 4 introduces an Asset Readiness API and blocks transitions until ready.
  - Presenter-only “loading” indicator while blocking.

### G3 — Cache tiers (ACTIVE/HOT/WARM/COLD) are not implemented end-to-end
- Evidence: no cache manager used by the renderer to keep decoded assets warm across navigation.
- Spec source: [02-performance-and-caching.md](02-performance-and-caching.md)
- Handling:
  - Gate 4 introduces cache tiers and memory budgeting.
  - Implement behind a feature flag; verify via telemetry/perf tests.

### G4 — Formal navigation state machine and back-stack are not implemented
- Evidence: navigation is index-based only; no “back stack” beyond prev.
- Spec source: [08-navigation-model.md](08-navigation-model.md)
- Handling:
  - Gate 5 implements navigation model + jump semantics, including hidden slides and linked navigation.

### G5 — Accessibility implementation is incomplete
- Evidence: some ARIA exists (HUD buttons), but no spec-defined live announcements, focus policy, reduced motion enforcement, and a11y tests.
- Spec source: [15-accessibility.md](15-accessibility.md)
- Handling:
  - Gate 7 adds live regions + focus rules + reduced motion enforcement + Playwright a11y validation.

### G6 — Security/privacy boundaries are not enforced for multi-window
- Evidence: presenter window is not implemented; no message validation can exist yet.
- Spec source: [16-security-privacy-and-safety.md](16-security-privacy-and-safety.md)
- Handling:
  - Gate 6 adds strict message allowlist validation and origin checks.

### G7 — Observability and quality gates are not wired to CI
- Evidence: telemetry schema exists in docs; implementation gates are not enforced.
- Spec source: [17-observability-and-quality-gates.md](17-observability-and-quality-gates.md)
- Handling:
  - Gate 8 introduces CI gates for perf and DOM compliance.

### G8 — Kiosk/autoplay/rehearse modes are not implemented
- Evidence (historical): no runtime scheduler/timer system for autoplay loops.
- Current: kiosk/autoplay scheduler implemented behind a feature flag with deterministic test hooks.
- Spec source: [06-mode-taxonomy-and-entry-exit.md](06-mode-taxonomy-and-entry-exit.md)
- Handling:
  - Gate 10 implements kiosk/autoplay behind flags and adds deterministic test controls.
  - Remaining: rehearsal/timer workflows (if required by parity checklist).

---

## 3) Handling Strategy (How Gaps Will Be Closed)

### 3.1 Strict TDD rule
- Every gate starts by writing:
  - Vitest unit tests for logic/state.
  - Playwright DOM tests for visible UI and interaction.
- Implementation only proceeds once tests clearly fail for the missing behavior.

### 3.2 Compatibility-first delivery
- Preserve existing Presentation Mode behaviors unless a spec requires changing them.
- Introduce breaking changes only when:
  - a gate explicitly declares them, and
  - Playwright coverage proves the new behavior, and
  - risks are mitigated with migration/flags.

### 3.3 Feature flags and safe rollout
- New high-risk systems (cache tiers, transition gating, presenter view, kiosk) MUST be behind feature flags until Gate 8 parity audit passes.

---

## Spec Coverage Ledger (Source of Truth)

Status values (use these exact words to keep search/filters simple):
- **Readiness**: `NOT REVIEWED` | `BLOCKED` | `READY`
- **Implementation**: `NOT STARTED` | `IN PROGRESS` | `DONE`
- **Tests**: `NONE` | `VITEST` | `PLAYWRIGHT` | `VITEST+PLAYWRIGHT`
- **Artifacts**: `NONE` | `CORPUS` | `GOLDENS` | `PERF` | `MIXED`

Ledger is maintained in this file because the plan and the traceability system must never drift.

Emoji status (quick scan): ✅ Done · 🟡 In progress · ❌ Not started · ⛔ Blocked

| Status | Spec file | Readiness | Implementation | Tests | Artifacts | Notes (owner, links, gaps) |
|---|---|---|---|---|---|---|
| ✅ | `00-master-outline.md` | READY | DONE | NONE | NONE | Outline-only; keep in sync with spec suite structure. |
| ✅ | `01-principles.md` | READY | DONE | NONE | NONE | Principles locked; must match gating + audience-clean DOM rules. |
| ✅ | `03-rendering-in-presentation-mode.md` | READY | DONE | VITEST+PLAYWRIGHT | NONE | Audience-clean DOM contract + forbidden-selector audit enforced by Playwright. |
| ✅ | `06-mode-taxonomy-and-entry-exit.md` | READY | DONE | PLAYWRIGHT | NONE | Entry/exit + fullscreen policy locked by functional tests. |
| ✅ | `07-input-and-controls.md` | READY | DONE | VITEST+PLAYWRIGHT | NONE | Input buffering/throttle + interactive priority covered by unit + e2e. |
| ✅ | `08-navigation-model.md` | READY | DONE | VITEST+PLAYWRIGHT | NONE | Slide/build parity + jump semantics covered by unit + e2e. |
| ✅ | `09-visual-surface-and-scaling.md` | READY | DONE | VITEST+PLAYWRIGHT | NONE | Aspect-fit + letterbox + DPR correctness enforced. |
| ✅ | `10-playback-system.md` | READY | DONE | VITEST+PLAYWRIGHT | NONE | BuildIndex semantics and transition gating proxies implemented. |
| ✅ | `12-hud-and-audience-controls.md` | READY | DONE | PLAYWRIGHT | NONE | HUD visibility + controls parity enforced. |
| ✅ | `02-performance-and-caching.md` | READY | DONE | VITEST+PLAYWRIGHT | PERF | Tiered prefetch + HOT gating enforced; perf harness exists (baseline work continues in later gates). |
| ✅ | `13-theming-and-polish.md` | READY | DONE | PLAYWRIGHT | NONE | Token discipline for stage/HUD + reduced motion/forced colors behaviors. |
| ✅ | `14-reliability-and-recovery.md` | READY | DONE | PLAYWRIGHT | NONE | Audience-safe error surfacing rules enforced where applicable. |
| 🟡 | `11-presenter-tools.md` | READY | IN PROGRESS | VITEST+PLAYWRIGHT | NONE | Scope expanded to PowerPoint parity: automatic dual-display behavior (host adapter tiers), display assignment + Swap Displays, presenter surface IA (current/next/notes/timer/clock/progress), keyboard parity, and a required DOM contract for test hooks. Current impl/tests: popup + lockstep sync + close→reopen recovery covered by Playwright `tests/e2e/specs/functional/presenter-view.spec.ts`; message validation covered by unit `tests/unit/core/presentation/PresenterSyncValidation.test.js`. Remaining: buildIndex lockstep, swap UI, host adapter implementation + hotplug behavior, richer presenter navigation surfaces (thumbnails/sorter) and controls parity. |
| 🟡 | `15-accessibility.md` | READY | IN PROGRESS | PLAYWRIGHT | NONE | Gate 8 Playwright added and green: `tests/e2e/specs/functional/presentation-accessibility.spec.ts` (live region announcements, HUD aria + toggles, keyboard-only exit, reduced motion disables transitions). Remaining: extend coverage for contrast/forced-colors and theme switching assertions. |
| 🟡 | `16-security-privacy-and-safety.md` | READY | IN PROGRESS | VITEST+PLAYWRIGHT | NONE | Message allowlist + malformed rejection covered: unit `tests/unit/core/presentation/PresenterSyncValidation.test.js`, e2e `tests/e2e/specs/functional/presenter-view.spec.ts`. Remaining: broaden negative cases + ensure no presenter-only DOM leaks under stress. |
| 🟡 | `17-observability-and-quality-gates.md` | READY | IN PROGRESS | VITEST+PLAYWRIGHT | PERF | Telemetry core + debug hook + perf gate mode implemented; remaining: expand crash fixture coverage and add explicit regression test for gated perf failure. |
| ✅ | `18-test-strategy.md` | READY | DONE | NONE | NONE | Documentation-only; must reflect current test contract and fixtures. |
| ✅ | `19-implementation-boundaries-and-extensibility.md` | READY | DONE | NONE | NONE | Documentation-only; clarifies what must not leak to audience. |
| ✅ | `20-parity-mapping-table.md` | READY | DONE | NONE | NONE | Documentation-only; parity map for review. |
| ✅ | `21-constants-and-configuration.md` | READY | DONE | VITEST | NONE | Constants/config surface documented; tests cover key invariants where present. |
| ✅ | `22-implementation-readiness.md` | READY | DONE | NONE | NONE | Documentation-only readiness checklist; updated during gate work. |
| ✅ | `00-benchmark-gap-checklist.md` | READY | DONE | NONE | PERF | Checklist for perf gaps; perf artifacts enforced later (Gate 9). |

---

## 5) Comprehensive Requirement Ledger (By Surface)

This ledger is exhaustive at the “feature surface” level. Individual subtasks may be split during implementation, but **no item may be dropped**.

**Hard rule:** Each `PM-###` MUST be expanded into a traceability row (see 0.1). The surface list below is a starting index, not sufficient proof of completeness.

### 5.1 Entry/Exit + Mode lifecycle
- PM-001 Entry points (play button, menu from beginning/current)
  - Spec: [06-mode-taxonomy-and-entry-exit.md](06-mode-taxonomy-and-entry-exit.md)
  - Impl: mode handlers + PresentationManager
  - Tests: UT + E2E start/exit
- PM-002 Fullscreen policy (success/denial/external exit)
  - Spec: [06-mode-taxonomy-and-entry-exit.md](06-mode-taxonomy-and-entry-exit.md)
  - Tests: E2E denies fullscreen still works
- PM-003 State restoration back to editor (no leaked transforms/classes)
  - Spec: [06-mode-taxonomy-and-entry-exit.md](06-mode-taxonomy-and-entry-exit.md)

### 5.2 Input and controls
- PM-010 Keyboard mappings (advance/back, jump buffer, grid, overlays)
  - Spec: [07-input-and-controls.md](07-input-and-controls.md)
- PM-011 Mouse/touch policies (click-to-advance zones, wheel policy, gesture thresholds)
  - Spec: [07-input-and-controls.md](07-input-and-controls.md)
- PM-012 Interactive element priority (links/media/forms)
  - Spec: [07-input-and-controls.md](07-input-and-controls.md)

### 5.3 Navigation + builds
- PM-020 Next/prev semantics including builds
  - Spec: [08-navigation-model.md](08-navigation-model.md), [10-playback-system.md](10-playback-system.md)
- PM-021 Jump-to-slide semantics + back-stack
  - Spec: [08-navigation-model.md](08-navigation-model.md)
- PM-022 Hidden slides policy
  - Spec: [08-navigation-model.md](08-navigation-model.md)

### 5.4 Visual surface + scaling
- PM-030 Scaling/letterboxing algorithm matches spec
  - Spec: [09-visual-surface-and-scaling.md](09-visual-surface-and-scaling.md)
- PM-031 HiDPI fidelity rules applied
  - Spec: [09-visual-surface-and-scaling.md](09-visual-surface-and-scaling.md)
- PM-032 Presentation chrome hiding (audience-clean surface)
  - Spec: [03-rendering-in-presentation-mode.md](03-rendering-in-presentation-mode.md)
  - Includes: file indicator UI, placeholder affordances, editor popovers/modals/toasts, renderer DOM guide overlays (e.g., `.layout-guide-overlay`), and canvas-based selection/handles must be cleared/disabled.

### 5.5 Playback + transitions
- PM-040 Transition types + configuration
  - Spec: [10-playback-system.md](10-playback-system.md)
- PM-041 Transition readiness gating (decode-first)
  - Spec: [02-performance-and-caching.md](02-performance-and-caching.md)
- PM-042 Reduced-motion behavior
  - Spec: [13-theming-and-polish.md](13-theming-and-polish.md)

### 5.6 HUD + audience controls
- PM-050 HUD DOM structure + show/hide + keyboard access
  - Spec: [12-hud-and-audience-controls.md](12-hud-and-audience-controls.md)
- PM-051 Audience-safe error surfacing
  - Spec: [14-reliability-and-recovery.md](14-reliability-and-recovery.md)

### 5.7 Grid navigator
- PM-060 Grid open/close, selection, click-to-jump
  - Spec: [03-rendering-in-presentation-mode.md](03-rendering-in-presentation-mode.md), [08-navigation-model.md](08-navigation-model.md)

### 5.8 Laser pointer
- PM-070 Laser pointer rendering + performance
  - Spec: [03-rendering-in-presentation-mode.md](03-rendering-in-presentation-mode.md)

### 5.9 Presenter tools
- PM-080 Presenter View window + layout + sync protocol
  - Spec: [11-presenter-tools.md](11-presenter-tools.md)
- PM-081 Privacy boundary (notes never in audience)
  - Spec: [11-presenter-tools.md](11-presenter-tools.md), [16-security-privacy-and-safety.md](16-security-privacy-and-safety.md)

### 5.10 Performance + caching
- PM-090 Cache tiers ACTIVE/HOT/WARM/COLD + memory budgets
  - Spec: [02-performance-and-caching.md](02-performance-and-caching.md)
- PM-091 Prefetch heuristics and eviction rules
  - Spec: [02-performance-and-caching.md](02-performance-and-caching.md)

### 5.11 Reliability + recovery
- PM-100 Error codes + recovery actions
  - Spec: [14-reliability-and-recovery.md](14-reliability-and-recovery.md), [21-constants-and-configuration.md](21-constants-and-configuration.md)

### 5.12 Accessibility
- PM-110 Live region announcements for slide/build changes
  - Spec: [15-accessibility.md](15-accessibility.md)
- PM-111 Focus policy + keyboard-only completion
  - Spec: [15-accessibility.md](15-accessibility.md)

### 5.13 Security + privacy
- PM-120 Sanitization policy for rendered content
  - Spec: [16-security-privacy-and-safety.md](16-security-privacy-and-safety.md)
- PM-121 Cross-window message validation
  - Spec: [16-security-privacy-and-safety.md](16-security-privacy-and-safety.md)

### 5.14 Observability
- PM-130 Telemetry events and quality gate measurements
  - Spec: [17-observability-and-quality-gates.md](17-observability-and-quality-gates.md)
  - Impl: src/core/telemetry/Telemetry.js; src/core/PresentationManager.js; src/core/Store.js
  - Tests: tests/unit/core/telemetry/Telemetry.test.js; tests/e2e/specs/functional/telemetry.spec.ts; npm run perf:bench:gate

### 5.15 Kiosk / rehearsal
- PM-140 Kiosk/autoplay + exit policy
  - Spec: [06-mode-taxonomy-and-entry-exit.md](06-mode-taxonomy-and-entry-exit.md)

---

## 6) Gate Plan (Exhaustive, With Exit Criteria)

This is the **hardened** gate plan. It is intentionally more granular and more measurable.

### Gate 0 ✅ — Baseline safety net (lock current behavior)
**Goal:** prevent regressions while upgrading implementation.
- Add Playwright DOM contract tests asserting required IDs exist (at minimum: `#viewport`, `#slide-content`, `#slide-background`, `#presentation-hud`, `#presentation-grid-view`, `#laser-canvas`, `#overlay-black`, `#overlay-white`).
- Add Playwright “audience-clean DOM audit” enforcing the forbidden-selector checklist for Presentation chrome hiding (PM-032), including placeholders, file indicator, editor chrome, menus/modals/toasts, and renderer DOM guide overlays.
- Add Playwright “enter → exit restores editor” tests that assert:
  - `document.body` loses `mode-presentation` and `laser-active` on exit.
  - `#viewport` transform/position styles are reset.
  - HUD/grid/overlays are hidden.
- Exit criteria:
  - Existing Vitest + Playwright pass.
  - New invariants pass.

### Gate 1 ✅ — Mode lifecycle correctness (windowed + fullscreen)
**Goal:** match spec-defined fullscreen and windowed presenting.
- Implement fullscreen policy without forcing exit when fullscreen exits unless spec says so.
- Add fullscreen denial handling.
- Exit criteria:
  - Playwright covers “fullscreen denied → still presents windowed”.
  - Playwright covers “fullscreen exits externally → remains in presentation (windowed)” if required by spec.

### Gate 2 ✅ — Input model + interactive element priority
**Goal:** match [07-input-and-controls.md](07-input-and-controls.md) exactly.
- Implement numeric jump buffer, throttling, and focus/interactive priority.
- Exit criteria:
  - Playwright keyboard-only script passes (defined steps + assertions, not a manual statement).
  - Playwright validates that focused interactive elements do not trigger slide advance.

### Gate 3 ✅ — Navigation + builds baseline parity
**Goal:** match [08-navigation-model.md](08-navigation-model.md) and current build behavior safely.
- Introduce the formal state machine and back-stack semantics.
- Exit criteria:
  - Unit tests cover state machine transitions.
  - Playwright covers linear + non-linear navigation.

### Gate 4 ✅ — Transition readiness gating (decode-first) WITHOUT cache tiers
**Goal:** prevent pixelated transitions using deterministic readiness proxies.
- Add an asset-readiness API that blocks transition start until:
  - images: `decode()` completed (or equivalent),
  - fonts: `document.fonts.ready` satisfied for required families,
  - video: first-frame readiness proxy is satisfied (e.g., metadata + can render a frame).
- Exit criteria:
  - Playwright asserts `transitionStartedAt >= readinessSatisfiedAt` for the next slide.
  - Playwright asserts no “loading UI” appears in audience view.

### Gate 5 ✅ — Cache tiers (ACTIVE/HOT/WARM/COLD) + perf baselines
**Goal:** hit perf targets using stable measurements.
- Implement cache tiers and eviction.
- Add performance harness + baselines using golden decks.
- Exit criteria:
  - Perf tests run on defined golden decks and produce JSON artifacts.
  - Thresholds are asserted with explicit tolerance rules.

### Gate 6 ✅ — HUD + Grid + Laser parity (audience-safe)
**Goal:** ensure audience-visible controls match spec and don’t regress.
- Ensure visual surface matches [09-visual-surface-and-scaling.md](09-visual-surface-and-scaling.md):
  - aspect-fit scaling + letterboxing,
  - token-based stage background,
  - DPR-correct canvas rendering.
- Ensure HUD DOM structure and behaviors match [12-hud-and-audience-controls.md](12-hud-and-audience-controls.md).
- Ensure grid navigator behavior matches [03-rendering-in-presentation-mode.md](03-rendering-in-presentation-mode.md).
- Exit criteria:
  - Playwright validates show/hide timers, button actions, and grid click-to-jump.
  - Playwright validates stage transform semantics and stage background token usage.
  - Unit tests validate scale math + DPR canvas sizing and transform reset.

### Gate 7 ✅ — Presenter View + security/privacy boundary
**Goal:** implement Presenter View without leaking presenter-only data.
- Implement presenter window + typed sync.
- Implement strict message validation.
- Exit criteria:
  - Playwright validates:
    - presenter view opens,
    - slide/build changes sync both directions,
    - notes are never present in audience DOM or sync payloads,
    - presenter notes render via `NotesDoc v1` safe HTML (no raw HTML injection).
  - Security tests validate malformed messages are ignored.

### Gate 8 🟡 — Accessibility + theming discipline
**Goal:** meet a11y requirements and token discipline.
- Implement live region announcements and focus rules.
- Add “no new hardcoded colors” checks for presentation surface.
- Exit criteria:
  - Playwright a11y checks pass for key flows.
  - Theme switching tests pass (light/dark + accent).

### Gate 9 🟡 — Observability + CI quality gates
**Goal:** make performance/quality regression-proof.
- Implement telemetry events and wire CI gates.
- Exit criteria:
  - Telemetry schema conformance is validated by tests.
    - UT: tests/unit/core/telemetry/Telemetry.test.js
    - E2E: tests/e2e/specs/functional/telemetry.spec.ts
  - CI-style perf gate exists and fails on registry gate violations.
    - Script: npm run perf:bench:gate
  - Remaining:
    - Expand crash fixture coverage and add explicit regression test for gated perf failure.

### Gate 10 ✅ — Kiosk/autoplay/rehearsal modes
**Goal:** implement unattended loops and rehearsal workflows deterministically.
- Implement kiosk and rehearsal behind feature flags.
- Exit criteria:
  - Playwright deterministically validates autoplay timing and exit policy.
  - Current: kiosk/autoplay + loop + disableInput + optional password-hash exit implemented and covered by:
    - Unit: tests/unit/core/presentation/KioskMode.test.js
    - E2E: tests/e2e/specs/functional/kiosk-mode.spec.ts
  - Interruption policy: user input resets autoplay countdown, covered by:
    - Unit: tests/unit/core/presentation/KioskMode.test.js
    - E2E: tests/e2e/specs/functional/kiosk-mode.spec.ts
  - Rehearsal timings (per-slide + total) + pause/resume semantics in Presenter View, covered by:
    - Unit: tests/unit/core/presentation/RehearsalTimings.test.js
    - E2E: tests/e2e/specs/functional/presenter-view.spec.ts

### Gate 11 ❌ — Final parity audit (“no spec/impl gaps”)
**Goal:** formal sign-off.
- Every `PM-###` item MUST have a completed traceability row.
- Exit criteria:
  - 100% MUST coverage.
  - Each MUST has at least one automated verification (unit and/or e2e).
  - No open TODO/NOTE remains in spec files for MUST behaviors.

---

## 7) Canonical Definition Of “Done”

Presentation Mode is considered **complete** only when:
- Gates 0–11 are **exited**, and
- every MUST requirement in the spec suite has:
  - implementation, and
  - automated verification (Vitest and/or Playwright), and
  - no unresolved ambiguity or “implementation choice” left to decide.

**Important nuance:** “no pixelation” is enforced in CI via readiness gating proxies (decode-first) plus optional visual regression snapshots; human-perception checks (GPU/display hotplug) are tracked as a manual/soak checklist that cannot be substituted for the automated proxies.
