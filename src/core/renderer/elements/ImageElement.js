import { ShapeElement } from './ShapeElement.js';

export class ImageElement extends ShapeElement {
    mount(container) {
        const div = super.mount(container);
        const img = document.createElement('img');
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.pointerEvents = 'none';
        img.draggable = false;
        div.appendChild(img);
        
        // Force update to set src
        this.update(this.data);
        
        return div;
    }

    update(newData) {
        super.update(newData);
        const el = this.data;
        const div = this.domElement;
        const img = div.querySelector('img');

        if (img) {
            if (img.src !== el.src) {
                img.src = el.src;
            }
            img.style.objectFit = el.scaleMode || 'cover';
            
            const radius = el.borderRadius || el.style?.radius || 0;
            img.style.borderRadius = `${radius}px`;
        }
    }
}
