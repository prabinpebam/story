export class HistoryManager {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
        this.maxSize = 50;
    }

    push(entry) {
        // entry: { undo: { type, payload }, redo: { type, payload } }
        this.undoStack.push(entry);
        if (this.undoStack.length > this.maxSize) {
            this.undoStack.shift();
        }
        this.redoStack = [];
    }

    undo() {
        return this.undoStack.pop();
    }

    redo() {
        return this.redoStack.pop();
    }

    addRedo(entry) {
        this.redoStack.push(entry);
    }

    addUndo(entry) {
        this.undoStack.push(entry);
    }
    
    canUndo() {
        return this.undoStack.length > 0;
    }

    canRedo() {
        return this.redoStack.length > 0;
    }
}

export const historyManager = new HistoryManager();
