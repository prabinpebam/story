import { describe, it, expect, beforeEach, vi } from 'vitest';
import { produce } from '../../../../src/vendor/immer.js';
import { createInitialState } from '../../../../src/core/store/InitialState.js';

// Provide a stable preset list so the handler can infer the "current" preset when master.presetId is absent.
vi.mock('../../../../src/core/store/SlideMasterPresets.js', () => ({
    getPresetById: (id) => ({
        id,
        name: 'Preset',
        description: '',
        colorThemeId: 'preset_neutral',
        typographyStyleId: 'typo-style-minimal',
        templateMasterId: 'master-default'
    }),
    getPresetList: () => ([{ id: 'master-preset-minimal', name: 'Minimal' }]),
    materializePreset: (presetId, { masterId, masterName } = {}) => {
        return {
            master: {
                id: masterId,
                type: 'slideMasterPreset',
                name: masterName || 'Master',
                colorThemeId: 'preset_neutral',
                typographyStyleId: 'typo-style-minimal',
                background: null,
                elements: {},
                elementOrder: [],
                layoutIds: [`${masterId}-layout-one`]
            },
            layouts: {
                [`${masterId}-layout-one`]: {
                    id: `${masterId}-layout-one`,
                    type: 'layoutMaster',
                    parentMasterId: masterId,
                    layoutKey: 'one',
                    name: 'One',
                    background: null,
                    colorThemeId: null,
                    typographyStyleId: null,
                    elements: {},
                    elementOrder: []
                }
            }
        };
    }
}));

import { handleApplyMasterPresetToMaster } from '../../../../src/core/store/handlers/MasterHandlers.js';
import { isMasterInUseBySlides } from '../../../../src/core/master/MasterUsage.js';

describe('M3: APPLY_MASTER_PRESET_TO_MASTER gating (handler-level)', () => {
    let initialState;

    beforeEach(() => {
        initialState = createInitialState();
        // Ensure presetId is absent to exercise the "inferred current preset" behavior.
        delete initialState.slideMasterPresets['master-default'].presetId;
    });

    it('detects a master as in use when any slide uses its layouts', () => {
        expect(isMasterInUseBySlides(initialState, 'master-default')).toBe(true);
    });

    it('allows applying the inferred current preset even if master is in use', () => {
        const next = produce(initialState, (draft) => {
            handleApplyMasterPresetToMaster(draft, { masterId: 'master-default', presetId: 'master-preset-minimal' });
        });

        expect(next.slideMasterPresets['master-default'].presetId).toBe('master-preset-minimal');
    });

    it('blocks changing to a different preset when master is in use (no mutation)', () => {
        let result;
        const next = produce(initialState, (draft) => {
            result = handleApplyMasterPresetToMaster(draft, { masterId: 'master-default', presetId: 'master-preset-corporate' });
        });

        expect(next.slideMasterPresets['master-default'].presetId).toBeUndefined();

        expect(result?.blocked).toBe(true);
        expect(result?.notification?.type).toBe('blocked');
        expect(result?.notification?.title).toBe("Can’t change Master preset");
        expect(result?.notification?.body).toContain('used by existing slides');
    });
});
