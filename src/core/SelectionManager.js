import { store } from './Store.js';

export class SelectionManager {
    constructor(canvasManager) {
        this.canvasManager = canvasManager;
        this.overlayLayer = canvasManager.overlayLayer;
        
        this.init();
    }

    init() {
        store.on('selection-change', (selection) => {
            this.renderGizmo(selection);
        });
        
        // Clear selection when clicking on empty space
        this.canvasManager.container.addEventListener('click', (e) => {
            if (e.target === this.canvasManager.container || 
                e.target === this.canvasManager.backgroundLayer ||
                e.target === this.canvasManager.objectLayer) {
                store.dispatch('UPDATE_SELECTION', []);
            }
        });
    }

    renderGizmo(selection) {
        this.overlayLayer.innerHTML = '';
        
        if (!selection || selection.length === 0) return;

        // For now, handle single selection
        const selectedId = selection[0];
        const state = store.getState();
        const currentSlide = state.slides[state.currentSlideIndex];
        const element = currentSlide.elements.find(el => el.id === selectedId);

        if (!element) return;

        // Create Gizmo Box
        const box = document.createElement('div');
        box.style.position = 'absolute';
        box.style.left = `${element.x}px`;
        box.style.top = `${element.y}px`;
        box.style.width = `${element.width}px`;
        box.style.height = `${element.height}px`;
        box.style.border = '1px solid var(--te-blue)';
        box.style.pointerEvents = 'none'; // Allow clicks to pass through
        box.style.transform = `rotate(${element.rotation || 0}deg)`;
        
        // Add Handles (Corners)
        const handles = ['tl', 'tr', 'bl', 'br'];
        handles.forEach(pos => {
            const handle = document.createElement('div');
            handle.style.position = 'absolute';
            handle.style.width = '8px';
            handle.style.height = '8px';
            handle.style.backgroundColor = 'white';
            handle.style.border = '1px solid var(--te-blue)';
            handle.style.pointerEvents = 'auto'; // Handles are interactive
            handle.style.cursor = 'pointer';
            
            // Position handles
            if (pos.includes('t')) handle.style.top = '-4px';
            else handle.style.bottom = '-4px';
            
            if (pos.includes('l')) handle.style.left = '-4px';
            else handle.style.right = '-4px';

            box.appendChild(handle);
        });

        this.overlayLayer.appendChild(box);
    }
}
