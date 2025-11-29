/**
 * Preferences Manager
 * 
 * High-level API for managing user preferences.
 * Handles loading, saving, syncing, and caching preferences.
 * 
 * @module core/auth/preferences/PreferencesManager
 */

import { PreferencesFile } from './PreferencesFile.js';
import { 
    DEFAULT_PREFERENCES, 
    validatePreferences, 
    mergePreferences,
    PREFERENCES_SCHEMA_VERSION 
} from './PreferencesSchema.js';
import { DecryptionError } from './IdentityEncryption.js';

/**
 * Storage key for local preferences cache
 */
const LOCAL_CACHE_KEY = 'story_preferences_cache';

/**
 * Event types for preferences changes
 */
export const PreferencesEvents = {
    LOADED: 'preferences:loaded',
    UPDATED: 'preferences:updated',
    SYNCED: 'preferences:synced',
    ERROR: 'preferences:error',
    CONFLICT: 'preferences:conflict'
};

/**
 * Preferences Manager
 */
export class PreferencesManager {
    constructor() {
        /** @type {PreferencesFile|null} */
        this.file = null;
        
        /** @type {Object|null} */
        this.preferences = null;
        
        /** @type {Object|null} */
        this.idTokenClaims = null;
        
        /** @type {boolean} */
        this.isDirty = false;
        
        /** @type {number|null} */
        this.autoSaveTimer = null;
        
        /** @type {number} */
        this.autoSaveDelay = 3000; // 3 seconds
        
        /** @type {Set<Function>} */
        this.listeners = new Set();
        
        /** @type {BroadcastChannel|null} */
        this.syncChannel = null;
        
        // Initialize cross-tab sync
        this.initCrossTabSync();
    }

    /**
     * Initialize cross-tab synchronization
     */
    initCrossTabSync() {
        try {
            this.syncChannel = new BroadcastChannel('story_preferences_sync');
            this.syncChannel.onmessage = (event) => {
                this.handleCrossTabMessage(event.data);
            };
        } catch (e) {
            // BroadcastChannel not supported
            console.warn('Cross-tab preferences sync not available');
        }
    }

    /**
     * Handle messages from other tabs
     * 
     * @param {Object} message - Message data
     */
    handleCrossTabMessage(message) {
        switch (message.type) {
            case 'preferences_updated':
                if (message.timestamp > (this.preferences?.lastModified || '')) {
                    // Other tab has newer preferences
                    this.preferences = message.preferences;
                    this.emit(PreferencesEvents.SYNCED, this.preferences);
                }
                break;
        }
    }

    /**
     * Broadcast preferences update to other tabs
     */
    broadcastUpdate() {
        if (this.syncChannel && this.preferences) {
            this.syncChannel.postMessage({
                type: 'preferences_updated',
                preferences: this.preferences,
                timestamp: this.preferences.lastModified
            });
        }
    }

    /**
     * Add event listener
     * 
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    /**
     * Emit event to listeners
     * 
     * @param {string} event - Event type
     * @param {*} data - Event data
     */
    emit(event, data) {
        for (const listener of this.listeners) {
            try {
                listener(event, data);
            } catch (e) {
                console.error('Preferences listener error:', e);
            }
        }
    }

    /**
     * Initialize preferences for a user
     * 
     * @param {Object} idTokenClaims - OAuth claims
     * @param {Object} [options] - Options
     * @param {Function} [options.loadFile] - Function to load preferences file bytes
     * @param {boolean} [options.createIfMissing=true] - Create new file if not found
     * @returns {Promise<Object>} Loaded preferences
     */
    async initialize(idTokenClaims, options = {}) {
        this.idTokenClaims = idTokenClaims;
        const { loadFile, createIfMissing = true } = options;
        
        try {
            // Try to load existing preferences file
            if (loadFile) {
                const fileBytes = await loadFile();
                if (fileBytes) {
                    this.file = await PreferencesFile.fromBytes(fileBytes);
                    this.preferences = await this.file.getPreferences(idTokenClaims);
                    
                    // Validate and merge with defaults
                    const validation = validatePreferences(this.preferences);
                    if (!validation.valid) {
                        console.warn('Preferences validation warnings:', validation.errors);
                        this.preferences = mergePreferences(this.preferences, DEFAULT_PREFERENCES);
                    }
                    
                    // Cache locally
                    this.cacheLocally();
                    
                    this.emit(PreferencesEvents.LOADED, this.preferences);
                    return this.preferences;
                }
            }
            
            // No existing file, try local cache
            const cached = this.loadFromCache();
            if (cached) {
                this.preferences = cached;
                
                // Create file from cache
                if (createIfMissing) {
                    this.file = await PreferencesFile.create(idTokenClaims, this.preferences);
                    this.isDirty = true; // Needs to be saved
                }
                
                this.emit(PreferencesEvents.LOADED, this.preferences);
                return this.preferences;
            }
            
            // Create new file with defaults
            if (createIfMissing) {
                this.file = await PreferencesFile.create(idTokenClaims);
                this.preferences = { ...DEFAULT_PREFERENCES, lastModified: new Date().toISOString() };
                this.isDirty = true;
                
                this.emit(PreferencesEvents.LOADED, this.preferences);
                return this.preferences;
            }
            
            // Return defaults without creating file
            this.preferences = { ...DEFAULT_PREFERENCES };
            this.emit(PreferencesEvents.LOADED, this.preferences);
            return this.preferences;
            
        } catch (error) {
            if (error instanceof DecryptionError) {
                this.emit(PreferencesEvents.ERROR, { type: 'decryption', error });
                throw error;
            }
            
            console.error('Failed to load preferences:', error);
            
            // Fallback to defaults
            this.preferences = { ...DEFAULT_PREFERENCES };
            this.emit(PreferencesEvents.LOADED, this.preferences);
            return this.preferences;
        }
    }

    /**
     * Get current preferences
     * 
     * @returns {Object} Current preferences
     */
    get() {
        return this.preferences ? { ...this.preferences } : { ...DEFAULT_PREFERENCES };
    }

    /**
     * Get a specific preference value
     * 
     * @param {string} key - Preference key (dot notation supported)
     * @param {*} [defaultValue] - Default value if not found
     * @returns {*} Preference value
     */
    getValue(key, defaultValue = undefined) {
        if (!this.preferences) {
            return defaultValue;
        }
        
        const keys = key.split('.');
        let value = this.preferences;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return defaultValue;
            }
        }
        
        return value;
    }

    /**
     * Set a specific preference value
     * 
     * @param {string} key - Preference key (dot notation supported)
     * @param {*} value - Value to set
     */
    setValue(key, value) {
        if (!this.preferences) {
            this.preferences = { ...DEFAULT_PREFERENCES };
        }
        
        const keys = key.split('.');
        let obj = this.preferences;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!(k in obj) || typeof obj[k] !== 'object') {
                obj[k] = {};
            }
            obj = obj[k];
        }
        
        obj[keys[keys.length - 1]] = value;
        
        this.markDirty();
    }

    /**
     * Update multiple preferences at once
     * 
     * @param {Object} updates - Partial preferences update
     */
    update(updates) {
        const base = this.preferences || DEFAULT_PREFERENCES;
        
        // Deep merge updates into preferences
        this.preferences = this.deepMerge(base, updates);
        this.markDirty();
    }

    /**
     * Deep merge two objects
     * @private
     */
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key of Object.keys(source)) {
            const sourceValue = source[key];
            const targetValue = target[key];
            
            if (sourceValue === undefined) {
                continue; // Skip undefined values
            }
            
            if (
                sourceValue !== null &&
                typeof sourceValue === 'object' &&
                !Array.isArray(sourceValue) &&
                targetValue !== null &&
                typeof targetValue === 'object' &&
                !Array.isArray(targetValue)
            ) {
                // Deep merge objects
                result[key] = this.deepMerge(targetValue, sourceValue);
            } else {
                // Replace value
                result[key] = sourceValue;
            }
        }
        
        return result;
    }

    /**
     * Mark preferences as dirty and schedule auto-save
     */
    markDirty() {
        this.isDirty = true;
        this.preferences.lastModified = new Date().toISOString();
        
        this.emit(PreferencesEvents.UPDATED, this.preferences);
        
        // Schedule auto-save
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = setTimeout(() => {
            this.save().catch(console.error);
        }, this.autoSaveDelay);
        
        // Update local cache immediately
        this.cacheLocally();
        
        // Broadcast to other tabs
        this.broadcastUpdate();
    }

    /**
     * Save preferences
     * 
     * @param {Function} [saveFile] - Function to save file bytes
     * @returns {Promise<void>}
     */
    async save(saveFile) {
        if (!this.isDirty || !this.file || !this.idTokenClaims) {
            return;
        }
        
        // Clear auto-save timer
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
        
        // Update encrypted data in file
        await this.file.setPreferences(this.preferences, this.idTokenClaims);
        
        // Get bytes
        const bytes = await this.file.toBytes();
        
        // Save if callback provided
        if (saveFile) {
            await saveFile(bytes);
        }
        
        this.isDirty = false;
    }

    /**
     * Get file bytes for manual saving
     * 
     * @returns {Promise<ArrayBuffer>} File bytes
     */
    async getFileBytes() {
        if (!this.file || !this.idTokenClaims) {
            throw new Error('Preferences file not initialized');
        }
        
        await this.file.setPreferences(this.preferences, this.idTokenClaims);
        return this.file.toBytes();
    }

    /**
     * Cache preferences locally
     */
    cacheLocally() {
        if (!this.preferences) return;
        
        try {
            localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify({
                preferences: this.preferences,
                timestamp: Date.now()
            }));
        } catch (e) {
            // localStorage might be full or disabled
            console.warn('Failed to cache preferences locally:', e);
        }
    }

    /**
     * Load preferences from local cache
     * 
     * @returns {Object|null} Cached preferences or null
     */
    loadFromCache() {
        try {
            const cached = localStorage.getItem(LOCAL_CACHE_KEY);
            if (cached) {
                const { preferences } = JSON.parse(cached);
                return preferences;
            }
        } catch (e) {
            console.warn('Failed to load cached preferences:', e);
        }
        return null;
    }

    /**
     * Clear local cache
     */
    clearCache() {
        try {
            localStorage.removeItem(LOCAL_CACHE_KEY);
        } catch (e) {
            // Ignore
        }
    }

    /**
     * Reset preferences to defaults
     * 
     * @param {boolean} [clearRemote=false] - Also clear remote file
     */
    async reset(clearRemote = false) {
        this.preferences = { ...DEFAULT_PREFERENCES, lastModified: new Date().toISOString() };
        this.markDirty();
        
        if (clearRemote) {
            this.clearCache();
        }
    }

    /**
     * Get preferences file metadata
     * 
     * @returns {Object|null} File metadata or null
     */
    getFileMetadata() {
        return this.file ? this.file.getMetadata() : null;
    }

    /**
     * Check if preferences have unsaved changes
     * 
     * @returns {boolean} True if dirty
     */
    hasUnsavedChanges() {
        return this.isDirty;
    }

    /**
     * Dispose of the manager
     */
    dispose() {
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }
        
        if (this.syncChannel) {
            this.syncChannel.close();
        }
        
        this.listeners.clear();
        this.file = null;
        this.preferences = null;
        this.idTokenClaims = null;
    }
}

/**
 * Singleton instance
 */
let instance = null;

/**
 * Get the global PreferencesManager instance
 * 
 * @returns {PreferencesManager}
 */
export function getPreferencesManager() {
    if (!instance) {
        instance = new PreferencesManager();
    }
    return instance;
}
