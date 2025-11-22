import { IconButton } from '../IconButton.js';
import { Icons } from '../../Icons.js';
import { NumberInput } from '../NumberInput.js';
import { ColorUtils } from '../../../utils/ColorUtils.js';

export class GradientTab {
    constructor(options = {}) {
        this.fill = options.fill || {};
        this.onChange = options.onChange || (() => {});
        
        // Parse gradient or set default
        this.state = this.parseGradient(this.fill.value);
        this.selectedStopIndex = 0;

        // HSB State for the selected stop
        this.updateColorState();

        this.element = document.createElement('div');
        this.element.style.display = 'flex';
        this.element.style.flexDirection = 'column';
        this.element.style.gap = '12px';
        
        this.render();
    }

    parseGradient(value) {
        // Default
        const defaultGradient = {
            type: 'linear',
            angle: 90,
            stops: [
                { color: '#000000', position: 0 },
                { color: '#FFFFFF', position: 100 }
            ]
        };

        if (!value || typeof value !== 'string') return defaultGradient;

        try {
            let type = 'linear';
            let angle = 90;
            let stopsString = '';

            if (value.startsWith('radial-gradient')) {
                type = 'radial';
                stopsString = value.substring(16, value.length - 1);
            } else if (value.startsWith('linear-gradient')) {
                type = 'linear';
                const content = value.substring(16, value.length - 1);
                const angleMatch = content.match(/^([\d.]+)deg,\s*/);
                if (angleMatch) {
                    angle = parseFloat(angleMatch[1]);
                    stopsString = content.substring(angleMatch[0].length);
                } else {
                    stopsString = content;
                }
            } else {
                return defaultGradient;
            }

            // Parse stops (handling rgba commas)
            // Split by comma, but ignore commas inside parentheses
            const stops = [];
            let current = '';
            let depth = 0;
            
            for (let i = 0; i < stopsString.length; i++) {
                const char = stopsString[i];
                if (char === '(') depth++;
                else if (char === ')') depth--;
                
                if (char === ',' && depth === 0) {
                    stops.push(this.parseStop(current.trim()));
                    current = '';
                } else {
                    current += char;
                }
            }
            if (current.trim()) stops.push(this.parseStop(current.trim()));

            return { type, angle, stops };
        } catch (e) {
            console.error('Error parsing gradient:', e);
            return defaultGradient;
        }
    }

    parseStop(stopStr) {
        // Format: "color position%" or just "color"
        const match = stopStr.match(/^(.*?)\s+([\d.]+)%$/);
        if (match) {
            return { color: match[1], position: parseFloat(match[2]) };
        }
        return { color: stopStr, position: 0 }; // Fallback
    }

    updateColorState() {
        const stop = this.state.stops[this.selectedStopIndex];
        if (!stop) return;

        const rgba = ColorUtils.parseColor(stop.color);
        const hsb = ColorUtils.rgbToHsb(rgba.r, rgba.g, rgba.b);
        
        this.colorState = {
            h: hsb.h,
            s: hsb.s,
            b: hsb.b,
            a: rgba.a * 100
        };
    }

    render() {
        this.element.innerHTML = '';
        
        // 1. Top Bar: Type & Angle
        const topBar = document.createElement('div');
        topBar.style.display = 'flex';
        topBar.style.gap = '8px';
        topBar.style.alignItems = 'center';

        // Type Select
        const typeSelect = document.createElement('select');
        typeSelect.style.flex = '1';
        typeSelect.style.backgroundColor = '#383838';
        typeSelect.style.color = '#FFF';
        typeSelect.style.border = 'none';
        typeSelect.style.borderRadius = '4px';
        typeSelect.style.padding = '4px';
        typeSelect.style.fontSize = '11px';
        typeSelect.style.height = '24px';
        
        ['linear', 'radial'].forEach(t => {
            const opt = document.createElement('option');
            opt.value = t;
            opt.textContent = t.charAt(0).toUpperCase() + t.slice(1);
            if (t === this.state.type) opt.selected = true;
            typeSelect.appendChild(opt);
        });

        typeSelect.onchange = (e) => {
            this.state.type = e.target.value;
            this.emitChange();
            this.render(); // Re-render to show/hide angle
        };
        topBar.appendChild(typeSelect);

        // Angle Input (only for linear)
        if (this.state.type === 'linear') {
            const angleInput = new NumberInput({
                value: this.state.angle,
                min: 0,
                max: 360,
                step: 1,
                units: '°',
                onChange: (val) => {
                    this.state.angle = val;
                    this.emitChange();
                }
            });
            angleInput.element.style.width = '60px';
            topBar.appendChild(angleInput.element);
        }

        // Reverse Button
        const reverseBtn = new IconButton({
            icon: Icons.REVERSE || '<i class="fa-solid fa-arrow-right-arrow-left"></i>', // Fallback icon
            title: 'Reverse Gradient',
            onClick: () => {
                this.state.stops.reverse();
                this.state.stops.forEach(s => s.position = 100 - s.position);
                this.emitChange();
                this.render();
            }
        });
        topBar.appendChild(reverseBtn.element);

        this.element.appendChild(topBar);

        // 2. Gradient Slider
        this.renderGradientSlider();

        // 3. Stop Color Picker (HSB)
        this.renderColorPicker();
    }

    renderGradientSlider() {
        const container = document.createElement('div');
        container.style.height = '24px';
        container.style.position = 'relative';
        container.style.marginTop = '4px';
        container.style.marginBottom = '12px';

        // Bar
        const bar = document.createElement('div');
        bar.style.width = '100%';
        bar.style.height = '12px';
        bar.style.borderRadius = '6px';
        bar.style.position = 'absolute';
        bar.style.top = '6px';
        // Checkerboard bg for transparency
        bar.style.backgroundImage = `
            linear-gradient(45deg, #ccc 25%, transparent 25%), 
            linear-gradient(-45deg, #ccc 25%, transparent 25%), 
            linear-gradient(45deg, transparent 75%, #ccc 75%), 
            linear-gradient(-45deg, transparent 75%, #ccc 75%)`;
        bar.style.backgroundSize = '8px 8px';
        bar.style.backgroundColor = '#fff';

        // Gradient Preview Overlay
        const preview = document.createElement('div');
        preview.style.position = 'absolute';
        preview.style.top = '0';
        preview.style.left = '0';
        preview.style.width = '100%';
        preview.style.height = '100%';
        preview.style.borderRadius = 'inherit';
        preview.style.background = this.getGradientString(true); // Linear 90deg for preview
        bar.appendChild(preview);
        
        // Click bar to add stop
        bar.addEventListener('mousedown', (e) => {
            if (e.target !== bar && e.target !== preview) return;
            const rect = bar.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const pos = Math.max(0, Math.min(100, (x / rect.width) * 100));
            
            // Add new stop
            // Interpolate color at this position? For now, just duplicate selected or white
            const newStop = { color: '#FFFFFF', position: pos };
            this.state.stops.push(newStop);
            this.state.stops.sort((a, b) => a.position - b.position);
            this.selectedStopIndex = this.state.stops.indexOf(newStop);
            this.updateColorState();
            this.emitChange();
            this.render();
        });

        container.appendChild(bar);

        // Stops
        this.state.stops.forEach((stop, index) => {
            const handle = document.createElement('div');
            handle.style.width = '12px';
            handle.style.height = '12px';
            handle.style.borderRadius = '50%';
            handle.style.border = '2px solid #fff';
            handle.style.boxShadow = '0 0 2px rgba(0,0,0,0.5)';
            handle.style.position = 'absolute';
            handle.style.top = '6px';
            handle.style.left = `${stop.position}%`;
            handle.style.transform = 'translate(-50%, -50%)';
            handle.style.cursor = 'grab';
            handle.style.backgroundColor = stop.color;
            handle.style.zIndex = index === this.selectedStopIndex ? '10' : '1';

            if (index === this.selectedStopIndex) {
                handle.style.borderColor = '#0055FF';
                handle.style.transform = 'translate(-50%, -50%) scale(1.2)';
            }

            // Drag Logic
            handle.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                this.selectedStopIndex = index;
                this.updateColorState();
                this.render(); // Highlight selected

                const startX = e.clientX;
                const startPos = stop.position;
                const rect = bar.getBoundingClientRect();

                const moveHandler = (e) => {
                    const dx = e.clientX - startX;
                    const dPos = (dx / rect.width) * 100;
                    let newPos = Math.max(0, Math.min(100, startPos + dPos));
                    
                    stop.position = newPos;
                    
                    handle.style.left = `${newPos}%`;
                    preview.style.background = this.getGradientString(true);
                    this.emitChange();
                };

                const upHandler = () => {
                    document.removeEventListener('mousemove', moveHandler);
                    document.removeEventListener('mouseup', upHandler);
                    // Sort stops
                    this.state.stops.sort((a, b) => a.position - b.position);
                    // Update selected index
                    this.selectedStopIndex = this.state.stops.indexOf(stop);
                    this.render();
                };

                document.addEventListener('mousemove', moveHandler);
                document.addEventListener('mouseup', upHandler);
            });

            container.appendChild(handle);
        });

        this.element.appendChild(container);
    }

    renderColorPicker() {
        // Reusing SolidTab logic
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '12px';

        // 1. Color Area (HSB)
        const colorArea = document.createElement('div');
        colorArea.style.width = '100%';
        colorArea.style.height = '120px'; // Slightly shorter
        colorArea.style.borderRadius = '4px';
        colorArea.style.position = 'relative';
        colorArea.style.cursor = 'default';
        colorArea.style.overflow = 'hidden';
        
        // Backgrounds
        const colorAreaBg = document.createElement('div');
        colorAreaBg.style.position = 'absolute';
        colorAreaBg.style.inset = '0';
        colorAreaBg.style.backgroundColor = `hsl(${this.colorState.h}, 100%, 50%)`;
        
        const whiteGrad = document.createElement('div');
        whiteGrad.style.position = 'absolute';
        whiteGrad.style.inset = '0';
        whiteGrad.style.background = 'linear-gradient(to right, #fff, transparent)';
        
        const blackGrad = document.createElement('div');
        blackGrad.style.position = 'absolute';
        blackGrad.style.inset = '0';
        blackGrad.style.background = 'linear-gradient(to top, #000, transparent)';

        colorArea.appendChild(colorAreaBg);
        colorArea.appendChild(whiteGrad);
        colorArea.appendChild(blackGrad);

        // Handle
        const areaHandle = document.createElement('div');
        areaHandle.style.width = '12px';
        areaHandle.style.height = '12px';
        areaHandle.style.borderRadius = '50%';
        areaHandle.style.border = '2px solid #fff';
        areaHandle.style.boxShadow = '0 0 2px rgba(0,0,0,0.5)';
        areaHandle.style.position = 'absolute';
        areaHandle.style.left = `${this.colorState.s}%`;
        areaHandle.style.top = `${100 - this.colorState.b}%`;
        areaHandle.style.transform = 'translate(-50%, -50%)';
        areaHandle.style.pointerEvents = 'none';
        
        colorArea.appendChild(areaHandle);

        // Interaction
        const handleAreaMove = (e) => {
            const rect = colorArea.getBoundingClientRect();
            if (rect.width === 0) return;
            let x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
            let y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
            
            this.colorState.s = (x / rect.width) * 100;
            this.colorState.b = 100 - ((y / rect.height) * 100);
            
            areaHandle.style.left = `${this.colorState.s}%`;
            areaHandle.style.top = `${100 - this.colorState.b}%`;
            
            this.updateStopColor();
        };

        colorArea.addEventListener('mousedown', (e) => {
            e.preventDefault();
            handleAreaMove(e);
            const moveHandler = (e) => {
                if (e.buttons === 0) { upHandler(); return; }
                handleAreaMove(e);
            };
            const upHandler = () => {
                document.removeEventListener('mousemove', moveHandler);
                document.removeEventListener('mouseup', upHandler);
            };
            document.addEventListener('mousemove', moveHandler);
            document.addEventListener('mouseup', upHandler);
        });

        container.appendChild(colorArea);

        // 2. Sliders
        const sliders = document.createElement('div');
        sliders.style.display = 'flex';
        sliders.style.flexDirection = 'column';
        sliders.style.gap = '10px';

        // Hue Slider
        const hueSlider = document.createElement('div');
        hueSlider.style.height = '10px';
        hueSlider.style.borderRadius = '5px';
        hueSlider.style.background = 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)';
        hueSlider.style.position = 'relative';
        
        const hueHandle = document.createElement('div');
        hueHandle.style.width = '12px';
        hueHandle.style.height = '12px';
        hueHandle.style.borderRadius = '50%';
        hueHandle.style.backgroundColor = '#fff';
        hueHandle.style.boxShadow = '0 0 2px rgba(0,0,0,0.5)';
        hueHandle.style.position = 'absolute';
        hueHandle.style.top = '50%';
        hueHandle.style.left = `${(this.colorState.h / 360) * 100}%`;
        hueHandle.style.transform = 'translate(-50%, -50%)';
        hueHandle.style.pointerEvents = 'none';
        hueSlider.appendChild(hueHandle);

        const handleHueMove = (e) => {
            const rect = hueSlider.getBoundingClientRect();
            if (rect.width === 0) return;
            let x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
            
            this.colorState.h = (x / rect.width) * 360;
            hueHandle.style.left = `${(this.colorState.h / 360) * 100}%`;
            colorAreaBg.style.backgroundColor = `hsl(${this.colorState.h}, 100%, 50%)`;
            
            this.updateStopColor();
        };

        hueSlider.addEventListener('mousedown', (e) => {
            e.preventDefault();
            handleHueMove(e);
            const moveHandler = (e) => {
                if (e.buttons === 0) { upHandler(); return; }
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
        alphaSlider.style.backgroundImage = `linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)`;
        alphaSlider.style.backgroundSize = '8px 8px';
        alphaSlider.style.backgroundColor = '#fff';
        alphaSlider.style.position = 'relative';

        const alphaGrad = document.createElement('div');
        alphaGrad.style.position = 'absolute';
        alphaGrad.style.inset = '0';
        alphaGrad.style.borderRadius = 'inherit';
        // Update this gradient dynamically
        const rgb = ColorUtils.hsbToRgb(this.colorState.h, this.colorState.s, this.colorState.b);
        alphaGrad.style.background = `linear-gradient(to right, rgba(${rgb.r},${rgb.g},${rgb.b},0), rgba(${rgb.r},${rgb.g},${rgb.b},1))`;
        alphaSlider.appendChild(alphaGrad);

        const alphaHandle = document.createElement('div');
        alphaHandle.style.width = '12px';
        alphaHandle.style.height = '12px';
        alphaHandle.style.borderRadius = '50%';
        alphaHandle.style.backgroundColor = '#fff';
        alphaHandle.style.boxShadow = '0 0 2px rgba(0,0,0,0.5)';
        alphaHandle.style.position = 'absolute';
        alphaHandle.style.top = '50%';
        alphaHandle.style.left = `${this.colorState.a}%`;
        alphaHandle.style.transform = 'translate(-50%, -50%)';
        alphaHandle.style.pointerEvents = 'none';
        alphaSlider.appendChild(alphaHandle);

        const handleAlphaMove = (e) => {
            const rect = alphaSlider.getBoundingClientRect();
            if (rect.width === 0) return;
            let x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
            
            this.colorState.a = (x / rect.width) * 100;
            alphaHandle.style.left = `${this.colorState.a}%`;
            
            this.updateStopColor();
        };

        alphaSlider.addEventListener('mousedown', (e) => {
            e.preventDefault();
            handleAlphaMove(e);
            const moveHandler = (e) => {
                if (e.buttons === 0) { upHandler(); return; }
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
        container.appendChild(sliders);

        // Delete Stop Button
        if (this.state.stops.length > 2) {
            const deleteBtn = new IconButton({
                icon: Icons.TRASH || '<i class="fa-solid fa-trash"></i>',
                title: 'Delete Stop',
                onClick: () => {
                    this.state.stops.splice(this.selectedStopIndex, 1);
                    this.selectedStopIndex = Math.max(0, this.selectedStopIndex - 1);
                    this.updateColorState();
                    this.emitChange();
                    this.render();
                }
            });
            deleteBtn.element.style.alignSelf = 'flex-end';
            container.appendChild(deleteBtn.element);
        }

        this.element.appendChild(container);
    }

    updateStopColor() {
        const rgb = ColorUtils.hsbToRgb(this.colorState.h, this.colorState.s, this.colorState.b);
        const alpha = this.colorState.a / 100;
        const color = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
        
        this.state.stops[this.selectedStopIndex].color = color;
        this.emitChange();
        
        // Update gradient slider preview immediately if possible, but render() does it.
        // To avoid full re-render loop, we could just update the specific elements, 
        // but for now render() is safe enough.
        // Actually, full render might kill the drag interaction of the color picker.
        // So we should NOT call render() here.
        // We need to update the gradient bar preview manually.
        const barPreview = this.element.querySelector('div[style*="linear-gradient"]'); // Hacky selector
        // Better: store reference
    }

    getGradientString(forPreview = false) {
        const type = forPreview ? 'linear' : this.state.type;
        const angle = forPreview ? '90deg' : (this.state.type === 'linear' ? `${this.state.angle}deg` : 'circle');
        
        const stopsStr = this.state.stops
            .map(s => `${s.color} ${s.position}%`)
            .join(', ');
            
        return `${type}-gradient(${angle}, ${stopsStr})`;
    }

    emitChange() {
        const val = this.getGradientString();
        this.onChange({
            value: val,
            type: 'gradient'
        });
    }
}

