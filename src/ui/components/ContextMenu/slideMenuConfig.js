/**
 * slideMenuConfig.js
 * Context menu configurations for slide-related zones.
 * 
 * Zones covered:
 * - slide-thumbnail: Slide list thumbnail items
 * - master-thumbnail: Master/layout thumbnail items in master mode
 */

import { store } from '../../../core/Store.js';

/**
 * Slide Thumbnail Zone Configuration
 * Used in SlideList for slide right-click
 */
export const slideThumbnailConfig = {
    zone: 'slide-thumbnail',
    
    /**
     * Get menu items for a slide thumbnail
     * @param {Object} context - Context from SlideList
     * @param {string} context.slideId - The slide ID
     * @param {Object} context.slide - The slide data
     * @param {number} context.slideIndex - Index in slide order
     * @param {boolean} context.isActive - Whether this is the active slide
     * @param {Array} context.selectedSlideIds - Currently selected slide IDs
     * @param {Function} context.startRename - Function to start rename mode
     * @returns {Array} Menu item configuration
     */
    getItems(context) {
        const { slideId, slide, slideIndex, isActive, selectedSlideIds, startRename } = context;
        
        if (!slide) return [];
        
        const state = store.getState();
        const isMultipleSelected = selectedSlideIds && selectedSlideIds.length > 1;
        const totalSlides = state.slideOrder?.length || 1;
        const canDelete = totalSlides > 1;
        
        const items = [];
        
        // Add slide options
        items.push({
            id: 'add-slide-above',
            label: 'Add Slide Above',
            icon: 'fa-solid fa-arrow-up',
            action: () => {
                store.dispatch('ADD_SLIDE', { insertIndex: slideIndex });
            }
        });
        
        items.push({
            id: 'add-slide-below',
            label: 'Add Slide Below',
            icon: 'fa-solid fa-arrow-down',
            action: () => {
                store.dispatch('ADD_SLIDE', { insertIndex: slideIndex + 1 });
            }
        });
        
        items.push({ separator: true });
        
        // Duplicate
        items.push({
            id: 'duplicate',
            label: isMultipleSelected ? 'Duplicate Slides' : 'Duplicate',
            icon: 'fa-solid fa-clone',
            shortcut: 'Ctrl+D',
            action: () => {
                if (isMultipleSelected) {
                    selectedSlideIds.forEach(id => {
                        store.dispatch('DUPLICATE_SLIDE', { id });
                    });
                } else {
                    store.dispatch('DUPLICATE_SLIDE', { id: slideId });
                }
            }
        });
        
        items.push({ separator: true });
        
        // Cut/Copy/Paste
        items.push({
            id: 'cut',
            label: isMultipleSelected ? 'Cut Slides' : 'Cut',
            icon: 'fa-solid fa-scissors',
            shortcut: 'Ctrl+X',
            disabled: !canDelete,
            action: () => {
                // For now, just copy and mark for delete
                store.dispatch('COPY_SLIDES', { slideIds: isMultipleSelected ? selectedSlideIds : [slideId] });
                // Note: actual delete on paste would need clipboard state
            }
        });
        
        items.push({
            id: 'copy',
            label: isMultipleSelected ? 'Copy Slides' : 'Copy',
            icon: 'fa-solid fa-copy',
            shortcut: 'Ctrl+C',
            action: () => {
                store.dispatch('COPY_SLIDES', { slideIds: isMultipleSelected ? selectedSlideIds : [slideId] });
            }
        });
        
        items.push({
            id: 'paste',
            label: 'Paste',
            icon: 'fa-solid fa-paste',
            shortcut: 'Ctrl+V',
            disabled: !state.editor?.clipboard?.slides,
            action: () => {
                store.dispatch('PASTE_SLIDES', { insertIndex: slideIndex + 1 });
            }
        });
        
        items.push({ separator: true });
        
        // Layout submenu
        const layouts = getAvailableLayouts(state);
        if (layouts.length > 0) {
            items.push({
                id: 'change-layout',
                label: 'Change Layout',
                icon: 'fa-solid fa-table-cells-large',
                submenu: layouts.map(layout => ({
                    id: `layout-${layout.id}`,
                    label: layout.name,
                    icon: slide.masterId === layout.id ? 'fa-solid fa-check' : null,
                    action: () => {
                        store.dispatch('SET_SLIDE_LAYOUT', { slideId, layoutId: layout.id });
                    }
                }))
            });
            
            items.push({ separator: true });
        }
        
        // Rename
        if (!isMultipleSelected) {
            items.push({
                id: 'rename',
                label: 'Rename',
                icon: 'fa-solid fa-pen',
                shortcut: 'F2',
                action: () => startRename?.()
            });
            
            items.push({ separator: true });
        }
        
        // Delete
        items.push({
            id: 'delete',
            label: isMultipleSelected ? 'Delete Slides' : 'Delete',
            icon: 'fa-solid fa-trash',
            shortcut: 'Del',
            danger: true,
            disabled: !canDelete,
            action: () => {
                if (isMultipleSelected) {
                    selectedSlideIds.forEach(id => {
                        store.dispatch('DELETE_SLIDE', id);
                    });
                } else {
                    store.dispatch('DELETE_SLIDE', slideId);
                }
            }
        });
        
        return items;
    }
};

/**
 * Master Thumbnail Zone Configuration
 * Used in SlideList for master/layout right-click in master mode
 */
export const masterThumbnailConfig = {
    zone: 'master-thumbnail',
    
    /**
     * Get menu items for a master/layout thumbnail
     * @param {Object} context - Context from SlideList
     * @param {string} context.masterId - The master/layout ID
     * @param {Object} context.master - The master/layout data
     * @param {boolean} context.isTheme - Whether this is a theme master (not layout)
     * @param {boolean} context.isActive - Whether this is the active master
     * @param {Function} context.startRename - Function to start rename mode
     * @returns {Array} Menu item configuration
     */
    getItems(context) {
        const { masterId, master, isTheme, isActive, startRename } = context;
        
        if (!master) return [];
        
        const state = store.getState();
        
        const items = [];
        
        // Edit master
        items.push({
            id: 'edit-master',
            label: isTheme ? 'Edit Theme Master' : 'Edit Layout',
            icon: 'fa-solid fa-pen-to-square',
            action: () => {
                store.dispatch('SET_ACTIVE_MASTER', masterId);
            }
        });
        
        items.push({ separator: true });
        
        // Duplicate
        items.push({
            id: 'duplicate',
            label: 'Duplicate',
            icon: 'fa-solid fa-clone',
            action: () => {
                store.dispatch('DUPLICATE_MASTER', { id: masterId });
            }
        });
        
        // Rename
        items.push({
            id: 'rename',
            label: 'Rename',
            icon: 'fa-solid fa-pen',
            shortcut: 'F2',
            action: () => startRename?.()
        });
        
        items.push({ separator: true });
        
        // Add new layout (only for theme masters)
        if (isTheme) {
            items.push({
                id: 'add-layout',
                label: 'Add New Layout',
                icon: 'fa-solid fa-plus',
                action: () => {
                    store.dispatch('ADD_LAYOUT', { parentId: masterId });
                }
            });
            
            items.push({ separator: true });
        }
        
        // Delete - check if in use
        const isInUse = isMasterInUse(state, masterId);
        const canDelete = !isInUse && !isOnlyTheme(state, masterId);
        
        items.push({
            id: 'delete',
            label: 'Delete',
            icon: 'fa-solid fa-trash',
            danger: true,
            disabled: !canDelete,
            tooltip: !canDelete 
                ? (isInUse ? 'Cannot delete: master is in use by slides' : 'Cannot delete: last theme master')
                : null,
            action: () => {
                store.dispatch('DELETE_MASTER', { id: masterId });
            }
        });
        
        return items;
    }
};

/**
 * Helper: Get available layouts for the slide's theme
 */
function getAvailableLayouts(state) {
    const masters = state.masters || {};
    const layouts = [];
    
    // Get all layouts
    Object.values(masters).forEach(master => {
        if (master.type === 'layout' || master.type === 'theme') {
            layouts.push({
                id: master.id,
                name: master.name || (master.type === 'theme' ? 'Master' : 'Layout'),
                type: master.type
            });
        }
    });
    
    return layouts;
}

/**
 * Helper: Check if a master/layout is used by any slides
 */
function isMasterInUse(state, masterId) {
    const slides = state.slides || {};
    return Object.values(slides).some(slide => slide.masterId === masterId);
}

/**
 * Helper: Check if this is the only theme master
 */
function isOnlyTheme(state, masterId) {
    const masters = state.masters || {};
    const master = masters[masterId];
    if (!master || master.type !== 'theme') return false;
    
    const themeCount = Object.values(masters).filter(m => m.type === 'theme').length;
    return themeCount <= 1;
}

// Export all configs as array for bulk registration
export const slideMenuConfigs = [slideThumbnailConfig, masterThumbnailConfig];

export default slideMenuConfigs;
