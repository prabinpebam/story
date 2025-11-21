import { store } from './Store.js';
import { LaserPointer } from './LaserPointer.js';

export class PresentationManager {
    constructor() {
        this.playBtn = document.getElementById('play-btn');
        this.appContainer = document.getElementById('app');
        this.slideContainer = document.getElementById('viewport'); // The container that holds the slide
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

        // Listen for state changes
        store.on('state-changed', (state) => {
            if (state.editor.mode === 'presentation') {
                this.updateScale();
                this.updateOverlays(state.presentation);
            }
        });

        this.bindEvents();
    }

    bindEvents() {
        // Keyboard Navigation
        document.addEventListener('keydown', (e) => {
            const state = store.getState();
            if (state.editor.mode !== 'presentation') return;

            switch (e.key) {
                case 'ArrowRight':
                case 'Space':
                case 'Enter':
                case 'PageDown':
                case 'n':
                    e.preventDefault();
                    store.dispatch('PRESENTATION_NEXT');
                    break;
                case 'ArrowLeft':
                case 'Backspace':
                case 'PageUp':
                case 'p':
                    e.preventDefault();
                    store.dispatch('PRESENTATION_PREV');
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.stopPresentation();
                    break;
                case 'b':
                case '.':
                    e.preventDefault();
                    store.dispatch('TOGGLE_BLACK_SCREEN');
                    break;
                case 'w':
                case ',':
                    e.preventDefault();
                    store.dispatch('TOGGLE_WHITE_SCREEN');
                    break;
                case 'l':
                    e.preventDefault();
                    store.dispatch('TOGGLE_LASER');
                    break;
                case 'g':
                    e.preventDefault();
                    store.dispatch('TOGGLE_GRID_VIEW');
                    break;
            }
        });

        // Handle fullscreen change (user pressed Esc or F11)
        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) {
                // If we exited fullscreen externally, sync state
                const state = store.getState();
                if (state.editor.mode === 'presentation') {
                    this.stopPresentation();
                }
            }
        });

        // Handle Resize
        window.addEventListener('resize', () => {
            const state = store.getState();
            if (state.editor.mode === 'presentation') {
                this.updateScale();
            }
        });
        
        // Mouse Move for Laser Pointer
        document.addEventListener('mousemove', (e) => {
            const state = store.getState();
            if (state.editor.mode === 'presentation' && state.presentation.laserPointer) {
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
    }

    stopPresentation() {
        store.dispatch('SET_MODE', 'edit');
    }

    async enterFullscreen() {
        try {
            if (this.appContainer.requestFullscreen) {
                await this.appContainer.requestFullscreen();
            }
            this.appContainer.classList.add('mode-presentation');
            this.updateScale();
            
            // Start Laser Pointer loop if needed
            this.laserPointer.start();
            this.laserPointer.resize(); // Ensure it fits screen
        } catch (err) {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
        }
    }

    exitFullscreen() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
        this.appContainer.classList.remove('mode-presentation');
        
        // Reset scale
        if (this.slideContainer) {
            this.slideContainer.style.transform = '';
            this.slideContainer.style.width = '';
            this.slideContainer.style.height = '';
            this.slideContainer.style.position = '';
            this.slideContainer.style.top = '';
            this.slideContainer.style.left = '';
        }
        
        this.laserPointer.stop();
    }

    updateScale() {
        if (!this.slideContainer) return;

        const state = store.getState();
        const slideId = state.editor.activeSlideId;
        const slide = state.slides[slideId];
        
        if (!slide) return;

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const slideWidth = slide.width || 1920;
        const slideHeight = slide.height || 1080;

        // Calculate Scale to fit
        const scaleX = windowWidth / slideWidth;
        const scaleY = windowHeight / slideHeight;
        const scale = Math.min(scaleX, scaleY);

        // Apply Transform
        // We need to center the slide
        this.slideContainer.style.position = 'absolute';
        this.slideContainer.style.top = '50%';
        this.slideContainer.style.left = '50%';
        this.slideContainer.style.transform = `translate(-50%, -50%) scale(${scale})`;
        this.slideContainer.style.transformOrigin = 'center center';
    }

    updateOverlays(presentationState) {
        const blackOverlay = document.getElementById('overlay-black');
        const whiteOverlay = document.getElementById('overlay-white');

        if (blackOverlay) {
            if (presentationState.blackScreen) {
                blackOverlay.classList.remove('hidden');
            } else {
                blackOverlay.classList.add('hidden');
            }
        }

        if (whiteOverlay) {
            if (presentationState.whiteScreen) {
                whiteOverlay.classList.remove('hidden');
            } else {
                whiteOverlay.classList.add('hidden');
            }
        }
    }
}
