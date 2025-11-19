import { store } from '../core/Store.js';
import { Knob } from './components/Knob.js';
import { Switch } from './components/Switch.js';
import { SegmentedControl } from './components/SegmentedControl.js';
import { ScrubbableControl } from './components/ScrubbableControl.js';

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
        } else if (element.type === 'image') {
            this.renderImageProperties(element);
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
        // Alignment Row
        const alignRow = document.createElement('div');
        alignRow.style.display = 'flex';
        alignRow.style.justifyContent = 'space-between';
        alignRow.style.marginBottom = '16px';
        alignRow.style.padding = '0 4px';

        const aligns = [
            { icon: 'fa-align-left', action: 'left', title: 'Align Left' },
            { icon: 'fa-align-center', action: 'center', title: 'Align Center' },
            { icon: 'fa-align-right', action: 'right', title: 'Align Right' },
            { icon: 'fa-align-left', action: 'top', title: 'Align Top', rotate: 90 },
            { icon: 'fa-align-center', action: 'middle', title: 'Align Middle', rotate: 90 },
            { icon: 'fa-align-right', action: 'bottom', title: 'Align Bottom', rotate: 90 }
        ];

        aligns.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'icon-btn';
            btn.style.width = '24px';
            btn.style.height = '24px';
            btn.title = item.title;
            btn.innerHTML = `<i class="fa-solid ${item.icon}" style="${item.rotate ? `transform: rotate(${item.rotate}deg)` : ''}"></i>`;
            btn.onclick = () => store.dispatch('ALIGN_ELEMENTS', item.action);
            alignRow.appendChild(btn);
        });

        this.container.appendChild(alignRow);

        const group = this.createControlGroup('TRANSFORM');
        
        // Position Row (X, Y)
        const posRow = document.createElement('div');
        posRow.style.display = 'flex';
        posRow.style.gap = '8px';
        posRow.style.marginBottom = '8px';

        // X Position
        const xControl = new ScrubbableControl('X', element.x, (val) => {
            this.updateProperty(element.id, 'x', val);
        });
        posRow.appendChild(xControl.element);

        // Y Position
        const yControl = new ScrubbableControl('Y', element.y, (val) => {
            this.updateProperty(element.id, 'y', val);
        });
        posRow.appendChild(yControl.element);

        group.appendChild(posRow);

        // Size Row (W, H)
        const sizeRow = document.createElement('div');
        sizeRow.style.display = 'flex';
        sizeRow.style.gap = '8px';
        sizeRow.style.marginBottom = '8px';

        // Width
        const wControl = new ScrubbableControl('W', element.width, (val) => {
            this.updateProperty(element.id, 'width', Math.max(1, val)); // Prevent 0/negative
        });
        sizeRow.appendChild(wControl.element);

        // Height
        const hControl = new ScrubbableControl('H', element.height, (val) => {
            this.updateProperty(element.id, 'height', Math.max(1, val));
        });
        sizeRow.appendChild(hControl.element);

        group.appendChild(sizeRow);

        // Rotation
        const rotRow = document.createElement('div');
        rotRow.style.display = 'flex';
        rotRow.style.gap = '8px';
        rotRow.style.marginBottom = '8px';
        
        const rotControl = new ScrubbableControl('°', element.rotation || 0, (val) => {
            this.updateProperty(element.id, 'rotation', val % 360);
        });
        rotRow.appendChild(rotControl.element);
        
        // Spacer to fill row
        const spacer = document.createElement('div');
        spacer.style.flex = '1';
        rotRow.appendChild(spacer);

        group.appendChild(rotRow);

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

        // Font Size
        const sizeRow = document.createElement('div');
        sizeRow.style.display = 'flex';
        sizeRow.style.marginBottom = '8px';
        
        const sizeControl = new ScrubbableControl('Size', style.fontSize || 16, (val) => {
            this.updateStyle(element, 'fontSize', Math.max(1, val));
        });
        sizeRow.appendChild(sizeControl.element);
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
        const borderWidthRow = document.createElement('div');
        borderWidthRow.style.display = 'flex';
        borderWidthRow.style.marginBottom = '8px';
        
        const borderWidthControl = new ScrubbableControl('Width', style.borderWidth || 0, (val) => {
            this.updateStyle(element, 'borderWidth', Math.max(0, val));
        });
        borderWidthRow.appendChild(borderWidthControl.element);
        group.appendChild(borderWidthRow);

        // Border Radius
        const radiusRow = document.createElement('div');
        radiusRow.style.display = 'flex';
        radiusRow.style.marginBottom = '8px';
        
        const radiusControl = new ScrubbableControl('Radius', style.radius || 0, (val) => {
            this.updateStyle(element, 'radius', Math.max(0, val));
        });
        radiusRow.appendChild(radiusControl.element);
        group.appendChild(radiusRow);

        this.container.appendChild(group);
    }

    renderImageProperties(element) {
        const group = this.createControlGroup('IMAGE');
        const style = element.style || {};

        // Opacity
        const opacityRow = document.createElement('div');
        opacityRow.style.display = 'flex';
        opacityRow.style.marginBottom = '8px';
        
        const opacityControl = new ScrubbableControl('Opacity', (element.opacity !== undefined ? element.opacity : 1) * 100, (val) => {
            this.updateProperty(element.id, 'opacity', Math.min(100, Math.max(0, val)) / 100);
        }, { min: 0, max: 100 });
        opacityRow.appendChild(opacityControl.element);
        group.appendChild(opacityRow);

        // Border Radius
        const radiusRow = document.createElement('div');
        radiusRow.style.display = 'flex';
        radiusRow.style.marginBottom = '8px';
        
        const radiusControl = new ScrubbableControl('Radius', style.radius || 0, (val) => {
            this.updateStyle(element, 'radius', Math.max(0, val));
        });
        radiusRow.appendChild(radiusControl.element);
        group.appendChild(radiusRow);

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
