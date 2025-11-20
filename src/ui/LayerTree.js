import { store } from '../core/Store.js';

export class LayerTree {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.draggedId = null;
        this.dragOverItem = null;
        this.dropPosition = null; // 'before', 'after', 'inside'
        this.init();
    }

    init() {
        this.render();
        store.on('state-changed', () => this.render());
        
        // Global drag end listener to clear state
        document.addEventListener('dragend', () => {
            this.clearDragState();
        });
    }

    clearDragState() {
        this.draggedId = null;
        this.dragOverItem = null;
        this.dropPosition = null;
        const items = this.container.querySelectorAll('.layer-item');
        items.forEach(el => {
            el.style.borderTop = '1px solid transparent';
            el.style.borderBottom = '1px solid transparent';
            el.style.backgroundColor = '';
        });
        this.render(); // Re-render to clear styles
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

        const list = document.createElement('div');
        list.className = 'layer-list';
        list.style.display = 'flex';
        list.style.flexDirection = 'column';
        
        // Render root elements (Reverse order for UI: Top -> Bottom)
        // elementOrder is [Back, ..., Front]
        // We want to render [Front, ..., Back]
        const rootIds = [...currentSlide.elementOrder].reverse();
        
        rootIds.forEach(id => {
            const el = currentSlide.elements[id];
            if (el) {
                list.appendChild(this.createLayerItem(el, 0, currentSlide, state));
            }
        });

        this.container.appendChild(list);
    }

    createLayerItem(el, depth, slide, state) {
        const container = document.createElement('div');
        container.className = 'layer-item-container';
        
        const item = document.createElement('div');
        item.className = 'layer-item';
        item.dataset.id = el.id;
        item.dataset.parentId = el.parentId || '';
        
        const isSelected = state.editor.selectedElementIds.includes(el.id);
        
        // Styles
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.height = '28px';
        item.style.padding = '0 8px';
        item.style.paddingLeft = `${8 + depth * 16}px`;
        item.style.backgroundColor = isSelected ? 'var(--color-bg-active)' : 'transparent';
        item.style.color = isSelected ? 'var(--color-accent)' : 'var(--color-text-primary)';
        item.style.cursor = 'pointer';
        item.style.fontSize = 'var(--font-size-sm)';
        item.style.userSelect = 'none';
        item.style.border = '1px solid transparent'; // For drop indication
        item.style.borderRadius = 'var(--radius-sm)';
        item.style.margin = '1px 4px'; // Small gap between items
        item.style.position = 'relative';

        // Icon
        const icon = document.createElement('i');
        icon.style.width = '16px';
        icon.style.textAlign = 'center';
        icon.style.marginRight = '8px';
        
        if (el.type === 'text') icon.className = 'fa-solid fa-font';
        else if (el.type === 'rect') icon.className = 'fa-regular fa-square';
        else if (el.type === 'circle') icon.className = 'fa-regular fa-circle';
        else if (el.type === 'image') icon.className = 'fa-regular fa-image';
        else if (el.type === 'group') icon.className = 'fa-solid fa-layer-group';
        
        item.appendChild(icon);

        // Name (Editable)
        const nameSpan = document.createElement('span');
        nameSpan.style.flex = '1';
        nameSpan.style.whiteSpace = 'nowrap';
        nameSpan.style.overflow = 'hidden';
        nameSpan.style.textOverflow = 'ellipsis';
        
        let displayName = el.name;
        if (!displayName) {
            if (el.type === 'text') {
                const temp = document.createElement('div');
                temp.innerHTML = el.content;
                displayName = temp.textContent || 'Text';
            } else {
                displayName = el.type.charAt(0).toUpperCase() + el.type.slice(1);
            }
        }
        nameSpan.innerText = displayName;
        
        // Inline Rename
        nameSpan.ondblclick = (e) => {
            e.stopPropagation();
            const input = document.createElement('input');
            input.type = 'text';
            input.value = displayName;
            input.style.width = '100%';
            input.style.background = 'var(--bg-input)';
            input.style.color = 'var(--text-primary)';
            input.style.border = 'none';
            input.style.fontSize = '11px';
            input.style.padding = '0';
            
            const commit = () => {
                if (input.value.trim()) {
                    store.dispatch('UPDATE_ELEMENT', { id: el.id, name: input.value.trim() });
                }
                nameSpan.innerText = input.value.trim() || displayName; // Optimistic update
            };

            input.onblur = commit;
            input.onkeydown = (ev) => {
                if (ev.key === 'Enter') {
                    commit();
                }
            };
            
            nameSpan.innerHTML = '';
            nameSpan.appendChild(input);
            input.focus();
        };

        item.appendChild(nameSpan);

        // Controls (Lock/Eye)
        const controls = document.createElement('div');
        controls.className = 'layer-controls';
        controls.style.display = 'flex';
        controls.style.gap = '6px';
        controls.style.opacity = (isSelected || el.locked || el.hidden) ? '1' : '0';
        
        item.addEventListener('mouseenter', () => controls.style.opacity = '1');
        item.addEventListener('mouseleave', () => {
            if (!isSelected && !el.locked && !el.hidden) controls.style.opacity = '0';
        });

        const lockBtn = document.createElement('i');
        lockBtn.className = el.locked ? 'fa-solid fa-lock' : 'fa-solid fa-lock-open';
        lockBtn.style.fontSize = '10px';
        lockBtn.style.color = el.locked ? 'var(--color-text-primary)' : 'var(--color-text-secondary)';
        lockBtn.onclick = (e) => {
            e.stopPropagation();
            store.dispatch('TOGGLE_ELEMENT_LOCK', { id: el.id });
        };
        controls.appendChild(lockBtn);

        const visBtn = document.createElement('i');
        visBtn.className = el.hidden ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
        visBtn.style.fontSize = '10px';
        visBtn.style.color = el.hidden ? 'var(--color-text-secondary)' : 'var(--color-text-secondary)';
        visBtn.onclick = (e) => {
            e.stopPropagation();
            store.dispatch('TOGGLE_ELEMENT_VISIBILITY', { id: el.id });
        };
        controls.appendChild(visBtn);

        item.appendChild(controls);

        // Selection
        item.onclick = (e) => {
            if (e.shiftKey) {
                // TODO: Range select
                const current = state.editor.selectedElementIds;
                if (current.includes(el.id)) {
                    store.dispatch('UPDATE_SELECTION', current.filter(id => id !== el.id));
                } else {
                    store.dispatch('UPDATE_SELECTION', [...current, el.id]);
                }
            } else {
                store.dispatch('UPDATE_SELECTION', [el.id]);
            }
        };

        // Drag & Drop
        item.draggable = true;
        
        item.addEventListener('dragstart', (e) => {
            this.draggedId = el.id;
            e.dataTransfer.effectAllowed = 'move';
            item.style.opacity = '0.5';
        });

        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (this.draggedId === el.id) return;

            const rect = item.getBoundingClientRect();
            const relY = e.clientY - rect.top;
            
            // Logic:
            // Top 25%: Drop Before
            // Bottom 25%: Drop After
            // Middle 50%: Drop Inside (if group) or After (if not group)
            
            this.dragOverItem = item;
            
            // Reset styles
            item.style.borderTop = '1px solid transparent';
            item.style.borderBottom = '1px solid transparent';
            item.style.backgroundColor = isSelected ? 'var(--color-bg-active)' : 'transparent';

            if (relY < rect.height * 0.25) {
                this.dropPosition = 'before';
                item.style.borderTop = '2px solid var(--color-accent)';
            } else if (relY > rect.height * 0.75) {
                this.dropPosition = 'after';
                item.style.borderBottom = '2px solid var(--color-accent)';
            } else {
                if (el.type === 'group') {
                    this.dropPosition = 'inside';
                    item.style.backgroundColor = 'var(--color-selection)';
                } else {
                    this.dropPosition = 'after'; // Default to after for non-groups
                    item.style.borderBottom = '2px solid var(--color-accent)';
                }
            }
        });

        item.addEventListener('dragleave', () => {
            item.style.borderTop = '1px solid transparent';
            item.style.borderBottom = '1px solid transparent';
            item.style.backgroundColor = isSelected ? 'var(--color-bg-active)' : 'transparent';
        });

        item.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (this.draggedId === el.id) return;
            
            const draggedEl = slide.elements[this.draggedId];
            if (!draggedEl) return;

            // Calculate Target
            let targetParentId = el.parentId;
            let targetIndex = 0;

            // Helper to get index in parent's list
            const getIndexInParent = (id, parentId) => {
                if (parentId) {
                    const p = slide.elements[parentId];
                    return p ? p.children.indexOf(id) : -1;
                } else {
                    return slide.elementOrder.indexOf(id);
                }
            };

            const currentIndex = getIndexInParent(el.id, el.parentId);

            if (this.dropPosition === 'before') {
                // Insert at current index (pushing current down/up depending on perspective)
                // Since we render top-to-bottom (reverse), 'before' visually means 'above', which is HIGHER index in array.
                // Wait, let's think about array order.
                // [0: Back, 1: Middle, 2: Front]
                // Rendered:
                // - Front (2)
                // - Middle (1)
                // - Back (0)
                
                // If I drop 'before' Middle (visually above Middle), I want it to be at index 2 (between Middle and Front).
                // Current Middle index is 1.
                // So target index should be 1 + 1 = 2?
                
                targetIndex = currentIndex + 1;
                targetParentId = el.parentId;

            } else if (this.dropPosition === 'after') {
                // Visually below. Lower index.
                // If I drop 'after' Middle (visually below), I want it at index 1 (replacing Middle's spot, pushing Middle up).
                // Wait, if I insert at 1, Middle becomes 2.
                // So target index is currentIndex.
                
                targetIndex = currentIndex;
                targetParentId = el.parentId;

            } else if (this.dropPosition === 'inside') {
                targetParentId = el.id;
                // Add to top of group (end of children array)
                const group = slide.elements[el.id];
                targetIndex = group.children ? group.children.length : 0;
            }

            store.dispatch('REORDER_ELEMENTS', {
                slideId: slide.id,
                elementId: this.draggedId,
                targetParentId,
                targetIndex
            });
            
            this.clearDragState();
        });

        container.appendChild(item);

        // Recursive Children
        if (el.type === 'group' && el.children && el.children.length > 0) {
            // Render children in reverse order (Top -> Bottom)
            const childrenIds = [...el.children].reverse();
            childrenIds.forEach(childId => {
                const child = slide.elements[childId];
                if (child) {
                    container.appendChild(this.createLayerItem(child, depth + 1, slide, state));
                }
            });
        }

        return container;
    }
}
