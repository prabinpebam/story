import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted() for mock functions
const { mockOn, mockDispatch, mockGetState } = vi.hoisted(() => ({
    mockOn: vi.fn(),
    mockDispatch: vi.fn(),
    mockGetState: vi.fn(() => ({
        editor: { mode: 'edit' },
        presentation: { 
            laserPointer: false, 
            blackScreen: false, 
            gridView: false,
            buildIndex: -1,
            buildCount: 0,
            currentSlideIndex: 0
        }
    }))
}));

// Mock store
vi.mock('../../../src/core/Store.js', () => ({
    store: {
        on: mockOn,
        dispatch: mockDispatch,
        getState: mockGetState
    }
}));

import { HUD } from '../../../src/ui/HUD.js';

describe('HUD', () => {
    let hud;
    let container;
    let stateChangedHandler;
    let modeChangedHandler;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        
        // Reset mock implementations
        mockGetState.mockReturnValue({
            editor: { mode: 'edit' },
            presentation: { 
                laserPointer: false, 
                blackScreen: false, 
                gridView: false,
                buildIndex: -1,
                buildCount: 0,
                currentSlideIndex: 0
            }
        });
        
        // Capture store.on handlers
        mockOn.mockImplementation((event, handler) => {
            if (event === 'state-changed') stateChangedHandler = handler;
            if (event === 'mode-changed') modeChangedHandler = handler;
        });
        
        // Create container in DOM
        container = document.createElement('div');
        container.id = 'hud-container';
        document.body.appendChild(container);
        
        hud = new HUD('hud-container');
    });

    afterEach(() => {
        vi.useRealTimers();
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
        vi.restoreAllMocks();
    });

    describe('constructor', () => {
        it('should create an instance', () => {
            expect(hud).toBeDefined();
            expect(hud instanceof HUD).toBe(true);
        });

        it('should find container element', () => {
            expect(hud.container).toBe(container);
        });

        it('should initialize with isVisible false', () => {
            expect(hud.isVisible).toBe(false);
        });

        it('should subscribe to store state-changed event', () => {
            expect(mockOn).toHaveBeenCalledWith('state-changed', expect.any(Function));
        });

        it('should subscribe to store mode-changed event', () => {
            expect(mockOn).toHaveBeenCalledWith('mode-changed', expect.any(Function));
        });
    });

    describe('render()', () => {
        it('should create HUD controls', () => {
            const controls = container.querySelector('.hud-controls');
            expect(controls).toBeDefined();
        });

        it('should create previous button', () => {
            const prevBtn = container.querySelector('#hud-prev');
            expect(prevBtn).toBeDefined();
        });

        it('should create next button', () => {
            const nextBtn = container.querySelector('#hud-next');
            expect(nextBtn).toBeDefined();
        });

        it('should create laser pointer button', () => {
            const laserBtn = container.querySelector('#hud-laser');
            expect(laserBtn).toBeDefined();
        });

        it('should create grid button', () => {
            const gridBtn = container.querySelector('#hud-grid');
            expect(gridBtn).toBeDefined();
        });

        it('should create black screen button', () => {
            const blackBtn = container.querySelector('#hud-black');
            expect(blackBtn).toBeDefined();
        });

        it('should create exit button', () => {
            const exitBtn = container.querySelector('#hud-exit');
            expect(exitBtn).toBeDefined();
        });
    });

    describe('button actions', () => {
        it('should emit presentation:navigate prev on prev button click', () => {
            const handler = vi.fn();
            window.addEventListener('presentation:navigate', handler);

            const prevBtn = container.querySelector('#hud-prev');
            prevBtn.click();

            expect(handler).toHaveBeenCalledTimes(1);
            expect(handler.mock.calls[0][0]?.detail).toEqual({ direction: 'prev' });

            window.removeEventListener('presentation:navigate', handler);
        });

        it('should dispatch PREV_BUILD when in build step', () => {
            mockGetState.mockReturnValue({
                presentation: { buildIndex: 1, buildCount: 3 }
            });
            
            const prevBtn = container.querySelector('#hud-prev');
            prevBtn.click();
            
            expect(mockDispatch).toHaveBeenCalledWith('PREV_BUILD');
        });

        it('should emit presentation:navigate next on next button click', () => {
            const handler = vi.fn();
            window.addEventListener('presentation:navigate', handler);

            const nextBtn = container.querySelector('#hud-next');
            nextBtn.click();

            expect(handler).toHaveBeenCalledTimes(1);
            expect(handler.mock.calls[0][0]?.detail).toEqual({ direction: 'next' });

            window.removeEventListener('presentation:navigate', handler);
        });

        it('should dispatch NEXT_BUILD when builds remaining', () => {
            mockGetState.mockReturnValue({
                presentation: { buildIndex: 0, buildCount: 3 }
            });
            
            const nextBtn = container.querySelector('#hud-next');
            nextBtn.click();
            
            expect(mockDispatch).toHaveBeenCalledWith('NEXT_BUILD');
        });

        it('should dispatch TOGGLE_LASER on laser button click', () => {
            const laserBtn = container.querySelector('#hud-laser');
            laserBtn.click();
            
            expect(mockDispatch).toHaveBeenCalledWith('TOGGLE_LASER');
        });

        it('should dispatch TOGGLE_GRID_VIEW on grid button click', () => {
            const gridBtn = container.querySelector('#hud-grid');
            gridBtn.click();
            
            expect(mockDispatch).toHaveBeenCalledWith('TOGGLE_GRID_VIEW');
        });

        it('should dispatch TOGGLE_BLACK_SCREEN on black button click', () => {
            const blackBtn = container.querySelector('#hud-black');
            blackBtn.click();
            
            expect(mockDispatch).toHaveBeenCalledWith('TOGGLE_BLACK_SCREEN');
        });

        it('should dispatch EXIT_RUNTIME on exit button click', () => {
            const exitBtn = container.querySelector('#hud-exit');
            exitBtn.click();
            
            expect(mockDispatch).toHaveBeenCalledWith('EXIT_RUNTIME');
        });
    });

    describe('show()', () => {
        it('should remove hidden class from container', () => {
            container.classList.add('hidden');
            
            hud.show();
            
            expect(container.classList.contains('hidden')).toBe(false);
        });

        it('should set isVisible to true', () => {
            hud.show();
            
            expect(hud.isVisible).toBe(true);
        });

        it('should set hide timeout', () => {
            hud.show();
            
            expect(hud.hideTimeout).toBeDefined();
        });

        it('should auto-hide after 3 seconds', () => {
            hud.show();
            
            vi.advanceTimersByTime(3000);
            
            expect(container.classList.contains('hidden')).toBe(true);
        });

        it('should reset timeout on repeated show calls', () => {
            hud.show();
            vi.advanceTimersByTime(2000);
            
            hud.show();
            vi.advanceTimersByTime(2000);
            
            // Should still be visible (only 2s since last show)
            expect(container.classList.contains('hidden')).toBe(false);
        });
    });

    describe('hide()', () => {
        it('should add hidden class to container', () => {
            hud.show();
            hud.hide();
            
            expect(container.classList.contains('hidden')).toBe(true);
        });

        it('should set isVisible to false', () => {
            hud.show();
            hud.hide();
            
            expect(hud.isVisible).toBe(false);
        });
    });

    describe('update()', () => {
        it('should toggle laser button active state', () => {
            const laserBtn = container.querySelector('#hud-laser');
            
            hud.update({
                presentation: { laserPointer: true, blackScreen: false, gridView: false }
            });
            
            expect(laserBtn.classList.contains('active')).toBe(true);
        });

        it('should toggle black screen button active state', () => {
            const blackBtn = container.querySelector('#hud-black');
            
            hud.update({
                presentation: { laserPointer: false, blackScreen: true, gridView: false }
            });
            
            expect(blackBtn.classList.contains('active')).toBe(true);
        });

        it('should toggle grid button active state', () => {
            const gridBtn = container.querySelector('#hud-grid');
            
            hud.update({
                presentation: { laserPointer: false, blackScreen: false, gridView: true }
            });
            
            expect(gridBtn.classList.contains('active')).toBe(true);
        });

        it('should remove active class when states are false', () => {
            const laserBtn = container.querySelector('#hud-laser');
            laserBtn.classList.add('active');
            
            hud.update({
                presentation: { laserPointer: false, blackScreen: false, gridView: false }
            });
            
            expect(laserBtn.classList.contains('active')).toBe(false);
        });
    });

    describe('mode-changed handler', () => {
        it('should show HUD when entering presentation mode', () => {
            modeChangedHandler('presentation');
            
            expect(hud.isVisible).toBe(true);
        });

        it('should hide HUD when exiting presentation mode', () => {
            hud.show();
            modeChangedHandler('edit');
            
            expect(hud.isVisible).toBe(false);
        });
    });

    describe('no container', () => {
        it('should handle missing container gracefully', () => {
            const noContainer = new HUD('non-existent-id');
            
            expect(noContainer.container).toBeNull();
        });

        it('should not throw on show() without container', () => {
            const noContainer = new HUD('non-existent-id');
            
            expect(() => noContainer.show()).not.toThrow();
        });

        it('should not throw on hide() without container', () => {
            const noContainer = new HUD('non-existent-id');
            
            expect(() => noContainer.hide()).not.toThrow();
        });

        it('should not throw on update() without container', () => {
            const noContainer = new HUD('non-existent-id');
            
            expect(() => noContainer.update({})).not.toThrow();
        });
    });
});
