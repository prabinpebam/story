import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { ColorInput } from '../../../../src/ui/components/ColorInput.js';

describe('ColorInput', () => {
    let colorInput;
    let onChange;

    beforeEach(() => {
        vi.clearAllMocks();
        onChange = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        document.body.innerHTML = '';
    });

    describe('constructor', () => {
        it('should create an instance with default value', () => {
            colorInput = new ColorInput(null, onChange);
            expect(colorInput.value).toBe('#000000');
        });

        it('should accept custom value', () => {
            colorInput = new ColorInput('#FF0000', onChange);
            expect(colorInput.value).toBe('#FF0000');
        });

        it('should store onChange callback', () => {
            colorInput = new ColorInput('#000000', onChange);
            expect(colorInput.onChange).toBe(onChange);
        });

        it('should use default options', () => {
            colorInput = new ColorInput('#000000', onChange);
            expect(colorInput.options.width).toBe('100%');
            expect(colorInput.options.showHex).toBe(true);
            expect(colorInput.options.compact).toBe(false);
        });

        it('should accept custom options', () => {
            colorInput = new ColorInput('#000000', onChange, { width: '200px', showHex: false });
            expect(colorInput.options.width).toBe('200px');
            expect(colorInput.options.showHex).toBe(false);
        });

        it('should accept compact option', () => {
            colorInput = new ColorInput('#000000', onChange, { compact: true });
            expect(colorInput.options.compact).toBe(true);
        });
    });

    describe('create()', () => {
        it('should create a container element', () => {
            colorInput = new ColorInput('#000000', onChange);
            expect(colorInput.element).toBeDefined();
            expect(colorInput.element.className).toBe('color-input-container');
        });

        it('should create a swatch element', () => {
            colorInput = new ColorInput('#FF0000', onChange);
            expect(colorInput._swatch).toBeDefined();
            expect(colorInput._swatch.style.backgroundColor).toBe('rgb(255, 0, 0)');
        });

        it('should create a native color input', () => {
            colorInput = new ColorInput('#00FF00', onChange);
            expect(colorInput._nativeInput).toBeDefined();
            expect(colorInput._nativeInput.type).toBe('color');
            expect(colorInput._nativeInput.value).toBe('#00ff00');
        });

        it('should create hex input when showHex is true', () => {
            colorInput = new ColorInput('#0000FF', onChange, { showHex: true });
            expect(colorInput._hexInput).toBeDefined();
            expect(colorInput._hexInput.value).toBe('#0000FF');
        });

        it('should not create hex input when showHex is false', () => {
            colorInput = new ColorInput('#0000FF', onChange, { showHex: false });
            expect(colorInput._hexInput).toBeNull();
        });

        it('should not create hex input in compact mode', () => {
            colorInput = new ColorInput('#0000FF', onChange, { compact: true });
            expect(colorInput._hexInput).toBeNull();
        });

        it('should apply standard styling in non-compact mode', () => {
            colorInput = new ColorInput('#000000', onChange, { compact: false });
            expect(colorInput.element.classList.contains('color-input-container')).toBe(true);
            expect(colorInput.element.classList.contains('compact')).toBe(false);
        });

        it('should apply compact styling in compact mode', () => {
            colorInput = new ColorInput('#000000', onChange, { compact: true });
            expect(colorInput.element.classList.contains('color-input-container')).toBe(true);
            expect(colorInput.element.classList.contains('compact')).toBe(true);
        });

        it('should set swatch size based on compact mode', () => {
            colorInput = new ColorInput('#000000', onChange, { compact: false });
            expect(colorInput._swatch.classList.contains('color-input-swatch')).toBe(true);
            expect(colorInput._swatch.classList.contains('swatch-lg')).toBe(false);
            
            const compactInput = new ColorInput('#000000', onChange, { compact: true });
            expect(compactInput._swatch.classList.contains('swatch-lg')).toBe(true);
        });
    });

    describe('setValue()', () => {
        it('should update value', () => {
            colorInput = new ColorInput('#000000', onChange);
            colorInput.setValue('#FF5500');
            expect(colorInput.value).toBe('#FF5500');
        });

        it('should update swatch background color', () => {
            colorInput = new ColorInput('#000000', onChange);
            colorInput.setValue('#00FF00');
            expect(colorInput._swatch.style.backgroundColor).toBe('rgb(0, 255, 0)');
        });

        it('should update hex input value', () => {
            colorInput = new ColorInput('#000000', onChange, { showHex: true });
            colorInput.setValue('#abcdef');
            expect(colorInput._hexInput.value).toBe('#ABCDEF');
        });

        it('should update native input value', () => {
            colorInput = new ColorInput('#000000', onChange);
            colorInput.setValue('#123456');
            expect(colorInput._nativeInput.value).toBe('#123456');
        });

        it('should default to black for null value', () => {
            colorInput = new ColorInput('#FF0000', onChange);
            colorInput.setValue(null);
            expect(colorInput.value).toBe('#000000');
        });
    });

    describe('swatch click', () => {
        it('should open native color picker when swatch is clicked', () => {
            colorInput = new ColorInput('#000000', onChange);
            colorInput._nativeInput.click = vi.fn();
            
            colorInput._swatch.click();
            
            expect(colorInput._nativeInput.click).toHaveBeenCalled();
        });
    });

    describe('native input events', () => {
        it('should call onChange on input event with isTransient true', () => {
            colorInput = new ColorInput('#000000', onChange);
            
            colorInput._nativeInput.value = '#FF0000';
            colorInput._nativeInput.dispatchEvent(new Event('input'));
            
            // Browser normalizes to lowercase
            expect(onChange).toHaveBeenCalledWith('#ff0000', true);
        });

        it('should update swatch on input event', () => {
            colorInput = new ColorInput('#000000', onChange);
            
            colorInput._nativeInput.value = '#00FF00';
            colorInput._nativeInput.dispatchEvent(new Event('input'));
            
            expect(colorInput._swatch.style.backgroundColor).toBe('rgb(0, 255, 0)');
        });

        it('should update hex input on input event', () => {
            colorInput = new ColorInput('#000000', onChange, { showHex: true });
            
            colorInput._nativeInput.value = '#AABBCC';
            colorInput._nativeInput.dispatchEvent(new Event('input'));
            
            expect(colorInput._hexInput.value).toBe('#AABBCC');
        });

        it('should call onChange on change event with isTransient false', () => {
            colorInput = new ColorInput('#000000', onChange);
            
            colorInput._nativeInput.value = '#123456';
            colorInput._nativeInput.dispatchEvent(new Event('change'));
            
            expect(onChange).toHaveBeenCalledWith('#123456', false);
        });
    });

    describe('hex input events', () => {
        it('should update color on valid hex change', () => {
            colorInput = new ColorInput('#000000', onChange, { showHex: true });
            
            colorInput._hexInput.value = '#ABCDEF';
            colorInput._hexInput.dispatchEvent(new Event('change'));
            
            expect(onChange).toHaveBeenCalledWith('#ABCDEF');
            expect(colorInput._swatch.style.backgroundColor).toBe('rgb(171, 205, 239)');
        });

        it('should add # prefix if missing', () => {
            colorInput = new ColorInput('#000000', onChange, { showHex: true });
            
            colorInput._hexInput.value = 'FF0000';
            colorInput._hexInput.dispatchEvent(new Event('change'));
            
            expect(onChange).toHaveBeenCalledWith('#FF0000');
        });

        it('should revert invalid hex value', () => {
            colorInput = new ColorInput('#123456', onChange, { showHex: true });
            
            colorInput._hexInput.value = 'invalid';
            colorInput._hexInput.dispatchEvent(new Event('change'));
            
            expect(colorInput._hexInput.value).toBe('#123456');
        });
    });

    describe('hex input keydown events', () => {
        it('should blur on Enter key', () => {
            colorInput = new ColorInput('#000000', onChange, { showHex: true });
            colorInput._hexInput.blur = vi.fn();
            
            const event = new KeyboardEvent('keydown', { key: 'Enter' });
            event.stopPropagation = vi.fn();
            colorInput._hexInput.onkeydown(event);
            
            expect(colorInput._hexInput.blur).toHaveBeenCalled();
            expect(event.stopPropagation).toHaveBeenCalled();
        });

        it('should revert on Escape key', () => {
            colorInput = new ColorInput('#FF0000', onChange, { showHex: true });
            colorInput._hexInput.blur = vi.fn();
            
            // Focus to set initial value
            colorInput._hexInput.onfocus();
            
            // Change the display value
            colorInput._hexInput.value = '#00FF00';
            colorInput._swatch.style.backgroundColor = '#00FF00';
            
            const event = new KeyboardEvent('keydown', { key: 'Escape' });
            event.stopPropagation = vi.fn();
            colorInput._hexInput.onkeydown(event);
            
            expect(colorInput._hexInput.value).toBe('#FF0000');
            expect(onChange).toHaveBeenCalledWith('#FF0000');
            expect(colorInput._hexInput.blur).toHaveBeenCalled();
        });

        it('should stop propagation on all keydown events', () => {
            colorInput = new ColorInput('#000000', onChange, { showHex: true });
            
            const event = new KeyboardEvent('keydown', { key: 'a' });
            event.stopPropagation = vi.fn();
            colorInput._hexInput.onkeydown(event);
            
            expect(event.stopPropagation).toHaveBeenCalled();
        });
    });

    describe('edge cases', () => {
        it('should handle lowercase hex values', () => {
            colorInput = new ColorInput('#aabbcc', onChange, { showHex: true });
            expect(colorInput._hexInput.value).toBe('#AABBCC');
        });

        it('should handle mixed case hex values', () => {
            colorInput = new ColorInput('#AaBbCc', onChange, { showHex: true });
            expect(colorInput._hexInput.value).toBe('#AABBCC');
        });

        it('should handle 3-character hex rejection', () => {
            colorInput = new ColorInput('#000000', onChange, { showHex: true });
            
            colorInput._hexInput.value = '#FFF';
            colorInput._hexInput.dispatchEvent(new Event('change'));
            
            // Should revert because 3-char hex is not accepted
            expect(colorInput._hexInput.value).toBe('#000000');
        });
    });
});
