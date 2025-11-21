export class TextInput {
    constructor(options = {}) {
        this.options = {
            value: '',
            placeholder: '',
            onChange: () => {},
            ...options
        };

        this.value = this.options.value;
        this.element = this.create();
    }

    create() {
        const container = document.createElement('div');
        container.className = 'pi-input-group';

        this.input = document.createElement('input');
        this.input.className = 'pi-input';
        this.input.type = 'text';
        this.input.value = this.value;
        this.input.placeholder = this.options.placeholder;
        
        this.input.addEventListener('change', (e) => {
            this.value = e.target.value;
            this.options.onChange(this.value);
        });
        
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.input.blur();
            }
        });

        container.appendChild(this.input);
        return container;
    }

    setValue(newValue) {
        this.value = newValue;
        this.input.value = newValue;
    }
}
