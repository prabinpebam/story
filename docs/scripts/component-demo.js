/**
 * Component Demo System
 * 
 * Renders interactive Story components directly in documentation pages.
 * Components are rendered with live mock data and full interactivity.
 * 
 * This module uses self-contained component implementations that don't 
 * depend on the application's Store or other complex dependencies.
 */

// =============================================================================
// COMPONENT IMPLEMENTATIONS (Self-contained, no external dependencies)
// =============================================================================

/**
 * Button Component
 */
class Button {
    constructor(options = {}) {
        this.options = {
            label: '',
            icon: '',
            iconPosition: 'left',
            variant: 'secondary',
            size: 'md',
            fullWidth: false,
            disabled: false,
            loading: false,
            active: false,
            title: '',
            onClick: null,
            ...options
        };
        this.element = this.render();
    }
    
    render() {
        const btn = document.createElement('button');
        btn.type = 'button';
        
        // Build classes
        const classes = ['btn', `btn--${this.options.variant}`, `btn--${this.options.size}`];
        if (this.options.fullWidth) classes.push('btn--full');
        if (this.options.disabled) classes.push('btn--disabled');
        if (this.options.loading) classes.push('btn--loading');
        if (this.options.active) classes.push('btn--active');
        if (this.options.icon && !this.options.label) classes.push('btn--icon-only');
        btn.className = classes.join(' ');
        
        if (this.options.disabled) btn.disabled = true;
        if (this.options.title) btn.title = this.options.title;
        if (this.options.title && !this.options.label) {
            btn.setAttribute('aria-label', this.options.title);
        }
        
        // Loading spinner
        if (this.options.loading) {
            const spinner = document.createElement('span');
            spinner.className = 'btn__spinner';
            btn.appendChild(spinner);
        }
        
        // Icon (left)
        if (this.options.icon && this.options.iconPosition === 'left') {
            const iconEl = document.createElement('span');
            iconEl.className = 'btn__icon';
            iconEl.innerHTML = this.options.icon;
            btn.appendChild(iconEl);
        }
        
        // Label
        if (this.options.label) {
            const labelEl = document.createElement('span');
            labelEl.className = 'btn__label';
            labelEl.textContent = this.options.label;
            btn.appendChild(labelEl);
        }
        
        // Icon (right)
        if (this.options.icon && this.options.iconPosition === 'right') {
            const iconEl = document.createElement('span');
            iconEl.className = 'btn__icon';
            iconEl.innerHTML = this.options.icon;
            btn.appendChild(iconEl);
        }
        
        if (this.options.onClick) {
            btn.addEventListener('click', (e) => {
                if (!this.options.disabled && !this.options.loading) {
                    this.options.onClick(e);
                }
            });
        }
        
        return btn;
    }
    
    setActive(active) {
        this.options.active = active;
        this.element.classList.toggle('btn--active', active);
    }
}

/**
 * Switch Component
 */
class Switch {
    constructor(label, initialValue, onChange) {
        this.label = label;
        this.value = initialValue;
        this.onChange = onChange;
        this.element = this.create();
    }
    
    create() {
        const container = document.createElement('div');
        container.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;';
        container.addEventListener('click', (e) => e.stopPropagation());

        if (this.label) {
            const labelEl = document.createElement('div');
            labelEl.textContent = this.label;
            labelEl.style.cssText = 'font-size:11px;color:var(--color-text-secondary);';
            container.appendChild(labelEl);
        }

        const track = document.createElement('div');
        track.style.cssText = `width:32px;height:16px;background:${this.value ? 'var(--color-accent)' : 'var(--color-border)'};border-radius:8px;position:relative;cursor:pointer;transition:background-color 0.2s ease;`;

        const thumb = document.createElement('div');
        thumb.style.cssText = `width:12px;height:12px;background:white;border-radius:50%;position:absolute;top:2px;left:${this.value ? '18px' : '2px'};transition:left 0.2s cubic-bezier(0.2, 0.0, 0.2, 1);box-shadow:0 1px 2px var(--color-shadow);`;

        track.appendChild(thumb);
        container.appendChild(track);

        track.addEventListener('click', (e) => {
            e.stopPropagation();
            this.value = !this.value;
            track.style.backgroundColor = this.value ? 'var(--color-accent)' : 'var(--color-border)';
            thumb.style.left = this.value ? '18px' : '2px';
            if (this.onChange) this.onChange(this.value);
        });

        return container;
    }
}

/**
 * NumberInput Component (with scrubbing support)
 */
class NumberInput {
    constructor(options = {}) {
        this.options = {
            label: '',
            value: 0,
            min: -Infinity,
            max: Infinity,
            step: 1,
            precision: 2,
            units: '',
            scrubbable: false,
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
            if (this.options.scrubbable) {
                label.style.cursor = 'ew-resize';
                this.setupScrubbing(label);
            }
            container.appendChild(label);
        }

        this.input = document.createElement('input');
        this.input.className = 'pi-input';
        this.input.type = 'text';
        this.input.value = this.formatValue(this.value);

        this.input.addEventListener('change', (e) => this.handleInputChange(e));
        this.input.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.input.addEventListener('focus', () => {
            this.initialValue = this.value;
            this.input.select();
        });
        this.input.addEventListener('blur', () => this.handleBlur());

        container.appendChild(this.input);
        return container;
    }

    setupScrubbing(label) {
        let startX, startValue, isDragging = false;

        label.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            startX = e.clientX;
            startValue = this.value;
            isDragging = false;

            const move = (e) => {
                const deltaX = e.clientX - startX;
                if (Math.abs(deltaX) > 3) isDragging = true;
                if (isDragging) {
                    const step = e.shiftKey ? this.options.step * 10 : (e.altKey ? this.options.step * 0.1 : this.options.step);
                    this.setValue(startValue + deltaX * step, true, true);
                }
            };

            const up = () => {
                if (isDragging) {
                    this.options.onChange(this.value, false);
                }
                window.removeEventListener('mousemove', move);
                window.removeEventListener('mouseup', up);
            };

            window.addEventListener('mousemove', move);
            window.addEventListener('mouseup', up);
        });
    }

    setValue(newValue, notify = true, isTransient = false) {
        let val = parseFloat(newValue);
        if (isNaN(val)) val = 0;
        val = Math.max(this.options.min, Math.min(this.options.max, val));
        const multiplier = Math.pow(10, this.options.precision);
        val = Math.round(val * multiplier) / multiplier;
        this.value = val;
        this.input.value = this.formatValue(val);
        if (notify && this.options.onChange) {
            this.options.onChange(this.value, isTransient);
        }
    }

    formatValue(val) {
        return val + (this.options.units ? this.options.units : '');
    }

    handleInputChange(e) {
        const val = parseFloat(e.target.value.replace(this.options.units, ''));
        this.setValue(val);
    }

    handleBlur() {
        this.input.value = this.formatValue(this.value);
    }

    handleKeyDown(e) {
        if (e.key === 'Enter') {
            this.input.blur();
            e.stopPropagation();
            return;
        }
        if (e.key === 'Escape') {
            this.setValue(this.initialValue);
            this.input.blur();
            e.stopPropagation();
            return;
        }
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const step = e.shiftKey ? this.options.step * 10 : this.options.step;
            const delta = e.key === 'ArrowUp' ? step : -step;
            this.setValue(this.value + delta);
        }
    }

    setDisabled(disabled) {
        this.input.disabled = disabled;
        this.element.style.opacity = disabled ? '0.5' : '1';
    }
}

/**
 * TextInput Component
 */
class TextInput {
    constructor(options = {}) {
        this.options = { value: '', placeholder: '', onChange: () => {}, ...options };
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
        
        let initialValue = this.value;
        this.input.addEventListener('focus', () => { initialValue = this.value; });
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
                this.input.blur();
                e.stopPropagation();
            }
        });
        
        container.appendChild(this.input);
        return container;
    }
    
    setValue(val) {
        this.value = val;
        this.input.value = val;
    }
}

/**
 * Dropdown Component
 */
class Dropdown {
    constructor(options = {}) {
        this.options = { options: [], value: null, placeholder: '', onChange: () => {}, ...options };
        this.value = this.options.value;
        this.isOpen = false;
        this.element = this.create();
    }
    
    create() {
        const container = document.createElement('div');
        container.className = 'pi-input-group dropdown-container';
        
        this.trigger = document.createElement('div');
        this.trigger.className = 'pi-input dropdown-trigger';
        this.updateTriggerText();

        const arrow = document.createElement('div');
        arrow.className = 'dropdown-arrow';
        arrow.innerHTML = `<svg width="8" height="4" viewBox="0 0 8 4"><path d="M4 4L0 0H8L4 4Z" fill="currentColor"/></svg>`;

        container.appendChild(this.trigger);
        container.appendChild(arrow);
        container.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        return container;
    }
    
    updateTriggerText() {
        const selected = this.options.options.find(o => o.value === this.value);
        if (selected) {
            this.trigger.textContent = selected.label;
            this.trigger.classList.remove('placeholder');
        } else if (this.options.placeholder) {
            this.trigger.textContent = this.options.placeholder;
            this.trigger.classList.add('placeholder');
        }
    }
    
    toggle() {
        this.isOpen ? this.close() : this.open();
    }
    
    open() {
        if (this.isOpen) return;
        this.isOpen = true;
        
        this.menu = document.createElement('div');
        this.menu.className = 'dropdown-menu';
        const rect = this.element.getBoundingClientRect();
        this.menu.style.cssText = `top:${rect.bottom + 4}px;left:${rect.left}px;width:${rect.width}px;`;
        this.menu.addEventListener('mousedown', (e) => e.stopPropagation());
        
        this.options.options.forEach(opt => {
            if (opt.divider) {
                const divider = document.createElement('div');
                divider.className = 'dropdown-divider';
                this.menu.appendChild(divider);
                return;
            }
            
            const item = document.createElement('div');
            item.className = 'dropdown-item' + (opt.value === this.value ? ' selected' : '');
            item.textContent = opt.label;
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this.setValue(opt.value);
                this.options.onChange(opt.value);
                this.close();
            });
            this.menu.appendChild(item);
        });

        document.body.appendChild(this.menu);
        
        this.handleOutsideClick = (e) => {
            if (!this.menu.contains(e.target) && !this.element.contains(e.target)) {
                this.close();
            }
        };
        document.addEventListener('mousedown', this.handleOutsideClick, true);
    }
    
    close() {
        if (!this.isOpen) return;
        this.isOpen = false;
        if (this.menu) this.menu.remove();
        document.removeEventListener('mousedown', this.handleOutsideClick, true);
    }
    
    setValue(val) {
        this.value = val;
        this.updateTriggerText();
    }
}

/**
 * SegmentedControl Component
 */
class SegmentedControl {
    constructor(optionsOrConfig, selectedValue, onChange) {
        if (Array.isArray(optionsOrConfig)) {
            this.options = optionsOrConfig;
            this.selectedValue = selectedValue;
            this.onChange = onChange;
        } else {
            const config = optionsOrConfig || {};
            this.options = config.options || [];
            this.selectedValue = config.value;
            this.onChange = config.onChange;
        }
        this.element = this.create();
    }
    
    create() {
        const container = document.createElement('div');
        container.style.cssText = 'display:flex;border:1px solid var(--color-border);border-radius:2px;overflow:hidden;width:100%;';

        this.options.forEach((opt, index) => {
            const btn = document.createElement('div');
            if (opt.icon) {
                btn.innerHTML = opt.icon.trim().startsWith('<') ? opt.icon : `<i class="fa-solid ${opt.icon}"></i>`;
                btn.title = opt.label;
            } else {
                btn.textContent = opt.label;
            }
            btn.style.cssText = `flex:1;display:flex;align-items:center;justify-content:center;padding:4px 8px;font-size:11px;cursor:pointer;transition:background-color 0.1s ease;font-family:var(--font-mono);`;
            if (index < this.options.length - 1) btn.style.borderRight = '1px solid var(--color-border)';
            
            this.updateButtonStyle(btn, this.selectedValue === opt.value);

            btn.addEventListener('click', () => {
                this.selectedValue = opt.value;
                Array.from(container.children).forEach((child, i) => {
                    this.updateButtonStyle(child, this.selectedValue === this.options[i].value);
                });
                if (this.onChange) this.onChange(this.selectedValue);
            });

            container.appendChild(btn);
        });

        return container;
    }
    
    updateButtonStyle(btn, isSelected) {
        btn.style.backgroundColor = isSelected ? 'var(--color-accent)' : 'transparent';
        btn.style.color = isSelected ? 'var(--color-text-on-accent)' : 'var(--color-text-primary)';
    }
}

/**
 * SliderControl Component
 */
class SliderControl {
    constructor(options = {}) {
        this.options = {
            label: 'Value',
            value: 0,
            min: -100,
            max: 100,
            step: 1,
            unit: '',
            labelWidth: 80,
            inputWidth: 48,
            onChange: () => {},
            disabled: false,
            ...options
        };
        this.value = this.options.value;
        this.element = this.create();
    }

    create() {
        const container = document.createElement('div');
        container.className = 'slider-control';

        // Label
        this.label = document.createElement('div');
        this.label.className = 'slider-control__label';
        this.label.textContent = this.options.label;
        this.label.style.width = `${this.options.labelWidth}px`;
        this.label.style.cursor = 'ew-resize';
        this.setupLabelScrubbing();

        // Track container
        const trackContainer = document.createElement('div');
        trackContainer.className = 'slider-control__track-container';

        this.track = document.createElement('div');
        this.track.className = 'slider-control__track';

        this.fill = document.createElement('div');
        this.fill.className = 'slider-control__fill';

        this.thumb = document.createElement('div');
        this.thumb.className = 'slider-control__thumb';
        this.thumb.tabIndex = 0;

        this.track.appendChild(this.fill);
        this.track.appendChild(this.thumb);
        trackContainer.appendChild(this.track);

        // Input
        this.input = document.createElement('input');
        this.input.type = 'number';
        this.input.className = 'slider-control__input';
        this.input.value = this.value;
        this.input.min = this.options.min;
        this.input.max = this.options.max;
        this.input.step = this.options.step;
        this.input.style.width = `${this.options.inputWidth}px`;

        // Events
        this.track.addEventListener('mousedown', (e) => this.handleTrackClick(e));
        this.thumb.addEventListener('mousedown', (e) => this.handleThumbDrag(e));
        this.input.addEventListener('change', (e) => {
            this.setValue(parseFloat(e.target.value) || 0);
        });
        this.input.addEventListener('focus', () => this.input.select());

        container.appendChild(this.label);
        container.appendChild(trackContainer);
        container.appendChild(this.input);

        this.updateVisuals();
        return container;
    }

    setupLabelScrubbing() {
        let startX, startValue;

        this.label.addEventListener('mousedown', (e) => {
            startX = e.clientX;
            startValue = this.value;
            this.label.classList.add('slider-control__label--active');

            const move = (e) => {
                const deltaX = e.clientX - startX;
                const step = e.shiftKey ? this.options.step * 10 : this.options.step;
                this.setValue(this.snapToStep(startValue + deltaX * step * 0.5));
            };

            const up = () => {
                this.label.classList.remove('slider-control__label--active');
                window.removeEventListener('mousemove', move);
                window.removeEventListener('mouseup', up);
            };

            window.addEventListener('mousemove', move);
            window.addEventListener('mouseup', up);
        });
    }

    handleTrackClick(e) {
        this.trackRect = this.track.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - this.trackRect.left) / this.trackRect.width));
        const newValue = this.options.min + percent * (this.options.max - this.options.min);
        this.setValue(this.snapToStep(newValue));
        this.handleThumbDrag(e);
    }

    handleThumbDrag(e) {
        e.stopPropagation();
        e.preventDefault();
        this.trackRect = this.track.getBoundingClientRect();
        this.thumb.classList.add('slider-control__thumb--active');

        const move = (e) => {
            const percent = Math.max(0, Math.min(1, (e.clientX - this.trackRect.left) / this.trackRect.width));
            const newValue = this.options.min + percent * (this.options.max - this.options.min);
            this.setValue(this.snapToStep(newValue));
        };

        const up = () => {
            this.thumb.classList.remove('slider-control__thumb--active');
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', up);
        };

        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
    }

    snapToStep(value) {
        const steps = Math.round((value - this.options.min) / this.options.step);
        return Math.max(this.options.min, Math.min(this.options.max, this.options.min + steps * this.options.step));
    }

    setValue(newValue, triggerCallback = true) {
        this.value = Math.max(this.options.min, Math.min(this.options.max, newValue));
        this.value = Math.round(this.value * 1000) / 1000;
        this.updateVisuals();
        if (triggerCallback) this.options.onChange(this.value);
    }

    updateVisuals() {
        const range = this.options.max - this.options.min;
        const percent = ((this.value - this.options.min) / range) * 100;
        this.thumb.style.left = `${percent}%`;
        
        const hasNegative = this.options.min < 0 && this.options.max > 0;
        if (hasNegative) {
            const centerPercent = (0 - this.options.min) / range * 100;
            if (this.value >= 0) {
                this.fill.style.left = `${centerPercent}%`;
                this.fill.style.width = `${percent - centerPercent}%`;
            } else {
                this.fill.style.left = `${percent}%`;
                this.fill.style.width = `${centerPercent - percent}%`;
            }
        } else {
            this.fill.style.left = '0';
            this.fill.style.width = `${percent}%`;
        }
        this.input.value = this.value;
    }
}

/**
 * Component Demo Registry
 * Maps demo IDs to component configurations
 */
const COMPONENT_DEMOS = {
    // =========================================================================
    // BUTTON DEMOS
    // =========================================================================
    'button-variants': {
        title: 'Button Variants',
        description: 'The four button variants for different use cases.',
        render: (container) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'demo-button-row';
            
            const variants = [
                { variant: 'primary', label: 'Primary' },
                { variant: 'secondary', label: 'Secondary' },
                { variant: 'text', label: 'Text' },
                { variant: 'danger', label: 'Danger' }
            ];
            
            variants.forEach(({ variant, label }) => {
                const btn = new Button({
                    label,
                    variant,
                    size: 'md',
                    onClick: () => showToast(`${label} button clicked!`)
                });
                wrapper.appendChild(btn.element);
            });
            
            container.appendChild(wrapper);
        }
    },
    
    'button-sizes': {
        title: 'Button Sizes',
        description: 'Four size options from extra-small to large.',
        render: (container) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'demo-button-row demo-button-row--align-center';
            
            const sizes = [
                { size: 'xs', label: 'XS (24px)' },
                { size: 'sm', label: 'SM (28px)' },
                { size: 'md', label: 'MD (32px)' },
                { size: 'lg', label: 'LG (40px)' }
            ];
            
            sizes.forEach(({ size, label }) => {
                const btn = new Button({
                    label,
                    variant: 'secondary',
                    size,
                    onClick: () => showToast(`${size.toUpperCase()} button clicked!`)
                });
                wrapper.appendChild(btn.element);
            });
            
            container.appendChild(wrapper);
        }
    },
    
    'button-with-icons': {
        title: 'Buttons with Icons',
        description: 'Buttons can include icons on either side.',
        render: (container) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'demo-button-row';
            
            // Save icon SVG
            const saveIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M13 1H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2zM8 13a2 2 0 1 1 0-4 2 2 0 0 1 0 4zM11 6H5V3h6v3z"/></svg>`;
            const plusIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="2" fill="none"/></svg>`;
            const arrowIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M6 12l4-4-4-4" stroke="currentColor" stroke-width="2" fill="none"/></svg>`;
            
            const btn1 = new Button({
                label: 'Save',
                icon: saveIcon,
                variant: 'primary',
                onClick: () => showToast('Save clicked!')
            });
            
            const btn2 = new Button({
                label: 'Add Item',
                icon: plusIcon,
                variant: 'secondary',
                onClick: () => showToast('Add clicked!')
            });
            
            const btn3 = new Button({
                label: 'Continue',
                icon: arrowIcon,
                iconPosition: 'right',
                variant: 'primary',
                onClick: () => showToast('Continue clicked!')
            });
            
            wrapper.appendChild(btn1.element);
            wrapper.appendChild(btn2.element);
            wrapper.appendChild(btn3.element);
            container.appendChild(wrapper);
        }
    },
    
    'button-icon-only': {
        title: 'Icon-Only Buttons',
        description: 'Compact buttons with only icons for toolbars.',
        render: (container) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'demo-button-row';
            
            const icons = {
                bold: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2h5a3 3 0 0 1 2.1 5.1A3.5 3.5 0 0 1 9.5 14H4V2zm2 5h3a1 1 0 1 0 0-2H6v2zm0 5h3.5a1.5 1.5 0 1 0 0-3H6v3z"/></svg>`,
                italic: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M6 2h6M4 14h6M10 2L6 14" stroke="currentColor" stroke-width="2" fill="none"/></svg>`,
                underline: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2v6a4 4 0 0 0 8 0V2M2 14h12" stroke="currentColor" stroke-width="2" fill="none"/></svg>`,
                alignLeft: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h12M2 7h8M2 11h10M2 15h6" stroke="currentColor" stroke-width="2" fill="none"/></svg>`
            };
            
            Object.entries(icons).forEach(([name, svg]) => {
                const btn = new Button({
                    icon: svg,
                    variant: 'text',
                    size: 'sm',
                    title: name.charAt(0).toUpperCase() + name.slice(1),
                    onClick: () => showToast(`${name} toggled!`)
                });
                wrapper.appendChild(btn.element);
            });
            
            container.appendChild(wrapper);
        }
    },
    
    'button-states': {
        title: 'Button States',
        description: 'Different button states including disabled, loading, and active.',
        render: (container) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'demo-button-row';
            
            const normalBtn = new Button({
                label: 'Normal',
                variant: 'secondary',
                onClick: () => showToast('Normal clicked!')
            });
            
            const disabledBtn = new Button({
                label: 'Disabled',
                variant: 'secondary',
                disabled: true
            });
            
            const loadingBtn = new Button({
                label: 'Loading',
                variant: 'primary',
                loading: true
            });
            
            const activeBtn = new Button({
                label: 'Active',
                variant: 'secondary',
                active: true,
                onClick: () => showToast('Active clicked!')
            });
            
            wrapper.appendChild(normalBtn.element);
            wrapper.appendChild(disabledBtn.element);
            wrapper.appendChild(loadingBtn.element);
            wrapper.appendChild(activeBtn.element);
            container.appendChild(wrapper);
        }
    },
    
    // =========================================================================
    // INPUT DEMOS
    // =========================================================================
    'number-input-basic': {
        title: 'Number Input',
        description: 'Click the label and drag horizontally to scrub the value. Use arrow keys for fine control.',
        render: (container) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'demo-input-grid';
            
            const posX = new NumberInput({
                label: 'X',
                value: 100,
                min: 0,
                max: 1920,
                step: 1,
                units: 'px',
                scrubbable: true,
                onChange: (val, transient) => {
                    if (!transient) showToast(`X set to ${val}px`);
                }
            });
            
            const posY = new NumberInput({
                label: 'Y',
                value: 50,
                min: 0,
                max: 1080,
                step: 1,
                units: 'px',
                scrubbable: true,
                onChange: (val, transient) => {
                    if (!transient) showToast(`Y set to ${val}px`);
                }
            });
            
            const rotation = new NumberInput({
                label: 'Rotation',
                value: 45,
                min: -360,
                max: 360,
                step: 1,
                units: '°',
                scrubbable: true,
                onChange: (val, transient) => {
                    if (!transient) showToast(`Rotation set to ${val}°`);
                }
            });
            
            const opacity = new NumberInput({
                label: 'Opacity',
                value: 100,
                min: 0,
                max: 100,
                step: 1,
                units: '%',
                scrubbable: true,
                onChange: (val, transient) => {
                    if (!transient) showToast(`Opacity set to ${val}%`);
                }
            });
            
            wrapper.appendChild(posX.element);
            wrapper.appendChild(posY.element);
            wrapper.appendChild(rotation.element);
            wrapper.appendChild(opacity.element);
            container.appendChild(wrapper);
        }
    },
    
    'text-input-basic': {
        title: 'Text Input',
        description: 'Standard text input with label.',
        render: (container) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'demo-input-grid';
            
            // Name input with label wrapper
            const nameGroup = document.createElement('div');
            nameGroup.className = 'pi-input-group';
            const nameLabel = document.createElement('div');
            nameLabel.className = 'pi-label';
            nameLabel.textContent = 'Name';
            nameLabel.style.cursor = 'default';
            const nameInput = new TextInput({
                value: 'My Shape',
                placeholder: 'Enter name...',
                onChange: (val) => showToast(`Name: ${val}`)
            });
            nameGroup.appendChild(nameLabel);
            nameGroup.appendChild(nameInput.input);
            
            // URL input with label wrapper
            const urlGroup = document.createElement('div');
            urlGroup.className = 'pi-input-group';
            const urlLabel = document.createElement('div');
            urlLabel.className = 'pi-label';
            urlLabel.textContent = 'URL';
            urlLabel.style.cursor = 'default';
            const urlInput = new TextInput({
                value: '',
                placeholder: 'https://example.com',
                onChange: (val) => showToast(`URL: ${val}`)
            });
            urlGroup.appendChild(urlLabel);
            urlGroup.appendChild(urlInput.input);
            
            wrapper.appendChild(nameGroup);
            wrapper.appendChild(urlGroup);
            container.appendChild(wrapper);
        }
    },
    
    // =========================================================================
    // DROPDOWN DEMOS
    // =========================================================================
    'dropdown-basic': {
        title: 'Dropdown',
        description: 'Click to open a dropdown menu with options.',
        render: (container) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'demo-input-grid';
            
            const fontDropdown = new Dropdown({
                options: [
                    { label: 'Inter', value: 'inter' },
                    { label: 'Roboto', value: 'roboto' },
                    { label: 'Open Sans', value: 'opensans' },
                    { label: 'Montserrat', value: 'montserrat' },
                    { label: 'Playfair Display', value: 'playfair' }
                ],
                value: 'inter',
                placeholder: 'Select font...',
                onChange: (val) => showToast(`Font: ${val}`)
            });
            
            const sizeDropdown = new Dropdown({
                options: [
                    { label: '12px', value: 12 },
                    { label: '14px', value: 14 },
                    { label: '16px', value: 16 },
                    { label: '18px', value: 18 },
                    { label: '24px', value: 24 },
                    { label: '32px', value: 32 },
                    { label: '48px', value: 48 }
                ],
                value: 16,
                onChange: (val) => showToast(`Size: ${val}px`)
            });
            
            // Wrap dropdowns with labels
            const fontGroup = document.createElement('div');
            fontGroup.className = 'pi-input-group';
            const fontLabel = document.createElement('div');
            fontLabel.className = 'pi-label';
            fontLabel.textContent = 'Font Family';
            fontGroup.appendChild(fontLabel);
            fontGroup.appendChild(fontDropdown.element);
            
            const sizeGroup = document.createElement('div');
            sizeGroup.className = 'pi-input-group';
            const sizeLabel = document.createElement('div');
            sizeLabel.className = 'pi-label';
            sizeLabel.textContent = 'Font Size';
            sizeGroup.appendChild(sizeLabel);
            sizeGroup.appendChild(sizeDropdown.element);
            
            wrapper.appendChild(fontGroup);
            wrapper.appendChild(sizeGroup);
            container.appendChild(wrapper);
        }
    },
    
    // =========================================================================
    // SWITCH DEMOS
    // =========================================================================
    'switch-basic': {
        title: 'Switch / Toggle',
        description: 'Binary on/off controls for settings.',
        render: (container) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'demo-switch-grid';
            
            const visibleSwitch = new Switch('Visible', true, (val) => {
                showToast(`Visible: ${val ? 'On' : 'Off'}`);
            });
            
            const lockedSwitch = new Switch('Locked', false, (val) => {
                showToast(`Locked: ${val ? 'On' : 'Off'}`);
            });
            
            const snapSwitch = new Switch('Snap to Grid', true, (val) => {
                showToast(`Snap to Grid: ${val ? 'On' : 'Off'}`);
            });
            
            const guidesSwitch = new Switch('Show Guides', false, (val) => {
                showToast(`Show Guides: ${val ? 'On' : 'Off'}`);
            });
            
            wrapper.appendChild(visibleSwitch.element);
            wrapper.appendChild(lockedSwitch.element);
            wrapper.appendChild(snapSwitch.element);
            wrapper.appendChild(guidesSwitch.element);
            container.appendChild(wrapper);
        }
    },
    
    // =========================================================================
    // SEGMENTED CONTROL DEMOS
    // =========================================================================
    'segmented-control-basic': {
        title: 'Segmented Control',
        description: 'Radio-style selection between multiple options.',
        render: (container) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'demo-input-grid';
            
            const alignControl = new SegmentedControl({
                options: [
                    { label: 'Left', value: 'left', icon: `<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M1 2h12M1 5h8M1 8h10M1 11h6" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>` },
                    { label: 'Center', value: 'center', icon: `<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M1 2h12M3 5h8M2 8h10M4 11h6" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>` },
                    { label: 'Right', value: 'right', icon: `<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M1 2h12M5 5h8M3 8h10M7 11h6" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>` },
                    { label: 'Justify', value: 'justify', icon: `<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M1 2h12M1 5h12M1 8h12M1 11h12" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>` }
                ],
                value: 'left',
                onChange: (val) => showToast(`Alignment: ${val}`)
            });
            
            const viewControl = new SegmentedControl({
                options: [
                    { label: 'Grid', value: 'grid' },
                    { label: 'List', value: 'list' },
                    { label: 'Compact', value: 'compact' }
                ],
                value: 'grid',
                onChange: (val) => showToast(`View: ${val}`)
            });
            
            // Add labels
            const alignGroup = document.createElement('div');
            alignGroup.className = 'demo-labeled-control';
            const alignLabel = document.createElement('div');
            alignLabel.className = 'demo-control-label';
            alignLabel.textContent = 'Text Alignment';
            alignGroup.appendChild(alignLabel);
            alignGroup.appendChild(alignControl.element);
            
            const viewGroup = document.createElement('div');
            viewGroup.className = 'demo-labeled-control';
            const viewLabel = document.createElement('div');
            viewLabel.className = 'demo-control-label';
            viewLabel.textContent = 'View Mode';
            viewGroup.appendChild(viewLabel);
            viewGroup.appendChild(viewControl.element);
            
            wrapper.appendChild(alignGroup);
            wrapper.appendChild(viewGroup);
            container.appendChild(wrapper);
        }
    },
    
    // =========================================================================
    // SLIDER DEMOS
    // =========================================================================
    'slider-control-basic': {
        title: 'Slider Control',
        description: 'Drag the slider or scrub the label for precise value control.',
        render: (container) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'demo-slider-grid';
            
            const opacitySlider = new SliderControl({
                label: 'Opacity',
                value: 75,
                min: 0,
                max: 100,
                step: 1,
                unit: '%',
                onChange: (val) => showToast(`Opacity: ${val}%`)
            });
            
            const blurSlider = new SliderControl({
                label: 'Blur',
                value: 8,
                min: 0,
                max: 50,
                step: 1,
                unit: 'px',
                onChange: (val) => showToast(`Blur: ${val}px`)
            });
            
            const rotationSlider = new SliderControl({
                label: 'Rotation',
                value: 0,
                min: -180,
                max: 180,
                step: 1,
                unit: '°',
                onChange: (val) => showToast(`Rotation: ${val}°`)
            });
            
            wrapper.appendChild(opacitySlider.element);
            wrapper.appendChild(blurSlider.element);
            wrapper.appendChild(rotationSlider.element);
            container.appendChild(wrapper);
        }
    },
    
    // =========================================================================
    // COMBINED DEMOS
    // =========================================================================
    'property-panel-mock': {
        title: 'Property Panel (Mock)',
        description: 'A realistic property panel combining multiple components.',
        render: (container) => {
            const panel = document.createElement('div');
            panel.className = 'demo-property-panel';
            
            // Section: Transform
            const transformSection = createSection('Transform');
            
            const transformGrid = document.createElement('div');
            transformGrid.className = 'demo-transform-grid';
            
            const posX = new NumberInput({ label: 'X', value: 120, units: 'px', scrubbable: true, onChange: () => {} });
            const posY = new NumberInput({ label: 'Y', value: 80, units: 'px', scrubbable: true, onChange: () => {} });
            const width = new NumberInput({ label: 'W', value: 200, units: 'px', scrubbable: true, onChange: () => {} });
            const height = new NumberInput({ label: 'H', value: 150, units: 'px', scrubbable: true, onChange: () => {} });
            const rotation = new NumberInput({ label: 'R', value: 0, units: '°', scrubbable: true, onChange: () => {} });
            
            transformGrid.appendChild(posX.element);
            transformGrid.appendChild(posY.element);
            transformGrid.appendChild(width.element);
            transformGrid.appendChild(height.element);
            transformGrid.appendChild(rotation.element);
            transformSection.appendChild(transformGrid);
            
            // Section: Appearance
            const appearanceSection = createSection('Appearance');
            
            const opacitySlider = new SliderControl({
                label: 'Opacity',
                value: 100,
                min: 0,
                max: 100,
                step: 1,
                labelWidth: 60,
                inputWidth: 40,
                onChange: () => {}
            });
            
            const blendDropdown = new Dropdown({
                options: [
                    { label: 'Normal', value: 'normal' },
                    { label: 'Multiply', value: 'multiply' },
                    { label: 'Screen', value: 'screen' },
                    { label: 'Overlay', value: 'overlay' }
                ],
                value: 'normal',
                onChange: () => {}
            });
            
            const blendGroup = document.createElement('div');
            blendGroup.className = 'pi-input-group';
            const blendLabel = document.createElement('div');
            blendLabel.className = 'pi-label';
            blendLabel.textContent = 'Blend Mode';
            blendGroup.appendChild(blendLabel);
            blendGroup.appendChild(blendDropdown.element);
            
            appearanceSection.appendChild(opacitySlider.element);
            appearanceSection.appendChild(blendGroup);
            
            const visibleSwitch = new Switch('Visible', true, () => {});
            const lockedSwitch = new Switch('Locked', false, () => {});
            appearanceSection.appendChild(visibleSwitch.element);
            appearanceSection.appendChild(lockedSwitch.element);
            
            // Section: Actions
            const actionsSection = createSection('Actions');
            const actionsRow = document.createElement('div');
            actionsRow.className = 'demo-button-row';
            
            const duplicateBtn = new Button({
                label: 'Duplicate',
                variant: 'secondary',
                size: 'sm',
                onClick: () => showToast('Duplicated!')
            });
            
            const deleteBtn = new Button({
                label: 'Delete',
                variant: 'danger',
                size: 'sm',
                onClick: () => showToast('Deleted!')
            });
            
            actionsRow.appendChild(duplicateBtn.element);
            actionsRow.appendChild(deleteBtn.element);
            actionsSection.appendChild(actionsRow);
            
            panel.appendChild(transformSection);
            panel.appendChild(appearanceSection);
            panel.appendChild(actionsSection);
            container.appendChild(panel);
        }
    }
};

/**
 * Create a section with title
 */
function createSection(title) {
    const section = document.createElement('div');
    section.className = 'demo-section';
    
    const header = document.createElement('div');
    header.className = 'demo-section-header';
    header.textContent = title;
    section.appendChild(header);
    
    return section;
}

/**
 * Show a toast notification
 */
function showToast(message) {
    // Remove existing toast
    const existing = document.querySelector('.demo-toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'demo-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Animate in
    requestAnimationFrame(() => {
        toast.classList.add('demo-toast--visible');
    });
    
    // Remove after delay
    setTimeout(() => {
        toast.classList.remove('demo-toast--visible');
        setTimeout(() => toast.remove(), 200);
    }, 2000);
}

/**
 * Initialize component demos on the page
 * Looks for elements with data-component-demo attribute
 */
export function initComponentDemos() {
    const demoContainers = document.querySelectorAll('[data-component-demo]');
    
    demoContainers.forEach(container => {
        const demoId = container.getAttribute('data-component-demo');
        const demo = COMPONENT_DEMOS[demoId];
        
        if (demo) {
            renderDemo(container, demo);
        } else {
            console.warn(`Unknown component demo: ${demoId}`);
        }
    });
}

/**
 * Render a single demo into a container
 */
function renderDemo(container, demo) {
    container.innerHTML = '';
    container.className = 'component-demo';
    
    // Header
    if (demo.title) {
        const header = document.createElement('div');
        header.className = 'component-demo__header';
        
        const title = document.createElement('h4');
        title.className = 'component-demo__title';
        title.textContent = demo.title;
        header.appendChild(title);
        
        if (demo.description) {
            const desc = document.createElement('p');
            desc.className = 'component-demo__description';
            desc.textContent = demo.description;
            header.appendChild(desc);
        }
        
        container.appendChild(header);
    }
    
    // Demo content
    const content = document.createElement('div');
    content.className = 'component-demo__content';
    demo.render(content);
    container.appendChild(content);
}

/**
 * Render all demos for a showcase page
 */
export function renderAllDemos(container) {
    Object.entries(COMPONENT_DEMOS).forEach(([id, demo]) => {
        const demoContainer = document.createElement('div');
        demoContainer.setAttribute('data-component-demo', id);
        container.appendChild(demoContainer);
        renderDemo(demoContainer, demo);
    });
}

/**
 * Get list of available demos
 */
export function getAvailableDemos() {
    return Object.keys(COMPONENT_DEMOS);
}

export { COMPONENT_DEMOS };
