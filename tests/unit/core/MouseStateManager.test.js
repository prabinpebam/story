import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MouseStateManager, mouseStateManager } from '../../../src/core/MouseStateManager.js';

describe('MouseStateManager', () => {
    let manager;

    beforeEach(() => {
        // Create a fresh instance for each test
        manager = new MouseStateManager();
    });

    afterEach(() => {
        manager.clearSubscribers();
        vi.restoreAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with empty subscribers set', () => {
            expect(manager.getSubscriberCount()).toBe(0);
        });

        it('should initialize with default state values', () => {
            expect(manager.state.screenX).toBe(0);
            expect(manager.state.screenY).toBe(0);
            expect(manager.state.worldX).toBe(0);
            expect(manager.state.worldY).toBe(0);
            expect(manager.state.isDown).toBe(false);
            expect(manager.state.button).toBe(0);
            expect(manager.state.velocityX).toBe(0);
            expect(manager.state.velocityY).toBe(0);
            expect(manager.state.clicked).toBe(false);
            expect(manager.state.released).toBe(false);
            expect(manager.state.suppressed).toBe(false);
            expect(manager.state.timestamp).toBe(0);
        });

        it('should initialize with enabled set to true', () => {
            expect(manager.enabled).toBe(true);
        });
    });

    describe('subscribe()', () => {
        it('should add a subscriber', () => {
            const callback = vi.fn();
            manager.subscribe(callback);

            expect(manager.getSubscriberCount()).toBe(1);
        });

        it('should add multiple subscribers', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();
            const callback3 = vi.fn();

            manager.subscribe(callback1);
            manager.subscribe(callback2);
            manager.subscribe(callback3);

            expect(manager.getSubscriberCount()).toBe(3);
        });

        it('should return an unsubscribe function', () => {
            const callback = vi.fn();
            const unsubscribe = manager.subscribe(callback);

            expect(typeof unsubscribe).toBe('function');
        });

        it('should unsubscribe when unsubscribe function is called', () => {
            const callback = vi.fn();
            const unsubscribe = manager.subscribe(callback);

            expect(manager.getSubscriberCount()).toBe(1);

            unsubscribe();

            expect(manager.getSubscriberCount()).toBe(0);
        });

        it('should not add duplicate subscribers (Set behavior)', () => {
            const callback = vi.fn();
            manager.subscribe(callback);
            manager.subscribe(callback);

            expect(manager.getSubscriberCount()).toBe(1);
        });
    });

    describe('update()', () => {
        it('should update screen coordinates', () => {
            manager.update({
                screenX: 100,
                screenY: 200,
                worldX: 100,
                worldY: 200,
                timestamp: 1000
            });

            expect(manager.state.screenX).toBe(100);
            expect(manager.state.screenY).toBe(200);
        });

        it('should update world coordinates', () => {
            manager.update({
                worldX: 500,
                worldY: 300,
                timestamp: 1000
            });

            expect(manager.state.worldX).toBe(500);
            expect(manager.state.worldY).toBe(300);
        });

        it('should update button state', () => {
            manager.update({
                isDown: true,
                button: 2,
                worldX: 10,
                worldY: 10,
                timestamp: 1000
            });

            expect(manager.state.isDown).toBe(true);
            expect(manager.state.button).toBe(2);
        });

        it('should calculate velocity correctly', () => {
            // First update
            manager.update({
                worldX: 0,
                worldY: 0,
                timestamp: 0
            });

            // Second update - moved 100 pixels in 1 second
            manager.update({
                worldX: 100,
                worldY: 50,
                timestamp: 1000
            });

            expect(manager.state.velocityX).toBe(100);
            expect(manager.state.velocityY).toBe(50);
        });

        it('should not calculate velocity when time delta is too small', () => {
            manager.update({
                worldX: 0,
                worldY: 0,
                timestamp: 0
            });

            // Update with same timestamp (dt = 0)
            manager.update({
                worldX: 100,
                worldY: 100,
                timestamp: 0
            });

            // Velocity should remain 0 (no division by zero)
            expect(manager.state.velocityX).toBe(0);
            expect(manager.state.velocityY).toBe(0);
        });

        it('should detect click edge (pressed)', () => {
            const callback = vi.fn();
            manager.subscribe(callback);

            manager.update({
                isDown: true,
                worldX: 10,
                worldY: 10,
                timestamp: 1000
            });

            expect(callback).toHaveBeenCalled();
            const lastCall = callback.mock.calls[0][0];
            expect(lastCall.clicked).toBe(true);
            expect(lastCall.released).toBe(false);
        });

        it('should detect release edge', () => {
            // First, set mouse down
            manager.update({
                isDown: true,
                worldX: 10,
                worldY: 10,
                timestamp: 1000
            });

            const callback = vi.fn();
            manager.subscribe(callback);

            // Then release
            manager.update({
                isDown: false,
                worldX: 10,
                worldY: 10,
                timestamp: 1100
            });

            expect(callback).toHaveBeenCalled();
            const lastCall = callback.mock.calls[0][0];
            expect(lastCall.clicked).toBe(false);
            expect(lastCall.released).toBe(true);
        });

        it('should reset clicked/released flags after broadcast', () => {
            manager.update({
                isDown: true,
                worldX: 10,
                worldY: 10,
                timestamp: 1000
            });

            // After update, flags should be reset
            expect(manager.state.clicked).toBe(false);
            expect(manager.state.released).toBe(false);
        });

        it('should call all subscribers with state copy', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();
            manager.subscribe(callback1);
            manager.subscribe(callback2);

            manager.update({
                worldX: 50,
                worldY: 50,
                timestamp: 1000
            });

            expect(callback1).toHaveBeenCalled();
            expect(callback2).toHaveBeenCalled();

            // Both should receive the same values
            expect(callback1.mock.calls[0][0].worldX).toBe(50);
            expect(callback2.mock.calls[0][0].worldX).toBe(50);
        });

        it('should provide shallow copy to prevent mutation', () => {
            const callback = vi.fn((state) => {
                state.worldX = 999; // Try to mutate
            });
            manager.subscribe(callback);

            manager.update({
                worldX: 50,
                worldY: 50,
                timestamp: 1000
            });

            // Original state should not be mutated
            expect(manager.state.worldX).toBe(50);
        });

        it('should throttle small movements', () => {
            const callback = vi.fn();
            manager.subscribe(callback);

            // First update
            manager.update({
                worldX: 100,
                worldY: 100,
                timestamp: 1000
            });

            callback.mockClear();

            // Small movement (less than 0.5 pixels)
            manager.update({
                worldX: 100.3,
                worldY: 100.2,
                timestamp: 1100
            });

            expect(callback).not.toHaveBeenCalled();
        });

        it('should broadcast on button change even without movement', () => {
            const callback = vi.fn();
            manager.subscribe(callback);

            // Initial position
            manager.update({
                worldX: 100,
                worldY: 100,
                isDown: false,
                timestamp: 1000
            });

            callback.mockClear();

            // Click without moving
            manager.update({
                worldX: 100,
                worldY: 100,
                isDown: true,
                timestamp: 1100
            });

            expect(callback).toHaveBeenCalled();
        });

        it('should handle subscriber errors gracefully', () => {
            const errorCallback = vi.fn(() => {
                throw new Error('Test error');
            });
            const normalCallback = vi.fn();

            manager.subscribe(errorCallback);
            manager.subscribe(normalCallback);

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            // Should not throw
            expect(() => {
                manager.update({
                    worldX: 50,
                    worldY: 50,
                    timestamp: 1000
                });
            }).not.toThrow();

            // Normal callback should still be called
            expect(normalCallback).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });
    });

    describe('setEnabled()', () => {
        it('should enable broadcasting', () => {
            manager.setEnabled(true);
            expect(manager.enabled).toBe(true);
        });

        it('should disable broadcasting', () => {
            manager.setEnabled(false);
            expect(manager.enabled).toBe(false);
        });

        it('should not call subscribers when disabled', () => {
            const callback = vi.fn();
            manager.subscribe(callback);
            manager.setEnabled(false);

            manager.update({
                worldX: 100,
                worldY: 100,
                timestamp: 1000
            });

            expect(callback).not.toHaveBeenCalled();
        });

        it('should call subscribers when re-enabled', () => {
            const callback = vi.fn();
            manager.subscribe(callback);
            manager.setEnabled(false);
            manager.setEnabled(true);

            manager.update({
                worldX: 100,
                worldY: 100,
                timestamp: 1000
            });

            expect(callback).toHaveBeenCalled();
        });
    });

    describe('setSuppressed()', () => {
        it('should set suppressed state to true', () => {
            manager.setSuppressed(true);
            expect(manager.state.suppressed).toBe(true);
        });

        it('should set suppressed state to false', () => {
            manager.setSuppressed(true);
            manager.setSuppressed(false);
            expect(manager.state.suppressed).toBe(false);
        });

        it('should include suppressed state in broadcast', () => {
            const callback = vi.fn();
            manager.subscribe(callback);
            manager.setSuppressed(true);

            manager.update({
                worldX: 100,
                worldY: 100,
                timestamp: 1000
            });

            expect(callback.mock.calls[0][0].suppressed).toBe(true);
        });
    });

    describe('getSubscriberCount()', () => {
        it('should return 0 when no subscribers', () => {
            expect(manager.getSubscriberCount()).toBe(0);
        });

        it('should return correct count after adding subscribers', () => {
            manager.subscribe(() => {});
            manager.subscribe(() => {});
            manager.subscribe(() => {});

            expect(manager.getSubscriberCount()).toBe(3);
        });

        it('should return correct count after removing subscribers', () => {
            const unsub1 = manager.subscribe(() => {});
            const unsub2 = manager.subscribe(() => {});
            manager.subscribe(() => {});

            unsub1();
            unsub2();

            expect(manager.getSubscriberCount()).toBe(1);
        });
    });

    describe('clearSubscribers()', () => {
        it('should remove all subscribers', () => {
            manager.subscribe(() => {});
            manager.subscribe(() => {});
            manager.subscribe(() => {});

            manager.clearSubscribers();

            expect(manager.getSubscriberCount()).toBe(0);
        });

        it('should not call cleared subscribers on update', () => {
            const callback = vi.fn();
            manager.subscribe(callback);
            manager.clearSubscribers();

            manager.update({
                worldX: 100,
                worldY: 100,
                timestamp: 1000
            });

            expect(callback).not.toHaveBeenCalled();
        });
    });

    describe('singleton instance', () => {
        it('should export a singleton instance', () => {
            expect(mouseStateManager).toBeInstanceOf(MouseStateManager);
        });

        it('should be the same instance across imports', () => {
            // This tests that the exported instance is a singleton
            const count = mouseStateManager.getSubscriberCount();
            expect(typeof count).toBe('number');
        });
    });

    describe('velocity calculation edge cases', () => {
        it('should handle negative velocities', () => {
            manager.update({
                worldX: 100,
                worldY: 100,
                timestamp: 0
            });

            manager.update({
                worldX: 50,
                worldY: 25,
                timestamp: 1000
            });

            expect(manager.state.velocityX).toBe(-50);
            expect(manager.state.velocityY).toBe(-75);
        });

        it('should handle very high velocities', () => {
            manager.update({
                worldX: 0,
                worldY: 0,
                timestamp: 0
            });

            // 1000 pixels in 10ms = 100000 pixels/second
            manager.update({
                worldX: 1000,
                worldY: 1000,
                timestamp: 10
            });

            expect(manager.state.velocityX).toBe(100000);
            expect(manager.state.velocityY).toBe(100000);
        });

        it('should preserve previous velocity on zero time delta', () => {
            // Set initial velocity
            manager.update({
                worldX: 0,
                worldY: 0,
                timestamp: 0
            });

            manager.update({
                worldX: 100,
                worldY: 100,
                timestamp: 1000
            });

            const prevVelocityX = manager.state.velocityX;
            const prevVelocityY = manager.state.velocityY;

            // Update with same timestamp
            manager.update({
                worldX: 200,
                worldY: 200,
                timestamp: 1000
            });

            expect(manager.state.velocityX).toBe(prevVelocityX);
            expect(manager.state.velocityY).toBe(prevVelocityY);
        });
    });

    describe('edge detection', () => {
        it('should not detect click when already down', () => {
            // Set mouse down
            manager.update({
                isDown: true,
                worldX: 10,
                worldY: 10,
                timestamp: 1000
            });

            const callback = vi.fn();
            manager.subscribe(callback);

            // Update while still down
            manager.update({
                isDown: true,
                worldX: 20,
                worldY: 20,
                timestamp: 1100
            });

            expect(callback.mock.calls[0][0].clicked).toBe(false);
        });

        it('should not detect release when already up', () => {
            const callback = vi.fn();
            manager.subscribe(callback);

            // Update while already up
            manager.update({
                isDown: false,
                worldX: 20,
                worldY: 20,
                timestamp: 1100
            });

            expect(callback.mock.calls[0][0].released).toBe(false);
        });

        it('should handle rapid click and release', () => {
            const callback = vi.fn();
            manager.subscribe(callback);

            // Click
            manager.update({
                isDown: true,
                worldX: 10,
                worldY: 10,
                timestamp: 1000
            });

            expect(callback.mock.calls[0][0].clicked).toBe(true);

            // Immediate release
            manager.update({
                isDown: false,
                worldX: 10,
                worldY: 10,
                timestamp: 1001
            });

            expect(callback.mock.calls[1][0].released).toBe(true);
        });
    });
});
