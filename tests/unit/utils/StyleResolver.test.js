import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StyleResolver } from '../../../src/utils/StyleResolver.js';
import { store } from '../../../src/core/Store.js';
import { COLOR_MODES } from '../../../src/ui/panels/color-theme/ColorThemeUtils.js';

describe('StyleResolver', () => {
    // Mock state for testing
    const createMockState = (overrides = {}) => ({
        masters: {
            'master-default': {
                id: 'master-default',
                type: 'theme',
                name: 'Default Theme',
                styleAssignments: {
                    colorTheme: null,
                    colorMode: 'dark',
                    typographyStyle: null
                },
                themeSettings: {
                    lumaTheme: {
                        colorMode: 'dark',
                        slots: [
                            { hex: '#0a0810' },  // Slot 0
                            { hex: '#14101e' },  // Slot 1
                            { hex: '#231c32' },  // Slot 2
                            { hex: '#342a48' },  // Slot 3
                            { hex: '#4d3f6a' },  // Slot 4
                            { hex: '#665788' },  // Slot 5
                            { hex: '#7f6fa5' },  // Slot 6
                            { hex: '#9888bf' },  // Slot 7
                            { hex: '#b4a9d4' },  // Slot 8
                            { hex: '#c9c1e3' },  // Slot 9
                            { hex: '#ded9ef' },  // Slot 10
                            { hex: '#f7f5fc' }   // Slot 11
                        ]
                    }
                }
            },
            'layout-title': {
                id: 'layout-title',
                type: 'layout',
                parentId: 'master-default',
                name: 'Title Slide',
                styleAssignments: {
                    colorTheme: null,
                    typographyStyle: null
                }
            },
            'layout-custom': {
                id: 'layout-custom',
                type: 'layout',
                parentId: 'master-default',
                name: 'Custom Layout',
                styleAssignments: {
                    colorTheme: 'forest-theme',
                    typographyStyle: null
                }
            }
        },
        slides: {
            'slide-1': {
                id: 'slide-1',
                layoutId: 'layout-title',
                styleAssignments: {
                    colorTheme: null,
                    typographyStyle: null
                }
            },
            'slide-2': {
                id: 'slide-2',
                layoutId: 'layout-title',
                styleAssignments: {
                    colorTheme: 'sunset-theme',
                    typographyStyle: null
                }
            },
            'slide-3': {
                id: 'slide-3',
                layoutId: 'layout-custom',
                styleAssignments: {
                    colorTheme: null,
                    typographyStyle: null
                }
            },
            'slide-legacy': {
                id: 'slide-legacy',
                layoutId: 'layout-title'
                // No styleAssignments - legacy slide
            }
        },
        editor: {
            activeSlideId: 'slide-1'
        },
        ...overrides
    });

    let originalGetState;

    beforeEach(() => {
        // Store original getState
        originalGetState = store.getState;
    });

    afterEach(() => {
        // Restore original getState
        store.getState = originalGetState;
    });

    describe('getEffectiveColorTheme()', () => {
        it('should return master theme when slide inherits from layout which inherits from master', () => {
            const mockState = createMockState();
            store.getState = vi.fn(() => mockState);

            const result = StyleResolver.getEffectiveColorTheme('slide-1');

            expect(result.source).toBe('master');
            expect(result.sourceId).toBe('master-default');
            expect(result.sourceLabel).toBe('inherited from Master');
        });

        it('should return slide-specific theme when slide has override', () => {
            const mockState = createMockState();
            store.getState = vi.fn(() => mockState);

            const result = StyleResolver.getEffectiveColorTheme('slide-2');

            expect(result.themeId).toBe('sunset-theme');
            expect(result.source).toBe('slide');
            expect(result.sourceId).toBe('slide-2');
            expect(result.sourceLabel).toBe('slide-specific');
        });

        it('should return layout theme when layout has override but slide does not', () => {
            const mockState = createMockState();
            store.getState = vi.fn(() => mockState);

            const result = StyleResolver.getEffectiveColorTheme('slide-3');

            expect(result.themeId).toBe('forest-theme');
            expect(result.source).toBe('layout');
            expect(result.sourceId).toBe('layout-custom');
            expect(result.sourceLabel).toContain('inherited from');
        });

        it('should handle legacy slides without styleAssignments', () => {
            const mockState = createMockState();
            store.getState = vi.fn(() => mockState);

            const result = StyleResolver.getEffectiveColorTheme('slide-legacy');

            expect(result.source).toBe('master');
            expect(result.sourceId).toBe('master-default');
        });

        it('should return master default for non-existent slide', () => {
            const mockState = createMockState();
            store.getState = vi.fn(() => mockState);

            const result = StyleResolver.getEffectiveColorTheme('non-existent');

            expect(result.source).toBe('master');
        });
    });

    describe('getColorMode()', () => {
        it('should return dark mode from master styleAssignments', () => {
            const mockState = createMockState();
            store.getState = vi.fn(() => mockState);

            const result = StyleResolver.getColorMode();

            expect(result).toBe('dark');
        });

        it('should return light mode when master uses light mode', () => {
            const mockState = createMockState();
            mockState.slideMasterPresets['master-default'].styleAssignments.colorMode = 'light';
            mockState.slideMasterPresets['master-default'].themeSettings.lumaTheme.colorMode = 'light';
            store.getState = vi.fn(() => mockState);

            const result = StyleResolver.getColorMode();

            expect(result).toBe('light');
        });

        it('should fallback to lumaTheme colorMode if styleAssignments not present', () => {
            const mockState = createMockState();
            delete mockState.slideMasterPresets['master-default'].styleAssignments;
            store.getState = vi.fn(() => mockState);

            const result = StyleResolver.getColorMode();

            expect(result).toBe('dark');
        });
    });

    describe('getLumaTheme()', () => {
        it('should return lumaTheme from master', () => {
            const mockState = createMockState();
            store.getState = vi.fn(() => mockState);

            const result = StyleResolver.getLumaTheme('slide-1');

            expect(result).toBeDefined();
            expect(result.slots).toHaveLength(12);
        });

        it('should use activeSlideId when no slideId provided', () => {
            const mockState = createMockState();
            store.getState = vi.fn(() => mockState);

            const result = StyleResolver.getLumaTheme();

            expect(result).toBeDefined();
        });

        it('should return null when no theme master exists', () => {
            const mockState = createMockState();
            delete mockState.slideMasterPresets['master-default'];
            store.getState = vi.fn(() => mockState);

            const result = StyleResolver.getLumaTheme('slide-1');

            expect(result).toBeNull();
        });
    });

    describe('getThemeInfoForSlide()', () => {
        it('should return complete theme info for slide', () => {
            const mockState = createMockState();
            store.getState = vi.fn(() => mockState);

            const result = StyleResolver.getThemeInfoForSlide('slide-1');

            expect(result.lumaTheme).toBeDefined();
            expect(result.colorMode).toBe('dark');
            expect(result.source).toBe('master');
            expect(result.isInherited).toBe(true);
        });

        it('should return isInherited false for slide-specific theme', () => {
            const mockState = createMockState();
            store.getState = vi.fn(() => mockState);

            const result = StyleResolver.getThemeInfoForSlide('slide-2');

            expect(result.isInherited).toBe(false);
            expect(result.source).toBe('slide');
        });
    });

    describe('checkThemeConsistency()', () => {
        it('should return sameTheme true when all slides inherit from same source', () => {
            const mockState = createMockState();
            // Add another slide with same inheritance
            mockState.slides['slide-4'] = {
                id: 'slide-4',
                layoutId: 'layout-title',
                styleAssignments: { colorTheme: null }
            };
            store.getState = vi.fn(() => mockState);

            const result = StyleResolver.checkThemeConsistency(['slide-1', 'slide-4']);

            expect(result.sameTheme).toBe(true);
            expect(result.themeInfo).toBeDefined();
        });

        it('should return sameTheme false when slides have different themes', () => {
            const mockState = createMockState();
            store.getState = vi.fn(() => mockState);

            const result = StyleResolver.checkThemeConsistency(['slide-1', 'slide-2']);

            expect(result.sameTheme).toBe(false);
            expect(result.themeInfo).toBeNull();
        });

        it('should handle empty array', () => {
            const mockState = createMockState();
            store.getState = vi.fn(() => mockState);

            const result = StyleResolver.checkThemeConsistency([]);

            expect(result.sameTheme).toBe(true);
        });
    });

    describe('resolveThemeSlot()', () => {
        it('should resolve slot to hex color from lumaTheme', () => {
            const mockState = createMockState();
            store.getState = vi.fn(() => mockState);

            const result = StyleResolver.resolveThemeSlot(0, '#fallback', 'slide-1');

            // In dark mode, slot 0 maps to slot 11 (11 - 0 = 11)
            expect(result).toBe('#f7f5fc');
        });

        it('should use fallback when slot not found', () => {
            const mockState = createMockState();
            mockState.slideMasterPresets['master-default'].themeSettings.lumaTheme.slots = [];
            store.getState = vi.fn(() => mockState);

            const result = StyleResolver.resolveThemeSlot(0, '#fallback', 'slide-1');

            // Should fall through to CSS var or fallback
            expect(result).toBeDefined();
        });

        it('should return fallback for null slot index', () => {
            const mockState = createMockState();
            store.getState = vi.fn(() => mockState);

            const result = StyleResolver.resolveThemeSlot(null, '#fallback', 'slide-1');

            expect(result).toBe('#fallback');
        });

        it('should apply dark mode slot mapping', () => {
            const mockState = createMockState();
            store.getState = vi.fn(() => mockState);

            // In dark mode, slot 0 → slot 11, slot 11 → slot 0
            const slot0Result = StyleResolver.resolveThemeSlot(0);
            const slot11Result = StyleResolver.resolveThemeSlot(11);

            // These should be mirrored
            expect(slot0Result).toBe('#f7f5fc'); // Was slot 11's value
            expect(slot11Result).toBe('#0a0810'); // Was slot 0's value
        });

        it('should not apply mapping in light mode', () => {
            const mockState = createMockState();
            mockState.slideMasterPresets['master-default'].styleAssignments.colorMode = 'light';
            mockState.slideMasterPresets['master-default'].themeSettings.lumaTheme.colorMode = 'light';
            store.getState = vi.fn(() => mockState);

            const slot0Result = StyleResolver.resolveThemeSlot(0);

            expect(slot0Result).toBe('#0a0810'); // Actual slot 0 value
        });
    });

    describe('resolveFill()', () => {
        it('should resolve solid fill with themeSlot', () => {
            const mockState = createMockState();
            store.getState = vi.fn(() => mockState);

            const fill = { type: 'solid', themeSlot: 2, value: null };
            const result = StyleResolver.resolveFill(fill, 'slide-1');

            expect(result.type).toBe('solid');
            expect(result.value).toBeDefined();
            expect(result.themeSlot).toBe(2);
            expect(result.cssVar).toBe('var(--theme-slot3)');
        });

        it('should return custom fill as-is', () => {
            const mockState = createMockState();
            store.getState = vi.fn(() => mockState);

            const fill = { type: 'solid', themeSlot: null, value: '#ff5733' };
            const result = StyleResolver.resolveFill(fill, 'slide-1');

            expect(result.value).toBe('#ff5733');
            expect(result.themeSlot).toBeNull();
        });

        it('should resolve gradient fill stops with themeSlots', () => {
            const mockState = createMockState();
            store.getState = vi.fn(() => mockState);

            const fill = {
                type: 'gradient',
                stops: [
                    { position: 0, themeSlot: 0, color: null },
                    { position: 1, themeSlot: 11, color: null }
                ]
            };
            const result = StyleResolver.resolveFill(fill, 'slide-1');

            expect(result.type).toBe('gradient');
            expect(result.stops[0].color).toBeDefined();
            expect(result.stops[0].themeSlot).toBe(0);
            expect(result.stops[1].color).toBeDefined();
            expect(result.stops[1].themeSlot).toBe(11);
        });

        it('should return null for null fill', () => {
            const mockState = createMockState();
            store.getState = vi.fn(() => mockState);

            const result = StyleResolver.resolveFill(null, 'slide-1');

            expect(result).toBeNull();
        });
    });

    describe('resolveTextFill()', () => {
        it('should resolve textFill with themeSlot', () => {
            const mockState = createMockState();
            store.getState = vi.fn(() => mockState);

            const fill = { type: 'solid', themeSlot: 5, value: null };
            const result = StyleResolver.resolveTextFill(fill, 'slide-1');

            expect(result.value).toBeDefined();
            expect(result.themeSlot).toBe(5);
        });

        it('should return default fill for null input', () => {
            const mockState = createMockState();
            store.getState = vi.fn(() => mockState);

            const result = StyleResolver.resolveTextFill(null, 'slide-1');

            expect(result.type).toBe('solid');
            expect(result.value).toBe('#000000');
        });
    });
});


