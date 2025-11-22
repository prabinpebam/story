import { Section } from '../components/Section.js';
import { NumberInput } from '../components/NumberInput.js';
import { Dropdown } from '../components/Dropdown.js';
import { Icons } from '../Icons.js';
import { store } from '../../core/Store.js';

export class AppearanceSection {
    constructor() {
        this.section = new Section({ 
            title: 'Appearance',
            actions: [
                { icon: Icons.VISIBLE, title: 'Toggle Visibility', onClick: () => this.toggleVisibility() }
            ]
        });
        this.createContent();
    }

    createContent() {
        // Opacity Row
        const opacityRow = document.createElement('div');
        opacityRow.className = 'pi-row';

        this.opacityInput = new NumberInput({
            label: 'Opacity', // Or icon
            value: 100,
            units: '%',
            min: 0,
            max: 100,
            onChange: (val) => this.updateProperty('opacity', val / 100)
        });

        // Blend Mode
        this.blendModeSelect = new Dropdown({
            options: [
                { label: 'Normal', value: 'normal' },
                { label: 'Multiply', value: 'multiply' },
                { label: 'Screen', value: 'screen' },
                { label: 'Overlay', value: 'overlay' },
                { label: 'Darken', value: 'darken' },
                { label: 'Lighten', value: 'lighten' },
                { label: 'Color Dodge', value: 'color-dodge' },
                { label: 'Color Burn', value: 'color-burn' },
                { label: 'Hard Light', value: 'hard-light' },
                { label: 'Soft Light', value: 'soft-light' },
                { label: 'Difference', value: 'difference' },
                { label: 'Exclusion', value: 'exclusion' },
                { label: 'Hue', value: 'hue' },
                { label: 'Saturation', value: 'saturation' },
                { label: 'Color', value: 'color' },
                { label: 'Luminosity', value: 'luminosity' }
            ],
            value: 'normal',
            onChange: (val) => this.updateProperty('blendMode', val)
        });
        
        // Style adjustments for row
        this.opacityInput.element.style.flex = '0 0 100px'; // Fixed width for opacity
        this.blendModeSelect.element.style.flex = '1';

        opacityRow.appendChild(this.opacityInput.element);
        opacityRow.appendChild(this.blendModeSelect.element);
        this.section.appendChild(opacityRow);

        // Corner Radius Row
        const radiusRow = document.createElement('div');
        radiusRow.className = 'pi-row';

        this.radiusInput = new NumberInput({
            label: 'Radius', // Or icon
            value: 0,
            min: 0,
            onChange: (val) => this.updateProperty('borderRadius', val)
        });

        radiusRow.appendChild(this.radiusInput.element);
        this.section.appendChild(radiusRow);
    }

    update(selection) {
        if (!selection || selection.length === 0) {
            this.section.element.style.display = 'none';
            return;
        }
        
        this.section.element.style.display = 'block';
        
        const state = store.getState();
        const elementId = selection[0];
        const element = this.getElement(state, elementId);

        if (element) {
            // Opacity is 0-1 in store, 0-100 in UI
            const opacity = element.opacity !== undefined ? element.opacity : 1;
            this.opacityInput.setValue(Math.round(opacity * 100), false);
            
            const blendMode = element.blendMode || 'normal';
            this.blendModeSelect.setValue(blendMode);
            
            // Only show radius for shapes/images/rects
            if (element.type === 'rect' || element.type === 'image') {
                this.radiusInput.element.style.display = 'flex';
                const radius = element.borderRadius || 0;
                this.radiusInput.setValue(radius, false);
            } else {
                this.radiusInput.element.style.display = 'none';
            }
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

    updateProperty(prop, value) {
        const state = store.getState();
        const selection = state.editor.selectedElementIds;
        
        selection.forEach(id => {
            store.dispatch('UPDATE_ELEMENT', { id, [prop]: value });
        });
    }

    toggleVisibility() {
        const state = store.getState();
        const selection = state.editor.selectedElementIds;
        
        // Toggle based on first item
        const firstEl = this.getElement(state, selection[0]);
        const newHidden = !firstEl.hidden; // Toggle hidden state
        
        selection.forEach(id => {
            store.dispatch('UPDATE_ELEMENT', { id, hidden: newHidden });
        });
        
        // Update icon state (optional, or wait for re-render)
    }
}
