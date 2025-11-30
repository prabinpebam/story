import { store } from '../core/Store.js';
import { ThumbnailRenderer } from '../core/renderer/ThumbnailRenderer.js';

export class SlideList {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.init();
    }

    init() {
        this.render();

        // Subscribe to store
        store.on('state-changed', () => this.render());
    }

    render() {
        const state = store.getState();
        this.container.innerHTML = '';

        if (state.editor.mode === 'master') {
            this.renderMasterList(state);
        } else {
            this.renderSlideList(state);
        }
    }

    renderMasterList(state) {
        // Header
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '12px';

        const title = document.createElement('div');
        title.className = 'section-title';
        title.innerText = 'MASTERS';
        title.style.marginBottom = '0';
        
        header.appendChild(title);
        this.container.appendChild(header);

        // List Container
        const list = document.createElement('div');
        list.style.display = 'flex';
        list.style.flexDirection = 'column';
        list.style.gap = '12px';

        // Iterate Masters
        const allMasters = state.masters;
        const themes = Object.values(allMasters).filter(m => m.type === 'theme');

        themes.forEach(theme => {
            // 1. Render the Master Slide itself
            const masterItem = this.createThumbnailItem(theme, state, true);
            list.appendChild(masterItem);

            // 2. Render Layouts
            const layouts = Object.values(allMasters).filter(m => m.type === 'layout' && m.parentId === theme.id);
            
            if (layouts.length > 0) {
                const layoutsContainer = document.createElement('div');
                layoutsContainer.style.paddingLeft = '20px'; // Indent layouts
                layoutsContainer.style.display = 'flex';
                layoutsContainer.style.flexDirection = 'column';
                layoutsContainer.style.gap = '8px';
                layoutsContainer.style.marginTop = '-8px'; // Pull closer to master
                layoutsContainer.style.marginBottom = '8px';
                
                layouts.forEach(layout => {
                    const layoutItem = this.createThumbnailItem(layout, state, false);
                    layoutsContainer.appendChild(layoutItem);
                });

                list.appendChild(layoutsContainer);
            }
        });

        this.container.appendChild(list);
    }

    createThumbnailItem(slideOrMaster, state, isMasterRoot) {
        const id = slideOrMaster.id;
        const isActive = id === state.editor.activeMasterId;
        
        const item = document.createElement('div');
        item.className = `slide-thumbnail ${isActive ? 'active' : ''}`;
        item.style.padding = '8px'; // Slightly smaller for masters
        item.style.backgroundColor = isActive ? 'var(--color-bg-active)' : 'transparent';
        item.style.border = isActive ? '1px solid var(--color-accent)' : '1px solid var(--color-border)';
        item.style.borderRadius = 'var(--radius-md)';
        item.style.cursor = 'pointer';
        item.style.position = 'relative';
        item.style.transition = 'all 0.2s ease';

        // Title
        const info = document.createElement('div');
        info.style.display = 'flex';
        info.style.alignItems = 'center';
        info.style.gap = '8px';
        info.style.marginBottom = '6px';
        
        const icon = document.createElement('i');
        icon.className = isMasterRoot ? 'fa-solid fa-layer-group' : 'fa-regular fa-file';
        icon.style.fontSize = '10px';
        icon.style.color = 'var(--color-text-secondary)';
        
        const titleText = document.createElement('span');
        titleText.innerText = slideOrMaster.name || (isMasterRoot ? 'Master' : 'Layout');
        titleText.style.fontSize = 'var(--font-size-sm)';
        titleText.style.fontWeight = isMasterRoot ? '600' : '400';
        titleText.style.color = 'var(--color-text-primary)';

        info.appendChild(icon);
        info.appendChild(titleText);
        item.appendChild(info);

        // Preview - Use ThumbnailRenderer for accurate representation
        // For masters/layouts, construct effective data
        const masterData = {
            ...slideOrMaster,
            effectiveBackground: slideOrMaster.background,
            effectiveElements: slideOrMaster.elements,
            effectiveOrder: slideOrMaster.elementOrder,
            themeSettings: slideOrMaster.themeSettings
        };
        
        // If layout, inherit background from parent theme
        if (!isMasterRoot && (!masterData.effectiveBackground || masterData.effectiveBackground.type === 'inherited')) {
            const parentId = slideOrMaster.parentId;
            if (parentId && state.masters[parentId]) {
                masterData.effectiveBackground = state.masters[parentId].background;
                masterData.themeSettings = state.masters[parentId].themeSettings;
            }
        }
        
        const preview = ThumbnailRenderer.createThumbnail(id, masterData);
        item.appendChild(preview);

        // Click Handler
        item.addEventListener('click', () => {
            store.dispatch('SET_ACTIVE_MASTER', id);
        });

        return item;
    }

    renderSlideList(state) {
        // Header / Title
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '12px';

        const title = document.createElement('div');
        title.className = 'section-title';
        title.innerText = 'SLIDES';
        title.style.marginBottom = '0';
        
        const addBtn = document.createElement('button');
        addBtn.innerHTML = '<i class="fa-solid fa-plus"></i>';
        addBtn.className = 'icon-btn';
        addBtn.title = 'Add Slide';
        addBtn.onclick = () => store.dispatch('ADD_SLIDE');

        header.appendChild(title);
        header.appendChild(addBtn);
        this.container.appendChild(header);

        // List
        const list = document.createElement('div');
        list.style.display = 'flex';
        list.style.flexDirection = 'column';
        list.style.gap = '12px';

        // Use slideOrder array to iterate
        if (state.slideOrder && state.slides) {
            state.slideOrder.forEach((slideId, index) => {
                const slide = state.slides[slideId];
                
                // Skip if slide doesn't exist
                if (!slide) {
                    console.warn(`Slide not found: ${slideId}`);
                    return;
                }
                
                const isActive = slideId === state.editor.activeSlideId;
                const isSelected = state.editor.selectedSlideIds && state.editor.selectedSlideIds.includes(slideId);
                
                const item = document.createElement('div');
                item.className = `slide-thumbnail ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''}`;
                item.style.padding = '12px';
                item.style.backgroundColor = (isActive || isSelected) ? 'var(--color-bg-active)' : 'transparent';
                
                if (isSelected) {
                    item.style.border = '2px solid var(--color-accent)';
                } else if (isActive) {
                    item.style.border = '1px solid var(--color-accent)';
                } else {
                    item.style.border = '1px solid var(--color-border)';
                }

                item.style.borderRadius = 'var(--radius-md)';
                item.style.cursor = 'pointer';
                item.style.position = 'relative';
                item.style.transition = 'all 0.2s ease';

                // Slide Number & Title
                const info = document.createElement('div');
                info.style.display = 'flex';
                info.style.alignItems = 'center';
                info.style.gap = '8px';
                info.style.marginBottom = '8px';
                
                const number = document.createElement('span');
                number.innerText = index + 1;
                number.style.fontFamily = 'var(--font-mono)';
                number.style.fontSize = 'var(--font-size-xs)';
                number.style.color = 'var(--color-text-secondary)';
                
                const slideTitle = document.createElement('span');
                slideTitle.innerText = slide.title || `Slide ${index + 1}`;
                slideTitle.style.fontSize = 'var(--font-size-md)';
                slideTitle.style.fontWeight = 'var(--font-weight-medium)';
                slideTitle.style.whiteSpace = 'nowrap';
                slideTitle.style.overflow = 'hidden';
                slideTitle.style.textOverflow = 'ellipsis';
                slideTitle.style.color = 'var(--color-text-primary)';

                info.appendChild(number);
                info.appendChild(slideTitle);
                item.appendChild(info);

                // Preview Box - Use ThumbnailRenderer for accurate representation
                const effectiveSlide = store.getEffectiveSlide(slide.id);
                const slideData = effectiveSlide || slide;
                const preview = ThumbnailRenderer.createThumbnail(slideId, slideData);
                
                item.appendChild(preview);

                // Actions (Delete/Duplicate) - Removed as per request


                // Keyboard Shortcuts - Moved to global handler (CanvasManager)
                
                item.addEventListener('click', (e) => {
                    store.dispatch('SET_ACTIVE_SLIDE', slideId);
                    store.dispatch('SELECT_SLIDE', { id: slideId, multi: e.ctrlKey || e.metaKey });
                });

                // Drag and Drop
                item.draggable = true;
                item.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', index);
                    e.dataTransfer.effectAllowed = 'move';
                    item.style.opacity = '0.5';
                });

                item.addEventListener('dragend', () => {
                    item.style.opacity = '1';
                    // Remove any drop indicators
                    Array.from(this.container.querySelectorAll('.slide-thumbnail')).forEach(el => {
                        el.style.borderTop = '';
                        el.style.borderBottom = '';
                    });
                });

                item.addEventListener('dragover', (e) => {
                    e.preventDefault(); // Necessary to allow dropping
                    e.dataTransfer.dropEffect = 'move';
                    
                    // Visual feedback
                    const rect = item.getBoundingClientRect();
                    const midpoint = rect.top + rect.height / 2;
                    if (e.clientY < midpoint) {
                        item.style.borderTop = '2px solid var(--color-accent)';
                        item.style.borderBottom = '';
                    } else {
                        item.style.borderTop = '';
                        item.style.borderBottom = '2px solid var(--color-accent)';
                    }
                });

                item.addEventListener('dragleave', () => {
                    item.style.borderTop = '';
                    item.style.borderBottom = '';
                });

                item.addEventListener('drop', (e) => {
                    e.preventDefault();
                    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                    const toIndex = index;
                    
                    if (fromIndex !== toIndex) {
                        // Determine if we dropped above or below to adjust index
                        // However, simple swap or move logic:
                        // If we drop on an item, we probably want to insert before or after it.
                        // For simplicity, let's use the visual indicator logic:
                        const rect = item.getBoundingClientRect();
                        const midpoint = rect.top + rect.height / 2;
                        let finalIndex = toIndex;
                        
                        // If dropped below the midpoint, insert after (index + 1)
                        // But we need to be careful about the array mutation logic in Store
                        // Let's just pass the target index and let Store handle it?
                        // Actually, Store's REORDER_SLIDES expects { fromIndex, toIndex }
                        // where it removes from fromIndex and inserts at toIndex.
                        
                        // If dragging down: 0 -> 2. Remove 0. Array shifts. Insert at 2.
                        // If dragging up: 2 -> 0. Remove 2. Insert at 0.
                        
                        // Refined logic based on visual indicator:
                        if (e.clientY > midpoint) {
                            // Insert after this element
                            // If moving down, the target index might need adjustment because the element is removed first?
                            // Let's keep it simple: The store splice logic is:
                            // const [moved] = list.splice(from, 1);
                            // list.splice(to, 0, moved);
                            
                            // If I drop *after* index 2. I want it to be at index 3 (conceptually).
                            // But if I remove index 0, index 2 becomes index 1.
                            // It's safer to calculate the desired *final* index.
                            
                            // Let's just use the index of the element we dropped ON.
                            // If dropped below, we target index + 1.
                            // If dropped above, we target index.
                            
                            // However, if fromIndex < toIndex (moving down), and we drop above toIndex,
                            // the removal of fromIndex shifts toIndex down by 1.
                            
                            // Let's stick to:
                            // Store logic: remove at from, insert at to.
                            
                            if (fromIndex < toIndex) {
                                // Moving down
                                // If dropped below (insert after), we want it at toIndex.
                                // If dropped above (insert before), we want it at toIndex - 1? No.
                                
                                // Let's simplify.
                                // If dropped on top half -> insert at `index`
                                // If dropped on bottom half -> insert at `index + 1`
                                
                                // Adjust for removal shift if necessary?
                                // If I move 0 to 2 (drop on 2's bottom).
                                // Remove 0. [1, 2]. Insert at 2+1? No, 2 is now at index 1.
                                // This is getting complicated.
                                
                                // Let's just use the Store's logic which is:
                                // splice(from, 1); splice(to, 0, item);
                                // If I want to move item 0 to position 2.
                                // splice(0, 1) -> list is [1, 2, 3]
                                // splice(2, 0, 0) -> list is [1, 2, 0, 3]
                                
                                // So if I drop on item 2 (index 2) at the bottom:
                                // I want it to be *after* item 2.
                                // In the original array, that position is index 3.
                                // But since 0 is removed, item 2 shifts to 1.
                                // So I want to insert at index 2.
                                
                                // Let's just pass the raw target index based on "insert before" logic.
                                // If bottom half, target = index + 1.
                                // If top half, target = index.
                                
                                // Store handles the splice.
                                // If from < to: we need to decrement to because removal shifted indices?
                                // Store:
                                // const [movedId] = this.state.slideOrder.splice(fromIndex, 1);
                                // this.state.slideOrder.splice(toIndex, 0, movedId);
                                
                                // If I have [A, B, C, D]
                                // Move A (0) to C (2).
                                // Drop on C bottom. Target should be after C.
                                // Visual: [B, C, A, D]
                                // Store op:
                                // splice(0, 1) -> [B, C, D]
                                // splice(?, 0, A) -> need index 2 to get [B, C, A, D]
                                
                                // So if target is "after C" (index 2 + 1 = 3 in original).
                                // We pass 3?
                                // splice(0, 1) -> [B, C, D]
                                // splice(3, 0, A) -> [B, C, D, A] -> Wrong.
                                // We need to pass 2.
                                // So if from < to, we decrement target?
                                
                                // Let's try to just implement "Insert Before" logic always.
                                // If dropped on bottom half of item i, it's equivalent to dropping on top half of item i+1.
                                
                                if (e.clientY > midpoint) {
                                    finalIndex = index + 1;
                                } else {
                                    finalIndex = index;
                                }
                                
                                // Correction for moving down
                                if (fromIndex < finalIndex) {
                                    finalIndex--;
                                }
                            } else {
                                // Moving up (from > to)
                                // [A, B, C, D]
                                // Move C (2) to A (0).
                                // Drop on A top. Target = 0.
                                // Store: splice(2, 1) -> [A, B, D]
                                // splice(0, 0, C) -> [C, A, B, D]. Correct.
                                
                                // Drop on A bottom. Target = 1.
                                // Store: splice(2, 1) -> [A, B, D]
                                // splice(1, 0, C) -> [A, C, B, D]. Correct.
                                
                                if (e.clientY > midpoint) {
                                    finalIndex = index + 1;
                                } else {
                                    finalIndex = index;
                                }
                            }
                        }
                        
                        store.dispatch('REORDER_SLIDES', { fromIndex, toIndex: finalIndex });
                    }
                    
                    // Cleanup
                    item.style.borderTop = '';
                    item.style.borderBottom = '';
                });

                list.appendChild(item);
            });
        }

        this.container.appendChild(list);
    }
}
