import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock all dependencies before importing TextSection
vi.mock('../../../../src/core/Store.js', () => ({
    store: {
        getState: vi.fn(),
        dispatch: vi.fn()
    }
}));

vi.mock('../../../../src/ui/components/Section.js', () => ({
    Section: vi.fn(() => {
        const el = document.createElement('div');
        return {
            element: el,
            appendChild: (child) => el.appendChild(child)
        };
    })
}));

vi.mock('../../../../src/ui/components/NumberInput.js', () => ({
    NumberInput: vi.fn()
}));

vi.mock('../../../../src/ui/components/IconButton.js', () => ({
    IconButton: vi.fn(() => ({
        element: document.createElement('button'),
        setActive: vi.fn()
    }))
}));

vi.mock('../../../../src/ui/components/Button.js', () => ({
    Button: vi.fn(() => ({
        element: document.createElement('button')
    }))
}));

vi.mock('../../../../src/ui/components/Dropdown.js', () => ({
    Dropdown: vi.fn(() => ({
        element: document.createElement('div'),
        setValue: vi.fn(),
        setOptions: vi.fn()
    }))
}));

vi.mock('../../../../src/ui/components/FillFlyout/FillFlyout.js', () => ({
    FillFlyout: vi.fn(() => ({
        open: vi.fn(),
        close: vi.fn()
    }))
}));

vi.mock('../../../../src/ui/components/TypeSettingsFlyout.js', () => ({
    TypeSettingsFlyout: vi.fn(() => ({
        open: vi.fn(),
        close: vi.fn()
    }))
}));

vi.mock('../../../../src/ui/Icons.js', () => ({
    Icons: {
        MORE: '<svg>more</svg>',
        ALIGN_LEFT: '<svg>left</svg>',
        ALIGN_CENTER: '<svg>center</svg>',
        ALIGN_RIGHT: '<svg>right</svg>',
        ALIGN_TOP: '<svg>top</svg>',
        ALIGN_MIDDLE: '<svg>middle</svg>',
        ALIGN_BOTTOM: '<svg>bottom</svg>',
        SETTINGS: '<svg>settings</svg>'
    }
}));

vi.mock('../../../../src/utils/StyleResolver.js', () => ({
    StyleResolver: {
        getEffectiveTextProperties: vi.fn(() => ({
            fontFamily: 'Inter',
            fontWeight: '400',
            fontSize: 16,
            lineHeight: 1.2,
            letterSpacing: '0%',
            textAlign: 'left',
            verticalAlign: 'top',
            textFill: { type: 'solid', value: '#000000' }
        }))
    }
}));

vi.mock('../../../../src/core/FontManager.js', () => ({
    default: {
        getAvailableFonts: vi.fn(() => [
            { family: 'Inter' },
            { family: 'Roboto' },
            { family: 'Open Sans' }
        ]),
        loadFont: vi.fn()
    }
}));

vi.mock('../../../../src/utils/ColorUtils.js', () => ({
    ColorUtils: {
        parseColor: vi.fn((color) => ({ r: 0, g: 0, b: 0 }))
    }
}));

vi.mock('../../../../src/core/text/TextEditManager.js', () => ({
    textEditManager: {
        saveSelection: vi.fn(),
        restoreSelection: vi.fn()
    }
}));

vi.mock('../../../../src/core/services/PropertyMemoryManager.js', () => ({
    propertyMemory: {
        getMemory: vi.fn(),
        setMemory: vi.fn()
    }
}));

// Import after mocks
import { TextSection } from '../../../../src/ui/properties/TextSection.js';
import { store } from '../../../../src/core/Store.js';
import { Section } from '../../../../src/ui/components/Section.js';
import { NumberInput } from '../../../../src/ui/components/NumberInput.js';
import { IconButton } from '../../../../src/ui/components/IconButton.js';
import { Dropdown } from '../../../../src/ui/components/Dropdown.js';
import { Button } from '../../../../src/ui/components/Button.js';
import { StyleResolver } from '../../../../src/utils/StyleResolver.js';
import { textEditManager } from '../../../../src/core/text/TextEditManager.js';

describe('TextSection', () => {
    let textSection;
    let mockSectionElement;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers({ shouldAdvanceTime: true });
        vi.useFakeTimers({ shouldAdvanceTime: true });

        mockSectionElement = document.createElement('div');

        Section.mockImplementation(() => ({
            element: mockSectionElement,
            appendChild: vi.fn()
        }));

        NumberInput.mockImplementation(() => {
            const el = document.createElement('div');
            const input = document.createElement('input');
            input.type = 'text';
            el.appendChild(input);
            return { element: el, setValue: vi.fn() };
        });

        // Mock window.getSelection
        window.getSelection = vi.fn(() => ({
            isCollapsed: false,
            getRangeAt: vi.fn(),
            removeAllRanges: vi.fn(),
            addRange: vi.fn()
        }));

        IconButton.mockImplementation(() => ({
            element: document.createElement('button')
        }));

        Dropdown.mockImplementation(() => ({
            element: document.createElement('div'),
            setValue: vi.fn(),
            setOptions: vi.fn()
        }));

        store.getState.mockReturnValue({
            editor: {
                mode: 'edit',
                activeSlideId: 'slide-1',
                selectedElementIds: ['element-1'],
                editingElementId: null
            },
            slides: {
                'slide-1': {
                    id: 'slide-1',
                    elements: {
                        'element-1': {
                            id: 'element-1',
                            type: 'text',
                            fontFamily: 'Inter',
                            fontSize: 16
                        }
                    }
                }
            },
            slideMasterPresets: {
                'master-default': {
                    type: 'theme',
                    themeSettings: {
                        textStyles: {},
                        fonts: { heading: 'Inter', body: 'Inter' },
                        colors: { textPrimary: '#333333' }
                    }
                }
            }
        });

        // Mock isColorDark to avoid canvas issues in JSDOM
        vi.spyOn(TextSection.prototype, 'isColorDark').mockReturnValue(false);

        textSection = new TextSection();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        vi.restoreAllMocks();
        document.body.innerHTML = '';
    });

    describe('constructor', () => {
        it('should create an instance', () => {
            expect(textSection).toBeDefined();
        });

        it('should create a Section with title Typography', () => {
            expect(Section).toHaveBeenCalledWith(
                expect.objectContaining({ title: 'Typography' })
            );
        });

        it('should initialize activeFlyout as null', () => {
            expect(textSection.activeFlyout).toBeNull();
        });

        it('should initialize currentStyleId as null', () => {
            expect(textSection.currentStyleId).toBeNull();
        });

        it('should initialize hasStyleOverrides as false', () => {
            expect(textSection.hasStyleOverrides).toBe(false);
        });
    });

    describe('update()', () => {
        it('should hide section when no text elements selected', () => {
            store.getState.mockReturnValue({
                editor: { mode: 'edit', activeSlideId: 'slide-1', selectedElementIds: ['el-1'] },
                slides: {
                    'slide-1': {
                        elements: {
                            'el-1': { id: 'el-1', type: 'shape' }
                        }
                    }
                },
                slideMasterPresets: {}
            });

            textSection.update(['el-1']);
            expect(mockSectionElement.style.display).toBe('none');
        });

        it('should show section when text element is selected', () => {
            textSection.update(['element-1']);
            expect(mockSectionElement.style.display).toBe('block');
        });

        it('should call StyleResolver.getEffectiveTextProperties', () => {
            textSection.update(['element-1']);
            expect(StyleResolver.getEffectiveTextProperties).toHaveBeenCalled();
        });
    });

    describe('getElement()', () => {
        it('should get element from slide in edit mode', () => {
            const state = store.getState();
            const element = textSection.getElement(state, 'element-1');
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
                            'el-m1': { id: 'el-m1', type: 'text' }
                        }
                    }
                }
            });
            const state = store.getState();
            const element = textSection.getElement(state, 'el-m1');
            expect(element).toBeDefined();
            expect(element.id).toBe('el-m1');
        });

        it('should return undefined for non-existent element', () => {
            const state = store.getState();
            const element = textSection.getElement(state, 'non-existent');
            expect(element).toBeUndefined();
        });
    });

    describe('updateProperty()', () => {
        it('should dispatch UPDATE_ELEMENT for each selected element', () => {
            store.getState.mockReturnValue({
                editor: {
                    mode: 'edit',
                    activeSlideId: 'slide-1',
                    selectedElementIds: ['el-1', 'el-2'],
                    editingElementId: null
                },
                slides: { 'slide-1': { elements: {} } },
                slideMasterPresets: {}
            });

            textSection.updateProperty('fontSize', 24);

            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT', { id: 'el-1', fontSize: 24 });
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT', { id: 'el-2', fontSize: 24 });
        });
    });

    describe('getActiveThemeId()', () => {
        it('should return theme master id', () => {
            const state = store.getState();
            const themeId = textSection.getActiveThemeId(state);
            expect(themeId).toBe('master-default');
        });

        it('should return default if no theme master found', () => {
            store.getState.mockReturnValue({
                editor: {},
                slides: {},
                slideMasterPresets: {}
            });
            const state = store.getState();
            const themeId = textSection.getActiveThemeId(state);
            expect(themeId).toBe('master-default');
        });
    });

    describe('getTextStyleOptions()', () => {
        it('should return array with No Style option', () => {
            const options = textSection.getTextStyleOptions();
            expect(options[0]).toEqual({ label: 'No Style', value: '' });
        });

        it('should include Create Style action', () => {
            const options = textSection.getTextStyleOptions();
            const createOption = options.find(o => o.value === '__create__');
            expect(createOption).toBeDefined();
            expect(createOption.action).toBe(true);
        });
    });

    describe('resolveStyleVariables()', () => {
        it('should resolve font variables', () => {
            const style = {
                id: 'h1',
                name: 'Heading 1',
                fontFamily: 'var(--theme-font-heading)'
            };
            const theme = {
                themeSettings: {
                    fonts: { heading: 'Roboto', body: 'Inter' },
                    colors: {}
                }
            };

            const resolved = textSection.resolveStyleVariables(style, theme);
            expect(resolved.fontFamily).toBe('Roboto');
        });

        it('should resolve color variables in textFill', () => {
            const style = {
                id: 'body',
                name: 'Body',
                textFill: { type: 'solid', value: 'var(--theme-text-primary)' }
            };
            const theme = {
                themeSettings: {
                    fonts: {},
                    colors: { textPrimary: '#FF0000' }
                }
            };

            const resolved = textSection.resolveStyleVariables(style, theme);
            expect(resolved.textFill.value).toBe('#FF0000');
        });
    });

    describe('applyTextStyle()', () => {
        it('should handle __create__ action', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            textSection.applyTextStyle('__create__');
            expect(consoleSpy).toHaveBeenCalledWith('Create style dialog - coming soon');
            consoleSpy.mockRestore();
        });

        it('should detach style when empty string passed', () => {
            store.getState.mockReturnValue({
                editor: {
                    mode: 'edit',
                    activeSlideId: 'slide-1',
                    selectedElementIds: ['el-1']
                },
                slides: { 'slide-1': { elements: {} } },
                slideMasterPresets: {}
            });

            textSection.applyTextStyle('');

            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT', { id: 'el-1', styleId: null });
            expect(textSection.currentStyleId).toBeNull();
        });
    });

    describe('detachStyle()', () => {
        it('should dispatch UPDATE_ELEMENT with null styleId', () => {
            store.getState.mockReturnValue({
                editor: {
                    mode: 'edit',
                    activeSlideId: 'slide-1',
                    selectedElementIds: ['el-1']
                },
                slides: { 'slide-1': { elements: {} } },
                slideMasterPresets: {}
            });

            textSection.detachStyle();

            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT', { id: 'el-1', styleId: null });
        });

        it('should reset currentStyleId to null', () => {
            textSection.currentStyleId = 'h1';
            store.getState.mockReturnValue({
                editor: { selectedElementIds: [] },
                slides: {},
                slideMasterPresets: {}
            });

            textSection.detachStyle();

            expect(textSection.currentStyleId).toBeNull();
        });
    });

    describe('checkForStyleOverrides()', () => {
        it('should return false if no style', () => {
            const result = textSection.checkForStyleOverrides({}, null);
            expect(result).toBe(false);
        });

        it('should return false if element matches style', () => {
            const element = { fontSize: 16 };
            const style = { id: 'body', name: 'Body', fontSize: 16 };

            const result = textSection.checkForStyleOverrides(element, style);
            expect(result).toBe(false);
        });

        it('should return true if element differs from style', () => {
            const element = { fontSize: 24 };
            const style = { id: 'body', name: 'Body', fontSize: 16 };

            const result = textSection.checkForStyleOverrides(element, style);
            expect(result).toBe(true);
        });
    });

    describe('getOpacity()', () => {
        it('should return 100 for hex color', () => {
            expect(textSection.getOpacity('#FF0000')).toBe(100);
        });

        it('should extract opacity from rgba', () => {
            expect(textSection.getOpacity('rgba(255, 0, 0, 0.5)')).toBe(50);
        });

        it('should return 100 for null/undefined', () => {
            expect(textSection.getOpacity(null)).toBe(100);
            expect(textSection.getOpacity(undefined)).toBe(100);
        });
    });

    describe('getGradientCss()', () => {
        it('should generate linear gradient CSS', () => {
            const gradient = {
                type: 'linear',
                angle: 90,
                stops: [
                    { color: '#000', position: 0 },
                    { color: '#fff', position: 100 }
                ]
            };
            const result = textSection.getGradientCss(gradient);
            expect(result).toBe('linear-gradient(90deg, #000 0%, #fff 100%)');
        });

        it('should generate radial gradient CSS', () => {
            const gradient = {
                type: 'radial',
                stops: [
                    { color: '#FF0000', position: 0 },
                    { color: '#0000FF', position: 100 }
                ]
            };
            const result = textSection.getGradientCss(gradient);
            expect(result).toBe('radial-gradient(circle, #FF0000 0%, #0000FF 100%)');
        });

        it('should generate conic gradient CSS', () => {
            const gradient = {
                type: 'angular',
                angle: 45,
                stops: [
                    { color: '#FF0000', position: 0 },
                    { color: '#00FF00', position: 100 }
                ]
            };
            const result = textSection.getGradientCss(gradient);
            expect(result).toBe('conic-gradient(from 45deg at center, #FF0000 0%, #00FF00 100%)');
        });
    });

    describe('toCssProperty()', () => {
        it('should convert camelCase to kebab-case', () => {
            expect(textSection.toCssProperty('fontSize')).toBe('font-size');
            expect(textSection.toCssProperty('lineHeight')).toBe('line-height');
            expect(textSection.toCssProperty('textAlign')).toBe('text-align');
        });
    });

    describe('toCamelCase()', () => {
        it('should convert kebab-case to camelCase', () => {
            expect(textSection.toCamelCase('font-size')).toBe('fontSize');
            expect(textSection.toCamelCase('line-height')).toBe('lineHeight');
            expect(textSection.toCamelCase('text-align')).toBe('textAlign');
        });
    });
});

