/**
 * User Preferences Schema
 * 
 * Defines the structure and default values for user preferences.
 * Preferences are stored in an encrypted .str file synced via cloud storage.
 * 
 * @module core/auth/preferences/PreferencesSchema
 */

/**
 * Current schema version for migrations
 */
export const PREFERENCES_SCHEMA_VERSION = 1;

/**
 * Default user preferences
 * @type {Object}
 */
export const DEFAULT_PREFERENCES = {
    // ─────────────────────────────────────────────────────────
    // Appearance (synced across devices)
    // ─────────────────────────────────────────────────────────
    
    /** Theme preference: 'light', 'dark', or 'system' */
    theme: 'system',
    
    /** UI language (BCP 47 language tag) */
    language: typeof navigator !== 'undefined' ? navigator.language : 'en-US',
    
    /** Custom display name override (if user wants different from OAuth name) */
    displayNameOverride: null,
    
    /** Preferred collaboration cursor color (hex) */
    preferredColor: null,

    // ─────────────────────────────────────────────────────────
    // Editor Preferences (synced)
    // ─────────────────────────────────────────────────────────
    
    /** Grid settings for canvas */
    gridSettings: {
        showGrid: true,
        snapToGrid: true,
        gridSize: 10
    },
    
    /** Default font for new text elements */
    defaultFont: {
        family: 'Inter',
        size: 16
    },
    
    /** Auto-save interval in milliseconds */
    autoSaveInterval: 30000,

    // ─────────────────────────────────────────────────────────
    // Keyboard Shortcuts (synced)
    // ─────────────────────────────────────────────────────────
    
    /** Custom keyboard shortcuts (keybind → action mapping) */
    shortcuts: {},

    // ─────────────────────────────────────────────────────────
    // Device-Specific (NOT synced - stored locally)
    // ─────────────────────────────────────────────────────────
    
    /** Default storage provider for this device */
    defaultStorageProvider: 'local',
    
    /** Window state (per device) */
    windowState: {
        panelWidths: {},
        expandedPanels: []
    },

    // ─────────────────────────────────────────────────────────
    // Recent Activity (merged across devices)
    // ─────────────────────────────────────────────────────────
    
    /** Recently opened files */
    recentFiles: [],
    
    /** Recently used colors (hex values) */
    recentColors: [],
    
    /** Recently used fonts */
    recentFonts: [],

    // ─────────────────────────────────────────────────────────
    // Metadata (managed by system)
    // ─────────────────────────────────────────────────────────
    
    /** Schema version for migrations */
    schemaVersion: PREFERENCES_SCHEMA_VERSION,
    
    /** Last modified timestamp (ISO 8601) */
    lastModified: new Date().toISOString()
};

/**
 * Properties that should NOT be synced across devices
 * These are stored locally only
 */
export const LOCAL_ONLY_PROPERTIES = [
    'defaultStorageProvider',
    'windowState'
];

/**
 * Properties that should be merged (not overwritten) during sync
 * Arrays are unified, keeping unique entries
 */
export const MERGE_PROPERTIES = [
    'recentFiles',
    'recentColors',
    'recentFonts'
];

/**
 * Maximum entries for array properties
 */
export const ARRAY_LIMITS = {
    recentFiles: 20,
    recentColors: 20,
    recentFonts: 10
};

/**
 * Validate preferences object against schema
 * @param {Object} preferences - Preferences to validate
 * @returns {Object} Validation result { valid: boolean, errors: string[] }
 */
export function validatePreferences(preferences) {
    const errors = [];
    
    // Check required fields
    if (preferences.schemaVersion === undefined) {
        errors.push('Missing schemaVersion');
    }
    
    // Validate theme
    if (preferences.theme && !['light', 'dark', 'system'].includes(preferences.theme)) {
        errors.push(`Invalid theme: ${preferences.theme}`);
    }
    
    // Validate autoSaveInterval
    if (preferences.autoSaveInterval !== undefined) {
        if (typeof preferences.autoSaveInterval !== 'number' || preferences.autoSaveInterval < 5000) {
            errors.push('autoSaveInterval must be a number >= 5000');
        }
    }
    
    // Validate gridSettings
    if (preferences.gridSettings) {
        if (typeof preferences.gridSettings.gridSize !== 'number' || preferences.gridSettings.gridSize < 1) {
            errors.push('gridSettings.gridSize must be a positive number');
        }
    }
    
    // Validate arrays don't exceed limits
    for (const [key, limit] of Object.entries(ARRAY_LIMITS)) {
        if (preferences[key] && preferences[key].length > limit * 2) {
            errors.push(`${key} exceeds maximum allowed entries`);
        }
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Migrate preferences from older schema version
 * @param {Object} preferences - Old preferences
 * @returns {Object} Migrated preferences
 */
export function migratePreferences(preferences) {
    let migrated = { ...preferences };
    
    // Migration from v0 (no version) to v1
    if (!migrated.schemaVersion) {
        migrated.schemaVersion = 1;
        migrated.lastModified = new Date().toISOString();
    }
    
    // Add any missing fields with defaults
    migrated = {
        ...DEFAULT_PREFERENCES,
        ...migrated,
        // Ensure nested objects are properly merged
        gridSettings: {
            ...DEFAULT_PREFERENCES.gridSettings,
            ...(migrated.gridSettings || {})
        },
        defaultFont: {
            ...DEFAULT_PREFERENCES.defaultFont,
            ...(migrated.defaultFont || {})
        },
        windowState: {
            ...DEFAULT_PREFERENCES.windowState,
            ...(migrated.windowState || {})
        }
    };
    
    // Future migrations can be added here:
    // if (migrated.schemaVersion < 2) { ... migrated.schemaVersion = 2; }
    
    return migrated;
}

/**
 * Merge two preferences objects (for cross-device sync)
 * @param {Object} local - Local preferences
 * @param {Object} remote - Remote preferences
 * @returns {Object} Merged preferences
 */
export function mergePreferences(local, remote) {
    const merged = { ...remote };
    
    // Keep local-only properties from local
    for (const prop of LOCAL_ONLY_PROPERTIES) {
        if (local[prop] !== undefined) {
            merged[prop] = local[prop];
        }
    }
    
    // Merge array properties (union, keep unique, limit size)
    for (const prop of MERGE_PROPERTIES) {
        const localArr = local[prop] || [];
        const remoteArr = remote[prop] || [];
        
        // Merge and dedupe based on id or value
        const mergedArr = mergeArrays(localArr, remoteArr, prop);
        
        // Apply limit
        const limit = ARRAY_LIMITS[prop] || 50;
        merged[prop] = mergedArr.slice(0, limit);
    }
    
    // Use the most recent lastModified
    if (local.lastModified && remote.lastModified) {
        merged.lastModified = local.lastModified > remote.lastModified 
            ? local.lastModified 
            : remote.lastModified;
    }
    
    return merged;
}

/**
 * Merge two arrays, removing duplicates
 * @private
 */
function mergeArrays(arr1, arr2, propName) {
    if (propName === 'recentFiles') {
        // Dedupe by id, keep most recent
        const byId = new Map();
        for (const item of [...arr2, ...arr1]) {
            if (item.id) {
                const existing = byId.get(item.id);
                if (!existing || item.lastOpened > existing.lastOpened) {
                    byId.set(item.id, item);
                }
            }
        }
        // Sort by lastOpened descending
        return Array.from(byId.values())
            .sort((a, b) => (b.lastOpened || '').localeCompare(a.lastOpened || ''));
    }
    
    // For simple value arrays (colors, fonts), dedupe by value
    return [...new Set([...arr1, ...arr2])];
}
