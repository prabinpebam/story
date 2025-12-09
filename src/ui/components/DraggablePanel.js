/**
 * DraggablePanel.js
 * A reusable draggable and resizable panel component.
 * Used as a base class for Color Theme Manager, Typography Style Manager, etc.
 */

import { Icons } from '../Icons.js';
import { Button } from './Button.js';

export class DraggablePanel {
    constructor(options = {}) {
        this.options = {
            id: 'panel',
            title: 'Panel',
            defaultWidth: 320,
            defaultHeight: 480,
            minWidth: 280,
            minHeight: 300,
            maxWidth: 600,
            maxHeight: 900,
            resizable: true,
            closable: true,
            minimizable: true,
            defaultPosition: null, // { x, y } or null for center
            ...options
        };
        
        this.isOpen = false;
        this.isMinimized = false;
        this.isDragging = false;
        this.isResizing = false;
        this.resizeDirection = null;
        
        this.position = { x: 0, y: 0 };
        this.size = { 
            width: this.options.defaultWidth, 
            height: this.options.defaultHeight 
        };
        
        this.element = null;
        this.headerElement = null;
        this.contentElement = null;
        this.resizeHandles = {};
        this.closeAnimation = null; // Track close animation to cancel if re-opened
        
        // Bound handlers for event cleanup
        this.boundHandleDragMove = this.handleDragMove.bind(this);
        this.boundHandleDragEnd = this.handleDragEnd.bind(this);
        this.boundHandleResizeMove = this.handleResizeMove.bind(this);
        this.boundHandleResizeEnd = this.handleResizeEnd.bind(this);
        
        this.createElement();
        this.loadPosition();
    }

    createElement() {
        // Main panel container
        this.element = document.createElement('div');
        this.element.className = 'draggable-panel hidden'; // Start hidden
        this.element.id = `panel-${this.options.id}`;
        // Dynamic min/max sizes need inline styles
        this.element.style.minWidth = `${this.options.minWidth}px`;
        this.element.style.minHeight = `${this.options.minHeight}px`;
        this.element.style.maxWidth = `${this.options.maxWidth}px`;
        this.element.style.maxHeight = `${this.options.maxHeight}px`;
        
        // Header
        this.headerElement = this.createHeader();
        this.element.appendChild(this.headerElement);
        
        // Content area
        this.contentElement = document.createElement('div');
        this.contentElement.className = 'draggable-panel-content';
        this.element.appendChild(this.contentElement);
        
        // Resize handles (if resizable)
        if (this.options.resizable) {
            this.createResizeHandles();
        }
        
        // Append to body
        document.body.appendChild(this.element);
    }

    createHeader() {
        const header = document.createElement('div');
        header.className = 'draggable-panel-header';
        
        // Title
        const title = document.createElement('span');
        title.className = 'draggable-panel-title';
        title.textContent = this.options.title;
        header.appendChild(title);
        
        // Header buttons container
        const buttons = document.createElement('div');
        buttons.className = 'draggable-panel-buttons';
        
        // Minimize button
        if (this.options.minimizable) {
            const minimizeBtn = this.createHeaderButton(Icons.MINUS || '−', 'Minimize', () => this.toggleMinimize());
            buttons.appendChild(minimizeBtn);
        }
        
        // Close button
        if (this.options.closable) {
            const closeBtn = this.createHeaderButton(Icons.CLOSE || '×', 'Close', () => this.close());
            buttons.appendChild(closeBtn);
        }
        
        header.appendChild(buttons);
        
        // Drag events
        header.addEventListener('mousedown', (e) => this.handleDragStart(e));
        
        return header;
    }

    createHeaderButton(icon, title, onClick) {
        const btn = new Button({
            icon,
            title,
            ariaLabel: title,
            variant: 'text',
            size: 'xs',
            className: 'draggable-panel-btn',
            onClick: (e) => {
                e.stopPropagation();
                onClick();
            }
        });
        
        return btn.element;
    }

    createResizeHandles() {
        const directions = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
        
        directions.forEach(dir => {
            const handle = document.createElement('div');
            handle.className = `resize-handle resize-${dir}`;
            
            handle.addEventListener('mousedown', (e) => this.handleResizeStart(e, dir));
            this.element.appendChild(handle);
            this.resizeHandles[dir] = handle;
        });
    }

    // --- Drag Handling ---
    handleDragStart(e) {
        if (e.target.closest('.draggable-panel-btn')) return;
        
        this.isDragging = true;
        this.dragStartX = e.clientX - this.position.x;
        this.dragStartY = e.clientY - this.position.y;
        
        this.headerElement.classList.add('grabbing');
        document.addEventListener('mousemove', this.boundHandleDragMove);
        document.addEventListener('mouseup', this.boundHandleDragEnd);
        
        this.bringToFront();
        e.preventDefault();
    }

    handleDragMove(e) {
        if (!this.isDragging) return;
        
        let newX = e.clientX - this.dragStartX;
        let newY = e.clientY - this.dragStartY;
        
        // Constrain to viewport
        const maxX = window.innerWidth - this.size.width;
        const maxY = window.innerHeight - this.size.height;
        
        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));
        
        this.position.x = newX;
        this.position.y = newY;
        this.updatePosition();
    }

    handleDragEnd() {
        this.isDragging = false;
        this.headerElement.classList.remove('grabbing');
        document.removeEventListener('mousemove', this.boundHandleDragMove);
        document.removeEventListener('mouseup', this.boundHandleDragEnd);
        this.savePosition();
    }

    // --- Resize Handling ---
    handleResizeStart(e, direction) {
        this.isResizing = true;
        this.resizeDirection = direction;
        this.resizeStartX = e.clientX;
        this.resizeStartY = e.clientY;
        this.resizeStartWidth = this.size.width;
        this.resizeStartHeight = this.size.height;
        this.resizeStartPosX = this.position.x;
        this.resizeStartPosY = this.position.y;
        
        document.addEventListener('mousemove', this.boundHandleResizeMove);
        document.addEventListener('mouseup', this.boundHandleResizeEnd);
        
        this.bringToFront();
        e.preventDefault();
        e.stopPropagation();
    }

    handleResizeMove(e) {
        if (!this.isResizing) return;
        
        const deltaX = e.clientX - this.resizeStartX;
        const deltaY = e.clientY - this.resizeStartY;
        
        let newWidth = this.resizeStartWidth;
        let newHeight = this.resizeStartHeight;
        let newX = this.resizeStartPosX;
        let newY = this.resizeStartPosY;
        
        // Handle each direction
        if (this.resizeDirection.includes('e')) {
            newWidth = this.resizeStartWidth + deltaX;
        }
        if (this.resizeDirection.includes('w')) {
            newWidth = this.resizeStartWidth - deltaX;
            newX = this.resizeStartPosX + deltaX;
        }
        if (this.resizeDirection.includes('s')) {
            newHeight = this.resizeStartHeight + deltaY;
        }
        if (this.resizeDirection.includes('n')) {
            newHeight = this.resizeStartHeight - deltaY;
            newY = this.resizeStartPosY + deltaY;
        }
        
        // Apply constraints
        newWidth = Math.max(this.options.minWidth, Math.min(newWidth, this.options.maxWidth));
        newHeight = Math.max(this.options.minHeight, Math.min(newHeight, this.options.maxHeight));
        
        // Adjust position if resizing from left or top
        if (this.resizeDirection.includes('w')) {
            newX = this.resizeStartPosX + (this.resizeStartWidth - newWidth);
        }
        if (this.resizeDirection.includes('n')) {
            newY = this.resizeStartPosY + (this.resizeStartHeight - newHeight);
        }
        
        // Constrain to viewport
        newX = Math.max(0, newX);
        newY = Math.max(0, newY);
        
        this.size.width = newWidth;
        this.size.height = newHeight;
        this.position.x = newX;
        this.position.y = newY;
        
        this.updateSize();
        this.updatePosition();
    }

    handleResizeEnd() {
        this.isResizing = false;
        this.resizeDirection = null;
        document.removeEventListener('mousemove', this.boundHandleResizeMove);
        document.removeEventListener('mouseup', this.boundHandleResizeEnd);
        this.savePosition();
    }

    // --- Position & Size ---
    updatePosition() {
        this.element.style.left = `${this.position.x}px`;
        this.element.style.top = `${this.position.y}px`;
    }

    updateSize() {
        this.element.style.width = `${this.size.width}px`;
        this.element.style.height = this.isMinimized ? 'auto' : `${this.size.height}px`;
    }

    centerInViewport() {
        this.position.x = (window.innerWidth - this.size.width) / 2;
        this.position.y = (window.innerHeight - this.size.height) / 2;
        this.updatePosition();
    }

    // --- localStorage Persistence ---
    getStorageKey() {
        return `draggablePanel_${this.options.id}`;
    }

    savePosition() {
        try {
            const data = {
                x: this.position.x,
                y: this.position.y,
                width: this.size.width,
                height: this.size.height,
                isMinimized: this.isMinimized
            };
            localStorage.setItem(this.getStorageKey(), JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save panel position:', e);
        }
    }

    loadPosition() {
        try {
            const saved = localStorage.getItem(this.getStorageKey());
            if (saved) {
                const data = JSON.parse(saved);
                this.position.x = data.x ?? this.position.x;
                this.position.y = data.y ?? this.position.y;
                this.size.width = data.width ?? this.size.width;
                this.size.height = data.height ?? this.size.height;
                this.isMinimized = data.isMinimized ?? false;
                
                // Validate position is within viewport
                this.constrainToViewport();
            } else if (this.options.defaultPosition) {
                this.position.x = this.options.defaultPosition.x;
                this.position.y = this.options.defaultPosition.y;
            } else {
                this.centerInViewport();
            }
        } catch (e) {
            console.warn('Failed to load panel position:', e);
            this.centerInViewport();
        }
    }

    constrainToViewport() {
        const maxX = window.innerWidth - this.size.width;
        const maxY = window.innerHeight - this.size.height;
        
        this.position.x = Math.max(0, Math.min(this.position.x, maxX));
        this.position.y = Math.max(0, Math.min(this.position.y, maxY));
    }

    // --- Public API ---
    open() {
        if (this.isOpen) {
            this.bringToFront();
            return;
        }
        
        // Cancel any pending close animation that might re-add 'hidden'
        if (this.closeAnimation) {
            this.closeAnimation.cancel();
            this.closeAnimation = null;
        }
        
        this.isOpen = true;
        this.element.classList.remove('hidden');
        
        // Ensure panel is within viewport bounds before showing
        this.constrainToViewport();
        this.updatePosition();
        this.updateSize();
        this.bringToFront();
        
        // Animation
        this.element.animate([
            { opacity: 0, transform: 'scale(0.95)' },
            { opacity: 1, transform: 'scale(1)' }
        ], { duration: 150, easing: 'ease-out' });
        
        this.onOpen();
    }

    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        this.savePosition();
        
        // Animation
        this.closeAnimation = this.element.animate([
            { opacity: 1, transform: 'scale(1)' },
            { opacity: 0, transform: 'scale(0.95)' }
        ], { duration: 100, easing: 'ease-in' });
        
        this.closeAnimation.onfinish = () => {
            // Only add hidden if still closed (wasn't re-opened during animation)
            if (!this.isOpen) {
                this.element.classList.add('hidden');
            }
            this.closeAnimation = null;
        };
        
        this.onClose();
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        this.contentElement.classList.toggle('hidden', this.isMinimized);
        this.updateSize();
        
        // Hide/show resize handles when minimized
        Object.values(this.resizeHandles).forEach(handle => {
            handle.classList.toggle('hidden', this.isMinimized);
        });
        
        this.savePosition();
    }

    bringToFront() {
        // Get highest z-index among all panels
        const panels = document.querySelectorAll('.draggable-panel');
        let maxZ = 1000;
        panels.forEach(panel => {
            const z = parseInt(panel.style.zIndex) || 1000;
            if (z > maxZ) maxZ = z;
        });
        this.element.style.zIndex = maxZ + 1;
    }

    // --- Content Management ---
    setContent(content) {
        this.contentElement.innerHTML = '';
        if (typeof content === 'string') {
            this.contentElement.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            this.contentElement.appendChild(content);
        }
    }

    appendContent(content) {
        if (typeof content === 'string') {
            this.contentElement.insertAdjacentHTML('beforeend', content);
        } else if (content instanceof HTMLElement) {
            this.contentElement.appendChild(content);
        }
    }

    setTitle(title) {
        const titleEl = this.headerElement.querySelector('.draggable-panel-title');
        if (titleEl) {
            titleEl.textContent = title;
        }
    }

    // --- Lifecycle Hooks (override in subclasses) ---
    onOpen() {
        // Override in subclass
    }

    onClose() {
        // Override in subclass
    }

    // --- Cleanup ---
    destroy() {
        document.removeEventListener('mousemove', this.boundHandleDragMove);
        document.removeEventListener('mouseup', this.boundHandleDragEnd);
        document.removeEventListener('mousemove', this.boundHandleResizeMove);
        document.removeEventListener('mouseup', this.boundHandleResizeEnd);
        
        if (this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

export default DraggablePanel;
