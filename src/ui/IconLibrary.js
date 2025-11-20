import { store } from '../core/Store.js';

export class IconLibrary {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.icons = [
            // Arrows
            'fa-solid fa-arrow-right', 'fa-solid fa-arrow-left', 'fa-solid fa-arrow-up', 'fa-solid fa-arrow-down',
            'fa-solid fa-chevron-right', 'fa-solid fa-chevron-left', 'fa-solid fa-caret-down',
            // Shapes
            'fa-solid fa-circle', 'fa-solid fa-square', 'fa-solid fa-star', 'fa-solid fa-heart',
            'fa-solid fa-play', 'fa-solid fa-pause', 'fa-solid fa-stop',
            // UI
            'fa-solid fa-user', 'fa-solid fa-gear', 'fa-solid fa-magnifying-glass', 'fa-solid fa-bars',
            'fa-solid fa-check', 'fa-solid fa-xmark', 'fa-solid fa-trash', 'fa-solid fa-pen',
            'fa-solid fa-envelope', 'fa-solid fa-phone', 'fa-solid fa-location-dot',
            // Social / Brands (using fa-brands)
            'fa-brands fa-github', 'fa-brands fa-twitter', 'fa-brands fa-instagram', 'fa-brands fa-linkedin',
            'fa-brands fa-google', 'fa-brands fa-apple', 'fa-brands fa-windows'
        ];
        this.init();
    }

    init() {
        this.render();
    }

    render() {
        this.container.innerHTML = '';
        
        // Search Input
        const searchContainer = document.createElement('div');
        searchContainer.style.padding = '8px';
        searchContainer.style.borderBottom = '1px solid var(--border-color)';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search icons...';
        searchInput.style.width = '100%';
        searchInput.style.padding = '6px';
        searchInput.style.background = 'var(--color-bg-well)';
        searchInput.style.border = 'none';
        searchInput.style.color = 'var(--color-text-primary)';
        searchInput.style.fontSize = '12px';
        searchInput.style.borderRadius = '4px';
        
        searchInput.addEventListener('input', (e) => this.filterIcons(e.target.value));
        
        searchContainer.appendChild(searchInput);
        this.container.appendChild(searchContainer);

        // Grid
        this.grid = document.createElement('div');
        this.grid.style.display = 'grid';
        this.grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
        this.grid.style.gap = '8px';
        this.grid.style.padding = '8px';
        this.grid.style.overflowY = 'auto';
        this.grid.style.maxHeight = '300px'; // Limit height or let it grow
        
        this.renderIcons(this.icons);
        this.container.appendChild(this.grid);
    }

    renderIcons(iconList) {
        this.grid.innerHTML = '';
        iconList.forEach(iconClass => {
            const item = document.createElement('div');
            item.className = 'icon-item';
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.justifyContent = 'center';
            item.style.aspectRatio = '1';
            item.style.background = 'var(--color-bg-well)';
            item.style.borderRadius = '4px';
            item.style.cursor = 'grab';
            item.style.fontSize = '16px';
            item.style.color = 'var(--color-text-primary)';
            
            item.innerHTML = `<i class="${iconClass}"></i>`;
            item.draggable = true;
            
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('application/story-icon', JSON.stringify({ iconClass }));
                e.dataTransfer.effectAllowed = 'copy';
            });
            
            // Hover effect
            item.onmouseenter = () => item.style.background = 'var(--te-blue)';
            item.onmouseenter = () => item.style.color = 'white';
            item.onmouseleave = () => {
                item.style.background = 'var(--color-bg-well)';
                item.style.color = 'var(--color-text-primary)';
            };

            this.grid.appendChild(item);
        });
    }

    filterIcons(query) {
        if (!query) {
            this.renderIcons(this.icons);
            return;
        }
        const filtered = this.icons.filter(icon => icon.includes(query.toLowerCase()));
        this.renderIcons(filtered);
    }
}
