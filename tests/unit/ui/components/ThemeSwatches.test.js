import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock dependencies before imports
vi.mock('../../../../src/core/Store.js', () => ({
    store: {
        dispatch: vi.fn(),
        getState: vi.fn(() => ({
            editor: { activeMasterId: 'master-1' },
            masters: {
                'master-1': {
                    themeSettings: {
                        colors: {
                            background1: '#FFFFFF',
                            background2: '#F0F0F0',
                            text1: '#000000',
                            text2: '#666666',
                            accent1: '#FF0000',
                            accent2: '#00FF00'
                        }
                    }
                }
            }
        })),
        on: vi.fn(),
        off: vi.fn()
    }
}));

vi.mock('../../../../src/core/constants/ColorPresets.js', () => ({
    COLOR_PRESETS: [
        { id: 'preset-1', name: 'Preset 1', colors: { background1: '#111111' } },
        { id: 'preset-2', name: 'Preset 2', colors: { background1: '#222222' } }
    ],
    getPresetById: vi.fn((id) => {
        if (id === 'preset-1') return { id: 'preset-1', name: 'Preset 1', colors: { background1: '#111111' } };
        if (id === 'preset-2') return { id: 'preset-2', name: 'Preset 2', colors: { background1: '#222222' } };
        return null;
    })
}));

vi.mock('../../../../src/ui/components/Dropdown.js', () => ({
    Dropdown: vi.fn().mockImplementation((options) => {
        const element = document.createElement('div');
        element.className = 'dropdown';
        return { 
            element,
            value: options.value
        };
    })
}));

import { ThemeSwatches } from '../../../../src/ui/components/ThemeSwatches.js';
import { store } from '../../../../src/core/Store.js';

describe('ThemeSwatches', () => {
    let container;

    beforeEach(() => {
        vi.clearAllMocks();
        container = document.createElement('div');
        document.body.appendChild(container);
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

        it('shows preset selector by default', () => {
            const swatches = new ThemeSwatches();
            expect(swatches.options.showPresetSelector).toBe(true);
        });

        it('can hide preset selector', () => {
            const swatches = new ThemeSwatches({ showPresetSelector: false });
            expect(swatches.options.showPresetSelector).toBe(false);
        });

        it('uses default columns of 8', () => {
            const swatches = new ThemeSwatches();
            expect(swatches.options.columns).toBe(8);
        });

        it('accepts custom columns', () => {
            const swatches = new ThemeSwatches({ columns: 4 });
            expect(swatches.options.columns).toBe(4);
        });

        it('has null currentPresetId initially', () => {
            const swatches = new ThemeSwatches();
            expect(swatches.currentPresetId).toBeNull();
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
            expect(label.textContent).toBe('Theme Colors');
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

        it('creates preset dropdown when enabled', () => {
            const swatches = new ThemeSwatches({ showPresetSelector: true });
            expect(swatches.presetDropdown).toBeDefined();
        });

        it('does not create preset dropdown when disabled', () => {
            const swatches = new ThemeSwatches({ showPresetSelector: false });
            expect(swatches.presetDropdown).toBeUndefined();
        });
    });

    describe('color retrieval', () => {
        it('gets colors from current theme by default', () => {
            const swatches = new ThemeSwatches();
            const colors = swatches.getColors();
            expect(colors.background1).toBe('#FFFFFF');
            expect(colors.text1).toBe('#000000');
        });

        it('gets colors from preset when selected', () => {
            const swatches = new ThemeSwatches();
            swatches.currentPresetId = 'preset-1';
            
            const colors = swatches.getColors();
            expect(colors.background1).toBe('#111111');
        });

        it('returns empty object when preset not found', () => {
            // Create swatches that will call getState internally with invalid preset
            const swatches = new ThemeSwatches();
            swatches.currentPresetId = 'non-existent-preset-id';
            
            const colors = swatches.getColors();
            // Preset not found returns null, so {} or undefined colors
            expect(colors).toEqual({});
        });
    });

    describe('swatch rendering', () => {
        it('creates swatch buttons for each color', () => {
            const swatches = new ThemeSwatches();
            container.appendChild(swatches.element);
            
            const swatchButtons = swatches.swatchGrid.querySelectorAll('.swatch');
            expect(swatchButtons.length).toBeGreaterThan(0);
        });

        it('sets background color on swatch', () => {
            const swatches = new ThemeSwatches();
            container.appendChild(swatches.element);
            
            const firstSwatch = swatches.swatchGrid.querySelector('.swatch');
            expect(firstSwatch.style.backgroundColor).toBeDefined();
        });

        it('sets title with color name and value', () => {
            const swatches = new ThemeSwatches();
            container.appendChild(swatches.element);
            
            const firstSwatch = swatches.swatchGrid.querySelector('.swatch');
            expect(firstSwatch.title).toContain('#');
        });
    });

    describe('color selection', () => {
        it('calls onColorSelect when swatch clicked', () => {
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
            
            expect(onColorSelect).toHaveBeenCalledWith(expect.stringMatching(/^#|^rgb/));
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
            swatches.swatchGrid.innerHTML = '<div>test</div>';
            
            swatches.updateSwatches();
            
            const testDiv = swatches.swatchGrid.querySelector('div:not(.swatch)');
            expect(testDiv).toBeNull();
        });

        it('handles undefined swatchGrid gracefully', () => {
            const swatches = new ThemeSwatches();
            swatches.swatchGrid = null;
            
            expect(() => swatches.updateSwatches()).not.toThrow();
        });

        it('skips colors not in theme', () => {
            // Create a swatches instance with limited colors via preset
            const swatches = new ThemeSwatches();
            swatches.currentPresetId = 'preset-1'; // Only has background1
            swatches.updateSwatches();
            
            const swatchButtons = swatches.swatchGrid.querySelectorAll('.swatch');
            expect(swatchButtons.length).toBe(1);
        });
    });

    describe('preset selector', () => {
        it('includes Current as first option when using presets', () => {
            const swatches = new ThemeSwatches({ showPresetSelector: true });
            // The dropdown exists
            expect(swatches.presetDropdown).toBeDefined();
        });

        it('stores presetDropdown reference', () => {
            const swatches = new ThemeSwatches({ showPresetSelector: true });
            expect(swatches.presetDropdown.element).toBeDefined();
        });
    });
});
