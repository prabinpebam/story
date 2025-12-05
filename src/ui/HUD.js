import { store } from '../core/Store.js';

export class HUD {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.hideTimeout = null;
        this.isVisible = false;
        this.init();
    }

    init() {
        if (!this.container) return;

        // Create UI
        this.render();

        // Bind Events
        this.bindEvents();

        // Subscribe to store
        store.on('state-changed', (state) => this.update(state));
        store.on('mode-changed', (mode) => {
            if (mode === 'presentation') {
                this.show();
            } else {
                this.hide();
            }
        });
    }

    render() {
        this.container.innerHTML = `
            <div class="hud-controls">
                <button id="hud-prev" class="hud-btn" data-testid="hud-prev-btn" title="Previous (Left Arrow)"><i class="fa-solid fa-chevron-left"></i></button>
                <div class="hud-divider"></div>
                <button id="hud-laser" class="hud-btn" data-testid="hud-laser-btn" title="Laser Pointer (L)"><i class="fa-solid fa-wand-magic-sparkles"></i></button>
                <button id="hud-grid" class="hud-btn" data-testid="hud-grid-btn" title="Slide Navigator (G)"><i class="fa-solid fa-border-all"></i></button>
                <button id="hud-black" class="hud-btn" data-testid="hud-black-btn" title="Black Screen (B)"><i class="fa-solid fa-eye-slash"></i></button>
                <div class="hud-divider"></div>
                <button id="hud-next" class="hud-btn" data-testid="hud-next-btn" title="Next (Right Arrow)"><i class="fa-solid fa-chevron-right"></i></button>
                <div class="hud-divider"></div>
                <button id="hud-exit" class="hud-btn" data-testid="hud-exit-btn" title="Exit (Esc)"><i class="fa-solid fa-xmark"></i></button>
            </div>
        `;

        // Bind Button Actions
        this.container.querySelector('#hud-prev').onclick = () => {
            const state = store.getState();
            if (state.presentation.buildIndex > -1) {
                store.dispatch('PREV_BUILD');
            } else {
                store.dispatch('PRESENTATION_PREV');
            }
        };

        this.container.querySelector('#hud-next').onclick = () => {
            const state = store.getState();
            if (state.presentation.buildIndex < state.presentation.buildCount - 1) {
                store.dispatch('NEXT_BUILD');
            } else {
                store.dispatch('PRESENTATION_NEXT');
            }
        };

        this.container.querySelector('#hud-laser').onclick = () => store.dispatch('TOGGLE_LASER');
        this.container.querySelector('#hud-grid').onclick = () => store.dispatch('TOGGLE_GRID_VIEW');
        this.container.querySelector('#hud-black').onclick = () => store.dispatch('TOGGLE_BLACK_SCREEN');
        this.container.querySelector('#hud-exit').onclick = () => store.dispatch('SET_MODE', 'edit');
    }

    bindEvents() {
        // Mouse Move to show HUD
        document.addEventListener('mousemove', (e) => {
            const state = store.getState();
            if (state.editor.mode === 'presentation') {
                this.show();
            }
        });
    }

    show() {
        if (!this.container) return;
        
        this.container.classList.remove('hidden');
        this.isVisible = true;

        // Reset Timer
        if (this.hideTimeout) clearTimeout(this.hideTimeout);
        
        // Hide after 3 seconds of inactivity
        this.hideTimeout = setTimeout(() => {
            // Don't hide if hovering over the HUD itself
            if (!this.container.matches(':hover')) {
                this.hide();
            }
        }, 3000);
    }

    hide() {
        if (!this.container) return;
        this.container.classList.add('hidden');
        this.isVisible = false;
    }

    update(state) {
        if (!this.container) return;

        // Update active states of buttons
        const laserBtn = this.container.querySelector('#hud-laser');
        const blackBtn = this.container.querySelector('#hud-black');
        const gridBtn = this.container.querySelector('#hud-grid');

        if (laserBtn) laserBtn.classList.toggle('active', state.presentation.laserPointer);
        if (blackBtn) blackBtn.classList.toggle('active', state.presentation.blackScreen);
        if (gridBtn) gridBtn.classList.toggle('active', state.presentation.gridView);
    }
}
