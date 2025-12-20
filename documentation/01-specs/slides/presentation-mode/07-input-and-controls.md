# Input & Controls (Keyboard, Mouse, Touch)

## Goals
- Define all input methods for navigating and controlling presentation.
- Ensure accessibility and multi-device support.

---

## 1) Keyboard Shortcuts
### Requirements
- MUST support:
  - `Space`, `→`, `↓`, `PageDown`, `Enter`: Next (slide or build)
  - `Backspace`, `←`, `↑`, `PageUp`: Previous (slide or build)
  - `Home`: Jump to first slide
  - `End`: Jump to last slide
  - `Esc`: Exit presentation
  - `B`: Toggle black screen
  - `W`: Toggle white screen
  - `G`: Toggle grid navigator
  - `L`: Toggle laser pointer
- SHOULD support:
  - `[digit]` + `Enter`: Jump to slide by number
  - `P`: Toggle presenter view (if dual-screen)
  - `S`: Toggle settings/menu

### Input Processing Rules
- **Key repeat throttle**: Ignore key events if last event was <100ms ago (prevent accidental rapid navigation).
- **Modifier keys**: `Ctrl`/`Cmd`/`Alt` + shortcut should be ignored (avoid conflicts with browser shortcuts).
- **Focus trap**: If focus is in HUD input field (e.g., jump-to-slide number entry), normal shortcuts are disabled.
- **Numeric entry**: Accumulate digits in buffer; `Enter` commits jump; `Esc` cancels; auto-commit after 3s timeout.
- **Invalid slide number**: If entered number > slide count or < 1, show error (presenter-only), do not navigate.

### Constants
```typescript
const INPUT_THROTTLE_MS = 100;        // Min time between navigation events
const NUMERIC_ENTRY_TIMEOUT_MS = 3000; // Auto-commit/clear jump-to buffer
const HUD_AUTO_HIDE_MS = 3000;         // Auto-hide HUD after inactivity
```

---

## 2) Mouse Input
### Requirements
- MUST support click-to-advance (configurable: next build or next slide).
- MUST reveal HUD on mouse movement.
- Right-click SHOULD open context menu (optional, for accessibility).

### Click-to-Advance Configuration
```typescript
interface ClickAdvanceConfig {
  enabled: boolean;              // Default: true
  action: 'next-build' | 'next-slide'; // Default: 'next-build'
  excludeRegions: string[];      // CSS selectors to exclude (e.g., '.hud', 'a[href]')
}
```
- **Default excludeRegions**: `.hud`, `a[href]`, `button`, `input`, `video` (prevent clicks on interactive elements from advancing).
- **Click handling**:
  1. Check if click target matches any `excludeRegions` selector.
  2. If yes, ignore (allow default behavior).
  3. If no, execute configured action (`next-build` or `next-slide`).

### Mouse Movement Handling
- **HUD reveal**: Show HUD on any `mousemove` event.
- **Auto-hide**: Start 3s countdown timer on reveal; reset timer on subsequent movement.
- **Cursor**: Hide cursor after 5s of inactivity (presentation mode); show on movement.

---

## 3) Touch Input
### Requirements
- MUST support swipe gestures (left/right for prev/next).
- MUST support tap-to-reveal HUD.
- SHOULD support two-finger gestures (pinch-zoom for accessibility magnification).

### Gesture Recognition Parameters
```typescript
interface SwipeConfig {
  minDistance: number;    // Default: 50 (pixels)
  maxDuration: number;    // Default: 500 (ms)
  maxVerticalDeviation: number; // Default: 30 (pixels)
}
```
- **Swipe detection**:
  1. On `touchstart`, record start position and timestamp.
  2. On `touchend`, calculate:
     - `deltaX = endX - startX`
     - `deltaY = endY - startY`
     - `duration = endTime - startTime`
  3. If `duration < maxDuration` AND `abs(deltaX) > minDistance` AND `abs(deltaY) < maxVerticalDeviation`:
     - If `deltaX < 0`: Swipe left (next)
     - If `deltaX > 0`: Swipe right (prev)
- **Tap-to-reveal**: Single tap (no drag) shows HUD for 3s.
- **Pinch-zoom**: Use browser's default pinch-zoom (do not prevent default).

---

## 4) Accessibility
### Requirements
- MUST provide screen reader announcements for slide/build changes.
- MUST support keyboard-only navigation.
- SHOULD provide focus indicators for HUD buttons.

---

## Telemetry
- Input method distribution (keyboard vs mouse vs touch)
- Shortcut usage frequency

## Test plan
- Keyboard-only navigation
- Touch-only device testing
- Screen reader testing (NVDA/JAWS/VoiceOver)

## Edge cases
- Rapid key repeat
- Conflicting shortcuts with OS/browser
- Touch input on desktop (stylus, touch screen)
