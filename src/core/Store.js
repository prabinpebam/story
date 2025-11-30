import { EventEmitter } from './Events.js';
import { historyManager } from './HistoryManager.js';
import { produce } from '../vendor/immer.js';
import { createInitialState } from './store/InitialState.js';
import * as EditorHandlers from './store/handlers/EditorHandlers.js';
import * as PresentationHandlers from './store/handlers/PresentationHandlers.js';
import * as SlideHandlers from './store/handlers/SlideHandlers.js';
import * as ElementHandlers from './store/handlers/ElementHandlers.js';
import * as MasterHandlers from './store/handlers/MasterHandlers.js';
import * as UIHandlers from './store/handlers/UIHandlers.js';
import * as AuthHandlers from './store/handlers/AuthHandlers.js';
import * as TextEditHandlers from './store/handlers/TextEditHandlers.js';

class Store extends EventEmitter {
    constructor() {
        super();
        this.state = createInitialState();
        this.isInteracting = false;
    }

    /**
     * Create a snapshot of the current state
     * @param {string} description - Optional description for debugging
     */
    snapshot(description = 'Unknown Action') {
        if (!this.isInteracting) {
            historyManager.push(this.state, { description });
        }
    }

    /**
     * Restore state from a snapshot
     * @param {Object} newState 
     */
    restoreState(newState) {
        this.state = newState;
        this.emit('state-changed', this.state);
        this.emit('STATE_RESTORED');
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
                    const previous = historyManager.undo(this.state);
                    if (previous) {
                        this.restoreState(previous.state);
                    }
                }
                break;

            case 'REDO':
                if (historyManager.canRedo()) {
                    const next = historyManager.redo(this.state);
                    if (next) {
                        this.restoreState(next.state);
                    }
                }
                break;

            // Editor Handlers
            case 'SELECT_SLIDE': 
            case 'DESELECT_SLIDES': 
            case 'SET_ACTIVE_SLIDE': 
            case 'SET_ACTIVE_MASTER': 
            case 'SET_ACTIVE_TOOL': 
            case 'SET_DRAG_PLACEHOLDER':
            case 'SET_MODE': 
            case 'SET_EDITING_ELEMENT': 
            case 'UPDATE_VIEWPORT': 
            case 'UPDATE_SELECTION': 
            case 'TOGGLE_THEME': 
            case 'TOGGLE_CONSTRAIN_PROPORTIONS':
                // Handle interaction state for text editing (prevents multiple history entries)
                if (type === 'SET_EDITING_ELEMENT') {
                    const isEnteringEditMode = payload && (typeof payload === 'string' || payload.id);
                    const isExitingEditMode = !payload || (typeof payload === 'object' && payload.id === null);
                    
                    if (isEnteringEditMode && !this.isInteracting) {
                        // Create snapshot before entering edit mode
                        this.snapshot('Enter Text Edit');
                        this.isInteracting = true;
                    } else if (isExitingEditMode && this.isInteracting) {
                        this.isInteracting = false;
                    }
                }
                
                this.state = produce(this.state, draft => {
                    switch(type) {
                        case 'SELECT_SLIDE': EditorHandlers.handleSelectSlide(draft, payload); break;
                        case 'DESELECT_SLIDES': EditorHandlers.handleDeselectSlides(draft); break;
                        case 'SET_ACTIVE_SLIDE': EditorHandlers.handleSetActiveSlide(draft, payload); break;
                        case 'SET_ACTIVE_MASTER': EditorHandlers.handleSetActiveMaster(draft, payload); break;
                        case 'SET_ACTIVE_TOOL': EditorHandlers.handleSetActiveTool(draft, payload); break;
                        case 'SET_DRAG_PLACEHOLDER': EditorHandlers.handleSetDragPlaceholder(draft, payload); break;
                        case 'SET_MODE': EditorHandlers.handleSetMode(draft, payload); break;
                        case 'SET_EDITING_ELEMENT': EditorHandlers.handleSetEditingElement(draft, payload); break;
                        case 'UPDATE_VIEWPORT': EditorHandlers.handleUpdateViewport(draft, payload); break;
                        case 'UPDATE_SELECTION': EditorHandlers.handleUpdateSelection(draft, payload); break;
                        case 'TOGGLE_THEME': EditorHandlers.handleToggleTheme(draft); break;
                        case 'TOGGLE_CONSTRAIN_PROPORTIONS': EditorHandlers.handleToggleConstrainProportions(draft, payload); break;
                    }
                });
                
                this.emit('state-changed', this.state);
                
                if (type === 'SET_MODE') this.emit('mode-changed', payload);
                if (type === 'UPDATE_VIEWPORT') this.emit('viewport-changed', { pan: this.state.editor.pan, zoom: this.state.editor.zoom });
                if (type === 'UPDATE_SELECTION') this.emit('selection-changed', this.state.editor.selectedElementIds);
                if (type === 'TOGGLE_THEME') this.emit('theme-change', this.state.theme);
                if (type === 'SET_EDITING_ELEMENT') this.emit('editing-changed', this.state.editor.editingElementId);
                break;

            // Presentation Handlers
            case 'PRESENTATION_NEXT': 
            case 'PRESENTATION_PREV': 
            case 'PRESENTATION_GOTO': 
            case 'NEXT_BUILD': 
            case 'PREV_BUILD': 
            case 'SET_BUILD_COUNT': 
            case 'TOGGLE_LASER': 
            case 'TOGGLE_BLACK_SCREEN': 
            case 'TOGGLE_WHITE_SCREEN': 
            case 'TOGGLE_GRID_VIEW':
                this.state = produce(this.state, draft => {
                    switch(type) {
                        case 'PRESENTATION_NEXT': PresentationHandlers.handlePresentationNext(draft); break;
                        case 'PRESENTATION_PREV': PresentationHandlers.handlePresentationPrev(draft); break;
                        case 'PRESENTATION_GOTO': PresentationHandlers.handlePresentationGoto(draft, payload); break;
                        case 'NEXT_BUILD': PresentationHandlers.handleNextBuild(draft); break;
                        case 'PREV_BUILD': PresentationHandlers.handlePrevBuild(draft); break;
                        case 'SET_BUILD_COUNT': PresentationHandlers.handleSetBuildCount(draft, payload); break;
                        case 'TOGGLE_LASER': PresentationHandlers.handleToggleLaser(draft); break;
                        case 'TOGGLE_BLACK_SCREEN': PresentationHandlers.handleToggleBlackScreen(draft); break;
                        case 'TOGGLE_WHITE_SCREEN': PresentationHandlers.handleToggleWhiteScreen(draft); break;
                        case 'TOGGLE_GRID_VIEW': PresentationHandlers.handleToggleGridView(draft); break;
                    }
                });
                this.emit('state-changed', this.state);
                break;

            // Slide Handlers
            case 'ADD_SLIDE': 
            case 'DELETE_SLIDE': 
            case 'DUPLICATE_SLIDE': 
            case 'PASTE_SLIDE': 
            case 'REORDER_SLIDES': 
            case 'UPDATE_SLIDE': 
                this.snapshot(type);
                this.state = produce(this.state, draft => {
                    switch(type) {
                        case 'ADD_SLIDE': SlideHandlers.handleAddSlide(draft, payload); break;
                        case 'DELETE_SLIDE': SlideHandlers.handleDeleteSlide(draft, payload); break;
                        case 'DUPLICATE_SLIDE': SlideHandlers.handleDuplicateSlide(draft, payload); break;
                        case 'PASTE_SLIDE': SlideHandlers.handlePasteSlide(draft, payload); break;
                        case 'REORDER_SLIDES': SlideHandlers.handleReorderSlides(draft, payload); break;
                        case 'UPDATE_SLIDE': SlideHandlers.handleUpdateSlide(draft, payload); break;
                    }
                });
                this.emit('state-changed', this.state);
                break;

            // Element Handlers
            case 'ADD_ELEMENT': 
            case 'UPDATE_ELEMENT': 
            case 'REMOVE_ELEMENT': 
            case 'DUPLICATE_ELEMENTS': 
            case 'PASTE_ELEMENTS': 
            case 'REORDER_ELEMENTS': 
            case 'ALIGN_ELEMENTS': 
            case 'DISTRIBUTE_ELEMENTS': 
            case 'TOGGLE_ELEMENT_LOCK': 
            case 'TOGGLE_ELEMENT_VISIBILITY': 
            case 'GROUP_ELEMENTS': 
            case 'INSTANTIATE_PLACEHOLDER': 
                this.snapshot(type);
                this.state = produce(this.state, draft => {
                    switch(type) {
                        case 'ADD_ELEMENT': ElementHandlers.handleAddElement(draft, payload); break;
                        case 'UPDATE_ELEMENT': ElementHandlers.handleUpdateElement(draft, payload); break;
                        case 'REMOVE_ELEMENT': ElementHandlers.handleRemoveElement(draft, payload); break;
                        case 'DUPLICATE_ELEMENTS': ElementHandlers.handleDuplicateElements(draft, payload); break;
                        case 'PASTE_ELEMENTS': ElementHandlers.handlePasteElements(draft, payload); break;
                        case 'REORDER_ELEMENTS': ElementHandlers.handleReorderElements(draft, payload); break;
                        case 'ALIGN_ELEMENTS': ElementHandlers.handleAlignElements(draft, payload); break;
                        case 'DISTRIBUTE_ELEMENTS': ElementHandlers.handleDistributeElements(draft, payload); break;
                        case 'TOGGLE_ELEMENT_LOCK': ElementHandlers.handleToggleElementLock(draft, payload); break;
                        case 'TOGGLE_ELEMENT_VISIBILITY': ElementHandlers.handleToggleElementVisibility(draft, payload); break;
                        case 'GROUP_ELEMENTS': ElementHandlers.handleGroupElements(draft); break;
                        case 'INSTANTIATE_PLACEHOLDER': ElementHandlers.handleInstantiatePlaceholder(draft, payload); break;
                    }
                });
                this.emit('state-changed', this.state);
                break;

            // Master Handlers
            case 'UPDATE_MASTER': 
            case 'UPDATE_THEME_SETTINGS':
            case 'APPLY_COLOR_PRESET':
            case 'RESET_THEME_COLORS':
            case 'UPDATE_THEME_COLOR':
            case 'APPLY_FONT_PRESET':
            case 'RESET_THEME_FONTS':
            case 'UPDATE_THEME_FONT':
            case 'UPDATE_TEXT_STYLE':
            case 'ADD_ELEMENT_TO_MASTER':
            case 'DELETE_ELEMENT_FROM_MASTER':
                this.snapshot(type);
                this.state = produce(this.state, draft => {
                    switch(type) {
                        case 'UPDATE_MASTER': MasterHandlers.handleUpdateMaster(draft, payload); break;
                        case 'UPDATE_THEME_SETTINGS': MasterHandlers.handleUpdateThemeSettings(draft, payload); break;
                        case 'APPLY_COLOR_PRESET': MasterHandlers.handleApplyColorPreset(draft, payload); break;
                        case 'RESET_THEME_COLORS': MasterHandlers.handleResetThemeColors(draft, payload); break;
                        case 'UPDATE_THEME_COLOR': MasterHandlers.handleUpdateThemeColor(draft, payload); break;
                        case 'APPLY_FONT_PRESET': MasterHandlers.handleApplyFontPreset(draft, payload); break;
                        case 'RESET_THEME_FONTS': MasterHandlers.handleResetThemeFonts(draft, payload); break;
                        case 'UPDATE_THEME_FONT': MasterHandlers.handleUpdateThemeFont(draft, payload); break;
                        case 'UPDATE_TEXT_STYLE': MasterHandlers.handleUpdateTextStyle(draft, payload); break;
                        case 'ADD_ELEMENT_TO_MASTER': MasterHandlers.handleAddElementToMaster(draft, payload); break;
                        case 'DELETE_ELEMENT_FROM_MASTER': MasterHandlers.handleDeleteElementFromMaster(draft, payload); break;
                    }
                });
                this.emit('state-changed', this.state);
                break;

            // Interaction Handlers
            case 'START_INTERACTION':
                this.snapshot('Interaction Start');
                this.isInteracting = true;
                break;

            case 'END_INTERACTION':
                this.isInteracting = false;
                // Optional: Snapshot at end if we want to ensure the final state is saved
                // But usually we snapshot BEFORE the change. 
                // If we snapshot here, it would be the state AFTER the interaction.
                // The next action will snapshot the state BEFORE it happens, which is this state.
                // So we don't strictly need to snapshot here unless we want a "checkpoint".
                break;

            // UI Handlers
            case 'UI_INTERACTION_START': 
            case 'UI_INTERACTION_END':
                this.state = produce(this.state, draft => {
                    switch(type) {
                        case 'UI_INTERACTION_START': UIHandlers.handleUIInteractionStart(draft); break;
                        case 'UI_INTERACTION_END': UIHandlers.handleUIInteractionEnd(draft); break;
                    }
                });
                this.emit('state-changed', this.state);
                break;

            // Auth Handlers
            case 'AUTH_LOGIN_START':
            case 'AUTH_LOGIN_SUCCESS':
            case 'AUTH_LOGIN_FAILURE':
            case 'AUTH_LOGOUT':
            case 'AUTH_UPDATE_PROFILE':
                this.state = produce(this.state, draft => {
                    switch(type) {
                        case 'AUTH_LOGIN_START': AuthHandlers.handleLoginStart(draft); break;
                        case 'AUTH_LOGIN_SUCCESS': AuthHandlers.handleLoginSuccess(draft, payload); break;
                        case 'AUTH_LOGIN_FAILURE': AuthHandlers.handleLoginFailure(draft, payload); break;
                        case 'AUTH_LOGOUT': AuthHandlers.handleLogout(draft); break;
                        case 'AUTH_UPDATE_PROFILE': AuthHandlers.handleUpdateProfile(draft, payload); break;
                    }
                });
                this.emit('state-changed', this.state);
                if (type === 'AUTH_LOGIN_SUCCESS') this.emit('auth-changed', { isAuthenticated: true, user: payload });
                if (type === 'AUTH_LOGOUT') this.emit('auth-changed', { isAuthenticated: false, user: null });
                break;

            // File/Presentation Handlers
            case 'RESET_STATE':
                // Reset to initial state for new presentation
                this.state = createInitialState();
                historyManager.clear();
                this.emit('state-changed', this.state);
                this.emit('presentation-reset');
                break;

            case 'LOAD_PRESENTATION':
                // Load a complete presentation state
                if (payload && payload.slides) {
                    this.state = produce(this.state, draft => {
                        // Convert slides array to object keyed by ID
                        const slidesArray = Array.isArray(payload.slides) ? payload.slides : Object.values(payload.slides);
                        const slidesObj = {};
                        const slideOrder = [];
                        
                        for (const slide of slidesArray) {
                            if (slide && slide.id) {
                                // Convert elements array to object keyed by ID if needed
                                if (Array.isArray(slide.elements)) {
                                    const elementsObj = {};
                                    // Use existing elementOrder if provided, otherwise build from array order
                                    const elementOrder = slide.elementOrder && slide.elementOrder.length > 0 
                                        ? [...slide.elementOrder] 
                                        : [];
                                    
                                    for (const el of slide.elements) {
                                        if (el && el.id) {
                                            elementsObj[el.id] = el;
                                            // Only add to elementOrder if not already there
                                            if (!elementOrder.includes(el.id)) {
                                                elementOrder.push(el.id);
                                            }
                                        }
                                    }
                                    slide.elements = elementsObj;
                                    slide.elementOrder = elementOrder;
                                }
                                slidesObj[slide.id] = slide;
                                slideOrder.push(slide.id);
                            }
                        }
                        
                        draft.slides = slidesObj;
                        draft.slideOrder = slideOrder;
                        
                        // Replace masters if provided
                        if (payload.masters) {
                            draft.masters = payload.masters;
                        }
                        
                        // Update metadata if provided
                        if (payload.metadata) {
                            draft.meta = {
                                ...draft.meta,
                                ...payload.metadata
                            };
                        }
                        
                        // Reset editor to first slide
                        if (slideOrder.length > 0) {
                            draft.editor.activeSlideId = slideOrder[0];
                        }
                        draft.editor.selectedElementIds = [];
                        draft.editor.mode = 'edit';
                    });
                    historyManager.clear();
                    this.emit('state-changed', this.state);
                    this.emit('presentation-loaded');
                }
                break;

            // Text Edit Handlers
            case 'ENTER_TEXT_EDIT':
            case 'EXIT_TEXT_EDIT':
            case 'SAVE_TEXT_CONTENT':
            case 'MARK_TEXT_DIRTY':
                this.state = produce(this.state, draft => {
                    switch(type) {
                        case 'ENTER_TEXT_EDIT': TextEditHandlers.handleEnterTextEdit(draft, payload); break;
                        case 'EXIT_TEXT_EDIT': TextEditHandlers.handleExitTextEdit(draft); break;
                        case 'SAVE_TEXT_CONTENT': TextEditHandlers.handleSaveTextContent(draft, payload); break;
                        case 'MARK_TEXT_DIRTY': TextEditHandlers.handleMarkTextDirty(draft, payload); break;
                    }
                });
                this.emit('state-changed', this.state);
                if (type === 'ENTER_TEXT_EDIT') this.emit('text-edit-started', payload);
                if (type === 'EXIT_TEXT_EDIT') this.emit('text-edit-ended');
                break;
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
            const slideEl = slide.elements[id];
            if (slideEl) {
                // Slide elements override layout elements with same ID
                effectiveElements[id] = { ...slideEl, source: 'slide' };
                if (!effectiveOrder.includes(id)) {
                    effectiveOrder.push(id);
                }
            }
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
