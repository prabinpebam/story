/**
 * ThemeSwatches.js
 * A reusable component that displays color swatches from the current theme.
 * Automatically updates when theme colors change.
 */

import { store } from '../../core/Store.js';
import { COLOR_PRESETS, getPresetById } from '../../core/constants/ColorPresets.js';
import { Dropdown } from './Dropdown.js';

/**
 * Theme color role definitions with display names
 */
const THEME_COLOR_ROLES = [
    { id: 'background1', name: 'Bg 1' },
    { id: 'background2', name: 'Bg 2' },
    { id: 'text1', name: 'Text 1' },
    { id: 'text2', name: 'Text 2' },
    { id: 'accent1', name: 'Accent 1' },
    { id: 'accent2', name: 'Accent 2' },
    { id: 'accent3', name: 'Accent 3' },
    { id: 'accent4', name: 'Accent 4' },
    { id: 'accent5', name: 'Accent 5' },
    { id: 'accent6', name: 'Accent 6' },
    { id: 'hyperlink', name: 'Link' },
    { id: 'followedHyperlink', name: 'Visited' }
];

export class ThemeSwatches {
    constructor(options = {}) {
        this.options = {
            onColorSelect: options.onColorSelect || (() => {}),
            showPresetSelector: options.showPresetSelector !== false,
            columns: options.columns || 6,
            ...options
        };
        
        this.currentPresetId = null; // null = current theme, otherwise preset ID
        this.element = document.createElement('div');
        this.element.className = 'theme-swatches';
        
        this.render();
        
        // Listen for state changes to update swatches
        this._stateChangeHandler = () => this.updateSwatches();
        store.on('state-changed', this._stateChangeHandler);
    }

    render() {
        this.element.innerHTML = '';
        // CSS class handles: display: flex; flex-direction: column; gap: 8px;
        
        // Header with label and optional preset selector
        const header = document.createElement('div');
        header.className = 'theme-swatches-header';
        
        const label = document.createElement('div');
        label.textContent = 'Theme Colors';
        label.className = 'theme-swatches-label';
        header.appendChild(label);
        
        if (this.options.showPresetSelector) {
            const selector = this.createPresetSelector();
            header.appendChild(selector);
        }
        
        this.element.appendChild(header);
        
        // Swatches grid
        this.swatchGrid = document.createElement('div');
        this.swatchGrid.className = `theme-swatches-grid theme-swatches-grid-${this.options.columns}`;
        this.element.appendChild(this.swatchGrid);
        
        this.updateSwatches();
    }

    createPresetSelector() {
        // Build options array for Dropdown
        const options = [
            { label: 'Current', value: '' },
            ...COLOR_PRESETS.map(preset => ({
                label: preset.name,
                value: preset.id
            }))
        ];
        
        this.presetDropdown = new Dropdown({
            options: options,
            value: this.currentPresetId || '',
            size: 'fill',
            height: 'sm',
            onChange: (value) => {
                this.currentPresetId = value || null;
                this.updateSwatches();
            }
        });
        
        return this.presetDropdown.element;
    }

    getColors() {
        if (this.currentPresetId) {
            // Use preset colors
            const preset = getPresetById(this.currentPresetId);
            return preset?.colors || {};
        }
        
        // Use current theme colors
        const state = store.getState();
        const masterId = state.editor?.activeMasterId;
        if (masterId) {
            const master = state.masters?.[masterId];
            return master?.themeSettings?.colors || {};
        }
        return {};
    }

    updateSwatches() {
        if (!this.swatchGrid) return;
        
        this.swatchGrid.innerHTML = '';
        const colors = this.getColors();
        
        THEME_COLOR_ROLES.forEach(role => {
            const color = colors[role.id];
            if (!color) return;
            
            const swatch = this.createSwatch(color, role.name);
            this.swatchGrid.appendChild(swatch);
        });
    }

    createSwatch(color, tooltip) {
        const swatch = document.createElement('button');
        swatch.className = 'theme-swatch';
        swatch.style.backgroundColor = color; // Color itself must be inline
        swatch.title = `${tooltip}: ${color}`;
        
        // Click handler
        swatch.addEventListener('click', () => {
            this.options.onColorSelect(color);
        });
        
        return swatch;
    }

    destroy() {
        store.off('state-changed', this._stateChangeHandler);
        this.element.remove();
    }
}
