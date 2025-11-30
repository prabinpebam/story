/**
 * IMEHandler
 * 
 * Handles Input Method Editor (IME) composition events for CJK input.
 * Prevents interference with text editing during composition.
 * 
 * @see documentation/tech-specs/core/text-editing/07-ime-handler.md
 */

export class IMEHandler {
    constructor() {
        this.isComposing = false;
        this.compositionText = '';
        this.callbacks = {
            onCompositionStart: null,
            onCompositionUpdate: null,
            onCompositionEnd: null
        };
    }

    /**
     * Attach IME event listeners to an element.
     * @param {Element} element - The contentEditable element
     */
    attach(element) {
        if (!element) return;

        element.addEventListener('compositionstart', this._handleCompositionStart);
        element.addEventListener('compositionupdate', this._handleCompositionUpdate);
        element.addEventListener('compositionend', this._handleCompositionEnd);
    }

    /**
     * Detach IME event listeners from an element.
     * @param {Element} element - The contentEditable element
     */
    detach(element) {
        if (!element) return;

        element.removeEventListener('compositionstart', this._handleCompositionStart);
        element.removeEventListener('compositionupdate', this._handleCompositionUpdate);
        element.removeEventListener('compositionend', this._handleCompositionEnd);
        
        // Reset state
        this.isComposing = false;
        this.compositionText = '';
    }

    /**
     * Check if IME composition is in progress.
     * @returns {boolean}
     */
    isCompositionInProgress() {
        return this.isComposing;
    }

    /**
     * Get the current composition text.
     * @returns {string}
     */
    getCompositionText() {
        return this.compositionText;
    }

    /**
     * Set callback for composition events.
     * @param {string} event - 'start', 'update', or 'end'
     * @param {Function} callback - Callback function
     */
    on(event, callback) {
        const key = `onComposition${event.charAt(0).toUpperCase() + event.slice(1)}`;
        if (key in this.callbacks) {
            this.callbacks[key] = callback;
        }
    }

    /**
     * Remove callback for composition events.
     * @param {string} event - 'start', 'update', or 'end'
     */
    off(event) {
        const key = `onComposition${event.charAt(0).toUpperCase() + event.slice(1)}`;
        if (key in this.callbacks) {
            this.callbacks[key] = null;
        }
    }

    /**
     * Check if an action should be blocked during composition.
     * @param {string} action - Action name
     * @returns {boolean}
     */
    shouldBlockAction(action) {
        if (!this.isComposing) return false;

        // Actions to block during IME composition
        const blockedActions = [
            'save',
            'exit',
            'format',
            'bold',
            'italic',
            'underline',
            'undo',
            'redo',
            'selectAll'
        ];

        return blockedActions.includes(action);
    }

    /**
     * Handle composition start event.
     * @param {CompositionEvent} event
     * @private
     */
    _handleCompositionStart = (event) => {
        this.isComposing = true;
        this.compositionText = event.data || '';

        if (this.callbacks.onCompositionStart) {
            this.callbacks.onCompositionStart({
                text: this.compositionText,
                event
            });
        }
    };

    /**
     * Handle composition update event.
     * @param {CompositionEvent} event
     * @private
     */
    _handleCompositionUpdate = (event) => {
        this.compositionText = event.data || '';

        if (this.callbacks.onCompositionUpdate) {
            this.callbacks.onCompositionUpdate({
                text: this.compositionText,
                event
            });
        }
    };

    /**
     * Handle composition end event.
     * @param {CompositionEvent} event
     * @private
     */
    _handleCompositionEnd = (event) => {
        const finalText = event.data || '';
        
        this.isComposing = false;
        this.compositionText = '';

        if (this.callbacks.onCompositionEnd) {
            this.callbacks.onCompositionEnd({
                text: finalText,
                event
            });
        }
    };

    /**
     * Force end composition (for edge cases).
     */
    forceEndComposition() {
        if (this.isComposing) {
            this.isComposing = false;
            this.compositionText = '';
        }
    }
}

// Singleton instance
export const imeHandler = new IMEHandler();
