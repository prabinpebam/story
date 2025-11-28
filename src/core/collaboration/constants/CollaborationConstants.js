/**
 * CollaborationConstants
 * Configuration constants for real-time collaboration
 */

/**
 * SignalR Configuration
 */
export const SIGNALR = {
    // Default negotiate URL (should be overridden in environment)
    DEFAULT_NEGOTIATE_URL: 'https://story-functions.azurewebsites.net/api/negotiate',
    
    // Hub name for SignalR
    HUB_NAME: 'story',
    
    // Connection states
    STATES: {
        DISCONNECTED: 'disconnected',
        CONNECTING: 'connecting',
        CONNECTED: 'connected',
        RECONNECTING: 'reconnecting',
        ERROR: 'error'
    },
    
    // Reconnection settings
    RECONNECT: {
        MAX_ATTEMPTS: 5,
        INITIAL_DELAY_MS: 1000,
        MAX_DELAY_MS: 60000
    }
};

// Alias for consistent naming across modules
export const SIGNALR_CONFIG = {
    HUB_URL: SIGNALR.DEFAULT_NEGOTIATE_URL.replace('/negotiate', ''),
    ...SIGNALR
};

/**
 * Presence Configuration
 */
export const PRESENCE = {
    // Heartbeat interval in ms
    HEARTBEAT_INTERVAL_MS: 30000,
    
    // User considered inactive after this time without heartbeat
    INACTIVE_TIMEOUT_MS: 60000,
    
    // User considered disconnected after this time
    DISCONNECT_TIMEOUT_MS: 120000,
    
    // Status values
    STATUS: {
        ACTIVE: 'active',
        IDLE: 'idle',
        AWAY: 'away',
        LEFT: 'left'
    },
    
    // Idle detection threshold (no mouse/keyboard activity)
    IDLE_THRESHOLD_MS: 60000
};

// Alias for consistent naming
export const PRESENCE_CONFIG = PRESENCE;

/**
 * Cursor Configuration
 */
export const CURSOR = {
    // Throttle cursor updates (max frequency)
    THROTTLE_MS: 50,
    
    // Cursor trail smoothing
    SMOOTHING: 0.3,
    
    // Cursor colors (assigned to users)
    COLORS: [
        '#FF6B6B', // Red
        '#4ECDC4', // Teal
        '#45B7D1', // Blue
        '#96CEB4', // Green
        '#FFEAA7', // Yellow
        '#DDA0DD', // Plum
        '#98D8C8', // Mint
        '#F7DC6F', // Gold
        '#BB8FCE', // Purple
        '#85C1E9'  // Sky
    ],
    
    // Hide cursor after inactivity
    HIDE_AFTER_MS: 5000
};

// Alias for consistent naming
export const CURSOR_CONFIG = CURSOR;

/**
 * State Sync Configuration
 */
export const STATE_SYNC = {
    // Operation batching
    BATCH_INTERVAL_MS: 100,
    MAX_BATCH_SIZE: 50,
    
    // Vector clock
    CLOCK_DRIFT_TOLERANCE_MS: 5000,
    
    // Checksum interval for divergence detection
    CHECKSUM_INTERVAL_MS: 30000,
    
    // Full sync threshold (if too many ops pending)
    FULL_SYNC_THRESHOLD: 100,
    
    // Operation history limit
    MAX_HISTORY_SIZE: 1000,
    
    // Operation types
    OPERATION_TYPES: {
        INSERT: 'insert',
        UPDATE: 'update',
        DELETE: 'delete',
        MOVE: 'move',
        TRANSFORM: 'transform'
    }
};

// Alias for consistent naming
export const SYNC_CONFIG = STATE_SYNC;

/**
 * Message Types
 */
export const MESSAGE_TYPES = {
    // Presence messages
    PRESENCE: 'Presence',
    PRESENCE_REQUEST: 'PresenceRequest',
    
    // Cursor messages
    CURSOR_MOVE: 'CursorMove',
    CURSOR_HIDE: 'CursorHide',
    
    // Selection messages
    SELECTION_CHANGE: 'SelectionChange',
    
    // State sync messages
    OPERATION: 'Operation',
    OPERATION_ACK: 'OperationAck',
    SYNC_REQUEST: 'SyncRequest',
    SYNC_RESPONSE: 'SyncResponse',
    CHECKSUM: 'Checksum',
    
    // Document messages
    DOCUMENT_LOCK: 'DocumentLock',
    DOCUMENT_UNLOCK: 'DocumentUnlock'
};

/**
 * Error Types
 */
export const COLLABORATION_ERRORS = {
    CONNECTION_FAILED: 'Connection to collaboration server failed',
    NOT_CONNECTED: 'Not connected to collaboration server',
    JOIN_FAILED: 'Failed to join document session',
    SEND_FAILED: 'Failed to send message',
    SYNC_FAILED: 'State synchronization failed',
    DIVERGENCE_DETECTED: 'Document state diverged from server'
};

export default {
    SIGNALR,
    PRESENCE,
    CURSOR,
    STATE_SYNC,
    MESSAGE_TYPES,
    COLLABORATION_ERRORS
};
