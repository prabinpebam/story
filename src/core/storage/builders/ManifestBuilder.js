/**
 * ManifestBuilder
 * Builds manifest.json for .str file format
 */

import { FILE_FORMAT } from '../constants/StorageConstants.js';

export class ManifestBuilder {
    constructor() {
        this.manifest = {
            formatType: FILE_FORMAT.TYPE,
            formatVersion: FILE_FORMAT.VERSION,
            appVersion: '0.1.0', // Will be updated from app config
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            title: 'Untitled Presentation',
            author: null,
            chunkIndex: {
                slides: [],
                assets: []
            }
        };
    }

    /**
     * Set the application version
     * @param {string} version - App version string
     * @returns {ManifestBuilder} this for chaining
     */
    setAppVersion(version) {
        this.manifest.appVersion = version;
        return this;
    }

    /**
     * Set the presentation title
     * @param {string} title - Presentation title
     * @returns {ManifestBuilder} this for chaining
     */
    setTitle(title) {
        this.manifest.title = title || 'Untitled Presentation';
        return this;
    }

    /**
     * Set the author information
     * @param {string|Object} author - Author name or object with name/email
     * @returns {ManifestBuilder} this for chaining
     */
    setAuthor(author) {
        if (typeof author === 'string') {
            this.manifest.author = author;
        } else if (author && typeof author === 'object') {
            this.manifest.author = author.name || author.email || null;
        }
        return this;
    }

    /**
     * Set creation timestamp
     * @param {Date|string} date - Creation date
     * @returns {ManifestBuilder} this for chaining
     */
    setCreated(date) {
        this.manifest.created = date instanceof Date 
            ? date.toISOString() 
            : date;
        return this;
    }

    /**
     * Set modification timestamp
     * @param {Date|string} date - Modification date
     * @returns {ManifestBuilder} this for chaining
     */
    setModified(date) {
        this.manifest.modified = date instanceof Date 
            ? date.toISOString() 
            : date;
        return this;
    }

    /**
     * Add slide chunk information
     * @param {string} slideId - Slide identifier
     * @param {number} size - Size in bytes
     * @param {number} order - Slide order (0-based)
     * @returns {ManifestBuilder} this for chaining
     */
    addSlideChunk(slideId, size, order = 0) {
        this.manifest.chunkIndex.slides.push({
            id: slideId,
            path: `document/slides/slide-${slideId}.json`,
            size: size,
            order: order
        });
        return this;
    }

    /**
     * Add asset chunk information
     * @param {string} assetId - Asset identifier
     * @param {string} path - Path within assets folder
     * @param {number} size - Size in bytes
     * @param {string} hash - SHA-256 hash of content
     * @param {string} mimeType - MIME type of asset
     * @returns {ManifestBuilder} this for chaining
     */
    addAssetChunk(assetId, path, size, hash, mimeType = null) {
        this.manifest.chunkIndex.assets.push({
            id: assetId,
            path: `assets/${path}`,
            size: size,
            hash: hash,
            mimeType: mimeType
        });
        return this;
    }

    /**
     * Set custom metadata field
     * @param {string} key - Metadata key
     * @param {any} value - Metadata value
     * @returns {ManifestBuilder} this for chaining
     */
    setCustomField(key, value) {
        this.manifest[key] = value;
        return this;
    }

    /**
     * Build the manifest object
     * @returns {Object} The completed manifest
     */
    build() {
        // Ensure modified date is current
        this.manifest.modified = new Date().toISOString();
        
        // Sort slides by order
        this.manifest.chunkIndex.slides.sort((a, b) => a.order - b.order);
        
        return { ...this.manifest };
    }

    /**
     * Build and return as JSON string
     * @param {boolean} pretty - Whether to format with indentation
     * @returns {string} JSON string
     */
    toJSON(pretty = true) {
        return JSON.stringify(this.build(), null, pretty ? 2 : 0);
    }

    /**
     * Create from existing manifest (for updates)
     * @param {Object} existing - Existing manifest object
     * @returns {ManifestBuilder} New builder with existing data
     */
    static fromExisting(existing) {
        const builder = new ManifestBuilder();
        builder.manifest = {
            ...builder.manifest,
            ...existing,
            chunkIndex: {
                slides: [...(existing.chunkIndex?.slides || [])],
                assets: [...(existing.chunkIndex?.assets || [])]
            }
        };
        return builder;
    }
}

export default ManifestBuilder;
