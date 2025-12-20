import { store } from './Store.js';
import { LaserPointer } from './LaserPointer.js';
import { mouseStateManager } from './MouseStateManager.js';
import { cursorManager } from './CursorManager.js';
import { InputManager } from './InputManager.js';
import { PresentationInputBuffer, INPUT_THROTTLE_MS } from './presentation/PresentationInputBuffer.js';
import { fileService } from '../ui/services/FileService.js';
import { PresentationPrefetchManager } from './presentation/PresentationPrefetchManager.js';
import { SlideView } from './renderer/SlideView.js';

export class PresentationManager {
    constructor() {
        this.playBtn = document.getElementById('play-btn');
        this.appContainer = document.getElementById('app');
        this.slideContainer = document.getElementById('viewport'); // The container that holds the slide
        this.laserPointer = new LaserPointer('laser-canvas');

        this._lastShortcutAt = 0;
        this._idleCursorTimer = null;
        this._touchStart = null;
        this._clickAdvanceConfig = {
            enabled: true,
            action: 'next-build',
            excludeRegions: [
                '.hud-controls',
                '#presentation-hud',
                '#presentation-grid-view',
                'a[href]',
                'button',
                'input',
                'textarea',
                'select',
                'video',
                '.code-canvas'
            ]
        };

        this._numericBuffer = new PresentationInputBuffer({
            onCommit: (slideNumber) => this._jumpToSlideNumber(slideNumber)
        });

        this._presentationOptionsMenu = null;
        this._restoreViewportStyles = null;

        this._navGatePromise = null;
        this._localPrefetch = null;

        // Gate 7: Presenter sync
        this._sync = {
            channel: null,
            clientId: null,
            isApplyingRemote: false,
            lastSent: null,
            presenterWindow: null,
            presenterWatchdog: null
        };

        // Gate 7: Presenter panel
        this._presenterUi = {
            panelEl: null,
            liveRegionEl: null,
            lastAnnounced: { slideIndex: null, buildIndex: null },
            startedAt: null,
            timerInterval: null,
            nextPreview: {
                slideId: null,
                wrapperEl: null,
                view: null
            }
        };
        
        // Cache for presentation mode coordinate calculation
        this._presentationScale = 1;
        this._presentationOffsetX = 0;
        this._presentationOffsetY = 0;
        this._slideWidth = 1920;
        this._slideHeight = 1080;
        
        this.init();
    }

    _isPresenter() {
        return new URLSearchParams(window.location.search).get('presenter') === '1';
    }

    _getSyncClientId() {
        if (this._sync.clientId) return this._sync.clientId;
        try {
            if (typeof crypto !== 'undefined' && crypto?.randomUUID) {
                this._sync.clientId = crypto.randomUUID();
                return this._sync.clientId;
            }
        } catch {
            // Best-effort.
        }
        this._sync.clientId = `pm_${Math.random().toString(36).slice(2)}_${Date.now()}`;
        return this._sync.clientId;
    }

    _ensureSyncChannel() {
        if (this._sync.channel) return this._sync.channel;
        try {
            if (typeof BroadcastChannel === 'undefined') return null;
            this._sync.channel = new BroadcastChannel('presentation-sync');
            this._sync.channel.addEventListener('message', (e) => this._onSyncMessage(e?.data));
        } catch {
            this._sync.channel = null;
        }
        return this._sync.channel;
    }

    _postSyncMessage(message) {
        const ch = this._ensureSyncChannel();
        if (!ch) return;
        try {
            ch.postMessage({ ...message, senderId: this._getSyncClientId() });
        } catch {
            // Best-effort.
        }
    }

    _sanitizeSyncMessage(data) {
        if (!data || typeof data !== 'object') return null;
        const type = data.type;
        if (typeof type !== 'string') return null;

        const toSafeInt = (value, { min, max }) => {
            if (!Number.isFinite(value)) return null;
            const n = Math.trunc(value);
            if (n < min || n > max) return null;
            return n;
        };

        // Never accept arbitrary payloads.
        if (type === 'hello') {
            return {
                type: 'hello',
                senderId: typeof data.senderId === 'string' ? data.senderId : null,
                role: data.role === 'presenter' || data.role === 'audience' ? data.role : 'audience'
            };
        }

        if (type === 'state-sync') {
            const state = data.state;
            if (!state || typeof state !== 'object') return null;

            const slideIndex = toSafeInt(state.slideIndex, { min: 0, max: 100000 });
            const buildIndex = toSafeInt(state.buildIndex, { min: -1, max: 100000 });
            if (slideIndex === null || buildIndex === null) return null;

            return {
                type: 'state-sync',
                senderId: typeof data.senderId === 'string' ? data.senderId : null,
                state: {
                    slideIndex,
                    buildIndex,
                    laser: state.laser === true,
                    grid: state.grid === true,
                    black: state.black === true,
                    white: state.white === true,
                    mode: state.mode === 'presentation' ? 'presentation' : 'edit'
                }
            };
        }

        if (type === 'navigate') {
            const slideIndex = toSafeInt(data.slideIndex, { min: 0, max: 100000 });
            const buildIndex = toSafeInt(data.buildIndex, { min: -1, max: 100000 });
            if (slideIndex === null || buildIndex === null) return null;
            return {
                type: 'navigate',
                senderId: typeof data.senderId === 'string' ? data.senderId : null,
                slideIndex,
                buildIndex
            };
        }

        if (type === 'toggle-feature') {
            const feature = data.feature;
            if (!['laser', 'grid', 'black', 'white'].includes(feature)) return null;
            return {
                type: 'toggle-feature',
                senderId: typeof data.senderId === 'string' ? data.senderId : null,
                feature,
                active: data.active === true
            };
        }

        if (type === 'exit') {
            return { type: 'exit', senderId: typeof data.senderId === 'string' ? data.senderId : null };
        }

        return null;
    }

    _onSyncMessage(raw) {
        const msg = this._sanitizeSyncMessage(raw);
        if (!msg) return;
        if (msg.senderId && msg.senderId === this._getSyncClientId()) return;

        if (msg.type === 'hello') {
            // Respond with current state if we are currently presenting.
            const state = store.getState();
            if (state?.editor?.mode === 'presentation') {
                this._postSyncMessage({ type: 'state-sync', state: this._getSyncStateSnapshot() });
            }
            return;
        }

        if (msg.type === 'state-sync') {
            this._applyRemoteState(msg.state);
            return;
        }

        if (msg.type === 'navigate') {
            this._applyRemoteNavigate(msg.slideIndex, msg.buildIndex);
            return;
        }

        if (msg.type === 'toggle-feature') {
            this._applyRemoteFeature(msg.feature, msg.active);
            return;
        }

        if (msg.type === 'exit') {
            this._sync.isApplyingRemote = true;
            try {
                store.dispatch('SET_MODE', 'edit');
            } finally {
                this._sync.isApplyingRemote = false;
            }
        }
    }

    _getSyncStateSnapshot() {
        const state = store.getState();
        const p = state?.presentation || {};
        return {
            mode: state?.editor?.mode === 'presentation' ? 'presentation' : 'edit',
            slideIndex: Number.isFinite(p.currentSlideIndex) ? p.currentSlideIndex : 0,
            buildIndex: Number.isFinite(p.buildIndex) ? p.buildIndex : -1,
            laser: p.laserPointer === true,
            grid: p.gridView === true,
            black: p.blackScreen === true,
            white: p.whiteScreen === true
        };
    }

    _applyRemoteState(remote) {
        if (!remote) return;
        this._sync.isApplyingRemote = true;
        try {
            if (remote.mode === 'presentation') {
                const state = store.getState();
                if (state?.editor?.mode !== 'presentation') {
                    store.dispatch('PRESENTATION_SET_REQUEST_FULLSCREEN', false);
                    store.dispatch('SET_MODE', 'presentation');
                }
            }

            if (remote.mode === 'presentation') {
                store.dispatch('PRESENTATION_GOTO', { index: remote.slideIndex, buildIndex: remote.buildIndex });
            }

            this._applyRemoteFeature('laser', remote.laser);
            this._applyRemoteFeature('grid', remote.grid);
            this._applyRemoteFeature('black', remote.black);
            this._applyRemoteFeature('white', remote.white);
        } finally {
            this._sync.isApplyingRemote = false;
        }
    }

    _applyRemoteNavigate(slideIndex, buildIndex) {
        this._sync.isApplyingRemote = true;
        try {
            const state = store.getState();
            if (state?.editor?.mode !== 'presentation') {
                store.dispatch('PRESENTATION_SET_REQUEST_FULLSCREEN', false);
                store.dispatch('SET_MODE', 'presentation');
            }
            store.dispatch('PRESENTATION_GOTO', { index: slideIndex, buildIndex });
        } finally {
            this._sync.isApplyingRemote = false;
        }
    }

    _applyRemoteFeature(feature, active) {
        const state = store.getState();
        const p = state?.presentation || {};

        if (feature === 'laser') {
            if (p.laserPointer !== active) store.dispatch('TOGGLE_LASER');
            return;
        }
        if (feature === 'grid') {
            if (p.gridView !== active) store.dispatch('TOGGLE_GRID_VIEW');
            return;
        }
        if (feature === 'black') {
            if (p.blackScreen !== active) store.dispatch('TOGGLE_BLACK_SCREEN');
            return;
        }
        if (feature === 'white') {
            if (p.whiteScreen !== active) store.dispatch('TOGGLE_WHITE_SCREEN');
        }
    }

    _maybeBroadcastSync(state) {
        if (this._sync.isApplyingRemote) return;
        if (state?.editor?.mode !== 'presentation') return;

        const snapshot = this._getSyncStateSnapshot();
        const last = this._sync.lastSent;

        // Navigation changes
        if (!last || last.slideIndex !== snapshot.slideIndex || last.buildIndex !== snapshot.buildIndex) {
            this._postSyncMessage({
                type: 'navigate',
                slideIndex: snapshot.slideIndex,
                buildIndex: snapshot.buildIndex
            });
        }

        // Feature toggles
        const featureKeys = [
            ['laser', 'laser'],
            ['grid', 'grid'],
            ['black', 'black'],
            ['white', 'white']
        ];
        for (const [feature, key] of featureKeys) {
            if (!last || last[key] !== snapshot[key]) {
                this._postSyncMessage({ type: 'toggle-feature', feature, active: snapshot[key] });
            }
        }

        this._sync.lastSent = snapshot;
    }

    _openPresenterWindow() {
        try {
            const url = `${window.location.pathname}?presenter=1`;
            const win = window.open(url, 'presenter-view', 'width=1280,height=720,menubar=no,toolbar=no');
            if (!win) throw new Error('Popup blocked - cannot open presenter view');
            this._sync.presenterWindow = win;

            // Spec: audience sends an initial state snapshot so the presenter window can sync
            // without needing to already be in presentation mode.
            this._postSyncMessage({ type: 'state-sync', state: this._getSyncStateSnapshot() });

            // Watchdog to prompt reopen if it closes during a show.
            if (this._sync.presenterWatchdog) clearInterval(this._sync.presenterWatchdog);
            this._sync.presenterWatchdog = setInterval(() => {
                const state = store.getState();
                if (state?.editor?.mode !== 'presentation') return;
                if (!this._sync.presenterWindow) return;
                if (this._sync.presenterWindow.closed) {
                    this._sync.presenterWindow = null;
                    const reopen = window.confirm('Presenter view closed. Reopen?');
                    if (reopen) {
                        this._openPresenterWindow();
                    }
                }
            }, 1000);
        } catch (e) {
            console.warn('[PresentationManager] Failed to open presenter view', e);
        }
    }

    _ensureLiveRegion() {
        if (this._presenterUi.liveRegionEl) return this._presenterUi.liveRegionEl;
        const el = document.createElement('div');
        el.id = 'presentation-live-region';
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
        el.setAttribute('aria-atomic', 'true');
        el.className = 'sr-only';
        document.body.appendChild(el);
        this._presenterUi.liveRegionEl = el;
        return el;
    }

    _announcePresentationState(state) {
        if (state?.editor?.mode !== 'presentation') return;
        const p = state?.presentation || {};
        const slideIndex = Number.isFinite(p.currentSlideIndex) ? p.currentSlideIndex : 0;
        const buildIndex = Number.isFinite(p.buildIndex) ? p.buildIndex : -1;

        const last = this._presenterUi.lastAnnounced;
        if (last.slideIndex === slideIndex && last.buildIndex === buildIndex) return;
        last.slideIndex = slideIndex;
        last.buildIndex = buildIndex;

        const totalSlides = Array.isArray(state?.slideOrder) ? state.slideOrder.length : 0;
        const slideId = state?.editor?.activeSlideId;
        const slide = slideId ? state?.slides?.[slideId] : null;
        const title = (slide?.title || slide?.name || '').trim();
        const slideLabel = title || `Slide ${slideIndex + 1}`;

        let announcement = `${slideLabel}. Slide ${slideIndex + 1} of ${totalSlides}.`;
        const buildCount = Number.isFinite(p.buildCount) ? p.buildCount : 0;
        if (buildCount > 0) {
            announcement += ` Build ${Math.max(buildIndex, -1) + 1} of ${buildCount}.`;
        }

        const region = this._ensureLiveRegion();
        region.textContent = announcement;
    }

    _ensurePresenterPanel() {
        if (!this._isPresenter()) return;
        if (this._presenterUi.panelEl) return;

        document.body.classList.add('presenter-view');

        const panel = document.createElement('aside');
        panel.id = 'presenter-view-panel';
        panel.setAttribute('data-testid', 'presenter-view-panel');
        panel.innerHTML = `
            <div class="pv-header">
                <div class="pv-badge" data-testid="presenter-indicator">Presenter View</div>
                <div class="pv-timer" data-testid="presenter-timer">
                    <span class="pv-elapsed" data-testid="presenter-elapsed">00:00:00</span>
                    <span class="pv-clock" data-testid="presenter-clock">--:--</span>
                </div>
            </div>
            <div class="pv-section">
                <div class="pv-section-title">Next Slide</div>
                <div id="pv-next-preview" class="pv-next-preview" data-testid="presenter-next-preview"></div>
            </div>
            <div class="pv-section">
                <div class="pv-section-title">Speaker Notes</div>
                <div id="pv-notes" class="pv-notes" data-testid="presenter-notes"></div>
            </div>
        `;

        document.body.appendChild(panel);
        this._presenterUi.panelEl = panel;

        // Timer
        if (!this._presenterUi.startedAt) this._presenterUi.startedAt = Date.now();
        if (this._presenterUi.timerInterval) clearInterval(this._presenterUi.timerInterval);
        this._presenterUi.timerInterval = setInterval(() => this._updatePresenterTimer(), 1000);
        this._updatePresenterTimer();

        // Next preview mount wrapper
        const wrapper = panel.querySelector('#pv-next-preview');
        this._presenterUi.nextPreview.wrapperEl = wrapper;
    }

    _destroyPresenterPanel() {
        document.body.classList.remove('presenter-view');

        if (this._presenterUi.timerInterval) {
            clearInterval(this._presenterUi.timerInterval);
            this._presenterUi.timerInterval = null;
        }

        const preview = this._presenterUi.nextPreview;
        if (preview?.view) {
            try { preview.view.unmount(); } catch { /* noop */ }
        }
        this._presenterUi.nextPreview = { slideId: null, wrapperEl: null, view: null };

        if (this._presenterUi.panelEl) {
            this._presenterUi.panelEl.remove();
            this._presenterUi.panelEl = null;
        }
    }

    _updatePresenterPanel(state) {
        if (!this._isPresenter()) {
            this._destroyPresenterPanel();
            return;
        }

        // Never render presenter panel outside presentation mode. This avoids editor UI interference
        // in cases where the page is loaded with `?presenter=1`.
        if (state?.editor?.mode !== 'presentation') {
            this._destroyPresenterPanel();
            return;
        }

        this._ensurePresenterPanel();

        const slideId = state?.editor?.activeSlideId;
        const slide = slideId ? state?.slides?.[slideId] : null;
        const notesHtml = (slide?.notes || '').trim();
        const notesEl = this._presenterUi.panelEl?.querySelector('#pv-notes');
        if (notesEl) {
            notesEl.innerHTML = notesHtml || '<div class="pv-notes-empty">No notes</div>';
        }

        // Next preview
        const nextId = this._getNextVisibleSlideId(state);
        this._updateNextPreview(nextId);
    }

    _updateNextPreview(nextSlideId) {
        const preview = this._presenterUi.nextPreview;
        const wrapper = preview?.wrapperEl;
        if (!wrapper) return;

        if (!nextSlideId) {
            wrapper.innerHTML = '<div class="pv-next-empty">(No next slide)</div>';
            preview.slideId = null;
            if (preview.view) {
                try { preview.view.unmount(); } catch { /* noop */ }
                preview.view = null;
            }
            return;
        }

        if (preview.slideId === nextSlideId && preview.view) return;

        wrapper.innerHTML = '';
        if (preview.view) {
            try { preview.view.unmount(); } catch { /* noop */ }
            preview.view = null;
        }

        const slideData = store.getEffectiveSlide(nextSlideId);
        if (!slideData) {
            wrapper.innerHTML = '<div class="pv-next-empty">(Unavailable)</div>';
            preview.slideId = nextSlideId;
            return;
        }

        const stage = document.createElement('div');
        stage.className = 'pv-next-stage';
        wrapper.appendChild(stage);

        const view = new SlideView(nextSlideId);
        view.mount(stage);
        view.update(slideData);

        const targetW = stage.clientWidth || 280;
        const scale = targetW / (slideData.width || 1920);
        view.domElement.style.transformOrigin = '0 0';
        view.domElement.style.transform = `scale(${scale})`;

        preview.slideId = nextSlideId;
        preview.view = view;
    }

    _updatePresenterTimer() {
        if (!this._isPresenter()) return;
        if (!this._presenterUi.panelEl) return;

        const startedAt = this._presenterUi.startedAt || Date.now();
        const elapsedMs = Math.max(0, Date.now() - startedAt);
        const totalSeconds = Math.floor(elapsedMs / 1000);
        const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
        const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        const secs = String(totalSeconds % 60).padStart(2, '0');
        const elapsed = `${hours}:${mins}:${secs}`;

        const now = new Date();
        const clock = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const elapsedEl = this._presenterUi.panelEl.querySelector('[data-testid="presenter-elapsed"]');
        const clockEl = this._presenterUi.panelEl.querySelector('[data-testid="presenter-clock"]');
        if (elapsedEl) elapsedEl.textContent = elapsed;
        if (clockEl) clockEl.textContent = clock;
    }

    _getPrefetchManager() {
        const globalPm = window.__presentationPrefetch;
        if (globalPm && typeof globalPm.ensurePrefetched === 'function') {
            if (this._localPrefetch) {
                this._localPrefetch.destroy();
                this._localPrefetch = null;
            }
            return globalPm;
        }

        if (!this._localPrefetch) {
            this._localPrefetch = new PresentationPrefetchManager({
                getSlideData: (slideId) => store.getEffectiveSlide(slideId)
            });
        }
        return this._localPrefetch;
    }

    _isSlideHidden(state, slideId) {
        const slide = state?.slides?.[slideId];
        return slide?.hidden === true || slide?.isHidden === true;
    }

    _getNextVisibleSlideId(state) {
        const order = state?.slideOrder;
        const fromIndex = state?.presentation?.currentSlideIndex;
        if (!Array.isArray(order) || !Number.isFinite(fromIndex)) return null;

        for (let i = fromIndex + 1; i < order.length; i++) {
            const id = order[i];
            if (!this._isSlideHidden(state, id)) return id;
        }
        return null;
    }

    _getPrevVisibleSlideId(state) {
        const order = state?.slideOrder;
        const fromIndex = state?.presentation?.currentSlideIndex;
        if (!Array.isArray(order) || !Number.isFinite(fromIndex)) return null;

        for (let i = fromIndex - 1; i >= 0; i--) {
            const id = order[i];
            if (!this._isSlideHidden(state, id)) return id;
        }
        return null;
    }

    async _navigateSlideGuarded(direction) {
        const state = store.getState();
        if (state?.editor?.mode !== 'presentation') return;
        if (this._navGatePromise) return;

        const targetSlideId = direction === 'prev'
            ? this._getPrevVisibleSlideId(state)
            : this._getNextVisibleSlideId(state);

        if (!targetSlideId) return;

        const isOffline = typeof navigator !== 'undefined' && navigator && navigator.onLine === false;
        if (isOffline) {
            store.dispatch(direction === 'prev' ? 'PRESENTATION_PREV' : 'PRESENTATION_NEXT');
            return;
        }

        // Block until HOT-tier assets are render-ready.
        store.dispatch('PRESENTATION_SET_PAUSED', true);
        if (this._isPresenter()) {
            store.dispatch('PRESENTATION_SET_NAV_LOADING', true);
        }

        const pm = this._getPrefetchManager();
        this._navGatePromise = (pm?.ensurePrefetched
            ? pm.ensurePrefetched(targetSlideId, { tier: 'hot' })
            : Promise.resolve())
            .finally(() => {
                this._navGatePromise = null;
                store.dispatch('PRESENTATION_SET_PAUSED', false);
                if (this._isPresenter()) {
                    store.dispatch('PRESENTATION_SET_NAV_LOADING', false);
                }
            });

        await this._navGatePromise;
        store.dispatch(direction === 'prev' ? 'PRESENTATION_PREV' : 'PRESENTATION_NEXT');
    }

    init() {
        if (this.playBtn) {
            this.playBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleModePicker();
            });
        }

        // Listen for mode changes
        store.on('mode-changed', (mode) => {
            if (mode === 'presentation') {
                const state = store.getState();
                const requestFullscreen = state?.presentation?.requestFullscreen !== false;
                this.enterPresentation({ requestFullscreen });
            } else {
                this.exitPresentation();
            }
        });

        // Listen for state changes
        store.on('state-changed', (state) => {
            if (state.editor.mode === 'presentation') {
                this.updateScale();
            }

            // Keep overlays/laser cursor in sync even when leaving presentation.
            this.updateOverlays(state.presentation, state.editor.mode);

            // Gate 7: broadcast sync changes (navigation + toggles).
            this._maybeBroadcastSync(state);

            // Gate 8: announce slide/build changes.
            this._announcePresentationState(state);

            // Gate 7: presenter-only panel updates.
            if (this._isPresenter()) {
                this._updatePresenterPanel(state);
            }
        });

        this.bindEvents();
    }

    bindEvents() {
        window.addEventListener('presentation:open-presenter-view', () => {
            this._openPresenterWindow();
        });

        window.addEventListener('presentation:navigate', (e) => {
            const state = store.getState();
            if (state?.editor?.mode !== 'presentation') return;
            const dir = e?.detail?.direction;
            if (dir === 'prev') this._navigateSlideGuarded('prev');
            if (dir === 'next') this._navigateSlideGuarded('next');
        });

        // Keyboard Navigation
        document.addEventListener('keydown', (e) => {
            const state = store.getState();
            if (state.editor.mode !== 'presentation') return;

            // When paused (e.g., nav gating), still allow Escape to exit.
            if (state.presentation?.isPaused && e.key !== 'Escape') return;

            // Interactive element priority: if the event originated from a focused control (HUD, grid, links,
            // form fields, media controls), do not steal keystrokes that should activate or navigate that control.
            // This prevents (for example) Enter on the HUD grid button from advancing the slide.
            if (e.target instanceof Element) {
                const interactiveAncestor = e.target.closest(
                    '#presentation-hud, #presentation-grid-view, a[href], button, input, textarea, select, video, [contenteditable="true"], [role="button"], [role="link"]'
                );

                const isNavOrEntryKey =
                    /^[0-9]$/.test(e.key) ||
                    e.key === 'Enter' ||
                    e.key === ' ' ||
                    e.key === 'Space' ||
                    e.key === 'Backspace' ||
                    e.key === 'PageUp' ||
                    e.key === 'PageDown' ||
                    e.key === 'Home' ||
                    e.key === 'End' ||
                    e.key === 'n' ||
                    e.key === 'p' ||
                    (typeof e.key === 'string' && e.key.startsWith('Arrow'));

                if (interactiveAncestor && isNavOrEntryKey) {
                    return;
                }
            }

            // Don't interfere with browser/OS shortcuts.
            if (e.ctrlKey || e.metaKey) return;

            // Back-stack shortcut: Alt+Left or Alt+Backspace.
            if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'Backspace')) {
                e.preventDefault();
                store.dispatch('PRESENTATION_GO_BACK');
                return;
            }

            // Ignore remaining Alt-modified shortcuts.
            if (e.altKey) return;

            // Focus trap: if typing in an input/contenteditable, do not handle presentation shortcuts.
            if (InputManager.shouldBlockShortcut(e)) return;

            // Numeric entry buffer (PowerPoint-style).
            if (/^[0-9]$/.test(e.key)) {
                e.preventDefault();
                this._numericBuffer.pushDigit(e.key);
                return;
            }

            // If numeric entry is active, Enter commits and Esc cancels.
            if (this._numericBuffer.isActive) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this._numericBuffer.commit();
                    return;
                }
                if (e.key === 'Escape') {
                    e.preventDefault();
                    this._numericBuffer.cancel();
                    return;
                }
            }

            // Key repeat throttle (avoid accidental rapid navigation).
            const now = performance.now();
            if (now - this._lastShortcutAt < INPUT_THROTTLE_MS) {
                return;
            }
            this._lastShortcutAt = now;

            switch (e.key) {
                case 'ArrowRight':
                case 'ArrowDown':
                case 'Space':
                case 'Enter':
                case 'PageDown':
                case 'n':
                    e.preventDefault();
                    if (state.presentation.buildIndex < state.presentation.buildCount - 1) {
                        store.dispatch('NEXT_BUILD');
                    } else {
                        this._navigateSlideGuarded('next');
                    }
                    break;
                case 'ArrowLeft':
                case 'ArrowUp':
                case 'Backspace':
                case 'PageUp':
                case 'p':
                    e.preventDefault();
                    if (state.presentation.buildIndex > 0) store.dispatch('PREV_BUILD');
                    else this._navigateSlideGuarded('prev');
                    break;
                case 'Home':
                    e.preventDefault();
                    store.dispatch('PRESENTATION_GOTO', 0);
                    break;
                case 'End': {
                    e.preventDefault();
                    const slideCount = state.slideOrder?.length ?? 0;
                    if (slideCount > 0) {
                        store.dispatch('PRESENTATION_GOTO', slideCount - 1);
                    }
                    break;
                }
                case 'Escape':
                    e.preventDefault();
                    this.stopPresentation();
                    break;
                case 'b':
                case '.':
                    e.preventDefault();
                    store.dispatch('TOGGLE_BLACK_SCREEN');
                    break;
                case 'w':
                case ',':
                    e.preventDefault();
                    store.dispatch('TOGGLE_WHITE_SCREEN');
                    break;
                case 'l':
                    e.preventDefault();
                    store.dispatch('TOGGLE_LASER');
                    break;
                case 'g':
                    e.preventDefault();
                    store.dispatch('TOGGLE_GRID_VIEW');
                    break;
            }
        });

        // Click-to-advance (configurable, excludes interactive regions)
        document.addEventListener('click', (e) => {
            const state = store.getState();
            if (state.editor.mode !== 'presentation') return;
            if (state.presentation?.isPaused) return;
            if (!this._clickAdvanceConfig.enabled) return;

            // Don't advance when overlays/grid are showing.
            if (state.presentation.blackScreen || state.presentation.whiteScreen || state.presentation.gridView) return;

            // Only left-click.
            if (e.button !== 0) return;

            const target = e.target;
            if (!(target instanceof Element)) return;

            for (const selector of this._clickAdvanceConfig.excludeRegions) {
                if (target.closest(selector)) {
                    return;
                }
            }

            e.preventDefault();
            e.stopPropagation();

            if (this._clickAdvanceConfig.action === 'next-slide') {
                this._navigateSlideGuarded('next');
                return;
            }

            // Default: next-build
            if (state.presentation.buildIndex < state.presentation.buildCount - 1) {
                store.dispatch('NEXT_BUILD');
            } else {
                this._navigateSlideGuarded('next');
            }
        }, true);

        // Touch gestures (swipe left/right), and tap to reveal HUD handled by HUD.
        document.addEventListener('touchstart', (e) => {
            const state = store.getState();
            if (state.editor.mode !== 'presentation') return;
            if (e.touches.length !== 1) {
                this._touchStart = null;
                return;
            }
            const t = e.touches[0];
            this._touchStart = { x: t.clientX, y: t.clientY, time: performance.now() };
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            const state = store.getState();
            if (state.editor.mode !== 'presentation') return;
            if (state.presentation?.isPaused) return;
            if (!this._touchStart) return;

            // Don't navigate when overlays/grid are showing.
            if (state.presentation.blackScreen || state.presentation.whiteScreen || state.presentation.gridView) {
                this._touchStart = null;
                return;
            }

            const t = e.changedTouches[0];
            if (!t) return;

            const endTime = performance.now();
            const dx = t.clientX - this._touchStart.x;
            const dy = t.clientY - this._touchStart.y;
            const duration = endTime - this._touchStart.time;

            // Defaults from spec.
            const minDistance = 50;
            const maxDuration = 500;
            const maxVerticalDeviation = 30;

            this._touchStart = null;

            if (duration > maxDuration) return;
            if (Math.abs(dx) < minDistance) return;
            if (Math.abs(dy) > maxVerticalDeviation) return;

            if (dx < 0) {
                // Swipe left -> next
                if (state.presentation.buildIndex < state.presentation.buildCount - 1) {
                    store.dispatch('NEXT_BUILD');
                } else {
                    this._navigateSlideGuarded('next');
                }
            } else {
                // Swipe right -> prev
                if (state.presentation.buildIndex > -1) {
                    store.dispatch('PREV_BUILD');
                } else {
                    this._navigateSlideGuarded('prev');
                }
            }
        }, { passive: true });

        // Handle fullscreen change (user pressed Esc or F11)
        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) {
                // If we exited fullscreen externally, remain in presentation mode
                // (spec: continue presenting windowed and allow re-request).
                const state = store.getState();
                if (state?.editor?.mode === 'presentation') {
                    this.updateScale();
                }
            }
        });

        // Handle Resize
        window.addEventListener('resize', () => {
            const state = store.getState();
            if (state?.editor?.mode === 'presentation') {
                this.updateScale();
            }
        });
        
        // Mouse Move for Laser Pointer
        document.addEventListener('mousemove', (e) => {
            const state = store.getState();
            if (state?.editor?.mode === 'presentation' && state?.presentation?.laserPointer) {
                // Canvas is now fixed position full screen, so client coordinates match
                this.laserPointer.addPoint(e.clientX, e.clientY);
            }

            if (state?.editor?.mode === 'presentation') {
                this._onPointerActivity();
            }
        });
        
        // Mouse events for CodeFill in presentation mode
        document.addEventListener('mousemove', (e) => {
            this._broadcastPresentationMouse(e, undefined);
        });
        
        document.addEventListener('mousedown', (e) => {
            this._broadcastPresentationMouse(e, true);
        });
        
        document.addEventListener('mouseup', (e) => {
            this._broadcastPresentationMouse(e, false);
        });

        // Initialize sync immediately (constructor might run after window load).
        this._ensureSyncChannel();
        this._postSyncMessage({ type: 'hello', role: this._isPresenter() ? 'presenter' : 'audience' });
    }

    _onPointerActivity() {
        // Show cursor and start idle-hide timer (spec: hide cursor after inactivity)
        cursorManager.show('presentation-idle');

        if (this._idleCursorTimer) {
            clearTimeout(this._idleCursorTimer);
        }

        this._idleCursorTimer = setTimeout(() => {
            const state = store.getState();
            if (state.editor.mode === 'presentation') {
                cursorManager.hide('presentation-idle');
            }
        }, 5000);
    }

    _gotoSlideNumber(slideNumber) {
        const state = store.getState();
        const slideCount = state.slideOrder?.length ?? 0;
        if (!Number.isInteger(slideNumber)) return;
        if (slideNumber < 1 || slideNumber > slideCount) {
            console.warn(`Invalid slide number ${slideNumber} (count=${slideCount})`);
            return;
        }
        store.dispatch('PRESENTATION_GOTO', slideNumber - 1);
    }

    _jumpToSlideNumber(slideNumber) {
        const state = store.getState();
        const slideCount = state.slideOrder?.length ?? 0;
        if (!Number.isInteger(slideNumber)) return;
        if (slideNumber < 1 || slideNumber > slideCount) {
            console.warn(`Invalid slide number ${slideNumber} (count=${slideCount})`);
            return;
        }
        store.dispatch('PRESENTATION_JUMP_TO', { index: slideNumber - 1, source: 'number' });
    }
    
    /**
     * Broadcast mouse state to CodeFill canvases in presentation mode
     * @param {MouseEvent} e - Mouse event
     * @param {boolean|undefined} isDown - Force isDown state
     * @private
     */
    _broadcastPresentationMouse(e, isDown) {
        const state = store.getState();
        if (state.editor.mode !== 'presentation') return;
        
        // Don't broadcast if overlays are showing (black/white screen)
        if (state.presentation.blackScreen || state.presentation.whiteScreen) return;
        
        // Calculate world coordinates using cached scale/offset
        const worldX = (e.clientX - this._presentationOffsetX) / this._presentationScale;
        const worldY = (e.clientY - this._presentationOffsetY) / this._presentationScale;
        
        // Determine button state
        let buttonDown;
        if (isDown !== undefined) {
            buttonDown = isDown;
        } else {
            buttonDown = (e.buttons & 1) === 1;
        }
        
        // Broadcast - never suppressed in presentation mode
        mouseStateManager.setSuppressed(false);
        mouseStateManager.update({
            screenX: e.clientX,
            screenY: e.clientY,
            worldX,
            worldY,
            isDown: buttonDown,
            button: e.button,
            timestamp: performance.now()
        });
    }

    startPresentation() {
        this.startPresentationWithOptions({ requestFullscreen: true });
    }

    startPresentationWithOptions({ requestFullscreen }) {
        const state = store.getState();
        const slideCount = state.slideOrder?.length ?? Object.keys(state.slides ?? {}).length;
        if (slideCount <= 0) {
            // Minimal user feedback; avoid bringing in modal dependencies here.
            window.alert('Deck must have at least 1 slide');
            return;
        }

        store.dispatch('PRESENTATION_SET_REQUEST_FULLSCREEN', requestFullscreen !== false);
        store.dispatch('SET_MODE', 'presentation');
    }

    stopPresentation() {
        this._numericBuffer.cancel();
        cursorManager.show('presentation-idle');
        if (this._idleCursorTimer) {
            clearTimeout(this._idleCursorTimer);
            this._idleCursorTimer = null;
        }

        // SHOULD prompt if exiting with unsaved changes.
        try {
            const hasUnsaved = typeof fileService?.hasUnsavedChanges === 'function' && fileService.hasUnsavedChanges();
            if (hasUnsaved) {
                const ok = window.confirm('You have unsaved changes. Exit presentation?');
                if (!ok) return;
            }
        } catch {
            // Best-effort only.
        }

        store.dispatch('SET_MODE', 'edit');
    }

    async enterPresentation({ requestFullscreen }) {
        // Capture current viewport styling for restoration (zoom/scroll transforms).
        if (!this._restoreViewportStyles && this.slideContainer) {
            const el = this.slideContainer;
            this._restoreViewportStyles = {
                position: el.style.position,
                top: el.style.top,
                left: el.style.left,
                width: el.style.width,
                height: el.style.height,
                transform: el.style.transform,
                transformOrigin: el.style.transformOrigin
            };
        }

        try {
            if (requestFullscreen !== false && this.appContainer.requestFullscreen) {
                await this.appContainer.requestFullscreen();
            }
        } catch (err) {
            // Fullscreen may be blocked (e.g. in automated tests or restrictive browsers).
            // Presentation mode should still work without fullscreen.
            console.warn(`Fullscreen denied. Continuing in windowed mode: ${err?.message ?? err}`);
        }

        document.body.classList.add('mode-presentation');

        // Gate 7/8: ensure presenter-only chrome and accessibility surfaces exist.
        this._ensureLiveRegion();
        if (this._isPresenter()) {
            this._presenterUi.startedAt = Date.now();
            this._ensurePresenterPanel();
        }

        // Gate 7: broadcast state so a presenter window can lockstep.
        this._postSyncMessage({ type: 'state-sync', state: this._getSyncStateSnapshot() });

        this.updateScale();

        // Start Laser Pointer loop if needed
        this.laserPointer.start();
        this.laserPointer.resize(); // Ensure it fits screen
    }

    exitPresentation() {
        // Clear any in-flight navigation gate UI state.
        this._navGatePromise = null;
        try {
            store.dispatch('PRESENTATION_SET_PAUSED', false);
            store.dispatch('PRESENTATION_SET_NAV_LOADING', false);
        } catch {
            // Best-effort.
        }

        if (this._localPrefetch) {
            this._localPrefetch.destroy();
            this._localPrefetch = null;
        }

        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
        document.body.classList.remove('mode-presentation');
        document.body.classList.remove('laser-active');

        // Gate 7: notify other window.
        if (!this._sync.isApplyingRemote) {
            this._postSyncMessage({ type: 'exit' });
        }

        // Gate 7: cleanup presenter-only UI.
        if (this._isPresenter()) {
            this._destroyPresenterPanel();
        }

        // Cleanup live region
        if (this._presenterUi.liveRegionEl) {
            this._presenterUi.liveRegionEl.remove();
            this._presenterUi.liveRegionEl = null;
            this._presenterUi.lastAnnounced = { slideIndex: null, buildIndex: null };
        }
        
        // Restore pre-presentation viewport state (best effort).
        if (this.slideContainer) {
            if (this._restoreViewportStyles) {
                const s = this._restoreViewportStyles;
                this.slideContainer.style.position = s.position;
                this.slideContainer.style.top = s.top;
                this.slideContainer.style.left = s.left;
                this.slideContainer.style.width = s.width;
                this.slideContainer.style.height = s.height;
                this.slideContainer.style.transform = s.transform;
                this.slideContainer.style.transformOrigin = s.transformOrigin;
            } else {
                this.slideContainer.style.transform = '';
                this.slideContainer.style.width = '';
                this.slideContainer.style.height = '';
                this.slideContainer.style.position = '';
                this.slideContainer.style.top = '';
                this.slideContainer.style.left = '';
                this.slideContainer.style.transformOrigin = '';
            }
        }

        this._restoreViewportStyles = null;

        // Reset inner layers to neutral state (remove Presentation Mode transforms)
        const contentLayer = document.getElementById('slide-content');
        const backgroundLayer = document.getElementById('slide-background');
        
        if (contentLayer) {
            contentLayer.style.transform = '';
            contentLayer.style.transformOrigin = '';
            contentLayer.style.width = '';
            contentLayer.style.height = '';
            contentLayer.style.top = '';
            contentLayer.style.left = '';
        }
        
        if (backgroundLayer) {
            backgroundLayer.style.transform = '';
            backgroundLayer.style.transformOrigin = '';
            backgroundLayer.style.width = '';
            backgroundLayer.style.height = '';
            backgroundLayer.style.top = '';
            backgroundLayer.style.left = '';
        }
        
        this.laserPointer.stop();
    }

    // Back-compat aliases used by older tests/callers.
    async enterFullscreen() {
        return this.enterPresentation({ requestFullscreen: true });
    }

    exitFullscreen() {
        return this.exitPresentation();
    }

    updateScale() {
        if (!this.slideContainer) return;

        // Use requestAnimationFrame to ensure we run after any potential conflicts
        requestAnimationFrame(() => {
            const state = store.getState();
            // Double check mode
            if (state?.editor?.mode !== 'presentation') return;

            const slideId = state.editor?.activeSlideId;
            const slide = slideId != null ? state?.slides?.[slideId] : undefined;
            
            if (!slide) return;

            const panelEl = this._isPresenter() ? document.getElementById('presenter-view-panel') : null;
            const panelWidth = panelEl ? Math.round(panelEl.getBoundingClientRect().width) : 0;

            const windowWidth = Math.max(0, window.innerWidth - panelWidth);
            const windowHeight = window.innerHeight;
            const slideWidth = slide.width || 1920;
            const slideHeight = slide.height || 1080;

            // Calculate aspect-ratio preserving scale + letterbox offsets.
            // Single-container transform to avoid per-element jitter.
            const scaleX = windowWidth / slideWidth;
            const scaleY = windowHeight / slideHeight;
            const rawScale = Math.min(scaleX, scaleY);
            const scale = Math.floor(rawScale * 1000) / 1000; // 3-decimal precision

            const offsetX = Math.round((windowWidth - slideWidth * scale) / 2);
            const offsetY = Math.round((windowHeight - slideHeight * scale) / 2);

            // Cache values for mouse coordinate calculation
            this._presentationScale = scale;
            this._slideWidth = slideWidth;
            this._slideHeight = slideHeight;
            this._presentationOffsetX = offsetX;
            this._presentationOffsetY = offsetY;

            // Apply Transform at container level.
            this.slideContainer.style.position = 'absolute';
            this.slideContainer.style.top = '0';
            this.slideContainer.style.left = '0';
            this.slideContainer.style.width = `${slideWidth}px`;
            this.slideContainer.style.height = `${slideHeight}px`;
            this.slideContainer.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
            this.slideContainer.style.transformOrigin = '0 0';

            // Reset inner layers to neutral state (remove Edit Mode transforms)
            const contentLayer = document.getElementById('slide-content');
            const backgroundLayer = document.getElementById('slide-background');
            
            if (contentLayer) {
                contentLayer.style.transform = 'none';
                contentLayer.style.transformOrigin = '0 0'; // Reset origin
                contentLayer.style.width = '100%';
                contentLayer.style.height = '100%';
                contentLayer.style.top = '0';
                contentLayer.style.left = '0';
            }
            
            if (backgroundLayer) {
                backgroundLayer.style.transform = 'none';
                backgroundLayer.style.transformOrigin = '0 0'; // Reset origin
                backgroundLayer.style.width = '100%';
                backgroundLayer.style.height = '100%';
                backgroundLayer.style.top = '0';
                backgroundLayer.style.left = '0';
            }
        });
    }

    updateOverlays(presentationState, mode = 'presentation') {
        const blackOverlay = document.getElementById('overlay-black');
        const whiteOverlay = document.getElementById('overlay-white');

        const isPresentation = mode === 'presentation';

        if (blackOverlay) {
            if (isPresentation && presentationState.blackScreen) {
                blackOverlay.classList.remove('hidden');
            } else {
                blackOverlay.classList.add('hidden');
            }
        }

        if (whiteOverlay) {
            if (isPresentation && presentationState.whiteScreen) {
                whiteOverlay.classList.remove('hidden');
            } else {
                whiteOverlay.classList.add('hidden');
            }
        }

        // Laser Pointer Cursor
        if (isPresentation && presentationState.laserPointer) {
            document.body.classList.add('laser-active');
        } else {
            document.body.classList.remove('laser-active');
        }
    }

    toggleModePicker() {
        const state = store.getState();
        if (state.editor?.mode === 'presentation') return;

        if (this._presentationOptionsMenu) {
            this._presentationOptionsMenu.remove();
            this._presentationOptionsMenu = null;
            return;
        }

        const btn = this.playBtn;
        if (!btn) return;
        const rect = btn.getBoundingClientRect();

        const menu = document.createElement('div');
        menu.className = 'dropdown-menu';
        menu.setAttribute('data-testid', 'presentation-mode-picker');
        menu.style.top = `${rect.bottom + 6}px`;
        menu.style.left = `${Math.max(8, rect.left)}px`;

        menu.innerHTML = `
            <div class="dropdown-item" data-action="present-fullscreen" data-testid="present-fullscreen">Start fullscreen</div>
            <div class="dropdown-item" data-action="present-windowed" data-testid="present-windowed">Present in window</div>
        `;

        const onDocClick = (e) => {
            const target = e.target;
            if (target instanceof Element && (target === menu || menu.contains(target) || target === btn)) return;
            cleanup();
        };

        const onKeyDown = (e) => {
            if (e.key === 'Escape') cleanup();
        };

        const cleanup = () => {
            document.removeEventListener('click', onDocClick, true);
            document.removeEventListener('keydown', onKeyDown, true);
            menu.remove();
            if (this._presentationOptionsMenu === menu) this._presentationOptionsMenu = null;
        };

        menu.addEventListener('click', (e) => {
            const target = e.target;
            if (!(target instanceof Element)) return;
            const action = target.getAttribute('data-action');
            if (!action) return;
            e.preventDefault();
            e.stopPropagation();

            if (action === 'present-fullscreen') {
                this.startPresentationWithOptions({ requestFullscreen: true });
            }
            if (action === 'present-windowed') {
                this.startPresentationWithOptions({ requestFullscreen: false });
            }
            cleanup();
        });

        document.body.appendChild(menu);
        this._presentationOptionsMenu = menu;

        document.addEventListener('click', onDocClick, true);
        document.addEventListener('keydown', onKeyDown, true);
    }
}
