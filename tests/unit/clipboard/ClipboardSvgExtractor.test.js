import { describe, it, expect } from 'vitest';
import { extractFirstSvgFromHtml } from '../../../src/core/clipboard/ClipboardSvgExtractor.js';

function normalizeSvgMarkup(svgMarkup) {
    if (typeof svgMarkup !== 'string') return null;
    const doc = new DOMParser().parseFromString(svgMarkup, 'image/svg+xml');
    const svg = doc.querySelector('svg');
    if (!svg) return null;
    return new XMLSerializer()
        .serializeToString(svg)
        .replace(/\s+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/i, '')
        .replace(/>\s+</g, '><')
        .trim();
}

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
        const extracted = extractFirstSvgFromHtml(html);
        expect(normalizeSvgMarkup(extracted)).toBe(normalizeSvgMarkup('<svg width="10" height="10"><rect width="10" height="10" /></svg>'));
    });

    it('is case-insensitive for tag matching', () => {
        const html = '<DIV><SVG><RECT /></SVG></DIV>';
        const extracted = extractFirstSvgFromHtml(html);
        expect(normalizeSvgMarkup(extracted)).toBe(normalizeSvgMarkup('<svg><rect /></svg>'));
    });

    it('extracts only the first svg when multiple exist', () => {
        const html = '<svg id="a"></svg>xx<svg id="b"></svg>';
        const extracted = extractFirstSvgFromHtml(html);
        expect(normalizeSvgMarkup(extracted)).toBe(normalizeSvgMarkup('<svg id="a"></svg>'));
    });
});
