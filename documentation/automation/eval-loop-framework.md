# Story Evaluation Loop Framework

> **Adapted from**: The Agnostic Evaluation Loop Framework v2.0  
> **Scope**: UI interaction correctness verification for a canvas-based presentation editor with hybrid DOM + Canvas rendering  
> **Why**: Traditional assertions cannot verify spatial accuracy — whether a selection highlight aligns with an element, whether snap guides appear at the correct pixel, whether a drag operation lands where it should. The eval loop captures the full state of what the user sees and detects anomalies that only manifest in the running application.

---

## 0. Why Traditional Testing Fails for Canvas UI

Story renders UI across **two fundamentally different surfaces**:

1. **DOM layer** — slide elements (text, shapes, images) as positioned `<div>` elements with inline styles and SVG children. Testable with selectors.
2. **Canvas layer** — all interaction feedback (selection boxes, resize handles, snap guides, hover outlines, marquee rectangles, measurement displays) drawn to a `<canvas>` element. **No DOM nodes exist.** No selectors. No `data-testid`. The only way to verify what the user sees is to read the canvas pixels or read the state that drives the drawing.

This means:
- You cannot assert "selection highlight is visible" with a DOM query — it's canvas-drawn.
- You cannot assert "snap guide appears at x=200" with a selector — it's a line drawn to `ctx`.
- You cannot assert "resize handle overlaps the element corner" without comparing coordinates.
- You cannot verify pixel-perfect alignment without screenshots.

The eval loop solves this by capturing **both layers simultaneously** — DOM state, Store state, CanvasManager state, and screenshots — then detecting anomalies across all of them.

---

## 1. The Framework (Adapted for Story)

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: DEFINE — What the user should see after each action │
│         Taskflows: select, drag, resize, snap, text edit…   │
├─────────────────────────────────────────────────────────────┤
│ Step 2: ENUMERATE — Every checkable behavior                │
│         Spatial accuracy, state sync, visual correctness    │
├─────────────────────────────────────────────────────────────┤
│ Step 3: PLAN CAPTURE — What to record from DOM + Canvas     │
│         DOM attributes, Store state, CanvasManager locals,  │
│         interaction-canvas pixels, screenshots              │
├─────────────────────────────────────────────────────────────┤
│ Step 4: CAPTURE — Record the real app during interaction    │
│         Playwright drives mouse/keyboard, captures state    │
├─────────────────────────────────────────────────────────────┤
│ Step 5: DETECT — Find anomalies                             │
│         Heuristic rules + temporal rules + screenshot eval  │
├─────────────────────────────────────────────────────────────┤
│ Step 6: CONVERGE — Fix, re-run, verify clean                │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Story's Rendering Architecture (Capture Reference)

Understanding the layer stack is essential for writing capture functions. Everything the user sees comes from these five layers, bottom to top:

```
renderer-stage (position: absolute, 100% × 100%)
├─ layer-background     z:1  DOM     pointer-events: auto
├─ layer-content        z:2  DOM     pointer-events: auto     ← Slide elements live here
│  └─ slide-view[data-slide-id]
│     ├─ slide-background[data-testid="slide-background"]
│     └─ .slide-element[data-element-id][data-element-type]   ← Each element
├─ layer-overlay        z:3  SVG/DOM pointer-events: none     ← Layout guides (SVG)
├─ interaction-canvas   z:4  Canvas  pointer-events: varies   ← Gizmos, selection, handles
└─ layer-top            z:5  DOM     pointer-events: none
```

### What Lives in DOM (Queryable)

| Selector | What It Is |
|---|---|
| `.slide-element[data-element-id]` | Every slide element (text, shape, image, group) |
| `[data-element-type]` | Element kind: `text`, `rect`, `circle`, `line`, `image`, `svg`, `group`, `vector`, `boolean`, `mask` |
| `[data-shape-kind]` | Canonical shape type |
| `[data-is-placeholder]` | Whether element is a master placeholder |
| `[data-source]` | Origin: `slide`, `layout`, `theme` |
| `[data-testid="slide-view"]` | Slide container |
| `[data-testid="slide-background"]` | Background container |
| `[data-testid="layout-guide-overlay"]` | Column/margin guide SVG |
| `[data-testid="layout-guide-column"]` | Individual column guides |
| `#zoom-display` | Current zoom percentage text |

### What Lives on Canvas (NOT Queryable)

All drawn by `GizmoRenderer` to the interaction canvas every frame:

| Visual | Driven By |
|---|---|
| Selection bounding box (1px accent stroke) | `store.editor.selectedElementIds` + `GeometryUtils.getAbsoluteElement()` |
| 8 resize handles (white squares, accent border) | Same selection state |
| Corner radius handles (circles) | Selected element has `borderRadius` |
| Shape outline highlight | Selected shape elements — traces SVG path, not bounding box |
| Hover outline | `canvasManager.hoveredElementId` |
| Snap guides (magenta lines) | `canvasManager.activeGuides[]` |
| Measurement guides (red labels) | `canvasManager.measurementGuides` |
| Selection marquee (accent fill) | `canvasManager.interactionState === 'SELECTING'` |
| Creation ghost (dashed preview) | `canvasManager.interactionState === 'CREATING'` |
| Placeholder overlays (dashed borders) | Master mode, unselected placeholder elements |

### What Lives Only in CanvasManager (NOT in Store, NOT in DOM)

These transient interaction values are essential for verifying interaction correctness but exist only as JS variables on the `CanvasManager` instance:

```
interactionState    'IDLE' | 'PANNING' | 'DRAGGING' | 'RESIZING' | 'CREATING' | 'SELECTING'
activeHandle        'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w' | null
interactionAction   'resize' | 'rotate' | 'radius' | null
activeGuides        Array<{ type: 'v'|'h'|'gap-x'|'gap-y', x?, y?, ... }>
hoveredElementId    string | null
initialElementState { [id]: { x, y, width, height, rotation, ... } }
dragStart           { x, y }  (screen coords)
dragCurrent         { x, y }  (screen coords)
```

---

## 3. The Three-Layer Capture

Every eval loop snapshot captures THREE layers simultaneously. Anomalies surface as **divergences between layers**.

### Layer 1: Store State (What the System Believes)

The Immer store is the source of truth. Capture the fields relevant to the interaction being evaluated.

```javascript
// Injected via page.evaluate()
function captureStoreState() {
  const state = window.__storyStore?.getState?.() ?? store.getState();
  const editor = state.editor;
  const slide = state.slides[editor.activeSlideId];
  
  return {
    timestamp: performance.now(),
    
    // Editor state
    mode: editor.mode,
    activeSlideId: editor.activeSlideId,
    selectedElementIds: [...editor.selectedElementIds],
    editingElementId: editor.editingElementId,
    zoom: editor.zoom,
    pan: { ...editor.pan },
    activeTool: editor.activeTool,
    deepEdit: editor.deepEdit ? { ...editor.deepEdit } : null,
    
    // Active slide elements
    elements: Object.fromEntries(
      (slide?.effectiveOrder ?? slide?.elementOrder ?? []).map(id => {
        const el = (slide?.effectiveElements ?? slide?.elements)?.[id];
        if (!el) return [id, null];
        return [id, {
          id: el.id,
          type: el.type,
          x: el.x, y: el.y,
          width: el.width, height: el.height,
          rotation: el.rotation ?? 0,
          opacity: el.opacity ?? 1,
          borderRadius: el.borderRadius ?? 0,
          hidden: el.hidden ?? false,
          parentId: el.parentId ?? null,
          source: el.source,
          name: el.name,
        }];
      })
    ),
    elementOrder: [...(slide?.effectiveOrder ?? slide?.elementOrder ?? [])],
    
    // UI state
    isInteracting: state.ui?.isInteracting ?? false,
  };
}
```

### Layer 2: DOM State (What the User Actually Sees)

Read the rendered DOM to capture what's actually on screen. **This is the most critical layer** — it's what the user perceives.

```javascript
function captureDOMState() {
  const slideView = document.querySelector('[data-testid="slide-view"]');
  if (!slideView) return { timestamp: performance.now(), elements: [], slidePresent: false };
  
  const elements = [...document.querySelectorAll('.slide-element[data-element-id]')].map(el => {
    const style = el.style;
    const computed = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    
    return {
      id: el.getAttribute('data-element-id'),
      type: el.getAttribute('data-element-type'),
      shapeKind: el.getAttribute('data-shape-kind'),
      source: el.getAttribute('data-source'),
      isPlaceholder: el.getAttribute('data-is-placeholder') === 'true',
      layerName: el.getAttribute('data-layer-name'),
      
      // Inline style values (what the renderer set)
      inlinePosition: {
        left: parseFloat(style.left) || 0,
        top: parseFloat(style.top) || 0,
        width: parseFloat(style.width) || 0,
        height: parseFloat(style.height) || 0,
      },
      transform: style.transform || 'none',
      zIndex: parseInt(style.zIndex) || 0,
      opacity: parseFloat(style.opacity),
      display: computed.display,
      
      // Bounding rect (screen coordinates, after all transforms)
      screenRect: {
        x: rect.x, y: rect.y,
        width: rect.width, height: rect.height,
      },
      
      // Content indicators
      hasTextContent: el.querySelector('[contenteditable]')?.textContent?.length > 0,
      hasSvgGeometry: !!el.querySelector('svg .geometry-layer, svg path'),
      hasImage: !!el.querySelector('img'),
      imageLoaded: el.querySelector('img')?.complete ?? null,
      
      // Visibility
      isVisible: computed.display !== 'none' 
        && parseFloat(computed.opacity) > 0
        && rect.width > 0 && rect.height > 0,
    };
  });
  
  // Layout guides
  const guideOverlay = document.querySelector('[data-testid="layout-guide-overlay"]');
  const columnGuides = [...document.querySelectorAll('[data-testid="layout-guide-column"]')].map(g => ({
    x: parseFloat(g.getAttribute('x')),
    y: parseFloat(g.getAttribute('y')),
    width: parseFloat(g.getAttribute('width')),
    height: parseFloat(g.getAttribute('height')),
  }));
  
  // Zoom display
  const zoomText = document.getElementById('zoom-display')?.textContent?.trim();
  
  return {
    timestamp: performance.now(),
    slidePresent: !!slideView,
    slideId: slideView?.getAttribute('data-slide-id'),
    elementCount: elements.length,
    elements,
    layoutGuidesVisible: guideOverlay?.style.display !== 'none',
    columnGuides,
    zoomDisplay: zoomText,
  };
}
```

### Layer 3: Interaction State (Canvas-Layer Ground Truth)

The canvas interaction layer has no DOM representation. Capture the state that drives canvas drawing — essential for verifying selection, handles, guides, and spatial accuracy.

```javascript
function captureInteractionState() {
  // Access CanvasManager instance (exposed on window or via module)
  const cm = window.__canvasManager;
  if (!cm) return { timestamp: performance.now(), available: false };
  
  return {
    timestamp: performance.now(),
    available: true,
    
    // Interaction state machine
    interactionState: cm.interactionState,
    interactionAction: cm.interactionAction,
    activeHandle: cm.activeHandle,
    
    // Hover
    hoveredElementId: cm.hoveredElementId,
    
    // Active snap guides (what the user sees as magenta lines)
    activeGuides: (cm.activeGuides ?? []).map(g => ({
      type: g.type,
      x: g.x, y: g.y,
      fromId: g.fromId, toId: g.toId,
    })),
    
    // Drag tracking
    dragStart: cm.dragStart ? { ...cm.dragStart } : null,
    dragCurrent: cm.dragCurrent ? { ...cm.dragCurrent } : null,
    
    // Pre-interaction element snapshots (needed for undo correctness)
    initialElementState: cm.initialElementState 
      ? Object.fromEntries(
          Object.entries(cm.initialElementState).map(([id, s]) => [id, {
            x: s.x, y: s.y, width: s.width, height: s.height, rotation: s.rotation,
          }])
        )
      : null,
    
    // Computed selection geometry (what the gizmo renderer uses to draw)
    selectionBounds: (() => {
      const sel = window.__storyStore?.getState?.()?.editor?.selectedElementIds ?? [];
      if (sel.length === 0) return null;
      // GizmoRenderer computes this per frame — expose via a helper
      try {
        const { GeometryUtils } = window.__storyModules ?? {};
        if (!GeometryUtils) return null;
        const slide = window.__storyStore.getState().slides[
          window.__storyStore.getState().editor.activeSlideId
        ];
        if (sel.length === 1) {
          const abs = GeometryUtils.getAbsoluteElement(slide, slide.effectiveElements[sel[0]]);
          return abs ? { x: abs.x, y: abs.y, width: abs.width, height: abs.height, rotation: abs.rotation ?? 0 } : null;
        }
        return null; // Multi-selection bounds require more complex computation
      } catch { return null; }
    })(),
  };
}
```

### The Combined Snapshot

Every capture point produces one combined snapshot:

```javascript
async function captureSnapshot(page, label) {
  const [storeState, domState, interactionState] = await Promise.all([
    page.evaluate(() => captureStoreState()),
    page.evaluate(() => captureDOMState()),
    page.evaluate(() => captureInteractionState()),
  ]);
  
  // Screenshot at this moment
  const screenshot = await page.screenshot({ type: 'png' });
  
  return {
    label,
    wallClockMs: Date.now(),
    store: storeState,
    dom: domState,
    interaction: interactionState,
    screenshot, // Buffer — write to file
  };
}
```

---

## 4. Anomaly Detection — Three Mechanisms

### Mechanism 1: Heuristic Detectors (Deterministic, Inline)

Boolean invariant checks that run on every snapshot. Each checks a user-observable property.

#### Category A: Store ↔ DOM Sync

The DOM must reflect Store state. Divergence means the renderer has a bug.

```
DETECTOR: ELEMENT_MISSING_IN_DOM
  Severity: critical
  Rule:     Every non-hidden element in store.elements must have a 
            corresponding .slide-element[data-element-id] in DOM
  Check:    For each store element where hidden !== true:
            dom.elements.find(d => d.id === id) must exist

DETECTOR: ELEMENT_GHOST_IN_DOM
  Severity: critical
  Rule:     Every .slide-element in DOM must have a corresponding
            entry in store.elements
  Check:    For each dom element:
            store.elements[id] must exist

DETECTOR: POSITION_DRIFT
  Severity: critical
  Rule:     Element DOM position must match store position within 1px tolerance
  Check:    |dom.inlinePosition.left - store.element.x| <= 1
            |dom.inlinePosition.top - store.element.y| <= 1

DETECTOR: DIMENSION_DRIFT
  Severity: critical
  Rule:     Element DOM dimensions must match store dimensions within 1px
  Check:    |dom.inlinePosition.width - store.element.width| <= 1
            |dom.inlinePosition.height - store.element.height| <= 1

DETECTOR: Z_ORDER_MISMATCH
  Severity: warning
  Rule:     DOM z-index ordering must match store.elementOrder
  Check:    DOM elements sorted by zIndex produce same ID sequence as store order

DETECTOR: OPACITY_MISMATCH
  Severity: warning
  Rule:     DOM opacity matches store opacity (inherited = 0.5× multiplier)
  Check:    dom.opacity ≈ store.opacity (±0.01)

DETECTOR: HIDDEN_BUT_VISIBLE
  Severity: critical
  Rule:     Elements marked hidden in store must not be visible in DOM
  Check:    If store.element.hidden → dom.display === 'none'
```

#### Category B: Selection Consistency

Selection state (Store) must correspond to what the user perceives (canvas gizmos).

```
DETECTOR: SELECTION_STATE_SYNC
  Severity: critical
  Rule:     store.selectedElementIds must match interaction.selectionBounds presence
  Check:    If selectedElementIds.length > 0 → selectionBounds !== null
            If selectedElementIds.length === 0 → selectionBounds === null

DETECTOR: SELECTION_BOUNDS_ACCURACY
  Severity: critical
  Rule:     Selection bounds must enclose the selected element within 2px tolerance
  Check:    selectionBounds.x ≈ element.x (±2px)
            selectionBounds.y ≈ element.y (±2px)
            selectionBounds.width ≈ element.width (±2px)

DETECTOR: DESELECTED_BUT_EDITING
  Severity: critical
  Rule:     editingElementId must be in selectedElementIds
  Check:    If editingElementId !== null → selectedElementIds.includes(editingElementId)
```

#### Category C: Interaction State Machine

The interaction state machine must follow valid transitions.

```
DETECTOR: INVALID_INTERACTION_STATE
  Severity: critical
  Rule:     interactionState must be a known value
  Check:    interactionState ∈ {'IDLE','PANNING','DRAGGING','RESIZING','CREATING','SELECTING'}

DETECTOR: DRAG_WITHOUT_SELECTION
  Severity: critical
  Rule:     DRAGGING state requires at least one selected element
  Check:    If interactionState === 'DRAGGING' → selectedElementIds.length > 0

DETECTOR: RESIZE_WITHOUT_HANDLE
  Severity: critical
  Rule:     RESIZING state requires an active handle
  Check:    If interactionState === 'RESIZING' → activeHandle !== null

DETECTOR: STALE_INITIAL_STATE
  Severity: warning
  Rule:     During DRAGGING/RESIZING, initialElementState must exist for all selected elements
  Check:    If interactionState ∈ {'DRAGGING','RESIZING'} →
            every selectedElementId has entry in initialElementState
```

#### Category D: Spatial Accuracy

Coordinates and transforms must be mathematically consistent.

```
DETECTOR: ELEMENT_OUT_OF_SLIDE
  Severity: warning
  Rule:     Element fully outside slide bounds is suspicious (user may not see it)
  Check:    element.x + element.width > 0 AND element.x < slideWidth
            element.y + element.height > 0 AND element.y < slideHeight

DETECTOR: SNAP_GUIDE_VALIDITY
  Severity: warning
  Rule:     Active snap guides must reference existing elements or slide edges
  Check:    For each guide: fromId and toId exist in store.elements OR are 'slide'

DETECTOR: ZOOM_DISPLAY_SYNC
  Severity: warning
  Rule:     #zoom-display text must match store.zoom
  Check:    zoomDisplay === `${Math.round(store.zoom * 100)}%`
```

#### Category E: Rendering Integrity

The visual output must be well-formed.

```
DETECTOR: TEXT_ELEMENT_EMPTY_UNEXPECTEDLY
  Severity: warning
  Rule:     Text element with content in store must have text in DOM
  Check:    If store element is text type with content → dom.hasTextContent === true

DETECTOR: IMAGE_LOAD_FAILURE
  Severity: critical
  Rule:     Image elements must have loaded images
  Check:    If dom.hasImage → dom.imageLoaded === true

DETECTOR: SVG_MISSING_FOR_SHAPE
  Severity: critical
  Rule:     Shape elements must have SVG geometry
  Check:    If element.type ∈ {rect,circle,line,vector,shape} → dom.hasSvgGeometry === true

DETECTOR: LAYOUT_GUIDE_STATE_SYNC
  Severity: warning
  Rule:     Layout guide visibility must match editor.showLayoutGuides
  Check:    dom.layoutGuidesVisible === store.showLayoutGuides
```

---

### Mechanism 2: Temporal Rules (Cross-Snapshot)

Built by diffing consecutive snapshots. These catch violations that only appear over time.

#### Mutation Timeline Construction

```javascript
function buildMutationTimeline(snapshots) {
  const mutations = [];
  for (let i = 1; i < snapshots.length; i++) {
    const prev = snapshots[i - 1];
    const curr = snapshots[i];
    
    // Element position/dimension changes
    for (const [id, currEl] of Object.entries(curr.store.elements)) {
      const prevEl = prev.store.elements[id];
      if (!prevEl) {
        mutations.push({ snapshot: i, type: 'element-added', id, element: currEl });
        continue;
      }
      for (const field of ['x', 'y', 'width', 'height', 'rotation', 'opacity', 'hidden']) {
        if (currEl[field] !== prevEl[field]) {
          mutations.push({
            snapshot: i, type: 'element-changed', id, field,
            oldValue: prevEl[field], newValue: currEl[field],
            interactionState: curr.interaction.interactionState,
          });
        }
      }
    }
    
    // Selection changes
    if (JSON.stringify(prev.store.selectedElementIds) !== JSON.stringify(curr.store.selectedElementIds)) {
      mutations.push({
        snapshot: i, type: 'selection-changed',
        oldSelection: prev.store.selectedElementIds,
        newSelection: curr.store.selectedElementIds,
      });
    }
    
    // Interaction state transitions
    if (prev.interaction.interactionState !== curr.interaction.interactionState) {
      mutations.push({
        snapshot: i, type: 'interaction-transition',
        oldState: prev.interaction.interactionState,
        newState: curr.interaction.interactionState,
      });
    }
  }
  return mutations;
}
```

#### Temporal Rules

```
RULE: INTERACTION_STATE_MONOTONICITY
  Type:     monotonic
  Rule:     Interaction state must follow valid transitions:
            IDLE → DRAGGING|RESIZING|SELECTING|CREATING|PANNING
            DRAGGING|RESIZING|SELECTING|CREATING|PANNING → IDLE
  Fires:    DRAGGING → RESIZING (invalid), SELECTING → DRAGGING (invalid)

RULE: DRAG_CONTINUITY
  Type:     temporal consistency
  Rule:     During DRAGGING, element position must change continuously 
            (no teleportation — delta between snapshots ≤ mouse delta × 2)
  Fires:    Element jumps 500px between consecutive DRAGGING snapshots

RULE: RESIZE_PROPORTIONALITY
  Type:     constraint
  Rule:     During shift-resize, aspect ratio must be preserved (±1% tolerance)
  Fires:    width/height ratio changes by more than 1% during shift-resize

RULE: UNDO_RESTORATION
  Type:     immutability (□ once)
  Rule:     After undo, element positions must equal their pre-interaction values
            (captured in initialElementState)
  Fires:    After undo, element.x !== initialElementState[id].x (±1px)

RULE: NO_ELEMENT_DISAPPEARANCE
  Type:     structural (∄)
  Rule:     An element present in snapshot N must be present in snapshot N+1
            (unless explicitly deleted by user action)
  Fires:    Element exists in snapshot 5 but not in snapshot 6 without a delete action

RULE: IDLE_AFTER_MOUSEUP
  Type:     eventuality (◇)
  Rule:     After mouseup, interactionState must return to IDLE within 100ms
  Fires:    interactionState still DRAGGING 3 snapshots after mouseup

RULE: SELECTION_FOLLOWS_CLICK
  Type:     immediate (○)
  Rule:     After clicking an element, selectedElementIds must include that element
            within the next snapshot
  Fires:    Click on element but selectedElementIds unchanged
```

---

### Mechanism 3: Semantic Evaluation (Screenshot Analysis)

This is **not limited to AI-generated content**. Semantic evaluation catches **any visual anomaly** that can't be expressed as a boolean rule — spatial alignment, visual correctness, aesthetic consistency, and interaction behaviors that are hard to reduce to coordinate math.

#### What Screenshot Analysis Catches

| Category | Examples |
|---|---|
| **Spatial alignment** | Selection highlight doesn't align with element edges. Resize handle is offset from corner. Snap guide doesn't touch the element edge it claims to snap to. |
| **Visual correctness** | Text is clipped by bounding box. Shape fill bleeds outside stroke. Gradient renders incorrectly. Drop shadow is on wrong side. |
| **Interaction feedback** | Hover state not visible. Cursor doesn't match tool. Marquee rectangle doesn't follow mouse. Creation ghost doesn't match final element. |
| **Layout integrity** | Elements overlap when they shouldn't. Column guides don't align with content. Master placeholder position drifted after theme change. |
| **Theme consistency** | Accent color not applied to all interactive elements. Dark mode has white text on light background. Focus ring missing on active element. |
| **Typography rendering** | Text overflows element bounds. Line height causes text to clip. Font substitution (wrong font rendered). Kerning/tracking visually wrong. |

#### How to Implement

**Approach A: Comparative Screenshots**

Capture "before" and "after" screenshots around an interaction. Diff them to verify exactly the right things changed.

```javascript
// Before: nothing selected
const before = await page.screenshot();

// Action: click element
await page.mouse.click(elementCenterX, elementCenterY);
await page.waitForTimeout(100); // Let gizmo render

// After: element should be selected
const after = await page.screenshot();

// The diff should show: selection box appeared around the element
// The diff should NOT show: other elements moved, background changed
```

**Approach B: Region-of-Interest Screenshots**

Crop screenshots to the area around a specific element, then verify the visual state of that region.

```javascript
// Get element bounds in screen space
const bounds = await page.evaluate((id) => {
  const el = document.querySelector(`[data-element-id="${id}"]`);
  const rect = el.getBoundingClientRect();
  // Add padding for gizmos (handles extend 8px outside)
  return {
    x: rect.x - 16, y: rect.y - 16,
    width: rect.width + 32, height: rect.height + 32,
  };
}, elementId);

const regionScreenshot = await page.screenshot({ clip: bounds });
```

**Approach C: LLM-Powered Visual Evaluation**

For complex visual judgments that can't be reduced to pixel diffs, submit screenshots with structured prompts to a multimodal LLM.

```javascript
const evaluationPrompt = {
  context: "This is a presentation editor. The user just selected a rectangle element.",
  screenshots: {
    before: "screenshot-before-select.png",
    after: "screenshot-after-select.png",
  },
  questions: [
    "Does the selection highlight (blue rectangle outline) perfectly align with the element edges?",
    "Are the 8 resize handles (small white squares) positioned exactly at the corners and edge midpoints?",
    "Is there any visual artifact — flickering, double-rendering, clipping — visible?",
    "Does the element appear to have moved or resized as a result of being selected?",
  ],
  expectedAnswers: {
    alignment: "Selection outline should be within 1px of element edges",
    handles: "Handles should be centered on corners and midpoints",
    artifacts: "No artifacts should be visible",
    stability: "Element must not move when selected",
  },
};
```

**Approach D: Canvas Pixel Sampling**

For verifying canvas-drawn gizmos at specific coordinates, sample pixels from the interaction canvas.

```javascript
// Verify selection box is drawn at the expected position
const canvasPixel = await page.evaluate(({ x, y }) => {
  const canvas = document.querySelector('.interaction-canvas') 
    ?? document.querySelector('canvas');
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  const pixel = ctx.getImageData(x, y, 1, 1).data;
  return { r: pixel[0], g: pixel[1], b: pixel[2], a: pixel[3] };
}, { x: expectedSelectionX, y: expectedSelectionY });

// Accent color check — selection box should be drawn here
// Default accent: #18A0FB → rgb(24, 160, 251)
const isAccentColor = canvasPixel.r === 24 && canvasPixel.g === 160 && canvasPixel.b === 251;
```

---

## 5. Scenario Design for Story

Scenarios are **interaction sequences**, not feature checklists. Each scenario exercises a natural workflow and captures snapshots at every meaningful state transition.

### Scenario Structure

```
Phase 1: SETUP     — Navigate to app, wait for slide to render, dismiss any modals
Phase 2: EXERCISE  — Simulate user actions from taskflow (mouse clicks, drags, keyboard)
Phase 3: CAPTURE   — Snapshot at each step (DOM + Store + Interaction + Screenshot)
Phase 4: REPORT    — Run all detectors, build mutation timeline, write artifacts
```

### Example Scenarios

#### S1: Select and Transform

```
Taskflow: User selects an element, drags it, resizes it, rotates it, undoes everything.

Steps:
  1. Capture: baseline (no selection)
  2. Click element center → Capture: element selected, selection box visible
  3. Drag element 100px right → Capture every 50ms during drag: position updates, snap guides
  4. Release → Capture: element at new position, IDLE state, no guides
  5. Grab SE resize handle → Capture: RESIZING state, handle active
  6. Drag handle → Capture: dimensions changing, aspect ratio (if shift)
  7. Release → Capture: final dimensions persisted
  8. Ctrl+Z → Capture: resize undone, dimensions match pre-resize
  9. Ctrl+Z → Capture: drag undone, position matches original
  10. Ctrl+Z → Capture: selection cleared (or element deselected)

Detectors:
  - All Category A (Store↔DOM sync) on every snapshot
  - All Category B (Selection consistency) on snapshots 2-10
  - DRAG_CONTINUITY on snapshots 3 series
  - UNDO_RESTORATION on snapshots 8, 9
  - Screenshot comparison: snap 1 vs snap 10 should be pixel-identical (full undo)
```

#### S2: Multi-Select and Snap

```
Taskflow: User selects multiple elements, drags them, snap guides appear.

Steps:
  1. Click element A → selected
  2. Shift+click element B → both selected
  3. Drag both 50px down → snap guides appear (alignment with element C)
  4. Release on snap → elements aligned with C
  5. Capture: element A.y and element C.y match (snapped)

Detectors:
  - SNAP_GUIDE_VALIDITY on step 3
  - Position comparison: after snap release, A.y === C.y (within 1px)
  - Screenshot eval: snap guides visible as magenta lines during drag
```

#### S3: Text Editing Lifecycle

```
Taskflow: User double-clicks text element, types, clicks away.

Steps:
  1. Double-click text element → editingElementId set, contenteditable active
  2. Type "Hello" → text content updates
  3. Click outside → blur, edit mode exits, content persisted
  4. Ctrl+Z → text reverts

Detectors:
  - DESELECTED_BUT_EDITING at step 1
  - TEXT_ELEMENT_EMPTY_UNEXPECTEDLY at step 3
  - UNDO_RESTORATION at step 4
  - Screenshot eval: cursor visible during editing, text styled correctly
```

#### S4: Zoom and Pan

```
Taskflow: User zooms in, pans, verifies elements still render correctly.

Steps:
  1. Baseline screenshot at 100% zoom
  2. Ctrl+scroll to zoom to 200%
  3. Capture: zoom display shows "200%", elements scaled
  4. Space+drag to pan
  5. Capture: pan offset changed, elements shifted
  6. Ctrl+0 (or fit-to-view) → Capture: zoom and pan reset

Detectors:
  - ZOOM_DISPLAY_SYNC on every snapshot
  - POSITION_DRIFT should NOT fire (positions are world-space, not screen-space)
  - Screenshot eval: elements don't pixelate, text remains crisp
```

#### S5: Master Slide Theme Cascade

```
Taskflow: User changes theme color, verifies cascade to elements.

Steps:
  1. Baseline: capture all element colors
  2. Change accent theme color
  3. Capture: elements with theme-linked fills should update
  4. Screenshot eval: accent color applied consistently across all linked elements

Detectors:
  - Theme CSS variable check: --theme-accent1 matches new color
  - Linked elements' DOM fill colors match theme
  - Screenshot comparison: before/after, only accent-colored things changed
```

---

## 6. Capture Triggers and Timing

| Trigger | When to Use | Capture Frequency |
|---|---|---|
| **Before action** | Baseline for comparison | Once |
| **After click** | Selection changes, mode transitions | Once, after 50ms settle |
| **During drag** | Continuous interaction verification | Every 50ms (or every `requestAnimationFrame`) |
| **After release** | Final state verification | Once, after 100ms settle |
| **After keyboard shortcut** | Undo/redo, delete, copy/paste | Once, after 100ms settle |
| **After theme change** | Cascade verification | Once, after 200ms settle (re-renders may batch) |
| **Polling** | Catch async renders, animations | Every 250ms during idle periods |

---

## 7. Output Artifacts

```
test-results/eval-loop/<scenario>-<timestamp>/
├── snapshots.json           All captured snapshots (store + dom + interaction per capture point)
├── mutation-timeline.json   Computed diffs between consecutive snapshots
├── anomaly-report.json      All anomalies (code, severity, message, snapshot index)
├── screenshots/
│   ├── 001-baseline.png
│   ├── 002-after-select.png
│   ├── 003-during-drag-001.png
│   ├── 003-during-drag-002.png
│   ├── 004-after-release.png
│   └── ...
├── screenshot-diffs/        Pixel diffs between consecutive screenshots
│   ├── diff-001-002.png
│   └── ...
└── semantic-eval/           Inputs and results for screenshot analysis
    ├── eval-input.json
    └── eval-result.json
```

### Anomaly Report Format

```json
{
  "scenario": "S1-select-and-transform",
  "timestamp": "2026-04-11T12:00:00Z",
  "snapshotCount": 15,
  "verdict": "FAIL",
  "summary": { "critical": 1, "warning": 2, "info": 0 },
  "anomalies": [
    {
      "code": "POSITION_DRIFT",
      "category": "A",
      "severity": "critical",
      "snapshot": 4,
      "message": "Element rect-1: DOM left=152px but store x=150px (drift: 2px)",
      "elementId": "rect-1"
    },
    {
      "code": "SNAP_GUIDE_VALIDITY",
      "category": "D",
      "severity": "warning",
      "snapshot": 7,
      "message": "Guide references element 'deleted-id' which doesn't exist in store"
    }
  ],
  "temporalViolations": [
    {
      "rule": "DRAG_CONTINUITY",
      "snapshots": [5, 6],
      "message": "Element rect-1 jumped 487px between consecutive DRAGGING snapshots"
    }
  ],
  "semanticFindings": []
}
```

---

## 8. Exposing Internal State for Capture

The capture functions need access to the Store and CanvasManager from within `page.evaluate()`. Add a small boot-time exposure:

```javascript
// In src/main.js or a test-only boot hook (only when running under Playwright)
if (window.__PLAYWRIGHT_EVAL_LOOP__) {
  window.__storyStore = store;
  window.__canvasManager = canvasManager;
  window.__storyModules = { GeometryUtils, store, canvasManager };
}
```

Playwright sets the flag before navigating:

```javascript
await page.addInitScript(() => {
  window.__PLAYWRIGHT_EVAL_LOOP__ = true;
});
```

This ensures internal state is accessible without polluting production builds.

---

## 9. Convergence

```
For a scenario to be VERIFIED:
  □ At least 3 independent runs (interaction sequences may produce slightly
    different timing, hover detection, and snap behavior each run)
  □ Zero critical anomalies across ALL runs
  □ Zero warning anomalies across ALL runs (or documented exceptions)
  □ Screenshot diffs show only expected changes (selection added/removed,
    not unrelated elements shifting)
  □ Semantic evaluation (if used) produces no actionable findings
```

---

## 10. Priority Scenarios for Story

Start with these — they cover the highest-risk interaction surfaces:

| Priority | Scenario | Why |
|---|---|---|
| 1 | **S1: Select and Transform** | Core interaction loop — if this breaks, nothing works |
| 2 | **S3: Text Editing Lifecycle** | Complex DOM state (contenteditable) + Store sync |
| 3 | **S2: Multi-Select and Snap** | Spatial accuracy of snap guides — screenshot eval essential |
| 4 | **S5: Theme Cascade** | Cross-element consistency — visual regression risk |
| 5 | **S4: Zoom and Pan** | Viewport math — off-by-one errors cause drift at scale |
| 6 | **Presentation mode entry/exit** | Mode transition — DOM teardown/rebuild integrity |
| 7 | **Undo/redo across operations** | History stack integrity across mixed operations |
| 8 | **Master slide editing** | Inheritance chain — changes cascade correctly |
