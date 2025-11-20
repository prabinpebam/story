import { store } from './Store.js';
import { LaserPointer } from './LaserPointer.js';

export class PresentationManager {
    constructor() {
        this.playBtn = document.getElementById('play-btn');
        this.laserPointer = new LaserPointer('laser-canvas');
        this.init();
    }

    init() {
        if (this.playBtn) {
            this.playBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.startPresentation();
            });
        }

        // Listen for mode changes
        store.on('mode-changed', (mode) => {
            if (mode === 'presentation') {
                this.enterFullscreen();
            } else {
                this.exitFullscreen();
            }
        });

        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('keydown', (e) => {
            const state = store.getState();
            if (state.editor.mode !== 'presentation') return;

            if (e.key === 'ArrowRight' || e.key === 'Space') {
                e.preventDefault();
                this.nextSlide();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.prevSlide();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.stopPresentation();
            }
        });

        // Handle fullscreen change (user pressed Esc)
        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) {
                const state = store.getState();
                if (state.editor.mode === 'presentation') {
                    this.stopPresentation();
                }
            }
        });
        
        // Click to advance
        document.addEventListener('click', (e) => {
            const state = store.getState();
            if (state.editor.mode === 'presentation') {
                this.nextSlide();
            }
        });

        // Mouse Move for Laser Pointer
        document.addEventListener('mousemove', (e) => {
            const state = store.getState();
            if (state.editor.mode === 'presentation') {
                // We need coordinates relative to the viewport/canvas
                // Since in presentation mode, canvas is full screen (mostly)
                // But let's be precise
                const canvas = this.laserPointer.canvas;
                if (canvas) {
                    const rect = canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    this.laserPointer.addPoint(x, y);
                }
            }
        });
    }

    startPresentation() {
        store.dispatch('SET_MODE', 'presentation');
        document.body.classList.add('mode-presentation');
        
        this.laserPointer.start();

        // Dispatch a resize event so CanvasManager can refit
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
            this.laserPointer.resize();
        }, 100);
    }

    stopPresentation() {
        store.dispatch('SET_MODE', 'edit');
        document.body.classList.remove('mode-presentation');
        
        this.laserPointer.stop();

        // Dispatch a resize event so CanvasManager can refit
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 100);
    }

    enterFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn(`Error attempting to enable fullscreen: ${err.message}`);
            });
        }
    }

    exitFullscreen() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
    }

    nextSlide() {
        const state = store.getState();
        const currentId = state.editor.activeSlideId;
        const currentIndex = state.slideOrder.indexOf(currentId);
        
        if (currentIndex < state.slideOrder.length - 1) {
            const nextId = state.slideOrder[currentIndex + 1];
            store.dispatch('SET_ACTIVE_SLIDE', nextId);
        }
    }

    prevSlide() {
        const state = store.getState();
        const currentId = state.editor.activeSlideId;
        const currentIndex = state.slideOrder.indexOf(currentId);
        
        if (currentIndex > 0) {
            const prevId = state.slideOrder[currentIndex - 1];
            store.dispatch('SET_ACTIVE_SLIDE', prevId);
        }
    }
}
