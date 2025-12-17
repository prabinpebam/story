export const SVG_SANITIZE_DEFAULTS = {
	maxBytes: 500_000,
	maxNodes: 5_000
};

const DEFAULT_WARNING_LIMIT = 50;

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
	'filter',
	'feGaussianBlur',
	'feDropShadow',
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
	'stroke-dasharray',
	'stroke-dashoffset',
	'opacity',
	'vector-effect',
	'fill-rule',
	'clip-rule',
	'filter',

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
	,
	// Filters (conservative subset)
	'filterUnits',
	'primitiveUnits',
	'stdDeviation',
	'dx',
	'dy',
	'flood-color',
	'flood-opacity',
	'in',
	'result'
]);

function sanitizeInlineStyle(styleText) {
	if (!styleText) return '';

	const declarations = String(styleText)
		.split(';')
		.map((d) => d.trim())
		.filter(Boolean);

	const sanitized = [];
	for (const decl of declarations) {
		const idx = decl.indexOf(':');
		if (idx === -1) continue;

		const prop = decl.slice(0, idx).trim().toLowerCase();
		let value = decl.slice(idx + 1).trim();
		if (!value) continue;

		// Keep this extremely conservative: allow only a tiny subset of CSS.
		if (prop !== 'mix-blend-mode') continue;

		// Strip '!important' and normalize.
		value = value.replace(/!important\b/gi, '').trim().toLowerCase();
		const token = value.split(/\s+/)[0];

		// CSS keywords only. (No functions, urls, strings, etc.)
		if (!/^[a-z-]+$/.test(token)) continue;

		sanitized.push(`mix-blend-mode:${token}`);
	}

	return sanitized.join(';');
}

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
	let v = String(value).trim();

	// Unwrap url(...) values.
	const urlMatch = v.match(/^url\(\s*(.*?)\s*\)$/i);
	if (urlMatch) {
		v = urlMatch[1] || '';
		// Strip optional quotes.
		v = v.trim().replace(/^['"]|['"]$/g, '');
	}

	// Allow internal references and local fragment URLs.
	if (v.startsWith('#')) return false;
	if (v.startsWith('url(#')) return false;

	// Block obvious schemes and protocol-relative URLs.
	return (
		/^\s*(?:https?:|data:|javascript:|file:)/i.test(v) ||
		v.startsWith('//')
	);
}

function sanitizeElement(element, ctx) {
	const tag = element.tagName;
	const tagLower = tag.toLowerCase();

	if (FORBIDDEN_TAGS.has(tagLower) || !ALLOWED_TAGS.has(tag)) {
		ctx.removedNodes++;
		ctx.changed = true;
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
			ctx.removedAttrs++;
			ctx.changed = true;
			element.removeAttribute(name);
			continue;
		}

		// Inline styles are dangerous in general; keep a tiny safe subset.
		if (nameLower === 'style') {
			const sanitizedStyle = sanitizeInlineStyle(value);
			if (sanitizedStyle) {
				if (sanitizedStyle !== value) {
					ctx.sanitizedStyles++;
					ctx.changed = true;
				}
				element.setAttribute(name, sanitizedStyle);
			} else {
				ctx.removedAttrs++;
				ctx.changed = true;
				element.removeAttribute(name);
			}
			continue;
		}

		// Strip external references.
		if (nameLower === 'href' || nameLower === 'xlink:href') {
			if (isExternalReference(value)) {
				ctx.externalRefsStripped++;
				ctx.removedAttrs++;
				ctx.changed = true;
				element.removeAttribute(name);
			}
			continue;
		}

		// Strip external resource references for url(...) presentation attributes.
		if (nameLower === 'filter' || nameLower === 'clip-path' || nameLower === 'mask' || nameLower === 'fill' || nameLower === 'stroke') {
			if (isExternalReference(value)) {
				ctx.externalRefsStripped++;
				ctx.removedAttrs++;
				ctx.changed = true;
				element.removeAttribute(name);
			}
			continue;
		}

		// Conservative allowlist.
		if (!ALLOWED_ATTRS.has(name)) {
			ctx.removedAttrs++;
			ctx.changed = true;
			element.removeAttribute(name);
		}
	}

	for (const child of Array.from(element.children)) {
		sanitizeElement(child, ctx);
	}
}

/**
 * Security-first SVG sanitizer.
 *
 * @param {string} input
 * @param {{maxBytes?: number, maxNodes?: number}} [options]
 * @returns {{ok: true, svg: string, warnings: string[]} | {ok: false, reason: string, warnings: string[]}}
 */
export function sanitizeSvg(input, options = {}) {
	const merged = { ...SVG_SANITIZE_DEFAULTS, ...(options || {}) };
	const warnings = [];

	function pushWarning(code) {
		if (typeof code !== 'string' || code.length === 0) return;
		if (warnings.length >= DEFAULT_WARNING_LIMIT) return;
		warnings.push(code);
	}

	if (typeof input !== 'string' || input.trim().length === 0) {
		pushWarning('WARN_NO_SVG_FOUND');
		return { ok: false, reason: 'not_svg', warnings };
	}

	const byteLen = estimateUtf8Bytes(input);
	if (byteLen > merged.maxBytes) {
		pushWarning('WARN_IMPORT_TOO_LARGE');
		return { ok: false, reason: 'too_large', warnings };
	}

	const parser = new DOMParser();
	const doc = parser.parseFromString(input, 'image/svg+xml');
	if (doc.querySelector('parsererror')) {
		return { ok: false, reason: 'parse_error', warnings };
	}

	const root = doc.documentElement;
	if (!root || root.tagName.toLowerCase() !== 'svg') {
		pushWarning('WARN_NO_SVG_FOUND');
		return { ok: false, reason: 'not_svg', warnings };
	}

	const nodeCount = root.getElementsByTagName('*').length + 1;
	if (nodeCount > merged.maxNodes) {
		pushWarning('WARN_IMPORT_TOO_COMPLEX');
		return { ok: false, reason: 'too_many_nodes', warnings };
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

	const ctx = {
		changed: false,
		externalRefsStripped: 0,
		removedNodes: 0,
		removedAttrs: 0,
		sanitizedStyles: 0
	};

	sanitizeElement(root, ctx);

	if (ctx.externalRefsStripped > 0) {
		pushWarning('WARN_EXTERNAL_REFERENCE_STRIPPED');
	}
	if (ctx.changed) {
		pushWarning('WARN_SVG_SANITIZED');
	}

	const serialized = new XMLSerializer().serializeToString(root);
	return { ok: true, svg: serialized, warnings };
}

