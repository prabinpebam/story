/**
 * InviteInput Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InviteInput } from '../../../src/ui/sharing/InviteInput.js';

describe('InviteInput', () => {
    let input;
    
    beforeEach(() => {
        document.body.innerHTML = '';
        input = new InviteInput({
            placeholder: 'Enter emails...'
        });
        document.body.appendChild(input.element);
    });
    
    afterEach(() => {
        input?.destroy();
    });
    
    describe('Initialization', () => {
        it('should create input element', () => {
            expect(input.element).toBeDefined();
            expect(input.element.classList.contains('invite-input')).toBe(true);
        });
        
        it('should have placeholder text', () => {
            const field = input.element.querySelector('.invite-input-field');
            expect(field.placeholder).toBe('Enter emails...');
        });
        
        it('should start with empty emails', () => {
            expect(input.getEmails()).toEqual([]);
        });
    });
    
    describe('Email Validation', () => {
        it('should accept valid email', () => {
            input.input.value = 'test@example.com';
            input.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
            expect(input.getEmails()).toContain('test@example.com');
        });
        
        it('should reject invalid email', () => {
            input.input.value = 'invalid-email';
            input.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
            expect(input.getEmails()).not.toContain('invalid-email');
        });
        
        it('should reject email without @', () => {
            input.input.value = 'noemail.com';
            input.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
            expect(input.getEmails().length).toBe(0);
        });
        
        it('should reject email without domain', () => {
            input.input.value = 'test@';
            input.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
            expect(input.getEmails().length).toBe(0);
        });
    });
    
    describe('Email Entry', () => {
        it('should add email on Enter', () => {
            input.input.value = 'user@test.com';
            input.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
            expect(input.getEmails()).toContain('user@test.com');
        });
        
        it('should add email on comma', () => {
            input.input.value = 'user@test.com';
            input.input.dispatchEvent(new KeyboardEvent('keydown', { key: ',' }));
            expect(input.getEmails()).toContain('user@test.com');
        });
        
        it('should add email on space', () => {
            input.input.value = 'user@test.com';
            input.input.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
            expect(input.getEmails()).toContain('user@test.com');
        });
        
        it('should add email on Tab', () => {
            input.input.value = 'user@test.com';
            input.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
            expect(input.getEmails()).toContain('user@test.com');
        });
        
        it('should add email on blur', () => {
            input.input.value = 'user@test.com';
            input.input.dispatchEvent(new Event('blur'));
            expect(input.getEmails()).toContain('user@test.com');
        });
    });
    
    describe('Duplicate Prevention', () => {
        it('should not add duplicate emails', () => {
            input.input.value = 'test@example.com';
            input.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
            
            input.input.value = 'test@example.com';
            input.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
            
            const emails = input.getEmails();
            expect(emails.filter(e => e === 'test@example.com').length).toBe(1);
        });
    });
    
    describe('Email Removal', () => {
        beforeEach(() => {
            input.input.value = 'test@example.com';
            input.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
        });
        
        it('should remove email on backspace when input empty', () => {
            input.input.value = '';
            input.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
            expect(input.getEmails().length).toBe(0);
        });
        
        it('should remove email when clicking remove button', () => {
            const removeBtn = input.element.querySelector('.invite-input-tag-remove');
            removeBtn?.click();
            expect(input.getEmails().length).toBe(0);
        });
    });
    
    describe('Tag Display', () => {
        it('should display email as tag', () => {
            input.input.value = 'test@example.com';
            input.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
            
            const tag = input.element.querySelector('.invite-input-tag');
            expect(tag).toBeDefined();
            expect(tag.textContent).toContain('test@example.com');
        });
        
        it('should display multiple tags', () => {
            input.input.value = 'one@test.com';
            input.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
            
            input.input.value = 'two@test.com';
            input.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
            
            const tags = input.element.querySelectorAll('.invite-input-tag');
            expect(tags.length).toBe(2);
        });
    });
    
    describe('Paste Handling', () => {
        it('should parse pasted text with comma separation', () => {
            // Skip in environments without ClipboardEvent
            if (typeof ClipboardEvent === 'undefined') {
                return;
            }
            
            const pasteEvent = new ClipboardEvent('paste', {
                clipboardData: new DataTransfer()
            });
            pasteEvent.clipboardData.setData('text', 'a@test.com, b@test.com');
            input.input.dispatchEvent(pasteEvent);
            
            const emails = input.getEmails();
            expect(emails).toContain('a@test.com');
            expect(emails).toContain('b@test.com');
        });
        
        it('should parse pasted text with newlines', () => {
            // Skip in environments without ClipboardEvent
            if (typeof ClipboardEvent === 'undefined') {
                return;
            }
            
            const pasteEvent = new ClipboardEvent('paste', {
                clipboardData: new DataTransfer()
            });
            pasteEvent.clipboardData.setData('text', 'a@test.com\nb@test.com');
            input.input.dispatchEvent(pasteEvent);
            
            const emails = input.getEmails();
            expect(emails).toContain('a@test.com');
            expect(emails).toContain('b@test.com');
        });
    });
    
    describe('clear()', () => {
        it('should clear all emails', () => {
            input.input.value = 'test@example.com';
            input.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
            
            input.clear();
            expect(input.getEmails().length).toBe(0);
        });
        
        it('should clear input field', () => {
            input.input.value = 'pending';
            input.clear();
            expect(input.input.value).toBe('');
        });
    });
    
    describe('disable()/enable()', () => {
        it('should disable input', () => {
            input.disable();
            expect(input.input.disabled).toBe(true);
            expect(input.element.classList.contains('disabled')).toBe(true);
        });
        
        it('should enable input', () => {
            input.disable();
            input.enable();
            expect(input.input.disabled).toBe(false);
            expect(input.element.classList.contains('disabled')).toBe(false);
        });
    });
    
    describe('onSubmit Callback', () => {
        it('should call onSubmit when Enter pressed with emails', () => {
            const onSubmit = vi.fn();
            input = new InviteInput({ onSubmit });
            
            input.input.value = 'test@example.com';
            input.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
            
            expect(onSubmit).toHaveBeenCalledWith(['test@example.com']);
        });
    });
    
    describe('focus()', () => {
        it('should focus the input field', () => {
            input.focus();
            expect(document.activeElement).toBe(input.input);
        });
    });
    
    describe('destroy()', () => {
        it('should remove element from DOM', () => {
            input.destroy();
            expect(document.body.contains(input.element)).toBe(false);
        });
    });
});
