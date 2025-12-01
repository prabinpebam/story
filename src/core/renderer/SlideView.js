import { ElementFactory } from './ElementFactory.js';
import { CodeRunner } from '../effects/CodeRunner.js';
import { store } from '../Store.js';

export class SlideView {
    constructor(slideId) {
        this.slideId = slideId;
        this.elements = new Map(); // ID -> VisualElement
        this.domElement = null;
        this.bgContainer = null;
        this.bgCodeRunner = null;
        this.lastBgConfig = null;
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
                // 12-color theme schema
                if (colors.background1) this.domElement.style.setProperty('--theme-background1', colors.background1);
                if (colors.background2) this.domElement.style.setProperty('--theme-background2', colors.background2);
                if (colors.text1) this.domElement.style.setProperty('--theme-text1', colors.text1);
                if (colors.text2) this.domElement.style.setProperty('--theme-text2', colors.text2);
                if (colors.accent1) this.domElement.style.setProperty('--theme-accent1', colors.accent1);
                if (colors.accent2) this.domElement.style.setProperty('--theme-accent2', colors.accent2);
                if (colors.accent3) this.domElement.style.setProperty('--theme-accent3', colors.accent3);
                if (colors.accent4) this.domElement.style.setProperty('--theme-accent4', colors.accent4);
                if (colors.accent5) this.domElement.style.setProperty('--theme-accent5', colors.accent5);
                if (colors.accent6) this.domElement.style.setProperty('--theme-accent6', colors.accent6);
                if (colors.hyperlink) this.domElement.style.setProperty('--theme-hyperlink', colors.hyperlink);
                if (colors.followedHyperlink) this.domElement.style.setProperty('--theme-followed-hyperlink', colors.followedHyperlink);
                // Legacy aliases for backwards compatibility
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
            
            // Ensure DOM order - but skip if element is being edited to prevent blur
            const state = store.getState();
            const isBeingEdited = state.editor.editingElementId === id;
            if (!isBeingEdited) {
                this.domElement.appendChild(el.domElement);
            }
            
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

        // Optimization: Don't rebuild if background hasn't changed
        const currentConfigStr = JSON.stringify(bg);
        const lastConfigStr = JSON.stringify(this.lastBgConfig);

        if (currentConfigStr === lastConfigStr) {
            // If we have a code runner, ensure it's resized correctly
            if (this.bgCodeRunner) {
                const w = parseInt(this.domElement.style.width) || 1920;
                const h = parseInt(this.domElement.style.height) || 1080;
                this.bgCodeRunner.resize(w, h);
                // Update bounds on resize
                this.bgCodeRunner.setElementBounds({ x: 0, y: 0, width: w, height: h, rotation: 0 });
            }
            return;
        }

        this.lastBgConfig = bg ? JSON.parse(JSON.stringify(bg)) : bg;

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
                // Support linked theme colors via CSS variables
                if (fill.themeSlot) {
                    layer.style.backgroundColor = `var(--theme-${fill.themeSlot})`;
                } else {
                    layer.style.backgroundColor = fill.color || fill.value;
                }
            } else if (fill.type === 'gradient') {
                layer.style.background = this.getGradientCss(fill.value);
            } else if (fill.type === 'image') {
                layer.style.background = `url(${fill.value}) center/cover no-repeat`;
            } else if (fill.type === 'code') {
                const w = parseInt(this.domElement.style.width) || 1920;
                const h = parseInt(this.domElement.style.height) || 1080;
                
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                layer.appendChild(canvas);
                
                const runner = new CodeRunner(canvas);
                runner.setCode(fill.code || fill.value);
                // Set element bounds for mouse interaction - slide background covers full slide
                runner.setElementBounds({ x: 0, y: 0, width: w, height: h, rotation: 0 });
                runner.play();
                this.bgCodeRunner = runner;
            }

            container.appendChild(layer);
        });
    }

    getGradientCss(gradient) {
        if (!gradient) return 'none';
        // Handle legacy string case
        if (typeof gradient === 'string') return gradient;

        const stops = gradient.stops.map(s => `${s.color} ${s.position}%`).join(', ');
        
        if (gradient.type === 'linear') {
            return `linear-gradient(${gradient.angle}deg, ${stops})`;
        } else if (gradient.type === 'radial') {
             return `radial-gradient(circle, ${stops})`;
        } else if (gradient.type === 'angular') {
             return `conic-gradient(from ${gradient.angle || 0}deg at center, ${stops})`;
        } else if (gradient.type === 'diamond') {
             return `radial-gradient(circle, ${stops})`;
        }
        return 'none';
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
