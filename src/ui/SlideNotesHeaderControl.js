import { store } from '../core/Store.js';
import { panelManager } from './PanelManager.js';
import { Icons } from './Icons.js';

export class SlideNotesHeaderControl {
    constructor(headerEl) {
        this.headerEl = headerEl;
        this.actionsEl = null;
        this.trigger = null;

        if (!this.headerEl) return;

        this.create();
        this.bind();
        this.update();
    }

    create() {
        let actions = this.headerEl.querySelector('.sidebar-header-actions');
        if (!actions) {
            actions = document.createElement('div');
            actions.className = 'sidebar-header-actions';
            this.headerEl.appendChild(actions);
        }
        this.actionsEl = actions;

        const btn = document.createElement('button');
        btn.className = 'btn btn--text btn--xs slide-notes-trigger';
        btn.type = 'button';
        btn.setAttribute('aria-label', 'Slide notes');
        btn.setAttribute('aria-pressed', 'false');
        btn.setAttribute('data-testid', 'sidebar-notes-btn');

        btn.innerHTML = `<span class="slide-notes-trigger__icon" aria-hidden="true">${Icons.EDIT || ''}</span>`;

        this.actionsEl.appendChild(btn);
        this.trigger = btn;
    }

    bind() {
        this.trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            panelManager.toggle('slide-notes-panel');
            this.updatePressedState();
        });

        store.on('state-changed', () => this.update());
        store.on('selection-changed', () => this.update());
    }

    update() {
        if (!this.trigger) return;
        const state = store.getState();

        const visible = state?.editor?.mode !== 'presentation' && !!state?.editor?.activeSlideId;
        this.trigger.style.display = visible ? '' : 'none';

        if (!visible) {
            try {
                panelManager.close('slide-notes-panel');
            } catch {
                // ignore
            }
        }

        this.updatePressedState();
    }

    updatePressedState() {
        if (!this.trigger) return;
        const isOpen = panelManager.isOpen('slide-notes-panel');
        this.trigger.setAttribute('aria-pressed', isOpen ? 'true' : 'false');
        this.trigger.classList.toggle('active', isOpen);
    }
}
