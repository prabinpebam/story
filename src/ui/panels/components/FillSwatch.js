/**
 * FillSwatch.js
 * An individual fill swatch component for the Fill Layer Bar.
 * Shows preview based on fill type, with special handling for code fills.
 */

import { Icons } from '../../Icons.js';
import { CodeRunner } from '../../../core/effects/CodeRunner.js';

export class FillSwatch {
    constructor(options = {}) {
        this.fill = options.fill || {};
        this.index = options.index ?? 0;
        this.isSelected = options.isSelected || false;
        this.isDisabled = options.isDisabled || false;
        
        this.onClick = options.onClick || (() => {});
        this.onContextMenu = options.onContextMenu || (() => {});
        this.onDragStart = options.onDragStart || (() => {});
        this.onDragOver = options.onDragOver || (() => {});
        this.onDragEnd = options.onDragEnd || (() => {});
        this.onDrop = options.onDrop || (() => {});
        
        this.runner = null;
        this.tooltip = null;
        
        this.element = document.createElement('div');
        this.element.className = 'cfp-fill-swatch';
        
        this.render();
        this.bindEvents();
    }

    render() {
        const fill = this.fill;
        
        // Set classes
        this.element.className = 'cfp-fill-swatch';
        
        if (this.isSelected) {
            this.element.classList.add('selected');
        }
        
        if (this.isDisabled) {
            this.element.classList.add('disabled');
        }
        
        if (fill.type === 'code') {
            this.element.classList.add('code-fill');
        }
        
        // Set draggable for code fills
        this.element.draggable = fill.type === 'code';
        
        // Render preview based on fill type
        this.element.innerHTML = '';
        
        switch (fill.type) {
            case 'code':
                this.renderCodePreview();
                break;
            case 'solid':
                this.renderSolidPreview();
                break;
            case 'gradient':
                this.renderGradientPreview();
                break;
            case 'image':
                this.renderImagePreview();
                break;
            case 'video':
                this.renderVideoPreview();
                break;
            default:
                this.renderUnknownPreview();
        }
        
        // Set tooltip
        this.element.title = this.getTooltipText();
    }

    renderCodePreview() {
        // For code fills, show a mini canvas preview
        const canvas = document.createElement('canvas');
        canvas.width = 28;
        canvas.height = 28;
        
        this.runner = new CodeRunner(canvas);
        this.runner.setCode(this.fill.code || '');
        
        // Start throttled animation (5fps for swatch)
        this.startThrottledPreview();
        
        this.element.appendChild(canvas);
    }

    startThrottledPreview() {
        if (!this.runner) return;
        
        const targetFPS = 5;
        const frameInterval = 1000 / targetFPS;
        let lastFrameTime = 0;
        
        const loop = () => {
            if (!this.runner || !this.runner.isPlaying) return;
            
            const now = performance.now();
            const elapsed = now - lastFrameTime;
            
            if (elapsed >= frameInterval) {
                lastFrameTime = now - (elapsed % frameInterval);
                
                const time = (now - this.runner.startTime) / 1000;
                if (this.runner.drawFunction) {
                    this.runner.ctx.setTransform(1, 0, 0, 1, 0, 0);
                    try {
                        this.runner.drawFunction(time);
                    } catch (e) {
                        // Ignore errors
                    }
                }
            }
            
            this.previewFrame = requestAnimationFrame(loop);
        };
        
        this.runner.isPlaying = true;
        this.runner.startTime = performance.now();
        this.runner.run();
        
        if (this.runner.animationFrame) {
            cancelAnimationFrame(this.runner.animationFrame);
        }
        loop();
    }

    renderSolidPreview() {
        this.element.style.backgroundColor = this.fill.color || '#808080';
    }

    renderGradientPreview() {
        const gradient = this.fill.value || this.fill.gradient;
        if (gradient) {
            // Convert gradient to CSS
            this.element.style.background = this.gradientToCSS(gradient);
        } else {
            this.element.style.background = 'linear-gradient(135deg, #808080, #404040)';
        }
    }

    gradientToCSS(gradient) {
        if (!gradient || !gradient.stops) {
            return 'linear-gradient(135deg, #808080, #404040)';
        }
        
        const stops = gradient.stops
            .map(s => `${s.color} ${s.position * 100}%`)
            .join(', ');
        
        if (gradient.type === 'radial') {
            return `radial-gradient(circle, ${stops})`;
        } else {
            const angle = gradient.angle || 135;
            return `linear-gradient(${angle}deg, ${stops})`;
        }
    }

    renderImagePreview() {
        if (this.fill.url || this.fill.src) {
            const img = document.createElement('div');
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.backgroundImage = `url(${this.fill.url || this.fill.src})`;
            img.style.backgroundSize = 'cover';
            img.style.backgroundPosition = 'center';
            this.element.appendChild(img);
        } else {
            this.element.innerHTML = `<span class="swatch-icon">${Icons.IMAGE || '🖼'}</span>`;
        }
    }

    renderVideoPreview() {
        // Show video icon
        const icon = document.createElement('span');
        icon.className = 'swatch-icon';
        icon.innerHTML = Icons.VIDEO || '▶';
        this.element.appendChild(icon);
        this.element.style.backgroundColor = 'var(--color-bg-tertiary)';
    }

    renderUnknownPreview() {
        this.element.style.backgroundColor = 'var(--color-bg-tertiary)';
        this.element.innerHTML = '?';
    }

    getTooltipText() {
        const typeLabel = this.getTypeLabel();
        const indexLabel = `Fill ${this.index + 1}`;
        
        if (this.isDisabled) {
            return `${indexLabel} (${typeLabel}) - Not a code fill`;
        }
        
        return `${indexLabel} (${typeLabel})`;
    }

    getTypeLabel() {
        switch (this.fill.type) {
            case 'code': return 'Code';
            case 'solid': return 'Solid';
            case 'gradient': return 'Gradient';
            case 'image': return 'Image';
            case 'video': return 'Video';
            default: return 'Unknown';
        }
    }

    bindEvents() {
        // Click
        this.element.addEventListener('click', (e) => {
            if (!this.isDisabled) {
                this.onClick(e);
            }
        });
        
        // Context menu
        this.element.addEventListener('contextmenu', (e) => {
            if (!this.isDisabled) {
                this.onContextMenu(e);
            }
        });
        
        // Drag and drop
        this.element.addEventListener('dragstart', (e) => this.onDragStart(e));
        this.element.addEventListener('dragover', (e) => this.onDragOver(e));
        this.element.addEventListener('dragend', (e) => this.onDragEnd(e));
        this.element.addEventListener('drop', (e) => this.onDrop(e));
    }

    destroy() {
        if (this.previewFrame) {
            cancelAnimationFrame(this.previewFrame);
        }
        
        if (this.runner) {
            this.runner.stop();
            this.runner = null;
        }
    }
}

export default FillSwatch;
