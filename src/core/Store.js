import { EventEmitter } from './Events.js';

// Default Masters Definition
const DEFAULT_MASTERS = {
    "theme-default": {
        id: "theme-default",
        type: "theme",
        name: "Default Theme",
        background: { type: "solid", value: "#ffffff" },
        elements: {},
        elementOrder: [],
        themeSettings: {
            colors: {
                accent: "#18A0FB",
                textPrimary: "#333333",
                textSecondary: "#888888"
            },
            fonts: { heading: "Inter", body: "Inter" }
        }
    },
    "layout-title": {
        id: "layout-title",
        type: "layout",
        parentId: "theme-default",
        name: "Title Slide",
        background: null,
        elements: {
            "placeholder-title": {
                id: "placeholder-title",
                type: "text",
                isPlaceholder: true,
                placeholderType: "title",
                content: "<h1>Click to add title</h1>",
                x: 192, y: 300, width: 1536, height: 200, // Centered with margins
                rotation: 0, opacity: 1,
                style: { fontSize: 72, textAlign: "center", color: "#333333", fontFamily: "Inter", fontWeight: "700" }
            },
            "placeholder-subtitle": {
                id: "placeholder-subtitle",
                type: "text",
                isPlaceholder: true,
                placeholderType: "subtitle",
                content: "<h2>Click to add subtitle</h2>",
                x: 192, y: 550, width: 1536, height: 100,
                rotation: 0, opacity: 1,
                style: { fontSize: 32, textAlign: "center", color: "#888888", fontFamily: "Inter", fontWeight: "400" }
            }
        },
        elementOrder: ["placeholder-title", "placeholder-subtitle"]
    },
    "layout-blank": {
        id: "layout-blank",
        type: "layout",
        parentId: "theme-default",
        name: "Blank",
        background: null,
        elements: {},
        elementOrder: []
    }
};

class Store extends EventEmitter {
    constructor() {
        super();
        
        // Initial State
        this.state = {
            meta: {
                title: "Untitled Presentation",
                author: "User",
                created: Date.now(),
                modified: Date.now(),
                theme: "default-dark"
            },
            editor: {
                mode: "edit", // 'edit', 'presentation', 'master'
                activeSlideId: "slide-1",
                activeMasterId: "theme-default", // Default to the first theme
                selectedSlideIds: [], // IDs of selected slides (for operations)
                selectedElementIds: [],
                editingElementId: null, // ID of element currently being edited (text)
                activeTool: "select", // 'select', 'text', 'rect', 'circle', 'hand'
                zoom: 1.0,
                pan: { x: 0, y: 0 },
                gridEnabled: true,
                snapToGrid: true
            },
            masters: DEFAULT_MASTERS,
            slides: {
                "slide-1": {
                    id: "slide-1",
                    layoutId: "layout-title", // Default to Title Layout
                    title: "Introduction",
                    width: 1920,
                    height: 1080,
                    background: null, // Inherit from layout/theme
                    elements: {
                        // Instantiate placeholders so they are editable
                        "placeholder-title": { 
                            ...DEFAULT_MASTERS["layout-title"].elements["placeholder-title"],
                            content: "<h1>Introduction</h1>"
                        },
                        "placeholder-subtitle": {
                            ...DEFAULT_MASTERS["layout-title"].elements["placeholder-subtitle"],
                            content: "<h2>Subtitle</h2>"
                        }
                    }, 
                    elementOrder: ["placeholder-title", "placeholder-subtitle"], // Array of IDs (z-index)
                    notes: "",
                    transition: "magic" // Default transition
                }
            },
            slideOrder: ["slide-1"]
        };
    }

    /**
     * Get current state snapshot
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Dispatch an action to update state
     * @param {string} type - Action type
     * @param {any} payload - Action data
     */
    dispatch(type, payload) {
        console.log(`Action: ${type}`, payload);

        switch (type) {
            case 'SELECT_SLIDE':
                // Payload: { id, multi }
                const { id: selectSlideId, multi } = payload;
                if (multi) {
                    const index = this.state.editor.selectedSlideIds.indexOf(selectSlideId);
                    if (index === -1) {
                        this.state.editor.selectedSlideIds.push(selectSlideId);
                    } else {
                        this.state.editor.selectedSlideIds.splice(index, 1);
                    }
                } else {
                    this.state.editor.selectedSlideIds = [selectSlideId];
                }
                this.emit('state-changed', this.state);
                break;

            case 'DESELECT_SLIDES':
                this.state.editor.selectedSlideIds = [];
                this.emit('state-changed', this.state);
                break;

            case 'SET_ACTIVE_SLIDE':
                if (this.state.slides[payload]) {
                    this.state.editor.activeSlideId = payload;
                    this.emit('state-changed', this.state);
                }
                break;

            case 'SET_ACTIVE_MASTER':
                // Check if it's a master or layout
                if (this.state.masters[payload]) {
                    this.state.editor.activeMasterId = payload;
                    this.emit('state-changed', this.state);
                }
                break;

            case 'SET_ACTIVE_TOOL':
                this.state.editor.activeTool = payload;
                // Clear selection when switching to creation tools
                if (payload !== 'select') {
                    this.state.editor.selectedElementIds = [];
                    this.state.editor.editingElementId = null; // Stop editing
                }
                this.emit('state-changed', this.state);
                break;

            case 'SET_MODE':
                this.state.editor.mode = payload;
                
                if (payload === 'master' && !this.state.editor.activeMasterId) {
                    // Default to first master
                    const firstMaster = Object.keys(this.state.masters)[0];
                    if (firstMaster) {
                        this.state.editor.activeMasterId = firstMaster;
                    }
                }

                this.emit('state-changed', this.state);
                this.emit('mode-changed', payload);
                break;

            case 'SET_EDITING_ELEMENT':
                this.state.editor.editingElementId = payload;
                this.emit('state-changed', this.state);
                break;

            case 'ADD_SLIDE':
                const newSlideId = `slide-${Date.now()}`;
                const newSlide = {
                    id: newSlideId,
                    layoutId: "layout-blank", // Default to Blank for new slides
                    title: "New Slide",
                    width: 1920,
                    height: 1080,
                    background: null, // Inherit
                    elements: {},
                    elementOrder: [],
                    notes: "",
                    transition: "magic"
                };
                this.state.slides[newSlideId] = newSlide;
                this.state.slideOrder.push(newSlideId);
                this.state.editor.activeSlideId = newSlideId;
                this.emit('state-changed', this.state);
                break;

            case 'DELETE_SLIDE':
                const slideIdToDelete = payload;
                // Don't delete if it's the only slide
                if (this.state.slideOrder.length <= 1) return;

                const indexToDelete = this.state.slideOrder.indexOf(slideIdToDelete);
                if (indexToDelete === -1) return;

                // Remove from order array
                this.state.slideOrder.splice(indexToDelete, 1);
                // Remove from slides map
                delete this.state.slides[slideIdToDelete];

                // Update active slide if we deleted the active one
                if (this.state.editor.activeSlideId === slideIdToDelete) {
                    // Select the previous one, or the next one (now at same index), or the first one
                    const newIndex = Math.max(0, indexToDelete - 1);
                    this.state.editor.activeSlideId = this.state.slideOrder[newIndex];
                }
                
                this.emit('state-changed', this.state);
                break;

            case 'DUPLICATE_SLIDE':
                const sourceId = payload;
                const sourceSlide = this.state.slides[sourceId];
                if (!sourceSlide) return;

                const dupId = `slide-${Date.now()}`;
                // Deep copy elements
                const newElements = {};
                Object.keys(sourceSlide.elements).forEach(key => {
                    newElements[key] = { ...sourceSlide.elements[key] };
                });

                const dupSlide = {
                    ...sourceSlide,
                    id: dupId,
                    title: `${sourceSlide.title} (Copy)`,
                    elements: newElements,
                    elementOrder: [...sourceSlide.elementOrder]
                };

                // Insert after source slide
                const sourceIndex = this.state.slideOrder.indexOf(sourceId);
                this.state.slides[dupId] = dupSlide;
                this.state.slideOrder.splice(sourceIndex + 1, 0, dupId);
                
                this.state.editor.activeSlideId = dupId;
                this.emit('state-changed', this.state);
                break;

            case 'PASTE_ELEMENTS':
                // Payload: { elements: [] }
                const pContainer = this.getActiveContainer();
                if (!pContainer || !payload.elements || payload.elements.length === 0) return;

                const pastedIds = [];
                payload.elements.forEach(el => {
                    const newId = `${el.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    const newEl = { ...el, id: newId };
                    
                    // Offset slightly to show it's a copy
                    newEl.x += 20;
                    newEl.y += 20;
                    
                    // Reset parentId as we are pasting to root (or we could support pasting into groups later)
                    delete newEl.parentId; 

                    pContainer.elements[newId] = newEl;
                    pContainer.elementOrder.push(newId);
                    pastedIds.push(newId);
                });

                // Select pasted elements
                this.state.editor.selectedElementIds = pastedIds;
                this.emit('state-changed', this.state);
                break;

            case 'PASTE_SLIDE':
                const { sourceId: pasteSourceId, targetId: pasteTargetId } = payload;
                const pasteSourceSlide = this.state.slides[pasteSourceId];
                if (!pasteSourceSlide) return;

                const pasteDupId = `slide-${Date.now()}`;
                // Deep copy elements
                const pasteNewElements = {};
                Object.keys(pasteSourceSlide.elements).forEach(key => {
                    pasteNewElements[key] = { ...pasteSourceSlide.elements[key] };
                });

                const pasteDupSlide = {
                    ...pasteSourceSlide,
                    id: pasteDupId,
                    title: `${pasteSourceSlide.title} (Copy)`,
                    elements: pasteNewElements,
                    elementOrder: [...pasteSourceSlide.elementOrder]
                };

                // Insert after target slide
                const pasteTargetIndex = this.state.slideOrder.indexOf(pasteTargetId);
                this.state.slides[pasteDupId] = pasteDupSlide;
                // If target not found (shouldn't happen), append to end
                if (pasteTargetIndex === -1) {
                    this.state.slideOrder.push(pasteDupId);
                } else {
                    this.state.slideOrder.splice(pasteTargetIndex + 1, 0, pasteDupId);
                }
                
                this.state.editor.activeSlideId = pasteDupId;
                this.emit('state-changed', this.state);
                break;

            case 'REORDER_SLIDES':
                // Payload: { fromIndex, toIndex }
                const { fromIndex, toIndex } = payload;
                if (fromIndex < 0 || fromIndex >= this.state.slideOrder.length || 
                    toIndex < 0 || toIndex >= this.state.slideOrder.length) return;

                const [movedId] = this.state.slideOrder.splice(fromIndex, 1);
                this.state.slideOrder.splice(toIndex, 0, movedId);
                
                this.emit('state-changed', this.state);
                break;

            case 'REORDER_ELEMENTS':
                // Payload: { slideId, elementId, targetParentId, targetIndex }
                // targetParentId: null for root, or ID of group
                // targetIndex: index in the destination array (children or elementOrder)
                
                const { slideId: reorderContainerId, elementId, targetParentId, targetIndex } = payload;
                
                let slide = this.state.slides[reorderContainerId];
                if (!slide) {
                    slide = this.state.masters[reorderContainerId];
                }
                
                if (!slide) return;

                const element = slide.elements[elementId];
                if (!element) return;

                // 1. Remove from old location
                if (element.parentId) {
                    const oldParent = slide.elements[element.parentId];
                    if (oldParent && oldParent.children) {
                        const idx = oldParent.children.indexOf(elementId);
                        if (idx > -1) oldParent.children.splice(idx, 1);
                    }
                } else {
                    const idx = slide.elementOrder.indexOf(elementId);
                    if (idx > -1) slide.elementOrder.splice(idx, 1);
                }

                // 2. Add to new location
                if (targetParentId) {
                    const newParent = slide.elements[targetParentId];
                    if (newParent) {
                        if (!newParent.children) newParent.children = [];
                        // Clamp index
                        const safeIndex = Math.max(0, Math.min(targetIndex, newParent.children.length));
                        newParent.children.splice(safeIndex, 0, elementId);
                        element.parentId = targetParentId;
                        
                        // Update group bounds if needed (simplified: just mark for update or let renderer handle)
                    }
                } else {
                    // Root
                    const safeIndex = Math.max(0, Math.min(targetIndex, slide.elementOrder.length));
                    slide.elementOrder.splice(safeIndex, 0, elementId);
                    element.parentId = null;
                }
                
                this.emit('state-changed', this.state);
                break;

            case 'TOGGLE_ELEMENT_LOCK':
                // Payload: { id }
                const sLock = this.getActiveContainer();

                if (sLock && sLock.elements[payload.id]) {
                    const el = sLock.elements[payload.id];
                    el.locked = !el.locked;
                    this.emit('state-changed', this.state);
                }
                break;

            case 'TOGGLE_ELEMENT_VISIBILITY':
                // Payload: { id }
                const sVis = this.getActiveContainer();

                if (sVis && sVis.elements[payload.id]) {
                    const el = sVis.elements[payload.id];
                    el.hidden = !el.hidden;
                    this.emit('state-changed', this.state);
                }
                break;

            case 'REMOVE_ELEMENT':
                const rSlide = this.getActiveContainer();
                
                if (!rSlide) break;
                
                // Handle both single ID and array of IDs
                const idsToDelete = Array.isArray(payload) ? payload : [payload];
                const allIdsToDelete = new Set();
                
                // Recursively collect all IDs to delete (including children)
                const collectIds = (id) => {
                    if (allIdsToDelete.has(id)) return;
                    allIdsToDelete.add(id);
                    const el = rSlide.elements[id];
                    if (el && el.type === 'group' && el.children) {
                        el.children.forEach(collectIds);
                    }
                };

                idsToDelete.forEach(id => {
                    if (rSlide.elements[id]) collectIds(id);
                });

                allIdsToDelete.forEach(id => {
                    const el = rSlide.elements[id];
                    if (!el) return;

                    // Remove from parent if exists
                    if (el.parentId) {
                        const parent = rSlide.elements[el.parentId];
                        if (parent && parent.children) {
                            parent.children = parent.children.filter(cid => cid !== id);
                        }
                    }

                    // Remove from elementOrder
                    rSlide.elementOrder = rSlide.elementOrder.filter(eid => eid !== id);
                    
                    // Delete element
                    delete rSlide.elements[id];
                });
                
                // Update selection
                this.state.editor.selectedElementIds = this.state.editor.selectedElementIds.filter(id => !allIdsToDelete.has(id));
                
                this.emit('state-changed', this.state);
                break;

            case 'DUPLICATE_ELEMENTS':
                const dSlide = this.getActiveContainer();
                
                if (!dSlide) break;

                const idsToDuplicate = payload.ids || this.state.editor.selectedElementIds;
                const offset = payload.offset || false;

                const newSelectedIds = [];
                
                // Helper to deep clone
                const cloneElement = (id, parentId = null) => {
                    const original = dSlide.elements[id];
                    if (!original) return null;

                    const newId = `${original.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    const newEl = { ...original, id: newId };
                    
                    if (parentId) {
                        newEl.parentId = parentId;
                    } else {
                        delete newEl.parentId;
                    }
                    
                    if (offset && !parentId) { // Only offset top-level clones
                        newEl.x += 20;
                        newEl.y += 20;
                    }

                    if (original.type === 'group' && original.children) {
                        newEl.children = [];
                        original.children.forEach(childId => {
                            const childCloneId = cloneElement(childId, newId);
                            if (childCloneId) newEl.children.push(childCloneId);
                        });
                    }
                    
                    dSlide.elements[newId] = newEl;
                    return newId;
                };

                // Filter out descendants if their ancestor is also being duplicated
                const rootsToDuplicate = idsToDuplicate.filter(id => {
                    let ancestor = dSlide.elements[id]?.parentId;
                    while (ancestor) {
                        if (idsToDuplicate.includes(ancestor)) return false;
                        ancestor = dSlide.elements[ancestor]?.parentId;
                    }
                    return true;
                });

                rootsToDuplicate.forEach(id => {
                    const original = dSlide.elements[id];
                    if (!original) return;

                    const newId = cloneElement(id, original.parentId);
                    if (newId) {
                        newSelectedIds.push(newId);
                        
                        if (original.parentId) {
                            const parent = dSlide.elements[original.parentId];
                            if (parent) {
                                const idx = parent.children.indexOf(id);
                                parent.children.splice(idx + 1, 0, newId);
                            }
                        } else {
                            const idx = dSlide.elementOrder.indexOf(id);
                            dSlide.elementOrder.splice(idx + 1, 0, newId);
                        }
                    }
                });

                this.state.editor.selectedElementIds = newSelectedIds;
                this.emit('state-changed', this.state);
                break;

            case 'ADD_ELEMENT':
                const addContainer = this.getActiveContainer();

                if (addContainer) {
                    addContainer.elements[payload.id] = payload;
                    addContainer.elementOrder.push(payload.id);
                    this.emit('state-changed', this.state);
                }
                break;

            case 'UPDATE_ELEMENT':
                const container = this.getActiveContainer();

                if (container && container.elements[payload.id]) {
                    const oldEl = container.elements[payload.id];
                    const newEl = { ...oldEl, ...payload };
                    container.elements[payload.id] = newEl;

                    // Check if we need to update parent group bounds
                    if (newEl.parentId) {
                        let parentId = newEl.parentId;
                        while (parentId) {
                            const parent = container.elements[parentId];
                            if (!parent || parent.type !== 'group') break;

                            // Recalculate group bounds based on all children
                            // Note: Children coordinates are relative to the group.
                            // If a child moves/resizes, the group's bounding box (which wraps children) might change.
                            // If the group's bounding box changes, its x/y/width/height changes.
                            // BUT, if x/y changes, the children's relative coordinates must shift to stay in place visually.
                            
                            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                            
                            if (parent.children && parent.children.length > 0) {
                                parent.children.forEach(childId => {
                                    const child = container.elements[childId];
                                    if (child) {
                                        minX = Math.min(minX, child.x);
                                        minY = Math.min(minY, child.y);
                                        maxX = Math.max(maxX, child.x + child.width);
                                        maxY = Math.max(maxY, child.y + child.height);
                                    }
                                });
                            } else {
                                // Empty group?
                                minX = 0; minY = 0; maxX = 100; maxY = 100;
                            }

                            const newGroupX = parent.x + minX;
                            const newGroupY = parent.y + minY;
                            const newGroupW = maxX - minX;
                            const newGroupH = maxY - minY;

                            // Update Parent
                            parent.x = newGroupX;
                            parent.y = newGroupY;
                            parent.width = newGroupW;
                            parent.height = newGroupH;

                            // Shift all children to keep them visually in place relative to new parent origin
                            // New Relative X = Old Relative X - minX
                            // New Relative Y = Old Relative Y - minY
                            if (minX !== 0 || minY !== 0) {
                                parent.children.forEach(childId => {
                                    const child = s.elements[childId];
                                    if (child) {
                                        child.x -= minX;
                                        child.y -= minY;
                                    }
                                });
                            }

                            // Bubble up
                            parentId = parent.parentId;
                        }
                    }

                    this.emit('state-changed', this.state);
                }
                break;
                
            case 'UPDATE_VIEWPORT':
                this.state.editor.pan = payload.pan || this.state.editor.pan;
                this.state.editor.zoom = payload.zoom || this.state.editor.zoom;
                this.emit('viewport-changed', { pan: this.state.editor.pan, zoom: this.state.editor.zoom });
                break;

            case 'UPDATE_SELECTION':
                this.state.editor.selectedElementIds = payload; // Expecting array of IDs
                this.emit('state-changed', this.state);
                this.emit('selection-changed', this.state.editor.selectedElementIds);
                break;

            case 'ALIGN_ELEMENTS':
                const alignType = payload; // 'left', 'center', 'right', 'top', 'middle', 'bottom'
                const currentS = this.state.slides[this.state.editor.activeSlideId];
                const selectedIds = this.state.editor.selectedElementIds;
                
                if (!currentS || selectedIds.length === 0) return;

                // Determine bounds to align to
                let bounds = { x: 0, y: 0, width: currentS.width, height: currentS.height };
                
                if (selectedIds.length > 1) {
                    // Calculate selection bounds
                    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                    selectedIds.forEach(id => {
                        const el = currentS.elements[id];
                        if (el) {
                            minX = Math.min(minX, el.x);
                            minY = Math.min(minY, el.y);
                            maxX = Math.max(maxX, el.x + el.width);
                            maxY = Math.max(maxY, el.y + el.height);
                        }
                    });
                    bounds = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
                }

                selectedIds.forEach(id => {
                    const el = currentS.elements[id];
                    if (!el) return;

                    switch (alignType) {
                        case 'left':
                            el.x = bounds.x;
                            break;
                        case 'center':
                            el.x = bounds.x + (bounds.width - el.width) / 2;
                            break;
                        case 'right':
                            el.x = bounds.x + bounds.width - el.width;
                            break;
                        case 'top':
                            el.y = bounds.y;
                            break;
                        case 'middle':
                            el.y = bounds.y + (bounds.height - el.height) / 2;
                            break;
                        case 'bottom':
                            el.y = bounds.y + bounds.height - el.height;
                            break;
                    }
                });
                
                this.emit('state-changed', this.state);
                break;

            case 'DISTRIBUTE_ELEMENTS':
                const distType = payload; // 'horizontal', 'vertical'
                const sDist = this.state.slides[this.state.editor.activeSlideId];
                const selDistIds = this.state.editor.selectedElementIds;
                
                if (!sDist || selDistIds.length < 3) return; // Need at least 3 to distribute

                const elements = selDistIds.map(id => sDist.elements[id]).filter(e => e);
                
                if (distType === 'horizontal') {
                    // Sort by X
                    elements.sort((a, b) => a.x - b.x);
                    
                    const first = elements[0];
                    const last = elements[elements.length - 1];
                    
                    // Calculate total width of all elements except the last one
                    // Because x_last = x_first + w_first + gap + w_second + gap ...
                    // Actually, simpler: Total Span available for gaps = (last.x - first.x) - sum(widths of middle elements) - first.width?
                    // Let's use the formula: gap = (last.x - first.x - sum(widths of 0 to N-2)) / (N-1)
                    
                    let sumWidths = 0;
                    for (let i = 0; i < elements.length - 1; i++) {
                        sumWidths += elements[i].width;
                    }
                    
                    const totalGapSpace = last.x - first.x - sumWidths;
                    // Wait, if last.x is the left edge of the last element.
                    // Distance from first.left to last.left is (last.x - first.x).
                    // This distance is composed of: width[0] + gap + width[1] + gap ... + gap (N-1 gaps).
                    // So (last.x - first.x) = sum(width[0]...width[N-2]) + (N-1)*gap.
                    
                    const gap = (last.x - first.x - sumWidths) / (elements.length - 1);
                    
                    let currentX = first.x;
                    elements.forEach((el, i) => {
                        if (i === 0) return; // First stays
                        if (i === elements.length - 1) return; // Last stays (conceptually, though we could recalc to fix rounding)
                        
                        const prev = elements[i-1];
                        currentX += prev.width + gap;
                        el.x = currentX;
                    });
                    
                } else if (distType === 'vertical') {
                    // Sort by Y
                    elements.sort((a, b) => a.y - b.y);
                    
                    const first = elements[0];
                    const last = elements[elements.length - 1];
                    
                    let sumHeights = 0;
                    for (let i = 0; i < elements.length - 1; i++) {
                        sumHeights += elements[i].height;
                    }
                    
                    const gap = (last.y - first.y - sumHeights) / (elements.length - 1);
                    
                    let currentY = first.y;
                    elements.forEach((el, i) => {
                        if (i === 0) return;
                        if (i === elements.length - 1) return;
                        
                        const prev = elements[i-1];
                        currentY += prev.height + gap;
                        el.y = currentY;
                    });
                }
                
                this.emit('state-changed', this.state);
                break;
                
            case 'TOGGLE_THEME':
                this.state.theme = this.state.theme === 'light' ? 'dark' : 'light';
                this.emit('theme-change', this.state.theme);
                break;

            case 'GROUP_ELEMENTS':
                // TODO: Implement grouping
                break;

            case 'UPDATE_SLIDE':
                const slideToUpdate = this.state.slides[payload.id];
                if (slideToUpdate) {
                    // Check if layout is changing
                    if (payload.layoutId && payload.layoutId !== slideToUpdate.layoutId) {
                        this.remapContent(slideToUpdate, payload.layoutId);
                    }

                    // Merge updates
                    Object.assign(slideToUpdate, payload);
                    this.emit('state-changed', this.state);
                }
                break;

            case 'UPDATE_MASTER':
                const masters = this.state.masters;
                const masterToUpdate = masters[payload.id];

                if (masterToUpdate) {
                    Object.assign(masterToUpdate, payload);
                    this.emit('state-changed', this.state);
                }
                break;

            case 'INSTANTIATE_PLACEHOLDER':
                {
                    const { placeholderId, element } = payload;
                    const slide = this.getActiveContainer();
                    if (!slide) return;

                    // Create a copy of the placeholder element
                    const newEl = { ...element };
                    
                    // It keeps the same ID to override the master element
                    // We remove isPlaceholder so it becomes a normal element
                    delete newEl.isPlaceholder;

                    // Add to slide elements map
                    slide.elements[newEl.id] = newEl;
                    
                    // We do NOT add to elementOrder to preserve the Layout's z-index structure.
                    // The element will be rendered because it is in the Master's elementOrder,
                    // but the data will be pulled from the Slide's elements map (overriding the Master's).
                    
                    // Select it
                    this.state.editor.selectedElementIds = [newEl.id];
                    
                    // Auto-enter edit mode if it's text
                    if (newEl.type === 'text') {
                        this.state.editor.editingElementId = newEl.id;
                    }
                    
                    this.emit('state-changed', this.state);
                }
                break;
        }
    }

    /**
     * Helper to get the effective slide composition (merging Theme -> Layout -> Slide)
     * This is used by the renderer to know what to draw.
     * @param {string} slideId 
     */
    getEffectiveSlide(slideId) {
        const slide = this.state.slides[slideId];
        if (!slide) return null;

        // If no layout, return slide as is (legacy support)
        if (!slide.layoutId || !this.state.masters || !this.state.masters[slide.layoutId]) {
            return {
                ...slide,
                effectiveBackground: slide.background || { type: 'solid', value: '#ffffff' },
                effectiveElements: slide.elements,
                effectiveOrder: slide.elementOrder
            };
        }

        const layout = this.state.masters[slide.layoutId];
        const theme = this.state.masters[layout.parentId];

        // 1. Resolve Background
        let background = slide.background;
        if (!background && layout) background = layout.background;
        if (!background && theme) background = theme.background;
        if (!background) background = { type: 'solid', value: '#ffffff' };

        // 2. Resolve Elements
        // We need to merge elements but keep them distinct so we know which are locked
        // For rendering, we just need a flat list in correct Z-order
        
        const effectiveElements = {};
        const effectiveOrder = [];

        // Theme Elements (Bottom)
        if (theme && !layout.hideBackgroundGraphics && !slide.hideBackgroundGraphics) {
            theme.elementOrder.forEach(id => {
                effectiveElements[id] = { ...theme.elements[id], isLocked: true, source: 'theme' };
                effectiveOrder.push(id);
            });
        }

        // Layout Elements (Middle)
        if (layout && !slide.hideBackgroundGraphics) {
            layout.elementOrder.forEach(id => {
                effectiveElements[id] = { ...layout.elements[id], isLocked: true, source: 'layout' };
                effectiveOrder.push(id);
            });
        }

        // Slide Elements (Top)
        slide.elementOrder.forEach(id => {
            effectiveElements[id] = { ...slide.elements[id], source: 'slide' };
            effectiveOrder.push(id);
        });

        return {
            ...slide,
            effectiveBackground: background,
            effectiveElements,
            effectiveOrder
        };
    }

    getActiveContainer() {
        if (this.state.editor.mode === 'master') {
            return this.state.masters[this.state.editor.activeMasterId];
        } else {
            return this.state.slides[this.state.editor.activeSlideId];
        }
    }

    remapContent(slide, newLayoutId) {
        const state = this.state;
        const oldLayoutId = slide.layoutId;
        const oldLayout = state.masters[oldLayoutId];
        const newLayout = state.masters[newLayoutId];

        if (!oldLayout || !newLayout) return;

        // Find elements on the slide that are "instantiated placeholders"
        Object.keys(slide.elements).forEach(elId => {
            const slideEl = slide.elements[elId];
            const oldMasterEl = oldLayout.elements[elId];

            if (oldMasterEl && oldMasterEl.isPlaceholder) {
                // This element on the slide corresponds to a placeholder in the old layout
                
                // Check if the NEW layout has a placeholder with the same ID
                const newMasterEl = newLayout.elements[elId];
                
                if (newMasterEl && newMasterEl.isPlaceholder) {
                    // Match found!
                    // We want the slide element to inherit position/style from the NEW placeholder
                    // But keep the content.
                    
                    const keptProps = ['id', 'type', 'content'];
                    
                    // If it's an image, keep 'src'
                    if (slideEl.type === 'image') keptProps.push('src');
                    
                    // Create new object with only kept props
                    const newSlideEl = {};
                    keptProps.forEach(prop => {
                        if (slideEl[prop] !== undefined) newSlideEl[prop] = slideEl[prop];
                    });
                    
                    // Replace the element on the slide
                    slide.elements[elId] = newSlideEl;
                }
            }
        });
    }
}

export const store = new Store();
