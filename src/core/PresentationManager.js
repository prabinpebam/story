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
                    if (state.presentation.buildIndex < state.presentation.buildCount - 1) {
                        store.dispatch('NEXT_BUILD');
                    } else {
                        store.dispatch('PRESENTATION_NEXT');
                    }
                    break;
                case 'ArrowLeft':
                case 'Backspace':
                case 'PageUp':
                case 'p':
                    e.preventDefault();
                    if (state.presentation.buildIndex > -1) {
                        store.dispatch('PREV_BUILD');
                    } else {
                        store.dispatch('PRESENTATION_PREV');
                    }
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
                // Canvas is now fixed position full screen, so client coordinates match
                this.laserPointer.addPoint(e.clientX, e.clientY);
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
            document.body.classList.add('mode-presentation');
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
        document.body.classList.remove('mode-presentation');
        
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

        // Use requestAnimationFrame to ensure we run after any potential conflicts
        requestAnimationFrame(() => {
            const state = store.getState();
            // Double check mode
            if (state.editor.mode !== 'presentation') return;

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
            this.slideContainer.style.width = `${slideWidth}px`;
            this.slideContainer.style.height = `${slideHeight}px`;
            this.slideContainer.style.transform = `translate(-50%, -50%) scale(${scale})`;
            this.slideContainer.style.transformOrigin = 'center center';

            // Reset inner layers to neutral state (remove Edit Mode transforms)
            const contentLayer = document.getElementById('slide-content');
            const backgroundLayer = document.getElementById('slide-background');
            
            if (contentLayer) {
                contentLayer.style.transform = 'none';
                contentLayer.style.transformOrigin = '0 0'; // Reset origin
                contentLayer.style.width = '100%';
                contentLayer.style.height = '100%';
                contentLayer.style.top = '0';
                contentLayer.style.left = '0';
            }
            
            if (backgroundLayer) {
                backgroundLayer.style.transform = 'none';
                backgroundLayer.style.transformOrigin = '0 0'; // Reset origin
                backgroundLayer.style.width = '100%';
                backgroundLayer.style.height = '100%';
                backgroundLayer.style.top = '0';
                backgroundLayer.style.left = '0';
            }
        });
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

        // Laser Pointer Cursor
        if (presentationState.laserPointer) {
            document.body.classList.add('laser-active');
        } else {
            document.body.classList.remove('laser-active');
        }
    }
}
