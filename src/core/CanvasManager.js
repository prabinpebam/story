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

    getActiveContainer(state) {
        if (state.editor.mode === 'master') {
            const activeId = state.editor.activeMasterId;
            const masters = state.masters;
            return masters[activeId] || null;
        } else {
            return state.slides[state.editor.activeSlideId];
        }
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

        store.on('state-changed', (state) => {
            if (this.interactionState === 'IDLE' && !this.isSpacePressed) {
                this.container.style.cursor = state.editor.activeTool === 'hand' ? 'grab' : 'default';
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
        const slide = this.getActiveContainer(state);
        
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
        // Deselect slides on any canvas interaction
        store.dispatch('DESELECT_SLIDES');

        const state = store.getState();
        const activeTool = state.editor.activeTool;

        // Middle Mouse or Space+Left Click or Hand Tool -> Pan
        if (e.button === 1 || (e.button === 0 && (this.isSpacePressed || activeTool === 'hand'))) {
            e.preventDefault();
            this.interactionState = 'PANNING';
            const rect = this.container.getBoundingClientRect();
            this.lastMouseX = e.clientX - rect.left;
            this.lastMouseY = e.clientY - rect.top;
            this.container.style.cursor = 'grabbing';
            return;
        }

        if (e.button === 0) { // Left Click
            const rect = this.container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Handle Creation Tools
            if (activeTool !== 'select') {
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
                    const slide = this.getActiveContainer(state);

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
                    }
                    e.stopPropagation();
                } else if (hit.type === 'element') {
                    // Handle Inherited Elements (Placeholders)
                    if (hit.isInherited) {
                        if (hit.element.isPlaceholder) {
                            // Instantiate Placeholder
                            store.dispatch('INSTANTIATE_PLACEHOLDER', { 
                                placeholderId: hit.id,
                                element: hit.element
                            });
                            return; // Stop further processing (selection will be handled by store update)
                        } else {
                            // Regular inherited element - ignore or maybe flash to show it's locked
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
                    const activeContainer = this.getActiveContainer(newState);
                    newState.editor.selectedElementIds.forEach(id => {
                        const el = activeContainer ? activeContainer.elements[id] : null;
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
            const slide = this.getActiveContainer(state);
            const newSelection = [];
            
            // In Master mode, we might need to check inherited elements too if we want to allow selecting them (read-only?)
            // But getActiveContainer only returns the layout/master itself.
            // If it's a layout, it only has its own elements.
            // If we want to select inherited elements, we need to look at effective elements.
            // However, inherited elements are usually locked/read-only in layout view.
            // Let's stick to direct elements for now, or use getEffectiveSlideData logic if available.
            // Since CanvasManager doesn't have easy access to getEffectiveSlideData (it's in Store/Renderer),
            // we'll rely on what's in the container.
            
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
                const slide = this.getActiveContainer(state);
                
                if (initial) {
                    // Calculate initial absolute position
                    let initialAbsX = initial.x;
                    let initialAbsY = initial.y;
                    let parentX = 0;
                    let parentY = 0;

                    if (initial.parentId) {
                        // Calculate parent offset
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
                    
                    // Snap Logic (using absolute coordinates)
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
                    
                    // Convert back to relative for update
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
        } else if (this.interactionState === 'RESIZING') {
            const state = store.getState();
            const { zoom, pan } = state.editor;
            
            if (this.initialSelectionBounds) {
                // --- Multi-Selection Resize ---
                const initialBounds = this.initialSelectionBounds;
                const dx = (mouseX - this.dragStart.x) / zoom;
                const dy = (mouseY - this.dragStart.y) / zoom;
                
                let localDx = dx;
                let localDy = dy;

                if (e.altKey) {
                    localDx *= 2;
                    localDy *= 2;
                }

                if (e.shiftKey && ['nw', 'ne', 'sw', 'se'].includes(this.activeHandle)) {
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

            } else {
                // --- Single Element Resize ---
                const id = state.editor.selectedElementIds[0];
                const initial = this.initialElementState;
                
                if (!initial || !id) return;

                // Handle Rotation
                if (this.activeHandle === 'rot') {
                    const slide = store.getState().slides[store.getState().editor.activeSlideId];
                    
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
                    
                    let angle = Math.atan2(worldMouseY - cy, worldMouseX - cx) * 180 / Math.PI;
                    angle += 90;
                    
                    let parentRotation = 0;
                    if (initial.parentId) {
                        let parent = slide.elements[initial.parentId];
                        while (parent) {
                            parentRotation += (parent.rotation || 0);
                            parent = slide.elements[parent.parentId];
                        }
                    }
                    
                    angle -= parentRotation;

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

                const rad = -(initial.rotation || 0) * Math.PI / 180;
                const cos = Math.cos(rad);
                const sin = Math.sin(rad);
                let localDx = dx * cos - dy * sin;
                let localDy = dx * sin + dy * cos;

                const isCenterResize = e.altKey;
                if (isCenterResize) {
                    localDx *= 2;
                    localDy *= 2;
                }

                if (e.shiftKey && ['nw', 'ne', 'sw', 'se'].includes(this.activeHandle)) {
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

                store.dispatch('UPDATE_ELEMENT', {
                    id,
                    x: newX,
                    y: newY,
                    width: newWidth,
                    height: newHeight
                });
            }
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

        this.lastMouseX = mouseX;
        this.lastMouseY = mouseY;
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
        
        const state = store.getState();
        if (this.isSpacePressed || state.editor.activeTool === 'hand') {
            this.container.style.cursor = 'grab';
        } else {
            this.container.style.cursor = 'default';
        }

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
            const container = this.getActiveContainer(state);
            const element = container ? container.elements[hit.id] : null;

            if (element) {
                if (element.type === 'text') {
                    store.dispatch('SET_EDITING_ELEMENT', hit.id);
                } else {
                    // Double click to "enter" group (Deep Select)
                    // hit.id is already the deep element from hitTestRecursive
                    store.dispatch('UPDATE_SELECTION', [hit.id]);
                }
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

        // Handle Icon Drop
        const iconData = e.dataTransfer.getData('application/story-icon');
        if (iconData) {
            try {
                const { iconClass } = JSON.parse(iconData);
                const id = `icon-${Date.now()}`;
                
                store.dispatch('ADD_ELEMENT', {
                    id,
                    type: 'text',
                    x: worldX - 25,
                    y: worldY - 25,
                    width: 50,
                    height: 50,
                    rotation: 0,
                    content: `<i class="${iconClass}"></i>`,
                    style: {
                        fontSize: 48,
                        color: '#000000',
                        textAlign: 'center',
                        fontFamily: 'Inter' // Reset font to ensure icon renders if it relies on global FA
                    }
                });
                store.dispatch('UPDATE_SELECTION', [id]);
                return;
            } catch (err) {
                console.error('Invalid icon data', err);
            }
        }

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
        // Ignore shortcuts if user is typing in an input field
        if (e.target.tagName === 'INPUT' || 
            e.target.tagName === 'TEXTAREA' || 
            e.target.isContentEditable) {
            return;
        }

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
            const state = store.getState();
            if (state.editor.selectedSlideIds && state.editor.selectedSlideIds.length > 0) {
                state.editor.selectedSlideIds.forEach(id => store.dispatch('DUPLICATE_SLIDE', id));
            } else {
                store.dispatch('DUPLICATE_ELEMENTS', { ids: null, offset: true });
            }
        }

        // Copy (Ctrl+C)
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
            const state = store.getState();
            // Priority: Elements > Slides
            if (state.editor.selectedElementIds && state.editor.selectedElementIds.length > 0) {
                e.preventDefault();
                // Copy Elements
                const container = this.getActiveContainer(state);
                if (container) {
                    const elementsToCopy = state.editor.selectedElementIds.map(id => container.elements[id]).filter(e => e);
                    if (elementsToCopy.length > 0) {
                        // Store in a custom clipboard format
                        window.elementClipboard = JSON.stringify(elementsToCopy);
                        // Clear slide clipboard to avoid confusion
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
            const state = store.getState();
            if (!state.editor.editingElementId) {
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

        // Select All (Ctrl+A or Cmd+A)
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            e.preventDefault();
            const state = store.getState();
            const slide = this.getActiveContainer(state);
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

        // Layer Ordering
        if (e.key === '[' || e.key === ']') {
            const state = store.getState();
            if (state.editor.editingElementId) return;
            
            const selectedIds = state.editor.selectedElementIds;
            if (selectedIds.length === 0) return;

            const container = this.getActiveContainer(state);
            if (!container) return;
            
            // Only handle single selection for now for simplicity, or iterate
            // Figma handles multiple by moving them all relative to their current pos
            
            selectedIds.forEach(id => {
                // Check if element is in root or group
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
                        return; // Should not happen
                    }
                }

                const currentIndex = list.indexOf(id);
                if (currentIndex === -1) return;

                let newIndex = currentIndex;
                
                if (e.ctrlKey || e.metaKey) {
                    // Send to Back / Bring to Front
                    if (e.key === '[') newIndex = 0;
                    else newIndex = list.length - 1;
                } else {
                    // Send Backward / Bring Forward
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
            const state = store.getState();
            if (!state.editor.editingElementId) {
                const selectedIds = state.editor.selectedElementIds;
                if (selectedIds.length > 0) {
                    const val = parseInt(e.key);
                    const opacity = val === 0 ? 1 : val / 10;
                    
                    selectedIds.forEach(id => {
                        const container = this.getActiveContainer(state);
                        const el = container ? container.elements[id] : null;
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
            if (this.interactionState !== 'PANNING') {
                const state = store.getState();
                this.container.style.cursor = state.editor.activeTool === 'hand' ? 'grab' : 'default';
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
            const slide = this.getActiveContainer(state);
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
             const slide = this.getActiveContainer(state);
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
        const slide = this.getActiveContainer(state);
        const rawSelectedEl = slide.elements[selectedId];
        
        if (!rawSelectedEl) return;

        // Check if hovering over another element
        const hit = this.hitTest(mouseX, mouseY);
        let rawTargetEl = null;

        if (hit && hit.type === 'element' && hit.id !== selectedId) {
            rawTargetEl = slide.elements[hit.id];
        }

        if (!rawTargetEl) {
            this.measurementGuides = null;
            return;
        }

        // Use Absolute Coordinates for Measurement
        const selectedEl = this.getAbsoluteElement(rawSelectedEl, slide);
        const targetEl = this.getAbsoluteElement(rawTargetEl, slide);

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

    checkSpacingGuides(id, x, y, width, height, zoom) {
        const state = store.getState();
        const slide = this.getActiveContainer(state);
        const SNAP_THRESHOLD = 5 / zoom;
        
        let snappedX = x;
        let snappedY = y;
        const guides = [];

        // Get all other elements absolute
        const others = [];
        
        // 1. Current Container Elements
        Object.values(slide.elements).forEach(rawEl => {
            if (rawEl.id === id) return;
            others.push(this.getAbsoluteElement(rawEl, slide));
        });

        // 2. Inherited Elements (if editing a Layout)
        if (state.editor.mode === 'master' && slide.type === 'layout' && slide.parentId) {
            const master = state.masters[slide.parentId];
            if (master && master.elements) {
                Object.values(master.elements).forEach(rawEl => {
                    // Master elements are already in the same coordinate space as Layout
                    others.push(this.getAbsoluteElement(rawEl, master));
                });
            }
        }

        // Horizontal Spacing
        const sortedX = [...others].sort((a, b) => a.x - b.x);
        const myL = x;
        const myR = x + width;
        
        const yOverlap = (el) => {
            return !(el.y > y + height || el.y + el.height < y);
        };

        const candidatesX = sortedX.filter(yOverlap);
        
        let left = null;
        let right = null;
        
        for (const el of candidatesX) {
            if (el.x + el.width < myL) {
                left = el; 
            } else if (el.x > myR) {
                if (!right) right = el; 
            }
        }

        // Case 1: Equal spacing between Left and Right
        if (left && right) {
            const gapL = myL - (left.x + left.width);
            const gapR = right.x - myR;
            
            if (Math.abs(gapL - gapR) < SNAP_THRESHOLD) {
                const totalSpace = right.x - (left.x + left.width);
                const gap = (totalSpace - width) / 2;
                snappedX = (left.x + left.width) + gap;
                
                guides.push({ type: 'gap-x', x1: left.x + left.width, x2: snappedX, y: y + height/2, label: Math.round(gap) });
                guides.push({ type: 'gap-x', x1: snappedX + width, x2: right.x, y: y + height/2, label: Math.round(gap) });
            }
        }

        // Case 2: Equal spacing with Left's Left
        if (left) {
            const leftIndex = candidatesX.indexOf(left);
            if (leftIndex > 0) {
                const leftLeft = candidatesX[leftIndex - 1];
                const gapLL = left.x - (leftLeft.x + leftLeft.width);
                const currentGap = myL - (left.x + left.width);
                
                if (Math.abs(currentGap - gapLL) < SNAP_THRESHOLD) {
                    snappedX = (left.x + left.width) + gapLL;
                    guides.push({ type: 'gap-x', x1: leftLeft.x + leftLeft.width, x2: left.x, y: y + height/2, label: Math.round(gapLL) });
                    guides.push({ type: 'gap-x', x1: left.x + left.width, x2: snappedX, y: y + height/2, label: Math.round(gapLL) });
                }
            }
        }

        // Case 3: Equal spacing with Right's Right
        if (right) {
            const rightIndex = candidatesX.indexOf(right);
            if (rightIndex < candidatesX.length - 1) {
                const rightRight = candidatesX[rightIndex + 1];
                const gapRR = rightRight.x - (right.x + right.width);
                const currentGap = right.x - myR;
                
                if (Math.abs(currentGap - gapRR) < SNAP_THRESHOLD) {
                    snappedX = right.x - gapRR - width;
                    guides.push({ type: 'gap-x', x1: snappedX + width, x2: right.x, y: y + height/2, label: Math.round(gapRR) });
                    guides.push({ type: 'gap-x', x1: right.x + right.width, x2: rightRight.x, y: y + height/2, label: Math.round(gapRR) });
                }
            }
        }

        // Vertical Spacing
        const sortedY = [...others].sort((a, b) => a.y - b.y);
        const xOverlap = (el) => {
            return !(el.x > x + width || el.x + el.width < x);
        };
        const candidatesY = sortedY.filter(xOverlap);
        
        let top = null;
        let bottom = null;
        
        for (const el of candidatesY) {
            if (el.y + el.height < y) {
                top = el;
            } else if (el.y > y + height) {
                if (!bottom) bottom = el;
            }
        }

        if (top && bottom) {
            const gapT = y - (top.y + top.height);
            const gapB = bottom.y - (y + height);
            
            if (Math.abs(gapT - gapB) < SNAP_THRESHOLD) {
                const totalSpace = bottom.y - (top.y + top.height);
                const gap = (totalSpace - height) / 2;
                snappedY = (top.y + top.height) + gap;
                
                guides.push({ type: 'gap-y', y1: top.y + top.height, y2: snappedY, x: x + width/2, label: Math.round(gap) });
                guides.push({ type: 'gap-y', y1: snappedY + height, y2: bottom.y, x: x + width/2, label: Math.round(gap) });
            }
        }
        
        if (top) {
            const topIndex = candidatesY.indexOf(top);
            if (topIndex > 0) {
                const topTop = candidatesY[topIndex - 1];
                const gapTT = top.y - (topTop.y + topTop.height);
                const currentGap = y - (top.y + top.height);
                
                if (Math.abs(currentGap - gapTT) < SNAP_THRESHOLD) {
                    snappedY = (top.y + top.height) + gapTT;
                    guides.push({ type: 'gap-y', y1: topTop.y + topTop.height, y2: top.y, x: x + width/2, label: Math.round(gapTT) });
                    guides.push({ type: 'gap-y', y1: top.y + top.height, y2: snappedY, x: x + width/2, label: Math.round(gapTT) });
                }
            }
        }

        if (bottom) {
            const bottomIndex = candidatesY.indexOf(bottom);
            if (bottomIndex < candidatesY.length - 1) {
                const bottomBottom = candidatesY[bottomIndex + 1];
                const gapBB = bottomBottom.y - (bottom.y + bottom.height);
                const currentGap = bottom.y - (y + height);
                
                if (Math.abs(currentGap - gapBB) < SNAP_THRESHOLD) {
                    snappedY = bottom.y - gapBB - height;
                    guides.push({ type: 'gap-y', y1: snappedY + height, y2: bottom.y, x: x + width/2, label: Math.round(gapBB) });
                    guides.push({ type: 'gap-y', y1: bottom.y + bottom.height, y2: bottomBottom.y, x: x + width/2, label: Math.round(gapBB) });
                }
            }
        }

        return { x: snappedX, y: snappedY, guides };
    }

    snapToGuides(id, x, y, width, height, zoom) {
        const state = store.getState();
        const slide = this.getActiveContainer(state);
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
        
        // Add Canvas Center & Borders
        targets.x.push({ value: slide.width / 2, type: 'center' });
        targets.x.push({ value: 0, type: 'left' });
        targets.x.push({ value: slide.width, type: 'right' });

        targets.y.push({ value: slide.height / 2, type: 'middle' });
        targets.y.push({ value: 0, type: 'top' });
        targets.y.push({ value: slide.height, type: 'bottom' });
        
        // Add other elements
        const addSnapTargets = (container) => {
            if (!container || !container.elements) return;
            
            Object.values(container.elements).forEach(rawEl => {
                if (rawEl.id === id) return;
                
                // Use absolute coordinates for snapping targets
                const el = this.getAbsoluteElement(rawEl, container);
                
                targets.x.push({ value: el.x, type: 'left' });
                targets.x.push({ value: el.x + el.width / 2, type: 'center' });
                targets.x.push({ value: el.x + el.width, type: 'right' });
                
                targets.y.push({ value: el.y, type: 'top' });
                targets.y.push({ value: el.y + el.height / 2, type: 'middle' });
                targets.y.push({ value: el.y + el.height, type: 'bottom' });
            });
        };

        // 1. Current Container Elements
        addSnapTargets(slide);

        // 2. Inherited Elements (if editing a Layout)
        if (state.editor.mode === 'master' && slide.type === 'layout' && slide.parentId) {
            const master = state.masters[slide.parentId];
            addSnapTargets(master);
        }
        
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
                this.ctx.stroke();
            } else if (g.type === 'h') {
                this.ctx.moveTo(-10000, g.y);
                this.ctx.lineTo(10000, g.y);
                this.ctx.stroke();
            } else if (g.type === 'gap-x') {
                const y = g.y;
                const x1 = Math.min(g.x1, g.x2);
                const x2 = Math.max(g.x1, g.x2);
                
                this.ctx.moveTo(x1, y);
                this.ctx.lineTo(x2, y);
                this.ctx.stroke();
                
                // Arrows
                const arrowSize = 4 / zoom;
                this.ctx.beginPath();
                this.ctx.moveTo(x1 + arrowSize, y - arrowSize);
                this.ctx.lineTo(x1, y);
                this.ctx.lineTo(x1 + arrowSize, y + arrowSize);
                this.ctx.stroke();
                
                this.ctx.beginPath();
                this.ctx.moveTo(x2 - arrowSize, y - arrowSize);
                this.ctx.lineTo(x2, y);
                this.ctx.lineTo(x2 - arrowSize, y + arrowSize);
                this.ctx.stroke();
                
                // Label
                const label = g.label.toString();
                this.ctx.font = `${10/zoom}px Inter, sans-serif`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                const textWidth = this.ctx.measureText(label).width;
                const padding = 2 / zoom;
                const cx = (x1 + x2) / 2;
                
                this.ctx.save();
                this.ctx.fillStyle = '#FF0000';
                this.ctx.fillRect(cx - textWidth / 2 - padding, y - 6/zoom - padding, textWidth + padding * 2, 12/zoom + padding * 2);
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillText(label, cx, y);
                this.ctx.restore();
                
            } else if (g.type === 'gap-y') {
                const x = g.x;
                const y1 = Math.min(g.y1, g.y2);
                const y2 = Math.max(g.y1, g.y2);
                
                this.ctx.moveTo(x, y1);
                this.ctx.lineTo(x, y2);
                this.ctx.stroke();
                
                // Arrows
                const arrowSize = 4 / zoom;
                this.ctx.beginPath();
                this.ctx.moveTo(x - arrowSize, y1 + arrowSize);
                this.ctx.lineTo(x, y1);
                this.ctx.lineTo(x + arrowSize, y1 + arrowSize);
                this.ctx.stroke();
                
                this.ctx.beginPath();
                this.ctx.moveTo(x - arrowSize, y2 - arrowSize);
                this.ctx.lineTo(x, y2);
                this.ctx.lineTo(x + arrowSize, y2 - arrowSize);
                this.ctx.stroke();
                
                // Label
                const label = g.label.toString();
                this.ctx.font = `${10/zoom}px Inter, sans-serif`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                const textWidth = this.ctx.measureText(label).width;
                const padding = 2 / zoom;
                const cy = (y1 + y2) / 2;
                
                this.ctx.save();
                this.ctx.fillStyle = '#FF0000';
                this.ctx.fillRect(x - textWidth / 2 - padding, cy - 6/zoom - padding, textWidth + padding * 2, 12/zoom + padding * 2);
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillText(label, x, cy);
                this.ctx.restore();
            }
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
        const slide = this.getActiveContainer(state);

        if (!slide || selectedElementIds.length === 0) return;

        this.ctx.save();
        // Apply Viewport Transform to Canvas Context so we draw in World Space
        this.ctx.translate(pan.x, pan.y);
        this.ctx.scale(zoom, zoom);

        if (selectedElementIds.length === 1) {
            const id = selectedElementIds[0];
            const el = slide.elements[id];
            if (el) {
                const absEl = this.getAbsoluteElement(el, slide);
                this.drawSelectionBox(absEl, zoom);
            }
        } else {
            // Multi-selection
            // Draw individual outlines first
            selectedElementIds.forEach(id => {
                const el = slide.elements[id];
                if (el) {
                    const absEl = this.getAbsoluteElement(el, slide);
                    this.drawHoverOutline(absEl, zoom);
                }
            });

            // Draw big bounding box
            const bounds = this.getSelectionBounds(slide, selectedElementIds);
            if (bounds) {
                this.drawSelectionBox(bounds, zoom);
            }
        }

        this.ctx.restore();
    }

    getSelectionBounds(slide, selectedIds) {
        if (selectedIds.length === 0) return null;
        
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        selectedIds.forEach(id => {
            const el = slide.elements[id];
            if (!el) return;
            const absEl = this.getAbsoluteElement(el, slide);
            
            // For rotated elements, the bounding box is larger
            // We need the AABB of the rotated element
            const corners = this.getElementCorners(absEl);
            corners.forEach(p => {
                minX = Math.min(minX, p.x);
                minY = Math.min(minY, p.y);
                maxX = Math.max(maxX, p.x);
                maxY = Math.max(maxY, p.y);
            });
        });
        
        if (minX === Infinity) return null;
        
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
            rotation: 0 // Multi-selection box is always axis-aligned
        };
    }

    getElementCorners(el) {
        const { x, y, width, height, rotation } = el;
        const cx = x + width / 2;
        const cy = y + height / 2;
        const rad = (rotation || 0) * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        
        const p = [
            { x: -width/2, y: -height/2 },
            { x: width/2, y: -height/2 },
            { x: width/2, y: height/2 },
            { x: -width/2, y: height/2 }
        ];
        
        return p.map(pt => ({
            x: cx + (pt.x * cos - pt.y * sin),
            y: cy + (pt.x * sin + pt.y * cos)
        }));
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
        const { zoom, pan } = state.editor;
        
        // Convert screen to world
        const worldX = (x - pan.x) / zoom;
        const worldY = (y - pan.y) / zoom;

        // Check handles first (if selected)
        if (state.editor.selectedElementIds.length > 0) {
            const handleHit = this.hitTestHandles(x, y);
            if (handleHit) return handleHit;
        }

        const slide = this.getActiveContainer(state);
        if (!slide) return null;

        // Reverse order (top to bottom)
        // We need to consider effective order if possible, but here we use elementOrder
        // If we are in Master mode (Layout), we might see inherited elements.
        // If we want to select them, we need to check them.
        
        let elementsToCheck = [];
        if (state.editor.mode === 'master' && slide.type === 'layout') {
             // Layout mode: Check layout elements only (for now)
             elementsToCheck = (slide.elementOrder || []).map(id => slide.elements[id]).filter(e => e);
        } else if (state.editor.mode === 'edit') {
             // Edit Mode: Check effective elements (including placeholders)
             const effectiveSlide = store.getEffectiveSlide(slide.id);
             if (effectiveSlide) {
                 elementsToCheck = (effectiveSlide.effectiveOrder || []).map(id => effectiveSlide.effectiveElements[id]).filter(e => e);
             } else {
                 elementsToCheck = (slide.elementOrder || []).map(id => slide.elements[id]).filter(e => e);
             }
        } else {
             elementsToCheck = (slide.elementOrder || []).map(id => slide.elements[id]).filter(e => e);
        }
        
        for (let i = elementsToCheck.length - 1; i >= 0; i--) {
            const el = elementsToCheck[i];
            if (this.pointInElement(worldX, worldY, el)) {
                // Check if it's inherited
                const isInherited = !Object.prototype.hasOwnProperty.call(slide.elements, el.id);
                return { type: 'element', id: el.id, isInherited, element: el };
            }
        }

        return null;
    }

    hitTestHandles(x, y) {
        const state = store.getState();
        const { zoom, pan } = state.editor;
        
        // Convert screen (x,y) to world space
        const worldX = (x - pan.x) / zoom;
        const worldY = (y - pan.y) / zoom;

        const slide = this.getActiveContainer(state);
        if (!slide) return null;

        // 1. Check Handles
        if (state.editor.selectedElementIds.length === 1) {
            const id = state.editor.selectedElementIds[0];
            const el = slide.elements[id];
            if (el) {
                const absEl = this.getAbsoluteElement(el, slide);
                const handle = this.checkHandles(worldX, worldY, absEl, zoom);
                if (handle) {
                    return { type: 'handle', id, handle };
                }
            }
        } else if (state.editor.selectedElementIds.length > 1) {
            const bounds = this.getSelectionBounds(slide, state.editor.selectedElementIds);
            if (bounds) {
                const handle = this.checkHandles(worldX, worldY, bounds, zoom);
                if (handle) {
                    return { type: 'handle', id: 'multi-selection', handle };
                }
            }
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

    snapResize(id, handle, x, y, width, height, zoom) {
        const state = store.getState();
        const slide = this.getActiveContainer(state);
        const SNAP_THRESHOLD = 5 / zoom;
        
        let snappedX = x;
        let snappedY = y;
        let snappedW = width;
        let snappedH = height;
        const guides = [];

        // Only snap if rotation is 0
        const el = slide.elements[id];
        if (el && el.rotation && el.rotation % 360 !== 0) {
             return { x, y, width, height, guides: [] };
        }

        const targets = { x: [], y: [] };
        
        targets.x.push({ value: slide.width / 2, type: 'center' });
        targets.x.push({ value: 0, type: 'left' });
        targets.x.push({ value: slide.width, type: 'right' });

        targets.y.push({ value: slide.height / 2, type: 'middle' });
        targets.y.push({ value: 0, type: 'top' });
        targets.y.push({ value: slide.height, type: 'bottom' });
        
        Object.values(slide.elements).forEach(rawEl => {
            if (rawEl.id === id) return;
            const el = this.getAbsoluteElement(rawEl, slide);
            targets.x.push({ value: el.x, type: 'left' });
            targets.x.push({ value: el.x + el.width / 2, type: 'center' });
            targets.x.push({ value: el.x + el.width, type: 'right' });
            targets.y.push({ value: el.y, type: 'top' });
            targets.y.push({ value: el.y + el.height / 2, type: 'middle' });
            targets.y.push({ value: el.y + el.height, type: 'bottom' });
        });

        let minDiffX = SNAP_THRESHOLD;
        let minDiffY = SNAP_THRESHOLD;

        // Horizontal Snapping (Width / X)
        if (handle.includes('w')) { // Left Edge
            targets.x.forEach(t => {
                if (Math.abs(t.value - x) < minDiffX) {
                    const diff = t.value - x;
                    snappedX = t.value;
                    snappedW = width - diff;
                    minDiffX = Math.abs(diff);
                    guides.push({ type: 'v', x: t.value });
                }
            });
        } else if (handle.includes('e')) { // Right Edge
            const right = x + width;
            targets.x.forEach(t => {
                if (Math.abs(t.value - right) < minDiffX) {
                    const diff = t.value - right;
                    snappedW = width + diff;
                    minDiffX = Math.abs(diff);
                    guides.push({ type: 'v', x: t.value });
                }
            });
        }

        // Vertical Snapping (Height / Y)
        if (handle.includes('n')) { // Top Edge
            targets.y.forEach(t => {
                if (Math.abs(t.value - y) < minDiffY) {
                    const diff = t.value - y;
                    snappedY = t.value;
                    snappedH = height - diff;
                    minDiffY = Math.abs(diff);
                    guides.push({ type: 'h', y: t.value });
                }
            });
        } else if (handle.includes('s')) { // Bottom Edge
            const bottom = y + height;
            targets.y.forEach(t => {
                if (Math.abs(t.value - bottom) < minDiffY) {
                    const diff = t.value - bottom;
                    snappedH = height + diff;
                    minDiffY = Math.abs(diff);
                    guides.push({ type: 'h', y: t.value });
                }
            });
        }

        return { x: snappedX, y: snappedY, width: snappedW, height: snappedH, guides };
    }
}
