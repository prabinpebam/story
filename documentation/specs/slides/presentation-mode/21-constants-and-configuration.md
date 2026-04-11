# Presentation Mode Constants & Configuration

## Goals
- Define all constants, magic numbers, and configuration defaults in one place.
- Provide single source of truth for timing values, thresholds, and limits.

---

## 1) Timing Constants

```typescript
// Navigation & Input
export const INPUT_THROTTLE_MS = 100;           // Min time between navigation events
export const NUMERIC_ENTRY_TIMEOUT_MS = 3000;   // Auto-commit/clear jump-to buffer

// HUD
export const HUD_AUTO_HIDE_DELAY_MS = 3000;     // Auto-hide HUD after inactivity
export const HUD_FADE_DURATION_MS = 200;        // HUD fade animation duration

// Cursor
export const CURSOR_HIDE_DELAY_MS = 5000;       // Hide cursor after inactivity

// Laser Pointer
export const LASER_TRAIL_LIFETIME_MS = 500;     // Laser trail fade duration
export const LASER_TRAIL_MAX_LENGTH = 50;       // Max points in laser trail

// Transitions
export const DEFAULT_TRANSITION_DURATION_MS = 300;  // Default slide transition duration
export const DEFAULT_BUILD_DURATION_MS = 300;       // Default build animation duration

// Cache & Prefetch
export const CACHE_PREFETCH_IDLE_DELAY_MS = 100;    // Wait before starting prefetch after navigation
export const ASSET_LOAD_TIMEOUT_MS = 10000;         // Max time to wait for asset load before error

// Performance
export const FRAME_TIME_TARGET_MS = 16.67;      // 60 FPS target (1000/60)
export const PERFORMANCE_SAMPLE_INTERVAL_MS = 1000; // How often to sample FPS/memory
```

---

## 2) Size & Layout Constants

```typescript
// Grid Navigator
export const GRID_THUMB_TARGET_WIDTH = 180;     // Target thumbnail width (px)
export const GRID_THUMB_ASPECT = 16 / 9;        // Thumbnail aspect ratio
export const GRID_GAP = 20;                     // Gap between thumbnails (px)

// Scaling
export const SCALE_PRECISION_DECIMALS = 3;      // Decimal precision for scale factor
export const MIN_SCALE = 0.1;                   // Minimum scale factor
export const MAX_SCALE = 10.0;                  // Maximum scale factor

// Touch Gestures
export const SWIPE_MIN_DISTANCE = 50;           // Min swipe distance (px)
export const SWIPE_MAX_DURATION = 500;          // Max swipe duration (ms)
export const SWIPE_MAX_VERTICAL_DEVIATION = 30; // Max vertical deviation for horizontal swipe (px)
```

---

## 3) Cache & Memory Constants

```typescript
// Cache Tiers
export const HOT_TIER_WINDOW = 1;               // ±1 slides (prev/next)
export const WARM_TIER_WINDOW = 3;              // ±3 slides

// Memory Management
export const MEMORY_BUDGET_TARGET_MB = 500;     // Target memory for 100-slide deck
export const MEMORY_BUDGET_MAX_MB = 1024;       // Max memory for 100-slide deck
export const MEMORY_PRESSURE_THRESHOLD = 0.8;   // Evict when > 80% of budget

// Back-Stack
export const BACK_STACK_MAX_DEPTH = 10;         // Max navigation history entries
```

---

## 4) Performance KPI Thresholds

```typescript
// From 04-product-bar-and-benchmarks.md
export const KPI_FIRST_FRAME_TARGET_MS = 300;
export const KPI_FIRST_FRAME_MAX_MS = 800;

export const KPI_NEXT_PREV_TARGET_MS = 50;
export const KPI_NEXT_PREV_MAX_MS = 150;

export const KPI_GRID_OPEN_TARGET_MS = 200;
export const KPI_GRID_OPEN_MAX_MS = 500;

export const KPI_BUILD_EXECUTE_TARGET_MS = 16;
export const KPI_BUILD_EXECUTE_MAX_MS = 50;

export const KPI_TRANSITION_TARGET_MS = 300;
export const KPI_TRANSITION_MAX_MS = 600;
```

---

## 5) Z-Index Layer Constants

```typescript
export const Z_INDEX_STAGE = 0;                 // Stage background (letterbox)
export const Z_INDEX_SLIDE = 10;                // Slide content
export const Z_INDEX_OVERLAY = 100;             // Black/white screen
export const Z_INDEX_GRID = 200;                // Grid navigator
export const Z_INDEX_LASER = 300;               // Laser pointer canvas
export const Z_INDEX_HUD = 400;                 // HUD controls
export const Z_INDEX_MODAL = 500;               // Error modals, dialogs
```

---

## 6) Default Configurations

```typescript
// Kiosk Mode Defaults
export const DEFAULT_KIOSK_CONFIG: KioskConfig = {
  autoAdvanceSeconds: 5,
  loop: true,
  password: undefined,
  disableInput: false
};

// Click-to-Advance Defaults
export const DEFAULT_CLICK_ADVANCE_CONFIG: ClickAdvanceConfig = {
  enabled: true,
  action: 'next-build',
  excludeRegions: ['.hud', 'a[href]', 'button', 'input', 'video', 'audio']
};

// Transition Defaults
export const DEFAULT_TRANSITION_CONFIG: TransitionConfig = {
  type: TransitionType.FADE,
  duration: 300,
  easing: 'ease-in-out'
};

// Video Defaults
export const DEFAULT_VIDEO_CONFIG: VideoConfig = {
  autoplay: false,
  loop: false,
  muted: false,
  controls: true,
  preload: 'metadata'
};

// Swipe Gesture Defaults
export const DEFAULT_SWIPE_CONFIG: SwipeConfig = {
  minDistance: 50,
  maxDuration: 500,
  maxVerticalDeviation: 30
};
```

---

## 7) Validation Rules

```typescript
// Slide Index Validation
export function validateSlideIndex(index: number, total: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < total;
}

// Build Index Validation
export function validateBuildIndex(index: number, count: number): boolean {
  return Number.isInteger(index) && index >= -1 && index < count;
}

// Slide Number Validation (1-based user input)
export function validateSlideNumber(num: number, total: number): boolean {
  return Number.isInteger(num) && num >= 1 && num <= total;
}

// Scale Factor Validation
export function validateScaleFactor(scale: number): boolean {
  return typeof scale === 'number' && 
         scale >= MIN_SCALE && 
         scale <= MAX_SCALE &&
         !isNaN(scale) &&
         isFinite(scale);
}

// Timing Validation
export function validateDuration(ms: number): boolean {
  return typeof ms === 'number' && ms >= 0 && ms <= 10000 && isFinite(ms);
}
```

---

## 8) Error Codes

```typescript
export enum PresentationErrorCode {
  // Entry errors
  DECK_EMPTY = 'DECK_EMPTY',
  DECK_INVALID = 'DECK_INVALID',
  
  // Fullscreen errors
  FULLSCREEN_DENIED = 'FULLSCREEN_DENIED',
  FULLSCREEN_API_UNAVAILABLE = 'FULLSCREEN_API_UNAVAILABLE',
  
  // Navigation errors
  INVALID_SLIDE_INDEX = 'INVALID_SLIDE_INDEX',
  INVALID_BUILD_INDEX = 'INVALID_BUILD_INDEX',
  NAVIGATION_BLOCKED = 'NAVIGATION_BLOCKED',
  
  // Asset errors
  ASSET_LOAD_FAILED = 'ASSET_LOAD_FAILED',
  ASSET_DECODE_FAILED = 'ASSET_DECODE_FAILED',
  MEDIA_LOAD_FAILED = 'MEDIA_LOAD_FAILED',
  MEDIA_PLAYBACK_FAILED = 'MEDIA_PLAYBACK_FAILED',
  
  // Cache errors
  CACHE_INIT_FAILED = 'CACHE_INIT_FAILED',
  CACHE_EVICTION_FAILED = 'CACHE_EVICTION_FAILED',
  PREFETCH_FAILED = 'PREFETCH_FAILED',
  
  // Presenter view errors
  POPUP_BLOCKED = 'POPUP_BLOCKED',
  SYNC_FAILED = 'SYNC_FAILED',
  
  // System errors
  MEMORY_PRESSURE = 'MEMORY_PRESSURE',
  DISPLAY_DISCONNECTED = 'DISPLAY_DISCONNECTED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}
```

---

## 9) Feature Flags

```typescript
// Enable/disable features for progressive rollout
export const FEATURE_FLAGS = {
  PRESENTER_VIEW: true,              // Dual-screen presenter view
  KIOSK_MODE: true,                  // Auto-advance kiosk mode
  JUMP_BY_NUMBER: true,              // Jump-to-slide numeric entry
  BACK_STACK: true,                  // Navigation back-stack
  HIDDEN_SLIDES: true,               // Hidden slide support
  GRID_SEARCH: false,                // Search in grid navigator (future)
  SECTIONS: false,                   // Slide sections (future)
  PEN_HIGHLIGHTER: false,            // Annotation tools beyond laser (future)
  CUSTOM_SHOWS: false,               // Playlist/custom show support (future)
  SLIDE_TIMINGS: false,              // Per-slide timing metadata (future)
};
```
