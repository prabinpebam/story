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

    // Spec 19a: parse as HTML (not regex) and extract the first <svg>.
    try {
        const doc = new DOMParser().parseFromString(html, 'text/html');

        const svgNode = doc.querySelector('svg');
        if (svgNode) {
            const svgMarkup = new XMLSerializer().serializeToString(svgNode);
            return typeof svgMarkup === 'string' && svgMarkup.trim().length > 0 ? svgMarkup.trim() : null;
        }

        // If SVG is embedded via <img src="data:image/svg+xml,...">, decode it.
        const img = doc.querySelector('img[src^="data:image/svg+xml" i]');
        if (img) {
            const src = img.getAttribute('src') || '';
            const commaIdx = src.indexOf(',');
            if (commaIdx >= 0) {
                const header = src.slice(0, commaIdx);
                const payload = src.slice(commaIdx + 1);

                const isBase64 = /;base64/i.test(header);
                let decoded = '';
                if (isBase64) {
                    decoded = atob(payload);
                } else {
                    decoded = decodeURIComponent(payload);
                }

                if (typeof decoded === 'string' && /<svg\b/i.test(decoded)) {
                    return decoded.trim().length > 0 ? decoded.trim() : null;
                }
            }
        }
    } catch {
        // Fall back to a conservative substring-based extractor.
    }

    const start = html.toLowerCase().indexOf('<svg');
    if (start < 0) return null;

    const end = html.toLowerCase().indexOf('</svg>', start);
    if (end < 0) return null;

    const svg = html.slice(start, end + '</svg>'.length);
    return svg.trim().length > 0 ? svg.trim() : null;
}
