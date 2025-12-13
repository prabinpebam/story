
import { describe, it, expect, beforeEach } from 'vitest';
import { produce } from '../../../../src/vendor/immer.js';
import {
    handleApplyLumaTheme,
    handleUpdateLumaThemeSlot,
    handleUpdateLumaThemeAdjustments,
    handleSetColorMode
} from '../../../../src/core/store/handlers/MasterHandlers.js';

describe('LumaThemeHandlers', () => {
    let initialState;

    beforeEach(() => {
        initialState = {
            slideMasterPresets: {
                'master-1': {
                    id: 'master-1',
                    type: 'slideMasterPreset',
                    name: 'Test Master',
                    // Legacy structure for testing migration
                    themeSettings: {
                        lumaTheme: {
                            id: 'old-theme',
                            slots: []
                        }
                    }
                }
            },
            colorThemePresets: {}
        };
    });

    describe('handleApplyLumaTheme', () => {
        it('should apply theme reference and migrate data', () => {
            const themePayload = {
                id: 'theme-new',
                name: 'New Theme',
                slots: [{ h: 10, s: 20 }],
                adjustments: { contrast: 10 },
                colors: ['#111111']
            };

            const newState = produce(initialState, draft => {
                handleApplyLumaTheme(draft, {
                    masterId: 'master-1',
                    theme: themePayload
                });
            });

            const master = newState.slideMasterPresets['master-1'];
            const preset = newState.colorThemePresets['theme-new'];

            // Check Reference
            expect(master.colorThemeId).toBe('theme-new');
            
            // Check Cleanup
            expect(master.themeSettings).toBeUndefined();

            // Check Preset Creation
            expect(preset).toBeDefined();
            expect(preset.id).toBe('theme-new');
            expect(preset.lumaTheme).toBeDefined();
            expect(preset.lumaTheme.slots[0]).toEqual({ h: 10, s: 20 });
            expect(preset.lumaTheme.resolvedColors).toEqual(['#111111']);
        });
    });

    describe('handleUpdateLumaThemeSlot', () => {
        it('should update the referenced preset', () => {
            // Setup state with a referenced theme
            const stateWithTheme = produce(initialState, draft => {
                draft.slideMasterPresets['master-1'].colorThemeId = 'theme-1';
                draft.colorThemePresets['theme-1'] = {
                    id: 'theme-1',
                    lumaTheme: {
                        slots: Array(12).fill({ h: 0, s: 0 })
                    }
                };
            });

            const newState = produce(stateWithTheme, draft => {
                handleUpdateLumaThemeSlot(draft, {
                    masterId: 'master-1',
                    slotIndex: 0,
                    h: 180,
                    s: 50
                });
            });

            const preset = newState.colorThemePresets['theme-1'];
            expect(preset.lumaTheme.slots[0]).toEqual({ h: 180, s: 50 });
        });
    });

    describe('handleSetColorMode', () => {
        it('should store color mode on the master (not mutate preset)', () => {
            // Setup state with a referenced theme
            const stateWithTheme = produce(initialState, draft => {
                draft.slideMasterPresets['master-1'].colorThemeId = 'theme-1';
                draft.colorThemePresets['theme-1'] = {
                    id: 'theme-1',
                    isDark: false,
                    lumaTheme: { colorMode: 'light' }
                };
            });

            const newState = produce(stateWithTheme, draft => {
                handleSetColorMode(draft, {
                    masterId: 'master-1',
                    colorMode: 'dark'
                });
            });

            expect(newState.slideMasterPresets['master-1'].colorModeId).toBe('dark');

            // Referenced preset remains unchanged
            const preset = newState.colorThemePresets['theme-1'];
            expect(preset.isDark).toBe(false);
            expect(preset.lumaTheme.colorMode).toBe('light');
        });
    });
});
