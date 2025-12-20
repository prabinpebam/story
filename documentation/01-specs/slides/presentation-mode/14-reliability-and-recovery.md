# Reliability & Recovery

## Goals
- Ensure graceful degradation.
- Provide fail-safe recovery paths.

---

## 1) Failure Modes
### Requirements
- MUST handle fullscreen denial gracefully (continue in window).
- MUST handle display disconnection without losing state.
- MUST handle media load failures without blocking navigation.
- SHOULD provide recovery UI for stuck states.

### Error Classification
```typescript
enum ErrorSeverity {
  INFO = 'info',           // Non-blocking, informational
  WARNING = 'warning',     // Degraded experience, but functional
  ERROR = 'error',         // Feature broken, but presentation continues
  CRITICAL = 'critical'    // Presentation cannot continue
}

interface PresentationError {
  severity: ErrorSeverity;
  code: string;
  message: string;
  slideIndex?: number;
  presenterOnly: boolean;  // Show to presenter only, not audience
  recoveryAction?: () => void;
}

// Example errors
const errors = {
  FULLSCREEN_DENIED: {
    severity: ErrorSeverity.INFO,
    code: 'FULLSCREEN_DENIED',
    message: 'Fullscreen denied. Continuing in windowed mode.',
    presenterOnly: true
  },
  
  MEDIA_LOAD_FAILED: {
    severity: ErrorSeverity.WARNING,
    code: 'MEDIA_LOAD_FAILED',
    message: 'Video failed to load. Showing placeholder.',
    presenterOnly: true,
    recoveryAction: () => retryMediaLoad()
  },
  
  CACHE_INIT_FAILED: {
    severity: ErrorSeverity.ERROR,
    code: 'CACHE_INIT_FAILED',
    message: 'Cache initialization failed. Prefetch disabled.',
    presenterOnly: true
  },
  
  DECK_EMPTY: {
    severity: ErrorSeverity.CRITICAL,
    code: 'DECK_EMPTY',
    message: 'Cannot enter presentation: deck has no slides.',
    presenterOnly: false // Block entry for everyone
  }
};
```

---

## 2) State Persistence
### Requirements
- MUST preserve slide/build position across accidental exit/re-entry.
- SHOULD warn before closing browser tab during active show.

---

## 3) Diagnostic Reporting
### Requirements
- MUST provide debug telemetry for post-mortem analysis.
- SHOULD provide presenter-only visual diagnostics (performance HUD).
- MUST never leak diagnostics to audience feed.

---

## Telemetry
- Failure events (fullscreen denial, media errors, etc.)
- Recovery action success rate

## Test plan
- Fullscreen denial simulation
- Display hotplug/disconnect
- Media load failure injection
- Network throttle + offline

## Edge cases
- Sleep/wake during show
- Background/foreground transitions
- Browser extension conflicts
