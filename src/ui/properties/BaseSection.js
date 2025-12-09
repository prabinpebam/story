import { Section } from '../components/Section.js';
import { store } from '../../core/Store.js';
import { getMixedValue } from '../../utils/SelectionUtils.js';

/**
 * BaseSection
 * Abstract base class for Property Inspector sections.
 * Provides common functionality for element resolution, property updates, and multi-selection handling.
 */
export class BaseSection {
    /**
     * @param {Object} config - Configuration for the Section component
     * @param {string} config.title - Section title
     * @param {Array} [config.actions] - Header actions
     * @param {boolean} [config.collapsed] - Initial collapsed state
     */
    constructor(config = {}) {
        this.section = new Section(config);
        this.selection = [];
        
        // Bind methods
        this.update = this.update.bind(this);
    }

    /**
     * Get the DOM element for this section
     * @returns {HTMLElement}
     */
    get element() {
        return this.section.element;
    }

    /**
     * Resolve an element by ID based on current editor mode (slide or master)
     * @param {Object} state - Redux state
     * @param {string} id - Element ID
     * @returns {Object|null} The element object or null if not found
     */
    getElement(state, id) {
        const mode = state.editor.mode;
        if (mode === 'master') {
            const master = state.slideMasterPresets[state.editor.activeMasterId];
            return master?.elements[id];
        } else {
            const slide = state.slides[state.editor.activeSlideId];
            return slide?.elements[id];
        }
    }

    /**
     * Get all currently selected element objects
     * @returns {Array<Object>} Array of element objects
     */
    getSelectedElements() {
        const state = store.getState();
        if (!this.selection || this.selection.length === 0) return [];
        
        return this.selection
            .map(id => this.getElement(state, id))
            .filter(el => el != null);
    }

    /**
     * Update a property on all selected elements
     * @param {string} prop - Property name
     * @param {any} value - New value
     * @param {boolean} [isTransient=false] - Whether to skip history (for scrubbing)
     */
    updateProperty(prop, value, isTransient = false) {
        if (!this.selection || this.selection.length === 0) return;

        this.selection.forEach(id => {
            store.dispatch('UPDATE_ELEMENT', { id, [prop]: value }, { skipHistory: isTransient });
        });
    }

    /**
     * Update multiple properties on all selected elements (top-level)
     * @param {Object} updates - Object containing properties to update
     * @param {boolean} [isTransient=false] - Whether to skip history
     */
    updateProperties(updates, isTransient = false) {
        if (!this.selection || this.selection.length === 0) return;

        this.selection.forEach(id => {
            store.dispatch('UPDATE_ELEMENT', { 
                id, 
                ...updates 
            }, { skipHistory: isTransient });
        });
    }

    /**
     * Update style properties on all selected elements
     * @param {Object} styleUpdates - Object containing style properties to update
     * @param {boolean} [isTransient=false] - Whether to skip history
     */
    updateStyle(styleUpdates, isTransient = false) {
        if (!this.selection || this.selection.length === 0) return;

        const state = store.getState();
        
        this.selection.forEach(id => {
            const element = this.getElement(state, id);
            if (!element) return;
            
            const newStyle = { ...(element.style || {}), ...styleUpdates };
            
            store.dispatch('UPDATE_ELEMENT', { 
                id, 
                style: newStyle 
            }, { skipHistory: isTransient });
        });
    }

    /**
     * Helper to check for mixed values across selection
     * @param {Array<Object>} elements - Element objects
     * @param {string} property - Property path
     * @returns {{value: any, mixed: boolean}}
     */
    getMixedValue(elements, property) {
        return getMixedValue(elements, property);
    }

    /**
     * Show or hide the section
     * @param {boolean} visible 
     */
    setVisible(visible) {
        if (visible) {
            this.section.element.classList.remove('hidden');
        } else {
            this.section.element.classList.add('hidden');
        }
    }

    /**
     * Abstract method: Create section content
     * Must be implemented by subclass
     */
    createContent() {
        throw new Error('BaseSection: createContent() must be implemented by subclass');
    }

    /**
     * Abstract method: Update section state based on selection
     * @param {Array<string>} selection - Array of selected element IDs
     */
    update(selection) {
        this.selection = selection || [];
        
        if (!this.selection || this.selection.length === 0) {
            this.setVisible(false);
            return;
        }
        
        this.setVisible(true);
        
        // Subclasses should call super.update(selection) then implement specific logic
    }
}
