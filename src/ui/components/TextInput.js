export class TextInput {
    constructor(options = {}) {
        this.options = {
            value: '',
            placeholder: '',
            mixed: false,
            mixedPlaceholder: 'Mixed',
            onChange: () => {},
            ...options
        };

        this.value = this.options.value;
        this.mixed = this.options.mixed;
        this.element = this.create();
    }

    create() {
        const container = document.createElement('div');
        container.className = 'pi-input-group';

        this.input = document.createElement('input');
        this.input.className = 'pi-input';
        this.input.type = 'text';
        this.updateDisplay();
        
        let initialValue = this.value;

        this.input.addEventListener('focus', () => {
            initialValue = this.value;
        });

        this.input.addEventListener('change', (e) => {
            this.value = e.target.value;
            this.options.onChange(this.value);
        });
        
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.input.blur();
                e.stopPropagation();
            } else if (e.key === 'Escape') {
                this.setValue(initialValue);
                this.options.onChange(initialValue);
                this.input.blur();
                e.stopPropagation();
            } else {
                e.stopPropagation(); // Stop global shortcuts while typing
            }
        });

        container.appendChild(this.input);
        return container;
    }

    setValue(newValue) {
        this.value = newValue;
        // Clear mixed state when setting a concrete value
        if (this.mixed) {
            this.mixed = false;
        }
        this.updateDisplay();
    }

    updateDisplay() {
        if (this.mixed) {
            this.input.value = '';
            this.input.placeholder = this.options.mixedPlaceholder;
            this.input.classList.add('mixed');
        } else {
            this.input.value = this.value;
            this.input.placeholder = this.options.placeholder;
            this.input.classList.remove('mixed');
        }
    }

    /**
     * Set mixed state for multi-selection with different values
     * @param {boolean} mixed
     */
    setMixed(mixed) {
        this.mixed = mixed;
        this.updateDisplay();
    }

    /**
     * Check if input is in mixed state
     * @returns {boolean}
     */
    isMixed() {
        return this.mixed;
    }
}
