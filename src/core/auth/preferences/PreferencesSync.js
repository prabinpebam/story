/**
 * Preferences Sync
 * 
 * Handles synchronization of preferences across devices via cloud storage.
 * Implements conflict resolution with last-write-wins strategy.
 * 
 * @module core/auth/preferences/PreferencesSync
 */

import { PreferencesFile } from './PreferencesFile.js';
import { PreferencesDiscovery, StorageLocations } from './PreferencesDiscovery.js';
import { mergePreferences, LOCAL_ONLY_PROPERTIES } from './PreferencesSchema.js';

/**
 * Sync events
 */
export const SyncEvents = {
    SYNC_STARTED: 'sync:started',
    SYNC_COMPLETED: 'sync:completed',
    SYNC_FAILED: 'sync:failed',
    CONFLICT_DETECTED: 'sync:conflict',
    CONFLICT_RESOLVED: 'sync:conflict:resolved'
};

/**
 * Sync status
 */
export const SyncStatus = {
    IDLE: 'idle',
    SYNCING: 'syncing',
    ERROR: 'error',
    OFFLINE: 'offline'
};

/**
 * Preferences Sync Manager
 */
export class PreferencesSync {
    /**
     * @param {Object} options - Sync options
     * @param {Object} options.preferencesManager - PreferencesManager instance
     * @param {Object} options.discovery - PreferencesDiscovery instance
     * @param {Object} options.idTokenClaims - Current user's OAuth claims
     */
    constructor(options) {
        this.preferencesManager = options.preferencesManager;
        this.discovery = options.discovery;
        this.idTokenClaims = options.idTokenClaims;
        
        this.status = SyncStatus.IDLE;
        this.lastSyncTime = null;
        this.syncInterval = null;
        this.listeners = new Set();
        
        // Sync settings
        this.autoSyncEnabled = true;
        this.syncIntervalMs = 60000; // 1 minute
        this.retryDelayMs = 5000;
        this.maxRetries = 3;
    }

    /**
     * Subscribe to sync events
     * 
     * @param {Function} callback - Event callback
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    /**
     * Emit event to listeners
     * @private
     */
    emit(event, data) {
        for (const listener of this.listeners) {
            try {
                listener(event, data);
            } catch (e) {
                console.error('Sync listener error:', e);
            }
        }
    }

    /**
     * Start automatic sync
     */
    startAutoSync() {
        if (this.syncInterval) {
            return; // Already running
        }

        this.autoSyncEnabled = true;
        this.syncInterval = setInterval(() => {
            this.sync().catch(console.error);
        }, this.syncIntervalMs);

        // Sync immediately on start
        this.sync().catch(console.error);
    }

    /**
     * Stop automatic sync
     */
    stopAutoSync() {
        this.autoSyncEnabled = false;
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    /**
     * Perform sync
     * 
     * @param {Object} [options] - Sync options
     * @param {boolean} [options.force=false] - Force sync even if recently synced
     * @returns {Promise<Object>} Sync result
     */
    async sync(options = {}) {
        const { force = false } = options;

        // Check if sync needed
        if (!force && this.lastSyncTime) {
            const elapsed = Date.now() - this.lastSyncTime;
            if (elapsed < this.syncIntervalMs / 2) {
                return { skipped: true, reason: 'too_recent' };
            }
        }

        if (this.status === SyncStatus.SYNCING) {
            return { skipped: true, reason: 'already_syncing' };
        }

        this.status = SyncStatus.SYNCING;
        this.emit(SyncEvents.SYNC_STARTED, {});

        try {
            // Get remote preferences
            const remoteResult = await this.fetchRemotePreferences();
            
            if (!remoteResult.found) {
                // No remote preferences - upload local
                await this.uploadPreferences();
                this.status = SyncStatus.IDLE;
                this.lastSyncTime = Date.now();
                this.emit(SyncEvents.SYNC_COMPLETED, { action: 'uploaded' });
                return { action: 'uploaded' };
            }

            // Compare timestamps
            const localPrefs = this.preferencesManager.get();
            const remotePrefs = remoteResult.preferences;

            const localTime = new Date(localPrefs.lastModified || 0).getTime();
            const remoteTime = new Date(remotePrefs.lastModified || 0).getTime();

            if (localTime === remoteTime) {
                // Already in sync
                this.status = SyncStatus.IDLE;
                this.lastSyncTime = Date.now();
                this.emit(SyncEvents.SYNC_COMPLETED, { action: 'none' });
                return { action: 'none' };
            }

            // Conflict detected
            this.emit(SyncEvents.CONFLICT_DETECTED, {
                localTime,
                remoteTime
            });

            // Resolve conflict with merge
            const mergedPrefs = await this.resolveConflict(localPrefs, remotePrefs);
            
            // Update local and remote
            this.preferencesManager.update(mergedPrefs);
            await this.uploadPreferences();

            this.status = SyncStatus.IDLE;
            this.lastSyncTime = Date.now();
            
            this.emit(SyncEvents.CONFLICT_RESOLVED, { 
                strategy: 'merge',
                winner: localTime > remoteTime ? 'local' : 'remote'
            });
            this.emit(SyncEvents.SYNC_COMPLETED, { action: 'merged' });
            
            return { action: 'merged' };

        } catch (error) {
            this.status = SyncStatus.ERROR;
            this.emit(SyncEvents.SYNC_FAILED, { error: error.message });
            throw error;
        }
    }

    /**
     * Fetch remote preferences from cloud storage
     * 
     * @returns {Promise<Object>} Result with found flag and preferences
     * @private
     */
    async fetchRemotePreferences() {
        try {
            // Discover preferences file location
            const location = await this.discovery.discover(this.idTokenClaims);
            
            if (!location) {
                return { found: false };
            }

            // Load preferences file
            const fileBytes = await this.discovery.loadFromLocation(location);
            const file = await PreferencesFile.fromBytes(fileBytes);
            
            // Decrypt and get preferences
            const preferences = await file.getPreferences(this.idTokenClaims);
            
            return { 
                found: true, 
                preferences,
                location,
                file
            };
        } catch (error) {
            if (error.message?.includes('not found') || error.statusCode === 404) {
                return { found: false };
            }
            throw error;
        }
    }

    /**
     * Upload preferences to cloud storage
     * 
     * @returns {Promise<void>}
     * @private
     */
    async uploadPreferences() {
        const fileBytes = await this.preferencesManager.getFileBytes();
        const location = this.discovery.getCachedLocation();
        
        if (location) {
            // Update existing file
            await this.discovery.saveToLocation(location, fileBytes);
        } else {
            // Create new file
            await this.discovery.createPreferencesFile(this.idTokenClaims, fileBytes);
        }
    }

    /**
     * Resolve conflict between local and remote preferences
     * 
     * Strategy: 
     * 1. Use mergePreferences for proper merge
     * 2. Keep local-only properties from local
     * 3. Use most recent timestamp for synced properties
     * 
     * @param {Object} local - Local preferences
     * @param {Object} remote - Remote preferences
     * @returns {Promise<Object>} Merged preferences
     * @private
     */
    async resolveConflict(local, remote) {
        // Use the merge function which handles:
        // - Local-only properties stay local
        // - Arrays (recentFiles, etc.) are merged
        // - Most recent lastModified wins for other properties
        return mergePreferences(local, remote);
    }

    /**
     * Force push local preferences to cloud
     * (Overwrites remote without merge)
     * 
     * @returns {Promise<void>}
     */
    async forcePush() {
        this.status = SyncStatus.SYNCING;
        this.emit(SyncEvents.SYNC_STARTED, { force: true });

        try {
            await this.uploadPreferences();
            this.status = SyncStatus.IDLE;
            this.lastSyncTime = Date.now();
            this.emit(SyncEvents.SYNC_COMPLETED, { action: 'force_pushed' });
        } catch (error) {
            this.status = SyncStatus.ERROR;
            this.emit(SyncEvents.SYNC_FAILED, { error: error.message });
            throw error;
        }
    }

    /**
     * Force pull remote preferences to local
     * (Overwrites local without merge, except local-only props)
     * 
     * @returns {Promise<void>}
     */
    async forcePull() {
        this.status = SyncStatus.SYNCING;
        this.emit(SyncEvents.SYNC_STARTED, { force: true });

        try {
            const remoteResult = await this.fetchRemotePreferences();
            
            if (!remoteResult.found) {
                throw new Error('No remote preferences found');
            }

            // Keep local-only properties
            const localPrefs = this.preferencesManager.get();
            const merged = { ...remoteResult.preferences };
            
            for (const prop of LOCAL_ONLY_PROPERTIES) {
                if (localPrefs[prop] !== undefined) {
                    merged[prop] = localPrefs[prop];
                }
            }

            this.preferencesManager.update(merged);
            
            this.status = SyncStatus.IDLE;
            this.lastSyncTime = Date.now();
            this.emit(SyncEvents.SYNC_COMPLETED, { action: 'force_pulled' });
        } catch (error) {
            this.status = SyncStatus.ERROR;
            this.emit(SyncEvents.SYNC_FAILED, { error: error.message });
            throw error;
        }
    }

    /**
     * Get current sync status
     * 
     * @returns {Object} Status info
     */
    getStatus() {
        return {
            status: this.status,
            lastSyncTime: this.lastSyncTime,
            autoSyncEnabled: this.autoSyncEnabled
        };
    }

    /**
     * Check if online
     * 
     * @returns {boolean} True if online
     */
    isOnline() {
        return typeof navigator !== 'undefined' ? navigator.onLine : true;
    }

    /**
     * Dispose of the sync manager
     */
    dispose() {
        this.stopAutoSync();
        this.listeners.clear();
    }
}
