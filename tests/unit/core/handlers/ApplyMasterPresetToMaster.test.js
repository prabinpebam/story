import { describe, it, expect, beforeEach, vi } from 'vitest';
import { produce } from '../../../../src/vendor/immer.js';
import { createInitialState } from '../../../../src/core/store/InitialState.js';

// Provide a stable preset list so the handler can infer the "current" preset when master.presetId is absent.
vi.mock('../../../../src/core/store/SlideMasterPresets.js', () => ({
    getPresetById: () => null,
    getPresetList: () => ([{ id: 'preset-current', name: 'Current Preset' }]),
    getFullPresetById: (id) => ({
        id,
        theme: {
            // Keep minimal so we don't trigger font/theme side effects in the handler.
            themeSettings: {},
            background: { type: 'solid', value: '#FFFFFF' }
        },
        layouts: null
    }),
    SLIDE_MASTER_PRESETS: []
}));

import { handleApplySlideMasterPreset } from '../../../../src/core/store/handlers/MasterHandlers.js';
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
            handleApplySlideMasterPreset(draft, { masterId: 'master-default', presetId: 'preset-current' });
        });

        expect(next.slideMasterPresets['master-default'].presetId).toBe('preset-current');
    });

    it('blocks changing to a different preset when master is in use (no mutation)', () => {
        let result;
        const next = produce(initialState, (draft) => {
            result = handleApplySlideMasterPreset(draft, { masterId: 'master-default', presetId: 'preset-other' });
        });

        expect(next.slideMasterPresets['master-default'].presetId).toBeUndefined();

        expect(result?.blocked).toBe(true);
        expect(result?.notification?.type).toBe('blocked');
        expect(result?.notification?.title).toBe("Can’t change Master preset");
        expect(result?.notification?.body).toContain('used by existing slides');
    });
});
