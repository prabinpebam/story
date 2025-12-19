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
        const elements = this.selection.map((id) => this.getElement(state, id)).filter(Boolean);
        if (elements.length === 0) return;
        if (elements.length === 1) {
            this.render(elements[0]);
        } else {
            this.renderMulti(elements);
        }
    }

    getNormalizedStrokes(element) {
        const style = element?.style || {};
        let strokes = [];
        if (style.strokes && Array.isArray(style.strokes)) {
            strokes = style.strokes;
        } else {
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
        return strokes;
    }

    areStrokeStacksCompatible(strokesByElement) {
        if (strokesByElement.length === 0) return false;
        const first = strokesByElement[0];
        for (let i = 1; i < strokesByElement.length; i++) {
            if (strokesByElement[i].length !== first.length) return false;
        }
        for (let index = 0; index < first.length; index++) {
            const baseType = (first[index]?.type || 'solid');
            for (let i = 1; i < strokesByElement.length; i++) {
                const t = (strokesByElement[i][index]?.type || 'solid');
                if (t !== baseType) return false;
            }
        }
        return true;
    }

    getMixedResult(values) {
        if (!values || values.length === 0) return { value: undefined, mixed: false };
        const first = values[0];
        const mixed = values.some((v) => v !== first);
        return { value: first, mixed };
    }

    renderMulti(elements) {
        this.container.innerHTML = '';

        const strokesByElement = elements.map((el) => this.getNormalizedStrokes(el));
        const compatible = this.areStrokeStacksCompatible(strokesByElement);
        if (!compatible) {
            const empty = new EmptyState('Mixed');
            this.container.appendChild(empty.element);
            return;
        }

        const baseStrokes = strokesByElement[0];
        if (baseStrokes.length === 0) {
            const empty = new EmptyState('No stroke');
            this.container.appendChild(empty.element);
            return;
        }

        const list = document.createElement('div');
        list.className = 'stroke-list';

        baseStrokes.forEach((stroke, index) => {
            const row = this.createStrokeRowMulti(stroke, index, baseStrokes, strokesByElement, elements);
            list.appendChild(row);
        });

        this.container.appendChild(list);
    }

    createStrokeRowMulti(stroke, index, allStrokes, strokesByElement, elements) {
        const type = stroke?.type || 'solid';

        const visibleValues = strokesByElement.map((strokes) => (strokes[index]?.visible !== false));
        const visibleMixed = visibleValues.some((v) => v !== visibleValues[0]);
        const allVisible = visibleValues.every(Boolean);

        const propertyRow = new PropertyRow({
            index,
            draggable: allStrokes.length > 1,
            showVisibility: true,
            showDelete: true,
            onVisibilityToggle: () => {
                const nextVisible = allVisible ? false : true;
                this.updateStrokeForSelection(index, { visible: nextVisible });
            },
            onDelete: () => {
                this.removeStrokeForSelection(index);
            },
            onDrop: ({ position, event }) => {
                const fromIndex = parseInt(event.dataTransfer.getData('text/plain'));
                let toIndex = index;
                if (position === 'after') toIndex = index + 1;
                if (fromIndex !== toIndex) {
                    this.reorderStrokesForSelection(fromIndex, toIndex);
                }
            }
        });

        propertyRow.setVisible(visibleMixed ? true : allVisible);

        const row = propertyRow.element;
        row.classList.add('stroke-row');

        const combinedInput = document.createElement('div');
        combinedInput.className = 'stroke-input-group';

        const swatch = document.createElement('div');
        swatch.className = 'stroke-swatch-trigger';

        const preview = document.createElement('div');
        preview.className = 'stroke-preview';

        let swatchMixed = false;
        if (type === 'solid' || !type) {
            const colorValues = strokesByElement.map((strokes) => (strokes[index]?.color || '#000000').toUpperCase());
            swatchMixed = colorValues.some((c) => c !== colorValues[0]);
            if (!swatchMixed) {
                preview.style.backgroundColor = colorValues[0];
                this.updateSwatchBorder(preview, colorValues[0], false);
            }
        } else if (type === 'gradient') {
            const gradientValues = strokesByElement.map((strokes) => (strokes[index]?.value || ''));
            swatchMixed = gradientValues.some((v) => v !== gradientValues[0]);
            if (!swatchMixed) {
                preview.style.background = gradientValues[0] || 'linear-gradient(90deg, #000000 0%, #ffffff 100%)';
                preview.style.boxShadow = 'inset 0 0 0 1px rgba(0, 0, 0, 0.3)';
            }
        }

        if (swatchMixed) {
            preview.classList.add('mixed');
        }

        swatch.onclick = (e) => {
            e.stopPropagation();
            // Flyout uses first element's stroke for UI, but edits apply to all via updateStrokeForSelection
            this.openFlyout(stroke, index, swatch);
        };

        combinedInput.appendChild(swatch);
        swatch.appendChild(preview);

        const hexInput = document.createElement('input');
        hexInput.type = 'text';
        hexInput.className = 'stroke-hex-input';
        hexInput.spellcheck = false;
        hexInput.setAttribute('data-testid', `stroke-hex-${index}`);

        if (type === 'solid' || !type) {
            const colorValues = strokesByElement.map((strokes) => (strokes[index]?.color || '#000000').toUpperCase());
            const colorResult = this.getMixedResult(colorValues);
            if (colorResult.mixed) {
                hexInput.value = '';
                hexInput.placeholder = 'Mixed';
                hexInput.classList.add('mixed');
            } else {
                hexInput.value = colorResult.value;
            }
            hexInput.onchange = (e) => {
                let val = e.target.value.trim();
                if (!val) return;
                if (!val.startsWith('#')) val = '#' + val;
                if (/^#[0-9A-F]{6}$/i.test(val) || /^#[0-9A-F]{3}$/i.test(val)) {
                    this.updateStrokeForSelection(index, { color: val });
                } else {
                    if (colorResult.mixed) {
                        e.target.value = '';
                        e.target.placeholder = 'Mixed';
                    } else {
                        e.target.value = colorResult.value;
                    }
                }
            };
        } else {
            const typeLabel = (type || 'Solid').charAt(0).toUpperCase() + (type || 'Solid').slice(1);
            hexInput.value = typeLabel;
            hexInput.disabled = true;
        }
        combinedInput.appendChild(hexInput);

        const separator = document.createElement('div');
        separator.className = 'stroke-separator';
        combinedInput.appendChild(separator);

        const opacityValues = strokesByElement.map((strokes) => {
            const op = strokes[index]?.opacity;
            return op !== undefined ? op : 100;
        });
        const opacityResult = this.getMixedResult(opacityValues);

        const opacityInput = new NumberInput({
            value: opacityResult.mixed ? 100 : opacityResult.value,
            onChange: (val, isTransient) => {
                this.updateStrokeForSelection(index, { opacity: val }, isTransient);
            },
            min: 0,
            max: 100,
            step: 1,
            units: '%',
            scrubbable: true,
            mixedPlaceholder: 'Mixed'
        });
        opacityInput.element.classList.add('stroke-opacity-input');
        opacityInput.element.setAttribute('data-testid', `stroke-opacity-${index}`);
        opacityInput.setMixed(opacityResult.mixed);
        combinedInput.appendChild(opacityInput.element);

        const isNormalBlend = strokesByElement.every((strokes) => !strokes[index]?.blendMode || strokes[index]?.blendMode === 'normal');
        const blendBtn = new IconButton({
            icon: Icons.BLEND_MODE,
            title: `Blend Mode: ${stroke.blendMode || 'Normal'}`,
            onClick: (e) => {
                const btn = e.target.closest('button') || e.target;
                this.openBlendModeMenu(btn, stroke, index, (elements && elements[0]) ? elements[0] : null);
            }
        });
        blendBtn.element.classList.add('pi-btn-compact');
        if (!isNormalBlend) {
            blendBtn.element.classList.add('pi-btn-active');
        }

        const strokeContent = document.createElement('div');
        strokeContent.className = 'stroke-content';
        strokeContent.appendChild(combinedInput);
        strokeContent.appendChild(blendBtn.element);
        propertyRow.appendChild(strokeContent);

        return row;
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
            onChange: (updates, isTransient) => this.updateStrokeForSelection(index, updates, isTransient),
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
        this.addStrokeForSelection();
    }

    removeStroke(index) {
        this.removeStrokeForSelection(index);
    }

    updateStroke(index, updates, isTransient = false) {
        this.updateStrokeForSelection(index, updates, isTransient);
    }

    reorderStrokes(element, fromIndex, toIndex) {
        // Legacy single-element contract (used by unit tests): operate on provided element.
        if (element) {
            const strokes = element?.style?.strokes;
            if (!Array.isArray(strokes) || strokes.length === 0) return;
            if (fromIndex === toIndex) return;
            if (fromIndex < 0 || fromIndex >= strokes.length) return;
            if (toIndex < 0 || toIndex > strokes.length) return;

            const next = [...strokes];
            const [movedItem] = next.splice(fromIndex, 1);
            const adjustedToIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
            next.splice(adjustedToIndex, 0, movedItem);

            // For unit tests we only need to preserve legacy sync behavior.
            this.applyStrokesToElement(element.id, element, next, false);
            return;
        }

        // Default behavior: apply to current selection.
        this.reorderStrokesForSelection(fromIndex, toIndex);
    }

    // Legacy helper used by unit tests and older call sites.
    // Applies a whole strokes array and syncs legacy border props.
    commitChanges(strokes, isTransient = false) {
        if (!this.selection || this.selection.length === 0) return;
        const state = store.getState();
        this.selection.forEach((id) => {
            const element = this.getElement(state, id);
            if (!element) return;
            this.applyStrokesToElement(id, element, strokes || [], isTransient);
        });
    }

    addStrokeForSelection() {
        if (!this.selection || this.selection.length === 0) return;
        const state = store.getState();
        this.selection.forEach((id) => {
            const element = this.getElement(state, id);
            if (!element) return;
            const style = element.style || {};
            let strokes = [...this.getNormalizedStrokes(element)];

            const isFirst = strokes.length === 0;
            strokes.unshift(isFirst ? {
                color: LastUsed.solid,
                width: 1,
                opacity: 100,
                position: 'center',
                visible: true
            } : {
                color: '#000000',
                width: 1,
                opacity: 25,
                position: 'center',
                visible: true
            });

            this.applyStrokesToElement(id, element, strokes, false);
        });
    }

    removeStrokeForSelection(index) {
        if (!this.selection || this.selection.length === 0) return;
        const state = store.getState();
        this.selection.forEach((id) => {
            const element = this.getElement(state, id);
            if (!element) return;
            const strokes = [...this.getNormalizedStrokes(element)];
            strokes.splice(index, 1);
            this.applyStrokesToElement(id, element, strokes, false);
        });
    }

    reorderStrokesForSelection(fromIndex, toIndex) {
        if (!this.selection || this.selection.length === 0) return;
        const state = store.getState();
        this.selection.forEach((id) => {
            const element = this.getElement(state, id);
            if (!element) return;
            const strokes = [...this.getNormalizedStrokes(element)];
            const [movedItem] = strokes.splice(fromIndex, 1);
            const adjustedToIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
            strokes.splice(adjustedToIndex, 0, movedItem);
            this.applyStrokesToElement(id, element, strokes, false);
        });
    }

    updateStrokeForSelection(index, updates, isTransient = false) {
        if (!this.selection || this.selection.length === 0) return;
        const state = store.getState();
        this.selection.forEach((id) => {
            const element = this.getElement(state, id);
            if (!element) return;
            const style = element.style || {};
            const strokes = [...this.getNormalizedStrokes(element)];
            const nextStroke = { ...(strokes[index] || {}) };

            if (updates.type) {
                nextStroke.type = updates.type;
                if (updates.type === 'solid') {
                    nextStroke.color = LastUsed.solid;
                } else if (updates.type === 'gradient') {
                    nextStroke.value = LastUsed.gradient;
                }
            }

            if (updates.color) {
                nextStroke.color = updates.color;
                if (!nextStroke.type || nextStroke.type === 'solid') {
                    LastUsed.solid = updates.color;
                }
            }

            if (updates.value) {
                nextStroke.value = updates.value;
                if (nextStroke.type === 'gradient') {
                    LastUsed.gradient = updates.value;
                }
            }

            Object.keys(updates).forEach((key) => {
                if (key !== 'type' && key !== 'color' && key !== 'value') {
                    nextStroke[key] = updates[key];
                }
            });

            strokes[index] = nextStroke;
            this.applyStrokesToElement(id, element, strokes, isTransient);
        });
    }

    applyStrokesToElement(id, element, strokes, isTransient = false) {
        const firstVisible = strokes.find((s) => s.visible !== false);
        const legacyUpdates = {};
        if (firstVisible) {
            legacyUpdates.borderColor = firstVisible.color;
            legacyUpdates.borderWidth = firstVisible.width;
            legacyUpdates.strokeAlign = firstVisible.position;
        } else {
            legacyUpdates.borderWidth = 0;
        }

        const newStyle = { ...(element.style || {}), strokes, ...legacyUpdates };
        store.dispatch('UPDATE_ELEMENT', { id, style: newStyle }, { skipHistory: isTransient });
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
