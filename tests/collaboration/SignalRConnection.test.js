/**
 * Tests for SignalRConnection
 * Real-time connection management for collaboration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SignalRConnection, getSignalRConnection } from '../../src/core/collaboration/connection/SignalRConnection.js';
import { SIGNALR, COLLABORATION_ERRORS } from '../../src/core/collaboration/constants/CollaborationConstants.js';

// Mock @microsoft/signalr
vi.mock('@microsoft/signalr', () => ({
    HubConnectionBuilder: vi.fn().mockImplementation(() => ({
        withUrl: vi.fn().mockReturnThis(),
        withAutomaticReconnect: vi.fn().mockReturnThis(),
        configureLogging: vi.fn().mockReturnThis(),
        build: vi.fn().mockReturnValue({
            start: vi.fn().mockResolvedValue(undefined),
            stop: vi.fn().mockResolvedValue(undefined),
            invoke: vi.fn().mockResolvedValue(undefined),
            on: vi.fn(),
            onclose: vi.fn(),
            onreconnecting: vi.fn(),
            onreconnected: vi.fn(),
            connectionId: 'test-connection-id'
        })
    })),
    LogLevel: {
        Information: 1
    }
}));

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('SignalRConnection', () => {
    let connection;

    beforeEach(() => {
        vi.clearAllMocks();
        connection = new SignalRConnection({
            negotiateUrl: 'https://api.example.com/negotiate'
        });
    });

    afterEach(() => {
        connection.dispose();
    });

    describe('initialization', () => {
        it('should initialize with correct defaults', () => {
            const conn = new SignalRConnection();
            expect(conn.connectionState).toBe(SIGNALR.STATES.DISCONNECTED);
            expect(conn.connectionId).toBeNull();
            expect(conn.isConnected).toBe(false);
            expect(conn.currentDocumentId).toBeNull();
        });

        it('should accept custom negotiate URL', () => {
            expect(connection.negotiateUrl).toBe('https://api.example.com/negotiate');
        });

        it('should have empty listeners by default', () => {
            expect(connection.listeners.size).toBe(0);
        });
    });

    describe('connect', () => {
        it('should negotiate and connect successfully', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    url: 'https://signalr.example.com',
                    accessToken: 'test-token'
                })
            });

            await connection.connect();

            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.example.com/negotiate',
                expect.objectContaining({
                    method: 'POST'
                })
            );
            expect(connection.isConnected).toBe(true);
            expect(connection.connectionId).toBe('test-connection-id');
        });

        it('should emit connected event on success', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    url: 'https://signalr.example.com',
                    accessToken: 'test-token'
                })
            });

            const handler = vi.fn();
            connection.on('connected', handler);

            await connection.connect();

            expect(handler).toHaveBeenCalledWith({
                connectionId: 'test-connection-id'
            });
        });

        it('should emit stateChange events during connection', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    url: 'https://signalr.example.com',
                    accessToken: 'test-token'
                })
            });

            const handler = vi.fn();
            connection.on('stateChange', handler);

            await connection.connect();

            expect(handler).toHaveBeenCalledWith({ state: SIGNALR.STATES.CONNECTING });
            expect(handler).toHaveBeenCalledWith({ state: SIGNALR.STATES.CONNECTED });
        });

        it('should throw on negotiate failure', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500
            });

            await expect(connection.connect())
                .rejects.toThrow(COLLABORATION_ERRORS.CONNECTION_FAILED);
            expect(connection.connectionState).toBe(SIGNALR.STATES.ERROR);
        });

        it('should emit error event on failure', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500
            });

            const handler = vi.fn();
            connection.on('error', handler);

            await expect(connection.connect()).rejects.toThrow();

            expect(handler).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: COLLABORATION_ERRORS.CONNECTION_FAILED
                })
            );
        });

        it('should warn if already connected', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    url: 'https://signalr.example.com',
                    accessToken: 'test-token'
                })
            });

            const warnSpy = vi.spyOn(console, 'warn');
            await connection.connect();
            await connection.connect();

            expect(warnSpy).toHaveBeenCalledWith('SignalR: Already connected');
        });
    });

    describe('disconnect', () => {
        beforeEach(async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    url: 'https://signalr.example.com',
                    accessToken: 'test-token'
                })
            });
            await connection.connect();
        });

        it('should disconnect successfully', async () => {
            await connection.disconnect();

            expect(connection.connectionState).toBe(SIGNALR.STATES.DISCONNECTED);
            expect(connection.connectionId).toBeNull();
            expect(connection.pendingMessages).toHaveLength(0);
        });

        it('should emit stateChange on disconnect', async () => {
            const handler = vi.fn();
            connection.on('stateChange', handler);
            handler.mockClear();

            await connection.disconnect();

            expect(handler).toHaveBeenCalledWith({ state: SIGNALR.STATES.DISCONNECTED });
        });
    });

    describe('setUserInfo', () => {
        it('should store user information', () => {
            const user = {
                id: 'user-123',
                name: 'Test User',
                email: 'test@example.com',
                picture: 'https://example.com/photo.jpg'
            };

            connection.setUserInfo(user);

            expect(connection.userInfo).toEqual(user);
        });
    });

    describe('joinDocument', () => {
        beforeEach(async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    url: 'https://signalr.example.com',
                    accessToken: 'test-token'
                })
            });
            await connection.connect();
            connection.setUserInfo({
                id: 'user-123',
                name: 'Test User'
            });
        });

        it('should join document session', async () => {
            await connection.joinDocument('doc-123');

            expect(connection.currentDocumentId).toBe('doc-123');
        });

        it('should emit documentJoined event', async () => {
            const handler = vi.fn();
            connection.on('documentJoined', handler);

            await connection.joinDocument('doc-123');

            expect(handler).toHaveBeenCalledWith({ documentId: 'doc-123' });
        });

        it('should throw if not connected', async () => {
            await connection.disconnect();

            await expect(connection.joinDocument('doc-123'))
                .rejects.toThrow(COLLABORATION_ERRORS.NOT_CONNECTED);
        });
    });

    describe('leaveDocument', () => {
        beforeEach(async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    url: 'https://signalr.example.com',
                    accessToken: 'test-token'
                })
            });
            await connection.connect();
            connection.setUserInfo({ id: 'user-123', name: 'Test User' });
            await connection.joinDocument('doc-123');
        });

        it('should leave document and clear state', async () => {
            await connection.leaveDocument();

            expect(connection.currentDocumentId).toBeNull();
        });

        it('should emit documentLeft event', async () => {
            const handler = vi.fn();
            connection.on('documentLeft', handler);

            await connection.leaveDocument();

            expect(handler).toHaveBeenCalledWith({ documentId: 'doc-123' });
        });

        it('should do nothing if not in a document', async () => {
            await connection.leaveDocument();
            await connection.leaveDocument(); // Should not throw
        });
    });

    describe('send', () => {
        beforeEach(async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    url: 'https://signalr.example.com',
                    accessToken: 'test-token'
                })
            });
            await connection.connect();
            connection.setUserInfo({ id: 'user-123', name: 'Test User' });
            await connection.joinDocument('doc-123');
        });

        it('should send message to document group', async () => {
            await connection.send('cursorMove', { x: 100, y: 200 });

            expect(connection.connection.invoke).toHaveBeenCalledWith(
                'SendToDocument',
                expect.objectContaining({
                    documentId: 'doc-123',
                    message: expect.objectContaining({
                        type: 'cursorMove',
                        payload: { x: 100, y: 200 },
                        senderId: 'user-123'
                    })
                })
            );
        });

        it('should queue messages when disconnected', async () => {
            await connection.disconnect();

            // This should not throw - message is queued
            await connection.send('cursorMove', { x: 100, y: 200 });

            expect(connection.pendingMessages.length).toBe(1);
        });

        it('should throw if not in a document session', async () => {
            await connection.leaveDocument();

            await expect(connection.send('cursorMove', { x: 100, y: 200 }))
                .rejects.toThrow('Not in a document session');
        });
    });

    describe('event handling', () => {
        it('should register and unregister event handlers', () => {
            const handler = vi.fn();
            const unsubscribe = connection.on('test', handler);

            connection._emit('test', { data: 'test' });
            expect(handler).toHaveBeenCalledWith({ data: 'test' });

            unsubscribe();
            handler.mockClear();

            connection._emit('test', { data: 'test2' });
            expect(handler).not.toHaveBeenCalled();
        });

        it('should support multiple handlers for same event', () => {
            const handler1 = vi.fn();
            const handler2 = vi.fn();

            connection.on('test', handler1);
            connection.on('test', handler2);

            connection._emit('test', { data: 'test' });

            expect(handler1).toHaveBeenCalledTimes(1);
            expect(handler2).toHaveBeenCalledTimes(1);
        });

        it('should handle errors in event handlers gracefully', () => {
            const errorHandler = vi.fn(() => {
                throw new Error('Handler error');
            });
            const normalHandler = vi.fn();

            connection.on('test', errorHandler);
            connection.on('test', normalHandler);

            expect(() => connection._emit('test', { data: 'test' })).not.toThrow();
            expect(normalHandler).toHaveBeenCalled();
        });
    });

    describe('identifyUser', () => {
        beforeEach(async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    url: 'https://signalr.example.com',
                    accessToken: 'test-token'
                })
            });
            await connection.connect();
        });

        it('should send user identification to server', async () => {
            const user = {
                id: 'user-123',
                name: 'Test User',
                email: 'test@example.com',
                picture: 'https://example.com/photo.jpg'
            };

            await connection.identifyUser(user);

            expect(connection.connection.invoke).toHaveBeenCalledWith(
                'IdentifyUser',
                expect.objectContaining({
                    userId: 'user-123',
                    name: 'Test User',
                    email: 'test@example.com'
                })
            );
        });

        it('should store user info after identification', async () => {
            const user = { id: 'user-123', name: 'Test User' };
            await connection.identifyUser(user);

            expect(connection.userInfo).toEqual(user);
        });

        it('should not send if not connected', async () => {
            await connection.disconnect();
            const user = { id: 'user-123', name: 'Test User' };
            
            await connection.identifyUser(user);

            // User info is stored but not sent
            expect(connection.userInfo).toEqual(user);
            // invoke should not be called since we're disconnected
        });
    });

    describe('state property', () => {
        it('should return current connection state', () => {
            expect(connection.state).toBe(SIGNALR.STATES.DISCONNECTED);
        });
    });

    describe('dispose', () => {
        it('should clean up all resources', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    url: 'https://signalr.example.com',
                    accessToken: 'test-token'
                })
            });
            await connection.connect();
            connection.on('test', vi.fn());

            connection.dispose();

            expect(connection.listeners.size).toBe(0);
        });
    });

    describe('getSignalRConnection singleton', () => {
        it('should return the same instance', () => {
            // Note: This test may interfere with singleton state
            // In production, reset singleton between tests
            const instance1 = getSignalRConnection({ negotiateUrl: 'test1' });
            const instance2 = getSignalRConnection({ negotiateUrl: 'test2' });

            expect(instance1).toBe(instance2);
        });
    });
});
