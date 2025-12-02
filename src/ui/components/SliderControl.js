/**
 * SliderControl.js
 * A reusable slider component with scrubbable label and number input.
 * Follows Design System principles - uses CSS variables for all styling.
 * 
 * Features:
 * - Scrubbable label for precision adjustments
 * - Click-to-jump on track
 * - Draggable thumb
 * - Double-click thumb to reset to default value
 * - Keyboard navigation (arrow keys, Home, End)
 * - Bidirectional fill for ranges that span negative and positive
 * 
 * Structure:
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  Label          ├─────────────●─────────────┤         [ value ]      │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import { store } from '../../core/Store.js';

export class SliderControl {
    /**
     * @param {Object} options
     * @param {string} options.label - Display label for the slider
     * @param {number} options.value - Initial value
     * @param {number} options.min - Minimum value (default: -100)
     * @param {number} options.max - Maximum value (default: 100)
     * @param {number} options.step - Step increment (default: 1)
     * @param {number} options.defaultValue - Value to reset to on double-click (default: 0)
     * @param {string} options.unit - Unit suffix (default: '')
     * @param {number} options.labelWidth - Width of label in px (default: 80)
     * @param {number} options.inputWidth - Width of input in px (default: 48)
     * @param {Function} options.onChange - Callback when value changes
     * @param {boolean} options.disabled - Whether the slider is disabled
     */
    constructor(options = {}) {
        this.options = {
            label: 'Value',
            value: 0,
            min: -100,
            max: 100,
            step: 1,
            defaultValue: 0,
            unit: '',
            labelWidth: 80,
            inputWidth: 48,
            onChange: () => {},
            disabled: false,
            ...options
        };
        
        this.value = this.options.value;
        this.isDragging = false;
        this.isLabelDragging = false;
        this.startX = 0;
        this.startValue = 0;
        this.lastClickTime = 0;
        
        this.element = this.create();
    }
    
    create() {
        const container = document.createElement('div');
        container.className = 'slider-control';
        if (this.options.disabled) {
            container.classList.add('slider-control--disabled');
        }
        
        // Label (scrubbable)
        this.label = document.createElement('div');
        this.label.className = 'slider-control__label';
        this.label.textContent = this.options.label;
        this.label.style.width = `${this.options.labelWidth}px`;
        if (!this.options.disabled) {
            this.label.style.cursor = 'ew-resize';
            this.label.addEventListener('mousedown', (e) => this.handleLabelDragStart(e));
        }
        
        // Track container (holds track, fill, and thumb)
        const trackContainer = document.createElement('div');
        trackContainer.className = 'slider-control__track-container';
        
        // Track
        this.track = document.createElement('div');
        this.track.className = 'slider-control__track';
        
        // Fill (the filled portion of the track)
        this.fill = document.createElement('div');
        this.fill.className = 'slider-control__fill';
        
        // Thumb
        this.thumb = document.createElement('div');
        this.thumb.className = 'slider-control__thumb';
        this.thumb.tabIndex = this.options.disabled ? -1 : 0;
        
        this.track.appendChild(this.fill);
        this.track.appendChild(this.thumb);
        trackContainer.appendChild(this.track);
        
        // Input
        this.input = document.createElement('input');
        this.input.type = 'number';
        this.input.className = 'slider-control__input';
        this.input.value = this.value;
        this.input.min = this.options.min;
        this.input.max = this.options.max;
        this.input.step = this.options.step;
        this.input.style.width = `${this.options.inputWidth}px`;
        this.input.disabled = this.options.disabled;
        
        // Events for track/thumb dragging
        if (!this.options.disabled) {
            this.track.addEventListener('mousedown', (e) => this.handleTrackClick(e));
            this.thumb.addEventListener('mousedown', (e) => this.handleThumbMouseDown(e));
            this.thumb.addEventListener('dblclick', (e) => this.handleThumbDoubleClick(e));
            this.thumb.addEventListener('keydown', (e) => this.handleKeyDown(e));
        }
        
        // Events for input
        this.input.addEventListener('change', (e) => {
            this.setValue(parseFloat(e.target.value) || 0);
        });
        this.input.addEventListener('focus', () => {
            this.input.select();
        });
        
        container.appendChild(this.label);
        container.appendChild(trackContainer);
        container.appendChild(this.input);
        
        // Initial visual update
        this.updateVisuals();
        
        return container;
    }
    
    /**
     * Handle click on track to jump to position
     */
    handleTrackClick(e) {
        if (this.options.disabled) return;
        
        // Cache rect for both click and subsequent drag
        this.trackRect = this.track.getBoundingClientRect();
        
        // Ensure we have a valid width
        if (this.trackRect.width <= 0) return;
        
        const percent = Math.max(0, Math.min(1, (e.clientX - this.trackRect.left) / this.trackRect.width));
        const newValue = this.options.min + percent * (this.options.max - this.options.min);
        
        this.setValue(this.snapToStep(newValue));
        
        // Start dragging from click position (trackRect already cached)
        this.handleThumbDragStart(e);
    }
    
    /**
     * Handle thumb mousedown - checks for double-click timing
     */
    handleThumbMouseDown(e) {
        if (this.options.disabled) return;
        
        const now = Date.now();
        const timeSinceLastClick = now - this.lastClickTime;
        this.lastClickTime = now;
        
        // If this is a double-click (within 300ms), let dblclick handle it
        if (timeSinceLastClick < 300) {
            return;
        }
        
        // Otherwise, start drag
        this.handleThumbDragStart(e);
    }
    
    /**
     * Handle thumb double-click - reset to default value
     */
    handleThumbDoubleClick(e) {
        if (this.options.disabled) return;
        
        e.stopPropagation();
        e.preventDefault();
        
        // Reset to default value
        this.setValue(this.options.defaultValue);
        
        // Brief visual feedback - pulse animation
        this.thumb.classList.add('slider-control__thumb--reset');
        setTimeout(() => {
            this.thumb.classList.remove('slider-control__thumb--reset');
        }, 200);
    }
    
    /**
     * Handle thumb drag start
     */
    handleThumbDragStart(e) {
        if (this.options.disabled) return;
        
        e.stopPropagation();
        e.preventDefault(); // Prevent text selection during drag
        
        this.isDragging = true;
        // Cache the track rect at drag start to avoid layout thrashing
        this.trackRect = this.track.getBoundingClientRect();
        
        this.thumb.classList.add('slider-control__thumb--active');
        document.body.style.cursor = 'ew-resize';
        store.dispatch('UI_INTERACTION_START');
        
        const moveHandler = (e) => this.handleThumbDragMove(e);
        const upHandler = () => {
            this.isDragging = false;
            this.trackRect = null;
            this.thumb.classList.remove('slider-control__thumb--active');
            document.body.style.cursor = '';
            store.dispatch('UI_INTERACTION_END');
            window.removeEventListener('mousemove', moveHandler);
            window.removeEventListener('mouseup', upHandler);
        };
        
        window.addEventListener('mousemove', moveHandler);
        window.addEventListener('mouseup', upHandler);
    }
    
    /**
     * Handle thumb drag movement
     */
    handleThumbDragMove(e) {
        if (!this.isDragging || !this.trackRect) return;
        
        const rect = this.trackRect;
        // Ensure we have a valid width to avoid division by zero
        if (rect.width <= 0) return;
        
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const newValue = this.options.min + percent * (this.options.max - this.options.min);
        
        this.setValue(this.snapToStep(newValue));
    }
    
    /**
     * Handle label drag start (scrubbable label)
     */
    handleLabelDragStart(e) {
        if (this.options.disabled) return;
        
        this.isLabelDragging = true;
        this.startX = e.clientX;
        this.startValue = this.value;
        
        this.label.classList.add('slider-control__label--active');
        document.body.style.cursor = 'ew-resize';
        store.dispatch('UI_INTERACTION_START');
        
        const moveHandler = (e) => this.handleLabelDragMove(e);
        const upHandler = () => {
            this.isLabelDragging = false;
            this.label.classList.remove('slider-control__label--active');
            document.body.style.cursor = '';
            store.dispatch('UI_INTERACTION_END');
            window.removeEventListener('mousemove', moveHandler);
            window.removeEventListener('mouseup', upHandler);
        };
        
        window.addEventListener('mousemove', moveHandler);
        window.addEventListener('mouseup', upHandler);
    }
    
    /**
     * Handle label drag movement
     */
    handleLabelDragMove(e) {
        if (!this.isLabelDragging) return;
        
        const deltaX = e.clientX - this.startX;
        const step = e.shiftKey ? this.options.step * 10 : this.options.step;
        
        // Slower scrubbing for precision (1px = step)
        const newValue = this.startValue + deltaX * step * 0.5;
        
        this.setValue(this.snapToStep(newValue));
    }
    
    /**
     * Handle keyboard navigation
     */
    handleKeyDown(e) {
        if (this.options.disabled) return;
        
        let newValue = this.value;
        const bigStep = this.options.step * 10;
        
        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowUp':
                newValue = this.value + (e.shiftKey ? bigStep : this.options.step);
                e.preventDefault();
                break;
            case 'ArrowLeft':
            case 'ArrowDown':
                newValue = this.value - (e.shiftKey ? bigStep : this.options.step);
                e.preventDefault();
                break;
            case 'Home':
                newValue = this.options.min;
                e.preventDefault();
                break;
            case 'End':
                newValue = this.options.max;
                e.preventDefault();
                break;
            default:
                return;
        }
        
        this.setValue(newValue);
    }
    
    /**
     * Snap value to step
     */
    snapToStep(value) {
        const steps = Math.round((value - this.options.min) / this.options.step);
        return Math.max(this.options.min, Math.min(this.options.max, this.options.min + steps * this.options.step));
    }
    
    /**
     * Set value and trigger callback
     */
    setValue(newValue, triggerCallback = true) {
        const clampedValue = Math.max(this.options.min, Math.min(this.options.max, newValue));
        
        // Round to avoid floating point issues
        this.value = Math.round(clampedValue * 1000) / 1000;
        
        this.updateVisuals();
        
        if (triggerCallback) {
            this.options.onChange(this.value);
        }
    }
    
    /**
     * Get current value
     */
    getValue() {
        return this.value;
    }
    
    /**
     * Update visual representation
     */
    updateVisuals() {
        const range = this.options.max - this.options.min;
        const percent = ((this.value - this.options.min) / range) * 100;
        
        // Update thumb position
        this.thumb.style.left = `${percent}%`;
        
        // Update fill width (from center for bidirectional, from left otherwise)
        const hasNegative = this.options.min < 0 && this.options.max > 0;
        
        if (hasNegative) {
            // Bidirectional: fill from center
            const centerPercent = (0 - this.options.min) / range * 100;
            
            if (this.value >= 0) {
                this.fill.style.left = `${centerPercent}%`;
                this.fill.style.width = `${percent - centerPercent}%`;
            } else {
                this.fill.style.left = `${percent}%`;
                this.fill.style.width = `${centerPercent - percent}%`;
            }
        } else {
            // Unidirectional: fill from left
            this.fill.style.left = '0';
            this.fill.style.width = `${percent}%`;
        }
        
        // Update input
        this.input.value = this.value;
    }
    
    /**
     * Set disabled state
     */
    setDisabled(disabled) {
        this.options.disabled = disabled;
        this.element.classList.toggle('slider-control--disabled', disabled);
        this.input.disabled = disabled;
        this.thumb.tabIndex = disabled ? -1 : 0;
        this.label.style.cursor = disabled ? 'default' : 'ew-resize';
    }
    
    /**
     * Reset to default value
     */
    reset() {
        this.setValue(this.options.defaultValue);
    }
    
    /**
     * Set the default value (for reset)
     */
    setDefaultValue(defaultValue) {
        this.options.defaultValue = defaultValue;
    }
    
    /**
     * Destroy and cleanup
     */
    destroy() {
        this.element.remove();
    }
}
