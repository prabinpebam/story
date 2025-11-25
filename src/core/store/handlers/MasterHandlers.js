

import { getDefaultPreset } from '../../constants/ColorPresets.js';

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
