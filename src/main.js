import { store } from './core/Store.js';
import { InputManager } from './core/InputManager.js';
import { CanvasManager } from './core/CanvasManager.js';
import { EditorRenderer } from './core/renderer/EditorRenderer.js';
import { PresentationRenderer } from './core/renderer/PresentationRenderer.js';
import { SlideList } from './ui/SlideList.js';
import { LayerTree } from './ui/LayerTree.js';
import { LeftPanel } from './ui/LeftPanel.js';
import { IconLibrary } from './ui/IconLibrary.js';
import { PropertyInspector } from './ui/PropertyInspector.js';
import { Toolbar } from './ui/Toolbar.js';
import { aiService } from './core/ai/AIService.js';
import { PresentationManager } from './core/PresentationManager.js';
import { SettingsModal } from './ui/SettingsModal.js';
import { GridView } from './ui/GridView.js';
import { HUD } from './ui/HUD.js';
import { panelManager } from './ui/PanelManager.js';
import { ColorThemeManager } from './ui/panels/ColorThemeManager.js';
import { TypographyStyleManager } from './ui/panels/TypographyStyleManager.js';
import { CodeFillPanel } from './ui/panels/CodeFillPanel.js';
import { ProfileButton } from './ui/auth/ProfileButton.js';
import { SignInModal } from './ui/auth/SignInModal.js';
import { authService } from './core/auth/index.js';
import { AppMenu } from './ui/components/AppMenu/AppMenu.js';
import { fileService } from './ui/services/FileService.js';
import { menuActionHandler } from './ui/services/MenuActionHandler.js';

class App {
    constructor() {
        this.init();
    }

    init() {
        console.log('Story App Initializing...');
        
        // Initialize Components
        // Pass 'canvas-container' as the wrapper ID
        this.canvasManager = new CanvasManager('canvas-container');
        this.currentRenderer = null;
        this.setupRenderer('edit');
        
        this.slideList = new SlideList('slide-list');
        this.layerTree = new LayerTree('layer-tree');
        this.leftPanel = new LeftPanel(); // Initialize accordion panels
        this.iconLibrary = new IconLibrary('icon-library-content');
        this.propertyInspector = new PropertyInspector('properties-panel');
        this.toolbar = new Toolbar();
        this.presentationManager = new PresentationManager();
        this.settingsModal = new SettingsModal();
        this.gridView = new GridView('presentation-grid-view');
        this.hud = new HUD('presentation-hud');

        // Initialize App Menu (file menu in sidebar header)
        this.appMenu = new AppMenu('app-menu-container');

        // Initialize Panels
        this.colorThemeManager = new ColorThemeManager();
        panelManager.register('color-theme-manager', this.colorThemeManager, {
            shortcut: 'ctrl+shift+c'
        });
        
        this.typographyStyleManager = new TypographyStyleManager();
        panelManager.register('typography-style-manager', this.typographyStyleManager, {
            shortcut: 'ctrl+shift+t'
        });

        this.codeFillPanel = CodeFillPanel.getInstance();
        panelManager.register('code-fill-panel', this.codeFillPanel, {
            shortcut: 'ctrl+shift+k'
        });

        // Initialize Auth UI
        this.signInModal = new SignInModal();
        this.profileButton = new ProfileButton('profile-button-container', authService);

        // Listen for auth events
        window.addEventListener('story:show-signin', () => {
            this.signInModal.open();
        });

        window.addEventListener('story:show-settings', () => {
            this.settingsModal.open();
        });

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

    setupRenderer(mode) {
        if (this.currentRenderer) {
            this.currentRenderer.destroy();
            this.currentRenderer = null;
        }

        const containerId = 'slide-content';
        
        if (mode === 'presentation') {
            this.currentRenderer = new PresentationRenderer(containerId);
        } else {
            // 'edit' or 'master'
            this.currentRenderer = new EditorRenderer(containerId);
        }
    }

    bindEvents() {
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
            // Switch renderer if needed
            const isPresentation = mode === 'presentation';
            const wasPresentation = this.currentRenderer instanceof PresentationRenderer;
            
            if (isPresentation !== wasPresentation) {
                 this.setupRenderer(mode);
            }

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

            // File Operations (handled before other shortcuts)
            if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'n') {
                e.preventDefault();
                fileService.newPresentation();
                return;
            }
            if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'o') {
                e.preventDefault();
                fileService.open();
                return;
            }
            if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 's') {
                e.preventDefault();
                fileService.save();
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') {
                e.preventDefault();
                fileService.saveAs();
                return;
            }

            // Undo/Redo
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

            // Toggle Master Mode (Shift + Ctrl/Cmd + M)
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'm') {
                e.preventDefault();
                const currentMode = state.editor.mode;
                if (currentMode === 'master') {
                    store.dispatch('SET_MODE', 'edit');
                } else if (currentMode === 'edit') {
                    store.dispatch('SET_MODE', 'master');
                }
            }
        });
    }
}

// Start the App
window.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
