import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies before imports
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

vi.mock('../../../../src/ui/components/Flyout.js', () => ({
    Flyout: vi.fn(() => ({
        open: vi.fn(),
        close: vi.fn()
    }))
}));

vi.mock('../../../../src/ui/components/SegmentedControl.js', () => ({
    SegmentedControl: vi.fn()
}));

vi.mock('../../../../src/ui/components/EmptyState.js', () => ({
    EmptyState: vi.fn()
}));

vi.mock('../../../../src/ui/Icons.js', () => ({
    Icons: {
        PLUS: '<svg>plus</svg>',
        MINUS: '<svg>minus</svg>',
        VISIBLE: '<svg>visible</svg>',
        HIDDEN: '<svg>hidden</svg>',
        STYLES: '<svg>styles</svg>',
        CLOSE: '<svg>close</svg>',
        GRID_3X3: '<svg>grid</svg>',
        DRAG_HANDLE: '<svg>drag</svg>',
        EFFECT_SHADOW: '<svg>shadow</svg>',
        EFFECT_INNER_SHADOW: '<svg>inner-shadow</svg>',
        EFFECT_BLUR: '<svg>blur</svg>',
        EFFECT_BG_BLUR: '<svg>bgblur</svg>'
    }
}));

// Import after mocks
import { EffectsSection } from '../../../../src/ui/properties/EffectsSection.js';
import { store } from '../../../../src/core/Store.js';
import { Section } from '../../../../src/ui/components/Section.js';
import { NumberInput } from '../../../../src/ui/components/NumberInput.js';
import { IconButton } from '../../../../src/ui/components/IconButton.js';
import { EmptyState } from '../../../../src/ui/components/EmptyState.js';
import { EffectTypes, createEffect } from '../../../../src/core/constants/EffectDefaults.js';

describe('EffectsSection', () => {
    let effectsSection;
    let mockSectionElement;

    // Helper to create mock state with effects
    function createMockState(effects = []) {
        return {
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
                            style: { effects }
                        }
                    }
                }
            },
            slideMasterPresets: {}
        };
    }

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers({ shouldAdvanceTime: true });

        mockSectionElement = document.createElement('div');

        Section.mockImplementation(() => ({
            element: mockSectionElement,
            appendChild: vi.fn(),
            setCollapsed: vi.fn()
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

        store.getState.mockReturnValue(createMockState());

        effectsSection = new EffectsSection();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        vi.restoreAllMocks();
        document.body.innerHTML = '';
    });

    describe('constructor', () => {
        it('should create an instance', () => {
            expect(effectsSection).toBeDefined();
        });

        it('should create a Section with title Effects', () => {
            expect(Section).toHaveBeenCalledWith(
                expect.objectContaining({ title: 'Effects' })
            );
        });

        it('should create section with add effect action', () => {
            expect(Section).toHaveBeenCalledWith(
                expect.objectContaining({
                    actions: expect.arrayContaining([
                        expect.objectContaining({ title: 'Add Effect' })
                    ])
                })
            );
        });

        it('should create a container element', () => {
            expect(effectsSection.container).toBeDefined();
            expect(effectsSection.container.className).toBe('pi-section-content pi-gap-0');
        });

        it('should initialize activeFlyout as null', () => {
            expect(effectsSection.activeFlyout).toBeNull();
        });

        it('should initialize activeEffectId as null', () => {
            expect(effectsSection.activeEffectId).toBeNull();
        });
    });

    describe('update()', () => {
        it('should hide section when selection is empty', () => {
            effectsSection.update([]);
            expect(mockSectionElement.classList.contains('hidden')).toBe(true);
        });

        it('should hide section when selection is null', () => {
            effectsSection.update(null);
            expect(mockSectionElement.classList.contains('hidden')).toBe(true);
        });

        it('should show section when selection has elements', () => {
            effectsSection.update(['element-1']);
            expect(mockSectionElement.classList.contains('hidden')).toBe(false);
        });

        it('should store selection for later use', () => {
            effectsSection.update(['element-1', 'element-2']);
            expect(effectsSection.selection).toEqual(['element-1', 'element-2']);
        });
    });

    describe('getElement()', () => {
        it('should get element from slide in edit mode', () => {
            const state = store.getState();
            const element = effectsSection.getElement(state, 'element-1');
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
                            'el-m1': { id: 'el-m1', style: { effects: [] } }
                        }
                    }
                }
            });
            const state = store.getState();
            const element = effectsSection.getElement(state, 'el-m1');
            expect(element).toBeDefined();
            expect(element.id).toBe('el-m1');
        });

        it('should return undefined for non-existent element', () => {
            const state = store.getState();
            const element = effectsSection.getElement(state, 'non-existent');
            expect(element).toBeUndefined();
        });
    });

    describe('getEffects()', () => {
        it('should return effects array from element', () => {
            const effects = [{ id: 'e1', type: 'dropShadow' }];
            store.getState.mockReturnValue(createMockState(effects));
            const state = store.getState();
            const element = effectsSection.getElement(state, 'element-1');
            expect(effectsSection.getEffects(element)).toEqual(effects);
        });

        it('should return empty array if no effects', () => {
            const state = store.getState();
            const element = effectsSection.getElement(state, 'element-1');
            expect(effectsSection.getEffects(element)).toEqual([]);
        });

        it('should return empty array for undefined element', () => {
            expect(effectsSection.getEffects(undefined)).toEqual([]);
        });
    });

    describe('render()', () => {
        it('should clear container before rendering', () => {
            effectsSection.container.innerHTML = '<div>old</div>';
            effectsSection.render({ id: 'el-1', style: { effects: [] } });
            expect(effectsSection.container.innerHTML).not.toContain('old');
        });

        it('should render empty state when no effects', () => {
            effectsSection.render({ id: 'el-1', style: { effects: [] } });
            expect(EmptyState).toHaveBeenCalledWith('No effects');
        });

        it('should render effect row for drop shadow', () => {
            const effects = [{ id: 'e1', type: EffectTypes.DROP_SHADOW, visible: true }];
            effectsSection.render({ id: 'el-1', style: { effects } });
            const rows = effectsSection.container.querySelectorAll('.pi-effect-row');
            expect(rows.length).toBe(1);
        });

        it('should render multiple effect rows', () => {
            const effects = [
                { id: 'e1', type: EffectTypes.DROP_SHADOW, visible: true },
                { id: 'e2', type: EffectTypes.INNER_SHADOW, visible: true },
                { id: 'e3', type: EffectTypes.LAYER_BLUR, visible: true }
            ];
            effectsSection.render({ id: 'el-1', style: { effects } });
            const rows = effectsSection.container.querySelectorAll('.pi-effect-row');
            expect(rows.length).toBe(3);
        });

        it('should add invisible class for hidden effects', () => {
            const effects = [{ id: 'e1', type: EffectTypes.DROP_SHADOW, visible: false }];
            effectsSection.render({ id: 'el-1', style: { effects } });
            const row = effectsSection.container.querySelector('.pi-effect-row');
            expect(row.classList.contains('invisible')).toBe(true);
        });

        it('should add active class for active effect', () => {
            effectsSection.activeEffectId = 'e1';
            const effects = [{ id: 'e1', type: EffectTypes.DROP_SHADOW, visible: true }];
            effectsSection.render({ id: 'el-1', style: { effects } });
            const row = effectsSection.container.querySelector('.pi-effect-row');
            expect(row.classList.contains('active')).toBe(true);
        });
    });

    describe('addEffect()', () => {
        it('should add drop shadow by default', () => {
            store.getState.mockReturnValue(createMockState([]));
            effectsSection.selection = ['element-1'];
            effectsSection.addEffect();
            
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                expect.objectContaining({
                    id: 'element-1',
                    style: expect.objectContaining({
                        effects: expect.arrayContaining([
                            expect.objectContaining({ type: EffectTypes.DROP_SHADOW })
                        ])
                    })
                }),
                expect.any(Object)
            );
        });

        it('should add inner shadow when specified', () => {
            store.getState.mockReturnValue(createMockState([]));
            effectsSection.selection = ['element-1'];
            effectsSection.addEffect(EffectTypes.INNER_SHADOW);
            
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                expect.objectContaining({
                    style: expect.objectContaining({
                        effects: expect.arrayContaining([
                            expect.objectContaining({ type: EffectTypes.INNER_SHADOW })
                        ])
                    })
                }),
                expect.any(Object)
            );
        });

        it('should append to existing effects', () => {
            const existing = [{ id: 'e1', type: EffectTypes.DROP_SHADOW }];
            store.getState.mockReturnValue(createMockState(existing));
            effectsSection.selection = ['element-1'];
            effectsSection.addEffect(EffectTypes.LAYER_BLUR);
            
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                expect.objectContaining({
                    style: expect.objectContaining({
                        effects: expect.arrayContaining([
                            expect.objectContaining({ type: EffectTypes.DROP_SHADOW }),
                            expect.objectContaining({ type: EffectTypes.LAYER_BLUR })
                        ])
                    })
                }),
                expect.any(Object)
            );
        });

        it('should expand section when adding effect', () => {
            const mockSetCollapsed = vi.fn();
            Section.mockImplementation(() => ({
                element: mockSectionElement,
                appendChild: vi.fn(),
                setCollapsed: mockSetCollapsed
            }));
            effectsSection = new EffectsSection();
            effectsSection.selection = ['element-1'];
            effectsSection.addEffect();
            
            expect(mockSetCollapsed).toHaveBeenCalledWith(false);
        });
    });

    describe('removeEffect()', () => {
        it('should remove effect by id', () => {
            const effects = [
                { id: 'e1', type: EffectTypes.DROP_SHADOW },
                { id: 'e2', type: EffectTypes.LAYER_BLUR }
            ];
            store.getState.mockReturnValue(createMockState(effects));
            effectsSection.selection = ['element-1'];
            effectsSection.removeEffect('e1');
            
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                expect.objectContaining({
                    style: expect.objectContaining({
                        effects: [expect.objectContaining({ id: 'e2' })]
                    })
                }),
                expect.any(Object)
            );
        });

        it('should close flyout if removing active effect', () => {
            const mockClose = vi.fn();
            effectsSection.activeFlyout = { close: mockClose };
            effectsSection.activeEffectId = 'e1';
            
            const effects = [{ id: 'e1', type: EffectTypes.DROP_SHADOW }];
            store.getState.mockReturnValue(createMockState(effects));
            effectsSection.selection = ['element-1'];
            effectsSection.removeEffect('e1');
            
            expect(mockClose).toHaveBeenCalled();
        });
    });

    describe('updateEffect()', () => {
        it('should update effect properties', () => {
            const effects = [{ id: 'e1', type: EffectTypes.DROP_SHADOW, x: 0, y: 4 }];
            store.getState.mockReturnValue(createMockState(effects));
            effectsSection.selection = ['element-1'];
            effectsSection.updateEffect('e1', { x: 10, blur: 12 });
            
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                expect.objectContaining({
                    style: expect.objectContaining({
                        effects: [expect.objectContaining({ id: 'e1', x: 10, blur: 12, y: 4 })]
                    })
                }),
                expect.any(Object)
            );
        });

        it('should pass isTransient flag', () => {
            const effects = [{ id: 'e1', type: EffectTypes.DROP_SHADOW }];
            store.getState.mockReturnValue(createMockState(effects));
            effectsSection.selection = ['element-1'];
            effectsSection.updateEffect('e1', { x: 10 }, true);
            
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                expect.any(Object),
                { skipHistory: true }
            );
        });

        it('should not modify other effects', () => {
            const effects = [
                { id: 'e1', type: EffectTypes.DROP_SHADOW, x: 0 },
                { id: 'e2', type: EffectTypes.LAYER_BLUR, radius: 8 }
            ];
            store.getState.mockReturnValue(createMockState(effects));
            effectsSection.selection = ['element-1'];
            effectsSection.updateEffect('e1', { x: 10 });
            
            // Verify dispatch was called with both effects, second unchanged
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                expect.objectContaining({
                    style: expect.objectContaining({
                        effects: expect.arrayContaining([
                            expect.objectContaining({ id: 'e1', x: 10 }),
                            expect.objectContaining({ id: 'e2', type: EffectTypes.LAYER_BLUR, radius: 8 })
                        ])
                    })
                }),
                expect.any(Object)
            );
        });
    });

    describe('toggleEffectVisibility()', () => {
        it('should toggle visible to false when currently true', () => {
            const effects = [{ id: 'e1', type: EffectTypes.DROP_SHADOW, visible: true }];
            store.getState.mockReturnValue(createMockState(effects));
            effectsSection.selection = ['element-1'];
            effectsSection.toggleEffectVisibility('e1');
            
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                expect.objectContaining({
                    style: expect.objectContaining({
                        effects: [expect.objectContaining({ visible: false })]
                    })
                }),
                expect.any(Object)
            );
        });

        it('should toggle visible to true when currently false', () => {
            const effects = [{ id: 'e1', type: EffectTypes.DROP_SHADOW, visible: false }];
            store.getState.mockReturnValue(createMockState(effects));
            effectsSection.selection = ['element-1'];
            effectsSection.toggleEffectVisibility('e1');
            
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                expect.objectContaining({
                    style: expect.objectContaining({
                        effects: [expect.objectContaining({ visible: true })]
                    })
                }),
                expect.any(Object)
            );
        });
    });

    describe('changeEffectType()', () => {
        it('should change effect type', () => {
            const effects = [{ id: 'e1', type: EffectTypes.DROP_SHADOW, x: 5, y: 5 }];
            store.getState.mockReturnValue(createMockState(effects));
            effectsSection.selection = ['element-1'];
            effectsSection.changeEffectType('e1', EffectTypes.INNER_SHADOW);
            
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                expect.objectContaining({
                    style: expect.objectContaining({
                        effects: [expect.objectContaining({ 
                            id: 'e1', 
                            type: EffectTypes.INNER_SHADOW 
                        })]
                    })
                }),
                expect.any(Object)
            );
        });

        it('should preserve shadow properties when changing shadow to shadow', () => {
            const effects = [{ 
                id: 'e1', 
                type: EffectTypes.DROP_SHADOW, 
                x: 10, 
                y: 15, 
                blur: 20,
                color: '#FF0000',
                opacity: 50
            }];
            store.getState.mockReturnValue(createMockState(effects));
            effectsSection.selection = ['element-1'];
            effectsSection.changeEffectType('e1', EffectTypes.INNER_SHADOW);
            
            // Verify common properties are preserved
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                expect.objectContaining({
                    style: expect.objectContaining({
                        effects: expect.arrayContaining([
                            expect.objectContaining({ 
                                id: 'e1', 
                                type: EffectTypes.INNER_SHADOW,
                                x: 10, 
                                y: 15,
                                color: '#FF0000'
                            })
                        ])
                    })
                }),
                expect.any(Object)
            );
        });

        it('should use defaults when changing between different categories', () => {
            const effects = [{ 
                id: 'e1', 
                type: EffectTypes.DROP_SHADOW, 
                x: 10, 
                y: 15 
            }];
            store.getState.mockReturnValue(createMockState(effects));
            effectsSection.selection = ['element-1'];
            effectsSection.changeEffectType('e1', EffectTypes.LAYER_BLUR);
            
            // Verify it uses blur defaults (radius: 12, mode: uniform)
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                expect.objectContaining({
                    style: expect.objectContaining({
                        effects: expect.arrayContaining([
                            expect.objectContaining({ 
                                id: 'e1', 
                                type: EffectTypes.LAYER_BLUR,
                                radius: 12
                            })
                        ])
                    })
                }),
                expect.any(Object)
            );
        });
    });

    describe('reorderEffect()', () => {
        it('should move effect from one position to another', () => {
            const effects = [
                { id: 'e1', type: EffectTypes.DROP_SHADOW },
                { id: 'e2', type: EffectTypes.INNER_SHADOW },
                { id: 'e3', type: EffectTypes.LAYER_BLUR }
            ];
            store.getState.mockReturnValue(createMockState(effects));
            effectsSection.selection = ['element-1'];
            effectsSection.reorderEffect(0, 2);
            
            // After moving index 0 to index 2: e2, e3, e1
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                expect.objectContaining({
                    style: expect.objectContaining({
                        effects: [
                            expect.objectContaining({ id: 'e2' }),
                            expect.objectContaining({ id: 'e3' }),
                            expect.objectContaining({ id: 'e1' })
                        ]
                    })
                }),
                expect.any(Object)
            );
        });
    });

    describe('getEffectIcon()', () => {
        it('should return shadow icon for drop shadow', () => {
            const icon = effectsSection.getEffectIcon(EffectTypes.DROP_SHADOW);
            expect(icon).toContain('shadow');
        });

        it('should return blur icon for layer blur', () => {
            const icon = effectsSection.getEffectIcon(EffectTypes.LAYER_BLUR);
            expect(icon).toContain('blur');
        });

        it('should return bg blur icon for background blur', () => {
            const icon = effectsSection.getEffectIcon(EffectTypes.BACKGROUND_BLUR);
            expect(icon).toContain('bgblur');
        });
    });
});
