/**
 * SidebarResizer
 * 
 * Handles resize functionality for the left sidebar.
 * Uses CSS custom properties for responsive width management.
 * 
 * Design System Compliance:
 * - Uses --sidebar-width CSS variable
 * - Proper cursor states
 * - Smooth drag interaction
 */

export class SidebarResizer {
    constructor() {
        this.sidebar = document.getElementById('sidebar-left');
        this.app = document.getElementById('app');
        this.isDragging = false;
        this.minWidth = 200;
        this.maxWidth = 400;
        
        this.init();
    }
    
    init() {
        if (!this.sidebar) return;
        
        // Get initial width from CSS variable
        const currentWidth = getComputedStyle(document.documentElement)
            .getPropertyValue('--sidebar-width')
            .trim();
        this.currentWidth = parseInt(currentWidth) || 240;
        
        this.bindEvents();
    }
    
    bindEvents() {
        // Use the ::after pseudo-element as the resize handle
        // We'll listen on the entire sidebar but check if we're near the right edge
        this.sidebar.addEventListener('mousedown', (e) => {
            const rect = this.sidebar.getBoundingClientRect();
            const rightEdge = rect.right;
            const clickX = e.clientX;
            
            // Check if click is within 4px of the right edge (resize handle)
            if (rightEdge - clickX <= 4 && rightEdge - clickX >= 0) {
                this.startResize(e);
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.resize(e);
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.stopResize();
            }
        });
    }
    
    startResize(e) {
        this.isDragging = true;
        this.startX = e.clientX;
        this.startWidth = this.currentWidth;
        
        this.sidebar.classList.add('resizing');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        
        e.preventDefault();
    }
    
    resize(e) {
        const delta = e.clientX - this.startX;
        let newWidth = this.startWidth + delta;
        
        // Clamp to min/max
        newWidth = Math.max(this.minWidth, Math.min(this.maxWidth, newWidth));
        
        // Update CSS variable
        document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
        this.currentWidth = newWidth;
    }
    
    stopResize() {
        this.isDragging = false;
        this.sidebar.classList.remove('resizing');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }
}
