import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TextInput } from '../../../../src/ui/components/TextInput.js';

describe('TextInput', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        container.remove();
    });

    describe('initialization', () => {
        it('creates element with correct structure', () => {
            const textInput = new TextInput();
            expect(textInput.element).toBeDefined();
            expect(textInput.element.className).toBe('pi-input-group');
        });

        it('creates input element with correct class', () => {
            const textInput = new TextInput();
            const input = textInput.element.querySelector('input');
            expect(input).toBeDefined();
            expect(input.className).toBe('pi-input');
            expect(input.type).toBe('text');
        });

        it('uses default options when none provided', () => {
            const textInput = new TextInput();
            expect(textInput.value).toBe('');
            expect(textInput.input.placeholder).toBe('');
        });

        it('accepts initial value', () => {
            const textInput = new TextInput({ value: 'Hello World' });
            expect(textInput.value).toBe('Hello World');
            expect(textInput.input.value).toBe('Hello World');
        });

        it('accepts placeholder text', () => {
            const textInput = new TextInput({ placeholder: 'Enter text...' });
            expect(textInput.input.placeholder).toBe('Enter text...');
        });

        it('accepts onChange callback', () => {
            const onChange = vi.fn();
            const textInput = new TextInput({ onChange });
            expect(textInput.options.onChange).toBe(onChange);
        });
    });

    describe('value management', () => {
        it('updates value on change event', () => {
            const onChange = vi.fn();
            const textInput = new TextInput({ onChange });
            container.appendChild(textInput.element);

            textInput.input.value = 'New Value';
            textInput.input.dispatchEvent(new Event('change'));

            expect(textInput.value).toBe('New Value');
            expect(onChange).toHaveBeenCalledWith('New Value');
        });

        it('setValue updates both internal value and input', () => {
            const textInput = new TextInput({ value: 'Initial' });
            
            textInput.setValue('Updated');
            
            expect(textInput.value).toBe('Updated');
            expect(textInput.input.value).toBe('Updated');
        });

        it('setValue works with empty string', () => {
            const textInput = new TextInput({ value: 'Some text' });
            
            textInput.setValue('');
            
            expect(textInput.value).toBe('');
            expect(textInput.input.value).toBe('');
        });
    });

    describe('keyboard interactions', () => {
        it('blurs input on Enter key', () => {
            const textInput = new TextInput();
            container.appendChild(textInput.element);
            textInput.input.focus();
            
            const blurSpy = vi.spyOn(textInput.input, 'blur');
            const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
            textInput.input.dispatchEvent(event);
            
            expect(blurSpy).toHaveBeenCalled();
        });

        it('stops propagation on Enter key', () => {
            const textInput = new TextInput();
            container.appendChild(textInput.element);
            
            const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
            const stopPropSpy = vi.spyOn(event, 'stopPropagation');
            textInput.input.dispatchEvent(event);
            
            expect(stopPropSpy).toHaveBeenCalled();
        });

        it('reverts value and blurs on Escape key', () => {
            const onChange = vi.fn();
            const textInput = new TextInput({ value: 'Original', onChange });
            container.appendChild(textInput.element);
            
            // Focus to capture initial value
            textInput.input.dispatchEvent(new Event('focus'));
            
            // Change the value
            textInput.input.value = 'Modified';
            textInput.value = 'Modified';
            
            const blurSpy = vi.spyOn(textInput.input, 'blur');
            const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
            textInput.input.dispatchEvent(event);
            
            expect(textInput.value).toBe('Original');
            expect(textInput.input.value).toBe('Original');
            expect(onChange).toHaveBeenCalledWith('Original');
            expect(blurSpy).toHaveBeenCalled();
        });

        it('stops propagation on Escape key', () => {
            const textInput = new TextInput();
            container.appendChild(textInput.element);
            
            const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
            const stopPropSpy = vi.spyOn(event, 'stopPropagation');
            textInput.input.dispatchEvent(event);
            
            expect(stopPropSpy).toHaveBeenCalled();
        });

        it('stops propagation for other keys to prevent global shortcuts', () => {
            const textInput = new TextInput();
            container.appendChild(textInput.element);
            
            const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
            const stopPropSpy = vi.spyOn(event, 'stopPropagation');
            textInput.input.dispatchEvent(event);
            
            expect(stopPropSpy).toHaveBeenCalled();
        });
    });

    describe('focus behavior', () => {
        it('captures initial value on focus', () => {
            const textInput = new TextInput({ value: 'Focused Value' });
            container.appendChild(textInput.element);
            
            textInput.input.dispatchEvent(new Event('focus'));
            
            // Modify value
            textInput.input.value = 'Changed';
            textInput.value = 'Changed';
            
            // Escape should revert to focused value
            textInput.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            
            expect(textInput.value).toBe('Focused Value');
        });

        it('updates captured initial value on each focus', () => {
            const textInput = new TextInput({ value: 'First' });
            container.appendChild(textInput.element);
            
            // First focus
            textInput.input.dispatchEvent(new Event('focus'));
            textInput.setValue('Second');
            textInput.input.dispatchEvent(new Event('blur'));
            
            // Second focus
            textInput.input.dispatchEvent(new Event('focus'));
            textInput.input.value = 'Third';
            textInput.value = 'Third';
            
            // Escape should revert to 'Second'
            textInput.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            
            expect(textInput.value).toBe('Second');
        });
    });

    describe('edge cases', () => {
        it('handles numeric values as strings', () => {
            const textInput = new TextInput({ value: '12345' });
            expect(textInput.value).toBe('12345');
            expect(textInput.input.value).toBe('12345');
        });

        it('handles special characters in value', () => {
            const textInput = new TextInput({ value: '<script>alert("xss")</script>' });
            expect(textInput.value).toBe('<script>alert("xss")</script>');
        });

        it('handles unicode characters', () => {
            const textInput = new TextInput({ value: '你好世界 🌍' });
            expect(textInput.value).toBe('你好世界 🌍');
            expect(textInput.input.value).toBe('你好世界 🌍');
        });

        it('onChange callback is not called on initialization', () => {
            const onChange = vi.fn();
            new TextInput({ value: 'Initial', onChange });
            expect(onChange).not.toHaveBeenCalled();
        });
    });
});
