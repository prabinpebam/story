# Real-Time Collaboration - Specification

## Overview

This specification defines the architecture for real-time collaborative editing of Story presentations. The system uses Google OAuth for authentication, operational transformation or CRDTs for conflict resolution, and WebSocket connections for real-time sync.

**Note**: This is a future feature. The file format and data structures are designed to support this from day one.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Clients                                  │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   User A        │    User B       │    User C                   │
│   (Editor)      │    (Editor)     │    (Viewer)                 │
└────────┬────────┴────────┬────────┴────────┬────────────────────┘
         │                 │                 │
         │    WebSocket    │    WebSocket    │    WebSocket
         │                 │                 │
┌────────▼─────────────────▼─────────────────▼────────────────────┐
│                    Collaboration Server                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Session    │  │  Operation  │  │  Presence   │              │
│  │  Manager    │  │  Transform  │  │  Tracker    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
├─────────────────────────────────────────────────────────────────┤
│                    Persistence Layer                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Document   │  │   Asset     │  │  Operation  │              │
│  │  Store      │  │   CDN       │  │  History    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Authentication & Authorization

### Google OAuth Integration

```javascript
// Auth flow
const authConfig = {
    provider: 'google',
    clientId: 'YOUR_GOOGLE_CLIENT_ID',
    scopes: [
        'openid',
        'profile', 
        'email'
    ],
    redirectUri: 'https://app.story.com/auth/callback'
};

class AuthManager {
    async signIn() {
        // OAuth 2.0 PKCE flow
        const codeVerifier = this.generateCodeVerifier();
        const codeChallenge = await this.generateCodeChallenge(codeVerifier);
        
        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        authUrl.searchParams.set('client_id', authConfig.clientId);
        authUrl.searchParams.set('redirect_uri', authConfig.redirectUri);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', authConfig.scopes.join(' '));
        authUrl.searchParams.set('code_challenge', codeChallenge);
        authUrl.searchParams.set('code_challenge_method', 'S256');
        
        // Redirect to Google
        window.location.href = authUrl.toString();
    }
    
    async handleCallback(code) {
        // Exchange code for tokens
        const tokens = await this.exchangeCode(code, codeVerifier);
        
        // Get user profile
        const profile = await this.getUserProfile(tokens.access_token);
        
        // Store session
        this.session = {
            user: profile,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresAt: Date.now() + tokens.expires_in * 1000
        };
        
        return this.session;
    }
}
```

### Permission Model

```javascript
const PermissionLevels = {
    OWNER: 'owner',       // Full control, can delete
    EDITOR: 'editor',     // Can edit content
    COMMENTER: 'commenter', // Can add comments only
    VIEWER: 'viewer'      // Read-only access
};

// Document permissions stored in manifest
{
    "permissions": {
        "owner": "user_abc123",
        "collaborators": [
            { "userId": "user_def456", "email": "bob@example.com", "role": "editor" },
            { "userId": "user_ghi789", "email": "carol@example.com", "role": "viewer" }
        ],
        "linkSharing": {
            "enabled": true,
            "role": "viewer",  // Anyone with link gets this role
            "expiresAt": null  // Or ISO date string
        }
    }
}
```

---

## Document Sharing

### Share Link Generation

```javascript
class SharingManager {
    async generateShareLink(documentId, options = {}) {
        const shareToken = await this.createShareToken({
            documentId,
            role: options.role || 'viewer',
            expiresAt: options.expiresAt || null,
            password: options.password || null
        });
        
        return `https://app.story.com/p/${documentId}?share=${shareToken}`;
    }
    
    async resolveShareLink(documentId, shareToken) {
        const share = await api.validateShareToken(shareToken);
        
        if (!share.valid) {
            throw new ShareError('INVALID_LINK');
        }
        
        if (share.expiresAt && Date.now() > share.expiresAt) {
            throw new ShareError('LINK_EXPIRED');
        }
        
        if (share.password && !this.verifyPassword(share.password)) {
            return { requiresPassword: true };
        }
        
        return {
            documentId,
            role: share.role,
            canEdit: share.role === 'editor' || share.role === 'owner'
        };
    }
}
```

### Share Dialog UI

```
┌─────────────────────────────────────────────────────────────┐
│ Share "Marketing Presentation"                        [×]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Add people                                                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Enter email addresses...                                ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  People with access                                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 👤 You (owner)                              Owner       ││
│  │ 👤 bob@example.com                     [Editor ▼]  [×]  ││
│  │ 👤 carol@example.com                   [Viewer ▼]  [×]  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  Get link                                                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 🔗 https://app.story.com/p/abc123?share=...   [Copy]   ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Anyone with the link:  [Can view ▼]                        │
│                                                              │
│                                          [Done]              │
└─────────────────────────────────────────────────────────────┘
```

---

## Real-Time Sync Protocol

### WebSocket Connection

```javascript
class CollaborationSession {
    constructor(documentId, user) {
        this.documentId = documentId;
        this.user = user;
        this.ws = null;
        this.pendingOperations = [];
        this.serverVersion = 0;
        this.localVersion = 0;
    }
    
    async connect() {
        const token = await auth.getAccessToken();
        
        this.ws = new WebSocket(
            `wss://collab.story.com/documents/${this.documentId}?token=${token}`
        );
        
        this.ws.onopen = () => this.handleOpen();
        this.ws.onmessage = (e) => this.handleMessage(JSON.parse(e.data));
        this.ws.onclose = () => this.handleClose();
        this.ws.onerror = (e) => this.handleError(e);
    }
    
    handleOpen() {
        // Send join message
        this.send({
            type: 'JOIN',
            version: this.localVersion,
            user: {
                id: this.user.id,
                name: this.user.name,
                avatar: this.user.avatar
            }
        });
    }
    
    handleMessage(message) {
        switch (message.type) {
            case 'SYNC':
                this.handleSync(message);
                break;
            case 'OPERATION':
                this.handleRemoteOperation(message);
                break;
            case 'PRESENCE':
                this.handlePresence(message);
                break;
            case 'ACK':
                this.handleAck(message);
                break;
            case 'ERROR':
                this.handleError(message);
                break;
        }
    }
}
```

### Message Types

```javascript
// Client → Server
const ClientMessages = {
    JOIN: {
        type: 'JOIN',
        version: 42,           // Last known version
        user: { id, name, avatar }
    },
    
    OPERATION: {
        type: 'OPERATION',
        clientId: 'abc123',
        baseVersion: 42,       // Version this op is based on
        operations: [...]      // Array of operations
    },
    
    PRESENCE: {
        type: 'PRESENCE',
        cursor: { slideId: 'slide_1', x: 100, y: 200 },
        selection: { elementIds: ['elem_1', 'elem_2'] },
        activeSlide: 'slide_1'
    },
    
    LEAVE: {
        type: 'LEAVE'
    }
};

// Server → Client
const ServerMessages = {
    SYNC: {
        type: 'SYNC',
        version: 45,
        document: {...},       // Full or partial document state
        collaborators: [...]   // Current collaborators
    },
    
    OPERATION: {
        type: 'OPERATION',
        userId: 'user_xyz',
        version: 46,
        operations: [...]      // Transformed operations
    },
    
    ACK: {
        type: 'ACK',
        clientId: 'abc123',    // Matches client's operation
        version: 47            // New server version
    },
    
    PRESENCE: {
        type: 'PRESENCE',
        userId: 'user_xyz',
        cursor: {...},
        selection: {...}
    },
    
    USER_JOINED: {
        type: 'USER_JOINED',
        user: { id, name, avatar }
    },
    
    USER_LEFT: {
        type: 'USER_LEFT',
        userId: 'user_xyz'
    }
};
```

---

## Operation Model

### Operation Types

```javascript
// Granular operations for conflict-free merging
const OperationTypes = {
    // Slide operations
    SLIDE_INSERT: 'slide_insert',
    SLIDE_DELETE: 'slide_delete',
    SLIDE_MOVE: 'slide_move',
    SLIDE_UPDATE: 'slide_update',
    
    // Element operations
    ELEMENT_INSERT: 'element_insert',
    ELEMENT_DELETE: 'element_delete',
    ELEMENT_UPDATE: 'element_update',
    ELEMENT_MOVE: 'element_move',      // Reorder in layer stack
    ELEMENT_REPARENT: 'element_reparent', // Move to different group
    
    // Property operations (for fine-grained updates)
    PROPERTY_SET: 'property_set',
    PROPERTY_DELETE: 'property_delete',
    
    // Text operations (for collaborative text editing)
    TEXT_INSERT: 'text_insert',
    TEXT_DELETE: 'text_delete',
    TEXT_FORMAT: 'text_format',
    
    // Selection operations (not persisted, just for awareness)
    SELECT: 'select',
    DESELECT: 'deselect'
};

// Example operations
const operations = [
    {
        type: 'element_update',
        slideId: 'slide_001',
        elementId: 'elem_abc',
        path: ['style', 'x'],
        value: 150,
        previousValue: 100  // For undo
    },
    {
        type: 'text_insert',
        slideId: 'slide_001',
        elementId: 'text_xyz',
        position: 42,
        text: 'Hello',
        attributes: { bold: true }
    }
];
```

### Operational Transformation

```javascript
class OperationTransformer {
    /**
     * Transform operation A against operation B
     * Returns A' such that apply(apply(doc, B), A') = apply(apply(doc, A), B')
     */
    transform(opA, opB) {
        // Same element, same property
        if (opA.elementId === opB.elementId && opA.path === opB.path) {
            // Last write wins for simple properties
            if (opA.type === 'property_set' && opB.type === 'property_set') {
                // Use timestamp or operation ID to determine winner
                return opA.timestamp > opB.timestamp ? opA : null;
            }
        }
        
        // Text operations need character-level transformation
        if (opA.type === 'text_insert' && opB.type === 'text_insert') {
            if (opA.elementId === opB.elementId) {
                return this.transformTextInsert(opA, opB);
            }
        }
        
        // Independent operations - no transformation needed
        return opA;
    }
    
    transformTextInsert(opA, opB) {
        if (opA.position <= opB.position) {
            // A comes before B, no change to A
            return opA;
        } else {
            // A comes after B, shift A's position
            return {
                ...opA,
                position: opA.position + opB.text.length
            };
        }
    }
}
```

---

## Presence Awareness

### Cursor & Selection Tracking

```javascript
class PresenceManager {
    constructor(session) {
        this.session = session;
        this.collaborators = new Map();
        this.localPresence = {
            cursor: null,
            selection: [],
            activeSlide: null
        };
    }
    
    updateCursor(slideId, x, y) {
        this.localPresence.cursor = { slideId, x, y };
        this.broadcastPresence();
    }
    
    updateSelection(elementIds) {
        this.localPresence.selection = elementIds;
        this.broadcastPresence();
    }
    
    broadcastPresence() {
        // Throttle to avoid flooding
        this.throttledSend({
            type: 'PRESENCE',
            ...this.localPresence
        });
    }
    
    handleRemotePresence(userId, presence) {
        this.collaborators.set(userId, {
            ...this.collaborators.get(userId),
            ...presence,
            lastSeen: Date.now()
        });
        
        this.emit('presence-update', userId, presence);
    }
}
```

### Collaborator Avatars

```
┌─────────────────────────────────────────────────────────────┐
│ [Story Logo]  Marketing Presentation    👤👤👤 +2  [Share] │
│                                         ▲                   │
│                                         │                   │
│                              Collaborator avatars           │
└─────────────────────────────────────────────────────────────┘

On hover:
┌─────────────────────────────────────────┐
│ Currently editing:                       │
│ 👤 Alice (you)        - Slide 3         │
│ 👤 Bob               - Slide 1          │
│ 👤 Carol             - Slide 5          │
│ +2 viewers                               │
└─────────────────────────────────────────┘
```

### Selection Visualization

```javascript
// Render collaborator selections on canvas
class CollaboratorRenderer {
    render(collaborators) {
        for (const [userId, presence] of collaborators) {
            // Skip self
            if (userId === this.userId) continue;
            
            // Draw selection box around selected elements
            for (const elementId of presence.selection) {
                this.drawSelectionBox(elementId, presence.color);
            }
            
            // Draw cursor with name tag
            if (presence.cursor && presence.activeSlide === this.activeSlide) {
                this.drawCursor(presence.cursor, presence.name, presence.color);
            }
        }
    }
    
    drawSelectionBox(elementId, color) {
        const element = this.getElement(elementId);
        if (!element) return;
        
        const box = this.ctx.createPath();
        box.rect(element.x - 2, element.y - 2, element.width + 4, element.height + 4);
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([4, 4]);
        this.ctx.stroke(box);
    }
    
    drawCursor(cursor, name, color) {
        // Draw arrow cursor
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(cursor.x, cursor.y);
        this.ctx.lineTo(cursor.x + 12, cursor.y + 10);
        this.ctx.lineTo(cursor.x + 4, cursor.y + 10);
        this.ctx.lineTo(cursor.x, cursor.y + 16);
        this.ctx.fill();
        
        // Draw name tag
        this.ctx.fillStyle = color;
        this.ctx.fillRect(cursor.x + 12, cursor.y + 8, name.length * 7, 18);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px sans-serif';
        this.ctx.fillText(name, cursor.x + 14, cursor.y + 20);
    }
}
```

---

## Conflict Resolution

### Conflict Types

```javascript
const ConflictTypes = {
    // Same property changed by multiple users
    PROPERTY_CONFLICT: 'property_conflict',
    
    // Element deleted while another user was editing it
    EDIT_DELETE_CONFLICT: 'edit_delete_conflict',
    
    // Slide deleted while another user was on it
    SLIDE_DELETE_CONFLICT: 'slide_delete_conflict',
    
    // Concurrent insertions at same position
    INSERT_CONFLICT: 'insert_conflict'
};
```

### Resolution Strategies

```javascript
class ConflictResolver {
    resolve(localOp, remoteOp, conflict) {
        switch (conflict.type) {
            case ConflictTypes.PROPERTY_CONFLICT:
                // For simple properties: last-write-wins
                // For important properties: ask user
                if (this.isImportantProperty(localOp.path)) {
                    return this.askUser(localOp, remoteOp);
                }
                return remoteOp.timestamp > localOp.timestamp ? remoteOp : localOp;
                
            case ConflictTypes.EDIT_DELETE_CONFLICT:
                // Preserve edits - resurrect deleted element
                return this.resurrectElement(localOp.elementId);
                
            case ConflictTypes.SLIDE_DELETE_CONFLICT:
                // Navigate user to next slide, show toast
                return this.handleSlideDeleted(localOp.slideId);
                
            default:
                // Auto-resolve with transformation
                return this.transform(localOp, remoteOp);
        }
    }
}
```

---

## Offline Collaboration

### Offline Queue

```javascript
class OfflineQueue {
    constructor() {
        this.queue = [];
        this.isOnline = navigator.onLine;
        
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
    }
    
    enqueue(operation) {
        if (this.isOnline && this.session.connected) {
            this.session.send(operation);
        } else {
            this.queue.push({
                ...operation,
                queuedAt: Date.now()
            });
            this.persistQueue();
        }
    }
    
    async handleOnline() {
        this.isOnline = true;
        
        // Reconnect to session
        await this.session.reconnect();
        
        // Flush queued operations
        for (const op of this.queue) {
            await this.session.send(op);
        }
        
        this.queue = [];
        this.persistQueue();
    }
    
    persistQueue() {
        localStorage.setItem(
            `story:offline-queue:${this.documentId}`,
            JSON.stringify(this.queue)
        );
    }
}
```

### Merge on Reconnect

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Syncing offline changes...                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  You made changes while offline that need to be synced.     │
│                                                              │
│  Your changes (12):                                          │
│  • Modified text on slide 3                                  │
│  • Moved element on slide 5                                  │
│  • Added new slide                                           │
│  • ...and 9 more                                             │
│                                                              │
│  Changes by others (5):                                       │
│  • Bob deleted slide 7                                       │
│  • Carol edited slide 3                                      │
│  • ...and 3 more                                             │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ⚠️ Conflict on slide 3: You and Carol both edited the  ││
│  │    same text element.                                   ││
│  │                                                         ││
│  │    [Keep Mine] [Keep Theirs] [View Both]               ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│                               [Sync All]  [Review Changes]   │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Model Extensions

### Document Metadata

```javascript
// Added to manifest.json for collaboration
{
    "collaboration": {
        "enabled": true,
        "documentId": "doc_abc123xyz",  // Server-side ID
        "owner": {
            "userId": "user_123",
            "email": "alice@example.com"
        },
        "version": 42,
        "lastSyncedAt": "2025-11-27T10:30:00Z"
    }
}
```

### Element Versioning

```javascript
// Each element tracks modification info for conflict detection
{
    "id": "elem_abc",
    "type": "shape",
    "x": 100,
    "y": 200,
    // ... other properties
    
    // Collaboration metadata
    "_meta": {
        "version": 15,
        "modifiedAt": "2025-11-27T10:30:00Z",
        "modifiedBy": "user_xyz",
        "createdAt": "2025-11-27T09:00:00Z",
        "createdBy": "user_abc"
    }
}
```

### Slide Versioning

```javascript
// slides/001.json
{
    "id": "slide_001",
    "elements": {...},
    
    "_meta": {
        "version": 23,
        "modifiedAt": "2025-11-27T10:30:00Z",
        "modifiedBy": "user_xyz"
    }
}
```

---

## Server Architecture (Future)

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway                             │
│              (Authentication, Rate Limiting)                 │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                  Collaboration Service                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  WebSocket  │  │  Operation  │  │  Document   │         │
│  │  Handler    │  │  Processor  │  │  Manager    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    Data Layer                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Document   │  │   Asset     │  │   Redis     │         │
│  │  Database   │  │   Storage   │  │  (Pub/Sub)  │         │
│  │  (Postgres) │  │   (S3)      │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Scaling Considerations

```javascript
// Document sharding for horizontal scaling
const getDocumentShard = (documentId) => {
    const hash = hashCode(documentId);
    return `collab-${hash % NUM_SHARDS}.story.com`;
};

// Sticky sessions for WebSocket connections
const connectToDocument = async (documentId) => {
    const shardUrl = getDocumentShard(documentId);
    return new WebSocket(`wss://${shardUrl}/documents/${documentId}`);
};
```

---

## Implementation Phases

### Phase 1: Foundation (Implemented Now)
- [x] Data model with version tracking
- [x] Element metadata structure
- [x] Operation-compatible state updates

### Phase 2: Authentication (Future)
- [ ] Google OAuth integration
- [ ] User profile storage
- [ ] Session management

### Phase 3: Sharing (Future)
- [ ] Share link generation
- [ ] Permission management
- [ ] Sharing UI

### Phase 4: Real-Time Sync (Future)
- [ ] WebSocket connection
- [ ] Operation transformation
- [ ] Presence awareness

### Phase 5: Conflict Resolution (Future)
- [ ] Automatic resolution
- [ ] User prompts for conflicts
- [ ] Offline queue

---

## Security Considerations

1. **Authentication**: All WebSocket connections require valid JWT
2. **Authorization**: Server validates permissions for every operation
3. **Rate Limiting**: Prevent abuse with operation rate limits
4. **Encryption**: All connections over TLS
5. **Audit Log**: Track all operations for security review

---

*This spec defines the future collaboration architecture. Current implementation focuses on file format compatibility.*
