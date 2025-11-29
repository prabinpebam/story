/**
 * ZipFileReader
 * Reads .str file (ZIP archive) for Story presentations
 */

// JSZip loaded via CDN in index.html
const JSZip = window.JSZip;
import { ARCHIVE_PATHS, STORAGE_ERRORS } from '../constants/StorageConstants.js';

export class ZipFileReader {
    constructor() {
        this.zip = null;
        this.isInitialized = false;
    }

    /**
     * Initialize reader with a file blob
     * @param {Blob|ArrayBuffer|File} fileData - The .str file data
     */
    async init(fileData) {
        try {
            this.zip = await JSZip.loadAsync(fileData);
            this.isInitialized = true;
        } catch (error) {
            throw new Error(STORAGE_ERRORS.CORRUPT_FILE);
        }
    }

    /**
     * Ensure reader is initialized
     * @private
     */
    _ensureInit() {
        if (!this.isInitialized) {
            throw new Error('ZipFileReader not initialized. Call init() first.');
        }
    }

    /**
     * Read manifest.json
     * @returns {Promise<Object>} Parsed manifest
     */
    async readManifest() {
        this._ensureInit();
        
        const file = this.zip.file(ARCHIVE_PATHS.MANIFEST);
        if (!file) {
            throw new Error(STORAGE_ERRORS.MISSING_MANIFEST);
        }

        const content = await file.async('text');
        return JSON.parse(content);
    }

    /**
     * Read document metadata
     * @returns {Promise<Object>} Parsed metadata
     */
    async readMetadata() {
        this._ensureInit();
        
        const file = this.zip.file(ARCHIVE_PATHS.METADATA);
        if (!file) {
            return null;
        }

        const content = await file.async('text');
        return JSON.parse(content);
    }

    /**
     * Read theme configuration
     * @returns {Promise<Object>} Parsed theme
     */
    async readTheme() {
        this._ensureInit();
        
        const file = this.zip.file(ARCHIVE_PATHS.THEME);
        if (!file) {
            return null;
        }

        const content = await file.async('text');
        return JSON.parse(content);
    }

    /**
     * List all slide IDs in the archive
     * @returns {Promise<string[]>} Array of slide IDs
     */
    async listSlideIds() {
        this._ensureInit();
        
        const slideDir = ARCHIVE_PATHS.SLIDES_DIR + '/';
        const slideFiles = Object.keys(this.zip.files)
            .filter(path => path.startsWith(slideDir))
            .filter(path => path.endsWith('.json'));

        return slideFiles.map(path => {
            const match = path.match(/slide-([^/]+)\.json$/);
            return match ? match[1] : null;
        }).filter(Boolean);
    }

    /**
     * Read a single slide by ID
     * @param {string} slideId - Slide identifier
     * @returns {Promise<Object>} Parsed slide data
     */
    async readSlide(slideId) {
        this._ensureInit();
        
        const path = `${ARCHIVE_PATHS.SLIDES_DIR}/slide-${slideId}.json`;
        const file = this.zip.file(path);
        
        if (!file) {
            throw new Error(`Slide not found: ${slideId}`);
        }

        const content = await file.async('text');
        return JSON.parse(content);
    }

    /**
     * Read all slides
     * @returns {Promise<Object[]>} Array of slide data
     */
    async readAllSlides() {
        const slideIds = await this.listSlideIds();
        const slides = [];

        for (const slideId of slideIds) {
            const slideData = await this.readSlide(slideId);
            slides.push(slideData);
        }

        // Sort by slide order if available
        slides.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        
        return slides;
    }

    /**
     * Read an asset file as Blob
     * @param {string} relativePath - Path relative to assets folder
     * @returns {Promise<Blob>} Asset blob
     */
    async readAssetAsBlob(relativePath) {
        this._ensureInit();
        
        const path = `${ARCHIVE_PATHS.ASSETS_DIR}/${relativePath}`;
        const file = this.zip.file(path);
        
        if (!file) {
            throw new Error(STORAGE_ERRORS.ASSET_NOT_FOUND + `: ${relativePath}`);
        }

        return file.async('blob');
    }

    /**
     * Read an asset file as ArrayBuffer
     * @param {string} relativePath - Path relative to assets folder
     * @returns {Promise<ArrayBuffer>} Asset data
     */
    async readAssetAsArrayBuffer(relativePath) {
        this._ensureInit();
        
        const path = `${ARCHIVE_PATHS.ASSETS_DIR}/${relativePath}`;
        const file = this.zip.file(path);
        
        if (!file) {
            throw new Error(STORAGE_ERRORS.ASSET_NOT_FOUND + `: ${relativePath}`);
        }

        return file.async('arraybuffer');
    }

    /**
     * Read an asset file as base64
     * @param {string} relativePath - Path relative to assets folder
     * @returns {Promise<string>} Base64 encoded asset
     */
    async readAssetAsBase64(relativePath) {
        this._ensureInit();
        
        const path = `${ARCHIVE_PATHS.ASSETS_DIR}/${relativePath}`;
        const file = this.zip.file(path);
        
        if (!file) {
            throw new Error(STORAGE_ERRORS.ASSET_NOT_FOUND + `: ${relativePath}`);
        }

        return file.async('base64');
    }

    /**
     * Read an asset as data URL
     * @param {string} relativePath - Path relative to assets folder
     * @param {string} mimeType - MIME type for the asset
     * @returns {Promise<string>} Data URL
     */
    async readAssetAsDataUrl(relativePath, mimeType) {
        const base64 = await this.readAssetAsBase64(relativePath);
        return `data:${mimeType};base64,${base64}`;
    }

    /**
     * Read thumbnail preview
     * @returns {Promise<Blob|null>} Thumbnail blob or null
     */
    async readThumbnail() {
        this._ensureInit();
        
        const file = this.zip.file(ARCHIVE_PATHS.THUMBNAIL);
        if (!file) {
            return null;
        }

        return file.async('blob');
    }

    /**
     * List all assets in the archive
     * @returns {Promise<Object[]>} Array of asset info objects
     */
    async listAssets() {
        this._ensureInit();
        
        const assetsDir = ARCHIVE_PATHS.ASSETS_DIR + '/';
        const assetFiles = Object.keys(this.zip.files)
            .filter(path => path.startsWith(assetsDir))
            .filter(path => !this.zip.files[path].dir);

        return assetFiles.map(path => ({
            path: path.replace(assetsDir, ''),
            fullPath: path,
            size: this.zip.files[path]._data?.uncompressedSize || 0
        }));
    }

    /**
     * Check if a file exists in the archive
     * @param {string} path - Full path to check
     * @returns {boolean} True if file exists
     */
    hasFile(path) {
        this._ensureInit();
        return this.zip.file(path) !== null;
    }

    /**
     * Read any file as text
     * @param {string} path - Full path to file
     * @returns {Promise<string>} File content as text
     */
    async readFileAsText(path) {
        this._ensureInit();
        
        const file = this.zip.file(path);
        if (!file) {
            return null;
        }

        return file.async('text');
    }

    /**
     * Get total uncompressed size of archive
     * @returns {number} Total size in bytes
     */
    getTotalSize() {
        this._ensureInit();
        
        let total = 0;
        for (const path in this.zip.files) {
            if (!this.zip.files[path].dir) {
                total += this.zip.files[path]._data?.uncompressedSize || 0;
            }
        }
        return total;
    }

    /**
     * Get file count in archive
     * @returns {number} Number of files
     */
    getFileCount() {
        this._ensureInit();
        
        return Object.keys(this.zip.files).filter(
            path => !this.zip.files[path].dir
        ).length;
    }
}

export default ZipFileReader;
