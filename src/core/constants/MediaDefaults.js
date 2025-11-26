/**
 * Media Fill System - Default Values and Constants
 * 
 * This file defines all default values for image and video fills,
 * supported formats, file size limits, and other media constants.
 */

// ─────────────────────────────────────────────────────────────
// Default Filters (shared by image and video fills)
// ─────────────────────────────────────────────────────────────

export const DEFAULT_FILTERS = {
    exposure: 0,      // -100 to 100
    contrast: 0,      // -100 to 100
    saturation: 0,    // -100 to 100
    temperature: 0,   // -100 to 100 (warm/cool)
    tint: 0,          // -100 to 100 (green/magenta)
    highlights: 0,    // -100 to 100
    shadows: 0,       // -100 to 100
    blur: 0,          // 0 to 100 (px)
    hueRotate: 0,     // 0 to 360 (deg)
    invert: 0,        // 0 to 100 (%)
    sepia: 0,         // 0 to 100 (%)
    grayscale: 0      // 0 to 100 (%)
};

// ─────────────────────────────────────────────────────────────
// Default Image Fill
// ─────────────────────────────────────────────────────────────

export const DEFAULT_IMAGE_FILL = {
    type: 'image',
    visible: true,
    opacity: 100,
    blendMode: 'normal',
    
    // Asset reference (managed by MediaAssetManager)
    assetId: null,
    
    // Display properties
    scaleMode: 'fill',  // 'fill' | 'fit' | 'stretch' | 'tile'
    position: { x: 0.5, y: 0.5 },  // Normalized 0-1, center = 0.5
    scale: 1,
    rotation: 0,
    
    // Filters
    filters: { ...DEFAULT_FILTERS },
    
    // Cached metadata (from asset)
    originalWidth: 0,
    originalHeight: 0,
    fileName: null,
    fileSize: 0,
    
    // Animation (for GIFs/WebP)
    animated: false,
    playing: true,
    
    // Loading state
    assetState: 'pending'  // 'pending' | 'loading' | 'ready' | 'error'
};

// ─────────────────────────────────────────────────────────────
// Default Video Fill
// ─────────────────────────────────────────────────────────────

export const DEFAULT_VIDEO_FILL = {
    ...DEFAULT_IMAGE_FILL,
    type: 'video',
    
    // Video-specific playback properties
    playbackRate: 1,      // 0.25 to 4
    volume: 0,            // 0 to 1 (default muted for autoplay)
    loop: true,
    autoplay: true,
    muted: true,          // Required for autoplay in most browsers
    
    // Trim points
    startTime: 0,         // Seconds
    endTime: null,        // null = full duration
    currentTime: 0,       // Playback position
    duration: 0,          // Total duration (cached from asset)
    
    // Poster frame
    posterFrame: 0,       // Timestamp for poster
    posterAssetId: null   // Optional separate poster image
};

// ─────────────────────────────────────────────────────────────
// Supported Formats
// ─────────────────────────────────────────────────────────────

export const SUPPORTED_IMAGE_FORMATS = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/avif'
];

export const SUPPORTED_VIDEO_FORMATS = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime'  // .mov
];

export const SUPPORTED_MEDIA_FORMATS = [
    ...SUPPORTED_IMAGE_FORMATS,
    ...SUPPORTED_VIDEO_FORMATS
];

// ─────────────────────────────────────────────────────────────
// File Size Limits
// ─────────────────────────────────────────────────────────────

export const FILE_SIZE_LIMITS = {
    image: 50 * 1024 * 1024,     // 50 MB
    video: 500 * 1024 * 1024,    // 500 MB
    warning: 10 * 1024 * 1024,   // 10 MB - show warning above this
    inline: 2 * 1024 * 1024      // 2 MB - can store as data URL
};

// ─────────────────────────────────────────────────────────────
// Asset ID Prefixes
// ─────────────────────────────────────────────────────────────

export const ASSET_ID_PREFIX = {
    image: 'img_',
    video: 'vid_'
};

// ─────────────────────────────────────────────────────────────
// Scale Mode Options (for UI)
// ─────────────────────────────────────────────────────────────

export const SCALE_MODES = [
    { id: 'fill', label: 'Fill', icon: '⬛', description: 'Cover entire shape, may crop' },
    { id: 'fit', label: 'Fit', icon: '⬜', description: 'Fit inside shape, may letterbox' },
    { id: 'stretch', label: 'Stretch', icon: '↔️', description: 'Stretch to fill exactly' },
    { id: 'tile', label: 'Tile', icon: '🔲', description: 'Repeat pattern' }
];

// ─────────────────────────────────────────────────────────────
// Playback Rate Options (for UI)
// ─────────────────────────────────────────────────────────────

export const PLAYBACK_RATES = [
    { value: 0.25, label: '0.25x' },
    { value: 0.5, label: '0.5x' },
    { value: 0.75, label: '0.75x' },
    { value: 1, label: '1x' },
    { value: 1.25, label: '1.25x' },
    { value: 1.5, label: '1.5x' },
    { value: 2, label: '2x' },
    { value: 4, label: '4x' }
];

// ─────────────────────────────────────────────────────────────
// Filter Ranges (for UI sliders)
// ─────────────────────────────────────────────────────────────

export const FILTER_RANGES = {
    exposure: { min: -100, max: 100, step: 1, default: 0 },
    contrast: { min: -100, max: 100, step: 1, default: 0 },
    saturation: { min: -100, max: 100, step: 1, default: 0 },
    temperature: { min: -100, max: 100, step: 1, default: 0 },
    tint: { min: -100, max: 100, step: 1, default: 0 },
    highlights: { min: -100, max: 100, step: 1, default: 0 },
    shadows: { min: -100, max: 100, step: 1, default: 0 },
    blur: { min: 0, max: 100, step: 1, default: 0 },
    hueRotate: { min: 0, max: 360, step: 1, default: 0 },
    invert: { min: 0, max: 100, step: 1, default: 0 },
    sepia: { min: 0, max: 100, step: 1, default: 0 },
    grayscale: { min: 0, max: 100, step: 1, default: 0 }
};

// ─────────────────────────────────────────────────────────────
// Video Lifecycle Constants
// ─────────────────────────────────────────────────────────────

export const VIDEO_CONSTANTS = {
    maxConcurrentPlaying: 5,      // Max videos playing at once
    offscreenReleaseDelay: 30000, // 30 seconds before releasing off-screen video
    intersectionThreshold: 0.1    // 10% visibility to trigger play
};

// ─────────────────────────────────────────────────────────────
// Error Messages
// ─────────────────────────────────────────────────────────────

export const MEDIA_ERRORS = {
    unsupportedFormat: 'This file format is not supported',
    fileTooLarge: 'File is too large',
    loadFailed: 'Failed to load media',
    corsBlocked: 'Cannot load external media due to security restrictions',
    networkError: 'Network error while loading media',
    decodingError: 'Unable to decode media file'
};

// ─────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────

/**
 * Check if a MIME type is a supported image format
 * @param {string} mimeType 
 * @returns {boolean}
 */
export function isImageFormat(mimeType) {
    return SUPPORTED_IMAGE_FORMATS.includes(mimeType);
}

/**
 * Check if a MIME type is a supported video format
 * @param {string} mimeType 
 * @returns {boolean}
 */
export function isVideoFormat(mimeType) {
    return SUPPORTED_VIDEO_FORMATS.includes(mimeType);
}

/**
 * Check if a MIME type is any supported media format
 * @param {string} mimeType 
 * @returns {boolean}
 */
export function isMediaFormat(mimeType) {
    return SUPPORTED_MEDIA_FORMATS.includes(mimeType);
}

/**
 * Get file size limit for a given MIME type
 * @param {string} mimeType 
 * @returns {number} Size limit in bytes
 */
export function getSizeLimit(mimeType) {
    if (isVideoFormat(mimeType)) {
        return FILE_SIZE_LIMITS.video;
    }
    return FILE_SIZE_LIMITS.image;
}

/**
 * Check if file size exceeds limit
 * @param {File} file 
 * @returns {{valid: boolean, message?: string}}
 */
export function validateFileSize(file) {
    const limit = getSizeLimit(file.type);
    if (file.size > limit) {
        return {
            valid: false,
            message: `File size (${formatFileSize(file.size)}) exceeds limit (${formatFileSize(limit)})`
        };
    }
    return { valid: true };
}

/**
 * Format file size for display
 * @param {number} bytes 
 * @returns {string}
 */
export function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Create a new image fill with default values
 * @param {Partial<typeof DEFAULT_IMAGE_FILL>} overrides 
 * @returns {typeof DEFAULT_IMAGE_FILL}
 */
export function createImageFill(overrides = {}) {
    return {
        ...DEFAULT_IMAGE_FILL,
        filters: { ...DEFAULT_FILTERS },
        position: { ...DEFAULT_IMAGE_FILL.position },
        ...overrides
    };
}

/**
 * Create a new video fill with default values
 * @param {Partial<typeof DEFAULT_VIDEO_FILL>} overrides 
 * @returns {typeof DEFAULT_VIDEO_FILL}
 */
export function createVideoFill(overrides = {}) {
    return {
        ...DEFAULT_VIDEO_FILL,
        filters: { ...DEFAULT_FILTERS },
        position: { ...DEFAULT_VIDEO_FILL.position },
        ...overrides
    };
}
