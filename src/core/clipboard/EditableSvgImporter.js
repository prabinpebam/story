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

    function styleForNode(node, options) {
        const paint = resolvePaintForNode(node);

        const bboxOverride = options?.bboxOverride ?? null;

        let fillGradientCss = null;
        if (paint.unsupported?.fillUrlPaint) {
            const fillRaw = getInheritedPresentation(node, 'fill');
            const gradId = parseUrlPaintId(fillRaw);
            if (gradId) {
                const bbox = bboxOverride ?? getPrimitiveLocalBBox(node);
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
                const bbox = bboxOverride ?? getPrimitiveLocalBBox(node);
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
                const bboxOverride = { x, y, width, height };
                const { fills, strokes } = styleForNode(node, { bboxOverride });
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
                const bboxOverride = { x: cx - r, y: cy - r, width: 2 * r, height: 2 * r };
                const { fills, strokes } = styleForNode(node, { bboxOverride });
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
                const bboxOverride = { x: cx - rx, y: cy - ry, width: 2 * rx, height: 2 * ry };
                const { fills, strokes } = styleForNode(node, { bboxOverride });
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
        } else if (tag === 'line') {
            const x1 = (toNumber(node.getAttribute('x1')) ?? 0) + nextAccumulated.tx;
            const y1 = (toNumber(node.getAttribute('y1')) ?? 0) + nextAccumulated.ty;
            const x2 = (toNumber(node.getAttribute('x2')) ?? 0) + nextAccumulated.tx;
            const y2 = (toNumber(node.getAttribute('y2')) ?? 0) + nextAccumulated.ty;

            const minX = Math.min(x1, x2);
            const minY = Math.min(y1, y2);
            const maxX = Math.max(x1, x2);
            const maxY = Math.max(y1, y2);

            const pad = 0.5;
            const x = minX - pad;
            const y = minY - pad;
            const width = (maxX - minX) + 2 * pad;
            const height = (maxY - minY) + 2 * pad;

            if (width > 0 && height > 0) {
                const bboxOverride = { x, y, width, height };
                const { fills, strokes } = styleForNode(node, { bboxOverride });
                elements.push({
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
                        p1: { x: x1 - x, y: y1 - y },
                        p2: { x: x2 - x, y: y2 - y }
                    },
                    style: { fills, strokes }
                });
            }
        } else if (tag === 'polyline' || tag === 'polygon') {
            const pts = parsePointsAttribute(node.getAttribute('points'));
            if (pts && pts.length >= 2) {
                const translated = pts.map(p => ({ x: p.x + nextAccumulated.tx, y: p.y + nextAccumulated.ty }));

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

                const pad = 0.5;
                const x = minX - pad;
                const y = minY - pad;
                const width = (maxX - minX) + 2 * pad;
                const height = (maxY - minY) + 2 * pad;

                if (width > 0 && height > 0) {
                    const localPts = translated.map(p => ({ x: p.x - x, y: p.y - y }));
                    const fillRule = getFillRuleForNode(node);
                    const path = makeVectorPathFromPoints(localPts, { closed: tag === 'polygon', fillRule });
                    if (path) {
                        const bboxOverride = { x, y, width, height };
                        const { fills, strokes } = styleForNode(node, { bboxOverride });
                        elements.push({
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
                            style: { fills, strokes }
                        });
                    }
                }
            }
        } else if (tag === 'path') {
            const d = node.getAttribute('d') ?? '';
            const fillRule = getFillRuleForNode(node);
            const parsed = parsePathDataToVectorPaths(d, { fillRule });
            if (parsed.ok) {
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
                    includePoint(path.start);
                    let curP = { ...path.start };
                    for (const seg of path.segments || []) {
                        if (seg.kind === 'line') {
                            includePoint(seg.to);
                            curP = { ...seg.to };
                        } else if (seg.kind === 'cubic') {
                            includePoint(seg.to);

                            const tsX = cubicExtremaTs(curP.x, seg.c1.x, seg.c2.x, seg.to.x);
                            const tsY = cubicExtremaTs(curP.y, seg.c1.y, seg.c2.y, seg.to.y);
                            const ts = Array.from(new Set([...tsX, ...tsY]));
                            for (const t of ts) {
                                const x = cubicAt(curP.x, seg.c1.x, seg.c2.x, seg.to.x, t);
                                const y = cubicAt(curP.y, seg.c1.y, seg.c2.y, seg.to.y, t);
                                if (Number.isFinite(x) && Number.isFinite(y)) includePoint({ x, y });
                            }

                            curP = { ...seg.to };
                        }
                    }
                    if (path.closed) includePoint(path.start);
                }

                if (Number.isFinite(minX) && Number.isFinite(minY) && Number.isFinite(maxX) && Number.isFinite(maxY)) {
                    const pad = 0.5;
                    const x = minX - pad + nextAccumulated.tx;
                    const y = minY - pad + nextAccumulated.ty;
                    const width = (maxX - minX) + 2 * pad;
                    const height = (maxY - minY) + 2 * pad;

                    if (width > 0 && height > 0) {
                        const localPaths = parsed.paths.map(p => ({
                            ...p,
                            start: { x: p.start.x - (minX - pad), y: p.start.y - (minY - pad) },
                            segments: (p.segments || []).map(seg => {
                                if (seg.kind === 'line') {
                                    return { kind: 'line', to: { x: seg.to.x - (minX - pad), y: seg.to.y - (minY - pad) } };
                                }
                                if (seg.kind === 'cubic') {
                                    return {
                                        kind: 'cubic',
                                        c1: { x: seg.c1.x - (minX - pad), y: seg.c1.y - (minY - pad) },
                                        c2: { x: seg.c2.x - (minX - pad), y: seg.c2.y - (minY - pad) },
                                        to: { x: seg.to.x - (minX - pad), y: seg.to.y - (minY - pad) }
                                    };
                                }
                                return seg;
                            })
                        }));

                        const bboxOverride = { x, y, width, height };
                        const { fills, strokes } = styleForNode(node, { bboxOverride });
                        elements.push({
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
                            style: { fills, strokes }
                        });
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
