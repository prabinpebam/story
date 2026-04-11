# Core User Journeys (End‑to‑End)

## Goals
- Define the top journeys Presentation Mode must support without regressions.
- For each journey, declare invariants and acceptance criteria.

## Non-goals
- Exhaustive editor workflows (covered elsewhere).

---

## 1) Start Presentation
### Variants
- Start from beginning
- Start from current slide
- Start from selected slide
- Start from deep link / linked slide target

### Requirements
- MUST support start-from-beginning and start-from-current as distinct entry points.
- MUST start within KPI targets (first frame <300ms).
- MUST preload next/prev for instant navigation.
- MUST apply show settings (fullscreen/windowed, display selection).

### Acceptance criteria
- Entering show always yields a stable first frame (no layout thrash).
- Start-from-beginning resets to slide 1; start-from-current preserves active slide.

---

## Acceptance Criteria (Global)
- Entering presentation never shows editor overlays (selection/handles/guides).
- Exiting returns to the editor in a consistent, non-corrupted state.
- Next/prev remains responsive during transitions and media playback.

---

## 2) Linear Delivery
### Requirements
- MUST treat “Next” as: next build if pending, else next slide.
- MUST keep input responsive even during transitions.
- SHOULD support quick blank screen and resume.

---

## 3) Non-linear Presenting (Q&A)
### Requirements
- MUST support jump-to-slide by number and via grid.
- SHOULD support search by title/section if available.
- MUST handle linked-slide navigation without losing presenter orientation.

---

## 4) Dual-Screen Presenting
### Requirements
- MUST provide a clean audience feed and a separate presenter surface.
- MUST handle display changes (disconnect/reconnect) gracefully.

---

## 5) Kiosk / Autoplay
### Requirements
- MUST support timed advance and looping.
- MUST define interruption policy (user input pauses/resumes timer).
- SHOULD support an “exit guard” policy (e.g., password) if required.

---

## 6) Recovery Journeys
### Scenarios
- Reload tab while presenting
- Device sleep/wake
- Window moved to another display
- Asset temporarily unavailable

### Requirements
- MUST resume to a safe, presentable state.
- MUST not corrupt editor state after exit.

---

## Telemetry
- Journey start/end events
- Time-to-first-frame, time-to-interactive
- Error events: missing assets, fullscreen denied, display changed

## Test plan
- E2E smoke per journey
- Chaos tests: hotplug displays, background/foreground, throttle

## Edge cases
- Starting from a slide with heavy video
- Starting from a linked slide mid-deck
- Mixed-direction navigation with back-stack
