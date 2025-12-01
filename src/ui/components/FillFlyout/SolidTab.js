import { NumberInput } from '../NumberInput.js';
import { IconButton } from '../IconButton.js';
import { Icons } from '../../Icons.js';
import { ColorUtils } from '../../../utils/ColorUtils.js';
import { ThemeSwatches } from '../ThemeSwatches.js';

export class SolidTab {
    constructor(options = {}) {
        this.fill = options.fill;
        this.onChange = options.onChange;
        
        // Initialize HSB state from fill color
        const rgba = ColorUtils.parseColor(this.fill.color || '#000000');
        const hsb = ColorUtils.rgbToHsb(rgba.r, rgba.g, rgba.b);
        
        this.state = {
            h: hsb.h,
            s: hsb.s,
            b: hsb.b,
            a: this.fill.opacity !== undefined ? this.fill.opacity : (rgba.a * 100)
        };

        this.element = document.createElement('div');
        this.element.style.display = 'flex';
        this.element.style.flexDirection = 'column';
        this.element.style.gap = '12px';
        
        this.render();
    }

    render() {
        this.element.innerHTML = '';

        // 1. Main Color Area (HSB)
        const colorArea = document.createElement('div');
        colorArea.style.width = '100%';
        colorArea.style.height = '160px';
        colorArea.style.borderRadius = '4px';
        colorArea.style.position = 'relative';
        colorArea.style.cursor = 'default';
        colorArea.style.overflow = 'hidden';
        
        // Backgrounds
        this.colorAreaBg = document.createElement('div');
        this.colorAreaBg.style.position = 'absolute';
        this.colorAreaBg.style.top = '0';
        this.colorAreaBg.style.left = '0';
        this.colorAreaBg.style.width = '100%';
        this.colorAreaBg.style.height = '100%';
        this.updateColorAreaBg(); // Set initial hue bg
        
        const whiteGrad = document.createElement('div');
        whiteGrad.style.position = 'absolute';
        whiteGrad.style.top = '0';
        whiteGrad.style.left = '0';
        whiteGrad.style.width = '100%';
        whiteGrad.style.height = '100%';
        whiteGrad.style.background = 'linear-gradient(to right, #fff, transparent)';
        
        const blackGrad = document.createElement('div');
        blackGrad.style.position = 'absolute';
        blackGrad.style.top = '0';
        blackGrad.style.left = '0';
        blackGrad.style.width = '100%';
        blackGrad.style.height = '100%';
        blackGrad.style.background = 'linear-gradient(to top, #000, transparent)';

        colorArea.appendChild(this.colorAreaBg);
        colorArea.appendChild(whiteGrad);
        colorArea.appendChild(blackGrad);

        // Handle
        this.areaHandle = document.createElement('div');
        this.areaHandle.style.width = '12px';
        this.areaHandle.style.height = '12px';
        this.areaHandle.style.borderRadius = '50%';
        this.areaHandle.style.border = '2px solid #fff';
        this.areaHandle.style.boxShadow = '0 0 2px rgba(0,0,0,0.5)';
        this.areaHandle.style.position = 'absolute';
        this.areaHandle.style.transform = 'translate(-50%, -50%)';
        this.areaHandle.style.pointerEvents = 'none';
        this.updateAreaHandlePos();
        
        colorArea.appendChild(this.areaHandle);

        // Interaction
        const handleAreaMove = (e) => {
            const rect = colorArea.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;

            let x = e.clientX - rect.left;
            let y = e.clientY - rect.top;
            
            x = Math.max(0, Math.min(x, rect.width));
            y = Math.max(0, Math.min(y, rect.height));
            
            this.state.s = (x / rect.width) * 100;
            this.state.b = 100 - ((y / rect.height) * 100);
            
            this.updateAreaHandlePos();
            this.emitChange();
        };

        colorArea.addEventListener('mousedown', (e) => {
            e.preventDefault();
            handleAreaMove(e);
            
            const moveHandler = (e) => {
                if (e.buttons === 0) {
                    upHandler();
                    return;
                }
                e.preventDefault();
                handleAreaMove(e);
            };
            
            const upHandler = () => {
                document.removeEventListener('mousemove', moveHandler);
                document.removeEventListener('mouseup', upHandler);
            };
            
            document.addEventListener('mousemove', moveHandler);
            document.addEventListener('mouseup', upHandler);
        });

        this.element.appendChild(colorArea);

        // 2. Sliders Row
        const slidersRow = document.createElement('div');
        slidersRow.style.display = 'flex';
        slidersRow.style.gap = '12px';
        slidersRow.style.alignItems = 'center';

        // Eyedropper
        const eyedropperBtn = new IconButton({
            icon: Icons.EYEDROPPER,
            title: 'Pick Color',
            onClick: () => this.pickColor()
        });
        slidersRow.appendChild(eyedropperBtn.element);

        // Sliders Container
        const sliders = document.createElement('div');
        sliders.style.flex = '1';
        sliders.style.display = 'flex';
        sliders.style.flexDirection = 'column';
        sliders.style.gap = '10px';

        // Hue Slider
        const hueSlider = document.createElement('div');
        hueSlider.style.height = '10px';
        hueSlider.style.borderRadius = '5px';
        hueSlider.style.background = 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)';
        hueSlider.style.position = 'relative';
        hueSlider.style.cursor = 'default';

        this.hueHandle = document.createElement('div');
        this.hueHandle.style.width = '12px';
        this.hueHandle.style.height = '12px';
        this.hueHandle.style.borderRadius = '50%';
        this.hueHandle.style.backgroundColor = '#fff';
        this.hueHandle.style.boxShadow = '0 0 2px rgba(0,0,0,0.5)';
        this.hueHandle.style.position = 'absolute';
        this.hueHandle.style.top = '50%';
        this.hueHandle.style.transform = 'translate(-50%, -50%)';
        this.hueHandle.style.pointerEvents = 'none';
        this.updateHueHandlePos();
        hueSlider.appendChild(this.hueHandle);

        const handleHueMove = (e) => {
            const rect = hueSlider.getBoundingClientRect();
            if (rect.width === 0) return;

            let x = e.clientX - rect.left;
            x = Math.max(0, Math.min(x, rect.width));
            
            this.state.h = (x / rect.width) * 360;
            this.updateHueHandlePos();
            this.updateColorAreaBg();
            this.emitChange();
        };

        hueSlider.addEventListener('mousedown', (e) => {
            e.preventDefault();
            handleHueMove(e);
            
            const moveHandler = (e) => {
                if (e.buttons === 0) {
                    upHandler();
                    return;
                }
                e.preventDefault();
                handleHueMove(e);
            };
            
            const upHandler = () => {
                document.removeEventListener('mousemove', moveHandler);
                document.removeEventListener('mouseup', upHandler);
            };
            
            document.addEventListener('mousemove', moveHandler);
            document.addEventListener('mouseup', upHandler);
        });

        sliders.appendChild(hueSlider);

        // Alpha Slider
        const alphaSlider = document.createElement('div');
        alphaSlider.style.height = '10px';
        alphaSlider.style.borderRadius = '5px';
        // Checkerboard pattern
        alphaSlider.style.backgroundImage = `
            linear-gradient(45deg, #ccc 25%, transparent 25%), 
            linear-gradient(-45deg, #ccc 25%, transparent 25%), 
            linear-gradient(45deg, transparent 75%, #ccc 75%), 
            linear-gradient(-45deg, transparent 75%, #ccc 75%)`;
        alphaSlider.style.backgroundSize = '8px 8px';
        alphaSlider.style.backgroundPosition = '0 0, 0 4px, 4px -4px, -4px 0px';
        alphaSlider.style.backgroundColor = '#fff';
        alphaSlider.style.position = 'relative';
        alphaSlider.style.cursor = 'default';

        this.alphaGradient = document.createElement('div');
        this.alphaGradient.style.position = 'absolute';
        this.alphaGradient.style.top = '0';
        this.alphaGradient.style.left = '0';
        this.alphaGradient.style.width = '100%';
        this.alphaGradient.style.height = '100%';
        this.alphaGradient.style.borderRadius = 'inherit';
        this.updateAlphaGradient();
        alphaSlider.appendChild(this.alphaGradient);

        this.alphaHandle = document.createElement('div');
        this.alphaHandle.style.width = '12px';
        this.alphaHandle.style.height = '12px';
        this.alphaHandle.style.borderRadius = '50%';
        this.alphaHandle.style.backgroundColor = '#fff';
        this.alphaHandle.style.boxShadow = '0 0 2px rgba(0,0,0,0.5)';
        this.alphaHandle.style.position = 'absolute';
        this.alphaHandle.style.top = '50%';
        this.alphaHandle.style.transform = 'translate(-50%, -50%)';
        this.alphaHandle.style.pointerEvents = 'none';
        this.updateAlphaHandlePos();
        alphaSlider.appendChild(this.alphaHandle);

        const handleAlphaMove = (e) => {
            const rect = alphaSlider.getBoundingClientRect();
            if (rect.width === 0) return;

            let x = e.clientX - rect.left;
            x = Math.max(0, Math.min(x, rect.width));
            
            this.state.a = (x / rect.width) * 100;
            this.updateAlphaHandlePos();
            this.emitChange();
        };

        alphaSlider.addEventListener('mousedown', (e) => {
            e.preventDefault();
            handleAlphaMove(e);
            
            const moveHandler = (e) => {
                if (e.buttons === 0) {
                    upHandler();
                    return;
                }
                e.preventDefault();
                handleAlphaMove(e);
            };
            
            const upHandler = () => {
                document.removeEventListener('mousemove', moveHandler);
                document.removeEventListener('mouseup', upHandler);
            };
            
            document.addEventListener('mousemove', moveHandler);
            document.addEventListener('mouseup', upHandler);
        });

        sliders.appendChild(alphaSlider);
        slidersRow.appendChild(sliders);
        this.element.appendChild(slidersRow);

        // 3. Inputs Row
        const inputRow = document.createElement('div');
        inputRow.style.display = 'flex';
        inputRow.style.gap = '8px';
        inputRow.style.alignItems = 'center';

        // Hex Input
        this.hexInput = document.createElement('input');
        this.updateHexInput();
        this.hexInput.style.flex = '1';
        this.hexInput.style.backgroundColor = 'var(--color-bg-input)';
        this.hexInput.style.border = '1px solid transparent';
        this.hexInput.style.borderRadius = 'var(--radius-sm)';
        this.hexInput.style.color = 'var(--color-text-primary)';
        this.hexInput.style.padding = '4px 8px';
        this.hexInput.style.fontFamily = 'var(--font-mono)';
        this.hexInput.style.fontSize = 'var(--font-size-md)';
        this.hexInput.addEventListener('change', (e) => {
            let val = e.target.value;
            if (!val.startsWith('#')) val = '#' + val;
            const rgb = ColorUtils.hexToRgb(val);
            if (rgb) {
                const hsb = ColorUtils.rgbToHsb(rgb.r, rgb.g, rgb.b);
                this.state.h = hsb.h;
                this.state.s = hsb.s;
                this.state.b = hsb.b;
                this.updateUI();
                this.emitChange();
            }
        });
        
        // Opacity Input
        this.opacityInput = new NumberInput({
            value: Math.round(this.state.a),
            min: 0,
            max: 100,
            units: '%',
            scrubbable: true,
            onChange: (val, isTransient) => {
                this.state.a = val;
                this.updateAlphaHandlePos();
                this.emitChange(isTransient);
            }
        });
        this.opacityInput.element.style.width = '60px';

        inputRow.appendChild(this.hexInput);
        inputRow.appendChild(this.opacityInput.element);
        this.element.appendChild(inputRow);

        // 4. Theme Swatches
        this.themeSwatches = new ThemeSwatches({
            onColorSelect: (color) => {
                // Non-linked color selection (direct color application)
                const rgb = ColorUtils.hexToRgb(color);
                if (rgb) {
                    const hsb = ColorUtils.rgbToHsb(rgb.r, rgb.g, rgb.b);
                    this.state.h = hsb.h;
                    this.state.s = hsb.s;
                    this.state.b = hsb.b;
                    this.updateUI();
                    // Emit without themeSlot to unlink if was linked
                    this.onChange({
                        color: color,
                        opacity: Math.round(this.state.a),
                        value: color,
                        themeSlot: null // Clear any linked slot
                    }, false);
                }
            },
            onLinkedColorSelect: (data) => {
                // Linked color selection - includes slot ID for theme binding
                const rgb = ColorUtils.hexToRgb(data.color);
                if (rgb) {
                    const hsb = ColorUtils.rgbToHsb(rgb.r, rgb.g, rgb.b);
                    this.state.h = hsb.h;
                    this.state.s = hsb.s;
                    this.state.b = hsb.b;
                    this.updateUI();
                    // Emit with themeSlot for linked property tracking
                    this.onChange({
                        color: data.color,
                        opacity: Math.round(this.state.a),
                        value: data.color,
                        themeSlot: data.slotId // Link to theme slot
                    }, false);
                }
            },
            showPresetSelector: true,
            columns: 8
        });
        this.element.appendChild(this.themeSwatches.element);

        // 5. Default Swatch Palette
        const defaultSwatchSection = document.createElement('div');
        defaultSwatchSection.className = 'swatch-section';
        
        const swatchesLabel = document.createElement('div');
        swatchesLabel.textContent = 'Default Colors';
        swatchesLabel.className = 'swatch-section-label';
        defaultSwatchSection.appendChild(swatchesLabel);

        const swatches = document.createElement('div');
        swatches.className = 'swatch-grid swatch-grid--cols-8';
        
        const defaultColors = [
            '#FFFFFF', '#F2F2F2', '#CCCCCC', '#808080', '#4D4D4D', '#333333', '#1A1A1A', '#000000',
            '#F24822', '#FFA629', '#FFCD29', '#14AE5C', '#0D99FF', '#9747FF', '#FF24BD', '#000000'
        ];

        defaultColors.forEach(color => {
            // Use <button> for proper semantics and keyboard accessibility
            const swatch = document.createElement('button');
            swatch.type = 'button';
            swatch.className = 'swatch swatch--xl';
            swatch.style.backgroundColor = color;
            swatch.setAttribute('aria-label', `Select color ${color}`);
            swatch.title = color;
            
            swatch.onclick = () => {
                const rgb = ColorUtils.hexToRgb(color);
                const hsb = ColorUtils.rgbToHsb(rgb.r, rgb.g, rgb.b);
                this.state.h = hsb.h;
                this.state.s = hsb.s;
                this.state.b = hsb.b;
                this.updateUI();
                this.emitChange();
            };
            
            swatches.appendChild(swatch);
        });

        defaultSwatchSection.appendChild(swatches);
        this.element.appendChild(defaultSwatchSection);
    }

    updateUI() {
        this.updateColorAreaBg();
        this.updateAreaHandlePos();
        this.updateHueHandlePos();
        this.updateAlphaGradient();
        this.updateAlphaHandlePos();
        this.updateHexInput();
        this.opacityInput.setValue(Math.round(this.state.a));
    }

    updateColorAreaBg() {
        const rgb = ColorUtils.hsbToRgb(this.state.h, 100, 100);
        this.colorAreaBg.style.backgroundColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    }

    updateAreaHandlePos() {
        this.areaHandle.style.left = `${this.state.s}%`;
        this.areaHandle.style.top = `${100 - this.state.b}%`;
    }

    updateHueHandlePos() {
        this.hueHandle.style.left = `${(this.state.h / 360) * 100}%`;
    }

    updateAlphaGradient() {
        const rgb = ColorUtils.hsbToRgb(this.state.h, this.state.s, this.state.b);
        this.alphaGradient.style.background = `linear-gradient(to right, transparent, rgb(${rgb.r}, ${rgb.g}, ${rgb.b}))`;
    }

    updateAlphaHandlePos() {
        this.alphaHandle.style.left = `${this.state.a}%`;
    }

    updateHexInput() {
        const rgb = ColorUtils.hsbToRgb(this.state.h, this.state.s, this.state.b);
        this.hexInput.value = ColorUtils.rgbToHex(rgb.r, rgb.g, rgb.b).toUpperCase();
    }

    emitChange(isTransient = false) {
        const rgb = ColorUtils.hsbToRgb(this.state.h, this.state.s, this.state.b);
        const hex = ColorUtils.rgbToHex(rgb.r, rgb.g, rgb.b);
        
        this.onChange({
            color: hex,
            opacity: Math.round(this.state.a),
            value: hex // For legacy support
        }, isTransient);
    }

    async pickColor() {
        if (!window.EyeDropper) {
            alert('Eyedropper not supported in this browser');
            return;
        }

        const eyeDropper = new EyeDropper();
        try {
            const result = await eyeDropper.open();
            const rgb = ColorUtils.hexToRgb(result.sRGBHex);
            if (rgb) {
                const hsb = ColorUtils.rgbToHsb(rgb.r, rgb.g, rgb.b);
                this.state.h = hsb.h;
                this.state.s = hsb.s;
                this.state.b = hsb.b;
                this.updateUI();
                this.emitChange();
            }
        } catch (e) {
            // User canceled
        }
    }
}
