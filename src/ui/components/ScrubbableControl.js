import { MathInput } from './MathInput.js';
import { store } from '../../core/Store.js';

export class ScrubbableControl {
    constructor(label, value, onChange, options = {}) {
        this.label = label;
        this.value = value;
        this.onChange = onChange;
        this.options = {
            min: -Infinity,
            max: Infinity,
            step: 1,
            ...options
        };
        
        this.isDragging = false;
        this.startX = 0;
        this.startValue = 0;

        this.element = this.create();
    }

    create() {
        const container = document.createElement('div');
        container.className = 'scrubbable-control-container';

        // Label (Scrubbable)
        const labelEl = document.createElement('div');
        labelEl.innerText = this.label;
        labelEl.className = 'scrubbable-control-label';
        
        // Drag Events
        labelEl.addEventListener('mousedown', (e) => this.handleDragStart(e));

        // Input
        this.input = new MathInput(this.value, (val) => {
            this.updateValue(val);
        });

        container.appendChild(labelEl);
        container.appendChild(this.input.element);

        this.labelEl = labelEl;

        return container;
    }

    handleDragStart(e) {
        this.isDragging = true;
        this.startX = e.clientX;
        this.startValue = this.value;
        
        document.body.style.cursor = 'ew-resize';
        store.dispatch('UI_INTERACTION_START');
        
        const moveHandler = (e) => this.handleDragMove(e);
        const upHandler = () => {
            this.isDragging = false;
            document.body.style.cursor = 'default';
            store.dispatch('UI_INTERACTION_END');
            window.removeEventListener('mousemove', moveHandler);
            window.removeEventListener('mouseup', upHandler);
        };

        window.addEventListener('mousemove', moveHandler);
        window.addEventListener('mouseup', upHandler);
    }

    handleDragMove(e) {
        if (!this.isDragging) return;
        
        const deltaX = e.clientX - this.startX;
        const step = e.shiftKey ? this.options.step * 10 : this.options.step;
        
        let newValue = this.startValue + deltaX * step;
        
        // Clamp
        newValue = Math.min(Math.max(newValue, this.options.min), this.options.max);
        
        this.updateValue(newValue);
    }

    updateValue(val) {
        this.value = val;
        this.input.setValue(val);
        this.onChange(val);
    }
}
