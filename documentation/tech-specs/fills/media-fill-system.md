# Media Fill System - Technical Specification

## Architecture Overview

The media fill system extends the existing multi-fill architecture to support images and videos as first-class fill types. Media fills render via HTML `<img>` and `<video>` elements positioned absolutely within fill layer divs.

> **Important:** For asset storage and persistence details, see [Media Asset Integration](./media-asset-integration.md).

```
┌─────────────────────────────────────────────────────────────┐
│                     ShapeElement                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                 domElement (div)                       │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │           .fill-layers-container                │  │  │
│  │  │  ┌───────────────────────────────────────────┐  │  │  │
│  │  │  │  .fill-layer (z-index: 3)                 │  │  │  │
│  │  │  │  └─ <video> element                       │  │  │  │
│  │  │  ├───────────────────────────────────────────┤  │  │  │
│  │  │  │  .fill-layer (z-index: 2)                 │  │  │  │
│  │  │  │  └─ <img> element                         │  │  │  │
│  │  │  ├───────────────────────────────────────────┤  │  │  │
│  │  │  │  .fill-layer (z-index: 1)                 │  │  │  │
│  │  │  │  └─ solid/gradient background             │  │  │  │
│  │  │  └───────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Structures

### Asset Reference Strategy

Media fills reference assets through the `MediaAssetManager` rather than storing URLs directly:

| Property | At Runtime | In Saved .str File |
|----------|------------|-------------------|
| `assetId` | `"img_abc123..."` | `"img_abc123..."` |
| `assetPath` | _(not present)_ | `"assets/images/img_abc123.jpg"` |

The renderer calls `mediaAssetManager.getBlobUrl(fill.assetId)` to get a renderable URL.

### Image Fill Schema

```javascript
/**
 * @typedef {Object} ImageFill
 * @property {'image'} type
 * @property {boolean} visible - Layer visibility
 * @property {number} opacity - 0-100
 * @property {string} blendMode - CSS blend mode
 * @property {string} assetId - Reference to MediaAssetManager (e.g., "img_abc123...")
 * @property {string} [assetPath] - Only in saved files (e.g., "assets/images/...")
 * @property {string} [alt] - Alt text for accessibility
 * @property {'fill'|'fit'|'stretch'|'tile'} scaleMode
 * @property {{x: number, y: number}} position - Normalized 0-1
 * @property {number} scale - Additional scale multiplier (default 1)
 * @property {number} rotation - Degrees
 * @property {ImageFilters} filters - Adjustment filters
 * @property {number} originalWidth - Source image width (cached from asset)
 * @property {number} originalHeight - Source image height (cached from asset)
 * @property {string} [fileName] - Original filename for reference
 * @property {number} [fileSize] - Original file size in bytes
 */

/**
 * @typedef {Object} ImageFilters
 * @property {number} exposure - -100 to 100
 * @property {number} contrast - -100 to 100
 * @property {number} saturation - -100 to 100
 * @property {number} temperature - -100 to 100
 * @property {number} tint - -100 to 100
 * @property {number} highlights - -100 to 100
 * @property {number} shadows - -100 to 100
 * @property {number} blur - 0 to 100 (px)
 * @property {number} hueRotate - 0 to 360 (deg)
 * @property {number} invert - 0 to 100 (%)
 * @property {number} sepia - 0 to 100 (%)
 * @property {number} grayscale - 0 to 100 (%)
 */
```

### Video Fill Schema

```javascript
/**
 * @typedef {Object} VideoFill
 * @property {'video'} type
 * @property {boolean} visible
 * @property {number} opacity - 0-100
 * @property {string} blendMode
 * @property {string} assetId - Reference to MediaAssetManager (e.g., "vid_abc123...")
 * @property {string} [assetPath] - Only in saved files (e.g., "assets/videos/...")
 * @property {'fill'|'fit'|'stretch'|'tile'} scaleMode
 * @property {{x: number, y: number}} position
 * @property {number} scale
 * @property {number} rotation
 * @property {ImageFilters} filters - Same as image
 * @property {number} originalWidth - Cached from asset
 * @property {number} originalHeight - Cached from asset
 * 
 * // Video-specific properties
 * @property {number} playbackRate - 0.25 to 4
 * @property {number} volume - 0 to 1
 * @property {boolean} loop
 * @property {boolean} autoplay
 * @property {boolean} muted
 * @property {number} startTime - Trim start (seconds)
 * @property {number|null} endTime - Trim end (null = full)
 * @property {number} currentTime - Playback position
 * @property {number} duration - Total duration (cached from asset)
 * @property {number} posterFrame - Timestamp for poster
 * @property {string} [posterAssetId] - Poster frame as separate image asset
 */
```

### Default Values

```javascript
// src/core/constants/MediaDefaults.js

export const DEFAULT_IMAGE_FILL = {
    type: 'image',
    visible: true,
    opacity: 100,
    blendMode: 'normal',
    src: '',
    alt: '',
    scaleMode: 'fill',
    position: { x: 0.5, y: 0.5 },
    scale: 1,
    rotation: 0,
    filters: {
        exposure: 0,
        contrast: 0,
        saturation: 0,
        temperature: 0,
        tint: 0,
        highlights: 0,
        shadows: 0,
        blur: 0,
        hueRotate: 0,
        invert: 0,
        sepia: 0,
        grayscale: 0
    },
    originalWidth: 0,
    originalHeight: 0
};

export const DEFAULT_VIDEO_FILL = {
    ...DEFAULT_IMAGE_FILL,
    type: 'video',
    playbackRate: 1,
    volume: 0,
    loop: true,
    autoplay: true,
    muted: true,
    startTime: 0,
    endTime: null,
    currentTime: 0,
    duration: 0,
    posterFrame: 0,
    posterSrc: null
};
```

---

## File Structure

### New Files

```
src/
├── core/
│   ├── constants/
│   │   └── MediaDefaults.js           # Default values
│   ├── media/
│   │   ├── MediaManager.js            # Central media handling
│   │   ├── ImageProcessor.js          # Image optimization
│   │   ├── VideoProcessor.js          # Video handling
│   │   └── FilterEngine.js            # CSS/SVG filter generation
│   └── renderer/
│       └── elements/
│           └── ShapeElement.js        # MODIFY: Add media rendering
├── ui/
│   ├── components/
│   │   └── FillFlyout/
│   │       ├── ImageTab.js            # Image fill UI
│   │       ├── VideoTab.js            # Video fill UI
│   │       ├── MediaPreview.js        # Preview component
│   │       ├── ScaleModeSelector.js   # Scale mode buttons
│   │       ├── PositionControl.js     # Position grid + inputs
│   │       ├── FilterControls.js      # Adjustment sliders
│   │       └── VideoControls.js       # Playback controls
│   └── overlays/
│       └── VideoControlOverlay.js     # On-canvas video controls
└── styles/
    └── modules/
        └── _media-fills.scss          # Media-specific styles
```

### Modified Files

| File | Changes |
|------|---------|
| `ShapeElement.js` | Add `applyImageFill()`, `applyVideoFill()` methods |
| `FillFlyout.js` | Add Image/Video type buttons, tab routing |
| `FillSection.js` | Handle media fill layer display |
| `Store.js` | Add media-related actions |
| `CanvasManager.js` | Handle media drag-drop, paste |
| `PresentationManager.js` | Video playback sync |

---

## Core Classes

### MediaManager

Central singleton for media operations.

```javascript
// src/core/media/MediaManager.js

import { ImageProcessor } from './ImageProcessor.js';
import { VideoProcessor } from './VideoProcessor.js';

class MediaManager {
    constructor() {
        this.imageProcessor = new ImageProcessor();
        this.videoProcessor = new VideoProcessor();
        this.cache = new Map(); // LRU cache for decoded media
        this.blobRegistry = new Map(); // Track blob URLs for cleanup
    }

    /**
     * Import media file and return fill object
     * @param {File} file 
     * @returns {Promise<ImageFill|VideoFill>}
     */
    async importFile(file) {
        const isVideo = file.type.startsWith('video/') || 
                       file.type === 'image/gif';
        
        if (isVideo) {
            return this.videoProcessor.process(file);
        } else {
            return this.imageProcessor.process(file);
        }
    }

    /**
     * Import from URL (remote image/video)
     */
    async importUrl(url) {
        // Fetch and determine type
        const response = await fetch(url);
        const contentType = response.headers.get('content-type');
        const blob = await response.blob();
        const file = new File([blob], 'imported', { type: contentType });
        return this.importFile(file);
    }

    /**
     * Import from clipboard
     */
    async importFromClipboard(clipboardData) {
        const items = clipboardData.items;
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                return this.importFile(file);
            }
        }
        return null;
    }

    /**
     * Create data URL for small files, blob URL for large
     * Now with reference counting for safe cleanup
     */
    async createMediaUrl(file, threshold = 5 * 1024 * 1024) {
        if (file.size <= threshold) {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(file);
            });
        } else {
            const blobUrl = URL.createObjectURL(file);
            // Store with reference counting
            this.blobRegistry.set(blobUrl, {
                file,
                refCount: 1,
                createdAt: Date.now()
            });
            return blobUrl;
        }
    }

    /**
     * Increment reference count (called when copying elements with media)
     */
    retainMediaUrl(url) {
        if (url?.startsWith('blob:')) {
            const entry = this.blobRegistry.get(url);
            if (entry) {
                entry.refCount++;
            }
        }
    }

    /**
     * Decrement reference count, revoke if zero and not in history
     * @param {string} url - Blob URL to release
     * @param {boolean} inHistoryStack - Whether URL exists in undo/redo stack
     */
    releaseMediaUrl(url, inHistoryStack = false) {
        if (!url?.startsWith('blob:')) return;
        
        const entry = this.blobRegistry.get(url);
        if (!entry) return;
        
        entry.refCount--;
        
        // Only revoke if refCount is 0 AND not in history
        if (entry.refCount <= 0 && !inHistoryStack) {
            URL.revokeObjectURL(url);
            this.blobRegistry.delete(url);
        }
    }

    /**
     * Check if URL is in history stack (called by HistoryManager integration)
     */
    isInHistoryStack(url) {
        // This will be called by the HistoryManager when evicting entries
        // Implementation requires integration with HistoryManager
        return false; // Default, overridden by integration
    }

    /**
     * Convert blob URL to data URL (for clipboard/serialization)
     */
    async blobToDataUrl(blobUrl) {
        const entry = this.blobRegistry.get(blobUrl);
        if (!entry) {
            throw new Error('Blob URL not in registry');
        }
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(entry.file);
        });
    }

    /**
     * Get the underlying File for a blob URL (for project save)
     */
    getFileForBlobUrl(blobUrl) {
        const entry = this.blobRegistry.get(blobUrl);
        return entry?.file || null;
    }

    /**
     * Get cached decoded image/video element
     */
    getCached(src) {
        return this.cache.get(src);
    }

    /**
     * Store in cache with LRU eviction
     */
    setCached(src, element) {
        const MAX_CACHE = 50;
        if (this.cache.size >= MAX_CACHE) {
            const oldest = this.cache.keys().next().value;
            this.cache.delete(oldest);
        }
        this.cache.set(src, element);
    }

    /**
     * Get all blob URLs currently in registry (for debugging/stats)
     */
    getBlobStats() {
        const stats = {
            count: this.blobRegistry.size,
            totalSize: 0,
            entries: []
        };
        
        for (const [url, entry] of this.blobRegistry) {
            stats.totalSize += entry.file.size;
            stats.entries.push({
                url: url.substring(0, 50) + '...',
                size: entry.file.size,
                refCount: entry.refCount,
                age: Date.now() - entry.createdAt
            });
        }
        
        return stats;
    }
}

export const mediaManager = new MediaManager();
```

### HistoryManager Integration

The MediaManager must integrate with HistoryManager to prevent premature blob revocation:

```javascript
// In HistoryManager.js - add callback for eviction

class HistoryManager {
    constructor(options = {}) {
        // ... existing code ...
        this.onEvict = options.onEvict || null;
    }

    push(state, meta = {}) {
        // Track blob URLs in this snapshot
        const blobUrls = this.extractBlobUrls(state);
        
        this.undoStack.push({ state, meta, blobUrls });
        
        // Enforce limit with eviction callback
        if (this.undoStack.length > this.maxSize) {
            const evicted = this.undoStack.shift();
            if (this.onEvict && evicted.blobUrls) {
                this.onEvict(evicted.blobUrls);
            }
        }

        this.redoStack = [];
    }

    extractBlobUrls(state) {
        const urls = new Set();
        // Recursively scan state for blob: URLs
        const scan = (obj) => {
            if (!obj || typeof obj !== 'object') return;
            for (const value of Object.values(obj)) {
                if (typeof value === 'string' && value.startsWith('blob:')) {
                    urls.add(value);
                } else if (typeof value === 'object') {
                    scan(value);
                }
            }
        };
        scan(state);
        return urls;
    }
}

// Integration in main.js or Store.js
import { mediaManager } from './media/MediaManager.js';

const historyManager = new HistoryManager({
    maxSize: 50,
    onEvict: (blobUrls) => {
        // When history entry is evicted, check if blobs can be released
        for (const url of blobUrls) {
            // Check if URL exists in any remaining history entry
            const stillInHistory = historyManager.undoStack.some(entry => 
                entry.blobUrls?.has(url)
            ) || historyManager.redoStack.some(entry => 
                entry.blobUrls?.has(url)
            );
            
            if (!stillInHistory) {
                mediaManager.releaseMediaUrl(url, false);
            }
        }
    }
});
```

### ImageProcessor

```javascript
// src/core/media/ImageProcessor.js

import { DEFAULT_IMAGE_FILL } from '../constants/MediaDefaults.js';
import { mediaManager } from './MediaManager.js';

export class ImageProcessor {
    /**
     * Process image file into ImageFill object
     */
    async process(file) {
        const src = await mediaManager.createMediaUrl(file);
        const dimensions = await this.getDimensions(src);
        const animated = await this.checkIfAnimated(file);
        
        return {
            ...DEFAULT_IMAGE_FILL,
            src,
            originalWidth: dimensions.width,
            originalHeight: dimensions.height,
            fileName: file.name,
            fileSize: file.size,
            animated,
            playing: animated // Animated images play by default
        };
    }

    /**
     * Check if image is animated (GIF, animated WebP)
     */
    async checkIfAnimated(file) {
        if (file.type === 'image/gif') {
            return this.checkGifAnimation(file);
        }
        if (file.type === 'image/webp') {
            return this.checkWebPAnimation(file);
        }
        return false;
    }

    /**
     * Check if GIF is animated by looking for multiple frames
     */
    async checkGifAnimation(file) {
        const buffer = await file.slice(0, 1024).arrayBuffer();
        const view = new Uint8Array(buffer);
        
        // Look for Graphics Control Extension (0x21 0xF9)
        // Multiple occurrences indicate animation
        let count = 0;
        for (let i = 0; i < view.length - 1; i++) {
            if (view[i] === 0x21 && view[i + 1] === 0xF9) {
                count++;
                if (count > 1) return true;
            }
        }
        return false;
    }

    /**
     * Check if WebP is animated by looking for ANIM chunk
     */
    async checkWebPAnimation(file) {
        const buffer = await file.slice(0, 32).arrayBuffer();
        const view = new Uint8Array(buffer);
        
        // WebP animation has "ANIM" chunk
        const decoder = new TextDecoder();
        const header = decoder.decode(view);
        return header.includes('ANIM');
    }

    /**
     * Get image dimensions
     */
    async getDimensions(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve({ 
                width: img.naturalWidth, 
                height: img.naturalHeight 
            });
            img.onerror = reject;
            img.src = src;
        });
    }

    /**
     * Resize image (for optimization)
     */
    async resize(src, maxWidth, maxHeight) {
        const img = await this.loadImage(src);
        
        let { width, height } = img;
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        
        if (ratio >= 1) return src; // No resize needed
        
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        return canvas.toDataURL('image/webp', 0.9);
    }

    /**
     * Load image element
     */
    loadImage(src) {
        return new Promise((resolve, reject) => {
            let img = mediaManager.getCached(src);
            if (img) {
                resolve(img);
                return;
            }
            
            img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                mediaManager.setCached(src, img);
                resolve(img);
            };
            img.onerror = reject;
            img.src = src;
        });
    }
}
```

### VideoProcessor

```javascript
// src/core/media/VideoProcessor.js

import { DEFAULT_VIDEO_FILL } from '../constants/MediaDefaults.js';
import { mediaManager } from './MediaManager.js';

export class VideoProcessor {
    /**
     * Process video file into VideoFill object
     */
    async process(file) {
        const src = await mediaManager.createMediaUrl(file);
        const metadata = await this.getMetadata(src);
        const posterSrc = await this.extractPosterFrame(src, 0);
        
        return {
            ...DEFAULT_VIDEO_FILL,
            src,
            originalWidth: metadata.width,
            originalHeight: metadata.height,
            duration: metadata.duration,
            posterSrc,
            fileName: file.name,
            fileSize: file.size
        };
    }

    /**
     * Get video metadata
     */
    async getMetadata(src) {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            
            video.onloadedmetadata = () => {
                resolve({
                    width: video.videoWidth,
                    height: video.videoHeight,
                    duration: video.duration
                });
            };
            video.onerror = reject;
            video.src = src;
        });
    }

    /**
     * Extract frame at specific time as data URL
     */
    async extractPosterFrame(src, time) {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.preload = 'auto';
            video.muted = true;
            
            video.onloadeddata = () => {
                video.currentTime = time;
            };
            
            video.onseeked = () => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0);
                
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            
            video.onerror = reject;
            video.src = src;
        });
    }

    /**
     * Format time as MM:SS.s
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = (seconds % 60).toFixed(1);
        return `${mins.toString().padStart(2, '0')}:${secs.padStart(4, '0')}`;
    }

    /**
     * Parse time string to seconds
     */
    parseTime(timeStr) {
        const [mins, secs] = timeStr.split(':').map(parseFloat);
        return mins * 60 + secs;
    }
}
```

### FilterEngine

```javascript
// src/core/media/FilterEngine.js

export class FilterEngine {
    /**
     * Build CSS filter string from filter object
     * ORDER MATTERS - filters are applied in pipeline sequence
     */
    static buildCssFilter(filters) {
        if (!filters) return 'none';
        
        const parts = [];
        
        // Pipeline order: exposure → contrast → saturation → hue → grayscale → sepia → invert → blur
        
        // Brightness (exposure) - early in pipeline
        // -100 to +100 → 0 to 2
        if (filters.exposure) {
            const brightness = 1 + (filters.exposure / 100);
            parts.push(`brightness(${brightness})`);
        }
        
        // Contrast - after brightness
        // -100 to +100 → 0 to 2
        if (filters.contrast) {
            const contrast = 1 + (filters.contrast / 100);
            parts.push(`contrast(${contrast})`);
        }
        
        // Saturation - after contrast
        // -100 to +100 → 0 to 2
        if (filters.saturation) {
            const saturate = 1 + (filters.saturation / 100);
            parts.push(`saturate(${saturate})`);
        }
        
        // Hue Rotate
        if (filters.hueRotate) {
            parts.push(`hue-rotate(${filters.hueRotate}deg)`);
        }
        
        // Color effect filters
        if (filters.grayscale) {
            parts.push(`grayscale(${filters.grayscale}%)`);
        }
        
        if (filters.sepia) {
            parts.push(`sepia(${filters.sepia}%)`);
        }
        
        if (filters.invert) {
            parts.push(`invert(${filters.invert}%)`);
        }
        
        // Blur - ALWAYS LAST (most expensive, applied to already-processed pixels)
        if (filters.blur) {
            parts.push(`blur(${filters.blur}px)`);
        }
        
        return parts.length > 0 ? parts.join(' ') : 'none';
    }

    /**
     * Build SVG filter for temperature/tint (not available in CSS)
     * Returns SVG filter definition ID
     */
    static buildTemperatureTintFilter(filters, elementId) {
        if (!filters.temperature && !filters.tint) return null;
        
        const filterId = `media-filter-${elementId}`;
        
        // Temperature shifts red-blue balance
        // Tint shifts green-magenta balance
        const temp = filters.temperature / 100; // -1 to 1
        const tint = filters.tint / 100; // -1 to 1
        
        // Color matrix for temperature/tint
        // This is a simplified approximation
        const r = 1 + temp * 0.2;
        const g = 1 - Math.abs(tint) * 0.1;
        const b = 1 - temp * 0.2;
        const rShift = tint > 0 ? tint * 0.1 : 0;
        const bShift = tint < 0 ? -tint * 0.1 : 0;
        
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;">
                <filter id="${filterId}">
                    <feColorMatrix type="matrix" values="
                        ${r} 0 ${rShift} 0 0
                        0 ${g} 0 0 0
                        ${bShift} 0 ${b} 0 0
                        0 0 0 1 0
                    "/>
                </filter>
            </svg>
        `;
        
        return { filterId, svg };
    }

    /**
     * Apply highlights/shadows adjustment
     * Requires more complex processing (luminosity masks)
     */
    static buildHighlightsShadowsFilter(filters, elementId) {
        if (!filters.highlights && !filters.shadows) return null;
        
        // This requires canvas-based processing for accurate results
        // For now, we approximate with curves
        const filterId = `hs-filter-${elementId}`;
        
        const highlights = filters.highlights / 100; // -1 to 1
        const shadows = filters.shadows / 100; // -1 to 1
        
        // Approximate with gamma adjustment
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;">
                <filter id="${filterId}">
                    <feComponentTransfer>
                        <feFuncR type="gamma" amplitude="1" exponent="${1 - shadows * 0.3}" offset="${highlights * 0.1}"/>
                        <feFuncG type="gamma" amplitude="1" exponent="${1 - shadows * 0.3}" offset="${highlights * 0.1}"/>
                        <feFuncB type="gamma" amplitude="1" exponent="${1 - shadows * 0.3}" offset="${highlights * 0.1}"/>
                    </feComponentTransfer>
                </filter>
            </svg>
        `;
        
        return { filterId, svg };
    }
}
```

### VideoLifecycleManager

Manages video playback state across slide transitions and editor modes:

```javascript
// src/core/media/VideoLifecycleManager.js

class VideoLifecycleManager {
    constructor() {
        this.activeVideos = new Map(); // elementId → video element
        this.playingVideos = new Set();
        this.maxConcurrent = 5;
        this.offscreenTimeout = 30000; // 30s before releasing resources
        this.offscreenTimers = new Map();
        
        this.setupIntersectionObserver();
    }

    setupIntersectionObserver() {
        this.observer = new IntersectionObserver(
            (entries) => this.handleVisibilityChange(entries),
            { threshold: 0.1 }
        );
    }

    /**
     * Register a video element for lifecycle management
     */
    register(elementId, videoEl, fill) {
        this.activeVideos.set(elementId, { videoEl, fill });
        this.observer.observe(videoEl);
    }

    /**
     * Unregister video (element deleted)
     */
    unregister(elementId) {
        const entry = this.activeVideos.get(elementId);
        if (entry) {
            this.observer.unobserve(entry.videoEl);
            entry.videoEl.pause();
            entry.videoEl.src = '';
            this.activeVideos.delete(elementId);
            this.playingVideos.delete(elementId);
        }
    }

    /**
     * Handle slide transitions
     */
    onSlideChange(oldSlideId, newSlideId, slideElements) {
        // Pause all videos on old slide
        for (const [elementId, entry] of this.activeVideos) {
            if (this.getSlideForElement(elementId) === oldSlideId) {
                entry.videoEl.pause();
                this.playingVideos.delete(elementId);
            }
        }
        
        // Start autoplay videos on new slide
        for (const [elementId, entry] of this.activeVideos) {
            if (this.getSlideForElement(elementId) === newSlideId) {
                if (entry.fill.autoplay) {
                    this.playWithLimit(elementId, entry);
                }
            }
        }
    }

    /**
     * Handle mode transitions (edit ↔ presentation)
     */
    onModeChange(oldMode, newMode) {
        if (newMode === 'presentation') {
            // In presentation: respect autoplay settings
            for (const [elementId, entry] of this.activeVideos) {
                if (entry.fill.autoplay) {
                    entry.videoEl.currentTime = entry.fill.startTime || 0;
                    this.playWithLimit(elementId, entry);
                }
            }
        } else {
            // In edit mode: pause all
            for (const [elementId, entry] of this.activeVideos) {
                entry.videoEl.pause();
                this.playingVideos.delete(elementId);
            }
        }
    }

    /**
     * Handle element selection (pause for control)
     */
    onElementSelected(elementId) {
        const entry = this.activeVideos.get(elementId);
        if (entry) {
            entry.videoEl.pause();
            this.playingVideos.delete(elementId);
        }
    }

    /**
     * Handle element deselection
     */
    onElementDeselected(elementId) {
        const entry = this.activeVideos.get(elementId);
        if (entry && entry.fill.autoplay) {
            this.playWithLimit(elementId, entry);
        }
    }

    /**
     * Play video with concurrent limit
     */
    playWithLimit(elementId, entry) {
        if (this.playingVideos.size >= this.maxConcurrent) {
            // Pause oldest playing video
            const oldest = this.playingVideos.values().next().value;
            const oldEntry = this.activeVideos.get(oldest);
            if (oldEntry) {
                oldEntry.videoEl.pause();
                this.playingVideos.delete(oldest);
            }
        }
        
        entry.videoEl.play().catch(() => {});
        this.playingVideos.add(elementId);
    }

    /**
     * Handle visibility changes (IntersectionObserver)
     */
    handleVisibilityChange(entries) {
        for (const entry of entries) {
            const elementId = this.findElementId(entry.target);
            if (!elementId) continue;
            
            const videoEntry = this.activeVideos.get(elementId);
            if (!videoEntry) continue;
            
            if (entry.isIntersecting) {
                // Visible again - clear release timer
                clearTimeout(this.offscreenTimers.get(elementId));
                this.offscreenTimers.delete(elementId);
                
                // Resume if was playing
                if (videoEntry.fill.autoplay && !this.playingVideos.has(elementId)) {
                    this.playWithLimit(elementId, videoEntry);
                }
            } else {
                // Off-screen - pause immediately
                videoEntry.videoEl.pause();
                this.playingVideos.delete(elementId);
                
                // Set timer to release resources
                const timer = setTimeout(() => {
                    this.releaseVideoResources(elementId);
                }, this.offscreenTimeout);
                this.offscreenTimers.set(elementId, timer);
            }
        }
    }

    /**
     * Release video resources after extended off-screen time
     */
    releaseVideoResources(elementId) {
        const entry = this.activeVideos.get(elementId);
        if (entry) {
            // Store current time before releasing
            entry.savedTime = entry.videoEl.currentTime;
            entry.videoEl.src = '';
            entry.released = true;
        }
    }

    /**
     * Restore video resources when coming back on screen
     */
    restoreVideoResources(elementId) {
        const entry = this.activeVideos.get(elementId);
        if (entry && entry.released) {
            entry.videoEl.src = entry.fill.src;
            entry.videoEl.currentTime = entry.savedTime || entry.fill.startTime || 0;
            entry.released = false;
        }
    }

    findElementId(videoEl) {
        for (const [id, entry] of this.activeVideos) {
            if (entry.videoEl === videoEl) return id;
        }
        return null;
    }

    getSlideForElement(elementId) {
        // Implementation depends on state structure
        // Returns the slide ID containing this element
        return null; // Placeholder
    }

    /**
     * Get stats for debugging
     */
    getStats() {
        return {
            registered: this.activeVideos.size,
            playing: this.playingVideos.size,
            released: [...this.activeVideos.values()].filter(e => e.released).length
        };
    }
}

export const videoLifecycleManager = new VideoLifecycleManager();
```

---

## Rendering

### ShapeElement Media Rendering

```javascript
// Add to ShapeElement.js

applyImageFill(layer, fill, el) {
    // Get or create image element
    let img = layer.querySelector('img.media-fill');
    if (!img) {
        img = document.createElement('img');
        img.className = 'media-fill';
        img.draggable = false;
        layer.appendChild(img);
    }
    
    // Update src if changed
    if (img.src !== fill.src) {
        img.src = fill.src;
        img.alt = fill.alt || '';
    }
    
    // Apply scale mode
    this.applyMediaScaleMode(img, fill, el);
    
    // Apply position
    this.applyMediaPosition(img, fill);
    
    // Apply transform (scale + rotation)
    this.applyMediaTransform(img, fill);
    
    // Apply filters
    img.style.filter = FilterEngine.buildCssFilter(fill.filters);
    
    // Apply SVG filters for temperature/tint
    this.applyAdvancedFilters(layer, fill, el.id);
}

applyVideoFill(layer, fill, el) {
    // Get or create video element
    let video = layer.querySelector('video.media-fill');
    if (!video) {
        video = document.createElement('video');
        video.className = 'media-fill';
        video.playsInline = true;
        video.disablePictureInPicture = true;
        layer.appendChild(video);
        
        // Store reference for control
        layer._videoElement = video;
    }
    
    // Update src if changed
    if (video.src !== fill.src) {
        video.src = fill.src;
        video.load();
    }
    
    // Playback settings
    video.loop = fill.loop;
    video.muted = fill.muted;
    video.volume = fill.volume;
    video.playbackRate = fill.playbackRate;
    
    // Autoplay handling
    if (fill.autoplay && video.paused) {
        video.play().catch(() => {
            // Autoplay blocked - needs user interaction
        });
    }
    
    // Trim points
    if (fill.startTime && video.currentTime < fill.startTime) {
        video.currentTime = fill.startTime;
    }
    
    // Loop with trim
    video.ontimeupdate = () => {
        if (fill.endTime && video.currentTime >= fill.endTime) {
            if (fill.loop) {
                video.currentTime = fill.startTime || 0;
            } else {
                video.pause();
            }
        }
    };
    
    // Apply same positioning as image
    this.applyMediaScaleMode(video, fill, el);
    this.applyMediaPosition(video, fill);
    this.applyMediaTransform(video, fill);
    video.style.filter = FilterEngine.buildCssFilter(fill.filters);
    this.applyAdvancedFilters(layer, fill, el.id);
}

applyMediaScaleMode(mediaEl, fill, el, layer) {
    const containerWidth = el.width;
    const containerHeight = el.height;
    const mediaWidth = fill.originalWidth || containerWidth;
    const mediaHeight = fill.originalHeight || containerHeight;
    
    // Clear any previous tile mode background
    layer.style.backgroundImage = '';
    layer.style.backgroundRepeat = '';
    layer.style.backgroundSize = '';
    
    switch (fill.scaleMode) {
        case 'fill':
            // Cover entire container, crop excess
            mediaEl.style.display = 'block';
            mediaEl.style.width = '100%';
            mediaEl.style.height = '100%';
            mediaEl.style.objectFit = 'cover';
            break;
            
        case 'fit':
            // Fit inside container, letterbox
            mediaEl.style.display = 'block';
            mediaEl.style.width = '100%';
            mediaEl.style.height = '100%';
            mediaEl.style.objectFit = 'contain';
            break;
            
        case 'stretch':
            // Distort to fill exactly
            mediaEl.style.display = 'block';
            mediaEl.style.width = '100%';
            mediaEl.style.height = '100%';
            mediaEl.style.objectFit = 'fill';
            break;
            
        case 'tile':
            // IMPORTANT: <img> elements cannot be tiled!
            // Hide the img element and use CSS background instead
            mediaEl.style.display = 'none';
            layer.style.backgroundImage = `url(${fill.src})`;
            layer.style.backgroundRepeat = 'repeat';
            layer.style.backgroundSize = `${mediaWidth}px ${mediaHeight}px`;
            // Apply filters to layer instead
            layer.style.filter = FilterEngine.buildCssFilter(fill.filters);
            break;
    }
}

applyMediaPosition(mediaEl, fill) {
    const x = (fill.position?.x ?? 0.5) * 100;
    const y = (fill.position?.y ?? 0.5) * 100;
    mediaEl.style.objectPosition = `${x}% ${y}%`;
}

applyMediaTransform(mediaEl, fill) {
    const scale = fill.scale || 1;
    const rotation = fill.rotation || 0;
    
    if (scale !== 1 || rotation !== 0) {
        mediaEl.style.transform = `scale(${scale}) rotate(${rotation}deg)`;
        mediaEl.style.transformOrigin = 'center center';
    } else {
        mediaEl.style.transform = '';
    }
}

applyAdvancedFilters(layer, fill, elementId) {
    // Remove old SVG filters
    const oldSvg = layer.querySelector('svg.filter-defs');
    if (oldSvg) oldSvg.remove();
    
    // Add temperature/tint filter if needed
    const tempFilter = FilterEngine.buildTemperatureTintFilter(fill.filters, elementId);
    if (tempFilter) {
        layer.insertAdjacentHTML('beforeend', tempFilter.svg);
        const mediaEl = layer.querySelector('.media-fill');
        const currentFilter = mediaEl.style.filter;
        mediaEl.style.filter = `${currentFilter} url(#${tempFilter.filterId})`;
    }
}
```

### CSS for Media Fills

```scss
// src/styles/modules/_media-fills.scss

.fill-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    pointer-events: none;
    
    .media-fill {
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;
        
        // Prevent selection/dragging
        user-select: none;
        -webkit-user-drag: none;
    }
    
    // Tile mode - repeat the image
    &.tile-mode {
        .media-fill {
            position: relative;
        }
        
        background-repeat: repeat;
        background-size: auto;
    }
}

// Error states
.media-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--color-bg-well);
    color: var(--color-text-secondary);
    
    .error-icon {
        font-size: 32px;
        margin-bottom: var(--spacing-2);
    }
    
    .error-message {
        font-size: var(--font-size-sm);
        text-align: center;
    }
}
```

---

## UI Components

### ImageTab

```javascript
// src/ui/components/FillFlyout/ImageTab.js

import { mediaManager } from '../../../core/media/MediaManager.js';
import { MediaPreview } from './MediaPreview.js';
import { ScaleModeSelector } from './ScaleModeSelector.js';
import { PositionControl } from './PositionControl.js';
import { FilterControls } from './FilterControls.js';

export class ImageTab {
    constructor({ fill, onChange }) {
        this.fill = fill;
        this.onChange = onChange;
        this.element = document.createElement('div');
        this.element.className = 'image-tab';
        this.render();
    }

    render() {
        this.element.innerHTML = '';
        
        // Preview
        this.preview = new MediaPreview({
            src: this.fill.src,
            type: 'image',
            scaleMode: this.fill.scaleMode,
            position: this.fill.position
        });
        this.element.appendChild(this.preview.element);
        
        // Drop zone / Browse
        this.dropZone = this.createDropZone();
        this.element.appendChild(this.dropZone);
        
        // Scale Mode
        this.scaleModeSelector = new ScaleModeSelector({
            value: this.fill.scaleMode,
            onChange: (mode) => this.updateFill({ scaleMode: mode })
        });
        this.element.appendChild(this.createSection('Scale Mode', this.scaleModeSelector.element));
        
        // Position
        this.positionControl = new PositionControl({
            position: this.fill.position,
            scale: this.fill.scale,
            rotation: this.fill.rotation,
            onPositionChange: (pos) => this.updateFill({ position: pos }),
            onScaleChange: (scale) => this.updateFill({ scale }),
            onRotationChange: (rot) => this.updateFill({ rotation: rot }),
            onReset: () => this.resetToOriginal()
        });
        this.element.appendChild(this.createSection('Position', this.positionControl.element));
        
        // Filters
        this.filterControls = new FilterControls({
            filters: this.fill.filters,
            onChange: (filters) => this.updateFill({ filters })
        });
        this.element.appendChild(this.createSection('Adjustments', this.filterControls.element));
    }

    createDropZone() {
        const zone = document.createElement('div');
        zone.className = 'media-drop-zone';
        zone.innerHTML = `
            <div class="drop-zone-content">
                <span class="drop-icon">📁</span>
                <span class="drop-text">Drop image here or</span>
                <button class="browse-btn">Browse...</button>
            </div>
        `;
        
        // File input (hidden)
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';
        zone.appendChild(input);
        
        // Browse button
        zone.querySelector('.browse-btn').onclick = () => input.click();
        
        // File selection
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                await this.handleFileImport(file);
            }
        };
        
        // Drag & drop
        zone.ondragover = (e) => {
            e.preventDefault();
            zone.classList.add('drag-over');
        };
        zone.ondragleave = () => zone.classList.remove('drag-over');
        zone.ondrop = async (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file) {
                await this.handleFileImport(file);
            }
        };
        
        return zone;
    }

    async handleFileImport(file) {
        const fill = await mediaManager.importFile(file);
        // Merge with existing fill (preserve opacity, blend mode)
        this.updateFill({
            src: fill.src,
            originalWidth: fill.originalWidth,
            originalHeight: fill.originalHeight,
            fileName: fill.fileName,
            fileSize: fill.fileSize
        });
    }

    resetToOriginal() {
        // Resize shape to match image dimensions
        this.onChange({
            __resizeShape: true,
            width: this.fill.originalWidth,
            height: this.fill.originalHeight,
            position: { x: 0.5, y: 0.5 },
            scale: 1,
            rotation: 0
        });
    }

    updateFill(changes) {
        this.fill = { ...this.fill, ...changes };
        this.onChange(changes);
    }

    createSection(title, content) {
        const section = document.createElement('div');
        section.className = 'flyout-section';
        section.innerHTML = `<div class="section-title">${title}</div>`;
        section.appendChild(content);
        return section;
    }
}
```

### VideoTab

```javascript
// src/ui/components/FillFlyout/VideoTab.js

import { mediaManager } from '../../../core/media/MediaManager.js';
import { VideoProcessor } from '../../../core/media/VideoProcessor.js';
import { MediaPreview } from './MediaPreview.js';
import { ScaleModeSelector } from './ScaleModeSelector.js';
import { PositionControl } from './PositionControl.js';
import { FilterControls } from './FilterControls.js';
import { VideoControls } from './VideoControls.js';

export class VideoTab {
    constructor({ fill, onChange }) {
        this.fill = fill;
        this.onChange = onChange;
        this.videoProcessor = new VideoProcessor();
        this.element = document.createElement('div');
        this.element.className = 'video-tab';
        this.render();
    }

    render() {
        this.element.innerHTML = '';
        
        // Preview with playback controls
        this.preview = new MediaPreview({
            src: this.fill.src,
            type: 'video',
            scaleMode: this.fill.scaleMode,
            position: this.fill.position,
            onTimeUpdate: (time) => this.handleTimeUpdate(time)
        });
        this.element.appendChild(this.preview.element);
        
        // Video Controls (play/pause, timeline, speed)
        this.videoControls = new VideoControls({
            duration: this.fill.duration,
            currentTime: this.fill.currentTime,
            playbackRate: this.fill.playbackRate,
            volume: this.fill.volume,
            muted: this.fill.muted,
            loop: this.fill.loop,
            autoplay: this.fill.autoplay,
            startTime: this.fill.startTime,
            endTime: this.fill.endTime,
            onPlay: () => this.preview.play(),
            onPause: () => this.preview.pause(),
            onSeek: (time) => this.preview.seek(time),
            onPlaybackRateChange: (rate) => this.updateFill({ playbackRate: rate }),
            onVolumeChange: (vol) => this.updateFill({ volume: vol }),
            onMutedChange: (muted) => this.updateFill({ muted }),
            onLoopChange: (loop) => this.updateFill({ loop }),
            onAutoplayChange: (autoplay) => this.updateFill({ autoplay }),
            onTrimChange: (start, end) => this.updateFill({ startTime: start, endTime: end }),
            onSetPoster: (time) => this.setPosterFrame(time)
        });
        this.element.appendChild(this.videoControls.element);
        
        // Drop zone
        this.dropZone = this.createDropZone();
        this.element.appendChild(this.dropZone);
        
        // Scale Mode
        this.scaleModeSelector = new ScaleModeSelector({
            value: this.fill.scaleMode,
            onChange: (mode) => this.updateFill({ scaleMode: mode })
        });
        this.element.appendChild(this.createSection('Scale Mode', this.scaleModeSelector.element));
        
        // Position
        this.positionControl = new PositionControl({
            position: this.fill.position,
            scale: this.fill.scale,
            rotation: this.fill.rotation,
            onPositionChange: (pos) => this.updateFill({ position: pos }),
            onScaleChange: (scale) => this.updateFill({ scale }),
            onRotationChange: (rot) => this.updateFill({ rotation: rot }),
            onReset: () => this.resetToOriginal()
        });
        this.element.appendChild(this.createSection('Position', this.positionControl.element));
        
        // Filters
        this.filterControls = new FilterControls({
            filters: this.fill.filters,
            onChange: (filters) => this.updateFill({ filters })
        });
        this.element.appendChild(this.createSection('Adjustments', this.filterControls.element));
    }

    async setPosterFrame(time) {
        const posterSrc = await this.videoProcessor.extractPosterFrame(this.fill.src, time);
        this.updateFill({ posterFrame: time, posterSrc });
    }

    handleTimeUpdate(time) {
        // Don't persist every frame - just for display
        this.videoControls.updateCurrentTime(time);
    }

    // Similar methods as ImageTab...
}
```

### ScaleModeSelector

```javascript
// src/ui/components/FillFlyout/ScaleModeSelector.js

export class ScaleModeSelector {
    constructor({ value, onChange }) {
        this.value = value;
        this.onChange = onChange;
        this.element = document.createElement('div');
        this.element.className = 'scale-mode-selector';
        this.render();
    }

    render() {
        const modes = [
            { id: 'fill', icon: '▣', label: 'Fill', tooltip: 'Cover entire shape, crop excess' },
            { id: 'fit', icon: '◫', label: 'Fit', tooltip: 'Show entire image, letterbox' },
            { id: 'stretch', icon: '⤢', label: 'Stretch', tooltip: 'Distort to fill exactly' },
            { id: 'tile', icon: '⊞', label: 'Tile', tooltip: 'Repeat at original size' }
        ];
        
        this.element.innerHTML = modes.map(mode => `
            <button 
                class="scale-mode-btn ${mode.id === this.value ? 'active' : ''}"
                data-mode="${mode.id}"
                title="${mode.tooltip}"
            >
                <span class="mode-icon">${mode.icon}</span>
                <span class="mode-label">${mode.label}</span>
            </button>
        `).join('');
        
        this.element.querySelectorAll('.scale-mode-btn').forEach(btn => {
            btn.onclick = () => {
                const mode = btn.dataset.mode;
                this.value = mode;
                this.element.querySelectorAll('.scale-mode-btn').forEach(b => 
                    b.classList.toggle('active', b.dataset.mode === mode)
                );
                this.onChange(mode);
            };
        });
    }
}
```

### FilterControls

```javascript
// src/ui/components/FillFlyout/FilterControls.js

import { NumberInput } from '../NumberInput.js';

export class FilterControls {
    constructor({ filters, onChange }) {
        this.filters = { ...filters };
        this.onChange = onChange;
        this.element = document.createElement('div');
        this.element.className = 'filter-controls';
        this.render();
    }

    render() {
        const filterDefs = [
            { key: 'exposure', label: 'Exposure', min: -100, max: 100 },
            { key: 'contrast', label: 'Contrast', min: -100, max: 100 },
            { key: 'saturation', label: 'Saturation', min: -100, max: 100 },
            { key: 'temperature', label: 'Temperature', min: -100, max: 100 },
            { key: 'tint', label: 'Tint', min: -100, max: 100 },
            { key: 'highlights', label: 'Highlights', min: -100, max: 100 },
            { key: 'shadows', label: 'Shadows', min: -100, max: 100 },
            { key: 'blur', label: 'Blur', min: 0, max: 100 }
        ];
        
        this.element.innerHTML = '';
        
        filterDefs.forEach(def => {
            const row = document.createElement('div');
            row.className = 'filter-row';
            
            const label = document.createElement('label');
            label.textContent = def.label;
            row.appendChild(label);
            
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = def.min;
            slider.max = def.max;
            slider.value = this.filters[def.key] || 0;
            slider.className = 'filter-slider';
            
            const valueDisplay = document.createElement('span');
            valueDisplay.className = 'filter-value';
            valueDisplay.textContent = slider.value;
            
            slider.oninput = () => {
                const val = parseInt(slider.value);
                valueDisplay.textContent = val;
                this.filters[def.key] = val;
                this.onChange(this.filters);
            };
            
            // Double-click to reset
            slider.ondblclick = () => {
                slider.value = 0;
                valueDisplay.textContent = '0';
                this.filters[def.key] = 0;
                this.onChange(this.filters);
            };
            
            row.appendChild(slider);
            row.appendChild(valueDisplay);
            this.element.appendChild(row);
        });
        
        // Reset All button
        const resetBtn = document.createElement('button');
        resetBtn.className = 'reset-filters-btn';
        resetBtn.textContent = 'Reset Adjustments';
        resetBtn.onclick = () => {
            Object.keys(this.filters).forEach(k => this.filters[k] = 0);
            this.render();
            this.onChange(this.filters);
        };
        this.element.appendChild(resetBtn);
    }
}
```

---

## Video Control Overlay

On-canvas overlay that appears when video fill is selected:

```javascript
// src/ui/overlays/VideoControlOverlay.js

import { store } from '../../core/Store.js';

export class VideoControlOverlay {
    constructor() {
        this.element = document.createElement('div');
        this.element.className = 'video-control-overlay';
        this.element.style.display = 'none';
        this.currentVideo = null;
        this.render();
        this.bindEvents();
    }

    show(shapeElement, videoElement, fill) {
        this.currentVideo = videoElement;
        this.fill = fill;
        this.shapeElement = shapeElement;
        
        // Position overlay at bottom of shape
        const rect = shapeElement.getBoundingClientRect();
        this.element.style.left = `${rect.left}px`;
        this.element.style.top = `${rect.bottom - 40}px`;
        this.element.style.width = `${rect.width}px`;
        this.element.style.display = 'flex';
        
        this.updateTimeDisplay();
    }

    hide() {
        this.element.style.display = 'none';
        this.currentVideo = null;
    }

    render() {
        this.element.innerHTML = `
            <button class="vco-btn skip-back" title="Skip back 5s">◀◀</button>
            <button class="vco-btn play-pause" title="Play/Pause">▶</button>
            <button class="vco-btn skip-forward" title="Skip forward 5s">▶▶</button>
            <span class="vco-time">00:00 / 00:00</span>
            <button class="vco-btn mute-toggle" title="Toggle mute">🔇</button>
            <input type="range" class="vco-volume" min="0" max="1" step="0.1" value="0">
            <button class="vco-btn fullscreen" title="Preview fullscreen">⛶</button>
        `;
    }

    bindEvents() {
        this.element.querySelector('.skip-back').onclick = () => {
            if (this.currentVideo) {
                this.currentVideo.currentTime = Math.max(0, this.currentVideo.currentTime - 5);
            }
        };
        
        this.element.querySelector('.play-pause').onclick = () => {
            if (this.currentVideo) {
                if (this.currentVideo.paused) {
                    this.currentVideo.play();
                    this.element.querySelector('.play-pause').textContent = '❚❚';
                } else {
                    this.currentVideo.pause();
                    this.element.querySelector('.play-pause').textContent = '▶';
                }
            }
        };
        
        this.element.querySelector('.skip-forward').onclick = () => {
            if (this.currentVideo) {
                this.currentVideo.currentTime = Math.min(
                    this.currentVideo.duration,
                    this.currentVideo.currentTime + 5
                );
            }
        };
        
        this.element.querySelector('.mute-toggle').onclick = () => {
            if (this.currentVideo) {
                this.currentVideo.muted = !this.currentVideo.muted;
                this.element.querySelector('.mute-toggle').textContent = 
                    this.currentVideo.muted ? '🔇' : '🔊';
            }
        };
        
        this.element.querySelector('.vco-volume').oninput = (e) => {
            if (this.currentVideo) {
                this.currentVideo.volume = parseFloat(e.target.value);
                if (this.currentVideo.volume > 0) {
                    this.currentVideo.muted = false;
                }
            }
        };
        
        // Time update
        this.updateInterval = setInterval(() => this.updateTimeDisplay(), 250);
    }

    updateTimeDisplay() {
        if (!this.currentVideo) return;
        
        const current = this.formatTime(this.currentVideo.currentTime);
        const total = this.formatTime(this.currentVideo.duration || 0);
        this.element.querySelector('.vco-time').textContent = `${current} / ${total}`;
    }

    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    destroy() {
        clearInterval(this.updateInterval);
        this.element.remove();
    }
}
```

---

## Store Actions

```javascript
// Add to Store.js actions

// Media-related actions
case 'IMPORT_MEDIA_FILL': {
    const { elementId, fill, isTransient } = action.payload;
    // Add fill to element's fills array
    // Similar to existing fill logic
    break;
}

case 'UPDATE_MEDIA_FILL': {
    const { elementId, fillIndex, changes, isTransient } = action.payload;
    // Update specific fill layer properties
    break;
}

case 'RESIZE_SHAPE_TO_MEDIA': {
    const { elementId, width, height } = action.payload;
    // Special action that resizes the shape to match media dimensions
    break;
}
```

---

## Drag & Drop Integration

```javascript
// Add to CanvasManager.js

setupMediaDragDrop() {
    const canvas = this.slideViewContainer;
    
    canvas.addEventListener('dragover', (e) => {
        if (this.hasMediaFiles(e.dataTransfer)) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            this.showDropIndicator(e);
        }
    });
    
    canvas.addEventListener('drop', async (e) => {
        if (this.hasMediaFiles(e.dataTransfer)) {
            e.preventDefault();
            this.hideDropIndicator();
            
            const file = e.dataTransfer.files[0];
            const fill = await mediaManager.importFile(file);
            
            // Check if dropped on existing shape
            const hitElement = this.getElementAtPoint(e.clientX, e.clientY);
            
            if (hitElement) {
                // Add fill to existing shape
                store.dispatch('ADD_FILL_LAYER', {
                    elementId: hitElement.id,
                    fill
                });
            } else {
                // Create new shape at drop location
                const point = this.screenToSlide(e.clientX, e.clientY);
                store.dispatch('ADD_ELEMENT', {
                    type: 'shape',
                    x: point.x,
                    y: point.y,
                    width: fill.originalWidth,
                    height: fill.originalHeight,
                    style: {
                        fills: [fill]
                    }
                });
            }
        }
    });
}

hasMediaFiles(dataTransfer) {
    if (!dataTransfer.types.includes('Files')) return false;
    
    const items = dataTransfer.items;
    for (const item of items) {
        if (item.type.startsWith('image/') || item.type.startsWith('video/')) {
            return true;
        }
    }
    return false;
}
```

---

## Performance Optimizations

### Lazy Loading

```javascript
// Only decode images when visible
class LazyMediaLoader {
    constructor() {
        this.observer = new IntersectionObserver(
            (entries) => this.handleIntersection(entries),
            { rootMargin: '100px' }
        );
    }

    observe(element) {
        this.observer.observe(element);
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            const mediaEl = entry.target.querySelector('.media-fill');
            if (entry.isIntersecting) {
                // Load/play
                if (mediaEl.tagName === 'VIDEO') {
                    mediaEl.play().catch(() => {});
                }
            } else {
                // Unload/pause
                if (mediaEl.tagName === 'VIDEO') {
                    mediaEl.pause();
                }
            }
        });
    }
}
```

### Memory Management

```javascript
// Cleanup when fills are removed
store.on('REMOVE_FILL_LAYER', (action) => {
    const { fill } = action.payload;
    if (fill.type === 'image' || fill.type === 'video') {
        mediaManager.releaseMediaUrl(fill.src);
    }
});

// Cleanup on element delete
store.on('DELETE_ELEMENT', (action) => {
    const element = getElement(action.payload.id);
    if (element?.style?.fills) {
        element.style.fills.forEach(fill => {
            if (fill.type === 'image' || fill.type === 'video') {
                mediaManager.releaseMediaUrl(fill.src);
            }
        });
    }
});
```

---

## Testing Strategy

### Unit Tests

1. **MediaManager**
   - File import (various formats)
   - URL creation (data vs blob)
   - Cache management

2. **FilterEngine**
   - CSS filter generation
   - SVG filter generation
   - Edge cases (all zeros, extremes)

3. **Processors**
   - Dimension extraction
   - Video metadata
   - Poster frame extraction

### Integration Tests

1. **Drag & drop** - Files onto canvas and shapes
2. **Fill layer stacking** - Multiple media with blend modes
3. **Scale modes** - All modes with various aspect ratios
4. **Video playback** - Autoplay, loop, trim

### Visual Regression Tests

1. **Scale mode rendering** - Compare against reference images
2. **Filter effects** - All filter combinations
3. **Blend modes** - All modes with various backgrounds

---

## Migration Path

### From Legacy Image Elements

If separate image elements exist, migrate to shape+image fill:

```javascript
function migrateImageElement(imageEl) {
    return {
        type: 'shape',
        x: imageEl.x,
        y: imageEl.y,
        width: imageEl.width,
        height: imageEl.height,
        style: {
            fills: [{
                type: 'image',
                src: imageEl.src,
                scaleMode: imageEl.objectFit || 'fill',
                // ... other properties
            }],
            cornerRadius: imageEl.cornerRadius
        }
    };
}
```

---

## Security Considerations

1. **CORS**: Handle cross-origin images appropriately
2. **File validation**: Check MIME types, not just extensions
3. **Size limits**: Enforce per-file and per-project limits
4. **Blob URL cleanup**: Prevent memory leaks

---

## Risk Analysis

### Critical Risks (Must Address Before Implementation)

| Risk | Severity | Likelihood | Impact | Mitigation |
|------|----------|------------|--------|------------|
| **Blob URL orphaning** | Critical | High | Memory leak, browser crash | Reference counting + history integration (Phase 9) |
| **HistoryManager not extendable** | Critical | Medium | Blobs released prematurely, broken undo | Current HistoryManager lacks eviction callbacks - must add `onEvict` hook |
| **ShapeElement.applyFills() complexity** | High | High | Bugs, performance issues | Current method is 200+ lines - extract media handling into separate methods |
| **Store has no media-specific actions** | High | Certain | No proper state management for media | Must add `IMPORT_MEDIA_FILL`, `UPDATE_MEDIA_FILL` actions |

### Major Risks (Address During Implementation)

| Risk | Severity | Likelihood | Impact | Mitigation |
|------|----------|------------|--------|------------|
| **Video autoplay blocked** | High | High | Silent failure, bad UX | Always start muted, add visible play button, detect autoplay policy |
| **Large file hangs browser** | High | Medium | UI freeze during import | Use Web Workers for hashing, show progress indicator, async chunked processing |
| **Filter performance** | Medium | High | Laggy UI during adjustments | Debounce filter updates (150ms), use lower resolution preview during drag |
| **Concurrent videos overwhelm GPU** | High | Medium | Frame drops, crashes | Enforce max 5 playing videos, use IntersectionObserver for visibility |
| **FillSection not designed for media** | Medium | Certain | Poor UX, layout issues | Current FillSection shows color swatches - need new preview component |

### Moderate Risks (Monitor)

| Risk | Severity | Likelihood | Impact | Mitigation |
|------|----------|------------|--------|------------|
| **CORS blocks remote images** | Medium | Medium | Can't use external URLs | Show clear error, offer download-and-reimport flow |
| **SVG filters slow on Firefox** | Medium | Low | Poor filter performance | Test on Firefox early, have CSS-only fallback |
| **Presentation mode video sync** | Medium | Medium | Videos out of sync on slide change | Explicit `onSlideEnter`/`onSlideExit` lifecycle hooks |
| **Animated GIF detection** | Low | Low | Static GIF treated as animated | Check GIF frame count in header, not just extension |

### Architecture Risks (Design Issues)

| Risk | Description | Recommendation |
|------|-------------|----------------|
| **Dual identity: MediaManager vs MediaAssetManager** | Specs mention both names | Standardize on `MediaAssetManager` everywhere |
| **`src` vs `assetId` confusion** | Some places still reference `src` | Rename all internal references to `assetId` |
| **No asset loading states** | Fill has no `loading`/`error`/`ready` state | Add `assetState: 'pending' | 'loading' | 'ready' | 'error'` |
| **FillFlyout doesn't exist** | Implementation plan assumes FillFlyout.js | Need to check actual UI structure first |

---

## Dependency Analysis

### Internal Dependencies (Must Exist)

| Dependency | Status | Required By | Notes |
|------------|--------|-------------|-------|
| `HistoryManager.js` | ✅ Exists | Phase 9 | Needs `onEvict` callback extension |
| `Store.js` | ✅ Exists | Phase 6 | Needs new action handlers |
| `ShapeElement.js` | ✅ Exists | Phase 2 | Complex 620-line file, careful modification needed |
| `FillSection.js` | ✅ Exists | Phase 3 | Needs media preview capability |
| `EventEmitter` | ✅ Exists | Phase 1 | MediaAssetManager extends this |
| `CanvasManager.js` | ❓ Unknown | Phase 4 | Need to verify structure |
| `PresentationManager.js` | ❓ Unknown | Phase 7 | Need to verify structure |

### External Dependencies (NPM/CDN)

| Dependency | Purpose | Size | Alternative |
|------------|---------|------|-------------|
| **JSZip** | .str file bundling | 95KB | fflate (30KB) |
| **idb** (optional) | IndexedDB wrapper | 10KB | Native IndexedDB |
| **None required for MVP** | - | - | All APIs are native |

### Browser API Dependencies

| API | Usage | Support | Fallback |
|-----|-------|---------|----------|
| `URL.createObjectURL` | Blob URLs | 98%+ | Data URLs (slower) |
| `FileReader` | Data URL conversion | 98%+ | None needed |
| `IntersectionObserver` | Video visibility | 95%+ | Always play (memory cost) |
| `SubtleCrypto.digest` | SHA-256 hashing | 95%+ | Simple string hash |
| `createImageBitmap` | Fast image decode | 93%+ | HTMLImageElement |
| `OffscreenCanvas` | Worker rendering | 92%+ | Main thread only |
| `requestVideoFrameCallback` | Frame sync | 85%+ | requestAnimationFrame |

### Feature Dependencies (Order Matters)

```
MediaAssetManager ──┬──► ImageProcessor
                    ├──► VideoProcessor
                    └──► FilterEngine
                            │
                            ▼
                    ShapeElement.applyFills()
                            │
                            ▼
                    FillSection/ImageTab/VideoTab (UI)
                            │
                            ▼
                    CanvasManager (drag-drop, paste)
                            │
                            ▼
                    Store integration (undo-safe)
                            │
                            ▼
                    HistoryManager extension (blob tracking)
                            │
                            ▼
                    IndexedDB persistence (auto-save)
                            │
                            ▼
                    FileWriter/FileReader (.str format)
```

---

## What This Might Break

### High Risk of Breaking

| Feature | How It Might Break | Detection | Prevention |
|---------|-------------------|-----------|------------|
| **Existing fills** | New fill types confuse renderer | Existing fills show blank | Type guards: `if (fill.type !== 'image' && fill.type !== 'video')` route to existing code |
| **Copy/paste elements** | Clipboard doesn't understand assetId | Paste fails or loses images | Convert to data URL before clipboard write |
| **Undo/redo** | Blob revoked while in history | Undo shows broken image | Never revoke while in undo/redo stack |
| **Save/export (future)** | Blob URLs serialized as strings | Load shows broken images | Must convert assetId → path before save |

### Medium Risk

| Feature | How It Might Break | Prevention |
|---------|-------------------|------------|
| **Selection/bounding boxes** | Media elements have different interaction model | Use existing VisualElement selection logic |
| **Presentation mode** | Videos don't sync with slides | Add slide lifecycle hooks |
| **Code fill coexistence** | Code fill + image fill in same shape | Each fill layer independent, already works |

### Low Risk

| Feature | How It Might Break | Prevention |
|---------|-------------------|------------|
| **Theme switching** | N/A - media not theme-dependent | None needed |
| **Grid view** | Thumbnails show blob URLs | Use canvas snapshot for thumbnails |

---

## Appendix: CSS Filter Reference

| Our Property | CSS Filter | Conversion |
|--------------|------------|------------|
| exposure | brightness() | `1 + (exposure/100)` |
| contrast | contrast() | `1 + (contrast/100)` |
| saturation | saturate() | `1 + (saturation/100)` |
| blur | blur() | `${blur}px` |
| hueRotate | hue-rotate() | `${hueRotate}deg` |
| invert | invert() | `${invert}%` |
| sepia | sepia() | `${sepia}%` |
| grayscale | grayscale() | `${grayscale}%` |
| temperature | SVG feColorMatrix | Custom matrix |
| tint | SVG feColorMatrix | Custom matrix |
| highlights | SVG feComponentTransfer | Gamma curves |
| shadows | SVG feComponentTransfer | Gamma curves |
