
import { getDefaultPreset } from '../../constants/ColorPresets.js';
import { getDefaultFontPreset } from '../../constants/FontPresets.js';
import { getPresetById, getFullPresetById } from '../SlideMasterPresets.js';

// ========================================
// LUMA-LOCKED THEME HANDLERS (REFACTORED)
// ========================================

/**
 * Apply a luma-locked color theme.
 * Updates the master to REFERENCE a ColorThemePreset.
 * Creates/Updates the preset in the library.
 * 
 * @param {Object} draft - Immer draft state
 * @param {Object} payload - { masterId: string, theme: { id, name, slots, adjustments, colors } }
 */
export function handleApplyLumaTheme(draft, payload) {
    const { masterId, theme } = payload;
    const themeMaster = draft.slideMasterPresets[masterId];
    
    if (themeMaster && themeMaster.type === 'slideMasterPreset' && theme) {
        // 1. Ensure colorThemePresets exists
        if (!draft.colorThemePresets) {
            draft.colorThemePresets = {};
        }

        // 2. Create or Update the ColorThemePreset
        // We store the luma definition within the preset for editing support
        draft.colorThemePresets[theme.id] = {
            id: theme.id,
            type: 'colorThemePreset',
            name: theme.name,
            description: theme.description || "Custom Luma Theme",
            category: "Custom",
            isDark: theme.isDark || false, // Default to light if not specified
            
            // Store luma-specific data for the generator/editor
            lumaTheme: {
                id: theme.id,
                name: theme.name,
                slots: theme.slots,
                adjustments: theme.adjustments || {},
                isInverted: theme.isInverted || false,
                resolvedColors: theme.colors // Store the array for backward compatibility
            },
            
            // Populate standard colors object if possible
            // For now, we leave it empty or partial as we rely on lumaTheme.resolvedColors
            colors: {} 
        };

        // 3. Update the Master to REFERENCE the preset
        themeMaster.colorThemeId = theme.id;
        
        // 4. Cleanup old embedded settings (Migration)
        if (themeMaster.themeSettings) {
            delete themeMaster.themeSettings;
        }
    }
}

/**
 * Update a single slot in the luma-locked theme.
 * Updates the REFERENCED preset.
 * 
 * @param {Object} draft - Immer draft state
 * @param {Object} payload - { masterId: string, slotIndex: number, h: number, s: number }
 */
export function handleUpdateLumaThemeSlot(draft, payload) {
    const { masterId, slotIndex, h, s } = payload;
    const themeMaster = draft.slideMasterPresets[masterId];
    
    if (themeMaster?.colorThemeId) {
        const themeId = themeMaster.colorThemeId;
        const preset = draft.colorThemePresets?.[themeId];
        
        if (preset?.lumaTheme?.slots && slotIndex >= 0 && slotIndex < 12) {
            preset.lumaTheme.slots[slotIndex] = { h, s };
        }
    }
}

/**
 * Update adjustments in the luma-locked theme.
 * Updates the REFERENCED preset.
 * 
 * @param {Object} draft - Immer draft state
 * @param {Object} payload - { masterId: string, adjustments: Object }
 */
export function handleUpdateLumaThemeAdjustments(draft, payload) {
    const { masterId, adjustments } = payload;
    const themeMaster = draft.slideMasterPresets[masterId];
    
    if (themeMaster?.colorThemeId) {
        const themeId = themeMaster.colorThemeId;
        const preset = draft.colorThemePresets?.[themeId];
        
        if (preset?.lumaTheme && adjustments) {
            preset.lumaTheme.adjustments = {
                ...preset.lumaTheme.adjustments,
                ...adjustments
            };
        }
    }
}

/**
 * Set the color mode (light/dark) for the luma-locked theme.
 * Updates the REFERENCED preset.
 * 
 * @param {Object} draft - Immer draft state
 * @param {Object} payload - { masterId: string, colorMode: 'light' | 'dark' }
 */
export function handleSetColorMode(draft, payload) {
    const { masterId, colorMode } = payload;
    const themeMaster = draft.slideMasterPresets[masterId];
    
    if (themeMaster?.colorThemeId && (colorMode === 'light' || colorMode === 'dark')) {
        const themeId = themeMaster.colorThemeId;
        const preset = draft.colorThemePresets?.[themeId];
        
        if (preset) {
            // Update standard property
            preset.isDark = (colorMode === 'dark');
            
            // Update luma specific property if it exists
            if (preset.lumaTheme) {
                preset.lumaTheme.colorMode = colorMode;
            }
        }
    }
}

/**
 * Update styleAssignments on a master (theme or layout).
 * Used for assigning colorTheme overrides to layout masters.
 * 
 * @param {Object} draft - Immer draft state
 * @param {Object} payload - { masterId: string, styleAssignments: { colorTheme?: string, ... } }
 */
export function handleUpdateMasterStyleAssignments(draft, payload) {
    const { masterId, styleAssignments } = payload;
    const master = draft.slideMasterPresets[masterId];
    
    if (master && styleAssignments) {
        // Direct property updates for references
        if (styleAssignments.colorTheme !== undefined) {
            master.colorThemeId = styleAssignments.colorTheme;
        }
        if (styleAssignments.typographyStyle !== undefined) {
            master.typographyStyleId = styleAssignments.typographyStyle;
        }
        
        // Legacy cleanup if needed
        if (master.styleAssignments) {
            delete master.styleAssignments;
        }
    }
}

// ========================================
// LEGACY COLOR HANDLERS
// ========================================

export function handleUpdateMaster(draft, payload) {
    const masters = draft.slideMasterPresets;
    const masterToUpdate = masters[payload.id];

    if (masterToUpdate) {
        Object.assign(masterToUpdate, payload);
    }
}

export function handleUpdateThemeSettings(draft, payload) {
    const { id, settings } = payload;
    const themeMaster = draft.slideMasterPresets[id];
    
    if (themeMaster && themeMaster.type === 'slideMasterPreset') {
        if (!themeMaster.themeSettings) {
            themeMaster.themeSettings = { colors: {}, fonts: {} };
        }

        if (settings.colors) {
            Object.assign(themeMaster.themeSettings.colors, settings.colors);
        }
        
        if (settings.fonts) {
            Object.assign(themeMaster.themeSettings.fonts, settings.fonts);
        }
    }
}

/**
 * Apply a color preset to a theme master.
 * Replaces all 12 color roles at once.
 * @param {Object} draft - Immer draft state
 * @param {Object} payload - { masterId: string, preset: { colors: {...} } }
 */
export function handleApplyColorPreset(draft, payload) {
    const { masterId, preset } = payload;
    const themeMaster = draft.slideMasterPresets[masterId];
    
    if (themeMaster && themeMaster.type === 'slideMasterPreset' && preset?.colors) {
        if (!themeMaster.themeSettings) {
            themeMaster.themeSettings = { colors: {}, fonts: {} };
        }
        
        // Replace all color values with preset colors
        themeMaster.themeSettings.colors = {
            ...preset.colors,
            // Maintain legacy aliases for backwards compatibility
            accent: preset.colors.accent1,
            textPrimary: preset.colors.text1,
            textSecondary: preset.colors.text2
        };
    }
}

/**
 * Reset theme colors to default preset.
 * @param {Object} draft - Immer draft state
 * @param {Object} payload - { masterId: string }
 */
export function handleResetThemeColors(draft, payload) {
    const { masterId } = payload;
    const themeMaster = draft.slideMasterPresets[masterId];
    
    if (themeMaster && themeMaster.type === 'slideMasterPreset') {
        const defaultPreset = getDefaultPreset();
        
        if (!themeMaster.themeSettings) {
            themeMaster.themeSettings = { colors: {}, fonts: {} };
        }
        
        themeMaster.themeSettings.colors = {
            ...defaultPreset.colors,
            // Legacy aliases
            accent: defaultPreset.colors.accent1,
            textPrimary: defaultPreset.colors.text1,
            textSecondary: defaultPreset.colors.text2
        };
    }
}

/**
 * Update a single color role in theme settings.
 * @param {Object} draft - Immer draft state
 * @param {Object} payload - { masterId: string, colorRole: string, value: string }
 */
export function handleUpdateThemeColor(draft, payload) {
    const { masterId, colorRole, value } = payload;
    const themeMaster = draft.slideMasterPresets[masterId];
    
    if (themeMaster && themeMaster.type === 'slideMasterPreset') {
        if (!themeMaster.themeSettings) {
            themeMaster.themeSettings = { colors: {}, fonts: {} };
        }
        if (!themeMaster.themeSettings.colors) {
            themeMaster.themeSettings.colors = {};
        }
        
        themeMaster.themeSettings.colors[colorRole] = value;
        
        // Update legacy aliases if applicable
        if (colorRole === 'accent1') {
            themeMaster.themeSettings.colors.accent = value;
        } else if (colorRole === 'text1') {
            themeMaster.themeSettings.colors.textPrimary = value;
        } else if (colorRole === 'text2') {
            themeMaster.themeSettings.colors.textSecondary = value;
        }
    }
}

// ========================================
// TYPOGRAPHY HANDLERS
// ========================================

/**
 * Apply a font preset to a theme master.
 * Updates the master to REFERENCE a TypographyStylePreset.
 * Creates/Updates the preset in the library.
 * 
 * @param {Object} draft - Immer draft state
 * @param {Object} payload - { masterId: string, preset: { id, name, fonts, styles } }
 */
export function handleApplyFontPreset(draft, payload) {
    const { masterId, preset } = payload;
    const themeMaster = draft.slideMasterPresets[masterId];
    
    if (themeMaster && themeMaster.type === 'slideMasterPreset' && preset) {
        // 1. Ensure typographyStylePresets exists
        if (!draft.typographyStylePresets) {
            draft.typographyStylePresets = {};
        }

        // 2. Create or Update the TypographyStylePreset
        draft.typographyStylePresets[preset.id] = {
            id: preset.id,
            type: 'typographyStylePreset',
            name: preset.name,
            description: preset.description || "Custom Typography Style",
            category: preset.category || "Custom",
            fonts: preset.fonts || { heading: 'Inter', body: 'Inter' },
            textStyles: preset.styles || preset.textStyles || {}
        };

        // 3. Update the Master to REFERENCE the preset
        themeMaster.typographyStyleId = preset.id;
        
        // 4. Cleanup old embedded settings (Migration)
        if (themeMaster.themeSettings) {
            if (themeMaster.themeSettings.fonts) delete themeMaster.themeSettings.fonts;
            if (themeMaster.themeSettings.textStyles) delete themeMaster.themeSettings.textStyles;
            
            // Remove themeSettings if empty
            if (Object.keys(themeMaster.themeSettings).length === 0) {
                delete themeMaster.themeSettings;
            }
        }
    }
}

/**
 * Reset theme fonts to default preset.
 * Updates the REFERENCED preset to the default one.
 * 
 * @param {Object} draft - Immer draft state
 * @param {Object} payload - { masterId: string }
 */
export function handleResetThemeFonts(draft, payload) {
    const { masterId } = payload;
    const themeMaster = draft.slideMasterPresets[masterId];
    
    if (themeMaster && themeMaster.type === 'slideMasterPreset') {
        const defaultPreset = getDefaultFontPreset();
        
        // Reuse the apply handler
        handleApplyFontPreset(draft, {
            masterId,
            preset: defaultPreset
        });
    }
}

/**
 * Update a single font (heading or body) in the referenced preset.
 * 
 * @param {Object} draft - Immer draft state
 * @param {Object} payload - { masterId: string, fontType: 'heading'|'body', value: string }
 */
export function handleUpdateThemeFont(draft, payload) {
    const { masterId, fontType, value } = payload;
    const themeMaster = draft.slideMasterPresets[masterId];
    
    if (themeMaster?.typographyStyleId && (fontType === 'heading' || fontType === 'body')) {
        const styleId = themeMaster.typographyStyleId;
        const preset = draft.typographyStylePresets?.[styleId];
        
        if (preset) {
            if (!preset.fonts) preset.fonts = {};
            preset.fonts[fontType] = value;
        }
    }
}

/**
 * Update a text style property in the referenced preset.
 * 
 * @param {Object} draft - Immer draft state
 * @param {Object} payload - { masterId: string, styleId: string, property: string, value: any }
 */
export function handleUpdateTextStyle(draft, payload) {
    const { masterId, styleId, property, value } = payload;
    const themeMaster = draft.slideMasterPresets[masterId];
    
    if (themeMaster?.typographyStyleId) {
        const presetId = themeMaster.typographyStyleId;
        const preset = draft.typographyStylePresets?.[presetId];
        
        if (preset) {
            if (!preset.textStyles) preset.textStyles = {};
            if (!preset.textStyles[styleId]) {
                preset.textStyles[styleId] = { id: styleId, name: styleId };
            }
            
            preset.textStyles[styleId][property] = value;
        }
    }
}

// ========================================
// ELEMENT MANAGEMENT FOR MASTERS
// ========================================

/**
 * Add an element (typically a placeholder) to a master/layout.
 * @param {Object} draft - Immer draft state
 * @param {Object} payload - { masterId: string, element: Object }
 */
export function handleAddElementToMaster(draft, payload) {
    const { masterId, element } = payload;
    const master = draft.slideMasterPresets[masterId];
    
    if (master && element && element.id) {
        // Initialize elements object if needed
        if (!master.elements) {
            master.elements = {};
        }
        if (!master.elementOrder) {
            master.elementOrder = [];
        }
        
        // Add element
        master.elements[element.id] = element;
        
        // Add to element order if not already present
        if (!master.elementOrder.includes(element.id)) {
            master.elementOrder.push(element.id);
        }
    }
}

/**
 * Delete an element from a master/layout.
 * @param {Object} draft - Immer draft state
 * @param {Object} payload - { masterId: string, elementId: string }
 */
export function handleDeleteElementFromMaster(draft, payload) {
    const { masterId, elementId } = payload;
    const master = draft.slideMasterPresets[masterId];
    
    if (master && master.elements && master.elements[elementId]) {
        // Remove from elements
        delete master.elements[elementId];
        
        // Remove from element order
        if (master.elementOrder) {
            const index = master.elementOrder.indexOf(elementId);
            if (index > -1) {
                master.elementOrder.splice(index, 1);
            }
        }
        
        // Clear selection if this element was selected
        if (draft.editor.selectedElementIds?.includes(elementId)) {
            draft.editor.selectedElementIds = draft.editor.selectedElementIds.filter(id => id !== elementId);
        }
    }
}

// ========================================
// SLIDE MASTER PRESET HANDLER
// ========================================

/**
 * Apply a slide master preset to a theme master.
 * This updates the color theme, typography (from FontPresets), and background in one action.
 * Typography properties come from the font preset, only text fill colors come from the color theme.
 * @param {Object} draft - Immer draft state
 * @param {Object} payload - { masterId: string, presetId: string }
 */
export function handleApplySlideMasterPreset(draft, payload) {
    const { masterId, presetId } = payload;
    const themeMaster = draft.slideMasterPresets[masterId];
    
    if (!themeMaster || themeMaster.type !== 'theme') {
        console.warn(`[ApplyPreset] Invalid theme master`, masterId, themeMaster?.type);
        return;
    }
    
    const fullPreset = getFullPresetById(presetId);
    if (!fullPreset) {
        return;
    }
    
    const presetTheme = fullPreset.theme;
    
    // Store the preset ID for reference
    themeMaster.presetId = presetId;
    
    // Initialize themeSettings if needed
    if (!themeMaster.themeSettings) {
        themeMaster.themeSettings = { colors: {}, fonts: {}, textStyles: {} };
    }
    
    // 1. Apply luma theme (color theme) from preset
    if (presetTheme.themeSettings?.lumaTheme) {
        themeMaster.themeSettings.lumaTheme = { ...presetTheme.themeSettings.lumaTheme };
    }
    
    // 2. Store font preset ID reference
    if (presetTheme.themeSettings?.fontPresetId) {
        themeMaster.themeSettings.fontPresetId = presetTheme.themeSettings.fontPresetId;
    }
    
    // 3. Apply font settings (from FontPresets - includes family, weight, fallback)
    if (presetTheme.themeSettings?.fonts) {
        themeMaster.themeSettings.fonts = { ...presetTheme.themeSettings.fonts };
    }
    
    // 4. Apply text styles (typography from FontPresets, colors from theme slots)
    if (presetTheme.themeSettings?.textStyles) {
        themeMaster.themeSettings.textStyles = JSON.parse(JSON.stringify(presetTheme.themeSettings.textStyles));
    }
    
    // 5. Apply background from preset
    if (presetTheme.background) {
        themeMaster.background = JSON.parse(JSON.stringify(presetTheme.background));
    }
    
    // 6. Update layout masters with preset's placeholder elements
    // This applies the theme-linked textFill to the actual placeholders
    const presetLayouts = fullPreset.layouts;
    if (presetLayouts) {
        
        // Find existing layout masters that belong to this theme
        const existingLayoutIds = Object.keys(draft.slideMasterPresets).filter(id => {
            const master = draft.slideMasterPresets[id];
            return master.type === 'layout' && master.parentId === masterId;
        });
        
        // Map preset layout names to existing layouts by their layout type
        // e.g., "Title Slide" preset layout -> existing layout with same name
        const presetLayoutArray = Object.values(presetLayouts);
        
        existingLayoutIds.forEach(existingLayoutId => {
            const existingLayout = draft.slideMasterPresets[existingLayoutId];
            
            // Find matching preset layout by name
            const matchingPresetLayout = presetLayoutArray.find(
                pl => pl.name === existingLayout.name
            );
            
            if (matchingPresetLayout) {
                // Update elements with theme-linked textFill
                existingLayout.elements = JSON.parse(JSON.stringify(matchingPresetLayout.elements));
                existingLayout.elementOrder = [...matchingPresetLayout.elementOrder];
            }
        });
    }
    
}

// ========================================
// MASTER/LAYOUT MANAGEMENT HANDLERS
// ========================================

/**
 * Add a new layout to a theme master.
 * @param {Object} draft - Immer draft state
 * @param {Object} payload - { parentId: string }
 */
export function handleAddLayout(draft, payload) {
    const { parentId } = payload;
    const parentTheme = draft.slideMasterPresets[parentId];
    
    if (parentTheme && (parentTheme.type === 'theme' || parentTheme.type === 'slideMasterPreset')) {
        const newLayoutId = `layout-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        // Create new blank layout
        const newLayout = {
            id: newLayoutId,
            type: 'layout',
            parentId: parentId,
            name: 'Custom Layout',
            background: { type: 'inherited' },
            elements: {},
            elementOrder: []
        };
        
        draft.slideMasterPresets[newLayoutId] = newLayout;
        
        // Select the new layout
        draft.editor.activeMasterId = newLayoutId;
    }
}

/**
 * Duplicate a master (theme or layout).
 * @param {Object} draft - Immer draft state
 * @param {Object} payload - { id: string }
 */
export function handleDuplicateMaster(draft, payload) {
    const { id } = payload;
    const master = draft.slideMasterPresets[id];
    
    if (!master) return;
    
    if (master.type === 'layout' || master.type === 'layoutMaster') {
        // Duplicate Layout
        const newId = `layout-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const newLayout = JSON.parse(JSON.stringify(master));
        newLayout.id = newId;
        newLayout.name = `${master.name} (Copy)`;
        
        draft.slideMasterPresets[newId] = newLayout;
        draft.editor.activeMasterId = newId;
        
    } else if (master.type === 'theme' || master.type === 'slideMasterPreset') {
        // Duplicate Theme
        const newThemeId = `theme-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const newTheme = JSON.parse(JSON.stringify(master));
        newTheme.id = newThemeId;
        newTheme.name = `${master.name} (Copy)`;
        
        // Add new theme
        draft.slideMasterPresets[newThemeId] = newTheme;
        
        // Duplicate all child layouts
        Object.values(draft.slideMasterPresets).forEach(m => {
            if (m.type === 'layout' && m.parentId === id) {
                const newLayoutId = `layout-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
                const newLayout = JSON.parse(JSON.stringify(m));
                newLayout.id = newLayoutId;
                newLayout.parentId = newThemeId;
                draft.slideMasterPresets[newLayoutId] = newLayout;
            }
        });
        
        draft.editor.activeMasterId = newThemeId;
    }
}

/**
 * Delete a master (theme or layout).
 * @param {Object} draft - Immer draft state
 * @param {Object} payload - { id: string }
 */
export function handleDeleteMaster(draft, payload) {
    const { id } = payload;
    const master = draft.slideMasterPresets[id];
    
    if (!master) return;
    
    // Helper: Check if master is in use
    const isInUse = Object.values(draft.slides).some(slide => {
        if (master.type === 'layout' || master.type === 'layoutMaster') return slide.layoutId === id;
        // For theme, check if any of its layouts are used
        if (master.type === 'theme' || master.type === 'slideMasterPreset') {
            const layout = draft.slideMasterPresets[slide.layoutId];
            return layout && layout.parentId === id;
        }
        return false;
    });
    
    if (isInUse) {
        console.warn('Cannot delete master/layout that is in use');
        return;
    }
    
    if (master.type === 'layout' || master.type === 'layoutMaster') {
        // Delete layout
        delete draft.slideMasterPresets[id];
        
        // If active, switch to parent theme
        if (draft.editor.activeMasterId === id) {
            draft.editor.activeMasterId = master.parentId;
        }
        
    } else if (master.type === 'theme' || master.type === 'slideMasterPreset') {
        // Check if it's the last theme
        const themeCount = Object.values(draft.slideMasterPresets).filter(m => m.type === 'theme' || m.type === 'slideMasterPreset').length;
        if (themeCount <= 1) {
            console.warn('Cannot delete the last theme');
            return;
        }
        
        // Delete theme
        delete draft.slideMasterPresets[id];
        
        // Delete all child layouts
        Object.keys(draft.slideMasterPresets).forEach(key => {
            const m = draft.slideMasterPresets[key];
            if ((m.type === 'layout' || m.type === 'layoutMaster') && m.parentId === id) {
                delete draft.slideMasterPresets[key];
            }
        });
        
        // If active was this theme or one of its layouts, switch to another theme
        if (draft.editor.activeMasterId === id || draft.slideMasterPresets[draft.editor.activeMasterId]?.parentId === id) {
            const otherTheme = Object.values(draft.slideMasterPresets).find(m => m.type === 'theme' || m.type === 'slideMasterPreset');
            if (otherTheme) {
                draft.editor.activeMasterId = otherTheme.id;
            }
        }
    }
}

/**
 * Rename a master (theme or layout).
 * @param {Object} draft - Immer draft state
 * @param {Object} payload - { id: string, name: string }
 */
export function handleRenameMaster(draft, payload) {
    const { id, name } = payload;
    const master = draft.slideMasterPresets[id];
    
    if (master) {
        master.name = name;
    }
}


