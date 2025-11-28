import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted() for mock functions
const { 
    mockOn, mockOff, mockDispatch, mockGetState,
    mockGetPresetsByCategory, mockSearchPresets,
    MockSegmentedControl, MockDropdown, MockColorInput
} = vi.hoisted(() => ({
    mockOn: vi.fn(),
    mockOff: vi.fn(),
    mockDispatch: vi.fn(),
    mockGetState: vi.fn(() => ({
        editor: { activeSlideId: 'slide-1' },
        slides: {
            'slide-1': { id: 'slide-1', layoutId: 'layout-1' }
        },
        masters: {
            'theme-1': {
                id: 'theme-1',
                type: 'theme',
                themeSettings: {
                    colors: {
                        background1: '#ffffff',
                        background2: '#f5f5f5',
                        text1: '#000000',
                        text2: '#666666',
                        accent1: '#0066cc',
                        accent2: '#00cc66',
                        accent3: '#cc6600',
                        accent4: '#6600cc',
                        accent5: '#cc0066',
                        accent6: '#66cc00',
                        hyperlink: '#0066cc',
                        followedHyperlink: '#666699'
                    }
                }
            },
            'layout-1': {
                id: 'layout-1',
                type: 'layout',
                parentId: 'theme-1'
            }
        }
    })),
    mockGetPresetsByCategory: vi.fn(() => [
        {
            id: 'preset-1',
            name: 'Corporate Blue',
            category: 'professional',
            colors: {
                background1: '#ffffff',
                text1: '#333333',
                accent1: '#0066cc',
                accent2: '#00cc66',
                accent3: '#cc6600',
                accent4: '#6600cc'
            }
        },
        {
            id: 'preset-2',
            name: 'Nature Green',
            category: 'nature',
            colors: {
                background1: '#f0f8f0',
                text1: '#2d5d2d',
                accent1: '#228b22',
                accent2: '#32cd32',
                accent3: '#6b8e23',
                accent4: '#556b2f'
            }
        }
    ]),
    mockSearchPresets: vi.fn(),
    MockSegmentedControl: vi.fn(),
    MockDropdown: vi.fn(),
    MockColorInput: vi.fn()
}));

// Mock store
vi.mock('../../../src/core/Store.js', () => ({
    store: {
        on: mockOn,
        off: mockOff,
        dispatch: mockDispatch,
        getState: mockGetState
    }
}));

// Mock color presets
vi.mock('../../../src/core/constants/ColorPresets.js', () => ({
    COLOR_PRESETS: {},
    COLOR_CATEGORIES: [
        { id: 'all', name: 'All' },
        { id: 'professional', name: 'Professional' },
        { id: 'nature', name: 'Nature' }
    ],
    getPresetsByCategory: mockGetPresetsByCategory,
    searchPresets: mockSearchPresets
}));

// Mock DraggablePanel
vi.mock('../../../src/ui/components/DraggablePanel.js', () => ({
    DraggablePanel: class MockDraggablePanel {
        constructor(options) {
            this.options = options;
            this.element = document.createElement('div');
            this.element.id = options.id;
            this.contentElement = document.createElement('div');
            this.contentElement.className = 'panel-content';
            this.element.appendChild(this.contentElement);
            document.body.appendChild(this.element);
        }
    }
}));

// Mock SegmentedControl
vi.mock('../../../src/ui/components/SegmentedControl.js', () => ({
    SegmentedControl: MockSegmentedControl
}));

// Mock Dropdown
vi.mock('../../../src/ui/components/Dropdown.js', () => ({
    Dropdown: MockDropdown
}));

// Mock ColorInput
vi.mock('../../../src/ui/components/ColorInput.js', () => ({
    ColorInput: MockColorInput
}));

import { ColorThemeManager } from '../../../src/ui/panels/ColorThemeManager.js';

describe('ColorThemeManager', () => {
    let manager;

    beforeEach(() => {
        vi.clearAllMocks();
        
        // Set up mock implementations for component mocks
        MockSegmentedControl.mockImplementation(({ options, value, onChange }) => ({
            element: document.createElement('div'),
            options,
            value,
            onChange
        }));
        
        MockDropdown.mockImplementation(({ options, value, onChange }) => ({
            element: document.createElement('div'),
            options,
            value,
            onChange
        }));
        
        MockColorInput.mockImplementation((value, onChange, options) => ({
            element: document.createElement('div'),
            value,
            onChange,
            setValue: vi.fn()
        }));
        
        // Reset mock implementations
        mockGetState.mockReturnValue({
            editor: { activeSlideId: 'slide-1' },
            slides: {
                'slide-1': { id: 'slide-1', layoutId: 'layout-1' }
            },
            masters: {
                'theme-1': {
                    id: 'theme-1',
                    type: 'theme',
                    themeSettings: {
                        colors: {
                            background1: '#ffffff',
                            text1: '#000000',
                            accent1: '#0066cc'
                        }
                    }
                },
                'layout-1': {
                    id: 'layout-1',
                    type: 'layout',
                    parentId: 'theme-1'
                }
            }
        });
        
        mockGetPresetsByCategory.mockReturnValue([
            {
                id: 'preset-1',
                name: 'Corporate Blue',
                category: 'professional',
                colors: {
                    background1: '#ffffff',
                    text1: '#333333',
                    accent1: '#0066cc',
                    accent2: '#00cc66',
                    accent3: '#cc6600',
                    accent4: '#6600cc'
                }
            }
        ]);
        
        manager = new ColorThemeManager();
    });

    afterEach(() => {
        // Cleanup
        if (manager.element && manager.element.parentNode) {
            manager.element.parentNode.removeChild(manager.element);
        }
        vi.restoreAllMocks();
    });

    describe('constructor', () => {
        it('should create an instance', () => {
            expect(manager).toBeDefined();
            expect(manager instanceof ColorThemeManager).toBe(true);
        });

        it('should set default active tab to presets', () => {
            expect(manager.activeTab).toBe('presets');
        });

        it('should initialize selectedPreset as null', () => {
            expect(manager.selectedPreset).toBeNull();
        });

        it('should initialize currentCategory as all', () => {
            expect(manager.currentCategory).toBe('all');
        });

        it('should initialize searchQuery as empty', () => {
            expect(manager.searchQuery).toBe('');
        });
    });

    describe('buildUI()', () => {
        it('should create tab control', () => {
            expect(manager.tabControl).toBeDefined();
        });

        it('should create presets content container', () => {
            expect(manager.presetsContent).toBeDefined();
        });

        it('should create custom content container', () => {
            expect(manager.customContent).toBeDefined();
        });

        it('should create AI content container', () => {
            expect(manager.aiContent).toBeDefined();
        });

        it('should create footer element', () => {
            expect(manager.footerElement).toBeDefined();
        });
    });

    describe('createPresetsTab()', () => {
        it('should create preset grid', () => {
            expect(manager.presetGrid).toBeDefined();
        });

        it('should create category dropdown', () => {
            expect(manager.categoryDropdown).toBeDefined();
        });

        it('should have search input', () => {
            const searchInput = manager.presetsContent.querySelector('.ctm-search');
            expect(searchInput).toBeDefined();
        });
    });

    describe('renderPresetGrid()', () => {
        it('should render preset cards', () => {
            const cards = manager.presetGrid.querySelectorAll('.ctm-preset-card');
            expect(cards.length).toBeGreaterThan(0);
        });

        it('should display empty state when no presets', () => {
            mockGetPresetsByCategory.mockReturnValue([]);
            manager.renderPresetGrid();
            
            const emptyState = manager.presetGrid.querySelector('.panel-empty-state');
            expect(emptyState).toBeDefined();
        });

        it('should filter by search query', () => {
            mockGetPresetsByCategory.mockReturnValue([
                { id: '1', name: 'Blue Theme', category: 'cool', colors: {} },
                { id: '2', name: 'Red Theme', category: 'warm', colors: {} }
            ]);
            
            manager.searchQuery = 'blue';
            manager.renderPresetGrid();
            
            const cards = manager.presetGrid.querySelectorAll('.ctm-preset-card');
            expect(cards.length).toBe(1);
        });
    });

    describe('createPresetCard()', () => {
        const mockPreset = {
            id: 'test-preset',
            name: 'Test Theme',
            colors: {
                background1: '#ffffff',
                text1: '#000000',
                accent1: '#ff0000',
                accent2: '#00ff00',
                accent3: '#0000ff',
                accent4: '#ffff00'
            }
        };

        it('should create card element', () => {
            const card = manager.createPresetCard(mockPreset);
            
            expect(card.className).toContain('preset-card');
            expect(card.className).toContain('ctm-preset-card');
        });

        it('should store preset id in dataset', () => {
            const card = manager.createPresetCard(mockPreset);
            
            expect(card.dataset.presetId).toBe('test-preset');
        });

        it('should display preset name', () => {
            const card = manager.createPresetCard(mockPreset);
            const name = card.querySelector('.preset-name');
            
            expect(name.textContent).toBe('Test Theme');
        });

        it('should display color swatches', () => {
            const card = manager.createPresetCard(mockPreset);
            const swatches = card.querySelectorAll('.preset-swatch');
            
            expect(swatches.length).toBe(6);
        });
    });

    describe('selectPreset()', () => {
        const mockPreset = {
            id: 'preset-1',
            name: 'Test',
            colors: { background1: '#fff', accent1: '#000' }
        };

        it('should set selectedPreset', () => {
            const card = document.createElement('div');
            card.dataset.presetId = 'preset-1';
            manager.presetGrid.appendChild(card);
            
            manager.selectPreset(mockPreset, card);
            
            expect(manager.selectedPreset).toBe(mockPreset);
        });

        it('should add selected class to card', () => {
            const card = document.createElement('div');
            card.className = 'ctm-preset-card';
            card.dataset.presetId = 'preset-1';
            manager.presetGrid.appendChild(card);
            
            manager.selectPreset(mockPreset, card);
            
            expect(card.classList.contains('selected')).toBe(true);
        });
    });

    describe('applyPreset()', () => {
        const mockPreset = {
            id: 'preset-1',
            name: 'Test',
            colors: { background1: '#fff' }
        };

        it('should dispatch APPLY_COLOR_PRESET action', () => {
            manager.applyPreset(mockPreset);
            
            expect(mockDispatch).toHaveBeenCalledWith('APPLY_COLOR_PRESET', {
                masterId: 'theme-1',
                preset: mockPreset
            });
        });

        it('should clear originalColors after applying', () => {
            manager.originalColors = { background1: '#000' };
            manager.applyPreset(mockPreset);
            
            expect(manager.originalColors).toBeNull();
        });
    });

    describe('switchTab()', () => {
        it('should update activeTab', () => {
            manager.switchTab('custom');
            
            expect(manager.activeTab).toBe('custom');
        });

        it('should show presets tab content', () => {
            manager.switchTab('presets');
            
            expect(manager.presetsContent.style.display).toBe('flex');
            expect(manager.customContent.style.display).toBe('none');
            expect(manager.aiContent.style.display).toBe('none');
        });

        it('should show custom tab content', () => {
            manager.switchTab('custom');
            
            expect(manager.presetsContent.style.display).toBe('none');
            expect(manager.customContent.style.display).toBe('flex');
            expect(manager.aiContent.style.display).toBe('none');
        });

        it('should show AI tab content', () => {
            manager.switchTab('ai');
            
            expect(manager.presetsContent.style.display).toBe('none');
            expect(manager.customContent.style.display).toBe('none');
            expect(manager.aiContent.style.display).toBe('flex');
        });
    });

    describe('createCustomTab()', () => {
        it('should create color role rows', () => {
            const rows = manager.customContent.querySelectorAll('.ctm-color-row');
            expect(rows.length).toBeGreaterThan(0);
        });
    });

    describe('updateColor()', () => {
        it('should dispatch UPDATE_THEME_COLOR action', () => {
            manager.updateColor('accent1', '#ff0000');
            
            expect(mockDispatch).toHaveBeenCalledWith('UPDATE_THEME_COLOR', {
                masterId: 'theme-1',
                colorRole: 'accent1',
                value: '#ff0000'
            });
        });
    });

    describe('resetColors()', () => {
        it('should dispatch RESET_THEME_COLORS action', () => {
            manager.resetColors();
            
            expect(mockDispatch).toHaveBeenCalledWith('RESET_THEME_COLORS', {
                masterId: 'theme-1'
            });
        });

        it('should clear selectedPreset', () => {
            manager.selectedPreset = { id: 'test' };
            manager.resetColors();
            
            expect(manager.selectedPreset).toBeNull();
        });

        it('should clear originalColors', () => {
            manager.originalColors = { background1: '#000' };
            manager.resetColors();
            
            expect(manager.originalColors).toBeNull();
        });
    });

    describe('createFooter()', () => {
        it('should create reset button', () => {
            const resetBtn = manager.footerElement.querySelector('.panel-btn-secondary');
            expect(resetBtn).toBeDefined();
            expect(resetBtn.textContent).toBe('Reset');
        });

        it('should create apply button', () => {
            const applyBtn = manager.footerElement.querySelector('.panel-btn-primary');
            expect(applyBtn).toBeDefined();
            expect(applyBtn.textContent).toBe('Apply');
        });
    });

    describe('getActiveMasterId()', () => {
        it('should return theme master id', () => {
            const masterId = manager.getActiveMasterId(mockGetState());
            
            expect(masterId).toBe('theme-1');
        });

        it('should return null when no active slide', () => {
            mockGetState.mockReturnValue({
                editor: {},
                slides: {},
                masters: {}
            });
            
            const masterId = manager.getActiveMasterId(mockGetState());
            
            expect(masterId).toBeNull();
        });
    });

    describe('camelToKebab()', () => {
        it('should convert camelCase to kebab-case', () => {
            expect(manager.camelToKebab('backgroundColor')).toBe('background-color');
        });

        it('should handle multiple capitals', () => {
            expect(manager.camelToKebab('followedHyperlink')).toBe('followed-hyperlink');
        });

        it('should handle simple words', () => {
            expect(manager.camelToKebab('text')).toBe('text');
        });
    });

    describe('getCurrentColors()', () => {
        it('should return current theme colors', () => {
            const colors = manager.getCurrentColors();
            
            expect(colors).toBeDefined();
            expect(colors.background1).toBe('#ffffff');
        });

        it('should return empty object when no master', () => {
            mockGetState.mockReturnValue({
                editor: {},
                slides: {},
                masters: {}
            });
            
            const colors = manager.getCurrentColors();
            
            expect(colors).toEqual({});
        });
    });

    describe('getCurrentColorValue()', () => {
        it('should return color value for role', () => {
            const value = manager.getCurrentColorValue('accent1');
            
            expect(value).toBe('#0066cc');
        });

        it('should return default when role not found', () => {
            const value = manager.getCurrentColorValue('nonexistent');
            
            expect(value).toBe('#000000');
        });
    });

    describe('onOpen()', () => {
        it('should subscribe to state-changed', () => {
            manager.onOpen();
            
            expect(mockOn).toHaveBeenCalledWith('state-changed', expect.any(Function));
        });

        it('should render preset grid', () => {
            const renderSpy = vi.spyOn(manager, 'renderPresetGrid');
            
            manager.onOpen();
            
            expect(renderSpy).toHaveBeenCalled();
        });
    });

    describe('onClose()', () => {
        it('should cancel preview', () => {
            const cancelSpy = vi.spyOn(manager, 'cancelPreview');
            
            manager.onClose();
            
            expect(cancelSpy).toHaveBeenCalled();
        });

        it('should clear selectedPreset', () => {
            manager.selectedPreset = { id: 'test' };
            
            manager.onClose();
            
            expect(manager.selectedPreset).toBeNull();
        });

        it('should unsubscribe from state-changed', () => {
            manager.stateHandler = vi.fn();
            
            manager.onClose();
            
            expect(mockOff).toHaveBeenCalledWith('state-changed', manager.stateHandler);
        });
    });

    describe('createAITab()', () => {
        it('should show coming soon message', () => {
            const comingSoon = manager.aiContent.querySelector('.coming-soon-container');
            expect(comingSoon).toBeDefined();
        });

        it('should display AI theme generator text', () => {
            expect(manager.aiContent.textContent).toContain('AI Theme Generator');
        });
    });
});
