import { VisualElement } from './VisualElement.js';
import { ElementFactory } from '../ElementFactory.js';

export class GroupElement extends VisualElement {
    constructor(data) {
        super(data);
        this.children = new Map(); // ID -> VisualElement
    }

    update(newData, slideData) {
        super.update(newData, slideData);
        this.updateChildren(slideData);
    }

    updateChildren(slideData) {
        const el = this.data;
        const div = this.domElement;
        if (!div || !el.children || !slideData) return;

        const childIds = new Set(el.children);
        
        // Remove children not in list
        for (const [id, child] of this.children) {
            if (!childIds.has(id)) {
                child.unmount();
                this.children.delete(id);
            }
        }

        // Add/Update children
        el.children.forEach(childId => {
            const childData = (slideData.effectiveElements && slideData.effectiveElements[childId]) || 
                              (slideData.elements && slideData.elements[childId]);
            
            if (childData) {
                let child = this.children.get(childId);
                if (!child) {
                    child = ElementFactory.create(childData);
                    child.mount(div);
                    this.children.set(childId, child);
                }
                child.update(childData, slideData);
            }
        });
    }

    unmount() {
        this.children.forEach(child => child.unmount());
        this.children.clear();
        super.unmount();
    }
}
