/**
 * FillLayerBar.js
 * A horizontal bar displaying fill layer swatches for the Code Fill Panel.
 * Code fills are selectable, non-code fills are shown but disabled.
 */

import { Icons } from '../../Icons.js';
import { FillSwatch } from './FillSwatch.js';

export class FillLayerBar {
    constructor(options = {}) {
        this.fills = options.fills || [];
        this.selectedIndex = options.selectedIndex ?? -1;
        this.onSelect = options.onSelect || (() => {});
        this.onAdd = options.onAdd || (() => {});
        this.onDelete = options.onDelete || (() => {});
        this.onReorder = options.onReorder || (() => {});
        this.onDuplicate = options.onDuplicate || (() => {});
        
        this.swatches = [];
        this.contextMenu = null;
        this.draggedIndex = -1;
        this.dragOverIndex = -1;
        
        this.element = document.createElement('div');
        this.element.className = 'cfp-fill-layer-bar';
        
        this.render();
    }

    render() {
        this.element.innerHTML = '';
        this.destroySwatches();
        
        // Create swatches for each fill
        this.fills.forEach((fill, index) => {
            const swatch = new FillSwatch({
                fill,
                index,
                isSelected: index === this.selectedIndex,
                isDisabled: fill.type !== 'code',
                onClick: () => this.handleSwatchClick(index),
                onContextMenu: (e) => this.handleContextMenu(e, index),
                onDragStart: (e) => this.handleDragStart(e, index),
                onDragOver: (e) => this.handleDragOver(e, index),
                onDragEnd: (e) => this.handleDragEnd(e),
                onDrop: (e) => this.handleDrop(e, index)
            });
            
            this.swatches.push(swatch);
            this.element.appendChild(swatch.element);
        });
        
        // Add button
        const addBtn = document.createElement('button');
        addBtn.className = 'cfp-fill-add-btn';
        addBtn.innerHTML = '+';
        addBtn.title = 'Add code fill';
        addBtn.onclick = () => this.onAdd();
        this.element.appendChild(addBtn);
    }

    handleSwatchClick(index) {
        const fill = this.fills[index];
        if (fill && fill.type === 'code') {
            this.onSelect(index);
        }
    }

    handleContextMenu(e, index) {
        const fill = this.fills[index];
        if (!fill || fill.type !== 'code') return;
        
        e.preventDefault();
        this.showContextMenu(e, index);
    }

    showContextMenu(e, index) {
        // Remove existing menu
        this.hideContextMenu();
        
        const isFirst = index === 0;
        const isLast = index === this.fills.length - 1;
        
        const menu = document.createElement('div');
        menu.className = 'cfp-context-menu';
        
        const items = [
            { 
                label: '↑ Move Up', 
                action: () => this.moveFill(index, index - 1),
                disabled: isFirst
            },
            { 
                label: '↓ Move Down', 
                action: () => this.moveFill(index, index + 1),
                disabled: isLast
            },
            { type: 'divider' },
            { 
                label: '⎘ Duplicate', 
                action: () => {
                    this.hideContextMenu();
                    this.onDuplicate(index);
                }
            },
            { type: 'divider' },
            { 
                label: '🗑 Delete', 
                action: () => this.confirmDelete(index),
                danger: true
            }
        ];
        
        items.forEach(item => {
            if (item.type === 'divider') {
                const divider = document.createElement('div');
                divider.className = 'cfp-context-divider';
                menu.appendChild(divider);
            } else {
                const menuItem = document.createElement('div');
                menuItem.className = 'cfp-context-item' + 
                    (item.danger ? ' danger' : '') +
                    (item.disabled ? ' disabled' : '');
                menuItem.textContent = item.label;
                
                if (!item.disabled) {
                    menuItem.onclick = () => {
                        this.hideContextMenu();
                        item.action();
                    };
                }
                
                menu.appendChild(menuItem);
            }
        });
        
        // Position menu
        menu.style.position = 'fixed';
        menu.style.left = `${e.clientX}px`;
        menu.style.top = `${e.clientY}px`;
        menu.style.zIndex = '10001';
        
        document.body.appendChild(menu);
        this.contextMenu = menu;
        
        // Close on click outside
        const closeHandler = (e) => {
            if (!menu.contains(e.target)) {
                this.hideContextMenu();
                document.removeEventListener('click', closeHandler);
            }
        };
        setTimeout(() => document.addEventListener('click', closeHandler), 0);
    }

    hideContextMenu() {
        if (this.contextMenu) {
            this.contextMenu.remove();
            this.contextMenu = null;
        }
    }

    moveFill(fromIndex, toIndex) {
        if (toIndex < 0 || toIndex >= this.fills.length) return;
        this.onReorder(fromIndex, toIndex);
    }

    confirmDelete(index) {
        // Could add confirmation dialog, but for now just delete
        this.onDelete(index);
    }

    // Drag and drop for reordering
    handleDragStart(e, index) {
        const fill = this.fills[index];
        if (fill.type !== 'code') {
            e.preventDefault();
            return;
        }
        
        this.draggedIndex = index;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
        
        // Add dragging class
        setTimeout(() => {
            this.swatches[index]?.element.classList.add('dragging');
        }, 0);
    }

    handleDragOver(e, index) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        if (this.draggedIndex === -1) return;
        if (index === this.draggedIndex) return;
        
        // Update visual indicator
        this.swatches.forEach((s, i) => {
            s.element.classList.remove('drag-over-left', 'drag-over-right');
            if (i === index) {
                if (this.draggedIndex < index) {
                    s.element.classList.add('drag-over-right');
                } else {
                    s.element.classList.add('drag-over-left');
                }
            }
        });
        
        this.dragOverIndex = index;
    }

    handleDragEnd(e) {
        this.swatches.forEach(s => {
            s.element.classList.remove('dragging', 'drag-over-left', 'drag-over-right');
        });
        
        this.draggedIndex = -1;
        this.dragOverIndex = -1;
    }

    handleDrop(e, index) {
        e.preventDefault();
        
        if (this.draggedIndex === -1 || this.draggedIndex === index) return;
        
        this.onReorder(this.draggedIndex, index);
        this.handleDragEnd(e);
    }

    destroySwatches() {
        this.swatches.forEach(s => s.destroy());
        this.swatches = [];
    }

    destroy() {
        this.hideContextMenu();
        this.destroySwatches();
    }
}

export default FillLayerBar;
