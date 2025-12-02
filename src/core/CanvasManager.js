import { store } from './Store.js';
import { InputManager } from './InputManager.js';
import { ViewportController } from './canvas/ViewportController.js';
import { GeometryUtils } from './canvas/GeometryUtils.js';
import { HitTesting } from './canvas/HitTesting.js';
import { SnappingSystem } from './canvas/SnappingSystem.js';
import { GizmoRenderer } from './canvas/GizmoRenderer.js';
import { mouseStateManager } from './MouseStateManager.js';
import { cursorManager } from './CursorManager.js';
import { mediaAssetManager } from './media/MediaAssetManager.js';
import { SUPPORTED_IMAGE_FORMATS, SUPPORTED_VIDEO_FORMATS } from './constants/MediaDefaults.js';
import { contextMenuManager } from '../ui/components/ContextMenu/index.js';
import { canvasMenuConfigs } from '../ui/components/ContextMenu/canvasMenuConfig.js';

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
            const masters = state.masters;
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

            const hit = this.hitTest(mouseX, mouseY);

            if (hit) {
                if (hit.type === 'handle') {
                    this._handleHandleClick(hit, mouseX, mouseY, e);
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
            case 'PANNING':
                this._handlePanning(mouseX, mouseY, e);
                break;
            case 'DRAGGING':
                this._handleDragging(mouseX, mouseY, e);
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

    _handlePanning(mouseX, mouseY, e) {
        e.preventDefault();
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

        if (this.interactionState === 'RESIZING' || this.interactionState === 'DRAGGING') {
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
        const { zoom, pan } = state.editor;
        const activeTool = state.editor.activeTool;

        const startX = (this.dragStart.x - pan.x) / zoom;
        const startY = (this.dragStart.y - pan.y) / zoom;
        const currentX = (this.dragCurrent.x - pan.x) / zoom;
        const currentY = (this.dragCurrent.y - pan.y) / zoom;

        let x = Math.min(startX, currentX);
        let y = Math.min(startY, currentY);
        let width = Math.abs(currentX - startX);
        let height = Math.abs(currentY - startY);

        // Check if this is a drag (box drawn) vs click (no box)
        const isDrag = width > 5 || height > 5;

        if (e.shiftKey && isDrag) {
            const size = Math.max(width, height);
            width = size;
            height = size;
            if (currentX < startX) x = startX - size;
            if (currentY < startY) y = startY - size;
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
                    content: '<p>Text</p>',
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

        // For non-text tools, require a minimum drag size
        if (width > 5 && height > 5) {
            const id = `${activeTool}-${Date.now()}`;
            let element = {
                id,
                type: activeTool === 'shape' ? 'rect' : activeTool,
                x,
                y,
                width,
                height,
                rotation: 0
            };

            if (activeTool === 'shape') {
                element.type = 'rect';
                element.style = {
                    backgroundColor: '#D9D9D9',
                    borderWidth: 0
                };
            } else if (activeTool === 'image') {
                element.src = 'https://placehold.co/600x400';
                element.style = {};
            }

            store.dispatch('ADD_ELEMENT', element);
            store.dispatch('UPDATE_SELECTION', [id]);
            store.dispatch('SET_ACTIVE_TOOL', 'select');
            store.dispatch('TOGGLE_CONSTRAIN_PROPORTIONS', e.shiftKey);
        }
    }

    handleDoubleClick(e) {
        if (this._lastDblClickTime && Date.now() - this._lastDblClickTime < 100) {
            return;
        }
        this._lastDblClickTime = Date.now();
        
        const state = store.getState();
        if (state.editor.mode === 'presentation') return;
        if (state.editor.editingElementId) return;

        const rect = this.container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const hit = this.hitTest(mouseX, mouseY);

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
                } else {
                    store.dispatch('UPDATE_SELECTION', [hit.id]);
                }
            }
        }
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
            const isImage = SUPPORTED_IMAGE_FORMATS.some(fmt => file.type === fmt || file.name.toLowerCase().endsWith(fmt.split('/')[1]));
            const isVideo = SUPPORTED_VIDEO_FORMATS.some(fmt => file.type === fmt || file.name.toLowerCase().endsWith(fmt.split('/')[1]));
            
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
     * Handle clipboard paste for images (screenshots, copied images)
     */
    async handleClipboardPaste(e, state) {
        try {
            const clipboardItems = await navigator.clipboard.read();
            
            for (const item of clipboardItems) {
                // Check for image types
                const imageType = item.types.find(type => type.startsWith('image/'));
                if (imageType) {
                    e.preventDefault();
                    
                    const blob = await item.getType(imageType);
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
        } catch (error) {
            // Clipboard API not supported or permission denied - fall through to normal paste
            console.debug('Clipboard read not available:', error.message);
        }
    }

    handleKeyDown(e) {
        const state = store.getState();
        if (state.editor.mode === 'presentation') return;

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
                // Handle clipboard paste for images (screenshots, copied images)
                this.handleClipboardPaste(e, state);
                
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
