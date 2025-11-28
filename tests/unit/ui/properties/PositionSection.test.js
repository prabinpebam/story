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
        masters: {}
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
        FLIP_V: '<svg>flipv</svg>'
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
            masters: {}
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
                title
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
            // 6 alignment buttons + 3 transform buttons = 9 IconButton calls
            expect(MockIconButton).toHaveBeenCalledTimes(9);
        });
    });

    describe('update()', () => {
        it('should hide section when selection is empty', () => {
            positionSection.update([]);
            
            expect(mockSectionElement.style.display).toBe('none');
        });

        it('should hide section when selection is null', () => {
            positionSection.update(null);
            
            expect(mockSectionElement.style.display).toBe('none');
        });

        it('should show section when selection has elements', () => {
            positionSection.update(['element-1']);
            
            expect(mockSectionElement.style.display).toBe('block');
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
                masters: {
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
});
