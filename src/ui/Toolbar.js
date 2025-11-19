import { store } from '../core/Store.js';

export class Toolbar {
    constructor() {
        this.buttons = document.querySelectorAll('.tool-btn');
        this.init();
    }

    init() {
        console.log('Toolbar initialized', this.buttons.length);
        this.buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tool = btn.dataset.tool;
                if (tool) {
                    store.dispatch('SET_ACTIVE_TOOL', tool);
                }
            });
        });

        // Subscribe to state changes to update UI
        store.on('state-changed', (state) => {
            this.updateActiveState(state.editor.activeTool);
        });
    }

    updateActiveState(activeTool) {
        this.buttons.forEach(btn => {
            if (btn.dataset.tool === activeTool) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
}
