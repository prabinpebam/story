import { store } from '../Store.js';
import { GeometryUtils } from './GeometryUtils.js';

/**
 * SnappingSystem - Handles element snapping to guides, other elements, and spacing
 */
export class SnappingSystem {
    constructor(canvasManager) {
        this.cm = canvasManager;
    }

    updateMeasurementGuides(mouseX, mouseY) {
        const state = store.getState();
        const { selectedElementIds, zoom, pan } = state.editor;
        
        // Only works if exactly one element is selected
        if (selectedElementIds.length !== 1) {
            this.cm.measurementGuides = null;
            return;
        }

        const selectedId = selectedElementIds[0];
        const slide = this.cm.getActiveContainer(state);
        const rawSelectedEl = slide.elements[selectedId];
        
        if (!rawSelectedEl) return;

        // Check if hovering over another element
        const hit = this.cm.hitTesting.hitTest(mouseX, mouseY);
        let rawTargetEl = null;

        if (hit && hit.type === 'element' && hit.id !== selectedId) {
            rawTargetEl = slide.elements[hit.id];
        }

        if (!rawTargetEl) {
            this.cm.measurementGuides = null;
            return;
        }

        // Use Absolute Coordinates for Measurement
        const selectedEl = GeometryUtils.getAbsoluteElement(rawSelectedEl, slide);
        const targetEl = GeometryUtils.getAbsoluteElement(rawTargetEl, slide);

        // Calculate distances between selectedEl and targetEl
        const r1 = {
            x: selectedEl.x,
            y: selectedEl.y,
            w: selectedEl.width,
            h: selectedEl.height,
            r: selectedEl.x + selectedEl.width,
            b: selectedEl.y + selectedEl.height
        };

        const r2 = {
            x: targetEl.x,
            y: targetEl.y,
            w: targetEl.width,
            h: targetEl.height,
            r: targetEl.x + targetEl.width,
            b: targetEl.y + targetEl.height
        };

        const guides = [];

        // Vertical Distance
        if (r1.b < r2.y) { // Selected is above Target
            const dist = Math.round(r2.y - r1.b);
            const x = r1.x + r1.w / 2;
            guides.push({
                type: 'line',
                x1: x, y1: r1.b,
                x2: x, y2: r2.y,
                label: `${dist}`,
                labelX: x + 5, labelY: r1.b + dist / 2
            });
        } else if (r1.y > r2.b) { // Selected is below Target
            const dist = Math.round(r1.y - r2.b);
            const x = r1.x + r1.w / 2;
            guides.push({
                type: 'line',
                x1: x, y1: r2.b,
                x2: x, y2: r1.y,
                label: `${dist}`,
                labelX: x + 5, labelY: r2.b + dist / 2
            });
        }

        // Horizontal Distance
        if (r1.r < r2.x) { // Selected is left of Target
            const dist = Math.round(r2.x - r1.r);
            const y = r1.y + r1.h / 2;
            guides.push({
                type: 'line',
                x1: r1.r, y1: y,
                x2: r2.x, y2: y,
                label: `${dist}`,
                labelX: r1.r + dist / 2, labelY: y - 5
            });
        } else if (r1.x > r2.r) { // Selected is right of Target
            const dist = Math.round(r1.x - r2.r);
            const y = r1.y + r1.h / 2;
            guides.push({
                type: 'line',
                x1: r2.r, y1: y,
                x2: r1.x, y2: y,
                label: `${dist}`,
                labelX: r2.r + dist / 2, labelY: y - 5
            });
        }
        
        this.cm.measurementGuides = guides;
    }

    checkSpacingGuides(id, x, y, width, height, zoom) {
        const state = store.getState();
        const slide = this.cm.getActiveContainer(state);
        const SNAP_THRESHOLD = 5 / zoom;
        
        let snappedX = x;
        let snappedY = y;
        const guides = [];

        // Get all other elements absolute
        const others = [];
        
        // 1. Current Container Elements
        Object.values(slide.elements).forEach(rawEl => {
            if (rawEl.id === id) return;
            others.push(GeometryUtils.getAbsoluteElement(rawEl, slide));
        });

        // 2. Inherited Elements (if editing a Layout)
        if (state.editor.mode === 'master' && slide.type === 'layout' && slide.parentId) {
            const master = state.masters[slide.parentId];
            if (master && master.elements) {
                Object.values(master.elements).forEach(rawEl => {
                    others.push(GeometryUtils.getAbsoluteElement(rawEl, master));
                });
            }
        }

        // Horizontal Spacing
        const sortedX = [...others].sort((a, b) => a.x - b.x);
        const myL = x;
        const myR = x + width;
        
        const yOverlap = (el) => {
            return !(el.y > y + height || el.y + el.height < y);
        };

        const candidatesX = sortedX.filter(yOverlap);
        
        let left = null;
        let right = null;
        
        for (const el of candidatesX) {
            if (el.x + el.width < myL) {
                left = el; 
            } else if (el.x > myR) {
                if (!right) right = el; 
            }
        }

        // Case 1: Equal spacing between Left and Right
        if (left && right) {
            const gapL = myL - (left.x + left.width);
            const gapR = right.x - myR;
            
            if (Math.abs(gapL - gapR) < SNAP_THRESHOLD) {
                const totalSpace = right.x - (left.x + left.width);
                const gap = (totalSpace - width) / 2;
                snappedX = (left.x + left.width) + gap;
                
                guides.push({ type: 'gap-x', x1: left.x + left.width, x2: snappedX, y: y + height/2, label: Math.round(gap) });
                guides.push({ type: 'gap-x', x1: snappedX + width, x2: right.x, y: y + height/2, label: Math.round(gap) });
            }
        }

        // Case 2: Equal spacing with Left's Left
        if (left) {
            const leftIndex = candidatesX.indexOf(left);
            if (leftIndex > 0) {
                const leftLeft = candidatesX[leftIndex - 1];
                const gapLL = left.x - (leftLeft.x + leftLeft.width);
                const currentGap = myL - (left.x + left.width);
                
                if (Math.abs(currentGap - gapLL) < SNAP_THRESHOLD) {
                    snappedX = (left.x + left.width) + gapLL;
                    guides.push({ type: 'gap-x', x1: leftLeft.x + leftLeft.width, x2: left.x, y: y + height/2, label: Math.round(gapLL) });
                    guides.push({ type: 'gap-x', x1: left.x + left.width, x2: snappedX, y: y + height/2, label: Math.round(gapLL) });
                }
            }
        }

        // Case 3: Equal spacing with Right's Right
        if (right) {
            const rightIndex = candidatesX.indexOf(right);
            if (rightIndex < candidatesX.length - 1) {
                const rightRight = candidatesX[rightIndex + 1];
                const gapRR = rightRight.x - (right.x + right.width);
                const currentGap = right.x - myR;
                
                if (Math.abs(currentGap - gapRR) < SNAP_THRESHOLD) {
                    snappedX = right.x - gapRR - width;
                    guides.push({ type: 'gap-x', x1: snappedX + width, x2: right.x, y: y + height/2, label: Math.round(gapRR) });
                    guides.push({ type: 'gap-x', x1: right.x + right.width, x2: rightRight.x, y: y + height/2, label: Math.round(gapRR) });
                }
            }
        }

        // Vertical Spacing
        const sortedY = [...others].sort((a, b) => a.y - b.y);
        const xOverlap = (el) => {
            return !(el.x > x + width || el.x + el.width < x);
        };
        const candidatesY = sortedY.filter(xOverlap);
        
        let top = null;
        let bottom = null;
        
        for (const el of candidatesY) {
            if (el.y + el.height < y) {
                top = el;
            } else if (el.y > y + height) {
                if (!bottom) bottom = el;
            }
        }

        if (top && bottom) {
            const gapT = y - (top.y + top.height);
            const gapB = bottom.y - (y + height);
            
            if (Math.abs(gapT - gapB) < SNAP_THRESHOLD) {
                const totalSpace = bottom.y - (top.y + top.height);
                const gap = (totalSpace - height) / 2;
                snappedY = (top.y + top.height) + gap;
                
                guides.push({ type: 'gap-y', y1: top.y + top.height, y2: snappedY, x: x + width/2, label: Math.round(gap) });
                guides.push({ type: 'gap-y', y1: snappedY + height, y2: bottom.y, x: x + width/2, label: Math.round(gap) });
            }
        }
        
        if (top) {
            const topIndex = candidatesY.indexOf(top);
            if (topIndex > 0) {
                const topTop = candidatesY[topIndex - 1];
                const gapTT = top.y - (topTop.y + topTop.height);
                const currentGap = y - (top.y + top.height);
                
                if (Math.abs(currentGap - gapTT) < SNAP_THRESHOLD) {
                    snappedY = (top.y + top.height) + gapTT;
                    guides.push({ type: 'gap-y', y1: topTop.y + topTop.height, y2: top.y, x: x + width/2, label: Math.round(gapTT) });
                    guides.push({ type: 'gap-y', y1: top.y + top.height, y2: snappedY, x: x + width/2, label: Math.round(gapTT) });
                }
            }
        }

        if (bottom) {
            const bottomIndex = candidatesY.indexOf(bottom);
            if (bottomIndex < candidatesY.length - 1) {
                const bottomBottom = candidatesY[bottomIndex + 1];
                const gapBB = bottomBottom.y - (bottom.y + bottom.height);
                const currentGap = bottom.y - (y + height);
                
                if (Math.abs(currentGap - gapBB) < SNAP_THRESHOLD) {
                    snappedY = bottom.y - gapBB - height;
                    guides.push({ type: 'gap-y', y1: snappedY + height, y2: bottom.y, x: x + width/2, label: Math.round(gapBB) });
                    guides.push({ type: 'gap-y', y1: bottom.y + bottom.height, y2: bottomBottom.y, x: x + width/2, label: Math.round(gapBB) });
                }
            }
        }

        return { x: snappedX, y: snappedY, guides };
    }

    snapToGuides(id, x, y, width, height, zoom) {
        const state = store.getState();
        const slide = this.cm.getActiveContainer(state);
        const SNAP_THRESHOLD = 5 / zoom;
        
        let snappedX = x;
        let snappedY = y;
        const guides = [];
        
        // Edges to check: Left, Center, Right, Top, Middle, Bottom
        const myEdges = {
            l: x, c: x + width / 2, r: x + width,
            t: y, m: y + height / 2, b: y + height
        };
        
        // Potential snap targets
        const targets = { x: [], y: [] };
        
        // Add Canvas Center & Borders
        targets.x.push({ value: slide.width / 2, type: 'center' });
        targets.x.push({ value: 0, type: 'left' });
        targets.x.push({ value: slide.width, type: 'right' });

        targets.y.push({ value: slide.height / 2, type: 'middle' });
        targets.y.push({ value: 0, type: 'top' });
        targets.y.push({ value: slide.height, type: 'bottom' });
        
        // Add other elements
        const addSnapTargets = (container) => {
            if (!container || !container.elements) return;
            
            Object.values(container.elements).forEach(rawEl => {
                if (rawEl.id === id) return;
                
                // Use absolute coordinates for snapping targets
                const el = GeometryUtils.getAbsoluteElement(rawEl, container);
                
                targets.x.push({ value: el.x, type: 'left' });
                targets.x.push({ value: el.x + el.width / 2, type: 'center' });
                targets.x.push({ value: el.x + el.width, type: 'right' });
                
                targets.y.push({ value: el.y, type: 'top' });
                targets.y.push({ value: el.y + el.height / 2, type: 'middle' });
                targets.y.push({ value: el.y + el.height, type: 'bottom' });
            });
        };

        // 1. Current Container Elements
        addSnapTargets(slide);

        // 2. Inherited Elements (if editing a Layout)
        if (state.editor.mode === 'master' && slide.type === 'layout' && slide.parentId) {
            const master = state.masters[slide.parentId];
            addSnapTargets(master);
        }
        
        // Check X Snaps
        let minDiffX = SNAP_THRESHOLD;
        
        // Check Left Edge
        targets.x.forEach(t => {
            if (Math.abs(t.value - myEdges.l) < minDiffX) {
                snappedX = t.value;
                minDiffX = Math.abs(t.value - myEdges.l);
                guides.push({ type: 'v', x: t.value });
            }
        });
        
        // Check Center
        targets.x.forEach(t => {
            if (Math.abs(t.value - myEdges.c) < minDiffX) {
                snappedX = t.value - width / 2;
                minDiffX = Math.abs(t.value - myEdges.c);
                guides.push({ type: 'v', x: t.value });
            }
        });
        
        // Check Right
        targets.x.forEach(t => {
            if (Math.abs(t.value - myEdges.r) < minDiffX) {
                snappedX = t.value - width;
                minDiffX = Math.abs(t.value - myEdges.r);
                guides.push({ type: 'v', x: t.value });
            }
        });
        
        // Check Y Snaps
        let minDiffY = SNAP_THRESHOLD;
        
        targets.y.forEach(t => {
            if (Math.abs(t.value - myEdges.t) < minDiffY) {
                snappedY = t.value;
                minDiffY = Math.abs(t.value - myEdges.t);
                guides.push({ type: 'h', y: t.value });
            }
        });
        
        targets.y.forEach(t => {
            if (Math.abs(t.value - myEdges.m) < minDiffY) {
                snappedY = t.value - height / 2;
                minDiffY = Math.abs(t.value - myEdges.m);
                guides.push({ type: 'h', y: t.value });
            }
        });
        
        targets.y.forEach(t => {
            if (Math.abs(t.value - myEdges.b) < minDiffY) {
                snappedY = t.value - height;
                minDiffY = Math.abs(t.value - myEdges.b);
                guides.push({ type: 'h', y: t.value });
            }
        });
        
        return { x: snappedX, y: snappedY, guides };
    }

    snapResize(id, handle, x, y, width, height, zoom) {
        const state = store.getState();
        const slide = this.cm.getActiveContainer(state);
        const SNAP_THRESHOLD = 5 / zoom;
        
        let snappedX = x;
        let snappedY = y;
        let snappedW = width;
        let snappedH = height;
        const guides = [];

        // Only snap if rotation is 0
        const el = slide.elements[id];
        if (el && el.rotation && el.rotation % 360 !== 0) {
             return { x, y, width, height, guides: [] };
        }

        const targets = { x: [], y: [] };
        
        targets.x.push({ value: slide.width / 2, type: 'center' });
        targets.x.push({ value: 0, type: 'left' });
        targets.x.push({ value: slide.width, type: 'right' });

        targets.y.push({ value: slide.height / 2, type: 'middle' });
        targets.y.push({ value: 0, type: 'top' });
        targets.y.push({ value: slide.height, type: 'bottom' });
        
        Object.values(slide.elements).forEach(rawEl => {
            if (rawEl.id === id) return;
            const el = GeometryUtils.getAbsoluteElement(rawEl, slide);
            targets.x.push({ value: el.x, type: 'left' });
            targets.x.push({ value: el.x + el.width / 2, type: 'center' });
            targets.x.push({ value: el.x + el.width, type: 'right' });
            targets.y.push({ value: el.y, type: 'top' });
            targets.y.push({ value: el.y + el.height / 2, type: 'middle' });
            targets.y.push({ value: el.y + el.height, type: 'bottom' });
        });

        let minDiffX = SNAP_THRESHOLD;
        let minDiffY = SNAP_THRESHOLD;

        // Horizontal Snapping (Width / X)
        if (handle.includes('w')) { // Left Edge
            targets.x.forEach(t => {
                if (Math.abs(t.value - x) < minDiffX) {
                    const diff = t.value - x;
                    snappedX = t.value;
                    snappedW = width - diff;
                    minDiffX = Math.abs(diff);
                    guides.push({ type: 'v', x: t.value });
                }
            });
        } else if (handle.includes('e')) { // Right Edge
            const right = x + width;
            targets.x.forEach(t => {
                if (Math.abs(t.value - right) < minDiffX) {
                    const diff = t.value - right;
                    snappedW = width + diff;
                    minDiffX = Math.abs(diff);
                    guides.push({ type: 'v', x: t.value });
                }
            });
        }

        // Vertical Snapping (Height / Y)
        if (handle.includes('n')) { // Top Edge
            targets.y.forEach(t => {
                if (Math.abs(t.value - y) < minDiffY) {
                    const diff = t.value - y;
                    snappedY = t.value;
                    snappedH = height - diff;
                    minDiffY = Math.abs(diff);
                    guides.push({ type: 'h', y: t.value });
                }
            });
        } else if (handle.includes('s')) { // Bottom Edge
            const bottom = y + height;
            targets.y.forEach(t => {
                if (Math.abs(t.value - bottom) < minDiffY) {
                    const diff = t.value - bottom;
                    snappedH = height + diff;
                    minDiffY = Math.abs(diff);
                    guides.push({ type: 'h', y: t.value });
                }
            });
        }

        return { x: snappedX, y: snappedY, width: snappedW, height: snappedH, guides };
    }
}
