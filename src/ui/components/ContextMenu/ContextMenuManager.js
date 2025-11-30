/**
 * ContextMenuManager
 * 
 * Singleton manager for context menus throughout the application.
 * Handles registration of menu configurations per zone, showing/hiding menus,
 * and ensuring only one menu is visible at a time.
 * 
 * @example
 * // Register a menu configuration
 * contextMenuManager.register('canvas-element', {
 *     getItems: (context) => [
 *         { id: 'copy', label: 'Copy', shortcut: 'Ctrl+C', action: () => {} }
 *     ]
 * });
 * 
 * // Show menu
 * contextMenuManager.show('canvas-element', 100, 200, { selection: [...] });
 */

import { ContextMenu } from './ContextMenu.js';

class ContextMenuManager {
    constructor() {
        /** @type {Map<string, MenuConfig>} */
        this.menuConfigs = new Map();
        
        /** @type {ContextMenu|null} */
        this.activeMenu = null;
        
        /** @type {string|null} */
        this.activeZone = null;
        
        // Bind methods
        this.hide = this.hide.bind(this);
        this.handleGlobalContextMenu = this.handleGlobalContextMenu.bind(this);
        
        // Prevent default context menu on registered zones
        this.setupGlobalHandler();
    }

    /**
     * Set up global context menu handler
     */
    setupGlobalHandler() {
        // We don't prevent default globally - each zone handles its own
        // This is called once on manager creation
    }

    /**
     * Register a menu configuration for a specific zone
     * @param {string} zoneId - Unique identifier for the zone
     * @param {MenuConfig} config - Menu configuration
     */
    register(zoneId, config) {
        this.menuConfigs.set(zoneId, config);
    }

    /**
     * Unregister a menu configuration
     * @param {string} zoneId
     */
    unregister(zoneId) {
        this.menuConfigs.delete(zoneId);
    }

    /**
     * Check if a zone is registered
     * @param {string} zoneId
     * @returns {boolean}
     */
    isRegistered(zoneId) {
        return this.menuConfigs.has(zoneId);
    }

    /**
     * Get menu items for a zone with context
     * @param {string} zoneId
     * @param {Object} context - Context object passed to getItems
     * @returns {MenuItem[]}
     */
    getMenuItems(zoneId, context = {}) {
        const config = this.menuConfigs.get(zoneId);
        if (!config) {
            console.warn(`ContextMenuManager: No configuration for zone "${zoneId}"`);
            return [];
        }
        
        return config.getItems(context);
    }

    /**
     * Show context menu for a specific zone
     * @param {string} zoneId - Zone identifier
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {Object} context - Context object for dynamic menu items
     */
    show(zoneId, x, y, context = {}) {
        // Hide any existing menu
        this.hide();
        
        const items = this.getMenuItems(zoneId, context);
        
        if (items.length === 0) {
            return;
        }
        
        // Filter out hidden items and clean up separators
        const visibleItems = this.filterItems(items, context);
        
        if (visibleItems.length === 0) {
            return;
        }
        
        this.activeMenu = new ContextMenu(visibleItems);
        this.activeZone = zoneId;
        this.activeMenu.show(x, y);
    }

    /**
     * Filter items based on visibility and clean up separators
     * @param {MenuItem[]} items
     * @param {Object} context
     * @returns {MenuItem[]}
     */
    filterItems(items, context) {
        const filtered = items.filter(item => {
            if (item.separator) return true;
            if (item.visible === false) return false;
            if (typeof item.visible === 'function') {
                return item.visible(context);
            }
            return true;
        });
        
        // Remove leading separators
        while (filtered.length > 0 && filtered[0].separator) {
            filtered.shift();
        }
        
        // Remove trailing separators
        while (filtered.length > 0 && filtered[filtered.length - 1].separator) {
            filtered.pop();
        }
        
        // Remove consecutive separators
        const cleaned = [];
        for (let i = 0; i < filtered.length; i++) {
            if (filtered[i].separator && cleaned.length > 0 && cleaned[cleaned.length - 1].separator) {
                continue; // Skip consecutive separator
            }
            cleaned.push(filtered[i]);
        }
        
        return cleaned;
    }

    /**
     * Hide the active menu
     */
    hide() {
        if (this.activeMenu) {
            this.activeMenu.hide();
            this.activeMenu = null;
            this.activeZone = null;
        }
    }

    /**
     * Check if a menu is currently visible
     * @returns {boolean}
     */
    isVisible() {
        return this.activeMenu !== null;
    }

    /**
     * Get the currently active zone
     * @returns {string|null}
     */
    getActiveZone() {
        return this.activeZone;
    }

    /**
     * Handle global contextmenu event (for zones that don't have specific handlers)
     * @param {MouseEvent} e
     */
    handleGlobalContextMenu(e) {
        // This can be used as a fallback handler
        // Individual zones should handle their own contextmenu events
    }

    /**
     * Create a contextmenu event handler for a specific zone
     * @param {string} zoneId
     * @param {Function} getContext - Function to extract context from event
     * @returns {Function}
     */
    createHandler(zoneId, getContext = () => ({})) {
        return (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const context = getContext(e);
            this.show(zoneId, e.clientX, e.clientY, context);
        };
    }

    /**
     * Destroy the manager and clean up
     */
    destroy() {
        this.hide();
        this.menuConfigs.clear();
    }
}

// Export singleton instance
export const contextMenuManager = new ContextMenuManager();

// Also export class for testing
export { ContextMenuManager };

/**
 * @typedef {Object} MenuConfig
 * @property {Function} getItems - Function that returns MenuItem[] given context
 */

/**
 * @typedef {Object} MenuItem
 * @property {string} [id] - Unique identifier
 * @property {string} [label] - Display text
 * @property {string} [icon] - Icon class
 * @property {string} [shortcut] - Keyboard shortcut
 * @property {Function} [action] - Click handler
 * @property {MenuItem[]} [submenu] - Nested items
 * @property {boolean} [disabled] - Disabled state
 * @property {boolean|Function} [visible] - Visibility
 * @property {boolean} [danger] - Destructive action
 * @property {boolean} [separator] - Separator line
 */
