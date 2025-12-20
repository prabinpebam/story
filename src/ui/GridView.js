import { store } from '../core/Store.js';

export class GridView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.content = document.getElementById('grid-content');
        this.closeBtn = document.getElementById('close-grid-btn');
        this.init();
    }

    init() {
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => {
                store.dispatch('TOGGLE_GRID_VIEW');
            });
        }

        store.on('state-changed', (state) => {
            this.update(state);
        });
    }

    update(state) {
        if (!this.container) return;

        const isVisible = state.presentation.gridView && state.editor.mode === 'presentation';
        
        if (isVisible) {
            this.container.classList.remove('hidden');
            // Only render if content is empty or we need to update active state
            // For now, simple re-render
            this.render(state);
        } else {
            this.container.classList.add('hidden');
        }
    }

    render(state) {
        if (!this.content) return;
        this.content.innerHTML = '';

        state.slideOrder.forEach((slideId, index) => {
            const slide = state.slides[slideId];
            const isActive = index === state.presentation.currentSlideIndex;

            const item = document.createElement('div');
            item.className = `grid-slide-item ${isActive ? 'active' : ''}`;
            item.onclick = () => {
                store.dispatch('PRESENTATION_JUMP_TO', { index, source: 'grid' });
                store.dispatch('TOGGLE_GRID_VIEW');
            };

            // Thumbnail Preview
            const preview = document.createElement('div');
            preview.className = 'slide-preview';
            
            // Slide Number
            const number = document.createElement('div');
            number.className = 'slide-number';
            number.innerText = index + 1;
            preview.appendChild(number);
            
            // Title
            const title = document.createElement('div');
            title.className = 'slide-title';
            title.innerText = slide.title || `Slide ${index + 1}`;

            item.appendChild(preview);
            item.appendChild(title);
            this.content.appendChild(item);
        });
    }
}
