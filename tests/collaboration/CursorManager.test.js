/**
 * Tests for CursorManager
 * Tests the actual implementation API
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CursorManager } from '../../src/core/collaboration/cursor/CursorManager.js';
import { MESSAGE_TYPES, CURSOR_CONFIG } from '../../src/core/collaboration/constants/index.js';

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
        _emit: (event, data) => {
            if (listeners.has(event)) {
                listeners.get(event).forEach(cb => cb(data));
            }
        },
        _listeners: listeners
    };
};

// Mock presence manager
const createMockPresenceManager = () => {
    const listeners = new Map();
    
    return {
        on: vi.fn((event, callback) => {
            if (!listeners.has(event)) {
                listeners.set(event, []);
            }
            listeners.get(event).push(callback);
        }),
        off: vi.fn(),
        getUserColor: vi.fn().mockReturnValue('#FF0000'),
        getUser: vi.fn().mockReturnValue({ id: 'user-1', name: 'Test User' }),
        _emit: (event, data) => {
            if (listeners.has(event)) {
                listeners.get(event).forEach(cb => cb(data));
            }
        }
    };
};

describe('CursorManager', () => {
    let cursorManager;
    let mockConnection;
    let mockPresenceManager;

    beforeEach(() => {
        vi.useFakeTimers();
        mockConnection = createMockConnection();
        mockPresenceManager = createMockPresenceManager();
        cursorManager = new CursorManager(mockConnection, mockPresenceManager);
    });

    afterEach(() => {
        if (cursorManager && typeof cursorManager.dispose === 'function') {
            cursorManager.dispose();
        }
        vi.useRealTimers();
    });

    describe('initialization', () => {
        it('should store connection reference', () => {
            expect(cursorManager.connection).toBe(mockConnection);
        });

        it('should store presence manager reference', () => {
            expect(cursorManager.presenceManager).toBe(mockPresenceManager);
        });

        it('should setup connection handlers with message: prefix', () => {
            expect(mockConnection.on).toHaveBeenCalledWith(
                `message:${MESSAGE_TYPES.CURSOR_MOVE}`,
                expect.any(Function)
            );
        });

        it('should setup cursor hide handler', () => {
            expect(mockConnection.on).toHaveBeenCalledWith(
                `message:${MESSAGE_TYPES.CURSOR_HIDE}`,
                expect.any(Function)
            );
        });

        it('should initialize with empty remote cursors map', () => {
            expect(cursorManager.remoteCursors.size).toBe(0);
        });

        it('should start disabled', () => {
            expect(cursorManager.isEnabled).toBe(false);
        });
    });

    describe('enable/disable', () => {
        it('should enable cursor tracking', () => {
            cursorManager.enable();
            expect(cursorManager.isEnabled).toBe(true);
        });

        it('should disable cursor tracking', () => {
            cursorManager.enable();
            cursorManager.disable();
            expect(cursorManager.isEnabled).toBe(false);
        });

        it('should not enable twice', () => {
            cursorManager.enable();
            cursorManager.enable();
            expect(cursorManager.isEnabled).toBe(true);
        });
    });

    describe('setCanvasElement', () => {
        it('should store canvas element', () => {
            const canvas = document.createElement('div');
            cursorManager.setCanvasElement(canvas);
            expect(cursorManager.canvasElement).toBe(canvas);
        });
    });

    describe('remote cursor handling', () => {
        it('should store remote cursor data when message received', () => {
            // Trigger message handler with the format SignalRConnection uses
            mockConnection._emit(`message:${MESSAGE_TYPES.CURSOR_MOVE}`, {
                payload: {
                    x: 0.5,
                    y: 0.5
                },
                senderId: 'user-2',
                timestamp: Date.now()
            });

            expect(cursorManager.remoteCursors.has('user-2')).toBe(true);
        });

        it('should update existing cursor position', () => {
            mockConnection._emit(`message:${MESSAGE_TYPES.CURSOR_MOVE}`, {
                payload: { x: 0.3, y: 0.3 },
                senderId: 'user-2',
                timestamp: Date.now()
            });

            mockConnection._emit(`message:${MESSAGE_TYPES.CURSOR_MOVE}`, {
                payload: { x: 0.7, y: 0.7 },
                senderId: 'user-2',
                timestamp: Date.now()
            });

            const cursor = cursorManager.remoteCursors.get('user-2');
            expect(cursor.targetX).toBe(0.7);
            expect(cursor.targetY).toBe(0.7);
        });

        it('should hide cursor on hide message', () => {
            // First add a cursor
            mockConnection._emit(`message:${MESSAGE_TYPES.CURSOR_MOVE}`, {
                payload: { x: 0.5, y: 0.5 },
                senderId: 'user-2',
                timestamp: Date.now()
            });

            // Then hide it
            mockConnection._emit(`message:${MESSAGE_TYPES.CURSOR_HIDE}`, {
                payload: {},
                senderId: 'user-2',
                timestamp: Date.now()
            });

            // Cursor is hidden but still in map (not removed)
            const cursor = cursorManager.remoteCursors.get('user-2');
            expect(cursor.visible).toBe(false);
        });
    });

    describe('getRemoteCursors', () => {
        it('should return empty array when no cursors', () => {
            expect(cursorManager.getRemoteCursors()).toEqual([]);
        });

        it('should return array of cursor data', () => {
            mockConnection._emit(`message:${MESSAGE_TYPES.CURSOR_MOVE}`, {
                payload: { x: 0.5, y: 0.5 },
                senderId: 'user-2',
                timestamp: Date.now()
            });

            const cursors = cursorManager.getRemoteCursors();
            expect(cursors.length).toBe(1);
            expect(cursors[0].userId).toBe('user-2');
        });
    });

    describe('user left handling', () => {
        it('should remove cursor when user leaves', () => {
            // Add a cursor
            mockConnection._emit(`message:${MESSAGE_TYPES.CURSOR_MOVE}`, {
                payload: { x: 0.5, y: 0.5 },
                senderId: 'user-2',
                timestamp: Date.now()
            });

            // Simulate user leaving via presence manager event
            mockPresenceManager._emit('userLeft', { userId: 'user-2' });

            expect(cursorManager.remoteCursors.has('user-2')).toBe(false);
        });
    });

    describe('event emission', () => {
        it('should allow registering event listeners', () => {
            const listener = vi.fn();
            cursorManager.on('cursorUpdate', listener);
            
            cursorManager._emit('cursorUpdate', { userId: 'test', x: 0, y: 0 });
            
            expect(listener).toHaveBeenCalled();
        });

        it('should allow removing event listeners', () => {
            const listener = vi.fn();
            cursorManager.on('cursorUpdate', listener);
            cursorManager.off('cursorUpdate', listener);
            
            cursorManager._emit('cursorUpdate', { userId: 'test', x: 0, y: 0 });
            
            expect(listener).not.toHaveBeenCalled();
        });
    });

    describe('dispose', () => {
        it('should clear remote cursors', () => {
            mockConnection._emit(`message:${MESSAGE_TYPES.CURSOR_MOVE}`, {
                payload: { x: 0.5, y: 0.5 },
                senderId: 'user-2',
                timestamp: Date.now()
            });

            cursorManager.dispose();
            expect(cursorManager.remoteCursors.size).toBe(0);
        });

        it('should cleanup cursor elements', () => {
            cursorManager.dispose();
            expect(cursorManager.cursorElements.size).toBe(0);
        });

        it('should clear listeners', () => {
            cursorManager.dispose();
            expect(cursorManager.listeners.size).toBe(0);
        });
    });
});
