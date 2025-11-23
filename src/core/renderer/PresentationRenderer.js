import { BaseRenderer } from './BaseRenderer.js';
import { store } from '../Store.js';
import { SlideView } from './SlideView.js';
import { animationManager } from '../AnimationManager.js';

export class PresentationRenderer extends BaseRenderer {
    constructor(containerId) {
        super(containerId);
        this.currentSlideId = null;
        this.isTransitioning = false;
        this.buildElements = [];
        this.lastBuildIndex = -1;
        this.render();
    }

    render() {
        if (this.isTransitioning) return;

        const state = store.getState();
        const activeId = state.editor.activeSlideId;

        if (!activeId) return;

        // Check if slide changed
        if (this.currentSlideId !== activeId) {
            this.handleSlideChange(activeId);
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

    handleSlideChange(newId) {
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
        this.calculateBuilds(newSlideData);

        if (oldId && this.activeSlideViews.has(oldId)) {
            const oldView = this.activeSlideViews.get(oldId);
            
            // Transition
            this.isTransitioning = true;
            const transitionType = newSlideData.transition || 'fade';
            
            // Hide builds initially
            this.hideBuilds(newView);

            animationManager.transition(this.layers.content, oldView.domElement, newView.domElement, transitionType)
                .then(() => {
                    this.isTransitioning = false;
                    oldView.unmount();
                    this.activeSlideViews.delete(oldId);
                    
                    // Play Entrance Animations (Non-builds)
                    this.playEntranceAnimations(newSlideData, newView);
                });
        } else {
            // First slide
            this.hideBuilds(newView);
            this.playEntranceAnimations(newSlideData, newView);
        }
    }

    calculateBuilds(slide) {
        if (slide && slide.effectiveElements) {
            this.buildElements = Object.values(slide.effectiveElements)
                .filter(el => el.animations && el.animations.entrance && el.animations.entrance !== 'none')
                .sort((a, b) => {
                    const order = slide.effectiveOrder || [];
                    return order.indexOf(a.id) - order.indexOf(b.id);
                });
            
            store.dispatch('SET_BUILD_COUNT', this.buildElements.length);
            this.lastBuildIndex = -1;
        } else {
            this.buildElements = [];
            store.dispatch('SET_BUILD_COUNT', 0);
        }
    }

    hideBuilds(view) {
        this.buildElements.forEach(el => {
            const domEl = view.domElement.querySelector(`#${el.id}`);
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
            this.buildElements.forEach(el => {
                const view = this.activeSlideViews.get(this.currentSlideId);
                if (view) {
                    const domEl = view.domElement.querySelector(`#${el.id}`);
                    if (domEl) domEl.style.opacity = 0;
                }
            });
            return;
        }

        if (index < this.lastBuildIndex) {
            // Backward
            const el = this.buildElements[this.lastBuildIndex];
            if (el) {
                const view = this.activeSlideViews.get(this.currentSlideId);
                if (view) {
                    const domEl = view.domElement.querySelector(`#${el.id}`);
                    if (domEl) {
                        domEl.style.opacity = 0;
                        if (window.anime) window.anime.remove(domEl);
                    }
                }
            }
            return;
        }

        const el = this.buildElements[index];
        if (el) {
            const view = this.activeSlideViews.get(this.currentSlideId);
            if (view) {
                const domEl = view.domElement.querySelector(`#${el.id}`);
                if (domEl) {
                    animationManager.playElementAnimation(domEl, el.animations);
                }
            }
        }
    }
}
