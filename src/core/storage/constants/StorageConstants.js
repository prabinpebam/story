/**
 * Storage Constants
 * Centralized configuration for file format and storage
 */

// File format configuration
export const FILE_FORMAT = {
    TYPE: 'story-presentation',
    VERSION: '1.0.0',
    EXTENSION: '.str',
    MIME_TYPE: 'application/x-story-presentation'
};

// ZIP compression settings
export const COMPRESSION = {
    TYPE: 'DEFLATE',
    LEVEL: 6  // Balance between speed and size
};

// File paths within ZIP archive
export const ARCHIVE_PATHS = {
    MANIFEST: 'manifest.json',
    METADATA: 'document/metadata.json',
    THEME: 'document/theme.json',
    SLIDES_DIR: 'document/slides',
    ASSETS_DIR: 'assets',
    IMAGES_DIR: 'assets/images',
    VIDEOS_DIR: 'assets/videos',
    FONTS_DIR: 'assets/fonts',
    THUMBNAIL: 'preview/thumbnail.png'
};

// Thumbnail settings
export const THUMBNAIL = {
    WIDTH: 1200,
    HEIGHT: 675,
    FORMAT: 'image/png',
    QUALITY: 0.8
};

// IndexedDB configuration
export const CACHE_DB = {
    NAME: 'StoryFileCache',
    VERSION: 1,
    STORES: {
        FILES: 'files',
        ASSETS: 'assets',
        RECENT: 'recent'
    },
    MAX_AGE_MS: 30 * 24 * 60 * 60 * 1000,  // 30 days
    MAX_FILES: 50
};

// Auto-save configuration
export const AUTO_SAVE = {
    DEBOUNCE_MS: 5000,     // 5 seconds
    MIN_INTERVAL_MS: 30000, // 30 seconds minimum between saves
    MAX_RETRIES: 3
};

// Cloud storage paths
export const CLOUD_PATHS = {
    ROOT_FOLDER: '/Story',
    BACKUP_FOLDER: '/Story/.backups'
};

// Error messages
export const STORAGE_ERRORS = {
    USER_CANCELLED: 'Operation cancelled by user.',
    PERMISSION_DENIED: 'Permission denied.',
    INVALID_FORMAT: 'Invalid file format. Expected .str file.',
    VERSION_MISMATCH: 'File version is newer than supported. Please update the app.',
    CORRUPT_FILE: 'File appears to be corrupted.',
    MISSING_MANIFEST: 'File is missing manifest.json.',
    ASSET_NOT_FOUND: 'Referenced asset not found in file.',
    READ_FAILED: 'Failed to read file.',
    WRITE_FAILED: 'Failed to write file.',
    CLOUD_AUTH_REQUIRED: 'Please sign in to access cloud storage.',
    CLOUD_QUOTA_EXCEEDED: 'Cloud storage quota exceeded.',
    CONFLICT_DETECTED: 'File was modified elsewhere.',
    NETWORK_ERROR: 'Network error. Please check your connection.'
};

export default {
    FILE_FORMAT,
    COMPRESSION,
    ARCHIVE_PATHS,
    THUMBNAIL,
    CACHE_DB,
    AUTO_SAVE,
    CLOUD_PATHS,
    STORAGE_ERRORS
};
