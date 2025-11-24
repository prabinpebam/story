export class VisualElement {
    constructor(data) {
        this.data = data;
        this.domElement = null;
        this.container = null;
    }

    mount(container) {
        this.container = container;
        this.domElement = document.createElement('div');
        this.domElement.id = this.data.id;
        this.domElement.classList.add('slide-element');
        this.domElement.style.position = 'absolute';
        
        // Force initial update
        this.applyStyles(this.data);
        
        container.appendChild(this.domElement);
        return this.domElement;
    }

    update(newData, slideData) {
        // We can implement smart diffing here if needed
        // For now, we just re-apply styles which is fast enough for DOM properties
        this.data = newData;
        this.slideData = slideData; // Store for reference
        if (this.domElement) {
            this.applyStyles(this.data);
        }
    }

    applyStyles(el) {
        const div = this.domElement;
        
        // Calculate absolute position if parent exists
        let x = el.x;
        let y = el.y;
        let rotation = el.rotation || 0;
        
        if (this.slideData && el.parentId) {
            let parentId = el.parentId;
            while (parentId) {
                const parent = this.slideData.elements[parentId];
                if (!parent) break;
                x += parent.x;
                y += parent.y;
                rotation += (parent.rotation || 0);
                parentId = parent.parentId;
            }
        }

        div.style.left = `${x}px`;
        div.style.top = `${y}px`;
        div.style.width = `${el.width}px`;
        div.style.height = `${el.height}px`;
        div.style.transform = `rotate(${rotation}deg)`;
        div.style.opacity = (el.opacity !== undefined && el.opacity !== null) ? el.opacity : 1;
        div.style.zIndex = el.zIndex || 'auto';
        div.style.display = el.hidden ? 'none' : 'block';
        div.style.mixBlendMode = el.blendMode || 'normal';
        
        // Border Radius is common enough to be here
        const radius = el.borderRadius || el.style?.radius || 0;
        div.style.borderRadius = `${radius}px`;
    }

    unmount() {
        if (this.domElement && this.domElement.parentNode) {
            this.domElement.parentNode.removeChild(this.domElement);
        }
        this.domElement = null;
        this.container = null;
    }
}
