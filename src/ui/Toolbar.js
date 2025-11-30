import { store } from '../core/Store.js';
import { cursorManager } from '../core/CursorManager.js';

export class Toolbar {
    constructor() {
        this.buttons = document.querySelectorAll('#floating-toolbar .tool-btn');
        this.panels = {
            resources: document.getElementById('icon-library')
        };
        this.init();
    }

    init() {
        console.log('Toolbar initialized', this.buttons.length);
        
        // Button Clicks
        this.buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tool = btn.dataset.tool;
                if (tool === 'resources') {
                    this.togglePanel('resources');
                } else if (tool) {
                    store.dispatch('SET_ACTIVE_TOOL', tool);
                }
                // Remove focus so spacebar doesn't trigger button again
                btn.blur();
            });
        });

        // Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            // Ignore if typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

            switch(e.key.toLowerCase()) {
                case 'v': store.dispatch('SET_ACTIVE_TOOL', 'select'); break;
                case 'h': store.dispatch('SET_ACTIVE_TOOL', 'hand'); break;
                case 'r': store.dispatch('SET_ACTIVE_TOOL', 'shape'); break; // Rectangle
                case 't': store.dispatch('SET_ACTIVE_TOOL', 'text'); break;
                case 'i': 
                    if (e.shiftKey) this.togglePanel('resources'); 
                    break;
                case 'k':
                    if (e.shiftKey) store.dispatch('SET_ACTIVE_TOOL', 'image');
                    break;
            }
        });

        // Subscribe to state changes
        store.on('state-changed', (state) => {
            this.updateActiveState(state.editor.activeTool);
            this.updateCursor(state.editor.activeTool);
        });
        
        // Initialize cursor
        const state = store.getState();
        if (state.editor && state.editor.activeTool) {
            this.updateCursor(state.editor.activeTool);
        }

        // Close buttons on panels
        document.querySelectorAll('.floating-panel .close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const panel = e.target.closest('.floating-panel');
                if (panel) {
                    panel.classList.add('hidden');
                    // Deactivate corresponding toolbar button
                    if (panel.id === 'icon-library') {
                        const toolBtn = document.querySelector('[data-tool="resources"]');
                        if (toolBtn) toolBtn.classList.remove('active');
                    }
                }
            });
        });
    }

    updateActiveState(activeTool) {
        this.buttons.forEach(btn => {
            const tool = btn.dataset.tool;
            if (tool === activeTool) {
                btn.classList.add('active');
            } else if (tool !== 'resources') { // Resources is a toggle, not a tool state
                btn.classList.remove('active');
            }
        });
    }

    updateCursor(activeTool) {
        // Use CursorManager for centralized cursor control
        cursorManager.setTool(activeTool);
    }

    togglePanel(panelName) {
        const panel = this.panels[panelName];
        if (panel) {
            const isHidden = panel.classList.contains('hidden');
            if (isHidden) {
                panel.classList.remove('hidden');
                // Activate button state if needed
                const btn = document.querySelector(`[data-tool="${panelName}"]`);
                if (btn) btn.classList.add('active');
            } else {
                panel.classList.add('hidden');
                const btn = document.querySelector(`[data-tool="${panelName}"]`);
                if (btn) btn.classList.remove('active');
            }
        }
    }
}
