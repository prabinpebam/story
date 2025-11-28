/**
 * Tests for CollaborationService
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CollaborationService, SessionState } from '../../src/core/collaboration/CollaborationService.js';

// Mock all dependencies
vi.mock('../../src/core/collaboration/connection/SignalRConnection.js', () => ({
    SignalRConnection: vi.fn().mockImplementation(() => ({
        on: vi.fn(),
        off: vi.fn(),
        connect: vi.fn().mockResolvedValue(true),
        disconnect: vi.fn().mockResolvedValue(undefined),
        joinDocument: vi.fn().mockResolvedValue({ 
            isHost: true, 
            participants: [],
            state: { slides: [] }
        }),
        leaveDocument: vi.fn().mockResolvedValue(undefined),
        isConnected: true
    }))
}));

vi.mock('../../src/core/collaboration/presence/PresenceManager.js', () => ({
    PresenceManager: vi.fn().mockImplementation(() => ({
        on: vi.fn(),
        off: vi.fn(),
        joinDocument: vi.fn().mockResolvedValue(undefined),
        leaveDocument: vi.fn().mockResolvedValue(undefined),
        setStatus: vi.fn(),
        getActiveUsers: vi.fn().mockReturnValue([]),
        dispose: vi.fn()
    }))
}));

vi.mock('../../src/core/collaboration/cursor/CursorManager.js', () => ({
    CursorManager: vi.fn().mockImplementation(() => ({
        on: vi.fn(),
        off: vi.fn(),
        startTracking: vi.fn(),
        stopTracking: vi.fn(),
        broadcastCursor: vi.fn(),
        dispose: vi.fn()
    }))
}));

vi.mock('../../src/core/collaboration/sync/StateSyncEngine.js', () => ({
    StateSyncEngine: vi.fn().mockImplementation(() => ({
        on: vi.fn(),
        off: vi.fn(),
        initialize: vi.fn().mockResolvedValue(undefined),
        createOperation: vi.fn().mockReturnValue({ operationId: 'op-1' }),
        getState: vi.fn().mockReturnValue({ slides: [] }),
        hasUnsyncedChanges: vi.fn().mockReturnValue(false),
        dispose: vi.fn()
    })),
    OperationType: {
        INSERT: 'insert',
        DELETE: 'delete',
        UPDATE: 'update',
        MOVE: 'move',
        STYLE: 'style',
        ADD_SLIDE: 'add_slide',
        DELETE_SLIDE: 'delete_slide',
        ADD_ELEMENT: 'add_element',
        DELETE_ELEMENT: 'delete_element'
    }
}));

describe('CollaborationService', () => {
    let service;

    beforeEach(() => {
        service = new CollaborationService({
            hubUrl: 'https://test.signalr.com'
        });
    });

    afterEach(async () => {
        await service.dispose();
    });

    describe('initialization', () => {
        it('should start in disconnected state', () => {
            expect(service.sessionState).toBe(SessionState.DISCONNECTED);
        });

        it('should initialize with user info', async () => {
            await service.initialize('user-1', {
                name: 'Test User',
                avatar: 'https://example.com/avatar.png'
            });

            expect(service.userId).toBe('user-1');
            expect(service.connection).toBeDefined();
            expect(service.presenceManager).toBeDefined();
            expect(service.cursorManager).toBeDefined();
            expect(service.syncEngine).toBeDefined();
        });

        it('should emit initialized event', async () => {
            const listener = vi.fn();
            service.on('initialized', listener);

            await service.initialize('user-1', { name: 'Test' });

            expect(listener).toHaveBeenCalledWith(
                expect.objectContaining({ userId: 'user-1' })
            );
        });
    });

    describe('connect', () => {
        beforeEach(async () => {
            await service.initialize('user-1', { name: 'Test' });
        });

        it('should connect to SignalR hub', async () => {
            const result = await service.connect();

            expect(result).toBe(true);
            expect(service.sessionState).toBe(SessionState.CONNECTED);
        });

        it('should emit stateChanged events', async () => {
            const listener = vi.fn();
            service.on('stateChanged', listener);

            await service.connect();

            expect(listener).toHaveBeenCalledWith(
                expect.objectContaining({ state: SessionState.CONNECTING })
            );
            expect(listener).toHaveBeenCalledWith(
                expect.objectContaining({ state: SessionState.CONNECTED })
            );
        });

        it('should throw if not initialized', async () => {
            const uninitializedService = new CollaborationService();

            await expect(uninitializedService.connect()).rejects.toThrow();
        });
    });

    describe('joinDocument', () => {
        beforeEach(async () => {
            await service.initialize('user-1', { name: 'Test' });
            await service.connect();
        });

        it('should join document session', async () => {
            const result = await service.joinDocument('doc-1');

            expect(result.documentId).toBe('doc-1');
            expect(service.currentDocumentId).toBe('doc-1');
            expect(service.sessionState).toBe(SessionState.ACTIVE);
        });

        it('should initialize sync engine with document state', async () => {
            await service.joinDocument('doc-1');

            expect(service.syncEngine.initialize).toHaveBeenCalledWith(
                'doc-1',
                expect.any(Object)
            );
        });

        it('should start presence and cursor tracking', async () => {
            await service.joinDocument('doc-1');

            expect(service.presenceManager.joinDocument).toHaveBeenCalledWith('doc-1');
            expect(service.cursorManager.startTracking).toHaveBeenCalledWith('doc-1');
        });

        it('should emit documentJoined event', async () => {
            const listener = vi.fn();
            service.on('documentJoined', listener);

            await service.joinDocument('doc-1');

            expect(listener).toHaveBeenCalledWith(
                expect.objectContaining({ documentId: 'doc-1' })
            );
        });
    });

    describe('leaveDocument', () => {
        beforeEach(async () => {
            await service.initialize('user-1', { name: 'Test' });
            await service.connect();
            await service.joinDocument('doc-1');
        });

        it('should leave document session', async () => {
            await service.leaveDocument();

            expect(service.currentDocumentId).toBeNull();
            expect(service.sessionState).toBe(SessionState.CONNECTED);
        });

        it('should stop tracking and leave presence', async () => {
            await service.leaveDocument();

            expect(service.cursorManager.stopTracking).toHaveBeenCalled();
            expect(service.presenceManager.leaveDocument).toHaveBeenCalled();
        });

        it('should emit documentLeft event', async () => {
            const listener = vi.fn();
            service.on('documentLeft', listener);

            await service.leaveDocument();

            expect(listener).toHaveBeenCalledWith(
                expect.objectContaining({ documentId: 'doc-1' })
            );
        });
    });

    describe('sendOperation', () => {
        beforeEach(async () => {
            await service.initialize('user-1', { name: 'Test' });
            await service.connect();
            await service.joinDocument('doc-1');
        });

        it('should create operation via sync engine', () => {
            const result = service.sendOperation({
                type: 'update',
                targetId: 'element-1',
                value: { x: 100 }
            });

            expect(service.syncEngine.createOperation).toHaveBeenCalled();
            expect(result.operationId).toBeDefined();
        });

        it('should throw if no active session', async () => {
            await service.leaveDocument();

            expect(() => service.sendOperation({})).toThrow();
        });
    });

    describe('convenience methods', () => {
        beforeEach(async () => {
            await service.initialize('user-1', { name: 'Test' });
            await service.connect();
            await service.joinDocument('doc-1');
        });

        it('should update element position', () => {
            service.updateElementPosition('element-1', { x: 100, y: 200 });

            expect(service.syncEngine.createOperation).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'move',
                    targetId: 'element-1'
                })
            );
        });

        it('should update element style', () => {
            service.updateElementStyle('element-1', { fill: '#FF0000' });

            expect(service.syncEngine.createOperation).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'style',
                    targetId: 'element-1'
                })
            );
        });

        it('should add element', () => {
            service.addElement('slide-1', { id: 'new-element', type: 'rect' });

            expect(service.syncEngine.createOperation).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'add_element',
                    targetId: 'slide-1'
                })
            );
        });

        it('should delete element', () => {
            service.deleteElement('slide-1', 'element-1');

            expect(service.syncEngine.createOperation).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'delete_element',
                    targetId: 'slide-1'
                })
            );
        });

        it('should add slide', () => {
            service.addSlide({ id: 'slide-2', elements: [] });

            expect(service.syncEngine.createOperation).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'add_slide'
                })
            );
        });

        it('should delete slide', () => {
            service.deleteSlide('slide-1');

            expect(service.syncEngine.createOperation).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'delete_slide',
                    targetId: 'slide-1'
                })
            );
        });
    });

    describe('cursor and presence', () => {
        beforeEach(async () => {
            await service.initialize('user-1', { name: 'Test' });
            await service.connect();
            await service.joinDocument('doc-1');
        });

        it('should update cursor position', () => {
            service.updateCursor(100, 200, { slideId: 'slide-1' });

            expect(service.cursorManager.broadcastCursor).toHaveBeenCalledWith(
                100, 200, { slideId: 'slide-1' }
            );
        });

        it('should set presence status', () => {
            service.setPresenceStatus('idle');

            expect(service.presenceManager.setStatus).toHaveBeenCalledWith('idle');
        });

        it('should get active users', () => {
            service.getActiveUsers();

            expect(service.presenceManager.getActiveUsers).toHaveBeenCalled();
        });
    });

    describe('state queries', () => {
        beforeEach(async () => {
            await service.initialize('user-1', { name: 'Test' });
            await service.connect();
            await service.joinDocument('doc-1');
        });

        it('should get document state', () => {
            const state = service.getDocumentState();

            expect(service.syncEngine.getState).toHaveBeenCalled();
            expect(state).toBeDefined();
        });

        it('should check for unsynced changes', () => {
            const hasChanges = service.hasUnsyncedChanges();

            expect(service.syncEngine.hasUnsyncedChanges).toHaveBeenCalled();
            expect(typeof hasChanges).toBe('boolean');
        });
    });

    describe('disconnect', () => {
        beforeEach(async () => {
            await service.initialize('user-1', { name: 'Test' });
            await service.connect();
            await service.joinDocument('doc-1');
        });

        it('should disconnect from server', async () => {
            await service.disconnect();

            expect(service.sessionState).toBe(SessionState.DISCONNECTED);
        });

        it('should leave document before disconnecting', async () => {
            const leaveListener = vi.fn();
            service.on('documentLeft', leaveListener);

            await service.disconnect();

            expect(leaveListener).toHaveBeenCalled();
        });
    });

    describe('dispose', () => {
        beforeEach(async () => {
            await service.initialize('user-1', { name: 'Test' });
            await service.connect();
        });

        it('should cleanup all resources', async () => {
            // Store references before dispose nullifies them
            const cursorManager = service.cursorManager;
            const presenceManager = service.presenceManager;
            const syncEngine = service.syncEngine;
            
            await service.dispose();

            expect(cursorManager.dispose).toHaveBeenCalled();
            expect(presenceManager.dispose).toHaveBeenCalled();
            expect(syncEngine.dispose).toHaveBeenCalled();
        });
    });

    describe('event handling', () => {
        it('should register and emit events', () => {
            const listener = vi.fn();

            service.on('test', listener);
            service.emit('test', { data: 'value' });

            expect(listener).toHaveBeenCalledWith({ data: 'value' });
        });

        it('should remove listeners', () => {
            const listener = vi.fn();

            service.on('test', listener);
            service.off('test', listener);
            service.emit('test', { data: 'value' });

            expect(listener).not.toHaveBeenCalled();
        });
    });
});

describe('SessionState', () => {
    it('should have all required states', () => {
        expect(SessionState.DISCONNECTED).toBe('disconnected');
        expect(SessionState.CONNECTING).toBe('connecting');
        expect(SessionState.CONNECTED).toBe('connected');
        expect(SessionState.JOINING).toBe('joining');
        expect(SessionState.ACTIVE).toBe('active');
        expect(SessionState.RECONNECTING).toBe('reconnecting');
        expect(SessionState.ERROR).toBe('error');
    });
});
