import { store } from './Store.js';
import { LaserPointer } from './LaserPointer.js';
import { mouseStateManager } from './MouseStateManager.js';
import { cursorManager } from './CursorManager.js';
import { InputManager } from './InputManager.js';
import { PresentationInputBuffer, INPUT_THROTTLE_MS } from './presentation/PresentationInputBuffer.js';

export class PresentationManager {
    constructor() {
        this.playBtn = document.getElementById('play-btn');
        this.appContainer = document.getElementById('app');
        this.slideContainer = document.getElementById('viewport'); // The container that holds the slide
        this.laserPointer = new LaserPointer('laser-canvas');

        this._lastShortcutAt = 0;
        this._idleCursorTimer = null;
        this._touchStart = null;
        this._clickAdvanceConfig = {
            enabled: true,
            action: 'next-build',
            excludeRegions: [
                '.hud-controls',
                '#presentation-hud',
                '#presentation-grid-view',
                'a[href]',
                'button',
                'input',
                'textarea',
                'select',
                'video',
                '.code-canvas'
            ]
        };

        this._numericBuffer = new PresentationInputBuffer({
            onCommit: (slideNumber) => this._gotoSlideNumber(slideNumber)
        });
        
        // Cache for presentation mode coordinate calculation
        this._presentationScale = 1;
        this._presentationOffsetX = 0;
        this._presentationOffsetY = 0;
        this._slideWidth = 1920;
        this._slideHeight = 1080;
        
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
            }

            // Keep overlays/laser cursor in sync even when leaving presentation.
            this.updateOverlays(state.presentation, state.editor.mode);
        });

        this.bindEvents();
    }

    bindEvents() {
        // Keyboard Navigation
        document.addEventListener('keydown', (e) => {
            const state = store.getState();
            if (state.editor.mode !== 'presentation') return;

            // Don't interfere with browser/OS shortcuts.
            if (e.ctrlKey || e.metaKey || e.altKey) return;

            // Focus trap: if typing in an input/contenteditable, do not handle presentation shortcuts.
            if (InputManager.shouldBlockShortcut(e)) return;

            // Numeric entry buffer (PowerPoint-style).
            if (/^[0-9]$/.test(e.key)) {
                e.preventDefault();
                this._numericBuffer.pushDigit(e.key);
                return;
            }

            // If numeric entry is active, Enter commits and Esc cancels.
            if (this._numericBuffer.isActive) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this._numericBuffer.commit();
                    return;
                }
                if (e.key === 'Escape') {
                    e.preventDefault();
                    this._numericBuffer.cancel();
                    return;
                }
            }

            // Key repeat throttle (avoid accidental rapid navigation).
            const now = performance.now();
            if (now - this._lastShortcutAt < INPUT_THROTTLE_MS) {
                return;
            }
            this._lastShortcutAt = now;

            switch (e.key) {
                case 'ArrowRight':
                case 'ArrowDown':
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
                case 'ArrowUp':
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
                case 'Home':
                    e.preventDefault();
                    store.dispatch('PRESENTATION_GOTO', 0);
                    break;
                case 'End': {
                    e.preventDefault();
                    const slideCount = state.slideOrder?.length ?? 0;
                    if (slideCount > 0) {
                        store.dispatch('PRESENTATION_GOTO', slideCount - 1);
                    }
                    break;
                }
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

        // Click-to-advance (configurable, excludes interactive regions)
        document.addEventListener('click', (e) => {
            const state = store.getState();
            if (state.editor.mode !== 'presentation') return;
            if (!this._clickAdvanceConfig.enabled) return;

            // Don't advance when overlays/grid are showing.
            if (state.presentation.blackScreen || state.presentation.whiteScreen || state.presentation.gridView) return;

            // Only left-click.
            if (e.button !== 0) return;

            const target = e.target;
            if (!(target instanceof Element)) return;

            for (const selector of this._clickAdvanceConfig.excludeRegions) {
                if (target.closest(selector)) {
                    return;
                }
            }

            e.preventDefault();
            e.stopPropagation();

            if (this._clickAdvanceConfig.action === 'next-slide') {
                store.dispatch('PRESENTATION_NEXT');
                return;
            }

            // Default: next-build
            if (state.presentation.buildIndex < state.presentation.buildCount - 1) {
                store.dispatch('NEXT_BUILD');
            } else {
                store.dispatch('PRESENTATION_NEXT');
            }
        }, true);

        // Touch gestures (swipe left/right), and tap to reveal HUD handled by HUD.
        document.addEventListener('touchstart', (e) => {
            const state = store.getState();
            if (state.editor.mode !== 'presentation') return;
            if (e.touches.length !== 1) {
                this._touchStart = null;
                return;
            }
            const t = e.touches[0];
            this._touchStart = { x: t.clientX, y: t.clientY, time: performance.now() };
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            const state = store.getState();
            if (state.editor.mode !== 'presentation') return;
            if (!this._touchStart) return;

            // Don't navigate when overlays/grid are showing.
            if (state.presentation.blackScreen || state.presentation.whiteScreen || state.presentation.gridView) {
                this._touchStart = null;
                return;
            }

            const t = e.changedTouches[0];
            if (!t) return;

            const endTime = performance.now();
            const dx = t.clientX - this._touchStart.x;
            const dy = t.clientY - this._touchStart.y;
            const duration = endTime - this._touchStart.time;

            // Defaults from spec.
            const minDistance = 50;
            const maxDuration = 500;
            const maxVerticalDeviation = 30;

            this._touchStart = null;

            if (duration > maxDuration) return;
            if (Math.abs(dx) < minDistance) return;
            if (Math.abs(dy) > maxVerticalDeviation) return;

            if (dx < 0) {
                // Swipe left -> next
                if (state.presentation.buildIndex < state.presentation.buildCount - 1) {
                    store.dispatch('NEXT_BUILD');
                } else {
                    store.dispatch('PRESENTATION_NEXT');
                }
            } else {
                // Swipe right -> prev
                if (state.presentation.buildIndex > -1) {
                    store.dispatch('PREV_BUILD');
                } else {
                    store.dispatch('PRESENTATION_PREV');
                }
            }
        }, { passive: true });

        // Handle fullscreen change (user pressed Esc or F11)
        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) {
                // If we exited fullscreen externally, remain in presentation mode
                // (spec: continue presenting windowed and allow re-request).
                const state = store.getState();
                if (state.editor.mode === 'presentation') {
                    this.updateScale();
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

            if (state.editor.mode === 'presentation') {
                this._onPointerActivity();
            }
        });
        
        // Mouse events for CodeFill in presentation mode
        document.addEventListener('mousemove', (e) => {
            this._broadcastPresentationMouse(e, undefined);
        });
        
        document.addEventListener('mousedown', (e) => {
            this._broadcastPresentationMouse(e, true);
        });
        
        document.addEventListener('mouseup', (e) => {
            this._broadcastPresentationMouse(e, false);
        });
    }

    _onPointerActivity() {
        // Show cursor and start idle-hide timer (spec: hide cursor after inactivity)
        cursorManager.show('presentation-idle');

        if (this._idleCursorTimer) {
            clearTimeout(this._idleCursorTimer);
        }

        this._idleCursorTimer = setTimeout(() => {
            const state = store.getState();
            if (state.editor.mode === 'presentation') {
                cursorManager.hide('presentation-idle');
            }
        }, 5000);
    }

    _gotoSlideNumber(slideNumber) {
        const state = store.getState();
        const slideCount = state.slideOrder?.length ?? 0;
        if (!Number.isInteger(slideNumber)) return;
        if (slideNumber < 1 || slideNumber > slideCount) {
            console.warn(`Invalid slide number ${slideNumber} (count=${slideCount})`);
            return;
        }
        store.dispatch('PRESENTATION_GOTO', slideNumber - 1);
    }
    
    /**
     * Broadcast mouse state to CodeFill canvases in presentation mode
     * @param {MouseEvent} e - Mouse event
     * @param {boolean|undefined} isDown - Force isDown state
     * @private
     */
    _broadcastPresentationMouse(e, isDown) {
        const state = store.getState();
        if (state.editor.mode !== 'presentation') return;
        
        // Don't broadcast if overlays are showing (black/white screen)
        if (state.presentation.blackScreen || state.presentation.whiteScreen) return;
        
        // Calculate world coordinates using cached scale/offset
        const worldX = (e.clientX - this._presentationOffsetX) / this._presentationScale;
        const worldY = (e.clientY - this._presentationOffsetY) / this._presentationScale;
        
        // Determine button state
        let buttonDown;
        if (isDown !== undefined) {
            buttonDown = isDown;
        } else {
            buttonDown = (e.buttons & 1) === 1;
        }
        
        // Broadcast - never suppressed in presentation mode
        mouseStateManager.setSuppressed(false);
        mouseStateManager.update({
            screenX: e.clientX,
            screenY: e.clientY,
            worldX,
            worldY,
            isDown: buttonDown,
            button: e.button,
            timestamp: performance.now()
        });
    }

    startPresentation() {
        store.dispatch('SET_MODE', 'presentation');
    }

    stopPresentation() {
        this._numericBuffer.cancel();
        cursorManager.show('presentation-idle');
        if (this._idleCursorTimer) {
            clearTimeout(this._idleCursorTimer);
            this._idleCursorTimer = null;
        }
        store.dispatch('SET_MODE', 'edit');
    }

    async enterFullscreen() {
        try {
            if (this.appContainer.requestFullscreen) {
                await this.appContainer.requestFullscreen();
            }
        } catch (err) {
            // Fullscreen may be blocked (e.g. in automated tests or restrictive browsers).
            // Presentation mode should still work without fullscreen.
            console.warn(`Fullscreen denied. Continuing in windowed mode: ${err.message}`);
        }

        document.body.classList.add('mode-presentation');
        this.updateScale();

        // Start Laser Pointer loop if needed
        this.laserPointer.start();
        this.laserPointer.resize(); // Ensure it fits screen
    }

    exitFullscreen() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
        document.body.classList.remove('mode-presentation');
        document.body.classList.remove('laser-active');
        
        // Reset scale
        if (this.slideContainer) {
            this.slideContainer.style.transform = '';
            this.slideContainer.style.width = '';
            this.slideContainer.style.height = '';
            this.slideContainer.style.position = '';
            this.slideContainer.style.top = '';
            this.slideContainer.style.left = '';
        }

        // Reset inner layers to neutral state (remove Presentation Mode transforms)
        const contentLayer = document.getElementById('slide-content');
        const backgroundLayer = document.getElementById('slide-background');
        
        if (contentLayer) {
            contentLayer.style.transform = '';
            contentLayer.style.transformOrigin = '';
            contentLayer.style.width = '';
            contentLayer.style.height = '';
            contentLayer.style.top = '';
            contentLayer.style.left = '';
        }
        
        if (backgroundLayer) {
            backgroundLayer.style.transform = '';
            backgroundLayer.style.transformOrigin = '';
            backgroundLayer.style.width = '';
            backgroundLayer.style.height = '';
            backgroundLayer.style.top = '';
            backgroundLayer.style.left = '';
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
            
            // Cache values for mouse coordinate calculation
            this._presentationScale = scale;
            this._slideWidth = slideWidth;
            this._slideHeight = slideHeight;
            // Calculate offset (slide is centered)
            this._presentationOffsetX = (windowWidth - slideWidth * scale) / 2;
            this._presentationOffsetY = (windowHeight - slideHeight * scale) / 2;

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

    updateOverlays(presentationState, mode) {
        const blackOverlay = document.getElementById('overlay-black');
        const whiteOverlay = document.getElementById('overlay-white');

        const isPresentation = mode === 'presentation';

        if (blackOverlay) {
            if (isPresentation && presentationState.blackScreen) {
                blackOverlay.classList.remove('hidden');
            } else {
                blackOverlay.classList.add('hidden');
            }
        }

        if (whiteOverlay) {
            if (isPresentation && presentationState.whiteScreen) {
                whiteOverlay.classList.remove('hidden');
            } else {
                whiteOverlay.classList.add('hidden');
            }
        }

        // Laser Pointer Cursor
        if (isPresentation && presentationState.laserPointer) {
            document.body.classList.add('laser-active');
        } else {
            document.body.classList.remove('laser-active');
        }
    }
}
