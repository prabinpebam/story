import { store } from '../core/Store.js';

export class LayerTree {
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
        const currentSlide = state.slides[activeSlideId];
        
        this.container.innerHTML = '';

        // Header
        const title = document.createElement('div');
        title.className = 'section-title';
        title.innerText = 'LAYERS';
        this.container.appendChild(title);

        if (!currentSlide || !currentSlide.elementOrder || currentSlide.elementOrder.length === 0) {
            const empty = document.createElement('div');
            empty.innerText = 'No layers';
            empty.style.color = 'var(--text-secondary)';
            empty.style.fontSize = '11px';
            empty.style.fontStyle = 'italic';
            empty.style.padding = '0 8px';
            this.container.appendChild(empty);
            return;
        }

        // List (Reverse order so top layer is top of list)
        const list = document.createElement('div');
        list.style.display = 'flex';
        list.style.flexDirection = 'column';
        list.style.gap = '2px';

        // We iterate in reverse for display (Top -> Bottom)
        // But we need to keep track of original indices for reordering
        const reversedOrder = [...currentSlide.elementOrder].reverse();

        reversedOrder.forEach((elId, visualIndex) => {
            const el = currentSlide.elements[elId];
            if (!el) return;

            const item = document.createElement('div');
            const isSelected = state.editor.selectedElementIds.includes(elId);
            
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.padding = '6px 8px';
            item.style.backgroundColor = isSelected ? 'var(--bg-well)' : 'transparent';
            item.style.color = isSelected ? 'var(--text-primary)' : 'var(--text-secondary)';
            item.style.borderRadius = '4px';
            item.style.cursor = 'pointer';
            item.style.fontSize = '11px';
            item.style.fontFamily = 'var(--font-ui)';
            item.style.userSelect = 'none';
            item.style.border = '1px solid transparent';

            // Icon based on type
            const icon = document.createElement('i');
            icon.style.width = '16px';
            icon.style.textAlign = 'center';
            icon.style.marginRight = '8px';
            
            if (el.type === 'text') icon.className = 'fa-solid fa-font';
            else if (el.type === 'rect') icon.className = 'fa-regular fa-square';
            else if (el.type === 'circle') icon.className = 'fa-regular fa-circle';
            else if (el.type === 'image') icon.className = 'fa-regular fa-image';
            else icon.className = 'fa-solid fa-layer-group';
            
            item.appendChild(icon);

            // Name / Content Preview
            const name = document.createElement('span');
            name.style.flex = '1';
            name.style.whiteSpace = 'nowrap';
            name.style.overflow = 'hidden';
            name.style.textOverflow = 'ellipsis';
            
            if (el.type === 'text') {
                // Strip HTML tags for preview
                const temp = document.createElement('div');
                temp.innerHTML = el.content;
                name.innerText = temp.textContent || 'Text';
            } else {
                name.innerText = el.name || (el.type.charAt(0).toUpperCase() + el.type.slice(1));
            }
            item.appendChild(name);

            // Controls (Lock / Hide) - Visible on hover or if active
            const controls = document.createElement('div');
            controls.style.display = 'flex'; // Always take space but hide opacity
            controls.style.gap = '4px';
            controls.style.opacity = (isSelected || el.locked || el.hidden) ? '1' : '0';
            
            item.addEventListener('mouseenter', () => controls.style.opacity = '1');
            item.addEventListener('mouseleave', () => {
                if (!isSelected && !el.locked && !el.hidden) controls.style.opacity = '0';
            });

            // Lock Button
            const lockBtn = document.createElement('i');
            lockBtn.className = el.locked ? 'fa-solid fa-lock' : 'fa-solid fa-lock-open';
            lockBtn.style.cursor = 'pointer';
            lockBtn.style.fontSize = '10px';
            lockBtn.style.width = '16px';
            lockBtn.style.textAlign = 'center';
            lockBtn.style.color = el.locked ? 'var(--te-orange)' : 'var(--text-secondary)';
            lockBtn.onclick = (e) => {
                e.stopPropagation();
                store.dispatch('TOGGLE_ELEMENT_LOCK', { id: elId });
            };
            controls.appendChild(lockBtn);

            // Visibility Button
            const visBtn = document.createElement('i');
            visBtn.className = el.hidden ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
            visBtn.style.cursor = 'pointer';
            visBtn.style.fontSize = '10px';
            visBtn.style.width = '16px';
            visBtn.style.textAlign = 'center';
            visBtn.style.color = el.hidden ? 'var(--text-secondary)' : 'var(--text-secondary)';
            visBtn.onclick = (e) => {
                e.stopPropagation();
                store.dispatch('TOGGLE_ELEMENT_VISIBILITY', { id: elId });
            };
            controls.appendChild(visBtn);

            item.appendChild(controls);

            // Selection Logic
            item.onclick = (e) => {
                if (e.shiftKey) {
                    // Multi-select logic could go here
                } else {
                    store.dispatch('UPDATE_SELECTION', [elId]);
                }
            };

            // Drag and Drop Logic
            item.draggable = true;
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', visualIndex);
                e.dataTransfer.effectAllowed = 'move';
                item.style.opacity = '0.5';
            });

            item.addEventListener('dragend', () => {
                item.style.opacity = '1';
                Array.from(list.children).forEach(child => {
                    child.style.borderTop = '1px solid transparent';
                    child.style.borderBottom = '1px solid transparent';
                });
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                
                const rect = item.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;
                
                if (e.clientY < midpoint) {
                    item.style.borderTop = '1px solid var(--te-orange)';
                    item.style.borderBottom = '1px solid transparent';
                } else {
                    item.style.borderTop = '1px solid transparent';
                    item.style.borderBottom = '1px solid var(--te-orange)';
                }
            });

            item.addEventListener('dragleave', () => {
                item.style.borderTop = '1px solid transparent';
                item.style.borderBottom = '1px solid transparent';
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                const fromVisualIndex = parseInt(e.dataTransfer.getData('text/plain'));
                const toVisualIndex = visualIndex;

                if (fromVisualIndex !== toVisualIndex) {
                    const N = currentSlide.elementOrder.length;
                    const fromArrayIndex = N - 1 - fromVisualIndex;
                    let toArrayIndex = N - 1 - toVisualIndex;

                    const rect = item.getBoundingClientRect();
                    const midpoint = rect.top + rect.height / 2;
                    
                    if (e.clientY > midpoint) {
                        // Dropped Below
                    } else {
                        // Dropped Above
                        toArrayIndex += 1;
                    }
                    
                    if (fromArrayIndex < toArrayIndex) {
                        toArrayIndex--;
                    }
                    
                    store.dispatch('REORDER_ELEMENTS', { 
                        slideId: activeSlideId, 
                        fromIndex: fromArrayIndex, 
                        toIndex: toArrayIndex 
                    });
                }
                
                Array.from(list.children).forEach(child => {
                    child.style.borderTop = '1px solid transparent';
                    child.style.borderBottom = '1px solid transparent';
                });
            });

            list.appendChild(item);
        });

        this.container.appendChild(list);
    }
}
