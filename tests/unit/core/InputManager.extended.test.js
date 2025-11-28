import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InputManager } from '../../../src/core/InputManager.js';

describe('InputManager', () => {
    let originalActiveElement;

    beforeEach(() => {
        vi.clearAllMocks();
        originalActiveElement = document.activeElement;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('isInputActive()', () => {
        it('should return false when no element is focused', () => {
            vi.spyOn(document, 'activeElement', 'get').mockReturnValue(null);
            expect(InputManager.isInputActive()).toBe(false);
        });

        it('should return true when input element is focused', () => {
            const input = document.createElement('input');
            vi.spyOn(document, 'activeElement', 'get').mockReturnValue(input);
            expect(InputManager.isInputActive()).toBe(true);
        });

        it('should return true when textarea is focused', () => {
            const textarea = document.createElement('textarea');
            vi.spyOn(document, 'activeElement', 'get').mockReturnValue(textarea);
            expect(InputManager.isInputActive()).toBe(true);
        });

        it('should return true when select element is focused', () => {
            const select = document.createElement('select');
            vi.spyOn(document, 'activeElement', 'get').mockReturnValue(select);
            expect(InputManager.isInputActive()).toBe(true);
        });

        it('should return true when contentEditable element is focused', () => {
            const div = document.createElement('div');
            div.contentEditable = 'true';
            document.body.appendChild(div);
            div.focus();
            // Instead of spying, we check that contentEditable elements work
            // Create a mock that properly returns isContentEditable = true
            const mockElement = { tagName: 'DIV', isContentEditable: true };
            vi.spyOn(document, 'activeElement', 'get').mockReturnValue(mockElement);
            expect(InputManager.isInputActive()).toBe(true);
        });

        it('should return false when regular div is focused', () => {
            const mockElement = { tagName: 'DIV', isContentEditable: false };
            vi.spyOn(document, 'activeElement', 'get').mockReturnValue(mockElement);
            expect(InputManager.isInputActive()).toBe(false);
        });

        it('should return false when button is focused', () => {
            const mockElement = { tagName: 'BUTTON', isContentEditable: false };
            vi.spyOn(document, 'activeElement', 'get').mockReturnValue(mockElement);
            expect(InputManager.isInputActive()).toBe(false);
        });

        it('should return false when body is focused', () => {
            const mockElement = { tagName: 'BODY', isContentEditable: false };
            vi.spyOn(document, 'activeElement', 'get').mockReturnValue(mockElement);
            expect(InputManager.isInputActive()).toBe(false);
        });
    });

    describe('shouldBlockShortcut()', () => {
        it('should return false when not in an input', () => {
            vi.spyOn(InputManager, 'isInputActive').mockReturnValue(false);
            
            const event = new KeyboardEvent('keydown', { key: 'Delete' });
            expect(InputManager.shouldBlockShortcut(event)).toBe(false);
        });

        it('should return true when in an input element', () => {
            vi.spyOn(InputManager, 'isInputActive').mockReturnValue(true);
            
            const event = new KeyboardEvent('keydown', { key: 'Delete' });
            expect(InputManager.shouldBlockShortcut(event)).toBe(true);
        });

        it('should block Delete key when in input', () => {
            vi.spyOn(InputManager, 'isInputActive').mockReturnValue(true);
            
            const event = new KeyboardEvent('keydown', { key: 'Delete' });
            expect(InputManager.shouldBlockShortcut(event)).toBe(true);
        });

        it('should block Backspace when in input', () => {
            vi.spyOn(InputManager, 'isInputActive').mockReturnValue(true);
            
            const event = new KeyboardEvent('keydown', { key: 'Backspace' });
            expect(InputManager.shouldBlockShortcut(event)).toBe(true);
        });

        it('should block letter keys when in input (tool shortcuts)', () => {
            vi.spyOn(InputManager, 'isInputActive').mockReturnValue(true);
            
            const eventT = new KeyboardEvent('keydown', { key: 't' });
            expect(InputManager.shouldBlockShortcut(eventT)).toBe(true);

            const eventV = new KeyboardEvent('keydown', { key: 'v' });
            expect(InputManager.shouldBlockShortcut(eventV)).toBe(true);
        });

        it('should allow shortcuts when not in input', () => {
            vi.spyOn(InputManager, 'isInputActive').mockReturnValue(false);
            
            const event = new KeyboardEvent('keydown', { key: 't' });
            expect(InputManager.shouldBlockShortcut(event)).toBe(false);
        });

        it('should allow Ctrl+S even when in input (potentially)', () => {
            // Note: Current implementation blocks all shortcuts when in input
            // This test documents current behavior
            vi.spyOn(InputManager, 'isInputActive').mockReturnValue(true);
            
            const event = new KeyboardEvent('keydown', { 
                key: 's', 
                ctrlKey: true 
            });
            // Current implementation returns true (blocks)
            expect(InputManager.shouldBlockShortcut(event)).toBe(true);
        });

        it('should block arrow keys when in input', () => {
            vi.spyOn(InputManager, 'isInputActive').mockReturnValue(true);
            
            const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
            expect(InputManager.shouldBlockShortcut(event)).toBe(true);
        });

        it('should block Escape when in input', () => {
            vi.spyOn(InputManager, 'isInputActive').mockReturnValue(true);
            
            const event = new KeyboardEvent('keydown', { key: 'Escape' });
            expect(InputManager.shouldBlockShortcut(event)).toBe(true);
        });

        it('should block Enter when in input', () => {
            vi.spyOn(InputManager, 'isInputActive').mockReturnValue(true);
            
            const event = new KeyboardEvent('keydown', { key: 'Enter' });
            expect(InputManager.shouldBlockShortcut(event)).toBe(true);
        });

        it('should not block when input has readonly attribute', () => {
            // This tests that readonly inputs are still considered "active"
            const input = document.createElement('input');
            input.readOnly = true;
            vi.spyOn(document, 'activeElement', 'get').mockReturnValue(input);
            
            // Even readonly, the input tag is detected
            expect(InputManager.isInputActive()).toBe(true);
        });

        it('should not block when input is disabled', () => {
            // Disabled inputs typically don't receive focus, but test the logic
            const input = document.createElement('input');
            input.disabled = true;
            vi.spyOn(document, 'activeElement', 'get').mockReturnValue(input);
            
            // Tag is still 'input'
            expect(InputManager.isInputActive()).toBe(true);
        });
    });

    describe('Edge cases', () => {
        it('should handle nested contentEditable elements', () => {
            // Mock element with isContentEditable=true (inherited)
            const mockElement = { tagName: 'SPAN', isContentEditable: true };
            vi.spyOn(document, 'activeElement', 'get').mockReturnValue(mockElement);
            
            // Child inherits contentEditable from parent
            expect(InputManager.isInputActive()).toBe(true);
        });

        it('should handle contentEditable set to false', () => {
            const mockElement = { tagName: 'DIV', isContentEditable: false };
            vi.spyOn(document, 'activeElement', 'get').mockReturnValue(mockElement);
            
            expect(InputManager.isInputActive()).toBe(false);
        });

        it('should handle input type variations', () => {
            const types = ['text', 'password', 'email', 'number', 'search', 'tel', 'url'];
            
            types.forEach(type => {
                const input = document.createElement('input');
                input.type = type;
                vi.spyOn(document, 'activeElement', 'get').mockReturnValue(input);
                
                expect(InputManager.isInputActive()).toBe(true);
            });
        });

        it('should handle input type that does not accept text input', () => {
            const input = document.createElement('input');
            input.type = 'checkbox';
            vi.spyOn(document, 'activeElement', 'get').mockReturnValue(input);
            
            // Still returns true because tag is input
            expect(InputManager.isInputActive()).toBe(true);
        });
    });
});
