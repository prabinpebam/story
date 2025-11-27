import { IconButton } from './IconButton.js';
import { Icons } from '../Icons.js';

export class FillTypeSelector {
    constructor(options = {}) {
        this.activeType = options.activeType || 'solid';
        this.onChange = options.onChange || (() => {});
        
        // Default supported types
        this.types = options.types || [
            { type: 'solid', icon: Icons.FILL_SOLID, title: 'Solid Color' },
            { type: 'gradient', icon: Icons.FILL_GRADIENT, title: 'Gradient' },
            { type: 'image', icon: Icons.FILL_IMAGE, title: 'Image' },
            { type: 'video', icon: Icons.FILL_VIDEO, title: 'Video' },
            { type: 'code', icon: Icons.FILL_CODE, title: 'Code' }
        ];

        this.element = document.createElement('div');
        this.element.className = 'fill-type-selector';
        
        this.render();
    }

    render() {
        this.element.innerHTML = '';
        
        this.types.forEach(mode => {
            const isActive = this.activeType === mode.type;
            const btn = new IconButton({
                icon: mode.icon,
                title: mode.title,
                isActive: isActive,
                onClick: () => {
                    if (this.activeType !== mode.type) {
                        this.activeType = mode.type;
                        this.render(); // Re-render to update active state
                        this.onChange(mode.type);
                    }
                }
            });
            
            this.element.appendChild(btn.element);
        });
    }
}
