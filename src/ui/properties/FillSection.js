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
        
        // Determine fill value
        // If it's an image type, maybe we don't show Fill section or we show Image controls?
        // For now, let's assume we are editing backgroundColor.
        
        const style = element.style || {};
        const backgroundColor = style.backgroundColor || '#D9D9D9'; // Default in renderer
        const hasFill = style.hasFill !== false; // Default true

        if (!hasFill) {
             const hint = document.createElement('div');
            hint.textContent = 'No fill';
            hint.style.color = 'var(--text-tertiary)';
            hint.style.fontSize = '11px';
            hint.style.padding = 'var(--spacing-1) 0';
            this.container.appendChild(hint);
            return;
        }

        const row = document.createElement('div');
        row.className = 'pi-row';
        
        const colorInput = new ColorInput(
            backgroundColor,
            (val) => this.updateStyle('backgroundColor', val)
        );
        colorInput.element.style.flex = '1';

        // Opacity for fill? 
        // The renderer uses `el.opacity` for the whole element.
        // CSS background-color supports alpha (rgba).
        // If we want separate fill opacity, we need to parse/manipulate the color string or add `fillOpacity`.
        // For now, let's assume the ColorInput handles alpha or we just set the color string.
        
        const removeBtn = new IconButton({
            icon: Icons.MINUS,
            title: 'Remove Fill',
            onClick: () => this.removeFill()
        });

        row.appendChild(colorInput.element);
        row.appendChild(removeBtn.element);
        
        this.container.appendChild(row);
    }

    addFill() {
        this.updateStyle('hasFill', true);
        this.updateStyle('backgroundColor', '#D9D9D9');
    }

    removeFill() {
        this.updateStyle('hasFill', false);
        this.updateStyle('backgroundColor', 'transparent');
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
