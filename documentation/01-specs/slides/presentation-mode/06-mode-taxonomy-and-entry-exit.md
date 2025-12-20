# Mode Taxonomy + Entry/Exit Rules

## Goals
- Define all presentation-related modes and their capability boundaries.
- Specify entry/exit behavior, restoration, focus/fullscreen rules, and multi-display routing.

---

## 1) Modes
### 1.1 Viewer Mode (Standard)
- Single surface intended for audience display.
- Fullscreen preferred; windowed fallback if browser denies.

### 1.2 Present in Window
- Deliberate windowed mode for screen sharing.
- MUST be user-selectable (not just fullscreen-denied fallback).

### 1.3 Presenter View (Dual-screen)
- Separate presenter window with notes/timer/next preview.
- Strict privacy boundary: notes never in audience feed.

### 1.4 Kiosk / Autoplay
- Automated timed advance and loop.
- Optional password-protected exit.

### Kiosk Mode Implementation
```typescript
interface KioskConfig {
  autoAdvanceSeconds: number;  // Seconds per slide, default: 5
  loop: boolean;               // Loop at end, default: true
  password?: string;           // SHA-256 hash of exit password
  disableInput: boolean;       // Disable manual navigation, default: false
}

class KioskMode {
  private timer: number | null = null;
  private config: KioskConfig;
  
  constructor(config: KioskConfig) {
    this.config = config;
  }
  
  start() {
    this.scheduleNextSlide();
    
    if (this.config.disableInput) {
      // Disable keyboard/mouse navigation
      document.addEventListener('keydown', this.blockInput, true);
      document.addEventListener('click', this.blockInput, true);
    }
  }
  
  stop() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    if (this.config.disableInput) {
      document.removeEventListener('keydown', this.blockInput, true);
      document.removeEventListener('click', this.blockInput, true);
    }
  }
  
  private scheduleNextSlide() {
    this.timer = window.setTimeout(() => {
      const isLastSlide = state.slideIndex === totalSlides - 1;
      
      if (isLastSlide && this.config.loop) {
        jumpToSlide(0); // Loop to beginning
      } else if (!isLastSlide) {
        next(); // Advance to next slide
      }
      
      this.scheduleNextSlide(); // Schedule next advance
    }, this.config.autoAdvanceSeconds * 1000);
  }
  
  private blockInput = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  async requestExit(): Promise<boolean> {
    if (!this.config.password) {
      return true; // No password required
    }
    
    const input = prompt('Enter password to exit:');
    if (!input) return false;
    
    const hash = await sha256(input);
    return hash === this.config.password;
  }
}

async function sha256(str: string): Promise<string> {
  const buffer = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
```

### 1.5 Reading / Preview (Optional)
- Minimal chrome, windowed, for quick deck review.

---

## 2) Entry Points
### Requirements
- MUST support entry via toolbar/menu and shortcuts.
- MUST support start-from-beginning and start-from-current as distinct actions.
- SHOULD support start-from-selected and from deep link.
- MUST provide mode picker UI (fullscreen vs windowed, single vs dual-screen).

### Entry Sequence
1. Validate deck state (min 1 slide, all required assets available).
2. Capture editor state for restoration (active slide, zoom, scroll).
3. Request fullscreen (if mode requires it).
4. Apply presentation CSS class (`body.mode-presentation`).
5. Initialize cache manager and preload HOT tier.
6. Render first slide.
7. Show HUD (auto-hide after 3s).
8. Emit telemetry event (`presentation.entered`).

### Error Handling
- **Empty deck**: Show error "Deck must have at least 1 slide", do not enter.
- **Missing assets**: Warn presenter, allow entry, show placeholders for missing assets.
- **Fullscreen denied**: Log event, continue in windowed mode.
- **Cache initialization fails**: Log error, continue without prefetch (degraded mode).

---

## 3) Exit Points
### Requirements
- MUST support exit via `Esc`, HUD button, and menu.
- MUST restore editor to previous state (active slide, zoom level).
- SHOULD prompt if exiting with unsaved changes.

### Exit Sequence
1. Check for unsaved changes; if present, show confirmation dialog.
2. If confirmed (or no changes), proceed:
3. Exit fullscreen (if active).
4. Remove presentation CSS class (`body.mode-presentation`).
5. Clear all overlays (laser, grid, black/white screen).
6. Restore editor state (active slide, zoom, scroll position).
7. Clean up cache (evict all tiers except metadata).
8. Close presenter view window (if open).
9. Emit telemetry event (`presentation.exited`).

### State Restoration
- **Active slide**: Restore to `editorState.activeSlideIndex`.
- **Zoom**: Restore to `editorState.zoomLevel`.
- **Scroll**: Restore to `editorState.scrollPosition`.
- **Selection**: Clear selection (do not restore).
- **Undo stack**: Preserve (presentation mode does not modify deck).

---

## 4) Fullscreen Handling
### Requirements
- MUST request fullscreen on entry (if mode is fullscreen viewer).
- MUST handle browser denial gracefully (continue in window).
- MUST track fullscreen state and provide re-request option in HUD.

### Fullscreen API Implementation
```typescript
async function requestFullscreen(element: HTMLElement): Promise<boolean> {
  try {
    // Use Fullscreen API
    if (element.requestFullscreen) {
      await element.requestFullscreen();
    } else if ((element as any).webkitRequestFullscreen) {
      await (element as any).webkitRequestFullscreen();
    } else if ((element as any).mozRequestFullScreen) {
      await (element as any).mozRequestFullScreen();
    } else if ((element as any).msRequestFullscreen) {
      await (element as any).msRequestFullscreen();
    } else {
      throw new Error('Fullscreen API not supported');
    }
    
    logTelemetry({ type: 'fullscreen.granted' });
    return true;
  } catch (err) {
    logTelemetry({ 
      type: 'fullscreen.denied', 
      reason: err.message 
    });
    
    // Show presenter-only notification
    showNotification(
      'Fullscreen denied. Continuing in windowed mode.',
      { duration: 3000, presenterOnly: true }
    );
    
    return false;
  }
}

function exitFullscreen(): Promise<void> {
  if (document.exitFullscreen) {
    return document.exitFullscreen();
  } else if ((document as any).webkitExitFullscreen) {
    return (document as any).webkitExitFullscreen();
  } else if ((document as any).mozCancelFullScreen) {
    return (document as any).mozCancelFullScreen();
  } else if ((document as any).msExitFullscreen) {
    return (document as any).msExitFullscreen();
  }
  return Promise.resolve();
}

// Listen for fullscreen changes
document.addEventListener('fullscreenchange', () => {
  const isFullscreen = !!document.fullscreenElement;
  updateState({ fullscreen: isFullscreen });
  
  if (!isFullscreen && state.isActive) {
    // User exited fullscreen via Esc, show re-request button in HUD
    showFullscreenToggleButton();
  }
});
```

---

## 5) Multi-Display Routing
### Requirements
- SHOULD detect available displays.
- SHOULD allow user to choose which display for audience view.
- MUST default to primary display if no choice provided.

---

## Telemetry
- Mode selection distribution
- Fullscreen denial rate
- Multi-display usage

## Test plan
- Enter/exit from various editor states
- Fullscreen denial simulation
- Display hotplug simulation
- Browser tab/window focus management

## Edge cases
- Presenter view opened without second display
- Returning to editor with unsaved changes
- Exiting via browser tab close (beforeunload)
