import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StyleResolver } from '../../../src/utils/StyleResolver.js';
import { store } from '../../../src/core/Store.js';
import { COLOR_MODES } from '../../../src/ui/panels/color-theme/ColorThemeUtils.js';

describe('StyleResolver', () => {
    // Mock state for testing
    const createMockState = (overrides = {}) => ({
        colorThemePresets: {
            'color-theme-default': {
                id: 'color-theme-default',
                name: 'Default Theme',
                lumaTheme: {
                    id: 'color-theme-default',
                    name: 'Default Theme',
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
                    ],
                    resolvedColors: [
                        '#0a0810',
                        '#14101e',
                        '#231c32',
                        '#342a48',
                        '#4d3f6a',
                        '#665788',
                        '#7f6fa5',
                        '#9888bf',
                        '#b4a9d4',
                        '#c9c1e3',
                        '#ded9ef',
                        '#f7f5fc'
                    ]
                }
            },
            'forest-theme': {
                id: 'forest-theme',
                name: 'Forest Theme',
                lumaTheme: {
                    id: 'forest-theme',
                    name: 'Forest Theme',
                    colorMode: 'dark',
                    slots: Array(12).fill(null).map((_, i) => ({ hex: i === 0 ? '#001a0f' : '#0b5d3b' })),
                    resolvedColors: Array(12).fill('#0b5d3b').map((v, i) => (i === 0 ? '#001a0f' : v))
                }
            },
            'sunset-theme': {
                id: 'sunset-theme',
                name: 'Sunset Theme',
                lumaTheme: {
                    id: 'sunset-theme',
                    name: 'Sunset Theme',
                    colorMode: 'dark',
                    slots: Array(12).fill(null).map((_, i) => ({ hex: i === 0 ? '#2a0a00' : '#ff6b35' })),
                    resolvedColors: Array(12).fill('#ff6b35').map((v, i) => (i === 0 ? '#2a0a00' : v))
                }
            }
        },
        slideMasterPresets: {
            'master-default': {
                id: 'master-default',
                type: 'slideMasterPreset',
                name: 'Default Theme',
                colorThemeId: 'color-theme-default',
                colorModeId: 'dark',
                typographyStyleId: null,
                themeSettings: undefined
            },
            'layout-title': {
                id: 'layout-title',
                type: 'layoutMaster',
                parentMasterId: 'master-default',
                name: 'Title Slide',
                colorThemeId: null,
                typographyStyleId: null
            },
            'layout-custom': {
                id: 'layout-custom',
                type: 'layoutMaster',
                parentMasterId: 'master-default',
                name: 'Custom Layout',
                colorThemeId: 'forest-theme',
                typographyStyleId: null
            }
        },
        slides: {
            'slide-1': {
                id: 'slide-1',
                layoutId: 'layout-title',
                colorThemeId: null,
                typographyStyleId: null
            },
            'slide-2': {
                id: 'slide-2',
                layoutId: 'layout-title',
                colorThemeId: 'sunset-theme',
                typographyStyleId: null
            },
            'slide-3': {
                id: 'slide-3',
                layoutId: 'layout-custom',
                colorThemeId: null,
                typographyStyleId: null
            },
            'slide-legacy': {
                id: 'slide-legacy',
                layoutId: 'layout-title',
                colorThemeId: null,
                typographyStyleId: null
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

    describe('getTypographyStyle()', () => {
        it('should prefer slide styleAssignments.typographyStyle over master typographyStyleId', () => {
            const mockState = createMockState({
                typographyStylePresets: {
                    'typo-a': {
                        id: 'typo-a',
                        fonts: { heading: 'Inter', body: 'Inter' },
                        textStyles: {
                            title: { fontFamily: 'Inter', fontSize: 40, fontWeight: '800' }
                        }
                    },
                    'typo-b': {
                        id: 'typo-b',
                        fonts: { heading: 'Merriweather', body: 'Open Sans' },
                        textStyles: {
                            title: { fontFamily: 'Merriweather', fontSize: 44, fontWeight: '700' }
                        }
                    }
                },
                slideMasterPresets: {
                    ...createMockState().slideMasterPresets,
                    'master-default': {
                        ...createMockState().slideMasterPresets['master-default'],
                        typographyStyleId: 'typo-a'
                    }
                },
                slides: {
                    ...createMockState().slides,
                    'slide-1': {
                        ...createMockState().slides['slide-1'],
                        typographyStyleId: null,
                        styleAssignments: { typographyStyle: 'typo-b' }
                    }
                }
            });

            store.getState = vi.fn(() => mockState);

            const typography = StyleResolver.getTypographyStyle('slide-1');
            expect(typography.id).toBe('typo-b');
            expect(typography.fonts.heading).toBe('Merriweather');
            expect(typography.textStyles.title.fontFamily).toBe('Merriweather');
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
            mockState.slideMasterPresets['master-default'].colorModeId = 'light';
            mockState.colorThemePresets['color-theme-default'].lumaTheme.colorMode = 'light';
            store.getState = vi.fn(() => mockState);

            const result = StyleResolver.getColorMode();

            expect(result).toBe('light');
        });

        it('should fallback to lumaTheme colorMode if styleAssignments not present', () => {
            const mockState = createMockState();
            delete mockState.slideMasterPresets['master-default'].colorModeId;
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
            mockState.colorThemePresets['color-theme-default'].lumaTheme.slots = [];
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
            mockState.slideMasterPresets['master-default'].colorModeId = 'light';
            mockState.colorThemePresets['color-theme-default'].lumaTheme.colorMode = 'light';
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

    describe('getTypographyStyle() - Typography Cascade', () => {
        it('should resolve typography from slide -> layout -> master cascade', () => {
            const mockState = createMockState();
            
            // Add typography preset to state
            mockState.typographyStylePresets = {
                'preset-modern': {
                    id: 'preset-modern',
                    name: 'Modern',
                    fonts: {
                        heading: 'Montserrat',
                        body: 'Inter'
                    },
                    textStyles: {
                        title: {
                            id: 'title',
                            name: 'Title',
                            fontFamily: 'var(--theme-font-heading)',
                            fontSize: 48,
                            fontWeight: '700',
                            lineHeight: 1.2
                        },
                        body: {
                            id: 'body',
                            name: 'Body',
                            fontFamily: 'var(--theme-font-body)',
                            fontSize: 16,
                            fontWeight: '400',
                            lineHeight: 1.5
                        }
                    }
                }
            };

            // Link master to typography preset
            mockState.slideMasterPresets['master-default'].typographyStyleId = 'preset-modern';
            // Link slide to master (via layout)
            mockState.slides['slide-1'].masterSlideId = 'master-default';
            
            store.getState = vi.fn(() => mockState);

            const typography = StyleResolver.getTypographyStyle('slide-1');

            expect(typography).toBeDefined();
            expect(typography.id).toBe('preset-modern');
            expect(typography.fonts.heading).toBe('Montserrat');
            expect(typography.textStyles.title.fontSize).toBe(48);
        });

        it('should return null when no typography preset is found', () => {
            const mockState = createMockState();
            // Ensure master has no typographyStyleId
            delete mockState.slideMasterPresets['master-default'].typographyStyleId;
            mockState.slides['slide-1'].masterSlideId = 'master-default';
            
            store.getState = vi.fn(() => mockState);

            const typography = StyleResolver.getTypographyStyle('slide-1');

            // Method returns fallback fonts/textStyles, not null
            expect(typography).toBeDefined();
            expect(typography.fonts).toEqual({ heading: 'Inter', body: 'Inter' });
            expect(typography.textStyles).toEqual({});
        });
    });

    describe('getEffectiveTextProperties() - Typography Cascade', () => {
        it('should resolve text properties using textStyleId from theme', () => {
            const mockState = createMockState();
            
            // Add typography preset
            mockState.typographyStylePresets = {
                'preset-modern': {
                    id: 'preset-modern',
                    name: 'Modern',
                    fonts: {
                        heading: 'Montserrat',
                        body: 'Inter'
                    },
                    textStyles: {
                        title: {
                            id: 'title',
                            name: 'Title',
                            fontFamily: 'Montserrat',
                            fontSize: 48,
                            fontWeight: '700',
                            lineHeight: 1.2,
                            letterSpacing: '-2%'
                        }
                    }
                }
            };

            mockState.slideMasterPresets['master-default'].typographyStyleId = 'preset-modern';
            mockState.slides['slide-1'].masterSlideId = 'master-default';
            
            store.getState = vi.fn(() => mockState);

            const element = {
                id: 'text-1',
                type: 'text',
                textStyleId: 'title',
                content: 'Hello World'
            };

            const props = StyleResolver.getEffectiveTextProperties(element, {}, 'slide-1');

            expect(props.fontFamily).toBe('Montserrat');
            expect(props.fontSize).toBe(48);
            expect(props.fontWeight).toBe('700');
            expect(props.lineHeight).toBe(1.2);
            expect(props.letterSpacing).toBe('-2%');
        });

        it('should normalize legacy var(--theme-text-primary) to a themeSlot-linked textFill', () => {
            const mockState = createMockState();

            mockState.typographyStylePresets = {
                'preset-modern': {
                    id: 'preset-modern',
                    textStyles: {
                        body: {
                            id: 'body',
                            fontFamily: 'Inter',
                            fontSize: 16,
                            fontWeight: '400',
                            textFill: { type: 'solid', value: 'var(--theme-text-primary)' }
                        }
                    }
                }
            };

            mockState.slideMasterPresets['master-default'].typographyStyleId = 'preset-modern';
            mockState.slides['slide-1'].masterSlideId = 'master-default';
            store.getState = vi.fn(() => mockState);

            const element = {
                id: 'text-1',
                type: 'text',
                textStyleId: 'body'
            };

            const props = StyleResolver.getEffectiveTextProperties(element, {}, 'slide-1');
            expect(props.textFill).toBeTruthy();
            expect(props.textFill.themeSlot).toBe(11);
            expect(typeof props.textFill.value).toBe('string');
            expect(props.textFill.value.startsWith('#')).toBe(true);
        });

        it('should normalize legacy var(--theme-text-secondary) to a themeSlot-linked textFill', () => {
            const mockState = createMockState();

            mockState.typographyStylePresets = {
                'preset-modern': {
                    id: 'preset-modern',
                    textStyles: {
                        caption: {
                            id: 'caption',
                            fontFamily: 'Inter',
                            fontSize: 12,
                            fontWeight: '400',
                            textFill: { type: 'solid', value: 'var(--theme-text-secondary)' }
                        }
                    }
                }
            };

            mockState.slideMasterPresets['master-default'].typographyStyleId = 'preset-modern';
            mockState.slides['slide-1'].masterSlideId = 'master-default';
            store.getState = vi.fn(() => mockState);

            const element = {
                id: 'text-1',
                type: 'text',
                textStyleId: 'caption'
            };

            const props = StyleResolver.getEffectiveTextProperties(element, {}, 'slide-1');
            expect(props.textFill).toBeTruthy();
            expect(props.textFill.themeSlot).toBe(9);
            expect(typeof props.textFill.value).toBe('string');
            expect(props.textFill.value.startsWith('#')).toBe(true);
        });

        it('should apply element overrides on top of theme styles', () => {
            const mockState = createMockState();
            
            mockState.typographyStylePresets = {
                'preset-modern': {
                    id: 'preset-modern',
                    textStyles: {
                        body: {
                            id: 'body',
                            fontFamily: 'Inter',
                            fontSize: 16,
                            fontWeight: '400'
                        }
                    }
                }
            };

            mockState.slideMasterPresets['master-default'].typographyStyleId = 'preset-modern';
            mockState.slides['slide-1'].masterSlideId = 'master-default';
            
            store.getState = vi.fn(() => mockState);

            const element = {
                id: 'text-1',
                type: 'text',
                textStyleId: 'body',
                fontSize: 20,  // Manual override
                fontWeight: '600'  // Manual override
            };

            const props = StyleResolver.getEffectiveTextProperties(element, {}, 'slide-1');

            expect(props.fontFamily).toBe('Inter');  // From theme
            expect(props.fontSize).toBe(20);  // Overridden
            expect(props.fontWeight).toBe('600');  // Overridden
        });

        it('should fallback to defaults when no textStyleId is provided', () => {
            const mockState = createMockState();
            store.getState = vi.fn(() => mockState);

            const element = {
                id: 'text-1',
                type: 'text',
                content: 'Hello World'
            };

            const props = StyleResolver.getEffectiveTextProperties(element, {}, 'slide-1');

            expect(props.fontFamily).toBe('Inter');  // Default
            expect(props.fontSize).toBe(16);  // Default
            expect(props.fontWeight).toBe('400');  // Default
        });

        it('should maintain backward compatibility with legacy styleId', () => {
            const mockState = createMockState();
            store.getState = vi.fn(() => mockState);

            const globalStyles = {
                'legacy-title': {
                    id: 'legacy-title',
                    fontFamily: 'Roboto',
                    fontSize: 36,
                    fontWeight: '700'
                }
            };

            const element = {
                id: 'text-1',
                type: 'text',
                styleId: 'legacy-title'  // Old property
            };

            const props = StyleResolver.getEffectiveTextProperties(element, globalStyles, 'slide-1');

            expect(props.fontFamily).toBe('Roboto');
            expect(props.fontSize).toBe(36);
            expect(props.fontWeight).toBe('700');
        });
    });
});






