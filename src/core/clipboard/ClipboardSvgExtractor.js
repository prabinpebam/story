/**
 * ClipboardSvgExtractor
 *
 * Minimal, deterministic helpers for extracting SVG markup from clipboard payloads.
 *
 * This is intentionally conservative: it only extracts when an explicit <svg>…</svg>
 * block is present.
 */

/**
 * Extract the first `<svg ...>...</svg>` block from an HTML string.
 * Returns `null` when no SVG block is found.
 */
export function extractFirstSvgFromHtml(html) {
    if (typeof html !== 'string' || html.length === 0) return null;

    const start = html.toLowerCase().indexOf('<svg');
    if (start < 0) return null;

    const end = html.toLowerCase().indexOf('</svg>', start);
    if (end < 0) return null;

    const svg = html.slice(start, end + '</svg>'.length);
    return svg.trim().length > 0 ? svg.trim() : null;
}
