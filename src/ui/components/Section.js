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
        titleGroup.className = 'pi-section-title-group';

        // Chevron
        this.chevron = document.createElement('div');
        this.chevron.innerHTML = Icons.CHEVRON_DOWN || 'v'; // Fallback
        this.chevron.className = 'pi-section-chevron';
        if (this.collapsed) this.chevron.classList.add('collapsed');

        const title = document.createElement('div');
        title.className = 'pi-section-title';
        title.textContent = this.options.title;

        titleGroup.appendChild(this.chevron);
        titleGroup.appendChild(title);

        // Actions (Right aligned)
        const actionsGroup = document.createElement('div');
        actionsGroup.className = 'pi-section-actions';
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
        if (this.collapsed) this.content.classList.add('hidden');

        container.appendChild(header);
        container.appendChild(this.content);

        return container;
    }

    toggle() {
        this.collapsed = !this.collapsed;
        this.content.classList.toggle('hidden', this.collapsed);
        this.chevron.classList.toggle('collapsed', this.collapsed);
        
        if (this.options.onToggle) {
            this.options.onToggle(this.collapsed);
        }
    }

    setCollapsed(collapsed) {
        if (this.collapsed === collapsed) return;
        this.collapsed = collapsed;
        this.content.classList.toggle('hidden', this.collapsed);
        this.chevron.classList.toggle('collapsed', this.collapsed);
        
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
