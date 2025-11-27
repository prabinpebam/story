export class SegmentedControl {
    constructor(optionsOrConfig, selectedValue, onChange) {
        if (Array.isArray(optionsOrConfig)) {
            // Legacy positional arguments
            this.options = optionsOrConfig;
            this.selectedValue = selectedValue;
            this.onChange = onChange;
        } else {
            // Config object pattern
            const config = optionsOrConfig || {};
            this.options = config.options || [];
            this.selectedValue = config.value;
            this.onChange = config.onChange;
        }
        
        this.element = this.create();
    }

    create() {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.border = '1px solid var(--color-border)';
        container.style.borderRadius = '2px';
        container.style.overflow = 'hidden';
        container.style.width = '100%';

        this.options.forEach((opt, index) => {
            const btn = document.createElement('div');
            if (opt.icon) {
                // Check if it's an SVG string or HTML tag
                if (opt.icon.trim().startsWith('<')) {
                    btn.innerHTML = opt.icon;
                } else {
                    // Assume FontAwesome class name
                    btn.innerHTML = `<i class="fa-solid ${opt.icon}"></i>`;
                }
                btn.title = opt.label; // Tooltip
            } else {
                btn.innerText = opt.label;
            }
            
            btn.style.flex = '1';
            btn.style.display = 'flex';
            btn.style.alignItems = 'center';
            btn.style.justifyContent = 'center';
            btn.style.padding = '4px 8px';
            btn.style.fontSize = '11px';
            btn.style.cursor = 'pointer';
            btn.style.fontFamily = 'var(--font-mono)';
            btn.style.transition = 'background-color 0.1s ease';
            
            // Border between items
            if (index < this.options.length - 1) {
                btn.style.borderRight = '1px solid var(--color-border)';
            }

            const updateState = () => {
                if (this.selectedValue === opt.value) {
                    btn.style.backgroundColor = 'var(--color-accent)';
                    btn.style.color = 'var(--color-text-on-accent)';
                } else {
                    btn.style.backgroundColor = 'transparent';
                    btn.style.color = 'var(--color-text-primary)';
                }
            };

            updateState();

            btn.addEventListener('click', () => {
                this.selectedValue = opt.value;
                // Update all buttons
                Array.from(container.children).forEach((child, i) => {
                    const option = this.options[i];
                    if (this.selectedValue === option.value) {
                        child.style.backgroundColor = 'var(--color-accent)';
                        child.style.color = 'var(--color-text-on-accent)';
                    } else {
                        child.style.backgroundColor = 'transparent';
                        child.style.color = 'var(--color-text-primary)';
                    }
                });
                
                if (this.onChange) this.onChange(this.selectedValue);
            });

            container.appendChild(btn);
        });

        return container;
    }
}
