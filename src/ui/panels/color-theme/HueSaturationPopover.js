/**
 * HueSaturationPopover.js
 * 
 * A compact popover with hue and saturation sliders for editing column colors.
 * The slider tracks display a visual preview of the hue/saturation spectrum.
 * 
 * Architecture:
 * - Hue slider: 0-360° with rainbow gradient track
 * - Saturation slider: 0-100% with grayscale-to-current-hue gradient track
 * - Both sliders update in real-time as values change
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
        this.isDraggingHue = false;
        this.isDraggingSat = false;
        
        this.element = this.create();
        this.updateSaturationGradient();
        
        // Close on outside click
        this.boundHandleOutsideClick = this.handleOutsideClick.bind(this);
        setTimeout(() => {
            document.addEventListener('mousedown', this.boundHandleOutsideClick);
        }, 0);
    }
    
    create() {
        const popover = document.createElement('div');
        popover.className = 'hs-popover';
        
        // Hue slider row
        const hueRow = document.createElement('div');
        hueRow.className = 'hs-popover__row';
        
        const hueLabel = document.createElement('div');
        hueLabel.className = 'hs-popover__label';
        hueLabel.textContent = 'Hue';
        hueRow.appendChild(hueLabel);
        
        const hueTrackContainer = document.createElement('div');
        hueTrackContainer.className = 'hs-popover__track-container';
        
        this.hueTrack = document.createElement('div');
        this.hueTrack.className = 'hs-popover__track hs-popover__track--hue';
        
        this.hueThumb = document.createElement('div');
        this.hueThumb.className = 'hs-popover__thumb';
        this.hueThumb.style.left = `${(this.hue / 360) * 100}%`;
        
        this.hueTrack.appendChild(this.hueThumb);
        hueTrackContainer.appendChild(this.hueTrack);
        hueRow.appendChild(hueTrackContainer);
        
        this.hueInput = document.createElement('input');
        this.hueInput.type = 'number';
        this.hueInput.className = 'hs-popover__input';
        this.hueInput.min = 0;
        this.hueInput.max = 360;
        this.hueInput.value = Math.round(this.hue);
        hueRow.appendChild(this.hueInput);
        
        popover.appendChild(hueRow);
        
        // Saturation slider row
        const satRow = document.createElement('div');
        satRow.className = 'hs-popover__row';
        
        const satLabel = document.createElement('div');
        satLabel.className = 'hs-popover__label';
        satLabel.textContent = 'Sat';
        satRow.appendChild(satLabel);
        
        const satTrackContainer = document.createElement('div');
        satTrackContainer.className = 'hs-popover__track-container';
        
        this.satTrack = document.createElement('div');
        this.satTrack.className = 'hs-popover__track hs-popover__track--sat';
        
        this.satThumb = document.createElement('div');
        this.satThumb.className = 'hs-popover__thumb';
        this.satThumb.style.left = `${this.saturation}%`;
        
        this.satTrack.appendChild(this.satThumb);
        satTrackContainer.appendChild(this.satTrack);
        satRow.appendChild(satTrackContainer);
        
        this.satInput = document.createElement('input');
        this.satInput.type = 'number';
        this.satInput.className = 'hs-popover__input';
        this.satInput.min = 0;
        this.satInput.max = 100;
        this.satInput.value = Math.round(this.saturation);
        satRow.appendChild(this.satInput);
        
        popover.appendChild(satRow);
        
        // Event listeners
        this.setupHueEvents();
        this.setupSatEvents();
        
        return popover;
    }
    
    setupHueEvents() {
        // Track click and drag
        this.hueTrack.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.hueTrackRect = this.hueTrack.getBoundingClientRect();
            this.updateHueFromPosition(e.clientX);
            this.startHueDrag(e);
        });
        
        // Input change
        this.hueInput.addEventListener('change', (e) => {
            const value = Math.max(0, Math.min(360, parseInt(e.target.value) || 0));
            this.setHue(value);
        });
        
        this.hueInput.addEventListener('focus', () => this.hueInput.select());
    }
    
    setupSatEvents() {
        // Track click and drag
        this.satTrack.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.satTrackRect = this.satTrack.getBoundingClientRect();
            this.updateSatFromPosition(e.clientX);
            this.startSatDrag(e);
        });
        
        // Input change
        this.satInput.addEventListener('change', (e) => {
            const value = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
            this.setSaturation(value);
        });
        
        this.satInput.addEventListener('focus', () => this.satInput.select());
    }
    
    startHueDrag(e) {
        this.isDraggingHue = true;
        document.body.style.cursor = 'ew-resize';
        
        const moveHandler = (e) => {
            if (!this.isDraggingHue) return;
            this.updateHueFromPosition(e.clientX);
        };
        
        const upHandler = () => {
            this.isDraggingHue = false;
            document.body.style.cursor = '';
            window.removeEventListener('mousemove', moveHandler);
            window.removeEventListener('mouseup', upHandler);
        };
        
        window.addEventListener('mousemove', moveHandler);
        window.addEventListener('mouseup', upHandler);
    }
    
    startSatDrag(e) {
        this.isDraggingSat = true;
        document.body.style.cursor = 'ew-resize';
        
        const moveHandler = (e) => {
            if (!this.isDraggingSat) return;
            this.updateSatFromPosition(e.clientX);
        };
        
        const upHandler = () => {
            this.isDraggingSat = false;
            document.body.style.cursor = '';
            window.removeEventListener('mousemove', moveHandler);
            window.removeEventListener('mouseup', upHandler);
        };
        
        window.addEventListener('mousemove', moveHandler);
        window.addEventListener('mouseup', upHandler);
    }
    
    updateHueFromPosition(clientX) {
        if (!this.hueTrackRect) return;
        const percent = Math.max(0, Math.min(1, (clientX - this.hueTrackRect.left) / this.hueTrackRect.width));
        const newHue = Math.round(percent * 360);
        this.setHue(newHue);
    }
    
    updateSatFromPosition(clientX) {
        if (!this.satTrackRect) return;
        const percent = Math.max(0, Math.min(1, (clientX - this.satTrackRect.left) / this.satTrackRect.width));
        const newSat = Math.round(percent * 100);
        this.setSaturation(newSat);
    }
    
    setHue(value) {
        this.hue = Math.max(0, Math.min(360, value));
        this.hueThumb.style.left = `${(this.hue / 360) * 100}%`;
        this.hueInput.value = Math.round(this.hue);
        this.updateSaturationGradient();
        this.options.onChange(this.hue, this.saturation);
    }
    
    setSaturation(value) {
        this.saturation = Math.max(0, Math.min(100, value));
        this.satThumb.style.left = `${this.saturation}%`;
        this.satInput.value = Math.round(this.saturation);
        this.options.onChange(this.hue, this.saturation);
    }
    
    /**
     * Update saturation track gradient to show current hue
     */
    updateSaturationGradient() {
        const grayColor = hslToHex(0, 0, 50);
        const saturatedColor = hslToHex(this.hue, 100, 50);
        this.satTrack.style.background = `linear-gradient(to right, ${grayColor}, ${saturatedColor})`;
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
