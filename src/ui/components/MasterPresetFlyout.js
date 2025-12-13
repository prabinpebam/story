import { Flyout } from './Flyout.js';
import { Button } from './Button.js';
import { store } from '../../core/Store.js';
import { getPresetById, getPresetList } from '../../core/store/SlideMasterPresets.js';
import { getPresetById as getThemePresetById } from '../panels/color-theme/ThemePresets.js';
import { generateThemeColors, DEFAULT_ADJUSTMENTS, getEffectiveSlotIndex, COLOR_MODES } from '../panels/color-theme/ColorThemeUtils.js';

const COLOR_SLOT_ORDER = [
    'background1',
    'background2',
    'text1',
    'text2',
    'accent1',
    'accent2',
    'accent3',
    'accent4',
    'accent5',
    'accent6',
    'hyperlink',
    'followedHyperlink'
];

function colorsObjectToResolvedArray(colors) {
    if (!colors || typeof colors !== 'object') return null;
    const resolved = COLOR_SLOT_ORDER.map(key => colors[key]).filter(Boolean);
    return resolved.length === 12 ? resolved : null;
}

function resolveThemeHexColors(themeId) {
    const state = store.getState();
    const preset = themeId ? state?.colorThemePresets?.[themeId] : null;
    if (preset?.lumaTheme?.slots) {
        return generateThemeColors(preset.lumaTheme.slots, preset.lumaTheme.adjustments || DEFAULT_ADJUSTMENTS);
    }
    if (preset?.colors) {
        return colorsObjectToResolvedArray(preset.colors);
    }

    const themePreset = themeId ? getThemePresetById(themeId) : null;
    if (themePreset?.slots) {
        return generateThemeColors(themePreset.slots, themePreset.adjustments || DEFAULT_ADJUSTMENTS);
    }

    return null;
}

function getCurrentColorMode() {
    const state = store.getState();
    const themeMaster = Object.values(state.slideMasterPresets || {}).find(m => m.type === 'slideMasterPreset');
    return themeMaster?.colorModeId || COLOR_MODES.LIGHT;
}

/**
 * Flyout for selecting a master preset.
 *
 * Modes:
 * - apply: apply preset to an existing masterId (dispatches APPLY_MASTER_PRESET_TO_MASTER)
 * - create: create a new master from a preset (calls onCreate(presetId))
 */
export class MasterPresetFlyout extends Flyout {
    constructor(options = {}) {
        super(options);

        this.mode = options.mode || 'apply';
        this.masterId = options.masterId || null;
        this.onCreate = options.onCreate || null;

        this.selectedPresetId = options.selectedPresetId || null;

        this.element.className = 'master-preset-flyout ui-flyout';
        this.element.setAttribute('data-testid', 'master-preset-picker-panel');

        // Prevent clicks from closing the flyout
        this.element.addEventListener('mousedown', (e) => e.stopPropagation());

        this.render();
    }

    setContext({ mode, masterId, selectedPresetId } = {}) {
        if (mode) this.mode = mode;
        if (masterId !== undefined) this.masterId = masterId;
        if (selectedPresetId !== undefined) this.selectedPresetId = selectedPresetId;
        this.render();
    }

    render() {
        this.element.innerHTML = '';

        const root = document.createElement('div');
        root.className = 'preset-flyout-content';

        const title = document.createElement('div');
        title.className = 'preset-flyout-title';
        title.textContent = this.mode === 'create' ? 'Choose a Master Preset' : 'Master Presets';
        root.appendChild(title);

        const listEl = document.createElement('div');
        listEl.className = 'preset-flyout-grid';
        root.appendChild(listEl);

        const footer = document.createElement('div');
        footer.className = 'pi-row pi-row--space-between';

        const cancelBtn = new Button({
            label: 'Cancel',
            variant: 'secondary',
            size: 'sm',
            onClick: () => this.close()
        });
        cancelBtn.element.setAttribute('data-testid', 'master-preset-cancel');

        const confirmBtn = new Button({
            label: this.mode === 'create' ? 'Create' : 'Apply',
            variant: 'primary',
            size: 'sm',
            onClick: () => this.confirm()
        });
        confirmBtn.element.setAttribute('data-testid', this.mode === 'create' ? 'master-preset-create' : 'master-preset-apply');

        footer.appendChild(cancelBtn.element);
        footer.appendChild(confirmBtn.element);
        root.appendChild(footer);

        const presets = getPresetList() || [];

        // Default selection
        if (!this.selectedPresetId) {
            if (this.mode === 'apply' && this.masterId) {
                const state = store.getState();
                const master = state?.slideMasterPresets?.[this.masterId] || null;
                this.selectedPresetId = master?.presetId || presets?.[0]?.id || null;
            } else {
                this.selectedPresetId = presets?.[0]?.id || null;
            }
        }

        presets.forEach(preset => {
            const item = document.createElement('div');
            item.className = 'preset-thumbnail' + (preset.id === this.selectedPresetId ? ' selected' : '');
            item.dataset.presetId = preset.id;
            item.title = preset.name;
            item.setAttribute('data-testid', 'master-preset-item');
            item.setAttribute('data-preset-id', preset.id);

            const preview = document.createElement('div');
            preview.className = 'preset-preview';

            const hexColors = resolveThemeHexColors(preset.colorThemeId);
            const colorMode = getCurrentColorMode();

            const bgFill = Array.isArray(preset.background)
                ? preset.background[0]
                : preset.background;
            if (bgFill) {
                if (bgFill.themeSlot !== undefined && bgFill.themeSlot !== null) {
                    const slotIndex = getEffectiveSlotIndex(bgFill.themeSlot, colorMode);
                    const hex = Array.isArray(hexColors) ? hexColors[slotIndex] : null;
                    if (hex) preview.style.backgroundColor = hex;
                } else if (bgFill.value) {
                    preview.style.backgroundColor = bgFill.value;
                }
            }

            const swatches = document.createElement('div');
            swatches.className = 'preset-swatches';

            if (Array.isArray(hexColors)) {
                [0, 1, 2, 3].forEach(slotIndex => {
                    const effectiveSlotIndex = getEffectiveSlotIndex(slotIndex, colorMode);
                    const hex = hexColors[effectiveSlotIndex];
                    if (!hex) return;
                    const swatch = document.createElement('div');
                    swatch.className = 'preset-swatch';
                    swatch.style.backgroundColor = hex;
                    swatches.appendChild(swatch);
                });
            }

            preview.appendChild(swatches);
            item.appendChild(preview);

            const label = document.createElement('div');
            label.className = 'preset-label';
            label.textContent = preset.name;
            item.appendChild(label);

            item.addEventListener('click', () => {
                this.selectedPresetId = preset.id;
                this.render();
            });

            item.addEventListener('dblclick', () => {
                this.selectedPresetId = preset.id;
                this.confirm();
            });

            listEl.appendChild(item);
        });

        // Disable confirm if context missing
        const isApplyMode = this.mode === 'apply';
        const ok = this.selectedPresetId && (!isApplyMode || this.masterId);
        confirmBtn.element.disabled = !ok;

        this.element.appendChild(root);
    }

    confirm() {
        if (!this.selectedPresetId) return;

        if (this.mode === 'create') {
            if (typeof this.onCreate === 'function') {
                this.onCreate(this.selectedPresetId);
            }
            this.close();
            return;
        }

        if (!this.masterId) return;

        // Validate preset exists (avoid dispatching garbage)
        const preset = getPresetById(this.selectedPresetId);
        if (!preset) return;

        store.dispatch('APPLY_MASTER_PRESET_TO_MASTER', {
            masterId: this.masterId,
            presetId: this.selectedPresetId
        });

        this.close();
    }
}
