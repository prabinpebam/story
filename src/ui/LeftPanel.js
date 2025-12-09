import { store } from '../core/Store.js';

/**
 * LeftPanel.js
 * Manages the accordion-style collapsible panels for Slides/Masters and Layers.
 * Features:
 * - Both sections can be collapsed independently
 * - If one is collapsed, the other expands to fill available space
 * - If both are expanded, height is split (adjustable via drag)
 * - Split ratio is saved to localStorage
 */
export class LeftPanel {
    constructor() {
        this.container = document.querySelector('.sidebar-content');
        this.slideListContainer = document.getElementById('slide-list');
        this.layerTreeContainer = document.getElementById('layer-tree');
        
        // State
        this.slidesExpanded = true;
        this.layersExpanded = true;
        this.splitRatio = 0.5; // 50/50 by default
        
        // Load saved state from localStorage
        this.loadState();
        
        // Build the accordion structure
        this.init();
    }
    
    loadState() {
        try {
            const savedState = localStorage.getItem('leftPanelState');
            if (savedState) {
                const state = JSON.parse(savedState);
                this.slidesExpanded = state.slidesExpanded !== false;
                this.layersExpanded = state.layersExpanded !== false;
                this.splitRatio = state.splitRatio || 0.5;
            }
        } catch (e) {
            console.warn('Could not load left panel state:', e);
        }
    }
    
    saveState() {
        try {
            localStorage.setItem('leftPanelState', JSON.stringify({
                slidesExpanded: this.slidesExpanded,
                layersExpanded: this.layersExpanded,
                splitRatio: this.splitRatio
            }));
        } catch (e) {
            console.warn('Could not save left panel state:', e);
        }
    }
    
    init() {
        // Clear and restructure the sidebar content
        this.container.innerHTML = '';
        // Container styles are defined in CSS class .sidebar-content
        
        // Create Slides/Masters section
        this.slidesSection = this.createSection('slides', 'SLIDES', this.slidesExpanded);
        this.container.appendChild(this.slidesSection.wrapper);
        
        // Create resizer
        this.resizer = document.createElement('div');
        this.resizer.className = 'panel-resizer';
        this.container.appendChild(this.resizer);
        
        // Create Layers section
        this.layersSection = this.createSection('layers', 'LAYERS', this.layersExpanded);
        this.container.appendChild(this.layersSection.wrapper);
        
        // Move original containers into sections
        this.slidesSection.content.appendChild(this.slideListContainer);
        this.layersSection.content.appendChild(this.layerTreeContainer);
        
        // Setup resizer drag
        this.setupResizer();
        
        // Apply initial layout
        this.updateLayout();
        
        // Listen for mode changes to update title
        store.on('state-changed', () => this.updateSlidesTitle());
    }
    
    createSection(id, title, expanded) {
        const wrapper = document.createElement('div');
        wrapper.className = `accordion-section ${expanded ? 'expanded' : 'collapsed'}`;
        wrapper.dataset.section = id;
        
        // Header
        const header = document.createElement('div');
        header.className = 'accordion-header';
        
        const chevron = document.createElement('i');
        chevron.className = `fa-solid fa-chevron-${expanded ? 'down' : 'right'} accordion-chevron`;
        
        const titleEl = document.createElement('span');
        titleEl.className = 'accordion-title';
        titleEl.textContent = title;
        
        header.appendChild(chevron);
        header.appendChild(titleEl);
        
        // Content
        const content = document.createElement('div');
        content.className = 'accordion-content';
        
        wrapper.appendChild(header);
        wrapper.appendChild(content);
        
        // Click handler
        header.addEventListener('click', () => this.toggleSection(id));
        
        return { wrapper, header, content, chevron, titleEl };
    }
    
    toggleSection(sectionId) {
        if (sectionId === 'slides') {
            this.slidesExpanded = !this.slidesExpanded;
            this.slidesSection.wrapper.classList.toggle('expanded', this.slidesExpanded);
            this.slidesSection.wrapper.classList.toggle('collapsed', !this.slidesExpanded);
            this.slidesSection.chevron.className = `fa-solid fa-chevron-${this.slidesExpanded ? 'down' : 'right'} accordion-chevron`;
        } else {
            this.layersExpanded = !this.layersExpanded;
            this.layersSection.wrapper.classList.toggle('expanded', this.layersExpanded);
            this.layersSection.wrapper.classList.toggle('collapsed', !this.layersExpanded);
            this.layersSection.chevron.className = `fa-solid fa-chevron-${this.layersExpanded ? 'down' : 'right'} accordion-chevron`;
        }
        
        this.updateLayout();
        this.saveState();
    }
    
    updateLayout() {
        const bothExpanded = this.slidesExpanded && this.layersExpanded;
        const noneExpanded = !this.slidesExpanded && !this.layersExpanded;
        
        // Show/hide resizer using hidden class
        this.resizer.classList.toggle('hidden', !bothExpanded);
        
        if (noneExpanded) {
            // Both collapsed - just show headers
            this.slidesSection.wrapper.style.flex = '0 0 auto';
            this.layersSection.wrapper.style.flex = '0 0 auto';
            this.slidesSection.content.classList.add('hidden');
            this.layersSection.content.classList.add('hidden');
        } else if (bothExpanded) {
            // Both expanded - use split ratio
            this.slidesSection.wrapper.style.flex = `${this.splitRatio} 1 0`;
            this.layersSection.wrapper.style.flex = `${1 - this.splitRatio} 1 0`;
            this.slidesSection.content.classList.remove('hidden');
            this.layersSection.content.classList.remove('hidden');
        } else if (this.slidesExpanded) {
            // Only slides expanded
            this.slidesSection.wrapper.style.flex = '1 1 0';
            this.layersSection.wrapper.style.flex = '0 0 auto';
            this.slidesSection.content.classList.remove('hidden');
            this.layersSection.content.classList.add('hidden');
        } else {
            // Only layers expanded
            this.slidesSection.wrapper.style.flex = '0 0 auto';
            this.layersSection.wrapper.style.flex = '1 1 0';
            this.slidesSection.content.classList.add('hidden');
            this.layersSection.content.classList.remove('hidden');
        }
    }
    
    setupResizer() {
        let startY = 0;
        let startRatio = 0;
        let containerHeight = 0;
        
        const onMouseMove = (e) => {
            const delta = e.clientY - startY;
            const headerHeight = 32; // Approximate header height
            const availableHeight = containerHeight - (headerHeight * 2) - 8; // Account for headers and resizer
            
            if (availableHeight > 0) {
                const deltaRatio = delta / availableHeight;
                this.splitRatio = Math.max(0.15, Math.min(0.85, startRatio + deltaRatio));
                this.updateLayout();
            }
        };
        
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            this.saveState();
        };
        
        this.resizer.addEventListener('mousedown', (e) => {
            e.preventDefault();
            startY = e.clientY;
            startRatio = this.splitRatio;
            containerHeight = this.container.offsetHeight;
            
            document.body.style.cursor = 'row-resize';
            document.body.style.userSelect = 'none';
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }
    
    updateSlidesTitle() {
        const state = store.getState();
        const title = state.editor.mode === 'master' ? 'MASTERS' : 'SLIDES';
        this.slidesSection.titleEl.textContent = title;
    }
}
