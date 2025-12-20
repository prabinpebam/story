# Observability & Quality Gates

## Goals
- Define telemetry and metrics for monitoring presentation mode.
- Establish quality gates for CI/CD.
- Enable post-mortem analysis for failures.

---

## 1) Key Performance Indicators (KPIs)
### Requirements
- MUST instrument all KPIs defined in [04-product-bar-and-benchmarks.md](04-product-bar-and-benchmarks.md):
  - Time to first frame (<300ms target, <800ms max)
  - Next/prev slide latency (<50ms target, <150ms max)
  - Grid open latency (<200ms target, <500ms max)
  - Memory usage (<500MB target, <1GB max for 100 slides)
- MUST aggregate telemetry (privacy-safe, no PII).
- MUST fail CI builds if KPIs regress beyond max thresholds.

---

## 2) Telemetry Events
### Requirements
- MUST track:
  - Mode entry/exit (fullscreen vs windowed, single vs dual-screen)
  - Navigation patterns (linear vs jump, slide/build distribution)
  - Input method distribution (keyboard vs mouse vs touch)
  - Feature usage (laser, grid, black/white screen)
  - Error events (fullscreen denial, media failures, display disconnects)
  - Performance metrics (FPS, frame time, memory pressure)
- MUST NOT track PII (user identity, deck content, speaker notes).

### Event Schema
```typescript
interface TelemetryEvent {
  type: string;              // Event type
  timestamp: number;         // Unix timestamp
  sessionId: string;         // Anonymous session ID
  data: Record<string, any>; // Event-specific data
}

// Example events
const enterPresentationEvent: TelemetryEvent = {
  type: 'presentation.entered',
  timestamp: Date.now(),
  sessionId: generateSessionId(),
  data: {
    mode: 'viewer',
    fullscreen: true,
    slideCount: 24,
    startFrom: 'current'
  }
};

const navigationEvent: TelemetryEvent = {
  type: 'presentation.navigate',
  timestamp: Date.now(),
  sessionId: getCurrentSessionId(),
  data: {
    from: { slideIndex: 4, buildIndex: 2 },
    to: { slideIndex: 5, buildIndex: 0 },
    method: 'keyboard', // 'keyboard' | 'mouse' | 'touch' | 'grid' | 'jump'
    latencyMs: 42
  }
};

const errorEvent: TelemetryEvent = {
  type: 'presentation.error',
  timestamp: Date.now(),
  sessionId: getCurrentSessionId(),
  data: {
    errorType: 'media.load_failed',
    slideIndex: 7,
    details: 'Video codec not supported'
  }
};
```

---

## 3) Quality Gates
### Requirements
- MUST define regression thresholds:
  - First frame: >800ms = FAIL
  - Next/prev: >150ms = FAIL
  - Memory (100 slides): >1GB = FAIL
- MUST run performance benchmarks in CI (10/50/100 slide decks).
- SHOULD provide performance HUD in presenter view (live diagnostics).

---

## 4) Crash Reporting
### Requirements
- MUST capture stack traces for unhandled errors.
- MUST include context (slide index, mode, feature state).
- MUST sanitize stack traces (remove deck content, notes).

---

## Telemetry
- All metrics defined in section 2.

## Test plan
- Telemetry emission verification (all events fire correctly).
- Privacy audit (no PII in telemetry payloads).
- Quality gate regression tests (intentionally exceed thresholds, verify CI fails).

## Edge cases
- Telemetry failure (network down, storage quota exceeded).
- Malformed telemetry payloads (sanitizer handling).
