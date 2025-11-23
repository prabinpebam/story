import { Section } from '../components/Section.js';
import { NumberInput } from '../components/NumberInput.js';
import { ColorInput } from '../components/ColorInput.js';
import { IconButton } from '../components/IconButton.js';
import { Dropdown } from '../components/Dropdown.js';
import { Icons } from '../Icons.js';
import { store } from '../../core/Store.js';

export class TextSection {
    constructor() {
        this.section = new Section({ title: 'Text' });
        this.createContent();
    }

    createContent() {
        // 1. Font Family & Weight
        const fontRow = document.createElement('div');
        fontRow.className = 'pi-row';
        fontRow.style.display = 'grid';
        fontRow.style.gridTemplateColumns = '2fr 1fr';
        fontRow.style.gap = '8px';

        this.fontFamilyInput = new Dropdown({
            options: [
                { label: 'Inter', value: 'Inter' },
                { label: 'Roboto', value: 'Roboto' },
                { label: 'Arial', value: 'Arial' },
                { label: 'Times New Roman', value: 'Times New Roman' },
                { label: 'Courier New', value: 'Courier New' },
                { label: 'Georgia', value: 'Georgia' }
            ],
            value: 'Inter',
            onChange: (val) => this.updateProperty('fontFamily', val)
        });

        this.fontWeightInput = new Dropdown({
            options: [
                { label: 'Light', value: '300' },
                { label: 'Regular', value: '400' },
                { label: 'Medium', value: '500' },
                { label: 'Bold', value: '700' },
                { label: 'Black', value: '900' }
            ],
            value: '400',
            onChange: (val) => this.updateProperty('fontWeight', val)
        });

        fontRow.appendChild(this.fontFamilyInput.element);
        fontRow.appendChild(this.fontWeightInput.element);
        this.section.appendChild(fontRow);

        // 2. Size, Line Height, Letter Spacing
        const sizeRow = document.createElement('div');
        sizeRow.className = 'pi-row';
        sizeRow.style.display = 'grid';
        sizeRow.style.gridTemplateColumns = '1fr 1fr 1fr';
        sizeRow.style.gap = '8px';

        this.fontSizeInput = new NumberInput({
            label: 'Size',
            value: 16,
            min: 1,
            onChange: (val) => this.updateProperty('fontSize', val)
        });

        this.lineHeightInput = new NumberInput({
            label: 'LH', // Line Height
            value: 1.2,
            step: 0.1,
            onChange: (val) => this.updateProperty('lineHeight', val)
        });

        this.letterSpacingInput = new NumberInput({
            label: 'LS', // Letter Spacing
            value: 0,
            step: 0.1,
            onChange: (val) => this.updateProperty('letterSpacing', val)
        });

        sizeRow.appendChild(this.fontSizeInput.element);
        sizeRow.appendChild(this.lineHeightInput.element);
        sizeRow.appendChild(this.letterSpacingInput.element);
        this.section.appendChild(sizeRow);

        // 3. Alignment & Color
        const alignRow = document.createElement('div');
        alignRow.className = 'pi-row';
        alignRow.style.display = 'flex';
        alignRow.style.justifyContent = 'space-between';
        alignRow.style.alignItems = 'center';

        const alignGroup = document.createElement('div');
        alignGroup.style.display = 'flex';
        alignGroup.style.gap = '2px';

        const aligns = [
            { icon: Icons.ALIGN_LEFT, value: 'left' },
            { icon: Icons.ALIGN_CENTER, value: 'center' },
            { icon: Icons.ALIGN_RIGHT, value: 'right' },
            { icon: Icons.ALIGN_JUSTIFY, value: 'justify' }
        ];

        this.alignButtons = aligns.map(a => {
            const btn = new IconButton({
                icon: a.icon,
                onClick: () => this.updateProperty('textAlign', a.value)
            });
            alignGroup.appendChild(btn.element);
            return { btn, value: a.value };
        });

        this.colorInput = new ColorInput('#000000', (val) => this.updateProperty('color', val));

        alignRow.appendChild(alignGroup);
        alignRow.appendChild(this.colorInput.element);
        this.section.appendChild(alignRow);
    }

    update(selection) {
        // Only show if text elements are selected
        const state = store.getState();
        const textElements = selection
            .map(id => this.getElement(state, id))
            .filter(el => el && el.type === 'text');

        if (textElements.length === 0) {
            this.section.element.style.display = 'none';
            return;
        }

        this.section.element.style.display = 'block';
        
        // Use first element for values (or mixed)
        const el = textElements[0];
        
        // Update inputs without triggering change
        this.fontFamilyInput.setValue(el.fontFamily || 'Inter', false);
        this.fontWeightInput.setValue(el.fontWeight || '400', false);
        this.fontSizeInput.setValue(el.fontSize || 16, false);
        this.lineHeightInput.setValue(el.lineHeight || 1.2, false);
        this.letterSpacingInput.setValue(el.letterSpacing || 0, false);
        this.colorInput.value = el.color || '#000000';
        this.colorInput.element.querySelector('div').style.backgroundColor = this.colorInput.value; // Hacky update for ColorInput

        // Update Align Buttons
        const align = el.textAlign || 'left';
        this.alignButtons.forEach(({ btn, value }) => {
            if (value === align) {
                btn.element.classList.add('active');
                btn.element.style.backgroundColor = 'var(--color-bg-hover)';
            } else {
                btn.element.classList.remove('active');
                btn.element.style.backgroundColor = 'transparent';
            }
        });
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
}
