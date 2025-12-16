/**
 * EditableSvgImporter
 *
 * Converts a sanitized SVG markup string into a small subset of fully-editable
 * Story shape elements.
 *
 * This is intentionally conservative (v0):
 * - Supports only <rect>, <circle>, <ellipse>
 * - Rejects transforms
 * - Falls back to non-editable SVG element import when unsupported
 */

function toNumber(value) {
    if (value === null || value === undefined) return null;
    const n = Number(String(value).trim());
    return Number.isFinite(n) ? n : null;
}

function toLengthNumber(value) {
    if (value === null || value === undefined) return null;
    const s = String(value).trim();
    if (s.length === 0) return null;
    // Parse leading numeric portion; ignore units like px.
    const m = s.match(/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i);
    if (!m) return null;
    const n = Number(m[0]);
    return Number.isFinite(n) ? n : null;
}

function clamp01(n) {
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(1, n));
}

function clampOpacity100(n) {
    if (!Number.isFinite(n)) return 100;
    return Math.max(0, Math.min(100, Math.round(n)));
}

function normalizeHex6(hex) {
    const s = String(hex).trim();
    if (!s.startsWith('#')) return null;
    const raw = s.slice(1);
    if (/^[0-9a-f]{3}$/i.test(raw)) {
        return `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`.toLowerCase();
    }
    if (/^[0-9a-f]{6}$/i.test(raw)) {
        return `#${raw}`.toLowerCase();
    }
    if (/^[0-9a-f]{8}$/i.test(raw)) {
        // #RRGGBBAA
        return `#${raw.slice(0, 6)}`.toLowerCase();
    }
    if (/^[0-9a-f]{4}$/i.test(raw)) {
        // #RGBA
        return `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`.toLowerCase();
    }
    return null;
}

function parseHexAlpha(hex) {
    const s = String(hex).trim();
    if (!s.startsWith('#')) return null;
    const raw = s.slice(1);
    if (/^[0-9a-f]{8}$/i.test(raw)) {
        const a = parseInt(raw.slice(6, 8), 16);
        return clamp01(a / 255);
    }
    if (/^[0-9a-f]{4}$/i.test(raw)) {
        const a = parseInt(raw[3] + raw[3], 16);
        return clamp01(a / 255);
    }
    return 1;
}

function rgbToHex(r, g, b) {
    const rr = Math.max(0, Math.min(255, Math.round(r)));
    const gg = Math.max(0, Math.min(255, Math.round(g)));
    const bb = Math.max(0, Math.min(255, Math.round(b)));
    return `#${rr.toString(16).padStart(2, '0')}${gg.toString(16).padStart(2, '0')}${bb.toString(16).padStart(2, '0')}`;
}

function hexToRgb(hex) {
    const h = normalizeHex6(hex);
    if (!h) return null;
    const raw = h.slice(1);
    const r = parseInt(raw.slice(0, 2), 16);
    const g = parseInt(raw.slice(2, 4), 16);
    const b = parseInt(raw.slice(4, 6), 16);
    return { r, g, b };
}

function rgbaString(hex, alpha) {
    const rgb = hexToRgb(hex);
    if (!rgb) return null;
    const a = clamp01(alpha);
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
}

function parseUrlPaintId(value) {
    if (typeof value !== 'string') return null;
    const v = value.trim();
    const m = v.match(/^url\(\s*#?([^\)\s]+)\s*\)$/i);
    if (!m) return null;
    return m[1];
}

function parseObjectBoundingBoxCoord(raw, fallback) {
    if (raw === null || raw === undefined) return fallback;
    const s = String(raw).trim();
    if (s.length === 0) return fallback;
    if (/%$/.test(s)) {
        const n = toNumber(s.slice(0, -1));
        if (n === null) return fallback;
        return n / 100;
    }
    const n = toNumber(s);
    if (n === null) return fallback;
    // ObjectBoundingBox coords should be in [0..1]. Treat values outside that as unsupported.
    if (n < -0.001 || n > 1.001) return null;
    return n;
}

function parseStopOffset(raw) {
    if (raw === null || raw === undefined) return 0;
    const s = String(raw).trim();
    if (s.length === 0) return 0;
    if (/%$/.test(s)) {
        const n = toNumber(s.slice(0, -1));
        if (n === null) return 0;
        return Math.max(0, Math.min(100, n));
    }
    const n = toNumber(s);
    if (n === null) return 0;
    // SVG allows 0..1 offsets.
    return Math.max(0, Math.min(100, n * 100));
}

function parseUserSpaceCoord(raw) {
    // User-space coords are lengths; accept numbers and simple unit forms.
    return toLengthNumber(raw);
}

function resolveLinearGradientCss(doc, gradientId, options) {
    const grad = doc?.getElementById?.(gradientId);
    if (!grad) return { ok: false, reason: 'MISSING_GRADIENT' };
    if (String(grad.nodeName).toLowerCase() !== 'lineargradient') {
        return { ok: false, reason: 'UNSUPPORTED_GRADIENT_TYPE' };
    }

    const warnings = [];

    const units = grad.getAttribute('gradientUnits');
    const unitsTrimmed = typeof units === 'string' ? units.trim() : '';

    const gradientTransform = grad.getAttribute('gradientTransform');
    if (typeof gradientTransform === 'string' && gradientTransform.trim().length > 0) {
        const parsed = parseTranslationOnlyTransform(gradientTransform);
        if (!parsed.ok) {
            return { ok: false, reason: 'GRADIENT_TRANSFORM_UNSUPPORTED' };
        }
        // Translation-only gradientTransform cannot be faithfully represented by our current
        // gradient model (angle + stops), but it is safe to import directionally.
        // Keep deterministic by importing and surfacing a stable warning.
        if (parsed.tx !== 0 || parsed.ty !== 0) {
            warnings.push('WARN_GRADIENT_TRANSFORM_IGNORED');
        }
    }

    let x1;
    let y1;
    let x2;
    let y2;

    if (!unitsTrimmed || unitsTrimmed === 'objectBoundingBox') {
        x1 = parseObjectBoundingBoxCoord(grad.getAttribute('x1'), 0);
        y1 = parseObjectBoundingBoxCoord(grad.getAttribute('y1'), 0);
        x2 = parseObjectBoundingBoxCoord(grad.getAttribute('x2'), 1);
        y2 = parseObjectBoundingBoxCoord(grad.getAttribute('y2'), 0);
        if (x1 === null || y1 === null || x2 === null || y2 === null) {
            return { ok: false, reason: 'GRADIENT_COORDS_UNSUPPORTED' };
        }
    } else if (unitsTrimmed === 'userSpaceOnUse') {
        const bbox = options?.elementBBox;
        if (!bbox || !Number.isFinite(bbox.x) || !Number.isFinite(bbox.y) || !Number.isFinite(bbox.width) || !Number.isFinite(bbox.height) || bbox.width <= 0 || bbox.height <= 0) {
            return { ok: false, reason: 'MISSING_ELEMENT_BBOX' };
        }

        const ux1 = parseUserSpaceCoord(grad.getAttribute('x1'));
        const uy1 = parseUserSpaceCoord(grad.getAttribute('y1'));
        const ux2 = parseUserSpaceCoord(grad.getAttribute('x2'));
        const uy2 = parseUserSpaceCoord(grad.getAttribute('y2'));

        // Conservative: require explicit coords for userSpaceOnUse.
        if (ux1 === null || uy1 === null || ux2 === null || uy2 === null) {
            return { ok: false, reason: 'GRADIENT_COORDS_UNSUPPORTED' };
        }

        x1 = (ux1 - bbox.x) / bbox.width;
        y1 = (uy1 - bbox.y) / bbox.height;
        x2 = (ux2 - bbox.x) / bbox.width;
        y2 = (uy2 - bbox.y) / bbox.height;
    } else {
        return { ok: false, reason: 'GRADIENT_UNITS_UNSUPPORTED' };
    }

    const dx = x2 - x1;
    const dy = y2 - y1;
    const rad = Math.atan2(dy, dx);
    let deg = (rad * 180) / Math.PI;
    // Map SVG direction vector to CSS angle (0=up, 90=right).
    deg = deg + 90;
    deg = ((deg % 360) + 360) % 360;

    const stops = [];
    const stopEls = Array.from(grad.children || []).filter(c => String(c.nodeName).toLowerCase() === 'stop');
    for (const stopEl of stopEls) {
        const offset = parseStopOffset(stopEl.getAttribute('offset'));
        const stopColorRaw = stopEl.getAttribute('stop-color') ?? parseStyleAttribute(stopEl.getAttribute('style'))['stop-color'];
        const stopOpacityRaw = stopEl.getAttribute('stop-opacity') ?? parseStyleAttribute(stopEl.getAttribute('style'))['stop-opacity'];

        const parsed = parseColorToHexAndAlpha(stopColorRaw ?? '');
        if (!parsed || parsed.none) continue;
        const baseAlpha = parsed.alpha ?? 1;
        const stopOpacity = clamp01(toNumber(stopOpacityRaw) ?? 1);
        const alpha = clamp01(baseAlpha * stopOpacity);

        const cssColor = alpha < 1 ? (rgbaString(parsed.hex, alpha) ?? parsed.hex) : parsed.hex;
        stops.push({ offset, cssColor });
    }

    if (stops.length === 0) {
        return { ok: false, reason: 'NO_STOPS' };
    }

    const sorted = [...stops].sort((a, b) => a.offset - b.offset);
    const stopsStr = sorted.map(s => `${s.cssColor} ${s.offset}%`).join(', ');

    return { ok: true, css: `linear-gradient(${deg}deg, ${stopsStr})`, warnings };
}

function getPrimitiveLocalBBox(node) {
    const tag = String(node?.nodeName || '').toLowerCase();
    if (tag === 'rect') {
        const x = toNumber(node.getAttribute('x')) ?? 0;
        const y = toNumber(node.getAttribute('y')) ?? 0;
        const width = toNumber(node.getAttribute('width')) ?? 0;
        const height = toNumber(node.getAttribute('height')) ?? 0;
        return { x, y, width, height };
    }
    if (tag === 'circle') {
        const cx = toNumber(node.getAttribute('cx')) ?? 0;
        const cy = toNumber(node.getAttribute('cy')) ?? 0;
        const r = toNumber(node.getAttribute('r')) ?? 0;
        return { x: cx - r, y: cy - r, width: 2 * r, height: 2 * r };
    }
    if (tag === 'ellipse') {
        const cx = toNumber(node.getAttribute('cx')) ?? 0;
        const cy = toNumber(node.getAttribute('cy')) ?? 0;
        const rx = toNumber(node.getAttribute('rx')) ?? 0;
        const ry = toNumber(node.getAttribute('ry')) ?? 0;
        return { x: cx - rx, y: cy - ry, width: 2 * rx, height: 2 * ry };
    }
    return null;
}

function parseColorToHexAndAlpha(color) {
    if (typeof color !== 'string') return null;
    const c = color.trim();
    if (c.length === 0) return null;

    if (c.toLowerCase() === 'none') return { none: true };
    if (c.toLowerCase() === 'transparent') return { hex: '#000000', alpha: 0 };

    if (c.startsWith('#')) {
        const hex = normalizeHex6(c);
        if (!hex) return null;
        const alpha = parseHexAlpha(c);
        return { hex, alpha: alpha ?? 1 };
    }

    const rgbMatch = c.match(/^rgba?\(\s*([+-]?(?:\d+\.?\d*|\.\d+))\s*,\s*([+-]?(?:\d+\.?\d*|\.\d+))\s*,\s*([+-]?(?:\d+\.?\d*|\.\d+))(?:\s*,\s*([+-]?(?:\d+\.?\d*|\.\d+)))?\s*\)$/i);
    if (rgbMatch) {
        const r = toNumber(rgbMatch[1]) ?? 0;
        const g = toNumber(rgbMatch[2]) ?? 0;
        const b = toNumber(rgbMatch[3]) ?? 0;
        const a = rgbMatch[4] !== undefined ? clamp01(toNumber(rgbMatch[4]) ?? 1) : 1;
        return { hex: rgbToHex(r, g, b), alpha: a };
    }

    // Minimal named color support (common values).
    const named = {
        black: '#000000',
        white: '#ffffff',
        red: '#ff0000',
        green: '#00ff00',
        blue: '#0000ff'
    };
    const lower = c.toLowerCase();
    if (named[lower]) {
        return { hex: named[lower], alpha: 1 };
    }

    return null;
}

function parseStyleAttribute(styleAttr) {
    if (typeof styleAttr !== 'string') return {};
    const out = {};
    const parts = styleAttr.split(';');
    for (const part of parts) {
        const p = part.trim();
        if (!p) continue;
        const idx = p.indexOf(':');
        if (idx <= 0) continue;
        const k = p.slice(0, idx).trim().toLowerCase();
        const v = p.slice(idx + 1).trim();
        if (k) out[k] = v;
    }
    return out;
}

function getInheritedPresentation(node, name) {
    const key = String(name).toLowerCase();
    let cur = node;
    while (cur && cur.nodeType === 1) {
        const attr = cur.getAttribute?.(key);
        if (typeof attr === 'string' && attr.trim().length > 0) return attr.trim();

        const styleAttr = cur.getAttribute?.('style');
        if (typeof styleAttr === 'string' && styleAttr.trim().length > 0) {
            const style = parseStyleAttribute(styleAttr);
            if (style[key] !== undefined && String(style[key]).trim().length > 0) {
                return String(style[key]).trim();
            }
        }

        cur = cur.parentNode;
    }
    return null;
}

function resolvePaintForNode(node) {
    // SVG presentation attributes inherit; we approximate by walking ancestors.
    const fillRaw = getInheritedPresentation(node, 'fill');
    const fillOpacityRaw = getInheritedPresentation(node, 'fill-opacity');
    const strokeRaw = getInheritedPresentation(node, 'stroke');
    const strokeOpacityRaw = getInheritedPresentation(node, 'stroke-opacity');
    const opacityRaw = getInheritedPresentation(node, 'opacity');
    const strokeWidthRaw = getInheritedPresentation(node, 'stroke-width');
    const strokeLinecapRaw = getInheritedPresentation(node, 'stroke-linecap');
    const strokeLinejoinRaw = getInheritedPresentation(node, 'stroke-linejoin');
    const strokeMiterlimitRaw = getInheritedPresentation(node, 'stroke-miterlimit');
    const strokeDasharrayRaw = getInheritedPresentation(node, 'stroke-dasharray');
    const strokeDashoffsetRaw = getInheritedPresentation(node, 'stroke-dashoffset');

    const fillIsUrlPaint = typeof fillRaw === 'string' && /^url\(\s*#?/i.test(fillRaw.trim());
    const strokeIsUrlPaint = typeof strokeRaw === 'string' && /^url\(\s*#?/i.test(strokeRaw.trim());

    const overallOpacity = clamp01(toNumber(opacityRaw) ?? 1);
    const fillOpacity = clamp01(toNumber(fillOpacityRaw) ?? 1) * overallOpacity;
    const strokeOpacity = clamp01(toNumber(strokeOpacityRaw) ?? 1) * overallOpacity;

    const fillParsed = fillIsUrlPaint ? null : parseColorToHexAndAlpha(fillRaw ?? '');
    const strokeParsed = strokeIsUrlPaint ? null : parseColorToHexAndAlpha(strokeRaw ?? '');

    const fillNone = fillParsed?.none === true || (typeof fillRaw === 'string' && fillRaw.toLowerCase() === 'none');
    const strokeNone = strokeParsed?.none === true || (typeof strokeRaw === 'string' && strokeRaw.toLowerCase() === 'none');

    const fillAlpha = fillParsed?.alpha ?? 1;
    const strokeAlpha = strokeParsed?.alpha ?? 1;

    const fillColor = fillParsed?.hex ?? null;
    const strokeColor = strokeParsed?.hex ?? null;

    const strokeWidth = toLengthNumber(strokeWidthRaw) ?? (strokeNone ? 0 : 1);

    const strokeDasharray = typeof strokeDasharrayRaw === 'string' ? strokeDasharrayRaw.trim() : null;
    const strokeDashoffset = toLengthNumber(strokeDashoffsetRaw);
    const strokeLinecap = typeof strokeLinecapRaw === 'string' ? strokeLinecapRaw.trim().toLowerCase() : null;
    const strokeLinejoin = typeof strokeLinejoinRaw === 'string' ? strokeLinejoinRaw.trim().toLowerCase() : null;
    const strokeMiterlimit = toNumber(strokeMiterlimitRaw);

    return {
        fill: {
            none: fillNone,
            color: fillColor,
            opacity: clamp01(fillOpacity * fillAlpha)
        },
        stroke: {
            none: strokeNone,
            color: strokeColor,
            width: strokeWidth,
            opacity: clamp01(strokeOpacity * strokeAlpha),
            dashArray: strokeDasharray,
            dashOffset: strokeDashoffset,
            dashCap: strokeLinecap,
            join: strokeLinejoin,
            miterLimit: strokeMiterlimit
        },
        unsupported: {
            fillUrlPaint: fillIsUrlPaint,
            strokeUrlPaint: strokeIsUrlPaint
        },
        hadExplicitFill: fillRaw !== null,
        hadExplicitStroke: strokeRaw !== null
    };
}

function makeIdGenerator(idSeed) {
    const seed = typeof idSeed === 'string' && idSeed.length > 0 ? idSeed : 'imp';
    let n = 0;
    return () => `imp-${seed}-${++n}`;
}

function parseTranslationOnlyTransform(transform) {
    if (typeof transform !== 'string') return { ok: true, tx: 0, ty: 0 };
    const t = transform.trim();
    if (t.length === 0) return { ok: true, tx: 0, ty: 0 };

    // Very conservative: allow only a single translate(...) or a single matrix(...)
    // that represents pure translation.
    // Reject multi-part transforms like "translate(...) rotate(...)".
    const hasMultiple = /\)\s+\w+\s*\(/.test(t);
    if (hasMultiple) return { ok: false };

    const translateMatch = t.match(/^translate\(\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)\s*(?:[,\s]+\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?))?\s*\)$/i);
    if (translateMatch) {
        const tx = toNumber(translateMatch[1]) ?? 0;
        const ty = toNumber(translateMatch[2]) ?? 0;
        return { ok: true, tx, ty };
    }

    const matrixMatch = t.match(/^matrix\(\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)\s*(?:[,\s]+)\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)\s*(?:[,\s]+)\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)\s*(?:[,\s]+)\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)\s*(?:[,\s]+)\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)\s*(?:[,\s]+)\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)\s*\)$/i);
    if (matrixMatch) {
        const a = toNumber(matrixMatch[1]);
        const b = toNumber(matrixMatch[2]);
        const c = toNumber(matrixMatch[3]);
        const d = toNumber(matrixMatch[4]);
        const e = toNumber(matrixMatch[5]);
        const f = toNumber(matrixMatch[6]);

        // Pure translation matrix:
        // [1 0 0 1 e f]
        if (a === 1 && b === 0 && c === 0 && d === 1 && e !== null && f !== null) {
            return { ok: true, tx: e, ty: f };
        }
        return { ok: false };
    }

    return { ok: false };
}

function readNodeTranslation(node) {
    const t = node?.getAttribute?.('transform');
    return parseTranslationOnlyTransform(t);
}

function bboxForElements(elements) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const el of elements) {
        if (!el) continue;
        const x0 = el.x;
        const y0 = el.y;
        const x1 = el.x + el.width;
        const y1 = el.y + el.height;

        if (!Number.isFinite(x0) || !Number.isFinite(y0) || !Number.isFinite(x1) || !Number.isFinite(y1)) continue;

        minX = Math.min(minX, x0);
        minY = Math.min(minY, y0);
        maxX = Math.max(maxX, x1);
        maxY = Math.max(maxY, y1);
    }

    if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
        return null;
    }

    return { minX, minY, maxX, maxY };
}

/**
 * Attempt to import a sanitized SVG string into editable shape elements.
 *
 * @param {string} sanitizedSvg - Sanitized SVG markup.
 * @param {{centerX:number, centerY:number, idSeed?:string}} options
 * @returns {{ok:true,elements:any[],warnings:string[]} | {ok:false,reason:string,warnings:string[]}}
 */
export function importEditableShapesFromSanitizedSvg(sanitizedSvg, options) {
    if (typeof sanitizedSvg !== 'string' || sanitizedSvg.length === 0) {
        return { ok: false, reason: 'EMPTY_INPUT', warnings: [] };
    }

    const centerX = toNumber(options?.centerX);
    const centerY = toNumber(options?.centerY);
    if (centerX === null || centerY === null) {
        return { ok: false, reason: 'MISSING_CENTER', warnings: [] };
    }

    const makeId = makeIdGenerator(options?.idSeed);

    let doc;
    try {
        doc = new DOMParser().parseFromString(sanitizedSvg, 'image/svg+xml');
    } catch {
        return { ok: false, reason: 'PARSE_FAILED', warnings: [] };
    }

    const svg = doc?.documentElement;
    if (!svg || String(svg.nodeName).toLowerCase() !== 'svg') {
        return { ok: false, reason: 'NO_SVG_ROOT', warnings: [] };
    }

    const elements = [];

    const warnings = [];

    function styleForNode(node) {
        const paint = resolvePaintForNode(node);

        let fillGradientCss = null;
        if (paint.unsupported?.fillUrlPaint) {
            const fillRaw = getInheritedPresentation(node, 'fill');
            const gradId = parseUrlPaintId(fillRaw);
            if (gradId) {
                const bbox = getPrimitiveLocalBBox(node);
                const resolved = resolveLinearGradientCss(doc, gradId, { elementBBox: bbox });
                if (resolved.ok) {
                    fillGradientCss = resolved.css;
                    if (Array.isArray(resolved.warnings)) warnings.push(...resolved.warnings);
                } else {
                    warnings.push('WARN_GRADIENT_PAINT_UNSUPPORTED');
                }
            } else {
                warnings.push('WARN_GRADIENT_PAINT_UNSUPPORTED');
            }
        }

        let strokeGradientCss = null;
        if (paint.unsupported?.strokeUrlPaint) {
            const strokeRaw = getInheritedPresentation(node, 'stroke');
            const gradId = parseUrlPaintId(strokeRaw);
            if (gradId) {
                const bbox = getPrimitiveLocalBBox(node);
                const resolved = resolveLinearGradientCss(doc, gradId, { elementBBox: bbox });
                if (resolved.ok) {
                    strokeGradientCss = resolved.css;
                    if (Array.isArray(resolved.warnings)) warnings.push(...resolved.warnings);
                } else {
                    warnings.push('WARN_GRADIENT_PAINT_UNSUPPORTED');
                }
            } else {
                warnings.push('WARN_GRADIENT_PAINT_UNSUPPORTED');
            }
        }

        let fills = [];
        if (fillGradientCss) {
            fills = [{
                type: 'gradient',
                value: fillGradientCss,
                opacity: clampOpacity100(paint.fill.opacity * 100),
                visible: true,
                blendMode: 'normal'
            }];
        } else if (paint.unsupported?.fillUrlPaint) {
            // url(#...) fill paint but not importable (unsupported gradient type/coords/transform)
            // Deterministic fallback so the element stays visible.
            fills = [{ type: 'solid', value: '#808080', color: '#808080', opacity: 100, visible: true, blendMode: 'normal' }];
        } else if (!paint.fill.none) {
            let color = paint.fill.color;
            // If fill is unspecified or unparseable but stroke exists, allow empty fills.
            if (!color) {
                if (paint.hadExplicitFill) {
                    if (paint.unsupported?.fillUrlPaint) {
                        // Already handled above.
                        color = null;
                    } else {
                        warnings.push('WARN_UNSUPPORTED_COLOR');
                        color = '#808080';
                    }
                } else {
                    // No explicit fill. Keep empty unless there is no visible stroke either.
                    color = null;
                }
            }
            if (color) {
                fills = [{
                    type: 'solid',
                    value: color,
                    color,
                    opacity: clampOpacity100(paint.fill.opacity * 100),
                    visible: true,
                    blendMode: 'normal'
                }];
            }
        }

        let strokes = [];
        if (!paint.stroke.none && (strokeGradientCss || paint.stroke.color) && paint.stroke.width > 0) {
            const dashArray = paint.stroke.dashArray;
            const dashArrayNormalized = typeof dashArray === 'string' && dashArray.length > 0
                ? dashArray.replace(/,/g, ' ').trim()
                : null;
            const isDashed = dashArrayNormalized && dashArrayNormalized.toLowerCase() !== 'none';

            const baseStroke = {
                width: paint.stroke.width,
                position: 'center',
                opacity: clampOpacity100(paint.stroke.opacity * 100),
                visible: true,
                blendMode: 'normal',
                style: isDashed ? 'custom' : undefined,
                dashArray: isDashed ? dashArrayNormalized : undefined,
                dashOffset: Number.isFinite(paint.stroke.dashOffset) ? paint.stroke.dashOffset : undefined,
                dashCap: paint.stroke.dashCap || undefined,
                join: paint.stroke.join || undefined,
                miterLimit: paint.stroke.miterLimit || undefined
            };

            if (strokeGradientCss) {
                strokes = [{
                    type: 'gradient',
                    value: strokeGradientCss,
                    ...baseStroke
                }];
            } else {
                strokes = [{
                    type: 'solid',
                    color: paint.stroke.color,
                    ...baseStroke
                }];
            }
        }

        // Ensure imported primitives are visible when SVG provides no usable paint.
        if (fills.length === 0 && strokes.length === 0) {
            fills = [{ type: 'solid', value: '#808080', color: '#808080', opacity: 100, visible: true, blendMode: 'normal' }];
        }

        return { fills, strokes };
    }

    function walk(node, accumulated) {
        if (!node) return;
        if (node.nodeType !== 1) return;

        const local = readNodeTranslation(node);
        if (!local.ok) {
            throw new Error('TRANSFORM_UNSUPPORTED');
        }

        const nextAccumulated = {
            tx: accumulated.tx + local.tx,
            ty: accumulated.ty + local.ty
        };

        const tag = String(node.nodeName).toLowerCase();

        if (tag === 'rect') {
            const x = (toNumber(node.getAttribute('x')) ?? 0) + nextAccumulated.tx;
            const y = (toNumber(node.getAttribute('y')) ?? 0) + nextAccumulated.ty;
            const width = toNumber(node.getAttribute('width')) ?? 0;
            const height = toNumber(node.getAttribute('height')) ?? 0;
            if (width > 0 && height > 0) {
                const { fills, strokes } = styleForNode(node);
                const rx = toNumber(node.getAttribute('rx')) ?? null;
                const ry = toNumber(node.getAttribute('ry')) ?? null;
                const borderRadius = rx !== null || ry !== null ? Math.max(0, Math.min(rx ?? ry ?? 0, ry ?? rx ?? 0)) : 0;

                elements.push({
                    id: makeId(),
                    type: 'shape',
                    shape: 'rectangle',
                    shapeKind: 'rectangle',
                    x,
                    y,
                    width,
                    height,
                    rotation: 0,
                    borderRadius,
                    style: { fills, strokes }
                });
            }
        } else if (tag === 'circle') {
            const cx = (toNumber(node.getAttribute('cx')) ?? 0) + nextAccumulated.tx;
            const cy = (toNumber(node.getAttribute('cy')) ?? 0) + nextAccumulated.ty;
            const r = toNumber(node.getAttribute('r')) ?? 0;
            if (r > 0) {
                const { fills, strokes } = styleForNode(node);
                elements.push({
                    id: makeId(),
                    type: 'shape',
                    shape: 'ellipse',
                    shapeKind: 'ellipse',
                    x: cx - r,
                    y: cy - r,
                    width: 2 * r,
                    height: 2 * r,
                    rotation: 0,
                    style: { fills, strokes }
                });
            }
        } else if (tag === 'ellipse') {
            const cx = (toNumber(node.getAttribute('cx')) ?? 0) + nextAccumulated.tx;
            const cy = (toNumber(node.getAttribute('cy')) ?? 0) + nextAccumulated.ty;
            const rx = toNumber(node.getAttribute('rx')) ?? 0;
            const ry = toNumber(node.getAttribute('ry')) ?? 0;
            if (rx > 0 && ry > 0) {
                const { fills, strokes } = styleForNode(node);
                elements.push({
                    id: makeId(),
                    type: 'shape',
                    shape: 'ellipse',
                    shapeKind: 'ellipse',
                    x: cx - rx,
                    y: cy - ry,
                    width: 2 * rx,
                    height: 2 * ry,
                    rotation: 0,
                    style: { fills, strokes }
                });
            }
        }

        // Preserve document order by walking children in DOM order.
        for (const child of node.children || []) {
            walk(child, nextAccumulated);
        }
    }

    try {
        walk(svg, { tx: 0, ty: 0 });
    } catch (e) {
        if (e && e.message === 'TRANSFORM_UNSUPPORTED') {
            return { ok: false, reason: 'TRANSFORM_UNSUPPORTED', warnings: ['WARN_TRANSFORM_BAKED'] };
        }
        return { ok: false, reason: 'IMPORT_FAILED', warnings: [] };
    }

    if (elements.length === 0) {
        return { ok: false, reason: 'NO_SUPPORTED_PRIMITIVES', warnings: [] };
    }

    const bbox = bboxForElements(elements);
    if (!bbox) {
        return { ok: false, reason: 'BBOX_FAILED', warnings: [] };
    }

    const bboxCenterX = (bbox.minX + bbox.maxX) / 2;
    const bboxCenterY = (bbox.minY + bbox.maxY) / 2;
    const dx = centerX - bboxCenterX;
    const dy = centerY - bboxCenterY;

    const moved = elements.map(el => ({
        ...el,
        x: el.x + dx,
        y: el.y + dy
    }));

    const uniqueWarnings = Array.from(new Set(warnings));
    return { ok: true, elements: moved, warnings: uniqueWarnings };
}
