/**
 * ImageProcessor - Image Import and Processing
 * 
 * Handles image file processing, dimension extraction, and optimization.
 * Creates ImageFill objects from imported files.
 */

import { mediaAssetManager } from './MediaAssetManager.js';
import { 
    DEFAULT_IMAGE_FILL,
    createImageFill,
    FILE_SIZE_LIMITS 
} from '../constants/MediaDefaults.js';

export class ImageProcessor {
    
    /**
     * Process an image file into an ImageFill object
     * @param {File} file - The image file to process
     * @returns {Promise<Object>} - ImageFill object ready to use
     */
    async process(file) {
        // Import into asset manager
        const { assetId, blobUrl, metadata } = await mediaAssetManager.importFile(file);
        
        // Create fill object with metadata
        const fill = createImageFill({
            assetId,
            originalWidth: metadata.width,
            originalHeight: metadata.height,
            fileName: file.name,
            fileSize: file.size,
            animated: metadata.animated || false,
            assetState: 'ready'
        });
        
        return fill;
    }

    /**
     * Get dimensions of an image from URL
     * @param {string} src - Image URL (blob, data, or http)
     * @returns {Promise<{width: number, height: number}>}
     */
    getDimensions(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                resolve({
                    width: img.naturalWidth,
                    height: img.naturalHeight
                });
            };
            
            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };
            
            img.src = src;
        });
    }

    /**
     * Load an image element (for rendering or processing)
     * @param {string} src - Image URL
     * @returns {Promise<HTMLImageElement>}
     */
    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';  // Enable canvas operations
            
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to load image'));
            
            img.src = src;
        });
    }

    /**
     * Check if an image (GIF/WebP) is animated
     * This is a simplified check - full implementation would parse file headers
     * @param {File} file
     * @returns {Promise<boolean>}
     */
    async checkIfAnimated(file) {
        // Only GIF and WebP can be animated
        if (file.type !== 'image/gif' && file.type !== 'image/webp') {
            return false;
        }
        
        // For GIF, check for animation markers in header
        if (file.type === 'image/gif') {
            return this._checkGifAnimation(file);
        }
        
        // For WebP, check for animation chunk
        if (file.type === 'image/webp') {
            return this._checkWebPAnimation(file);
        }
        
        return false;
    }

    /**
     * Check if GIF has animation (multiple frames)
     * @private
     */
    async _checkGifAnimation(file) {
        const buffer = await file.slice(0, 1024).arrayBuffer();  // Read first 1KB
        const bytes = new Uint8Array(buffer);
        
        // Look for multiple GIF frame markers (0x00, 0x21, 0xF9)
        // This is a simplified check
        let frameCount = 0;
        for (let i = 0; i < bytes.length - 2; i++) {
            if (bytes[i] === 0x00 && bytes[i + 1] === 0x21 && bytes[i + 2] === 0xF9) {
                frameCount++;
                if (frameCount > 1) return true;  // Multiple frames = animated
            }
        }
        
        return false;
    }

    /**
     * Check if WebP has animation (ANIM chunk)
     * @private
     */
    async _checkWebPAnimation(file) {
        const buffer = await file.slice(0, 30).arrayBuffer();  // Read header
        const bytes = new Uint8Array(buffer);
        
        // WebP animation has 'ANIM' chunk at position 12-15 (in extended format)
        // Or check for VP8X with animation flag
        
        // Check for RIFF header
        if (bytes[0] !== 0x52 || bytes[1] !== 0x49 || bytes[2] !== 0x46 || bytes[3] !== 0x46) {
            return false;
        }
        
        // Check for WEBP
        if (bytes[8] !== 0x57 || bytes[9] !== 0x45 || bytes[10] !== 0x42 || bytes[11] !== 0x50) {
            return false;
        }
        
        // Check for VP8X (extended format)
        if (bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x58) {
            // Animation flag is bit 1 of byte 20
            return (bytes[20] & 0x02) !== 0;
        }
        
        return false;
    }

    /**
     * Resize image (for optimization or thumbnails)
     * @param {string} src - Source image URL
     * @param {number} maxWidth - Maximum width
     * @param {number} maxHeight - Maximum height
     * @param {string} format - Output format ('image/webp', 'image/jpeg', 'image/png')
     * @param {number} quality - Output quality (0-1)
     * @returns {Promise<Blob>}
     */
    async resize(src, maxWidth, maxHeight, format = 'image/webp', quality = 0.85) {
        const img = await this.loadImage(src);
        
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;
        
        if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
        }
        
        if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
        }
        
        // Create canvas and draw
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob
        return new Promise((resolve) => {
            canvas.toBlob(resolve, format, quality);
        });
    }

    /**
     * Create a thumbnail of an image
     * @param {string} src - Source image URL
     * @param {number} size - Thumbnail size (square)
     * @returns {Promise<string>} - Data URL of thumbnail
     */
    async createThumbnail(src, size = 64) {
        const img = await this.loadImage(src);
        
        // Calculate crop to make square
        const srcSize = Math.min(img.naturalWidth, img.naturalHeight);
        const srcX = (img.naturalWidth - srcSize) / 2;
        const srcY = (img.naturalHeight - srcSize) / 2;
        
        // Create canvas and draw cropped/scaled
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, size, size);
        
        return canvas.toDataURL('image/jpeg', 0.7);
    }
}

// Export singleton instance
export const imageProcessor = new ImageProcessor();
