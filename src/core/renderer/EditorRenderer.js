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
        const view = this.activeSlideViews.get(this.currentSlideId);
        
        console.log('[DEBUG] renderOverlay - editingId:', editingId, 'selectionType:', selectionType);
        
        if (view) {
            view.elements.forEach(el => {
                if (el.setEditing) {
                    if (el.data.id === editingId) {
                        console.log('[DEBUG] Calling setEditing(true) on', el.data.id);
                        el.setEditing(true, selectionType, clickPosition);
                        
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
            store.dispatch('DELETE_ELEMENT', el.data.id);
            store.dispatch('SET_EDITING_ELEMENT', null);
            return;
        }
        
        const updates = {
            id: el.data.id,
            content: content
        };

        // Handle Auto Resize
        const resizing = el.data.style?.resizing || 'autoHeight';
        if (resizing === 'autoWidth' || resizing === 'autoHeight') {
            updates.width = div.offsetWidth;
            updates.height = div.offsetHeight;
        }

        store.dispatch('UPDATE_ELEMENT', updates);
        store.dispatch('SET_EDITING_ELEMENT', null);
    }
}
