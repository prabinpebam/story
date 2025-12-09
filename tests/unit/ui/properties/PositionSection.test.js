import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted() for mock functions
const { mockDispatch, mockGetState, MockSection, MockNumberInput, MockIconButton } = vi.hoisted(() => ({
    mockDispatch: vi.fn(),
    mockGetState: vi.fn(() => ({
        editor: {
            mode: 'edit',
            activeSlideId: 'slide-1',
            selectedElementIds: ['element-1']
        },
        slides: {
            'slide-1': {
                id: 'slide-1',
                elements: {
                    'element-1': { id: 'element-1', x: 100, y: 200, rotation: 45 }
                }
            }
        },
        slideMasterPresets: {}
    })),
    MockSection: vi.fn(),
    MockNumberInput: vi.fn(),
    MockIconButton: vi.fn()
}));

// Mock store
vi.mock('../../../../src/core/Store.js', () => ({
    store: {
        dispatch: mockDispatch,
        getState: mockGetState
    }
}));

// Mock Section component
vi.mock('../../../../src/ui/components/Section.js', () => ({
    Section: MockSection
}));

// Mock NumberInput
vi.mock('../../../../src/ui/components/NumberInput.js', () => ({
    NumberInput: MockNumberInput
}));

// Mock IconButton
vi.mock('../../../../src/ui/components/IconButton.js', () => ({
    IconButton: MockIconButton
}));

// Mock Icons
vi.mock('../../../../src/ui/Icons.js', () => ({
    Icons: {
        ALIGN_LEFT: '<svg>left</svg>',
        ALIGN_CENTER: '<svg>center</svg>',
        ALIGN_RIGHT: '<svg>right</svg>',
        ALIGN_TOP: '<svg>top</svg>',
        ALIGN_MIDDLE: '<svg>middle</svg>',
        ALIGN_BOTTOM: '<svg>bottom</svg>',
        ROTATE_CCW: '<svg>rotate</svg>',
        FLIP_H: '<svg>fliph</svg>',
        FLIP_V: '<svg>flipv</svg>',
        DISTRIBUTE_H: '<svg>distribute-h</svg>',
        DISTRIBUTE_V: '<svg>distribute-v</svg>'
    }
}));

import { PositionSection } from '../../../../src/ui/properties/PositionSection.js';

describe('PositionSection', () => {
    let positionSection;
    let mockSectionElement;
    let mockXInputElement;
    let mockYInputElement;
    let mockRotationInputElement;

    beforeEach(() => {
        vi.clearAllMocks();
        
        // Reset mock state
        mockGetState.mockReturnValue({
            editor: {
                mode: 'edit',
                activeSlideId: 'slide-1',
                selectedElementIds: ['element-1']
            },
            slides: {
                'slide-1': {
                    id: 'slide-1',
                    elements: {
                        'element-1': { id: 'element-1', x: 100, y: 200, rotation: 45 }
                    }
                }
            },
            slideMasterPresets: {}
        });
        
        // Set up mock elements
        mockSectionElement = document.createElement('div');
        mockXInputElement = document.createElement('div');
        mockYInputElement = document.createElement('div');
        mockRotationInputElement = document.createElement('div');
        
        // Set up Section mock
        MockSection.mockImplementation(({ title }) => {
            const appendChild = vi.fn();
            return {
                element: mockSectionElement,
                appendChild,
                title
            };
        });
        
        // Set up NumberInput mock
        let callCount = 0;
        MockNumberInput.mockImplementation(({ label, value, onChange }) => {
            const elements = [mockXInputElement, mockYInputElement, mockRotationInputElement];
            const el = elements[callCount++] || document.createElement('div');
            return {
                element: el,
                setValue: vi.fn(),
                value,
                onChange,
                label
            };
        });
        
        // Set up IconButton mock
        MockIconButton.mockImplementation(({ icon, title, onClick }) => {
            const el = document.createElement('button');
            el.onclick = onClick;
            return {
                element: el,
                title,
                setDisabled: vi.fn((disabled) => {
                    el.disabled = disabled;
                })
            };
        });
        
        positionSection = new PositionSection();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('constructor', () => {
        it('should create an instance', () => {
            expect(positionSection).toBeDefined();
        });

        it('should create a Section with title Position', () => {
            expect(MockSection).toHaveBeenCalledWith({ title: 'Position' });
        });

        it('should have a section property', () => {
            expect(positionSection.section).toBeDefined();
        });
    });

    describe('createContent()', () => {
        it('should create X input', () => {
            expect(positionSection.xInput).toBeDefined();
        });

        it('should create Y input', () => {
            expect(positionSection.yInput).toBeDefined();
        });

        it('should create rotation input', () => {
            expect(positionSection.rotationInput).toBeDefined();
        });

        it('should create 6 alignment buttons', () => {
            // 6 alignment buttons + 2 distribute buttons + 3 transform buttons = 11 IconButton calls
            expect(MockIconButton).toHaveBeenCalledTimes(11);
        });
    });

    describe('update()', () => {
        it('should hide section when selection is empty', () => {
            positionSection.update([]);
            
            expect(mockSectionElement.classList.contains('hidden')).toBe(true);
        });

        it('should hide section when selection is null', () => {
            positionSection.update(null);
            
            expect(mockSectionElement.classList.contains('hidden')).toBe(true);
        });

        it('should show section when selection has elements', () => {
            positionSection.update(['element-1']);
            
            expect(mockSectionElement.classList.contains('hidden')).toBe(false);
        });

        it('should update X input with element x value', () => {
            positionSection.update(['element-1']);
            
            expect(positionSection.xInput.setValue).toHaveBeenCalledWith(100, false);
        });

        it('should update Y input with element y value', () => {
            positionSection.update(['element-1']);
            
            expect(positionSection.yInput.setValue).toHaveBeenCalledWith(200, false);
        });

        it('should update rotation input with element rotation', () => {
            positionSection.update(['element-1']);
            
            expect(positionSection.rotationInput.setValue).toHaveBeenCalledWith(45, false);
        });

        it('should default rotation to 0 when not set', () => {
            mockGetState.mockReturnValue({
                editor: {
                    mode: 'edit',
                    activeSlideId: 'slide-1',
                    selectedElementIds: ['element-1']
                },
                slides: {
                    'slide-1': {
                        elements: {
                            'element-1': { id: 'element-1', x: 50, y: 50 }
                        }
                    }
                }
            });
            
            positionSection.update(['element-1']);
            
            expect(positionSection.rotationInput.setValue).toHaveBeenCalledWith(0, false);
        });
    });

    describe('getElement()', () => {
        it('should get element from slide in edit mode', () => {
            const state = mockGetState();
            const element = positionSection.getElement(state, 'element-1');
            
            expect(element).toEqual({ id: 'element-1', x: 100, y: 200, rotation: 45 });
        });

        it('should get element from master in master mode', () => {
            mockGetState.mockReturnValue({
                editor: {
                    mode: 'master',
                    activeMasterId: 'master-1'
                },
                slides: {},
                slideMasterPresets: {
                    'master-1': {
                        id: 'master-1',
                        elements: {
                            'element-m1': { id: 'element-m1', x: 300, y: 400 }
                        }
                    }
                }
            });
            
            const state = mockGetState();
            const element = positionSection.getElement(state, 'element-m1');
            
            expect(element).toEqual({ id: 'element-m1', x: 300, y: 400 });
        });

        it('should return undefined for non-existent element', () => {
            const state = mockGetState();
            const element = positionSection.getElement(state, 'non-existent');
            
            expect(element).toBeUndefined();
        });
    });

    describe('updateProperty()', () => {
        it('should dispatch UPDATE_ELEMENT for each selected element', () => {
            mockGetState.mockReturnValue({
                editor: {
                    selectedElementIds: ['el-1', 'el-2']
                }
            });
            
            positionSection.updateProperty('x', 150, false);
            
            expect(mockDispatch).toHaveBeenCalledTimes(2);
            expect(mockDispatch).toHaveBeenCalledWith('UPDATE_ELEMENT', { id: 'el-1', x: 150 }, { skipHistory: false });
            expect(mockDispatch).toHaveBeenCalledWith('UPDATE_ELEMENT', { id: 'el-2', x: 150 }, { skipHistory: false });
        });

        it('should skip history for transient updates', () => {
            mockGetState.mockReturnValue({
                editor: {
                    selectedElementIds: ['el-1']
                }
            });
            
            positionSection.updateProperty('y', 200, true);
            
            expect(mockDispatch).toHaveBeenCalledWith('UPDATE_ELEMENT', { id: 'el-1', y: 200 }, { skipHistory: true });
        });
    });

    describe('handleAlign()', () => {
        it('should dispatch ALIGN_ELEMENTS with action', () => {
            positionSection.handleAlign('left');
            
            expect(mockDispatch).toHaveBeenCalledWith('ALIGN_ELEMENTS', 'left');
        });

        it('should dispatch for center alignment', () => {
            positionSection.handleAlign('center');
            
            expect(mockDispatch).toHaveBeenCalledWith('ALIGN_ELEMENTS', 'center');
        });

        it('should dispatch for top alignment', () => {
            positionSection.handleAlign('top');
            
            expect(mockDispatch).toHaveBeenCalledWith('ALIGN_ELEMENTS', 'top');
        });
    });

    describe('handleRotateStep()', () => {
        it('should add rotation to current rotation', () => {
            mockGetState.mockReturnValue({
                editor: {
                    mode: 'edit',
                    activeSlideId: 'slide-1',
                    selectedElementIds: ['element-1']
                },
                slides: {
                    'slide-1': {
                        elements: {
                            'element-1': { id: 'element-1', rotation: 45 }
                        }
                    }
                }
            });
            
            positionSection.handleRotateStep(-90);
            
            expect(mockDispatch).toHaveBeenCalledWith('UPDATE_ELEMENT', { id: 'element-1', rotation: -45 });
        });

        it('should handle element with no rotation', () => {
            mockGetState.mockReturnValue({
                editor: {
                    mode: 'edit',
                    activeSlideId: 'slide-1',
                    selectedElementIds: ['element-1']
                },
                slides: {
                    'slide-1': {
                        elements: {
                            'element-1': { id: 'element-1' }
                        }
                    }
                }
            });
            
            positionSection.handleRotateStep(90);
            
            expect(mockDispatch).toHaveBeenCalledWith('UPDATE_ELEMENT', { id: 'element-1', rotation: 90 });
        });
    });

    describe('handleFlip()', () => {
        it('should handle horizontal flip', () => {
            // Currently just logs, but we can verify it doesn't throw
            expect(() => positionSection.handleFlip('horizontal')).not.toThrow();
        });

        it('should handle vertical flip', () => {
            expect(() => positionSection.handleFlip('vertical')).not.toThrow();
        });
    });

    describe('distribute controls', () => {
        describe('UI creation', () => {
            it('should create distribute horizontal button', () => {
                // Check that IconButton was called with DISTRIBUTE_H
                const distributeHCall = MockIconButton.mock.calls.find(
                    call => call[0].title === 'Distribute Horizontally'
                );
                expect(distributeHCall).toBeDefined();
            });

            it('should create distribute vertical button', () => {
                const distributeVCall = MockIconButton.mock.calls.find(
                    call => call[0].title === 'Distribute Vertically'
                );
                expect(distributeVCall).toBeDefined();
            });

            it('should create 11 total IconButtons (6 align + 3 transform + 2 distribute)', () => {
                expect(MockIconButton).toHaveBeenCalledTimes(11);
            });
        });

        describe('handleDistribute()', () => {
            it('should dispatch DISTRIBUTE_ELEMENTS with horizontal direction', () => {
                positionSection.handleDistribute('horizontal');
                
                expect(mockDispatch).toHaveBeenCalledWith('DISTRIBUTE_ELEMENTS', 'horizontal');
            });

            it('should dispatch DISTRIBUTE_ELEMENTS with vertical direction', () => {
                positionSection.handleDistribute('vertical');
                
                expect(mockDispatch).toHaveBeenCalledWith('DISTRIBUTE_ELEMENTS', 'vertical');
            });
        });

        describe('button state', () => {
            it('should have distribute buttons defined', () => {
                expect(positionSection.distributeHBtn).toBeDefined();
                expect(positionSection.distributeVBtn).toBeDefined();
            });
        });

        describe('updateDistributeButtons()', () => {
            let distributeHElement;
            let distributeVElement;

            beforeEach(() => {
                // Create fresh instance with trackable distribute button elements
                vi.clearAllMocks();
                
                distributeHElement = document.createElement('button');
                distributeVElement = document.createElement('button');
                
                let iconButtonCallCount = 0;
                MockIconButton.mockImplementation(({ icon, title, onClick }) => {
                    const el = document.createElement('button');
                    el.onclick = onClick;
                    
                    // Track distribute buttons specifically
                    if (title === 'Distribute Horizontally') {
                        distributeHElement = el;
                    } else if (title === 'Distribute Vertically') {
                        distributeVElement = el;
                    }
                    
                    return {
                        element: el,
                        title,
                        setDisabled: vi.fn((disabled) => {
                            el.disabled = disabled;
                        })
                    };
                });
                
                positionSection = new PositionSection();
            });

            it('should disable distribute buttons when less than 3 elements selected', () => {
                positionSection.updateDistributeButtons(['el-1', 'el-2']);
                
                expect(positionSection.distributeHBtn.setDisabled).toHaveBeenCalledWith(true);
                expect(positionSection.distributeVBtn.setDisabled).toHaveBeenCalledWith(true);
            });

            it('should enable distribute buttons when 3 or more elements selected', () => {
                positionSection.updateDistributeButtons(['el-1', 'el-2', 'el-3']);
                
                expect(positionSection.distributeHBtn.setDisabled).toHaveBeenCalledWith(false);
                expect(positionSection.distributeVBtn.setDisabled).toHaveBeenCalledWith(false);
            });

            it('should disable distribute buttons when selection is empty', () => {
                positionSection.updateDistributeButtons([]);
                
                expect(positionSection.distributeHBtn.setDisabled).toHaveBeenCalledWith(true);
                expect(positionSection.distributeVBtn.setDisabled).toHaveBeenCalledWith(true);
            });

            it('should disable distribute buttons when selection is null', () => {
                positionSection.updateDistributeButtons(null);
                
                expect(positionSection.distributeHBtn.setDisabled).toHaveBeenCalledWith(true);
                expect(positionSection.distributeVBtn.setDisabled).toHaveBeenCalledWith(true);
            });

            it('should enable distribute buttons with exactly 3 elements', () => {
                positionSection.updateDistributeButtons(['el-1', 'el-2', 'el-3']);
                
                expect(positionSection.distributeHBtn.setDisabled).toHaveBeenCalledWith(false);
            });

            it('should enable distribute buttons with more than 3 elements', () => {
                positionSection.updateDistributeButtons(['el-1', 'el-2', 'el-3', 'el-4', 'el-5']);
                
                expect(positionSection.distributeHBtn.setDisabled).toHaveBeenCalledWith(false);
                expect(positionSection.distributeVBtn.setDisabled).toHaveBeenCalledWith(false);
            });
        });

        describe('update() integration', () => {
            beforeEach(() => {
                vi.clearAllMocks();
                
                MockIconButton.mockImplementation(({ icon, title, onClick }) => {
                    const el = document.createElement('button');
                    el.onclick = onClick;
                    return {
                        element: el,
                        title,
                        setDisabled: vi.fn((disabled) => {
                            el.disabled = disabled;
                        })
                    };
                });
                
                positionSection = new PositionSection();
            });

            it('should call updateDistributeButtons when update() is called', () => {
                const spy = vi.spyOn(positionSection, 'updateDistributeButtons');
                
                positionSection.update(['el-1', 'el-2', 'el-3']);
                
                expect(spy).toHaveBeenCalledWith(['el-1', 'el-2', 'el-3']);
            });

            it('should enable distribute buttons during update with 3+ elements', () => {
                mockGetState.mockReturnValue({
                    editor: {
                        mode: 'edit',
                        activeSlideId: 'slide-1',
                        selectedElementIds: ['el-1', 'el-2', 'el-3']
                    },
                    slides: {
                        'slide-1': {
                            elements: {
                                'el-1': { id: 'el-1', x: 0, y: 0 },
                                'el-2': { id: 'el-2', x: 100, y: 0 },
                                'el-3': { id: 'el-3', x: 200, y: 0 }
                            }
                        }
                    }
                });
                
                positionSection.update(['el-1', 'el-2', 'el-3']);
                
                expect(positionSection.distributeHBtn.setDisabled).toHaveBeenCalledWith(false);
                expect(positionSection.distributeVBtn.setDisabled).toHaveBeenCalledWith(false);
            });
        });
    });
});
