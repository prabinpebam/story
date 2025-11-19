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

        // Effects (Shadow)
        this.renderEffectsProperties(element);
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
        alignRow.style.marginBottom = '8px';
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

        // Distribution Row (Only if > 2 elements)
        if (store.state.editor.selectedElementIds.length > 2) {
            const distRow = document.createElement('div');
            distRow.style.display = 'flex';
            distRow.style.justifyContent = 'center';
            distRow.style.gap = '8px';
            distRow.style.marginBottom = '16px';
            
            const dists = [
                { icon: 'fa-grip-lines-vertical', action: 'horizontal', title: 'Distribute Horizontal Spacing' },
                { icon: 'fa-grip-lines', action: 'vertical', title: 'Distribute Vertical Spacing' }
            ];

            dists.forEach(item => {
                const btn = document.createElement('button');
                btn.className = 'icon-btn';
                btn.style.width = '24px';
                btn.style.height = '24px';
                btn.title = item.title;
                btn.innerHTML = `<i class="fa-solid ${item.icon}"></i>`;
                btn.onclick = () => store.dispatch('DISTRIBUTE_ELEMENTS', item.action);
                distRow.appendChild(btn);
            });
            
            this.container.appendChild(distRow);
        } else {
            alignRow.style.marginBottom = '16px';
        }

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
            { label: 'L', value: 'left', icon: 'fa-align-left' },
            { label: 'C', value: 'center', icon: 'fa-align-center' },
            { label: 'R', value: 'right', icon: 'fa-align-right' },
            { label: 'J', value: 'justify', icon: 'fa-align-justify' }
        ], style.textAlign || 'left', (val) => {
            this.updateStyle(element, 'textAlign', val);
        });
        content.appendChild(alignControl.element);

        // Resizing Segmented Control
        const resizingControl = new SegmentedControl([
            { label: 'Auto Width', value: 'autoWidth', icon: 'fa-arrows-left-right' },
            { label: 'Auto Height', value: 'autoHeight', icon: 'fa-arrows-up-down' },
            { label: 'Fixed Size', value: 'fixed', icon: 'fa-expand' }
        ], style.resizing || 'autoHeight', (val) => {
            this.updateStyle(element, 'resizing', val);
        });
        content.appendChild(resizingControl.element);

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

    renderEffectsProperties(element) {
        const { group, content } = this.createControlGroup('EFFECTS');
        const style = element.style || {};
        const shadow = style.dropShadow;

        // Enable/Disable Row
        const headerRow = document.createElement('div');
        headerRow.style.display = 'flex';
        headerRow.style.justifyContent = 'space-between';
        headerRow.style.alignItems = 'center';
        headerRow.style.marginBottom = '8px';

        const label = document.createElement('span');
        label.innerText = 'Drop Shadow';
        label.style.fontSize = '11px';
        label.style.color = 'var(--text-secondary)';
        
        const toggle = document.createElement('input');
        toggle.type = 'checkbox';
        toggle.checked = !!shadow;
        toggle.onchange = (e) => {
            if (e.target.checked) {
                this.updateStyle(element, 'dropShadow', { x: 0, y: 4, blur: 4, spread: 0, color: '#00000040' });
            } else {
                this.updateStyle(element, 'dropShadow', null);
            }
        };
        
        headerRow.appendChild(label);
        headerRow.appendChild(toggle);
        content.appendChild(headerRow);

        if (shadow) {
            // X / Y
            const posRow = document.createElement('div');
            posRow.style.display = 'flex';
            posRow.style.gap = '8px';
            posRow.style.marginBottom = '8px';
            
            posRow.appendChild(new ScrubbableControl('X', shadow.x, v => this.updateShadow(element, 'x', v)).element);
            posRow.appendChild(new ScrubbableControl('Y', shadow.y, v => this.updateShadow(element, 'y', v)).element);
            content.appendChild(posRow);

            // Blur / Spread
            const blurRow = document.createElement('div');
            blurRow.style.display = 'flex';
            blurRow.style.gap = '8px';
            blurRow.style.marginBottom = '8px';
            
            blurRow.appendChild(new ScrubbableControl('Blur', shadow.blur, v => this.updateShadow(element, 'blur', Math.max(0, v))).element);
            // Spread only for non-text
            if (element.type !== 'text') {
                blurRow.appendChild(new ScrubbableControl('Spread', shadow.spread, v => this.updateShadow(element, 'spread', v)).element);
            }
            content.appendChild(blurRow);

            // Color & Opacity
            const colorRow = document.createElement('div');
            colorRow.style.display = 'flex';
            colorRow.style.alignItems = 'center';
            colorRow.style.justifyContent = 'space-between';
            colorRow.style.marginBottom = '8px';

            const colorLabel = document.createElement('span');
            colorLabel.innerText = 'Color';
            colorLabel.style.fontSize = '11px';
            colorLabel.style.color = 'var(--text-secondary)';

            const colorInput = document.createElement('input');
            colorInput.type = 'color';
            // Parse hex from shadow.color (handle #RRGGBBAA)
            const hex = shadow.color.startsWith('#') ? shadow.color : '#000000';
            colorInput.value = hex.slice(0, 7);
            
            colorInput.style.width = '20px';
            colorInput.style.height = '20px';
            colorInput.style.border = 'none';
            colorInput.style.padding = '0';
            colorInput.style.background = 'none';
            colorInput.style.cursor = 'pointer';

            colorInput.addEventListener('change', (e) => {
                // Preserve alpha
                const currentAlpha = this.getAlphaFromHex(shadow.color);
                const newHex = e.target.value + currentAlpha;
                this.updateShadow(element, 'color', newHex);
            });

            colorRow.appendChild(colorLabel);
            colorRow.appendChild(colorInput);
            content.appendChild(colorRow);
            
            // Opacity Slider for Shadow
            const opacityRow = document.createElement('div');
            opacityRow.style.display = 'flex';
            opacityRow.style.marginBottom = '8px';
            
            const currentAlphaInt = parseInt(this.getAlphaFromHex(shadow.color), 16);
            const opacityPercent = Math.round((currentAlphaInt / 255) * 100);
            
            const opacityControl = new ScrubbableControl('Opacity', opacityPercent, (val) => {
                const alpha = Math.min(255, Math.max(0, Math.round((val / 100) * 255)));
                const alphaHex = alpha.toString(16).padStart(2, '0');
                const baseHex = shadow.color.slice(0, 7);
                this.updateShadow(element, 'color', baseHex + alphaHex);
            }, { min: 0, max: 100 });
            
            opacityRow.appendChild(opacityControl.element);
            content.appendChild(opacityRow);
        }

        this.container.appendChild(group);
    }

    updateProperty(id, key, value) {
        store.dispatch('UPDATE_ELEMENT', { id, [key]: value });
    }

    updateStyle(element, key, value) {
        const newStyle = { ...element.style, [key]: value };
        store.dispatch('UPDATE_ELEMENT', { id: element.id, style: newStyle });
    }

    updateShadow(element, key, value) {
        const current = element.style.dropShadow || { x: 0, y: 4, blur: 4, spread: 0, color: '#00000040' };
        const newShadow = { ...current, [key]: value };
        this.updateStyle(element, 'dropShadow', newShadow);
    }

    getAlphaFromHex(hex) {
        if (hex.length === 9) {
            return hex.slice(7, 9);
        }
        return 'ff';
    }
}
