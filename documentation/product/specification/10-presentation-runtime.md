# Volume 10: Presentation Runtime

> **Specification ID:** `STORY-SPEC-10`  
> **Volume:** 10 (16 volumes total, 00-15)  
> **Status:** Normative draft  
> **Version:** 2.0.0-draft  
> **Owner:** Product and Engineering  
> **Approvers:** Product, Design, Engineering, Quality, Accessibility, Security, Privacy  
> **Last reviewed:** July 10, 2026  
> **Normative responsibility:** Show modes, runtime state, navigation, clocks, builds, transitions, readiness, presenter and audience surfaces, displays, input, presentation tools, kiosk operation, recovery, and runtime privacy
> **Explicit non-ownership:** Authoring workspace views, canonical authored schemas, animation-authoring UI, output format mappings, and implementation status
> **Parent specification:** [Story Product Specification System](README.md)  
> **Governed by:** [Volume 00 - Governance and Traceability](00-governance-and-traceability.md)  
> **Supersedes:** Conflicting runtime mode, window-role, placement, and snapshot terminology in active presentation specifications where this volume is more precise

## 1. Purpose

This volume defines Story's presentation runtime as a deterministic delivery system, not an editor preview with hidden chrome. It owns the behavior from show setup and entry through slide/build execution, presenter control, audience rendering, multi-display operation, recording capture, kiosk playback, recovery, and exit.

The runtime must be trustworthy in front of an audience. A valid session never exposes private presenter content, silently changes authored state, loses navigation position, reorders builds, shows blank frames, or depends on incidental DOM order and wall-clock callback timing.

## 2. Scope and Authority

### 2.1 In scope

- Preview, rehearsal, recording, presentation, and kiosk runtime modes; audience, presenter, recorder, remote, and observer surface roles; fullscreen, windowed, embedded, and external-display placements.
- Session creation, entry, pause, resume, suspend, recover, end, and editor restoration.
- Semantic slide/build position, linear and nonlinear navigation, history, links, sections, hidden slides, and custom shows.
- Deterministic clocks, timeline evaluation, build groups, transitions, Morph, reduced motion, and recorded timings.
- Readiness, prefetch, caching, bounded degradation, scaling, letterboxing, high DPI, and audience-clean rendering.
- Presenter and audience windows, role assignment, allowlisted synchronization, displays, fullscreen, hotplug, and reconnection.
- Keyboard, pointer, touch, pen, remote, interactive objects, laser, ink, zoom, blank screens, captions, and media controls.
- Kiosk scheduling, loop/end policy, restricted input, secure exit, and unattended recovery.
- Runtime checkpoints, failure handling, privacy, telemetry hygiene, and audience-safe errors.

### 2.2 Normative dependencies

| Concern | Normative owner |
|---|---|
| Canonical slides, custom shows, animation steps, notes, and recording metadata | Volume 03 |
| Authored mutation, history, collaboration, and deterministic operation replay | Volume 04 |
| Resolved scene, rendering semantics, readiness primitives, and degradation descriptors | Volume 05 |
| Assets, local packages, recording chunks, checkpoints, and recovery persistence | Volume 06 |
| Identity, session authority, permissions, remote roles, and revocation | Volume 07 |
| Design-object rendering semantics | Volume 08 |
| Show setup authoring, animation timeline, rehearsal timing, and recording setup | Volume 09 |
| Exported video/web playback and PPTX compatibility | Volume 11 |
| Assistive technology, captions, reduced motion, forced colors, language, and bidi | Volume 12 |
| Cross-window trust, embeds, device consent, recording privacy, and telemetry policy | Volume 13 |
| Latency, frame pacing, capacity, memory, readiness, and drift budgets | Volume 14 |
| Runtime fixtures, headed/hardware tests, evidence, waivers, and release gates | Volume 15 |

### 2.3 Adopted domain specifications

The following remain active detail where they do not conflict with this volume:

- [Presentation Mode suite](../../specs/slides/presentation-mode/00-master-outline.md)
- [Mode taxonomy](../../specs/slides/presentation-mode/06-mode-taxonomy-and-entry-exit.md)
- [Input and controls](../../specs/slides/presentation-mode/07-input-and-controls.md)
- [Navigation model](../../specs/slides/presentation-mode/08-navigation-model.md)
- [Presentation surface scaling](../../specs/slides/presentation-mode/09-visual-surface-and-scaling.md)
- [Playback system](../../specs/slides/presentation-mode/10-playback-system.md)
- [Presenter tools](../../specs/slides/presentation-mode/11-presenter-tools.md)
- [Reliability and recovery](../../specs/slides/presentation-mode/14-reliability-and-recovery.md)
- [Security and privacy](../../specs/slides/presentation-mode/16-security-privacy-and-safety.md)
- [Transitions](../../specs/slides/transitions/README.md)
- [Presentation taskflows](../../automation/eval-loop/taskflows/25-presentation-mode.md)

### 2.4 Supersession

This volume supersedes domain behavior that:

- derives build count, order, or identity from renderer DOM, CSS classes, or element order;
- uses editor active-slide state as the authoritative show position;
- drops input solely by a fixed elapsed-time throttle rather than serializing intent;
- lets independent windows toggle shared state without session revision and command authority;
- sends notes, diagnostics, or arbitrary state objects across audience channels;
- advances kiosk playback with unrelated local timers that ignore authored build/media timing;
- equates a readiness timeout with an unspecified blank background;
- uses polling as the only presenter-window liveness mechanism;
- treats transition completion callbacks or `Date.now()` as the timeline source of truth;
- modifies authored presentation data merely by entering, navigating, annotating, or exiting a show.

## 3. Product Decisions and Bounded Parity

### 3.1 Explicit implementer decisions

1. **One semantic session reducer.** Every accepted runtime command is reduced against versioned mutable session state. UI, windows, remotes, recording, and kiosk adapters dispatch commands; they do not independently mutate show state.
2. **Stable position identity.** Runtime position is `{showItemId, slideId, buildStepId, phase}`. Numeric indices are derived display values and never durable navigation identity.
3. **Immutable show plan.** Entry compiles an authored revision and show settings into a session-local ordered plan. Authoring changes during a show are excluded unless the presenter explicitly reloads or applies a safe live revision.
4. **Deterministic clocks.** Timeline evaluation receives an injected monotonic session clock, media clocks, and a wall clock used only for display. Callback arrival order cannot define authored timing.
5. **Semantic builds.** Build groups come from the normalized animation timeline. DOM discovery may validate rendering but never defines order or count.
6. **Latest-intent navigation with ordered execution.** A transition is never half-applied. Compatible repeated input queues or coalesces by explicit policy; it is not blindly ignored.
7. **Typed readiness.** Every required resource resolves to `ready`, `substituted`, `unavailable`, `blocked`, or `timed-out`, with audience and presenter behavior defined per type.
8. **Audience-clean by construction.** Audience surfaces are separate render roots and message schemas that never receive notes, private thumbnails, diagnostics, device state, presenter search, or recording controls.
9. **Role-authoritative windows.** One session authority assigns presenter, audience, recorder, remote, and observer capabilities. A role swap changes routing only after both surfaces acknowledge a privacy-safe barrier.
10. **Transient tools by default.** Laser, zoom, black/white screen, cursor, grid, diagnostics, and uncommitted ink are session state. Ink becomes authored content only through an explicit save command.
11. **Media follows the session timeline.** Autoplay, cues, seeks, captions, and audio routing use normalized authored semantics and report browser-policy degradation.
12. **Recovery resumes meaning, not pixels.** Checkpoints contain show plan revision, semantic position, clocks, overlays, media/bookmark state, role assignment, and recording chunk references; renderer DOM is rebuilt.

### 3.2 Bounded parity

| Parity floor | Bounded or host-dependent | Explicit non-goal |
|---|---|---|
| Familiar show starts, fullscreen/windowed delivery, Presenter View, slide/build navigation, grid/jump/back, blank screen, laser/ink, captions, media control, timings, kiosk, and display swap | Automatic window placement, hardware remote APIs, display enumeration, system audio capture, live caption providers, and secure kiosk escape vary by declared host capability | Pixel-identical PowerPoint chrome; OS-level control Story cannot access; bypassing browser fullscreen/autoplay/capture permissions; arbitrary executable slide content; guaranteed network audience services without explicit product adoption |

If the host cannot enumerate or place displays, Story still supports explicit windows and gives placement guidance. If a runtime feature cannot execute, the authored source remains intact and the degradation is visible to the presenter.

## 4. Runtime Model

### 4.1 Admission snapshot, session state, and recovery checkpoint

The runtime uses three distinct records:

1. **Runtime admission snapshot:** immutable input admitted for one run. It binds the authored revision, base narrative, audience edition, variable modes, locale, accessibility policy, show plan, readiness decisions, and privacy/output policy.
2. **Runtime session state:** mutable reducer state for current position, clocks, overlays, media, windows, and controls.
3. **Recovery checkpoint:** privacy-safe persisted subset of session state sufficient to reconstruct meaning after failure. It references the immutable admission snapshot and never replaces it.

The mutable runtime session state contains at least:

```text
sessionId, schemaVersion, sequenceNumber
presentationId, authoredRevision, admissionSnapshotId, showPlanRevision
baseNarrativeId, editionId|null, editionResolutionHash, variableModeSelection
runtimeMode, phase, authorityClientId
showPlan[]: showItemId -> narrativeItemId + editionDirectiveId|null + slideId + occurrence + hidden/include policy
position: showItemId + slideId + buildStepId|null + phase
navigationHistory[]: semantic positions + cause
clockState: session, slide, build, pause, rehearsal, recording
timelineState: playhead, active effects, queued cues
readinessState: resources and slide readiness outcomes
overlayState: black, white, grid, zoom, pointerTool, cursorPolicy
inkState: transient stroke identities and save policy
mediaState: semantic media IDs, playheads, rate, volume, mute, cue status
captionState: source, language, display, delay, status
windowState: roles, capabilities, acknowledgements, liveness
displayState: assignments, fullscreen status, scale/DPR
kioskState: schedule, loop count, interaction policy, exit state
recordingState: enabled tracks, accepted chunks, provisional status
recoveryState: checkpoint sequence and degradation issues
```

#### `SCH-10-001 RuntimeAdmissionSnapshot`

The immutable admission snapshot is canonical JSON with deterministic key ordering and normalized values:

```ts
type RuntimeAdmissionSnapshot = {
	schemaVersion: "story.runtime-admission/1.0.0";
	snapshotId: `sha256:${string}`;
	document: { documentId: string; revisionId: string; semanticHash: string };
	narrative: {
		baseNarrativeId: string;
		editionId: string | null;
		editionResolutionHash: string;
		showPlanHash: string;
		variableModes: Record<string, string>;
		locale: string;
	};
	accessibilityProfile: { id: string; version: string; reducedMotion: boolean };
	capabilityProfile: { id: string; version: string; runtimeMode: string; surfaceRoles: string[]; placements: string[] };
	readiness: { reportHash: string; acceptedFallbackIds: string[]; blockingFindingCount: 0 };
	privacyProfile: { id: string; version: string; notesPolicy: string; recordingPolicy: string; telemetryPolicy: string };
};
```

`snapshotId` is the SHA-256 of canonical snapshot content with `snapshotId` omitted. Equivalent admitted meaning yields the same ID; any semantic source, edition, show plan, variable mode, locale, accessibility, capability, readiness decision, fallback, or privacy change yields a different ID. A recovery checkpoint and every presentation-level output job reference and verify this ID. Tamper, missing dependency, or hash mismatch blocks admission, recovery, or finalization; no consumer silently recalculates a different interpretation.

The snapshot contains no speaker-note body, presenter search text, device labels beyond the presenter process, authentication token, raw telemetry payload, renderer DOM, decoded bitmap, or media stream.

### 4.2 Session phase state machine

`SM-10-001`:

| State | Meaning | Allowed next states |
|---|---|---|
| `inactive` | No session exists | `configuring` |
| `configuring` | Show plan and host capabilities are being resolved | `preflighting`, `inactive` |
| `preflighting` | Required resources, permissions, displays, and settings are checked | `entering`, `blocked`, `inactive` |
| `blocked` | A required condition prevents entry | `preflighting`, `configuring`, `inactive` |
| `entering` | Roots/windows are created and first position is prepared | `running`, `recovering`, `ending` |
| `running` | Timeline and input are active | `paused`, `suspended`, `recovering`, `ending` |
| `paused` | Session clock and timed advances are paused | `running`, `suspended`, `recovering`, `ending` |
| `suspended` | Host background/sleep policy has suspended output | `recovering`, `ending` |
| `recovering` | Renderer/windows/media are rebuilding from checkpoint | `running`, `paused`, `degraded`, `ending` |
| `degraded` | Session continues with declared substitutions or missing optional capability | `running`, `paused`, `recovering`, `ending` |
| `ending` | Final state and recordings are closing | `ended` |
| `ended` | Session is immutable and editor restoration can complete | `inactive` |

### 4.3 Navigation execution state machine

`SM-10-002`:

| State | Meaning | Command handling |
|---|---|---|
| `position-stable` | Current semantic position is fully applied | Accept navigation or timeline command |
| `target-resolving` | Destination and policy are resolving | Coalesce compatible latest target; retain history cause |
| `target-preparing` | Incoming scene/resources are prepared | Queue latest compatible intent; allow cancel/exit |
| `transitioning` | Atomic outgoing/incoming transition is running | Queue according to policy; never expose partial target |
| `build-running` | Timed/animated build is executing | Pause, skip, queue next, or reverse by effect policy |
| `settling` | Final semantic state and media cues are committed | Apply queued command or become stable |
| `navigation-error` | Destination cannot be resolved safely | Retain last stable position and offer retry/skip/exit |

### 4.4 Window role state machine

`SM-10-003`: `unjoined -> handshaking -> assigned -> synchronized -> stale -> reconnecting -> closed`. Role swap adds `swap-pending -> privacy-barrier -> assigned`. No surface renders presenter-only data until its presenter role and session revision are acknowledged.

### 4.5 Media state machine

`SM-10-004`: `unprepared -> preparing -> ready -> playing <-> paused -> ended`; failure states are `blocked`, `unavailable`, `stalled`, and `substituted`. Seek uses `seeking -> ready|playing`. Recovery restores the semantic media state or marks a gap; it never guesses an unverified playhead.

### 4.6 Cross-surface applicability

| Runtime semantic | Audience | Presenter | Recorder | Remote | Kiosk | Video/web renderer |
|---|---:|---:|---:|---:|---:|---:|
| Show position and timeline | Render | Render/control | Capture | Authorized control/status | Automatic control | Deterministic render |
| Notes and presenter search | Never receive | Private render | Never receive by default | Never receive | Never receive | Never receive |
| Readiness detail/errors | Safe fallback only | Full actionable detail | Status metadata | Coarse authorized status | Local recovery | Build-time report |
| Display/device state | None | Private control | Required capture state only | None | Host-only | Build environment only |
| Laser/transient ink | Render when enabled | Control/preview | Capture when selected | Authorized points/commands | Usually disabled | Render when selected |
| Captions | Render by policy | Control/status | Capture/embed by policy | Toggle/language only if authorized | Render | Embed/sidecar/player |
| Media state | Render/control where allowed | Control/status | Capture/mix | Authorized control | Automatic | Deterministic render |
| Diagnostics | Never receive | Private opt-in | Build logs only | Never receive | Local logs only | Build report |

### 4.7 Invariants

| ID | Invariant |
|---|---|
| `INV-10-001` | Runtime commands never mutate authored presentation state except explicit save-ink, accept-recording, or approved live-edit commands routed through authored transactions. |
| `INV-10-002` | One active session has one authority, one monotonically increasing command sequence, one immutable admission snapshot, and one accepted mutable session state. |
| `INV-10-003` | Numeric slide/build indices are derived from stable show-item, slide, and build-step identities. |
| `INV-10-004` | A show plan is immutable for its revision; authored changes require an explicit revision transition. |
| `INV-10-005` | Linear navigation visits only items in the compiled show plan and never consults mutable editor selection. |
| `INV-10-006` | Every accepted nonlinear jump records its semantic origin and cause before changing position. |
| `INV-10-007` | Back navigation restores a valid semantic position or the nearest declared fallback, never an out-of-range index. |
| `INV-10-008` | A build step executes from normalized timeline data, not DOM order, CSS class order, or callback discovery. |
| `INV-10-009` | Session, slide, build, media, rehearsal, recording, and wall clocks have explicit purposes and cannot be substituted silently. |
| `INV-10-010` | Pause freezes session-timed advancement and authored effects while wall-clock display may continue. |
| `INV-10-011` | A transition presents either the last stable position or the next stable position; no audience frame exposes an uninitialized intermediate scene. |
| `INV-10-012` | Reduced-motion evaluation never omits semantic content or changes navigation/build count. |
| `INV-10-013` | Readiness timeout yields a typed fallback and issue, never an unclassified blank slide. |
| `INV-10-014` | Audience roots contain no editor chrome, placeholder prompts, selection UI, private notes, diagnostics, or recording controls. |
| `INV-10-015` | Presenter-only data is never serialized into audience-bound messages, DOM, screenshots, recordings, or telemetry by default. |
| `INV-10-016` | Cross-window and remote messages are versioned, allowlisted, bounded, authenticated to the session where possible, and rejected before side effects. |
| `INV-10-017` | A role swap crosses a privacy barrier before either window renders its new role. |
| `INV-10-018` | Black and white screen overlays are mutually exclusive and do not pause, seek, or otherwise mutate authored playback unless configured. |
| `INV-10-019` | Laser, cursor, grid, zoom, and unsaved ink are transient session state. |
| `INV-10-020` | Media failure never blocks slide navigation or exposes a stack trace to the audience. |
| `INV-10-021` | Caption text is scoped to its selected audience/presenter/recording outputs and never becomes slide content implicitly. |
| `INV-10-022` | Kiosk scheduling uses the same semantic timeline and readiness outcomes as manual playback. |
| `INV-10-023` | Recovery rebuilds render roots from a validated checkpoint and resolved scene rather than reusing stale DOM. |
| `INV-10-024` | An accepted recording chunk is never overwritten by a failed retake or recovery attempt. |
| `INV-10-025` | Exit or critical failure releases capture streams, fullscreen, wake locks, channels, timers, media, and windows without clearing authored undo history. |

## 5. Show Modes and Setup Requirements

| ID | Parent | Atomic requirement | Surfaces and lifecycle | Acceptance |
|---|---|---|---|---|
| `REQ-10-001` | PRE-050 | Story MUST support starting a show from the beginning, current slide, selected slide, named custom show, deep link, or restored session position. | Show setup/session entry | `AC-10-001` |
| `REQ-10-002` | PRE-050 | Story MUST model Preview, Rehearsal, Recording, Presentation, and Kiosk as the complete normalized runtime-mode axis independently from surface role and window placement. | Setup/runtime | `AC-10-002` |
| `REQ-10-003` | PRE-050 | Story MUST compile a show plan from stable narrative, audience-edition, slide-occurrence, custom-show, hidden-slide, start-position, variable-mode, and repetition semantics before entry. | Setup/preflight | `AC-10-003` |
| `REQ-10-004` | PRE-052 | Story MUST expose hidden-slide inclusion, narration, recorded-timing, animation, media, caption, loop, and end-of-show policies before the show begins. | Show setup | `AC-10-004` |
| `REQ-10-005` | PRE-052 | Story MUST resolve show-setting precedence from explicit session override, custom show, presentation setting, authored default, and system/accessibility policy. | Setup/runtime resolve | `AC-10-005` |
| `REQ-10-006` | PRE-050 | Story MUST preview the first semantic position, audience/presenter assignment, aspect ratio, and material readiness issues before committing entry when setup is opened. | Setup/preflight | `AC-10-006` |
| `REQ-10-007` | PRE-050 | Story MUST preserve each named show mode's last nonsecret device-local preferences without storing presentation content or credentials. | Setup/preferences | `AC-10-007` |
| `REQ-10-008` | PRE-050 | Story MUST validate that a compiled show plan contains at least one accessible resolvable slide occurrence before entry. | Setup/preflight | `AC-10-008` |
| `REQ-10-009` | PRE-050 | Story MUST let the presenter choose whether direct jumps may reach slides outside the active custom show and visibly indicate the resulting context. | Setup/navigation | `AC-10-009` |
| `REQ-10-010` | PRE-052 | Story MUST define end-of-show behavior as stop on end screen, exit to editor, close audience window, loop, or hold final frame. | Setup/runtime end | `AC-10-010` |
| `REQ-10-011` | PRE-052 | Story MUST define whether loop restarts at pre-build, first build, or recorded initial state and whether session/slide timers reset. | Setup/kiosk/runtime | `AC-10-011` |
| `REQ-10-012` | PRE-050 | Story MUST support a no-fullscreen deliberate windowed mode rather than treating windowed output only as permission fallback. | Setup/runtime | `AC-10-012` |
| `REQ-10-013` | PRE-043 | Story MUST offer Presenter View as an explicit choice even when automatic display detection is unavailable. | Setup/window runtime | `AC-10-013` |
| `REQ-10-014` | PRE-041 | Story MUST make rehearsal a show mode that uses the production runtime sequence while writing only provisional timing observations until acceptance. | Rehearsal runtime | `AC-10-014` |
| `REQ-10-015` | PRE-042 | Story MUST make recording a show mode that uses the production runtime sequence while attaching recoverable synchronized tracks. | Recording runtime | `AC-10-015` |
| `REQ-10-016` | PRE-050 | Story MUST make Preview mode nonauthoring and windowed by default while preserving the same resolved scene and navigation semantics. | Preview runtime | `AC-10-016` |
| `REQ-10-017` | PRE-050 | Story MUST support selecting an audience display and presenter display through host capabilities or explicit placement guidance. | Setup/displays | `AC-10-017` |
| `REQ-10-018` | PRE-052 | Story MUST show all settings that will be forced by reduced motion, forced colors, media policy, offline state, permissions, or host limitations before entry. | Setup/preflight/accessibility | `AC-10-018` |
| `REQ-10-019` | PRE-050 | Story MUST save a reusable show-setup preset without embedding passwords, tokens, note content, device IDs that are not portable, or transient session state. | Setup/files/preferences | `AC-10-019` |
| `REQ-10-020` | PRE-050 | Story MUST expose show setup and every non-device-secret option to keyboard and assistive technology with validation and dependency states. | Setup/accessibility | `AC-10-020` |

### 5.1 Orthogonal runtime matrix

| Axis | Values | Rule |
|---|---|---|
| Runtime mode | Preview, Rehearsal, Recording, Presentation, Kiosk | Exactly one per session. |
| Surface role | Audience, Presenter, Recorder controller, Remote controller, Observer | One or more compatible roles; Presenter View is the Presenter role, not a mode. |
| Placement | Fullscreen, windowed, embedded preview, external display | One per visible role; placement may degrade independently. |
| Timing policy | Manual, authored timings, rehearsal timings, recording timings, kiosk schedule | One normalized policy plus declared overrides. |
| Interaction policy | Presenter-controlled, audience-interactive, restricted kiosk | Capability set enforced independently from placement. |

| Runtime mode | Default audience placement | Required private roles | Manual navigation | Timing behavior | Capture behavior |
|---|---|---|---|---|---|
| Preview | Embedded or windowed | None | Yes | Optional authored preview | None |
| Rehearsal | Fullscreen or windowed | Presenter | Yes | Capture/compare provisional timings | Optional analysis only if consented |
| Recording | Fullscreen or windowed | Presenter and recorder controller | Yes | Capture production timeline | Configured audio/video/ink tracks |
| Presentation | Fullscreen or windowed | Presenter optional but supported | Yes | Configured authored/rehearsal timing | No recording unless explicitly enabled |
| Kiosk | Fullscreen or windowed | Host controller only | Policy-controlled | Kiosk schedule/loop | None by default |

## 6. Session Entry, State, Pause, and Exit Requirements

| ID | Parent | Atomic requirement | Surfaces and lifecycle | Acceptance |
|---|---|---|---|---|
| `REQ-10-021` | PRE-050 | Story MUST capture an editor-restoration snapshot before creating presentation roots or changing fullscreen/window state. | Entry/exit | `AC-10-021` |
| `REQ-10-022` | ARC-022 | Story MUST preflight the compiled show plan for schema, slide resolution, fonts, assets, media, embeds, captions, animation targets, output displays, and required permissions. | Entry/preflight | `AC-10-022` |
| `REQ-10-023` | PRE-050 | Story MUST classify preflight findings as blocking, degradable, informational, or manual-review with a named recovery or acceptance action. | Preflight/presenter | `AC-10-023` |
| `REQ-10-024` | PRE-050 | Story MUST create and verify one content-addressed `SCH-10-001` runtime admission snapshot and initialize separate mutable session state only after blocking findings are resolved. | Entry/session | `AC-10-024` |
| `REQ-10-025` | PRE-050 | Story MUST request popup, fullscreen, display-placement, wake-lock, and capture permissions only in user-initiated contexts and only when the selected mode needs them. | Entry/host/security | `AC-10-025` |
| `REQ-10-026` | PRE-050 | Story MUST continue in an explicitly identified fallback mode when fullscreen, window placement, wake lock, or optional presenter-window creation is denied. | Entry/recovery | `AC-10-026` |
| `REQ-10-027` | ARC-022 | Story MUST prepare and atomically reveal the first stable semantic position before accepting advance input. | Entry/render | `AC-10-027` |
| `REQ-10-028` | PRE-050 | Story MUST buffer bounded entry-time input as semantic commands and apply it after the first stable position according to sequence order. | Entry/input | `AC-10-028` |
| `REQ-10-029` | PRE-050 | Story MUST start session, slide, rehearsal, recording, and kiosk clocks at their declared lifecycle events rather than one shared entry timestamp. | Entry/clocks | `AC-10-029` |
| `REQ-10-030` | PRE-050 | Story MUST pause timed builds, auto-advance, transition progression where reversible, media according to policy, rehearsal, and recording timing through one session pause command. | Running/paused | `AC-10-030` |
| `REQ-10-031` | PRE-050 | Story MUST resume each paused subsystem from its semantic offset without counting paused duration or replaying accepted cues. | Paused/running | `AC-10-031` |
| `REQ-10-032` | PRE-050 | Story MUST distinguish user pause, host suspension, readiness block, modal tool focus, and recovery so timer and input policy can differ. | Runtime state | `AC-10-032` |
| `REQ-10-033` | PRE-050 | Story MUST save a bounded privacy-safe recovery checkpoint after every stable position and material session-state change. | Running/recovery | `AC-10-033` |
| `REQ-10-034` | PRE-050 | Story MUST handle an external fullscreen exit as a window-state change rather than ending the show unless the configured mode says otherwise. | Runtime/fullscreen | `AC-10-034` |
| `REQ-10-035` | PRE-050 | Story MUST support exit from presenter, audience HUD where authorized, keyboard, kiosk authorization, remote authority, end policy, and critical recovery flow. | Runtime/exit | `AC-10-035` |
| `REQ-10-036` | PRE-050 | Story MUST serialize concurrent exit requests into one idempotent ending sequence. | Exit/recovery | `AC-10-036` |
| `REQ-10-037` | PRE-042 | Story MUST finalize or recover provisional recording chunks before session resources are released. | Recording/exit | `AC-10-037` |
| `REQ-10-038` | PRE-050 | Story MUST restore the editor's active root, slide, viewport, selection when valid, focus, and panel state without changing authored history. | Exit/editor | `AC-10-038` |
| `REQ-10-039` | PRE-050 | Story MUST produce an end summary for rehearsal, recording, failures, degradations, and unsaved ink only on authorized private surfaces. | Exit/presenter | `AC-10-039` |
| `REQ-10-040` | PRE-050 | Story MUST release all media streams, event listeners, channels, timers, animation frames, wake locks, object URLs, render roots, and managed windows at session end. | Exit/resource lifecycle | `AC-10-040` |

### 6.1 Entry flow

`FLOW-10-001`:

1. Normalize setup and compile the immutable show plan.
2. Capture editor restoration and authored revision.
3. Validate schema, references, motion, assets, media, captions, permissions, displays, and privacy.
4. Resolve blocking findings or accept named degradations.
5. Create the session authority, semantic clocks, and initial snapshot.
6. Create audience/presenter/recorder roots without private-data crossover.
7. Prepare the first slide and pre-build state using typed readiness.
8. Cross the audience reveal barrier only when a stable fallback or ready scene exists.
9. Start applicable clocks and accept buffered input.
10. Persist the first recovery checkpoint.

### 6.2 Exit flow

`FLOW-10-002`:

1. Mark the session `ending` and reject new non-exit commands.
2. Stop scheduled timeline, kiosk, remote, and media advances.
3. Finalize recording and rehearsal intervals.
4. Resolve transient ink according to save/discard policy.
5. Broadcast a privacy-safe terminal sequence to joined surfaces.
6. Release host resources and close or retire managed windows.
7. Restore valid editor runtime state.
8. Present private summary or recovery actions.
9. Mark session `ended` and remove its recoverable checkpoint under retention policy.

## 7. Navigation, Builds, Links, and History Requirements

| ID | Parent | Atomic requirement | Surfaces and lifecycle | Acceptance |
|---|---|---|---|---|
| `REQ-10-041` | PRE-051 | Story MUST interpret Next as advancing the current click-triggered build step before advancing to the next eligible show item. | Runtime/navigation | `AC-10-041` |
| `REQ-10-042` | PRE-051 | Story MUST interpret Previous as reversing the last reversible build action before returning to the previous eligible show item's declared return position. | Runtime/navigation | `AC-10-042` |
| `REQ-10-043` | PRE-051 | Story MUST enter a slide at its explicit pre-build state for forward/jump navigation unless the navigation cause or show setting declares another entry state. | Runtime/navigation | `AC-10-043` |
| `REQ-10-044` | PRE-051 | Story MUST return to the previous slide at its final stable build state by default while preserving a cause-specific override for history restoration. | Runtime/navigation | `AC-10-044` |
| `REQ-10-045` | PRE-052 | Story MUST skip hidden slides during linear navigation unless the compiled show plan explicitly includes them. | Runtime/navigation | `AC-10-045` |
| `REQ-10-046` | PRE-051 | Story MUST support direct jump by visible number, title, section, thumbnail, stable slide link, show-item occurrence, and approved deep link. | Grid/presenter/links/remote | `AC-10-046` |
| `REQ-10-047` | PRE-051 | Story MUST distinguish a slide's canonical presentation number from its ordinal within the active show plan and display the chosen numbering context. | Presenter/grid/audience status | `AC-10-047` |
| `REQ-10-048` | PRE-051 | Story MUST let direct navigation reach an included hidden slide only through an explicit target and visibly identify its hidden status to the presenter. | Presenter/grid/runtime | `AC-10-048` |
| `REQ-10-049` | PRE-051 | Story MUST push the full semantic origin position and navigation cause onto bounded history before an accepted nonlinear jump. | Runtime/history | `AC-10-049` |
| `REQ-10-050` | PRE-051 | Story MUST restore nonlinear navigation history by stable show-item and build identity with a declared fallback when that identity is unavailable. | Runtime/history | `AC-10-050` |
| `REQ-10-051` | PRE-051 | Story MUST avoid adding ordinary linear next/previous commands to nonlinear back history unless a session setting explicitly requests browser-like history. | Runtime/history | `AC-10-051` |
| `REQ-10-052` | PRE-051 | Story MUST support action links to slide, show item, next, previous, first, last, back, URL, media cue, and approved object trigger under explicit trust and history policies. | Audience/runtime/links | `AC-10-052` |
| `REQ-10-053` | PRE-051 | Story MUST consume an interactive object's activation before click-to-advance when the object is enabled and hit-testable. | Audience/input | `AC-10-053` |
| `REQ-10-054` | PRE-051 | Story MUST define whether a link target enters pre-build, final-build, named-build, or preserved-history state and reject missing named targets safely. | Runtime/links | `AC-10-054` |
| `REQ-10-055` | PRE-051 | Story MUST support a presenter grid or list with section grouping, search, hidden-state cues, current/visited status, readiness issues, and keyboard navigation. | Presenter/audience HUD if enabled | `AC-10-055` |
| `REQ-10-056` | PRE-051 | Story MUST close or retain the grid after a jump according to the initiating surface's declared policy without changing show position until selection commits. | Grid/runtime | `AC-10-056` |
| `REQ-10-057` | PRE-051 | Story MUST serialize concurrent local, presenter-window, remote, link, kiosk, and timed navigation commands through session sequence numbers and authority rules. | Runtime/sync | `AC-10-057` |
| `REQ-10-058` | PRE-051 | Story MUST preserve all accepted navigation commands in an event log sufficient to reproduce semantic position without slide content. | Runtime/recovery/recording | `AC-10-058` |
| `REQ-10-059` | PRE-051 | Story MUST queue or coalesce repeated navigation during preparation/transition according to command type, direction, and latest-intent policy. | Runtime/navigation | `AC-10-059` |
| `REQ-10-060` | PRE-051 | Story MUST make rapid opposite-direction input cancel queued intent where safe rather than execute stale forward commands after a reverse request. | Runtime/navigation | `AC-10-060` |
| `REQ-10-061` | PRE-051 | Story MUST let an authorized presenter skip a running skippable effect to its semantic end state without changing subsequent build order. | Runtime/timeline | `AC-10-061` |
| `REQ-10-062` | PRE-051 | Story MUST define nonreversible effect behavior for Previous as restore-from-checkpoint, deterministic reevaluation, or declared final-state fallback. | Runtime/timeline | `AC-10-062` |
| `REQ-10-063` | PRE-051 | Story MUST preserve media and component state across build navigation only when the authored state model marks that state as persistent. | Runtime/media/components | `AC-10-063` |
| `REQ-10-064` | PRE-051 | Story MUST recompute derived display ordinals after show-plan revision while retaining semantic history entries and marking invalid ones. | Live revision/recovery | `AC-10-064` |
| `REQ-10-065` | PRE-051 | Story MUST announce slide, show ordinal, title, section, build position, and navigation failure through scoped accessible status without speech flooding. | Runtime/accessibility | `AC-10-065` |

### 7.1 Navigation result matrix

| Command | Current pre-build | Builds remain | At final build | At final show item | During transition |
|---|---|---|---|---|---|
| Next build/slide | Execute first click build | Execute next click build | Prepare next eligible item | Apply end/loop policy | Queue/coalesce latest forward intent |
| Previous build/slide | Previous eligible item final state or no-op at start | Reverse last reversible build | Reverse last build | Reverse build or previous item | Queue/cancel according to direction policy |
| Jump | Push history and enter declared target state | Same | Same | Same | Replace queued target after current atomic transition |
| Back | Pop valid semantic history | Same | Same | Same | Queue history target |
| Home/End | Jump to first/last eligible show item | Same | Same | Same | Queue target |
| Link/action | Apply authored target/history policy | Same | Same | Same | Queue target and preserve cause |

### 7.2 Navigation flow

`FLOW-10-003`:

1. Receive a bounded command with source, authority, sequence, and monotonic timestamp.
2. Resolve semantic target against the immutable show plan and current timeline state.
3. Record nonlinear origin/history when required.
4. Coalesce or queue if another atomic navigation is active.
5. Prepare target scene and typed readiness outcomes.
6. Evaluate outgoing build/media/transition policy.
7. Execute the atomic position change.
8. Commit semantic position, media cues, clocks, and accessible announcement.
9. Persist a checkpoint and apply the next queued command.

## 8. Deterministic Clocks, Timeline, Builds, Transitions, and Morph Requirements

| ID | Parent | Atomic requirement | Surfaces and lifecycle | Acceptance |
|---|---|---|---|---|
| `REQ-10-066` | PRE-033 | Story MUST evaluate authored motion from a normalized semantic timeline produced by Volume 09 rather than renderer-discovered animations. | Runtime/video/web/recording | `AC-10-066` |
| `REQ-10-067` | PRE-033 | Story MUST inject a monotonic session clock whose origin, pause intervals, rate, and seek offset are explicit and test-controllable. | Runtime/timeline/tests | `AC-10-067` |
| `REQ-10-068` | PRE-041 | Story MUST maintain separate session, current-slide, current-build, rehearsal, and recording elapsed values derived from the same monotonic source. | Presenter/rehearsal/recording | `AC-10-068` |
| `REQ-10-069` | PRE-043 | Story MUST use a wall clock only for presenter date/time display and never for timeline ordering or duration measurement. | Presenter/timeline | `AC-10-069` |
| `REQ-10-070` | PRE-033 | Story MUST evaluate On Click, With Previous, After Previous, delay, duration, repeat, auto-reverse, media/bookmark, and object triggers deterministically. | Runtime/video/web/recording | `AC-10-070` |
| `REQ-10-071` | PRE-032 | Story MUST expose each click-trigger boundary as one semantic build step even when that step launches multiple parallel effects. | Runtime/navigation/presenter | `AC-10-071` |
| `REQ-10-072` | PRE-032 | Story MUST keep automatically timed effects inside their owning build step unless the authored sequence declares an independent trigger. | Runtime/timeline | `AC-10-072` |
| `REQ-10-073` | PRE-032 | Story MUST commit a build step only after its semantic start state is applied and its triggered effects are scheduled against the session clock. | Runtime/checkpoint | `AC-10-073` |
| `REQ-10-074` | PRE-032 | Story MUST represent build position by stable step identity and phase rather than count alone. | Runtime/sync/recovery | `AC-10-074` |
| `REQ-10-075` | PRE-031 | Story MUST apply every entrance, emphasis, exit, motion-path, state-change, and media effect to its stable semantic targets or a declared unresolved-target fallback. | Runtime/timeline | `AC-10-075` |
| `REQ-10-076` | PRE-031 | Story MUST make skipped or disabled effects resolve to their authored semantic end state unless the effect is explicitly nonessential. | Runtime/reduced motion/skip | `AC-10-076` |
| `REQ-10-077` | PRE-031 | Story MUST isolate effect failure to the affected target/step and continue subsequent timeline evaluation under the authored dependency policy. | Runtime/recovery | `AC-10-077` |
| `REQ-10-078` | PRE-030 | Story MUST resolve the incoming slide's effective transition from slide, layout, master, and system policy before readiness preparation begins. | Runtime/transition | `AC-10-078` |
| `REQ-10-079` | PRE-030 | Story MUST normalize transition type, direction, duration, easing, parameters, reduced-motion result, and fallback before execution. | Runtime/transition | `AC-10-079` |
| `REQ-10-080` | PRE-030 | Story MUST keep outgoing and incoming resolved scenes simultaneously available for the full transition interval when the transition requires both. | Audience/render | `AC-10-080` |
| `REQ-10-081` | PRE-030 | Story MUST apply the incoming transition start state before exposing its first audience-visible frame. | Audience/render | `AC-10-081` |
| `REQ-10-082` | PRE-030 | Story MUST remove or inert the outgoing scene only after the semantic transition completion barrier and focus transfer. | Audience/accessibility/render | `AC-10-082` |
| `REQ-10-083` | PRE-030 | Story MUST fall back to a deterministic cut when transition execution fails while retaining the destination and emitting a typed private issue. | Runtime/recovery | `AC-10-083` |
| `REQ-10-084` | PRE-030 | Story MUST bound transition readiness wait by release-profile policy and distinguish timeout from unavailable, blocked, and substituted resources. | Runtime/readiness | `AC-10-084` |
| `REQ-10-085` | PRE-033 | Story MUST compute Morph matches from explicit match identity, stable semantic identity, and published deterministic fallback in that order. | Runtime/Morph/video | `AC-10-085` |
| `REQ-10-086` | PRE-033 | Story MUST match at most one outgoing and one incoming semantic object per Morph pair and classify ambiguity before animation. | Runtime/Morph | `AC-10-086` |
| `REQ-10-087` | PRE-033 | Story MUST interpolate only published compatible geometry, transform, paint, text, crop, effect, and component properties while preserving authored source states. | Runtime/Morph/output | `AC-10-087` |
| `REQ-10-088` | PRE-033 | Story MUST render unmatched or incompatible Morph objects through their authored enter/exit fallback without changing match identity. | Runtime/Morph | `AC-10-088` |
| `REQ-10-089` | PRE-033 | Story MUST preserve stateful media or code continuity across Morph only when source identity and continuity policy explicitly match. | Runtime/Morph/media | `AC-10-089` |
| `REQ-10-090` | PRE-033 | Story MUST use the same Morph match table and interpolated semantic samples in live runtime, recording, and video export. | Runtime/recording/video | `AC-10-090` |
| `REQ-10-091` | PRE-030 | Story MUST transform all nonessential spatial motion to cut, dissolve, or authored no-motion state when reduced motion is active. | Runtime/accessibility | `AC-10-091` |
| `REQ-10-092` | PRE-030 | Story MUST preserve authored timing semantics under reduced motion unless the user selects a compressed-timing accessibility policy. | Runtime/accessibility | `AC-10-092` |
| `REQ-10-093` | PRE-041 | Story MUST apply recorded slide/build timings against semantic boundaries and ignore stale timings whose target identities cannot be mapped. | Runtime/rehearsal | `AC-10-093` |
| `REQ-10-094` | PRE-041 | Story MUST define whether manual input cancels, advances, pauses, or temporarily overrides scheduled timing and expose that policy before entry. | Setup/runtime | `AC-10-094` |
| `REQ-10-095` | PRE-042 | Story MUST emit deterministic timeline events with semantic position and clock offsets for recording tracks without embedding slide or note content. | Recording/runtime | `AC-10-095` |
| `REQ-10-096` | PRE-033 | Story MUST support deterministic seek to any stable build boundary by restoring a checkpoint and replaying pure timeline events to the target. | Runtime/preview/recording | `AC-10-096` |
| `REQ-10-097` | PRE-033 | Story MUST clamp or reject nonfinite, negative, cyclic, or capacity-exceeding timeline values before a session starts. | Preflight/runtime validation | `AC-10-097` |
| `REQ-10-098` | PRE-033 | Story MUST expose timeline drift, dropped frames, late cues, media desynchronization, and fallback state privately without changing timeline truth. | Presenter/diagnostics | `AC-10-098` |
| `REQ-10-099` | PRE-033 | Story MUST resynchronize renderer animation to semantic clock at bounded correction points rather than accumulating callback drift. | Runtime/timeline | `AC-10-099` |
| `REQ-10-100` | PRE-033 | Story MUST produce a canonical privacy-safe event trace sufficient to compare live, rehearsal, recording, and video timing. | Runtime/evidence | `AC-10-100` |

### 8.1 Clock matrix

| Clock | Source | Pauses | Seeks | Visible to audience | Persisted |
|---|---|---|---|---|---|
| Session monotonic | Injected monotonic source | Yes | Only through recovery/test mode | No | Checkpoint offsets |
| Slide elapsed | Session-derived interval | Yes | Recomputed from semantic entry | No | Rehearsal/recording observations |
| Build/effect | Session timeline | Yes | Deterministic | No | Authored timing plus trace |
| Media | Media adapter mapped to session clock | By policy | Yes | Media itself | Semantic state/checkpoint |
| Rehearsal | Session-derived observation | Yes | New interval after seek | Presenter only | Provisional/accepted timing set |
| Recording | Capture adapter mapped to session clock | By recording policy | Split/gap marker | No | Track anchors/chunks |
| Wall clock | Host civil time | No | Not applicable | No | Never as timeline truth |

### 8.2 Transition and Morph failure matrix

| Failure | Audience result | Presenter result | Timeline result |
|---|---|---|---|
| Incoming optional asset unavailable | Declared substitute | Exact asset/action | Continue with substitute |
| Incoming required scene unresolved | Hold last stable scene | Retry/skip/exit | Do not advance position |
| Readiness timeout with safe fallback | Cut to fallback scene | Timeout issue | Commit destination at cut barrier |
| Animation engine failure | Deterministic cut | Engine issue | Commit destination |
| Morph ambiguous | Authored fallback per objects | Match issue | Continue transition |
| Morph property unsupported | Compatible properties interpolate; unsupported property switches at declared threshold | Property issue | Continue transition |
| Transition interrupted by exit | Hold/fade according to exit policy | Ending state | Stop timeline and finalize checkpoint |

## 9. Readiness, Rendering, Scaling, and Performance Requirements

| ID | Parent | Atomic requirement | Surfaces and lifecycle | Acceptance |
|---|---|---|---|---|
| `REQ-10-101` | ARC-022 | Story MUST derive a semantic resource manifest for each show item covering fonts, images, SVG, audio, video, code, data, equations, embeds, captions, and generated scenes. | Preflight/prefetch/runtime | `AC-10-101` |
| `REQ-10-102` | ARC-022 | Story MUST assign active, hot, warm, and cold preparation tiers from show-plan position, navigation history, links, and memory budget. | Runtime/prefetch | `AC-10-102` |
| `REQ-10-103` | ARC-022 | Story MUST prioritize current and likely next semantic targets without performing unrelated network, serialization, or document-wide work on the input path. | Runtime/performance | `AC-10-103` |
| `REQ-10-104` | ARC-022 | Story MUST report readiness per resource as ready, substituted, unavailable, blocked, or timed-out with source and fallback identity. | Runtime/presenter | `AC-10-104` |
| `REQ-10-105` | ARC-022 | Story MUST require fonts and first meaningful visual frames for audience reveal while applying media buffering depth according to authored start policy. | Runtime/readiness | `AC-10-105` |
| `REQ-10-106` | ARC-022 | Story MUST keep readiness indicators, retries, and technical diagnostics on presenter or setup surfaces and render only authored audience-safe fallback content. | Presenter/audience privacy | `AC-10-106` |
| `REQ-10-107` | ARC-022 | Story MUST let the presenter retry, substitute, skip, or hold when a resource fails according to whether it is required for semantic meaning. | Presenter/recovery | `AC-10-107` |
| `REQ-10-108` | ARC-022 | Story MUST preserve a stable last audience frame while a destination is unresolved or recovering. | Audience/render | `AC-10-108` |
| `REQ-10-109` | ARC-020 | Story MUST render audience, presenter previews, recording, and output from the same resolved scene revision and semantic position. | All runtime surfaces | `AC-10-109` |
| `REQ-10-110` | ARC-020 | Story MUST exclude editor selection, guides, rulers, placeholder prompts, hover, cursor affordances, panels, notifications, file status, and authoring overlays from audience roots. | Audience/render | `AC-10-110` |
| `REQ-10-111` | ARC-020 | Story MUST scale the slide with one root transform that preserves authored aspect ratio and computes deterministic letterboxing. | Audience/presenter previews | `AC-10-111` |
| `REQ-10-112` | ARC-020 | Story MUST support fit as the default scale policy and expose fill/crop or native-size policies only when authored or explicitly selected. | Setup/runtime | `AC-10-112` |
| `REQ-10-113` | ARC-020 | Story MUST use presentation-runtime tokens for stage, HUD, overlays, pointer tools, captions, and focus rather than presentation-content theme values. | Runtime UI | `AC-10-113` |
| `REQ-10-114` | ARC-020 | Story MUST update scale, offsets, safe areas, and canvas/WebGL backing stores atomically on viewport, DPR, browser zoom, orientation, or display change. | Runtime/render | `AC-10-114` |
| `REQ-10-115` | ARC-020 | Story MUST reset graphics transforms before applying device-pixel-ratio scaling so repeated resize cannot compound transforms. | Runtime/render | `AC-10-115` |
| `REQ-10-116` | ARC-022 | Story MUST evict prepared scenes and decoded assets by semantic priority, reference safety, recording need, and memory budget without evicting the active stable frame. | Runtime/cache | `AC-10-116` |
| `REQ-10-117` | ARC-022 | Story MUST adapt prefetch depth, render detail, effect quality, and media buffering under pressure through declared degradation steps. | Runtime/performance | `AC-10-117` |
| `REQ-10-118` | ARC-022 | Story MUST keep input handling and semantic clock progression above speculative prefetch, thumbnail, analytics, and diagnostic work. | Runtime/performance | `AC-10-118` |
| `REQ-10-119` | ARC-022 | Story MUST surface first-frame, navigation, readiness, transition, media-start, frame pacing, memory, cache, and drift metrics through privacy-safe bounded telemetry. | Runtime/observability | `AC-10-119` |
| `REQ-10-120` | ARC-022 | Story MUST continue with a documented no-prefetch or reduced-cache mode when cache initialization, storage, worker, or decoding services fail. | Runtime/recovery | `AC-10-120` |

### 9.1 Readiness flow

`FLOW-10-004`:

1. Build the resource manifest from the resolved semantic scene and timeline.
2. Check trusted local cache and embedded assets before network-capable sources.
3. Prepare resources by tier and cancellation token.
4. Validate fonts, first visual frame, media cue readiness, code/data snapshot, captions, and embed fallback.
5. Produce typed outcomes with safe fallback identities.
6. At navigation, wait only for target-critical outcomes within the configured bound.
7. Reveal the ready or declared fallback scene atomically.
8. Continue optional preparation without blocking input.

## 10. Presenter, Audience Windows, and Displays Requirements

| ID | Parent | Atomic requirement | Surfaces and lifecycle | Acceptance |
|---|---|---|---|---|
| `REQ-10-121` | PRE-043 | Story MUST provide a private presenter surface with current slide/build, next semantic cue, notes, elapsed and wall time, remaining estimate where valid, progress, navigation, and audience controls. | Presenter runtime | `AC-10-121` |
| `REQ-10-122` | PRE-043 | Story MUST render current and next presenter previews from the same scene semantics while excluding audience-only transient overlays unless explicitly previewed. | Presenter runtime | `AC-10-122` |
| `REQ-10-123` | PRE-043 | Story MUST support notes scrolling, text-size adjustment, search, link activation policy, and per-slide scroll restoration only on the presenter surface. | Presenter runtime | `AC-10-123` |
| `REQ-10-124` | PRE-043 | Story MUST show slide/show ordinal, section, build position, timing source, recording state, caption state, readiness state, and remote state privately. | Presenter runtime | `AC-10-124` |
| `REQ-10-125` | PRE-043 | Story MUST provide presenter controls for next, previous, jump, back, pause, reset timer, grid, black, white, pointer tools, captions, media, displays, recording, and exit as applicable. | Presenter runtime | `AC-10-125` |
| `REQ-10-126` | PRE-043 | Story MUST allow a presenter window to close and reopen at the latest acknowledged semantic snapshot without restarting the show. | Presenter/recovery | `AC-10-126` |
| `REQ-10-127` | PRE-043 | Story MUST continue audience playback when presenter-window creation is blocked or the presenter window fails. | Audience/recovery | `AC-10-127` |
| `REQ-10-128` | PRE-043 | Story MUST offer a private in-window presenter-control fallback when a second window is unavailable and the audience is not sharing that same render root. | Presenter/windowed fallback | `AC-10-128` |
| `REQ-10-129` | PRE-043 | Story MUST synchronize windows with versioned snapshots, ordered commands, acknowledgements, liveness, and full-state resync after gaps. | Window sync | `AC-10-129` |
| `REQ-10-130` | PRE-043 | Story MUST reject stale, duplicate, malformed, oversized, wrong-session, unauthorized, or unknown cross-window messages before state change. | Window sync/security | `AC-10-130` |
| `REQ-10-131` | PRE-043 | Story MUST keep notes, presenter search, diagnostics, device details, permission state, and private errors out of audience-bound message schemas. | Window sync/privacy | `AC-10-131` |
| `REQ-10-132` | PRE-043 | Story MUST establish window role through a handshake and privacy barrier before presenter-only data or audience output renders. | Window sync/privacy | `AC-10-132` |
| `REQ-10-133` | PRE-043 | Story MUST support one-action presenter/audience role swap while preserving semantic position, timeline, overlays, media, captions, and recording state. | Presenter/displays | `AC-10-133` |
| `REQ-10-134` | PRE-043 | Story MUST clear presenter-only roots before a former presenter window acknowledges its audience role during swap. | Window sync/privacy | `AC-10-134` |
| `REQ-10-135` | PRE-043 | Story MUST route display enumeration, placement, fullscreen targeting, and hotplug through a host capability adapter with explicit unsupported states. | Host/displays | `AC-10-135` |
| `REQ-10-136` | PRE-043 | Story MUST let presenters choose audience and presenter displays when the host permits and provide manual placement guidance otherwise. | Presenter/displays | `AC-10-136` |
| `REQ-10-137` | PRE-043 | Story MUST persist only the last successful display-role policy at device scope and revalidate it on every session. | Preferences/displays | `AC-10-137` |
| `REQ-10-138` | PRE-043 | Story MUST keep the audience stable and reassign or collapse presenter tools when a display disconnects. | Displays/recovery | `AC-10-138` |
| `REQ-10-139` | PRE-043 | Story MUST discover a newly connected display without moving an active audience window until the presenter confirms or policy explicitly permits it. | Displays/hotplug | `AC-10-139` |
| `REQ-10-140` | PRE-043 | Story MUST preserve fullscreen intent and provide a re-request action after browser, OS, or user fullscreen exit. | Audience/presenter/fullscreen | `AC-10-140` |
| `REQ-10-141` | PRE-043 | Story MUST provide a private diagnostics view whose content and selectors are absent from audience DOM and capture unless explicitly included in a diagnostic recording. | Presenter/diagnostics/privacy | `AC-10-141` |
| `REQ-10-142` | PRE-043 | Story MUST keep presenter controls usable under high contrast, forced colors, reduced transparency, zoom, localization, and narrow-window constraints. | Presenter/accessibility | `AC-10-142` |
| `REQ-10-143` | PRE-043 | Story MUST expose window role, sync state, display assignment, privacy state, and recovery actions to keyboard and assistive technology on private surfaces. | Presenter/accessibility | `AC-10-143` |
| `REQ-10-144` | PRE-043 | Story MUST prevent focusable elements in outgoing, hidden, stale, or audience-ineligible roots from remaining in the active tab order. | All runtime roots/accessibility | `AC-10-144` |
| `REQ-10-145` | PRE-043 | Story MUST transfer logical focus after navigation, role swap, grid close, dialog close, and window recovery without stealing focus from active media or caption controls unexpectedly. | Runtime/accessibility | `AC-10-145` |

### 10.1 Cross-window message classes

| Message class | Audience receives | Presenter receives | Required fields |
|---|---:|---:|---|
| Handshake/role | Yes | Yes | session, client, protocol, requested/assigned role, nonce/capability |
| Snapshot | Audience-safe subset | Presenter subset plus private status references, never note body in shared channel | revision, sequence, semantic position, allowed overlays/media/captions |
| Command | Authority-filtered | Authority-filtered | command ID, source role, sequence, expected revision, bounded payload |
| Acknowledgement | Yes | Yes | command/snapshot sequence, applied revision, status |
| Liveness/resync | Yes | Yes | last sequence, role, session, reason |
| Error | Audience-safe code only when needed | Actionable private issue | code, scope, retryability; no content/notes/stack |

## 11. Input, Remote, Touch, Ink, Laser, Captions, and Media Requirements

| ID | Parent | Atomic requirement | Surfaces and lifecycle | Acceptance |
|---|---|---|---|---|
| `REQ-10-146` | PRE-051 | Story MUST normalize keyboard, pointer, touch, pen, clicker, remote, timer, link, media, and accessibility input into bounded semantic commands. | Runtime/input | `AC-10-146` |
| `REQ-10-147` | PRE-051 | Story MUST resolve input conflicts by active focus scope, interactive target, pointer tool, modal overlay, role authority, kiosk restriction, and show policy before shortcut mapping. | Runtime/input | `AC-10-147` |
| `REQ-10-148` | PRE-051 | Story MUST support familiar next and previous keyboard command sets while allowing a localized discoverable shortcut map and avoiding modified browser/OS conflicts. | Runtime/keyboard | `AC-10-148` |
| `REQ-10-149` | PRE-051 | Story MUST support first, last, numeric jump, grid, back, black, white, laser, captions, media, fullscreen, help, and exit keyboard commands where the active role permits. | Runtime/keyboard | `AC-10-149` |
| `REQ-10-150` | PRE-051 | Story MUST process key repeat and bursts through command sequencing and bounded coalescing so legitimate rapid navigation is predictable. | Runtime/keyboard | `AC-10-150` |
| `REQ-10-151` | PRE-051 | Story MUST route typing to focused inputs, presenter search, numeric jump, captions, or interactive slide fields without firing global presentation shortcuts. | Runtime/input focus | `AC-10-151` |
| `REQ-10-152` | PRE-051 | Story MUST support configurable click-to-advance while excluding active links, controls, media, embeds, forms, code interactions, HUD, captions, and pointer-tool gestures. | Audience/input | `AC-10-152` |
| `REQ-10-153` | PRE-051 | Story MUST support touch tap, swipe next/previous, HUD reveal, grid navigation, and accessible magnification with gesture thresholds scaled for device and user settings. | Audience/touch | `AC-10-153` |
| `REQ-10-154` | PRE-051 | Story MUST distinguish pen drawing, pen erasing, touch panning/magnification, palm contact, and slide activation without accidental advance. | Audience/pen/touch | `AC-10-154` |
| `REQ-10-155` | PRE-051 | Story MUST support standard clicker next/previous signals through keyboard mapping and expose host-specific remote capabilities through an adapter. | Runtime/remote | `AC-10-155` |
| `REQ-10-156` | PRE-051 | Story MUST pair network or phone remotes through an explicit short-lived session grant with role, capabilities, expiration, revocation, and visible presenter status. | Remote/security | `AC-10-156` |
| `REQ-10-157` | PRE-051 | Story MUST reject replayed, stale, unauthorized, oversized, or wrong-session remote commands and rate-limit abusive sources without blocking local control. | Remote/security | `AC-10-157` |
| `REQ-10-158` | PRE-051 | Story MUST preserve the last acknowledged remote command sequence across reconnect and resynchronize before accepting new navigation. | Remote/recovery | `AC-10-158` |
| `REQ-10-159` | PRE-051 | Story MUST reveal the HUD on deliberate activity or keyboard focus, retain it while focused/operated, and auto-hide without moving slide content. | Audience/HUD | `AC-10-159` |
| `REQ-10-160` | PRE-051 | Story MUST expose HUD controls, active states, disabled states, shortcuts, progress, and focus with accessible toolbar semantics. | Audience/HUD/accessibility | `AC-10-160` |
| `REQ-10-161` | PRE-051 | Story MUST hide the cursor after configurable inactivity only when no interactive control, pointer tool, text selection, or accessibility setting requires it. | Audience/cursor | `AC-10-161` |
| `REQ-10-162` | PRE-051 | Story MUST toggle black and white audience screens immediately and mutually exclusively while preserving the underlying semantic position. | Audience/presenter tools | `AC-10-162` |
| `REQ-10-163` | PRE-051 | Story MUST render a laser pointer in slide coordinates with display/DPR correction, bounded trail, no authored mutation, and optional recording capture. | Audience/presenter/recording | `AC-10-163` |
| `REQ-10-164` | PRE-051 | Story MUST support pen, highlighter, eraser, clear, color, width, and slide-scoped undo for transient ink with pointer/keyboard alternatives. | Audience/presenter tools | `AC-10-164` |
| `REQ-10-165` | PRE-051 | Story MUST define transient, session-persistent, recording-only, and save-to-presentation ink policies before ink leaves the session. | Presenter/recording/editor | `AC-10-165` |
| `REQ-10-166` | PRE-051 | Story MUST save ink to authored content only through an explicit permission-checked transaction that maps strokes from display to slide coordinates. | Presenter/editor/history | `AC-10-166` |
| `REQ-10-167` | PRE-051 | Story MUST support presenter-controlled slide zoom and pan that affects only the audience viewport and restores a stable full-slide view on reset or navigation by policy. | Audience/presenter tools | `AC-10-167` |
| `REQ-10-168` | PRE-051 | Story MUST keep zoom, laser, and ink coordinate mapping correct across letterboxing, DPR, display swap, orientation, and window resize. | Runtime/render/input | `AC-10-168` |
| `REQ-10-169` | PRE-051 | Story MUST render authored captions from media tracks, recording tracks, or approved live-caption providers with language, speaker, timing, placement, style, and delay controls. | Audience/presenter/recording | `AC-10-169` |
| `REQ-10-170` | PRE-051 | Story MUST keep caption controls and provider errors private while rendering only selected caption text and audience-safe status to the audience. | Presenter/audience/privacy | `AC-10-170` |
| `REQ-10-171` | PRE-051 | Story MUST preserve caption timing against the semantic clock through pause, seek, media rate change, navigation, recording, and recovery. | Runtime/media/captions | `AC-10-171` |
| `REQ-10-172` | PRE-051 | Story MUST support media play, pause, seek, bookmark, volume, mute, caption, and restart commands by stable semantic media target and role policy. | Audience/presenter/media | `AC-10-172` |
| `REQ-10-173` | PRE-051 | Story MUST apply autoplay and audio policies through authored settings, browser permission outcomes, and presenter fallback controls without blocking navigation. | Runtime/media | `AC-10-173` |
| `REQ-10-174` | PRE-051 | Story MUST synchronize media playhead and rate to the session timeline within published drift limits while preserving user-initiated media state allowed by the author. | Runtime/media | `AC-10-174` |
| `REQ-10-175` | PRE-051 | Story MUST render deterministic posters or authored fallbacks for blocked, unavailable, stalled, or corrupt media and surface retry privately. | Audience/presenter/media | `AC-10-175` |

### 11.1 Input priority matrix

Priority is highest first:

| Priority | Context | Result |
|---:|---|---|
| 1 | Security/permission/system modal | Runtime does not consume input |
| 2 | Authorized kiosk exit sequence | Exit input captured; secret entered only in trusted host surface |
| 3 | Focused text/search/numeric/caption/form control | Control receives text and editing keys |
| 4 | Interactive slide object or media control | Object activation receives event; advance suppressed |
| 5 | Active pen/highlighter/eraser/zoom tool | Tool receives pointer/pen/touch gesture |
| 6 | Presenter/HUD/grid control | Focused control receives event |
| 7 | Global presentation shortcut/gesture | Normalized session command |
| 8 | Browser/OS unhandled shortcut | Passed through when safe |

### 11.2 Remote flow

`FLOW-10-005`:

1. Presenter opens pairing and the authority creates a short-lived capability grant.
2. Remote proves possession through the trusted pairing channel.
3. Authority assigns a bounded role and last accepted sequence.
4. Remote receives only audience-safe coarse session state.
5. Each command carries session, grant, sequence, expected revision, and bounded payload.
6. Authority validates, rate-limits, reduces, and acknowledges or rejects.
7. Reconnect performs liveness and sequence resynchronization before commands resume.
8. Presenter or expiry revokes the grant immediately.

## 12. Kiosk, Recovery, Privacy, and Failure Requirements

| ID | Parent | Atomic requirement | Surfaces and lifecycle | Acceptance |
|---|---|---|---|---|
| `REQ-10-176` | PRE-050 | Story MUST run kiosk mode from an explicit show plan, recorded/default timing policy, loop count, end behavior, interaction policy, and recovery policy. | Kiosk setup/runtime | `AC-10-176` |
| `REQ-10-177` | PRE-052 | Story MUST schedule kiosk build and slide advances against the semantic clock and current readiness state rather than independent repeating timers. | Kiosk/runtime | `AC-10-177` |
| `REQ-10-178` | PRE-052 | Story MUST define kiosk interaction as disabled, restart-countdown, pause-countdown, manual-until-resume, or fully interactive before entry. | Kiosk setup/runtime | `AC-10-178` |
| `REQ-10-179` | PRE-052 | Story MUST make kiosk loop behavior deterministic across builds, media, captions, transient overlays, ink, timers, and recording state. | Kiosk/runtime | `AC-10-179` |
| `REQ-10-180` | PRE-052 | Story MUST provide an authorized kiosk exit that never stores or transmits a plaintext secret through presentation state, URL, logs, or telemetry. | Kiosk/security | `AC-10-180` |
| `REQ-10-181` | PRE-052 | Story MUST keep essential host accessibility and emergency exit mechanisms available even when ordinary kiosk navigation input is disabled. | Kiosk/accessibility/safety | `AC-10-181` |
| `REQ-10-182` | PRE-052 | Story MUST recover kiosk playback after reload, process restart where supported, sleep/wake, network loss, and display change according to the configured restart/resume policy. | Kiosk/recovery | `AC-10-182` |
| `REQ-10-183` | ARC-022 | Story MUST classify runtime failures by scope, severity, audience effect, retryability, and recovery action without exposing technical detail to the audience. | Runtime/recovery | `AC-10-183` |
| `REQ-10-184` | ARC-022 | Story MUST retain the last stable audience frame or an authored safe screen while recovering from renderer, window, display, or resource failure. | Audience/recovery | `AC-10-184` |
| `REQ-10-185` | ARC-022 | Story MUST restore a session from the latest valid checkpoint only when presentation identity, authored/show-plan revision, schema, and permission context remain compatible. | Runtime/recovery | `AC-10-185` |
| `REQ-10-186` | ARC-022 | Story MUST offer restart, resume, use latest authored revision, continue degraded, return to editor, or end according to the detected recovery conflict. | Presenter/recovery | `AC-10-186` |
| `REQ-10-187` | ARC-022 | Story MUST preserve accepted recording chunks and annotate timing/media gaps when recovery cannot restore exact capture continuity. | Recording/recovery | `AC-10-187` |
| `REQ-10-188` | ARC-022 | Story MUST handle sleep/wake and background throttling by suspending semantic time and explicitly resynchronizing media, displays, windows, and captions before resume. | Runtime/recovery | `AC-10-188` |
| `REQ-10-189` | ARC-022 | Story MUST handle network loss using embedded/cached resources and authored fallbacks without retry storms or blocked local navigation. | Runtime/offline/recovery | `AC-10-189` |
| `REQ-10-190` | ARC-022 | Story MUST handle low memory by evicting noncritical tiers, reducing quality, and preserving active/recording-critical resources before ending the session. | Runtime/memory/recovery | `AC-10-190` |
| `REQ-10-191` | ARC-022 | Story MUST handle audience-window loss by retaining session authority and offering reopen, reassign, continue windowed, or end without losing semantic position. | Window/recovery | `AC-10-191` |
| `REQ-10-192` | PRE-043 | Story MUST handle authority-window loss through an elected or host-designated recovery authority that cannot expose presenter data to audience roles. | Window/recovery/security | `AC-10-192` |
| `REQ-10-193` | PRE-043 | Story MUST keep audience and presenter render roots, storage, channels, screenshots, and capture sources separated according to role and consent. | Runtime/privacy | `AC-10-193` |
| `REQ-10-194` | PRE-043 | Story MUST exclude notes, hidden presenter thumbnails, search terms, diagnostics, device labels, private errors, and authentication data from audience DOM and messages. | Runtime/privacy | `AC-10-194` |
| `REQ-10-195` | PRE-042 | Story MUST expose an always-visible private recording indicator and active-track state while any capture source is operating. | Presenter/recording/privacy | `AC-10-195` |
| `REQ-10-196` | PRE-042 | Story MUST stop capture immediately when permission is revoked, the user stops, the session ends, or the selected source disappears. | Recording/security | `AC-10-196` |
| `REQ-10-197` | PRE-053 | Story MUST treat shared viewing, polls, Q&A, reactions, and live audience services as disabled unless an accepted service contract defines identity, consent, moderation, latency, retention, and fallback. | Runtime/audience services | `AC-10-197` |
| `REQ-10-198` | PRE-053 | Story MUST isolate an enabled audience service from core local navigation so service failure cannot block or reorder the show. | Runtime/audience services | `AC-10-198` |
| `REQ-10-199` | PRE-053 | Story MUST show presenter-controlled moderation and privacy state before audience-generated content can appear on any shared surface. | Presenter/audience services | `AC-10-199` |
| `REQ-10-200` | ARC-022 | Story MUST emit privacy-safe bounded diagnostics and immutable evidence references without slide content, notes, captions, remote secrets, raw device data, or audience identities. | Runtime/observability | `AC-10-200` |

### 12.1 Failure matrix

| Failure | Session action | Audience | Presenter/recovery |
|---|---|---|---|
| Empty/invalid show plan | Block entry | No session root | Repair setup or return to editor |
| Fullscreen denied | Continue windowed | Stable windowed output | Re-request action |
| Presenter popup blocked | Continue audience | No presenter content | In-window fallback and popup guidance |
| Audience window closed | Hold authority/checkpoint | Output absent | Reopen/reassign/windowed/end |
| Display disconnected | Preserve current audience root where possible | Stable or moved output | Reassign/collapse tools |
| Required incoming scene unresolved | Hold last stable frame | Last stable frame/safe screen | Retry/skip/exit |
| Optional asset/media failure | Use authored fallback | Fallback | Exact issue/retry |
| Timeline/effect error | Resolve affected step fallback | Semantic end state | Step issue/continue |
| Media stall | Continue navigation | Poster/frozen authored policy | Retry/skip/control |
| Remote disconnect | Local control unaffected | No change | Reconnect/revoke state |
| Sleep/background throttle | Suspend | Last OS-composited frame | Resync before resume |
| Memory pressure | Evict/degrade | Active frame preserved | Quality/cache issue |
| Recording device loss | Continue eligible tracks | No private error | Gap/retake/reselect device |
| Critical authority failure | Recover/elect/end | Safe frame | Validated checkpoint choices |

### 12.2 Recovery flow

`FLOW-10-006`:

1. Freeze command acceptance at the last ordered sequence and retain the stable audience frame.
2. Classify failure scope and determine whether authority, scene, media, window, display, or capture is affected.
3. Validate the newest compatible checkpoint and accepted recording chunks.
4. Rebuild session adapters and render roots without stale DOM or streams.
5. Restore semantic position, clock offsets, overlays, media, captions, roles, and kiosk state where verifiable.
6. Mark gaps or substitutions that cannot be restored exactly.
7. Cross a privacy and readiness barrier before audience reveal.
8. Resume paused/running state or present private alternatives.

### 12.3 Edge-case interaction rules

| Edge case | Deterministic rule |
|---|---|
| Show plan contains one item | First, last, next-at-end, previous-at-start, loop, and end policy resolve without synthetic duplicate items. |
| Same slide appears repeatedly in a custom show | Each occurrence has a distinct `showItemId`; history, timing, and progress use occurrence identity while content uses stable slide identity. |
| Current slide becomes hidden in a live revision | The immutable current show plan remains unchanged until an accepted revision transition; recompilation previews the resulting position. |
| Current build target disappears in a live revision | The current plan retains its resolved scene; an accepted revision maps to the nearest valid stable build boundary and records the remap. |
| Next and Previous arrive at the same sequence boundary | Session sequence and authority decide one order; opposite-direction coalescing prevents a stale queued command from firing later. |
| Pause arrives during readiness | Readiness may continue, but audience reveal and semantic clocks remain paused until resume. |
| Pause arrives during a nonpausable transition | The transition reaches its nearest declared stable barrier, records the pause position, and does not start subsequent cues. |
| Black/white screen is active during navigation | The overlay remains audience-visible while semantic navigation proceeds unless show policy freezes navigation; presenter status still updates. |
| Grid opens during a running build | The build follows configured pause/continue policy; grid selection does not alter position until activation. |
| Media owns keyboard focus when global navigation is requested | Media consumes its declared controls; unconsumed navigation commands bubble through the normalized input resolver exactly once. |
| Caption cue spans a slide boundary | The cue ends, carries, or remaps only according to its authored track scope; no stale caption remains by accident. |
| Display swap occurs while notes are selected | Presenter selection state stays private and is cleared from the future audience root before the privacy barrier opens. |
| Audience window reconnects several revisions behind | It renders a safe holding surface, receives a full allowlisted snapshot, acknowledges it, then crosses the reveal barrier. |
| Kiosk reaches an all-hidden or invalid remainder | It follows configured stop/safe-screen/recompile policy and never enters a tight advance loop. |
| Session ends while an input, readiness, or remote command is pending | Ending wins; pending commands are canceled or acknowledged as terminal without post-exit mutation. |

## 13. Keyboard and Accessibility Hooks

Volume 12 owns complete accessibility conformance. This runtime provides:

| Context | Keyboard/alternative input | Semantic output |
|---|---|---|
| Audience surface | Next/previous, first/last, jump, grid, back, black/white, pointer, captions, media, HUD, help, exit under authority | Slide title/ordinal/section/build, interactive content, caption text, control status |
| Presenter surface | All audience commands plus notes/search, display, timing, readiness, remote, recording, recovery | Private notes, current/next, timing source, issue and role state |
| Grid | Roving focus, search, section traversal, hidden-slide identification, activate/cancel | Slide/show ordinal, title, section, hidden/current/visited/readiness state |
| Media | Target traversal, play/pause/seek/mute/volume/captions/restart | Media title, state, time/duration, caption/audio state, error |
| Ink/laser/zoom | Toolbar and numeric/command alternatives; Escape exits tool | Active tool, color/width, stroke count, zoom scale/pan, save policy |
| Kiosk | Essential accessibility controls and authorized exit remain reachable | Restricted-mode status and exit guidance on private/host surface |
| Recovery | Keyboard-operable retry/skip/reopen/reassign/degrade/exit choices | Failure scope, audience state, checkpoint age, recording preservation |

Announcements are scoped and deduplicated. A build announcement identifies meaningful newly available content using authored accessibility metadata rather than reading arbitrary visual text repeatedly.

## 14. Acceptance Criteria

All visual runtime criteria require headed browser execution. Multi-display, clicker, capture-device, sleep/wake, and host-placement claims additionally require the hardware/host matrix in Volume 15. Event traces, checkpoints, messages, recordings, and output artifacts require structural inspection.

### 14.1 Modes and session lifecycle

| ID | Pass condition |
|---|---|
| `AC-10-001` | Every start source resolves the intended stable show item and build phase without relying on editor index. |
| `AC-10-002` | Every runtime mode can combine with each compatible surface role and placement without creating an undocumented mode value; Presenter View and fullscreen never appear in the runtime-mode field. |
| `AC-10-003` | Compiled show-plan artifacts contain stable base-narrative, edition, directive, variable-mode, narrative-item, slide-occurrence, hidden-policy, start, and repetition identity in deterministic order. |
| `AC-10-004` | Setup visibly and semantically exposes all hidden/narration/timing/animation/media/caption/loop/end policies. |
| `AC-10-005` | Precedence fixtures resolve explicit, custom-show, presentation, authored, and system/accessibility settings exactly. |
| `AC-10-006` | Setup preview matches first runtime position, display roles, aspect, and readiness findings. |
| `AC-10-007` | Preference inspection finds only declared device-local nonsecret values and no presentation content. |
| `AC-10-008` | Empty, inaccessible, and unresolved plans block entry with actionable findings and no session root. |
| `AC-10-009` | Outside-show jumps obey policy and identify context without corrupting linear show order. |
| `AC-10-010` | Every end behavior reaches its declared final frame/window/editor state deterministically. |
| `AC-10-011` | Loop fixtures restart at the configured build/timer state with identical event traces on repeated loops. |
| `AC-10-012` | Deliberate windowed mode never requests fullscreen and retains full runtime semantics. |
| `AC-10-013` | Presenter View can be opened manually on a one-display/unenumerable host. |
| `AC-10-014` | Rehearsal uses production event order and leaves authored timings unchanged until acceptance. |
| `AC-10-015` | Recording uses production event order and creates synchronized recoverable tracks. |
| `AC-10-016` | Preview mode is nonauthoring and scene/navigation-equivalent to the same authored sequence used by other runtime modes. |
| `AC-10-017` | Supported host display choices route roles correctly; unsupported hosts present accurate guidance. |
| `AC-10-018` | Forced accessibility/host/offline/permission settings are disclosed before session creation. |
| `AC-10-019` | Setup preset artifacts contain allowed options and no secrets, notes, device IDs, or transient state. |
| `AC-10-020` | Keyboard/assistive setup covers every option, dependency, validation error, and action. |
| `AC-10-021` | Exit restores captured editor root/slide/viewport/selection/focus/panels when valid. |
| `AC-10-022` | Preflight fixture finds every seeded schema/reference/resource/media/embed/caption/animation/display/permission issue. |
| `AC-10-023` | Every finding has correct severity, degradation, and recovery action and only blocking findings prevent entry. |
| `AC-10-024` | Entry creates one canonical `SCH-10-001` snapshot whose ID matches its semantic content after resolved blockers; canceled/blocked setup creates none, and changing any semantic input changes the ID. |
| `AC-10-025` | Permission instrumentation proves each request is user-initiated, mode-required, and minimally scoped. |
| `AC-10-026` | Denial fixtures enter the exact documented fallback mode without losing setup or position. |
| `AC-10-027` | First audience frame is a fully initialized ready or declared fallback semantic position. |
| `AC-10-028` | Entry-time command bursts apply in bounded sequence after first stable frame with no lost accepted intent. |
| `AC-10-029` | Clock traces show each clock origin at its declared event and no shared accidental start. |
| `AC-10-030` | Pause freezes every configured timed subsystem and leaves wall-clock display behavior correct. |
| `AC-10-031` | Resume continues from exact semantic offsets with no double-fired cues or counted pause interval. |
| `AC-10-032` | User pause, suspension, readiness, tool focus, and recovery produce distinct state and timer/input policy. |
| `AC-10-033` | Stable position and material-state changes yield bounded checkpoints with no private content. |
| `AC-10-034` | External fullscreen exit preserves the show and exposes correct re-request/window state. |
| `AC-10-035` | Every authorized exit path reaches one valid ending sequence; unauthorized paths are rejected. |
| `AC-10-036` | Simultaneous exit requests execute cleanup and restoration exactly once. |
| `AC-10-037` | Exit during recording finalizes/recoverably marks every provisional chunk before release. |
| `AC-10-038` | Editor state and authored undo stack match pre-entry values except explicit accepted authoring transactions. |
| `AC-10-039` | End summaries appear only privately and accurately report rehearsal/recording/failures/degradation/ink. |
| `AC-10-040` | Resource instrumentation reports no leaked stream, listener, channel, timer, frame, wake lock, URL, root, or managed window. |

### 14.2 Navigation and timeline

| ID | Pass condition |
|---|---|
| `AC-10-041` | Next advances click builds then eligible show items for mixed manual/automatic fixture timelines. |
| `AC-10-042` | Previous reverses reversible builds and returns to the declared previous-slide state. |
| `AC-10-043` | Forward/jump entry uses pre-build except for explicitly configured causes. |
| `AC-10-044` | Backward slide entry uses final stable build except for history-specific restoration. |
| `AC-10-045` | Linear navigation skips or includes hidden slides exactly as compiled. |
| `AC-10-046` | Number/title/section/thumbnail/link/occurrence/deep-link targets resolve to expected stable positions. |
| `AC-10-047` | Canonical and show-plan numbering remain accurate and visibly distinguished in custom shows. |
| `AC-10-048` | Explicit hidden-slide jumps work and presenter surfaces identify hidden status. |
| `AC-10-049` | Nonlinear jumps push exact semantic origin and cause before destination commit. |
| `AC-10-050` | Back restores stable position after reorder/revision fixtures or uses the documented nearest fallback. |
| `AC-10-051` | Linear commands do not pollute nonlinear history under default policy. |
| `AC-10-052` | Every action-link family executes its declared trust, target, and history behavior. |
| `AC-10-053` | Interactive target activations never also advance the show. |
| `AC-10-054` | Link entry-state policies map to expected build identities and missing names fail safely. |
| `AC-10-055` | Grid/list search, sections, hidden/current/visited/readiness cues, and keyboard navigation are accurate at scale. |
| `AC-10-056` | Grid close/retain policy matches initiating surface and no preview selection changes position. |
| `AC-10-057` | Concurrent-source command traces reduce in authority/sequence order and converge across windows. |
| `AC-10-058` | Privacy-safe event log replay reproduces every semantic position in the fixture session. |
| `AC-10-059` | Repeated commands during preparation/transition queue or coalesce exactly by policy. |
| `AC-10-060` | Opposite-direction burst fixtures cancel stale queued intent and end at expected position. |
| `AC-10-061` | Skip lands at effect semantic end state and preserves subsequent build order. |
| `AC-10-062` | Nonreversible Previous follows checkpoint/reevaluation/fallback policy without undefined state. |
| `AC-10-063` | Only authored persistent media/component state survives build navigation. |
| `AC-10-064` | Live plan revision retains valid semantic history and marks invalid entries without index drift. |
| `AC-10-065` | Accessible announcements are accurate, scoped, deduplicated, and do not flood on transient frames. |
| `AC-10-066` | Runtime build order/count matches normalized timeline even when renderer DOM order is deliberately scrambled. |
| `AC-10-067` | Injected clock controls origin/pause/rate/seek and repeated runs produce identical timeline events. |
| `AC-10-068` | Session/slide/build/rehearsal/recording elapsed values match one monotonic trace without conflation. |
| `AC-10-069` | Wall-clock changes cannot alter effect order, durations, kiosk advance, rehearsal, or recording timing. |
| `AC-10-070` | Trigger/timing matrix produces identical expected event order across runtime, recording, and video simulation. |
| `AC-10-071` | Parallel effects share one click build and presenter progress reports one semantic step. |
| `AC-10-072` | Automatic effects remain in their owner build unless explicit independent triggers exist. |
| `AC-10-073` | Checkpoints never record a build before start state and scheduling are atomically applied. |
| `AC-10-074` | Sync/recovery with reordered steps restores by stable step identity and phase. |
| `AC-10-075` | Every effect family targets semantic IDs and unresolved targets follow declared fallback. |
| `AC-10-076` | Disabled/skipped effects produce required end content and omit only declared nonessential effects. |
| `AC-10-077` | Fault-injected effect failure is isolated and dependent/subsequent behavior follows authored policy. |
| `AC-10-078` | Transition inheritance resolves before preparation and remains stable for the navigation. |
| `AC-10-079` | Invalid/legacy transition configs normalize to the exact supported/fallback contract. |
| `AC-10-080` | DOM/canvas capture shows both scenes throughout every transition that requires both. |
| `AC-10-081` | Pixel/frame capture contains no incoming final-state flash before the transition start state. |
| `AC-10-082` | Outgoing roots become inert/removed only after completion and focus transfers without leaks. |
| `AC-10-083` | Engine failures cut deterministically to destination and emit the correct private issue. |
| `AC-10-084` | Timeout/unavailable/blocked/substituted readiness cases remain distinct in state and evidence. |
| `AC-10-085` | Morph matching prioritizes explicit then stable semantic then fallback identity. |
| `AC-10-086` | Ambiguous fixtures never assign one object to multiple pairs and expose exact ambiguity. |
| `AC-10-087` | Supported Morph properties interpolate within tolerance while source states remain unchanged. |
| `AC-10-088` | Unmatched/incompatible objects use authored fallback without changing future match identity. |
| `AC-10-089` | Stateful media/code continuity occurs only for matching identity and explicit continuity policy. |
| `AC-10-090` | Live, recording, and video use an identical match table and sampled semantic values. |
| `AC-10-091` | Reduced-motion fixtures retain semantic content with declared cut/dissolve/no-motion behavior. |
| `AC-10-092` | Reduced motion preserves or intentionally compresses timing exactly by selected policy. |
| `AC-10-093` | Recorded timing maps by stable boundaries and stale targets are reported and ignored. |
| `AC-10-094` | Manual input applies the configured cancel/advance/pause/override timing policy. |
| `AC-10-095` | Recording events contain stable semantic positions/offsets and no slide or note content. |
| `AC-10-096` | Seek-to-boundary restores and replays to a canonical event/state hash. |
| `AC-10-097` | Invalid timeline values block or clamp before entry with exact diagnostics. |
| `AC-10-098` | Drift/drop/late/media fallback diagnostics remain private and do not alter semantic trace. |
| `AC-10-099` | Long-run clock fixture remains within drift budget through bounded resynchronization. |
| `AC-10-100` | Canonical traces compare equal for live, rehearsal, recording, and video fixture runs. |

### 14.3 Readiness, windows, and displays

| ID | Pass condition |
|---|---|
| `AC-10-101` | Resource manifests enumerate every seeded font/image/SVG/audio/video/code/data/equation/embed/caption/generated dependency. |
| `AC-10-102` | Tier assignment changes predictably with position/history/links and obeys memory budget. |
| `AC-10-103` | Input-path profiling shows no unrelated network, serialization, or full-document work. |
| `AC-10-104` | Every resource fixture reaches the correct typed outcome with source and fallback identity. |
| `AC-10-105` | Audience reveal waits for fonts/first visual frame and only the authored media buffering requirement. |
| `AC-10-106` | Audience DOM/screens contain only authored fallback while presenter receives readiness detail/actions. |
| `AC-10-107` | Retry/substitute/skip/hold availability and result match semantic criticality. |
| `AC-10-108` | Fault injection never exposes an uninitialized frame while a target is unresolved. |
| `AC-10-109` | Audience/presenter/recording/output captures share scene revision and semantic position. |
| `AC-10-110` | Audience-clean selector, hit-test, accessibility, and pixel audits find no authoring chrome or prompts. |
| `AC-10-111` | Aspect-ratio matrix yields deterministic root scale/offset and no per-element scaling drift. |
| `AC-10-112` | Fit/fill/native policies produce their declared crop/letterbox behavior and default to fit. |
| `AC-10-113` | Runtime UI responds to app/accessibility theme without changing presentation-content theme. |
| `AC-10-114` | Resize/DPR/zoom/orientation/display changes atomically update scale and backing stores without overlap. |
| `AC-10-115` | Repeated resize leaves canvas/WebGL transform and pixel mapping identical to a fresh resize. |
| `AC-10-116` | Eviction preserves active/recording-critical resources and removes lowest-priority safe entries first. |
| `AC-10-117` | Pressure tiers reduce prefetch/detail/effects/buffering in documented order and retain semantic output. |
| `AC-10-118` | Scheduling evidence gives input/clock work priority over speculative/background work. |
| `AC-10-119` | Metrics are emitted within schema/bounds and contain no presentation or private presenter content. |
| `AC-10-120` | Cache/worker/decoder failures enter documented degraded mode and navigation remains functional. |
| `AC-10-121` | Presenter surface displays accurate current/next/notes/times/remaining/progress/navigation/audience controls. |
| `AC-10-122` | Current/next previews match semantic scenes and exclude inappropriate transient overlays. |
| `AC-10-123` | Notes scroll/size/search/link policy is private and per-slide scroll restores correctly. |
| `AC-10-124` | Presenter status accurately reports all declared ordinal/section/build/timing/recording/caption/readiness/remote states. |
| `AC-10-125` | Every applicable presenter control dispatches the expected authorized semantic command. |
| `AC-10-126` | Close/reopen resumes latest acknowledged semantic snapshot and timers without show restart. |
| `AC-10-127` | Popup/window failure leaves audience playback and local authority operational. |
| `AC-10-128` | In-window fallback remains private under the supported screen-sharing/window arrangement. |
| `AC-10-129` | Dropped/out-of-order message simulation triggers acknowledgement/gap detection/full resync and convergence. |
| `AC-10-130` | Stale/duplicate/malformed/oversized/wrong-session/unauthorized/unknown messages cause no side effect. |
| `AC-10-131` | Audience-bound message capture contains no notes/search/diagnostics/device/permission/private-error fields. |
| `AC-10-132` | No role renders until handshake and privacy barrier acknowledge the correct session revision. |
| `AC-10-133` | Role swap preserves position/timeline/overlay/media/caption/recording state exactly. |
| `AC-10-134` | Pixel/DOM/message capture during swap finds no presenter content on the future audience surface. |
| `AC-10-135` | Display operations call only the capability adapter and expose accurate unsupported states. |
| `AC-10-136` | Hardware-capable host routes chosen displays; fallback host gives actionable manual guidance. |
| `AC-10-137` | Stored display policy is device-scoped, nonsecret, revalidated, and safely ignored when stale. |
| `AC-10-138` | Disconnect keeps audience stable and reassigns/collapses presenter tools without position loss. |
| `AC-10-139` | Hotplug detection does not move output until confirmation/policy allows. |
| `AC-10-140` | Fullscreen exit retains intent/status and re-request succeeds or degrades predictably. |
| `AC-10-141` | Audience DOM/capture contains no diagnostics selectors/content under normal operation. |
| `AC-10-142` | Presenter controls remain visible, nonoverlapping, and operable in all declared accessibility/window states. |
| `AC-10-143` | Assistive technology reports role/sync/display/privacy/recovery state and actions accurately. |
| `AC-10-144` | Tab-order audit finds no focusable outgoing/hidden/stale/ineligible root. |
| `AC-10-145` | Focus lands on the documented target after every navigation/swap/grid/dialog/recovery scenario. |

### 14.4 Input, tools, kiosk, recovery, and privacy

| ID | Pass condition |
|---|---|
| `AC-10-146` | Equivalent keyboard/pointer/touch/pen/clicker/remote/timer/link/media/a11y inputs yield the same bounded command. |
| `AC-10-147` | Conflict matrix routes events to the highest-priority eligible scope and prevents duplicate actions. |
| `AC-10-148` | Familiar next/previous keys work, localized map is discoverable, and modified OS/browser chords pass through. |
| `AC-10-149` | Every declared global command operates only for authorized roles/contexts. |
| `AC-10-150` | Repeat/burst traces produce predictable coalesced command sequences without arbitrary accepted-input loss. |
| `AC-10-151` | Focused input/search/jump/caption/form typing never fires global commands. |
| `AC-10-152` | Click-advance exclusion corpus activates objects/media/HUD without unintended advance. |
| `AC-10-153` | Touch tap/swipe/grid/magnification pass thresholds and accessibility settings across device scales. |
| `AC-10-154` | Pen/palm/touch fixtures draw, erase, pan, magnify, or activate exactly once without advance. |
| `AC-10-155` | Standard clicker signals and host remote adapter commands map correctly. |
| `AC-10-156` | Pairing grant is short-lived, capability-bounded, visible, revocable, and contains no private presenter data. |
| `AC-10-157` | Replay/stale/unauthorized/oversized/wrong-session/rate-abuse commands are rejected while local control remains responsive. |
| `AC-10-158` | Remote reconnect resumes after sequence resync and never replays an acknowledged navigation. |
| `AC-10-159` | HUD reveal/focus/operation/autohide timing works without layout shift or focus loss. |
| `AC-10-160` | HUD role/names/states/shortcuts/progress/focus pass keyboard and assistive-technology checks. |
| `AC-10-161` | Cursor hides only in eligible inactivity and reappears immediately on required activity. |
| `AC-10-162` | Black/white toggles meet latency, mutual exclusion, position preservation, and recording policy. |
| `AC-10-163` | Laser mapping/trail/DPR/session/recording behavior matches every scale/display fixture and creates no authored operation. |
| `AC-10-164` | Ink tool/color/width/erase/clear/undo workflows are slide-scoped, keyboard-operable, and deterministic. |
| `AC-10-165` | Each ink persistence policy retains/discards/captures/saves exactly the declared strokes. |
| `AC-10-166` | Save-ink maps display strokes to slide coordinates, checks permission, commits once, and fully undoes. |
| `AC-10-167` | Zoom/pan affects only audience viewport and reset/navigation follows configured restoration policy. |
| `AC-10-168` | Coordinate probes remain aligned after letterbox/DPR/swap/orientation/resize combinations. |
| `AC-10-169` | Authored/media/recording/live caption fixtures render correct text/language/speaker/timing/placement/style/delay. |
| `AC-10-170` | Provider/control/error state stays private and audience receives only selected text/safe status. |
| `AC-10-171` | Caption cues remain within timing tolerance through pause/seek/rate/navigation/recording/recovery. |
| `AC-10-172` | Media commands target stable IDs and obey role policy across multiple-media fixtures. |
| `AC-10-173` | Autoplay/audio policy handles browser denial with presenter control and never blocks navigation. |
| `AC-10-174` | Long media/timeline fixtures remain within drift budget and preserve allowed user state. |
| `AC-10-175` | Blocked/unavailable/stalled/corrupt media uses exact authored fallback and private retry. |
| `AC-10-176` | Kiosk setup compiles plan/timing/loop/end/input/recovery into a deterministic session. |
| `AC-10-177` | Kiosk advances at semantic build/slide boundaries using injected clock and readiness outcomes. |
| `AC-10-178` | Every interaction policy produces its declared countdown/manual behavior. |
| `AC-10-179` | Repeated loops reset/preserve builds/media/captions/overlays/ink/timers/recording exactly by policy. |
| `AC-10-180` | Secret-handling inspection finds no plaintext kiosk secret in state, URL, logs, messages, or telemetry. |
| `AC-10-181` | Accessibility and emergency exit remain available while ordinary kiosk input is blocked. |
| `AC-10-182` | Reload/restart/sleep/network/display recovery follows configured restart/resume policy and stable position. |
| `AC-10-183` | Failure corpus assigns correct scope/severity/audience/retry/recovery without audience technical detail. |
| `AC-10-184` | Renderer/window/display/resource faults preserve last stable frame or authored safe screen. |
| `AC-10-185` | Recovery accepts only compatible identity/revision/schema/permission checkpoints. |
| `AC-10-186` | Conflict-specific recovery choices are accurate and each produces the previewed state. |
| `AC-10-187` | Recording faults preserve accepted chunks and create exact gap annotations. |
| `AC-10-188` | Sleep/background simulation suspends semantic time and resynchronizes before audience resume. |
| `AC-10-189` | Offline fixture uses cache/fallback without retry storm and local navigation stays responsive. |
| `AC-10-190` | Memory pressure evicts/degrades in order and preserves active/recording-critical resources. |
| `AC-10-191` | Audience-window loss offers reopen/reassign/windowed/end and preserves position. |
| `AC-10-192` | Authority loss recovers/elects only authorized role without presenter-data exposure. |
| `AC-10-193` | DOM/storage/channel/screenshot/capture audits prove role and consent separation. |
| `AC-10-194` | Audience artifact and message scans contain none of the named private data classes. |
| `AC-10-195` | Active capture always shows private recording and track indicators. |
| `AC-10-196` | Stop/revoke/end/source-loss closes capture streams immediately and preserves accepted chunks. |
| `AC-10-197` | Audience services remain absent/disabled unless every accepted service-contract field is configured. |
| `AC-10-198` | Injected audience-service failure has no effect on local semantic navigation order or latency gate. |
| `AC-10-199` | Audience-generated content cannot render before presenter moderation/privacy state permits it. |
| `AC-10-200` | Diagnostic/evidence payload inspection finds only allowlisted bounded metadata and immutable evidence references. |

## 15. Required Evidence and Traceability

Runtime conformance requires:

1. A mapping from every `REQ-10-*` to parent capability, reducer command/event, adapter owner, applicable mode/host, test protocol, revision, and evidence record.
2. Pure reducer tests for every state transition, command conflict, history path, clock operation, build boundary, recovery path, and invalid input.
3. Headed browser workflows for entry/exit, navigation, transitions, builds, grid, overlays, media, captions, Presenter View, close/reopen, role swap, fullscreen denial, kiosk, and recovery.
4. Canvas-pixel, DOM visibility, hit-test, focus-order, and accessibility-tree evidence proving audience cleanliness and nonblank stable frames.
5. Message-capture and schema-fuzz evidence proving cross-window/remote privacy, ordering, rejection, acknowledgement, and resync.
6. Hardware/host evidence for multi-display placement/hotplug, clickers, touch/pen, microphones/cameras, sleep/wake, and capture interruption where claimed.
7. Canonical event-trace equality across live playback, rehearsal, recording, and deterministic video rendering.
8. Long-run 10-, 50-, and 100-slide performance/soak evidence with frame pacing, memory, prefetch, media drift, window recovery, and resource cleanup.
9. Negative gates for DOM-derived builds, notes leakage, blank transition frames, stale queued input, wall-clock timing, untyped readiness, plaintext kiosk secrets, and recording overwrite.

## 16. Non-Goals and Open Boundaries

This volume does not require:

- Pixel-identical presenter or audience chrome from another product.
- Bypassing browser/OS popup, fullscreen, autoplay, capture, window-placement, or wake-lock permissions.
- Presenter notes or diagnostics in the audience process for convenience.
- Network access for core local playback.
- Executing untrusted slide scripts, arbitrary embeds, macros, or plugins.
- A phone remote, live captions, polls, Q&A, reactions, or shared viewing without an accepted security/privacy/service contract.
- Saving transient laser, zoom, overlays, or ink as authored content without explicit action.
- Preserving exact in-flight visual pixels after crash when semantic recovery is possible.

Open decisions are controlled by the following defaults. An ADR and published support matrix may expand a capability, but implementation and conformance use the default in force until both are accepted.

| ID | Decision/question | Default in force | Owner | Review trigger | Affected requirements/contracts | Blocking class |
|---|---|---|---|---|---|---|
| `OD-10-001` | Which runtime hosts support display enumeration/placement, fullscreen targeting, wake lock, and secure kiosk escape? | R1 runs on current and previous stable Edge and Chrome on Windows 11. One display is required; two-display Presenter operation is supported only when the host adapter verifies the capability. Otherwise Story provides explicit manual placement and deliberate windowed fallback. Fullscreen and wake lock are user-initiated best-effort capabilities. Automated secure kiosk is excluded and Kiosk remains Preview. | Runtime Host Engineering, Security, and Accessibility | Before implementing the host adapter, claiming a new browser/OS, or promoting Kiosk beyond Preview | `REQ-10-012`, `REQ-10-013`, `REQ-10-017`, `REQ-10-025`, `REQ-10-026`, `REQ-10-135` through `REQ-10-143`, `REQ-10-176` through `REQ-10-182`; `R1-WF-16` and `R1-WF-20` | `R1-blocking` |
| `OD-10-002` | Can authored revisions enter an active runtime session? | No authored revision enters an R1 session implicitly. The immutable admission snapshot and show plan remain fixed until exit. An authorized **Use latest revision** action ends the current session, reruns full preflight, creates a new admission snapshot, and starts a new session at the nearest valid semantic position only after explicit confirmation; unsafe or unmapped state is reported rather than patched live. | Runtime Architecture and Document Resolution | Before implementing session admission, revision notifications, or any live-reload action | `REQ-10-003`, `REQ-10-020` through `REQ-10-030`, `REQ-10-063`, `REQ-10-064`, `REQ-10-185`, `REQ-10-186`; `R1-WF-20` | `R1-blocking` |
| `OD-10-003` | How are running noninvertible effects interrupted or reversed? | R1 never reverses an effect by inverting renderer state. Navigation commands received during an atomic effect/navigation interval are queued in accepted sequence and are not coalesced. Skip resolves the current effect to its authored semantic end state, and Previous restores the prior semantic checkpoint then deterministically reevaluates. Unsupported custom effects use their declared final-state fallback and never leave a partial visual state. | Motion Runtime and Rendering Engineering | Before implementing navigation during effects or adding a noninvertible/custom effect | `REQ-10-057` through `REQ-10-063`, `REQ-10-070` through `REQ-10-100`; `R1-WF-15` | `R1-blocking` |
| `OD-10-004` | Which caption providers, translation paths, retention rules, and offline behavior are supported? | R1 renders authored media captions and accepted narration/recording caption tracks from local or embedded assets against the semantic clock. No live-caption provider or translation service is enabled; live translation is excluded. Caption text is retained only with the authored/accepted track under file and recording retention policy, and offline playback uses the same embedded track without network fallback. | Accessibility, Media Runtime, Privacy, and Localization | Before integrating a live caption or translation provider or changing caption retention | `REQ-10-022`, `REQ-10-101`, `REQ-10-169` through `REQ-10-175`; `R1-WF-16` | `R1-blocking` |
| `OD-10-005` | Which remote transports, pairing methods, and authority roles are supported beyond a standard clicker? | R1 accepts local keyboard-equivalent next/previous signals from standard clickers through the input adapter. Phone and network remotes, pairing grants, remote presenter roles, and remote authority transfer are disabled and absent from setup. Local presenter and host-managed window roles remain authoritative. | Runtime Input, Identity, and Security | Before enabling any network/phone remote transport or role | `REQ-10-057`, `REQ-10-146` through `REQ-10-158`, `REQ-10-192`; `PROFILE-R1-2026-01` Sections 4.5 and 7 | `non-blocking` |
| `OD-10-006` | Can runtime ink collaborate or save into the presentation during multi-presenter sessions? | R1 ink is transient, slide-scoped session state with clear and slide-scoped undo. It may be captured into the selected recording event track, but save-to-presentation, cross-client synchronization, and multi-presenter ink merging are disabled; ending the session discards uncaptured ink after an explicit private warning. | Runtime Tools, Collaboration, Recording, and Document Architecture | Before implementing ink persistence, collaboration, or any multi-presenter authority model | `REQ-10-039`, `REQ-10-163` through `REQ-10-168`; `PROFILE-R1-2026-01` Sections 4.5 and 7 | `R1-blocking` |
| `OD-10-007` | Which shared-viewing, poll, Q&A, reaction, and moderation services are enabled? | None are enabled in R1. Audience services have no client, transport, identity, retention, or audience-render path in the R1 runtime; core local navigation and recovery operate without network access. Any future service requires its own accepted identity, consent, moderation, latency, retention, isolation, and failure contract before controls appear. | Audience Services, Trust and Safety, Privacy, and Runtime Engineering | First proposal to expose a network audience capability | `REQ-10-197` through `REQ-10-200`; `PROFILE-R1-2026-01` Sections 4.5 and 7 | `non-blocking` |

Each default is implementable without the future ADR, and the core deterministic local runtime remains fully functional when every optional capability is unavailable.