import { describe, it, expect, vi } from 'vitest';
import { produce } from '../../../../src/vendor/immer.js';

// Mock presets to return a canonical materialized preset.
vi.mock('../../../../src/core/store/SlideMasterPresets.js', () => ({
    getPresetById: (id) => ({
        id,
        name: 'Preset A',
        description: '',
        colorThemeId: 'preset_neutral',
        typographyStyleId: 'typo-style-minimal',
        templateMasterId: 'master-default'
    }),
    getPresetList: () => ([{ id: 'preset-a', name: 'Preset A' }]),
    materializePreset: (presetId, { masterId, masterName } = {}) => {
        const layout1 = `${masterId}-layout-1`;
        const layout2 = `${masterId}-layout-2`;
        return {
            master: {
                id: masterId,
                type: 'slideMasterPreset',
                name: masterName || 'Master',
                colorThemeId: 'preset_neutral',
                typographyStyleId: 'typo-style-minimal',
                background: { type: 'solid', themeSlot: 11 },
                elements: { 'master-el-1': { id: 'master-el-1', type: 'shape' } },
                elementOrder: ['master-el-1'],
                layoutIds: [layout1, layout2]
            },
            layouts: {
                [layout1]: {
                    id: layout1,
                    type: 'layoutMaster',
                    parentMasterId: masterId,
                    layoutKey: 'layout-1',
                    name: 'Title Slide',
                    background: null,
                    colorThemeId: null,
                    typographyStyleId: null,
                    elements: { 'placeholder-title': { id: 'placeholder-title', type: 'text', isPlaceholder: true, placeholderType: 'title', placeholderKey: 'placeholder-title' } },
                    elementOrder: ['placeholder-title']
                },
                [layout2]: {
                    id: layout2,
                    type: 'layoutMaster',
                    parentMasterId: masterId,
                    layoutKey: 'layout-2',
                    name: 'Title + Content',
                    background: null,
                    colorThemeId: null,
                    typographyStyleId: null,
                    elements: { 'placeholder-body': { id: 'placeholder-body', type: 'text', isPlaceholder: true, placeholderType: 'body', placeholderKey: 'placeholder-body' } },
                    elementOrder: ['placeholder-body']
                }
            }
        };
    }
}));

import { handleApplyMasterPresetToMaster } from '../../../../src/core/store/handlers/MasterHandlers.js';

describe('M3: allowed apply replaces layout set (canonical master)', () => {
    it('rebuilds child layoutMasters and updates master.layoutIds when master is not in use', () => {
        const state = {
            slideMasterPresets: {
                'master-x': {
                    id: 'master-x',
                    type: 'slideMasterPreset',
                    name: 'Master X',
                    presetId: 'preset-old',
                    layoutIds: ['layout-old-1', 'layout-old-2'],
                    elements: {},
                    elementOrder: []
                },
                'layout-old-1': {
                    id: 'layout-old-1',
                    type: 'layoutMaster',
                    parentMasterId: 'master-x',
                    name: 'Old Layout 1',
                    elements: {},
                    elementOrder: []
                },
                'layout-old-2': {
                    id: 'layout-old-2',
                    type: 'layoutMaster',
                    parentMasterId: 'master-x',
                    name: 'Old Layout 2',
                    elements: {},
                    elementOrder: []
                }
            },
            slides: {},
            editor: { activeMasterId: 'layout-old-1' }
        };

        const next = produce(state, (draft) => {
            handleApplyMasterPresetToMaster(draft, { masterId: 'master-x', presetId: 'preset-a' });
        });

        // Old layouts removed
        expect(next.slideMasterPresets['layout-old-1']).toBeUndefined();
        expect(next.slideMasterPresets['layout-old-2']).toBeUndefined();

        // Master updated with new layout ids
        const layoutIds = next.slideMasterPresets['master-x'].layoutIds;
        expect(Array.isArray(layoutIds)).toBe(true);
        expect(layoutIds.length).toBe(2);

        // New layouts are canonical and under master-x
        const newLayouts = layoutIds.map((id) => next.slideMasterPresets[id]);
        expect(newLayouts.every((l) => l && l.type === 'layoutMaster' && l.parentMasterId === 'master-x')).toBe(true);
        expect(newLayouts.map((l) => l.name)).toEqual(['Title Slide', 'Title + Content']);

        // Active selection stays valid (falls back to master if needed)
        expect(next.slideMasterPresets[next.editor.activeMasterId]).toBeDefined();

        // Master-level elements applied
        expect(next.slideMasterPresets['master-x'].elements['master-el-1']).toBeDefined();
        expect(next.slideMasterPresets['master-x'].elementOrder).toEqual(['master-el-1']);
    });
});
