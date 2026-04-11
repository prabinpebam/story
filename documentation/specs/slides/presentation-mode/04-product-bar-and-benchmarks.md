# Product Bar + Benchmarks (World‑Class)

## Goals
- Define what “world‑class Presentation Mode” means in measurable terms.
- Establish parity requirements vs PowerPoint/Keynote/Google Slides.
- Set release gates so performance/reliability never regress.

## Non-goals
- UI design exploration for the editor.
- Implementing non-presenting features (e.g., full collaboration) unless they directly impact presenting.

---

## 1) Competitive Benchmarking
### Requirements
- MUST maintain a “parity mapping table” for benchmark capabilities.
- MUST define which competitor behaviors are matched and which are intentionally different.
- SHOULD keep benchmark expectations in [00-benchmark-gap-checklist.md](00-benchmark-gap-checklist.md) up to date.

### Acceptance criteria
- A single table exists mapping each benchmark capability to a spec + decision.

---

## 2) Quality Bar (KPIs)
### Core KPIs
| Metric | Target | Max Acceptable | Measurement |
|---|---|---|---|
| Enter show (first frame) | <300ms | 800ms | Time from mode dispatch to first stable frame |
| Next/prev latency | <50ms | 150ms | Dispatch to transition start |
| Jump-to-slide latency | <100ms | 200ms | Command to stable frame |
| Grid open latency | <200ms | 500ms | Toggle to interactive |
| Transition smoothness | 0 dropped frames | 2 frames per transition | Frame time histogram |
| Media start latency | <100ms | 300ms | Trigger to playback |
| Memory (100-slide deck) | <500MB | 1GB | Heap snapshot |
| Crash-free sessions | >99.5% | >98% | Telemetry |
| Exit-to-editor time | <200ms | 500ms | Mode exit to interactive |

### Requirements
- MUST instrument all KPIs and emit telemetry.
- MUST define CI regression thresholds (>20% degradation fails build).
- MUST maintain benchmark decks (small: 10 slides, medium: 50 slides, large: 200 slides).

---

## 3) Supported Environments
### Requirements
- MUST document minimum supported browsers and hardware tiers.
- MUST document constraints: fullscreen permissions, autoplay restrictions, multi-display limitations.

---

## 4) Release Gates
### Requirements
- MUST define regression thresholds that block release (performance, crash rate, visual regressions).
- SHOULD maintain benchmark decks (small/medium/large/heavy media) and run them in CI.

---

## Telemetry
- First frame, next/prev, jump-to-slide, grid entry
- Dropped frames proxy (frame time histogram)
- Memory high-water mark
- Cache hit ratio
- Media start and stall events

## Test plan
- Benchmark deck runs on supported browsers
- Throttled CPU/network scenarios
- Long-running stability test (30–60 min loop)

## Edge cases
- External display hotplug
- Browser denies fullscreen
- Autoplay blocked
- Missing fonts/media
