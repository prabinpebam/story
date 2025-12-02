/**
 * HueSaturationPopover.js
 * 
 * A compact popover with a donut color wheel for editing column colors.
 * The donut displays hue around the circumference and saturation radially.
 * 
 * Architecture:
 * - Hue: angle around the donut (0-360°)
 * - Saturation: radial position (inner edge = 0%, outer edge = 100%)
 * - Lightness: fixed at 60% for consistent preview
 * - Real-time updates as user drags on the donut
 * - Popover positioned relative to the anchor element
 */

import { hslToHex } from './ColorThemeUtils.js';

export class HueSaturationPopover {
    /**
     * @param {Object} options
     * @param {number} options.hue - Initial hue value (0-360)
     * @param {number} options.saturation - Initial saturation value (0-100)
     * @param {Function} options.onChange - Callback when hue or saturation changes: (hue, saturation) => {}
     * @param {Function} options.onClose - Callback when popover should close
     */
    constructor(options = {}) {
        this.options = {
            hue: 0,
            saturation: 50,
            onChange: () => {},
            onClose: () => {},
            ...options
        };
        
        this.hue = this.options.hue;
        this.saturation = this.options.saturation;
        this.isDragging = false;
        
        // Donut dimensions
        this.canvasSize = 200;
        this.innerRadius = 40;
        this.outerRadius = 95;
        this.lightness = 0.60; // 60% lightness for preview
        
        this.element = this.create();
        this.renderDonut();
        this.updateIndicator();
        
        // Close on outside click
        this.boundHandleOutsideClick = this.handleOutsideClick.bind(this);
        setTimeout(() => {
            document.addEventListener('mousedown', this.boundHandleOutsideClick);
        }, 0);
    }
    
    /**
     * Convert HSL to RGB (0-255)
     */
    hslToRgb(h, s, l) {
        h = h / 360;
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        return [
            Math.round(r * 255),
            Math.round(g * 255),
            Math.round(b * 255)
        ];
    }
    
    create() {
        const popover = document.createElement('div');
        popover.className = 'hs-popover hs-popover--donut';
        
        // Canvas for the donut
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'hs-popover__canvas-container';
        
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'hs-popover__canvas';
        this.canvas.width = this.canvasSize;
        this.canvas.height = this.canvasSize;
        this.ctx = this.canvas.getContext('2d');
        
        canvasContainer.appendChild(this.canvas);
        
        // Indicator (selection circle)
        this.indicator = document.createElement('div');
        this.indicator.className = 'hs-popover__indicator';
        canvasContainer.appendChild(this.indicator);
        
        popover.appendChild(canvasContainer);
        
        // Value display row
        const valuesRow = document.createElement('div');
        valuesRow.className = 'hs-popover__values-row';
        
        // Hue input
        const hueGroup = document.createElement('div');
        hueGroup.className = 'hs-popover__value-group';
        
        const hueLabel = document.createElement('label');
        hueLabel.className = 'hs-popover__value-label';
        hueLabel.textContent = 'H';
        hueGroup.appendChild(hueLabel);
        
        this.hueInput = document.createElement('input');
        this.hueInput.type = 'number';
        this.hueInput.className = 'hs-popover__value-input';
        this.hueInput.min = 0;
        this.hueInput.max = 360;
        this.hueInput.value = Math.round(this.hue);
        hueGroup.appendChild(this.hueInput);
        
        const hueSuffix = document.createElement('span');
        hueSuffix.className = 'hs-popover__value-suffix';
        hueSuffix.textContent = '°';
        hueGroup.appendChild(hueSuffix);
        
        valuesRow.appendChild(hueGroup);
        
        // Saturation input
        const satGroup = document.createElement('div');
        satGroup.className = 'hs-popover__value-group';
        
        const satLabel = document.createElement('label');
        satLabel.className = 'hs-popover__value-label';
        satLabel.textContent = 'S';
        satGroup.appendChild(satLabel);
        
        this.satInput = document.createElement('input');
        this.satInput.type = 'number';
        this.satInput.className = 'hs-popover__value-input';
        this.satInput.min = 0;
        this.satInput.max = 100;
        this.satInput.value = Math.round(this.saturation);
        satGroup.appendChild(this.satInput);
        
        const satSuffix = document.createElement('span');
        satSuffix.className = 'hs-popover__value-suffix';
        satSuffix.textContent = '%';
        satGroup.appendChild(satSuffix);
        
        valuesRow.appendChild(satGroup);
        
        popover.appendChild(valuesRow);
        
        // Event listeners
        this.setupCanvasEvents();
        this.setupInputEvents();
        
        return popover;
    }
    
    /**
     * Render the HSL donut on the canvas
     */
    renderDonut() {
        const width = this.canvasSize;
        const height = this.canvasSize;
        const cx = width / 2;
        const cy = height / 2;
        
        const imageData = this.ctx.createImageData(width, height);
        const data = imageData.data;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const dx = x - cx;
                const dy = y - cy;
                const r = Math.sqrt(dx * dx + dy * dy);
                
                const idx = (y * width + x) * 4;
                
                // Only color pixels in the donut region
                if (r >= this.innerRadius && r <= this.outerRadius) {
                    // Angle in degrees [0, 360)
                    let angle = Math.atan2(dy, dx) * 180 / Math.PI;
                    if (angle < 0) angle += 360;
                    
                    const hue = angle;
                    
                    // Saturation mapped from innerRadius..outerRadius -> 0..1
                    const sat = (r - this.innerRadius) / (this.outerRadius - this.innerRadius);
                    
                    const [R, G, B] = this.hslToRgb(hue, sat, this.lightness);
                    
                    data[idx] = R;
                    data[idx + 1] = G;
                    data[idx + 2] = B;
                    data[idx + 3] = 255;
                } else {
                    // Transparent outside donut
                    data[idx + 3] = 0;
                }
            }
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }
    
    /**
     * Update the position of the selection indicator
     */
    updateIndicator() {
        const cx = this.canvasSize / 2;
        const cy = this.canvasSize / 2;
        
        // Convert hue to radians (0° at right, counter-clockwise)
        const angleRad = (this.hue * Math.PI) / 180;
        
        // Map saturation (0-100) to radius (innerRadius to outerRadius)
        const radius = this.innerRadius + (this.saturation / 100) * (this.outerRadius - this.innerRadius);
        
        // Calculate position
        const x = cx + radius * Math.cos(angleRad);
        const y = cy + radius * Math.sin(angleRad);
        
        // Position indicator (centered on the point)
        this.indicator.style.left = `${x}px`;
        this.indicator.style.top = `${y}px`;
        
        // Set indicator border color based on lightness for contrast
        const color = hslToHex(this.hue, this.saturation, 60);
        this.indicator.style.backgroundColor = color;
    }
    
    setupCanvasEvents() {
        const handlePointer = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const cx = this.canvasSize / 2;
            const cy = this.canvasSize / 2;
            
            const dx = x - cx;
            const dy = y - cy;
            const r = Math.sqrt(dx * dx + dy * dy);
            
            // Calculate angle (hue)
            let angle = Math.atan2(dy, dx) * 180 / Math.PI;
            if (angle < 0) angle += 360;
            
            // Calculate saturation from radius, clamped to donut bounds
            let sat;
            if (r < this.innerRadius) {
                sat = 0;
            } else if (r > this.outerRadius) {
                sat = 100;
            } else {
                sat = ((r - this.innerRadius) / (this.outerRadius - this.innerRadius)) * 100;
            }
            
            this.setValues(Math.round(angle), Math.round(sat));
        };
        
        this.canvas.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.isDragging = true;
            handlePointer(e);
            
            const moveHandler = (e) => {
                if (!this.isDragging) return;
                handlePointer(e);
            };
            
            const upHandler = () => {
                this.isDragging = false;
                window.removeEventListener('mousemove', moveHandler);
                window.removeEventListener('mouseup', upHandler);
            };
            
            window.addEventListener('mousemove', moveHandler);
            window.addEventListener('mouseup', upHandler);
        });
    }
    
    setupInputEvents() {
        this.hueInput.addEventListener('change', (e) => {
            let value = parseInt(e.target.value) || 0;
            value = Math.max(0, Math.min(360, value));
            this.setValues(value, this.saturation);
        });
        
        this.hueInput.addEventListener('focus', () => this.hueInput.select());
        
        this.satInput.addEventListener('change', (e) => {
            let value = parseInt(e.target.value) || 0;
            value = Math.max(0, Math.min(100, value));
            this.setValues(this.hue, value);
        });
        
        this.satInput.addEventListener('focus', () => this.satInput.select());
    }
    
    /**
     * Set both hue and saturation values
     */
    setValues(hue, saturation) {
        this.hue = Math.max(0, Math.min(360, hue));
        this.saturation = Math.max(0, Math.min(100, saturation));
        
        this.hueInput.value = Math.round(this.hue);
        this.satInput.value = Math.round(this.saturation);
        
        this.updateIndicator();
        this.options.onChange(this.hue, this.saturation);
    }
    
    /**
     * Handle click outside popover to close
     */
    handleOutsideClick(e) {
        if (!this.element.contains(e.target)) {
            this.options.onClose();
        }
    }
    
    /**
     * Position the popover relative to an anchor element
     */
    positionRelativeTo(anchorElement, containerElement) {
        const anchorRect = anchorElement.getBoundingClientRect();
        const containerRect = containerElement.getBoundingClientRect();
        
        // Position below the anchor, aligned to left edge
        let left = anchorRect.left - containerRect.left;
        let top = anchorRect.bottom - containerRect.top + 8;
        
        // Append temporarily to measure
        containerElement.appendChild(this.element);
        const popoverRect = this.element.getBoundingClientRect();
        
        // Adjust if overflowing right
        if (left + popoverRect.width > containerRect.width) {
            left = containerRect.width - popoverRect.width - 8;
        }
        
        // Adjust if overflowing bottom (flip to top)
        if (top + popoverRect.height > containerRect.height) {
            top = anchorRect.top - containerRect.top - popoverRect.height - 8;
        }
        
        this.element.style.left = `${Math.max(8, left)}px`;
        this.element.style.top = `${Math.max(8, top)}px`;
    }
    
    /**
     * Get current values
     */
    getValues() {
        return { hue: this.hue, saturation: this.saturation };
    }
    
    /**
     * Destroy and cleanup
     */
    destroy() {
        document.removeEventListener('mousedown', this.boundHandleOutsideClick);
        if (this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}
