/**
 * FileCache
 * IndexedDB-based cache for .str files and recent files list
 */

import { CACHE_DB } from '../constants/StorageConstants.js';

export class FileCache {
    constructor() {
        this.dbName = CACHE_DB.NAME;
        this.dbVersion = CACHE_DB.VERSION;
        this.db = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the IndexedDB database
     * @returns {Promise<void>}
     */
    async init() {
        if (this.isInitialized) return;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('Failed to open FileCache database:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.isInitialized = true;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Files store - full .str file blobs
                if (!db.objectStoreNames.contains(CACHE_DB.STORES.FILES)) {
                    const filesStore = db.createObjectStore(CACHE_DB.STORES.FILES, {
                        keyPath: 'id'
                    });
                    filesStore.createIndex('lastOpened', 'lastOpened');
                    filesStore.createIndex('cloudPath', 'cloudPath');
                }

                // Assets store - individual assets for quick access
                if (!db.objectStoreNames.contains(CACHE_DB.STORES.ASSETS)) {
                    const assetsStore = db.createObjectStore(CACHE_DB.STORES.ASSETS, {
                        keyPath: 'id'
                    });
                    assetsStore.createIndex('fileId', 'fileId');
                    assetsStore.createIndex('hash', 'hash');
                }

                // Recent files store - metadata only for quick listing
                if (!db.objectStoreNames.contains(CACHE_DB.STORES.RECENT)) {
                    const recentStore = db.createObjectStore(CACHE_DB.STORES.RECENT, {
                        keyPath: 'id'
                    });
                    recentStore.createIndex('lastOpened', 'lastOpened');
                }
            };
        });
    }

    /**
     * Ensure database is initialized
     * @private
     */
    async _ensureInit() {
        if (!this.isInitialized) {
            await this.init();
        }
    }

    /**
     * Cache a file blob
     * @param {string} fileId - Unique file identifier
     * @param {Blob} blob - The .str file blob
     * @param {Object} metadata - File metadata
     * @param {string} cloudPath - Optional cloud storage path
     * @returns {Promise<void>}
     */
    async cacheFile(fileId, blob, metadata, cloudPath = null) {
        await this._ensureInit();

        const transaction = this.db.transaction([CACHE_DB.STORES.FILES], 'readwrite');
        const store = transaction.objectStore(CACHE_DB.STORES.FILES);

        return new Promise((resolve, reject) => {
            const request = store.put({
                id: fileId,
                blob: blob,
                metadata: metadata,
                cloudPath: cloudPath,
                lastOpened: Date.now(),
                cachedAt: Date.now()
            });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get a cached file
     * @param {string} fileId - File identifier
     * @returns {Promise<Object|null>} Cached file data or null
     */
    async getFile(fileId) {
        await this._ensureInit();

        const transaction = this.db.transaction([CACHE_DB.STORES.FILES], 'readonly');
        const store = transaction.objectStore(CACHE_DB.STORES.FILES);

        return new Promise((resolve, reject) => {
            const request = store.get(fileId);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Update last opened time for a file
     * @param {string} fileId - File identifier
     * @returns {Promise<void>}
     */
    async touchFile(fileId) {
        await this._ensureInit();

        const file = await this.getFile(fileId);
        if (file) {
            file.lastOpened = Date.now();
            await this.cacheFile(fileId, file.blob, file.metadata, file.cloudPath);
        }
    }

    /**
     * Remove a cached file
     * @param {string} fileId - File identifier
     * @returns {Promise<void>}
     */
    async removeFile(fileId) {
        await this._ensureInit();

        const transaction = this.db.transaction([CACHE_DB.STORES.FILES], 'readwrite');
        const store = transaction.objectStore(CACHE_DB.STORES.FILES);

        return new Promise((resolve, reject) => {
            const request = store.delete(fileId);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Add to recent files list
     * @param {string} fileId - File identifier
     * @param {Object} info - File info (title, thumbnail, etc.)
     * @returns {Promise<void>}
     */
    async addToRecent(fileId, info) {
        await this._ensureInit();

        const transaction = this.db.transaction([CACHE_DB.STORES.RECENT], 'readwrite');
        const store = transaction.objectStore(CACHE_DB.STORES.RECENT);

        return new Promise((resolve, reject) => {
            const request = store.put({
                id: fileId,
                title: info.title || 'Untitled',
                thumbnailUrl: info.thumbnailUrl || null,
                cloudPath: info.cloudPath || null,
                cloudProvider: info.cloudProvider || null,
                lastOpened: Date.now(),
                created: info.created || new Date().toISOString(),
                modified: info.modified || new Date().toISOString()
            });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get recent files list
     * @param {number} limit - Maximum number of files to return
     * @returns {Promise<Object[]>} Array of recent file info
     */
    async getRecentFiles(limit = 10) {
        await this._ensureInit();

        const transaction = this.db.transaction([CACHE_DB.STORES.RECENT], 'readonly');
        const store = transaction.objectStore(CACHE_DB.STORES.RECENT);
        const index = store.index('lastOpened');

        return new Promise((resolve, reject) => {
            const results = [];
            const request = index.openCursor(null, 'prev');

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && results.length < limit) {
                    results.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Remove from recent files
     * @param {string} fileId - File identifier
     * @returns {Promise<void>}
     */
    async removeFromRecent(fileId) {
        await this._ensureInit();

        const transaction = this.db.transaction([CACHE_DB.STORES.RECENT], 'readwrite');
        const store = transaction.objectStore(CACHE_DB.STORES.RECENT);

        return new Promise((resolve, reject) => {
            const request = store.delete(fileId);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Clear old cached files
     * @param {number} maxAge - Maximum age in milliseconds
     * @returns {Promise<number>} Number of files cleared
     */
    async clearOldFiles(maxAge = CACHE_DB.MAX_AGE_MS) {
        await this._ensureInit();

        const cutoff = Date.now() - maxAge;
        let cleared = 0;

        const transaction = this.db.transaction([CACHE_DB.STORES.FILES], 'readwrite');
        const store = transaction.objectStore(CACHE_DB.STORES.FILES);
        const index = store.index('lastOpened');

        return new Promise((resolve, reject) => {
            const request = index.openCursor();

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    if (cursor.value.lastOpened < cutoff) {
                        cursor.delete();
                        cleared++;
                    }
                    cursor.continue();
                } else {
                    resolve(cleared);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get cache storage usage
     * @returns {Promise<Object>} Storage usage info
     */
    async getStorageUsage() {
        await this._ensureInit();

        let totalSize = 0;
        let fileCount = 0;

        const transaction = this.db.transaction([CACHE_DB.STORES.FILES], 'readonly');
        const store = transaction.objectStore(CACHE_DB.STORES.FILES);

        return new Promise((resolve, reject) => {
            const request = store.openCursor();

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    fileCount++;
                    if (cursor.value.blob) {
                        totalSize += cursor.value.blob.size || 0;
                    }
                    cursor.continue();
                } else {
                    resolve({
                        fileCount,
                        totalSize,
                        formattedSize: this._formatBytes(totalSize)
                    });
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Clear all cached data
     * @returns {Promise<void>}
     */
    async clearAll() {
        await this._ensureInit();

        const stores = [CACHE_DB.STORES.FILES, CACHE_DB.STORES.ASSETS, CACHE_DB.STORES.RECENT];
        
        for (const storeName of stores) {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            await new Promise((resolve, reject) => {
                const request = store.clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }
    }

    /**
     * Format bytes to human readable string
     * @param {number} bytes - Number of bytes
     * @returns {string} Formatted string
     */
    _formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Close the database connection
     */
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            this.isInitialized = false;
        }
    }
}

// Singleton instance
let fileCacheInstance = null;

/**
 * Get the singleton FileCache instance
 * @returns {FileCache}
 */
export function getFileCache() {
    if (!fileCacheInstance) {
        fileCacheInstance = new FileCache();
    }
    return fileCacheInstance;
}

export default FileCache;
