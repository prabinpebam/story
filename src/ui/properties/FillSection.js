import { Section } from '../components/Section.js';
import { ColorInput } from '../components/ColorInput.js';
import { NumberInput } from '../components/NumberInput.js';
import { IconButton } from '../components/IconButton.js';
import { Icons } from '../Icons.js';
import { store } from '../../core/Store.js';

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
        row.style.gap = '8px';
        row.style.height = '28px';

        // Color Input
        // For now we assume solid color or fallback
        const colorValue = this.rgbToHex(fill.color || fill.value || '#000000');
        const colorInput = new ColorInput(colorValue, (color) => {
            this.updateFill(element, index, { color });
        });
        colorInput.element.style.flex = '1';
        colorInput.element.style.minWidth = '0';
        colorInput.element.style.width = 'auto';
        
        if (!fill.visible) {
            colorInput.element.style.opacity = '0.5';
        }

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
        opacityInput.element.style.width = '50px';
        opacityInput.element.style.flex = '0 0 50px';
        opacityInput.element.querySelector('input').style.padding = '0 4px';
        
        if (!fill.visible) {
            opacityInput.element.style.opacity = '0.5';
            opacityInput.element.style.pointerEvents = 'none';
        }

        // Visibility Button
        const visIcon = !fill.visible ? Icons.HIDDEN : Icons.VISIBLE;
        const visBtn = new IconButton({
            icon: visIcon,
            title: !fill.visible ? 'Show Fill' : 'Hide Fill',
            onClick: () => {
                this.updateFill(element, index, { visible: !fill.visible });
            }
        });

        // Remove Button
        const removeBtn = new IconButton({
            icon: Icons.MINUS,
            title: 'Remove Fill',
            onClick: () => {
                this.removeFill(element, index);
            }
        });

        row.appendChild(colorInput.element);
        row.appendChild(opacityInput.element);
        row.appendChild(visBtn.element);
        row.appendChild(removeBtn.element);

        return row;
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
}
