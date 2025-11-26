import { store } from '../Store.js';

/**
 * GeometryUtils - Utility functions for geometry calculations
 */
export const GeometryUtils = {
    /**
     * Get absolute coordinates for an element, accounting for parent hierarchy
     */
    getAbsoluteElement(el, slide) {
        let x = el.x;
        let y = el.y;
        let rotation = el.rotation || 0;
        let parentId = el.parentId;

        while (parentId) {
            const parent = slide.elements[parentId];
            if (!parent) break;
            
            x += parent.x;
            y += parent.y;
            rotation += (parent.rotation || 0);
            
            parentId = parent.parentId;
        }
        
        return { ...el, x, y, rotation };
    },

    /**
     * Get the corners of an element, accounting for rotation
     */
    getElementCorners(el) {
        const { x, y, width, height, rotation } = el;
        const cx = x + width / 2;
        const cy = y + height / 2;
        const rad = (rotation || 0) * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        
        const p = [
            { x: -width/2, y: -height/2 },
            { x: width/2, y: -height/2 },
            { x: width/2, y: height/2 },
            { x: -width/2, y: height/2 }
        ];
        
        return p.map(pt => ({
            x: cx + (pt.x * cos - pt.y * sin),
            y: cy + (pt.x * sin + pt.y * cos)
        }));
    },

    /**
     * Get the bounding box of multiple selected elements
     */
    getSelectionBounds(slide, selectedIds, getAbsoluteElementFn) {
        if (selectedIds.length === 0) return null;
        
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        selectedIds.forEach(id => {
            const el = slide.elements[id];
            if (!el) return;
            const absEl = getAbsoluteElementFn(el, slide);
            
            // For rotated elements, the bounding box is larger
            const corners = GeometryUtils.getElementCorners(absEl);
            corners.forEach(p => {
                minX = Math.min(minX, p.x);
                minY = Math.min(minY, p.y);
                maxX = Math.max(maxX, p.x);
                maxY = Math.max(maxY, p.y);
            });
        });
        
        if (minX === Infinity) return null;
        
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
            rotation: 0 // Multi-selection box is always axis-aligned
        };
    },

    /**
     * Check if a point is inside an element (accounting for rotation)
     */
    pointInElement(wx, wy, el) {
        const { x, y, width, height, rotation } = el;
        
        const cx = x + width / 2;
        const cy = y + height / 2;
        
        const rad = -(rotation || 0) * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        
        const dx = wx - cx;
        const dy = wy - cy;
        
        const localX = (dx * cos - dy * sin) + width / 2;
        const localY = (dx * sin + dy * cos) + height / 2;

        return localX >= 0 && localX <= width && localY >= 0 && localY <= height;
    }
};
