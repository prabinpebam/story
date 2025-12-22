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

                const srcOrder = oldElsAll.map(idFor).filter(Boolean);
                const dstOrder = newElsAll.map(idFor).filter(Boolean);
                const srcElements = toMatchElements(oldElsAll);
                const dstElements = toMatchElements(newElsAll);

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
                    return {
                        left: style?.left || '0px',
                        top: style?.top || '0px',
                        width: style?.width || '0px',
                        height: style?.height || '0px',
                        transform: style?.transform || '',
                        opacity: style?.opacity || ''
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

                // Background crossfade (slide-level)
                const oldBg = getBg(oldContent);
                const newBg = getBg(newContent);
                let restoreBg = null;
                if (oldBg || newBg) {
                    restoreBg = {
                        old: oldBg ? (oldBg.style.opacity || '') : null,
                        next: newBg ? (newBg.style.opacity || '') : null
                    };
                    if (oldBg) oldBg.style.opacity = '1';
                    if (newBg) newBg.style.opacity = '0';
                    try {
                        newContent.setAttribute('data-morph-bg-animated', '1');
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
                    m.dst.style.transform = srcStart.transform;
                    m.dst.style.opacity = '0';
                }

                // Ensure the incoming content is only revealed after its start state is applied.
                newContent.style.visibility = 'visible';

                // Animate: matched dst in, src out; unmatched old out; unmatched new in
                const animations = [];

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

                for (const m of matches) {
                    const dstEnd = restoreNew.get(m.dst);
                    animations.push(this._asFinishedPromise(this.run({
                        targets: m.dst,
                        left: [m.dst.style.left, dstEnd.left],
                        top: [m.dst.style.top, dstEnd.top],
                        width: [m.dst.style.width, dstEnd.width],
                        height: [m.dst.style.height, dstEnd.height],
                        transform: [m.dst.style.transform || '', dstEnd.transform || ''],
                        opacity: [0, Number(dstEnd.opacity)],
                        duration,
                        easing
                    })));
                    animations.push(this._asFinishedPromise(this.run({
                        targets: m.src,
                        opacity: [Number(getEffectiveOpacity(m.src)), 0],
                        duration,
                        easing
                    })));
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
