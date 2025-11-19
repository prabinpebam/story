export class SegmentedControl {
    constructor(options, selectedValue, onChange) {
        this.options = options; // Array of { label: string, value: any }
        this.selectedValue = selectedValue;
        this.onChange = onChange;
        this.element = this.create();
    }

    create() {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.border = '1px solid var(--border-color)';
        container.style.borderRadius = '2px';
        container.style.overflow = 'hidden';
        container.style.marginBottom = '8px';
        container.style.width = '100%';

        this.options.forEach((opt, index) => {
            const btn = document.createElement('div');
            btn.innerText = opt.label;
            btn.style.flex = '1';
            btn.style.textAlign = 'center';
            btn.style.padding = '4px 0';
            btn.style.fontSize = '11px';
            btn.style.cursor = 'pointer';
            btn.style.fontFamily = 'var(--font-mono)';
            btn.style.transition = 'background-color 0.1s ease';
            
            // Border between items
            if (index < this.options.length - 1) {
                btn.style.borderRight = '1px solid var(--border-color)';
            }

            const updateState = () => {
                if (this.selectedValue === opt.value) {
                    btn.style.backgroundColor = 'var(--text-primary)';
                    btn.style.color = 'var(--bg-app)';
                } else {
                    btn.style.backgroundColor = 'transparent';
                    btn.style.color = 'var(--text-primary)';
                }
            };

            updateState();

            btn.addEventListener('click', () => {
                this.selectedValue = opt.value;
                // Update all buttons
                Array.from(container.children).forEach((child, i) => {
                    const option = this.options[i];
                    if (this.selectedValue === option.value) {
                        child.style.backgroundColor = 'var(--text-primary)';
                        child.style.color = 'var(--bg-app)';
                    } else {
                        child.style.backgroundColor = 'transparent';
                        child.style.color = 'var(--text-primary)';
                    }
                });
                
                if (this.onChange) this.onChange(this.selectedValue);
            });

            container.appendChild(btn);
        });

        return container;
    }
}
