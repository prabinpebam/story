export class HistoryManager {
    constructor(options = {}) {
        this.undoStack = [];
        this.redoStack = [];
        this.maxSize = options.maxSize || 50;
        this.isPaused = false;
        
        // Entry type handlers for custom undo/redo behavior
        this.entryHandlers = new Map();
        
        // Register default text-edit handler
        this.registerEntryHandler('text-edit', {
            apply: (entry, direction) => {
                // Return the content to restore based on direction
                return direction === 'undo' ? entry.before : entry.after;
            }
        });
    }

    /**
     * Register a custom handler for a specific entry type.
     * @param {string} type - Entry type (e.g., 'text-edit')
     * @param {Object} handler - Handler with apply(entry, direction) method
     */
    registerEntryHandler(type, handler) {
        this.entryHandlers.set(type, handler);
    }

    /**
     * Pause history recording. Use during text editing to let browser handle undo.
     * Multiple pause calls are safe - resume must be called same number of times.
     */
    pause() {
        this.isPaused = true;
    }

    /**
     * Resume history recording after text editing is complete.
     */
    resume() {
        this.isPaused = false;
    }

    /**
     * Check if history recording is currently paused.
     * @returns {boolean}
     */
    isPausedState() {
        return this.isPaused;
    }

    /**
     * Records a new state snapshot.
     * Call this BEFORE applying a new state that you want to be able to undo to.
     * @param {Object} state - The full state snapshot.
     * @param {Object} meta - Metadata (selection, viewport, etc).
     */
    push(state, meta = {}) {
        // Skip recording when paused (during text editing)
        if (this.isPaused) {
            return;
        }
        
        this.undoStack.push({ state, meta });
        
        // Enforce limit
        if (this.undoStack.length > this.maxSize) {
            this.undoStack.shift(); // Remove oldest
        }

        // Clear redo stack on new branch
        this.redoStack = [];
    }

    /**
     * Performs an undo operation.
     * @param {Object} currentState - The current state (to be pushed to redo).
     * @param {Object} currentMeta - The current metadata.
     * @returns {Object|null} The previous state/meta to restore, or null if empty.
     */
    undo(currentState, currentMeta = {}) {
        if (this.undoStack.length === 0) return null;

        const previous = this.undoStack.pop();
        
        // Save current state to redo stack
        this.redoStack.push({ 
            state: currentState, 
            meta: currentMeta 
        });

        return previous;
    }

    /**
     * Performs a redo operation.
     * @param {Object} currentState - The current state (to be pushed to undo).
     * @param {Object} currentMeta - The current metadata.
     * @returns {Object|null} The next state/meta to restore, or null if empty.
     */
    redo(currentState, currentMeta = {}) {
        if (this.redoStack.length === 0) return null;

        const next = this.redoStack.pop();

        // Save current state to undo stack
        this.undoStack.push({ 
            state: currentState, 
            meta: currentMeta 
        });

        return next;
    }

    canUndo() {
        return this.undoStack.length > 0;
    }

    canRedo() {
        return this.redoStack.length > 0;
    }
    
    clear() {
        this.undoStack = [];
        this.redoStack = [];
    }

    /**
     * Push a text-edit entry. Used when exiting text edit mode with changes.
     * Creates a single undoable entry for the entire text editing session.
     * @param {Object} entry - Text edit entry
     * @param {string} entry.elementId - ID of the edited element
     * @param {Object} entry.before - Content and styles before editing
     * @param {Object} entry.after - Content and styles after editing
     * @param {string} [entry.description] - Description for undo menu
     */
    pushTextEdit(entry) {
        const textEditEntry = {
            type: 'text-edit',
            elementId: entry.elementId,
            before: entry.before,
            after: entry.after,
            description: entry.description || 'Edit text',
            timestamp: Date.now()
        };

        this.undoStack.push({ 
            state: null, // No full state snapshot for text edits
            meta: textEditEntry 
        });
        
        // Enforce limit
        if (this.undoStack.length > this.maxSize) {
            this.undoStack.shift();
        }

        // Clear redo stack on new action
        this.redoStack = [];
    }

    /**
     * Check if an entry is a text-edit type.
     * @param {Object} entry - History entry
     * @returns {boolean}
     */
    isTextEditEntry(entry) {
        return entry?.meta?.type === 'text-edit';
    }

    /**
     * Get the handler for a specific entry type.
     * @param {string} type - Entry type
     * @returns {Object|null} Handler or null
     */
    getEntryHandler(type) {
        return this.entryHandlers.get(type) || null;
    }
}

export const historyManager = new HistoryManager();
