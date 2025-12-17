import { describe, it, expect } from 'vitest';
import { sanitizeSvg } from '../../../../src/core/svg/SvgSanitizer.js';

describe('SvgSanitizer', () => {
    it('removes <script> elements', () => {
        const input = `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><path d="M0 0"/></svg>`;
        const result = sanitizeSvg(input);
        expect(result.ok).toBe(true);
        expect(result.svg).not.toMatch(/<script/i);
        expect(result.svg).toMatch(/<path/i);
    });

    it('preserves safe inline mix-blend-mode style and strips other CSS', () => {
        const input = `<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10" style="mix-blend-mode: multiply; fill: red; filter: url(https://example.com/x)" fill="#f00"/></svg>`;
        const result = sanitizeSvg(input);
        expect(result.ok).toBe(true);
        expect(result.svg).toMatch(/style="mix-blend-mode:multiply"/);
        expect(result.svg).not.toMatch(/fill:\s*red/i);
        expect(result.svg).not.toMatch(/filter:/i);
    });

    it('removes style attribute if it contains no allowlisted declarations', () => {
        const input = `<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10" style="fill: red; stroke: blue"/></svg>`;
        const result = sanitizeSvg(input);
        expect(result.ok).toBe(true);
        expect(result.svg).not.toMatch(/style=/i);
    });

    it('removes event handler attributes', () => {
        const input = `<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><path d="M0 0" onclick="alert(2)"/></svg>`;
        const result = sanitizeSvg(input);
        expect(result.ok).toBe(true);
        expect(result.svg).not.toMatch(/onload=/i);
        expect(result.svg).not.toMatch(/onclick=/i);
    });

    it('removes <foreignObject>', () => {
        const input = `<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><div xmlns="http://www.w3.org/1999/xhtml">x</div></foreignObject><rect width="10" height="10"/></svg>`;
        const result = sanitizeSvg(input);
        expect(result.ok).toBe(true);
        expect(result.svg).not.toMatch(/foreignObject/i);
        expect(result.svg).toMatch(/<rect/i);
    });

    it('strips external href references', () => {
        const input = `<svg xmlns="http://www.w3.org/2000/svg"><use href="https://example.com/x"/><use href="#local"/></svg>`;
        const result = sanitizeSvg(input);
        expect(result.ok).toBe(true);
        expect(result.svg).not.toMatch(/https:\/\//i);
        expect(result.svg).toMatch(/href="#local"/);
    });

    it('rejects oversized input', () => {
        const big = `<svg xmlns="http://www.w3.org/2000/svg">${' '.repeat(2000)}</svg>`;
        const result = sanitizeSvg(big, { maxBytes: 100 });
        expect(result.ok).toBe(false);
        expect(result.reason).toBe('too_large');
    });

    it('rejects non-svg input', () => {
        const input = `<html></html>`;
        const result = sanitizeSvg(input);
        expect(result.ok).toBe(false);
        expect(result.reason).toBe('not_svg');
    });
});
