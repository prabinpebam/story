# Azure SignalR Service Integration - Specification

## Overview

This specification defines how Story uses **Azure SignalR Service** in **serverless mode** for real-time collaboration features. This approach eliminates the need to maintain WebSocket servers while providing instant messaging for:

- Live cursor positions
- User presence (who's online)
- Real-time selection indicators
- Collaborative notifications

**Key Benefits:**
- **No server maintenance** - Fully managed by Azure
- **Serverless** - Pay only for messages sent
- **Scalable** - Handles thousands of concurrent users
- **Portable** - Can be replaced with other providers (Pusher, Ably, etc.)

**Related Specifications:**
- [Real-Time Collaboration](./realtime-collaboration.md) - Overall architecture
- [Cloud Storage Abstraction](./cloud-storage-abstraction.md) - File storage
- [Collaboration Protocol](./collaboration-protocol.md) - Message types
- [Authentication](./authentication.md) - User identity

---

## Table of Contents

1. [Architecture](#1-architecture)
2. [Azure Resources](#2-azure-resources)
3. [SignalR Client](#3-signalr-client)
4. [Azure Functions](#4-azure-functions)
5. [Message Types](#5-message-types)
6. [Scaling & Costs](#6-scaling--costs)
7. [Provider Abstraction](#7-provider-abstraction)

---

## 1. Architecture

### 1.1 Serverless SignalR Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      STORY APPLICATION                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Browser Client                                          │   │
│  │                                                          │   │
│  │  • SignalR JavaScript Client                            │   │
│  │  • Presence Manager                                      │   │
│  │  • Cursor Renderer                                       │   │
│  └───────────────────────────┬─────────────────────────────┘   │
│                              │                                  │
└──────────────────────────────│──────────────────────────────────┘
                               │
           ┌───────────────────┼───────────────────┐
           │                   │                   │
           ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Azure SignalR  │  │ Azure Functions │  │  OneDrive /     │
│  Service        │  │ (Serverless)    │  │  Google Drive   │
│                 │  │                 │  │                 │
│  • WebSocket    │  │  • negotiate    │  │  • File storage │
│    connections  │  │  • broadcast    │  │  • Versions     │
│  • Message fan- │  │  • join-group   │  │  • Sharing      │
│    out          │  │  • leave-group  │  │                 │
│                 │  │                 │  │                 │
│  Serverless     │  │  Consumption    │  │  User's own     │
│  Mode           │  │  Plan           │  │  storage        │
└─────────────────┘  └─────────────────┘  └─────────────────┘
        │                    │
        │    Connection      │
        │    negotiation     │
        └────────────────────┘
```

### 1.2 Message Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│  User A moves cursor                                                  │
│                                                                       │
│  1. Client A sends cursor position to Azure Function                  │
│     POST /api/broadcast                                               │
│     { documentId, userId, cursor: {x, y, slideId} }                  │
│                                                                       │
│  2. Azure Function broadcasts via SignalR output binding              │
│     → SignalR fans out to all users in document group                │
│                                                                       │
│  3. Clients B, C, D receive cursor update via WebSocket              │
│     connection.on('cursorUpdate', (data) => render(data))            │
│                                                                       │
│  Latency: ~50-100ms typical                                          │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Azure Resources

### 2.1 Required Resources

| Resource | Purpose | Pricing Tier |
|----------|---------|--------------|
| **Azure SignalR Service** | Real-time messaging | Free: 20 connections, 20K msgs/day |
| **Azure Functions** | Negotiate + broadcast | Consumption: 1M free/month |
| **Azure AD App** | Authentication | Free |

### 2.2 SignalR Service Configuration

```json
// Azure Portal or ARM template
{
    "name": "story-signalr",
    "type": "Microsoft.SignalRService/signalR",
    "apiVersion": "2022-02-01",
    "location": "eastus",
    "sku": {
        "name": "Free_F1",    // or "Standard_S1" for production
        "capacity": 1
    },
    "properties": {
        "features": [
            {
                "flag": "ServiceMode",
                "value": "Serverless"   // Critical: serverless mode
            },
            {
                "flag": "EnableConnectivityLogs",
                "value": "true"
            }
        ],
        "cors": {
            "allowedOrigins": [
                "https://story.app",
                "http://localhost:3000"
            ]
        }
    }
}
```

### 2.3 Functions App Configuration

```json
// host.json
{
    "version": "2.0",
    "extensions": {
        "signalR": {
            "hubName": "storyHub"
        }
    }
}

// local.settings.json (development)
{
    "IsEncrypted": false,
    "Values": {
        "AzureWebJobsStorage": "UseDevelopmentStorage=true",
        "FUNCTIONS_WORKER_RUNTIME": "node",
        "AzureSignalRConnectionString": "Endpoint=https://story-signalr.service.signalr.net;AccessKey=...;Version=1.0;"
    }
}
```

---

## 3. SignalR Client

### 3.1 Client Implementation

```typescript
import * as signalR from '@microsoft/signalr';

interface SignalRConfig {
    negotiateUrl: string;
    hubName: string;
}

class SignalRClient {
    private connection: signalR.HubConnection | null = null;
    private config: SignalRConfig;
    private documentId: string | null = null;
    private userId: string;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    
    constructor(config: SignalRConfig, userId: string) {
        this.config = config;
        this.userId = userId;
    }
    
    // ─────────────────────────────────────────────────────────
    // Connection Management
    // ─────────────────────────────────────────────────────────
    
    async connect(): Promise<void> {
        // Get connection info from Azure Function
        const negotiateResponse = await fetch(this.config.negotiateUrl, {
            method: 'POST',
            headers: {
                'x-ms-signalr-userid': this.userId,
                'Authorization': `Bearer ${await this.getAccessToken()}`
            }
        });
        
        const { url, accessToken } = await negotiateResponse.json();
        
        // Create SignalR connection
        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(url, {
                accessTokenFactory: () => accessToken
            })
            .withAutomaticReconnect({
                nextRetryDelayInMilliseconds: (retryContext) => {
                    if (retryContext.previousRetryCount >= this.maxReconnectAttempts) {
                        return null; // Stop retrying
                    }
                    // Exponential backoff: 0, 2, 4, 8, 16 seconds
                    return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
                }
            })
            .configureLogging(signalR.LogLevel.Information)
            .build();
        
        // Set up event handlers
        this.setupEventHandlers();
        
        // Start connection
        await this.connection.start();
        console.log('SignalR connected');
    }
    
    async disconnect(): Promise<void> {
        if (this.documentId) {
            await this.leaveDocument();
        }
        await this.connection?.stop();
        this.connection = null;
    }
    
    private setupEventHandlers(): void {
        if (!this.connection) return;
        
        // Connection state changes
        this.connection.onreconnecting((error) => {
            console.log('SignalR reconnecting...', error);
            this.emit('connectionStateChanged', 'reconnecting');
        });
        
        this.connection.onreconnected((connectionId) => {
            console.log('SignalR reconnected:', connectionId);
            this.emit('connectionStateChanged', 'connected');
            
            // Rejoin document group
            if (this.documentId) {
                this.joinDocument(this.documentId);
            }
        });
        
        this.connection.onclose((error) => {
            console.log('SignalR disconnected:', error);
            this.emit('connectionStateChanged', 'disconnected');
        });
        
        // Message handlers
        this.connection.on('cursorUpdate', (data) => {
            this.emit('cursorUpdate', data);
        });
        
        this.connection.on('selectionUpdate', (data) => {
            this.emit('selectionUpdate', data);
        });
        
        this.connection.on('userJoined', (data) => {
            this.emit('userJoined', data);
        });
        
        this.connection.on('userLeft', (data) => {
            this.emit('userLeft', data);
        });
        
        this.connection.on('presenceUpdate', (data) => {
            this.emit('presenceUpdate', data);
        });
        
        this.connection.on('documentChanged', (data) => {
            this.emit('documentChanged', data);
        });
    }
    
    // ─────────────────────────────────────────────────────────
    // Document Groups
    // ─────────────────────────────────────────────────────────
    
    async joinDocument(documentId: string): Promise<void> {
        this.documentId = documentId;
        
        await fetch(`${this.config.negotiateUrl.replace('/negotiate', '/join-group')}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: this.userId,
                groupName: `doc:${documentId}`
            })
        });
        
        // Announce presence
        await this.broadcastPresence({
            status: 'online',
            currentSlide: null
        });
    }
    
    async leaveDocument(): Promise<void> {
        if (!this.documentId) return;
        
        await fetch(`${this.config.negotiateUrl.replace('/negotiate', '/leave-group')}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: this.userId,
                groupName: `doc:${this.documentId}`
            })
        });
        
        this.documentId = null;
    }
    
    // ─────────────────────────────────────────────────────────
    // Broadcasting
    // ─────────────────────────────────────────────────────────
    
    async broadcastCursor(cursor: CursorPosition): Promise<void> {
        await this.broadcast('cursorUpdate', {
            userId: this.userId,
            cursor,
            timestamp: Date.now()
        });
    }
    
    async broadcastSelection(selection: SelectionState): Promise<void> {
        await this.broadcast('selectionUpdate', {
            userId: this.userId,
            selection,
            timestamp: Date.now()
        });
    }
    
    async broadcastPresence(presence: PresenceState): Promise<void> {
        await this.broadcast('presenceUpdate', {
            userId: this.userId,
            presence,
            timestamp: Date.now()
        });
    }
    
    async broadcastDocumentChange(change: DocumentChange): Promise<void> {
        await this.broadcast('documentChanged', {
            userId: this.userId,
            change,
            timestamp: Date.now()
        });
    }
    
    private async broadcast(target: string, data: any): Promise<void> {
        if (!this.documentId) {
            throw new Error('Not connected to a document');
        }
        
        await fetch(`${this.config.negotiateUrl.replace('/negotiate', '/broadcast')}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                groupName: `doc:${this.documentId}`,
                target,
                data
            })
        });
    }
    
    // ─────────────────────────────────────────────────────────
    // Event Emitter (simplified)
    // ─────────────────────────────────────────────────────────
    
    private listeners = new Map<string, Function[]>();
    
    on(event: string, callback: Function): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(callback);
    }
    
    off(event: string, callback: Function): void {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) callbacks.splice(index, 1);
        }
    }
    
    private emit(event: string, data: any): void {
        this.listeners.get(event)?.forEach(cb => cb(data));
    }
}

// Types
interface CursorPosition {
    slideId: string;
    x: number;
    y: number;
}

interface SelectionState {
    slideId: string;
    elementIds: string[];
}

interface PresenceState {
    status: 'online' | 'away' | 'offline';
    currentSlide: string | null;
    lastActive?: number;
}

interface DocumentChange {
    type: 'saved' | 'slide-added' | 'slide-deleted';
    details?: any;
}
```

### 3.2 Usage in Story App

```typescript
// Initialize SignalR client
const signalR = new SignalRClient({
    negotiateUrl: 'https://story-functions.azurewebsites.net/api/negotiate',
    hubName: 'storyHub'
}, currentUser.id);

// Connect when app starts
await signalR.connect();

// Join document when opening a shared presentation
async function openSharedPresentation(documentId: string) {
    await signalR.joinDocument(documentId);
    
    // Listen for other users' cursors
    signalR.on('cursorUpdate', ({ userId, cursor }) => {
        renderRemoteCursor(userId, cursor);
    });
    
    // Listen for presence updates
    signalR.on('presenceUpdate', ({ userId, presence }) => {
        updateUserPresence(userId, presence);
    });
    
    // Listen for document changes
    signalR.on('documentChanged', ({ userId, change }) => {
        if (change.type === 'saved') {
            showNotification(`${getUserName(userId)} saved changes`);
            // Optionally reload from cloud storage
        }
    });
}

// Broadcast cursor position (throttled)
const throttledBroadcastCursor = throttle((cursor) => {
    signalR.broadcastCursor(cursor);
}, 50); // Max 20 updates per second

canvas.addEventListener('mousemove', (e) => {
    throttledBroadcastCursor({
        slideId: currentSlideId,
        x: e.offsetX,
        y: e.offsetY
    });
});

// Leave when closing document
async function closePresentation() {
    await signalR.leaveDocument();
}
```

---

## 4. Azure Functions

### 4.1 Negotiate Function

```typescript
// functions/negotiate.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { generateClientToken } from './signalr-utils';

app.http('negotiate', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        const userId = request.headers.get('x-ms-signalr-userid');
        
        if (!userId) {
            return {
                status: 400,
                body: JSON.stringify({ error: 'User ID required' })
            };
        }
        
        // Validate auth token here if needed
        const authHeader = request.headers.get('authorization');
        if (authHeader) {
            const isValid = await validateToken(authHeader.replace('Bearer ', ''));
            if (!isValid) {
                return { status: 401, body: 'Unauthorized' };
            }
        }
        
        // Generate SignalR connection info
        const connectionInfo = await generateClientToken(userId);
        
        return {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(connectionInfo)
        };
    }
});
```

### 4.2 Broadcast Function

```typescript
// functions/broadcast.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext, output } from '@azure/functions';

// SignalR output binding
const signalROutput = output.generic({
    type: 'signalR',
    name: 'signalRMessages',
    hubName: 'storyHub',
    connectionStringSetting: 'AzureSignalRConnectionString'
});

app.http('broadcast', {
    methods: ['POST'],
    authLevel: 'anonymous',
    extraOutputs: [signalROutput],
    handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        const body = await request.json() as {
            groupName: string;
            target: string;
            data: any;
        };
        
        const { groupName, target, data } = body;
        
        // Validate groupName format
        if (!groupName.startsWith('doc:')) {
            return { status: 400, body: 'Invalid group name' };
        }
        
        // Broadcast to group
        context.extraOutputs.set(signalROutput, {
            target,
            groupName,
            arguments: [data]
        });
        
        return { status: 200 };
    }
});
```

### 4.3 Join/Leave Group Functions

```typescript
// functions/join-group.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext, output } from '@azure/functions';

const signalRGroupActions = output.generic({
    type: 'signalR',
    name: 'signalRGroupActions',
    hubName: 'storyHub',
    connectionStringSetting: 'AzureSignalRConnectionString'
});

app.http('join-group', {
    methods: ['POST'],
    authLevel: 'anonymous',
    extraOutputs: [signalRGroupActions],
    handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        const { userId, groupName } = await request.json() as {
            userId: string;
            groupName: string;
        };
        
        // Add user to group
        context.extraOutputs.set(signalRGroupActions, {
            userId,
            groupName,
            action: 'add'
        });
        
        // Also broadcast that user joined
        context.extraOutputs.set(signalRGroupActions, {
            target: 'userJoined',
            groupName,
            arguments: [{ userId, joinedAt: Date.now() }]
        });
        
        return { status: 200 };
    }
});

// functions/leave-group.ts
app.http('leave-group', {
    methods: ['POST'],
    authLevel: 'anonymous',
    extraOutputs: [signalRGroupActions],
    handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        const { userId, groupName } = await request.json() as {
            userId: string;
            groupName: string;
        };
        
        // Remove user from group
        context.extraOutputs.set(signalRGroupActions, {
            userId,
            groupName,
            action: 'remove'
        });
        
        // Broadcast that user left
        context.extraOutputs.set(signalRGroupActions, {
            target: 'userLeft',
            groupName,
            arguments: [{ userId, leftAt: Date.now() }]
        });
        
        return { status: 200 };
    }
});
```

### 4.4 Presence Heartbeat Function

```typescript
// functions/heartbeat.ts (Timer-triggered)
import { app, InvocationContext, Timer, output } from '@azure/functions';

const signalROutput = output.generic({
    type: 'signalR',
    name: 'signalRMessages',
    hubName: 'storyHub',
    connectionStringSetting: 'AzureSignalRConnectionString'
});

// Store active users (use Redis/Table Storage in production)
const activeUsers = new Map<string, { userId: string; lastSeen: number; groupName: string }>();

app.timer('heartbeat', {
    schedule: '0 */1 * * * *',  // Every minute
    extraOutputs: [signalROutput],
    handler: async (timer: Timer, context: InvocationContext): Promise<void> => {
        const now = Date.now();
        const staleThreshold = 2 * 60 * 1000; // 2 minutes
        
        // Find and remove stale users
        for (const [key, user] of activeUsers) {
            if (now - user.lastSeen > staleThreshold) {
                // Mark user as away
                context.extraOutputs.set(signalROutput, {
                    target: 'presenceUpdate',
                    groupName: user.groupName,
                    arguments: [{
                        userId: user.userId,
                        presence: { status: 'away' }
                    }]
                });
                
                activeUsers.delete(key);
            }
        }
    }
});
```

---

## 5. Message Types

### 5.1 Message Schema

```typescript
// All messages sent through SignalR
interface SignalRMessage {
    target: string;
    groupName: string;
    arguments: [MessagePayload];
}

type MessagePayload = 
    | CursorUpdatePayload
    | SelectionUpdatePayload
    | PresenceUpdatePayload
    | UserJoinedPayload
    | UserLeftPayload
    | DocumentChangedPayload;

interface CursorUpdatePayload {
    userId: string;
    cursor: {
        slideId: string;
        x: number;
        y: number;
    };
    timestamp: number;
}

interface SelectionUpdatePayload {
    userId: string;
    selection: {
        slideId: string;
        elementIds: string[];
    };
    timestamp: number;
}

interface PresenceUpdatePayload {
    userId: string;
    presence: {
        status: 'online' | 'away' | 'offline';
        currentSlide: string | null;
    };
    timestamp: number;
}

interface UserJoinedPayload {
    userId: string;
    user: {
        displayName: string;
        avatarUrl?: string;
    };
    joinedAt: number;
}

interface UserLeftPayload {
    userId: string;
    leftAt: number;
}

interface DocumentChangedPayload {
    userId: string;
    change: {
        type: 'saved' | 'slide-added' | 'slide-deleted' | 'element-changed';
        slideId?: string;
        elementId?: string;
    };
    timestamp: number;
}
```

### 5.2 Message Throttling

```typescript
// Client-side throttling to prevent flooding
class MessageThrottler {
    private queues = new Map<string, { last: number; pending: any }>();
    private intervals = {
        cursorUpdate: 50,       // 20 per second
        selectionUpdate: 100,   // 10 per second
        presenceUpdate: 1000,   // 1 per second
    };
    
    throttle(messageType: string, data: any, send: (data: any) => void): void {
        const interval = this.intervals[messageType] || 100;
        const queue = this.queues.get(messageType);
        const now = Date.now();
        
        if (!queue || now - queue.last >= interval) {
            // Send immediately
            send(data);
            this.queues.set(messageType, { last: now, pending: null });
        } else {
            // Queue for later (only keep latest)
            this.queues.set(messageType, { 
                last: queue.last, 
                pending: data 
            });
            
            // Schedule send
            setTimeout(() => {
                const q = this.queues.get(messageType);
                if (q?.pending) {
                    send(q.pending);
                    this.queues.set(messageType, { last: Date.now(), pending: null });
                }
            }, interval - (now - queue.last));
        }
    }
}
```

---

## 6. Scaling & Costs

### 6.1 Pricing Tiers

| Tier | Connections | Messages/Day | Cost/Month |
|------|-------------|--------------|------------|
| **Free** | 20 concurrent | 20,000 | $0 |
| **Standard** | 1,000 per unit | 1M per unit | ~$50/unit |

### 6.2 Message Volume Estimates

| Activity | Messages/User/Hour | Notes |
|----------|-------------------|-------|
| Cursor movement | 360-720 | Throttled to 20/sec max |
| Selection changes | 60 | On element select |
| Presence updates | 6 | Every 10 seconds |
| **Total** | ~400-800 | Per active user |

**Example: 10 concurrent users editing for 2 hours**
- Messages: 10 × 800 × 2 = 16,000 messages
- **Well within free tier** (20,000/day)

### 6.3 Cost Optimization

```typescript
// Only broadcast when in collaborative mode
class CollaborationManager {
    private isCollaborative = false;
    
    async openDocument(documentId: string, shared: boolean) {
        if (shared) {
            this.isCollaborative = true;
            await this.signalR.joinDocument(documentId);
        } else {
            // Solo editing - no real-time needed
            this.isCollaborative = false;
        }
    }
    
    broadcastIfNeeded(type: string, data: any) {
        if (this.isCollaborative) {
            this.signalR.broadcast(type, data);
        }
    }
}
```

---

## 7. Provider Abstraction

### 7.1 Real-Time Provider Interface

To allow switching from Azure SignalR to other providers:

```typescript
/**
 * Abstract interface for real-time messaging providers.
 * Implementations: Azure SignalR, Pusher, Ably, Firebase, etc.
 */
interface RealTimeProvider {
    readonly providerId: string;
    readonly displayName: string;
    
    // Connection
    connect(userId: string): Promise<void>;
    disconnect(): Promise<void>;
    getConnectionState(): ConnectionState;
    
    // Groups (rooms/channels)
    joinGroup(groupName: string): Promise<void>;
    leaveGroup(groupName: string): Promise<void>;
    
    // Messaging
    broadcast(groupName: string, target: string, data: any): Promise<void>;
    
    // Event handlers
    on(event: string, callback: (data: any) => void): void;
    off(event: string, callback: (data: any) => void): void;
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
```

### 7.2 Alternative Implementations

```typescript
// Pusher implementation (example)
class PusherProvider implements RealTimeProvider {
    readonly providerId = 'pusher';
    readonly displayName = 'Pusher';
    
    private pusher: Pusher;
    private channels = new Map<string, Channel>();
    
    async connect(userId: string): Promise<void> {
        this.pusher = new Pusher(PUSHER_KEY, {
            cluster: 'us2',
            authEndpoint: '/api/pusher/auth'
        });
    }
    
    async joinGroup(groupName: string): Promise<void> {
        const channel = this.pusher.subscribe(`presence-${groupName}`);
        this.channels.set(groupName, channel);
    }
    
    async broadcast(groupName: string, target: string, data: any): Promise<void> {
        // Pusher client-events (requires presence channel)
        const channel = this.channels.get(groupName);
        channel?.trigger(`client-${target}`, data);
    }
}

// Firebase Realtime Database implementation (example)
class FirebaseProvider implements RealTimeProvider {
    readonly providerId = 'firebase';
    readonly displayName = 'Firebase';
    
    private database: firebase.database.Database;
    
    async broadcast(groupName: string, target: string, data: any): Promise<void> {
        await this.database
            .ref(`documents/${groupName}/${target}`)
            .push({
                ...data,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
    }
}
```

### 7.3 Provider Factory

```typescript
class RealTimeProviderFactory {
    static create(providerId: string, config: any): RealTimeProvider {
        switch (providerId) {
            case 'azure-signalr':
                return new AzureSignalRProvider(config);
            case 'pusher':
                return new PusherProvider(config);
            case 'firebase':
                return new FirebaseProvider(config);
            case 'ably':
                return new AblyProvider(config);
            default:
                throw new Error(`Unknown provider: ${providerId}`);
        }
    }
}

// Usage - easy to switch providers
const realtime = RealTimeProviderFactory.create(
    process.env.REALTIME_PROVIDER || 'azure-signalr',
    {
        // Provider-specific config
    }
);
```

---

## Implementation Checklist

### Phase 1: Basic Setup
- [ ] Create Azure SignalR Service (Free tier)
- [ ] Create Azure Functions App
- [ ] Deploy negotiate function
- [ ] Test client connection

### Phase 2: Group Messaging
- [ ] Deploy join-group/leave-group functions
- [ ] Deploy broadcast function
- [ ] Implement document groups

### Phase 3: Presence
- [ ] Cursor broadcasting
- [ ] Selection broadcasting
- [ ] User presence indicators

### Phase 4: Optimization
- [ ] Message throttling
- [ ] Reconnection handling
- [ ] Offline graceful degradation

---

## Related Documents

- [Real-Time Collaboration](./realtime-collaboration.md)
- [Collaboration Protocol](./collaboration-protocol.md)
- [Cloud Storage Abstraction](./cloud-storage-abstraction.md)
- [Authentication](./authentication.md)

---

*Azure SignalR provides serverless real-time messaging without server maintenance. The abstraction layer allows switching to other providers if needed.*
