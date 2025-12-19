import { BaseSection } from './BaseSection.js';
import { store } from '../../core/Store.js';
import { Switch } from '../components/Switch.js';
import { Button } from '../components/Button.js';
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
        super.update(selection);
        if (!this.selection || this.selection.length === 0) {
            this.section.element.classList.add('hidden');
            return;
        }

        const state = store.getState();
        const elements = this.selection.map((id) => this.getElement(state, id)).filter(Boolean);
        const allMask = elements.length > 0 && elements.every((el) => getShapeKind(el) === 'mask');

        if (!allMask) {
            this.section.element.classList.add('hidden');
            return;
        }

        this.section.element.classList.remove('hidden');
        this.render(elements);
    }

    render(elements) {
        this.container.innerHTML = '';

        const invertResult = this.getMixedValue(elements, 'invert');
        const invert = invertResult.mixed ? false : (invertResult.value === true);

        this.invertSwitch = new Switch('Invert', invert, (value) => {
            this.selection.forEach((id) => {
                store.dispatch('SET_MASK_INVERT', { id, invert: value });
            });
        });
        this.invertSwitch.element.setAttribute('data-testid', 'mask-invert-toggle');

        this.container.appendChild(this.invertSwitch.element);

        // Deep edit + warnings are single-element affordances.
        if (elements.length === 1) {
            const el = elements[0];
            const state = store.getState();
            const deepEdit = state?.editor?.deepEdit;
            const isEditingMaskShape = deepEdit?.kind === 'mask' && deepEdit?.elementId === el.id && deepEdit?.mode === 'shape';

            const editRow = document.createElement('div');
            editRow.className = 'pi-row';

            const editBtn = new Button({
                label: isEditingMaskShape ? 'Done' : 'Edit mask shape',
                size: 'sm',
                variant: isEditingMaskShape ? 'primary' : 'secondary',
                dataTestId: 'mask-edit-shape',
                onClick: () => {
                    if (isEditingMaskShape) {
                        store.dispatch('SET_DEEP_EDIT', null);
                    } else {
                        store.dispatch('SET_DEEP_EDIT', { kind: 'mask', elementId: el.id, mode: 'shape' });
                    }
                }
            });

            editRow.appendChild(editBtn.element);
            this.container.appendChild(editRow);

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
