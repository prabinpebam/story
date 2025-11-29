/**
 * InviteInput
 * 
 * Email input for inviting collaborators with tag-style display.
 */

export class InviteInput {
    /**
     * Create an InviteInput
     * @param {Object} options - Configuration options
     * @param {string} options.placeholder - Input placeholder text
     * @param {Function} options.onSubmit - Callback when Enter is pressed
     */
    constructor(options = {}) {
        this.placeholder = options.placeholder || 'Enter email addresses...';
        this.onSubmit = options.onSubmit;
        
        this.emails = [];
        this.isDisabled = false;
        
        this.element = document.createElement('div');
        this.element.className = 'invite-input';
        
        this._render();
        this._bindEvents();
    }

    /**
     * Render the input
     * @private
     */
    _render() {
        this.element.innerHTML = '';
        
        // Tags container
        this.tagsContainer = document.createElement('div');
        this.tagsContainer.className = 'invite-input-tags';
        this.element.appendChild(this.tagsContainer);
        
        // Input
        this.input = document.createElement('input');
        this.input.type = 'email';
        this.input.className = 'invite-input-field';
        this.input.placeholder = this.emails.length > 0 ? '' : this.placeholder;
        this.input.setAttribute('aria-label', 'Email address');
        this.element.appendChild(this.input);
        
        // Render existing email tags
        this._renderTags();
    }

    /**
     * Render email tags
     * @private
     */
    _renderTags() {
        this.tagsContainer.innerHTML = '';
        
        this.emails.forEach((email, index) => {
            const tag = document.createElement('span');
            tag.className = 'invite-input-tag';
            
            const text = document.createElement('span');
            text.textContent = email;
            tag.appendChild(text);
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'invite-input-tag-remove';
            removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
            removeBtn.setAttribute('aria-label', `Remove ${email}`);
            removeBtn.addEventListener('click', () => this._removeEmail(index));
            tag.appendChild(removeBtn);
            
            this.tagsContainer.appendChild(tag);
        });
        
        // Update placeholder
        this.input.placeholder = this.emails.length > 0 ? '' : this.placeholder;
    }

    /**
     * Bind input events
     * @private
     */
    _bindEvents() {
        // Handle key events
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this._addCurrentInput();
                
                if (this.onSubmit && this.emails.length > 0) {
                    this.onSubmit(this.emails);
                }
            } else if (e.key === ',' || e.key === ' ' || e.key === 'Tab') {
                if (this.input.value.trim()) {
                    e.preventDefault();
                    this._addCurrentInput();
                }
            } else if (e.key === 'Backspace' && !this.input.value && this.emails.length > 0) {
                this._removeEmail(this.emails.length - 1);
            }
        });
        
        // Handle paste
        this.input.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text');
            this._parseAndAddEmails(text);
        });
        
        // Handle blur
        this.input.addEventListener('blur', () => {
            this._addCurrentInput();
        });
        
        // Focus input when clicking container
        this.element.addEventListener('click', () => {
            this.input.focus();
        });
    }

    /**
     * Add current input value as email
     * @private
     */
    _addCurrentInput() {
        const value = this.input.value.trim();
        if (value && this._isValidEmail(value)) {
            if (!this.emails.includes(value)) {
                this.emails.push(value);
                this._renderTags();
            }
            this.input.value = '';
        }
    }

    /**
     * Parse and add emails from text
     * @param {string} text - Text containing emails
     * @private
     */
    _parseAndAddEmails(text) {
        // Split by common delimiters
        const parts = text.split(/[,;\s\n]+/);
        
        parts.forEach(part => {
            const email = part.trim();
            if (email && this._isValidEmail(email) && !this.emails.includes(email)) {
                this.emails.push(email);
            }
        });
        
        this._renderTags();
    }

    /**
     * Remove email at index
     * @param {number} index - Index to remove
     * @private
     */
    _removeEmail(index) {
        this.emails.splice(index, 1);
        this._renderTags();
    }

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean}
     * @private
     */
    _isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    /**
     * Get current emails
     * @returns {string[]}
     */
    getEmails() {
        // Add any pending input
        this._addCurrentInput();
        return [...this.emails];
    }

    /**
     * Clear all emails
     */
    clear() {
        this.emails = [];
        this.input.value = '';
        this._renderTags();
    }

    /**
     * Disable the input
     */
    disable() {
        this.isDisabled = true;
        this.input.disabled = true;
        this.element.classList.add('disabled');
    }

    /**
     * Enable the input
     */
    enable() {
        this.isDisabled = false;
        this.input.disabled = false;
        this.element.classList.remove('disabled');
    }

    /**
     * Focus the input
     */
    focus() {
        this.input.focus();
    }

    /**
     * Destroy the component
     */
    destroy() {
        if (this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

export default InviteInput;
