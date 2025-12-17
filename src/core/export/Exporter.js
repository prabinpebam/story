/**
 * Exporter
 * 
 * Handles exporting elements as images (PNG, JPG, WEBP, SVG).
 * Downloads files with proper naming and scaling.
 * 
 * Features:
 * - Multi-format support (PNG, JPG, WEBP, SVG)
 * - Scale factors (0.5x, 0.75x, 1x, 1.5x, 2x, 3x, 4x)
 * - Width/height constraints (512w, 512h)
 * - Custom suffixes (@2x, @3x, etc.)
 * - Batch export (multiple presets)
 * - Clipboard export (PNG only)
 */

import { store } from '../Store.js';
import { getShapeKind } from '../shapes/ShapeElementAdapter.js';
import { elementToWorldPolygons, worldPolygonsToElementLocal } from '../shapes/booleans/ShapeToPolygons.js';
import { computeBooleanPaths } from '../shapes/booleans/BooleanEngine.js';
import { computeUnifiedClipPathCss } from '../shapes/masking/MaskEngine.js';

function escapeXml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function buildVectorPathD(paths) {
    if (!Array.isArray(paths) || paths.length === 0) return '';
    const parts = [];
    for (const path of paths) {
        if (!path || !path.start) continue;
        const sx = Number(path.start.x);
        const sy = Number(path.start.y);
        if (!Number.isFinite(sx) || !Number.isFinite(sy)) continue;
        parts.push(`M ${sx} ${sy}`);
        for (const seg of path.segments || []) {
            if (!seg || typeof seg.kind !== 'string') continue;
            if (seg.kind === 'line') {
                const x = Number(seg.to?.x);
                const y = Number(seg.to?.y);
                if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
                parts.push(`L ${x} ${y}`);
            } else if (seg.kind === 'cubic') {
                const x1 = Number(seg.c1?.x);
                const y1 = Number(seg.c1?.y);
                const x2 = Number(seg.c2?.x);
                const y2 = Number(seg.c2?.y);
                const x = Number(seg.to?.x);
                const y = Number(seg.to?.y);
                if (![x1, y1, x2, y2, x, y].every(Number.isFinite)) continue;
                parts.push(`C ${x1} ${y1} ${x2} ${y2} ${x} ${y}`);
            }
        }
        if (path.closed) parts.push('Z');
    }
    return parts.join(' ');
}

function extractSvgPathDFromCssClipPath(clipPath) {
    if (typeof clipPath !== 'string') return null;
    const trimmed = clipPath.trim();
    const m = trimmed.match(/^path\((['"])([\s\S]*)\1\)$/);
    if (m) return m[2];
    return null;
}

function stableHash(value) {
    const s = typeof value === 'string' ? value : JSON.stringify(value);
    return s.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
    }, 0);
}

function makePaintId(prefix, elementId, index, value) {
    return `${prefix}-${String(elementId || '')}-${index}-${stableHash(value)}`;
}

function parseLinearGradientStops(value) {
    if (!value || typeof value !== 'string') return null;
    const match = value.match(/linear-gradient\(([^,]+),(.+)\)/i);
    if (!match) return null;

    let angle = 90;
    const angleStr = match[1].trim();
    if (angleStr.toLowerCase().includes('deg')) {
        const v = Number.parseFloat(angleStr);
        if (Number.isFinite(v)) angle = v;
    }

    const stopsStr = match[2];
    const stops = stopsStr.split(',').map((s) => {
        const parts = s.trim().split(/\s+/);
        return {
            color: parts[0],
            position: Number.parseFloat(parts[1] || '0')
        };
    }).filter((s) => typeof s.color === 'string' && s.color.length > 0 && Number.isFinite(s.position));

    return { angle, stops };
}

function parseRadialGradientStops(value) {
    if (!value || typeof value !== 'string') return null;
    const match = value.match(/radial-gradient\((.+)\)/i);
    if (!match) return null;

    const inner = match[1];
    const parts = inner.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length < 2) return null;

    // Common CSS form: radial-gradient(circle, <stop>, <stop>, ...)
    // If the first part looks like a color stop, treat all parts as stops.
    const firstLooksLikeStop = /^(#|rgb\(|hsl\(|var\(|[a-zA-Z]+)/.test(parts[0]) && /\d+%/.test(parts[0]);
    const stopParts = firstLooksLikeStop ? parts : parts.slice(1);

    const stops = stopParts.map((s) => {
        const segs = s.trim().split(/\s+/);
        return {
            color: segs[0],
            position: Number.parseFloat(segs[1] || '0')
        };
    }).filter((s) => typeof s.color === 'string' && s.color.length > 0 && Number.isFinite(s.position));

    return { stops };
}

function buildLinearGradientMarkup(id, gradientValue) {
    const parsed = typeof gradientValue === 'object' && gradientValue?.type
        ? { angle: gradientValue.angle || 90, stops: Array.isArray(gradientValue.stops) ? gradientValue.stops : [] }
        : parseLinearGradientStops(gradientValue);
    if (!parsed || !Array.isArray(parsed.stops) || parsed.stops.length === 0) return null;

    const angle = Number(parsed.angle) || 90;
    const rad = (angle - 90) * Math.PI / 180;
    const x1 = 50 + 50 * Math.cos(rad);
    const y1 = 50 + 50 * Math.sin(rad);
    const x2 = 50 + 50 * Math.cos(rad + Math.PI);
    const y2 = 50 + 50 * Math.sin(rad + Math.PI);

    const stopsMarkup = parsed.stops.map((s) => {
        const pos = Number(s.position);
        const color = s.color || s.value || '#000000';
        return `<stop offset="${pos}%" stop-color="${escapeXml(color)}" />`;
    }).join('');

    return `<linearGradient id="${escapeXml(id)}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">${stopsMarkup}</linearGradient>`;
}

function buildRadialGradientMarkup(id, gradientValue) {
    const parsed = typeof gradientValue === 'object' && gradientValue?.type
        ? { stops: Array.isArray(gradientValue.stops) ? gradientValue.stops : [] }
        : parseRadialGradientStops(gradientValue);
    if (!parsed || !Array.isArray(parsed.stops) || parsed.stops.length === 0) return null;

    const stopsMarkup = parsed.stops.map((s) => {
        const pos = Number(s.position);
        const color = s.color || s.value || '#000000';
        return `<stop offset="${pos}%" stop-color="${escapeXml(color)}" />`;
    }).join('');

    return `<radialGradient id="${escapeXml(id)}" cx="50%" cy="50%" r="50%">${stopsMarkup}</radialGradient>`;
}

function buildGradientMarkup(id, gradientValue) {
    if (typeof gradientValue === 'string') {
        const v = gradientValue.trim().toLowerCase();
        if (v.startsWith('radial-gradient(')) return buildRadialGradientMarkup(id, gradientValue);
        return buildLinearGradientMarkup(id, gradientValue);
    }
    if (typeof gradientValue === 'object' && gradientValue?.type) {
        const t = String(gradientValue.type).toLowerCase();
        if (t.includes('radial')) return buildRadialGradientMarkup(id, gradientValue);
        return buildLinearGradientMarkup(id, gradientValue);
    }
    return null;
}

function buildImagePatternMarkup(id, href, width, height) {
    const w = Number(width) || 0;
    const h = Number(height) || 0;
    return `<pattern id="${escapeXml(id)}" patternUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}">` +
        `<image href="${escapeXml(href)}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" />` +
        `</pattern>`;
}

function resolveBooleanDerivedPaths(booleanEl, slideData) {
    const operation = booleanEl?.operation || 'union';
    const operandIds = Array.isArray(booleanEl?.operands) ? booleanEl.operands : [];
    const elements = slideData?.effectiveElements || slideData?.elements || {};

    const operandPolysLocal = [];
    for (const id of operandIds) {
        const opEl = elements[id];
        if (!opEl) continue;

        const world = elementToWorldPolygons(slideData, opEl);
        const local = worldPolygonsToElementLocal(slideData, booleanEl, world);
        operandPolysLocal.push(local);
    }

    const res = computeBooleanPaths({ operation, operands: operandPolysLocal });
    return { status: res.status, paths: Array.isArray(res.paths) ? res.paths : [] };
}

/**
 * Pure SVG markup builder (no DOM).
 *
 * Note: This is intentionally conservative; it exports a best-effort portable SVG subset.
 *
 * @param {Array<Object>} elements
 * @param {{width:number,height:number,bounds:{x:number,y:number,width:number,height:number},slideData?:any}} options
 */
export function buildSvgMarkup(elements, { width, height, bounds, slideData } = {}) {
    const safeBounds = bounds || calculateBounds(elements || []);
    const vbW = Number(safeBounds.width) || 0;
    const vbH = Number(safeBounds.height) || 0;
    const outW = Number(width) || vbW;
    const outH = Number(height) || vbH;

    const defsParts = [];
    const bodyParts = [];

    const ordered = Array.isArray(elements) ? [...elements] : [];
    ordered.sort((a, b) => {
        const ai = (a && typeof a.id === 'string') ? a.id : '';
        const bi = (b && typeof b.id === 'string') ? b.id : '';
        return ai.localeCompare(bi);
    });

    for (const element of ordered) {
        if (!element) continue;

        const x = (Number(element.x) || 0) - (Number(safeBounds.x) || 0);
        const y = (Number(element.y) || 0) - (Number(safeBounds.y) || 0);

        const shapeKind = getShapeKind(element);

        if (shapeKind === 'mask') continue;

        const clipId = (() => {
            if (!slideData) return null;
            const { clipPath } = computeUnifiedClipPathCss(element, slideData);
            if (!clipPath) return null;

            if (clipPath.trim() === 'inset(100%)') {
                const id = `clip-${String(element.id || '') || 'el'}`;
                defsParts.push(`<clipPath id="${escapeXml(id)}"><rect x="0" y="0" width="0" height="0" /></clipPath>`);
                return id;
            }

            const d = extractSvgPathDFromCssClipPath(clipPath);
            if (!d) return null;

            const id = `clip-${String(element.id || '') || 'el'}`;
            defsParts.push(`<clipPath id="${escapeXml(id)}"><path d="${d}" /></clipPath>`);
            return id;
        })();

        const transform = (() => {
            let t = `translate(${x} ${y})`;
            const rot = Number(element.rotation) || 0;
            if (rot) {
                const cx = (Number(element.width) || 0) / 2;
                const cy = (Number(element.height) || 0) / 2;
                t += ` rotate(${rot} ${cx} ${cy})`;
            }
            return t;
        })();

        const groupOpen = clipId
            ? `<g transform="${transform}" clip-path="url(#${escapeXml(clipId)})">`
            : `<g transform="${transform}">`;
        const groupClose = `</g>`;

        const getFillPaint = () => {
            const fillLayer = (element.style?.fills || []).find((f) => f && f.visible !== false);
            if (!fillLayer) return { fill: 'none', fillOpacity: 1 };
            const fillOpacity = (fillLayer.opacity ?? 100) / 100;

            if (fillLayer.type === 'gradient' && fillLayer.value) {
                const id = makePaintId('fill-grad', element.id, 0, fillLayer.value);
                const markup = buildGradientMarkup(id, fillLayer.value);
                if (markup) defsParts.push(markup);
                return { fill: markup ? `url(#${id})` : '#808080', fillOpacity };
            }

            if (fillLayer.type === 'image' && fillLayer.value) {
                const id = makePaintId('fill-img', element.id, 0, fillLayer.value);
                defsParts.push(buildImagePatternMarkup(id, fillLayer.value, element.width, element.height));
                return { fill: `url(#${id})`, fillOpacity };
            }

            if (fillLayer.type === 'code' || fillLayer.type === 'video') {
                // Deterministic fallback; portable SVG has no native code/video fills.
                return { fill: '#808080', fillOpacity };
            }

            const color = fillLayer.color || fillLayer.value || (fillLayer ? '#000000' : 'none');
            return { fill: String(color), fillOpacity };
        };

        const getStrokePaint = () => {
            const strokeLayer = (element.style?.strokes || []).find((s) => s && s.visible !== false);
            if (!strokeLayer) return { stroke: 'none', strokeOpacity: 1, strokeWidth: 0 };
            const strokeOpacity = (strokeLayer.opacity ?? 100) / 100;
            const strokeWidth = Number(strokeLayer.width ?? 0) || 0;
            if (strokeWidth <= 0) return { stroke: 'none', strokeOpacity, strokeWidth: 0 };

            if (strokeLayer.type === 'gradient' && strokeLayer.value) {
                const id = makePaintId('stroke-grad', element.id, 0, strokeLayer.value);
                const markup = buildGradientMarkup(id, strokeLayer.value);
                if (markup) defsParts.push(markup);
                return { stroke: markup ? `url(#${id})` : '#000000', strokeOpacity, strokeWidth };
            }

            const stroke = strokeLayer.color || strokeLayer.value || '#000000';
            return { stroke: String(stroke), strokeOpacity, strokeWidth };
        };

        if (shapeKind === 'rectangle') {
            const { fill, fillOpacity } = getFillPaint();
            const { stroke, strokeOpacity, strokeWidth } = getStrokePaint();
            const borderRadius = element.borderRadius || 0;

            let rect = `<rect x="0" y="0" width="${element.width}" height="${element.height}" `;
            rect += `fill="${escapeXml(fill)}" fill-opacity="${fillOpacity}"`;
            if (strokeWidth > 0 && stroke !== 'none') {
                rect += ` stroke="${escapeXml(stroke)}" stroke-opacity="${strokeOpacity}" stroke-width="${strokeWidth}"`;
            }
            if (borderRadius > 0) {
                rect += ` rx="${borderRadius}" ry="${borderRadius}"`;
            }
            rect += ` />`;

            bodyParts.push(`${groupOpen}${rect}${groupClose}`);
            continue;
        }

        if (shapeKind === 'ellipse') {
            const { fill, fillOpacity } = getFillPaint();
            const { stroke, strokeOpacity, strokeWidth } = getStrokePaint();
            const cx = (Number(element.width) || 0) / 2;
            const cy = (Number(element.height) || 0) / 2;
            const rx = (Number(element.width) || 0) / 2;
            const ry = (Number(element.height) || 0) / 2;

            let ellipse = `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${escapeXml(fill)}" fill-opacity="${fillOpacity}"`;
            if (strokeWidth > 0 && stroke !== 'none') {
                ellipse += ` stroke="${escapeXml(stroke)}" stroke-opacity="${strokeOpacity}" stroke-width="${strokeWidth}"`;
            }
            ellipse += ` />`;
            bodyParts.push(`${groupOpen}${ellipse}${groupClose}`);
            continue;
        }

        if (element.type === 'text') {
            const color = element.style?.color || '#000000';
            const fontSize = element.style?.fontSize || 16;
            const fontFamily = element.style?.fontFamily || 'sans-serif';
            const fontWeight = element.style?.fontWeight || 'normal';
            const textContent = (element.content?.replace(/<[^>]*>/g, '') || '').trim();

            let text = `<text x="0" y="${fontSize}" `;
            text += `font-family="${escapeXml(fontFamily)}" font-size="${fontSize}" `;
            text += `font-weight="${escapeXml(fontWeight)}" fill="${color}">`;
            text += escapeXml(textContent);
            text += `</text>`;
            bodyParts.push(`${groupOpen}${text}${groupClose}`);
            continue;
        }

        if (shapeKind === 'vector' || shapeKind === 'boolean') {
            const paths = shapeKind === 'boolean'
                ? resolveBooleanDerivedPaths(element, slideData).paths
                : (Array.isArray(element.paths) ? element.paths : []);

            const d = buildVectorPathD(paths);
            if (!d) continue;

            const { fill, fillOpacity } = getFillPaint();
            const { stroke, strokeOpacity, strokeWidth } = getStrokePaint();

            const fillRule = (() => {
                const fr = paths.find((p) => p && typeof p.fillRule === 'string')?.fillRule;
                const v = typeof fr === 'string' ? fr.trim().toLowerCase() : '';
                return v === 'evenodd' ? 'evenodd' : 'nonzero';
            })();

            let path = `<path d="${d}" fill="${escapeXml(fill)}" fill-opacity="${fillOpacity}" fill-rule="${fillRule}"`;
            if (strokeWidth > 0 && stroke !== 'none') {
                path += ` stroke="${escapeXml(stroke)}" stroke-opacity="${strokeOpacity}" stroke-width="${strokeWidth}"`;
            }
            path += ` />`;

            bodyParts.push(`${groupOpen}${path}${groupClose}`);
            continue;
        }
    }

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${outW}" height="${outH}" viewBox="0 0 ${vbW} ${vbH}">`;
    if (defsParts.length > 0) {
        svg += `<defs>${defsParts.join('')}</defs>`;
    }
    svg += bodyParts.join('');
    svg += `</svg>`;
    return svg;
}

/**
 * Export elements with given presets
 * @param {Array<Object>} elements - Elements to export
 * @param {Array<Object>} presets - Export presets
 * @param {Object} options - Export options
 * @returns {Promise<void>}
 */
export async function exportElements(elements, presets, options = {}) {
    if (!elements || elements.length === 0) {
        throw new Error('No elements to export');
    }
    
    if (!presets || presets.length === 0) {
        throw new Error('No export presets defined');
    }
    
    // Get element name for file naming
    const elementName = elements.length === 1 
        ? (elements[0].name || 'element')
        : 'selection';
    
    // Sanitize name for filename
    const baseName = sanitizeFilename(elementName);
    
    // Export each preset
    for (const preset of presets) {
        try {
            await exportPreset(elements, preset, baseName);
        } catch (error) {
            console.error(`Failed to export preset ${preset.scale} ${preset.format}:`, error);
            // Continue with next preset even if one fails
        }
    }
}

/**
 * Export a single preset
 * @param {Array<Object>} elements
 * @param {Object} preset - {scale, format, suffix}
 * @param {string} baseName
 * @returns {Promise<void>}
 */
async function exportPreset(elements, preset, baseName) {
    const { scale: scaleStr, format, suffix = '' } = preset;
    
    console.log('[Exporter] Export preset:', preset, 'for elements:', elements);
    
    // Parse scale
    const scaleInfo = parseScale(scaleStr);
    
    // Calculate dimensions
    const bounds = calculateBounds(elements);
    console.log('[Exporter] Calculated bounds:', bounds);
    let width = bounds.width;
    let height = bounds.height;
    
    if (scaleInfo.type === 'multiplier') {
        width *= scaleInfo.value;
        height *= scaleInfo.value;
    } else if (scaleInfo.type === 'width') {
        const scale = scaleInfo.value / width;
        width = scaleInfo.value;
        height = height * scale;
    } else if (scaleInfo.type === 'height') {
        const scale = scaleInfo.value / height;
        height = scaleInfo.value;
        width = width * scale;
    }
    
    // Round to integers
    width = Math.round(width);
    height = Math.round(height);
    
    // Generate filename
    const filename = `${baseName}${suffix}.${format}`;
    
    // Render based on format
    if (format === 'svg') {
        await exportSVG(elements, filename, { width, height, bounds });
    } else {
        await exportRaster(elements, filename, format, { width, height, bounds });
    }
}

/**
 * Draw rectangle to canvas
 */
function drawRectangle(ctx, element, x, y, w, h) {
    // Get fill from multiple possible sources
    const fill = element.style?.fills?.[0]?.value 
        || element.style?.fills?.[0]?.color 
        || element.style?.backgroundColor 
        || element.fill 
        || '#D9D9D9'; // Default gray
    
    const borderRadius = element.borderRadius || element.style?.radius || 0;
    
    console.log('[drawRectangle]', { fill, borderRadius, element });
    ctx.fillStyle = fill;
    
    if (borderRadius > 0) {
        const radius = Math.min(borderRadius, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + w - radius, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
        ctx.lineTo(x + w, y + h - radius);
        ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        ctx.lineTo(x + radius, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
    } else {
        ctx.fillRect(x, y, w, h);
    }
    
    // Draw border if present
    if (element.stroke || element.style?.border) {
        ctx.strokeStyle = element.stroke || element.style.border.color || '#000000';
        ctx.lineWidth = element.strokeWidth || element.style?.border?.width || 1;
        ctx.strokeRect(x, y, w, h);
    }
}

/**
 * Draw ellipse to canvas
 */
function drawEllipse(ctx, element, x, y, w, h) {
    // Get fill from multiple possible sources
    const fill = element.style?.fills?.[0]?.value 
        || element.style?.fills?.[0]?.color 
        || element.style?.backgroundColor 
        || element.fill 
        || '#D9D9D9';
    
    console.log('[drawEllipse]', { fill, element });
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw border if present
    if (element.stroke || element.style?.border) {
        ctx.strokeStyle = element.stroke || element.style.border.color || '#000000';
        ctx.lineWidth = element.strokeWidth || element.style?.border?.width || 1;
        ctx.stroke();
    }
}

/**
 * Draw text to canvas
 */
async function drawText(ctx, element, x, y, w, h) {
    const fontSize = element.fontSize || element.style?.fontSize || 16;
    const fontFamily = element.fontFamily || element.style?.fontFamily || 'Inter';
    const color = element.color || element.style?.color || '#000000';
    const textAlign = element.textAlign || element.style?.textAlign || 'left';
    const verticalAlign = element.verticalAlign || element.style?.verticalAlign || 'top';
    const content = element.content || element.text || '';
    
    console.log('[drawText]', { fontSize, fontFamily, color, content, element });
    
    ctx.fillStyle = color;
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textAlign = textAlign;
    ctx.textBaseline = verticalAlign === 'middle' ? 'middle' : 'top';
    
    const textX = textAlign === 'center' ? x + w / 2 : textAlign === 'right' ? x + w : x;
    const textY = verticalAlign === 'middle' ? y + h / 2 : y;
    
    ctx.fillText(content, textX, textY);
}

/**
 * Draw image to canvas
 */
async function drawImage(ctx, element, x, y, w, h) {
    if (!element.src) return;
    
    try {
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Try to avoid CORS issues
        
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = () => {
                console.warn('Failed to load image:', element.src);
                resolve(); // Continue even if image fails
            };
            img.src = element.src;
            
            // Timeout after 5 seconds
            setTimeout(() => resolve(), 5000);
        });
        
        if (img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, x, y, w, h);
        } else {
            // Draw placeholder if image failed
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = '#ccc';
            ctx.strokeRect(x, y, w, h);
        }
    } catch (error) {
        console.warn('Error drawing image:', error);
        // Draw placeholder
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(x, y, w, h);
    }
}

/**
 * Export as raster image (PNG, JPG, WEBP)
 * @param {Array<Object>} elements
 * @param {string} filename
 * @param {string} format
 * @param {Object} dimensions
 * @returns {Promise<void>}
 */
async function exportRaster(elements, filename, format, { width, height, bounds }) {
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    
    // Fill background
    if (format === 'jpg') {
        // JPG doesn't support transparency, use white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
    }
    
    // Draw elements directly to canvas to avoid CORS/tainting issues
    const scaleX = width / bounds.width;
    const scaleY = height / bounds.height;
    
    console.log('[Exporter] Drawing to canvas:', { width, height, bounds, scaleX, scaleY });
    
    for (const element of elements) {
        console.log('[Exporter] Drawing element:', element.type, element);
        const x = (element.x - bounds.x) * scaleX;
        const y = (element.y - bounds.y) * scaleY;
        const w = element.width * scaleX;
        const h = element.height * scaleY;
        
        ctx.save();
        
        // Apply rotation if present
        if (element.rotation) {
            const centerX = x + w / 2;
            const centerY = y + h / 2;
            ctx.translate(centerX, centerY);
            ctx.rotate((element.rotation * Math.PI) / 180);
            ctx.translate(-centerX, -centerY);
        }
        
        // Draw based on element type
        const shapeKind = getShapeKind(element);

        if (shapeKind === 'rectangle') {
            drawRectangle(ctx, element, x, y, w, h);
        } else if (shapeKind === 'ellipse') {
            drawEllipse(ctx, element, x, y, w, h);
        } else if (element.type === 'text') {
            await drawText(ctx, element, x, y, w, h);
        } else if (element.type === 'image') {
            await drawImage(ctx, element, x, y, w, h);
        } else {
            // Unknown type - draw a placeholder rectangle
            console.warn('[Exporter] Unknown element type:', element.type);
            ctx.fillStyle = '#e0e0e0';
            ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = '#999';
            ctx.strokeRect(x, y, w, h);
        }
        
        ctx.restore();
    }
    
    // Convert to blob and download
    const mimeType = getMimeType(format);
    const quality = format === 'jpg' ? 0.92 : undefined;
    
    const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, mimeType, quality);
    });
    
    downloadBlob(blob, filename);
}

/**
 * Export as SVG
 * @param {Array<Object>} elements
 * @param {string} filename
 * @param {Object} dimensions
 * @returns {Promise<void>}
 */
async function exportSVG(elements, filename, { width, height, bounds }) {
    const state = store.getState();
    const slideData = state.editor.mode === 'master'
        ? state.slideMasterPresets[state.editor.activeMasterId]
        : state.slides[state.editor.activeSlideId];

    const svg = buildSvgMarkup(elements, { width, height, bounds, slideData });
    
    // Create blob and download
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    downloadBlob(blob, filename);
}

/**
 * Export to clipboard as PNG
 * @param {Array<Object>} elements
 * @param {Object} options
 * @returns {Promise<void>}
 */
export async function exportToClipboard(elements, options = {}) {
    const { scale = 2 } = options; // Default 2x for quality
    
    if (!navigator.clipboard || !navigator.clipboard.write) {
        throw new Error('Clipboard API not supported. Use HTTPS or localhost.');
    }
    
    // Calculate dimensions
    const bounds = calculateBounds(elements);
    const width = Math.round(bounds.width * scale);
    const height = Math.round(bounds.height * scale);
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    
    // Render elements (simplified version)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // For actual implementation, render like in exportRaster
    // This is a placeholder
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(10, 10, width - 20, height - 20);
    
    // Convert to blob
    const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/png');
    });
    
    // Copy to clipboard
    await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
    ]);
}

/**
 * Calculate bounding box of elements
 * @param {Array<Object>} elements
 * @returns {{x: number, y: number, width: number, height: number}}
 */
function calculateBounds(elements) {
    if (elements.length === 0) {
        return { x: 0, y: 0, width: 100, height: 100 };
    }
    
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    for (const el of elements) {
        const x = el.x || 0;
        const y = el.y || 0;
        const width = el.width || 0;
        const height = el.height || 0;
        
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + width);
        maxY = Math.max(maxY, y + height);
    }
    
    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
    };
}

/**
 * Parse scale string
 * @param {string} scaleStr - e.g., "2x", "512w", "512h"
 * @returns {{type: string, value: number}}
 */
function parseScale(scaleStr) {
    if (scaleStr.endsWith('x')) {
        return { type: 'multiplier', value: parseFloat(scaleStr) };
    } else if (scaleStr.endsWith('w')) {
        return { type: 'width', value: parseInt(scaleStr) };
    } else if (scaleStr.endsWith('h')) {
        return { type: 'height', value: parseInt(scaleStr) };
    }
    return { type: 'multiplier', value: 1 };
}

/**
 * Get MIME type for format
 * @param {string} format
 * @returns {string}
 */
function getMimeType(format) {
    const mimeTypes = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'webp': 'image/webp',
        'svg': 'image/svg+xml'
    };
    return mimeTypes[format] || 'image/png';
}

/**
 * Sanitize filename
 * @param {string} name
 * @returns {string}
 */
function sanitizeFilename(name) {
    return name
        .replace(/[^a-z0-9_-]/gi, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .toLowerCase();
}

/**
 * Download blob as file
 * @param {Blob} blob
 * @param {string} filename
 */
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
