export const SVG_SANITIZE_DEFAULTS = {
	maxBytes: 500_000,
	maxNodes: 5_000
};

const FORBIDDEN_TAGS = new Set([
	'script',
	'foreignobject',
	'iframe',
	'object',
	'embed',
	'link',
	'meta'
]);

// Keep this conservative. We can expand as the supported subset firms up.
const ALLOWED_TAGS = new Set([
	'svg',
	'g',
	'defs',
	'path',
	'rect',
	'circle',
	'ellipse',
	'line',
	'polyline',
	'polygon',
	'use',
	'symbol',
	'clipPath',
	'mask',
	'linearGradient',
	'radialGradient',
	'stop',
	'pattern',
	'marker',
	'text',
	'tspan',
	'textPath'
]);

const GLOBAL_ATTRS = new Set([
	'id',
	'class',
	'tabindex',
	'role',
	'aria-label',
	'aria-hidden',
	'focusable'
]);

const ALLOWED_ATTRS = new Set([
	...GLOBAL_ATTRS,

	// Geometry
	'x',
	'y',
	'width',
	'height',
	'viewBox',
	'preserveAspectRatio',
	'd',
	'cx',
	'cy',
	'r',
	'rx',
	'ry',
	'x1',
	'y1',
	'x2',
	'y2',
	'points',

	// Paint
	'fill',
	'fill-opacity',
	'stroke',
	'stroke-width',
	'stroke-opacity',
	'stroke-linecap',
	'stroke-linejoin',
	'stroke-miterlimit',
	'opacity',
	'vector-effect',

	// Transforms
	'transform',

	// Text
	'font-family',
	'font-size',
	'font-weight',
	'text-anchor',
	'dominant-baseline',
	'letter-spacing',
	'word-spacing',
	'xlink:href',
	'href',

	// Gradients
	'gradientUnits',
	'gradientTransform',
	'offset',
	'stop-color',
	'stop-opacity',
	'spreadMethod',

	// Clip/mask
	'clip-path',
	'mask',

	// Patterns/markers
	'patternUnits',
	'patternContentUnits',
	'patternTransform',
	'markerWidth',
	'markerHeight',
	'markerUnits',
	'refX',
	'refY',
	'orient'
]);

function estimateUtf8Bytes(text) {
	try {
		return new TextEncoder().encode(text).length;
	} catch {
		// Fallback (rough): 2 bytes per char.
		return (text || '').length * 2;
	}
}

function isExternalReference(value) {
	if (!value) return false;
	const v = String(value).trim();

	// Allow internal references and local fragment URLs.
	if (v.startsWith('#')) return false;
	if (v.startsWith('url(#')) return false;

	// Block obvious schemes and protocol-relative URLs.
	return (
		/^\s*(?:https?:|data:|javascript:|file:)/i.test(v) ||
		v.startsWith('//')
	);
}

function sanitizeElement(element) {
	const tag = element.tagName;
	const tagLower = tag.toLowerCase();

	if (FORBIDDEN_TAGS.has(tagLower) || !ALLOWED_TAGS.has(tag)) {
		element.remove();
		return;
	}

	// Remove disallowed / dangerous attributes.
	for (const attr of Array.from(element.attributes)) {
		const name = attr.name;
		const nameLower = name.toLowerCase();
		const value = attr.value;

		// Strip event handlers.
		if (nameLower.startsWith('on')) {
			element.removeAttribute(name);
			continue;
		}

		// Strip inline styles (CSS can reference external resources).
		if (nameLower === 'style') {
			element.removeAttribute(name);
			continue;
		}

		// Strip external references.
		if (nameLower === 'href' || nameLower === 'xlink:href') {
			if (isExternalReference(value)) {
				element.removeAttribute(name);
			}
			continue;
		}

		// Conservative allowlist.
		if (!ALLOWED_ATTRS.has(name)) {
			element.removeAttribute(name);
		}
	}

	for (const child of Array.from(element.children)) {
		sanitizeElement(child);
	}
}

/**
 * Security-first SVG sanitizer.
 *
 * @param {string} input
 * @param {{maxBytes?: number, maxNodes?: number}} [options]
 * @returns {{ok: true, svg: string} | {ok: false, reason: string}}
 */
export function sanitizeSvg(input, options = {}) {
	const merged = { ...SVG_SANITIZE_DEFAULTS, ...(options || {}) };

	if (typeof input !== 'string' || input.trim().length === 0) {
		return { ok: false, reason: 'not_svg' };
	}

	const byteLen = estimateUtf8Bytes(input);
	if (byteLen > merged.maxBytes) {
		return { ok: false, reason: 'too_large' };
	}

	const parser = new DOMParser();
	const doc = parser.parseFromString(input, 'image/svg+xml');
	if (doc.querySelector('parsererror')) {
		return { ok: false, reason: 'parse_error' };
	}

	const root = doc.documentElement;
	if (!root || root.tagName.toLowerCase() !== 'svg') {
		return { ok: false, reason: 'not_svg' };
	}

	const nodeCount = root.getElementsByTagName('*').length + 1;
	if (nodeCount > merged.maxNodes) {
		return { ok: false, reason: 'too_many_nodes' };
	}

	// Root hardening.
	if (!root.getAttribute('xmlns')) {
		root.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
	}
	if (!root.getAttribute('focusable')) {
		root.setAttribute('focusable', 'false');
	}
	if (!root.getAttribute('preserveAspectRatio')) {
		root.setAttribute('preserveAspectRatio', 'xMidYMid meet');
	}

	sanitizeElement(root);

	const serialized = new XMLSerializer().serializeToString(root);
	return { ok: true, svg: serialized };
}

