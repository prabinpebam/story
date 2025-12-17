import { BaseSection } from './BaseSection.js';
import { store } from '../../core/Store.js';
import { NumberInput } from '../components/NumberInput.js';
import { getShapeKind } from '../../core/shapes/ShapeElementAdapter.js';

export class ShapeSection extends BaseSection {
    constructor() {
        super({ title: 'Shape', collapsed: false });

        this.container = document.createElement('div');
        this.container.className = 'pi-section-content';
        this.section.appendChild(this.container);
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

        if (!el || (kind !== 'polygon' && kind !== 'star')) {
            this.section.element.classList.add('hidden');
            return;
        }

        this.section.element.classList.remove('hidden');
        this.render(el, kind);
    }

    render(el, kind) {
        this.container.innerHTML = '';

        const params = el.params || {};

        if (kind === 'polygon') {
            const sides = Number.isFinite(params.sides) ? params.sides : 6;
            const rotation = Number.isFinite(params.rotation) ? params.rotation : 0;

            const sidesInput = new NumberInput({
                label: 'Sides',
                value: sides,
                min: 3,
                max: 20,
                step: 1,
                precision: 0,
                scrubbable: true,
                onChange: (val, isTransient) => {
                    const nextParams = { ...(el.params || {}), sides: Math.max(3, Math.min(20, Math.round(val))) };
                    store.dispatch('UPDATE_ELEMENT', { id: el.id, params: nextParams }, { skipHistory: isTransient });
                }
            });
            sidesInput.element.setAttribute('data-testid', 'shape-polygon-sides');

            const rotationInput = new NumberInput({
                label: 'Rotation',
                value: rotation,
                min: -360,
                max: 360,
                step: 1,
                precision: 0,
                units: '°',
                scrubbable: true,
                onChange: (val, isTransient) => {
                    const nextParams = { ...(el.params || {}), rotation: val };
                    store.dispatch('UPDATE_ELEMENT', { id: el.id, params: nextParams }, { skipHistory: isTransient });
                }
            });
            rotationInput.element.setAttribute('data-testid', 'shape-polygon-rotation');

            this.container.appendChild(sidesInput.element);
            this.container.appendChild(rotationInput.element);
            return;
        }

        if (kind === 'star') {
            const points = Number.isFinite(params.points) ? params.points : 5;
            const inner = Number.isFinite(params.innerRadiusRatio) ? params.innerRadiusRatio : 0.5;
            const rotation = Number.isFinite(params.rotation) ? params.rotation : 0;

            const pointsInput = new NumberInput({
                label: 'Points',
                value: points,
                min: 3,
                max: 20,
                step: 1,
                precision: 0,
                scrubbable: true,
                onChange: (val, isTransient) => {
                    const nextParams = { ...(el.params || {}), points: Math.max(3, Math.min(20, Math.round(val))) };
                    store.dispatch('UPDATE_ELEMENT', { id: el.id, params: nextParams }, { skipHistory: isTransient });
                }
            });
            pointsInput.element.setAttribute('data-testid', 'shape-star-points');

            const innerInput = new NumberInput({
                label: 'Inner radius',
                value: inner,
                min: 0.01,
                max: 0.99,
                step: 0.01,
                precision: 2,
                scrubbable: true,
                onChange: (val, isTransient) => {
                    const clamped = Math.min(0.99, Math.max(0.01, val));
                    const nextParams = { ...(el.params || {}), innerRadiusRatio: clamped };
                    store.dispatch('UPDATE_ELEMENT', { id: el.id, params: nextParams }, { skipHistory: isTransient });
                }
            });
            innerInput.element.setAttribute('data-testid', 'shape-star-inner-radius');

            const rotationInput = new NumberInput({
                label: 'Rotation',
                value: rotation,
                min: -360,
                max: 360,
                step: 1,
                precision: 0,
                units: '°',
                scrubbable: true,
                onChange: (val, isTransient) => {
                    const nextParams = { ...(el.params || {}), rotation: val };
                    store.dispatch('UPDATE_ELEMENT', { id: el.id, params: nextParams }, { skipHistory: isTransient });
                }
            });
            rotationInput.element.setAttribute('data-testid', 'shape-star-rotation');

            this.container.appendChild(pointsInput.element);
            this.container.appendChild(innerInput.element);
            this.container.appendChild(rotationInput.element);
        }
    }
}
