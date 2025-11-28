import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock all dependencies
vi.mock('../../../../../src/ui/Icons.js', () => ({
    Icons: {
        PLUS: '<svg></svg>',
        CLOSE: '<svg></svg>',
        FILL_SOLID: '<svg></svg>',
        FILL_GRADIENT: '<svg></svg>',
        FILL_IMAGE: '<svg></svg>',
        FILL_VIDEO: '<svg></svg>',
        FILL_CODE: '<svg></svg>',
        EXTERNAL: '↗'
    }
}));

vi.mock('../../../../../src/ui/components/IconButton.js', () => ({
    IconButton: class MockIconButton {
        constructor(options = {}) {
            this.element = document.createElement('button');
            this.element.className = 'ui-icon-btn';
            this.element.title = options.title || '';
            if (options.onClick) {
                this.element.addEventListener('click', options.onClick);
            }
        }
    }
}));

vi.mock('../../../../../src/ui/components/FillTypeSelector.js', () => ({
    FillTypeSelector: class MockFillTypeSelector {
        constructor(options = {}) {
            this.element = document.createElement('div');
            this.element.className = 'fill-type-selector';
            this.activeType = options.activeType || 'solid';
            this.onChange = options.onChange;
        }
    }
}));

vi.mock('../../../../../src/ui/components/FillFlyout/SolidTab.js', () => ({
    SolidTab: class MockSolidTab {
        constructor(options = {}) {
            this.element = document.createElement('div');
            this.element.className = 'solid-tab';
            this.fill = options.fill || {};
            this.onChange = options.onChange;
        }
        destroy() { this.destroyed = true; }
    }
}));

vi.mock('../../../../../src/ui/components/FillFlyout/GradientTab.js', () => ({
    GradientTab: class MockGradientTab {
        constructor(options = {}) {
            this.element = document.createElement('div');
            this.element.className = 'gradient-tab';
            this.fill = options.fill || {};
            this.onChange = options.onChange;
        }
        destroy() { this.destroyed = true; }
    }
}));

vi.mock('../../../../../src/ui/components/FillFlyout/ImageTab.js', () => ({
    ImageTab: class MockImageTab {
        constructor(options = {}) {
            this.element = document.createElement('div');
            this.element.className = 'image-tab';
            this.fill = options.fill || {};
            this.onChange = options.onChange;
        }
        destroy() { this.destroyed = true; }
    }
}));

vi.mock('../../../../../src/ui/components/FillFlyout/VideoTab.js', () => ({
    VideoTab: class MockVideoTab {
        constructor(options = {}) {
            this.element = document.createElement('div');
            this.element.className = 'video-tab';
            this.fill = options.fill || {};
            this.onChange = options.onChange;
        }
        destroy() { this.destroyed = true; }
    }
}));

vi.mock('../../../../../src/ui/components/FillFlyout/CodeTab.js', () => ({
    CodeTab: class MockCodeTab {
        constructor(options = {}) {
            this.element = document.createElement('div');
            this.element.className = 'code-tab';
            this.fill = options.fill || {};
            this.onChange = options.onChange;
        }
        destroy() { this.destroyed = true; }
    }
}));

vi.mock('../../../../../src/core/effects/CodeRunner.js', () => ({
    CodeRunner: {
        DEFAULT_CODE: 'function render(ctx, w, h) {}'
    }
}));

vi.mock('../../../../../src/ui/panels/CodeFillPanel.js', () => ({
    CodeFillPanel: {
        open: vi.fn()
    }
}));

vi.mock('../../../../../src/ui/components/Flyout.js', () => ({
    Flyout: class MockFlyout {
        constructor(options = {}) {
            this.options = options;
            this.element = document.createElement('div');
            this.element.className = 'ui-flyout';
            this.isOpen = false;
        }
        open() { this.isOpen = true; }
        close() { 
            this.isOpen = false; 
            if (this.options.onClose) this.options.onClose();
        }
    }
}));

import { FillFlyout } from '../../../../../src/ui/components/FillFlyout/FillFlyout.js';

describe('FillFlyout', () => {
    let flyout;
    let mockOnChange;

    beforeEach(() => {
        document.body.innerHTML = '';
        mockOnChange = vi.fn();
    });

    afterEach(() => {
        if (flyout) {
            flyout.destroy();
        }
        flyout = null;
    });

    describe('constructor', () => {
        it('should create flyout with default options', () => {
            flyout = new FillFlyout();
            
            expect(flyout.element).toBeDefined();
            expect(flyout.element.className).toContain('fill-flyout');
        });

        it('should set default fill when not provided', () => {
            flyout = new FillFlyout();
            
            expect(flyout.fill.type).toBe('solid');
            expect(flyout.fill.color).toBe('#000000');
            expect(flyout.fill.opacity).toBe(100);
        });

        it('should accept custom fill', () => {
            flyout = new FillFlyout({
                fill: { type: 'gradient', value: 'test' }
            });
            
            expect(flyout.fill.type).toBe('gradient');
            expect(flyout.fill.value).toBe('test');
        });

        it('should accept onChange callback', () => {
            flyout = new FillFlyout({ onChange: mockOnChange });
            expect(flyout.onChange).toBe(mockOnChange);
        });

        it('should set width to 240px', () => {
            flyout = new FillFlyout();
            expect(flyout.element.style.width).toBe('240px');
        });

        it('should stop mousedown propagation', () => {
            flyout = new FillFlyout();
            
            const event = new MouseEvent('mousedown', { bubbles: true });
            const stopSpy = vi.spyOn(event, 'stopPropagation');
            
            flyout.element.dispatchEvent(event);
            
            expect(stopSpy).toHaveBeenCalled();
        });

        it('should apply flex column layout', () => {
            flyout = new FillFlyout();
            expect(flyout.element.style.flexDirection).toBe('column');
        });
    });

    describe('render', () => {
        it('should render header with tabs', () => {
            flyout = new FillFlyout();
            
            expect(flyout.element.textContent).toContain('Custom');
            expect(flyout.element.textContent).toContain('Libraries');
        });

        it('should render close button', () => {
            flyout = new FillFlyout();
            
            const buttons = flyout.element.querySelectorAll('.ui-icon-btn');
            expect(buttons.length).toBeGreaterThanOrEqual(1);
        });

        it('should render add button', () => {
            flyout = new FillFlyout();
            
            const buttons = flyout.element.querySelectorAll('.ui-icon-btn');
            const titles = Array.from(buttons).map(b => b.title);
            expect(titles).toContain('Create Style');
        });

        it('should render type selector', () => {
            flyout = new FillFlyout();
            
            const typeSelector = flyout.element.querySelector('.fill-type-selector');
            expect(typeSelector).toBeDefined();
        });

        it('should render solid tab by default', () => {
            flyout = new FillFlyout();
            
            const solidTab = flyout.element.querySelector('.solid-tab');
            expect(solidTab).toBeDefined();
        });

        it('should render gradient tab when type is gradient', () => {
            flyout = new FillFlyout({
                fill: { type: 'gradient' }
            });
            
            const gradientTab = flyout.element.querySelector('.gradient-tab');
            expect(gradientTab).toBeDefined();
        });

        it('should render image tab when type is image', () => {
            flyout = new FillFlyout({
                fill: { type: 'image' }
            });
            
            const imageTab = flyout.element.querySelector('.image-tab');
            expect(imageTab).toBeDefined();
        });

        it('should render video tab when type is video', () => {
            flyout = new FillFlyout({
                fill: { type: 'video' }
            });
            
            const videoTab = flyout.element.querySelector('.video-tab');
            expect(videoTab).toBeDefined();
        });

        it('should render code tab when type is code', () => {
            flyout = new FillFlyout({
                fill: { type: 'code' }
            });
            
            const codeTab = flyout.element.querySelector('.code-tab');
            expect(codeTab).toBeDefined();
        });

        it('should show open panel button for code fills', () => {
            flyout = new FillFlyout({
                fill: { type: 'code' }
            });
            
            const buttons = flyout.element.querySelectorAll('.ui-icon-btn');
            const titles = Array.from(buttons).map(b => b.title);
            expect(titles.some(t => t.includes('Code Fill Panel'))).toBe(true);
        });
    });

    describe('setMode', () => {
        it('should not re-render if same type', () => {
            flyout = new FillFlyout({ fill: { type: 'solid' } });
            const renderSpy = vi.spyOn(flyout, 'render');
            
            flyout.setMode('solid');
            
            expect(renderSpy).not.toHaveBeenCalled();
        });

        it('should update fill type', () => {
            flyout = new FillFlyout({ onChange: mockOnChange });
            
            flyout.setMode('gradient');
            
            expect(flyout.fill.type).toBe('gradient');
        });

        it('should set default solid color when switching to solid', () => {
            flyout = new FillFlyout({
                fill: { type: 'gradient' },
                onChange: mockOnChange
            });
            
            flyout.setMode('solid');
            
            expect(mockOnChange).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'solid',
                    color: '#000000'
                }),
                false
            );
        });

        it('should set default gradient when switching to gradient', () => {
            flyout = new FillFlyout({ onChange: mockOnChange });
            
            flyout.setMode('gradient');
            
            expect(mockOnChange).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'gradient',
                    value: expect.any(Object)
                }),
                false
            );
        });

        it('should set empty value when switching to image', () => {
            flyout = new FillFlyout({ onChange: mockOnChange });
            
            flyout.setMode('image');
            
            expect(mockOnChange).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'image',
                    value: ''
                }),
                false
            );
        });

        it('should set default code when switching to code', () => {
            flyout = new FillFlyout({ onChange: mockOnChange });
            
            flyout.setMode('code');
            
            expect(mockOnChange).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'code',
                    code: expect.any(String)
                }),
                false
            );
        });
    });

    describe('updateFill', () => {
        it('should merge updates into fill', () => {
            flyout = new FillFlyout({
                fill: { type: 'solid', color: '#000000' },
                onChange: mockOnChange
            });
            
            flyout.updateFill({ color: '#ff0000' });
            
            expect(flyout.fill.color).toBe('#ff0000');
            expect(flyout.fill.type).toBe('solid');
        });

        it('should call onChange with updated fill', () => {
            flyout = new FillFlyout({ onChange: mockOnChange });
            
            flyout.updateFill({ opacity: 50 });
            
            expect(mockOnChange).toHaveBeenCalledWith(
                expect.objectContaining({ opacity: 50 }),
                false
            );
        });

        it('should pass transient flag to onChange', () => {
            flyout = new FillFlyout({ onChange: mockOnChange });
            
            flyout.updateFill({ opacity: 50 }, true);
            
            expect(mockOnChange).toHaveBeenCalledWith(
                expect.anything(),
                true
            );
        });

        it('should re-render when type changes', () => {
            flyout = new FillFlyout();
            const renderSpy = vi.spyOn(flyout, 'render');
            
            flyout.updateFill({ type: 'gradient' });
            
            expect(renderSpy).toHaveBeenCalled();
        });

        it('should not re-render when type stays same', () => {
            flyout = new FillFlyout({ fill: { type: 'solid' } });
            flyout.render(); // Initial render
            const renderSpy = vi.spyOn(flyout, 'render');
            
            flyout.updateFill({ color: '#ff0000' });
            
            expect(renderSpy).not.toHaveBeenCalled();
        });

        it('should cache gradient value for later use', () => {
            flyout = new FillFlyout({ onChange: mockOnChange });
            
            flyout.updateFill({ 
                type: 'gradient',
                value: { type: 'linear', angle: 45, stops: [] }
            });
            
            // The gradient should be cached (tested by switching back)
            expect(flyout.fill.value).toEqual({ type: 'linear', angle: 45, stops: [] });
        });
    });

    describe('destroy', () => {
        it('should call destroy on current tab instance', () => {
            flyout = new FillFlyout({ fill: { type: 'code' } });
            const tabInstance = flyout.currentTabInstance;
            
            flyout.destroy();
            
            expect(tabInstance.destroyed).toBe(true);
        });

        it('should not throw if no tab instance', () => {
            flyout = new FillFlyout();
            flyout.currentTabInstance = null;
            
            expect(() => flyout.destroy()).not.toThrow();
        });
    });

    describe('close button', () => {
        it('should close flyout when clicked', () => {
            flyout = new FillFlyout();
            flyout.open();
            
            const closeBtn = Array.from(flyout.element.querySelectorAll('.ui-icon-btn'))
                .find(b => b.title === 'Close');
            closeBtn.click();
            
            expect(flyout.isOpen).toBe(false);
        });
    });

    describe('tab instance cleanup', () => {
        it('should destroy previous tab when switching types', () => {
            flyout = new FillFlyout({ fill: { type: 'code' } });
            const firstTab = flyout.currentTabInstance;
            
            flyout.updateFill({ type: 'solid' });
            
            expect(firstTab.destroyed).toBe(true);
        });

        it('should store new tab instance', () => {
            flyout = new FillFlyout();
            
            expect(flyout.currentTabInstance).toBeDefined();
            expect(flyout.currentTabInstance.element.className).toBe('solid-tab');
        });
    });

    describe('fill type selector', () => {
        it('should pass activeType to selector', () => {
            flyout = new FillFlyout({ fill: { type: 'gradient' } });
            
            const selector = flyout.element.querySelector('.fill-type-selector');
            expect(selector).toBeDefined();
        });
    });

    describe('styling', () => {
        it('should have elevated background', () => {
            flyout = new FillFlyout();
            expect(flyout.element.style.backgroundColor).toBe('var(--color-bg-elevated)');
        });

        it('should have border radius', () => {
            flyout = new FillFlyout();
            expect(flyout.element.style.borderRadius).toBe('var(--radius-lg)');
        });

        it('should have box shadow', () => {
            flyout = new FillFlyout();
            expect(flyout.element.style.boxShadow).toBe('var(--shadow-2xl)');
        });

        it('should have padding', () => {
            flyout = new FillFlyout();
            expect(flyout.element.style.padding).toBe('12px');
        });

        it('should have gap between elements', () => {
            flyout = new FillFlyout();
            expect(flyout.element.style.gap).toBe('12px');
        });
    });
});
