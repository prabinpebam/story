# Visual Presentation Surface (Rendering + Layout)

## Goals
- Ensure slides look like final output.
- Provide stable scaling/letterboxing with sharp text.

---

## 1) Aspect Ratio Handling
### Requirements
- MUST maintain slide aspect ratio.
- MUST letterbox when viewport aspect differs.
- MUST use theme design token for letterbox color (not hardcoded).

---

## 2) Scaling
### Requirements
- MUST use a single scaling transform at the container level (avoid per-element jitter).
- MUST define rounding strategy to avoid blurry text where possible.

### Scaling Algorithm
```typescript
interface ViewportDimensions {
  width: number;
  height: number;
}

interface SlideAspectRatio {
  width: number;   // e.g., 16
  height: number;  // e.g., 9
}

function calculateScale(
  viewport: ViewportDimensions,
  slideAspect: SlideAspectRatio
): { scale: number; offsetX: number; offsetY: number } {
  const slideRatio = slideAspect.width / slideAspect.height;
  const viewportRatio = viewport.width / viewport.height;
  
  let scale: number;
  let offsetX = 0;
  let offsetY = 0;
  
  if (viewportRatio > slideRatio) {
    // Viewport is wider than slide: letterbox left/right
    scale = viewport.height / slideAspect.height;
    const scaledWidth = slideAspect.width * scale;
    offsetX = (viewport.width - scaledWidth) / 2;
  } else {
    // Viewport is taller than slide: letterbox top/bottom
    scale = viewport.width / slideAspect.width;
    const scaledHeight = slideAspect.height * scale;
    offsetY = (viewport.height - scaledHeight) / 2;
  }
  
  // Round to avoid subpixel blur
  return {
    scale: Math.floor(scale * 1000) / 1000,  // 3 decimal precision
    offsetX: Math.round(offsetX),
    offsetY: Math.round(offsetY)
  };
}
```

### CSS Application
```css
#viewport {
  transform: translate(offsetX, offsetY) scale(scale);
  transform-origin: 0 0;
}

#stage {
  background-color: var(--color-presentation-stage-bg);
}
```

---

## 3) High DPI
### Requirements
- MUST account for `devicePixelRatio` in canvas/WebGL back buffers.
- MUST prevent font swap/jump where possible.
- Canvas resize operations MUST reset transforms before applying DPI scaling: `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` not cumulative `ctx.scale()`.

---

## 4) Safe Areas & Overscan
### Requirements
- SHOULD support safe area guides (presenter-only) for projectors/TV overscan.

---

## 5) Color/Contrast in Real Environments
### Requirements
- SHOULD provide “projector friendly” defaults for HUD.

---

## Telemetry
- Viewport and devicePixelRatio sampling (privacy-safe)

## Test plan
- Multiple aspect ratios
- Retina vs non-retina
- Projector/TV simulation

## Edge cases
- Browser zoom
- Display scaling changes mid-show
