import { IconButton } from './IconButton.js';
import { Icons } from '../Icons.js';

export class Section {
    constructor(options = {}) {
        this.options = {
            title: 'Section',
            id: '', // Unique ID for state persistence
            collapsed: false,
            onToggle: () => {},
            actions: [], // Array of { icon, onClick, title }
            ...options
        };

        this.collapsed = this.options.collapsed;
        this.element = this.create();
    }

    create() {
        const container = document.createElement('div');
        container.className = 'pi-section';

        // Header
        const header = document.createElement('div');
        header.className = 'pi-section-header';
        header.addEventListener('click', () => this.toggle());

        const titleGroup = document.createElement('div');
        titleGroup.style.display = 'flex';
        titleGroup.style.alignItems = 'center';
        titleGroup.style.gap = '8px';

        // Chevron
        this.chevron = document.createElement('div');
        this.chevron.innerHTML = Icons.CHEVRON_DOWN || 'v'; // Fallback
        this.chevron.style.width = '12px';
        this.chevron.style.height = '12px';
        this.chevron.style.display = 'flex';
        this.chevron.style.alignItems = 'center';
        this.chevron.style.justifyContent = 'center';
        this.chevron.style.transition = 'transform 0.2s';
        if (this.collapsed) this.chevron.style.transform = 'rotate(-90deg)';

        const title = document.createElement('div');
        title.className = 'pi-section-title';
        title.textContent = this.options.title;

        titleGroup.appendChild(this.chevron);
        titleGroup.appendChild(title);

        // Actions (Right aligned)
        const actionsGroup = document.createElement('div');
        actionsGroup.style.display = 'flex';
        actionsGroup.style.gap = '4px';
        actionsGroup.addEventListener('click', (e) => e.stopPropagation()); // Prevent toggle

        this.options.actions.forEach(action => {
            const btn = new IconButton({
                icon: action.icon,
                title: action.title,
                onClick: action.onClick
            });
            actionsGroup.appendChild(btn.element);
        });

        header.appendChild(titleGroup);
        header.appendChild(actionsGroup);

        // Content
        this.content = document.createElement('div');
        this.content.className = 'pi-section-content';
        if (this.collapsed) this.content.style.display = 'none';

        container.appendChild(header);
        container.appendChild(this.content);

        return container;
    }

    toggle() {
        this.collapsed = !this.collapsed;
        this.content.style.display = this.collapsed ? 'none' : 'flex';
        this.chevron.style.transform = this.collapsed ? 'rotate(-90deg)' : 'rotate(0deg)';
        
        if (this.options.onToggle) {
            this.options.onToggle(this.collapsed);
        }
    }

    appendChild(element) {
        this.content.appendChild(element);
    }
    
    clear() {
        this.content.innerHTML = '';
    }
}
