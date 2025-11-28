/**
 * Tests for Collaboration Constants
 */

import {
    SIGNALR,
    SIGNALR_CONFIG,
    PRESENCE,
    PRESENCE_CONFIG,
    CURSOR,
    CURSOR_CONFIG,
    STATE_SYNC,
    SYNC_CONFIG,
    MESSAGE_TYPES,
    COLLABORATION_ERRORS
} from '../../src/core/collaboration/constants/index.js';

describe('CollaborationConstants', () => {
    describe('SIGNALR', () => {
        it('should have default negotiate URL', () => {
            expect(SIGNALR.DEFAULT_NEGOTIATE_URL).toBeDefined();
            expect(SIGNALR.DEFAULT_NEGOTIATE_URL).toContain('negotiate');
        });

        it('should have hub name', () => {
            expect(SIGNALR.HUB_NAME).toBe('story');
        });

        it('should have connection states', () => {
            expect(SIGNALR.STATES.DISCONNECTED).toBe('disconnected');
            expect(SIGNALR.STATES.CONNECTING).toBe('connecting');
            expect(SIGNALR.STATES.CONNECTED).toBe('connected');
            expect(SIGNALR.STATES.RECONNECTING).toBe('reconnecting');
            expect(SIGNALR.STATES.ERROR).toBe('error');
        });

        it('should have reconnection settings', () => {
            expect(SIGNALR.RECONNECT.MAX_ATTEMPTS).toBeGreaterThan(0);
            expect(SIGNALR.RECONNECT.INITIAL_DELAY_MS).toBeGreaterThan(0);
            expect(SIGNALR.RECONNECT.MAX_DELAY_MS).toBeGreaterThan(SIGNALR.RECONNECT.INITIAL_DELAY_MS);
        });

        it('should have SIGNALR_CONFIG alias', () => {
            expect(SIGNALR_CONFIG).toBeDefined();
            expect(SIGNALR_CONFIG.HUB_URL).toBeDefined();
        });
    });

    describe('PRESENCE', () => {
        it('should have heartbeat interval', () => {
            expect(PRESENCE.HEARTBEAT_INTERVAL_MS).toBeGreaterThan(0);
        });

        it('should have timeout configurations', () => {
            expect(PRESENCE.INACTIVE_TIMEOUT_MS).toBeGreaterThan(PRESENCE.HEARTBEAT_INTERVAL_MS);
            expect(PRESENCE.DISCONNECT_TIMEOUT_MS).toBeGreaterThan(PRESENCE.INACTIVE_TIMEOUT_MS);
        });

        it('should have status values', () => {
            expect(PRESENCE.STATUS.ACTIVE).toBe('active');
            expect(PRESENCE.STATUS.IDLE).toBe('idle');
            expect(PRESENCE.STATUS.AWAY).toBe('away');
            expect(PRESENCE.STATUS.LEFT).toBe('left');
        });

        it('should have PRESENCE_CONFIG alias', () => {
            expect(PRESENCE_CONFIG).toBe(PRESENCE);
        });
    });

    describe('CURSOR', () => {
        it('should have throttle setting', () => {
            expect(CURSOR.THROTTLE_MS).toBeGreaterThan(0);
            expect(CURSOR.THROTTLE_MS).toBeLessThanOrEqual(100);
        });

        it('should have smoothing value between 0 and 1', () => {
            expect(CURSOR.SMOOTHING).toBeGreaterThan(0);
            expect(CURSOR.SMOOTHING).toBeLessThanOrEqual(1);
        });

        it('should have cursor colors array', () => {
            expect(Array.isArray(CURSOR.COLORS)).toBe(true);
            expect(CURSOR.COLORS.length).toBeGreaterThan(0);
            CURSOR.COLORS.forEach(color => {
                expect(color).toMatch(/^#[0-9A-F]{6}$/i);
            });
        });

        it('should have hide after setting', () => {
            expect(CURSOR.HIDE_AFTER_MS).toBeGreaterThan(0);
        });

        it('should have CURSOR_CONFIG alias', () => {
            expect(CURSOR_CONFIG).toBe(CURSOR);
        });
    });

    describe('STATE_SYNC', () => {
        it('should have batch settings', () => {
            expect(STATE_SYNC.BATCH_INTERVAL_MS).toBeGreaterThan(0);
            expect(STATE_SYNC.MAX_BATCH_SIZE).toBeGreaterThan(0);
        });

        it('should have history size limit', () => {
            expect(STATE_SYNC.MAX_HISTORY_SIZE).toBeGreaterThan(0);
        });

        it('should have operation types', () => {
            expect(STATE_SYNC.OPERATION_TYPES.INSERT).toBe('insert');
            expect(STATE_SYNC.OPERATION_TYPES.UPDATE).toBe('update');
            expect(STATE_SYNC.OPERATION_TYPES.DELETE).toBe('delete');
            expect(STATE_SYNC.OPERATION_TYPES.MOVE).toBe('move');
        });

        it('should have SYNC_CONFIG alias', () => {
            expect(SYNC_CONFIG).toBe(STATE_SYNC);
        });
    });

    describe('MESSAGE_TYPES', () => {
        it('should have presence message types', () => {
            expect(MESSAGE_TYPES.PRESENCE).toBeDefined();
            expect(MESSAGE_TYPES.PRESENCE_REQUEST).toBeDefined();
        });

        it('should have cursor message types', () => {
            expect(MESSAGE_TYPES.CURSOR_MOVE).toBeDefined();
            expect(MESSAGE_TYPES.CURSOR_HIDE).toBeDefined();
        });

        it('should have sync message types', () => {
            expect(MESSAGE_TYPES.OPERATION).toBeDefined();
            expect(MESSAGE_TYPES.OPERATION_ACK).toBeDefined();
            expect(MESSAGE_TYPES.SYNC_REQUEST).toBeDefined();
            expect(MESSAGE_TYPES.SYNC_RESPONSE).toBeDefined();
        });

        it('should have document message types', () => {
            expect(MESSAGE_TYPES.DOCUMENT_LOCK).toBeDefined();
            expect(MESSAGE_TYPES.DOCUMENT_UNLOCK).toBeDefined();
        });
    });

    describe('COLLABORATION_ERRORS', () => {
        it('should have connection error messages', () => {
            expect(COLLABORATION_ERRORS.CONNECTION_FAILED).toBeDefined();
            expect(COLLABORATION_ERRORS.NOT_CONNECTED).toBeDefined();
        });

        it('should have session error messages', () => {
            expect(COLLABORATION_ERRORS.JOIN_FAILED).toBeDefined();
            expect(COLLABORATION_ERRORS.SEND_FAILED).toBeDefined();
        });

        it('should have sync error messages', () => {
            expect(COLLABORATION_ERRORS.SYNC_FAILED).toBeDefined();
            expect(COLLABORATION_ERRORS.DIVERGENCE_DETECTED).toBeDefined();
        });
    });
});
