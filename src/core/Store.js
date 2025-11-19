import { EventEmitter } from './Events.js';

class Store extends EventEmitter {
    constructor() {
        super();
        
        // Initial State
        this.state = {
            meta: {
                title: "Untitled Presentation",
                author: "User",
                created: Date.now(),
                modified: Date.now(),
                theme: "default-dark"
            },
            editor: {
                activeSlideId: "slide-1",
                selectedElementIds: [],
                activeTool: "select", // 'select', 'text', 'rect', 'circle', 'hand'
                zoom: 1.0,
                pan: { x: 0, y: 0 },
                gridEnabled: true,
                snapToGrid: true
            },
            slides: {
                "slide-1": {
                    id: "slide-1",
                    title: "Introduction",
                    width: 1920,
                    height: 1080,
                    background: {
                        type: "solid",
                        value: "#ffffff"
                    },
                    elements: {}, // Map of ID -> Element
                    elementOrder: [], // Array of IDs (z-index)
                    notes: ""
                }
            },
            slideOrder: ["slide-1"]
        };
    }

    /**
     * Get current state snapshot
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Dispatch an action to update state
     * @param {string} type - Action type
     * @param {any} payload - Action data
     */
    dispatch(type, payload) {
        console.log(`Action: ${type}`, payload);

        switch (type) {
            case 'SET_ACTIVE_SLIDE':
                if (this.state.slides[payload]) {
                    this.state.editor.activeSlideId = payload;
                    this.emit('state-changed', this.state);
                }
                break;

            case 'SET_ACTIVE_TOOL':
                this.state.editor.activeTool = payload;
                // Clear selection when switching to creation tools
                if (payload !== 'select') {
                    this.state.editor.selectedElementIds = [];
                }
                this.emit('state-changed', this.state);
                break;

            case 'ADD_SLIDE':
                const newSlideId = `slide-${Date.now()}`;
                const newSlide = {
                    id: newSlideId,
                    title: "New Slide",
                    width: 1920,
                    height: 1080,
                    background: { type: "solid", value: "#ffffff" },
                    elements: {},
                    elementOrder: [],
                    notes: ""
                };
                this.state.slides[newSlideId] = newSlide;
                this.state.slideOrder.push(newSlideId);
                this.state.editor.activeSlideId = newSlideId;
                this.emit('state-changed', this.state);
                break;

            case 'DELETE_SLIDE':
                const slideIdToDelete = payload;
                // Don't delete if it's the only slide
                if (this.state.slideOrder.length <= 1) return;

                const indexToDelete = this.state.slideOrder.indexOf(slideIdToDelete);
                if (indexToDelete === -1) return;

                // Remove from order array
                this.state.slideOrder.splice(indexToDelete, 1);
                // Remove from slides map
                delete this.state.slides[slideIdToDelete];

                // Update active slide if we deleted the active one
                if (this.state.editor.activeSlideId === slideIdToDelete) {
                    // Select the previous one, or the next one (now at same index), or the first one
                    const newIndex = Math.max(0, indexToDelete - 1);
                    this.state.editor.activeSlideId = this.state.slideOrder[newIndex];
                }
                
                this.emit('state-changed', this.state);
                break;

            case 'DUPLICATE_SLIDE':
                const sourceId = payload;
                const sourceSlide = this.state.slides[sourceId];
                if (!sourceSlide) return;

                const dupId = `slide-${Date.now()}`;
                // Deep copy elements
                const newElements = {};
                Object.keys(sourceSlide.elements).forEach(key => {
                    newElements[key] = { ...sourceSlide.elements[key] };
                });

                const dupSlide = {
                    ...sourceSlide,
                    id: dupId,
                    title: `${sourceSlide.title} (Copy)`,
                    elements: newElements,
                    elementOrder: [...sourceSlide.elementOrder]
                };

                // Insert after source slide
                const sourceIndex = this.state.slideOrder.indexOf(sourceId);
                this.state.slides[dupId] = dupSlide;
                this.state.slideOrder.splice(sourceIndex + 1, 0, dupId);
                
                this.state.editor.activeSlideId = dupId;
                this.emit('state-changed', this.state);
                break;

            case 'REORDER_SLIDES':
                // Payload: { fromIndex, toIndex }
                const { fromIndex, toIndex } = payload;
                if (fromIndex < 0 || fromIndex >= this.state.slideOrder.length || 
                    toIndex < 0 || toIndex >= this.state.slideOrder.length) return;

                const [movedId] = this.state.slideOrder.splice(fromIndex, 1);
                this.state.slideOrder.splice(toIndex, 0, movedId);
                
                this.emit('state-changed', this.state);
                break;

            case 'REORDER_ELEMENTS':
                // Payload: { slideId, fromIndex, toIndex }
                // Note: elementOrder is bottom-to-top (0 is background-most)
                // But UI Layer Tree is top-to-bottom.
                // So if UI moves item at index 0 (top) to index 1,
                // it corresponds to moving last element of array to second-to-last.
                
                // Let's assume payload provides indices based on the `elementOrder` array directly
                // to avoid confusion. The UI should map visual index to array index.
                const { slideId, fromIndex: elFrom, toIndex: elTo } = payload;
                const slide = this.state.slides[slideId];
                if (!slide) return;
                
                if (elFrom < 0 || elFrom >= slide.elementOrder.length || 
                    elTo < 0 || elTo >= slide.elementOrder.length) return;

                const [movedElId] = slide.elementOrder.splice(elFrom, 1);
                slide.elementOrder.splice(elTo, 0, movedElId);
                
                this.emit('state-changed', this.state);
                break;

            case 'TOGGLE_ELEMENT_LOCK':
                // Payload: { id }
                const sLock = this.state.slides[this.state.editor.activeSlideId];
                if (sLock && sLock.elements[payload.id]) {
                    const el = sLock.elements[payload.id];
                    el.locked = !el.locked;
                    this.emit('state-changed', this.state);
                }
                break;

            case 'TOGGLE_ELEMENT_VISIBILITY':
                // Payload: { id }
                const sVis = this.state.slides[this.state.editor.activeSlideId];
                if (sVis && sVis.elements[payload.id]) {
                    const el = sVis.elements[payload.id];
                    el.hidden = !el.hidden;
                    this.emit('state-changed', this.state);
                }
                break;

            case 'ADD_ELEMENT':
                const activeSlideId = this.state.editor.activeSlideId;
                const activeSlide = this.state.slides[activeSlideId];
                if (activeSlide) {
                    activeSlide.elements[payload.id] = payload;
                    activeSlide.elementOrder.push(payload.id);
                    this.emit('state-changed', this.state);
                }
                break;

            case 'UPDATE_ELEMENT':
                const sId = this.state.editor.activeSlideId;
                const s = this.state.slides[sId];
                if (s && s.elements[payload.id]) {
                    s.elements[payload.id] = { ...s.elements[payload.id], ...payload };
                    this.emit('state-changed', this.state);
                }
                break;
                
            case 'UPDATE_VIEWPORT':
                this.state.editor.pan = payload.pan || this.state.editor.pan;
                this.state.editor.zoom = payload.zoom || this.state.editor.zoom;
                this.emit('viewport-changed', { pan: this.state.editor.pan, zoom: this.state.editor.zoom });
                break;

            case 'UPDATE_SELECTION':
                this.state.editor.selectedElementIds = payload; // Expecting array of IDs
                this.emit('state-changed', this.state);
                this.emit('selection-changed', this.state.editor.selectedElementIds);
                break;
                
            case 'TOGGLE_THEME':
                this.state.theme = this.state.theme === 'light' ? 'dark' : 'light';
                this.emit('theme-change', this.state.theme);
                break;

            default:
                console.warn(`Unknown action: ${type}`);
        }
    }
}

export const store = new Store();
