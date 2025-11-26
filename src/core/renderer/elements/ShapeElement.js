import { VisualElement } from './VisualElement.js';
import { CodeRunner } from '../../effects/CodeRunner.js';

export class ShapeElement extends VisualElement {
    constructor(data) {
        super(data);
        this.shadowEl = null;
    }

    update(newData) {
        super.update(newData);
        const el = this.data;
        const div = this.domElement;

        if (!div) return;

        this.applyFills(div, el);
        this.applyStrokes(div, el);
        this.applyEffects(div, el);
    }

    applyFills(div, el) {
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
                            layer.style.backgroundColor = fill.color;
                        } else if (fill.type === 'gradient') {
                            if (fillValue.startsWith('/* diamond|')) {
                                this.renderDiamondGradient(layer, el.width, el.height, fillValue);
                            } else {
                                layer.style.background = fillValue;
                            }
                        } else if (fill.type === 'image') {
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
                 const color = stroke.color || 'transparent';
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
            const stopsStr = sortedStops.map(s => `${s.color} ${s.position}%`).join(', ');

            if (type === 'linear') {
                return `linear-gradient(${angle}deg, ${stopsStr})`;
            } else if (type === 'radial') {
                return `radial-gradient(circle at center, ${stopsStr})`;
            } else if (type === 'angular') {
                return `conic-gradient(from ${angle}deg at center, ${stopsStr})`;
            } else if (type === 'diamond') {
                 const metaStops = sortedStops.map(s => `${s.color}@${s.position/100}`).join(';');
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
                const [color, pos] = s.split('@');
                let position = parseFloat(pos);
                if (position > 1) position /= 100;
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
