export class Dropdown {
    constructor(options = {}) {
        this.options = {
            options: [], // Array of { label, value }
            value: null,
            onChange: () => {},
            ...options
        };

        this.value = this.options.value;
        this.isOpen = false;
        this.element = this.create();
    }

    create() {
        const container = document.createElement('div');
        container.className = 'pi-input-group';
        container.style.position = 'relative';
        container.style.cursor = 'pointer';

        // Trigger (Display current value)
        this.trigger = document.createElement('div');
        this.trigger.className = 'pi-input';
        this.trigger.style.display = 'flex';
        this.trigger.style.alignItems = 'center';
        this.trigger.style.height = '100%';
        this.trigger.style.paddingRight = '20px'; // Space for arrow
        this.trigger.style.userSelect = 'none';
        
        this.updateTriggerText();

        // Arrow
        const arrow = document.createElement('div');
        arrow.innerHTML = `<svg width="8" height="4" viewBox="0 0 8 4" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 4L0 0H8L4 4Z" fill="currentColor"/></svg>`;
        arrow.style.color = 'var(--color-text-secondary)';
        arrow.style.position = 'absolute';
        arrow.style.right = '8px';
        arrow.style.top = '50%';
        arrow.style.transform = 'translateY(-50%)';
        arrow.style.pointerEvents = 'none';

        container.appendChild(this.trigger);
        container.appendChild(arrow);

        // Events
        container.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        return container;
    }

    updateTriggerText() {
        const selectedOption = this.options.options.find(o => o.value === this.value);
        this.trigger.textContent = selectedOption ? selectedOption.label : '';
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        if (this.isOpen) return;
        this.isOpen = true;

        // Create Menu
        this.menu = document.createElement('div');
        this.menu.style.position = 'fixed';
        this.menu.style.zIndex = '10000';
        this.menu.style.background = 'var(--color-bg-panel)';
        this.menu.style.border = '1px solid var(--color-border)';
        this.menu.style.borderRadius = 'var(--radius-sm)';
        this.menu.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
        this.menu.style.padding = '4px';
        this.menu.style.maxHeight = '200px';
        this.menu.style.overflowY = 'auto';
        
        // Position
        const rect = this.element.getBoundingClientRect();
        this.menu.style.top = (rect.bottom + 4) + 'px';
        this.menu.style.left = rect.left + 'px';
        this.menu.style.width = rect.width + 'px'; // Match width

        this.options.options.forEach(opt => {
            const item = document.createElement('div');
            item.textContent = opt.label;
            item.style.padding = '6px 8px';
            item.style.fontSize = 'var(--font-size-sm)';
            item.style.color = 'var(--color-text-primary)';
            item.style.cursor = 'pointer';
            item.style.borderRadius = '2px';
            item.style.fontFamily = 'var(--font-ui)';

            if (opt.value === this.value) {
                item.style.backgroundColor = 'var(--color-bg-active)';
                item.style.color = 'var(--color-accent)';
            }

            item.addEventListener('mouseenter', () => {
                if (opt.value !== this.value) {
                    item.style.backgroundColor = 'var(--color-bg-hover)';
                }
            });
            
            item.addEventListener('mouseleave', () => {
                if (opt.value !== this.value) {
                    item.style.backgroundColor = 'transparent';
                }
            });

            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this.setValue(opt.value);
                this.options.onChange(this.value);
                this.close();
            });

            this.menu.appendChild(item);
        });

        document.body.appendChild(this.menu);

        // Close on outside click
        this.handleOutsideClick = (e) => {
            if (!this.menu.contains(e.target) && !this.element.contains(e.target)) {
                this.close();
            }
        };
        
        // Close on scroll/resize to prevent floating menu
        this.handleScroll = () => this.close();

        document.addEventListener('mousedown', this.handleOutsideClick);
        window.addEventListener('scroll', this.handleScroll, true);
        window.addEventListener('resize', this.handleScroll);
    }

    close() {
        if (!this.isOpen) return;
        this.isOpen = false;
        if (this.menu) {
            this.menu.remove();
            this.menu = null;
        }
        document.removeEventListener('mousedown', this.handleOutsideClick);
        window.removeEventListener('scroll', this.handleScroll, true);
        window.removeEventListener('resize', this.handleScroll);
    }

    setValue(newValue) {
        this.value = newValue;
        this.updateTriggerText();
    }
    
    setOptions(newOptions) {
        this.options.options = newOptions;
        this.updateTriggerText();
    }
}
