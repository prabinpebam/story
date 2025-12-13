import { getDefaultFontPreset, getPresetById as getFontPresetById } from '../../constants/FontPresets.js';
import {
    getDefaultPreset as getDefaultMasterPreset,
    getPresetById,
    getPresetList,
    materializePreset
} from '../SlideMasterPresets.js';
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
    
    if (!themeMaster || themeMaster.type !== 'slideMasterPreset') return;
    if (colorMode !== 'light' && colorMode !== 'dark') return;

    // Color mode is a master-level presentation setting.
    themeMaster.colorModeId = colorMode;
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

/**
 * Apply a font (typography) preset to a theme master.
 * Canonical behavior: update the master to reference a TypographyStylePreset.
 *
 * @param {Object} draft - Immer draft state
 * @param {Object} payload - { masterId: string, preset?: Object, presetId?: string }
 */
export function handleApplyFontPreset(draft, payload) {
    const { masterId, preset, presetId } = payload || {};
    const themeMaster = draft.slideMasterPresets?.[masterId];

    if (!themeMaster || themeMaster.type !== 'slideMasterPreset') return;

    const resolvedPreset = preset || (presetId ? getFontPresetById(presetId) : null);
    if (!resolvedPreset?.id) return;

    if (!draft.typographyStylePresets) {
        draft.typographyStylePresets = {};
    }

    let normalizedFonts;
    if (!resolvedPreset.fonts) {
        normalizedFonts = { heading: 'Inter', body: 'Inter' };
    } else {
        normalizedFonts = {
            heading: resolvedPreset.fonts.heading ?? 'Inter',
            body: resolvedPreset.fonts.body ?? 'Inter'
        };
    }

    draft.typographyStylePresets[resolvedPreset.id] = {
        id: resolvedPreset.id,
        type: 'typographyStylePreset',
        name: resolvedPreset.name || 'Custom Typography',
        description: resolvedPreset.description || 'Custom Typography Style',
        category: resolvedPreset.category || 'Custom',
        fonts: normalizedFonts,
        textStyles: resolvedPreset.styles || resolvedPreset.textStyles || {}
    };

    themeMaster.typographyStyleId = resolvedPreset.id;

    // Cleanup legacy embedded settings if any linger
    if (themeMaster.themeSettings) {
        if (themeMaster.themeSettings.fonts) delete themeMaster.themeSettings.fonts;
        if (themeMaster.themeSettings.textStyles) delete themeMaster.themeSettings.textStyles;
        if (Object.keys(themeMaster.themeSettings).length === 0) delete themeMaster.themeSettings;
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
 * Add a new master (slide master preset) after the currently selected master group.
 * @param {Object} draft - Immer draft state
 */
export function handleAddMaster(draft, payload) {
    const mastersById = draft.slideMasterPresets || {};

    // Determine the "insert after" master group based on current selection
    const activeId = draft.editor?.activeMasterId || null;
    const active = activeId ? mastersById[activeId] : null;

    let insertAfterMasterId = null;
    if (active?.type === 'slideMasterPreset') {
        insertAfterMasterId = active.id;
    } else if (active?.type === 'layoutMaster') {
        insertAfterMasterId = active.parentMasterId;
    }

    // Ensure display order exists
    if (!Array.isArray(draft.masterDisplayOrder)) {
        draft.masterDisplayOrder = Object.values(mastersById)
            .filter(m => m?.type === 'slideMasterPreset')
            .map(m => m.id);
    }

    // Choose preset (UI may provide one)
    const requestedPresetId = payload?.presetId || null;
    const requestedPreset = requestedPresetId ? getPresetById(requestedPresetId) : null;

    const defaultPreset = getDefaultMasterPreset();
    const presetId = requestedPreset?.id || defaultPreset?.id || getPresetList()?.[0]?.id || null;
    if (!presetId) return;

    const presetDef = getPresetById(presetId);
    const defaultName = presetDef?.name ? `New ${presetDef.name}` : 'New Master';
    const masterName = payload?.masterName || defaultName;

    const newMasterId = `master-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const { master, layouts } = materializePreset(presetId, {
        masterId: newMasterId,
        masterName
    });

    // Persist the preset id so the PI can display it
    master.presetId = presetId;

    draft.slideMasterPresets[newMasterId] = master;
    Object.entries(layouts || {}).forEach(([id, layout]) => {
        draft.slideMasterPresets[id] = layout;
    });

    // Insert in display order after selected master group, else append
    const idx = insertAfterMasterId ? draft.masterDisplayOrder.indexOf(insertAfterMasterId) : -1;
    if (idx >= 0) {
        draft.masterDisplayOrder.splice(idx + 1, 0, newMasterId);
    } else {
        draft.masterDisplayOrder.push(newMasterId);
    }

    // Select the new master
    draft.editor.activeMasterId = newMasterId;
}

/**
 * Add a new layout to a slide master preset.
 * Inserts after the currently selected master/layout when possible.
 * @param {Object} draft - Immer draft state
 * @param {Object} payload - { parentMasterId: string, insertAfterId?: string }
 */
export function handleAddLayout(draft, payload) {
    const parentMasterId = payload?.parentMasterId;
    const insertAfterId = payload?.insertAfterId || null;
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

        // Insert after the selected item when possible.
        // - If insertAfterId is a layout under this master, insert after it.
        // - If insertAfterId is the master itself (master selected), insert as the first layout.
        const isInsertAfterMaster = insertAfterId && insertAfterId === parentMasterId;
        if (isInsertAfterMaster) {
            parentMaster.layoutIds.splice(0, 0, newLayoutId);
        } else if (insertAfterId) {
            const idx = parentMaster.layoutIds.indexOf(insertAfterId);
            if (idx >= 0) {
                parentMaster.layoutIds.splice(idx + 1, 0, newLayoutId);
            } else {
                parentMaster.layoutIds.push(newLayoutId);
            }
        } else {
            parentMaster.layoutIds.push(newLayoutId);
        }
        
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


