export class Dropdown {
    constructor(options = {}) {
        this.options = {
            options: [], // Array of { label, value }
            value: null,
            placeholder: '', // Placeholder text when no value
            size: null, // Width variant: 'xs', 'sm', 'md', 'lg', 'xl', 'fill', 'auto', or null for default
            height: null, // Height variant: 'sm', 'lg', or null for default (md)
            mixed: false, // Multi-selection mixed value state
            mixedLabel: 'Mixed', // Label text for mixed state
            onChange: () => {},
            ...options
        };

        this.value = this.options.value;
        this.mixed = this.options.mixed;
        this.isOpen = false;
        this.element = this.create();
    }

    create() {
        const container = document.createElement('div');
        
        // Build class name with optional size and height variants
        let className = 'pi-input-group dropdown-container';
        if (this.options.size) {
            className += ` dropdown-${this.options.size}`;
        }
        if (this.options.height) {
            className += ` dropdown-height-${this.options.height}`;
        }
        container.className = className;

        // Trigger (Display current value)
        this.trigger = document.createElement('div');
        this.trigger.className = 'pi-input dropdown-trigger';
        
        this.updateTriggerText();

        // Arrow
        const arrow = document.createElement('div');
        arrow.className = 'dropdown-arrow';
        arrow.innerHTML = `<svg width="8" height="4" viewBox="0 0 8 4" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 4L0 0H8L4 4Z" fill="currentColor"/></svg>`;

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
        // Handle mixed state first
        if (this.mixed) {
            this.trigger.textContent = this.options.mixedLabel;
            this.trigger.classList.add('placeholder', 'mixed');
            return;
        }
        
        const selectedOption = this.options.options.find(o => o.value === this.value);
        if (selectedOption) {
            this.trigger.textContent = selectedOption.label;
            this.trigger.classList.remove('placeholder', 'mixed');
        } else if (this.options.placeholder) {
            this.trigger.textContent = this.options.placeholder;
            this.trigger.classList.add('placeholder');
            this.trigger.classList.remove('mixed');
        } else {
            this.trigger.textContent = '';
            this.trigger.classList.remove('placeholder', 'mixed');
        }
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

        // Create Menu using CSS class
        this.menu = document.createElement('div');
        this.menu.className = 'dropdown-menu';
        
        // Prevent clicks inside menu from triggering outside click handler
        this.menu.addEventListener('mousedown', (e) => e.stopPropagation());
        
        // Position
        const rect = this.element.getBoundingClientRect();
        this.menu.style.top = (rect.bottom + 4) + 'px';
        this.menu.style.left = rect.left + 'px';
        this.menu.style.width = rect.width + 'px'; // Match width

        this.options.options.forEach(opt => {
            // Handle divider
            if (opt.divider) {
                const divider = document.createElement('div');
                divider.className = 'dropdown-divider';
                this.menu.appendChild(divider);
                return;
            }
            
            const item = document.createElement('div');
            item.textContent = opt.label;
            item.className = 'dropdown-item' + 
                (opt.action ? ' action' : '') + 
                (opt.value === this.value && !opt.action ? ' selected' : '');

            item.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!opt.action) {
                    this.setValue(opt.value);
                }
                this.options.onChange(opt.value);
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
        
        // Close on scroll OUTSIDE the menu (not inside)
        this.handleScroll = (e) => {
            // Don't close if scrolling inside the menu
            if (this.menu && this.menu.contains(e.target)) {
                return;
            }
            this.close();
        };
        
        this.handleResize = () => this.close();

        // Use capture phase to ensure we receive the event before stopPropagation
        // can prevent it from bubbling (e.g., FillFlyout stops propagation)
        document.addEventListener('mousedown', this.handleOutsideClick, true);
        window.addEventListener('scroll', this.handleScroll, true);
        window.addEventListener('resize', this.handleResize);
    }

    close() {
        if (!this.isOpen) return;
        this.isOpen = false;
        if (this.menu) {
            this.menu.remove();
            this.menu = null;
        }
        // Must match the capture phase used in addEventListener
        document.removeEventListener('mousedown', this.handleOutsideClick, true);
        window.removeEventListener('scroll', this.handleScroll, true);
        window.removeEventListener('resize', this.handleResize);
    }

    setValue(newValue, triggerCallback = true) {
        this.value = newValue;
        // Clear mixed state when a concrete value is set
        if (this.mixed) {
            this.mixed = false;
        }
        this.updateTriggerText();
    }
    
    setOptions(newOptions) {
        this.options.options = newOptions;
        this.updateTriggerText();
    }

    /**
     * Set mixed state for multi-selection with different values
     * @param {boolean} mixed - Whether to show mixed state
     */
    setMixed(mixed) {
        this.mixed = mixed;
        this.updateTriggerText();
    }

    /**
     * Check if dropdown is in mixed state
     * @returns {boolean}
     */
    isMixed() {
        return this.mixed;
    }
}
