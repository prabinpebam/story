/**
 * Preferences Migration
 * 
 * Handles migration of user preferences from localStorage to the
 * encrypted preferences file format.
 * 
 * @module core/auth/preferences/PreferencesMigration
 */

import { DEFAULT_PREFERENCES, PREFERENCES_SCHEMA_VERSION, migratePreferences } from './PreferencesSchema.js';

/**
 * localStorage keys used by the app
 */
const LEGACY_KEYS = {
    THEME: 'story_theme',
    LANGUAGE: 'story_language',
    GRID_SETTINGS: 'story_grid_settings',
    RECENT_FILES: 'story_recent_files',
    RECENT_COLORS: 'story_recent_colors',
    SHORTCUTS: 'story_shortcuts',
    PANEL_STATE: 'story_panel_state',
    SETTINGS: 'story_settings'
};

/**
 * Key for tracking migration status
 */
const MIGRATION_KEY = 'story_preferences_migrated';

/**
 * Key for backup before migration
 */
const BACKUP_KEY = 'story_preferences_backup';

/**
 * Preferences Migration Manager
 */
export class PreferencesMigration {
    constructor() {
        this.migrationComplete = false;
    }

    /**
     * Check if migration is needed
     * 
     * @returns {boolean} True if migration is needed
     */
    needsMigration() {
        // Already migrated
        if (localStorage.getItem(MIGRATION_KEY) === 'true') {
            return false;
        }

        // Check if any legacy keys exist
        for (const key of Object.values(LEGACY_KEYS)) {
            if (localStorage.getItem(key) !== null) {
                return true;
            }
        }

        return false;
    }

    /**
     * Collect preferences from localStorage
     * 
     * @returns {Object} Collected preferences
     */
    collectFromLocalStorage() {
        const preferences = { ...DEFAULT_PREFERENCES };

        try {
            // Theme
            const theme = localStorage.getItem(LEGACY_KEYS.THEME);
            if (theme && ['light', 'dark', 'system'].includes(theme)) {
                preferences.theme = theme;
            }

            // Language
            const language = localStorage.getItem(LEGACY_KEYS.LANGUAGE);
            if (language) {
                preferences.language = language;
            }

            // Grid settings
            const gridSettings = localStorage.getItem(LEGACY_KEYS.GRID_SETTINGS);
            if (gridSettings) {
                try {
                    const parsed = JSON.parse(gridSettings);
                    preferences.gridSettings = {
                        ...preferences.gridSettings,
                        ...parsed
                    };
                } catch (e) {
                    // Ignore parse errors
                }
            }

            // Recent files
            const recentFiles = localStorage.getItem(LEGACY_KEYS.RECENT_FILES);
            if (recentFiles) {
                try {
                    const parsed = JSON.parse(recentFiles);
                    if (Array.isArray(parsed)) {
                        preferences.recentFiles = parsed.slice(0, 20);
                    }
                } catch (e) {
                    // Ignore parse errors
                }
            }

            // Recent colors
            const recentColors = localStorage.getItem(LEGACY_KEYS.RECENT_COLORS);
            if (recentColors) {
                try {
                    const parsed = JSON.parse(recentColors);
                    if (Array.isArray(parsed)) {
                        preferences.recentColors = parsed.slice(0, 20);
                    }
                } catch (e) {
                    // Ignore parse errors
                }
            }

            // Shortcuts
            const shortcuts = localStorage.getItem(LEGACY_KEYS.SHORTCUTS);
            if (shortcuts) {
                try {
                    const parsed = JSON.parse(shortcuts);
                    if (typeof parsed === 'object') {
                        preferences.shortcuts = parsed;
                    }
                } catch (e) {
                    // Ignore parse errors
                }
            }

            // Panel state (window state)
            const panelState = localStorage.getItem(LEGACY_KEYS.PANEL_STATE);
            if (panelState) {
                try {
                    const parsed = JSON.parse(panelState);
                    preferences.windowState = {
                        ...preferences.windowState,
                        ...parsed
                    };
                } catch (e) {
                    // Ignore parse errors
                }
            }

            // General settings (could contain various preferences)
            const settings = localStorage.getItem(LEGACY_KEYS.SETTINGS);
            if (settings) {
                try {
                    const parsed = JSON.parse(settings);
                    // Extract known settings
                    if (parsed.autoSaveInterval) {
                        preferences.autoSaveInterval = parsed.autoSaveInterval;
                    }
                    if (parsed.defaultStorageProvider) {
                        preferences.defaultStorageProvider = parsed.defaultStorageProvider;
                    }
                    if (parsed.defaultFont) {
                        preferences.defaultFont = {
                            ...preferences.defaultFont,
                            ...parsed.defaultFont
                        };
                    }
                } catch (e) {
                    // Ignore parse errors
                }
            }

        } catch (error) {
            console.error('Error collecting preferences from localStorage:', error);
        }

        return preferences;
    }

    /**
     * Create backup of localStorage data
     */
    createBackup() {
        const backup = {};
        
        for (const [name, key] of Object.entries(LEGACY_KEYS)) {
            const value = localStorage.getItem(key);
            if (value !== null) {
                backup[name] = value;
            }
        }

        if (Object.keys(backup).length > 0) {
            localStorage.setItem(BACKUP_KEY, JSON.stringify({
                timestamp: new Date().toISOString(),
                data: backup
            }));
        }
    }

    /**
     * Restore backup
     * 
     * @returns {boolean} True if backup was restored
     */
    restoreBackup() {
        try {
            const backupStr = localStorage.getItem(BACKUP_KEY);
            if (!backupStr) {
                return false;
            }

            const backup = JSON.parse(backupStr);
            
            for (const [name, key] of Object.entries(LEGACY_KEYS)) {
                if (backup.data[name] !== undefined) {
                    localStorage.setItem(key, backup.data[name]);
                }
            }

            // Clear migration flag
            localStorage.removeItem(MIGRATION_KEY);
            
            return true;
        } catch (error) {
            console.error('Error restoring backup:', error);
            return false;
        }
    }

    /**
     * Clear legacy localStorage keys
     */
    clearLegacyKeys() {
        for (const key of Object.values(LEGACY_KEYS)) {
            localStorage.removeItem(key);
        }
    }

    /**
     * Mark migration as complete
     */
    markComplete() {
        localStorage.setItem(MIGRATION_KEY, 'true');
        this.migrationComplete = true;
    }

    /**
     * Perform migration
     * 
     * @param {Object} [options] - Migration options
     * @param {boolean} [options.clearLegacy=true] - Clear legacy keys after migration
     * @returns {Object} Migrated preferences
     */
    migrate(options = {}) {
        const { clearLegacy = true } = options;

        if (!this.needsMigration()) {
            return null;
        }

        // Create backup first
        this.createBackup();

        // Collect preferences
        const preferences = this.collectFromLocalStorage();

        // Run through migration/validation
        const migrated = migratePreferences(preferences);
        migrated.lastModified = new Date().toISOString();

        // Clear legacy keys if requested
        if (clearLegacy) {
            this.clearLegacyKeys();
        }

        // Mark complete
        this.markComplete();

        return migrated;
    }

    /**
     * Get backup info
     * 
     * @returns {Object|null} Backup info or null
     */
    getBackupInfo() {
        try {
            const backupStr = localStorage.getItem(BACKUP_KEY);
            if (!backupStr) {
                return null;
            }

            const backup = JSON.parse(backupStr);
            return {
                timestamp: backup.timestamp,
                keyCount: Object.keys(backup.data).length
            };
        } catch (e) {
            return null;
        }
    }

    /**
     * Clear backup
     */
    clearBackup() {
        localStorage.removeItem(BACKUP_KEY);
    }

    /**
     * Check if migration was completed
     * 
     * @returns {boolean} True if migration was completed
     */
    isMigrationComplete() {
        return localStorage.getItem(MIGRATION_KEY) === 'true';
    }
}

/**
 * Singleton instance
 */
export const preferencesMigration = new PreferencesMigration();
