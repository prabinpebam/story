/**
 * Button.js
 * 
 * Unified button component with size variants for the Story Design System.
 * 
 * Replaces: IconButton, and all ad-hoc button creation patterns.
 * 
 * DESIGN SYSTEM COMPLIANCE:
 * - Uses only CSS custom properties (design tokens)
 * - Supports dark and light themes automatically
 * - All interactions use accent color (per principles.md)
 * - BEM naming convention: .btn, .btn--variant, .btn--size, .btn__element
 * 
 * SIZES (4 options):
 * - xs: 24px - Icon-only buttons, compact spaces
 * - sm: 28px - Compact buttons in panels  
 * - md: 32px - Default size
 * - lg: 40px - Prominent CTAs, modals
 * 
 * VARIANTS (4 options):
 * - primary: Main CTA, accent background
 * - secondary: Default style, subtle background
 * - text: Minimal/inline buttons, transparent
 * - danger: Destructive actions, red on hover
 * 
 * Usage:
 *   import { Button } from './Button.js';
 * 
 *   const btn = new Button({
 *       label: 'Save',
 *       icon: Icons.SAVE,
 *       variant: 'primary',
 *       size: 'md',
 *       onClick: () => handleSave()
 *   });
 *   container.appendChild(btn.element);
 */

export class Button {
    /**
     * Create a new Button instance
     * @param {Object} options - Button configuration
     * @param {string} [options.label=''] - Text label (optional if icon-only)
     * @param {string} [options.icon=''] - SVG string (optional)
     * @param {string} [options.iconPosition='left'] - 'left' | 'right'
     * @param {string} [options.variant='secondary'] - 'primary' | 'secondary' | 'text' | 'danger'
     * @param {string} [options.size='md'] - 'xs' | 'sm' | 'md' | 'lg'
     * @param {boolean} [options.fullWidth=false] - 100% width
     * @param {boolean} [options.disabled=false] - Disabled state
     * @param {boolean} [options.loading=false] - Loading state with spinner
     * @param {boolean} [options.active=false] - Toggle/selected state
     * @param {string} [options.title=''] - Tooltip text
     * @param {string} [options.ariaLabel=''] - Screen reader label
     * @param {string} [options.dataTestId=''] - Test ID for E2E testing
     * @param {string} [options.type='button'] - 'button' | 'submit' | 'reset'
     * @param {string} [options.className=''] - Additional CSS classes
     * @param {Function} [options.onClick=null] - Click handler
     */
    constructor(options = {}) {
        this.options = {
            // Content
            label: '',
            icon: '',
            iconPosition: 'left',
            
            // Appearance
            variant: 'secondary',
            size: 'md',
            fullWidth: false,
            
            // State
            disabled: false,
            loading: false,
            active: false,
            
            // Accessibility
            title: '',
            ariaLabel: '',
            dataTestId: '',
            
            // Behavior
            type: 'button',
            className: '',
            onClick: null,
            
            ...options
        };
        
        this.element = this._render();
    }
    
    /**
     * Render the button element
     * @private
     * @returns {HTMLButtonElement}
     */
    _render() {
        const btn = document.createElement('button');
        btn.type = this.options.type;
        
        // Build class list
        this._applyClasses(btn);
        
        // Accessibility
        if (this.options.title) btn.title = this.options.title;
        if (this.options.ariaLabel) {
            btn.setAttribute('aria-label', this.options.ariaLabel);
        } else if (this.options.title && !this.options.label) {
            // Icon-only buttons should have aria-label from title
            btn.setAttribute('aria-label', this.options.title);
        }
        if (this.options.dataTestId) {
            btn.setAttribute('data-testid', this.options.dataTestId);
        }
        if (this.options.disabled) btn.disabled = true;
        if (this.options.loading) btn.setAttribute('aria-busy', 'true');
        
        // Content
        this._renderContent(btn);
        
        // Event handler
        if (this.options.onClick) {
            btn.addEventListener('click', (e) => {
                if (!this.options.disabled && !this.options.loading) {
                    this.options.onClick(e);
                }
            });
        }
        
        return btn;
    }
    
    /**
     * Apply CSS classes to the button
     * @private
     * @param {HTMLButtonElement} btn
     */
    _applyClasses(btn) {
        const classes = ['btn'];
        
        // Variant
        classes.push(`btn--${this.options.variant}`);
        
        // Size
        classes.push(`btn--${this.options.size}`);
        
        // Modifiers
        if (this.options.fullWidth) classes.push('btn--full');
        if (this.options.disabled) classes.push('btn--disabled');
        if (this.options.loading) classes.push('btn--loading');
        if (this.options.active) classes.push('btn--active');
        if (this.options.icon && !this.options.label) classes.push('btn--icon-only');
        
        // Additional custom classes
        if (this.options.className) {
            classes.push(...this.options.className.split(' ').filter(Boolean));
        }
        
        btn.className = classes.join(' ');
    }
    
    /**
     * Render button content (icon, label, spinner)
     * @private
     * @param {HTMLButtonElement} btn
     */
    _renderContent(btn) {
        btn.innerHTML = '';
        
        // Loading spinner (replaces content visually but keeps for layout)
        if (this.options.loading) {
            const spinner = document.createElement('span');
            spinner.className = 'btn__spinner';
            spinner.setAttribute('aria-hidden', 'true');
            btn.appendChild(spinner);
        }
        
        // Icon (left position)
        if (this.options.icon && this.options.iconPosition === 'left') {
            const iconEl = document.createElement('span');
            iconEl.className = 'btn__icon';
            iconEl.setAttribute('aria-hidden', 'true');
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
        
        // Icon (right position)
        if (this.options.icon && this.options.iconPosition === 'right') {
            const iconEl = document.createElement('span');
            iconEl.className = 'btn__icon';
            iconEl.setAttribute('aria-hidden', 'true');
            iconEl.innerHTML = this.options.icon;
            btn.appendChild(iconEl);
        }
    }
    
    // =========================================================================
    // State Management Methods
    // =========================================================================
    
    /**
     * Set disabled state
     * @param {boolean} disabled
     */
    setDisabled(disabled) {
        this.options.disabled = disabled;
        this.element.disabled = disabled;
        this.element.classList.toggle('btn--disabled', disabled);
    }
    
    /**
     * Set loading state (shows spinner, disables interaction)
     * @param {boolean} loading
     */
    setLoading(loading) {
        this.options.loading = loading;
        this.element.classList.toggle('btn--loading', loading);
        this.element.setAttribute('aria-busy', loading ? 'true' : 'false');
        this._renderContent(this.element);
    }
    
    /**
     * Set active/selected state (for toggle buttons)
     * @param {boolean} active
     */
    setActive(active) {
        this.options.active = active;
        this.element.classList.toggle('btn--active', active);
    }
    
    /**
     * Update button label
     * @param {string} label
     */
    setLabel(label) {
        this.options.label = label;
        this._renderContent(this.element);
        // Update icon-only class
        this.element.classList.toggle('btn--icon-only', this.options.icon && !label);
    }
    
    /**
     * Update button icon
     * @param {string} icon - SVG string
     */
    setIcon(icon) {
        this.options.icon = icon;
        this._renderContent(this.element);
        // Update icon-only class
        this.element.classList.toggle('btn--icon-only', icon && !this.options.label);
    }
    
    /**
     * Update button variant
     * @param {string} variant - 'primary' | 'secondary' | 'text' | 'danger'
     */
    setVariant(variant) {
        // Remove old variant class
        this.element.classList.remove(`btn--${this.options.variant}`);
        // Set new variant
        this.options.variant = variant;
        this.element.classList.add(`btn--${variant}`);
    }
    
    /**
     * Update click handler
     * @param {Function} onClick
     */
    setOnClick(onClick) {
        // Remove old handler by replacing element (simple approach)
        // For more complex scenarios, consider storing handler reference
        this.options.onClick = onClick;
    }
    
    /**
     * Focus the button
     */
    focus() {
        this.element.focus();
    }
    
    /**
     * Blur the button
     */
    blur() {
        this.element.blur();
    }
    
    /**
     * Destroy the button and clean up
     */
    destroy() {
        this.element.remove();
    }
}
