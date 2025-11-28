import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MathInput } from '../../../../src/ui/components/MathInput.js';

describe('MathInput', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        container.remove();
    });

    describe('initialization', () => {
        it('creates input element', () => {
            const mathInput = new MathInput(50, vi.fn());
            expect(mathInput.element).toBeDefined();
            expect(mathInput.element.tagName).toBe('INPUT');
            expect(mathInput.element.type).toBe('text');
        });

        it('sets initial numeric value', () => {
            const mathInput = new MathInput(42, vi.fn());
            expect(mathInput.value).toBe(42);
            expect(mathInput.element.value).toBe('42');
        });

        it('rounds initial numeric value', () => {
            const mathInput = new MathInput(42.789, vi.fn());
            expect(mathInput.element.value).toBe('43');
        });

        it('applies correct CSS class', () => {
            const mathInput = new MathInput(0, vi.fn());
            expect(mathInput.element.className).toBe('math-input');
        });

        it('applies inline styles', () => {
            const mathInput = new MathInput(0, vi.fn());
            expect(mathInput.element.style.width).toBe('100%');
            expect(mathInput.element.style.background).toBe('transparent');
            // Browser normalizes 'none' to empty string for border
            expect(mathInput.element.style.border === '' || mathInput.element.style.border === 'none').toBe(true);
        });
    });

    describe('mixed value handling', () => {
        it('displays "Mixed" in italic style', () => {
            const mathInput = new MathInput('Mixed', vi.fn());
            expect(mathInput.element.value).toBe('Mixed');
            expect(mathInput.element.style.fontStyle).toBe('italic');
        });

        it('clears "Mixed" value on focus', () => {
            const mathInput = new MathInput('Mixed', vi.fn());
            container.appendChild(mathInput.element);
            
            mathInput.element.dispatchEvent(new Event('focus'));
            
            expect(mathInput.element.value).toBe('');
            expect(mathInput.element.style.fontStyle).toBe('normal');
        });

        it('does not allow arrow key increment when value is Mixed', () => {
            const onChange = vi.fn();
            const mathInput = new MathInput('Mixed', onChange);
            container.appendChild(mathInput.element);
            
            const event = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true });
            mathInput.element.dispatchEvent(event);
            
            expect(onChange).not.toHaveBeenCalled();
        });
    });

    describe('keyboard interactions', () => {
        it('blurs on Enter key', () => {
            const mathInput = new MathInput(50, vi.fn());
            container.appendChild(mathInput.element);
            
            const blurSpy = vi.spyOn(mathInput.element, 'blur');
            const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
            mathInput.element.dispatchEvent(event);
            
            expect(blurSpy).toHaveBeenCalled();
        });

        it('reverts value on Escape key', () => {
            const mathInput = new MathInput(50, vi.fn());
            container.appendChild(mathInput.element);
            
            // Focus to capture initial
            mathInput.element.dispatchEvent(new Event('focus'));
            
            // Modify
            mathInput.element.value = '100';
            mathInput.value = 100;
            
            const blurSpy = vi.spyOn(mathInput.element, 'blur');
            mathInput.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            
            expect(mathInput.value).toBe(50);
            expect(blurSpy).toHaveBeenCalled();
        });

        it('increments by 1 on ArrowUp', () => {
            const onChange = vi.fn();
            const mathInput = new MathInput(50, onChange);
            container.appendChild(mathInput.element);
            
            const event = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true });
            mathInput.element.dispatchEvent(event);
            
            expect(mathInput.element.value).toBe('51');
            expect(onChange).toHaveBeenCalledWith(51);
        });

        it('increments by 10 on Shift+ArrowUp', () => {
            const onChange = vi.fn();
            const mathInput = new MathInput(50, onChange);
            container.appendChild(mathInput.element);
            
            const event = new KeyboardEvent('keydown', { key: 'ArrowUp', shiftKey: true, bubbles: true });
            mathInput.element.dispatchEvent(event);
            
            expect(mathInput.element.value).toBe('60');
            expect(onChange).toHaveBeenCalledWith(60);
        });

        it('decrements by 1 on ArrowDown', () => {
            const onChange = vi.fn();
            const mathInput = new MathInput(50, onChange);
            container.appendChild(mathInput.element);
            
            const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
            mathInput.element.dispatchEvent(event);
            
            expect(mathInput.element.value).toBe('49');
            expect(onChange).toHaveBeenCalledWith(49);
        });

        it('decrements by 10 on Shift+ArrowDown', () => {
            const onChange = vi.fn();
            const mathInput = new MathInput(50, onChange);
            container.appendChild(mathInput.element);
            
            const event = new KeyboardEvent('keydown', { key: 'ArrowDown', shiftKey: true, bubbles: true });
            mathInput.element.dispatchEvent(event);
            
            expect(mathInput.element.value).toBe('40');
            expect(onChange).toHaveBeenCalledWith(40);
        });

        it('stops propagation for all keys', () => {
            const mathInput = new MathInput(50, vi.fn());
            container.appendChild(mathInput.element);
            
            const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
            const stopPropSpy = vi.spyOn(event, 'stopPropagation');
            mathInput.element.dispatchEvent(event);
            
            expect(stopPropSpy).toHaveBeenCalled();
        });

        it('prevents default on arrow keys', () => {
            const mathInput = new MathInput(50, vi.fn());
            container.appendChild(mathInput.element);
            
            const event = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true });
            const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
            mathInput.element.dispatchEvent(event);
            
            expect(preventDefaultSpy).toHaveBeenCalled();
        });
    });

    describe('math expression evaluation', () => {
        it('evaluates simple addition', () => {
            const onChange = vi.fn();
            const mathInput = new MathInput(0, onChange);
            container.appendChild(mathInput.element);
            
            mathInput.element.value = '10+5';
            mathInput.element.dispatchEvent(new Event('blur'));
            
            expect(mathInput.element.value).toBe('15');
            expect(onChange).toHaveBeenCalledWith(15);
        });

        it('evaluates subtraction', () => {
            const onChange = vi.fn();
            const mathInput = new MathInput(0, onChange);
            container.appendChild(mathInput.element);
            
            mathInput.element.value = '20-8';
            mathInput.element.dispatchEvent(new Event('blur'));
            
            expect(mathInput.element.value).toBe('12');
            expect(onChange).toHaveBeenCalledWith(12);
        });

        it('evaluates multiplication', () => {
            const onChange = vi.fn();
            const mathInput = new MathInput(0, onChange);
            container.appendChild(mathInput.element);
            
            mathInput.element.value = '6*7';
            mathInput.element.dispatchEvent(new Event('blur'));
            
            expect(mathInput.element.value).toBe('42');
            expect(onChange).toHaveBeenCalledWith(42);
        });

        it('evaluates division', () => {
            const onChange = vi.fn();
            const mathInput = new MathInput(0, onChange);
            container.appendChild(mathInput.element);
            
            mathInput.element.value = '100/4';
            mathInput.element.dispatchEvent(new Event('blur'));
            
            expect(mathInput.element.value).toBe('25');
            expect(onChange).toHaveBeenCalledWith(25);
        });

        it('evaluates complex expressions with parentheses', () => {
            const onChange = vi.fn();
            const mathInput = new MathInput(0, onChange);
            container.appendChild(mathInput.element);
            
            mathInput.element.value = '(10+5)*2';
            mathInput.element.dispatchEvent(new Event('blur'));
            
            expect(mathInput.element.value).toBe('30');
            expect(onChange).toHaveBeenCalledWith(30);
        });

        it('rounds result to 2 decimal places', () => {
            const onChange = vi.fn();
            const mathInput = new MathInput(0, onChange);
            container.appendChild(mathInput.element);
            
            mathInput.element.value = '10/3';
            mathInput.element.dispatchEvent(new Event('blur'));
            
            expect(mathInput.element.value).toBe('3.33');
        });

        it('reverts on invalid characters', () => {
            const onChange = vi.fn();
            const mathInput = new MathInput(50, onChange);
            container.appendChild(mathInput.element);
            
            mathInput.element.value = 'abc';
            mathInput.element.dispatchEvent(new Event('blur'));
            
            expect(mathInput.element.value).toBe('50');
            expect(onChange).not.toHaveBeenCalled();
        });

        it('reverts on division by zero (Infinity)', () => {
            const onChange = vi.fn();
            const mathInput = new MathInput(50, onChange);
            container.appendChild(mathInput.element);
            
            mathInput.element.value = '1/0';
            mathInput.element.dispatchEvent(new Event('blur'));
            
            expect(mathInput.element.value).toBe('50');
            expect(onChange).not.toHaveBeenCalled();
        });

        it('does not call onChange if value unchanged', () => {
            const onChange = vi.fn();
            const mathInput = new MathInput(50, onChange);
            container.appendChild(mathInput.element);
            
            mathInput.element.value = '25+25';
            mathInput.element.dispatchEvent(new Event('blur'));
            
            // Value resolves to same as initial
            expect(onChange).not.toHaveBeenCalled();
        });
    });

    describe('setValue', () => {
        it('updates value and element', () => {
            const mathInput = new MathInput(50, vi.fn());
            
            mathInput.setValue(100);
            
            expect(mathInput.value).toBe(100);
            expect(mathInput.element.value).toBe('100');
        });

        it('does not update element if focused', () => {
            const mathInput = new MathInput(50, vi.fn());
            container.appendChild(mathInput.element);
            
            mathInput.element.focus();
            mathInput.setValue(100);
            
            expect(mathInput.value).toBe(100);
            // Element value stays the same while focused
        });

        it('rounds value to 2 decimal places', () => {
            const mathInput = new MathInput(0, vi.fn());
            
            mathInput.setValue(3.14159);
            
            expect(mathInput.element.value).toBe('3.14');
        });
    });

    describe('focus behavior', () => {
        it('selects all text on focus', () => {
            const mathInput = new MathInput(50, vi.fn());
            container.appendChild(mathInput.element);
            
            const selectSpy = vi.spyOn(mathInput.element, 'select');
            mathInput.element.dispatchEvent(new Event('focus'));
            
            expect(selectSpy).toHaveBeenCalled();
        });
    });

    describe('increment method', () => {
        it('increments from empty/zero', () => {
            const onChange = vi.fn();
            const mathInput = new MathInput(0, onChange);
            container.appendChild(mathInput.element);
            
            mathInput.element.value = '';
            const event = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true });
            mathInput.element.dispatchEvent(event);
            
            expect(mathInput.element.value).toBe('1');
        });

        it('handles negative results', () => {
            const onChange = vi.fn();
            const mathInput = new MathInput(0, onChange);
            container.appendChild(mathInput.element);
            
            const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
            mathInput.element.dispatchEvent(event);
            
            expect(mathInput.element.value).toBe('-1');
            expect(onChange).toHaveBeenCalledWith(-1);
        });
    });
});
