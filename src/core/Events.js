/**
 * Simple Pub/Sub Event Bus
 */
export class EventEmitter {
    constructor() {
        this.events = {};
    }

    /**
     * Subscribe to an event
     * @param {string} eventName 
     * @param {Function} callback 
     */
    on(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(callback);
    }

    /**
     * Unsubscribe from an event
     * @param {string} eventName 
     * @param {Function} callback 
     */
    off(eventName, callback) {
        if (!this.events[eventName]) return;
        this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    }

    /**
     * Emit an event with data
     * @param {string} eventName 
     * @param {any} data 
     */
    emit(eventName, data) {
        if (!this.events[eventName]) return;
        this.events[eventName].forEach(callback => callback(data));
    }
}

// Singleton instance for global app events
export const appEvents = new EventEmitter();

/**
 * Style System Events
 * Events fired when styles change in the cascading style system.
 * Used by UI components and renderers to respond to style updates.
 */
export const STYLE_EVENTS = {
    // Theme definition changed (colors edited in Color Theme Manager)
    THEME_UPDATED: 'style:theme-updated',
    
    // Theme assignment changed (slide/layout now uses different theme)
    THEME_ASSIGNMENT_CHANGED: 'style:theme-assignment-changed',
    
    // Color mode changed (light ↔ dark)
    COLOR_MODE_CHANGED: 'style:color-mode-changed',
    
    // Typography definition changed
    TYPOGRAPHY_UPDATED: 'style:typography-updated',
    
    // Typography assignment changed
    TYPOGRAPHY_ASSIGNMENT_CHANGED: 'style:typography-assignment-changed'
};
