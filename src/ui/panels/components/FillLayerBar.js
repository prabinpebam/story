/**
 * FillLayerBar.js
 * A horizontal bar displaying fill layer swatches for the Code Fill Panel.
 * Code fills are selectable, non-code fills are shown but disabled.
 */

import { Icons } from '../../Icons.js';
import { FillSwatch } from './FillSwatch.js';
import { contextMenuManager, fillLayerConfig } from '../../components/ContextMenu/index.js';

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
        this.draggedIndex = -1;
        this.dragOverIndex = -1;
        
        this.element = document.createElement('div');
        this.element.className = 'cfp-fill-layer-bar';
        
        // Register context menu zone (only once per class)
        if (!FillLayerBar._contextMenuRegistered) {
            contextMenuManager.register(fillLayerConfig);
            FillLayerBar._contextMenuRegistered = true;
        }
        
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
        
        // Show context menu via manager
        contextMenuManager.show('fill-layer', e.clientX, e.clientY, {
            index,
            fill,
            totalFills: this.fills.length,
            onReorder: (from, to) => this.onReorder(from, to),
            onDuplicate: (idx) => this.onDuplicate(idx),
            onDelete: (idx) => this.onDelete(idx)
        });
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
        // Context menu cleanup is handled by ContextMenuManager
        this.destroySwatches();
    }
}

export default FillLayerBar;
