import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InputManager } from '../../../src/core/InputManager.js';

describe('InputManager', () => {
    let testElement;

    afterEach(() => {
        // Remove test element if it exists
        if (testElement && testElement.parentNode) {
            testElement.parentNode.removeChild(testElement);
        }
        testElement = null;
        vi.restoreAllMocks();
    });

    describe('isInputActive()', () => {
        it('should return false when activeElement is null', () => {
            // Mock document.activeElement to return null
            vi.spyOn(document, 'activeElement', 'get').mockReturnValue(null);
            expect(InputManager.isInputActive()).toBe(false);
        });

        it('should return true when an input element is focused', () => {
            testElement = document.createElement('input');
            testElement.type = 'text';
            document.body.appendChild(testElement);
            testElement.focus();
            
            expect(InputManager.isInputActive()).toBe(true);
        });

        it('should return true when a textarea is focused', () => {
            testElement = document.createElement('textarea');
            document.body.appendChild(testElement);
            testElement.focus();
            
            expect(InputManager.isInputActive()).toBe(true);
        });

        it('should return true when a select element is focused', () => {
            testElement = document.createElement('select');
            document.body.appendChild(testElement);
            testElement.focus();
            
            expect(InputManager.isInputActive()).toBe(true);
        });

        // Skip contentEditable tests in jsdom as focus() doesn't work reliably
        it.skip('should return true when a contentEditable element is focused', () => {
            testElement = document.createElement('div');
            testElement.contentEditable = 'true';
            testElement.tabIndex = 0;
            document.body.appendChild(testElement);
            testElement.focus();
            
            expect(InputManager.isInputActive()).toBe(true);
        });

        it.skip('should return false when a regular div is focused', () => {
            testElement = document.createElement('div');
            testElement.tabIndex = 0;
            document.body.appendChild(testElement);
            testElement.focus();
            
            expect(InputManager.isInputActive()).toBe(false);
        });

        it.skip('should return false when a button is focused', () => {
            testElement = document.createElement('button');
            document.body.appendChild(testElement);
            testElement.focus();
            
            expect(InputManager.isInputActive()).toBe(false);
        });
        
        it.skip('should return false when body is focused', () => {
            document.body.focus();
            const result = InputManager.isInputActive();
            expect(result).toBe(false);
        });

        it('should return false when activeElement is null', () => {
            // Mock document.activeElement to return null
            vi.spyOn(document, 'activeElement', 'get').mockReturnValue(null);

            expect(InputManager.isInputActive()).toBe(false);
        });

        it('should handle input types correctly', () => {
            const types = ['text', 'password', 'email', 'number', 'search', 'tel', 'url'];

            types.forEach(type => {
                const input = document.createElement('input');
                input.type = type;
                document.body.appendChild(input);
                input.focus();

                expect(InputManager.isInputActive()).toBe(true);

                document.body.removeChild(input);
            });
        });
    });

    describe('shouldBlockShortcut()', () => {
        it('should return false when no input is active', () => {
            document.body.focus();
            const event = new KeyboardEvent('keydown', { key: 'Delete' });

            expect(InputManager.shouldBlockShortcut(event)).toBe(false);
        });

        it('should return true when input element is focused', () => {
            const input = document.createElement('input');
            document.body.appendChild(input);
            input.focus();

            const event = new KeyboardEvent('keydown', { key: 'Delete' });
            expect(InputManager.shouldBlockShortcut(event)).toBe(true);

            document.body.removeChild(input);
        });

        it('should return true when textarea is focused', () => {
            const textarea = document.createElement('textarea');
            document.body.appendChild(textarea);
            textarea.focus();

            const event = new KeyboardEvent('keydown', { key: 't' });
            expect(InputManager.shouldBlockShortcut(event)).toBe(true);

            document.body.removeChild(textarea);
        });

        // Skip contentEditable tests in jsdom as focus() doesn't work reliably
        it.skip('should return true when contentEditable is focused', () => {
            const div = document.createElement('div');
            div.contentEditable = 'true';
            div.tabIndex = 0;
            document.body.appendChild(div);
            div.focus();

            const event = new KeyboardEvent('keydown', { key: 'r' });
            expect(InputManager.shouldBlockShortcut(event)).toBe(true);
            
            document.body.removeChild(div);
        });

        it('should block tool shortcuts when in input', () => {
            const input = document.createElement('input');
            document.body.appendChild(input);
            input.focus();

            // Tool shortcuts that should be blocked
            const shortcuts = ['v', 'h', 'r', 't', 'Delete', 'Backspace'];

            shortcuts.forEach(key => {
                const event = new KeyboardEvent('keydown', { key });
                expect(InputManager.shouldBlockShortcut(event)).toBe(true);
            });

            document.body.removeChild(input);
        });

        it('should block shortcuts with modifier keys when in input', () => {
            const input = document.createElement('input');
            document.body.appendChild(input);
            input.focus();

            const event = new KeyboardEvent('keydown', {
                key: 'd',
                ctrlKey: true
            });

            expect(InputManager.shouldBlockShortcut(event)).toBe(true);

            document.body.removeChild(input);
        });

        it('should not block shortcuts when a button is focused', () => {
            const button = document.createElement('button');
            document.body.appendChild(button);
            button.focus();

            const event = new KeyboardEvent('keydown', { key: 'v' });
            expect(InputManager.shouldBlockShortcut(event)).toBe(false);

            document.body.removeChild(button);
        });

        it('should block Escape key in input', () => {
            const input = document.createElement('input');
            document.body.appendChild(input);
            input.focus();

            const event = new KeyboardEvent('keydown', { key: 'Escape' });
            expect(InputManager.shouldBlockShortcut(event)).toBe(true);

            document.body.removeChild(input);
        });

        it('should block arrow keys when in input', () => {
            const input = document.createElement('input');
            document.body.appendChild(input);
            input.focus();

            const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

            arrowKeys.forEach(key => {
                const event = new KeyboardEvent('keydown', { key });
                expect(InputManager.shouldBlockShortcut(event)).toBe(true);
            });

            document.body.removeChild(input);
        });

        it('should block space key in textarea', () => {
            const textarea = document.createElement('textarea');
            document.body.appendChild(textarea);
            textarea.focus();

            const event = new KeyboardEvent('keydown', { key: ' ' });
            expect(InputManager.shouldBlockShortcut(event)).toBe(true);

            document.body.removeChild(textarea);
        });

        it.skip('should block Enter key in contentEditable', () => {
            const div = document.createElement('div');
            div.contentEditable = 'true';
            div.tabIndex = 0;
            document.body.appendChild(div);
            div.focus();

            const event = new KeyboardEvent('keydown', { key: 'Enter' });
            expect(InputManager.shouldBlockShortcut(event)).toBe(true);
            
            document.body.removeChild(div);
        });
    });

    describe('edge cases', () => {
        it.skip('should handle nested contentEditable elements', () => {
            const inner = document.createElement('span');
            inner.contentEditable = 'true';
            inner.tabIndex = 0;
            document.body.appendChild(inner);
            inner.focus();

            expect(InputManager.isInputActive()).toBe(true);
            
            document.body.removeChild(inner);
        });

        it('should handle input inside a form', () => {
            const form = document.createElement('form');
            const input = document.createElement('input');
            form.appendChild(input);
            document.body.appendChild(form);
            input.focus();

            expect(InputManager.isInputActive()).toBe(true);

            document.body.removeChild(form);
        });

        it.skip('should handle disabled inputs - body is active', () => {
            // Disabled inputs can't be focused, so we just check that non-input returns false
            document.body.focus();
            expect(InputManager.isInputActive()).toBe(false);
        });

        it('should handle readonly inputs', () => {
            const input = document.createElement('input');
            input.readOnly = true;
            document.body.appendChild(input);
            input.focus();

            // Readonly inputs are still inputs
            expect(InputManager.isInputActive()).toBe(true);

            document.body.removeChild(input);
        });

        it('should handle select element with options', () => {
            const select = document.createElement('select');
            const option1 = document.createElement('option');
            option1.value = '1';
            option1.textContent = 'Option 1';
            const option2 = document.createElement('option');
            option2.value = '2';
            option2.textContent = 'Option 2';
            select.appendChild(option1);
            select.appendChild(option2);
            document.body.appendChild(select);
            select.focus();

            expect(InputManager.isInputActive()).toBe(true);

            document.body.removeChild(select);
        });
    });
});
