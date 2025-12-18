import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const shared = vi.hoisted(() => ({
    store: {
        getState: vi.fn(),
        dispatch: vi.fn(),
        getEffectiveSlide: vi.fn()
    },
    dropdownOptions: null,
    buttonOptions: null,
    getShapeKind: vi.fn(),
    resolveBooleanDerivedPaths: vi.fn()
}));

vi.mock('../../../../src/core/Store.js', () => ({
    store: shared.store
}));

vi.mock('../../../../src/ui/components/Section.js', () => ({
    Section: vi.fn((config) => {
        const el = document.createElement('div');
        el.className = 'section';
        // emulate BaseSection visibility toggling
        return {
            element: el,
            appendChild: vi.fn(),
            config
        };
    })
}));

vi.mock('../../../../src/ui/components/Dropdown.js', () => ({
    Dropdown: vi.fn((opts) => {
        shared.dropdownOptions = opts;
        const el = document.createElement('div');
        el.className = 'dropdown-mock';
        // consumer sets data-testid on this element
        return {
            element: el,
            setValue: vi.fn(),
            setOptions: vi.fn(),
            setMixed: vi.fn()
        };
    })
}));

vi.mock('../../../../src/ui/components/Button.js', () => ({
    Button: vi.fn((opts) => {
        shared.buttonOptions = opts;
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

vi.mock('../../../../src/core/shapes/booleans/BooleanDerivedPaths.js', () => ({
    resolveBooleanDerivedPaths: shared.resolveBooleanDerivedPaths
}));

import { BooleanSection } from '../../../../src/ui/properties/BooleanSection.js';
import { store } from '../../../../src/core/Store.js';
import { Dropdown } from '../../../../src/ui/components/Dropdown.js';

function makeState({ mode = 'edit', selection = [], elementsById = {}, slideId = 'slide-1' } = {}) {
    return {
        editor: {
            mode,
            activeSlideId: slideId,
            selectedElementIds: selection,
            deepEdit: null
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

describe('BooleanSection', () => {
    let section;

    beforeEach(() => {
        vi.clearAllMocks();
        shared.dropdownOptions = null;
        shared.buttonOptions = null;

        shared.getShapeKind.mockReturnValue(null);
        shared.resolveBooleanDerivedPaths.mockReturnValue({ status: 'ok', paths: [] });

        store.getState.mockReturnValue(makeState());

        // BooleanSection.getBooleanWarning uses store.getEffectiveSlide in edit mode.
        shared.store.getEffectiveSlide.mockImplementation((slideId) => {
            const state = shared.store.getState();
            return state?.slides?.[slideId];
        });

        section = new BooleanSection();
        document.body.appendChild(section.section.element);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('hides when selection is null/empty/multi', () => {
        section.update(null);
        expect(section.section.element.classList.contains('hidden')).toBe(true);

        section.update([]);
        expect(section.section.element.classList.contains('hidden')).toBe(true);

        section.update(['a', 'b']);
        expect(section.section.element.classList.contains('hidden')).toBe(true);
    });

    it('hides when selected element is not a boolean', () => {
        store.getState.mockReturnValue(
            makeState({
                selection: ['a'],
                elementsById: { a: { id: 'a', type: 'rect', x: 0, y: 0, width: 10, height: 10 } }
            })
        );
        shared.getShapeKind.mockReturnValue('rectangle');

        section.update(['a']);
        expect(section.section.element.classList.contains('hidden')).toBe(true);
    });

    it('shows and renders an operation dropdown for a selected boolean', () => {
        store.getState.mockReturnValue(
            makeState({
                selection: ['bool-1'],
                elementsById: {
                    'bool-1': { id: 'bool-1', type: 'shape', shapeKind: 'boolean', operation: 'subtract', operands: ['a', 'b'] }
                }
            })
        );
        shared.getShapeKind.mockReturnValue('boolean');

        section.update(['bool-1']);

        expect(section.section.element.classList.contains('hidden')).toBe(false);
        expect(Dropdown).toHaveBeenCalledTimes(1);

        const dropdownEl = section.container.querySelector('[data-testid="boolean-operation"]');
        expect(dropdownEl).toBeTruthy();

        // dropdown is pre-populated from el.operation
        expect(shared.dropdownOptions?.value).toBe('subtract');

        const editBtn = section.container.querySelector('[data-testid="boolean-edit-operands"]');
        expect(editBtn).toBeTruthy();
    });

    it('dispatches SET_DEEP_EDIT when Edit operands is clicked', () => {
        store.getState.mockReturnValue(
            makeState({
                selection: ['bool-1'],
                elementsById: {
                    'bool-1': { id: 'bool-1', type: 'shape', shapeKind: 'boolean', operation: 'union', operands: ['a', 'b'] }
                }
            })
        );
        shared.getShapeKind.mockReturnValue('boolean');

        section.update(['bool-1']);

        const btn = section.container.querySelector('[data-testid="boolean-edit-operands"]');
        expect(btn).toBeTruthy();
        btn.click();

        expect(store.dispatch).toHaveBeenCalledWith('SET_DEEP_EDIT', { kind: 'boolean', elementId: 'bool-1', mode: 'operands' });
    });

    it('dispatches SET_DEEP_EDIT null when already deep editing this boolean', () => {
        const state = makeState({
            selection: ['bool-1'],
            elementsById: {
                'bool-1': { id: 'bool-1', type: 'shape', shapeKind: 'boolean', operation: 'union', operands: ['a', 'b'] }
            }
        });
        state.editor.deepEdit = { kind: 'boolean', elementId: 'bool-1', mode: 'operands' };

        store.getState.mockReturnValue(state);
        shared.getShapeKind.mockReturnValue('boolean');

        section.update(['bool-1']);

        const btn = section.container.querySelector('[data-testid="boolean-edit-operands"]');
        expect(btn).toBeTruthy();
        expect(btn.textContent).toContain('Done');
        btn.click();

        expect(store.dispatch).toHaveBeenCalledWith('SET_DEEP_EDIT', null);
    });

    it('defaults dropdown value to union when operation is missing', () => {
        store.getState.mockReturnValue(
            makeState({
                selection: ['bool-1'],
                elementsById: {
                    'bool-1': { id: 'bool-1', type: 'shape', shapeKind: 'boolean', operands: ['a', 'b'] }
                }
            })
        );
        shared.getShapeKind.mockReturnValue('boolean');

        section.update(['bool-1']);
        expect(shared.dropdownOptions?.value).toBe('union');
    });

    it('dispatches SET_BOOLEAN_OPERATION when the dropdown changes', () => {
        store.getState.mockReturnValue(
            makeState({
                selection: ['bool-1'],
                elementsById: {
                    'bool-1': { id: 'bool-1', type: 'shape', shapeKind: 'boolean', operation: 'union', operands: ['a', 'b'] }
                }
            })
        );
        shared.getShapeKind.mockReturnValue('boolean');

        section.update(['bool-1']);
        expect(typeof shared.dropdownOptions?.onChange).toBe('function');

        shared.dropdownOptions.onChange('exclude');
        expect(store.dispatch).toHaveBeenCalledWith('SET_BOOLEAN_OPERATION', { id: 'bool-1', operation: 'exclude' });
    });

    it('shows a non-blocking warning row when boolean resolution is not ok', () => {
        store.getState.mockReturnValue(
            makeState({
                selection: ['bool-1'],
                elementsById: {
                    'bool-1': { id: 'bool-1', type: 'shape', shapeKind: 'boolean', operation: 'union', operands: ['missing-a', 'missing-b'] }
                }
            })
        );
        shared.getShapeKind.mockReturnValue('boolean');
        shared.resolveBooleanDerivedPaths.mockReturnValue({ status: 'fallback', paths: [] });

        section.update(['bool-1']);

        const warning = section.container.querySelector('[data-testid="boolean-status-warning"]');
        expect(warning).toBeTruthy();
        expect(warning.textContent).toContain('Status');
    });

    it('does not show warning row in presentation mode', () => {
        store.getState.mockReturnValue(
            makeState({
                mode: 'presentation',
                selection: ['bool-1'],
                elementsById: {
                    'bool-1': { id: 'bool-1', type: 'shape', shapeKind: 'boolean', operation: 'union', operands: ['missing-a', 'missing-b'] }
                }
            })
        );
        shared.getShapeKind.mockReturnValue('boolean');
        shared.resolveBooleanDerivedPaths.mockReturnValue({ status: 'fallback', paths: [] });

        section.update(['bool-1']);
        const warning = section.container.querySelector('[data-testid="boolean-status-warning"]');
        expect(warning).toBeFalsy();
    });
});
