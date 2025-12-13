import { DraggablePanel } from '../components/DraggablePanel.js';
import { Button } from '../components/Button.js';
import { store } from '../../core/Store.js';
import { getPresetList } from '../../core/store/SlideMasterPresets.js';
import { getPresetById as getThemePresetById } from './color-theme/ThemePresets.js';
import { generateThemeColors, DEFAULT_ADJUSTMENTS, getEffectiveSlotIndex, COLOR_MODES } from './color-theme/ColorThemeUtils.js';

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

export class MasterPresetPicker extends DraggablePanel {
    constructor(options = {}) {
        super({
            id: 'master-preset-picker',
            title: 'Master Presets',
            defaultWidth: 520,
            defaultHeight: 520,
            minWidth: 420,
            minHeight: 360,
            maxWidth: 720,
            maxHeight: 900,
            resizable: true,
            closable: true,
            minimizable: true,
            ...options
        });

        this.element.setAttribute('data-testid', 'master-preset-picker-panel');

        this.masterId = null;
        this.selectedPresetId = null;

        this.listEl = null;
        this.applyBtn = null;

        this.buildUI();
    }

    setMasterId(masterId) {
        this.masterId = masterId;

        const state = store.getState();
        const master = masterId ? state.slideMasterPresets?.[masterId] : null;
        const fallbackPresetId = getPresetList()?.[0]?.id;
        this.selectedPresetId = master?.presetId || fallbackPresetId;

        this.renderList();
    }

    buildUI() {
        const root = document.createElement('div');
        root.className = 'preset-flyout-content';

        this.listEl = document.createElement('div');
        this.listEl.className = 'preset-flyout-grid';
        root.appendChild(this.listEl);

        const footer = document.createElement('div');
        footer.className = 'pi-row pi-row--space-between';

        const cancelBtn = new Button({
            label: 'Cancel',
            variant: 'secondary',
            size: 'sm',
            onClick: () => this.close()
        });
        cancelBtn.element.setAttribute('data-testid', 'master-preset-cancel');

        this.applyBtn = new Button({
            label: 'Apply',
            variant: 'primary',
            size: 'sm',
            onClick: () => this.apply()
        });
        this.applyBtn.element.setAttribute('data-testid', 'master-preset-apply');

        footer.appendChild(cancelBtn.element);
        footer.appendChild(this.applyBtn.element);

        root.appendChild(footer);

        this.contentElement.appendChild(root);

        // Initialize selection if possible
        const state = store.getState();
        this.setMasterId(state.editor?.activeMasterId || null);
    }

    renderList() {
        if (!this.listEl) return;

        this.listEl.innerHTML = '';

        const presets = getPresetList() || [];
        presets.forEach(preset => {
            const item = document.createElement('div');
            item.className = 'preset-thumbnail' + (preset.id === this.selectedPresetId ? ' selected' : '');
            item.dataset.presetId = preset.id;
            item.title = preset.name;
            item.setAttribute('data-testid', 'master-preset-item');
            item.setAttribute('data-preset-id', preset.id);

            // Preview block (reuse existing flyout styles)
            const preview = document.createElement('div');
            preview.className = 'preset-preview';

            const hexColors = resolveThemeHexColors(preset.colorThemeId);
            const state = store.getState();
            const themeMaster = Object.values(state.slideMasterPresets || {}).find(m => m.type === 'slideMasterPreset');
            const colorMode = themeMaster?.colorModeId || COLOR_MODES.LIGHT;

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
                this.renderList();
            });

            this.listEl.appendChild(item);
        });

        if (this.applyBtn?.element) {
            this.applyBtn.element.disabled = !this.masterId || !this.selectedPresetId;
        }
    }

    apply() {
        if (!this.masterId || !this.selectedPresetId) return;

        store.dispatch('APPLY_MASTER_PRESET_TO_MASTER', {
            masterId: this.masterId,
            presetId: this.selectedPresetId
        });

        this.close();
    }
}
