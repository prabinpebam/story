/**
 * CollaborationService - Main service for real-time collaboration
 * 
 * Integrates SignalR connection, presence management, cursor tracking,
 * and state synchronization for collaborative editing.
 * 
 * @module CollaborationService
 */

import { SignalRConnection } from './connection/index.js';
import { PresenceManager } from './presence/index.js';
import { CursorManager } from './cursor/index.js';
import { StateSyncEngine, OperationType } from './sync/index.js';
import { 
    SIGNALR_CONFIG, 
    PRESENCE_CONFIG, 
    CURSOR_CONFIG,
    MESSAGE_TYPES,
    COLLABORATION_ERRORS 
} from './constants/index.js';

/**
 * Collaboration session states
 */
const SessionState = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    JOINING: 'joining',
    ACTIVE: 'active',
    RECONNECTING: 'reconnecting',
    ERROR: 'error'
};

/**
 * Main collaboration service
 */
export class CollaborationService {
    /**
     * Create a CollaborationService instance
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        this.options = options;
        this.hubUrl = options.hubUrl || SIGNALR_CONFIG.HUB_URL;
        
        // User info
        this.userId = options.userId;
        this.userInfo = options.userInfo || {};
        
        // Components
        this.connection = null;
        this.presenceManager = null;
        this.cursorManager = null;
        this.syncEngine = null;
        
        // State
        this.sessionState = SessionState.DISCONNECTED;
        this.currentDocumentId = null;
        this.isHost = false;
        
        // Event listeners
        this.listeners = new Map();
        
        // Bind methods
        this.handleConnectionStateChange = this.handleConnectionStateChange.bind(this);
        this.handleConnectionError = this.handleConnectionError.bind(this);
    }

    /**
     * Initialize the collaboration service
     * @param {string} userId - Current user ID
     * @param {Object} userInfo - User information (name, avatar, color)
     */
    async initialize(userId, userInfo) {
        if (this.connection) {
            await this.dispose();
        }
        
        this.userId = userId;
        this.userInfo = userInfo;
        
        // Create SignalR connection
        this.connection = new SignalRConnection({
            hubUrl: this.hubUrl,
            userId: userId,
            ...this.options.connectionOptions
        });
        
        // Setup connection event handlers
        this.connection.on('connectionStateChanged', this.handleConnectionStateChange);
        this.connection.on('error', this.handleConnectionError);
        
        // Create presence manager
        this.presenceManager = new PresenceManager({
            connection: this.connection,
            userId: userId,
            userInfo: userInfo
        });
        
        // Create cursor manager
        this.cursorManager = new CursorManager({
            connection: this.connection,
            userId: userId,
            userInfo: userInfo
        });
        
        // Create sync engine
        this.syncEngine = new StateSyncEngine({
            connection: this.connection,
            userId: userId
        });
        
        // Forward events from components
        this.setupEventForwarding();
        
        this.emit('initialized', { userId, userInfo });
    }

    /**
     * Connect to the collaboration server
     * @returns {Promise<boolean>} Connection success
     */
    async connect() {
        if (!this.connection) {
            throw new Error(COLLABORATION_ERRORS.NOT_INITIALIZED);
        }
        
        this.sessionState = SessionState.CONNECTING;
        this.emit('stateChanged', { state: this.sessionState });
        
        try {
            const success = await this.connection.connect();
            
            if (success) {
                this.sessionState = SessionState.CONNECTED;
            } else {
                this.sessionState = SessionState.ERROR;
            }
            
            this.emit('stateChanged', { state: this.sessionState });
            return success;
            
        } catch (error) {
            this.sessionState = SessionState.ERROR;
            this.emit('stateChanged', { state: this.sessionState, error });
            throw error;
        }
    }

    /**
     * Join a collaborative document session
     * @param {string} documentId - Document ID to join
     * @param {Object} initialState - Initial document state (for new documents)
     * @returns {Promise<Object>} Session info
     */
    async joinDocument(documentId, initialState = null) {
        if (!this.connection?.isConnected) {
            throw new Error(COLLABORATION_ERRORS.NOT_CONNECTED);
        }
        
        // Leave current document if any
        if (this.currentDocumentId) {
            await this.leaveDocument();
        }
        
        this.sessionState = SessionState.JOINING;
        this.emit('stateChanged', { state: this.sessionState, documentId });
        
        try {
            // Join the document room on the server
            const response = await this.connection.joinDocument(documentId);
            
            this.currentDocumentId = documentId;
            this.isHost = response.isHost || false;
            
            // Initialize sync engine with document state
            const documentState = response.state || initialState || { slides: [] };
            await this.syncEngine.initialize(documentId, documentState);
            
            // Join presence for this document
            await this.presenceManager.joinDocument(documentId);
            
            // Start cursor tracking
            this.cursorManager.startTracking(documentId);
            
            this.sessionState = SessionState.ACTIVE;
            this.emit('stateChanged', { state: this.sessionState, documentId });
            this.emit('documentJoined', {
                documentId,
                isHost: this.isHost,
                participants: response.participants || [],
                state: documentState
            });
            
            return {
                documentId,
                isHost: this.isHost,
                participants: response.participants || [],
                state: documentState
            };
            
        } catch (error) {
            this.sessionState = SessionState.ERROR;
            this.emit('stateChanged', { state: this.sessionState, error });
            throw error;
        }
    }

    /**
     * Leave the current document session
     */
    async leaveDocument() {
        if (!this.currentDocumentId) return;
        
        const documentId = this.currentDocumentId;
        
        try {
            // Stop cursor tracking
            this.cursorManager.stopTracking();
            
            // Leave presence
            await this.presenceManager.leaveDocument();
            
            // Leave document room
            if (this.connection?.isConnected) {
                await this.connection.leaveDocument(documentId);
            }
            
            // Cleanup sync engine
            this.syncEngine.dispose();
            
        } catch (error) {
            console.error('[CollaborationService] Error leaving document:', error);
        }
        
        this.currentDocumentId = null;
        this.isHost = false;
        
        this.sessionState = this.connection?.isConnected 
            ? SessionState.CONNECTED 
            : SessionState.DISCONNECTED;
            
        this.emit('stateChanged', { state: this.sessionState });
        this.emit('documentLeft', { documentId });
    }

    /**
     * Send a document operation
     * @param {Object} operationData - Operation data
     * @returns {Object} Created operation
     */
    sendOperation(operationData) {
        if (!this.currentDocumentId) {
            throw new Error(COLLABORATION_ERRORS.NO_ACTIVE_SESSION);
        }
        
        return this.syncEngine.createOperation(operationData);
    }

    /**
     * Update element position (convenience method)
     * @param {string} elementId - Element ID
     * @param {Object} position - New position { x, y, width, height, rotation }
     */
    updateElementPosition(elementId, position) {
        return this.sendOperation({
            type: OperationType.MOVE,
            targetId: elementId,
            targetType: 'element',
            value: position
        });
    }

    /**
     * Update element style (convenience method)
     * @param {string} elementId - Element ID
     * @param {Object} style - Style changes
     */
    updateElementStyle(elementId, style) {
        return this.sendOperation({
            type: OperationType.STYLE,
            targetId: elementId,
            targetType: 'element',
            value: style
        });
    }

    /**
     * Add an element to a slide
     * @param {string} slideId - Slide ID
     * @param {Object} element - Element data
     */
    addElement(slideId, element) {
        return this.sendOperation({
            type: OperationType.ADD_ELEMENT,
            targetId: slideId,
            targetType: 'slide',
            value: element
        });
    }

    /**
     * Delete an element
     * @param {string} slideId - Slide ID
     * @param {string} elementId - Element ID
     */
    deleteElement(slideId, elementId) {
        return this.sendOperation({
            type: OperationType.DELETE_ELEMENT,
            targetId: slideId,
            targetType: 'slide',
            value: { id: elementId }
        });
    }

    /**
     * Add a new slide
     * @param {Object} slide - Slide data
     * @param {number} index - Insert index (optional)
     */
    addSlide(slide, index = undefined) {
        return this.sendOperation({
            type: OperationType.ADD_SLIDE,
            targetType: 'presentation',
            value: { slide, index }
        });
    }

    /**
     * Delete a slide
     * @param {string} slideId - Slide ID
     */
    deleteSlide(slideId) {
        return this.sendOperation({
            type: OperationType.DELETE_SLIDE,
            targetId: slideId,
            targetType: 'slide'
        });
    }

    /**
     * Update cursor position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {Object} context - Additional context (slideId, etc.)
     */
    updateCursor(x, y, context = {}) {
        this.cursorManager.broadcastCursor(x, y, context);
    }

    /**
     * Set presence status
     * @param {string} status - Status ('active', 'idle', 'away')
     */
    setPresenceStatus(status) {
        this.presenceManager.setStatus(status);
    }

    /**
     * Get active users in current document
     * @returns {Array} Active users
     */
    getActiveUsers() {
        return this.presenceManager.getActiveUsers();
    }

    /**
     * Get current document state
     * @returns {Object} Document state
     */
    getDocumentState() {
        return this.syncEngine?.getState() || null;
    }

    /**
     * Check if there are unsynced changes
     * @returns {boolean} Has unsynced changes
     */
    hasUnsyncedChanges() {
        return this.syncEngine?.hasUnsyncedChanges() || false;
    }

    /**
     * Handle connection state changes
     * @param {Object} data - State change data
     */
    handleConnectionStateChange(data) {
        const { state, previousState } = data;
        
        if (state === 'connected' && previousState === 'reconnecting') {
            // Reconnected - rejoin document if we were in one
            if (this.currentDocumentId) {
                this.rejoinDocument();
            }
        } else if (state === 'reconnecting') {
            this.sessionState = SessionState.RECONNECTING;
            this.emit('stateChanged', { state: this.sessionState });
        } else if (state === 'disconnected') {
            this.sessionState = SessionState.DISCONNECTED;
            this.emit('stateChanged', { state: this.sessionState });
        }
        
        this.emit('connectionStateChanged', data);
    }

    /**
     * Handle connection errors
     * @param {Object} data - Error data
     */
    handleConnectionError(data) {
        this.emit('error', data);
    }

    /**
     * Rejoin document after reconnection
     */
    async rejoinDocument() {
        const documentId = this.currentDocumentId;
        const currentState = this.syncEngine?.getState();
        
        try {
            // Rejoin the document
            const response = await this.connection.joinDocument(documentId);
            
            // Rejoin presence
            await this.presenceManager.joinDocument(documentId);
            
            // Restart cursor tracking
            this.cursorManager.startTracking(documentId);
            
            // Request state sync if needed
            if (response.version !== this.syncEngine?.lastConfirmedVersion) {
                await this.syncEngine.requestStateSync();
            }
            
            this.sessionState = SessionState.ACTIVE;
            this.emit('stateChanged', { state: this.sessionState });
            this.emit('reconnected', { documentId });
            
        } catch (error) {
            console.error('[CollaborationService] Failed to rejoin document:', error);
            this.emit('error', { type: 'rejoinFailed', error });
        }
    }

    /**
     * Setup event forwarding from components
     */
    setupEventForwarding() {
        // Forward presence events
        this.presenceManager.on('userJoined', (data) => this.emit('userJoined', data));
        this.presenceManager.on('userLeft', (data) => this.emit('userLeft', data));
        this.presenceManager.on('presenceUpdate', (data) => this.emit('presenceUpdate', data));
        
        // Forward cursor events
        this.cursorManager.on('remoteCursor', (data) => this.emit('remoteCursor', data));
        this.cursorManager.on('cursorLeft', (data) => this.emit('cursorLeft', data));
        
        // Forward sync events
        this.syncEngine.on('remoteChange', (data) => this.emit('remoteChange', data));
        this.syncEngine.on('localChange', (data) => this.emit('localChange', data));
        this.syncEngine.on('stateSync', (data) => this.emit('stateSync', data));
        this.syncEngine.on('operationError', (data) => this.emit('operationError', data));
    }

    /**
     * Disconnect from the collaboration server
     */
    async disconnect() {
        if (this.currentDocumentId) {
            await this.leaveDocument();
        }
        
        if (this.connection) {
            await this.connection.disconnect();
        }
        
        this.sessionState = SessionState.DISCONNECTED;
        this.emit('stateChanged', { state: this.sessionState });
    }

    /**
     * Register an event listener
     * @param {string} event - Event name
     * @param {Function} callback - Event callback
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
    }

    /**
     * Remove an event listener
     * @param {string} event - Event name
     * @param {Function} callback - Event callback
     */
    off(event, callback) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.delete(callback);
        }
    }

    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            for (const callback of callbacks) {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[CollaborationService] Event handler error for ${event}:`, error);
                }
            }
        }
    }

    /**
     * Cleanup all resources
     */
    async dispose() {
        await this.disconnect();
        
        if (this.cursorManager) {
            this.cursorManager.dispose();
            this.cursorManager = null;
        }
        
        if (this.presenceManager) {
            this.presenceManager.dispose();
            this.presenceManager = null;
        }
        
        if (this.syncEngine) {
            this.syncEngine.dispose();
            this.syncEngine = null;
        }
        
        if (this.connection) {
            this.connection = null;
        }
        
        this.listeners.clear();
        
        this.emit('disposed', {});
    }
}

// Export session states
export { SessionState };
