import { store } from '../core/Store.js';

export class HUD {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.hideTimeout = null;
        this.isVisible = false;
        this.isPresenter = false;
        this.init();
    }

    init() {
        if (!this.container) return;

        this.isPresenter = new URLSearchParams(window.location.search).get('presenter') === '1';

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
        const presenterLoading = this.isPresenter
            ? '<div id="pm-presenter-loading" class="pm-presenter-loading hidden" data-testid="pm-presenter-loading" role="status" aria-live="polite">Loading…</div>'
            : '';

        this.container.innerHTML = `
            ${presenterLoading}
            <div class="hud-controls" role="toolbar" aria-label="Presentation controls">
                <button id="hud-prev" class="hud-btn" data-testid="hud-prev-btn" title="Previous (Left Arrow)" aria-label="Previous slide" aria-keyshortcuts="ArrowLeft Backspace"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>
                <div class="hud-divider"></div>
                <button id="hud-laser" class="hud-btn" data-testid="hud-laser-btn" title="Laser Pointer (L)" aria-label="Toggle laser pointer" aria-keyshortcuts="L" aria-pressed="false"><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i></button>
                <button id="hud-grid" class="hud-btn" data-testid="hud-grid-btn" title="Slide Navigator (G)" aria-label="Open grid navigator" aria-keyshortcuts="G" aria-pressed="false"><i class="fa-solid fa-border-all" aria-hidden="true"></i></button>
                <button id="hud-black" class="hud-btn" data-testid="hud-black-btn" title="Black Screen (B)" aria-label="Toggle black screen" aria-keyshortcuts="B" aria-pressed="false"><i class="fa-solid fa-eye-slash" aria-hidden="true"></i></button>
                <button id="hud-fullscreen" class="hud-btn hidden" data-testid="hud-fullscreen-btn" title="Enter Fullscreen" aria-label="Enter fullscreen"><i class="fa-solid fa-expand" aria-hidden="true"></i></button>
                <div class="hud-divider"></div>
                <span id="hud-counter" class="hud-counter" data-testid="hud-counter" role="status" aria-live="polite">1 / 1</span>
                <button id="hud-next" class="hud-btn" data-testid="hud-next-btn" title="Next (Right Arrow)" aria-label="Next slide" aria-keyshortcuts="ArrowRight PageDown"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>
                <div class="hud-divider"></div>
                <button id="hud-exit" class="hud-btn" data-testid="hud-exit-btn" title="Exit (Esc)" aria-label="Exit presentation" aria-keyshortcuts="Escape"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
            </div>
        `;

        // Bind Button Actions
        this.container.querySelector('#hud-prev').onclick = () => {
            const state = store.getState();
            if (state.presentation.buildIndex > 0) store.dispatch('PREV_BUILD');
            else window.dispatchEvent(new CustomEvent('presentation:navigate', { detail: { direction: 'prev' } }));
        };

        this.container.querySelector('#hud-next').onclick = () => {
            const state = store.getState();
            if (state.presentation.buildIndex < state.presentation.buildCount - 1) {
                store.dispatch('NEXT_BUILD');
            } else {
                window.dispatchEvent(new CustomEvent('presentation:navigate', { detail: { direction: 'next' } }));
            }
        };

        this.container.querySelector('#hud-laser').onclick = () => store.dispatch('TOGGLE_LASER');
        this.container.querySelector('#hud-grid').onclick = () => store.dispatch('TOGGLE_GRID_VIEW');
        this.container.querySelector('#hud-black').onclick = () => store.dispatch('TOGGLE_BLACK_SCREEN');
        this.container.querySelector('#hud-exit').onclick = () => store.dispatch('EXIT_RUNTIME');

        this.container.querySelector('#hud-fullscreen').onclick = async () => {
            const state = store.getState();
            if (state?.editor?.mode !== 'presentation') return;
            const app = document.getElementById('app');
            if (!app || document.fullscreenElement) return;
            try {
                await app.requestFullscreen();
            } catch {
                // Best-effort. Presentation continues windowed.
            }
        };
    }

    bindEvents() {
        // Mouse Move to show HUD
        document.addEventListener('mousemove', (e) => {
            const state = store.getState();
            if (state?.editor?.mode === 'presentation') {
                this.show();
            }
        });

        // Touch: tap-to-reveal HUD
        document.addEventListener('touchstart', () => {
            const state = store.getState();
            if (state?.editor?.mode === 'presentation') {
                this.show();
            }
        }, { passive: true });

        // Pointer devices (pen) should also reveal HUD.
        document.addEventListener('pointermove', () => {
            const state = store.getState();
            if (state?.editor?.mode === 'presentation') {
                this.show();
            }
        });

        // Keyboard interaction should reveal HUD (Tab/Arrow/etc).
        document.addEventListener('keydown', () => {
            const state = store.getState();
            if (state?.editor?.mode === 'presentation') {
                this.show();
            }
        });

        // If any HUD control receives focus, keep it visible.
        this.container.addEventListener('focusin', () => {
            const state = store.getState();
            if (state?.editor?.mode === 'presentation') {
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

        const loading = this.container.querySelector('#pm-presenter-loading');
        if (loading) {
            loading.classList.toggle('hidden', !state?.presentation?.navLoading);
        }

        // Update active states of buttons
        const laserBtn = this.container.querySelector('#hud-laser');
        const blackBtn = this.container.querySelector('#hud-black');
        const gridBtn = this.container.querySelector('#hud-grid');
        const fullscreenBtn = this.container.querySelector('#hud-fullscreen');
        const counter = this.container.querySelector('#hud-counter');

        if (laserBtn) laserBtn.classList.toggle('active', !!state?.presentation?.laserPointer);
        if (blackBtn) blackBtn.classList.toggle('active', !!state?.presentation?.blackScreen);
        if (gridBtn) gridBtn.classList.toggle('active', !!state?.presentation?.gridView);

        if (laserBtn) laserBtn.setAttribute('aria-pressed', (!!state?.presentation?.laserPointer).toString());
        if (blackBtn) blackBtn.setAttribute('aria-pressed', (!!state?.presentation?.blackScreen).toString());
        if (gridBtn) gridBtn.setAttribute('aria-pressed', (!!state?.presentation?.gridView).toString());

        if (counter) {
            const idx = Number.isFinite(state?.presentation?.currentSlideIndex) ? state.presentation.currentSlideIndex : 0;
            const total = Array.isArray(state?.slideOrder) ? state.slideOrder.length : 1;
            counter.textContent = `${idx + 1} / ${total}`;
        }

        if (fullscreenBtn) {
            const needsFullscreen = state?.editor?.mode === 'presentation' && !document.fullscreenElement;
            fullscreenBtn.classList.toggle('hidden', !needsFullscreen);
        }
    }
}
