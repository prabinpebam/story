import { BaseSection } from './BaseSection.js';
import { store } from '../../core/Store.js';
import { Dropdown } from '../components/Dropdown.js';
import { getShapeKind } from '../../core/shapes/ShapeElementAdapter.js';

export class BooleanSection extends BaseSection {
    constructor() {
        super({ title: 'Boolean', collapsed: false });

        this.container = document.createElement('div');
        this.container.className = 'pi-section-content';
        this.section.appendChild(this.container);

        this.operationDropdown = null;
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

        if (!el || kind !== 'boolean') {
            this.section.element.classList.add('hidden');
            return;
        }

        this.section.element.classList.remove('hidden');
        this.render(el);
    }

    render(el) {
        this.container.innerHTML = '';

        const row = document.createElement('div');
        row.className = 'pi-row';

        const label = document.createElement('div');
        label.className = 'pi-label';
        label.textContent = 'Operation';

        this.operationDropdown = new Dropdown({
            options: [
                { label: 'Union', value: 'union' },
                { label: 'Subtract', value: 'subtract' },
                { label: 'Intersect', value: 'intersect' },
                { label: 'Exclude', value: 'exclude' }
            ],
            value: el.operation || 'union',
            size: 'sm',
            onChange: (val) => {
                store.dispatch('SET_BOOLEAN_OPERATION', { id: el.id, operation: val });
            }
        });
        this.operationDropdown.element.setAttribute('data-testid', 'boolean-operation');

        row.appendChild(label);
        row.appendChild(this.operationDropdown.element);

        this.container.appendChild(row);
    }
}
