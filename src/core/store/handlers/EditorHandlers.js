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
        // Switching slides must not keep stale selection/deep-edit targets.
        draft.editor.selectedElementIds = [];
        draft.editor.editingElementId = null;
        draft.editor.deepEdit = null;
        draft.editor.deepEditStack = [];
    }
}

export function handleSetActiveMaster(draft, payload) {
    if (draft.slideMasterPresets[payload]) {
        draft.editor.activeMasterId = payload;
        // Switching masters must not keep stale selection/deep-edit targets.
        draft.editor.selectedElementIds = [];
        draft.editor.editingElementId = null;
        draft.editor.deepEdit = null;
        draft.editor.deepEditStack = [];
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
        draft.editor.deepEdit = null;
        draft.editor.deepEditStack = [];
    }
}

export function handleSetDragPlaceholder(draft, payload) {
    draft.editor.dragPlaceholderType = payload?.type || null;
}

const AUTHORING_VIEWS = new Set(['Canvas', 'Grid', 'Outline', 'Notes', 'System']);
const EDIT_SCOPES = new Set(['Slide', 'Master', 'Layout', 'Component', 'Narrative component', 'Edition']);
const RUNTIME_MODES = new Set(['Preview', 'Rehearsal', 'Recording', 'Presentation', 'Kiosk']);
const SURFACE_ROLES = new Set(['Editor', 'Audience', 'Presenter', 'Recorder controller', 'Remote controller', 'Observer']);
const PLACEMENTS = new Set(['Fullscreen', 'Windowed', 'Embedded preview', 'External display']);

function ensureContext(draft) {
    draft.context ??= {
        productSpace: 'Authoring',
        view: 'Canvas',
        editScope: draft.editor.mode === 'master' ? 'Master' : 'Slide',
        runtimeMode: null,
        surfaceRole: 'Editor',
        placement: null,
        editScopeStack: [],
        authoringSnapshot: null
    };
    draft.context.editScopeStack ??= [];
}

export function handleSetView(draft, payload) {
    ensureContext(draft);
    if (!AUTHORING_VIEWS.has(payload)) return;
    draft.context.view = payload;
}

export function handleSetEditScope(draft, payload) {
    ensureContext(draft);
    if (draft.context.runtimeMode !== null || !EDIT_SCOPES.has(payload)) return;
    const activeSource = draft.slideMasterPresets[draft.editor.activeMasterId];
    if (payload === 'Master' && activeSource?.type === 'layoutMaster' && activeSource.parentMasterId) {
        draft.editor.activeMasterId = activeSource.parentMasterId;
    }
    if (payload === 'Layout' && activeSource?.type !== 'layoutMaster') {
        const activeSlideLayoutId = draft.slides[draft.editor.activeSlideId]?.layoutId;
        const activeSlideLayout = draft.slideMasterPresets[activeSlideLayoutId];
        const firstLayoutId = activeSource?.layoutIds?.find((id) => draft.slideMasterPresets[id]?.type === 'layoutMaster');
        const activeSlideLayoutBelongsToSource = activeSlideLayout?.type === 'layoutMaster'
            && activeSlideLayout.parentMasterId === activeSource?.id;
        draft.editor.activeMasterId = firstLayoutId
            ?? (activeSlideLayoutBelongsToSource ? activeSlideLayoutId : draft.editor.activeMasterId);
    }
    draft.context.editScope = payload;
    draft.editor.mode = payload === 'Master' || payload === 'Layout' ? 'master' : 'edit';
}

export function handleEnterEditScope(draft, payload = {}) {
    ensureContext(draft);
    const scope = payload.scope;
    const sourceId = payload.sourceId;
    const source = sourceId ? draft.slideMasterPresets[sourceId] ?? draft.slides[sourceId] : null;
    if (draft.context.runtimeMode !== null || !EDIT_SCOPES.has(scope)) return;
    if (scope === 'Master' && source?.type !== 'slideMasterPreset') return;
    if (scope === 'Layout' && source?.type !== 'layoutMaster') return;
    if (scope === 'Slide' && !draft.slides[sourceId]) return;

    draft.context.editScopeStack.push({
        view: draft.context.view,
        editScope: draft.context.editScope,
        activeSlideId: draft.editor.activeSlideId,
        activeMasterId: draft.editor.activeMasterId,
        selectedSlideIds: [...draft.editor.selectedSlideIds],
        selectedElementIds: [...draft.editor.selectedElementIds],
        editingElementId: draft.editor.editingElementId,
        deepEdit: draft.editor.deepEdit,
        deepEditStack: [...draft.editor.deepEditStack],
        activeTool: draft.editor.activeTool,
        activeToolOptions: draft.editor.activeToolOptions ? { ...draft.editor.activeToolOptions } : null,
        zoom: draft.editor.zoom,
        pan: { ...draft.editor.pan }
    });

    if (scope === 'Master' || scope === 'Layout') draft.editor.activeMasterId = sourceId;
    if (scope === 'Slide') draft.editor.activeSlideId = sourceId;
    if (AUTHORING_VIEWS.has(payload.view)) draft.context.view = payload.view;
    draft.context.editScope = scope;
    draft.editor.mode = scope === 'Master' || scope === 'Layout' ? 'master' : 'edit';
    draft.editor.selectedElementIds = [];
    draft.editor.editingElementId = null;
    draft.editor.deepEdit = null;
    draft.editor.deepEditStack = [];
}

export function handleExitEditScope(draft) {
    ensureContext(draft);
    if (draft.context.runtimeMode !== null) return;
    const snapshot = draft.context.editScopeStack.pop();
    if (!snapshot) return;
    draft.context.view = snapshot.view;
    draft.context.editScope = snapshot.editScope;
    draft.editor.activeSlideId = snapshot.activeSlideId;
    draft.editor.activeMasterId = snapshot.activeMasterId;
    draft.editor.selectedSlideIds = [...snapshot.selectedSlideIds];
    draft.editor.selectedElementIds = [...snapshot.selectedElementIds];
    draft.editor.editingElementId = snapshot.editingElementId;
    draft.editor.deepEdit = snapshot.deepEdit;
    draft.editor.deepEditStack = [...snapshot.deepEditStack];
    draft.editor.activeTool = snapshot.activeTool;
    draft.editor.activeToolOptions = snapshot.activeToolOptions ? { ...snapshot.activeToolOptions } : null;
    draft.editor.zoom = snapshot.zoom;
    draft.editor.pan = { ...snapshot.pan };
    draft.editor.mode = snapshot.editScope === 'Master' || snapshot.editScope === 'Layout' ? 'master' : 'edit';
}

export function handleEnterRuntime(draft, payload = {}) {
    ensureContext(draft);
    const runtimeMode = payload.mode ?? 'Presentation';
    const surfaceRole = payload.surfaceRole ?? 'Audience';
    const placement = payload.placement ?? 'Fullscreen';
    if (!RUNTIME_MODES.has(runtimeMode) || !SURFACE_ROLES.has(surfaceRole) || !PLACEMENTS.has(placement)) return;

    if (draft.context.runtimeMode === null) {
        draft.context.authoringSnapshot = {
            view: draft.context.view,
            editScope: draft.context.editScope,
            activeSlideId: draft.editor.activeSlideId,
            selectedSlideIds: [...draft.editor.selectedSlideIds],
            selectedElementIds: [...draft.editor.selectedElementIds],
            activeTool: draft.editor.activeTool,
            activeToolOptions: draft.editor.activeToolOptions ? { ...draft.editor.activeToolOptions } : null,
            zoom: draft.editor.zoom,
            pan: { ...draft.editor.pan }
        };
    }
    draft.editor.selectedElementIds = [];
    draft.editor.editingElementId = null;
    draft.editor.deepEdit = null;
    draft.editor.deepEditStack = [];
    draft.context.productSpace = 'Runtime';
    draft.context.runtimeMode = runtimeMode;
    draft.context.surfaceRole = surfaceRole;
    draft.context.placement = placement;
    draft.editor.mode = 'presentation';
    draft.presentation.isActive = true;
    draft.presentation.buildIndex = -1;
    draft.presentation.buildCount = 0;
    const currentIndex = draft.slideOrder.indexOf(draft.editor.activeSlideId);
    draft.presentation.currentSlideIndex = currentIndex !== -1 ? currentIndex : 0;
}

export function handleExitRuntime(draft) {
    ensureContext(draft);
    const snapshot = draft.context.authoringSnapshot;
    if (snapshot) {
        draft.context.view = snapshot.view;
        draft.context.editScope = snapshot.editScope;
        draft.editor.activeSlideId = snapshot.activeSlideId;
        draft.editor.selectedSlideIds = [...snapshot.selectedSlideIds];
        draft.editor.selectedElementIds = [...snapshot.selectedElementIds];
        draft.editor.activeTool = snapshot.activeTool;
        draft.editor.activeToolOptions = snapshot.activeToolOptions ? { ...snapshot.activeToolOptions } : null;
        draft.editor.zoom = snapshot.zoom;
        draft.editor.pan = { ...snapshot.pan };
    }
    draft.context.productSpace = 'Authoring';
    draft.context.runtimeMode = null;
    draft.context.surfaceRole = 'Editor';
    draft.context.placement = null;
    draft.context.authoringSnapshot = null;
    draft.editor.mode = draft.context.editScope === 'Master' || draft.context.editScope === 'Layout' ? 'master' : 'edit';
    draft.presentation.isActive = false;
    if (draft.presentation.kiosk) draft.presentation.kiosk.enabled = false;
    draft.presentation.laserPointer = false;
    draft.presentation.blackScreen = false;
    draft.presentation.whiteScreen = false;
    draft.presentation.gridView = false;
}

export function handleSetMode(draft, payload) {
    if (payload === 'master' && !draft.editor.activeMasterId) {
        const firstMaster = Object.keys(draft.slideMasterPresets)[0];
        if (firstMaster) {
            draft.editor.activeMasterId = firstMaster;
        }
    }

    if (payload === 'presentation') {
        handleEnterRuntime(draft, {
            mode: 'Presentation',
            surfaceRole: 'Audience',
            placement: draft.presentation.requestFullscreen === false ? 'Windowed' : 'Fullscreen'
        });
    } else if (payload === 'master') {
        draft.editor.selectedElementIds = [];
        draft.editor.editingElementId = null;
        draft.editor.deepEdit = null;
        draft.editor.deepEditStack = [];
        handleSetEditScope(draft, 'Master');
    } else {
        const wasInRuntime = draft.context?.runtimeMode != null || draft.editor.mode === 'presentation';
        handleExitRuntime(draft);
        if (!wasInRuntime) {
            draft.editor.selectedElementIds = [];
            draft.editor.editingElementId = null;
            draft.editor.deepEdit = null;
            draft.editor.deepEditStack = [];
            handleSetEditScope(draft, 'Slide');
        }
    }
}

export function handleSetEditingElement(draft, payload) {
    // Payload can be just an id string, or an object { id, selectionType, clickPosition, isNewlyCreated, initialChar }
    if (typeof payload === 'object' && payload !== null) {
        draft.editor.editingElementId = payload.id;
        draft.editor.editModeSelectionType = payload.selectionType || null;
        draft.editor.textEditClickPosition = payload.clickPosition || null;
        draft.editor.editModeIsNewlyCreated = payload.isNewlyCreated || false;
        draft.editor.editModeInitialChar = payload.initialChar || null;
    } else {
        draft.editor.editingElementId = payload;
        draft.editor.editModeSelectionType = null;
        draft.editor.textEditClickPosition = null;
        draft.editor.editModeIsNewlyCreated = false;
        draft.editor.editModeInitialChar = null;
    }
}

export function handleSetDeepEdit(draft, payload) {
    // Payload is either null (exit deep edit) or an object describing deep edit mode.
    // Example: { kind: 'vector', elementId: '...', selection: {...} }
    draft.editor.deepEdit = payload || null;
    draft.editor.deepEditStack = payload ? [payload] : [];
}

export function handleSetDeepEditStack(draft, payload) {
    const stack = Array.isArray(payload) ? payload.filter(Boolean) : [];
    draft.editor.deepEditStack = stack;
    draft.editor.deepEdit = stack.length > 0 ? stack[stack.length - 1] : null;
}

export function handlePushDeepEdit(draft, payload) {
    if (!payload) return;
    const stack = Array.isArray(draft.editor.deepEditStack) ? [...draft.editor.deepEditStack] : [];
    stack.push(payload);
    draft.editor.deepEditStack = stack;
    draft.editor.deepEdit = payload;
}

export function handlePopDeepEdit(draft) {
    const stack = Array.isArray(draft.editor.deepEditStack) ? [...draft.editor.deepEditStack] : [];
    stack.pop();
    draft.editor.deepEditStack = stack;
    draft.editor.deepEdit = stack.length > 0 ? stack[stack.length - 1] : null;
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

export function handleToggleLayoutGuides(draft) {
    draft.editor.showLayoutGuides = !draft.editor.showLayoutGuides;
}

export function handleToggleSnapToObject(draft) {
    draft.editor.snapToObject = !draft.editor.snapToObject;
}

export function handleToggleSnapToSlide(draft) {
    draft.editor.snapToSlide = !draft.editor.snapToSlide;
}

export function handleToggleSnapToColumns(draft) {
    draft.editor.snapToColumns = !draft.editor.snapToColumns;
}
