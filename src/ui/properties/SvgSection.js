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
        super.update(selection);
        if (!this.selection || this.selection.length === 0) {
            this.section.element.classList.add('hidden');
            return;
        }

        const state = store.getState();
        const elements = this.selection.map((id) => this.getElement(state, id)).filter(Boolean);
        const allSvg = elements.length > 0 && elements.every((el) => el.type === 'svg');

        if (!allSvg) {
            this.section.element.classList.add('hidden');
            return;
        }

        this.section.element.classList.remove('hidden');
        this.render(elements);
    }

    render(elements) {
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
            value: (elements[0].fitMode || 'fit'),
            size: 'sm',
            onChange: (val) => this.updateProperty('fitMode', val)
        });
        this.fitDropdown.element.setAttribute('data-testid', 'svg-fit-mode');

        const fitResult = this.getMixedValue(elements, 'fitMode');
        if (fitResult.mixed) {
            this.fitDropdown.setMixed(true);
        } else {
            this.fitDropdown.setMixed(false);
            this.fitDropdown.setValue(fitResult.value || 'fit');
        }

        row.appendChild(label);
        row.appendChild(this.fitDropdown.element);

        this.container.appendChild(row);
    }
}
