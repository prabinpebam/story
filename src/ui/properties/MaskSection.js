import { BaseSection } from './BaseSection.js';
import { store } from '../../core/Store.js';
import { Switch } from '../components/Switch.js';
import { getShapeKind } from '../../core/shapes/ShapeElementAdapter.js';

export class MaskSection extends BaseSection {
    constructor() {
        super({ title: 'Mask', collapsed: false });

        this.container = document.createElement('div');
        this.container.className = 'pi-section-content';
        this.section.appendChild(this.container);

        this.invertSwitch = null;
    }

    update(selection) {
        if (!selection || selection.length !== 1) {
            this.section.element.classList.add('hidden');
            return;
        }

        this.selection = selection;

        const state = store.getState();
        const el = this.getElement(state, selection[0]);
        const kind = getShapeKind(el);

        if (!el || kind !== 'mask') {
            this.section.element.classList.add('hidden');
            return;
        }

        this.section.element.classList.remove('hidden');
        this.render(el);
    }

    render(el) {
        this.container.innerHTML = '';

        const invert = el.invert === true;

        this.invertSwitch = new Switch('Invert', invert, (value) => {
            store.dispatch('SET_MASK_INVERT', { id: el.id, invert: value });
        });
        this.invertSwitch.element.setAttribute('data-testid', 'mask-invert-toggle');

        this.container.appendChild(this.invertSwitch.element);

        const warning = this.getMaskWarning(el);
        if (warning) {
            const warnRow = document.createElement('div');
            warnRow.className = 'pi-row';
            warnRow.setAttribute('data-testid', 'mask-status-warning');

            const label = document.createElement('div');
            label.className = 'pi-label';
            label.textContent = 'Status';

            const value = document.createElement('div');
            value.className = 'pi-value';
            value.textContent = warning;

            warnRow.appendChild(label);
            warnRow.appendChild(value);
            this.container.appendChild(warnRow);
        }
    }

    getMaskWarning(maskEl) {
        const state = store.getState();
        if (!state?.editor || state.editor.mode === 'presentation') return null;

        const slideData = state.editor.mode === 'master'
            ? state.slideMasterPresets?.[state.editor.activeMasterId]
            : store.getEffectiveSlide(state.editor.activeSlideId);
        if (!slideData) return 'Mask data unavailable';

        const elements = slideData?.effectiveElements || slideData?.elements || {};
        const maskShapeId = maskEl?.maskShapeId;
        const contentIds = Array.isArray(maskEl?.contentIds) ? maskEl.contentIds : [];

        if (typeof maskShapeId !== 'string' || !elements[maskShapeId]) {
            return 'Mask shape missing; masking disabled';
        }
        if (contentIds.length === 0) {
            return 'No masked content; masking disabled';
        }
        return null;
    }
}
