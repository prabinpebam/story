/**
 * Tests for VectorClock
 */

import { VectorClock } from '../../src/core/collaboration/sync/StateSyncEngine.js';

describe('VectorClock', () => {
    describe('constructor', () => {
        it('should create empty vector clock', () => {
            const clock = new VectorClock();
            expect(clock.get('user1')).toBe(0);
        });

        it('should create from initial state', () => {
            const clock = new VectorClock({ user1: 5, user2: 3 });
            expect(clock.get('user1')).toBe(5);
            expect(clock.get('user2')).toBe(3);
        });
    });

    describe('increment', () => {
        it('should increment clock for user', () => {
            const clock = new VectorClock();
            expect(clock.increment('user1')).toBe(1);
            expect(clock.increment('user1')).toBe(2);
            expect(clock.get('user1')).toBe(2);
        });

        it('should handle multiple users', () => {
            const clock = new VectorClock();
            clock.increment('user1');
            clock.increment('user2');
            clock.increment('user1');
            
            expect(clock.get('user1')).toBe(2);
            expect(clock.get('user2')).toBe(1);
        });
    });

    describe('merge', () => {
        it('should take max of each clock value', () => {
            const clock1 = new VectorClock({ user1: 5, user2: 3 });
            const clock2 = new VectorClock({ user1: 3, user2: 7, user3: 2 });
            
            clock1.merge(clock2);
            
            expect(clock1.get('user1')).toBe(5);
            expect(clock1.get('user2')).toBe(7);
            expect(clock1.get('user3')).toBe(2);
        });
    });

    describe('happenedBefore', () => {
        it('should return true when all values are less or equal and at least one is less', () => {
            const clock1 = new VectorClock({ user1: 1, user2: 2 });
            const clock2 = new VectorClock({ user1: 2, user2: 3 });
            
            expect(clock1.happenedBefore(clock2)).toBe(true);
        });

        it('should return false when any value is greater', () => {
            const clock1 = new VectorClock({ user1: 3, user2: 2 });
            const clock2 = new VectorClock({ user1: 2, user2: 3 });
            
            expect(clock1.happenedBefore(clock2)).toBe(false);
        });

        it('should return false for equal clocks', () => {
            const clock1 = new VectorClock({ user1: 2, user2: 2 });
            const clock2 = new VectorClock({ user1: 2, user2: 2 });
            
            expect(clock1.happenedBefore(clock2)).toBe(false);
        });
    });

    describe('isConcurrent', () => {
        it('should return true for concurrent events', () => {
            const clock1 = new VectorClock({ user1: 3, user2: 1 });
            const clock2 = new VectorClock({ user1: 1, user2: 3 });
            
            expect(clock1.isConcurrent(clock2)).toBe(true);
        });

        it('should return false when one happened before the other', () => {
            const clock1 = new VectorClock({ user1: 1, user2: 1 });
            const clock2 = new VectorClock({ user1: 2, user2: 2 });
            
            expect(clock1.isConcurrent(clock2)).toBe(false);
        });
    });

    describe('clone', () => {
        it('should create independent copy', () => {
            const clock1 = new VectorClock({ user1: 5 });
            const clock2 = clock1.clone();
            
            clock2.increment('user1');
            
            expect(clock1.get('user1')).toBe(5);
            expect(clock2.get('user1')).toBe(6);
        });
    });

    describe('toJSON / fromJSON', () => {
        it('should serialize and deserialize correctly', () => {
            const clock1 = new VectorClock({ user1: 5, user2: 3 });
            const json = clock1.toJSON();
            const clock2 = VectorClock.fromJSON(json);
            
            expect(clock2.get('user1')).toBe(5);
            expect(clock2.get('user2')).toBe(3);
        });
    });
});
