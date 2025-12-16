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
    }
}
