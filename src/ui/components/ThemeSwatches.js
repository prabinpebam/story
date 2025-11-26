/**
 * ThemeSwatches.js
 * A reusable component that displays color swatches from the current theme.
 * Automatically updates when theme colors change.
 */

import { store } from '../../core/Store.js';
import { COLOR_PRESETS, getPresetById } from '../../core/constants/ColorPresets.js';

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
        this.element.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 8px;
        `;
        
        // Header with label and optional preset selector
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        
        const label = document.createElement('div');
        label.textContent = 'Theme Colors';
        label.style.cssText = `
            font-size: 10px;
            font-weight: 500;
            color: var(--color-text-secondary, #888);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        `;
        header.appendChild(label);
        
        if (this.options.showPresetSelector) {
            const selector = this.createPresetSelector();
            header.appendChild(selector);
        }
        
        this.element.appendChild(header);
        
        // Swatches grid
        this.swatchGrid = document.createElement('div');
        this.swatchGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(${this.options.columns}, 1fr);
            gap: 4px;
        `;
        this.element.appendChild(this.swatchGrid);
        
        this.updateSwatches();
    }

    createPresetSelector() {
        const container = document.createElement('div');
        container.style.cssText = `
            position: relative;
        `;
        
        const select = document.createElement('select');
        select.style.cssText = `
            background: var(--color-bg-tertiary, #383838);
            border: none;
            border-radius: 4px;
            color: var(--color-text-primary, #fff);
            font-size: 10px;
            padding: 2px 4px;
            cursor: pointer;
            outline: none;
        `;
        
        // Current theme option
        const currentOption = document.createElement('option');
        currentOption.value = '';
        currentOption.textContent = 'Current';
        select.appendChild(currentOption);
        
        // Add preset options
        COLOR_PRESETS.forEach(preset => {
            const option = document.createElement('option');
            option.value = preset.id;
            option.textContent = preset.name;
            select.appendChild(option);
        });
        
        select.value = this.currentPresetId || '';
        
        select.addEventListener('change', (e) => {
            this.currentPresetId = e.target.value || null;
            this.updateSwatches();
        });
        
        container.appendChild(select);
        return container;
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
        const swatch = document.createElement('div');
        swatch.style.cssText = `
            width: 100%;
            padding-bottom: 100%;
            background-color: ${color};
            border-radius: 4px;
            cursor: pointer;
            border: 1px solid rgba(255,255,255,0.1);
            position: relative;
            transition: transform 0.1s ease, box-shadow 0.1s ease;
        `;
        swatch.title = `${tooltip}: ${color}`;
        
        // Hover effect
        swatch.addEventListener('mouseenter', () => {
            swatch.style.transform = 'scale(1.1)';
            swatch.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
            swatch.style.zIndex = '1';
        });
        
        swatch.addEventListener('mouseleave', () => {
            swatch.style.transform = 'scale(1)';
            swatch.style.boxShadow = 'none';
            swatch.style.zIndex = '0';
        });
        
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
