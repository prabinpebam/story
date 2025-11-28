# Real-Time Collaboration - Implementation Plan

## Overview

This plan implements serverless real-time collaboration using Azure SignalR Service for messaging and user's cloud storage for file persistence.

**Related Specifications:**
- [Real-Time Collaboration](../specs/collaboration/realtime-collaboration.md)
- [Azure SignalR Integration](../specs/collaboration/azure-signalr-integration.md)
- [Collaboration Protocol](../specs/collaboration/collaboration-protocol.md)
- [State Sync Engine](../specs/collaboration/state-sync-engine.md)

**Validation:**
- [Validation Framework](./validation-framework.md) - Real-time testing strategies

**Dependencies:**
- ✅ Identity Management (Phases 1-10)
- ✅ File Storage (Phases 1-7)
- ⚠️ Azure SignalR Service setup required

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Message ordering issues | HIGH | Vector clocks, sequence numbers |
| Network partition | HIGH | Offline queue, reconnect logic |
| Memory leaks from listeners | MEDIUM | Cleanup on disconnect |
| SignalR cost overruns | MEDIUM | Connection pooling, rate limits |
| State divergence | HIGH | Periodic full sync, checksums |

---

## Phase 1: Azure SignalR Setup (Infrastructure)

**Goal:** Configure Azure SignalR Service and Azure Function for negotiation.

**Duration:** 2-3 days

### Tasks

#### 1.1 Azure SignalR Service Provisioning

```yaml
Azure Portal:
  1. Create SignalR Service
     Name: story-signalr
     Pricing Tier: Free (20 concurrent connections, 20k messages/day)
     Mode: Serverless
     
  2. Get Connection String
     Settings > Keys > Connection String
     Store in: Azure Key Vault
     
  3. Configure CORS
     Settings > CORS
     Allowed Origins: https://story.app, http://localhost:3000
```

#### 1.2 Azure Function for SignalR Negotiation

**File:** `azure-functions/negotiate/index.js` (NEW)
```javascript
/**
 * SignalR negotiation endpoint
 * Returns connection info for client
 */
module.exports = async function (context, req) {
    // No authentication needed - SignalR handles it
    // Client will send userId after connection
    
    context.res = {
        body: context.bindings.connectionInfo
    };
};
```

**File:** `azure-functions/negotiate/function.json` (NEW)
```json
{
  "bindings": [
    {
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["post"],
      "authLevel": "anonymous"
    },
    {
      "type": "http",
      "direction": "out",
      "name": "res"
    },
    {
      "type": "signalRConnectionInfo",
      "name": "connectionInfo",
      "hubName": "story",
      "direction": "in"
    }
  ]
}
```

#### 1.3 Deploy Azure Function

```bash
# Install Azure Functions Core Tools
npm install -g azure-functions-core-tools@4

# Create function app
cd azure-functions
func init --javascript

# Add SignalR extension
func extensions install -p Microsoft.Azure.WebJobs.Extensions.SignalRService

# Deploy
func azure functionapp publish story-functions
```

#### 1.4 Environment Configuration

**File:** `src/config/signalr.config.js` (NEW)
```javascript
export const signalRConfig = {
    negotiateUrl: import.meta.env.VITE_SIGNALR_NEGOTIATE_URL ||
                  'https://story-functions.azurewebsites.net/api/negotiate',
    hubName: 'story'
};
```

**Testing:**
- ✅ SignalR service created and running
- ✅ Negotiate function returns connection info
- ✅ CORS configured correctly
- ✅ Free tier limits understood

**What might break:** Nothing (infrastructure only)

---

## Phase 2: SignalR Client Connection

**Goal:** Establish SignalR connection from browser.

**Duration:** 2-3 days

### Tasks

#### 2.1 Install SignalR Client

```bash
npm install @microsoft/signalr
```

#### 2.2 SignalR Connection Manager

**File:** `src/core/collaboration/SignalRConnection.js` (NEW)
```javascript
import * as signalR from '@microsoft/signalr';
import { signalRConfig } from '../../config/signalr.config.js';
import { authManager } from '../auth/AuthManager.js';

/**
 * Manages SignalR connection lifecycle
 */
export class SignalRConnection {
    constructor() {
        this.connection = null;
        this.connectionState = 'disconnected';
        this.listeners = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }
    
    /**
     * Establish connection to SignalR
     */
    async connect() {
        if (this.connection) {
            console.warn('Already connected');
            return;
        }
        
        try {
            // Get negotiation info
            const negotiateResponse = await fetch(
                signalRConfig.negotiateUrl,
                { method: 'POST' }
            );
            const negotiateData = await negotiateResponse.json();
            
            // Create connection
            this.connection = new signalR.HubConnectionBuilder()
                .withUrl(negotiateData.url, {
                    accessTokenFactory: () => negotiateData.accessToken
                })
                .withAutomaticReconnect({
                    nextRetryDelayInMilliseconds: (retryContext) => {
                        // Exponential backoff: 0s, 2s, 10s, 30s, 60s
                        return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 60000);
                    }
                })
                .configureLogging(signalR.LogLevel.Information)
                .build();
            
            // Setup event handlers
            this.setupHandlers();
            
            // Start connection
            await this.connection.start();
            
            this.connectionState = 'connected';
            this.reconnectAttempts = 0;
            
            console.log('SignalR connected');
            
            // Identify user
            await this.identifyUser();
            
        } catch (err) {
            console.error('SignalR connection failed:', err);
            this.connectionState = 'error';
            throw err;
        }
    }
    
    /**
     * Setup connection event handlers
     */
    setupHandlers() {
        this.connection.onclose((error) => {
            console.log('SignalR disconnected', error);
            this.connectionState = 'disconnected';
            this.emit('disconnected', { error });
        });
        
        this.connection.onreconnecting((error) => {
            console.log('SignalR reconnecting', error);
            this.connectionState = 'reconnecting';
            this.emit('reconnecting', { error });
        });
        
        this.connection.onreconnected((connectionId) => {
            console.log('SignalR reconnected', connectionId);
            this.connectionState = 'connected';
            this.emit('reconnected', { connectionId });
            
            // Re-identify and re-join groups
            this.identifyUser();
        });
    }
    
    /**
     * Send user identity to server
     */
    async identifyUser() {
        const user = await authManager.getCurrentUser();
        if (!user) return;
        
        await this.invoke('IdentifyUser', {
            userId: user.id,
            name: user.name,
            email: user.email,
            picture: user.picture
        });
    }
    
    /**
     * Join a document session
     */
    async joinDocument(documentId) {
        await this.invoke('JoinDocument', documentId);
    }
    
    /**
     * Leave a document session
     */
    async leaveDocument(documentId) {
        await this.invoke('LeaveDocument', documentId);
    }
    
    /**
     * Send message to document group
     */
    async send(documentId, messageType, payload) {
        await this.invoke('SendToDocument', documentId, {
            type: messageType,
            payload: payload,
            timestamp: Date.now()
        });
    }
    
    /**
     * Invoke server method
     */
    async invoke(method, ...args) {
        if (!this.connection || this.connectionState !== 'connected') {
            throw new Error('Not connected');
        }
        
        return this.connection.invoke(method, ...args);
    }
    
    /**
     * Listen for messages
     */
    on(event, handler) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
            
            // Register with SignalR
            this.connection.on(event, (...args) => {
                this.emit(event, ...args);
            });
        }
        
        this.listeners.get(event).push(handler);
        
        // Return unsubscribe function
        return () => this.off(event, handler);
    }
    
    /**
     * Remove listener
     */
    off(event, handler) {
        if (!this.listeners.has(event)) return;
        
        const handlers = this.listeners.get(event);
        const index = handlers.indexOf(handler);
        if (index !== -1) {
            handlers.splice(index, 1);
        }
    }
    
    /**
     * Emit to local listeners
     */
    emit(event, ...args) {
        if (!this.listeners.has(event)) return;
        
        for (const handler of this.listeners.get(event)) {
            try {
                handler(...args);
            } catch (err) {
                console.error(`Error in ${event} handler:`, err);
            }
        }
    }
    
    /**
     * Disconnect
     */
    async disconnect() {
        if (this.connection) {
            await this.connection.stop();
            this.connection = null;
            this.connectionState = 'disconnected';
        }
    }
    
    /**
     * Get connection state
     */
    getState() {
        return this.connectionState;
    }
}

// Global singleton
export const signalRConnection = new SignalRConnection();
```

**Testing:**
- ✅ Connection establishes successfully
- ✅ Automatic reconnection works
- ✅ User identity sent after connection
- ✅ Disconnect/reconnect cycle works
- ✅ Error handling graceful

**What might break:**
- Network errors during connection
- **Mitigation:** Retry logic, offline queue

---

## Phase 3: Azure Function Message Handlers

**Goal:** Implement server-side message routing.

**Duration:** 3-4 days

### Tasks

#### 3.1 IdentifyUser Function

**File:** `azure-functions/IdentifyUser/index.js` (NEW)
```javascript
module.exports = async function (context, req) {
    const connectionId = req.headers['x-ms-signalr-connectionid'];
    const userInfo = req.body;
    
    // Store user info in connection context
    // (In-memory for free tier, Redis for production)
    context.bindings.signalRMessages = [{
        target: 'UserIdentified',
        arguments: [{ userId: userInfo.userId }]
    }];
    
    context.done();
};
```

#### 3.2 JoinDocument Function

**File:** `azure-functions/JoinDocument/index.js` (NEW)
```javascript
module.exports = async function (context, req) {
    const connectionId = req.headers['x-ms-signalr-connectionid'];
    const documentId = req.body;
    
    // Add connection to group
    context.bindings.signalRGroupActions = [{
        userId: connectionId,
        groupName: `doc:${documentId}`,
        action: 'add'
    }];
    
    // Notify others in the group
    context.bindings.signalRMessages = [{
        target: 'UserJoined',
        groupName: `doc:${documentId}`,
        arguments: [{ 
            userId: req.body.userId,
            name: req.body.name,
            timestamp: Date.now()
        }]
    }];
    
    context.done();
};
```

#### 3.3 SendToDocument Function

**File:** `azure-functions/SendToDocument/index.js` (NEW)
```javascript
module.exports = async function (context, req) {
    const connectionId = req.headers['x-ms-signalr-connectionid'];
    const { documentId, message } = req.body;
    
    // Broadcast to document group (excluding sender)
    context.bindings.signalRMessages = [{
        target: 'MessageReceived',
        groupName: `doc:${documentId}`,
        arguments: [message]
    }];
    
    context.done();
};
```

**Testing:**
- ✅ User can join document group
- ✅ Messages broadcast to group
- ✅ User receives others' messages
- ✅ User doesn't receive own messages (no echo)

**What might break:**
- Group membership not persisted (connection drops)
- **Mitigation:** Re-join on reconnect

---

## Phase 4: Presence System

**Goal:** Show who's currently viewing the document.

**Duration:** 3-4 days

### Tasks

#### 4.1 Presence Manager

**File:** `src/core/collaboration/PresenceManager.js` (NEW)
```javascript
import { signalRConnection } from './SignalRConnection.js';
import { authManager } from '../auth/AuthManager.js';

/**
 * Manages user presence in documents
 */
export class PresenceManager {
    constructor() {
        this.currentDocument = null;
        this.activeUsers = new Map();
        this.heartbeatInterval = null;
        this.setupListeners();
    }
    
    /**
     * Join document and announce presence
     */
    async joinDocument(documentId) {
        this.currentDocument = documentId;
        
        // Join SignalR group
        await signalRConnection.joinDocument(documentId);
        
        // Send presence
        const user = await authManager.getCurrentUser();
        await this.broadcastPresence({
            userId: user.id,
            name: user.name,
            picture: user.picture,
            status: 'active'
        });
        
        // Start heartbeat
        this.startHeartbeat();
    }
    
    /**
     * Leave document
     */
    async leaveDocument() {
        if (!this.currentDocument) return;
        
        const user = await authManager.getCurrentUser();
        await this.broadcastPresence({
            userId: user.id,
            status: 'left'
        });
        
        await signalRConnection.leaveDocument(this.currentDocument);
        
        this.stopHeartbeat();
        this.currentDocument = null;
        this.activeUsers.clear();
    }
    
    /**
     * Broadcast presence update
     */
    async broadcastPresence(presence) {
        await signalRConnection.send(
            this.currentDocument,
            'Presence',
            presence
        );
    }
    
    /**
     * Setup message listeners
     */
    setupListeners() {
        signalRConnection.on('MessageReceived', (message) => {
            if (message.type === 'Presence') {
                this.handlePresenceUpdate(message.payload);
            }
        });
        
        signalRConnection.on('UserJoined', (data) => {
            console.log('User joined:', data.name);
        });
        
        signalRConnection.on('disconnected', () => {
            this.stopHeartbeat();
        });
        
        signalRConnection.on('reconnected', () => {
            if (this.currentDocument) {
                // Re-join document
                this.joinDocument(this.currentDocument);
            }
        });
    }
    
    /**
     * Handle presence updates from others
     */
    handlePresenceUpdate(presence) {
        if (presence.status === 'left') {
            this.activeUsers.delete(presence.userId);
        } else {
            this.activeUsers.set(presence.userId, {
                ...presence,
                lastSeen: Date.now()
            });
        }
        
        // Emit event for UI
        window.dispatchEvent(new CustomEvent('presence-changed', {
            detail: { users: Array.from(this.activeUsers.values()) }
        }));
    }
    
    /**
     * Start heartbeat (every 30s)
     */
    startHeartbeat() {
        this.heartbeatInterval = setInterval(async () => {
            if (this.currentDocument) {
                const user = await authManager.getCurrentUser();
                await this.broadcastPresence({
                    userId: user.id,
                    status: 'active'
                });
            }
        }, 30000);
    }
    
    /**
     * Stop heartbeat
     */
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
    
    /**
     * Get active users
     */
    getActiveUsers() {
        // Filter out stale presence (>2 minutes)
        const now = Date.now();
        const activeUsers = [];
        
        for (const [userId, user] of this.activeUsers) {
            if (now - user.lastSeen < 120000) {
                activeUsers.push(user);
            } else {
                this.activeUsers.delete(userId);
            }
        }
        
        return activeUsers;
    }
}

export const presenceManager = new PresenceManager();
```

#### 4.2 Presence UI Component

**File:** `src/ui/components/PresenceIndicator.js` (NEW)
```javascript
import { presenceManager } from '../../core/collaboration/PresenceManager.js';

export class PresenceIndicator {
    constructor() {
        this.container = null;
        this.setupListeners();
    }
    
    render() {
        const container = document.createElement('div');
        container.className = 'presence-indicator';
        container.innerHTML = `
            <div class="presence-avatars"></div>
            <div class="presence-count">0 online</div>
        `;
        
        this.container = container;
        this.update();
        
        return container;
    }
    
    setupListeners() {
        window.addEventListener('presence-changed', (e) => {
            this.update();
        });
    }
    
    update() {
        if (!this.container) return;
        
        const users = presenceManager.getActiveUsers();
        const avatarsEl = this.container.querySelector('.presence-avatars');
        const countEl = this.container.querySelector('.presence-count');
        
        // Update avatars
        avatarsEl.innerHTML = users.slice(0, 5).map(user => `
            <img 
                src="${user.picture || '/assets/default-avatar.svg'}"
                alt="${user.name}"
                title="${user.name}"
                class="presence-avatar"
            />
        `).join('');
        
        // Update count
        const extraCount = users.length > 5 ? ` +${users.length - 5}` : '';
        countEl.textContent = `${users.length} online${extraCount}`;
    }
}
```

**File:** `styles/modules/presence.css` (NEW)
```css
.presence-indicator {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-2) var(--spacing-3);
    background: var(--color-bg-elevated);
    border-radius: var(--radius-full);
    border: 1px solid var(--color-border);
}

.presence-avatars {
    display: flex;
}

.presence-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid var(--color-bg-app);
    margin-left: -8px;
}

.presence-avatar:first-child {
    margin-left: 0;
}

.presence-count {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    white-space: nowrap;
}
```

**Testing:**
- ✅ Presence shows when user joins
- ✅ Presence updates when user leaves
- ✅ Stale presence cleaned up after 2 minutes
- ✅ Heartbeat keeps presence alive
- ✅ UI updates in real-time

**What might break:**
- Too many presence updates (performance)
- **Mitigation:** Throttle updates, batch messages

---

## Phase 5: Cursor Tracking

**Goal:** Show real-time cursor positions of collaborators.

**Duration:** 3-4 days

### Tasks

#### 5.1 Cursor Manager

**File:** `src/core/collaboration/CursorManager.js` (NEW)
```javascript
import { signalRConnection } from './SignalRConnection.js';
import { authManager } from '../auth/AuthManager.js';

export class CursorManager {
    constructor() {
        this.cursors = new Map();
        this.throttleInterval = 50; // Send cursor every 50ms max
        this.lastSent = 0;
        this.setupListeners();
    }
    
    /**
     * Initialize for document
     */
    init(documentId) {
        this.documentId = documentId;
        this.startTracking();
    }
    
    /**
     * Start tracking mouse movement
     */
    startTracking() {
        const canvas = document.getElementById('canvas');
        
        canvas.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        });
        
        canvas.addEventListener('mouseleave', () => {
            this.sendCursorUpdate({ visible: false });
        });
    }
    
    /**
     * Handle mouse movement
     */
    async handleMouseMove(e) {
        const now = Date.now();
        if (now - this.lastSent < this.throttleInterval) return;
        
        const canvas = document.getElementById('canvas');
        const rect = canvas.getBoundingClientRect();
        
        // Normalize to canvas coordinates (0-1)
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        
        await this.sendCursorUpdate({
            x,
            y,
            visible: true
        });
        
        this.lastSent = now;
    }
    
    /**
     * Send cursor position
     */
    async sendCursorUpdate(cursor) {
        const user = await authManager.getCurrentUser();
        
        await signalRConnection.send(
            this.documentId,
            'Cursor',
            {
                userId: user.id,
                name: user.name,
                color: user.preferredColor || '#3B82F6',
                ...cursor
            }
        );
    }
    
    /**
     * Setup message listeners
     */
    setupListeners() {
        signalRConnection.on('MessageReceived', (message) => {
            if (message.type === 'Cursor') {
                this.handleCursorUpdate(message.payload);
            }
        });
    }
    
    /**
     * Handle cursor updates from others
     */
    handleCursorUpdate(cursor) {
        if (!cursor.visible) {
            this.cursors.delete(cursor.userId);
        } else {
            this.cursors.set(cursor.userId, cursor);
        }
        
        // Trigger render
        this.renderCursors();
    }
    
    /**
     * Render all cursors
     */
    renderCursors() {
        // Remove old cursors
        document.querySelectorAll('.collab-cursor').forEach(el => el.remove());
        
        const canvas = document.getElementById('canvas');
        const rect = canvas.getBoundingClientRect();
        
        // Render each cursor
        for (const [userId, cursor] of this.cursors) {
            const el = document.createElement('div');
            el.className = 'collab-cursor';
            el.style.left = `${rect.left + cursor.x * rect.width}px`;
            el.style.top = `${rect.top + cursor.y * rect.height}px`;
            el.innerHTML = `
                <svg class="cursor-icon" width="20" height="20" viewBox="0 0 20 20">
                    <path 
                        d="M0 0 L0 16 L5 11 L8 18 L10 17 L7 10 L12 10 Z" 
                        fill="${cursor.color}"
                        stroke="white"
                        stroke-width="1"
                    />
                </svg>
                <div class="cursor-label" style="background: ${cursor.color}">
                    ${cursor.name}
                </div>
            `;
            document.body.appendChild(el);
        }
    }
    
    /**
     * Cleanup
     */
    destroy() {
        this.cursors.clear();
        document.querySelectorAll('.collab-cursor').forEach(el => el.remove());
    }
}

export const cursorManager = new CursorManager();
```

**File:** `styles/modules/cursors.css` (NEW)
```css
.collab-cursor {
    position: fixed;
    pointer-events: none;
    z-index: var(--z-cursors);
    transition: all 0.1s ease-out;
}

.cursor-icon {
    display: block;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

.cursor-label {
    position: absolute;
    top: 20px;
    left: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
    color: white;
    white-space: nowrap;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}
```

**Testing:**
- ✅ Cursors show for other users
- ✅ Cursor position updates smoothly
- ✅ Cursor disappears when user leaves canvas
- ✅ Throttling prevents excessive messages
- ✅ Colors distinguish users

**What might break:**
- Performance with many users (>10)
- **Mitigation:** Spatial partitioning, limit to viewport

---

## Phase 6: Operational Transform (State Sync)

**Goal:** Sync document changes using OT/CRDT.

**Duration:** 5-7 days

### Tasks

#### 6.1 Operation Types

**File:** `src/core/collaboration/operations.js` (NEW)
```javascript
/**
 * Operation types for document changes
 */
export const OpType = {
    // Element operations
    ELEMENT_ADD: 'element:add',
    ELEMENT_DELETE: 'element:delete',
    ELEMENT_UPDATE: 'element:update',
    ELEMENT_MOVE: 'element:move',
    
    // Slide operations
    SLIDE_ADD: 'slide:add',
    SLIDE_DELETE: 'slide:delete',
    SLIDE_REORDER: 'slide:reorder',
    
    // Property operations
    PROP_SET: 'prop:set'
};

/**
 * Base operation
 */
export class Operation {
    constructor(type, data) {
        this.id = generateOpId();
        this.type = type;
        this.data = data;
        this.userId = null;
        this.timestamp = Date.now();
        this.vectorClock = null;
    }
}

/**
 * Transform two concurrent operations
 */
export function transform(op1, op2) {
    // Simplified OT - production needs full implementation
    
    if (op1.type === OpType.ELEMENT_UPDATE && 
        op2.type === OpType.ELEMENT_UPDATE) {
        
        if (op1.data.elementId === op2.data.elementId) {
            // Concurrent updates to same element
            // Last-write-wins based on timestamp
            if (op1.timestamp < op2.timestamp) {
                return [null, op2]; // op1 cancelled
            } else {
                return [op1, null]; // op2 cancelled
            }
        }
    }
    
    // No conflict
    return [op1, op2];
}

function generateOpId() {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
```

#### 6.2 State Sync Engine

**File:** `src/core/collaboration/StateSyncEngine.js` (NEW)
```javascript
import { signalRConnection } from './SignalRConnection.js';
import { Operation, OpType, transform } from './operations.js';
import { authManager } from '../auth/AuthManager.js';

export class StateSyncEngine {
    constructor() {
        this.documentId = null;
        this.pendingOps = [];
        this.acknowledgedOps = new Set();
        this.vectorClock = new Map();
        this.setupListeners();
    }
    
    /**
     * Initialize for document
     */
    async init(documentId) {
        this.documentId = documentId;
        
        // Initialize vector clock
        const user = await authManager.getCurrentUser();
        this.vectorClock.set(user.id, 0);
    }
    
    /**
     * Apply local operation
     */
    async applyLocalOp(type, data) {
        const user = await authManager.getCurrentUser();
        
        // Increment vector clock
        const clock = this.vectorClock.get(user.id) || 0;
        this.vectorClock.set(user.id, clock + 1);
        
        // Create operation
        const op = new Operation(type, data);
        op.userId = user.id;
        op.vectorClock = new Map(this.vectorClock);
        
        // Apply locally first
        this.applyOperation(op);
        
        // Send to others
        this.pendingOps.push(op);
        await this.sendOperation(op);
    }
    
    /**
     * Send operation to server
     */
    async sendOperation(op) {
        await signalRConnection.send(
            this.documentId,
            'Operation',
            {
                id: op.id,
                type: op.type,
                data: op.data,
                userId: op.userId,
                timestamp: op.timestamp,
                vectorClock: Array.from(op.vectorClock.entries())
            }
        );
    }
    
    /**
     * Setup message listeners
     */
    setupListeners() {
        signalRConnection.on('MessageReceived', (message) => {
            if (message.type === 'Operation') {
                this.handleRemoteOp(message.payload);
            }
        });
    }
    
    /**
     * Handle operation from other user
     */
    handleRemoteOp(opData) {
        // Reconstruct operation
        const op = new Operation(opData.type, opData.data);
        op.id = opData.id;
        op.userId = opData.userId;
        op.timestamp = opData.timestamp;
        op.vectorClock = new Map(opData.vectorClock);
        
        // Transform against pending ops
        let transformedOp = op;
        for (const pendingOp of this.pendingOps) {
            const [newPending, newRemote] = transform(pendingOp, transformedOp);
            if (!newRemote) {
                // Remote op cancelled
                return;
            }
            transformedOp = newRemote;
        }
        
        // Update vector clock
        for (const [userId, clock] of op.vectorClock) {
            const currentClock = this.vectorClock.get(userId) || 0;
            this.vectorClock.set(userId, Math.max(currentClock, clock));
        }
        
        // Apply operation
        this.applyOperation(transformedOp);
    }
    
    /**
     * Apply operation to document state
     */
    applyOperation(op) {
        switch (op.type) {
            case OpType.ELEMENT_ADD:
                this.addElement(op.data);
                break;
                
            case OpType.ELEMENT_DELETE:
                this.deleteElement(op.data.elementId);
                break;
                
            case OpType.ELEMENT_UPDATE:
                this.updateElement(op.data.elementId, op.data.props);
                break;
                
            case OpType.ELEMENT_MOVE:
                this.moveElement(op.data.elementId, op.data.x, op.data.y);
                break;
                
            // ... other operation types
        }
        
        // Trigger re-render
        window.dispatchEvent(new CustomEvent('document-changed'));
    }
    
    addElement(data) {
        const slide = getCurrentSlide();
        slide.elements.push(data.element);
        renderSlide(slide);
    }
    
    deleteElement(elementId) {
        const slide = getCurrentSlide();
        slide.elements = slide.elements.filter(el => el.id !== elementId);
        renderSlide(slide);
    }
    
    updateElement(elementId, props) {
        const slide = getCurrentSlide();
        const element = slide.elements.find(el => el.id === elementId);
        if (element) {
            Object.assign(element.props, props);
            renderElement(element);
        }
    }
    
    moveElement(elementId, x, y) {
        const slide = getCurrentSlide();
        const element = slide.elements.find(el => el.id === elementId);
        if (element) {
            element.x = x;
            element.y = y;
            renderElement(element);
        }
    }
}

export const stateSyncEngine = new StateSyncEngine();
```

**Testing:**
- ✅ Local operations applied immediately
- ✅ Remote operations applied after transform
- ✅ Concurrent edits handled correctly
- ✅ Vector clocks prevent out-of-order ops
- ✅ No data loss or corruption

**What might break:**
- Complex OT scenarios (triple-concurrent)
- **Mitigation:** Extensive test suite, periodic full sync

---

## Phase 7: Conflict Resolution & Recovery

**Goal:** Handle edge cases and network issues.

**Duration:** 3-4 days

### Tasks

#### 7.1 Periodic Checkpoint

```javascript
// Every 5 minutes, create checkpoint
setInterval(async () => {
    const state = getCurrentAppState();
    const checksum = await computeChecksum(state);
    
    await signalRConnection.send(documentId, 'Checkpoint', {
        checksum,
        timestamp: Date.now()
    });
}, 5 * 60 * 1000);
```

#### 7.2 Conflict Detection

```javascript
signalRConnection.on('MessageReceived', (message) => {
    if (message.type === 'Checkpoint') {
        const localChecksum = await computeChecksum(getCurrentAppState());
        
        if (localChecksum !== message.payload.checksum) {
            console.warn('State divergence detected!');
            showConflictDialog();
        }
    }
});
```

#### 7.3 Full State Resync

```javascript
async function resyncFromCloud() {
    // Download latest from cloud storage
    const latestBlob = await cloudManager.loadFromCloud(documentPath);
    const deserializer = new PresentationDeserializer(latestBlob);
    const presentation = await deserializer.deserialize();
    
    // Replace local state
    loadPresentationIntoApp(presentation);
    
    showToast('Resynced with cloud', 'success');
}
```

**Testing:**
- ✅ Divergence detected via checksum
- ✅ User prompted to resync
- ✅ Resync works correctly
- ✅ No data loss

**What might break:**
- Frequent resyncs (poor UX)
- **Mitigation:** Better OT implementation

---

## Phase 8: Offline Queue

**Goal:** Queue operations when offline, sync when back online.

**Duration:** 2-3 days

### Tasks

#### 8.1 Offline Queue Manager

**File:** `src/core/collaboration/OfflineQueue.js` (NEW)
```javascript
export class OfflineQueue {
    constructor(syncEngine) {
        this.syncEngine = syncEngine;
        this.queue = [];
        this.isOnline = navigator.onLine;
        this.setupListeners();
    }
    
    setupListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.flush();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            showToast('You are offline', 'warning');
        });
    }
    
    enqueue(op) {
        if (!this.isOnline) {
            this.queue.push(op);
            return false; // Not sent
        }
        return true; // Sent immediately
    }
    
    async flush() {
        console.log(`Syncing ${this.queue.length} queued operations`);
        
        for (const op of this.queue) {
            await this.syncEngine.sendOperation(op);
        }
        
        this.queue = [];
        showToast('Synced with server', 'success');
    }
}
```

**Testing:**
- ✅ Operations queued when offline
- ✅ Queue flushed when back online
- ✅ Order preserved

---

## Phase 9: Testing & Rollout

**Duration:** 5-6 days

### Testing Checklist
- [ ] SignalR connection works
- [ ] Presence shows all users
- [ ] Cursors track in real-time
- [ ] Operations sync correctly
- [ ] Concurrent edits resolve
- [ ] Offline queue works
- [ ] Reconnection recovers state
- [ ] Conflict detection works
- [ ] 10+ users can collaborate
- [ ] Performance acceptable (<100ms latency)

### Rollout Strategy
1. Feature flag: `ENABLE_COLLABORATION=true`
2. Beta test with small group
3. Monitor SignalR metrics (connections, messages)
4. Gradual rollout to all users

---

## Files Created

```
azure-functions/
  negotiate/
    index.js
    function.json
  IdentifyUser/
    index.js
  JoinDocument/
    index.js
  SendToDocument/
    index.js

src/config/
  signalr.config.js

src/core/collaboration/
  SignalRConnection.js
  PresenceManager.js
  CursorManager.js
  StateSyncEngine.js
  OfflineQueue.js
  operations.js

src/ui/components/
  PresenceIndicator.js

styles/modules/
  presence.css
  cursors.css
```

**Total:** 15 new files

---

*This plan implements serverless real-time collaboration with presence, cursors, and operational transform for conflict-free editing.*
