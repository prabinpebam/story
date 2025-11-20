import { EventEmitter } from './Events.js';

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
                mode: "edit", // 'edit', 'presentation'
                activeSlideId: "slide-1",
                selectedElementIds: [],
                editingElementId: null, // ID of element currently being edited (text)
                activeTool: "select", // 'select', 'text', 'rect', 'circle', 'hand'
                zoom: 1.0,
                pan: { x: 0, y: 0 },
                gridEnabled: true,
                snapToGrid: true
            },
            slides: {
                "slide-1": {
                    id: "slide-1",
                    title: "Introduction",
                    width: 1920,
                    height: 1080,
                    background: {
                        type: "solid",
                        value: "#ffffff"
                    },
                    elements: {}, // Map of ID -> Element
                    elementOrder: [], // Array of IDs (z-index)
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
            case 'SET_ACTIVE_SLIDE':
                if (this.state.slides[payload]) {
                    this.state.editor.activeSlideId = payload;
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
                    title: "New Slide",
                    width: 1920,
                    height: 1080,
                    background: { type: "solid", value: "#ffffff" },
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
                
                const { slideId: reorderSlideId, elementId, targetParentId, targetIndex } = payload;
                const slide = this.state.slides[reorderSlideId];
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
                const sLock = this.state.slides[this.state.editor.activeSlideId];
                if (sLock && sLock.elements[payload.id]) {
                    const el = sLock.elements[payload.id];
                    el.locked = !el.locked;
                    this.emit('state-changed', this.state);
                }
                break;

            case 'TOGGLE_ELEMENT_VISIBILITY':
                // Payload: { id }
                const sVis = this.state.slides[this.state.editor.activeSlideId];
                if (sVis && sVis.elements[payload.id]) {
                    const el = sVis.elements[payload.id];
                    el.hidden = !el.hidden;
                    this.emit('state-changed', this.state);
                }
                break;

            case 'REMOVE_ELEMENT':
                const rSlideId = this.state.editor.activeSlideId;
                const rSlide = this.state.slides[rSlideId];
                
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
                const dSlideId = this.state.editor.activeSlideId;
                const dSlide = this.state.slides[dSlideId];
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
                const activeSlideId = this.state.editor.activeSlideId;
                const activeSlide = this.state.slides[activeSlideId];
                if (activeSlide) {
                    activeSlide.elements[payload.id] = payload;
                    activeSlide.elementOrder.push(payload.id);
                    this.emit('state-changed', this.state);
                }
                break;

            case 'UPDATE_ELEMENT':
                const sId = this.state.editor.activeSlideId;
                const s = this.state.slides[sId];
                if (s && s.elements[payload.id]) {
                    const oldEl = s.elements[payload.id];
                    const newEl = { ...oldEl, ...payload };
                    s.elements[payload.id] = newEl;

                    // Check if we need to update parent group bounds
                    if (newEl.parentId) {
                        let parentId = newEl.parentId;
                        while (parentId) {
                            const parent = s.elements[parentId];
                            if (!parent || parent.type !== 'group') break;

                            // Recalculate group bounds based on all children
                            // Note: Children coordinates are relative to the group.
                            // If a child moves/resizes, the group's bounding box (which wraps children) might change.
                            // If the group's bounding box changes, its x/y/width/height changes.
                            // BUT, if x/y changes, the children's relative coordinates must shift to stay in place visually.
                            
                            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                            
                            if (parent.children && parent.children.length > 0) {
                                parent.children.forEach(childId => {
                                    const child = s.elements[childId];
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
                const gSlideId = this.state.editor.activeSlideId;
                const gSlide = this.state.slides[gSlideId];
                const idsToGroup = this.state.editor.selectedElementIds;
                
                if (idsToGroup.length < 2) return; // Need at least 2 items to group

                // 1. Calculate Bounding Box
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                idsToGroup.forEach(id => {
                    const el = gSlide.elements[id];
                    if (el) {
                        minX = Math.min(minX, el.x);
                        minY = Math.min(minY, el.y);
                        maxX = Math.max(maxX, el.x + el.width);
                        maxY = Math.max(maxY, el.y + el.height);
                    }
                });

                const groupX = minX;
                const groupY = minY;
                const groupW = maxX - minX;
                const groupH = maxY - minY;

                // 2. Create Group Element
                const groupId = `group-${Date.now()}`;
                const groupEl = {
                    id: groupId,
                    type: 'group',
                    x: groupX,
                    y: groupY,
                    width: groupW,
                    height: groupH,
                    rotation: 0,
                    children: [],
                    opacity: 1
                };

                // 3. Update Children (Make relative) & Remove from elementOrder
                // We need to preserve relative Z-order of children
                const sortedIds = idsToGroup.sort((a, b) => {
                    return gSlide.elementOrder.indexOf(a) - gSlide.elementOrder.indexOf(b);
                });

                sortedIds.forEach(id => {
                    const el = gSlide.elements[id];
                    // Convert to relative
                    el.x -= groupX;
                    el.y -= groupY;
                    el.parentId = groupId;
                    groupEl.children.push(id);
                    
                    // Remove from top-level order
                    const idx = gSlide.elementOrder.indexOf(id);
                    if (idx > -1) gSlide.elementOrder.splice(idx, 1);
                });

                // 4. Add Group to elements and elementOrder
                // Insert at the position of the topmost element that was grouped?
                // Or just on top? Figma puts it at the top of the selection stack.
                // Let's put it at the index where the *last* (topmost) selected item was.
                // But we already removed them.
                // Let's just push to end (top) for now, or try to be smart.
                // Being smart is hard because we mutated the array.
                // Simple: Push to end.
                gSlide.elements[groupId] = groupEl;
                gSlide.elementOrder.push(groupId);

                // 5. Update Selection
                this.state.editor.selectedElementIds = [groupId];
                this.emit('state-changed', this.state);
                break;

            case 'UNGROUP_ELEMENTS':
                const uSlideId = this.state.editor.activeSlideId;
                const uSlide = this.state.slides[uSlideId];
                const selectedGroups = this.state.editor.selectedElementIds.filter(id => {
                    return uSlide.elements[id] && uSlide.elements[id].type === 'group';
                });

                if (selectedGroups.length === 0) return;

                const newSelection = [];

                selectedGroups.forEach(gId => {
                    const group = uSlide.elements[gId];
                    const groupIndex = uSlide.elementOrder.indexOf(gId);
                    
                    // Remove group from order
                    uSlide.elementOrder.splice(groupIndex, 1);

                    // Process children
                    group.children.forEach((childId, index) => {
                        const child = uSlide.elements[childId];
                        // Convert to absolute
                        // Need to account for group rotation? (Not implementing group rotation yet for simplicity)
                        child.x += group.x;
                        child.y += group.y;
                        delete child.parentId;
                        
                        // Insert into elementOrder
                        uSlide.elementOrder.splice(groupIndex + index, 0, childId);
                        newSelection.push(childId);
                    });

                    // Remove group element
                    delete uSlide.elements[gId];
                });

                this.state.editor.selectedElementIds = newSelection;
                this.emit('state-changed', this.state);
                break;

            case 'UPDATE_SLIDE':
                const { id, ...updates } = payload;
                if (this.state.slides[id]) {
                    this.state.slides[id] = { ...this.state.slides[id], ...updates };
                    this.state.meta.modified = Date.now();
                    this.emit('state-changed', this.state);
                }
                break;

            default:
                console.warn(`Unknown action: ${type}`);
        }
    }
}

export const store = new Store();
