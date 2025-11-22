export class Flyout {
    constructor(options = {}) {
        this.options = {
            trigger: null,
            content: null,
            position: 'left', // 'left', 'right', 'bottom'
            onClose: () => {},
            ...options
        };
        
        this.element = document.createElement('div');
        this.element.className = 'ui-flyout';
        this.element.style.position = 'fixed';
        this.element.style.zIndex = '1000';
        this.element.style.background = 'var(--color-bg-panel)';
        this.element.style.border = '1px solid var(--color-border)';
        this.element.style.borderRadius = 'var(--radius-md)';
        this.element.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        this.element.style.padding = 'var(--spacing-2)';
        this.element.style.minWidth = '200px';
        
        if (this.options.content) {
            this.element.appendChild(this.options.content);
        }
        
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
    }

    open() {
        document.body.appendChild(this.element);
        this.updatePosition();
        
        // Small delay to prevent immediate closing if triggered by click
        setTimeout(() => {
            document.addEventListener('mousedown', this.handleOutsideClick);
        }, 0);
    }

    close() {
        if (this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        document.removeEventListener('mousedown', this.handleOutsideClick);
        if (this.options.onClose) this.options.onClose();
    }

    updatePosition() {
        if (!this.options.trigger) return;
        
        const rect = this.options.trigger.getBoundingClientRect();
        const flyoutRect = this.element.getBoundingClientRect();
        
        let top = rect.top;
        let left = rect.left - flyoutRect.width - 8; // Default to left
        
        // Simple boundary check (very basic)
        if (left < 0) {
            // Flip to right
            left = rect.right + 8;
        }
        
        // Adjust top if it goes off screen
        if (top + flyoutRect.height > window.innerHeight) {
            top = window.innerHeight - flyoutRect.height - 8;
        }

        this.element.style.top = `${top}px`;
        this.element.style.left = `${left}px`;
    }

    handleOutsideClick(e) {
        if (!this.element.contains(e.target) && !this.options.trigger.contains(e.target)) {
            this.close();
        }
    }
}
