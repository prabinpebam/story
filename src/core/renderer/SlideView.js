import { ElementFactory } from './ElementFactory.js';
import { CodeRunner } from '../effects/CodeRunner.js';
import { MeshGradient } from '../effects/MeshGradient.js';

export class SlideView {
    constructor(slideId) {
        this.slideId = slideId;
        this.elements = new Map(); // ID -> VisualElement
        this.domElement = null;
        this.bgContainer = null;
        this.bgCodeRunner = null;
    }

    mount(container) {
        this.domElement = document.createElement('div');
        this.domElement.className = 'slide-view';
        this.domElement.id = `view-${this.slideId}`;
        this.domElement.style.position = 'absolute';
        this.domElement.style.top = '0';
        this.domElement.style.left = '0';
        // Dimensions will be set in update
        
        this.bgContainer = document.createElement('div');
        this.bgContainer.className = 'slide-background';
        this.bgContainer.style.position = 'absolute';
        this.bgContainer.style.top = '0';
        this.bgContainer.style.left = '0';
        this.bgContainer.style.width = '100%';
        this.bgContainer.style.height = '100%';
        this.bgContainer.style.zIndex = '0'; // Background at 0, elements at auto/higher
        this.bgContainer.style.pointerEvents = 'none';
        this.bgContainer.style.overflow = 'hidden';
        this.domElement.appendChild(this.bgContainer);

        container.appendChild(this.domElement);
        return this.domElement;
    }

    update(slideData) {
        // Update Dimensions
        this.domElement.style.width = `${slideData.width}px`;
        this.domElement.style.height = `${slideData.height}px`;
        
        // Inject Theme Variables
        if (slideData.themeSettings) {
            const { colors, fonts } = slideData.themeSettings;
            if (colors) {
                if (colors.accent) this.domElement.style.setProperty('--theme-accent', colors.accent);
                if (colors.textPrimary) this.domElement.style.setProperty('--theme-text-primary', colors.textPrimary);
                if (colors.textSecondary) this.domElement.style.setProperty('--theme-text-secondary', colors.textSecondary);
            }
            if (fonts) {
                if (fonts.heading) this.domElement.style.setProperty('--theme-font-heading', fonts.heading);
                if (fonts.body) this.domElement.style.setProperty('--theme-font-body', fonts.body);
            }
        }

        // Update Background
        this.applyBackground(slideData.effectiveBackground);

        // Update Elements
        const elements = slideData.effectiveElements || slideData.elements;
        const order = slideData.effectiveOrder || slideData.elementOrder;
        
        const activeIds = new Set();

        order.forEach(id => {
            const elData = elements[id];
            if (!elData) return;
            
            activeIds.add(id);
            
            let el = this.elements.get(id);
            if (!el) {
                el = ElementFactory.create(elData);
                el.mount(this.domElement);
                this.elements.set(id, el);
            }
            
            // Ensure DOM order
            this.domElement.appendChild(el.domElement);
            
            el.update(elData, slideData);
        });

        // Remove deleted
        for (const [id, el] of this.elements) {
            if (!activeIds.has(id)) {
                el.unmount();
                this.elements.delete(id);
            }
        }
    }

    applyBackground(bg) {
        const container = this.bgContainer;
        if (!container) return;

        // Clean up previous code runner
        if (this.bgCodeRunner) {
            this.bgCodeRunner.stop();
            this.bgCodeRunner = null;
        }
        
        // Clear container
        container.innerHTML = '';
        
        let fills = [];
        if (Array.isArray(bg)) {
            fills = bg;
        } else if (bg) {
            fills = [bg];
        } else {
            fills = [{ type: 'solid', value: '#ffffff' }];
        }

        fills.forEach((fill, index) => {
            if (fill.visible === false) return;

            const layer = document.createElement('div');
            layer.className = 'bg-layer';
            layer.style.position = 'absolute';
            layer.style.top = '0';
            layer.style.left = '0';
            layer.style.width = '100%';
            layer.style.height = '100%';
            layer.style.zIndex = 100 + (fills.length - index);
            layer.style.opacity = (fill.opacity !== undefined) ? fill.opacity / 100 : 1;
            layer.style.mixBlendMode = fill.blendMode || 'normal';

            if (fill.type === 'solid') {
                layer.style.backgroundColor = fill.color || fill.value;
            } else if (fill.type === 'gradient') {
                layer.style.background = fill.value;
            } else if (fill.type === 'image') {
                layer.style.background = `url(${fill.value}) center/cover no-repeat`;
            } else if (fill.type === 'mesh') {
                 const canvas = document.createElement('canvas');
                 canvas.style.width = '100%';
                 canvas.style.height = '100%';
                 layer.appendChild(canvas);
                 const mesh = new MeshGradient(canvas);
                 if (fill.meshColors) mesh.setColors(fill.meshColors);
                 mesh.play();
            } else if (fill.type === 'code') {
                const canvas = document.createElement('canvas');
                canvas.width = parseInt(this.domElement.style.width) || 1920;
                canvas.height = parseInt(this.domElement.style.height) || 1080;
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                layer.appendChild(canvas);
                
                const runner = new CodeRunner(canvas);
                runner.setCode(fill.code || fill.value);
                runner.play();
                this.bgCodeRunner = runner;
            }

            container.appendChild(layer);
        });
    }

    unmount() {
        if (this.bgCodeRunner) {
            this.bgCodeRunner.stop();
        }
        this.elements.forEach(el => el.unmount());
        this.elements.clear();
        if (this.domElement && this.domElement.parentNode) {
            this.domElement.parentNode.removeChild(this.domElement);
        }
    }
}
