import { store } from '../Store.js';
import { GeometryUtils } from './GeometryUtils.js';

/**
 * GizmoRenderer - Handles rendering of selection boxes, guides, and overlays
 * 
 * Uses CSS variables from the design system for theming support:
 * - --color-accent: Selection and hover outlines
 * - --color-selection-fill: Selection marquee fill
 */
export class GizmoRenderer {
    constructor(canvasManager) {
        this.cm = canvasManager;
        
        // Cache for CSS variable colors (updated on render)
        this._cachedColors = null;
        this._lastColorCheck = 0;
    }
    
    /**
     * Get colors from CSS variables for canvas rendering
     * Caches the result for performance, refreshes every 100ms
     */
    getColors() {
        const now = Date.now();
        if (!this._cachedColors || now - this._lastColorCheck > 100) {
            const style = getComputedStyle(document.documentElement);
            this._cachedColors = {
                accent: style.getPropertyValue('--color-accent').trim() || '#18A0FB',
                selectionFill: style.getPropertyValue('--color-selection-fill').trim() || 'rgba(24, 160, 251, 0.3)',
                // Parse accent color to create transparent versions
                accentRgba10: this._colorToRgba(style.getPropertyValue('--color-accent').trim() || '#18A0FB', 0.1),
                accentRgba80: this._colorToRgba(style.getPropertyValue('--color-accent').trim() || '#18A0FB', 0.8),
            };
            this._lastColorCheck = now;
        }
        return this._cachedColors;
    }
    
    /**
     * Convert a hex color to rgba with specified alpha
     */
    _colorToRgba(color, alpha) {
        // Handle hex colors
        if (color.startsWith('#')) {
            const hex = color.substring(1);
            let r, g, b;
            if (hex.length === 3) {
                r = parseInt(hex[0] + hex[0], 16);
                g = parseInt(hex[1] + hex[1], 16);
                b = parseInt(hex[2] + hex[2], 16);
            } else {
                r = parseInt(hex.substring(0, 2), 16);
                g = parseInt(hex.substring(2, 4), 16);
                b = parseInt(hex.substring(4, 6), 16);
            }
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        // Handle rgb/rgba
        if (color.startsWith('rgb')) {
            const match = color.match(/\d+/g);
            if (match) {
                return `rgba(${match[0]}, ${match[1]}, ${match[2]}, ${alpha})`;
            }
        }
        // Fallback
        return `rgba(24, 160, 251, ${alpha})`;
    }

    render() {
        const state = store.getState();
        // Only check state mode. The class check causes race conditions because 
        // PresentationManager removes the class in a separate listener that might run after this.
        if (state.editor.mode === 'presentation') {
            this.cm.isRendering = false;
            // Ensure canvas is clear when in presentation mode
            this.cm.ctx.clearRect(0, 0, this.cm.canvas.width, this.cm.canvas.height);
            return;
        }
        this.cm.isRendering = true;

        // Clear interaction canvas
        this.cm.ctx.clearRect(0, 0, this.cm.canvas.width, this.cm.canvas.height);
        
        // Draw placeholder overlays (dashed borders) in master mode
        // This draws BEFORE gizmos so selection is on top
        if (state.editor.mode === 'master') {
            this.renderPlaceholderOverlays();
        }
        
        // Draw Gizmos, Selection Box, Grid here
        this.renderGizmos();
        
        // Draw Hover Effect
        if (this.cm.hoveredElementId && this.cm.interactionState === 'IDLE' && (!state.ui || !state.ui.isInteracting)) {
             const { zoom, pan } = state.editor;
             const slide = this.cm.getActiveContainer(state);
             // Don't draw hover if already selected
             if (slide && !state.editor.selectedElementIds.includes(this.cm.hoveredElementId)) {
                 const el = slide.elements[this.cm.hoveredElementId];
                 if (el) {
                     this.cm.ctx.save();
                     this.cm.ctx.translate(pan.x, pan.y);
                     this.cm.ctx.scale(zoom, zoom);
                     const absEl = GeometryUtils.getAbsoluteElement(el, slide);
                     this.drawHoverOutline(absEl, zoom);
                     this.cm.ctx.restore();
                 }
             }
        }

        // Draw Guides
        this.renderGuides();

        // Draw Measurement Guides
        this.renderMeasurementGuides();
        
        // Draw Creation Ghost
        if (this.cm.interactionState === 'CREATING' && this.cm.dragStart && this.cm.dragCurrent) {
            this.renderCreationGhost();
        }

        // Draw Selection Marquee
        if (this.cm.interactionState === 'SELECTING' && this.cm.dragStart && this.cm.dragCurrent) {
            this.renderSelectionMarquee();
        }

        requestAnimationFrame(() => this.render());
    }

    renderGizmos() {
        const state = store.getState();

        const { selectedElementIds, zoom, pan } = state.editor;
        const slide = this.cm.getActiveContainer(state);

        if (!slide || selectedElementIds.length === 0) return;

        this.cm.ctx.save();
        // Apply Viewport Transform to Canvas Context so we draw in World Space
        this.cm.ctx.translate(pan.x, pan.y);
        this.cm.ctx.scale(zoom, zoom);

        if (selectedElementIds.length === 1) {
            const id = selectedElementIds[0];
            const isEditing = state.editor.editingElementId === id;
            
            const el = slide.elements[id];
            if (el) {
                let absEl = GeometryUtils.getAbsoluteElement(el, slide);
                
                // Use live dimensions during editing for real-time bounding box updates
                if (isEditing && this.cm.liveResizeData && this.cm.liveResizeData.id === id) {
                    absEl = {
                        ...absEl,
                        width: this.cm.liveResizeData.width,
                        height: this.cm.liveResizeData.height,
                        x: this.cm.liveResizeData.x !== undefined ? this.cm.liveResizeData.x : absEl.x,
                        y: this.cm.liveResizeData.y !== undefined ? this.cm.liveResizeData.y : absEl.y
                    };
                }
                
                const isText = el.type === 'text';
                const isResizing = this.cm.interactionState === 'RESIZING';
                const isDragging = this.cm.interactionState === 'DRAGGING';
                const isUIInteracting = state.ui?.isInteracting === true;
                
                // DEBUG: Log state when scrubbing
                if (isUIInteracting && !this._debugLogged) {
                    console.log('[GizmoRenderer DEBUG]', {
                        isUIInteracting,
                        isText,
                        elementType: el.type,
                        interactionState: this.cm.interactionState,
                        'state.ui': state.ui
                    });
                    this._debugLogged = true;
                } else if (!isUIInteracting) {
                    this._debugLogged = false;
                }
                
                // Hide selection overlay during ANY PROPERTY CHANGES to non-text elements
                // This includes: Property Inspector interactions, canvas dragging, canvas resizing
                // Exception: Text elements always keep their selection visible for layout feedback
                const isPropertyChanging = isUIInteracting || isDragging || isResizing;
                const hideSelection = isPropertyChanging && !isText;
                
                // DEBUG: Log when hiding
                if (hideSelection && !this._hideLogged) {
                    console.log('[GizmoRenderer] HIDING SELECTION');
                    this._hideLogged = true;
                } else if (!hideSelection && this._hideLogged) {
                    console.log('[GizmoRenderer] SHOWING SELECTION');
                    this._hideLogged = false;
                }
                
                // Hide handles if editing text, or if resizing text (via drag or UI scrub)
                const hideHandles = isEditing || (isText && isPropertyChanging);

                if (!hideSelection) {
                    this.drawSelectionBox(absEl, zoom, !hideHandles);
                }
            }
        } else {
            // Multi-selection
            const isUIInteracting = state.ui?.isInteracting === true;
            const isDragging = this.cm.interactionState === 'DRAGGING';
            const isResizing = this.cm.interactionState === 'RESIZING';
            
            // Hide selection during any property change (UI interaction, dragging, or resizing)
            // Exception: Keep visible if ANY text element is in the selection
            const isPropertyChanging = isUIInteracting || isDragging || isResizing;
            let hideSelection = false;
            if (isPropertyChanging) {
                // Check if any selected element is text
                const hasTextElement = selectedElementIds.some(id => {
                    const el = slide.elements[id];
                    return el && el.type === 'text';
                });
                hideSelection = !hasTextElement;
            }
            
            if (!hideSelection) {
                // Draw individual outlines first
                selectedElementIds.forEach(id => {
                    const el = slide.elements[id];
                    if (el) {
                        const absEl = GeometryUtils.getAbsoluteElement(el, slide);
                        this.drawHoverOutline(absEl, zoom);
                    }
                });

                // Draw big bounding box
                const bounds = GeometryUtils.getSelectionBounds(
                    slide, 
                    selectedElementIds,
                    GeometryUtils.getAbsoluteElement
                );
                if (bounds) {
                    this.drawSelectionBox(bounds, zoom);
                }
            }
        }

        this.cm.ctx.restore();
    }

    drawHoverOutline(el, zoom) {
        const { x, y, width, height, rotation } = el;
        const colors = this.getColors();
        
        this.cm.ctx.save();
        this.cm.ctx.translate(x + width / 2, y + height / 2);
        this.cm.ctx.rotate((rotation || 0) * Math.PI / 180);
        this.cm.ctx.translate(-width / 2, -height / 2);

        this.cm.ctx.strokeStyle = colors.accent;
        this.cm.ctx.lineWidth = 1 / zoom;
        this.cm.ctx.strokeRect(0, 0, width, height);

        this.cm.ctx.restore();
    }

    /**
     * Render dashed border overlays for placeholder elements in master mode
     * This updates in real-time during drag/resize operations
     */
    renderPlaceholderOverlays() {
        const state = store.getState();
        const { zoom, pan, selectedElementIds, editingElementId } = state.editor;
        const slide = this.cm.getActiveContainer(state);
        
        if (!slide || !slide.elements) return;
        
        const colors = this.getColors();
        
        this.cm.ctx.save();
        this.cm.ctx.translate(pan.x, pan.y);
        this.cm.ctx.scale(zoom, zoom);
        
        // Draw dashed overlay for all placeholder elements
        Object.values(slide.elements).forEach(el => {
            if (!el.isPlaceholder) return;
            
            // Skip if this element is being edited
            if (editingElementId === el.id) return;

            // Skip if selected or hovered (to avoid visual clutter with selection box or hover outline)
            if (selectedElementIds.includes(el.id) || this.cm.hoveredElementId === el.id) return;
            
            // Get current dimensions (use live resize data if being dragged)
            let absEl = GeometryUtils.getAbsoluteElement(el, slide);
            
            // Use live resize data if this element is selected and being resized
            if (selectedElementIds.includes(el.id) && this.cm.liveResizeData && this.cm.liveResizeData.id === el.id) {
                absEl = {
                    ...absEl,
                    width: this.cm.liveResizeData.width,
                    height: this.cm.liveResizeData.height,
                    x: this.cm.liveResizeData.x !== undefined ? this.cm.liveResizeData.x : absEl.x,
                    y: this.cm.liveResizeData.y !== undefined ? this.cm.liveResizeData.y : absEl.y
                };
            }
            
            // Also check for live drag position
            if (selectedElementIds.includes(el.id) && this.cm.interactionState === 'DRAGGING') {
                // During dragging, the element position is updated directly
                // Use the current element position from store which is updated during drag
                absEl = GeometryUtils.getAbsoluteElement(el, slide);
            }
            
            this.drawPlaceholderOverlay(absEl, zoom, colors);
        });
        
        this.cm.ctx.restore();
    }

    /**
     * Draw a dashed border overlay for a placeholder element
     */
    drawPlaceholderOverlay(el, zoom, colors) {
        const { x, y, width, height, rotation } = el;
        
        this.cm.ctx.save();
        this.cm.ctx.translate(x + width / 2, y + height / 2);
        this.cm.ctx.rotate((rotation || 0) * Math.PI / 180);
        this.cm.ctx.translate(-width / 2, -height / 2);
        
        // Draw dashed border
        this.cm.ctx.strokeStyle = colors.accent;
        this.cm.ctx.lineWidth = 2 / zoom;
        this.cm.ctx.setLineDash([6 / zoom, 4 / zoom]); // Dashed pattern
        this.cm.ctx.strokeRect(0, 0, width, height);
        this.cm.ctx.setLineDash([]); // Reset dash pattern
        
        this.cm.ctx.restore();
    }

    drawSelectionBox(el, zoom, showHandles = true) {
        const { x, y, width, height, rotation } = el;
        const colors = this.getColors();
        
        this.cm.ctx.save();
        this.cm.ctx.translate(x + width / 2, y + height / 2);
        this.cm.ctx.rotate((rotation || 0) * Math.PI / 180);
        this.cm.ctx.translate(-width / 2, -height / 2);

        // 1. Draw Bounding Box
        this.cm.ctx.strokeStyle = colors.accent;
        this.cm.ctx.lineWidth = 1 / zoom; // Thin line
        this.cm.ctx.strokeRect(0, 0, width, height);

        if (showHandles) {
            const handleSize = 8 / zoom; // Size of resize handles
            const radiusHandleSize = 8 / zoom; // Size of corner radius handles
            const radiusHandleOffset = 12 / zoom; // Offset from corner

            this.cm.ctx.fillStyle = '#FFFFFF';
            this.cm.ctx.strokeStyle = colors.accent;
            this.cm.ctx.lineWidth = 1 / zoom;

            // 2. Draw Resize Handles (8 points)
            const handles = [
                { x: 0, y: 0 }, // NW
                { x: width / 2, y: 0 }, // N
                { x: width, y: 0 }, // NE
                { x: width, y: height / 2 }, // E
                { x: width, y: height }, // SE
                { x: width / 2, y: height }, // S
                { x: 0, y: height }, // SW
                { x: 0, y: height / 2 } // W
            ];

            handles.forEach(h => {
                this.cm.ctx.beginPath();
                this.cm.ctx.rect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize);
                this.cm.ctx.fill();
                this.cm.ctx.stroke();
            });

            // 3. Draw Corner Radius Handles (Inner Circles)
            // Only draw if enough space
            if (width > radiusHandleOffset * 3 && height > radiusHandleOffset * 3) {
                const radiusHandles = [
                    { x: radiusHandleOffset, y: radiusHandleOffset }, // NW
                    { x: width - radiusHandleOffset, y: radiusHandleOffset }, // NE
                    { x: width - radiusHandleOffset, y: height - radiusHandleOffset }, // SE
                    { x: radiusHandleOffset, y: height - radiusHandleOffset } // SW
                ];

                this.cm.ctx.beginPath();
                radiusHandles.forEach(h => {
                    this.cm.ctx.moveTo(h.x + radiusHandleSize/2, h.y);
                    this.cm.ctx.arc(h.x, h.y, radiusHandleSize/2, 0, Math.PI * 2);
                });
                this.cm.ctx.fillStyle = '#FFFFFF';
                this.cm.ctx.fill();
                this.cm.ctx.stroke();
            }
        }

        this.cm.ctx.restore();
    }

    renderGuides() {
        if (!this.cm.activeGuides || this.cm.activeGuides.length === 0) return;
        
        const state = store.getState();
        const { zoom, pan } = state.editor;
        
        this.cm.ctx.save();
        this.cm.ctx.translate(pan.x, pan.y);
        this.cm.ctx.scale(zoom, zoom);
        
        this.cm.ctx.strokeStyle = '#FF00FF'; // Magenta for guides
        this.cm.ctx.lineWidth = 1 / zoom;
        
        this.cm.activeGuides.forEach(g => {
            this.cm.ctx.beginPath();
            if (g.type === 'v') {
                this.cm.ctx.moveTo(g.x, -10000); // Infinite line
                this.cm.ctx.lineTo(g.x, 10000);
                this.cm.ctx.stroke();
            } else if (g.type === 'h') {
                this.cm.ctx.moveTo(-10000, g.y);
                this.cm.ctx.lineTo(10000, g.y);
                this.cm.ctx.stroke();
            } else if (g.type === 'gap-x') {
                this._renderGapX(g, zoom);
            } else if (g.type === 'gap-y') {
                this._renderGapY(g, zoom);
            }
        });
        
        this.cm.ctx.restore();
    }

    _renderGapX(g, zoom) {
        const y = g.y;
        const x1 = Math.min(g.x1, g.x2);
        const x2 = Math.max(g.x1, g.x2);
        
        this.cm.ctx.moveTo(x1, y);
        this.cm.ctx.lineTo(x2, y);
        this.cm.ctx.stroke();
        
        // Arrows
        const arrowSize = 4 / zoom;
        this.cm.ctx.beginPath();
        this.cm.ctx.moveTo(x1 + arrowSize, y - arrowSize);
        this.cm.ctx.lineTo(x1, y);
        this.cm.ctx.lineTo(x1 + arrowSize, y + arrowSize);
        this.cm.ctx.stroke();
        
        this.cm.ctx.beginPath();
        this.cm.ctx.moveTo(x2 - arrowSize, y - arrowSize);
        this.cm.ctx.lineTo(x2, y);
        this.cm.ctx.lineTo(x2 - arrowSize, y + arrowSize);
        this.cm.ctx.stroke();
        
        // Label
        const label = g.label.toString();
        this.cm.ctx.font = `${10/zoom}px Inter, sans-serif`;
        this.cm.ctx.textAlign = 'center';
        this.cm.ctx.textBaseline = 'middle';
        const textWidth = this.cm.ctx.measureText(label).width;
        const padding = 2 / zoom;
        const cx = (x1 + x2) / 2;
        
        this.cm.ctx.save();
        this.cm.ctx.fillStyle = '#FF0000';
        this.cm.ctx.fillRect(cx - textWidth / 2 - padding, y - 6/zoom - padding, textWidth + padding * 2, 12/zoom + padding * 2);
        this.cm.ctx.fillStyle = '#FFFFFF';
        this.cm.ctx.fillText(label, cx, y);
        this.cm.ctx.restore();
    }

    _renderGapY(g, zoom) {
        const x = g.x;
        const y1 = Math.min(g.y1, g.y2);
        const y2 = Math.max(g.y1, g.y2);
        
        this.cm.ctx.moveTo(x, y1);
        this.cm.ctx.lineTo(x, y2);
        this.cm.ctx.stroke();
        
        // Arrows
        const arrowSize = 4 / zoom;
        this.cm.ctx.beginPath();
        this.cm.ctx.moveTo(x - arrowSize, y1 + arrowSize);
        this.cm.ctx.lineTo(x, y1);
        this.cm.ctx.lineTo(x + arrowSize, y1 + arrowSize);
        this.cm.ctx.stroke();
        
        this.cm.ctx.beginPath();
        this.cm.ctx.moveTo(x - arrowSize, y2 - arrowSize);
        this.cm.ctx.lineTo(x, y2);
        this.cm.ctx.lineTo(x + arrowSize, y2 - arrowSize);
        this.cm.ctx.stroke();
        
        // Label
        const label = g.label.toString();
        this.cm.ctx.font = `${10/zoom}px Inter, sans-serif`;
        this.cm.ctx.textAlign = 'center';
        this.cm.ctx.textBaseline = 'middle';
        const textWidth = this.cm.ctx.measureText(label).width;
        const padding = 2 / zoom;
        const cy = (y1 + y2) / 2;
        
        this.cm.ctx.save();
        this.cm.ctx.fillStyle = '#FF0000';
        this.cm.ctx.fillRect(x - textWidth / 2 - padding, cy - 6/zoom - padding, textWidth + padding * 2, 12/zoom + padding * 2);
        this.cm.ctx.fillStyle = '#FFFFFF';
        this.cm.ctx.fillText(label, x, cy);
        this.cm.ctx.restore();
    }

    renderMeasurementGuides() {
        if (!this.cm.measurementGuides || this.cm.measurementGuides.length === 0) return;

        const state = store.getState();
        const { zoom, pan } = state.editor;

        this.cm.ctx.save();
        this.cm.ctx.translate(pan.x, pan.y);
        this.cm.ctx.scale(zoom, zoom);

        this.cm.ctx.strokeStyle = '#FF0000';
        this.cm.ctx.fillStyle = '#FF0000';
        this.cm.ctx.lineWidth = 1 / zoom;
        this.cm.ctx.font = `${12 / zoom}px Inter`;
        this.cm.ctx.textAlign = 'center';
        this.cm.ctx.textBaseline = 'middle';

        this.cm.measurementGuides.forEach(g => {
            // Draw Line
            this.cm.ctx.beginPath();
            this.cm.ctx.moveTo(g.x1, g.y1);
            this.cm.ctx.lineTo(g.x2, g.y2);
            this.cm.ctx.stroke();

            // Draw Ends
            const tickSize = 4 / zoom;
            if (g.x1 === g.x2) { // Vertical Line
                this.cm.ctx.beginPath();
                this.cm.ctx.moveTo(g.x1 - tickSize, g.y1);
                this.cm.ctx.lineTo(g.x1 + tickSize, g.y1);
                this.cm.ctx.moveTo(g.x2 - tickSize, g.y2);
                this.cm.ctx.lineTo(g.x2 + tickSize, g.y2);
                this.cm.ctx.stroke();
            } else { // Horizontal Line
                this.cm.ctx.beginPath();
                this.cm.ctx.moveTo(g.x1, g.y1 - tickSize);
                this.cm.ctx.lineTo(g.x1, g.y1 + tickSize);
                this.cm.ctx.moveTo(g.x2, g.y2 - tickSize);
                this.cm.ctx.lineTo(g.x2, g.y2 + tickSize);
                this.cm.ctx.stroke();
            }

            // Draw Label Background
            const textWidth = this.cm.ctx.measureText(g.label).width;
            const padding = 2 / zoom;
            this.cm.ctx.save();
            this.cm.ctx.fillStyle = '#FF0000';
            this.cm.ctx.fillRect(g.labelX - textWidth / 2 - padding, g.labelY - 6/zoom - padding, textWidth + padding * 2, 12/zoom + padding * 2);
            this.cm.ctx.fillStyle = '#FFFFFF';
            this.cm.ctx.fillText(g.label, g.labelX, g.labelY);
            this.cm.ctx.restore();
        });

        this.cm.ctx.restore();
    }

    renderSelectionMarquee() {
        const { x: startX, y: startY } = this.cm.dragStart;
        const { x: currX, y: currY } = this.cm.dragCurrent;
        const colors = this.getColors();

        const x = Math.min(startX, currX);
        const y = Math.min(startY, currY);
        const width = Math.abs(currX - startX);
        const height = Math.abs(currY - startY);

        this.cm.ctx.save();
        this.cm.ctx.strokeStyle = colors.accentRgba80;
        this.cm.ctx.lineWidth = 1;
        this.cm.ctx.fillStyle = colors.accentRgba10;
        
        this.cm.ctx.fillRect(x, y, width, height);
        this.cm.ctx.strokeRect(x, y, width, height);
        
        this.cm.ctx.restore();
    }

    renderCreationGhost() {
        const state = store.getState();
        const activeTool = state?.editor?.activeTool;
        const activeToolOptions = state?.editor?.activeToolOptions;

        const { x: startX, y: startY } = this.cm.dragStart;
        const { x: currX, y: currY } = this.cm.dragCurrent;
        const colors = this.getColors();

        const isAlt = !!this.cm.isAltPressed;
        const isShift = !!this.cm.isShiftPressed;

        const resolveShapeKind = () => {
            if (activeTool !== 'shape') return null;
            const kind = (activeToolOptions && typeof activeToolOptions === 'object' && typeof activeToolOptions.shapeKind === 'string')
                ? activeToolOptions.shapeKind
                : 'rectangle';
            return kind;
        };

        const shapeKind = resolveShapeKind();

        // Compute box in screen space.
        const dx = currX - startX;
        const dy = currY - startY;

        let x;
        let y;
        let width;
        let height;

        if (isAlt) {
            width = Math.abs(dx) * 2;
            height = Math.abs(dy) * 2;
            x = startX - width / 2;
            y = startY - height / 2;
        } else {
            x = Math.min(startX, currX);
            y = Math.min(startY, currY);
            width = Math.abs(dx);
            height = Math.abs(dy);
        }

        // Constrain proportions if Shift is held (for box-based kinds).
        if (isShift && shapeKind !== 'line') {
            const size = Math.max(width, height);
            width = size;
            height = size;

            if (isAlt) {
                x = startX - size / 2;
                y = startY - size / 2;
            } else {
                if (currX < startX) x = startX - size;
                if (currY < startY) y = startY - size;
            }
        }

        // For a better UX, draw a line preview for line/arrow kinds (instead of a thin bbox).
        const drawLinePreview = (withArrow) => {
            // Apply shift snapping (45°) like creation logic.
            let endX = currX;
            let endY = currY;
            if (isShift) {
                const ang = Math.atan2(dy, dx);
                const snap = Math.PI / 4;
                const snapped = Math.round(ang / snap) * snap;
                const len = Math.hypot(dx, dy);
                endX = startX + Math.cos(snapped) * len;
                endY = startY + Math.sin(snapped) * len;
            }

            const p1 = isAlt ? { x: startX - (endX - startX), y: startY - (endY - startY) } : { x: startX, y: startY };
            const p2 = { x: endX, y: endY };

            this.cm.ctx.save();
            this.cm.ctx.strokeStyle = colors.accent;
            this.cm.ctx.lineWidth = 2;
            this.cm.ctx.setLineDash([5, 5]);
            this.cm.ctx.beginPath();
            this.cm.ctx.moveTo(p1.x, p1.y);
            this.cm.ctx.lineTo(p2.x, p2.y);
            this.cm.ctx.stroke();

            if (withArrow) {
                const vx = p2.x - p1.x;
                const vy = p2.y - p1.y;
                const len = Math.hypot(vx, vy);
                if (len > 0.001) {
                    const ux = vx / len;
                    const uy = vy / len;
                    const size = 10;
                    const backX = p2.x - ux * size;
                    const backY = p2.y - uy * size;
                    const perpX = -uy;
                    const perpY = ux;
                    const wing = size * 0.6;

                    this.cm.ctx.fillStyle = colors.accent;
                    this.cm.ctx.setLineDash([]);
                    this.cm.ctx.beginPath();
                    this.cm.ctx.moveTo(p2.x, p2.y);
                    this.cm.ctx.lineTo(backX + perpX * wing, backY + perpY * wing);
                    this.cm.ctx.lineTo(backX - perpX * wing, backY - perpY * wing);
                    this.cm.ctx.closePath();
                    this.cm.ctx.fill();
                }
            }

            this.cm.ctx.restore();
        };

        const drawPolygonPath = (points) => {
            if (!Array.isArray(points) || points.length < 2) return;
            this.cm.ctx.beginPath();
            this.cm.ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                this.cm.ctx.lineTo(points[i].x, points[i].y);
            }
            this.cm.ctx.closePath();
        };

        const drawRegularPolygon = (sides, rotationDeg) => {
            const cx = x + width / 2;
            const cy = y + height / 2;
            // Match ParametricToPaths: polygons are built on a circle with r = min(w,h)/2
            const r = Math.min(width, height) / 2;
            const rot = (Number(rotationDeg) || 0) * Math.PI / 180;

            const pts = [];
            const n = Math.max(3, Math.min(64, Math.round(Number(sides) || 6)));
            for (let i = 0; i < n; i++) {
                const a = rot + (i * 2 * Math.PI) / n;
                pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
            }
            drawPolygonPath(pts);
        };

        const drawStar = (points, innerRatio, rotationDeg) => {
            const cx = x + width / 2;
            const cy = y + height / 2;
            // Match ParametricToPaths: stars use circular outer radius rOuter = min(w,h)/2
            const rOuter = Math.min(width, height) / 2;
            const rot = (Number(rotationDeg) || 0) * Math.PI / 180;

            const p = Math.max(3, Math.min(64, Math.round(Number(points) || 5)));
            const r = Math.max(0.01, Math.min(0.99, Number(innerRatio) || 0.5));
            const rInner = rOuter * r;

            const pts = [];
            const total = p * 2;
            for (let i = 0; i < total; i++) {
                const rr = (i % 2 === 0) ? rOuter : rInner;
                const a = rot + (i / total) * Math.PI * 2;
                pts.push({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr });
            }
            drawPolygonPath(pts);
        };

        // Draw preview
        this.cm.ctx.save();
        this.cm.ctx.strokeStyle = colors.accent;
        this.cm.ctx.lineWidth = 1;
        this.cm.ctx.setLineDash([5, 5]);
        this.cm.ctx.fillStyle = colors.accentRgba10;

        if (shapeKind === 'line') {
            const isArrow = activeToolOptions?.lineEndCap === 'arrow';
            this.cm.ctx.restore();
            drawLinePreview(isArrow);
            return;
        }

        if (shapeKind === 'ellipse') {
            const cx = x + width / 2;
            const cy = y + height / 2;
            const rx = width / 2;
            const ry = height / 2;
            this.cm.ctx.beginPath();
            this.cm.ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            this.cm.ctx.fill();
            this.cm.ctx.stroke();
            this.cm.ctx.restore();
            return;
        }

        if (shapeKind === 'polygon') {
            const sides = 6;
            const rotation = 0;
            drawRegularPolygon(sides, rotation);
            this.cm.ctx.fill();
            this.cm.ctx.stroke();
            this.cm.ctx.restore();
            return;
        }

        if (shapeKind === 'star') {
            const points = 5;
            const innerRadiusRatio = 0.5;
            const rotation = 0;
            drawStar(points, innerRadiusRatio, rotation);
            this.cm.ctx.fill();
            this.cm.ctx.stroke();
            this.cm.ctx.restore();
            return;
        }

        // Default: rectangle box preview
        this.cm.ctx.fillRect(x, y, width, height);
        this.cm.ctx.strokeRect(x, y, width, height);
        this.cm.ctx.restore();
    }
}
