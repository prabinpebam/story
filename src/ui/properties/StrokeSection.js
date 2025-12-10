import { BaseSection } from './BaseSection.js';
import { ColorInput } from '../components/ColorInput.js';
import { NumberInput } from '../components/NumberInput.js';
import { Dropdown } from '../components/Dropdown.js';
import { IconButton } from '../components/IconButton.js';
import { PropertyRow } from '../components/PropertyRow.js';
import { Icons } from '../Icons.js';
import { store } from '../../core/Store.js';
import { StrokeSettingsFlyout } from '../components/StrokeFlyout/StrokeSettingsFlyout.js';
import { BlendModes } from '../../core/constants/BlendModes.js';
import { EmptyState } from '../components/EmptyState.js';

// Module-level cache for last used values
const LastUsed = {
    solid: '#000000',
    gradient: 'linear-gradient(90deg, #000000 0%, #ffffff 100%)'
};

export class StrokeSection extends BaseSection {
    constructor() {
        super({ 
            title: 'Stroke',
            actions: [
                { icon: Icons.PLUS, title: 'Add Stroke', onClick: () => this.addStroke() },
                { icon: Icons.GRID_3X3, title: 'Stroke Presets', onClick: () => console.log('Presets') }
            ]
        });
        this.container = document.createElement('div');
        this.container.className = 'pi-section-content';
        this.section.appendChild(this.container);
    }

    update(selection) {
        super.update(selection);
        
        if (!this.selection || this.selection.length === 0) return;
        
        const state = store.getState();
        const element = this.getElement(state, this.selection[0]);
        
        if (element) {
            this.render(element);
        }
    }

    render(element) {
        this.container.innerHTML = '';
        
        const style = element.style || {};
        
        // Normalize strokes
        let strokes = [];
        if (style.strokes && Array.isArray(style.strokes)) {
            strokes = style.strokes;
        } else {
            // Legacy support: Check borderWidth
            const hasStroke = style.borderWidth > 0;
            if (hasStroke) {
                strokes = [{
                    color: style.borderColor || '#000000',
                    width: style.borderWidth,
                    opacity: 100,
                    position: style.strokeAlign || 'center',
                    visible: true
                }];
            }
        }

        if (strokes.length === 0) {
            const empty = new EmptyState('No stroke');
            this.container.appendChild(empty.element);
            return;
        }

        const list = document.createElement('div');
        list.className = 'stroke-list';

        strokes.forEach((stroke, index) => {
            const row = this.createStrokeRow(element, stroke, index, strokes);
            list.appendChild(row);
        });

        this.container.appendChild(list);
    }

    createStrokeRow(element, stroke, index, allStrokes) {
        // Create PropertyRow wrapper with drag/visibility/delete controls
        const propertyRow = new PropertyRow({
            index,
            draggable: true,
            showVisibility: true,
            showDelete: true,
            onVisibilityToggle: () => {
                this.updateStroke(index, { visible: stroke.visible === false });
            },
            onDelete: () => {
                this.removeStroke(index);
            },
            onDrop: ({ position, event }) => {
                const fromIndex = parseInt(event.dataTransfer.getData('text/plain'));
                let toIndex = index;
                
                // Calculate drop position
                if (position === 'after') {
                    toIndex = index + 1;
                }
                
                if (fromIndex !== toIndex) {
                    this.reorderStrokes(element, fromIndex, toIndex);
                }
            }
        });
        
        // Set visibility state
        propertyRow.setVisible(stroke.visible !== false);
        
        // Add stroke-specific class
        const row = propertyRow.element;
        row.classList.add('stroke-row');

        // Combined Input Group (Swatch + Hex + Opacity)
        const combinedInput = document.createElement('div');
        combinedInput.className = 'stroke-input-group';

        // Swatch (Trigger for Flyout)
        const swatch = document.createElement('div');
        swatch.className = 'stroke-swatch-trigger';
        
        const preview = document.createElement('div');
        preview.className = 'stroke-preview';
        
        // Determine the color for the swatch border
        let swatchColor = stroke.color || '#000000';
        
        if (stroke.type === 'gradient') {
             preview.style.background = stroke.value || 'linear-gradient(90deg, #000000 0%, #ffffff 100%)';
             // Use a neutral border for gradients
             preview.style.boxShadow = 'inset 0 0 0 1px rgba(0, 0, 0, 0.3)';
        } else {
             preview.style.backgroundColor = swatchColor;
             this.updateSwatchBorder(preview, swatchColor, false);
        }
        swatch.appendChild(preview);
        
        // Hover handlers for border opacity
        swatch.addEventListener('mouseenter', () => {
            if (stroke.type === 'gradient') {
                preview.style.boxShadow = 'inset 0 0 0 1px rgba(0, 0, 0, 1)';
            } else {
                this.updateSwatchBorder(preview, swatchColor, true);
            }
        });
        swatch.addEventListener('mouseleave', () => {
            if (stroke.type === 'gradient') {
                preview.style.boxShadow = 'inset 0 0 0 1px rgba(0, 0, 0, 0.3)';
            } else {
                this.updateSwatchBorder(preview, swatchColor, false);
            }
        });

        swatch.onclick = (e) => {
            e.stopPropagation();
            this.openFlyout(stroke, index, swatch);
        };
        
        if (stroke.visible === false) {
            swatch.classList.add('fill-disabled');
        }
        combinedInput.appendChild(swatch);

        // Hex Input
        const hexInput = document.createElement('input');
        hexInput.type = 'text';
        hexInput.className = 'stroke-hex-input';
        hexInput.spellcheck = false;
        
        if (stroke.type === 'solid' || !stroke.type) {
            hexInput.value = (stroke.color || '#000000').toUpperCase();
            hexInput.onchange = (e) => {
                let val = e.target.value.trim();
                if (!val.startsWith('#')) val = '#' + val;
                if (/^#[0-9A-F]{6}$/i.test(val) || /^#[0-9A-F]{3}$/i.test(val)) {
                    this.updateStroke(index, { color: val });
                } else {
                    e.target.value = (stroke.color || '#000000').toUpperCase();
                }
            };
        } else {
            hexInput.value = (stroke.type || 'Solid').charAt(0).toUpperCase() + (stroke.type || 'Solid').slice(1);
            hexInput.disabled = true;
        }
        
        if (stroke.visible === false) {
            hexInput.classList.add('fill-disabled');
        }
        combinedInput.appendChild(hexInput);

        // Separator
        const separator = document.createElement('div');
        separator.className = 'stroke-separator';
        combinedInput.appendChild(separator);

        // Opacity Input
        const opacityInput = new NumberInput({
            value: stroke.opacity !== undefined ? stroke.opacity : 100,
            onChange: (val, isTransient) => {
                this.updateStroke(index, { opacity: val }, isTransient);
            },
            min: 0,
            max: 100,
            step: 1,
            units: '%',
            scrubbable: true
        });
        
        opacityInput.element.classList.add('stroke-opacity-input');
        
        if (stroke.visible === false) {
            opacityInput.element.classList.add('fill-disabled-interactive');
        }
        combinedInput.appendChild(opacityInput.element);

        // Blend Mode Button (only additional control beyond PropertyRow)
        const isNormalBlend = !stroke.blendMode || stroke.blendMode === 'normal';
        const blendBtn = new IconButton({
            icon: Icons.BLEND_MODE,
            title: `Blend Mode: ${stroke.blendMode || 'Normal'}`,
            onClick: (e) => {
                const btn = e.target.closest('button') || e.target;
                this.openBlendModeMenu(btn, stroke, index, element);
            }
        });
        blendBtn.element.classList.add('pi-btn-compact');
        if (!isNormalBlend) {
            blendBtn.element.classList.add('pi-btn-active');
        }
        
        // Wrap combined input and blend button in a content container
        const strokeContent = document.createElement('div');
        strokeContent.className = 'stroke-content';
        strokeContent.appendChild(combinedInput);
        strokeContent.appendChild(blendBtn.element);
        
        // Add content to PropertyRow
        propertyRow.appendChild(strokeContent);

        return row;
    }

    openFlyout(stroke, index, trigger) {
        if (this.activeFlyout) {
            this.activeFlyout.close();
            this.activeFlyout = null;
        }
        
        this.activeFlyout = new StrokeSettingsFlyout({
            trigger: trigger,
            stroke: stroke,
            onChange: (updates, isTransient) => this.updateStroke(index, updates, isTransient),
            onClose: () => {
                this.activeFlyout = null;
            }
        });
        
        this.activeFlyout.open();
    }

    openBlendModeMenu(target, stroke, index, element) {
        // Create a simple dropdown menu
        const menu = document.createElement('div');
        menu.className = 'blend-mode-menu';
        
        // Prevent clicks/scroll inside menu from closing it
        menu.addEventListener('mousedown', (e) => e.stopPropagation());

        BlendModes.forEach(({ id: mode, label }) => {
            const item = document.createElement('div');
            item.className = 'blend-mode-item';
            item.textContent = label;

            if ((stroke.blendMode || 'normal') === mode) {
                item.classList.add('active');
            }

            item.onmouseenter = () => {
                if ((stroke.blendMode || 'normal') !== mode) item.classList.add('hover');
            };
            item.onmouseleave = () => {
                item.classList.remove('hover');
            };

            item.onclick = () => {
                this.updateStroke(index, { blendMode: mode });
                menu.remove();
                document.removeEventListener('mousedown', closeHandler);
            };

            menu.appendChild(item);
        });

        document.body.appendChild(menu);

        const rect = target.getBoundingClientRect();
        // Align right of menu with right of button if possible, or left
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

    addStroke() {
        const state = store.getState();
        const element = this.getElement(state, this.selection[0]);
        if (!element) return;

        const style = element.style || {};
        let strokes = style.strokes ? [...style.strokes] : [];
        
        // If migrating from legacy
        if (!style.strokes && style.borderWidth > 0) {
            strokes.push({
                color: style.borderColor || '#000000',
                width: style.borderWidth,
                opacity: 100,
                position: style.strokeAlign || 'center',
                visible: true
            });
        }

        // Add new default stroke
        const isFirst = strokes.length === 0;
        
        if (isFirst) {
            strokes.unshift({
                color: LastUsed.solid,
                width: 1,
                opacity: 100,
                position: 'center',
                visible: true
            });
        } else {
            strokes.unshift({
                color: '#000000',
                width: 1,
                opacity: 25,
                position: 'center',
                visible: true
            });
        }

        this.commitChanges(strokes);
    }

    removeStroke(index) {
        const state = store.getState();
        const element = this.getElement(state, this.selection[0]);
        if (!element) return;

        const style = element.style || {};
        let strokes = style.strokes ? [...style.strokes] : [];
        
        // Handle legacy migration if needed
        if (!style.strokes && style.borderWidth > 0) {
             strokes = [{
                color: style.borderColor || '#000000',
                width: style.borderWidth,
                opacity: 100,
                position: style.strokeAlign || 'center',
                visible: true
            }];
        }

        strokes.splice(index, 1);
        this.commitChanges(strokes);
    }

    updateStroke(index, updates, isTransient = false) {
        const state = store.getState();
        const element = this.getElement(state, this.selection[0]);
        if (!element) return;

        const style = element.style || {};
        let strokes = style.strokes ? [...style.strokes] : [];

        // Handle legacy migration if needed
        if (!style.strokes && style.borderWidth > 0) {
             strokes = [{
                color: style.borderColor || '#000000',
                width: style.borderWidth,
                opacity: 100,
                position: style.strokeAlign || 'center',
                visible: true
            }];
        }

        const stroke = { ...strokes[index] };
        
        if (updates.type) {
            stroke.type = updates.type;
            if (updates.type === 'solid') {
                stroke.color = LastUsed.solid;
            } else if (updates.type === 'gradient') {
                stroke.value = LastUsed.gradient;
            }
        }

        if (updates.color) {
            stroke.color = updates.color;
            if (!stroke.type || stroke.type === 'solid') {
                LastUsed.solid = updates.color;
            }
        }
        
        if (updates.value) {
            stroke.value = updates.value;
            if (stroke.type === 'gradient') {
                LastUsed.gradient = updates.value;
            }
        }

        // Apply other updates
        Object.keys(updates).forEach(key => {
            if (key !== 'type' && key !== 'color' && key !== 'value') {
                stroke[key] = updates[key];
            }
        });

        strokes[index] = stroke;
        this.commitChanges(strokes, isTransient);
    }

    reorderStrokes(element, fromIndex, toIndex) {
        const style = element.style || {};
        if (!style.strokes) return;

        const newStrokes = [...style.strokes];
        const [movedItem] = newStrokes.splice(fromIndex, 1);
        
        // Adjust toIndex if we removed an item before it
        if (fromIndex < toIndex) {
            toIndex--;
        }
        
        newStrokes.splice(toIndex, 0, movedItem);
        this.commitChanges(newStrokes);
    }

    commitChanges(strokes, isTransient = false) {
        // Sync back to legacy properties for the first visible stroke
        // This ensures the renderer (which likely uses borderWidth/borderColor) still works
        const firstVisible = strokes.find(s => s.visible !== false);
        
        const legacyUpdates = {};
        if (firstVisible) {
            legacyUpdates.borderColor = firstVisible.color;
            legacyUpdates.borderWidth = firstVisible.width;
            legacyUpdates.strokeAlign = firstVisible.position;
        } else {
            legacyUpdates.borderWidth = 0;
        }

        this.updateStyle({
            strokes: strokes,
            ...legacyUpdates
        }, isTransient);
    }

    /**
     * Determines if a color is dark using WCAG luminance formula
     */
    isColorDark(color) {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            const ctx = canvas.getContext('2d');
            if (!ctx) return false; // Fallback for test environment
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, 1, 1);
            const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
            
            const toLinear = (c) => {
                const sRGB = c / 255;
                return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
            };
            const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
            return luminance < 0.5;
        } catch (e) {
            // Fallback for environments without canvas support
            return false;
        }
    }

    /**
     * Updates the swatch border based on color darkness
     */
    updateSwatchBorder(preview, color, isHover = false) {
        const isDark = this.isColorDark(color);
        const opacity = isHover ? 1 : 0.3;
        preview.style.border = 'none';
        preview.style.boxShadow = isDark 
            ? `inset 0 0 0 1px rgba(255, 255, 255, ${opacity})`
            : `inset 0 0 0 1px rgba(0, 0, 0, ${opacity})`;
    }
}
