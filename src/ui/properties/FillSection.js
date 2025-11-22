import { Section } from '../components/Section.js';
import { ColorInput } from '../components/ColorInput.js';
import { NumberInput } from '../components/NumberInput.js';
import { IconButton } from '../components/IconButton.js';
import { Icons } from '../Icons.js';
import { store } from '../../core/Store.js';
import { FillFlyout } from '../components/FillFlyout/FillFlyout.js';
import { BlendModes } from '../../core/constants/BlendModes.js';

export class FillSection {
    constructor() {
        this.section = new Section({ 
            title: 'Fill',
            actions: [
                { icon: Icons.PLUS, title: 'Add Fill', onClick: () => this.addFill() }
            ]
        });
        this.container = document.createElement('div');
        this.container.className = 'pi-section-content';
        this.section.appendChild(this.container);
    }

    update(selection) {
        if (!selection || selection.length === 0) {
            this.section.element.style.display = 'none';
            return;
        }
        
        this.section.element.style.display = 'block';
        this.selection = selection;
        
        const state = store.getState();
        const element = this.getElement(state, selection[0]);
        
        if (element) {
            this.render(element);
        }
    }

    getElement(state, id) {
        const mode = state.editor.mode;
        if (mode === 'master') {
            const master = state.masters[state.editor.activeMasterId];
            return master?.elements[id];
        } else {
            const slide = state.slides[state.editor.activeSlideId];
            return slide?.elements[id];
        }
    }

    render(element) {
        this.container.innerHTML = '';
        
        const style = element.style || {};
        
        // Normalize fills:
        // If style.fills exists, use it.
        // Else if backgroundColor/fillType exists, create a single fill entry.
        // Else empty.
        let fills = [];
        if (style.fills && Array.isArray(style.fills)) {
            fills = style.fills;
        } else {
            // Migration / Legacy support
            const isTransparent = !style.backgroundColor || style.backgroundColor === 'transparent';
            const isHidden = style._fillEnabled === false;
            const hasLegacyFill = !isTransparent || isHidden || style.fillType;
            
            if (hasLegacyFill) {
                fills = [{
                    type: style.fillType || 'solid',
                    value: style.fillValue || style.backgroundColor || '#D9D9D9',
                    color: style.backgroundColor || '#D9D9D9', // For solid
                    opacity: 100, // Legacy assumed 100% or baked into color
                    visible: style._fillEnabled !== false
                }];
                // If hidden, restore saved color
                if (isHidden && style._savedFillColor) {
                    fills[0].color = style._savedFillColor;
                    fills[0].value = style._savedFillColor;
                }
            }
        }

        if (fills.length === 0) {
            this.section.setCollapsed(true);
            return;
        }
        
        this.section.setCollapsed(false);

        // Container for the list of fills
        const list = document.createElement('div');
        list.style.display = 'flex';
        list.style.flexDirection = 'column';
        list.style.gap = '8px';
        
        fills.forEach((fill, index) => {
            const row = this.createFillRow(element, fill, index, fills);
            list.appendChild(row);
        });
        
        this.container.appendChild(list);
    }

    createFillRow(element, fill, index, allFills) {
        const row = document.createElement('div');
        row.className = 'pi-row';
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.gap = '2px';
        row.style.height = '28px';
        row.dataset.index = index;

        // Drag Handle
        const dragHandle = document.createElement('div');
        dragHandle.innerHTML = Icons.DRAG_HANDLE;
        dragHandle.style.color = '#666';
        dragHandle.style.cursor = 'grab';
        dragHandle.style.fontSize = '12px';
        dragHandle.style.display = 'flex';
        dragHandle.style.alignItems = 'center';
        dragHandle.style.justifyContent = 'center';
        dragHandle.style.width = '16px';
        dragHandle.style.height = '100%';
        dragHandle.draggable = true;
        
        dragHandle.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', index);
            e.dataTransfer.setDragImage(row, 0, 0);
            row.style.opacity = '0.5';
            this.dragStartIndex = index;
            e.stopPropagation();
        });

        dragHandle.addEventListener('dragend', (e) => {
            row.style.opacity = '1';
            this.container.querySelectorAll('.pi-row').forEach(r => {
                r.style.borderTop = 'none';
                r.style.borderBottom = 'none';
            });
            this.dragStartIndex = null;
        });

        row.addEventListener('dragover', (e) => {
            e.preventDefault(); // Necessary to allow dropping
            e.dataTransfer.dropEffect = 'move';
            
            if (this.dragStartIndex === null || this.dragStartIndex === index) return;

            // Visual feedback
            const rect = row.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            
            if (e.clientY < midY) {
                row.style.borderTop = '2px solid #0055FF';
                row.style.borderBottom = 'none';
            } else {
                row.style.borderTop = 'none';
                row.style.borderBottom = '2px solid #0055FF';
            }
        });

        row.addEventListener('dragleave', () => {
            row.style.borderTop = 'none';
            row.style.borderBottom = 'none';
        });

        row.addEventListener('drop', (e) => {
            e.preventDefault();
            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
            let toIndex = index;
            
            // Calculate if dropping above or below
            const rect = row.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            
            if (e.clientY > midY) {
                // Dropped below this item
                // If moving down: from 0 to 2 (below 2) -> insert at 3? No.
                // If we are at index 2, and drop below, we want to be at index 3?
                // But splice logic is tricky.
                // Let's just say we want to insert AFTER this index.
                // But if we are moving down, the index shifts.
                // Let's simplify:
                // We want the target index in the NEW array.
            }
            
            // Actually, let's just use the visual indicator logic.
            // If borderTop, we drop BEFORE (index).
            // If borderBottom, we drop AFTER (index + 1).
            
            if (e.clientY > midY) {
                toIndex = index + 1;
            }
            
            if (fromIndex !== toIndex) {
                this.reorderFills(element, fromIndex, toIndex);
            }
            
            row.style.borderTop = 'none';
            row.style.borderBottom = 'none';
        });

        row.appendChild(dragHandle);

        // Combined Input Group (Swatch + Opacity)
        const combinedInput = document.createElement('div');
        combinedInput.style.flex = '1';
        combinedInput.style.display = 'flex';
        combinedInput.style.alignItems = 'center';
        combinedInput.style.border = '1px solid #444';
        combinedInput.style.borderRadius = '4px';
        combinedInput.style.height = '24px';
        combinedInput.style.overflow = 'hidden';
        combinedInput.style.backgroundColor = '#262626'; // Match input bg

        // 1. Color Swatch (Trigger for Flyout)
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch-trigger';
        swatch.style.width = '28px'; // Fixed width
        swatch.style.height = '100%';
        swatch.style.cursor = 'pointer';
        swatch.style.display = 'flex';
        swatch.style.alignItems = 'center';
        swatch.style.justifyContent = 'center';
        swatch.style.borderRight = '1px solid #444';
        
        // Preview
        const preview = document.createElement('div');
        preview.style.width = '14px';
        preview.style.height = '14px';
        preview.style.borderRadius = '2px';
        preview.style.border = '1px solid rgba(255,255,255,0.1)';
        
        if (fill.type === 'image') {
             preview.style.backgroundImage = `url(${fill.value})`;
             preview.style.backgroundSize = 'cover';
        } else if (fill.type === 'gradient') {
             preview.style.background = fill.value;
        } else if (fill.type === 'code') {
             preview.style.backgroundColor = '#333';
             preview.innerHTML = '<i class="fa-solid fa-code" style="font-size: 10px; color: #fff;"></i>';
        } else if (fill.type === 'video') {
             preview.style.backgroundColor = '#333';
             preview.innerHTML = '<i class="fa-solid fa-play" style="font-size: 10px; color: #fff;"></i>';
        } else {
             preview.style.backgroundColor = fill.color || fill.value || '#000000';
        }
        swatch.appendChild(preview);

        swatch.onclick = (e) => {
            e.stopPropagation();
            this.openFlyout(swatch, fill, index, element);
        };
        
        if (!fill.visible) {
            swatch.style.opacity = '0.5';
        }

        combinedInput.appendChild(swatch);

        // 2. Hex Input (Editable)
        const hexInput = document.createElement('input');
        hexInput.type = 'text';
        hexInput.style.flex = '1';
        hexInput.style.minWidth = '0';
        hexInput.style.border = 'none';
        hexInput.style.background = 'transparent';
        hexInput.style.color = '#ccc';
        hexInput.style.fontSize = '11px';
        hexInput.style.fontFamily = 'monospace';
        hexInput.style.padding = '0 6px';
        hexInput.spellcheck = false;
        
        if (fill.type === 'solid' || !fill.type) {
            hexInput.value = this.rgbToHex(fill.color || fill.value || '#000000').toUpperCase();
            hexInput.onchange = (e) => {
                let val = e.target.value.trim();
                if (!val.startsWith('#')) val = '#' + val;
                // Basic validation
                if (/^#[0-9A-F]{6}$/i.test(val) || /^#[0-9A-F]{3}$/i.test(val)) {
                    this.updateFill(element, index, { color: val });
                } else {
                    // Revert
                    e.target.value = this.rgbToHex(fill.color || fill.value || '#000000').toUpperCase();
                }
            };
        } else if (fill.type === 'code') {
            hexInput.value = 'Code Fill';
            hexInput.disabled = true;
        } else {
            hexInput.value = fill.type.charAt(0).toUpperCase() + fill.type.slice(1);
            hexInput.disabled = true;
        }
        
        if (!fill.visible) {
            hexInput.style.opacity = '0.5';
        }

        combinedInput.appendChild(hexInput);

        // Separator
        const separator = document.createElement('div');
        separator.style.width = '1px';
        separator.style.height = '100%';
        separator.style.backgroundColor = '#444';
        combinedInput.appendChild(separator);

        // Opacity Input
        // If opacity is stored separately (0-100), use it. 
        // If not, try to extract from color string (legacy migration).
        let opacityVal = fill.opacity;
        if (opacityVal === undefined) {
            opacityVal = this.getOpacity(fill.color || fill.value);
        }

        const opacityInput = new NumberInput({
            value: opacityVal,
            onChange: (val) => {
                this.updateFill(element, index, { opacity: val });
            },
            min: 0,
            max: 100,
            step: 1,
            units: '%',
            scrubbable: true
        });
        
        // Style opacity input to fit in group
        opacityInput.element.style.width = '50px';
        opacityInput.element.style.flex = '0 0 50px';
        opacityInput.element.style.border = 'none'; // Remove border
        opacityInput.element.style.background = 'transparent'; // Remove bg
        opacityInput.element.querySelector('input').style.padding = '0 4px';
        opacityInput.element.querySelector('input').style.textAlign = 'center';
        
        if (!fill.visible) {
            opacityInput.element.style.opacity = '0.5';
            opacityInput.element.style.pointerEvents = 'none';
        }

        combinedInput.appendChild(opacityInput.element);
        row.appendChild(combinedInput);

        // Button Group
        const buttonGroup = document.createElement('div');
        buttonGroup.style.display = 'flex';
        buttonGroup.style.alignItems = 'center';
        buttonGroup.style.gap = '0px'; // Minimize space
        buttonGroup.style.marginLeft = '4px';

        // Blend Mode Button
        const isNormalBlend = !fill.blendMode || fill.blendMode === 'normal';
        const blendBtn = new IconButton({
            icon: Icons.BLEND_MODE,
            title: `Blend Mode: ${fill.blendMode || 'Normal'}`,
            onClick: (e) => {
                // Find the button element (could be the icon or the button wrapper)
                const btn = e.target.closest('button') || e.target;
                this.openBlendModeMenu(btn, fill, index, element);
            }
        });
        blendBtn.element.style.color = isNormalBlend ? '#666' : '#0055FF'; // Blue if active
        blendBtn.element.style.width = '24px'; // Compact
        blendBtn.element.style.height = '24px';
        blendBtn.element.style.padding = '0';

        // Visibility Button
        const visIcon = !fill.visible ? Icons.HIDDEN : Icons.VISIBLE;
        const visBtn = new IconButton({
            icon: visIcon,
            title: !fill.visible ? 'Show Fill' : 'Hide Fill',
            onClick: () => {
                this.updateFill(element, index, { visible: !fill.visible });
            }
        });
        visBtn.element.style.width = '24px'; // Compact
        visBtn.element.style.height = '24px';
        visBtn.element.style.padding = '0';

        // Remove Button
        const removeBtn = new IconButton({
            icon: Icons.MINUS,
            title: 'Remove Fill',
            onClick: () => {
                this.removeFill(element, index);
            }
        });
        removeBtn.element.style.width = '24px'; // Compact
        removeBtn.element.style.height = '24px';
        removeBtn.element.style.padding = '0';

        buttonGroup.appendChild(blendBtn.element);
        buttonGroup.appendChild(visBtn.element);
        buttonGroup.appendChild(removeBtn.element);

        row.appendChild(buttonGroup);

        return row;
    }

    openBlendModeMenu(target, fill, index, element) {
        // Create a simple dropdown menu
        const menu = document.createElement('div');
        menu.style.position = 'fixed';
        menu.style.zIndex = '10000';
        menu.style.backgroundColor = '#2C2C2C';
        menu.style.border = '1px solid #444';
        menu.style.borderRadius = '4px';
        menu.style.padding = '4px 0';
        menu.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
        menu.style.width = '140px';
        menu.style.maxHeight = '300px';
        menu.style.overflowY = 'auto';
        menu.style.fontFamily = 'sans-serif';

        BlendModes.forEach(({ id: mode, label }) => {
            const item = document.createElement('div');
            item.textContent = label;
            item.style.padding = '6px 12px';
            item.style.fontSize = '12px';
            item.style.color = '#ccc';
            item.style.cursor = 'pointer';
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.justifyContent = 'space-between';

            if ((fill.blendMode || 'normal') === mode) {
                item.style.backgroundColor = '#0055FF';
                item.style.color = '#fff';
            }

            item.onmouseenter = () => {
                if ((fill.blendMode || 'normal') !== mode) item.style.backgroundColor = '#383838';
            };
            item.onmouseleave = () => {
                if ((fill.blendMode || 'normal') !== mode) item.style.backgroundColor = 'transparent';
            };

            item.onclick = () => {
                this.updateFill(element, index, { blendMode: mode });
                menu.remove();
                document.removeEventListener('mousedown', closeHandler);
            };

            menu.appendChild(item);
        });

        document.body.appendChild(menu);

        const rect = target.getBoundingClientRect();
        // Align right of menu with right of button if possible, or left
        // Let's align right edge of menu to right edge of button
        let left = rect.right - 140;
        if (left < 0) left = rect.left;
        
        menu.style.left = `${left}px`;
        menu.style.top = `${rect.bottom + 4}px`;

        // Adjust if off screen
        const menuRect = menu.getBoundingClientRect();
        if (menuRect.bottom > window.innerHeight) {
            menu.style.top = `${rect.top - menuRect.height - 4}px`;
        }

        const closeHandler = (e) => {
            if (!menu.contains(e.target) && !target.contains(e.target)) {
                menu.remove();
                document.removeEventListener('mousedown', closeHandler);
            }
        };
        setTimeout(() => document.addEventListener('mousedown', closeHandler), 0);
    }

    addFill() {
        if (!this.selection) return;
        
        const state = store.getState();
        const element = this.getElement(state, this.selection[0]);
        if (!element) return;

        const style = element.style || {};
        let fills = style.fills ? [...style.fills] : [];
        
        // If migrating from legacy single fill
        if (!style.fills && (style.backgroundColor || style.fillType)) {
             const isTransparent = !style.backgroundColor || style.backgroundColor === 'transparent';
             if (!isTransparent) {
                 fills.push({
                    type: style.fillType || 'solid',
                    value: style.fillValue || style.backgroundColor,
                    color: style.backgroundColor,
                    opacity: 100,
                    visible: style._fillEnabled !== false
                 });
             }
        }

        // Add new fill to TOP (index 0)
        // Default: Black, 25% opacity
        fills.unshift({
            type: 'solid',
            color: 'rgba(0, 0, 0, 0.25)',
            value: 'rgba(0, 0, 0, 0.25)',
            opacity: 25,
            visible: true
        });

        // Update store
        // We also update legacy backgroundColor to the bottom-most visible fill for backward compatibility if needed,
        // or we update the renderer to read 'fills'.
        // For now, let's assume we update 'fills' and also set 'backgroundColor' to the composite or bottom one?
        // Actually, to support multiple fills, the renderer MUST be updated.
        // But for now, let's just save the structure.
        
        store.dispatch('UPDATE_ELEMENT', {
            id: element.id,
            style: {
                ...style,
                fills: fills,
                // Legacy fallback: use the bottom-most visible fill or the top-most?
                // Usually simple renderers use the first one.
                // Let's set backgroundColor to the first visible fill's color for basic compatibility.
                backgroundColor: this.getCompositeColor(fills)
            }
        });
    }

    removeFill(element, index) {
        const style = element.style || {};
        if (!style.fills) return; // Should not happen if we rendered rows

        const newFills = [...style.fills];
        newFills.splice(index, 1);

        store.dispatch('UPDATE_ELEMENT', {
            id: element.id,
            style: {
                ...style,
                fills: newFills,
                backgroundColor: this.getCompositeColor(newFills)
            }
        });
    }

    updateFill(element, index, updates) {
        const style = element.style || {};
        let fills = style.fills ? [...style.fills] : [];
        
        // Migration check
        if (!style.fills && (style.backgroundColor || style.fillType)) {
             fills = [{
                type: style.fillType || 'solid',
                value: style.fillValue || style.backgroundColor,
                color: style.backgroundColor,
                opacity: 100,
                visible: style._fillEnabled !== false
             }];
        }

        const fill = { ...fills[index] };
        
        if (updates.type) {
            fill.type = updates.type;
        }
        
        if (updates.blendMode !== undefined) {
            fill.blendMode = updates.blendMode;
        }
        
        if (updates.code !== undefined) {
            fill.code = updates.code;
        }

        if (updates.color) {
            // Update color value
            // If opacity is managed separately, we might want to keep it separate or bake it in.
            // The prompt asked for "Black with 25% opacity".
            // Let's store base color and opacity separately if possible, or bake them.
            // For now, let's bake opacity into the rgba string for 'color' property to keep it simple for renderer.
            const currentOpacity = fill.opacity !== undefined ? fill.opacity : 100;
            fill.color = this.applyOpacity(updates.color, currentOpacity);
            fill.value = fill.color;
        }

        if (updates.opacity !== undefined) {
            fill.opacity = updates.opacity;
            // Re-bake opacity into color string
            fill.color = this.applyOpacity(fill.color, fill.opacity);
            fill.value = fill.color;
        }

        if (updates.visible !== undefined) {
            fill.visible = updates.visible;
        }

        fills[index] = fill;

        store.dispatch('UPDATE_ELEMENT', {
            id: element.id,
            style: {
                ...style,
                fills: fills,
                backgroundColor: this.getCompositeColor(fills)
            }
        });
    }

    reorderFills(element, fromIndex, toIndex) {
        const style = element.style || {};
        if (!style.fills) return;

        const newFills = [...style.fills];
        const [movedItem] = newFills.splice(fromIndex, 1);
        
        // Adjust toIndex if we removed an item before it
        if (fromIndex < toIndex) {
            toIndex--;
        }
        
        newFills.splice(toIndex, 0, movedItem);

        store.dispatch('UPDATE_ELEMENT', {
            id: element.id,
            style: {
                ...style,
                fills: newFills,
                backgroundColor: this.getCompositeColor(newFills)
            }
        });
    }

    getCompositeColor(fills) {
        // Find the first visible fill to use as legacy fallback
        // Or maybe we should construct a CSS background string?
        // For now, return the top-most visible color for simple renderers
        const visible = fills.find(f => f.visible);
        return visible ? visible.color : 'transparent';
    }

    // Helpers
    getOpacity(colorString) {
        if (!colorString) return 100;
        if (colorString.startsWith('rgba')) {
            const match = colorString.match(/rgba?\(.*,\s*([\d.]+)\)/);
            if (match) {
                return Math.round(parseFloat(match[1]) * 100);
            }
        }
        return 100;
    }

    applyOpacity(colorString, opacityPercent) {
        // Convert hex/rgb/rgba to rgba with new alpha
        let r = 0, g = 0, b = 0;
        
        if (colorString.startsWith('#')) {
            const hex = colorString.substring(1);
            if (hex.length === 3) {
                r = parseInt(hex[0] + hex[0], 16);
                g = parseInt(hex[1] + hex[1], 16);
                b = parseInt(hex[2] + hex[2], 16);
            } else {
                r = parseInt(hex.substring(0, 2), 16);
                g = parseInt(hex.substring(2, 4), 16);
                b = parseInt(hex.substring(4, 6), 16);
            }
        } else if (colorString.startsWith('rgb')) {
            const match = colorString.match(/\d+/g);
            if (match) {
                r = parseInt(match[0]);
                g = parseInt(match[1]);
                b = parseInt(match[2]);
            }
        }
        
        const alpha = opacityPercent / 100;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    rgbToHex(colorString) {
        // ColorInput expects Hex. If we have rgba/rgb, convert to hex (ignoring alpha for the input value)
        if (colorString.startsWith('#')) return colorString;
        
        let r = 0, g = 0, b = 0;
        if (colorString.startsWith('rgb')) {
            const match = colorString.match(/\d+/g);
            if (match) {
                r = parseInt(match[0]);
                g = parseInt(match[1]);
                b = parseInt(match[2]);
            }
        }
        
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    openFlyout(targetElement, fill, index, element) {
        if (this.activeFlyout) {
            if (typeof this.activeFlyout.destroy === 'function') {
                this.activeFlyout.destroy();
            }
            this.activeFlyout.element.remove();
            this.activeFlyout = null;
        }

        const flyout = new FillFlyout({
            fill: fill,
            onChange: (updates) => {
                this.updateFill(element, index, updates);
            },
            onClose: () => {
                if (this.activeFlyout) {
                    if (typeof this.activeFlyout.destroy === 'function') {
                        this.activeFlyout.destroy();
                    }
                    this.activeFlyout.element.remove();
                    this.activeFlyout = null;
                }
            }
        });

        document.body.appendChild(flyout.element);
        
        // Position
        const rect = targetElement.getBoundingClientRect();
        // Position to the left of the target, aligned top
        // Or if not enough space, position right?
        // Property inspector is usually on the right side of screen.
        // So flyout should be to the left.
        const flyoutWidth = 240; // From spec
        let left = rect.left - flyoutWidth - 12;
        let top = rect.top;
        
        // Boundary checks
        if (left < 10) left = rect.right + 12; // Flip to right if no space on left
        if (top + 400 > window.innerHeight) top = window.innerHeight - 400; // Simple bottom check

        flyout.element.style.left = `${left}px`;
        flyout.element.style.top = `${top}px`;
        
        this.activeFlyout = flyout;

        // Close on click outside
        const closeHandler = (e) => {
            if (this.activeFlyout && !this.activeFlyout.element.contains(e.target) && !targetElement.contains(e.target)) {
                if (typeof this.activeFlyout.destroy === 'function') {
                    this.activeFlyout.destroy();
                }
                this.activeFlyout.element.remove();
                this.activeFlyout = null;
                document.removeEventListener('mousedown', closeHandler);
            }
        };
        setTimeout(() => document.addEventListener('mousedown', closeHandler), 0);
    }
}
