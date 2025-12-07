import { store } from './core/Store.js';
import './ui/components/Shimmer.js'; // Register Shimmer web component
import { InputManager } from './core/InputManager.js';
import { CanvasManager } from './core/CanvasManager.js';
import { cursorManager } from './core/CursorManager.js';
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
import { authService, bootAuth } from './core/auth/index.js';
import { AppMenu } from './ui/components/AppMenu/AppMenu.js';
import { fileService } from './ui/services/FileService.js';
import { menuActionHandler } from './ui/services/MenuActionHandler.js';
import { FileIndicatorController } from './ui/services/FileIndicatorController.js';
import { MasterView } from './ui/MasterView.js';

class App {
    constructor() {
        this.authBootResult = null;
        this.initAsync();
    }

    async initAsync() {
        console.log('Story App Initializing...');
        
        // Boot authentication first (handles OAuth callback if needed)
        this.authBootResult = await bootAuth();
        
        if (this.authBootResult.error) {
            console.error('Auth boot error:', this.authBootResult.error);
        }
        
        if (this.authBootResult.isAuthenticated) {
            console.log('User authenticated:', this.authBootResult.user?.displayName || 'Unknown');
        }
        
        // Now initialize the rest of the app
        this.init();
        
        // After app is initialized, check for pending cloud actions
        // This handles the case where user was redirected to OAuth from CloudFileBrowser
        if (this.authBootResult.wasCallback && this.authBootResult.isAuthenticated) {
            this.resumePendingCloudAction();
        }

        // Signal that the app is ready (removes boot screen)
        if (window.appReady) {
            window.appReady();
        }
    }
    
    /**
     * Resume any pending cloud action after successful OAuth
     */
    async resumePendingCloudAction() {
        try {
            // Dynamic import to avoid circular dependencies
            const { CloudFileBrowser } = await import('./ui/file/CloudFileBrowser.js');
            await CloudFileBrowser.resumePendingAction();
        } catch (error) {
            console.error('Failed to resume pending cloud action:', error);
        }
    }

    init() {
        
        // Initialize CursorManager
        cursorManager.init('#interaction-canvas');
        
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
        
        // Initialize Master View
        this.masterView = new MasterView();
        document.getElementById('app').appendChild(this.masterView.element);

        // Initialize App Menu (file menu in sidebar header)
        this.appMenu = new AppMenu('app-menu-container');

        // Initialize File Indicator (floating pill showing current file)
        this.fileIndicator = new FileIndicatorController('file-indicator-container');

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

        this.setupThemeListener();
        this.bindEvents();
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

    setupThemeListener() {
        const updateTheme = (theme) => {
            const isLight = theme === 'light';
            const buttons = [
                document.getElementById('edit-master-btn'),
                document.getElementById('close-master-btn'),
                document.getElementById('play-btn')
            ];

            buttons.forEach(btn => {
                if (btn) {
                    if (isLight) {
                        btn.style.setProperty('transition', 'none', 'important');
                        btn.style.setProperty('background-color', '#FFFFFF', 'important');
                        btn.style.setProperty('color', '#333333', 'important');
                        btn.style.setProperty('border-color', '#E0E0E0', 'important');
                    } else {
                        btn.style.removeProperty('background-color');
                        btn.style.removeProperty('color');
                        btn.style.removeProperty('border-color');
                        btn.style.removeProperty('transition');
                    }
                }
            });
        };

        // Initial check
        const initialTheme = localStorage.getItem('story-theme') || localStorage.getItem('themeMode');
        updateTheme(initialTheme);

        // Listen for changes
        window.addEventListener('theme-changed', (e) => updateTheme(e.detail.theme));
    }
}

// Start the App
window.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

// Expose store for E2E testing
if (import.meta.env.MODE === 'development' || import.meta.env.MODE === 'test') {
    window.__TEST_STORE__ = store;
    console.log('[TEST MODE] Store exposed on window.__TEST_STORE__');
}
