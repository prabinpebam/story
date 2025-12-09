import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock all dependencies before importing StrokeSection
vi.mock('../../../../src/core/Store.js', () => ({
    store: {
        getState: vi.fn(),
        dispatch: vi.fn()
    }
}));

vi.mock('../../../../src/ui/components/Section.js', () => ({
    Section: vi.fn()
}));

vi.mock('../../../../src/ui/components/NumberInput.js', () => ({
    NumberInput: vi.fn()
}));

vi.mock('../../../../src/ui/components/IconButton.js', () => ({
    IconButton: vi.fn()
}));

vi.mock('../../../../src/ui/components/ColorInput.js', () => ({
    ColorInput: vi.fn()
}));

vi.mock('../../../../src/ui/components/Dropdown.js', () => ({
    Dropdown: vi.fn()
}));

vi.mock('../../../../src/ui/components/StrokeFlyout/StrokeSettingsFlyout.js', () => ({
    StrokeSettingsFlyout: vi.fn(() => ({
        open: vi.fn(),
        close: vi.fn()
    }))
}));

vi.mock('../../../../src/ui/components/EmptyState.js', () => ({
    EmptyState: vi.fn()
}));

vi.mock('../../../../src/ui/Icons.js', () => ({
    Icons: {
        PLUS: '<svg>plus</svg>',
        MINUS: '<svg>minus</svg>',
        DRAG_HANDLE: '<svg>drag</svg>',
        VISIBLE: '<svg>visible</svg>',
        HIDDEN: '<svg>hidden</svg>',
        BLEND_MODE: '<svg>blend</svg>',
        GRID_3X3: '<svg>grid</svg>'
    }
}));

vi.mock('../../../../src/core/constants/BlendModes.js', () => ({
    BlendModes: [
        { id: 'normal', label: 'Normal' },
        { id: 'multiply', label: 'Multiply' }
    ]
}));

// Import after mocks
import { StrokeSection } from '../../../../src/ui/properties/StrokeSection.js';
import { store } from '../../../../src/core/Store.js';
import { Section } from '../../../../src/ui/components/Section.js';
import { NumberInput } from '../../../../src/ui/components/NumberInput.js';
import { IconButton } from '../../../../src/ui/components/IconButton.js';
import { EmptyState } from '../../../../src/ui/components/EmptyState.js';

describe('StrokeSection', () => {
    let strokeSection;
    let mockSectionElement;

    beforeEach(() => {
        vi.clearAllMocks();
        // Use fake timers to prevent hanging from setTimeout calls
        vi.useFakeTimers({ shouldAdvanceTime: true });

        mockSectionElement = document.createElement('div');

        Section.mockImplementation(() => ({
            element: mockSectionElement,
            appendChild: vi.fn()
        }));

        NumberInput.mockImplementation(() => {
            const el = document.createElement('div');
            el.innerHTML = '<input type="text" />';
            return { element: el, setValue: vi.fn() };
        });

        IconButton.mockImplementation(() => ({
            element: document.createElement('button')
        }));

        EmptyState.mockImplementation((msg) => {
            const el = document.createElement('div');
            el.textContent = msg;
            return { element: el };
        });

        store.getState.mockReturnValue({
            editor: {
                mode: 'edit',
                activeSlideId: 'slide-1',
                selectedElementIds: ['element-1']
            },
            slides: {
                'slide-1': {
                    id: 'slide-1',
                    elements: {
                        'element-1': {
                            id: 'element-1',
                            style: {
                                strokes: [
                                    { color: '#000000', width: 2, opacity: 100, position: 'center', visible: true }
                                ]
                            }
                        }
                    }
                }
            },
            slideMasterPresets: {}
        });

        strokeSection = new StrokeSection();
    });

    afterEach(() => {
        // Run all pending timers and restore real timers
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        vi.restoreAllMocks();
        // Clean up any DOM elements
        document.body.innerHTML = '';
    });

    describe('constructor', () => {
        it('should create an instance', () => {
            expect(strokeSection).toBeDefined();
        });

        it('should create a Section with title Stroke', () => {
            expect(Section).toHaveBeenCalledWith(
                expect.objectContaining({ title: 'Stroke' })
            );
        });

        it('should create section with add stroke action', () => {
            expect(Section).toHaveBeenCalledWith(
                expect.objectContaining({
                    actions: expect.arrayContaining([
                        expect.objectContaining({ title: 'Add Stroke' })
                    ])
                })
            );
        });

        it('should create a container element', () => {
            expect(strokeSection.container).toBeDefined();
            expect(strokeSection.container.className).toBe('pi-section-content');
        });
    });

    describe('update()', () => {
        it('should hide section when selection is empty', () => {
            strokeSection.update([]);
            expect(mockSectionElement.classList.contains('hidden')).toBe(true);
        });

        it('should hide section when selection is null', () => {
            strokeSection.update(null);
            expect(mockSectionElement.classList.contains('hidden')).toBe(true);
        });

        it('should show section when selection has elements', () => {
            strokeSection.update(['element-1']);
            expect(mockSectionElement.classList.contains('hidden')).toBe(false);
        });

        it('should store selection for later use', () => {
            strokeSection.update(['element-1', 'element-2']);
            expect(strokeSection.selection).toEqual(['element-1', 'element-2']);
        });
    });

    describe('getElement()', () => {
        it('should get element from slide in edit mode', () => {
            const state = store.getState();
            const element = strokeSection.getElement(state, 'element-1');
            expect(element).toBeDefined();
            expect(element.id).toBe('element-1');
        });

        it('should get element from master in master mode', () => {
            store.getState.mockReturnValue({
                editor: { mode: 'master', activeMasterId: 'master-1' },
                slides: {},
                slideMasterPresets: {
                    'master-1': {
                        elements: {
                            'el-m1': { id: 'el-m1', style: {} }
                        }
                    }
                }
            });
            const state = store.getState();
            const element = strokeSection.getElement(state, 'el-m1');
            expect(element).toBeDefined();
            expect(element.id).toBe('el-m1');
        });

        it('should return undefined for non-existent element', () => {
            const state = store.getState();
            const element = strokeSection.getElement(state, 'non-existent');
            expect(element).toBeUndefined();
        });
    });

    describe('render()', () => {
        it('should clear container before rendering', () => {
            strokeSection.container.innerHTML = '<div>old</div>';
            strokeSection.render({ id: 'el-1', style: { strokes: [] } });
            expect(strokeSection.container.innerHTML).not.toContain('old');
        });

        it('should render empty state when no strokes', () => {
            strokeSection.render({ id: 'el-1', style: {} });
            expect(EmptyState).toHaveBeenCalledWith('No stroke');
        });
    });

    describe('addStroke()', () => {
        it('should dispatch UPDATE_ELEMENT with new stroke', () => {
            strokeSection.selection = ['element-1'];
            strokeSection.addStroke();
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                expect.objectContaining({
                    id: 'element-1',
                    style: expect.objectContaining({
                        strokes: expect.any(Array)
                    })
                }),
                expect.any(Object)
            );
        });

        it('should add stroke with 100% opacity if first stroke', () => {
            store.getState.mockReturnValue({
                editor: { mode: 'edit', activeSlideId: 'slide-1' },
                slides: {
                    'slide-1': {
                        elements: { 'element-1': { id: 'element-1', style: {} } }
                    }
                }
            });
            strokeSection.selection = ['element-1'];
            strokeSection.addStroke();
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                expect.objectContaining({
                    style: expect.objectContaining({
                        strokes: expect.arrayContaining([
                            expect.objectContaining({ opacity: 100 })
                        ])
                    })
                }),
                expect.any(Object)
            );
        });
    });

    describe('removeStroke()', () => {
        it('should dispatch UPDATE_ELEMENT with stroke removed', () => {
            strokeSection.selection = ['element-1'];
            strokeSection.removeStroke(0);
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                expect.objectContaining({
                    id: 'element-1',
                    style: expect.objectContaining({
                        strokes: []
                    })
                }),
                expect.any(Object)
            );
        });
    });

    describe('updateStroke()', () => {
        it('should update stroke color', () => {
            strokeSection.selection = ['element-1'];
            strokeSection.updateStroke(0, { color: '#FF0000' });
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                expect.objectContaining({
                    id: 'element-1',
                    style: expect.objectContaining({
                        strokes: expect.arrayContaining([
                            expect.objectContaining({ color: '#FF0000' })
                        ])
                    })
                }),
                expect.any(Object)
            );
        });

        it('should skip history for transient updates', () => {
            strokeSection.selection = ['element-1'];
            strokeSection.updateStroke(0, { opacity: 75 }, true);
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                expect.any(Object),
                { skipHistory: true }
            );
        });
    });

    describe('reorderStrokes()', () => {
        it('should do nothing if no strokes array', () => {
            const element = { id: 'element-1', style: {} };
            strokeSection.reorderStrokes(element, 0, 1);
            expect(store.dispatch).not.toHaveBeenCalled();
        });
    });

    describe('commitChanges()', () => {
        it('should sync legacy borderWidth property', () => {
            strokeSection.selection = ['element-1'];
            strokeSection.commitChanges([
                { color: '#FF0000', width: 3, visible: true, position: 'inside' }
            ]);
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                expect.objectContaining({
                    style: expect.objectContaining({
                        borderColor: '#FF0000',
                        borderWidth: 3,
                        strokeAlign: 'inside'
                    })
                }),
                expect.any(Object)
            );
        });

        it('should set borderWidth to 0 when no visible strokes', () => {
            strokeSection.selection = ['element-1'];
            strokeSection.commitChanges([
                { color: '#FF0000', width: 3, visible: false }
            ]);
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                expect.objectContaining({
                    style: expect.objectContaining({
                        borderWidth: 0
                    })
                }),
                expect.any(Object)
            );
        });
    });
});
