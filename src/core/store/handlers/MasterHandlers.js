
import { getDefaultPreset } from '../../constants/ColorPresets.js';
import { getDefaultFontPreset, getPresetById as getFontPresetById } from '../../constants/FontPresets.js';
import { getPresetById, getPresetList, materializePreset } from '../SlideMasterPresets.js';
import { isMasterInUseBySlides } from '../../master/MasterUsage.js';

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
// MASTER PRESET HANDLER
// ========================================

/**
 * Apply a master preset to a master slide.
 * This updates the color theme, typography (from FontPresets), and background in one action.
 * Typography properties come from the font preset, only text fill colors come from the color theme.
 * @param {Object} draft - Immer draft state
 * @param {Object} payload - { masterId: string, presetId: string }
 */
export function handleApplyMasterPresetToMaster(draft, payload) {
    const { masterId, presetId } = payload;
    const themeMaster = draft.slideMasterPresets[masterId];

    // M0: Canonical-only state. Legacy theme masters are no longer supported.
    if (!themeMaster || themeMaster.type !== 'slideMasterPreset') {
        console.warn(`[ApplyPreset] Invalid master`, masterId, themeMaster?.type);
        return;
    }
    
    const presetMeta = getPresetById(presetId);
    if (!presetMeta) return;

    // Precondition (required by UX spec): If the Master slide is in use by any normal slides,
    // the preset cannot be changed. Safe-by-default: if the master has no known presetId,
    // treat any requested preset as a change.
    const currentPresetId = themeMaster?.presetId || null;
    const isChangingPreset = presetId !== currentPresetId;
    if (isChangingPreset && isMasterInUseBySlides(draft, masterId)) {
        return {
            blocked: true,
            notification: {
                type: 'blocked',
                title: "Can’t change Master preset",
                body: 'This Master slide is used by existing slides. Move those slides to a different layout/master, then try again.',
                dismissible: true,
                autoDismissMs: 0,
                actionLabel: 'Open Layout Picker'
            }
        };
    }

    // No-op if re-applying the current preset.
    if (!isChangingPreset) {
        return { blocked: false };
    }

    // Store the preset ID for reference
    themeMaster.presetId = presetId;

    // Canonical apply: materialize a template into the existing masterId.
    const { master, layouts } = materializePreset(presetId, {
        masterId,
        masterName: themeMaster.name
    });

    // Replace master fields (keep id/type stable)
    themeMaster.name = master.name;
    themeMaster.colorThemeId = master.colorThemeId;
    themeMaster.typographyStyleId = master.typographyStyleId;
    themeMaster.background = master.background;
    themeMaster.elements = master.elements;
    themeMaster.elementOrder = master.elementOrder;
    themeMaster.layoutIds = master.layoutIds;

    // Remove legacy embedded themeSettings if any linger
    if (themeMaster.themeSettings) {
        delete themeMaster.themeSettings;
    }

    // Replace child layouts under this master
    const existingChildLayoutIds = Object.keys(draft.slideMasterPresets).filter(id => {
        const m = draft.slideMasterPresets[id];
        return m?.type === 'layoutMaster' && m.parentMasterId === masterId;
    });
    for (const oldLayoutId of existingChildLayoutIds) {
        delete draft.slideMasterPresets[oldLayoutId];
    }

    Object.entries(layouts || {}).forEach(([id, layout]) => {
        draft.slideMasterPresets[id] = layout;
    });

    // Keep selection valid
    if (draft.editor?.activeMasterId && !draft.slideMasterPresets[draft.editor.activeMasterId]) {
        draft.editor.activeMasterId = masterId;
    }

    return { blocked: false };
}

// ========================================
// MASTER/LAYOUT MANAGEMENT HANDLERS
// ========================================

/**
 * Add a new layout to a slide master preset.
 * @param {Object} draft - Immer draft state
 * @param {Object} payload - { parentMasterId: string }
 */
export function handleAddLayout(draft, payload) {
    const parentMasterId = payload?.parentMasterId;
    const parentMaster = parentMasterId ? draft.slideMasterPresets[parentMasterId] : null;
    
    if (parentMaster && parentMaster.type === 'slideMasterPreset') {
        const newLayoutId = `layout-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        // Create new blank layout
        const newLayout = {
            id: newLayoutId,
            type: 'layoutMaster',
            parentMasterId,
            name: 'Custom Layout',
            background: null,
            colorThemeId: null,
            typographyStyleId: null,
            elements: {},
            elementOrder: []
        };
        
        draft.slideMasterPresets[newLayoutId] = newLayout;

        if (!Array.isArray(parentMaster.layoutIds)) {
            parentMaster.layoutIds = [];
        }
        parentMaster.layoutIds.push(newLayoutId);
        
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
    
    if (master.type === 'layoutMaster') {
        // Duplicate Layout
        const newId = `layout-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const newLayout = JSON.parse(JSON.stringify(master));
        newLayout.id = newId;
        newLayout.name = `${master.name} (Copy)`;
        
        draft.slideMasterPresets[newId] = newLayout;

        const parent = master.parentMasterId ? draft.slideMasterPresets[master.parentMasterId] : null;
        if (parent?.type === 'slideMasterPreset') {
            if (!Array.isArray(parent.layoutIds)) parent.layoutIds = [];
            const idx = parent.layoutIds.indexOf(id);
            if (idx >= 0) {
                parent.layoutIds.splice(idx + 1, 0, newId);
            } else {
                parent.layoutIds.push(newId);
            }
        }
        draft.editor.activeMasterId = newId;
        
    } else if (master.type === 'slideMasterPreset') {
        // Duplicate Master
        const newThemeId = `master-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const newTheme = JSON.parse(JSON.stringify(master));
        newTheme.id = newThemeId;
        newTheme.name = `${master.name} (Copy)`;
        
        // Add new theme
        draft.slideMasterPresets[newThemeId] = newTheme;

        if (!Array.isArray(newTheme.layoutIds)) newTheme.layoutIds = [];
        const nextLayoutIds = [];
        
        // Duplicate all child layouts
        for (const layoutId of master.layoutIds || []) {
            const layout = draft.slideMasterPresets[layoutId];
            if (!layout || layout.type !== 'layoutMaster') continue;

            const newLayoutId = `layout-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
            const newLayout = JSON.parse(JSON.stringify(layout));
            newLayout.id = newLayoutId;
            newLayout.parentMasterId = newThemeId;
            draft.slideMasterPresets[newLayoutId] = newLayout;
            nextLayoutIds.push(newLayoutId);
        }

        newTheme.layoutIds = nextLayoutIds;

        // Maintain display order
        if (!draft.masterDisplayOrder) {
            draft.masterDisplayOrder = Object.values(draft.slideMasterPresets)
                .filter(m => m.type === 'slideMasterPreset')
                .map(m => m.id);
        } else {
            const idx = draft.masterDisplayOrder.indexOf(id);
            if (idx >= 0) {
                draft.masterDisplayOrder.splice(idx + 1, 0, newThemeId);
            } else {
                draft.masterDisplayOrder.push(newThemeId);
            }
        }
        
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
        if (master.type === 'layoutMaster') return slide.layoutId === id;
        if (master.type === 'slideMasterPreset') {
            const layout = draft.slideMasterPresets[slide.layoutId];
            return layout?.type === 'layoutMaster' && layout.parentMasterId === id;
        }
        return false;
    });
    
    if (isInUse) {
        console.warn('Cannot delete master/layout that is in use');
        return;
    }
    
    if (master.type === 'layoutMaster') {
        // Delete layout
        delete draft.slideMasterPresets[id];

        const parent = master.parentMasterId ? draft.slideMasterPresets[master.parentMasterId] : null;
        if (parent?.type === 'slideMasterPreset' && Array.isArray(parent.layoutIds)) {
            parent.layoutIds = parent.layoutIds.filter(lid => lid !== id);
        }
        
        // If active, switch to parent theme
        if (draft.editor.activeMasterId === id) {
            draft.editor.activeMasterId = master.parentMasterId;
        }
        
    } else if (master.type === 'slideMasterPreset') {
        // Check if it's the last master
        const themeCount = Object.values(draft.slideMasterPresets).filter(m => m.type === 'slideMasterPreset').length;
        if (themeCount <= 1) {
            console.warn('Cannot delete the last theme');
            return;
        }
        
        // Delete child layouts
        for (const layoutId of master.layoutIds || []) {
            const layout = draft.slideMasterPresets[layoutId];
            if (layout?.type === 'layoutMaster' && layout.parentMasterId === id) {
                delete draft.slideMasterPresets[layoutId];
            }
        }

        // Delete master
        delete draft.slideMasterPresets[id];

        // Remove from display order
        if (Array.isArray(draft.masterDisplayOrder)) {
            draft.masterDisplayOrder = draft.masterDisplayOrder.filter(mid => mid !== id);
        }
        
        // If active was this theme or one of its layouts, switch to another theme
        const active = draft.slideMasterPresets[draft.editor.activeMasterId];
        if (draft.editor.activeMasterId === id || (active?.type === 'layoutMaster' && active.parentMasterId === id)) {
            const otherTheme = Object.values(draft.slideMasterPresets).find(m => m.type === 'slideMasterPreset');
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

/**
 * Reorder masters in the list by adjusting display order.
 * Since masters are stored as an object, we maintain a separate displayOrder array.
 * @param {Object} draft - Immer draft state
 * @param {Object} payload - { draggedId: string, targetId: string, insertBefore: boolean }
 */
export function handleReorderMasters(draft, payload) {
    const { draggedId, targetId, insertBefore } = payload;
    
    // Initialize masterDisplayOrder if it doesn't exist
    if (!draft.masterDisplayOrder) {
        // Create initial order from existing masters
        const themes = Object.values(draft.slideMasterPresets)
            .filter(m => m.type === 'slideMasterPreset')
            .map(m => m.id);
        draft.masterDisplayOrder = themes;
    }
    
    const currentOrder = draft.masterDisplayOrder;
    const draggedIndex = currentOrder.indexOf(draggedId);
    const targetIndex = currentOrder.indexOf(targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) {
        console.warn('Invalid master IDs for reordering');
        return;
    }
    
    // Remove dragged item
    currentOrder.splice(draggedIndex, 1);
    
    // Calculate new target index (after removal)
    let newTargetIndex = currentOrder.indexOf(targetId);
    
    // Insert based on position
    if (insertBefore) {
        currentOrder.splice(newTargetIndex, 0, draggedId);
    } else {
        currentOrder.splice(newTargetIndex + 1, 0, draggedId);
    }
}


