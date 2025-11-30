import { BaseRenderer } from './BaseRenderer.js';
import { store } from '../Store.js';
import { SlideView } from './SlideView.js';

export class EditorRenderer extends BaseRenderer {
    constructor(containerId) {
        super(containerId);
        this.currentSlideId = null;
        this.render(); // Initial render
    }

    render() {
        const state = store.getState();
        const mode = state.editor.mode;
        const activeId = mode === 'master' ? state.editor.activeMasterId : state.editor.activeSlideId;

        if (!activeId) return;

        // Check if slide changed
        if (this.currentSlideId !== activeId) {
            // Unmount old
            if (this.currentSlideId && this.activeSlideViews.has(this.currentSlideId)) {
                this.activeSlideViews.get(this.currentSlideId).unmount();
                this.activeSlideViews.delete(this.currentSlideId);
            }
            this.currentSlideId = activeId;
        }

        // Get Data
        const slideData = this.getEffectiveSlideData(activeId, mode);
        if (!slideData) return;

        // Get or Create View
        let view = this.activeSlideViews.get(activeId);
        if (!view) {
            view = new SlideView(activeId);
            view.mount(this.layers.content);
            this.activeSlideViews.set(activeId, view);
        }

        // Update View
        view.update(slideData);

        // Render Overlay (Handles, Selection)
        this.renderOverlay(state, slideData);
    }

    renderOverlay(state, slideData) {
        const editingId = state.editor.editingElementId;
        const selectionType = state.editor.editModeSelectionType;
        const clickPosition = state.editor.textEditClickPosition;
        const isNewlyCreated = state.editor.editModeIsNewlyCreated || false;
        const view = this.activeSlideViews.get(this.currentSlideId);
        
        if (view) {
            view.elements.forEach(el => {
                if (el.setEditing) {
                    if (el.data.id === editingId) {
                        el.setEditing(true, selectionType, clickPosition, isNewlyCreated);
                        
                        if (!el.domElement._hasBlurListener) {
                            el.domElement.addEventListener('blur', (event) => {
                                // Check if focus is moving to something within the same element
                                // (e.g., to a child element) - if so, don't exit edit mode
                                const relatedTarget = event.relatedTarget;
                                if (relatedTarget && el.domElement.contains(relatedTarget)) {
                                    return;
                                }
                                
                                // Add a delay to allow for focus to settle
                                // This handles cases where focus briefly leaves during typing
                                setTimeout(() => {
                                    // Double-check we're still not focused AND still in edit mode
                                    const currentState = store.getState();
                                    if (currentState.editor.editingElementId !== el.data.id) {
                                        // Already exited edit mode through another path
                                        return;
                                    }
                                    
                                    if (document.activeElement !== el.domElement && 
                                        !el.domElement.contains(document.activeElement)) {
                                        this.handleTextBlur(el);
                                    }
                                }, 50);
                            });
                            el.domElement._hasBlurListener = true;
                        }
                    } else {
                        el.setEditing(false);
                    }
                }
            });
        }
    }

    handleTextBlur(el) {
        const state = store.getState();
        
        // Only handle blur if this element is actually the one being edited
        // This prevents handling blur events that fire during focus transitions
        if (state.editor.editingElementId !== el.data.id) {
            return;
        }
        
        const div = el.domElement;
        const content = div.innerHTML;
        
        // Check if text content is effectively empty (whitespace only, or just <br> tags)
        const textContent = div.textContent?.trim() || '';
        const isEmptyContent = textContent === '' || content === '<br>' || content === '<br/>';
        
        if (isEmptyContent) {
            // Delete the element if it's empty
            store.dispatch('REMOVE_ELEMENT', el.data.id);
            store.dispatch('SET_EDITING_ELEMENT', null);
            return;
        }
        
        const updates = {
            id: el.data.id,
            content: content
        };

        // Handle Auto Resize - save final dimensions and position for auto-sizing modes
        // Check root level first, then style level for resizing mode
        const resizing = el.data.resizing || el.data.style?.resizing || 'fixedWidth';
        if (resizing === 'autoSize' || resizing === 'fixedWidth') {
            updates.width = div.offsetWidth;
            updates.height = div.offsetHeight;
            
            // Also save the live position if it was updated during editing
            // (for alignment-based anchor point adjustments)
            if (el._liveX !== undefined) {
                updates.x = el._liveX;
            }
            if (el._liveY !== undefined) {
                updates.y = el._liveY;
            }
            
            // Clear all live values
            el._liveX = undefined;
            el._liveY = undefined;
            el._liveWidth = undefined;
            el._liveHeight = undefined;
            el._livePosition = null;
            el._liveDimensions = null;
        }

        store.dispatch('UPDATE_ELEMENT', updates);
        store.dispatch('SET_EDITING_ELEMENT', null);
    }
}
