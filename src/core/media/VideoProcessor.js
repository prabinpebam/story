/**
 * VideoProcessor - Video Import and Processing
 * 
 * Handles video file processing, metadata extraction, and poster frame generation.
 * Creates VideoFill objects from imported files.
 */

import { mediaAssetManager } from './MediaAssetManager.js';
import { 
    DEFAULT_VIDEO_FILL,
    createVideoFill 
} from '../constants/MediaDefaults.js';

export class VideoProcessor {
    
    /**
     * Process a video file into a VideoFill object
     * @param {File} file - The video file to process
     * @returns {Promise<Object>} - VideoFill object ready to use
     */
    async process(file) {
        // Import into asset manager
        const { assetId, blobUrl, metadata } = await mediaAssetManager.importFile(file);
        
        // Create fill object with metadata
        const fill = createVideoFill({
            assetId,
            originalWidth: metadata.width,
            originalHeight: metadata.height,
            duration: metadata.duration,
            fileName: file.name,
            fileSize: file.size,
            assetState: 'ready'
        });
        
        return fill;
    }

    /**
     * Get video metadata (dimensions, duration)
     * @param {string} src - Video URL
     * @returns {Promise<{width: number, height: number, duration: number}>}
     */
    getMetadata(src) {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            
            video.onloadedmetadata = () => {
                resolve({
                    width: video.videoWidth,
                    height: video.videoHeight,
                    duration: video.duration
                });
            };
            
            video.onerror = () => {
                reject(new Error('Failed to load video'));
            };
            
            video.src = src;
            video.load();
        });
    }

    /**
     * Load a video element
     * @param {string} src - Video URL
     * @returns {Promise<HTMLVideoElement>}
     */
    loadVideo(src) {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.crossOrigin = 'anonymous';
            video.muted = true;  // Required for autoplay
            video.playsInline = true;
            
            video.onloadeddata = () => resolve(video);
            video.onerror = () => reject(new Error('Failed to load video'));
            
            video.src = src;
            video.load();
        });
    }

    /**
     * Extract a frame from video as image
     * @param {string} src - Video URL
     * @param {number} time - Time in seconds
     * @param {number} width - Output width (optional, uses video width if not specified)
     * @param {number} height - Output height (optional, uses video height if not specified)
     * @returns {Promise<string>} - Data URL of frame
     */
    async extractFrame(src, time = 0, width = null, height = null) {
        const video = await this.loadVideo(src);
        
        // Seek to specified time
        await this._seekTo(video, time);
        
        // Use video dimensions if not specified
        width = width || video.videoWidth;
        height = height || video.videoHeight;
        
        // Draw frame to canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, width, height);
        
        // Clean up
        video.src = '';
        video.load();
        
        return canvas.toDataURL('image/jpeg', 0.85);
    }

    /**
     * Extract poster frame (first frame or specified time)
     * @param {string} src - Video URL
     * @param {number} time - Time in seconds (default 0)
     * @returns {Promise<string>} - Data URL of poster
     */
    async extractPosterFrame(src, time = 0) {
        return this.extractFrame(src, time);
    }

    /**
     * Create a thumbnail of video (smaller poster)
     * @param {string} src - Video URL
     * @param {number} time - Time in seconds
     * @param {number} size - Thumbnail size (square)
     * @returns {Promise<string>} - Data URL of thumbnail
     */
    async createThumbnail(src, time = 0, size = 64) {
        const video = await this.loadVideo(src);
        await this._seekTo(video, time);
        
        // Calculate crop to make square (center crop)
        const srcSize = Math.min(video.videoWidth, video.videoHeight);
        const srcX = (video.videoWidth - srcSize) / 2;
        const srcY = (video.videoHeight - srcSize) / 2;
        
        // Create canvas and draw
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, srcX, srcY, srcSize, srcSize, 0, 0, size, size);
        
        // Clean up
        video.src = '';
        video.load();
        
        return canvas.toDataURL('image/jpeg', 0.7);
    }

    /**
     * Seek video to specific time
     * @private
     */
    _seekTo(video, time) {
        return new Promise((resolve) => {
            if (video.currentTime === time) {
                resolve();
                return;
            }
            
            const onSeeked = () => {
                video.removeEventListener('seeked', onSeeked);
                resolve();
            };
            
            video.addEventListener('seeked', onSeeked);
            video.currentTime = time;
        });
    }

    /**
     * Format time as MM:SS.s
     * @param {number} seconds
     * @returns {string}
     */
    formatTime(seconds) {
        if (!isFinite(seconds) || seconds < 0) return '00:00.0';
        
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        
        return `${mins.toString().padStart(2, '0')}:${secs.toFixed(1).padStart(4, '0')}`;
    }

    /**
     * Format duration as human-readable string
     * @param {number} seconds
     * @returns {string}
     */
    formatDuration(seconds) {
        if (!isFinite(seconds) || seconds < 0) return '0s';
        
        if (seconds < 60) {
            return `${seconds.toFixed(1)}s`;
        } else if (seconds < 3600) {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        }
    }

    /**
     * Get video codec info (if available)
     * @param {HTMLVideoElement} video
     * @returns {Object}
     */
    getCodecInfo(video) {
        // Try to get codec from media capabilities
        // This is limited in what information is available
        return {
            width: video.videoWidth,
            height: video.videoHeight,
            duration: video.duration,
            // Additional codec info would require parsing the file
        };
    }
}

// Export singleton instance
export const videoProcessor = new VideoProcessor();
