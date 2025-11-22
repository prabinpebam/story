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
        // Check if we have a fill.
        // A fill exists if:
        // 1. backgroundColor is set and not transparent
        // 2. OR it is explicitly marked as hidden (but exists)
        // 3. OR it has a special fillType (gradient/image)
        const isTransparent = !style.backgroundColor || style.backgroundColor === 'transparent';
        const isHidden = style._fillEnabled === false;
        const hasFill = !isTransparent || isHidden || style.fillType;
        
        if (!hasFill) {
            this.section.setCollapsed(true);
            return;
        }
        
        this.section.setCollapsed(false);

        // Container for the list of fills (currently just 1)
        const list = document.createElement('div');
        list.style.display = 'flex';
        list.style.flexDirection = 'column';
        list.style.gap = '8px';
        
        // Create the single fill row
        const row = document.createElement('div');
        row.className = 'pi-row';
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.gap = '8px';
        row.style.height = '28px'; // Compact height

        // Determine display values
        // If hidden, show the saved color instead of transparent
        let displayColor = style.backgroundColor || '#D9D9D9';
        if (isHidden && style._savedFillColor) {
            displayColor = style._savedFillColor;
        }

        // Color Input
        const colorValue = this.rgbToHex(displayColor);
        const colorInput = new ColorInput(colorValue, (color) => {
            this.updateFill(element, { color });
        });
        // Flex grow to fill space
        colorInput.element.style.flex = '1';
        colorInput.element.style.minWidth = '0'; // Allow shrinking
        colorInput.element.style.width = 'auto'; // Override fixed width
        // If hidden, maybe dim the color input?
        if (isHidden) {
            colorInput.element.style.opacity = '0.5';
        }

        // Opacity Input
        const currentOpacity = this.getOpacity(displayColor);
        const opacityInput = new NumberInput({
            value: currentOpacity,
            onChange: (val) => {
                this.updateFill(element, { opacity: val });
            },
            min: 0,
            max: 100,
            step: 1,
            units: '%'
        });
        // Just enough for "100%"
        opacityInput.element.style.width = '50px';
        opacityInput.element.style.flex = '0 0 50px'; // Prevent flex growth/shrink
        opacityInput.element.querySelector('input').style.padding = '0 4px'; // Tighten padding
        if (isHidden) {
            opacityInput.element.style.opacity = '0.5';
            opacityInput.element.style.pointerEvents = 'none';
        }

        // Visibility Button
        const visIcon = isHidden ? Icons.HIDDEN : Icons.VISIBLE;
        const visBtn = new IconButton({
            icon: visIcon,
            title: isHidden ? 'Show Fill' : 'Hide Fill',
            onClick: () => {
                this.toggleVisibility(element);
            }
        });

        // Remove Button
        const removeBtn = new IconButton({
            icon: Icons.MINUS,
            title: 'Remove Fill',
            onClick: () => {
                this.removeFill(element);
            }
        });

        row.appendChild(colorInput.element);
        row.appendChild(opacityInput.element);
        row.appendChild(visBtn.element);
        row.appendChild(removeBtn.element);
        
        list.appendChild(row);
        this.container.appendChild(list);
    }

    addFill() {
        if (!this.selection) return;
        
        const updates = {};
        // Default to gray if adding a fill
        updates.style = {
            backgroundColor: '#D9D9D9',
            _fillEnabled: true,
            _savedFillColor: null
        };

        store.dispatch('UPDATE_ELEMENT', {
            id: this.selection[0],
            ...updates
        });
    }

    removeFill(element) {
        store.dispatch('UPDATE_ELEMENT', {
            id: element.id,
            style: {
                ...element.style,
                backgroundColor: 'transparent',
                fillType: null,
                fillValue: null,
                _fillEnabled: true, // Reset to default state (not hidden)
                _savedFillColor: null
            }
        });
    }

    toggleVisibility(element) {
        const style = element.style || {};
        const isHidden = style._fillEnabled === false;
        
        const updates = { style: { ...style } };
        
        if (isHidden) {
            // Show
            updates.style._fillEnabled = true;
            updates.style.backgroundColor = style._savedFillColor || '#D9D9D9';
        } else {
            // Hide
            updates.style._fillEnabled = false;
            updates.style._savedFillColor = style.backgroundColor || '#D9D9D9';
            updates.style.backgroundColor = 'transparent';
        }
        
        store.dispatch('UPDATE_ELEMENT', { 
            id: element.id, 
            ...updates 
        });
    }

    updateFill(element, updates) {
        const style = element.style || {};
        // If hidden, we update the saved color
        const isHidden = style._fillEnabled === false;
        const currentColor = isHidden ? (style._savedFillColor || '#D9D9D9') : (style.backgroundColor || '#D9D9D9');
        
        let newColor = currentColor;

        if (updates.color) {
            // updates.color is Hex. Preserve current opacity.
            const opacity = this.getOpacity(currentColor);
            newColor = this.applyOpacity(updates.color, opacity);
        }

        if (updates.opacity !== undefined) {
            // updates.opacity is 0-100. Apply to current color.
            newColor = this.applyOpacity(currentColor, updates.opacity);
        }

        const newStyle = { ...style };
        
        if (isHidden) {
            newStyle._savedFillColor = newColor;
            // backgroundColor remains transparent
        } else {
            newStyle.backgroundColor = newColor;
        }
        
        // Reset fillType if we are editing color
        newStyle.fillType = null;
        newStyle.fillValue = null;

        store.dispatch('UPDATE_ELEMENT', {
            id: element.id,
            style: newStyle
        });
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
