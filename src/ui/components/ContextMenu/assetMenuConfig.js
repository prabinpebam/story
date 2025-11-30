/**
 * assetMenuConfig.js
 * Context menu configurations for asset library zones.
 * 
 * Zones covered:
 * - asset-icon: Icon library items
 * - asset-image: Image library items (future)
 */

import { store } from '../../../core/Store.js';

/**
 * Asset Icon Zone Configuration
 * Used in IconLibrary for icon right-click
 */
export const assetIconConfig = {
    zone: 'asset-icon',
    
    /**
     * Get menu items for an icon asset
     * @param {Object} context - Context from IconLibrary
     * @param {string} context.iconClass - The icon's CSS class
     * @param {HTMLElement} context.iconElement - The icon DOM element
     * @returns {Array} Menu item configuration
     */
    getItems(context) {
        const { iconClass, iconElement } = context;
        
        if (!iconClass) return [];
        
        return [
            {
                id: 'insert',
                label: 'Insert Icon',
                icon: 'fa-solid fa-plus',
                action: () => {
                    // Create a new icon element at center of canvas
                    const state = store.getState();
                    const { pan, zoom } = state.editor;
                    
                    // Calculate center of viewport
                    const viewport = document.getElementById('viewport');
                    const rect = viewport?.getBoundingClientRect() || { width: 800, height: 600 };
                    const centerX = (rect.width / 2 - pan.x) / zoom;
                    const centerY = (rect.height / 2 - pan.y) / zoom;
                    
                    store.dispatch('ADD_ELEMENT', {
                        type: 'icon',
                        iconClass: iconClass,
                        x: centerX - 24,
                        y: centerY - 24,
                        width: 48,
                        height: 48
                    });
                }
            },
            { separator: true },
            {
                id: 'copy-class',
                label: 'Copy Icon Class',
                icon: 'fa-regular fa-copy',
                action: () => {
                    navigator.clipboard.writeText(iconClass).then(() => {
                        console.log('Icon class copied:', iconClass);
                    });
                }
            },
            { separator: true },
            {
                id: 'add-to-favorites',
                label: 'Add to Favorites',
                icon: 'fa-regular fa-star',
                disabled: true, // Future feature
                action: () => {
                    // Future: Add to user favorites
                }
            }
        ];
    }
};

/**
 * Asset Image Zone Configuration (Future)
 * Used in Image Library for image right-click
 */
export const assetImageConfig = {
    zone: 'asset-image',
    
    /**
     * Get menu items for an image asset
     * @param {Object} context - Context from ImageLibrary
     * @param {string} context.imageUrl - The image URL
     * @param {string} context.imageName - The image name
     * @returns {Array} Menu item configuration
     */
    getItems(context) {
        const { imageUrl, imageName } = context;
        
        if (!imageUrl) return [];
        
        return [
            {
                id: 'insert',
                label: 'Insert Image',
                icon: 'fa-solid fa-plus',
                action: () => {
                    const state = store.getState();
                    const { pan, zoom } = state.editor;
                    
                    const viewport = document.getElementById('viewport');
                    const rect = viewport?.getBoundingClientRect() || { width: 800, height: 600 };
                    const centerX = (rect.width / 2 - pan.x) / zoom;
                    const centerY = (rect.height / 2 - pan.y) / zoom;
                    
                    store.dispatch('ADD_ELEMENT', {
                        type: 'image',
                        src: imageUrl,
                        name: imageName,
                        x: centerX - 100,
                        y: centerY - 75,
                        width: 200,
                        height: 150
                    });
                }
            },
            { separator: true },
            {
                id: 'copy-url',
                label: 'Copy Image URL',
                icon: 'fa-regular fa-copy',
                action: () => {
                    navigator.clipboard.writeText(imageUrl);
                }
            },
            { separator: true },
            {
                id: 'download',
                label: 'Download',
                icon: 'fa-solid fa-download',
                action: () => {
                    const link = document.createElement('a');
                    link.href = imageUrl;
                    link.download = imageName || 'image';
                    link.click();
                }
            }
        ];
    }
};

// Export all configs as array for bulk registration
export const assetMenuConfigs = [assetIconConfig, assetImageConfig];

export default assetMenuConfigs;
