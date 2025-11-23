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
        const view = this.activeSlideViews.get(this.currentSlideId);
        
        if (view) {
            view.elements.forEach(el => {
                if (el.setEditing) {
                    if (el.data.id === editingId) {
                        el.setEditing(true);
                        
                        if (!el.domElement._hasBlurListener) {
                            el.domElement.addEventListener('blur', () => {
                                this.handleTextBlur(el);
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
        const div = el.domElement;
        const content = div.innerHTML;
        
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
