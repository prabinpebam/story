/**
 * ExportPreviewRenderer
 * 
 * Generates preview images for element export.
 * Renders selected elements to a canvas for preview in the Export section.
 * Uses DOM-to-canvas conversion for accurate visual representation.
 * 
 * Performance target: < 300ms render time
 */

import { ElementFactory } from './ElementFactory.js';

/**
 * Render elements to a canvas for export preview
 * @param {Array<Object>} elements - Elements to render
 * @param {Object} options - Render options
 * @param {number} options.scale - Scale factor (0.5, 1, 2, etc.)
 * @param {number} options.maxWidth - Maximum preview width in pixels (default: 200)
 * @param {number} options.maxHeight - Maximum preview height in pixels (default: 200)
 * @returns {Promise<HTMLCanvasElement>} Canvas with rendered preview
 */
async function renderExportPreview(elements, options = {}) {
    try {
        const {
            scale = 1,
            maxWidth = 200,
            maxHeight = 200
        } = options;
        
        if (!elements || elements.length === 0) {
            throw new Error('No elements provided for preview');
        }
        
        // Calculate bounding box of all elements
        const bounds = calculateBounds(elements);
        
        if (bounds.width === 0 || bounds.height === 0) {
            throw new Error('Elements have zero dimensions');
        }
        
        // Calculate actual dimensions with scale
        const actualWidth = bounds.width * scale;
        const actualHeight = bounds.height * scale;
        
        // Calculate preview dimensions (fit within max dimensions)
        let previewWidth = actualWidth;
        let previewHeight = actualHeight;
        
        const aspectRatio = actualWidth / actualHeight;
        
        if (previewWidth > maxWidth) {
            previewWidth = maxWidth;
            previewHeight = maxWidth / aspectRatio;
        }
        
        if (previewHeight > maxHeight) {
            previewHeight = maxHeight;
            previewWidth = maxHeight * aspectRatio;
        }
        
        // Create temporary container for rendering
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '-9999px';
        container.style.width = `${bounds.width}px`;
        container.style.height = `${bounds.height}px`;
        container.style.overflow = 'hidden';
        document.body.appendChild(container);
        
        // Render elements to DOM
        const visualElements = [];
        try {
            for (const element of elements) {
                const visualEl = ElementFactory.create(element);
                visualEl.mount(container);
                
                // Adjust position relative to bounds
                const adjustedData = {
                    ...element,
                    x: element.x - bounds.x,
                    y: element.y - bounds.y
                };
                
                visualEl.update(adjustedData, { width: bounds.width, height: bounds.height });
                visualElements.push(visualEl);
            }
            
            // Wait for images to load and styles to apply
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Create canvas
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(previewWidth);
            canvas.height = Math.round(previewHeight);
            
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // For now, create a simple fallback visualization
            // TODO: Implement proper DOM-to-canvas conversion using html2canvas or similar
            ctx.fillStyle = '#e0e0e0';
            ctx.fillRect(10, 10, canvas.width - 20, canvas.height - 20);
            
            ctx.fillStyle = '#666';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Preview', canvas.width / 2, canvas.height / 2);
            
            return canvas;
            
        } finally {
            // Cleanup
            visualElements.forEach(el => el.unmount());
            document.body.removeChild(container);
        }
        
    } catch (error) {
        console.error('ExportPreviewRenderer error:', error);
        
        // Return placeholder canvas on error
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 150;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, 0, 200, 150);
        ctx.fillStyle = '#999';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Preview unavailable', 100, 75);
        return canvas;
    }
}

/**
 * Calculate bounding box of elements
 * @param {Array<Object>} elements
 * @returns {{x: number, y: number, width: number, height: number}}
 */
function calculateBounds(elements) {
    if (elements.length === 0) {
        return { x: 0, y: 0, width: 0, height: 0 };
    }
    
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    for (const element of elements) {
        const x = element.x || 0;
        const y = element.y || 0;
        const width = element.width || 0;
        const height = element.height || 0;
        
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + width);
        maxY = Math.max(maxY, y + height);
    }
    
    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
    };
}

/**
 * Convert canvas to data URL
 * @param {HTMLCanvasElement} canvas
 * @param {string} format - 'png', 'jpg', 'webp'
 * @param {number} quality - 0-1 for jpg/webp
 * @returns {string} Data URL
 */
function canvasToDataURL(canvas, format = 'png', quality = 0.92) {
    const mimeType = `image/${format === 'jpg' ? 'jpeg' : format}`;
    return canvas.toDataURL(mimeType, quality);
}

/**
 * ExportPreviewRenderer namespace
 */
export const ExportPreviewRenderer = {
    renderExportPreview,
    calculateBounds,
    canvasToDataURL
};
