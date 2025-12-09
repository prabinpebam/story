import { store } from '../core/Store.js';
import { contextMenuManager, assetIconConfig } from './components/ContextMenu/index.js';

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
        // Register context menu zone
        contextMenuManager.register(assetIconConfig);
        
        this.render();
    }

    render() {
        this.container.innerHTML = '';
        
        // Search Input
        const searchContainer = document.createElement('div');
        searchContainer.className = 'icon-library-search-container';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search icons...';
        searchInput.className = 'icon-library-search-input';
        
        searchInput.addEventListener('input', (e) => this.filterIcons(e.target.value));
        
        searchContainer.appendChild(searchInput);
        this.container.appendChild(searchContainer);

        // Grid
        this.grid = document.createElement('div');
        this.grid.className = 'icon-library-grid';
        
        this.renderIcons(this.icons);
        this.container.appendChild(this.grid);
    }

    renderIcons(iconList) {
        this.grid.innerHTML = '';
        iconList.forEach(iconClass => {
            const item = document.createElement('div');
            item.className = 'icon-item';
            
            item.innerHTML = `<i class="${iconClass}"></i>`;
            item.draggable = true;
            
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('application/story-icon', JSON.stringify({ iconClass }));
                e.dataTransfer.effectAllowed = 'copy';
            });
            
            // Right-click context menu
            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                contextMenuManager.show('asset-icon', e.clientX, e.clientY, {
                    iconClass,
                    iconElement: item
                });
            });

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
