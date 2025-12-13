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
    handleApplyFontPreset,
    handleResetThemeFonts,
    handleUpdateThemeFont,
    handleUpdateTextStyle,
    handleAddElementToMaster,
    handleDeleteElementFromMaster
} from '../../../../src/core/store/handlers/MasterHandlers.js';
import { createInitialState } from '../../../../src/core/store/InitialState.js';

// Mock the font presets

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

    describe('handleApplyFontPreset()', () => {
        it('should apply font preset to theme', () => {
            const preset = {
                id: 'custom-font-preset',
                name: 'Custom Font Preset',
                fonts: {
                    heading: 'Roboto',
                    body: 'Open Sans'
                }
            };

            const newState = produce(initialState, draft => {
                handleApplyFontPreset(draft, { masterId: 'master-default', preset });
            });

            const master = newState.slideMasterPresets['master-default'];
            expect(master.typographyStyleId).toBe('custom-font-preset');
            
            const appliedPreset = newState.typographyStylePresets['custom-font-preset'];
            expect(appliedPreset).toBeDefined();
            expect(appliedPreset.fonts.heading).toBe('Roboto');
            expect(appliedPreset.fonts.body).toBe('Open Sans');
        });

        it('should default to Inter if family not specified', () => {
            const preset = {
                id: 'empty-font-preset',
                name: 'Empty Font Preset',
                fonts: undefined // Simulate missing fonts
            };

            const newState = produce(initialState, draft => {
                handleApplyFontPreset(draft, { masterId: 'master-default', preset });
            });

            const appliedPreset = newState.typographyStylePresets['empty-font-preset'];
            expect(appliedPreset.fonts.heading).toBe('Inter');
            expect(appliedPreset.fonts.body).toBe('Inter');
        });
    });

    describe('handleResetThemeFonts()', () => {
        it('should reset fonts to default preset', () => {
            // Setup: Create a master with a custom font preset
            let state = produce(initialState, draft => {
                draft.typographyStylePresets = {
                    'custom-preset': {
                        id: 'custom-preset',
                        fonts: { heading: 'Comic Sans', body: 'Comic Sans' }
                    }
                };
                draft.slideMasterPresets['master-default'].typographyStyleId = 'custom-preset';
            });

            // Then reset
            state = produce(state, draft => {
                handleResetThemeFonts(draft, { masterId: 'master-default' });
            });

            // Should point to default preset
            const master = state.slideMasterPresets['master-default'];
            const presetId = master.typographyStyleId;
            const preset = state.typographyStylePresets[presetId];
            
            expect(preset.fonts.heading.family).toBe('Inter');
            expect(preset.fonts.body.family).toBe('Inter');
        });
    });

    describe('handleUpdateThemeFont()', () => {
        it('should update heading font', () => {
            // Setup: Ensure master has a typography preset
            let state = produce(initialState, draft => {
                draft.typographyStylePresets = {
                    'default-typography': {
                        id: 'default-typography',
                        fonts: { heading: 'Inter', body: 'Inter' }
                    }
                };
                draft.slideMasterPresets['master-default'].typographyStyleId = 'default-typography';
            });

            const newState = produce(state, draft => {
                handleUpdateThemeFont(draft, {
                    masterId: 'master-default',
                    fontType: 'heading',
                    value: 'Roboto'
                });
            });

            const presetId = newState.slideMasterPresets['master-default'].typographyStyleId;
            expect(newState.typographyStylePresets[presetId].fonts.heading).toBe('Roboto');
        });

        it('should update body font', () => {
             // Setup: Ensure master has a typography preset
             let state = produce(initialState, draft => {
                draft.typographyStylePresets = {
                    'default-typography': {
                        id: 'default-typography',
                        fonts: { heading: 'Inter', body: 'Inter' }
                    }
                };
                draft.slideMasterPresets['master-default'].typographyStyleId = 'default-typography';
            });

            const newState = produce(state, draft => {
                handleUpdateThemeFont(draft, {
                    masterId: 'master-default',
                    fontType: 'body',
                    value: 'Open Sans'
                });
            });

            const presetId = newState.slideMasterPresets['master-default'].typographyStyleId;
            expect(newState.typographyStylePresets[presetId].fonts.body).toBe('Open Sans');
        });

        it('should ignore invalid font type', () => {
             // Setup: Ensure master has a typography preset
             let state = produce(initialState, draft => {
                draft.typographyStylePresets = {
                    'default-typography': {
                        id: 'default-typography',
                        fonts: { heading: 'Inter', body: 'Inter' }
                    }
                };
                draft.slideMasterPresets['master-default'].typographyStyleId = 'default-typography';
            });

            const newState = produce(state, draft => {
                handleUpdateThemeFont(draft, {
                    masterId: 'master-default',
                    fontType: 'invalid',
                    value: 'Roboto'
                });
            });

            const presetId = newState.slideMasterPresets['master-default'].typographyStyleId;
            expect(newState.typographyStylePresets[presetId].fonts.invalid).toBeUndefined();
        });
    });

    describe('handleUpdateTextStyle()', () => {
        it('should update text style property', () => {
             // Setup: Ensure master has a typography preset
             let state = produce(initialState, draft => {
                draft.typographyStylePresets = {
                    'default-typography': {
                        id: 'default-typography',
                        textStyles: {
                            heading1: { fontSize: 32 }
                        }
                    }
                };
                draft.slideMasterPresets['master-default'].typographyStyleId = 'default-typography';
            });

            const newState = produce(state, draft => {
                handleUpdateTextStyle(draft, {
                    masterId: 'master-default',
                    styleId: 'heading1',
                    property: 'fontSize',
                    value: 48
                });
            });

            const presetId = newState.slideMasterPresets['master-default'].typographyStyleId;
            expect(newState.typographyStylePresets[presetId].textStyles.heading1.fontSize).toBe(48);
        });

        it('should create text style if not exists', () => {
             // Setup: Ensure master has a typography preset
             let state = produce(initialState, draft => {
                draft.typographyStylePresets = {
                    'default-typography': {
                        id: 'default-typography',
                        textStyles: {}
                    }
                };
                draft.slideMasterPresets['master-default'].typographyStyleId = 'default-typography';
            });

            const newState = produce(state, draft => {
                handleUpdateTextStyle(draft, {
                    masterId: 'master-default',
                    styleId: 'newStyle',
                    property: 'fontSize',
                    value: 24
                });
            });

            const presetId = newState.slideMasterPresets['master-default'].typographyStyleId;
            expect(newState.typographyStylePresets[presetId].textStyles.newStyle).toBeDefined();
            expect(newState.typographyStylePresets[presetId].textStyles.newStyle.fontSize).toBe(24);
        });

        it('should update multiple properties sequentially', () => {
             // Setup: Ensure master has a typography preset
             let state = produce(initialState, draft => {
                draft.typographyStylePresets = {
                    'default-typography': {
                        id: 'default-typography',
                        textStyles: {
                            heading1: { fontSize: 32 }
                        }
                    }
                };
                draft.slideMasterPresets['master-default'].typographyStyleId = 'default-typography';
            });

            state = produce(state, draft => {
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

            const presetId = state.slideMasterPresets['master-default'].typographyStyleId;
            expect(state.typographyStylePresets[presetId].textStyles.heading1.fontSize).toBe(48);
            expect(state.typographyStylePresets[presetId].textStyles.heading1.fontWeight).toBe(700);
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


