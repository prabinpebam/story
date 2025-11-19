export class MathInput {
    constructor(value, onChange) {
        this.value = value;
        this.onChange = onChange;
        this.element = this.create();
    }

    create() {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = Math.round(this.value); // Display rounded for cleanliness
        input.className = 'math-input';
        
        // Styles
        input.style.width = '100%';
        input.style.background = 'transparent';
        input.style.border = 'none';
        input.style.color = 'var(--text-primary)';
        input.style.fontFamily = 'var(--font-mono)';
        input.style.fontSize = '11px';
        input.style.outline = 'none';
        input.style.padding = '2px 0';

        // Events
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.evaluateAndSubmit(input);
                input.blur();
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.increment(input, e.shiftKey ? 10 : 1);
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.increment(input, e.shiftKey ? -10 : -1);
            }
        });

        input.addEventListener('blur', () => {
            this.evaluateAndSubmit(input);
        });

        input.addEventListener('focus', () => {
            input.select();
        });

        return input;
    }

    increment(input, amount) {
        const current = parseFloat(input.value) || 0;
        const newValue = current + amount;
        input.value = newValue;
        this.onChange(newValue);
    }

    evaluateAndSubmit(input) {
        const raw = input.value;
        try {
            // Basic safety check: only allow numbers and math operators
            if (/^[0-9\.\+\-\*\/\(\)\s]+$/.test(raw)) {
                // Use Function constructor for safer eval than eval()
                // eslint-disable-next-line no-new-func
                const result = new Function(`return ${raw}`)();
                if (isFinite(result) && !isNaN(result)) {
                    input.value = Math.round(result * 100) / 100; // Round to 2 decimals
                    if (result !== this.value) {
                        this.value = result;
                        this.onChange(result);
                    }
                } else {
                    // Revert if invalid result
                    input.value = Math.round(this.value);
                }
            } else {
                // Revert if invalid chars
                input.value = Math.round(this.value);
            }
        } catch (e) {
            console.warn('Invalid math expression', e);
            input.value = Math.round(this.value);
        }
    }

    setValue(newValue) {
        this.value = newValue;
        if (document.activeElement !== this.element) {
            this.element.value = Math.round(newValue * 100) / 100;
        }
    }
}
