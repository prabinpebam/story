import { Section } from '../components/Section.js';
import { ColorInput } from '../components/ColorInput.js';
import { NumberInput } from '../components/NumberInput.js';
import { Dropdown } from '../components/Dropdown.js';
import { IconButton } from '../components/IconButton.js';
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

export class StrokeSection {
    constructor() {
        this.section = new Section({ 
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
        list.style.display = 'flex';
        list.style.flexDirection = 'column';
        list.style.gap = '12px'; // Spacing between stroke blocks

        strokes.forEach((stroke, index) => {
            const row = this.createStrokeRow(element, stroke, index, strokes);
            list.appendChild(row);
        });

        this.container.appendChild(list);
    }

    createStrokeRow(element, stroke, index, allStrokes) {
        const row = document.createElement('div');
        row.className = 'pi-row';
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.gap = '2px';
        row.style.height = '28px';
        row.dataset.index = index;

        // 1. Drag Handle
        const dragHandle = document.createElement('div');
        dragHandle.innerHTML = Icons.DRAG_HANDLE;
        dragHandle.style.color = 'var(--color-text-tertiary)';
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
                row.style.borderTop = '2px solid var(--color-accent)';
                row.style.borderBottom = 'none';
            } else {
                row.style.borderTop = 'none';
                row.style.borderBottom = '2px solid var(--color-accent)';
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
                toIndex = index + 1;
            }
            
            if (fromIndex !== toIndex) {
                this.reorderStrokes(element, fromIndex, toIndex);
            }
            
            row.style.borderTop = 'none';
            row.style.borderBottom = 'none';
        });

        row.appendChild(dragHandle);

        // 2. Combined Input Group (Swatch + Hex + Opacity)
        const combinedInput = document.createElement('div');
        combinedInput.style.flex = '1';
        combinedInput.style.display = 'flex';
        combinedInput.style.alignItems = 'center';
        combinedInput.style.border = '1px solid var(--color-border)';
        combinedInput.style.borderRadius = 'var(--radius-sm)';
        combinedInput.style.height = '24px';
        combinedInput.style.overflow = 'hidden';
        combinedInput.style.backgroundColor = 'var(--color-bg-input)';

        // Swatch (Trigger for Flyout)
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch-trigger';
        swatch.style.width = '22px';
        swatch.style.height = '100%';
        swatch.style.cursor = 'pointer';
        swatch.style.display = 'flex';
        swatch.style.alignItems = 'center';
        swatch.style.justifyContent = 'center';
        // swatch.style.borderRight = '1px solid #444'; // Removed separator
        
        const preview = document.createElement('div');
        preview.style.width = 'var(--swatch-size-sm)';
        preview.style.height = 'var(--swatch-size-sm)';
        preview.style.borderRadius = 'var(--radius-xs)';
        
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
            swatch.style.opacity = '0.5';
        }
        combinedInput.appendChild(swatch);

        // Hex Input
        const hexInput = document.createElement('input');
        hexInput.type = 'text';
        hexInput.style.flex = '1';
        hexInput.style.minWidth = '0';
        hexInput.style.border = 'none';
        hexInput.style.background = 'transparent';
        hexInput.style.color = 'var(--color-text-secondary)';
        hexInput.style.fontSize = '11px';
        hexInput.style.fontFamily = 'monospace';
        hexInput.style.padding = '0 2px';
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
            hexInput.style.opacity = '0.5';
        }
        combinedInput.appendChild(hexInput);

        // Separator
        const separator = document.createElement('div');
        separator.style.width = '1px';
        separator.style.height = '12px'; // Reduced height
        separator.style.backgroundColor = 'var(--color-border)';
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
        
        opacityInput.element.style.width = '40px';
        opacityInput.element.style.flex = '0 0 40px';
        opacityInput.element.style.border = 'none';
        opacityInput.element.style.background = 'transparent';
        opacityInput.element.querySelector('input').style.padding = '0'; // Remove padding
        opacityInput.element.querySelector('input').style.textAlign = 'center';
        
        if (stroke.visible === false) {
            opacityInput.element.style.opacity = '0.5';
            opacityInput.element.style.pointerEvents = 'none';
        }
        combinedInput.appendChild(opacityInput.element);
        
        row.appendChild(combinedInput);

        // 3. Button Group (Blend, Vis, Remove)
        const buttonGroup = document.createElement('div');
        buttonGroup.style.display = 'flex';
        buttonGroup.style.alignItems = 'center';
        buttonGroup.style.gap = '0px';
        buttonGroup.style.marginLeft = '4px';

        // Blend Mode
        const isNormalBlend = !stroke.blendMode || stroke.blendMode === 'normal';
        const blendBtn = new IconButton({
            icon: Icons.BLEND_MODE,
            title: `Blend Mode: ${stroke.blendMode || 'Normal'}`,
            onClick: (e) => {
                const btn = e.target.closest('button') || e.target;
                this.openBlendModeMenu(btn, stroke, index, element);
            }
        });
        if (!isNormalBlend) {
            blendBtn.element.style.color = 'var(--color-accent)';
        }
        blendBtn.element.style.width = '24px';
        blendBtn.element.style.height = '24px';
        blendBtn.element.style.padding = '0';

        // Visibility
        const visIcon = stroke.visible !== false ? Icons.VISIBLE : Icons.HIDDEN;
        const visBtn = new IconButton({
            icon: visIcon,
            title: stroke.visible !== false ? 'Hide Stroke' : 'Show Stroke',
            onClick: () => this.updateStroke(index, { visible: stroke.visible === false })
        });
        visBtn.element.style.width = '24px';
        visBtn.element.style.height = '24px';
        visBtn.element.style.padding = '0';

        // Remove
        const removeBtn = new IconButton({
            icon: Icons.MINUS,
            title: 'Remove Stroke',
            onClick: () => this.removeStroke(index)
        });
        removeBtn.element.style.width = '24px';
        removeBtn.element.style.height = '24px';
        removeBtn.element.style.padding = '0';

        buttonGroup.appendChild(blendBtn.element);
        buttonGroup.appendChild(visBtn.element);
        buttonGroup.appendChild(removeBtn.element);

        row.appendChild(buttonGroup);

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
        menu.style.position = 'fixed';
        menu.style.zIndex = 'var(--z-popover)';
        menu.style.backgroundColor = 'var(--menu-bg)';
        menu.style.border = '1px solid var(--color-border)';
        menu.style.borderRadius = 'var(--radius-sm)';
        menu.style.padding = '4px 0';
        menu.style.boxShadow = 'var(--shadow-floating)';
        menu.style.width = '140px';
        menu.style.maxHeight = '300px';
        menu.style.overflowY = 'auto';
        menu.style.fontFamily = 'var(--font-ui)';
        
        // Prevent clicks/scroll inside menu from closing it
        menu.addEventListener('mousedown', (e) => e.stopPropagation());

        BlendModes.forEach(({ id: mode, label }) => {
            const item = document.createElement('div');
            item.textContent = label;
            item.style.padding = '6px 12px';
            item.style.fontSize = 'var(--font-size-md)';
            item.style.color = 'var(--color-text-primary)';
            item.style.cursor = 'pointer';
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.justifyContent = 'space-between';

            if ((stroke.blendMode || 'normal') === mode) {
                item.style.backgroundColor = 'var(--color-accent)';
                item.style.color = 'var(--color-text-on-accent)';
            }

            item.onmouseenter = () => {
                if ((stroke.blendMode || 'normal') !== mode) item.style.backgroundColor = 'var(--color-bg-hover)';
            };
            item.onmouseleave = () => {
                if ((stroke.blendMode || 'normal') !== mode) item.style.backgroundColor = 'transparent';
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
        const state = store.getState();
        const element = this.getElement(state, this.selection[0]);
        if (!element) return;

        const currentStyle = element.style || {};

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

        store.dispatch('UPDATE_ELEMENT', {
            id: this.selection[0],
            style: {
                ...currentStyle,
                strokes: strokes,
                ...legacyUpdates
            }
        }, { skipHistory: isTransient });
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
