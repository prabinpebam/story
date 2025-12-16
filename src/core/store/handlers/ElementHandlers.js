
function getActiveContainer(draft) {
    if (draft.editor.mode === 'master') {
        return draft.slideMasterPresets[draft.editor.activeMasterId];
    } else {
        return draft.slides[draft.editor.activeSlideId];
    }
}

function isPlainObject(v) {
    return !!v && typeof v === 'object' && !Array.isArray(v);
}

function getShapeKindSafe(el) {
    // Avoid importing ShapeElementAdapter here to keep handler lightweight.
    if (!el || typeof el !== 'object') return null;
    if (el.type === 'shape' && typeof el.shapeKind === 'string') return el.shapeKind;
    if (el.type === 'rect' || el.type === 'rectangle') return 'rectangle';
    if (el.type === 'circle' || el.type === 'ellipse') return 'ellipse';
    if (el.type === 'line') return 'line';
    if (el.type === 'vector') return 'vector';
    if (el.type === 'shape' && typeof el.shape === 'string') return el.shape;
    return null;
}

function getElementBounds(el) {
    const x = Number(el?.x) || 0;
    const y = Number(el?.y) || 0;
    const w = Math.max(0, Number(el?.width) || 0);
    const h = Math.max(0, Number(el?.height) || 0);
    return { x, y, w, h };
}

function computeUnionBounds(elements) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const el of elements) {
        const b = getElementBounds(el);
        minX = Math.min(minX, b.x);
        minY = Math.min(minY, b.y);
        maxX = Math.max(maxX, b.x + b.w);
        maxY = Math.max(maxY, b.y + b.h);
    }
    if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
        return { x: 0, y: 0, w: 0, h: 0 };
    }
    return { x: minX, y: minY, w: Math.max(0, maxX - minX), h: Math.max(0, maxY - minY) };
}

function generateElementId(container, prefix) {
    if (!container || !container.elements) {
        return `${prefix}-1`;
    }

    // Deterministic, collision-free within the active container.
    // Example: shape-boolean-1, shape-boolean-2, ...
    let i = 1;
    while (container.elements[`${prefix}-${i}`]) i++;
    return `${prefix}-${i}`;
}

export function handleCreateBooleanFromSelection(draft, payload) {
    const container = getActiveContainer(draft);
    if (!container) return;

    const selection = Array.isArray(payload?.ids) ? payload.ids : draft.editor.selectedElementIds;
    if (!Array.isArray(selection) || selection.length < 2) return;

    const operation = payload?.operation || 'union';
    if (!['union', 'subtract', 'intersect', 'exclude'].includes(operation)) return;

    const operandIds = selection.filter((id) => typeof id === 'string' && container.elements[id]);
    if (operandIds.length < 2) return;

    // Disallow selecting other composition nodes as operands for v1.
    const operandEls = operandIds
        .map((id) => container.elements[id])
        .filter(Boolean)
        .filter((el) => {
            const k = getShapeKindSafe(el);
            return !!k && k !== 'boolean' && k !== 'mask';
        });
    if (operandEls.length < 2) return;

    const bounds = computeUnionBounds(operandEls);
    const first = operandEls[0];

    const id = payload?.id || generateElementId(container, 'shape-boolean');
    const booleanEl = {
        id,
        type: 'shape',
        shapeKind: 'boolean',
        x: bounds.x,
        y: bounds.y,
        width: bounds.w,
        height: bounds.h,
        rotation: 0,
        operation,
        operands: operandEls.map((el) => el.id),
        style: isPlainObject(first?.style) ? JSON.parse(JSON.stringify(first.style)) : { fills: [{ type: 'solid', value: '#000000', opacity: 100, visible: true }] }
    };

    container.elements[id] = booleanEl;
    container.elementOrder.push(id);
    draft.editor.selectedElementIds = [id];
}

export function handleSetBooleanOperation(draft, payload) {
    const container = getActiveContainer(draft);
    if (!container) return;
    const id = payload?.id;
    const operation = payload?.operation;
    if (typeof id !== 'string' || !container.elements[id]) return;
    if (!['union', 'subtract', 'intersect', 'exclude'].includes(operation)) return;
    const el = container.elements[id];
    const k = getShapeKindSafe(el);
    if (k !== 'boolean') return;
    el.operation = operation;
}

export function handleCreateMaskFromSelection(draft, payload) {
    const container = getActiveContainer(draft);
    if (!container) return;

    const selection = Array.isArray(payload?.ids) ? payload.ids : draft.editor.selectedElementIds;
    if (!Array.isArray(selection) || selection.length < 2) return;

    // Determine mask shape: topmost element among selection by current stacking.
    const order = Array.isArray(container.elementOrder) ? container.elementOrder : [];
    const selectionIds = selection.filter((id) => typeof id === 'string' && container.elements[id]);
    if (selectionIds.length < 2) return;

    const z = (id) => {
        const idx = order.indexOf(id);
        return idx === -1 ? -Infinity : idx;
    };
    const maskShapeId = payload?.maskShapeId && container.elements[payload.maskShapeId]
        ? payload.maskShapeId
        : selectionIds.reduce((best, id) => (z(id) > z(best) ? id : best), selectionIds[0]);

    const contentIds = payload?.contentIds
        ? payload.contentIds.filter((id) => typeof id === 'string' && container.elements[id] && id !== maskShapeId)
        : selectionIds.filter((id) => id !== maskShapeId);
    if (contentIds.length === 0) return;

    const id = payload?.id || generateElementId(container, 'shape-mask');
    const maskEl = {
        id,
        type: 'shape',
        shapeKind: 'mask',
        // Position/size: use mask shape bounds so selection handles have a sane default.
        x: Number(container.elements[maskShapeId]?.x) || 0,
        y: Number(container.elements[maskShapeId]?.y) || 0,
        width: Number(container.elements[maskShapeId]?.width) || 0,
        height: Number(container.elements[maskShapeId]?.height) || 0,
        rotation: 0,
        maskShapeId,
        contentIds,
        mode: payload?.mode === 'alpha' ? 'alpha' : 'clip',
        invert: payload?.invert === true
    };

    container.elements[id] = maskEl;
    container.elementOrder.push(id);
    draft.editor.selectedElementIds = [id];
}

export function handleSetMaskInvert(draft, payload) {
    const container = getActiveContainer(draft);
    if (!container) return;
    const id = payload?.id;
    const invert = payload?.invert;
    if (typeof id !== 'string' || !container.elements[id]) return;
    if (typeof invert !== 'boolean') return;
    const el = container.elements[id];
    const k = getShapeKindSafe(el);
    if (k !== 'mask') return;
    el.invert = invert;
}

export function handleAddElement(draft, payload) {
    const addContainer = getActiveContainer(draft);

    if (addContainer) {
        addContainer.elements[payload.id] = payload;
        addContainer.elementOrder.push(payload.id);
    }
}

export function handleUpdateElement(draft, payload) {
    const container = getActiveContainer(draft);

    if (container && container.elements[payload.id]) {
        const oldEl = container.elements[payload.id];
        const newEl = { ...oldEl, ...payload };
        container.elements[payload.id] = newEl;

        if (newEl.parentId) {
            let parentId = newEl.parentId;
            while (parentId) {
                const parent = container.elements[parentId];
                if (!parent || parent.type !== 'group') break;

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
                    minX = 0; minY = 0; maxX = 100; maxY = 100;
                }

                const newGroupX = parent.x + minX;
                const newGroupY = parent.y + minY;
                const newGroupW = maxX - minX;
                const newGroupH = maxY - minY;

                parent.x = newGroupX;
                parent.y = newGroupY;
                parent.width = newGroupW;
                parent.height = newGroupH;

                if (minX !== 0 || minY !== 0) {
                    parent.children.forEach(childId => {
                        const child = container.elements[childId];
                        if (child) {
                            child.x -= minX;
                            child.y -= minY;
                        }
                    });
                }

                parentId = parent.parentId;
            }
        }
    }
}


export function handleRemoveElement(draft, payload) {
    const rSlide = getActiveContainer(draft);
    
    if (!rSlide) return;
    
    const idsToDelete = Array.isArray(payload) ? payload : [payload];
    const allIdsToDelete = new Set();
    
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

        if (el.parentId) {
            const parent = rSlide.elements[el.parentId];
            if (parent && parent.children) {
                parent.children = parent.children.filter(cid => cid !== id);
            }
        }

        rSlide.elementOrder = rSlide.elementOrder.filter(eid => eid !== id);
        
        delete rSlide.elements[id];
    });
    
    draft.editor.selectedElementIds = draft.editor.selectedElementIds.filter(id => !allIdsToDelete.has(id));
}

export function handleDuplicateElements(draft, payload) {
    const dSlide = getActiveContainer(draft);
    
    if (!dSlide) return;

    const idsToDuplicate = payload.ids || draft.editor.selectedElementIds;
    const offset = payload.offset || false;

    const newSelectedIds = [];
    
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
        
        if (offset && !parentId) {
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

    draft.editor.selectedElementIds = newSelectedIds;
}

export function handlePasteElements(draft, payload) {
    const pContainer = getActiveContainer(draft);
    if (!pContainer || !payload.elements || payload.elements.length === 0) return;

    const pastedIds = [];
    payload.elements.forEach(el => {
        const newId = `${el.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newEl = { ...el, id: newId };
        
        newEl.x += 20;
        newEl.y += 20;
        
        delete newEl.parentId; 

        pContainer.elements[newId] = newEl;
        pContainer.elementOrder.push(newId);
        pastedIds.push(newId);
    });

    draft.editor.selectedElementIds = pastedIds;
}

export function handleReorderElements(draft, payload) {
    const { slideId: reorderContainerId, elementId, targetParentId, targetIndex } = payload;
    
    let slide = draft.slides[reorderContainerId];
    if (!slide) {
        slide = draft.slideMasterPresets[reorderContainerId];
    }
    
    if (!slide) return;

    const element = slide.elements[elementId];
    if (!element) return;

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

    if (targetParentId) {
        const newParent = slide.elements[targetParentId];
        if (newParent) {
            if (!newParent.children) newParent.children = [];
            const safeIndex = Math.max(0, Math.min(targetIndex, newParent.children.length));
            newParent.children.splice(safeIndex, 0, elementId);
            element.parentId = targetParentId;
        }
    } else {
        const safeIndex = Math.max(0, Math.min(targetIndex, slide.elementOrder.length));
        slide.elementOrder.splice(safeIndex, 0, elementId);
        element.parentId = null;
    }
}

export function handleAlignElements(draft, payload) {
    const alignType = payload;
    const currentS = draft.slides[draft.editor.activeSlideId];
    const selectedIds = draft.editor.selectedElementIds;
    
    if (!currentS || selectedIds.length === 0) return;

    let bounds = { x: 0, y: 0, width: currentS.width, height: currentS.height };
    
    if (selectedIds.length > 1) {
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
}

export function handleDistributeElements(draft, payload) {
    const distType = payload;
    const sDist = draft.slides[draft.editor.activeSlideId];
    const selDistIds = draft.editor.selectedElementIds;
    
    if (!sDist || selDistIds.length < 3) return;

    const elements = selDistIds.map(id => sDist.elements[id]).filter(e => e);
    
    if (distType === 'horizontal') {
        elements.sort((a, b) => a.x - b.x);
        
        const first = elements[0];
        const last = elements[elements.length - 1];
        
        let sumWidths = 0;
        for (let i = 0; i < elements.length - 1; i++) {
            sumWidths += elements[i].width;
        }
        
        const gap = (last.x - first.x - sumWidths) / (elements.length - 1);
        
        let currentX = first.x;
        elements.forEach((el, i) => {
            if (i === 0) return;
            if (i === elements.length - 1) return;
            
            const prev = elements[i-1];
            currentX += prev.width + gap;
            el.x = currentX;
        });
        
    } else if (distType === 'vertical') {
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
}

export function handleToggleElementLock(draft, payload) {
    const sLock = getActiveContainer(draft);

    if (sLock && sLock.elements[payload.id]) {
        const el = sLock.elements[payload.id];
        el.locked = !el.locked;
    }
}

export function handleToggleElementVisibility(draft, payload) {
    const sVis = getActiveContainer(draft);

    if (sVis && sVis.elements[payload.id]) {
        const el = sVis.elements[payload.id];
        el.hidden = !el.hidden;
    }
}

export function handleGroupElements(draft) {
    // TODO: Implement grouping
}

export function handleInstantiatePlaceholder(draft, payload) {
    const { placeholderId, element } = payload;
    const slide = getActiveContainer(draft);
    if (!slide) return;

    // Copy the placeholder element to the slide (keep isPlaceholder for proper handling)
    const newEl = { ...element };
    
    // Ensure it's in slide.elements
    slide.elements[newEl.id] = newEl;
    
    // Add to elementOrder if not present
    if (!slide.elementOrder) {
        slide.elementOrder = [];
    }
    if (!slide.elementOrder.includes(newEl.id)) {
        slide.elementOrder.push(newEl.id);
    }
    
    // Just select the element - don't enter edit mode
    // User needs to double-click or press Enter to edit
    draft.editor.selectedElementIds = [newEl.id];
}
