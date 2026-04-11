# Presentation Mode — Guiding Principles

These principles define the philosophy and quality bar for Presentation Mode in Story. Every detailed requirement and implementation decision should trace back to one or more of these.

---

## P1) The Presenter’s Trust Is Sacred
- Presentation Mode must never do anything that surprises, embarrasses, or undermines the presenter.
- When tradeoffs exist, prefer predictable behavior over clever behavior.

**Implications**
- Avoid accidental navigation (e.g., scroll wheel defaults to no-op).
- Any failure state must be audience-safe by default.

---

## P2) “Next” Is Instant, Always
- Advancing to the next build/slide is the core interaction; it must feel immediate.

**Non-negotiables**
- Input latency stays low even during heavy transitions.
- Next/prev are pre-rendered/pre-warmed; no blocking on network.

---

## P3) Audience Feed Stays Clean
- The audience view is a pristine output channel.
- Controls, errors, and diagnostics must not leak into the audience feed.

**Implications**
- Presenter tools and debug overlays are presenter-only.
- “Missing asset” UX is shown to presenter first, with safe fallback for audience.

---

## P4) Presenter Tools Are Powerful, Not Distracting
- Presenter View must increase confidence without cognitive load.
- The default layout should require zero setup and work on day one.

**Implications**
- Tools are discoverable, keyboard accessible, and resilient to display changes.

---

## P5) Deterministic Playback Under Identical Inputs
- Given the same deck and the same sequence of inputs, playback should behave consistently.

**Why it matters**
- Enables reliable recording, rehearsal timing, debugging, and automated testing.

---

## P6) Safety Over Completeness
- If a feature cannot meet the presentation bar (latency, stability, privacy), it is better to degrade gracefully than ship half-working.

**Implications**
- Prefer disable-with-explanation over broken behavior.
- Provide an escape hatch (exit show) that is always responsive.

---

## P7) Seamless Mode Boundary
- Entering/exiting Presentation Mode must be fast and must restore the editor exactly.

**Implications**
- Presentation runtime is isolated from editor interaction layers.
- No “ghost state” (selection boxes, guides, pointer artifacts) after exit.

---

## P8) Hardware and Environment Reality
- Presentations happen on projectors, TVs, poor Wi‑Fi, and under CPU/GPU constraints.

**Implications**
- Support safe areas/overscan.
- Be robust to font loading issues and media autoplay restrictions.

---

## P9) Progressive Enhancement, Graceful Degradation
- Use best-available APIs (Fullscreen, multi-window sync) but don’t collapse when they’re unavailable.

**Implications**
- Fullscreen denied → windowed present.
- Second screen missing → viewer mode + optional presenter tools.

---

## P10) Accessibility Is First-Class
- Presentation Mode must be operable and understandable with keyboard-only usage and assistive tech, and it must respect reduced-motion preferences.

**Implications**
- Every control has a keyboard path.
- Reduced motion affects transitions/animations without breaking narrative structure.

---

## P11) Observability Is Part of the Product
- Performance and reliability are features; measure them continuously.

**Implications**
- Ship with metrics for first-frame, next/prev latency, dropped frames, memory, media start.
- Build developer-only overlays and repeatable benchmark decks.

---

## P12) Compatibility Without Surprises
- Presentations must play sensibly across versions and environments.

**Implications**
- Clear fallback behavior for unsupported transitions/effects.
- Strict privacy boundaries (notes never leak to audience).

---

## P13) Design Token Discipline
- All presentation runtime UI (HUD, overlays, pointers) MUST use design tokens to ensure theme consistency and accessibility.
- Hardcoded colors and styles are forbidden in production presentation surfaces.

**Implications**
- Presentation chrome can adapt to light/dark themes.
- Visual consistency with the rest of Story's UI.
- Accessibility requirements (contrast, reduced motion) are enforceable via tokens.

---

## P14) Continuous Performance Verification
- Performance is not "done once"; every release MUST verify the P2 bar via automated benchmarks.
- Metrics are not optional; they are part of the product.

**Implications**
- CI gates prevent performance regressions.
- Telemetry provides real-world validation of KPIs.
