
import { getDefaultPreset } from '../../constants/ColorPresets.js';
import { getDefaultFontPreset } from '../../constants/FontPresets.js';
import { getPresetById, getFullPresetById } from '../SlideMasterPresets.js';

// ========================================
// LUMA-LOCKED THEME HANDLERS
// ========================================

/**
 * Apply a luma-locked color theme.
 * The theme contains 12 slots with fixed luma values and variable H/S.
 * @param {Object} draft - Immer draft state
 * @param {Object} payload - { masterId: string, theme: { id, name, slots, adjustments } }
 */
export function handleApplyLumaTheme(draft, payload) {
    const { masterId, theme } = payload;
    const themeMaster = draft.masters[masterId];
    
    if (themeMaster && themeMaster.type === 'theme' && theme) {
        if (!themeMaster.themeSettings) {
            themeMaster.themeSettings = { colors: {}, fonts: {}, textStyles: {} };
        }
        
        // Store the luma-locked theme data
        themeMaster.themeSettings.lumaTheme = {
            id: theme.id,
            name: theme.name,
            slots: theme.slots,
            adjustments: theme.adjustments || {},
            isInverted: theme.isInverted || false
        };
        
        // Also compute and store the resolved colors for easy access
        if (theme.colors && Array.isArray(theme.colors)) {
            themeMaster.themeSettings.lumaTheme.resolvedColors = theme.colors;
        }
    }
}

/**
 * Update a single slot in the luma-locked theme.
 * @param {Object} draft - Immer draft state
 * @param {Object} payload - { masterId: string, slotIndex: number, h: number, s: number }
 */
export function handleUpdateLumaThemeSlot(draft, payload) {
    const { masterId, slotIndex, h, s } = payload;
    const themeMaster = draft.masters[masterId];
    
    if (themeMaster?.themeSettings?.lumaTheme?.slots && 
        slotIndex >= 0 && slotIndex < 12) {
        themeMaster.themeSettings.lumaTheme.slots[slotIndex] = { h, s };
    }
}

/**
 * Update adjustments in the luma-locked theme.
 * @param {Object} draft - Immer draft state
 * @param {Object} payload - { masterId: string, adjustments: Object }
 */
export function handleUpdateLumaThemeAdjustments(draft, payload) {
    const { masterId, adjustments } = payload;
    const themeMaster = draft.masters[masterId];
    
    if (themeMaster?.themeSettings?.lumaTheme && adjustments) {
        themeMaster.themeSettings.lumaTheme.adjustments = {
            ...themeMaster.themeSettings.lumaTheme.adjustments,
            ...adjustments
        };
    }
}

// ========================================
// LEGACY COLOR HANDLERS
// ========================================

export function handleUpdateMaster(draft, payload) {
    const masters = draft.masters;
    const masterToUpdate = masters[payload.id];

    if (masterToUpdate) {
        Object.assign(masterToUpdate, payload);
    }
}

export function handleUpdateThemeSettings(draft, payload) {
    const { id, settings } = payload;
    const themeMaster = draft.masters[id];
    
    if (themeMaster && themeMaster.type === 'theme') {
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
    const themeMaster = draft.masters[masterId];
    
    if (themeMaster && themeMaster.type === 'theme' && preset?.colors) {
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
    const themeMaster = draft.masters[masterId];
    
    if (themeMaster && themeMaster.type === 'theme') {
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
    const themeMaster = draft.masters[masterId];
    
    if (themeMaster && themeMaster.type === 'theme') {
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
 * Updates both fonts and text styles.
 * @param {Object} draft - Immer draft state
 * @param {Object} payload - { masterId: string, preset: { fonts: {...}, styles: {...} } }
 */
export function handleApplyFontPreset(draft, payload) {
    const { masterId, preset } = payload;
    const themeMaster = draft.masters[masterId];
    
    if (themeMaster && themeMaster.type === 'theme' && preset) {
        if (!themeMaster.themeSettings) {
            themeMaster.themeSettings = { colors: {}, fonts: {}, textStyles: {} };
        }
        
        // Update fonts (heading/body font families)
        if (preset.fonts) {
            themeMaster.themeSettings.fonts = {
                heading: preset.fonts.heading?.family || 'Inter',
                body: preset.fonts.body?.family || 'Inter'
            };
        }
        
        // Update text styles if provided
        if (preset.styles && themeMaster.themeSettings.textStyles) {
            // Merge preset styles with existing text styles
            Object.keys(preset.styles).forEach(styleId => {
                if (themeMaster.themeSettings.textStyles[styleId]) {
                    Object.assign(themeMaster.themeSettings.textStyles[styleId], preset.styles[styleId]);
                }
            });
        }
    }
}

/**
 * Reset theme fonts to default preset.
 * @param {Object} draft - Immer draft state
 * @param {Object} payload - { masterId: string }
 */
export function handleResetThemeFonts(draft, payload) {
    const { masterId } = payload;
    const themeMaster = draft.masters[masterId];
    
    if (themeMaster && themeMaster.type === 'theme') {
        const defaultPreset = getDefaultFontPreset();
        
        if (!themeMaster.themeSettings) {
            themeMaster.themeSettings = { colors: {}, fonts: {}, textStyles: {} };
        }
        
        // Reset fonts to default
        if (defaultPreset?.fonts) {
            themeMaster.themeSettings.fonts = {
                heading: defaultPreset.fonts.heading?.family || 'Inter',
                body: defaultPreset.fonts.body?.family || 'Inter'
            };
        }
    }
}

/**
 * Update a single font (heading or body) in theme settings.
 * @param {Object} draft - Immer draft state
 * @param {Object} payload - { masterId: string, fontType: 'heading'|'body', value: string }
 */
export function handleUpdateThemeFont(draft, payload) {
    const { masterId, fontType, value } = payload;
    const themeMaster = draft.masters[masterId];
    
    if (themeMaster && themeMaster.type === 'theme' && (fontType === 'heading' || fontType === 'body')) {
        if (!themeMaster.themeSettings) {
            themeMaster.themeSettings = { colors: {}, fonts: {}, textStyles: {} };
        }
        if (!themeMaster.themeSettings.fonts) {
            themeMaster.themeSettings.fonts = { heading: 'Inter', body: 'Inter' };
        }
        
        themeMaster.themeSettings.fonts[fontType] = value;
    }
}

/**
 * Update a text style property in theme settings.
 * @param {Object} draft - Immer draft state
 * @param {Object} payload - { masterId: string, styleId: string, property: string, value: any }
 */
export function handleUpdateTextStyle(draft, payload) {
    const { masterId, styleId, property, value } = payload;
    const themeMaster = draft.masters[masterId];
    
    if (themeMaster && themeMaster.type === 'theme') {
        if (!themeMaster.themeSettings) {
            themeMaster.themeSettings = { colors: {}, fonts: {}, textStyles: {} };
        }
        if (!themeMaster.themeSettings.textStyles) {
            themeMaster.themeSettings.textStyles = {};
        }
        if (!themeMaster.themeSettings.textStyles[styleId]) {
            themeMaster.themeSettings.textStyles[styleId] = { id: styleId, name: styleId };
        }
        
        themeMaster.themeSettings.textStyles[styleId][property] = value;
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
    const master = draft.masters[masterId];
    
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
    const master = draft.masters[masterId];
    
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
    const themeMaster = draft.masters[masterId];
    
    console.log(`[ApplyPreset] Applying preset: ${presetId} to master: ${masterId}`);
    
    if (!themeMaster || themeMaster.type !== 'theme') {
        console.log(`[ApplyPreset] ERROR: Invalid theme master`, themeMaster?.type);
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
        console.log(`[ApplyPreset] Applied lumaTheme:`, presetTheme.themeSettings.lumaTheme.name);
        console.log(`[ApplyPreset] LumaTheme slots:`, presetTheme.themeSettings.lumaTheme.slots?.map((s, i) => `${i}: ${s.hex}`));
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
        console.log(`[ApplyPreset] Applied textStyles:`, Object.keys(presetTheme.themeSettings.textStyles));
        console.log(`[ApplyPreset] Title style textFill:`, presetTheme.themeSettings.textStyles.title?.textFill);
    }
    
    // 5. Apply background from preset
    if (presetTheme.background) {
        themeMaster.background = JSON.parse(JSON.stringify(presetTheme.background));
        console.log(`[ApplyPreset] Applied background:`, presetTheme.background);
    }
    
    // 6. Update layout masters with preset's placeholder elements
    // This applies the theme-linked textFill to the actual placeholders
    const presetLayouts = fullPreset.layouts;
    if (presetLayouts) {
        console.log(`[ApplyPreset] Applying layouts from preset...`);
        
        // Find existing layout masters that belong to this theme
        const existingLayoutIds = Object.keys(draft.masters).filter(id => {
            const master = draft.masters[id];
            return master.type === 'layout' && master.parentId === masterId;
        });
        
        console.log(`[ApplyPreset] Existing layouts:`, existingLayoutIds);
        
        // Map preset layout names to existing layouts by their layout type
        // e.g., "Title Slide" preset layout -> existing layout with same name
        const presetLayoutArray = Object.values(presetLayouts);
        
        existingLayoutIds.forEach(existingLayoutId => {
            const existingLayout = draft.masters[existingLayoutId];
            
            // Find matching preset layout by name
            const matchingPresetLayout = presetLayoutArray.find(
                pl => pl.name === existingLayout.name
            );
            
            if (matchingPresetLayout) {
                console.log(`[ApplyPreset] Updating layout "${existingLayout.name}" with preset elements`);
                
                // Update elements with theme-linked textFill
                existingLayout.elements = JSON.parse(JSON.stringify(matchingPresetLayout.elements));
                existingLayout.elementOrder = [...matchingPresetLayout.elementOrder];
                
                // Log the textFill of the first placeholder to verify
                const firstEl = Object.values(existingLayout.elements)[0];
                if (firstEl) {
                    console.log(`[ApplyPreset] First element textFill:`, firstEl.style?.textFill);
                }
            }
        });
    }
    
    console.log(`[ApplyPreset] Final themeMaster.themeSettings:`, {
        lumaTheme: themeMaster.themeSettings.lumaTheme?.name,
        fontPresetId: themeMaster.themeSettings.fontPresetId,
        fonts: themeMaster.themeSettings.fonts,
        textStyleKeys: Object.keys(themeMaster.themeSettings.textStyles || {})
    });
}
