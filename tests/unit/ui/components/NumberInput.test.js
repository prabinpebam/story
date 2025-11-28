import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Store before importing NumberInput
vi.mock('../../../../src/core/Store.js', () => ({
    store: {
        dispatch: vi.fn()
    }
}));

import { NumberInput } from '../../../../src/ui/components/NumberInput.js';
import { store } from '../../../../src/core/Store.js';

describe('NumberInput', () => {
    let numberInput;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        vi.restoreAllMocks();
        document.body.innerHTML = '';
    });

    describe('constructor', () => {
        it('should create an instance with default options', () => {
            numberInput = new NumberInput();
            expect(numberInput).toBeDefined();
            expect(numberInput.value).toBe(0);
        });

        it('should accept custom value', () => {
            numberInput = new NumberInput({ value: 50 });
            expect(numberInput.value).toBe(50);
        });

        it('should accept min and max options', () => {
            numberInput = new NumberInput({ min: 0, max: 100 });
            expect(numberInput.options.min).toBe(0);
            expect(numberInput.options.max).toBe(100);
        });

        it('should accept step option', () => {
            numberInput = new NumberInput({ step: 5 });
            expect(numberInput.options.step).toBe(5);
        });

        it('should accept precision option', () => {
            numberInput = new NumberInput({ precision: 3 });
            expect(numberInput.options.precision).toBe(3);
        });

        it('should accept units option', () => {
            numberInput = new NumberInput({ units: 'px' });
            expect(numberInput.options.units).toBe('px');
        });

        it('should accept onChange callback', () => {
            const onChange = vi.fn();
            numberInput = new NumberInput({ onChange });
            expect(numberInput.options.onChange).toBe(onChange);
        });
    });

    describe('create()', () => {
        it('should create a container element', () => {
            numberInput = new NumberInput();
            expect(numberInput.element).toBeDefined();
            expect(numberInput.element.className).toBe('pi-input-group');
        });

        it('should create an input element', () => {
            numberInput = new NumberInput();
            expect(numberInput.input).toBeDefined();
            expect(numberInput.input.tagName).toBe('INPUT');
            expect(numberInput.input.type).toBe('text');
        });

        it('should add label when provided', () => {
            numberInput = new NumberInput({ label: 'Width' });
            const label = numberInput.element.querySelector('.pi-label');
            expect(label).toBeDefined();
            expect(label.innerHTML).toBe('Width');
        });

        it('should not add label when not provided', () => {
            numberInput = new NumberInput();
            const label = numberInput.element.querySelector('.pi-label');
            expect(label).toBeNull();
        });

        it('should set cursor to ew-resize when scrubbable', () => {
            numberInput = new NumberInput({ scrubbable: true });
            expect(numberInput.input.style.cursor).toBe('ew-resize');
        });

        it('should display value with units', () => {
            numberInput = new NumberInput({ value: 100, units: 'px' });
            expect(numberInput.input.value).toBe('100px');
        });
    });

    describe('setValue()', () => {
        it('should update value', () => {
            numberInput = new NumberInput({ value: 0 });
            numberInput.setValue(50);
            expect(numberInput.value).toBe(50);
        });

        it('should update input display', () => {
            numberInput = new NumberInput({ value: 0 });
            numberInput.setValue(75);
            expect(numberInput.input.value).toBe('75');
        });

        it('should clamp to min value', () => {
            numberInput = new NumberInput({ min: 0 });
            numberInput.setValue(-10);
            expect(numberInput.value).toBe(0);
        });

        it('should clamp to max value', () => {
            numberInput = new NumberInput({ max: 100 });
            numberInput.setValue(150);
            expect(numberInput.value).toBe(100);
        });

        it('should round to precision', () => {
            numberInput = new NumberInput({ precision: 2 });
            numberInput.setValue(1.2345);
            expect(numberInput.value).toBe(1.23);
        });

        it('should call onChange callback', () => {
            const onChange = vi.fn();
            numberInput = new NumberInput({ onChange });
            numberInput.setValue(50);
            expect(onChange).toHaveBeenCalledWith(50, false);
        });

        it('should pass isTransient flag to onChange', () => {
            const onChange = vi.fn();
            numberInput = new NumberInput({ onChange });
            numberInput.setValue(50, true, true);
            expect(onChange).toHaveBeenCalledWith(50, true);
        });

        it('should not call onChange when notify is false', () => {
            const onChange = vi.fn();
            numberInput = new NumberInput({ onChange });
            numberInput.setValue(50, false);
            expect(onChange).not.toHaveBeenCalled();
        });

        it('should handle NaN input', () => {
            numberInput = new NumberInput({ value: 10 });
            numberInput.setValue('abc');
            expect(numberInput.value).toBe(0);
        });
    });

    describe('formatValue()', () => {
        it('should format value without units', () => {
            numberInput = new NumberInput();
            expect(numberInput.formatValue(50)).toBe('50');
        });

        it('should format value with units', () => {
            numberInput = new NumberInput({ units: '%' });
            expect(numberInput.formatValue(50)).toBe('50%');
        });

        it('should format value with px units', () => {
            numberInput = new NumberInput({ units: 'px' });
            expect(numberInput.formatValue(100)).toBe('100px');
        });
    });

    describe('parseValue()', () => {
        it('should parse numeric string', () => {
            numberInput = new NumberInput();
            expect(numberInput.parseValue('50')).toBe(50);
        });

        it('should parse value with units', () => {
            numberInput = new NumberInput({ units: 'px' });
            expect(numberInput.parseValue('100px')).toBe(100);
        });

        it('should parse decimal values', () => {
            numberInput = new NumberInput();
            expect(numberInput.parseValue('3.14')).toBe(3.14);
        });

        it('should return NaN for invalid input', () => {
            numberInput = new NumberInput();
            expect(numberInput.parseValue('abc')).toBeNaN();
        });
    });

    describe('handleInputChange()', () => {
        it('should update value from input', () => {
            numberInput = new NumberInput();
            numberInput.input.value = '75';
            numberInput.handleInputChange({ target: numberInput.input });
            expect(numberInput.value).toBe(75);
        });

        it('should handle units in input', () => {
            numberInput = new NumberInput({ units: 'px' });
            numberInput.input.value = '200px';
            numberInput.handleInputChange({ target: numberInput.input });
            expect(numberInput.value).toBe(200);
        });
    });

    describe('handleBlur()', () => {
        it('should format value on blur', () => {
            numberInput = new NumberInput({ units: 'px' });
            numberInput.value = 50;
            numberInput.input.value = '50';
            numberInput.handleBlur();
            expect(numberInput.input.value).toBe('50px');
        });
    });

    describe('handleKeyDown()', () => {
        it('should increment value on ArrowUp', () => {
            const onChange = vi.fn();
            numberInput = new NumberInput({ value: 10, step: 1, onChange });
            const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
            event.preventDefault = vi.fn();
            event.stopPropagation = vi.fn();
            
            numberInput.handleKeyDown(event);
            
            expect(numberInput.value).toBe(11);
        });

        it('should decrement value on ArrowDown', () => {
            const onChange = vi.fn();
            numberInput = new NumberInput({ value: 10, step: 1, onChange });
            const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
            event.preventDefault = vi.fn();
            event.stopPropagation = vi.fn();
            
            numberInput.handleKeyDown(event);
            
            expect(numberInput.value).toBe(9);
        });

        it('should use 10x step with Shift+Arrow', () => {
            const onChange = vi.fn();
            numberInput = new NumberInput({ value: 10, step: 1, onChange });
            const event = new KeyboardEvent('keydown', { key: 'ArrowUp', shiftKey: true });
            event.preventDefault = vi.fn();
            event.stopPropagation = vi.fn();
            
            numberInput.handleKeyDown(event);
            
            expect(numberInput.value).toBe(20);
        });

        it('should blur on Enter', () => {
            numberInput = new NumberInput();
            numberInput.input.blur = vi.fn();
            const event = new KeyboardEvent('keydown', { key: 'Enter' });
            event.stopPropagation = vi.fn();
            
            numberInput.handleKeyDown(event);
            
            expect(numberInput.input.blur).toHaveBeenCalled();
        });

        it('should revert to initial value on Escape', () => {
            numberInput = new NumberInput({ value: 10 });
            numberInput.initialValue = 10;
            numberInput.value = 50;
            numberInput.input.blur = vi.fn();
            const event = new KeyboardEvent('keydown', { key: 'Escape' });
            event.stopPropagation = vi.fn();
            
            numberInput.handleKeyDown(event);
            
            expect(numberInput.value).toBe(10);
            expect(numberInput.input.blur).toHaveBeenCalled();
        });
    });

    describe('handleScrubMove()', () => {
        it('should not update when not scrubbing', () => {
            numberInput = new NumberInput({ value: 10 });
            numberInput.isScrubbing = false;
            
            numberInput.handleScrubMove({ movementX: 10 });
            
            expect(numberInput.value).toBe(10);
        });

        it('should update value based on movementX', () => {
            const onChange = vi.fn();
            numberInput = new NumberInput({ value: 10, step: 1, onChange });
            numberInput.isScrubbing = true;
            
            numberInput.handleScrubMove({ movementX: 5, shiftKey: false, altKey: false });
            
            expect(numberInput.value).toBe(15);
        });

        it('should use 10x step with shiftKey', () => {
            const onChange = vi.fn();
            numberInput = new NumberInput({ value: 10, step: 1, onChange });
            numberInput.isScrubbing = true;
            
            numberInput.handleScrubMove({ movementX: 2, shiftKey: true, altKey: false });
            
            expect(numberInput.value).toBe(30);
        });

        it('should use 0.1x step with altKey', () => {
            const onChange = vi.fn();
            numberInput = new NumberInput({ value: 10, step: 1, onChange });
            numberInput.isScrubbing = true;
            
            numberInput.handleScrubMove({ movementX: 10, shiftKey: false, altKey: true });
            
            expect(numberInput.value).toBe(11);
        });

        it('should call onChange with isTransient true', () => {
            const onChange = vi.fn();
            numberInput = new NumberInput({ value: 10, step: 1, onChange });
            numberInput.isScrubbing = true;
            
            numberInput.handleScrubMove({ movementX: 5, shiftKey: false, altKey: false });
            
            expect(onChange).toHaveBeenCalledWith(15, true);
        });
    });

    describe('setDisabled()', () => {
        it('should disable the input', () => {
            numberInput = new NumberInput();
            numberInput.setDisabled(true);
            
            expect(numberInput.input.disabled).toBe(true);
            expect(numberInput.element.style.opacity).toBe('0.5');
            expect(numberInput.element.style.pointerEvents).toBe('none');
        });

        it('should enable the input', () => {
            numberInput = new NumberInput();
            numberInput.setDisabled(true);
            numberInput.setDisabled(false);
            
            expect(numberInput.input.disabled).toBe(false);
            expect(numberInput.element.style.opacity).toBe('1');
            expect(numberInput.element.style.pointerEvents).toBe('auto');
        });
    });

    describe('edge cases', () => {
        it('should handle zero value', () => {
            numberInput = new NumberInput({ value: 0 });
            expect(numberInput.value).toBe(0);
            expect(numberInput.input.value).toBe('0');
        });

        it('should handle negative values', () => {
            numberInput = new NumberInput({ value: -50 });
            expect(numberInput.value).toBe(-50);
        });

        it('should handle decimal step', () => {
            numberInput = new NumberInput({ value: 0, step: 0.1, precision: 1 });
            numberInput.setValue(0.5);
            expect(numberInput.value).toBe(0.5);
        });

        it('should handle very large values', () => {
            numberInput = new NumberInput({ value: 999999 });
            expect(numberInput.value).toBe(999999);
        });
    });
});
