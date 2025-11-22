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
        
        this.input.addEventListener('change', (e) => this.handleInputChange(e));
        this.input.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.input.addEventListener('focus', () => this.input.select());
        this.input.addEventListener('blur', () => this.handleBlur());

        container.appendChild(this.input);

        return container;
    }

    setValue(newValue, notify = true) {
        let val = parseFloat(newValue);
        if (isNaN(val)) val = 0;
        
        val = Math.max(this.options.min, Math.min(this.options.max, val));
        
        // Round to precision
        const multiplier = Math.pow(10, this.options.precision);
        val = Math.round(val * multiplier) / multiplier;

        this.value = val;
        this.input.value = this.formatValue(val);

        if (notify && this.options.onChange) {
            this.options.onChange(this.value);
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
            return;
        }

        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const step = e.shiftKey ? this.options.step * 10 : this.options.step;
            const delta = e.key === 'ArrowUp' ? step : -step;
            this.setValue(this.value + delta);
        }
    }

    handleScrubStart(e) {
        this.isScrubbing = true;
        this.startX = e.clientX;
        this.startValue = this.value;
        
        document.body.style.cursor = 'ew-resize';
        
        const moveHandler = (e) => this.handleScrubMove(e);
        const upHandler = () => {
            this.isScrubbing = false;
            document.body.style.cursor = '';
            window.removeEventListener('mousemove', moveHandler);
            window.removeEventListener('mouseup', upHandler);
        };

        window.addEventListener('mousemove', moveHandler);
        window.addEventListener('mouseup', upHandler);
    }

    handleScrubMove(e) {
        if (!this.isScrubbing) return;
        const deltaX = e.clientX - this.startX;
        const step = e.shiftKey ? this.options.step * 10 : this.options.step; // Faster scrub with shift? Or maybe slower with Alt? Standard is usually Shift=Fast.
        
        // Sensitivity: 1px = 1 step
        const deltaValue = deltaX * step; 
        this.setValue(this.startValue + deltaValue);
    }
}
