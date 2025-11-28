# Real-Time Collaboration - Specification

## Overview

This specification defines the architecture for real-time collaborative editing of Story presentations. The system uses a **serverless architecture** with:

- **User's cloud storage** (OneDrive/Google Drive) for file persistence
- **Azure SignalR Service** for real-time messaging (cursors, presence)
- **Azure Functions** for serverless backend (no servers to maintain)

**Key Design Decisions:**
- **No dedicated server** - Uses managed cloud services
- **Provider agnostic** - Can switch storage/messaging providers
- **User-owned data** - Files stay in user's cloud storage
- **Minimal infrastructure** - Free tier covers most use cases

---

## Related Specifications

| Document | Purpose |
|----------|---------|
| [Cloud Storage Abstraction](./cloud-storage-abstraction.md) | Provider-agnostic storage API (OneDrive, Google Drive) |
| [Azure SignalR Integration](./azure-signalr-integration.md) | Serverless real-time messaging |
| [Collaboration Protocol](./collaboration-protocol.md) | Message types, presence, cursors |
| [State Sync Engine](./state-sync-engine.md) | Vector clocks, OT, offline resync, per-user undo |
| [Asset Streaming](./asset-streaming.md) | Byte-range access, lazy loading, video streaming |
| [Authentication](./authentication.md) | OAuth 2.0 with Microsoft/Google |
| [Sharing & Permissions](./sharing-permissions.md) | Three-tier sharing model (public, password, cloud) |
| [Security Model](./security-model.md) | Sandboxing, encryption, validation |

---

## Zero-Database Architecture

Story uses a **zero-database architecture** where we don't maintain any server-side user database or file metadata. Everything is stored either in the user's cloud storage or extracted from OAuth tokens.

### What Story DOESN'T Have

| Traditional App | Story |
|-----------------|-------|
| User database | ❌ Identity from OAuth tokens |
| File database | ❌ Files in user's cloud storage |
| Session store | ❌ Tokens in browser storage |
| Collaboration state | ❌ Ephemeral SignalR groups |
| User preferences DB | ❌ Browser localStorage |

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                 ZERO-DATABASE ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  IDENTITY (No user database)                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  OAuth Provider (Microsoft/Google)                       │   │
│  │       ↓ tokens with claims (sub, email, name, picture)  │   │
│  │  Browser extracts user info from ID token               │   │
│  │       ↓ userInfo included in SignalR messages           │   │
│  │  Other clients display identity from received messages  │   │
│  │                                                          │   │
│  │  Result: Identity travels WITH tokens and messages      │   │
│  │          No server database lookup needed               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  STORAGE (No file database)                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Owner's Cloud Storage (OneDrive/Google Drive)          │   │
│  │       ↓ .story files with embedded assets               │   │
│  │  Collaborators access via shared links + Range requests │   │
│  │       ↓ read-only access, no storage quota used         │   │
│  │                                                          │   │
│  │  Result: Files stay in owner's account                  │   │
│  │          No central file server                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  REAL-TIME (No persistent state)                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Azure SignalR (Serverless)                             │   │
│  │       ↓ ephemeral groups (doc:123)                      │   │
│  │  Groups exist only while users are connected            │   │
│  │       ↓ no persistence when all users leave             │   │
│  │                                                          │   │
│  │  Result: No server tracks who's in which document       │   │
│  │          State rebuilt on reconnection via messages     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Benefits

| Benefit | Description |
|---------|-------------|
| **$0 database costs** | No PostgreSQL/MongoDB to host, backup, scale |
| **No data liability** | We don't store PII - OAuth providers do |
| **GDPR simplified** | User revokes OAuth = all access ends |
| **Infinite scale** | Each user's files in their own storage |
| **Offline first** | Everything needed is in browser + .story file |
| **Provider portable** | Easy to switch OAuth/storage providers |

### See Also
- [Authentication - Zero-Database Identity](./authentication.md#2-zero-database-identity-architecture)
- [Azure SignalR - Stateless & Ephemeral Design](./azure-signalr-integration.md#3-stateless--ephemeral-design)
- [Collaboration Protocol - Identity in Messages](./collaboration-protocol.md#1-message-format)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         STORY APP                               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Browser Client                                          │   │
│  │  • Authentication (MSAL.js / Google GIS)                │   │
│  │  • Cloud Storage SDK (Graph API / Drive API)            │   │
│  │  • SignalR Client (real-time messaging)                 │   │
│  │  • Presence & Cursor Rendering                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
└──────────────────────────────│──────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
┌───────────────┐    ┌─────────────────┐    ┌───────────────────┐
│  Azure AD /   │    │  Azure SignalR  │    │  OneDrive /       │
│  Google Auth  │    │  + Functions    │    │  Google Drive     │
│               │    │                 │    │                   │
│  • OAuth 2.0  │    │  • Cursors      │    │  • .str files     │
│  • Tokens     │    │  • Presence     │    │  • Versions       │
│  • SSO        │    │  • Notifications│    │  • Sharing        │
│               │    │                 │    │                   │
│  Cost: Free   │    │  Cost: ~$0-5/mo │    │  Cost: Free       │
└───────────────┘    └─────────────────┘    └───────────────────┘
       ▲                      ▲                      ▲
       │                      │                      │
       └──────────────────────┴──────────────────────┘
                     User's existing accounts
```

---

## Three Data Channels

The collaboration system uses **three separate channels** for different types of data. This is critical for performance and scalability.

```
┌────────────────────────────────────────────────────────────────┐
│                    DATA SYNCHRONIZATION                        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  CHANNEL 1: SignalR (Real-Time, Small Data)                   │
│  ├── Cursor positions (throttled to ~20/sec)                  │
│  ├── Selection changes                                         │
│  ├── Operations (add/move/delete/modify objects)              │
│  ├── Presence (join/leave/heartbeat)                          │
│  └── Max message: ~64KB                                        │
│                                                                │
│  CHANNEL 2: Cloud Storage (Large Files, Persistence)          │
│  ├── The main .story file (periodic save)                     │
│  ├── Video files (uploaded to file, not SignalR)              │
│  ├── High-res images                                           │
│  ├── Audio files                                               │
│  └── Embedded documents                                        │
│                                                                │
│  CHANNEL 3: Byte-Range Requests (Asset Streaming)             │
│  ├── Collaborators stream media directly from cloud           │
│  ├── HTTP Range headers for partial file access               │
│  └── No relay through SignalR or your browser                 │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Sync Method Summary

| Data Type | Sync Method | Latency | Typical Size | Notes |
|-----------|-------------|---------|--------------|-------|
| Cursor movement | SignalR | ~50ms | ~100 bytes | Throttled to 20/sec |
| Shape added/moved | SignalR (operation) | ~100ms | ~500 bytes - 2KB | Only delta sent |
| Text edited | SignalR (operation) | ~100ms | ~200 bytes - 1KB | Character ops |
| Property changed | SignalR (operation) | ~100ms | ~200 bytes | Single property |
| Selection changed | SignalR | ~100ms | ~200 bytes | Element IDs |
| Image added | Upload → SignalR ref | 1-5s | Ref ~500 bytes | Binary NOT in SignalR |
| Video added | Upload → SignalR ref | Varies | Ref ~500 bytes | Streams from cloud |
| Full file save | Cloud Storage | 1-10s | Unlimited | Periodic |
| User presence | SignalR | ~100ms | ~300 bytes | Join/leave |

### Key Insight: Operations, Not Files

When you add a shape, **only the operation is sent**, not the entire file:

```javascript
// What gets sent via SignalR (~500 bytes)
{
  type: "operation",
  operation: {
    type: "insert",
    path: ["slides", "slide-1", "objects"],
    value: {
      id: "shape-abc123",
      type: "rectangle",
      x: 100, y: 200,
      width: 300, height: 150,
      fill: "#3B82F6"
    }
  },
  userId: "user-123",
  vectorClock: { "user-123": 5, "user-456": 3 },
  timestamp: 1732780000000
}

// NOT the entire 10MB document!
```

### Large Media Flow

Videos and large images are **never** sent through SignalR:

```
┌─────────────────────────────────────────────────────────────────┐
│  YOU (Adding a 500MB video)                                     │
│                                                                 │
│  1. Drop video file                                             │
│  2. Upload to .story file in cloud → Uses YOUR storage quota   │
│  3. Create operation: { type: "video", mediaRef: "assets/..." }│
│  4. SignalR broadcasts operation (~500 bytes)                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ SignalR (~500 bytes only!)
┌─────────────────────────────────────────────────────────────────┐
│  COLLABORATOR'S BROWSER                                         │
│                                                                 │
│  1. Receives operation: { type: "video", mediaRef: "assets/..." }
│  2. Looks up byte offset in assetIndex                         │
│  3. Issues HTTP Range request directly to cloud storage        │
│  4. Video streams from OneDrive/Google Drive → Uses 0 quota    │
│  5. NO video data through SignalR!                              │
└─────────────────────────────────────────────────────────────────┘
```

**See [State Sync Engine](./state-sync-engine.md) for full operation/OT details.**
**See [Asset Streaming](./asset-streaming.md) for byte-range implementation.**

---

## Collaboration Modes

### Mode 1: Solo Editing (No Real-Time)

```
User opens file → Downloads from cloud → Edits locally → Saves back
                                                         (conflict check)
```

- No SignalR connection
- Conflict detection on save via ETag
- Works offline

### Mode 2: Shared Editing (Real-Time Awareness)

```
User A opens shared file → Joins SignalR group → Sees User B's cursor
                                               → Gets save notifications
                                               → Manual reload for changes
```

- Live cursors and presence
- Notification when others save
- File content synced via cloud storage (not real-time)

### Mode 3: Live Collaboration (Future Enhancement)

```
User A types → Operation sent → Server transforms → Broadcast to all
                                                  → All see same content
```

- Operational Transformation (OT) or CRDTs
- Character-by-character sync
- Requires more server infrastructure

---

## Implementation Phases

### Phase 1: Foundation ✅
- [x] Data model with version tracking
- [x] Element metadata structure
- [x] Operation-compatible state updates

### Phase 2: Authentication
- [ ] Microsoft OAuth (MSAL.js)
- [ ] Google OAuth (GIS)
- [ ] Token management
- [ ] Session persistence

### Phase 3: Cloud Storage
- [ ] OneDrive provider (Graph API)
- [ ] Google Drive provider (Drive API)
- [ ] Conflict detection
- [ ] Version history integration

### Phase 4: Real-Time Presence
- [ ] Azure SignalR Service setup
- [ ] Azure Functions (negotiate, broadcast)
- [ ] Cursor broadcasting
- [ ] Selection indicators
- [ ] User presence (online/away)

### Phase 5: Collaboration UX
- [ ] Share dialog
- [ ] Collaborator avatars
- [ ] Save notifications
- [ ] Conflict resolution UI

### Phase 6: Advanced (Future)
- [ ] Real-time content sync (OT/CRDTs)
- [ ] Comments and annotations
- [ ] Revision history UI

---

## Self-Contained Files & Storage Architecture

### Key Principle: Files Stay Self-Contained

All assets (images, videos, fonts) are **embedded inside the .story ZIP file**, not stored separately. This ensures:
- **Portability** - One file contains everything
- **No broken links** - Assets can't be accidentally deleted
- **Owner-only storage** - Only file owner uses quota

### How Collaborators Access Large Files Efficiently

```
┌─────────────────────────────────────────────────────────────────┐
│  .story file in Owner's OneDrive (500MB)                       │
│                                                                 │
│  Bytes 0-10000:      manifest.json (with assetIndex)           │
│  Bytes 10001-50000:  slides/slide-1.json                       │
│  Bytes 50001-100000: assets/images/hero.jpg                    │
│  Bytes 100001-500MB: assets/videos/intro.mp4  ← Large video    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
    ┌─────────────────────────┼─────────────────────────┐
    ▼                         ▼                         ▼
┌───────────────┐    ┌─────────────────┐    ┌──────────────────┐
│ Owner         │    │ HTTP Range      │    │ Collaborator     │
│               │    │ Request         │    │                  │
│ Full file     │    │                 │    │ Range: bytes=    │
│ (500MB in     │    │ Returns ONLY    │    │ 100001-500MB     │
│ their drive)  │    │ requested bytes │    │                  │
│               │    │                 │    │ Uses 0 MB quota  │
└───────────────┘    └─────────────────┘    └──────────────────┘
```

### Storage Quota: Only Owner Pays

| Role | Storage Used | How It Works |
|------|--------------|--------------|
| **Owner** | Full file size | File stored in owner's cloud storage |
| **Collaborator** | 0 MB | Reads from owner's file via shared access |
| **Collaborator adds video** | 0 MB | Video uploaded to owner's file (owner's quota increases) |

### Asset Loading Flow

1. **Collaborator joins session** → SignalR provides file location
2. **Read manifest** → HTTP Range request for first 10KB only
3. **Parse assetIndex** → Now knows byte offsets for all assets
4. **Lazy load assets** → Range request for each asset as needed
5. **Stream videos** → Browser uses Range requests automatically

**See [Asset Streaming](./asset-streaming.md) for full implementation details.**

---

## Cost Analysis

| Component | Free Tier | Typical Usage | Notes |
|-----------|-----------|---------------|-------|
| Azure AD | Unlimited | - | App registration only |
| Azure SignalR | 20 connections, 20K msg/day | $0 | Sufficient for dev/small teams |
| Azure Functions | 1M executions/month | $0 | Consumption plan |
| OneDrive | User's storage | $0 | Files in user's account |
| Google Drive | User's storage | $0 | Files in user's account |
| **Total** | - | **$0-5/month** | Most use cases covered |

---

## Quick Links to Detailed Specs

1. **Storage**: [Cloud Storage Abstraction](./cloud-storage-abstraction.md)
   - `CloudStorageProvider` interface
   - OneDrive/Google Drive implementations
   - **Byte-range access** for asset streaming
   - Conflict resolution & offline queue

2. **Messaging**: [Azure SignalR Integration](./azure-signalr-integration.md)
   - Serverless architecture
   - Azure Functions code
   - Client implementation
   - Provider abstraction

3. **Protocol**: [Collaboration Protocol](./collaboration-protocol.md)
   - Message formats
   - Presence/cursor/selection
   - Document sync
   - Error handling

4. **State Sync**: [State Sync Engine](./state-sync-engine.md)
   - Vector clocks & OT
   - Per-user undo/redo
   - Offline support & resync

5. **Asset Streaming**: [Asset Streaming](./asset-streaming.md)
   - Byte-range requests
   - Lazy loading strategy
   - Video streaming
   - Self-contained file architecture

6. **Auth**: [Authentication](./authentication.md)
   - Microsoft/Google providers
   - Token management
   - Session handling
   - UI components

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
