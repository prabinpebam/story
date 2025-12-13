import { ElementFactory } from './ElementFactory.js';
import { CodeRunner } from '../effects/CodeRunner.js';
import { store } from '../Store.js';
import { ThemeDiag } from '../../utils/ThemeDiagnostics.js';
import { StyleResolver } from '../../utils/StyleResolver.js';
import { getEffectiveSlotIndex } from '../../ui/panels/color-theme/ColorThemeUtils.js';

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
        this.domElement.setAttribute('data-testid', 'slide-view');
        this.domElement.setAttribute('data-slide-id', this.slideId);
        this.domElement.style.position = 'absolute';
        this.domElement.style.top = '0';
        this.domElement.style.left = '0';
        // Dimensions will be set in update
        
        this.bgContainer = document.createElement('div');
        this.bgContainer.className = 'slide-background';
        this.bgContainer.setAttribute('data-testid', 'slide-background');
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
        
        // =====================================================
        // THEME CSS VARIABLES (per-slide cascade resolution)
        // =====================================================
        // Use StyleResolver as the SINGLE SOURCE OF TRUTH for theme resolution.
        // StyleResolver resolves through the cascade: Slide → Layout → Theme Master.
        // CSS variables are applied ONLY to this slide's DOM element, not globally.
        // This allows different slides to have different themes without pollution.
        
        const isMasterRecord = slideData?.type === 'slideMasterPreset' || slideData?.type === 'layoutMaster';
        const themeInfo = isMasterRecord
            ? StyleResolver.getThemeInfoForMaster(this.slideId)
            : StyleResolver.getThemeInfoForSlide(this.slideId);
        
        // NOTE: The renderer relies on CSS variables (e.g., var(--theme-slot1)) for theme-linked
        // fills. To make Light/Dark mode visually affect the rendered slide, we apply an
        // effective slot mapping when setting per-slide variables.
        const lumaThemeForVars = themeInfo?.lumaTheme || slideData.resolvedLumaTheme || null;
        const colorModeForVars = themeInfo?.colorMode || (isMasterRecord
            ? StyleResolver.getColorMode(null, this.slideId)
            : StyleResolver.getColorMode(this.slideId));

        let effectiveResolvedColors = null;
        if (lumaThemeForVars) {
            const baseColors = lumaThemeForVars.resolvedColors || lumaThemeForVars.slots?.map(s => s.hex) || [];
            effectiveResolvedColors = Array.from({ length: 12 }, (_, slotIndex) => {
                const effectiveIndex = getEffectiveSlotIndex(slotIndex, colorModeForVars);
                return baseColors[effectiveIndex] || baseColors[slotIndex] || null;
            });

            effectiveResolvedColors.forEach((hex, index) => {
                if (hex) {
                    // --theme-slot1 through --theme-slot12 on this slide's DOM element
                    this.domElement.style.setProperty(`--theme-slot${index + 1}`, hex);
                }
            });

            // Diagnostic logging
            ThemeDiag.logSlideViewApply(this.slideId, lumaThemeForVars, this.domElement);
        }
        
        // Canonical theme variables (named slots + fonts)
        const state = store.getState();
        const resolveThemeAndTypographyIds = () => {
            if (!isMasterRecord) {
                const themeId = StyleResolver.getEffectiveColorTheme(this.slideId)?.themeId || 'preset_neutral';
                const typoId = StyleResolver.getEffectiveTypographyStyle(this.slideId)?.typographyStyleId || 'typo-style-default';
                return { themeId, typoId };
            }

            if (slideData.type === 'slideMasterPreset') {
                const themeId = slideData.styleAssignments?.colorTheme || slideData.colorThemeId || 'preset_neutral';
                const typoId = slideData.styleAssignments?.typographyStyle || slideData.typographyStyleId || 'typo-style-default';
                return { themeId, typoId };
            }

            // layoutMaster
            const parent = slideData.parentMasterId ? state.slideMasterPresets?.[slideData.parentMasterId] : null;
            const themeId = slideData.styleAssignments?.colorTheme || slideData.colorThemeId || parent?.styleAssignments?.colorTheme || parent?.colorThemeId || 'preset_neutral';
            const typoId = slideData.styleAssignments?.typographyStyle || slideData.typographyStyleId || parent?.styleAssignments?.typographyStyle || parent?.typographyStyleId || 'typo-style-default';
            return { themeId, typoId };
        };

        const { themeId, typoId } = resolveThemeAndTypographyIds();

        const colorPreset = state.colorThemePresets?.[themeId] || null;
        // Prefer the mode-mapped resolved colors (if we computed them above); otherwise fall back.
        const colors = colorPreset?.colors || StyleResolver._resolvedArrayToColorsObject(effectiveResolvedColors || themeInfo?.lumaTheme?.resolvedColors);
        if (colors) {
            // Canonical 12-color schema
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

            // Aliases used by existing style tokens
            if (colors.accent1) this.domElement.style.setProperty('--theme-accent', colors.accent1);
            // Prefer slot-based meaning when we have effective slot colors computed.
            // This keeps semantic vars aligned with StyleResolver's normalization.
            if (effectiveResolvedColors?.[0]) {
                this.domElement.style.setProperty('--theme-text-primary', effectiveResolvedColors[0]);
            } else if (colors.text1) {
                this.domElement.style.setProperty('--theme-text-primary', colors.text1);
            }

            if (effectiveResolvedColors?.[2]) {
                this.domElement.style.setProperty('--theme-text-secondary', effectiveResolvedColors[2]);
            } else if (colors.text2) {
                this.domElement.style.setProperty('--theme-text-secondary', colors.text2);
            }
        }

        const typoPreset = state.typographyStylePresets?.[typoId] || null;
        const fonts = typoPreset?.fonts || null;
        if (fonts) {
            if (fonts.heading) this.domElement.style.setProperty('--theme-font-heading', fonts.heading);
            if (fonts.body) this.domElement.style.setProperty('--theme-font-body', fonts.body);
            if (fonts.monospace) this.domElement.style.setProperty('--theme-font-monospace', fonts.monospace);
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
            // Use fixed white background as default for slide content
            // This ensures slide content is independent of app theme (Dark/Light mode)
            fills = [{ type: 'solid', value: '#FFFFFF' }];
        }

        fills.forEach((fill, index) => {
            if (fill.visible === false) return;

            const layer = document.createElement('div');
            layer.className = 'bg-layer';
            layer.setAttribute('data-testid', `slide-bg-layer-${index}`);
            if (fill?.type) layer.setAttribute('data-fill-type', String(fill.type));
            if (fill?.themeSlot !== undefined && fill?.themeSlot !== null) {
                layer.setAttribute('data-theme-slot', String(fill.themeSlot));
            }
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
                if (fill.themeSlot !== undefined && fill.themeSlot !== null) {
                    // themeSlot is 0-indexed, CSS variables are 1-indexed (--theme-slot1 through --theme-slot12)
                    const slotNumber = fill.themeSlot + 1;
                    const fallbackColor = fill.color || fill.value || '#808080';
                    layer.style.backgroundColor = `var(--theme-slot${slotNumber}, ${fallbackColor})`;
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
