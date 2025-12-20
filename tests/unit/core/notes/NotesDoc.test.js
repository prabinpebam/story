import { describe, it, expect } from 'vitest';

import {
    createEmptyNotesDoc,
    legacyNotesToNotesDoc,
    notesDocToSafeHtml,
    sanitizeHref
} from '../../../../src/core/notes/NotesDoc.js';

describe('NotesDoc', () => {
    it('createEmptyNotesDoc returns a valid v1 doc', () => {
        expect(createEmptyNotesDoc()).toEqual({ version: 1, blocks: [] });
    });

    it('sanitizeHref rejects javascript: urls', () => {
        expect(sanitizeHref('javascript:alert(1)')).toBe(null);
        expect(sanitizeHref(' JAVASCRIPT:alert(1) ')).toBe(null);
    });

    it('sanitizeHref allows http/https/mailto', () => {
        expect(sanitizeHref('https://example.com')).toBe('https://example.com');
        expect(sanitizeHref('http://example.com')).toBe('http://example.com');
        expect(sanitizeHref('mailto:test@example.com')).toBe('mailto:test@example.com');
    });

    it('notesDocToSafeHtml escapes text and emits only allowed tags', () => {
        const doc = {
            version: 1,
            blocks: [
                {
                    type: 'paragraph',
                    inlines: [
                        { type: 'text', text: '<script>alert(1)</script>' },
                        {
                            type: 'link',
                            href: 'https://example.com',
                            inlines: [{ type: 'text', text: 'link' }]
                        }
                    ]
                }
            ]
        };

        const html = notesDocToSafeHtml(doc);
        expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
        expect(html).toContain('<a');
        expect(html).not.toContain('<script');
        expect(html).not.toContain('<img');
        expect(html).not.toContain('onerror');
    });

    it('legacyNotesToNotesDoc drops unsafe tags/attrs and rejects javascript: links', () => {
        const legacy = `
            <p>Hello <strong>World</strong></p>
            <img src=x onerror=alert(1)>
            <a href="javascript:alert(1)">bad</a>
        `;

        const doc = legacyNotesToNotesDoc(legacy);
        const html = notesDocToSafeHtml(doc);

        expect(html).toContain('Hello');
        expect(html).toContain('<strong>World</strong>');
        expect(html).toContain('bad');
        expect(html).not.toContain('<img');
        expect(html).not.toContain('javascript:');
        expect(html).not.toContain('onerror');
    });
});
