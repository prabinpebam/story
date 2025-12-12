/**
 * SlideMasterPresets.js
 *
 * Canonical master preset library.
 *
 * IMPORTANT:
 * - Master presets NEVER embed colors or typography definitions.
 * - Presets only reference existing `colorThemeId` and `typographyStyleId`.
 * - Geometry comes from template masters/layouts and is materialized into
 *   concrete `slideMasterPreset` + `layoutMaster` records at apply time.
 */

import {
    getMasterPresetDefinitionById,
    getMasterPresetDefinitionList,
    materializeMasterPresetDefinition
} from '../masterPresets/MasterPresetLibrary.js';

import { DEFAULT_MASTERS } from './InitialState.js';

/**
 * Get preset definition metadata by ID.
 */
export function getPresetById(id) {
    const def = getMasterPresetDefinitionById(id);
    if (!def) return null;
    return {
        id: def.id,
        name: def.name,
        description: def.description,
        colorThemeId: def.colorThemeId,
        typographyStyleId: def.typographyStyleId,
        templateMasterId: def.templateMasterId
    };
}

/**
 * Get full preset definition by ID.
 * Kept for compatibility with existing imports.
 */
export function getFullPresetById(id) {
    return getPresetById(id);
}

/**
 * List presets for UI display.
 */
export function getPresetList() {
    const list = getMasterPresetDefinitionList();
    return list.map(item => {
        const def = getMasterPresetDefinitionById(item.id);
        const templateMaster = def?.templateMasterId ? DEFAULT_MASTERS?.[def.templateMasterId] : null;
        return {
            id: item.id,
            name: item.name,
            description: item.description,
            colorThemeId: def?.colorThemeId || null,
            typographyStyleId: def?.typographyStyleId || null,
            background: templateMaster?.background || null
        };
    });
}

/**
 * Materialize a preset into concrete store entities.
 * Returns { master, layouts }.
 */
export function materializePreset(presetId, { masterId, masterName } = {}) {
    return materializeMasterPresetDefinition(presetId, { masterId, masterName });
}

/**
 * Default preset metadata.
 */
export function getDefaultPreset() {
    const first = getPresetList()?.[0] || null;
    return first ? getPresetById(first.id) : null;
}
