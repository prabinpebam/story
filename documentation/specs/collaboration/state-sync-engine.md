# State Synchronization Engine - Specification

## Overview

This specification defines the **state synchronization engine** for real-time collaborative editing in Story. It covers operation-based state management, vector clocks for causal ordering, offline editing with resync, and conflict resolution strategies.

**Key Design Goals:**
- **Optimistic UI** - Changes appear instantly, sync in background
- **Eventual consistency** - All clients converge to same state
- **Offline-first** - Full editing capability when disconnected
- **Per-user undo** - Each user's undo is independent

**Related Specifications:**
- [Collaboration Protocol](./collaboration-protocol.md) - Message types and formats
- [Azure SignalR Integration](./azure-signalr-integration.md) - Transport layer
- [Cloud Storage Abstraction](./cloud-storage-abstraction.md) - File persistence
- [Undo/Redo System](../core/undo-redo.md) - Current history contract; collaboration-safe local undo remains a product gap

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Operation-Based State](#2-operation-based-state)
3. [Vector Clocks](#3-vector-clocks)
4. [Operational Transformation](#4-operational-transformation)
5. [Per-User Undo/Redo](#5-per-user-undoredo)
6. [Offline Support](#6-offline-support)
7. [Resync Protocol](#7-resync-protocol)
8. [Conflict Resolution](#8-conflict-resolution)
9. [Initial Sync Protocol](#9-initial-sync-protocol)
10. [Text Editing OT](#10-text-editing-ot)
11. [Error Recovery](#11-error-recovery)
12. [UX Patterns](#12-ux-patterns)
13. [Performance Limits](#13-performance-limits)
14. [Testing Strategy](#14-testing-strategy)
15. [Implementation](#15-implementation)

---

## 1. Architecture Overview

### 1.1 Three Data Channels

The collaboration system uses three separate channels for different data types:

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA SYNCHRONIZATION CHANNELS                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CHANNEL 1: SignalR (Real-Time, Small Data)                    │
│  ├── Operations (add/move/delete/modify objects)               │
│  ├── Cursor positions (throttled to ~20/sec)                   │
│  ├── Selection changes                                          │
│  ├── Presence (join/leave/heartbeat)                           │
│  └── Max message size: ~64KB                                    │
│                                                                 │
│  CHANNEL 2: Cloud Storage (Large Files, Persistence)           │
│  ├── The main .story file (periodic save)                      │
│  ├── Embedded assets (images, videos, fonts)                   │
│  ├── Version history snapshots                                  │
│  └── Operation log (for offline resync)                        │
│                                                                 │
│  CHANNEL 3: Byte-Range Requests (Asset Streaming)              │
│  ├── Collaborators read assets directly from .story file       │
│  ├── HTTP Range headers for partial file access                │
│  └── No relay through SignalR or your browser                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Sync Method Summary

| Data Type | Sync Method | Latency | Typical Size | Notes |
|-----------|-------------|---------|--------------|-------|
| Cursor movement | SignalR | ~50ms | ~100 bytes | Throttled to 20/sec |
| Shape added/moved | SignalR (operation) | ~100ms | ~500 bytes - 2KB | Only delta, not full doc |
| Text edited | SignalR (operation) | ~100ms | ~200 bytes - 1KB | Character-level ops |
| Property changed | SignalR (operation) | ~100ms | ~200 bytes | Single property update |
| Selection changed | SignalR | ~100ms | ~200 bytes | Element IDs only |
| Image added | Upload → SignalR ref | 1-5s | Reference ~500 bytes | Binary data NOT in SignalR |
| Video added | Upload → SignalR ref | Varies | Reference ~500 bytes | Streams from cloud |
| Full file save | Cloud Storage | 1-10s | Unlimited | Periodic persistence |
| User presence | SignalR | ~100ms | ~300 bytes | Join/leave/heartbeat |

### 1.3 Large Media Handling

**Key insight:** Large files (videos, high-res images) are NEVER sent through SignalR. They follow a different path:

```
┌─────────────────────────────────────────────────────────────────┐
│  YOU (Adding a video)                                           │
│                                                                 │
│  1. Drop video file (500MB)                                     │
│  2. Upload to .story file in cloud storage                     │
│  3. Create operation with reference: { mediaRef: "assets/..." }│
│  4. SignalR broadcasts operation (~500 bytes)                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ SignalR (~500 bytes, NOT 500MB!)
┌─────────────────────────────────────────────────────────────────┐
│  COLLABORATOR'S BROWSER                                         │
│                                                                 │
│  1. Receives operation: { type: "video", mediaRef: "assets/..." }
│  2. Looks up byte offset in assetIndex                         │
│  3. Issues HTTP Range request to cloud storage                 │
│  4. Video streams directly from OneDrive/Google Drive          │
│  5. NO video data through SignalR!                              │
└─────────────────────────────────────────────────────────────────┘
```

**Large File Flow:**

| Step | Action | Data Size | Channel |
|------|--------|-----------|---------|
| 1 | You drop 500MB video | Local only | - |
| 2 | Upload to .story file | 500MB → Cloud | Cloud Storage |
| 3 | SignalR broadcasts reference | ~500 bytes | SignalR |
| 4 | Others receive reference | ~500 bytes | SignalR |
| 5 | Others stream video | Direct from cloud | Byte-Range |

### 1.4 State Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  USER ACTION                                                    │
│  (e.g., add rectangle)                                          │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. CREATE OPERATION                                            │
│     { type: "insert", path: [...], value: {...} }              │
└─────────────────────┬───────────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
┌─────────────────────┐  ┌────────────────────────────────────────┐
│  2a. APPLY LOCALLY  │  │  2b. BROADCAST VIA SIGNALR            │
│  (Optimistic UI)    │  │  (With vector clock)                  │
└─────────────────────┘  └────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. OTHER CLIENTS RECEIVE                                       │
│     - Check vector clock                                        │
│     - Transform if needed                                       │
│     - Apply to local state                                      │
│     - Update vector clock                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Operation-Based State

### 2.1 Operation Structure

All document changes are represented as operations:

```typescript
interface Operation {
    /** Unique operation ID */
    id: string;
    
    /** User who created this operation */
    userId: string;
    
    /** Operation type */
    type: OperationType;
    
    /** Path to affected element */
    path: OperationPath;
    
    /** New value (for insert/update) */
    value?: any;
    
    /** Previous value (for undo) */
    previousValue?: any;
    
    /** Timestamp (client time) */
    timestamp: number;
    
    /** Vector clock at time of creation */
    vectorClock: VectorClock;
    
    /** Sequence number within this user's operations */
    sequence: number;
}

type OperationType = 
    | 'insert'      // Add new element
    | 'delete'      // Remove element
    | 'update'      // Modify property
    | 'move'        // Change position/order
    | 'reorder';    // Change z-index/layer order

type OperationPath = (string | number)[];
// Examples:
// ["slides", "slide-001", "objects", 0, "fill", "color"]
// ["slides", "slide-002"]
// ["metadata", "title"]
```

### 2.2 Operation Examples

**Insert a rectangle:**
```typescript
{
    id: "op-abc123",
    userId: "user-alice",
    type: "insert",
    path: ["slides", "slide-001", "objects"],
    value: {
        id: "rect-xyz789",
        type: "rectangle",
        x: 100, y: 200,
        width: 300, height: 150,
        fill: { type: "solid", color: "#3B82F6" }
    },
    timestamp: 1732780000000,
    vectorClock: { "user-alice": 5, "user-bob": 3 },
    sequence: 5
}
```

**Update a property:**
```typescript
{
    id: "op-def456",
    userId: "user-bob",
    type: "update",
    path: ["slides", "slide-001", "objects", 0, "fill", "color"],
    value: "#EF4444",
    previousValue: "#3B82F6",
    timestamp: 1732780001000,
    vectorClock: { "user-alice": 5, "user-bob": 4 },
    sequence: 4
}
```

**Delete an element:**
```typescript
{
    id: "op-ghi789",
    userId: "user-alice",
    type: "delete",
    path: ["slides", "slide-001", "objects", 0],
    previousValue: { /* full element for undo */ },
    timestamp: 1732780002000,
    vectorClock: { "user-alice": 6, "user-bob": 4 },
    sequence: 6
}
```

### 2.3 What Gets Sent (Minimal Payload)

Only the **operation** is sent, not the entire document:

```typescript
// SignalR message payload (small!)
interface OperationMessage {
    t: "op";                    // type
    o: Operation;               // operation
    vc: VectorClock;            // vector clock
}

// Typical message size: 200-500 bytes
// vs. full document: 100KB-10MB
```

---

## 3. Vector Clocks

### 3.1 What is a Vector Clock?

A vector clock tracks the logical time for each participant, enabling **causal ordering** of operations:

```typescript
interface VectorClock {
    [userId: string]: number;
}

// Example: After some editing
{
    "user-alice": 5,   // Alice has made 5 operations
    "user-bob": 3,     // Bob has made 3 operations
    "user-carol": 7    // Carol has made 7 operations
}
```

### 3.2 Vector Clock Rules

```typescript
class VectorClockManager {
    private clock: VectorClock = {};
    private userId: string;
    
    /**
     * Increment my clock when I create an operation
     */
    tick(): VectorClock {
        this.clock[this.userId] = (this.clock[this.userId] || 0) + 1;
        return { ...this.clock };
    }
    
    /**
     * Merge received clock with mine
     */
    merge(received: VectorClock): void {
        for (const [userId, count] of Object.entries(received)) {
            this.clock[userId] = Math.max(this.clock[userId] || 0, count);
        }
    }
    
    /**
     * Check if I've seen all operations that precede this one
     */
    canApply(opClock: VectorClock, opUserId: string): boolean {
        for (const [userId, count] of Object.entries(opClock)) {
            if (userId === opUserId) {
                // This user's count should be exactly 1 more than what I've seen
                if (count !== (this.clock[userId] || 0) + 1) {
                    return false;
                }
            } else {
                // Other users' counts should be <= what I've seen
                if (count > (this.clock[userId] || 0)) {
                    return false;
                }
            }
        }
        return true;
    }
    
    /**
     * Compare two clocks to determine ordering
     */
    compare(a: VectorClock, b: VectorClock): 'before' | 'after' | 'concurrent' {
        let aBeforeB = false;
        let bBeforeA = false;
        
        const allUsers = new Set([...Object.keys(a), ...Object.keys(b)]);
        
        for (const userId of allUsers) {
            const aCount = a[userId] || 0;
            const bCount = b[userId] || 0;
            
            if (aCount < bCount) aBeforeB = true;
            if (bCount < aCount) bBeforeA = true;
        }
        
        if (aBeforeB && !bBeforeA) return 'before';
        if (bBeforeA && !aBeforeB) return 'after';
        return 'concurrent';
    }
}
```

### 3.3 Operation Buffering

When an operation arrives out of order, buffer it until prerequisites are met:

```typescript
class OperationBuffer {
    private pending: Operation[] = [];
    
    /**
     * Add operation to buffer if it can't be applied yet
     */
    buffer(op: Operation): void {
        this.pending.push(op);
        this.pending.sort((a, b) => this.compareByDependency(a, b));
    }
    
    /**
     * Try to apply buffered operations
     */
    flush(vectorClock: VectorClockManager, apply: (op: Operation) => void): void {
        let applied = true;
        
        while (applied) {
            applied = false;
            
            for (let i = 0; i < this.pending.length; i++) {
                const op = this.pending[i];
                
                if (vectorClock.canApply(op.vectorClock, op.userId)) {
                    apply(op);
                    vectorClock.merge(op.vectorClock);
                    this.pending.splice(i, 1);
                    applied = true;
                    break;
                }
            }
        }
    }
}
```

---

## 4. Operational Transformation

### 4.1 Why OT is Needed

When two users edit concurrently, their operations may conflict:

```
Timeline:
T=0: Document state: [A, B, C]
T=1: Alice inserts X at position 1 → [A, X, B, C]
T=1: Bob inserts Y at position 2 → [A, B, Y, C]  (from his view)

Without OT:
- Alice's view: [A, X, B, C] + Bob's op (insert Y at 2) = [A, X, Y, B, C] ❌
- Bob's view: [A, B, Y, C] + Alice's op (insert X at 1) = [A, X, B, Y, C] ❌
- Different results!

With OT:
- Transform Bob's op against Alice's: insert Y at position 3 (shifted by 1)
- Alice's view: [A, X, B, C] + transformed = [A, X, B, Y, C] ✓
- Bob's view: [A, B, Y, C] + Alice's = [A, X, B, Y, C] ✓
- Same result!
```

### 4.2 Transform Functions

```typescript
class OperationalTransformer {
    /**
     * Transform operation B against operation A
     * Returns the transformed B that achieves the same intent
     * given that A has already been applied
     */
    transform(opA: Operation, opB: Operation): Operation {
        // Same user's operations are already ordered
        if (opA.userId === opB.userId) {
            return opB;
        }
        
        // Dispatch to specific transform function
        const key = `${opA.type}_${opB.type}`;
        const transformer = this.transformers[key];
        
        if (transformer) {
            return transformer(opA, opB);
        }
        
        // Default: no transformation needed
        return opB;
    }
    
    private transformers = {
        /**
         * Insert vs Insert
         */
        insert_insert: (opA: Operation, opB: Operation): Operation => {
            if (!this.samePath(opA.path, opB.path)) return opB;
            
            const indexA = opA.path[opA.path.length - 1] as number;
            const indexB = opB.path[opB.path.length - 1] as number;
            
            if (indexA <= indexB) {
                // A inserted before B, shift B's index
                return {
                    ...opB,
                    path: [...opB.path.slice(0, -1), indexB + 1]
                };
            }
            
            return opB;
        },
        
        /**
         * Delete vs Insert
         */
        delete_insert: (opA: Operation, opB: Operation): Operation => {
            if (!this.samePath(opA.path, opB.path)) return opB;
            
            const indexA = opA.path[opA.path.length - 1] as number;
            const indexB = opB.path[opB.path.length - 1] as number;
            
            if (indexA < indexB) {
                // A deleted before B, shift B's index down
                return {
                    ...opB,
                    path: [...opB.path.slice(0, -1), indexB - 1]
                };
            }
            
            return opB;
        },
        
        /**
         * Insert vs Delete
         */
        insert_delete: (opA: Operation, opB: Operation): Operation => {
            if (!this.samePath(opA.path, opB.path)) return opB;
            
            const indexA = opA.path[opA.path.length - 1] as number;
            const indexB = opB.path[opB.path.length - 1] as number;
            
            if (indexA <= indexB) {
                // A inserted before B, shift B's index up
                return {
                    ...opB,
                    path: [...opB.path.slice(0, -1), indexB + 1]
                };
            }
            
            return opB;
        },
        
        /**
         * Delete vs Delete
         */
        delete_delete: (opA: Operation, opB: Operation): Operation => {
            if (!this.samePath(opA.path, opB.path)) return opB;
            
            const indexA = opA.path[opA.path.length - 1] as number;
            const indexB = opB.path[opB.path.length - 1] as number;
            
            if (indexA === indexB) {
                // Both deleting same element - B becomes no-op
                return { ...opB, type: 'noop' as any };
            }
            
            if (indexA < indexB) {
                // A deleted before B, shift B's index down
                return {
                    ...opB,
                    path: [...opB.path.slice(0, -1), indexB - 1]
                };
            }
            
            return opB;
        },
        
        /**
         * Update vs Update (same property)
         */
        update_update: (opA: Operation, opB: Operation): Operation => {
            if (!this.sameExactPath(opA.path, opB.path)) return opB;
            
            // Both updating same property - last write wins
            // The one with higher timestamp wins
            if (opA.timestamp > opB.timestamp) {
                // A wins, B becomes no-op
                return { ...opB, type: 'noop' as any };
            }
            
            // B wins (or tie goes to B since it arrived later)
            return opB;
        }
    };
    
    private samePath(a: OperationPath, b: OperationPath): boolean {
        // Check if paths point to same array (ignoring last index)
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length - 1; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }
    
    private sameExactPath(a: OperationPath, b: OperationPath): boolean {
        if (a.length !== b.length) return false;
        return a.every((v, i) => v === b[i]);
    }
}
```

---

## 5. Per-User Undo/Redo

### 5.1 The Challenge

In collaborative editing, undo must only affect the current user's actions:

```
Timeline:
1. Alice: Add rectangle
2. Bob: Add circle
3. Alice: Move rectangle
4. Bob: Change circle color

If Alice presses Ctrl+Z:
- Should undo HER "Move rectangle" (step 3)
- Should NOT affect Bob's changes
```

### 5.2 Undo Stack Per User

```typescript
interface UndoManager {
    // Each user has their own undo/redo stack
    stacks: {
        [userId: string]: {
            undoStack: Operation[];
            redoStack: Operation[];
        }
    };
}

class CollaborativeUndoManager {
    private stacks = new Map<string, { undo: Operation[], redo: Operation[] }>();
    private currentUserId: string;
    
    constructor(userId: string) {
        this.currentUserId = userId;
        this.stacks.set(userId, { undo: [], redo: [] });
    }
    
    /**
     * Record an operation for undo
     */
    recordOperation(op: Operation): void {
        const stack = this.getStack(op.userId);
        stack.undo.push(op);
        
        // Clear redo stack when new operation is made
        if (op.userId === this.currentUserId) {
            stack.redo = [];
        }
    }
    
    /**
     * Undo the current user's last operation
     */
    undo(): Operation | null {
        const stack = this.getStack(this.currentUserId);
        const op = stack.undo.pop();
        
        if (!op) return null;
        
        // Create inverse operation
        const inverseOp = this.createInverse(op);
        
        // Push to redo stack
        stack.redo.push(op);
        
        return inverseOp;
    }
    
    /**
     * Redo the current user's last undone operation
     */
    redo(): Operation | null {
        const stack = this.getStack(this.currentUserId);
        const op = stack.redo.pop();
        
        if (!op) return null;
        
        // Push back to undo stack
        stack.undo.push(op);
        
        return op;
    }
    
    /**
     * Create the inverse of an operation
     */
    private createInverse(op: Operation): Operation {
        switch (op.type) {
            case 'insert':
                return {
                    ...op,
                    id: this.generateId(),
                    type: 'delete',
                    previousValue: op.value,
                    value: undefined
                };
                
            case 'delete':
                return {
                    ...op,
                    id: this.generateId(),
                    type: 'insert',
                    value: op.previousValue,
                    previousValue: undefined
                };
                
            case 'update':
                return {
                    ...op,
                    id: this.generateId(),
                    value: op.previousValue,
                    previousValue: op.value
                };
                
            case 'move':
                return {
                    ...op,
                    id: this.generateId(),
                    value: op.previousValue,
                    previousValue: op.value
                };
                
            default:
                throw new Error(`Cannot invert operation type: ${op.type}`);
        }
    }
    
    private getStack(userId: string) {
        if (!this.stacks.has(userId)) {
            this.stacks.set(userId, { undo: [], redo: [] });
        }
        return this.stacks.get(userId)!;
    }
    
    private generateId(): string {
        return `op-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }
}
```

### 5.3 Undo Broadcast

When a user undoes, the inverse operation is broadcast like any other operation:

```typescript
async function handleUndo() {
    const inverseOp = undoManager.undo();
    
    if (!inverseOp) return;
    
    // Apply locally
    applyOperation(inverseOp);
    
    // Broadcast to others
    await signalR.broadcast('operation:apply', {
        operation: inverseOp,
        isUndo: true,  // Metadata for UI feedback
        originalOpId: inverseOp.previousValue  // Reference to undone op
    });
}
```

### 5.4 What Others See

```typescript
// When Bob receives Alice's undo operation
{
    type: "delete",
    path: ["slides", "slide-001", "objects", 2],
    userId: "user-alice",
    isUndo: true,
    // ...
}

// UI can show: "Alice undid: Add rectangle"
// Bob's undo stack is UNAFFECTED
```

---

## 6. Offline Support

### 6.1 Offline State

When disconnected, the client continues to work locally:

```typescript
interface OfflineState {
    /** When we went offline */
    offlineSince: number;
    
    /** Last synced vector clock */
    lastSyncedClock: VectorClock;
    
    /** Operations made while offline */
    offlineQueue: Operation[];
    
    /** Local document state (with offline changes) */
    localDocument: StoryDocument;
    
    /** Pending file saves */
    pendingFileSave: boolean;
}

class OfflineManager {
    private state: OfflineState | null = null;
    private isOnline = true;
    
    /**
     * Called when connection is lost
     */
    goOffline(): void {
        this.isOnline = false;
        this.state = {
            offlineSince: Date.now(),
            lastSyncedClock: { ...vectorClock.getCurrent() },
            offlineQueue: [],
            localDocument: documentManager.getState(),
            pendingFileSave: false
        };
        
        this.showOfflineIndicator();
    }
    
    /**
     * Queue an operation made while offline
     */
    queueOperation(op: Operation): void {
        if (!this.state) return;
        
        this.state.offlineQueue.push(op);
        this.state.pendingFileSave = true;
        
        // Save to IndexedDB for durability
        this.persistOfflineQueue();
    }
    
    /**
     * Check if we should work offline
     */
    shouldQueueOperation(): boolean {
        return !this.isOnline && this.state !== null;
    }
    
    /**
     * Get queued operations for resync
     */
    getOfflineQueue(): Operation[] {
        return this.state?.offlineQueue || [];
    }
    
    /**
     * Called when reconnected
     */
    async goOnline(): Promise<void> {
        this.isOnline = true;
        
        if (this.state && this.state.offlineQueue.length > 0) {
            await this.resync();
        }
        
        this.state = null;
        this.hideOfflineIndicator();
    }
}
```

### 6.2 Offline Persistence

```typescript
// IndexedDB schema for offline data
interface OfflineStore {
    id: string;                 // Document ID
    offlineSince: number;
    lastSyncedClock: VectorClock;
    offlineQueue: Operation[];
    documentSnapshot: string;   // Compressed JSON
}

class OfflinePersistence {
    private db: IDBDatabase;
    
    async saveOfflineState(state: OfflineState): Promise<void> {
        const tx = this.db.transaction('offline', 'readwrite');
        await tx.objectStore('offline').put({
            id: documentManager.getDocumentId(),
            ...state,
            documentSnapshot: await this.compressDocument(state.localDocument)
        });
    }
    
    async loadOfflineState(documentId: string): Promise<OfflineState | null> {
        const tx = this.db.transaction('offline', 'readonly');
        const data = await tx.objectStore('offline').get(documentId);
        
        if (!data) return null;
        
        return {
            ...data,
            localDocument: await this.decompressDocument(data.documentSnapshot)
        };
    }
    
    async clearOfflineState(documentId: string): Promise<void> {
        const tx = this.db.transaction('offline', 'readwrite');
        await tx.objectStore('offline').delete(documentId);
    }
}
```

---

## 7. Resync Protocol

### 7.1 Resync Flow

When a client reconnects after being offline:

```
┌─────────────────────────────────────────────────────────────────┐
│  RESYNC PROTOCOL                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: RECONNECT                                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Client → Server: "sync:request"                          │  │
│  │ {                                                         │  │
│  │   documentId: "doc_xyz",                                  │  │
│  │   lastKnownClock: { alice: 5, bob: 3, carol: 7 },        │  │
│  │   offlineOpCount: 3                                       │  │
│  │ }                                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Step 2: SERVER RESPONDS WITH MISSED OPERATIONS                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Server → Client: "sync:response"                         │  │
│  │ {                                                         │  │
│  │   currentClock: { alice: 8, bob: 5, carol: 7 },          │  │
│  │   missedOps: [ op6, op7, op8, op9, op10 ],               │  │
│  │   activeUsers: [ ... ]                                    │  │
│  │ }                                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Step 3: CLIENT TRANSFORMS AND APPLIES                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ For each missed operation:                                │  │
│  │   - Transform against client's offline ops               │  │
│  │   - Apply to local state                                 │  │
│  │   - Update vector clock                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Step 4: CLIENT SENDS OFFLINE OPERATIONS                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ For each offline operation:                               │  │
│  │   - Transform against received ops                       │  │
│  │   - Send to server (broadcast to others)                 │  │
│  │   - Clear from offline queue                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Step 5: SYNC COMPLETE                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ All clients now have consistent state ✓                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Resync Implementation

```typescript
class ResyncManager {
    constructor(
        private signalR: SignalRClient,
        private ot: OperationalTransformer,
        private stateManager: StateManager,
        private offlineManager: OfflineManager
    ) {}
    
    async resync(): Promise<void> {
        // Step 1: Request missed operations
        const response = await this.signalR.invoke<SyncResponse>('sync:request', {
            documentId: this.stateManager.getDocumentId(),
            lastKnownClock: this.offlineManager.getLastSyncedClock(),
            offlineOpCount: this.offlineManager.getOfflineQueue().length
        });
        
        // Step 2: Get offline queue
        const offlineOps = this.offlineManager.getOfflineQueue();
        const missedOps = response.missedOps;
        
        // Step 3: Transform missed ops against offline ops
        const transformedMissed = this.transformAll(missedOps, offlineOps);
        
        // Step 4: Apply transformed missed ops
        for (const op of transformedMissed) {
            this.stateManager.applyRemoteOperation(op);
        }
        
        // Step 5: Transform offline ops against missed ops
        const transformedOffline = this.transformAll(offlineOps, missedOps);
        
        // Step 6: Send transformed offline ops
        for (const op of transformedOffline) {
            await this.signalR.broadcast('operation:apply', { operation: op });
        }
        
        // Step 7: Clear offline state
        this.offlineManager.clearQueue();
        
        // Step 8: Update vector clock
        this.stateManager.setVectorClock(response.currentClock);
    }
    
    /**
     * Transform list A against list B
     */
    private transformAll(opsA: Operation[], opsB: Operation[]): Operation[] {
        let transformed = [...opsA];
        
        for (const opB of opsB) {
            transformed = transformed.map(opA => this.ot.transform(opB, opA));
        }
        
        return transformed;
    }
}

interface SyncResponse {
    currentClock: VectorClock;
    missedOps: Operation[];
    activeUsers: UserPresence[];
}
```

### 7.3 Long Offline Recovery

For extended offline periods (hours/days), use checkpoint-based recovery:

```typescript
class CheckpointRecovery {
    /**
     * If too many operations missed, fall back to checkpoint
     */
    async recover(missedOpCount: number): Promise<void> {
        if (missedOpCount > 1000) {
            // Too many ops to replay - use checkpoint
            await this.loadLatestCheckpoint();
        } else {
            // Replay individual operations
            await this.replayOperations();
        }
    }
    
    private async loadLatestCheckpoint(): Promise<void> {
        // Download latest document state from cloud
        const latestFile = await cloudStorage.download(this.documentId);
        
        // Merge with local changes
        const merged = await this.mergeWithLocalChanges(latestFile);
        
        // Show conflict resolution UI if needed
        if (merged.hasConflicts) {
            await this.showConflictResolution(merged.conflicts);
        }
        
        // Apply merged state
        this.stateManager.setState(merged.state);
    }
}
```

---

## 8. Conflict Resolution

### 8.1 Conflict Types

| Conflict Type | Description | Auto-Resolution |
|--------------|-------------|-----------------|
| **Property Conflict** | Same property edited by two users | Last-write-wins |
| **Position Conflict** | Same element moved by two users | Last-write-wins |
| **Delete-Edit Conflict** | One deletes, another edits | Delete wins |
| **Insert-at-Same** | Two inserts at same position | Deterministic order |

### 8.2 Resolution Strategies

```typescript
class ConflictResolver {
    /**
     * Resolve property conflict
     */
    resolvePropertyConflict(opA: Operation, opB: Operation): Operation {
        // Last timestamp wins
        if (opA.timestamp > opB.timestamp) {
            return { ...opB, type: 'noop' as any };
        }
        return opB;
    }
    
    /**
     * Resolve delete-edit conflict
     */
    resolveDeleteEditConflict(deleteOp: Operation, editOp: Operation): Operation {
        // Delete wins - the edited element no longer exists
        // But we can optionally resurrect with the edit
        if (this.shouldResurrect()) {
            return this.createResurrectOperation(deleteOp, editOp);
        }
        
        // Mark edit as no-op
        return { ...editOp, type: 'noop' as any };
    }
    
    /**
     * Resolve insert ordering
     */
    resolveInsertOrder(opA: Operation, opB: Operation): number {
        // Deterministic tie-breaker: sort by user ID
        return opA.userId.localeCompare(opB.userId);
    }
}
```

### 8.3 User Notification

```typescript
interface ConflictNotification {
    type: ConflictType;
    description: string;
    resolution: 'auto' | 'manual';
    affectedElements: string[];
    otherUser: string;
}

// Example notification
{
    type: "property_conflict",
    description: "Bob changed the color while you were editing it",
    resolution: "auto",
    affectedElements: ["rect-123"],
    otherUser: "Bob"
}
```

---

## 9. Initial Sync Protocol

When a new collaborator joins an active session, they need to get the current document state. This section defines how that happens.

### 9.1 Join Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  NEW COLLABORATOR JOINS                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. DOWNLOAD FILE                                               │
│     ┌─────────────────────────────────────────────────────┐    │
│     │  Read .story file from cloud storage               │    │
│     │  (manifest.json has current vectorClock)           │    │
│     └─────────────────────────────────────────────────────┘    │
│                              │                                  │
│  2. JOIN SIGNALR GROUP       ▼                                  │
│     ┌─────────────────────────────────────────────────────┐    │
│     │  Send: presence:join + my vectorClock              │    │
│     │  { clock: { alice: 0, bob: 0 }, fromFile: true }   │    │
│     └─────────────────────────────────────────────────────┘    │
│                              │                                  │
│  3. RECEIVE ACTIVE STATE     ▼                                  │
│     ┌─────────────────────────────────────────────────────┐    │
│     │  Other clients respond with:                        │    │
│     │  • Their current vectorClock                        │    │
│     │  • Operations since file's clock (if available)     │    │
│     │  • Current presence/cursor positions                │    │
│     └─────────────────────────────────────────────────────┘    │
│                              │                                  │
│  4. APPLY MISSED OPERATIONS  ▼                                  │
│     ┌─────────────────────────────────────────────────────┐    │
│     │  Transform and apply any operations newer than     │    │
│     │  what was in the file                               │    │
│     └─────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Initial Sync Message

```typescript
interface InitialSyncRequest {
    type: 'sync:request';
    userId: string;
    userInfo: UserInfo;
    
    /** Vector clock from downloaded file */
    fileClock: VectorClock;
    
    /** Timestamp of file download */
    fileTimestamp: number;
    
    /** Request operations since this clock */
    requestOps: boolean;
}

interface InitialSyncResponse {
    type: 'sync:response';
    userId: string;
    
    /** Responder's current vector clock */
    currentClock: VectorClock;
    
    /** Operations since requested clock (if available) */
    operations?: Operation[];
    
    /** If ops not available, need full file reload */
    needsReload?: boolean;
    
    /** Current presence state */
    presence: {
        currentSlide: string;
        cursor?: { x: number; y: number };
    };
}
```

### 9.3 Sync Scenarios

| Scenario | File Age | Action |
|----------|----------|--------|
| **Fresh file** | < 30 seconds | Apply any in-flight ops from other clients |
| **Recent file** | < 5 minutes | Request ops since file clock, apply with OT |
| **Stale file** | > 5 minutes | Re-download file, then request recent ops |
| **Very stale** | > 1 hour | Re-download file (ops too old to replay) |

### 9.4 Join Handler

```typescript
class InitialSyncHandler {
    /**
     * Handle new collaborator joining
     */
    async handleJoin(request: InitialSyncRequest): Promise<void> {
        const myOps = this.getOperationsSince(request.fileClock);
        
        // Check if we can provide incremental sync
        if (myOps !== null && myOps.length < 1000) {
            // Send incremental operations
            await this.signalR.sendToUser(request.userId, {
                type: 'sync:response',
                userId: this.userId,
                currentClock: this.vectorClock.current(),
                operations: myOps,
                presence: this.getMyPresence()
            });
        } else {
            // Too many ops or not available - they should reload
            await this.signalR.sendToUser(request.userId, {
                type: 'sync:response',
                userId: this.userId,
                currentClock: this.vectorClock.current(),
                needsReload: true,
                presence: this.getMyPresence()
            });
        }
    }
    
    /**
     * As new joiner, process sync responses
     */
    async processSyncResponses(responses: InitialSyncResponse[]): Promise<void> {
        // Find the most up-to-date response
        const latest = this.findLatestClock(responses);
        
        if (latest.needsReload) {
            // Re-download file and restart sync
            await this.reloadDocument();
            return;
        }
        
        // Merge all operations from all responders
        const allOps = this.mergeAndDedupe(responses.map(r => r.operations || []));
        
        // Sort by vector clock and apply
        for (const op of this.sortByCausality(allOps)) {
            if (!this.hasApplied(op)) {
                await this.applyRemoteOperation(op);
            }
        }
        
        // Now in sync - start normal operation
        this.emit('synced');
    }
}
```

### 9.5 Mid-Edit Join

When joining while others are mid-edit (e.g., dragging a shape):

```typescript
// In-flight operations are marked as tentative
interface Operation {
    // ... existing fields
    
    /** True if operation is part of ongoing gesture */
    tentative?: boolean;
    
    /** Gesture ID to group related operations */
    gestureId?: string;
}

// On join, receive tentative state
// When gesture completes, final operation replaces tentative ones
```

---

## 10. Text Editing OT

Text editing requires character-level Operational Transformation for smooth collaboration.

### 10.1 Text Operation Types

```typescript
type TextOperation = 
    | TextInsertOp
    | TextDeleteOp
    | TextFormatOp
    | TextRetainOp;

interface TextInsertOp {
    type: 'text:insert';
    
    /** Absolute position in text */
    position: number;
    
    /** Text to insert */
    text: string;
    
    /** Formatting at insertion point */
    attributes?: TextAttributes;
}

interface TextDeleteOp {
    type: 'text:delete';
    
    /** Start position */
    position: number;
    
    /** Number of characters to delete */
    count: number;
    
    /** Deleted text (for undo) */
    deletedText: string;
}

interface TextFormatOp {
    type: 'text:format';
    
    /** Start position */
    position: number;
    
    /** Number of characters affected */
    count: number;
    
    /** Format changes */
    attributes: Partial<TextAttributes>;
    
    /** Previous attributes (for undo) */
    previousAttributes: Partial<TextAttributes>;
}

interface TextAttributes {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    link?: string;
}
```

### 10.2 Text OT Transform Functions

```typescript
class TextOperationalTransformer {
    /**
     * Transform text operation B against A
     */
    transformText(opA: TextOperation, opB: TextOperation): TextOperation {
        const key = `${opA.type}_${opB.type}`;
        
        switch (key) {
            case 'text:insert_text:insert':
                return this.transformInsertInsert(opA, opB);
            case 'text:insert_text:delete':
                return this.transformInsertDelete(opA, opB);
            case 'text:delete_text:insert':
                return this.transformDeleteInsert(opA, opB);
            case 'text:delete_text:delete':
                return this.transformDeleteDelete(opA, opB);
            // ... format operations
            default:
                return opB;
        }
    }
    
    /**
     * Insert vs Insert: Shift positions based on insertion order
     */
    private transformInsertInsert(
        opA: TextInsertOp, 
        opB: TextInsertOp
    ): TextInsertOp {
        if (opA.position < opB.position) {
            // A inserts before B - shift B forward
            return {
                ...opB,
                position: opB.position + opA.text.length
            };
        } else if (opA.position > opB.position) {
            // B inserts before A - no change to B
            return opB;
        } else {
            // Same position - use user ID for deterministic order
            if (opA.userId < opB.userId) {
                return {
                    ...opB,
                    position: opB.position + opA.text.length
                };
            }
            return opB;
        }
    }
    
    /**
     * Delete vs Insert: Adjust positions
     */
    private transformDeleteInsert(
        opA: TextDeleteOp, 
        opB: TextInsertOp
    ): TextInsertOp {
        if (opA.position >= opB.position) {
            // Delete after insert point - no change
            return opB;
        } else if (opA.position + opA.count <= opB.position) {
            // Delete entirely before insert - shift back
            return {
                ...opB,
                position: opB.position - opA.count
            };
        } else {
            // Delete spans insert point - insert at delete position
            return {
                ...opB,
                position: opA.position
            };
        }
    }
    
    /**
     * Delete vs Delete: Handle overlapping deletions
     */
    private transformDeleteDelete(
        opA: TextDeleteOp, 
        opB: TextDeleteOp
    ): TextDeleteOp | null {
        const aStart = opA.position;
        const aEnd = opA.position + opA.count;
        const bStart = opB.position;
        const bEnd = opB.position + opB.count;
        
        // No overlap
        if (aEnd <= bStart) {
            // A entirely before B
            return {
                ...opB,
                position: opB.position - opA.count
            };
        } else if (bEnd <= aStart) {
            // B entirely before A - no change
            return opB;
        }
        
        // Overlapping deletions
        const overlapStart = Math.max(aStart, bStart);
        const overlapEnd = Math.min(aEnd, bEnd);
        const overlapCount = overlapEnd - overlapStart;
        
        // Reduce B's count by overlap (already deleted by A)
        const newCount = opB.count - overlapCount;
        
        if (newCount <= 0) {
            // B is entirely contained in A - becomes no-op
            return null;
        }
        
        // Adjust position
        const newPosition = bStart < aStart ? bStart : aStart;
        
        return {
            ...opB,
            position: newPosition,
            count: newCount,
            deletedText: opB.deletedText.substring(0, newCount)
        };
    }
}
```

### 10.3 Text Cursor Synchronization

```typescript
interface TextCursor {
    /** Element containing text */
    elementId: string;
    
    /** Caret position (insertion point) */
    position: number;
    
    /** Selection anchor (if selecting) */
    selectionAnchor?: number;
    
    /** Selection focus (if selecting) */
    selectionFocus?: number;
}

class TextCursorSync {
    /**
     * Transform cursor position when text operation is applied
     */
    transformCursor(
        cursor: TextCursor, 
        op: TextOperation
    ): TextCursor {
        if (op.type === 'text:insert') {
            return this.transformCursorForInsert(cursor, op);
        } else if (op.type === 'text:delete') {
            return this.transformCursorForDelete(cursor, op);
        }
        return cursor;
    }
    
    private transformCursorForInsert(
        cursor: TextCursor, 
        op: TextInsertOp
    ): TextCursor {
        const shift = op.text.length;
        
        return {
            ...cursor,
            position: cursor.position >= op.position 
                ? cursor.position + shift 
                : cursor.position,
            selectionAnchor: cursor.selectionAnchor !== undefined && cursor.selectionAnchor >= op.position
                ? cursor.selectionAnchor + shift
                : cursor.selectionAnchor,
            selectionFocus: cursor.selectionFocus !== undefined && cursor.selectionFocus >= op.position
                ? cursor.selectionFocus + shift
                : cursor.selectionFocus
        };
    }
}
```

### 10.4 Text Editing Example Flow

```
Initial text: "Hello World"
Positions:     0123456789...

Alice at pos 6: inserts "Beautiful "
Bob at pos 11: inserts "!"

Timeline:
T=0: "Hello World"
T=1: Alice → insert("Beautiful ", 6) → "Hello Beautiful World"
T=1: Bob → insert("!", 11) → "Hello World!" (his view)

Without OT:
- Alice's view + Bob's op(11): "Hello BeautWorld!iful " ❌

With OT:
- Transform Bob's insert(11) against Alice's insert(6, len=10)
- New position: 11 + 10 = 21
- Result: "Hello Beautiful World!" ✓
```

---

## 11. Error Recovery

Robust error handling for network failures, invalid operations, and edge cases.

### 11.1 Error Types

```typescript
enum SyncErrorType {
    /** Network connection lost */
    DISCONNECTED = 'disconnected',
    
    /** SignalR message failed to send */
    SEND_FAILED = 'send_failed',
    
    /** Cloud storage API failed */
    STORAGE_FAILED = 'storage_failed',
    
    /** Received malformed operation */
    INVALID_OPERATION = 'invalid_operation',
    
    /** Vector clock indicates missed operations */
    MISSING_OPERATIONS = 'missing_operations',
    
    /** Operation references non-existent element */
    STALE_REFERENCE = 'stale_reference',
    
    /** Too many pending operations */
    QUEUE_OVERFLOW = 'queue_overflow',
    
    /** File save conflict with cloud storage */
    SAVE_CONFLICT = 'save_conflict',
    
    /** Received operation from blocked user */
    UNAUTHORIZED = 'unauthorized'
}
```

### 11.2 Recovery Strategies

```typescript
class ErrorRecoveryManager {
    private retryQueues = new Map<SyncErrorType, Operation[]>();
    private retryAttempts = new Map<string, number>();
    
    /**
     * Handle sync error with appropriate recovery strategy
     */
    async handleError(error: SyncError): Promise<void> {
        switch (error.type) {
            case SyncErrorType.DISCONNECTED:
                await this.handleDisconnect(error);
                break;
                
            case SyncErrorType.SEND_FAILED:
                await this.handleSendFailure(error);
                break;
                
            case SyncErrorType.STORAGE_FAILED:
                await this.handleStorageFailure(error);
                break;
                
            case SyncErrorType.INVALID_OPERATION:
                await this.handleInvalidOperation(error);
                break;
                
            case SyncErrorType.MISSING_OPERATIONS:
                await this.handleMissingOps(error);
                break;
                
            case SyncErrorType.STALE_REFERENCE:
                await this.handleStaleReference(error);
                break;
                
            default:
                await this.handleUnknownError(error);
        }
    }
    
    /**
     * Network disconnect - queue operations and attempt reconnect
     */
    private async handleDisconnect(error: SyncError): Promise<void> {
        // 1. Switch to offline mode
        this.offlineManager.enable();
        
        // 2. Show reconnecting UI
        this.emit('connection:lost');
        
        // 3. Start reconnection with exponential backoff
        const delays = [1000, 2000, 4000, 8000, 16000, 30000];
        
        for (let attempt = 0; attempt < delays.length; attempt++) {
            await this.sleep(delays[attempt]);
            
            try {
                await this.signalR.reconnect();
                
                // 4. Resync on successful reconnect
                await this.resyncManager.resync();
                
                this.emit('connection:restored');
                return;
            } catch {
                this.emit('connection:retrying', { attempt: attempt + 1 });
            }
        }
        
        // 5. Give up - offer manual reconnect
        this.emit('connection:failed');
    }
    
    /**
     * Send failed - retry with backoff
     */
    private async handleSendFailure(error: SyncError): Promise<void> {
        const op = error.operation;
        const attempts = this.retryAttempts.get(op.id) || 0;
        
        if (attempts < 3) {
            // Retry with backoff
            this.retryAttempts.set(op.id, attempts + 1);
            await this.sleep(1000 * Math.pow(2, attempts));
            
            try {
                await this.signalR.send(op);
                this.retryAttempts.delete(op.id);
            } catch {
                await this.handleSendFailure(error);
            }
        } else {
            // Queue for offline sync
            this.offlineManager.queueOperation(op);
            this.emit('operation:queued', { op });
        }
    }
    
    /**
     * Invalid operation received - log and ignore
     */
    private async handleInvalidOperation(error: SyncError): Promise<void> {
        // Log for debugging (potential malicious actor)
        console.error('Invalid operation received:', error);
        
        // Report to monitoring
        this.analytics.track('invalid_operation', {
            fromUserId: error.operation?.userId,
            operationType: error.operation?.type,
            reason: error.message
        });
        
        // Do not apply - just ignore
        // Optionally: if from same user repeatedly, consider blocking
    }
    
    /**
     * Missing operations detected via vector clock gap
     */
    private async handleMissingOps(error: SyncError): Promise<void> {
        // Request resync from other clients
        await this.signalR.broadcast('sync:request', {
            myClock: this.vectorClock.current(),
            needOpsFrom: error.missingFrom // userId with gap
        });
        
        // Set timeout - if no response, reload file
        setTimeout(async () => {
            if (this.stillMissingOps()) {
                await this.reloadDocument();
            }
        }, 5000);
    }
    
    /**
     * Operation references deleted element
     */
    private async handleStaleReference(error: SyncError): Promise<void> {
        const op = error.operation;
        
        // Check if element was deleted
        if (this.wasDeleted(op.path)) {
            // Ignore operation - element no longer exists
            console.log('Ignoring stale operation for deleted element');
            return;
        }
        
        // Element might be renamed/moved - try to find it
        const newPath = this.findElement(op.elementId);
        if (newPath) {
            // Rewrite and apply
            const fixedOp = { ...op, path: newPath };
            await this.applyOperation(fixedOp);
        }
    }
}
```

### 11.3 Circuit Breaker Pattern

```typescript
class CircuitBreaker {
    private state: 'closed' | 'open' | 'half-open' = 'closed';
    private failures = 0;
    private lastFailure = 0;
    
    private readonly failureThreshold = 5;
    private readonly resetTimeout = 30000; // 30 seconds
    
    async execute<T>(operation: () => Promise<T>): Promise<T> {
        if (this.state === 'open') {
            if (Date.now() - this.lastFailure > this.resetTimeout) {
                this.state = 'half-open';
            } else {
                throw new Error('Circuit breaker is open');
            }
        }
        
        try {
            const result = await operation();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }
    
    private onSuccess(): void {
        this.failures = 0;
        this.state = 'closed';
    }
    
    private onFailure(): void {
        this.failures++;
        this.lastFailure = Date.now();
        
        if (this.failures >= this.failureThreshold) {
            this.state = 'open';
            console.log('Circuit breaker opened - pausing operations');
        }
    }
}

// Usage: Wrap SignalR sends
const signalRCircuit = new CircuitBreaker();

async function sendOperation(op: Operation): Promise<void> {
    await signalRCircuit.execute(() => signalR.send(op));
}
```

### 11.4 Validation & Sanitization

```typescript
class OperationValidator {
    /**
     * Validate incoming operation before applying
     */
    validate(op: Operation): ValidationResult {
        const errors: string[] = [];
        
        // Required fields
        if (!op.id) errors.push('Missing operation ID');
        if (!op.userId) errors.push('Missing user ID');
        if (!op.type) errors.push('Missing operation type');
        if (!op.vectorClock) errors.push('Missing vector clock');
        
        // Path validation
        if (op.path) {
            if (!Array.isArray(op.path)) {
                errors.push('Path must be an array');
            } else if (op.path.some(p => typeof p !== 'string' && typeof p !== 'number')) {
                errors.push('Path elements must be strings or numbers');
            }
        }
        
        // Value size limits
        if (op.value && JSON.stringify(op.value).length > 1000000) {
            errors.push('Operation value too large (>1MB)');
        }
        
        // Timestamp sanity check
        if (op.timestamp) {
            const now = Date.now();
            if (op.timestamp > now + 60000) {
                errors.push('Timestamp in future');
            }
            if (op.timestamp < now - 86400000) {
                errors.push('Timestamp too old (>24h)');
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Sanitize operation before applying
     */
    sanitize(op: Operation): Operation {
        // Sanitize text content
        if (op.type === 'text:insert' && op.value?.text) {
            op.value.text = this.sanitizeText(op.value.text);
        }
        
        // Limit string lengths
        if (typeof op.value === 'string' && op.value.length > 100000) {
            op.value = op.value.substring(0, 100000);
        }
        
        return op;
    }
    
    private sanitizeText(text: string): string {
        // Remove control characters except newlines and tabs
        return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    }
}
```

---

## 12. UX Patterns

User experience patterns for collaboration states and transitions.

### 12.1 Connection State Indicators

```typescript
enum ConnectionState {
    CONNECTED = 'connected',
    CONNECTING = 'connecting',
    RECONNECTING = 'reconnecting',
    OFFLINE = 'offline',
    ERROR = 'error'
}

interface ConnectionIndicator {
    state: ConnectionState;
    message: string;
    icon: string;
    color: string;
}

const indicators: Record<ConnectionState, ConnectionIndicator> = {
    [ConnectionState.CONNECTED]: {
        state: 'connected',
        message: 'Connected',
        icon: '●',
        color: 'green'
    },
    [ConnectionState.CONNECTING]: {
        state: 'connecting',
        message: 'Connecting...',
        icon: '◐',
        color: 'yellow'
    },
    [ConnectionState.RECONNECTING]: {
        state: 'reconnecting',
        message: 'Reconnecting...',
        icon: '◐',
        color: 'orange'
    },
    [ConnectionState.OFFLINE]: {
        state: 'offline',
        message: 'Offline - changes will sync when reconnected',
        icon: '○',
        color: 'gray'
    },
    [ConnectionState.ERROR]: {
        state: 'error',
        message: 'Connection error - click to retry',
        icon: '!',
        color: 'red'
    }
};
```

### 12.2 Save Status Indicator

```typescript
enum SaveStatus {
    SAVED = 'saved',
    SAVING = 'saving',
    PENDING = 'pending',
    ERROR = 'error'
}

interface SaveIndicator {
    status: SaveStatus;
    message: string;
    lastSaved?: Date;
}

class SaveStatusManager {
    private status: SaveStatus = SaveStatus.SAVED;
    private pendingOps = 0;
    private lastSaved: Date = new Date();
    
    onLocalChange(): void {
        this.pendingOps++;
        this.status = SaveStatus.PENDING;
        this.emit('status', this.getIndicator());
    }
    
    onOpSent(): void {
        this.status = SaveStatus.SAVING;
        this.emit('status', this.getIndicator());
    }
    
    onOpAcknowledged(): void {
        this.pendingOps--;
        if (this.pendingOps === 0) {
            this.status = SaveStatus.SAVED;
            this.lastSaved = new Date();
        }
        this.emit('status', this.getIndicator());
    }
    
    getIndicator(): SaveIndicator {
        const messages = {
            [SaveStatus.SAVED]: this.formatLastSaved(),
            [SaveStatus.SAVING]: 'Saving...',
            [SaveStatus.PENDING]: `${this.pendingOps} change${this.pendingOps > 1 ? 's' : ''} pending`,
            [SaveStatus.ERROR]: 'Save failed - click to retry'
        };
        
        return {
            status: this.status,
            message: messages[this.status],
            lastSaved: this.lastSaved
        };
    }
    
    private formatLastSaved(): string {
        const seconds = Math.floor((Date.now() - this.lastSaved.getTime()) / 1000);
        
        if (seconds < 10) return 'Saved just now';
        if (seconds < 60) return 'Saved seconds ago';
        if (seconds < 120) return 'Saved a minute ago';
        if (seconds < 3600) return `Saved ${Math.floor(seconds / 60)} minutes ago`;
        return `Saved at ${this.lastSaved.toLocaleTimeString()}`;
    }
}
```

### 12.3 Conflict Toast Notifications

```typescript
interface ConflictToast {
    id: string;
    type: 'info' | 'warning';
    message: string;
    duration: number;
    action?: {
        label: string;
        callback: () => void;
    };
}

class ConflictNotifier {
    /**
     * Show notification when conflict is auto-resolved
     */
    notifyConflict(conflict: Conflict): void {
        const toast: ConflictToast = {
            id: crypto.randomUUID(),
            type: 'info',
            message: this.formatConflictMessage(conflict),
            duration: 4000,
            action: {
                label: 'Undo',
                callback: () => this.undoConflictResolution(conflict)
            }
        };
        
        this.showToast(toast);
    }
    
    private formatConflictMessage(conflict: Conflict): string {
        switch (conflict.type) {
            case 'property':
                return `${conflict.otherUser} also edited "${conflict.property}" - their change was applied`;
                
            case 'delete':
                return `${conflict.otherUser} deleted an element you were editing`;
                
            case 'move':
                return `${conflict.otherUser} moved an element to a different position`;
                
            default:
                return `Edit conflict with ${conflict.otherUser} was auto-resolved`;
        }
    }
    
    /**
     * Show notification when joining session
     */
    notifyJoin(collaborators: Collaborator[]): void {
        if (collaborators.length === 0) return;
        
        const names = collaborators.map(c => c.name);
        const message = names.length === 1
            ? `${names[0]} is editing`
            : `${names.slice(0, -1).join(', ')} and ${names.slice(-1)} are editing`;
        
        this.showToast({
            id: crypto.randomUUID(),
            type: 'info',
            message,
            duration: 3000
        });
    }
    
    /**
     * Show notification when going offline
     */
    notifyOffline(): void {
        this.showToast({
            id: 'offline-notification',
            type: 'warning',
            message: 'You\'re offline. Changes will sync when you reconnect.',
            duration: 0 // Persistent until dismissed
        });
    }
    
    /**
     * Show notification when back online
     */
    notifyOnline(pendingCount: number): void {
        this.dismissToast('offline-notification');
        
        if (pendingCount > 0) {
            this.showToast({
                id: crypto.randomUUID(),
                type: 'info',
                message: `Back online! Syncing ${pendingCount} change${pendingCount > 1 ? 's' : ''}...`,
                duration: 3000
            });
        }
    }
}
```

### 12.4 Presence Avatars

```typescript
interface CollaboratorAvatar {
    userId: string;
    name: string;
    email: string;
    color: string;
    avatar?: string;
    isEditing: boolean;
    currentSlide: string;
}

class PresenceAvatars {
    /**
     * Generate avatar display order (max 5 visible, then +N)
     */
    getDisplayAvatars(collaborators: CollaboratorAvatar[]): {
        visible: CollaboratorAvatar[];
        overflow: number;
    } {
        const maxVisible = 5;
        
        // Sort by activity (most recent first)
        const sorted = [...collaborators].sort((a, b) => 
            b.lastActivity - a.lastActivity
        );
        
        return {
            visible: sorted.slice(0, maxVisible),
            overflow: Math.max(0, sorted.length - maxVisible)
        };
    }
    
    /**
     * Get initials for avatar fallback
     */
    getInitials(name: string): string {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }
    
    /**
     * Get tooltip for avatar
     */
    getTooltip(collaborator: CollaboratorAvatar): string {
        const status = collaborator.isEditing ? 'Editing' : 'Viewing';
        return `${collaborator.name} - ${status} slide ${collaborator.currentSlide}`;
    }
}
```

### 12.5 Reconnection Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  RECONNECTION UX FLOW                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. CONNECTION LOST                                             │
│     ┌───────────────────────────────────────────────────────┐  │
│     │  Toast: "Connection lost. Working offline..."         │  │
│     │  Status: Yellow dot + "Offline"                       │  │
│     │  User can continue editing normally                   │  │
│     └───────────────────────────────────────────────────────┘  │
│                                                                 │
│  2. RECONNECTING (background)                                   │
│     ┌───────────────────────────────────────────────────────┐  │
│     │  Status: Spinning indicator + "Reconnecting..."       │  │
│     │  No modal/blocking UI                                 │  │
│     └───────────────────────────────────────────────────────┘  │
│                                                                 │
│  3. RECONNECTED + SYNCING                                       │
│     ┌───────────────────────────────────────────────────────┐  │
│     │  Toast: "Connected! Syncing 5 changes..."             │  │
│     │  Status: Green dot + "Syncing..."                     │  │
│     │  Brief loading overlay on modified elements           │  │
│     └───────────────────────────────────────────────────────┘  │
│                                                                 │
│  4. SYNC COMPLETE                                               │
│     ┌───────────────────────────────────────────────────────┐  │
│     │  Toast: "All changes synced" (auto-dismiss 2s)        │  │
│     │  Status: Green dot + "Saved"                          │  │
│     │  Show any conflict notifications                      │  │
│     └───────────────────────────────────────────────────────┘  │
│                                                                 │
│  5. RECONNECT FAILED (after 60s)                               │
│     ┌───────────────────────────────────────────────────────┐  │
│     │  Toast: "Couldn't reconnect. Your changes are saved  │  │
│     │         locally. [Retry] [Work Offline]"              │  │
│     │  Status: Red dot + "Connection failed"                │  │
│     └───────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 13. Performance Limits

Expected performance characteristics and limits for the collaboration system.

### 13.1 Recommended Limits

| Resource | Recommended | Maximum | Notes |
|----------|-------------|---------|-------|
| **Concurrent collaborators** | 10 | 50 | SignalR free tier: 20 connections |
| **Slides per document** | 100 | 500 | Performance degrades beyond 100 |
| **Elements per slide** | 100 | 500 | Canvas rendering bottleneck |
| **Document file size** | 100 MB | 1 GB | Cloud upload/download limits |
| **Operations per second** | 20 | 100 | Per client, throttled |
| **Operation size** | 2 KB | 64 KB | SignalR message limit |
| **Offline queue size** | 1,000 | 10,000 | IndexedDB storage |
| **Operation log retained** | 1,000 | 5,000 | For resync support |

### 13.2 Scaling Behavior

```
┌─────────────────────────────────────────────────────────────────┐
│  COLLABORATOR SCALING                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1-5 collaborators:    Smooth, no degradation                  │
│  5-10 collaborators:   Minimal latency increase (~10ms)        │
│  10-20 collaborators:  Noticeable cursor lag                   │
│  20-50 collaborators:  Throttle cursor updates to 10/sec       │
│  50+ collaborators:    Consider read-only mode for most        │
│                                                                 │
│  DOCUMENT SIZE SCALING                                          │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  < 10 MB:    Instant load, smooth editing                      │
│  10-50 MB:   2-5 second load, lazy asset loading               │
│  50-100 MB:  5-15 second load, progressive rendering           │
│  100+ MB:    Consider splitting into multiple files            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 13.3 Memory Management

```typescript
class MemoryManager {
    private readonly limits = {
        maxUndoStackSize: 100,          // Operations per user
        maxOperationLogSize: 1000,      // Total operations cached
        maxAssetCacheSize: 100 * 1024 * 1024, // 100 MB
        gcInterval: 60000               // 1 minute
    };
    
    constructor() {
        // Periodic garbage collection
        setInterval(() => this.garbageCollect(), this.limits.gcInterval);
    }
    
    garbageCollect(): void {
        // Trim undo stacks
        for (const [userId, stack] of this.undoStacks) {
            if (stack.length > this.limits.maxUndoStackSize) {
                stack.splice(0, stack.length - this.limits.maxUndoStackSize);
            }
        }
        
        // Trim operation log
        if (this.operationLog.length > this.limits.maxOperationLogSize) {
            this.operationLog.splice(0, this.operationLog.length - this.limits.maxOperationLogSize);
        }
        
        // Clear unused asset cache entries
        this.assetCache.evictOldest(this.limits.maxAssetCacheSize);
    }
}
```

### 13.4 Throttling & Debouncing

```typescript
class OperationThrottler {
    private queues = new Map<string, ThrottleQueue>();
    
    private readonly config = {
        // Cursor: high frequency, can drop
        cursor: { maxRate: 20, dropOld: true },
        
        // Selection: medium frequency
        selection: { maxRate: 10, dropOld: true },
        
        // Shape operations: lower frequency, must not drop
        shape: { maxRate: 5, dropOld: false },
        
        // Text: debounce batches
        text: { debounce: 100 }
    };
    
    /**
     * Throttle operation based on type
     */
    throttle(op: Operation, send: (op: Operation) => void): void {
        const opType = this.getOperationType(op);
        const config = this.config[opType] || { maxRate: 10, dropOld: false };
        
        if (config.debounce) {
            this.debounce(op, send, config.debounce);
        } else {
            this.rateLimit(op, send, config);
        }
    }
    
    /**
     * Debounce for batching (text edits)
     */
    private debounce(
        op: Operation, 
        send: (op: Operation) => void, 
        delay: number
    ): void {
        const key = `${op.path.join('/')}`;
        
        if (this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key));
            // Merge with pending operation
            this.pendingOps.set(key, this.mergeOps(this.pendingOps.get(key), op));
        } else {
            this.pendingOps.set(key, op);
        }
        
        this.debounceTimers.set(key, setTimeout(() => {
            send(this.pendingOps.get(key)!);
            this.pendingOps.delete(key);
            this.debounceTimers.delete(key);
        }, delay));
    }
}
```

---

## 14. Testing Strategy

Comprehensive testing approach for the collaboration system.

### 14.1 Local Development Testing

```typescript
/**
 * Mock SignalR for local testing without Azure
 */
class MockSignalRHub {
    private clients: Map<string, MockClient> = new Map();
    private groups: Map<string, Set<string>> = new Map();
    
    /**
     * Simulate multiple clients locally
     */
    createClient(userId: string): MockClient {
        const client = new MockClient(userId, this);
        this.clients.set(userId, client);
        return client;
    }
    
    /**
     * Broadcast to group with simulated latency
     */
    async broadcast(groupId: string, message: any, latencyMs = 50): Promise<void> {
        const group = this.groups.get(groupId) || new Set();
        
        for (const userId of group) {
            // Add random latency jitter
            const jitter = Math.random() * 20;
            await this.sleep(latencyMs + jitter);
            
            this.clients.get(userId)?.receive(message);
        }
    }
    
    /**
     * Simulate network conditions
     */
    setNetworkCondition(condition: NetworkCondition): void {
        switch (condition) {
            case 'offline':
                this.simulateDisconnect();
                break;
            case 'high-latency':
                this.setLatency(500, 200);
                break;
            case 'packet-loss':
                this.setPacketLoss(0.1); // 10% loss
                break;
        }
    }
}

class MockClient {
    private handlers = new Map<string, Function>();
    
    on(event: string, handler: Function): void {
        this.handlers.set(event, handler);
    }
    
    receive(message: any): void {
        const handler = this.handlers.get(message.type);
        handler?.(message);
    }
}
```

### 14.2 Test Scenarios

| Category | Test Case | Validation |
|----------|-----------|------------|
| **Basic Sync** | Two users edit different objects | Both see both changes |
| **Concurrent Edit** | Two users edit same object property | Last-write-wins applied correctly |
| **Delete Conflict** | User A deletes, User B edits | Delete wins, B notified |
| **Undo Isolation** | User A undoes while B is editing | Only A's changes undone |
| **Offline Edit** | User goes offline, edits, reconnects | Changes sync correctly |
| **Long Offline** | Offline for 1 hour, many changes | Checkpoint recovery works |
| **Join Mid-Session** | New user joins active editing | Gets current state + operations |
| **Rapid Edits** | 100 operations/second | Throttling prevents overload |
| **Large Document** | 500 slides, 10,000 elements | Performance within limits |
| **Disconnect/Reconnect** | Network drops for 30 seconds | Smooth resync, no data loss |

### 14.3 Chaos Testing

```typescript
class ChaosTestRunner {
    private actions: ChaosAction[] = [
        { name: 'disconnect', weight: 20 },
        { name: 'high_latency', weight: 30 },
        { name: 'packet_loss', weight: 15 },
        { name: 'clock_skew', weight: 10 },
        { name: 'slow_storage', weight: 15 },
        { name: 'memory_pressure', weight: 10 }
    ];
    
    /**
     * Run chaos test for specified duration
     */
    async runChaosTest(
        clients: TestClient[],
        durationMs: number
    ): Promise<ChaosTestResult> {
        const results: ChaosEvent[] = [];
        const startTime = Date.now();
        
        while (Date.now() - startTime < durationMs) {
            // Random interval between chaos events
            await this.sleep(1000 + Math.random() * 4000);
            
            // Pick random action
            const action = this.pickWeightedAction();
            const client = clients[Math.floor(Math.random() * clients.length)];
            
            // Execute chaos
            results.push(await this.executeAction(action, client));
            
            // Allow recovery
            await this.sleep(500);
        }
        
        // Verify final state consistency
        const consistent = await this.verifyConsistency(clients);
        
        return {
            events: results,
            duration: Date.now() - startTime,
            consistent,
            operationCount: this.countOperations(clients)
        };
    }
    
    /**
     * Verify all clients have same state
     */
    private async verifyConsistency(clients: TestClient[]): Promise<boolean> {
        // Wait for all syncs to complete
        await this.waitForQuiescence(clients);
        
        // Compare document hashes
        const hashes = await Promise.all(
            clients.map(c => c.getDocumentHash())
        );
        
        return hashes.every(h => h === hashes[0]);
    }
}
```

### 14.4 Load Testing

```typescript
interface LoadTestConfig {
    /** Number of simulated clients */
    clientCount: number;
    
    /** Operations per client per second */
    opsPerSecond: number;
    
    /** Test duration in seconds */
    durationSeconds: number;
    
    /** Document complexity */
    slideCount: number;
    elementsPerSlide: number;
}

class LoadTestRunner {
    async runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
        // Create clients
        const clients = await this.createClients(config.clientCount);
        
        // Generate test document
        const doc = this.generateDocument(config.slideCount, config.elementsPerSlide);
        
        // Start all clients editing
        const editPromises = clients.map(client =>
            this.runClientWorkload(client, config.opsPerSecond, config.durationSeconds)
        );
        
        // Collect metrics
        const metrics: Metrics = {
            operationsSent: 0,
            operationsReceived: 0,
            latencies: [],
            errors: [],
            syncTimes: []
        };
        
        await Promise.all(editPromises);
        
        // Final sync check
        const syncTime = await this.measureFinalSync(clients);
        
        return {
            config,
            metrics,
            finalSyncTimeMs: syncTime,
            consistent: await this.verifyConsistency(clients),
            p50Latency: this.percentile(metrics.latencies, 50),
            p99Latency: this.percentile(metrics.latencies, 99),
            errorRate: metrics.errors.length / metrics.operationsSent
        };
    }
}
```

### 14.5 Integration Test Utilities

```typescript
/**
 * Test harness for collaboration scenarios
 */
class CollaborationTestHarness {
    private mockHub: MockSignalRHub;
    private mockStorage: MockCloudStorage;
    private clients: Map<string, TestCollaborator> = new Map();
    
    /**
     * Set up test scenario
     */
    async setup(scenario: TestScenario): Promise<void> {
        this.mockHub = new MockSignalRHub();
        this.mockStorage = new MockCloudStorage();
        
        // Create document
        await this.mockStorage.createDocument(scenario.documentId, scenario.initialState);
        
        // Create collaborators
        for (const user of scenario.users) {
            await this.addCollaborator(user);
        }
    }
    
    /**
     * Execute test steps
     */
    async execute(steps: TestStep[]): Promise<void> {
        for (const step of steps) {
            switch (step.type) {
                case 'operation':
                    await this.executeOperation(step);
                    break;
                    
                case 'disconnect':
                    await this.disconnectUser(step.userId);
                    break;
                    
                case 'reconnect':
                    await this.reconnectUser(step.userId);
                    break;
                    
                case 'wait':
                    await this.sleep(step.durationMs);
                    break;
                    
                case 'assert':
                    await this.assertState(step.assertion);
                    break;
            }
        }
    }
    
    /**
     * Verify final state
     */
    async verify(): Promise<TestVerification> {
        // Check all clients consistent
        const states = new Map<string, string>();
        for (const [userId, client] of this.clients) {
            states.set(userId, await client.getDocumentHash());
        }
        
        const allSame = [...states.values()].every(s => s === states.values().next().value);
        
        // Check against expected
        const expected = this.scenario.expectedFinalState;
        const actual = await this.clients.values().next().value.getDocument();
        
        return {
            consistent: allSame,
            matchesExpected: this.compareDocuments(actual, expected),
            states
        };
    }
}
```

---

## 15. Implementation

### 15.1 State Sync Engine Class

```typescript
class StateSyncEngine {
    private vectorClock: VectorClockManager;
    private ot: OperationalTransformer;
    private undoManager: CollaborativeUndoManager;
    private offlineManager: OfflineManager;
    private resyncManager: ResyncManager;
    private operationBuffer: OperationBuffer;
    
    constructor(
        private signalR: SignalRClient,
        private stateManager: StateManager,
        private userId: string
    ) {
        this.vectorClock = new VectorClockManager(userId);
        this.ot = new OperationalTransformer();
        this.undoManager = new CollaborativeUndoManager(userId);
        this.offlineManager = new OfflineManager();
        this.operationBuffer = new OperationBuffer();
        this.resyncManager = new ResyncManager(signalR, this.ot, stateManager, this.offlineManager);
        
        this.setupListeners();
    }
    
    /**
     * Apply a local change
     */
    async applyLocalChange(change: DocumentChange): Promise<void> {
        // Create operation
        const op: Operation = {
            id: this.generateOpId(),
            userId: this.userId,
            type: change.type,
            path: change.path,
            value: change.value,
            previousValue: this.getPreviousValue(change.path),
            timestamp: Date.now(),
            vectorClock: this.vectorClock.tick(),
            sequence: this.vectorClock.getMySequence()
        };
        
        // Apply locally (optimistic)
        this.stateManager.applyOperation(op);
        
        // Record for undo
        this.undoManager.recordOperation(op);
        
        // Send or queue
        if (this.offlineManager.shouldQueueOperation()) {
            this.offlineManager.queueOperation(op);
        } else {
            await this.signalR.broadcast('operation:apply', { operation: op });
        }
    }
    
    /**
     * Handle incoming remote operation
     */
    handleRemoteOperation(message: OperationMessage): void {
        const op = message.operation;
        
        // Check if we can apply
        if (this.vectorClock.canApply(op.vectorClock, op.userId)) {
            // Transform against any pending local ops
            const transformed = this.transformAgainstPending(op);
            
            // Apply
            this.stateManager.applyOperation(transformed);
            
            // Update clock
            this.vectorClock.merge(op.vectorClock);
            
            // Record in undo (for that user)
            this.undoManager.recordOperation(op);
            
            // Try to apply buffered ops
            this.operationBuffer.flush(this.vectorClock, (bufferedOp) => {
                this.stateManager.applyOperation(bufferedOp);
            });
        } else {
            // Buffer for later
            this.operationBuffer.buffer(op);
        }
    }
    
    /**
     * Undo last local operation
     */
    async undo(): Promise<void> {
        const inverseOp = this.undoManager.undo();
        if (!inverseOp) return;
        
        // Apply locally
        this.stateManager.applyOperation(inverseOp);
        
        // Broadcast
        if (!this.offlineManager.shouldQueueOperation()) {
            await this.signalR.broadcast('operation:apply', {
                operation: inverseOp,
                isUndo: true
            });
        } else {
            this.offlineManager.queueOperation(inverseOp);
        }
    }
    
    /**
     * Redo last undone operation
     */
    async redo(): Promise<void> {
        const op = this.undoManager.redo();
        if (!op) return;
        
        // Apply locally
        this.stateManager.applyOperation(op);
        
        // Broadcast
        if (!this.offlineManager.shouldQueueOperation()) {
            await this.signalR.broadcast('operation:apply', {
                operation: op,
                isRedo: true
            });
        } else {
            this.offlineManager.queueOperation(op);
        }
    }
    
    private setupListeners(): void {
        this.signalR.on('operation:apply', (message) => {
            this.handleRemoteOperation(message);
        });
        
        this.signalR.onConnectionLost(() => {
            this.offlineManager.goOffline();
        });
        
        this.signalR.onReconnected(async () => {
            await this.resyncManager.resync();
            this.offlineManager.goOnline();
        });
    }
}
```

### 15.2 Operation Log (for Resync)

Store recent operations in the .story file for resync:

```javascript
// manifest.json
{
    "vectorClock": { "alice": 15, "bob": 12, "carol": 18 },
    
    // Recent operations (last 1000 or 24 hours)
    "operationLog": {
        "startClock": { "alice": 10, "bob": 8, "carol": 14 },
        "operations": [
            { "id": "op-1001", "userId": "alice", ... },
            { "id": "op-1002", "userId": "bob", ... },
            // ...
        ]
    },
    
    // Checkpoints for longer offline
    "checkpoints": [
        {
            "clock": { "alice": 5, "bob": 4, "carol": 7 },
            "timestamp": "2024-01-15T10:00:00Z",
            "snapshotFile": "history/checkpoint-001.json.gz"
        }
    ]
}
```

---

## Summary

| Feature | Implementation |
|---------|----------------|
| **State updates** | Operation-based with vector clocks |
| **Ordering** | Vector clocks for causal consistency |
| **Concurrent edits** | Operational Transformation (OT) |
| **Per-user undo** | Separate stacks, inverse operations |
| **Offline work** | Queue operations, persist to IndexedDB |
| **Resync** | Exchange clocks, transform, replay |
| **Conflicts** | Auto-resolve with last-write-wins, notify user |

---

## Related Documents

- [Collaboration Protocol](./collaboration-protocol.md)
- [Azure SignalR Integration](./azure-signalr-integration.md)
- [Asset Streaming](./asset-streaming.md)
- [Sharing & Permissions](./sharing-permissions.md)

---

*This specification defines the core synchronization engine. For message formats, see [Collaboration Protocol](./collaboration-protocol.md).*
