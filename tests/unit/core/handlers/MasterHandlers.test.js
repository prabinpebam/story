/**
 * MasterHandlers Unit Tests
 * 
 * Tests the pure handler functions for master/theme management.
 * These handlers modify Immer draft state directly.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { produce } from '../../../../src/vendor/immer.js';
import {
    handleUpdateMaster,
    handleUpdateThemeSettings,
    handleApplyColorPreset,
    handleResetThemeColors,
    handleUpdateThemeColor,
    handleApplyFontPreset,
    handleResetThemeFonts,
    handleUpdateThemeFont,
    handleUpdateTextStyle,
    handleAddElementToMaster,
    handleDeleteElementFromMaster
} from '../../../../src/core/store/handlers/MasterHandlers.js';
import { createInitialState } from '../../../../src/core/store/InitialState.js';

// Mock the color/font presets
vi.mock('../../../../src/core/constants/ColorPresets.js', () => ({
    getDefaultPreset: () => ({
        id: 'default',
        name: 'Default',
        colors: {
            background1: '#ffffff',
            background2: '#f5f5f5',
            text1: '#1a1a1a',
            text2: '#666666',
            accent1: '#0066cc',
            accent2: '#004499',
            accent3: '#002266',
            accent4: '#00cc66',
            accent5: '#cc6600',
            accent6: '#cc0066'
        }
    })
}));

vi.mock('../../../../src/core/constants/FontPresets.js', () => ({
    getDefaultFontPreset: () => ({
        id: 'default',
        name: 'Default',
        fonts: {
            heading: { family: 'Inter', weight: 700 },
            body: { family: 'Inter', weight: 400 }
        }
    })
}));

describe('MasterHandlers', () => {
    let initialState;

    beforeEach(() => {
        initialState = createInitialState();
    });

    describe('handleUpdateMaster()', () => {
        it('should update master properties', () => {
            const newState = produce(initialState, draft => {
                handleUpdateMaster(draft, { id: 'theme-default', name: 'Updated Theme' });
            });

            expect(newState.masters['theme-default'].name).toBe('Updated Theme');
        });

        it('should merge properties with existing master', () => {
            const newState = produce(initialState, draft => {
                handleUpdateMaster(draft, { id: 'layout-blank', customProp: 'test' });
            });

            expect(newState.masters['layout-blank'].customProp).toBe('test');
            // Original properties should still exist
            expect(newState.masters['layout-blank'].type).toBe('layout');
        });

        it('should handle non-existent master gracefully', () => {
            const newState = produce(initialState, draft => {
                handleUpdateMaster(draft, { id: 'nonexistent', name: 'Test' });
            });

            expect(newState.masters['nonexistent']).toBeUndefined();
        });
    });

    describe('handleUpdateThemeSettings()', () => {
        it('should update theme colors', () => {
            const newState = produce(initialState, draft => {
                handleUpdateThemeSettings(draft, {
                    id: 'theme-default',
                    settings: { colors: { accent1: '#ff0000' } }
                });
            });

            expect(newState.masters['theme-default'].themeSettings.colors.accent1).toBe('#ff0000');
        });

        it('should update theme fonts', () => {
            const newState = produce(initialState, draft => {
                handleUpdateThemeSettings(draft, {
                    id: 'theme-default',
                    settings: { fonts: { heading: 'Roboto' } }
                });
            });

            expect(newState.masters['theme-default'].themeSettings.fonts.heading).toBe('Roboto');
        });

        it('should not update non-theme masters', () => {
            const originalLayout = initialState.masters['layout-blank'];
            
            const newState = produce(initialState, draft => {
                handleUpdateThemeSettings(draft, {
                    id: 'layout-blank',
                    settings: { colors: { accent1: '#ff0000' } }
                });
            });

            // Layout should not have themeSettings modified
            expect(newState.masters['layout-blank'].themeSettings).toEqual(originalLayout.themeSettings);
        });

        it('should create themeSettings if not exists', () => {
            let state = produce(initialState, draft => {
                draft.masters['theme-default'].themeSettings = undefined;
            });

            state = produce(state, draft => {
                handleUpdateThemeSettings(draft, {
                    id: 'theme-default',
                    settings: { colors: { accent1: '#ff0000' } }
                });
            });

            expect(state.masters['theme-default'].themeSettings).toBeDefined();
            expect(state.masters['theme-default'].themeSettings.colors.accent1).toBe('#ff0000');
        });
    });

    describe('handleApplyColorPreset()', () => {
        it('should apply color preset to theme', () => {
            const preset = {
                colors: {
                    background1: '#000000',
                    text1: '#ffffff',
                    accent1: '#00ff00'
                }
            };

            const newState = produce(initialState, draft => {
                handleApplyColorPreset(draft, { masterId: 'theme-default', preset });
            });

            expect(newState.masters['theme-default'].themeSettings.colors.background1).toBe('#000000');
            expect(newState.masters['theme-default'].themeSettings.colors.text1).toBe('#ffffff');
            expect(newState.masters['theme-default'].themeSettings.colors.accent1).toBe('#00ff00');
        });

        it('should set legacy aliases when applying preset', () => {
            const preset = {
                colors: {
                    accent1: '#00ff00',
                    text1: '#ffffff',
                    text2: '#cccccc'
                }
            };

            const newState = produce(initialState, draft => {
                handleApplyColorPreset(draft, { masterId: 'theme-default', preset });
            });

            expect(newState.masters['theme-default'].themeSettings.colors.accent).toBe('#00ff00');
            expect(newState.masters['theme-default'].themeSettings.colors.textPrimary).toBe('#ffffff');
            expect(newState.masters['theme-default'].themeSettings.colors.textSecondary).toBe('#cccccc');
        });

        it('should handle null preset gracefully', () => {
            const originalColors = initialState.masters['theme-default'].themeSettings?.colors;
            
            const newState = produce(initialState, draft => {
                handleApplyColorPreset(draft, { masterId: 'theme-default', preset: null });
            });

            expect(newState.masters['theme-default'].themeSettings?.colors).toEqual(originalColors);
        });
    });

    describe('handleResetThemeColors()', () => {
        it('should reset colors to default preset', () => {
            // First modify colors
            let state = produce(initialState, draft => {
                if (!draft.masters['theme-default'].themeSettings) {
                    draft.masters['theme-default'].themeSettings = { colors: {}, fonts: {} };
                }
                draft.masters['theme-default'].themeSettings.colors.accent1 = '#ff0000';
            });

            // Then reset
            state = produce(state, draft => {
                handleResetThemeColors(draft, { masterId: 'theme-default' });
            });

            expect(state.masters['theme-default'].themeSettings.colors.accent1).toBe('#0066cc');
        });

        it('should set legacy aliases on reset', () => {
            const newState = produce(initialState, draft => {
                handleResetThemeColors(draft, { masterId: 'theme-default' });
            });

            expect(newState.masters['theme-default'].themeSettings.colors.accent).toBe('#0066cc');
            expect(newState.masters['theme-default'].themeSettings.colors.textPrimary).toBe('#1a1a1a');
        });
    });

    describe('handleUpdateThemeColor()', () => {
        it('should update a single color role', () => {
            const newState = produce(initialState, draft => {
                handleUpdateThemeColor(draft, {
                    masterId: 'theme-default',
                    colorRole: 'accent1',
                    value: '#ff5500'
                });
            });

            expect(newState.masters['theme-default'].themeSettings.colors.accent1).toBe('#ff5500');
        });

        it('should update legacy alias when updating accent1', () => {
            const newState = produce(initialState, draft => {
                handleUpdateThemeColor(draft, {
                    masterId: 'theme-default',
                    colorRole: 'accent1',
                    value: '#ff5500'
                });
            });

            expect(newState.masters['theme-default'].themeSettings.colors.accent).toBe('#ff5500');
        });

        it('should update legacy alias when updating text1', () => {
            const newState = produce(initialState, draft => {
                handleUpdateThemeColor(draft, {
                    masterId: 'theme-default',
                    colorRole: 'text1',
                    value: '#333333'
                });
            });

            expect(newState.masters['theme-default'].themeSettings.colors.textPrimary).toBe('#333333');
        });

        it('should update legacy alias when updating text2', () => {
            const newState = produce(initialState, draft => {
                handleUpdateThemeColor(draft, {
                    masterId: 'theme-default',
                    colorRole: 'text2',
                    value: '#888888'
                });
            });

            expect(newState.masters['theme-default'].themeSettings.colors.textSecondary).toBe('#888888');
        });

        it('should create themeSettings structure if missing', () => {
            let state = produce(initialState, draft => {
                draft.masters['theme-default'].themeSettings = undefined;
            });

            state = produce(state, draft => {
                handleUpdateThemeColor(draft, {
                    masterId: 'theme-default',
                    colorRole: 'accent1',
                    value: '#ff5500'
                });
            });

            expect(state.masters['theme-default'].themeSettings.colors.accent1).toBe('#ff5500');
        });
    });

    describe('handleApplyFontPreset()', () => {
        it('should apply font preset to theme', () => {
            const preset = {
                fonts: {
                    heading: { family: 'Roboto' },
                    body: { family: 'Open Sans' }
                }
            };

            const newState = produce(initialState, draft => {
                handleApplyFontPreset(draft, { masterId: 'theme-default', preset });
            });

            expect(newState.masters['theme-default'].themeSettings.fonts.heading).toBe('Roboto');
            expect(newState.masters['theme-default'].themeSettings.fonts.body).toBe('Open Sans');
        });

        it('should default to Inter if family not specified', () => {
            const preset = {
                fonts: {
                    heading: {},
                    body: {}
                }
            };

            const newState = produce(initialState, draft => {
                handleApplyFontPreset(draft, { masterId: 'theme-default', preset });
            });

            expect(newState.masters['theme-default'].themeSettings.fonts.heading).toBe('Inter');
            expect(newState.masters['theme-default'].themeSettings.fonts.body).toBe('Inter');
        });
    });

    describe('handleResetThemeFonts()', () => {
        it('should reset fonts to default preset', () => {
            // First modify fonts
            let state = produce(initialState, draft => {
                if (!draft.masters['theme-default'].themeSettings) {
                    draft.masters['theme-default'].themeSettings = { colors: {}, fonts: {} };
                }
                draft.masters['theme-default'].themeSettings.fonts = { heading: 'Comic Sans', body: 'Comic Sans' };
            });

            // Then reset
            state = produce(state, draft => {
                handleResetThemeFonts(draft, { masterId: 'theme-default' });
            });

            expect(state.masters['theme-default'].themeSettings.fonts.heading).toBe('Inter');
            expect(state.masters['theme-default'].themeSettings.fonts.body).toBe('Inter');
        });
    });

    describe('handleUpdateThemeFont()', () => {
        it('should update heading font', () => {
            const newState = produce(initialState, draft => {
                handleUpdateThemeFont(draft, {
                    masterId: 'theme-default',
                    fontType: 'heading',
                    value: 'Roboto'
                });
            });

            expect(newState.masters['theme-default'].themeSettings.fonts.heading).toBe('Roboto');
        });

        it('should update body font', () => {
            const newState = produce(initialState, draft => {
                handleUpdateThemeFont(draft, {
                    masterId: 'theme-default',
                    fontType: 'body',
                    value: 'Open Sans'
                });
            });

            expect(newState.masters['theme-default'].themeSettings.fonts.body).toBe('Open Sans');
        });

        it('should ignore invalid font type', () => {
            let state = produce(initialState, draft => {
                if (!draft.masters['theme-default'].themeSettings) {
                    draft.masters['theme-default'].themeSettings = { colors: {}, fonts: { heading: 'Inter', body: 'Inter' } };
                }
            });

            state = produce(state, draft => {
                handleUpdateThemeFont(draft, {
                    masterId: 'theme-default',
                    fontType: 'invalid',
                    value: 'Roboto'
                });
            });

            // Fonts should remain unchanged
            expect(state.masters['theme-default'].themeSettings.fonts.invalid).toBeUndefined();
        });
    });

    describe('handleUpdateTextStyle()', () => {
        it('should update text style property', () => {
            const newState = produce(initialState, draft => {
                handleUpdateTextStyle(draft, {
                    masterId: 'theme-default',
                    styleId: 'heading1',
                    property: 'fontSize',
                    value: 48
                });
            });

            expect(newState.masters['theme-default'].themeSettings.textStyles.heading1.fontSize).toBe(48);
        });

        it('should create text style if not exists', () => {
            const newState = produce(initialState, draft => {
                handleUpdateTextStyle(draft, {
                    masterId: 'theme-default',
                    styleId: 'newStyle',
                    property: 'fontSize',
                    value: 24
                });
            });

            expect(newState.masters['theme-default'].themeSettings.textStyles.newStyle).toBeDefined();
            expect(newState.masters['theme-default'].themeSettings.textStyles.newStyle.fontSize).toBe(24);
        });

        it('should update multiple properties sequentially', () => {
            let state = produce(initialState, draft => {
                handleUpdateTextStyle(draft, {
                    masterId: 'theme-default',
                    styleId: 'heading1',
                    property: 'fontSize',
                    value: 48
                });
            });

            state = produce(state, draft => {
                handleUpdateTextStyle(draft, {
                    masterId: 'theme-default',
                    styleId: 'heading1',
                    property: 'fontWeight',
                    value: 700
                });
            });

            expect(state.masters['theme-default'].themeSettings.textStyles.heading1.fontSize).toBe(48);
            expect(state.masters['theme-default'].themeSettings.textStyles.heading1.fontWeight).toBe(700);
        });
    });

    describe('handleAddElementToMaster()', () => {
        it('should add element to master', () => {
            const element = {
                id: 'placeholder-1',
                type: 'placeholder',
                placeholderType: 'title',
                x: 100,
                y: 50,
                width: 800,
                height: 100
            };

            const newState = produce(initialState, draft => {
                handleAddElementToMaster(draft, { masterId: 'layout-title', element });
            });

            expect(newState.masters['layout-title'].elements['placeholder-1']).toBeDefined();
            expect(newState.masters['layout-title'].elements['placeholder-1'].type).toBe('placeholder');
        });

        it('should add element to elementOrder', () => {
            const element = {
                id: 'placeholder-new',
                type: 'placeholder'
            };

            const newState = produce(initialState, draft => {
                handleAddElementToMaster(draft, { masterId: 'layout-blank', element });
            });

            expect(newState.masters['layout-blank'].elementOrder).toContain('placeholder-new');
        });

        it('should not duplicate element in order if already present', () => {
            let state = produce(initialState, draft => {
                draft.masters['layout-blank'].elements = { 'elem-1': { id: 'elem-1' } };
                draft.masters['layout-blank'].elementOrder = ['elem-1'];
            });

            state = produce(state, draft => {
                handleAddElementToMaster(draft, {
                    masterId: 'layout-blank',
                    element: { id: 'elem-1', updated: true }
                });
            });

            const count = state.masters['layout-blank'].elementOrder.filter(id => id === 'elem-1').length;
            expect(count).toBe(1);
        });

        it('should initialize elements and elementOrder if not present', () => {
            let state = produce(initialState, draft => {
                delete draft.masters['layout-blank'].elements;
                delete draft.masters['layout-blank'].elementOrder;
            });

            state = produce(state, draft => {
                handleAddElementToMaster(draft, {
                    masterId: 'layout-blank',
                    element: { id: 'new-elem', type: 'rect' }
                });
            });

            expect(state.masters['layout-blank'].elements).toBeDefined();
            expect(state.masters['layout-blank'].elementOrder).toContain('new-elem');
        });
    });

    describe('handleDeleteElementFromMaster()', () => {
        it('should delete element from master', () => {
            let state = produce(initialState, draft => {
                draft.masters['layout-blank'].elements = { 'elem-1': { id: 'elem-1' } };
                draft.masters['layout-blank'].elementOrder = ['elem-1'];
            });

            state = produce(state, draft => {
                handleDeleteElementFromMaster(draft, { masterId: 'layout-blank', elementId: 'elem-1' });
            });

            expect(state.masters['layout-blank'].elements['elem-1']).toBeUndefined();
        });

        it('should remove element from elementOrder', () => {
            let state = produce(initialState, draft => {
                draft.masters['layout-blank'].elements = { 'elem-1': { id: 'elem-1' } };
                draft.masters['layout-blank'].elementOrder = ['elem-1'];
            });

            state = produce(state, draft => {
                handleDeleteElementFromMaster(draft, { masterId: 'layout-blank', elementId: 'elem-1' });
            });

            expect(state.masters['layout-blank'].elementOrder).not.toContain('elem-1');
        });

        it('should clear selection if deleted element was selected', () => {
            let state = produce(initialState, draft => {
                draft.masters['layout-blank'].elements = { 'elem-1': { id: 'elem-1' } };
                draft.masters['layout-blank'].elementOrder = ['elem-1'];
                draft.editor.selectedElementIds = ['elem-1', 'elem-2'];
            });

            state = produce(state, draft => {
                handleDeleteElementFromMaster(draft, { masterId: 'layout-blank', elementId: 'elem-1' });
            });

            expect(state.editor.selectedElementIds).not.toContain('elem-1');
            expect(state.editor.selectedElementIds).toContain('elem-2');
        });

        it('should handle deleting non-existent element gracefully', () => {
            const newState = produce(initialState, draft => {
                handleDeleteElementFromMaster(draft, { masterId: 'layout-blank', elementId: 'nonexistent' });
            });

            // Should not throw
            expect(newState).toBeDefined();
        });
    });
});
