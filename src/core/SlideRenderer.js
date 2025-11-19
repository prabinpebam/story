import { store } from './Store.js';

export class SlideRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.init();
    }

    init() {
        this.render();
        store.on('state-changed', () => this.render());
    }

    render() {
        const state = store.getState();
        const activeSlideId = state.editor.activeSlideId;
        const slide = state.slides[activeSlideId];
        const editingId = state.editor.editingElementId;

        if (!slide) {
            this.container.innerHTML = '';
            return;
        }

        // Set Dimensions
        this.container.style.width = `${slide.width}px`;
        this.container.style.height = `${slide.height}px`;
        
        // Simple full re-render for now (Optimization: Diffing later)
        this.container.innerHTML = '';

        // Render Background
        this.applyBackground(slide.background, slide.width, slide.height);

        // Render Elements
        slide.elementOrder.forEach(elId => {
            const el = slide.elements[elId];
            if (el) {
                const isEditing = elId === editingId;
                const domEl = this.createElementDOM(el, isEditing);
                this.container.appendChild(domEl);
                
                if (isEditing) {
                    // Focus and select all text
                    setTimeout(() => {
                        domEl.focus();
                        // Optional: Select all text
                        // document.execCommand('selectAll', false, null);
                    }, 0);
                }
            }
        });
    }

    applyBackground(bg, width, height) {
        // The background is actually on a separate layer #slide-background
        const bgLayer = document.getElementById('slide-background');
        if (bgLayer) {
            bgLayer.style.width = `${width}px`;
            bgLayer.style.height = `${height}px`;
            
            if (bg.type === 'solid') {
                bgLayer.style.background = bg.value;
            } else if (bg.type === 'gradient') {
                bgLayer.style.background = bg.value;
            }
        }
    }

    createElementDOM(el, isEditing = false) {
        const div = document.createElement('div');
        div.id = el.id;
        div.className = 'slide-element';
        div.style.position = 'absolute';
        div.style.left = `${el.x}px`;
        div.style.top = `${el.y}px`;
        div.style.width = `${el.width}px`;
        div.style.height = `${el.height}px`;
        div.style.transform = `rotate(${el.rotation || 0}deg)`;
        div.style.opacity = el.opacity || 1;
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

        if (el.type === 'text') {
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
            div.style.backgroundColor = el.style?.backgroundColor || '#D9D9D9'; // Fixed property name
            div.style.borderWidth = `${el.style?.borderWidth || 0}px`;
            div.style.borderStyle = el.style?.borderStyle || 'solid'; // Support dashed/dotted
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
