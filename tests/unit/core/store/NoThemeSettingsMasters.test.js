import { describe, it, expect } from 'vitest';
import { produce } from '../../../../src/vendor/immer.js';
import { createInitialState } from '../../../../src/core/store/InitialState.js';
import { handleApplyMasterPresetToMaster } from '../../../../src/core/store/handlers/MasterHandlers.js';

function expectNoEmbeddedThemeSettings(slideMasterPresets) {
  for (const [id, record] of Object.entries(slideMasterPresets || {})) {
    expect(record.themeSettings, `themeSettings should be absent on ${id}`).toBeUndefined();
  }
}

describe('Canonical masters/layouts invariants', () => {
  it('createInitialState() has no embedded themeSettings on any master/layout', () => {
    const state = createInitialState();
    expectNoEmbeddedThemeSettings(state.slideMasterPresets);
  });

  it('APPLY_MASTER_PRESET_TO_MASTER does not create embedded themeSettings', () => {
    const state = createInitialState();

    const next = produce(state, (draft) => {
      // Create an unused master so preset replacement is allowed.
      draft.slideMasterPresets['master-unused'] = {
        id: 'master-unused',
        type: 'slideMasterPreset',
        name: 'Unused Master',
        colorThemeId: draft.slideMasterPresets['master-default']?.colorThemeId || 'color-theme-default',
        typographyStyleId: draft.slideMasterPresets['master-default']?.typographyStyleId || 'typo-style-default',
        background: draft.slideMasterPresets['master-default']?.background || { type: 'solid', value: '#FFFFFF' },
        elements: {},
        elementOrder: [],
        layoutIds: []
      };

      handleApplyMasterPresetToMaster(draft, {
        masterId: 'master-unused',
        presetId: 'master-preset-minimal'
      });
    });

    expectNoEmbeddedThemeSettings(next.slideMasterPresets);
  });
});
