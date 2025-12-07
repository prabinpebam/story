
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StyleResolver } from '../../../src/utils/StyleResolver.js';
import { store } from '../../../src/core/Store.js';
import { COLOR_MODES } from '../../../src/ui/panels/color-theme/ColorThemeUtils.js';

describe('StyleResolver (Reference Architecture)', () => {
    // Mock state with NEW architecture
    const createMockState = () => ({
        slideMasterPresets: {
            'master-ref': {
                id: 'master-ref',
                type: 'slideMasterPreset',
                name: 'Reference Master',
                colorThemeId: 'theme-ref-1', // Reference!
                colorModeId: null,
                // NO themeSettings
            }
        },
        colorThemePresets: {
            'theme-ref-1': {
                id: 'theme-ref-1',
                type: 'colorThemePreset',
                name: 'Referenced Theme',
                isDark: true,
                lumaTheme: {
                    colorMode: 'dark',
                    slots: [
                        { hex: '#111111' }, // Slot 0
                        // ... others
                    ]
                }
            }
        },
        slides: {
            'slide-1': {
                id: 'slide-1',
                layoutId: 'layout-title',
                colorThemeId: null
            }
        },
        editor: {
            activeSlideId: 'slide-1'
        }
    });

    let originalGetState;

    beforeEach(() => {
        originalGetState = store.getState;
        // Mock window store for StyleResolver
        window._storyAppStore = {
            getState: () => createMockState()
        };
    });

    afterEach(() => {
        store.getState = originalGetState;
        delete window._storyAppStore;
    });

    describe('getLumaTheme()', () => {
        it('should resolve theme from colorThemePresets via reference', () => {
            const lumaTheme = StyleResolver.getLumaTheme('slide-1');
            
            expect(lumaTheme).toBeDefined();
            expect(lumaTheme.colorMode).toBe('dark');
            expect(lumaTheme.slots[0].hex).toBe('#111111');
        });
    });

    describe('getColorMode()', () => {
        it('should resolve color mode from referenced preset', () => {
            const mode = StyleResolver.getColorMode();
            expect(mode).toBe(COLOR_MODES.DARK);
        });
    });
});
