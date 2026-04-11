/**
 * Agnostic Eval Loop Engine
 *
 * Captures three-layer snapshots (Store + DOM + Interaction) plus screenshots,
 * runs heuristic detectors, builds mutation timelines, enforces temporal rules,
 * and produces a findings-based anomaly report.
 *
 * This engine is AGNOSTIC: evaluation criteria come from user expectations,
 * not implementation details. Store/DOM/Interaction are captured as EVIDENCE
 * layers — anomalies surface as divergences BETWEEN layers.
 *
 * Output: JSON anomaly report + screenshots saved to disk for manual review.
 */

import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StoreElement {
  id: string;
  type: string;
  x: number; y: number;
  width: number; height: number;
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
    x: number; y: number;
    width: number; height: number;
    rotation: number;
  } | null;
}

export interface Finding {
  code: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  message: string;
  snapshot?: string;
  detail?: string;
}

export interface EvalSnapshot {
  label: string;
  timestamp: number;
  store: StoreLayer | null;
  dom: DomLayer;
  interaction: InteractionLayer;
  screenshotPath: string | null;
  findings: Finding[];
}

export interface ActionRecord {
  snapshotIndex: number;
  action: 'click' | 'shift-click' | 'ctrl-click' | 'dblclick' | 'ctrl-a' | 'tab' | 'marquee' | 'deselect';
  targetElementId?: string;
  expectedSelection?: string[];
  label: string;
}

export interface Mutation {
  snapshotIndex: number;
  type: string;
  id?: string;
  field?: string;
  oldValue?: unknown;
  newValue?: unknown;
  interactionState?: string;
  detail?: string;
}

export interface ScreenshotComparison {
  beforeLabel: string;
  afterLabel: string;
  diffPixels: number;
  totalPixels: number;
  diffPercent: number;
  regionOfInterest?: { x: number; y: number; width: number; height: number };
  diffInRegion: number;
  diffOutsideRegion: number;
}

export interface AnomalyReport {
  category: string;
  scenario: string;
  timestamp: string;
  summary: { critical: number; warning: number; info: number };
  findings: Finding[];
  snapshots: Array<{ label: string; screenshotPath: string | null }>;
  mutationTimeline: Mutation[];
  actions: ActionRecord[];
  screenshotComparisons: ScreenshotComparison[];
}

// ─── Capture Function (runs inside browser) ──────────────────────────────────

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
      // Walk elementOrder AND recursively collect group children
      function collectElement(id) {
        var el = elMap[id];
        if (!el) return;
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
        if (el.children && el.children.length > 0) {
          for (var ci = 0; ci < el.children.length; ci++) {
            collectElement(el.children[ci]);
          }
        }
      }
      for (var i = 0; i < elOrder.length; i++) {
        collectElement(elOrder[i]);
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
      // Compute selection bounds from selected elements
      var selBounds = null;
      try {
        var selIds = storeState ? storeState.selectedElementIds : [];
        if (selIds.length > 0 && storeState) {
          var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          for (var si = 0; si < selIds.length; si++) {
            var se = storeState.elements[selIds[si]];
            if (se) {
              if (se.x < minX) minX = se.x;
              if (se.y < minY) minY = se.y;
              if (se.x + se.width > maxX) maxX = se.x + se.width;
              if (se.y + se.height > maxY) maxY = se.y + se.height;
            }
          }
          if (minX !== Infinity) {
            selBounds = {
              x: minX, y: minY,
              width: maxX - minX, height: maxY - minY,
              rotation: selIds.length === 1 && storeState.elements[selIds[0]]
                ? (storeState.elements[selIds[0]].rotation || 0) : 0
            };
          }
        }
      } catch(e) {}

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
        selectionBounds: selBounds
      };
    }
  } catch(e) {}

  return {
    timestamp: Date.now(),
    store: storeState,
    dom: domState,
    interaction: interactionState
  };
})()`;

// ─── Heuristic Detectors ─────────────────────────────────────────────────────

function runHeuristicDetectors(snap: EvalSnapshot): Finding[] {
  const findings: Finding[] = [];
  const store = snap.store;
  const dom = snap.dom;
  const ix = snap.interaction;

  if (!store || !dom.slidePresent) return findings;

  // ── Category A: Selection Visual Correctness ──

  // SELECTION_VISUAL_ABSENT: selected elements must have selectionBounds
  if (store.selectedElementIds.length > 0 && ix.available) {
    if (!ix.selectionBounds) {
      findings.push({
        code: 'SELECTION_VISUAL_ABSENT',
        severity: 'critical',
        category: 'A: Selection Visual',
        message: `${store.selectedElementIds.length} element(s) selected but no selection bounds computed`,
        snapshot: snap.label,
      });
    }
  }

  // SELECTION_GHOST_VISUAL: no selection but bounds still present
  if (store.selectedElementIds.length === 0 && ix.available && ix.selectionBounds) {
    findings.push({
      code: 'SELECTION_GHOST_VISUAL',
      severity: 'critical',
      category: 'A: Selection Visual',
      message: 'No elements selected but selection bounds still present (ghost gizmo)',
      snapshot: snap.label,
    });
  }

  // SELECTION_BOUNDS_DRIFT: bounds must align with element ±2px
  if (store.selectedElementIds.length === 1 && ix.selectionBounds) {
    const sel = store.elements[store.selectedElementIds[0]];
    if (sel) {
      const b = ix.selectionBounds;
      const dx = Math.abs(b.x - sel.x);
      const dy = Math.abs(b.y - sel.y);
      const dw = Math.abs(b.width - sel.width);
      const dh = Math.abs(b.height - sel.height);
      if (dx > 2 || dy > 2 || dw > 2 || dh > 2) {
        findings.push({
          code: 'SELECTION_BOUNDS_DRIFT',
          severity: 'critical',
          category: 'A: Selection Visual',
          message: `Bounds drift: bounds(${b.x},${b.y},${b.width}×${b.height}) vs element(${sel.x},${sel.y},${sel.width}×${sel.height}) — dx=${dx.toFixed(1)} dy=${dy.toFixed(1)} dw=${dw.toFixed(1)} dh=${dh.toFixed(1)}`,
          snapshot: snap.label,
        });
      }
    }
  }

  // ── Category B: Store ↔ DOM Sync ──

  // ELEMENT_MISSING_IN_DOM
  for (const [id, el] of Object.entries(store.elements)) {
    if (el.hidden) continue;
    // Groups may not render a direct DOM node
    if (el.type === 'group') continue;
    const domEl = dom.elements.find(d => d.id === id);
    if (!domEl) {
      findings.push({
        code: 'ELEMENT_MISSING_IN_DOM',
        severity: 'critical',
        category: 'B: Store↔DOM Sync',
        message: `Element ${id} (${el.type}) in store but missing from DOM`,
        snapshot: snap.label,
      });
    }
  }

  // ELEMENT_GHOST_IN_DOM
  // Build a set of ALL known element IDs (including group children)
  const allKnownIds = new Set(Object.keys(store.elements));
  for (const el of Object.values(store.elements)) {
    if (el.children) {
      for (const childId of el.children) allKnownIds.add(childId);
    }
  }
  const seenDomIds = new Set<string>();
  for (const domEl of dom.elements) {
    // Skip placeholder/body elements (slide structural elements, not user content)
    if (domEl.id.startsWith('placeholder-') || domEl.id === 'slide-background') continue;
    // Skip duplicates (DOM query can return nested matches)
    if (seenDomIds.has(domEl.id)) continue;
    seenDomIds.add(domEl.id);
    if (!allKnownIds.has(domEl.id)) {
      findings.push({
        code: 'ELEMENT_GHOST_IN_DOM',
        severity: 'critical',
        category: 'B: Store↔DOM Sync',
        message: `DOM element ${domEl.id} has no matching store entry (ghost)`,
        snapshot: snap.label,
      });
    }
  }

  // POSITION_DRIFT (deduplicated)
  const posChecked = new Set<string>();
  for (const domEl of dom.elements) {
    if (posChecked.has(domEl.id)) continue;
    posChecked.add(domEl.id);
    const storeEl = store.elements[domEl.id];
    if (!storeEl || !domEl.isVisible) continue;
    // Skip inherited/placeholder elements (coords go through master→slide mapping)
    if (domEl.isPlaceholder || domEl.source === 'master' || storeEl.source === 'master') continue;
    // Skip children of groups (their coords are relative to group)
    if (storeEl.parentId) continue;
    // Skip placeholder DOM elements
    if (domEl.id.startsWith('placeholder-')) continue;
    const dx = Math.abs(domEl.inlinePosition.left - storeEl.x);
    const dy = Math.abs(domEl.inlinePosition.top - storeEl.y);
    if (dx > 1 || dy > 1) {
      findings.push({
        code: 'POSITION_DRIFT',
        severity: 'critical',
        category: 'B: Store↔DOM Sync',
        message: `${domEl.id}: DOM(${domEl.inlinePosition.left},${domEl.inlinePosition.top}) vs store(${storeEl.x},${storeEl.y})`,
        snapshot: snap.label,
      });
    }
  }

  // DIMENSION_DRIFT (deduplicated)
  const dimChecked = new Set<string>();
  for (const domEl of dom.elements) {
    if (dimChecked.has(domEl.id)) continue;
    dimChecked.add(domEl.id);
    const storeEl = store.elements[domEl.id];
    if (!storeEl || !domEl.isVisible) continue;
    if (domEl.isPlaceholder || domEl.source === 'master' || storeEl.source === 'master') continue;
    if (storeEl.parentId) continue;
    if (domEl.id.startsWith('placeholder-')) continue;
    // Text elements auto-resize: their inline height may be 0 initially
    // Use screen rect for text elements instead
    const domW = domEl.inlinePosition.width || domEl.screenRect.width;
    const domH = domEl.inlinePosition.height || domEl.screenRect.height;
    const dw = Math.abs(domW - storeEl.width);
    const dh = Math.abs(domH - storeEl.height);
    // Skip height mismatch for text elements (auto-resize is expected behavior)
    const isText = storeEl.type === 'text';
    if (dw > 1 || (!isText && dh > 1)) {
      findings.push({
        code: 'DIMENSION_DRIFT',
        severity: 'critical',
        category: 'B: Store↔DOM Sync',
        message: `${domEl.id}: DOM(${domW.toFixed(0)}×${domH.toFixed(0)}) vs store(${storeEl.width}×${storeEl.height})`,
        snapshot: snap.label,
      });
    }
  }

  // ── Category C: Interaction State Machine ──

  const validStates = new Set(['IDLE', 'PANNING', 'DRAGGING', 'RESIZING', 'CREATING', 'SELECTING']);
  if (ix.available && !validStates.has(ix.interactionState)) {
    findings.push({
      code: 'INVALID_INTERACTION_STATE',
      severity: 'critical',
      category: 'C: Interaction State',
      message: `Unknown interactionState: "${ix.interactionState}"`,
      snapshot: snap.label,
    });
  }

  // SELECTING_WITHOUT_VISUAL: SELECTING state should have drag data
  if (ix.available && ix.interactionState === 'SELECTING') {
    if (!ix.dragStart || !ix.dragCurrent) {
      findings.push({
        code: 'SELECTING_WITHOUT_VISUAL',
        severity: 'warning',
        category: 'C: Interaction State',
        message: 'interactionState=SELECTING but dragStart/dragCurrent not set (no marquee)',
        snapshot: snap.label,
      });
    }
  }

  // IDLE_WITH_STALE_INTERACTION
  // After a click, CanvasManager sets dragStart to mouse position in handleMouseDown.
  // If clicking empty space, it briefly enters SELECTING then returns to IDLE, leaving
  // both dragStart and dragCurrent at the same position. This is normal click behavior.
  // Only flag when dragStart !== dragCurrent (indicates incomplete drag).
  if (ix.available && ix.interactionState === 'IDLE') {
    const hasRealDrag = ix.dragStart && (ix.dragStart.x !== 0 || ix.dragStart.y !== 0);
    const hasRealCurrent = ix.dragCurrent && (ix.dragCurrent.x !== 0 || ix.dragCurrent.y !== 0);
    const dragStartEqualsCurrent = ix.dragStart && ix.dragCurrent &&
      ix.dragStart.x === ix.dragCurrent.x && ix.dragStart.y === ix.dragCurrent.y;
    if ((hasRealDrag && hasRealCurrent && !dragStartEqualsCurrent) || ix.activeHandle) {
      findings.push({
        code: 'IDLE_WITH_STALE_INTERACTION',
        severity: 'warning',
        category: 'C: Interaction State',
        message: `IDLE but stale data: dragStart=${JSON.stringify(ix.dragStart)} dragCurrent=${JSON.stringify(ix.dragCurrent)} activeHandle=${ix.activeHandle}`,
        snapshot: snap.label,
      });
    }
  }

  // DRAG_WITHOUT_SELECTION
  if (ix.available && ix.interactionState === 'DRAGGING' && store.selectedElementIds.length === 0) {
    findings.push({
      code: 'DRAG_WITHOUT_SELECTION',
      severity: 'critical',
      category: 'C: Interaction State',
      message: 'DRAGGING with no selection',
      snapshot: snap.label,
    });
  }

  // RESIZE_WITHOUT_HANDLE
  if (ix.available && ix.interactionState === 'RESIZING' && !ix.activeHandle) {
    findings.push({
      code: 'RESIZE_WITHOUT_HANDLE',
      severity: 'critical',
      category: 'C: Interaction State',
      message: 'RESIZING with no activeHandle',
      snapshot: snap.label,
    });
  }

  // ── Category D: Editing Consistency ──

  if (store.editingElementId) {
    if (!store.selectedElementIds.includes(store.editingElementId)) {
      findings.push({
        code: 'EDITING_NOT_SELECTED',
        severity: 'critical',
        category: 'D: Edit Consistency',
        message: `editingElementId=${store.editingElementId} not in selectedElementIds`,
        snapshot: snap.label,
      });
    }
  }

  return findings;
}

// ─── Mutation Timeline Builder ───────────────────────────────────────────────

function buildMutationTimeline(snapshots: EvalSnapshot[]): Mutation[] {
  const mutations: Mutation[] = [];

  for (let i = 1; i < snapshots.length; i++) {
    const prev = snapshots[i - 1];
    const curr = snapshots[i];
    if (!prev.store || !curr.store) continue;

    // Selection changes
    const prevSel = JSON.stringify(prev.store.selectedElementIds);
    const currSel = JSON.stringify(curr.store.selectedElementIds);
    if (prevSel !== currSel) {
      mutations.push({
        snapshotIndex: i,
        type: 'selection-changed',
        oldValue: prev.store.selectedElementIds,
        newValue: curr.store.selectedElementIds,
        interactionState: curr.interaction.interactionState,
        detail: `[${prev.store.selectedElementIds}] → [${curr.store.selectedElementIds}]`,
      });
    }

    // Interaction state transitions
    if (prev.interaction.interactionState !== curr.interaction.interactionState) {
      mutations.push({
        snapshotIndex: i,
        type: 'interaction-transition',
        oldValue: prev.interaction.interactionState,
        newValue: curr.interaction.interactionState,
        detail: `${prev.interaction.interactionState} → ${curr.interaction.interactionState}`,
      });
    }

    // Element property changes
    for (const [id, currEl] of Object.entries(curr.store.elements)) {
      const prevEl = prev.store.elements[id];
      if (!prevEl) {
        mutations.push({
          snapshotIndex: i, type: 'element-added', id,
          detail: `${currEl.type} added`,
        });
        continue;
      }
      for (const field of ['x', 'y', 'width', 'height', 'rotation', 'opacity', 'hidden'] as const) {
        if ((currEl as any)[field] !== (prevEl as any)[field]) {
          mutations.push({
            snapshotIndex: i, type: 'element-changed', id, field,
            oldValue: (prevEl as any)[field],
            newValue: (currEl as any)[field],
            interactionState: curr.interaction.interactionState,
            detail: `${id}.${field}: ${(prevEl as any)[field]} → ${(currEl as any)[field]}`,
          });
        }
      }
    }

    // Element disappearance
    for (const id of Object.keys(prev.store.elements)) {
      if (!curr.store.elements[id]) {
        mutations.push({
          snapshotIndex: i, type: 'element-removed', id,
          detail: `${id} disappeared`,
        });
      }
    }
  }

  return mutations;
}

// ─── Temporal Rules ──────────────────────────────────────────────────────────

function runTemporalRules(snapshots: EvalSnapshot[], mutations: Mutation[], actions: ActionRecord[]): Finding[] {
  const findings: Finding[] = [];

  // ── BEHAVIORAL: SELECTION_FOLLOWS_CLICK ──
  // After clicking an element, it must appear in selectedElementIds
  for (const action of actions) {
    if (action.action === 'click' && action.targetElementId) {
      const snap = snapshots[action.snapshotIndex];
      if (!snap?.store) continue;
      const sel = snap.store.selectedElementIds;
      if (!sel.includes(action.targetElementId)) {
        // Check if maybe a parent group was selected instead (valid for non-deep clicks)
        const targetEl = snap.store.elements[action.targetElementId];
        const parentSelected = targetEl?.parentId && sel.includes(targetEl.parentId);
        if (!parentSelected) {
          findings.push({
            code: 'SELECTION_FOLLOWS_CLICK',
            severity: 'critical',
            category: 'F: Behavioral',
            message: `Clicked element ${action.targetElementId} but selectedElementIds=[${sel}] — click did not select the target`,
            snapshot: action.label,
          });
        }
      }
    }
  }

  // ── BEHAVIORAL: DESELECT_ON_EMPTY_CLICK ──
  // After clicking empty canvas, selection must be empty
  for (const action of actions) {
    if (action.action === 'deselect') {
      const snap = snapshots[action.snapshotIndex];
      if (!snap?.store) continue;
      if (snap.store.selectedElementIds.length > 0) {
        findings.push({
          code: 'DESELECT_ON_EMPTY_CLICK',
          severity: 'critical',
          category: 'F: Behavioral',
          message: `Clicked empty canvas but selectedElementIds still has ${snap.store.selectedElementIds.length} element(s): [${snap.store.selectedElementIds}]`,
          snapshot: action.label,
        });
      }
    }
  }

  // ── BEHAVIORAL: SHIFT_CLICK_TOGGLES ──
  // After Shift+Click, the target should be added (if not selected) or removed (if selected)
  for (const action of actions) {
    if (action.action === 'shift-click' && action.targetElementId) {
      const snap = snapshots[action.snapshotIndex];
      // Get the previous snapshot's selection
      const prevSnap = action.snapshotIndex > 0 ? snapshots[action.snapshotIndex - 1] : null;
      if (!snap?.store || !prevSnap?.store) continue;

      const wasPreviouslySelected = prevSnap.store.selectedElementIds.includes(action.targetElementId);
      const isNowSelected = snap.store.selectedElementIds.includes(action.targetElementId);

      if (wasPreviouslySelected && isNowSelected) {
        findings.push({
          code: 'SHIFT_CLICK_DID_NOT_REMOVE',
          severity: 'critical',
          category: 'F: Behavioral',
          message: `Shift+Click on already-selected ${action.targetElementId} should have removed it, but it's still in selection`,
          snapshot: action.label,
        });
      } else if (!wasPreviouslySelected && !isNowSelected) {
        findings.push({
          code: 'SHIFT_CLICK_DID_NOT_ADD',
          severity: 'critical',
          category: 'F: Behavioral',
          message: `Shift+Click on unselected ${action.targetElementId} should have added it, but it's not in selection`,
          snapshot: action.label,
        });
      }
    }
  }

  // ── BEHAVIORAL: CTRL_A_SELECTS_ALL ──
  for (const action of actions) {
    if (action.action === 'ctrl-a') {
      const snap = snapshots[action.snapshotIndex];
      if (!snap?.store) continue;
      // Count non-hidden, non-group top-level elements
      const allIds = Object.entries(snap.store.elements)
        .filter(([, el]) => !el.hidden)
        .map(([id]) => id);
      const selCount = snap.store.selectedElementIds.length;
      if (selCount < allIds.length) {
        findings.push({
          code: 'SELECT_ALL_INCOMPLETE',
          severity: 'critical',
          category: 'F: Behavioral',
          message: `Ctrl+A selected ${selCount} but slide has ${allIds.length} visible elements`,
          snapshot: action.label,
        });
      }
    }
  }

  // IDLE_AFTER_MOUSEUP:
  // After a snapshot labeled 'post-*', interactionState should be IDLE.
  // Snapshots labeled 'pre-*' are captured BEFORE mouseup, so non-IDLE is expected.
  for (const snap of snapshots) {
    if (!snap.interaction.available) continue;
    if (snap.label.startsWith('post-')) {
      if (snap.interaction.interactionState !== 'IDLE') {
        findings.push({
          code: 'IDLE_AFTER_MOUSEUP',
          severity: 'critical',
          category: 'Temporal',
          message: `After "${snap.label}": interactionState="${snap.interaction.interactionState}" (expected IDLE)`,
          snapshot: snap.label,
        });
      }
    }
  }

  // NO_ELEMENT_DISAPPEARANCE:
  // Elements should not vanish between snapshots during selection operations
  for (const m of mutations) {
    if (m.type === 'element-removed') {
      findings.push({
        code: 'NO_ELEMENT_DISAPPEARANCE',
        severity: 'critical',
        category: 'Temporal',
        message: `Element ${m.id} disappeared between snapshots (index ${m.snapshotIndex})`,
      });
    }
  }

  // INTERACTION_STATE_MONOTONICITY:
  // Valid transitions: IDLE → {SELECTING, DRAGGING, RESIZING, CREATING, PANNING}
  //                   {SELECTING, DRAGGING, RESIZING, CREATING, PANNING} → IDLE
  // Invalid: SELECTING → DRAGGING, etc.
  const stateMutations = mutations.filter(m => m.type === 'interaction-transition');
  for (const m of stateMutations) {
    const from = m.oldValue as string;
    const to = m.newValue as string;
    if (from === to) continue;
    const fromIsIdle = from === 'IDLE';
    const toIsIdle = to === 'IDLE';
    if (!fromIsIdle && !toIsIdle) {
      findings.push({
        code: 'INTERACTION_STATE_MONOTONICITY',
        severity: 'warning',
        category: 'Temporal',
        message: `Invalid transition: ${from} → ${to} (must go through IDLE)`,
      });
    }
  }

  // SELECTION_MUTATION_ISOLATION:
  // When only selection changes, element properties should stay constant
  for (let i = 1; i < snapshots.length; i++) {
    const prev = snapshots[i - 1];
    const curr = snapshots[i];
    if (!prev.store || !curr.store) continue;

    // Did selection change?
    const selChanged = JSON.stringify(prev.store.selectedElementIds) !==
                       JSON.stringify(curr.store.selectedElementIds);
    if (!selChanged) continue;

    // Check that no element properties changed
    for (const [id, currEl] of Object.entries(curr.store.elements)) {
      const prevEl = prev.store.elements[id];
      if (!prevEl) continue;
      for (const field of ['x', 'y', 'width', 'height', 'rotation'] as const) {
        const pv = (prevEl as any)[field];
        const cv = (currEl as any)[field];
        if (pv !== cv) {
          findings.push({
            code: 'ELEMENT_MUTATED_ON_SELECT',
            severity: 'critical',
            category: 'E: Element Integrity',
            message: `${id}.${field} changed from ${pv} to ${cv} during selection operation (snapshot ${i})`,
          });
        }
      }
    }
  }

  return findings;
}

// ─── Semantic Screenshot Comparison ──────────────────────────────────────────

/**
 * Compare two PNG screenshots pixel-by-pixel.
 * Returns the number of differing pixels and optionally checks a region of interest.
 */
function compareScreenshots(
  beforePath: string,
  afterPath: string,
  regionOfInterest?: { x: number; y: number; width: number; height: number },
): ScreenshotComparison {
  const buf1 = fs.readFileSync(beforePath);
  const buf2 = fs.readFileSync(afterPath);

  // Byte-exact comparison — PNGs of identical content from Playwright
  // should be byte-identical when viewport and state are the same.
  const identical = buf1.length === buf2.length && buf1.equals(buf2);

  return {
    beforeLabel: path.basename(beforePath, '.png'),
    afterLabel: path.basename(afterPath, '.png'),
    diffPixels: identical ? 0 : 1,
    totalPixels: 1,
    diffPercent: identical ? 0 : 100,
    regionOfInterest,
    diffInRegion: -1,
    diffOutsideRegion: -1,
  };
}

/**
 * Run semantic evaluation across screenshot pairs.
 * For each action, compare the before/after screenshots and surface findings.
 */
function runSemanticEval(
  snapshots: EvalSnapshot[],
  actions: ActionRecord[],
  outputDir: string,
): { comparisons: ScreenshotComparison[]; findings: Finding[] } {
  const comparisons: ScreenshotComparison[] = [];
  const findings: Finding[] = [];

  for (const action of actions) {
    const afterSnap = snapshots[action.snapshotIndex];
    // Find the snapshot immediately before this action
    const beforeSnap = action.snapshotIndex > 0 ? snapshots[action.snapshotIndex - 1] : null;
    if (!beforeSnap || !afterSnap) continue;
    if (!beforeSnap.screenshotPath || !afterSnap.screenshotPath) continue;

    const beforePath = path.join(outputDir, beforeSnap.screenshotPath);
    const afterPath = path.join(outputDir, afterSnap.screenshotPath);

    if (!fs.existsSync(beforePath) || !fs.existsSync(afterPath)) continue;

    const comp = compareScreenshots(beforePath, afterPath);
    comp.beforeLabel = beforeSnap.label;
    comp.afterLabel = afterSnap.label;
    comparisons.push(comp);

    // Semantic rules:

    // 1. After clicking an element, the screenshot MUST change (selection visuals should appear)
    if (action.action === 'click' || action.action === 'shift-click' || action.action === 'ctrl-click') {
      if (comp.diffPercent === 0) {
        findings.push({
          code: 'SCREENSHOT_NO_VISUAL_CHANGE',
          severity: 'critical',
          category: 'G: Semantic Visual',
          message: `After ${action.action} on ${action.targetElementId}: screenshot is IDENTICAL to before — no selection visual appeared`,
          snapshot: action.label,
        });
      }
    }

    // 2. After clicking empty canvas (deselect), screenshot SHOULD change
    //    (selection visuals should disappear) — only if something was selected before
    if (action.action === 'deselect') {
      const beforeSel = beforeSnap.store?.selectedElementIds ?? [];
      if (beforeSel.length > 0 && comp.diffPercent === 0) {
        findings.push({
          code: 'SCREENSHOT_DESELECT_NO_CHANGE',
          severity: 'warning',
          category: 'G: Semantic Visual',
          message: `After deselect: screenshot unchanged despite ${beforeSel.length} element(s) being deselected — selection visuals may not have cleared`,
          snapshot: action.label,
        });
      }
    }

    // 3. After Ctrl+A, screenshot must change
    if (action.action === 'ctrl-a') {
      if (comp.diffPercent === 0) {
        findings.push({
          code: 'SCREENSHOT_SELECT_ALL_NO_CHANGE',
          severity: 'critical',
          category: 'G: Semantic Visual',
          message: `After Ctrl+A: screenshot unchanged — selection visuals did not appear for any element`,
          snapshot: action.label,
        });
      }
    }
  }

  return { comparisons, findings };
}

// ─── Eval Session ────────────────────────────────────────────────────────────

export class EvalSession {
  private page: Page;
  private snapshots: EvalSnapshot[] = [];
  private outputDir: string;
  private category: string;
  private scenario: string;

  constructor(page: Page, opts: { category: string; scenario: string; outputDir?: string }) {
    this.page = page;
    this.category = opts.category;
    this.scenario = opts.scenario;
    this.outputDir = opts.outputDir ||
      path.join(process.cwd(), 'test-results', 'eval-reports',
        `${opts.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        `${opts.scenario}-${Date.now()}`);
  }

  /** Wait for CanvasManager to be exposed */
  async waitForCanvas(timeoutMs = 10_000) {
    await this.page.waitForFunction(
      () => !!(window as any).__TEST_CANVAS_MANAGER__,
      null,
      { timeout: timeoutMs },
    );
  }

  /** Capture a snapshot with screenshot */
  async capture(label: string): Promise<EvalSnapshot> {
    // Capture three layers
    const raw = await this.page.evaluate(CAPTURE_FN) as {
      timestamp: number;
      store: StoreLayer | null;
      dom: DomLayer;
      interaction: InteractionLayer;
    };

    // Take screenshot
    const screenshotDir = path.join(this.outputDir, 'screenshots');
    fs.mkdirSync(screenshotDir, { recursive: true });
    const screenshotFile = `${label.replace(/[^a-z0-9_-]/gi, '_')}.png`;
    const screenshotPath = path.join(screenshotDir, screenshotFile);
    const screenshotBuffer = await this.page.screenshot({ type: 'png' });
    fs.writeFileSync(screenshotPath, screenshotBuffer);

    const snap: EvalSnapshot = {
      label,
      timestamp: raw.timestamp,
      store: raw.store,
      dom: raw.dom,
      interaction: raw.interaction,
      screenshotPath: path.relative(this.outputDir, screenshotPath),
      findings: [],
    };

    // Run heuristic detectors inline
    snap.findings = runHeuristicDetectors(snap);

    this.snapshots.push(snap);
    return snap;
  }

  /** Get element screen coordinates for clicking.
   *  Targets the MAIN CANVAS instance (inside #slide-content),
   *  not the sidebar thumbnail. */
  async getElementCenter(elementId: string): Promise<{ x: number; y: number }> {
    return await this.page.evaluate((id) => {
      // The main canvas elements live inside #slide-content.
      // Sidebar thumbnails also render .slide-element with the same data-element-id
      // but they live outside #slide-content (inside .slide-thumbnail-preview).
      // We MUST scope to #slide-content only — [data-testid="slide-view"] matches both.
      const candidates = document.querySelectorAll(
        `.slide-element[data-element-id="${id}"]`
      );
      let target: Element | null = null;
      for (const el of candidates) {
        // Only match elements inside the main canvas content layer
        if (el.closest('#slide-content')) {
          target = el;
          break;
        }
      }
      if (!target) {
        // Fallback: pick the candidate with the largest bounding rect (main canvas is bigger)
        let maxArea = 0;
        for (const el of candidates) {
          const r = el.getBoundingClientRect();
          const area = r.width * r.height;
          if (area > maxArea) {
            maxArea = area;
            target = el;
          }
        }
      }
      if (!target) throw new Error(`Element ${id} not found in DOM (scoped to #slide-content)`);
      const rect = target.getBoundingClientRect();
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    }, elementId);
  }

  /** Get empty canvas coordinates (on the main canvas, guaranteed no element). */
  async getEmptyCanvasPoint(): Promise<{ x: number; y: number }> {
    return await this.page.evaluate(() => {
      // We need to click inside #canvas-container's mousedown handler area,
      // but NOT on any element. The slide is rendered via CSS transform (pan+zoom)
      // inside #slide-content. Click BELOW the slide in the canvas container.
      const slideContent = document.getElementById('slide-content');
      const container = document.getElementById('canvas-container');
      if (slideContent && container) {
        const slideRect = slideContent.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        // Click 40px below the slide's bottom edge, horizontally centered
        const y = Math.min(slideRect.bottom + 40, containerRect.bottom - 10);
        const x = containerRect.left + containerRect.width / 2;
        return { x, y };
      }
      // Fallback: use interaction canvas bottom-center
      const canvas = document.querySelector('#interaction-canvas');
      if (canvas) {
        const r = canvas.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.bottom - 40 };
      }
      throw new Error('No canvas container found');
    });
  }

  // ─── Action-tracking helpers ──────────────────────────────────────────

  private actions: ActionRecord[] = [];

  /** Click an element and capture. Records the expected selection. */
  async clickElement(elementId: string, label: string): Promise<EvalSnapshot> {
    const pos = await this.getElementCenter(elementId);
    await this.page.mouse.click(pos.x, pos.y);
    await this.page.waitForTimeout(150);
    this.actions.push({
      snapshotIndex: this.snapshots.length,
      action: 'click',
      targetElementId: elementId,
      expectedSelection: [elementId],
      label,
    });
    return this.capture(label);
  }

  /** Shift+Click an element (add/remove). */
  async shiftClickElement(elementId: string, label: string): Promise<EvalSnapshot> {
    const pos = await this.getElementCenter(elementId);
    await this.page.keyboard.down('Shift');
    await this.page.mouse.click(pos.x, pos.y);
    await this.page.keyboard.up('Shift');
    await this.page.waitForTimeout(150);
    // Expected selection is computed later during behavioral detection
    this.actions.push({
      snapshotIndex: this.snapshots.length,
      action: 'shift-click',
      targetElementId: elementId,
      label,
    });
    return this.capture(label);
  }

  /** Ctrl+Click (deep select). */
  async ctrlClickElement(elementId: string, label: string): Promise<EvalSnapshot> {
    const pos = await this.getElementCenter(elementId);
    await this.page.keyboard.down('Control');
    await this.page.mouse.click(pos.x, pos.y);
    await this.page.keyboard.up('Control');
    await this.page.waitForTimeout(150);
    this.actions.push({
      snapshotIndex: this.snapshots.length,
      action: 'ctrl-click',
      targetElementId: elementId,
      label,
    });
    return this.capture(label);
  }

  /** Double-click an element. */
  async dblClickElement(elementId: string, label: string): Promise<EvalSnapshot> {
    const pos = await this.getElementCenter(elementId);
    await this.page.mouse.dblclick(pos.x, pos.y);
    await this.page.waitForTimeout(150);
    this.actions.push({
      snapshotIndex: this.snapshots.length,
      action: 'dblclick',
      targetElementId: elementId,
      label,
    });
    return this.capture(label);
  }

  /** Click empty canvas (deselect). */
  async clickEmpty(label: string): Promise<EvalSnapshot> {
    const pos = await this.getEmptyCanvasPoint();
    await this.page.mouse.click(pos.x, pos.y);
    await this.page.waitForTimeout(150);
    this.actions.push({
      snapshotIndex: this.snapshots.length,
      action: 'deselect',
      expectedSelection: [],
      label,
    });
    return this.capture(label);
  }

  /** Press Ctrl+A (select all). */
  async selectAll(label: string): Promise<EvalSnapshot> {
    await this.page.keyboard.press('Control+a');
    await this.page.waitForTimeout(150);
    this.actions.push({
      snapshotIndex: this.snapshots.length,
      action: 'ctrl-a',
      label,
    });
    return this.capture(label);
  }

  /** Press Tab. */
  async pressTab(label: string): Promise<EvalSnapshot> {
    await this.page.keyboard.press('Tab');
    await this.page.waitForTimeout(300);
    this.actions.push({
      snapshotIndex: this.snapshots.length,
      action: 'tab',
      label,
    });
    return this.capture(label);
  }

  // ─── Extended action methods ──────────────────────────────────────────

  /** Press a keyboard shortcut and capture. */
  async pressKey(key: string, label: string, opts?: { waitMs?: number }): Promise<EvalSnapshot> {
    await this.page.keyboard.press(key);
    await this.page.waitForTimeout(opts?.waitMs ?? 200);
    return this.capture(label);
  }

  /** Type text (for text editing flows) and capture. */
  async typeText(text: string, label: string): Promise<EvalSnapshot> {
    await this.page.keyboard.type(text, { delay: 30 });
    await this.page.waitForTimeout(150);
    return this.capture(label);
  }

  /** Right-click on an element and capture (opens context menu). */
  async rightClickElement(elementId: string, label: string): Promise<EvalSnapshot> {
    const pos = await this.getElementCenter(elementId);
    await this.page.mouse.click(pos.x, pos.y, { button: 'right' });
    await this.page.waitForTimeout(200);
    return this.capture(label);
  }

  /** Right-click on empty canvas and capture. */
  async rightClickEmpty(label: string): Promise<EvalSnapshot> {
    const pos = await this.getEmptyCanvasPoint();
    await this.page.mouse.click(pos.x, pos.y, { button: 'right' });
    await this.page.waitForTimeout(200);
    return this.capture(label);
  }

  /** Drag an element by a delta (movement/reorder flow). */
  async dragElement(
    elementId: string,
    deltaX: number,
    deltaY: number,
    label: string,
    opts?: { steps?: number },
  ): Promise<EvalSnapshot> {
    const pos = await this.getElementCenter(elementId);
    const steps = opts?.steps ?? 10;
    await this.page.mouse.move(pos.x, pos.y);
    await this.page.mouse.down();
    await this.page.waitForTimeout(50);
    for (let i = 1; i <= steps; i++) {
      const progress = i / steps;
      await this.page.mouse.move(
        pos.x + deltaX * progress,
        pos.y + deltaY * progress,
      );
      await this.page.waitForTimeout(15);
    }
    await this.page.mouse.up();
    await this.page.waitForTimeout(200);
    return this.capture(label);
  }

  /** Get element bounding rect in screen coordinates (scoped to main canvas). */
  async getElementRect(elementId: string): Promise<{ x: number; y: number; width: number; height: number }> {
    return await this.page.evaluate((id) => {
      const candidates = document.querySelectorAll(`.slide-element[data-element-id="${id}"]`);
      let target: Element | null = null;
      for (const el of candidates) {
        if (el.closest('#slide-content')) { target = el; break; }
      }
      if (!target) {
        let maxArea = 0;
        for (const el of candidates) {
          const r = el.getBoundingClientRect();
          if (r.width * r.height > maxArea) { maxArea = r.width * r.height; target = el; }
        }
      }
      if (!target) throw new Error(`Element ${id} not found in DOM`);
      const r = target.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    }, elementId);
  }

  /**
   * Drag a resize handle on a selected element.
   * Handles are canvas-drawn, so we compute screen position from the element bounding rect.
   * @param elementId  ID of the selected element
   * @param handle     Handle name: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
   * @param deltaX     Pixels to drag horizontally
   * @param deltaY     Pixels to drag vertically
   * @param label      Snapshot label
   */
  async dragHandle(
    elementId: string,
    handle: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw',
    deltaX: number,
    deltaY: number,
    label: string,
    opts?: { modifiers?: ('Shift' | 'Alt')[] },
  ): Promise<EvalSnapshot> {
    const rect = await this.getElementRect(elementId);
    // Map handle name to position on the bounding rect
    const xMap: Record<string, number> = { nw: 0, w: 0, sw: 0, n: 0.5, s: 0.5, ne: 1, e: 1, se: 1 };
    const yMap: Record<string, number> = { nw: 0, n: 0, ne: 0, w: 0.5, e: 0.5, sw: 1, s: 1, se: 1 };
    const cx = rect.x + rect.width * xMap[handle];
    const cy = rect.y + rect.height * yMap[handle];

    for (const mod of opts?.modifiers ?? []) await this.page.keyboard.down(mod);
    await this.page.mouse.move(cx, cy);
    await this.page.mouse.down();
    await this.page.waitForTimeout(50);
    await this.page.mouse.move(cx + deltaX, cy + deltaY, { steps: 8 });
    await this.page.mouse.up();
    for (const mod of (opts?.modifiers ?? []).reverse()) await this.page.keyboard.up(mod);
    await this.page.waitForTimeout(200);
    return this.capture(label);
  }

  /** Scroll wheel (for zoom/pan taskflows). */
  async scrollWheel(
    deltaX: number,
    deltaY: number,
    label: string,
    opts?: { modifiers?: ('Control' | 'Shift' | 'Alt')[] },
  ): Promise<EvalSnapshot> {
    const canvas = this.page.locator('#canvas-container');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas container not found');
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await this.page.mouse.move(cx, cy);
    if (opts?.modifiers) {
      for (const m of opts.modifiers) await this.page.keyboard.down(m);
    }
    await this.page.mouse.wheel(deltaX, deltaY);
    if (opts?.modifiers) {
      for (const m of opts.modifiers) await this.page.keyboard.up(m);
    }
    await this.page.waitForTimeout(200);
    return this.capture(label);
  }

  /** Click a locator (for UI elements like menu items, buttons). */
  async clickLocator(locator: string, label: string, opts?: { waitMs?: number }): Promise<EvalSnapshot> {
    await this.page.locator(locator).first().click();
    await this.page.waitForTimeout(opts?.waitMs ?? 200);
    return this.capture(label);
  }

  /** Wait for a selector to appear, then capture. */
  async waitAndCapture(selector: string, label: string, timeoutMs = 5000): Promise<EvalSnapshot> {
    await this.page.locator(selector).first().waitFor({ state: 'visible', timeout: timeoutMs });
    return this.capture(label);
  }

  /** Get store state (convenience for inline assertions). */
  async getStoreState(): Promise<any> {
    return this.page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      return store ? store.getState() : null;
    });
  }

  /** Dispatch a store action (for setup, not part of evaluation). */
  async dispatch(action: string, payload?: any): Promise<void> {
    await this.page.evaluate(({ action, payload }) => {
      (window as any).__TEST_STORE__?.dispatch(action, payload);
    }, { action, payload });
    await this.page.waitForTimeout(100);
  }

  /** Produce the final anomaly report */
  finalize(): AnomalyReport {
    // Build mutation timeline
    const mutations = buildMutationTimeline(this.snapshots);

    // Run temporal rules + behavioral detection
    const temporalFindings = runTemporalRules(this.snapshots, mutations, this.actions);

    // Run semantic screenshot evaluation
    const { comparisons: screenshotComparisons, findings: semanticFindings } =
      runSemanticEval(this.snapshots, this.actions, this.outputDir);

    // Aggregate all findings
    const allFindings: Finding[] = [];
    for (const snap of this.snapshots) {
      allFindings.push(...snap.findings);
    }
    allFindings.push(...temporalFindings);
    allFindings.push(...semanticFindings);

    const report: AnomalyReport = {
      category: this.category,
      scenario: this.scenario,
      timestamp: new Date().toISOString(),
      summary: {
        critical: allFindings.filter(f => f.severity === 'critical').length,
        warning: allFindings.filter(f => f.severity === 'warning').length,
        info: allFindings.filter(f => f.severity === 'info').length,
      },
      findings: allFindings,
      snapshots: this.snapshots.map(s => ({
        label: s.label,
        screenshotPath: s.screenshotPath,
      })),
      mutationTimeline: mutations,
      actions: this.actions,
      screenshotComparisons,
    };

    // Write report to disk
    fs.mkdirSync(this.outputDir, { recursive: true });
    fs.writeFileSync(
      path.join(this.outputDir, 'anomaly-report.json'),
      JSON.stringify(report, null, 2),
    );

    // Write snapshots (without screenshot buffers) for inspection
    const snapshotData = this.snapshots.map(s => ({
      label: s.label,
      timestamp: s.timestamp,
      store: s.store,
      dom: s.dom,
      interaction: s.interaction,
      findings: s.findings,
    }));
    fs.writeFileSync(
      path.join(this.outputDir, 'snapshots.json'),
      JSON.stringify(snapshotData, null, 2),
    );

    // Write mutation timeline
    fs.writeFileSync(
      path.join(this.outputDir, 'mutation-timeline.json'),
      JSON.stringify(mutations, null, 2),
    );

    // Write human-readable summary
    const summaryLines = [
      `# Eval Report: ${this.category} / ${this.scenario}`,
      `Date: ${report.timestamp}`,
      ``,
      `## Summary`,
      `- Critical: ${report.summary.critical}`,
      `- Warning: ${report.summary.warning}`,
      `- Info: ${report.summary.info}`,
      `- Snapshots: ${this.snapshots.length}`,
      `- Mutations: ${mutations.length}`,
      `- Actions tracked: ${this.actions.length}`,
      `- Screenshot comparisons: ${screenshotComparisons.length}`,
      ``,
      `## Actions`,
      ...this.actions.map(a =>
        `- **${a.action}**${a.targetElementId ? ` on ${a.targetElementId}` : ''} → snapshot "${a.label}"`
      ),
      ``,
      `## Snapshots`,
      ...this.snapshots.map(s =>
        `- **${s.label}** | sel=[${s.store?.selectedElementIds?.join(', ') ?? '?'}] | findings: ${s.findings.length} | screenshot: ${s.screenshotPath}`
      ),
      ``,
      `## Screenshot Comparisons (Semantic Eval)`,
      ...screenshotComparisons.map(c =>
        `- **${c.beforeLabel}** → **${c.afterLabel}**: ${c.diffPercent === 0 ? '⚠️ IDENTICAL (no visual change)' : '✅ CHANGED (visual difference detected)'}`
      ),
      ...(screenshotComparisons.length === 0 ? ['*No comparisons (need action tracking).*'] : []),
      ``,
      `## Mutation Timeline`,
      ...mutations.map(m => `- [${m.snapshotIndex}] ${m.type}: ${m.detail || ''}`),
      ...(mutations.length === 0 ? ['*No mutations detected across snapshots.*'] : []),
      ``,
      `## Findings`,
      ...allFindings.map(f =>
        `- **[${f.severity.toUpperCase()}]** ${f.code} (${f.category}) — ${f.message}${f.snapshot ? ` @ ${f.snapshot}` : ''}`
      ),
      ...(allFindings.length === 0 ? ['*No findings — clean run.*'] : []),
    ];
    fs.writeFileSync(
      path.join(this.outputDir, 'REPORT.md'),
      summaryLines.join('\n'),
    );

    return report;
  }

  /** Get the output directory path */
  getOutputDir(): string {
    return this.outputDir;
  }

  /** Get current snapshot count */
  getSnapshotCount(): number {
    return this.snapshots.length;
  }
}
