/**
 * Effect Defaults and Type Definitions
 * 
 * Centralizes effect configuration for the Effects section.
 * 
 * Data Model:
 * element.style.effects = [
 *   { id: 'xxx', type: 'dropShadow', x: 0, y: 4, blur: 8, spread: 0, color: '#000000', opacity: 25, blendMode: 'normal', visible: true },
 *   { id: 'yyy', type: 'innerShadow', ... },
 *   { id: 'zzz', type: 'layerBlur', radius: 12, mode: 'uniform', visible: true }
 * ]
 */

/**
 * Effect Types Enum
 */
export const EffectTypes = {
    DROP_SHADOW: 'dropShadow',
    INNER_SHADOW: 'innerShadow',
    LAYER_BLUR: 'layerBlur',
    BACKGROUND_BLUR: 'backgroundBlur'
};

/**
 * Effect Type Labels (for UI display)
 */
export const EffectTypeLabels = {
    [EffectTypes.DROP_SHADOW]: 'Drop Shadow',
    [EffectTypes.INNER_SHADOW]: 'Inner Shadow',
    [EffectTypes.LAYER_BLUR]: 'Layer Blur',
    [EffectTypes.BACKGROUND_BLUR]: 'Background Blur'
};

/**
 * Default values for each effect type
 */
export const EffectDefaults = {
    [EffectTypes.DROP_SHADOW]: {
        type: EffectTypes.DROP_SHADOW,
        x: 0,
        y: 4,
        blur: 8,
        spread: 0,
        color: '#000000',
        opacity: 25,
        blendMode: 'normal',
        visible: true
    },
    [EffectTypes.INNER_SHADOW]: {
        type: EffectTypes.INNER_SHADOW,
        x: 0,
        y: 2,
        blur: 4,
        spread: 0,
        color: '#000000',
        opacity: 25,
        blendMode: 'normal',
        visible: true
    },
    [EffectTypes.LAYER_BLUR]: {
        type: EffectTypes.LAYER_BLUR,
        radius: 12,
        mode: 'uniform',
        visible: true
    },
    [EffectTypes.BACKGROUND_BLUR]: {
        type: EffectTypes.BACKGROUND_BLUR,
        radius: 12,
        visible: true
    }
};

/**
 * Get dropdown options for effect type selector
 */
export function getEffectTypeOptions() {
    return [
        { label: EffectTypeLabels[EffectTypes.DROP_SHADOW], value: EffectTypes.DROP_SHADOW },
        { label: EffectTypeLabels[EffectTypes.INNER_SHADOW], value: EffectTypes.INNER_SHADOW },
        { label: EffectTypeLabels[EffectTypes.LAYER_BLUR], value: EffectTypes.LAYER_BLUR },
        { label: EffectTypeLabels[EffectTypes.BACKGROUND_BLUR], value: EffectTypes.BACKGROUND_BLUR }
    ];
}

/**
 * Check if effect type is a shadow (has x, y, blur, spread, color)
 */
export function isShadowEffect(type) {
    return type === EffectTypes.DROP_SHADOW || type === EffectTypes.INNER_SHADOW;
}

/**
 * Check if effect type is a blur (has radius)
 */
export function isBlurEffect(type) {
    return type === EffectTypes.LAYER_BLUR || type === EffectTypes.BACKGROUND_BLUR;
}

/**
 * Create a new effect with default values and unique ID
 */
export function createEffect(type) {
    if (!EffectDefaults[type]) {
        console.warn(`Unknown effect type: ${type}, defaulting to dropShadow`);
        type = EffectTypes.DROP_SHADOW;
    }
    return {
        ...EffectDefaults[type],
        id: `effect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
}

/**
 * Blend mode options for shadow effects
 */
export const BlendModeOptions = [
    { label: 'Normal', value: 'normal' },
    { label: 'Multiply', value: 'multiply' },
    { label: 'Screen', value: 'screen' },
    { label: 'Overlay', value: 'overlay' },
    { label: 'Darken', value: 'darken' },
    { label: 'Lighten', value: 'lighten' },
    { label: 'Color Dodge', value: 'color-dodge' },
    { label: 'Color Burn', value: 'color-burn' },
    { label: 'Hard Light', value: 'hard-light' },
    { label: 'Soft Light', value: 'soft-light' },
    { label: 'Difference', value: 'difference' },
    { label: 'Exclusion', value: 'exclusion' },
    { label: 'Hue', value: 'hue' },
    { label: 'Saturation', value: 'saturation' },
    { label: 'Color', value: 'color' },
    { label: 'Luminosity', value: 'luminosity' }
];
