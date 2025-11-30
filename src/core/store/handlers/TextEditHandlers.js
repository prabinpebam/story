/**
 * Text Edit Handlers
 * 
 * Store action handlers for text editing state management.
 * 
 * @see documentation/tech-specs/core/text-editing/10-store-handlers.md
 */

/**
 * Handle entering text edit mode.
 * @param {Object} draft - Immer draft state
 * @param {Object} payload
 * @param {string} payload.elementId - ID of element being edited
 */
export function handleEnterTextEdit(draft, payload) {
    draft.editor.textEdit = {
        isEditing: true,
        elementId: payload.elementId,
        isDirty: false,
        initialContent: null // Set by TextEditManager
    };
    
    // Also update legacy editingElementId for compatibility
    draft.editor.editingElementId = payload.elementId;
}

/**
 * Handle exiting text edit mode.
 * @param {Object} draft - Immer draft state
 * @param {Object} payload
 * @param {boolean} payload.keepSelection - Keep element selected after exit
 */
export function handleExitTextEdit(draft, payload) {
    draft.editor.textEdit = {
        isEditing: false,
        elementId: null,
        isDirty: false,
        initialContent: null
    };
    
    // Clear legacy editingElementId
    draft.editor.editingElementId = null;
    
    // Optionally clear selection
    if (!payload?.keepSelection) {
        draft.editor.selectedElementIds = [];
    }
}

/**
 * Handle saving text content.
 * @param {Object} draft - Immer draft state
 * @param {Object} payload
 * @param {string} payload.elementId - ID of element
 * @param {string} payload.content - New content
 * @param {boolean} payload.hasUserContent - Whether element has user content
 */
export function handleSaveTextContent(draft, payload) {
    const { elementId, content, hasUserContent } = payload;
    
    // Determine which container has the element (slides or masters)
    const mode = draft.editor.mode;
    const activeId = mode === 'master' ? draft.editor.activeMasterId : draft.editor.activeSlideId;
    const container = mode === 'master' ? draft.masters[activeId] : draft.slides[activeId];
    
    if (container && container.elements && container.elements[elementId]) {
        container.elements[elementId].content = content;
        
        // Update hasUserContent flag for placeholders
        if (typeof hasUserContent === 'boolean') {
            container.elements[elementId].hasUserContent = hasUserContent;
        }
        
        // Update modified timestamp
        draft.meta.modified = Date.now();
    }
    
    // Clear dirty flag
    if (draft.editor.textEdit) {
        draft.editor.textEdit.isDirty = false;
    }
}

/**
 * Handle marking text as dirty (changed).
 * @param {Object} draft - Immer draft state
 * @param {Object} payload
 * @param {string} payload.elementId - ID of element
 */
export function handleMarkTextDirty(draft, payload) {
    if (draft.editor.textEdit && draft.editor.textEdit.elementId === payload.elementId) {
        draft.editor.textEdit.isDirty = true;
    }
}

/**
 * Initialize text edit state in editor.
 * Called during state creation.
 * @param {Object} editor - Editor state object
 */
export function initTextEditState(editor) {
    editor.textEdit = {
        isEditing: false,
        elementId: null,
        isDirty: false,
        initialContent: null
    };
}
