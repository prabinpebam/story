import { store } from '../core/Store.js';
import { Flyout } from './components/Flyout.js';

export class ViewportControls {
    constructor() {
        this.layoutGuidesBtn = document.getElementById('btn-layout-guides');
        this.snappingOptionsBtn = document.getElementById('btn-snapping-options');
        this.snappingFlyout = null;

        this.bindEvents();
        this.syncFromState(store.getState());

        store.on('state-changed', (state) => {
            this.syncFromState(state);
        });
    }

    bindEvents() {
        if (this.layoutGuidesBtn) {
            this.layoutGuidesBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                store.dispatch('TOGGLE_LAYOUT_GUIDES');
            });
        }

        if (this.snappingOptionsBtn) {
            this.snappingOptionsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleSnappingFlyout();
            });
        }
    }

    syncFromState(state) {
        const showLayoutGuides = state?.editor?.showLayoutGuides !== false;
        if (this.layoutGuidesBtn) {
            this.layoutGuidesBtn.classList.toggle('active', !!showLayoutGuides);
            this.layoutGuidesBtn.setAttribute('aria-pressed', showLayoutGuides ? 'true' : 'false');
        }

        if (this._snapToObjectCheckbox) this._snapToObjectCheckbox.checked = !!state?.editor?.snapToObject;
        if (this._snapToSlideCheckbox) this._snapToSlideCheckbox.checked = !!state?.editor?.snapToSlide;
        if (this._snapToColumnsCheckbox) this._snapToColumnsCheckbox.checked = !!state?.editor?.snapToColumns;
    }

    toggleSnappingFlyout() {
        if (!this.snappingOptionsBtn) return;

        if (this.snappingFlyout) {
            this.snappingFlyout.close();
            this.snappingFlyout = null;
            return;
        }

        const state = store.getState();

        const content = document.createElement('div');
        content.className = 'snapping-options-flyout';
        content.setAttribute('data-testid', 'snapping-options-flyout');

        const makeToggleRow = ({ testId, label, checked, onToggle }) => {
            const row = document.createElement('div');
            row.className = 'pi-row pi-row--space-between';
            row.setAttribute('data-testid', testId);

            const text = document.createElement('div');
            text.textContent = label;
            text.style.fontSize = '11px';
            text.style.color = 'var(--color-text-secondary)';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = !!checked;

            row.appendChild(text);
            row.appendChild(checkbox);

            row.addEventListener('click', (e) => {
                e.stopPropagation();
                checkbox.checked = !checkbox.checked;
                onToggle(checkbox.checked);
            });

            checkbox.addEventListener('click', (e) => {
                e.stopPropagation();
                onToggle(checkbox.checked);
            });

            return { row, checkbox };
        };

        const title = document.createElement('div');
        title.textContent = 'Snapping';
        title.style.fontSize = '12px';
        title.style.fontWeight = '600';
        title.style.color = 'var(--color-text-primary)';
        title.style.marginBottom = '8px';
        content.appendChild(title);

        const { row: snapToObjectRow, checkbox: snapToObjectCheckbox } = makeToggleRow({
            testId: 'snap-to-object-toggle',
            label: 'Snap to Object',
            checked: !!state?.editor?.snapToObject,
            onToggle: () => store.dispatch('TOGGLE_SNAP_TO_OBJECT')
        });
        this._snapToObjectCheckbox = snapToObjectCheckbox;
        content.appendChild(snapToObjectRow);

        const { row: snapToSlideRow, checkbox: snapToSlideCheckbox } = makeToggleRow({
            testId: 'snap-to-slide-toggle',
            label: 'Snap to slide',
            checked: !!state?.editor?.snapToSlide,
            onToggle: () => store.dispatch('TOGGLE_SNAP_TO_SLIDE')
        });
        this._snapToSlideCheckbox = snapToSlideCheckbox;
        content.appendChild(snapToSlideRow);

        const { row: snapToColumnsRow, checkbox: snapToColumnsCheckbox } = makeToggleRow({
            testId: 'snap-to-columns-toggle',
            label: 'Snap to columns',
            checked: !!state?.editor?.snapToColumns,
            onToggle: () => store.dispatch('TOGGLE_SNAP_TO_COLUMNS')
        });
        this._snapToColumnsCheckbox = snapToColumnsCheckbox;
        content.appendChild(snapToColumnsRow);

        this.snappingFlyout = new Flyout({
            trigger: this.snappingOptionsBtn,
            content,
            position: 'left',
            onClose: () => {
                this.snappingFlyout = null;
                this._snapToObjectCheckbox = null;
                this._snapToSlideCheckbox = null;
                this._snapToColumnsCheckbox = null;
            }
        });

        // Viewport controls live above the main stage; ensure the flyout is above fixed UI.
        this.snappingFlyout.element.style.zIndex = 'var(--z-popover, 1500)';

        this.snappingFlyout.open();
    }
}
