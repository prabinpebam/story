import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock store before imports
vi.mock('../../../../src/core/Store.js', () => ({
    store: {
        dispatch: vi.fn(),
        getState: vi.fn(() => ({})),
        on: vi.fn(),
        off: vi.fn()
    }
}));

import { Knob } from '../../../../src/ui/components/Knob.js';
import { store } from '../../../../src/core/Store.js';

describe('Knob', () => {
    let container;
    let mockCtx;

    beforeEach(() => {
        vi.clearAllMocks();
        container = document.createElement('div');
        document.body.appendChild(container);
        
        // Mock canvas getContext to return a mock 2d context
        mockCtx = {
            clearRect: vi.fn(),
            beginPath: vi.fn(),
            arc: vi.fn(),
            fill: vi.fn(),
            stroke: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            fillStyle: '',
            strokeStyle: '',
            lineWidth: 0
        };
        
        HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCtx);
        
        // Mock getComputedStyle
        vi.spyOn(window, 'getComputedStyle').mockReturnValue({
            getPropertyValue: vi.fn((prop) => {
                const values = {
                    '--color-bg-well': '#E6E6E6',
                    '--color-border': '#B3B3B3',
                    '--color-accent': '#18A0FB'
                };
                return values[prop] || '';
            })
        });
    });

    afterEach(() => {
        container.remove();
        vi.restoreAllMocks();
    });

    describe('initialization', () => {
        it('creates container element', () => {
            const knob = new Knob('Volume', 50, 0, 100, vi.fn());
            expect(knob.element).toBeDefined();
            expect(knob.element.tagName).toBe('DIV');
        });

        it('stores constructor parameters', () => {
            const onChange = vi.fn();
            const knob = new Knob('Brightness', 75, 0, 100, onChange);
            
            expect(knob.label).toBe('Brightness');
            expect(knob.value).toBe(75);
            expect(knob.min).toBe(0);
            expect(knob.max).toBe(100);
            expect(knob.onChange).toBe(onChange);
        });

        it('creates canvas element', () => {
            const knob = new Knob('Test', 50, 0, 100, vi.fn());
            const canvas = knob.element.querySelector('canvas');
            expect(canvas).toBeDefined();
            expect(canvas.width).toBe(64); // 32 * 2 for retina
            expect(canvas.height).toBe(64);
        });

        it('creates label element', () => {
            const knob = new Knob('Rotation', 0, 0, 360, vi.fn());
            // Label is the second child (after canvas)
            const labelDiv = knob.element.children[1];
            expect(labelDiv).toBeDefined();
            expect(labelDiv.innerText).toBe('Rotation');
        });

        it('sets canvas cursor to ns-resize', () => {
            const knob = new Knob('Test', 50, 0, 100, vi.fn());
            expect(knob.canvas.style.cursor).toBe('ns-resize');
        });

        it('applies flexbox column layout', () => {
            const knob = new Knob('Test', 50, 0, 100, vi.fn());
            expect(knob.element.style.display).toBe('flex');
            expect(knob.element.style.flexDirection).toBe('column');
            expect(knob.element.style.alignItems).toBe('center');
        });

        it('initializes dragging state to false', () => {
            const knob = new Knob('Test', 50, 0, 100, vi.fn());
            expect(knob.isDragging).toBe(false);
        });
    });

    describe('rendering', () => {
        it('has canvas context', () => {
            const knob = new Knob('Test', 50, 0, 100, vi.fn());
            expect(knob.ctx).toBe(mockCtx);
        });

        it('renders knob on creation', () => {
            const knob = new Knob('Test', 50, 0, 100, vi.fn());
            // renderKnob is called on creation
            expect(mockCtx.clearRect).toHaveBeenCalled();
        });
    });

    describe('drag interaction', () => {
        it('starts dragging on mousedown', () => {
            const knob = new Knob('Test', 50, 0, 100, vi.fn());
            container.appendChild(knob.element);
            
            const event = new MouseEvent('mousedown', { 
                clientY: 100,
                bubbles: true 
            });
            knob.canvas.dispatchEvent(event);
            
            expect(knob.isDragging).toBe(true);
            expect(knob.startY).toBe(100);
            expect(knob.startValue).toBe(50);
        });

        it('dispatches UI_INTERACTION_START on drag start', () => {
            const knob = new Knob('Test', 50, 0, 100, vi.fn());
            container.appendChild(knob.element);
            
            const event = new MouseEvent('mousedown', { 
                clientY: 100,
                bubbles: true 
            });
            knob.canvas.dispatchEvent(event);
            
            expect(store.dispatch).toHaveBeenCalledWith('UI_INTERACTION_START');
        });

        it('sets cursor to ns-resize on drag start', () => {
            const knob = new Knob('Test', 50, 0, 100, vi.fn());
            container.appendChild(knob.element);
            
            const event = new MouseEvent('mousedown', { 
                clientY: 100,
                bubbles: true 
            });
            knob.canvas.dispatchEvent(event);
            
            expect(document.body.style.cursor).toBe('ns-resize');
        });

        it('updates value on drag (up increases)', () => {
            const onChange = vi.fn();
            const knob = new Knob('Test', 50, 0, 100, onChange);
            container.appendChild(knob.element);
            
            // Start drag
            knob.canvas.dispatchEvent(new MouseEvent('mousedown', { 
                clientY: 100,
                bubbles: true 
            }));
            
            // Move up (decrease Y = increase value)
            window.dispatchEvent(new MouseEvent('mousemove', { 
                clientY: 50 
            }));
            
            expect(knob.value).toBeGreaterThan(50);
            expect(onChange).toHaveBeenCalled();
        });

        it('clamps value to min', () => {
            const onChange = vi.fn();
            const knob = new Knob('Test', 10, 0, 100, onChange);
            container.appendChild(knob.element);
            
            // Start drag
            knob.canvas.dispatchEvent(new MouseEvent('mousedown', { 
                clientY: 100,
                bubbles: true 
            }));
            
            // Move down a lot
            window.dispatchEvent(new MouseEvent('mousemove', { 
                clientY: 500 
            }));
            
            expect(knob.value).toBe(0);
        });

        it('clamps value to max', () => {
            const onChange = vi.fn();
            const knob = new Knob('Test', 90, 0, 100, onChange);
            container.appendChild(knob.element);
            
            // Start drag
            knob.canvas.dispatchEvent(new MouseEvent('mousedown', { 
                clientY: 100,
                bubbles: true 
            }));
            
            // Move up a lot
            window.dispatchEvent(new MouseEvent('mousemove', { 
                clientY: -500 
            }));
            
            expect(knob.value).toBe(100);
        });

        it('stops dragging on mouseup', () => {
            const knob = new Knob('Test', 50, 0, 100, vi.fn());
            container.appendChild(knob.element);
            
            // Start drag
            knob.canvas.dispatchEvent(new MouseEvent('mousedown', { 
                clientY: 100,
                bubbles: true 
            }));
            
            expect(knob.isDragging).toBe(true);
            
            // End drag
            window.dispatchEvent(new MouseEvent('mouseup'));
            
            expect(knob.isDragging).toBe(false);
        });

        it('dispatches UI_INTERACTION_END on drag end', () => {
            const knob = new Knob('Test', 50, 0, 100, vi.fn());
            container.appendChild(knob.element);
            
            // Start drag
            knob.canvas.dispatchEvent(new MouseEvent('mousedown', { 
                clientY: 100,
                bubbles: true 
            }));
            
            vi.clearAllMocks();
            
            // End drag
            window.dispatchEvent(new MouseEvent('mouseup'));
            
            expect(store.dispatch).toHaveBeenCalledWith('UI_INTERACTION_END');
        });

        it('resets cursor on drag end', () => {
            const knob = new Knob('Test', 50, 0, 100, vi.fn());
            container.appendChild(knob.element);
            
            // Start drag
            knob.canvas.dispatchEvent(new MouseEvent('mousedown', { 
                clientY: 100,
                bubbles: true 
            }));
            
            // End drag
            window.dispatchEvent(new MouseEvent('mouseup'));
            
            expect(document.body.style.cursor).toBe('default');
        });

        it('removes event listeners on drag end', () => {
            const knob = new Knob('Test', 50, 0, 100, vi.fn());
            container.appendChild(knob.element);
            
            const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
            
            // Start drag
            knob.canvas.dispatchEvent(new MouseEvent('mousedown', { 
                clientY: 100,
                bubbles: true 
            }));
            
            // End drag
            window.dispatchEvent(new MouseEvent('mouseup'));
            
            expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
            expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
        });
    });

    describe('value sensitivity', () => {
        it('uses sensitivity based on range', () => {
            const onChange = vi.fn();
            const knob = new Knob('Test', 50, 0, 200, onChange); // Range of 200
            container.appendChild(knob.element);
            
            // Start drag
            knob.canvas.dispatchEvent(new MouseEvent('mousedown', { 
                clientY: 100,
                bubbles: true 
            }));
            
            // Move up by 50px
            window.dispatchEvent(new MouseEvent('mousemove', { 
                clientY: 50 
            }));
            
            // sensitivity = 200/200 = 1, so 50px should give 50 value increase
            expect(knob.value).toBe(100);
        });

        it('does not call onChange if value unchanged', () => {
            const onChange = vi.fn();
            const knob = new Knob('Test', 50, 0, 100, onChange);
            container.appendChild(knob.element);
            
            // Start drag
            knob.canvas.dispatchEvent(new MouseEvent('mousedown', { 
                clientY: 100,
                bubbles: true 
            }));
            
            // Move to same position
            window.dispatchEvent(new MouseEvent('mousemove', { 
                clientY: 100 
            }));
            
            expect(onChange).not.toHaveBeenCalled();
        });
    });

    describe('edge cases', () => {
        it('handles zero range gracefully', () => {
            const knob = new Knob('Test', 50, 50, 50, vi.fn());
            expect(knob.value).toBe(50);
        });

        it('handles negative range', () => {
            const knob = new Knob('Temperature', -10, -50, 50, vi.fn());
            expect(knob.value).toBe(-10);
            expect(knob.min).toBe(-50);
            expect(knob.max).toBe(50);
        });

        it('works with decimal values', () => {
            const onChange = vi.fn();
            const knob = new Knob('Opacity', 0.5, 0, 1, onChange);
            expect(knob.value).toBe(0.5);
        });

        it('renders knob when value changes during drag', () => {
            const knob = new Knob('Test', 50, 0, 100, vi.fn());
            container.appendChild(knob.element);
            
            vi.clearAllMocks();
            
            // Start drag
            knob.canvas.dispatchEvent(new MouseEvent('mousedown', { 
                clientY: 100,
                bubbles: true 
            }));
            
            // Move
            window.dispatchEvent(new MouseEvent('mousemove', { 
                clientY: 50 
            }));
            
            expect(mockCtx.clearRect).toHaveBeenCalled();
        });
    });
});
