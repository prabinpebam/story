import {
    SLIDE_TRANSITION_TYPES,
    coerceSlideTransition
} from './presentation/SlideTransitionUtils.js';
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

        if (typeof anime === 'function') {
            // v3
            return anime(params);
        } else if (anime.animate) {
            // v4
            const { targets, ...rest } = params;
            if (rest.easing && !rest.ease) {
                rest.ease = rest.easing;
                delete rest.easing;
            }
            return anime.animate(targets, rest);
        }
        return { finished: Promise.resolve() };
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

        let prevOverflow;
        let didSetOverflow = false;

        try {
            oldContent.style.position = 'absolute';
            oldContent.style.top = '0';
            oldContent.style.left = '0';
            oldContent.style.width = '100%';
            oldContent.style.height = '100%';
            oldContent.style.zIndex = 1;

            newContent.style.position = 'absolute';
            newContent.style.top = '0';
            newContent.style.left = '0';
            newContent.style.width = '100%';
            newContent.style.height = '100%';
            newContent.style.zIndex = 2;

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
                if (oldContent.parentNode === container) {
                    container.removeChild(oldContent);
                }
                newContent.style.transform = '';
                newContent.style.clipPath = '';
                newContent.style.opacity = '';
                newContent.style.zIndex = 1;
                return;
            }

            if (transition.type !== SLIDE_TRANSITION_TYPES.CROSS_FADE) {
                prevOverflow = container.style.overflow;
                container.style.overflow = 'hidden';
                didSetOverflow = true;
            }

            if (transition.type === SLIDE_TRANSITION_TYPES.CROSS_FADE) {
                newContent.style.opacity = '0';
                await Promise.all([
                    this.run({ targets: oldContent, opacity: [1, 0], duration, easing }).finished,
                    this.run({ targets: newContent, opacity: [0, 1], duration, easing }).finished
                ]);
            } else if (transition.type === SLIDE_TRANSITION_TYPES.COVER) {
                const { axis, sign } = getAxisAndSign(transition.direction);
                const prop = axis === 'X' ? 'translateX' : 'translateY';
                const from = sign < 0 ? '-100%' : '100%';
                await this.run({
                    targets: [newContent],
                    [prop]: [from, '0%'],
                    duration,
                    easing
                }).finished;
            } else if (transition.type === SLIDE_TRANSITION_TYPES.UNCOVER) {
                const { axis, sign } = getAxisAndSign(transition.direction);
                const prop = axis === 'X' ? 'translateX' : 'translateY';
                const to = sign < 0 ? '-100%' : '100%';
                await this.run({
                    targets: [oldContent],
                    [prop]: ['0%', to],
                    duration,
                    easing
                }).finished;
            } else if (transition.type === SLIDE_TRANSITION_TYPES.PUSH) {
                const { axis, sign } = getAxisAndSign(transition.direction);
                const prop = axis === 'X' ? 'translateX' : 'translateY';
                const newFrom = sign < 0 ? '-100%' : '100%';
                const oldTo = sign < 0 ? '100%' : '-100%';

                if (typeof anime === 'function' && anime.timeline) {
                    const tl = anime.timeline({ duration, easing });
                    tl.add({ targets: [oldContent], [prop]: ['0%', oldTo] }, 0);
                    tl.add({ targets: [newContent], [prop]: [newFrom, '0%'] }, 0);
                    await tl.finished;
                } else {
                    await Promise.all([
                        this.run({ targets: [oldContent], [prop]: ['0%', oldTo], duration, easing }).finished,
                        this.run({ targets: [newContent], [prop]: [newFrom, '0%'], duration, easing }).finished
                    ]);
                }
            } else if (transition.type === SLIDE_TRANSITION_TYPES.WIPE) {
                const end = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
                let start;

                switch (transition.direction) {
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

                newContent.style.clipPath = start;
                await this.run({
                    targets: newContent,
                    clipPath: [start, end],
                    duration,
                    easing
                }).finished;
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
