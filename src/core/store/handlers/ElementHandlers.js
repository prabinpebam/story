
function getActiveContainer(draft) {
    if (draft.editor.mode === 'master') {
        return draft.masters[draft.editor.activeMasterId];
    } else {
        return draft.slides[draft.editor.activeSlideId];
    }
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
        slide = draft.masters[reorderContainerId];
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

    const newEl = { ...element };
    
    delete newEl.isPlaceholder;

    slide.elements[newEl.id] = newEl;
    
    draft.editor.selectedElementIds = [newEl.id];
    
    if (newEl.type === 'text') {
        draft.editor.editingElementId = newEl.id;
    }
}
