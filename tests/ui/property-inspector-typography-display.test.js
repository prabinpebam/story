/**
 * UI Tests for Typography Property Inspector Display
 * Tests that PI shows correct values for font family, weight, size, and color
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock state - defined at module level
let mockState = {
    slides: {
        'slide-1': {
            id: 'slide-1',
            layoutId: 'layout-1',
            elements: []
        }
    },
    slideMasterPresets: {
        'layout-1': {
            id: 'layout-1',
            type: 'layout',
            parentMasterId: 'theme-default'
        },
        'theme-default': {
            id: 'theme-default',
            type: 'slideMasterPreset',
            name: 'Default Theme',
            typographyStyleId: 'typo-modern', // FIXED: Use correct key
            themeSettings: {
                lumaTheme: {
                    id: 'luma-1',
                    colorMode: 'light',
                    resolvedColors: [
                        '#0A0A0A', // slot 0 - darkest (TEXT_PRIMARY for light mode)
                        '#1A1A1A', // slot 1
                        '#2E2E2E', // slot 2 - (TEXT_SECONDARY for light mode)
                        '#424242', // slot 3
                        '#565656', // slot 4
                        '#6A6A6A', // slot 5
                        '#7E7E7E', // slot 6
                        '#929292', // slot 7
                        '#B4B4B4', // slot 8
                        '#CCCCCC', // slot 9 - (TEXT_SECONDARY for dark mode)
                        '#E6E6E6', // slot 10
                        '#F7F7F7'  // slot 11 - lightest (TEXT_PRIMARY for dark mode)
                    ]
                }
            }
        }
    },
    typographyStylePresets: {
        'typo-modern': {
            id: 'typo-modern',
            name: 'Modern Sans',
            fonts: {
                heading: 'Inter',
                body: 'Inter'
            },
            textStyles: {
                title: {
                    id: 'title',
                    name: 'Title',
                    fontFamily: 'var(--theme-font-heading, Inter)',
                    fontSize: 56,
                    fontWeight: '700',
                    lineHeight: 1.1,
                    letterSpacing: '-1%',
                    textFill: { type: 'solid', value: 'var(--theme-text-primary, #000)' }
                },
                body: {
                    id: 'body',
                    name: 'Body',
                    fontFamily: 'var(--theme-font-body, Inter)',
                    fontSize: 16,
                    fontWeight: '400',
                    lineHeight: 1.5,
                    letterSpacing: '0%',
                    textFill: { type: 'solid', value: 'var(--theme-text-primary, #000)' }
                }
            }
        }
    }
};

// Mock the Store module BEFORE importing StyleResolver
vi.mock('../../src/core/Store.js', () => ({
    store: {
        getState: () => mockState
    }
}));

// Set up window._storyAppStore for StyleResolver to find
if (typeof window === 'undefined') {
    global.window = {};
}
window._storyAppStore = {
    getState: () => mockState
};

// Import StyleResolver AFTER mocking
import { StyleResolver } from '../../src/utils/StyleResolver.js';

describe('Property Inspector Typography Display', () => {
    const mockSlideId = 'slide-1';

    beforeEach(() => {
        // Reset mockState to initial values if needed
    });

    describe('Text with Typography Style Applied', () => {
        it('should resolve fontFamily from CSS variable to actual font name', () => {
            const element = {
                id: 'text-1',
                type: 'text',
                textStyleId: 'title',
                content: 'Test Title'
            };

            const props = StyleResolver.getEffectiveTextProperties(element, {}, mockSlideId);

            expect(props.fontFamily).toBe('Inter');
            expect(props.fontFamily).not.toContain('var(');
        });

        it('should resolve fontWeight to actual value', () => {
            const element = {
                id: 'text-1',
                type: 'text',
                textStyleId: 'title',
                content: 'Test Title'
            };

            const props = StyleResolver.getEffectiveTextProperties(element, {}, mockSlideId);

            expect(props.fontWeight).toBe('700');
        });

        it('should resolve fontSize to numeric value', () => {
            const element = {
                id: 'text-1',
                type: 'text',
                textStyleId: 'title',
                content: 'Test Title'
            };

            const props = StyleResolver.getEffectiveTextProperties(element, {}, mockSlideId);

            expect(props.fontSize).toBe(56);
            expect(typeof props.fontSize).toBe('number');
        });

        it('should resolve textFill CSS variable to actual hex color', () => {
            const element = {
                id: 'text-1',
                type: 'text',
                textStyleId: 'title',
                content: 'Test Title'
            };

            const props = StyleResolver.getEffectiveTextProperties(element, {}, mockSlideId);

            expect(props.textFill).toBeDefined();
            expect(props.textFill.type).toBe('solid');
            expect(props.textFill.value).toMatch(/^#[0-9A-Fa-f]{6}$/); // Valid hex color
            expect(props.textFill.value).not.toContain('var(');
            // Light mode uses slot 0 for text-primary
            expect(props.textFill.value).toBe('#0A0A0A');
        });

        it('should resolve all properties when textStyleId is set', () => {
            const element = {
                id: 'text-1',
                type: 'text',
                textStyleId: 'body',
                content: 'Body text'
            };

            const props = StyleResolver.getEffectiveTextProperties(element, {}, mockSlideId);

            // All properties should be resolved, no CSS variables
            expect(props.fontFamily).toBe('Inter');
            expect(props.fontSize).toBe(16);
            expect(props.fontWeight).toBe('400');
            expect(props.textFill.value).toBe('#0A0A0A');
            expect(props.lineHeight).toBe(1.5);
        });
    });

    describe('Text WITHOUT Typography Style', () => {
        it('should use defaults when no textStyleId', () => {
            const element = {
                id: 'text-1',
                type: 'text',
                content: 'Plain text',
                fontFamily: 'Roboto', // Explicit value
                fontSize: 24
            };

            const props = StyleResolver.getEffectiveTextProperties(element, {}, mockSlideId);

            expect(props.fontFamily).toBe('Roboto');
            expect(props.fontSize).toBe(24);
            expect(props.textFill.value).toBe('#000000'); // Default
        });

        it('should resolve CSS variables even without textStyleId', () => {
            const element = {
                id: 'text-1',
                type: 'text',
                content: 'Plain text',
                fontFamily: 'var(--theme-font-heading)', // CSS variable directly on element
                textFill: { type: 'solid', value: 'var(--theme-text-primary)' }
            };

            const props = StyleResolver.getEffectiveTextProperties(element, {}, mockSlideId);

            expect(props.fontFamily).toBe('Inter');
            expect(props.textFill.value).toBe('#0A0A0A');
        });
    });

    describe('Dark vs Light Theme Color Mode', () => {
        it('should use light text colors for dark theme', () => {
            // Change to dark theme
            mockState.slideMasterPresets['theme-default'].themeSettings.lumaTheme.colorMode = 'dark';

            const element = {
                id: 'text-1',
                type: 'text',
                textStyleId: 'title',
                content: 'Dark theme text'
            };

            const props = StyleResolver.getEffectiveTextProperties(element, {}, mockSlideId);

            // Dark mode uses slot 11 for text-primary (lightest)
            expect(props.textFill.value).toBe('#F7F7F7');
        });

        it('should use dark text colors for light theme', () => {
            // Reset to light theme (previous test changed it to dark)
            mockState.slideMasterPresets['theme-default'].themeSettings.lumaTheme.colorMode = 'light';
            
            const element = {
                id: 'text-1',
                type: 'text',
                textStyleId: 'title',
                content: 'Light theme text'
            };

            const props = StyleResolver.getEffectiveTextProperties(element, {}, mockSlideId);

            // Light mode uses slot 0 for text-primary (darkest)
            expect(props.textFill.value).toBe('#0A0A0A');
        });

        it('should resolve text-secondary differently based on color mode', () => {
            const element = {
                id: 'text-1',
                type: 'text',
                content: 'Test',
                textFill: { type: 'solid', value: 'var(--theme-text-secondary)' }
            };

            // Light mode - should use slot 2
            mockState.slideMasterPresets['theme-default'].themeSettings.lumaTheme.colorMode = 'light';
            let props = StyleResolver.getEffectiveTextProperties(element, {}, mockSlideId);
            expect(props.textFill.value).toBe('#2E2E2E'); // slot 2

            // Dark mode - should use slot 9
            mockState.slideMasterPresets['theme-default'].themeSettings.lumaTheme.colorMode = 'dark';
            props = StyleResolver.getEffectiveTextProperties(element, {}, mockSlideId);
            expect(props.textFill.value).toBe('#CCCCCC'); // slot 9
        });
    });

    describe('Multiple Typography Presets', () => {
        beforeEach(() => {
            mockState.typographyStylePresets['typo-professional'] = {
                id: 'typo-professional',
                name: 'Professional',
                fonts: {
                    heading: 'Playfair Display',
                    body: 'Source Sans Pro'
                },
                textStyles: {
                    title: {
                        id: 'title',
                        name: 'Title',
                        fontFamily: 'var(--theme-font-heading, Playfair Display)',
                        fontSize: 60,
                        fontWeight: '700',
                        textFill: { type: 'solid', value: 'var(--theme-text-primary, #000)' }
                    }
                }
            };
        });

        it('should resolve to correct font when preset changes', () => {
            // Start with Modern (Inter)
            let element = {
                id: 'text-1',
                type: 'text',
                textStyleId: 'title',
                content: 'Title'
            };

            let props = StyleResolver.getEffectiveTextProperties(element, {}, mockSlideId);
            expect(props.fontFamily).toBe('Inter');
            expect(props.fontSize).toBe(56);

            // Change to Professional preset
            mockState.slideMasterPresets['theme-default'].typographyStyleId = 'typo-professional';
            
            props = StyleResolver.getEffectiveTextProperties(element, {}, mockSlideId);
            expect(props.fontFamily).toBe('Playfair Display');
            expect(props.fontSize).toBe(60);
        });
    });

    describe('Edge Cases', () => {
        it('should handle missing typography preset gracefully', () => {
            mockState.slideMasterPresets['theme-default'].typographyStyleId = 'non-existent';

            const element = {
                id: 'text-1',
                type: 'text',
                textStyleId: 'title',
                content: 'Test'
            };

            const props = StyleResolver.getEffectiveTextProperties(element, {}, mockSlideId);

            // Should use defaults
            expect(props.fontFamily).toBeDefined();
            expect(props.fontSize).toBeDefined();
        });

        it('should handle missing color theme gracefully', () => {
            delete mockState.slideMasterPresets['theme-default'].themeSettings.lumaTheme;

            const element = {
                id: 'text-1',
                type: 'text',
                textStyleId: 'title',
                content: 'Test'
            };

            const props = StyleResolver.getEffectiveTextProperties(element, {}, mockSlideId);

            // Should use legacy fallback colors
            expect(props.textFill.value).toMatch(/^#[0-9A-Fa-f]{6}$/);
        });

        it('should handle null/undefined values', () => {
            const element = {
                id: 'text-1',
                type: 'text',
                textStyleId: null,
                fontFamily: undefined,
                content: 'Test'
            };

            const props = StyleResolver.getEffectiveTextProperties(element, {}, mockSlideId);

            // Should use defaults
            expect(props.fontFamily).toBe('Inter');
            expect(props.fontSize).toBe(16);
            expect(props.textFill.value).toBe('#000000');
        });
    });
});
