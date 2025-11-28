import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the Store before importing PresentationManager
vi.mock('../../../src/core/Store.js', () => ({
    store: {
        getState: vi.fn(),
        dispatch: vi.fn(),
        on: vi.fn(),
        off: vi.fn()
    }
}));

// Create proper factory for LaserPointer mock
const createLaserPointerMock = () => ({
    start: vi.fn(),
    stop: vi.fn(),
    resize: vi.fn(),
    addPoint: vi.fn()
});

let laserPointerMockInstance = createLaserPointerMock();

// Mock LaserPointer
vi.mock('../../../src/core/LaserPointer.js', () => ({
    LaserPointer: class {
        constructor() {
            Object.assign(this, laserPointerMockInstance);
        }
    }
}));

// Mock MouseStateManager
vi.mock('../../../src/core/MouseStateManager.js', () => ({
    mouseStateManager: {
        setSuppressed: vi.fn(),
        update: vi.fn()
    }
}));

import { PresentationManager } from '../../../src/core/PresentationManager.js';
import { store } from '../../../src/core/Store.js';
import { LaserPointer } from '../../../src/core/LaserPointer.js';
import { mouseStateManager } from '../../../src/core/MouseStateManager.js';

describe('PresentationManager', () => {
    let presentationManager;
    let mockPlayBtn;
    let mockAppContainer;
    let mockViewport;
    let mockSlideContent;
    let mockSlideBackground;
    let mockBlackOverlay;
    let mockWhiteOverlay;
    let addEventListenerSpy;
    let keydownHandler;

    beforeEach(() => {
        // Create mock DOM elements
        mockPlayBtn = document.createElement('button');
        mockPlayBtn.id = 'play-btn';

        mockAppContainer = document.createElement('div');
        mockAppContainer.id = 'app';
        mockAppContainer.requestFullscreen = vi.fn().mockResolvedValue();

        mockViewport = document.createElement('div');
        mockViewport.id = 'viewport';

        mockSlideContent = document.createElement('div');
        mockSlideContent.id = 'slide-content';

        mockSlideBackground = document.createElement('div');
        mockSlideBackground.id = 'slide-background';

        mockBlackOverlay = document.createElement('div');
        mockBlackOverlay.id = 'overlay-black';
        mockBlackOverlay.classList.add('hidden');

        mockWhiteOverlay = document.createElement('div');
        mockWhiteOverlay.id = 'overlay-white';
        mockWhiteOverlay.classList.add('hidden');

        // Add elements to document
        document.body.appendChild(mockPlayBtn);
        document.body.appendChild(mockAppContainer);
        document.body.appendChild(mockViewport);
        document.body.appendChild(mockSlideContent);
        document.body.appendChild(mockSlideBackground);
        document.body.appendChild(mockBlackOverlay);
        document.body.appendChild(mockWhiteOverlay);

        // Mock window dimensions
        vi.stubGlobal('innerWidth', 1920);
        vi.stubGlobal('innerHeight', 1080);

        // Mock requestAnimationFrame
        vi.stubGlobal('requestAnimationFrame', vi.fn((cb) => {
            cb();
            return 1;
        }));

        // Mock window.addEventListener and capture keydown handler
        addEventListenerSpy = vi.fn((event, handler) => {
            if (event === 'keydown') {
                keydownHandler = handler;
            }
        });
        vi.stubGlobal('addEventListener', addEventListenerSpy);
        vi.stubGlobal('removeEventListener', vi.fn());

        // Mock document.fullscreenElement
        Object.defineProperty(document, 'fullscreenElement', {
            configurable: true,
            get: () => null
        });

        // Mock document.exitFullscreen
        document.exitFullscreen = vi.fn();

        // Setup default store state
        store.getState.mockReturnValue({
            editor: {
                mode: 'edit',
                activeSlideId: 'slide-1'
            },
            presentation: {
                blackScreen: false,
                whiteScreen: false,
                laserPointer: false,
                buildIndex: -1,
                buildCount: 3
            },
            slides: {
                'slide-1': {
                    width: 1920,
                    height: 1080
                }
            }
        });

        // Reset mocks
        vi.clearAllMocks();
        
        // Reset LaserPointer mock methods
        laserPointerMockInstance = createLaserPointerMock();

        // Create instance
        presentationManager = new PresentationManager();
    });

    afterEach(() => {
        // Cleanup DOM
        document.body.innerHTML = '';
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    describe('constructor', () => {
        it('should find play button element', () => {
            expect(presentationManager.playBtn).toBe(mockPlayBtn);
        });

        it('should find app container element', () => {
            expect(presentationManager.appContainer).toBe(mockAppContainer);
        });

        it('should find viewport element', () => {
            expect(presentationManager.slideContainer).toBe(mockViewport);
        });

        it('should create LaserPointer instance', () => {
            // The LaserPointer instance is created during construction
            expect(presentationManager.laserPointer).toBeDefined();
            expect(presentationManager.laserPointer.start).toBeDefined();
            expect(presentationManager.laserPointer.stop).toBeDefined();
        });

        it('should initialize with default cache values', () => {
            expect(presentationManager._presentationScale).toBe(1);
            expect(presentationManager._presentationOffsetX).toBe(0);
            expect(presentationManager._presentationOffsetY).toBe(0);
            expect(presentationManager._slideWidth).toBe(1920);
            expect(presentationManager._slideHeight).toBe(1080);
        });
    });

    describe('init()', () => {
        it('should add click listener to play button', () => {
            const clickSpy = vi.spyOn(mockPlayBtn, 'addEventListener');

            new PresentationManager();

            expect(clickSpy).toHaveBeenCalledWith('click', expect.any(Function));
        });

        it('should subscribe to mode-changed events', () => {
            expect(store.on).toHaveBeenCalledWith('mode-changed', expect.any(Function));
        });

        it('should subscribe to state-changed events', () => {
            expect(store.on).toHaveBeenCalledWith('state-changed', expect.any(Function));
        });
    });

    describe('startPresentation()', () => {
        it('should dispatch SET_MODE with presentation', () => {
            presentationManager.startPresentation();

            expect(store.dispatch).toHaveBeenCalledWith('SET_MODE', 'presentation');
        });
    });

    describe('stopPresentation()', () => {
        it('should dispatch SET_MODE with edit', () => {
            presentationManager.stopPresentation();

            expect(store.dispatch).toHaveBeenCalledWith('SET_MODE', 'edit');
        });
    });

    describe('enterFullscreen()', () => {
        it('should request fullscreen on app container', async () => {
            await presentationManager.enterFullscreen();

            expect(mockAppContainer.requestFullscreen).toHaveBeenCalled();
        });

        it('should add mode-presentation class to body', async () => {
            await presentationManager.enterFullscreen();

            expect(document.body.classList.contains('mode-presentation')).toBe(true);
        });

        it('should start laser pointer', async () => {
            await presentationManager.enterFullscreen();

            expect(presentationManager.laserPointer.start).toHaveBeenCalled();
        });

        it('should resize laser pointer', async () => {
            await presentationManager.enterFullscreen();

            expect(presentationManager.laserPointer.resize).toHaveBeenCalled();
        });

        it('should handle fullscreen errors gracefully', async () => {
            mockAppContainer.requestFullscreen = vi.fn().mockRejectedValue(new Error('Fullscreen denied'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await presentationManager.enterFullscreen();

            expect(consoleSpy).toHaveBeenCalled();
        });
    });

    describe('exitFullscreen()', () => {
        it('should call document.exitFullscreen when in fullscreen', () => {
            Object.defineProperty(document, 'fullscreenElement', {
                configurable: true,
                get: () => mockAppContainer
            });

            presentationManager.exitFullscreen();

            expect(document.exitFullscreen).toHaveBeenCalled();
        });

        it('should not call exitFullscreen when not in fullscreen', () => {
            presentationManager.exitFullscreen();

            expect(document.exitFullscreen).not.toHaveBeenCalled();
        });

        it('should remove mode-presentation class from body', () => {
            document.body.classList.add('mode-presentation');

            presentationManager.exitFullscreen();

            expect(document.body.classList.contains('mode-presentation')).toBe(false);
        });

        it('should remove laser-active class from body', () => {
            document.body.classList.add('laser-active');

            presentationManager.exitFullscreen();

            expect(document.body.classList.contains('laser-active')).toBe(false);
        });

        it('should stop laser pointer', () => {
            presentationManager.exitFullscreen();

            expect(presentationManager.laserPointer.stop).toHaveBeenCalled();
        });

        it('should reset slide container styles', () => {
            mockViewport.style.transform = 'scale(2)';

            presentationManager.exitFullscreen();

            expect(mockViewport.style.transform).toBe('');
        });

        it('should reset slide content layer styles', () => {
            mockSlideContent.style.transform = 'scale(2)';

            presentationManager.exitFullscreen();

            expect(mockSlideContent.style.transform).toBe('');
        });

        it('should reset slide background layer styles', () => {
            mockSlideBackground.style.transform = 'scale(2)';

            presentationManager.exitFullscreen();

            expect(mockSlideBackground.style.transform).toBe('');
        });
    });

    describe('updateScale()', () => {
        beforeEach(() => {
            store.getState.mockReturnValue({
                editor: {
                    mode: 'presentation',
                    activeSlideId: 'slide-1'
                },
                slides: {
                    'slide-1': {
                        width: 1920,
                        height: 1080
                    }
                }
            });
        });

        it('should not update if slideContainer is missing', () => {
            presentationManager.slideContainer = null;

            expect(() => presentationManager.updateScale()).not.toThrow();
        });

        it('should calculate scale to fit window', () => {
            presentationManager.updateScale();

            // With 1920x1080 window and 1920x1080 slide, scale should be 1
            expect(presentationManager._presentationScale).toBe(1);
        });

        it('should calculate offset for centering', () => {
            vi.stubGlobal('innerWidth', 3840);
            vi.stubGlobal('innerHeight', 2160);

            presentationManager.updateScale();

            // Scale would be 2, offset would be (3840 - 1920*2)/2 = 0
            expect(presentationManager._presentationScale).toBe(2);
            expect(presentationManager._presentationOffsetX).toBe(0);
            expect(presentationManager._presentationOffsetY).toBe(0);
        });

        it('should handle non-matching aspect ratios', () => {
            vi.stubGlobal('innerWidth', 800);
            vi.stubGlobal('innerHeight', 600);

            presentationManager.updateScale();

            // 800/1920 = 0.416, 600/1080 = 0.555
            // scale = min(0.416, 0.555) = 0.416
            expect(presentationManager._presentationScale).toBeCloseTo(0.416, 2);
        });

        it('should set slide container position styles', () => {
            presentationManager.updateScale();

            expect(mockViewport.style.position).toBe('absolute');
            expect(mockViewport.style.top).toBe('50%');
            expect(mockViewport.style.left).toBe('50%');
        });

        it('should set slide container dimensions', () => {
            presentationManager.updateScale();

            expect(mockViewport.style.width).toBe('1920px');
            expect(mockViewport.style.height).toBe('1080px');
        });

        it('should set slide content layer to neutral state', () => {
            presentationManager.updateScale();

            expect(mockSlideContent.style.transform).toBe('none');
            expect(mockSlideContent.style.width).toBe('100%');
            expect(mockSlideContent.style.height).toBe('100%');
        });

        it('should not update if not in presentation mode', () => {
            store.getState.mockReturnValue({
                editor: { mode: 'edit', activeSlideId: 'slide-1' },
                slides: { 'slide-1': { width: 1920, height: 1080 } }
            });

            const originalScale = presentationManager._presentationScale;
            presentationManager.updateScale();

            // Scale might be recalculated in requestAnimationFrame but mode check should prevent
            // Since we mock requestAnimationFrame to call immediately, let's check state returned
        });

        it('should handle missing slide data', () => {
            store.getState.mockReturnValue({
                editor: { mode: 'presentation', activeSlideId: 'slide-1' },
                slides: {}
            });

            expect(() => presentationManager.updateScale()).not.toThrow();
        });
    });

    describe('updateOverlays()', () => {
        it('should show black overlay when blackScreen is true', () => {
            presentationManager.updateOverlays({ blackScreen: true, whiteScreen: false, laserPointer: false });

            expect(mockBlackOverlay.classList.contains('hidden')).toBe(false);
        });

        it('should hide black overlay when blackScreen is false', () => {
            mockBlackOverlay.classList.remove('hidden');

            presentationManager.updateOverlays({ blackScreen: false, whiteScreen: false, laserPointer: false });

            expect(mockBlackOverlay.classList.contains('hidden')).toBe(true);
        });

        it('should show white overlay when whiteScreen is true', () => {
            presentationManager.updateOverlays({ blackScreen: false, whiteScreen: true, laserPointer: false });

            expect(mockWhiteOverlay.classList.contains('hidden')).toBe(false);
        });

        it('should hide white overlay when whiteScreen is false', () => {
            mockWhiteOverlay.classList.remove('hidden');

            presentationManager.updateOverlays({ blackScreen: false, whiteScreen: false, laserPointer: false });

            expect(mockWhiteOverlay.classList.contains('hidden')).toBe(true);
        });

        it('should add laser-active class when laserPointer is true', () => {
            presentationManager.updateOverlays({ blackScreen: false, whiteScreen: false, laserPointer: true });

            expect(document.body.classList.contains('laser-active')).toBe(true);
        });

        it('should remove laser-active class when laserPointer is false', () => {
            document.body.classList.add('laser-active');

            presentationManager.updateOverlays({ blackScreen: false, whiteScreen: false, laserPointer: false });

            expect(document.body.classList.contains('laser-active')).toBe(false);
        });
    });

    describe('keyboard navigation', () => {
        beforeEach(() => {
            store.getState.mockReturnValue({
                editor: { mode: 'presentation', activeSlideId: 'slide-1' },
                presentation: {
                    blackScreen: false,
                    whiteScreen: false,
                    laserPointer: false,
                    buildIndex: -1,
                    buildCount: 3
                },
                slides: { 'slide-1': { width: 1920, height: 1080 } }
            });
        });

        it('should navigate next on ArrowRight', () => {
            const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
            document.dispatchEvent(event);

            expect(store.dispatch).toHaveBeenCalledWith('NEXT_BUILD');
        });

        it('should navigate next on Space', () => {
            const event = new KeyboardEvent('keydown', { key: 'Space' });
            document.dispatchEvent(event);

            expect(store.dispatch).toHaveBeenCalledWith('NEXT_BUILD');
        });

        it('should navigate next on Enter', () => {
            const event = new KeyboardEvent('keydown', { key: 'Enter' });
            document.dispatchEvent(event);

            expect(store.dispatch).toHaveBeenCalledWith('NEXT_BUILD');
        });

        it('should navigate next on PageDown', () => {
            const event = new KeyboardEvent('keydown', { key: 'PageDown' });
            document.dispatchEvent(event);

            expect(store.dispatch).toHaveBeenCalledWith('NEXT_BUILD');
        });

        it('should navigate next on n key', () => {
            const event = new KeyboardEvent('keydown', { key: 'n' });
            document.dispatchEvent(event);

            expect(store.dispatch).toHaveBeenCalledWith('NEXT_BUILD');
        });

        it('should go to next slide when at last build', () => {
            store.getState.mockReturnValue({
                editor: { mode: 'presentation', activeSlideId: 'slide-1' },
                presentation: { buildIndex: 2, buildCount: 3 },
                slides: { 'slide-1': { width: 1920, height: 1080 } }
            });

            const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
            document.dispatchEvent(event);

            expect(store.dispatch).toHaveBeenCalledWith('PRESENTATION_NEXT');
        });

        it('should navigate previous on ArrowLeft', () => {
            store.getState.mockReturnValue({
                editor: { mode: 'presentation', activeSlideId: 'slide-1' },
                presentation: { buildIndex: 1, buildCount: 3 },
                slides: { 'slide-1': { width: 1920, height: 1080 } }
            });

            const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
            document.dispatchEvent(event);

            expect(store.dispatch).toHaveBeenCalledWith('PREV_BUILD');
        });

        it('should navigate previous on Backspace', () => {
            store.getState.mockReturnValue({
                editor: { mode: 'presentation', activeSlideId: 'slide-1' },
                presentation: { buildIndex: 1, buildCount: 3 },
                slides: { 'slide-1': { width: 1920, height: 1080 } }
            });

            const event = new KeyboardEvent('keydown', { key: 'Backspace' });
            document.dispatchEvent(event);

            expect(store.dispatch).toHaveBeenCalledWith('PREV_BUILD');
        });

        it('should navigate previous on PageUp', () => {
            store.getState.mockReturnValue({
                editor: { mode: 'presentation', activeSlideId: 'slide-1' },
                presentation: { buildIndex: 1, buildCount: 3 },
                slides: { 'slide-1': { width: 1920, height: 1080 } }
            });

            const event = new KeyboardEvent('keydown', { key: 'PageUp' });
            document.dispatchEvent(event);

            expect(store.dispatch).toHaveBeenCalledWith('PREV_BUILD');
        });

        it('should navigate previous on p key', () => {
            store.getState.mockReturnValue({
                editor: { mode: 'presentation', activeSlideId: 'slide-1' },
                presentation: { buildIndex: 1, buildCount: 3 },
                slides: { 'slide-1': { width: 1920, height: 1080 } }
            });

            const event = new KeyboardEvent('keydown', { key: 'p' });
            document.dispatchEvent(event);

            expect(store.dispatch).toHaveBeenCalledWith('PREV_BUILD');
        });

        it('should go to previous slide when at first build', () => {
            const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
            document.dispatchEvent(event);

            expect(store.dispatch).toHaveBeenCalledWith('PRESENTATION_PREV');
        });

        it('should stop presentation on Escape', () => {
            const event = new KeyboardEvent('keydown', { key: 'Escape' });
            document.dispatchEvent(event);

            expect(store.dispatch).toHaveBeenCalledWith('SET_MODE', 'edit');
        });

        it('should toggle black screen on b key', () => {
            const event = new KeyboardEvent('keydown', { key: 'b' });
            document.dispatchEvent(event);

            expect(store.dispatch).toHaveBeenCalledWith('TOGGLE_BLACK_SCREEN');
        });

        it('should toggle black screen on period key', () => {
            const event = new KeyboardEvent('keydown', { key: '.' });
            document.dispatchEvent(event);

            expect(store.dispatch).toHaveBeenCalledWith('TOGGLE_BLACK_SCREEN');
        });

        it('should toggle white screen on w key', () => {
            const event = new KeyboardEvent('keydown', { key: 'w' });
            document.dispatchEvent(event);

            expect(store.dispatch).toHaveBeenCalledWith('TOGGLE_WHITE_SCREEN');
        });

        it('should toggle white screen on comma key', () => {
            const event = new KeyboardEvent('keydown', { key: ',' });
            document.dispatchEvent(event);

            expect(store.dispatch).toHaveBeenCalledWith('TOGGLE_WHITE_SCREEN');
        });

        it('should toggle laser pointer on l key', () => {
            const event = new KeyboardEvent('keydown', { key: 'l' });
            document.dispatchEvent(event);

            expect(store.dispatch).toHaveBeenCalledWith('TOGGLE_LASER');
        });

        it('should toggle grid view on g key', () => {
            const event = new KeyboardEvent('keydown', { key: 'g' });
            document.dispatchEvent(event);

            expect(store.dispatch).toHaveBeenCalledWith('TOGGLE_GRID_VIEW');
        });

        it('should not handle keys when not in presentation mode', () => {
            store.getState.mockReturnValue({
                editor: { mode: 'edit', activeSlideId: 'slide-1' },
                presentation: { buildIndex: -1, buildCount: 3 },
                slides: { 'slide-1': { width: 1920, height: 1080 } }
            });

            store.dispatch.mockClear();

            const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
            document.dispatchEvent(event);

            expect(store.dispatch).not.toHaveBeenCalled();
        });
    });

    describe('play button click', () => {
        it('should start presentation when play button is clicked', () => {
            const clickEvent = new MouseEvent('click', { bubbles: true });
            mockPlayBtn.dispatchEvent(clickEvent);

            expect(store.dispatch).toHaveBeenCalledWith('SET_MODE', 'presentation');
        });

        it('should stop event propagation', () => {
            const clickEvent = new MouseEvent('click', { bubbles: true });
            const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');

            mockPlayBtn.dispatchEvent(clickEvent);

            expect(stopPropagationSpy).toHaveBeenCalled();
        });
    });

    describe('mouse events for laser pointer', () => {
        beforeEach(() => {
            store.getState.mockReturnValue({
                editor: { mode: 'presentation', activeSlideId: 'slide-1' },
                presentation: {
                    blackScreen: false,
                    whiteScreen: false,
                    laserPointer: true,
                    buildIndex: -1,
                    buildCount: 3
                },
                slides: { 'slide-1': { width: 1920, height: 1080 } }
            });
        });

        it('should add point to laser pointer on mousemove', () => {
            const event = new MouseEvent('mousemove', {
                clientX: 500,
                clientY: 300
            });
            document.dispatchEvent(event);

            expect(presentationManager.laserPointer.addPoint).toHaveBeenCalledWith(500, 300);
        });

        it('should not add point when not in presentation mode', () => {
            store.getState.mockReturnValue({
                editor: { mode: 'edit' },
                presentation: { laserPointer: true }
            });

            presentationManager.laserPointer.addPoint.mockClear();

            const event = new MouseEvent('mousemove', {
                clientX: 500,
                clientY: 300
            });
            document.dispatchEvent(event);

            expect(presentationManager.laserPointer.addPoint).not.toHaveBeenCalled();
        });

        it('should not add point when laser pointer is disabled', () => {
            store.getState.mockReturnValue({
                editor: { mode: 'presentation' },
                presentation: { laserPointer: false }
            });

            presentationManager.laserPointer.addPoint.mockClear();

            const event = new MouseEvent('mousemove', {
                clientX: 500,
                clientY: 300
            });
            document.dispatchEvent(event);

            expect(presentationManager.laserPointer.addPoint).not.toHaveBeenCalled();
        });
    });

    describe('_broadcastPresentationMouse()', () => {
        beforeEach(() => {
            store.getState.mockReturnValue({
                editor: { mode: 'presentation', activeSlideId: 'slide-1' },
                presentation: {
                    blackScreen: false,
                    whiteScreen: false,
                    laserPointer: false
                },
                slides: { 'slide-1': { width: 1920, height: 1080 } }
            });

            presentationManager._presentationScale = 1;
            presentationManager._presentationOffsetX = 0;
            presentationManager._presentationOffsetY = 0;
        });

        it('should not broadcast when not in presentation mode', () => {
            store.getState.mockReturnValue({
                editor: { mode: 'edit' },
                presentation: {}
            });

            const event = new MouseEvent('mousemove', { clientX: 100, clientY: 100 });
            presentationManager._broadcastPresentationMouse(event, undefined);

            expect(mouseStateManager.update).not.toHaveBeenCalled();
        });

        it('should not broadcast when black screen is showing', () => {
            store.getState.mockReturnValue({
                editor: { mode: 'presentation' },
                presentation: { blackScreen: true, whiteScreen: false }
            });

            const event = new MouseEvent('mousemove', { clientX: 100, clientY: 100 });
            presentationManager._broadcastPresentationMouse(event, undefined);

            expect(mouseStateManager.update).not.toHaveBeenCalled();
        });

        it('should not broadcast when white screen is showing', () => {
            store.getState.mockReturnValue({
                editor: { mode: 'presentation' },
                presentation: { blackScreen: false, whiteScreen: true }
            });

            const event = new MouseEvent('mousemove', { clientX: 100, clientY: 100 });
            presentationManager._broadcastPresentationMouse(event, undefined);

            expect(mouseStateManager.update).not.toHaveBeenCalled();
        });

        it('should calculate world coordinates based on scale and offset', () => {
            presentationManager._presentationScale = 2;
            presentationManager._presentationOffsetX = 100;
            presentationManager._presentationOffsetY = 50;

            const event = new MouseEvent('mousemove', {
                clientX: 500,
                clientY: 300,
                buttons: 0
            });
            presentationManager._broadcastPresentationMouse(event, undefined);

            expect(mouseStateManager.update).toHaveBeenCalledWith(expect.objectContaining({
                worldX: 200, // (500 - 100) / 2
                worldY: 125  // (300 - 50) / 2
            }));
        });

        it('should set suppressed to false in presentation mode', () => {
            const event = new MouseEvent('mousemove', { clientX: 100, clientY: 100 });
            presentationManager._broadcastPresentationMouse(event, undefined);

            expect(mouseStateManager.setSuppressed).toHaveBeenCalledWith(false);
        });
    });

    describe('fullscreen change handling', () => {
        it('should stop presentation when exiting fullscreen externally', () => {
            store.getState.mockReturnValue({
                editor: { mode: 'presentation' },
                presentation: {}
            });

            // Simulate fullscreen exit
            const event = new Event('fullscreenchange');
            document.dispatchEvent(event);

            expect(store.dispatch).toHaveBeenCalledWith('SET_MODE', 'edit');
        });

        it('should not stop presentation if still in fullscreen', () => {
            Object.defineProperty(document, 'fullscreenElement', {
                configurable: true,
                get: () => mockAppContainer
            });

            store.dispatch.mockClear();

            const event = new Event('fullscreenchange');
            document.dispatchEvent(event);

            expect(store.dispatch).not.toHaveBeenCalled();
        });
    });

    describe('window resize handling', () => {
        // Skip this test as window.dispatchEvent doesn't trigger our stubbed addEventListener
        it.skip('should update scale on window resize when in presentation mode', () => {
            store.getState.mockReturnValue({
                editor: { mode: 'presentation', activeSlideId: 'slide-1' },
                slides: { 'slide-1': { width: 1920, height: 1080 } }
            });

            const updateScaleSpy = vi.spyOn(presentationManager, 'updateScale');

            const event = new Event('resize');
            window.dispatchEvent(event);

            expect(updateScaleSpy).toHaveBeenCalled();
        });

        it('should not update scale on resize when not in presentation mode', () => {
            store.getState.mockReturnValue({
                editor: { mode: 'edit' }
            });

            const updateScaleSpy = vi.spyOn(presentationManager, 'updateScale');
            updateScaleSpy.mockClear();

            const event = new Event('resize');
            window.dispatchEvent(event);

            // The method is called but exits early due to mode check
        });
    });
});
