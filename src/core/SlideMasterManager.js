
import { store } from './Store.js';
import { getPresetById } from './store/SlideMasterPresets.js';

/**
 * SlideMasterManager
 * 
 * High-level API for managing slide masters, layouts, and their referenced presets.
 * Enforces the "Preset Separation" architecture where masters reference themes/styles
 * rather than embedding them.
 */
export class SlideMasterManager {
    
    // ========================================================================
    // MASTER MANAGEMENT
    // ========================================================================

    /**
     * Get a master by ID from the store
     * @param {string} masterId 
     * @returns {Object|null}
     */
    getMaster(masterId) {
        const state = store.getState();
        return state.slideMasterPresets?.[masterId] || null;
    }

    /**
     * Get the active master (if in master mode) or the master for the active slide
     * @returns {Object|null}
     */
    getActiveMaster() {
        const state = store.getState();
        const mode = state.editor?.mode;
        
        if (mode === 'master') {
            const activeMasterId = state.editor?.activeMasterId;
            return this.getMaster(activeMasterId);
        } else {
            // In slide mode, get the master for the active slide's layout
            const activeSlideId = state.editor?.activeSlideId;
            const slide = state.slides?.[activeSlideId];
            if (slide?.layoutId) {
                const layout = this.getMaster(slide.layoutId);
                if (layout?.parentMasterId) {
                    return this.getMaster(layout.parentMasterId);
                }
                return layout;
            }
        }
        return null;
    }

    // ========================================================================
    // COLOR THEME OPERATIONS
    // ========================================================================

    /**
     * Apply a custom luma-locked theme to a master.
     * This creates/updates a ColorThemePreset and sets the master to reference it.
     * 
     * @param {string} masterId - The ID of the master to update
     * @param {Object} theme - The theme object { id, name, slots, adjustments, colors }
     */
    applyColorTheme(masterId, theme) {
        if (!masterId || !theme) return;
        
        store.dispatch('APPLY_LUMA_THEME', {
            masterId,
            theme
        });
    }

    /**
     * Assign an existing color theme preset to a master by ID.
     * 
     * @param {string} masterId 
     * @param {string} themeId 
     */
    assignColorTheme(masterId, themeId) {
        if (!masterId || !themeId) return;

        store.dispatch('UPDATE_MASTER_STYLE_ASSIGNMENTS', {
            masterId,
            styleAssignments: {
                colorTheme: themeId
            }
        });
    }

    /**
     * Update a specific slot in the referenced color theme.
     * 
     * @param {string} masterId 
     * @param {number} slotIndex 
     * @param {number} h - Hue (0-360)
     * @param {number} s - Saturation (0-100)
     */
    updateThemeSlot(masterId, slotIndex, h, s) {
        store.dispatch('UPDATE_LUMA_THEME_SLOT', {
            masterId,
            slotIndex,
            h,
            s
        });
    }

    /**
     * Update theme adjustments (contrast, saturation, etc.)
     * 
     * @param {string} masterId 
     * @param {Object} adjustments 
     */
    updateThemeAdjustments(masterId, adjustments) {
        store.dispatch('UPDATE_LUMA_THEME_ADJUSTMENTS', {
            masterId,
            adjustments
        });
    }

    /**
     * Set the color mode (light/dark) for the master's theme.
     * 
     * @param {string} masterId 
     * @param {string} mode - 'light' or 'dark'
     */
    setColorMode(masterId, mode) {
        store.dispatch('SET_COLOR_MODE', {
            masterId,
            colorMode: mode
        });
    }

    // ========================================================================
    // TYPOGRAPHY OPERATIONS
    // ========================================================================

    /**
     * Assign an existing typography style preset to a master by ID.
     * 
     * @param {string} masterId 
     * @param {string} styleId 
     */
    assignTypographyStyle(masterId, styleId) {
        if (!masterId || !styleId) return;

        store.dispatch('UPDATE_MASTER_STYLE_ASSIGNMENTS', {
            masterId,
            styleAssignments: {
                typographyStyle: styleId
            }
        });
    }
}

// Export singleton instance
export const slideMasterManager = new SlideMasterManager();
