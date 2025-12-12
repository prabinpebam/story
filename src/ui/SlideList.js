import { store } from '../core/Store.js';
import { ThumbnailRenderer } from '../core/renderer/ThumbnailRenderer.js';
import { contextMenuManager, slideThumbnailConfig, masterThumbnailConfig } from './components/ContextMenu/index.js';
import { Button } from './components/Button.js';
import { Icons } from './Icons.js';

export class SlideList {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.init();
    }

    init() {
        // Register context menu zones
        contextMenuManager.register(slideThumbnailConfig);
        contextMenuManager.register(masterThumbnailConfig);
        
        this.isRenaming = false;
        this.render();

        // Subscribe to store
        store.on('state-changed', () => {
            if (!this.isRenaming) {
                this.render();
                // Auto-scroll to active slide after render
                this.scrollToActiveSlide();
            }
        });
    }
    
    /**
     * Scroll the active slide into view
     */
    scrollToActiveSlide() {
        // Small delay to ensure DOM is updated
        setTimeout(() => {
            const activeItem = this.container.querySelector('.slide-thumbnail.active');
            if (activeItem) {
                activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 50);
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
        header.className = 'slide-list-header';

        const title = document.createElement('div');
        title.className = 'section-title slide-list-title';
        title.innerText = 'MASTERS';
        
        const addBtn = new Button({
            icon: Icons.PLUS,
            variant: 'text',
            size: 'xs',
            title: 'Add Layout',
            onClick: () => {
                // Determine parent master
                const activeId = state.editor.activeMasterId;
                const activeMaster = state.slideMasterPresets[activeId];
                let parentMasterId = activeId;
                
                if (activeMaster && activeMaster.type === 'layoutMaster') {
                    parentMasterId = activeMaster.parentMasterId;
                }
                
                // If we still don't have a valid parent (e.g. no selection), pick the first master
                if (!parentMasterId || state.slideMasterPresets[parentMasterId]?.type !== 'slideMasterPreset') {
                    const firstMaster = Object.values(state.slideMasterPresets).find(m => m.type === 'slideMasterPreset');
                    if (firstMaster) parentMasterId = firstMaster.id;
                }
                
                if (parentMasterId) {
                    store.dispatch('ADD_LAYOUT', { parentMasterId });
                }
            }
        });
        
        header.appendChild(title);
        header.appendChild(addBtn.element);
        this.container.appendChild(header);

        // List Container
        const list = document.createElement('div');
        list.className = 'slide-list';

        // Get masters in display order
        const allMasters = state.slideMasterPresets;
        let themes;
        
        if (state.masterDisplayOrder && state.masterDisplayOrder.length > 0) {
            // Use display order if available
            themes = state.masterDisplayOrder
                .map(id => allMasters[id])
                .filter(m => m && m.type === 'slideMasterPreset');
        } else {
            // Fallback to object values
            themes = Object.values(allMasters).filter(m => m.type === 'slideMasterPreset');
        }

        themes.forEach(theme => {
            // 1. Render the Master Slide itself
            const masterItem = this.createThumbnailItem(theme, state, true);
            list.appendChild(masterItem);

            // 2. Render Layouts
            const layouts = (theme.layoutIds || [])
                .map(id => allMasters[id])
                .filter(m => m && m.type === 'layoutMaster' && m.parentMasterId === theme.id);
            
            if (layouts.length > 0) {
                const layoutsContainer = document.createElement('div');
                layoutsContainer.className = 'slide-layouts-container';
                
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
        item.setAttribute('data-testid', 'slide-list-item');
        if (isActive) {
            item.style.backgroundColor = 'var(--color-bg-active)';
            item.style.border = '1px solid var(--color-accent)';
        }

        // Title
        const info = document.createElement('div');
        info.className = 'slide-thumbnail-info';
        
        const icon = document.createElement('i');
        icon.className = isMasterRoot ? 'fa-solid fa-layer-group slide-thumbnail-icon' : 'fa-regular fa-file slide-thumbnail-icon';
        
        const titleText = document.createElement('span');
        titleText.innerText = slideOrMaster.name || (isMasterRoot ? 'Master' : 'Layout');
        titleText.className = isMasterRoot ? 'slide-thumbnail-title master-root' : 'slide-thumbnail-title';

        info.appendChild(icon);
        info.appendChild(titleText);
        item.appendChild(info);

        // Preview - Use ThumbnailRenderer for accurate representation
        // For masters/layouts, construct effective data
        const masterData = {
            ...slideOrMaster,
            // Masters use standard slide dimensions
            width: 1920,
            height: 1080,
            effectiveBackground: slideOrMaster.background,
            effectiveElements: slideOrMaster.elements || {},
            effectiveOrder: slideOrMaster.elementOrder || []
        };
        
        // If layout, inherit background from parent theme
        if (!isMasterRoot && (!masterData.effectiveBackground || masterData.effectiveBackground.type === 'inherited')) {
            const parentMasterId = slideOrMaster.parentMasterId;
            if (parentMasterId && state.slideMasterPresets[parentMasterId]) {
                masterData.effectiveBackground = state.slideMasterPresets[parentMasterId].background;
                // Note: themeSettings no longer exists, use colorThemeId instead
                masterData.colorThemeId = state.slideMasterPresets[parentMasterId].colorThemeId;
            }
        }
        
        const preview = ThumbnailRenderer.createThumbnail(id, masterData);
        item.appendChild(preview);

        // Click Handler
        item.addEventListener('click', () => {
            store.dispatch('SET_ACTIVE_MASTER', id);
        });
        
        // Context Menu Handler (right-click)
        item.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Select this master if not already active
            if (id !== state.editor.activeMasterId) {
                store.dispatch('SET_ACTIVE_MASTER', id);
            }
            
            contextMenuManager.show('master-thumbnail', e.clientX, e.clientY, {
                masterId: id,
                master: slideOrMaster,
                isTheme: isMasterRoot,
                isActive,
                startRename: () => this.startMasterRename(item, titleText, id)
            });
        });

        // Add drag and drop for master reordering (similar to slide mode)
        item.draggable = true;
        item.setAttribute('data-master-id', id);
        item.setAttribute('data-is-theme', isMasterRoot);
        
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', id);
            e.dataTransfer.setData('master-id', id);
            e.dataTransfer.setData('is-theme', isMasterRoot);
            e.dataTransfer.effectAllowed = 'move';
            
            // Create custom drag preview (80px max width, 16:9 aspect ratio)
            const dragPreview = this.createDragPreview(preview);
            document.body.appendChild(dragPreview);
            e.dataTransfer.setDragImage(dragPreview, 40, 22); // Center of 80x45
            
            // Clean up drag preview after drag starts
            setTimeout(() => {
                if (dragPreview.parentNode) {
                    dragPreview.remove();
                }
            }, 0);
            
            item.style.opacity = '0.5';
        });

        item.addEventListener('dragend', () => {
            item.style.opacity = '1';
            this.clearDropIndicators();
        });

        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'move';
            
            // Don't show indicator on the dragged item itself
            if (item.style.opacity === '0.5') {
                return;
            }
            
            // Clear all indicators first
            this.clearDropIndicators();
            
            // Visual feedback - add class for drop indicator
            const rect = item.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            if (e.clientY < midpoint) {
                item.classList.add('drop-before');
            } else {
                item.classList.add('drop-after');
            }
        });

        item.addEventListener('dragleave', (e) => {
            e.stopPropagation();
            // Only clear if we're actually leaving this element
            const rect = item.getBoundingClientRect();
            const x = e.clientX;
            const y = e.clientY;
            
            // If mouse is outside the bounding box, clear the indicator
            if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                item.classList.remove('drop-before', 'drop-after');
            }
        });

        item.addEventListener('drop', (e) => {
            e.preventDefault();
            const draggedId = e.dataTransfer.getData('master-id');
            const targetId = id;
            
            if (draggedId && draggedId !== targetId) {
                // Determine target position based on drop location
                const rect = item.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;
                const insertBefore = e.clientY < midpoint;
                
                // Dispatch reorder action
                store.dispatch('REORDER_MASTERS', {
                    draggedId,
                    targetId,
                    insertBefore
                });
            }
            
            // Clear drop indicators
            this.clearDropIndicators();
        });

        return item;
    }
    
    /**
     * Start inline rename for a master/layout
     */
    startMasterRename(item, titleElement, masterId) {
        this.isRenaming = true;
        const currentName = titleElement.innerText;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.className = 'slide-rename-input';
        
        titleElement.classList.add('hidden');
        titleElement.parentNode.appendChild(input);
        input.focus();
        input.select();
        
        const finishRename = () => {
            const newName = input.value.trim();
            if (newName && newName !== currentName) {
                store.dispatch('RENAME_MASTER', { id: masterId, name: newName });
            }
            input.remove();
            titleElement.classList.remove('hidden');
            this.isRenaming = false;
        };
        
        input.addEventListener('blur', finishRename);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                finishRename();
            } else if (e.key === 'Escape') {
                input.value = currentName;
                finishRename();
            }
        });
    }

    renderSlideList(state) {
        // List (no header - now handled by LeftPanel accordion)
        const list = document.createElement('div');
        list.className = 'slide-list';

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
                item.setAttribute('data-testid', `slide-thumbnail-${index}`);

                // Slide Number (overlay on thumbnail)
                const number = document.createElement('span');
                number.innerText = index + 1;
                number.className = 'slide-number';
                item.appendChild(number);

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
                    
                    // Auto-scroll to ensure slide is visible
                    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                });
                
                // Context Menu Handler (right-click)
                item.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Select this slide if not already selected
                    if (!state.editor.selectedSlideIds?.includes(slideId)) {
                        store.dispatch('SET_ACTIVE_SLIDE', slideId);
                        store.dispatch('SELECT_SLIDE', { id: slideId, multi: e.ctrlKey || e.metaKey });
                    }
                    
                    contextMenuManager.show('slide-thumbnail', e.clientX, e.clientY, {
                        slideId,
                        slide,
                        slideIndex: index,
                        isActive,
                        selectedSlideIds: state.editor.selectedSlideIds || [slideId],
                        startRename: () => this.startSlideRename(slideId)
                    });
                });

                // Drag and Drop
                item.draggable = true;
                item.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', index);
                    e.dataTransfer.effectAllowed = 'move';
                    
                    // Create custom drag image (80px max width, 16:9 aspect ratio)
                    const dragPreview = this.createDragPreview(preview);
                    document.body.appendChild(dragPreview);
                    e.dataTransfer.setDragImage(dragPreview, 40, 22); // Center of 80x45
                    
                    // Clean up drag preview after drag starts
                    setTimeout(() => {
                        if (dragPreview.parentNode) {
                            dragPreview.remove();
                        }
                    }, 0);
                    
                    item.style.opacity = '0.5';
                });

                item.addEventListener('dragend', () => {
                    item.style.opacity = '1';
                    // Remove any drop indicators
                    this.clearDropIndicators();
                });

                item.addEventListener('dragover', (e) => {
                    e.preventDefault(); // Necessary to allow dropping
                    e.stopPropagation(); // Prevent event bubbling
                    e.dataTransfer.dropEffect = 'move';
                    
                    // Don't show indicator on the dragged item itself
                    if (item.style.opacity === '0.5') {
                        return;
                    }
                    
                    // Clear all indicators first
                    this.clearDropIndicators();
                    
                    // Visual feedback - add class for drop indicator
                    const rect = item.getBoundingClientRect();
                    const midpoint = rect.top + rect.height / 2;
                    if (e.clientY < midpoint) {
                        item.classList.add('drop-before');
                    } else {
                        item.classList.add('drop-after');
                    }
                });

                item.addEventListener('dragleave', (e) => {
                    e.stopPropagation();
                    // Only clear if we're actually leaving this element
                    // Check if the related target (where we're entering) is outside this item
                    const rect = item.getBoundingClientRect();
                    const x = e.clientX;
                    const y = e.clientY;
                    
                    // If mouse is outside the bounding box, clear the indicator
                    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                        item.classList.remove('drop-before', 'drop-after');
                    }
                });

                item.addEventListener('drop', (e) => {
                    e.preventDefault();
                    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                    const toIndex = index;
                    
                    if (fromIndex !== toIndex) {
                        // Determine target position based on drop location
                        const rect = item.getBoundingClientRect();
                        const midpoint = rect.top + rect.height / 2;
                        let targetIndex;
                        
                        // Calculate insert position
                        // - Top half: insert before this item
                        // - Bottom half: insert after this item
                        if (e.clientY < midpoint) {
                            targetIndex = toIndex;
                        } else {
                            targetIndex = toIndex + 1;
                        }
                        
                        // Adjust for splice behavior when moving down
                        // Store does: splice(from, 1) then splice(to, 0, item)
                        // When moving down, removal shifts indices, so decrement target
                        if (fromIndex < targetIndex) {
                            targetIndex--;
                        }
                        
                        store.dispatch('REORDER_SLIDES', { fromIndex, toIndex: targetIndex });
                    }
                    
                    // Clear drop indicators
                    this.clearDropIndicators();
                });

                list.appendChild(item);
            });
        }

        this.container.appendChild(list);
    }
    
    /**
     * Start inline rename for a slide
     * Creates a temporary input overlay on the thumbnail
     */
    startSlideRename(slideId) {
        this.isRenaming = true;
        const state = store.getState();
        const slide = state.slides[slideId];
        const currentName = slide?.title || 'Untitled Slide';
        
        // Find the slide thumbnail element
        const slideIndex = state.slideOrder.indexOf(slideId);
        const item = this.container.querySelector(`[data-testid="slide-thumbnail-${slideIndex}"]`);
        if (!item) return;
        
        // Create input overlay
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.className = 'slide-rename-input slide-title-input';
        input.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10;
            width: 80%;
        `;
        
        item.style.position = 'relative';
        item.appendChild(input);
        input.focus();
        input.select();
        
        const finishRename = () => {
            const newName = input.value.trim();
            if (newName && newName !== currentName) {
                store.dispatch('RENAME_SLIDE', { id: slideId, title: newName });
            }
            input.remove();
            item.style.position = '';
            this.isRenaming = false;
        };
        
        input.addEventListener('blur', finishRename);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                finishRename();
            } else if (e.key === 'Escape') {
                input.value = currentName;
                finishRename();
            }
        });
    }
    
    /**
     * Create a drag preview image for slide thumbnails
     * Fixed size: 80px max width with 16:9 aspect ratio (80x45)
     * @param {HTMLElement} preview - The original slide preview element
     * @returns {HTMLElement} - Drag preview element
     */
    createDragPreview(preview) {
        const dragPreview = document.createElement('div');
        dragPreview.style.cssText = `
            position: fixed;
            top: -1000px;
            left: -1000px;
            width: 80px;
            height: 45px;
            border-radius: var(--radius-md);
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            pointer-events: none;
            z-index: 10000;
        `;
        
        // Clone the preview content
        const previewClone = preview.cloneNode(true);
        previewClone.style.width = '100%';
        previewClone.style.height = '100%';
        dragPreview.appendChild(previewClone);
        
        return dragPreview;
    }
    
    /**
     * Clear all drop indicator classes from thumbnails
     */
    clearDropIndicators() {
        const items = this.container.querySelectorAll('.slide-thumbnail');
        items.forEach(item => {
            item.classList.remove('drop-before', 'drop-after');
        });
    }
}
