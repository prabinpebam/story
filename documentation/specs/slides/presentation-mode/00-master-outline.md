# Presentation Mode — Master Outline (World‑Class Spec Structure)

**Purpose**
This document is the canonical outline for specifying Presentation Mode in Story. Each section below should be expanded into one or more dedicated spec documents with:
- Goals / non-goals
- User stories + primary journeys
- Requirements (MUST/SHOULD/MAY)
- Acceptance criteria
- Telemetry/metrics
- Test plan
- Edge cases + failure handling

**Scope note**
“Presentation Mode” here includes all runtime viewing/performing experiences (fullscreen playback, presenter view/dual-screen, kiosk/autoplay, reading/preview if included). The editor experience is out of scope except where it must coordinate entry/exit and state restoration.

**Guiding principles**
- See: `01-principles.md` (detailed)

**Performance & caching**
- See: `02-performance-and-caching.md` (detailed)

**Rendering model**
- See: `03-rendering-in-presentation-mode.md` (detailed)

**Delivery ledger + gates (implementation plan)**
- See: `23-ledger-and-gate-plan.md` (canonical delivery checklist, risks, prerequisites, gate exit criteria)
**Constants & configuration**
- See: `21-constants-and-configuration.md` (all timing values, thresholds, defaults, validation rules)
**Benchmarking & parity tracking**
- See: `00-benchmark-gap-checklist.md` (detailed)
- See: `20-parity-mapping-table.md` (tracking)

---

## 0) Benchmark Gap Checklist (PowerPoint / Keynote / Google Slides)

**Detailed spec:** `00-benchmark-gap-checklist.md`

This section captures commonly expected capabilities from the top tools. As we detail each spec area below, explicitly map each item to:
- **Parity** (must match), **Surpass** (delighter), or **Out of scope** (with rationale).

### 0.1 Show Configuration (what users expect to be configurable)
- Start options: from beginning, from current, from a selected slide, from a “custom show” subset.
- Show type: fullscreen, windowed presentation (“present in window”), reading/preview mode.
- Display selection: choose monitor/projector; move show to a different display; remember preference.
- Looping: loop until Esc; loop N times; stop at last; “kiosk” restrictions.
- Timings: use recorded timings; ignore timings; rehearse timings; per-slide timing overrides.
- Narration: play/ignore narration; microphone/camera inclusion (if recording exists).
- Interaction policies: allow hyperlinks; allow scrolling; disable mouse wheel; disable right-click; disable keyboard.
- Pointer policies: cursor always visible vs auto-hide; pointer tool default; laser/pen enabled/disabled.

### 0.2 Presenter View (professional presenter expectations)
- Current + next slide preview, slide numbers/total, section title (if sections exist).
- Speaker notes: editable, scalable font size, scroll position retention.
- Timer tools: elapsed + clock + optional remaining; pause/reset; rehearsal timing.
- On-the-fly navigation: thumbnail strip/grid; jump by number/title; search.
- “Blank screen” controls (black/white), and quick resume.
- Display management: “swap displays”, “show presenter view”, handle display hotplug.

### 0.3 Pointer / Ink / Annotation Tools
- Laser pointer; pen; highlighter; eraser; clear all.
- Colors + thickness; tool palette; keyboard shortcuts.
- Annotation persistence policy: ephemeral (per slide) vs saved; export behavior.
- Spotlight/zoom pointer (a common pro feature) and/or magnifier.

### 0.4 Navigation & Slide Organization
- Sections + section navigation; “go to section”.
- Hidden slides: respect hidden by default; override to include.
- Custom shows / playlists (subset + alternate order) for different audiences.
- Hyperlinks + action buttons: navigate to slide, open URL, trigger media.

### 0.5 Live Presenting / Remote Control
- Phone-as-clicker; presenter remote pairing; reconnect/resume.
- Present to a meeting: windowed mode to share; audience link (if supported).
- Live captions/subtitles (accessibility), possibly translation (optional/surpass).

### 0.6 Recording / Export (Keynote/PowerPoint expectations)
- Record slideshow: audio narration + optional camera + pointer/ink capture.
- Export to video; export “handouts” with notes; print notes.
- Deterministic playback for recording and automated tests.

### 0.7 Reliability & Professionalism
- “Never embarrass the presenter”: no jank on next/prev, no missing fonts, no loud errors.
- Graceful failure modes: replace missing media, show loading states presenter-only.
- Fast exit back to editor without state corruption.

---

## 1) Product Bar + Benchmarks

**Detailed spec:** `04-product-bar-and-benchmarks.md`
- Define “world class” as measurable KPIs.
- Competitive benchmark behaviors (match) and differentiation opportunities (surpass).
- Target devices/environments: desktop, laptop, tablets; projector/TV; low-power hardware.

**Deliverables**
- KPI table (targets + max acceptable)
- Competitive behavior matrix
- Supported platforms + constraints

---

## 2) Core User Journeys (End-to-End)

**Detailed spec:** `05-core-user-journeys.md`
- Start show: from beginning / from current / from selected slide / from deep link.
- Linear delivery: builds + transitions + narration timing.
- Non-linear presenting: jump, grid, section navigation, linked slides, back stack.
- Live controls: pause, blank screen, pointer hide, timer control.
- Dual-screen: audience clean feed + presenter tools.
- Kiosk/autoplay: unattended looping, interruption rules.
- Recovery: reload, sleep/wake, display hotplug, missing assets.

**Deliverables**
- Journey maps + state diagrams
- “Must not break” invariants per journey

---

## 3) Mode Taxonomy + Entry/Exit Rules

**Detailed spec:** `06-mode-taxonomy-and-entry-exit.md`
- Modes: Viewer (single-screen), Presenter View (dual-screen), Fullscreen vs windowed, Kiosk/autoplay, Reading/preview (if included), Recording/streaming (if included).
- Entry points: toolbar/menu/shortcut/context menu/API.
- Exit points: Esc/end-show/menu; end-of-deck behavior (loop/exit/blank).
- Focus management, fullscreen permissions, pointer/cursor policies.
- Multi-display policy: choose target display; swap displays; handle hotplug.

**Deliverables**
- Mode matrix (capabilities, UI visibility, navigation)
- Entry/exit sequencing + restoration rules

---

## 4) Input & Control System (Unified + Predictable)

**Detailed spec:** `07-input-and-controls.md`
- Keyboard: next/prev/build, jump-to-slide, grid, black/white screen, pointer tools, fullscreen, help overlay.
- Mouse: click-to-advance zones, context menu, scroll wheel policy, cursor auto-hide rules.
- Touch/pen: swipe, pinch grid, long-press laser/annotation.
- Clickers/remotes: Bluetooth clickers, phone remote, latency and reconnect behavior.
- Interactions with “interactive slide elements” (links/buttons/forms) vs “advance”.
- Annotation tooling input: pen/highlighter/eraser; color + thickness; clear.

**Deliverables**
- Input mapping table + conflict resolution rules
- Accessibility-first keyboard story

---

## 5) Navigation Model (Slides + Builds + Links)

**Detailed spec:** `08-navigation-model.md`
- State machine: build step vs slide transition vs paused/blocked.
- Jump semantics: what resets vs what continues (builds, media, timers).
- Grid navigator: thumbnails, quick jump, keyboard nav, search, hidden slides.
- Linked-slide navigation: prefetch priority, back-stack semantics.
- Sections + custom shows/playlists (subset order) and their navigation rules.

**Deliverables**
- Formal navigation state machine
- Jump/back-stack spec

---

## 6) Visual Presentation Surface (Rendering + Layout)

**Detailed spec:** `09-visual-surface-and-scaling.md`
- Aspect ratio handling: fit/fill/original/custom safe area.
- Letterboxing: color rules, theming.
- High-DPI strategy: sharp text/vectors, devicePixelRatio.
- Cross-browser rendering consistency; GPU/compositing strategy.
- Safe zones + overscan for projectors/TVs.

**Deliverables**
- Scaling algorithm spec
- Visual fidelity acceptance criteria

---

## 7) Playback System (Transitions, Animations, Media)

**Detailed spec:** `10-playback-system.md`
- Transitions: timing, easing, interruptibility, morph rules.
- Builds: ordering, grouping, triggers (on click/after previous/with previous).
- Skip/fast-forward behavior.
- Media: autoplay vs click-to-play, buffering, captions/subtitles, audio routing.
- Determinism guarantees for testing/recording.
- “Show settings” overrides: disable animations, disable narration, ignore timings.

**Deliverables**
- Timeline model + sequencing rules
- Media policy matrix

---

## 8) Presenter Tools (The “Pro” Surface)

**Detailed spec:** `11-presenter-tools.md`
- Presenter View layout: current/next, notes, timer, progress, navigation, jump.
- Notes system: formatting, per-slide, autosave, search, import/export.
- Timing tools: start/pause/reset; rehearsal mode; pacing indicators.
- Utilities: blank screen, highlight/laser, annotation/ink.
- Multi-window sync protocol: state replication, drift, reconnect/resync.
- Display controls: select/swap displays; “present in window” for screen-share.
- Presenter coaching (optional/surpass): pacing cues, filler-word detection, rehearsal analytics.

**Deliverables**
- Presenter view information architecture
- Sync protocol + failure recovery spec

---

## 9) HUD / On-Screen Controls (Audience-Safe)

**Detailed spec:** `12-hud-and-audience-controls.md`
- Minimal overlay; appears on activity, auto-hides.
- Controls: prev/next, grid, pointer/ink, fullscreen, menu, slide count.
- Error surfacing policy: presenter-only vs audience-safe.
- Annotation UI: compact pen/highlighter palette + eraser + clear.

**Deliverables**
- HUD layout + show/hide rules
- Notification + error policy

---

## 10) Theming & Visual Polish (Present vs Edit Context)

**Detailed spec:** `13-theming-and-polish.md`
- Separation: slide content theme vs presentation UI theme.
- Contrast/readability in dark rooms; projector/TV constraints.
- Cursor visibility; control affordances.

**Deliverables**
- Theme tokens used in presentation runtime
- Contrast/accessibility checks

---

## 11) Performance Architecture (Zero-Lag Feel)

**Detailed spec:** `02-performance-and-caching.md`
- Slide caching: hot/warm/cold tiers; predictive loading.
- Pre-render adjacent slides; thumbnail pipelines.
- Asset pipeline: image decode scheduling; font loading/fallback; video prebuffer.
- Main-thread budgeting: input priority, animation scheduling.
- Memory budgets + eviction; large deck behavior.

**Deliverables**
- Cache strategy + budgets
- Performance test harness requirements
- A single authoritative performance spec (avoid divergence)

---

## 12) Reliability & Recovery

**Detailed spec:** `14-reliability-and-recovery.md`
- Degradation when: fullscreen denied, second screen missing, low-memory, API unsupported.
- Resume after backgrounding, sleep/wake, back/forward, display move.
- Offline/spotty network: preflight, placeholders, “missing asset” UX.
- Display hotplug: add/remove external display while presenting; resync windows.

**Deliverables**
- Recovery playbook (what the app does in each failure)
- “Never crash” invariants

---

## 13) Accessibility & Inclusive Design

**Detailed spec:** `15-accessibility.md`
- Keyboard-only operation; focus traps done right.
- Reduced motion support.
- Captions/subtitles; high-contrast support.
- Screen reader strategy for controls (and approach for slide content if canvas-based).
- Live captions/subtitles during presenting (parity expectation for modern tools; implementation may vary).

**Deliverables**
- A11y requirements + acceptance criteria
- Assistive tech test plan

---

## 14) Security, Privacy, and Safety

**Detailed spec:** `16-security-privacy-and-safety.md`
- Presenter notes privacy boundaries (never leak to audience).
- External content sandboxing; link handling.
- Telemetry and data handling constraints.

**Deliverables**
- Privacy boundary spec (what is allowed where)
- Threat model notes (presentation runtime)

---

## 15) Observability & Quality Gates

**Detailed spec:** `17-observability-and-quality-gates.md`
- Instrumentation: first-frame time, next/prev latency, dropped frames, memory, cache hit ratio, media start.
- Debug overlays (dev-only): FPS, cache state.
- Release gates: benchmark decks + regression thresholds.

**Deliverables**
- Metrics schema + dashboards
- Release gating checklist

---

## 16) Test Strategy (World-Class Confidence)

**Detailed spec:** `18-test-strategy.md`
- E2E: enter/exit, navigation, presenter sync, kiosk, grid, blank screen.
- Performance: large decks, heavy media, font stress, throttling.
- Visual regression: HUD/layout/letterboxing/transitions.
- Chaos: hotplug displays, memory pressure, backgrounding.
- Benchmark parity tests: one representative scenario per item in “Benchmark Gap Checklist”.

**Deliverables**
- Test matrix mapped to requirements
- Representative benchmark decks/data

---

## Appendix B) Parity Mapping Table (to be filled)

**Tracking doc:** `20-parity-mapping-table.md`

Create a table mapping each benchmark expectation to a spec section and a decision:
- **Parity / Surpass / Out of scope**
- Owner + milestone
- Acceptance criteria link

Example row template:

| Capability | Tool(s) | Decision | Spec Doc | Acceptance Criteria Link | Notes |
|---|---|---|---|---|---|
| Present in window | Google Slides | Parity | `06-mode-taxonomy-and-entry-exit.md` | Link to AC section | Required for screen sharing |

---

## 17) Implementation Boundaries & Extensibility

**Detailed spec:** `19-implementation-boundaries-and-extensibility.md`
- Clean separation between editor runtime and presentation runtime.
- Plugin points: transitions, remote control, presenter layouts.
- Backwards compatibility and fallback policies for older decks.

**Deliverables**
- Architecture diagram + module boundaries
- Extension points and stability guarantees

---

## Appendix A) Spec Authoring Conventions
- Use MUST/SHOULD/MAY language.
- Every feature section includes: states, events, edge cases, and test coverage.
- Add a “Decision log” subsection for tradeoffs.
