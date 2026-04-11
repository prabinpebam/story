# Cross-Tab Coordination - Specification

## Overview

When a user opens the same presentation in multiple browser tabs, changes must coordinate to prevent conflicts and data loss. This specification defines how Story handles multi-tab scenarios.

**Scenarios Covered:**
- Same user opens file in two tabs
- User opens file while it's already open in another tab
- Tab crash/close detection
- Storage operations across tabs

**Related Specifications:**
- [File Format & Storage](./file-format-storage.md) - Core file format
- [Browser Caching System](./file-format-storage.md#6-browser-caching-system) - Cache layers
- [Recovery System](./file-format-storage.md#14-recovery-system) - Crash recovery

---

## Table of Contents

1. [Communication Channels](#1-communication-channels)
2. [Tab Leadership](#2-tab-leadership)
3. [State Synchronization](#3-state-synchronization)
4. [Storage Coordination](#4-storage-coordination)
5. [Conflict Prevention](#5-conflict-prevention)
6. [Tab Lifecycle](#6-tab-lifecycle)
7. [Implementation](#7-implementation)

---

## 1. Communication Channels

### 1.1 BroadcastChannel API

Primary mechanism for tab-to-tab communication:

```typescript
class TabCommunicator {
    private channel: BroadcastChannel;
    private tabId: string;
    
    constructor(documentId: string) {
        this.tabId = this.generateTabId();
        this.channel = new BroadcastChannel(`story:${documentId}`);
        
        this.channel.onmessage = (event) => {
            this.handleMessage(event.data);
        };
    }
    
    /**
     * Send message to all other tabs with same document
     */
    broadcast(message: TabMessage): void {
        this.channel.postMessage({
            ...message,
            fromTab: this.tabId,
            timestamp: Date.now()
        });
    }
    
    /**
     * Close channel when done
     */
    close(): void {
        this.channel.close();
    }
    
    private generateTabId(): string {
        return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }
}

interface TabMessage {
    type: TabMessageType;
    payload: any;
    fromTab?: string;
    timestamp?: number;
}

type TabMessageType =
    // Presence
    | 'tab:opened'
    | 'tab:closed'
    | 'tab:heartbeat'
    // Leadership
    | 'leader:claim'
    | 'leader:release'
    | 'leader:ping'
    | 'leader:pong'
    // State
    | 'state:changed'
    | 'state:request'
    | 'state:response'
    // Storage
    | 'storage:saving'
    | 'storage:saved'
    | 'storage:lock'
    | 'storage:unlock';
```

### 1.2 Fallback: localStorage Events

For browsers that don't support BroadcastChannel:

```typescript
class LocalStorageCommunicator {
    private key: string;
    
    constructor(documentId: string) {
        this.key = `story:broadcast:${documentId}`;
        
        window.addEventListener('storage', (event) => {
            if (event.key === this.key && event.newValue) {
                this.handleMessage(JSON.parse(event.newValue));
            }
        });
    }
    
    broadcast(message: TabMessage): void {
        // Write to localStorage triggers 'storage' event in other tabs
        localStorage.setItem(this.key, JSON.stringify({
            ...message,
            id: crypto.randomUUID()  // Ensure unique to trigger event
        }));
        
        // Clean up immediately
        localStorage.removeItem(this.key);
    }
}
```

### 1.3 Fallback: SharedWorker

For complex scenarios requiring shared state:

```typescript
// shared-worker.js
const connections: MessagePort[] = [];

onconnect = (event) => {
    const port = event.ports[0];
    connections.push(port);
    
    port.onmessage = (e) => {
        // Broadcast to all other connections
        for (const conn of connections) {
            if (conn !== port) {
                conn.postMessage(e.data);
            }
        }
    };
    
    port.start();
};

// Client usage
class SharedWorkerCommunicator {
    private worker: SharedWorker;
    
    constructor(documentId: string) {
        this.worker = new SharedWorker('/shared-worker.js', {
            name: `story:${documentId}`
        });
        
        this.worker.port.onmessage = (event) => {
            this.handleMessage(event.data);
        };
        
        this.worker.port.start();
    }
    
    broadcast(message: TabMessage): void {
        this.worker.port.postMessage(message);
    }
}
```

---

## 2. Tab Leadership

### 2.1 Leader Election

One tab acts as "leader" for storage operations:

```typescript
class TabLeaderElection {
    private isLeader = false;
    private leaderId: string | null = null;
    private heartbeatInterval: number | null = null;
    
    private readonly HEARTBEAT_INTERVAL = 3000;  // 3 seconds
    private readonly ELECTION_TIMEOUT = 5000;    // 5 seconds
    
    constructor(private comm: TabCommunicator) {
        this.comm.on('leader:claim', this.handleLeaderClaim.bind(this));
        this.comm.on('leader:heartbeat', this.handleHeartbeat.bind(this));
        this.comm.on('leader:release', this.handleLeaderRelease.bind(this));
    }
    
    /**
     * Attempt to become leader
     */
    async claimLeadership(): Promise<boolean> {
        // Send claim message
        this.comm.broadcast({
            type: 'leader:claim',
            payload: { priority: Date.now() }
        });
        
        // Wait for challenges
        await this.sleep(500);
        
        if (this.leaderId === null || this.leaderId === this.comm.tabId) {
            this.becomeLeader();
            return true;
        }
        
        return false;
    }
    
    private becomeLeader(): void {
        this.isLeader = true;
        this.leaderId = this.comm.tabId;
        
        // Start heartbeat
        this.heartbeatInterval = setInterval(() => {
            this.comm.broadcast({
                type: 'leader:heartbeat',
                payload: {}
            });
        }, this.HEARTBEAT_INTERVAL);
        
        console.log('This tab is now the leader');
    }
    
    private handleLeaderClaim(message: TabMessage): void {
        if (this.isLeader) {
            // We're already leader - send challenge
            this.comm.broadcast({
                type: 'leader:heartbeat',
                payload: {}
            });
        } else if (this.leaderId && this.leaderId !== message.fromTab) {
            // Different leader exists - ignore new claim
        } else {
            // Accept new leader if they have priority
            this.leaderId = message.fromTab!;
        }
    }
    
    private handleLeaderRelease(message: TabMessage): void {
        if (message.fromTab === this.leaderId) {
            this.leaderId = null;
            
            // Try to become new leader
            setTimeout(() => {
                if (!this.leaderId) {
                    this.claimLeadership();
                }
            }, Math.random() * 1000);  // Random delay to prevent race
        }
    }
    
    /**
     * Detect leader failure
     */
    private startLeaderMonitor(): void {
        let lastHeartbeat = Date.now();
        
        this.comm.on('leader:heartbeat', () => {
            lastHeartbeat = Date.now();
        });
        
        setInterval(() => {
            if (!this.isLeader && Date.now() - lastHeartbeat > this.ELECTION_TIMEOUT) {
                console.log('Leader seems dead, starting election');
                this.leaderId = null;
                this.claimLeadership();
            }
        }, 1000);
    }
    
    /**
     * Release leadership on tab close
     */
    releaseLeadership(): void {
        if (this.isLeader) {
            this.comm.broadcast({
                type: 'leader:release',
                payload: {}
            });
            
            this.isLeader = false;
            if (this.heartbeatInterval) {
                clearInterval(this.heartbeatInterval);
            }
        }
    }
}
```

### 2.2 Leader Responsibilities

| Responsibility | Leader | Follower |
|---------------|--------|----------|
| Save to cloud | ✅ | ❌ (request leader) |
| Autosave | ✅ | ❌ |
| IndexedDB writes | ✅ | ❌ |
| SignalR connection | ✅ | ❌ (receive via leader) |
| State authority | ✅ | Follows leader |

---

## 3. State Synchronization

### 3.1 State Change Propagation

When one tab makes changes, propagate to others:

```typescript
class CrossTabStateSync {
    private lastKnownVersion = 0;
    
    constructor(
        private comm: TabCommunicator,
        private stateManager: StateManager,
        private leader: TabLeaderElection
    ) {
        this.comm.on('state:changed', this.handleRemoteChange.bind(this));
        this.comm.on('state:request', this.handleStateRequest.bind(this));
    }
    
    /**
     * Broadcast local change to other tabs
     */
    broadcastChange(operation: Operation): void {
        this.lastKnownVersion++;
        
        this.comm.broadcast({
            type: 'state:changed',
            payload: {
                operation,
                version: this.lastKnownVersion,
                isLeader: this.leader.isLeader
            }
        });
    }
    
    /**
     * Handle change from another tab
     */
    private handleRemoteChange(message: TabMessage): void {
        const { operation, version, isLeader } = message.payload;
        
        // Only apply if from leader (source of truth)
        if (isLeader) {
            // Skip if we're behind
            if (version <= this.lastKnownVersion) {
                return;
            }
            
            this.lastKnownVersion = version;
            
            // Apply operation without broadcasting (would create loop)
            this.stateManager.applyOperationLocally(operation);
            
            // Update UI
            this.ui.refresh();
        }
    }
    
    /**
     * Request full state from leader (on tab open)
     */
    async requestFullState(): Promise<void> {
        this.comm.broadcast({
            type: 'state:request',
            payload: { version: this.lastKnownVersion }
        });
        
        // Wait for response
        const state = await this.waitForStateResponse(3000);
        
        if (state) {
            this.stateManager.setState(state);
        }
    }
    
    private handleStateRequest(message: TabMessage): void {
        if (this.leader.isLeader) {
            // Respond with current state
            this.comm.broadcast({
                type: 'state:response',
                payload: {
                    state: this.stateManager.getState(),
                    version: this.lastKnownVersion,
                    forTab: message.fromTab
                }
            });
        }
    }
}
```

### 3.2 Conflict Detection

Detect if tabs have diverged:

```typescript
class TabConflictDetector {
    /**
     * Check if another tab has conflicting changes
     */
    async checkForConflicts(): Promise<TabConflict | null> {
        const myVersion = this.stateManager.getVersionHash();
        
        // Request versions from other tabs
        this.comm.broadcast({
            type: 'state:version_check',
            payload: { hash: myVersion }
        });
        
        const responses = await this.collectResponses(1000);
        
        for (const response of responses) {
            if (response.payload.hash !== myVersion) {
                return {
                    type: 'version_mismatch',
                    myVersion,
                    theirVersion: response.payload.hash,
                    theirTab: response.fromTab
                };
            }
        }
        
        return null;
    }
    
    /**
     * Resolve conflict by syncing with leader
     */
    async resolveConflict(conflict: TabConflict): Promise<void> {
        if (this.leader.isLeader) {
            // We're leader - other tabs should sync to us
            this.comm.broadcast({
                type: 'state:force_sync',
                payload: { state: this.stateManager.getState() }
            });
        } else {
            // We're follower - request state from leader
            await this.stateSync.requestFullState();
        }
    }
}
```

---

## 4. Storage Coordination

### 4.1 IndexedDB Access

Coordinate IndexedDB writes to prevent corruption:

```typescript
class CrossTabStorageCoordinator {
    private writeLock = false;
    private pendingWrites: Array<() => Promise<void>> = [];
    
    /**
     * Acquire write lock across tabs
     */
    async acquireWriteLock(): Promise<StorageLockHandle> {
        // Only leader can write
        if (!this.leader.isLeader) {
            throw new Error('Only leader tab can write to storage');
        }
        
        // Announce lock
        this.comm.broadcast({
            type: 'storage:lock',
            payload: {}
        });
        
        this.writeLock = true;
        
        return {
            release: () => {
                this.writeLock = false;
                this.comm.broadcast({
                    type: 'storage:unlock',
                    payload: {}
                });
            }
        };
    }
    
    /**
     * Write to IndexedDB (leader only)
     */
    async writeToStorage(key: string, value: any): Promise<void> {
        const lock = await this.acquireWriteLock();
        
        try {
            await this.db.put(key, value);
            
            // Notify other tabs of update
            this.comm.broadcast({
                type: 'storage:updated',
                payload: { key, version: Date.now() }
            });
        } finally {
            lock.release();
        }
    }
}
```

### 4.2 Cloud Save Coordination

Prevent multiple tabs from saving simultaneously:

```typescript
class CrossTabSaveCoordinator {
    /**
     * Save to cloud (coordinates with other tabs)
     */
    async save(): Promise<SaveResult> {
        // Only leader can save
        if (!this.leader.isLeader) {
            // Request leader to save
            return await this.requestLeaderSave();
        }
        
        // Announce save starting
        this.comm.broadcast({
            type: 'storage:saving',
            payload: {}
        });
        
        try {
            const result = await this.performSave();
            
            // Announce save complete
            this.comm.broadcast({
                type: 'storage:saved',
                payload: {
                    success: true,
                    savedAt: Date.now(),
                    etag: result.etag
                }
            });
            
            return result;
        } catch (error) {
            this.comm.broadcast({
                type: 'storage:saved',
                payload: { success: false, error: error.message }
            });
            throw error;
        }
    }
    
    /**
     * Follower requests leader to save
     */
    private async requestLeaderSave(): Promise<SaveResult> {
        this.comm.broadcast({
            type: 'storage:save_request',
            payload: {}
        });
        
        // Wait for save result
        return await this.waitForSaveResult(30000);
    }
}
```

---

## 5. Conflict Prevention

### 5.1 Single Active Tab Mode (Optional)

For simpler UX, only allow one active editing tab:

```typescript
class SingleActiveTabMode {
    /**
     * Check if another tab is already editing
     */
    async checkExistingTabs(): Promise<ExistingTabInfo | null> {
        this.comm.broadcast({
            type: 'tab:ping',
            payload: {}
        });
        
        const responses = await this.collectResponses(500);
        
        if (responses.length > 0) {
            return {
                exists: true,
                count: responses.length,
                oldestTab: this.findOldest(responses)
            };
        }
        
        return null;
    }
    
    /**
     * Show dialog when opening in new tab
     */
    async handleExistingTab(info: ExistingTabInfo): Promise<'continue' | 'switch'> {
        return await this.ui.showDialog({
            title: 'Presentation Already Open',
            message: 'This presentation is open in another tab. ' +
                     'Editing in multiple tabs may cause conflicts.',
            options: [
                { label: 'Continue Here', value: 'continue' },
                { label: 'Switch to Other Tab', value: 'switch' }
            ]
        });
    }
    
    /**
     * Focus the other tab
     */
    async switchToOtherTab(): Promise<void> {
        this.comm.broadcast({
            type: 'tab:focus_request',
            payload: {}
        });
        
        // Close this tab
        window.close();
    }
}
```

### 5.2 Edit Locking

Lock specific elements being edited:

```typescript
class CrossTabElementLock {
    private locks = new Map<string, string>();  // elementId -> tabId
    
    /**
     * Attempt to lock an element for editing
     */
    async lockElement(elementId: string): Promise<boolean> {
        const existingLock = this.locks.get(elementId);
        
        if (existingLock && existingLock !== this.comm.tabId) {
            return false;  // Already locked by another tab
        }
        
        this.locks.set(elementId, this.comm.tabId);
        
        this.comm.broadcast({
            type: 'element:locked',
            payload: { elementId }
        });
        
        return true;
    }
    
    /**
     * Release element lock
     */
    unlockElement(elementId: string): void {
        if (this.locks.get(elementId) === this.comm.tabId) {
            this.locks.delete(elementId);
            
            this.comm.broadcast({
                type: 'element:unlocked',
                payload: { elementId }
            });
        }
    }
    
    /**
     * Handle lock from other tab
     */
    private handleRemoteLock(message: TabMessage): void {
        const { elementId } = message.payload;
        this.locks.set(elementId, message.fromTab!);
        
        // Visual feedback
        this.ui.showElementLocked(elementId, 'Another tab is editing');
    }
}
```

---

## 6. Tab Lifecycle

### 6.1 Tab Open

```typescript
class TabLifecycleManager {
    async onTabOpen(): Promise<void> {
        // 1. Generate tab ID
        this.tabId = this.generateTabId();
        
        // 2. Check for existing tabs
        const existing = await this.checkExistingTabs();
        
        if (existing) {
            const choice = await this.handleExistingTab(existing);
            if (choice === 'switch') {
                return;
            }
        }
        
        // 3. Join communication channel
        this.comm = new TabCommunicator(this.documentId);
        
        // 4. Announce presence
        this.comm.broadcast({
            type: 'tab:opened',
            payload: { openedAt: Date.now() }
        });
        
        // 5. Attempt leadership
        await this.leader.claimLeadership();
        
        // 6. If not leader, sync state from leader
        if (!this.leader.isLeader) {
            await this.stateSync.requestFullState();
        }
        
        // 7. Start heartbeat
        this.startHeartbeat();
    }
}
```

### 6.2 Tab Close

```typescript
class TabLifecycleManager {
    setupCloseHandlers(): void {
        // Handle tab close
        window.addEventListener('beforeunload', (event) => {
            this.onTabClose();
        });
        
        // Handle visibility change (tab backgrounded)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.onTabHidden();
            } else {
                this.onTabVisible();
            }
        });
    }
    
    onTabClose(): void {
        // 1. Release leadership
        this.leader.releaseLeadership();
        
        // 2. Release any element locks
        this.elementLock.releaseAll();
        
        // 3. Announce departure
        this.comm.broadcast({
            type: 'tab:closed',
            payload: {}
        });
        
        // 4. Close communication channel
        this.comm.close();
    }
    
    onTabHidden(): void {
        // Reduce activity when tab is hidden
        this.reduceHeartbeatFrequency();
        
        // Release non-essential locks
        this.elementLock.releaseTemporary();
    }
    
    onTabVisible(): void {
        // Resume normal activity
        this.restoreHeartbeatFrequency();
        
        // Check for updates while we were hidden
        this.stateSync.checkForUpdates();
    }
}
```

### 6.3 Tab Crash Detection

```typescript
class TabCrashDetector {
    private knownTabs = new Map<string, number>();  // tabId -> lastHeartbeat
    
    private readonly CRASH_THRESHOLD = 10000;  // 10 seconds
    
    /**
     * Monitor for crashed tabs
     */
    startCrashMonitor(): void {
        // Track heartbeats
        this.comm.on('tab:heartbeat', (message) => {
            this.knownTabs.set(message.fromTab!, Date.now());
        });
        
        // Check for missing heartbeats
        setInterval(() => {
            const now = Date.now();
            
            for (const [tabId, lastSeen] of this.knownTabs) {
                if (now - lastSeen > this.CRASH_THRESHOLD) {
                    this.handleCrashedTab(tabId);
                }
            }
        }, 5000);
    }
    
    private handleCrashedTab(tabId: string): void {
        console.log('Tab appears to have crashed:', tabId);
        
        // Remove from known tabs
        this.knownTabs.delete(tabId);
        
        // Release any locks held by that tab
        this.elementLock.releaseForTab(tabId);
        
        // If it was the leader, trigger election
        if (this.leader.leaderId === tabId) {
            this.leader.claimLeadership();
        }
    }
}
```

---

## 7. Implementation

### 7.1 CrossTabManager Class

```typescript
class CrossTabManager {
    private comm: TabCommunicator;
    private leader: TabLeaderElection;
    private stateSync: CrossTabStateSync;
    private storage: CrossTabStorageCoordinator;
    private lifecycle: TabLifecycleManager;
    private crash: TabCrashDetector;
    
    constructor(private documentId: string) {}
    
    async initialize(): Promise<void> {
        // Initialize communication
        this.comm = new TabCommunicator(this.documentId);
        
        // Initialize subsystems
        this.leader = new TabLeaderElection(this.comm);
        this.stateSync = new CrossTabStateSync(this.comm, stateManager, this.leader);
        this.storage = new CrossTabStorageCoordinator(this.comm, this.leader);
        this.lifecycle = new TabLifecycleManager(this.comm, this.leader, this.stateSync);
        this.crash = new TabCrashDetector(this.comm, this.leader);
        
        // Start lifecycle
        await this.lifecycle.onTabOpen();
        this.crash.startCrashMonitor();
    }
    
    /**
     * Check if this tab is the leader
     */
    isLeader(): boolean {
        return this.leader.isLeader;
    }
    
    /**
     * Broadcast state change to other tabs
     */
    broadcastChange(operation: Operation): void {
        this.stateSync.broadcastChange(operation);
    }
    
    /**
     * Save (coordinates with other tabs)
     */
    async save(): Promise<SaveResult> {
        return await this.storage.save();
    }
    
    /**
     * Cleanup on tab close
     */
    cleanup(): void {
        this.lifecycle.onTabClose();
    }
}
```

### 7.2 Usage

```typescript
// Initialize on document open
const crossTab = new CrossTabManager(documentId);
await crossTab.initialize();

// Broadcast changes
stateManager.on('change', (operation) => {
    crossTab.broadcastChange(operation);
});

// Save (will coordinate with other tabs)
await crossTab.save();

// Cleanup on close
window.addEventListener('beforeunload', () => {
    crossTab.cleanup();
});
```

---

## Summary

| Component | Purpose |
|-----------|---------|
| **BroadcastChannel** | Primary tab-to-tab communication |
| **Leader Election** | One tab controls storage operations |
| **State Sync** | Keep all tabs consistent |
| **Storage Coordination** | Prevent concurrent writes |
| **Lifecycle Management** | Handle open/close/crash |

---

## Related Documents

- [File Format & Storage](./file-format-storage.md)
- [Recovery System](./file-format-storage.md#14-recovery-system)
- [Browser Caching System](./file-format-storage.md#6-browser-caching-system)

---

*Cross-tab coordination ensures consistent behavior when users open the same presentation in multiple browser tabs.*
