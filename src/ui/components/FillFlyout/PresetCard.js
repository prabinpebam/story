/**
 * PresetCard - Individual preset card with live preview
 */

import { CodeRunner } from '../../../core/effects/CodeRunner.js';

export class PresetCard {
    constructor(options = {}) {
        this.preset = options.preset;
        this.onSelect = options.onSelect || (() => {});
        this.onDelete = options.onDelete || null;
        this.onRename = options.onRename || null;
        
        this.runner = null;
        this.hoverTimeout = null;
        this.tooltip = null;
        this.isHovered = false;
        this.frameCount = 0;
        this.lastFrameTime = 0;
        
        this.element = document.createElement('div');
        this.element.className = 'preset-card';
        
        this.render();
        this.bindEvents();
    }

    render() {
        this.element.innerHTML = '';

        // Preview container (4:3 aspect ratio) - no labels, just the canvas
        const previewContainer = document.createElement('div');
        previewContainer.className = 'preset-preview';

        // Canvas for live preview
        const canvas = document.createElement('canvas');
        canvas.width = 120;
        canvas.height = 90;
        previewContainer.appendChild(canvas);
        this.canvas = canvas;

        // Initialize CodeRunner for preview (throttled to 15fps)
        this.runner = new CodeRunner(canvas);
        this.runner.setCode(this.preset.code);
        
        // Start with animation paused, will play on hover or after delay
        this.startThrottledAnimation();

        this.element.appendChild(previewContainer);
        
        // No info row - labels removed to save space
    }

    bindEvents() {
        // Click to select
        this.element.onclick = () => {
            this.onSelect(this.preset);
        };

        // Hover effects - handled via CSS .preset-card:hover

        // Show tooltip after delay
        this.element.onmouseenter = () => {
            this.isHovered = true;
            this.hoverTimeout = setTimeout(() => {
                this.showTooltip();
            }, 400);
        };

        this.element.onmouseleave = () => {
            this.isHovered = false;
            
            // Cancel tooltip
            if (this.hoverTimeout) {
                clearTimeout(this.hoverTimeout);
                this.hoverTimeout = null;
            }
            this.hideTooltip();
        };

        // Right-click context menu (for user presets)
        if (this.preset.category === 'user') {
            this.element.oncontextmenu = (e) => {
                e.preventDefault();
                this.showOptionsMenu(e);
            };
        }
    }

    startThrottledAnimation() {
        // Throttle to ~15fps for grid performance
        const targetFPS = 15;
        const frameInterval = 1000 / targetFPS;
        
        const loop = () => {
            if (!this.runner || !this.runner.isPlaying) return;
            
            const now = performance.now();
            const elapsed = now - this.lastFrameTime;
            
            if (elapsed >= frameInterval) {
                this.lastFrameTime = now - (elapsed % frameInterval);
                
                // Let CodeRunner handle the drawing
                const time = (now - this.runner.startTime) / 1000;
                if (this.runner.drawFunction) {
                    this.runner.ctx.setTransform(1, 0, 0, 1, 0, 0);
                    try {
                        this.runner.drawFunction(time);
                    } catch (e) {
                        // Ignore errors in preview
                    }
                }
            }
            
            this.animationFrame = requestAnimationFrame(loop);
        };

        this.runner.isPlaying = true;
        this.runner.startTime = performance.now();
        this.runner.run();
        
        // Override the internal loop with our throttled one
        if (this.runner.animationFrame) {
            cancelAnimationFrame(this.runner.animationFrame);
        }
        loop();
    }

    showTooltip() {
        if (this.tooltip) return;
        
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'preset-tooltip';

        // Get card dimensions to match tooltip size
        const cardRect = this.element.getBoundingClientRect();
        const tooltipWidth = Math.max(cardRect.width * 2, 160); // At least 2x card size or 160px
        const tooltipHeight = tooltipWidth * 0.75; // 4:3 aspect ratio

        // Large preview canvas that matches tooltip size
        const previewCanvas = document.createElement('canvas');
        previewCanvas.width = tooltipWidth;
        previewCanvas.height = tooltipHeight;
        previewCanvas.style.width = tooltipWidth + 'px';
        previewCanvas.style.height = tooltipHeight + 'px';
        this.tooltip.appendChild(previewCanvas);

        // Initialize preview runner
        this.tooltipRunner = new CodeRunner(previewCanvas);
        this.tooltipRunner.setCode(this.preset.code);
        this.tooltipRunner.play();

        // Info section
        const info = document.createElement('div');
        info.className = 'preset-tooltip-info';

        const name = document.createElement('div');
        name.textContent = this.preset.name;
        name.className = 'preset-tooltip-name';
        info.appendChild(name);

        if (this.preset.description) {
            const desc = document.createElement('div');
            desc.textContent = this.preset.description;
            desc.className = 'preset-tooltip-desc';
            info.appendChild(desc);
        }

        this.tooltip.appendChild(info);

        // Position tooltip centered above the card
        const rect = this.element.getBoundingClientRect();
        let left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        let top = rect.top - tooltipHeight - 10 - 40; // 40px for info section

        // Keep within viewport - if no room above, show to the right
        if (top < 10) {
            left = rect.right + 10;
            top = rect.top;
            
            // If no room on right, show on left
            if (left + tooltipWidth > window.innerWidth - 10) {
                left = rect.left - tooltipWidth - 10;
            }
        }
        
        // Keep within horizontal bounds
        if (left < 10) left = 10;
        if (left + tooltipWidth > window.innerWidth - 10) {
            left = window.innerWidth - tooltipWidth - 10;
        }

        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.top = `${top}px`;
        this.tooltip.style.width = `${tooltipWidth}px`;

        document.body.appendChild(this.tooltip);
    }

    hideTooltip() {
        if (this.tooltip) {
            if (this.tooltipRunner) {
                this.tooltipRunner.stop();
                this.tooltipRunner = null;
            }
            this.tooltip.remove();
            this.tooltip = null;
        }
    }

    showOptionsMenu(e) {
        // Remove any existing menu
        const existing = document.querySelector('.preset-options-menu');
        if (existing) existing.remove();

        const menu = document.createElement('div');
        menu.className = 'preset-options-menu';

        const options = [
            { label: 'Rename', action: () => this.onRename?.(this.preset) },
            { label: 'Duplicate', action: () => this.onDuplicate?.(this.preset) },
            { label: 'Delete', action: () => this.onDelete?.(this.preset), danger: true }
        ];

        options.forEach(opt => {
            const item = document.createElement('div');
            item.textContent = opt.label;
            item.className = 'preset-menu-item' + (opt.danger ? ' danger' : '');
            item.onclick = (e) => {
                e.stopPropagation();
                menu.remove();
                opt.action();
            };
            menu.appendChild(item);
        });

        // Position menu
        let left = e.clientX;
        let top = e.clientY;

        if (left + 130 > window.innerWidth) left = window.innerWidth - 140;
        if (top + 100 > window.innerHeight) top = window.innerHeight - 110;

        menu.style.left = `${left}px`;
        menu.style.top = `${top}px`;

        document.body.appendChild(menu);

        // Close on click outside
        const closeHandler = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeHandler);
            }
        };
        setTimeout(() => document.addEventListener('click', closeHandler), 0);
    }

    destroy() {
        if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
        }
        this.hideTooltip();
        
        if (this.runner) {
            this.runner.stop();
            this.runner = null;
        }
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
}
