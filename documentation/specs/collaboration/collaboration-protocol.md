# Collaboration Protocol - Specification

## Overview

This specification defines the **message protocol** for real-time collaboration in Story. It covers all message types, data formats, and handling logic for presence awareness, cursor sharing, and document synchronization.

**Design Goals:**
- **Provider agnostic** - Works with any real-time backend
- **Bandwidth efficient** - Minimal message size
- **Conflict safe** - Handles concurrent edits gracefully
- **Offline tolerant** - Graceful degradation when disconnected

**Related Specifications:**
- [Azure SignalR Integration](./azure-signalr-integration.md) - Real-time transport
- [Cloud Storage Abstraction](./cloud-storage-abstraction.md) - File sync
- [Real-Time Collaboration](./realtime-collaboration.md) - Architecture overview

---

## Table of Contents

1. [Message Format](#1-message-format)
2. [Presence Protocol](#2-presence-protocol)
3. [Cursor Protocol](#3-cursor-protocol)
4. [Selection Protocol](#4-selection-protocol)
5. [Document Sync Protocol](#5-document-sync-protocol)
6. [Conflict Resolution](#6-conflict-resolution)
7. [Error Handling](#7-error-handling)

---

## 1. Message Format

### 1.1 Base Message Structure

All collaboration messages follow this structure. **Identity is embedded in each message** (not looked up from a server database):

```typescript
interface CollaborationMessage<T = unknown> {
    /** Message type identifier */
    type: MessageType;
    
    /** Sender's user ID (from OAuth 'sub' claim) */
    userId: string;
    
    /** 
     * Sender's identity info (from OAuth token claims)
     * Embedded in every message - no server database lookup!
     */
    userInfo: UserInfo;
    
    /** Document ID (group identifier) */
    documentId: string;
    
    /** Message payload */
    payload: T;
    
    /** Unix timestamp (milliseconds) */
    timestamp: number;
    
    /** Sequence number for ordering */
    sequence?: number;
    
    /** Client-generated message ID */
    messageId?: string;
}

/**
 * User identity extracted from OAuth ID token
 * This travels WITH messages - no server lookup needed
 */
interface UserInfo {
    /** Unique ID from OAuth 'sub' claim */
    id: string;
    
    /** Display name from OAuth 'name' claim */
    displayName: string;
    
    /** Email from OAuth 'email' claim */
    email?: string;
    
    /** Avatar URL from OAuth 'picture' claim */
    avatarUrl?: string;
    
    /** Assigned color for cursor/selection (client-side) */
    color: string;
}

type MessageType = 
    // Presence
    | 'presence:join'
    | 'presence:leave'
    | 'presence:update'
    | 'presence:heartbeat'
    // Cursor
    | 'cursor:move'
    | 'cursor:hide'
    // Selection
    | 'selection:update'
    | 'selection:clear'
    // Document
    | 'document:save'
    | 'document:reload'
    | 'document:lock'
    | 'document:unlock'
    // Operations (future)
    | 'operation:apply'
    | 'operation:ack';
```

### 1.2 Zero-Database Identity in Messages

Story uses a **zero-database identity model** where user identity comes from OAuth tokens, not a server database. Each message carries its own identity context:

```
┌─────────────────────────────────────────────────────────────────┐
│                  IDENTITY IN MESSAGES                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TRADITIONAL APPROACH:                                          │
│  Message: { userId: "abc123", payload: {...} }                 │
│      │                                                          │
│      ▼                                                          │
│  Server looks up: SELECT name, avatar FROM users WHERE id=?    │
│      │                                                          │
│      ▼                                                          │
│  Response includes user details                                 │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  STORY APPROACH (Zero-Database):                               │
│  Message: {                                                     │
│      userId: "abc123",                                          │
│      userInfo: {          ← Identity FROM OAuth token          │
│          id: "abc123",                                          │
│          displayName: "Alice Smith",                           │
│          avatarUrl: "https://...",                             │
│          color: "#FF6B6B"                                       │
│      },                                                         │
│      payload: {...}                                             │
│  }                                                              │
│      │                                                          │
│      ▼                                                          │
│  Receiver uses embedded identity directly                      │
│  NO SERVER DATABASE LOOKUP!                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Creating Messages with Identity

```typescript
class MessageFactory {
    private userInfo: UserInfo;
    
    constructor(authManager: AuthenticationManager, colorManager: ColorManager) {
        // Extract identity from OAuth token (stored in memory after sign-in)
        const user = authManager.getCurrentUser()!;
        
        this.userInfo = {
            id: user.id,                    // From OAuth 'sub' claim
            displayName: user.displayName,  // From OAuth 'name' claim
            email: user.email,              // From OAuth 'email' claim
            avatarUrl: user.avatarUrl,      // From OAuth 'picture' claim
            color: colorManager.getMyColor() // Assigned client-side
        };
    }
    
    /**
     * Create a message with embedded identity
     */
    create<T>(type: MessageType, documentId: string, payload: T): CollaborationMessage<T> {
        return {
            type,
            userId: this.userInfo.id,
            userInfo: this.userInfo,  // Identity travels WITH message
            documentId,
            payload,
            timestamp: Date.now(),
            messageId: crypto.randomUUID()
        };
    }
}

// Usage
const factory = new MessageFactory(authManager, colorManager);

const cursorMessage = factory.create('cursor:move', 'doc_123', {
    slideId: 'slide_001',
    position: { x: 450, y: 280 }
});
// Result includes full userInfo - receiver can render "Alice Smith" cursor
```

### 1.4 Message Compression

For bandwidth efficiency, use short field names in transit:

```typescript
// Wire format (compressed)
interface WireMessage {
    t: string;      // type
    u: string;      // userId
    ui: {           // userInfo (compressed)
        i: string;  // id
        n: string;  // displayName (name)
        a?: string; // avatarUrl
        c: string;  // color
    };
    d: string;      // documentId  
    p: unknown;     // payload
    ts: number;     // timestamp
    s?: number;     // sequence
    m?: string;     // messageId
}

// Compression/decompression utilities
function compress(msg: CollaborationMessage): WireMessage {
    return {
        t: msg.type,
        u: msg.userId,
        ui: {
            i: msg.userInfo.id,
            n: msg.userInfo.displayName,
            a: msg.userInfo.avatarUrl,
            c: msg.userInfo.color
        },
        d: msg.documentId,
        p: msg.payload,
        ts: msg.timestamp,
        s: msg.sequence,
        m: msg.messageId
    };
}

function decompress(wire: WireMessage): CollaborationMessage {
    return {
        type: wire.t as MessageType,
        userId: wire.u,
        userInfo: {
            id: wire.ui.i,
            displayName: wire.ui.n,
            avatarUrl: wire.ui.a,
            color: wire.ui.c
        },
        documentId: wire.d,
        payload: wire.p,
        timestamp: wire.ts,
        sequence: wire.s,
        messageId: wire.m
    };
}
```

---

## 2. Presence Protocol

### 2.1 User Join

When a user opens a shared document, identity comes from OAuth token:

```typescript
interface PresenceJoinPayload {
    // userInfo is in the base message, not duplicated here
    device: {
        type: 'desktop' | 'tablet' | 'mobile';
        browser?: string;
    };
}

// Example message - identity from OAuth token
const joinMessage: CollaborationMessage<PresenceJoinPayload> = {
    type: 'presence:join',
    userId: 'user_abc123',           // From OAuth 'sub' claim
    userInfo: {                      // From OAuth token claims
        id: 'user_abc123',
        displayName: 'Alice Smith',  // From OAuth 'name' claim
        avatarUrl: 'https://...',    // From OAuth 'picture' claim
        color: '#FF6B6B'             // Assigned client-side
    },
    documentId: 'doc_xyz789',
    payload: {
        device: {
            type: 'desktop',
            browser: 'Chrome'
        }
    },
    timestamp: 1701234567890
};
```

**Server Response:**

Since Story uses a zero-database model, the server doesn't maintain a user list. Instead, the joining client receives presence from other clients:

```typescript
/**
 * When user joins, server forwards to group.
 * Other clients respond with their own presence:join
 * This builds the active users list without server database
 */
interface PresenceJoinResponse {
    /** Acknowledgment that join was broadcast */
    acknowledged: boolean;
    
    /** Client's assigned sequence start */
    sequenceStart: number;
}

// Other clients respond with their presence
// This is how the joiner learns who's online
```

### 2.2 User Leave

When a user closes the document or disconnects:

```typescript
interface PresenceLeavePayload {
    reason: 'closed' | 'disconnected' | 'timeout';
}

// Sent by server when user leaves
const leaveMessage: CollaborationMessage<PresenceLeavePayload> = {
    type: 'presence:leave',
    userId: 'user_abc123',
    documentId: 'doc_xyz789',
    payload: {
        reason: 'closed'
    },
    timestamp: 1701234567890
};
```

### 2.3 Presence Update

User status changes (active slide, activity state):

```typescript
interface PresenceUpdatePayload {
    /** Current slide being viewed */
    currentSlideId: string | null;
    
    /** Activity status */
    status: 'active' | 'idle' | 'away';
    
    /** Last interaction timestamp */
    lastActiveAt: number;
    
    /** Editing mode */
    mode?: 'viewing' | 'editing';
}

// Sent every 10 seconds or on significant state change
const updateMessage: CollaborationMessage<PresenceUpdatePayload> = {
    type: 'presence:update',
    userId: 'user_abc123',
    documentId: 'doc_xyz789',
    payload: {
        currentSlideId: 'slide_003',
        status: 'active',
        lastActiveAt: 1701234567890,
        mode: 'editing'
    },
    timestamp: 1701234567890
};
```

### 2.4 Heartbeat

Keep-alive to detect disconnections:

```typescript
interface HeartbeatPayload {
    /** Empty or minimal data */
}

// Sent every 30 seconds
// Server removes user if no heartbeat for 60 seconds
```

### 2.5 Presence State Manager

```typescript
class PresenceManager {
    private users = new Map<string, UserPresence>();
    private heartbeatInterval: number;
    
    constructor(private signalR: SignalRClient) {
        this.setupHeartbeat();
    }
    
    private setupHeartbeat(): void {
        this.heartbeatInterval = setInterval(() => {
            this.signalR.broadcast('presence:heartbeat', {});
            this.removeStaleUsers();
        }, 30000);
    }
    
    /**
     * Handle join - identity comes from message.userInfo (OAuth)
     * No server database lookup!
     */
    handleJoin(message: CollaborationMessage<PresenceJoinPayload>): void {
        const { userId, userInfo } = message;
        
        this.users.set(userId, {
            // Identity FROM the message (which got it from OAuth)
            id: userInfo.id,
            displayName: userInfo.displayName,
            avatarUrl: userInfo.avatarUrl,
            color: userInfo.color,
            // Session state
            joinedAt: message.timestamp,
            lastSeenAt: message.timestamp,
            currentSlideId: null,
            status: 'active'
        });
        
        this.emit('userJoined', this.users.get(userId));
        
        // Respond with our own presence so new user knows we're here
        this.broadcastMyPresence();
    }
    
    handleLeave(message: CollaborationMessage<PresenceLeavePayload>): void {
        const user = this.users.get(message.userId);
        this.users.delete(message.userId);
        this.emit('userLeft', user);
    }
    
    handleUpdate(message: CollaborationMessage<PresenceUpdatePayload>): void {
        const user = this.users.get(message.userId);
        if (!user) {
            // User not known - they might have joined before us
            // Add them from message.userInfo
            this.handleJoin({
                ...message,
                type: 'presence:join',
                payload: { device: { type: 'desktop' } }
            } as CollaborationMessage<PresenceJoinPayload>);
            return;
        }
        
        Object.assign(user, {
            currentSlideId: message.payload.currentSlideId,
            status: message.payload.status,
            lastSeenAt: message.timestamp
        });
        
        this.emit('presenceUpdated', user);
    }
    
    private removeStaleUsers(): void {
        const staleThreshold = Date.now() - 60000; // 60 seconds
        
        for (const [userId, user] of this.users) {
            if (user.lastSeenAt < staleThreshold) {
                this.users.delete(userId);
                this.emit('userTimedOut', user);
            }
        }
    }
    
    getActiveUsers(): UserPresence[] {
        return Array.from(this.users.values());
    }
    
    getUsersOnSlide(slideId: string): UserPresence[] {
        return this.getActiveUsers()
            .filter(u => u.currentSlideId === slideId);
    }
}

interface UserPresence {
    // From OAuth token (via message.userInfo)
    id: string;
    displayName: string;
    avatarUrl?: string;
    color: string;
    // Session state (ephemeral, not persisted)
    joinedAt: number;
    lastSeenAt: number;
    currentSlideId: string | null;
    status: 'active' | 'idle' | 'away';
}
```

---

## 3. Cursor Protocol

### 3.1 Cursor Move

```typescript
interface CursorMovePayload {
    /** Slide where cursor is located */
    slideId: string;
    
    /** Position in slide coordinates (0-1920, 0-1080) */
    position: {
        x: number;
        y: number;
    };
    
    /** Pointer type */
    pointerType: 'mouse' | 'pen' | 'touch';
}

// Sent on mouse/pointer move (throttled to ~20/sec)
const cursorMessage: CollaborationMessage<CursorMovePayload> = {
    type: 'cursor:move',
    userId: 'user_abc123',
    documentId: 'doc_xyz789',
    payload: {
        slideId: 'slide_003',
        position: { x: 450, y: 280 },
        pointerType: 'mouse'
    },
    timestamp: 1701234567890
};
```

### 3.2 Cursor Hide

```typescript
interface CursorHidePayload {
    reason: 'left-slide' | 'idle' | 'outside-canvas';
}

// Sent when cursor should be hidden
const hideMessage: CollaborationMessage<CursorHidePayload> = {
    type: 'cursor:hide',
    userId: 'user_abc123',
    documentId: 'doc_xyz789',
    payload: {
        reason: 'left-slide'
    },
    timestamp: 1701234567890
};
```

### 3.3 Cursor Renderer

```typescript
class RemoteCursorRenderer {
    private cursors = new Map<string, CursorState>();
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    
    constructor(overlayCanvas: HTMLCanvasElement) {
        this.canvas = overlayCanvas;
        this.ctx = overlayCanvas.getContext('2d')!;
    }
    
    updateCursor(userId: string, data: CursorMovePayload, userInfo: UserPresence): void {
        this.cursors.set(userId, {
            ...data,
            user: userInfo,
            lastUpdate: Date.now()
        });
        
        this.render();
    }
    
    hideCursor(userId: string): void {
        this.cursors.delete(userId);
        this.render();
    }
    
    render(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (const [userId, cursor] of this.cursors) {
            if (cursor.slideId !== this.currentSlideId) continue;
            
            this.drawCursor(cursor);
        }
    }
    
    private drawCursor(cursor: CursorState): void {
        const { position, user } = cursor;
        const { x, y } = this.toCanvasCoords(position);
        
        // Draw cursor arrow
        this.ctx.save();
        this.ctx.translate(x, y);
        
        // Arrow shape
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(0, 16);
        this.ctx.lineTo(4, 12);
        this.ctx.lineTo(8, 20);
        this.ctx.lineTo(10, 19);
        this.ctx.lineTo(6, 11);
        this.ctx.lineTo(11, 11);
        this.ctx.closePath();
        
        this.ctx.fillStyle = user.color;
        this.ctx.fill();
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // Name label
        this.ctx.fillStyle = user.color;
        this.ctx.fillRect(12, 14, this.measureText(user.displayName) + 8, 18);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px system-ui';
        this.ctx.fillText(user.displayName, 16, 27);
        
        this.ctx.restore();
    }
    
    // Hide cursors that haven't updated in 5 seconds
    cleanupStaleCursors(): void {
        const staleThreshold = Date.now() - 5000;
        
        for (const [userId, cursor] of this.cursors) {
            if (cursor.lastUpdate < staleThreshold) {
                this.cursors.delete(userId);
            }
        }
        
        this.render();
    }
}

interface CursorState extends CursorMovePayload {
    user: UserPresence;
    lastUpdate: number;
}
```

---

## 4. Selection Protocol

### 4.1 Selection Update

```typescript
interface SelectionUpdatePayload {
    /** Slide containing selected elements */
    slideId: string;
    
    /** Selected element IDs */
    elementIds: string[];
    
    /** Selection bounds (for rendering highlight) */
    bounds?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

const selectionMessage: CollaborationMessage<SelectionUpdatePayload> = {
    type: 'selection:update',
    userId: 'user_abc123',
    documentId: 'doc_xyz789',
    payload: {
        slideId: 'slide_003',
        elementIds: ['elem_001', 'elem_002'],
        bounds: { x: 100, y: 200, width: 300, height: 150 }
    },
    timestamp: 1701234567890
};
```

### 4.2 Selection Clear

```typescript
interface SelectionClearPayload {
    slideId?: string;  // If undefined, cleared from all slides
}

const clearMessage: CollaborationMessage<SelectionClearPayload> = {
    type: 'selection:clear',
    userId: 'user_abc123',
    documentId: 'doc_xyz789',
    payload: {},
    timestamp: 1701234567890
};
```

### 4.3 Selection Indicator Renderer

```typescript
class RemoteSelectionRenderer {
    private selections = new Map<string, SelectionState>();
    
    updateSelection(userId: string, data: SelectionUpdatePayload, userInfo: UserPresence): void {
        this.selections.set(userId, {
            ...data,
            user: userInfo
        });
        
        this.renderSelectionIndicators();
    }
    
    clearSelection(userId: string): void {
        this.selections.delete(userId);
        this.renderSelectionIndicators();
    }
    
    private renderSelectionIndicators(): void {
        // Remove old indicators
        document.querySelectorAll('.remote-selection').forEach(el => el.remove());
        
        for (const [userId, selection] of this.selections) {
            if (selection.slideId !== this.currentSlideId) continue;
            
            // Render selection box around each selected element
            for (const elementId of selection.elementIds) {
                this.renderElementSelection(elementId, selection.user);
            }
        }
    }
    
    private renderElementSelection(elementId: string, user: UserPresence): void {
        const element = document.querySelector(`[data-element-id="${elementId}"]`);
        if (!element) return;
        
        const rect = element.getBoundingClientRect();
        const indicator = document.createElement('div');
        
        indicator.className = 'remote-selection';
        indicator.style.cssText = `
            position: absolute;
            left: ${rect.left - 2}px;
            top: ${rect.top - 2}px;
            width: ${rect.width + 4}px;
            height: ${rect.height + 4}px;
            border: 2px dashed ${user.color};
            border-radius: 4px;
            pointer-events: none;
            z-index: 1000;
        `;
        
        // Add user label
        const label = document.createElement('span');
        label.textContent = user.displayName;
        label.style.cssText = `
            position: absolute;
            top: -20px;
            left: 0;
            background: ${user.color};
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 11px;
        `;
        indicator.appendChild(label);
        
        document.body.appendChild(indicator);
    }
}
```

### 4.4 Selection Conflict Prevention

```typescript
class SelectionConflictManager {
    /**
     * Check if selecting an element would conflict with another user's selection
     */
    canSelect(elementId: string): SelectionPermission {
        for (const [userId, selection] of this.selections) {
            if (userId === this.currentUserId) continue;
            
            if (selection.elementIds.includes(elementId)) {
                return {
                    allowed: true,  // Allow concurrent selection
                    warning: `Also selected by ${selection.user.displayName}`,
                    conflictUserId: userId
                };
            }
        }
        
        return { allowed: true };
    }
    
    /**
     * Check if editing would conflict with another user
     */
    canEdit(elementId: string): EditPermission {
        for (const [userId, selection] of this.selections) {
            if (userId === this.currentUserId) continue;
            
            if (selection.elementIds.includes(elementId)) {
                return {
                    allowed: true,
                    warning: `${selection.user.displayName} is also editing this element`,
                    conflictUserId: userId,
                    suggestLock: true
                };
            }
        }
        
        return { allowed: true };
    }
}

interface SelectionPermission {
    allowed: boolean;
    warning?: string;
    conflictUserId?: string;
}

interface EditPermission extends SelectionPermission {
    suggestLock?: boolean;
}
```

---

## 5. Document Sync Protocol

### 5.1 Document Save Notification

```typescript
interface DocumentSavePayload {
    /** New version/etag after save */
    version: string;
    
    /** Summary of changes */
    changes: {
        slidesModified: string[];
        slidesAdded: string[];
        slidesDeleted: string[];
        elementsModified: number;
    };
    
    /** Storage provider used */
    storageProvider: 'onedrive' | 'google-drive' | 'local';
}

const saveMessage: CollaborationMessage<DocumentSavePayload> = {
    type: 'document:save',
    userId: 'user_abc123',
    documentId: 'doc_xyz789',
    payload: {
        version: 'v42',
        changes: {
            slidesModified: ['slide_003', 'slide_005'],
            slidesAdded: [],
            slidesDeleted: [],
            elementsModified: 5
        },
        storageProvider: 'onedrive'
    },
    timestamp: 1701234567890
};
```

### 5.2 Reload Request

When a user should reload to get latest changes:

```typescript
interface DocumentReloadPayload {
    reason: 'external-change' | 'conflict-resolved' | 'version-updated';
    newVersion: string;
    urgency: 'immediate' | 'suggested' | 'optional';
}

const reloadMessage: CollaborationMessage<DocumentReloadPayload> = {
    type: 'document:reload',
    userId: 'system',  // System-generated
    documentId: 'doc_xyz789',
    payload: {
        reason: 'external-change',
        newVersion: 'v43',
        urgency: 'suggested'
    },
    timestamp: 1701234567890
};
```

### 5.3 Element Lock (Future Enhancement)

```typescript
interface DocumentLockPayload {
    /** Elements to lock */
    elementIds: string[];
    
    /** Lock duration in seconds */
    duration: number;
    
    /** Lock reason */
    reason: 'editing' | 'dragging' | 'text-input';
}

interface DocumentUnlockPayload {
    elementIds: string[];
}

// User A starts editing text
// → Sends lock message
// → Other users see "User A is editing" and can't select

// After 30 seconds or on blur
// → Sends unlock message
// → Element available again
```

### 5.4 Sync Manager

```typescript
class DocumentSyncManager {
    private localVersion: string;
    private pendingChanges: DocumentChange[] = [];
    
    constructor(
        private cloudStorage: CloudStorageProvider,
        private signalR: SignalRClient
    ) {
        this.setupListeners();
    }
    
    private setupListeners(): void {
        this.signalR.on('document:save', (message) => {
            this.handleRemoteSave(message);
        });
        
        this.signalR.on('document:reload', (message) => {
            this.handleReloadRequest(message);
        });
    }
    
    async save(): Promise<void> {
        // Save to cloud storage
        const result = await this.cloudStorage.save({
            fileId: this.documentId,
            content: await this.serializeDocument(),
            expectedEtag: this.localVersion,
            onConflict: 'fail'
        });
        
        if (result.conflictDetected) {
            // Handle conflict
            await this.handleConflict(result.serverVersion);
            return;
        }
        
        // Update local version
        this.localVersion = result.file.etag;
        
        // Notify other users
        await this.signalR.broadcast('document:save', {
            version: this.localVersion,
            changes: this.summarizeChanges(),
            storageProvider: this.cloudStorage.providerId
        });
    }
    
    private async handleRemoteSave(message: CollaborationMessage<DocumentSavePayload>): Promise<void> {
        // Another user saved
        // Check if we have unsaved changes
        if (this.hasUnsavedChanges()) {
            // Show notification
            this.showNotification(`${message.userId} saved changes. You have unsaved changes.`);
        } else {
            // Auto-reload if no conflicts
            await this.reload();
        }
    }
    
    private async handleReloadRequest(message: CollaborationMessage<DocumentReloadPayload>): Promise<void> {
        switch (message.payload.urgency) {
            case 'immediate':
                await this.reload();
                break;
            case 'suggested':
                this.showReloadPrompt(message.payload.reason);
                break;
            case 'optional':
                this.showReloadHint();
                break;
        }
    }
}
```

---

## 6. Conflict Resolution

### 6.1 Conflict Types

```typescript
enum ConflictType {
    /** Same property changed by multiple users */
    PROPERTY_CONFLICT = 'property_conflict',
    
    /** Element deleted while another user was editing */
    EDIT_DELETE_CONFLICT = 'edit_delete_conflict',
    
    /** Slide deleted while another user was viewing */
    SLIDE_DELETE_CONFLICT = 'slide_delete_conflict',
    
    /** Concurrent saves to cloud storage */
    STORAGE_CONFLICT = 'storage_conflict'
}

interface Conflict {
    type: ConflictType;
    elementId?: string;
    slideId?: string;
    localValue?: any;
    remoteValue?: any;
    remoteUserId: string;
    remoteTimestamp: number;
}
```

### 6.2 Resolution Strategies

```typescript
class ConflictResolver {
    /**
     * Automatically resolve non-destructive conflicts
     */
    autoResolve(conflict: Conflict): Resolution | null {
        switch (conflict.type) {
            case ConflictType.PROPERTY_CONFLICT:
                // Last write wins for simple properties
                if (conflict.remoteTimestamp > this.localTimestamp) {
                    return { action: 'accept-remote' };
                }
                return { action: 'keep-local' };
                
            case ConflictType.EDIT_DELETE_CONFLICT:
                // Preserve edits over deletes (user intent to keep)
                return { action: 'resurrect-and-apply' };
                
            default:
                // Requires user decision
                return null;
        }
    }
    
    /**
     * Show conflict resolution UI
     */
    async promptUser(conflict: Conflict): Promise<Resolution> {
        return new Promise((resolve) => {
            this.showConflictDialog({
                conflict,
                onKeepMine: () => resolve({ action: 'keep-local' }),
                onKeepTheirs: () => resolve({ action: 'accept-remote' }),
                onMerge: () => resolve({ action: 'merge' }),
                onSaveAsCopy: () => resolve({ action: 'save-copy' })
            });
        });
    }
}

interface Resolution {
    action: 'keep-local' | 'accept-remote' | 'merge' | 'save-copy' | 'resurrect-and-apply';
    mergedValue?: any;
}
```

### 6.3 Conflict UI

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️  Editing Conflict                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  You and Alice modified the same text at the same time.        │
│                                                                 │
│  ┌──────────────────────┐  ┌──────────────────────┐            │
│  │ Your Version         │  │ Alice's Version      │            │
│  │                      │  │                      │            │
│  │ "Welcome to our      │  │ "Welcome to our      │            │
│  │  product launch"     │  │  exciting launch"    │            │
│  │                      │  │                      │            │
│  │ Modified: Just now   │  │ Modified: 5 sec ago  │            │
│  └──────────────────────┘  └──────────────────────┘            │
│                                                                 │
│  [Keep Mine]  [Keep Alice's]  [Keep Both]  [Cancel]            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Error Handling

### 7.1 Error Types

```typescript
enum CollaborationError {
    /** Connection lost */
    DISCONNECTED = 'disconnected',
    
    /** Failed to send message */
    SEND_FAILED = 'send_failed',
    
    /** Message received out of order */
    SEQUENCE_ERROR = 'sequence_error',
    
    /** Unknown message type */
    UNKNOWN_MESSAGE = 'unknown_message',
    
    /** Rate limit exceeded */
    RATE_LIMITED = 'rate_limited',
    
    /** Permission denied */
    UNAUTHORIZED = 'unauthorized'
}
```

### 7.2 Error Recovery

```typescript
class CollaborationErrorHandler {
    handleError(error: CollaborationError, context?: any): void {
        switch (error) {
            case CollaborationError.DISCONNECTED:
                this.showReconnecting();
                this.scheduleReconnect();
                break;
                
            case CollaborationError.SEND_FAILED:
                this.queueForRetry(context.message);
                break;
                
            case CollaborationError.RATE_LIMITED:
                this.increaseThrottling();
                this.showWarning('Slowing down updates');
                break;
                
            case CollaborationError.UNAUTHORIZED:
                this.promptReauthentication();
                break;
        }
    }
    
    private scheduleReconnect(): void {
        const delays = [1000, 2000, 5000, 10000, 30000];
        let attempt = 0;
        
        const tryConnect = async () => {
            try {
                await this.signalR.connect();
                this.showConnected();
            } catch {
                if (attempt < delays.length) {
                    setTimeout(tryConnect, delays[attempt++]);
                } else {
                    this.showOfflineMode();
                }
            }
        };
        
        tryConnect();
    }
}
```

### 7.3 Graceful Degradation

```typescript
class CollaborationDegradation {
    private connectionState: 'connected' | 'degraded' | 'offline' = 'connected';
    
    setDegradedMode(): void {
        this.connectionState = 'degraded';
        
        // Reduce update frequency
        this.cursorThrottle = 500;  // Was 50ms
        this.presenceInterval = 30000;  // Was 10000ms
        
        // Disable non-essential features
        this.enableCursors = false;
        this.enableSelections = false;
        
        // Keep critical features
        this.enablePresence = true;
        this.enableSaveNotifications = true;
    }
    
    setOfflineMode(): void {
        this.connectionState = 'offline';
        
        // Queue all messages for later
        this.enableQueueing = true;
        
        // Show offline indicator
        this.showOfflineStatus();
        
        // Continue local editing
        this.enableLocalEditing = true;
    }
}
```

---

## Message Flow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER A OPENS DOCUMENT                        │
├─────────────────────────────────────────────────────────────────┤
│  1. Connect to SignalR                                          │
│  2. Send: presence:join                                         │
│  3. Receive: activeUsers list                                   │
│  4. Start heartbeat interval                                    │
├─────────────────────────────────────────────────────────────────┤
│                    USER A MOVES CURSOR                          │
├─────────────────────────────────────────────────────────────────┤
│  5. Send: cursor:move (throttled)                               │
│  6. Other users render cursor                                   │
├─────────────────────────────────────────────────────────────────┤
│                    USER A SELECTS ELEMENT                       │
├─────────────────────────────────────────────────────────────────┤
│  7. Send: selection:update                                      │
│  8. Other users render selection indicator                      │
├─────────────────────────────────────────────────────────────────┤
│                    USER A SAVES                                 │
├─────────────────────────────────────────────────────────────────┤
│  9. Save to cloud storage (OneDrive/Google Drive)              │
│  10. Send: document:save                                        │
│  11. Other users: prompt to reload or auto-sync                │
├─────────────────────────────────────────────────────────────────┤
│                    USER A CLOSES DOCUMENT                       │
├─────────────────────────────────────────────────────────────────┤
│  12. Send: presence:leave                                       │
│  13. Other users: remove cursor/selection, update presence     │
│  14. Disconnect from SignalR                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Related Documents

- [Azure SignalR Integration](./azure-signalr-integration.md)
- [Cloud Storage Abstraction](./cloud-storage-abstraction.md)
- [Real-Time Collaboration](./realtime-collaboration.md)

---

*This protocol is designed to be transport-agnostic and can work with any real-time messaging provider.*
