# DOM & Canvas State Capture Guide for Story

> **Adapted from**: DOM State Capture as JSON Across Time (generic guide)  
> **Scope**: Capturing the full visual state of a hybrid DOM + Canvas presentation editor as structured JSON snapshots for evaluation loop analysis.  
> **Prerequisite**: [Story Evaluation Loop Framework](eval-loop-framework.md)

---

## 0. Why Story's Capture Is Different

Most web apps render everything to the DOM. Story renders across **two surfaces**:

1. **DOM** — slide elements (text, shapes, images), backgrounds, layout guides. Queryable with selectors.
2. **Canvas** — all interaction feedback (selection boxes, resize handles, snap guides, hover outlines, marquee, creation ghosts). No DOM nodes. No selectors. Drawn to a 2D canvas context every frame.

A capture function that only reads the DOM misses half of what the user sees. A function that only reads the Store misses whether the renderer actually put pixels in the right place. **You need all three layers — DOM, Store, and Canvas interaction state — captured simultaneously.**

Additionally, Story's viewport applies CSS transforms (`translate` + `scale`) to the content layer, meaning DOM element positions are in **world space** while screen positions differ by zoom and pan. The capture must record both coordinate systems.

---

## 1. Snapshot Anatomy

Every snapshot captures the full visual and logical state at one moment:

```
Snapshot
├── envelope          frameId, timestamp, elapsedMs, trigger
├── store             What the system believes (Immer store state)
├── dom               What's rendered (DOM elements + computed styles)
├── interaction       What canvas gizmos are drawn (CanvasManager state)
├── viewport          Current zoom, pan, coordinate transforms
└── anomalies         Issues detected inline at capture time
```

### 1.1 The Envelope

```javascript
{
  frameId: 0,                     // Sequential frame number
  timestamp: 1744358400000,       // Date.now()
  elapsedMs: 0,                   // Time since scenario start
  trigger: 'baseline',            // What caused capture:
                                  //   'baseline' | 'after-click' | 'during-drag'
                                  //   | 'after-release' | 'after-shortcut'
                                  //   | 'poll-250ms' | 'after-theme-change'
}
```

### 1.2 Store Layer — What the System Believes

```javascript
{
  // Editor state
  mode: 'edit',                   // 'edit' | 'master' | 'presentation'
  activeSlideId: 'slide-1',
  selectedElementIds: ['rect-1'], // Array of selected element IDs
  editingElementId: null,         // Element in text edit mode
  activeTool: 'select',          // Current tool
  deepEdit: null,                 // Vector/boolean editing context
  
  // Viewport
  zoom: 1.0,
  pan: { x: 0, y: 0 },
  
  // UI flags
  isInteracting: false,           // Property scrubbing active
  showLayoutGuides: true,
  
  // Slide elements (the source of truth for element positions/dimensions)
  elements: {
    'rect-1': {
      id: 'rect-1', type: 'rect',
      x: 100, y: 200, width: 300, height: 150,
      rotation: 0, opacity: 1, borderRadius: 0,
      hidden: false, parentId: null,
      source: 'slide', name: 'Rectangle 1',
    },
    'text-1': {
      id: 'text-1', type: 'text',
      x: 50, y: 400, width: 500, height: 80,
      rotation: 0, opacity: 1, borderRadius: 0,
      hidden: false, parentId: null,
      source: 'slide', name: 'Title',
    },
  },
  elementOrder: ['rect-1', 'text-1'],  // Z-order (bottom to top)
}
```

### 1.3 DOM Layer — What's Actually Rendered

```javascript
{
  slidePresent: true,
  slideId: 'slide-1',
  elementCount: 2,
  
  elements: [
    {
      // Identity (from data attributes)
      id: 'rect-1',
      type: 'rect',                // data-element-type
      shapeKind: 'rectangle',      // data-shape-kind
      source: 'slide',             // data-source
      isPlaceholder: false,        // data-is-placeholder
      layerName: 'Rectangle 1',   // data-layer-name
      
      // Position — inline style values (world space, set by renderer)
      inlinePosition: { left: 100, top: 200, width: 300, height: 150 },
      transform: 'rotate(0deg) scale(1, 1)',
      zIndex: 1,
      opacity: 1,
      display: 'block',
      
      // Screen rect (after viewport transforms — what the user actually sees)
      screenRect: { x: 100, y: 200, width: 300, height: 150 },
      
      // Content indicators
      hasTextContent: false,
      hasSvgGeometry: true,       // Shape has SVG path children
      hasImage: false,
      imageLoaded: null,
      
      // Computed visibility
      isVisible: true,
    },
    // ... more elements
  ],
  
  // Layout guides
  layoutGuidesVisible: true,
  columnGuides: [
    { x: 48, y: 0, width: 200, height: 540 },
    // ...
  ],
  
  // Zoom display
  zoomDisplay: '100%',
}
```

### 1.4 Interaction Layer — Canvas Gizmo State

This is what the canvas draws. No DOM equivalent exists.

```javascript
{
  available: true,                // CanvasManager was accessible
  
  // State machine
  interactionState: 'IDLE',       // IDLE | PANNING | DRAGGING | RESIZING | CREATING | SELECTING
  interactionAction: null,        // resize | rotate | radius (during RESIZING)
  activeHandle: null,             // nw | n | ne | e | se | s | sw | w (during RESIZING)
  
  // Hover
  hoveredElementId: null,
  
  // Snap guides (magenta lines the user sees during drag)
  activeGuides: [],               // { type, x?, y?, fromId?, toId? }
  
  // Drag tracking
  dragStart: null,                // { x, y } screen coords
  dragCurrent: null,              // { x, y } screen coords
  
  // Pre-interaction snapshots (for undo correctness verification)
  initialElementState: null,      // { [id]: { x, y, width, height, rotation } }
  
  // Computed selection geometry (what the gizmo renderer draws)
  selectionBounds: {              // null when nothing selected
    x: 100, y: 200,
    width: 300, height: 150,
    rotation: 0,
  },
}
```

### 1.5 Viewport

Needed to convert between world space (store/DOM positions) and screen space (what the user sees).

```javascript
{
  zoom: 1.0,
  pan: { x: 0, y: 0 },
  // Derived: screenX = worldX * zoom + pan.x
  // Derived: screenY = worldY * zoom + pan.y
}
```

---

## 2. The Capture Function

This function runs inside Story's browser context via `page.evaluate()`. It reads the DOM, the Store, and the CanvasManager in a single synchronous pass.

### 2.1 Design Rules

1. **ES5 syntax.** The function is serialized into the renderer. No arrow functions, no optional chaining, no template literals inside the string.
2. **No side effects.** Reads only. Never clicks, scrolls, emits events, or mutates state.
3. **Bounded output.** Hash text content instead of storing it. A single snapshot must stay under 20KB.
4. **Self-contained.** No imports, no closures, no external references. Everything inline.
5. **Tolerant.** Never throws. Every DOM access wrapped in null checks. Returns partial data rather than crashing.

### 2.2 Implementation

```javascript
var CAPTURE_FN = '(function() {' +
  // ── Helpers ──
  'function qsa(sel) { return [].slice.call(document.querySelectorAll(sel)); }' +
  'function hashStr(s) {' +
  '  var h = 0;' +
  '  for (var i = 0; i < s.length; i++) {' +
  '    h = ((h << 5) - h + s.charCodeAt(i)) | 0;' +
  '  }' +
  '  return h;' +
  '}' +
  'function getAttr(el, attr) { return el ? (el.getAttribute(attr) || "") : ""; }' +
  'function pf(v) { return parseFloat(v) || 0; }' +

  // ── Store Layer ──
  'var storeState = null;' +
  'try {' +
  '  var s = window.__storyStore ? window.__storyStore.getState() : null;' +
  '  if (s) {' +
  '    var editor = s.editor || {};' +
  '    var slideId = editor.activeSlideId || editor.activeMasterId;' +
  '    var slide = s.slides ? s.slides[slideId] : null;' +
  '    var elOrder = (slide && (slide.effectiveOrder || slide.elementOrder)) || [];' +
  '    var elMap = (slide && (slide.effectiveElements || slide.elements)) || {};' +
  '    var elements = {};' +
  '    for (var i = 0; i < elOrder.length; i++) {' +
  '      var id = elOrder[i];' +
  '      var el = elMap[id];' +
  '      if (el) {' +
  '        elements[id] = {' +
  '          id: el.id, type: el.type,' +
  '          x: el.x, y: el.y, width: el.width, height: el.height,' +
  '          rotation: el.rotation || 0, opacity: el.opacity != null ? el.opacity : 1,' +
  '          borderRadius: el.borderRadius || 0,' +
  '          hidden: !!el.hidden, parentId: el.parentId || null,' +
  '          source: el.source || "slide", name: el.name || ""' +
  '        };' +
  '      }' +
  '    }' +
  '    storeState = {' +
  '      mode: editor.mode || "edit",' +
  '      activeSlideId: slideId,' +
  '      selectedElementIds: [].concat(editor.selectedElementIds || []),' +
  '      editingElementId: editor.editingElementId || null,' +
  '      activeTool: editor.activeTool || "select",' +
  '      deepEdit: editor.deepEdit || null,' +
  '      zoom: editor.zoom || 1,' +
  '      pan: { x: (editor.pan && editor.pan.x) || 0, y: (editor.pan && editor.pan.y) || 0 },' +
  '      isInteracting: !!(s.ui && s.ui.isInteracting),' +
  '      showLayoutGuides: editor.showLayoutGuides !== false,' +
  '      elements: elements,' +
  '      elementOrder: elOrder' +
  '    };' +
  '  }' +
  '} catch(e) { /* store unavailable */ }' +

  // ── DOM Layer ──
  'var slideView = document.querySelector("[data-testid=slide-view]");' +
  'var domElements = qsa(".slide-element[data-element-id]").map(function(el) {' +
  '  var st = el.style;' +
  '  var comp = getComputedStyle(el);' +
  '  var rect = el.getBoundingClientRect();' +
  '  var textEl = el.querySelector("[contenteditable]");' +
  '  var textContent = textEl ? (textEl.textContent || "") : "";' +
  '  return {' +
  '    id: getAttr(el, "data-element-id"),' +
  '    type: getAttr(el, "data-element-type"),' +
  '    shapeKind: getAttr(el, "data-shape-kind"),' +
  '    source: getAttr(el, "data-source"),' +
  '    isPlaceholder: getAttr(el, "data-is-placeholder") === "true",' +
  '    layerName: getAttr(el, "data-layer-name"),' +
  '    inlinePosition: {' +
  '      left: pf(st.left), top: pf(st.top),' +
  '      width: pf(st.width), height: pf(st.height)' +
  '    },' +
  '    transform: st.transform || "none",' +
  '    zIndex: parseInt(st.zIndex) || 0,' +
  '    opacity: pf(comp.opacity),' +
  '    display: comp.display,' +
  '    screenRect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },' +
  '    hasTextContent: textContent.length > 0,' +
  '    textContentHash: hashStr(textContent),' +
  '    textLength: textContent.length,' +
  '    hasSvgGeometry: !!el.querySelector("svg path, svg line, svg circle, svg ellipse, svg rect, svg polygon"),' +
  '    hasImage: !!el.querySelector("img"),' +
  '    imageLoaded: el.querySelector("img") ? !!el.querySelector("img").complete : null,' +
  '    isVisible: comp.display !== "none" && pf(comp.opacity) > 0 && rect.width > 0 && rect.height > 0' +
  '  };' +
  '});' +

  'var guideOverlay = document.querySelector("[data-testid=layout-guide-overlay]");' +
  'var columnGuides = qsa("[data-testid=layout-guide-column]").map(function(g) {' +
  '  return { x: pf(g.getAttribute("x")), y: pf(g.getAttribute("y")),' +
  '           width: pf(g.getAttribute("width")), height: pf(g.getAttribute("height")) };' +
  '});' +
  'var zoomEl = document.getElementById("zoom-display");' +

  'var domState = {' +
  '  slidePresent: !!slideView,' +
  '  slideId: slideView ? getAttr(slideView, "data-slide-id") : null,' +
  '  elementCount: domElements.length,' +
  '  elements: domElements,' +
  '  layoutGuidesVisible: guideOverlay ? guideOverlay.style.display !== "none" : false,' +
  '  columnGuides: columnGuides,' +
  '  zoomDisplay: zoomEl ? (zoomEl.textContent || "").trim() : null' +
  '};' +

  // ── Interaction Layer ──
  'var interactionState = { available: false };' +
  'try {' +
  '  var cm = window.__canvasManager;' +
  '  if (cm) {' +
  '    interactionState = {' +
  '      available: true,' +
  '      interactionState: cm.interactionState || "IDLE",' +
  '      interactionAction: cm.interactionAction || null,' +
  '      activeHandle: cm.activeHandle || null,' +
  '      hoveredElementId: cm.hoveredElementId || null,' +
  '      activeGuides: (cm.activeGuides || []).map(function(g) {' +
  '        return { type: g.type, x: g.x, y: g.y, fromId: g.fromId, toId: g.toId };' +
  '      }),' +
  '      dragStart: cm.dragStart ? { x: cm.dragStart.x, y: cm.dragStart.y } : null,' +
  '      dragCurrent: cm.dragCurrent ? { x: cm.dragCurrent.x, y: cm.dragCurrent.y } : null,' +
  '      initialElementState: null,' +
  '      selectionBounds: null' +
  '    };' +
  '    if (cm.initialElementState) {' +
  '      var ies = {};' +
  '      var keys = Object.keys(cm.initialElementState);' +
  '      for (var k = 0; k < keys.length; k++) {' +
  '        var src = cm.initialElementState[keys[k]];' +
  '        ies[keys[k]] = { x: src.x, y: src.y, width: src.width, height: src.height, rotation: src.rotation || 0 };' +
  '      }' +
  '      interactionState.initialElementState = ies;' +
  '    }' +
  '  }' +
  '} catch(e) { /* canvas manager unavailable */ }' +

  // ── Inline Anomaly Detection ──
  'var anomalies = [];' +
  
  // A1: Store↔DOM element count mismatch
  'if (storeState && domState.slidePresent) {' +
  '  var storeVisible = 0;' +
  '  var sKeys = Object.keys(storeState.elements);' +
  '  for (var m = 0; m < sKeys.length; m++) {' +
  '    if (!storeState.elements[sKeys[m]].hidden) storeVisible++;' +
  '  }' +
  '  if (storeVisible !== domState.elementCount) {' +
  '    anomalies.push({ code: "ELEMENT_COUNT_MISMATCH", severity: "critical",' +
  '      category: "sync", message: "Store has " + storeVisible + " visible elements, DOM has " + domState.elementCount });' +
  '  }' +
  '}' +

  // A2: Element in store but missing from DOM
  'if (storeState) {' +
  '  var domIds = {};' +
  '  for (var d = 0; d < domElements.length; d++) domIds[domElements[d].id] = true;' +
  '  var seKeys = Object.keys(storeState.elements);' +
  '  for (var n = 0; n < seKeys.length; n++) {' +
  '    var se = storeState.elements[seKeys[n]];' +
  '    if (!se.hidden && !domIds[se.id]) {' +
  '      anomalies.push({ code: "ELEMENT_MISSING_IN_DOM", severity: "critical",' +
  '        category: "sync", message: "Element " + se.id + " (" + se.type + ") in store but not in DOM" });' +
  '    }' +
  '  }' +
  '}' +

  // A3: Position drift (DOM position doesn't match store)
  'if (storeState) {' +
  '  for (var p = 0; p < domElements.length; p++) {' +
  '    var de = domElements[p];' +
  '    var se2 = storeState.elements[de.id];' +
  '    if (se2 && de.isVisible) {' +
  '      var dx = Math.abs(de.inlinePosition.left - se2.x);' +
  '      var dy = Math.abs(de.inlinePosition.top - se2.y);' +
  '      if (dx > 1 || dy > 1) {' +
  '        anomalies.push({ code: "POSITION_DRIFT", severity: "critical",' +
  '          category: "spatial", message: "Element " + de.id + ": DOM pos (" + de.inlinePosition.left + "," + de.inlinePosition.top + ") vs store (" + se2.x + "," + se2.y + ")" });' +
  '      }' +
  '      var dw = Math.abs(de.inlinePosition.width - se2.width);' +
  '      var dh = Math.abs(de.inlinePosition.height - se2.height);' +
  '      if (dw > 1 || dh > 1) {' +
  '        anomalies.push({ code: "DIMENSION_DRIFT", severity: "critical",' +
  '          category: "spatial", message: "Element " + de.id + ": DOM size (" + de.inlinePosition.width + "x" + de.inlinePosition.height + ") vs store (" + se2.width + "x" + se2.height + ")" });' +
  '      }' +
  '    }' +
  '  }' +
  '}' +

  // A4: Zoom display sync
  'if (storeState && domState.zoomDisplay) {' +
  '  var expected = Math.round(storeState.zoom * 100) + "%";' +
  '  if (domState.zoomDisplay !== expected) {' +
  '    anomalies.push({ code: "ZOOM_DISPLAY_DESYNC", severity: "warning",' +
  '      category: "sync", message: "Zoom display shows " + domState.zoomDisplay + " but store zoom is " + storeState.zoom });' +
  '  }' +
  '}' +

  // A5: Editing element not in selection
  'if (storeState && storeState.editingElementId) {' +
  '  if (storeState.selectedElementIds.indexOf(storeState.editingElementId) === -1) {' +
  '    anomalies.push({ code: "EDITING_NOT_SELECTED", severity: "critical",' +
  '      category: "state", message: "editingElementId " + storeState.editingElementId + " not in selectedElementIds" });' +
  '  }' +
  '}' +

  // A6: Drag without selection
  'if (interactionState.available && interactionState.interactionState === "DRAGGING") {' +
  '  if (!storeState || storeState.selectedElementIds.length === 0) {' +
  '    anomalies.push({ code: "DRAG_WITHOUT_SELECTION", severity: "critical",' +
  '      category: "state", message: "InteractionState is DRAGGING but no elements selected" });' +
  '  }' +
  '}' +

  // A7: Resize without active handle
  'if (interactionState.available && interactionState.interactionState === "RESIZING") {' +
  '  if (!interactionState.activeHandle) {' +
  '    anomalies.push({ code: "RESIZE_WITHOUT_HANDLE", severity: "critical",' +
  '      category: "state", message: "InteractionState is RESIZING but no activeHandle set" });' +
  '  }' +
  '}' +

  // A8: Image load failures
  'for (var q = 0; q < domElements.length; q++) {' +
  '  if (domElements[q].hasImage && domElements[q].imageLoaded === false) {' +
  '    anomalies.push({ code: "IMAGE_LOAD_FAILURE", severity: "critical",' +
  '      category: "rendering", message: "Image element " + domElements[q].id + " failed to load" });' +
  '  }' +
  '}' +

  // A9: Shape without SVG geometry
  'var shapeTypes = { rect:1, circle:1, line:1, vector:1, shape:1 };' +
  'for (var r = 0; r < domElements.length; r++) {' +
  '  if (shapeTypes[domElements[r].type] && domElements[r].isVisible && !domElements[r].hasSvgGeometry) {' +
  '    anomalies.push({ code: "SHAPE_MISSING_SVG", severity: "critical",' +
  '      category: "rendering", message: "Shape element " + domElements[r].id + " (" + domElements[r].type + ") has no SVG geometry" });' +
  '  }' +
  '}' +

  // A10: Hidden element visible in DOM
  'if (storeState) {' +
  '  for (var u = 0; u < domElements.length; u++) {' +
  '    var se3 = storeState.elements[domElements[u].id];' +
  '    if (se3 && se3.hidden && domElements[u].isVisible) {' +
  '      anomalies.push({ code: "HIDDEN_BUT_VISIBLE", severity: "critical",' +
  '        category: "sync", message: "Element " + domElements[u].id + " hidden in store but visible in DOM" });' +
  '    }' +
  '  }' +
  '}' +

  // ── Assemble Snapshot ──
  'return {' +
  '  timestamp: Date.now(),' +
  '  store: storeState,' +
  '  dom: domState,' +
  '  interaction: interactionState,' +
  '  viewport: storeState ? { zoom: storeState.zoom, pan: storeState.pan } : { zoom: 1, pan: { x: 0, y: 0 } },' +
  '  anomalies: anomalies' +
  '};' +
'})()';
```

### 2.3 Exposing Internal State

The capture function needs `window.__storyStore` and `window.__canvasManager`. Add a test-mode exposure in the app boot:

```javascript
// In src/main.js — guarded so it never runs in production
if (window.__PLAYWRIGHT_EVAL_LOOP__) {
  window.__storyStore = store;
  window.__canvasManager = canvasManager;
}
```

Playwright sets the flag before navigation:

```javascript
await page.addInitScript(() => {
  window.__PLAYWRIGHT_EVAL_LOOP__ = true;
});
```

---

## 3. Capture Triggers

### 3.1 Change-Driven (Primary)

Capture when the visual state actually changes. Use a structural fingerprint to avoid recording redundant frames.

```javascript
function buildFingerprint(snapshot) {
  // Fingerprint the structural state — not content (which changes during text streaming)
  return JSON.stringify({
    elementIds: snapshot.dom.elements.map(function(e) { return e.id; }),
    elementVisibility: snapshot.dom.elements.map(function(e) { return e.isVisible; }),
    selectedIds: snapshot.store ? snapshot.store.selectedElementIds : [],
    interactionState: snapshot.interaction.interactionState,
    mode: snapshot.store ? snapshot.store.mode : null,
    zoom: snapshot.store ? snapshot.store.zoom : null,
    editingId: snapshot.store ? snapshot.store.editingElementId : null,
  });
}
```

### 3.2 Event-Driven (Precision)

Bracket user actions with before/after captures:

```javascript
// Before click
const preClick = await page.evaluate(CAPTURE_FN);
timeline.push({ ...preClick, trigger: 'pre-click' });

// Perform action
await page.mouse.click(x, y);
await page.waitForTimeout(100);  // Let renderer + gizmos update

// After click
const postClick = await page.evaluate(CAPTURE_FN);
timeline.push({ ...postClick, trigger: 'after-click' });
```

### 3.3 Continuous During Drag (High-Frequency)

During mouse drag, capture at high frequency to verify continuity:

```javascript
async function captureWhileDragging(page, fromX, fromY, toX, toY, steps) {
  steps = steps || 20;
  var captures = [];
  var dx = (toX - fromX) / steps;
  var dy = (toY - fromY) / steps;
  
  await page.mouse.move(fromX, fromY);
  await page.mouse.down();
  captures.push(await captureWithTrigger(page, 'drag-start'));
  
  for (var i = 1; i <= steps; i++) {
    await page.mouse.move(fromX + dx * i, fromY + dy * i);
    // Capture every 4th step to avoid overwhelming
    if (i % 4 === 0 || i === steps) {
      captures.push(await captureWithTrigger(page, 'during-drag-' + i));
    }
  }
  
  await page.mouse.up();
  await page.waitForTimeout(100);
  captures.push(await captureWithTrigger(page, 'drag-end'));
  
  return captures;
}
```

### 3.4 Polling with Stability Detection (Safety Net)

For actions with async effects (theme changes, font loading), poll until stable:

```javascript
async function captureUntilStable(page, maxMs, pollMs) {
  maxMs = maxMs || 5000;
  pollMs = pollMs || 250;
  var stableThreshold = 8;  // 8 × 250ms = 2 seconds of no change
  var start = Date.now();
  var lastFingerprint = '';
  var stableCount = 0;
  var captures = [];
  
  while (Date.now() - start < maxMs && stableCount < stableThreshold) {
    var snap = await page.evaluate(CAPTURE_FN);
    var fp = buildFingerprint(snap);
    if (fp !== lastFingerprint) {
      snap.trigger = 'state-changed';
      captures.push(snap);
      lastFingerprint = fp;
      stableCount = 0;
    } else {
      stableCount++;
    }
    await page.waitForTimeout(pollMs);
  }
  
  // Final stable frame
  var finalSnap = await page.evaluate(CAPTURE_FN);
  finalSnap.trigger = 'stable';
  captures.push(finalSnap);
  
  return captures;
}
```

---

## 4. The Mutation Timeline

Diff consecutive snapshots to build a record of every state change. This is where temporal anomalies are detected.

### 4.1 Building the Timeline

```javascript
function buildMutationTimeline(snapshots) {
  var mutations = [];
  
  for (var i = 1; i < snapshots.length; i++) {
    var prev = snapshots[i - 1];
    var curr = snapshots[i];
    if (!prev.store || !curr.store) continue;
    
    // ── Element position/dimension changes ──
    var currKeys = Object.keys(curr.store.elements);
    for (var k = 0; k < currKeys.length; k++) {
      var id = currKeys[k];
      var currEl = curr.store.elements[id];
      var prevEl = prev.store.elements[id];
      
      if (!prevEl) {
        mutations.push({
          frame: i, timestamp: curr.timestamp, type: 'element-added',
          elementId: id, elementType: currEl.type,
          field: 'existence', oldValue: null, newValue: 'created',
        });
        continue;
      }
      
      var fields = ['x', 'y', 'width', 'height', 'rotation', 'opacity', 'hidden'];
      for (var f = 0; f < fields.length; f++) {
        var field = fields[f];
        if (currEl[field] !== prevEl[field]) {
          mutations.push({
            frame: i, timestamp: curr.timestamp, type: 'element-changed',
            elementId: id, elementType: currEl.type,
            field: field, oldValue: prevEl[field], newValue: currEl[field],
            interactionState: curr.interaction.interactionState,
          });
        }
      }
    }
    
    // ── Disappeared elements ──
    var prevKeys = Object.keys(prev.store.elements);
    for (var j = 0; j < prevKeys.length; j++) {
      if (!curr.store.elements[prevKeys[j]]) {
        mutations.push({
          frame: i, timestamp: curr.timestamp, type: 'element-removed',
          elementId: prevKeys[j], elementType: prev.store.elements[prevKeys[j]].type,
          field: 'existence', oldValue: 'present', newValue: null,
        });
      }
    }
    
    // ── Selection changes ──
    var prevSel = JSON.stringify(prev.store.selectedElementIds);
    var currSel = JSON.stringify(curr.store.selectedElementIds);
    if (prevSel !== currSel) {
      mutations.push({
        frame: i, timestamp: curr.timestamp, type: 'selection-changed',
        field: 'selectedElementIds',
        oldValue: prev.store.selectedElementIds,
        newValue: curr.store.selectedElementIds,
      });
    }
    
    // ── Interaction state transitions ──
    if (prev.interaction.interactionState !== curr.interaction.interactionState) {
      mutations.push({
        frame: i, timestamp: curr.timestamp, type: 'interaction-transition',
        field: 'interactionState',
        oldValue: prev.interaction.interactionState,
        newValue: curr.interaction.interactionState,
      });
    }
    
    // ── Mode changes ──
    if (prev.store.mode !== curr.store.mode) {
      mutations.push({
        frame: i, timestamp: curr.timestamp, type: 'mode-changed',
        field: 'mode', oldValue: prev.store.mode, newValue: curr.store.mode,
      });
    }
    
    // ── Zoom/pan changes ──
    if (prev.store.zoom !== curr.store.zoom) {
      mutations.push({
        frame: i, timestamp: curr.timestamp, type: 'viewport-changed',
        field: 'zoom', oldValue: prev.store.zoom, newValue: curr.store.zoom,
      });
    }
  }
  
  return mutations;
}
```

### 4.2 Temporal Invariant Rules

Run these against the mutation timeline to catch bugs that only manifest over time.

```javascript
function checkTemporalRules(mutations, snapshots) {
  var violations = [];
  
  // ── RULE 1: Drag Continuity ──
  // During DRAGGING, element position deltas between frames must be reasonable
  for (var i = 0; i < mutations.length; i++) {
    var m = mutations[i];
    if (m.type === 'element-changed' && m.interactionState === 'DRAGGING'
        && (m.field === 'x' || m.field === 'y')) {
      var delta = Math.abs(m.newValue - m.oldValue);
      if (delta > 200) {  // More than 200px jump in one frame = teleportation
        violations.push({
          rule: 'DRAG_CONTINUITY', severity: 'critical', frame: m.frame,
          message: 'Element ' + m.elementId + ' jumped ' + delta + 'px in ' +
            m.field + ' during drag (frame ' + m.frame + ')',
        });
      }
    }
  }
  
  // ── RULE 2: Interaction State Valid Transitions ──
  var validTransitions = {
    'IDLE': ['DRAGGING', 'RESIZING', 'SELECTING', 'CREATING', 'PANNING'],
    'DRAGGING': ['IDLE'],
    'RESIZING': ['IDLE'],
    'SELECTING': ['IDLE'],
    'CREATING': ['IDLE'],
    'PANNING': ['IDLE'],
  };
  for (var j = 0; j < mutations.length; j++) {
    var mt = mutations[j];
    if (mt.type === 'interaction-transition') {
      var allowed = validTransitions[mt.oldValue];
      if (allowed && allowed.indexOf(mt.newValue) === -1) {
        violations.push({
          rule: 'INVALID_TRANSITION', severity: 'critical', frame: mt.frame,
          message: 'Invalid interaction transition: ' + mt.oldValue + ' → ' + mt.newValue,
        });
      }
    }
  }
  
  // ── RULE 3: No Element Disappearance Without Delete ──
  for (var r = 0; r < mutations.length; r++) {
    if (mutations[r].type === 'element-removed') {
      // Check if a delete action occurred around this frame
      // For now flag all removals — refine by checking for delete keyboard shortcut
      violations.push({
        rule: 'UNEXPECTED_REMOVAL', severity: 'warning', frame: mutations[r].frame,
        message: 'Element ' + mutations[r].elementId + ' disappeared at frame ' + mutations[r].frame,
      });
    }
  }
  
  // ── RULE 4: Idle After Release ──
  // After DRAGGING/RESIZING → ... interaction must reach IDLE within 2 frames
  for (var t = 0; t < mutations.length; t++) {
    var mi = mutations[t];
    if (mi.type === 'interaction-transition' &&
        (mi.oldValue === 'DRAGGING' || mi.oldValue === 'RESIZING') &&
        mi.newValue !== 'IDLE') {
      violations.push({
        rule: 'NO_IDLE_AFTER_RELEASE', severity: 'critical', frame: mi.frame,
        message: 'Interaction went from ' + mi.oldValue + ' to ' + mi.newValue + ' instead of IDLE',
      });
    }
  }
  
  return violations;
}
```

---

## 5. Undo Correctness Verification

A critical use case: after undo, verify element positions match their pre-interaction state.

```javascript
function checkUndoRestoration(preInteractionSnapshot, postUndoSnapshot) {
  var violations = [];
  if (!preInteractionSnapshot.store || !postUndoSnapshot.store) return violations;
  
  var preElements = preInteractionSnapshot.store.elements;
  var postElements = postUndoSnapshot.store.elements;
  
  var keys = Object.keys(preElements);
  for (var i = 0; i < keys.length; i++) {
    var id = keys[i];
    var pre = preElements[id];
    var post = postElements[id];
    if (!post) {
      violations.push({
        code: 'UNDO_ELEMENT_MISSING', severity: 'critical',
        message: 'Element ' + id + ' existed before interaction but missing after undo',
      });
      continue;
    }
    
    var fields = ['x', 'y', 'width', 'height', 'rotation'];
    for (var f = 0; f < fields.length; f++) {
      var field = fields[f];
      if (Math.abs(pre[field] - post[field]) > 1) {
        violations.push({
          code: 'UNDO_RESTORATION_FAILED', severity: 'critical',
          message: 'Element ' + id + '.' + field + ': pre=' + pre[field] +
            ' post-undo=' + post[field] + ' (delta: ' + Math.abs(pre[field] - post[field]) + ')',
        });
      }
    }
  }
  
  return violations;
}
```

---

## 6. Canvas Pixel Verification

For verifying canvas-drawn gizmos at specific coordinates, sample pixels from the interaction canvas.

### 6.1 Selection Box Verification

```javascript
// Verify that the selection box is drawn around the selected element
async function verifySelectionPixels(page, elementBounds, zoom, pan) {
  // Compute expected screen-space position of selection box
  var screenX = elementBounds.x * zoom + pan.x;
  var screenY = elementBounds.y * zoom + pan.y;
  var screenW = elementBounds.width * zoom;
  var screenH = elementBounds.height * zoom;
  
  // Sample pixels at the four edges of the expected selection box
  var edgePoints = [
    { x: screenX + screenW / 2, y: screenY, label: 'top-edge' },           // Top center
    { x: screenX + screenW / 2, y: screenY + screenH, label: 'bottom-edge' }, // Bottom center
    { x: screenX, y: screenY + screenH / 2, label: 'left-edge' },           // Left center
    { x: screenX + screenW, y: screenY + screenH / 2, label: 'right-edge' }, // Right center
  ];
  
  var results = await page.evaluate(function(points) {
    var canvas = document.querySelector('canvas');
    if (!canvas) return null;
    var ctx = canvas.getContext('2d');
    return points.map(function(p) {
      var pixel = ctx.getImageData(Math.round(p.x), Math.round(p.y), 1, 1).data;
      return {
        label: p.label, x: p.x, y: p.y,
        r: pixel[0], g: pixel[1], b: pixel[2], a: pixel[3],
      };
    });
  }, edgePoints);
  
  // Check for accent color (default: #18A0FB = rgb(24, 160, 251))
  // Allow tolerance of ±10 for anti-aliasing
  var anomalies = [];
  if (results) {
    for (var i = 0; i < results.length; i++) {
      var px = results[i];
      var isAccent = Math.abs(px.r - 24) < 10 && Math.abs(px.g - 160) < 10 && Math.abs(px.b - 251) < 10;
      if (!isAccent && px.a > 0) {
        anomalies.push({
          code: 'SELECTION_BOX_MISALIGNED', severity: 'warning',
          message: 'Expected accent color at ' + px.label +
            ' (' + px.x + ',' + px.y + '), got rgb(' + px.r + ',' + px.g + ',' + px.b + ')',
        });
      }
    }
  }
  return anomalies;
}
```

### 6.2 Snap Guide Verification

```javascript
// Verify a vertical snap guide is drawn at the expected x position
async function verifySnapGuide(page, expectedX, zoom, pan) {
  var screenX = expectedX * zoom + pan.x;
  
  // Sample a vertical stripe at the expected position
  var result = await page.evaluate(function(sx) {
    var canvas = document.querySelector('canvas');
    if (!canvas) return null;
    var ctx = canvas.getContext('2d');
    // Sample 10 points along the vertical line
    var hits = 0;
    for (var y = 50; y < canvas.height - 50; y += Math.floor(canvas.height / 10)) {
      var pixel = ctx.getImageData(Math.round(sx), y, 1, 1).data;
      // Snap guides are magenta: #FF00FF = rgb(255, 0, 255)
      if (Math.abs(pixel[0] - 255) < 20 && pixel[1] < 20 && Math.abs(pixel[2] - 255) < 20) {
        hits++;
      }
    }
    return { screenX: sx, hits: hits, total: 10 };
  }, screenX);
  
  // At least 5 of 10 sample points should be magenta
  if (result && result.hits < 5) {
    return {
      code: 'SNAP_GUIDE_NOT_VISIBLE', severity: 'warning',
      message: 'Expected magenta snap guide at x=' + screenX +
        ' but only ' + result.hits + '/10 pixels matched',
    };
  }
  return null;
}
```

---

## 7. Screenshot-Based Semantic Evaluation

For visual correctness checks beyond coordinate math — alignment precision, rendering artifacts, theme consistency.

### 7.1 Comparative Screenshots

```javascript
async function compareInteractionScreenshots(page, action, description) {
  var before = await page.screenshot({ type: 'png' });
  
  // Perform the action
  await action();
  await page.waitForTimeout(150);  // Let canvas re-render
  
  var after = await page.screenshot({ type: 'png' });
  
  return {
    description: description,
    before: before,   // Buffer
    after: after,      // Buffer
    // Pixel diff can be computed offline with pixelmatch or similar
  };
}

// Usage:
var selectResult = await compareInteractionScreenshots(
  page,
  function() { return page.mouse.click(200, 300); },
  'Selecting rectangle at (200, 300) — expect selection box to appear'
);
```

### 7.2 Region-of-Interest Capture

Crop to the area around a specific element for focused analysis:

```javascript
async function captureElementRegion(page, elementId, padding) {
  padding = padding || 20;  // Extra pixels around element for gizmo visibility
  
  var bounds = await page.evaluate(function(id, pad) {
    var el = document.querySelector('[data-element-id="' + id + '"]');
    if (!el) return null;
    var rect = el.getBoundingClientRect();
    return {
      x: Math.max(0, rect.x - pad),
      y: Math.max(0, rect.y - pad),
      width: rect.width + pad * 2,
      height: rect.height + pad * 2,
    };
  }, elementId, padding);
  
  if (!bounds) return null;
  return await page.screenshot({ clip: bounds, type: 'png' });
}
```

### 7.3 LLM Visual Evaluation Prompts

For complex visual judgments, submit region screenshots with structured questions:

```javascript
var visualEvalInput = {
  scenario: 'Select rectangle element',
  description: 'User clicked on a rectangle. Verify selection overlay accuracy.',
  
  regionScreenshot: 'region-rect-1-after-select.png',
  
  questions: [
    {
      id: 'alignment',
      question: 'Does the blue selection outline (thin blue rectangle) align precisely with the element edges? Look for gaps or overlaps.',
      pass_criteria: 'Outline should be within 1px of element edges on all four sides',
    },
    {
      id: 'handles',
      question: 'Are the 8 resize handles (small white squares with blue border) positioned exactly at the corners and edge midpoints of the selection box?',
      pass_criteria: 'Handles centered on corners and midpoints, no visible offset',
    },
    {
      id: 'artifacts',
      question: 'Are there any visual artifacts — double rendering, ghosting, clipping, incorrect z-order (element appearing above the selection box)?',
      pass_criteria: 'No artifacts. Selection box renders above element.',
    },
    {
      id: 'stability',
      question: 'Comparing before and after screenshots, did the element itself move, resize, or change appearance as a result of being selected?',
      pass_criteria: 'Element must not change position, size, or appearance when selected',
    },
  ],
};
```

---

## 8. Output Artifacts

```
test-results/eval-loop/<scenario>-<timestamp>/
├── timeline.json              Full snapshot array (primary artifact)
├── mutations.json             Computed mutation timeline
├── anomaly-report.json        Aggregated anomalies + temporal violations
├── screenshots/
│   ├── 001-baseline.png
│   ├── 002-after-select.png
│   ├── 003-drag-step-04.png
│   ├── 004-drag-step-08.png
│   ├── 005-after-release.png
│   └── 006-after-undo.png
├── screenshot-diffs/          Pixel diffs for consecutive screenshots
├── regions/                   Cropped element regions for focused analysis
│   ├── rect-1-after-select.png
│   └── rect-1-during-drag.png
└── semantic-eval/             Visual evaluation inputs and results
    ├── eval-input.json
    └── eval-result.json
```

### Anomaly Report

```json
{
  "scenario": "S1-select-and-transform",
  "timestamp": "2026-04-11T12:00:00Z",
  "snapshotCount": 15,
  "verdict": "CLEAN",
  "summary": { "critical": 0, "warning": 0, "info": 1 },
  "inlineAnomalies": [],
  "temporalViolations": [],
  "canvasPixelResults": [
    { "check": "selection-box-edges", "result": "PASS", "details": "4/4 edges show accent color" }
  ],
  "semanticFindings": []
}
```

**Verdict: zero critical + zero warning = CLEAN.**

---

## 9. Porting Checklist

When adapting capture for a new area of Story (e.g., presentation mode, collaboration):

```
□ Identify which DOM elements exist in that mode
    Presentation mode: different renderer (PresentationRenderer), no gizmos
    Master mode: placeholder overlays, inherited element dimming
    
□ Identify which Store fields are relevant
    Presentation: state.editor.mode === 'presentation', activeSlideIndex
    Collaboration: remote cursor positions, presence data

□ Identify which CanvasManager state applies
    Presentation mode: no interaction canvas (gizmos disabled)
    Master mode: placeholder overlay gizmos active

□ Add mode-specific inline detectors
    Presentation: "no editing UI visible", "slide transitions complete"
    Master: "placeholder overlays visible on all unselected placeholders"

□ Add mode-specific temporal rules
    Presentation: "slide transition completes within 600ms"
    Collaboration: "remote cursor position updates within 200ms of event"

□ Test the capture function by running it in browser console
    Navigate to the mode, paste CAPTURE_FN, verify output makes sense
```
