# Accessibility (Presentation Mode)

## Goals
- Ensure presentation mode is accessible to all users.
- Support screen readers, keyboard-only navigation, and assistive technologies.

---

## 1) Screen Reader Support
### Requirements
- MUST announce slide/build changes to screen readers.
- MUST provide accessible names for all HUD buttons.
- MUST expose slide content via accessibility tree.
- SHOULD announce slide title and slide number on navigation.

### Screen Reader Implementation
```typescript
// Create live region for announcements
const liveRegion = document.createElement('div');
liveRegion.setAttribute('role', 'status');
liveRegion.setAttribute('aria-live', 'polite');
liveRegion.setAttribute('aria-atomic', 'true');
liveRegion.className = 'sr-only'; // Visually hidden
document.body.appendChild(liveRegion);

function announceSlideChange(slideIndex: number, buildIndex: number) {
  const slide = getSlideElement(slideIndex);
  const slideTitle = slide.dataset.title || `Slide ${slideIndex + 1}`;
  const buildCount = getBuildsForSlide(slideIndex);
  
  let announcement = `${slideTitle}. Slide ${slideIndex + 1} of ${totalSlides}.`;
  
  if (buildCount > 0) {
    announcement += ` Build ${buildIndex + 1} of ${buildCount}.`;
  }
  
  liveRegion.textContent = announcement;
}

// CSS for screen-reader-only content
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### ARIA Labels for HUD
```html
<button id="hud-prev" 
  aria-label="Previous slide" 
  aria-keyshortcuts="ArrowLeft Backspace">
  ◀
</button>

<button id="hud-laser" 
  aria-label="Toggle laser pointer" 
  aria-pressed="false"
  aria-keyshortcuts="L">
  🔴
</button>
```

---

## 2) Keyboard Navigation
### Requirements
- MUST support keyboard-only navigation (no mouse required).
- MUST provide focus indicators for HUD buttons.
- MUST not trap focus in presentation mode.
- See [07-input-and-controls.md](07-input-and-controls.md) for keyboard shortcuts.

---

## 3) Visual Accessibility
### Requirements
- MUST meet WCAG 2.1 AA contrast requirements for HUD text/buttons.
- MUST respect `prefers-reduced-motion` (disable animations).
- MUST respect `prefers-contrast: high` (increase HUD contrast).
- SHOULD support zoom/magnification without breaking layout.

---

## 4) Alternative Input
### Requirements
- MUST support touch gestures on touch-enabled devices.
- SHOULD support voice control (browser-provided).
- SHOULD support switch control (browser-provided).

---

## Telemetry
- Screen reader usage detection (via accessibility tree query).
- Reduced motion preference usage.
- Keyboard-only navigation usage.

## Test plan
- Screen reader testing (NVDA, JAWS, VoiceOver).
- Keyboard-only navigation (no mouse).
- Reduced motion verification.
- High-contrast mode verification.
- Zoom to 200% (verify no layout breakage).

## Edge cases
- Screen reader + touch input.
- Voice control conflicts with keyboard shortcuts.
- Zoom + reduced motion combined.
