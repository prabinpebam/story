/**
 * MasterHandlers Unit Tests
 * 
 * Tests the pure handler functions for master/theme management.
 * These handlers modify Immer draft state directly.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { produce } from '../../../../src/vendor/immer.js';

// Mock SlideMasterPresets BEFORE importing MasterHandlers
vi.mock('../../../../src/core/store/SlideMasterPresets.js', () => ({
    getPresetById: () => null,
    getFullPresetById: () => null,
    SLIDE_MASTER_PRESETS: []
}));

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
    }),
    getPresetById: (id) => ({
        id: id || 'modern-clean',
        name: 'Modern Clean',
        fonts: {
            heading: { family: 'Playfair Display', weight: 700 },
            body: { family: 'Open Sans', weight: 400 }
        }
    }),
    FONT_PRESETS: []
}));

describe('MasterHandlers', () => {
    let initialState;

    beforeEach(() => {
        initialState = createInitialState();
    });

    describe('handleUpdateMaster()', () => {
        it('should update master properties', () => {
            const newState = produce(initialState, draft => {
                handleUpdateMaster(draft, { id: 'master-default', name: 'Updated Theme' });
            });

            expect(newState.slideMasterPresets['master-default'].name).toBe('Updated Theme');
        });

        it('should merge properties with existing master', () => {
            const newState = produce(initialState, draft => {
                handleUpdateMaster(draft, { id: 'layout-blank', customProp: 'test' });
            });

            expect(newState.slideMasterPresets['layout-blank'].customProp).toBe('test');
            // Original properties should still exist
            expect(newState.slideMasterPresets['layout-blank'].type).toBe('layoutMaster');
        });

        it('should handle non-existent master gracefully', () => {
            const newState = produce(initialState, draft => {
                handleUpdateMaster(draft, { id: 'nonexistent', name: 'Test' });
            });

            expect(newState.slideMasterPresets['nonexistent']).toBeUndefined();
        });
    });

    describe('handleUpdateThemeSettings()', () => {
        it('should update theme colors', () => {
            const newState = produce(initialState, draft => {
                handleUpdateThemeSettings(draft, {
                    id: 'master-default',
                    settings: { colors: { accent1: '#ff0000' } }
                });
            });

            expect(newState.slideMasterPresets['master-default'].themeSettings.colors.accent1).toBe('#ff0000');
        });

        it('should update theme fonts', () => {
            const newState = produce(initialState, draft => {
                handleUpdateThemeSettings(draft, {
                    id: 'master-default',
                    settings: { fonts: { heading: 'Roboto' } }
                });
            });

            expect(newState.slideMasterPresets['master-default'].themeSettings.fonts.heading).toBe('Roboto');
        });

        it('should not update non-theme masters', () => {
            const originalLayout = initialState.slideMasterPresets['layout-blank'];
            
            const newState = produce(initialState, draft => {
                handleUpdateThemeSettings(draft, {
                    id: 'layout-blank',
                    settings: { colors: { accent1: '#ff0000' } }
                });
            });

            // Layout should not have themeSettings modified
            expect(newState.slideMasterPresets['layout-blank'].themeSettings).toEqual(originalLayout.themeSettings);
        });

        it('should create themeSettings if not exists', () => {
            let state = produce(initialState, draft => {
                draft.slideMasterPresets['master-default'].themeSettings = undefined;
            });

            state = produce(state, draft => {
                handleUpdateThemeSettings(draft, {
                    id: 'master-default',
                    settings: { colors: { accent1: '#ff0000' } }
                });
            });

            expect(state.slideMasterPresets['master-default'].themeSettings).toBeDefined();
            expect(state.slideMasterPresets['master-default'].themeSettings.colors.accent1).toBe('#ff0000');
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
                handleApplyColorPreset(draft, { masterId: 'master-default', preset });
            });

            expect(newState.slideMasterPresets['master-default'].themeSettings.colors.background1).toBe('#000000');
            expect(newState.slideMasterPresets['master-default'].themeSettings.colors.text1).toBe('#ffffff');
            expect(newState.slideMasterPresets['master-default'].themeSettings.colors.accent1).toBe('#00ff00');
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
                handleApplyColorPreset(draft, { masterId: 'master-default', preset });
            });

            expect(newState.slideMasterPresets['master-default'].themeSettings.colors.accent).toBe('#00ff00');
            expect(newState.slideMasterPresets['master-default'].themeSettings.colors.textPrimary).toBe('#ffffff');
            expect(newState.slideMasterPresets['master-default'].themeSettings.colors.textSecondary).toBe('#cccccc');
        });

        it('should handle null preset gracefully', () => {
            const originalColors = initialState.slideMasterPresets['master-default'].themeSettings?.colors;
            
            const newState = produce(initialState, draft => {
                handleApplyColorPreset(draft, { masterId: 'master-default', preset: null });
            });

            expect(newState.slideMasterPresets['master-default'].themeSettings?.colors).toEqual(originalColors);
        });
    });

    describe('handleResetThemeColors()', () => {
        it('should reset colors to default preset', () => {
            // First modify colors
            let state = produce(initialState, draft => {
                if (!draft.slideMasterPresets['master-default'].themeSettings) {
                    draft.slideMasterPresets['master-default'].themeSettings = { colors: {}, fonts: {} };
                }
                draft.slideMasterPresets['master-default'].themeSettings.colors.accent1 = '#ff0000';
            });

            // Then reset
            state = produce(state, draft => {
                handleResetThemeColors(draft, { masterId: 'master-default' });
            });

            expect(state.slideMasterPresets['master-default'].themeSettings.colors.accent1).toBe('#0066cc');
        });

        it('should set legacy aliases on reset', () => {
            const newState = produce(initialState, draft => {
                handleResetThemeColors(draft, { masterId: 'master-default' });
            });

            expect(newState.slideMasterPresets['master-default'].themeSettings.colors.accent).toBe('#0066cc');
            expect(newState.slideMasterPresets['master-default'].themeSettings.colors.textPrimary).toBe('#1a1a1a');
        });
    });

    describe('handleUpdateThemeColor()', () => {
        it('should update a single color role', () => {
            const newState = produce(initialState, draft => {
                handleUpdateThemeColor(draft, {
                    masterId: 'master-default',
                    colorRole: 'accent1',
                    value: '#ff5500'
                });
            });

            expect(newState.slideMasterPresets['master-default'].themeSettings.colors.accent1).toBe('#ff5500');
        });

        it('should update legacy alias when updating accent1', () => {
            const newState = produce(initialState, draft => {
                handleUpdateThemeColor(draft, {
                    masterId: 'master-default',
                    colorRole: 'accent1',
                    value: '#ff5500'
                });
            });

            expect(newState.slideMasterPresets['master-default'].themeSettings.colors.accent).toBe('#ff5500');
        });

        it('should update legacy alias when updating text1', () => {
            const newState = produce(initialState, draft => {
                handleUpdateThemeColor(draft, {
                    masterId: 'master-default',
                    colorRole: 'text1',
                    value: '#333333'
                });
            });

            expect(newState.slideMasterPresets['master-default'].themeSettings.colors.textPrimary).toBe('#333333');
        });

        it('should update legacy alias when updating text2', () => {
            const newState = produce(initialState, draft => {
                handleUpdateThemeColor(draft, {
                    masterId: 'master-default',
                    colorRole: 'text2',
                    value: '#888888'
                });
            });

            expect(newState.slideMasterPresets['master-default'].themeSettings.colors.textSecondary).toBe('#888888');
        });

        it('should create themeSettings structure if missing', () => {
            let state = produce(initialState, draft => {
                draft.slideMasterPresets['master-default'].themeSettings = undefined;
            });

            state = produce(state, draft => {
                handleUpdateThemeColor(draft, {
                    masterId: 'master-default',
                    colorRole: 'accent1',
                    value: '#ff5500'
                });
            });

            expect(state.slideMasterPresets['master-default'].themeSettings.colors.accent1).toBe('#ff5500');
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
                handleApplyFontPreset(draft, { masterId: 'master-default', preset });
            });

            expect(newState.slideMasterPresets['master-default'].themeSettings.fonts.heading).toBe('Roboto');
            expect(newState.slideMasterPresets['master-default'].themeSettings.fonts.body).toBe('Open Sans');
        });

        it('should default to Inter if family not specified', () => {
            const preset = {
                fonts: {
                    heading: {},
                    body: {}
                }
            };

            const newState = produce(initialState, draft => {
                handleApplyFontPreset(draft, { masterId: 'master-default', preset });
            });

            expect(newState.slideMasterPresets['master-default'].themeSettings.fonts.heading).toBe('Inter');
            expect(newState.slideMasterPresets['master-default'].themeSettings.fonts.body).toBe('Inter');
        });
    });

    describe('handleResetThemeFonts()', () => {
        it('should reset fonts to default preset', () => {
            // First modify fonts
            let state = produce(initialState, draft => {
                if (!draft.slideMasterPresets['master-default'].themeSettings) {
                    draft.slideMasterPresets['master-default'].themeSettings = { colors: {}, fonts: {} };
                }
                draft.slideMasterPresets['master-default'].themeSettings.fonts = { heading: 'Comic Sans', body: 'Comic Sans' };
            });

            // Then reset
            state = produce(state, draft => {
                handleResetThemeFonts(draft, { masterId: 'master-default' });
            });

            expect(state.slideMasterPresets['master-default'].themeSettings.fonts.heading).toBe('Inter');
            expect(state.slideMasterPresets['master-default'].themeSettings.fonts.body).toBe('Inter');
        });
    });

    describe('handleUpdateThemeFont()', () => {
        it('should update heading font', () => {
            const newState = produce(initialState, draft => {
                handleUpdateThemeFont(draft, {
                    masterId: 'master-default',
                    fontType: 'heading',
                    value: 'Roboto'
                });
            });

            expect(newState.slideMasterPresets['master-default'].themeSettings.fonts.heading).toBe('Roboto');
        });

        it('should update body font', () => {
            const newState = produce(initialState, draft => {
                handleUpdateThemeFont(draft, {
                    masterId: 'master-default',
                    fontType: 'body',
                    value: 'Open Sans'
                });
            });

            expect(newState.slideMasterPresets['master-default'].themeSettings.fonts.body).toBe('Open Sans');
        });

        it('should ignore invalid font type', () => {
            let state = produce(initialState, draft => {
                if (!draft.slideMasterPresets['master-default'].themeSettings) {
                    draft.slideMasterPresets['master-default'].themeSettings = { colors: {}, fonts: { heading: 'Inter', body: 'Inter' } };
                }
            });

            state = produce(state, draft => {
                handleUpdateThemeFont(draft, {
                    masterId: 'master-default',
                    fontType: 'invalid',
                    value: 'Roboto'
                });
            });

            // Fonts should remain unchanged
            expect(state.slideMasterPresets['master-default'].themeSettings.fonts.invalid).toBeUndefined();
        });
    });

    describe('handleUpdateTextStyle()', () => {
        it('should update text style property', () => {
            const newState = produce(initialState, draft => {
                handleUpdateTextStyle(draft, {
                    masterId: 'master-default',
                    styleId: 'heading1',
                    property: 'fontSize',
                    value: 48
                });
            });

            expect(newState.slideMasterPresets['master-default'].themeSettings.textStyles.heading1.fontSize).toBe(48);
        });

        it('should create text style if not exists', () => {
            const newState = produce(initialState, draft => {
                handleUpdateTextStyle(draft, {
                    masterId: 'master-default',
                    styleId: 'newStyle',
                    property: 'fontSize',
                    value: 24
                });
            });

            expect(newState.slideMasterPresets['master-default'].themeSettings.textStyles.newStyle).toBeDefined();
            expect(newState.slideMasterPresets['master-default'].themeSettings.textStyles.newStyle.fontSize).toBe(24);
        });

        it('should update multiple properties sequentially', () => {
            let state = produce(initialState, draft => {
                handleUpdateTextStyle(draft, {
                    masterId: 'master-default',
                    styleId: 'heading1',
                    property: 'fontSize',
                    value: 48
                });
            });

            state = produce(state, draft => {
                handleUpdateTextStyle(draft, {
                    masterId: 'master-default',
                    styleId: 'heading1',
                    property: 'fontWeight',
                    value: 700
                });
            });

            expect(state.slideMasterPresets['master-default'].themeSettings.textStyles.heading1.fontSize).toBe(48);
            expect(state.slideMasterPresets['master-default'].themeSettings.textStyles.heading1.fontWeight).toBe(700);
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

            expect(newState.slideMasterPresets['layout-title'].elements['placeholder-1']).toBeDefined();
            expect(newState.slideMasterPresets['layout-title'].elements['placeholder-1'].type).toBe('placeholder');
        });

        it('should add element to elementOrder', () => {
            const element = {
                id: 'placeholder-new',
                type: 'placeholder'
            };

            const newState = produce(initialState, draft => {
                handleAddElementToMaster(draft, { masterId: 'layout-blank', element });
            });

            expect(newState.slideMasterPresets['layout-blank'].elementOrder).toContain('placeholder-new');
        });

        it('should not duplicate element in order if already present', () => {
            let state = produce(initialState, draft => {
                draft.slideMasterPresets['layout-blank'].elements = { 'elem-1': { id: 'elem-1' } };
                draft.slideMasterPresets['layout-blank'].elementOrder = ['elem-1'];
            });

            state = produce(state, draft => {
                handleAddElementToMaster(draft, {
                    masterId: 'layout-blank',
                    element: { id: 'elem-1', updated: true }
                });
            });

            const count = state.slideMasterPresets['layout-blank'].elementOrder.filter(id => id === 'elem-1').length;
            expect(count).toBe(1);
        });

        it('should initialize elements and elementOrder if not present', () => {
            let state = produce(initialState, draft => {
                delete draft.slideMasterPresets['layout-blank'].elements;
                delete draft.slideMasterPresets['layout-blank'].elementOrder;
            });

            state = produce(state, draft => {
                handleAddElementToMaster(draft, {
                    masterId: 'layout-blank',
                    element: { id: 'new-elem', type: 'rect' }
                });
            });

            expect(state.slideMasterPresets['layout-blank'].elements).toBeDefined();
            expect(state.slideMasterPresets['layout-blank'].elementOrder).toContain('new-elem');
        });
    });

    describe('handleDeleteElementFromMaster()', () => {
        it('should delete element from master', () => {
            let state = produce(initialState, draft => {
                draft.slideMasterPresets['layout-blank'].elements = { 'elem-1': { id: 'elem-1' } };
                draft.slideMasterPresets['layout-blank'].elementOrder = ['elem-1'];
            });

            state = produce(state, draft => {
                handleDeleteElementFromMaster(draft, { masterId: 'layout-blank', elementId: 'elem-1' });
            });

            expect(state.slideMasterPresets['layout-blank'].elements['elem-1']).toBeUndefined();
        });

        it('should remove element from elementOrder', () => {
            let state = produce(initialState, draft => {
                draft.slideMasterPresets['layout-blank'].elements = { 'elem-1': { id: 'elem-1' } };
                draft.slideMasterPresets['layout-blank'].elementOrder = ['elem-1'];
            });

            state = produce(state, draft => {
                handleDeleteElementFromMaster(draft, { masterId: 'layout-blank', elementId: 'elem-1' });
            });

            expect(state.slideMasterPresets['layout-blank'].elementOrder).not.toContain('elem-1');
        });

        it('should clear selection if deleted element was selected', () => {
            let state = produce(initialState, draft => {
                draft.slideMasterPresets['layout-blank'].elements = { 'elem-1': { id: 'elem-1' } };
                draft.slideMasterPresets['layout-blank'].elementOrder = ['elem-1'];
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


