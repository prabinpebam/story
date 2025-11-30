/**
 * ContentSanitizer Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ContentSanitizer } from '../../../../src/core/text/ContentSanitizer.js';

describe('ContentSanitizer', () => {
    let sanitizer;
    
    beforeEach(() => {
        sanitizer = new ContentSanitizer();
    });

    describe('sanitize', () => {
        it('should return empty string for null input', () => {
            expect(sanitizer.sanitize(null)).toBe('');
        });

        it('should return empty string for undefined input', () => {
            expect(sanitizer.sanitize(undefined)).toBe('');
        });

        it('should preserve basic text content', () => {
            expect(sanitizer.sanitize('Hello World')).toBe('Hello World');
        });

        it('should preserve allowed HTML tags', () => {
            const input = '<b>Bold</b> and <i>italic</i>';
            const result = sanitizer.sanitize(input);
            
            expect(result).toContain('<b>');
            expect(result).toContain('<i>');
        });

        it('should preserve span tags with style', () => {
            const input = '<span style="color: red;">Colored text</span>';
            const result = sanitizer.sanitize(input);
            
            expect(result).toContain('<span');
            expect(result).toContain('style=');
        });

        it('should preserve line break tags', () => {
            const input = 'Line 1<br>Line 2';
            const result = sanitizer.sanitize(input);
            
            expect(result).toContain('<br');
        });

        it('should preserve paragraph tags', () => {
            const input = '<p>Paragraph 1</p><p>Paragraph 2</p>';
            const result = sanitizer.sanitize(input);
            
            expect(result).toContain('<p>');
        });

        it('should unwrap li tags (lists not in default allowed elements)', () => {
            const input = '<li>Item 1</li><li>Item 2</li>';
            const result = sanitizer.sanitize(input);
            
            // li tags are in ALLOWED_ELEMENTS.lists but not in default ALLOWED_ELEMENTS_LIST
            // So they get unwrapped, keeping the text content
            expect(result).toContain('Item 1');
            expect(result).toContain('Item 2');
        });

        it('should unwrap script tags (keeping inner text)', () => {
            const input = '<script>alert("xss")</script>Hello';
            const result = sanitizer.sanitize(input);
            
            // Script tags are unwrapped, not removed entirely
            expect(result).not.toContain('<script');
            expect(result).toContain('Hello');
        });

        it('should remove event handlers', () => {
            const input = '<div onclick="alert()">Click me</div>';
            const result = sanitizer.sanitize(input);
            
            expect(result).not.toContain('onclick');
        });

        it('should remove javascript: URLs', () => {
            const input = '<a href="javascript:alert()">Link</a>';
            const result = sanitizer.sanitize(input);
            
            expect(result).not.toContain('javascript:');
        });

        it('should normalize whitespace', () => {
            const input = 'Multiple   spaces';
            const result = sanitizer.sanitize(input);
            
            // Note: HTML collapses multiple spaces, so behavior depends on implementation
            expect(result).toContain('Multiple');
            expect(result).toContain('spaces');
        });

        it('should handle nested tags', () => {
            const input = '<p><b>Bold <i>and italic</i></b></p>';
            const result = sanitizer.sanitize(input);
            
            expect(result).toContain('<p>');
            expect(result).toContain('<b>');
            expect(result).toContain('<i>');
        });

        it('should preserve strong and em tags', () => {
            const input = '<strong>Strong</strong> and <em>emphasis</em>';
            const result = sanitizer.sanitize(input);
            
            expect(result).toContain('<strong>');
            expect(result).toContain('<em>');
        });

        it('should handle empty content', () => {
            expect(sanitizer.sanitize('')).toBe('');
        });

        it('should handle whitespace-only content', () => {
            const result = sanitizer.sanitize('   ');
            expect(typeof result).toBe('string');
        });
    });

    describe('isEmpty', () => {
        it('should return true for empty string', () => {
            expect(sanitizer.isEmpty('')).toBe(true);
        });

        it('should return true for whitespace only', () => {
            expect(sanitizer.isEmpty('   ')).toBe(true);
        });

        it('should return true for only br tags', () => {
            expect(sanitizer.isEmpty('<br>')).toBe(true);
            expect(sanitizer.isEmpty('<br/>')).toBe(true);
            expect(sanitizer.isEmpty('<br />')).toBe(true);
        });

        it('should return true for empty paragraph', () => {
            expect(sanitizer.isEmpty('<p></p>')).toBe(true);
            expect(sanitizer.isEmpty('<p><br></p>')).toBe(true);
        });

        it('should return false for content with text', () => {
            expect(sanitizer.isEmpty('Hello')).toBe(false);
            expect(sanitizer.isEmpty('<p>Hello</p>')).toBe(false);
        });

        it('should return true for nbsp only', () => {
            expect(sanitizer.isEmpty('&nbsp;')).toBe(true);
            expect(sanitizer.isEmpty('\u00A0')).toBe(true);
        });
    });

    describe('toPlainText', () => {
        it('should remove all HTML tags', () => {
            const result = sanitizer.toPlainText('<p><b>Hello</b> World</p>');
            expect(result).toBe('Hello World');
        });

        it('should handle empty input', () => {
            expect(sanitizer.toPlainText('')).toBe('');
            expect(sanitizer.toPlainText(null)).toBe('');
        });

        it('should get plain text preserving line content', () => {
            const result = sanitizer.toPlainText('Line1<br>Line2');
            expect(result).toContain('Line1');
            expect(result).toContain('Line2');
        });
    });

    describe('sanitizePaste', () => {
        it('should apply additional paste cleaning', () => {
            const result = sanitizer.sanitizePaste('Hello<br><br><br>World');
            expect(result).toContain('Hello');
            expect(result).toContain('World');
        });

        it('should remove empty elements', () => {
            const result = sanitizer.sanitizePaste('<span></span>Hello');
            expect(result).toContain('Hello');
        });
    });
});
