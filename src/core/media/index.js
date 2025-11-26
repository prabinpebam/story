/**
 * Media Module - Central Export
 * 
 * This module provides all media-related functionality for the fill system.
 */

// Core managers
export { mediaAssetManager, MediaAssetManager } from './MediaAssetManager.js';

// Processors
export { imageProcessor, ImageProcessor } from './ImageProcessor.js';
export { videoProcessor, VideoProcessor } from './VideoProcessor.js';

// Filter engine
export { FilterEngine } from './FilterEngine.js';

// Re-export constants for convenience
export {
    DEFAULT_FILTERS,
    DEFAULT_IMAGE_FILL,
    DEFAULT_VIDEO_FILL,
    SUPPORTED_IMAGE_FORMATS,
    SUPPORTED_VIDEO_FORMATS,
    SUPPORTED_MEDIA_FORMATS,
    FILE_SIZE_LIMITS,
    ASSET_ID_PREFIX,
    SCALE_MODES,
    PLAYBACK_RATES,
    FILTER_RANGES,
    VIDEO_CONSTANTS,
    MEDIA_ERRORS,
    isImageFormat,
    isVideoFormat,
    isMediaFormat,
    getSizeLimit,
    validateFileSize,
    formatFileSize,
    createImageFill,
    createVideoFill
} from '../constants/MediaDefaults.js';
