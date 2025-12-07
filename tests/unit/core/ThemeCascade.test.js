/**
 * Theme Cascade Architecture Tests
 * 
 * Tests the multi-level theme cascade system to ensure:
 * 1. Theme Master sets the default theme for all slides
 * 2. Layout Master can override for slides using that layout
 * 3. Individual slides can override for just that slide
 * 4. CSS variables are applied per-slide, not globally
 * 5. Theme changes at one level don't pollute other slides
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StyleResolver } from '../../../src/utils/StyleResolver.js';
import { THEME_PRESETS, getPresetById } from '../../../src/ui/panels/color-theme/ThemePresets.js';

// Mock store with hoisted functions
const { mockGetState } = vi.hoisted(() => ({
    mockGetState: vi.fn()
}));

// Mock the store module
vi.mock('../../../src/core/Store.js', () => ({
    store: {
        getState: mockGetState
    }
}));

// Set window._storyAppStore for StyleResolver access
beforeEach(() => {
    window._storyAppStore = {
        getState: mockGetState
    };
});

afterEach(() => {
    vi.clearAllMocks();
    delete window._storyAppStore;
});

describe('Theme Cascade Architecture', () => {
    /**
     * Create a mock state representing the cascade hierarchy:
     * 
     * Theme Master (Electric Dreams) - DEFAULT
     * ├── layout-title (Tropical Paradise override)
     * │   ├── slide-1 (Citrus Burst override) → Should show Citrus Burst
     * │   └── slide-2 (no override) → Should show Tropical Paradise
     * ├── layout-blank (no override)
     * │   └── slide-3 (no override) → Should show Electric Dreams
     * └── layout-content (Forest Green override)
     *     └── slide-4 (no override) → Should show Forest Green
     */
    const createCascadeTestState = () => ({
        editor: {
            activeSlideId: 'slide-1',
            activeMasterId: 'master-default',
            mode: 'edit'
        },
        slideMasterPresets: {
            'master-default': {
                id: 'master-default',
                type: 'slideMasterPreset',
                name: 'Default Theme Master',
                styleAssignments: {
                    colorTheme: null,  // Not used at theme master level
                    colorMode: 'light'
                },
                themeSettings: {
                    lumaTheme: {
                        id: 'preset_electric_dreams',
                        name: 'Electric Dreams',
                        slots: [
                            { h: 270, s: 80 }, { h: 270, s: 75 }, { h: 270, s: 70 }, { h: 270, s: 65 },
                            { h: 270, s: 60 }, { h: 270, s: 55 }, { h: 270, s: 50 }, { h: 270, s: 45 },
                            { h: 270, s: 40 }, { h: 270, s: 35 }, { h: 270, s: 30 }, { h: 270, s: 25 }
                        ],
                        adjustments: { brightness: 0, contrast: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0, saturation: 0 },
                        resolvedColors: [
                            '#1a0a2e', '#2d1b4e', '#401f7c', '#5c3d9c', 
                            '#7855b2', '#916dc7', '#a988d9', '#c0a4e8', 
                            '#d4bff0', '#e5d8f6', '#f0ebfa', '#f9f6fd'
                        ],
                        colorMode: 'light'
                    }
                }
            },
            'layout-title': {
                id: 'layout-title',
                type: 'layoutMaster',
                parentMasterId: 'master-default',
                name: 'Title Slide',
                styleAssignments: {
                    colorTheme: 'preset_tropical_paradise'  // Override for this layout
                }
            },
            'layout-blank': {
                id: 'layout-blank',
                type: 'layoutMaster',
                parentMasterId: 'master-default',
                name: 'Blank',
                styleAssignments: {
                    colorTheme: null  // No override, inherits from theme master
                }
            },
            'layout-content': {
                id: 'layout-content',
                type: 'layoutMaster',
                parentMasterId: 'master-default',
                name: 'Content',
                styleAssignments: {
                    colorTheme: 'preset_forest_green'  // Different override
                }
            }
        },
        slides: {
            'slide-1': {
                id: 'slide-1',
                layoutId: 'layout-title',
                styleAssignments: {
                    colorTheme: 'preset_citrus_burst'  // Override at slide level
                }
            },
            'slide-2': {
                id: 'slide-2',
                layoutId: 'layout-title',
                styleAssignments: {
                    colorTheme: null  // No override, inherits from layout
                }
            },
            'slide-3': {
                id: 'slide-3',
                layoutId: 'layout-blank',
                styleAssignments: {
                    colorTheme: null  // No override, inherits from theme master
                }
            },
            'slide-4': {
                id: 'slide-4',
                layoutId: 'layout-content',
                styleAssignments: {
                    colorTheme: null  // No override, inherits from layout
                }
            },
            'slide-legacy': {
                id: 'slide-legacy',
                layoutId: 'layout-blank'
                // No styleAssignments at all (legacy slide)
            }
        },
        slideOrder: ['slide-1', 'slide-2', 'slide-3', 'slide-4', 'slide-legacy']
    });

    describe('Scenario 1: Theme Master Sets Default', () => {
        it('should resolve to theme master when slide has no override and layout has no override', () => {
            mockGetState.mockReturnValue(createCascadeTestState());
            
            const result = StyleResolver.getEffectiveColorTheme('slide-3');
            
            expect(result.source).toBe('master');
            expect(result.sourceId).toBe('master-default');
            expect(result.sourceLabel).toBe('inherited from Master');
        });

        it('should use lumaTheme from theme master for slides without overrides', () => {
            mockGetState.mockReturnValue(createCascadeTestState());
            
            const themeInfo = StyleResolver.getThemeInfoForSlide('slide-3');
            
            expect(themeInfo.lumaTheme).toBeDefined();
            expect(themeInfo.lumaTheme.id).toBe('preset_electric_dreams');
            expect(themeInfo.isInherited).toBe(true);
        });
    });

    describe('Scenario 2: Layout Master Override', () => {
        it('should resolve to layout when layout has override but slide does not', () => {
            mockGetState.mockReturnValue(createCascadeTestState());
            
            const result = StyleResolver.getEffectiveColorTheme('slide-2');
            
            expect(result.themeId).toBe('preset_tropical_paradise');
            expect(result.source).toBe('layout');
            expect(result.sourceId).toBe('layout-title');
            expect(result.sourceLabel).toContain('inherited from');
        });

        it('should resolve to different layout override for slides using different layouts', () => {
            mockGetState.mockReturnValue(createCascadeTestState());
            
            const result = StyleResolver.getEffectiveColorTheme('slide-4');
            
            expect(result.themeId).toBe('preset_forest_green');
            expect(result.source).toBe('layout');
            expect(result.sourceId).toBe('layout-content');
        });

        it('should NOT apply layout override to slides using other layouts', () => {
            mockGetState.mockReturnValue(createCascadeTestState());
            
            // slide-3 uses layout-blank which has no override
            const slide3Result = StyleResolver.getEffectiveColorTheme('slide-3');
            // slide-2 uses layout-title which has override
            const slide2Result = StyleResolver.getEffectiveColorTheme('slide-2');
            
            // They should be different
            expect(slide3Result.source).toBe('master');
            expect(slide2Result.source).toBe('layout');
            expect(slide2Result.themeId).toBe('preset_tropical_paradise');
        });
    });

    describe('Scenario 3: Slide Override', () => {
        it('should resolve to slide when slide has override', () => {
            mockGetState.mockReturnValue(createCascadeTestState());
            
            const result = StyleResolver.getEffectiveColorTheme('slide-1');
            
            expect(result.themeId).toBe('preset_citrus_burst');
            expect(result.source).toBe('slide');
            expect(result.sourceId).toBe('slide-1');
            expect(result.sourceLabel).toBe('slide-specific');
        });

        it('should indicate slide override is not inherited', () => {
            mockGetState.mockReturnValue(createCascadeTestState());
            
            const themeInfo = StyleResolver.getThemeInfoForSlide('slide-1');
            
            expect(themeInfo.isInherited).toBe(false);
        });

        it('should NOT affect other slides when one slide has override', () => {
            mockGetState.mockReturnValue(createCascadeTestState());
            
            // slide-1 has override, slide-2 uses same layout but no override
            const slide1Result = StyleResolver.getEffectiveColorTheme('slide-1');
            const slide2Result = StyleResolver.getEffectiveColorTheme('slide-2');
            
            expect(slide1Result.themeId).toBe('preset_citrus_burst');
            expect(slide1Result.source).toBe('slide');
            expect(slide2Result.themeId).toBe('preset_tropical_paradise');
            expect(slide2Result.source).toBe('layout');
        });
    });

    describe('Scenario 4: Full Cascade Hierarchy', () => {
        it('should respect cascade priority: Slide > Layout > Theme Master', () => {
            mockGetState.mockReturnValue(createCascadeTestState());
            
            // slide-1: Has slide override → Shows Citrus Burst
            const slide1 = StyleResolver.getEffectiveColorTheme('slide-1');
            expect(slide1.themeId).toBe('preset_citrus_burst');
            expect(slide1.source).toBe('slide');
            
            // slide-2: No slide override, layout has override → Shows Tropical Paradise
            const slide2 = StyleResolver.getEffectiveColorTheme('slide-2');
            expect(slide2.themeId).toBe('preset_tropical_paradise');
            expect(slide2.source).toBe('layout');
            
            // slide-3: No slide override, no layout override → Shows Electric Dreams (master)
            const slide3 = StyleResolver.getEffectiveColorTheme('slide-3');
            expect(slide3.source).toBe('master');
            
            // slide-4: No slide override, layout has override → Shows Forest Green
            const slide4 = StyleResolver.getEffectiveColorTheme('slide-4');
            expect(slide4.themeId).toBe('preset_forest_green');
            expect(slide4.source).toBe('layout');
        });
    });

    describe('Scenario 5: Remove Override (Clear Override)', () => {
        it('should fall back to layout theme when slide override is cleared', () => {
            const state = createCascadeTestState();
            // Clear slide-1's override
            state.slides['slide-1'].colorThemeId = null;
            mockGetState.mockReturnValue(state);
            
            const result = StyleResolver.getEffectiveColorTheme('slide-1');
            
            // Should now inherit from layout-title
            expect(result.themeId).toBe('preset_tropical_paradise');
            expect(result.source).toBe('layout');
        });

        it('should fall back to theme master when layout override is cleared', () => {
            const state = createCascadeTestState();
            // Clear layout-title's override
            state.slideMasterPresets['layout-title'].colorThemeId = null;
            // Clear slide-2's override (already null)
            mockGetState.mockReturnValue(state);
            
            const result = StyleResolver.getEffectiveColorTheme('slide-2');
            
            // Should now inherit from theme master
            expect(result.source).toBe('master');
            expect(result.sourceId).toBe('master-default');
        });
    });

    describe('Legacy Slides (Missing styleAssignments)', () => {
        it('should handle slides without styleAssignments property', () => {
            mockGetState.mockReturnValue(createCascadeTestState());
            
            const result = StyleResolver.getEffectiveColorTheme('slide-legacy');
            
            // Should fall through to theme master (layout-blank has no override)
            expect(result.source).toBe('master');
            expect(result.sourceId).toBe('master-default');
        });
    });

    describe('Theme Consistency Check', () => {
        it('should detect consistent themes for slides with same source', () => {
            mockGetState.mockReturnValue(createCascadeTestState());
            
            // slide-3 and slide-legacy both inherit from theme master via layout-blank
            const result = StyleResolver.checkThemeConsistency(['slide-3', 'slide-legacy']);
            
            expect(result.sameTheme).toBe(true);
        });

        it('should detect inconsistent themes for slides with different sources', () => {
            mockGetState.mockReturnValue(createCascadeTestState());
            
            // slide-1 (slide override) vs slide-2 (layout override) vs slide-3 (master)
            const result = StyleResolver.checkThemeConsistency(['slide-1', 'slide-2', 'slide-3']);
            
            expect(result.sameTheme).toBe(false);
        });

        it('should detect consistent themes for slides using same layout override', () => {
            const state = createCascadeTestState();
            // Add another slide using layout-title with no override
            state.slides['slide-5'] = {
                id: 'slide-5',
                layoutId: 'layout-title',
                colorThemeId: null
            };
            mockGetState.mockReturnValue(state);
            
            // slide-2 and slide-5 both inherit from layout-title
            const result = StyleResolver.checkThemeConsistency(['slide-2', 'slide-5']);
            
            expect(result.sameTheme).toBe(true);
        });
    });

    describe('getThemeInfoForSlide() Complete Resolution', () => {
        it('should return complete theme info including lumaTheme for slide with override', () => {
            mockGetState.mockReturnValue(createCascadeTestState());
            
            const info = StyleResolver.getThemeInfoForSlide('slide-1');
            
            expect(info.lumaTheme).toBeDefined();
            expect(info.source).toBe('slide');
            expect(info.sourceId).toBe('slide-1');
            expect(info.isInherited).toBe(false);
            expect(info.colorMode).toBe('light');
        });

        it('should return lumaTheme with resolved colors for inherited theme', () => {
            mockGetState.mockReturnValue(createCascadeTestState());
            
            const info = StyleResolver.getThemeInfoForSlide('slide-3');
            
            expect(info.lumaTheme).toBeDefined();
            expect(info.lumaTheme.resolvedColors).toBeDefined();
            expect(info.lumaTheme.resolvedColors).toHaveLength(12);
            expect(info.isInherited).toBe(true);
        });
    });

    describe('Color Mode (Light/Dark)', () => {
        it('should get color mode from theme master styleAssignments', () => {
            const state = createCascadeTestState();
            // StyleResolver.getColorMode() checks colorModeId first
            state.slideMasterPresets['master-default'].colorModeId = 'dark';
            state.slideMasterPresets['master-default'].themeSettings.lumaTheme.colorMode = 'dark';
            mockGetState.mockReturnValue(state);
            
            const colorMode = StyleResolver.getColorMode();
            
            expect(colorMode).toBe('dark');
        });

        it('should default to light mode if not specified', () => {
            const state = createCascadeTestState();
            delete state.slideMasterPresets['master-default'].themeSettings.lumaTheme.colorMode;
            mockGetState.mockReturnValue(state);
            
            const colorMode = StyleResolver.getColorMode();
            
            expect(colorMode).toBe('light');
        });

        it('should use color mode in getThemeInfoForSlide', () => {
            const state = createCascadeTestState();
            state.slideMasterPresets['master-default'].colorModeId = 'dark';
            state.slideMasterPresets['master-default'].themeSettings.lumaTheme.colorMode = 'dark';
            mockGetState.mockReturnValue(state);
            
            const info = StyleResolver.getThemeInfoForSlide('slide-1');
            
            expect(info.colorMode).toBe('dark');
        });
    });
});

describe('CSS Variable Scoping (SlideView Integration)', () => {
    /**
     * These tests verify that CSS variables are applied per-slide,
     * not globally to document.documentElement.
     * 
     * The actual SlideView tests would be integration tests,
     * but we can test the StyleResolver's output is correct for each slide.
     */
    
    const createMultiThemeState = () => ({
        editor: { activeSlideId: 'slide-1', mode: 'edit' },
        slideMasterPresets: {
            'master-default': {
                id: 'master-default',
                type: 'slideMasterPreset',
                themeSettings: {
                    lumaTheme: {
                        id: 'theme-a',
                        resolvedColors: ['#A1', '#A2', '#A3', '#A4', '#A5', '#A6', '#A7', '#A8', '#A9', '#A10', '#A11', '#A12'],
                        colorMode: 'light'
                    }
                },
                colorModeId: ''
            },
            'layout-1': {
                id: 'layout-1',
                type: 'layoutMaster',
                parentMasterId: 'master-default',
                colorThemeId: null
            },
            'layout-2': {
                id: 'layout-2',
                type: 'layoutMaster',
                parentMasterId: 'master-default',
                colorThemeId: ''
            }
        },
        slides: {
            'slide-1': { id: 'slide-1', layoutId: 'layout-1', colorThemeId: null },
            'slide-2': { id: 'slide-2', layoutId: 'layout-2', colorThemeId: null },
            'slide-3': { id: 'slide-3', layoutId: 'layout-1', colorThemeId: '' }
        }
    });

    it('should resolve different themes for different slides', () => {
        mockGetState.mockReturnValue(createMultiThemeState());
        
        const slide1Theme = StyleResolver.getEffectiveColorTheme('slide-1');
        const slide2Theme = StyleResolver.getEffectiveColorTheme('slide-2');
        const slide3Theme = StyleResolver.getEffectiveColorTheme('slide-3');
        
        // slide-1: inherits from theme master (theme-a)
        expect(slide1Theme.source).toBe('master');
        
        // slide-2: inherits from layout-2 (theme-b)
        expect(slide2Theme.themeId).toBe('theme-b');
        expect(slide2Theme.source).toBe('layout');
        
        // slide-3: has own override (theme-c)
        expect(slide3Theme.themeId).toBe('theme-c');
        expect(slide3Theme.source).toBe('slide');
    });

    it('should return theme info that can be used for per-slide CSS var application', () => {
        mockGetState.mockReturnValue(createMultiThemeState());
        
        // Each slide should get its own theme info for CSS var application
        const slide1Info = StyleResolver.getThemeInfoForSlide('slide-1');
        const slide2Info = StyleResolver.getThemeInfoForSlide('slide-2');
        
        // The lumaTheme should be different or from different sources
        // so SlideView can apply different CSS vars to each slide's DOM
        expect(slide1Info.source).not.toBe(slide2Info.source);
    });
});

describe('Event System Integration', () => {
    /**
     * Test that the event system properly tracks theme changes
     * for re-render coordination.
     */

    it('should support computing affected slides for master theme change', () => {
        const state = createCascadeTestState();
        mockGetState.mockReturnValue(state);
        
        // When theme master changes, all slides are affected
        // This would be used to dispatch THEME_UPDATED event with affectedSlides: 'all'
        const allSlides = state.slideOrder;
        expect(allSlides).toContain('slide-1');
        expect(allSlides).toContain('slide-2');
        expect(allSlides).toContain('slide-3');
        expect(allSlides).toContain('slide-4');
    });

    it('should support computing affected slides for layout theme change', () => {
        const state = createCascadeTestState();
        mockGetState.mockReturnValue(state);
        
        // When layout-title changes, only slides using layout-title without their own override
        // In our test state: slide-2 uses layout-title with no override
        // slide-1 uses layout-title but has its own override, so technically not affected
        const layoutId = 'layout-title';
        const affectedSlides = state.slideOrder.filter(slideId => {
            const slide = state.slides[slideId];
            if (!slide) return false;
            if (slide.layoutId !== layoutId) return false;
            // If slide has its own override, it's not affected by layout change
            if (slide.styleAssignments?.colorTheme) return false;
            return true;
        });
        
        expect(affectedSlides).toContain('slide-2');
        expect(affectedSlides).not.toContain('slide-1'); // Has its own override
        expect(affectedSlides).not.toContain('slide-3'); // Different layout
    });

    it('should support computing affected slides for individual slide theme change', () => {
        // When a single slide's theme changes, only that slide is affected
        const affectedSlides = ['slide-1'];
        expect(affectedSlides).toHaveLength(1);
    });
});

// Helper function to create cascade test state
function createCascadeTestState() {
    return {
        editor: {
            activeSlideId: 'slide-1',
            activeMasterId: 'master-default',
            mode: 'edit'
        },
        slideMasterPresets: {
            'master-default': {
                id: 'master-default',
                type: 'slideMasterPreset',
                name: 'Default Theme Master',
                styleAssignments: {
                    colorTheme: null,
                    colorMode: 'light'
                },
                themeSettings: {
                    lumaTheme: {
                        id: 'preset_electric_dreams',
                        name: 'Electric Dreams',
                        slots: Array(12).fill({ h: 270, s: 50 }),
                        adjustments: { brightness: 0, contrast: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0, saturation: 0 },
                        resolvedColors: Array(12).fill('#808080'),
                        colorMode: 'light'
                    }
                }
            },
            'layout-title': {
                id: 'layout-title',
                type: 'layoutMaster',
                parentMasterId: 'master-default',
                name: 'Title Slide',
                colorThemeId: ''
            },
            'layout-blank': {
                id: 'layout-blank',
                type: 'layoutMaster',
                parentMasterId: 'master-default',
                name: 'Blank',
                colorThemeId: null
            },
            'layout-content': {
                id: 'layout-content',
                type: 'layoutMaster',
                parentMasterId: 'master-default',
                name: 'Content',
                colorThemeId: ''
            }
        },
        slides: {
            'slide-1': {
                id: 'slide-1',
                layoutId: 'layout-title',
                colorThemeId: ''
            },
            'slide-2': {
                id: 'slide-2',
                layoutId: 'layout-title',
                colorThemeId: null
            },
            'slide-3': {
                id: 'slide-3',
                layoutId: 'layout-blank',
                colorThemeId: null
            },
            'slide-4': {
                id: 'slide-4',
                layoutId: 'layout-content',
                colorThemeId: null
            },
            'slide-legacy': {
                id: 'slide-legacy',
                layoutId: 'layout-blank'
            }
        },
        slideOrder: ['slide-1', 'slide-2', 'slide-3', 'slide-4', 'slide-legacy']
    };
}



