import { ScrubbableControl } from '../../components/ScrubbableControl.js';
import { Switch } from '../../components/Switch.js';
import { ColorInput } from '../../components/ColorInput.js';
import { createControlGroup, updateStyle, updateShadow } from './LegacyUtils.js';

export class LegacyEffectsSection {
    constructor(container, sectionStates) {
        this.container = container;
        this.sectionStates = sectionStates;
    }

    render(element, selection) {
        const { group, content } = createControlGroup('Effects', this.sectionStates, false);
        const style = element.style || {};

        // Drop Shadow
        const shadow = style.dropShadow || { x: 0, y: 0, blur: 0, spread: 0, color: '#000000' };
        const hasShadow = shadow.blur > 0 || shadow.x !== 0 || shadow.y !== 0;

        const shadowHeader = document.createElement('div');
        shadowHeader.style.display = 'flex';
        shadowHeader.style.justifyContent = 'space-between';
        shadowHeader.style.alignItems = 'center';
        shadowHeader.style.marginBottom = '8px';
        
        const shadowLabel = document.createElement('span');
        shadowLabel.innerText = 'Drop Shadow';
        shadowLabel.style.fontSize = '11px';
        shadowLabel.style.color = 'var(--color-text-secondary)';
        
        const shadowToggle = new Switch('', hasShadow, (checked) => {
            if (checked) {
                updateStyle(selection, 'dropShadow', { x: 0, y: 4, blur: 4, spread: 0, color: '#00000040' });
            } else {
                updateStyle(selection, 'dropShadow', null);
            }
        });
        
        shadowHeader.appendChild(shadowLabel);
        shadowHeader.appendChild(shadowToggle.element);
        content.appendChild(shadowHeader);

        if (style.dropShadow) {
            // X / Y
            const posRow = document.createElement('div');
            posRow.style.display = 'flex';
            posRow.style.gap = '8px';
            posRow.style.marginBottom = '8px';
            
            const xControl = new ScrubbableControl('X', shadow.x, (val) => updateShadow(selection, 'x', val));
            const yControl = new ScrubbableControl('Y', shadow.y, (val) => updateShadow(selection, 'y', val));
            
            posRow.appendChild(xControl.element);
            posRow.appendChild(yControl.element);
            content.appendChild(posRow);

            // Blur / Spread
            const blurRow = document.createElement('div');
            blurRow.style.display = 'flex';
            blurRow.style.gap = '8px';
            blurRow.style.marginBottom = '8px';
            
            const blurControl = new ScrubbableControl('Blur', shadow.blur, (val) => updateShadow(selection, 'blur', Math.max(0, val)));
            const spreadControl = new ScrubbableControl('Spread', shadow.spread, (val) => updateShadow(selection, 'spread', val));
            
            blurRow.appendChild(blurControl.element);
            blurRow.appendChild(spreadControl.element);
            content.appendChild(blurRow);

            // Color
            const colorRow = document.createElement('div');
            colorRow.style.display = 'flex';
            colorRow.style.justifyContent = 'flex-end';
            colorRow.style.marginTop = '8px';
            
            const colorInput = new ColorInput(shadow.color.substring(0, 7), (val) => {
                updateShadow(selection, 'color', val);
            });
            
            colorRow.appendChild(colorInput.element);
            content.appendChild(colorRow);
        }

        // Layer Blur
        const blur = style.blur;
        const blurHeader = document.createElement('div');
        blurHeader.style.display = 'flex';
        blurHeader.style.justifyContent = 'space-between';
        blurHeader.style.alignItems = 'center';
        blurHeader.style.marginTop = '16px';
        blurHeader.style.marginBottom = '8px';
        
        const blurLabel = document.createElement('span');
        blurLabel.innerText = 'Layer Blur';
        blurLabel.style.fontSize = '11px';
        blurLabel.style.color = 'var(--color-text-secondary)';
        
        const blurToggle = new Switch('', blur !== undefined && blur !== null, (checked) => {
            if (checked) {
                updateStyle(selection, 'blur', 4);
            } else {
                updateStyle(selection, 'blur', null);
            }
        });
        
        blurHeader.appendChild(blurLabel);
        blurHeader.appendChild(blurToggle.element);
        content.appendChild(blurHeader);

        if (blur !== undefined && blur !== null) {
            const blurAmountControl = new ScrubbableControl('Amount', blur, (val) => {
                updateStyle(selection, 'blur', Math.max(0, val));
            });
            content.appendChild(blurAmountControl.element);
        }

        this.container.appendChild(group);
    }
}
