import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock all dependencies before importing EffectsSection
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
        EFFECT_SHADOW: '<svg>shadow</svg>',
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

describe('EffectsSection', () => {
    let effectsSection;
    let mockSectionElement;

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
                                dropShadow: { x: 0, y: 4, blur: 4, spread: 0, color: '#00000080', visible: true }
                            }
                        }
                    }
                }
            },
            masters: {}
        });

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
            expect(effectsSection.container.className).toBe('pi-section-content');
        });

        it('should initialize activeFlyout as null', () => {
            expect(effectsSection.activeFlyout).toBeNull();
        });

        it('should initialize activeEffectType as null', () => {
            expect(effectsSection.activeEffectType).toBeNull();
        });
    });

    describe('update()', () => {
        it('should hide section when selection is empty', () => {
            effectsSection.update([]);
            expect(mockSectionElement.style.display).toBe('none');
        });

        it('should hide section when selection is null', () => {
            effectsSection.update(null);
            expect(mockSectionElement.style.display).toBe('none');
        });

        it('should show section when selection has elements', () => {
            effectsSection.update(['element-1']);
            expect(mockSectionElement.style.display).toBe('block');
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
                masters: {
                    'master-1': {
                        elements: {
                            'el-m1': { id: 'el-m1', style: {} }
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

    describe('render()', () => {
        it('should clear container before rendering', () => {
            effectsSection.container.innerHTML = '<div>old</div>';
            effectsSection.render({ id: 'el-1', style: {} });
            expect(effectsSection.container.innerHTML).not.toContain('old');
        });

        it('should render empty state when no effects', () => {
            effectsSection.render({ id: 'el-1', style: {} });
            expect(EmptyState).toHaveBeenCalledWith('No effects');
        });

        it('should render effect row for dropShadow', () => {
            effectsSection.render({
                id: 'el-1',
                style: {
                    dropShadow: { x: 0, y: 4, blur: 4, color: '#000' }
                }
            });
            const rows = effectsSection.container.querySelectorAll('.pi-row');
            expect(rows.length).toBe(1);
        });

        it('should render effect row for blur', () => {
            effectsSection.render({
                id: 'el-1',
                style: {
                    blur: { radius: 4 }
                }
            });
            const rows = effectsSection.container.querySelectorAll('.pi-row');
            expect(rows.length).toBe(1);
        });

        it('should render multiple effect rows', () => {
            effectsSection.render({
                id: 'el-1',
                style: {
                    dropShadow: { x: 0, y: 4, blur: 4, color: '#000' },
                    blur: { radius: 4 },
                    backgroundBlur: { radius: 8 }
                }
            });
            const rows = effectsSection.container.querySelectorAll('.pi-row');
            expect(rows.length).toBe(3);
        });
    });

    describe('addEffect()', () => {
        it('should add dropShadow if none exists', () => {
            store.getState.mockReturnValue({
                editor: { mode: 'edit', activeSlideId: 'slide-1' },
                slides: {
                    'slide-1': {
                        elements: { 'element-1': { id: 'element-1', style: {} } }
                    }
                }
            });
            effectsSection.selection = ['element-1'];
            effectsSection.addEffect();
            
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                expect.objectContaining({
                    id: 'element-1',
                    style: expect.objectContaining({
                        dropShadow: expect.objectContaining({ blur: 4 })
                    })
                }),
                expect.any(Object)
            );
        });

        it('should add blur if dropShadow exists', () => {
            effectsSection.selection = ['element-1'];
            effectsSection.addEffect();
            
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                expect.objectContaining({
                    id: 'element-1',
                    style: expect.objectContaining({
                        blur: expect.objectContaining({ radius: 4 })
                    })
                }),
                expect.any(Object)
            );
        });
    });

    describe('removeEffect()', () => {
        it('should set effect to null', () => {
            effectsSection.selection = ['element-1'];
            effectsSection.removeEffect('dropShadow');
            
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                expect.objectContaining({
                    id: 'element-1',
                    style: expect.objectContaining({
                        dropShadow: null
                    })
                }),
                expect.any(Object)
            );
        });
    });

    describe('toggleVisibility()', () => {
        it('should toggle visible to false when currently true', () => {
            effectsSection.selection = ['element-1'];
            effectsSection.toggleVisibility('dropShadow');
            
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                expect.objectContaining({
                    style: expect.objectContaining({
                        dropShadow: expect.objectContaining({ visible: false })
                    })
                }),
                expect.any(Object)
            );
        });

        it('should toggle visible to true when currently false', () => {
            store.getState.mockReturnValue({
                editor: { mode: 'edit', activeSlideId: 'slide-1' },
                slides: {
                    'slide-1': {
                        elements: {
                            'element-1': {
                                id: 'element-1',
                                style: {
                                    dropShadow: { visible: false, x: 0, y: 4 }
                                }
                            }
                        }
                    }
                }
            });
            effectsSection.selection = ['element-1'];
            effectsSection.toggleVisibility('dropShadow');
            
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                expect.objectContaining({
                    style: expect.objectContaining({
                        dropShadow: expect.objectContaining({ visible: true })
                    })
                }),
                expect.any(Object)
            );
        });
    });

    describe('updateDropShadow()', () => {
        it('should update dropShadow property', () => {
            effectsSection.selection = ['element-1'];
            effectsSection.updateDropShadow('blur', 8);
            
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                expect.objectContaining({
                    style: expect.objectContaining({
                        dropShadow: expect.objectContaining({ blur: 8 })
                    })
                }),
                expect.any(Object)
            );
        });

        it('should pass isTransient flag', () => {
            effectsSection.selection = ['element-1'];
            effectsSection.updateDropShadow('x', 10, true);
            
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                expect.any(Object),
                { skipHistory: true }
            );
        });
    });

    describe('updateBlur()', () => {
        it('should update blur property', () => {
            store.getState.mockReturnValue({
                editor: { mode: 'edit', activeSlideId: 'slide-1' },
                slides: {
                    'slide-1': {
                        elements: {
                            'element-1': {
                                id: 'element-1',
                                style: { blur: { radius: 4, type: 'uniform' } }
                            }
                        }
                    }
                }
            });
            effectsSection.selection = ['element-1'];
            effectsSection.updateBlur('radius', 12);
            
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                expect.objectContaining({
                    style: expect.objectContaining({
                        blur: expect.objectContaining({ radius: 12 })
                    })
                }),
                expect.any(Object)
            );
        });

        it('should handle legacy number format', () => {
            store.getState.mockReturnValue({
                editor: { mode: 'edit', activeSlideId: 'slide-1' },
                slides: {
                    'slide-1': {
                        elements: {
                            'element-1': {
                                id: 'element-1',
                                style: { blur: 4 }
                            }
                        }
                    }
                }
            });
            effectsSection.selection = ['element-1'];
            effectsSection.updateBlur('radius', 8);
            
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                expect.objectContaining({
                    style: expect.objectContaining({
                        blur: expect.objectContaining({ radius: 8, type: 'uniform' })
                    })
                }),
                expect.any(Object)
            );
        });
    });

    describe('getOpacityFromColor()', () => {
        it('should return 100 for 6-digit hex', () => {
            expect(effectsSection.getOpacityFromColor('#FF0000')).toBe(100);
        });

        it('should extract opacity from 8-digit hex', () => {
            expect(effectsSection.getOpacityFromColor('#FF000080')).toBe(50);
        });

        it('should extract opacity from rgba', () => {
            expect(effectsSection.getOpacityFromColor('rgba(255, 0, 0, 0.5)')).toBe(50);
        });

        it('should return 100 for null/undefined', () => {
            expect(effectsSection.getOpacityFromColor(null)).toBe(100);
            expect(effectsSection.getOpacityFromColor(undefined)).toBe(100);
        });
    });

    describe('applyOpacityToColor()', () => {
        it('should apply opacity to 6-digit hex', () => {
            const result = effectsSection.applyOpacityToColor('#FF0000', 50);
            expect(result).toBe('#FF000080');
        });

        it('should replace existing opacity in 8-digit hex', () => {
            const result = effectsSection.applyOpacityToColor('#FF0000FF', 25);
            expect(result).toBe('#FF000040');
        });

        it('should handle rgba input', () => {
            const result = effectsSection.applyOpacityToColor('rgba(255, 0, 0, 1)', 75);
            expect(result).toBe('rgba(255, 0, 0, 0.75)');
        });

        it('should clamp opacity to 0-100', () => {
            const result = effectsSection.applyOpacityToColor('#FF0000', 150);
            expect(result).toBe('#FF0000ff');
        });
    });

    describe('setActiveEffect()', () => {
        it('should set activeEffectType', () => {
            effectsSection.setActiveEffect('blur');
            expect(effectsSection.activeEffectType).toBe('blur');
        });

        it('should clear activeEffectType when null', () => {
            effectsSection.activeEffectType = 'dropShadow';
            effectsSection.setActiveEffect(null);
            expect(effectsSection.activeEffectType).toBeNull();
        });
    });
});
