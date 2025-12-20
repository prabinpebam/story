# Implementation Boundaries & Extensibility

## Goals
- Define architectural boundaries for presentation mode.
- Enable future extensibility without breaking existing features.
- Establish plugin/extension points.

---

## 1) Architectural Layers

### 1.1 Presentation Manager (Core)
- **Responsibility**: Mode lifecycle, state management, entry/exit.
- **Exports**: 
  - `enterPresentation(options: PresentationOptions): Promise<void>`
  - `exitPresentation(): Promise<void>`
  - `getState(): PresentationState`
  - `updateState(partial: Partial<PresentationState>): void`
- **State Schema**:
```typescript
interface PresentationState {
  mode: 'viewer' | 'windowed' | 'presenter' | 'kiosk' | 'reading';
  slideIndex: number;          // 0-based
  buildIndex: number;          // -1 = pre-build (no builds executed yet), 0..N-1 = executed build index
  buildCount: number;          // Total builds on current slide
  fullscreen: boolean;
  isActive: boolean;           // Is presentation mode active
  features: {
    laser: boolean;            // Laser pointer active
    grid: boolean;             // Grid navigator visible
    blackScreen: boolean;      // Black screen overlay
    whiteScreen: boolean;      // White screen overlay
  };
  editorState: {               // State to restore on exit
    activeSlideIndex: number;
    zoomLevel: number;
    scrollPosition: { x: number; y: number };
  };
}

interface PresentationOptions {
  mode?: 'viewer' | 'windowed' | 'presenter' | 'kiosk';
  startFrom?: 'beginning' | 'current' | number; // slide index
  fullscreen?: boolean;        // Default: true for viewer mode
  display?: number;            // Display index for multi-monitor
}
```

### 1.2 Renderer
- **Responsibility**: Slide rendering, scaling, layering.
- **Exports**: 
  - `renderSlide(index: number): Promise<HTMLElement>`
  - `applyScaling(viewport: ViewportDimensions): void`
  - `showOverlay(type: OverlayType): void`
  - `hideOverlay(type: OverlayType): void`
- **Dependencies**: Cache Manager, Design System Tokens.
- **API Schema**:
```typescript
enum OverlayType {
  BLACK_SCREEN = 'black',
  WHITE_SCREEN = 'white',
  GRID = 'grid',
  LASER = 'laser'
}

interface ViewportDimensions {
  width: number;
  height: number;
}
```
- **Layering (z-index)**:
  - Stage background: `z-index: 0`
  - Slide content: `z-index: 10`
  - Black/White overlay: `z-index: 100`
  - Grid overlay: `z-index: 200`
  - Laser canvas: `z-index: 300`
  - HUD: `z-index: 400`

### 1.3 Cache Manager
- **Responsibility**: Cache tier management, prefetch, eviction.
- **Exports**: 
  - `preload(slideIndex: number, tier: CacheTier): Promise<void>`
  - `evict(tier: CacheTier): void`
  - `getCacheStatus(): CacheStatus`
  - `isSlideReady(slideIndex: number): boolean`
- **Tiers**: ACTIVE, HOT, WARM, COLD.
- **API Schema**:
```typescript
enum CacheTier {
  ACTIVE = 'active',  // Current slide
  HOT = 'hot',        // ±1 slides
  WARM = 'warm',      // ±3 slides
  COLD = 'cold'       // Rest
}

interface CacheStatus {
  active: number[];     // Slide indices
  hot: number[];        
  warm: number[];       
  memoryUsageMB: number;
  prefetchInProgress: boolean;
}

interface CacheEntry {
  slideIndex: number;
  tier: CacheTier;
  assetsLoaded: boolean;
  imagesDecoded: boolean;
  videoFirstFrameReady: boolean;
  fontsLoaded: boolean;
  renderedDOM?: HTMLElement;
  timestamp: number;    // Last access time
}
```
- **Eviction Policy**:
  - LRU within each tier.
  - When memory > 80% budget, evict WARM tier oldest-first.
  - If still > 80%, evict HOT tier (except immediate ±1).
  - ACTIVE tier never evicted.

### 1.4 Input Controller
- **Responsibility**: Keyboard/mouse/touch input handling.
- **Exports**: `registerShortcut(key, handler)`, `handleGesture(type)`.

### 1.5 HUD Manager
- **Responsibility**: HUD rendering, auto-hide, button actions.
- **Exports**: 
  - `show(): void`
  - `hide(): void`
  - `registerButton(config: HUDButtonConfig): void`
  - `setAutoHideTimeout(ms: number): void`
- **API Schema**:
```typescript
interface HUDButtonConfig {
  id: string;
  label: string;
  icon?: string;         // Icon name or SVG
  action: () => void;    // Click handler
  position: 'left' | 'center' | 'right';
  order: number;         // Display order within position
  toggle?: boolean;      // Is this a toggle button?
  active?: boolean;      // Initial active state (for toggles)
  disabled?: boolean;    // Is button disabled?
  ariaLabel: string;     // Screen reader label
}
```
- **Default Buttons** (in order):
  1. Prev (left)
  2. Slide counter (center): "5 / 24"
  3. Next (left)
  4. Laser (right, toggle)
  5. Grid (right, toggle)
  6. Black screen (right, toggle)
  7. Exit (right)

### 1.6 Presenter View Manager (Optional)
- **Responsibility**: Dual-screen presenter view lifecycle, sync.
- **Exports**: `openPresenterView()`, `syncState(state)`, `close()`.

---

## 2) Extension Points

### 2.1 Custom Overlays
- **Hook**: `registerOverlay(name, config)`
- **Config**: `{ render(), show(), hide(), zIndex }`
- **Example**: Custom annotation tool, presenter-only diagnostics.

### 2.2 Custom Input Handlers
- **Hook**: `registerShortcut(key, handler)`
- **Example**: Custom navigation shortcuts, plugin-specific actions.

### 2.3 Custom Cache Strategies
- **Hook**: `setCacheStrategy(strategy)`
- **Example**: Video-optimized prefetch, network-aware adaptive caching.

### 2.4 Custom Telemetry
- **Hook**: `registerTelemetryHandler(handler)`
- **Example**: Custom analytics backend, privacy-focused logging.

---

## 3) Versioning & Compatibility

### Requirements
- MUST maintain backward compatibility for public APIs.
- SHOULD version extension points (e.g., `registerOverlay_v2()`).
- MUST document breaking changes in release notes.

---

## 4) Plugin System (Future)

### Design Principles
- Plugins MUST be sandboxed (no direct DOM access to audience feed).
- Plugins SHOULD use extension points (not monkey-patching).
- Plugins MUST declare capabilities and permissions.

### Example Use Cases
- Third-party annotation tools.
- Custom presenter view layouts.
- Integration with remote control hardware.

---

## Telemetry
- Extension point usage (which hooks are used, by what).
- Plugin installation/activation rate.

## Test plan
- Extension point registration (verify hooks work correctly).
- Plugin sandboxing (verify isolation from audience feed).
- Backward compatibility (run old plugin versions against new core).

## Edge cases
- Plugin throws error during render (isolate failure).
- Conflicting shortcuts (multiple plugins register same key).
- Plugin requests unavailable capability (graceful denial).
