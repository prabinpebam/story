# Slide Transitions — Performance, Readiness Gating, and Caching (Phase 1)

## 0) Purpose
This document binds Slide Transitions to Presentation Mode performance and caching rules.

It is normative.

Primary reference: `documentation/01-specs/slides/presentation-mode/02-performance-and-caching.md`

---

## 1) Hard requirements (non-negotiable)

### 1.1 Decode-first transitions
Transitions MUST NOT begin until the incoming slide is fully ready:
- Images decoded at full resolution (no progressive decode artifacts)
- Video first frame decoded (no black frame)
- Fonts loaded and applied (no font-swap flash)

### 1.2 Audience must never see loading UI
If readiness is delayed:
- the system MAY show a loading indicator to the presenter-only surface
- the system MUST NOT show a loading indicator in the audience surface

### 1.3 Navigation gating
- If user requests Next/Prev and the incoming slide is not ready, navigation MUST block until ready.
- Blocking MUST be bounded by error handling; if readiness fails due to permanent error, fallback behavior MUST occur (see Section 6).

Principles alignment:
- Readiness gating MUST be implemented as a single shared utility (no duplicated per-transition readiness code).
- Readiness gating MUST be compatible with performance targets (avoid layout thrashing).

---

## 2) Cache tiers (Phase 1 alignment)
The transition system MUST cooperate with the Presentation Mode cache tiers:

- ACTIVE: current slide
- HOT (±1): immediate neighbors
- WARM (±3): prefetch window
- COLD: everything else

For transitions:
- Navigation to HOT tier slides MUST be instant *after readiness gating*.
- HOT tier MUST be “fully load + fully decode + render-ready”.

---

## 3) Prefetch strategy integration

### 3.1 Prefetch on enter
On entering Presentation Mode:
- MUST preload HOT tier (±1)
- SHOULD begin WARM tier prefetch in idle cycles

### 3.2 Deprioritize prefetch during navigation
During active navigation:
- MUST deprioritize background prefetch to avoid jank.

---

## 4) Readiness contract

### 4.1 Readiness probe
The readiness probe MUST validate:
- `document.fonts.ready` (or equivalent) has resolved for the slide’s required fonts
- all images visible on the incoming slide are decoded (`Image.decode()` or equivalent)
- videos have `readyState` sufficient for first-frame presentation (or equivalent signal)

### 4.2 What counts as “visible”
Alignment to current implementation:

The existing readiness probe `waitForSlideAssetsReady(rootEl)` is DOM-based and currently scans:
- all `<img>` descendants
- all `<video>` descendants
- CSS background-image URLs on common layers and the root element

Phase 1 MUST preserve this behavior so transitions never show half-ready assets.

Performance note:
- If future optimization is desired (e.g., excluding assets hidden for builds), it MUST not reduce correctness and MUST be proven by tests (no regressions where a build asset becomes visible immediately after transition).

---

## 5) Timing budgets
Transitions MUST not cause performance regressions:
- First frame after transition completes MUST present within the overall Presentation Mode performance bar.
- The transition animation itself MUST maintain 60fps under normal conditions.

---

## 6) Failure modes

### 6.1 Asset readiness fails
If readiness cannot be achieved due to a permanent failure (corrupt media, missing font):
- The system MUST proceed with navigation after a bounded wait (configurable; default 2000ms).
- The bounded wait MUST be implemented without blocking the UI thread.
- The transition MUST fall back to `none` for that navigation event.
- The audience view MUST render a safe placeholder (no crash, no broken DOM).
- A presenter-only error indicator MAY appear.

Implementation alignment:
- The readiness probe already applies a per-asset timeout (default 8000ms). Phase 1 MUST define which timeout governs the bounded-wait behavior to avoid double timeouts.

### 6.2 Animation engine missing
If the animation engine (e.g., Anime.js) is not available:
- The transition MUST fall back to `none`.
- Readiness gating MUST still be enforced.

---

## 7) Telemetry requirements
The following telemetry events MUST exist for quality gates:
- `transition_blocked_for_readiness` (duration bucket, transition type, direction)
- `transition_ready_latency` (time from nav request to readiness)
- `transition_animation_duration` (requested vs actual)
- `transition_fallback_to_none` (reason)

No slide content or PII is allowed.

## 8) Security & privacy constraints
- Readiness code MUST NOT leak URLs or asset identifiers into telemetry.
- Test-only hooks (e.g., deterministic readiness delays) MUST remain explicitly test-only and MUST NOT be documented as a user feature.

## 9) Performance constraints
- Transition animations MUST be GPU-friendly (transform/opacity/clip-path) and MUST not animate layout properties.
- Readiness probing MUST avoid repeated `getComputedStyle` calls in tight loops during navigation; any expensive scanning SHOULD be bounded and amortized.
