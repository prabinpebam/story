import { NumberInput } from '../NumberInput.js';
import { Icons } from '../../Icons.js';

export class SolidTab {
    constructor(options = {}) {
        this.fill = options.fill;
        this.onChange = options.onChange;
        
        this.element = document.createElement('div');
        this.element.style.display = 'flex';
        this.element.style.flexDirection = 'column';
        this.element.style.gap = '12px';
        
        this.render();
    }

    render() {
        // 1. Main Color Area (HSB) - Placeholder
        const colorArea = document.createElement('div');
        colorArea.style.width = '100%';
        colorArea.style.height = '160px';
        colorArea.style.backgroundColor = this.fill.color || '#000000';
        colorArea.style.borderRadius = '4px';
        colorArea.style.position = 'relative';
        colorArea.style.border = '1px solid #444';
        
        // Simple color picker input for now (native)
        const nativePicker = document.createElement('input');
        nativePicker.type = 'color';
        nativePicker.value = this.rgbToHex(this.fill.color || '#000000');
        nativePicker.style.opacity = '0';
        nativePicker.style.position = 'absolute';
        nativePicker.style.width = '100%';
        nativePicker.style.height = '100%';
        nativePicker.style.cursor = 'pointer';
        nativePicker.addEventListener('input', (e) => {
            this.onChange({ color: e.target.value, value: e.target.value });
        });
        
        colorArea.appendChild(nativePicker);
        this.element.appendChild(colorArea);

        // 2. Sliders (Hue / Alpha) - Placeholder
        const sliders = document.createElement('div');
        sliders.style.display = 'flex';
        sliders.style.flexDirection = 'column';
        sliders.style.gap = '8px';

        // Hue
        const hueSlider = document.createElement('div');
        hueSlider.style.height = '10px';
        hueSlider.style.borderRadius = '5px';
        hueSlider.style.background = 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)';
        sliders.appendChild(hueSlider);

        // Alpha
        const alphaSlider = document.createElement('div');
        alphaSlider.style.height = '10px';
        alphaSlider.style.borderRadius = '5px';
        alphaSlider.style.background = 'linear-gradient(to right, transparent, #fff)'; // Needs checkerboard
        sliders.appendChild(alphaSlider);

        this.element.appendChild(sliders);

        // 3. Inputs
        const inputRow = document.createElement('div');
        inputRow.style.display = 'flex';
        inputRow.style.gap = '8px';
        inputRow.style.alignItems = 'center';

        // Hex Input
        const hexInput = document.createElement('input');
        hexInput.value = this.rgbToHex(this.fill.color || '#000000').toUpperCase();
        hexInput.style.flex = '1';
        hexInput.style.backgroundColor = '#383838';
        hexInput.style.border = '1px solid transparent';
        hexInput.style.borderRadius = '4px';
        hexInput.style.color = '#FFF';
        hexInput.style.padding = '4px 8px';
        hexInput.style.fontFamily = 'monospace';
        hexInput.style.fontSize = '12px';
        hexInput.addEventListener('change', (e) => {
            this.onChange({ color: e.target.value, value: e.target.value });
        });
        
        // Opacity Input
        const opacityInput = new NumberInput({
            value: this.fill.opacity !== undefined ? this.fill.opacity : 100,
            min: 0,
            max: 100,
            units: '%',
            scrubbable: true,
            onChange: (val) => {
                this.onChange({ opacity: val });
            }
        });
        opacityInput.element.style.width = '60px';

        inputRow.appendChild(hexInput);
        inputRow.appendChild(opacityInput.element);
        
        this.element.appendChild(inputRow);
    }

    rgbToHex(colorString) {
        if (!colorString) return '#000000';
        if (colorString.startsWith('#')) return colorString;
        
        let r = 0, g = 0, b = 0;
        if (colorString.startsWith('rgb')) {
            const match = colorString.match(/\d+/g);
            if (match) {
                r = parseInt(match[0]);
                g = parseInt(match[1]);
                b = parseInt(match[2]);
            }
        }
        
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
}
