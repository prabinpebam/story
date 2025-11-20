import { store } from './core/Store.js';
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

        // Theme Toggle (Mock implementation for now, usually in settings)
        // We can add a temporary button or keybinding for testing
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                store.dispatch('TOGGLE_THEME');
            }
        });

        // store.on('theme-changed', (theme) => {
        //     this.applyTheme(theme);
        // });
    }

    applyTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.style.setProperty('--bg-app', '#1a1a1a');
            document.documentElement.style.setProperty('--bg-panel', '#252525');
            document.documentElement.style.setProperty('--bg-canvas', '#111111');
            document.documentElement.style.setProperty('--text-primary', '#f0f0f0');
            document.documentElement.style.setProperty('--text-secondary', '#a0a0a0');
            document.documentElement.style.setProperty('--border-color', '#404040');
        } else {
            // Reset to CSS variables defaults (Light)
            document.documentElement.style.removeProperty('--bg-app');
            document.documentElement.style.removeProperty('--bg-panel');
            document.documentElement.style.removeProperty('--bg-canvas');
            document.documentElement.style.removeProperty('--text-primary');
            document.documentElement.style.removeProperty('--text-secondary');
            document.documentElement.style.removeProperty('--border-color');
        }
    }

    renderInitialState() {
        const state = store.getState();
        this.updateToolbarUI(state.editor.activeTool);
        this.applyTheme(state.meta.theme);
    }
}

// Start the App
window.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
