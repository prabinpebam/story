/**
 * Eval Loop Helpers — Capture & Detect
 *
 * Captures a three-layer snapshot (Store + DOM + Interaction) from the running
 * Story app and runs inline anomaly detection.  All capture logic executes
 * inside the browser via page.evaluate().
 */

import { Page } from '@playwright/test';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StoreElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  hidden: boolean;
  locked: boolean;
  parentId: string | null;
  source: string;
  name: string;
  children?: string[];
}

export interface StoreLayer {
  mode: string;
  activeSlideId: string;
  selectedElementIds: string[];
  editingElementId: string | null;
  activeTool: string;
  zoom: number;
  pan: { x: number; y: number };
  isInteracting: boolean;
  elements: Record<string, StoreElement>;
  elementOrder: string[];
}

export interface DomElement {
  id: string;
  type: string;
  shapeKind: string;
  source: string;
  isPlaceholder: boolean;
  inlinePosition: { left: number; top: number; width: number; height: number };
  transform: string;
  zIndex: number;
  opacity: number;
  display: string;
  screenRect: { x: number; y: number; width: number; height: number };
  isVisible: boolean;
  hasTextContent: boolean;
  hasSvgGeometry: boolean;
}

export interface DomLayer {
  slidePresent: boolean;
  slideId: string | null;
  elementCount: number;
  elements: DomElement[];
  zoomDisplay: string | null;
}

export interface InteractionLayer {
  available: boolean;
  interactionState: string;
  interactionAction: string | null;
  activeHandle: string | null;
  hoveredElementId: string | null;
  activeGuides: Array<{ type: string; x?: number; y?: number }>;
  dragStart: { x: number; y: number } | null;
  dragCurrent: { x: number; y: number } | null;
  selectionBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  } | null;
}

export interface Anomaly {
  code: string;
  severity: 'critical' | 'warning';
  category: string;
  message: string;
}

export interface Snapshot {
  timestamp: number;
  trigger: string;
  store: StoreLayer | null;
  dom: DomLayer;
  interaction: InteractionLayer;
  viewport: { zoom: number; pan: { x: number; y: number } };
  anomalies: Anomaly[];
}

// ─── Capture Function (runs inside browser) ──────────────────────────────────

/**
 * ES5 capture function serialised as a string.
 * Executed via page.evaluate() to read Store + DOM + CanvasManager in one
 * synchronous pass.
 */
const CAPTURE_FN = `(function() {
  function qsa(sel) { return [].slice.call(document.querySelectorAll(sel)); }
  function ga(el, a) { return el ? (el.getAttribute(a) || '') : ''; }
  function pf(v) { return parseFloat(v) || 0; }

  // ── Store Layer ──
  var storeState = null;
  try {
    var s = window.__TEST_STORE__ ? window.__TEST_STORE__.getState() : null;
    if (s) {
      var editor = s.editor || {};
      var slideId = editor.activeSlideId || editor.activeMasterId;
      var slide = s.slides ? s.slides[slideId] : null;
      var elOrder = (slide && (slide.effectiveOrder || slide.elementOrder)) || [];
      var elMap = (slide && (slide.effectiveElements || slide.elements)) || {};
      var elements = {};
      for (var i = 0; i < elOrder.length; i++) {
        var id = elOrder[i];
        var el = elMap[id];
        if (el) {
          elements[id] = {
            id: el.id, type: el.type,
            x: el.x, y: el.y, width: el.width, height: el.height,
            rotation: el.rotation || 0,
            opacity: el.opacity != null ? el.opacity : 1,
            hidden: !!el.hidden, locked: !!el.locked,
            parentId: el.parentId || null,
            source: el.source || 'slide', name: el.name || '',
            children: el.children || null
          };
        }
      }
      storeState = {
        mode: editor.mode || 'edit',
        activeSlideId: slideId,
        selectedElementIds: [].concat(editor.selectedElementIds || []),
        editingElementId: editor.editingElementId || null,
        activeTool: editor.activeToolId || editor.activeTool || 'select',
        zoom: editor.zoom || 1,
        pan: { x: (editor.pan && editor.pan.x) || 0, y: (editor.pan && editor.pan.y) || 0 },
        isInteracting: !!(s.ui && s.ui.isInteracting),
        elements: elements,
        elementOrder: elOrder
      };
    }
  } catch(e) {}

  // ── DOM Layer ──
  var slideView = document.querySelector('[data-testid="slide-view"]');
  var domElements = qsa('.slide-element[data-element-id]').map(function(el) {
    var st = el.style;
    var comp = getComputedStyle(el);
    var rect = el.getBoundingClientRect();
    return {
      id: ga(el, 'data-element-id'),
      type: ga(el, 'data-element-type'),
      shapeKind: ga(el, 'data-shape-kind'),
      source: ga(el, 'data-source'),
      isPlaceholder: ga(el, 'data-is-placeholder') === 'true',
      inlinePosition: {
        left: pf(st.left), top: pf(st.top),
        width: pf(st.width), height: pf(st.height)
      },
      transform: st.transform || 'none',
      zIndex: parseInt(st.zIndex) || 0,
      opacity: pf(comp.opacity),
      display: comp.display,
      screenRect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      isVisible: comp.display !== 'none' && pf(comp.opacity) > 0 && rect.width > 0 && rect.height > 0,
      hasTextContent: !!(el.querySelector('[contenteditable]') && (el.querySelector('[contenteditable]').textContent || '').length > 0),
      hasSvgGeometry: !!el.querySelector('svg path, svg line, svg circle, svg ellipse, svg rect, svg polygon')
    };
  });
  var zoomEl = document.getElementById('zoom-display');
  var domState = {
    slidePresent: !!slideView,
    slideId: slideView ? ga(slideView, 'data-slide-id') : null,
    elementCount: domElements.length,
    elements: domElements,
    zoomDisplay: zoomEl ? (zoomEl.textContent || '').trim() : null
  };

  // ── Interaction Layer ──
  var interactionState = { available: false };
  try {
    var cm = window.__TEST_CANVAS_MANAGER__;
    if (cm) {
      interactionState = {
        available: true,
        interactionState: cm.interactionState || 'IDLE',
        interactionAction: cm.interactionAction || null,
        activeHandle: cm.activeHandle || null,
        hoveredElementId: cm.hoveredElementId || null,
        activeGuides: (cm.activeGuides || []).map(function(g) {
          return { type: g.type, x: g.x, y: g.y };
        }),
        dragStart: cm.dragStart ? { x: cm.dragStart.x, y: cm.dragStart.y } : null,
        dragCurrent: cm.dragCurrent ? { x: cm.dragCurrent.x, y: cm.dragCurrent.y } : null,
        selectionBounds: null
      };
    }
  } catch(e) {}

  // ── Inline Anomaly Detection ──
  var anomalies = [];

  // A1: Element count mismatch
  if (storeState && domState.slidePresent) {
    var storeVisible = 0;
    var sKeys = Object.keys(storeState.elements);
    for (var m = 0; m < sKeys.length; m++) {
      if (!storeState.elements[sKeys[m]].hidden) storeVisible++;
    }
    if (storeVisible !== domState.elementCount) {
      anomalies.push({ code: 'ELEMENT_COUNT_MISMATCH', severity: 'warning',
        category: 'sync', message: 'Store visible=' + storeVisible + ', DOM count=' + domState.elementCount });
    }
  }

  // A2: Position drift (skip placeholders/inherited — their coords go through master→slide mapping)
  if (storeState) {
    for (var p = 0; p < domElements.length; p++) {
      var de = domElements[p];
      var se = storeState.elements[de.id];
      if (se && de.isVisible) {
        var dx = Math.abs(de.inlinePosition.left - se.x);
        var dy = Math.abs(de.inlinePosition.top - se.y);
        if (dx > 1 || dy > 1) {
          var isInherited = de.isPlaceholder || de.source === 'master' || se.source === 'master';
          anomalies.push({ code: 'POSITION_DRIFT', severity: isInherited ? 'warning' : 'critical',
            category: 'spatial', message: de.id + ': DOM(' + de.inlinePosition.left + ',' + de.inlinePosition.top + ') vs store(' + se.x + ',' + se.y + ')' });
        }
      }
    }
  }

  // A3: Editing element not in selection
  if (storeState && storeState.editingElementId) {
    if (storeState.selectedElementIds.indexOf(storeState.editingElementId) === -1) {
      anomalies.push({ code: 'EDITING_NOT_SELECTED', severity: 'critical',
        category: 'state', message: 'editingElementId not in selectedElementIds' });
    }
  }

  // A4: Drag without selection
  if (interactionState.available && interactionState.interactionState === 'DRAGGING') {
    if (!storeState || storeState.selectedElementIds.length === 0) {
      anomalies.push({ code: 'DRAG_WITHOUT_SELECTION', severity: 'critical',
        category: 'state', message: 'DRAGGING with no selection' });
    }
  }

  return {
    timestamp: Date.now(),
    trigger: 'manual',
    store: storeState,
    dom: domState,
    interaction: interactionState,
    viewport: storeState ? { zoom: storeState.zoom, pan: storeState.pan } : { zoom: 1, pan: { x: 0, y: 0 } },
    anomalies: anomalies
  };
})()`;

// ─── Public API ──────────────────────────────────────────────────────────────

/** Capture a single snapshot. */
export async function capture(page: Page, trigger?: string): Promise<Snapshot> {
  const snap: Snapshot = await page.evaluate(CAPTURE_FN);
  if (trigger) snap.trigger = trigger;
  return snap;
}

/** Capture before and after an action, returning both snapshots. */
export async function bracket(
  page: Page,
  action: () => Promise<void>,
  settleMs = 150,
): Promise<{ before: Snapshot; after: Snapshot }> {
  const before = await capture(page, 'pre-action');
  await action();
  await page.waitForTimeout(settleMs);
  const after = await capture(page, 'post-action');
  return { before, after };
}

/** Wait for CanvasManager to be exposed after page load. */
export async function waitForCanvasManager(page: Page, timeoutMs = 10_000) {
  await page.waitForFunction(
    () => !!(window as any).__TEST_CANVAS_MANAGER__,
    null,
    { timeout: timeoutMs },
  );
}

// ─── Assertion Helpers ───────────────────────────────────────────────────────

/** Assert no critical anomalies in a snapshot. */
export function assertNoCriticalAnomalies(snap: Snapshot) {
  const critical = snap.anomalies.filter(a => a.severity === 'critical');
  if (critical.length > 0) {
    const msgs = critical.map(a => `[${a.code}] ${a.message}`).join('\n  ');
    throw new Error(`Critical anomalies detected:\n  ${msgs}`);
  }
}

/** Assert selection contains exactly the given IDs. */
export function assertSelection(snap: Snapshot, expectedIds: string[]) {
  const actual = [...(snap.store?.selectedElementIds ?? [])].sort();
  const expected = [...expectedIds].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `Selection mismatch.\n  Expected: [${expected}]\n  Actual:   [${actual}]`,
    );
  }
}

/** Assert selection is empty. */
export function assertSelectionEmpty(snap: Snapshot) {
  assertSelection(snap, []);
}

/** Assert interaction state machine is in given state. */
export function assertInteractionState(snap: Snapshot, expected: string) {
  const actual = snap.interaction?.interactionState ?? 'UNKNOWN';
  if (actual !== expected) {
    throw new Error(
      `InteractionState mismatch. Expected: ${expected}, Actual: ${actual}`,
    );
  }
}

/** Assert no editing mode is active. */
export function assertNotEditing(snap: Snapshot) {
  if (snap.store?.editingElementId != null) {
    throw new Error(
      `Expected no editing, but editingElementId = ${snap.store.editingElementId}`,
    );
  }
}

/** Assert editing mode is active for the given element. */
export function assertEditing(snap: Snapshot, elementId: string) {
  if (snap.store?.editingElementId !== elementId) {
    throw new Error(
      `Expected editing ${elementId}, but editingElementId = ${snap.store?.editingElementId}`,
    );
  }
}
