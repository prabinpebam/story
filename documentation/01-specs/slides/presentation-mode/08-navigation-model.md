# Navigation Model (Slides, Builds, Links)

## Goals
- Define how users move through the deck during presentation.
- Specify slide/build semantics, jump targets, and back-stack behavior.

---

## 1) Linear Navigation
### Requirements
- MUST support Next/Prev at slide granularity and build granularity.
- MUST track build index per slide.
- Next from last build MUST advance to next slide.
- Prev from first build MUST return to previous slide's last build.

### Build Navigation Logic
```typescript
function next(state: PresentationState): PresentationState {
  // If there are more builds on current slide, advance build
  if (state.buildIndex < state.buildCount - 1) {
    return { ...state, buildIndex: state.buildIndex + 1 };
  }
  // Otherwise, advance to next slide (reset build index)
  if (state.slideIndex < totalSlides - 1) {
    return {
      ...state,
      slideIndex: state.slideIndex + 1,
      // Enter the next slide in the "pre-build" state so the first Next
      // reveals build 0 (if any builds exist).
      buildIndex: -1,
      buildCount: getBuildsForSlide(state.slideIndex + 1)
    };
  }
  // At last slide, last build: no-op (or loop if kiosk mode)
  return state;
}

function prev(state: PresentationState): PresentationState {
  // If not at first build, go back one build
  if (state.buildIndex > 0) {
    return { ...state, buildIndex: state.buildIndex - 1 };
  }
  // Otherwise, go to previous slide's last build
  if (state.slideIndex > 0) {
    const prevSlideBuilds = getBuildsForSlide(state.slideIndex - 1);
    return {
      ...state,
      slideIndex: state.slideIndex - 1,
      buildIndex: Math.max(0, prevSlideBuilds - 1),
      buildCount: prevSlideBuilds
    };
  }
  // At first slide, first build: no-op
  return state;
}
```

### Build Count Determination
- Count all elements with `data-build` attribute or `.build` class on slide.
- `buildIndex = -1` means "no builds executed yet" on the current slide.
- If slide has no builds, `buildCount = 0` and `buildIndex` stays `-1`.
- Builds execute in DOM order unless explicit `data-build-order` specified.

---

## 2) Non-linear Navigation
### Requirements
- MUST support jump-to-slide by index (grid navigator, numeric entry).
- SHOULD support jump-to-slide by deep link/anchor.
- SHOULD support slide sections as navigation targets.

### Jump-to-Slide by Number
```typescript
function jumpToSlide(slideNumber: number): boolean {
  // Validate input (1-based user input, convert to 0-based)
  const slideIndex = slideNumber - 1;
  
  if (slideIndex < 0 || slideIndex >= totalSlides) {
    showError(`Invalid slide number: ${slideNumber}`);
    return false;
  }
  
  // Push current position to back-stack
  backStack.push({
    slideIndex: state.slideIndex,
    buildIndex: state.buildIndex
  });
  
  // Navigate to target slide
  setState({
    slideIndex,
    buildIndex: -1,
    buildCount: getBuildsForSlide(slideIndex)
  });
  
  return true;
}
```

### Jump from Grid
- Click on grid thumbnail jumps to that slide.
- Same back-stack push logic as numeric entry.
- Grid closes after jump.

---

## 3) Back-Stack
### Requirements
- SHOULD maintain back-stack for jumps (return to previous position after linked slide).
- Back-stack depth SHOULD be configurable (default: 10).

### Back-Stack Implementation
```typescript
interface NavigationStackEntry {
  slideIndex: number;
  buildIndex: number;
}

class NavigationBackStack {
  private stack: NavigationStackEntry[] = [];
  private readonly maxDepth: number;
  
  constructor(maxDepth = 10) {
    this.maxDepth = maxDepth;
  }
  
  push(entry: NavigationStackEntry) {
    this.stack.push(entry);
    if (this.stack.length > this.maxDepth) {
      this.stack.shift(); // Remove oldest
    }
  }
  
  pop(): NavigationStackEntry | undefined {
    return this.stack.pop();
  }
  
  clear() {
    this.stack = [];
  }
  
  isEmpty(): boolean {
    return this.stack.length === 0;
  }
}

// Usage
const backStack = new NavigationBackStack();

function goBack(): boolean {
  const previous = backStack.pop();
  if (!previous) {
    return false; // No history
  }
  
  setState({
    slideIndex: previous.slideIndex,
    buildIndex: previous.buildIndex,
    buildCount: getBuildsForSlide(previous.slideIndex)
  });
  
  return true;
}
```

### Keyboard Shortcut
- `Alt + ←` (or `Alt + Backspace`): Go back to previous position.

---

## 4) Hidden Slides
### Requirements
- Hidden slides SHOULD be skipped during linear navigation.
- Hidden slides MUST be accessible via direct jump (grid, numeric entry).

### Hidden Slide Detection
```typescript
function isSlideHidden(slideIndex: number): boolean {
  const slide = getSlideElement(slideIndex);
  return slide.dataset.hidden === 'true' || slide.classList.contains('hidden-slide');
}

function getNextVisibleSlide(fromIndex: number): number {
  for (let i = fromIndex + 1; i < totalSlides; i++) {
    if (!isSlideHidden(i)) {
      return i;
    }
  }
  return -1; // No more visible slides
}

function getPrevVisibleSlide(fromIndex: number): number {
  for (let i = fromIndex - 1; i >= 0; i--) {
    if (!isSlideHidden(i)) {
      return i;
    }
  }
  return -1; // No previous visible slides
}
```

### Modified Next/Prev Logic
```typescript
function nextSlide(state: PresentationState): PresentationState {
  const nextVisible = getNextVisibleSlide(state.slideIndex);
  if (nextVisible === -1) {
    return state; // At end
  }
  
  return {
    ...state,
    slideIndex: nextVisible,
    buildIndex: -1,
    buildCount: getBuildsForSlide(nextVisible)
  };
}
```

### Grid Display
- Hidden slides shown in grid with dimmed/grayed-out styling.
- Label: "Hidden" badge on thumbnail.
- Still clickable to jump directly.

---

## Telemetry
- Navigation pattern distribution (linear vs jump)
- Back-stack usage rate

## Test plan
- Linear navigation with varying build counts
- Jump-to-slide by number
- Back-stack after link jumps
- Hidden slide behavior

## Edge cases
- Back navigation from slide 1
- Jump to slides with/without builds
- Circular link chains
