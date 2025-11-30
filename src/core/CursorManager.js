/**
 * CursorManager - Centralized cursor state management
 * 
 * Provides a unified system for managing cursor appearance across the application.
 * Features:
 * - Tool-based default cursors (select, hand, shape, text, image)
 * - Stack-based temporary cursors for interactions
 * - Cursor hiding for precision input
 * - Rotation-aware resize cursors
 * 
 * @example
 * // Set tool cursor
 * cursorManager.setTool('hand');
 * 
 * // Push temporary cursor for hover
 * cursorManager.push('pointer', 'button-hover');
 * 
 * // Pop when hover ends
 * cursorManager.pop('button-hover');
 * 
 * // Hide cursor for precision input
 * cursorManager.hide('scrub-drag');
 */

// Cursor definitions for each tool
const TOOL_CURSORS = {
    select: 'default',
    hand: 'grab',
    shape: 'crosshair',
    text: 'crosshair',
    image: 'crosshair'
};

// Resize handle cursor mapping based on handle position
// These rotate based on element rotation
const RESIZE_HANDLE_CURSORS = {
    'n': 'ns-resize',
    's': 'ns-resize',
    'e': 'ew-resize',
    'w': 'ew-resize',
    'nw': 'nwse-resize',
    'se': 'nwse-resize',
    'ne': 'nesw-resize',
    'sw': 'nesw-resize'
};

// Cursor rotation mapping for 45-degree increments
// Each increment rotates the cursor set
const CURSOR_ROTATION_MAP = [
    ['ns-resize', 'nesw-resize', 'ew-resize', 'nwse-resize'],
    ['nesw-resize', 'ew-resize', 'nwse-resize', 'ns-resize'],
    ['ew-resize', 'nwse-resize', 'ns-resize', 'nesw-resize'],
    ['nwse-resize', 'ns-resize', 'nesw-resize', 'ew-resize']
];

class CursorManager {
    constructor() {
        /** @type {Array<{cursor: string, reason: string}>} */
        this.stack = [];
        
        /** @type {string} Current active tool */
        this.currentTool = 'select';
        
        /** @type {HTMLElement|null} Canvas element for cursor application */
        this.canvasElement = null;
        
        /** @type {boolean} Whether cursor is currently hidden */
        this.isHidden = false;
        
        /** @type {string|null} Reason for cursor hiding */
        this.hideReason = null;
        
        // Singleton enforcement
        if (CursorManager.instance) {
            return CursorManager.instance;
        }
        CursorManager.instance = this;
    }

    /**
     * Initialize the cursor manager with the canvas element
     * @param {string} canvasSelector - CSS selector for the interaction canvas
     */
    init(canvasSelector = '#interaction-canvas') {
        this.canvasElement = document.querySelector(canvasSelector);
        this._applyCurrentCursor();
    }

    /**
     * Set the active tool cursor
     * @param {string} tool - Tool name (select, hand, shape, text, image)
     */
    setTool(tool) {
        this.currentTool = tool;
        this._applyCurrentCursor();
    }

    /**
     * Push a temporary cursor onto the stack
     * @param {string} cursor - CSS cursor value
     * @param {string} reason - Identifier for this cursor (used for popping)
     */
    push(cursor, reason) {
        // Remove existing entry with same reason to avoid duplicates
        this.stack = this.stack.filter(entry => entry.reason !== reason);
        this.stack.push({ cursor, reason });
        this._applyCurrentCursor();
    }

    /**
     * Pop a cursor from the stack by reason
     * @param {string} reason - Identifier of cursor to remove
     */
    pop(reason) {
        this.stack = this.stack.filter(entry => entry.reason !== reason);
        this._applyCurrentCursor();
    }

    /**
     * Clear all temporary cursors from the stack
     */
    clearStack() {
        this.stack = [];
        this._applyCurrentCursor();
    }

    /**
     * Hide the cursor completely
     * @param {string} reason - Identifier for the hide reason
     */
    hide(reason) {
        this.isHidden = true;
        this.hideReason = reason;
        document.body.classList.add('cursor-hidden');
    }

    /**
     * Show the cursor again
     * @param {string} [reason] - Optional reason to match (only shows if reasons match)
     */
    show(reason) {
        if (reason && this.hideReason !== reason) {
            return; // Don't show if hide reason doesn't match
        }
        this.isHidden = false;
        this.hideReason = null;
        document.body.classList.remove('cursor-hidden');
    }

    /**
     * Get the appropriate resize cursor based on handle and element rotation
     * @param {string} handle - Handle position (n, s, e, w, nw, ne, sw, se)
     * @param {number} [rotation=0] - Element rotation in degrees
     * @returns {string} CSS cursor value
     */
    getResizeCursor(handle, rotation = 0) {
        const baseCursor = RESIZE_HANDLE_CURSORS[handle.toLowerCase()];
        if (!baseCursor) return 'default';

        // Normalize rotation to 0-360
        rotation = ((rotation % 360) + 360) % 360;

        // Calculate which 45-degree sector we're in
        const sector = Math.round(rotation / 45) % 8;

        // Find the base cursor's position in the rotation map
        const baseSet = CURSOR_ROTATION_MAP[0];
        const baseCursorIndex = baseSet.indexOf(baseCursor);
        if (baseCursorIndex === -1) return baseCursor;

        // Calculate rotated cursor based on sector
        // Each sector rotates the cursor by one position in the cycle
        const rotationOffset = Math.floor(sector / 2);
        const rotatedIndex = (baseCursorIndex + rotationOffset) % 4;

        return CURSOR_ROTATION_MAP[0][rotatedIndex];
    }

    /**
     * Push a resize cursor based on handle position and element rotation
     * @param {string} handle - Handle position
     * @param {number} [rotation=0] - Element rotation in degrees
     * @param {string} [reason='resize-handle-hover'] - Cursor reason
     */
    pushResizeCursor(handle, rotation = 0, reason = 'resize-handle-hover') {
        const cursor = this.getResizeCursor(handle, rotation);
        this.push(cursor, reason);
    }

    /**
     * Get the current effective cursor value
     * @returns {string} CSS cursor value
     */
    getCurrentCursor() {
        if (this.isHidden) return 'none';
        if (this.stack.length > 0) {
            return this.stack[this.stack.length - 1].cursor;
        }
        return TOOL_CURSORS[this.currentTool] || 'default';
    }

    /**
     * Apply the current cursor to the canvas element
     * @private
     */
    _applyCurrentCursor() {
        if (this.isHidden) return;

        const cursor = this.getCurrentCursor();
        
        // Update body class for tool cursor (backwards compatibility)
        document.body.classList.remove('cursor-select', 'cursor-hand', 'cursor-shape', 'cursor-text', 'cursor-image');
        document.body.classList.add(`cursor-${this.currentTool}`);

        // Apply stack cursor directly if there's one
        if (this.stack.length > 0 && this.canvasElement) {
            this.canvasElement.style.cursor = cursor;
        } else if (this.canvasElement) {
            // Reset to inherit from CSS rules
            this.canvasElement.style.cursor = '';
        }
    }

    /**
     * Check if a specific cursor reason is currently active
     * @param {string} reason - Reason to check
     * @returns {boolean}
     */
    hasReason(reason) {
        return this.stack.some(entry => entry.reason === reason);
    }

    /**
     * Get all current cursor reasons
     * @returns {string[]}
     */
    getReasons() {
        return this.stack.map(entry => entry.reason);
    }
}

// Export singleton instance
export const cursorManager = new CursorManager();
export { CursorManager };
