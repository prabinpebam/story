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
        this.element.style.cssText = `
            display: flex;
            flex-direction: column;
            border-radius: 6px;
            overflow: hidden;
            cursor: pointer;
            background: #383838;
            transition: transform 0.15s ease, box-shadow 0.15s ease;
            position: relative;
        `;

        // Preview container (4:3 aspect ratio)
        const previewContainer = document.createElement('div');
        previewContainer.style.cssText = `
            position: relative;
            width: 100%;
            padding-top: 75%; /* 4:3 aspect ratio */
            background: #1a1a1a;
            overflow: hidden;
        `;

        // Canvas for live preview
        const canvas = document.createElement('canvas');
        canvas.width = 120;
        canvas.height = 90;
        canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        `;
        previewContainer.appendChild(canvas);
        this.canvas = canvas;

        // Initialize CodeRunner for preview (throttled to 15fps)
        this.runner = new CodeRunner(canvas);
        this.runner.setCode(this.preset.code);
        
        // Start with animation paused, will play on hover or after delay
        this.startThrottledAnimation();

        this.element.appendChild(previewContainer);

        // Info row
        const infoRow = document.createElement('div');
        infoRow.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 8px;
            background: #2c2c2c;
        `;

        // Name
        const name = document.createElement('span');
        name.textContent = this.preset.name;
        name.style.cssText = `
            font-size: 10px;
            color: #e0e0e0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex: 1;
        `;
        infoRow.appendChild(name);

        // Options button (only for user presets)
        if (this.preset.category === 'user') {
            const optionsBtn = document.createElement('button');
            optionsBtn.innerHTML = '⋮';
            optionsBtn.style.cssText = `
                background: none;
                border: none;
                color: #888;
                cursor: pointer;
                padding: 2px 4px;
                font-size: 12px;
                line-height: 1;
                opacity: 0;
                transition: opacity 0.15s ease;
            `;
            optionsBtn.className = 'preset-options-btn';
            optionsBtn.onclick = (e) => {
                e.stopPropagation();
                this.showOptionsMenu(e);
            };
            infoRow.appendChild(optionsBtn);
        }

        this.element.appendChild(infoRow);
    }

    bindEvents() {
        // Click to select
        this.element.onclick = () => {
            this.onSelect(this.preset);
        };

        // Hover effects
        this.element.onmouseenter = () => {
            this.isHovered = true;
            this.element.style.transform = 'scale(1.02)';
            this.element.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
            
            // Show options button
            const optionsBtn = this.element.querySelector('.preset-options-btn');
            if (optionsBtn) optionsBtn.style.opacity = '1';
            
            // Show tooltip after delay
            this.hoverTimeout = setTimeout(() => {
                this.showTooltip();
            }, 400);
        };

        this.element.onmouseleave = () => {
            this.isHovered = false;
            this.element.style.transform = 'scale(1)';
            this.element.style.boxShadow = 'none';
            
            // Hide options button
            const optionsBtn = this.element.querySelector('.preset-options-btn');
            if (optionsBtn) optionsBtn.style.opacity = '0';
            
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
        this.tooltip.style.cssText = `
            position: fixed;
            z-index: 10000;
            background: #2c2c2c;
            border-radius: 8px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.5);
            overflow: hidden;
            pointer-events: none;
            animation: fadeIn 0.15s ease;
        `;

        // Large preview canvas
        const previewCanvas = document.createElement('canvas');
        previewCanvas.width = 240;
        previewCanvas.height = 160;
        previewCanvas.style.cssText = `
            display: block;
            width: 240px;
            height: 160px;
        `;
        this.tooltip.appendChild(previewCanvas);

        // Initialize preview runner
        this.tooltipRunner = new CodeRunner(previewCanvas);
        this.tooltipRunner.setCode(this.preset.code);
        this.tooltipRunner.play();

        // Info section
        const info = document.createElement('div');
        info.style.cssText = `
            padding: 8px 12px;
            border-top: 1px solid #444;
        `;

        const name = document.createElement('div');
        name.textContent = this.preset.name;
        name.style.cssText = `
            font-size: 12px;
            font-weight: 600;
            color: #fff;
            margin-bottom: 2px;
        `;
        info.appendChild(name);

        if (this.preset.description) {
            const desc = document.createElement('div');
            desc.textContent = this.preset.description;
            desc.style.cssText = `
                font-size: 10px;
                color: #888;
            `;
            info.appendChild(desc);
        }

        this.tooltip.appendChild(info);

        // Position tooltip
        const rect = this.element.getBoundingClientRect();
        let left = rect.right + 10;
        let top = rect.top;

        // Keep within viewport
        if (left + 250 > window.innerWidth) {
            left = rect.left - 260;
        }
        if (top + 200 > window.innerHeight) {
            top = window.innerHeight - 210;
        }
        if (top < 10) top = 10;

        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.top = `${top}px`;

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
        menu.style.cssText = `
            position: fixed;
            z-index: 10001;
            background: #383838;
            border-radius: 6px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.4);
            overflow: hidden;
            min-width: 120px;
        `;

        const options = [
            { label: 'Rename', action: () => this.onRename?.(this.preset) },
            { label: 'Duplicate', action: () => this.onDuplicate?.(this.preset) },
            { label: 'Delete', action: () => this.onDelete?.(this.preset), danger: true }
        ];

        options.forEach(opt => {
            const item = document.createElement('div');
            item.textContent = opt.label;
            item.style.cssText = `
                padding: 8px 12px;
                font-size: 11px;
                color: ${opt.danger ? '#ff6b6b' : '#e0e0e0'};
                cursor: pointer;
                transition: background 0.1s ease;
            `;
            item.onmouseenter = () => item.style.background = '#444';
            item.onmouseleave = () => item.style.background = 'transparent';
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
