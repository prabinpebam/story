import {
    SLIDE_TRANSITION_TYPES,
    coerceSlideTransition
} from './presentation/SlideTransitionUtils.js';
import { computeMorphL0NameMatches } from './presentation/MorphMatching.js';
import { telemetry } from './telemetry/Telemetry.js';

export class AnimationManager {
    constructor() {
        this.isAnimating = false;
    }

    get anime() {
        if (typeof window.anime === 'function') return window.anime;
        if (window.anime && typeof window.anime.default === 'function') return window.anime.default;
        if (window.anime && window.anime.animate) return window.anime; // v4 support
        console.warn('Anime.js is not loaded or not a function', window.anime);
        return null;
    }

    run(params) {
        const anime = this.anime;
        if (!anime) return { finished: Promise.resolve() };

        let resolveFinished;
        const callbackFinished = new Promise((resolve) => {
            resolveFinished = resolve;
        });

        let didResolve = false;
        let timeoutId = null;

        const safeResolve = () => {
            try {
                if (didResolve) return;
                didResolve = true;
                if (timeoutId !== null) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
                resolveFinished?.();
            } catch {
                // ignore
            }
        };

        const patchedParams = { ...(params || {}) };

        // IMPORTANT:
        // - Anime.js v3 (function) uses `complete`.
        // - Anime.js v4 (`anime.animate`) uses `onComplete`.
        // Passing unsupported keys (e.g. `onComplete` into v3) can be treated as an
        // animatable property and prevent the animation from running correctly.
        if (typeof anime === 'function') {
            const userComplete = patchedParams.complete;
            patchedParams.complete = (...args) => {
                try {
                    if (typeof userComplete === 'function') userComplete(...args);
                } finally {
                    safeResolve();
                }
            };
            // Ensure we don't accidentally feed v3 an unsupported callback key.
            if ('onComplete' in patchedParams) delete patchedParams.onComplete;
        } else if (anime.animate) {
            const userOnComplete = patchedParams.onComplete;
            patchedParams.onComplete = (...args) => {
                try {
                    if (typeof userOnComplete === 'function') userOnComplete(...args);
                } finally {
                    safeResolve();
                }
            };
            if ('complete' in patchedParams) delete patchedParams.complete;
        }

        const duration = Number(patchedParams.duration);
        const immediate = !Number.isFinite(duration) || duration <= 0;

        // Fallback: if callbacks never fire, resolve around the expected time.
        // (This prevents early unmounts when Anime.js doesn't expose a usable `finished` promise.)
        if (!immediate) {
            timeoutId = setTimeout(safeResolve, Math.max(0, duration) + 50);
        }

        if (typeof anime === 'function') {
            // v3
            const result = anime(patchedParams);
            try {
                const finished = result?.finished;
                if (finished && typeof finished.catch === 'function') {
                    finished.catch((err) => {
                        try {
                            console.error(err);
                        } finally {
                            safeResolve();
                        }
                    });
                }
            } catch {
                // ignore
            }
            if (immediate) queueMicrotask(safeResolve);
            return { finished: callbackFinished, result };
        } else if (anime.animate) {
            // v4
            const { targets, ...rest } = patchedParams;
            if (rest.easing && !rest.ease) {
                rest.ease = rest.easing;
                delete rest.easing;
            }
            const result = anime.animate(targets, rest);
            try {
                const finished = result?.finished;
                if (finished && typeof finished.catch === 'function') {
                    finished.catch((err) => {
                        try {
                            console.error(err);
                        } finally {
                            safeResolve();
                        }
                    });
                }
            } catch {
                // ignore
            }
            if (immediate) queueMicrotask(safeResolve);
            return { finished: callbackFinished, result };
        }
        return { finished: Promise.resolve() };
    }

    _asFinishedPromise(result) {
        if (!result) return Promise.resolve();

        // Anime.js v3: returns an object with `finished: Promise`.
        const maybeFinished = result.finished;
        if (maybeFinished && typeof maybeFinished.then === 'function') {
            return maybeFinished;
        }

        // Some APIs may return an array of animations.
        if (Array.isArray(result)) {
            return Promise.all(result.map((r) => this._asFinishedPromise(r))).then(() => undefined);
        }

        // Web Animations API style: Animation has `finished: Promise`.
        if (result && typeof result === 'object') {
            const waapiFinished = result.finished;
            if (waapiFinished && typeof waapiFinished.then === 'function') {
                return waapiFinished;
            }

            // Some libraries expose `animations: Animation[]`.
            const animations = result.animations;
            if (Array.isArray(animations) && animations.length) {
                return Promise.all(animations.map((a) => this._asFinishedPromise(a))).then(() => undefined);
            }
        }

        // Best-effort fallback: treat as synchronous.
        return Promise.resolve();
    }

    async transition(container, oldContent, newContent, type = 'fade') {
        if (this.isAnimating) return;
        this.isAnimating = true;

        const anime = this.anime;
        const transition = coerceSlideTransition(type);

        const detectUnsupported = () => {
            if (transition.type !== SLIDE_TRANSITION_TYPES.NONE) return false;
            if (type && typeof type === 'object') {
                const t = typeof type.type === 'string' ? type.type : '';
                return Boolean(t && t !== SLIDE_TRANSITION_TYPES.NONE);
            }
            if (typeof type === 'string') {
                // Legacy strings that result in NONE but are not 'none' are unsupported for animation.
                const v = type.trim();
                return Boolean(v && v !== 'none');
            }
            return false;
        };

        const duration = transition.durationMs;
        const easing = (() => {
            const v = typeof transition.easing === 'string' ? transition.easing.trim() : '';
            switch (v) {
                case 'linear':
                    return 'linear';
                case 'ease-in':
                    return 'easeInQuad';
                case 'ease-out':
                    return 'easeOutQuad';
                case 'ease-in-out':
                default:
                    return 'easeInOutQuad';
            }
        })();

        const getAxisAndSign = (direction) => {
            switch (direction) {
                case 'left':
                    return { axis: 'X', sign: -1 };
                case 'right':
                    return { axis: 'X', sign: 1 };
                case 'up':
                    return { axis: 'Y', sign: -1 };
                case 'down':
                default:
                    return { axis: 'Y', sign: 1 };
            }
        };

        const setTranslatePercent = (el, axis, value) => {
            if (!el) return;
            el.style.transform = axis === 'X' ? `translateX(${value})` : `translateY(${value})`;
        };

        const getWipeClipPaths = (direction) => {
            const end = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
            let start;

            switch (direction) {
                case 'left':
                    start = 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)';
                    break;
                case 'up':
                    start = 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)';
                    break;
                case 'down':
                    start = 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)';
                    break;
                case 'upLeft':
                    start = 'polygon(100% 100%, 100% 100%, 100% 100%, 100% 100%)';
                    break;
                case 'upRight':
                    start = 'polygon(0% 100%, 0% 100%, 0% 100%, 0% 100%)';
                    break;
                case 'downLeft':
                    start = 'polygon(100% 0%, 100% 0%, 100% 0%, 100% 0%)';
                    break;
                case 'downRight':
                    start = 'polygon(0% 0%, 0% 0%, 0% 0%, 0% 0%)';
                    break;
                case 'right':
                default:
                    start = 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)';
                    break;
            }

            return { start, end };
        };

        let prevOverflow;
        let didSetOverflow = false;

        try {
            oldContent.style.position = 'absolute';
            oldContent.style.top = '0';
            oldContent.style.left = '0';
            oldContent.style.width = '100%';
            oldContent.style.height = '100%';
            oldContent.style.zIndex = 1;

            // Defensive reset: ensure outgoing starts from a neutral transform.
            // If a prior transition (or a cancelled transition) left a stale transform,
            // the outgoing slide can be shifted off-center, exposing stage background.
            oldContent.style.transform = '';

            newContent.style.position = 'absolute';
            newContent.style.top = '0';
            newContent.style.left = '0';
            newContent.style.width = '100%';
            newContent.style.height = '100%';
            newContent.style.zIndex = 2;

            // Apply the initial visual state synchronously BEFORE the incoming slide is visible.
            // This prevents a white flash where the incoming slide paints at its final position
            // before the animation engine applies the first keyframe.
            if (transition.type === SLIDE_TRANSITION_TYPES.CROSS_FADE) {
                oldContent.style.opacity = '1';
                newContent.style.opacity = '0';
            } else if (transition.type === SLIDE_TRANSITION_TYPES.MORPH) {
                // Morph: initial state is prepared per-element below.
                oldContent.style.opacity = '1';
                newContent.style.opacity = '1';
            } else if (transition.type === SLIDE_TRANSITION_TYPES.COVER) {
                const { axis, sign } = getAxisAndSign(transition.direction);
                const from = sign < 0 ? '-100%' : '100%';
                setTranslatePercent(oldContent, axis, '0%');
                setTranslatePercent(newContent, axis, from);
            } else if (transition.type === SLIDE_TRANSITION_TYPES.PUSH) {
                const { axis, sign } = getAxisAndSign(transition.direction);
                const newFrom = sign < 0 ? '-100%' : '100%';
                setTranslatePercent(oldContent, axis, '0%');
                setTranslatePercent(newContent, axis, newFrom);
            } else if (transition.type === SLIDE_TRANSITION_TYPES.UNCOVER) {
                const { axis } = getAxisAndSign(transition.direction);
                setTranslatePercent(oldContent, axis, '0%');
            } else if (transition.type === SLIDE_TRANSITION_TYPES.WIPE) {
                const { start } = getWipeClipPaths(transition.direction);
                newContent.style.clipPath = start;
            }

            // Ensure the new slide is on top in DOM order as well.
            container.appendChild(newContent);

            const shouldAnimate = Boolean(anime) && transition.type !== SLIDE_TRANSITION_TYPES.NONE && duration > 0;

            if (!shouldAnimate) {
                if (!anime && transition.type !== SLIDE_TRANSITION_TYPES.NONE && duration > 0) {
                    console.warn('Anime.js not loaded, skipping transition');
                    telemetry.emit('transition_fallback_to_none', {
                        reason: 'animation-engine-missing',
                        transitionType: transition.type,
                        direction: transition.direction,
                    });
                } else if (detectUnsupported()) {
                    telemetry.emit('transition_fallback_to_none', {
                        reason: 'unsupported',
                        transitionType: typeof type === 'object' ? type?.type : type,
                        direction: typeof type === 'object' ? type?.direction : undefined,
                    });
                }

                // Ensure the incoming content is only revealed after its start state is applied.
                newContent.style.visibility = 'visible';

                newContent.style.transform = '';
                newContent.style.clipPath = '';
                newContent.style.opacity = '';
                newContent.style.zIndex = 1;

                if (oldContent.parentNode === container) {
                    container.removeChild(oldContent);
                }
                return;
            }

            if (transition.type === SLIDE_TRANSITION_TYPES.MORPH) {
                const q = (root) => Array.from(root?.querySelectorAll?.('.slide-element[data-element-id]') || []);

                const getBg = (root) => {
                    try {
                        return root?.querySelector?.('.slide-background') || null;
                    } catch {
                        return null;
                    }
                };

                const isEligible = (el) => {
                    if (!el) return false;
                    // V1: L0-only (no parent id)
                    if (el.getAttribute('data-parent-id')) return false;
                    // Exclude placeholders from matching (they always have fallback names).
                    if (el.getAttribute('data-is-placeholder') === 'true') return false;
                    // Must have a (trimmed) layer name
                    const name = (el.getAttribute('data-layer-name') || '').trim();
                    if (!name) return false;
                    try {
                        const cs = window.getComputedStyle(el);
                        if (cs && cs.display === 'none') return false;
                    } catch {
                        // ignore
                    }
                    return true;
                };

                const oldElsAll = q(oldContent);
                const newElsAll = q(newContent);

                const oldElsEligible = oldElsAll.filter(isEligible);
                const newElsEligible = newElsAll.filter(isEligible);

                const idFor = (el) => (el?.getAttribute?.('data-element-id') || el?.id || '').trim();
                const toMatchElements = (els) => {
                    /** @type {Record<string, {id: string, name?: string, parentId?: string | null}>} */
                    const map = {};
                    for (const el of els) {
                        const id = idFor(el);
                        if (!id) continue;
                        map[id] = {
                            id,
                            name: (el.getAttribute('data-layer-name') || ''),
                            parentId: el.getAttribute('data-parent-id') || null
                        };
                    }
                    return map;
                };

                const srcOrder = oldElsEligible.map(idFor).filter(Boolean);
                const dstOrder = newElsEligible.map(idFor).filter(Boolean);
                const srcElements = toMatchElements(oldElsEligible);
                const dstElements = toMatchElements(newElsEligible);

                const plan = computeMorphL0NameMatches({
                    srcOrder,
                    srcElements,
                    dstOrder,
                    dstElements
                });

                const oldById = new Map(oldElsAll.map((el) => [idFor(el), el]));
                const newById = new Map(newElsAll.map((el) => [idFor(el), el]));

                /** @type {Array<{name: string, src: HTMLElement, dst: HTMLElement, srcDup: boolean, dstDup: boolean}>} */
                const matches = plan.matches
                    .map((m) => {
                        const src = oldById.get(m.srcId);
                        const dst = newById.get(m.dstId);
                        if (!src || !dst) return null;
                        return { name: m.name, src, dst, srcDup: m.srcDup, dstDup: m.dstDup };
                    })
                    .filter(Boolean);

                const matchedOld = new Set(matches.map((m) => m.src));
                const matchedNew = new Set(matches.map((m) => m.dst));

                const unmatchedOld = oldElsAll.filter((el) => !matchedOld.has(el));
                const unmatchedNew = newElsAll.filter((el) => !matchedNew.has(el));

                // Debug hooks (stable + lightweight for tests)
                try {
                    newContent.setAttribute('data-morph-match-count', String(matches.length));
                    // Explainability metadata for unit/E2E assertions (not persisted).
                    newContent.__morphDebug = {
                        matches: matches.map((m) => ({
                            matchKey: m.name,
                            srcId: idFor(m.src),
                            dstId: idFor(m.dst),
                            srcDup: m.srcDup,
                            dstDup: m.dstDup
                        }))
                    };

                    // Stable DOM evidence (per matched element) for Playwright assertions.
                    // Note: these attributes are runtime-only and not persisted.
                    for (let i = 0; i < matches.length; i++) {
                        const m = matches[i];
                        const dstId = idFor(m.dst);
                        const srcId = idFor(m.src);
                        if (!dstId || !srcId) continue;

                        m.dst.setAttribute('data-morph-match-key', String(m.name));
                        m.dst.setAttribute('data-morph-match-src-id', String(srcId));
                        m.dst.setAttribute('data-morph-match-dst-id', String(dstId));
                        m.dst.setAttribute('data-morph-match-src-dup', m.srcDup ? '1' : '0');
                        m.dst.setAttribute('data-morph-match-dst-dup', m.dstDup ? '1' : '0');
                    }
                } catch {
                    // ignore
                }

                const readInline = (el) => {
                    const style = el?.style;
                    const transform = style?.transform || '';
                    const parseTransformParts = (t) => {
                        const s = typeof t === 'string' ? t : '';
                        const rot = (() => {
                            const m = s.match(/rotate\(([-\d.]+)deg\)/);
                            return m ? Number(m[1]) : 0;
                        })();
                        const scale = s.match(/scale\(([-\d.]+)\s*,\s*([-\d.]+)\)/);
                        const sx = scale ? Number(scale[1]) : 1;
                        const sy = scale ? Number(scale[2]) : 1;
                        return { rot: Number.isFinite(rot) ? rot : 0, sx: Number.isFinite(sx) ? sx : 1, sy: Number.isFinite(sy) ? sy : 1 };
                    };
                    const parts = parseTransformParts(transform);
                    return {
                        left: style?.left || '0px',
                        top: style?.top || '0px',
                        width: style?.width || '0px',
                        height: style?.height || '0px',
                        transform,
                        rotate: parts.rot,
                        scaleX: parts.sx,
                        scaleY: parts.sy,
                        opacity: style?.opacity || '',
                        borderRadius: style?.borderRadius || ''
                    };
                };

                const getEffectiveOpacity = (el) => {
                    if (!el) return '1';
                    const inline = el.style?.opacity;
                    if (inline) return inline;
                    try {
                        const cs = window.getComputedStyle(el);
                        return cs?.opacity || '1';
                    } catch {
                        return '1';
                    }
                };

                /** @type {Map<HTMLElement, any>} */
                const restoreNew = new Map();

                const getFillLayers = (el) => {
                    try {
                        return Array.from(el?.querySelectorAll?.('.fill-layer') || []);
                    } catch {
                        return [];
                    }
                };

                const isSolidFillLayer = (layer) => {
                    if (!layer) return false;
                    const bgc = layer.style?.backgroundColor;
                    if (bgc && String(bgc).trim()) return true;
                    const bg = layer.style?.background;
                    if (bg && String(bg).includes('gradient')) return false;
                    const bgi = layer.style?.backgroundImage;
                    if (bgi && String(bgi).trim() && String(bgi) !== 'none') return false;
                    return false;
                };

                const getLayerOpacity = (layer) => {
                    const o = layer?.style?.opacity;
                    if (o !== undefined && o !== null && String(o).trim() !== '') {
                        const v = Number(o);
                        return Number.isFinite(v) ? v : 1;
                    }
                    return 1;
                };

                const getStrokeLayers = (el) => {
                    try {
                        return Array.from(el?.querySelectorAll?.('.stroke-layer') || []);
                    } catch {
                        return [];
                    }
                };

                const isAnimatableSvgColor = (v) => {
                    const s = (v || '').trim();
                    if (!s) return false;
                    // Gradients/patterns and CSS vars are not reliably interpolatable.
                    if (s.startsWith('url(')) return false;
                    if (s.startsWith('var(')) return false;
                    return true;
                };

                const readStrokeRect = (layer) => {
                    try {
                        const rect = layer?.querySelector?.('rect') || null;
                        if (!rect) return null;
                        const readNumAttr = (name) => {
                            const raw = (rect.getAttribute(name) || '').trim();
                            if (!raw) return null;
                            const v = Number(raw);
                            return Number.isFinite(v) ? v : null;
                        };
                        const stroke = (rect.getAttribute('stroke') || '').trim();
                        const strokeWidthRaw = (rect.getAttribute('stroke-width') || '').trim();
                        const strokeWidth = Number(strokeWidthRaw);
                        return {
                            rect,
                            stroke,
                            strokeWidth: Number.isFinite(strokeWidth) ? strokeWidth : null,
                            x: readNumAttr('x'),
                            y: readNumAttr('y'),
                            width: readNumAttr('width'),
                            height: readNumAttr('height'),
                            rx: readNumAttr('rx'),
                            ry: readNumAttr('ry')
                        };
                    } catch {
                        return null;
                    }
                };

                const parsePx = (v) => {
                    const s = String(v || '').trim();
                    if (!s) return null;
                    const m = s.match(/-?\d+(?:\.\d+)?/);
                    if (!m) return null;
                    const n = Number(m[0]);
                    return Number.isFinite(n) ? n : null;
                };

                const cloneStrokeLayerForMorph = (srcLayer) => {
                    try {
                        if (!srcLayer) return null;
                        const clone = srcLayer.cloneNode(true);
                        if (!(clone instanceof SVGElement)) return null;
                        const cls = (clone.getAttribute('class') || '').trim();
                        clone.setAttribute('class', cls ? `${cls} morph-temp-stroke` : 'stroke-layer morph-temp-stroke');
                        // Ensure it participates in rendering but does not interfere with input.
                        try {
                            clone.style.pointerEvents = 'none';
                            clone.style.position = 'absolute';
                            clone.style.left = '0';
                            clone.style.top = '0';
                            clone.style.width = '100%';
                            clone.style.height = '100%';
                            clone.style.overflow = 'visible';
                        } catch {
                            // ignore
                        }
                        return clone;
                    } catch {
                        return null;
                    }
                };

                const getCodeRunnerHolders = (el) => {
                    /** @type {Array<{holder: HTMLElement, runner: any, canvas: HTMLCanvasElement | null}>} */
                    const items = [];
                    if (!el) return items;

                    const pushIfRunner = (holder) => {
                        try {
                            const runner = holder?._codeRunner;
                            if (!runner) return;
                            const canvas = holder.querySelector?.('canvas') || null;
                            items.push({ holder, runner, canvas });
                        } catch {
                            // ignore
                        }
                    };

                    // Legacy single code fill.
                    pushIfRunner(el);

                    // Multi-fill code layers.
                    const fillLayers = getFillLayers(el);
                    for (const layer of fillLayers) {
                        pushIfRunner(layer);
                    }

                    return items.filter((i) => i.canvas);
                };

                const buildCodeTransferPlan = (srcEl, dstEl) => {
                    const src = getCodeRunnerHolders(srcEl);
                    const dst = getCodeRunnerHolders(dstEl);

                    if (!src.length || src.length !== dst.length) return { ok: false, items: [] };

                    /** @type {Array<{srcHolder: HTMLElement, dstHolder: HTMLElement, srcRunner: any, dstRunner: any, dstCanvas: HTMLCanvasElement}>} */
                    const items = [];

                    for (let i = 0; i < src.length; i++) {
                        const s = src[i];
                        const d = dst[i];
                        const srcRunner = s.runner;
                        const dstRunner = d.runner;
                        const dstCanvas = d.canvas;
                        const srcCode = String(srcRunner?.userCode || '').trim();
                        const dstCode = String(dstRunner?.userCode || '').trim();

                        if (!srcRunner || !dstRunner || !dstCanvas) return { ok: false, items: [] };
                        if (!srcCode || srcCode !== dstCode) return { ok: false, items: [] };
                        if (typeof srcRunner.transferToCanvas !== 'function') return { ok: false, items: [] };

                        items.push({ srcHolder: s.holder, dstHolder: d.holder, srcRunner, dstRunner, dstCanvas });
                    }

                    return { ok: true, items };
                };

                const shortestArc = (fromDeg, toDeg) => {
                    const a = Number(fromDeg) || 0;
                    const b = Number(toDeg) || 0;
                    // normalize delta to (-180, 180]
                    const delta = ((((b - a) % 360) + 540) % 360) - 180;
                    return a + delta;
                };

                // Background crossfade (slide-level)
                const oldBg = getBg(oldContent);
                const newBg = getBg(newContent);
                let restoreBg = null;
                if (oldBg || newBg) {
                    restoreBg = {
                        old: oldBg ? (oldBg.style.opacity || '') : null,
                        next: newBg ? (newBg.style.opacity || '') : null
                    };

                    const bgTransfer = (() => {
                        try {
                            return (newContent.getAttribute('data-morph-bg-transfer') || '').trim();
                        } catch {
                            return '';
                        }
                    })();

                    // When the background is state-transferred (code/video), we only have a single
                    // underlying visual. Crossfading would fade that single visual to 0 (blank),
                    // causing a black/blank flash. Keep it fully visible instead.
                    const shouldCrossfadeBg = !bgTransfer;

                    if (shouldCrossfadeBg) {
                        if (oldBg) oldBg.style.opacity = '1';
                        if (newBg) newBg.style.opacity = '0';
                    } else {
                        if (oldBg) oldBg.style.opacity = '0';
                        if (newBg) newBg.style.opacity = '1';
                    }

                    try {
                        newContent.setAttribute('data-morph-bg-animated', shouldCrossfadeBg ? '1' : '0');
                    } catch {
                        // ignore
                    }
                }

                // Prepare unmatched new elements: hidden until animation
                for (const el of unmatchedNew) {
                    const endOpacity = getEffectiveOpacity(el);
                    restoreNew.set(el, { ...readInline(el), opacity: endOpacity });
                    el.style.opacity = '0';
                }

                // Prepare matched elements: new starts at old geometry (and hidden), old stays visible
                for (const m of matches) {
                    const dstEnd = { ...readInline(m.dst), opacity: getEffectiveOpacity(m.dst) };
                    restoreNew.set(m.dst, dstEnd);

                    const srcStart = readInline(m.src);
                    m.dst.style.left = srcStart.left;
                    m.dst.style.top = srcStart.top;
                    m.dst.style.width = srcStart.width;
                    m.dst.style.height = srcStart.height;

                    // Use rotate/scale components for deterministic interpolation.
                    m.dst.style.transform = srcStart.transform;

                    // Decide whether we can interpolate appearance (PI) or should cross-fade per-element.
                    // V1: keep this conservative; if any fill layer is not a solid->solid mapping, fall back.
                    const srcFillLayers = getFillLayers(m.src);
                    const dstFillLayers = getFillLayers(m.dst);

                    const canInterpolateFills = (() => {
                        // No fill layers on either side is "fill-compatible" (there is nothing to interpolate).
                        // Whether we treat the element as appearance-interpolatable is decided by a
                        // higher-level guard that avoids the problematic 0-fill/0-stroke case.
                        if (srcFillLayers.length === 0 && dstFillLayers.length === 0) return true;
                        if (srcFillLayers.length === dstFillLayers.length) {
                            for (let i = 0; i < srcFillLayers.length; i++) {
                                if (!isSolidFillLayer(srcFillLayers[i]) || !isSolidFillLayer(dstFillLayers[i])) return false;
                            }
                            return true;
                        }

                        // Zero-equivalent: allow single solid fill present <-> no fill.
                        if (srcFillLayers.length === 0 && dstFillLayers.length === 1) return isSolidFillLayer(dstFillLayers[0]);
                        if (srcFillLayers.length === 1 && dstFillLayers.length === 0) return isSolidFillLayer(srcFillLayers[0]);
                        return false;
                    })();

                    const srcStrokeLayers = getStrokeLayers(m.src);
                    const dstStrokeLayers = getStrokeLayers(m.dst);
                    const canInterpolateStrokes = (() => {
                        // No stroke layers on either side is "stroke-compatible" (there is nothing to interpolate).
                        if (srcStrokeLayers.length === 0 && dstStrokeLayers.length === 0) return true;

                        if (srcStrokeLayers.length === dstStrokeLayers.length) {
                            // Only treat as compatible if they are the simple rect-based stroke layers.
                            for (let i = 0; i < srcStrokeLayers.length; i++) {
                                const s = readStrokeRect(srcStrokeLayers[i]);
                                const d = readStrokeRect(dstStrokeLayers[i]);
                                if (!s || !d) return false;
                            }
                            return true;
                        }
                        // Zero-equivalent: allow a single stroke present <-> no stroke.
                        if (srcStrokeLayers.length === 0 && dstStrokeLayers.length === 1) return true;
                        if (srcStrokeLayers.length === 1 && dstStrokeLayers.length === 0) return true;
                        return false;
                    })();

                    // Special-case: if we can transfer code fills (same code), treat as compatible
                    // so we can preserve time continuity.
                    const codeTransfer = buildCodeTransferPlan(m.src, m.dst);
                    const canTransferCodeFills = Boolean(codeTransfer.ok);

                    const hasAnyPaintStack =
                        (srcFillLayers.length > 0 || dstFillLayers.length > 0 || srcStrokeLayers.length > 0 || dstStrokeLayers.length > 0);

                    // Only treat the element as "appearance-interpolatable" when we can reason about
                    // at least one paint stack (fill/stroke) OR when we can transfer code fills.
                    const canInterpolateAppearance = (hasAnyPaintStack && canInterpolateFills && canInterpolateStrokes) || canTransferCodeFills;

                    const srcOpacity = Number(getEffectiveOpacity(m.src));
                    const dstOpacity = Number(dstEnd.opacity);

                    // Border radius interpolation when compatible.
                    const srcBR = srcStart.borderRadius || '';
                    const dstBR = dstEnd.borderRadius || '';

                    /** @type {Array<{layer: HTMLElement, startOpacity: number, endOpacity: number, startColor?: string, endColor?: string}>} */
                    const fillPlan = [];

                    /** @type {Array<{layer: HTMLElement, rect: SVGElement, startOpacity: number, endOpacity: number, startStroke?: string, endStroke?: string, startWidth?: number, endWidth?: number, startX?: number, endX?: number, startY?: number, endY?: number, startRectWidth?: number, endRectWidth?: number, startRectHeight?: number, endRectHeight?: number, startRx?: number, endRx?: number, startRy?: number, endRy?: number}>} */
                    const strokePlan = [];

                    if (canInterpolateAppearance) {
                        // Hide source visual; destination will start at source appearance.
                        try {
                            m.src.style.opacity = '0';
                        } catch {
                            // ignore
                        }

                        // Destination visible from t=0.
                        m.dst.style.opacity = String(Number.isFinite(srcOpacity) ? srcOpacity : 1);
                        if (srcBR) m.dst.style.borderRadius = srcBR;

                        // Prepare fill layers on destination to match source at t=0 and record a plan.
                        if (dstFillLayers.length) {
                            for (let i = 0; i < dstFillLayers.length; i++) {
                                const dstLayer = dstFillLayers[i];
                                const srcLayer = srcFillLayers[i] || null;

                                const endOpacity = getLayerOpacity(dstLayer);
                                const endColor = (dstLayer.style.backgroundColor || '').trim();

                                if (srcLayer && isSolidFillLayer(srcLayer) && isSolidFillLayer(dstLayer)) {
                                    const startOpacity = getLayerOpacity(srcLayer);
                                    const startColor = (srcLayer.style.backgroundColor || '').trim();

                                    if (startColor) dstLayer.style.backgroundColor = startColor;
                                    dstLayer.style.opacity = String(startOpacity);

                                    fillPlan.push({ layer: dstLayer, startOpacity, endOpacity, ...(startColor && endColor ? { startColor, endColor } : {}) });
                                } else {
                                    // Zero-equivalent: missing fill on source => fade in destination fill.
                                    // Also used for code fills (no color interpolation).
                                    if (srcLayer) {
                                        const startOpacity = getLayerOpacity(srcLayer);
                                        dstLayer.style.opacity = String(startOpacity);
                                        fillPlan.push({ layer: dstLayer, startOpacity, endOpacity });
                                    } else {
                                        dstLayer.style.opacity = '0';
                                        fillPlan.push({ layer: dstLayer, startOpacity: 0, endOpacity });
                                    }
                                }
                            }
                        }

                        // Zero-equivalent: stroke appears (source has no stroke, destination has stroke).
                        // We need to align stroke geometry with the start (source) element box to avoid
                        // visible mismatch between fill and stroke during the morph.
                        if (dstStrokeLayers.length && srcStrokeLayers.length === 0) {
                            const srcW = parsePx(srcStart.width);
                            const srcH = parsePx(srcStart.height);
                            const dstW = parsePx(dstEnd.width);
                            const dstH = parsePx(dstEnd.height);

                            const wr = srcW && dstW ? srcW / dstW : 1;
                            const hr = srcH && dstH ? srcH / dstH : 1;
                            const rr = Math.min(wr, hr);

                            for (const dstLayer of dstStrokeLayers) {
                                const d = readStrokeRect(dstLayer);
                                if (!d?.rect) continue;

                                const endOpacity = getLayerOpacity(dstLayer);
                                // Start from zero-equivalent.
                                try {
                                    dstLayer.style.opacity = '0';
                                } catch {
                                    // ignore
                                }

                                // Stroke width animates from 0.
                                const endStrokeWidth = d.strokeWidth;
                                d.rect.setAttribute('stroke-width', '0');

                                // Geometry: scale destination rect geometry into the source box.
                                if (Number.isFinite(d.x)) d.rect.setAttribute('x', String((d.x || 0) * wr));
                                if (Number.isFinite(d.y)) d.rect.setAttribute('y', String((d.y || 0) * hr));
                                if (Number.isFinite(d.width)) d.rect.setAttribute('width', String((d.width || 0) * wr));
                                if (Number.isFinite(d.height)) d.rect.setAttribute('height', String((d.height || 0) * hr));
                                if (Number.isFinite(d.rx)) d.rect.setAttribute('rx', String((d.rx || 0) * rr));
                                if (Number.isFinite(d.ry)) d.rect.setAttribute('ry', String((d.ry || 0) * rr));

                                strokePlan.push({
                                    layer: dstLayer,
                                    rect: d.rect,
                                    startOpacity: 0,
                                    endOpacity,
                                    ...(isAnimatableSvgColor(d.stroke) ? { startStroke: d.stroke, endStroke: d.stroke } : {}),
                                    ...(Number.isFinite(endStrokeWidth) ? { startWidth: 0, endWidth: endStrokeWidth } : {}),
                                    ...(Number.isFinite(d.x) ? { startX: (d.x || 0) * wr, endX: d.x } : {}),
                                    ...(Number.isFinite(d.y) ? { startY: (d.y || 0) * hr, endY: d.y } : {}),
                                    ...(Number.isFinite(d.width) ? { startRectWidth: (d.width || 0) * wr, endRectWidth: d.width } : {}),
                                    ...(Number.isFinite(d.height) ? { startRectHeight: (d.height || 0) * hr, endRectHeight: d.height } : {}),
                                    ...(Number.isFinite(d.rx) ? { startRx: (d.rx || 0) * rr, endRx: d.rx } : {}),
                                    ...(Number.isFinite(d.ry) ? { startRy: (d.ry || 0) * rr, endRy: d.ry } : {})
                                });
                            }
                        }

                        // Prepare simple stroke layers (rect-based) to match source at t=0.
                        if (srcStrokeLayers.length && srcStrokeLayers.length === dstStrokeLayers.length) {
                            for (let i = 0; i < dstStrokeLayers.length; i++) {
                                const srcLayer = srcStrokeLayers[i];
                                const dstLayer = dstStrokeLayers[i];
                                const s = readStrokeRect(srcLayer);
                                const d = readStrokeRect(dstLayer);
                                if (!s || !d) continue;

                                const startOpacity = getLayerOpacity(srcLayer);
                                const endOpacity = getLayerOpacity(dstLayer);
                                dstLayer.style.opacity = String(startOpacity);

                                // Width interpolation is always safe.
                                if (s.strokeWidth !== null) {
                                    d.rect.setAttribute('stroke-width', String(s.strokeWidth));
                                }

                                // Geometry interpolation keeps stroke aligned with the element box during resize.
                                if (s.x !== null) d.rect.setAttribute('x', String(s.x));
                                if (s.y !== null) d.rect.setAttribute('y', String(s.y));
                                if (s.width !== null) d.rect.setAttribute('width', String(s.width));
                                if (s.height !== null) d.rect.setAttribute('height', String(s.height));
                                if (s.rx !== null) d.rect.setAttribute('rx', String(s.rx));
                                if (s.ry !== null) d.rect.setAttribute('ry', String(s.ry));

                                // Color interpolation only for non-url / non-var values.
                                if (isAnimatableSvgColor(s.stroke) && isAnimatableSvgColor(d.stroke)) {
                                    if (s.stroke) d.rect.setAttribute('stroke', s.stroke);
                                }

                                strokePlan.push({
                                    layer: dstLayer,
                                    rect: d.rect,
                                    startOpacity,
                                    endOpacity,
                                    ...(isAnimatableSvgColor(s.stroke) && isAnimatableSvgColor(d.stroke)
                                        ? { startStroke: s.stroke, endStroke: d.stroke }
                                        : {}),
                                    ...(s.strokeWidth !== null && d.strokeWidth !== null
                                        ? { startWidth: s.strokeWidth, endWidth: d.strokeWidth }
                                        : {})
                                    ,...(s.x !== null && d.x !== null ? { startX: s.x, endX: d.x } : {})
                                    ,...(s.y !== null && d.y !== null ? { startY: s.y, endY: d.y } : {})
                                    ,...(s.width !== null && d.width !== null ? { startRectWidth: s.width, endRectWidth: d.width } : {})
                                    ,...(s.height !== null && d.height !== null ? { startRectHeight: s.height, endRectHeight: d.height } : {})
                                    ,...(s.rx !== null && d.rx !== null ? { startRx: s.rx, endRx: d.rx } : {})
                                    ,...(s.ry !== null && d.ry !== null ? { startRy: s.ry, endRy: d.ry } : {})
                                });
                            }
                        }

                        // Transfer code fill runners (preserve timebase) when possible.
                        if (canTransferCodeFills) {
                            for (const item of codeTransfer.items) {
                                try {
                                    // Copy bounds from the destination runner so mouse hit-tests remain correct.
                                    if (item.dstRunner?.elementBounds) {
                                        item.srcRunner.setElementBounds?.(item.dstRunner.elementBounds);
                                    }
                                } catch {
                                    // ignore
                                }

                                try {
                                    item.dstRunner?.destroy?.();
                                } catch {
                                    // ignore
                                }

                                try {
                                    item.srcRunner.transferToCanvas(item.dstCanvas);
                                } catch {
                                    // ignore
                                }

                                try {
                                    item.dstHolder._codeRunner = item.srcRunner;
                                } catch {
                                    // ignore
                                }

                                try {
                                    delete item.srcHolder._codeRunner;
                                } catch {
                                    // ignore
                                }
                            }
                        }

                        // Matched element: no cross-fade needed.
                        // (Opacity still animates if endpoints differ.)
                    } else {
                        // Cross-fade per element: destination starts hidden, source stays visible.
                        m.dst.style.opacity = '0';
                    }

                    // Cache decision for animation phase.
                    restoreNew.set(m.dst, {
                        ...dstEnd,
                        __morphCanInterpolateAppearance: canInterpolateAppearance,
                        __morphSrcOpacity: srcOpacity,
                        __morphDstOpacity: dstOpacity,
                        __morphBorderRadius: { src: srcBR, dst: dstBR },
                        __morphFillPlan: fillPlan,
                        __morphStrokePlan: strokePlan
                    });
                }

                // Ensure the incoming content is only revealed after its start state is applied.
                newContent.style.visibility = 'visible';

                // Animate: matched dst in, src out; unmatched old out; unmatched new in
                const animations = [];

                /** @type {Array<HTMLElement | SVGElement>} */
                const tempMorphNodesToRemove = [];

                const shouldCrossfadeBg = (() => {
                    try {
                        return (newContent.getAttribute('data-morph-bg-animated') || '') === '1';
                    } catch {
                        return true;
                    }
                })();

                if (shouldCrossfadeBg) {
                    if (oldBg) {
                        animations.push(this._asFinishedPromise(this.run({
                            targets: oldBg,
                            opacity: [1, 0],
                            duration,
                            easing
                        })));
                    }
                    if (newBg) {
                        animations.push(this._asFinishedPromise(this.run({
                            targets: newBg,
                            opacity: [0, 1],
                            duration,
                            easing
                        })));
                    }
                }

                for (const m of matches) {
                    const dstEnd = restoreNew.get(m.dst);

                    const canInterpolateAppearance = Boolean(dstEnd?.__morphCanInterpolateAppearance);
                    const srcOpacity = Number.isFinite(dstEnd?.__morphSrcOpacity) ? dstEnd.__morphSrcOpacity : Number(getEffectiveOpacity(m.src));
                    const dstOpacity = Number.isFinite(dstEnd?.__morphDstOpacity) ? dstEnd.__morphDstOpacity : Number(dstEnd.opacity);
                    const br = dstEnd?.__morphBorderRadius || { src: '', dst: '' };

                    const srcStart = readInline(m.src);
                    const srcRotate = srcStart.rotate;
                    const srcScaleX = srcStart.scaleX;
                    const srcScaleY = srcStart.scaleY;

                    const dstRotate = Number.isFinite(dstEnd?.rotate) ? dstEnd.rotate : 0;
                    const dstScaleX = Number.isFinite(dstEnd?.scaleX) ? dstEnd.scaleX : 1;
                    const dstScaleY = Number.isFinite(dstEnd?.scaleY) ? dstEnd.scaleY : 1;

                    const dstRotateShortest = shortestArc(srcRotate, dstRotate);

                    animations.push(this._asFinishedPromise(this.run({
                        targets: m.dst,
                        left: [m.dst.style.left, dstEnd.left],
                        top: [m.dst.style.top, dstEnd.top],
                        width: [m.dst.style.width, dstEnd.width],
                        height: [m.dst.style.height, dstEnd.height],
                        rotate: [srcRotate, dstRotateShortest],
                        scaleX: [srcScaleX, dstScaleX],
                        scaleY: [srcScaleY, dstScaleY],
                        ...(canInterpolateAppearance && br?.src && br?.dst ? { borderRadius: [br.src, br.dst] } : {}),
                        opacity: canInterpolateAppearance ? [srcOpacity, dstOpacity] : [0, dstOpacity],
                        duration,
                        easing
                    })));

                    if (!canInterpolateAppearance) {
                        // Per-element cross-fade fallback: animate the source element's geometry too
                        // so the cross-fade is spatially aligned.
                        animations.push(this._asFinishedPromise(this.run({
                            targets: m.src,
                            left: [srcStart.left, dstEnd.left],
                            top: [srcStart.top, dstEnd.top],
                            width: [srcStart.width, dstEnd.width],
                            height: [srcStart.height, dstEnd.height],
                            rotate: [srcRotate, dstRotateShortest],
                            scaleX: [srcScaleX, dstScaleX],
                            scaleY: [srcScaleY, dstScaleY],
                            opacity: [Number(getEffectiveOpacity(m.src)), 0],
                            duration,
                            easing
                        })));
                    }

                    // Zero-equivalent stroke behavior: when source has no stroke but destination does,
                    // fade in the destination stroke layer(s) from opacity 0.
                    if (canInterpolateAppearance) {
                        const srcStrokeLayers = getStrokeLayers(m.src);
                        const dstStrokeLayers = getStrokeLayers(m.dst);
                        // Zero-equivalent stroke behavior (disappear only):
                        // source has stroke, destination has no stroke => clone source stroke onto destination and animate to width/opacity 0.
                        // (Appear is planned via __morphStrokePlan so we also fix stroke geometry during resize.)
                        if (srcStrokeLayers.length && dstStrokeLayers.length === 0) {
                            // Disappear
                            const srcW = parsePx(srcStart.width);
                            const srcH = parsePx(srcStart.height);
                            const dstW = parsePx(dstEnd.width);
                            const dstH = parsePx(dstEnd.height);
                            const wr = srcW && dstW ? dstW / srcW : 1;
                            const hr = srcH && dstH ? dstH / srcH : 1;
                            const rr = Math.min(wr, hr);

                            for (const srcLayer of srcStrokeLayers) {
                                const s = readStrokeRect(srcLayer);
                                if (!s?.rect) continue;

                                const temp = cloneStrokeLayerForMorph(srcLayer);
                                if (!temp) continue;

                                try {
                                    m.dst.appendChild(temp);
                                    tempMorphNodesToRemove.push(temp);
                                } catch {
                                    continue;
                                }

                                const tempInfo = readStrokeRect(temp);
                                if (!tempInfo?.rect) continue;

                                const startO = (() => {
                                    const v = Number((temp).style?.opacity);
                                    return Number.isFinite(v) ? v : 1;
                                })();

                                animations.push(this._asFinishedPromise(this.run({
                                    targets: temp,
                                    opacity: [startO, 0],
                                    duration,
                                    easing
                                })));

                                const startW = Number(tempInfo.rect.getAttribute('stroke-width'));
                                const safeStartW = Number.isFinite(startW) ? startW : null;
                                const rectParams = {
                                    targets: tempInfo.rect,
                                    duration,
                                    easing
                                };
                                if (safeStartW !== null) rectParams['stroke-width'] = [safeStartW, 0];

                                // Keep geometry aligned with the morphing element box as it resizes.
                                if (tempInfo.x !== null) rectParams.x = [tempInfo.x, tempInfo.x * wr];
                                if (tempInfo.y !== null) rectParams.y = [tempInfo.y, tempInfo.y * hr];
                                if (tempInfo.width !== null) rectParams.width = [tempInfo.width, tempInfo.width * wr];
                                if (tempInfo.height !== null) rectParams.height = [tempInfo.height, tempInfo.height * hr];
                                if (tempInfo.rx !== null) rectParams.rx = [tempInfo.rx, tempInfo.rx * rr];
                                if (tempInfo.ry !== null) rectParams.ry = [tempInfo.ry, tempInfo.ry * rr];

                                if (rectParams['stroke-width'] || rectParams.x || rectParams.y || rectParams.width || rectParams.height || rectParams.rx || rectParams.ry) {
                                    animations.push(this._asFinishedPromise(this.run(rectParams)));
                                }
                            }
                        }

                        // Solid fill interpolation (opacity + backgroundColor when available)
                        const fillPlan = Array.isArray(dstEnd?.__morphFillPlan) ? dstEnd.__morphFillPlan : [];
                        for (const fp of fillPlan) {
                            const params = {
                                targets: fp.layer,
                                opacity: [fp.startOpacity, fp.endOpacity],
                                duration,
                                easing
                            };
                            if (fp.startColor && fp.endColor) {
                                params.backgroundColor = [fp.startColor, fp.endColor];
                            }
                            animations.push(this._asFinishedPromise(this.run(params)));
                        }

                        // Stroke interpolation (simple rect-based strokes)
                        const strokePlan = Array.isArray(dstEnd?.__morphStrokePlan) ? dstEnd.__morphStrokePlan : [];
                        for (const sp of strokePlan) {
                            // Layer opacity
                            animations.push(this._asFinishedPromise(this.run({
                                targets: sp.layer,
                                opacity: [sp.startOpacity, sp.endOpacity],
                                duration,
                                easing
                            })));

                            // Rect attributes
                            const rectParams = {
                                targets: sp.rect,
                                duration,
                                easing
                            };
                            if (Number.isFinite(sp.startWidth) && Number.isFinite(sp.endWidth)) {
                                // For SVG, we need to animate the actual attribute name.
                                // Anime.js checks `getAttribute(prop)` to decide between CSS vs. attribute.
                                rectParams['stroke-width'] = [sp.startWidth, sp.endWidth];
                            }
                            if (Number.isFinite(sp.startX) && Number.isFinite(sp.endX)) rectParams.x = [sp.startX, sp.endX];
                            if (Number.isFinite(sp.startY) && Number.isFinite(sp.endY)) rectParams.y = [sp.startY, sp.endY];
                            if (Number.isFinite(sp.startRectWidth) && Number.isFinite(sp.endRectWidth)) rectParams.width = [sp.startRectWidth, sp.endRectWidth];
                            if (Number.isFinite(sp.startRectHeight) && Number.isFinite(sp.endRectHeight)) rectParams.height = [sp.startRectHeight, sp.endRectHeight];
                            if (Number.isFinite(sp.startRx) && Number.isFinite(sp.endRx)) rectParams.rx = [sp.startRx, sp.endRx];
                            if (Number.isFinite(sp.startRy) && Number.isFinite(sp.endRy)) rectParams.ry = [sp.startRy, sp.endRy];
                            if (sp.startStroke && sp.endStroke) {
                                rectParams.stroke = [sp.startStroke, sp.endStroke];
                            }
                            if (rectParams['stroke-width'] || rectParams.stroke || rectParams.x || rectParams.y || rectParams.width || rectParams.height || rectParams.rx || rectParams.ry) {
                                animations.push(this._asFinishedPromise(this.run(rectParams)));
                            }
                        }
                    }
                }

                for (const el of unmatchedOld) {
                    animations.push(this._asFinishedPromise(this.run({
                        targets: el,
                        opacity: [Number(getEffectiveOpacity(el)), 0],
                        duration,
                        easing
                    })));
                }

                for (const el of unmatchedNew) {
                    const dstEnd = restoreNew.get(el);
                    animations.push(this._asFinishedPromise(this.run({
                        targets: el,
                        opacity: [0, Number(dstEnd.opacity)],
                        duration,
                        easing
                    })));
                }

                await Promise.all(animations);

                // Remove any temporary morph nodes (e.g., synthetic strokes for zero-equivalent disappearance).
                for (const n of tempMorphNodesToRemove) {
                    try {
                        n.remove();
                    } catch {
                        // ignore
                    }
                }

                // Restore incoming elements to their canonical (post-slide-render) styles
                for (const [el, end] of restoreNew.entries()) {
                    try {
                        el.style.left = end.left;
                        el.style.top = end.top;
                        el.style.width = end.width;
                        el.style.height = end.height;
                        el.style.transform = end.transform;
                        el.style.opacity = end.opacity;
                    } catch {
                        // ignore
                    }
                }

                // Restore background inline opacity (new slide keeps final visual state).
                if (restoreBg) {
                    try {
                        if (newBg) newBg.style.opacity = restoreBg.next;
                    } catch {
                        // ignore
                    }
                }

                // Clear slide-level transition styles
                newContent.style.transform = '';
                newContent.style.clipPath = '';
                newContent.style.opacity = '';
                newContent.style.zIndex = 1;

                if (oldContent.parentNode === container) {
                    container.removeChild(oldContent);
                }
                return;
            }

            if (transition.type !== SLIDE_TRANSITION_TYPES.CROSS_FADE) {
                prevOverflow = container.style.overflow;
                container.style.overflow = 'hidden';
                didSetOverflow = true;
            }

            // Ensure the incoming content is only revealed after its start state is applied.
            newContent.style.visibility = 'visible';

            if (transition.type === SLIDE_TRANSITION_TYPES.CROSS_FADE) {
                await Promise.all([
                    this._asFinishedPromise(this.run({ targets: oldContent, opacity: [1, 0], duration, easing })),
                    this._asFinishedPromise(this.run({ targets: newContent, opacity: [0, 1], duration, easing }))
                ]);
            } else if (transition.type === SLIDE_TRANSITION_TYPES.COVER) {
                const { axis, sign } = getAxisAndSign(transition.direction);
                const prop = axis === 'X' ? 'translateX' : 'translateY';
                const from = sign < 0 ? '-100%' : '100%';
                await this._asFinishedPromise(this.run({
                    targets: [newContent],
                    [prop]: [from, '0%'],
                    duration,
                    easing
                }));
            } else if (transition.type === SLIDE_TRANSITION_TYPES.UNCOVER) {
                const { axis, sign } = getAxisAndSign(transition.direction);
                const prop = axis === 'X' ? 'translateX' : 'translateY';
                const to = sign < 0 ? '-100%' : '100%';
                await this._asFinishedPromise(this.run({
                    targets: [oldContent],
                    [prop]: ['0%', to],
                    duration,
                    easing
                }));
            } else if (transition.type === SLIDE_TRANSITION_TYPES.PUSH) {
                const { axis, sign } = getAxisAndSign(transition.direction);
                const prop = axis === 'X' ? 'translateX' : 'translateY';
                const newFrom = sign < 0 ? '-100%' : '100%';
                const oldTo = sign < 0 ? '100%' : '-100%';

                if (typeof anime === 'function' && anime.timeline) {
                    const tl = anime.timeline({ duration, easing });
                    tl.add({ targets: [oldContent], [prop]: ['0%', oldTo] }, 0);
                    tl.add({ targets: [newContent], [prop]: [newFrom, '0%'] }, 0);
                    await this._asFinishedPromise(tl);
                } else {
                    await Promise.all([
                        this._asFinishedPromise(this.run({ targets: [oldContent], [prop]: ['0%', oldTo], duration, easing })),
                        this._asFinishedPromise(this.run({ targets: [newContent], [prop]: [newFrom, '0%'], duration, easing }))
                    ]);
                }
            } else if (transition.type === SLIDE_TRANSITION_TYPES.WIPE) {
                const { start, end } = getWipeClipPaths(transition.direction);
                await this._asFinishedPromise(this.run({
                    targets: newContent,
                    clipPath: [start, end],
                    duration,
                    easing
                }));
            }

            if (oldContent.parentNode === container) {
                container.removeChild(oldContent);
            }

            newContent.style.transform = '';
            newContent.style.clipPath = '';
            newContent.style.opacity = '';
            newContent.style.zIndex = 1;
        } catch (e) {
            console.error('Animation error:', e);
            telemetry.emit('transition_fallback_to_none', {
                reason: 'error',
                transitionType: transition.type,
                direction: transition.direction,
            });
            if (oldContent && oldContent.parentNode === container) {
                container.removeChild(oldContent);
            }
            if (newContent) {
                newContent.style.visibility = 'visible';
            }
        } finally {
            if (didSetOverflow) {
                container.style.overflow = prevOverflow;
            }
            this.isAnimating = false;
        }
    }

    playElementAnimation(element, config) {
        if (!element || !config) return;
        const anime = this.anime;
        if (!anime) return;
        
        try {
            // Reset style
            element.style.opacity = 1;
            element.style.transform = 'none';

            // Entrance
            if (config.entrance && config.entrance !== 'none') {
                const anim = {
                    targets: element,
                    duration: config.duration || 1000,
                    delay: config.delay || 0,
                    easing: 'easeOutCubic'
                };

                switch (config.entrance) {
                    case 'fade-in':
                        element.style.opacity = 0;
                        anim.opacity = [0, 1];
                        break;
                    case 'slide-in-left':
                        element.style.transform = 'translateX(-50px)';
                        element.style.opacity = 0;
                        anim.translateX = ['-50px', '0px'];
                        anim.opacity = [0, 1];
                        break;
                    case 'slide-in-right':
                        element.style.transform = 'translateX(50px)';
                        element.style.opacity = 0;
                        anim.translateX = ['50px', '0px'];
                        anim.opacity = [0, 1];
                        break;
                    case 'slide-in-bottom':
                        element.style.transform = 'translateY(50px)';
                        element.style.opacity = 0;
                        anim.translateY = ['50px', '0px'];
                        anim.opacity = [0, 1];
                        break;
                    case 'slide-in-top':
                        element.style.transform = 'translateY(-50px)';
                        element.style.opacity = 0;
                        anim.translateY = ['-50px', '0px'];
                        anim.opacity = [0, 1];
                        break;
                    case 'zoom-in':
                        element.style.transform = 'scale(0.5)';
                        element.style.opacity = 0;
                        anim.scale = [0.5, 1];
                        anim.opacity = [0, 1];
                        break;
                }
                
                this.run(anim);
            }
            
            // Exit
            if (config.exit && config.exit !== 'none') {
                 // If entrance exists, delay exit
                 const exitDelay = (config.entrance !== 'none' ? (config.duration || 1000) + 500 : 0) + (config.delay || 0);
                 
                 const anim = {
                    targets: element,
                    duration: config.duration || 1000,
                    delay: exitDelay,
                    easing: 'easeInCubic'
                };

                switch (config.exit) {
                    case 'fade-out':
                        anim.opacity = [1, 0];
                        break;
                    case 'slide-out-left':
                        anim.translateX = ['0px', '-50px'];
                        anim.opacity = [1, 0];
                        break;
                    case 'slide-out-right':
                        anim.translateX = ['0px', '50px'];
                        anim.opacity = [1, 0];
                        break;
                    case 'slide-out-bottom':
                        anim.translateY = ['0px', '50px'];
                        anim.opacity = [1, 0];
                        break;
                    case 'slide-out-top':
                        anim.translateY = ['0px', '-50px'];
                        anim.opacity = [1, 0];
                        break;
                    case 'zoom-out':
                        anim.scale = [1, 0.5];
                        anim.opacity = [1, 0];
                        break;
                }
                
                this.run(anim);
            }
        } catch (e) {
            console.error("Element animation error:", e);
        }
    }
}

export const animationManager = new AnimationManager();
