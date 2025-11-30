/**
 * ThumbnailRenderer
 * 
 * Generates accurate slide thumbnails using scaled-down SlideView components.
 * Follows the principle of reusing existing rendering infrastructure rather than
 * creating a parallel rendering system.
 * 
 * Key design decisions:
 * - Uses CSS transform for scaling (GPU-accelerated)
 * - Reuses SlideView for accurate representation
 * - Respects theme/CSS variables (dark/light mode)
 * - No external dependencies
 * - Lazy rendering with caching
 */

import { SlideView } from './SlideView.js';
import { store } from '../Store.js';
import { CodeRunner } from '../effects/CodeRunner.js';

/**
 * Default thumbnail dimensions
 * Maintains 16:9 aspect ratio, scaled to fit sidebar
 */
const THUMBNAIL_WIDTH = 192;  // Fits well in ~220px sidebar
const THUMBNAIL_HEIGHT = 108; // 16:9 ratio
const SCALE_FACTOR = THUMBNAIL_WIDTH / 1920; // ~0.1

/**
 * Cache entry for a thumbnail
 * @typedef {Object} ThumbnailCacheEntry
 * @property {HTMLElement} element - The rendered thumbnail DOM element
 * @property {number} timestamp - When this was last updated
 * @property {string} contentHash - Hash of slide content for invalidation
 */

class ThumbnailRendererClass {
    constructor() {
        /** @type {Map<string, ThumbnailCacheEntry>} */
        this.cache = new Map();
        
        /** @type {Set<string>} - Slides pending render */
        this.pendingRenders = new Set();
        
        /** @type {boolean} - Is a render batch in progress */
        this.isProcessing = false;
        
        /** @type {number} - Max cached thumbnails (LRU eviction) */
        this.maxCacheSize = 50;
        
        // Debounce invalidation
        this.invalidationTimers = new Map();
    }

    /**
     * Create a thumbnail element for a slide.
     * Returns cached version if available and still valid.
     * 
     * @param {string} slideId - The slide ID
     * @param {Object} slideData - The effective slide data
     * @returns {HTMLElement} - The thumbnail container element
     */
    createThumbnail(slideId, slideData) {
        // Create container that will hold the scaled slide
        const container = document.createElement('div');
        container.className = 'slide-thumbnail-preview';
        container.style.width = '100%';
        container.style.aspectRatio = '16/9';
        container.style.position = 'relative';
        container.style.overflow = 'hidden';
        container.style.borderRadius = 'var(--radius-sm)';
        container.style.border = '1px solid var(--color-border)';
        container.style.backgroundColor = 'var(--color-surface-primary)';
        
        // Check cache
        const cached = this.cache.get(slideId);
        const contentHash = this._hashSlideContent(slideData);
        
        if (cached && cached.contentHash === contentHash) {
            // Clone cached element to avoid DOM conflicts
            container.appendChild(cached.element.cloneNode(true));
            // Update LRU timestamp
            cached.timestamp = Date.now();
            return container;
        }
        
        // Create the scaled slide view
        const scaledContent = this._createScaledSlideContent(slideId, slideData);
        container.appendChild(scaledContent);
        
        // Cache it
        this._cacheEntry(slideId, scaledContent, contentHash);
        
        return container;
    }

    /**
     * Create the scaled slide content using CSS transforms.
     * 
     * @param {string} slideId
     * @param {Object} slideData
     * @returns {HTMLElement}
     * @private
     */
    _createScaledSlideContent(slideId, slideData) {
        // Wrapper for the scaled content
        const wrapper = document.createElement('div');
        wrapper.className = 'thumbnail-content-wrapper';
        wrapper.style.position = 'absolute';
        wrapper.style.top = '0';
        wrapper.style.left = '0';
        wrapper.style.width = `${THUMBNAIL_WIDTH}px`;
        wrapper.style.height = `${THUMBNAIL_HEIGHT}px`;
        wrapper.style.overflow = 'hidden';
        wrapper.style.pointerEvents = 'none'; // Non-interactive
        
        // The actual slide content at full size, then scaled down
        const slideContent = document.createElement('div');
        slideContent.className = 'thumbnail-slide-content';
        slideContent.style.width = '1920px';
        slideContent.style.height = '1080px';
        slideContent.style.transform = `scale(${SCALE_FACTOR})`;
        slideContent.style.transformOrigin = 'top left';
        slideContent.style.position = 'absolute';
        slideContent.style.top = '0';
        slideContent.style.left = '0';
        
        // Apply background
        this._applyBackground(slideContent, slideData.effectiveBackground || slideData.background);
        
        // Apply theme variables if available
        if (slideData.themeSettings) {
            this._applyThemeVariables(slideContent, slideData.themeSettings);
        }
        
        // Render elements
        this._renderElements(slideContent, slideData);
        
        wrapper.appendChild(slideContent);
        return wrapper;
    }

    /**
     * Apply background to the slide content.
     * Handles solid, gradient, and image backgrounds.
     * Code backgrounds show a placeholder pattern.
     * 
     * @param {HTMLElement} container
     * @param {Object|Array} background
     * @private
     */
    _applyBackground(container, background) {
        if (!background) {
            container.style.backgroundColor = '#ffffff';
            return;
        }

        // Handle array of fills (multi-layer backgrounds)
        const fills = Array.isArray(background) ? background : [background];
        
        fills.forEach((fill, index) => {
            if (fill.visible === false) return;
            
            const layer = document.createElement('div');
            layer.className = 'thumbnail-bg-layer';
            layer.style.position = 'absolute';
            layer.style.top = '0';
            layer.style.left = '0';
            layer.style.width = '100%';
            layer.style.height = '100%';
            layer.style.zIndex = String(index);
            
            if (fill.opacity !== undefined) {
                layer.style.opacity = String(fill.opacity / 100);
            }
            if (fill.blendMode) {
                layer.style.mixBlendMode = fill.blendMode;
            }

            switch (fill.type) {
                case 'solid':
                    layer.style.backgroundColor = fill.color || fill.value || '#ffffff';
                    break;
                case 'gradient':
                    layer.style.background = this._getGradientCss(fill.value);
                    break;
                case 'image':
                    layer.style.background = `url(${fill.value}) center/cover no-repeat`;
                    break;
                case 'code':
                    // Capture a single frame from the code fill
                    this._applyCodeFill(layer, fill, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
                    break;
                default:
                    layer.style.backgroundColor = '#ffffff';
            }
            
            container.appendChild(layer);
        });
    }

    /**
     * Apply theme CSS variables to the container.
     * 
     * @param {HTMLElement} container
     * @param {Object} themeSettings
     * @private
     */
    _applyThemeVariables(container, themeSettings) {
        const { colors, fonts } = themeSettings;
        
        if (colors) {
            // Apply all theme colors as CSS variables
            Object.entries(colors).forEach(([key, value]) => {
                if (value) {
                    container.style.setProperty(`--theme-${key}`, value);
                }
            });
        }
        
        if (fonts) {
            if (fonts.heading) container.style.setProperty('--theme-font-heading', fonts.heading);
            if (fonts.body) container.style.setProperty('--theme-font-body', fonts.body);
        }
    }

    /**
     * Render elements onto the thumbnail.
     * Creates simplified representations for performance.
     * 
     * @param {HTMLElement} container
     * @param {Object} slideData
     * @private
     */
    _renderElements(container, slideData) {
        const elements = slideData.effectiveElements || slideData.elements || {};
        const order = slideData.effectiveOrder || slideData.elementOrder || [];
        
        order.forEach((id, index) => {
            const el = elements[id];
            if (!el) return;
            
            const elDiv = document.createElement('div');
            elDiv.className = 'thumbnail-element';
            elDiv.style.position = 'absolute';
            elDiv.style.left = `${el.x}px`;
            elDiv.style.top = `${el.y}px`;
            elDiv.style.width = `${el.width}px`;
            elDiv.style.height = `${el.height}px`;
            elDiv.style.zIndex = String(index + 10);
            
            // Apply rotation if present
            if (el.rotation) {
                elDiv.style.transform = `rotate(${el.rotation}deg)`;
            }
            
            // Apply opacity if present
            if (el.opacity !== undefined) {
                elDiv.style.opacity = String(el.opacity / 100);
            }
            
            // Render based on type
            switch (el.type) {
                case 'text':
                    this._renderTextElement(elDiv, el);
                    break;
                case 'rect':
                    this._renderRectElement(elDiv, el);
                    break;
                case 'ellipse':
                    this._renderEllipseElement(elDiv, el);
                    break;
                case 'image':
                    this._renderImageElement(elDiv, el);
                    break;
                case 'video':
                    this._renderVideoElement(elDiv, el);
                    break;
                case 'placeholder':
                    this._renderPlaceholderElement(elDiv, el);
                    break;
                default:
                    // Generic element styling
                    elDiv.style.backgroundColor = 'rgba(128, 128, 128, 0.2)';
            }
            
            container.appendChild(elDiv);
        });
    }

    /**
     * Render a text element with actual content.
     * 
     * @param {HTMLElement} container
     * @param {Object} el
     * @private
     */
    _renderTextElement(container, el) {
        container.style.overflow = 'hidden';
        
        // Apply text styles
        container.style.fontFamily = el.fontFamily || 'var(--theme-font-body, Inter)';
        container.style.fontSize = `${el.fontSize || 16}px`;
        container.style.fontWeight = el.fontWeight || '400';
        container.style.lineHeight = el.lineHeight || '1.4';
        container.style.textAlign = el.textAlign || 'left';
        container.style.color = this._getTextColor(el);
        
        // Display actual content (HTML)
        if (el.content) {
            container.innerHTML = el.content;
        }
        
        // Handle placeholder state
        if (el.isPlaceholder && (!el.content || el.content.trim() === '')) {
            container.style.border = '1px dashed var(--color-text-tertiary)';
            container.style.opacity = '0.5';
        }
    }

    /**
     * Get text color from element, handling textFill objects.
     * 
     * @param {Object} el
     * @returns {string}
     * @private
     */
    _getTextColor(el) {
        if (el.textFill) {
            if (typeof el.textFill === 'string') return el.textFill;
            if (el.textFill.type === 'solid') return el.textFill.value || '#000000';
        }
        return el.color || 'var(--theme-text1, #333333)';
    }

    /**
     * Render a rectangle element.
     * 
     * @param {HTMLElement} container
     * @param {Object} el
     * @private
     */
    _renderRectElement(container, el) {
        const style = el.style || {};
        
        // Background/fill
        if (style.fill && style.fill.length > 0) {
            const fill = style.fill[0];
            if (fill.type === 'solid') {
                container.style.backgroundColor = fill.color || fill.value || '#cccccc';
            } else if (fill.type === 'gradient') {
                container.style.background = this._getGradientCss(fill.value);
            } else if (fill.type === 'image') {
                container.style.background = `url(${fill.value}) center/cover no-repeat`;
            } else if (fill.type === 'code') {
                // Capture code fill for shape element
                this._applyCodeFill(container, fill, el.width || 192, el.height || 108);
            }
        } else if (style.backgroundColor) {
            container.style.backgroundColor = style.backgroundColor;
        } else {
            container.style.backgroundColor = '#cccccc';
        }
        
        // Border
        if (style.stroke && style.stroke.length > 0 && style.stroke[0].visible !== false) {
            const stroke = style.stroke[0];
            container.style.border = `${stroke.width || 1}px solid ${stroke.color || '#000'}`;
        }
        
        // Border radius
        if (style.borderRadius) {
            container.style.borderRadius = `${style.borderRadius}px`;
        }
    }

    /**
     * Render an ellipse element.
     * 
     * @param {HTMLElement} container
     * @param {Object} el
     * @private
     */
    _renderEllipseElement(container, el) {
        container.style.borderRadius = '50%';
        this._renderRectElement(container, el); // Reuse rect styling
    }

    /**
     * Render an image element.
     * 
     * @param {HTMLElement} container
     * @param {Object} el
     * @private
     */
    _renderImageElement(container, el) {
        if (el.src) {
            container.style.background = `url(${el.src}) center/contain no-repeat`;
        } else {
            // Placeholder for missing image
            container.style.backgroundColor = 'var(--color-surface-secondary)';
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.style.justifyContent = 'center';
            container.innerHTML = '<i class="fa-regular fa-image" style="font-size: 24px; color: var(--color-text-tertiary);"></i>';
        }
    }

    /**
     * Render a video element (shows first frame or placeholder).
     * 
     * @param {HTMLElement} container
     * @param {Object} el
     * @private
     */
    _renderVideoElement(container, el) {
        // Show poster frame if available, otherwise placeholder
        if (el.poster) {
            container.style.background = `url(${el.poster}) center/contain no-repeat`;
        } else {
            container.style.backgroundColor = 'var(--color-surface-secondary)';
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.style.justifyContent = 'center';
            container.innerHTML = '<i class="fa-solid fa-video" style="font-size: 24px; color: var(--color-text-tertiary);"></i>';
        }
    }

    /**
     * Render a placeholder element.
     * 
     * @param {HTMLElement} container
     * @param {Object} el
     * @private
     */
    _renderPlaceholderElement(container, el) {
        container.style.border = '1px dashed var(--color-text-tertiary)';
        container.style.backgroundColor = 'rgba(128, 128, 128, 0.1)';
        
        // If placeholder has content, render it
        if (el.content) {
            this._renderTextElement(container, el);
        }
    }

    /**
     * Generate gradient CSS from gradient object.
     * 
     * @param {Object|string} gradient
     * @returns {string}
     * @private
     */
    _getGradientCss(gradient) {
        if (!gradient) return 'none';
        if (typeof gradient === 'string') return gradient;
        
        const stops = gradient.stops?.map(s => `${s.color} ${s.position}%`).join(', ') || '#fff, #000';
        
        switch (gradient.type) {
            case 'linear':
                return `linear-gradient(${gradient.angle || 90}deg, ${stops})`;
            case 'radial':
                return `radial-gradient(circle, ${stops})`;
            case 'angular':
                return `conic-gradient(from ${gradient.angle || 0}deg at center, ${stops})`;
            default:
                return `linear-gradient(90deg, ${stops})`;
        }
    }

    /**
     * Apply a code fill to a layer element.
     * Captures a single frame from the code and displays it as an image.
     * 
     * @param {HTMLElement} layer - The layer element to apply the fill to
     * @param {Object} fill - The fill object with code property
     * @param {number} width - Width for the capture canvas
     * @param {number} height - Height for the capture canvas
     * @private
     */
    _applyCodeFill(layer, fill, width, height) {
        const code = fill.value || fill.code;
        if (!code) {
            // Fallback to placeholder if no code
            layer.style.background = 'var(--color-surface-secondary)';
            return;
        }
        
        try {
            // Capture a single frame at t=0
            const canvas = CodeRunner.captureFrame(code, width, height, 0);
            
            if (canvas) {
                // Convert to data URL and use as background image
                try {
                    const dataUrl = canvas.toDataURL('image/png');
                    // Check for valid data URL (JSDOM may return empty 'data:,')
                    if (dataUrl && dataUrl.length > 10 && dataUrl !== 'data:,') {
                        layer.style.background = `url(${dataUrl}) center/cover no-repeat`;
                    } else {
                        // Invalid data URL, use fallback pattern
                        layer.style.background = 'linear-gradient(135deg, var(--color-surface-secondary) 25%, var(--color-surface-tertiary) 25%, var(--color-surface-tertiary) 50%, var(--color-surface-secondary) 50%, var(--color-surface-secondary) 75%, var(--color-surface-tertiary) 75%)';
                        layer.style.backgroundSize = '20px 20px';
                    }
                } catch (e) {
                    // toDataURL failed, use fallback
                    layer.style.background = 'var(--color-surface-secondary)';
                }
            } else {
                // Code didn't render properly, show error indicator
                layer.style.background = 'repeating-linear-gradient(45deg, rgba(255,0,0,0.1) 0, rgba(255,0,0,0.1) 10px, rgba(200,0,0,0.1) 10px, rgba(200,0,0,0.1) 20px)';
            }
        } catch (e) {
            console.warn('ThumbnailRenderer: Error capturing code fill', e);
            layer.style.background = 'var(--color-surface-secondary)';
        }
    }

    /**
     * Generate a simple hash of slide content for cache invalidation.
     * 
     * @param {Object} slideData
     * @returns {string}
     * @private
     */
    _hashSlideContent(slideData) {
        // Simple hash based on key properties
        const parts = [
            JSON.stringify(slideData.effectiveBackground || slideData.background),
            JSON.stringify(slideData.effectiveOrder || slideData.elementOrder),
            Object.keys(slideData.effectiveElements || slideData.elements || {}).length
        ];
        
        // Add element content hashes
        const elements = slideData.effectiveElements || slideData.elements || {};
        Object.values(elements).forEach(el => {
            parts.push(`${el.id}:${el.x}:${el.y}:${el.width}:${el.height}:${el.content?.substring(0, 50) || ''}`);
        });
        
        return parts.join('|');
    }

    /**
     * Cache a thumbnail entry with LRU eviction.
     * 
     * @param {string} slideId
     * @param {HTMLElement} element
     * @param {string} contentHash
     * @private
     */
    _cacheEntry(slideId, element, contentHash) {
        // Evict oldest if at capacity
        if (this.cache.size >= this.maxCacheSize) {
            let oldestKey = null;
            let oldestTime = Infinity;
            
            for (const [key, entry] of this.cache) {
                if (entry.timestamp < oldestTime) {
                    oldestTime = entry.timestamp;
                    oldestKey = key;
                }
            }
            
            if (oldestKey) {
                this.cache.delete(oldestKey);
            }
        }
        
        this.cache.set(slideId, {
            element: element.cloneNode(true),
            timestamp: Date.now(),
            contentHash
        });
    }

    /**
     * Invalidate a specific slide's thumbnail.
     * Debounced to avoid excessive re-renders.
     * 
     * @param {string} slideId
     */
    invalidate(slideId) {
        // Clear existing timer
        if (this.invalidationTimers.has(slideId)) {
            clearTimeout(this.invalidationTimers.get(slideId));
        }
        
        // Debounce invalidation
        const timer = setTimeout(() => {
            this.cache.delete(slideId);
            this.invalidationTimers.delete(slideId);
        }, 300);
        
        this.invalidationTimers.set(slideId, timer);
    }

    /**
     * Invalidate all cached thumbnails.
     */
    invalidateAll() {
        // Clear all timers
        for (const timer of this.invalidationTimers.values()) {
            clearTimeout(timer);
        }
        this.invalidationTimers.clear();
        this.cache.clear();
    }

    /**
     * Get cache statistics for debugging.
     * 
     * @returns {Object}
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Singleton instance
export const ThumbnailRenderer = new ThumbnailRendererClass();
