import { Section } from '../components/Section.js';
import { ColorInput } from '../components/ColorInput.js';
import { NumberInput } from '../components/NumberInput.js';
import { Dropdown } from '../components/Dropdown.js';
import { IconButton } from '../components/IconButton.js';
import { Icons } from '../Icons.js';
import { store } from '../../core/Store.js';

export class StrokeSection {
    constructor() {
        this.section = new Section({ 
            title: 'Stroke',
            actions: [
                { icon: Icons.PLUS, title: 'Add Stroke', onClick: () => this.addStroke() }
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
        const borderWidth = style.borderWidth || 0;
        const borderColor = style.borderColor || '#000000';
        const strokeAlign = style.strokeAlign || 'inside';
        
        // If no stroke (borderWidth 0), maybe show nothing or just the Add button in header?
        // But for now, let's show the controls if there is a stroke or if we want to allow adding one.
        // Actually, if borderWidth is 0, we might consider it "no stroke".
        // But let's assume we always show one row for simplicity, or handle the "Add" logic.
        
        if (borderWidth === 0 && !style.hasStroke) {
            // Show empty state or just rely on the header "Plus" button
            const hint = document.createElement('div');
            hint.textContent = 'No stroke';
            hint.style.color = 'var(--text-tertiary)';
            hint.style.fontSize = '11px';
            hint.style.padding = 'var(--spacing-1) 0';
            this.container.appendChild(hint);
            return;
        }

        // Row 1: Color, Visibility, Remove
        const row1 = document.createElement('div');
        row1.className = 'pi-row';
        row1.style.marginBottom = 'var(--spacing-1)';
        
        const colorInput = new ColorInput(
            borderColor,
            (val) => this.updateStyle('borderColor', val)
        );
        colorInput.element.style.flex = '1';

        // Visibility (Toggle borderWidth between 0 and saved value? Or just opacity?)
        // For now, let's just have a remove button.
        const removeBtn = new IconButton({
            icon: Icons.MINUS,
            title: 'Remove Stroke',
            onClick: () => this.removeStroke()
        });

        row1.appendChild(colorInput.element);
        row1.appendChild(removeBtn.element);
        this.container.appendChild(row1);

        // Row 2: Weight, Align, Options
        const row2 = document.createElement('div');
        row2.className = 'pi-row';
        
        const weightInput = new NumberInput({
            value: borderWidth,
            min: 0,
            label: 'W', // Icon would be better
            onChange: (val) => this.updateStyle('borderWidth', val)
        });
        weightInput.element.style.flex = '0 0 60px';

        const alignSelect = new Dropdown({
            options: [
                { label: 'Inside', value: 'inside' },
                { label: 'Center', value: 'center' },
                { label: 'Outside', value: 'outside' }
            ],
            value: strokeAlign,
            onChange: (val) => this.updateStyle('strokeAlign', val)
        });
        alignSelect.element.style.flex = '1';

        row2.appendChild(weightInput.element);
        row2.appendChild(alignSelect.element);
        this.container.appendChild(row2);
    }

    addStroke() {
        // Set default stroke
        this.updateStyle('borderWidth', 1);
        this.updateStyle('borderColor', '#000000');
        this.updateStyle('strokeAlign', 'inside');
        this.updateStyle('hasStroke', true);
    }

    removeStroke() {
        this.updateStyle('borderWidth', 0);
        this.updateStyle('hasStroke', false);
    }

    updateStyle(key, value) {
        this.selection.forEach(id => {
            const state = store.getState();
            const el = this.getElement(state, id);
            const newStyle = { ...(el.style || {}), [key]: value };
            store.dispatch('UPDATE_ELEMENT', { id, style: newStyle });
        });
    }
}
