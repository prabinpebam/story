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

    create() {
        const container = document.createElement('div');
        container.className = 'color-input-container';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.gap = '8px';
        
        if (!this.options.compact) {
            container.style.background = 'var(--color-bg-input)';
            container.style.border = '1px solid var(--color-border)';
            container.style.borderRadius = 'var(--radius-sm)';
            container.style.padding = '4px';
            container.style.height = '28px';
            container.style.width = this.options.width;
        } else {
            // Compact mode (just the swatch, maybe no border or different style)
            container.style.width = 'auto';
            container.style.gap = '0';
        }

        // Hidden Native Input
        const nativeInput = document.createElement('input');
        nativeInput.type = 'color';
        nativeInput.value = this.value;
        nativeInput.style.position = 'absolute';
        nativeInput.style.opacity = '0';
        nativeInput.style.pointerEvents = 'none';
        nativeInput.style.width = '0';
        nativeInput.style.height = '0';

        // Swatch
        const swatch = document.createElement('div');
        swatch.style.width = this.options.compact ? '20px' : '18px';
        swatch.style.height = this.options.compact ? '20px' : '18px';
        swatch.style.borderRadius = '2px';
        swatch.style.backgroundColor = this.value;
        swatch.style.border = '1px solid rgba(0,0,0,0.1)';
        swatch.style.cursor = 'pointer';
        swatch.style.flexShrink = '0';
        
        // Hex Text (Only if not compact and showHex is true)
        let hexInput = null;
        if (!this.options.compact && this.options.showHex) {
            hexInput = document.createElement('input');
            hexInput.type = 'text';
            hexInput.value = this.value.toUpperCase();
            hexInput.style.border = 'none';
            hexInput.style.background = 'transparent';
            hexInput.style.color = 'var(--color-text-primary)';
            hexInput.style.fontSize = '11px';
            hexInput.style.fontFamily = 'var(--font-mono)';
            hexInput.style.width = '100%';
            hexInput.style.outline = 'none';
            
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
            if (hexInput) hexInput.value = val.toUpperCase();
            this.onChange(val, true);
        };

        nativeInput.onchange = (e) => {
            const val = e.target.value;
            this.onChange(val, false);
        };

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
        }
        if (this._hexInput) {
            this._hexInput.value = this.value.toUpperCase();
        }
        if (this._nativeInput) {
            this._nativeInput.value = this.value;
        }
    }
}
