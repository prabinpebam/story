import { IconButton } from '../IconButton.js';
import { Icons } from '../../Icons.js';
import { ColorInput } from '../ColorInput.js';
import { NumberInput } from '../NumberInput.js';

export class GradientTab {
    constructor(options = {}) {
        this.fill = options.fill || {};
        this.onChange = options.onChange || (() => {});
        
        this.element = document.createElement('div');
        this.element.style.display = 'flex';
        this.element.style.flexDirection = 'column';
        this.element.style.gap = '12px';
        
        this.render();
    }

    render() {
        this.element.innerHTML = '';
        
        // 1. Gradient Type Selector
        const typeRow = document.createElement('div');
        typeRow.style.display = 'flex';
        typeRow.style.gap = '8px';
        typeRow.style.alignItems = 'center';
        
        const typeSelect = document.createElement('select');
        typeSelect.style.flex = '1';
        typeSelect.style.backgroundColor = '#383838';
        typeSelect.style.color = '#FFF';
        typeSelect.style.border = 'none';
        typeSelect.style.borderRadius = '4px';
        typeSelect.style.padding = '4px';
        typeSelect.style.fontSize = '11px';
        
        ['linear', 'radial', 'angular', 'diamond'].forEach(t => {
            const opt = document.createElement('option');
            opt.value = t;
            opt.textContent = t.charAt(0).toUpperCase() + t.slice(1);
            typeSelect.appendChild(opt);
        });
        // TODO: Parse current gradient type from fill.value
        
        typeRow.appendChild(typeSelect);
        
        // Reverse & Rotate
        const reverseBtn = new IconButton({ icon: Icons.REVERSE, title: 'Reverse Gradient' });
        const rotateBtn = new IconButton({ icon: Icons.ROTATE, title: 'Rotate Gradient' });
        
        typeRow.appendChild(reverseBtn.element);
        typeRow.appendChild(rotateBtn.element);
        
        this.element.appendChild(typeRow);

        // 2. Gradient Preview Bar
        const previewBar = document.createElement('div');
        previewBar.style.height = '24px';
        previewBar.style.borderRadius = '4px';
        previewBar.style.background = this.fill.value || 'linear-gradient(90deg, #000, #FFF)';
        previewBar.style.position = 'relative';
        previewBar.style.border = '1px solid #444';
        previewBar.style.cursor = 'pointer';
        
        // Mock Stops
        const stop1 = document.createElement('div');
        stop1.style.position = 'absolute';
        stop1.style.left = '0%';
        stop1.style.top = '-2px';
        stop1.style.bottom = '-2px';
        stop1.style.width = '8px';
        stop1.style.backgroundColor = '#FFF';
        stop1.style.border = '2px solid #0055FF';
        stop1.style.borderRadius = '2px';
        stop1.style.cursor = 'ew-resize';
        
        const stop2 = document.createElement('div');
        stop2.style.position = 'absolute';
        stop2.style.left = '100%';
        stop2.style.top = '2px';
        stop2.style.bottom = '2px';
        stop2.style.width = '8px';
        stop2.style.backgroundColor = '#FFF';
        stop2.style.border = '1px solid #888';
        stop2.style.borderRadius = '2px';
        stop2.style.transform = 'translateX(-100%)';
        stop2.style.cursor = 'ew-resize';

        previewBar.appendChild(stop1);
        previewBar.appendChild(stop2);
        
        this.element.appendChild(previewBar);

        // 3. Stops List (Mock)
        const stopsList = document.createElement('div');
        stopsList.style.display = 'flex';
        stopsList.style.flexDirection = 'column';
        stopsList.style.gap = '4px';
        
        // Stop 1 Row
        const stopRow = document.createElement('div');
        stopRow.style.display = 'flex';
        stopRow.style.alignItems = 'center';
        stopRow.style.gap = '8px';
        
        const posInput = new NumberInput({ value: 0, units: '%', min: 0, max: 100 });
        posInput.element.style.width = '40px';
        
        const colorInput = new ColorInput('#000000', () => {});
        colorInput.element.style.flex = '1';
        
        const delBtn = new IconButton({ icon: Icons.MINUS, title: 'Remove Stop' });
        
        stopRow.appendChild(posInput.element);
        stopRow.appendChild(colorInput.element);
        stopRow.appendChild(delBtn.element);
        
        stopsList.appendChild(stopRow);
        this.element.appendChild(stopsList);
    }
}
