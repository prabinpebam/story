/**
 * ThemeSwatches.js
 * A reusable component that displays color swatches from the current luma-locked theme.
 * Automatically updates when theme colors change.
 * 
 * Uses the 12-slot luma-locked tonal system:
 * - Shadows (slots 1-4): L = 5%, 10%, 18%, 25%
 * - Midtones (slots 5-8): L = 35%, 45%, 55%, 65%
 * - Highlights (slots 9-12): L = 70%, 80%, 90%, 97%
 * 
 * Supports two modes:
 * - Regular mode: onColorSelect receives the color hex value
 * - Linked mode: onLinkedColorSelect receives the slot index for linked properties
 * 
 * Follows Design System principles:
 * - Uses .swatch CSS class for all swatches (unified styling)
 * - Uses .swatch-grid for grid layout with column variants
 * - Uses design tokens for all spacing and sizing
 */

import { store } from '../../core/Store.js';

/**
 * Luma slot definitions (12 slots in 3 clusters)
 */
const LUMA_SLOTS = [
    { slot: 1, luma: 5, cluster: 'shadows' },
    { slot: 2, luma: 10, cluster: 'shadows' },
    { slot: 3, luma: 18, cluster: 'shadows' },
    { slot: 4, luma: 25, cluster: 'shadows' },
    { slot: 5, luma: 35, cluster: 'midtones' },
    { slot: 6, luma: 45, cluster: 'midtones' },
    { slot: 7, luma: 55, cluster: 'midtones' },
    { slot: 8, luma: 65, cluster: 'midtones' },
    { slot: 9, luma: 70, cluster: 'highlights' },
    { slot: 10, luma: 80, cluster: 'highlights' },
    { slot: 11, luma: 90, cluster: 'highlights' },
    { slot: 12, luma: 97, cluster: 'highlights' }
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

/**
 * Determines if a color is dark (needs white border) or light (needs dark border)
 * Uses relative luminance calculation per WCAG guidelines
 * @param {string} color - CSS color value (hex, rgb, etc.)
 * @returns {boolean} true if color is dark
 */
function isColorDark(color) {
    try {
        // Parse the color to RGB
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (!ctx) return false; // Fallback for test environment
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        
        // Calculate relative luminance (WCAG formula)
        const toLinear = (c) => {
            const sRGB = c / 255;
            return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
        };
        const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
        
        // Consider dark if luminance < 0.5
        return luminance < 0.5;
    } catch (e) {
        // Fallback for environments without canvas support
        return false;
    }
}

export class ThemeSwatches {
    constructor(options = {}) {
        this.options = {
            onColorSelect: options.onColorSelect || (() => {}),
            // Callback for linked color selection (receives slot index)
            onLinkedColorSelect: options.onLinkedColorSelect || null,
            // Enable linked mode (shows link indicators)
            linkedMode: options.linkedMode !== false && !!options.onLinkedColorSelect,
            // Show theme name indicator (per spec: "Indicate theme name also")
            showThemeName: options.showThemeName !== false,
            columns: options.columns || 6,
            // Currently selected slot (for highlighting)
            selectedSlot: options.selectedSlot || null,
            ...options
        };
        
        // Validate columns against allowed values
        if (!GRID_COLUMNS[this.options.columns]) {
            console.warn(`ThemeSwatches: Invalid column count ${this.options.columns}, defaulting to 6`);
            this.options.columns = 6;
        }
        
        this.element = document.createElement('div');
        this.element.className = 'swatch-section';
        
        this.render();
        
        // Listen for state changes to update swatches
        this._stateChangeHandler = () => this.updateSwatches();
        store.on('state-changed', this._stateChangeHandler);
    }

    /**
     * Set the currently selected slot (for highlighting)
     */
    setSelectedSlot(slotIndex) {
        this.options.selectedSlot = slotIndex;
        this.updateSwatches();
    }

    render() {
        this.element.innerHTML = '';
        
        // Header with theme name (per spec: indicate theme name)
        const header = document.createElement('div');
        header.className = 'swatch-section-header';
        
        this.themeLabel = document.createElement('div');
        this.themeLabel.className = 'swatch-section-label';
        this.themeLabel.textContent = 'Theme Colors';
        header.appendChild(this.themeLabel);
        
        this.element.appendChild(header);
        
        // Swatches grid using unified swatch-grid class
        this.swatchGrid = document.createElement('div');
        this.swatchGrid.className = `swatch-grid ${GRID_COLUMNS[this.options.columns]}`;
        this.element.appendChild(this.swatchGrid);
        
        this.updateSwatches();
    }

    /**
     * Get the current luma theme from store
     */
    getLumaTheme() {
        const state = store.getState();
        const themeMaster = state.masters?.['theme-default'];
        return themeMaster?.themeSettings?.lumaTheme || null;
    }

    /**
     * Get resolved colors from the current theme
     * Returns an array of 12 hex colors
     */
    getColors() {
        const lumaTheme = this.getLumaTheme();
        
        if (lumaTheme?.resolvedColors && Array.isArray(lumaTheme.resolvedColors)) {
            return lumaTheme.resolvedColors;
        }
        
        // Fallback: generate grayscale from luma values if no theme
        return LUMA_SLOTS.map(slot => {
            const l = slot.luma;
            const hex = Math.round(l * 2.55).toString(16).padStart(2, '0');
            return `#${hex}${hex}${hex}`;
        });
    }

    updateSwatches() {
        if (!this.swatchGrid) return;
        
        this.swatchGrid.innerHTML = '';
        const colors = this.getColors();
        const lumaTheme = this.getLumaTheme();
        
        // Update theme name label
        if (this.options.showThemeName && this.themeLabel) {
            const themeName = lumaTheme?.name || 'Default';
            this.themeLabel.textContent = themeName;
        }
        
        // Create swatches for all 12 luma slots
        LUMA_SLOTS.forEach((slotDef, index) => {
            const color = colors[index] || '#808080';
            const tooltip = `Slot ${slotDef.slot} (L: ${slotDef.luma}%)`;
            const swatch = this.createSwatch(color, tooltip, index);
            this.swatchGrid.appendChild(swatch);
        });
    }

    createSwatch(color, tooltip, slotIndex) {
        // Use <button> for proper semantics and keyboard accessibility
        const swatch = document.createElement('button');
        swatch.type = 'button';
        
        // Use unified .swatch class with size variant
        // Add --dark modifier for dark colors (so they get white border)
        const isDark = isColorDark(color);
        swatch.className = `swatch swatch--xl${isDark ? ' swatch--dark' : ''}`;
        
        // Add selected state if this slot matches current selection
        if (this.options.selectedSlot === slotIndex) {
            swatch.classList.add('swatch--selected');
        }
        
        // Color itself must be inline (dynamic per swatch)
        swatch.style.backgroundColor = color;
        
        // Accessibility
        swatch.title = `${tooltip}: ${color}`;
        swatch.setAttribute('aria-label', `Select ${tooltip} color: ${color}`);
        swatch.dataset.slotIndex = slotIndex;
        
        // Click handler
        swatch.addEventListener('click', () => {
            // If linked mode is enabled and callback exists, use that
            if (this.options.linkedMode && this.options.onLinkedColorSelect) {
                this.options.onLinkedColorSelect({ slotIndex, color });
            } else {
                // Regular color selection
                this.options.onColorSelect(color);
            }
        });
        
        return swatch;
    }

    destroy() {
        store.off('state-changed', this._stateChangeHandler);
        this.element.remove();
    }
}
