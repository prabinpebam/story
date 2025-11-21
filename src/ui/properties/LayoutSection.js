import { Section } from '../components/Section.js';
import { NumberInput } from '../components/NumberInput.js';
import { IconButton } from '../components/IconButton.js';
import { Icons } from '../Icons.js';
import { store } from '../../core/Store.js';

export class LayoutSection {
    constructor() {
        this.section = new Section({ title: 'Layout' });
        this.constrainProportions = true; // Default to true
        this.createContent();
    }

    createContent() {
        // W / H Row
        const dimRow = document.createElement('div');
        dimRow.className = 'pi-row';

        this.wInput = new NumberInput({
            label: 'W',
            value: 0,
            onChange: (val) => this.updateDimension('width', val)
        });

        this.hInput = new NumberInput({
            label: 'H',
            value: 0,
            onChange: (val) => this.updateDimension('height', val)
        });

        // Constrain Button
        this.constrainBtn = new IconButton({
            icon: Icons.LINK,
            title: 'Constrain Proportions',
            isActive: this.constrainProportions,
            onClick: () => this.toggleConstrain()
        });

        dimRow.appendChild(this.wInput.element);
        dimRow.appendChild(this.hInput.element);
        dimRow.appendChild(this.constrainBtn.element);

        this.section.appendChild(dimRow);
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
            this.wInput.setValue(element.width, false);
            this.hInput.setValue(element.height, false);
            
            // Store aspect ratio for constraint logic
            this.aspectRatio = element.width / element.height;
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

    updateDimension(prop, value) {
        const state = store.getState();
        const selection = state.editor.selectedElementIds;
        
        selection.forEach(id => {
            const updates = { [prop]: value };
            
            if (this.constrainProportions && this.aspectRatio) {
                if (prop === 'width') {
                    updates.height = value / this.aspectRatio;
                    this.hInput.setValue(updates.height, false);
                } else {
                    updates.width = value * this.aspectRatio;
                    this.wInput.setValue(updates.width, false);
                }
            }
            
            store.dispatch('UPDATE_ELEMENT', { id, ...updates });
        });
    }

    toggleConstrain() {
        this.constrainProportions = !this.constrainProportions;
        this.constrainBtn.setActive(this.constrainProportions);
        this.constrainBtn.element.innerHTML = this.constrainProportions ? Icons.LINK : Icons.LINK_BROKEN;
        
        // Update aspect ratio based on current values
        const state = store.getState();
        const selection = state.editor.selectedElementIds;
        if (selection && selection.length > 0) {
            const el = this.getElement(state, selection[0]);
            if (el) this.aspectRatio = el.width / el.height;
        }
    }
}
