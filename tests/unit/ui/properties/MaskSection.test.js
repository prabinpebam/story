import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const shared = vi.hoisted(() => ({
    store: {
        getState: vi.fn(),
        dispatch: vi.fn(),
        getEffectiveSlide: vi.fn()
    },
    getShapeKind: vi.fn()
}));

vi.mock('../../../../src/core/Store.js', () => ({
    store: shared.store
}));

vi.mock('../../../../src/ui/components/Section.js', () => ({
    Section: vi.fn((config) => {
        const el = document.createElement('div');
        el.className = 'section';
        return {
            element: el,
            appendChild: vi.fn(),
            config
        };
    })
}));

vi.mock('../../../../src/ui/components/Switch.js', () => ({
    Switch: vi.fn((label, value, onChange) => {
        const el = document.createElement('div');
        el.className = 'switch-mock';
        el.textContent = String(label);
        el.__onChange = onChange;
        return { element: el };
    })
}));

vi.mock('../../../../src/ui/components/Button.js', () => ({
    Button: vi.fn((opts) => {
        const btn = document.createElement('button');
        btn.className = 'btn-mock';
        if (opts?.dataTestId) btn.setAttribute('data-testid', opts.dataTestId);
        if (opts?.label) btn.textContent = opts.label;
        btn.addEventListener('click', () => opts?.onClick?.());
        return { element: btn };
    })
}));

vi.mock('../../../../src/core/shapes/ShapeElementAdapter.js', () => ({
    getShapeKind: shared.getShapeKind
}));

import { MaskSection } from '../../../../src/ui/properties/MaskSection.js';
import { store } from '../../../../src/core/Store.js';

function makeState({ mode = 'edit', selection = [], elementsById = {}, slideId = 'slide-1', deepEdit = null } = {}) {
    return {
        editor: {
            mode,
            activeSlideId: slideId,
            selectedElementIds: selection,
            deepEdit
        },
        slides: {
            [slideId]: {
                id: slideId,
                elements: elementsById,
                elementOrder: Object.keys(elementsById)
            }
        },
        slideMasterPresets: {}
    };
}

describe('MaskSection', () => {
    let section;

    beforeEach(() => {
        vi.clearAllMocks();

        shared.getShapeKind.mockReturnValue(null);
        store.getState.mockReturnValue(makeState());

        // MaskSection.getMaskWarning uses store.getEffectiveSlide in edit mode.
        shared.store.getEffectiveSlide.mockImplementation((slideId) => {
            const state = shared.store.getState();
            return state?.slides?.[slideId];
        });

        section = new MaskSection();
        document.body.appendChild(section.section.element);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('shows an Edit mask toggle for a selected mask', () => {
        store.getState.mockReturnValue(
            makeState({
                selection: ['mask-1'],
                elementsById: {
                    'mask-1': { id: 'mask-1', type: 'shape', shapeKind: 'mask', maskShapeId: 'shape-a', contentIds: ['content'] }
                }
            })
        );
        shared.getShapeKind.mockReturnValue('mask');

        section.update(['mask-1']);

        const editBtn = section.container.querySelector('[data-testid="mask-edit-shape"]');
        expect(editBtn).toBeTruthy();
        expect(editBtn.textContent).toContain('Edit');
    });

    it('dispatches SET_DEEP_EDIT when Edit mask is clicked', () => {
        store.getState.mockReturnValue(
            makeState({
                selection: ['mask-1'],
                elementsById: {
                    'mask-1': { id: 'mask-1', type: 'shape', shapeKind: 'mask', maskShapeId: 'shape-a', contentIds: ['content'] }
                }
            })
        );
        shared.getShapeKind.mockReturnValue('mask');

        section.update(['mask-1']);

        const btn = section.container.querySelector('[data-testid="mask-edit-shape"]');
        expect(btn).toBeTruthy();
        btn.click();

        expect(store.dispatch).toHaveBeenCalledWith('SET_DEEP_EDIT', { kind: 'mask', elementId: 'mask-1', mode: 'shape' });
    });

    it('dispatches SET_DEEP_EDIT null when already deep editing this mask', () => {
        store.getState.mockReturnValue(
            makeState({
                selection: ['mask-1'],
                deepEdit: { kind: 'mask', elementId: 'mask-1', mode: 'shape' },
                elementsById: {
                    'mask-1': { id: 'mask-1', type: 'shape', shapeKind: 'mask', maskShapeId: 'shape-a', contentIds: ['content'] }
                }
            })
        );
        shared.getShapeKind.mockReturnValue('mask');

        section.update(['mask-1']);

        const btn = section.container.querySelector('[data-testid="mask-edit-shape"]');
        expect(btn).toBeTruthy();
        expect(btn.textContent).toContain('Done');
        btn.click();

        expect(store.dispatch).toHaveBeenCalledWith('SET_DEEP_EDIT', null);
    });
});
