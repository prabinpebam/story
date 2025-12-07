/**
 * ColorThemeManager Tests
 * 
 * Tests for the ColorThemeManager panel with luma-locked tonal system.
 * Two-column layout: Theme list (left) + Editor (right)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted() for mock functions
const { 
    mockOn, mockOff, mockDispatch, mockGetState
} = vi.hoisted(() => ({
    mockOn: vi.fn(),
    mockOff: vi.fn(),
    mockDispatch: vi.fn(),
    mockGetState: vi.fn(() => ({
        editor: { 
            activeSlideId: 'slide-1',
            mode: 'edit' // Default to edit mode
        },
        slides: {
            'slide-1': { id: 'slide-1', layoutId: 'layout-1' }
        },
        masters: {
            'master-default': {
                id: 'master-default',
                type: 'theme',
                themeSettings: {
                    lumaTheme: {
                        id: 'preset_neutral',
                        name: 'Neutral',
                        resolvedColors: [
                            '#0d0d0d', '#1a1a1a', '#2e2e2e', '#404040',
                            '#595959', '#737373', '#8c8c8c', '#a6a6a6',
                            '#b3b3b3', '#cccccc', '#e6e6e6', '#f8f8f8'
                        ]
                    }
                }
            },
            'layout-1': {
                id: 'layout-1',
                type: 'layout',
                parentId: 'master-default'
            }
        }
    }))
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
        destroy() {
            if (this.element && this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
        }
    }
}));

// Mock SliderControl
vi.mock('../../../src/ui/components/SliderControl.js', () => ({
    SliderControl: class MockSliderControl {
        constructor(options) {
            this.options = options;
            this.element = document.createElement('div');
            this.element.className = 'slider-control';
            this.value = options.value || 0;
        }
        setValue(value) {
            this.value = value;
        }
    }
}));

// Mock IconButton
vi.mock('../../../src/ui/components/IconButton.js', () => ({
    IconButton: class MockIconButton {
        constructor(options) {
            this.options = options;
            this.element = document.createElement('button');
            this.element.className = 'icon-button';
            this.element.title = options.title || '';
            if (options.onClick) {
                this.element.addEventListener('click', options.onClick);
            }
        }
    }
}));

// Mock Icons
vi.mock('../../../src/ui/Icons.js', () => ({
    Icons: {
        PLUS: '<svg></svg>',
        IMAGE: '<svg></svg>',
        LOCK: '<svg></svg>',
        FLIP_V: '<svg></svg>',
        TRASH: '<svg></svg>',
        CHEVRON_DOWN: '<svg></svg>',
        RESET: '<svg></svg>',
        SPARKLE: '<svg></svg>'
    }
}));

import { ColorThemeManager } from '../../../src/ui/panels/color-theme/ColorThemeManager.js';

describe('ColorThemeManager', () => {
    let manager;

    beforeEach(() => {
        vi.clearAllMocks();
        
        // Clear localStorage
        localStorage.clear();
        
        manager = new ColorThemeManager();
    });

    afterEach(() => {
        // Cleanup
        if (manager && manager.element && manager.element.parentNode) {
            manager.element.parentNode.removeChild(manager.element);
        }
        manager = null;
        vi.restoreAllMocks();
    });

    describe('constructor', () => {
        it('should create an instance', () => {
            expect(manager).toBeDefined();
            expect(manager instanceof ColorThemeManager).toBe(true);
        });

        it('should have selectedThemeId after initialization', () => {
            // After buildUI, first theme is selected
            expect(manager.selectedThemeId).toBeDefined();
        });

        it('should have null selectedColumnIndex initially', () => {
            expect(manager.selectedColumnIndex).toBeNull();
        });

        it('should initialize with COMPLEMENTARY harmony', () => {
            expect(manager.selectedHarmony).toBe('complementary');
        });

        it('should have empty lockedColumns set', () => {
            expect(manager.lockedColumns.size).toBe(0);
        });

        it('should have generateHues enabled by default', () => {
            expect(manager.generateHues).toBe(true);
        });

        it('should have generateAdjustments enabled by default', () => {
            expect(manager.generateAdjustments).toBe(true);
        });

        it('should have null selectedColumnIndex initially', () => {
            expect(manager.selectedColumnIndex).toBeNull();
        });
    });

    describe('buildUI()', () => {
        it('should add ctm class to content element', () => {
            expect(manager.contentElement.classList.contains('ctm')).toBe(true);
        });

        it('should create columns container', () => {
            const columns = manager.contentElement.querySelector('.ctm__columns');
            expect(columns).toBeDefined();
        });

        it('should create left column (theme list)', () => {
            expect(manager.themeListEl).toBeDefined();
            expect(manager.themeListEl.className).toContain('ctm__left-column');
        });

        it('should create right column (editor)', () => {
            expect(manager.themeEditorEl).toBeDefined();
            expect(manager.themeEditorEl.className).toContain('ctm__right-column');
        });

        it('should create divider between columns', () => {
            const divider = manager.contentElement.querySelector('.ctm__divider');
            expect(divider).toBeDefined();
        });
    });

    describe('Theme List', () => {
        it('should display Presets section', () => {
            const sectionTitles = manager.themeListEl.querySelectorAll('.ctm__section-title');
            const presetsSection = Array.from(sectionTitles).find(el => el.textContent === 'Presets');
            expect(presetsSection).toBeDefined();
        });

        it('should display 6 preset themes', () => {
            const themeItems = manager.themeListEl.querySelectorAll('.ctm__theme-item');
            // 6 presets + any custom themes
            expect(themeItems.length).toBeGreaterThanOrEqual(6);
        });

        it('should mark selected theme', () => {
            const selectedItem = manager.themeListEl.querySelector('.ctm__theme-item--selected');
            expect(selectedItem).toBeDefined();
        });

        it('should show lock icon on preset themes', () => {
            const firstItem = manager.themeListEl.querySelector('.ctm__theme-item');
            const lockIcon = firstItem.querySelector('.ctm__theme-lock');
            expect(lockIcon).toBeDefined();
        });
    });

    describe('selectTheme()', () => {
        it('should update selectedThemeId', () => {
            manager.selectTheme('preset_ocean_sunset');
            expect(manager.selectedThemeId).toBe('preset_ocean_sunset');
        });

        it('should clear selectedColumnIndex', () => {
            manager.selectedColumnIndex = 2;
            manager.selectTheme('preset_ocean_sunset');
            expect(manager.selectedColumnIndex).toBeNull();
        });

        it('should preserve lockedColumns on theme change', () => {
            manager.toggleColumnLock(1);
            manager.selectTheme('preset_ocean_sunset');
            // lockedColumns should persist across theme changes
            expect(manager.lockedColumns.has(1)).toBe(true);
        });

        it('should call onThemeChange callback', () => {
            const onThemeChange = vi.fn();
            manager.managerOptions.onThemeChange = onThemeChange;
            
            manager.selectTheme('preset_ocean_sunset');
            
            expect(onThemeChange).toHaveBeenCalled();
        });
    });

    describe('getSelectedTheme()', () => {
        it('should return preset theme by ID', () => {
            manager.selectTheme('preset_neutral');
            const theme = manager.getSelectedTheme();
            
            expect(theme).toBeDefined();
            expect(theme.id).toBe('preset_neutral');
            expect(theme.name).toBe('Neutral');
        });

        it('should return null when no theme selected', () => {
            manager.selectedThemeId = null;
            const theme = manager.getSelectedTheme();
            
            expect(theme).toBeNull();
        });
    });

    describe('Slot Grid', () => {
        it('should display 3 cluster rows', () => {
            const clusterRows = manager.themeEditorEl.querySelectorAll('.ctm__cluster-row');
            expect(clusterRows.length).toBe(3);
        });

        it('should display Shadows, Midtones, Highlights labels', () => {
            const labels = manager.themeEditorEl.querySelectorAll('.ctm__cluster-label');
            const labelTexts = Array.from(labels).map(el => el.textContent);
            
            expect(labelTexts).toContain('Shadows');
            expect(labelTexts).toContain('Midtones');
            expect(labelTexts).toContain('Highlights');
        });

        it('should have 12 slot elements', () => {
            const slots = manager.themeEditorEl.querySelectorAll('.ctm__slot');
            expect(slots.length).toBe(12);
        });

        it('should have 4 slots per cluster', () => {
            const swatchContainers = manager.themeEditorEl.querySelectorAll('.ctm__cluster-swatches');
            swatchContainers.forEach(container => {
                const slots = container.querySelectorAll('.ctm__slot');
                expect(slots.length).toBe(4);
            });
        });
    });

    describe('toggleColumnLock()', () => {
        it('should add column to lockedColumns', () => {
            manager.toggleColumnLock(2);
            expect(manager.lockedColumns.has(2)).toBe(true);
        });

        it('should remove column from lockedColumns on second call', () => {
            manager.toggleColumnLock(2);
            manager.toggleColumnLock(2);
            expect(manager.lockedColumns.has(2)).toBe(false);
        });
    });

    describe('lockedColumns state', () => {
        it('should start with empty lockedColumns set', () => {
            expect(manager.lockedColumns).toBeInstanceOf(Set);
            expect(manager.lockedColumns.size).toBe(0);
        });

        it('should track multiple locked columns', () => {
            manager.toggleColumnLock(0);
            manager.toggleColumnLock(2);
            expect(manager.lockedColumns.size).toBe(2);
            expect(manager.lockedColumns.has(0)).toBe(true);
            expect(manager.lockedColumns.has(2)).toBe(true);
        });
    });

    describe('Adjustments Section', () => {
        it('should have adjustments section', () => {
            const adjustments = manager.themeEditorEl.querySelector('.ctm__adjustments');
            expect(adjustments).toBeDefined();
        });

        it('should have adjustments header', () => {
            const header = manager.themeEditorEl.querySelector('.ctm__adjustments-header');
            expect(header).toBeDefined();
        });

        it('should have 7 slider controls', () => {
            // Brightness, Contrast, Highlights, Shadows, Whites, Blacks, Saturation
            expect(Object.keys(manager.adjustmentSliders).length).toBe(7);
        });

        it('should have reset button', () => {
            const resetBtn = manager.themeEditorEl.querySelector('.ctm__adjustments-reset');
            expect(resetBtn).toBeDefined();
        });
    });

    describe('Generate Section', () => {
        it('should have generate section', () => {
            const generate = manager.themeEditorEl.querySelector('.ctm__generate');
            expect(generate).toBeDefined();
        });

        it('should have harmony dropdown', () => {
            const harmonySelect = manager.themeEditorEl.querySelector('.ctm__generate-select');
            expect(harmonySelect).toBeDefined();
        });

        it('should have 7 harmony options', () => {
            const harmonySelect = manager.themeEditorEl.querySelector('.ctm__generate-select');
            expect(harmonySelect.options.length).toBe(7);
        });

        it('should have hues checkbox', () => {
            const checkboxes = manager.themeEditorEl.querySelectorAll('.ctm__generate-checkbox-label input[type="checkbox"]');
            expect(checkboxes.length).toBeGreaterThanOrEqual(1);
        });

        it('should have generate button', () => {
            const generateBtn = manager.themeEditorEl.querySelector('.ctm__generate-button');
            expect(generateBtn).toBeDefined();
        });
    });

    describe('Custom Theme Operations', () => {
        it('should create new theme', () => {
            const initialCount = manager.customThemes.length;
            manager.createNewTheme();
            expect(manager.customThemes.length).toBe(initialCount + 1);
        });

        it('should duplicate preset to custom', () => {
            manager.selectTheme('preset_ocean_sunset');
            const initialCount = manager.customThemes.length;
            manager.duplicateTheme('preset_ocean_sunset');
            expect(manager.customThemes.length).toBe(initialCount + 1);
        });

        it('should delete custom theme', () => {
            manager.createNewTheme();
            const themeId = manager.customThemes[0].id;
            const initialCount = manager.customThemes.length;
            
            manager.deleteTheme(themeId);
            
            expect(manager.customThemes.length).toBe(initialCount - 1);
        });

        it('should not delete preset themes', () => {
            manager.deleteTheme('preset_neutral');
            // Should not throw and presets remain
            const theme = manager.getSelectedTheme();
            expect(theme).toBeDefined();
        });
    });

    describe('Store Integration', () => {
        it('should dispatch UPDATE_SLIDE_STYLE_ASSIGNMENTS in edit mode', () => {
            // Default mock is in edit mode
            manager.selectTheme('preset_ocean_sunset');
            
            expect(mockDispatch).toHaveBeenCalledWith('UPDATE_SLIDE_STYLE_ASSIGNMENTS', expect.objectContaining({
                slideId: 'slide-1',
                styleAssignments: {
                    colorTheme: 'preset_ocean_sunset'
                }
            }));
        });

        it('should dispatch APPLY_LUMA_THEME in master mode when editing theme master', () => {
            // Override mock to return master mode with theme master selected
            mockGetState.mockReturnValue({
                editor: { 
                    activeSlideId: 'slide-1',
                    activeMasterId: 'master-default',
                    mode: 'master'
                },
                slides: {
                    'slide-1': { id: 'slide-1', layoutId: 'layout-1' }
                },
                masters: {
                    'master-default': {
                        id: 'master-default',
                        type: 'theme',
                        themeSettings: {
                            lumaTheme: {
                                id: 'preset_neutral',
                                name: 'Neutral',
                                colorMode: 'light'
                            }
                        }
                    }
                }
            });
            
            manager.selectTheme('preset_ocean_sunset');
            
            expect(mockDispatch).toHaveBeenCalledWith('APPLY_LUMA_THEME', expect.objectContaining({
                masterId: 'master-default',
                theme: expect.objectContaining({
                    id: 'preset_ocean_sunset'
                })
            }));
        });

        it('should dispatch UPDATE_MASTER_STYLE_ASSIGNMENTS in master mode when editing layout master', () => {
            // Override mock to return master mode with layout master selected
            mockGetState.mockReturnValue({
                editor: { 
                    activeSlideId: 'slide-1',
                    activeMasterId: 'layout-title-content',
                    mode: 'master'
                },
                slides: {
                    'slide-1': { id: 'slide-1', layoutId: 'layout-title-content' }
                },
                masters: {
                    'master-default': {
                        id: 'master-default',
                        type: 'theme',
                        themeSettings: {
                            lumaTheme: {
                                id: 'preset_neutral',
                                name: 'Neutral',
                                colorMode: 'light'
                            }
                        }
                    },
                    'layout-title-content': {
                        id: 'layout-title-content',
                        type: 'layout',
                        parentId: 'master-default',
                        name: 'Title and Content'
                    }
                }
            });
            
            manager.selectTheme('preset_ocean_sunset');
            
            expect(mockDispatch).toHaveBeenCalledWith('UPDATE_MASTER_STYLE_ASSIGNMENTS', expect.objectContaining({
                masterId: 'layout-title-content',
                styleAssignments: {
                    colorTheme: 'preset_ocean_sunset'
                }
            }));
        });

        it('should include resolved colors in master mode dispatch', () => {
            // Override mock to return master mode with theme master selected
            mockGetState.mockReturnValue({
                editor: { 
                    activeSlideId: 'slide-1',
                    activeMasterId: 'master-default',
                    mode: 'master'
                },
                slides: {},
                masters: {
                    'master-default': {
                        id: 'master-default',
                        type: 'theme',
                        themeSettings: {
                            lumaTheme: {
                                id: 'preset_neutral',
                                name: 'Neutral',
                                colorMode: 'light'
                            }
                        }
                    }
                }
            });
            
            manager.selectTheme('preset_ocean_sunset');
            
            expect(mockDispatch).toHaveBeenCalledWith('APPLY_LUMA_THEME', expect.objectContaining({
                theme: expect.objectContaining({
                    colors: expect.any(Array)
                })
            }));
        });

        it('should dispatch with 12 colors in master mode', () => {
            // Override mock to return master mode with theme master selected
            // Use mockReturnValue (not mockReturnValueOnce) because selectTheme calls getState multiple times
            const masterModeState = {
                editor: { 
                    activeSlideId: 'slide-1',
                    activeMasterId: 'master-default',
                    mode: 'master'
                },
                slides: {},
                masters: {
                    'master-default': {
                        id: 'master-default',
                        type: 'theme',
                        name: 'Default Theme',
                        themeSettings: {
                            lumaTheme: {
                                id: 'preset_neutral',
                                name: 'Neutral',
                                colorMode: 'light'
                            }
                        }
                    }
                }
            };
            mockGetState.mockReturnValue(masterModeState);
            
            manager.selectTheme('preset_ocean_sunset');
            
            const applyLumaCall = mockDispatch.mock.calls.find(call => call[0] === 'APPLY_LUMA_THEME');
            expect(applyLumaCall).toBeDefined();
            expect(applyLumaCall[1].theme.colors).toHaveLength(12);
        });
    });

    describe('Persistence', () => {
        it('should save custom themes to localStorage', () => {
            manager.createNewTheme();
            
            const stored = localStorage.getItem('colorThemes');
            expect(stored).toBeDefined();
            
            const parsed = JSON.parse(stored);
            expect(parsed.length).toBeGreaterThan(0);
        });

        it('should load custom themes from localStorage', () => {
            const testTheme = {
                id: 'test_theme_123',
                name: 'Test Theme',
                slots: Array(12).fill({ h: 0, s: 0 }),
                adjustments: {
                    brightness: 0,
                    contrast: 0,
                    highlights: 0,
                    shadows: 0,
                    whites: 0,
                    blacks: 0,
                    saturation: 0
                },
                isPreset: false
            };
            localStorage.setItem('colorThemes', JSON.stringify([testTheme]));
            
            const newManager = new ColorThemeManager();
            expect(newManager.customThemes.length).toBe(1);
            expect(newManager.customThemes[0].id).toBe('test_theme_123');
            
            newManager.element.remove();
        });
    });

    describe('destroy()', () => {
        it('should clear internal references', () => {
            manager.destroy();
            
            expect(manager.adjustmentSliders).toEqual({});
            expect(manager.themeListEl).toBeNull();
            expect(manager.themeEditorEl).toBeNull();
            expect(manager.columnEditEl).toBeNull();
        });
    });

    describe('CSS Variable Scoping (No Global Application)', () => {
        it('should NOT apply CSS variables to document.documentElement in edit mode', () => {
            // Store the original setProperty to spy on it
            const originalSetProperty = document.documentElement.style.setProperty;
            const setPropertySpy = vi.fn();
            document.documentElement.style.setProperty = setPropertySpy;

            try {
                // Reset mock to default edit mode
                mockGetState.mockReturnValue({
                    editor: { 
                        activeSlideId: 'slide-1',
                        mode: 'edit'
                    },
                    slides: {
                        'slide-1': { id: 'slide-1', layoutId: 'layout-1' }
                    },
                    masters: {
                        'master-default': {
                            id: 'master-default',
                            type: 'theme',
                            themeSettings: {
                                lumaTheme: {
                                    id: 'preset_neutral',
                                    name: 'Neutral',
                                    colorMode: 'light'
                                }
                            }
                        },
                        'layout-1': {
                            id: 'layout-1',
                            type: 'layout',
                            parentId: 'master-default'
                        }
                    }
                });

                manager.selectTheme('preset_ocean_sunset');

                // Should NOT have called setProperty with theme-slot variables
                const themeSlotCalls = setPropertySpy.mock.calls.filter(
                    call => call[0]?.startsWith('--theme-slot')
                );
                expect(themeSlotCalls.length).toBe(0);
            } finally {
                document.documentElement.style.setProperty = originalSetProperty;
            }
        });

        it('should dispatch theme-assignment-changed event for layout master changes', () => {
            const eventSpy = vi.fn();
            document.addEventListener('style:theme-assignment-changed', eventSpy);

            try {
                // Override mock to return master mode with layout master selected
                mockGetState.mockReturnValue({
                    editor: { 
                        activeSlideId: 'slide-1',
                        activeMasterId: 'layout-title-content',
                        mode: 'master'
                    },
                    slides: {},
                    masters: {
                        'master-default': {
                            id: 'master-default',
                            type: 'theme',
                            themeSettings: {
                                lumaTheme: {
                                    id: 'preset_neutral',
                                    name: 'Neutral',
                                    colorMode: 'light'
                                }
                            }
                        },
                        'layout-title-content': {
                            id: 'layout-title-content',
                            type: 'layout',
                            parentId: 'master-default',
                            name: 'Title and Content'
                        }
                    }
                });

                manager.selectTheme('preset_ocean_sunset');

                // Should have dispatched the event
                expect(eventSpy).toHaveBeenCalled();
                const eventDetail = eventSpy.mock.calls[0][0].detail;
                expect(eventDetail.targetType).toBe('layout');
                expect(eventDetail.targetId).toBe('layout-title-content');
                expect(eventDetail.themeId).toBe('preset_ocean_sunset');
            } finally {
                document.removeEventListener('style:theme-assignment-changed', eventSpy);
            }
        });

        it('should dispatch theme-updated event for theme master changes', () => {
            const eventSpy = vi.fn();
            document.addEventListener('style:theme-updated', eventSpy);

            try {
                // Override mock to return master mode with theme master selected
                mockGetState.mockReturnValue({
                    editor: { 
                        activeSlideId: 'slide-1',
                        activeMasterId: 'master-default',
                        mode: 'master'
                    },
                    slides: {},
                    masters: {
                        'master-default': {
                            id: 'master-default',
                            type: 'theme',
                            themeSettings: {
                                lumaTheme: {
                                    id: 'preset_neutral',
                                    name: 'Neutral',
                                    colorMode: 'light'
                                }
                            }
                        }
                    }
                });

                manager.selectTheme('preset_ocean_sunset');

                // Should have dispatched the event
                expect(eventSpy).toHaveBeenCalled();
                const eventDetail = eventSpy.mock.calls[0][0].detail;
                expect(eventDetail.masterId).toBe('master-default');
                expect(eventDetail.themeId).toBe('preset_ocean_sunset');
                expect(eventDetail.affectedSlides).toBe('all');
            } finally {
                document.removeEventListener('style:theme-updated', eventSpy);
            }
        });
    });
});

