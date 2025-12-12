import { DEFAULT_MASTERS } from '../store/InitialState.js';

function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (Array.isArray(obj)) return obj.map(deepClone);

    const cloned = {};
    for (const key of Object.keys(obj)) {
        cloned[key] = deepClone(obj[key]);
    }
    return cloned;
}

function deriveLayoutKey(layoutId) {
    return String(layoutId || '').replace(/^layout-/, '');
}

/**
 * Library-only preset definition (not stored as a master instance).
 */
export const MASTER_PRESET_DEFINITIONS = [
    {
        id: 'default-master-preset',
        name: 'Default Master',
        description: 'Clean, professional default master preset',
        colorThemeId: 'color-theme-default',
        typographyStyleId: 'typo-style-default',

        // Use the current DEFAULT_MASTERS templates as the geometry source of truth.
        // These templates are already canonical and reference-only.
        templateMasterId: 'master-default'
    }
];

export function getMasterPresetDefinitionById(presetId) {
    return MASTER_PRESET_DEFINITIONS.find(p => p.id === presetId) || null;
}

export function getMasterPresetDefinitionList() {
    return MASTER_PRESET_DEFINITIONS.map(({ id, name, description }) => ({ id, name, description }));
}

/**
 * Materialize a master preset definition into concrete store entities.
 *
 * Returns objects suitable for merging into `state.slideMasterPresets`.
 */
export function materializeMasterPresetDefinition(presetId, { masterId, masterName } = {}) {
    if (!presetId) throw new Error('presetId is required');
    if (!masterId) throw new Error('masterId is required');

    const def = getMasterPresetDefinitionById(presetId);
    if (!def) throw new Error(`Unknown master preset definition: ${presetId}`);

    const templateMaster = DEFAULT_MASTERS?.[def.templateMasterId];
    if (!templateMaster) throw new Error(`Missing template master: ${def.templateMasterId}`);

    const templateLayoutIds = templateMaster.layoutIds || [];
    const layoutKeys = templateLayoutIds.map(deriveLayoutKey);

    const master = {
        id: masterId,
        type: 'slideMasterPreset',
        name: masterName || def.name,
        colorThemeId: def.colorThemeId,
        typographyStyleId: def.typographyStyleId,
        background: deepClone(templateMaster.background || null),
        elements: deepClone(templateMaster.elements || {}),
        elementOrder: deepClone(templateMaster.elementOrder || []),
        layoutIds: layoutKeys.map(key => `${masterId}-layout-${key}`)
    };

    const layouts = {};
    for (const templateLayoutId of templateLayoutIds) {
        const templateLayout = DEFAULT_MASTERS?.[templateLayoutId];
        if (!templateLayout) {
            throw new Error(`Missing template layout: ${templateLayoutId}`);
        }

        const layoutKey = deriveLayoutKey(templateLayoutId);
        const layoutId = `${masterId}-layout-${layoutKey}`;

        const elements = deepClone(templateLayout.elements || {});
        for (const elementId of Object.keys(elements)) {
            const el = elements[elementId];
            if (el && el.isPlaceholder) {
                el.placeholderKey = el.placeholderKey || elementId;
            }
        }

        layouts[layoutId] = {
            id: layoutId,
            type: 'layoutMaster',
            parentMasterId: masterId,
            layoutKey,
            name: templateLayout.name,
            background: deepClone(templateLayout.background || null),
            // Layout-level overrides can be added later; inherit by default
            colorThemeId: null,
            typographyStyleId: null,
            elements,
            elementOrder: deepClone(templateLayout.elementOrder || [])
        };
    }

    return { master, layouts };
}
