# HUD / On-Screen Controls (Audience-Safe)

## Goals
- Provide minimal controls without distracting from content.
- Keep audience feed clean and professional.

---

## 1) Visibility Rules
### Requirements
- MUST appear on mouse movement and auto-hide after inactivity (~3s).
- MUST be accessible via keyboard (focus management).
- MUST not permanently obscure content.

### Auto-Hide Behavior
```typescript
const HUD_AUTO_HIDE_DELAY_MS = 3000;
const HUD_FADE_DURATION_MS = 200;

function showHUD() {
  hudElement.classList.add('visible');
  clearTimeout(autoHideTimer);
  autoHideTimer = setTimeout(() => {
    hudElement.classList.remove('visible');
  }, HUD_AUTO_HIDE_DELAY_MS);
}

function onMouseMove() {
  showHUD();
}

function onKeyPress() {
  showHUD();
}
```

### Keyboard Access
- Press `Tab` to focus HUD (reveals if hidden).
- Arrow keys navigate between buttons.
- `Enter`/`Space` activate focused button.
- `Esc` closes HUD and returns focus to presentation surface.

---

## 2) Controls
### Requirements
- MUST provide Next/Prev.
- MUST provide slide counter ("5 / 24").
- MUST provide access to grid navigator.
- MUST provide fullscreen toggle (if browser supports).
- SHOULD provide settings menu (disable animations, kiosk mode, etc.).
- MUST provide exit button.

### HUD Layout
```html
<div id="hud" class="hud" role="toolbar" aria-label="Presentation controls">
  <div class="hud-section hud-section--left">
    <button id="hud-prev" aria-label="Previous slide">◀</button>
    <button id="hud-next" aria-label="Next slide">▶</button>
  </div>
  
  <div class="hud-section hud-section--center">
    <span id="hud-counter" aria-live="polite">5 / 24</span>
  </div>
  
  <div class="hud-section hud-section--right">
    <button id="hud-laser" aria-label="Toggle laser pointer" aria-pressed="false">🔴</button>
    <button id="hud-grid" aria-label="Open grid navigator" aria-pressed="false">⊞</button>
    <button id="hud-black" aria-label="Toggle black screen" aria-pressed="false">⬛</button>
    <button id="hud-fullscreen" aria-label="Toggle fullscreen">⛶</button>
    <button id="hud-exit" aria-label="Exit presentation">✕</button>
  </div>
</div>
```

### Button State Updates
- Slide counter updates on every navigation.
- Toggle buttons reflect active state via `aria-pressed` and CSS class `.active`.
- Disabled buttons get `disabled` attribute and `.disabled` class.

---

## 3) Pointer / Ink UI
### Requirements
- MUST provide quick laser toggle.
- SHOULD provide pen/highlighter palette.
- SHOULD provide clear-all for annotations.

---

## 4) Error & Notification Policy
### Requirements
- MUST be audience-safe by default.
- Presenter-only errors must not render in audience feed.

---

## 5) Design Tokens (Required)
### Requirements
- MUST use design tokens for HUD surfaces:
  - `--color-presentation-hud-bg`
  - `--color-hud-button-hover`
  - `--color-hud-button-active`
  - `--color-hud-divider`
  - `--color-hud-text`
- MUST NOT use hardcoded colors.

---

## Telemetry
- HUD reveal frequency
- Button usage distribution

## Test plan
- Auto-hide timing
- Keyboard accessibility
- Touch-only device
- Fullscreen toggle (permission scenarios)

## Edge cases
- Touch-only device
- Kiosk restrictions
- Fullscreen denied
