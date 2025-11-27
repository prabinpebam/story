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
        this.element.style.position = 'absolute';
        this.element.style.width = '240px';
        this.element.style.padding = '12px';
        this.element.style.zIndex = '10001'; // Higher than FillFlyout

        // Prevent clicks from closing
        this.element.addEventListener('mousedown', (e) => e.stopPropagation());

        this.render();
    }

    render() {
        this.element.innerHTML = '';
        
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '8px';

        const title = document.createElement('div');
        title.className = 'flyout-title';
        title.textContent = 'Color';
        title.style.marginBottom = '0';
        title.style.paddingBottom = '0';
        title.style.borderBottom = 'none';
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
                if (updates.color) {
                    this.onChange(updates.color);
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
