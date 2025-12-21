# Slide Transitions — Current Implementation (No Morph)

This document records the **current** slide transition implementation.

Morph / Smart Animate is intentionally not implemented as a slide transition.

## 1) Goals
- Provide a **fully specified** slide transition system.
- Ensure transitions are **inheritably configured** via the existing slide style cascade model (Master preset → Layout master → Slide override).
- Ensure transitions are **deterministic, testable, and performance-safe**:
  - never show half-loaded media
  - never show audience-only loading UI
  - honor reduced-motion preferences

Additionally (app principles alignment):
- MUST reuse existing design system components and CSS variables.
- MUST avoid introducing new inline-style-heavy UI patterns (prefer existing classes + CSS variables).
- MUST be compatible with undo/redo.
- MUST be compatible with file storage/serialization and realtime collaboration.

## 2) Non-goals
- Morph / smart-animate / object matching.
- Per-element animation authoring.
- Transition audio, sound effects.
- Multi-slide timeline.

## 3) Definitions
- **Transition**: an animation shown when moving from one slide to the next.
- **Outgoing slide**: the slide currently visible before navigation.
- **Incoming slide**: the slide being navigated to.
- **Effective transition**: the transition computed after resolving inheritance.

## 4) Normative references
- Presentation Mode gate + ledger discipline: `documentation/01-specs/slides/presentation-mode/23-ledger-and-gate-plan.md`
- Presentation Mode caching/readiness: `documentation/01-specs/slides/presentation-mode/02-performance-and-caching.md`
- Playback baseline rules: `documentation/01-specs/slides/presentation-mode/10-playback-system.md`
- Inheritance model template: `documentation/01-specs/slides/themes/color-themes-spec.md`
- Property Inspector slide/flyout ARIA patterns: `documentation/01-specs/ui-system/property-inspector-v2/10-slide-section.md`
- App principles: `documentation/00-product/principles.md`

## 5) Supported transition types

### 5.1 Canonical type IDs
The transition system MUST use **canonical type IDs** (string literals) as follows:

- `none` — instant cut
- `crossFade` — cross fade (opacity)
- `wipe` — directional wipe reveal
- `push` — directional push (both slides move)
- `cover` — directional cover (incoming slides over outgoing)
- `uncover` — directional uncover (outgoing moves away revealing incoming)

### 5.2 Parameters (common)
All supported transitions share a common config shape.

```ts
type SlideTransitionType =
  | 'none'
  | 'crossFade'
  | 'wipe'
  | 'push'
  | 'cover'
  | 'uncover';

type SlideTransitionDirection4 = 'left' | 'right' | 'up' | 'down';

// Wipe supports diagonals.
type SlideTransitionDirection8 =
  | SlideTransitionDirection4
  | 'upLeft'
  | 'upRight'
  | 'downLeft'
  | 'downRight';

interface SlideTransitionConfig {
  type: SlideTransitionType;

  // Duration in milliseconds.
  // MUST clamp to [0, 5000] at read time.
  durationMs: number;

  // Direction MUST be present for directional transitions and MUST be absent for non-directional.
  // - wipe: direction8
  // - push/cover/uncover: direction4
  direction?: SlideTransitionDirection4 | SlideTransitionDirection8;

  // Optional easing; if omitted, use default.
  // MUST accept CSS easing string.
  easing?: string;
}
```

### 5.3 Default config
- The **system default** transition MUST be:
  - `type: 'crossFade'`
  - `durationMs: 300`
  - `easing: 'ease-in-out'`
- If a slide resolves to no transition config through inheritance, the system MUST use the system default.
- If `prefers-reduced-motion: reduce` is active, the system MUST force `type: 'none'` regardless of config.

### 5.4 Runtime integration contract (alignment to current app)
The current Presentation playback pipeline invokes transitions from `PresentationRenderer` via `animationManager.transition(...)`.

The runtime MUST standardize a single API surface so duration/direction can be honored:

- `AnimationManager.transition(container, outgoingEl, incomingEl, transition)` MUST accept:
  - either a legacy string (back-compat), or
  - a `SlideTransitionConfig` object.

Back-compat rules:
- If a legacy string is provided (e.g. `'fade'|'push'|'slide'|'none'|'magic'`), the implementation MUST map it to a `SlideTransitionConfig` or fall back safely.
- `'magic'` MUST NOT silently behave as Morph. It MUST fall back (see Section 12).

Implementation note (principles: avoid local one-offs):
- The mapping MUST be centralized (single function/module) so UI, renderer, and tests share the same semantics.

## 6) Direction semantics (normative)
Direction semantics in the current implementation are:

- `push`, `cover`
  - `direction` describes where the **incoming** slide starts.
  - Example: `push` + `direction: 'right'` → incoming starts offscreen to the **right** and moves into place.

- `uncover`
  - `direction` describes where the **outgoing** slide moves to.
  - Example: `uncover` + `direction: 'right'` → outgoing moves offscreen to the **right**, revealing the incoming slide below.

- `wipe`
  - `direction` describes the direction the reveal grows **toward**.
  - Example: `wipe` + `direction: 'right'` → reveal grows from the **left edge** toward the right (the clip expands rightward).
  - Diagonal directions expand from the opposite corner toward the named corner.

## 7) Visual stacking rules (normative)

### 7.1 General
- During an animated transition, both outgoing and incoming slides MUST be present in the DOM simultaneously.
- The incoming slide MUST already be fully rendered and asset-ready before the transition begins (see readiness gating).
- Slides MUST be positioned so that animation does not reflow the document.

Performance constraint:
- Animations MUST use compositor-friendly properties only (translate/opacity/clip-path) and MUST NOT animate layout-affecting properties (top/left/width/height).
- Any per-transition dynamic values (duration, easing) SHOULD be expressed via CSS variables instead of repeated inline styles.

### 7.2 Per-type stacking order
- `crossFade`
  - outgoing below incoming (incoming on top)
  - only opacity changes

- `wipe`
  - outgoing below
  - incoming on top but **clipped** (reveal region expands)

- `push`
  - outgoing and incoming both move
  - incoming above outgoing (z ordering doesn’t matter visually if fully opaque)

- `cover`
  - incoming MUST be above outgoing
  - outgoing MAY remain stationary

- `uncover`
  - outgoing MUST be above incoming
  - incoming remains stationary (revealed as outgoing moves away)

## 8) Readiness gating (hard requirement)
Transitions do not begin until the incoming slide is ready:
- fonts ready (`document.fonts.ready` when available)
- `<img>` loaded and decoded when possible (`img.decode()` when available)
- `<video>` has first-frame data (`loadeddata` / `readyState >= 2`)
- common `background-image: url(...)` assets are decoded via `Image()` preloads

Implementation references:
- `src/core/presentation/AssetReadiness.js` (`waitForSlideAssetsReady(rootEl)`)
- `src/core/renderer/PresentationRenderer.js` (navigation blocking + bounded wait)

Bounded wait behavior:
- Navigation blocks for readiness, but only up to a renderer-level bounded wait.
- Default bounded wait: **2000ms**
- Override: `state.presentation.readinessBoundedWaitMs` (must be finite and > 0)

If the bounded wait times out:
- telemetry emits `transition_fallback_to_none` with reason `readiness-timeout`
- the incoming slide is marked with `slide-view--readiness-fallback`
- the transition is forced to `none` (`durationMs: 0`, `easing: 'linear'`)

Audience cleanliness:
- The renderer does not show a loading indicator to the audience surface.

## 9) Transition execution lifecycle (normative)

### 9.1 State machine
The transition system MUST expose a minimal lifecycle:
- `idle`
- `loading` (incoming being prepared)
- `transitioning`

The playback surface MUST surface this lifecycle on the root container via attributes so Playwright can assert:
- `data-pm-transition-status="loading|transitioning|idle"`
- `data-pm-transition-target="<slideId>"` (when non-idle)

### 9.2 DOM contract
During `transitioning`:
- outgoing slide DOM element MUST be present and stable
- incoming slide DOM element MUST be present and stable
- both MUST share a common container coordinate space

After completion:
- outgoing slide element MUST be removed (or fully hidden and detached without leaving interactive remnants)
- incoming slide MUST become the only active slide

Security constraint:
- Outgoing slide MUST not retain interactive focusable elements that remain tabbable after removal (no focus leaks).

Visual stability constraint (regression-protected):
- The outgoing slide must not disappear early in a way that briefly exposes the stage background.
- The incoming slide is kept hidden until its start state is applied (to avoid a white flash).

### 9.3 Cancellation / re-entrancy
If navigation happens again while `loading` or `transitioning`:
- the system MUST queue the newest target and transition to it after the current transition completes (no partial mid-flight jumps)
- the system MUST NOT leak DOM nodes from abandoned intermediate targets

## 10) Type-specific animation definitions

### 10.1 Cross fade (`crossFade`)
- Incoming opacity animates from 0 → 1.
- Outgoing opacity MAY remain 1 (since incoming overlays), or MAY animate 1 → 0.
- If both are animated, the sum of opacities MUST NOT exceed 1.2 in a way that causes unacceptable brightness pumping.

### 10.2 Wipe (`wipe`)
- Incoming slide is revealed by expanding a clipping region.
- Implementation MUST use `clip-path` (preferred) or an equivalent masking strategy.
- Wipe directions:
  - 4 edges: `left`, `right`, `up`, `down`
  - 4 corners: `upLeft`, `upRight`, `downLeft`, `downRight`

### 10.3 Push (`push`)
- Both slides translate.
- Outgoing moves out of frame opposite to incoming.
- Incoming starts fully offscreen and ends at 0.

### 10.4 Cover (`cover`)
- Incoming translates from offscreen into place.
- Outgoing remains stationary.
- Incoming covers outgoing.

### 10.5 Uncover (`uncover`)
- Incoming remains stationary.
- Outgoing translates out of frame, revealing incoming beneath.

## 11) Accessibility, reduced motion, and user settings
- Reduced motion MUST force `type: 'none'`.
- The transition system MUST NOT interfere with keyboard focus:
  - focus MUST remain logically within the presentation chrome (HUD) or within the slide content as designed
  - no focus traps
- Transitions MUST NOT rely on color for meaning.

Design system alignment:
- Any UI that configures transitions MUST use existing PI components and tokens (no hardcoded colors; no new shadows/fonts).

## 12) Error handling and fallbacks
- If the animation engine is unavailable or fails:
  - MUST fall back to `none` for that navigation event
  - MUST still perform readiness gating
- Unsupported transition types MUST fall back to `none`.

Security + stability:
- Errors MUST be logged without including slide content or speaker notes.
- Fallback decisions MUST emit telemetry using privacy-safe payloads only.

## 13) Telemetry (required for quality gates)
At minimum, transitions MUST emit privacy-safe telemetry:
- `transition_requested`
- `transition_blocked_for_readiness` (with blocking duration bucketed)
- `transition_started`
- `transition_completed`
- `transition_fallback_to_none` (reason: reduced-motion | unsupported | animation-engine-missing | error)

Payload MUST NOT include slide content, notes, or PII.

## 14) Easing mapping
`SlideTransitionConfig.easing` is stored as a CSS-like string, and is mapped to the animation engine easing:
- `linear` → `linear`
- `ease-in` → `easeInQuad`
- `ease-out` → `easeOutQuad`
- `ease-in-out` (and any unknown value) → `easeInOutQuad`

## 15) Undo/redo, serialization, and collaboration
Transitions are user-authored slide/master properties and MUST therefore:
- be undoable (each change is a store action recorded by undo/redo)
- serialize into the presentation document format without loss
- round-trip correctly through realtime collaboration sync (no non-deterministic defaults)

Canonicalization:
- When reading stored configs, the runtime MUST clamp and normalize values (duration bounds, direction validity) so that corrupted/old documents cannot crash playback.

## 16) Acceptance criteria
- Transitions never produce a “blank stage” frame during navigation.
- No transition begins until incoming slide readiness gating completes (or bounded wait forces fallback).
- Reduced motion forces `none`.
- Transition configuration is normalized and safe against invalid/legacy input.

See `04-testing-and-verification.md` for the verification matrix.
