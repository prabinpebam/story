export function handleSelectSlide(draft, payload) {
    const { id: selectSlideId, multi } = payload;
    if (multi) {
        const index = draft.editor.selectedSlideIds.indexOf(selectSlideId);
        if (index === -1) {
            draft.editor.selectedSlideIds.push(selectSlideId);
        } else {
            draft.editor.selectedSlideIds.splice(index, 1);
        }
    } else {
        draft.editor.selectedSlideIds = [selectSlideId];
    }
}

export function handleDeselectSlides(draft) {
    draft.editor.selectedSlideIds = [];
}

export function handleSetActiveSlide(draft, payload) {
    if (draft.slides[payload]) {
        draft.editor.activeSlideId = payload;
    }
}

export function handleSetActiveMaster(draft, payload) {
    if (draft.masters[payload]) {
        draft.editor.activeMasterId = payload;
    }
}

export function handleSetActiveTool(draft, payload) {
    // Payload can be:
    // - Simple string: 'select', 'text', 'rect', etc.
    // - Object with tool and options: { tool: 'placeholder', placeholderType: 'title' }
    if (typeof payload === 'object' && payload.tool) {
        draft.editor.activeTool = payload.tool;
        draft.editor.activeToolOptions = payload;
    } else {
        draft.editor.activeTool = payload;
        draft.editor.activeToolOptions = null;
    }
    
    if (draft.editor.activeTool !== 'select') {
        draft.editor.selectedElementIds = [];
        draft.editor.editingElementId = null;
    }
}

export function handleSetDragPlaceholder(draft, payload) {
    draft.editor.dragPlaceholderType = payload?.type || null;
}

export function handleSetMode(draft, payload) {
    draft.editor.mode = payload;
    
    if (payload === 'master' && !draft.editor.activeMasterId) {
        const firstMaster = Object.keys(draft.masters)[0];
        if (firstMaster) {
            draft.editor.activeMasterId = firstMaster;
        }
    }

    if (payload === 'presentation') {
        draft.presentation.isActive = true;
        draft.presentation.buildIndex = -1;
        draft.presentation.buildCount = 0;
        const currentIndex = draft.slideOrder.indexOf(draft.editor.activeSlideId);
        draft.presentation.currentSlideIndex = currentIndex !== -1 ? currentIndex : 0;
    } else {
        draft.presentation.isActive = false;
        draft.presentation.laserPointer = false;
        draft.presentation.blackScreen = false;
        draft.presentation.whiteScreen = false;
        draft.presentation.gridView = false;
    }
}

export function handleSetEditingElement(draft, payload) {
    // Payload can be just an id string, or an object { id, selectionType, clickPosition, isNewlyCreated }
    if (typeof payload === 'object' && payload !== null) {
        draft.editor.editingElementId = payload.id;
        draft.editor.editModeSelectionType = payload.selectionType || null;
        draft.editor.textEditClickPosition = payload.clickPosition || null;
        draft.editor.editModeIsNewlyCreated = payload.isNewlyCreated || false;
    } else {
        draft.editor.editingElementId = payload;
        draft.editor.editModeSelectionType = null;
        draft.editor.textEditClickPosition = null;
        draft.editor.editModeIsNewlyCreated = false;
    }
}

export function handleUpdateViewport(draft, payload) {
    draft.editor.pan = payload.pan || draft.editor.pan;
    draft.editor.zoom = payload.zoom || draft.editor.zoom;
}

export function handleUpdateSelection(draft, payload) {
    draft.editor.selectedElementIds = payload;
}

export function handleToggleTheme(draft) {
    draft.theme = draft.theme === 'light' ? 'dark' : 'light';
}

export function handleToggleConstrainProportions(draft, payload) {
    if (typeof payload === 'boolean') {
        draft.editor.constrainProportions = payload;
    } else {
        draft.editor.constrainProportions = !draft.editor.constrainProportions;
    }
}
