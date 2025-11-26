/**
 * MouseStateManager - Global mouse state broadcaster for CodeFill canvas animations
 * 
 * This singleton tracks mouse state and broadcasts to all subscribed CodeRunner instances.
 * It provides transformed world coordinates (accounting for zoom/pan) and handles
 * edge detection for click/release events.
 * 
 * @module MouseStateManager
 */

class MouseStateManager {
    constructor() {
        /** @type {Set<Function>} Subscriber callbacks */
        this.subscribers = new Set();
        
        /** 
         * Current mouse state
         * @type {Object}
         */
        this.state = {
            // Screen coordinates (relative to viewport container)
            screenX: 0,
            screenY: 0,
            
            // World coordinates (slide space, accounting for pan/zoom)
            worldX: 0,
            worldY: 0,
            
            // Button state
            isDown: false,
            button: 0,  // 0=left, 1=middle, 2=right
            
            // Velocity (pixels per second in world space)
            velocityX: 0,
            velocityY: 0,
            
            // Click events (single-frame flags, reset after broadcast)
            clicked: false,
            released: false,
            
            // Suppression flag (true during DRAGGING/RESIZING)
            suppressed: false,
            
            // Timestamp for velocity calculation
            timestamp: 0
        };
        
        /** Previous state for edge detection */
        this.lastState = { ...this.state };
        
        /** Whether broadcasting is enabled */
        this.enabled = true;
        
        /** Last position for throttling (skip tiny movements) */
        this.lastBroadcastX = 0;
        this.lastBroadcastY = 0;
    }
    
    /**
     * Subscribe to mouse state updates
     * @param {Function} callback - Called with state object on each update
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }
    
    /**
     * Update mouse state and broadcast to subscribers
     * @param {Object} newState - Partial state update
     */
    update(newState) {
        // Calculate velocity with division-by-zero guard
        const dt = (newState.timestamp - this.state.timestamp) / 1000;
        if (dt > 0.001) {
            this.state.velocityX = (newState.worldX - this.state.worldX) / dt;
            this.state.velocityY = (newState.worldY - this.state.worldY) / dt;
        }
        // Else: keep previous velocity (avoids NaN/Infinity)
        
        // Detect click/release edges
        const wasDown = this.lastState.isDown;
        const isDown = newState.isDown !== undefined ? newState.isDown : this.state.isDown;
        
        this.state.clicked = isDown && !wasDown;
        this.state.released = !isDown && wasDown;
        
        // Update state
        Object.assign(this.state, newState);
        
        // Store for next edge detection
        Object.assign(this.lastState, this.state);
        
        // Throttle: skip if movement is less than 0.5 pixels
        const dx = Math.abs(this.state.worldX - this.lastBroadcastX);
        const dy = Math.abs(this.state.worldY - this.lastBroadcastY);
        const hasMoved = dx > 0.5 || dy > 0.5;
        const hasButtonChange = this.state.clicked || this.state.released;
        
        // Broadcast to subscribers if enabled and there's meaningful change
        if (this.enabled && (hasMoved || hasButtonChange)) {
            this.lastBroadcastX = this.state.worldX;
            this.lastBroadcastY = this.state.worldY;
            
            // Create a shallow copy to prevent mutation by subscribers
            const stateCopy = { ...this.state };
            this.subscribers.forEach(cb => {
                try {
                    cb(stateCopy);
                } catch (e) {
                    console.error('MouseStateManager: Error in subscriber callback', e);
                }
            });
        }
        
        // Reset single-frame flags after broadcast
        this.state.clicked = false;
        this.state.released = false;
    }
    
    /**
     * Enable or disable mouse state broadcasting
     * @param {boolean} enabled 
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    
    /**
     * Set suppression state (during drag/resize operations)
     * @param {boolean} suppressed 
     */
    setSuppressed(suppressed) {
        this.state.suppressed = suppressed;
    }
    
    /**
     * Get current subscriber count (for debugging/testing)
     * @returns {number}
     */
    getSubscriberCount() {
        return this.subscribers.size;
    }
    
    /**
     * Clear all subscribers (for testing/cleanup)
     */
    clearSubscribers() {
        this.subscribers.clear();
    }
}

// Export singleton instance
export const mouseStateManager = new MouseStateManager();

// Also export class for testing
export { MouseStateManager };
