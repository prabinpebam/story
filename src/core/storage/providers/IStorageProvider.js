/**
 * IStorageProvider
 * Abstract interface for storage providers (local, cloud, etc.)
 * 
 * All storage providers must implement this interface
 */

/**
 * @typedef {Object} FileHandle
 * @property {string} id - Unique identifier for the file
 * @property {string} name - File name
 * @property {string} [path] - File path (if applicable)
 * @property {string} [provider] - Provider name
 * @property {Object} [metadata] - Additional provider-specific metadata
 */

/**
 * @typedef {Object} FileInfo
 * @property {string} id - File identifier
 * @property {string} name - File name
 * @property {number} size - File size in bytes
 * @property {Date} modified - Last modified date
 * @property {Date} [created] - Creation date
 * @property {string} [mimeType] - MIME type
 * @property {string} [thumbnailUrl] - Thumbnail URL if available
 */

/**
 * @typedef {Object} ProviderInfo
 * @property {string} id - Provider identifier
 * @property {string} name - Display name
 * @property {string} icon - Icon identifier or URL
 * @property {boolean} supportsAuth - Whether authentication is required
 * @property {boolean} supportsConflictResolution - Whether provider handles conflicts
 */

export class IStorageProvider {
    /**
     * Get provider information
     * @returns {ProviderInfo}
     */
    getProviderInfo() {
        throw new Error('Not implemented');
    }

    /**
     * Get the provider ID
     * @returns {string}
     */
    get id() {
        return this.getProviderInfo().id;
    }

    /**
     * Get the provider display name
     * @returns {string}
     */
    get name() {
        return this.getProviderInfo().name;
    }

    /**
     * Check if the user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        throw new Error('Not implemented');
    }

    /**
     * Authenticate with the provider
     * @returns {Promise<void>}
     */
    async authenticate() {
        throw new Error('Not implemented');
    }

    /**
     * Sign out from the provider
     * @returns {Promise<void>}
     */
    async signOut() {
        throw new Error('Not implemented');
    }

    /**
     * Show file picker to select a file
     * @returns {Promise<FileHandle|null>} Selected file handle or null if cancelled
     */
    async showPicker() {
        throw new Error('Not implemented');
    }

    /**
     * Show folder picker to select a save location
     * @param {string} suggestedName - Suggested file name
     * @returns {Promise<FileHandle|null>} Selected file handle or null if cancelled
     */
    async showSavePicker(suggestedName) {
        throw new Error('Not implemented');
    }

    /**
     * Read a file's contents
     * @param {FileHandle} handle - File handle
     * @param {Object} options - Read options
     * @param {Function} [options.onProgress] - Progress callback (0-1)
     * @returns {Promise<ArrayBuffer>}
     */
    async read(handle, options = {}) {
        throw new Error('Not implemented');
    }

    /**
     * Write data to a file
     * @param {FileHandle} handle - File handle
     * @param {ArrayBuffer|Blob} data - Data to write
     * @param {Object} options - Write options
     * @param {Function} [options.onProgress] - Progress callback (0-1)
     * @returns {Promise<FileHandle>} Updated file handle
     */
    async write(handle, data, options = {}) {
        throw new Error('Not implemented');
    }

    /**
     * Get file information
     * @param {FileHandle} handle - File handle
     * @returns {Promise<FileInfo>}
     */
    async getFileInfo(handle) {
        throw new Error('Not implemented');
    }

    /**
     * Delete a file
     * @param {FileHandle} handle - File handle
     * @returns {Promise<void>}
     */
    async delete(handle) {
        throw new Error('Not implemented');
    }

    /**
     * List files in a folder
     * @param {string} folderId - Folder ID (provider-specific)
     * @returns {Promise<FileInfo[]>}
     */
    async listFiles(folderId) {
        throw new Error('Not implemented');
    }

    /**
     * Check if the provider is available (e.g., online)
     * @returns {Promise<boolean>}
     */
    async isAvailable() {
        return true;
    }
}

export default IStorageProvider;
