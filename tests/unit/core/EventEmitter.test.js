/**
 * EventEmitter Unit Tests
 * 
 * Tests the core pub/sub event system used throughout the application.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventEmitter, appEvents } from '../../../src/core/Events.js';

describe('EventEmitter', () => {
    let emitter;

    beforeEach(() => {
        emitter = new EventEmitter();
    });

    describe('on()', () => {
        it('should register an event listener', () => {
            const callback = vi.fn();
            emitter.on('test-event', callback);

            emitter.emit('test-event');
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should register multiple listeners for the same event', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();
            
            emitter.on('test-event', callback1);
            emitter.on('test-event', callback2);

            emitter.emit('test-event');
            expect(callback1).toHaveBeenCalledTimes(1);
            expect(callback2).toHaveBeenCalledTimes(1);
        });

        it('should allow same callback to be registered multiple times', () => {
            const callback = vi.fn();
            
            emitter.on('test-event', callback);
            emitter.on('test-event', callback);

            emitter.emit('test-event');
            expect(callback).toHaveBeenCalledTimes(2);
        });

        it('should register listeners for different events independently', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();
            
            emitter.on('event-a', callback1);
            emitter.on('event-b', callback2);

            emitter.emit('event-a');
            expect(callback1).toHaveBeenCalledTimes(1);
            expect(callback2).not.toHaveBeenCalled();
        });
    });

    describe('off()', () => {
        it('should remove a specific event listener', () => {
            const callback = vi.fn();
            emitter.on('test-event', callback);
            emitter.off('test-event', callback);

            emitter.emit('test-event');
            expect(callback).not.toHaveBeenCalled();
        });

        it('should only remove the specified listener, not others', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();
            
            emitter.on('test-event', callback1);
            emitter.on('test-event', callback2);
            emitter.off('test-event', callback1);

            emitter.emit('test-event');
            expect(callback1).not.toHaveBeenCalled();
            expect(callback2).toHaveBeenCalledTimes(1);
        });

        it('should handle removing a listener that was never added', () => {
            const callback = vi.fn();
            // Should not throw
            expect(() => emitter.off('test-event', callback)).not.toThrow();
        });

        it('should handle removing from an event that does not exist', () => {
            const callback = vi.fn();
            expect(() => emitter.off('non-existent-event', callback)).not.toThrow();
        });

        it('should remove all instances when callback is registered multiple times', () => {
            const callback = vi.fn();
            
            emitter.on('test-event', callback);
            emitter.on('test-event', callback);
            emitter.off('test-event', callback);

            emitter.emit('test-event');
            // Implementation removes all instances of the same callback
            expect(callback).not.toHaveBeenCalled();
        });
    });

    describe('emit()', () => {
        it('should call listeners with provided data', () => {
            const callback = vi.fn();
            const testData = { foo: 'bar', count: 42 };
            
            emitter.on('test-event', callback);
            emitter.emit('test-event', testData);

            expect(callback).toHaveBeenCalledWith(testData);
        });

        it('should call listeners in the order they were registered', () => {
            const callOrder = [];
            
            emitter.on('test-event', () => callOrder.push(1));
            emitter.on('test-event', () => callOrder.push(2));
            emitter.on('test-event', () => callOrder.push(3));

            emitter.emit('test-event');
            expect(callOrder).toEqual([1, 2, 3]);
        });

        it('should handle emitting an event with no listeners', () => {
            expect(() => emitter.emit('non-existent-event')).not.toThrow();
        });

        it('should handle emitting with undefined data', () => {
            const callback = vi.fn();
            emitter.on('test-event', callback);
            
            emitter.emit('test-event');
            expect(callback).toHaveBeenCalledWith(undefined);
        });

        it('should handle emitting with null data', () => {
            const callback = vi.fn();
            emitter.on('test-event', callback);
            
            emitter.emit('test-event', null);
            expect(callback).toHaveBeenCalledWith(null);
        });

        it('should pass complex objects to listeners', () => {
            const callback = vi.fn();
            const complexData = {
                nested: { deep: { value: 123 } },
                array: [1, 2, 3],
                func: () => {}
            };
            
            emitter.on('test-event', callback);
            emitter.emit('test-event', complexData);

            expect(callback).toHaveBeenCalledWith(complexData);
        });
    });

    describe('Edge Cases', () => {
        it('should handle special characters in event names', () => {
            const callback = vi.fn();
            const eventName = 'event:with:colons-and-dashes_and_underscores';
            
            emitter.on(eventName, callback);
            emitter.emit(eventName);

            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should handle numeric event names', () => {
            const callback = vi.fn();
            
            emitter.on(123, callback);
            emitter.emit(123);

            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should allow listeners to remove themselves during emit', () => {
            const callback1 = vi.fn(() => {
                emitter.off('test-event', callback1);
            });
            const callback2 = vi.fn();
            
            emitter.on('test-event', callback1);
            emitter.on('test-event', callback2);
            
            emitter.emit('test-event');
            
            expect(callback1).toHaveBeenCalledTimes(1);
            expect(callback2).toHaveBeenCalledTimes(1);
            
            // Emit again - callback1 should not fire
            emitter.emit('test-event');
            expect(callback1).toHaveBeenCalledTimes(1);
            expect(callback2).toHaveBeenCalledTimes(2);
        });

        it('should handle listener throwing an error', () => {
            const errorCallback = vi.fn(() => {
                throw new Error('Test error');
            });
            const afterCallback = vi.fn();
            
            emitter.on('test-event', errorCallback);
            emitter.on('test-event', afterCallback);
            
            // The emit will throw, but we should verify the error callback was called
            expect(() => emitter.emit('test-event')).toThrow('Test error');
            expect(errorCallback).toHaveBeenCalledTimes(1);
        });
    });
});

describe('appEvents Singleton', () => {
    it('should be an instance of EventEmitter', () => {
        expect(appEvents).toBeInstanceOf(EventEmitter);
    });

    it('should maintain state across multiple imports', () => {
        const callback = vi.fn();
        appEvents.on('singleton-test', callback);
        appEvents.emit('singleton-test');
        
        expect(callback).toHaveBeenCalledTimes(1);
        
        // Clean up
        appEvents.off('singleton-test', callback);
    });
});
