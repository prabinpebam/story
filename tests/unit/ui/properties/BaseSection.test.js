import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseSection } from '../../../../src/ui/properties/BaseSection.js';

// Mocks
const { mockDispatch, mockGetState, MockSection } = vi.hoisted(() => ({
    mockDispatch: vi.fn(),
    mockGetState: vi.fn(),
    MockSection: vi.fn()
}));

vi.mock('../../../../src/core/Store.js', () => ({
    store: {
        dispatch: mockDispatch,
        getState: mockGetState
    }
}));

vi.mock('../../../../src/ui/components/Section.js', () => ({
    Section: MockSection
}));

// Concrete implementation for testing
class TestSection extends BaseSection {
    constructor(config) {
        super(config);
    }
    createContent() { return true; }
    update(selection) {
        super.update(selection);
    }
}

describe('BaseSection', () => {
    let section;
    let mockElement;

    beforeEach(() => {
        vi.clearAllMocks();
        
        mockElement = document.createElement('div');
        MockSection.mockImplementation(() => ({
            element: mockElement,
            appendChild: vi.fn()
        }));

        // Default state
        mockGetState.mockReturnValue({
            editor: {
                mode: 'edit',
                activeSlideId: 'slide-1',
                activeMasterId: 'master-1'
            },
            slides: {
                'slide-1': {
                    elements: {
                        'el-1': { id: 'el-1', x: 10 },
                        'el-2': { id: 'el-2', x: 20 }
                    }
                }
            },
            slideMasterPresets: {
                'master-1': {
                    elements: {
                        'el-master': { id: 'el-master', x: 50 }
                    }
                }
            }
        });

        section = new TestSection({ title: 'Test' });
    });

    it('should initialize with Section component', () => {
        expect(MockSection).toHaveBeenCalledWith({ title: 'Test' });
        expect(section.element).toBe(mockElement);
    });

    describe('getElement()', () => {
        it('should resolve element in slide mode', () => {
            const el = section.getElement(mockGetState(), 'el-1');
            expect(el).toEqual({ id: 'el-1', x: 10 });
        });

        it('should resolve element in master mode', () => {
            mockGetState.mockReturnValue({
                ...mockGetState(),
                editor: { mode: 'master', activeMasterId: 'master-1' }
            });
            const el = section.getElement(mockGetState(), 'el-master');
            expect(el).toEqual({ id: 'el-master', x: 50 });
        });

        it('should return undefined if element not found', () => {
            const el = section.getElement(mockGetState(), 'non-existent');
            expect(el).toBeUndefined();
        });
    });

    describe('updateProperty()', () => {
        it('should dispatch UPDATE_ELEMENT for single selection', () => {
            section.selection = ['el-1'];
            section.updateProperty('x', 100);
            
            expect(mockDispatch).toHaveBeenCalledWith(
                'UPDATE_ELEMENT',
                { id: 'el-1', x: 100 },
                { skipHistory: false }
            );
        });

        it('should dispatch UPDATE_ELEMENT for multiple selection', () => {
            section.selection = ['el-1', 'el-2'];
            section.updateProperty('opacity', 0.5, true);
            
            expect(mockDispatch).toHaveBeenCalledTimes(2);
            expect(mockDispatch).toHaveBeenCalledWith(
                'UPDATE_ELEMENT',
                { id: 'el-1', opacity: 0.5 },
                { skipHistory: true }
            );
            expect(mockDispatch).toHaveBeenCalledWith(
                'UPDATE_ELEMENT',
                { id: 'el-2', opacity: 0.5 },
                { skipHistory: true }
            );
        });

        it('should do nothing if no selection', () => {
            section.selection = [];
            section.updateProperty('x', 100);
            expect(mockDispatch).not.toHaveBeenCalled();
        });
    });

    describe('update()', () => {
        it('should hide section when selection is empty', () => {
            section.update([]);
            expect(mockElement.classList.contains('hidden')).toBe(true); // Mock element is real DOM node in this test setup? No, it's from document.createElement
            // Wait, document.createElement creates a real DOM node in jsdom environment.
            // So classList works.
            expect(mockElement.className).toContain('hidden');
        });

        it('should show section when selection exists', () => {
            section.update(['el-1']);
            expect(mockElement.className).not.toContain('hidden');
        });

        it('should update internal selection state', () => {
            section.update(['el-1', 'el-2']);
            expect(section.selection).toEqual(['el-1', 'el-2']);
        });
    });

    describe('getSelectedElements()', () => {
        it('should return array of element objects', () => {
            section.selection = ['el-1', 'el-2'];
            const elements = section.getSelectedElements();
            expect(elements).toHaveLength(2);
            expect(elements[0].id).toBe('el-1');
            expect(elements[1].id).toBe('el-2');
        });
    });
});
