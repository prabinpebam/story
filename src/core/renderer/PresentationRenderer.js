import { BaseRenderer } from './BaseRenderer.js';
import { store } from '../Store.js';
import { SlideView } from './SlideView.js';
import { animationManager } from '../AnimationManager.js';
import { waitForSlideAssetsReady } from '../presentation/AssetReadiness.js';
import { PresentationPrefetchManager } from '../presentation/PresentationPrefetchManager.js';
import { StyleResolver } from '../../utils/StyleResolver.js';
import { telemetry } from '../telemetry/Telemetry.js';

export class PresentationRenderer extends BaseRenderer {
    constructor(containerId) {
        super(containerId);
        this.currentSlideId = null;
        this.isTransitioning = false;
        this._busy = false;
        this._queuedSlideId = null;
        this.buildElements = [];
        this.lastBuildIndex = -1;

        this._prefetch = new PresentationPrefetchManager({
            getSlideData: (slideId) => this.getEffectiveSlideData(slideId, 'presentation')
        });

        // Allow the PresentationManager (input controller) to reuse the same prefetch manager
        // for navigation gating. This does not affect audience DOM.
        window.__presentationPrefetch = this._prefetch;
        this._lastPrefetchSlideOrder = null;
        this._lastPrefetchIndex = null;
        this.render();
    }

    _getReadinessBoundedWaitMs() {
        // Renderer-level bounded wait governs *navigation blocking* when readiness is slow/failed.
        // AssetReadiness still applies a per-asset timeout (default 8000ms) to keep probing bounded,
        // but navigation should not be blocked beyond this shorter bounded wait (default 2000ms).
        const state = store.getState();
        const configured = Number(state?.presentation?.readinessBoundedWaitMs);
        if (Number.isFinite(configured) && configured > 0) return configured;
        return 2000;
    }

    destroy() {
        if (this._prefetch) {
            this._prefetch.destroy();
            this._prefetch = null;
        }

        if (window.__presentationPrefetch) {
            try {
                delete window.__presentationPrefetch;
            } catch {
                window.__presentationPrefetch = undefined;
            }
        }
        super.destroy();
    }

    _updatePrefetch(state) {
        if (!this._prefetch) return;
        const slideOrder = state?.slideOrder;
        const idx = state?.presentation?.currentSlideIndex;
        if (!Array.isArray(slideOrder)) return;
        if (!Number.isFinite(idx)) return;

        const orderChanged = this._lastPrefetchSlideOrder !== slideOrder;
        const indexChanged = this._lastPrefetchIndex !== idx;
        if (!orderChanged && !indexChanged) return;

        if (indexChanged) this._prefetch.onNavigation();
        this._prefetch.updateFromState(state);

        this._lastPrefetchSlideOrder = slideOrder;
        this._lastPrefetchIndex = idx;
    }

    render() {
        if (this._busy || this.isTransitioning) {
            const state = store.getState();
            this._updatePrefetch(state);
            const activeId = state.editor.activeSlideId;
            if (activeId && activeId !== this.currentSlideId) {
                this._queuedSlideId = activeId;
            }
            return;
        }

        const state = store.getState();
        this._updatePrefetch(state);
        const activeId = state.editor.activeSlideId;

        if (!activeId) return;

        // Check if slide changed
        if (this.currentSlideId !== activeId) {
            this._startSlideChange(activeId);
        } else {
            // Just update current slide
            const view = this.activeSlideViews.get(activeId);
            if (view) {
                const slideData = this.getEffectiveSlideData(activeId, 'presentation');
                view.update(slideData);
                
                // Handle Builds
                if (state.presentation.buildIndex !== this.lastBuildIndex) {
                    this.playBuild(state.presentation.buildIndex);
                    this.lastBuildIndex = state.presentation.buildIndex;
                }
            }
        }
    }

    _setTransitionStatus(status, targetSlideId = null) {
        if (!this.container) return;
        this.container.setAttribute('data-pm-transition-status', status);
        if (targetSlideId) {
            this.container.setAttribute('data-pm-transition-target', targetSlideId);
        } else {
            this.container.removeAttribute('data-pm-transition-target');
        }
    }

    _setTransitionDebug(attrs = {}) {
        if (!this.container) return;
        try {
            const map = {
                requestedType: 'data-pm-transition-requested-type',
                requestedDurationMs: 'data-pm-transition-requested-duration',
                requestedEasing: 'data-pm-transition-requested-easing',
                requestedDirection: 'data-pm-transition-requested-direction',
                effectiveType: 'data-pm-transition-effective-type',
                effectiveDurationMs: 'data-pm-transition-effective-duration',
                effectiveEasing: 'data-pm-transition-effective-easing',
                effectiveDirection: 'data-pm-transition-effective-direction',
                reducedMotion: 'data-pm-reduced-motion',
                fallbackReason: 'data-pm-transition-fallback-reason',
            };

            // IMPORTANT: only update keys that are explicitly present in `attrs`.
            // Callers frequently set a single field (e.g. fallbackReason) and should not
            // unintentionally clear previously-set debug attributes.
            for (const [k, attr] of Object.entries(map)) {
                if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
                const v = attrs[k];
                if (v === undefined || v === null || v === '') {
                    this.container.removeAttribute(attr);
                } else {
                    this.container.setAttribute(attr, String(v));
                }
            }
        } catch {
            // Best-effort.
        }
    }

    _flushQueue() {
        const queued = this._queuedSlideId;
        this._queuedSlideId = null;
        if (queued && queued !== this.currentSlideId) {
            this._startSlideChange(queued);
        }
    }

    _startSlideChange(newId) {
        if (this._busy || this.isTransitioning) {
            this._queuedSlideId = newId;
            return;
        }

        if (this._prefetch) this._prefetch.onNavigation();

        this._busy = true;
        this.handleSlideChange(newId)
            .catch((err) => {
                console.error('[PresentationRenderer] Slide change failed:', err);
            })
            .finally(() => {
                this._busy = false;
                this._flushQueue();
            });
    }

    async handleSlideChange(newId) {
        const oldId = this.currentSlideId;
        const newSlideData = this.getEffectiveSlideData(newId, 'presentation');
        
        // Create New View
        const newView = new SlideView(newId);
        newView.mount(this.layers.content);
        newView.update(newSlideData);
        this.activeSlideViews.set(newId, newView);

        // Update ID immediately to prevent re-entrant loops during dispatch
        this.currentSlideId = newId;

        // Calculate Builds
        this.calculateBuilds(newSlideData, newView);

        const nowMs = () => {
            try {
                if (typeof performance !== 'undefined' && typeof performance.now === 'function') return performance.now();
            } catch {
                // ignore
            }
            return Date.now();
        };

        const bucketMs = (ms) => {
            const v = Number(ms);
            if (!Number.isFinite(v) || v <= 0) return '0';
            if (v < 50) return '0-50';
            if (v < 200) return '50-200';
            if (v < 500) return '200-500';
            if (v < 1000) return '500-1000';
            if (v < 2000) return '1000-2000';
            return '2000+';
        };

        const effectiveTransitionInfo = StyleResolver.getEffectiveSlideTransition(newId);
        let effectiveTransition = effectiveTransitionInfo.transition;

        let isReducedMotion = false;
        try {
            isReducedMotion = Boolean(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        } catch {
            isReducedMotion = false;
        }

        telemetry.emit('transition_requested', {
            transitionType: effectiveTransition?.type,
            direction: effectiveTransition?.direction,
            durationMs: effectiveTransition?.durationMs,
            easing: effectiveTransition?.easing,
            isReducedMotion,
        });

        // Debug attrs for quick inspection in DevTools.
        this._setTransitionDebug({
            requestedType: effectiveTransition?.type,
            requestedDurationMs: effectiveTransition?.durationMs,
            requestedEasing: effectiveTransition?.easing,
            requestedDirection: effectiveTransition?.direction,
            reducedMotion: isReducedMotion ? '1' : '0',
            fallbackReason: null,
        });

        try {
            if (import.meta.env?.MODE === 'development' || import.meta.env?.MODE === 'test') {
                console.debug('[PM transition] requested', {
                    to: newId,
                    type: effectiveTransition?.type,
                    durationMs: effectiveTransition?.durationMs,
                    easing: effectiveTransition?.easing,
                    direction: effectiveTransition?.direction,
                    reducedMotion: isReducedMotion,
                });
            }
        } catch {
            // ignore
        }

        // If a legacy transition string (e.g., 'magic') was resolved to none due to Phase 1
        // unsupported semantics, emit a privacy-safe fallback event.
        try {
            const legacyReason = effectiveTransitionInfo?.legacyFallbackReason;
            if (legacyReason && effectiveTransition?.type === 'none') {
                telemetry.emit('transition_fallback_to_none', {
                    reason: legacyReason,
                    transitionType: effectiveTransition?.type,
                    direction: effectiveTransition?.direction,
                });
            }
        } catch {
            // Best-effort.
        }

        // Transition readiness gating: keep the new slide hidden until fonts/media are ready.
        this._setTransitionStatus('loading', newId);
        newView.domElement.style.visibility = 'hidden';

        newView.domElement.classList.remove('slide-view--readiness-fallback');

        const boundedWaitMs = this._getReadinessBoundedWaitMs();

        const readinessStart = nowMs();
        const readinessTimedOut = await Promise.race([
            waitForSlideAssetsReady(newView.domElement).then(() => false),
            new Promise((resolve) => setTimeout(() => resolve(true), boundedWaitMs))
        ]);
        const readinessEnd = nowMs();
        const readinessMs = readinessTimedOut ? boundedWaitMs : Math.max(0, readinessEnd - readinessStart);
        telemetry.emit('transition_blocked_for_readiness', {
            blockedBucket: bucketMs(readinessMs),
            blockedMs: Math.round(readinessMs),
            transitionType: effectiveTransition?.type,
            direction: effectiveTransition?.direction,
        });
        telemetry.emit('transition_ready_latency', {
            latencyMs: Math.round(readinessMs),
            transitionType: effectiveTransition?.type,
            direction: effectiveTransition?.direction,
        });

        if (readinessTimedOut) {
            telemetry.emit('transition_fallback_to_none', {
                reason: 'readiness-timeout',
                transitionType: effectiveTransition?.type,
                direction: effectiveTransition?.direction,
            });
            this._setTransitionDebug({ fallbackReason: 'readiness-timeout' });
            // Audience-safe placeholder: show slide background only (no loading indicator).
            newView.domElement.classList.add('slide-view--readiness-fallback');
            effectiveTransition = { type: 'none', durationMs: 0, easing: 'linear' };
        }

        // IMPORTANT: Do not reveal the incoming slide yet when transitioning.
        // If we set it visible here, it can briefly paint (commonly a white background)
        // at its final position before AnimationManager applies the first keyframe.
        // AnimationManager will reveal it after applying the correct start state.
        const shouldAnimateFromOld = Boolean(oldId && this.activeSlideViews.has(oldId));
        if (!shouldAnimateFromOld) {
            newView.domElement.style.visibility = 'visible';

            // Debug clarity: if there's no outgoing slide to animate from, no transition will run.
            // This commonly happens on the first slide in presentation, or if the old view is missing.
            this._setTransitionDebug({
                effectiveType: 'none',
                effectiveDurationMs: 0,
                effectiveEasing: 'linear',
                effectiveDirection: null,
                fallbackReason: oldId ? 'missing-old-view' : 'first-slide',
            });
        }

        if (oldId && this.activeSlideViews.has(oldId)) {
            const oldView = this.activeSlideViews.get(oldId);
            
            // Transition
            this.isTransitioning = true;
            let transitionConfig = effectiveTransition;
            try {
                if (isReducedMotion && transitionConfig?.type && transitionConfig.type !== 'none') {
                    telemetry.emit('transition_fallback_to_none', {
                        reason: 'reduced-motion',
                        transitionType: transitionConfig.type,
                        direction: transitionConfig.direction,
                    });
                    this._setTransitionDebug({ fallbackReason: 'reduced-motion' });
                    transitionConfig = { type: 'none', durationMs: 0, easing: 'linear' };
                }
            } catch {
                // Best-effort.
            }

            // If the animation engine is missing, fall back to none (readiness gating already happened).
            try {
                if (transitionConfig?.type && transitionConfig.type !== 'none' && transitionConfig.durationMs > 0 && !animationManager.anime) {
                    telemetry.emit('transition_fallback_to_none', {
                        reason: 'animation-engine-missing',
                        transitionType: transitionConfig.type,
                        direction: transitionConfig.direction,
                    });
                    this._setTransitionDebug({ fallbackReason: 'animation-engine-missing' });
                    transitionConfig = { type: 'none', durationMs: 0, easing: 'linear' };
                }
            } catch {
                // ignore
            }

            // Record effective config (post-fallback) for DevTools inspection.
            this._setTransitionDebug({
                effectiveType: transitionConfig?.type,
                effectiveDurationMs: transitionConfig?.durationMs,
                effectiveEasing: transitionConfig?.easing,
                effectiveDirection: transitionConfig?.direction,
            });
            
            // Hide builds initially
            this.hideBuilds(newView);

            this._setTransitionStatus('transitioning', newId);

            // Morph: preserve stateful slide backgrounds (code/video) when possible.
            if (transitionConfig?.type === 'morph') {
                try {
                    const oldSlideData = this.getEffectiveSlideData(oldId, 'presentation');

                    const firstVisibleFill = (bg) => {
                        const fills = Array.isArray(bg) ? bg : bg ? [bg] : [];
                        for (const fill of fills) {
                            if (!fill || typeof fill !== 'object') continue;
                            if (fill.visible === false) continue;
                            return fill;
                        }
                        return null;
                    };

                    const fillKey = (fill) => {
                        if (!fill) return '';
                        if (fill.type === 'code') {
                            return `code:${String(fill.code || fill.value || '')}`;
                        }
                        if (fill.type === 'video') {
                            if (fill.assetId) return `video:asset:${String(fill.assetId)}`;
                            return `video:url:${String(fill.value || '')}`;
                        }
                        return `${String(fill.type || '')}`;
                    };

                    const oldFill = firstVisibleFill(oldSlideData?.effectiveBackground ?? oldSlideData?.background);
                    const newFill = firstVisibleFill(newSlideData?.effectiveBackground ?? newSlideData?.background);

                    const oldKey = fillKey(oldFill);
                    const newKey = fillKey(newFill);

                    // Only attempt transfer when BOTH sides are the same stateful type and content.
                    const canTransfer =
                        oldKey &&
                        newKey &&
                        oldKey === newKey &&
                        (oldFill?.type === 'code' || oldFill?.type === 'video');

                    if (canTransfer && oldView?.bgContainer && newView?.bgContainer) {
                        if (oldFill.type === 'code') {
                            // Drop the newly-created runner; keep the old one running.
                            if (newView.bgCodeRunner) {
                                try { newView.bgCodeRunner.stop(); } catch { /* ignore */ }
                                newView.bgCodeRunner = null;
                            }

                            const oldLayer =
                                oldView.bgContainer.querySelector('.bg-layer[data-fill-type="code"]') ||
                                oldView.bgContainer.querySelector('.bg-layer');

                            if (oldLayer) {
                                newView.bgContainer.innerHTML = '';
                                newView.bgContainer.appendChild(oldLayer);

                                if (oldView.bgCodeRunner) {
                                    newView.bgCodeRunner = oldView.bgCodeRunner;
                                    oldView.bgCodeRunner = null; // prevent stop() in oldView.unmount()

                                    const w = parseInt(newView.domElement.style.width) || 1920;
                                    const h = parseInt(newView.domElement.style.height) || 1080;
                                    try {
                                        newView.bgCodeRunner.resize(w, h);
                                        newView.bgCodeRunner.setElementBounds({ x: 0, y: 0, width: w, height: h, rotation: 0 });
                                    } catch {
                                        // ignore
                                    }
                                }

                                try { newView.domElement.setAttribute('data-morph-bg-transfer', 'code'); } catch { /* ignore */ }
                            }
                        } else if (oldFill.type === 'video') {
                            // Move the existing <video> node over to preserve currentTime/paused state.
                            const oldLayer =
                                oldView.bgContainer.querySelector('.bg-layer[data-fill-type="video"]') ||
                                oldView.bgContainer.querySelector('.bg-layer');

                            const oldVideo = oldView.bgContainer.querySelector('video');
                            const snapshot = oldVideo
                                ? {
                                      currentTime: Number.isFinite(oldVideo.currentTime) ? oldVideo.currentTime : 0,
                                      paused: oldVideo.paused,
                                      playbackRate: oldVideo.playbackRate,
                                      muted: oldVideo.muted,
                                      loop: oldVideo.loop,
                                      volume: oldVideo.volume
                                  }
                                : null;

                            if (oldLayer) {
                                newView.bgContainer.innerHTML = '';
                                newView.bgContainer.appendChild(oldLayer);
                                newView.bgVideoEl = oldLayer.querySelector('video') || null;

                                if (newView.bgVideoEl && snapshot) {
                                    try {
                                        newView.bgVideoEl.playbackRate = snapshot.playbackRate;
                                        newView.bgVideoEl.muted = snapshot.muted;
                                        newView.bgVideoEl.loop = snapshot.loop;
                                        newView.bgVideoEl.volume = snapshot.volume;
                                        if (Number.isFinite(snapshot.currentTime) && snapshot.currentTime > 0) {
                                            newView.bgVideoEl.currentTime = snapshot.currentTime;
                                        }
                                        if (!snapshot.paused) {
                                            newView.bgVideoEl.play().catch(() => {
                                                // ignore
                                            });
                                        }
                                    } catch {
                                        // ignore
                                    }
                                }

                                // Ensure old view won't keep referencing the moved video.
                                oldView.bgVideoEl = null;
                                try { newView.domElement.setAttribute('data-morph-bg-transfer', 'video'); } catch { /* ignore */ }
                            }
                        }
                    }
                } catch {
                    // Best-effort.
                }
            }

            const animStart = nowMs();
            telemetry.emit('transition_started', {
                transitionType: transitionConfig?.type,
                direction: transitionConfig?.direction,
                durationMs: transitionConfig?.durationMs,
            });

            try {
                if (import.meta.env?.MODE === 'development' || import.meta.env?.MODE === 'test') {
                    console.debug('[PM transition] effective', {
                        to: newId,
                        type: transitionConfig?.type,
                        durationMs: transitionConfig?.durationMs,
                        easing: transitionConfig?.easing,
                        direction: transitionConfig?.direction,
                        animeLoaded: Boolean(animationManager.anime),
                        reducedMotion: isReducedMotion,
                    });
                }
            } catch {
                // ignore
            }

            animationManager.transition(this.layers.content, oldView.domElement, newView.domElement, transitionConfig)
                .then(() => {
                    const animEnd = nowMs();
                    const actualMs = Math.max(0, animEnd - animStart);
                    telemetry.emit('transition_animation_duration', {
                        requestedMs: transitionConfig?.durationMs,
                        actualMs: Math.round(actualMs),
                        transitionType: transitionConfig?.type,
                        direction: transitionConfig?.direction,
                    });
                    telemetry.emit('transition_completed', {
                        transitionType: transitionConfig?.type,
                        direction: transitionConfig?.direction,
                    });

                    this.isTransitioning = false;
                    oldView.unmount();
                    this.activeSlideViews.delete(oldId);

                    this._setTransitionStatus('idle');
                    
                    // Play Entrance Animations (Non-builds)
                    this.playEntranceAnimations(newSlideData, newView);
                });
        } else {
            // First slide
            this._setTransitionDebug({
                effectiveType: 'none',
                effectiveDurationMs: 0,
                effectiveEasing: 'linear',
                effectiveDirection: null,
                fallbackReason: oldId ? 'missing-old-view' : 'first-slide',
            });
            this.hideBuilds(newView);
            this.playEntranceAnimations(newSlideData, newView);
            this._setTransitionStatus('idle');
        }
    }

    calculateBuilds(slide, view) {
        const state = store.getState();
        const slideId = state?.editor?.activeSlideId;

        // Prefer DOM-based build discovery (spec): [data-build] or .build
        const root = view?.domElement || this.layers?.content;
        const nodes = root ? Array.from(root.querySelectorAll('[data-build], .build')) : [];

        const withOrder = nodes.map((node, domIndex) => {
            const orderAttr = node.getAttribute('data-build-order');
            const order = orderAttr !== null ? Number(orderAttr) : NaN;
            return {
                node,
                domIndex,
                order: Number.isFinite(order) ? order : null
            };
        });

        withOrder.sort((a, b) => {
            if (a.order !== null && b.order !== null) return a.order - b.order;
            if (a.order !== null) return -1;
            if (b.order !== null) return 1;
            return a.domIndex - b.domIndex;
        });

        this.buildElements = withOrder.map((item) => ({ node: item.node }));
        const count = this.buildElements.length;

        store.dispatch('SET_BUILD_COUNT', count);
        if (typeof slideId === 'string') {
            store.dispatch('SET_BUILD_COUNT_FOR_SLIDE', { slideId, buildCount: count });
        }

        this.lastBuildIndex = -1;
    }

    hideBuilds(view) {
        this.buildElements.forEach((el) => {
            const domEl = el?.node;
            if (domEl) domEl.style.opacity = 0;
        });
    }

    playEntranceAnimations(slide, view) {
        // Only play animations that are NOT builds?
        // Or play everything?
        // In SlideRenderer, playEntranceAnimations checked if mode === 'presentation' and hid builds.
        // Here we already hid builds.
        // So we should play animations for elements that are NOT in buildElements?
        // Or does buildElements include ALL entrance animations?
        // Yes, calculateBuilds filters by entrance !== 'none'.
        // So all entrance animations are builds.
        // So playEntranceAnimations should do nothing if everything is a build?
        // Unless there are "auto" animations?
        // For now, we assume all entrance animations are builds triggered by user.
    }

    playBuild(index) {
        if (index === -1) {
            this.buildElements.forEach((el) => {
                const domEl = el?.node;
                if (domEl) domEl.style.opacity = 0;
            });
            return;
        }

        if (index < this.lastBuildIndex) {
            // Backward
            const el = this.buildElements[this.lastBuildIndex];
            const domEl = el?.node;
            if (domEl) {
                domEl.style.opacity = 0;
                if (window.anime) window.anime.remove(domEl);
            }
            return;
        }

        const el = this.buildElements[index];
        const domEl = el?.node;
        if (domEl) {
            // If element has Story animation metadata, use it; otherwise just show.
            // Most builds are driven by entrance animations.
            const elementId = domEl.getAttribute('data-element-id') || domEl.id;
            const state = store.getState();
            const slideData = state?.slides?.[state?.editor?.activeSlideId];
            const elementData = slideData?.elements?.[elementId] || slideData?.effectiveElements?.[elementId];
            const animations = elementData?.animations;
            if (animations) {
                animationManager.playElementAnimation(domEl, animations);
            } else {
                domEl.style.opacity = 1;
            }
        }
    }
}
