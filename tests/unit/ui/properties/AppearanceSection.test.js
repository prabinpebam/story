import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock all dependencies before importing AppearanceSection
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

vi.mock('../../../../src/ui/components/Dropdown.js', () => ({
    Dropdown: vi.fn()
}));

vi.mock('../../../../src/ui/components/Button.js', () => ({
    Button: vi.fn()
}));

vi.mock('../../../../src/ui/Icons.js', () => ({
    Icons: {
        VISIBLE: '<svg>visible</svg>',
        HIDDEN: '<svg>hidden</svg>',
        LINK: '<svg>link</svg>'
    }
}));

// Import after mocks
import { AppearanceSection } from '../../../../src/ui/properties/AppearanceSection.js';
import { store } from '../../../../src/core/Store.js';
import { Section } from '../../../../src/ui/components/Section.js';
import { NumberInput } from '../../../../src/ui/components/NumberInput.js';
import { Dropdown } from '../../../../src/ui/components/Dropdown.js';
import { Button } from '../../../../src/ui/components/Button.js';

describe('AppearanceSection', () => {
    let appearanceSection;
    let mockSectionElement;
    let mockOpacityInput;
    let mockBlendModeSelect;
    let mockRadiusInput;
    let mockLinkBtn;
    let mockTlInput, mockTrInput, mockBlInput, mockBrInput;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers({ shouldAdvanceTime: true });

        mockSectionElement = document.createElement('div');

        Section.mockImplementation(() => ({
            element: mockSectionElement,
            appendChild: vi.fn()
        }));

        mockOpacityInput = {
            element: document.createElement('div'),
            setValue: vi.fn(),
            getValue: vi.fn().mockReturnValue(100)
        };
        
        mockRadiusInput = {
            element: document.createElement('div'),
            setValue: vi.fn(),
            getValue: vi.fn().mockReturnValue(0)
        };

        // Mock corner inputs
        mockTlInput = { element: document.createElement('div'), setValue: vi.fn(), getValue: vi.fn().mockReturnValue(0) };
        mockTrInput = { element: document.createElement('div'), setValue: vi.fn(), getValue: vi.fn().mockReturnValue(0) };
        mockBlInput = { element: document.createElement('div'), setValue: vi.fn(), getValue: vi.fn().mockReturnValue(0) };
        mockBrInput = { element: document.createElement('div'), setValue: vi.fn(), getValue: vi.fn().mockReturnValue(0) };

        let numberInputCallCount = 0;
        NumberInput.mockImplementation(() => {
            numberInputCallCount++;
            // 1: Opacity, 2: Radius, 3: TL, 4: TR, 5: BL, 6: BR
            switch(numberInputCallCount) {
                case 1: return mockOpacityInput;
                case 2: return mockRadiusInput;
                case 3: return mockTlInput;
                case 4: return mockTrInput;
                case 5: return mockBlInput;
                case 6: return mockBrInput;
                default: return mockRadiusInput;
            }
        });

        mockBlendModeSelect = {
            element: document.createElement('div'),
            setValue: vi.fn()
        };
        Dropdown.mockImplementation(() => mockBlendModeSelect);

        // Mock Button for link toggle
        mockLinkBtn = {
            element: document.createElement('button')
        };
        Button.mockImplementation(() => mockLinkBtn);

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
                            type: 'rect',
                            opacity: 0.8,
                            blendMode: 'multiply',
                            borderRadius: 10,
                            hidden: false
                        }
                    }
                }
            },
            slideMasterPresets: {}
        });

        appearanceSection = new AppearanceSection();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        vi.restoreAllMocks();
        document.body.innerHTML = '';
    });

    describe('constructor', () => {
        it('should create an instance', () => {
            expect(appearanceSection).toBeDefined();
        });

        it('should create a Section with title Appearance', () => {
            expect(Section).toHaveBeenCalledWith(
                expect.objectContaining({ title: 'Appearance' })
            );
        });

        it('should create section with toggle visibility action', () => {
            expect(Section).toHaveBeenCalledWith(
                expect.objectContaining({
                    actions: expect.arrayContaining([
                        expect.objectContaining({ title: 'Toggle Visibility' })
                    ])
                })
            );
        });

        it('should create opacity input', () => {
            expect(NumberInput).toHaveBeenCalledWith(
                expect.objectContaining({
                    label: 'Opacity',
                    value: 100,
                    units: '%',
                    min: 0,
                    max: 100
                })
            );
        });

        it('should create blend mode dropdown', () => {
            expect(Dropdown).toHaveBeenCalledWith(
                expect.objectContaining({
                    value: 'normal',
                    size: 'fill'
                })
            );
        });

        it('should include all blend mode options', () => {
            const dropdownCall = Dropdown.mock.calls[0][0];
            const optionValues = dropdownCall.options.map(o => o.value);
            expect(optionValues).toContain('normal');
            expect(optionValues).toContain('multiply');
            expect(optionValues).toContain('screen');
            expect(optionValues).toContain('overlay');
            expect(optionValues).toContain('hard-light');
        });

        it('should create radius input', () => {
            expect(NumberInput).toHaveBeenCalledWith(
                expect.objectContaining({
                    label: 'Radius',
                    value: 0,
                    min: 0
                })
            );
        });
    });

    describe('update()', () => {
        it('should hide section when selection is empty', () => {
            appearanceSection.update([]);
            expect(mockSectionElement.classList.contains('hidden')).toBe(true);
        });

        it('should hide section when selection is null', () => {
            appearanceSection.update(null);
            expect(mockSectionElement.classList.contains('hidden')).toBe(true);
        });

        it('should show section when selection has elements', () => {
            appearanceSection.update(['element-1']);
            expect(mockSectionElement.classList.contains('hidden')).toBe(false);
        });

        it('should update opacity input value from element', () => {
            appearanceSection.update(['element-1']);
            expect(mockOpacityInput.setValue).toHaveBeenCalledWith(80, false);
        });

        it('should update blend mode from element', () => {
            appearanceSection.update(['element-1']);
            expect(mockBlendModeSelect.setValue).toHaveBeenCalledWith('multiply');
        });

        it('should show radius input for rect elements', () => {
            appearanceSection.update(['element-1']);
            expect(mockRadiusInput.element.classList.contains('hidden')).toBe(false);
            expect(mockRadiusInput.setValue).toHaveBeenCalledWith(10, false);
        });

        it('should hide radius input for non-rect/image elements', () => {
            store.getState.mockReturnValue({
                editor: { mode: 'edit', activeSlideId: 'slide-1', selectedElementIds: ['element-1'] },
                slides: {
                    'slide-1': {
                        elements: {
                            'element-1': { id: 'element-1', type: 'text', opacity: 1 }
                        }
                    }
                }
            });
            appearanceSection.update(['element-1']);
            expect(mockRadiusInput.element.classList.contains('hidden')).toBe(true);
        });

        it('should default opacity to 100% when undefined', () => {
            store.getState.mockReturnValue({
                editor: { mode: 'edit', activeSlideId: 'slide-1', selectedElementIds: ['element-1'] },
                slides: {
                    'slide-1': {
                        elements: {
                            'element-1': { id: 'element-1', type: 'text' }
                        }
                    }
                }
            });
            appearanceSection.update(['element-1']);
            expect(mockOpacityInput.setValue).toHaveBeenCalledWith(100, false);
        });

        it('should default blend mode to normal when undefined', () => {
            store.getState.mockReturnValue({
                editor: { mode: 'edit', activeSlideId: 'slide-1', selectedElementIds: ['element-1'] },
                slides: {
                    'slide-1': {
                        elements: {
                            'element-1': { id: 'element-1', type: 'rect' }
                        }
                    }
                }
            });
            appearanceSection.update(['element-1']);
            expect(mockBlendModeSelect.setValue).toHaveBeenCalledWith('normal');
        });
    });

    describe('getElement()', () => {
        it('should get element from slide in edit mode', () => {
            const state = store.getState();
            const element = appearanceSection.getElement(state, 'element-1');
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
                            'el-m1': { id: 'el-m1', opacity: 0.5 }
                        }
                    }
                }
            });
            const state = store.getState();
            const element = appearanceSection.getElement(state, 'el-m1');
            expect(element).toBeDefined();
            expect(element.id).toBe('el-m1');
        });

        it('should return undefined for non-existent element', () => {
            const state = store.getState();
            const element = appearanceSection.getElement(state, 'non-existent');
            expect(element).toBeUndefined();
        });
    });

    describe('updateProperty()', () => {
        it('should dispatch UPDATE_ELEMENT for opacity', () => {
            appearanceSection.updateProperty('opacity', 0.5);
            
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                { id: 'element-1', opacity: 0.5 },
                { skipHistory: false }
            );
        });

        it('should dispatch UPDATE_ELEMENT for blendMode', () => {
            appearanceSection.updateProperty('blendMode', 'screen');
            
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                { id: 'element-1', blendMode: 'screen' },
                { skipHistory: false }
            );
        });

        it('should dispatch UPDATE_ELEMENT for borderRadius', () => {
            appearanceSection.updateProperty('borderRadius', 20);
            
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                { id: 'element-1', borderRadius: 20 },
                { skipHistory: false }
            );
        });

        it('should pass isTransient flag to dispatch', () => {
            appearanceSection.updateProperty('opacity', 0.75, true);
            
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                { id: 'element-1', opacity: 0.75 },
                { skipHistory: true }
            );
        });

        it('should update all selected elements', () => {
            store.getState.mockReturnValue({
                editor: { selectedElementIds: ['el-1', 'el-2', 'el-3'] }
            });
            
            appearanceSection.updateProperty('opacity', 0.5);
            
            expect(store.dispatch).toHaveBeenCalledTimes(3);
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT', { id: 'el-1', opacity: 0.5 }, { skipHistory: false });
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT', { id: 'el-2', opacity: 0.5 }, { skipHistory: false });
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT', { id: 'el-3', opacity: 0.5 }, { skipHistory: false });
        });
    });

    describe('toggleVisibility()', () => {
        it('should toggle hidden to true when currently false', () => {
            appearanceSection.toggleVisibility();
            
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                { id: 'element-1', hidden: true }
            );
        });

        it('should toggle hidden to false when currently true', () => {
            store.getState.mockReturnValue({
                editor: {
                    mode: 'edit',
                    activeSlideId: 'slide-1',
                    selectedElementIds: ['element-1']
                },
                slides: {
                    'slide-1': {
                        elements: {
                            'element-1': { id: 'element-1', hidden: true }
                        }
                    }
                }
            });
            
            appearanceSection.toggleVisibility();
            
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                { id: 'element-1', hidden: false }
            );
        });

        it('should toggle all selected elements', () => {
            store.getState.mockReturnValue({
                editor: {
                    mode: 'edit',
                    activeSlideId: 'slide-1',
                    selectedElementIds: ['el-1', 'el-2']
                },
                slides: {
                    'slide-1': {
                        elements: {
                            'el-1': { id: 'el-1', hidden: false },
                            'el-2': { id: 'el-2', hidden: true }
                        }
                    }
                }
            });
            
            appearanceSection.toggleVisibility();
            
            // Should toggle all based on first element's state
            expect(store.dispatch).toHaveBeenCalledTimes(2);
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT', { id: 'el-1', hidden: true });
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT', { id: 'el-2', hidden: true });
        });
    });

    describe('opacity onChange callback', () => {
        it('should convert percentage to decimal', () => {
            // Get the onChange callback from NumberInput
            const opacityConfig = NumberInput.mock.calls[0][0];
            opacityConfig.onChange(75, false);
            
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                { id: 'element-1', opacity: 0.75 },
                { skipHistory: false }
            );
        });
    });

    describe('blendMode onChange callback', () => {
        it('should pass blend mode value directly', () => {
            const blendModeConfig = Dropdown.mock.calls[0][0];
            blendModeConfig.onChange('overlay');
            
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                { id: 'element-1', blendMode: 'overlay' },
                { skipHistory: false }
            );
        });
    });

    describe('per-corner radius', () => {
        it('should start in linked mode by default', () => {
            expect(appearanceSection.isRadiusLinked()).toBe(true);
        });

        it('should create link button for radius', () => {
            // Button is created for linking corners (5th NumberInput call creates corner inputs)
            // The link button should be created in createContent
            expect(appearanceSection.radiusLinkBtn).toBeDefined();
        });

        it('should detect per-corner radii in element data', () => {
            store.getState.mockReturnValue({
                editor: { mode: 'edit', activeSlideId: 'slide-1', selectedElementIds: ['element-1'] },
                slides: {
                    'slide-1': {
                        elements: {
                            'element-1': { 
                                id: 'element-1', 
                                type: 'rect',
                                cornerRadii: { tl: 10, tr: 8, bl: 6, br: 4 }
                            }
                        }
                    }
                }
            });
            
            appearanceSection.update(['element-1']);
            
            // Should switch to unlinked mode when cornerRadii exists
            expect(appearanceSection.isRadiusLinked()).toBe(false);
        });

        it('should use uniform radius when cornerRadii is not set', () => {
            store.getState.mockReturnValue({
                editor: { mode: 'edit', activeSlideId: 'slide-1', selectedElementIds: ['element-1'] },
                slides: {
                    'slide-1': {
                        elements: {
                            'element-1': { 
                                id: 'element-1', 
                                type: 'rect',
                                borderRadius: 12
                            }
                        }
                    }
                }
            });
            
            appearanceSection.update(['element-1']);
            
            expect(appearanceSection.isRadiusLinked()).toBe(true);
        });

        it('should dispatch cornerRadii when changing individual corners', () => {
            store.getState.mockReturnValue({
                editor: { mode: 'edit', activeSlideId: 'slide-1', selectedElementIds: ['element-1'] },
                slides: {
                    'slide-1': {
                        elements: {
                            'element-1': { 
                                id: 'element-1', 
                                type: 'rect',
                                cornerRadii: { tl: 10, tr: 10, bl: 10, br: 10 }
                            }
                        }
                    }
                }
            });

            appearanceSection._handleCornerRadiusChange('tl', 20, false);

            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT', 
                expect.objectContaining({
                    id: 'element-1',
                    cornerRadii: { tl: 20, tr: 10, bl: 10, br: 10 }
                }),
                expect.anything()
            );
        });

        it('should clear cornerRadii when switching to uniform mode', () => {
            store.getState.mockReturnValue({
                editor: { mode: 'edit', activeSlideId: 'slide-1', selectedElementIds: ['element-1'] },
                slides: {
                    'slide-1': {
                        elements: {
                            'element-1': { 
                                id: 'element-1', 
                                type: 'rect',
                                cornerRadii: { tl: 10, tr: 8, bl: 6, br: 4 }
                            }
                        }
                    }
                }
            });

            appearanceSection._radiusLinked = false;
            appearanceSection._switchToUniformMode();

            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT', 
                expect.objectContaining({
                    id: 'element-1',
                    cornerRadii: null
                })
            );
        });
    });
});
