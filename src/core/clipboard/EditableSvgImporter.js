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

import { Transform2D } from '../shapes/Transform2D.js';
import { BlendModes } from '../constants/BlendModes.js';

const SUPPORTED_BLEND_MODE_IDS = new Set((BlendModes || []).map((m) => m?.id).filter(Boolean));

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
    const m = v.match(/^url\(\s*#?([^\s)]+)\s*\)$/i);
    if (!m) return null;
    return m[1];
}

function parseUrlRefId(value) {
    // Accept url(#id) and url(id) forms.
    if (typeof value !== 'string') return null;
    const v = value.trim();
    const m = v.match(/^url\(\s*#?([^\s)]+)\s*\)$/i);
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

function getHrefIdFromGradient(gradientEl) {
    if (!gradientEl?.getAttribute) return null;
    const raw = gradientEl.getAttribute('href') ?? gradientEl.getAttribute('xlink:href');
    if (typeof raw !== 'string') return null;
    const s = raw.trim();
    if (s.length === 0) return null;
    // Common forms: "#id" or "id".
    return s.startsWith('#') ? s.slice(1) : s;
}

function resolveGradientInheritanceChain(doc, gradientEl, expectedTagLower) {
    // Conservative: follow a small href chain and inherit missing attrs/stops.
    const chain = [];
    const seen = new Set();
    let current = gradientEl;
    for (let depth = 0; depth < 8; depth++) {
        if (!current) break;
        chain.push(current);

        const hrefId = getHrefIdFromGradient(current);
        if (!hrefId) break;
        if (seen.has(hrefId)) return { ok: false, reason: 'GRADIENT_HREF_CYCLE' };
        seen.add(hrefId);

        const next = doc?.getElementById?.(hrefId);
        if (!next || String(next.nodeName).toLowerCase() !== expectedTagLower) {
            return { ok: false, reason: 'GRADIENT_HREF_UNSUPPORTED' };
        }
        current = next;
    }
    return { ok: true, chain };
}

function inheritedGradientAttr(chain, name) {
    for (const el of chain) {
        const v = el?.getAttribute?.(name);
        if (typeof v === 'string' && v.trim().length > 0) return v;
    }
    return null;
}

function inheritedGradientStops(chain) {
    for (const el of chain) {
        const stops = Array.from(el?.children || []).filter(c => String(c.nodeName).toLowerCase() === 'stop');
        if (stops.length > 0) return stops;
    }
    return [];
}

function resolveLinearGradientCss(doc, gradientId, options) {
    const grad = doc?.getElementById?.(gradientId);
    if (!grad) return { ok: false, reason: 'MISSING_GRADIENT' };
    if (String(grad.nodeName).toLowerCase() !== 'lineargradient') {
        return { ok: false, reason: 'UNSUPPORTED_GRADIENT_TYPE' };
    }

    const inh = resolveGradientInheritanceChain(doc, grad, 'lineargradient');
    if (!inh.ok) return { ok: false, reason: inh.reason };
    const chain = inh.chain;

    const warnings = [];

    const spreadMethodRaw = inheritedGradientAttr(chain, 'spreadMethod');
    const spreadMethod = typeof spreadMethodRaw === 'string' ? spreadMethodRaw.trim().toLowerCase() : '';
    let cssFunction = 'linear-gradient';
    if (spreadMethod === 'repeat') {
        cssFunction = 'repeating-linear-gradient';
    } else if (spreadMethod && spreadMethod !== 'pad') {
        // CSS doesn't support SVG's reflect spread method.
        warnings.push('WARN_GRADIENT_SPREADMETHOD_UNSUPPORTED');
    }

    const units = inheritedGradientAttr(chain, 'gradientUnits');
    const unitsTrimmed = typeof units === 'string' ? units.trim() : '';

    const gradientTransform = inheritedGradientAttr(chain, 'gradientTransform');
    let gradientAxisTransform = { sx: 1, sy: 1, tx: 0, ty: 0 };
    if (typeof gradientTransform === 'string' && gradientTransform.trim().length > 0) {
        const parsed = parseScaleTranslateOnlyTransform(gradientTransform);
        if (!parsed.ok) {
            return { ok: false, reason: 'GRADIENT_TRANSFORM_UNSUPPORTED' };
        }
        gradientAxisTransform = { sx: parsed.sx, sy: parsed.sy, tx: parsed.tx, ty: parsed.ty };
        // Even when axis-aligned, gradientTransform cannot be fully represented by our current
        // gradient model (angle + stops). We apply it only to the direction vector and keep
        // deterministic by importing and surfacing a stable warning when it is non-identity.
        if (parsed.tx !== 0 || parsed.ty !== 0 || parsed.sx !== 1 || parsed.sy !== 1) {
            warnings.push('WARN_GRADIENT_TRANSFORM_IGNORED');
        }
    }

    let x1;
    let y1;
    let x2;
    let y2;

    if (!unitsTrimmed || unitsTrimmed === 'objectBoundingBox') {
        x1 = parseObjectBoundingBoxCoord(inheritedGradientAttr(chain, 'x1'), 0);
        y1 = parseObjectBoundingBoxCoord(inheritedGradientAttr(chain, 'y1'), 0);
        x2 = parseObjectBoundingBoxCoord(inheritedGradientAttr(chain, 'x2'), 1);
        y2 = parseObjectBoundingBoxCoord(inheritedGradientAttr(chain, 'y2'), 0);
        if (x1 === null || y1 === null || x2 === null || y2 === null) {
            return { ok: false, reason: 'GRADIENT_COORDS_UNSUPPORTED' };
        }

        // Apply gradientTransform in objectBoundingBox space.
        x1 = x1 * gradientAxisTransform.sx + gradientAxisTransform.tx;
        y1 = y1 * gradientAxisTransform.sy + gradientAxisTransform.ty;
        x2 = x2 * gradientAxisTransform.sx + gradientAxisTransform.tx;
        y2 = y2 * gradientAxisTransform.sy + gradientAxisTransform.ty;
    } else if (unitsTrimmed === 'userSpaceOnUse') {
        const bbox = options?.elementBBox;
        const userSpaceTransform = options?.userSpaceTransform;
        const t = asTransform2D(userSpaceTransform);
        if (!bbox || !Number.isFinite(bbox.x) || !Number.isFinite(bbox.y) || !Number.isFinite(bbox.width) || !Number.isFinite(bbox.height) || bbox.width <= 0 || bbox.height <= 0) {
            return { ok: false, reason: 'MISSING_ELEMENT_BBOX' };
        }

        const ux1 = parseUserSpaceCoord(inheritedGradientAttr(chain, 'x1'));
        const uy1 = parseUserSpaceCoord(inheritedGradientAttr(chain, 'y1'));
        const ux2 = parseUserSpaceCoord(inheritedGradientAttr(chain, 'x2'));
        const uy2 = parseUserSpaceCoord(inheritedGradientAttr(chain, 'y2'));

        // Conservative: require explicit coords for userSpaceOnUse.
        if (ux1 === null || uy1 === null || ux2 === null || uy2 === null) {
            return { ok: false, reason: 'GRADIENT_COORDS_UNSUPPORTED' };
        }

        // Apply gradientTransform in user space before applying root user-space bake.
        const ux1g = ux1 * gradientAxisTransform.sx + gradientAxisTransform.tx;
        const uy1g = uy1 * gradientAxisTransform.sy + gradientAxisTransform.ty;
        const ux2g = ux2 * gradientAxisTransform.sx + gradientAxisTransform.tx;
        const uy2g = uy2 * gradientAxisTransform.sy + gradientAxisTransform.ty;

        const p1 = t.applyToPoint({ x: ux1g, y: uy1g });
        const p2 = t.applyToPoint({ x: ux2g, y: uy2g });

        x1 = (p1.x - bbox.x) / bbox.width;
        y1 = (p1.y - bbox.y) / bbox.height;
        x2 = (p2.x - bbox.x) / bbox.width;
        y2 = (p2.y - bbox.y) / bbox.height;
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
    const stopEls = inheritedGradientStops(chain);
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

    return { ok: true, css: `${cssFunction}(${deg}deg, ${stopsStr})`, warnings };
}

function resolveRadialGradientCss(doc, gradientId, options) {
    const grad = doc?.getElementById?.(gradientId);
    if (!grad) return { ok: false, reason: 'MISSING_GRADIENT' };
    if (String(grad.nodeName).toLowerCase() !== 'radialgradient') {
        return { ok: false, reason: 'UNSUPPORTED_GRADIENT_TYPE' };
    }

    const inh = resolveGradientInheritanceChain(doc, grad, 'radialgradient');
    if (!inh.ok) return { ok: false, reason: inh.reason };
    const chain = inh.chain;

    const warnings = [];

    const spreadMethodRaw = inheritedGradientAttr(chain, 'spreadMethod');
    const spreadMethod = typeof spreadMethodRaw === 'string' ? spreadMethodRaw.trim().toLowerCase() : '';
    let cssFunction = 'radial-gradient';
    if (spreadMethod === 'repeat') {
        cssFunction = 'repeating-radial-gradient';
    } else if (spreadMethod && spreadMethod !== 'pad') {
        warnings.push('WARN_GRADIENT_SPREADMETHOD_UNSUPPORTED');
    }

    const units = inheritedGradientAttr(chain, 'gradientUnits');
    const unitsTrimmed = typeof units === 'string' ? units.trim() : '';

    const gradientTransform = inheritedGradientAttr(chain, 'gradientTransform');
    let gradientAxisTransform = { sx: 1, sy: 1, tx: 0, ty: 0 };
    if (typeof gradientTransform === 'string' && gradientTransform.trim().length > 0) {
        const parsed = parseScaleTranslateOnlyTransform(gradientTransform);
        if (!parsed.ok) {
            return { ok: false, reason: 'GRADIENT_TRANSFORM_UNSUPPORTED' };
        }
        gradientAxisTransform = { sx: parsed.sx, sy: parsed.sy, tx: parsed.tx, ty: parsed.ty };
    }

    let cx;
    let cy;
    let rx;
    let ry;

    if (!unitsTrimmed || unitsTrimmed === 'objectBoundingBox') {
        const cx0 = parseObjectBoundingBoxCoord(inheritedGradientAttr(chain, 'cx'), 0.5);
        const cy0 = parseObjectBoundingBoxCoord(inheritedGradientAttr(chain, 'cy'), 0.5);
        const r0 = parseObjectBoundingBoxCoord(inheritedGradientAttr(chain, 'r'), 0.5);
        if (cx0 === null || cy0 === null || r0 === null) {
            return { ok: false, reason: 'GRADIENT_COORDS_UNSUPPORTED' };
        }

        const fxAttr = inheritedGradientAttr(chain, 'fx');
        const fyAttr = inheritedGradientAttr(chain, 'fy');
        const fx0 = fxAttr == null ? cx0 : parseObjectBoundingBoxCoord(fxAttr, cx0);
        const fy0 = fyAttr == null ? cy0 : parseObjectBoundingBoxCoord(fyAttr, cy0);
        if (fx0 === null || fy0 === null) {
            return { ok: false, reason: 'GRADIENT_COORDS_UNSUPPORTED' };
        }
        // Conservative subset: only support centered focal point.
        if (Math.abs(fx0 - cx0) > 1e-6 || Math.abs(fy0 - cy0) > 1e-6) {
            return { ok: false, reason: 'GRADIENT_FOCAL_UNSUPPORTED' };
        }

        const cx1 = cx0 * gradientAxisTransform.sx + gradientAxisTransform.tx;
        const cy1 = cy0 * gradientAxisTransform.sy + gradientAxisTransform.ty;

        const rx1 = r0 * Math.abs(gradientAxisTransform.sx);
        const ry1 = r0 * Math.abs(gradientAxisTransform.sy);
        if (!Number.isFinite(rx1) || !Number.isFinite(ry1) || rx1 <= 0 || ry1 <= 0) {
            return { ok: false, reason: 'GRADIENT_COORDS_UNSUPPORTED' };
        }

        cx = cx1;
        cy = cy1;
        rx = rx1;
        ry = ry1;
    } else if (unitsTrimmed === 'userSpaceOnUse') {
        const bbox = options?.elementBBox;
        const userSpaceTransform = options?.userSpaceTransform;
        const t = asTransform2D(userSpaceTransform);
        if (!bbox || !Number.isFinite(bbox.x) || !Number.isFinite(bbox.y) || !Number.isFinite(bbox.width) || !Number.isFinite(bbox.height) || bbox.width <= 0 || bbox.height <= 0) {
            return { ok: false, reason: 'MISSING_ELEMENT_BBOX' };
        }

        const ucx = parseUserSpaceCoord(inheritedGradientAttr(chain, 'cx'));
        const ucy = parseUserSpaceCoord(inheritedGradientAttr(chain, 'cy'));
        const ur = parseUserSpaceCoord(inheritedGradientAttr(chain, 'r'));
        // Conservative: require explicit coords for userSpaceOnUse.
        if (ucx === null || ucy === null || ur === null) {
            return { ok: false, reason: 'GRADIENT_COORDS_UNSUPPORTED' };
        }

        const fxAttr = inheritedGradientAttr(chain, 'fx');
        const fyAttr = inheritedGradientAttr(chain, 'fy');
        const ufx = fxAttr == null ? ucx : parseUserSpaceCoord(fxAttr);
        const ufy = fyAttr == null ? ucy : parseUserSpaceCoord(fyAttr);
        if (ufx === null || ufy === null) {
            return { ok: false, reason: 'GRADIENT_COORDS_UNSUPPORTED' };
        }
        if (Math.abs(ufx - ucx) > 1e-6 || Math.abs(ufy - ucy) > 1e-6) {
            return { ok: false, reason: 'GRADIENT_FOCAL_UNSUPPORTED' };
        }

        // Apply gradientTransform in user space before applying root user-space bake.
        const gcx = ucx * gradientAxisTransform.sx + gradientAxisTransform.tx;
        const gcy = ucy * gradientAxisTransform.sy + gradientAxisTransform.ty;
        const grx = ur * Math.abs(gradientAxisTransform.sx);
        const gry = ur * Math.abs(gradientAxisTransform.sy);
        if (!Number.isFinite(grx) || !Number.isFinite(gry) || grx <= 0 || gry <= 0) {
            return { ok: false, reason: 'GRADIENT_COORDS_UNSUPPORTED' };
        }

        const pc = t.applyToPoint({ x: gcx, y: gcy });
        const px = t.applyToPoint({ x: gcx + grx, y: gcy });
        const py = t.applyToPoint({ x: gcx, y: gcy + gry });
        const vx = { x: px.x - pc.x, y: px.y - pc.y };
        const vy = { x: py.x - pc.x, y: py.y - pc.y };

        cx = (pc.x - bbox.x) / bbox.width;
        cy = (pc.y - bbox.y) / bbox.height;
        rx = Math.hypot(vx.x, vx.y) / bbox.width;
        ry = Math.hypot(vy.x, vy.y) / bbox.height;
    } else {
        return { ok: false, reason: 'GRADIENT_UNITS_UNSUPPORTED' };
    }

    const stops = [];
    const stopEls = inheritedGradientStops(chain);
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

    const cxPct = cx * 100;
    const cyPct = cy * 100;
    const rxPct = rx * 100;
    const ryPct = ry * 100;
    if (![cxPct, cyPct, rxPct, ryPct].every(Number.isFinite)) {
        return { ok: false, reason: 'GRADIENT_COORDS_UNSUPPORTED' };
    }

    return {
        ok: true,
        css: `${cssFunction}(ellipse ${rxPct}% ${ryPct}% at ${cxPct}% ${cyPct}%, ${stopsStr})`,
        warnings
    };
}

function resolveUrlPaintCss(doc, paintId, options) {
    const el = doc?.getElementById?.(paintId);
    if (!el) return { ok: false, reason: 'MISSING_PAINT' };
    const tag = String(el.nodeName).toLowerCase();
    if (tag === 'lineargradient') return resolveLinearGradientCss(doc, paintId, options);
    if (tag === 'radialgradient') return resolveRadialGradientCss(doc, paintId, options);
    return { ok: false, reason: 'UNSUPPORTED_PAINT_TYPE' };
}

function svgToDataUri(svgMarkup) {
    const s = String(svgMarkup ?? '');
    // Deterministic encode; keep compact and stable across platforms.
    const encoded = encodeURIComponent(s)
        .replace(/%0A/g, '')
        .replace(/%0D/g, '')
        .replace(/%09/g, '')
        .replace(/%20/g, ' ');
    return `data:image/svg+xml,${encoded}`;
}

function getHrefIdFromPattern(patternEl) {
    if (!patternEl?.getAttribute) return null;
    const raw = patternEl.getAttribute('href') ?? patternEl.getAttribute('xlink:href');
    if (typeof raw !== 'string') return null;
    const s = raw.trim();
    if (s.length === 0) return null;
    // Common forms: "#id" or "id".
    return s.startsWith('#') ? s.slice(1) : s;
}

function resolvePatternInheritanceChain(doc, patternEl) {
    // Conservative: follow a small href chain and inherit missing attrs/children.
    const chain = [];
    const seen = new Set();
    let current = patternEl;
    for (let depth = 0; depth < 8; depth++) {
        if (!current) break;
        chain.push(current);

        const hrefId = getHrefIdFromPattern(current);
        if (!hrefId) break;
        if (seen.has(hrefId)) return { ok: false, reason: 'PATTERN_HREF_CYCLE' };
        seen.add(hrefId);

        const next = doc?.getElementById?.(hrefId);
        if (!next || String(next.nodeName).toLowerCase() !== 'pattern') {
            return { ok: false, reason: 'PATTERN_HREF_UNSUPPORTED' };
        }
        current = next;
    }
    return { ok: true, chain };
}

function inheritedPatternAttr(chain, name) {
    for (const el of chain) {
        const v = el?.getAttribute?.(name);
        if (typeof v === 'string' && v.trim().length > 0) return v;
    }
    return null;
}

function inheritedPatternChildren(chain) {
    for (const el of chain) {
        const kids = Array.from(el?.children || []);
        if (kids.length > 0) return kids;
    }
    return [];
}

function resolvePatternPaintFill(doc, patternId, options) {
    const p0 = doc?.getElementById?.(patternId);
    if (!p0) return { ok: false, reason: 'MISSING_PATTERN' };
    if (String(p0.nodeName).toLowerCase() !== 'pattern') {
        return { ok: false, reason: 'UNSUPPORTED_PATTERN_TYPE' };
    }

    const inh = resolvePatternInheritanceChain(doc, p0);
    if (!inh.ok) return { ok: false, reason: inh.reason };
    const chain = inh.chain;

    const units = inheritedPatternAttr(chain, 'patternUnits');
    const unitsTrimmed = typeof units === 'string' ? units.trim() : '';
    // Spec default for patternUnits is objectBoundingBox.
    const unitsEffective = unitsTrimmed || 'objectBoundingBox';

    const patternTransform = inheritedPatternAttr(chain, 'patternTransform');
    let patternAxisTransform = { sx: 1, sy: 1, tx: 0, ty: 0 };
    if (typeof patternTransform === 'string' && patternTransform.trim().length > 0) {
        // Conservative: allow axis-aligned translate/scale/matrix only (no rotate/skew).
        const parsed = parseScaleTranslateOnlyTransform(patternTransform);
        if (!parsed.ok) {
            return { ok: false, reason: 'PATTERN_TRANSFORM_UNSUPPORTED' };
        }

        if (unitsEffective === 'objectBoundingBox') {
            // Conservative: for objectBoundingBox, only support positive scales.
            // Negative scales would mirror the pattern and require additional handling.
            if (!(parsed.sx > 0 && parsed.sy > 0)) {
                return { ok: false, reason: 'PATTERN_TRANSFORM_UNSUPPORTED' };
            }
        }
        patternAxisTransform = { sx: parsed.sx, sy: parsed.sy, tx: parsed.tx, ty: parsed.ty };
    }

    const bbox = options?.elementBBox;
    const userSpaceTransform = options?.userSpaceTransform;
    const t = asTransform2D(userSpaceTransform);
    const basisXLen = Math.hypot(t.a, t.b);
    const basisYLen = Math.hypot(t.c, t.d);

    if (!bbox || !Number.isFinite(bbox.x) || !Number.isFinite(bbox.y) || !Number.isFinite(bbox.width) || !Number.isFinite(bbox.height) || bbox.width <= 0 || bbox.height <= 0) {
        return { ok: false, reason: 'MISSING_ELEMENT_BBOX' };
    }

    let tileWidth;
    let tileHeight;
    let tileOffsetX;
    let tileOffsetY;
    let tileSvg;

    if (unitsEffective === 'userSpaceOnUse') {
        const x = parseUserSpaceCoord(inheritedPatternAttr(chain, 'x')) ?? 0;
        const y = parseUserSpaceCoord(inheritedPatternAttr(chain, 'y')) ?? 0;
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
            return { ok: false, reason: 'PATTERN_COORDS_UNSUPPORTED' };
        }

        // Apply patternTransform in pattern/user space.
        const xpt = x * patternAxisTransform.sx + patternAxisTransform.tx;
        const ypt = y * patternAxisTransform.sy + patternAxisTransform.ty;

        // Apply the same user-space bake as geometry so pattern coords remain comparable.
        const p0t = t.applyToPoint({ x: xpt, y: ypt });
        const xt = p0t.x;
        const yt = p0t.y;
        if (!Number.isFinite(xt) || !Number.isFinite(yt)) {
            return { ok: false, reason: 'PATTERN_COORDS_UNSUPPORTED' };
        }

        const width = parseUserSpaceCoord(inheritedPatternAttr(chain, 'width'));
        const height = parseUserSpaceCoord(inheritedPatternAttr(chain, 'height'));
        if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
            return { ok: false, reason: 'PATTERN_SIZE_UNSUPPORTED' };
        }

        // Apply patternTransform scale to the tile size.
        const wpt = width * Math.abs(patternAxisTransform.sx);
        const hpt = height * Math.abs(patternAxisTransform.sy);

        // Scale tile dimensions along with baked geometry. Translation does not affect size.
        tileWidth = wpt * basisXLen;
        tileHeight = hpt * basisYLen;
        if (!Number.isFinite(tileWidth) || !Number.isFinite(tileHeight) || tileWidth <= 0 || tileHeight <= 0) {
            return { ok: false, reason: 'PATTERN_SIZE_UNSUPPORTED' };
        }

        tileOffsetX = xt - bbox.x;
        tileOffsetY = yt - bbox.y;

        // Serialize pattern children into a standalone tile SVG.
        let serializedChildren = '';
        try {
            const serializer = new XMLSerializer();
            const children = inheritedPatternChildren(chain);
            serializedChildren = children.map((c) => serializer.serializeToString(c)).join('');
        } catch {
            return { ok: false, reason: 'PATTERN_SERIALIZE_FAILED' };
        }

        tileSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${serializedChildren}</svg>`;
    } else if (unitsEffective === 'objectBoundingBox') {
        const contentUnits = inheritedPatternAttr(chain, 'patternContentUnits');
        const contentUnitsTrimmed = typeof contentUnits === 'string' ? contentUnits.trim() : '';
        const contentUnitsEffective = contentUnitsTrimmed || 'objectBoundingBox';
        if (contentUnitsEffective !== 'objectBoundingBox' && contentUnitsEffective !== 'userSpaceOnUse') {
            return { ok: false, reason: 'PATTERN_CONTENT_UNITS_UNSUPPORTED' };
        }

        const xFrac = parseObjectBoundingBoxCoord(inheritedPatternAttr(chain, 'x'), 0);
        const yFrac = parseObjectBoundingBoxCoord(inheritedPatternAttr(chain, 'y'), 0);
        const wFrac = parseObjectBoundingBoxCoord(inheritedPatternAttr(chain, 'width'), null);
        const hFrac = parseObjectBoundingBoxCoord(inheritedPatternAttr(chain, 'height'), null);
        if (xFrac === null || yFrac === null || wFrac === null || hFrac === null) {
            return { ok: false, reason: 'PATTERN_COORDS_UNSUPPORTED' };
        }

        // Apply axis-aligned patternTransform in objectBoundingBox space.
        const xFracT = xFrac * patternAxisTransform.sx + patternAxisTransform.tx;
        const yFracT = yFrac * patternAxisTransform.sy + patternAxisTransform.ty;
        const wFracT = wFrac * patternAxisTransform.sx;
        const hFracT = hFrac * patternAxisTransform.sy;
        if (![xFracT, yFracT, wFracT, hFracT].every(Number.isFinite)) {
            return { ok: false, reason: 'PATTERN_COORDS_UNSUPPORTED' };
        }

        if (wFracT <= 0 || hFracT <= 0) {
            return { ok: false, reason: 'PATTERN_SIZE_UNSUPPORTED' };
        }

        tileWidth = bbox.width * wFracT;
        tileHeight = bbox.height * hFracT;
        if (!Number.isFinite(tileWidth) || !Number.isFinite(tileHeight) || tileWidth <= 0 || tileHeight <= 0) {
            return { ok: false, reason: 'PATTERN_SIZE_UNSUPPORTED' };
        }

        tileOffsetX = bbox.width * xFracT;
        tileOffsetY = bbox.height * yFracT;
        if (!Number.isFinite(tileOffsetX) || !Number.isFinite(tileOffsetY)) {
            return { ok: false, reason: 'PATTERN_COORDS_UNSUPPORTED' };
        }

        let serializedChildren = '';
        try {
            const serializer = new XMLSerializer();
            const children = inheritedPatternChildren(chain);
            serializedChildren = children.map((c) => serializer.serializeToString(c)).join('');
        } catch {
            return { ok: false, reason: 'PATTERN_SERIALIZE_FAILED' };
        }

        // Use a normalized 0..1 tile; renderer scales to tileWidth/tileHeight.
        if (contentUnitsEffective === 'objectBoundingBox') {
            tileSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1" viewBox="0 0 1 1">${serializedChildren}</svg>`;
        } else {
            // patternContentUnits=userSpaceOnUse: children coordinates are in the referencing element's user space.
            // Normalize user-space coordinates into the tile rectangle in baked geometry space.
            const tileOriginX = bbox.x + tileOffsetX;
            const tileOriginY = bbox.y + tileOffsetY;
            const fmt = (v) => String(Math.round(v * 1e6) / 1e6);

            if (!isAxisAlignedTransform(t)) {
                return { ok: false, reason: 'PATTERN_COORDS_UNSUPPORTED' };
            }

            const a = t.a / tileWidth;
            const d = t.d / tileHeight;
            const e = (t.e - tileOriginX) / tileWidth;
            const f = (t.f - tileOriginY) / tileHeight;
            if (![a, d, e, f].every(Number.isFinite)) {
                return { ok: false, reason: 'PATTERN_COORDS_UNSUPPORTED' };
            }

            const matrix = `matrix(${fmt(a)} 0 0 ${fmt(d)} ${fmt(e)} ${fmt(f)})`;
            tileSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1" viewBox="0 0 1 1"><g transform="${matrix}">${serializedChildren}</g></svg>`;
        }
    } else {
        return { ok: false, reason: 'PATTERN_UNITS_UNSUPPORTED' };
    }
    const dataUri = svgToDataUri(tileSvg);

    return {
        ok: true,
        fill: {
            type: 'image',
            value: dataUri,
            opacity: 100,
            visible: true,
            blendMode: 'normal',
            repeat: 'repeat',
            tileWidth,
            tileHeight,
            tileOffsetX,
            tileOffsetY
        }
    };
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
    if (tag === 'line') {
        const x1 = toNumber(node.getAttribute('x1')) ?? 0;
        const y1 = toNumber(node.getAttribute('y1')) ?? 0;
        const x2 = toNumber(node.getAttribute('x2')) ?? 0;
        const y2 = toNumber(node.getAttribute('y2')) ?? 0;
        const minX = Math.min(x1, x2);
        const minY = Math.min(y1, y2);
        const maxX = Math.max(x1, x2);
        const maxY = Math.max(y1, y2);
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }
    if (tag === 'polyline' || tag === 'polygon') {
        const pts = parsePointsAttribute(node.getAttribute('points'));
        if (!pts || pts.length < 2) return null;
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        for (const p of pts) {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        }
        if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) return null;
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }
    return null;
}

function asTransform2D(t) {
    if (t instanceof Transform2D) return t;
    if (t && typeof t === 'object') {
        // Legacy axis-aligned transform (sx/sy/tx/ty).
        if ('sx' in t || 'sy' in t || 'tx' in t || 'ty' in t) {
            const sx = Number.isFinite(t.sx) ? t.sx : 1;
            const sy = Number.isFinite(t.sy) ? t.sy : 1;
            const tx = Number.isFinite(t.tx) ? t.tx : 0;
            const ty = Number.isFinite(t.ty) ? t.ty : 0;
            return new Transform2D(sx, 0, 0, sy, tx, ty);
        }
        if (['a', 'b', 'c', 'd', 'e', 'f'].every((k) => Number.isFinite(t[k]))) {
            return new Transform2D(t.a, t.b, t.c, t.d, t.e, t.f);
        }
    }
    return Transform2D.identity();
}

function isAxisAlignedTransform(t) {
    const tt = asTransform2D(t);
    return Math.abs(tt.b) < 1e-12 && Math.abs(tt.c) < 1e-12;
}

function transformPoint(p, t) {
    return asTransform2D(t).applyToPoint(p);
}

function transformBBox(bbox, t) {
    if (!bbox) return null;
    const tt = asTransform2D(t);
    const corners = [
        { x: bbox.x, y: bbox.y },
        { x: bbox.x + bbox.width, y: bbox.y },
        { x: bbox.x + bbox.width, y: bbox.y + bbox.height },
        { x: bbox.x, y: bbox.y + bbox.height }
    ].map((p) => tt.applyToPoint(p));

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of corners) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
    }
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function parseViewBox(value) {
    if (typeof value !== 'string') return null;
    const parts = value.trim().split(/\s+|\s*,\s*/).filter(Boolean);
    if (parts.length !== 4) return null;
    const minX = toNumber(parts[0]);
    const minY = toNumber(parts[1]);
    const width = toNumber(parts[2]);
    const height = toNumber(parts[3]);
    if (![minX, minY, width, height].every(Number.isFinite)) return null;
    if (width <= 0 || height <= 0) return null;
    return { minX, minY, width, height };
}

function getSvgRootTransform(svg) {
    // Map SVG viewBox user units into viewport (width/height) user units.
    // We keep this conservative: scale + translate only.
    const vb = parseViewBox(svg?.getAttribute?.('viewBox'));
    if (!vb) return Transform2D.identity();

    const widthAttr = svg.getAttribute?.('width');
    const heightAttr = svg.getAttribute?.('height');
    const viewportW = toLengthNumber(widthAttr) ?? vb.width;
    const viewportH = toLengthNumber(heightAttr) ?? vb.height;
    if (!Number.isFinite(viewportW) || !Number.isFinite(viewportH) || viewportW <= 0 || viewportH <= 0) {
        return Transform2D.identity();
    }

    const sx = viewportW / vb.width;
    const sy = viewportH / vb.height;
    const tx = -vb.minX * sx;
    const ty = -vb.minY * sy;
    return new Transform2D(sx, 0, 0, sy, tx, ty);
}

function rectToRoundedPathD(x, y, w, h, rx, ry) {
    const rrx = Math.max(0, Math.min(Number.isFinite(rx) ? rx : 0, w / 2));
    const rry = Math.max(0, Math.min(Number.isFinite(ry) ? ry : 0, h / 2));
    const r = Math.min(rrx, rry);
    const x0 = x;
    const y0 = y;
    const x1 = x + w;
    const y1 = y + h;
    if (!(r > 0)) {
        return `M ${x0} ${y0} H ${x1} V ${y1} H ${x0} Z`;
    }

    // Use the same radius for x/y for simplicity/determinism.
    const rr = r;

    return [
        `M ${x0 + rr} ${y0}`,
        `H ${x1 - rr}`,
        `A ${rr} ${rr} 0 0 1 ${x1} ${y0 + rr}`,
        `V ${y1 - rr}`,
        `A ${rr} ${rr} 0 0 1 ${x1 - rr} ${y1}`,
        `H ${x0 + rr}`,
        `A ${rr} ${rr} 0 0 1 ${x0} ${y1 - rr}`,
        `V ${y0 + rr}`,
        `A ${rr} ${rr} 0 0 1 ${x0 + rr} ${y0}`,
        'Z'
    ].join(' ');
}

function ellipseToPathD(cx, cy, rx, ry) {
    return [
        `M ${cx + rx} ${cy}`,
        `A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy}`,
        `A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy}`,
        'Z'
    ].join(' ');
}

function parsePointsAttribute(pointsAttr) {
    if (typeof pointsAttr !== 'string') return null;
    const raw = pointsAttr.trim();
    if (raw.length === 0) return null;

    // SVG points: comma/space separated list of numbers.
    // Examples:
    // - "0,0 10,10 20,0"
    // - "0 0 10 10 20 0"
    const tokens = raw.split(/[\s,]+/).filter(Boolean);
    if (tokens.length < 4 || tokens.length % 2 !== 0) return null;

    const pts = [];
    for (let i = 0; i < tokens.length; i += 2) {
        const x = toNumber(tokens[i]);
        const y = toNumber(tokens[i + 1]);
        if (x === null || y === null) return null;
        pts.push({ x, y });
    }
    return pts;
}

function makeVectorPathFromPoints(points, { closed, fillRule }) {
    if (!Array.isArray(points) || points.length < 2) return null;
    const start = { x: points[0].x, y: points[0].y };
    const segments = [];
    for (let i = 1; i < points.length; i++) {
        segments.push({ kind: 'line', to: { x: points[i].x, y: points[i].y } });
    }
    const fr = typeof fillRule === 'string' && fillRule.trim().toLowerCase() === 'evenodd' ? 'evenodd' : 'nonzero';
    return {
        closed: !!closed,
        fillRule: fr,
        start,
        segments
    };
}

function parsePathDataToVectorPaths(d, options) {
    // Conservative subset: M/m L/l H/h V/v C/c S/s Q/q T/t A/a Z/z.
    // Returns { ok:true, paths:Path[] } or { ok:false, reason }.
    if (typeof d !== 'string') return { ok: false, reason: 'MISSING_D' };
    const input = d.trim();
    if (input.length === 0) return { ok: false, reason: 'EMPTY_D' };

    // Tokenize commands and numbers.
    const tokens = [];
    const re = /([a-zA-Z])|([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)/g;
    let m;
    while ((m = re.exec(input)) !== null) {
        if (m[1]) tokens.push({ t: 'cmd', v: m[1] });
        else if (m[2]) tokens.push({ t: 'num', v: Number(m[2]) });
    }

    let i = 0;
    function peek() {
        return tokens[i] || null;
    }
    function take() {
        return tokens[i++] || null;
    }
    function takeNumber() {
        const tok = take();
        if (!tok || tok.t !== 'num' || !Number.isFinite(tok.v)) return null;
        return tok.v;
    }

    const paths = [];
    let cur = { x: 0, y: 0 };
    let subpathStart = null;
    let activePath = null;
    let lastCmd = null;

    const defaultFillRule = (() => {
        const raw = options?.fillRule;
        const v = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
        return v === 'evenodd' ? 'evenodd' : 'nonzero';
    })();

    // Track previous curve controls for smooth commands.
    let lastCubicControl = null; // absolute {x,y} of previous cubic's c2
    let lastQuadraticControl = null; // absolute {x,y} of previous quadratic control

    function resetSmoothControls() {
        lastCubicControl = null;
        lastQuadraticControl = null;
    }

    function reflectPoint(p, around) {
        if (!p) return { x: around.x, y: around.y };
        return { x: 2 * around.x - p.x, y: 2 * around.y - p.y };
    }

    function quadToCubic(curP, q, to) {
        // Convert quadratic Bézier to cubic Bézier.
        // c1 = cur + 2/3*(q-cur)
        // c2 = to  + 2/3*(q-to)
        const c1 = { x: curP.x + (2 / 3) * (q.x - curP.x), y: curP.y + (2 / 3) * (q.y - curP.y) };
        const c2 = { x: to.x + (2 / 3) * (q.x - to.x), y: to.y + (2 / 3) * (q.y - to.y) };
        return { c1, c2 };
    }

    function arcToCubicSegments(from, arc, to) {
        // Convert SVG elliptical arc to one or more cubic Bezier segments.
        // arc: { rx, ry, xAxisRotationDeg, largeArcFlag, sweepFlag }
        // Returns { ok:true, segments:[{c1,c2,to}...] } or { ok:false }.
        let rx = Math.abs(arc.rx);
        let ry = Math.abs(arc.ry);
        const phi = ((arc.xAxisRotationDeg || 0) * Math.PI) / 180;
        const largeArc = !!arc.largeArcFlag;
        const sweep = !!arc.sweepFlag;

        // If radii are 0, the arc is treated as a straight line.
        if (!(rx > 0) || !(ry > 0)) {
            return { ok: true, segments: [{ kind: 'line', to }] };
        }

        const cosPhi = Math.cos(phi);
        const sinPhi = Math.sin(phi);

        // Step 1: Compute (x1', y1')
        const dx2 = (from.x - to.x) / 2;
        const dy2 = (from.y - to.y) / 2;
        const x1p = cosPhi * dx2 + sinPhi * dy2;
        const y1p = -sinPhi * dx2 + cosPhi * dy2;

        const rx2 = rx * rx;
        const ry2 = ry * ry;
        const x1p2 = x1p * x1p;
        const y1p2 = y1p * y1p;

        // Step 2: Ensure radii are large enough
        const lambda = x1p2 / rx2 + y1p2 / ry2;
        if (lambda > 1) {
            const s = Math.sqrt(lambda);
            rx *= s;
            ry *= s;
        }

        const rx2b = rx * rx;
        const ry2b = ry * ry;

        // Step 3: Compute (cx', cy')
        const sign = largeArc === sweep ? -1 : 1;
        const num = (rx2b * ry2b) - (rx2b * y1p2) - (ry2b * x1p2);
        const den = (rx2b * y1p2) + (ry2b * x1p2);
        if (!(den > 0)) {
            return { ok: false };
        }
        const coef = sign * Math.sqrt(Math.max(0, num / den));
        const cxp = coef * (rx * y1p) / ry;
        const cyp = coef * (-ry * x1p) / rx;

        // Step 4: Compute (cx, cy)
        const cx = cosPhi * cxp - sinPhi * cyp + (from.x + to.x) / 2;
        const cy = sinPhi * cxp + cosPhi * cyp + (from.y + to.y) / 2;

        // Step 5: Compute angles
        function angle(u, v) {
            // Signed angle from u to v.
            const dot = u.x * v.x + u.y * v.y;
            const det = u.x * v.y - u.y * v.x;
            return Math.atan2(det, dot);
        }

        const ux = (x1p - cxp) / rx;
        const uy = (y1p - cyp) / ry;
        const vx = (-x1p - cxp) / rx;
        const vy = (-y1p - cyp) / ry;

        const theta1 = Math.atan2(uy, ux);
        let deltaTheta = angle({ x: ux, y: uy }, { x: vx, y: vy });
        if (!sweep && deltaTheta > 0) deltaTheta -= 2 * Math.PI;
        if (sweep && deltaTheta < 0) deltaTheta += 2 * Math.PI;

        // Split into segments <= 90deg
        const segCount = Math.max(1, Math.ceil(Math.abs(deltaTheta) / (Math.PI / 2)));
        const segDelta = deltaTheta / segCount;

        function mapUnitPoint(p) {
            // p is on unit circle; scale to ellipse, rotate, translate.
            const x = p.x * rx;
            const y = p.y * ry;
            const xr = cosPhi * x - sinPhi * y;
            const yr = sinPhi * x + cosPhi * y;
            return { x: xr + cx, y: yr + cy };
        }

        const segments = [];
        for (let s = 0; s < segCount; s++) {
            const t1 = theta1 + s * segDelta;
            const t2 = t1 + segDelta;
            const dt = t2 - t1;
            const alpha = (4 / 3) * Math.tan(dt / 4);

            const p1 = { x: Math.cos(t1), y: Math.sin(t1) };
            const p2 = { x: Math.cos(t2), y: Math.sin(t2) };
            const c1u = { x: p1.x - alpha * p1.y, y: p1.y + alpha * p1.x };
            const c2u = { x: p2.x + alpha * p2.y, y: p2.y - alpha * p2.x };

            const c1 = mapUnitPoint(c1u);
            const c2 = mapUnitPoint(c2u);
            const end = mapUnitPoint(p2);

            segments.push({ kind: 'cubic', c1, c2, to: end });
        }

        // Force last endpoint to match requested endpoint exactly (deterministic).
        if (segments.length > 0) {
            segments[segments.length - 1] = { ...segments[segments.length - 1], to: { x: to.x, y: to.y } };
        }

        return { ok: true, segments };
    }

    function ensurePathStart(x, y) {
        activePath = {
            closed: false,
            fillRule: defaultFillRule,
            start: { x, y },
            segments: []
        };
        paths.push(activePath);
        subpathStart = { x, y };
        cur = { x, y };
        resetSmoothControls();
    }

    while (i < tokens.length) {
        const tok = peek();
        let cmd;
        if (tok && tok.t === 'cmd') {
            cmd = String(take().v);
            lastCmd = cmd;
        } else if (lastCmd) {
            // Implied command repeat.
            cmd = lastCmd;
        } else {
            return { ok: false, reason: 'PATH_PARSE_FAILED' };
        }

        const isRel = cmd === cmd.toLowerCase();
        const upper = cmd.toUpperCase();

        if (upper === 'M') {
            const x = takeNumber();
            const y = takeNumber();
            if (x === null || y === null) return { ok: false, reason: 'PATH_PARSE_FAILED' };
            const nx = isRel ? cur.x + x : x;
            const ny = isRel ? cur.y + y : y;
            ensurePathStart(nx, ny);

            // Subsequent pairs are treated as implicit L.
            while (true) {
                const n1 = peek();
                if (!n1 || n1.t !== 'num') break;
                const lx = takeNumber();
                const ly = takeNumber();
                if (lx === null || ly === null) return { ok: false, reason: 'PATH_PARSE_FAILED' };
                const x2 = isRel ? cur.x + lx : lx;
                const y2 = isRel ? cur.y + ly : ly;
                activePath.segments.push({ kind: 'line', to: { x: x2, y: y2 } });
                cur = { x: x2, y: y2 };
                resetSmoothControls();
                lastCmd = isRel ? 'l' : 'L';
            }
        } else if (upper === 'L') {
            if (!activePath) return { ok: false, reason: 'MISSING_MOVETO' };
            while (true) {
                const n1 = peek();
                if (!n1 || n1.t !== 'num') break;
                const x = takeNumber();
                const y = takeNumber();
                if (x === null || y === null) return { ok: false, reason: 'PATH_PARSE_FAILED' };
                const nx = isRel ? cur.x + x : x;
                const ny = isRel ? cur.y + y : y;
                activePath.segments.push({ kind: 'line', to: { x: nx, y: ny } });
                cur = { x: nx, y: ny };
                resetSmoothControls();
            }
        } else if (upper === 'H') {
            if (!activePath) return { ok: false, reason: 'MISSING_MOVETO' };
            while (true) {
                const n1 = peek();
                if (!n1 || n1.t !== 'num') break;
                const x = takeNumber();
                if (x === null) return { ok: false, reason: 'PATH_PARSE_FAILED' };
                const nx = isRel ? cur.x + x : x;
                activePath.segments.push({ kind: 'line', to: { x: nx, y: cur.y } });
                cur = { x: nx, y: cur.y };
                resetSmoothControls();
            }
        } else if (upper === 'V') {
            if (!activePath) return { ok: false, reason: 'MISSING_MOVETO' };
            while (true) {
                const n1 = peek();
                if (!n1 || n1.t !== 'num') break;
                const y = takeNumber();
                if (y === null) return { ok: false, reason: 'PATH_PARSE_FAILED' };
                const ny = isRel ? cur.y + y : y;
                activePath.segments.push({ kind: 'line', to: { x: cur.x, y: ny } });
                cur = { x: cur.x, y: ny };
                resetSmoothControls();
            }
        } else if (upper === 'C') {
            if (!activePath) return { ok: false, reason: 'MISSING_MOVETO' };
            while (true) {
                const n1 = peek();
                if (!n1 || n1.t !== 'num') break;
                const x1 = takeNumber();
                const y1 = takeNumber();
                const x2 = takeNumber();
                const y2 = takeNumber();
                const x = takeNumber();
                const y = takeNumber();
                if ([x1, y1, x2, y2, x, y].some(v => v === null)) return { ok: false, reason: 'PATH_PARSE_FAILED' };
                const c1 = { x: isRel ? cur.x + x1 : x1, y: isRel ? cur.y + y1 : y1 };
                const c2 = { x: isRel ? cur.x + x2 : x2, y: isRel ? cur.y + y2 : y2 };
                const to = { x: isRel ? cur.x + x : x, y: isRel ? cur.y + y : y };
                activePath.segments.push({ kind: 'cubic', c1, c2, to });
                cur = { ...to };
                lastCubicControl = { ...c2 };
                lastQuadraticControl = null;
            }
        } else if (upper === 'S') {
            if (!activePath) return { ok: false, reason: 'MISSING_MOVETO' };
            while (true) {
                const n1 = peek();
                if (!n1 || n1.t !== 'num') break;
                const x2 = takeNumber();
                const y2 = takeNumber();
                const x = takeNumber();
                const y = takeNumber();
                if ([x2, y2, x, y].some(v => v === null)) return { ok: false, reason: 'PATH_PARSE_FAILED' };

                const c1 = reflectPoint(lastCubicControl, cur);
                const c2 = { x: isRel ? cur.x + x2 : x2, y: isRel ? cur.y + y2 : y2 };
                const to = { x: isRel ? cur.x + x : x, y: isRel ? cur.y + y : y };

                activePath.segments.push({ kind: 'cubic', c1, c2, to });
                cur = { ...to };
                lastCubicControl = { ...c2 };
                lastQuadraticControl = null;
            }
        } else if (upper === 'Q') {
            if (!activePath) return { ok: false, reason: 'MISSING_MOVETO' };
            while (true) {
                const n1 = peek();
                if (!n1 || n1.t !== 'num') break;
                const qx = takeNumber();
                const qy = takeNumber();
                const x = takeNumber();
                const y = takeNumber();
                if ([qx, qy, x, y].some(v => v === null)) return { ok: false, reason: 'PATH_PARSE_FAILED' };

                const q = { x: isRel ? cur.x + qx : qx, y: isRel ? cur.y + qy : qy };
                const to = { x: isRel ? cur.x + x : x, y: isRel ? cur.y + y : y };
                const { c1, c2 } = quadToCubic(cur, q, to);

                activePath.segments.push({ kind: 'cubic', c1, c2, to });
                cur = { ...to };
                lastQuadraticControl = { ...q };
                lastCubicControl = { ...c2 };
            }
        } else if (upper === 'T') {
            if (!activePath) return { ok: false, reason: 'MISSING_MOVETO' };
            while (true) {
                const n1 = peek();
                if (!n1 || n1.t !== 'num') break;
                const x = takeNumber();
                const y = takeNumber();
                if ([x, y].some(v => v === null)) return { ok: false, reason: 'PATH_PARSE_FAILED' };

                const q = reflectPoint(lastQuadraticControl, cur);
                const to = { x: isRel ? cur.x + x : x, y: isRel ? cur.y + y : y };
                const { c1, c2 } = quadToCubic(cur, q, to);

                activePath.segments.push({ kind: 'cubic', c1, c2, to });
                cur = { ...to };
                lastQuadraticControl = { ...q };
                lastCubicControl = { ...c2 };
            }
        } else if (upper === 'A') {
            if (!activePath) return { ok: false, reason: 'MISSING_MOVETO' };
            while (true) {
                const n1 = peek();
                if (!n1 || n1.t !== 'num') break;

                const rx = takeNumber();
                const ry = takeNumber();
                const xAxisRotation = takeNumber();
                const largeArcFlagRaw = takeNumber();
                const sweepFlagRaw = takeNumber();
                const x = takeNumber();
                const y = takeNumber();

                if ([rx, ry, xAxisRotation, largeArcFlagRaw, sweepFlagRaw, x, y].some(v => v === null)) {
                    return { ok: false, reason: 'PATH_PARSE_FAILED' };
                }

                const to = { x: isRel ? cur.x + x : x, y: isRel ? cur.y + y : y };
                const largeArcFlag = largeArcFlagRaw ? 1 : 0;
                const sweepFlag = sweepFlagRaw ? 1 : 0;

                const converted = arcToCubicSegments(cur, {
                    rx,
                    ry,
                    xAxisRotationDeg: xAxisRotation,
                    largeArcFlag,
                    sweepFlag
                }, to);

                if (!converted.ok) {
                    return { ok: false, reason: 'UNSUPPORTED_PATH_COMMAND' };
                }

                for (const seg of converted.segments) {
                    if (seg.kind === 'line') {
                        activePath.segments.push({ kind: 'line', to: { ...seg.to } });
                        cur = { ...seg.to };
                        resetSmoothControls();
                    } else if (seg.kind === 'cubic') {
                        activePath.segments.push({ kind: 'cubic', c1: { ...seg.c1 }, c2: { ...seg.c2 }, to: { ...seg.to } });
                        cur = { ...seg.to };
                        lastCubicControl = { ...seg.c2 };
                        lastQuadraticControl = null;
                    }
                }
            }
        } else if (upper === 'Z') {
            if (!activePath || !subpathStart) return { ok: false, reason: 'MISSING_MOVETO' };
            activePath.closed = true;
            cur = { ...subpathStart };
            resetSmoothControls();
        } else {
            return { ok: false, reason: 'UNSUPPORTED_PATH_COMMAND' };
        }
    }

    if (paths.length === 0) return { ok: false, reason: 'EMPTY_PATHS' };
    return { ok: true, paths };
}

function solveQuadratic(a, b, c) {
    // Solve a*t^2 + b*t + c = 0
    const eps = 1e-12;
    if (Math.abs(a) < eps) {
        if (Math.abs(b) < eps) return [];
        return [(-c) / b];
    }
    const disc = b * b - 4 * a * c;
    if (disc < 0) return [];
    const sqrt = Math.sqrt(disc);
    return [(-b + sqrt) / (2 * a), (-b - sqrt) / (2 * a)];
}

function cubicAt(p0, c1, c2, p3, t) {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const t2 = t * t;
    const a = mt2 * mt;
    const b = 3 * mt2 * t;
    const c = 3 * mt * t2;
    const d = t2 * t;
    return a * p0 + b * c1 + c * c2 + d * p3;
}

function cubicExtremaTs(p0, c1, c2, p3) {
    // Find t in (0,1) where derivative is 0.
    // Derivative for cubic Bezier coordinate:
    // 3a t^2 + 2b t + c = 0
    // where a = -p0 + 3c1 - 3c2 + p3
    //       b = 3p0 - 6c1 + 3c2
    //       c = -3p0 + 3c1
    const A = 3 * (-p0 + 3 * c1 - 3 * c2 + p3);
    const B = 2 * (3 * p0 - 6 * c1 + 3 * c2);
    const C = (-3 * p0 + 3 * c1);
    const roots = solveQuadratic(A, B, C);
    return roots.filter(t => Number.isFinite(t) && t > 1e-8 && t < 1 - 1e-8);
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

function parseOpacity01(raw, fallback = 1) {
    const n = toNumber(raw);
    if (n === null) return fallback;
    return clamp01(n);
}

function getNodeOpacity01(node) {
    const raw = getInheritedPresentation(node, 'opacity');
    if (raw === null || raw === undefined) return null;
    const v = parseOpacity01(raw, null);
    if (v === null) return null;
    // Avoid emitting default opacity in serialized elements for corpus stability.
    if (v === 1) return null;
    return v;
}

function parseStdDeviation(raw) {
    if (raw === null || raw === undefined) return null;
    const s = String(raw).trim();
    if (!s) return null;
    const parts = s.split(/\s+|,/).map(p => p.trim()).filter(Boolean);
    if (parts.length === 0) return null;
    const a = toNumber(parts[0]);
    const b = parts.length > 1 ? toNumber(parts[1]) : null;
    if (a === null) return null;
    const v = (b === null) ? a : ((a + b) / 2);
    return Number.isFinite(v) ? Math.max(0, v) : null;
}

function getClipPathRefId(node) {
    const raw = getInheritedPresentation(node, 'clip-path');
    if (typeof raw !== 'string') return null;
    const v = raw.trim();
    if (!v || v.toLowerCase() === 'none') return null;
    return parseUrlRefId(v);
}

function getMaskRefId(node) {
    const raw = getInheritedPresentation(node, 'mask');
    if (typeof raw !== 'string') return null;
    const v = raw.trim();
    if (!v || v.toLowerCase() === 'none') return null;
    return parseUrlRefId(v);
}

function hasUnsupportedFilter(node) {
    const raw = getInheritedPresentation(node, 'filter');
    if (typeof raw !== 'string') return false;
    const v = raw.trim().toLowerCase();
    if (!v || v === 'none') return false;
    // Conservative: any filter usage is currently ignored.
    return true;
}

function getMixBlendMode(node) {
    const raw = getInheritedPresentation(node, 'mix-blend-mode');
    if (typeof raw !== 'string') return null;
    const v = raw.trim().toLowerCase();
    if (!v || v === 'normal') return null;
    return v;
}

function getVectorEffect(node) {
    const raw = getInheritedPresentation(node, 'vector-effect');
    if (typeof raw !== 'string') return null;
    const v = raw.trim().toLowerCase();
    if (!v || v === 'none') return null;
    return v;
}

function getPaintOrder(node) {
    const raw = getInheritedPresentation(node, 'paint-order');
    if (typeof raw !== 'string') return null;
    const v = raw.trim().toLowerCase();
    if (!v || v === 'normal') return null;
    return v;
}

function getFillRuleForNode(node) {
    const raw = getInheritedPresentation(node, 'fill-rule');
    const v = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
    if (v === 'evenodd') return 'evenodd';
    return 'nonzero';
}

function resolvePaintForNode(node) {
    // SVG presentation attributes inherit; we approximate by walking ancestors.
    const fillRaw = getInheritedPresentation(node, 'fill');
    const fillOpacityRaw = getInheritedPresentation(node, 'fill-opacity');
    const strokeRaw = getInheritedPresentation(node, 'stroke');
    const strokeOpacityRaw = getInheritedPresentation(node, 'stroke-opacity');
    const strokeWidthRaw = getInheritedPresentation(node, 'stroke-width');
    const strokeLinecapRaw = getInheritedPresentation(node, 'stroke-linecap');
    const strokeLinejoinRaw = getInheritedPresentation(node, 'stroke-linejoin');
    const strokeMiterlimitRaw = getInheritedPresentation(node, 'stroke-miterlimit');
    const strokeDasharrayRaw = getInheritedPresentation(node, 'stroke-dasharray');
    const strokeDashoffsetRaw = getInheritedPresentation(node, 'stroke-dashoffset');

    const fillIsUrlPaint = typeof fillRaw === 'string' && /^url\(\s*#?/i.test(fillRaw.trim());
    const strokeIsUrlPaint = typeof strokeRaw === 'string' && /^url\(\s*#?/i.test(strokeRaw.trim());

    const fillOpacity = clamp01(toNumber(fillOpacityRaw) ?? 1);
    const strokeOpacity = clamp01(toNumber(strokeOpacityRaw) ?? 1);

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

function parseScaleTranslateOnlyTransform(transform) {
    // Conservative: allow only axis-aligned transforms.
    // Supported:
    // - One-or-more translate(...)/scale(...) functions (no rotate/skew). SVG applies lists right-to-left.
    // - matrix(a 0 0 d e f) (no rotation/shear)
    if (typeof transform !== 'string') return { ok: true, sx: 1, sy: 1, tx: 0, ty: 0 };
    const t = transform.trim();
    if (t.length === 0) return { ok: true, sx: 1, sy: 1, tx: 0, ty: 0 };

    function composeAxisAligned(a, b) {
        // Return a ∘ b (apply b first, then a):
        // p' = a(b(p))
        const sx = b.sx * a.sx;
        const sy = b.sy * a.sy;
        const tx = b.tx * a.sx + a.tx;
        const ty = b.ty * a.sy + a.ty;
        return { sx, sy, tx, ty };
    }

    const matrixMatch = t.match(/^matrix\(\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)\s*(?:[,\s]+)\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)\s*(?:[,\s]+)\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)\s*(?:[,\s]+)\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)\s*(?:[,\s]+)\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)\s*(?:[,\s]+)\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)\s*\)$/i);
    if (matrixMatch) {
        const a = toNumber(matrixMatch[1]);
        const b = toNumber(matrixMatch[2]);
        const c = toNumber(matrixMatch[3]);
        const d = toNumber(matrixMatch[4]);
        const e = toNumber(matrixMatch[5]);
        const f = toNumber(matrixMatch[6]);

        // Axis-aligned scale + translate only:
        // [a 0 0 d e f]
        if (a !== null && d !== null && e !== null && f !== null && b === 0 && c === 0) {
            return { ok: true, sx: a, sy: d, tx: e, ty: f };
        }
        return { ok: false };
    }

    // Parse a function list like "translate(...) scale(...)".
    const fnRe = /([a-zA-Z]+)\s*\(([^)]*)\)/g;
    const matches = [];
    for (const m of t.matchAll(fnRe)) {
        matches.push({ name: m[1].toLowerCase(), args: m[2] });
    }
    if (matches.length === 0) return { ok: false };

    const leftover = t.replace(fnRe, '').replace(/[\s,]/g, '');
    if (leftover.length !== 0) return { ok: false };

    const parts = [];
    for (const m of matches) {
        const rawParts = String(m.args)
            .trim()
            .replace(/,/g, ' ')
            .split(/\s+/)
            .filter(Boolean);

        if (m.name === 'translate') {
            if (rawParts.length < 1 || rawParts.length > 2) return { ok: false };
            const tx = toNumber(rawParts[0]);
            const ty = rawParts.length === 2 ? toNumber(rawParts[1]) : 0;
            if (tx === null || ty === null) return { ok: false };
            parts.push({ sx: 1, sy: 1, tx, ty });
        } else if (m.name === 'scale') {
            if (rawParts.length < 1 || rawParts.length > 2) return { ok: false };
            const sx = toNumber(rawParts[0]);
            const sy = rawParts.length === 2 ? toNumber(rawParts[1]) : sx;
            if (sx === null || sy === null) return { ok: false };
            if (sx <= 0 || sy <= 0) return { ok: false };
            parts.push({ sx, sy, tx: 0, ty: 0 });
        } else if (m.name === 'matrix') {
            // SVG matrix(a b c d e f)
            if (rawParts.length !== 6) return { ok: false };
            const a = toNumber(rawParts[0]);
            const b = toNumber(rawParts[1]);
            const c = toNumber(rawParts[2]);
            const d = toNumber(rawParts[3]);
            const e = toNumber(rawParts[4]);
            const f = toNumber(rawParts[5]);
            if (a === null || b === null || c === null || d === null || e === null || f === null) return { ok: false };
            if (b !== 0 || c !== 0) return { ok: false };
            if (a <= 0 || d <= 0) return { ok: false };
            parts.push({ sx: a, sy: d, tx: e, ty: f });
        } else {
            return { ok: false };
        }
    }

    // SVG applies transform lists right-to-left.
    let combined = { sx: 1, sy: 1, tx: 0, ty: 0 };
    for (let i = parts.length - 1; i >= 0; i--) {
        combined = composeAxisAligned(parts[i], combined);
    }

    if (!Number.isFinite(combined.sx) || !Number.isFinite(combined.sy) || !Number.isFinite(combined.tx) || !Number.isFinite(combined.ty)) {
        return { ok: false };
    }
    return { ok: true, ...combined };
}

function parseTransformSalvageFull(transform) {
    // Parse SVG transform lists into a full affine Transform2D.
    // If parsing fails, return identity and mark hadUnsupported.
    if (typeof transform !== 'string') return { ok: true, t: Transform2D.identity(), hadUnsupported: false };
    const raw = transform.trim();
    if (raw.length === 0) return { ok: true, t: Transform2D.identity(), hadUnsupported: false };

    const fnRe = /([a-zA-Z]+)\s*\(([^)]*)\)/g;
    const matches = [];
    for (const m of raw.matchAll(fnRe)) {
        matches.push({ name: m[1].toLowerCase(), args: m[2] });
    }
    if (matches.length === 0) {
        return { ok: true, t: Transform2D.identity(), hadUnsupported: true };
    }

    const leftover = raw.replace(fnRe, '').replace(/[\s,]/g, '');
    let hadUnsupported = leftover.length !== 0;

    const parts = [];
    for (const m of matches) {
        const args = String(m.args)
            .trim()
            .replace(/,/g, ' ')
            .split(/\s+/)
            .filter(Boolean)
            .map(toNumber);

        if (m.name === 'translate') {
            if (args.length < 1 || args.length > 2 || args.some((v) => v === null)) {
                hadUnsupported = true;
                continue;
            }
            const tx = args[0] ?? 0;
            const ty = args.length === 2 ? (args[1] ?? 0) : 0;
            parts.push(Transform2D.translation(tx, ty));
        } else if (m.name === 'scale') {
            if (args.length < 1 || args.length > 2 || args.some((v) => v === null)) {
                hadUnsupported = true;
                continue;
            }
            const sx = args[0];
            const sy = args.length === 2 ? args[1] : sx;
            parts.push(Transform2D.scale(sx, sy));
        } else if (m.name === 'rotate') {
            if ((args.length !== 1 && args.length !== 3) || args.some((v) => v === null)) {
                hadUnsupported = true;
                continue;
            }
            const deg = args[0];
            const rad = (deg * Math.PI) / 180;
            if (args.length === 3) {
                parts.push(Transform2D.rotationRadiansAbout(rad, args[1], args[2]));
            } else {
                parts.push(Transform2D.rotationRadians(rad));
            }
        } else if (m.name === 'skewx') {
            if (args.length !== 1 || args[0] === null) {
                hadUnsupported = true;
                continue;
            }
            const rad = (args[0] * Math.PI) / 180;
            parts.push(new Transform2D(1, 0, Math.tan(rad), 1, 0, 0));
        } else if (m.name === 'skewy') {
            if (args.length !== 1 || args[0] === null) {
                hadUnsupported = true;
                continue;
            }
            const rad = (args[0] * Math.PI) / 180;
            parts.push(new Transform2D(1, Math.tan(rad), 0, 1, 0, 0));
        } else if (m.name === 'matrix') {
            if (args.length !== 6 || args.some((v) => v === null)) {
                hadUnsupported = true;
                continue;
            }
            parts.push(new Transform2D(args[0], args[1], args[2], args[3], args[4], args[5]));
        } else {
            hadUnsupported = true;
        }
    }

    // SVG applies transform lists right-to-left.
    let combined = Transform2D.identity();
    for (let i = parts.length - 1; i >= 0; i--) {
        combined = parts[i].compose(combined);
    }

    if (![combined.a, combined.b, combined.c, combined.d, combined.e, combined.f].every(Number.isFinite)) {
        return { ok: true, t: Transform2D.identity(), hadUnsupported: true };
    }

    return { ok: true, t: combined, hadUnsupported };
}

function readNodeTransform(node) {
    const t = node?.getAttribute?.('transform');
    return parseTransformSalvageFull(t);
}

function strokeScaleForTransform(t) {
    const tt = asTransform2D(t);
    // Approximate scale magnitude by transformed basis vectors.
    const sx = Math.hypot(tt.a, tt.b);
    const sy = Math.hypot(tt.c, tt.d);
    const s = Math.max(Math.abs(sx), Math.abs(sy));
    return Number.isFinite(s) && s > 0 ? s : 1;
}

function scaleDashArrayString(dashArray, scale) {
    if (typeof dashArray !== 'string') return dashArray;
    const s = dashArray.trim();
    if (s.length === 0) return dashArray;
    if (s.toLowerCase() === 'none') return dashArray;

    const parts = s.replace(/,/g, ' ').split(/\s+/).filter(Boolean);
    const scaled = parts.map(p => {
        const n = toLengthNumber(p);
        if (n === null) return p;
        const v = n * scale;
        return String(Math.round(v * 1e6) / 1e6);
    });
    return scaled.join(' ');
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

    const LIMITS = {
        maxBytes: 500_000,
        maxNodes: 5_000,
        maxElements: 2_000
    };

    const CLAMPS = {
        coordMin: -1_000_000,
        coordMax: 1_000_000,
        sizeMin: 0,
        sizeMax: 100_000,
        opacityMin: 0,
        opacityMax: 1
    };

    function estimateUtf8Bytes(text) {
        try {
            return new TextEncoder().encode(text).length;
        } catch {
            // Conservative fallback.
            return (text || '').length * 2;
        }
    }

    // Hard limits (Spec 19a).
    const byteLen = estimateUtf8Bytes(sanitizedSvg);
    if (byteLen > LIMITS.maxBytes) {
        return { ok: false, reason: 'IMPORT_TOO_LARGE', warnings: ['WARN_IMPORT_TOO_LARGE'] };
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

    // Complexity guardrails (Spec 19a).
    try {
        const root = doc?.documentElement;
        const nodeCount = root?.getElementsByTagName?.('*')?.length ?? 0;
        // +1 for the root element.
        const total = nodeCount + 1;
        if (total > LIMITS.maxNodes) {
            return { ok: false, reason: 'IMPORT_TOO_COMPLEX', warnings: ['WARN_IMPORT_TOO_COMPLEX'] };
        }
    } catch {
        // Ignore and proceed; parse-level issues are handled below.
    }

    const svg = doc?.documentElement;
    if (!svg || String(svg.nodeName).toLowerCase() !== 'svg') {
        return { ok: false, reason: 'NO_SVG_ROOT', warnings: [] };
    }

    const elements = [];

    const warnings = [];

    let numericClamped = false;
    let transformBaked = false;
    let pathNormalized = false;
    let tooComplex = false;

    function clampNumber(n, min, max) {
        if (!Number.isFinite(n)) return n;
        if (n < min) {
            numericClamped = true;
            return min;
        }
        if (n > max) {
            numericClamped = true;
            return max;
        }
        return n;
    }

    function clampCoord(n) {
        return clampNumber(n, CLAMPS.coordMin, CLAMPS.coordMax);
    }

    function clampSize(n) {
        return clampNumber(n, CLAMPS.sizeMin, CLAMPS.sizeMax);
    }

    function clampOpacity01(n) {
        return clampNumber(n, CLAMPS.opacityMin, CLAMPS.opacityMax);
    }

    function addElement(el) {
        if (tooComplex) return;
        if (elements.length >= LIMITS.maxElements) {
            tooComplex = true;
            return;
        }
        elements.push(el);
    }

    function uniqueInOrder(list) {
        const out = [];
        const seen = new Set();
        for (const item of list) {
            if (typeof item !== 'string' || item.length === 0) continue;
            if (seen.has(item)) continue;
            seen.add(item);
            out.push(item);
        }
        return out;
    }

    function normalizeWarningCode(code) {
        switch (code) {
            // Consolidate pre-existing granular warnings into the canonical spec codes.
            case 'WARN_GRADIENT_SPREADMETHOD_UNSUPPORTED':
            case 'WARN_GRADIENT_TRANSFORM_IGNORED':
            case 'WARN_GRADIENT_PAINT_UNSUPPORTED':
            case 'WARN_GRADIENT_HREF_UNSUPPORTED':
            case 'WARN_PATTERN_HREF_UNSUPPORTED':
                return 'WARN_GRADIENT_NORMALIZED';

            case 'WARN_VECTOR_EFFECT_UNSUPPORTED':
            case 'WARN_PAINT_ORDER_UNSUPPORTED':
            case 'WARN_CLIP_PATH_UNSUPPORTED':
            case 'WARN_MASK_UNSUPPORTED':
            case 'WARN_PATH_UNSUPPORTED':
            case 'WARN_PATH_BBOX_FAILED':
            case 'WARN_TRANSFORM_UNSUPPORTED':
            case 'WARN_UNSUPPORTED_COLOR':
                return 'WARN_SVG_UNSUPPORTED_FEATURE';

            default:
                return code;
        }
    }

    function resolveEffectsForNode(node) {
        const raw = getInheritedPresentation(node, 'filter');
        if (typeof raw !== 'string') return { stylePatch: null, effectWarnings: [] };
        const v = raw.trim().toLowerCase();
        if (!v || v === 'none') return { stylePatch: null, effectWarnings: [] };

        const filterId = parseUrlRefId(raw);
        if (!filterId) {
            return { stylePatch: null, effectWarnings: ['WARN_EFFECT_DROPPED'] };
        }

        const filterEl = doc?.getElementById?.(filterId);
        if (!filterEl || String(filterEl.nodeName).toLowerCase() !== 'filter') {
            return { stylePatch: null, effectWarnings: ['WARN_EFFECT_DROPPED'] };
        }

        const kids = Array.from(filterEl.children || []);
        const stylePatch = {};

        for (const k of kids) {
            const tag = String(k?.nodeName || '').toLowerCase();
            if (tag === 'fegaussianblur') {
                const std = parseStdDeviation(k.getAttribute?.('stdDeviation'));
                if (!Number.isFinite(std) || std <= 0) {
                    return { stylePatch: null, effectWarnings: ['WARN_EFFECT_DROPPED'] };
                }
                stylePatch.blur = { radius: std, visible: true };
                continue;
            }
            if (tag === 'fedropshadow') {
                const dx = toNumber(k.getAttribute?.('dx')) ?? 0;
                const dy = toNumber(k.getAttribute?.('dy')) ?? 0;
                const std = parseStdDeviation(k.getAttribute?.('stdDeviation')) ?? 0;

                const floodColorRaw = k.getAttribute?.('flood-color') ?? '#000000';
                const floodOpacityRaw = k.getAttribute?.('flood-opacity');
                const floodOpacity = (floodOpacityRaw !== null && floodOpacityRaw !== undefined)
                    ? parseOpacity01(floodOpacityRaw, 1)
                    : 1;

                const parsed = parseColorToHexAndAlpha(floodColorRaw);
                const baseHex = (parsed && !parsed.none && parsed.hex) ? parsed.hex : '#000000';
                const baseAlpha = (parsed && !parsed.none && Number.isFinite(parsed.alpha)) ? parsed.alpha : 1;
                const alpha = clamp01(baseAlpha * floodOpacity);
                const cssColor = alpha < 1 ? (rgbaString(baseHex, alpha) ?? baseHex) : baseHex;

                stylePatch.dropShadow = {
                    x: dx,
                    y: dy,
                    blur: std,
                    spread: 0,
                    color: cssColor,
                    blendMode: 'normal',
                    visible: true
                };
                continue;
            }

            // Any other filter primitives are currently unsupported.
            return { stylePatch: null, effectWarnings: ['WARN_EFFECT_DROPPED'] };
        }

        const hasAny = Object.keys(stylePatch).length > 0;
        if (!hasAny) return { stylePatch: null, effectWarnings: ['WARN_EFFECT_DROPPED'] };
        return { stylePatch, effectWarnings: [] };
    }

    function styleForNode(node, options) {
        const { stylePatch, effectWarnings } = resolveEffectsForNode(node);
        if (Array.isArray(effectWarnings)) warnings.push(...effectWarnings);

        const mixBlendMode = getMixBlendMode(node);
        const importedBlendMode = (mixBlendMode && SUPPORTED_BLEND_MODE_IDS.has(mixBlendMode)) ? mixBlendMode : 'normal';
        if (mixBlendMode && importedBlendMode === 'normal') {
            // Deterministic warning for unknown blend mode tokens.
            warnings.push('WARN_BLENDMODE_DEGRADED');
        }

        const paint = resolvePaintForNode(node);

        const vectorEffect = getVectorEffect(node);
        const hasNonScalingStroke = vectorEffect === 'non-scaling-stroke';
        // Other vector-effect values are currently ignored.
        if (vectorEffect && !hasNonScalingStroke) {
            warnings.push('WARN_VECTOR_EFFECT_UNSUPPORTED');
        }
        const paintOrder = getPaintOrder(node);
        if (paintOrder) {
            // Conservative: we do not currently support changing paint order.
            // Import remains deterministic with existing fill/stroke order.
            warnings.push('WARN_PAINT_ORDER_UNSUPPORTED');
        }

        const bboxOverride = options?.bboxOverride ?? null;
        const userSpaceTransform = options?.userSpaceTransform ?? null;

        // When we bake a scale transform into geometry, we must also scale stroke widths/dashes
        // for reasonable visual fidelity and correct stroke-aware bounds.
        const strokeScale = strokeScaleForTransform(userSpaceTransform);
        if (!hasNonScalingStroke && strokeScale !== 1 && paint?.stroke) {
            if (Number.isFinite(paint.stroke.width)) paint.stroke.width = paint.stroke.width * strokeScale;
            if (Number.isFinite(paint.stroke.dashOffset)) paint.stroke.dashOffset = paint.stroke.dashOffset * strokeScale;
            if (typeof paint.stroke.dashArray === 'string') paint.stroke.dashArray = scaleDashArrayString(paint.stroke.dashArray, strokeScale);
        }

        let fillPaintFill = null;
        if (paint.unsupported?.fillUrlPaint) {
            const fillRaw = getInheritedPresentation(node, 'fill');
            const gradId = parseUrlPaintId(fillRaw);
            if (gradId) {
                const primitiveBBox = getPrimitiveLocalBBox(node);
                const bbox = bboxOverride ?? transformBBox(primitiveBBox, userSpaceTransform);
                const tag = String(doc?.getElementById?.(gradId)?.nodeName || '').toLowerCase();
                if (tag === 'pattern') {
                    const resolved = resolvePatternPaintFill(doc, gradId, { elementBBox: bbox, userSpaceTransform });
                    if (resolved.ok) {
                        fillPaintFill = resolved.fill;
                    } else {
                        if (resolved.reason === 'PATTERN_HREF_CYCLE' || resolved.reason === 'PATTERN_HREF_UNSUPPORTED') {
                            warnings.push('WARN_PATTERN_HREF_UNSUPPORTED');
                        } else {
                            warnings.push('WARN_GRADIENT_PAINT_UNSUPPORTED');
                        }
                    }
                } else {
                    const resolved = resolveUrlPaintCss(doc, gradId, { elementBBox: bbox, userSpaceTransform });
                    if (resolved.ok) {
                        fillPaintFill = {
                            type: 'gradient',
                            value: resolved.css,
                            opacity: 100,
                            visible: true,
                            blendMode: importedBlendMode
                        };
                        if (Array.isArray(resolved.warnings)) warnings.push(...resolved.warnings);
                    } else {
                        if (resolved.reason === 'GRADIENT_HREF_CYCLE' || resolved.reason === 'GRADIENT_HREF_UNSUPPORTED') {
                            warnings.push('WARN_GRADIENT_HREF_UNSUPPORTED');
                        } else {
                            warnings.push('WARN_GRADIENT_PAINT_UNSUPPORTED');
                        }
                    }
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
                const primitiveBBox = getPrimitiveLocalBBox(node);
                const bbox = bboxOverride ?? transformBBox(primitiveBBox, userSpaceTransform);
                const resolved = resolveUrlPaintCss(doc, gradId, { elementBBox: bbox, userSpaceTransform });
                if (resolved.ok) {
                    strokeGradientCss = resolved.css;
                    if (Array.isArray(resolved.warnings)) warnings.push(...resolved.warnings);
                } else {
                    if (resolved.reason === 'GRADIENT_HREF_CYCLE' || resolved.reason === 'GRADIENT_HREF_UNSUPPORTED') {
                        warnings.push('WARN_GRADIENT_HREF_UNSUPPORTED');
                    } else {
                        warnings.push('WARN_GRADIENT_PAINT_UNSUPPORTED');
                    }
                }
            } else {
                warnings.push('WARN_GRADIENT_PAINT_UNSUPPORTED');
            }
        }

        let fills = [];
        if (fillPaintFill) {
            // Preserve element opacity multiplication.
            const baseOpacity = clampOpacity100(paint.fill.opacity * 100);
            const importedOpacity = clampOpacity100((fillPaintFill.opacity ?? 100) * (baseOpacity / 100));
            fills = [{
                ...fillPaintFill,
                opacity: importedOpacity
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
                    blendMode: importedBlendMode
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
                blendMode: importedBlendMode,
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

        // Apply imported blend mode consistently across paints.
        for (const f of fills) {
            if (f && typeof f === 'object') f.blendMode = importedBlendMode;
        }
        for (const s of strokes) {
            if (s && typeof s === 'object') s.blendMode = importedBlendMode;
        }

        return { fills, strokes, stylePatch };
    }

    function vectorElementFromParsedPaths(node, parsedPaths, userSpaceTransform, options) {
        const t = asTransform2D(userSpaceTransform);
        const id = options?.id || makeId();
        const styleOverride = options?.styleOverride;

        // Compute bounds from transformed geometry using cubic extrema.
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        function includePoint(p) {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        }

        for (const path of parsedPaths || []) {
            if (!path?.start) continue;
            const startT = t.applyToPoint(path.start);
            includePoint(startT);
            let curT = { ...startT };
            for (const seg of path.segments || []) {
                if (seg.kind === 'line') {
                    const toT = t.applyToPoint(seg.to);
                    includePoint(toT);
                    curT = { ...toT };
                } else if (seg.kind === 'cubic') {
                    const toT = t.applyToPoint(seg.to);
                    includePoint(toT);

                    const c1T = t.applyToPoint(seg.c1);
                    const c2T = t.applyToPoint(seg.c2);

                    const tsX = cubicExtremaTs(curT.x, c1T.x, c2T.x, toT.x);
                    const tsY = cubicExtremaTs(curT.y, c1T.y, c2T.y, toT.y);
                    const ts = Array.from(new Set([...tsX, ...tsY]));
                    for (const tt0 of ts) {
                        const x = cubicAt(curT.x, c1T.x, c2T.x, toT.x, tt0);
                        const y = cubicAt(curT.y, c1T.y, c2T.y, toT.y, tt0);
                        if (Number.isFinite(x) && Number.isFinite(y)) includePoint({ x, y });
                    }

                    curT = { ...toT };
                }
            }
            if (path.closed) includePoint(startT);
        }

        if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
            warnings.push('WARN_PATH_BBOX_FAILED');
            return null;
        }

        // Stroke-aware padding.
        const paint = resolvePaintForNode(node);
        const vectorEffect = getVectorEffect(node);
        const hasNonScalingStroke = vectorEffect === 'non-scaling-stroke';
        const strokeScale = hasNonScalingStroke ? 1 : strokeScaleForTransform(t);
        const strokePad = (!paint.stroke?.none && Number.isFinite(paint.stroke?.width)) ? (Math.max(0, paint.stroke.width * strokeScale) / 2) : 0;
        const basePad = 0.5;
        const geomPad = basePad;
        const visualPad = basePad + strokePad;

        const xGeom = minX - geomPad;
        const yGeom = minY - geomPad;
        const widthGeom = (maxX - minX) + 2 * geomPad;
        const heightGeom = (maxY - minY) + 2 * geomPad;

        const x = minX - visualPad;
        const y = minY - visualPad;
        const width = (maxX - minX) + 2 * visualPad;
        const height = (maxY - minY) + 2 * visualPad;

        if (!(width > 0 && height > 0)) return null;

        const localPaths = (parsedPaths || []).map((p) => ({
            ...p,
            start: (() => {
                const pt = t.applyToPoint(p.start);
                return { x: pt.x - x, y: pt.y - y };
            })(),
            segments: (p.segments || []).map((seg) => {
                if (seg.kind === 'line') {
                    const pt = t.applyToPoint(seg.to);
                    return { kind: 'line', to: { x: pt.x - x, y: pt.y - y } };
                }
                if (seg.kind === 'cubic') {
                    const c1 = t.applyToPoint(seg.c1);
                    const c2 = t.applyToPoint(seg.c2);
                    const to = t.applyToPoint(seg.to);
                    return {
                        kind: 'cubic',
                        c1: { x: c1.x - x, y: c1.y - y },
                        c2: { x: c2.x - x, y: c2.y - y },
                        to: { x: to.x - x, y: to.y - y }
                    };
                }
                return seg;
            })
        }));

        const style = styleOverride || (() => {
            const bboxOverride = { x: xGeom, y: yGeom, width: widthGeom, height: heightGeom };
            const { fills, strokes, stylePatch } = styleForNode(node, { bboxOverride, userSpaceTransform: t });
            return { fills, strokes, ...(stylePatch || {}) };
        })();

        const el = {
            id,
            type: 'shape',
            shape: 'vector',
            shapeKind: 'vector',
            x,
            y,
            width,
            height,
            rotation: 0,
            paths: localPaths,
            style
        };
        const opacity = getNodeOpacity01(node);
        if (opacity !== null) el.opacity = clampOpacity01(opacity);
        return el;
    }

    function collectParsedPathsForDefNode(defNode) {
        const tag = String(defNode?.nodeName || '').toLowerCase();

        if (tag === 'rect') {
            const x = clampCoord(toNumber(defNode.getAttribute('x')) ?? 0);
            const y = clampCoord(toNumber(defNode.getAttribute('y')) ?? 0);
            const w = clampSize(toNumber(defNode.getAttribute('width')) ?? 0);
            const h = clampSize(toNumber(defNode.getAttribute('height')) ?? 0);
            if (!(w > 0 && h > 0)) return [];
            const rx = clampSize(toNumber(defNode.getAttribute('rx')) ?? null);
            const ry = clampSize(toNumber(defNode.getAttribute('ry')) ?? null);
            const rrX = rx ?? 0;
            const rrY = (ry ?? rx ?? 0);
            const d = rectToRoundedPathD(x, y, w, h, rrX, rrY);
            const parsed = parsePathDataToVectorPaths(d, { fillRule: 'nonzero' });
            return parsed.ok ? parsed.paths : [];
        }

        if (tag === 'circle') {
            const cx = clampCoord(toNumber(defNode.getAttribute('cx')) ?? 0);
            const cy = clampCoord(toNumber(defNode.getAttribute('cy')) ?? 0);
            const r = clampSize(toNumber(defNode.getAttribute('r')) ?? 0);
            if (!(r > 0)) return [];
            const d = ellipseToPathD(cx, cy, r, r);
            const parsed = parsePathDataToVectorPaths(d, { fillRule: 'nonzero' });
            return parsed.ok ? parsed.paths : [];
        }

        if (tag === 'ellipse') {
            const cx = clampCoord(toNumber(defNode.getAttribute('cx')) ?? 0);
            const cy = clampCoord(toNumber(defNode.getAttribute('cy')) ?? 0);
            const rx = clampSize(toNumber(defNode.getAttribute('rx')) ?? 0);
            const ry = clampSize(toNumber(defNode.getAttribute('ry')) ?? 0);
            if (!(rx > 0 && ry > 0)) return [];
            const d = ellipseToPathD(cx, cy, rx, ry);
            const parsed = parsePathDataToVectorPaths(d, { fillRule: 'nonzero' });
            return parsed.ok ? parsed.paths : [];
        }

        if (tag === 'polygon' || tag === 'polyline') {
            const pts = parsePointsAttribute(defNode.getAttribute('points'));
            if (!pts || pts.length < 2) return [];
            const path = makeVectorPathFromPoints(pts, { closed: tag === 'polygon', fillRule: 'nonzero' });
            return path ? [path] : [];
        }

        if (tag === 'path') {
            const d = defNode.getAttribute('d') ?? '';
            const parsed = parsePathDataToVectorPaths(d, { fillRule: getFillRuleForNode(defNode) });
            return parsed.ok ? parsed.paths : [];
        }

        return [];
    }

    function transformParsedPathsToWorld(parsedPaths, t) {
        const tt = asTransform2D(t);
        return (parsedPaths || []).map((p) => ({
            ...p,
            start: tt.applyToPoint(p.start),
            segments: (p.segments || []).map((seg) => {
                if (seg.kind === 'line') {
                    return { kind: 'line', to: tt.applyToPoint(seg.to) };
                }
                if (seg.kind === 'cubic') {
                    return {
                        kind: 'cubic',
                        c1: tt.applyToPoint(seg.c1),
                        c2: tt.applyToPoint(seg.c2),
                        to: tt.applyToPoint(seg.to)
                    };
                }
                return seg;
            })
        }));
    }

    function buildMaskShapeFromRef(refEl, refKind, contentEl, contentTransform) {
        // refKind: 'clipPath' | 'mask'
        if (!refEl) return null;

        const unitsAttr = refKind === 'clipPath' ? 'clipPathUnits' : 'maskUnits';
        const unitsRaw = String(refEl.getAttribute?.(unitsAttr) || '').trim();
        const units = unitsRaw ? unitsRaw.toLowerCase() : 'userspaceonuse';

        // Determine transform mapping for defs.
        let baseT = asTransform2D(contentTransform);

        if (units === 'objectboundingbox') {
            const w = Number(contentEl?.width) || 0;
            const h = Number(contentEl?.height) || 0;
            if (!(w > 0 && h > 0)) return null;
            baseT = Transform2D.translation(Number(contentEl.x) || 0, Number(contentEl.y) || 0)
                .compose(Transform2D.scale(w, h));
        }

        const worldPaths = [];
        for (const child of Array.from(refEl.children || [])) {
            const childT = readNodeTransform(child);
            const effectiveT = baseT.compose(childT.t);
            const parsedPaths = collectParsedPathsForDefNode(child);
            if (parsedPaths.length === 0) continue;
            worldPaths.push(...transformParsedPathsToWorld(parsedPaths, effectiveT));
        }

        if (worldPaths.length === 0) return null;

        // Paths are already in world coordinates; localize into a single vector element.
        return vectorElementFromParsedPaths(refEl, worldPaths, Transform2D.identity(), {
            styleOverride: { fills: [], strokes: [] }
        });
    }

    function pushImportedElementWithMasking(node, contentEl, contentTransform) {
        const clipId = getClipPathRefId(node);
        const maskId = getMaskRefId(node);

        if (!clipId && !maskId) {
            addElement(contentEl);
            return;
        }

        // Always import the content element.
        addElement(contentEl);

        const createdMaskNodes = [];

        if (clipId) {
            const clipEl = doc?.getElementById?.(clipId);
            if (clipEl && String(clipEl.nodeName).toLowerCase() === 'clippath') {
                const maskShapeEl = buildMaskShapeFromRef(clipEl, 'clipPath', contentEl, contentTransform);
                if (maskShapeEl) {
                    maskShapeEl.id = makeId();
                    addElement(maskShapeEl);
                    const maskNodeId = makeId();
                    createdMaskNodes.push({
                        id: maskNodeId,
                        type: 'shape',
                        shapeKind: 'mask',
                        x: Number(maskShapeEl.x) || 0,
                        y: Number(maskShapeEl.y) || 0,
                        width: Number(maskShapeEl.width) || 0,
                        height: Number(maskShapeEl.height) || 0,
                        rotation: 0,
                        maskShapeId: maskShapeEl.id,
                        contentIds: [contentEl.id],
                        mode: 'clip',
                        invert: false
                    });
                } else {
                    warnings.push('WARN_CLIP_PATH_UNSUPPORTED');
                }
            } else {
                warnings.push('WARN_CLIP_PATH_UNSUPPORTED');
            }
        }

        if (maskId) {
            const maskEl = doc?.getElementById?.(maskId);
            if (maskEl && String(maskEl.nodeName).toLowerCase() === 'mask') {
                const maskShapeEl = buildMaskShapeFromRef(maskEl, 'mask', contentEl, contentTransform);
                if (maskShapeEl) {
                    maskShapeEl.id = makeId();
                    addElement(maskShapeEl);
                    const maskNodeId = makeId();
                    createdMaskNodes.push({
                        id: maskNodeId,
                        type: 'shape',
                        shapeKind: 'mask',
                        x: Number(maskShapeEl.x) || 0,
                        y: Number(maskShapeEl.y) || 0,
                        width: Number(maskShapeEl.width) || 0,
                        height: Number(maskShapeEl.height) || 0,
                        rotation: 0,
                        maskShapeId: maskShapeEl.id,
                        contentIds: [contentEl.id],
                        mode: 'clip',
                        invert: false
                    });
                } else {
                    warnings.push('WARN_MASK_UNSUPPORTED');
                }
            } else {
                warnings.push('WARN_MASK_UNSUPPORTED');
            }
        }

        // Add mask nodes last (relationship nodes; should sit above content in element order).
        for (const m of createdMaskNodes) {
            addElement(m);
        }
    }

    function walk(node, accumulated) {
        if (!node) return;
        if (node.nodeType !== 1) return;

        const local = readNodeTransform(node);
        if (local?.hadUnsupported) {
            warnings.push('WARN_TRANSFORM_UNSUPPORTED');
        }

        const nextAccumulated = asTransform2D(accumulated).compose(local.t);

        const tag = String(node.nodeName).toLowerCase();

        // <defs> is non-rendering; never import primitives inside it.
        // We still allow referenced defs (gradients/patterns) to be resolved via doc.getElementById.
        if (tag === 'defs') {
            return;
        }

        if (tag === 'rect') {
            const rawX = clampCoord(toNumber(node.getAttribute('x')) ?? 0);
            const rawY = clampCoord(toNumber(node.getAttribute('y')) ?? 0);
            const rawW = clampSize(toNumber(node.getAttribute('width')) ?? 0);
            const rawH = clampSize(toNumber(node.getAttribute('height')) ?? 0);
            if (rawW > 0 && rawH > 0) {
                const t = asTransform2D(nextAccumulated);
                const rx = clampSize(toNumber(node.getAttribute('rx')) ?? null);
                const ry = clampSize(toNumber(node.getAttribute('ry')) ?? null);

                if (isAxisAlignedTransform(t)) {
                    const bbox = transformBBox({ x: rawX, y: rawY, width: rawW, height: rawH }, t);
                    if (bbox && bbox.width > 0 && bbox.height > 0) {
                        const rxScaled = rx !== null ? Math.max(0, rx * Math.abs(t.a)) : null;
                        const ryScaled = ry !== null ? Math.max(0, ry * Math.abs(t.d)) : null;
                        const borderRadius = (rxScaled !== null || ryScaled !== null)
                            ? Math.max(0, Math.min(rxScaled ?? ryScaled ?? 0, ryScaled ?? rxScaled ?? 0))
                            : 0;

                        const bboxOverride = { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height };
                        const { fills, strokes, stylePatch } = styleForNode(node, { bboxOverride, userSpaceTransform: t });
                        const el = {
                            id: makeId(),
                            type: 'shape',
                            shape: 'rectangle',
                            shapeKind: 'rectangle',
                            x: bbox.x,
                            y: bbox.y,
                            width: bbox.width,
                            height: bbox.height,
                            rotation: 0,
                            borderRadius,
                            style: { fills, strokes, ...(stylePatch || {}) }
                        };
                        const opacity = getNodeOpacity01(node);
                        if (opacity !== null) el.opacity = clampOpacity01(opacity);
                        pushImportedElementWithMasking(node, el, t);
                    }
                } else {
                    transformBaked = true;
                    const rrX = rx ?? 0;
                    const rrY = (ry ?? rx ?? 0);
                    const d = rectToRoundedPathD(rawX, rawY, rawW, rawH, rrX, rrY);
                    const fillRule = getFillRuleForNode(node);
                    const parsed = parsePathDataToVectorPaths(d, { fillRule });
                    if (parsed.ok) {
                        const el = vectorElementFromParsedPaths(node, parsed.paths, t, { id: makeId() });
                        if (el) pushImportedElementWithMasking(node, el, t);
                    } else {
                        warnings.push('WARN_PATH_UNSUPPORTED');
                    }
                }
            }
        } else if (tag === 'circle') {
            const rawCx = clampCoord(toNumber(node.getAttribute('cx')) ?? 0);
            const rawCy = clampCoord(toNumber(node.getAttribute('cy')) ?? 0);
            const rawR = clampSize(toNumber(node.getAttribute('r')) ?? 0);
            if (rawR > 0) {
                const t = asTransform2D(nextAccumulated);
                if (isAxisAlignedTransform(t)) {
                    const bbox = transformBBox(
                        { x: rawCx - rawR, y: rawCy - rawR, width: rawR * 2, height: rawR * 2 },
                        t
                    );
                    if (bbox && bbox.width > 0 && bbox.height > 0) {
                        const bboxOverride = { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height };
                        const { fills, strokes, stylePatch } = styleForNode(node, { bboxOverride, userSpaceTransform: t });
                        const el = {
                            id: makeId(),
                            type: 'shape',
                            shape: 'ellipse',
                            shapeKind: 'ellipse',
                            x: bbox.x,
                            y: bbox.y,
                            width: bbox.width,
                            height: bbox.height,
                            rotation: 0,
                            style: { fills, strokes, ...(stylePatch || {}) }
                        };
                        const opacity = getNodeOpacity01(node);
                        if (opacity !== null) el.opacity = clampOpacity01(opacity);
                        pushImportedElementWithMasking(node, el, t);
                    }
                } else {
                    transformBaked = true;
                    const d = ellipseToPathD(rawCx, rawCy, rawR, rawR);
                    const fillRule = getFillRuleForNode(node);
                    const parsed = parsePathDataToVectorPaths(d, { fillRule });
                    if (parsed.ok) {
                        const el = vectorElementFromParsedPaths(node, parsed.paths, t, { id: makeId() });
                        if (el) pushImportedElementWithMasking(node, el, t);
                    } else {
                        warnings.push('WARN_PATH_UNSUPPORTED');
                    }
                }
            }
        } else if (tag === 'ellipse') {
            const rawCx = clampCoord(toNumber(node.getAttribute('cx')) ?? 0);
            const rawCy = clampCoord(toNumber(node.getAttribute('cy')) ?? 0);
            const rawRx = clampSize(toNumber(node.getAttribute('rx')) ?? 0);
            const rawRy = clampSize(toNumber(node.getAttribute('ry')) ?? 0);
            if (rawRx > 0 && rawRy > 0) {
                const t = asTransform2D(nextAccumulated);
                if (isAxisAlignedTransform(t)) {
                    const bbox = transformBBox(
                        { x: rawCx - rawRx, y: rawCy - rawRy, width: rawRx * 2, height: rawRy * 2 },
                        t
                    );
                    if (bbox && bbox.width > 0 && bbox.height > 0) {
                        const bboxOverride = { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height };
                        const { fills, strokes, stylePatch } = styleForNode(node, { bboxOverride, userSpaceTransform: t });
                        const el = {
                            id: makeId(),
                            type: 'shape',
                            shape: 'ellipse',
                            shapeKind: 'ellipse',
                            x: bbox.x,
                            y: bbox.y,
                            width: bbox.width,
                            height: bbox.height,
                            rotation: 0,
                            style: { fills, strokes, ...(stylePatch || {}) }
                        };
                        const opacity = getNodeOpacity01(node);
                        if (opacity !== null) el.opacity = clampOpacity01(opacity);
                        pushImportedElementWithMasking(node, el, t);
                    }
                } else {
                    transformBaked = true;
                    const d = ellipseToPathD(rawCx, rawCy, rawRx, rawRy);
                    const fillRule = getFillRuleForNode(node);
                    const parsed = parsePathDataToVectorPaths(d, { fillRule });
                    if (parsed.ok) {
                        const el = vectorElementFromParsedPaths(node, parsed.paths, t, { id: makeId() });
                        if (el) pushImportedElementWithMasking(node, el, t);
                    } else {
                        warnings.push('WARN_PATH_UNSUPPORTED');
                    }
                }
            }
        } else if (tag === 'line') {
            const rawX1 = clampCoord(toNumber(node.getAttribute('x1')) ?? 0);
            const rawY1 = clampCoord(toNumber(node.getAttribute('y1')) ?? 0);
            const rawX2 = clampCoord(toNumber(node.getAttribute('x2')) ?? 0);
            const rawY2 = clampCoord(toNumber(node.getAttribute('y2')) ?? 0);

            const t = asTransform2D(nextAccumulated);
            const p1 = transformPoint({ x: rawX1, y: rawY1 }, t);
            const p2 = transformPoint({ x: rawX2, y: rawY2 }, t);

            const minX = Math.min(p1.x, p2.x);
            const minY = Math.min(p1.y, p2.y);
            const maxX = Math.max(p1.x, p2.x);
            const maxY = Math.max(p1.y, p2.y);

            const paint = resolvePaintForNode(node);
            const strokePad = (!paint.stroke?.none && Number.isFinite(paint.stroke?.width)) ? (Math.max(0, paint.stroke.width) / 2) : 0;
            const basePad = 0.5;
            const geomPad = basePad;
            const visualPad = basePad + strokePad;

            const xGeom = minX - geomPad;
            const yGeom = minY - geomPad;
            const widthGeom = (maxX - minX) + 2 * geomPad;
            const heightGeom = (maxY - minY) + 2 * geomPad;

            const x = minX - visualPad;
            const y = minY - visualPad;
            const width = (maxX - minX) + 2 * visualPad;
            const height = (maxY - minY) + 2 * visualPad;

            if (width > 0 && height > 0) {
                const bboxOverride = { x: xGeom, y: yGeom, width: widthGeom, height: heightGeom };
                const { fills, strokes, stylePatch } = styleForNode(node, { bboxOverride, userSpaceTransform: t });
                const el = {
                    id: makeId(),
                    type: 'shape',
                    shape: 'line',
                    shapeKind: 'line',
                    x,
                    y,
                    width,
                    height,
                    rotation: 0,
                    params: {
                        p1: { x: p1.x - x, y: p1.y - y },
                        p2: { x: p2.x - x, y: p2.y - y }
                    },
                    style: { fills, strokes, ...(stylePatch || {}) }
                };
                const opacity = getNodeOpacity01(node);
                if (opacity !== null) el.opacity = clampOpacity01(opacity);
                pushImportedElementWithMasking(node, el, t);
            }
        } else if (tag === 'polyline' || tag === 'polygon') {
            const pts = parsePointsAttribute(node.getAttribute('points'));
            if (pts && pts.length >= 2) {
                const translated = pts.map(p => transformPoint(p, nextAccumulated));

                let minX = Infinity;
                let minY = Infinity;
                let maxX = -Infinity;
                let maxY = -Infinity;
                for (const p of translated) {
                    minX = Math.min(minX, p.x);
                    minY = Math.min(minY, p.y);
                    maxX = Math.max(maxX, p.x);
                    maxY = Math.max(maxY, p.y);
                }

                const paint = resolvePaintForNode(node);
                const strokePad = (!paint.stroke?.none && Number.isFinite(paint.stroke?.width)) ? (Math.max(0, paint.stroke.width) / 2) : 0;
                const basePad = 0.5;
                const geomPad = basePad;
                const visualPad = basePad + strokePad;

                const xGeom = minX - geomPad;
                const yGeom = minY - geomPad;
                const widthGeom = (maxX - minX) + 2 * geomPad;
                const heightGeom = (maxY - minY) + 2 * geomPad;

                const x = minX - visualPad;
                const y = minY - visualPad;
                const width = (maxX - minX) + 2 * visualPad;
                const height = (maxY - minY) + 2 * visualPad;

                if (width > 0 && height > 0) {
                    const localPts = translated.map(p => ({ x: p.x - x, y: p.y - y }));
                    const fillRule = getFillRuleForNode(node);
                    const path = makeVectorPathFromPoints(localPts, { closed: tag === 'polygon', fillRule });
                    if (path) {
                        const bboxOverride = { x: xGeom, y: yGeom, width: widthGeom, height: heightGeom };
                        const { fills, strokes, stylePatch } = styleForNode(node, { bboxOverride, userSpaceTransform: nextAccumulated });
                        const el = {
                            id: makeId(),
                            type: 'shape',
                            shape: 'vector',
                            shapeKind: 'vector',
                            x,
                            y,
                            width,
                            height,
                            rotation: 0,
                            paths: [path],
                            style: { fills, strokes, ...(stylePatch || {}) }
                        };
                        const opacity = getNodeOpacity01(node);
                        if (opacity !== null) el.opacity = clampOpacity01(opacity);
                        pushImportedElementWithMasking(node, el, asTransform2D(nextAccumulated));
                    }
                }
            }
        } else if (tag === 'path') {
            const d = node.getAttribute('d') ?? '';
            if (/[QTAHS]/i.test(d)) {
                pathNormalized = true;
            }
            const fillRule = getFillRuleForNode(node);
            const parsed = parsePathDataToVectorPaths(d, { fillRule });
            if (parsed.ok) {
                // We always bake SVG transforms into vector geometry (rotation stays 0).
                const tTest = asTransform2D(nextAccumulated);
                if (!(Math.abs(tTest.a - 1) < 1e-9 && Math.abs(tTest.b) < 1e-9 && Math.abs(tTest.c) < 1e-9 && Math.abs(tTest.d - 1) < 1e-9 && Math.abs(tTest.e) < 1e-9 && Math.abs(tTest.f) < 1e-9)) {
                    transformBaked = true;
                }
                // Compute a bbox from the parsed geometry (line/cubic) using cubic extrema for tighter bounds.
                let minX = Infinity;
                let minY = Infinity;
                let maxX = -Infinity;
                let maxY = -Infinity;

                function includePoint(p) {
                    minX = Math.min(minX, p.x);
                    minY = Math.min(minY, p.y);
                    maxX = Math.max(maxX, p.x);
                    maxY = Math.max(maxY, p.y);
                }

                for (const path of parsed.paths) {
                    if (!path?.start) continue;
                    const startT = transformPoint(path.start, nextAccumulated);
                    includePoint(startT);
                    let curP = { ...path.start };
                    let curT = { ...startT };
                    for (const seg of path.segments || []) {
                        if (seg.kind === 'line') {
                            const toT = transformPoint(seg.to, nextAccumulated);
                            includePoint(toT);
                            curP = { ...seg.to };
                            curT = { ...toT };
                        } else if (seg.kind === 'cubic') {
                            const toT = transformPoint(seg.to, nextAccumulated);
                            includePoint(toT);

                            const c1T = transformPoint(seg.c1, nextAccumulated);
                            const c2T = transformPoint(seg.c2, nextAccumulated);

                            const tsX = cubicExtremaTs(curT.x, c1T.x, c2T.x, toT.x);
                            const tsY = cubicExtremaTs(curT.y, c1T.y, c2T.y, toT.y);
                            const ts = Array.from(new Set([...tsX, ...tsY]));
                            for (const t of ts) {
                                const x = cubicAt(curT.x, c1T.x, c2T.x, toT.x, t);
                                const y = cubicAt(curT.y, c1T.y, c2T.y, toT.y, t);
                                if (Number.isFinite(x) && Number.isFinite(y)) includePoint({ x, y });
                            }

                            curP = { ...seg.to };
                            curT = { ...toT };
                        }
                    }
                    if (path.closed) includePoint(startT);
                }

                if (Number.isFinite(minX) && Number.isFinite(minY) && Number.isFinite(maxX) && Number.isFinite(maxY)) {
                    const paint = resolvePaintForNode(node);
                    const strokePad = (!paint.stroke?.none && Number.isFinite(paint.stroke?.width)) ? (Math.max(0, paint.stroke.width) / 2) : 0;
                    const basePad = 0.5;
                    const geomPad = basePad;
                    const visualPad = basePad + strokePad;

                    const xGeom = minX - geomPad;
                    const yGeom = minY - geomPad;
                    const widthGeom = (maxX - minX) + 2 * geomPad;
                    const heightGeom = (maxY - minY) + 2 * geomPad;

                    const x = minX - visualPad;
                    const y = minY - visualPad;
                    const width = (maxX - minX) + 2 * visualPad;
                    const height = (maxY - minY) + 2 * visualPad;

                    if (width > 0 && height > 0) {
                        const localPaths = parsed.paths.map(p => ({
                            ...p,
                            start: (() => {
                                const pt = transformPoint(p.start, nextAccumulated);
                                return { x: pt.x - (minX - visualPad), y: pt.y - (minY - visualPad) };
                            })(),
                            segments: (p.segments || []).map(seg => {
                                if (seg.kind === 'line') {
                                    const pt = transformPoint(seg.to, nextAccumulated);
                                    return { kind: 'line', to: { x: pt.x - (minX - visualPad), y: pt.y - (minY - visualPad) } };
                                }
                                if (seg.kind === 'cubic') {
                                    const c1 = transformPoint(seg.c1, nextAccumulated);
                                    const c2 = transformPoint(seg.c2, nextAccumulated);
                                    const to = transformPoint(seg.to, nextAccumulated);
                                    return {
                                        kind: 'cubic',
                                        c1: { x: c1.x - (minX - visualPad), y: c1.y - (minY - visualPad) },
                                        c2: { x: c2.x - (minX - visualPad), y: c2.y - (minY - visualPad) },
                                        to: { x: to.x - (minX - visualPad), y: to.y - (minY - visualPad) }
                                    };
                                }
                                return seg;
                            })
                        }));

                        const bboxOverride = { x: xGeom, y: yGeom, width: widthGeom, height: heightGeom };
                        const { fills, strokes, stylePatch } = styleForNode(node, { bboxOverride, userSpaceTransform: nextAccumulated });
                        const el = {
                            id: makeId(),
                            type: 'shape',
                            shape: 'vector',
                            shapeKind: 'vector',
                            x,
                            y,
                            width,
                            height,
                            rotation: 0,
                            paths: localPaths,
                            style: { fills, strokes, ...(stylePatch || {}) }
                        };
                        const opacity = getNodeOpacity01(node);
                        if (opacity !== null) el.opacity = clampOpacity01(opacity);
                        pushImportedElementWithMasking(node, el, asTransform2D(nextAccumulated));
                    }
                } else {
                    warnings.push('WARN_PATH_BBOX_FAILED');
                }
            } else if (parsed.reason === 'UNSUPPORTED_PATH_COMMAND') {
                warnings.push('WARN_PATH_UNSUPPORTED');
            }
        }

        // Preserve document order by walking children in DOM order.
        for (const child of node.children || []) {
            walk(child, nextAccumulated);
        }
    }

    try {
        const rootT = getSvgRootTransform(svg);
        walk(svg, rootT);
    } catch (e) {
        return { ok: false, reason: 'IMPORT_FAILED', warnings: [] };
    }

    if (tooComplex) {
        const outWarnings = uniqueInOrder([
            ...warnings,
            'WARN_IMPORT_TOO_COMPLEX'
        ]).map(normalizeWarningCode);
        return { ok: false, reason: 'IMPORT_TOO_COMPLEX', warnings: uniqueInOrder(outWarnings) };
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

    if (numericClamped) warnings.push('WARN_NUMERIC_CLAMPED');
    if (transformBaked) warnings.push('WARN_TRANSFORM_BAKED');
    if (pathNormalized) warnings.push('WARN_PATH_NORMALIZED');

    const normalizedWarnings = uniqueInOrder(warnings.map(normalizeWarningCode));
    return { ok: true, elements: moved, warnings: normalizedWarnings };
}
