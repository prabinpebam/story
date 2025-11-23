import { store } from './Store.js';
import { animationManager } from './AnimationManager.js';
import { MeshGradient } from './effects/MeshGradient.js';
import { CodeRunner } from './effects/CodeRunner.js';
import { ColorUtils } from '../utils/ColorUtils.js';

export class SlideRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentSlideId = null;
        this.bgCodeRunner = null;
        this.lastBackground = null;
        this.lastBuildIndex = -1;
        this.buildElements = [];
        this.init();
    }

    init() {
        this.render();
        store.on('state-changed', () => this.render());
    }

    render() {
        const state = store.getState();
        const mode = state.editor.mode;
        const activeId = mode === 'master' ? state.editor.activeMasterId : state.editor.activeSlideId;
        
        // Initial render or Slide Change
        if (this.currentSlideId !== activeId || this.currentMode !== mode) {
            this.handleSlideChange(activeId, mode);
        } else {
            // Update existing slide (e.g. dragging, typing)
            this.updateCurrentSlide();
        }

        // Check for Build Index Change in Presentation Mode
        if (mode === 'presentation' && state.presentation.buildIndex !== this.lastBuildIndex) {
            this.playBuild(state.presentation.buildIndex);
            this.lastBuildIndex = state.presentation.buildIndex;
        }
    }

    playBuild(index) {
        if (index === -1) {
            // Reset logic if needed (e.g. going back to start of slide)
            // For now, we assume we just hide everything again if we go back to -1, 
            // but PREV_BUILD usually decrements. 
            // If we jump to -1, we should hide all builds.
            this.buildElements.forEach(el => {
                const domEl = this.container.querySelector(`#${el.id}`);
                if (domEl) domEl.style.opacity = 0;
            });
            return;
        }

        // If we are moving forward (index > lastBuildIndex), play the new build
        // If we are moving backward, we might need to "undo" the build?
        // For now, let's just handle forward play.
        // To handle backward, we'd need to reset the element to hidden.
        
        if (index < this.lastBuildIndex) {
            // Moving backward: Hide the element that was at lastBuildIndex
            const el = this.buildElements[this.lastBuildIndex];
            if (el) {
                const domEl = this.container.querySelector(`#${el.id}`);
                if (domEl) {
                    domEl.style.opacity = 0;
                    // Also cancel animation?
                    if (window.anime) window.anime.remove(domEl);
                }
            }
            return;
        }

        const el = this.buildElements[index];
        if (el) {
            const domEl = this.container.querySelector(`#${el.id}`);
            if (domEl) {
                animationManager.playElementAnimation(domEl, el.animations);
            }
        }
    }

    handleSlideChange(id, mode) {
        const state = store.getState();
        let slide;

        if (mode === 'master') {
            // Find Master or Layout
            const masters = state.masters;
            if (masters[id]) {
                slide = { ...masters[id] };
                // Masters might not have explicit dimensions, default to FHD
                if (!slide.width) slide.width = 1920;
                if (!slide.height) slide.height = 1080;
            }
        } else {
            slide = state.slides[id];
        }

        if (!slide) return;

        // Ensure container has dimensions
        this.container.style.width = `${slide.width}px`;
        this.container.style.height = `${slide.height}px`;

        // Create new view
        const newView = this.createSlideDOM(slide, mode);
        
        // Find old view
        const oldView = this.container.querySelector('.slide-view');

        // Check if we are just switching modes on the same slide
        const isModeSwitchOnly = (this.currentSlideId === id && this.currentMode !== mode);

        if (oldView && this.currentSlideId && !isModeSwitchOnly) {
            // Use the transition defined on the NEW slide (how it enters)
            const transitionType = slide.transition || 'fade';
            animationManager.transition(this.container, oldView, newView, transitionType).then(() => {
                this.playEntranceAnimations(slide, newView);
            });
        } else {
            // Force cleanup of everything in the container
            this.container.innerHTML = '';
            while (this.container.firstChild) {
                this.container.removeChild(this.container.firstChild);
            }
            
            // Also remove any potential ghost containers that might have been left outside
            const ghosts = document.querySelectorAll('.ghost-container');
            ghosts.forEach(g => g.remove());

            this.container.appendChild(newView);
            this.playEntranceAnimations(slide, newView);

            // FIX: If we just switched to EDIT mode, force a re-render after a short delay
            // This ensures that any layout/scaling artifacts from Presentation mode are cleared
            // and the Edit view is rendered correctly in its final container state.
            // We wait 200ms to allow CanvasManager.fitToView (100ms) to complete its transform.
            if (mode === 'edit' && isModeSwitchOnly) {
                setTimeout(() => {
                    requestAnimationFrame(() => {
                        // Double check we are still in edit mode and on the same slide
                        const state = store.getState();
                        if (state.editor.mode === 'edit' && state.editor.activeSlideId === id) {
                            this.forceRerender(id, mode);
                        }
                    });
                }, 200);
            }
        }

        this.currentSlideId = id;
        this.currentMode = mode;

        // Calculate Builds for Presentation Mode
        if (mode === 'presentation') {
            const effectiveSlide = this.getEffectiveSlideData(slide.id, mode);
            if (effectiveSlide && effectiveSlide.effectiveElements) {
                this.buildElements = Object.values(effectiveSlide.effectiveElements)
                    .filter(el => el.animations && el.animations.entrance && el.animations.entrance !== 'none')
                    .sort((a, b) => {
                        const order = effectiveSlide.effectiveOrder || [];
                        return order.indexOf(a.id) - order.indexOf(b.id);
                    });
                
                store.dispatch('SET_BUILD_COUNT', this.buildElements.length);
                this.lastBuildIndex = -1;
            } else {
                this.buildElements = [];
                store.dispatch('SET_BUILD_COUNT', 0);
            }
        } else {
            this.buildElements = [];
        }
    }

    forceRerender(id, mode) {
        const state = store.getState();
        const slide = state.slides[id];
        if (!slide) return;

        // Clear container completely
        this.container.innerHTML = '';
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }
        
        // Re-create view
        const newView = this.createSlideDOM(slide, mode);
        this.container.appendChild(newView);
        
        // Redundant Update: Call updateCurrentSlide to ensure any state discrepancies 
        // between creation and current state are resolved (this mimics the "click fixes it" behavior)
        this.updateCurrentSlide();
    }

    playEntranceAnimations(slide, view) {
        const state = store.getState();
        if (state.editor.mode === 'presentation') {
            // Hide all build elements initially
            this.buildElements.forEach(el => {
                const domEl = view.querySelector(`#${el.id}`);
                if (domEl) domEl.style.opacity = 0;
            });
            return; // Don't play yet
        }

        const effectiveSlide = this.getEffectiveSlideData(slide.id, this.currentMode);
        if (!effectiveSlide || !effectiveSlide.effectiveElements) return;
        
        Object.values(effectiveSlide.effectiveElements).forEach(el => {
            if (el.animations && el.animations.entrance && el.animations.entrance !== 'none') {
                const domEl = view.querySelector(`#${el.id}`);
                if (domEl) {
                    animationManager.playElementAnimation(domEl, el.animations);
                }
            }
        });
    }

    updateCurrentSlide() {
        const effectiveSlide = this.getEffectiveSlideData(this.currentSlideId, this.currentMode);
        if (!effectiveSlide) return;

        // Ensure container has dimensions
        this.container.style.width = `${effectiveSlide.width}px`;
        this.container.style.height = `${effectiveSlide.height}px`;

        // Target the specific view for this slide
        const view = this.container.querySelector(`#view-${this.currentSlideId}`);
        if (!view) return;

        // Inject Theme Variables (Update)
        if (effectiveSlide.themeSettings) {
            const { colors, fonts } = effectiveSlide.themeSettings;
            if (colors) {
                if (colors.accent) view.style.setProperty('--theme-accent', colors.accent);
                if (colors.textPrimary) view.style.setProperty('--theme-text-primary', colors.textPrimary);
                if (colors.textSecondary) view.style.setProperty('--theme-text-secondary', colors.textSecondary);
            }
            if (fonts) {
                if (fonts.heading) view.style.setProperty('--theme-font-heading', fonts.heading);
                if (fonts.body) view.style.setProperty('--theme-font-body', fonts.body);
            }
        }

        // Update View Dimensions
        view.style.width = `${effectiveSlide.width}px`;
        view.style.height = `${effectiveSlide.height}px`;

        // Update Background
        // Check if background changed to avoid restarting code runner unnecessarily
        if (!this.lastBackground || 
            this.lastBackground.type !== effectiveSlide.effectiveBackground.type || 
            this.lastBackground.value !== effectiveSlide.effectiveBackground.value) {
            
            this.applyBackgroundToView(view, effectiveSlide.effectiveBackground);
            this.lastBackground = { ...effectiveSlide.effectiveBackground };
        }
        
        // Only select direct children to avoid removing nested group elements
        const existingEls = Array.from(view.children).filter(el => el.classList.contains('slide-element'));
        
        // Robust Map: Handle duplicates by keeping only the first occurrence in the map
        // and marking duplicates for removal
        const existingMap = new Map();
        const duplicates = [];
        
        existingEls.forEach(el => {
            if (existingMap.has(el.id)) {
                duplicates.push(el);
            } else {
                existingMap.set(el.id, el);
            }
        });
        
        // Remove duplicates immediately
        duplicates.forEach(el => el.remove());
        
        effectiveSlide.effectiveOrder.forEach(id => {
            const el = effectiveSlide.effectiveElements[id];
            const domEl = existingMap.get(id);
            
            if (domEl) {
                // Update properties
                this.updateElementDOM(domEl, el, effectiveSlide);
                existingMap.delete(id);
                
                // Ensure Shadow Element is attached and ordered correctly
                if (domEl._shadowEl) {
                    view.appendChild(domEl._shadowEl);
                }
                
                // Ensure DOM order matches elementOrder
                view.appendChild(domEl);
            } else {
                // Create new
                const newDomEl = this.createElementDOM(el, effectiveSlide);
                
                // Ensure Shadow Element is attached
                if (newDomEl._shadowEl) {
                    view.appendChild(newDomEl._shadowEl);
                }
                
                view.appendChild(newDomEl);
            }
        });
        
        // Remove deleted
        existingMap.forEach(domEl => {
            if (domEl._shadowEl) domEl._shadowEl.remove();
            domEl.remove();
        });
    }

    updateElementDOM(div, el, slide) {
        const state = store.getState();
        const isEditing = state.editor.editingElementId === el.id;

        // Ensure we don't have any lingering stroke layers from previous renders/clones
        // This is critical for mode switching where elements might be re-created or cloned
        if (!div._strokeLayers) {
            div._strokeLayers = [];
            const orphans = Array.from(div.children).filter(c => c.classList.contains('stroke-layer'));
            orphans.forEach(l => l.remove());
        }

        // Update position, size, transform
        div.style.left = `${el.x}px`;
        div.style.top = `${el.y}px`;
        div.style.width = `${el.width}px`;
        div.style.height = `${el.height}px`;
        div.style.transform = `rotate(${el.rotation || 0}deg)`;
        div.style.opacity = (el.opacity !== undefined && el.opacity !== null) ? el.opacity : 1;
        div.style.zIndex = isEditing ? '1000' : (el.zIndex || 'auto');
        
        // Visibility
        div.style.display = el.hidden ? 'none' : 'block';
        
        // Blend Mode
        div.style.mixBlendMode = el.blendMode || 'normal';
        
        // Border Radius (Root or Style)
        const radius = el.borderRadius || el.style?.radius || 0;
        div.style.borderRadius = `${radius}px`;

        // Apply Effects (Shadow)
        if (el.style?.dropShadow && el.style.dropShadow.visible !== false) {
            const { x, y, blur, spread, color, blendMode } = el.style.dropShadow;
            
            // If blend mode is used (and not normal), we need a separate shadow element
            if (blendMode && blendMode !== 'normal') {
                // Remove standard shadow
                div.style.boxShadow = 'none';
                div.style.textShadow = 'none';

                // Create or update shadow element
                let shadowEl = div._shadowEl;
                if (!shadowEl) {
                    shadowEl = document.createElement('div');
                    shadowEl.className = 'element-shadow';
                    shadowEl.style.position = 'absolute';
                    shadowEl.style.pointerEvents = 'none'; // Pass through clicks
                    div._shadowEl = shadowEl;
                    // Insert BEFORE the element in the parent container
                    if (div.parentNode) {
                        div.parentNode.insertBefore(shadowEl, div);
                    }
                } else {
                    // Ensure it's in the DOM
                    if (!shadowEl.parentNode && div.parentNode) {
                        div.parentNode.insertBefore(shadowEl, div);
                    }
                }

                // Sync geometry with main element
                shadowEl.style.left = div.style.left;
                shadowEl.style.top = div.style.top;
                shadowEl.style.width = div.style.width;
                shadowEl.style.height = div.style.height;
                shadowEl.style.transform = div.style.transform;
                shadowEl.style.borderRadius = div.style.borderRadius;
                shadowEl.style.zIndex = div.style.zIndex; // Same z-index, but DOM order puts it behind
                
                // Apply Shadow & Blend Mode
                shadowEl.style.mixBlendMode = blendMode;
                shadowEl.style.boxShadow = `${x}px ${y}px ${blur}px ${spread}px ${color}`;
                
                // For text, we might need a different approach (duplicate text), 
                // but for now let's support box-shadow blending which is the main use case for shapes.
                if (el.type === 'text') {
                    // Text shadow blending is very hard without duplicating content.
                    // Fallback to standard text-shadow on the element for now, ignoring blend mode
                    div.style.textShadow = `${x}px ${y}px ${blur}px ${color}`;
                    shadowEl.style.display = 'none';
                } else {
                    shadowEl.style.display = 'block';
                }

            } else {
                // Standard Shadow (No Blend Mode)
                if (div._shadowEl) {
                    div._shadowEl.remove();
                    delete div._shadowEl;
                }

                if (el.type === 'text') {
                    div.style.textShadow = `${x}px ${y}px ${blur}px ${color}`;
                    div.style.boxShadow = 'none';
                } else {
                    div.style.boxShadow = `${x}px ${y}px ${blur}px ${spread}px ${color}`;
                    div.style.textShadow = 'none';
                }
            }
        } else {
            div.style.boxShadow = 'none';
            div.style.textShadow = 'none';
            if (div._shadowEl) {
                div._shadowEl.remove();
                delete div._shadowEl;
            }
        }

        // Apply Effects (Blur)
        const blur = el.style?.blur;
        if (blur && blur.visible !== false) {
            const radius = (typeof blur === 'object') ? blur.radius : blur;
            div.style.filter = `blur(${radius}px)`;
        } else {
            div.style.filter = 'none';
        }

        // Apply Effects (Background Blur)
        const bgBlur = el.style?.backgroundBlur;
        if (bgBlur && bgBlur.visible !== false) {
            const radius = (typeof bgBlur === 'object') ? bgBlur.radius : bgBlur;
            div.style.backdropFilter = `blur(${radius}px)`;
            div.style.webkitBackdropFilter = `blur(${radius}px)`;
        } else {
            div.style.backdropFilter = 'none';
            div.style.webkitBackdropFilter = 'none';
        }

        if (el.type === 'group') {
            // Reconcile children
            const existingChildren = Array.from(div.children);
            const existingMap = new Map(existingChildren.map(c => [c.id, c]));
            
            if (el.children) {
                el.children.forEach(childId => {
                    const child = slide.elements[childId];
                    if (child) {
                        const childDom = existingMap.get(childId);
                        if (childDom) {
                            this.updateElementDOM(childDom, child, slide);
                            existingMap.delete(childId);
                            // Ensure DOM order matches children array
                            div.appendChild(childDom);
                        } else {
                            const newChildDom = this.createElementDOM(child, slide, false);
                            div.appendChild(newChildDom);
                        }
                    }
                });
            }
            
            // Remove deleted children
            existingMap.forEach(c => c.remove());

        } else if (el.type === 'rect') {
             // Handle Mesh Gradient
             if (el.style?.fillType === 'mesh') {
                 if (!div._meshGradient) {
                     // Clear others
                     if (div._codeRunner) { div._codeRunner.stop(); delete div._codeRunner; }
                     div.innerHTML = ''; 
                     
                     const canvas = document.createElement('canvas');
                     canvas.style.width = '100%';
                     canvas.style.height = '100%';
                     canvas.style.borderRadius = `${el.style?.radius || 0}px`;
                     div.appendChild(canvas);
                     const mesh = new MeshGradient(canvas);
                     div._meshGradient = mesh;
                     mesh.play();
                 }
                 if (el.style.meshColors) {
                     div._meshGradient.setColors(el.style.meshColors);
                 }
             } 
             // Handle Code Fill
             else if (el.style?.fillType === 'code') {
                 if (!div._codeRunner) {
                     // Clear others
                     if (div._meshGradient) { div._meshGradient.stop(); delete div._meshGradient; }
                     div.innerHTML = '';

                     const canvas = document.createElement('canvas');
                     canvas.style.width = '100%';
                     canvas.style.height = '100%';
                     canvas.style.borderRadius = 'inherit';
                     canvas.width = el.width;
                     canvas.height = el.height;
                     div.appendChild(canvas);
                     
                     const runner = new CodeRunner(canvas);
                     div._codeRunner = runner;
                     runner.play();
                 }
                 
                 // Update Code
                 const codeToRun = el.style.code || CodeRunner.DEFAULT_CODE;
                 
                 if (div._codeRunner.userCode !== codeToRun) {
                     div._codeRunner.setCode(codeToRun);
                 }
                 
                 // Update Canvas Size if changed
                 if (div._codeRunner) {
                     div._codeRunner.resize(el.width, el.height);
                 }

             } else {
                 // Clear complex fills
                 if (div._meshGradient) {
                     div._meshGradient.stop();
                     delete div._meshGradient;
                     div.innerHTML = '';
                 }
                 if (div._codeRunner) {
                     div._codeRunner.stop();
                     delete div._codeRunner;
                     div.innerHTML = '';
                 }
                 
                 // Handle Multiple Fills
                 if (el.style?.fills && el.style.fills.length > 0) {
                     // Clear base styles
                     div.style.background = 'transparent';
                     div.style.backgroundImage = 'none';
                     
                     const fills = el.style.fills;
                     // Filter out stroke layers to only get fill layers
                     const fillLayers = Array.from(div.children).filter(c => !c.classList.contains('stroke-layer'));
                     
                     // Reconcile layers
                     fills.forEach((fill, index) => {
                         let layer = fillLayers[index];
                         if (!layer) {
                             layer = document.createElement('div');
                             layer.className = 'fill-layer';
                             layer.style.position = 'absolute';
                             layer.style.top = '0';
                             layer.style.left = '0';
                             layer.style.width = '100%';
                             layer.style.height = '100%';
                             // Inherit border radius
                             layer.style.borderRadius = 'inherit'; 
                             layer.style.overflow = 'hidden';
                             div.appendChild(layer);
                         }
                         
                         // Stack order: fills[0] is top
                         layer.style.zIndex = fills.length - index;
                         layer.style.display = fill.visible ? 'block' : 'none';
                         layer.style.opacity = (fill.opacity !== undefined) ? fill.opacity / 100 : 1;
                         layer.style.mixBlendMode = fill.blendMode || 'normal';
                         
                         // Reset layer styles
                         layer.style.background = 'transparent';
                         layer.style.backgroundImage = 'none';
                         
                         if (fill.type === 'code') {
                             if (!layer._codeRunner) {
                                 layer.innerHTML = ''; 
                                 const canvas = document.createElement('canvas');
                                 canvas.style.width = '100%';
                                 canvas.style.height = '100%';
                                 canvas.width = el.width;
                                 canvas.height = el.height;
                                 layer.appendChild(canvas);
                                 layer._codeRunner = new CodeRunner(canvas);
                                 layer._codeRunner.play();
                             }
                             
                             const code = fill.code || CodeRunner.DEFAULT_CODE;
                             if (layer._codeRunner.userCode !== code) {
                                 layer._codeRunner.setCode(code);
                             }
                             layer._codeRunner.resize(el.width, el.height);
                             
                         } else {
                             if (layer._codeRunner) {
                                 layer._codeRunner.stop();
                                 delete layer._codeRunner;
                                 layer.innerHTML = '';
                             }

                             // Remove any existing diamond gradient canvas if we are not in diamond mode
                             // We do this check inside each block or just once here?
                             // If we are in diamond mode, renderDiamondGradient will handle removal/update.
                             // If we are NOT in diamond mode, we must remove it.
                             const existingCanvas = layer.querySelector('.bg-canvas');
                             if (existingCanvas && (!fill.value || !fill.value.startsWith('/* diamond|'))) {
                                 existingCanvas.remove();
                             }
                             
                             if (fill.type === 'solid') {
                                 layer.style.backgroundColor = fill.color;
                             } else if (fill.type === 'gradient') {
                                 if (fill.value.startsWith('/* diamond|')) {
                                     const metaEnd = fill.value.indexOf('*/');
                                     if (metaEnd > -1) {
                                         const meta = fill.value.substring(11, metaEnd).trim();
                                         const parts = meta.split('|');
                                         const angle = parseFloat(parts[0] || '0');
                                         const stopsStr = parts[1] || '';
                                         const stops = stopsStr.split(';').map(s => {
                                             const [color, pos] = s.split('@');
                                             return { color, position: parseFloat(pos) };
                                         }).filter(s => s.color && !isNaN(s.position));
                                         
                                         this.renderDiamondGradient(layer, el.width, el.height, angle, stops);
                                     }
                                 } else {
                                     layer.style.background = fill.value;
                                 }
                             } else if (fill.type === 'image') {
                                 layer.style.backgroundImage = `url(${fill.value})`;
                                 layer.style.backgroundSize = fill.scaleMode || 'cover';
                                 layer.style.backgroundPosition = 'center';
                                 layer.style.backgroundRepeat = 'no-repeat';
                             }
                         }
                     });
                     
                     // Remove extra layers
                     for (let i = fills.length; i < fillLayers.length; i++) {
                         const layer = fillLayers[i];
                         if (layer._codeRunner) layer._codeRunner.stop();
                         layer.remove();
                     }
                     
                 } else {
                     // Legacy / Single Fill Fallback
                     if (el.style?.fillType === 'gradient') {
                        div.style.background = el.style.fillValue;
                     } else if (el.style?.fillType === 'image') {
                        div.style.backgroundImage = `url(${el.style.fillValue})`;
                        div.style.backgroundSize = el.style.fillScaleMode || 'cover';
                        div.style.backgroundPosition = 'center';
                        div.style.backgroundRepeat = 'no-repeat';
                        div.style.backgroundColor = '#D9D9D9'; 
                     } else {
                        div.style.background = el.style?.backgroundColor || '#D9D9D9';
                        div.style.backgroundImage = '';
                     }
                 }
             }
             
             // div.style.borderRadius handled at top

             // Handle Strokes
             if (el.style?.strokes && el.style.strokes.length > 0) {
                 // Clear legacy
                 div.style.borderWidth = '0px';
                 div.style.outline = 'none';
                 
                 // Manage stroke layers
                 if (!div._strokeLayers) {
                     div._strokeLayers = [];
                     // Safety: Remove orphaned stroke layers (e.g. from cloning) to prevent duplicates
                     const orphans = Array.from(div.children).filter(c => c.classList.contains('stroke-layer'));
                     orphans.forEach(l => l.remove());
                 }
                 
                 const strokes = el.style.strokes;
                 
                 // Reconcile
                 strokes.forEach((stroke, index) => {
                     let layer = div._strokeLayers[index];
                     
                     // Create if missing or wrong type (we switched from div to svg)
                     if (!layer || layer.tagName !== 'svg') {
                         if (layer) layer.remove();
                         layer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                         layer.setAttribute('class', 'stroke-layer');
                         layer.style.position = 'absolute';
                         layer.style.pointerEvents = 'none'; // Let clicks pass through
                         layer.style.overflow = 'visible';
                         
                         const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                         layer.appendChild(rect);
                         
                         div._strokeLayers[index] = layer;
                     }
                     
                     // Ensure attached
                     if (layer.parentNode !== div) {
                         div.appendChild(layer);
                     }
                     
                     // Apply Properties
                     layer.style.display = stroke.visible === false ? 'none' : 'block';
                     layer.style.opacity = (stroke.opacity !== undefined) ? stroke.opacity / 100 : 1;
                     layer.style.mixBlendMode = stroke.blendMode || 'normal';
                     layer.style.zIndex = 100 + (strokes.length - index);

                     let rect = layer.querySelector('rect');
                     if (!rect) {
                         rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                         layer.appendChild(rect);
                     }

                     const width = stroke.width || 0;
                     const color = stroke.color || 'transparent';
                     const align = stroke.position || 'center';
                     const radius = el.borderRadius || el.style?.radius || 0;
                     
                     // Stroke Attributes
                     const isGradient = stroke.type === 'gradient';
                     const gradientValue = stroke.value || 'linear-gradient(90deg, #000000 0%, #ffffff 100%)';

                     if (isGradient && gradientValue) {
                         // Use a unique ID that changes with the value to force browser re-render
                         // Simple hash of the value string or just a timestamp/counter
                         const valueHash = gradientValue.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
                         const gradId = `stroke-grad-${el.id}-${index}-${valueHash}`;
                         
                         let defs = layer.querySelector('defs');
                         if (!defs) {
                             defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                             layer.insertBefore(defs, layer.firstChild);
                         }
                         
                         // Only update if needed (though hash check implies it changed)
                         // But we need to ensure the element exists in DOM
                         const existingGrad = defs.querySelector(`#${gradId}`);
                         if (!existingGrad) {
                             const gradEl = this.createSVGGradient(gradId, gradientValue);
                             defs.innerHTML = '';
                             defs.appendChild(gradEl);
                         }
                         
                         rect.setAttribute('stroke', `url(#${gradId})`);
                     } else {
                         rect.setAttribute('stroke', color);
                         const defs = layer.querySelector('defs');
                         if (defs) defs.remove();
                     }

                     rect.setAttribute('stroke-width', width);
                     rect.setAttribute('fill', 'none');
                     
                     // Dash Array & Cap
                     let dashArray = 'none';
                     if (stroke.style === 'dashed') {
                         dashArray = stroke.dashArray ? stroke.dashArray.replace(/,/g, ' ') : '4 4';
                     } else if (stroke.style === 'dotted') {
                         dashArray = stroke.dashArray ? stroke.dashArray.replace(/,/g, ' ') : '1 3';
                     } else if (stroke.style === 'custom') {
                         dashArray = stroke.dashArray ? stroke.dashArray.replace(/,/g, ' ') : 'none';
                     }
                     rect.setAttribute('stroke-dasharray', dashArray);
                     rect.setAttribute('stroke-linecap', stroke.dashCap || 'butt');
                     rect.setAttribute('stroke-linejoin', stroke.join || 'miter');
                     if (stroke.join === 'miter') {
                         rect.setAttribute('stroke-miterlimit', stroke.miterLimit || 4);
                     }

                     // Geometry & Positioning
                     layer.style.left = '0';
                     layer.style.top = '0';
                     layer.style.width = '100%';
                     layer.style.height = '100%';
                     
                     // Calculate Rect Geometry based on Alignment
                     let x, y, w, h, rx;
                     
                     if (align === 'inside') {
                         const inset = width / 2;
                         x = inset;
                         y = inset;
                         w = el.width - width;
                         h = el.height - width;
                         rx = Math.max(0, radius - inset);
                     } else if (align === 'outside') {
                         const outset = width / 2;
                         x = -outset;
                         y = -outset;
                         w = el.width + width;
                         h = el.height + width;
                         rx = radius + outset;
                     } else { // center
                         x = 0;
                         y = 0;
                         w = el.width;
                         h = el.height;
                         rx = radius;
                     }
                     
                     rect.setAttribute('x', x);
                     rect.setAttribute('y', y);
                     rect.setAttribute('width', Math.max(0, w));
                     rect.setAttribute('height', Math.max(0, h));
                     rect.setAttribute('rx', rx);
                     rect.setAttribute('ry', rx);
                 });
                 
                 // Cleanup extra layers
                 while (div._strokeLayers.length > strokes.length) {
                     const layer = div._strokeLayers.pop();
                     layer.remove();
                 }
                 
                 // Double Safety: Remove any stroke layers that are not in our tracked list
                 const trackedLayers = new Set(div._strokeLayers);
                 Array.from(div.children).forEach(child => {
                     if (child.classList.contains('stroke-layer') && !trackedLayers.has(child)) {
                         child.remove();
                     }
                 });
                 
             } else {
                 // Cleanup stroke layers if switching to legacy/none
                 if (div._strokeLayers) {
                     div._strokeLayers.forEach(l => l.remove());
                     div._strokeLayers = [];
                 }
                 
                 // Safety: Remove any remaining stroke layers (orphaned or from clone)
                 const orphans = Array.from(div.children).filter(c => c.classList.contains('stroke-layer'));
                 orphans.forEach(l => l.remove());

                 // Handle Stroke Alignment (Legacy)
                 const borderWidth = el.style?.borderWidth || 0;
                 const borderStyle = el.style?.borderStyle || 'solid';
                 const borderColor = el.style?.borderColor || 'transparent';
                 const strokeAlign = el.style?.strokeAlign || 'inside';

                 if (borderWidth > 0) {
                     if (strokeAlign === 'inside') {
                         div.style.borderWidth = `${borderWidth}px`;
                         div.style.borderStyle = borderStyle;
                         div.style.borderColor = borderColor;
                         div.style.outline = 'none';
                     } else if (strokeAlign === 'outside') {
                         div.style.borderWidth = '0px';
                         div.style.outlineWidth = `${borderWidth}px`;
                         div.style.outlineStyle = borderStyle;
                         div.style.outlineColor = borderColor;
                         div.style.outlineOffset = '0px';
                     } else if (strokeAlign === 'center') {
                         div.style.borderWidth = '0px';
                         div.style.outlineWidth = `${borderWidth}px`;
                         div.style.outlineStyle = borderStyle;
                         div.style.outlineColor = borderColor;
                         div.style.outlineOffset = `-${borderWidth / 2}px`;
                     }
                 } else {
                     div.style.borderWidth = '0px';
                     div.style.outline = 'none';
                 }
             }
             
        } else if (el.type === 'text') {
            // Only update if not editing (to avoid cursor jumping)
            const state = store.getState();
            if (state.editor.editingElementId !== el.id) {
                div.innerHTML = el.content;
                div.style.fontFamily = el.style?.fontFamily || 'Inter';
                div.style.fontSize = `${el.style?.fontSize || 16}px`;
                div.style.fontWeight = el.style?.fontWeight || '400';
                div.style.lineHeight = el.style?.lineHeight || '1.2';
                div.style.letterSpacing = `${el.style?.letterSpacing || 0}px`;
                div.style.color = el.style?.color || 'black';
                div.style.textAlign = el.style?.textAlign || 'left';
            }
        } else if (el.type === 'image') {
            const img = div.querySelector('img');
            if (img && img.src !== el.src) {
                img.src = el.src;
            }
            if (img) {
                const radius = el.borderRadius || el.style?.radius || 0;
                img.style.borderRadius = `${radius}px`;
            }
        }
    }

    getEffectiveSlideData(id, mode) {
        if (mode === 'master') {
            const state = store.getState();
            const masters = state.masters;
            const item = masters[id];
            
            if (!item) return null;

            if (item.type === 'theme') {
                // It is a master theme
                return {
                    ...item,
                    width: item.width || 1920,
                    height: item.height || 1080,
                    effectiveBackground: item.background || { type: 'solid', value: '#ffffff' },
                    effectiveElements: item.elements,
                    effectiveOrder: item.elementOrder || [],
                    themeSettings: item.themeSettings
                };
            } else if (item.type === 'layout') {
                // It is a layout, inherits from parentId
                const masterId = item.parentId;
                const master = masters[masterId];
                
                // Merge Master elements + Layout elements
                // Note: Master elements should be behind Layout elements
                // We need to be careful about ID collisions, but usually they are distinct
                
                const effectiveElements = { ...master.elements, ...item.elements };
                const effectiveOrder = [...(master.elementOrder || []), ...(item.elementOrder || [])];
                
                // Background inheritance
                let effectiveBackground = item.background;
                if (!effectiveBackground || effectiveBackground.type === 'inherited') {
                    effectiveBackground = master.background;
                }
                
                // Fallback if master background is also missing/inherited (shouldn't happen for theme, but safe)
                if (!effectiveBackground || effectiveBackground.type === 'inherited') {
                    effectiveBackground = { type: 'solid', value: '#ffffff' };
                }

                return {
                    ...item,
                    width: item.width || 1920,
                    height: item.height || 1080,
                    effectiveBackground,
                    effectiveElements,
                    effectiveOrder,
                    themeSettings: master.themeSettings
                };
            }
            return null;
        } else {
            return store.getEffectiveSlide(id);
        }
    }

    createSlideDOM(slide, mode) {
        const effectiveSlide = this.getEffectiveSlideData(slide.id, mode || this.currentMode);
        if (!effectiveSlide) return document.createElement('div');

        const div = document.createElement('div');
        div.className = 'slide-view';
        div.id = `view-${slide.id}`;
        div.style.width = `${effectiveSlide.width}px`;
        div.style.height = `${effectiveSlide.height}px`;
        div.style.position = 'absolute';
        div.style.top = '0';
        div.style.left = '0';
        // div.style.overflow = 'hidden'; // Allow content to overflow
        div.style.backgroundColor = '#ffffff'; // Default

        // Inject Theme Variables
        if (effectiveSlide.themeSettings) {
            const { colors, fonts } = effectiveSlide.themeSettings;
            if (colors) {
                if (colors.accent) div.style.setProperty('--theme-accent', colors.accent);
                if (colors.textPrimary) div.style.setProperty('--theme-text-primary', colors.textPrimary);
                if (colors.textSecondary) div.style.setProperty('--theme-text-secondary', colors.textSecondary);
            }
            if (fonts) {
                if (fonts.heading) div.style.setProperty('--theme-font-heading', fonts.heading);
                if (fonts.body) div.style.setProperty('--theme-font-body', fonts.body);
            }
        }

        this.applyBackgroundToView(div, effectiveSlide.effectiveBackground);
        this.renderElementsToView(div, effectiveSlide);

        return div;
    }

    renderDiamondGradient(container, width, height, angle, stops) {
        // Clear container
        // container.innerHTML = ''; // Don't clear everything, might remove other children? 
        // For background view, it has children (elements). We should insert canvas at bottom.
        // For element layer, it's empty or has canvas.
        
        // Remove existing canvas
        const existing = container.querySelector('.bg-canvas');
        if (existing) existing.remove();

        const canvas = document.createElement('canvas');
        canvas.className = 'bg-canvas';
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.zIndex = '0'; // Behind content
        
        // Insert as first child
        if (container.firstChild) {
            container.insertBefore(canvas, container.firstChild);
        } else {
            container.appendChild(canvas);
        }

        const ctx = canvas.getContext('2d');
        const cx = width / 2;
        const cy = height / 2;

        // 1. Calculate Max Distance (L1) to cover the viewport
        // We need to check the 4 corners of the viewport in the rotated space
        const rad = -angle * Math.PI / 180; // Inverse rotation to map viewport to diamond space
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        
        const corners = [
            { x: -cx, y: -cy },
            { x: cx, y: -cy },
            { x: -cx, y: cy },
            { x: cx, y: cy }
        ];
        
        let maxDist = 0;
        corners.forEach(p => {
            const rx = p.x * cos - p.y * sin;
            const ry = p.x * sin + p.y * cos;
            const dist = Math.abs(rx) + Math.abs(ry);
            if (dist > maxDist) maxDist = dist;
        });

        // 2. Create Gradient
        // The gradient goes from (0,0) to (L, L) where L = maxDist / 2
        // This corresponds to the diagonal of the diamond quadrant
        const L = maxDist / 2;
        const grad = ctx.createLinearGradient(0, 0, L, L);
        
        // Sort stops
        const sortedStops = [...stops].sort((a, b) => a.position - b.position);
        sortedStops.forEach(stop => {
            grad.addColorStop(stop.position / 100, stop.color);
        });

        // 3. Draw 4 Quadrants
        ctx.translate(cx, cy);
        ctx.rotate(angle * Math.PI / 180); // User rotation

        const size = Math.max(width, height) * 2; // Large enough to cover

        for (let i = 0; i < 4; i++) {
            ctx.save();
            ctx.rotate(i * Math.PI / 2);
            // Draw in the first quadrant (x>0, y>0)
            ctx.fillStyle = grad;
            // Overlap slightly to prevent white lines (gaps) at the axes
            ctx.fillRect(-1, -1, size + 1, size + 1);
            ctx.restore();
        }
    }

    applyBackgroundToView(view, bg) {
        // Clean up previous code runner attached to THIS view
        if (view._bgCodeRunner) {
            view._bgCodeRunner.stop();
            delete view._bgCodeRunner;
        }

        // Remove existing background canvas if any
        const existingCanvas = view.querySelector('.bg-canvas');
        if (existingCanvas) existingCanvas.remove();

        // Reset background style
        view.style.background = 'none';

        // Fallback for null background (safety)
        if (!bg) bg = { type: 'solid', value: '#ffffff' };

        if (bg.type === 'solid') {
            view.style.background = bg.value;
        } else if (bg.type === 'gradient') {
            // Check for Diamond Gradient Metadata
            if (bg.value.startsWith('/* diamond|')) {
                const metaEnd = bg.value.indexOf('*/');
                if (metaEnd > -1) {
                    const meta = bg.value.substring(11, metaEnd).trim();
                    const parts = meta.split('|');
                    const angle = parseFloat(parts[0] || '0');
                    const stopsStr = parts[1] || '';
                    const stops = stopsStr.split(';').map(s => {
                        const [color, pos] = s.split('@');
                        return { color, position: parseFloat(pos) };
                    }).filter(s => s.color && !isNaN(s.position));

                    const w = parseInt(view.style.width) || 1920;
                    const h = parseInt(view.style.height) || 1080;
                    
                    this.renderDiamondGradient(view, w, h, angle, stops);
                    return;
                }
            }
            view.style.background = bg.value;
        } else if (bg.type === 'image') {
            view.style.background = `url(${bg.value}) center/cover no-repeat`;
        } else if (bg.type === 'code') {
            const canvas = document.createElement('canvas');
            canvas.className = 'bg-canvas';
            
            // Ensure width/height are valid numbers
            const w = parseInt(view.style.width) || 1920;
            const h = parseInt(view.style.height) || 1080;
            
            canvas.width = w;
            canvas.height = h;
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.zIndex = '0'; 
            
            view.insertBefore(canvas, view.firstChild);

            const runner = new CodeRunner(canvas);
            runner.setCode(bg.value);
            runner.play();
            
            // Attach runner to the view element
            view._bgCodeRunner = runner;
        }

        // Hide the global background layer since we are doing per-slide background
        const globalBg = document.getElementById('slide-background');
        if (globalBg) globalBg.style.display = 'none';
    }

    renderElementsToView(view, slide) {
        const state = store.getState();
        const editingId = state.editor.editingElementId;

        const elements = slide.effectiveElements || slide.elements;
        const order = slide.effectiveOrder || slide.elementOrder;
        
        // Track rendered IDs to prevent duplicates if order array has duplicates
        const renderedIds = new Set();

        order.forEach(elId => {
            if (renderedIds.has(elId)) return;
            renderedIds.add(elId);

            const el = elements[elId];
            if (el) {
                const isEditing = elId === editingId;
                const domEl = this.createElementDOM(el, slide, isEditing);
                
                // Append Shadow Element if it exists (created in createElementDOM -> updateElementDOM)
                if (domEl._shadowEl) {
                    view.appendChild(domEl._shadowEl);
                }
                
                view.appendChild(domEl);
                
                if (isEditing) {
                    setTimeout(() => domEl.focus(), 0);
                }
            }
        });
    }

    createElementDOM(el, slide, isEditing = false) {
        const div = document.createElement('div');
        div.id = el.id;
        div.className = 'slide-element';

        // Check inheritance
        let isMaster = false;
        if (slide.effectiveElements && slide.elements) {
            // It is a master element if it exists in effectiveElements but NOT in slide.elements
            isMaster = !Object.prototype.hasOwnProperty.call(slide.elements, el.id);
        }

        const state = store.getState();
        const isMasterMode = state.editor.mode === 'master';

        if (isMasterMode && el.isPlaceholder) {
             div.style.border = '2px dashed #999';
             div.classList.add('is-placeholder');
        }

        if (isMaster) {
             div.classList.add('is-master-element');
             
             // Special handling for Placeholders in Edit Mode
             if (!isMasterMode && el.isPlaceholder) {
                 div.classList.add('is-placeholder-instance');
                 div.style.pointerEvents = 'auto'; // Allow interaction
                 div.style.border = '2px dashed #999'; // Visual cue
                 div.dataset.placeholderId = el.id;
             } else {
                 div.style.pointerEvents = 'none';
             }
        }

        div.style.position = 'absolute';
        // Basic properties are set by updateElementDOM
        
        // Initial Update to handle complex logic (like Shadow Elements)
        this.updateElementDOM(div, el, slide);

        if (el.type === 'group') {
            div.style.pointerEvents = 'none'; // Let clicks pass through to children? 
            // Actually, for selection we want to hit the group?
            // But for editing, we might want to hit children.
            // In DOM, if parent has pointer-events: none, children can have auto.
            // But if we want to select the group by clicking anywhere inside, it should be auto.
            // Let's keep default (auto).
            
            if (el.children) {
                el.children.forEach(childId => {
                    const child = (slide.effectiveElements && slide.effectiveElements[childId]) || (slide.elements && slide.elements[childId]);
                    if (child) {
                        const childDom = this.createElementDOM(child, slide, false);
                        div.appendChild(childDom);
                    }
                });
            }
        } else if (el.type === 'text') {
            div.innerHTML = el.content; // Rich text
            div.style.fontFamily = el.style?.fontFamily || 'Inter';
            div.style.fontSize = `${el.style?.fontSize || 16}px`;
            div.style.fontWeight = el.style?.fontWeight || '400';
            div.style.lineHeight = el.style?.lineHeight || '1.2';
            div.style.letterSpacing = `${el.style?.letterSpacing || 0}px`;
            div.style.color = el.style?.color || 'black';
            div.style.textAlign = el.style?.textAlign || 'left';
            
            // Resizing Constraints
            const resizing = el.style?.resizing || 'autoHeight';
            if (resizing === 'autoWidth') {
                div.style.width = 'auto';
                div.style.height = 'auto';
                div.style.whiteSpace = 'nowrap';
            } else if (resizing === 'autoHeight') {
                div.style.height = 'auto';
                div.style.whiteSpace = 'normal';
                div.style.wordWrap = 'break-word';
            } else {
                // Fixed
                div.style.overflow = 'hidden';
            }

            if (isEditing) {
                div.contentEditable = true;
                div.style.outline = '2px solid #0055FF';
                div.style.cursor = 'text';
                div.style.pointerEvents = 'auto'; // Ensure it receives clicks
                
                // Handle Blur -> Save
                div.addEventListener('blur', () => {
                    // Update dimensions based on content
                    const updates = {
                        id: el.id,
                        content: div.innerHTML
                    };
                    
                    if (resizing === 'autoWidth' || resizing === 'autoHeight') {
                        updates.width = div.offsetWidth;
                        updates.height = div.offsetHeight;
                    }
                    
                    store.dispatch('UPDATE_ELEMENT', updates);
                    store.dispatch('SET_EDITING_ELEMENT', null);
                });
                
                // Handle Enter -> Save (optional, maybe Shift+Enter for newline?)
                // For now, let's allow newlines
            }
        } else if (el.type === 'rect') {
            // Fill (Solid, Gradient, Image, Mesh)
            if (el.style?.fillType === 'mesh') {
                const canvas = document.createElement('canvas');
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                canvas.style.borderRadius = `${el.style?.radius || 0}px`;
                div.appendChild(canvas);
                
                const mesh = new MeshGradient(canvas);
                if (el.style.meshColors) {
                    mesh.setColors(el.style.meshColors);
                }
                mesh.play();
                
            } else if (el.style?.fillType === 'code') {
                const canvas = document.createElement('canvas');
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                canvas.style.borderRadius = `${el.style?.radius || 0}px`;
                // Set actual size for canvas
                canvas.width = el.width;
                canvas.height = el.height;
                
                div.appendChild(canvas);
                
                const runner = new CodeRunner(canvas);
                div._codeRunner = runner; // Attach to DOM for updates

                if (el.style.code) {
                    runner.setCode(el.style.code);
                } else {
                    // Default code
                    const defaultCode = `
return {
    draw: function(t) {
        const w = canvas.width;
        const h = canvas.height;
        const grd = ctx.createLinearGradient(0, 0, w, h);
        const c1 = Math.sin(t * 0.5) * 50 + 200;
        const c2 = Math.cos(t * 0.3) * 50 + 200;
        grd.addColorStop(0, \`rgb(\${c1}, 200, 255)\`);
        grd.addColorStop(1, \`rgb(255, \${c2}, 200)\`);
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, w, h);
        for(let i=0; i<5; i++) {
            const x = (Math.sin(t * 0.2 + i) * 0.5 + 0.5) * w;
            const y = (Math.cos(t * 0.3 + i) * 0.5 + 0.5) * h;
            const r = 100 + Math.sin(t + i) * 50;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = \`rgba(255, 255, 255, 0.2)\`;
            ctx.fill();
        }
    }
};`.trim();
                    runner.setCode(defaultCode);
                }
                runner.play();

            } else if (el.style?.fillType === 'gradient') {
                div.style.background = el.style.fillValue || 'linear-gradient(180deg, #D9D9D9 0%, #737373 100%)';
            } else if (el.style?.fillType === 'image') {
                div.style.backgroundImage = `url(${el.style.fillValue})`;
                div.style.backgroundSize = el.style.fillScaleMode || 'cover';
                div.style.backgroundPosition = 'center';
                div.style.backgroundRepeat = 'no-repeat';
                div.style.backgroundColor = '#D9D9D9'; // Fallback
            } else {
                div.style.backgroundColor = el.style?.backgroundColor || '#D9D9D9';
            }
            
            div.style.borderWidth = `${el.style?.borderWidth || 0}px`;
            div.style.borderStyle = el.style?.borderStyle || 'solid';
            div.style.borderColor = el.style?.borderColor || 'transparent';
            // div.style.borderRadius handled at top
        } else if (el.type === 'image') {
            const img = document.createElement('img');
            img.src = el.src;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            const radius = el.borderRadius || el.style?.radius || 0;
            img.style.borderRadius = `${radius}px`;
            img.draggable = false;
            div.appendChild(img);
        }

        // Interaction (Selection) - Only if not editing
        if (!isEditing) {
            div.addEventListener('mousedown', (e) => {
                // e.stopPropagation(); // Let it bubble to canvas? No, canvas is on top.
                // Actually, since canvas is on top (z-index 100), these events might not fire
                // unless we set pointer-events: none on canvas.
                // But we want canvas to handle selection/drag.
                // So this listener might be redundant if canvas covers it.
            });
        }

        return div;
    }

    createSVGGradient(id, gradientString) {
        // Helper to parse stops
        const parseStops = (str, gradEl) => {
            // Regex to match color and position. 
            // Matches: Hex, RGB/A, HSL/A, Named Colors
            // Position: Matches integers and decimals with %
            const stopRegex = /((?:#[0-9a-fA-F]{3,8})|(?:rgba?\([^)]+\))|(?:hsla?\([^)]+\))|(?:[a-zA-Z]+))\s+([\d.]+%)/g;
            
            let match;
            while ((match = stopRegex.exec(str)) !== null) {
                const color = match[1];
                const offset = match[2];
                const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stop.setAttribute('offset', offset);
                
                if (color.startsWith('rgba')) {
                    const parts = color.match(/rgba\(([\d\s,]+),([\d\s.]+)\)/);
                    if (parts) {
                        stop.setAttribute('stop-color', `rgb(${parts[1]})`);
                        stop.setAttribute('stop-opacity', parts[2]);
                    } else {
                        stop.setAttribute('stop-color', color);
                    }
                } else if (color.startsWith('hsla')) {
                     const parts = color.match(/hsla\(([\d\s,%]+),([\d\s.]+)\)/);
                     if (parts) {
                         stop.setAttribute('stop-color', `hsl(${parts[1]})`);
                         stop.setAttribute('stop-opacity', parts[2]);
                     } else {
                         stop.setAttribute('stop-color', color);
                     }
                } else {
                    stop.setAttribute('stop-color', color);
                }
                gradEl.appendChild(stop);
            }
        };

        // Handle Radial Gradient
        if (gradientString.startsWith('radial-gradient')) {
            const grad = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
            grad.setAttribute('id', id);
            grad.setAttribute('cx', '50%');
            grad.setAttribute('cy', '50%');
            grad.setAttribute('r', '50%');
            grad.setAttribute('fx', '50%');
            grad.setAttribute('fy', '50%');

            parseStops(gradientString, grad);
            return grad;
        }

        // Handle Conic Gradient (Fallback to Linear)
        if (gradientString.startsWith('conic-gradient')) {
             const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
             grad.setAttribute('id', id);
             grad.setAttribute('x1', '0%');
             grad.setAttribute('y1', '0%');
             grad.setAttribute('x2', '100%');
             grad.setAttribute('y2', '100%');
             
             parseStops(gradientString, grad);
             return grad;
        }

        // Default: Linear Gradient
        const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        grad.setAttribute('id', id);
        
        // Parse angle
        const angleMatch = gradientString.match(/(\d+)deg/);
        const angle = angleMatch ? parseInt(angleMatch[1]) : 90;
        
        const rad = (angle * Math.PI) / 180;
        
        const dx = Math.sin(rad);
        const dy = -Math.cos(rad);
        
        const x1 = 0.5 - (dx / 2);
        const y1 = 0.5 - (dy / 2);
        const x2 = 0.5 + (dx / 2);
        const y2 = 0.5 + (dy / 2);
        
        grad.setAttribute('x1', `${x1 * 100}%`);
        grad.setAttribute('y1', `${y1 * 100}%`);
        grad.setAttribute('x2', `${x2 * 100}%`);
        grad.setAttribute('y2', `${y2 * 100}%`);
        
        parseStops(gradientString, grad);
        
        return grad;
    }
}
