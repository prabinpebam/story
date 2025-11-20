import { store } from './Store.js';

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
        this.interactionState = 'IDLE'; // IDLE, PANNING, DRAGGING, RESIZING
        this.isSpacePressed = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.dragStart = { x: 0, y: 0 };
        this.initialElementState = {}; // Store initial state for undo/redo or delta calc
        this.activeHandle = null;
        this.hoveredElementId = null;

        this.init();
    }

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
        this.canvas.style.zIndex = '100';
        this.canvas.style.pointerEvents = 'auto'; // Enable interaction

        // Resize canvas to match window/container
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Subscribe to store changes
        store.on('viewport-changed', (viewport) => {
            this.updateViewportTransform(viewport);
        });

        store.on('mode-changed', (mode) => {
            if (mode === 'presentation') {
                // Force fit to view after a short delay to allow layout to settle
                setTimeout(() => this.fitToView(), 100);
            } else {
                // Reset or fit to view again
                setTimeout(() => this.fitToView(), 100);
            }
        });

        this.bindEvents();

        // Initial Fit to View
        // Small timeout to ensure layout is settled
        setTimeout(() => this.fitToView(), 0);

        // Start Render Loop
        this.render();
    }

    bindEvents() {
        // Wheel Zoom
        this.container.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });

        // Panning (MouseDown)
        this.container.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        
        // Double Click (Edit Text)
        this.container.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
        
        // Drag and Drop (Images)
        this.container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });

        this.container.addEventListener('drop', (e) => this.handleDrop(e));

        // Global Mouse Events (for dragging outside container)
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.addEventListener('mouseup', (e) => this.handleMouseUp(e));

        // Keyboard (Spacebar)
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

    fitToView() {
        const state = store.getState();
        const activeSlideId = state.editor.activeSlideId;
        const slide = state.slides[activeSlideId];
        
        if (!slide) return;

        const containerRect = this.container.getBoundingClientRect();
        const slideWidth = slide.width || 1920;
        const slideHeight = slide.height || 1080;
        const padding = 60;

        const availableWidth = containerRect.width - padding * 2;
        const availableHeight = containerRect.height - padding * 2;

        const scaleX = availableWidth / slideWidth;
        const scaleY = availableHeight / slideHeight;
        const newZoom = Math.min(scaleX, scaleY);

        const newPanX = (containerRect.width - slideWidth * newZoom) / 2;
        const newPanY = (containerRect.height - slideHeight * newZoom) / 2;

        store.dispatch('UPDATE_VIEWPORT', {
            zoom: newZoom,
            pan: { x: newPanX, y: newPanY }
        });
    }

    zoomIn() {
        const state = store.getState();
        const { zoom, pan } = state.editor;
        const newZoom = Math.min(zoom * 1.2, 5.0);
        
        // Zoom towards center of viewport
        const rect = this.container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const worldX = (centerX - pan.x) / zoom;
        const worldY = (centerY - pan.y) / zoom;

        const newPanX = centerX - (worldX * newZoom);
        const newPanY = centerY - (worldY * newZoom);

        store.dispatch('UPDATE_VIEWPORT', {
            zoom: newZoom,
            pan: { x: newPanX, y: newPanY }
        });
    }

    zoomOut() {
        const state = store.getState();
        const { zoom, pan } = state.editor;
        const newZoom = Math.max(zoom / 1.2, 0.1);

        // Zoom towards center of viewport
        const rect = this.container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const worldX = (centerX - pan.x) / zoom;
        const worldY = (centerY - pan.y) / zoom;

        const newPanX = centerX - (worldX * newZoom);
        const newPanY = centerY - (worldY * newZoom);

        store.dispatch('UPDATE_VIEWPORT', {
            zoom: newZoom,
            pan: { x: newPanX, y: newPanY }
        });
    }

    handleWheel(e) {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            
            const state = store.getState();
            const { zoom, pan } = state.editor;
            
            // Zoom Factor
            const ZOOM_SENSITIVITY = 0.001;
            const delta = -e.deltaY * ZOOM_SENSITIVITY;
            const newZoom = Math.min(Math.max(0.1, zoom + delta), 5.0); // Clamp 10% to 500%

            // Calculate Mouse Position relative to Container
            const rect = this.container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Zoom towards mouse logic
            // World position before zoom
            const worldX = (mouseX - pan.x) / zoom;
            const worldY = (mouseY - pan.y) / zoom;

            // New Pan to keep world position stationary
            const newPanX = mouseX - (worldX * newZoom);
            const newPanY = mouseY - (worldY * newZoom);

            store.dispatch('UPDATE_VIEWPORT', {
                zoom: newZoom,
                pan: { x: newPanX, y: newPanY }
            });
        } else {
            // Regular scroll (Pan)
            // Optional: Map scroll to pan if desired, but usually trackpad does this natively via wheel events
            // For now, let's allow native trackpad panning if it sends wheel events with ctrl=false
            // But we need to map deltaX/Y to pan
            e.preventDefault();
            const state = store.getState();
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
        // Middle Mouse or Space+Left Click -> Pan
        if (e.button === 1 || (e.button === 0 && this.isSpacePressed)) {
            e.preventDefault();
            this.interactionState = 'PANNING';
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            this.container.style.cursor = 'grabbing';
            return;
        }

        if (e.button === 0) { // Left Click
            const rect = this.container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const state = store.getState();
            const activeTool = state.editor.activeTool;

            // Handle Creation Tools
            if (activeTool !== 'select' && activeTool !== 'hand') {
                this.interactionState = 'CREATING';
                this.dragStart = { x: mouseX, y: mouseY };
                this.dragCurrent = { x: mouseX, y: mouseY }; // Track current pos for ghost
                return;
            }

            const hit = this.hitTest(mouseX, mouseY);

            if (hit) {
                if (hit.type === 'handle') {
                    this.interactionState = 'RESIZING';
                    this.activeHandle = hit.handle;
                    this.dragStart = { x: mouseX, y: mouseY };
                    
                    const state = store.getState();
                    const el = state.slides[state.editor.activeSlideId].elements[hit.id];
                    this.initialElementState = { ...el };
                    e.stopPropagation();
                } else if (hit.type === 'element') {
                    this.interactionState = 'DRAGGING';
                    this.dragStart = { x: mouseX, y: mouseY };
                    
                    const state = store.getState();
                    const slide = state.slides[state.editor.activeSlideId];
                    let targetId = hit.id;

                    // Deep Select Logic (Ctrl/Cmd + Click)
                    if (!e.ctrlKey && !e.metaKey) {
                        // If the hit element is already selected, keep it (allows dragging deep selected items)
                        if (state.editor.selectedElementIds.includes(hit.id)) {
                            targetId = hit.id;
                        } else {
                            // Walk up to find top-level parent
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
                    // We need to fetch fresh state after potential selection update
                    // Since dispatch is sync, we can just get state again
                    const newState = store.getState();
                    this.initialElementState = {};
                    newState.editor.selectedElementIds.forEach(id => {
                        const el = newState.slides[newState.editor.activeSlideId].elements[id];
                        if (el) this.initialElementState[id] = { ...el };
                    });
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

    handleMouseMove(e) {
        const rect = this.container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        this.lastMouseX = mouseX;
        this.lastMouseY = mouseY;

        if (this.interactionState === 'CREATING') {
            this.dragCurrent = { x: mouseX, y: mouseY };
            // Render loop will pick this up to draw ghost
        } else if (this.interactionState === 'SELECTING') {
            this.dragCurrent = { x: mouseX, y: mouseY };
            
            // Calculate Marquee Box in World Space
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

            // Find intersecting elements
            const slide = state.slides[state.editor.activeSlideId];
            const newSelection = [];
            
            if (slide && slide.elements) {
                Object.values(slide.elements).forEach(el => {
                    // Simple AABB intersection
                    // Note: Does not account for rotation yet for simplicity, 
                    // but Figma usually selects if bounding box intersects.
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
            
            // Update Selection (Debounce if needed, but for now direct dispatch)
            // Check if selection actually changed to avoid spamming
            const currentSelection = state.editor.selectedElementIds;
            const isSame = newSelection.length === currentSelection.length && 
                           newSelection.every(id => currentSelection.includes(id));
            
            if (!isSame) {
                store.dispatch('UPDATE_SELECTION', newSelection);
            }

        } else if (this.interactionState === 'PANNING') {
            e.preventDefault();
            const deltaX = e.clientX - this.lastMouseX;
            const deltaY = e.clientY - this.lastMouseY;
            
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;

            const state = store.getState();
            const { pan } = state.editor;

            store.dispatch('UPDATE_VIEWPORT', {
                pan: {
                    x: pan.x + deltaX,
                    y: pan.y + deltaY
                }
            });
        } else if (this.interactionState === 'DRAGGING') {
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
                    constrainedY = true; // Moving Horizontally, Y is fixed
                } else {
                    dx = 0;
                    constrainedX = true; // Moving Vertically, X is fixed
                }
            }

            // Single element snapping
            if (state.editor.selectedElementIds.length === 1) {
                const id = state.editor.selectedElementIds[0];
                const initial = this.initialElementState[id];
                
                if (initial) {
                    let newX = initial.x + dx;
                    let newY = initial.y + dy;
                    
                    // Snap Logic
                    const snapResult = this.snapToGuides(id, newX, newY, initial.width, initial.height, zoom);
                    
                    if (!constrainedX) newX = snapResult.x;
                    if (!constrainedY) newY = snapResult.y;
                    
                    this.activeGuides = snapResult.guides.filter(g => {
                        if (constrainedX && g.type === 'v') return false;
                        if (constrainedY && g.type === 'h') return false;
                        return true;
                    });
                    
                    store.dispatch('UPDATE_ELEMENT', {
                        id,
                        x: newX,
                        y: newY
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
        } else if (this.interactionState === 'RESIZING') {
            const state = store.getState();
            const { zoom, pan } = state.editor;
            const id = state.editor.selectedElementIds[0];
            const initial = this.initialElementState;
            
            if (!initial || !id) return;

            // Handle Rotation
            if (this.activeHandle === 'rot') {
                const cx = initial.x + initial.width / 2;
                const cy = initial.y + initial.height / 2;
                
                const worldMouseX = (mouseX - pan.x) / zoom;
                const worldMouseY = (mouseY - pan.y) / zoom;
                
                let angle = Math.atan2(worldMouseY - cy, worldMouseX - cx) * 180 / Math.PI;
                angle += 90;
                
                if (e.shiftKey) {
                    const snap = 15;
                    angle = Math.round(angle / snap) * snap;
                }
                
                store.dispatch('UPDATE_ELEMENT', {
                    id,
                    rotation: angle
                });
                return;
            }

            const dx = (mouseX - this.dragStart.x) / zoom;
            const dy = (mouseY - this.dragStart.y) / zoom;

            // Rotate delta to local space
            const rad = -(initial.rotation || 0) * Math.PI / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            let localDx = dx * cos - dy * sin;
            let localDy = dx * sin + dy * cos;

            // Center Resize (Alt Key)
            const isCenterResize = e.altKey;
            if (isCenterResize) {
                localDx *= 2;
                localDy *= 2;
            }

            // Aspect Ratio Lock (Shift Key)
            if (e.shiftKey && ['nw', 'ne', 'sw', 'se'].includes(this.activeHandle)) {
                const ratio = initial.width / initial.height;
                
                if (['nw', 'se'].includes(this.activeHandle)) {
                    // Signs should be same (both grow or shrink)
                    const avg = (localDx + localDy * ratio) / 2;
                    localDx = avg;
                    localDy = avg / ratio;
                } else {
                    // Signs opposite (ne, sw)
                    const avg = (localDx - localDy * ratio) / 2;
                    localDx = avg;
                    localDy = -avg / ratio;
                }
            }

            let newX = initial.x;
            let newY = initial.y;
            let newWidth = initial.width;
            let newHeight = initial.height;

            // Helper to rotate vector back to world space
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

            // Minimum size constraint
            if (newWidth < 10) newWidth = 10;
            if (newHeight < 10) newHeight = 10;

            // Correct for Center Resize
            if (isCenterResize) {
                const oldCenterX = initial.x + initial.width / 2;
                const oldCenterY = initial.y + initial.height / 2;
                const newCenterX = newX + newWidth / 2;
                const newCenterY = newY + newHeight / 2;
                
                newX -= (newCenterX - oldCenterX);
                newY -= (newCenterY - oldCenterY);
            }

            store.dispatch('UPDATE_ELEMENT', {
                id,
                x: newX,
                y: newY,
                width: newWidth,
                height: newHeight
            });
        }
        
        if (this.interactionState === 'IDLE') {
             const hit = this.hitTest(mouseX, mouseY);
             if (hit) {
                 this.container.style.cursor = hit.type === 'handle' ? 'crosshair' : 'move';
                 if (hit.type === 'element') {
                     let targetId = hit.id;
                     
                     // Deep Hover Logic (Ctrl/Cmd + Hover)
                     // If Ctrl is NOT pressed, we should hover the top-level group
                     if (!e.ctrlKey && !e.metaKey) {
                         const state = store.getState();
                         const slide = state.slides[state.editor.activeSlideId];
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
    }

    handleMouseUp(e) {
        this.activeGuides = [];
        if (this.interactionState === 'CREATING') {
            const state = store.getState();
            const { zoom, pan } = state.editor;
            const activeTool = state.editor.activeTool;

            // Calculate world coordinates
            const startX = (this.dragStart.x - pan.x) / zoom;
            const startY = (this.dragStart.y - pan.y) / zoom;
            const currentX = (this.dragCurrent.x - pan.x) / zoom;
            const currentY = (this.dragCurrent.y - pan.y) / zoom;

            const x = Math.min(startX, currentX);
            const y = Math.min(startY, currentY);
            const width = Math.abs(currentX - startX);
            const height = Math.abs(currentY - startY);

            // Minimum size check (prevent accidental clicks creating tiny elements)
            if (width > 5 && height > 5) {
                const id = `${activeTool}-${Date.now()}`;
                let element = {
                    id,
                    type: activeTool === 'shape' ? 'rect' : activeTool, // Map 'shape' to 'rect' for now
                    x,
                    y,
                    width,
                    height,
                    rotation: 0
                };

                // Default properties based on type
                if (activeTool === 'text') {
                    element.content = '<h2>Text</h2>';
                    element.style = {
                        fontSize: 32,
                        fontFamily: 'Inter',
                        color: '#000000'
                    };
                    // Auto-height for text usually, but let's respect drag for now or set min
                    element.height = Math.max(height, 50); 
                } else if (activeTool === 'shape') {
                    element.type = 'rect';
                    element.style = {
                        backgroundColor: '#D9D9D9',
                        borderWidth: 0,
                        borderColor: '#000000'
                    };
                } else if (activeTool === 'image') {
                    element.src = 'https://placehold.co/600x400'; // Placeholder
                    element.style = {};
                }

                store.dispatch('ADD_ELEMENT', element);
                
                // Select the new element
                store.dispatch('UPDATE_SELECTION', [id]);
                
                // Reset tool to select
                store.dispatch('SET_ACTIVE_TOOL', 'select');
            }
        }

        this.interactionState = 'IDLE';
        this.container.style.cursor = 'default';
        this.activeHandle = null;
        this.initialElementState = {};
    }

    handleDoubleClick(e) {
        const rect = this.container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const hit = this.hitTest(mouseX, mouseY);

        if (hit && hit.type === 'element') {
            const state = store.getState();
            const activeSlideId = state.editor.activeSlideId;
            const element = state.slides[activeSlideId].elements[hit.id];

            if (element && element.type === 'text') {
                store.dispatch('SET_EDITING_ELEMENT', hit.id);
            }
        }
    }

    handleDrop(e) {
        e.preventDefault();
        const rect = this.container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const state = store.getState();
        const { zoom, pan } = state.editor;

        // Convert to world coordinates
        const worldX = (mouseX - pan.x) / zoom;
        const worldY = (mouseY - pan.y) / zoom;

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        // Scale down if too big
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
        }
    }

    handleKeyDown(e) {
        // Check for Alt key for measurements
        if (e.key === 'Alt') {
            if (this.interactionState === 'IDLE' && this.lastMouseX) {
                const rect = this.container.getBoundingClientRect();
                const mouseX = this.lastMouseX; // Already relative to container? No, lastMouseX was set from e.clientX - rect.left
                const mouseY = this.lastMouseY;
                this.updateMeasurementGuides(mouseX, mouseY);
            }
        }

        // Space for Panning
        if (e.code === 'Space' && !this.isSpacePressed) {
            // Prevent scrolling page if focus is on body
            if (e.target === document.body) e.preventDefault();
            
            this.isSpacePressed = true;
            this.container.style.cursor = 'grab';
        }

        // Duplicate (Ctrl+D or Cmd+D)
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
            e.preventDefault();
            store.dispatch('DUPLICATE_ELEMENTS', { ids: null, offset: true });
        }

        // Select All (Ctrl+A or Cmd+A)
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            e.preventDefault();
            const state = store.getState();
            const slide = state.slides[state.editor.activeSlideId];
            if (slide && slide.elements) {
                const allIds = Object.keys(slide.elements);
                store.dispatch('UPDATE_SELECTION', allIds);
            }
        }

        // Delete (Delete or Backspace)
        if (e.key === 'Delete' || e.key === 'Backspace') {
            // If editing text, don't delete element
            const state = store.getState();
            if (state.editor.editingElementId) return;

            const selectedIds = state.editor.selectedElementIds;
            if (selectedIds.length > 0) {
                selectedIds.forEach(id => {
                    store.dispatch('REMOVE_ELEMENT', id);
                });
            }
        }

        // Nudge (Arrow Keys)
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            const state = store.getState();
            if (state.editor.editingElementId) return; // Don't nudge if editing text

            const selectedIds = state.editor.selectedElementIds;
            if (selectedIds.length > 0) {
                e.preventDefault();
                const shift = e.shiftKey ? 10 : 1; // Shift for big nudge
                let dx = 0;
                let dy = 0;

                switch (e.key) {
                    case 'ArrowUp': dy = -shift; break;
                    case 'ArrowDown': dy = shift; break;
                    case 'ArrowLeft': dx = -shift; break;
                    case 'ArrowRight': dx = shift; break;
                }

                selectedIds.forEach(id => {
                    const el = state.slides[state.editor.activeSlideId].elements[id];
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

        // Layer Ordering
        if (e.key === '[' || e.key === ']') {
            const state = store.getState();
            if (state.editor.editingElementId) return;
            
            const selectedIds = state.editor.selectedElementIds;
            if (selectedIds.length === 0) return;

            const slideId = state.editor.activeSlideId;
            const slide = state.slides[slideId];
            
            // Only handle single selection for now for simplicity, or iterate
            // Figma handles multiple by moving them all relative to their current pos
            
            selectedIds.forEach(id => {
                const currentIndex = slide.elementOrder.indexOf(id);
                if (currentIndex === -1) return;

                let newIndex = currentIndex;
                
                if (e.ctrlKey || e.metaKey) {
                    // Send to Back / Bring to Front
                    if (e.key === '[') newIndex = 0;
                    else newIndex = slide.elementOrder.length - 1;
                } else {
                    // Send Backward / Bring Forward
                    if (e.key === '[') newIndex = Math.max(0, currentIndex - 1);
                    else newIndex = Math.min(slide.elementOrder.length - 1, currentIndex + 1);
                }

                if (newIndex !== currentIndex) {
                    store.dispatch('REORDER_ELEMENTS', {
                        slideId,
                        fromIndex: currentIndex,
                        toIndex: newIndex
                    });
                }
            });
        }

        // Opacity (0-9)
        if (/^[0-9]$/.test(e.key)) {
            const state = store.getState();
            if (!state.editor.editingElementId) {
                const selectedIds = state.editor.selectedElementIds;
                if (selectedIds.length > 0) {
                    const val = parseInt(e.key);
                    const opacity = val === 0 ? 1 : val / 10;
                    
                    selectedIds.forEach(id => {
                        const el = state.slides[state.editor.activeSlideId].elements[id];
                        if (el) {
                            store.dispatch('UPDATE_ELEMENT', {
                                id,
                                opacity: opacity
                            });
                        }
                    });
                }
            }
        }

        // Grouping (Ctrl+G / Cmd+G)
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
        if (e.key === 'Alt') {
            this.measurementGuides = null;
        }

        if (e.code === 'Space') {
            this.isSpacePressed = false;
            if (!this.isPanning) {
                this.container.style.cursor = 'default';
            }
        }
    }

    resize() {
        const rect = this.container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        // Force a re-render or viewport update if needed
    }

    updateViewportTransform({ pan, zoom }) {
        if (this.viewport) {
            // Apply transform to the viewport container or content layer
            // Based on spec: #slide-content gets the transform
            this.contentLayer.style.transformOrigin = '0 0';
            this.contentLayer.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
            
            // Also update background if it needs to move (or keep it static depending on design)
            this.backgroundLayer.style.transformOrigin = '0 0';
            this.backgroundLayer.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;

            // Ensure dimensions are set
            const state = store.getState();
            const slide = state.slides[state.editor.activeSlideId];
            if (slide) {
                this.contentLayer.style.width = `${slide.width}px`;
                this.contentLayer.style.height = `${slide.height}px`;
                this.backgroundLayer.style.width = `${slide.width}px`;
                this.backgroundLayer.style.height = `${slide.height}px`;
            }

            // Update Zoom Display
            const zoomDisplay = document.getElementById('zoom-display');
            if (zoomDisplay) {
                zoomDisplay.textContent = `${Math.round(zoom * 100)}%`;
            }
        }
    }

    render() {
        // Clear interaction canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw Gizmos, Selection Box, Grid here
        this.renderGizmos();
        
        // Draw Hover Effect
        if (this.hoveredElementId && this.interactionState === 'IDLE') {
             const state = store.getState();
             const { zoom, pan } = state.editor;
             const slide = state.slides[state.editor.activeSlideId];
             // Don't draw hover if already selected
             if (slide && !state.editor.selectedElementIds.includes(this.hoveredElementId)) {
                 const el = slide.elements[this.hoveredElementId];
                 if (el) {
                     this.ctx.save();
                     this.ctx.translate(pan.x, pan.y);
                     this.ctx.scale(zoom, zoom);
                     const absEl = this.getAbsoluteElement(el, slide);
                     this.drawHoverOutline(absEl, zoom);
                     this.ctx.restore();
                 }
             }
        }

        // Draw Guides
        this.renderGuides();

        // Draw Measurement Guides
        this.renderMeasurementGuides();
        
        // Draw Creation Ghost
        if (this.interactionState === 'CREATING' && this.dragStart && this.dragCurrent) {
            this.renderCreationGhost();
        }

        // Draw Selection Marquee
        if (this.interactionState === 'SELECTING' && this.dragStart && this.dragCurrent) {
            this.renderSelectionMarquee();
        }

        // Draw Measurement Guides
        this.renderMeasurementGuides();

        requestAnimationFrame(() => this.render());
    }

    updateMeasurementGuides(mouseX, mouseY) {
        const state = store.getState();
        const { selectedElementIds, zoom, pan } = state.editor;
        
        // Only works if exactly one element is selected
        if (selectedElementIds.length !== 1) {
            this.measurementGuides = null;
            return;
        }

        const selectedId = selectedElementIds[0];
        const slide = state.slides[state.editor.activeSlideId];
        const selectedEl = slide.elements[selectedId];
        
        if (!selectedEl) return;

        // Check if hovering over another element
        const hit = this.hitTest(mouseX, mouseY);
        let targetEl = null;

        if (hit && hit.type === 'element' && hit.id !== selectedId) {
            targetEl = slide.elements[hit.id];
        }

        if (!targetEl) {
            this.measurementGuides = null;
            return;
        }

        // Calculate distances between selectedEl and targetEl
        // We use bounding boxes (ignoring rotation for simplicity for now, or using AABB)
        
        const r1 = {
            x: selectedEl.x,
            y: selectedEl.y,
            w: selectedEl.width,
            h: selectedEl.height,
            r: selectedEl.x + selectedEl.width,
            b: selectedEl.y + selectedEl.height
        };

        const r2 = {
            x: targetEl.x,
            y: targetEl.y,
            w: targetEl.width,
            h: targetEl.height,
            r: targetEl.x + targetEl.width,
            b: targetEl.y + targetEl.height
        };

        const guides = [];

        // Vertical Distance
        if (r1.b < r2.y) { // Selected is above Target
            const dist = Math.round(r2.y - r1.b);
            const x = r1.x + r1.w / 2;
            guides.push({
                type: 'line',
                x1: x, y1: r1.b,
                x2: x, y2: r2.y,
                label: `${dist}`,
                labelX: x + 5, labelY: r1.b + dist / 2
            });
        } else if (r1.y > r2.b) { // Selected is below Target
            const dist = Math.round(r1.y - r2.b);
            const x = r1.x + r1.w / 2;
            guides.push({
                type: 'line',
                x1: x, y1: r2.b,
                x2: x, y2: r1.y,
                label: `${dist}`,
                labelX: x + 5, labelY: r2.b + dist / 2
            });
        }

        // Horizontal Distance
        if (r1.r < r2.x) { // Selected is left of Target
            const dist = Math.round(r2.x - r1.r);
            const y = r1.y + r1.h / 2;
            guides.push({
                type: 'line',
                x1: r1.r, y1: y,
                x2: r2.x, y2: y,
                label: `${dist}`,
                labelX: r1.r + dist / 2, labelY: y - 5
            });
        } else if (r1.x > r2.r) { // Selected is right of Target
            const dist = Math.round(r1.x - r2.r);
            const y = r1.y + r1.h / 2;
            guides.push({
                type: 'line',
                x1: r2.r, y1: y,
                x2: r1.x, y2: y,
                label: `${dist}`,
                labelX: r2.r + dist / 2, labelY: y - 5
            });
        }
        
        // Overlap logic (if needed) - for now just gaps
        
        this.measurementGuides = guides;
    }

    renderMeasurementGuides() {
        if (!this.measurementGuides || this.measurementGuides.length === 0) return;

        const state = store.getState();
        const { zoom, pan } = state.editor;

        this.ctx.save();
        this.ctx.translate(pan.x, pan.y);
        this.ctx.scale(zoom, zoom);

        this.ctx.strokeStyle = '#FF0000';
        this.ctx.fillStyle = '#FF0000';
        this.ctx.lineWidth = 1 / zoom;
        this.ctx.font = `${12 / zoom}px Inter`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        this.measurementGuides.forEach(g => {
            // Draw Line
            this.ctx.beginPath();
            this.ctx.moveTo(g.x1, g.y1);
            this.ctx.lineTo(g.x2, g.y2);
            this.ctx.stroke();

            // Draw Ends
            const tickSize = 4 / zoom;
            if (g.x1 === g.x2) { // Vertical Line
                this.ctx.beginPath();
                this.ctx.moveTo(g.x1 - tickSize, g.y1);
                this.ctx.lineTo(g.x1 + tickSize, g.y1);
                this.ctx.moveTo(g.x2 - tickSize, g.y2);
                this.ctx.lineTo(g.x2 + tickSize, g.y2);
                this.ctx.stroke();
            } else { // Horizontal Line
                this.ctx.beginPath();
                this.ctx.moveTo(g.x1, g.y1 - tickSize);
                this.ctx.lineTo(g.x1, g.y1 + tickSize);
                this.ctx.moveTo(g.x2, g.y2 - tickSize);
                this.ctx.lineTo(g.x2, g.y2 + tickSize);
                this.ctx.stroke();
            }

            // Draw Label Background
            const textWidth = this.ctx.measureText(g.label).width;
            const padding = 2 / zoom;
            this.ctx.save();
            this.ctx.fillStyle = '#FF0000';
            this.ctx.fillRect(g.labelX - textWidth / 2 - padding, g.labelY - 6/zoom - padding, textWidth + padding * 2, 12/zoom + padding * 2);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillText(g.label, g.labelX, g.labelY);
            this.ctx.restore();
        });

        this.ctx.restore();
    }

    snapToGuides(id, x, y, width, height, zoom) {
        const state = store.getState();
        const slide = state.slides[state.editor.activeSlideId];
        const SNAP_THRESHOLD = 5 / zoom;
        
        let snappedX = x;
        let snappedY = y;
        const guides = [];
        
        // Edges to check: Left, Center, Right, Top, Middle, Bottom
        const myEdges = {
            l: x, c: x + width / 2, r: x + width,
            t: y, m: y + height / 2, b: y + height
        };
        
        // Potential snap targets
        const targets = { x: [], y: [] };
        
        // Add Canvas Center
        targets.x.push({ value: slide.width / 2, type: 'center' });
        targets.y.push({ value: slide.height / 2, type: 'middle' });
        
        // Add other elements
        Object.values(slide.elements).forEach(el => {
            if (el.id === id) return;
            targets.x.push({ value: el.x, type: 'left' });
            targets.x.push({ value: el.x + el.width / 2, type: 'center' });
            targets.x.push({ value: el.x + el.width, type: 'right' });
            
            targets.y.push({ value: el.y, type: 'top' });
            targets.y.push({ value: el.y + el.height / 2, type: 'middle' });
            targets.y.push({ value: el.y + el.height, type: 'bottom' });
        });
        
        // Check X Snaps
        let minDiffX = SNAP_THRESHOLD;
        
        // Check Left Edge
        targets.x.forEach(t => {
            if (Math.abs(t.value - myEdges.l) < minDiffX) {
                snappedX = t.value;
                minDiffX = Math.abs(t.value - myEdges.l);
                guides.push({ type: 'v', x: t.value });
            }
        });
        
        // Check Center
        targets.x.forEach(t => {
            if (Math.abs(t.value - myEdges.c) < minDiffX) {
                snappedX = t.value - width / 2;
                minDiffX = Math.abs(t.value - myEdges.c);
                guides.push({ type: 'v', x: t.value });
            }
        });
        
        // Check Right
        targets.x.forEach(t => {
            if (Math.abs(t.value - myEdges.r) < minDiffX) {
                snappedX = t.value - width;
                minDiffX = Math.abs(t.value - myEdges.r);
                guides.push({ type: 'v', x: t.value });
            }
        });
        
        // Check Y Snaps
        let minDiffY = SNAP_THRESHOLD;
        
        targets.y.forEach(t => {
            if (Math.abs(t.value - myEdges.t) < minDiffY) {
                snappedY = t.value;
                minDiffY = Math.abs(t.value - myEdges.t);
                guides.push({ type: 'h', y: t.value });
            }
        });
        
        targets.y.forEach(t => {
            if (Math.abs(t.value - myEdges.m) < minDiffY) {
                snappedY = t.value - height / 2;
                minDiffY = Math.abs(t.value - myEdges.m);
                guides.push({ type: 'h', y: t.value });
            }
        });
        
        targets.y.forEach(t => {
            if (Math.abs(t.value - myEdges.b) < minDiffY) {
                snappedY = t.value - height;
                minDiffY = Math.abs(t.value - myEdges.b);
                guides.push({ type: 'h', y: t.value });
            }
        });
        
        return { x: snappedX, y: snappedY, guides };
    }

    renderGuides() {
        if (!this.activeGuides || this.activeGuides.length === 0) return;
        
        const state = store.getState();
        const { zoom, pan } = state.editor;
        
        this.ctx.save();
        this.ctx.translate(pan.x, pan.y);
        this.ctx.scale(zoom, zoom);
        
        this.ctx.strokeStyle = '#FF00FF'; // Magenta for guides
        this.ctx.lineWidth = 1 / zoom;
        
        this.activeGuides.forEach(g => {
            this.ctx.beginPath();
            if (g.type === 'v') {
                this.ctx.moveTo(g.x, -10000); // Infinite line
                this.ctx.lineTo(g.x, 10000);
            } else {
                this.ctx.moveTo(-10000, g.y);
                this.ctx.lineTo(10000, g.y);
            }
            this.ctx.stroke();
        });
        
        this.ctx.restore();
    }

    renderSelectionMarquee() {
        const { x: startX, y: startY } = this.dragStart;
        const { x: currX, y: currY } = this.dragCurrent;

        const x = Math.min(startX, currX);
        const y = Math.min(startY, currY);
        const width = Math.abs(currX - startX);
        const height = Math.abs(currY - startY);

        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(0, 85, 255, 0.8)'; // TE Blue
        this.ctx.lineWidth = 1;
        this.ctx.fillStyle = 'rgba(0, 85, 255, 0.1)'; // Transparent Blue
        
        this.ctx.fillRect(x, y, width, height);
        this.ctx.strokeRect(x, y, width, height);
        
        this.ctx.restore();
    }

    renderCreationGhost() {
        const { x: startX, y: startY } = this.dragStart;
        const { x: currX, y: currY } = this.dragCurrent;

        const x = Math.min(startX, currX);
        const y = Math.min(startY, currY);
        const width = Math.abs(currX - startX);
        const height = Math.abs(currY - startY);

        this.ctx.save();
        this.ctx.strokeStyle = '#0055FF';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(x, y, width, height);
        
        // Optional: Fill with transparent blue
        this.ctx.fillStyle = 'rgba(0, 85, 255, 0.1)';
        this.ctx.fillRect(x, y, width, height);
        
        this.ctx.restore();
    }

    renderGizmos() {
        const state = store.getState();
        const { selectedElementIds, zoom, pan } = state.editor;
        const activeSlideId = state.editor.activeSlideId;
        const slide = state.slides[activeSlideId];

        if (!slide || selectedElementIds.length === 0) return;

        this.ctx.save();
        // Apply Viewport Transform to Canvas Context so we draw in World Space
        this.ctx.translate(pan.x, pan.y);
        this.ctx.scale(zoom, zoom);

        selectedElementIds.forEach(id => {
            const el = slide.elements[id];
            if (el) {
                const absEl = this.getAbsoluteElement(el, slide);
                this.drawSelectionBox(absEl, zoom);
            }
        });

        this.ctx.restore();
    }

    drawHoverOutline(el, zoom) {
        const { x, y, width, height, rotation } = el;
        
        this.ctx.save();
        this.ctx.translate(x + width / 2, y + height / 2);
        this.ctx.rotate((rotation || 0) * Math.PI / 180);
        this.ctx.translate(-width / 2, -height / 2);

        this.ctx.strokeStyle = '#0055FF'; // TE Blue
        this.ctx.lineWidth = 1 / zoom;
        this.ctx.strokeRect(0, 0, width, height);

        this.ctx.restore();
    }

    drawSelectionBox(el, zoom) {
        const { x, y, width, height, rotation } = el;
        
        this.ctx.save();
        // Translate to center of element to rotate
        this.ctx.translate(x + width / 2, y + height / 2);
        this.ctx.rotate((rotation || 0) * Math.PI / 180);
        // Translate back to top-left relative to center
        this.ctx.translate(-width / 2, -height / 2);

        // Draw Box
        this.ctx.strokeStyle = '#0055FF'; // TE Blue
        this.ctx.lineWidth = 1.5 / zoom;
        this.ctx.strokeRect(0, 0, width, height);

        // Draw Handles
        const handleSize = 8 / zoom;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.strokeStyle = '#0055FF';
        this.ctx.lineWidth = 1 / zoom;

        // Order: NW, N, NE, E, SE, S, SW, W
        const handles = [
            { x: 0, y: 0 }, 
            { x: width / 2, y: 0 }, 
            { x: width, y: 0 }, 
            { x: width, y: height / 2 }, 
            { x: width, y: height }, 
            { x: width / 2, y: height }, 
            { x: 0, y: height }, 
            { x: 0, y: height / 2 } 
        ];

        handles.forEach(h => {
            this.ctx.fillRect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize);
            this.ctx.strokeRect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize);
        });

        // Rotation Handle
        const rotHandleDist = 20 / zoom;
        this.ctx.beginPath();
        this.ctx.moveTo(width / 2, 0);
        this.ctx.lineTo(width / 2, -rotHandleDist);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.arc(width / 2, -rotHandleDist, handleSize / 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.restore();
    }

    getAbsoluteElement(el, slide) {
        let x = el.x;
        let y = el.y;
        let rotation = el.rotation || 0;
        let parentId = el.parentId;

        // TODO: Handle parent rotation properly (requires matrix math)
        // For now, we assume parents are not rotated or we just handle translation
        while (parentId) {
            const parent = slide.elements[parentId];
            if (!parent) break;
            
            x += parent.x;
            y += parent.y;
            rotation += (parent.rotation || 0);
            
            parentId = parent.parentId;
        }
        
        return { ...el, x, y, rotation };
    }

    hitTest(x, y) {
        const state = store.getState();
        const { selectedElementIds, zoom, pan } = state.editor;
        const activeSlideId = state.editor.activeSlideId;
        const slide = state.slides[activeSlideId];
        
        if (!slide) return null;

        // Convert screen (x,y) to world space
        const worldX = (x - pan.x) / zoom;
        const worldY = (y - pan.y) / zoom;

        // 1. Check Handles of Selected Elements
        for (const id of selectedElementIds) {
            const el = slide.elements[id];
            if (!el) continue;
            
            const absEl = this.getAbsoluteElement(el, slide);
            const handle = this.checkHandles(worldX, worldY, absEl, zoom);
            if (handle) {
                return { type: 'handle', id, handle };
            }
        }

        // 2. Check Element Bodies (Reverse Z-Order)
        for (let i = slide.elementOrder.length - 1; i >= 0; i--) {
            const id = slide.elementOrder[i];
            const hit = this.hitTestRecursive(id, worldX, worldY, slide, 0, 0);
            if (hit) return hit;
        }

        return null;
    }

    hitTestRecursive(id, wx, wy, slide, parentX, parentY) {
        const el = slide.elements[id];
        if (!el) return null;

        const absX = el.x + parentX;
        const absY = el.y + parentY;

        // Check if point in element (using absolute coordinates)
        // We create a temporary object with absolute coordinates for the check
        const absEl = { ...el, x: absX, y: absY };

        if (this.pointInElement(wx, wy, absEl)) {
            // If group, check children (reverse order)
            if (el.type === 'group' && el.children) {
                for (let i = el.children.length - 1; i >= 0; i--) {
                    const childId = el.children[i];
                    const childHit = this.hitTestRecursive(childId, wx, wy, slide, absX, absY);
                    if (childHit) return childHit;
                }
                // If no child hit, but inside group bounds?
                // Return group? Yes.
                return { type: 'element', id: el.id };
            }
            return { type: 'element', id: el.id };
        }
        return null;
    }

    checkHandles(wx, wy, el, zoom) {
        const { x, y, width, height, rotation } = el;
        const handleSize = 8 / zoom;
        const hitRadius = handleSize; 

        // Transform point to local unrotated space relative to element center
        const cx = x + width / 2;
        const cy = y + height / 2;
        
        const rad = -(rotation || 0) * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        
        const dx = wx - cx;
        const dy = wy - cy;
        
        const localX = (dx * cos - dy * sin) + width / 2; 
        const localY = (dx * sin + dy * cos) + height / 2;

        const handles = {
            'nw': { x: 0, y: 0 },
            'n':  { x: width / 2, y: 0 },
            'ne': { x: width, y: 0 },
            'e':  { x: width, y: height / 2 },
            'se': { x: width, y: height },
            's':  { x: width / 2, y: height },
            'sw': { x: 0, y: height },
            'w':  { x: 0, y: height / 2 }
        };

        for (const [key, h] of Object.entries(handles)) {
            if (Math.abs(localX - h.x) <= hitRadius && Math.abs(localY - h.y) <= hitRadius) {
                return key;
            }
        }
        
        const rotHandleDist = 20 / zoom;
        if (Math.abs(localX - width / 2) <= hitRadius && Math.abs(localY - (-rotHandleDist)) <= hitRadius) {
            return 'rot';
        }

        return null;
    }

    pointInElement(wx, wy, el) {
        const { x, y, width, height, rotation } = el;
        
        const cx = x + width / 2;
        const cy = y + height / 2;
        
        const rad = -(rotation || 0) * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        
        const dx = wx - cx;
        const dy = wy - cy;
        
        const localX = (dx * cos - dy * sin) + width / 2;
        const localY = (dx * sin + dy * cos) + height / 2;

        return localX >= 0 && localX <= width && localY >= 0 && localY <= height;
    }
}
