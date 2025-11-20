import { store } from './Store.js';
import { animationManager } from './AnimationManager.js';
import { MeshGradient } from './effects/MeshGradient.js';
import { CodeRunner } from './effects/CodeRunner.js';

export class SlideRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentSlideId = null;
        this.bgCodeRunner = null;
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

        // Update View Dimensions
        view.style.width = `${slide.width}px`;
        view.style.height = `${slide.height}px`;

        // Update Background
        // We should check if background changed to avoid restarting code runner unnecessarily
        // But for now, let's just re-apply. Optimization can come later.
        this.applyBackgroundToView(view, slide.background);
        
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
                // Ensure DOM order matches elementOrder
                view.appendChild(domEl);
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
        // Update position, size, transform
        div.style.left = `${el.x}px`;
        div.style.top = `${el.y}px`;
        div.style.width = `${el.width}px`;
        div.style.height = `${el.height}px`;
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
                     canvas.style.borderRadius = `${el.style?.radius || 0}px`;
                     canvas.width = el.width;
                     canvas.height = el.height;
                     div.appendChild(canvas);
                     
                     const runner = new CodeRunner(canvas);
                     div._codeRunner = runner;
                     runner.play();
                 }
                 
                 // Update Code
                 const codeToRun = el.style.code || `
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
        
        // Floating circles
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
             
             div.style.borderRadius = `${el.style?.radius || 0}px`;

             // Handle Stroke Alignment
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
        console.log('Applying background:', bg);
        // Clean up previous code runner
        if (this.bgCodeRunner) {
            this.bgCodeRunner.stop();
            this.bgCodeRunner = null;
        }

        // Remove existing background canvas if any
        const existingCanvas = view.querySelector('.bg-canvas');
        if (existingCanvas) existingCanvas.remove();

        // Reset background style
        view.style.background = 'none';

        if (bg.type === 'solid') {
            view.style.background = bg.value;
        } else if (bg.type === 'gradient') {
            view.style.background = bg.value;
        } else if (bg.type === 'code') {
            console.log('Initializing Code Background');
            const canvas = document.createElement('canvas');
            canvas.className = 'bg-canvas';
            canvas.width = parseInt(view.style.width);
            canvas.height = parseInt(view.style.height);
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.zIndex = '0'; // Behind elements (elements start at auto/1?)
            // Elements are appended after, so they will be on top if z-index is auto.
            // But let's make sure elements are on top.
            
            view.insertBefore(canvas, view.firstChild);
            console.log('Canvas created', canvas.width, canvas.height);

            this.bgCodeRunner = new CodeRunner(canvas);
            this.bgCodeRunner.setCode(bg.value);
            this.bgCodeRunner.play();
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
