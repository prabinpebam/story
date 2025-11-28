/**
 * PresenceManager
 * Manages user presence in collaborative document sessions
 * 
 * Features:
 * - Track active users in document
 * - Heartbeat for presence detection
 * - Idle/away status detection
 * - User color assignment
 */

import { PRESENCE, CURSOR, MESSAGE_TYPES } from '../constants/CollaborationConstants.js';

export class PresenceManager {
    /**
     * Create a presence manager
     * @param {SignalRConnection} connection - SignalR connection instance
     */
    constructor(connection) {
        this.connection = connection;
        this.currentDocumentId = null;
        this.currentUser = null;
        this.activeUsers = new Map();
        this.userColors = new Map();
        this.colorIndex = 0;
        
        this.heartbeatInterval = null;
        this.inactivityTimer = null;
        this.lastActivityTime = Date.now();
        this.currentStatus = PRESENCE.STATUS.ACTIVE;
        
        this.listeners = new Map();
        
        this._setupConnectionListeners();
        this._setupActivityListeners();
    }

    /**
     * Setup connection event listeners
     * @private
     */
    _setupConnectionListeners() {
        // Listen for presence messages
        this.connection.on(`message:${MESSAGE_TYPES.PRESENCE}`, (data) => {
            this._handlePresenceMessage(data);
        });

        // Listen for presence requests
        this.connection.on(`message:${MESSAGE_TYPES.PRESENCE_REQUEST}`, (data) => {
            this._handlePresenceRequest(data);
        });

        // Handle user joined
        this.connection.on('userJoined', (data) => {
            this._handleUserJoined(data);
        });

        // Handle user left
        this.connection.on('userLeft', (data) => {
            this._handleUserLeft(data);
        });

        // Handle reconnection
        this.connection.on('reconnected', () => {
            this._announcePresence();
        });
    }

    /**
     * Setup activity detection listeners
     * @private
     */
    _setupActivityListeners() {
        // Guard against non-browser environments and test environments
        if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
            return;
        }

        const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
        
        const handleActivity = () => {
            this.lastActivityTime = Date.now();
            
            if (this.currentStatus !== PRESENCE.STATUS.ACTIVE) {
                this.currentStatus = PRESENCE.STATUS.ACTIVE;
                this._announcePresence();
            }
            
            this._resetInactivityTimer();
        };

        activityEvents.forEach(event => {
            window.addEventListener(event, handleActivity, { passive: true });
        });

        // Handle visibility change - also guard for test environments
        if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.currentStatus = PRESENCE.STATUS.AWAY;
                    this._announcePresence();
                } else {
                    this.currentStatus = PRESENCE.STATUS.ACTIVE;
                    this.lastActivityTime = Date.now();
                    this._announcePresence();
                }
            });
        }
    }

    /**
     * Reset inactivity timer
     * @private
     */
    _resetInactivityTimer() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
        }

        this.inactivityTimer = setTimeout(() => {
            if (this.currentStatus === PRESENCE.STATUS.ACTIVE) {
                this.currentStatus = PRESENCE.STATUS.IDLE;
                this._announcePresence();
            }
        }, PRESENCE.IDLE_THRESHOLD_MS);
    }

    /**
     * Join a document and start presence tracking
     * @param {string} documentId - Document ID
     * @param {Object} user - Current user info
     */
    async join(documentId, user) {
        this.currentDocumentId = documentId;
        this.currentUser = user;
        this.currentStatus = PRESENCE.STATUS.ACTIVE;
        this.lastActivityTime = Date.now();

        // Assign color to self
        this._assignColor(user.id);

        // Announce presence
        await this._announcePresence();

        // Request presence from others
        await this._requestPresence();

        // Start heartbeat
        this._startHeartbeat();

        // Start inactivity detection
        this._resetInactivityTimer();
    }

    /**
     * Leave document and stop presence tracking
     */
    async leave() {
        if (!this.currentDocumentId) return;

        // Announce leaving
        try {
            await this.connection.send(MESSAGE_TYPES.PRESENCE, {
                userId: this.currentUser.id,
                status: PRESENCE.STATUS.LEFT
            });
        } catch (error) {
            console.warn('PresenceManager: Failed to announce leave', error);
        }

        // Stop heartbeat
        this._stopHeartbeat();

        // Clear state
        this.currentDocumentId = null;
        this.activeUsers.clear();
        this._emit('usersChanged', { users: [] });
    }

    /**
     * Get all active users
     * @returns {Array<Object>}
     */
    getActiveUsers() {
        return Array.from(this.activeUsers.values())
            .filter(u => u.status !== PRESENCE.STATUS.LEFT);
    }

    /**
     * Get user by ID
     * @param {string} userId - User ID
     * @returns {Object|null}
     */
    getUser(userId) {
        return this.activeUsers.get(userId) || null;
    }

    /**
     * Get color assigned to a user
     * @param {string} userId - User ID
     * @returns {string}
     */
    getUserColor(userId) {
        if (!this.userColors.has(userId)) {
            this._assignColor(userId);
        }
        return this.userColors.get(userId);
    }

    /**
     * Assign a color to a user
     * @param {string} userId - User ID
     * @private
     */
    _assignColor(userId) {
        if (this.userColors.has(userId)) return;
        
        const color = CURSOR.COLORS[this.colorIndex % CURSOR.COLORS.length];
        this.userColors.set(userId, color);
        this.colorIndex++;
    }

    /**
     * Announce current user's presence
     * @private
     */
    async _announcePresence() {
        if (!this.currentDocumentId || !this.currentUser) return;

        try {
            await this.connection.send(MESSAGE_TYPES.PRESENCE, {
                userId: this.currentUser.id,
                name: this.currentUser.name,
                email: this.currentUser.email,
                picture: this.currentUser.picture,
                status: this.currentStatus,
                color: this.getUserColor(this.currentUser.id),
                timestamp: Date.now()
            });
        } catch (error) {
            console.warn('PresenceManager: Failed to announce presence', error);
        }
    }

    /**
     * Request presence from other users
     * @private
     */
    async _requestPresence() {
        if (!this.currentDocumentId) return;

        try {
            await this.connection.send(MESSAGE_TYPES.PRESENCE_REQUEST, {
                userId: this.currentUser.id
            });
        } catch (error) {
            console.warn('PresenceManager: Failed to request presence', error);
        }
    }

    /**
     * Handle incoming presence message
     * @param {Object} data - Presence data
     * @private
     */
    _handlePresenceMessage(data) {
        const { payload, senderId } = data;
        
        if (senderId === this.currentUser?.id) return;

        const { userId, name, email, picture, status, color, timestamp } = payload;

        if (status === PRESENCE.STATUS.LEFT) {
            this.activeUsers.delete(userId);
        } else {
            // Assign color if not provided
            const userColor = color || this.getUserColor(userId);
            
            this.activeUsers.set(userId, {
                id: userId,
                name,
                email,
                picture,
                status,
                color: userColor,
                lastSeen: timestamp || Date.now()
            });
        }

        this._emit('presenceUpdate', { userId, status });
        this._emit('usersChanged', { users: this.getActiveUsers() });
    }

    /**
     * Handle presence request (respond with our presence)
     * @param {Object} data - Request data
     * @private
     */
    _handlePresenceRequest(data) {
        // Someone joined and wants to know who's here
        this._announcePresence();
    }

    /**
     * Handle user joined event
     * @param {Object} data - User data
     * @private
     */
    _handleUserJoined(data) {
        const { userId, name, picture } = data;
        
        if (userId === this.currentUser?.id) return;

        const color = this.getUserColor(userId);
        
        this.activeUsers.set(userId, {
            id: userId,
            name,
            picture,
            status: PRESENCE.STATUS.ACTIVE,
            color,
            lastSeen: Date.now()
        });

        this._emit('userJoined', { userId, name, color });
        this._emit('usersChanged', { users: this.getActiveUsers() });
    }

    /**
     * Handle user left event
     * @param {Object} data - User data
     * @private
     */
    _handleUserLeft(data) {
        const { userId } = data;
        
        const user = this.activeUsers.get(userId);
        this.activeUsers.delete(userId);

        if (user) {
            this._emit('userLeft', { userId, name: user.name });
            this._emit('usersChanged', { users: this.getActiveUsers() });
        }
    }

    /**
     * Start heartbeat for presence
     * @private
     */
    _startHeartbeat() {
        this._stopHeartbeat();

        this.heartbeatInterval = setInterval(() => {
            this._announcePresence();
            this._cleanupInactiveUsers();
        }, PRESENCE.HEARTBEAT_INTERVAL_MS);
    }

    /**
     * Stop heartbeat
     * @private
     */
    _stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * Clean up users who haven't sent heartbeat
     * @private
     */
    _cleanupInactiveUsers() {
        const now = Date.now();
        let changed = false;

        for (const [userId, user] of this.activeUsers.entries()) {
            const timeSinceLastSeen = now - user.lastSeen;
            
            if (timeSinceLastSeen > PRESENCE.DISCONNECT_TIMEOUT_MS) {
                this.activeUsers.delete(userId);
                changed = true;
                this._emit('userLeft', { userId, name: user.name, reason: 'timeout' });
            } else if (timeSinceLastSeen > PRESENCE.INACTIVE_TIMEOUT_MS) {
                if (user.status !== PRESENCE.STATUS.AWAY) {
                    user.status = PRESENCE.STATUS.AWAY;
                    changed = true;
                }
            }
        }

        if (changed) {
            this._emit('usersChanged', { users: this.getActiveUsers() });
        }
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
     * Emit an event
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
                console.error(`PresenceManager: Error in ${event} handler`, error);
            }
        }
    }

    /**
     * Dispose of the presence manager
     */
    dispose() {
        this._stopHeartbeat();
        
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
        }
        
        this.activeUsers.clear();
        this.userColors.clear();
        this.listeners.clear();
    }
}

export default PresenceManager;
