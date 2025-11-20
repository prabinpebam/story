import { store } from './Store.js';
import { animationManager } from './AnimationManager.js';
import { MeshGradient } from './effects/MeshGradient.js';
import { CodeRunner } from './effects/CodeRunner.js';

export class SlideRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentSlideId = null;
        this.init();
    }

    init() {
        this.render();
        store.on('state-changed', () => this.render());
    }

    render() {
        const state = store.getState();
        const activeSlideId = state.editor.activeSlideId;
        
        // Initial render or Slide Change
        if (this.currentSlideId !== activeSlideId) {
            this.handleSlideChange(activeSlideId);
        } else {
            // Update existing slide (e.g. dragging, typing)
            this.updateCurrentSlide();
        }
    }

    handleSlideChange(slideId) {
        const state = store.getState();
        const slide = state.slides[slideId];
        if (!slide) return;

        // Ensure container has dimensions
        this.container.style.width = `${slide.width}px`;
        this.container.style.height = `${slide.height}px`;

        // Create new view
        const newView = this.createSlideDOM(slide);
        
        // Find old view
        const oldView = this.container.querySelector('.slide-view');

        if (oldView && this.currentSlideId) {
            // Use the transition defined on the NEW slide (how it enters)
            // Or maybe the old slide (how it exits)? Usually it's the incoming slide's property.
            const transitionType = slide.transition || 'fade';
            animationManager.transition(this.container, oldView, newView, transitionType).then(() => {
                this.playEntranceAnimations(slide, newView);
            });
        } else {
            this.container.innerHTML = ''; // Clear any garbage
            this.container.appendChild(newView);
            this.playEntranceAnimations(slide, newView);
        }

        this.currentSlideId = slideId;
    }

    playEntranceAnimations(slide, view) {
        if (!slide.elements) return;
        
        Object.values(slide.elements).forEach(el => {
            if (el.animations && el.animations.entrance && el.animations.entrance !== 'none') {
                const domEl = view.querySelector(`#${el.id}`);
                if (domEl) {
                    animationManager.playElementAnimation(domEl, el.animations);
                }
            }
        });
    }

    updateCurrentSlide() {
        const state = store.getState();
        const slide = state.slides[this.currentSlideId];
        if (!slide) return;

        // Ensure container has dimensions
        this.container.style.width = `${slide.width}px`;
        this.container.style.height = `${slide.height}px`;

        const view = this.container.querySelector('.slide-view');
        if (!view) return;

        // Update Background (if implemented)
        
        // Only select direct children to avoid removing nested group elements
        const existingEls = Array.from(view.children).filter(el => el.classList.contains('slide-element'));
        const existingMap = new Map(existingEls.map(el => [el.id, el]));
        
        slide.elementOrder.forEach(id => {
            const el = slide.elements[id];
            const domEl = existingMap.get(id);
            
            if (domEl) {
                // Update properties
                this.updateElementDOM(domEl, el, slide);
                existingMap.delete(id);
            } else {
                // Create new
                const newDomEl = this.createElementDOM(el, slide);
                view.appendChild(newDomEl);
            }
        });
        
        // Remove deleted
        existingMap.forEach(domEl => domEl.remove());
    }

    updateElementDOM(div, el, slide) {
        let x = el.x;
        let y = el.y;
        let width = el.width;
        let height = el.height;
        
        // Adjust for Stroke Alignment (only for rects/shapes that support it)
        if (el.type === 'rect' && el.style?.borderWidth > 0) {
            const w = el.style.borderWidth;
            const align = el.style.strokeAlign || 'inside';
            
            if (align === 'outside') {
                x -= w;
                y -= w;
                width += 2 * w;
                height += 2 * w;
            } else if (align === 'center') {
                x -= w / 2;
                y -= w / 2;
                width += w;
                height += w;
            }
        }

        // Update position, size, transform
        div.style.left = `${x}px`;
        div.style.top = `${y}px`;
        div.style.width = `${width}px`;
        div.style.height = `${height}px`;
        div.style.transform = `rotate(${el.rotation || 0}deg)`;
        div.style.opacity = (el.opacity !== undefined && el.opacity !== null) ? el.opacity : 1;
        div.style.zIndex = el.zIndex || 'auto';

        // Apply Effects (Shadow)
        if (el.style?.dropShadow) {
            const { x, y, blur, spread, color } = el.style.dropShadow;
            if (el.type === 'text') {
                div.style.textShadow = `${x}px ${y}px ${blur}px ${color}`;
                div.style.boxShadow = 'none';
            } else {
                div.style.boxShadow = `${x}px ${y}px ${blur}px ${spread}px ${color}`;
                div.style.textShadow = 'none';
            }
        } else {
            div.style.boxShadow = 'none';
            div.style.textShadow = 'none';
        }

        // Apply Effects (Blur)
        if (el.style?.blur) {
            div.style.filter = `blur(${el.style.blur}px)`;
        } else {
            div.style.filter = 'none';
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
             if (el.style?.fillType === 'mesh') {
                 // Check if already mesh
                 if (!div._meshGradient) {
                     div.innerHTML = ''; // Clear old
                     const canvas = document.createElement('canvas');
                     canvas.style.width = '100%';
                     canvas.style.height = '100%';
                     canvas.style.borderRadius = `${el.style?.radius || 0}px`;
                     div.appendChild(canvas);
                     const mesh = new MeshGradient(canvas);
                     div._meshGradient = mesh;
                     mesh.play();
                 }
                 // Update colors
                 if (el.style.meshColors) {
                     div._meshGradient.setColors(el.style.meshColors);
                 }
             } else {
                 if (div._meshGradient) {
                     div._meshGradient.stop();
                     delete div._meshGradient;
                     div.innerHTML = '';
                 }
                 
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
             
             div.style.borderWidth = `${el.style?.borderWidth || 0}px`;
             div.style.borderStyle = el.style?.borderStyle || 'solid';
             div.style.borderColor = el.style?.borderColor || 'transparent';
             div.style.borderRadius = `${el.style?.radius || 0}px`;
             
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
                img.style.borderRadius = `${el.style?.radius || 0}px`;
            }
        }
    }

    createSlideDOM(slide) {
        const div = document.createElement('div');
        div.className = 'slide-view';
        div.id = `view-${slide.id}`;
        div.style.width = `${slide.width}px`;
        div.style.height = `${slide.height}px`;
        div.style.position = 'absolute';
        div.style.top = '0';
        div.style.left = '0';
        // div.style.overflow = 'hidden'; // Allow content to overflow
        div.style.backgroundColor = '#ffffff'; // Default

        this.applyBackgroundToView(div, slide.background);
        this.renderElementsToView(div, slide);

        return div;
    }

    applyBackgroundToView(view, bg) {
        if (bg.type === 'solid') {
            view.style.background = bg.value;
        } else if (bg.type === 'gradient') {
            view.style.background = bg.value;
        }
        // Hide the global background layer since we are doing per-slide background
        const globalBg = document.getElementById('slide-background');
        if (globalBg) globalBg.style.display = 'none';
    }

    renderElementsToView(view, slide) {
        const state = store.getState();
        const editingId = state.editor.editingElementId;

        slide.elementOrder.forEach(elId => {
            const el = slide.elements[elId];
            if (el) {
                const isEditing = elId === editingId;
                const domEl = this.createElementDOM(el, slide, isEditing);
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
        div.style.position = 'absolute';
        div.style.left = `${el.x}px`;
        div.style.top = `${el.y}px`;
        div.style.width = `${el.width}px`;
        div.style.height = `${el.height}px`;
        div.style.transform = `rotate(${el.rotation || 0}deg)`;
        div.style.opacity = (el.opacity !== undefined && el.opacity !== null) ? el.opacity : 1;
        div.style.zIndex = isEditing ? '1000' : (el.zIndex || 'auto'); 

        // Apply Effects (Shadow)
        if (el.style?.dropShadow) {
            const { x, y, blur, spread, color } = el.style.dropShadow;
            if (el.type === 'text') {
                // Text shadow (no spread)
                div.style.textShadow = `${x}px ${y}px ${blur}px ${color}`;
            } else {
                // Box shadow
                div.style.boxShadow = `${x}px ${y}px ${blur}px ${spread}px ${color}`;
            }
        }

        // Apply Effects (Blur)
        if (el.style?.blur) {
            div.style.filter = `blur(${el.style.blur}px)`;
        }

        if (el.type === 'group') {
            div.style.pointerEvents = 'none'; // Let clicks pass through to children? 
            // Actually, for selection we want to hit the group?
            // But for editing, we might want to hit children.
            // In DOM, if parent has pointer-events: none, children can have auto.
            // But if we want to select the group by clicking anywhere inside, it should be auto.
            // Let's keep default (auto).
            
            if (el.children) {
                el.children.forEach(childId => {
                    const child = slide.elements[childId];
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
                if (el.style.code) {
                    runner.setCode(el.style.code);
                } else {
                    // Default code
                    const defaultCode = `
                        // Available: ctx, width, height, time
                        ctx.fillStyle = '#000';
                        ctx.fillRect(0, 0, width, height);
                        
                        function draw(t) {
                            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
                            ctx.fillRect(0, 0, width, height);
                            
                            ctx.fillStyle = '#00FF41';
                            const x = Math.sin(t) * 100 + width/2;
                            const y = Math.cos(t) * 100 + height/2;
                            ctx.beginPath();
                            ctx.arc(x, y, 20, 0, Math.PI*2);
                            ctx.fill();
                        }
                        return { draw };
                    `;
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
            div.style.borderRadius = `${el.style?.radius || 0}px`;
        } else if (el.type === 'image') {
            const img = document.createElement('img');
            img.src = el.src;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.borderRadius = `${el.style?.radius || 0}px`;
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
}
