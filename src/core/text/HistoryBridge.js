/**
 * HistoryBridge
 * 
 * Bridges text editing with the application's undo/redo system.
 * Implements edit mode isolation strategy.
 * 
 * @see documentation/tech-specs/core/text-editing/06-history-bridge.md
 */

import { historyManager } from '../HistoryManager.js';

export class HistoryBridge {
    constructor() {
        this.currentSession = null;
    }

    /**
     * Begin a text editing session.
     * Pauses HistoryManager and captures initial state.
     * @param {string} elementId - ID of the element being edited
     * @param {Object} initialState - Initial content and styles
     * @param {string} initialState.content - HTML content before edit
     * @param {Object} [initialState.inlineStyles] - Inline styles before edit
     */
    beginSession(elementId, initialState) {
        // End any existing session first
        if (this.currentSession) {
            console.warn('HistoryBridge: Beginning new session while one is active');
            this.endSession(false);
        }

        // Pause history recording
        historyManager.pause();

        // Store session data
        this.currentSession = {
            elementId,
            startTime: Date.now(),
            before: {
                content: initialState.content || '',
                inlineStyles: initialState.inlineStyles || {}
            },
            isDirty: false
        };
    }

    /**
     * Mark the current session as dirty (content changed).
     */
    markDirty() {
        if (this.currentSession) {
            this.currentSession.isDirty = true;
        }
    }

    /**
     * Check if there's an active editing session.
     * @returns {boolean}
     */
    isInSession() {
        return this.currentSession !== null;
    }

    /**
     * Get the current session's element ID.
     * @returns {string|null}
     */
    getSessionElementId() {
        return this.currentSession?.elementId || null;
    }

    /**
     * End the text editing session.
     * Resumes HistoryManager and optionally pushes a history entry.
     * @param {boolean} save - Whether to save changes (false to discard)
     * @param {Object} [finalState] - Final content and styles (required if save=true and dirty)
     * @param {string} [finalState.content] - HTML content after edit
     * @param {Object} [finalState.inlineStyles] - Inline styles after edit
     * @returns {boolean} True if changes were saved to history
     */
    endSession(save = true, finalState = null) {
        if (!this.currentSession) {
            return false;
        }

        const session = this.currentSession;
        this.currentSession = null;

        // Resume history recording
        historyManager.resume();

        // Check if we should create a history entry
        if (!save || !session.isDirty) {
            return false;
        }

        if (!finalState) {
            console.warn('HistoryBridge: No final state provided for dirty session');
            return false;
        }

        // Compare before/after to confirm actual change
        const hasContentChange = session.before.content !== finalState.content;
        const hasStyleChange = JSON.stringify(session.before.inlineStyles) !== 
                               JSON.stringify(finalState.inlineStyles || {});

        if (!hasContentChange && !hasStyleChange) {
            // No actual change, don't create history entry
            return false;
        }

        // Push text edit entry to history
        historyManager.pushTextEdit({
            elementId: session.elementId,
            before: session.before,
            after: {
                content: finalState.content || '',
                inlineStyles: finalState.inlineStyles || {}
            },
            description: 'Edit text'
        });

        return true;
    }

    /**
     * Cancel the current session and discard changes.
     * @returns {Object|null} The original state to restore, or null
     */
    cancelSession() {
        if (!this.currentSession) {
            return null;
        }

        const beforeState = { ...this.currentSession.before };
        this.endSession(false);
        return beforeState;
    }

    /**
     * Handle keyboard undo/redo during edit mode.
     * Blocks app-level undo and allows browser undo.
     * @param {KeyboardEvent} event
     * @returns {boolean} True if event was handled (and should not propagate)
     */
    handleKeyboardEvent(event) {
        // Only handle during active session
        if (!this.currentSession) {
            return false;
        }

        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const modKey = isMac ? event.metaKey : event.ctrlKey;

        // Check for undo/redo shortcuts
        if (modKey && (event.key === 'z' || event.key === 'Z')) {
            // Don't prevent default - let browser handle undo/redo in contentEditable
            // But stop propagation so app-level undo handler doesn't fire
            event.stopPropagation();
            return true;
        }

        if (modKey && (event.key === 'y' || event.key === 'Y')) {
            // Redo (Windows)
            event.stopPropagation();
            return true;
        }

        return false;
    }

    /**
     * Get session duration in milliseconds.
     * @returns {number}
     */
    getSessionDuration() {
        if (!this.currentSession) {
            return 0;
        }
        return Date.now() - this.currentSession.startTime;
    }

    /**
     * Check if session has changes.
     * @returns {boolean}
     */
    hasChanges() {
        return this.currentSession?.isDirty || false;
    }
}

// Singleton instance
export const historyBridge = new HistoryBridge();
