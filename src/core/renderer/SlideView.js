import { ElementFactory } from './ElementFactory.js';
import { CodeRunner } from '../effects/CodeRunner.js';

export class SlideView {
    constructor(slideId) {
        this.slideId = slideId;
        this.elements = new Map(); // ID -> VisualElement
        this.domElement = null;
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
        const view = this.domElement;
        
        // Clean up previous code runner
        if (this.bgCodeRunner) {
            this.bgCodeRunner.stop();
            this.bgCodeRunner = null;
        }

        // Remove existing background canvas
        const existingCanvas = view.querySelector('.bg-canvas');
        if (existingCanvas) existingCanvas.remove();

        // Reset background style
        view.style.background = 'none';

        if (!bg) bg = { type: 'solid', value: '#ffffff' };

        if (bg.type === 'solid') {
            view.style.background = bg.value;
        } else if (bg.type === 'gradient') {
            if (bg.value.startsWith('/* diamond|')) {
                // TODO: Import renderDiamondGradient logic or move to utils
                // For now, we skip diamond gradient or duplicate logic?
                // I'll skip for now to keep it simple, or implement later.
                // Actually, ShapeElement has it. I should move it to a util.
                view.style.background = bg.value; // Fallback
            } else {
                view.style.background = bg.value;
            }
        } else if (bg.type === 'image') {
            view.style.background = `url(${bg.value}) center/cover no-repeat`;
        } else if (bg.type === 'code') {
            const canvas = document.createElement('canvas');
            canvas.className = 'bg-canvas';
            
            const w = parseInt(view.style.width) || 1920;
            const h = parseInt(view.style.height) || 1080;
            
            canvas.width = w;
            canvas.height = h;
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.zIndex = '0'; 
            
            view.insertBefore(canvas, view.firstChild);

            const runner = new CodeRunner(canvas);
            runner.setCode(bg.value);
            runner.play();
            
            this.bgCodeRunner = runner;
        }
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
