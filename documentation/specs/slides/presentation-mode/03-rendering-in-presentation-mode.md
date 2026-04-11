# Rendering in Presentation Mode (Differences from Edit/Master)

## Goals
- Define how slides render differently in presentation vs edit modes.
- Specify layering model for overlays (HUD, laser, grid).
- Ensure theme token usage for all presentation-specific UI.

---

## 1) Rendering Context Differences

### 1.1 Edit Mode
- **Purpose**: Authoring and manipulation.
- **Rendering**: Full interactive DOM, selection handles, guides, snapping.
- **Chrome**: Full toolbar, panels, properties.
- **Transform**: Zoom/pan controlled by user.

### 1.2 Master View (Optional)
- **Purpose**: Bulk editing, slide sorter.
- **Rendering**: Thumbnail grid, minimal interactivity.
- **Chrome**: Minimal toolbar, drag/drop affordances.
- **Transform**: Fixed thumbnail size.

### 1.3 Presenter View (Presenter Tools)
- **Purpose**: Presenter-only tools (notes, next slide preview, diagnostics, timers).
- **Audience boundary**: Presenter-only UI MUST NOT appear in audience/presentation output.
- **Rendering**: Separate window/view (or separate DOM root) that mirrors slide/build position.

### 1.4 Render Modes Matrix (Visibility Contract)

Legend:
- ✅ visible
- 🚫 must not be visible (even if present in DOM)
- ⚠️ present but must be inert/non-rendering (e.g., transparent overlay canvas)

| Surface | Edit | Master | Presentation (Audience) | Presenter View |
|---|---:|---:|---:|---:|
| Slide content (`#viewport`, `#slide-background`, `#slide-content`) | ✅ | ✅ (thumbnail/preview) | ✅ | ✅ (preview + next) |
| Editor chrome: sidebars (`#sidebar-left`, `#sidebar-right`) | ✅ | ✅/minimal | 🚫 | 🚫 |
| Editor chrome: top controls (`#top-controls`, `#play-btn`) | ✅ | ✅/minimal | 🚫 | 🚫 |
| Editor chrome: floating toolbar/panels (`#floating-toolbar`, `#floating-panels`) | ✅ | ✅/minimal | 🚫 | 🚫 |
| Editor chrome: viewport controls (`#viewport-controls`) | ✅ | ✅ | 🚫 | 🚫 |
| File metadata UI (`#file-indicator-container`, `.file-indicator`) | ✅ | ✅ | 🚫 | 🚫 |
| Authoring affordances: placeholders (`.story-placeholder-empty`, `.placeholder-icon-container`) | ✅ | ✅ | 🚫 | 🚫 |
| Editor popovers/menus (`.context-menu`, `.snapping-options-flyout`) | ✅ | ✅ | 🚫 | 🚫 |
| App modals/overlays (`.modal-overlay`, `.alert-modal-overlay`, `.share-modal-overlay`, `.sign-in-modal-overlay`) | ✅ | ✅ | 🚫 | 🚫 |
| App notifications/toasts (`.notification-popover-container`, `.file-toast`, `.panel-toast`, `.tsm-toast`) | ✅ | ✅ | 🚫 | 🚫 |
| Interaction overlay canvas (`#interaction-canvas`) | ✅ | ✅ | ⚠️ | ⚠️ |
| Presentation HUD (`#presentation-hud`) | 🚫 | 🚫 | ✅ | ✅ (presenter controls) |
| Presentation grid (`#presentation-grid-view`, `#grid-content`) | 🚫 | 🚫 | ✅ | ✅ |
| Presentation overlays (`#overlay-black`, `#overlay-white`) | 🚫 | 🚫 | ✅ | ✅ |
| Laser pointer (`#laser-canvas`, `body.laser-active`) | 🚫 | 🚫 | ✅ | ✅ |

### 1.3 Presentation Mode
- **Purpose**: Live delivery to audience.
- **Rendering**: Final output only, no editing affordances.
- **Chrome**: Minimal HUD (auto-hide), overlays (laser, grid).
- **Transform**: Single scaling transform (fit-to-viewport), letterboxing.

---

## 2) Presentation-Specific Rendering

### 2.1 Chrome Hiding
- MUST hide all editing chrome (toolbar, panels, selection handles).
- MUST hide any editor-only file metadata UI (e.g., file indicator pill).
- MUST NOT show placeholder authoring affordances in presentation output:
  - No dashed/dotted placeholder borders.
  - No placeholder prompt text (e.g., “Click to add title”).
  - No placeholder icons (e.g., image/media placeholder glyphs).
- MUST apply via CSS class (e.g., `body.mode-presentation`).
- MUST ensure no layout shift when entering/exiting.

**Note: canvas-based selection/handles**

In this app, selection boxes / resize handles / rotation handles are **not DOM chrome**; they are rendered via a canvas overlay (e.g., the gizmo/selection renderer). Because of this:
- CSS alone is insufficient (there may be nothing to hide).
- Entering Presentation MUST logically clear/disable any selection/hover gizmo rendering so no handles/selection outlines can be drawn at all.
- Exiting Presentation MAY restore normal edit-mode selection behavior.

#### 2.1.1 Forbidden Selector Checklist (Presentation MUST NOT show)

This checklist is the **single source of truth** for “audience-clean” output.
Playwright MUST enforce that each selector below is not visible when `body.mode-presentation` is active.

**Core editor chrome (always present in DOM)**
- `#sidebar-left`
- `#sidebar-right`
- `#top-controls`
- `#floating-toolbar`
- `#floating-panels`
- `#viewport-controls`
- `#file-indicator-container`

**Editor affordances (authoring-only)**
- `.story-placeholder-empty`
- `.placeholder-icon-container`
- `.layout-guide-overlay`

**File metadata UI (editor-only)**
- `.file-indicator`

**Popovers/menus (editor-only)**
- `.context-menu`
- `.snapping-options-flyout`

**Modals/overlays (editor-only; MUST never appear in audience view)**
- `.modal-overlay`
- `.alert-modal-overlay`
- `.sign-in-modal-overlay`
- `.share-modal-overlay`
- `.panel-modal-overlay`
- `.code-modal-overlay`

**Notifications/toasts (editor-only; MUST never appear in audience view)**
- `.notification-popover-container`
- `.file-toast`
- `.panel-toast`
- `.tsm-toast`

### CSS Implementation
```css
/* Hide editor chrome */
body.mode-presentation #sidebar-left,
body.mode-presentation #sidebar-right,
body.mode-presentation #top-controls,
body.mode-presentation #floating-toolbar,
body.mode-presentation #floating-panels,
body.mode-presentation #viewport-controls,
body.mode-presentation #file-indicator-container {
  display: none !important;
}

/* Hide authoring-only placeholder affordances */
body.mode-presentation .story-placeholder-empty,
body.mode-presentation .placeholder-icon-container {
  display: none !important;
}

/* Hide editor-only menus/modals/notifications */
body.mode-presentation .context-menu,
body.mode-presentation .snapping-options-flyout,
body.mode-presentation .modal-overlay,
body.mode-presentation .alert-modal-overlay,
body.mode-presentation .sign-in-modal-overlay,
body.mode-presentation .share-modal-overlay,
body.mode-presentation .notification-popover-container,
body.mode-presentation .file-toast,
body.mode-presentation .panel-toast,
body.mode-presentation .tsm-toast {
  display: none !important;
}

body.mode-presentation {
  /* Ensure full viewport */
  overflow: hidden;
}

#stage {
  background-color: var(--color-presentation-stage-bg);
}
```

### 2.2 Scaling & Letterboxing
- MUST scale slide to fit viewport while maintaining aspect ratio.
- MUST letterbox with theme token background (not hardcoded black).
- MUST use single transform on container (avoid per-element jitter).
- See [09-visual-surface-and-scaling.md](09-visual-surface-and-scaling.md) for details.

### 2.3 Layering Model
Stacking order (bottom to top):
1. **Stage background** (letterbox area) — uses `--color-presentation-stage-bg`
2. **Slide content** (scaled viewport)
3. **Overlays** (black/white screen, grid) — uses `--color-presentation-overlay-bg`
4. **Laser pointer** (dedicated canvas) — uses `--color-presentation-laser`
5. **HUD** (controls) — uses `--color-presentation-hud-bg`, auto-hide

---

## 3) Design Token Requirements

### Requirements
- MUST define and use tokens for all presentation UI:
  - `--color-presentation-stage-bg` (letterbox area)
  - `--color-presentation-overlay-bg` (black/white screen, grid background)
  - `--color-presentation-hud-bg` (HUD surface)
  - `--color-presentation-laser` (laser pointer color)
  - `--color-presentation-grid-overlay-bg` (grid background)
  - `--color-hud-button-hover`
  - `--color-hud-button-active`
  - `--color-hud-divider`
  - `--color-hud-text`
- MUST NOT use hardcoded colors (no `#000`, `rgba(...)`, etc.).
- MUST document token usage in component library.

### Token Behavior
- Tokens MUST respect theme (light/dark mode).
- Tokens SHOULD support high-contrast mode (`prefers-contrast: high`).
- Tokens SHOULD adapt to reduced transparency mode.

### Default Token Values
```css
:root {
  /* Light theme defaults */
  --color-presentation-stage-bg: #000000;
  --color-presentation-overlay-bg: rgba(0, 0, 0, 0.95);
  --color-presentation-hud-bg: rgba(0, 0, 0, 0.8);
  --color-presentation-laser: #ff0000;
  --color-presentation-grid-overlay-bg: rgba(0, 0, 0, 0.9);
  --color-hud-button-hover: rgba(255, 255, 255, 0.2);
  --color-hud-button-active: rgba(255, 255, 255, 0.3);
  --color-hud-divider: rgba(255, 255, 255, 0.15);
  --color-hud-text: #ffffff;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  :root {
    --color-presentation-hud-bg: #000000;  /* Fully opaque */
    --color-hud-button-hover: #333333;
    --color-hud-button-active: #555555;
  }
}
```

---

## 4) Render Pipeline

### 4.1 Entry
1. Apply `body.mode-presentation` CSS class.
2. Hide editing chrome.
3. Apply scaling transform to viewport.
4. Render first frame (ACTIVE slide).
5. Preload HOT tier (±1 slides) in background.

### 4.2 Navigation (Next/Prev)
1. Update slide/build index in state.
2. Render new ACTIVE slide.
3. Update HOT tier (new ±1 slides).
4. Optionally trigger WARM tier prefetch.

### 4.3 Exit
1. Remove `body.mode-presentation` CSS class.
2. Restore editing chrome.
3. Remove scaling transform.
4. Restore editor state (active slide, zoom level).

---

## 5) Overlay Rendering

### 5.1 Black/White Screen
- MUST render as full-viewport overlay (z-index above slide, below HUD).
- MUST use theme token `--color-presentation-overlay-bg`.
- MUST toggle instantly (<16ms).

### 5.2 Grid Navigator
- MUST render as full-viewport overlay (z-index above slide, below HUD).
- MUST use theme token `--color-presentation-grid-overlay-bg`.
- MUST show thumbnails in grid layout.
- MUST support click-to-jump.
- See [05-core-user-journeys.md](05-core-user-journeys.md) for behavior.

### Grid Layout Algorithm
```typescript
function calculateGridLayout(slideCount: number, viewport: ViewportDimensions) {
  // Target: 16:9 thumbnails, ~150-200px width
  const targetThumbWidth = 180;
  const thumbAspect = 16 / 9;
  const thumbHeight = targetThumbWidth / thumbAspect;
  
  // Calculate columns that fit
  const cols = Math.floor(viewport.width / (targetThumbWidth + 20)); // 20px gap
  const rows = Math.ceil(slideCount / cols);
  
  return { cols, rows, thumbWidth: targetThumbWidth, thumbHeight };
}
```

### Grid DOM Structure
```html
<div id="grid-overlay" class="grid-overlay">
  <div class="grid-container">
    <div class="grid-item" data-slide-index="0">
      <img src="thumbnail-0.jpg" alt="Slide 1">
      <span class="grid-item-number">1</span>
    </div>
    <!-- Repeat for each slide -->
  </div>
</div>
```

### 5.3 Laser Pointer
- MUST render on dedicated canvas (z-index above slide, below HUD).
- MUST use theme token `--color-presentation-laser`.
- MUST account for `devicePixelRatio` (DPI scaling).
- MUST reset canvas transform before applying DPI: `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`.
- See [11-presenter-tools.md](11-presenter-tools.md) for behavior.

### Laser Canvas Implementation
```typescript
class LaserPointer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private trail: Array<{ x: number; y: number; timestamp: number }> = [];
  private readonly TRAIL_LIFETIME_MS = 500;
  private readonly TRAIL_MAX_LENGTH = 50;
  
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'laser-canvas';
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.zIndex = '300';
    this.canvas.style.pointerEvents = 'none';
    
    this.ctx = this.canvas.getContext('2d')!;
    this.resize();
    
    window.addEventListener('resize', () => this.resize());
  }
  
  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;
    
    // Reset transform (critical: avoid cumulative scaling)
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  
  addPoint(x: number, y: number) {
    this.trail.push({ x, y, timestamp: Date.now() });
    if (this.trail.length > this.TRAIL_MAX_LENGTH) {
      this.trail.shift();
    }
  }
  
  render() {
    const now = Date.now();
    const color = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-presentation-laser').trim();
    
    // Clear
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Remove expired points
    this.trail = this.trail.filter(p => now - p.timestamp < this.TRAIL_LIFETIME_MS);
    
    // Draw trail
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    if (this.trail.length > 1) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.trail[0].x, this.trail[0].y);
      for (let i = 1; i < this.trail.length; i++) {
        const alpha = 1 - (now - this.trail[i].timestamp) / this.TRAIL_LIFETIME_MS;
        this.ctx.globalAlpha = alpha;
        this.ctx.lineTo(this.trail[i].x, this.trail[i].y);
      }
      this.ctx.stroke();
      this.ctx.globalAlpha = 1;
    }
    
    requestAnimationFrame(() => this.render());
  }
}
```

---

## 6) High DPI & Scaling

### Requirements
- MUST account for `devicePixelRatio` in all canvas rendering.
- MUST reset canvas transform before scaling to avoid compounding.
- MUST prevent font swap/jump during entry.
- SHOULD use subpixel rounding strategy to avoid blurry text.

---

## Telemetry
- Rendering mode transitions (edit → presentation, presentation → edit).
- Overlay usage frequency (laser, grid, black/white).
- DPI distribution (`devicePixelRatio` sampling).

## Test plan
- Enter/exit presentation mode (verify no layout shift).
- Multiple aspect ratios (16:9, 4:3, ultra-wide).
- Retina vs non-retina displays.
- Overlay rendering (verify token usage).
- Theme toggle (light/dark) during presentation.

## Edge cases
- Browser zoom level changes during show.
- Display scaling changes mid-show (DPI hotplug).
- Reduced motion mode (disable animations).
- High-contrast mode (verify token adaptation).
