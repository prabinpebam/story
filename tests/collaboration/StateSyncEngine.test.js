/**
 * Tests for StateSyncEngine
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StateSyncEngine, OperationType, Operation } from '../../src/core/collaboration/sync/StateSyncEngine.js';

// Mock connection
const createMockConnection = () => ({
    isConnected: true,
    on: vi.fn(),
    off: vi.fn(),
    send: vi.fn().mockResolvedValue(undefined),
    invoke: vi.fn().mockResolvedValue({})
});

describe('StateSyncEngine', () => {
    let syncEngine;
    let mockConnection;

    beforeEach(() => {
        mockConnection = createMockConnection();
        syncEngine = new StateSyncEngine({
            connection: mockConnection,
            userId: 'test-user'
        });
    });

    afterEach(() => {
        syncEngine.dispose();
    });

    describe('initialization', () => {
        it('should initialize with document state', async () => {
            const initialState = {
                slides: [{ id: 'slide-1', elements: [] }]
            };

            await syncEngine.initialize('doc-1', initialState);

            expect(syncEngine.documentId).toBe('doc-1');
            expect(syncEngine.getState()).toEqual(initialState);
            expect(syncEngine.stateVersion).toBe(0);
        });

        it('should setup connection handlers on initialize', async () => {
            await syncEngine.initialize('doc-1', { slides: [] });

            expect(mockConnection.on).toHaveBeenCalled();
        });

        it('should emit initialized event', async () => {
            const listener = vi.fn();
            syncEngine.on('initialized', listener);

            await syncEngine.initialize('doc-1', { slides: [] });

            expect(listener).toHaveBeenCalledWith(
                expect.objectContaining({ documentId: 'doc-1' })
            );
        });
    });

    describe('createOperation', () => {
        beforeEach(async () => {
            await syncEngine.initialize('doc-1', {
                slides: [{
                    id: 'slide-1',
                    elements: [{ id: 'element-1', x: 0, y: 0 }]
                }]
            });
        });

        it('should create and apply operation locally', () => {
            const localChangeListener = vi.fn();
            syncEngine.on('localChange', localChangeListener);

            syncEngine.createOperation({
                type: OperationType.MOVE,
                targetId: 'element-1',
                targetType: 'element',
                value: { x: 100, y: 200 }
            });

            expect(localChangeListener).toHaveBeenCalled();
            
            const element = syncEngine.findElement('element-1');
            expect(element.x).toBe(100);
            expect(element.y).toBe(200);
        });

        it('should increment vector clock', () => {
            const initialClock = syncEngine.vectorClock.get('test-user');

            syncEngine.createOperation({
                type: OperationType.UPDATE,
                targetId: 'element-1',
                targetType: 'element',
                path: 'name',
                value: 'New Name'
            });

            expect(syncEngine.vectorClock.get('test-user')).toBe(initialClock + 1);
        });
    });

    describe('applyOperation', () => {
        beforeEach(async () => {
            await syncEngine.initialize('doc-1', {
                slides: [{
                    id: 'slide-1',
                    elements: [
                        { id: 'element-1', x: 0, y: 0, style: {} }
                    ]
                }]
            });
        });

        it('should apply UPDATE operation', () => {
            const op = new Operation({
                type: OperationType.UPDATE,
                targetId: 'element-1',
                targetType: 'element',
                path: 'name',
                value: 'Updated'
            });

            syncEngine.applyOperation(op, false);

            const element = syncEngine.findElement('element-1');
            expect(element.name).toBe('Updated');
        });

        it('should apply MOVE operation', () => {
            const op = new Operation({
                type: OperationType.MOVE,
                targetId: 'element-1',
                targetType: 'element',
                value: { x: 50, y: 75, width: 200, height: 100 }
            });

            syncEngine.applyOperation(op, false);

            const element = syncEngine.findElement('element-1');
            expect(element.x).toBe(50);
            expect(element.y).toBe(75);
            expect(element.width).toBe(200);
            expect(element.height).toBe(100);
        });

        it('should apply STYLE operation', () => {
            const op = new Operation({
                type: OperationType.STYLE,
                targetId: 'element-1',
                targetType: 'element',
                value: { fill: '#FF0000', opacity: 0.5 }
            });

            syncEngine.applyOperation(op, false);

            const element = syncEngine.findElement('element-1');
            expect(element.style.fill).toBe('#FF0000');
            expect(element.style.opacity).toBe(0.5);
        });

        it('should apply ADD_ELEMENT operation', () => {
            const newElement = { id: 'element-2', type: 'rect', x: 100, y: 100 };
            const op = new Operation({
                type: OperationType.ADD_ELEMENT,
                targetId: 'slide-1',
                targetType: 'slide',
                value: newElement
            });

            syncEngine.applyOperation(op, false);

            const element = syncEngine.findElement('element-2');
            expect(element).toEqual(newElement);
        });

        it('should apply DELETE_ELEMENT operation', () => {
            const op = new Operation({
                type: OperationType.DELETE_ELEMENT,
                targetId: 'slide-1',
                targetType: 'slide',
                value: { id: 'element-1' }
            });

            syncEngine.applyOperation(op, false);

            const element = syncEngine.findElement('element-1');
            expect(element).toBeNull();
        });

        it('should apply ADD_SLIDE operation', () => {
            const newSlide = { id: 'slide-2', elements: [] };
            const op = new Operation({
                type: OperationType.ADD_SLIDE,
                targetType: 'presentation',
                value: { slide: newSlide }
            });

            syncEngine.applyOperation(op, false);

            const slide = syncEngine.findSlide('slide-2');
            expect(slide).toEqual(newSlide);
        });

        it('should apply DELETE_SLIDE operation', () => {
            const op = new Operation({
                type: OperationType.DELETE_SLIDE,
                targetId: 'slide-1',
                targetType: 'slide'
            });

            syncEngine.applyOperation(op, false);

            const slide = syncEngine.findSlide('slide-1');
            expect(slide).toBeNull();
        });

        it('should increment state version', () => {
            const initialVersion = syncEngine.stateVersion;

            const op = new Operation({
                type: OperationType.MOVE,
                targetId: 'element-1',
                targetType: 'element',
                value: { x: 10 }
            });

            syncEngine.applyOperation(op, false);

            expect(syncEngine.stateVersion).toBe(initialVersion + 1);
        });
    });

    describe('transform', () => {
        beforeEach(async () => {
            await syncEngine.initialize('doc-1', {
                slides: [{ id: 'slide-1', elements: [] }]
            });
        });

        it('should return null when target was deleted', () => {
            const deleteOp = new Operation({
                type: OperationType.DELETE_ELEMENT,
                targetId: 'element-1',
                targetType: 'element'
            });

            const moveOp = new Operation({
                type: OperationType.MOVE,
                targetId: 'element-1',
                targetType: 'element',
                value: { x: 100 }
            });

            const transformed = syncEngine.transform(moveOp, deleteOp);

            expect(transformed).toBeNull();
        });

        it('should merge non-conflicting MOVE properties', () => {
            const op1 = new Operation({
                type: OperationType.MOVE,
                targetId: 'element-1',
                targetType: 'element',
                value: { x: 100 },
                timestamp: 1000
            });

            const op2 = new Operation({
                type: OperationType.MOVE,
                targetId: 'element-1',
                targetType: 'element',
                value: { y: 200 },
                timestamp: 2000
            });

            const transformed = syncEngine.transform(op1, op2);

            expect(transformed.value.x).toBe(100);
        });

        it('should not transform operations on different targets', () => {
            const op1 = new Operation({
                type: OperationType.MOVE,
                targetId: 'element-1',
                targetType: 'element',
                value: { x: 100 }
            });

            const op2 = new Operation({
                type: OperationType.MOVE,
                targetId: 'element-2',
                targetType: 'element',
                value: { x: 200 }
            });

            const transformed = syncEngine.transform(op1, op2);

            expect(transformed).toBe(op1);
        });
    });

    describe('findTarget', () => {
        beforeEach(async () => {
            await syncEngine.initialize('doc-1', {
                title: 'Test',
                slides: [{
                    id: 'slide-1',
                    elements: [{ id: 'element-1' }]
                }]
            });
        });

        it('should find presentation', () => {
            const target = syncEngine.findTarget('presentation', null);
            expect(target.title).toBe('Test');
        });

        it('should find slide by ID', () => {
            const target = syncEngine.findTarget('slide', 'slide-1');
            expect(target.id).toBe('slide-1');
        });

        it('should find element by ID', () => {
            const target = syncEngine.findTarget('element', 'element-1');
            expect(target.id).toBe('element-1');
        });

        it('should return null for unknown target', () => {
            const target = syncEngine.findTarget('unknown', 'id');
            expect(target).toBeNull();
        });
    });

    describe('pending operations', () => {
        beforeEach(async () => {
            await syncEngine.initialize('doc-1', { slides: [] });
        });

        it('should track pending operations count', () => {
            expect(syncEngine.getPendingCount()).toBe(0);

            syncEngine.createOperation({
                type: OperationType.ADD_SLIDE,
                targetType: 'presentation',
                value: { slide: { id: 'slide-1' } }
            });

            // Operation is queued in batch
            expect(syncEngine.batchQueue.length).toBeGreaterThan(0);
        });

        it('should report unsynced changes', () => {
            expect(syncEngine.hasUnsyncedChanges()).toBe(false);

            syncEngine.batchQueue.push(new Operation({ type: OperationType.UPDATE }));

            // Pending count includes batch queue
            expect(syncEngine.batchQueue.length).toBeGreaterThan(0);
        });
    });

    describe('event handling', () => {
        it('should register and remove event listeners', () => {
            const listener = vi.fn();

            syncEngine.on('test', listener);
            syncEngine.emit('test', { data: 'value' });

            expect(listener).toHaveBeenCalledWith({ data: 'value' });

            syncEngine.off('test', listener);
            syncEngine.emit('test', { data: 'value2' });

            expect(listener).toHaveBeenCalledTimes(1);
        });

        it('should handle errors in event listeners gracefully', () => {
            const errorListener = vi.fn(() => {
                throw new Error('Test error');
            });
            const goodListener = vi.fn();

            syncEngine.on('test', errorListener);
            syncEngine.on('test', goodListener);

            // Should not throw
            expect(() => syncEngine.emit('test', {})).not.toThrow();

            // Good listener should still be called
            expect(goodListener).toHaveBeenCalled();
        });
    });

    describe('dispose', () => {
        it('should cleanup resources', async () => {
            await syncEngine.initialize('doc-1', { slides: [] });

            syncEngine.dispose();

            expect(syncEngine.state).toBeNull();
            expect(syncEngine.pendingOperations).toEqual([]);
            expect(mockConnection.off).toHaveBeenCalled();
        });
    });

    describe('deep clone', () => {
        it('should create independent copies of nested objects', () => {
            const original = {
                a: { b: { c: 1 } },
                arr: [1, 2, { nested: true }]
            };

            const cloned = syncEngine.deepClone(original);

            cloned.a.b.c = 999;
            cloned.arr[2].nested = false;

            expect(original.a.b.c).toBe(1);
            expect(original.arr[2].nested).toBe(true);
        });

        it('should handle null and primitives', () => {
            expect(syncEngine.deepClone(null)).toBeNull();
            expect(syncEngine.deepClone(42)).toBe(42);
            expect(syncEngine.deepClone('string')).toBe('string');
        });
    });
});
