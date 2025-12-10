import { store } from '../../core/Store.js';

export class ColorInput {
    constructor(value, onChange, options = {}) {
        this.value = value || '#000000';
        this.onChange = onChange;
        this.options = {
            width: '100%',
            showHex: true,
            compact: false,
            ...options
        };
        this.element = this.create();
    }

    /**
     * Determines if a color is dark (needs white border) or light (needs dark border)
     */
    isColorDark(color) {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            const ctx = canvas.getContext('2d');
            if (!ctx) return false; // Fallback for test environment
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, 1, 1);
            const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
            
            const toLinear = (c) => {
                const sRGB = c / 255;
                return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
            };
            const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
            
            return luminance < 0.5;
        } catch (e) {
            // Fallback for environments without canvas support
            return false;
        }
    }

    /**
     * Updates the swatch border based on color darkness
     */
    updateSwatchBorder(swatch, color) {
        const isDark = this.isColorDark(color);
        swatch.classList.toggle('dark-color', isDark);
        swatch.classList.toggle('light-color', !isDark);
        swatch._isDark = isDark;
    }

    create() {
        const container = document.createElement('div');
        container.className = 'color-input-container';
        
        if (this.options.compact) {
            container.classList.add('compact');
        }
        if (this.options.width && this.options.width !== '100%') {
            container.style.width = this.options.width;
        }

        // Hidden Native Input
        const nativeInput = document.createElement('input');
        nativeInput.type = 'color';
        nativeInput.value = this.value;
        nativeInput.className = 'color-input-native';

        // Swatch
        const swatch = document.createElement('div');
        swatch.className = 'color-input-swatch';
        if (this.options.compact) {
            swatch.classList.add('swatch-lg');
        }
        swatch.style.backgroundColor = this.value;
        
        // Set initial border based on color darkness
        this.updateSwatchBorder(swatch, this.value);
        
        // Hex Text (Only if not compact and showHex is true)
        let hexInput = null;
        if (!this.options.compact && this.options.showHex) {
            hexInput = document.createElement('input');
            hexInput.type = 'text';
            hexInput.value = this.value.toUpperCase();
            hexInput.className = 'color-input-hex';
            
            let initialHexValue = this.value;

            hexInput.onfocus = () => {
                initialHexValue = this.value;
            };

            hexInput.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    hexInput.blur();
                    e.stopPropagation();
                } else if (e.key === 'Escape') {
                    // Revert
                    swatch.style.backgroundColor = initialHexValue;
                    nativeInput.value = initialHexValue;
                    hexInput.value = initialHexValue.toUpperCase();
                    this.onChange(initialHexValue); // Commit revert
                    hexInput.blur();
                    e.stopPropagation();
                }
                // Stop propagation for other keys to prevent global shortcuts while typing
                e.stopPropagation();
            };
            
            hexInput.onchange = (e) => {
                let val = e.target.value;
                if (!val.startsWith('#')) val = '#' + val;
                // Validate Hex
                if (/^#[0-9A-F]{6}$/i.test(val)) {
                    swatch.style.backgroundColor = val;
                    nativeInput.value = val;
                    this.onChange(val);
                } else {
                    hexInput.value = nativeInput.value.toUpperCase();
                }
            };
        }

        // Events
        swatch.onclick = () => nativeInput.click();
        
        nativeInput.oninput = (e) => {
            const val = e.target.value;
            swatch.style.backgroundColor = val;
            this.updateSwatchBorder(swatch, val);
            if (hexInput) hexInput.value = val.toUpperCase();
            this.onChange(val, true);
        };

        nativeInput.onchange = (e) => {
            const val = e.target.value;
            this.onChange(val, false);
            store.dispatch('UI_INTERACTION_END');
        };
        
        // Track when native color picker opens
        nativeInput.addEventListener('click', () => {
            store.dispatch('UI_INTERACTION_START');
        });
        
        // Also track if user cancels the color picker
        nativeInput.addEventListener('blur', () => {
            // Small delay to ensure onchange fires first if user selected a color
            setTimeout(() => {
                const state = store.getState();
                if (state.ui?.isInteracting) {
                    store.dispatch('UI_INTERACTION_END');
                }
            }, 100);
        });

        container.appendChild(swatch);
        if (hexInput) container.appendChild(hexInput);
        container.appendChild(nativeInput);
        
        // Store references for setValue
        this._swatch = swatch;
        this._hexInput = hexInput;
        this._nativeInput = nativeInput;

        return container;
    }
    
    /**
     * Set the color value programmatically
     * @param {string} value - Hex color value
     */
    setValue(value) {
        this.value = value || '#000000';
        if (this._swatch) {
            this._swatch.style.backgroundColor = this.value;
            this.updateSwatchBorder(this._swatch, this.value);
        }
        if (this._hexInput) {
            this._hexInput.value = this.value.toUpperCase();
        }
        if (this._nativeInput) {
            this._nativeInput.value = this.value;
        }
    }
}
