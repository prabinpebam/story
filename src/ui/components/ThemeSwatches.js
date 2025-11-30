/**
 * ThemeSwatches.js
 * A reusable component that displays color swatches from the current theme.
 * Automatically updates when theme colors change.
 * 
 * Follows Design System principles:
 * - Uses .swatch CSS class for all swatches (unified styling)
 * - Uses .swatch-grid for grid layout with column variants
 * - Uses design tokens for all spacing and sizing
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

/**
 * Grid column options following the design system constraint
 * (limited to specific values for consistency)
 */
const GRID_COLUMNS = {
    4: 'swatch-grid--cols-4',
    6: 'swatch-grid--cols-6',
    8: 'swatch-grid--cols-8',
    12: 'swatch-grid--cols-12'
};

export class ThemeSwatches {
    constructor(options = {}) {
        this.options = {
            onColorSelect: options.onColorSelect || (() => {}),
            showPresetSelector: options.showPresetSelector !== false,
            columns: options.columns || 8,
            ...options
        };
        
        // Validate columns against allowed values
        if (!GRID_COLUMNS[this.options.columns]) {
            console.warn(`ThemeSwatches: Invalid column count ${this.options.columns}, defaulting to 8`);
            this.options.columns = 8;
        }
        
        this.currentPresetId = null; // null = current theme, otherwise preset ID
        this.element = document.createElement('div');
        this.element.className = 'swatch-section';
        
        this.render();
        
        // Listen for state changes to update swatches
        this._stateChangeHandler = () => this.updateSwatches();
        store.on('state-changed', this._stateChangeHandler);
    }

    render() {
        this.element.innerHTML = '';
        
        // Header with label and optional preset selector
        const header = document.createElement('div');
        header.className = 'swatch-section-header';
        
        const label = document.createElement('div');
        label.textContent = 'Theme Colors';
        label.className = 'swatch-section-label';
        header.appendChild(label);
        
        if (this.options.showPresetSelector) {
            const selector = this.createPresetSelector();
            header.appendChild(selector);
        }
        
        this.element.appendChild(header);
        
        // Swatches grid using unified swatch-grid class
        this.swatchGrid = document.createElement('div');
        this.swatchGrid.className = `swatch-grid ${GRID_COLUMNS[this.options.columns]}`;
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
        // Use <button> for proper semantics and keyboard accessibility
        const swatch = document.createElement('button');
        swatch.type = 'button';
        
        // Use unified .swatch class with size variant
        swatch.className = 'swatch swatch--xl';
        
        // Color itself must be inline (dynamic per swatch)
        swatch.style.backgroundColor = color;
        
        // Accessibility
        swatch.title = `${tooltip}: ${color}`;
        swatch.setAttribute('aria-label', `Select ${tooltip} color: ${color}`);
        
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
