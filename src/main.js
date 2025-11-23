import { store } from './core/Store.js';
import { InputManager } from './core/InputManager.js';
import { CanvasManager } from './core/CanvasManager.js';
import { SlideRenderer } from './core/SlideRenderer.js';
import { SlideList } from './ui/SlideList.js';
import { LayerTree } from './ui/LayerTree.js';
import { IconLibrary } from './ui/IconLibrary.js';
import { PropertyInspector } from './ui/PropertyInspector.js';
import { Toolbar } from './ui/Toolbar.js';
import { aiService } from './core/ai/AIService.js';
import { PresentationManager } from './core/PresentationManager.js';
import { SettingsModal } from './ui/SettingsModal.js';
import { GridView } from './ui/GridView.js';
import { HUD } from './ui/HUD.js';

class App {
    constructor() {
        this.init();
    }

    init() {
        console.log('Story App Initializing...');
        
        // Initialize Components
        // Pass 'canvas-container' as the wrapper ID
        this.canvasManager = new CanvasManager('canvas-container');
        this.slideRenderer = new SlideRenderer('slide-content');
        this.slideList = new SlideList('slide-list');
        this.layerTree = new LayerTree('layer-tree');
        this.iconLibrary = new IconLibrary('icon-library-content');
        this.propertyInspector = new PropertyInspector('properties-panel');
        this.toolbar = new Toolbar();
        this.presentationManager = new PresentationManager();
        this.settingsModal = new SettingsModal();
        this.gridView = new GridView('presentation-grid-view');
        this.hud = new HUD('presentation-hud');

        this.bindEvents();
        
        // Initial Data
        store.dispatch('ADD_SLIDE'); // Adds slide-1 (timestamped)
        
        // Add a default text element to the new slide
        const state = store.getState();
        const activeSlideId = state.editor.activeSlideId;
        
        store.dispatch('ADD_ELEMENT', {
            id: `text-${Date.now()}`,
            type: 'text',
            x: 400,
            y: 300,
            width: 600,
            height: 100,
            content: '<h1>Hello Story</h1>',
            style: {
                fontSize: 64,
                fontFamily: 'Inter',
                color: '#000000',
                textAlign: 'center'
            }
        });
    }

    bindEvents() {
        // Settings Button
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.onclick = () => this.settingsModal.open();
        }

        // Master Mode Buttons
        const editMasterBtn = document.getElementById('edit-master-btn');
        const closeMasterBtn = document.getElementById('close-master-btn');

        if (editMasterBtn) {
            editMasterBtn.onclick = () => {
                store.dispatch('SET_MODE', 'master');
            };
        }

        if (closeMasterBtn) {
            closeMasterBtn.onclick = () => {
                store.dispatch('SET_MODE', 'edit');
            };
        }

        // Listen for mode changes to update UI
        store.on('mode-changed', (mode) => {
            if (mode === 'master') {
                editMasterBtn.classList.add('hidden');
                closeMasterBtn.classList.remove('hidden');
                document.body.classList.add('mode-master');
            } else if (mode === 'edit') {
                editMasterBtn.classList.remove('hidden');
                closeMasterBtn.classList.add('hidden');
                document.body.classList.remove('mode-master');
            }
        });

        // Keyboard Shortcuts
        window.addEventListener('keydown', (e) => {
            if (InputManager.shouldBlockShortcut(e)) return;

            const state = store.getState();
            if (state.editor.mode === 'presentation') return;

            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    store.dispatch('REDO');
                } else {
                    store.dispatch('UNDO');
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                store.dispatch('REDO');
            }
        });
    }
}

// Start the App
window.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
