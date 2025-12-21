import { store } from '../../core/Store.js';

export class Flyout {
    constructor(options = {}) {
        this.options = {
            trigger: null,
            content: null,
            position: 'left', // 'left', 'right', 'bottom'
            onClose: () => {},
            trackInteraction: true, // Whether to dispatch UI_INTERACTION events
            closeOnEscape: false,
            trapFocus: false,
            ...options
        };
        
        this.element = document.createElement('div');
        this.element.className = 'ui-flyout';
        
        if (this.options.content) {
            this.element.appendChild(this.options.content);
        }
        
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    open() {
        document.body.appendChild(this.element);
        this.updatePosition();
        
        // Dispatch UI interaction start for property-editing flyouts
        if (this.options.trackInteraction) {
            store.dispatch('UI_INTERACTION_START');
        }
        
        // Small delay to prevent immediate closing if triggered by click
        setTimeout(() => {
            document.addEventListener('mousedown', this.handleOutsideClick);
            if (this.options.closeOnEscape || this.options.trapFocus) {
                document.addEventListener('keydown', this.handleKeyDown);
            }
        }, 0);
    }

    close() {
        if (this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        document.removeEventListener('mousedown', this.handleOutsideClick);
        document.removeEventListener('keydown', this.handleKeyDown);
        
        // Dispatch UI interaction end for property-editing flyouts
        if (this.options.trackInteraction) {
            store.dispatch('UI_INTERACTION_END');
        }
        
        if (this.options.onClose) this.options.onClose();
    }

    handleKeyDown(e) {
        if (e.key === 'Escape' && this.options.closeOnEscape) {
            this.close();
            return;
        }

        if (e.key !== 'Tab' || !this.options.trapFocus) return;

        const focusables = Array.from(this.element.querySelectorAll(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )).filter(el => {
            // Skip elements that are not actually focusable/visible.
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden';
        });

        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;

        // If focus is outside the flyout, pull it in.
        if (!this.element.contains(active)) {
            e.preventDefault();
            first.focus();
            return;
        }

        if (e.shiftKey) {
            if (active === first) {
                e.preventDefault();
                last.focus();
            }
        } else {
            if (active === last) {
                e.preventDefault();
                first.focus();
            }
        }
    }

    updatePosition() {
        if (!this.options.trigger) return;
        
        const rect = this.options.trigger.getBoundingClientRect();
        const flyoutRect = this.element.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const gap = 8;
        
        let top = rect.top;
        let left = rect.left - flyoutRect.width - gap; // Default to left
        
        // Horizontal positioning
        // Check if left side has enough space
        if (left < 0) {
            // Try right side
            const rightPos = rect.right + gap;
            if (rightPos + flyoutRect.width <= viewportWidth) {
                left = rightPos;
            } else {
                // Neither fits perfectly, stick to the side with more space or clamp
                // If left < 0, clamp to 0? But then it overlaps trigger?
                // Let's just clamp to viewport
                left = Math.max(0, Math.min(left, viewportWidth - flyoutRect.width));
            }
        }

        // Vertical positioning
        // Check if it goes off bottom
        if (top + flyoutRect.height > viewportHeight) {
            top = viewportHeight - flyoutRect.height - gap;
        }
        // Check if it goes off top
        if (top < 0) {
            top = gap;
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
