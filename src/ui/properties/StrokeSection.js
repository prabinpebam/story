import { Section } from '../components/Section.js';
import { ColorInput } from '../components/ColorInput.js';
import { NumberInput } from '../components/NumberInput.js';
import { Dropdown } from '../components/Dropdown.js';
import { IconButton } from '../components/IconButton.js';
import { Icons } from '../Icons.js';
import { store } from '../../core/Store.js';
import { StrokeSettingsFlyout } from '../components/StrokeFlyout/StrokeSettingsFlyout.js';
import { BlendModes } from '../../core/constants/BlendModes.js';

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
            // Legacy support: Check borderWidth/borderColor
            const hasStroke = style.borderWidth > 0 || style.borderColor;
            if (hasStroke) {
                strokes = [{
                    color: style.borderColor || '#000000',
                    width: style.borderWidth || 1,
                    opacity: 100,
                    position: style.strokeAlign || 'center',
                    visible: true
                }];
            }
        }

        if (strokes.length === 0) {
            // Show empty state hint if desired, or just rely on header
            // For now, let's just show nothing in the body
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
        combinedInput.style.border = '1px solid #444';
        combinedInput.style.borderRadius = '4px';
        combinedInput.style.height = '24px';
        combinedInput.style.overflow = 'hidden';
        combinedInput.style.backgroundColor = '#262626';

        // Swatch (Trigger for Flyout)
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch-trigger';
        swatch.style.width = '28px';
        swatch.style.height = '100%';
        swatch.style.cursor = 'pointer';
        swatch.style.display = 'flex';
        swatch.style.alignItems = 'center';
        swatch.style.justifyContent = 'center';
        swatch.style.borderRight = '1px solid #444';
        
        const preview = document.createElement('div');
        preview.style.width = '14px';
        preview.style.height = '14px';
        preview.style.borderRadius = '2px';
        preview.style.border = '1px solid rgba(255,255,255,0.1)';
        
        if (stroke.type === 'gradient') {
             // Placeholder for gradient preview
             preview.style.background = 'linear-gradient(45deg, #ccc, #333)'; 
        } else {
             preview.style.backgroundColor = stroke.color || '#000000';
        }
        swatch.appendChild(preview);

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
        hexInput.style.color = '#ccc';
        hexInput.style.fontSize = '11px';
        hexInput.style.fontFamily = 'monospace';
        hexInput.style.padding = '0 6px';
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
        separator.style.height = '100%';
        separator.style.backgroundColor = '#444';
        combinedInput.appendChild(separator);

        // Opacity Input
        const opacityInput = new NumberInput({
            value: stroke.opacity !== undefined ? stroke.opacity : 100,
            onChange: (val) => {
                this.updateStroke(index, { opacity: val });
            },
            min: 0,
            max: 100,
            step: 1,
            units: '%',
            scrubbable: true
        });
        
        opacityInput.element.style.width = '50px';
        opacityInput.element.style.flex = '0 0 50px';
        opacityInput.element.style.border = 'none';
        opacityInput.element.style.background = 'transparent';
        opacityInput.element.querySelector('input').style.padding = '0 4px';
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
        blendBtn.element.style.color = isNormalBlend ? '#666' : '#0055FF';
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
            onChange: (updates) => this.updateStroke(index, updates),
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

            if ((stroke.blendMode || 'normal') === mode) {
                item.style.backgroundColor = '#0055FF';
                item.style.color = '#fff';
            }

            item.onmouseenter = () => {
                if ((stroke.blendMode || 'normal') !== mode) item.style.backgroundColor = '#383838';
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
        if (!style.strokes && (style.borderWidth > 0 || style.borderColor)) {
            strokes.push({
                color: style.borderColor || '#000000',
                width: style.borderWidth || 1,
                opacity: 100,
                position: style.strokeAlign || 'center',
                visible: true
            });
        }

        // Add new default stroke
        strokes.unshift({ // Add to top (start of array)
            color: '#000000',
            width: 1,
            opacity: 100,
            position: 'center',
            visible: true
        });

        this.commitChanges(strokes);
    }

    removeStroke(index) {
        const state = store.getState();
        const element = this.getElement(state, this.selection[0]);
        if (!element) return;

        const style = element.style || {};
        let strokes = style.strokes ? [...style.strokes] : [];
        
        // Handle legacy migration if needed
        if (!style.strokes && (style.borderWidth > 0 || style.borderColor)) {
             strokes = [{
                color: style.borderColor || '#000000',
                width: style.borderWidth || 1,
                opacity: 100,
                position: style.strokeAlign || 'center',
                visible: true
            }];
        }

        strokes.splice(index, 1);
        this.commitChanges(strokes);
    }

    updateStroke(index, updates) {
        const state = store.getState();
        const element = this.getElement(state, this.selection[0]);
        if (!element) return;

        const style = element.style || {};
        let strokes = style.strokes ? [...style.strokes] : [];

        // Handle legacy migration if needed
        if (!style.strokes && (style.borderWidth > 0 || style.borderColor)) {
             strokes = [{
                color: style.borderColor || '#000000',
                width: style.borderWidth || 1,
                opacity: 100,
                position: style.strokeAlign || 'center',
                visible: true
            }];
        }

        strokes[index] = { ...strokes[index], ...updates };
        this.commitChanges(strokes);
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

    commitChanges(strokes) {
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
                strokes: strokes,
                ...legacyUpdates
            }
        });
    }
}
