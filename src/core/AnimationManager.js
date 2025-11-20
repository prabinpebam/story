export class AnimationManager {
    constructor() {
        this.isAnimating = false;
    }

    get anime() {
        if (typeof window.anime === 'function') return window.anime;
        if (window.anime && typeof window.anime.default === 'function') return window.anime.default;
        console.warn('Anime.js is not loaded or not a function', window.anime);
        return null;
    }

    async transition(container, oldContent, newContent, type = 'fade') {
        if (this.isAnimating) return;
        this.isAnimating = true;
        const anime = this.anime;

        try {
            // Setup styles
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

            if (!anime) {
                console.warn('Anime.js not loaded, skipping transition');
                // Instant swap
                if (oldContent.parentNode === container) {
                    container.removeChild(oldContent);
                }
                return;
            }

        if (type === 'fade') {
            newContent.style.opacity = 0;
            await anime({
                targets: newContent,
                opacity: [0, 1],
                duration: 400,
                easing: 'easeInOutQuad'
            }).finished;
        } else if (type === 'slide') {
            newContent.style.transform = 'translateX(100%)';
            await anime({
                targets: [newContent],
                translateX: ['100%', '0%'],
                duration: 500,
                easing: 'easeOutCubic'
            }).finished;
            
            // Animate old out?
            // anime({ targets: oldContent, translateX: -100% ... })
        } else if (type === 'push') {
             newContent.style.transform = 'translateX(100%)';
             const timeline = anime.timeline({
                 easing: 'easeOutCubic',
                 duration: 500
             });
             
             timeline.add({
                 targets: newContent,
                 translateX: ['100%', '0%']
             }, 0);
             
             timeline.add({
                 targets: oldContent,
                 translateX: ['0%', '-20%'], // Parallax effect
                 opacity: [1, 0.5]
             }, 0);
             
             await timeline.finished;
        } else if (type === 'magic') {
            // Smart Animate
            const oldEls = Array.from(oldContent.querySelectorAll('.slide-element'));
            const newEls = Array.from(newContent.querySelectorAll('.slide-element'));
            
            const pairs = [];
            const oldMap = new Map(oldEls.map(el => [el.id, el]));
            
            newEls.forEach(newEl => {
                if (oldMap.has(newEl.id)) {
                    pairs.push({
                        oldEl: oldMap.get(newEl.id),
                        newEl: newEl
                    });
                    oldMap.delete(newEl.id);
                }
            });

            // Ghost Container
            const ghostContainer = document.createElement('div');
            Object.assign(ghostContainer.style, {
                position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
                zIndex: '100', pointerEvents: 'none'
            });
            container.appendChild(ghostContainer);

            const animations = [];

            // Animate Pairs
            pairs.forEach(({ oldEl, newEl }) => {
                const ghost = oldEl.cloneNode(true);
                ghostContainer.appendChild(ghost);
                
                // Hide originals
                oldEl.style.opacity = '0';
                newEl.style.opacity = '0';

                // Extract target props
                const target = {
                    left: newEl.style.left,
                    top: newEl.style.top,
                    width: newEl.style.width,
                    height: newEl.style.height,
                    opacity: newEl.style.opacity || 1,
                    backgroundColor: newEl.style.backgroundColor,
                    color: newEl.style.color,
                    borderRadius: newEl.style.borderRadius,
                    fontSize: newEl.style.fontSize
                };
                
                // Handle Rotation (transform: rotate(Xdeg))
                const rotMatch = newEl.style.transform.match(/rotate\(([-\d.]+)deg\)/);
                if (rotMatch) {
                    target.rotate = rotMatch[1]; // Anime uses 'rotate' property
                } else {
                    target.rotate = 0;
                }
                
                // Clean undefined
                Object.keys(target).forEach(key => !target[key] && delete target[key]);

                animations.push({
                    targets: ghost,
                    ...target,
                    easing: 'easeInOutQuad',
                    duration: 600
                });
            });

            // Fade out old orphans
            oldMap.forEach(oldEl => {
                animations.push({
                    targets: oldEl,
                    opacity: 0,
                    duration: 300,
                    easing: 'linear'
                });
            });

            // Fade in new orphans
            newEls.forEach(newEl => {
                if (!pairs.find(p => p.newEl === newEl)) {
                    newEl.style.opacity = '0';
                    animations.push({
                        targets: newEl,
                        opacity: [0, 1],
                        delay: 200,
                        duration: 400,
                        easing: 'linear'
                    });
                }
            });

            await Promise.all(animations.map(anim => anime(anim).finished));
            
            // Cleanup
            container.removeChild(ghostContainer);
            pairs.forEach(p => p.newEl.style.opacity = '');
        } else {
            // None / Instant
        }

        // Cleanup
        if (oldContent.parentNode === container) {
            container.removeChild(oldContent);
        }
        
        // Reset styles on new content if needed (e.g. remove transform)
        newContent.style.transform = '';
        newContent.style.zIndex = 1;
        
        } catch (e) {
            console.error("Animation error:", e);
        } finally {
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
                
                anime(anim);
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
                
                anime(anim);
            }
        } catch (e) {
            console.error("Element animation error:", e);
        }
    }
}

export const animationManager = new AnimationManager();
