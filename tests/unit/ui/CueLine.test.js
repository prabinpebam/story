import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockDispatch, mockGetState, mockOn } = vi.hoisted(() => ({
    mockDispatch: vi.fn(),
    mockGetState: vi.fn(),
    mockOn: vi.fn()
}));

vi.mock('../../../src/core/Store.js', () => ({
    store: {
        dispatch: mockDispatch,
        getState: mockGetState,
        on: mockOn
    }
}));

import { CueLine, deriveCueLine } from '../../../src/ui/CueLine.js';

function createState() {
    return {
        meta: { title: 'Quarterly Story' },
        context: { view: 'Canvas', editScope: 'Slide', runtimeMode: null, editScopeStack: [] },
        editor: { activeSlideId: 'slide-1', activeMasterId: 'master-default' },
        slideOrder: ['slide-1'],
        slides: { 'slide-1': { id: 'slide-1', title: 'Opening', layoutId: 'layout-title' } },
        slideMasterPresets: {
            'master-default': { id: 'master-default', type: 'slideMasterPreset', name: 'Default Master' },
            'layout-title': { id: 'layout-title', type: 'layoutMaster', parentMasterId: 'master-default', name: 'Title Slide' }
        },
        presentation: { isPaused: false }
    };
}

describe('CueLine', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = '<nav id="cue-line"></nav>';
        mockGetState.mockReturnValue(createState());
    });

    it('derives the current master, layout, slide, and truthful readiness chain', () => {
        const model = deriveCueLine(createState());

        expect(model.nodes.map((node) => node.kind)).toEqual(['presentation', 'master', 'layout', 'slide', 'readiness']);
        expect(model.nodes.find((node) => node.kind === 'layout')?.meta).toBe('inherited');
        expect(model.nodes.at(-1)?.meta).toBe('Unavailable');
    });

    it('uses active Layout scope instead of a slide-derived source', () => {
        const state = createState();
        state.context.editScope = 'Layout';
        state.editor.activeMasterId = 'layout-title';

        const model = deriveCueLine(state);

        expect(model.nodes.map((node) => node.kind)).toEqual(['presentation', 'master', 'layout', 'readiness']);
        expect(model.nodes.some((node) => node.kind === 'slide')).toBe(false);
    });

    it('navigates layout sources through canonical Store actions', () => {
        new CueLine();

        document.querySelector('[data-cue-kind="layout"]').click();

        expect(mockDispatch).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenCalledWith('ENTER_EDIT_SCOPE', {
            scope: 'Layout',
            sourceId: 'layout-title',
            view: 'Canvas'
        });
    });

    it('hides and clears the Cue Line immediately when runtime state activates', () => {
        const state = createState();
        state.context.runtimeMode = 'Presentation';
        mockGetState.mockReturnValue(state);

        new CueLine();

        expect(document.querySelector('#cue-line').classList.contains('hidden')).toBe(true);
        expect(document.querySelector('#cue-line').children).toHaveLength(0);
    });

    it('returns from an entered source scope through one canonical action', () => {
        const state = createState();
        state.context.editScopeStack = [{ view: 'System' }];
        mockGetState.mockReturnValue(state);
        new CueLine();

        document.querySelector('[data-cue-kind="return"]').click();

        expect(mockDispatch).toHaveBeenCalledWith('EXIT_EDIT_SCOPE');
    });

    it('keeps focus on the replaced compact disclosure control', () => {
        new CueLine();
        const expand = document.querySelector('[data-cue-kind="expand"]');
        expand.focus();

        expand.click();

        expect(document.activeElement).toBe(document.querySelector('[data-cue-kind="expand"]'));
    });
});