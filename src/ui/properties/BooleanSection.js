import { BaseSection } from './BaseSection.js';
import { store } from '../../core/Store.js';
import { Dropdown } from '../components/Dropdown.js';
import { getShapeKind } from '../../core/shapes/ShapeElementAdapter.js';
import { elementToWorldPolygons, worldPolygonsToElementLocal } from '../../core/shapes/booleans/ShapeToPolygons.js';
import { computeBooleanPaths } from '../../core/shapes/booleans/BooleanEngine.js';

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

        const warning = this.getBooleanWarning(el);
        if (warning) {
            const warnRow = document.createElement('div');
            warnRow.className = 'pi-row';
            warnRow.setAttribute('data-testid', 'boolean-status-warning');

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

    getBooleanWarning(booleanEl) {
        const state = store.getState();
        if (!state?.editor || state.editor.mode === 'presentation') return null;

        const slideData = state.editor.mode === 'master'
            ? state.slideMasterPresets?.[state.editor.activeMasterId]
            : store.getEffectiveSlide(state.editor.activeSlideId);
        if (!slideData) return 'Boolean data unavailable';

        const elements = slideData?.effectiveElements || slideData?.elements || {};
        const operandIds = Array.isArray(booleanEl?.operands) ? booleanEl.operands : [];
        const operation = booleanEl?.operation || 'union';

        const operandPolysLocal = [];
        for (const id of operandIds) {
            const opEl = elements[id];
            if (!opEl) continue;
            const world = elementToWorldPolygons(slideData, opEl);
            const local = worldPolygonsToElementLocal(slideData, booleanEl, world);
            operandPolysLocal.push(local);
        }

        const res = computeBooleanPaths({ operation, operands: operandPolysLocal });
        if (!res.ok || res.status !== 'ok') {
            return 'Operands missing/invalid; showing fallback result';
        }
        return null;
    }
}
