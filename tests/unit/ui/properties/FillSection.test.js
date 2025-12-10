import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all dependencies before importing FillSection
vi.mock('../../../../src/core/Store.js', () => ({
    store: {
        getState: vi.fn(),
        dispatch: vi.fn()
    }
}));

vi.mock('../../../../src/ui/components/Section.js', () => ({
    Section: vi.fn()
}));

vi.mock('../../../../src/ui/components/NumberInput.js', () => ({
    NumberInput: vi.fn()
}));

vi.mock('../../../../src/ui/components/IconButton.js', () => ({
    IconButton: vi.fn()
}));

vi.mock('../../../../src/ui/components/ColorInput.js', () => ({
    ColorInput: vi.fn()
}));

vi.mock('../../../../src/ui/components/FillFlyout/FillFlyout.js', () => ({
    FillFlyout: vi.fn()
}));

vi.mock('../../../../src/ui/components/EmptyState.js', () => ({
    EmptyState: vi.fn()
}));

vi.mock('../../../../src/ui/Icons.js', () => ({
    Icons: {
        PLUS: '<svg>plus</svg>',
        MINUS: '<svg>minus</svg>',
        DRAG_HANDLE: '<svg>drag</svg>',
        VISIBLE: '<svg>visible</svg>',
        HIDDEN: '<svg>hidden</svg>',
        BLEND_MODE: '<svg>blend</svg>'
    }
}));

vi.mock('../../../../src/core/constants/BlendModes.js', () => ({
    BlendModes: [
        { id: 'normal', label: 'Normal' },
        { id: 'multiply', label: 'Multiply' }
    ]
}));

// Import after mocks
import { FillSection } from '../../../../src/ui/properties/FillSection.js';
import { store } from '../../../../src/core/Store.js';
import { Section } from '../../../../src/ui/components/Section.js';
import { NumberInput } from '../../../../src/ui/components/NumberInput.js';
import { IconButton } from '../../../../src/ui/components/IconButton.js';
import { EmptyState } from '../../../../src/ui/components/EmptyState.js';
import { FillFlyout } from '../../../../src/ui/components/FillFlyout/FillFlyout.js';

describe('FillSection', () => {
    let fillSection;
    let mockSectionElement;

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup mock elements
        mockSectionElement = document.createElement('div');

        // Setup Section mock
        Section.mockImplementation(() => ({
            element: mockSectionElement,
            appendChild: vi.fn()
        }));

        // Setup NumberInput mock
        NumberInput.mockImplementation(() => {
            const el = document.createElement('div');
            el.innerHTML = '<input type="text" />';
            return { element: el, setValue: vi.fn() };
        });

        // Setup IconButton mock
        IconButton.mockImplementation(() => ({
            element: document.createElement('button')
        }));

        // Setup EmptyState mock
        EmptyState.mockImplementation((msg) => {
            const el = document.createElement('div');
            el.textContent = msg;
            return { element: el };
        });

        // Setup FillFlyout mock
        FillFlyout.mockImplementation(() => ({
            open: vi.fn(),
            close: vi.fn(),
            destroy: vi.fn()
        }));

        // Setup store mock
        store.getState.mockReturnValue({
            editor: {
                mode: 'edit',
                activeSlideId: 'slide-1',
                selectedElementIds: ['element-1']
            },
            slides: {
                'slide-1': {
                    id: 'slide-1',
                    elements: {
                        'element-1': {
                            id: 'element-1',
                            style: {
                                fills: [
                                    { type: 'solid', color: '#FF0000', opacity: 100, visible: true }
                                ]
                            }
                        }
                    }
                }
            },
            slideMasterPresets: {}
        });

        fillSection = new FillSection();
        fillSection.selection = ['element-1'];
    });

    describe('constructor', () => {
        it('should create an instance', () => {
            expect(fillSection).toBeDefined();
        });

        it('should create a Section with title Fill', () => {
            expect(Section).toHaveBeenCalledWith(
                expect.objectContaining({ title: 'Fill' })
            );
        });

        it('should create section with add fill action', () => {
            expect(Section).toHaveBeenCalledWith(
                expect.objectContaining({
                    actions: expect.arrayContaining([
                        expect.objectContaining({ title: 'Add Fill' })
                    ])
                })
            );
        });

        it('should use custom title from options', () => {
            Section.mockClear();
            new FillSection({ title: 'Background' });
            expect(Section).toHaveBeenCalledWith(
                expect.objectContaining({ title: 'Background' })
            );
        });

        it('should create a container element', () => {
            expect(fillSection.container).toBeDefined();
            expect(fillSection.container.className).toBe('pi-section-content');
        });
    });

    describe('update()', () => {
        it('should hide section when selection is empty', () => {
            fillSection.update([]);
            expect(mockSectionElement.classList.contains('hidden')).toBe(true);
        });

        it('should hide section when selection is null', () => {
            fillSection.update(null);
            expect(mockSectionElement.classList.contains('hidden')).toBe(true);
        });

        it('should show section when selection has elements', () => {
            fillSection.update(['element-1']);
            expect(mockSectionElement.classList.contains('hidden')).toBe(false);
        });

        it('should store selection for later use', () => {
            fillSection.update(['element-1', 'element-2']);
            expect(fillSection.selection).toEqual(['element-1', 'element-2']);
        });
    });

    describe('getElement()', () => {
        it('should get element from slide in edit mode', () => {
            const state = store.getState();
            const element = fillSection.getElement(state, 'element-1');
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
                            'el-m1': { id: 'el-m1', style: {} }
                        }
                    }
                }
            });
            const state = store.getState();
            const element = fillSection.getElement(state, 'el-m1');
            expect(element).toBeDefined();
            expect(element.id).toBe('el-m1');
        });

        it('should return undefined for non-existent element', () => {
            const state = store.getState();
            const element = fillSection.getElement(state, 'non-existent');
            expect(element).toBeUndefined();
        });
    });

    describe('render()', () => {
        it('should clear container before rendering', () => {
            fillSection.container.innerHTML = '<div>old</div>';
            fillSection.render({ id: 'el-1', style: { fills: [] } });
            expect(fillSection.container.innerHTML).not.toContain('old');
        });

        it('should render empty state when no fills', () => {
            fillSection.render({ id: 'el-1', style: {} });
            expect(EmptyState).toHaveBeenCalledWith('No fill');
        });

        it('should render fill rows for each fill', () => {
            fillSection.render({
                id: 'el-1',
                style: {
                    fills: [
                        { type: 'solid', color: '#FF0000', visible: true },
                        { type: 'solid', color: '#00FF00', visible: true }
                    ]
                }
            });
            const rows = fillSection.container.querySelectorAll('.pi-property-row');
            expect(rows.length).toBe(2);
        });
    });

    describe('createFillRow()', () => {
        it('should create row with data-index', () => {
            const fill = { type: 'solid', color: '#FF0000', visible: true };
            const row = fillSection.createFillRow({ id: 'el-1', style: { fills: [fill] } }, fill, 2, [fill]);
            expect(row.dataset.index).toBe('2');
        });

        it('should create draggable handle', () => {
            const fill = { type: 'solid', color: '#FF0000', visible: true };
            const row = fillSection.createFillRow({ id: 'el-1', style: { fills: [fill] } }, fill, 0, [fill]);
            const dragHandle = row.querySelector('.pi-property-row__handle');
            expect(dragHandle).toBeTruthy();
        });

        it('should reduce swatch opacity for hidden fills', () => {
            const fill = { type: 'solid', color: '#FF0000', visible: false };
            const row = fillSection.createFillRow({ id: 'el-1', style: { fills: [fill] } }, fill, 0, [fill]);
            const swatch = row.querySelector('.fill-swatch-trigger');
            expect(swatch.classList.contains('fill-disabled')).toBe(true);
        });

        // Phase 4.1: Theme-linked fill indicators
        describe('theme-linked fills', () => {
            it('should add fill-linked class when themeSlot is set', () => {
                const fill = { type: 'solid', color: '#FF0000', visible: true, themeSlot: 0 };
                const row = fillSection.createFillRow({ id: 'el-1', style: { fills: [fill] } }, fill, 0, [fill]);
                expect(row.classList.contains('fill-linked')).toBe(true);
            });

            it('should not add fill-linked class when themeSlot is undefined', () => {
                const fill = { type: 'solid', color: '#FF0000', visible: true };
                const row = fillSection.createFillRow({ id: 'el-1', style: { fills: [fill] } }, fill, 0, [fill]);
                expect(row.classList.contains('fill-linked')).toBe(false);
            });

            it('should not add fill-linked class when themeSlot is null', () => {
                const fill = { type: 'solid', color: '#FF0000', visible: true, themeSlot: null };
                const row = fillSection.createFillRow({ id: 'el-1', style: { fills: [fill] } }, fill, 0, [fill]);
                expect(row.classList.contains('fill-linked')).toBe(false);
            });

            it('should show link icon for theme-linked fills', () => {
                const fill = { type: 'solid', color: '#FF0000', visible: true, themeSlot: 5 };
                const row = fillSection.createFillRow({ id: 'el-1', style: { fills: [fill] } }, fill, 0, [fill]);
                const linkIcon = row.querySelector('.fill-linked-icon');
                expect(linkIcon).toBeTruthy();
            });

            it('should not show link icon for non-linked fills', () => {
                const fill = { type: 'solid', color: '#FF0000', visible: true };
                const row = fillSection.createFillRow({ id: 'el-1', style: { fills: [fill] } }, fill, 0, [fill]);
                const linkIcon = row.querySelector('.fill-linked-icon');
                expect(linkIcon).toBeFalsy();
            });

            it('should display slot label in hex input for linked fills', () => {
                const fill = { type: 'solid', color: '#FF0000', visible: true, themeSlot: 3 };
                const row = fillSection.createFillRow({ id: 'el-1', style: { fills: [fill] } }, fill, 0, [fill]);
                const hexInput = row.querySelector('.fill-hex-input');
                // Should show slot name/number instead of hex
                expect(hexInput.value).not.toBe('#FF0000');
                expect(hexInput.classList.contains('fill-hex-input--linked')).toBe(true);
            });

            it('should display hex value in hex input for non-linked fills', () => {
                const fill = { type: 'solid', color: '#FF0000', visible: true };
                const row = fillSection.createFillRow({ id: 'el-1', style: { fills: [fill] } }, fill, 0, [fill]);
                const hexInput = row.querySelector('.fill-hex-input');
                expect(hexInput.value).toBe('#FF0000');
                expect(hexInput.classList.contains('fill-hex-input--linked')).toBe(false);
            });

            it('should add title attribute with theme link info', () => {
                const fill = { type: 'solid', color: '#FF0000', visible: true, themeSlot: 7 };
                const row = fillSection.createFillRow({ id: 'el-1', style: { fills: [fill] } }, fill, 0, [fill]);
                const linkIcon = row.querySelector('.fill-linked-icon');
                expect(linkIcon.title).toContain('theme');
            });

            it('should handle numeric slot index 0 as linked', () => {
                // Edge case: slot 0 is falsy but valid
                const fill = { type: 'solid', color: '#FF0000', visible: true, themeSlot: 0 };
                const row = fillSection.createFillRow({ id: 'el-1', style: { fills: [fill] } }, fill, 0, [fill]);
                expect(row.classList.contains('fill-linked')).toBe(true);
            });
        });
    });

    describe('addFill()', () => {
        it('should do nothing if no selection', () => {
            fillSection.selection = null;
            fillSection.addFill();
            expect(store.dispatch).not.toHaveBeenCalled();
        });

        it('should dispatch UPDATE_ELEMENT with new fill', () => {
            fillSection.selection = ['element-1'];
            fillSection.addFill();
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                expect.objectContaining({
                    id: 'element-1',
                    style: expect.objectContaining({
                        fills: expect.any(Array)
                    })
                }),
                expect.any(Object)
            );
        });

        it('should add fill with 100% opacity if first fill', () => {
            store.getState.mockReturnValue({
                editor: { mode: 'edit', activeSlideId: 'slide-1' },
                slides: {
                    'slide-1': {
                        elements: { 'element-1': { id: 'element-1', style: {} } }
                    }
                }
            });
            fillSection.selection = ['element-1'];
            fillSection.addFill();
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                expect.objectContaining({
                    style: expect.objectContaining({
                        fills: expect.arrayContaining([
                            expect.objectContaining({ opacity: 100 })
                        ])
                    })
                }),
                expect.any(Object)
            );
        });

        it('should use custom onUpdate callback if provided', () => {
            const onUpdate = vi.fn();
            const customSection = new FillSection({ onUpdate });
            customSection.selection = ['element-1'];
            customSection.addFill();
            expect(onUpdate).toHaveBeenCalled();
            expect(store.dispatch).not.toHaveBeenCalled();
        });
    });

    describe('removeFill()', () => {
        it('should remove fill at specified index', () => {
            const element = {
                id: 'element-1',
                style: {
                    fills: [
                        { type: 'solid', color: '#FF0000' },
                        { type: 'solid', color: '#00FF00' }
                    ]
                }
            };
            fillSection.removeFill(element, 0);
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                expect.objectContaining({
                    id: 'element-1',
                    style: expect.objectContaining({
                        fills: [{ type: 'solid', color: '#00FF00' }]
                    })
                }),
                expect.any(Object)
            );
        });

        it('should use custom onUpdate callback if provided', () => {
            const onUpdate = vi.fn();
            const customSection = new FillSection({ onUpdate });
            const element = {
                id: 'element-1',
                style: { fills: [{ type: 'solid', color: '#FF0000' }] }
            };
            customSection.removeFill(element, 0);
            expect(onUpdate).toHaveBeenCalledWith([], false);
        });
    });

    describe('updateFill()', () => {
        it('should update fill opacity', () => {
            const element = {
                id: 'element-1',
                style: { fills: [{ type: 'solid', color: '#FF0000', opacity: 100 }] }
            };
            fillSection.updateFill(element, 0, { opacity: 50 });
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                expect.objectContaining({
                    style: expect.objectContaining({
                        fills: expect.arrayContaining([
                            expect.objectContaining({ opacity: 50 })
                        ])
                    })
                }),
                expect.any(Object)
            );
        });

        it('should update fill visibility', () => {
            const element = {
                id: 'element-1',
                style: { fills: [{ type: 'solid', color: '#FF0000', visible: true }] }
            };
            fillSection.updateFill(element, 0, { visible: false });
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                expect.objectContaining({
                    style: expect.objectContaining({
                        fills: expect.arrayContaining([
                            expect.objectContaining({ visible: false })
                        ])
                    })
                }),
                expect.any(Object)
            );
        });

        it('should skip history for transient updates', () => {
            const element = {
                id: 'element-1',
                style: { fills: [{ type: 'solid', color: '#FF0000' }] }
            };
            fillSection.updateFill(element, 0, { opacity: 75 }, true);
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                expect.any(Object),
                { skipHistory: true }
            );
        });

        // Phase 4.1: Theme slot linking/unlinking in updateFill
        describe('theme slot handling', () => {
            it('should unlink from theme when color is manually changed', () => {
                const element = {
                    id: 'element-1',
                    style: { fills: [{ type: 'solid', color: '#FF0000', themeSlot: 5 }] }
                };
                fillSection.updateFill(element, 0, { color: '#00FF00' });
                expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                    expect.objectContaining({
                        style: expect.objectContaining({
                            fills: expect.arrayContaining([
                                expect.not.objectContaining({ themeSlot: 5 })
                            ])
                        })
                    }),
                    expect.any(Object)
                );
            });

            it('should link to theme when themeSlot is set', () => {
                const element = {
                    id: 'element-1',
                    style: { fills: [{ type: 'solid', color: '#FF0000' }] }
                };
                fillSection.updateFill(element, 0, { themeSlot: 3 });
                expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                    expect.objectContaining({
                        style: expect.objectContaining({
                            fills: expect.arrayContaining([
                                expect.objectContaining({ themeSlot: 3 })
                            ])
                        })
                    }),
                    expect.any(Object)
                );
            });

            it('should unlink from theme when themeSlot is set to null', () => {
                const element = {
                    id: 'element-1',
                    style: { fills: [{ type: 'solid', color: '#FF0000', themeSlot: 7 }] }
                };
                fillSection.updateFill(element, 0, { themeSlot: null });
                expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                    expect.objectContaining({
                        style: expect.objectContaining({
                            fills: expect.arrayContaining([
                                expect.not.objectContaining({ themeSlot: expect.anything() })
                            ])
                        })
                    }),
                    expect.any(Object)
                );
            });

            it('should preserve themeSlot when updating opacity', () => {
                // Update store mock to include themeSlot in the element
                store.getState.mockReturnValue({
                    editor: { mode: 'edit', activeSlideId: 'slide-1' },
                    slides: {
                        'slide-1': {
                            elements: {
                                'element-1': {
                                    id: 'element-1',
                                    style: { fills: [{ type: 'solid', color: '#FF0000', themeSlot: 2, opacity: 100 }] }
                                }
                            }
                        }
                    }
                });
                const element = {
                    id: 'element-1',
                    style: { fills: [{ type: 'solid', color: '#FF0000', themeSlot: 2, opacity: 100 }] }
                };
                fillSection.updateFill(element, 0, { opacity: 50 });
                expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                    expect.objectContaining({
                        style: expect.objectContaining({
                            fills: expect.arrayContaining([
                                expect.objectContaining({ themeSlot: 2, opacity: 50 })
                            ])
                        })
                    }),
                    expect.any(Object)
                );
            });

            it('should preserve themeSlot when toggling visibility', () => {
                // Update store mock to include themeSlot in the element
                store.getState.mockReturnValue({
                    editor: { mode: 'edit', activeSlideId: 'slide-1' },
                    slides: {
                        'slide-1': {
                            elements: {
                                'element-1': {
                                    id: 'element-1',
                                    style: { fills: [{ type: 'solid', color: '#FF0000', themeSlot: 4, visible: true }] }
                                }
                            }
                        }
                    }
                });
                const element = {
                    id: 'element-1',
                    style: { fills: [{ type: 'solid', color: '#FF0000', themeSlot: 4, visible: true }] }
                };
                fillSection.updateFill(element, 0, { visible: false });
                expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                    expect.objectContaining({
                        style: expect.objectContaining({
                            fills: expect.arrayContaining([
                                expect.objectContaining({ themeSlot: 4, visible: false })
                            ])
                        })
                    }),
                    expect.any(Object)
                );
            });
        });
    });

    describe('reorderFills()', () => {
        it('should reorder fills', () => {
            const element = {
                id: 'element-1',
                style: {
                    fills: [
                        { type: 'solid', color: '#FF0000' },
                        { type: 'solid', color: '#00FF00' },
                        { type: 'solid', color: '#0000FF' }
                    ]
                }
            };
            fillSection.reorderFills(element, 0, 2);
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT',
                expect.objectContaining({ id: 'element-1' }),
                expect.any(Object)
            );
        });

        it('should do nothing if no fills array', () => {
            const element = { id: 'element-1', style: {} };
            fillSection.reorderFills(element, 0, 1);
            expect(store.dispatch).not.toHaveBeenCalled();
        });
    });

    describe('getCompositeColor()', () => {
        it('should return first visible fill color', () => {
            const fills = [
                { type: 'solid', color: '#FF0000', visible: false },
                { type: 'solid', color: '#00FF00', visible: true }
            ];
            expect(fillSection.getCompositeColor(fills)).toBe('#00FF00');
        });

        it('should return transparent if no visible fills', () => {
            const fills = [{ type: 'solid', color: '#FF0000', visible: false }];
            expect(fillSection.getCompositeColor(fills)).toBe('transparent');
        });
    });

    describe('getOpacity()', () => {
        it('should return 100 for hex colors', () => {
            expect(fillSection.getOpacity('#FF0000')).toBe(100);
        });

        it('should extract opacity from rgba', () => {
            expect(fillSection.getOpacity('rgba(255, 0, 0, 0.5)')).toBe(50);
        });

        it('should return 100 for null/undefined', () => {
            expect(fillSection.getOpacity(null)).toBe(100);
            expect(fillSection.getOpacity(undefined)).toBe(100);
        });
    });

    describe('applyOpacity()', () => {
        it('should convert hex to rgba with opacity', () => {
            expect(fillSection.applyOpacity('#FF0000', 50)).toBe('rgba(255, 0, 0, 0.5)');
        });

        it('should handle 3-digit hex', () => {
            expect(fillSection.applyOpacity('#F00', 25)).toBe('rgba(255, 0, 0, 0.25)');
        });

        it('should handle rgb input', () => {
            expect(fillSection.applyOpacity('rgb(0, 255, 0)', 75)).toBe('rgba(0, 255, 0, 0.75)');
        });
    });

    describe('rgbToHex()', () => {
        it('should return hex unchanged', () => {
            expect(fillSection.rgbToHex('#FF0000')).toBe('#FF0000');
        });

        it('should convert rgb to hex', () => {
            expect(fillSection.rgbToHex('rgb(255, 128, 0)')).toBe('#ff8000');
        });

        it('should convert rgba to hex', () => {
            expect(fillSection.rgbToHex('rgba(0, 255, 128, 0.5)')).toBe('#00ff80');
        });
    });

    describe('openFlyout()', () => {
        it('should create and open FillFlyout', () => {
            const mockOpen = vi.fn();
            FillFlyout.mockImplementation(() => ({
                open: mockOpen,
                close: vi.fn(),
                destroy: vi.fn()
            }));

            const target = document.createElement('div');
            const fill = { type: 'solid', color: '#FF0000' };
            const element = { id: 'el-1', style: { fills: [fill] } };

            fillSection.openFlyout(target, fill, 0, element);

            expect(FillFlyout).toHaveBeenCalledWith(
                expect.objectContaining({ trigger: target, fill: fill })
            );
            expect(mockOpen).toHaveBeenCalled();
        });

        it('should close existing flyout before opening new one', () => {
            const mockDestroy = vi.fn();
            const mockClose = vi.fn();
            fillSection.activeFlyout = { close: mockClose, destroy: mockDestroy };

            FillFlyout.mockImplementation(() => ({
                open: vi.fn(),
                close: vi.fn(),
                destroy: vi.fn()
            }));

            const target = document.createElement('div');
            const fill = { type: 'solid', color: '#FF0000' };
            const element = { id: 'el-1', style: { fills: [fill] } };

            fillSection.openFlyout(target, fill, 0, element);

            expect(mockDestroy).toHaveBeenCalled();
            expect(mockClose).toHaveBeenCalled();
        });
    });

    describe('getGradientCss()', () => {
        it('should return none for null', () => {
            expect(fillSection.getGradientCss(null)).toBe('none');
        });

        it('should generate linear gradient CSS', () => {
            const gradient = {
                type: 'linear',
                angle: 90,
                stops: [
                    { color: '#000', position: 0 },
                    { color: '#fff', position: 100 }
                ]
            };
            expect(fillSection.getGradientCss(gradient)).toBe('linear-gradient(90deg, #000 0%, #fff 100%)');
        });

        it('should generate radial gradient CSS', () => {
            const gradient = {
                type: 'radial',
                stops: [
                    { color: '#FF0000', position: 0 },
                    { color: '#0000FF', position: 100 }
                ]
            };
            expect(fillSection.getGradientCss(gradient)).toBe('radial-gradient(circle, #FF0000 0%, #0000FF 100%)');
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
            expect(fillSection.getGradientCss(gradient)).toBe('conic-gradient(from 45deg at center, #FF0000 0%, #00FF00 100%)');
        });
    });

    describe('createInheritedFillRow()', () => {
        it('should create inherited fill row', () => {
            const fill = { type: 'solid', color: '#FF0000' };
            const row = fillSection.createInheritedFillRow(fill, true);
            expect(row.classList.contains('inherited-fill-row')).toBe(true);
        });

        it('should add inactive class when not active', () => {
            const fill = { type: 'solid', color: '#FF0000' };
            const row = fillSection.createInheritedFillRow(fill, false);
            expect(row.classList.contains('inactive')).toBe(true);
        });

        it('should display inherited badge', () => {
            const fill = { type: 'solid', color: '#FF0000' };
            const row = fillSection.createInheritedFillRow(fill, true);
            const badge = row.querySelector('.inherited-fill-badge');
            expect(badge.textContent).toBe('Inherited');
        });
    });
});
