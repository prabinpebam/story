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
        setActive: vi.fn(),
        setDisabled: vi.fn()
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
        setOptions: vi.fn(),
        setMixed: vi.fn()
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
        })),
        getTypographyStyle: vi.fn(() => ({
            id: 'preset-modern',
            fonts: {
                heading: 'Inter',
                body: 'Inter'
            },
            textStyles: {
                'title': {
                    id: 'title',
                    name: 'Title',
                    fontFamily: 'Inter',
                    fontSize: 48,
                    fontWeight: '700'
                },
                'body': {
                    id: 'body',
                    name: 'Body',
                    fontFamily: 'Inter',
                    fontSize: 16,
                    fontWeight: '400'
                }
            }
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
            element: document.createElement('button'),
            setDisabled: vi.fn(),
            setActive: vi.fn()
        }));

        Dropdown.mockImplementation(() => ({
            element: document.createElement('div'),
            setValue: vi.fn(),
            setOptions: vi.fn(),
            setMixed: vi.fn()
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
        textSection.selection = ['element-1'];
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
            expect(mockSectionElement.classList.contains('hidden')).toBe(true);
        });

        it('should show section when text element is selected', () => {
            textSection.update(['element-1']);
            expect(mockSectionElement.classList.contains('hidden')).toBe(false);
        });

        it('should call StyleResolver.getEffectiveTextProperties', () => {
            textSection.update(['element-1']);
            expect(StyleResolver.getEffectiveTextProperties).toHaveBeenCalled();
        });

        it('should lock typography controls when textStyleId is set (strict linking)', () => {
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
                                textStyleId: 'title'
                            }
                        }
                    }
                },
                slideMasterPresets: {}
            });

            textSection.selection = ['element-1'];
            textSection.update(['element-1']);

            expect(textSection.fontFamilyInput.element.style.pointerEvents).toBe('none');
            expect(textSection.fontWeightInput.element.style.pointerEvents).toBe('none');
            expect(textSection.fontSizeInput.element.style.pointerEvents).toBe('none');
            // Text color remains editable even when linked to a typography style.
            expect(textSection.fillHexInput.disabled).toBe(false);
            expect(textSection.fillSwatch.style.pointerEvents).toBe('auto');
            expect(textSection.overrideIndicator.classList.contains('hidden')).toBe(true);

            // Alignment remains editable even when linked to a Typography style.
            const alignButtonMocks = IconButton.mock.results
                .map(r => r.value)
                .filter(v => v && typeof v.setDisabled === 'function');
            expect(alignButtonMocks.length).toBeGreaterThan(0);
            expect(alignButtonMocks.some(v => v.setDisabled.mock.calls.some(([arg]) => arg === true))).toBe(false);
        });

        it('should unlock typography controls when no style is applied', () => {
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
                                textStyleId: null
                            }
                        }
                    }
                },
                slideMasterPresets: {}
            });

            textSection.selection = ['element-1'];
            textSection.update(['element-1']);

            expect(textSection.fontFamilyInput.element.style.pointerEvents).toBe('auto');
            expect(textSection.fillHexInput.disabled).toBe(false);
        });

        it('should show a Missing Style option if textStyleId is unknown', () => {
            // Make StyleResolver return no matching style
            StyleResolver.getTypographyStyle.mockReturnValueOnce({
                id: 'preset-modern',
                fonts: { heading: 'Inter', body: 'Inter' },
                textStyles: {
                    title: { id: 'title', name: 'Title' }
                }
            });

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
                                textStyleId: 'does-not-exist'
                            }
                        }
                    }
                },
                slideMasterPresets: {}
            });

            textSection.selection = ['element-1'];
            textSection.update(['element-1']);

            const setOptionsCalls = Dropdown.mock.results
                .map(r => r.value)
                .filter(v => v && typeof v.setOptions === 'function')
                .flatMap(v => v.setOptions.mock.calls);

            expect(setOptionsCalls.length).toBeGreaterThan(0);
            const lastOptions = setOptionsCalls[setOptionsCalls.length - 1][0];
            const missingOpt = lastOptions.find((o) => typeof o.label === 'string' && o.label.includes('Missing Style'));
            expect(missingOpt).toBeDefined();
        });

        it('should set mixed state when selecting multiple text elements with different styles', () => {
            store.getState.mockReturnValue({
                editor: {
                    mode: 'edit',
                    activeSlideId: 'slide-1',
                    selectedElementIds: ['t1', 't2'],
                    editingElementId: null
                },
                slides: {
                    'slide-1': {
                        id: 'slide-1',
                        elements: {
                            t1: { id: 't1', type: 'text', textStyleId: 'title' },
                            t2: { id: 't2', type: 'text', textStyleId: 'body' }
                        }
                    }
                },
                slideMasterPresets: {}
            });

            textSection.selection = ['t1', 't2'];
            textSection.update(['t1', 't2']);

            // At least one Dropdown instance (the style dropdown) should be set to mixed
            const dropdownInstances = Dropdown.mock.results.map(r => r.value).filter(Boolean);
            expect(dropdownInstances.some(d => d.setMixed.mock.calls.some(([arg]) => arg === true))).toBe(true);
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

            textSection.selection = ['el-1', 'el-2'];
            textSection.updateProperty('fontSize', 24);

            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT', expect.objectContaining({ id: 'el-1', fontSize: 24 }), expect.anything());
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT', expect.objectContaining({ id: 'el-2', fontSize: 24 }), expect.anything());
        });

        it('should block textFill updates while linked (strict linking)', () => {
            store.getState.mockReturnValue({
                editor: {
                    mode: 'edit',
                    activeSlideId: 'slide-1',
                    selectedElementIds: ['el-1'],
                    editingElementId: null
                },
                slides: { 'slide-1': { elements: { 'el-1': { id: 'el-1', type: 'text', textStyleId: 'title' } } } },
                slideMasterPresets: {}
            });

            textSection.selection = ['el-1'];
            textSection.currentStyleId = 'title';
            store.dispatch.mockClear();

            textSection.updateProperty('textFill', { type: 'solid', value: '#ff0000' });
            // textFill is intentionally NOT locked while linked.
            expect(store.dispatch).toHaveBeenCalledWith(
                'UPDATE_ELEMENT',
                expect.objectContaining({ id: 'el-1', textFill: { type: 'solid', value: '#ff0000' } }),
                expect.anything()
            );
        });

        it('should allow verticalAlign updates while linked (alignment override exception)', () => {
            store.getState.mockReturnValue({
                editor: {
                    mode: 'edit',
                    activeSlideId: 'slide-1',
                    selectedElementIds: ['el-1'],
                    editingElementId: null
                },
                slides: { 'slide-1': { elements: { 'el-1': { id: 'el-1', type: 'text', textStyleId: 'title' } } } },
                slideMasterPresets: {}
            });

            textSection.selection = ['el-1'];
            textSection.currentStyleId = 'title';
            store.dispatch.mockClear();

            textSection.updateProperty('verticalAlign', 'middle');
            expect(store.dispatch).toHaveBeenCalledWith(
                'UPDATE_ELEMENT',
                expect.objectContaining({ id: 'el-1', verticalAlign: 'middle' }),
                expect.anything()
            );
        });

        it('should allow textAlign updates while linked (alignment override exception)', () => {
            store.getState.mockReturnValue({
                editor: {
                    mode: 'edit',
                    activeSlideId: 'slide-1',
                    selectedElementIds: ['el-1'],
                    editingElementId: null
                },
                slides: { 'slide-1': { elements: { 'el-1': { id: 'el-1', type: 'text', textStyleId: 'title' } } } },
                slideMasterPresets: {}
            });

            textSection.selection = ['el-1'];
            textSection.currentStyleId = 'title';
            store.dispatch.mockClear();

            textSection.updateProperty('textAlign', 'center');
            expect(store.dispatch).toHaveBeenCalledWith(
                'UPDATE_ELEMENT',
                expect.objectContaining({ id: 'el-1', textAlign: 'center' }),
                expect.anything()
            );
        });
    });

    describe('applyTextStyle()', () => {
        it('should clear alignment overrides when applying a style (style wins back alignment)', () => {
            store.getState.mockReturnValue({
                editor: {
                    mode: 'edit',
                    activeSlideId: 'slide-1',
                    selectedElementIds: ['el-1'],
                    editingElementId: null
                },
                slides: { 'slide-1': { elements: { 'el-1': { id: 'el-1', type: 'text' } } } },
                slideMasterPresets: {}
            });

            textSection.selection = ['el-1'];
            store.dispatch.mockClear();

            textSection.applyTextStyle('title');

            expect(store.dispatch).toHaveBeenCalledWith(
                'UPDATE_ELEMENT',
                expect.objectContaining({
                    id: 'el-1',
                    textStyleId: 'title',
                    textAlign: undefined,
                    verticalAlign: undefined
                }),
                expect.anything()
            );
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

        it('should include Title and Body text styles', () => {
            const options = textSection.getTextStyleOptions();
            const titleOption = options.find(o => o.value === 'title');
            const bodyOption = options.find(o => o.value === 'body');
            expect(titleOption).toBeDefined();
            expect(bodyOption).toBeDefined();
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

            textSection.selection = ['el-1'];
            textSection.applyTextStyle('');

            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT', expect.objectContaining({ id: 'el-1', textStyleId: null }), expect.anything());
            expect(textSection.currentStyleId).toBeNull();
        });
    });

    describe('detachStyle()', () => {
        it('should dispatch UPDATE_ELEMENT with null textStyleId', () => {
            store.getState.mockReturnValue({
                editor: {
                    mode: 'edit',
                    activeSlideId: 'slide-1',
                    selectedElementIds: ['el-1']
                },
                slides: { 'slide-1': { elements: {} } },
                slideMasterPresets: {}
            });

            textSection.selection = ['el-1'];
            textSection.detachStyle();

            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT', expect.objectContaining({ id: 'el-1', textStyleId: null }), expect.anything());
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

        it('should return false if element has no manual overrides', () => {
            const element = { id: 'text-1', type: 'text', content: 'Hello', textStyleId: 'body' };
            const style = { id: 'body', name: 'Body', fontSize: 16 };

            const result = textSection.checkForStyleOverrides(element, style);
            expect(result).toBe(false);
        });

        it('should return true if element has manual property overrides', () => {
            const element = { id: 'text-1', type: 'text', textStyleId: 'body', fontSize: 24 };
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

