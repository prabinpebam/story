import { store } from '../core/Store.js';
import { Knob } from './components/Knob.js';
import { Switch } from './components/Switch.js';
import { SegmentedControl } from './components/SegmentedControl.js';

export class PropertyInspector {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.init();
    }

    init() {
        this.render();
        store.on('state-changed', () => this.render());
        store.on('selection-changed', () => this.render());
    }

    render() {
        const state = store.getState();
        const selection = state.editor.selectedElementIds;
        
        this.container.innerHTML = '';

        if (!selection || selection.length === 0) {
            this.renderEmptyState();
            return;
        }

        // Get selected element
        const activeSlideId = state.editor.activeSlideId;
        const currentSlide = state.slides[activeSlideId];
        if (!currentSlide) return;

        const element = currentSlide.elements[selection[0]];

        if (!element) return;

        // Render Controls based on type
        this.renderCommonProperties(element);

        if (element.type === 'text') {
            this.renderTextProperties(element);
        } else if (element.type === 'rect') {
            this.renderShapeProperties(element);
        }
    }

    renderEmptyState() {
        const div = document.createElement('div');
        div.className = 'empty-state';
        div.innerText = 'No selection';
        div.style.padding = '16px';
        div.style.color = 'var(--text-secondary)';
        div.style.textAlign = 'center';
        this.container.appendChild(div);
    }

    createControlGroup(title) {
        const group = document.createElement('div');
        group.className = 'panel-section';
        
        const label = document.createElement('div');
        label.className = 'section-title';
        label.innerText = title;
        
        group.appendChild(label);
        return group;
    }

    createInputRow(label, input) {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.marginBottom = '8px';
        
        const labelEl = document.createElement('label');
        labelEl.innerText = label;
        labelEl.style.width = '80px';
        labelEl.style.fontSize = '11px';
        labelEl.style.color = 'var(--text-secondary)';
        
        row.appendChild(labelEl);
        row.appendChild(input);
        return row;
    }

    renderCommonProperties(element) {
        const group = this.createControlGroup('TRANSFORM');
        
        // Position Row (X, Y)
        const posRow = document.createElement('div');
        posRow.style.display = 'flex';
        posRow.style.gap = '8px';
        posRow.style.marginBottom = '8px';

        // X Position
        const xInput = document.createElement('input');
        xInput.type = 'number';
        xInput.value = Math.round(element.x);
        xInput.addEventListener('change', (e) => this.updateProperty(element.id, 'x', parseInt(e.target.value)));
        
        const xWrapper = this.createLabelInputPair('X', xInput);
        posRow.appendChild(xWrapper);

        // Y Position
        const yInput = document.createElement('input');
        yInput.type = 'number';
        yInput.value = Math.round(element.y);
        yInput.addEventListener('change', (e) => this.updateProperty(element.id, 'y', parseInt(e.target.value)));
        
        const yWrapper = this.createLabelInputPair('Y', yInput);
        posRow.appendChild(yWrapper);

        group.appendChild(posRow);

        // Size Row (W, H)
        const sizeRow = document.createElement('div');
        sizeRow.style.display = 'flex';
        sizeRow.style.gap = '8px';
        sizeRow.style.marginBottom = '8px';

        // Width
        const wInput = document.createElement('input');
        wInput.type = 'number';
        wInput.value = Math.round(element.width);
        wInput.addEventListener('change', (e) => this.updateProperty(element.id, 'width', parseInt(e.target.value)));
        
        const wWrapper = this.createLabelInputPair('W', wInput);
        sizeRow.appendChild(wWrapper);

        // Height
        const hInput = document.createElement('input');
        hInput.type = 'number';
        hInput.value = Math.round(element.height);
        hInput.addEventListener('change', (e) => this.updateProperty(element.id, 'height', parseInt(e.target.value)));
        
        const hWrapper = this.createLabelInputPair('H', hInput);
        sizeRow.appendChild(hWrapper);

        group.appendChild(sizeRow);

        // Rotation Knob
        const rotationKnob = new Knob('ROTATION', element.rotation || 0, 0, 360, (val) => {
            this.updateProperty(element.id, 'rotation', Math.round(val));
        });
        
        const knobRow = document.createElement('div');
        knobRow.style.display = 'flex';
        knobRow.style.justifyContent = 'center';
        knobRow.style.padding = '8px 0';
        knobRow.appendChild(rotationKnob.element);
        group.appendChild(knobRow);

        this.container.appendChild(group);
    }

    createLabelInputPair(labelText, inputElement) {
        const wrapper = document.createElement('div');
        wrapper.style.flex = '1';
        const label = document.createElement('div');
        label.innerText = labelText;
        label.style.fontSize = '10px';
        label.style.color = 'var(--text-secondary)';
        wrapper.appendChild(label);
        wrapper.appendChild(inputElement);
        return wrapper;
    }

    renderTextProperties(element) {
        const group = this.createControlGroup('TEXT');
        const style = element.style || {};

        // Content (HTML)
        // For simple text editing, we might want a textarea or just input
        // But since content can be HTML, let's just show raw for now or strip tags?
        // Let's assume simple text for the input
        const contentInput = document.createElement('input');
        contentInput.type = 'text';
        // Strip HTML tags for display
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = element.content;
        contentInput.value = tempDiv.innerText;
        
        contentInput.addEventListener('change', (e) => {
            // Wrap in h1/p based on current tag or default?
            // For now, just update content directly. 
            // Ideally we'd have a rich text editor or just update inner text.
            this.updateProperty(element.id, 'content', `<h2>${e.target.value}</h2>`);
        });
        group.appendChild(this.createInputRow('Content', contentInput));

        // Font Size Knob
        const sizeKnob = new Knob('SIZE', style.fontSize || 16, 8, 200, (val) => {
            this.updateStyle(element, 'fontSize', Math.round(val));
        });
        
        const sizeRow = document.createElement('div');
        sizeRow.style.display = 'flex';
        sizeRow.style.justifyContent = 'center';
        sizeRow.style.padding = '8px 0';
        sizeRow.appendChild(sizeKnob.element);
        group.appendChild(sizeRow);

        // Alignment Segmented Control
        const alignControl = new SegmentedControl([
            { label: 'L', value: 'left' },
            { label: 'C', value: 'center' },
            { label: 'R', value: 'right' }
        ], style.textAlign || 'left', (val) => {
            this.updateStyle(element, 'textAlign', val);
        });
        group.appendChild(alignControl.element);

        // Color
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = style.color || '#000000';
        colorInput.addEventListener('change', (e) => this.updateStyle(element, 'color', e.target.value));
        group.appendChild(this.createInputRow('Color', colorInput));

        this.container.appendChild(group);
    }

    renderShapeProperties(element) {
        const group = this.createControlGroup('STYLE');
        const style = element.style || {};

        // Fill Color
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = style.backgroundColor || '#D9D9D9';
        colorInput.addEventListener('change', (e) => this.updateStyle(element, 'backgroundColor', e.target.value));
        group.appendChild(this.createInputRow('Fill', colorInput));

        // Border Color
        const borderColorInput = document.createElement('input');
        borderColorInput.type = 'color';
        borderColorInput.value = style.borderColor || '#000000';
        borderColorInput.addEventListener('change', (e) => this.updateStyle(element, 'borderColor', e.target.value));
        group.appendChild(this.createInputRow('Border', borderColorInput));

        // Border Width
        const borderWidthInput = document.createElement('input');
        borderWidthInput.type = 'number';
        borderWidthInput.value = style.borderWidth || 0;
        borderWidthInput.addEventListener('change', (e) => this.updateStyle(element, 'borderWidth', parseInt(e.target.value)));
        group.appendChild(this.createInputRow('B. Width', borderWidthInput));

        this.container.appendChild(group);
    }

    updateProperty(id, key, value) {
        store.dispatch('UPDATE_ELEMENT', { id, [key]: value });
    }

    updateStyle(element, key, value) {
        const newStyle = { ...element.style, [key]: value };
        store.dispatch('UPDATE_ELEMENT', { id: element.id, style: newStyle });
    }
}
