import { ScrubbableControl } from '../../components/ScrubbableControl.js';
import { store } from '../../../core/Store.js';
import { createControlGroup, updateStyle } from './LegacyUtils.js';

export class LegacyImageSection {
    constructor(container, sectionStates) {
        this.container = container;
        this.sectionStates = sectionStates;
    }

    render(element, selection) {
        const { group, content } = createControlGroup('Image', this.sectionStates, true);
        const style = element.style || {};

        // Replace Image
        const btn = document.createElement('button');
        btn.innerText = 'Replace Image...';
        btn.style.width = '100%';
        btn.style.marginBottom = '8px';
        btn.className = 'btn-secondary';
        
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    selection.forEach(id => {
                        store.dispatch('UPDATE_ELEMENT', { id, src: evt.target.result });
                    });
                };
                reader.readAsDataURL(file);
            }
        };
        btn.onclick = () => fileInput.click();
        content.appendChild(fileInput);
        content.appendChild(btn);

        // Border Radius
        const radiusControl = new ScrubbableControl('Radius', parseFloat(style.borderRadius) || 0, (val) => {
            updateStyle(selection, 'borderRadius', Math.max(0, val));
        });
        content.appendChild(radiusControl.element);

        this.container.appendChild(group);
    }
}
