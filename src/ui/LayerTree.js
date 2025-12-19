import { store } from '../core/Store.js';
import { contextMenuManager, layerItemConfig } from './components/ContextMenu/index.js';
import { getShapeKind } from '../core/shapes/ShapeElementAdapter.js';

export class LayerTree {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.draggedId = null;
        this.dragContext = null;
        this.dragOverItem = null;
        this.dropPosition = null; // 'before', 'after', 'inside'
        this.showInheritedElements = true; // Toggle to show/hide inherited elements
        this.init();
    }

    init() {
        this.render();
        store.on('state-changed', () => this.render());
        
        // Global drag end listener to clear state
        document.addEventListener('dragend', () => {
            this.clearDragState();
        });
        
        // Register context menu zone
        contextMenuManager.register(layerItemConfig);
        
        // Context menu listener
        this.container.addEventListener('contextmenu', (e) => this.handleContextMenu(e));
    }

    clearDragState() {
        this.draggedId = null;
        this.dragContext = null;
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
        let currentContainer;
        let effectiveSlide = null;
        
        if (state.editor.mode === 'master') {
            currentContainer = state.slideMasterPresets[state.editor.activeMasterId];
        } else {
            currentContainer = state.slides[state.editor.activeSlideId];
            // Get effective slide with inherited elements
            if (this.showInheritedElements) {
                effectiveSlide = store.getEffectiveSlide(state.editor.activeSlideId);
            }
        }
        
        this.container.innerHTML = '';

        // Header with toggle for inherited elements
        const header = document.createElement('div');
        header.className = 'section-header layer-tree-header';
        
        const title = document.createElement('div');
        title.className = 'section-title';
        title.innerText = 'LAYERS';
        header.appendChild(title);
        
        // Toggle for showing inherited elements (only in slide mode)
        if (state.editor.mode !== 'master' && effectiveSlide) {
            const hasInherited = effectiveSlide.effectiveOrder?.some(id => 
                effectiveSlide.effectiveElements[id]?.source === 'layout' ||
                effectiveSlide.effectiveElements[id]?.source === 'theme'
            );
            
            if (hasInherited) {
                const toggleBtn = document.createElement('i');
                toggleBtn.className = (this.showInheritedElements ? 'fa-solid fa-layer-group' : 'fa-regular fa-layer-group') + ' layer-tree-toggle-btn';
                toggleBtn.title = this.showInheritedElements ? 'Hide inherited layers' : 'Show inherited layers';
                toggleBtn.onclick = () => {
                    this.showInheritedElements = !this.showInheritedElements;
                    this.render();
                };
                header.appendChild(toggleBtn);
            }
        }
        
        this.container.appendChild(header);

        // Determine what to render
        const elementsToRender = effectiveSlide?.effectiveElements || currentContainer?.elements || {};
        const orderToRender = effectiveSlide?.effectiveOrder || currentContainer?.elementOrder || [];

        // Hide composition children at top-level so they appear only under their boolean/mask node.
        const hiddenIds = new Set();
        orderToRender.forEach((id) => {
            const el = elementsToRender[id];
            if (!el) return;
            const kind = getShapeKind(el);
            if (kind === 'boolean') {
                const ops = Array.isArray(el.operands) ? el.operands : [];
                ops.forEach((opId) => hiddenIds.add(opId));
            }
            if (kind === 'mask') {
                if (typeof el.maskShapeId === 'string') hiddenIds.add(el.maskShapeId);
                const ids = Array.isArray(el.contentIds) ? el.contentIds : [];
                ids.forEach((cid) => hiddenIds.add(cid));
            }
        });

        if (!orderToRender.length) {
            const empty = document.createElement('div');
            empty.className = 'layer-tree-empty';
            empty.innerText = 'No layers';
            this.container.appendChild(empty);
            return;
        }

        const list = document.createElement('div');
        list.className = 'layer-list';
        
        // Group elements by source
        const slideElements = [];
        const layoutElements = [];
        const themeElements = [];
        
        orderToRender.forEach(id => {
            if (hiddenIds.has(id)) return;
            const el = elementsToRender[id];
            if (!el) return;
            
            const source = el.source || 'slide';
            if (source === 'theme') themeElements.push(el);
            else if (source === 'layout') layoutElements.push(el);
            else slideElements.push(el);
        });
        
        // Render in reverse order (Front to Back visually)
        // Slide elements on top
        [...slideElements].reverse().forEach(el => {
            list.appendChild(this.createLayerItem(el, 0, currentContainer, state, effectiveSlide));
        });
        
        // Layout/Theme elements in collapsible sections
        if (this.showInheritedElements && (layoutElements.length > 0 || themeElements.length > 0)) {
            // Layout section
            if (layoutElements.length > 0) {
                const layoutSection = this.createInheritedSection('Layout', layoutElements, currentContainer, state, effectiveSlide);
                list.appendChild(layoutSection);
            }
            
            // Theme section
            if (themeElements.length > 0) {
                const themeSection = this.createInheritedSection('Theme', themeElements, currentContainer, state, effectiveSlide);
                list.appendChild(themeSection);
            }
        }

        this.container.appendChild(list);
    }
    
    /**
     * Create a collapsible section for inherited elements.
     */
    createInheritedSection(label, elements, container, state, effectiveSlide) {
        const section = document.createElement('div');
        section.className = 'layer-inherited-section';
        
        // Section header
        const header = document.createElement('div');
        header.className = 'layer-inherited-header';
        
        const icon = document.createElement('i');
        icon.className = 'fa-solid fa-link layer-inherited-header-icon';
        header.appendChild(icon);
        
        const text = document.createElement('span');
        text.textContent = `${label} (${elements.length})`;
        header.appendChild(text);
        
        section.appendChild(header);
        
        // Elements
        [...elements].reverse().forEach(el => {
            section.appendChild(this.createLayerItem(el, 0, container, state, effectiveSlide, true));
        });
        
        return section;
    }

    createLayerItem(el, depth, slide, state, effectiveSlide = null, isInherited = false, composite = null) {
        const container = document.createElement('div');
        container.className = 'layer-item-container';
        
        const item = document.createElement('div');
        item.className = 'layer-item';
        item.dataset.id = el.id;
        item.dataset.parentId = el.parentId || '';
        item.dataset.source = el.source || 'slide';
        item.dataset.isPlaceholder = el.isPlaceholder ? 'true' : 'false';
        item.dataset.depth = String(depth);

        if (composite && composite.parentId) {
            item.dataset.compositeParentId = composite.parentId;
            item.dataset.compositeType = composite.type;
            if (composite.role) item.dataset.compositeRole = composite.role;
        }
        
        const isSelected = state.editor.selectedElementIds.includes(el.id);
        const source = el.source || 'slide';
        isInherited = isInherited || source === 'layout' || source === 'theme';
        
        // Apply CSS classes for state
        if (isSelected) item.classList.add('selected');
        if (isInherited) item.classList.add('inherited');
        
        // Dynamic padding based on depth (tokens only)
        item.style.paddingLeft = `calc(var(--spacing-2) + ${depth} * var(--spacing-4))`;
        
        // Dynamic color based on selection (if not using CSS classes)
        if (!isSelected && !isInherited) {
            item.style.color = 'var(--color-text-primary)';
        }

        // Icon container
        const iconContainer = document.createElement('div');
        iconContainer.className = 'layer-item-icon-container';
        
        // Main icon
        const icon = document.createElement('i');
        icon.className = 'layer-item-icon';

        const kind = getShapeKind(el);
        
        // Determine icon based on type and placeholder status
        if (el.isPlaceholder) {
            // Placeholder-specific icons based on placeholderType
            switch (el.placeholderType) {
                case 'title': icon.className = 'fa-solid fa-heading'; break;
                case 'subtitle': icon.className = 'fa-solid fa-h'; break;
                case 'body': icon.className = 'fa-solid fa-paragraph'; break;
                case 'text': icon.className = 'fa-solid fa-font'; break;
                case 'picture': icon.className = 'fa-regular fa-image'; break;
                case 'media': icon.className = 'fa-solid fa-play'; break;
                default: icon.className = 'fa-regular fa-square-dashed'; break;
            }
        } else if (el.type === 'text') icon.className = 'fa-solid fa-font';
        else if (kind === 'rectangle') icon.className = 'fa-regular fa-square';
        else if (kind === 'ellipse') icon.className = 'fa-regular fa-circle';
        else if (kind === 'boolean') icon.className = 'fa-solid fa-object-group';
        else if (kind === 'mask') icon.className = 'fa-solid fa-mask';
        else if (el.type === 'image') icon.className = 'fa-regular fa-image';
        else if (el.type === 'group') icon.className = 'fa-solid fa-layer-group';
        
        iconContainer.appendChild(icon);
        
        // Placeholder badge (small indicator)
        if (el.isPlaceholder && !isInherited) {
            const badge = document.createElement('div');
            badge.className = 'layer-item-badge ' + (el.hasUserContent ? 'has-content' : 'empty');
            badge.title = el.hasUserContent ? 'Has content' : 'Empty placeholder';
            iconContainer.appendChild(badge);
        }
        
        // Inherited indicator
        if (isInherited && !el.isPlaceholder) {
            const linkIcon = document.createElement('i');
            linkIcon.className = 'fa-solid fa-link layer-item-link-icon';
            iconContainer.appendChild(linkIcon);
        }

        // Boolean status indicator (non-blocking): show warning when renderer falls back.
        if (!isInherited && kind === 'boolean') {
            const dom = document.querySelector(`[data-element-id="${el.id}"]`);
            const status = dom?.getAttribute('data-boolean-status');
            if (status && status !== 'ok') {
                const warn = document.createElement('i');
                warn.className = 'fa-solid fa-triangle-exclamation layer-item-warning-icon';
                warn.title = 'Boolean degraded (fallback result)';
                iconContainer.appendChild(warn);
            }
        }
        
        item.appendChild(iconContainer);

        // Name (Editable)
        const nameSpan = document.createElement('span');
        nameSpan.className = 'layer-item-name';
        
        let displayName = el.name;
        if (!displayName) {
            if (el.isPlaceholder && el.placeholderType) {
                // Placeholder display name
                const placeholderNames = {
                    title: 'Title Placeholder',
                    subtitle: 'Subtitle Placeholder',
                    body: 'Body Placeholder',
                    text: 'Text Placeholder',
                    picture: 'Picture Placeholder',
                    media: 'Media Placeholder'
                };
                displayName = placeholderNames[el.placeholderType] || 'Placeholder';
            } else if (el.type === 'text') {
                const temp = document.createElement('div');
                temp.innerHTML = el.content;
                displayName = temp.textContent || 'Text';
            } else if (kind === 'boolean') {
                displayName = 'Boolean';
            } else if (kind === 'mask') {
                displayName = 'Mask';
            } else if (el.type) {
                displayName = el.type.charAt(0).toUpperCase() + el.type.slice(1);
            } else {
                displayName = 'Element';
            }
        }
        nameSpan.innerText = displayName;
        
        // Inline Rename (only for slide elements, not inherited)
        if (!isInherited) {
            nameSpan.ondblclick = (e) => {
                e.stopPropagation();
                const input = document.createElement('input');
                input.type = 'text';
                input.value = displayName;
                input.className = 'layer-item-input';
            
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
        }

        item.appendChild(nameSpan);

        // Controls (Lock/Eye)
        const controls = document.createElement('div');
        controls.className = 'layer-controls';
        controls.style.opacity = (isSelected || el.locked || el.hidden) ? '1' : '0';
        
        item.addEventListener('mouseenter', () => controls.style.opacity = '1');
        item.addEventListener('mouseleave', () => {
            if (!isSelected && !el.locked && !el.hidden) controls.style.opacity = '0';
        });

        const lockBtn = document.createElement('button');
        lockBtn.type = 'button';
        lockBtn.className = 'layer-control-btn' + (el.locked ? ' active' : '');
        lockBtn.innerHTML = '<i class="' + (el.locked ? 'fa-solid fa-lock' : 'fa-solid fa-lock-open') + '"></i>';
        lockBtn.onclick = (e) => {
            e.stopPropagation();
            store.dispatch('TOGGLE_ELEMENT_LOCK', { id: el.id });
        };
        controls.appendChild(lockBtn);

        const visBtn = document.createElement('button');
        visBtn.type = 'button';
        visBtn.className = 'layer-control-btn';
        visBtn.innerHTML = '<i class="' + (el.hidden ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye') + '"></i>';
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

        // Drag & Drop (only for slide elements, not inherited)
        const compositeRole = item.dataset.compositeRole || '';
        item.draggable = !isInherited && compositeRole !== 'mask-shape';
        
        if (!isInherited) {
            item.addEventListener('dragstart', (e) => {
                this.draggedId = el.id;
                this.dragContext = {
                    id: el.id,
                    compositeParentId: item.dataset.compositeParentId || null,
                    compositeType: item.dataset.compositeType || null,
                    compositeRole: item.dataset.compositeRole || null
                };
            // Required for consistent HTML5 DnD across browsers (notably Firefox).
            // Playwright's dragTo can mask this requirement, so keep it explicit.
            if (e.dataTransfer) {
                try {
                    e.dataTransfer.setData('text/plain', el.id);
                } catch {
                    // Ignore; some environments may restrict dataTransfer.
                }
                e.dataTransfer.effectAllowed = 'move';
            }
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

            // Composition reorder (boolean operands / mask content).
            const dragged = this.dragContext;
            const targetCompositeParentId = item.dataset.compositeParentId || null;
            const targetCompositeType = item.dataset.compositeType || null;
            const targetCompositeRole = item.dataset.compositeRole || null;

            if (
                dragged?.compositeParentId &&
                dragged.compositeParentId === targetCompositeParentId &&
                dragged.compositeType === targetCompositeType &&
                targetCompositeParentId
            ) {
                if (targetCompositeType === 'boolean') {
                    const parent = slide.elements?.[targetCompositeParentId];
                    const list = Array.isArray(parent?.operands) ? parent.operands : [];
                    const from = list.indexOf(dragged.id);
                    const toBase = list.indexOf(el.id);
                    if (from !== -1 && toBase !== -1) {
                        let to = this.dropPosition === 'before' ? toBase : toBase + 1;
                        if (from < to) to -= 1;
                        store.dispatch('REORDER_BOOLEAN_OPERANDS', {
                            booleanId: targetCompositeParentId,
                            operandId: dragged.id,
                            targetIndex: to
                        });
                        this.clearDragState();
                        return;
                    }
                }

                if (targetCompositeType === 'mask') {
                    // Only reorder contentIds (mask shape stays fixed).
                    if (dragged.compositeRole === 'mask-shape' || targetCompositeRole === 'mask-shape') {
                        this.clearDragState();
                        return;
                    }

                    const parent = slide.elements?.[targetCompositeParentId];
                    const list = Array.isArray(parent?.contentIds) ? parent.contentIds : [];
                    const from = list.indexOf(dragged.id);
                    const toBase = list.indexOf(el.id);
                    if (from !== -1 && toBase !== -1) {
                        let to = this.dropPosition === 'before' ? toBase : toBase + 1;
                        if (from < to) to -= 1;
                        store.dispatch('REORDER_MASK_CONTENT', {
                            maskId: targetCompositeParentId,
                            contentId: dragged.id,
                            targetIndex: to
                        });
                        this.clearDragState();
                        return;
                    }
                }
            }
            
            const draggedEl = slide.elements[this.draggedId];
            if (!draggedEl) return;

            const draggedParentId = draggedEl.parentId || null;

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

            // When reordering within the same sibling list, adjust targetIndex for the removal of the dragged item.
            if ((targetParentId || null) === draggedParentId) {
                const fromIndex = getIndexInParent(this.draggedId, draggedParentId);
                if (fromIndex !== -1 && fromIndex < targetIndex) {
                    targetIndex -= 1;
                }
            }

            store.dispatch('REORDER_ELEMENTS', {
                slideId: slide.id,
                elementId: this.draggedId,
                targetParentId,
                targetIndex
            });
            
            this.clearDragState();
        });
        } // End of !isInherited block for drag handlers

        container.appendChild(item);

        // Recursive Children
        if (el.type === 'group' && el.children && el.children.length > 0) {
            // Render children in reverse order (Top -> Bottom)
            const childrenIds = [...el.children].reverse();
            childrenIds.forEach(childId => {
                const child = slide.elements[childId];
                if (child) {
                    container.appendChild(this.createLayerItem(child, depth + 1, slide, state, effectiveSlide, isInherited));
                }
            });
        }

        // Composition Children (boolean operands / mask shape+content)
        if (!isInherited && kind === 'boolean') {
            const operandIds = Array.isArray(el.operands) ? el.operands : [];
            operandIds.forEach((childId) => {
                const child = slide.elements?.[childId];
                if (!child) return;
                container.appendChild(this.createLayerItem(child, depth + 1, slide, state, effectiveSlide, isInherited, {
                    parentId: el.id,
                    type: 'boolean',
                    role: 'operand'
                }));
            });
        }

        if (!isInherited && kind === 'mask') {
            const maskShapeId = typeof el.maskShapeId === 'string' ? el.maskShapeId : null;
            if (maskShapeId) {
                const maskShape = slide.elements?.[maskShapeId];
                if (maskShape) {
                    container.appendChild(this.createLayerItem(maskShape, depth + 1, slide, state, effectiveSlide, isInherited, {
                        parentId: el.id,
                        type: 'mask',
                        role: 'mask-shape'
                    }));
                }
            }
            const contentIds = Array.isArray(el.contentIds) ? el.contentIds : [];
            contentIds.forEach((childId) => {
                const child = slide.elements?.[childId];
                if (!child) return;
                container.appendChild(this.createLayerItem(child, depth + 1, slide, state, effectiveSlide, isInherited, {
                    parentId: el.id,
                    type: 'mask',
                    role: 'content'
                }));
            });
        }

        return container;
    }
    
    /**
     * Handle context menu on layer items.
     * Uses the shared ContextMenuManager for consistent UX.
     */
    handleContextMenu(e) {
        const layerItem = e.target.closest('.layer-item');
        if (!layerItem) return;
        
        e.preventDefault();
        
        const elementId = layerItem.dataset.id;
        const isPlaceholder = layerItem.dataset.isPlaceholder === 'true';
        const source = layerItem.dataset.source;
        const isInherited = source === 'layout' || source === 'theme';
        
        // Get element data
        const state = store.getState();
        let element;
        
        if (state.editor.mode === 'master') {
            element = state.slideMasterPresets[state.editor.activeMasterId]?.elements?.[elementId];
        } else {
            const effectiveSlide = store.getEffectiveSlide(state.editor.activeSlideId);
            element = effectiveSlide?.effectiveElements?.[elementId];
        }
        
        if (!element) return;
        
        // Select the element
        store.dispatch('UPDATE_SELECTION', [elementId]);
        
        // Show context menu via manager
        contextMenuManager.show('layer-item', e.clientX, e.clientY, {
            elementId,
            element,
            isPlaceholder,
            isInherited,
            layerItem,
            startRename: () => this.startRename(layerItem),
            resetPlaceholderToMaster: (id, el) => this.resetPlaceholderToMaster(id, el)
        });
    }
    
    /**
     * Reset a placeholder to its master state.
     */
    resetPlaceholderToMaster(elementId, element) {
        const state = store.getState();
        const slide = state.slides[state.editor.activeSlideId];
        if (!slide) return;
        
        // Get the original from layout
        const layout = state.slideMasterPresets[slide.layoutId];
        const masterElement = layout?.elements?.[elementId];
        
        // Dispatch reset action
        store.dispatch('UPDATE_ELEMENT', {
            id: elementId,
            content: masterElement?.content || element.content,
            hasUserContent: false
        });
    }
    
    /**
     * Start inline rename for an element.
     */
    startRename(layerItem) {
        const nameSpan = layerItem.querySelector('span');
        if (!nameSpan) return;
        
        nameSpan.ondblclick?.({ stopPropagation: () => {} });
    }
}
