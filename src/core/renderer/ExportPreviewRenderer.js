import { getShapeKind } from '../shapes/ShapeElementAdapter.js';
/**
 * ExportPreviewRenderer
 * 
 * Generates preview images for element export.
 * Renders selected elements to a canvas for preview in the Export section.
 * Uses direct canvas drawing for accurate visual representation.
 * 
 * Performance target: < 300ms render time
 */

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

        const createPlaceholderCanvas = () => {
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
        };
        
        // Expected transient states (e.g., selection/resize) can produce empty sets.
        // Avoid throwing/logging for these: just show the placeholder.
        if (!elements || elements.length === 0) {
            return createPlaceholderCanvas();
        }
        
        // Calculate bounding box of all elements
        const bounds = calculateBounds(elements);
        
        // Expected transient state: elements exist but are not yet fully laid out.
        if (bounds.width === 0 || bounds.height === 0) {
            return createPlaceholderCanvas();
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
        
        // Create canvas and draw elements directly (no DOM rendering)
        // Create canvas
        const canvas = document.createElement('canvas');
            canvas.width = Math.round(previewWidth);
            canvas.height = Math.round(previewHeight);
            
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw elements directly to canvas (same as export)
            const scaleX = previewWidth / actualWidth;
            const scaleY = previewHeight / actualHeight;
            const finalScale = Math.min(scaleX, scaleY);
            
            // Center the content if it doesn't fill the canvas
            const offsetX = (previewWidth - (actualWidth * finalScale)) / 2;
            const offsetY = (previewHeight - (actualHeight * finalScale)) / 2;
            
            for (const element of elements) {
                const x = ((element.x - bounds.x) * scale * finalScale) + offsetX;
                const y = ((element.y - bounds.y) * scale * finalScale) + offsetY;
                const w = element.width * scale * finalScale;
                const h = element.height * scale * finalScale;
                
                ctx.save();
                
                // Apply rotation / flip around center if present
                const rot = Number(element.rotation) || 0;
                const sx = element.flipX ? -1 : 1;
                const sy = element.flipY ? -1 : 1;
                if (rot || sx !== 1 || sy !== 1) {
                    const centerX = x + w / 2;
                    const centerY = y + h / 2;
                    ctx.translate(centerX, centerY);
                    if (rot) {
                        ctx.rotate((rot * Math.PI) / 180);
                    }
                    if (sx !== 1 || sy !== 1) {
                        ctx.scale(sx, sy);
                    }
                    ctx.translate(-centerX, -centerY);
                }
                
                // Draw based on element type
                await drawElementToCanvas(ctx, element, x, y, w, h);
                
                ctx.restore();
            }
            
            return canvas;
            
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
 * Draw element to canvas (shared logic for preview rendering)
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} element
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 */
async function drawElementToCanvas(ctx, element, x, y, w, h) {
    const shapeKind = getShapeKind(element);

    if (shapeKind === 'rectangle') {
        drawRectangle(ctx, element, x, y, w, h);
    } else if (shapeKind === 'ellipse') {
        drawEllipse(ctx, element, x, y, w, h);
    } else if (element.type === 'text') {
        await drawText(ctx, element, x, y, w, h);
    } else if (element.type === 'image') {
        await drawImage(ctx, element, x, y, w, h);
    } else {
        // Unknown type - draw placeholder
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#ccc';
        ctx.strokeRect(x, y, w, h);
    }
}

/**
 * Draw rectangle to canvas
 */
function drawRectangle(ctx, element, x, y, w, h) {
    const fill = element.style?.fills?.[0]?.value 
        || element.style?.fills?.[0]?.color 
        || element.style?.backgroundColor 
        || element.fill 
        || '#D9D9D9';
    
    const borderRadius = element.borderRadius || element.style?.radius || 0;
    
    ctx.fillStyle = fill;
    
    if (borderRadius > 0) {
        const radius = Math.min(borderRadius, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + w - radius, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
        ctx.lineTo(x + w, y + h - radius);
        ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        ctx.lineTo(x + radius, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
    } else {
        ctx.fillRect(x, y, w, h);
    }
}

/**
 * Draw ellipse to canvas
 */
function drawEllipse(ctx, element, x, y, w, h) {
    const fill = element.style?.fills?.[0]?.value 
        || element.style?.fills?.[0]?.color 
        || element.style?.backgroundColor 
        || element.fill 
        || '#D9D9D9';
    
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 2 * Math.PI);
    ctx.fill();
}

/**
 * Draw text to canvas
 */
async function drawText(ctx, element, x, y, w, h) {
    const fontSize = element.fontSize || element.style?.fontSize || 16;
    const fontFamily = element.fontFamily || element.style?.fontFamily || 'Inter';
    const color = element.color || element.style?.color || '#000000';
    const textAlign = element.textAlign || element.style?.textAlign || 'left';
    const verticalAlign = element.verticalAlign || element.style?.verticalAlign || 'top';
    const content = element.content || element.text || '';
    
    ctx.fillStyle = color;
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textAlign = textAlign;
    ctx.textBaseline = verticalAlign === 'middle' ? 'middle' : 'top';
    
    const textX = textAlign === 'center' ? x + w / 2 : textAlign === 'right' ? x + w : x;
    const textY = verticalAlign === 'middle' ? y + h / 2 : y;
    
    ctx.fillText(content, textX, textY);
}

/**
 * Draw image to canvas
 */
async function drawImage(ctx, element, x, y, w, h) {
    if (!element.src) return;
    
    try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = () => resolve(); // Continue even if image fails
            img.src = element.src;
            setTimeout(() => resolve(), 2000); // Timeout for preview
        });
        
        if (img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, x, y, w, h);
        } else {
            // Draw placeholder
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = '#ccc';
            ctx.strokeRect(x, y, w, h);
        }
    } catch (error) {
        // Draw placeholder on error
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(x, y, w, h);
    }
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
