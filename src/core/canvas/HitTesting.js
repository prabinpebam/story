import { store } from '../Store.js';
import { GeometryUtils } from './GeometryUtils.js';

/**
 * HitTesting - Handles hit detection for elements and handles
 */
export class HitTesting {
    constructor(canvasManager) {
        this.cm = canvasManager;
    }

    _pointToSegmentDistance(px, py, ax, ay, bx, by) {
        const abx = bx - ax;
        const aby = by - ay;
        const apx = px - ax;
        const apy = py - ay;
        const abLen2 = abx * abx + aby * aby;
        if (abLen2 <= 0) {
            const dx = px - ax;
            const dy = py - ay;
            return { distance: Math.sqrt(dx * dx + dy * dy), t: 0 };
        }
        let t = (apx * abx + apy * aby) / abLen2;
        if (t < 0) t = 0;
        if (t > 1) t = 1;
        const cx = ax + t * abx;
        const cy = ay + t * aby;
        const dx = px - cx;
        const dy = py - cy;
        return { distance: Math.sqrt(dx * dx + dy * dy), t };
    }

    _toElementLocalPoint(wx, wy, absEl) {
        const { x, y, width, height, rotation } = absEl;
        const cx = x + width / 2;
        const cy = y + height / 2;

        const rad = -(rotation || 0) * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        const dx = wx - cx;
        const dy = wy - cy;

        const localX = (dx * cos - dy * sin) + width / 2;
        const localY = (dx * sin + dy * cos) + height / 2;

        return { x: localX, y: localY };
    }

    _hitTestVectorNodes(state, slide, worldX, worldY) {
        const deepEdit = state?.editor?.deepEdit;
        if (!deepEdit || deepEdit.kind !== 'vector') return null;

        const elementId = deepEdit.elementId;
        if (!elementId) return null;

        const el = slide?.elements?.[elementId];
        if (!el || el.type !== 'vector' || !Array.isArray(el.paths)) return null;

        const { zoom } = state.editor;
        const absEl = GeometryUtils.getAbsoluteElement(el, slide);
        const local = this._toElementLocalPoint(worldX, worldY, absEl);

        const threshold = 6 / zoom;
        const candidates = [];

        el.paths.forEach((path, pathIndex) => {
            if (!path) return;

            const points = [];
            if (path.start) {
                points.push({ nodeKind: 'start', nodeIndex: 0, pt: path.start });
            }
            if (Array.isArray(path.segments)) {
                path.segments.forEach((seg, segIndex) => {
                    if (seg && seg.to) {
                        points.push({ nodeKind: 'segment', nodeIndex: segIndex + 1, segmentIndex: segIndex, pt: seg.to });
                    }
                });
            }

            for (const p of points) {
                const dx = local.x - Number(p.pt.x);
                const dy = local.y - Number(p.pt.y);
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= threshold) {
                    candidates.push({
                        priorityRank: 0,
                        distance: dist,
                        zOrder: Number.POSITIVE_INFINITY,
                        hitKey: `vector:${elementId}:path:${pathIndex}:node:${p.nodeKind}:${p.nodeIndex}`,
                        result: {
                            type: 'vector-node',
                            elementId,
                            pathIndex,
                            nodeKind: p.nodeKind,
                            nodeIndex: p.nodeIndex,
                            segmentIndex: p.segmentIndex
                        }
                    });
                }
            }
        });

        const best = HitTesting.chooseBestHitCandidate(candidates);
        return best ? best.result : null;
    }

    _hitTestVectorHandles(state, slide, worldX, worldY) {
        const deepEdit = state?.editor?.deepEdit;
        if (!deepEdit || deepEdit.kind !== 'vector') return null;

        const elementId = deepEdit.elementId;
        if (!elementId) return null;

        const el = slide?.elements?.[elementId];
        if (!el || el.type !== 'vector' || !Array.isArray(el.paths)) return null;

        const { zoom } = state.editor;
        const absEl = GeometryUtils.getAbsoluteElement(el, slide);
        const local = this._toElementLocalPoint(worldX, worldY, absEl);

        const threshold = 6 / zoom;
        const candidates = [];

        el.paths.forEach((path, pathIndex) => {
            if (!path || !path.start || !Array.isArray(path.segments)) return;

            for (let segIndex = 0; segIndex < path.segments.length; segIndex++) {
                const seg = path.segments[segIndex];
                if (!seg || seg.kind !== 'cubic') continue;

                const addHandle = (control, pt, handleId) => {
                    if (!pt) return;
                    const dx = local.x - Number(pt.x);
                    const dy = local.y - Number(pt.y);
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist <= threshold) {
                        candidates.push({
                            priorityRank: 0,
                            distance: dist,
                            zOrder: Number.POSITIVE_INFINITY,
                            hitKey: `vector:${elementId}:path:${pathIndex}:handle:${handleId}`,
                            result: {
                                type: 'vector-handle',
                                elementId,
                                pathIndex,
                                segmentIndex: segIndex,
                                control,
                                handleId
                            }
                        });
                    }
                };

                const prevNodeId = segIndex === 0 ? `p${pathIndex}:start` : `p${pathIndex}:s${segIndex}`;
                const endNodeId = `p${pathIndex}:s${segIndex + 1}`;

                addHandle('c1', seg.c1, `${prevNodeId}:out`);
                addHandle('c2', seg.c2, `${endNodeId}:in`);
            }
        });

        const best = HitTesting.chooseBestHitCandidate(candidates);
        return best ? best.result : null;
    }

    _hitTestVectorEdges(state, slide, worldX, worldY) {
        const deepEdit = state?.editor?.deepEdit;
        if (!deepEdit || deepEdit.kind !== 'vector') return null;

        const elementId = deepEdit.elementId;
        if (!elementId) return null;

        const el = slide?.elements?.[elementId];
        if (!el || el.type !== 'vector' || !Array.isArray(el.paths)) return null;

        const { zoom } = state.editor;
        const absEl = GeometryUtils.getAbsoluteElement(el, slide);
        const local = this._toElementLocalPoint(worldX, worldY, absEl);

        const threshold = 6 / zoom;
        const candidates = [];

        el.paths.forEach((path, pathIndex) => {
            if (!path || !path.start || !Array.isArray(path.segments)) return;

            let prev = { x: Number(path.start.x), y: Number(path.start.y) };
            for (let segIndex = 0; segIndex < path.segments.length; segIndex++) {
                const seg = path.segments[segIndex];
                if (!seg || !seg.to) {
                    continue;
                }
                const next = { x: Number(seg.to.x), y: Number(seg.to.y) };

                // v1: edge hit testing supports line segments (cubic can be added later).
                if (seg.kind === 'line') {
                    const { distance, t } = this._pointToSegmentDistance(local.x, local.y, prev.x, prev.y, next.x, next.y);
                    if (distance <= threshold) {
                        candidates.push({
                            priorityRank: 1,
                            distance,
                            zOrder: Number.POSITIVE_INFINITY,
                            hitKey: `vector:${elementId}:path:${pathIndex}:edge:${segIndex}`,
                            result: {
                                type: 'vector-edge',
                                elementId,
                                pathIndex,
                                segmentIndex: segIndex,
                                t
                            }
                        });
                    }
                }

                prev = next;
            }
        });

        const best = HitTesting.chooseBestHitCandidate(candidates);
        return best ? best.result : null;
    }

    static chooseBestHitCandidate(candidates) {
        if (!candidates || candidates.length === 0) return null;

        let best = null;
        for (const candidate of candidates) {
            if (!best) {
                best = candidate;
                continue;
            }

            const priorityA = candidate.priorityRank ?? Number.POSITIVE_INFINITY;
            const priorityB = best.priorityRank ?? Number.POSITIVE_INFINITY;
            if (priorityA !== priorityB) {
                if (priorityA < priorityB) best = candidate;
                continue;
            }

            const distanceA = candidate.distance ?? Number.POSITIVE_INFINITY;
            const distanceB = best.distance ?? Number.POSITIVE_INFINITY;
            if (distanceA !== distanceB) {
                if (distanceA < distanceB) best = candidate;
                continue;
            }

            const zOrderA = candidate.zOrder ?? Number.NEGATIVE_INFINITY;
            const zOrderB = best.zOrder ?? Number.NEGATIVE_INFINITY;
            if (zOrderA !== zOrderB) {
                if (zOrderA > zOrderB) best = candidate;
                continue;
            }

            const hitKeyA = candidate.hitKey ?? '';
            const hitKeyB = best.hitKey ?? '';
            if (hitKeyA && hitKeyB && hitKeyA !== hitKeyB) {
                if (hitKeyA.localeCompare(hitKeyB) < 0) best = candidate;
            }
        }

        return best;
    }

    _getElementsWithZOrder(state, slide) {
        let elements = [];

        if (state.editor.mode === 'master') {
            // Master mode: Check effective elements (includes inherited + local)
            const effectiveSlide = this.cm.canvasManager?.currentRenderer?.getEffectiveSlideData?.(slide.id, 'master') || slide;
            if (effectiveSlide.effectiveElements && effectiveSlide.effectiveOrder) {
                elements = effectiveSlide.effectiveOrder
                    .map((id, index) => ({ element: effectiveSlide.effectiveElements[id], zOrder: index }))
                    .filter(e => e.element);
            } else {
                elements = (slide.elementOrder || [])
                    .map((id, index) => ({ element: slide.elements[id], zOrder: index }))
                    .filter(e => e.element);
            }
        } else if (state.editor.mode === 'edit') {
            // Edit Mode: Check effective elements (including placeholders)
            const effectiveSlide = store.getEffectiveSlide(slide.id);
            if (effectiveSlide) {
                elements = (effectiveSlide.effectiveOrder || [])
                    .map((id, index) => ({ element: effectiveSlide.effectiveElements[id], zOrder: index }))
                    .filter(e => e.element);
            } else {
                elements = (slide.elementOrder || [])
                    .map((id, index) => ({ element: slide.elements[id], zOrder: index }))
                    .filter(e => e.element);
            }
        } else {
            elements = (slide.elementOrder || [])
                .map((id, index) => ({ element: slide.elements[id], zOrder: index }))
                .filter(e => e.element);
        }

        return elements;
    }

    hitTest(x, y) {
        const state = store.getState();
        const { zoom, pan } = state.editor;
        
        // Convert screen to world
        const worldX = (x - pan.x) / zoom;
        const worldY = (y - pan.y) / zoom;

        const slide = this.cm.getActiveContainer(state);
        if (!slide) return null;

        // In composition drill-in, allow hit testing hidden boolean operands.
        const deepEdit = state?.editor?.deepEdit;
        let allowHiddenIds = null;
        if (deepEdit?.kind === 'boolean' && deepEdit?.mode === 'operands' && deepEdit?.elementId) {
            const effectiveSlide = store.getEffectiveSlide(slide.id) || slide;
            const elements = effectiveSlide.effectiveElements || effectiveSlide.elements || {};
            const booleanEl = elements[deepEdit.elementId];
            const operands = Array.isArray(booleanEl?.operands) ? booleanEl.operands : [];
            allowHiddenIds = new Set(operands);
        }

        // In composition drill-in, allow hit testing hidden mask shape.
        if (!allowHiddenIds && deepEdit?.kind === 'mask' && deepEdit?.mode === 'shape' && deepEdit?.elementId) {
            const effectiveSlide = store.getEffectiveSlide(slide.id) || slide;
            const elements = effectiveSlide.effectiveElements || effectiveSlide.elements || {};
            const maskEl = elements[deepEdit.elementId];
            const maskShapeId = maskEl?.maskShapeId;
            if (typeof maskShapeId === 'string') {
                allowHiddenIds = new Set([maskShapeId]);
            }
        }

        // Deep edit hit testing takes priority.
        const deepHandleHit = this._hitTestVectorHandles(state, slide, worldX, worldY);
        if (deepHandleHit) return deepHandleHit;

        const deepNodeHit = this._hitTestVectorNodes(state, slide, worldX, worldY);
        if (deepNodeHit) return deepNodeHit;

        const deepEdgeHit = this._hitTestVectorEdges(state, slide, worldX, worldY);
        if (deepEdgeHit) return deepEdgeHit;

        // Check handles first (if selected)
        if (state.editor.selectedElementIds.length > 0) {
            const handleHit = this.hitTestHandles(x, y);
            if (handleHit) return handleHit;
        }

        const elementsWithZ = this._getElementsWithZOrder(state, slide);
        const candidates = [];

        for (const { element, zOrder } of elementsWithZ) {
            if (!element) continue;

            // Hidden elements are not selectable unless explicitly revealed via deep edit.
            if (element.hidden && !(allowHiddenIds && allowHiddenIds.has(element.id))) continue;
            if (!GeometryUtils.pointInElement(worldX, worldY, element)) continue;

            // Current object-mode baseline: treat as fill hit with distance 0.
            // In the future, stroke/point/edge candidates can be added with real distance.
            const isInherited = !Object.prototype.hasOwnProperty.call(slide.elements, element.id);
            candidates.push({
                priorityRank: 2,
                distance: 0,
                zOrder,
                hitKey: `fill:layer:${element.id}:fill-0`,
                result: { type: 'element', id: element.id, isInherited, element }
            });
        }

        const best = HitTesting.chooseBestHitCandidate(candidates);
        return best ? best.result : null;
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
        const isInsideElementBounds = localX >= 0 && localX <= width && localY >= 0 && localY <= height;
        const corners = ['nw', 'ne', 'se', 'sw'];
        for (const key of corners) {
            const h = handles[key];
            const dist = Math.sqrt(Math.pow(localX - h.x, 2) + Math.pow(localY - h.y, 2));
            // Only trigger rotation if we're outside the resize handle area but within rotation threshold
            if (!isInsideElementBounds && dist > hitThreshold && dist <= rotationThreshold) {
                return { handle: key, action: 'rotate' };
            }
        }

        return null;
    }
}
