import { IconButton } from '../IconButton.js';
import { Icons } from '../../Icons.js';
import { NumberInput } from '../NumberInput.js';
import { ColorUtils } from '../../../utils/ColorUtils.js';
import { ColorPickerFlyout } from './ColorPickerFlyout.js';

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

        // Create persistent containers
        this.topBar = document.createElement('div');
        this.topBar.style.display = 'flex';
        this.topBar.style.gap = '8px';
        this.topBar.style.alignItems = 'center';
        this.element.appendChild(this.topBar);

        this.sliderContainer = document.createElement('div');
        this.element.appendChild(this.sliderContainer);

        this.stopsListContainer = document.createElement('div');
        this.element.appendChild(this.stopsListContainer);
        
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
            // Check for Diamond metadata
            if (value.startsWith('/* diamond|')) {
                const metaEnd = value.indexOf('*/');
                if (metaEnd > -1) {
                    const meta = value.substring(11, metaEnd).trim();
                    const parts = meta.split('|');
                    // Format: angle|stops
                    // stops: color@pos,color@pos
                    const angle = parseFloat(parts[0] || '0');
                    const stopsStr = parts[1] || '';
                    const stops = stopsStr.split(';').map(s => {
                        const [color, pos] = s.split('@');
                        return { color, position: parseFloat(pos) };
                    });
                    return { type: 'diamond', angle, stops };
                }
            }

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
            } else if (value.startsWith('conic-gradient')) {
                type = 'angular';
                const content = value.substring(15, value.length - 1);
                // Format: from 90deg at center, ...
                const fromMatch = content.match(/from\s+([\d.]+)deg\s+at\s+center,\s*/);
                if (fromMatch) {
                    angle = parseFloat(fromMatch[1]);
                    stopsString = content.substring(fromMatch[0].length);
                } else {
                    stopsString = content;
                }
            } else {
                return defaultGradient;
            }

            // Parse stops (handling rgba commas)
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
        const match = stopStr.match(/^(.*?)\s+([\d.]+)%$/);
        if (match) {
            return { color: match[1], position: parseFloat(match[2]) };
        }
        return { color: stopStr, position: 0 };
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
        this.renderTopBar();
        this.renderGradientSlider();
        this.renderStopsList();
    }

    renderTopBar() {
        this.topBar.innerHTML = '';

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
        
        ['linear', 'radial', 'angular', 'diamond'].forEach(t => {
            const opt = document.createElement('option');
            opt.value = t;
            opt.textContent = t.charAt(0).toUpperCase() + t.slice(1);
            if (t === this.state.type) opt.selected = true;
            typeSelect.appendChild(opt);
        });

        typeSelect.onchange = (e) => {
            this.state.type = e.target.value;
            this.emitChange();
            this.render(); // Full render needed for angle input visibility
        };
        this.topBar.appendChild(typeSelect);

        // Angle Input
        if (this.state.type === 'linear' || this.state.type === 'angular' || this.state.type === 'diamond') {
            const angleInput = new NumberInput({
                value: this.state.angle,
                min: 0,
                max: 360,
                step: 1,
                units: '°',
                scrubbable: true,
                onChange: (val, isTransient) => {
                    this.state.angle = val;
                    this.emitChange(isTransient);
                }
            });
            angleInput.element.style.width = '60px';
            this.topBar.appendChild(angleInput.element);
        }

        // Rotate Button
        const rotateBtn = new IconButton({
            icon: Icons.ROTATE || '<i class="fa-solid fa-rotate-right"></i>',
            title: 'Rotate 90°',
            onClick: () => {
                this.state.angle = (this.state.angle + 90) % 360;
                this.emitChange();
                this.render();
            }
        });
        this.topBar.appendChild(rotateBtn.element);

        // Reverse Button
        const reverseBtn = new IconButton({
            icon: Icons.REVERSE || '<i class="fa-solid fa-arrow-right-arrow-left"></i>',
            title: 'Reverse Gradient',
            onClick: () => {
                this.state.stops.reverse();
                this.state.stops.forEach(s => s.position = 100 - s.position);
                this.emitChange();
                this.render();
            }
        });
        this.topBar.appendChild(reverseBtn.element);
    }

    renderGradientSlider() {
        this.sliderContainer.innerHTML = '';
        const container = document.createElement('div');
        container.style.height = '24px';
        container.style.position = 'relative';
        container.style.marginTop = '24px';
        container.style.marginBottom = '12px';

        // Bar
        const bar = document.createElement('div');
        bar.style.width = '100%';
        bar.style.height = '12px';
        bar.style.borderRadius = '6px';
        bar.style.position = 'absolute';
        bar.style.top = '6px';
        bar.style.backgroundImage = `
            linear-gradient(45deg, #ccc 25%, transparent 25%), 
            linear-gradient(-45deg, #ccc 25%, transparent 25%), 
            linear-gradient(45deg, transparent 75%, #ccc 75%), 
            linear-gradient(-45deg, transparent 75%, #ccc 75%)`;
        bar.style.backgroundSize = '8px 8px';
        bar.style.backgroundColor = '#fff';

        // Preview
        const preview = document.createElement('div');
        preview.style.position = 'absolute';
        preview.style.inset = '0';
        preview.style.borderRadius = 'inherit';
        preview.style.background = this.getGradientString(true);
        bar.appendChild(preview);
        
        // Click to add stop
        bar.addEventListener('mousedown', (e) => {
            e.stopPropagation(); // Prevent flyout from closing
            if (e.target !== bar && e.target !== preview) return;
            const rect = bar.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const pos = Math.max(0, Math.min(100, (x / rect.width) * 100));
            
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
            handle.style.width = '16px';
            handle.style.height = '16px';
            handle.style.borderRadius = '50% 50% 0 50%';
            handle.style.border = '2px solid #fff';
            handle.style.boxShadow = '0 0 2px rgba(0,0,0,0.5)';
            handle.style.position = 'absolute';
            handle.style.top = '0px';
            handle.style.left = `${stop.position}%`;
            handle.style.transform = 'translate(-50%, -85%) rotate(45deg)';
            handle.style.cursor = 'grab';
            handle.style.backgroundColor = stop.color;
            handle.style.zIndex = index === this.selectedStopIndex ? '10' : '1';

            if (index === this.selectedStopIndex) {
                handle.style.borderColor = '#0055FF';
                handle.style.transform = 'translate(-50%, -85%) rotate(45deg) scale(1.2)';
            }

            // Drag Logic
            handle.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                this.selectedStopIndex = index;
                this.updateColorState();
                
                // Update selection visual without full re-render
                // We select by class or just assume children order. 
                // Since we don't have classes, let's use the style property we know is unique enough or just iterate children.
                // The container has the bar (child 0) and then handles.
                const handles = Array.from(container.children).slice(1);
                handles.forEach((h, i) => {
                    if (i === index) {
                        h.style.borderColor = '#0055FF';
                        h.style.transform = 'translate(-50%, -85%) rotate(45deg) scale(1.2)';
                        h.style.zIndex = '10';
                    } else {
                        h.style.borderColor = '#fff';
                        h.style.transform = 'translate(-50%, -85%) rotate(45deg)';
                        h.style.zIndex = '1';
                    }
                });
                
                // Update list selection visual
                const listRows = this.stopsListContainer.querySelectorAll('.stop-row');
                listRows.forEach((row, i) => {
                    row.style.backgroundColor = i === index ? '#444' : 'transparent';
                });

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

                    // Update list input in realtime
                    // We find the input by index. The list container has a header then the list div.
                    // The list div has rows. Each row has a NumberInput.
                    // The NumberInput structure is usually a wrapper div with an input inside.
                    const listDiv = this.stopsListContainer.lastElementChild;
                    if (listDiv && listDiv.children[index]) {
                        const row = listDiv.children[index];
                        const input = row.querySelector('input');
                        if (input) {
                            input.value = Math.round(newPos) + '%';
                        }
                    }
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

        this.sliderContainer.appendChild(container);
    }

    renderStopsList() {
        this.stopsListContainer.innerHTML = '';
        
        const listHeader = document.createElement('div');
        listHeader.style.display = 'flex';
        listHeader.style.justifyContent = 'space-between';
        listHeader.style.alignItems = 'center';
        listHeader.style.marginBottom = '4px';
        
        const label = document.createElement('span');
        label.textContent = 'Stops';
        label.style.fontSize = '11px';
        label.style.color = '#888';
        listHeader.appendChild(label);

        const addStopBtn = new IconButton({
            icon: Icons.PLUS,
            title: 'Add Stop',
            onClick: () => {
                const newStop = { color: '#FFFFFF', position: 50 };
                this.state.stops.push(newStop);
                this.state.stops.sort((a, b) => a.position - b.position);
                this.selectedStopIndex = this.state.stops.indexOf(newStop);
                this.updateColorState();
                this.emitChange();
                this.render();
            }
        });
        listHeader.appendChild(addStopBtn.element);
        this.stopsListContainer.appendChild(listHeader);

        const stopsList = document.createElement('div');
        stopsList.style.display = 'flex';
        stopsList.style.flexDirection = 'column';
        stopsList.style.gap = '4px';
        stopsList.style.marginBottom = '12px';
        stopsList.style.maxHeight = '120px';
        stopsList.style.overflowY = 'auto';

        this.state.stops.forEach((stop, index) => {
            const row = document.createElement('div');
            row.className = 'stop-row';
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.gap = '8px';
            row.style.padding = '4px';
            row.style.borderRadius = '4px';
            row.style.cursor = 'pointer';
            
            if (index === this.selectedStopIndex) {
                row.style.backgroundColor = '#444';
            }
            
            row.onclick = () => {
                this.selectedStopIndex = index;
                this.updateColorState();
                this.render();
            };

            // Color Swatch
            const swatch = document.createElement('div');
            swatch.style.width = '16px';
            swatch.style.height = '16px';
            swatch.style.borderRadius = '2px';
            swatch.style.backgroundColor = stop.color;
            swatch.style.border = '1px solid #666';
            swatch.style.cursor = 'pointer';
            
            swatch.onclick = (e) => {
                e.stopPropagation();
                this.openColorPicker(swatch, stop, index);
            };

            row.appendChild(swatch);

            // Position Input
            const posInput = new NumberInput({
                value: Math.round(stop.position),
                min: 0, max: 100, units: '%',
                scrubbable: true,
                onChange: (val, isTransient) => {
                    stop.position = val;
                    this.state.stops.sort((a, b) => a.position - b.position);
                    this.selectedStopIndex = this.state.stops.indexOf(stop);
                    this.emitChange(isTransient);
                    this.render();
                }
            });
            posInput.element.style.width = '48px';
            posInput.element.onclick = (e) => e.stopPropagation();
            row.appendChild(posInput.element);

            // Opacity Input
            const rgba = ColorUtils.parseColor(stop.color);
            const opacityInput = new NumberInput({
                value: Math.round(rgba.a * 100),
                min: 0, max: 100, units: '%',
                scrubbable: true,
                onChange: (val, isTransient) => {
                    const currentRgba = ColorUtils.parseColor(stop.color);
                    const newColor = `rgba(${currentRgba.r}, ${currentRgba.g}, ${currentRgba.b}, ${val/100})`;
                    stop.color = newColor;
                    if (index === this.selectedStopIndex) this.updateColorState();
                    this.emitChange(isTransient);
                    this.render();
                }
            });
            opacityInput.element.style.width = '48px';
            opacityInput.element.onclick = (e) => e.stopPropagation();
            row.appendChild(opacityInput.element);

            // Remove Button
            const removeBtn = new IconButton({
                icon: Icons.MINUS,
                title: 'Remove',
                onClick: (e) => {
                    e.stopPropagation();
                    if (this.state.stops.length <= 2) return;
                    this.state.stops.splice(index, 1);
                    this.selectedStopIndex = Math.max(0, this.selectedStopIndex - 1);
                    this.updateColorState();
                    this.emitChange();
                    this.render();
                }
            });
            if (this.state.stops.length <= 2) {
                removeBtn.element.style.opacity = '0.5';
                removeBtn.element.style.pointerEvents = 'none';
            }
            row.appendChild(removeBtn.element);

            stopsList.appendChild(row);
        });
        
        this.stopsListContainer.appendChild(stopsList);
    }





    getGradientString(forPreview = false) {
        const type = forPreview ? 'linear' : this.state.type;
        let prefix = 'linear-gradient';
        let args = '';

        // Sort stops for string generation to ensure smooth gradient
        const sortedStops = [...this.state.stops].sort((a, b) => a.position - b.position);

        const stopsStr = sortedStops
            .map(s => `${s.color} ${s.position}%`)
            .join(', ');

        if (type === 'linear') {
            prefix = 'linear-gradient';
            args = `${forPreview ? '90' : this.state.angle}deg, ${stopsStr}`;
        } else if (type === 'radial') {
            prefix = 'radial-gradient';
            args = `circle at center, ${stopsStr}`;
        } else if (type === 'angular') {
            prefix = 'conic-gradient';
            args = `from ${forPreview ? '0' : (this.state.angle || 0)}deg at center, ${stopsStr}`;
        } else if (type === 'diamond') {
             prefix = 'radial-gradient';
             args = `circle at center, ${stopsStr}`;
             
             if (!forPreview) {
                 const metaStops = this.state.stops.map(s => `${s.color}@${s.position}`).join(';');
                 const meta = `/* diamond|${this.state.angle || 0}|${metaStops} */`;
                 return `${meta} ${prefix}(${args})`;
             }
        }

        return `${prefix}(${args})`;
    }

    emitChange(isTransient = false) {
        const val = this.getGradientString();
        this.onChange({
            value: val,
            type: 'gradient'
        }, isTransient);
    }

    openColorPicker(target, stop, index) {
        // Capture position before render destroys the element
        const rect = target.getBoundingClientRect();
        const pickerWidth = 240;
        const gap = 10;
        
        // Default to left of the swatch to avoid overlapping the FillFlyout
        let left = rect.left - pickerWidth - gap;
        let top = rect.top;

        if (this.activeColorPicker) {
            this.activeColorPicker.destroy();
            this.activeColorPicker = null;
        }

        this.selectedStopIndex = index;
        this.updateColorState();
        this.render(); // Highlight selected row

        const picker = new ColorPickerFlyout({
            color: stop.color,
            onChange: (newColor) => {
                stop.color = newColor;
                this.updateColorState();
                this.emitChange();
                
                // Direct update of swatch in list
                const listDiv = this.stopsListContainer.lastElementChild;
                if (listDiv && listDiv.children[index]) {
                    const row = listDiv.children[index];
                    const swatch = row.querySelector('div[style*="background-color"]');
                    if (swatch) swatch.style.backgroundColor = newColor;
                }

                // Direct update of handle on bar
                const container = this.sliderContainer.firstElementChild;
                if (container) {
                    // children[0] is bar. children[1..N] are handles.
                    const handle = container.children[index + 1];
                    if (handle) handle.style.backgroundColor = newColor;
                    
                    // Update preview
                    const bar = container.children[0];
                    const preview = bar.firstElementChild;
                    if (preview) preview.style.background = this.getGradientString(true);
                }
            },
            onClose: () => {
                if (this.activeColorPicker) {
                    this.activeColorPicker.destroy();
                    this.activeColorPicker = null;
                }
                this.render(); // Ensure final consistency
            }
        });

        document.body.appendChild(picker.element);
        this.activeColorPicker = picker;

        // Position adjustments
        const pickerRect = picker.element.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Recalculate left based on actual width
        left = rect.left - pickerRect.width - gap;

        // Horizontal positioning
        if (left < 0) {
            // Try right side
            const rightPos = rect.right + gap;
            if (rightPos + pickerRect.width <= viewportWidth) {
                left = rightPos;
            } else {
                // Clamp
                left = Math.max(gap, Math.min(left, viewportWidth - pickerRect.width - gap));
            }
        }
        
        // Vertical positioning
        if (top + pickerRect.height > viewportHeight) {
            top = viewportHeight - pickerRect.height - gap;
        }
        if (top < gap) {
            top = gap;
        }

        picker.element.style.left = `${left}px`;
        picker.element.style.top = `${top}px`;
        
        // Close on click outside
        const closeHandler = (e) => {
            if (this.activeColorPicker && !picker.element.contains(e.target)) {
                picker.destroy();
                this.activeColorPicker = null;
                document.removeEventListener('mousedown', closeHandler, true);
            }
        };
        setTimeout(() => document.addEventListener('mousedown', closeHandler, true), 0);
    }

    destroy() {
        if (this.activeColorPicker) {
            this.activeColorPicker.destroy();
            this.activeColorPicker = null;
        }
    }
}

