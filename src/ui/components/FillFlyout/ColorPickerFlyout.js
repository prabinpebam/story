import { SolidTab } from './SolidTab.js';
import { IconButton } from '../IconButton.js';
import { Icons } from '../../Icons.js';

export class ColorPickerFlyout {
    constructor(options = {}) {
        this.options = options;
        this.onChange = options.onChange || (() => {});
        this.onClose = options.onClose || (() => {});
        this.color = options.color || '#000000';
        
        this.element = document.createElement('div');
        this.element.className = 'color-picker-flyout ui-flyout';

        // Prevent clicks from closing
        this.element.addEventListener('mousedown', (e) => e.stopPropagation());

        this.render();
    }

    render() {
        this.element.innerHTML = '';
        
        const header = document.createElement('div');
        header.className = 'color-picker-flyout-header';

        const title = document.createElement('div');
        title.className = 'flyout-title';
        title.textContent = 'Color';
        header.appendChild(title);
        
        const closeBtn = new IconButton({ 
            icon: Icons.CLOSE, 
            title: 'Close', 
            onClick: () => this.onClose() 
        });
        header.appendChild(closeBtn.element);
        this.element.appendChild(header);

        // Solid Tab Content
        // We wrap it to isolate styles if needed
        const content = document.createElement('div');
        
        const solidTab = new SolidTab({
            fill: { type: 'solid', color: this.color }, 
            onChange: (updates) => {
                // Pass through the full updates object to preserve themeSlot info
                // This enables gradient stops to support theme-linking in the future
                if (updates.color) {
                    // For backward compatibility, call onChange with the color string
                    // But also call onColorChange if provided to get full update object
                    this.onChange(updates.color);
                    
                    // If the consumer provided an onColorChange callback, send full data
                    if (this.options.onColorChange) {
                        this.options.onColorChange(updates);
                    }
                }
            }
        });
        
        content.appendChild(solidTab.element);
        this.element.appendChild(content);
    }
    
    destroy() {
        this.element.remove();
    }
}
