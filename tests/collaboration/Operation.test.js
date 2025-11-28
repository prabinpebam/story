/**
 * Tests for Operation class
 */

import { Operation, OperationType } from '../../src/core/collaboration/sync/StateSyncEngine.js';

describe('Operation', () => {
    describe('constructor', () => {
        it('should create operation with required fields', () => {
            const op = new Operation({
                type: OperationType.UPDATE,
                targetId: 'element-1',
                targetType: 'element',
                value: { x: 100 }
            });

            expect(op.type).toBe(OperationType.UPDATE);
            expect(op.targetId).toBe('element-1');
            expect(op.targetType).toBe('element');
            expect(op.value).toEqual({ x: 100 });
            expect(op.operationId).toBeDefined();
            expect(op.timestamp).toBeDefined();
        });

        it('should generate unique operation IDs', () => {
            const op1 = new Operation({ type: OperationType.UPDATE });
            const op2 = new Operation({ type: OperationType.UPDATE });

            expect(op1.operationId).not.toBe(op2.operationId);
        });
    });

    describe('createInverse', () => {
        it('should create inverse for INSERT operation', () => {
            const op = new Operation({
                type: OperationType.INSERT,
                targetId: 'element-1',
                value: { content: 'new' },
                previousValue: null
            });

            const inverse = op.createInverse();

            expect(inverse.type).toBe(OperationType.DELETE);
            expect(inverse.value).toBeNull();
            expect(inverse.previousValue).toEqual({ content: 'new' });
        });

        it('should create inverse for DELETE operation', () => {
            const op = new Operation({
                type: OperationType.DELETE,
                targetId: 'element-1',
                value: null,
                previousValue: { content: 'old' }
            });

            const inverse = op.createInverse();

            expect(inverse.type).toBe(OperationType.INSERT);
            expect(inverse.value).toEqual({ content: 'old' });
        });

        it('should swap values for UPDATE operation', () => {
            const op = new Operation({
                type: OperationType.UPDATE,
                targetId: 'element-1',
                path: 'style.color',
                value: '#FF0000',
                previousValue: '#0000FF'
            });

            const inverse = op.createInverse();

            expect(inverse.type).toBe(OperationType.UPDATE);
            expect(inverse.value).toBe('#0000FF');
            expect(inverse.previousValue).toBe('#FF0000');
        });
    });

    describe('toJSON / fromJSON', () => {
        it('should serialize and deserialize correctly', () => {
            const op = new Operation({
                type: OperationType.MOVE,
                targetId: 'element-1',
                targetType: 'element',
                value: { x: 100, y: 200 },
                userId: 'user-1',
                timestamp: 1234567890
            });

            const json = op.toJSON();
            const restored = Operation.fromJSON(json);

            expect(restored.type).toBe(op.type);
            expect(restored.targetId).toBe(op.targetId);
            expect(restored.value).toEqual(op.value);
            expect(restored.userId).toBe(op.userId);
            expect(restored.timestamp).toBe(op.timestamp);
            expect(restored.operationId).toBe(op.operationId);
        });
    });
});

describe('OperationType', () => {
    it('should have all required operation types', () => {
        expect(OperationType.INSERT).toBe('insert');
        expect(OperationType.DELETE).toBe('delete');
        expect(OperationType.UPDATE).toBe('update');
        expect(OperationType.MOVE).toBe('move');
        expect(OperationType.STYLE).toBe('style');
        expect(OperationType.ADD_SLIDE).toBe('add_slide');
        expect(OperationType.DELETE_SLIDE).toBe('delete_slide');
        expect(OperationType.ADD_ELEMENT).toBe('add_element');
        expect(OperationType.DELETE_ELEMENT).toBe('delete_element');
        expect(OperationType.BATCH).toBe('batch');
    });
});
