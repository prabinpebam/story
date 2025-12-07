import { store } from '../Store.js';
import { GeometryUtils } from './GeometryUtils.js';

/**
 * HitTesting - Handles hit detection for elements and handles
 */
export class HitTesting {
    constructor(canvasManager) {
        this.cm = canvasManager;
    }

    hitTest(x, y) {
        const state = store.getState();
        const { zoom, pan } = state.editor;
        
        // Convert screen to world
        const worldX = (x - pan.x) / zoom;
        const worldY = (y - pan.y) / zoom;

        // Check handles first (if selected)
        if (state.editor.selectedElementIds.length > 0) {
            const handleHit = this.hitTestHandles(x, y);
            if (handleHit) return handleHit;
        }

        const slide = this.cm.getActiveContainer(state);
        if (!slide) return null;

        // Reverse order (top to bottom)
        let elementsToCheck = [];
        if (state.editor.mode === 'master') {
             // Master mode: Check effective elements (includes inherited + local)
             const effectiveSlide = this.cm.canvasManager?.currentRenderer?.getEffectiveSlideData?.(slide.id, 'master') || slide;
             if (effectiveSlide.effectiveElements && effectiveSlide.effectiveOrder) {
                 elementsToCheck = effectiveSlide.effectiveOrder.map(id => effectiveSlide.effectiveElements[id]).filter(e => e);
             } else {
                 elementsToCheck = (slide.elementOrder || []).map(id => slide.elements[id]).filter(e => e);
             }
        } else if (state.editor.mode === 'edit') {
             // Edit Mode: Check effective elements (including placeholders)
             const effectiveSlide = store.getEffectiveSlide(slide.id);
             if (effectiveSlide) {
                 elementsToCheck = (effectiveSlide.effectiveOrder || []).map(id => effectiveSlide.effectiveElements[id]).filter(e => e);
             } else {
                 elementsToCheck = (slide.elementOrder || []).map(id => slide.elements[id]).filter(e => e);
             }
        } else {
             elementsToCheck = (slide.elementOrder || []).map(id => slide.elements[id]).filter(e => e);
        }
        
        for (let i = elementsToCheck.length - 1; i >= 0; i--) {
            const el = elementsToCheck[i];
            if (GeometryUtils.pointInElement(worldX, worldY, el)) {
                // Check if it's inherited
                const isInherited = !Object.prototype.hasOwnProperty.call(slide.elements, el.id);
                return { type: 'element', id: el.id, isInherited, element: el };
            }
        }

        return null;
    }

    hitTestHandles(x, y) {
        const state = store.getState();
        const { zoom, pan } = state.editor;
        
        // Convert screen (x,y) to world space
        const worldX = (x - pan.x) / zoom;
        const worldY = (y - pan.y) / zoom;

        const slide = this.cm.getActiveContainer(state);
        if (!slide) return null;

        // 1. Check Handles
        if (state.editor.selectedElementIds.length === 1) {
            const id = state.editor.selectedElementIds[0];
            const el = slide.elements[id];
            if (el) {
                const absEl = GeometryUtils.getAbsoluteElement(el, slide);
                const result = this.checkHandlesV2(worldX, worldY, absEl, zoom);
                if (result) {
                    return { type: 'handle', id, ...result };
                }
            }
        } else if (state.editor.selectedElementIds.length > 1) {
            const bounds = GeometryUtils.getSelectionBounds(
                slide, 
                state.editor.selectedElementIds,
                GeometryUtils.getAbsoluteElement
            );
            if (bounds) {
                // Multi-selection only supports resize for now
                const result = this.checkHandlesV2(worldX, worldY, bounds, zoom);
                if (result && result.action === 'resize') {
                    return { type: 'handle', id: 'multi-selection', ...result };
                }
            }
        }

        return null;
    }

    checkHandlesV2(wx, wy, el, zoom) {
        const { x, y, width, height, rotation } = el;
        const handleSize = 8 / zoom;
        const hitThreshold = handleSize / 2;
        const rotationThreshold = 20 / zoom; // Distance outside corner to trigger rotation
        const radiusHandleOffset = 12 / zoom;
        const radiusHandleSize = 8 / zoom;

        // Transform point to local unrotated space relative to element center
        const cx = x + width / 2;
        const cy = y + height / 2;
        
        const rad = -(rotation || 0) * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        
        const dx = wx - cx;
        const dy = wy - cy;
        
        const localX = (dx * cos - dy * sin) + width / 2; 
        const localY = (dx * sin + dy * cos) + height / 2;

        // 1. Check Resize Handles
        const handles = {
            'nw': { x: 0, y: 0 },
            'n':  { x: width / 2, y: 0 },
            'ne': { x: width, y: 0 },
            'e':  { x: width, y: height / 2 },
            'se': { x: width, y: height },
            's':  { x: width / 2, y: height },
            'sw': { x: 0, y: height },
            'w':  { x: 0, y: height / 2 }
        };

        for (const [key, h] of Object.entries(handles)) {
            if (Math.abs(localX - h.x) <= hitThreshold && Math.abs(localY - h.y) <= hitThreshold) {
                return { handle: key, action: 'resize' };
            }
        }

        // 2. Check Corner Radius Handles (Inner)
        if (width > radiusHandleOffset * 3 && height > radiusHandleOffset * 3) {
             const rHandles = [
                { x: radiusHandleOffset, y: radiusHandleOffset, id: 'nw' },
                { x: width - radiusHandleOffset, y: radiusHandleOffset, id: 'ne' },
                { x: width - radiusHandleOffset, y: height - radiusHandleOffset, id: 'se' },
                { x: radiusHandleOffset, y: height - radiusHandleOffset, id: 'sw' }
            ];
            for (const h of rHandles) {
                if (Math.abs(localX - h.x) <= radiusHandleSize/2 && Math.abs(localY - h.y) <= radiusHandleSize/2) {
                    return { handle: `radius-${h.id}`, action: 'radius' };
                }
            }
        }

        // 3. Check Rotation (Outside Corners)
        // Rotation trigger zone is OUTSIDE the resize handle but within rotationThreshold
        const corners = ['nw', 'ne', 'se', 'sw'];
        for (const key of corners) {
            const h = handles[key];
            const dist = Math.sqrt(Math.pow(localX - h.x, 2) + Math.pow(localY - h.y, 2));
            // Only trigger rotation if we're outside the resize handle area but within rotation threshold
            if (dist > hitThreshold && dist <= rotationThreshold) {
                return { handle: key, action: 'rotate' };
            }
        }

        return null;
    }
}
