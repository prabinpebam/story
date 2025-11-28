/**
 * CursorManager
 * Manages real-time cursor tracking for collaborators
 * 
 * Features:
 * - Broadcast local cursor position
 * - Receive and render remote cursors
 * - Smooth cursor interpolation
 * - Throttled updates for performance
 */

import { CURSOR, MESSAGE_TYPES } from '../constants/CollaborationConstants.js';

export class CursorManager {
    /**
     * Create a cursor manager
     * @param {SignalRConnection} connection - SignalR connection
     * @param {PresenceManager} presenceManager - Presence manager for user colors
     * @param {Object} options - Configuration options
     */
    constructor(connection, presenceManager, options = {}) {
        this.connection = connection;
        this.presenceManager = presenceManager;
        this.canvasElement = options.canvasElement || null;
        
        this.remoteCursors = new Map();
        this.cursorElements = new Map();
        this.localCursor = { x: 0, y: 0 };
        this.lastBroadcast = 0;
        this.isEnabled = false;
        
        this.listeners = new Map();
        
        this._setupConnectionListeners();
    }

    /**
     * Set the canvas element for coordinate mapping
     * @param {HTMLElement} element - Canvas container element
     */
    setCanvasElement(element) {
        this.canvasElement = element;
    }

    /**
     * Enable cursor tracking
     */
    enable() {
        if (this.isEnabled) return;
        
        this.isEnabled = true;
        this._setupMouseListeners();
    }

    /**
     * Disable cursor tracking
     */
    disable() {
        if (!this.isEnabled) return;
        
        this.isEnabled = false;
        this._removeMouseListeners();
        this._hideCursor();
    }

    /**
     * Setup connection event listeners
     * @private
     */
    _setupConnectionListeners() {
        // Listen for cursor move messages
        this.connection.on(`message:${MESSAGE_TYPES.CURSOR_MOVE}`, (data) => {
            this._handleCursorMove(data);
        });

        // Listen for cursor hide messages
        this.connection.on(`message:${MESSAGE_TYPES.CURSOR_HIDE}`, (data) => {
            this._handleCursorHide(data);
        });

        // Clean up cursors when users leave
        this.presenceManager.on('userLeft', (data) => {
            this._removeCursor(data.userId);
        });
    }

    /**
     * Setup mouse event listeners
     * @private
     */
    _setupMouseListeners() {
        if (!this.canvasElement) return;

        this._mouseMoveHandler = (event) => {
            this._handleLocalMouseMove(event);
        };

        this._mouseLeaveHandler = () => {
            this._hideCursor();
        };

        this.canvasElement.addEventListener('mousemove', this._mouseMoveHandler);
        this.canvasElement.addEventListener('mouseleave', this._mouseLeaveHandler);
    }

    /**
     * Remove mouse event listeners
     * @private
     */
    _removeMouseListeners() {
        if (!this.canvasElement) return;

        if (this._mouseMoveHandler) {
            this.canvasElement.removeEventListener('mousemove', this._mouseMoveHandler);
        }
        if (this._mouseLeaveHandler) {
            this.canvasElement.removeEventListener('mouseleave', this._mouseLeaveHandler);
        }
    }

    /**
     * Handle local mouse move
     * @param {MouseEvent} event - Mouse event
     * @private
     */
    _handleLocalMouseMove(event) {
        if (!this.canvasElement) return;

        // Get canvas-relative coordinates
        const rect = this.canvasElement.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Normalize to 0-1 range
        const normalizedX = x / rect.width;
        const normalizedY = y / rect.height;

        this.localCursor = { x: normalizedX, y: normalizedY };

        // Throttle broadcasts
        const now = Date.now();
        if (now - this.lastBroadcast >= CURSOR.THROTTLE_MS) {
            this._broadcastCursor();
            this.lastBroadcast = now;
        }
    }

    /**
     * Broadcast local cursor position
     * @private
     */
    async _broadcastCursor() {
        if (!this.isEnabled) return;

        try {
            await this.connection.send(MESSAGE_TYPES.CURSOR_MOVE, {
                x: this.localCursor.x,
                y: this.localCursor.y
            });
        } catch (error) {
            // Silently fail - cursor updates are best-effort
        }
    }

    /**
     * Hide local cursor (broadcast hide message)
     * @private
     */
    async _hideCursor() {
        try {
            await this.connection.send(MESSAGE_TYPES.CURSOR_HIDE, {});
        } catch (error) {
            // Silently fail
        }
    }

    /**
     * Handle incoming cursor move message
     * @param {Object} data - Cursor data
     * @private
     */
    _handleCursorMove(data) {
        const { payload, senderId, timestamp } = data;
        const { x, y } = payload;

        // Get or create cursor data
        let cursor = this.remoteCursors.get(senderId);
        if (!cursor) {
            const user = this.presenceManager.getUser(senderId);
            const color = this.presenceManager.getUserColor(senderId);
            
            cursor = {
                userId: senderId,
                name: user?.name || 'Anonymous',
                color,
                x: x,
                y: y,
                targetX: x,
                targetY: y,
                visible: true,
                lastUpdate: timestamp
            };
            this.remoteCursors.set(senderId, cursor);
            this._createCursorElement(senderId, cursor);
        }

        // Update target position for smooth interpolation
        cursor.targetX = x;
        cursor.targetY = y;
        cursor.visible = true;
        cursor.lastUpdate = timestamp;

        // Start animation if not running
        this._startAnimation();

        this._emit('cursorMove', { userId: senderId, x, y });
    }

    /**
     * Handle incoming cursor hide message
     * @param {Object} data - Hide data
     * @private
     */
    _handleCursorHide(data) {
        const { senderId } = data;
        
        const cursor = this.remoteCursors.get(senderId);
        if (cursor) {
            cursor.visible = false;
            this._updateCursorVisibility(senderId, false);
        }

        this._emit('cursorHide', { userId: senderId });
    }

    /**
     * Create cursor DOM element
     * @param {string} userId - User ID
     * @param {Object} cursor - Cursor data
     * @private
     */
    _createCursorElement(userId, cursor) {
        if (!this.canvasElement || this.cursorElements.has(userId)) return;

        const element = document.createElement('div');
        element.className = 'remote-cursor';
        element.innerHTML = `
            <svg class="cursor-pointer" width="24" height="24" viewBox="0 0 24 24" fill="${cursor.color}">
                <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.86a.5.5 0 0 0-.85.35z"/>
            </svg>
            <div class="cursor-label" style="background: ${cursor.color}">
                ${this._escapeHtml(cursor.name)}
            </div>
        `;
        
        element.style.cssText = `
            position: absolute;
            pointer-events: none;
            z-index: 10000;
            transform: translate(-2px, -2px);
            transition: opacity 0.2s ease;
        `;

        // Add styles for cursor label
        const label = element.querySelector('.cursor-label');
        label.style.cssText = `
            position: absolute;
            left: 16px;
            top: 16px;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: 500;
            color: white;
            white-space: nowrap;
            text-shadow: 0 1px 1px rgba(0,0,0,0.2);
        `;

        this.canvasElement.appendChild(element);
        this.cursorElements.set(userId, element);
    }

    /**
     * Remove cursor element
     * @param {string} userId - User ID
     * @private
     */
    _removeCursor(userId) {
        const element = this.cursorElements.get(userId);
        if (element) {
            element.remove();
            this.cursorElements.delete(userId);
        }
        this.remoteCursors.delete(userId);
    }

    /**
     * Update cursor element visibility
     * @param {string} userId - User ID
     * @param {boolean} visible - Visibility state
     * @private
     */
    _updateCursorVisibility(userId, visible) {
        const element = this.cursorElements.get(userId);
        if (element) {
            element.style.opacity = visible ? '1' : '0';
        }
    }

    /**
     * Update cursor element position
     * @param {string} userId - User ID
     * @param {number} x - Normalized X position (0-1)
     * @param {number} y - Normalized Y position (0-1)
     * @private
     */
    _updateCursorPosition(userId, x, y) {
        const element = this.cursorElements.get(userId);
        if (!element || !this.canvasElement) return;

        // Convert normalized coordinates to pixel coordinates
        const rect = this.canvasElement.getBoundingClientRect();
        const pixelX = x * rect.width;
        const pixelY = y * rect.height;

        element.style.left = `${pixelX}px`;
        element.style.top = `${pixelY}px`;
        element.style.opacity = '1';
    }

    /**
     * Start cursor animation loop
     * @private
     */
    _startAnimation() {
        if (this._animationFrame) return;

        const animate = () => {
            let hasMoving = false;

            for (const [userId, cursor] of this.remoteCursors.entries()) {
                if (!cursor.visible) continue;

                // Smooth interpolation
                const dx = cursor.targetX - cursor.x;
                const dy = cursor.targetY - cursor.y;

                if (Math.abs(dx) > 0.0001 || Math.abs(dy) > 0.0001) {
                    cursor.x += dx * (1 - CURSOR.SMOOTHING);
                    cursor.y += dy * (1 - CURSOR.SMOOTHING);
                    hasMoving = true;
                } else {
                    cursor.x = cursor.targetX;
                    cursor.y = cursor.targetY;
                }

                this._updateCursorPosition(userId, cursor.x, cursor.y);

                // Hide cursor after inactivity
                const timeSinceUpdate = Date.now() - cursor.lastUpdate;
                if (timeSinceUpdate > CURSOR.HIDE_AFTER_MS) {
                    cursor.visible = false;
                    this._updateCursorVisibility(userId, false);
                }
            }

            if (hasMoving || this.remoteCursors.size > 0) {
                this._animationFrame = requestAnimationFrame(animate);
            } else {
                this._animationFrame = null;
            }
        };

        this._animationFrame = requestAnimationFrame(animate);
    }

    /**
     * Stop animation loop
     * @private
     */
    _stopAnimation() {
        if (this._animationFrame) {
            cancelAnimationFrame(this._animationFrame);
            this._animationFrame = null;
        }
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} str - String to escape
     * @returns {string}
     * @private
     */
    _escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Get all visible remote cursors
     * @returns {Array<Object>}
     */
    getRemoteCursors() {
        return Array.from(this.remoteCursors.values())
            .filter(c => c.visible);
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @returns {Function} Unsubscribe function
     */
    on(event, handler) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(handler);
        return () => this.off(event, handler);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     */
    off(event, handler) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(handler);
        }
    }

    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {Object} data - Event data
     * @private
     */
    _emit(event, data) {
        if (!this.listeners.has(event)) return;
        
        for (const handler of this.listeners.get(event)) {
            try {
                handler(data);
            } catch (error) {
                console.error(`CursorManager: Error in ${event} handler`, error);
            }
        }
    }

    /**
     * Dispose of the cursor manager
     */
    dispose() {
        this.disable();
        this._stopAnimation();
        
        // Remove all cursor elements
        for (const element of this.cursorElements.values()) {
            element.remove();
        }
        
        this.remoteCursors.clear();
        this.cursorElements.clear();
        this.listeners.clear();
    }
}

export default CursorManager;
