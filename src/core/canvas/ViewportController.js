import { store } from '../Store.js';

/**
 * ViewportController - Handles viewport transformations, zoom, pan, and fitting
 */
export class ViewportController {
    constructor(canvasManager) {
        this.cm = canvasManager;
        this.lastFit = null;
    }

    fitToView() {
        const state = store.getState();
        const slide = this.cm.getActiveContainer(state);
        
        if (!slide) return;

        const containerRect = this.cm.container.getBoundingClientRect();
        const slideWidth = slide.width || 1920;
        const slideHeight = slide.height || 1080;
        const padding = 60;

        const availableWidth = containerRect.width - padding * 2;
        const availableHeight = containerRect.height - padding * 2;

        const scaleX = availableWidth / slideWidth;
        const scaleY = availableHeight / slideHeight;
        const newZoom = Math.min(scaleX, scaleY);

        const newPanX = (containerRect.width - slideWidth * newZoom) / 2;
        const newPanY = (containerRect.height - slideHeight * newZoom) / 2;

        this.lastFit = {
            zoom: newZoom,
            pan: { x: newPanX, y: newPanY },
            width: containerRect.width,
            height: containerRect.height,
            slideWidth,
            slideHeight
        };

        store.dispatch('UPDATE_VIEWPORT', {
            zoom: newZoom,
            pan: { x: newPanX, y: newPanY }
        });
    }

    zoomIn() {
        const state = store.getState();
        const { zoom, pan } = state.editor;
        const newZoom = Math.min(zoom * 1.2, 5.0);
        
        // Zoom towards center of viewport
        const rect = this.cm.container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const worldX = (centerX - pan.x) / zoom;
        const worldY = (centerY - pan.y) / zoom;

        const newPanX = centerX - (worldX * newZoom);
        const newPanY = centerY - (worldY * newZoom);

        store.dispatch('UPDATE_VIEWPORT', {
            zoom: newZoom,
            pan: { x: newPanX, y: newPanY }
        });
    }

    zoomOut() {
        const state = store.getState();
        const { zoom, pan } = state.editor;
        const newZoom = Math.max(zoom / 1.2, 0.1);

        // Zoom towards center of viewport
        const rect = this.cm.container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const worldX = (centerX - pan.x) / zoom;
        const worldY = (centerY - pan.y) / zoom;

        const newPanX = centerX - (worldX * newZoom);
        const newPanY = centerY - (worldY * newZoom);

        store.dispatch('UPDATE_VIEWPORT', {
            zoom: newZoom,
            pan: { x: newPanX, y: newPanY }
        });
    }

    resize() {
        const state = store.getState();
        if (state.editor.mode === 'presentation') return;

        if (!this.cm.container || !this.cm.canvas) return;

        const rect = this.cm.container.getBoundingClientRect();
        const wasFitted = this.lastFit
            && Math.abs(state.editor.zoom - this.lastFit.zoom) < 0.0001
            && Math.abs(state.editor.pan.x - this.lastFit.pan.x) < 0.5
            && Math.abs(state.editor.pan.y - this.lastFit.pan.y) < 0.5;
        const sizeChanged = !this.lastFit
            || Math.abs(rect.width - this.lastFit.width) >= 1
            || Math.abs(rect.height - this.lastFit.height) >= 1;
        this.cm.canvas.width = rect.width;
        this.cm.canvas.height = rect.height;
        // Ensure CSS size matches canvas size to avoid scaling issues
        this.cm.canvas.style.width = `${rect.width}px`;
        this.cm.canvas.style.height = `${rect.height}px`;
        if (wasFitted && sizeChanged && rect.width > 0 && rect.height > 0) {
            this.fitToView();
        }
    }

    updateViewportTransform({ pan, zoom }) {
        const state = store.getState();
        if (state.editor.mode === 'presentation') return;

        if (this.cm.viewport) {
            // Apply transform to the viewport container or content layer
            this.cm.contentLayer.style.transformOrigin = '0 0';
            this.cm.contentLayer.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
            
            // Also update background if it needs to move
            this.cm.backgroundLayer.style.transformOrigin = '0 0';
            this.cm.backgroundLayer.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;

            // Ensure dimensions are set
            const slide = this.cm.getActiveContainer(state);
            if (slide) {
                this.cm.contentLayer.style.width = `${slide.width}px`;
                this.cm.contentLayer.style.height = `${slide.height}px`;
                this.cm.backgroundLayer.style.width = `${slide.width}px`;
                this.cm.backgroundLayer.style.height = `${slide.height}px`;
            }

            // Update Zoom Display
            const zoomDisplay = document.getElementById('zoom-display');
            if (zoomDisplay) {
                zoomDisplay.textContent = `${Math.round(zoom * 100)}%`;
            }
        }
    }
}
