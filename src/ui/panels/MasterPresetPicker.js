import { DraggablePanel } from '../components/DraggablePanel.js';
import { Button } from '../components/Button.js';
import { store } from '../../core/Store.js';
import { getPresetList } from '../../core/store/SlideMasterPresets.js';
import { THEME_PRESETS } from './color-theme/ThemePresets.js';

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

            const bgFill = Array.isArray(preset.background)
                ? preset.background[0]
                : preset.background;
            if (bgFill) {
                if (bgFill.themeSlot) {
                    const themePreset = THEME_PRESETS.find(p => p.id === preset.colorThemeId);
                    const slot = themePreset?.slots?.[bgFill.themeSlot - 1];
                    if (slot?.hex) preview.style.backgroundColor = slot.hex;
                } else if (bgFill.value) {
                    preview.style.backgroundColor = bgFill.value;
                }
            }

            const swatches = document.createElement('div');
            swatches.className = 'preset-swatches';

            const themePreset = THEME_PRESETS.find(p => p.id === preset.colorThemeId);
            if (themePreset?.slots) {
                [1, 2, 3, 4].forEach(slotIndex => {
                    const slot = themePreset.slots[slotIndex - 1];
                    if (!slot?.hex) return;
                    const swatch = document.createElement('div');
                    swatch.className = 'preset-swatch';
                    swatch.style.backgroundColor = slot.hex;
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
