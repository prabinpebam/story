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

    createControlGroup(title, defaultOpen = true) {
        const group = document.createElement('div');
        group.className = 'panel-section';
        
        const header = document.createElement('div');
        header.className = 'section-header';
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.cursor = 'pointer';
        header.style.marginBottom = '8px';
        header.style.userSelect = 'none';

        const icon = document.createElement('i');
        icon.className = `fa-solid fa-chevron-${defaultOpen ? 'down' : 'right'}`;
        icon.style.fontSize = '10px';
        icon.style.width = '16px';
        icon.style.color = 'var(--text-secondary)';
        
        const label = document.createElement('div');
        label.className = 'section-title';
        label.innerText = title;
        label.style.marginBottom = '0'; // Override default
        label.style.flex = '1';
        
        header.appendChild(icon);
        header.appendChild(label);
        
        const content = document.createElement('div');
        content.style.display = defaultOpen ? 'block' : 'none';
        
        header.onclick = () => {
            const isOpen = content.style.display !== 'none';
            content.style.display = isOpen ? 'none' : 'block';
            icon.className = `fa-solid fa-chevron-${isOpen ? 'right' : 'down'}`;
        };

        group.appendChild(header);
        group.appendChild(content);
        
        // Return content container so we append controls there
        return { group, content };
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

        const { group, content } = this.createControlGroup('TRANSFORM');
        
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

        content.appendChild(posRow);

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

        content.appendChild(sizeRow);

        // Rotation & Radius Row
        const rotRow = document.createElement('div');
        rotRow.style.display = 'flex';
        rotRow.style.gap = '8px';
        rotRow.style.marginBottom = '8px';
        
        const rotControl = new ScrubbableControl('°', element.rotation || 0, (val) => {
            this.updateProperty(element.id, 'rotation', val % 360);
        });
        rotRow.appendChild(rotControl.element);
        
        // Corner Radius (Common for all)
        const radiusControl = new ScrubbableControl('R', element.style?.radius || 0, (val) => {
            this.updateStyle(element, 'radius', Math.max(0, val));
        });
        rotRow.appendChild(radiusControl.element);

        content.appendChild(rotRow);

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
        const { group, content } = this.createControlGroup('TEXT');
        const style = element.style || {};

        // Content (HTML)
        const contentInput = document.createElement('input');
        contentInput.type = 'text';
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = element.content;
        contentInput.value = tempDiv.innerText;
        
        contentInput.addEventListener('change', (e) => {
            this.updateProperty(element.id, 'content', `<h2>${e.target.value}</h2>`);
        });
        content.appendChild(this.createInputRow('Content', contentInput));

        // Font Family
        const fontRow = document.createElement('div');
        fontRow.style.marginBottom = '8px';
        const fontSelect = document.createElement('select');
        fontSelect.style.width = '100%';
        fontSelect.style.background = 'var(--bg-well)';
        fontSelect.style.border = 'none';
        fontSelect.style.color = 'var(--text-primary)';
        fontSelect.style.padding = '4px';
        fontSelect.style.fontSize = '11px';
        
        ['Inter', 'Roboto', 'Arial', 'Times New Roman', 'Courier New', 'JetBrains Mono'].forEach(font => {
            const option = document.createElement('option');
            option.value = font;
            option.text = font;
            option.selected = (style.fontFamily || 'Inter') === font;
            fontSelect.appendChild(option);
        });
        
        fontSelect.addEventListener('change', (e) => this.updateStyle(element, 'fontFamily', e.target.value));
        fontRow.appendChild(fontSelect);
        content.appendChild(fontRow);

        // Weight & Size Row
        const weightSizeRow = document.createElement('div');
        weightSizeRow.style.display = 'flex';
        weightSizeRow.style.gap = '8px';
        weightSizeRow.style.marginBottom = '8px';

        // Weight
        const weightSelect = document.createElement('select');
        weightSelect.style.flex = '1';
        weightSelect.style.background = 'var(--bg-well)';
        weightSelect.style.border = 'none';
        weightSelect.style.color = 'var(--text-primary)';
        weightSelect.style.padding = '4px';
        weightSelect.style.fontSize = '11px';

        const weights = [
            { label: 'Light', value: '300' },
            { label: 'Regular', value: '400' },
            { label: 'Medium', value: '500' },
            { label: 'Bold', value: '700' },
            { label: 'Black', value: '900' }
        ];

        weights.forEach(w => {
            const option = document.createElement('option');
            option.value = w.value;
            option.text = w.label;
            option.selected = (style.fontWeight || '400') === w.value;
            weightSelect.appendChild(option);
        });

        weightSelect.addEventListener('change', (e) => this.updateStyle(element, 'fontWeight', e.target.value));
        weightSizeRow.appendChild(weightSelect);

        // Size
        const sizeControl = new ScrubbableControl('Size', style.fontSize || 16, (val) => {
            this.updateStyle(element, 'fontSize', Math.max(1, val));
        });
        // Hack to make it fit in the flex row nicely
        sizeControl.element.style.flex = '0 0 60px'; 
        weightSizeRow.appendChild(sizeControl.element);

        content.appendChild(weightSizeRow);

        // Line Height & Letter Spacing Row
        const spacingRow = document.createElement('div');
        spacingRow.style.display = 'flex';
        spacingRow.style.gap = '8px';
        spacingRow.style.marginBottom = '8px';

        // Line Height
        const lhControl = new ScrubbableControl('LH', parseFloat(style.lineHeight) || 1.2, (val) => {
            this.updateStyle(element, 'lineHeight', Math.max(0.5, val));
        }, { step: 0.1 });
        spacingRow.appendChild(lhControl.element);

        // Letter Spacing
        const lsControl = new ScrubbableControl('LS', parseFloat(style.letterSpacing) || 0, (val) => {
            this.updateStyle(element, 'letterSpacing', val);
        }, { step: 0.1 });
        spacingRow.appendChild(lsControl.element);

        content.appendChild(spacingRow);

        // Alignment Segmented Control
        const alignControl = new SegmentedControl([
            { label: 'L', value: 'left' },
            { label: 'C', value: 'center' },
            { label: 'R', value: 'right' },
            { label: 'J', value: 'justify' }
        ], style.textAlign || 'left', (val) => {
            this.updateStyle(element, 'textAlign', val);
        });
        content.appendChild(alignControl.element);

        // Color
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = style.color || '#000000';
        colorInput.addEventListener('change', (e) => this.updateStyle(element, 'color', e.target.value));
        content.appendChild(this.createInputRow('Color', colorInput));

        this.container.appendChild(group);
    }

    renderShapeProperties(element) {
        const { group, content } = this.createControlGroup('STYLE');
        const style = element.style || {};

        // Fill
        const fillRow = document.createElement('div');
        fillRow.style.display = 'flex';
        fillRow.style.alignItems = 'center';
        fillRow.style.justifyContent = 'space-between';
        fillRow.style.marginBottom = '8px';

        const fillLabel = document.createElement('span');
        fillLabel.textContent = 'Fill';
        fillLabel.style.fontSize = '11px';
        fillLabel.style.color = 'var(--text-secondary)';
        
        const fillInput = document.createElement('input');
        fillInput.type = 'color';
        fillInput.value = style.backgroundColor || '#D9D9D9';
        fillInput.style.width = '20px';
        fillInput.style.height = '20px';
        fillInput.style.border = 'none';
        fillInput.style.padding = '0';
        fillInput.style.background = 'none';
        fillInput.style.cursor = 'pointer';
        
        fillInput.addEventListener('change', (e) => this.updateStyle(element, 'backgroundColor', e.target.value));
        
        fillRow.appendChild(fillLabel);
        fillRow.appendChild(fillInput);
        content.appendChild(fillRow);

        // Stroke (Border)
        const strokeRow = document.createElement('div');
        strokeRow.style.display = 'flex';
        strokeRow.style.alignItems = 'center';
        strokeRow.style.justifyContent = 'space-between';
        strokeRow.style.marginBottom = '8px';

        const strokeLabel = document.createElement('span');
        strokeLabel.textContent = 'Stroke';
        strokeLabel.style.fontSize = '11px';
        strokeLabel.style.color = 'var(--text-secondary)';

        const strokeInput = document.createElement('input');
        strokeInput.type = 'color';
        strokeInput.value = style.borderColor || '#000000';
        strokeInput.style.width = '20px';
        strokeInput.style.height = '20px';
        strokeInput.style.border = 'none';
        strokeInput.style.padding = '0';
        strokeInput.style.background = 'none';
        strokeInput.style.cursor = 'pointer';

        strokeInput.addEventListener('change', (e) => this.updateStyle(element, 'borderColor', e.target.value));

        strokeRow.appendChild(strokeLabel);
        strokeRow.appendChild(strokeInput);
        content.appendChild(strokeRow);

        // Border Width & Radius Row
        const borderRow = document.createElement('div');
        borderRow.style.display = 'flex';
        borderRow.style.gap = '8px';
        borderRow.style.marginBottom = '8px';

        // Border Width
        const borderWidthControl = new ScrubbableControl('Width', parseFloat(style.borderWidth) || 0, (val) => {
            this.updateStyle(element, 'borderWidth', Math.max(0, val));
            // Ensure border style is solid if width > 0
            if (val > 0 && (!style.borderStyle || style.borderStyle === 'none')) {
                this.updateStyle(element, 'borderStyle', 'solid');
            }
        });
        borderRow.appendChild(borderWidthControl.element);

        content.appendChild(borderRow);

        this.container.appendChild(group);
    }

    renderImageProperties(element) {
        const { group, content } = this.createControlGroup('IMAGE');
        const style = element.style || {};

        // Opacity
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.gap = '8px';
        row.style.marginBottom = '8px';

        const opacityControl = new ScrubbableControl('Opacity', (element.opacity !== undefined ? element.opacity : 1) * 100, (val) => {
            this.updateProperty(element.id, 'opacity', Math.min(100, Math.max(0, val)) / 100);
        }, { min: 0, max: 100, step: 1 });
        row.appendChild(opacityControl.element);

        content.appendChild(row);
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
