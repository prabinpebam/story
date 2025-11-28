import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock dependencies
vi.mock('../../../../src/core/Store.js', () => ({
    store: {
        dispatch: vi.fn(),
        getState: vi.fn(() => ({})),
        on: vi.fn(),
        off: vi.fn()
    }
}));

vi.mock('../../../../src/ui/components/MathInput.js', () => ({
    MathInput: vi.fn().mockImplementation((value, onChange) => {
        const element = document.createElement('input');
        element.type = 'text';
        element.value = String(value);
        element.className = 'math-input';
        return {
            element,
            value,
            onChange,
            setValue: vi.fn((val) => {
                element.value = String(val);
            })
        };
    })
}));

import { ScrubbableControl } from '../../../../src/ui/components/ScrubbableControl.js';
import { store } from '../../../../src/core/Store.js';

describe('ScrubbableControl', () => {
    let container;

    beforeEach(() => {
        vi.clearAllMocks();
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        container.remove();
        document.body.style.cursor = '';
    });

    describe('initialization', () => {
        it('creates container element', () => {
            const control = new ScrubbableControl('Width', 100, vi.fn());
            expect(control.element).toBeDefined();
            expect(control.element.tagName).toBe('DIV');
        });

        it('stores constructor parameters', () => {
            const onChange = vi.fn();
            const control = new ScrubbableControl('Height', 200, onChange);
            
            expect(control.label).toBe('Height');
            expect(control.value).toBe(200);
            expect(control.onChange).toBe(onChange);
        });

        it('uses default options', () => {
            const control = new ScrubbableControl('X', 50, vi.fn());
            
            expect(control.options.min).toBe(-Infinity);
            expect(control.options.max).toBe(Infinity);
            expect(control.options.step).toBe(1);
        });

        it('accepts custom options', () => {
            const control = new ScrubbableControl('Opacity', 0.5, vi.fn(), {
                min: 0,
                max: 1,
                step: 0.1
            });
            
            expect(control.options.min).toBe(0);
            expect(control.options.max).toBe(1);
            expect(control.options.step).toBe(0.1);
        });

        it('creates label element', () => {
            const control = new ScrubbableControl('Rotation', 45, vi.fn());
            expect(control.labelEl).toBeDefined();
            expect(control.labelEl.innerText).toBe('Rotation');
        });

        it('creates MathInput', () => {
            const control = new ScrubbableControl('Scale', 1, vi.fn());
            expect(control.input).toBeDefined();
            expect(control.input.element).toBeDefined();
        });

        it('applies flexbox layout', () => {
            const control = new ScrubbableControl('Test', 0, vi.fn());
            expect(control.element.style.display).toBe('flex');
            expect(control.element.style.alignItems).toBe('center');
        });

        it('initializes dragging state to false', () => {
            const control = new ScrubbableControl('Test', 0, vi.fn());
            expect(control.isDragging).toBe(false);
        });
    });

    describe('label element', () => {
        it('sets cursor to ew-resize', () => {
            const control = new ScrubbableControl('Test', 0, vi.fn());
            expect(control.labelEl.style.cursor).toBe('ew-resize');
        });

        it('sets user-select to none', () => {
            const control = new ScrubbableControl('Test', 0, vi.fn());
            expect(control.labelEl.style.userSelect).toBe('none');
        });

        it('has minimum width for hit area', () => {
            const control = new ScrubbableControl('Test', 0, vi.fn());
            expect(control.labelEl.style.minWidth).toBe('16px');
        });
    });

    describe('drag interaction', () => {
        it('starts dragging on label mousedown', () => {
            const control = new ScrubbableControl('X', 100, vi.fn());
            container.appendChild(control.element);
            
            control.labelEl.dispatchEvent(new MouseEvent('mousedown', {
                clientX: 50,
                bubbles: true
            }));
            
            expect(control.isDragging).toBe(true);
            expect(control.startX).toBe(50);
            expect(control.startValue).toBe(100);
        });

        it('dispatches UI_INTERACTION_START on drag start', () => {
            const control = new ScrubbableControl('X', 100, vi.fn());
            container.appendChild(control.element);
            
            control.labelEl.dispatchEvent(new MouseEvent('mousedown', {
                clientX: 50,
                bubbles: true
            }));
            
            expect(store.dispatch).toHaveBeenCalledWith('UI_INTERACTION_START');
        });

        it('sets cursor to ew-resize on drag start', () => {
            const control = new ScrubbableControl('X', 100, vi.fn());
            container.appendChild(control.element);
            
            control.labelEl.dispatchEvent(new MouseEvent('mousedown', {
                clientX: 50,
                bubbles: true
            }));
            
            expect(document.body.style.cursor).toBe('ew-resize');
        });

        it('updates value on drag move', () => {
            const onChange = vi.fn();
            const control = new ScrubbableControl('X', 100, onChange);
            container.appendChild(control.element);
            
            // Start drag
            control.labelEl.dispatchEvent(new MouseEvent('mousedown', {
                clientX: 50,
                bubbles: true
            }));
            
            // Drag right
            window.dispatchEvent(new MouseEvent('mousemove', {
                clientX: 100
            }));
            
            expect(control.value).toBe(150); // 100 + (100-50)*1
            expect(onChange).toHaveBeenCalledWith(150);
        });

        it('uses step option for sensitivity', () => {
            const onChange = vi.fn();
            const control = new ScrubbableControl('X', 100, onChange, { step: 0.5 });
            container.appendChild(control.element);
            
            // Start drag
            control.labelEl.dispatchEvent(new MouseEvent('mousedown', {
                clientX: 50,
                bubbles: true
            }));
            
            // Drag right 10px
            window.dispatchEvent(new MouseEvent('mousemove', {
                clientX: 60
            }));
            
            expect(control.value).toBe(105); // 100 + 10*0.5
        });

        it('uses 10x step with shift key', () => {
            const onChange = vi.fn();
            const control = new ScrubbableControl('X', 100, onChange, { step: 1 });
            container.appendChild(control.element);
            
            // Start drag
            control.labelEl.dispatchEvent(new MouseEvent('mousedown', {
                clientX: 50,
                bubbles: true
            }));
            
            // Drag right 10px with shift
            window.dispatchEvent(new MouseEvent('mousemove', {
                clientX: 60,
                shiftKey: true
            }));
            
            expect(control.value).toBe(200); // 100 + 10*10
        });

        it('clamps to min value', () => {
            const onChange = vi.fn();
            const control = new ScrubbableControl('X', 50, onChange, { min: 0 });
            container.appendChild(control.element);
            
            // Start drag
            control.labelEl.dispatchEvent(new MouseEvent('mousedown', {
                clientX: 100,
                bubbles: true
            }));
            
            // Drag left a lot
            window.dispatchEvent(new MouseEvent('mousemove', {
                clientX: 0
            }));
            
            expect(control.value).toBe(0);
        });

        it('clamps to max value', () => {
            const onChange = vi.fn();
            const control = new ScrubbableControl('X', 50, onChange, { max: 100 });
            container.appendChild(control.element);
            
            // Start drag
            control.labelEl.dispatchEvent(new MouseEvent('mousedown', {
                clientX: 0,
                bubbles: true
            }));
            
            // Drag right a lot
            window.dispatchEvent(new MouseEvent('mousemove', {
                clientX: 200
            }));
            
            expect(control.value).toBe(100);
        });

        it('stops dragging on mouseup', () => {
            const control = new ScrubbableControl('X', 100, vi.fn());
            container.appendChild(control.element);
            
            // Start drag
            control.labelEl.dispatchEvent(new MouseEvent('mousedown', {
                clientX: 50,
                bubbles: true
            }));
            
            expect(control.isDragging).toBe(true);
            
            // End drag
            window.dispatchEvent(new MouseEvent('mouseup'));
            
            expect(control.isDragging).toBe(false);
        });

        it('dispatches UI_INTERACTION_END on drag end', () => {
            const control = new ScrubbableControl('X', 100, vi.fn());
            container.appendChild(control.element);
            
            // Start drag
            control.labelEl.dispatchEvent(new MouseEvent('mousedown', {
                clientX: 50,
                bubbles: true
            }));
            
            vi.clearAllMocks();
            
            // End drag
            window.dispatchEvent(new MouseEvent('mouseup'));
            
            expect(store.dispatch).toHaveBeenCalledWith('UI_INTERACTION_END');
        });

        it('resets cursor on drag end', () => {
            const control = new ScrubbableControl('X', 100, vi.fn());
            container.appendChild(control.element);
            
            // Start drag
            control.labelEl.dispatchEvent(new MouseEvent('mousedown', {
                clientX: 50,
                bubbles: true
            }));
            
            // End drag
            window.dispatchEvent(new MouseEvent('mouseup'));
            
            expect(document.body.style.cursor).toBe('default');
        });

        it('ignores mousemove when not dragging', () => {
            const onChange = vi.fn();
            const control = new ScrubbableControl('X', 100, onChange);
            container.appendChild(control.element);
            
            // Move without dragging
            control.handleDragMove({ clientX: 200 });
            
            expect(control.value).toBe(100);
            expect(onChange).not.toHaveBeenCalled();
        });
    });

    describe('updateValue', () => {
        it('updates internal value', () => {
            const control = new ScrubbableControl('X', 100, vi.fn());
            
            control.updateValue(200);
            
            expect(control.value).toBe(200);
        });

        it('updates MathInput', () => {
            const control = new ScrubbableControl('X', 100, vi.fn());
            
            control.updateValue(200);
            
            expect(control.input.setValue).toHaveBeenCalledWith(200);
        });

        it('calls onChange callback', () => {
            const onChange = vi.fn();
            const control = new ScrubbableControl('X', 100, onChange);
            
            control.updateValue(200);
            
            expect(onChange).toHaveBeenCalledWith(200);
        });
    });

    describe('MathInput integration', () => {
        it('MathInput onChange updates control value', () => {
            const onChange = vi.fn();
            const control = new ScrubbableControl('X', 100, onChange);
            
            // Simulate MathInput calling back
            control.input.onChange(150);
            
            expect(control.value).toBe(150);
            expect(onChange).toHaveBeenCalledWith(150);
        });
    });

    describe('edge cases', () => {
        it('handles zero step', () => {
            const control = new ScrubbableControl('X', 100, vi.fn(), { step: 0 });
            expect(control.options.step).toBe(0);
        });

        it('handles negative values', () => {
            const onChange = vi.fn();
            const control = new ScrubbableControl('X', 0, onChange, { min: -100 });
            container.appendChild(control.element);
            
            // Start drag
            control.labelEl.dispatchEvent(new MouseEvent('mousedown', {
                clientX: 100,
                bubbles: true
            }));
            
            // Drag left
            window.dispatchEvent(new MouseEvent('mousemove', {
                clientX: 50
            }));
            
            expect(control.value).toBe(-50);
        });

        it('handles decimal values', () => {
            const onChange = vi.fn();
            const control = new ScrubbableControl('Opacity', 0.5, onChange, {
                min: 0,
                max: 1,
                step: 0.01
            });
            container.appendChild(control.element);
            
            // Start drag
            control.labelEl.dispatchEvent(new MouseEvent('mousedown', {
                clientX: 50,
                bubbles: true
            }));
            
            // Drag right 10px = +0.1
            window.dispatchEvent(new MouseEvent('mousemove', {
                clientX: 60
            }));
            
            expect(control.value).toBeCloseTo(0.6, 2);
        });
    });
});
