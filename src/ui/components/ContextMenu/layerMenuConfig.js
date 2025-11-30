/**
 * layerMenuConfig.js
 * Context menu configurations for layer-related zones.
 * 
 * Zones covered:
 * - layer-item: Layer tree element items
 * - fill-layer: Code fill panel layer swatches
 * - fill-preset: Code fill panel preset items
 */

import store from '../../../core/Store.js';

/**
 * Layer Item Zone Configuration
 * Used in LayerTree for element right-click
 */
export const layerItemConfig = {
    zone: 'layer-item',
    
    /**
     * Get menu items for a layer item
     * @param {Object} context - Context from LayerTree
     * @param {string} context.elementId - The element ID
     * @param {Object} context.element - The element data
     * @param {boolean} context.isPlaceholder - Whether element is a placeholder
     * @param {boolean} context.isInherited - Whether element is from layout/theme
     * @param {HTMLElement} context.layerItem - The layer item DOM element
     * @param {Function} context.startRename - Function to start rename mode
     * @param {Function} context.resetPlaceholderToMaster - Function to reset placeholder
     * @returns {Array} Menu item configuration
     */
    getItems(context) {
        const { elementId, element, isPlaceholder, isInherited, startRename, resetPlaceholderToMaster } = context;
        
        if (!element) return [];
        
        const items = [];
        
        if (isPlaceholder) {
            // Placeholder-specific items
            if (element.hasUserContent) {
                items.push({
                    id: 'reset-to-master',
                    label: 'Reset to Master',
                    icon: 'fa-solid fa-rotate-left',
                    action: () => resetPlaceholderToMaster(elementId, element)
                });
            }
            
            if (isInherited) {
                items.push({
                    id: 'edit-placeholder',
                    label: 'Edit Placeholder',
                    icon: 'fa-solid fa-pen',
                    action: () => {
                        store.dispatch('INSTANTIATE_PLACEHOLDER', { 
                            placeholderId: elementId,
                            element: element
                        });
                        store.dispatch('SET_EDITING_ELEMENT', { id: elementId, selectionType: 'all' });
                    }
                });
            }
            
            items.push({
                id: 'toggle-placeholder-visibility',
                label: element.hidden ? 'Show Placeholder' : 'Hide Placeholder',
                icon: element.hidden ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash',
                action: () => store.dispatch('TOGGLE_ELEMENT_VISIBILITY', { id: elementId })
            });
        } else {
            // Regular element menu items
            if (!isInherited) {
                items.push({
                    id: 'rename',
                    label: 'Rename',
                    icon: 'fa-solid fa-pen',
                    shortcut: 'Enter',
                    action: () => startRename()
                });
                
                items.push({ separator: true });
                
                items.push({
                    id: 'delete',
                    label: 'Delete',
                    icon: 'fa-solid fa-trash',
                    shortcut: 'Del',
                    action: () => store.dispatch('REMOVE_ELEMENT', { id: elementId })
                });
            }
        }
        
        // Common items (always shown)
        items.push({ separator: true });
        
        items.push({
            id: 'toggle-lock',
            label: element.locked ? 'Unlock' : 'Lock',
            icon: element.locked ? 'fa-solid fa-lock-open' : 'fa-solid fa-lock',
            shortcut: 'Ctrl+L',
            action: () => store.dispatch('TOGGLE_ELEMENT_LOCK', { id: elementId })
        });
        
        items.push({
            id: 'toggle-visibility',
            label: element.hidden ? 'Show' : 'Hide',
            icon: element.hidden ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash',
            shortcut: 'Ctrl+H',
            action: () => store.dispatch('TOGGLE_ELEMENT_VISIBILITY', { id: elementId })
        });
        
        return items;
    }
};

/**
 * Fill Layer Zone Configuration
 * Used in FillLayerBar for code fill layer context menu
 */
export const fillLayerConfig = {
    zone: 'fill-layer',
    
    /**
     * Get menu items for a fill layer
     * @param {Object} context - Context from FillLayerBar
     * @param {number} context.index - Index of the fill
     * @param {Object} context.fill - The fill data
     * @param {number} context.totalFills - Total number of fills
     * @param {Function} context.onReorder - Reorder callback
     * @param {Function} context.onDuplicate - Duplicate callback
     * @param {Function} context.onDelete - Delete callback
     * @returns {Array} Menu item configuration
     */
    getItems(context) {
        const { index, fill, totalFills, onReorder, onDuplicate, onDelete } = context;
        
        if (!fill || fill.type !== 'code') return [];
        
        const isFirst = index === 0;
        const isLast = index === totalFills - 1;
        
        return [
            {
                id: 'move-up',
                label: 'Move Up',
                icon: 'fa-solid fa-arrow-up',
                disabled: isFirst,
                action: () => onReorder(index, index - 1)
            },
            {
                id: 'move-down',
                label: 'Move Down',
                icon: 'fa-solid fa-arrow-down',
                disabled: isLast,
                action: () => onReorder(index, index + 1)
            },
            { separator: true },
            {
                id: 'duplicate',
                label: 'Duplicate',
                icon: 'fa-solid fa-clone',
                shortcut: 'Ctrl+D',
                action: () => onDuplicate(index)
            },
            { separator: true },
            {
                id: 'delete',
                label: 'Delete',
                icon: 'fa-solid fa-trash',
                shortcut: 'Del',
                danger: true,
                action: () => onDelete(index)
            }
        ];
    }
};

/**
 * Fill Preset Zone Configuration
 * Used in CodeFillPanel for preset right-click options
 */
export const fillPresetConfig = {
    zone: 'fill-preset',
    
    /**
     * Get menu items for a fill preset
     * @param {Object} context - Context from CodeFillPanel
     * @param {Object} context.preset - The preset data
     * @param {Function} context.onRename - Rename callback
     * @param {Function} context.onDuplicate - Duplicate callback
     * @param {Function} context.onDelete - Delete callback
     * @returns {Array} Menu item configuration
     */
    getItems(context) {
        const { preset, onRename, onDuplicate, onDelete } = context;
        
        if (!preset) return [];
        
        return [
            {
                id: 'rename',
                label: 'Rename',
                icon: 'fa-solid fa-pen',
                action: () => onRename(preset)
            },
            {
                id: 'duplicate',
                label: 'Duplicate',
                icon: 'fa-solid fa-clone',
                action: () => onDuplicate(preset)
            },
            { separator: true },
            {
                id: 'delete',
                label: 'Delete',
                icon: 'fa-solid fa-trash',
                danger: true,
                action: () => onDelete(preset)
            }
        ];
    }
};

// Export all configs as array for bulk registration
export const layerMenuConfigs = [layerItemConfig, fillLayerConfig, fillPresetConfig];

export default layerMenuConfigs;
