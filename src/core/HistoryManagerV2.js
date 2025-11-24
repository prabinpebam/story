export class HistoryManagerV2 {
    constructor(options = {}) {
        this.undoStack = [];
        this.redoStack = [];
        this.maxSize = options.maxSize || 50;
    }

    /**
     * Records a new state snapshot.
     * Call this BEFORE applying a new state that you want to be able to undo to.
     * @param {Object} state - The full state snapshot.
     * @param {Object} meta - Metadata (selection, viewport, etc).
     */
    push(state, meta = {}) {
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
}

export const historyManagerV2 = new HistoryManagerV2();
