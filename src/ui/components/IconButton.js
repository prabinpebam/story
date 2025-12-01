/**
 * IconButton.js
 * 
 * @deprecated Use Button component with icon and size='xs' instead.
 * This class maintains 100% backward compatibility during migration.
 * 
 * Migration example:
 *   // Old:
 *   new IconButton({ icon: Icons.CLOSE, onClick: handleClose, title: 'Close' });
 *   
 *   // New:
 *   new Button({ icon: Icons.CLOSE, size: 'xs', variant: 'text', onClick: handleClose, title: 'Close' });
 * 
 * This wrapper:
 * - Maps old IconButton API to new Button API internally
 * - Keeps the legacy 'pi-icon-btn' class for existing CSS
 * - Supports all original options: icon, title, onClick, isActive
 * - Supports all original methods: setActive()
 */

import { Button } from './Button.js';

export class IconButton {
    /**
     * Create an IconButton (legacy wrapper around Button)
     * @param {Object} options
     * @param {string} [options.icon=''] - SVG string
     * @param {string} [options.title=''] - Tooltip text
     * @param {Function} [options.onClick] - Click handler
     * @param {boolean} [options.isActive=false] - Active/selected state
     */
    constructor(options = {}) {
        this.options = {
            icon: '',
            title: '',
            onClick: () => {},
            isActive: false,
            ...options
        };

        // Create using the new Button component internally
        this._button = new Button({
            icon: this.options.icon,
            title: this.options.title,
            ariaLabel: this.options.title,
            onClick: this.options.onClick,
            active: this.options.isActive,
            variant: 'text',
            size: 'xs'
        });
        
        // Add legacy class for backward compatibility with existing CSS
        this._button.element.classList.add('pi-icon-btn');
        
        // Add legacy 'active' class if isActive was true on construction
        if (this.options.isActive) {
            this._button.element.classList.add('active');
        }
        
        // Expose element (same API as before)
        this.element = this._button.element;
    }

    /**
     * Set active/selected state
     * @param {boolean} isActive
     */
    setActive(isActive) {
        this._button.setActive(isActive);
        // Also toggle legacy 'active' class for old CSS rules
        this.element.classList.toggle('active', isActive);
    }
}
