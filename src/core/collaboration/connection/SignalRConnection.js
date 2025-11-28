/**
 * SignalRConnection
 * Manages SignalR connection lifecycle for real-time collaboration
 * 
 * Features:
 * - Automatic reconnection with exponential backoff
 * - User identification after connection
 * - Document group management
 * - Message routing and event handling
 */

import * as signalR from '@microsoft/signalr';
import { SIGNALR, COLLABORATION_ERRORS } from '../constants/CollaborationConstants.js';

export class SignalRConnection {
    /**
     * Create a SignalR connection manager
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        this.negotiateUrl = options.negotiateUrl || SIGNALR.DEFAULT_NEGOTIATE_URL;
        this.connection = null;
        this.connectionState = SIGNALR.STATES.DISCONNECTED;
        this.connectionId = null;
        this.listeners = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = SIGNALR.RECONNECT.MAX_ATTEMPTS;
        this.pendingMessages = [];
        this.currentDocumentId = null;
        this.userInfo = null;
    }

    /**
     * Get the current connection state
     * @returns {string}
     */
    get state() {
        return this.connectionState;
    }

    /**
     * Check if connected
     * @returns {boolean}
     */
    get isConnected() {
        return this.connectionState === SIGNALR.STATES.CONNECTED;
    }

    /**
     * Set user information for identification
     * @param {Object} user - User info (id, name, email, picture)
     */
    setUserInfo(user) {
        this.userInfo = user;
    }

    /**
     * Establish connection to SignalR service
     * @returns {Promise<void>}
     */
    async connect() {
        if (this.connection && this.isConnected) {
            console.warn('SignalR: Already connected');
            return;
        }

        this.connectionState = SIGNALR.STATES.CONNECTING;
        this._emit('stateChange', { state: this.connectionState });

        try {
            // Get negotiation info from Azure Function
            const negotiateData = await this._negotiate();

            // Create SignalR connection
            this.connection = new signalR.HubConnectionBuilder()
                .withUrl(negotiateData.url, {
                    accessTokenFactory: () => negotiateData.accessToken
                })
                .withAutomaticReconnect({
                    nextRetryDelayInMilliseconds: (retryContext) => {
                        // Exponential backoff
                        const delay = Math.min(
                            SIGNALR.RECONNECT.INITIAL_DELAY_MS * Math.pow(2, retryContext.previousRetryCount),
                            SIGNALR.RECONNECT.MAX_DELAY_MS
                        );
                        return delay;
                    }
                })
                .configureLogging(signalR.LogLevel.Information)
                .build();

            // Setup connection event handlers
            this._setupConnectionHandlers();

            // Start connection
            await this.connection.start();

            this.connectionState = SIGNALR.STATES.CONNECTED;
            this.connectionId = this.connection.connectionId;
            this.reconnectAttempts = 0;

            console.log('SignalR: Connected', this.connectionId);
            this._emit('connected', { connectionId: this.connectionId });
            this._emit('stateChange', { state: this.connectionState });

            // Identify user if info is set
            if (this.userInfo) {
                await this.identifyUser(this.userInfo);
            }

            // Flush pending messages
            await this._flushPendingMessages();

        } catch (error) {
            console.error('SignalR: Connection failed', error);
            this.connectionState = SIGNALR.STATES.ERROR;
            this._emit('error', { error: COLLABORATION_ERRORS.CONNECTION_FAILED, details: error });
            this._emit('stateChange', { state: this.connectionState });
            throw new Error(COLLABORATION_ERRORS.CONNECTION_FAILED);
        }
    }

    /**
     * Negotiate with Azure Function to get connection info
     * @returns {Promise<Object>}
     * @private
     */
    async _negotiate() {
        const response = await fetch(this.negotiateUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Negotiate failed: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Setup connection lifecycle handlers
     * @private
     */
    _setupConnectionHandlers() {
        this.connection.onclose((error) => {
            console.log('SignalR: Disconnected', error);
            this.connectionState = SIGNALR.STATES.DISCONNECTED;
            this._emit('disconnected', { error });
            this._emit('stateChange', { state: this.connectionState });
        });

        this.connection.onreconnecting((error) => {
            console.log('SignalR: Reconnecting...', error);
            this.connectionState = SIGNALR.STATES.RECONNECTING;
            this.reconnectAttempts++;
            this._emit('reconnecting', { error, attempt: this.reconnectAttempts });
            this._emit('stateChange', { state: this.connectionState });
        });

        this.connection.onreconnected((connectionId) => {
            console.log('SignalR: Reconnected', connectionId);
            this.connectionState = SIGNALR.STATES.CONNECTED;
            this.connectionId = connectionId;
            this.reconnectAttempts = 0;
            this._emit('reconnected', { connectionId });
            this._emit('stateChange', { state: this.connectionState });

            // Re-identify user and re-join document
            this._restoreSession();
        });

        // Register for incoming messages
        this.connection.on('MessageReceived', (message) => {
            this._handleMessage(message);
        });

        this.connection.on('UserJoined', (data) => {
            this._emit('userJoined', data);
        });

        this.connection.on('UserLeft', (data) => {
            this._emit('userLeft', data);
        });

        this.connection.on('UserIdentified', (data) => {
            this._emit('userIdentified', data);
        });
    }

    /**
     * Handle incoming message
     * @param {Object} message - Message object
     * @private
     */
    _handleMessage(message) {
        const { type, payload, senderId, timestamp } = message;
        
        // Don't emit our own messages back
        if (senderId === this.userInfo?.id) {
            return;
        }

        this._emit('message', { type, payload, senderId, timestamp });
        this._emit(`message:${type}`, { payload, senderId, timestamp });
    }

    /**
     * Restore session after reconnection
     * @private
     */
    async _restoreSession() {
        try {
            if (this.userInfo) {
                await this.identifyUser(this.userInfo);
            }
            if (this.currentDocumentId) {
                await this.joinDocument(this.currentDocumentId);
            }
        } catch (error) {
            console.error('SignalR: Failed to restore session', error);
        }
    }

    /**
     * Identify user to the server
     * @param {Object} user - User info
     * @returns {Promise<void>}
     */
    async identifyUser(user) {
        this.userInfo = user;
        
        if (!this.isConnected) {
            return;
        }

        await this._invoke('IdentifyUser', {
            userId: user.id,
            name: user.name,
            email: user.email,
            picture: user.picture
        });
    }

    /**
     * Join a document session
     * @param {string} documentId - Document ID
     * @returns {Promise<void>}
     */
    async joinDocument(documentId) {
        if (!this.isConnected) {
            throw new Error(COLLABORATION_ERRORS.NOT_CONNECTED);
        }

        try {
            await this._invoke('JoinDocument', {
                documentId,
                userId: this.userInfo?.id,
                name: this.userInfo?.name,
                picture: this.userInfo?.picture
            });
            
            this.currentDocumentId = documentId;
            this._emit('documentJoined', { documentId });
            
        } catch (error) {
            console.error('SignalR: Failed to join document', error);
            throw new Error(COLLABORATION_ERRORS.JOIN_FAILED);
        }
    }

    /**
     * Leave current document session
     * @returns {Promise<void>}
     */
    async leaveDocument() {
        if (!this.currentDocumentId) {
            return;
        }

        if (this.isConnected) {
            try {
                await this._invoke('LeaveDocument', {
                    documentId: this.currentDocumentId,
                    userId: this.userInfo?.id
                });
            } catch (error) {
                console.warn('SignalR: Failed to leave document gracefully', error);
            }
        }

        const documentId = this.currentDocumentId;
        this.currentDocumentId = null;
        this._emit('documentLeft', { documentId });
    }

    /**
     * Send a message to the current document group
     * @param {string} messageType - Message type
     * @param {Object} payload - Message payload
     * @returns {Promise<void>}
     */
    async send(messageType, payload) {
        const message = {
            type: messageType,
            payload,
            senderId: this.userInfo?.id,
            timestamp: Date.now()
        };

        if (!this.isConnected) {
            // Queue message for later
            this.pendingMessages.push({
                documentId: this.currentDocumentId,
                message
            });
            return;
        }

        if (!this.currentDocumentId) {
            throw new Error('Not in a document session');
        }

        try {
            await this._invoke('SendToDocument', {
                documentId: this.currentDocumentId,
                message
            });
        } catch (error) {
            console.error('SignalR: Failed to send message', error);
            throw new Error(COLLABORATION_ERRORS.SEND_FAILED);
        }
    }

    /**
     * Flush pending messages after reconnection
     * @private
     */
    async _flushPendingMessages() {
        while (this.pendingMessages.length > 0 && this.isConnected) {
            const { documentId, message } = this.pendingMessages.shift();
            
            if (documentId === this.currentDocumentId) {
                try {
                    await this._invoke('SendToDocument', { documentId, message });
                } catch (error) {
                    console.warn('SignalR: Failed to send queued message', error);
                }
            }
        }
    }

    /**
     * Invoke a server method
     * @param {string} method - Method name
     * @param {Object} args - Method arguments
     * @returns {Promise<any>}
     * @private
     */
    async _invoke(method, args) {
        if (!this.connection || !this.isConnected) {
            throw new Error(COLLABORATION_ERRORS.NOT_CONNECTED);
        }
        
        return this.connection.invoke(method, args);
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @returns {Function} Unsubscribe function
     */
    on(event, handler) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        
        this.listeners.get(event).add(handler);
        
        return () => this.off(event, handler);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     */
    off(event, handler) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(handler);
        }
    }

    /**
     * Emit an event to local listeners
     * @param {string} event - Event name
     * @param {Object} data - Event data
     * @private
     */
    _emit(event, data) {
        if (!this.listeners.has(event)) return;
        
        for (const handler of this.listeners.get(event)) {
            try {
                handler(data);
            } catch (error) {
                console.error(`SignalR: Error in ${event} handler`, error);
            }
        }
    }

    /**
     * Disconnect from SignalR
     * @returns {Promise<void>}
     */
    async disconnect() {
        if (this.currentDocumentId) {
            await this.leaveDocument();
        }

        if (this.connection) {
            await this.connection.stop();
            this.connection = null;
        }

        this.connectionState = SIGNALR.STATES.DISCONNECTED;
        this.connectionId = null;
        this.pendingMessages = [];
        
        this._emit('stateChange', { state: this.connectionState });
    }

    /**
     * Dispose of the connection
     */
    dispose() {
        this.disconnect();
        this.listeners.clear();
    }
}

// Singleton instance
let signalRConnectionInstance = null;

/**
 * Get the singleton SignalRConnection instance
 * @param {Object} options - Configuration options
 * @returns {SignalRConnection}
 */
export function getSignalRConnection(options = {}) {
    if (!signalRConnectionInstance) {
        signalRConnectionInstance = new SignalRConnection(options);
    }
    return signalRConnectionInstance;
}

export default SignalRConnection;
