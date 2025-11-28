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
- [Undo/Redo System](./undo-redo-collaborative.md) - Collaborative undo

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
9. [Implementation](#9-implementation)

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

## 9. Implementation

### 9.1 State Sync Engine Class

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

### 9.2 Operation Log (for Resync)

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
