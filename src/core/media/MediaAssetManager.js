/**
 * MediaAssetManager - Central Asset Registry for Media Fills
 * 
 * This singleton manages all media assets (images, videos) during a session.
 * It provides:
 * - Asset import and registration
 * - Hash-based deduplication
 * - Blob URL lifecycle management
 * - Reference counting for undo/redo safety
 * 
 * @see documentation/tech-specs/fills/media-asset-integration.md
 */

import { EventEmitter } from '../Events.js';
import {
    ASSET_ID_PREFIX,
    SUPPORTED_IMAGE_FORMATS,
    SUPPORTED_VIDEO_FORMATS,
    FILE_SIZE_LIMITS,
    isImageFormat,
    isVideoFormat,
    validateFileSize
} from '../constants/MediaDefaults.js';

// ─────────────────────────────────────────────────────────────
// Type Definitions (JSDoc)
// ─────────────────────────────────────────────────────────────

/**
 * @typedef {Object} AssetEntry
 * @property {string} id - Unique identifier (hash-based)
 * @property {string} contentHash - SHA-256 of file content
 * @property {string} originalName - Original filename
 * @property {string} mimeType - MIME type
 * @property {number} size - File size in bytes
 * @property {Blob} blob - The actual file data
 * @property {string|null} blobUrl - Current blob URL (lazy created)
 * @property {string|null} dataUrl - Data URL for small files
 * @property {'image'|'video'} category
 * @property {AssetMetadata} metadata - Type-specific metadata
 * @property {number} refCount - Active references (elements using this)
 * @property {number} historyRefCount - References from undo/redo stack
 * @property {number} createdAt - Timestamp
 */

/**
 * @typedef {Object} AssetHandle
 * @property {string} assetId - The asset identifier
 * @property {string} blobUrl - Blob URL for immediate use
 * @property {AssetMetadata} metadata - Asset metadata
 */

/**
 * @typedef {Object} AssetMetadata
 * @property {number} width - For images/videos
 * @property {number} height
 * @property {number} [duration] - For videos (seconds)
 * @property {boolean} [animated] - For GIFs/animated WebP
 * @property {string} [posterDataUrl] - Data URL of first frame (videos)
 */

// ─────────────────────────────────────────────────────────────
// MediaAssetManager Class
// ─────────────────────────────────────────────────────────────

class MediaAssetManager extends EventEmitter {
    constructor() {
        super();
        
        /** @type {Map<string, AssetEntry>} */
        this.assets = new Map();
        
        /** @type {Map<string, string>} blobUrl → assetId */
        this.blobToAsset = new Map();
        
        /** @type {Map<string, string>} contentHash → assetId */
        this.hashToAsset = new Map();
        
        /** @type {Map<string, string>} assetPath → assetId (for loaded files) */
        this.pathToAsset = new Map();
    }

    // ─────────────────────────────────────────────────────────────
    // IMPORT: User adds media
    // ─────────────────────────────────────────────────────────────

    /**
     * Import a file from user action (drop, paste, file picker)
     * @param {File} file - The file to import
     * @returns {Promise<AssetHandle>} - Handle for use in fills
     */
    async importFile(file) {
        // Validate format
        if (!isImageFormat(file.type) && !isVideoFormat(file.type)) {
            throw new Error(`Unsupported format: ${file.type}`);
        }
        
        // Validate size
        const sizeCheck = validateFileSize(file);
        if (!sizeCheck.valid) {
            throw new Error(sizeCheck.message);
        }
        
        // Generate content-based asset ID
        const assetId = await this.generateAssetId(file);
        
        // Check for existing asset with same content (deduplication)
        if (this.assets.has(assetId)) {
            const existing = this.assets.get(assetId);
            return {
                assetId,
                blobUrl: this.getBlobUrl(assetId),
                metadata: existing.metadata
            };
        }
        
        // Determine category
        const category = isVideoFormat(file.type) ? 'video' : 'image';
        
        // Extract metadata
        const metadata = await this._extractMetadata(file, category);
        
        // Create entry
        const entry = {
            id: assetId,
            contentHash: await this._computeHash(file),
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            blob: file,
            blobUrl: null,
            dataUrl: null,
            category,
            metadata,
            refCount: 0,
            historyRefCount: 0,
            createdAt: Date.now()
        };
        
        // For small files, also create data URL (for persistence)
        if (file.size <= FILE_SIZE_LIMITS.inline) {
            entry.dataUrl = await this._blobToDataUrl(file);
        }
        
        // Register
        this.assets.set(assetId, entry);
        this.hashToAsset.set(entry.contentHash, assetId);
        
        // Emit event
        this.emit('asset-added', { assetId, entry });
        
        return {
            assetId,
            blobUrl: this.getBlobUrl(assetId),
            metadata
        };
    }

    /**
     * Import from a remote URL
     * @param {string} url - HTTP(S) URL
     * @returns {Promise<AssetHandle>}
     */
    async importUrl(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch: ${response.status}`);
            }
            
            const contentType = response.headers.get('content-type') || 'application/octet-stream';
            const blob = await response.blob();
            
            // Extract filename from URL
            const urlPath = new URL(url).pathname;
            const fileName = urlPath.split('/').pop() || 'imported';
            
            const file = new File([blob], fileName, { type: contentType });
            return this.importFile(file);
        } catch (error) {
            throw new Error(`Failed to import URL: ${error.message}`);
        }
    }

    /**
     * Import from clipboard
     * @param {ClipboardEvent} event
     * @returns {Promise<AssetHandle|null>}
     */
    async importFromClipboard(event) {
        const items = event.clipboardData?.items;
        if (!items) return null;
        
        for (const item of items) {
            if (item.kind === 'file' && (isImageFormat(item.type) || isVideoFormat(item.type))) {
                const file = item.getAsFile();
                if (file) {
                    return this.importFile(file);
                }
            }
        }
        
        return null;
    }

    // ─────────────────────────────────────────────────────────────
    // ACCESS: Get asset data for rendering
    // ─────────────────────────────────────────────────────────────

    /**
     * Get blob URL for rendering (creates if needed)
     * @param {string} assetId - The asset identifier
     * @returns {string|null} - Blob URL for use in img/video src
     */
    getBlobUrl(assetId) {
        const entry = this.assets.get(assetId);
        if (!entry) return null;
        
        // Create blob URL if not exists
        if (!entry.blobUrl) {
            entry.blobUrl = URL.createObjectURL(entry.blob);
            this.blobToAsset.set(entry.blobUrl, assetId);
        }
        
        return entry.blobUrl;
    }

    /**
     * Get data URL (for small files or clipboard)
     * @param {string} assetId
     * @returns {string|null}
     */
    getDataUrl(assetId) {
        const entry = this.assets.get(assetId);
        return entry?.dataUrl || null;
    }

    /**
     * Get renderable URL - prefers data URL for small files, blob URL otherwise
     * @param {string} assetId
     * @returns {string|null}
     */
    getRenderableUrl(assetId) {
        const entry = this.assets.get(assetId);
        if (!entry) return null;
        
        // For small files, use data URL (works after serialization)
        if (entry.dataUrl) {
            return entry.dataUrl;
        }
        
        // For large files, use blob URL
        return this.getBlobUrl(assetId);
    }

    /**
     * Get asset metadata
     * @param {string} assetId
     * @returns {AssetMetadata|null}
     */
    getMetadata(assetId) {
        const entry = this.assets.get(assetId);
        return entry?.metadata || null;
    }

    /**
     * Get full asset entry
     * @param {string} assetId
     * @returns {AssetEntry|null}
     */
    getEntry(assetId) {
        return this.assets.get(assetId) || null;
    }

    /**
     * Check if asset exists
     * @param {string} assetId
     * @returns {boolean}
     */
    has(assetId) {
        return this.assets.has(assetId);
    }

    /**
     * Get asset ID from blob URL
     * @param {string} blobUrl
     * @returns {string|null}
     */
    getAssetIdFromBlobUrl(blobUrl) {
        return this.blobToAsset.get(blobUrl) || null;
    }

    // ─────────────────────────────────────────────────────────────
    // REFERENCE COUNTING: For undo/redo safety
    // ─────────────────────────────────────────────────────────────

    /**
     * Increment reference count (called when asset used in fill)
     * @param {string} assetId
     */
    retain(assetId) {
        const entry = this.assets.get(assetId);
        if (entry) {
            entry.refCount++;
            this.emit('asset-retained', { assetId, refCount: entry.refCount });
        }
    }

    /**
     * Decrement reference count (called when fill removed)
     * @param {string} assetId
     */
    release(assetId) {
        const entry = this.assets.get(assetId);
        if (entry && entry.refCount > 0) {
            entry.refCount--;
            this.emit('asset-released', { assetId, refCount: entry.refCount });
            
            // Clean up if no more references (and not in history)
            this._maybeCleanup(assetId);
        }
    }

    /**
     * Mark asset as referenced by history stack
     * @param {string} assetId
     */
    retainForHistory(assetId) {
        const entry = this.assets.get(assetId);
        if (entry) {
            entry.historyRefCount++;
        }
    }

    /**
     * Release history reference
     * @param {string} assetId
     */
    releaseFromHistory(assetId) {
        const entry = this.assets.get(assetId);
        if (entry && entry.historyRefCount > 0) {
            entry.historyRefCount--;
            this._maybeCleanup(assetId);
        }
    }

    /**
     * Clean up asset if no references remain
     * @private
     */
    _maybeCleanup(assetId) {
        const entry = this.assets.get(assetId);
        if (!entry) return;
        
        // Don't cleanup if still referenced
        if (entry.refCount > 0 || entry.historyRefCount > 0) return;
        
        // Revoke blob URL if exists
        if (entry.blobUrl) {
            URL.revokeObjectURL(entry.blobUrl);
            this.blobToAsset.delete(entry.blobUrl);
        }
        
        // Remove from registries
        this.hashToAsset.delete(entry.contentHash);
        this.assets.delete(assetId);
        
        this.emit('asset-removed', { assetId });
    }

    // ─────────────────────────────────────────────────────────────
    // SERIALIZATION: For save/load
    // ─────────────────────────────────────────────────────────────

    /**
     * Get all assets for saving (files to include in .str)
     * @returns {Map<string, {blob: Blob, metadata: Object}>}
     */
    getAssetsForSave() {
        const result = new Map();
        
        for (const [assetId, entry] of this.assets) {
            if (entry.refCount > 0) {  // Only save referenced assets
                const assetPath = `assets/${entry.category}s/${assetId}`;
                result.set(assetPath, {
                    blob: entry.blob,
                    metadata: {
                        originalName: entry.originalName,
                        mimeType: entry.mimeType,
                        size: entry.size,
                        contentHash: entry.contentHash,
                        ...entry.metadata
                    }
                });
            }
        }
        
        return result;
    }

    /**
     * Load asset from saved file (used when opening .str file)
     * @param {string} assetId
     * @param {Object} data
     */
    async loadAsset(assetId, data) {
        const { blob, originalName, mimeType, size, contentHash, ...metadata } = data;
        
        const category = isVideoFormat(mimeType) ? 'video' : 'image';
        
        const entry = {
            id: assetId,
            contentHash,
            originalName,
            mimeType,
            size,
            blob,
            blobUrl: null,
            dataUrl: null,
            category,
            metadata,
            refCount: 0,
            historyRefCount: 0,
            createdAt: Date.now()
        };
        
        // Create data URL for small files
        if (size <= FILE_SIZE_LIMITS.inline) {
            entry.dataUrl = await this._blobToDataUrl(blob);
        }
        
        this.assets.set(assetId, entry);
        this.hashToAsset.set(contentHash, assetId);
        
        this.emit('asset-loaded', { assetId, entry });
    }

    /**
     * Get asset ID for a given asset path (from saved file)
     * @param {string} assetPath
     * @returns {string|null}
     */
    getAssetIdForPath(assetPath) {
        return this.pathToAsset.get(assetPath) || null;
    }

    // ─────────────────────────────────────────────────────────────
    // INTERNAL: Helper methods
    // ─────────────────────────────────────────────────────────────

    /**
     * Generate deterministic asset ID from file content
     * @param {File|Blob} file
     * @returns {Promise<string>}
     */
    async generateAssetId(file) {
        const hash = await this._computeHash(file);
        
        // Check if we already have this content
        const existing = this.hashToAsset.get(hash);
        if (existing) {
            return existing;
        }
        
        // Generate new ID
        const prefix = isVideoFormat(file.type) ? ASSET_ID_PREFIX.video : ASSET_ID_PREFIX.image;
        const ext = this._getExtension(file.type);
        
        return `${prefix}${hash.substring(0, 12)}.${ext}`;
    }

    /**
     * Compute SHA-256 hash of file content
     * @private
     */
    async _computeHash(file) {
        const buffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Get file extension from MIME type
     * @private
     */
    _getExtension(mimeType) {
        const map = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/gif': 'gif',
            'image/webp': 'webp',
            'image/svg+xml': 'svg',
            'image/bmp': 'bmp',
            'image/avif': 'avif',
            'video/mp4': 'mp4',
            'video/webm': 'webm',
            'video/ogg': 'ogv',
            'video/quicktime': 'mov'
        };
        return map[mimeType] || 'bin';
    }

    /**
     * Convert blob to data URL
     * @private
     */
    _blobToDataUrl(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Extract metadata from media file
     * @private
     */
    async _extractMetadata(file, category) {
        if (category === 'video') {
            return this._extractVideoMetadata(file);
        } else {
            return this._extractImageMetadata(file);
        }
    }

    /**
     * Extract image metadata (dimensions, animation)
     * @private
     */
    async _extractImageMetadata(file) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const img = new Image();
            
            img.onload = () => {
                const metadata = {
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    animated: false
                };
                
                // Check for animated formats
                if (file.type === 'image/gif' || file.type === 'image/webp') {
                    // For now, assume all GIFs are animated
                    // TODO: Parse file header to detect actual animation
                    metadata.animated = file.type === 'image/gif';
                }
                
                URL.revokeObjectURL(url);
                resolve(metadata);
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load image'));
            };
            
            img.src = url;
        });
    }

    /**
     * Extract video metadata (dimensions, duration)
     * @private
     */
    async _extractVideoMetadata(file) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const video = document.createElement('video');
            
            video.onloadedmetadata = () => {
                const metadata = {
                    width: video.videoWidth,
                    height: video.videoHeight,
                    duration: video.duration
                };
                
                URL.revokeObjectURL(url);
                resolve(metadata);
            };
            
            video.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load video'));
            };
            
            video.src = url;
            video.load();
        });
    }

    // ─────────────────────────────────────────────────────────────
    // DEBUG: Statistics and diagnostics
    // ─────────────────────────────────────────────────────────────

    /**
     * Get statistics about current asset registry
     * @returns {Object}
     */
    getStats() {
        let totalSize = 0;
        let imageCount = 0;
        let videoCount = 0;
        let orphanedCount = 0;
        
        for (const entry of this.assets.values()) {
            totalSize += entry.size;
            if (entry.category === 'image') imageCount++;
            if (entry.category === 'video') videoCount++;
            if (entry.refCount === 0 && entry.historyRefCount === 0) orphanedCount++;
        }
        
        return {
            totalAssets: this.assets.size,
            imageCount,
            videoCount,
            totalSize,
            totalSizeFormatted: this._formatSize(totalSize),
            orphanedCount,
            blobUrlCount: this.blobToAsset.size
        };
    }

    /**
     * Format bytes for display
     * @private
     */
    _formatSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }

    /**
     * Clear all assets (for testing or reset)
     */
    clear() {
        // Revoke all blob URLs
        for (const entry of this.assets.values()) {
            if (entry.blobUrl) {
                URL.revokeObjectURL(entry.blobUrl);
            }
        }
        
        this.assets.clear();
        this.blobToAsset.clear();
        this.hashToAsset.clear();
        this.pathToAsset.clear();
        
        this.emit('cleared');
    }
}

// ─────────────────────────────────────────────────────────────
// Singleton Export
// ─────────────────────────────────────────────────────────────

export const mediaAssetManager = new MediaAssetManager();

// Also export class for testing
export { MediaAssetManager };
