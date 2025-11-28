/**
 * AutosaveManager
 * Manages automatic saving of presentations
 * 
 * Features:
 * - Debounced autosave to IndexedDB
 * - Track unsaved changes state
 * - Crash recovery
 * - Conflict detection
 */

import { AUTO_SAVE, STORAGE_ERRORS } from '../constants/StorageConstants.js';
import { FileCache } from '../cache/FileCache.js';

export class AutosaveManager {
    /**
     * Create an autosave manager
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        this.options = {
            debounceMs: AUTO_SAVE.DEBOUNCE_MS,
            enabled: true,
            maxBackups: AUTO_SAVE.MAX_BACKUPS,
            onSave: null,           // Callback when save completes
            onError: null,          // Callback when save fails
            onStateChange: null,    // Callback when unsaved state changes
            ...options
        };

        this._cache = new FileCache();
        this._initialized = false;
        this._debounceTimer = null;
        this._hasUnsavedChanges = false;
        this._currentPresentationId = null;
        this._lastSaveTime = null;
        this._saveInProgress = false;
        this._pendingState = null;
        this._version = 0;
    }

    /**
     * Initialize the autosave manager
     * @returns {Promise<void>}
     */
    async init() {
        if (this._initialized) return;
        
        await this._cache.init();
        this._initialized = true;
    }

    /**
     * Ensure initialized
     * @private
     */
    _ensureInit() {
        if (!this._initialized) {
            throw new Error('AutosaveManager not initialized. Call init() first.');
        }
    }

    /**
     * Start autosaving for a presentation
     * @param {string} presentationId - Presentation ID
     */
    startSession(presentationId) {
        this._ensureInit();
        this._currentPresentationId = presentationId;
        this._hasUnsavedChanges = false;
        this._version = 0;
        this._notifyStateChange();
    }

    /**
     * End the current autosave session
     */
    endSession() {
        this._clearDebounce();
        this._currentPresentationId = null;
        this._hasUnsavedChanges = false;
        this._pendingState = null;
        this._notifyStateChange();
    }

    /**
     * Check if autosave is enabled
     * @returns {boolean}
     */
    get isEnabled() {
        return this.options.enabled;
    }

    /**
     * Enable or disable autosave
     * @param {boolean} enabled - Enable state
     */
    setEnabled(enabled) {
        this.options.enabled = enabled;
        if (!enabled) {
            this._clearDebounce();
        }
    }

    /**
     * Check if there are unsaved changes
     * @returns {boolean}
     */
    get hasUnsavedChanges() {
        return this._hasUnsavedChanges;
    }

    /**
     * Get the current presentation ID
     * @returns {string|null}
     */
    get currentPresentationId() {
        return this._currentPresentationId;
    }

    /**
     * Get the last save time
     * @returns {Date|null}
     */
    get lastSaveTime() {
        return this._lastSaveTime;
    }

    /**
     * Check if a save is in progress
     * @returns {boolean}
     */
    get isSaving() {
        return this._saveInProgress;
    }

    /**
     * Mark state as changed and schedule autosave
     * @param {Object} state - Current app state to save
     */
    markChanged(state) {
        this._ensureInit();

        if (!this._currentPresentationId) {
            console.warn('No active presentation session');
            return;
        }

        this._hasUnsavedChanges = true;
        this._pendingState = state;
        this._version++;
        this._notifyStateChange();

        if (this.options.enabled) {
            this._scheduleAutosave();
        }
    }

    /**
     * Mark state as saved
     */
    markSaved() {
        this._hasUnsavedChanges = false;
        this._pendingState = null;
        this._lastSaveTime = new Date();
        this._notifyStateChange();
    }

    /**
     * Force an immediate save
     * @param {Object} state - State to save (uses pending state if not provided)
     * @returns {Promise<void>}
     */
    async saveNow(state = null) {
        this._ensureInit();
        this._clearDebounce();
        
        const stateToSave = state || this._pendingState;
        if (!stateToSave) {
            return;
        }

        await this._performSave(stateToSave);
    }

    /**
     * Schedule a debounced autosave
     * @private
     */
    _scheduleAutosave() {
        this._clearDebounce();
        
        this._debounceTimer = setTimeout(async () => {
            if (this._pendingState) {
                await this._performSave(this._pendingState);
            }
        }, this.options.debounceMs);
    }

    /**
     * Clear the debounce timer
     * @private
     */
    _clearDebounce() {
        if (this._debounceTimer) {
            clearTimeout(this._debounceTimer);
            this._debounceTimer = null;
        }
    }

    /**
     * Perform the actual save operation
     * @param {Object} state - State to save
     * @private
     */
    async _performSave(state) {
        if (this._saveInProgress) {
            // Re-schedule if save is already in progress
            this._scheduleAutosave();
            return;
        }

        if (!this._currentPresentationId) {
            return;
        }

        this._saveInProgress = true;
        const saveVersion = this._version;

        try {
            // Create autosave entry
            const autosaveData = {
                id: `autosave_${this._currentPresentationId}`,
                presentationId: this._currentPresentationId,
                state: state,
                version: saveVersion,
                savedAt: new Date().toISOString()
            };

            // Store in cache
            await this._cache.cacheFile(
                autosaveData.id,
                new Blob([JSON.stringify(autosaveData)], { type: 'application/json' }),
                { autosave: true, presentationId: this._currentPresentationId }
            );

            // Only mark as saved if no new changes came in during save
            if (this._version === saveVersion) {
                this.markSaved();
            }

            // Notify success
            if (this.options.onSave) {
                this.options.onSave({
                    presentationId: this._currentPresentationId,
                    savedAt: autosaveData.savedAt,
                    version: saveVersion
                });
            }
        } catch (error) {
            console.error('Autosave failed:', error);
            
            // Notify error
            if (this.options.onError) {
                this.options.onError({
                    error: error.message,
                    presentationId: this._currentPresentationId
                });
            }
        } finally {
            this._saveInProgress = false;
        }
    }

    /**
     * Check for and recover autosaved data
     * @param {string} presentationId - Presentation ID to check
     * @returns {Promise<Object|null>} Recovered state or null
     */
    async checkForRecovery(presentationId) {
        this._ensureInit();

        const autosaveId = `autosave_${presentationId}`;

        try {
            const cachedFile = await this._cache.getFile(autosaveId);
            if (!cachedFile) {
                return null;
            }

            const blob = cachedFile.data;
            const text = await blob.text();
            const autosaveData = JSON.parse(text);

            return {
                state: autosaveData.state,
                savedAt: new Date(autosaveData.savedAt),
                version: autosaveData.version
            };
        } catch (error) {
            console.warn('Error checking for recovery:', error);
            return null;
        }
    }

    /**
     * Clear autosave data for a presentation
     * @param {string} presentationId - Presentation ID
     * @returns {Promise<void>}
     */
    async clearAutosave(presentationId) {
        this._ensureInit();
        const autosaveId = `autosave_${presentationId}`;
        await this._cache.removeFile(autosaveId);
    }

    /**
     * Get all autosaved presentations
     * @returns {Promise<Array>} List of autosave entries
     */
    async getAutosaveList() {
        this._ensureInit();

        // This requires a custom query on the cache
        // For now, return empty - would need to enhance FileCache
        return [];
    }

    /**
     * Notify state change callback
     * @private
     */
    _notifyStateChange() {
        if (this.options.onStateChange) {
            this.options.onStateChange({
                hasUnsavedChanges: this._hasUnsavedChanges,
                isSaving: this._saveInProgress,
                lastSaveTime: this._lastSaveTime,
                presentationId: this._currentPresentationId
            });
        }
    }

    /**
     * Handle browser beforeunload event
     * @returns {string|undefined} Warning message if unsaved changes
     */
    getBeforeUnloadMessage() {
        if (this._hasUnsavedChanges) {
            return 'You have unsaved changes. Are you sure you want to leave?';
        }
        return undefined;
    }

    /**
     * Register beforeunload handler
     */
    registerBeforeUnload() {
        window.addEventListener('beforeunload', this._handleBeforeUnload);
    }

    /**
     * Unregister beforeunload handler
     */
    unregisterBeforeUnload() {
        window.removeEventListener('beforeunload', this._handleBeforeUnload);
    }

    /**
     * Handle beforeunload event
     * @param {Event} event - BeforeUnload event
     * @private
     */
    _handleBeforeUnload = (event) => {
        const message = this.getBeforeUnloadMessage();
        if (message) {
            event.preventDefault();
            event.returnValue = message;
            return message;
        }
    };

    /**
     * Dispose of the autosave manager
     */
    dispose() {
        this.endSession();
        this.unregisterBeforeUnload();
        this._cache.close();
    }
}

export default AutosaveManager;
