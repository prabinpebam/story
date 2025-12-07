import { store } from '../Store.js';
import { SlideView } from './SlideView.js';

export class BaseRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.stage = null;
        this.layers = {
            background: null,
            content: null,
            overlay: null
        };
        this.activeSlideViews = new Map(); // ID -> SlideView
        
        this.initStage();
        
        // Bind methods
        this.render = this.render.bind(this);
        this._handleCustomThemeEdited = this._handleCustomThemeEdited.bind(this);
        
        // Listen to store
        store.on('state-changed', this.render);
        
        // Listen for custom theme edits (when theme ID doesn't change but colors do)
        // This ensures real-time updates when editing custom themes
        document.addEventListener('style:custom-theme-edited', this._handleCustomThemeEdited);
    }
    
    /**
     * Handle custom theme edit event - forces re-render even when store state doesn't change
     * @private
     */
    _handleCustomThemeEdited(event) {
        // Re-render to pick up the new theme colors from localStorage
        this.render();
    }

    initStage() {
        this.container.innerHTML = '';
        this.stage = document.createElement('div');
        this.stage.className = 'renderer-stage';
        this.stage.style.width = '100%';
        this.stage.style.height = '100%';
        this.stage.style.position = 'relative';
        
        this.layers.background = document.createElement('div');
        this.layers.background.className = 'layer-background';
        
        this.layers.content = document.createElement('div');
        this.layers.content.className = 'layer-content';
        
        this.layers.overlay = document.createElement('div');
        this.layers.overlay.className = 'layer-overlay';
        this.layers.overlay.style.pointerEvents = 'none'; 

        [this.layers.background, this.layers.content, this.layers.overlay].forEach(layer => {
            layer.style.position = 'absolute';
            layer.style.top = '0';
            layer.style.left = '0';
            layer.style.width = '100%';
            layer.style.height = '100%';
            this.stage.appendChild(layer);
        });

        this.container.appendChild(this.stage);
    }

    render() {
        // To be implemented by subclasses
    }

    getEffectiveSlideData(id, mode) {
        if (mode === 'master') {
            const state = store.getState();
            const masters = state.slideMasterPresets;
            const item = masters[id];
            
            if (!item) return null;

            if (item.type === 'theme') {
                return {
                    ...item,
                    width: item.width || 1920,
                    height: item.height || 1080,
                    effectiveBackground: item.background || { type: 'solid', value: '#ffffff' },
                    effectiveElements: item.elements,
                    effectiveOrder: item.elementOrder || [],
                    themeSettings: item.themeSettings
                };
            } else if (item.type === 'layout') {
                const masterId = item.parentId;
                const master = masters[masterId];
                
                // Mark master elements as inherited/locked
                const effectiveElements = {};
                const effectiveOrder = [];
                
                // Master elements first (bottom layer, locked)
                (master.elementOrder || []).forEach(elId => {
                    effectiveElements[elId] = { ...master.elements[elId], isLocked: true, source: 'theme' };
                    effectiveOrder.push(elId);
                });
                
                // Layout elements on top (editable)
                (item.elementOrder || []).forEach(elId => {
                    effectiveElements[elId] = { ...item.elements[elId], source: 'layout' };
                    effectiveOrder.push(elId);
                });
                
                let effectiveBackground = item.background;
                if (!effectiveBackground || effectiveBackground.type === 'inherited') {
                    effectiveBackground = master.background;
                }
                
                if (!effectiveBackground || effectiveBackground.type === 'inherited') {
                    effectiveBackground = { type: 'solid', value: '#ffffff' };
                }

                return {
                    ...item,
                    width: item.width || 1920,
                    height: item.height || 1080,
                    effectiveBackground,
                    effectiveElements,
                    effectiveOrder,
                    themeSettings: master.themeSettings
                };
            }
            return null;
        } else {
            return store.getEffectiveSlide(id);
        }
    }

    destroy() {
        store.off('state-changed', this.render);
        document.removeEventListener('style:custom-theme-edited', this._handleCustomThemeEdited);
        this.activeSlideViews.forEach(view => view.unmount());
        this.activeSlideViews.clear();
        this.container.innerHTML = '';
    }
}
