/**
 * ThumbnailRenderer
 * 
 * Generates slide thumbnails by embedding actual SlideView instances
 * and scaling them down with CSS transforms.
 * 
 * Key architecture:
 * - Uses REAL SlideView instances (same as editor/presentation)
 * - CSS transform: scale() for GPU-accelerated scaling
 * - Code fills are live-animated (real CodeRunner instances)
 * - 100% visual fidelity with what user sees
 * - Minimal code surface - reuses existing infrastructure
 * 
 * This follows the principle of NOT creating parallel rendering systems.
 */

import { SlideView } from './SlideView.js';
import { store } from '../Store.js';

/**
 * Thumbnail dimensions (16:9 aspect ratio)
 */
const THUMBNAIL_WIDTH = 192;
const THUMBNAIL_HEIGHT = 108;
const FULL_WIDTH = 1920;
const FULL_HEIGHT = 1080;
const SCALE_FACTOR = THUMBNAIL_WIDTH / FULL_WIDTH; // 0.1

/**
 * Manages thumbnail SlideView instances
 */
class ThumbnailRendererClass {
    constructor() {
        /**
         * Active SlideView instances for thumbnails
         * @type {Map<string, {view: SlideView, container: HTMLElement}>}
         */
        this.instances = new Map();
        
        /**
         * Debounce timers for updates
         * @type {Map<string, number>}
         */
        this.updateTimers = new Map();
        
        // Listen for custom theme edits to invalidate thumbnails
        this._handleCustomThemeEdited = this._handleCustomThemeEdited.bind(this);
        document.addEventListener('style:custom-theme-edited', this._handleCustomThemeEdited);
    }
    
    /**
     * Handle custom theme edit event - invalidates all thumbnails to pick up new colors
     * @private
     */
    _handleCustomThemeEdited() {
        this.invalidateAll();
    }

    /**
     * Create or update a thumbnail for a slide.
     * Returns a container with a live, scaled-down SlideView.
     * 
     * @param {string} slideId
     * @param {Object} slideData - Effective slide data from store.getEffectiveSlide()
     * @returns {HTMLElement} - Container with the thumbnail
     */
    createThumbnail(slideId, slideData) {
        // Create outer container (fixed thumbnail size)
        const container = document.createElement('div');
        container.className = 'slide-thumbnail-preview';
        container.style.cssText = `
            width: 100%;
            aspect-ratio: 16/9;
            position: relative;
            overflow: hidden;
            border-radius: var(--radius-sm);
            border: 1px solid var(--color-border);
            background-color: var(--color-surface-primary);
        `;
        
        // Create scale wrapper (transforms full-size slide to thumbnail)
        // Scale is calculated to fill container width: containerWidth / FULL_WIDTH
        const scaleWrapper = document.createElement('div');
        scaleWrapper.className = 'thumbnail-scale-wrapper';
        scaleWrapper.style.cssText = `
            width: ${FULL_WIDTH}px;
            height: ${FULL_HEIGHT}px;
            transform-origin: top left;
            position: absolute;
            top: 0;
            left: 0;
            pointer-events: none;
        `;
        
        // Set up ResizeObserver to scale based on container width
        const updateScale = () => {
            const containerWidth = container.offsetWidth;
            if (containerWidth > 0) {
                const scale = containerWidth / FULL_WIDTH;
                scaleWrapper.style.transform = `scale(${scale})`;
            }
        };
        
        // Initial scale
        requestAnimationFrame(updateScale);
        
        // Update scale on resize
        const resizeObserver = new ResizeObserver(updateScale);
        resizeObserver.observe(container);
        
        // Store observer for cleanup
        container._resizeObserver = resizeObserver;
        
        // Check if we already have a SlideView for this slide
        let instance = this.instances.get(slideId);
        
        if (instance) {
            // Reuse existing SlideView - just update it
            instance.view.update(slideData);
            scaleWrapper.appendChild(instance.view.domElement);
        } else {
            // Create new SlideView
            const slideView = new SlideView(`thumb-${slideId}`);
            slideView.mount(scaleWrapper);
            slideView.update(slideData);
            
            // Store reference for later updates
            this.instances.set(slideId, {
                view: slideView,
                container: scaleWrapper
            });
        }
        
        container.appendChild(scaleWrapper);
        return container;
    }

    /**
     * Update an existing thumbnail with new slide data.
     * Call this when slide content changes.
     * 
     * @param {string} slideId
     * @param {Object} slideData
     */
    updateThumbnail(slideId, slideData) {
        const instance = this.instances.get(slideId);
        if (instance) {
            instance.view.update(slideData);
        }
    }

    /**
     * Invalidate (mark for re-render) a specific slide's thumbnail.
     * Debounced to prevent excessive updates.
     * 
     * @param {string} slideId
     */
    invalidate(slideId) {
        // Debounce updates
        if (this.updateTimers.has(slideId)) {
            clearTimeout(this.updateTimers.get(slideId));
        }
        
        this.updateTimers.set(slideId, setTimeout(() => {
            const effectiveSlide = store.getEffectiveSlide(slideId);
            if (effectiveSlide) {
                this.updateThumbnail(slideId, effectiveSlide);
            }
            this.updateTimers.delete(slideId);
        }, 100));
    }

    /**
     * Destroy a thumbnail instance (call when slide is deleted)
     * 
     * @param {string} slideId
     */
    destroyThumbnail(slideId) {
        const instance = this.instances.get(slideId);
        if (instance) {
            instance.view.unmount();
            
            // Clean up ResizeObserver if exists
            if (instance.container._resizeObserver) {
                instance.container._resizeObserver.disconnect();
                delete instance.container._resizeObserver;
            }
            
            this.instances.delete(slideId);
        }
        
        if (this.updateTimers.has(slideId)) {
            clearTimeout(this.updateTimers.get(slideId));
            this.updateTimers.delete(slideId);
        }
    }

    /**
     * Invalidate all thumbnails.
     */
    invalidateAll() {
        for (const slideId of this.instances.keys()) {
            this.invalidate(slideId);
        }
    }

    /**
     * Destroy all thumbnail instances.
     * Call on app teardown.
     */
    destroyAll() {
        for (const [slideId, instance] of this.instances) {
            instance.view.unmount();
        }
        this.instances.clear();
        
        for (const timer of this.updateTimers.values()) {
            clearTimeout(timer);
        }
        this.updateTimers.clear();
    }
}

// Export singleton
export const ThumbnailRenderer = new ThumbnailRendererClass();
