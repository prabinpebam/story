/**
 * CloudStorageManager
 * Manages multiple cloud storage providers and coordinates file operations
 */

import { GoogleDriveProvider } from './GoogleDriveProvider.js';
import { OneDriveProvider } from './OneDriveProvider.js';

/**
 * @typedef {Object} ProviderConfig
 * @property {string} id - Provider ID
 * @property {boolean} enabled - Whether provider is enabled
 * @property {Object} options - Provider-specific options
 */

export class CloudStorageManager {
    /**
     * Create a cloud storage manager
     * @param {Object} config - Configuration
     * @param {ProviderConfig} config.googleDrive - Google Drive config
     * @param {ProviderConfig} config.oneDrive - OneDrive config
     */
    constructor(config = {}) {
        this.providers = new Map();
        this._currentProvider = null;
        this._currentHandle = null;
        
        // Initialize providers based on config
        if (config.googleDrive?.enabled) {
            this.registerProvider(
                new GoogleDriveProvider(config.googleDrive.options)
            );
        }
        
        if (config.oneDrive?.enabled) {
            this.registerProvider(
                new OneDriveProvider(config.oneDrive.options)
            );
        }
    }

    /**
     * Register a storage provider
     * @param {IStorageProvider} provider - Provider instance
     */
    registerProvider(provider) {
        const info = provider.getProviderInfo();
        this.providers.set(info.id, provider);
    }

    /**
     * Get all registered providers
     * @returns {Array<{id: string, name: string, icon: string, authenticated: boolean}>}
     */
    getProviders() {
        return Array.from(this.providers.entries()).map(([id, provider]) => {
            const info = provider.getProviderInfo();
            return {
                id,
                name: info.name,
                icon: info.icon,
                authenticated: provider.isAuthenticated()
            };
        });
    }

    /**
     * Get a provider by ID
     * @param {string} providerId - Provider ID
     * @returns {IStorageProvider|null}
     */
    getProvider(providerId) {
        return this.providers.get(providerId) || null;
    }

    /**
     * Get the current provider
     * @returns {IStorageProvider|null}
     */
    get currentProvider() {
        return this._currentProvider;
    }

    /**
     * Get the current file handle
     * @returns {Object|null}
     */
    get currentHandle() {
        return this._currentHandle;
    }

    /**
     * Set the current provider and handle
     * @param {string} providerId - Provider ID
     * @param {Object} handle - File handle
     */
    setCurrentFile(providerId, handle) {
        this._currentProvider = this.providers.get(providerId);
        this._currentHandle = handle;
    }

    /**
     * Clear the current file
     */
    clearCurrentFile() {
        this._currentProvider = null;
        this._currentHandle = null;
    }

    /**
     * Authenticate with a provider
     * @param {string} providerId - Provider ID
     * @returns {Promise<void>}
     */
    async authenticate(providerId) {
        const provider = this.getProvider(providerId);
        if (!provider) {
            throw new Error(`Unknown provider: ${providerId}`);
        }
        await provider.authenticate();
    }

    /**
     * Handle OAuth callback
     * @param {string} providerId - Provider ID
     * @param {string} code - Authorization code
     * @returns {Promise<void>}
     */
    async handleCallback(providerId, code) {
        const provider = this.getProvider(providerId);
        if (!provider) {
            throw new Error(`Unknown provider: ${providerId}`);
        }
        await provider.handleCallback(code);
    }

    /**
     * Sign out from a provider
     * @param {string} providerId - Provider ID
     * @returns {Promise<void>}
     */
    async signOut(providerId) {
        const provider = this.getProvider(providerId);
        if (!provider) {
            throw new Error(`Unknown provider: ${providerId}`);
        }
        await provider.signOut();
        
        // Clear current file if it was from this provider
        if (this._currentProvider === provider) {
            this.clearCurrentFile();
        }
    }

    /**
     * Sign out from all providers
     * @returns {Promise<void>}
     */
    async signOutAll() {
        for (const provider of this.providers.values()) {
            if (provider.isAuthenticated()) {
                await provider.signOut();
            }
        }
        this.clearCurrentFile();
    }

    /**
     * Open a file from a provider
     * @param {string} providerId - Provider ID
     * @returns {Promise<{handle: Object, data: ArrayBuffer}|null>}
     */
    async openFile(providerId) {
        const provider = this.getProvider(providerId);
        if (!provider) {
            throw new Error(`Unknown provider: ${providerId}`);
        }

        if (!provider.isAuthenticated()) {
            await provider.authenticate();
            // Auth redirects, so we won't get here until callback
            return null;
        }

        const pickerResult = await provider.showPicker();
        if (!pickerResult || pickerResult.type !== 'picker') {
            return null;
        }

        // For now, return the file list for UI to handle
        // In a full implementation, the UI would show a dialog
        // and return the selected file
        return {
            type: 'picker',
            files: pickerResult.files,
            provider: providerId
        };
    }

    /**
     * Read a file from a provider
     * @param {string} providerId - Provider ID
     * @param {Object} handle - File handle
     * @param {Object} options - Read options
     * @returns {Promise<ArrayBuffer>}
     */
    async readFile(providerId, handle, options = {}) {
        const provider = this.getProvider(providerId);
        if (!provider) {
            throw new Error(`Unknown provider: ${providerId}`);
        }

        const data = await provider.read(handle, options);
        
        // Update current file
        this.setCurrentFile(providerId, handle);
        
        return data;
    }

    /**
     * Save to the current file
     * @param {ArrayBuffer|Blob} data - Data to save
     * @param {Object} options - Save options
     * @returns {Promise<boolean>} True if saved, false if no current file
     */
    async saveToCurrentFile(data, options = {}) {
        if (!this._currentProvider || !this._currentHandle) {
            return false;
        }

        const handle = await this._currentProvider.write(this._currentHandle, data, options);
        this._currentHandle = handle;
        return true;
    }

    /**
     * Save file to a provider (Save As)
     * @param {string} providerId - Provider ID
     * @param {ArrayBuffer|Blob} data - Data to save
     * @param {string} suggestedName - Suggested filename
     * @param {Object} options - Save options
     * @returns {Promise<Object>} File handle
     */
    async saveFileAs(providerId, data, suggestedName, options = {}) {
        const provider = this.getProvider(providerId);
        if (!provider) {
            throw new Error(`Unknown provider: ${providerId}`);
        }

        if (!provider.isAuthenticated()) {
            await provider.authenticate();
            return null;
        }

        const saveResult = await provider.showSavePicker(suggestedName);
        if (!saveResult) {
            return null;
        }

        // Create handle for new file
        const handle = {
            name: suggestedName,
            folderId: saveResult.folderId,
            provider: providerId
        };

        const savedHandle = await provider.write(handle, data, options);
        
        // Update current file
        this.setCurrentFile(providerId, savedHandle);
        
        return savedHandle;
    }

    /**
     * Get file info from current file
     * @returns {Promise<Object|null>}
     */
    async getCurrentFileInfo() {
        if (!this._currentProvider || !this._currentHandle) {
            return null;
        }

        return await this._currentProvider.getFileInfo(this._currentHandle);
    }

    /**
     * Check if any provider is authenticated
     * @returns {boolean}
     */
    hasAuthenticatedProvider() {
        for (const provider of this.providers.values()) {
            if (provider.isAuthenticated()) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get all authenticated providers
     * @returns {Array<string>} Provider IDs
     */
    getAuthenticatedProviders() {
        const authenticated = [];
        for (const [id, provider] of this.providers.entries()) {
            if (provider.isAuthenticated()) {
                authenticated.push(id);
            }
        }
        return authenticated;
    }

    /**
     * Check if currently working with a cloud file
     * @returns {boolean}
     */
    hasCurrentCloudFile() {
        return this._currentProvider !== null && this._currentHandle !== null;
    }

    /**
     * Get current file's cloud path
     * @returns {string|null}
     */
    getCurrentCloudPath() {
        if (!this._currentHandle) {
            return null;
        }

        const provider = this._currentProvider.getProviderInfo();
        return `${provider.name}:${this._currentHandle.name}`;
    }

    /**
     * Check online status
     * @returns {boolean}
     */
    isOnline() {
        return navigator.onLine;
    }

    /**
     * Add online/offline event listeners
     * @param {Function} onOnline - Called when coming online
     * @param {Function} onOffline - Called when going offline
     * @returns {Function} Cleanup function
     */
    addNetworkListeners(onOnline, onOffline) {
        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);
        
        return () => {
            window.removeEventListener('online', onOnline);
            window.removeEventListener('offline', onOffline);
        };
    }
}

// Singleton instance
let cloudStorageManagerInstance = null;

/**
 * Get or create the singleton CloudStorageManager
 * @param {Object} config - Configuration (only used on first call)
 * @returns {CloudStorageManager}
 */
export function getCloudStorageManager(config = {}) {
    if (!cloudStorageManagerInstance) {
        // Auto-configure providers if no config provided
        const autoConfig = {
            googleDrive: { enabled: true, options: {} },
            oneDrive: { enabled: true, options: {} },
            ...config
        };
        cloudStorageManagerInstance = new CloudStorageManager(autoConfig);
    }
    return cloudStorageManagerInstance;
}

/**
 * Reset the singleton (for testing)
 */
export function resetCloudStorageManager() {
    cloudStorageManagerInstance = null;
}

export default CloudStorageManager;
