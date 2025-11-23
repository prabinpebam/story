import { store } from '../../core/Store.js';

export class NumberInput {
    constructor(options = {}) {
        this.options = {
            label: '',
            value: 0,
            min: -Infinity,
            max: Infinity,
            step: 1,
            precision: 2,
            units: '',
            scrubbable: false,
            onChange: () => {},
            ...options
        };

        this.value = this.options.value;
        this.element = this.create();
    }

    create() {
        const container = document.createElement('div');
        container.className = 'pi-input-group';

        if (this.options.label) {
            const label = document.createElement('div');
            label.className = 'pi-label';
            label.innerHTML = this.options.label;
            label.addEventListener('mousedown', (e) => this.handleScrubStart(e));
            container.appendChild(label);
        }

        this.input = document.createElement('input');
        this.input.className = 'pi-input';
        this.input.type = 'text';
        this.input.value = this.formatValue(this.value);
        
        if (this.options.scrubbable) {
            this.input.style.cursor = 'ew-resize';
            this.input.addEventListener('mousedown', (e) => this.handleInputMouseDown(e));
        }

        this.input.addEventListener('change', (e) => this.handleInputChange(e));
        this.input.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.input.addEventListener('focus', () => {
            this.initialValue = this.value; // Store initial value on focus
            if (!this.isScrubbing) this.input.select();
        });
        this.input.addEventListener('blur', () => this.handleBlur());

        container.appendChild(this.input);

        return container;
    }

    handleInputMouseDown(e) {
        if (e.button !== 0) return; // Only left click

        // If already focused, allow default text interaction (cursor placement, text selection)
        if (document.activeElement === this.input) return;

        // Prevent default to stop immediate focus/selection
        e.preventDefault();

        this.startX = e.clientX;
        this.startValue = this.value;
        this.initialValue = this.value; // Store for revert
        this.hasMoved = false;
        this.isScrubbing = false;

        const moveHandler = (e) => {
            if (!this.isScrubbing) {
                const deltaX = e.clientX - this.startX;
                if (Math.abs(deltaX) > 3) {
                    this.hasMoved = true;
                    this.isScrubbing = true;
                    
                    store.dispatch('UI_INTERACTION_START');
                    this.input.requestPointerLock();
                    
                    this.input.blur();
                }
            }

            if (this.isScrubbing) {
                this.handleScrubMove(e);
            }
        };

        const upHandler = () => {
            if (this.isScrubbing) {
                document.exitPointerLock();
                store.dispatch('UI_INTERACTION_END');
            }

            this.isScrubbing = false;
            window.removeEventListener('mousemove', moveHandler);
            window.removeEventListener('mouseup', upHandler);
            
            if (!this.hasMoved) {
                // Clicked without dragging: Focus (which triggers Select All via focus listener)
                this.input.focus();
            }
        };

        window.addEventListener('mousemove', moveHandler);
        window.addEventListener('mouseup', upHandler);
    }

    setValue(newValue, notify = true, isTransient = false) {
        let val = parseFloat(newValue);
        if (isNaN(val)) val = 0;
        
        val = Math.max(this.options.min, Math.min(this.options.max, val));
        
        // Round to precision
        const multiplier = Math.pow(10, this.options.precision);
        val = Math.round(val * multiplier) / multiplier;

        this.value = val;
        this.input.value = this.formatValue(val);

        if (notify && this.options.onChange) {
            this.options.onChange(this.value, isTransient);
        }
    }

    formatValue(val) {
        return val + (this.options.units ? this.options.units : '');
    }

    parseValue(str) {
        return parseFloat(str.replace(this.options.units, ''));
    }

    handleInputChange(e) {
        const val = this.parseValue(e.target.value);
        this.setValue(val);
    }

    handleBlur() {
        this.input.value = this.formatValue(this.value);
    }

    handleKeyDown(e) {
        if (e.key === 'Enter') {
            this.input.blur();
            e.stopPropagation();
            return;
        }

        if (e.key === 'Escape') {
            this.setValue(this.initialValue);
            this.input.blur();
            e.stopPropagation();
            return;
        }

        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            e.stopPropagation();
            const step = e.shiftKey ? this.options.step * 10 : this.options.step;
            const delta = e.key === 'ArrowUp' ? step : -step;
            this.setValue(this.value + delta);
        }
    }

    handleScrubStart(e) {
        this.isScrubbing = true;
        this.startX = e.clientX;
        this.startValue = this.value;
        this.initialValue = this.value;
        
        store.dispatch('UI_INTERACTION_START');
        this.input.requestPointerLock();
        
        const moveHandler = (e) => this.handleScrubMove(e);
        const upHandler = () => {
            document.exitPointerLock();
            
            // Final commit (not transient)
            // We do this before ending interaction so the PI doesn't re-render twice
            this.setValue(this.value, true, false);

            store.dispatch('UI_INTERACTION_END');
            
            this.isScrubbing = false;
            window.removeEventListener('mousemove', moveHandler);
            window.removeEventListener('mouseup', upHandler);
        };

        window.addEventListener('mousemove', moveHandler);
        window.addEventListener('mouseup', upHandler);
    }

    handleScrubMove(e) {
        if (!this.isScrubbing) return;
        
        const deltaX = e.movementX;
        const step = e.shiftKey ? this.options.step * 10 : (e.altKey ? this.options.step * 0.1 : this.options.step);
        
        const newValue = this.value + (deltaX * step);
        this.setValue(newValue, true, true);
    }
}
