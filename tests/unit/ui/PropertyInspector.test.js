import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock all property section modules as simple objects with section.element
const createMockSection = () => ({
    section: { element: document.createElement('div') },
    update: vi.fn()
});

const createMockSlideSection = () => ({
    element: document.createElement('div'),
    fillSection: { section: { element: document.createElement('div') } },
    update: vi.fn()
});

vi.mock('../../../src/ui/properties/PositionSection.js', () => ({
    PositionSection: vi.fn(() => createMockSection())
}));

vi.mock('../../../src/ui/properties/LayoutSection.js', () => ({
    LayoutSection: vi.fn(() => createMockSection())
}));

vi.mock('../../../src/ui/properties/AppearanceSection.js', () => ({
    AppearanceSection: vi.fn(() => createMockSection())
}));

vi.mock('../../../src/ui/properties/FillSection.js', () => ({
    FillSection: vi.fn(() => createMockSection())
}));

vi.mock('../../../src/ui/properties/StrokeSection.js', () => ({
    StrokeSection: vi.fn(() => createMockSection())
}));

vi.mock('../../../src/ui/properties/EffectsSection.js', () => ({
    EffectsSection: vi.fn(() => createMockSection())
}));

vi.mock('../../../src/ui/properties/ExportSection.js', () => ({
    ExportSection: vi.fn(() => createMockSection())
}));

vi.mock('../../../src/ui/properties/SlideSection.js', () => ({
    SlideSection: vi.fn(() => createMockSlideSection())
}));

vi.mock('../../../src/ui/properties/TextSection.js', () => ({
    TextSection: vi.fn(() => createMockSection())
}));

vi.mock('../../../src/ui/properties/PlaceholderSection.js', () => ({
    PlaceholderSection: vi.fn(() => createMockSection())
}));

vi.mock('../../../src/ui/components/Knob.js', () => ({ Knob: vi.fn() }));
vi.mock('../../../src/ui/components/Switch.js', () => ({ Switch: vi.fn() }));
vi.mock('../../../src/ui/components/SegmentedControl.js', () => ({ SegmentedControl: vi.fn() }));
vi.mock('../../../src/ui/components/ScrubbableControl.js', () => ({ ScrubbableControl: vi.fn() }));
vi.mock('../../../src/ui/components/ColorInput.js', () => ({ ColorInput: vi.fn() }));
vi.mock('../../../src/core/ai/AIService.js', () => ({ aiService: {} }));

vi.mock('../../../src/core/Store.js', () => ({
    store: {
        getState: vi.fn(() => ({
            editor: {
                mode: 'edit',
                activeSlideId: 'slide-1',
                activeMasterId: null,
                selectedElementIds: []
            },
            slides: {
                'slide-1': {
                    id: 'slide-1',
                    elements: {},
                    elementOrder: []
                }
            },
            masters: {},
            ui: { isInteracting: false }
        })),
        dispatch: vi.fn(),
        on: vi.fn()
    }
}));

import { PropertyInspector } from '../../../src/ui/PropertyInspector.js';
import { store } from '../../../src/core/Store.js';
import { PositionSection } from '../../../src/ui/properties/PositionSection.js';
import { LayoutSection } from '../../../src/ui/properties/LayoutSection.js';
import { AppearanceSection } from '../../../src/ui/properties/AppearanceSection.js';
import { TextSection } from '../../../src/ui/properties/TextSection.js';
import { FillSection } from '../../../src/ui/properties/FillSection.js';
import { StrokeSection } from '../../../src/ui/properties/StrokeSection.js';
import { EffectsSection } from '../../../src/ui/properties/EffectsSection.js';
import { ExportSection } from '../../../src/ui/properties/ExportSection.js';
import { SlideSection } from '../../../src/ui/properties/SlideSection.js';
import { PlaceholderSection } from '../../../src/ui/properties/PlaceholderSection.js';

describe('PropertyInspector', () => {
    let propertyInspector;
    let mockContainer;
    let mockSidebar;
    let mockHeaderTitle;

    beforeEach(() => {
        vi.clearAllMocks();

        mockHeaderTitle = document.createElement('span');
        mockHeaderTitle.className = 'header-title';

        const mockHeader = document.createElement('div');
        mockHeader.className = 'sidebar-header';
        mockHeader.appendChild(mockHeaderTitle);

        mockContainer = document.createElement('div');
        mockContainer.id = 'property-inspector';

        mockSidebar = document.createElement('div');
        mockSidebar.className = 'sidebar';
        mockSidebar.appendChild(mockHeader);
        mockSidebar.appendChild(mockContainer);

        vi.spyOn(document, 'getElementById').mockReturnValue(mockContainer);
        vi.spyOn(mockContainer, 'closest').mockReturnValue(mockSidebar);

        store.getState.mockReturnValue({
            editor: {
                mode: 'edit',
                activeSlideId: 'slide-1',
                activeMasterId: null,
                selectedElementIds: []
            },
            slides: {
                'slide-1': {
                    id: 'slide-1',
                    elements: {},
                    elementOrder: []
                }
            },
            masters: {},
            ui: { isInteracting: false }
        });

        propertyInspector = new PropertyInspector('property-inspector');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with container reference', () => {
            expect(propertyInspector.container).toBe(mockContainer);
        });

        it('should initialize all section instances', () => {
            expect(PositionSection).toHaveBeenCalled();
            expect(LayoutSection).toHaveBeenCalled();
            expect(AppearanceSection).toHaveBeenCalled();
            expect(TextSection).toHaveBeenCalled();
            expect(FillSection).toHaveBeenCalled();
            expect(StrokeSection).toHaveBeenCalled();
            expect(EffectsSection).toHaveBeenCalled();
            expect(ExportSection).toHaveBeenCalled();
            expect(SlideSection).toHaveBeenCalled();
            expect(PlaceholderSection).toHaveBeenCalled();
        });

        it('should find header title element', () => {
            expect(propertyInspector.headerTitle).toBe(mockHeaderTitle);
        });
    });

    describe('init()', () => {
        it('should subscribe to state-changed event', () => {
            expect(store.on).toHaveBeenCalledWith('state-changed', expect.any(Function));
        });

        it('should subscribe to selection-changed event', () => {
            expect(store.on).toHaveBeenCalledWith('selection-changed', expect.any(Function));
        });

        it('should call render on initialization', () => {
            expect(mockContainer.classList.contains('property-inspector')).toBe(true);
        });
    });

    describe('render()', () => {
        it('should add property-inspector class to container', () => {
            propertyInspector.render();
            expect(mockContainer.classList.contains('property-inspector')).toBe(true);
        });

        it('should clear container before rendering', () => {
            mockContainer.innerHTML = '<div>Old content</div>';
            propertyInspector.render();
            expect(mockContainer.innerHTML).not.toContain('Old content');
        });

        it('should show slide section when no selection', () => {
            store.getState.mockReturnValue({
                editor: {
                    mode: 'edit',
                    activeSlideId: 'slide-1',
                    activeMasterId: null,
                    selectedElementIds: []
                },
                slides: { 'slide-1': { id: 'slide-1', elements: {} } },
                masters: {},
                ui: { isInteracting: false }
            });

            propertyInspector.render();

            expect(propertyInspector.slideSection.update).toHaveBeenCalledWith([]);
        });

        it('should show element sections when element is selected', () => {
            store.getState.mockReturnValue({
                editor: {
                    mode: 'edit',
                    activeSlideId: 'slide-1',
                    activeMasterId: null,
                    selectedElementIds: ['el-1']
                },
                slides: {
                    'slide-1': {
                        id: 'slide-1',
                        elements: {
                            'el-1': { id: 'el-1', type: 'rect' }
                        }
                    }
                },
                masters: {},
                ui: { isInteracting: false }
            });

            propertyInspector.render();

            expect(propertyInspector.positionSection.update).toHaveBeenCalledWith(['el-1']);
            expect(propertyInspector.layoutSection.update).toHaveBeenCalledWith(['el-1']);
            expect(propertyInspector.appearanceSection.update).toHaveBeenCalledWith(['el-1']);
        });

        it('should not re-render during interaction', () => {
            const stateChangedCallback = store.on.mock.calls.find(
                call => call[0] === 'state-changed'
            )[1];

            // Clear mocks after initial render
            propertyInspector.positionSection.update.mockClear();

            // Trigger state change during interaction
            stateChangedCallback({
                editor: { selectedElementIds: ['el-1'] },
                ui: { isInteracting: true }
            });

            // Should not call update
            expect(propertyInspector.positionSection.update).not.toHaveBeenCalled();
        });
    });

    describe('updateHeaderTitle()', () => {
        it('should show "Slide" when no selection in edit mode', () => {
            const state = {
                editor: {
                    mode: 'edit',
                    activeSlideId: 'slide-1',
                    activeMasterId: null,
                    selectedElementIds: []
                },
                slides: { 'slide-1': { id: 'slide-1' } },
                masters: {}
            };

            propertyInspector.updateHeaderTitle(state, []);

            expect(mockHeaderTitle.textContent).toBe('Slide');
        });

        it('should show master name in master mode', () => {
            const state = {
                editor: {
                    mode: 'master',
                    activeSlideId: 'slide-1',
                    activeMasterId: 'master-1',
                    selectedElementIds: []
                },
                slides: {},
                masters: {
                    'master-1': { id: 'master-1', name: 'Title Slide' }
                }
            };

            propertyInspector.updateHeaderTitle(state, []);

            expect(mockHeaderTitle.textContent).toBe('Title Slide');
        });

        it('should show count for multiple selection', () => {
            const state = {
                editor: {
                    mode: 'edit',
                    activeSlideId: 'slide-1',
                    activeMasterId: null,
                    selectedElementIds: ['el-1', 'el-2', 'el-3']
                },
                slides: {
                    'slide-1': {
                        id: 'slide-1',
                        elements: {
                            'el-1': { id: 'el-1', type: 'rectangle' },
                            'el-2': { id: 'el-2', type: 'ellipse' },
                            'el-3': { id: 'el-3', type: 'text' }
                        }
                    }
                },
                masters: {}
            };

            propertyInspector.updateHeaderTitle(state, ['el-1', 'el-2', 'el-3']);

            expect(mockHeaderTitle.textContent).toBe('3 Objects');
        });
    });

    describe('getElement()', () => {
        it('should get element from slide in edit mode', () => {
            const state = {
                editor: {
                    mode: 'edit',
                    activeSlideId: 'slide-1',
                    activeMasterId: null
                },
                slides: {
                    'slide-1': {
                        id: 'slide-1',
                        elements: {
                            'el-1': { id: 'el-1', type: 'rect' }
                        }
                    }
                },
                masters: {}
            };

            const element = propertyInspector.getElement(state, 'el-1');

            expect(element).toEqual({ id: 'el-1', type: 'rect' });
        });

        it('should get element from master in master mode', () => {
            const state = {
                editor: {
                    mode: 'master',
                    activeSlideId: 'slide-1',
                    activeMasterId: 'master-1'
                },
                slides: {},
                masters: {
                    'master-1': {
                        id: 'master-1',
                        elements: {
                            'ph-1': { id: 'ph-1', type: 'placeholder' }
                        }
                    }
                }
            };

            const element = propertyInspector.getElement(state, 'ph-1');

            expect(element).toEqual({ id: 'ph-1', type: 'placeholder' });
        });

        it('should return undefined for non-existent element', () => {
            const state = {
                editor: {
                    mode: 'edit',
                    activeSlideId: 'slide-1',
                    activeMasterId: null
                },
                slides: {
                    'slide-1': {
                        id: 'slide-1',
                        elements: {}
                    }
                },
                masters: {}
            };

            const element = propertyInspector.getElement(state, 'non-existent');

            expect(element).toBeUndefined();
        });
    });

    describe('getTypeName()', () => {
        it('should return "Rectangle" for rectangle type', () => {
            expect(propertyInspector.getTypeName('rectangle')).toBe('Rectangle');
        });

        it('should return "Text" for text type', () => {
            expect(propertyInspector.getTypeName('text')).toBe('Text');
        });

        it('should return "Image" for image type', () => {
            expect(propertyInspector.getTypeName('image')).toBe('Image');
        });

        it('should return "Group" for group type', () => {
            expect(propertyInspector.getTypeName('group')).toBe('Group');
        });

        it('should return capitalized type for unknown type', () => {
            const result = propertyInspector.getTypeName('customElement');
            expect(result.charAt(0)).toBe(result.charAt(0).toUpperCase());
        });
    });
});
