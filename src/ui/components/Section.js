import { IconButton } from './IconButton.js';
import { Icons } from '../Icons.js';

/**
 * Collapsible Section Component
 * 
 * A reusable collapsible section with header, content area, and optional action buttons.
 * Follows BEM naming (.pi-section, .pi-section__header, etc.) and includes
 * accessibility attributes (aria-expanded, aria-controls).
 * 
 * @example
 * const section = new Section({
 *     title: 'Position',
 *     id: 'position-section',
 *     collapsed: false,
 *     onToggle: (isCollapsed) => saveState(isCollapsed),
 *     actions: [{ icon: Icons.PLUS, title: 'Add', onClick: () => {} }]
 * });
 * section.appendChild(myContent);
 * container.appendChild(section.element);
 */
export class Section {
    constructor(options = {}) {
        this.options = {
            title: 'Section',
            id: '', // Unique ID for state persistence and aria-controls
            collapsed: false,
            onToggle: () => {},
            actions: [], // Array of { icon, onClick, title }
            ...options
        };

        // Generate unique ID if not provided
        this.sectionId = this.options.id || `section-${Math.random().toString(36).substr(2, 9)}`;
        this.contentId = `${this.sectionId}-content`;
        
        this.collapsed = this.options.collapsed;
        this.element = this.create();
        
        // Apply initial collapsed state after element is created
        if (this.collapsed) {
            this.element.classList.add('pi-section--collapsed');
        }
    }

    create() {
        const container = document.createElement('div');
        container.className = 'pi-section';
        container.id = this.sectionId;

        // Header (acts as toggle button)
        const header = document.createElement('div');
        header.className = 'pi-section__header';
        header.setAttribute('role', 'button');
        header.setAttribute('tabindex', '0');
        header.setAttribute('aria-expanded', String(!this.collapsed));
        header.setAttribute('aria-controls', this.contentId);
        header.addEventListener('click', () => this.toggle());
        header.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggle();
            }
        });
        this.header = header;

        const titleGroup = document.createElement('div');
        titleGroup.className = 'pi-section__title-group';

        // Chevron
        this.chevron = document.createElement('div');
        this.chevron.innerHTML = Icons.CHEVRON_DOWN || '▼';
        this.chevron.className = 'pi-section__chevron';
        this.chevron.setAttribute('aria-hidden', 'true');

        const title = document.createElement('div');
        title.className = 'pi-section__title';
        title.textContent = this.options.title;

        titleGroup.appendChild(this.chevron);
        titleGroup.appendChild(title);

        // Actions (Right aligned)
        const actionsGroup = document.createElement('div');
        actionsGroup.className = 'pi-section__actions';
        actionsGroup.addEventListener('click', (e) => e.stopPropagation()); // Prevent toggle
        actionsGroup.addEventListener('keydown', (e) => e.stopPropagation()); // Prevent toggle on Enter

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
        this.content.className = 'pi-section__content';
        this.content.id = this.contentId;
        this.content.setAttribute('role', 'region');
        this.content.setAttribute('aria-labelledby', `${this.sectionId}-title`);
        title.id = `${this.sectionId}-title`;

        container.appendChild(header);
        container.appendChild(this.content);

        return container;
    }

    /**
     * Toggle the collapsed state
     */
    toggle() {
        this.setCollapsed(!this.collapsed);
    }

    /**
     * Set the collapsed state
     * @param {boolean} collapsed - Whether section should be collapsed
     */
    setCollapsed(collapsed) {
        if (this.collapsed === collapsed) return;
        
        this.collapsed = collapsed;
        this.element.classList.toggle('pi-section--collapsed', this.collapsed);
        this.header.setAttribute('aria-expanded', String(!this.collapsed));
        
        if (this.options.onToggle) {
            this.options.onToggle(this.collapsed);
        }
    }

    /**
     * Check if section is currently collapsed
     * @returns {boolean}
     */
    isCollapsed() {
        return this.collapsed;
    }

    /**
     * Append an element to the section content
     * @param {HTMLElement} element - Element to append
     */
    appendChild(element) {
        this.content.appendChild(element);
    }
    
    /**
     * Clear all content from the section
     */
    clear() {
        this.content.innerHTML = '';
    }

    /**
     * Set the section title
     * @param {string} title - New title
     */
    setTitle(title) {
        const titleEl = this.element.querySelector('.pi-section__title');
        if (titleEl) {
            titleEl.textContent = title;
        }
    }

    /**
     * Add an action button to the header
     * @param {{ icon: string, title: string, onClick: Function }} action
     * @returns {HTMLElement} The button element
     */
    addAction(action) {
        const actionsGroup = this.element.querySelector('.pi-section__actions');
        if (actionsGroup) {
            const btn = new IconButton({
                icon: action.icon,
                title: action.title,
                onClick: action.onClick
            });
            actionsGroup.appendChild(btn.element);
            return btn.element;
        }
        return null;
    }

    /**
     * Get the content container element
     * @returns {HTMLElement}
     */
    getContentElement() {
        return this.content;
    }
}
