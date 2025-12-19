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
        super.update(selection);
        if (!this.selection || this.selection.length === 0) {
            this.section.element.classList.add('hidden');
            return;
        }

        const state = store.getState();
        const elements = this.selection.map((id) => this.getElement(state, id)).filter(Boolean);
        if (elements.length === 0) {
            this.section.element.classList.add('hidden');
            return;
        }

        const kinds = elements.map((el) => getShapeKind(el));
        const firstKind = kinds[0];
        const allSameKind = kinds.every((k) => k === firstKind);
        const supported = firstKind === 'polygon' || firstKind === 'star';

        if (!allSameKind || !supported) {
            this.section.element.classList.add('hidden');
            return;
        }

        this.section.element.classList.remove('hidden');
        this.render(elements, firstKind);
    }

    render(elements, kind) {
        this.container.innerHTML = '';

        const paramsList = elements.map((el) => el.params || {});

        if (kind === 'polygon') {
            const sidesResult = this.getMixedValue(paramsList.map((p) => ({ v: Number.isFinite(p.sides) ? p.sides : 6 })), 'v');
            const rotationResult = this.getMixedValue(paramsList.map((p) => ({ v: Number.isFinite(p.rotation) ? p.rotation : 0 })), 'v');

            const sides = sidesResult.mixed ? 6 : sidesResult.value;
            const rotation = rotationResult.mixed ? 0 : rotationResult.value;

            const sidesInput = new NumberInput({
                label: 'Sides',
                value: sides,
                min: 3,
                max: 20,
                step: 1,
                precision: 0,
                mixedPlaceholder: 'Mixed',
                scrubbable: true,
                onChange: (val, isTransient) => {
                    const nextVal = Math.max(3, Math.min(20, Math.round(val)));
                    this.selection.forEach((id) => {
                        const state = store.getState();
                        const el = this.getElement(state, id);
                        const nextParams = { ...(el?.params || {}), sides: nextVal };
                        store.dispatch('UPDATE_ELEMENT', { id, params: nextParams }, { skipHistory: isTransient });
                    });
                }
            });
            sidesInput.element.setAttribute('data-testid', 'shape-polygon-sides');
            sidesInput.setMixed(sidesResult.mixed);

            const rotationInput = new NumberInput({
                label: 'Rotation',
                value: rotation,
                min: -360,
                max: 360,
                step: 1,
                precision: 0,
                units: '°',
                mixedPlaceholder: 'Mixed',
                scrubbable: true,
                onChange: (val, isTransient) => {
                    this.selection.forEach((id) => {
                        const state = store.getState();
                        const el = this.getElement(state, id);
                        const nextParams = { ...(el?.params || {}), rotation: val };
                        store.dispatch('UPDATE_ELEMENT', { id, params: nextParams }, { skipHistory: isTransient });
                    });
                }
            });
            rotationInput.element.setAttribute('data-testid', 'shape-polygon-rotation');
            rotationInput.setMixed(rotationResult.mixed);

            this.container.appendChild(sidesInput.element);
            this.container.appendChild(rotationInput.element);
            return;
        }

        if (kind === 'star') {
            const pointsResult = this.getMixedValue(paramsList.map((p) => ({ v: Number.isFinite(p.points) ? p.points : 5 })), 'v');
            const innerResult = this.getMixedValue(paramsList.map((p) => ({ v: Number.isFinite(p.innerRadiusRatio) ? p.innerRadiusRatio : 0.5 })), 'v');
            const rotationResult = this.getMixedValue(paramsList.map((p) => ({ v: Number.isFinite(p.rotation) ? p.rotation : 0 })), 'v');

            const points = pointsResult.mixed ? 5 : pointsResult.value;
            const inner = innerResult.mixed ? 0.5 : innerResult.value;
            const rotation = rotationResult.mixed ? 0 : rotationResult.value;

            const pointsInput = new NumberInput({
                label: 'Points',
                value: points,
                min: 3,
                max: 20,
                step: 1,
                precision: 0,
                mixedPlaceholder: 'Mixed',
                scrubbable: true,
                onChange: (val, isTransient) => {
                    const nextVal = Math.max(3, Math.min(20, Math.round(val)));
                    this.selection.forEach((id) => {
                        const state = store.getState();
                        const el = this.getElement(state, id);
                        const nextParams = { ...(el?.params || {}), points: nextVal };
                        store.dispatch('UPDATE_ELEMENT', { id, params: nextParams }, { skipHistory: isTransient });
                    });
                }
            });
            pointsInput.element.setAttribute('data-testid', 'shape-star-points');
            pointsInput.setMixed(pointsResult.mixed);

            const innerInput = new NumberInput({
                label: 'Inner radius',
                value: inner,
                min: 0.01,
                max: 0.99,
                step: 0.01,
                precision: 2,
                mixedPlaceholder: 'Mixed',
                scrubbable: true,
                onChange: (val, isTransient) => {
                    const clamped = Math.min(0.99, Math.max(0.01, val));
                    this.selection.forEach((id) => {
                        const state = store.getState();
                        const el = this.getElement(state, id);
                        const nextParams = { ...(el?.params || {}), innerRadiusRatio: clamped };
                        store.dispatch('UPDATE_ELEMENT', { id, params: nextParams }, { skipHistory: isTransient });
                    });
                }
            });
            innerInput.element.setAttribute('data-testid', 'shape-star-inner-radius');
            innerInput.setMixed(innerResult.mixed);

            const rotationInput = new NumberInput({
                label: 'Rotation',
                value: rotation,
                min: -360,
                max: 360,
                step: 1,
                precision: 0,
                units: '°',
                mixedPlaceholder: 'Mixed',
                scrubbable: true,
                onChange: (val, isTransient) => {
                    this.selection.forEach((id) => {
                        const state = store.getState();
                        const el = this.getElement(state, id);
                        const nextParams = { ...(el?.params || {}), rotation: val };
                        store.dispatch('UPDATE_ELEMENT', { id, params: nextParams }, { skipHistory: isTransient });
                    });
                }
            });
            rotationInput.element.setAttribute('data-testid', 'shape-star-rotation');
            rotationInput.setMixed(rotationResult.mixed);

            this.container.appendChild(pointsInput.element);
            this.container.appendChild(innerInput.element);
            this.container.appendChild(rotationInput.element);
        }
    }
}
