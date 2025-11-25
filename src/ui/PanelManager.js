/**
 * PanelManager.js
 * Manages multiple draggable panels - registration, z-index, keyboard shortcuts.
 */

class PanelManager {
    constructor() {
        this.panels = new Map();
        this.topZIndex = 1000;
        this.shortcuts = new Map();
        
        // Setup global keyboard shortcuts
        this.setupKeyboardShortcuts();
    }

    /**
     * Register a panel with the manager.
     * @param {string} id - Unique identifier for the panel.
     * @param {DraggablePanel} panel - The panel instance.
     * @param {Object} options - Optional configuration.
     * @param {string} options.shortcut - Keyboard shortcut to toggle (e.g., 'ctrl+shift+c').
     */
    register(id, panel, options = {}) {
        if (this.panels.has(id)) {
            console.warn(`Panel with id "${id}" is already registered.`);
            return;
        }
        
        this.panels.set(id, panel);
        
        // Register keyboard shortcut if provided
        if (options.shortcut) {
            this.registerShortcut(options.shortcut, id);
        }
        
        console.log(`Panel "${id}" registered.`);
    }

    /**
     * Unregister a panel.
     * @param {string} id - Panel identifier.
     */
    unregister(id) {
        const panel = this.panels.get(id);
        if (panel) {
            panel.destroy();
            this.panels.delete(id);
            
            // Remove any shortcuts pointing to this panel
            for (const [shortcut, panelId] of this.shortcuts) {
                if (panelId === id) {
                    this.shortcuts.delete(shortcut);
                }
            }
        }
    }

    /**
     * Open a panel by ID.
     * @param {string} id - Panel identifier.
     */
    open(id) {
        const panel = this.panels.get(id);
        if (panel) {
            panel.open();
            this.bringToFront(id);
        } else {
            console.warn(`Panel "${id}" not found.`);
        }
    }

    /**
     * Close a panel by ID.
     * @param {string} id - Panel identifier.
     */
    close(id) {
        const panel = this.panels.get(id);
        if (panel) {
            panel.close();
        }
    }

    /**
     * Toggle a panel's visibility.
     * @param {string} id - Panel identifier.
     */
    toggle(id) {
        const panel = this.panels.get(id);
        if (panel) {
            panel.toggle();
            if (panel.isOpen) {
                this.bringToFront(id);
            }
        }
    }

    /**
     * Bring a panel to the front (highest z-index).
     * @param {string} id - Panel identifier.
     */
    bringToFront(id) {
        const panel = this.panels.get(id);
        if (panel && panel.isOpen) {
            this.topZIndex++;
            panel.element.style.zIndex = this.topZIndex;
        }
    }

    /**
     * Close all open panels.
     */
    closeAll() {
        for (const panel of this.panels.values()) {
            panel.close();
        }
    }

    /**
     * Get a panel by ID.
     * @param {string} id - Panel identifier.
     * @returns {DraggablePanel|undefined}
     */
    get(id) {
        return this.panels.get(id);
    }

    /**
     * Check if a panel is open.
     * @param {string} id - Panel identifier.
     * @returns {boolean}
     */
    isOpen(id) {
        const panel = this.panels.get(id);
        return panel ? panel.isOpen : false;
    }

    /**
     * Get all registered panel IDs.
     * @returns {string[]}
     */
    getRegisteredIds() {
        return Array.from(this.panels.keys());
    }

    /**
     * Get all currently open panel IDs.
     * @returns {string[]}
     */
    getOpenIds() {
        return Array.from(this.panels.entries())
            .filter(([id, panel]) => panel.isOpen)
            .map(([id]) => id);
    }

    // --- Keyboard Shortcuts ---
    
    /**
     * Register a keyboard shortcut for a panel.
     * @param {string} shortcut - Shortcut string (e.g., 'ctrl+shift+c').
     * @param {string} panelId - Panel identifier.
     */
    registerShortcut(shortcut, panelId) {
        this.shortcuts.set(shortcut.toLowerCase(), panelId);
    }

    /**
     * Unregister a keyboard shortcut.
     * @param {string} shortcut - Shortcut string.
     */
    unregisterShortcut(shortcut) {
        this.shortcuts.delete(shortcut.toLowerCase());
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Build shortcut string from event
            const parts = [];
            if (e.ctrlKey || e.metaKey) parts.push('ctrl');
            if (e.shiftKey) parts.push('shift');
            if (e.altKey) parts.push('alt');
            
            // Add the key (lowercase, handle special keys)
            const key = e.key.toLowerCase();
            if (!['control', 'shift', 'alt', 'meta'].includes(key)) {
                parts.push(key);
            } else {
                return; // Don't trigger on modifier-only presses
            }
            
            const shortcut = parts.join('+');
            
            // Check if this shortcut is registered
            if (this.shortcuts.has(shortcut)) {
                const panelId = this.shortcuts.get(shortcut);
                this.toggle(panelId);
                e.preventDefault();
                e.stopPropagation();
            }
            
            // Global: Escape closes the topmost open panel
            if (e.key === 'Escape') {
                const openPanels = this.getOpenIds();
                if (openPanels.length > 0) {
                    // Find the panel with highest z-index
                    let topPanel = null;
                    let topZ = -1;
                    for (const id of openPanels) {
                        const panel = this.panels.get(id);
                        const z = parseInt(panel.element.style.zIndex) || 0;
                        if (z > topZ) {
                            topZ = z;
                            topPanel = id;
                        }
                    }
                    if (topPanel) {
                        this.close(topPanel);
                        e.preventDefault();
                    }
                }
            }
        });
    }

    // --- Layout Helpers ---
    
    /**
     * Tile all open panels horizontally.
     */
    tileHorizontal() {
        const openPanels = this.getOpenIds();
        if (openPanels.length === 0) return;
        
        const width = window.innerWidth / openPanels.length;
        openPanels.forEach((id, index) => {
            const panel = this.panels.get(id);
            panel.position.x = index * width;
            panel.position.y = 0;
            panel.size.width = width;
            panel.size.height = window.innerHeight;
            panel.updatePosition();
            panel.updateSize();
        });
    }

    /**
     * Cascade all open panels.
     */
    cascade() {
        const openPanels = this.getOpenIds();
        let offset = 0;
        const offsetStep = 30;
        
        openPanels.forEach((id) => {
            const panel = this.panels.get(id);
            panel.position.x = 100 + offset;
            panel.position.y = 100 + offset;
            panel.updatePosition();
            this.bringToFront(id);
            offset += offsetStep;
        });
    }
}

// Export singleton instance
export const panelManager = new PanelManager();

// Also export the class for testing or custom instances
export { PanelManager };

export default panelManager;
