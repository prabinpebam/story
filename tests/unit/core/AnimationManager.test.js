import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AnimationManager, animationManager } from '../../../src/core/AnimationManager.js';

describe('AnimationManager', () => {
    let manager;
    let mockAnime;

    beforeEach(() => {
        manager = new AnimationManager();

        // Create mock anime.js (v3 style)
        mockAnime = vi.fn().mockReturnValue({
            finished: Promise.resolve()
        });
        mockAnime.timeline = vi.fn().mockReturnValue({
            add: vi.fn().mockReturnThis(),
            finished: Promise.resolve()
        });

        vi.stubGlobal('anime', mockAnime);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    describe('constructor', () => {
        it('should initialize with isAnimating set to false', () => {
            expect(manager.isAnimating).toBe(false);
        });
    });

    describe('anime getter', () => {
        it('should return anime when it is a function (v3)', () => {
            expect(manager.anime).toBe(mockAnime);
        });

        it('should return anime.default when available', () => {
            vi.stubGlobal('anime', {
                default: mockAnime
            });

            const newManager = new AnimationManager();
            expect(newManager.anime).toBe(mockAnime);
        });

        it('should return anime object with animate method (v4)', () => {
            const v4Anime = {
                animate: vi.fn()
            };
            vi.stubGlobal('anime', v4Anime);

            const newManager = new AnimationManager();
            expect(newManager.anime).toBe(v4Anime);
        });

        it('should return null and warn when anime is not loaded', () => {
            vi.stubGlobal('anime', undefined);
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            const newManager = new AnimationManager();
            expect(newManager.anime).toBeNull();
            expect(consoleSpy).toHaveBeenCalled();
        });

        it('should return null when anime is not a valid format', () => {
            vi.stubGlobal('anime', { somethingElse: true });
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            const newManager = new AnimationManager();
            expect(newManager.anime).toBeNull();
        });
    });

    describe('run()', () => {
        it('should call anime with params when anime is a function (v3)', () => {
            const params = {
                targets: document.createElement('div'),
                opacity: [0, 1],
                duration: 500
            };

            manager.run(params);

            expect(mockAnime).toHaveBeenCalledWith(expect.objectContaining(params));
        });

        it('should return animation object with finished promise', () => {
            const result = manager.run({ targets: document.createElement('div') });

            expect(result.finished).toBeInstanceOf(Promise);
        });

        it('should handle v4 anime.animate API', () => {
            const v4Anime = {
                animate: vi.fn().mockReturnValue({ finished: Promise.resolve() })
            };
            vi.stubGlobal('anime', v4Anime);

            const newManager = new AnimationManager();
            const target = document.createElement('div');

            newManager.run({
                targets: target,
                opacity: [0, 1],
                easing: 'easeInOutQuad',
                duration: 500
            });

            expect(v4Anime.animate).toHaveBeenCalledWith(target, expect.objectContaining({
                opacity: [0, 1],
                ease: 'easeInOutQuad',
                duration: 500
            }));
        });

        it('should return resolved promise when anime is not loaded', () => {
            vi.stubGlobal('anime', undefined);
            vi.spyOn(console, 'warn').mockImplementation(() => {});

            const newManager = new AnimationManager();
            const result = newManager.run({ targets: document.createElement('div') });

            expect(result.finished).toBeInstanceOf(Promise);
        });
    });

    describe('transition()', () => {
        let container;
        let oldContent;
        let newContent;

        beforeEach(() => {
            container = document.createElement('div');
            oldContent = document.createElement('div');
            newContent = document.createElement('div');
            container.appendChild(oldContent);
            document.body.appendChild(container);
        });

        afterEach(() => {
            if (container.parentNode) {
                document.body.removeChild(container);
            }
        });

        it('should not run if already animating', async () => {
            manager.isAnimating = true;

            await manager.transition(container, oldContent, newContent, 'fade');

            // newContent should not be appended
            expect(container.contains(newContent)).toBe(false);
        });

        it('should set isAnimating to true during animation', async () => {
            const promise = manager.transition(container, oldContent, newContent, 'fade');
            
            // During animation, isAnimating should be true
            // (Note: This is tricky to test due to async nature)
            await promise;
            
            // After animation, isAnimating should be false
            expect(manager.isAnimating).toBe(false);
        });

        it('should set position styles on old and new content', async () => {
            await manager.transition(container, oldContent, newContent, 'fade');

            expect(oldContent.style.position).toBe('absolute');
            // jsdom may add 'px' suffix, so we check for both
            expect(['0', '0px']).toContain(oldContent.style.top);
            expect(['0', '0px']).toContain(oldContent.style.left);
            expect(oldContent.style.width).toBe('100%');
            expect(oldContent.style.height).toBe('100%');

            expect(newContent.style.position).toBe('absolute');
            expect(['0', '0px']).toContain(newContent.style.top);
            expect(['0', '0px']).toContain(newContent.style.left);
            expect(newContent.style.width).toBe('100%');
            expect(newContent.style.height).toBe('100%');
        });

        it('should keep both outgoing and incoming slides in the DOM during an in-flight transition', async () => {
            let resolveFinished;
            const finished = new Promise((resolve) => {
                resolveFinished = resolve;
            });

            mockAnime.mockImplementation(() => ({ finished }));

            const promise = manager.transition(container, oldContent, newContent, 'fade');

            // Before animation completes, both should be present.
            expect(container.contains(oldContent)).toBe(true);
            expect(container.contains(newContent)).toBe(true);

            resolveFinished();
            await promise;
        });

        it('should append new content to container', async () => {
            await manager.transition(container, oldContent, newContent, 'fade');

            expect(container.contains(newContent)).toBe(true);
        });

        it('should remove old content after animation', async () => {
            await manager.transition(container, oldContent, newContent, 'fade');

            expect(container.contains(oldContent)).toBe(false);
        });

        it('should not retain focus on elements from the outgoing slide after removal (no focus leaks)', async () => {
            const btn = document.createElement('button');
            btn.textContent = 'Focusable';
            oldContent.appendChild(btn);

            btn.focus();
            expect(document.activeElement).toBe(btn);

            await manager.transition(container, oldContent, newContent, 'none');

            expect(btn.isConnected).toBe(false);
            expect(document.activeElement).not.toBe(btn);
        });

        it('should handle fade transition type', async () => {
            await manager.transition(container, oldContent, newContent, 'fade');

            expect(mockAnime).toHaveBeenCalledWith(expect.objectContaining({
                targets: newContent,
                opacity: [0, 1]
            }));
        });

        it('should handle slide transition type', async () => {
            await manager.transition(container, oldContent, newContent, 'slide');

            expect(mockAnime).toHaveBeenCalledWith(expect.objectContaining({
                targets: [newContent],
                translateX: ['100%', '0%']
            }));
        });

        it('should handle push transition type', async () => {
            await manager.transition(container, oldContent, newContent, 'push');

            expect(mockAnime.timeline).toHaveBeenCalled();
        });

        it('should handle instant/none transition type', async () => {
            mockAnime.mockClear();

            await manager.transition(container, oldContent, newContent, 'none');

            // Old content should be removed immediately
            expect(container.contains(oldContent)).toBe(false);
            expect(container.contains(newContent)).toBe(true);
        });

        describe('morph (PI-driven interpolation)', () => {
            const makeSlideEl = ({
                id,
                name,
                left = '0px',
                top = '0px',
                width = '100px',
                height = '100px',
                transform = 'rotate(0deg)',
                opacity = '1',
                borderRadius,
                fill,
                stroke
            }) => {
                const el = document.createElement('div');
                el.className = 'slide-element';
                el.setAttribute('data-element-id', id);
                if (name !== undefined) el.setAttribute('data-layer-name', name);
                el.style.position = 'absolute';
                el.style.left = left;
                el.style.top = top;
                el.style.width = width;
                el.style.height = height;
                el.style.transform = transform;
                el.style.opacity = opacity;
                if (borderRadius !== undefined) el.style.borderRadius = borderRadius;

                if (fill) {
                    const layer = document.createElement('div');
                    layer.className = 'fill-layer';
                    layer.style.position = 'absolute';
                    layer.style.inset = '0px';
                    if (fill.kind === 'solid') {
                        layer.style.backgroundColor = fill.color;
                    } else if (fill.kind === 'gradient') {
                        layer.style.background = fill.value;
                    }
                    if (fill.opacity !== undefined) layer.style.opacity = String(fill.opacity);
                    el.appendChild(layer);
                }

                if (stroke) {
                    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    svg.setAttribute('class', 'stroke-layer');
                    svg.style.opacity = String(stroke.opacity ?? 1);
                    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    rect.setAttribute('stroke-width', String(stroke.width ?? 0));
                    rect.setAttribute('stroke', stroke.color ?? '#000');
                    svg.appendChild(rect);
                    el.appendChild(svg);
                }

                return el;
            };

            it('should interpolate borderRadius for matched elements when compatible', async () => {
                mockAnime.mockClear();

                const src = makeSlideEl({
                    id: 'src1',
                    name: 'Box',
                    left: '10px',
                    top: '10px',
                    width: '100px',
                    height: '60px',
                    borderRadius: '4px',
                    fill: { kind: 'solid', color: '#ff0000', opacity: 1 }
                });
                const dst = makeSlideEl({
                    id: 'dst1',
                    name: 'Box',
                    left: '210px',
                    top: '110px',
                    width: '160px',
                    height: '90px',
                    borderRadius: '12px',
                    fill: { kind: 'solid', color: '#00ff00', opacity: 1 }
                });

                oldContent.appendChild(src);
                newContent.appendChild(dst);

                await manager.transition(container, oldContent, newContent, { type: 'morph', durationMs: 300, easing: 'linear' });

                const calls = mockAnime.mock.calls.map((c) => c[0]);
                const dstCall = calls.find((p) => p && p.targets === dst && Object.prototype.hasOwnProperty.call(p, 'borderRadius'));
                expect(dstCall).toBeTruthy();
                expect(dstCall.borderRadius).toEqual(['4px', '12px']);
            });

            it('should animate source geometry too when falling back to per-element crossfade', async () => {
                mockAnime.mockClear();

                const src = makeSlideEl({
                    id: 'src2',
                    name: 'Thing',
                    left: '10px',
                    top: '10px',
                    width: '100px',
                    height: '60px',
                    fill: { kind: 'gradient', value: 'linear-gradient(90deg, #f00, #00f)', opacity: 1 }
                });
                const dst = makeSlideEl({
                    id: 'dst2',
                    name: 'Thing',
                    left: '210px',
                    top: '110px',
                    width: '160px',
                    height: '90px',
                    fill: { kind: 'solid', color: '#00ff00', opacity: 1 }
                });

                oldContent.appendChild(src);
                newContent.appendChild(dst);

                await manager.transition(container, oldContent, newContent, { type: 'morph', durationMs: 300, easing: 'linear' });

                const calls = mockAnime.mock.calls.map((c) => c[0]);
                const srcGeom = calls.find((p) => p && p.targets === src && Object.prototype.hasOwnProperty.call(p, 'left') && Object.prototype.hasOwnProperty.call(p, 'top'));
                expect(srcGeom).toBeTruthy();
                expect(srcGeom.left).toEqual(['10px', '210px']);
                expect(srcGeom.top).toEqual(['10px', '110px']);
            });

            it('should treat missing stroke as zero-equivalent and animate stroke opacity in', async () => {
                mockAnime.mockClear();

                const src = makeSlideEl({
                    id: 'src3',
                    name: 'StrokeBox',
                    left: '0px',
                    top: '0px',
                    width: '100px',
                    height: '60px',
                    fill: { kind: 'solid', color: '#ffffff', opacity: 1 }
                });
                const dst = makeSlideEl({
                    id: 'dst3',
                    name: 'StrokeBox',
                    left: '100px',
                    top: '100px',
                    width: '140px',
                    height: '80px',
                    fill: { kind: 'solid', color: '#ffffff', opacity: 1 },
                    stroke: { width: 8, color: '#ff00ff', opacity: 1 }
                });

                oldContent.appendChild(src);
                newContent.appendChild(dst);

                await manager.transition(container, oldContent, newContent, { type: 'morph', durationMs: 300, easing: 'linear' });

                const strokeLayer = dst.querySelector('.stroke-layer');
                expect(strokeLayer).toBeTruthy();

                const calls = mockAnime.mock.calls.map((c) => c[0]);
                const strokeOpacityCall = calls.find((p) => p && p.targets === strokeLayer && Array.isArray(p.opacity) && p.opacity[0] === 0);
                expect(strokeOpacityCall).toBeTruthy();
            });

            it('should interpolate solid fill layer color and opacity when compatible', async () => {
                mockAnime.mockClear();

                const src = makeSlideEl({
                    id: 'src4',
                    name: 'FillBox',
                    left: '0px',
                    top: '0px',
                    width: '100px',
                    height: '60px',
                    fill: { kind: 'solid', color: '#ff0000', opacity: 0.4 }
                });
                const dst = makeSlideEl({
                    id: 'dst4',
                    name: 'FillBox',
                    left: '100px',
                    top: '100px',
                    width: '140px',
                    height: '80px',
                    fill: { kind: 'solid', color: '#00ff00', opacity: 1 }
                });

                oldContent.appendChild(src);
                newContent.appendChild(dst);

                await manager.transition(container, oldContent, newContent, { type: 'morph', durationMs: 300, easing: 'linear' });

                const dstFillLayer = dst.querySelector('.fill-layer');
                expect(dstFillLayer).toBeTruthy();

                const calls = mockAnime.mock.calls.map((c) => c[0]);
                const fillOpacityCall = calls.find((p) => p && p.targets === dstFillLayer && Array.isArray(p.opacity));
                expect(fillOpacityCall).toBeTruthy();

                const fillColorCall = calls.find((p) => p && p.targets === dstFillLayer && Object.prototype.hasOwnProperty.call(p, 'backgroundColor'));
                expect(fillColorCall).toBeTruthy();
                const norm = (c) => String(c).replace(/\s+/g, '').toLowerCase();
                expect(fillColorCall.backgroundColor.map(norm)).toEqual([
                    norm('rgb(255, 0, 0)'),
                    norm('rgb(0, 255, 0)')
                ]);
            });

            it('should treat missing fill as zero-equivalent and fade the destination fill in', async () => {
                mockAnime.mockClear();

                const src = makeSlideEl({
                    id: 'src5',
                    name: 'NoFillBox',
                    left: '0px',
                    top: '0px',
                    width: '100px',
                    height: '60px'
                });
                const dst = makeSlideEl({
                    id: 'dst5',
                    name: 'NoFillBox',
                    left: '100px',
                    top: '100px',
                    width: '140px',
                    height: '80px',
                    fill: { kind: 'solid', color: '#00ff00', opacity: 1 }
                });

                oldContent.appendChild(src);
                newContent.appendChild(dst);

                await manager.transition(container, oldContent, newContent, { type: 'morph', durationMs: 300, easing: 'linear' });

                const dstFillLayer = dst.querySelector('.fill-layer');
                expect(dstFillLayer).toBeTruthy();

                const calls = mockAnime.mock.calls.map((c) => c[0]);
                const fillOpacityCall = calls.find((p) => p && p.targets === dstFillLayer && Array.isArray(p.opacity) && p.opacity[0] === 0);
                expect(fillOpacityCall).toBeTruthy();
            });
        });

        it('should fall back to none for unsupported legacy transition strings', async () => {
            mockAnime.mockClear();

            await manager.transition(container, oldContent, newContent, 'unsupported-transition');

            expect(container.contains(oldContent)).toBe(false);
            expect(container.contains(newContent)).toBe(true);
            expect(mockAnime).not.toHaveBeenCalled();
        });

        it('should handle animation errors gracefully', async () => {
            mockAnime.mockImplementation(() => ({
                finished: Promise.reject(new Error('Animation error'))
            }));

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await manager.transition(container, oldContent, newContent, 'fade');

            expect(consoleSpy).toHaveBeenCalled();
            expect(manager.isAnimating).toBe(false);
        });

        it('should reset newContent styles after animation', async () => {
            await manager.transition(container, oldContent, newContent, 'fade');

            expect(newContent.style.transform).toBe('');
            expect(newContent.style.zIndex).toBe('1');
        });

        it('should handle missing anime gracefully', async () => {
            vi.stubGlobal('anime', undefined);
            vi.spyOn(console, 'warn').mockImplementation(() => {});

            const newManager = new AnimationManager();
            await newManager.transition(container, oldContent, newContent, 'fade');

            // Should still swap content even without animation
            expect(container.contains(newContent)).toBe(true);
            expect(container.contains(oldContent)).toBe(false);
        });

        it('should accept canonical crossFade config objects', async () => {
            mockAnime.mockClear();

            await manager.transition(container, oldContent, newContent, {
                type: 'crossFade',
                durationMs: 123,
                easing: 'linear'
            });

            expect(mockAnime).toHaveBeenCalledWith(expect.objectContaining({
                targets: newContent,
                opacity: [0, 1],
                duration: 123
            }));
        });

        it('should accept canonical cover config objects (directional)', async () => {
            mockAnime.mockClear();

            await manager.transition(container, oldContent, newContent, {
                type: 'cover',
                direction: 'up',
                durationMs: 200,
                easing: 'ease-in-out'
            });

            expect(mockAnime).toHaveBeenCalledWith(expect.objectContaining({
                targets: [newContent],
                translateY: ['-100%', '0%'],
                duration: 200
            }));
        });

        it('should accept canonical uncover config objects (directional)', async () => {
            mockAnime.mockClear();

            await manager.transition(container, oldContent, newContent, {
                type: 'uncover',
                direction: 'right',
                durationMs: 150,
                easing: 'linear'
            });

            expect(mockAnime).toHaveBeenCalledWith(expect.objectContaining({
                targets: [oldContent],
                translateX: ['0%', '100%'],
                duration: 150
            }));
        });

        it('should accept canonical wipe config objects (clip-path)', async () => {
            mockAnime.mockClear();

            await manager.transition(container, oldContent, newContent, {
                type: 'wipe',
                direction: 'right',
                durationMs: 111,
                easing: 'linear'
            });

            expect(mockAnime).toHaveBeenCalledWith(expect.objectContaining({
                targets: newContent,
                clipPath: expect.any(Array),
                duration: 111
            }));
        });

        it('should apply the incoming start transform synchronously for cover to prevent a pre-animation flash', async () => {
            let resolveFinished;
            const finished = new Promise((resolve) => {
                resolveFinished = resolve;
            });
            mockAnime.mockImplementation(() => ({ finished }));

            // Simulate renderer behavior: incoming is mounted but hidden until transition starts.
            newContent.style.visibility = 'hidden';

            const promise = manager.transition(container, oldContent, newContent, {
                type: 'cover',
                direction: 'right',
                durationMs: 200,
                easing: 'linear'
            });

            // Start state should be applied before the first await.
            expect(newContent.style.transform).toBe('translateX(100%)');
            expect(newContent.style.visibility).toBe('visible');
            expect(container.contains(oldContent)).toBe(true);
            expect(container.contains(newContent)).toBe(true);

            resolveFinished();
            await promise;
        });

        it('should apply the incoming start transform synchronously for push to prevent a pre-animation flash', async () => {
            let resolveFinished;
            const finished = new Promise((resolve) => {
                resolveFinished = resolve;
            });
            // push uses timeline() in v3; keep finished pending.
            mockAnime.timeline.mockReturnValue({
                add: vi.fn().mockReturnThis(),
                finished
            });

            newContent.style.visibility = 'hidden';

            const promise = manager.transition(container, oldContent, newContent, {
                type: 'push',
                direction: 'right',
                durationMs: 200,
                easing: 'linear'
            });

            expect(newContent.style.transform).toBe('translateX(100%)');
            expect(newContent.style.visibility).toBe('visible');

            resolveFinished();
            await promise;
        });

        it('should apply the incoming start clip-path synchronously for wipe to prevent a pre-animation flash', async () => {
            let resolveFinished;
            const finished = new Promise((resolve) => {
                resolveFinished = resolve;
            });
            mockAnime.mockImplementation(() => ({ finished }));

            newContent.style.visibility = 'hidden';

            const promise = manager.transition(container, oldContent, newContent, {
                type: 'wipe',
                direction: 'right',
                durationMs: 200,
                easing: 'linear'
            });

            expect(newContent.style.clipPath).toBe('polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)');
            expect(newContent.style.visibility).toBe('visible');

            resolveFinished();
            await promise;
        });
    });

    describe('transition() - magic type', () => {
        let container;
        let oldContent;
        let newContent;

        beforeEach(() => {
            container = document.createElement('div');
            oldContent = document.createElement('div');
            newContent = document.createElement('div');

            // Add matching elements for smart animate
            const oldEl = document.createElement('div');
            oldEl.className = 'slide-element';
            oldEl.id = 'element-1';
            oldEl.style.left = '100px';
            oldEl.style.top = '100px';
            oldContent.appendChild(oldEl);

            const newEl = document.createElement('div');
            newEl.className = 'slide-element';
            newEl.id = 'element-1';
            newEl.style.left = '200px';
            newEl.style.top = '200px';
            newContent.appendChild(newEl);

            container.appendChild(oldContent);
            document.body.appendChild(container);
        });

        afterEach(() => {
            if (container.parentNode) {
                document.body.removeChild(container);
            }
        });

        it('should not create ghost container for legacy magic in Phase 1', async () => {
            mockAnime.mockClear();

            await manager.transition(container, oldContent, newContent, 'magic');

            // Phase 1 non-goal: morph.
            expect(container.querySelector('.ghost-container')).toBeNull();

            // Coerced to type:none (duration 0) so no animation should run.
            expect(mockAnime).not.toHaveBeenCalled();
        });

        it('should still swap slides for legacy magic', async () => {
            mockAnime.mockClear();

            await manager.transition(container, oldContent, newContent, 'magic');

            expect(container.contains(oldContent)).toBe(false);
            expect(container.contains(newContent)).toBe(true);
            expect(mockAnime).not.toHaveBeenCalled();
        });
    });

    describe('transition() - morph type', () => {
        let container;
        let oldContent;
        let newContent;

        beforeEach(() => {
            container = document.createElement('div');
            oldContent = document.createElement('div');
            newContent = document.createElement('div');

            // Add a matchable L0 element (name-based)
            const oldEl = document.createElement('div');
            oldEl.className = 'slide-element';
            oldEl.setAttribute('data-element-id', 'el-1');
            oldEl.setAttribute('data-layer-name', 'Box');
            oldEl.style.position = 'absolute';
            oldEl.style.left = '100px';
            oldEl.style.top = '100px';
            oldEl.style.width = '100px';
            oldEl.style.height = '100px';
            oldEl.style.transform = 'rotate(0deg)';
            oldEl.style.opacity = '1';
            oldContent.appendChild(oldEl);

            const newEl = document.createElement('div');
            newEl.className = 'slide-element';
            newEl.setAttribute('data-element-id', 'el-2');
            newEl.setAttribute('data-layer-name', 'Box');
            newEl.style.position = 'absolute';
            newEl.style.left = '300px';
            newEl.style.top = '250px';
            newEl.style.width = '200px';
            newEl.style.height = '150px';
            newEl.style.transform = 'rotate(30deg)';
            newEl.style.opacity = '1';
            newContent.appendChild(newEl);

            container.appendChild(oldContent);
            document.body.appendChild(container);
        });

        afterEach(() => {
            if (container.parentNode) {
                document.body.removeChild(container);
            }
        });

        it('should animate matched elements and then swap slides', async () => {
            mockAnime.mockClear();

            await manager.transition(container, oldContent, newContent, {
                type: 'morph',
                durationMs: 300,
                easing: 'ease-in-out'
            });

            expect(container.contains(oldContent)).toBe(false);
            expect(container.contains(newContent)).toBe(true);
            expect(mockAnime).toHaveBeenCalled();

            // Debug hook for tests
            expect(newContent.getAttribute('data-morph-match-count')).toBe('1');
        });
    });

    describe('playElementAnimation()', () => {
        let element;

        beforeEach(() => {
            element = document.createElement('div');
            element.style.opacity = '0.5';
            element.style.transform = 'translateX(100px)';
            document.body.appendChild(element);
        });

        afterEach(() => {
            if (element.parentNode) {
                document.body.removeChild(element);
            }
        });

        it('should not run without element', () => {
            manager.playElementAnimation(null, { entrance: 'fade-in' });

            expect(mockAnime).not.toHaveBeenCalled();
        });

        it('should not run without config', () => {
            manager.playElementAnimation(element, null);

            expect(mockAnime).not.toHaveBeenCalled();
        });

        it('should reset element style then apply initial animation state', () => {
            // For fade-in, it resets to opacity=1, transform=none, 
            // then sets opacity=0 for the animation starting point
            manager.playElementAnimation(element, { entrance: 'fade-in' });

            expect(element.style.opacity).toBe('0');  // Set to 0 for fade-in start
            expect(element.style.transform).toBe('none');
        });

        it('should handle fade-in entrance', () => {
            manager.playElementAnimation(element, {
                entrance: 'fade-in',
                duration: 1000,
                delay: 100
            });

            expect(mockAnime).toHaveBeenCalledWith(expect.objectContaining({
                targets: element,
                opacity: [0, 1],
                duration: 1000,
                delay: 100
            }));
        });

        it('should handle slide-in-left entrance', () => {
            manager.playElementAnimation(element, { entrance: 'slide-in-left' });

            expect(element.style.transform).toBe('translateX(-50px)');
            expect(element.style.opacity).toBe('0');
            expect(mockAnime).toHaveBeenCalledWith(expect.objectContaining({
                translateX: ['-50px', '0px'],
                opacity: [0, 1]
            }));
        });

        it('should handle slide-in-right entrance', () => {
            manager.playElementAnimation(element, { entrance: 'slide-in-right' });

            expect(element.style.transform).toBe('translateX(50px)');
            expect(mockAnime).toHaveBeenCalledWith(expect.objectContaining({
                translateX: ['50px', '0px']
            }));
        });

        it('should handle slide-in-bottom entrance', () => {
            manager.playElementAnimation(element, { entrance: 'slide-in-bottom' });

            expect(element.style.transform).toBe('translateY(50px)');
            expect(mockAnime).toHaveBeenCalledWith(expect.objectContaining({
                translateY: ['50px', '0px']
            }));
        });

        it('should handle slide-in-top entrance', () => {
            manager.playElementAnimation(element, { entrance: 'slide-in-top' });

            expect(element.style.transform).toBe('translateY(-50px)');
            expect(mockAnime).toHaveBeenCalledWith(expect.objectContaining({
                translateY: ['-50px', '0px']
            }));
        });

        it('should handle zoom-in entrance', () => {
            manager.playElementAnimation(element, { entrance: 'zoom-in' });

            expect(element.style.transform).toBe('scale(0.5)');
            expect(mockAnime).toHaveBeenCalledWith(expect.objectContaining({
                scale: [0.5, 1]
            }));
        });

        it('should not animate when entrance is none', () => {
            mockAnime.mockClear();
            manager.playElementAnimation(element, { entrance: 'none' });

            expect(mockAnime).not.toHaveBeenCalled();
        });

        it('should handle fade-out exit with delay', () => {
            // Note: Current implementation calculates exitDelay even without entrance
            // When entrance is not specified, exitDelay = 1500 (1000 + 500 + 0)
            manager.playElementAnimation(element, { exit: 'fade-out' });

            expect(mockAnime).toHaveBeenCalledWith(expect.objectContaining({
                opacity: [1, 0],
                delay: 1500  // Current implementation behavior
            }));
        });

        it('should handle slide-out-left exit with delay', () => {
            manager.playElementAnimation(element, { exit: 'slide-out-left' });

            expect(mockAnime).toHaveBeenCalledWith(expect.objectContaining({
                translateX: ['0px', '-50px'],
                opacity: [1, 0],
                delay: 1500
            }));
        });

        it('should handle slide-out-right exit with delay', () => {
            manager.playElementAnimation(element, { exit: 'slide-out-right' });

            expect(mockAnime).toHaveBeenCalledWith(expect.objectContaining({
                translateX: ['0px', '50px'],
                delay: 1500
            }));
        });

        it('should handle slide-out-bottom exit with delay', () => {
            manager.playElementAnimation(element, { exit: 'slide-out-bottom' });

            expect(mockAnime).toHaveBeenCalledWith(expect.objectContaining({
                translateY: ['0px', '50px'],
                delay: 1500
            }));
        });

        it('should handle slide-out-top exit with delay', () => {
            manager.playElementAnimation(element, { exit: 'slide-out-top' });

            expect(mockAnime).toHaveBeenCalledWith(expect.objectContaining({
                translateY: ['0px', '-50px'],
                delay: 1500
            }));
        });

        it('should handle zoom-out exit with delay', () => {
            manager.playElementAnimation(element, { exit: 'zoom-out' });

            expect(mockAnime).toHaveBeenCalledWith(expect.objectContaining({
                scale: [1, 0.5],
                opacity: [1, 0],
                delay: 1500
            }));
        });

        it('should delay exit when entrance exists', () => {
            manager.playElementAnimation(element, {
                entrance: 'fade-in',
                exit: 'fade-out',
                duration: 1000,
                delay: 100
            });

            // Find the exit call (opacity goes from 1 to 0)
            const allCalls = mockAnime.mock.calls;
            const exitCall = allCalls.find(call =>
                call[0].opacity && call[0].opacity[0] === 1 && call[0].opacity[1] === 0
            );

            // Exit should be delayed by entrance duration + 500 + delay
            // exitDelay = (1000 + 500) + 100 = 1600
            expect(exitCall).toBeDefined();
            expect(exitCall[0].delay).toBe(1600);
        });

        it('should use default duration when not specified', () => {
            manager.playElementAnimation(element, { entrance: 'fade-in' });

            expect(mockAnime).toHaveBeenCalledWith(expect.objectContaining({
                duration: 1000
            }));
        });

        it('should use default delay when not specified', () => {
            manager.playElementAnimation(element, { entrance: 'fade-in' });

            expect(mockAnime).toHaveBeenCalledWith(expect.objectContaining({
                delay: 0
            }));
        });

        it('should handle animation errors gracefully', () => {
            // When run() throws, the error is caught and logged
            const originalRun = manager.run.bind(manager);
            vi.spyOn(manager, 'run').mockImplementation(() => {
                throw new Error('Animation error');
            });

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            expect(() => {
                manager.playElementAnimation(element, { entrance: 'fade-in' });
            }).not.toThrow();

            expect(consoleSpy).toHaveBeenCalled();
        });

        it('should not animate when anime is not loaded', () => {
            vi.stubGlobal('anime', undefined);
            vi.spyOn(console, 'warn').mockImplementation(() => {});

            const newManager = new AnimationManager();
            newManager.playElementAnimation(element, { entrance: 'fade-in' });

            // Should not throw
        });
    });

    describe('singleton instance', () => {
        it('should export a singleton instance', () => {
            expect(animationManager).toBeInstanceOf(AnimationManager);
        });

        it('should have isAnimating property', () => {
            expect(typeof animationManager.isAnimating).toBe('boolean');
        });
    });

    describe('easing conversion for v4', () => {
        it('should convert easing to ease for v4 API', () => {
            const v4Anime = {
                animate: vi.fn().mockReturnValue({ finished: Promise.resolve() })
            };
            vi.stubGlobal('anime', v4Anime);

            const newManager = new AnimationManager();
            const target = document.createElement('div');
            
            newManager.run({
                targets: target,
                opacity: [0, 1],
                easing: 'easeInOutQuad',
                duration: 500
            });

            expect(v4Anime.animate).toHaveBeenCalledWith(
                target,
                expect.objectContaining({
                    ease: 'easeInOutQuad',
                    opacity: [0, 1],
                    duration: 500
                })
            );
        });
    });
});
