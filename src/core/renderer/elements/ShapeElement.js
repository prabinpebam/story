import { VisualElement } from './VisualElement.js';
import { CodeRunner } from '../../effects/CodeRunner.js';
import { store } from '../../Store.js';
import { mediaAssetManager } from '../../media/MediaAssetManager.js';
import { FilterEngine } from '../../media/FilterEngine.js';

export class ShapeElement extends VisualElement {
    constructor(data) {
        super(data);
        this.shadowEl = null;
    }
    
    /**
     * Calculate world-space bounds for an element, accounting for parent transforms
     * Used for CodeRunner mouse hit testing
     * @param {Object} el - Element data
     * @returns {Object} bounds with x, y, width, height, rotation, cx, cy
     */
    _getWorldBounds(el) {
        const state = store.getState();
        const slide = state.editor.mode === 'master' 
            ? state.slideMasterPresets[state.editor.activeMasterId]
            : state.slides[state.editor.activeSlideId];
        
        if (!slide) {
            return {
                x: el.x,
                y: el.y,
                width: el.width,
                height: el.height,
                rotation: el.rotation || 0,
                cx: el.x + el.width / 2,
                cy: el.y + el.height / 2
            };
        }
        
        let accX = el.x;
        let accY = el.y;
        let accRotation = el.rotation || 0;
        
        // Walk up parent chain
        let parentId = el.parentId;
        while (parentId) {
            const parent = slide.elements ? slide.elements[parentId] : null;
            if (!parent) break;
            
            // Parent rotation affects child position
            if (parent.rotation) {
                const rad = parent.rotation * Math.PI / 180;
                const cos = Math.cos(rad);
                const sin = Math.sin(rad);
                
                // Rotate child position around parent center
                const pcx = parent.width / 2;
                const pcy = parent.height / 2;
                const dx = accX - pcx;
                const dy = accY - pcy;
                
                accX = dx * cos - dy * sin + pcx + parent.x;
                accY = dx * sin + dy * cos + pcy + parent.y;
                accRotation += parent.rotation;
            } else {
                accX += parent.x;
                accY += parent.y;
            }
            
            parentId = parent.parentId;
        }
        
        return {
            x: accX,
            y: accY,
            width: el.width,
            height: el.height,
            rotation: accRotation,
            cx: accX + el.width / 2,
            cy: accY + el.height / 2
        };
    }

    update(newData) {
        super.update(newData);
        const el = this.data;
        const div = this.domElement;

        if (!div) return;

        this.applyFills(div, el);
        this.applyStrokes(div, el);
        this.applyEffects(div, el);

        // Handle Placeholder Icon
        if (el.isPlaceholder && !el.src) {
            this.renderPlaceholderIcon(div, el);
        } else {
            // Remove icon if it exists but shouldn't (e.g. filled with image)
            const icon = div.querySelector('.placeholder-icon-container');
            if (icon) icon.remove();
        }
    }

    renderPlaceholderIcon(div, el) {
        let iconContainer = div.querySelector('.placeholder-icon-container');
        if (!iconContainer) {
            iconContainer = document.createElement('div');
            iconContainer.className = 'placeholder-icon-container';
            iconContainer.style.position = 'absolute';
            iconContainer.style.top = '50%';
            iconContainer.style.left = '50%';
            iconContainer.style.transform = 'translate(-50%, -50%)';
            iconContainer.style.pointerEvents = 'none';
            iconContainer.style.display = 'flex';
            iconContainer.style.flexDirection = 'column';
            iconContainer.style.alignItems = 'center';
            iconContainer.style.justifyContent = 'center';
            iconContainer.style.color = 'var(--color-text-secondary)';
            iconContainer.style.opacity = '0.5';
            div.appendChild(iconContainer);
        }

        const iconClass = this.getIconClassForType(el.placeholderType);
        // Simple check to avoid re-rendering if same icon
        if (iconContainer.dataset.icon !== iconClass) {
            iconContainer.innerHTML = `<i class="${iconClass}" style="font-size: 48px;"></i>`;
            iconContainer.dataset.icon = iconClass;
        }
    }

    getIconClassForType(type) {
        switch (type) {
            case 'picture':
            case 'image': return 'fa-regular fa-image';
            case 'media': return 'fa-solid fa-film';
            case 'chart': return 'fa-solid fa-chart-bar';
            case 'table': return 'fa-solid fa-table';
            case 'smartArt': return 'fa-solid fa-sitemap';
            case 'content': return 'fa-solid fa-plus';
            default: return 'fa-regular fa-image';
        }
    }

    applyFills(div, el) {
        // Calculate world bounds for CodeRunner mouse support
        const worldBounds = this._getWorldBounds(el);
        
        // Handle Code Fill (includes mesh gradient preset)
        if (el.style?.fillType === 'code') {
            if (!div._codeRunner) {
                this.clearComplexFills(div);
                div.innerHTML = '';

                const canvas = document.createElement('canvas');
                canvas.className = 'code-canvas';
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                canvas.style.borderRadius = 'inherit';
                canvas.width = el.width;
                canvas.height = el.height;
                div.appendChild(canvas);
                
                const runner = new CodeRunner(canvas);
                div._codeRunner = runner;
                runner.play();
            }
            
            const codeToRun = el.style.code || CodeRunner.DEFAULT_CODE;
            if (div._codeRunner.userCode !== codeToRun) {
                div._codeRunner.setCode(codeToRun);
            }
            div._codeRunner.resize(el.width, el.height);
            
            // Set element bounds for mouse hit testing
            div._codeRunner.setElementBounds(worldBounds);

        } else {
            this.clearComplexFills(div);
            
            // Handle Multiple Fills
            if (el.style?.fills && el.style.fills.length > 0) {
                div.style.background = 'transparent';
                div.style.backgroundImage = 'none';
                
                const fills = el.style.fills;
                const fillLayers = Array.from(div.children).filter(c => c.classList.contains('fill-layer'));
                
                fills.forEach((fill, index) => {
                    let layer = fillLayers[index];
                    if (!layer) {
                        layer = document.createElement('div');
                        layer.className = 'fill-layer';
                        layer.style.position = 'absolute';
                        layer.style.top = '0';
                        layer.style.left = '0';
                        layer.style.width = '100%';
                        layer.style.height = '100%';
                        layer.style.borderRadius = 'inherit'; 
                        layer.style.overflow = 'hidden';
                        div.appendChild(layer);
                    }
                    
                    layer.style.zIndex = fills.length - index;
                    layer.style.display = fill.visible ? 'block' : 'none';
                    layer.style.opacity = (fill.opacity !== undefined) ? fill.opacity / 100 : 1;
                    layer.style.mixBlendMode = fill.blendMode || 'normal';
                    
                    layer.style.background = 'transparent';
                    layer.style.backgroundImage = 'none';
                    
                    if (fill.type === 'code') {
                        if (!layer._codeRunner) {
                            layer.innerHTML = ''; 
                            const canvas = document.createElement('canvas');
                            canvas.style.width = '100%';
                            canvas.style.height = '100%';
                            canvas.width = el.width;
                            canvas.height = el.height;
                            layer.appendChild(canvas);
                            layer._codeRunner = new CodeRunner(canvas);
                            layer._codeRunner.play();
                        }
                        const code = fill.code || CodeRunner.DEFAULT_CODE;
                        if (layer._codeRunner.userCode !== code) {
                            layer._codeRunner.setCode(code);
                        }
                        layer._codeRunner.resize(el.width, el.height);
                        // Set element bounds for mouse interaction (uses same worldBounds as primary fill)
                        layer._codeRunner.setElementBounds(worldBounds);
                    } else {
                        if (layer._codeRunner) {
                            layer._codeRunner.stop();
                            delete layer._codeRunner;
                            layer.innerHTML = '';
                        }

                        const existingCanvas = layer.querySelector('.bg-canvas');
                        
                        let fillValue = fill.value;
                        if (fill.type === 'gradient') {
                            fillValue = this.resolveGradientValue(fill.value);
                        }

                        if (existingCanvas && (!fillValue || !fillValue.startsWith('/* diamond|'))) {
                            existingCanvas.remove();
                        }
                        
                        if (fill.type === 'solid') {
                            // Clear any media content before applying solid fill
                            this.clearMediaLayer(layer);
                            // Support linked theme colors via CSS variables
                            if (fill.themeSlot !== undefined && fill.themeSlot !== null) {
                                // Use CSS variable for linked colors - auto-updates when theme changes
                                // themeSlot is 0-indexed, CSS variables are 1-indexed (--theme-slot1 through --theme-slot12)
                                const slotNumber = fill.themeSlot + 1;
                                const cssVar = `--theme-slot${slotNumber}`;
                                const fallbackColor = fill.color || fill.value || '#808080';
                                // Use CSS variable with fallback to the actual color value
                                layer.style.backgroundColor = `var(${cssVar}, ${fallbackColor})`;
                            } else {
                                // Support both 'color' and 'value' properties for solid fills
                                const bgColor = fill.color || fill.value;
                                layer.style.backgroundColor = bgColor;
                            }
                        } else if (fill.type === 'gradient') {
                            // Clear any media content before applying gradient fill
                            this.clearMediaLayer(layer);
                            if (fillValue.startsWith('/* diamond|')) {
                                this.renderDiamondGradient(layer, el.width, el.height, fillValue);
                            } else {
                                layer.style.background = fillValue;
                            }
                        } else if (fill.type === 'image' && fill.assetId) {
                            // New media fill system using assetId
                            this.applyImageFill(layer, fill, el);
                        } else if (fill.type === 'video' && fill.assetId) {
                            // New media fill system for video
                            this.applyVideoFill(layer, fill, el);
                        } else if (fill.type === 'image' && !fill.assetId) {
                            // Image fill with no asset - show placeholder
                            this.applyMediaPlaceholder(layer, 'image');
                        } else if (fill.type === 'video' && !fill.assetId) {
                            // Video fill with no asset - show placeholder
                            this.applyMediaPlaceholder(layer, 'video');
                        } else if (fill.type === 'image' && fill.value) {
                            // Legacy image fill using direct URL
                            layer.style.backgroundImage = `url(${fill.value})`;
                            layer.style.backgroundSize = fill.scaleMode || 'cover';
                            layer.style.backgroundPosition = 'center';
                            layer.style.backgroundRepeat = 'no-repeat';
                        }
                    }
                });
                
                // Remove extra layers
                for (let i = fills.length; i < fillLayers.length; i++) {
                    const layer = fillLayers[i];
                    if (layer._codeRunner) layer._codeRunner.stop();
                    layer.remove();
                }
                
            } else {
                // Legacy / Single Fill Fallback
                if (el.style?.fillType === 'gradient') {
                   div.style.background = el.style.fillValue;
                } else if (el.style?.fillType === 'image') {
                   div.style.backgroundImage = `url(${el.style.fillValue})`;
                   div.style.backgroundSize = el.style.fillScaleMode || 'cover';
                   div.style.backgroundPosition = 'center';
                   div.style.backgroundRepeat = 'no-repeat';
                   div.style.backgroundColor = '#D9D9D9'; 
                } else {
                   div.style.background = el.style?.backgroundColor || '#D9D9D9';
                   div.style.backgroundImage = '';
                }
            }
        }
    }

    clearComplexFills(div) {
        if (div._codeRunner) {
            div._codeRunner.stop();
            delete div._codeRunner;
            div.innerHTML = '';
        }
    }

    /**
     * Apply placeholder for empty media fills
     * @param {HTMLElement} layer - Fill layer element
     * @param {'image'|'video'} mediaType - Type of media
     */
    applyMediaPlaceholder(layer, mediaType) {
        // Clear any existing media content
        this.clearMediaLayer(layer);
        
        // Apply placeholder background
        layer.style.backgroundColor = '#3a3a3a';
        layer.style.backgroundImage = 'none';
        
        // Check if placeholder already exists
        let placeholder = layer.querySelector('.media-placeholder');
        if (!placeholder) {
            placeholder = document.createElement('div');
            placeholder.className = 'media-placeholder';
            placeholder.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: #888;
                font-size: 12px;
                text-align: center;
                pointer-events: none;
                user-select: none;
            `;
            layer.appendChild(placeholder);
        }
        
        // Set icon and message based on type
        const icon = mediaType === 'video' 
            ? '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><polygon points="10 8 16 12 10 16" fill="currentColor" stroke="none"/></svg>'
            : '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="M21 15l-5-5L5 21"/></svg>';
        
        const message = mediaType === 'video' ? 'No video' : 'No image';
        
        placeholder.innerHTML = `
            <div style="margin-bottom: 8px; opacity: 0.6;">${icon}</div>
            <div style="opacity: 0.8;">${message}</div>
        `;
    }

    // ─────────────────────────────────────────────────────────────
    // Media Fill Methods (Image & Video)
    // ─────────────────────────────────────────────────────────────

    /**
     * Apply image fill to a layer
     * @param {HTMLElement} layer - Fill layer element
     * @param {Object} fill - Image fill properties
     * @param {Object} el - Element data
     */
    applyImageFill(layer, fill, el) {
        // Get renderable URL from asset manager
        const src = mediaAssetManager.getRenderableUrl(fill.assetId);
        
        if (!src) {
            // Asset not found - show placeholder
            this.applyMediaPlaceholder(layer, 'image');
            return;
        }
        
        // Remove placeholder if present
        const placeholder = layer.querySelector('.media-placeholder');
        if (placeholder) placeholder.remove();
        layer.classList.remove('media-fill-error');
        
        // Handle tile mode separately (uses CSS background)
        if (fill.scaleMode === 'tile') {
            this.applyTiledImageFill(layer, fill, src);
            return;
        }
        
        // Clear any existing content
        this.clearMediaLayer(layer);
        
        // Create img element
        let img = layer.querySelector('img.media-fill');
        if (!img) {
            img = document.createElement('img');
            img.className = 'media-fill';
            img.style.position = 'absolute';
            img.style.pointerEvents = 'none';
            img.style.userSelect = 'none';
            img.draggable = false;
            layer.appendChild(img);
        }
        
        // Set source
        if (img.src !== src) {
            img.src = src;
        }
        
        // Apply scale mode positioning
        this.applyMediaScaleMode(img, fill, el);
        
        // Apply position offset
        this.applyMediaPosition(img, fill);
        
        // Apply filters
        this.applyMediaFilters(layer, img, fill, el.id);
    }

    /**
     * Apply video fill to a layer
     * @param {HTMLElement} layer - Fill layer element
     * @param {Object} fill - Video fill properties
     * @param {Object} el - Element data
     */
    applyVideoFill(layer, fill, el) {
        const src = mediaAssetManager.getRenderableUrl(fill.assetId);
        
        if (!src) {
            // Asset not found - show placeholder
            this.applyMediaPlaceholder(layer, 'video');
            return;
        }
        
        // Remove placeholder if present
        const placeholder = layer.querySelector('.media-placeholder');
        if (placeholder) placeholder.remove();
        layer.classList.remove('media-fill-error');
        
        // Clear any existing content (except video)
        this.clearMediaLayer(layer, 'video');
        
        // Create or get video element
        let video = layer.querySelector('video.media-fill');
        if (!video) {
            video = document.createElement('video');
            video.className = 'media-fill';
            video.style.position = 'absolute';
            video.style.pointerEvents = 'none';
            video.playsInline = true;
            layer.appendChild(video);
        }
        
        // Set source if changed
        if (video.src !== src) {
            video.src = src;
        }
        
        // Apply video properties
        video.muted = fill.muted !== false;
        video.loop = fill.loop !== false;
        video.playbackRate = fill.playbackRate || 1;
        video.volume = fill.volume || 0;
        
        // Handle autoplay
        if (fill.autoplay !== false && video.paused) {
            video.play().catch(() => {
                // Autoplay blocked - common in browsers
                console.debug('Video autoplay blocked, user interaction required');
            });
        }
        
        // Apply scale mode positioning
        this.applyMediaScaleMode(video, fill, el);
        
        // Apply position offset
        this.applyMediaPosition(video, fill);
        
        // Apply filters
        this.applyMediaFilters(layer, video, fill, el.id);
    }

    /**
     * Apply tiled image fill using CSS background
     * @param {HTMLElement} layer
     * @param {Object} fill
     * @param {string} src
     */
    applyTiledImageFill(layer, fill, src) {
        // Clear any img/video elements
        this.clearMediaLayer(layer);
        
        // Use CSS background for tiling
        layer.style.backgroundImage = `url(${src})`;
        layer.style.backgroundRepeat = 'repeat';
        layer.style.backgroundSize = 'auto';
        
        // Apply position as background-position
        const posX = ((fill.position?.x || 0.5) - 0.5) * 100;
        const posY = ((fill.position?.y || 0.5) - 0.5) * 100;
        layer.style.backgroundPosition = `${50 + posX}% ${50 + posY}%`;
        
        // Apply scale via background-size if scale != 1
        if (fill.scale && fill.scale !== 1) {
            layer.style.backgroundSize = `${fill.scale * 100}%`;
        }
        
        // Apply filters to the layer itself
        const { filterValue, svgFilter } = FilterEngine.getFilterStyle(fill.filters || {}, `tile-${Date.now()}`);
        layer.style.filter = filterValue;
        
        // Insert SVG filter if needed
        if (svgFilter) {
            this.insertSvgFilter(layer, svgFilter);
        }
    }

    /**
     * Apply scale mode to media element
     * @param {HTMLElement} mediaEl - img or video element
     * @param {Object} fill - Fill properties
     * @param {Object} el - Element data (for dimensions)
     */
    applyMediaScaleMode(mediaEl, fill, el) {
        const scaleMode = fill.scaleMode || 'fill';
        const originalWidth = fill.originalWidth || el.width;
        const originalHeight = fill.originalHeight || el.height;
        const shapeRatio = el.width / el.height;
        const mediaRatio = originalWidth / originalHeight;
        
        // Reset styles
        mediaEl.style.width = '';
        mediaEl.style.height = '';
        mediaEl.style.objectFit = '';
        
        switch (scaleMode) {
            case 'fill':
                // Cover entire shape, may crop
                mediaEl.style.width = '100%';
                mediaEl.style.height = '100%';
                mediaEl.style.objectFit = 'cover';
                break;
                
            case 'fit':
                // Fit inside shape, may letterbox
                mediaEl.style.width = '100%';
                mediaEl.style.height = '100%';
                mediaEl.style.objectFit = 'contain';
                break;
                
            case 'stretch':
                // Stretch to fill exactly
                mediaEl.style.width = '100%';
                mediaEl.style.height = '100%';
                mediaEl.style.objectFit = 'fill';
                break;
                
            case 'tile':
                // Handled separately in applyTiledImageFill
                break;
                
            default:
                mediaEl.style.width = '100%';
                mediaEl.style.height = '100%';
                mediaEl.style.objectFit = 'cover';
        }
    }

    /**
     * Apply position offset and transforms to media element
     * @param {HTMLElement} mediaEl
     * @param {Object} fill
     */
    applyMediaPosition(mediaEl, fill) {
        const x = fill.position?.x ?? 0.5;
        const y = fill.position?.y ?? 0.5;
        const scale = fill.scale || 1;
        const rotation = fill.rotation || 0;
        
        // Position is normalized 0-1 where 0.5 is center
        // Convert to percentage offset from center
        const offsetX = (x - 0.5) * 100;
        const offsetY = (y - 0.5) * 100;
        
        // Use object-position for positioning within the container
        mediaEl.style.objectPosition = `${50 + offsetX}% ${50 + offsetY}%`;
        
        // Apply scale and rotation via transform
        const transforms = [];
        if (scale !== 1) {
            transforms.push(`scale(${scale})`);
        }
        if (rotation !== 0) {
            transforms.push(`rotate(${rotation}deg)`);
        }
        
        mediaEl.style.transform = transforms.length > 0 ? transforms.join(' ') : '';
    }

    /**
     * Apply filters to media element
     * @param {HTMLElement} layer - Container layer
     * @param {HTMLElement} mediaEl - img or video element
     * @param {Object} fill - Fill properties with filters
     * @param {string} elementId - For unique SVG filter ID
     */
    applyMediaFilters(layer, mediaEl, fill, elementId) {
        const filters = fill.filters || {};
        
        // Get combined filter style
        const { filterValue, svgFilter } = FilterEngine.getFilterStyle(filters, `media-${elementId}`);
        
        // Apply to media element
        mediaEl.style.filter = filterValue;
        
        // Insert SVG filter definition if needed
        if (svgFilter) {
            this.insertSvgFilter(layer, svgFilter);
        } else {
            // Remove any existing SVG filter
            const existingSvg = layer.querySelector('svg.media-filter-defs');
            if (existingSvg) existingSvg.remove();
        }
    }

    /**
     * Insert SVG filter definition into layer
     * @param {HTMLElement} layer
     * @param {string} svgFilter - SVG filter markup
     */
    insertSvgFilter(layer, svgFilter) {
        // Remove existing
        const existing = layer.querySelector('svg.media-filter-defs');
        if (existing) existing.remove();
        
        // Create new SVG container for filter defs
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'media-filter-defs');
        svg.style.position = 'absolute';
        svg.style.width = '0';
        svg.style.height = '0';
        svg.style.overflow = 'hidden';
        
        // Parse and append filter
        const temp = document.createElement('div');
        temp.innerHTML = `<svg>${svgFilter}</svg>`;
        const filterEl = temp.querySelector('filter');
        if (filterEl) {
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            defs.appendChild(document.importNode(filterEl, true));
            svg.appendChild(defs);
            layer.insertBefore(svg, layer.firstChild);
        }
    }

    /**
     * Clear media elements from layer
     * @param {HTMLElement} layer
     * @param {string} keepType - Optional: 'img' or 'video' to keep
     */
    clearMediaLayer(layer, keepType = null) {
        // Clear background styles
        layer.style.backgroundImage = '';
        layer.style.backgroundRepeat = '';
        layer.style.backgroundSize = '';
        layer.style.backgroundPosition = '';
        
        // Remove media elements (except keepType)
        const mediaEls = layer.querySelectorAll('img.media-fill, video.media-fill');
        mediaEls.forEach(el => {
            if (keepType && el.tagName.toLowerCase() === keepType) return;
            el.remove();
        });
        
        // Remove media placeholder (empty state indicator)
        const placeholder = layer.querySelector('.media-placeholder');
        if (placeholder) placeholder.remove();
        
        // Remove SVG filter defs
        const svgDefs = layer.querySelector('svg.media-filter-defs');
        if (svgDefs) svgDefs.remove();
    }

    applyStrokes(div, el) {
        if (el.style?.strokes && el.style.strokes.length > 0) {
             div.style.borderWidth = '0px';
             div.style.outline = 'none';
             div.style.border = 'none';
             
             const strokes = el.style.strokes;
             const strokeLayers = Array.from(div.children).filter(c => c.classList.contains('stroke-layer'));
             
             strokes.forEach((stroke, index) => {
                 let layer = strokeLayers[index];
                 
                 if (!layer) {
                     layer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                     layer.setAttribute('class', 'stroke-layer');
                     layer.style.position = 'absolute';
                     layer.style.pointerEvents = 'none';
                     layer.style.overflow = 'visible';
                     
                     const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                     layer.appendChild(rect);
                     div.appendChild(layer);
                 }
                 
                 layer.style.display = stroke.visible === false ? 'none' : 'block';
                 layer.style.opacity = (stroke.opacity !== undefined) ? stroke.opacity / 100 : 1;
                 layer.style.mixBlendMode = stroke.blendMode || 'normal';
                 layer.style.zIndex = 100 + (strokes.length - index);

                 let rect = layer.querySelector('rect');
                 if (!rect) {
                     rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                     layer.appendChild(rect);
                 }

                 const width = stroke.width || 0;
                 // Support linked theme colors for strokes
                 const color = stroke.themeSlot 
                     ? `var(--theme-${stroke.themeSlot})` 
                     : (stroke.color || 'transparent');
                 const align = stroke.position || 'center';
                 const radius = el.borderRadius || el.style?.radius || 0;
                 
                 const isGradient = stroke.type === 'gradient';
                 const gradientValue = stroke.value || 'linear-gradient(90deg, #000000 0%, #ffffff 100%)';

                 if (isGradient && gradientValue) {
                     const valueString = typeof gradientValue === 'string' ? gradientValue : JSON.stringify(gradientValue);
                     const valueHash = valueString.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
                     const gradId = `stroke-grad-${el.id}-${index}-${valueHash}`;
                     
                     let defs = layer.querySelector('defs');
                     if (!defs) {
                         defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                         layer.insertBefore(defs, layer.firstChild);
                     }
                     
                     const existingGrad = defs.querySelector(`#${gradId}`);
                     if (!existingGrad) {
                         const gradEl = this.createSVGGradient(gradId, gradientValue);
                         defs.innerHTML = '';
                         defs.appendChild(gradEl);
                     }
                     
                     rect.setAttribute('stroke', `url(#${gradId})`);
                 } else {
                     rect.setAttribute('stroke', color);
                     const defs = layer.querySelector('defs');
                     if (defs) defs.remove();
                 }

                 rect.setAttribute('stroke-width', width);
                 rect.setAttribute('fill', 'none');
                 
                 let dashArray = 'none';
                 if (stroke.style === 'dashed') {
                     dashArray = stroke.dashArray ? stroke.dashArray.replace(/,/g, ' ') : '4 4';
                 } else if (stroke.style === 'dotted') {
                     dashArray = stroke.dashArray ? stroke.dashArray.replace(/,/g, ' ') : '1 3';
                 } else if (stroke.style === 'custom') {
                     dashArray = stroke.dashArray ? stroke.dashArray.replace(/,/g, ' ') : 'none';
                 }
                 rect.setAttribute('stroke-dasharray', dashArray);
                 if (stroke.dashOffset !== undefined && stroke.dashOffset !== null && Number.isFinite(stroke.dashOffset)) {
                     rect.setAttribute('stroke-dashoffset', String(stroke.dashOffset));
                 } else {
                     rect.removeAttribute('stroke-dashoffset');
                 }
                 rect.setAttribute('stroke-linecap', stroke.dashCap || 'butt');
                 rect.setAttribute('stroke-linejoin', stroke.join || 'miter');
                 if (stroke.join === 'miter') {
                     rect.setAttribute('stroke-miterlimit', stroke.miterLimit || 4);
                 }

                 layer.style.left = '0';
                 layer.style.top = '0';
                 layer.style.width = '100%';
                 layer.style.height = '100%';
                 
                 let x, y, w, h, rx;
                 if (align === 'inside') {
                     const inset = width / 2;
                     x = inset; y = inset; w = el.width - width; h = el.height - width; rx = Math.max(0, radius - inset);
                 } else if (align === 'outside') {
                     const outset = width / 2;
                     x = -outset; y = -outset; w = el.width + width; h = el.height + width; rx = radius + outset;
                 } else { 
                     x = 0; y = 0; w = el.width; h = el.height; rx = radius;
                 }
                 
                 rect.setAttribute('x', x);
                 rect.setAttribute('y', y);
                 rect.setAttribute('width', Math.max(0, w));
                 rect.setAttribute('height', Math.max(0, h));
                 rect.setAttribute('rx', rx);
                 rect.setAttribute('ry', rx);
             });
             
             // Remove extra layers
             for (let i = strokes.length; i < strokeLayers.length; i++) {
                 strokeLayers[i].remove();
             }
             
        } else {
             const strokeLayers = Array.from(div.children).filter(c => c.classList.contains('stroke-layer'));
             strokeLayers.forEach(l => l.remove());

             // Legacy
             const borderWidth = el.style?.borderWidth || 0;
             const borderStyle = el.style?.borderStyle || 'solid';
             const borderColor = el.style?.borderColor || 'transparent';
             const strokeAlign = el.style?.strokeAlign || 'inside';

             if (borderWidth > 0) {
                 if (strokeAlign === 'inside') {
                     div.style.borderWidth = `${borderWidth}px`;
                     div.style.borderStyle = borderStyle;
                     div.style.borderColor = borderColor;
                     div.style.outline = 'none';
                 } else if (strokeAlign === 'outside') {
                     div.style.borderWidth = '0px';
                     div.style.outlineWidth = `${borderWidth}px`;
                     div.style.outlineStyle = borderStyle;
                     div.style.outlineColor = borderColor;
                     div.style.outlineOffset = '0px';
                 } else if (strokeAlign === 'center') {
                     div.style.borderWidth = '0px';
                     div.style.outlineWidth = `${borderWidth}px`;
                     div.style.outlineStyle = borderStyle;
                     div.style.outlineColor = borderColor;
                     div.style.outlineOffset = `-${borderWidth / 2}px`;
                 }
             } else {
                 div.style.borderWidth = '0px';
                 div.style.outline = 'none';
             }
        }
    }

    applyEffects(div, el) {
        // Shadow
        if (el.style?.dropShadow && el.style.dropShadow.visible !== false) {
            const { x, y, blur, spread, color, blendMode } = el.style.dropShadow;
            
            if (blendMode && blendMode !== 'normal') {
                div.style.boxShadow = 'none';
                div.style.textShadow = 'none';

                if (!this.shadowEl) {
                    this.shadowEl = document.createElement('div');
                    this.shadowEl.className = 'element-shadow';
                    this.shadowEl.style.position = 'absolute';
                    this.shadowEl.style.pointerEvents = 'none';
                    if (this.container) {
                        this.container.insertBefore(this.shadowEl, div);
                    }
                } else if (!this.shadowEl.parentNode && this.container) {
                    this.container.insertBefore(this.shadowEl, div);
                }

                this.shadowEl.style.left = div.style.left;
                this.shadowEl.style.top = div.style.top;
                this.shadowEl.style.width = div.style.width;
                this.shadowEl.style.height = div.style.height;
                this.shadowEl.style.transform = div.style.transform;
                this.shadowEl.style.borderRadius = div.style.borderRadius;
                this.shadowEl.style.zIndex = div.style.zIndex;
                
                this.shadowEl.style.mixBlendMode = blendMode;
                this.shadowEl.style.boxShadow = `${x}px ${y}px ${blur}px ${spread}px ${color}`;
                this.shadowEl.style.display = 'block';

            } else {
                if (this.shadowEl) {
                    this.shadowEl.remove();
                    this.shadowEl = null;
                }
                div.style.boxShadow = `${x}px ${y}px ${blur}px ${spread}px ${color}`;
                div.style.textShadow = 'none';
            }
        } else {
            div.style.boxShadow = 'none';
            div.style.textShadow = 'none';
            if (this.shadowEl) {
                this.shadowEl.remove();
                this.shadowEl = null;
            }
        }

        // Blur
        const blur = el.style?.blur;
        if (blur && blur.visible !== false) {
            const radius = (typeof blur === 'object') ? blur.radius : blur;
            div.style.filter = `blur(${radius}px)`;
        } else {
            div.style.filter = 'none';
        }

        // Background Blur
        const bgBlur = el.style?.backgroundBlur;
        if (bgBlur && bgBlur.visible !== false) {
            const radius = (typeof bgBlur === 'object') ? bgBlur.radius : bgBlur;
            div.style.backdropFilter = `blur(${radius}px)`;
            div.style.webkitBackdropFilter = `blur(${radius}px)`;
        } else {
            div.style.backdropFilter = 'none';
            div.style.webkitBackdropFilter = 'none';
        }
    }

    createSVGGradient(id, value) {
        const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        grad.id = id;
        
        let angle = 90;
        let stops = [];

        if (typeof value === 'object' && value.type) {
            // Handle structured gradient object
            angle = value.angle || 90;
            stops = value.stops || [];
        } else {
            // Legacy string parsing
            let stopsStr = value;
            const match = value.match(/linear-gradient\(([^,]+),(.+)\)/);
            if (match) {
                const angleStr = match[1].trim();
                if (angleStr.includes('deg')) {
                    angle = parseFloat(angleStr);
                }
                stopsStr = match[2];
            }
            
            // Parse stops (very basic)
            stops = stopsStr.split(',').map(s => {
                const parts = s.trim().split(' ');
                return {
                    color: parts[0],
                    position: parseFloat(parts[1] || '0')
                };
            });
        }
        
        // Convert angle to x1,y1,x2,y2
        // SVG linearGradient coordinates are relative to the bounding box
        // 0 deg = Bottom to Top (in CSS) -> but here we need to map CSS angle to SVG coords
        // CSS 90deg = Left to Right
        // SVG x1=0, y1=0, x2=1, y2=0 is Left to Right
        
        // Standard conversion from CSS angle to SVG gradient coordinates
        // angle is in degrees, 0 is up, 90 is right (CSS standard)
        // We need to convert this to start/end points on the unit square
        
        const rad = (angle - 90) * Math.PI / 180;
        const x1 = 50 + 50 * Math.cos(rad);
        const y1 = 50 + 50 * Math.sin(rad);
        const x2 = 50 + 50 * Math.cos(rad + Math.PI);
        const y2 = 50 + 50 * Math.sin(rad + Math.PI);
        
        grad.setAttribute('x1', `${x1}%`);
        grad.setAttribute('y1', `${y1}%`);
        grad.setAttribute('x2', `${x2}%`);
        grad.setAttribute('y2', `${y2}%`);
        
        stops.forEach(s => {
            const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop.setAttribute('offset', `${s.position}%`);
            stop.setAttribute('stop-color', s.color);
            grad.appendChild(stop);
        });
        
        return grad;
    }

    resolveGradientValue(fillValue) {
        if (typeof fillValue === 'string') return fillValue;
        if (typeof fillValue === 'object' && fillValue.type) {
            const { type, angle, stops } = fillValue;
            const sortedStops = [...stops].sort((a, b) => a.position - b.position);
            // Resolve each stop's color - support theme-linked stops via CSS variables
            const stopsStr = sortedStops.map(s => {
                let color = s.color;
                // If stop is linked to a theme slot, use CSS variable
                if (s.themeSlot !== undefined && s.themeSlot !== null) {
                    const slotNumber = s.themeSlot + 1; // CSS vars are 1-indexed
                    const fallback = s.color || '#808080';
                    color = `var(--theme-slot${slotNumber}, ${fallback})`;
                }
                return `${color} ${s.position}%`;
            }).join(', ');

            if (type === 'linear') {
                return `linear-gradient(${angle}deg, ${stopsStr})`;
            } else if (type === 'radial') {
                return `radial-gradient(circle at center, ${stopsStr})`;
            } else if (type === 'angular') {
                return `conic-gradient(from ${angle}deg at center, ${stopsStr})`;
            } else if (type === 'diamond') {
                 // For diamond gradients, include themeSlot in metadata if present
                 const metaStops = sortedStops.map(s => {
                     let stopInfo = `${s.color}@${s.position/100}`;
                     if (s.themeSlot !== undefined && s.themeSlot !== null) {
                         stopInfo += `|slot:${s.themeSlot}`;
                     }
                     return stopInfo;
                 }).join(';');
                 const meta = `/* diamond|${angle}|${metaStops} */`;
                 return `${meta} radial-gradient(circle at center, ${stopsStr})`;
            }
        }
        return '';
    }

    renderDiamondGradient(container, width, height, fillValue) {
        const existing = container.querySelector('.bg-canvas');
        if (existing) existing.remove();

        const canvas = document.createElement('canvas');
        canvas.className = 'bg-canvas';
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.borderRadius = 'inherit';
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        const metaEnd = fillValue.indexOf('*/');
        if (metaEnd > -1) {
            const meta = fillValue.substring(11, metaEnd).trim();
            const parts = meta.split('|');
            const angle = parseFloat(parts[0] || '0');
            const stopsStr = parts[1] || '';
            const stops = stopsStr.split(';').map(s => {
                // Parse stop: color@position or color@position|slot:N
                const [colorPart, posPart] = s.split('@');
                let position = parseFloat(posPart);
                if (position > 1) position /= 100;
                
                let color = colorPart;
                
                // Check for theme slot metadata (slot:N after position)
                const slotMatch = s.match(/\|slot:(\d+)/);
                if (slotMatch) {
                    const slotIndex = parseInt(slotMatch[1], 10);
                    // Resolve theme slot from CSS variable
                    const cssVar = `--theme-slot${slotIndex + 1}`;
                    const resolvedColor = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
                    if (resolvedColor) {
                        color = resolvedColor;
                    }
                }
                
                return { color, position };
            }).filter(s => s.color && !isNaN(s.position));
            
            // Draw Diamond
            const cx = width / 2;
            const cy = height / 2;
            const maxDim = Math.max(width, height);
            const radius = maxDim * 0.8;

            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
            stops.forEach(stop => {
                grad.addColorStop(stop.position, stop.color);
            });

            ctx.fillStyle = grad;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(angle * Math.PI / 180);
            ctx.scale(1, 0.6); // Flatten to make it diamond-like
            ctx.translate(-cx, -cy);
            ctx.fillRect(0, 0, width, height); // Actually need to cover rotated area
            ctx.fillRect(-width, -height, width*3, height*3);
            ctx.restore();
        }
    }

    unmount() {
        if (this.domElement) {
             if (this.domElement._codeRunner) {
                 this.domElement._codeRunner.stop();
             }
             Array.from(this.domElement.children).forEach(child => {
                 if (child._codeRunner) child._codeRunner.stop();
             });
        }
        
        if (this.shadowEl) {
            this.shadowEl.remove();
        }
        
        super.unmount();
    }
}
