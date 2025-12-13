import { BaseSection } from './BaseSection.js';
import { Dropdown } from '../components/Dropdown.js';
import { store } from '../../core/Store.js';

export class SvgSection extends BaseSection {
    constructor() {
        super({ title: 'SVG', collapsed: false });

        this.container = document.createElement('div');
        this.container.className = 'pi-section-content';
        this.section.appendChild(this.container);

        this.fitDropdown = null;
    }

    update(selection) {
        if (!selection || selection.length !== 1) {
            this.section.element.classList.add('hidden');
            return;
        }

        this.selection = selection;

        const state = store.getState();
        const el = this.getElement(state, selection[0]);

        if (!el || el.type !== 'svg') {
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
        label.textContent = 'Fit';

        this.fitDropdown = new Dropdown({
            options: [
                { label: 'Fit', value: 'fit' },
                { label: 'Fill', value: 'fill' },
                { label: 'Stretch', value: 'stretch' }
            ],
            value: el.fitMode || 'fit',
            size: 'sm',
            onChange: (val) => this.updateProperty('fitMode', val)
        });
        this.fitDropdown.element.setAttribute('data-testid', 'svg-fit-mode');

        row.appendChild(label);
        row.appendChild(this.fitDropdown.element);

        this.container.appendChild(row);
    }
}
