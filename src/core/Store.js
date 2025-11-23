import { EventEmitter } from './Events.js';
import { historyManager } from './HistoryManager.js';
import { createInitialState } from './store/InitialState.js';
import * as EditorHandlers from './store/handlers/EditorHandlers.js';
import * as PresentationHandlers from './store/handlers/PresentationHandlers.js';
import * as SlideHandlers from './store/handlers/SlideHandlers.js';
import * as ElementHandlers from './store/handlers/ElementHandlers.js';
import * as MasterHandlers from './store/handlers/MasterHandlers.js';

class Store extends EventEmitter {
    constructor() {
        super();
        this.state = createInitialState();
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
    dispatch(type, payload, options = {}) {
        // console.log(`Action: ${type}`, payload);
        const { fromHistory } = options;

        switch (type) {
            case 'UNDO':
                if (historyManager.canUndo()) {
                    const entry = historyManager.undo();
                    historyManager.addRedo(entry);
                    this.dispatch(entry.undo.type, entry.undo.payload, { fromHistory: true });
                }
                break;

            case 'REDO':
                if (historyManager.canRedo()) {
                    const entry = historyManager.redo();
                    historyManager.addUndo(entry);
                    this.dispatch(entry.redo.type, entry.redo.payload, { fromHistory: true });
                }
                break;

            // Editor Handlers
            case 'SELECT_SLIDE': EditorHandlers.handleSelectSlide(this, payload); break;
            case 'DESELECT_SLIDES': EditorHandlers.handleDeselectSlides(this); break;
            case 'SET_ACTIVE_SLIDE': EditorHandlers.handleSetActiveSlide(this, payload); break;
            case 'SET_ACTIVE_MASTER': EditorHandlers.handleSetActiveMaster(this, payload); break;
            case 'SET_ACTIVE_TOOL': EditorHandlers.handleSetActiveTool(this, payload); break;
            case 'SET_MODE': EditorHandlers.handleSetMode(this, payload); break;
            case 'SET_EDITING_ELEMENT': EditorHandlers.handleSetEditingElement(this, payload); break;
            case 'UPDATE_VIEWPORT': EditorHandlers.handleUpdateViewport(this, payload); break;
            case 'UPDATE_SELECTION': EditorHandlers.handleUpdateSelection(this, payload); break;
            case 'TOGGLE_THEME': EditorHandlers.handleToggleTheme(this); break;

            // Presentation Handlers
            case 'PRESENTATION_NEXT': PresentationHandlers.handlePresentationNext(this); break;
            case 'PRESENTATION_PREV': PresentationHandlers.handlePresentationPrev(this); break;
            case 'PRESENTATION_GOTO': PresentationHandlers.handlePresentationGoto(this, payload); break;
            case 'NEXT_BUILD': PresentationHandlers.handleNextBuild(this); break;
            case 'PREV_BUILD': PresentationHandlers.handlePrevBuild(this); break;
            case 'SET_BUILD_COUNT': PresentationHandlers.handleSetBuildCount(this, payload); break;
            case 'TOGGLE_LASER': PresentationHandlers.handleToggleLaser(this); break;
            case 'TOGGLE_BLACK_SCREEN': PresentationHandlers.handleToggleBlackScreen(this); break;
            case 'TOGGLE_WHITE_SCREEN': PresentationHandlers.handleToggleWhiteScreen(this); break;
            case 'TOGGLE_GRID_VIEW': PresentationHandlers.handleToggleGridView(this); break;

            // Slide Handlers
            case 'ADD_SLIDE': SlideHandlers.handleAddSlide(this); break;
            case 'DELETE_SLIDE': SlideHandlers.handleDeleteSlide(this, payload); break;
            case 'DUPLICATE_SLIDE': SlideHandlers.handleDuplicateSlide(this, payload); break;
            case 'PASTE_SLIDE': SlideHandlers.handlePasteSlide(this, payload); break;
            case 'REORDER_SLIDES': SlideHandlers.handleReorderSlides(this, payload); break;
            case 'UPDATE_SLIDE': SlideHandlers.handleUpdateSlide(this, payload, options); break;

            // Element Handlers
            case 'ADD_ELEMENT': ElementHandlers.handleAddElement(this, payload); break;
            case 'UPDATE_ELEMENT': ElementHandlers.handleUpdateElement(this, payload); break;
            case 'REMOVE_ELEMENT': ElementHandlers.handleRemoveElement(this, payload); break;
            case 'DUPLICATE_ELEMENTS': ElementHandlers.handleDuplicateElements(this, payload); break;
            case 'PASTE_ELEMENTS': ElementHandlers.handlePasteElements(this, payload); break;
            case 'REORDER_ELEMENTS': ElementHandlers.handleReorderElements(this, payload); break;
            case 'ALIGN_ELEMENTS': ElementHandlers.handleAlignElements(this, payload); break;
            case 'DISTRIBUTE_ELEMENTS': ElementHandlers.handleDistributeElements(this, payload); break;
            case 'TOGGLE_ELEMENT_LOCK': ElementHandlers.handleToggleElementLock(this, payload); break;
            case 'TOGGLE_ELEMENT_VISIBILITY': ElementHandlers.handleToggleElementVisibility(this, payload); break;
            case 'GROUP_ELEMENTS': ElementHandlers.handleGroupElements(this); break;
            case 'INSTANTIATE_PLACEHOLDER': ElementHandlers.handleInstantiatePlaceholder(this, payload); break;

            // Master Handlers
            case 'UPDATE_MASTER': MasterHandlers.handleUpdateMaster(this, payload); break;
            case 'UPDATE_THEME_SETTINGS': MasterHandlers.handleUpdateThemeSettings(this, payload, options); break;
        }
    }

    /**
     * Helper to get the effective slide composition (merging Theme -> Layout -> Slide)
     * This is used by the renderer to know what to draw.
     * @param {string} slideId 
     */
    getEffectiveSlide(slideId) {
        const slide = this.state.slides[slideId];
        if (!slide) return null;

        // If no layout, return slide as is (legacy support)
        if (!slide.layoutId || !this.state.masters || !this.state.masters[slide.layoutId]) {
            return {
                ...slide,
                effectiveBackground: slide.background || { type: 'solid', value: '#ffffff' },
                effectiveElements: slide.elements,
                effectiveOrder: slide.elementOrder
            };
        }

        const layout = this.state.masters[slide.layoutId];
        const theme = this.state.masters[layout.parentId];

        // Resolve Theme Settings
        const themeSettings = theme ? theme.themeSettings : (this.state.masters['theme-default']?.themeSettings || {});

        // 1. Resolve Background
        let background = slide.background;
        
        // If background is explicitly "inherited" or null/undefined, look up
        if (!background || background.type === 'inherited') {
             if (layout && layout.background && layout.background.type !== 'inherited') {
                 background = layout.background;
             } else if (theme && theme.background) {
                 background = theme.background;
             }
        }
        
        if (!background || background.type === 'inherited') {
             background = { type: 'solid', value: '#ffffff' };
        }

        // 2. Resolve Elements
        // We need to merge elements but keep them distinct so we know which are locked
        // For rendering, we just need a flat list in correct Z-order
        
        const effectiveElements = {};
        const effectiveOrder = [];

        // Theme Elements (Bottom)
        if (theme && !layout.hideBackgroundGraphics && !slide.hideBackgroundGraphics) {
            theme.elementOrder.forEach(id => {
                effectiveElements[id] = { ...theme.elements[id], isLocked: true, source: 'theme' };
                effectiveOrder.push(id);
            });
        }

        // Layout Elements (Middle)
        if (layout && !slide.hideBackgroundGraphics) {
            layout.elementOrder.forEach(id => {
                effectiveElements[id] = { ...layout.elements[id], isLocked: true, source: 'layout' };
                effectiveOrder.push(id);
            });
        }

        // Slide Elements (Top)
        slide.elementOrder.forEach(id => {
            effectiveElements[id] = { ...slide.elements[id], source: 'slide' };
            effectiveOrder.push(id);
        });

        return {
            ...slide,
            effectiveBackground: background,
            effectiveElements,
            effectiveOrder,
            themeSettings
        };
    }

    getActiveContainer() {
        if (this.state.editor.mode === 'master') {
            return this.state.masters[this.state.editor.activeMasterId];
        } else {
            return this.state.slides[this.state.editor.activeSlideId];
        }
    }
}

export const store = new Store();
