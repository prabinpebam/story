# Playback: Transitions, Builds, Embedded Media

## Goals
- Define how transitions, builds, and media behave during live delivery.
- Ensure smooth playback without jank.

---

## 1) Slide Transitions
### Requirements
- MUST apply author-defined transitions (if supported).
- MUST fall back to instant cut if transition not supported.
- MUST respect reduced motion preference (disable transitions).
- Transition duration SHOULD be configurable (default ~300ms).

### Supported Transition Types
```typescript
enum TransitionType {
  NONE = 'none',           // Instant cut
  FADE = 'fade',           // Cross-fade
  SLIDE_LEFT = 'slide-left',
  SLIDE_RIGHT = 'slide-right',
  SLIDE_UP = 'slide-up',
  SLIDE_DOWN = 'slide-down',
  PUSH_LEFT = 'push-left', // Push old slide out while new slides in
  PUSH_RIGHT = 'push-right',
  ZOOM_IN = 'zoom-in',
  ZOOM_OUT = 'zoom-out'
}

interface TransitionConfig {
  type: TransitionType;
  duration: number;        // milliseconds, default: 300
  easing: string;          // CSS easing function, default: 'ease-in-out'
}
```

### Transition Execution
1. Wait for next slide to be fully loaded (HOT tier ready check).
2. If `prefers-reduced-motion: reduce`, force `type = NONE`.
3. Apply CSS classes for transition:
   - Add `.transition-out` to current slide.
   - Add `.transition-in` to next slide.
4. Wait for transition duration.
5. Remove old slide from DOM, clean up classes.
6. Update active state.

---

## 2) Builds (Entrance Animations)
### Requirements
- MUST execute builds in author-defined order.
- MUST support Next/Prev for build navigation.
- MUST track build index per slide.
- MUST respect reduced motion preference (simplify to opacity fades).

### Build Detection
- Elements with `data-build` attribute are build targets.
- If `data-build-order` is present, use its value for ordering (numeric).
- Otherwise, order by DOM position.
- Elements start hidden: `opacity: 0` or `visibility: hidden`.

### Build Execution
```typescript
function executeBuild(buildIndex: number) {
  const buildElements = getBuildElementsForCurrentSlide();
  const element = buildElements[buildIndex];
  
  if (!element) return;
  
  const animationType = element.dataset.buildAnimation || 'fade';
  const duration = parseInt(element.dataset.buildDuration || '300');
  
  if (prefersReducedMotion()) {
    // Simplified animation for reduced motion
    element.style.opacity = '1';
    element.style.visibility = 'visible';
  } else {
    // Full animation
    element.classList.add(`build-${animationType}`);
    element.classList.add('build-active');
  }
}

function reverseBuild(buildIndex: number) {
  const buildElements = getBuildElementsForCurrentSlide();
  const element = buildElements[buildIndex];
  
  if (!element) return;
  
  element.style.opacity = '0';
  element.classList.remove('build-active');
}
```

### Supported Build Animations
- `fade`: Opacity 0 → 1
- `slide-up`: Translate from below + fade
- `slide-down`: Translate from above + fade
- `slide-left`: Translate from right + fade
- `slide-right`: Translate from left + fade
- `zoom`: Scale 0.5 → 1 + fade
- `bounce`: Bounce-in effect + fade

---

## 3) Embedded Media
### Requirements
- MUST auto-play video if configured.
- MUST provide play/pause controls (keyboard/click).
- MUST handle media load failures gracefully (show error state, allow skip).
- MUST mute/unmute audio on command.

### Video Handling
```typescript
interface VideoConfig {
  autoplay: boolean;       // Default: false
  loop: boolean;           // Default: false
  muted: boolean;          // Default: false
  controls: boolean;       // Default: true
  preload: 'none' | 'metadata' | 'auto'; // Default: 'metadata'
}

function handleVideoOnSlide(video: HTMLVideoElement) {
  // Preload first frame when slide enters HOT tier
  if (!video.readyState >= 2) {
    video.load();
    await new Promise(resolve => {
      video.addEventListener('loadeddata', resolve, { once: true });
    });
  }
  
  // Auto-play if configured
  if (video.dataset.autoplay === 'true') {
    try {
      await video.play();
    } catch (err) {
      // Browser blocked autoplay, show play button overlay
      showPlayButtonOverlay(video);
    }
  }
}
```

### Media Error Handling
```typescript
video.addEventListener('error', (e) => {
  const error = video.error;
  
  // Log to telemetry
  logMediaError({
    code: error.code,
    message: error.message,
    slideIndex: currentSlideIndex
  });
  
  // Show presenter-only error
  if (isPresenterView()) {
    showError(`Video failed to load: ${error.message}`);
  }
  
  // Show placeholder in audience view
  video.style.display = 'none';
  const placeholder = createPlaceholder('Video unavailable');
  video.parentElement.appendChild(placeholder);
});
```

### Keyboard Controls for Media
- `K`: Play/pause video on current slide
- `M`: Mute/unmute video on current slide
- `J`: Rewind 10s
- `L`: Forward 10s

---

## 4) Timing & Synchronization
### Requirements
- SHOULD support auto-advance with configurable timings (kiosk mode).
- MUST not block navigation while media plays.

---

## Telemetry
- Transition usage distribution
- Build complexity (avg builds per slide)
- Media playback success rate

## Test plan
- Various transition types
- Builds with mixed entrance animations
- Media load failure scenarios
- Auto-advance timing accuracy

## Edge cases
- Slide with 20+ builds
- Video playback on low-power device
- Audio-only media
