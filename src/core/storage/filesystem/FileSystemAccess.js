/**
 * FileSystemAccess
 * Wrapper around the File System Access API with fallback support
 * 
 * Features:
 * - File picker for open/save operations
 * - Handle-based file access for save-to-same-file
 * - Fallback to traditional file input for unsupported browsers
 */

import { FILE_FORMAT, STORAGE_ERRORS } from '../constants/StorageConstants.js';

export class FileSystemAccess {
    constructor() {
        this._currentHandle = null;
        this._supportsFileSystemAccess = this._checkSupport();
    }

    /**
     * Check if File System Access API is supported
     * @returns {boolean}
     */
    _checkSupport() {
        return typeof window !== 'undefined' && 
               'showOpenFilePicker' in window &&
               'showSaveFilePicker' in window;
    }

    /**
     * Check if File System Access API is supported
     * @returns {boolean}
     */
    get isSupported() {
        return this._supportsFileSystemAccess;
    }

    /**
     * Get the current file handle
     * @returns {FileSystemFileHandle|null}
     */
    get currentHandle() {
        return this._currentHandle;
    }

    /**
     * Check if there's a current file open
     * @returns {boolean}
     */
    get hasCurrentFile() {
        return this._currentHandle !== null;
    }

    /**
     * Clear the current file handle
     */
    clearCurrentFile() {
        this._currentHandle = null;
    }

    /**
     * Get the file type filter for the file picker
     * @returns {Object} File type filter
     */
    _getFileTypeFilter() {
        return {
            description: 'Story Presentation',
            accept: {
                [FILE_FORMAT.MIME_TYPE]: [FILE_FORMAT.EXTENSION]
            }
        };
    }

    /**
     * Show file picker to open a file
     * @returns {Promise<{handle: FileSystemFileHandle, file: File}>}
     */
    async showOpenPicker() {
        if (this._supportsFileSystemAccess) {
            return this._showNativeOpenPicker();
        } else {
            return this._showFallbackOpenPicker();
        }
    }

    /**
     * Show native file picker for opening
     * @returns {Promise<{handle: FileSystemFileHandle, file: File}>}
     * @private
     */
    async _showNativeOpenPicker() {
        try {
            const [handle] = await window.showOpenFilePicker({
                types: [this._getFileTypeFilter()],
                multiple: false
            });

            const file = await handle.getFile();
            this._currentHandle = handle;

            return { handle, file };
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error(STORAGE_ERRORS.USER_CANCELLED);
            }
            throw error;
        }
    }

    /**
     * Show fallback file input for opening
     * @returns {Promise<{handle: null, file: File}>}
     * @private
     */
    async _showFallbackOpenPicker() {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = FILE_FORMAT.EXTENSION;

            input.onchange = (event) => {
                const file = event.target.files[0];
                if (file) {
                    this._currentHandle = null; // No handle in fallback mode
                    resolve({ handle: null, file });
                } else {
                    reject(new Error(STORAGE_ERRORS.USER_CANCELLED));
                }
            };

            input.oncancel = () => {
                reject(new Error(STORAGE_ERRORS.USER_CANCELLED));
            };

            // Trigger the file picker
            input.click();
        });
    }

    /**
     * Show file picker to save a file
     * @param {string} suggestedName - Suggested filename
     * @returns {Promise<FileSystemFileHandle>}
     */
    async showSavePicker(suggestedName = 'presentation') {
        // Ensure proper extension
        if (!suggestedName.endsWith(FILE_FORMAT.EXTENSION)) {
            suggestedName += FILE_FORMAT.EXTENSION;
        }

        if (this._supportsFileSystemAccess) {
            return this._showNativeSavePicker(suggestedName);
        } else {
            // In fallback mode, return null - caller should use downloadFile instead
            return null;
        }
    }

    /**
     * Show native file picker for saving
     * @param {string} suggestedName - Suggested filename
     * @returns {Promise<FileSystemFileHandle>}
     * @private
     */
    async _showNativeSavePicker(suggestedName) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName,
                types: [this._getFileTypeFilter()]
            });

            this._currentHandle = handle;
            return handle;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error(STORAGE_ERRORS.USER_CANCELLED);
            }
            throw error;
        }
    }

    /**
     * Write data to a file handle
     * @param {FileSystemFileHandle} handle - File handle
     * @param {Blob|ArrayBuffer} data - Data to write
     * @param {Object} options - Write options
     * @param {Function} options.onProgress - Progress callback (0-1)
     * @returns {Promise<void>}
     */
    async writeFile(handle, data, options = {}) {
        if (!handle) {
            throw new Error('No file handle provided');
        }

        try {
            // Verify we have write permission
            const permission = await this._verifyPermission(handle, 'readwrite');
            if (!permission) {
                throw new Error(STORAGE_ERRORS.PERMISSION_DENIED);
            }

            // Create writable stream
            const writable = await handle.createWritable();

            try {
                // Write data
                if (data instanceof Blob) {
                    await writable.write(data);
                } else {
                    await writable.write(new Blob([data]));
                }

                // Report progress
                if (options.onProgress) {
                    options.onProgress(1);
                }
            } finally {
                // Always close the writable
                await writable.close();
            }
        } catch (error) {
            if (error.message === STORAGE_ERRORS.PERMISSION_DENIED) {
                throw error;
            }
            throw new Error(`${STORAGE_ERRORS.WRITE_FAILED}: ${error.message}`);
        }
    }

    /**
     * Read data from a file handle
     * @param {FileSystemFileHandle} handle - File handle
     * @returns {Promise<File>}
     */
    async readFile(handle) {
        if (!handle) {
            throw new Error('No file handle provided');
        }

        try {
            const permission = await this._verifyPermission(handle, 'read');
            if (!permission) {
                throw new Error(STORAGE_ERRORS.PERMISSION_DENIED);
            }

            return await handle.getFile();
        } catch (error) {
            if (error.message === STORAGE_ERRORS.PERMISSION_DENIED) {
                throw error;
            }
            throw new Error(`${STORAGE_ERRORS.READ_FAILED}: ${error.message}`);
        }
    }

    /**
     * Save data to the current file handle
     * @param {Blob|ArrayBuffer} data - Data to save
     * @param {Object} options - Save options
     * @returns {Promise<boolean>} True if saved to handle, false if fallback needed
     */
    async saveToCurrentFile(data, options = {}) {
        if (!this._currentHandle) {
            return false;
        }

        await this.writeFile(this._currentHandle, data, options);
        return true;
    }

    /**
     * Download a file using the traditional download approach
     * Used as fallback when File System Access API is not available
     * @param {Blob} blob - Blob to download
     * @param {string} filename - Download filename
     */
    downloadFile(blob, filename) {
        if (!filename.endsWith(FILE_FORMAT.EXTENSION)) {
            filename += FILE_FORMAT.EXTENSION;
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Cleanup URL after a short delay
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    /**
     * Verify we have permission to access a file handle
     * @param {FileSystemFileHandle} handle - File handle
     * @param {string} mode - Permission mode ('read' or 'readwrite')
     * @returns {Promise<boolean>}
     * @private
     */
    async _verifyPermission(handle, mode = 'read') {
        // Check current permission
        let permission = await handle.queryPermission({ mode });
        
        if (permission === 'granted') {
            return true;
        }

        // Request permission if not granted
        if (permission === 'prompt') {
            permission = await handle.requestPermission({ mode });
            return permission === 'granted';
        }

        return false;
    }

    /**
     * Get file metadata from handle
     * @param {FileSystemFileHandle} handle - File handle
     * @returns {Promise<{name: string, size: number, lastModified: Date}>}
     */
    async getFileInfo(handle) {
        const file = await handle.getFile();
        return {
            name: file.name,
            size: file.size,
            lastModified: new Date(file.lastModified),
            type: file.type
        };
    }

    /**
     * Get the current file's name
     * @returns {string|null}
     */
    getCurrentFileName() {
        return this._currentHandle?.name || null;
    }
}

export default FileSystemAccess;
