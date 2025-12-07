/**
 * ZipFileWriter
 * Creates .str file (ZIP archive) for Story presentations
 */

// JSZip loaded via CDN in index.html
const JSZip = window.JSZip;
import { COMPRESSION, ARCHIVE_PATHS } from '../constants/StorageConstants.js';

export class ZipFileWriter {
    constructor() {
        this.zip = new JSZip();
    }

    /**
     * Add manifest.json to archive
     * @param {Object} manifest - Manifest object
     */
    addManifest(manifest) {
        this.zip.file(
            ARCHIVE_PATHS.MANIFEST,
            JSON.stringify(manifest, null, 2)
        );
    }

    /**
     * Add document metadata
     * @param {Object} metadata - Document metadata
     */
    addMetadata(metadata) {
        this.zip.file(
            ARCHIVE_PATHS.METADATA,
            JSON.stringify(metadata, null, 2)
        );
    }

    /**
     * Add theme configuration
     * @param {Object} theme - Theme object
     */
    addTheme(theme) {
        this.zip.file(
            ARCHIVE_PATHS.THEME,
            JSON.stringify(theme, null, 2)
        );
    }

    /**
     * Add masters (slide masters and layouts)
     * @param {Object} masters - Masters object
     */
    addMasters(masters) {
        this.zip.file(
            ARCHIVE_PATHS.MASTERS,
            JSON.stringify(masters, null, 2)
        );
    }

    /**
     * Add slide order array
     * @param {string[]} slideOrder - Array of slide IDs
     */
    addSlideOrder(slideOrder) {
        this.zip.file(
            ARCHIVE_PATHS.SLIDE_ORDER,
            JSON.stringify(slideOrder, null, 2)
        );
    }

    /**
     * Add sections array
     * @param {Array} sections - Array of section objects
     */
    addSections(sections) {
        this.zip.file(
            ARCHIVE_PATHS.SECTIONS,
            JSON.stringify(sections, null, 2)
        );
    }

    /**
     * Add a slide to the archive
     * @param {string} slideId - Slide identifier
     * @param {Object} slideData - Slide data
     */
    addSlide(slideId, slideData) {
        const path = `${ARCHIVE_PATHS.SLIDES_DIR}/slide-${slideId}.json`;
        this.zip.file(path, JSON.stringify(slideData, null, 2));
    }

    /**
     * Add an image asset
     * @param {string} filename - Asset filename (with extension)
     * @param {Blob|ArrayBuffer} data - Asset data
     */
    async addImage(filename, data) {
        const path = `${ARCHIVE_PATHS.IMAGES_DIR}/${filename}`;
        this.zip.file(path, data);
    }

    /**
     * Add a video asset
     * @param {string} filename - Asset filename (with extension)
     * @param {Blob|ArrayBuffer} data - Asset data
     */
    async addVideo(filename, data) {
        const path = `${ARCHIVE_PATHS.VIDEOS_DIR}/${filename}`;
        this.zip.file(path, data);
    }

    /**
     * Add a font asset
     * @param {string} filename - Font filename (with extension)
     * @param {Blob|ArrayBuffer} data - Font data
     */
    async addFont(filename, data) {
        const path = `${ARCHIVE_PATHS.FONTS_DIR}/${filename}`;
        this.zip.file(path, data);
    }

    /**
     * Add any asset with custom path
     * @param {string} relativePath - Path relative to assets folder
     * @param {Blob|ArrayBuffer} data - Asset data
     */
    async addAsset(relativePath, data) {
        const path = `${ARCHIVE_PATHS.ASSETS_DIR}/${relativePath}`;
        this.zip.file(path, data);
    }

    /**
     * Add thumbnail preview image
     * @param {Blob} thumbnailBlob - Thumbnail image blob
     */
    async addThumbnail(thumbnailBlob) {
        this.zip.file(ARCHIVE_PATHS.THUMBNAIL, thumbnailBlob);
    }

    /**
     * Add arbitrary file to archive
     * @param {string} path - Full path within archive
     * @param {string|Blob|ArrayBuffer} content - File content
     */
    addFile(path, content) {
        this.zip.file(path, content);
    }

    /**
     * Check if a file exists in the archive
     * @param {string} path - File path to check
     * @returns {boolean} True if file exists
     */
    hasFile(path) {
        return this.zip.file(path) !== null;
    }

    /**
     * Remove a file from the archive
     * @param {string} path - File path to remove
     */
    removeFile(path) {
        this.zip.remove(path);
    }

    /**
     * Get list of all files in archive
     * @returns {string[]} Array of file paths
     */
    listFiles() {
        return Object.keys(this.zip.files).filter(
            path => !this.zip.files[path].dir
        );
    }

    /**
     * Generate the final .str file as a Blob
     * @param {Object} options - Generation options
     * @returns {Promise<Blob>} The generated ZIP file
     */
    async generate(options = {}) {
        return this.zip.generateAsync({
            type: 'blob',
            compression: COMPRESSION.TYPE,
            compressionOptions: {
                level: options.compressionLevel ?? COMPRESSION.LEVEL
            },
            mimeType: 'application/x-story-presentation'
        });
    }

    /**
     * Generate as ArrayBuffer (for streaming/upload)
     * @returns {Promise<ArrayBuffer>} The generated ZIP as ArrayBuffer
     */
    async generateArrayBuffer() {
        return this.zip.generateAsync({
            type: 'arraybuffer',
            compression: COMPRESSION.TYPE,
            compressionOptions: {
                level: COMPRESSION.LEVEL
            }
        });
    }

    /**
     * Generate as base64 string
     * @returns {Promise<string>} Base64 encoded ZIP
     */
    async generateBase64() {
        return this.zip.generateAsync({
            type: 'base64',
            compression: COMPRESSION.TYPE,
            compressionOptions: {
                level: COMPRESSION.LEVEL
            }
        });
    }
}

export default ZipFileWriter;
