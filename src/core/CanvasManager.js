import { store } from './Store.js';
import { InputManager } from './InputManager.js';
import { ViewportController } from './canvas/ViewportController.js';
import { GeometryUtils } from './canvas/GeometryUtils.js';
import { HitTesting } from './canvas/HitTesting.js';
import { SnappingSystem } from './canvas/SnappingSystem.js';
import { GizmoRenderer } from './canvas/GizmoRenderer.js';
import { mouseStateManager } from './MouseStateManager.js';
import { cursorManager } from './CursorManager.js';
import { computeElementWorldRotation } from './shapes/SceneGraphTransforms.js';
import { mediaAssetManager } from './media/MediaAssetManager.js';
import { SUPPORTED_IMAGE_FORMATS, SUPPORTED_VIDEO_FORMATS } from './constants/MediaDefaults.js';
import { contextMenuManager } from '../ui/components/ContextMenu/index.js';
import { canvasMenuConfigs } from '../ui/components/ContextMenu/canvasMenuConfig.js';
import { sanitizeSvg } from './svg/SvgSanitizer.js';
import { extractFirstSvgFromHtml } from './clipboard/ClipboardSvgExtractor.js';
import { importEditableShapesFromSanitizedSvg } from './clipboard/EditableSvgImporter.js';

/**
 * CanvasManager - Main orchestrator for canvas interactions
 * 
 * This class has been refactored to delegate to specialized modules:
 * - ViewportController: Zoom, pan, fit to view
 * - HitTesting: Element and handle hit detection  
 * - SnappingSystem: Guide snapping and spacing
 * - GizmoRenderer: Selection boxes, guides, overlays
 * - GeometryUtils: Geometry calculations (static)
 */
export class CanvasManager {
    constructor(containerId) {
        // The container is now the wrapper for the whole viewport
        this.container = document.getElementById(containerId);
        
        // Grab references to the layers defined in index.html
        this.viewport = document.getElementById('viewport');
        this.backgroundLayer = document.getElementById('slide-background');
        this.contentLayer = document.getElementById('slide-content');
        this.canvas = document.getElementById('interaction-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // State for navigation & interaction
        this.interactionState = 'IDLE'; // IDLE, PANNING, DRAGGING, RESIZING, CREATING, SELECTING
        this.isSpacePressed = false;
        this.isShiftPressed = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.dragStart = { x: 0, y: 0 };
        this.dragCurrent = { x: 0, y: 0 };
        this.initialElementState = {}; // Store initial state for undo/redo or delta calc
        this.initialSelectionBounds = null;
        this.activeHandle = null;
        this.interactionAction = null; // resize, rotate, radius
        this.initialRotationAngle = null; // Starting mouse angle for rotation
        this.hoveredElementId = null;
        this.isRendering = false;
        this.liveResizeData = null; // Live dimensions during text editing
        this.activeGuides = [];
        this.measurementGuides = null;
        this.vectorNodeDrag = null;
        this.vectorMarqueeSelection = null;
        this.vectorHandleDrag = null;

        // Initialize sub-modules
        this.viewportController = new ViewportController(this);
        this.hitTesting = new HitTesting(this);
        this.snapping = new SnappingSystem(this);
        this.gizmoRenderer = new GizmoRenderer(this);

        this.init();
    }

    getActiveContainer(state) {
        if (state.editor.mode === 'master') {
            const activeId = state.editor.activeMasterId;
            const masters = state.slideMasterPresets;
            return masters[activeId] || null;
        } else {
            return state.slides[state.editor.activeSlideId];
        }
    }

    // Delegate geometry methods to GeometryUtils
    getAbsoluteElement(el, slide) {
        return GeometryUtils.getAbsoluteElement(el, slide);
    }

    getSelectionBounds(slide, selectedIds) {
        return GeometryUtils.getSelectionBounds(slide, selectedIds, GeometryUtils.getAbsoluteElement);
    }

    getElementCorners(el) {
        return GeometryUtils.getElementCorners(el);
    }

    pointInElement(wx, wy, el) {
        return GeometryUtils.pointInElement(wx, wy, el);
    }

    // Delegate viewport methods
    fitToView() { this.viewportController.fitToView(); }
    zoomIn() { this.viewportController.zoomIn(); }
    zoomOut() { this.viewportController.zoomOut(); }
    resize() { this.viewportController.resize(); }
    updateViewportTransform(viewport) { this.viewportController.updateViewportTransform(viewport); }

    // Delegate hit testing methods
    hitTest(x, y) { return this.hitTesting.hitTest(x, y); }
    hitTestHandles(x, y) { return this.hitTesting.hitTestHandles(x, y); }
    checkHandlesV2(wx, wy, el, zoom) { return this.hitTesting.checkHandlesV2(wx, wy, el, zoom); }

    // Delegate snapping methods
    snapToGuides(id, x, y, width, height, zoom) { 
        return this.snapping.snapToGuides(id, x, y, width, height, zoom); 
    }
    snapResize(id, handle, x, y, width, height, zoom) { 
        return this.snapping.snapResize(id, handle, x, y, width, height, zoom); 
    }
    checkSpacingGuides(id, x, y, width, height, zoom) { 
        return this.snapping.checkSpacingGuides(id, x, y, width, height, zoom); 
    }
    updateMeasurementGuides(mouseX, mouseY) { 
        this.snapping.updateMeasurementGuides(mouseX, mouseY); 
    }

    // Delegate rendering
    render() { this.gizmoRenderer.render(); }
    renderGizmos() { this.gizmoRenderer.renderGizmos(); }
    renderGuides() { this.gizmoRenderer.renderGuides(); }
    renderMeasurementGuides() { this.gizmoRenderer.renderMeasurementGuides(); }
    renderSelectionMarquee() { this.gizmoRenderer.renderSelectionMarquee(); }
    renderCreationGhost() { this.gizmoRenderer.renderCreationGhost(); }
    drawSelectionBox(el, zoom, showHandles) { this.gizmoRenderer.drawSelectionBox(el, zoom, showHandles); }
    drawHoverOutline(el, zoom) { this.gizmoRenderer.drawHoverOutline(el, zoom); }

    init() {
        // Ensure layers are positioned correctly
        [this.backgroundLayer, this.contentLayer, this.canvas].forEach(el => {
            if (el) {
                el.style.position = 'absolute';
                el.style.top = '0';
                el.style.left = '0';
                el.style.transformOrigin = '0 0';
            }
        });
        
        // Canvas needs to be on top to capture events for the Tool system.
        // Uses --z-canvas token value (100) from z-index strategy
        this.canvas.style.zIndex = 'var(--z-canvas, 100)';
        this.canvas.style.pointerEvents = 'auto'; // Enable interaction

        // Resize canvas to match window/container
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Subscribe to store changes
        store.on('viewport-changed', (viewport) => {
            const state = store.getState();
            if (state.editor.mode !== 'presentation') {
                this.updateViewportTransform(viewport);
            }
        });

        store.on('mode-changed', (mode) => {
            if (mode === 'presentation') {
                // PresentationManager handles scaling
                // Clear canvas immediately to remove any selection overlays
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.isRendering = false;
                return;
            } else {
                // Reset or fit to view again
                setTimeout(() => this.fitToView(), 100);
                if (!this.isRendering) {
                    this.render();
                }
            }
        });

        store.on('state-changed', (state) => {
            if (state.editor.mode === 'presentation') return;
            if (this.interactionState === 'IDLE' && !this.isSpacePressed) {
                this.container.style.cursor = state.editor.activeTool === 'hand' ? 'grab' : 'default';
            }
        });

        // Listen for live resize events during text editing
        store.on('element-live-resize', (data) => {
            this.liveResizeData = data;
        });

        // Clear live resize data when editing ends
        store.on('editing-changed', (editingId) => {
            if (!editingId) {
                this.liveResizeData = null;
            }
        });

        // Register context menu zones
        this.registerContextMenuZones();

        this.bindEvents();

        // Initial Fit to View
        setTimeout(() => this.fitToView(), 0);

        // Start Render Loop
        this.render();
    }

    bindEvents() {
        // Wheel Zoom
        this.container.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });

        // Panning (MouseDown)
        this.container.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        
        // Context Menu (Right Click)
        this.container.addEventListener('contextmenu', (e) => this.handleContextMenu(e));
        
        // Double Click (Edit Text)
        this.container.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
        this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
        
        // Drag and Drop (Images)
        this.container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });
        this.container.addEventListener('drop', (e) => this.handleDrop(e));

        // Global Mouse Events
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.addEventListener('mouseup', (e) => this.handleMouseUp(e));

        // Keyboard
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // Viewport Controls
        const btnFit = document.getElementById('btn-fit');
        const btnZoomIn = document.getElementById('btn-zoom-in');
        const btnZoomOut = document.getElementById('btn-zoom-out');

        if (btnFit) btnFit.addEventListener('click', () => this.fitToView());
        if (btnZoomIn) btnZoomIn.addEventListener('click', () => this.zoomIn());
        if (btnZoomOut) btnZoomOut.addEventListener('click', () => this.zoomOut());
    }

    /**
     * Register context menu zones for canvas areas
     */
    registerContextMenuZones() {
        // Register canvas-empty zone
        contextMenuManager.register('canvas-empty', canvasMenuConfigs['canvas-empty']);
        
        // Register canvas-element zone
        contextMenuManager.register('canvas-element', canvasMenuConfigs['canvas-element']);
        
        // Register canvas-text-editing zone
        contextMenuManager.register('canvas-text-editing', canvasMenuConfigs['canvas-text-editing']);
    }

    /**
     * Handle right-click context menu on canvas
     */
    handleContextMenu(e) {
        const state = store.getState();
        
        // Don't show context menu in presentation mode
        if (state.editor.mode === 'presentation') return;
        
        // Prevent default browser context menu
        e.preventDefault();
        
        // Get mouse position relative to container
        const rect = this.container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Convert to world coordinates
        const { zoom, pan } = state.editor;
        const worldX = (mouseX - pan.x) / zoom;
        const worldY = (mouseY - pan.y) / zoom;
        
        // Determine which zone to show
        const container = this.getActiveContainer(state);
        
        // Check if we're in text editing mode
        if (state.editor.editingElementId) {
            contextMenuManager.show('canvas-text-editing', e.clientX, e.clientY, {
                store,
                elementId: state.editor.editingElementId,
                worldX,
                worldY
            });
            return;
        }
        
        // Hit test to see if we clicked on an element
        const hitResult = this.hitTest(worldX, worldY);
        
        if (hitResult && hitResult.elementId) {
            // If clicked element is not already selected, select it first
            if (!state.editor.selectedElementIds.includes(hitResult.elementId)) {
                if (e.shiftKey) {
                    // Add to selection
                    store.dispatch('ADD_TO_SELECTION', hitResult.elementId);
                } else {
                    // Replace selection
                    store.dispatch('UPDATE_SELECTION', [hitResult.elementId]);
                }
            }
            
            // Show element context menu
            const selectedIds = e.shiftKey 
                ? [...state.editor.selectedElementIds, hitResult.elementId]
                : (state.editor.selectedElementIds.includes(hitResult.elementId) 
                    ? state.editor.selectedElementIds 
                    : [hitResult.elementId]);
            
            contextMenuManager.show('canvas-element', e.clientX, e.clientY, {
                store,
                elementIds: selectedIds,
                worldX,
                worldY
            });
        } else {
            // Clicked on empty canvas - show empty context menu
            store.dispatch('CLEAR_SELECTION');
            
            contextMenuManager.show('canvas-empty', e.clientX, e.clientY, {
                store,
                worldX,
                worldY
            });
        }
    }

    // ============================================
    // Event Handlers (kept in main class for now)
    // These could be further extracted if needed
    // ============================================

    handleWheel(e) {
        const state = store.getState();
        if (state.editor.mode === 'presentation') return;

        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            
            const { zoom, pan } = state.editor;
            
            // Zoom Factor
            const ZOOM_SENSITIVITY = 0.001;
            const delta = -e.deltaY * ZOOM_SENSITIVITY;
            const newZoom = Math.min(Math.max(0.1, zoom + delta), 5.0);

            // Calculate Mouse Position relative to Container
            const rect = this.container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Zoom towards mouse
            const worldX = (mouseX - pan.x) / zoom;
            const worldY = (mouseY - pan.y) / zoom;

            const newPanX = mouseX - (worldX * newZoom);
            const newPanY = mouseY - (worldY * newZoom);

            store.dispatch('UPDATE_VIEWPORT', {
                zoom: newZoom,
                pan: { x: newPanX, y: newPanY }
            });
        } else {
            // Regular scroll (Pan)
            e.preventDefault();
            const { pan } = state.editor;
            
            store.dispatch('UPDATE_VIEWPORT', {
                pan: {
                    x: pan.x - e.deltaX,
                    y: pan.y - e.deltaY
                }
            });
        }
    }

    handleMouseDown(e) {
        const state = store.getState();
        if (state.editor.mode === 'presentation') return;
        
        // Broadcast mouse down to CodeFill canvases
        const rect = this.container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        this._broadcastMouseState(mouseX, mouseY, e, state, true);
        
        if (state.editor.editingElementId) {
            return;
        }

        store.dispatch('DESELECT_SLIDES');

        const activeTool = state.editor.activeTool;

        // Middle Mouse or Space+Left Click or Hand Tool -> Pan
        if (e.button === 1 || (e.button === 0 && (this.isSpacePressed || activeTool === 'hand'))) {
            e.preventDefault();
            this.interactionState = 'PANNING';
            const rect = this.container.getBoundingClientRect();
            this.lastMouseX = e.clientX - rect.left;
            this.lastMouseY = e.clientY - rect.top;
            
            // Performance Panning Setup
            this.isPerformancePanning = true;
            this.dragStart = { x: this.lastMouseX, y: this.lastMouseY };
            this.panStart = { ...state.editor.pan };
            
            cursorManager.push('grabbing', 'panning');
            this.container.style.cursor = 'grabbing';
            document.body.classList.add('is-panning');
            return;
        }

        if (e.button === 0) {
            const rect = this.container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Handle Creation Tools
            if (activeTool !== 'select') {
                this.interactionState = 'CREATING';
                this.dragStart = { x: mouseX, y: mouseY };
                this.dragCurrent = { x: mouseX, y: mouseY };
                return;
            }

            // Vector deep edit routing: in vector mode, do not allow object drag/handles.
            if (state.editor.deepEdit && state.editor.deepEdit.kind === 'vector') {
                this._handleVectorEditMouseDown(mouseX, mouseY, e);
                return;
            }

            const hit = this.hitTest(mouseX, mouseY);

            if (hit) {
                if (hit.type === 'handle') {
                    this._handleHandleClick(hit, mouseX, mouseY, e);
                } else if (hit.type === 'vector-node') {
                    this._handleVectorNodeClick(hit, mouseX, mouseY, e);
                } else if (hit.type === 'element') {
                    this._handleElementClick(hit, mouseX, mouseY, e);
                }
            } else {
                // Clicked on empty space -> Start Marquee Selection
                if (!e.shiftKey) {
                    store.dispatch('UPDATE_SELECTION', []);
                }
                this.interactionState = 'SELECTING';
                this.dragStart = { x: mouseX, y: mouseY };
                this.dragCurrent = { x: mouseX, y: mouseY };
            }
        }
    }

    _handleVectorEditMouseDown(mouseX, mouseY, e) {
        const state = store.getState();
        const hit = this.hitTest(mouseX, mouseY);

        if (hit && hit.type === 'vector-handle') {
            this._handleVectorHandleClick(hit, mouseX, mouseY, e);
            return;
        }

        if (hit && hit.type === 'vector-node') {
            this._handleVectorNodeClick(hit, mouseX, mouseY, e);
            return;
        }

        if (hit && hit.type === 'vector-edge') {
            this._handleVectorEdgeClick(hit, e);
            return;
        }

        const deepEdit = state.editor.deepEdit;
        const currentNodes = deepEdit?.selection?.nodes || [];
        let baseSelection = currentNodes;
        if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
            baseSelection = [];
        }

        this.interactionState = 'VECTOR_SELECTING';
        this.dragStart = { x: mouseX, y: mouseY };
        this.dragCurrent = { x: mouseX, y: mouseY };
        this.vectorMarqueeSelection = {
            baseSelection: Array.isArray(baseSelection) ? [...baseSelection] : []
        };
    }

    _handleVectorEdgeClick(hit, e) {
        const state = store.getState();
        const deepEdit = state.editor.deepEdit;
        if (!deepEdit || deepEdit.kind !== 'vector' || deepEdit.elementId !== hit.elementId) return;

        const edgeId = `p${hit.pathIndex}:e${hit.segmentIndex}`;
        const currentEdges = deepEdit.selection?.edges || [];
        const currentNodes = deepEdit.selection?.nodes || [];
        const currentHandles = deepEdit.selection?.handles || [];

        let nextEdges;
        let nextNodes = currentNodes;
        let nextHandles = currentHandles;

        if (e.ctrlKey || e.metaKey) {
            const set = new Set(currentEdges);
            if (set.has(edgeId)) set.delete(edgeId);
            else set.add(edgeId);
            nextEdges = Array.from(set);
        } else if (e.shiftKey) {
            nextEdges = Array.from(new Set([...currentEdges, edgeId]));
        } else {
            nextEdges = [edgeId];
            nextNodes = [];
            nextHandles = [];
        }

        nextEdges.sort((a, b) => a.localeCompare(b));

        store.dispatch('SET_DEEP_EDIT', {
            ...deepEdit,
            selection: {
                ...(deepEdit.selection || {}),
                nodes: nextNodes,
                handles: nextHandles,
                edges: nextEdges
            }
        });

        // Keep element selected while deep editing.
        if (!state.editor.selectedElementIds.includes(hit.elementId)) {
            store.dispatch('UPDATE_SELECTION', [hit.elementId]);
        }
    }

    _handleVectorHandleClick(hit, mouseX, mouseY, e) {
        const state = store.getState();
        const slide = this.getActiveContainer(state);
        if (!slide) return;

        const el = slide.elements?.[hit.elementId];
        if (!el || el.type !== 'vector') return;

        const deepEdit = state.editor.deepEdit;
        if (!deepEdit || deepEdit.kind !== 'vector' || deepEdit.elementId !== hit.elementId) {
            store.dispatch('SET_DEEP_EDIT', { kind: 'vector', elementId: hit.elementId, selection: { nodes: [], edges: [], handles: [] } });
        }

        const latestState = store.getState();
        const currentDeep = latestState.editor.deepEdit;
        const currentHandles = currentDeep?.selection?.handles || [];
        const handleId = String(hit.handleId);
        let nextHandles;

        if (e.ctrlKey || e.metaKey) {
            const set = new Set(currentHandles);
            if (set.has(handleId)) set.delete(handleId);
            else set.add(handleId);
            nextHandles = Array.from(set);
        } else if (e.shiftKey) {
            nextHandles = Array.from(new Set([...currentHandles, handleId]));
        } else {
            nextHandles = [handleId];
        }

        nextHandles.sort((a, b) => a.localeCompare(b));
        store.dispatch('SET_DEEP_EDIT', {
            ...currentDeep,
            selection: {
                ...(currentDeep?.selection || {}),
                nodes: e.shiftKey || e.ctrlKey || e.metaKey ? (currentDeep?.selection?.nodes || []) : [],
                edges: e.shiftKey || e.ctrlKey || e.metaKey ? (currentDeep?.selection?.edges || []) : [],
                handles: nextHandles
            }
        });

        if (!state.editor.selectedElementIds.includes(hit.elementId)) {
            store.dispatch('UPDATE_SELECTION', [hit.elementId]);
        }

        this.interactionState = 'VECTOR_HANDLE_DRAGGING';
        this.dragStart = { x: mouseX, y: mouseY };
        this.vectorHandleDrag = {
            elementId: hit.elementId,
            pathIndex: hit.pathIndex,
            segmentIndex: hit.segmentIndex,
            control: hit.control
        };

        store.dispatch('START_INTERACTION');
        this.initialElementState = {
            id: el.id,
            paths: JSON.parse(JSON.stringify(el.paths || []))
        };
        e.stopPropagation();
    }

    _handleVectorNodeClick(hit, mouseX, mouseY, e) {
        const state = store.getState();
        const slide = this.getActiveContainer(state);
        if (!slide) return;

        const el = slide.elements?.[hit.elementId];
        if (!el || el.type !== 'vector') return;

        // Ensure we're in vector deep edit for this element.
        const deepEdit = state.editor.deepEdit;
        if (!deepEdit || deepEdit.kind !== 'vector' || deepEdit.elementId !== hit.elementId) {
            store.dispatch('SET_DEEP_EDIT', { kind: 'vector', elementId: hit.elementId, selection: { nodes: [] } });
        }

        // Update deep selection for the clicked node.
        const latestState = store.getState();
        const currentDeep = latestState.editor.deepEdit;
        const currentNodes = currentDeep?.selection?.nodes || [];
        const nodeId = `p${hit.pathIndex}:${hit.nodeKind === 'start' ? 'start' : `s${(hit.segmentIndex ?? 0) + 1}`}`;
        let nextNodes;

        if (e.ctrlKey || e.metaKey) {
            const set = new Set(currentNodes);
            if (set.has(nodeId)) set.delete(nodeId);
            else set.add(nodeId);
            nextNodes = Array.from(set);
        } else if (e.shiftKey) {
            nextNodes = Array.from(new Set([...currentNodes, nodeId]));
        } else {
            nextNodes = [nodeId];
        }

        nextNodes.sort((a, b) => a.localeCompare(b));
        store.dispatch('SET_DEEP_EDIT', { ...currentDeep, selection: { ...(currentDeep?.selection || {}), nodes: nextNodes } });

        // Keep element selected while deep editing.
        if (!state.editor.selectedElementIds.includes(hit.elementId)) {
            store.dispatch('UPDATE_SELECTION', [hit.elementId]);
        }

        this.interactionState = 'VECTOR_NODE_DRAGGING';
        this.dragStart = { x: mouseX, y: mouseY };
        this.vectorNodeDrag = {
            elementId: hit.elementId,
            pathIndex: hit.pathIndex,
            nodeKind: hit.nodeKind,
            nodeIndex: hit.nodeIndex,
            segmentIndex: hit.segmentIndex
        };

        // Snapshot once for undo coalescing.
        store.dispatch('START_INTERACTION');

        // Store initial element state (deep copy of paths) for idempotent dragging.
        this.initialElementState = {
            id: el.id,
            paths: JSON.parse(JSON.stringify(el.paths || []))
        };
        e.stopPropagation();
    }

    _handleHandleClick(hit, mouseX, mouseY, e) {
        this.interactionState = 'RESIZING';
        this.activeHandle = hit.handle;
        this.interactionAction = hit.action;
        this.dragStart = { x: mouseX, y: mouseY };
        
        store.dispatch('START_INTERACTION');

        const state = store.getState();
        const slide = this.getActiveContainer(state);
        const { zoom, pan } = state.editor;

        if (hit.id === 'multi-selection') {
            this.initialElementState = {};
            state.editor.selectedElementIds.forEach(id => {
                const el = slide.elements[id];
                if (el) this.initialElementState[id] = { ...el };
            });
            this.initialSelectionBounds = this.getSelectionBounds(slide, state.editor.selectedElementIds);
        } else {
            const el = slide.elements[hit.id];
            this.initialElementState = { ...el };
            this.initialSelectionBounds = null;
            
            // For rotation: calculate initial mouse angle relative to element center
            if (hit.action === 'rotate' && el) {
                let absX = el.x;
                let absY = el.y;
                
                if (el.parentId) {
                    let parent = slide.elements[el.parentId];
                    while (parent) {
                        absX += parent.x;
                        absY += parent.y;
                        parent = slide.elements[parent.parentId];
                    }
                }
                
                const cx = absX + el.width / 2;
                const cy = absY + el.height / 2;
                const worldMouseX = (mouseX - pan.x) / zoom;
                const worldMouseY = (mouseY - pan.y) / zoom;
                
                this.initialRotationAngle = Math.atan2(worldMouseY - cy, worldMouseX - cx) * 180 / Math.PI;
            }
        }
        e.stopPropagation();
    }

    _handleElementClick(hit, mouseX, mouseY, e) {
        // Handle Inherited Elements (Placeholders)
        if (hit.isInherited) {
            if (hit.element.isPlaceholder) {
                store.dispatch('INSTANTIATE_PLACEHOLDER', { 
                    placeholderId: hit.id,
                    element: hit.element
                });
                
                // Just select the element, do NOT enter edit mode automatically
                // The user must double-click to edit (handled by handleDoubleClick)
                store.dispatch('UPDATE_SELECTION', [hit.id]);
                return;
            } else {
                return;
            }
        }

        this.interactionState = 'DRAGGING';
        this.dragStart = { x: mouseX, y: mouseY };
        
        const state = store.getState();
        const slide = this.getActiveContainer(state);
        let targetId = hit.id;

        // Deep Select Logic (Ctrl/Cmd + Click)
        if (!e.ctrlKey && !e.metaKey) {
            if (state.editor.selectedElementIds.includes(hit.id)) {
                targetId = hit.id;
            } else {
                let el = slide.elements[targetId];
                while (el && el.parentId) {
                    el = slide.elements[el.parentId];
                }
                if (el) targetId = el.id;
            }
        }
        
        const isSelected = state.editor.selectedElementIds.includes(targetId);
        
        if (!e.shiftKey) {
            if (!isSelected) {
                store.dispatch('UPDATE_SELECTION', [targetId]);
            }
        } else {
            if (isSelected) {
                const newSelection = state.editor.selectedElementIds.filter(id => id !== targetId);
                store.dispatch('UPDATE_SELECTION', newSelection);
            } else {
                store.dispatch('UPDATE_SELECTION', [...state.editor.selectedElementIds, targetId]);
            }
        }

        // Alt + Drag to Duplicate
        if (e.altKey) {
            store.dispatch('DUPLICATE_ELEMENTS', { ids: null, offset: false });
        }
        
        // Store initial state for all selected elements
        const newState = store.getState();
        this.initialElementState = {};
        const activeContainer = this.getActiveContainer(newState);
        newState.editor.selectedElementIds.forEach(id => {
            const el = activeContainer ? activeContainer.elements[id] : null;
            if (el) this.initialElementState[id] = { ...el };
        });

        store.dispatch('START_INTERACTION');
    }

    handleMouseMove(e) {
        const state = store.getState();
        if (state.editor.mode === 'presentation') return;

        const rect = this.container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Broadcast mouse state to CodeFill canvases
        this._broadcastMouseState(mouseX, mouseY, e, state);
        
        switch (this.interactionState) {
            case 'CREATING':
                this.dragCurrent = { x: mouseX, y: mouseY };
                break;
            case 'SELECTING':
                this._handleMarqueeSelection(mouseX, mouseY);
                break;
            case 'VECTOR_SELECTING':
                this._handleVectorMarqueeSelection(mouseX, mouseY, e);
                break;
            case 'PANNING':
                this._handlePanning(mouseX, mouseY, e);
                break;
            case 'DRAGGING':
                this._handleDragging(mouseX, mouseY, e);
                break;
            case 'VECTOR_NODE_DRAGGING':
                this._handleVectorNodeDragging(mouseX, mouseY, e);
                break;
            case 'VECTOR_HANDLE_DRAGGING':
                this._handleVectorHandleDragging(mouseX, mouseY, e);
                break;
            case 'RESIZING':
                this._handleResizing(mouseX, mouseY, e);
                break;
            case 'IDLE':
                this._handleIdleHover(mouseX, mouseY, e);
                break;
        }

        this.lastMouseX = mouseX;
        this.lastMouseY = mouseY;
    }

    _handleVectorHandleDragging(mouseX, mouseY, e) {
        const state = store.getState();
        const slide = this.getActiveContainer(state);
        if (!slide || !this.vectorHandleDrag) return;

        const { zoom } = state.editor;
        const dxWorld = (mouseX - this.dragStart.x) / zoom;
        const dyWorld = (mouseY - this.dragStart.y) / zoom;

        const el = slide.elements?.[this.vectorHandleDrag.elementId];
        if (!el || el.type !== 'vector') return;

        const worldRotationDeg = computeElementWorldRotation(slide, el);
        const rad = (-worldRotationDeg || 0) * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        const dxLocal = dxWorld * cos - dyWorld * sin;
        const dyLocal = dxWorld * sin + dyWorld * cos;

        const basePaths = this.initialElementState?.paths;
        if (!Array.isArray(basePaths)) return;

        const paths = JSON.parse(JSON.stringify(basePaths));
        const path = paths[this.vectorHandleDrag.pathIndex];
        if (!path || !Array.isArray(path.segments)) return;

        const seg = path.segments[this.vectorHandleDrag.segmentIndex];
        if (!seg || seg.kind !== 'cubic') return;

        const key = this.vectorHandleDrag.control;
        if (key !== 'c1' && key !== 'c2') return;
        if (!seg[key]) return;
        seg[key].x = Number(seg[key].x) + dxLocal;
        seg[key].y = Number(seg[key].y) + dyLocal;

        store.dispatch('UPDATE_ELEMENT', { id: el.id, paths });
        e.preventDefault();
    }

    _handleVectorNodeDragging(mouseX, mouseY, e) {
        const state = store.getState();
        const slide = this.getActiveContainer(state);
        if (!slide || !this.vectorNodeDrag) return;

        const { zoom } = state.editor;
        const dxWorld = (mouseX - this.dragStart.x) / zoom;
        const dyWorld = (mouseY - this.dragStart.y) / zoom;

        const el = slide.elements?.[this.vectorNodeDrag.elementId];
        if (!el || el.type !== 'vector') return;

        const worldRotationDeg = computeElementWorldRotation(slide, el);
        const rad = (-worldRotationDeg || 0) * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        const dxLocal = dxWorld * cos - dyWorld * sin;
        const dyLocal = dxWorld * sin + dyWorld * cos;

        const basePaths = this.initialElementState?.paths;
        if (!Array.isArray(basePaths)) return;

        const paths = JSON.parse(JSON.stringify(basePaths));
        const path = paths[this.vectorNodeDrag.pathIndex];
        if (!path) return;

        if (this.vectorNodeDrag.nodeKind === 'start') {
            if (!path.start) return;
            path.start.x = Number(path.start.x) + dxLocal;
            path.start.y = Number(path.start.y) + dyLocal;
        } else {
            const segIndex = this.vectorNodeDrag.segmentIndex;
            if (!Array.isArray(path.segments) || segIndex == null) return;
            const seg = path.segments[segIndex];
            if (!seg || !seg.to) return;
            seg.to.x = Number(seg.to.x) + dxLocal;
            seg.to.y = Number(seg.to.y) + dyLocal;
        }

        store.dispatch('UPDATE_ELEMENT', { id: el.id, paths });
        e.preventDefault();
    }

    _handleMarqueeSelection(mouseX, mouseY) {
        this.dragCurrent = { x: mouseX, y: mouseY };
        
        const state = store.getState();
        const { zoom, pan } = state.editor;
        
        const startX = (this.dragStart.x - pan.x) / zoom;
        const startY = (this.dragStart.y - pan.y) / zoom;
        const currentX = (mouseX - pan.x) / zoom;
        const currentY = (mouseY - pan.y) / zoom;
        
        const marqueeRect = {
            x: Math.min(startX, currentX),
            y: Math.min(startY, currentY),
            width: Math.abs(currentX - startX),
            height: Math.abs(currentY - startY)
        };

        const slide = this.getActiveContainer(state);
        const newSelection = [];
        
        if (slide && slide.elements) {
            Object.values(slide.elements).forEach(el => {
                if (
                    el.x < marqueeRect.x + marqueeRect.width &&
                    el.x + el.width > marqueeRect.x &&
                    el.y < marqueeRect.y + marqueeRect.height &&
                    el.y + el.height > marqueeRect.y
                ) {
                    newSelection.push(el.id);
                }
            });
        }
        
        const currentSelection = state.editor.selectedElementIds;
        const isSame = newSelection.length === currentSelection.length && 
                       newSelection.every(id => currentSelection.includes(id));
        
        if (!isSame) {
            store.dispatch('UPDATE_SELECTION', newSelection);
        }
    }

    _handleVectorMarqueeSelection(mouseX, mouseY, e) {
        this.dragCurrent = { x: mouseX, y: mouseY };

        const state = store.getState();
        const deepEdit = state.editor.deepEdit;
        if (!deepEdit || deepEdit.kind !== 'vector' || !deepEdit.elementId) return;

        const slide = this.getActiveContainer(state);
        const el = slide?.elements?.[deepEdit.elementId];
        if (!slide || !el || el.type !== 'vector' || !Array.isArray(el.paths)) return;

        const { zoom, pan } = state.editor;
        const startX = (this.dragStart.x - pan.x) / zoom;
        const startY = (this.dragStart.y - pan.y) / zoom;
        const currentX = (mouseX - pan.x) / zoom;
        const currentY = (mouseY - pan.y) / zoom;

        const marqueeRect = {
            x: Math.min(startX, currentX),
            y: Math.min(startY, currentY),
            width: Math.abs(currentX - startX),
            height: Math.abs(currentY - startY)
        };

        const absEl = GeometryUtils.getAbsoluteElement(el, slide);
        const rad = (absEl.rotation || 0) * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const cx = absEl.x + absEl.width / 2;
        const cy = absEl.y + absEl.height / 2;

        const nodes = [];
        el.paths.forEach((path, pathIndex) => {
            if (!path) return;

            if (path.start) {
                nodes.push({ id: `p${pathIndex}:start`, local: { x: Number(path.start.x), y: Number(path.start.y) } });
            }
            if (Array.isArray(path.segments)) {
                path.segments.forEach((seg, segIndex) => {
                    if (!seg || !seg.to) return;
                    nodes.push({ id: `p${pathIndex}:s${segIndex + 1}`, local: { x: Number(seg.to.x), y: Number(seg.to.y) } });
                });
            }
        });

        const inBox = [];
        for (const node of nodes) {
            const unrotX = absEl.x + node.local.x;
            const unrotY = absEl.y + node.local.y;

            const dx = unrotX - cx;
            const dy = unrotY - cy;
            const wx = cx + (dx * cos - dy * sin);
            const wy = cy + (dx * sin + dy * cos);

            if (
                wx >= marqueeRect.x &&
                wx <= marqueeRect.x + marqueeRect.width &&
                wy >= marqueeRect.y &&
                wy <= marqueeRect.y + marqueeRect.height
            ) {
                inBox.push(node.id);
            }
        }

        const base = this.vectorMarqueeSelection?.baseSelection || [];
        let nextNodes;

        if (e.ctrlKey || e.metaKey) {
            const set = new Set(base);
            for (const id of inBox) {
                if (set.has(id)) set.delete(id);
                else set.add(id);
            }
            nextNodes = Array.from(set);
        } else {
            nextNodes = Array.from(new Set([...base, ...inBox]));
        }

        nextNodes.sort((a, b) => a.localeCompare(b));

        store.dispatch('SET_DEEP_EDIT', {
            ...deepEdit,
            selection: {
                ...(deepEdit.selection || {}),
                nodes: nextNodes
            }
        });
    }

    _handlePanning(mouseX, mouseY, e) {
        e.preventDefault();
        
        if (this.isPerformancePanning) {
            const deltaX = mouseX - this.dragStart.x;
            const deltaY = mouseY - this.dragStart.y;
            
            const state = store.getState();
            const { zoom } = state.editor;
            const startPan = this.panStart;
            
            // Apply direct CSS transform for performance
            // We move the layers by the delta from the start position
            const newPanX = startPan.x + deltaX;
            const newPanY = startPan.y + deltaY;
            
            // Transform content and background layers
            const transform = `translate(${newPanX}px, ${newPanY}px) scale(${zoom})`;
            if (this.contentLayer) this.contentLayer.style.transform = transform;
            if (this.backgroundLayer) this.backgroundLayer.style.transform = transform;
            
            // Transform canvas element to move the gizmos visually
            // Gizmos are drawn at startPan, so we translate the canvas by delta
            if (this.canvas) {
                this.canvas.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
            }
            
            // Motion Blur (Performance Optimization)
            // Only apply if velocity is significant
            const velocityX = mouseX - this.lastMouseX;
            const velocityY = mouseY - this.lastMouseY;
            const velocity = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
            
            if (this.contentLayer) {
                if (velocity > 15) {
                    // Cap blur at 4px to avoid too much performance cost
                    const blurAmount = Math.min(velocity / 15, 4); 
                    this.contentLayer.style.filter = `blur(${blurAmount}px)`;
                } else {
                    this.contentLayer.style.filter = 'none';
                }
            }
            
        } else {
            const deltaX = mouseX - this.lastMouseX;
            const deltaY = mouseY - this.lastMouseY;
            
            const state = store.getState();
            const { pan } = state.editor;

            store.dispatch('UPDATE_VIEWPORT', {
                pan: {
                    x: pan.x + deltaX,
                    y: pan.y + deltaY
                }
            });
        }
    }

    _handleDragging(mouseX, mouseY, e) {
        const state = store.getState();
        const { zoom } = state.editor;
        
        let dx = (mouseX - this.dragStart.x) / zoom;
        let dy = (mouseY - this.dragStart.y) / zoom;

        // Constrained Movement (Shift Key)
        let constrainedX = false;
        let constrainedY = false;
        if (e.shiftKey) {
            if (Math.abs(dx) > Math.abs(dy)) {
                dy = 0;
                constrainedY = true;
            } else {
                dx = 0;
                constrainedX = true;
            }
        }

        // Single element snapping
        if (state.editor.selectedElementIds.length === 1) {
            const id = state.editor.selectedElementIds[0];
            const initial = this.initialElementState[id];
            const slide = this.getActiveContainer(state);
            
            if (initial) {
                let initialAbsX = initial.x;
                let initialAbsY = initial.y;
                let parentX = 0;
                let parentY = 0;

                if (initial.parentId) {
                    let parent = slide.elements[initial.parentId];
                    while (parent) {
                        parentX += parent.x;
                        parentY += parent.y;
                        parent = slide.elements[parent.parentId];
                    }
                    initialAbsX += parentX;
                    initialAbsY += parentY;
                }

                let newAbsX = initialAbsX + dx;
                let newAbsY = initialAbsY + dy;
                
                // Snap Logic
                const snapResult = this.snapToGuides(id, newAbsX, newAbsY, initial.width, initial.height, zoom);
                
                if (!constrainedX) newAbsX = snapResult.x;
                if (!constrainedY) newAbsY = snapResult.y;
                
                // Spacing Guides
                const spacingResult = this.checkSpacingGuides(id, newAbsX, newAbsY, initial.width, initial.height, zoom);
                
                if (!constrainedX && spacingResult.x !== newAbsX) newAbsX = spacingResult.x;
                if (!constrainedY && spacingResult.y !== newAbsY) newAbsY = spacingResult.y;

                this.activeGuides = [
                    ...snapResult.guides.filter(g => {
                        if (constrainedX && g.type === 'v') return false;
                        if (constrainedY && g.type === 'h') return false;
                        return true;
                    }),
                    ...spacingResult.guides
                ];
                
                const newRelX = newAbsX - parentX;
                const newRelY = newAbsY - parentY;

                store.dispatch('UPDATE_ELEMENT', {
                    id,
                    x: newRelX,
                    y: newRelY
                });
            }
        } else {
            this.activeGuides = [];
            state.editor.selectedElementIds.forEach(id => {
                const initial = this.initialElementState[id];
                if (initial) {
                    store.dispatch('UPDATE_ELEMENT', {
                        id,
                        x: initial.x + dx,
                        y: initial.y + dy
                    });
                }
            });
        }
    }

    _handleResizing(mouseX, mouseY, e) {
        const state = store.getState();
        const { zoom, pan } = state.editor;
        
        if (this.initialSelectionBounds) {
            this._handleMultiSelectionResize(mouseX, mouseY, e, state, zoom);
        } else {
            this._handleSingleElementResize(mouseX, mouseY, e, state, zoom, pan);
        }
    }

    _handleMultiSelectionResize(mouseX, mouseY, e, state, zoom) {
        const initialBounds = this.initialSelectionBounds;
        const dx = (mouseX - this.dragStart.x) / zoom;
        const dy = (mouseY - this.dragStart.y) / zoom;
        
        let localDx = dx;
        let localDy = dy;

        if (e.altKey) {
            localDx *= 2;
            localDy *= 2;
        }

        const shouldConstrain = state.editor.constrainProportions ? !e.shiftKey : e.shiftKey;

        if (shouldConstrain && ['nw', 'ne', 'sw', 'se'].includes(this.activeHandle)) {
            const ratio = initialBounds.width / initialBounds.height;
            if (['nw', 'se'].includes(this.activeHandle)) {
                const avg = (localDx + localDy * ratio) / 2;
                localDx = avg;
                localDy = avg / ratio;
            } else {
                const avg = (localDx - localDy * ratio) / 2;
                localDx = avg;
                localDy = -avg / ratio;
            }
        }

        let newX = initialBounds.x;
        let newY = initialBounds.y;
        let newW = initialBounds.width;
        let newH = initialBounds.height;

        switch (this.activeHandle) {
            case 'e': newW += localDx; break;
            case 'w': newX += localDx; newW -= localDx; break;
            case 's': newH += localDy; break;
            case 'n': newY += localDy; newH -= localDy; break;
            case 'se': newW += localDx; newH += localDy; break;
            case 'sw': newX += localDx; newW -= localDx; newH += localDy; break;
            case 'ne': newY += localDy; newW += localDx; newH -= localDy; break;
            case 'nw': newX += localDx; newY += localDy; newW -= localDx; newH -= localDy; break;
        }

        if (e.altKey) {
            if (['w', 'nw', 'sw'].includes(this.activeHandle)) newX -= localDx / 2;
            if (['n', 'nw', 'ne'].includes(this.activeHandle)) newY -= localDy / 2;
        }

        if (newW < 1) newW = 1;
        if (newH < 1) newH = 1;

        const scaleX = newW / initialBounds.width;
        const scaleY = newH / initialBounds.height;
        
        const slide = this.getActiveContainer(state);

        Object.entries(this.initialElementState).forEach(([id, initialEl]) => {
            let initialAbsX = initialEl.x;
            let initialAbsY = initialEl.y;
            let parentId = initialEl.parentId;
            
            while (parentId) {
                const parent = slide.elements[parentId];
                if (!parent) break;
                initialAbsX += parent.x;
                initialAbsY += parent.y;
                parentId = parent.parentId;
            }

            const newAbsX = newX + (initialAbsX - initialBounds.x) * scaleX;
            const newAbsY = newY + (initialAbsY - initialBounds.y) * scaleY;
            const newAbsW = initialEl.width * scaleX;
            const newAbsH = initialEl.height * scaleY;

            let parentX = 0;
            let parentY = 0;
            if (initialEl.parentId) {
                let parent = slide.elements[initialEl.parentId];
                while (parent) {
                    parentX += parent.x;
                    parentY += parent.y;
                    parent = slide.elements[parent.parentId];
                }
            }
            
            store.dispatch('UPDATE_ELEMENT', {
                id,
                x: newAbsX - parentX,
                y: newAbsY - parentY,
                width: newAbsW,
                height: newAbsH
            });
        });
    }

    _handleSingleElementResize(mouseX, mouseY, e, state, zoom, pan) {
        const id = state.editor.selectedElementIds[0];
        const initial = this.initialElementState;
        
        if (!initial || !id) return;

        const dx = (mouseX - this.dragStart.x) / zoom;
        const dy = (mouseY - this.dragStart.y) / zoom;

        const rad = -(initial.rotation || 0) * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        let localDx = dx * cos - dy * sin;
        let localDy = dx * sin + dy * cos;

        // Handle Rotation
        if (this.interactionAction === 'rotate') {
            this._handleRotation(id, initial, mouseX, mouseY, pan, zoom, e);
            return;
        }

        // Handle Corner Radius
        if (this.interactionAction === 'radius') {
            this._handleRadius(id, initial, localDx, localDy);
            return;
        }

        // Handle Resize
        this._handleResize(id, initial, localDx, localDy, e, state, zoom);
    }

    _handleRotation(id, initial, mouseX, mouseY, pan, zoom, e) {
        const state = store.getState();
        const slide = this.getActiveContainer(state);
        
        let absX = initial.x;
        let absY = initial.y;
        
        if (initial.parentId) {
            let parent = slide.elements[initial.parentId];
            while (parent) {
                absX += parent.x;
                absY += parent.y;
                parent = slide.elements[parent.parentId];
            }
        }

        const cx = absX + initial.width / 2;
        const cy = absY + initial.height / 2;
        
        const worldMouseX = (mouseX - pan.x) / zoom;
        const worldMouseY = (mouseY - pan.y) / zoom;
        
        // Calculate current mouse angle relative to center
        const currentAngle = Math.atan2(worldMouseY - cy, worldMouseX - cx) * 180 / Math.PI;
        
        // Calculate delta from initial mouse angle
        const deltaAngle = currentAngle - this.initialRotationAngle;
        
        // Apply delta to initial rotation
        let newRotation = (initial.rotation || 0) + deltaAngle;
        
        // Normalize to -180 to 180 range for cleaner values
        while (newRotation > 180) newRotation -= 360;
        while (newRotation < -180) newRotation += 360;

        if (e.shiftKey) {
            const snap = 15;
            newRotation = Math.round(newRotation / snap) * snap;
        }
        
        store.dispatch('UPDATE_ELEMENT', {
            id,
            rotation: newRotation
        });
    }

    _handleRadius(id, initial, localDx, localDy) {
        const corner = this.activeHandle.replace('radius-', '');
        let delta = 0;
        
        switch (corner) {
            case 'nw': delta = (localDx + localDy) / 2; break;
            case 'ne': delta = (-localDx + localDy) / 2; break;
            case 'se': delta = (-localDx - localDy) / 2; break;
            case 'sw': delta = (localDx - localDy) / 2; break;
            default: delta = localDy;
        }

        let newRadius = (initial.borderRadius || 0) + delta;
        if (newRadius < 0) newRadius = 0;
        const maxR = Math.min(initial.width, initial.height) / 2;
        if (newRadius > maxR) newRadius = maxR;
        
        store.dispatch('UPDATE_ELEMENT', {
            id,
            borderRadius: newRadius
        });
    }

    _handleResize(id, initial, localDx, localDy, e, state, zoom) {
        const isCenterResize = e.altKey;
        if (isCenterResize) {
            localDx *= 2;
            localDy *= 2;
        }

        const shouldConstrain = state.editor.constrainProportions ? !e.shiftKey : e.shiftKey;

        if (shouldConstrain && ['nw', 'ne', 'sw', 'se'].includes(this.activeHandle)) {
            const ratio = initial.width / initial.height;
            
            if (['nw', 'se'].includes(this.activeHandle)) {
                const avg = (localDx + localDy * ratio) / 2;
                localDx = avg;
                localDy = avg / ratio;
            } else {
                const avg = (localDx - localDy * ratio) / 2;
                localDx = avg;
                localDy = -avg / ratio;
            }
        }

        let newX = initial.x;
        let newY = initial.y;
        let newWidth = initial.width;
        let newHeight = initial.height;

        const rotateBack = (lx, ly) => {
            const r = (initial.rotation || 0) * Math.PI / 180;
            return {
                x: lx * Math.cos(r) - ly * Math.sin(r),
                y: lx * Math.sin(r) + ly * Math.cos(r)
            };
        };

        switch (this.activeHandle) {
            case 'e':
                newWidth = initial.width + localDx;
                break;
            case 'w':
                newWidth = initial.width - localDx;
                const shiftW = rotateBack(localDx, 0);
                newX += shiftW.x;
                newY += shiftW.y;
                break;
            case 's':
                newHeight = initial.height + localDy;
                break;
            case 'n':
                newHeight = initial.height - localDy;
                const shiftN = rotateBack(0, localDy);
                newX += shiftN.x;
                newY += shiftN.y;
                break;
            case 'se':
                newWidth = initial.width + localDx;
                newHeight = initial.height + localDy;
                break;
            case 'sw':
                newWidth = initial.width - localDx;
                newHeight = initial.height + localDy;
                const shiftSW = rotateBack(localDx, 0);
                newX += shiftSW.x;
                newY += shiftSW.y;
                break;
            case 'ne':
                newWidth = initial.width + localDx;
                newHeight = initial.height - localDy;
                const shiftNE = rotateBack(0, localDy);
                newX += shiftNE.x;
                newY += shiftNE.y;
                break;
            case 'nw':
                newWidth = initial.width - localDx;
                newHeight = initial.height - localDy;
                const shiftNW = rotateBack(localDx, localDy);
                newX += shiftNW.x;
                newY += shiftNW.y;
                break;
        }

        // Side Handle Constraint Logic
        if (shouldConstrain && ['n', 's', 'e', 'w'].includes(this.activeHandle)) {
            const ratio = initial.width / initial.height;
            
            if (['e', 'w'].includes(this.activeHandle)) {
                const targetHeight = newWidth / ratio;
                const deltaHeight = targetHeight - newHeight;
                newHeight = targetHeight;
                const shift = rotateBack(0, -deltaHeight / 2);
                newX += shift.x;
                newY += shift.y;
            } else {
                const targetWidth = newHeight * ratio;
                const deltaWidth = targetWidth - newWidth;
                newWidth = targetWidth;
                const shift = rotateBack(-deltaWidth / 2, 0);
                newX += shift.x;
                newY += shift.y;
            }
        }

        if (newWidth < 10) newWidth = 10;
        if (newHeight < 10) newHeight = 10;

        // Snapping Logic
        if (!e.shiftKey && !isCenterResize) {
            const snapResult = this.snapResize(id, this.activeHandle, newX, newY, newWidth, newHeight, zoom);
            newX = snapResult.x;
            newY = snapResult.y;
            newWidth = snapResult.width;
            newHeight = snapResult.height;
            this.activeGuides = snapResult.guides;
        } else {
            this.activeGuides = [];
        }

        if (isCenterResize) {
            const oldCenterX = initial.x + initial.width / 2;
            const oldCenterY = initial.y + initial.height / 2;
            const newCenterX = newX + newWidth / 2;
            const newCenterY = newY + newHeight / 2;
            
            newX -= (newCenterX - oldCenterX);
            newY -= (newCenterY - oldCenterY);
        }

        const updatePayload = {
            id,
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight
        };

        // Handle text element resizing mode
        const slide = this.getActiveContainer(state);
        const element = slide?.elements[id];
        if (element?.type === 'text') {
            // Check root level first, then style level for resizing mode
            const currentResizing = element.resizing || element.style?.resizing;
            const isWidthOnlyHandle = ['e', 'w'].includes(this.activeHandle);
            
            if (currentResizing === 'autoSize') {
                const newMode = isWidthOnlyHandle ? 'fixedWidth' : 'fixed';
                updatePayload.style = { ...element.style, resizing: newMode };
            } else if (currentResizing === 'fixedWidth' && !isWidthOnlyHandle) {
                updatePayload.style = { ...element.style, resizing: 'fixed' };
            }
        }

        store.dispatch('UPDATE_ELEMENT', updatePayload);
    }

    _handleIdleHover(mouseX, mouseY, e) {
        const hit = this.hitTest(mouseX, mouseY);
        const state = store.getState();
        
        if (hit) {
            if (hit.type === 'handle') {
                if (hit.action === 'rotate') {
                    // Use 'alias' cursor which resembles rotation on most systems
                    cursorManager.push('alias', 'rotation-handle-hover');
                } else if (hit.action === 'radius') {
                    cursorManager.push('default', 'radius-handle-hover');
                } else {
                    // Resize handle - get rotation-aware cursor
                    const slide = this.getActiveContainer(state);
                    let rotation = 0;
                    
                    // Get element rotation for single selection
                    if (state.editor.selectedElementIds.length === 1) {
                        const el = slide?.elements[state.editor.selectedElementIds[0]];
                        rotation = el?.rotation || 0;
                    }
                    
                    cursorManager.pushResizeCursor(hit.handle, rotation, 'resize-handle-hover');
                }
                this.container.style.cursor = cursorManager.getCurrentCursor();
            } else {
                // Element hover - show move cursor
                cursorManager.push('move', 'element-hover');
                this.container.style.cursor = cursorManager.getCurrentCursor();
            }
            
            if (hit.type === 'element') {
                let targetId = hit.id;
                
                if (!e.ctrlKey && !e.metaKey) {
                    const slide = this.getActiveContainer(state);
                    if (slide) {
                        let el = slide.elements[targetId];
                        while (el && el.parentId) {
                            el = slide.elements[el.parentId];
                        }
                        if (el) targetId = el.id;
                    }
                }
                
                this.hoveredElementId = targetId;
            } else {
                this.hoveredElementId = null;
            }
        } else {
            // No hit - clear cursor stack and show default
            cursorManager.pop('rotation-handle-hover');
            cursorManager.pop('radius-handle-hover');
            cursorManager.pop('resize-handle-hover');
            cursorManager.pop('element-hover');
            this.container.style.cursor = 'default';
            this.hoveredElementId = null;
        }

        // Distance Measurement (Alt + Hover)
        if (e.altKey) {
            this.updateMeasurementGuides(mouseX, mouseY);
        } else {
            this.measurementGuides = null;
        }
    }

    handleMouseUp(e) {
        const state = store.getState();
        if (state.editor.mode === 'presentation') return;

        // Broadcast mouse up to CodeFill canvases
        const rect = this.container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        this._broadcastMouseState(mouseX, mouseY, e, state, false);

        // Commit Performance Panning
        if (this.isPerformancePanning) {
            const deltaX = mouseX - this.dragStart.x;
            const deltaY = mouseY - this.dragStart.y;
            
            // Commit final pan to store
            store.dispatch('UPDATE_VIEWPORT', {
                pan: {
                    x: this.panStart.x + deltaX,
                    y: this.panStart.y + deltaY
                }
            });
            
            // Reset temporary transforms (Canvas only - content/bg will be updated by store subscription)
            // We reset canvas transform because GizmoRenderer will redraw at new store coordinates
            if (this.canvas) this.canvas.style.transform = '';
            if (this.contentLayer) this.contentLayer.style.filter = 'none';
            
            this.isPerformancePanning = false;
            this.panStart = null;
        }

        if (this.interactionState === 'RESIZING' || this.interactionState === 'DRAGGING' || this.interactionState === 'VECTOR_NODE_DRAGGING' || this.interactionState === 'VECTOR_HANDLE_DRAGGING') {
            // Check for click (no drag) on local placeholder
            if (this.interactionState === 'DRAGGING') {
                const dist = Math.hypot(mouseX - this.dragStart.x, mouseY - this.dragStart.y);
                if (dist < 3) {
                    // Logic removed: Single click on placeholder should NOT enter edit mode.
                    // It should only select. Double click handles editing.
                }
            }

            store.dispatch('END_INTERACTION');
        }

        this.activeGuides = [];
        
        if (this.interactionState === 'CREATING') {
            this._handleCreationComplete(e, state);
        }

        this.interactionState = 'IDLE';
        
        // Clear panning state
        cursorManager.pop('panning');
        document.body.classList.remove('is-panning');
        
        if (this.isSpacePressed || state.editor.activeTool === 'hand') {
            this.container.style.cursor = 'grab';
        } else {
            this.container.style.cursor = 'default';
        }

        this.activeHandle = null;
        this.initialElementState = {};
        this.initialRotationAngle = null;
        this.vectorNodeDrag = null;
        this.vectorMarqueeSelection = null;
        this.vectorHandleDrag = null;
    }

    /**
     * Broadcast mouse state to CodeFill canvases via MouseStateManager
     * @param {number} mouseX - Mouse X in screen space
     * @param {number} mouseY - Mouse Y in screen space
     * @param {MouseEvent} e - Original mouse event
     * @param {Object} state - Current app state
     * @param {boolean|undefined} isDown - Force isDown state (for mousedown/mouseup)
     * @private
     */
    _broadcastMouseState(mouseX, mouseY, e, state, isDown) {
        // Don't broadcast during text editing
        if (state.editor.editingElementId) {
            return;
        }
        
        // Don't broadcast if an input field is focused
        if (InputManager.isInputActive()) {
            return;
        }
        
        const { zoom, pan } = state.editor;
        
        // Calculate world coordinates (slide space)
        const worldX = (mouseX - pan.x) / zoom;
        const worldY = (mouseY - pan.y) / zoom;
        
        // Determine isDown state
        // During DRAGGING/RESIZING, suppress button state to prevent CodeFill interference
        const isSuppressed = this.interactionState === 'DRAGGING' || 
                            this.interactionState === 'RESIZING' ||
                            this.interactionState === 'VECTOR_NODE_DRAGGING' ||
                            this.interactionState === 'PANNING' ||
                            this.interactionState === 'CREATING' ||
                            this.interactionState === 'SELECTING';
        
        let buttonDown;
        if (isDown !== undefined) {
            // Explicit from mousedown/mouseup
            buttonDown = isDown;
        } else {
            // From mousemove - check e.buttons
            buttonDown = (e.buttons & 1) === 1; // Left button
        }
        
        // Update suppression state
        mouseStateManager.setSuppressed(isSuppressed);
        
        // Broadcast state
        mouseStateManager.update({
            screenX: mouseX,
            screenY: mouseY,
            worldX,
            worldY,
            isDown: isSuppressed ? false : buttonDown,
            button: e.button,
            timestamp: performance.now()
        });
    }

    _handleCreationComplete(e, state) {
        if (state.editor.mode === 'presentation') return;
        const { zoom, pan } = state.editor;
        const activeTool = state.editor.activeTool;
        const activeToolOptions = state.editor.activeToolOptions;

        const startX = (this.dragStart.x - pan.x) / zoom;
        const startY = (this.dragStart.y - pan.y) / zoom;
        const currentX = (this.dragCurrent.x - pan.x) / zoom;
        const currentY = (this.dragCurrent.y - pan.y) / zoom;

        const dx = currentX - startX;
        const dy = currentY - startY;

        let x;
        let y;
        let width;
        let height;

        // Alt/Option: draw from center (start point is center).
        if (e.altKey) {
            width = Math.abs(dx) * 2;
            height = Math.abs(dy) * 2;
            x = startX - width / 2;
            y = startY - height / 2;
        } else {
            x = Math.min(startX, currentX);
            y = Math.min(startY, currentY);
            width = Math.abs(dx);
            height = Math.abs(dy);
        }

        // Check if this is a drag (box drawn) vs click (no box)
        const isDrag = width > 5 || height > 5;

        if (e.shiftKey && isDrag) {
            const size = Math.max(width, height);
            width = size;
            height = size;

            if (e.altKey) {
                // Keep centered on start point.
                x = startX - size / 2;
                y = startY - size / 2;
            } else {
                if (currentX < startX) x = startX - size;
                if (currentY < startY) y = startY - size;
            }
        }

        // Handle text tool specially - click creates auto-size, drag creates fixed
        // In master editing mode, all text elements are fixed size by default
        const isMasterMode = state.editor.mode === 'master';
        
        if (activeTool === 'text') {
            const id = `text-${Date.now()}`;
            let element;
            
            if (isDrag) {
                // Click-drag: Fixed width and height (user intent to set specific size)
                element = {
                    id,
                    type: 'text',
                    x,
                    y,
                    width: Math.max(width, 50),
                    height: Math.max(height, 50),
                    rotation: 0,
                    content: '<p>Text</p>',
                    fontSize: 32,
                    fontFamily: 'Inter',
                    textFill: { type: 'solid', value: '#000000' },
                    textAlign: 'left',
                    lineHeight: 'auto',
                    letterSpacing: 0,
                    resizing: 'fixed'
                };
                
                store.dispatch('ADD_ELEMENT', element);
                store.dispatch('UPDATE_SELECTION', [id]);
                store.dispatch('SET_ACTIVE_TOOL', 'select');
                
                // Lock aspect ratio if shift was held during drag
                // Before drag start: shift = square (1:1 ratio)
                // After drag start: shift = lock at current aspect ratio
                if (e.shiftKey) {
                    store.dispatch('TOGGLE_CONSTRAIN_PROPORTIONS', true);
                }
                
                // Enter text edit mode immediately (mark as newly created)
                store.dispatch('SET_EDITING_ELEMENT', { 
                    id, 
                    selectionType: 'all',
                    clickPosition: { clientX: e.clientX, clientY: e.clientY },
                    isNewlyCreated: true
                });
            } else if (isMasterMode) {
                // Master mode click: Create fixed-size placeholder text
                // All text elements in layout masters should be fixed size
                element = {
                    id,
                    type: 'text',
                    x: startX,
                    y: startY,
                    width: 400, // Default placeholder width
                    height: 80, // Default placeholder height
                    rotation: 0,
                    content: '<p>Text</p>',
                    fontSize: 32,
                    fontFamily: 'Inter',
                    textFill: { type: 'solid', value: '#000000' },
                    textAlign: 'left',
                    lineHeight: 'auto',
                    letterSpacing: 0,
                    resizing: 'fixed'
                };
                
                store.dispatch('ADD_ELEMENT', element);
                store.dispatch('UPDATE_SELECTION', [id]);
                store.dispatch('SET_ACTIVE_TOOL', 'select');
                
                // Enter text edit mode immediately (mark as newly created)
                store.dispatch('SET_EDITING_ELEMENT', { 
                    id, 
                    selectionType: 'all',
                    clickPosition: { clientX: e.clientX, clientY: e.clientY },
                    isNewlyCreated: true
                });
            } else {
                // Click only (not in master mode): Auto-size (free width and height)
                // No aspect ratio lock applies to auto-size text
                element = {
                    id,
                    type: 'text',
                    x: startX,
                    y: startY,
                    width: 200, // Initial width, will auto-size
                    height: 50, // Initial height, will auto-size
                    rotation: 0,
                    content: '',
                    fontSize: 32,
                    fontFamily: 'Inter',
                    textFill: { type: 'solid', value: '#000000' },
                    textAlign: 'left',
                    lineHeight: 'auto',
                    letterSpacing: 0,
                    resizing: 'autoSize'
                };
                
                store.dispatch('ADD_ELEMENT', element);
                store.dispatch('UPDATE_SELECTION', [id]);
                store.dispatch('SET_ACTIVE_TOOL', 'select');
                
                // Enter text edit mode immediately (mark as newly created)
                store.dispatch('SET_EDITING_ELEMENT', { 
                    id, 
                    selectionType: 'all',
                    clickPosition: { clientX: e.clientX, clientY: e.clientY },
                    isNewlyCreated: true
                });
            }
            return;
        }

        // For non-text tools, require a minimum drag size.
        // Spec 39: for line/arrow, minimum threshold is based on segment length.

        const minPx = 5;

        const makeDefaultShapeStyle = () => ({
            fills: [{
                type: 'solid',
                // Use the existing legacy default so new shapes are visible immediately.
                value: '#D9D9D9',
                color: '#D9D9D9',
                visible: true,
                opacity: 100
            }],
            borderWidth: 0
        });

        const makeDefaultLineStyle = () => {
            const stroke = {
                color: '#000000',
                width: 2,
                opacity: 100,
                position: 'center',
                visible: true
            };
            return {
                strokes: [stroke],
                borderWidth: stroke.width,
                borderColor: stroke.color,
                strokeAlign: stroke.position
            };
        };

        const createShapeFromOptions = () => {
            const optKind = (activeToolOptions && typeof activeToolOptions === 'object' && typeof activeToolOptions.shapeKind === 'string')
                ? activeToolOptions.shapeKind
                : 'rectangle';

            // Use raw start/current for line kinds (so min threshold is length-based)
            let endX = currentX;
            let endY = currentY;

            // Shift constrain
            if (e.shiftKey && isDrag) {
                if (optKind === 'line') {
                    const ang = Math.atan2(dy, dx);
                    const snap = Math.PI / 4; // 45°
                    const snapped = Math.round(ang / snap) * snap;
                    const len = Math.sqrt(dx * dx + dy * dy);
                    endX = startX + Math.cos(snapped) * len;
                    endY = startY + Math.sin(snapped) * len;
                } else {
                    // Square/circle for box-based shapes is already handled above.
                }
            }

            if (optKind === 'line') {
                const isArrow = activeToolOptions?.lineEndCap === 'arrow';

                // Alt: draw from center, symmetric endpoints.
                const a1 = e.altKey ? { x: startX - (endX - startX), y: startY - (endY - startY) } : { x: startX, y: startY };
                const a2 = e.altKey ? { x: endX, y: endY } : { x: endX, y: endY };

                const lx = a2.x - a1.x;
                const ly = a2.y - a1.y;
                const segLen = Math.sqrt(lx * lx + ly * ly);
                if (segLen <= minPx) return null;

                const bx = Math.min(a1.x, a2.x);
                const by = Math.min(a1.y, a2.y);
                const bw = Math.abs(a2.x - a1.x);
                const bh = Math.abs(a2.y - a1.y);

                const id = `shape-${Date.now()}`;
                const element = {
                    id,
                    type: 'shape',
                    shapeKind: 'line',
                    x: bx,
                    y: by,
                    width: Math.max(1, bw),
                    height: Math.max(1, bh),
                    rotation: 0,
                    params: {
                        p1: { x: a1.x - bx, y: a1.y - by },
                        p2: { x: a2.x - bx, y: a2.y - by },
                        ...(isArrow ? { endCap: 'arrow' } : {})
                    },
                    style: makeDefaultLineStyle()
                };
                return element;
            }

            // Box-based shapes
            if (!(width > minPx && height > minPx)) return null;

            const id = `shape-${Date.now()}`;

            if (optKind === 'rectangle') {
                // Keep legacy rect output for v1 compatibility.
                return {
                    id,
                    type: 'rect',
                    x,
                    y,
                    width,
                    height,
                    rotation: 0,
                    style: makeDefaultShapeStyle()
                };
            }

            if (optKind === 'ellipse') {
                return {
                    id,
                    type: 'shape',
                    shapeKind: 'ellipse',
                    x,
                    y,
                    width,
                    height,
                    rotation: 0,
                    params: {},
                    style: makeDefaultShapeStyle()
                };
            }

            if (optKind === 'polygon') {
                return {
                    id,
                    type: 'shape',
                    shapeKind: 'polygon',
                    x,
                    y,
                    width,
                    height,
                    rotation: 0,
                    params: { sides: 6, rotation: 0 },
                    style: makeDefaultShapeStyle()
                };
            }

            if (optKind === 'star') {
                return {
                    id,
                    type: 'shape',
                    shapeKind: 'star',
                    x,
                    y,
                    width,
                    height,
                    rotation: 0,
                    params: { points: 5, innerRadiusRatio: 0.5, rotation: 0 },
                    style: makeDefaultShapeStyle()
                };
            }

            return null;
        };

        if (activeTool === 'shape') {
            const element = createShapeFromOptions();
            if (!element) return;
            store.dispatch('ADD_ELEMENT', element);
            store.dispatch('UPDATE_SELECTION', [element.id]);
            store.dispatch('SET_ACTIVE_TOOL', 'select');
            return;
        }

        // Legacy for other tools
        if (width > minPx && height > minPx) {
            const id = `${activeTool}-${Date.now()}`;
            let element = {
                id,
                type: activeTool,
                x,
                y,
                width,
                height,
                rotation: 0
            };

            if (activeTool === 'image') {
                element.src = 'https://placehold.co/600x400';
                element.style = {};
            }

            store.dispatch('ADD_ELEMENT', element);
            store.dispatch('UPDATE_SELECTION', [id]);
            store.dispatch('SET_ACTIVE_TOOL', 'select');
        }
    }

    handleDoubleClick(e) {
        // De-dupe: this handler is registered on both container + canvas.
        // Suppress only the immediate duplicate event for the same gesture.
        const ts = typeof e.timeStamp === 'number' ? e.timeStamp : Date.now();
        const last = this._lastDblClickMeta;
        if (
            last &&
            Math.abs(ts - last.ts) <= 5 &&
            last.x === e.clientX &&
            last.y === e.clientY
        ) {
            return;
        }
        this._lastDblClickMeta = { ts, x: e.clientX, y: e.clientY };
        
        const state = store.getState();
        if (state.editor.mode === 'presentation') return;
        if (state.editor.editingElementId) return;

        const rect = this.container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const hit = this.hitTest(mouseX, mouseY);

        // Vector deep edit double-click behaviors.
        if (state.editor.deepEdit && state.editor.deepEdit.kind === 'vector') {
            if (hit && hit.type === 'vector-edge') {
                this._insertVectorNodeOnEdge(hit);
                return;
            }

            if (hit && hit.type === 'vector-node') {
                this._toggleVectorNodeCornerSmooth(hit);
                return;
            }
        }

        if (hit && hit.type === 'element') {
            const container = this.getActiveContainer(state);
            // Get element from container or from hit (for inherited/layout elements)
            let element = container?.elements?.[hit.id] || hit.element;

            if (element) {
                if (element.type === 'text') {
                    // For inherited elements, instantiate first then enter edit mode
                    if (hit.isInherited && element.isPlaceholder) {
                        store.dispatch('INSTANTIATE_PLACEHOLDER', { 
                            placeholderId: hit.id,
                            element: element
                        });
                    }
                    // Enter edit mode
                    store.dispatch('SET_EDITING_ELEMENT', { 
                        id: hit.id, 
                        selectionType: 'caret',
                        clickPosition: { clientX: e.clientX, clientY: e.clientY }
                    });
                } else if (element.type === 'vector') {
                    store.dispatch('UPDATE_SELECTION', [hit.id]);
                    store.dispatch('SET_DEEP_EDIT', { kind: 'vector', elementId: hit.id, selection: { nodes: [] } });
                } else {
                    store.dispatch('UPDATE_SELECTION', [hit.id]);
                }
            }
        }
    }

    _insertVectorNodeOnEdge(hit) {
        const state = store.getState();
        const deepEdit = state.editor.deepEdit;
        if (!deepEdit || deepEdit.kind !== 'vector' || !deepEdit.elementId) return;

        const slide = this.getActiveContainer(state);
        const el = slide?.elements?.[deepEdit.elementId];
        if (!slide || !el || el.type !== 'vector' || !Array.isArray(el.paths)) return;

        const path = el.paths?.[hit.pathIndex];
        if (!path || !path.start || !Array.isArray(path.segments)) return;

        const segIndex = hit.segmentIndex;
        const seg = path.segments?.[segIndex];
        if (!seg || seg.kind !== 'line' || !seg.to) return;

        const t = Math.max(0, Math.min(1, Number(hit.t)));

        const getNodePoint = (index) => {
            if (index < 0) return { x: Number(path.start.x), y: Number(path.start.y) };
            const s = path.segments[index];
            return { x: Number(s?.to?.x), y: Number(s?.to?.y) };
        };

        const a = segIndex === 0 ? { x: Number(path.start.x), y: Number(path.start.y) } : getNodePoint(segIndex - 1);
        const b = { x: Number(seg.to.x), y: Number(seg.to.y) };
        const ix = a.x + (b.x - a.x) * t;
        const iy = a.y + (b.y - a.y) * t;

        const nextPaths = JSON.parse(JSON.stringify(el.paths));
        const nextPath = nextPaths[hit.pathIndex];
        const oldSeg = nextPath.segments[segIndex];

        const inserted = { x: ix, y: iy };
        nextPath.segments.splice(
            segIndex,
            1,
            { kind: 'line', to: inserted },
            { kind: oldSeg.kind, to: oldSeg.to }
        );

        store.dispatch('START_INTERACTION');
        store.dispatch('UPDATE_ELEMENT', { id: el.id, paths: nextPaths });
        store.dispatch('END_INTERACTION');

        const insertedNodeId = `p${hit.pathIndex}:s${segIndex + 1}`;
        store.dispatch('SET_DEEP_EDIT', {
            ...deepEdit,
            selection: {
                ...(deepEdit.selection || {}),
                nodes: [insertedNodeId]
            }
        });
    }

    _toggleVectorNodeCornerSmooth(hit) {
        const state = store.getState();
        const deepEdit = state.editor.deepEdit;
        if (!deepEdit || deepEdit.kind !== 'vector' || !deepEdit.elementId) return;

        const slide = this.getActiveContainer(state);
        const el = slide?.elements?.[deepEdit.elementId];
        if (!slide || !el || el.type !== 'vector' || !Array.isArray(el.paths)) return;

        const pathIndex = hit.pathIndex;
        const nextPaths = JSON.parse(JSON.stringify(el.paths));
        const path = nextPaths[pathIndex];
        if (!path || !path.start || !Array.isArray(path.segments) || path.segments.length === 0) return;

        const eps = 0.001;
        const dist = (a, b) => {
            const dx = Number(a.x) - Number(b.x);
            const dy = Number(a.y) - Number(b.y);
            return Math.sqrt(dx * dx + dy * dy);
        };
        const norm = (vx, vy) => {
            const len = Math.sqrt(vx * vx + vy * vy);
            if (len <= 0) return { x: 0, y: 0, len: 0 };
            return { x: vx / len, y: vy / len, len };
        };

        const nodeId = `p${pathIndex}:${hit.nodeKind === 'start' ? 'start' : `s${(hit.segmentIndex ?? 0) + 1}`}`;

        // Resolve anchor point.
        let anchor;
        if (hit.nodeKind === 'start') {
            anchor = { x: Number(path.start.x), y: Number(path.start.y) };
        } else {
            const inSeg = path.segments[hit.segmentIndex];
            if (!inSeg || !inSeg.to) return;
            anchor = { x: Number(inSeg.to.x), y: Number(inSeg.to.y) };
        }

        // Determine incoming/outgoing segment indices.
        let incomingSegIndex = null;
        let outgoingSegIndex = null;

        if (hit.nodeKind === 'start') {
            outgoingSegIndex = 0;
            if (path.closed) incomingSegIndex = path.segments.length - 1;
        } else {
            incomingSegIndex = hit.segmentIndex;
            if (hit.segmentIndex + 1 < path.segments.length) outgoingSegIndex = hit.segmentIndex + 1;
            else if (path.closed) outgoingSegIndex = 0;
        }

        const getNodePointAtSegmentEnd = (segIndex) => {
            const s = path.segments[segIndex];
            return s && s.to ? { x: Number(s.to.x), y: Number(s.to.y) } : null;
        };
        const getNodePointBeforeSegment = (segIndex) => {
            if (segIndex === 0) return { x: Number(path.start.x), y: Number(path.start.y) };
            return getNodePointAtSegmentEnd(segIndex - 1);
        };

        const incomingSeg = incomingSegIndex != null ? path.segments[incomingSegIndex] : null;
        const outgoingSeg = outgoingSegIndex != null ? path.segments[outgoingSegIndex] : null;

        const prevPoint = incomingSegIndex != null ? getNodePointBeforeSegment(incomingSegIndex) : null;
        const nextPoint = outgoingSegIndex != null ? getNodePointAtSegmentEnd(outgoingSegIndex) : null;

        const ensureCubic = (segIndex, startPt, endPt) => {
            const s = path.segments[segIndex];
            if (!s || !endPt) return;
            if (s.kind === 'cubic') return;
            if (s.kind === 'line') {
                s.kind = 'cubic';
                s.c1 = {
                    x: Number(startPt.x) + (Number(endPt.x) - Number(startPt.x)) / 3,
                    y: Number(startPt.y) + (Number(endPt.y) - Number(startPt.y)) / 3
                };
                s.c2 = {
                    x: Number(startPt.x) + 2 * (Number(endPt.x) - Number(startPt.x)) / 3,
                    y: Number(startPt.y) + 2 * (Number(endPt.y) - Number(startPt.y)) / 3
                };
            }
        };

        // Determine whether this node is currently "smooth" (any adjacent handle non-zero).
        const isSmooth = (() => {
            let smooth = false;
            if (incomingSeg && incomingSeg.kind === 'cubic' && incomingSeg.c2) {
                if (dist(incomingSeg.c2, anchor) > eps) smooth = true;
            }
            if (outgoingSeg && outgoingSeg.kind === 'cubic' && outgoingSeg.c1) {
                if (dist(outgoingSeg.c1, anchor) > eps) smooth = true;
            }
            return smooth;
        })();

        if (!isSmooth) {
            // Corner -> Smooth: ensure cubic segments and expand the node-adjacent handles.
            if (incomingSegIndex != null && prevPoint) {
                ensureCubic(incomingSegIndex, prevPoint, anchor);
            }
            if (outgoingSegIndex != null && nextPoint) {
                ensureCubic(outgoingSegIndex, anchor, nextPoint);
            }

            const inVec = prevPoint ? norm(anchor.x - prevPoint.x, anchor.y - prevPoint.y) : { x: 0, y: 0, len: 0 };
            const outVec = nextPoint ? norm(nextPoint.x - anchor.x, nextPoint.y - anchor.y) : { x: 0, y: 0, len: 0 };

            const baseLen = (() => {
                if (inVec.len > 0 && outVec.len > 0) return Math.min(inVec.len, outVec.len);
                return Math.max(inVec.len, outVec.len);
            })();
            const handleLen = Math.max(4, Math.min(baseLen / 3, 40));

            const inSeg2 = incomingSegIndex != null ? path.segments[incomingSegIndex] : null;
            if (inSeg2 && inSeg2.kind === 'cubic') {
                inSeg2.c2 = { x: anchor.x - inVec.x * handleLen, y: anchor.y - inVec.y * handleLen };
            }
            const outSeg2 = outgoingSegIndex != null ? path.segments[outgoingSegIndex] : null;
            if (outSeg2 && outSeg2.kind === 'cubic') {
                outSeg2.c1 = { x: anchor.x + outVec.x * handleLen, y: anchor.y + outVec.y * handleLen };
            }
        } else {
            // Smooth -> Corner: collapse the node-adjacent handles to the anchor.
            if (incomingSegIndex != null) {
                const s = path.segments[incomingSegIndex];
                if (s && s.kind === 'cubic') {
                    s.c2 = { x: anchor.x, y: anchor.y };
                }
            }
            if (outgoingSegIndex != null) {
                const s = path.segments[outgoingSegIndex];
                if (s && s.kind === 'cubic') {
                    s.c1 = { x: anchor.x, y: anchor.y };
                }
            }
        }

        store.dispatch('START_INTERACTION');
        store.dispatch('UPDATE_ELEMENT', { id: el.id, paths: nextPaths });
        store.dispatch('END_INTERACTION');

        store.dispatch('SET_DEEP_EDIT', {
            ...deepEdit,
            selection: {
                ...(deepEdit.selection || {}),
                nodes: [nodeId],
                edges: [],
                handles: []
            }
        });
    }

    _applyVectorNodeNudge(dx, dy) {
        const state = store.getState();
        const deepEdit = state.editor.deepEdit;
        if (!deepEdit || deepEdit.kind !== 'vector' || !deepEdit.elementId) return;

        const nodes = deepEdit.selection?.nodes;
        if (!Array.isArray(nodes) || nodes.length === 0) return;

        const slide = this.getActiveContainer(state);
        const el = slide?.elements?.[deepEdit.elementId];
        if (!slide || !el || el.type !== 'vector' || !Array.isArray(el.paths)) return;

        const nextPaths = JSON.parse(JSON.stringify(el.paths));

        for (const nodeId of nodes) {
            const m = /^p(\d+):(start|s(\d+))$/.exec(String(nodeId));
            if (!m) continue;
            const pathIndex = Number(m[1]);
            const kind = m[2];
            const segNum = m[3] ? Number(m[3]) : null;

            const p = nextPaths[pathIndex];
            if (!p || !p.start || !Array.isArray(p.segments)) continue;

            if (kind === 'start') {
                p.start.x = Number(p.start.x) + dx;
                p.start.y = Number(p.start.y) + dy;
            } else if (segNum != null && segNum >= 1) {
                const segIndex = segNum - 1;
                const seg = p.segments[segIndex];
                if (!seg || !seg.to) continue;
                seg.to.x = Number(seg.to.x) + dx;
                seg.to.y = Number(seg.to.y) + dy;
            }
        }

        store.dispatch('START_INTERACTION');
        store.dispatch('UPDATE_ELEMENT', { id: el.id, paths: nextPaths });
        store.dispatch('END_INTERACTION');
    }

    _deleteSelectedVectorNodes() {
        const state = store.getState();
        const deepEdit = state.editor.deepEdit;
        if (!deepEdit || deepEdit.kind !== 'vector' || !deepEdit.elementId) return;

        const nodes = deepEdit.selection?.nodes;
        if (!Array.isArray(nodes) || nodes.length === 0) return;

        const slide = this.getActiveContainer(state);
        const el = slide?.elements?.[deepEdit.elementId];
        if (!slide || !el || el.type !== 'vector' || !Array.isArray(el.paths)) return;

        const nextPaths = JSON.parse(JSON.stringify(el.paths));

        // Group deletions per path to keep index shifts deterministic.
        const deletesByPath = new Map();
        for (const nodeId of nodes) {
            const m = /^p(\d+):(start|s(\d+))$/.exec(String(nodeId));
            if (!m) continue;
            const pathIndex = Number(m[1]);
            const kind = m[2];
            const segNum = m[3] ? Number(m[3]) : null;
            if (!deletesByPath.has(pathIndex)) {
                deletesByPath.set(pathIndex, { deleteStart: false, segmentIndices: [] });
            }
            const entry = deletesByPath.get(pathIndex);
            if (kind === 'start') {
                entry.deleteStart = true;
            } else if (segNum != null && segNum >= 1) {
                entry.segmentIndices.push(segNum - 1);
            }
        }

        for (const [pathIndex, entry] of deletesByPath.entries()) {
            const p = nextPaths[pathIndex];
            if (!p || !p.start || !Array.isArray(p.segments)) continue;

            const uniqueSegs = Array.from(new Set(entry.segmentIndices)).sort((a, b) => b - a);
            for (const segIndex of uniqueSegs) {
                if (segIndex >= 0 && segIndex < p.segments.length) {
                    p.segments.splice(segIndex, 1);
                }
            }

            if (entry.deleteStart) {
                if (p.segments.length > 0 && p.segments[0]?.to) {
                    p.start = { x: Number(p.segments[0].to.x), y: Number(p.segments[0].to.y) };
                    p.segments.splice(0, 1);
                }
            }
        }

        store.dispatch('START_INTERACTION');
        store.dispatch('UPDATE_ELEMENT', { id: el.id, paths: nextPaths });
        store.dispatch('END_INTERACTION');

        store.dispatch('SET_DEEP_EDIT', {
            ...deepEdit,
            selection: {
                ...(deepEdit.selection || {}),
                nodes: []
            }
        });
    }

    _deleteSelectedVectorEdges() {
        const state = store.getState();
        const deepEdit = state.editor.deepEdit;
        if (!deepEdit || deepEdit.kind !== 'vector' || !deepEdit.elementId) return;

        const edges = deepEdit.selection?.edges;
        if (!Array.isArray(edges) || edges.length === 0) return;

        const slide = this.getActiveContainer(state);
        const el = slide?.elements?.[deepEdit.elementId];
        if (!slide || !el || el.type !== 'vector' || !Array.isArray(el.paths)) return;

        const nextPaths = JSON.parse(JSON.stringify(el.paths));

        const deletesByPath = new Map();
        for (const edgeId of edges) {
            const m = /^p(\d+):e(\d+)$/.exec(String(edgeId));
            if (!m) continue;
            const pathIndex = Number(m[1]);
            const segIndex = Number(m[2]);
            if (!deletesByPath.has(pathIndex)) deletesByPath.set(pathIndex, []);
            deletesByPath.get(pathIndex).push(segIndex);
        }

        for (const [pathIndex, segIndices] of deletesByPath.entries()) {
            const p = nextPaths[pathIndex];
            if (!p || !Array.isArray(p.segments)) continue;
            const unique = Array.from(new Set(segIndices)).sort((a, b) => b - a);
            for (const segIndex of unique) {
                if (segIndex >= 0 && segIndex < p.segments.length) {
                    p.segments.splice(segIndex, 1);
                }
            }
        }

        store.dispatch('START_INTERACTION');
        store.dispatch('UPDATE_ELEMENT', { id: el.id, paths: nextPaths });
        store.dispatch('END_INTERACTION');

        store.dispatch('SET_DEEP_EDIT', {
            ...deepEdit,
            selection: {
                ...(deepEdit.selection || {}),
                edges: []
            }
        });
    }

    handleDrop(e) {
        e.preventDefault();
        const state = store.getState();
        if (state.editor.mode === 'presentation') return;

        const rect = this.container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const { zoom, pan } = state.editor;
        const worldX = (mouseX - pan.x) / zoom;
        const worldY = (mouseY - pan.y) / zoom;

        // Handle Icon Drop
        const iconData = e.dataTransfer.getData('application/story-icon');
        if (iconData) {
            try {
                const { iconClass } = JSON.parse(iconData);
                const id = `icon-${Date.now()}`;
                
                store.dispatch('ADD_ELEMENT', {
                    id,
                    type: 'icon',
                    x: worldX - 25,
                    y: worldY - 25,
                    width: 50,
                    height: 50,
                    rotation: 0,
                    content: `<i class="${iconClass}"></i>`,
                    fontSize: 48,
                    textFill: { type: 'solid', value: '#000000' },
                    textAlign: 'center',
                    fontFamily: 'Inter'
                });
                store.dispatch('UPDATE_SELECTION', [id]);
                return;
            } catch (err) {
                console.error('Invalid icon data', err);
            }
        }

        // Handle Media Drop (Image/Video)
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
            const isImage = SUPPORTED_IMAGE_FORMATS.some(fmt => file.type === fmt || file.name.toLowerCase().endsWith(fmt.split('/')[1]));
            const isVideo = SUPPORTED_VIDEO_FORMATS.some(fmt => file.type === fmt || file.name.toLowerCase().endsWith(fmt.split('/')[1]));

            if (isSvg) {
                this.createSvgElement(file, worldX, worldY);
                return;
            }

            if (isImage || isVideo) {
                // Check if dropping onto a selected shape
                const selectedIds = state.editor.selectedElementIds || [];
                const container = this.getActiveContainer(state);
                
                if (selectedIds.length === 1 && container) {
                    const targetElement = container.elements[selectedIds[0]];
                    // Only apply as fill to shapes (not images or text)
                    if (targetElement && targetElement.type === 'shape') {
                        this.applyMediaFillToElement(file, selectedIds[0], isVideo);
                        return;
                    }
                }
                
                // Otherwise create a new element
                if (isImage) {
                    this.createImageElement(file, worldX, worldY);
                } else if (isVideo) {
                    this.createVideoElement(file, worldX, worldY);
                }
            }
        }
    }

    /**
     * Apply media file as fill to an existing shape element
     */
    async applyMediaFillToElement(file, elementId, isVideo = false) {
        try {
            const asset = await mediaAssetManager.importFile(file);
            
            const fillData = isVideo ? {
                type: 'video',
                assetId: asset.assetId,
                scaleMode: 'fill',
                position: { x: 0.5, y: 0.5 },
                opacity: 100,
                visible: true,
                filters: {},
                playback: {
                    autoplay: false,
                    loop: true,
                    muted: true,
                    showControls: false
                }
            } : {
                type: 'image',
                assetId: asset.assetId,
                scaleMode: 'fill',
                position: { x: 0.5, y: 0.5 },
                opacity: 100,
                visible: true,
                filters: {}
            };
            
            // Get current element to preserve existing style
            const state = store.getState();
            const container = this.getActiveContainer(state);
            const element = container?.elements[elementId];
            const currentStyle = element?.style || {};
            
            // Replace first fill or add as first fill
            const currentFills = currentStyle.fills || [];
            const newFills = [fillData, ...currentFills.slice(1)];
            
            store.dispatch('UPDATE_ELEMENT', {
                id: elementId,
                style: {
                    ...currentStyle,
                    fills: newFills
                }
            });
        } catch (error) {
            console.error('Failed to apply media fill:', error);
        }
    }

    /**
     * Create a new image element from dropped file
     */
    createImageElement(file, worldX, worldY) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                const maxSize = 800;
                
                if (width > maxSize || height > maxSize) {
                    const ratio = width / height;
                    if (width > height) {
                        width = maxSize;
                        height = maxSize / ratio;
                    } else {
                        height = maxSize;
                        width = maxSize * ratio;
                    }
                }

                const id = `image-${Date.now()}`;
                store.dispatch('ADD_ELEMENT', {
                    id,
                    type: 'image',
                    x: worldX - width / 2,
                    y: worldY - height / 2,
                    width,
                    height,
                    rotation: 0,
                    src: event.target.result,
                    style: {}
                });
                
                store.dispatch('UPDATE_SELECTION', [id]);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    /**
     * Create a new video element from dropped file
     */
    async createVideoElement(file, worldX, worldY) {
        try {
            const asset = await mediaAssetManager.importFile(file);
            const blobUrl = mediaAssetManager.getBlobUrl(asset.assetId);
            
            // Get video dimensions
            const video = document.createElement('video');
            video.preload = 'metadata';
            
            await new Promise((resolve, reject) => {
                video.onloadedmetadata = resolve;
                video.onerror = reject;
                video.src = blobUrl;
            });
            
            let width = video.videoWidth;
            let height = video.videoHeight;
            const maxSize = 800;
            
            if (width > maxSize || height > maxSize) {
                const ratio = width / height;
                if (width > height) {
                    width = maxSize;
                    height = maxSize / ratio;
                } else {
                    height = maxSize;
                    width = maxSize * ratio;
                }
            }

            const id = `video-${Date.now()}`;
            store.dispatch('ADD_ELEMENT', {
                id,
                type: 'shape',
                shape: 'rectangle',
                x: worldX - width / 2,
                y: worldY - height / 2,
                width,
                height,
                rotation: 0,
                style: {
                    fills: [{
                        type: 'video',
                        assetId: asset.assetId,
                        scaleMode: 'fill',
                        position: { x: 0.5, y: 0.5 },
                        opacity: 100,
                        visible: true,
                        playback: {
                            autoplay: true,
                            loop: true,
                            muted: true,
                            showControls: false
                        }
                    }]
                },
                stroke: { type: 'none' }
            });
            
            store.dispatch('UPDATE_SELECTION', [id]);
        } catch (error) {
            console.error('Failed to create video element:', error);
        }
    }

    /**
     * Create a new SVG element from dropped or pasted file
     */
    async createSvgElement(file, worldX, worldY) {
        try {
            const raw = await file.text();
            const sanitized = sanitizeSvg(raw);
            if (!sanitized.ok) {
                console.warn('SVG rejected:', sanitized.reason);
                return;
            }

            const { width: intrinsicW, height: intrinsicH } = this.getSvgIntrinsicSize(sanitized.svg);

            let width = intrinsicW;
            let height = intrinsicH;
            const maxSize = 800;
            if (width > maxSize || height > maxSize) {
                const ratio = width / height;
                if (width > height) {
                    width = maxSize;
                    height = maxSize / ratio;
                } else {
                    height = maxSize;
                    width = maxSize * ratio;
                }
            }

            const svgHash = await this.hashText(sanitized.svg);
            const id = `svg-${Date.now()}`;

            store.dispatch('ADD_ELEMENT', {
                id,
                type: 'svg',
                x: worldX - width / 2,
                y: worldY - height / 2,
                width,
                height,
                rotation: 0,
                svg: sanitized.svg,
                svgHash,
                fitMode: 'fit'
            });

            store.dispatch('UPDATE_SELECTION', [id]);
        } catch (error) {
            console.error('Failed to create SVG element:', error);
        }
    }

    isEditableSvgPasteEnabled() {
        // Default OFF to avoid behavior changes unless explicitly enabled.
        // Tests can enable via: window.__FEATURE_FLAGS__ = { ENABLE_EDITABLE_SVG_PASTE: true }
        return Boolean(window?.__FEATURE_FLAGS__?.ENABLE_EDITABLE_SVG_PASTE);
    }

    async tryCreateEditableShapesFromSvgMarkup(svgMarkup, worldX, worldY) {
        if (!this.isEditableSvgPasteEnabled()) return false;

        const sanitized = sanitizeSvg(svgMarkup);
        if (!sanitized.ok) {
            return false;
        }

        let svgHash = null;
        try {
            svgHash = await this.hashText(sanitized.svg);
        } catch {
            // ignore
        }

        this._editableSvgPasteCounter = (this._editableSvgPasteCounter || 0) + 1;
        const seedPart = typeof svgHash === 'string' && svgHash.length >= 8 ? svgHash.slice(0, 8) : 'nohash';

        const imported = importEditableShapesFromSanitizedSvg(sanitized.svg, {
            centerX: worldX,
            centerY: worldY,
            idSeed: `paste-${seedPart}-${this._editableSvgPasteCounter}`
        });

        if (!imported.ok || !Array.isArray(imported.elements) || imported.elements.length === 0) {
            return false;
        }

        if (Array.isArray(imported.warnings) && imported.warnings.length > 0) {
            console.warn('Editable SVG import warnings:', imported.warnings);
        }

        store.dispatch('START_INTERACTION');
        try {
            const ids = [];
            for (const el of imported.elements) {
                store.dispatch('ADD_ELEMENT', el);
                if (el?.id) ids.push(el.id);
            }

            if (ids.length > 0) {
                store.dispatch('UPDATE_SELECTION', ids);
            }
        } finally {
            store.dispatch('END_INTERACTION');
        }

        return true;
    }

    getSvgIntrinsicSize(svgMarkup) {
        try {
            const doc = new DOMParser().parseFromString(svgMarkup, 'image/svg+xml');
            const svg = doc.documentElement;

            const vb = svg.getAttribute('viewBox');
            if (vb) {
                const parts = vb.split(/[ ,]+/).map(n => Number(n)).filter(n => Number.isFinite(n));
                if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
                    return { width: parts[2], height: parts[3] };
                }
            }

            const wAttr = svg.getAttribute('width');
            const hAttr = svg.getAttribute('height');
            const w = wAttr ? Number(String(wAttr).replace(/[^0-9.]/g, '')) : NaN;
            const h = hAttr ? Number(String(hAttr).replace(/[^0-9.]/g, '')) : NaN;
            if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
                return { width: w, height: h };
            }
        } catch {
            // fall through
        }

        return { width: 256, height: 256 };
    }

    async hashText(text) {
        const buffer = new TextEncoder().encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Handle clipboard paste for images (screenshots, copied images)
     */
    async handleClipboardPaste(e, state) {
        try {
            const clipboardItems = await navigator.clipboard.read();
            
            for (const item of clipboardItems) {
                // If the clipboard provides HTML, try to extract embedded SVG first.
                // (Figma commonly provides SVG markup via text/html.)
                if (item.types && item.types.includes('text/html')) {
                    try {
                        const htmlBlob = await item.getType('text/html');
                        const html = await htmlBlob.text();
                        const svgMarkup = extractFirstSvgFromHtml(html);
                        if (svgMarkup) {
                            e.preventDefault();

                            const blob = new Blob([svgMarkup], { type: 'image/svg+xml' });
                            const file = new File([blob], `pasted-svg-${Date.now()}.svg`, { type: 'image/svg+xml' });

                            const { zoom, pan } = state.editor;
                            const rect = this.container.getBoundingClientRect();
                            const centerX = (rect.width / 2 - pan.x) / zoom;
                            const centerY = (rect.height / 2 - pan.y) / zoom;

                            if (await this.tryCreateEditableShapesFromSvgMarkup(svgMarkup, centerX, centerY)) {
                                return;
                            }

                            await this.createSvgElement(file, centerX, centerY);
                            return;
                        }
                    } catch {
                        // ignore and fall through
                    }
                }

                // Check for image types
                const imageType = item.types.find(type => type.startsWith('image/'));
                if (imageType) {
                    e.preventDefault();
                    
                    const blob = await item.getType(imageType);

                    if (imageType === 'image/svg+xml') {
                        const file = new File([blob], `pasted-svg-${Date.now()}.svg`, { type: imageType });

                        const { zoom, pan } = state.editor;
                        const rect = this.container.getBoundingClientRect();
                        const centerX = (rect.width / 2 - pan.x) / zoom;
                        const centerY = (rect.height / 2 - pan.y) / zoom;

                        try {
                            const svgMarkup = await blob.text();
                            if (await this.tryCreateEditableShapesFromSvgMarkup(svgMarkup, centerX, centerY)) {
                                return;
                            }
                        } catch {
                            // ignore and fall through
                        }

                        await this.createSvgElement(file, centerX, centerY);
                        return;
                    }

                    const file = new File([blob], `pasted-image-${Date.now()}.png`, { type: imageType });
                    
                    // Check if we should apply as fill to selected shape
                    const selectedIds = state.editor.selectedElementIds || [];
                    const container = this.getActiveContainer(state);
                    
                    if (selectedIds.length === 1 && container) {
                        const targetElement = container.elements[selectedIds[0]];
                        if (targetElement && targetElement.type === 'shape') {
                            await this.applyMediaFillToElement(file, selectedIds[0], false);
                            return;
                        }
                    }
                    
                    // Otherwise create a new image element at center of viewport
                    const { zoom, pan } = state.editor;
                    const rect = this.container.getBoundingClientRect();
                    const centerX = (rect.width / 2 - pan.x) / zoom;
                    const centerY = (rect.height / 2 - pan.y) / zoom;
                    
                    this.createImageElement(file, centerX, centerY);
                    return;
                }
            }

            // Fallback: if clipboard contains SVG markup as text (common from editors)
            if (typeof navigator.clipboard.readText === 'function') {
                const text = await navigator.clipboard.readText();
                if (typeof text === 'string' && /<svg\b[^>]*>/i.test(text)) {
                    e.preventDefault();
                    const blob = new Blob([text], { type: 'image/svg+xml' });
                    const file = new File([blob], `pasted-svg-${Date.now()}.svg`, { type: 'image/svg+xml' });

                    const { zoom, pan } = state.editor;
                    const rect = this.container.getBoundingClientRect();
                    const centerX = (rect.width / 2 - pan.x) / zoom;
                    const centerY = (rect.height / 2 - pan.y) / zoom;

                    if (await this.tryCreateEditableShapesFromSvgMarkup(text, centerX, centerY)) {
                        return;
                    }

                    await this.createSvgElement(file, centerX, centerY);
                    return;
                }
            }
        } catch (error) {
            // Clipboard API not supported or permission denied - fall through to normal paste
            console.debug('Clipboard read not available:', error.message);

            // Best-effort fallback for environments where read() fails but readText() works.
            try {
                if (typeof navigator.clipboard.readText === 'function') {
                    const text = await navigator.clipboard.readText();
                    if (typeof text === 'string' && /<svg\b[^>]*>/i.test(text)) {
                        e.preventDefault();
                        const blob = new Blob([text], { type: 'image/svg+xml' });
                        const file = new File([blob], `pasted-svg-${Date.now()}.svg`, { type: 'image/svg+xml' });

                        const { zoom, pan } = state.editor;
                        const rect = this.container.getBoundingClientRect();
                        const centerX = (rect.width / 2 - pan.x) / zoom;
                        const centerY = (rect.height / 2 - pan.y) / zoom;

                        if (await this.tryCreateEditableShapesFromSvgMarkup(text, centerX, centerY)) {
                            return;
                        }

                        await this.createSvgElement(file, centerX, centerY);
                    }
                }
            } catch {
                // ignore
            }
        }
    }

    handleKeyDown(e) {
        const state = store.getState();
        if (state.editor.mode === 'presentation') return;

        if (e.key === 'Escape') {
            if (state.editor.deepEdit) {
                store.dispatch('SET_DEEP_EDIT', null);
                e.preventDefault();
                return;
            }
        }

        if (e.key === 'Shift') {
            this.isShiftPressed = true;
        }

        if (InputManager.shouldBlockShortcut(e)) return;

        // Alt key for measurements
        if (e.key === 'Alt') {
            if (this.interactionState === 'IDLE' && this.lastMouseX) {
                this.updateMeasurementGuides(this.lastMouseX, this.lastMouseY);
            }
        }

        // Space for Panning
        if (e.code === 'Space' && !this.isSpacePressed) {
            if (e.target === document.body) e.preventDefault();
            this.isSpacePressed = true;
            this.container.style.cursor = 'grab';
        }

        // Enter to edit text
        if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
            if (!state.editor.editingElementId && state.editor.selectedElementIds.length === 1) {
                const elementId = state.editor.selectedElementIds[0];
                const container = this.getActiveContainer(state);
                let el = container?.elements?.[elementId];
                
                // If not in container, check effective elements (for placeholders from layout)
                if (!el) {
                    const effectiveSlide = store.getEffectiveSlide(container?.id);
                    el = effectiveSlide?.effectiveElements?.[elementId];
                }
                
                if (el && el.type === 'text') {
                    e.preventDefault();
                    // Instantiate placeholder if needed
                    if (el.isPlaceholder && !container?.elements?.[elementId]) {
                        store.dispatch('INSTANTIATE_PLACEHOLDER', { 
                            placeholderId: elementId,
                            element: el
                        });
                    }
                    store.dispatch('SET_EDITING_ELEMENT', { id: elementId, selectionType: 'all' });
                }
            }
        }

        // Type-to-Edit
        if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1) {
            if (!state.editor.editingElementId && state.editor.selectedElementIds.length === 1) {
                const elementId = state.editor.selectedElementIds[0];
                const container = this.getActiveContainer(state);
                let el = container?.elements?.[elementId];
                
                // If not in container, check effective elements (for placeholders from layout)
                if (!el) {
                    const effectiveSlide = store.getEffectiveSlide(container?.id);
                    el = effectiveSlide?.effectiveElements?.[elementId];
                }
                
                if (el && (el.type === 'text' || (el.isPlaceholder && el.type === 'text'))) {
                    e.preventDefault();
                    // Instantiate placeholder if needed
                    if (el.isPlaceholder && !container?.elements?.[elementId]) {
                        store.dispatch('INSTANTIATE_PLACEHOLDER', { 
                            placeholderId: elementId,
                            element: el
                        });
                    }
                    store.dispatch('SET_EDITING_ELEMENT', { 
                        id: elementId, 
                        selectionType: 'all',
                        initialChar: e.key 
                    });
                    return;
                }
            }
        }

        // Duplicate (Ctrl+D)
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
            e.preventDefault();
            if (state.editor.selectedSlideIds && state.editor.selectedSlideIds.length > 0) {
                state.editor.selectedSlideIds.forEach(id => store.dispatch('DUPLICATE_SLIDE', id));
            } else {
                store.dispatch('DUPLICATE_ELEMENTS', { ids: null, offset: true });
            }
        }

        // Copy (Ctrl+C)
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
            if (state.editor.selectedElementIds && state.editor.selectedElementIds.length > 0) {
                e.preventDefault();
                const container = this.getActiveContainer(state);
                if (container) {
                    const elementsToCopy = state.editor.selectedElementIds.map(id => container.elements[id]).filter(e => e);
                    if (elementsToCopy.length > 0) {
                        window.elementClipboard = JSON.stringify(elementsToCopy);
                        window.slideClipboard = null;
                    }
                }
            } else if (state.editor.selectedSlideIds && state.editor.selectedSlideIds.length > 0) {
                e.preventDefault();
                window.slideClipboard = state.editor.selectedSlideIds[0];
                window.elementClipboard = null;
            }
        }

        // Paste (Ctrl+V)
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
            if (!state.editor.editingElementId) {
                // Handle clipboard paste for images/SVG from system clipboard.
                // Skip when using internal app clipboard to avoid double-paste surprises.
                if (!window.elementClipboard && !window.slideClipboard) {
                    this.handleClipboardPaste(e, state);
                }
                
                if (window.elementClipboard) {
                    e.preventDefault();
                    try {
                        const elements = JSON.parse(window.elementClipboard);
                        store.dispatch('PASTE_ELEMENTS', { elements });
                    } catch (err) {
                        console.error('Failed to paste elements', err);
                    }
                } else if (window.slideClipboard) {
                    e.preventDefault();
                    store.dispatch('PASTE_SLIDE', { 
                        sourceId: window.slideClipboard, 
                        targetId: state.editor.activeSlideId 
                    });
                }
            }
        }

        // Select All (Ctrl+A)
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            e.preventDefault();
            const slide = this.getActiveContainer(state);
            if (slide && slide.elements) {
                const allIds = Object.keys(slide.elements);
                store.dispatch('UPDATE_SELECTION', allIds);
            }
        }

        // Delete
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (state.editor.editingElementId) return;

            // Vector deep edit delete: delete selected nodes (not the whole element).
            if (state.editor.deepEdit && state.editor.deepEdit.kind === 'vector') {
                const nodes = state.editor.deepEdit.selection?.nodes;
                if (Array.isArray(nodes) && nodes.length > 0) {
                    e.preventDefault();
                    this._deleteSelectedVectorNodes();
                    return;
                }

                const edges = state.editor.deepEdit.selection?.edges;
                if (Array.isArray(edges) && edges.length > 0) {
                    e.preventDefault();
                    this._deleteSelectedVectorEdges();
                    return;
                }
            }

            if (state.editor.selectedSlideIds && state.editor.selectedSlideIds.length > 0) {
                if (confirm('Delete selected slide(s)?')) {
                    state.editor.selectedSlideIds.forEach(id => store.dispatch('DELETE_SLIDE', id));
                }
                return;
            }

            const selectedIds = state.editor.selectedElementIds;
            if (selectedIds.length > 0) {
                selectedIds.forEach(id => {
                    store.dispatch('REMOVE_ELEMENT', id);
                });
            }
        }

        // Nudge (Arrow Keys)
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            if (state.editor.editingElementId) return;

            // Vector deep edit nudge: move selected nodes in element-local space.
            if (state.editor.deepEdit && state.editor.deepEdit.kind === 'vector') {
                const nodes = state.editor.deepEdit.selection?.nodes;
                if (Array.isArray(nodes) && nodes.length > 0) {
                    e.preventDefault();
                    const step = e.shiftKey ? 10 : 1;
                    let dx = 0;
                    let dy = 0;
                    switch (e.key) {
                        case 'ArrowUp': dy = -step; break;
                        case 'ArrowDown': dy = step; break;
                        case 'ArrowLeft': dx = -step; break;
                        case 'ArrowRight': dx = step; break;
                    }
                    this._applyVectorNodeNudge(dx, dy);
                    return;
                }
            }

            const selectedIds = state.editor.selectedElementIds;
            if (selectedIds.length > 0) {
                e.preventDefault();
                const shift = e.shiftKey ? 10 : 1;
                let dx = 0;
                let dy = 0;

                switch (e.key) {
                    case 'ArrowUp': dy = -shift; break;
                    case 'ArrowDown': dy = shift; break;
                    case 'ArrowLeft': dx = -shift; break;
                    case 'ArrowRight': dx = shift; break;
                }

                selectedIds.forEach(id => {
                    const container = this.getActiveContainer(state);
                    const el = container ? container.elements[id] : null;
                    if (el) {
                        store.dispatch('UPDATE_ELEMENT', {
                            id,
                            x: el.x + dx,
                            y: el.y + dy
                        });
                    }
                });
            }
        }

        // Layer Ordering ([ and ])
        if (e.key === '[' || e.key === ']') {
            if (state.editor.editingElementId) return;
            
            const selectedIds = state.editor.selectedElementIds;
            if (selectedIds.length === 0) return;

            const container = this.getActiveContainer(state);
            if (!container) return;
            
            selectedIds.forEach(id => {
                const el = container.elements[id];
                if (!el) return;

                let list = container.elementOrder;
                let parentId = null;

                if (el.parentId) {
                    const parent = container.elements[el.parentId];
                    if (parent && parent.children) {
                        list = parent.children;
                        parentId = el.parentId;
                    } else {
                        return;
                    }
                }

                const currentIndex = list.indexOf(id);
                if (currentIndex === -1) return;

                let newIndex = currentIndex;
                
                if (e.ctrlKey || e.metaKey) {
                    if (e.key === '[') newIndex = 0;
                    else newIndex = list.length - 1;
                } else {
                    if (e.key === '[') newIndex = Math.max(0, currentIndex - 1);
                    else newIndex = Math.min(list.length - 1, currentIndex + 1);
                }

                if (newIndex !== currentIndex) {
                    store.dispatch('REORDER_ELEMENTS', {
                        slideId: container.id,
                        elementId: id,
                        targetParentId: parentId,
                        targetIndex: newIndex
                    });
                }
            });
        }

        // Opacity (0-9)
        if (/^[0-9]$/.test(e.key)) {
            if (!state.editor.editingElementId) {
                const selectedIds = state.editor.selectedElementIds;
                if (selectedIds.length > 0) {
                    const val = parseInt(e.key);
                    const opacity = val === 0 ? 1 : val / 10;
                    
                    selectedIds.forEach(id => {
                        store.dispatch('UPDATE_ELEMENT', {
                            id,
                            opacity: opacity
                        });
                    });
                }
            }
        }

        // Grouping (Ctrl+G)
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
            e.preventDefault();
            if (e.shiftKey) {
                store.dispatch('UNGROUP_ELEMENTS');
            } else {
                store.dispatch('GROUP_ELEMENTS');
            }
        }
    }

    handleKeyUp(e) {
        const state = store.getState();
        if (state.editor.mode === 'presentation') return;

        if (e.key === 'Shift') {
            this.isShiftPressed = false;
        }

        if (e.key === 'Alt') {
            this.measurementGuides = null;
        }

        if (e.code === 'Space') {
            this.isSpacePressed = false;
            if (this.interactionState !== 'PANNING') {
                this.container.style.cursor = state.editor.activeTool === 'hand' ? 'grab' : 'default';
            }
        }
    }
}
