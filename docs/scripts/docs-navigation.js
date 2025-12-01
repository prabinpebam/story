/**
 * Documentation Navigation Component
 * 
 * Renders hierarchical navigation sidebar with:
 * - Collapsible sections
 * - Active state tracking
 * - Smooth animations
 */

export class DocsNavigation {
    constructor(structure, onNavigate) {
        this.structure = structure;
        this.onNavigate = onNavigate;
        this.container = null;
        this.expandedSections = new Set();
        
        // Load expanded state from localStorage
        this.loadExpandedState();
    }
    
    loadExpandedState() {
        try {
            const saved = localStorage.getItem('docs-nav-expanded');
            if (saved) {
                this.expandedSections = new Set(JSON.parse(saved));
            }
        } catch (e) {
            console.warn('Failed to load nav state:', e);
        }
    }
    
    saveExpandedState() {
        try {
            localStorage.setItem('docs-nav-expanded', 
                JSON.stringify([...this.expandedSections]));
        } catch (e) {
            console.warn('Failed to save nav state:', e);
        }
    }
    
    render(container) {
        this.container = container;
        container.innerHTML = '';
        
        for (const section of this.structure.sections) {
            const sectionEl = this.renderSection(section);
            container.appendChild(sectionEl);
        }
    }
    
    renderSection(section, level = 0) {
        const sectionEl = document.createElement('div');
        sectionEl.className = 'nav-section';
        sectionEl.dataset.section = section.title;
        
        if (section.items && section.items.length > 0) {
            const isExpanded = !section.collapsed && 
                (this.expandedSections.has(section.title) || level === 0);
            
            // Section header (if has items)
            if (level === 0) {
                const header = document.createElement('div');
                header.className = 'nav-section-title';
                header.innerHTML = `
                    ${section.icon ? `<i class="${section.icon}"></i>` : ''}
                    ${section.title}
                `;
                sectionEl.appendChild(header);
            } else {
                // Nested sections use toggle buttons
                const toggle = document.createElement('button');
                toggle.className = `nav-toggle ${isExpanded ? 'expanded' : ''}`;
                toggle.innerHTML = `
                    <span class="nav-toggle-label">
                        ${section.icon ? `<i class="${section.icon}"></i>` : ''}
                        ${section.title}
                    </span>
                    <i class="fa-solid fa-chevron-right toggle-icon"></i>
                `;
                toggle.addEventListener('click', () => this.toggleSection(section.title, toggle));
                sectionEl.appendChild(toggle);
            }
            
            // Items list
            const list = document.createElement('ul');
            list.className = `nav-list ${level > 0 ? 'nav-nested' : ''}`;
            list.style.display = isExpanded || level === 0 ? 'block' : 'none';
            
            for (const item of section.items) {
                if (item.items) {
                    // Nested section
                    const nested = this.renderSection(item, level + 1);
                    list.appendChild(nested);
                } else {
                    // Regular item
                    const li = document.createElement('li');
                    li.className = 'nav-item';
                    
                    const link = document.createElement('a');
                    link.className = 'nav-link';
                    link.href = `#${item.path}`;
                    link.dataset.path = item.path;
                    link.innerHTML = `
                        ${item.icon ? `<i class="${item.icon}"></i>` : ''}
                        <span class="nav-link-text">${item.title}</span>
                        ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
                    `;
                    
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.onNavigate(item.path);
                    });
                    
                    li.appendChild(link);
                    list.appendChild(li);
                }
            }
            
            sectionEl.appendChild(list);
            
            if (isExpanded) {
                this.expandedSections.add(section.title);
            }
        }
        
        return sectionEl;
    }
    
    toggleSection(title, toggleEl) {
        const isExpanded = this.expandedSections.has(title);
        const list = toggleEl.nextElementSibling;
        
        if (isExpanded) {
            this.expandedSections.delete(title);
            toggleEl.classList.remove('expanded');
            list.style.display = 'none';
        } else {
            this.expandedSections.add(title);
            toggleEl.classList.add('expanded');
            list.style.display = 'block';
        }
        
        this.saveExpandedState();
    }
    
    setActive(path) {
        // Remove previous active
        const previousActive = this.container?.querySelector('.nav-link.active');
        if (previousActive) {
            previousActive.classList.remove('active');
        }
        
        // Set new active
        const activeLink = this.container?.querySelector(`.nav-link[data-path="${path}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
            
            // Expand parent sections if collapsed
            this.expandParents(activeLink);
            
            // Scroll into view if needed
            activeLink.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
    
    expandParents(element) {
        let parent = element.parentElement;
        while (parent && parent !== this.container) {
            if (parent.classList.contains('nav-list') && parent.classList.contains('nav-nested')) {
                parent.style.display = 'block';
                const toggle = parent.previousElementSibling;
                if (toggle?.classList.contains('nav-toggle')) {
                    toggle.classList.add('expanded');
                    const section = parent.closest('.nav-section');
                    if (section?.dataset.section) {
                        this.expandedSections.add(section.dataset.section);
                    }
                }
            }
            parent = parent.parentElement;
        }
        this.saveExpandedState();
    }
}
