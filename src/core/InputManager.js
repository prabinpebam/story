export class InputManager {
    /**
     * Checks if the currently focused element is an input, textarea, or contentEditable.
     * @returns {boolean}
     */
    static isInputActive() {
        const active = document.activeElement;
        if (!active) return false;

        const tagName = active.tagName.toLowerCase();
        const isContentEditable = active.isContentEditable;

        return (
            tagName === 'input' ||
            tagName === 'textarea' ||
            tagName === 'select' ||
            isContentEditable
        );
    }

    /**
     * Determines if a global shortcut should be blocked based on the current context.
     * Generally, if the user is typing in an input, we block global shortcuts (like Delete, T for Text tool, etc.),
     * unless they are standard editing shortcuts (Copy, Paste, Undo, Arrows).
     * 
     * @param {KeyboardEvent} event 
     * @returns {boolean} true if the shortcut should be blocked (ignored by global handler)
     */
    static shouldBlockShortcut(event) {
        if (!this.isInputActive()) {
            return false; // Not in an input, allow global shortcuts
        }

        // Allow opening the keyboard shortcuts overlay from inputs.
        // (Cmd/Ctrl+/ is not a typical text entry keystroke, unlike plain '?' which would type.)
        const isCmdOrCtrl = event.ctrlKey || event.metaKey;
        if (isCmdOrCtrl && event.key === '/') {
            return false;
        }

        // If we are in an input, we generally BLOCK global shortcuts,
        // EXCEPT for standard editing keys which we want to pass through to the input.
        // However, the question is: does the global handler need to run?
        // Usually, if we are in an input, we want the browser default behavior (typing, moving cursor),
        // and we want to PREVENT the global application shortcut (e.g. 'Delete' deleting the selected slide).
        
        // So, if isInputActive is true, we return TRUE (Block Global),
        // UNLESS it is a key that the global handler might be interested in specifically overriding even in inputs?
        // No, usually global handlers are for app-level things.
        
        // But wait, if we return TRUE, the caller (global handler) will return early.
        // This is what we want.
        
        // The only exception is if we have a global shortcut that MUST work even when focusing an input.
        // For example: Ctrl+S (Save)? Maybe.
        // For now, let's assume all app-level shortcuts (Tools, Delete, Duplicate) should be blocked.
        
        // Standard editing keys (Ctrl+C, Arrows) are handled by the browser natively on the input.
        // The global handler usually doesn't implement them for inputs, but might for Canvas.
        // So blocking the global handler is correct.
        
        // One edge case: Escape.
        // If I press Escape in an input, I might want to blur the input.
        // If the global handler handles Escape to "Deselect All", we might want to block that
        // and let the input handle Escape (blur).
        // OR, we might want the global handler to handle it?
        // Usually, Input handles Escape -> Blur. Then next Escape -> Deselect.
        
        return true;
    }
}
