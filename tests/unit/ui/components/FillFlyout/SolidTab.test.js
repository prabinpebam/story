/**
 * SolidTab Tests
 * 
 * Tests for the SolidTab component that provides solid color selection
 * with integration to the luma-locked theme system.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted() for mock functions that need to be available in vi.mock factories
const { mockGetState } = vi.hoisted(() => ({
    mockGetState: vi.fn(() => ({
        editor: { mode: 'slide', activeSlideId: 'slide-1' },
        masters: {
            'theme-default': {
                id: 'theme-default',
                type: 'theme',
                themeSettings: {
                    lumaTheme: {
                        id: 'neutral',
                        name: 'Neutral',
                        resolvedColors: [
                            '#0d0d0d', '#1a1a1a', '#2e2e2e', '#404040',
                            '#595959', '#737373', '#8c8c8c', '#a6a6a6',
                            '#b3b3b3', '#cccccc', '#e6e6e6', '#f8f8f8'
                        ]
                    }
                }
            }
        },
        layouts: {},
        slides: {
            'slide-1': { id: 'slide-1', masterId: 'theme-default', styleAssignments: {} }
        }
    }))
}));

vi.mock('../../../../../src/core/Store.js', () => ({
    store: {
        getState: mockGetState,
        on: vi.fn(),
        off: vi.fn(),
        dispatch: vi.fn()
    }
}));

// Mock ColorUtils
vi.mock('../../../../../src/utils/ColorUtils.js', () => ({
    ColorUtils: {
        parseColor: vi.fn((color) => {
            // Simple hex parsing
            if (color && color.startsWith('#')) {
                const hex = color.slice(1);
                const r = parseInt(hex.substring(0, 2), 16);
                const g = parseInt(hex.substring(2, 4), 16);
                const b = parseInt(hex.substring(4, 6), 16);
                return { r, g, b, a: 1 };
            }
            return { r: 0, g: 0, b: 0, a: 1 };
        }),
        rgbToHsb: vi.fn((r, g, b) => ({ h: 0, s: 0, b: Math.round((r + g + b) / 3 / 2.55) })),
        hsbToRgb: vi.fn((h, s, b) => {
            const gray = Math.round(b * 2.55);
            return { r: gray, g: gray, b: gray };
        }),
        rgbToHex: vi.fn((r, g, b) => {
            return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
        }),
        hexToRgb: vi.fn((hex) => {
            if (!hex) return null;
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        })
    }
}));

// Mock Icons
vi.mock('../../../../../src/ui/Icons.js', () => ({
    Icons: { EYEDROPPER: '<svg></svg>' }
}));

// Mock NumberInput
vi.mock('../../../../../src/ui/components/NumberInput.js', () => ({
    NumberInput: vi.fn().mockImplementation((opts) => ({
        element: document.createElement('div'),
        setValue: vi.fn()
    }))
}));

// Mock IconButton
vi.mock('../../../../../src/ui/components/IconButton.js', () => ({
    IconButton: vi.fn().mockImplementation((opts) => ({
        element: document.createElement('button')
    }))
}));

// Mock ThemeSwatches 
vi.mock('../../../../../src/ui/components/ThemeSwatches.js', () => ({
    ThemeSwatches: vi.fn().mockImplementation((opts) => {
        const element = document.createElement('div');
        element.className = 'swatch-section';
        element.innerHTML = `
            <div class="swatch-section-header">
                <div class="swatch-section-label">Theme Colors</div>
            </div>
            <div class="swatch-grid">
                ${[...Array(12)].map((_, i) => 
                    `<button class="swatch swatch--xl" data-slot-index="${i}"></button>`
                ).join('')}
            </div>
        `;
        
        // Store callbacks for testing
        element._onColorSelect = opts.onColorSelect;
        element._onLinkedColorSelect = opts.onLinkedColorSelect;
        
        // Simulate click on swatches
        element.querySelectorAll('.swatch').forEach((swatch, idx) => {
            swatch.addEventListener('click', () => {
                if (opts.onLinkedColorSelect) {
                    opts.onLinkedColorSelect({ slotIndex: idx, color: '#808080' });
                } else if (opts.onColorSelect) {
                    opts.onColorSelect('#808080');
                }
            });
        });
        
        return { 
            element, 
            destroy: vi.fn(),
            setSelectedSlot: vi.fn(),
            updateColors: vi.fn()
        };
    })
}));

import { SolidTab } from '../../../../../src/ui/components/FillFlyout/SolidTab.js';
import { ThemeSwatches } from '../../../../../src/ui/components/ThemeSwatches.js';

describe('SolidTab', () => {
    let container;
    
    beforeEach(() => {
        vi.clearAllMocks();
        container = document.createElement('div');
        document.body.appendChild(container);
    });
    
    afterEach(() => {
        document.body.removeChild(container);
    });

    describe('initialization', () => {
        it('should create element with proper structure', () => {
            const onChange = vi.fn();
            const tab = new SolidTab({
                fill: { color: '#ff0000' },
                onChange
            });
            
            expect(tab.element).toBeDefined();
            expect(tab.element.tagName).toBe('DIV');
        });
        
        it('should initialize state from fill color', () => {
            const onChange = vi.fn();
            const tab = new SolidTab({
                fill: { color: '#ff0000', opacity: 80 },
                onChange
            });
            
            // State should be initialized (mocked ColorUtils returns grayscale)
            expect(tab.state).toBeDefined();
            expect(tab.state.h).toBeDefined();
            expect(tab.state.s).toBeDefined();
            expect(tab.state.b).toBeDefined();
        });
        
        it('should use default color when none provided', () => {
            const onChange = vi.fn();
            const tab = new SolidTab({
                fill: {},
                onChange
            });
            
            expect(tab.state).toBeDefined();
        });
    });

    describe('theme swatches', () => {
        it('should include ThemeSwatches component', () => {
            const onChange = vi.fn();
            const tab = new SolidTab({
                fill: { color: '#ff0000' },
                onChange
            });
            
            container.appendChild(tab.element);
            
            // ThemeSwatches should be instantiated
            expect(ThemeSwatches).toHaveBeenCalled();
        });
        
        it('should render theme swatches section', () => {
            const onChange = vi.fn();
            const tab = new SolidTab({
                fill: { color: '#ff0000' },
                onChange
            });
            
            container.appendChild(tab.element);
            
            const swatchSection = tab.element.querySelector('.swatch-section');
            expect(swatchSection).not.toBeNull();
        });
        
        it('should have 12 theme swatches', () => {
            const onChange = vi.fn();
            const tab = new SolidTab({
                fill: { color: '#ff0000' },
                onChange
            });
            
            container.appendChild(tab.element);
            
            // ThemeSwatches mock creates 12 swatches in the first swatch-section
            const themeSwatch = tab.themeSwatches.element;
            const swatches = themeSwatch.querySelectorAll('.swatch-grid .swatch');
            expect(swatches.length).toBe(12);
        });
        
        it('should call onChange with color when swatch clicked (regular mode)', () => {
            const onChange = vi.fn();
            const tab = new SolidTab({
                fill: { color: '#ff0000' },
                onChange
            });
            
            container.appendChild(tab.element);
            
            // Click first swatch
            const swatch = tab.element.querySelector('.swatch-grid .swatch');
            swatch.click();
            
            // onChange should be called with color data
            expect(onChange).toHaveBeenCalled();
        });
        
        it('should call onChange with themeSlot for linked color selection', () => {
            const onChange = vi.fn();
            const tab = new SolidTab({
                fill: { color: '#ff0000' },
                onChange
            });
            
            container.appendChild(tab.element);
            
            // Click on a theme swatch (simulates linked selection)
            const swatch = tab.element.querySelector('.swatch-grid .swatch[data-slot-index="5"]');
            swatch.click();
            
            // onChange should be called
            expect(onChange).toHaveBeenCalled();
            
            // Should include themeSlot for linking
            const call = onChange.mock.calls[0][0];
            expect(call.themeSlot).toBeDefined();
        });
    });

    describe('default swatches', () => {
        it('should render default color swatches', () => {
            const onChange = vi.fn();
            const tab = new SolidTab({
                fill: { color: '#ff0000' },
                onChange
            });
            
            container.appendChild(tab.element);
            
            // Look for default colors section
            const defaultSection = Array.from(tab.element.querySelectorAll('.swatch-section'))
                .find(section => section.textContent.includes('Default Colors'));
            
            expect(defaultSection).toBeDefined();
        });
        
        it('should have 16 default color swatches', () => {
            const onChange = vi.fn();
            const tab = new SolidTab({
                fill: { color: '#ff0000' },
                onChange
            });
            
            container.appendChild(tab.element);
            
            // Count swatches in default section (8 grays + 8 colors)
            const defaultSections = tab.element.querySelectorAll('.swatch-section');
            const lastSection = defaultSections[defaultSections.length - 1];
            const defaultSwatches = lastSection.querySelectorAll('.swatch');
            
            expect(defaultSwatches.length).toBe(16);
        });
    });

    describe('color picker area', () => {
        it('should render main color area', () => {
            const onChange = vi.fn();
            const tab = new SolidTab({
                fill: { color: '#ff0000' },
                onChange
            });
            
            container.appendChild(tab.element);
            
            // There should be multiple divs (color area has nested structure)
            const divs = tab.element.querySelectorAll('div');
            expect(divs.length).toBeGreaterThan(0);
        });
        
        it('should render hue slider', () => {
            const onChange = vi.fn();
            const tab = new SolidTab({
                fill: { color: '#ff0000' },
                onChange
            });
            
            container.appendChild(tab.element);
            
            // Find hue slider by its gradient background
            const slider = Array.from(tab.element.querySelectorAll('div'))
                .find(el => el.style.background?.includes('linear-gradient') && 
                            el.style.background?.includes('#f00'));
            
            expect(slider).toBeDefined();
        });
    });

    describe('hex input', () => {
        it('should render hex input field', () => {
            const onChange = vi.fn();
            const tab = new SolidTab({
                fill: { color: '#ff0000' },
                onChange
            });
            
            container.appendChild(tab.element);
            
            // SolidTab stores hex input as this.hexInput
            expect(tab.hexInput).toBeDefined();
            expect(tab.hexInput.tagName).toBe('INPUT');
        });
        
        it('should update state when hex input changes', () => {
            const onChange = vi.fn();
            const tab = new SolidTab({
                fill: { color: '#ff0000' },
                onChange
            });
            
            container.appendChild(tab.element);
            
            tab.hexInput.value = '#00ff00';
            tab.hexInput.dispatchEvent(new Event('change'));
            
            // onChange should be called
            expect(onChange).toHaveBeenCalled();
        });
    });

    describe('eyedropper', () => {
        it('should render eyedropper button', () => {
            const onChange = vi.fn();
            const tab = new SolidTab({
                fill: { color: '#ff0000' },
                onChange
            });
            
            container.appendChild(tab.element);
            
            // IconButton mock creates buttons
            const buttons = tab.element.querySelectorAll('button');
            expect(buttons.length).toBeGreaterThan(0);
        });
    });

    describe('emitChange', () => {
        it('should emit color change with hex value', () => {
            const onChange = vi.fn();
            const tab = new SolidTab({
                fill: { color: '#808080' },
                onChange
            });
            
            tab.emitChange();
            
            expect(onChange).toHaveBeenCalledWith(
                expect.objectContaining({
                    color: expect.any(String),
                    opacity: expect.any(Number),
                    value: expect.any(String)
                }),
                false
            );
        });
        
        it('should emit transient changes correctly', () => {
            const onChange = vi.fn();
            const tab = new SolidTab({
                fill: { color: '#808080' },
                onChange
            });
            
            tab.emitChange(true);
            
            expect(onChange).toHaveBeenCalledWith(
                expect.any(Object),
                true
            );
        });
    });

    describe('updateUI', () => {
        it('should update all UI components', () => {
            const onChange = vi.fn();
            const tab = new SolidTab({
                fill: { color: '#ff0000' },
                onChange
            });
            
            container.appendChild(tab.element);
            
            // Change state and update UI
            tab.state.h = 120;
            tab.state.s = 50;
            tab.state.b = 75;
            
            // This should not throw
            expect(() => tab.updateUI()).not.toThrow();
        });
    });
});
