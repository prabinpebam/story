import { describe, it, expect } from 'vitest';
import { extractFirstSvgFromHtml } from '../../../src/core/clipboard/ClipboardSvgExtractor.js';

describe('ClipboardSvgExtractor.extractFirstSvgFromHtml', () => {
    it('returns null for non-string input', () => {
        expect(extractFirstSvgFromHtml(null)).toBe(null);
        expect(extractFirstSvgFromHtml(undefined)).toBe(null);
        expect(extractFirstSvgFromHtml(123)).toBe(null);
    });

    it('returns null when no <svg> is present', () => {
        expect(extractFirstSvgFromHtml('<div>Hello</div>')).toBe(null);
    });

    it('extracts the first svg block from html', () => {
        const html = '<div>before</div><svg width="10" height="10"><rect width="10" height="10" /></svg><div>after</div>';
        expect(extractFirstSvgFromHtml(html)).toBe('<svg width="10" height="10"><rect width="10" height="10" /></svg>');
    });

    it('is case-insensitive for tag matching', () => {
        const html = '<DIV><SVG><RECT /></SVG></DIV>';
        expect(extractFirstSvgFromHtml(html)).toBe('<SVG><RECT /></SVG>');
    });

    it('extracts only the first svg when multiple exist', () => {
        const html = '<svg id="a"></svg>xx<svg id="b"></svg>';
        expect(extractFirstSvgFromHtml(html)).toBe('<svg id="a"></svg>');
    });
});
