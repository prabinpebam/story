import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock dependencies before import
vi.mock('../../../../src/ui/components/IconButton.js', () => ({
    IconButton: vi.fn().mockImplementation(({ icon, title, isActive, onClick }) => {
        const element = document.createElement('button');
        element.className = 'icon-button';
        element.innerHTML = icon || '';
        element.title = title || '';
        if (isActive) element.classList.add('active');
        element.addEventListener('click', onClick || (() => {}));
        return { element };
    })
}));

vi.mock('../../../../src/ui/Icons.js', () => ({
    Icons: {
        FILL_SOLID: '<svg>solid</svg>',
        FILL_GRADIENT: '<svg>gradient</svg>',
        FILL_IMAGE: '<svg>image</svg>',
        FILL_VIDEO: '<svg>video</svg>',
        FILL_CODE: '<svg>code</svg>'
    }
}));

import { FillTypeSelector } from '../../../../src/ui/components/FillTypeSelector.js';

describe('FillTypeSelector', () => {
    let container;

    beforeEach(() => {
        vi.clearAllMocks();
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        container.remove();
    });

    describe('initialization', () => {
        it('creates element with correct class', () => {
            const selector = new FillTypeSelector();
            expect(selector.element).toBeDefined();
            expect(selector.element.className).toBe('fill-type-selector');
        });

        it('uses default active type of solid', () => {
            const selector = new FillTypeSelector();
            expect(selector.activeType).toBe('solid');
        });

        it('accepts custom active type', () => {
            const selector = new FillTypeSelector({ activeType: 'gradient' });
            expect(selector.activeType).toBe('gradient');
        });

        it('accepts onChange callback', () => {
            const onChange = vi.fn();
            const selector = new FillTypeSelector({ onChange });
            expect(selector.onChange).toBe(onChange);
        });

        it('creates buttons for all default types', () => {
            const selector = new FillTypeSelector();
            const buttons = selector.element.querySelectorAll('.icon-button');
            expect(buttons.length).toBe(5); // solid, gradient, image, video, code
        });

        it('accepts custom types', () => {
            const selector = new FillTypeSelector({
                types: [
                    { type: 'solid', icon: '<svg/>', title: 'Solid' },
                    { type: 'gradient', icon: '<svg/>', title: 'Gradient' }
                ]
            });
            const buttons = selector.element.querySelectorAll('.icon-button');
            expect(buttons.length).toBe(2);
        });
    });

    describe('type selection', () => {
        it('marks active type button as active', () => {
            const selector = new FillTypeSelector({ activeType: 'solid' });
            // Check that the first button has active class
            const buttons = selector.element.querySelectorAll('.icon-button');
            expect(buttons[0].classList.contains('active')).toBe(true);
        });

        it('calls onChange when clicking different type', () => {
            const onChange = vi.fn();
            const selector = new FillTypeSelector({ activeType: 'solid', onChange });
            container.appendChild(selector.element);
            
            // Click on gradient button (second button)
            const buttons = selector.element.querySelectorAll('.icon-button');
            buttons[1].click();
            
            expect(onChange).toHaveBeenCalledWith('gradient');
        });

        it('updates activeType on selection', () => {
            const selector = new FillTypeSelector({ activeType: 'solid' });
            container.appendChild(selector.element);
            
            // Click on gradient button
            const buttons = selector.element.querySelectorAll('.icon-button');
            buttons[1].click();
            
            expect(selector.activeType).toBe('gradient');
        });

        it('does not call onChange when clicking same type', () => {
            const onChange = vi.fn();
            const selector = new FillTypeSelector({ activeType: 'solid', onChange });
            container.appendChild(selector.element);
            
            // Click on solid button (already active)
            const buttons = selector.element.querySelectorAll('.icon-button');
            buttons[0].click();
            
            expect(onChange).not.toHaveBeenCalled();
        });

        it('re-renders on type change to update active state', () => {
            const selector = new FillTypeSelector({ activeType: 'solid' });
            container.appendChild(selector.element);
            
            const renderSpy = vi.spyOn(selector, 'render');
            
            // Click on gradient button
            const buttons = selector.element.querySelectorAll('.icon-button');
            buttons[1].click();
            
            expect(renderSpy).toHaveBeenCalled();
        });
    });

    describe('render method', () => {
        it('clears element before rendering', () => {
            const selector = new FillTypeSelector();
            selector.element.innerHTML = '<div>test</div>';
            
            selector.render();
            
            const testDiv = selector.element.querySelector('div');
            expect(testDiv).toBeNull();
        });

        it('creates button for each type', () => {
            const selector = new FillTypeSelector({
                types: [
                    { type: 'a', icon: '1', title: 'A' },
                    { type: 'b', icon: '2', title: 'B' },
                    { type: 'c', icon: '3', title: 'C' }
                ]
            });
            
            const buttons = selector.element.querySelectorAll('.icon-button');
            expect(buttons.length).toBe(3);
        });
    });

    describe('default types', () => {
        it('includes solid type', () => {
            const selector = new FillTypeSelector();
            expect(selector.types.some(t => t.type === 'solid')).toBe(true);
        });

        it('includes gradient type', () => {
            const selector = new FillTypeSelector();
            expect(selector.types.some(t => t.type === 'gradient')).toBe(true);
        });

        it('includes image type', () => {
            const selector = new FillTypeSelector();
            expect(selector.types.some(t => t.type === 'image')).toBe(true);
        });

        it('includes video type', () => {
            const selector = new FillTypeSelector();
            expect(selector.types.some(t => t.type === 'video')).toBe(true);
        });

        it('includes code type', () => {
            const selector = new FillTypeSelector();
            expect(selector.types.some(t => t.type === 'code')).toBe(true);
        });
    });

    describe('edge cases', () => {
        it('handles missing onChange gracefully', () => {
            const selector = new FillTypeSelector({ activeType: 'solid' });
            container.appendChild(selector.element);
            
            // Should not throw when clicking with no onChange
            const buttons = selector.element.querySelectorAll('.icon-button');
            expect(() => buttons[1].click()).not.toThrow();
        });

        it('handles empty types array', () => {
            const selector = new FillTypeSelector({ types: [] });
            const buttons = selector.element.querySelectorAll('.icon-button');
            expect(buttons.length).toBe(0);
        });
    });
});
