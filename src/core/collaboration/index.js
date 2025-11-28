/**
 * Collaboration Module
 * 
 * Real-time collaboration infrastructure for Story presentation editor.
 * Provides SignalR-based connection, presence tracking, cursor sharing,
 * and operational transform for conflict-free collaborative editing.
 * 
 * @module collaboration
 */

// Main service
export { CollaborationService, SessionState } from './CollaborationService.js';

// Connection
export { SignalRConnection } from './connection/index.js';

// Presence
export { PresenceManager } from './presence/index.js';

// Cursor
export { CursorManager } from './cursor/index.js';

// State Sync
export { StateSyncEngine, OperationType, Operation, VectorClock } from './sync/index.js';

// Constants
export {
    SIGNALR_CONFIG,
    PRESENCE_CONFIG,
    CURSOR_CONFIG,
    SYNC_CONFIG,
    MESSAGE_TYPES,
    COLLABORATION_ERRORS
} from './constants/index.js';
