/**
 * MenuActionHandler - Routes menu actions to appropriate handlers
 * 
 * Maps menu item IDs to their respective functionality across
 * the application (file operations, edit, view, etc.)
 */

import { store } from '../../core/Store.js';
import { fileService } from './FileService.js';

class MenuActionHandler {
    constructor() {
        this.handlers = new Map();
        this.setupHandlers();
        this.bindEvents();
    }

    /**
     * Setup all menu action handlers
     */
    setupHandlers() {
        // File operations
        this.register('file-new', () => fileService.newPresentation());
        this.register('file-open', () => fileService.open());
        this.register('file-save', () => fileService.save());
        this.register('file-save-as', () => fileService.saveAs());
        
        // Cloud file operations
        this.register('open-onedrive', () => {
            console.log('[MenuActionHandler] open-onedrive action triggered');
            return fileService.openFromCloud('onedrive');
        });
        this.register('open-google-drive', () => {
            console.log('[MenuActionHandler] open-google-drive action triggered');
            return fileService.openFromCloud('google-drive');
        });
        this.register('save-onedrive', () => fileService.saveToCloud('onedrive'));
        this.register('save-google-drive', () => fileService.saveToCloud('google-drive'));

        // Edit operations
        this.register('edit-undo', () => store.dispatch('UNDO'));
        this.register('edit-redo', () => store.dispatch('REDO'));
        this.register('edit-cut', () => this.cutSelection());
        this.register('edit-copy', () => this.copySelection());
        this.register('edit-paste', () => this.pasteClipboard());
        this.register('edit-duplicate', () => store.dispatch('DUPLICATE_ELEMENTS'));
        this.register('edit-delete', () => store.dispatch('DELETE_SELECTED'));
        this.register('edit-select-all', () => store.dispatch('SELECT_ALL_ELEMENTS'));
        this.register('edit-deselect', () => store.dispatch('UPDATE_SELECTION', []));

        // View operations
        this.register('view-zoom-in', () => this.zoomIn());
        this.register('view-zoom-out', () => this.zoomOut());
        this.register('view-fit', () => this.fitToScreen());
        this.register('view-actual', () => this.actualSize());
        this.register('view-grid', () => this.toggleGrid());
        this.register('view-guides', () => this.toggleGuides());
        this.register('view-rulers', () => this.toggleRulers());
        this.register('theme-dark', () => this.setTheme('dark'));
        this.register('theme-light', () => this.setTheme('light'));

        // Slide operations
        this.register('slide-new', () => store.dispatch('ADD_SLIDE'));
        this.register('slide-duplicate', () => store.dispatch('DUPLICATE_SLIDE'));
        this.register('slide-delete', () => store.dispatch('DELETE_SLIDE'));
        this.register('slide-edit-master', () => this.toggleMasterEdit());
        this.register('slide-move-up', () => store.dispatch('MOVE_SLIDE_UP'));
        this.register('slide-move-down', () => store.dispatch('MOVE_SLIDE_DOWN'));

        // Arrange operations
        this.register('arrange-front', () => store.dispatch('BRING_TO_FRONT'));
        this.register('arrange-forward', () => store.dispatch('BRING_FORWARD'));
        this.register('arrange-backward', () => store.dispatch('SEND_BACKWARD'));
        this.register('arrange-back', () => store.dispatch('SEND_TO_BACK'));
        this.register('arrange-group', () => store.dispatch('GROUP_ELEMENTS'));
        this.register('arrange-ungroup', () => store.dispatch('UNGROUP_ELEMENTS'));
        this.register('arrange-lock', () => store.dispatch('LOCK_ELEMENTS'));
        this.register('arrange-unlock', () => store.dispatch('UNLOCK_ALL'));

        // Align operations
        this.register('align-left', () => store.dispatch('ALIGN_ELEMENTS', 'left'));
        this.register('align-center-h', () => store.dispatch('ALIGN_ELEMENTS', 'center-h'));
        this.register('align-right', () => store.dispatch('ALIGN_ELEMENTS', 'right'));
        this.register('align-top', () => store.dispatch('ALIGN_ELEMENTS', 'top'));
        this.register('align-center-v', () => store.dispatch('ALIGN_ELEMENTS', 'center-v'));
        this.register('align-bottom', () => store.dispatch('ALIGN_ELEMENTS', 'bottom'));
        this.register('distribute-h', () => store.dispatch('DISTRIBUTE_ELEMENTS', 'horizontal'));
        this.register('distribute-v', () => store.dispatch('DISTRIBUTE_ELEMENTS', 'vertical'));

        // Insert operations
        this.register('insert-rectangle', () => store.dispatch('SET_ACTIVE_TOOL', 'shape'));
        this.register('insert-ellipse', () => store.dispatch('SET_ACTIVE_TOOL', 'ellipse'));
        this.register('insert-line', () => store.dispatch('SET_ACTIVE_TOOL', 'line'));
        this.register('insert-text', () => store.dispatch('SET_ACTIVE_TOOL', 'text'));
        this.register('insert-image', () => this.openImagePicker());
        this.register('insert-svg', () => this.openSvgPicker());
        this.register('insert-video', () => this.openVideoPicker());
        this.register('insert-icon', () => this.openIconLibrary());
        this.register('insert-code', () => this.openCodeFillPanel());

        // Present operations
        this.register('present-start', () => this.startPresentation({ slideIndex: 0, requestFullscreen: true }));
        this.register('present-current', () => this.startPresentationFromCurrent());
        this.register('present-window', () => this.startPresentation({ slideIndex: 0, requestFullscreen: false }));
        this.register('present-presenter', () => this.startPresenterView());
        this.register('present-close-presenter', () => {
            window.dispatchEvent(new CustomEvent('presentation:close-presenter-view'));
        });
        this.register('present-swap-displays', () => {
            window.dispatchEvent(new CustomEvent('presentation:swap-displays'));
        });
        this.register('present-single-window', () => {
            window.dispatchEvent(new CustomEvent('presentation:return-single-window'));
        });

        // Settings
        this.register('settings', () => {
            window.dispatchEvent(new CustomEvent('story:show-settings'));
        });

        // Help operations
        this.register('help-shortcuts', () => this.showKeyboardShortcuts());
        this.register('help-docs', () => this.openDocumentation());
        this.register('help-about', () => this.showAbout());
    }

    /**
     * Register a handler for a menu action
     */
    register(actionId, handler) {
        this.handlers.set(actionId, handler);
    }

    /**
     * Bind to menu action events
     */
    bindEvents() {
        window.addEventListener('story:menu-action', (e) => {
            this.handleAction(e.detail.action);
        });
    }

    /**
     * Handle a menu action
     */
    handleAction(actionId) {
        const handler = this.handlers.get(actionId);
        if (handler) {
            handler();
        } else {
            console.warn(`No handler registered for menu action: ${actionId}`);
        }
    }

    // === Helper Methods ===

    cutSelection() {
        this.copySelection();
        store.dispatch('DELETE_SELECTED');
    }

    copySelection() {
        const state = store.getState();
        const selectedIds = state.editor.selectedElementIds;
        if (selectedIds.length === 0) return;

        const activeSlide = state.slides.find(s => s.id === state.editor.activeSlideId);
        if (!activeSlide) return;

        const elements = activeSlide.elements.filter(el => selectedIds.includes(el.id));
        
        // Store in memory clipboard
        this.clipboard = JSON.parse(JSON.stringify(elements));
    }

    pasteClipboard() {
        if (!this.clipboard || this.clipboard.length === 0) return;
        
        // Offset pasted elements slightly
        const elements = this.clipboard.map(el => ({
            ...el,
            id: this.generateId(),
            x: el.x + 20,
            y: el.y + 20
        }));

        store.dispatch('ADD_ELEMENTS', elements);
    }

    generateId() {
        return 'el_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    zoomIn() {
        const state = store.getState();
        const newZoom = Math.min(state.editor.zoom * 1.25, 5);
        store.dispatch('UPDATE_VIEWPORT', { zoom: newZoom });
    }

    zoomOut() {
        const state = store.getState();
        const newZoom = Math.max(state.editor.zoom / 1.25, 0.1);
        store.dispatch('UPDATE_VIEWPORT', { zoom: newZoom });
    }

    fitToScreen() {
        // Trigger fit to view event
        window.dispatchEvent(new CustomEvent('story:fit-to-view'));
    }

    actualSize() {
        store.dispatch('UPDATE_VIEWPORT', { zoom: 1 });
    }

    toggleGrid() {
        store.dispatch('TOGGLE_GRID');
    }

    toggleGuides() {
        store.dispatch('TOGGLE_GUIDES');
    }

    toggleRulers() {
        store.dispatch('TOGGLE_RULERS');
    }

    setTheme(theme) {
        if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        store.dispatch('SET_THEME', theme);
    }

    toggleMasterEdit() {
        const state = store.getState();
        if (state.editor.mode === 'master') {
            store.dispatch('SET_EDIT_SCOPE', 'Slide');
        } else {
            store.dispatch('SET_EDIT_SCOPE', 'Master');
        }
    }

    openImagePicker() {
        // Trigger image picker
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                window.dispatchEvent(new CustomEvent('story:insert-image', { 
                    detail: { file } 
                }));
            }
        };
        input.click();
    }

    openSvgPicker() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.svg,image/svg+xml';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                window.dispatchEvent(new CustomEvent('story:insert-svg', {
                    detail: { file }
                }));
            }
        };
        input.click();
    }

    openVideoPicker() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'video/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                window.dispatchEvent(new CustomEvent('story:insert-video', { 
                    detail: { file } 
                }));
            }
        };
        input.click();
    }

    openIconLibrary() {
        store.dispatch('SET_ACTIVE_TOOL', 'resources');
    }

    openCodeFillPanel() {
        window.dispatchEvent(new CustomEvent('story:open-panel', {
            detail: { panelId: 'code-fill-panel' }
        }));
    }

    startPresentation({ slideIndex = 0, requestFullscreen = true } = {}) {
        store.dispatch('PRESENTATION_SET_REQUEST_FULLSCREEN', requestFullscreen);
        store.dispatch('ENTER_RUNTIME', {
            mode: 'Presentation',
            surfaceRole: 'Audience',
            placement: requestFullscreen ? 'Fullscreen' : 'Windowed'
        });
        store.dispatch('PRESENTATION_GOTO', slideIndex);
    }

    startPresentationFromCurrent() {
        const state = store.getState();
        const currentIndex = state.slideOrder?.indexOf(state.editor.activeSlideId) ?? 0;
        this.startPresentation({ slideIndex: Math.max(0, currentIndex), requestFullscreen: true });
    }

    startPresenterView() {
        // Gate 7: start the audience presentation (windowed) and open a synced presenter window.
        const state = store.getState();
        const currentIndex = state.slideOrder?.indexOf(state.editor.activeSlideId) ?? 0;
        this.startPresentation({ slideIndex: Math.max(0, currentIndex), requestFullscreen: false });
        window.dispatchEvent(new CustomEvent('presentation:open-presenter-view'));
    }

    showKeyboardShortcuts() {
        window.dispatchEvent(new CustomEvent('story:show-shortcuts'));
    }

    openDocumentation() {
        // Open documentation viewer in new tab
        window.open('/docs/', '_blank');
    }

    showAbout() {
        window.dispatchEvent(new CustomEvent('story:show-about'));
    }
}

// Export singleton
export const menuActionHandler = new MenuActionHandler();
