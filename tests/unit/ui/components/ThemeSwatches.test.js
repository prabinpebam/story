import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Default test state
const defaultMockState = {
    editor: { 
        activeMasterId: 'theme-default',
        activeSlideId: 'slide-1'
    },
    masters: {
        'theme-default': {
            id: 'theme-default',
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
            },
            styleAssignments: {
                colorTheme: null,
                colorMode: 'dark',
                typographyStyle: null
            }
        }
    },
    layouts: {
        'layout-title-slide': {
            id: 'layout-title-slide',
            masterId: 'theme-default',
            styleAssignments: {
                colorTheme: null,
                typographyStyle: null
            }
        }
    },
    slides: {
        'slide-1': {
            id: 'slide-1',
            layoutId: 'layout-title-slide',
            masterId: 'theme-default',
            styleAssignments: {
                colorTheme: null,
                typographyStyle: null
            }
        }
    }
};

// Mock dependencies before imports
vi.mock('../../../../src/core/Store.js', () => ({
    store: {
        dispatch: vi.fn(),
        getState: vi.fn(() => ({
            editor: { 
                activeMasterId: 'theme-default',
                activeSlideId: 'slide-1'
            },
            masters: {
                'theme-default': {
                    id: 'theme-default',
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
                    },
                    styleAssignments: {
                        colorTheme: null,
                        colorMode: 'dark',
                        typographyStyle: null
                    }
                }
            },
            layouts: {},
            slides: {
                'slide-1': {
                    id: 'slide-1',
                    masterId: 'theme-default',
                    styleAssignments: { colorTheme: null }
                }
            }
        })),
        on: vi.fn(),
        off: vi.fn()
    }
}));

// Mock StyleResolver to return cascade-aware theme info
vi.mock('../../../../src/utils/StyleResolver.js', () => ({
    StyleResolver: {
        getThemeInfoForSlide: vi.fn(() => ({
            lumaTheme: {
                id: 'preset_neutral',
                name: 'Neutral',
                resolvedColors: [
                    '#0d0d0d', '#1a1a1a', '#2e2e2e', '#404040',
                    '#595959', '#737373', '#8c8c8c', '#a6a6a6',
                    '#b3b3b3', '#cccccc', '#e6e6e6', '#f8f8f8'
                ]
            },
            source: 'master',
            sourceLabel: 'from Master',
            isInherited: true
        })),
        getThemeInfoForCurrentContext: vi.fn(() => ({
            lumaTheme: {
                id: 'preset_neutral',
                name: 'Neutral',
                resolvedColors: [
                    '#0d0d0d', '#1a1a1a', '#2e2e2e', '#404040',
                    '#595959', '#737373', '#8c8c8c', '#a6a6a6',
                    '#b3b3b3', '#cccccc', '#e6e6e6', '#f8f8f8'
                ]
            },
            source: 'master',
            sourceLabel: 'from Master',
            isInherited: true
        })),
        getEffectiveColorTheme: vi.fn()
    }
}));

import { ThemeSwatches } from '../../../../src/ui/components/ThemeSwatches.js';
import { store } from '../../../../src/core/Store.js';
import { StyleResolver } from '../../../../src/utils/StyleResolver.js';

// Default theme info to return from StyleResolver mock
const defaultThemeInfo = {
    lumaTheme: {
        id: 'preset_neutral',
        name: 'Neutral',
        resolvedColors: [
            '#0d0d0d', '#1a1a1a', '#2e2e2e', '#404040',
            '#595959', '#737373', '#8c8c8c', '#a6a6a6',
            '#b3b3b3', '#cccccc', '#e6e6e6', '#f8f8f8'
        ]
    },
    source: 'master',
    sourceLabel: 'from Master',
    isInherited: true
};

describe('ThemeSwatches', () => {
    let container;

    beforeEach(() => {
        vi.clearAllMocks();
        container = document.createElement('div');
        document.body.appendChild(container);
        
        // Reset StyleResolver mock to return default theme info
        StyleResolver.getThemeInfoForSlide.mockReturnValue(defaultThemeInfo);
    });

    afterEach(() => {
        container.remove();
    });

    describe('initialization', () => {
        it('creates element with correct class', () => {
            const swatches = new ThemeSwatches();
            expect(swatches.element).toBeDefined();
            expect(swatches.element.className).toBe('swatch-section');
        });

        it('accepts onColorSelect callback', () => {
            const onColorSelect = vi.fn();
            const swatches = new ThemeSwatches({ onColorSelect });
            expect(swatches.options.onColorSelect).toBe(onColorSelect);
        });

        it('accepts onLinkedColorSelect callback for linked mode', () => {
            const onLinkedColorSelect = vi.fn();
            const swatches = new ThemeSwatches({ onLinkedColorSelect });
            expect(swatches.options.onLinkedColorSelect).toBe(onLinkedColorSelect);
        });

        it('enables linkedMode when onLinkedColorSelect is provided', () => {
            const onLinkedColorSelect = vi.fn();
            const swatches = new ThemeSwatches({ onLinkedColorSelect });
            expect(swatches.options.linkedMode).toBe(true);
        });

        it('shows theme name by default', () => {
            const swatches = new ThemeSwatches();
            expect(swatches.options.showThemeName).toBe(true);
        });

        it('can hide theme name', () => {
            const swatches = new ThemeSwatches({ showThemeName: false });
            expect(swatches.options.showThemeName).toBe(false);
        });

        it('uses default columns of 6', () => {
            const swatches = new ThemeSwatches();
            expect(swatches.options.columns).toBe(6);
        });

        it('accepts custom columns', () => {
            const swatches = new ThemeSwatches({ columns: 4 });
            expect(swatches.options.columns).toBe(4);
        });

        it('validates column values', () => {
            // Invalid column value should default to 6
            const swatches = new ThemeSwatches({ columns: 5 });
            expect(swatches.options.columns).toBe(6);
        });
    });

    describe('structure', () => {
        it('creates header element', () => {
            const swatches = new ThemeSwatches();
            const header = swatches.element.querySelector('.swatch-section-header');
            expect(header).toBeDefined();
        });

        it('creates label in header', () => {
            const swatches = new ThemeSwatches();
            const label = swatches.element.querySelector('.swatch-section-label');
            expect(label).toBeDefined();
        });

        it('creates swatch grid', () => {
            const swatches = new ThemeSwatches();
            expect(swatches.swatchGrid).toBeDefined();
            expect(swatches.swatchGrid.className).toContain('swatch-grid');
        });

        it('applies columns class to grid', () => {
            const swatches = new ThemeSwatches({ columns: 4 });
            expect(swatches.swatchGrid.className).toContain('swatch-grid--cols-4');
        });

        it('does not create preset dropdown (removed in new system)', () => {
            const swatches = new ThemeSwatches();
            // The new luma-locked system doesn't use a preset dropdown in swatches
            expect(swatches.presetDropdown).toBeUndefined();
        });
    });

    describe('color retrieval', () => {
        it('gets colors from luma theme as array', () => {
            const swatches = new ThemeSwatches();
            const colors = swatches.getColors();
            expect(Array.isArray(colors)).toBe(true);
            expect(colors.length).toBe(12);
        });

        it('returns 12 colors from the theme', () => {
            const swatches = new ThemeSwatches();
            const colors = swatches.getColors();
            expect(colors[0]).toBe('#0d0d0d');
            expect(colors[11]).toBe('#f8f8f8');
        });

        it('returns fallback grayscale colors when no theme', () => {
            // When there's no theme, StyleResolver returns null lumaTheme
            StyleResolver.getThemeInfoForSlide.mockReturnValue({
                lumaTheme: null,
                source: null,
                sourceLabel: 'No theme',
                isInherited: false
            });
            
            const swatches = new ThemeSwatches();
            const colors = swatches.getColors();
            
            // Should return grayscale fallback based on luma values
            expect(colors.length).toBe(12);
            expect(colors[0]).toMatch(/^#[0-9a-f]{6}$/i);
        });
    });

    describe('swatch rendering', () => {
        it('creates 12 swatch buttons for all luma slots', () => {
            const swatches = new ThemeSwatches();
            container.appendChild(swatches.element);
            
            const swatchButtons = swatches.swatchGrid.querySelectorAll('.swatch');
            expect(swatchButtons.length).toBe(12);
        });

        it('uses button elements for swatches', () => {
            const swatches = new ThemeSwatches();
            container.appendChild(swatches.element);
            
            const firstSwatch = swatches.swatchGrid.querySelector('.swatch');
            expect(firstSwatch.tagName).toBe('BUTTON');
        });

        it('sets background color on swatch', () => {
            const swatches = new ThemeSwatches();
            container.appendChild(swatches.element);
            
            const firstSwatch = swatches.swatchGrid.querySelector('.swatch');
            expect(firstSwatch.style.backgroundColor).toBeDefined();
        });

        it('sets title with slot info and color value', () => {
            const swatches = new ThemeSwatches();
            container.appendChild(swatches.element);
            
            const firstSwatch = swatches.swatchGrid.querySelector('.swatch');
            expect(firstSwatch.title).toContain('Slot 1');
            expect(firstSwatch.title).toContain('#');
        });

        it('stores slot index in dataset', () => {
            const swatches = new ThemeSwatches();
            container.appendChild(swatches.element);
            
            const firstSwatch = swatches.swatchGrid.querySelector('.swatch');
            expect(firstSwatch.dataset.slotIndex).toBe('0');
        });

        it('applies swatch--xl class to all swatches', () => {
            const swatches = new ThemeSwatches();
            container.appendChild(swatches.element);
            
            // All swatches should have the xl variant class
            const xlSwatches = swatches.swatchGrid.querySelectorAll('.swatch--xl');
            expect(xlSwatches.length).toBe(12);
        });
    });

    describe('theme name display', () => {
        it('displays theme name in label when available', () => {
            const swatches = new ThemeSwatches();
            container.appendChild(swatches.element);
            
            const label = swatches.element.querySelector('.swatch-section-label');
            // The label will show theme name from lumaTheme.name
            expect(label.textContent).toBe('Neutral');
        });

        it('updates theme name on state change', () => {
            const swatches = new ThemeSwatches();
            container.appendChild(swatches.element);
            
            // Update StyleResolver mock to return the new theme
            StyleResolver.getThemeInfoForCurrentContext.mockReturnValue({
                lumaTheme: {
                    id: 'preset_ocean',
                    name: 'Ocean',
                    resolvedColors: Array(12).fill('#0000ff')
                },
                source: 'master',
                sourceLabel: 'from Master',
                isInherited: true
            });
            
            swatches.updateSwatches();
            
            const label = swatches.element.querySelector('.swatch-section-label');
            expect(label.textContent).toBe('Ocean');
        });
    });

    describe('color selection', () => {
        it('calls onColorSelect when swatch clicked in regular mode', () => {
            const onColorSelect = vi.fn();
            const swatches = new ThemeSwatches({ onColorSelect });
            container.appendChild(swatches.element);
            
            const firstSwatch = swatches.swatchGrid.querySelector('.swatch');
            firstSwatch.click();
            
            expect(onColorSelect).toHaveBeenCalled();
        });

        it('passes color value to onColorSelect', () => {
            const onColorSelect = vi.fn();
            const swatches = new ThemeSwatches({ onColorSelect });
            container.appendChild(swatches.element);
            
            const firstSwatch = swatches.swatchGrid.querySelector('.swatch');
            firstSwatch.click();
            
            // Should be called with a hex color (from the theme or fallback)
            expect(onColorSelect).toHaveBeenCalledWith(expect.stringMatching(/^#[0-9a-fA-F]{6}$/));
        });

        it('calls onLinkedColorSelect in linked mode', () => {
            const onLinkedColorSelect = vi.fn();
            const swatches = new ThemeSwatches({ onLinkedColorSelect });
            container.appendChild(swatches.element);
            
            const firstSwatch = swatches.swatchGrid.querySelector('.swatch');
            firstSwatch.click();
            
            expect(onLinkedColorSelect).toHaveBeenCalled();
        });

        it('passes slot index and color to onLinkedColorSelect', () => {
            const onLinkedColorSelect = vi.fn();
            const swatches = new ThemeSwatches({ onLinkedColorSelect });
            container.appendChild(swatches.element);
            
            const firstSwatch = swatches.swatchGrid.querySelector('.swatch');
            firstSwatch.click();
            
            expect(onLinkedColorSelect).toHaveBeenCalledWith({
                slotIndex: 0,
                color: expect.stringMatching(/^#[0-9a-fA-F]{6}$/)
            });
        });
    });

    describe('selected slot', () => {
        it('accepts initial selectedSlot', () => {
            const swatches = new ThemeSwatches({ selectedSlot: 5 });
            expect(swatches.options.selectedSlot).toBe(5);
        });

        it('applies selected class to selected swatch', () => {
            const swatches = new ThemeSwatches({ selectedSlot: 5 });
            container.appendChild(swatches.element);
            
            const swatchButtons = swatches.swatchGrid.querySelectorAll('.swatch');
            expect(swatchButtons[5].className).toContain('swatch--selected');
        });

        it('can update selected slot via setSelectedSlot', () => {
            const swatches = new ThemeSwatches();
            container.appendChild(swatches.element);
            
            swatches.setSelectedSlot(3);
            
            const swatchButtons = swatches.swatchGrid.querySelectorAll('.swatch');
            expect(swatchButtons[3].className).toContain('swatch--selected');
        });
    });

    describe('state change handling', () => {
        it('registers state change listener on creation', () => {
            new ThemeSwatches();
            expect(store.on).toHaveBeenCalledWith('state-changed', expect.any(Function));
        });

        it('updates swatches on state change', () => {
            const swatches = new ThemeSwatches();
            const updateSpy = vi.spyOn(swatches, 'updateSwatches');
            
            // Trigger state change
            const callback = store.on.mock.calls[0][1];
            callback();
            
            expect(updateSpy).toHaveBeenCalled();
        });
    });

    describe('destroy', () => {
        it('unregisters state change listener', () => {
            const swatches = new ThemeSwatches();
            swatches.destroy();
            
            expect(store.off).toHaveBeenCalledWith('state-changed', expect.any(Function));
        });

        it('removes element from DOM', () => {
            const swatches = new ThemeSwatches();
            container.appendChild(swatches.element);
            
            swatches.destroy();
            
            expect(swatches.element.parentNode).toBeNull();
        });
    });

    describe('updateSwatches', () => {
        it('clears existing swatches', () => {
            const swatches = new ThemeSwatches();
            swatches.swatchGrid.innerHTML = '<div class="test">test</div>';
            
            swatches.updateSwatches();
            
            const testDiv = swatches.swatchGrid.querySelector('.test');
            expect(testDiv).toBeNull();
        });

        it('handles null swatchGrid gracefully', () => {
            const swatches = new ThemeSwatches();
            swatches.swatchGrid = null;
            
            expect(() => swatches.updateSwatches()).not.toThrow();
        });

        it('always renders 12 swatches', () => {
            const swatches = new ThemeSwatches();
            container.appendChild(swatches.element);
            
            swatches.updateSwatches();
            
            const swatchButtons = swatches.swatchGrid.querySelectorAll('.swatch');
            expect(swatchButtons.length).toBe(12);
        });
    });

    describe('accessibility', () => {
        it('swatches have aria-label', () => {
            const swatches = new ThemeSwatches();
            container.appendChild(swatches.element);
            
            const firstSwatch = swatches.swatchGrid.querySelector('.swatch');
            expect(firstSwatch.getAttribute('aria-label')).toContain('Select');
        });

        it('swatches have type button', () => {
            const swatches = new ThemeSwatches();
            container.appendChild(swatches.element);
            
            const firstSwatch = swatches.swatchGrid.querySelector('.swatch');
            expect(firstSwatch.type).toBe('button');
        });
    });

    describe('cascade-aware theme source', () => {
        it('shows inherited indicator when theme comes from master', () => {
            StyleResolver.getThemeInfoForCurrentContext.mockReturnValue({
                lumaTheme: defaultThemeInfo.lumaTheme,
                source: 'master',
                sourceLabel: 'from Master',
                isInherited: true
            });
            
            const swatches = new ThemeSwatches({ showThemeSource: true });
            container.appendChild(swatches.element);
            
            const sourceIndicator = swatches.element.querySelector('.theme-source-indicator');
            expect(sourceIndicator).toBeDefined();
            expect(sourceIndicator.textContent).toContain('from Master');
        });

        it('shows inherited indicator when theme comes from layout', () => {
            StyleResolver.getThemeInfoForCurrentContext.mockReturnValue({
                lumaTheme: defaultThemeInfo.lumaTheme,
                source: 'layout',
                sourceLabel: 'from Layout',
                isInherited: true
            });
            
            const swatches = new ThemeSwatches({ showThemeSource: true });
            container.appendChild(swatches.element);
            
            const sourceIndicator = swatches.element.querySelector('.theme-source-indicator');
            expect(sourceIndicator.textContent).toContain('from Layout');
        });

        it('shows slide-specific indicator when theme is directly assigned', () => {
            StyleResolver.getThemeInfoForCurrentContext.mockReturnValue({
                lumaTheme: defaultThemeInfo.lumaTheme,
                source: 'slide',
                sourceLabel: 'slide-specific',
                isInherited: false
            });
            
            const swatches = new ThemeSwatches({ showThemeSource: true });
            container.appendChild(swatches.element);
            
            const sourceIndicator = swatches.element.querySelector('.theme-source-indicator');
            expect(sourceIndicator.textContent).toContain('slide-specific');
        });

        it('can hide theme source indicator', () => {
            const swatches = new ThemeSwatches({ showThemeSource: false });
            container.appendChild(swatches.element);
            
            expect(swatches.sourceIndicator).toBeUndefined();
        });

        it('accepts slideId option for cascade context', () => {
            const swatches = new ThemeSwatches({ slideId: 'slide-2' });
            expect(swatches.options.slideId).toBe('slide-2');
        });

        it('can update slideId via setSlideId method', () => {
            const swatches = new ThemeSwatches();
            swatches.setSlideId('slide-3');
            expect(swatches.options.slideId).toBe('slide-3');
        });

        it('calls StyleResolver.getThemeInfoForCurrentContext for mode-aware theme resolution', () => {
            StyleResolver.getThemeInfoForCurrentContext.mockClear();
            
            const swatches = new ThemeSwatches({ slideId: 'slide-5' });
            container.appendChild(swatches.element);
            
            // Now uses mode-aware method that handles both master and edit modes
            expect(StyleResolver.getThemeInfoForCurrentContext).toHaveBeenCalled();
        });

        it('uses mode-aware context resolution when slideId not provided', () => {
            // The mock store returns activeSlideId: 'slide-1'
            StyleResolver.getThemeInfoForCurrentContext.mockClear();
            
            const swatches = new ThemeSwatches();
            container.appendChild(swatches.element);
            
            // Should use the mode-aware method
            expect(StyleResolver.getThemeInfoForCurrentContext).toHaveBeenCalled();
        });
    });
});
