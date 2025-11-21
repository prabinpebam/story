export class Dropdown {
    constructor(options = {}) {
        this.options = {
            options: [], // Array of { label, value }
            value: null,
            onChange: () => {},
            ...options
        };

        this.value = this.options.value;
        this.element = this.create();
    }

    create() {
        const container = document.createElement('div');
        container.className = 'pi-input-group';
        container.style.position = 'relative';

        this.select = document.createElement('select');
        this.select.className = 'pi-input';
        this.select.style.appearance = 'none'; // Hide default arrow
        this.select.style.cursor = 'pointer';
        
        this.renderOptions();

        this.select.addEventListener('change', (e) => {
            this.value = e.target.value;
            this.options.onChange(this.value);
        });

        // Custom Arrow
        const arrow = document.createElement('div');
        arrow.innerHTML = `<svg width="8" height="4" viewBox="0 0 8 4" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 4L0 0H8L4 4Z" fill="#888888"/></svg>`;
        arrow.style.position = 'absolute';
        arrow.style.right = '8px';
        arrow.style.top = '50%';
        arrow.style.transform = 'translateY(-50%)';
        arrow.style.pointerEvents = 'none';

        container.appendChild(this.select);
        container.appendChild(arrow);

        return container;
    }

    renderOptions() {
        this.select.innerHTML = '';
        this.options.options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            if (opt.value === this.value) {
                option.selected = true;
            }
            this.select.appendChild(option);
        });
    }

    setValue(newValue) {
        this.value = newValue;
        this.select.value = newValue;
    }
    
    setOptions(newOptions) {
        this.options.options = newOptions;
        this.renderOptions();
    }
}
