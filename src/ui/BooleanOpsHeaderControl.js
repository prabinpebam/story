import { store } from '../core/Store.js';
import { ContextMenu } from './components/ContextMenu/ContextMenu.js';
import { Icons } from './Icons.js';
import { getShapeKind } from '../core/shapes/ShapeElementAdapter.js';

function getActiveContainerFromState(state) {
    if (!state || !state.editor) return null;
    if (state.editor.mode === 'master') {
        return state.slideMasterPresets?.[state.editor.activeMasterId] || null;
    }
    return state.slides?.[state.editor.activeSlideId] || null;
}

function getEligibleOperandIds(state, selectedIds) {
    const container = getActiveContainerFromState(state);
    if (!container || !container.elements) return [];

    const ids = Array.isArray(selectedIds) ? selectedIds : [];
    const operandIds = ids.filter((id) => typeof id === 'string' && container.elements[id]);
    if (operandIds.length < 2) return [];

    const eligible = operandIds.filter((id) => {
        const el = container.elements[id];
        const kind = getShapeKind(el);
        if (!kind) return false;
        return kind !== 'mask';
    });

    return eligible.length >= 2 ? eligible : [];
}

export class BooleanOpsHeaderControl {
    constructor(headerEl) {
        this.headerEl = headerEl;
        this.actionsEl = null;
        this.trigger = null;
        this.menu = null;
        this.isOpen = false;
        this.ignoreClicksUntil = 0;

        if (!this.headerEl) return;

        this.create();
        this.bind();
        this.update();
    }

    create() {
        // Ensure we have an actions container aligned to the right.
        let actions = this.headerEl.querySelector('.sidebar-header-actions');
        if (!actions) {
            actions = document.createElement('div');
            actions.className = 'sidebar-header-actions';
            this.headerEl.appendChild(actions);
        }
        this.actionsEl = actions;

        const btn = document.createElement('button');
        btn.className = 'btn btn--text btn--xs boolean-ops-trigger';
        btn.type = 'button';
        btn.setAttribute('aria-haspopup', 'menu');
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-label', 'Boolean operations');
        btn.setAttribute('data-testid', 'boolean-ops-trigger');

        // Icon + caret. Icons are from existing UI icon set (Font Awesome HTML strings).
        btn.innerHTML = `
            <span class="boolean-ops-trigger__icon" aria-hidden="true">${Icons.SHAPE || ''}</span>
            <span class="boolean-ops-trigger__caret" aria-hidden="true">${Icons.CHEVRON_DOWN || '▼'}</span>
        `;

        this.actionsEl.appendChild(btn);
        this.trigger = btn;
    }

    bind() {
        this.trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            if (Date.now() < this.ignoreClicksUntil) {
                return;
            }
            this.toggle();
        });

        this.trigger.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                e.stopPropagation();
                // Enter/Space may also synthesize a click on buttons.
                // Use a short-lived suppression window so we don't block the
                // user's next real pointer click.
                this.ignoreClicksUntil = Date.now() + 250;
                this.open();
            }
        });

        store.on('selection-changed', () => {
            this.update();
            this.close();
        });
        store.on('state-changed', () => this.update());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
                this.trigger.focus();
            }
        });
    }

    update() {
        if (!this.trigger) return;
        const state = store.getState();
        const selection = state?.editor?.selectedElementIds || [];
        const eligible = getEligibleOperandIds(state, selection);

        const visible = Array.isArray(selection) && selection.length > 1 && eligible.length >= 2;
        this.trigger.style.display = visible ? '' : 'none';

        if (!visible) this.close();
    }

    toggle() {
        if (this.isOpen) this.close();
        else this.open();
    }

    open() {
        if (this.isOpen) return;
        if (!this.trigger || this.trigger.style.display === 'none') return;

        const state = store.getState();
        const selection = state?.editor?.selectedElementIds || [];
        const eligibleIds = getEligibleOperandIds(state, selection);
        if (eligibleIds.length < 2) return;

        this.isOpen = true;
        this.trigger.classList.add('active');
        this.trigger.setAttribute('aria-expanded', 'true');

        const rect = this.trigger.getBoundingClientRect();
        const x = rect.left;
        const y = rect.bottom + 4;

        const menuItems = [
            { id: 'union', label: 'Union', action: () => store.dispatch('CREATE_BOOLEAN_FROM_SELECTION', { ids: selection, operation: 'union' }) },
            { id: 'subtract', label: 'Subtract', action: () => store.dispatch('CREATE_BOOLEAN_FROM_SELECTION', { ids: selection, operation: 'subtract' }) },
            { id: 'intersect', label: 'Intersect', action: () => store.dispatch('CREATE_BOOLEAN_FROM_SELECTION', { ids: selection, operation: 'intersect' }) },
            { id: 'exclude', label: 'Exclude', action: () => store.dispatch('CREATE_BOOLEAN_FROM_SELECTION', { ids: selection, operation: 'exclude' }) },
            { separator: true },
            { id: 'flatten', label: 'Flatten', danger: true, action: () => store.dispatch('FLATTEN_BOOLEAN_FROM_SELECTION', { ids: selection }) }
        ];

        this.menu = new ContextMenu(menuItems);
        this.menu.show(x, y);
    }

    close() {
        if (!this.isOpen) return;
        this.isOpen = false;
        this.ignoreClicksUntil = 0;
        this.trigger.classList.remove('active');
        this.trigger.setAttribute('aria-expanded', 'false');
        if (this.menu) {
            this.menu.hideAll?.();
            // ContextMenu hides itself; ensure reference cleared.
            this.menu = null;
        }
    }
}
