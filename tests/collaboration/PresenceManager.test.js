/**
 * Tests for PresenceManager
 * Tests the actual implementation API
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PresenceManager } from '../../src/core/collaboration/presence/PresenceManager.js';
import { MESSAGE_TYPES, PRESENCE_CONFIG } from '../../src/core/collaboration/constants/index.js';

// Mock connection that stores callbacks for event triggering
const createMockConnection = () => {
    const listeners = new Map();
    
    return {
        isConnected: true,
        on: vi.fn((event, callback) => {
            if (!listeners.has(event)) {
                listeners.set(event, []);
            }
            listeners.get(event).push(callback);
        }),
        off: vi.fn((event, callback) => {
            if (listeners.has(event)) {
                const callbacks = listeners.get(event);
                const index = callbacks.indexOf(callback);
                if (index > -1) {
                    callbacks.splice(index, 1);
                }
            }
        }),
        send: vi.fn().mockResolvedValue(undefined),
        invoke: vi.fn().mockResolvedValue({ participants: [] }),
        _emit: (event, data) => {
            if (listeners.has(event)) {
                listeners.get(event).forEach(cb => cb(data));
            }
        },
        _listeners: listeners
    };
};

describe('PresenceManager', () => {
    let presenceManager;
    let mockConnection;

    beforeEach(() => {
        vi.useFakeTimers();
        mockConnection = createMockConnection();
        presenceManager = new PresenceManager(mockConnection);
    });

    afterEach(() => {
        if (presenceManager && typeof presenceManager.dispose === 'function') {
            presenceManager.dispose();
        }
        vi.useRealTimers();
    });

    describe('initialization', () => {
        it('should store connection reference', () => {
            expect(presenceManager.connection).toBe(mockConnection);
        });

        it('should setup connection handlers with message: prefix', () => {
            expect(mockConnection.on).toHaveBeenCalledWith(
                `message:${MESSAGE_TYPES.PRESENCE}`,
                expect.any(Function)
            );
        });

        it('should initialize with empty active users map', () => {
            expect(presenceManager.activeUsers.size).toBe(0);
        });

        it('should initialize with no current document', () => {
            expect(presenceManager.currentDocumentId).toBeNull();
        });
    });

    describe('join', () => {
        it('should set current document ID', async () => {
            await presenceManager.join('doc-1', { id: 'user-1', name: 'Test User' });
            expect(presenceManager.currentDocumentId).toBe('doc-1');
        });

        it('should store current user', async () => {
            await presenceManager.join('doc-1', { id: 'user-1', name: 'Test User' });
            expect(presenceManager.currentUser).toEqual({ id: 'user-1', name: 'Test User' });
        });

        it('should broadcast presence announcement', async () => {
            await presenceManager.join('doc-1', { id: 'user-1', name: 'Test User' });
            expect(mockConnection.send).toHaveBeenCalledWith(
                MESSAGE_TYPES.PRESENCE,
                expect.objectContaining({ userId: 'user-1' })
            );
        });

        it('should start heartbeat', async () => {
            await presenceManager.join('doc-1', { id: 'user-1', name: 'Test User' });
            mockConnection.send.mockClear();

            // Advance time to trigger heartbeat
            vi.advanceTimersByTime(PRESENCE_CONFIG.HEARTBEAT_INTERVAL_MS + 100);

            expect(mockConnection.send).toHaveBeenCalledWith(
                MESSAGE_TYPES.PRESENCE,
                expect.any(Object)
            );
        });
    });

    describe('leave', () => {
        beforeEach(async () => {
            await presenceManager.join('doc-1', { id: 'user-1', name: 'Test User' });
            mockConnection.send.mockClear();
        });

        it('should broadcast leave status', async () => {
            await presenceManager.leave();
            expect(mockConnection.send).toHaveBeenCalledWith(
                MESSAGE_TYPES.PRESENCE,
                expect.objectContaining({ status: 'left' })
            );
        });

        it('should clear current document', async () => {
            await presenceManager.leave();
            expect(presenceManager.currentDocumentId).toBeNull();
        });

        it('should stop heartbeat', async () => {
            await presenceManager.leave();
            mockConnection.send.mockClear();

            vi.advanceTimersByTime(PRESENCE_CONFIG.HEARTBEAT_INTERVAL_MS * 2);

            // No more presence messages should be sent
            expect(mockConnection.send).not.toHaveBeenCalled();
        });

        it('should clear active users', async () => {
            presenceManager.activeUsers.set('other-user', { id: 'other-user' });
            await presenceManager.leave();
            expect(presenceManager.activeUsers.size).toBe(0);
        });
    });

    describe('getActiveUsers', () => {
        it('should return empty array when no users', () => {
            expect(presenceManager.getActiveUsers()).toEqual([]);
        });

        it('should return array of active users', async () => {
            await presenceManager.join('doc-1', { id: 'user-1', name: 'Test' });
            
            // Simulate receiving another user's presence
            presenceManager.activeUsers.set('user-2', { 
                id: 'user-2', 
                name: 'Other User',
                joinedAt: Date.now()
            });

            const users = presenceManager.getActiveUsers();
            expect(users.length).toBe(1);
            expect(users[0].id).toBe('user-2');
        });
    });

    describe('getUser', () => {
        it('should return null for unknown user', () => {
            expect(presenceManager.getUser('unknown')).toBeNull();
        });

        it('should return user info for known user', async () => {
            await presenceManager.join('doc-1', { id: 'user-1', name: 'Test' });
            presenceManager.activeUsers.set('user-2', { id: 'user-2', name: 'Other' });

            const user = presenceManager.getUser('user-2');
            expect(user.name).toBe('Other');
        });
    });

    describe('getUserColor', () => {
        it('should assign color from palette', async () => {
            await presenceManager.join('doc-1', { id: 'user-1', name: 'Test' });
            
            const color = presenceManager.getUserColor('user-1');
            expect(color).toBeDefined();
            expect(typeof color).toBe('string');
        });

        it('should return consistent color for same user', async () => {
            await presenceManager.join('doc-1', { id: 'user-1', name: 'Test' });
            
            const color1 = presenceManager.getUserColor('user-1');
            const color2 = presenceManager.getUserColor('user-1');
            expect(color1).toBe(color2);
        });
    });

    describe('event emission', () => {
        it('should allow registering event listeners', () => {
            const listener = vi.fn();
            presenceManager.on('userJoined', listener);
            
            // Emit internally
            presenceManager._emit('userJoined', { userId: 'test' });
            
            expect(listener).toHaveBeenCalledWith({ userId: 'test' });
        });

        it('should allow removing event listeners', () => {
            const listener = vi.fn();
            presenceManager.on('userJoined', listener);
            presenceManager.off('userJoined', listener);
            
            presenceManager._emit('userJoined', { userId: 'test' });
            
            expect(listener).not.toHaveBeenCalled();
        });
    });

    describe('dispose', () => {
        it('should clear active users', async () => {
            await presenceManager.join('doc-1', { id: 'user-1', name: 'Test' });
            presenceManager.activeUsers.set('user-2', { id: 'user-2' });
            
            presenceManager.dispose();
            
            expect(presenceManager.activeUsers.size).toBe(0);
        });

        it('should stop heartbeat on dispose', async () => {
            await presenceManager.join('doc-1', { id: 'user-1', name: 'Test' });
            presenceManager.dispose();
            mockConnection.send.mockClear();

            vi.advanceTimersByTime(PRESENCE_CONFIG.HEARTBEAT_INTERVAL_MS * 2);

            expect(mockConnection.send).not.toHaveBeenCalled();
        });

        it('should clear listeners', () => {
            presenceManager.on('test', vi.fn());
            presenceManager.dispose();
            expect(presenceManager.listeners.size).toBe(0);
        });
    });
});
