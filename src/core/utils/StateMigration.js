/**
 * StateMigration.js
 * Handles migration of state data between schema versions.
 * Currently migrates from 3-color theme schema to 12-color schema.
 */

/**
 * Default 12-color theme schema
 */
const DEFAULT_12_COLOR_SCHEMA = {
    background1: "#FFFFFF",
    background2: "#F5F5F5",
    text1: "#333333",
    text2: "#666666",
    accent1: "#18A0FB",
    accent2: "#7B61FF",
    accent3: "#1BC47D",
    accent4: "#F24822",
    accent5: "#FFBE0B",
    accent6: "#FF006E",
    hyperlink: "#0066CC",
    followedHyperlink: "#954F72"
};

/**
 * Checks if the colors object uses the old 3-color schema.
 * Old schema has: accent, textPrimary, textSecondary
 * New schema has: background1, text1, accent1, etc.
 * @param {Object} colors - The theme colors object.
 * @returns {boolean} True if using old schema.
 */
export function isOldColorSchema(colors) {
    if (!colors || typeof colors !== 'object') return false;
    
    // Check for presence of old keys without new keys
    const hasOldKeys = colors.accent !== undefined || 
                       colors.textPrimary !== undefined || 
                       colors.textSecondary !== undefined;
    
    const hasNewKeys = colors.background1 !== undefined || 
                       colors.text1 !== undefined || 
                       colors.accent1 !== undefined;
    
    return hasOldKeys && !hasNewKeys;
}

/**
 * Migrates a colors object from old 3-color schema to new 12-color schema.
 * Preserves existing values and maps them to appropriate new roles.
 * @param {Object} oldColors - The old colors object with accent, textPrimary, textSecondary.
 * @returns {Object} New colors object with full 12-color schema.
 */
export function migrateColorsToNewSchema(oldColors) {
    if (!oldColors) return { ...DEFAULT_12_COLOR_SCHEMA };
    
    const newColors = {
        // Background colors (defaults)
        background1: DEFAULT_12_COLOR_SCHEMA.background1,
        background2: DEFAULT_12_COLOR_SCHEMA.background2,
        
        // Text colors (mapped from old schema)
        text1: oldColors.textPrimary || DEFAULT_12_COLOR_SCHEMA.text1,
        text2: oldColors.textSecondary || DEFAULT_12_COLOR_SCHEMA.text2,
        
        // Accent colors (accent from old schema becomes accent1)
        accent1: oldColors.accent || DEFAULT_12_COLOR_SCHEMA.accent1,
        accent2: DEFAULT_12_COLOR_SCHEMA.accent2,
        accent3: DEFAULT_12_COLOR_SCHEMA.accent3,
        accent4: DEFAULT_12_COLOR_SCHEMA.accent4,
        accent5: DEFAULT_12_COLOR_SCHEMA.accent5,
        accent6: DEFAULT_12_COLOR_SCHEMA.accent6,
        
        // Link colors (defaults)
        hyperlink: DEFAULT_12_COLOR_SCHEMA.hyperlink,
        followedHyperlink: DEFAULT_12_COLOR_SCHEMA.followedHyperlink,
        
        // Keep legacy aliases for backwards compatibility
        accent: oldColors.accent || DEFAULT_12_COLOR_SCHEMA.accent1,
        textPrimary: oldColors.textPrimary || DEFAULT_12_COLOR_SCHEMA.text1,
        textSecondary: oldColors.textSecondary || DEFAULT_12_COLOR_SCHEMA.text2
    };
    
    return newColors;
}

/**
 * Migrates theme settings from old schema to new schema.
 * @param {Object} themeSettings - The theme settings object.
 * @returns {Object} Updated theme settings with migrated colors.
 */
export function migrateThemeSettings(themeSettings) {
    if (!themeSettings) return themeSettings;
    
    const migrated = { ...themeSettings };
    
    if (isOldColorSchema(themeSettings.colors)) {
        migrated.colors = migrateColorsToNewSchema(themeSettings.colors);
    }
    
    return migrated;
}

/**
 * Migrates the entire masters object to the new schema.
 * @param {Object} masters - The masters object from state.
 * @returns {Object} Updated masters with migrated theme settings.
 */
export function migrateMasters(masters) {
    if (!masters || typeof masters !== 'object') return masters;
    
    const migrated = {};
    
    for (const [id, master] of Object.entries(masters)) {
        if (master.type === 'theme' && master.themeSettings) {
            migrated[id] = {
                ...master,
                themeSettings: migrateThemeSettings(master.themeSettings)
            };
        } else {
            migrated[id] = master;
        }
    }
    
    return migrated;
}

/**
 * Migrates the entire application state to the latest schema version.
 * @param {Object} state - The full application state.
 * @returns {Object} Migrated state.
 */
export function migrateState(state) {
    if (!state) return state;
    
    const migrated = { ...state };
    
    // Migrate masters (legacy support - now called slideMasterPresets)
    if (state.masters) {
        migrated.slideMasterPresets = migrateMasters(state.masters);
        delete migrated.masters; // Remove old property
    } else if (state.slideMasterPresets) {
        migrated.slideMasterPresets = migrateMasters(state.slideMasterPresets);
    }
    
    return migrated;
}

/**
 * Validates that a colors object has all required 12-color schema keys.
 * @param {Object} colors - The colors object to validate.
 * @returns {{ valid: boolean, missing: string[] }} Validation result.
 */
export function validateColorSchema(colors) {
    const requiredKeys = Object.keys(DEFAULT_12_COLOR_SCHEMA);
    const missing = requiredKeys.filter(key => colors[key] === undefined);
    
    return {
        valid: missing.length === 0,
        missing
    };
}

export const StateMigration = {
    isOldColorSchema,
    migrateColorsToNewSchema,
    migrateThemeSettings,
    migrateMasters,
    migrateState,
    validateColorSchema,
    DEFAULT_12_COLOR_SCHEMA
};

export default StateMigration;
