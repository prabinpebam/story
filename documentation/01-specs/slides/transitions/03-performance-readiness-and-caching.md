# Slide Transitions — Performance and Readiness Gating

## 0) Purpose
This document describes how slide transitions avoid showing partially-loaded assets.

Primary implementation references:
- `src/core/presentation/AssetReadiness.js` (`waitForSlideAssetsReady`)
- `src/core/renderer/PresentationRenderer.js` (navigation blocking + bounded wait)

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

## 2) Prefetch (implementation note)
The presentation renderer instantiates a `PresentationPrefetchManager` and exposes it as `window.__presentationPrefetch`.

This document does not specify cache tiering; it focuses on the readiness contract that transitions rely on.

---

## 4) Readiness contract

### 4.1 Readiness probe
`waitForSlideAssetsReady(rootEl)` performs best-effort blocking on:
- Fonts: waits for `document.fonts.ready` when available
- Images: waits for `load`/`error` when needed and calls `img.decode()` when available
- Video: waits for `loadeddata` when `readyState < 2` (first frame)
- Background images: extracts `url(...)` values from `background-image` and preloads/decodes them

Timeouts:
- Per-asset timeout defaults to **8000ms** and can be overridden via options.

Test-only hook:
- `window.__PM_TEST_READY_DELAY_MS` adds a deterministic delay before probing (used by Playwright). It is intentionally not a product feature.

### 4.2 What counts as “visible”
Alignment to current implementation:

The existing readiness probe `waitForSlideAssetsReady(rootEl)` is DOM-based and currently scans:
- all `<img>` descendants
- all `<video>` descendants
- CSS background-image URLs on common layers and the root element

The transition system MUST preserve this behavior so transitions never show half-ready assets.

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
If readiness is slow or never completes:
- The renderer proceeds after a bounded wait (**default 2000ms**) and forces the transition to `none`.
- The incoming slide is marked `slide-view--readiness-fallback`.
- Navigation blocking is bounded by `PresentationRenderer._getReadinessBoundedWaitMs()` and can be overridden via `state.presentation.readinessBoundedWaitMs`.

Note on timeouts:
- The readiness probe itself also applies a per-asset timeout (default **8000ms**). The renderer bounded wait is the stricter limit for navigation blocking.

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
