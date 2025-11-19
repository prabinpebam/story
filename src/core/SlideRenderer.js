import { store } from './Store.js';

export class SlideRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.init();
    }

    init() {
        this.render();
        store.on('state-changed', () => this.render());
    }

    render() {
        const state = store.getState();
        const activeSlideId = state.editor.activeSlideId;
        const slide = state.slides[activeSlideId];

        if (!slide) {
            this.container.innerHTML = '';
            return;
        }

        // Set Dimensions
        this.container.style.width = `${slide.width}px`;
        this.container.style.height = `${slide.height}px`;
        
        // Simple full re-render for now (Optimization: Diffing later)
        this.container.innerHTML = '';

        // Render Background
        this.applyBackground(slide.background, slide.width, slide.height);

        // Render Elements
        slide.elementOrder.forEach(elId => {
            const el = slide.elements[elId];
            if (el) {
                const domEl = this.createElementDOM(el);
                this.container.appendChild(domEl);
            }
        });
    }

    applyBackground(bg, width, height) {
        // The background is actually on a separate layer #slide-background
        const bgLayer = document.getElementById('slide-background');
        if (bgLayer) {
            bgLayer.style.width = `${width}px`;
            bgLayer.style.height = `${height}px`;
            
            if (bg.type === 'solid') {
                bgLayer.style.background = bg.value;
            } else if (bg.type === 'gradient') {
                bgLayer.style.background = bg.value;
            }
        }
    }

    createElementDOM(el) {
        const div = document.createElement('div');
        div.id = el.id;
        div.className = 'slide-element';
        div.style.position = 'absolute';
        div.style.left = `${el.x}px`;
        div.style.top = `${el.y}px`;
        div.style.width = `${el.width}px`;
        div.style.height = `${el.height}px`;
        div.style.transform = `rotate(${el.rotation || 0}deg)`;
        div.style.opacity = el.opacity || 1;
        div.style.zIndex = el.zIndex || 'auto'; // elementOrder handles visual stacking order usually

        if (el.type === 'text') {
            div.innerHTML = el.content; // Rich text
            div.style.fontFamily = el.style?.fontFamily || 'Inter';
            div.style.fontSize = `${el.style?.fontSize || 16}px`;
            div.style.color = el.style?.color || 'black';
            div.style.textAlign = el.style?.textAlign || 'left';
            // ... other styles
        } else if (el.type === 'rect') {
            div.style.backgroundColor = el.style?.fill || '#ff4d00';
            div.style.border = `${el.style?.strokeWidth || 0}px solid ${el.style?.stroke || 'transparent'}`;
            div.style.borderRadius = `${el.style?.radius || 0}px`;
        }

        // Interaction (Selection)
        div.addEventListener('mousedown', (e) => {
            e.stopPropagation(); // Prevent canvas pan
            store.dispatch('UPDATE_SELECTION', [el.id]);
            // TODO: Initiate Drag
        });

        return div;
    }
}
