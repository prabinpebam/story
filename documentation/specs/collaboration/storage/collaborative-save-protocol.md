# Collaborative Save Protocol - Specification

## Overview

This specification defines how file save operations coordinate with real-time collaboration. When multiple users edit a document, save operations must be carefully orchestrated to prevent data loss and ensure all changes are captured.

**Key Challenges:**
- Owner saves while collaborators have pending operations
- Collaborator disconnects mid-edit before owner saves
- Multiple rapid edits from different users
- Network latency between operation and save

**Related Specifications:**
- [File Format & Storage](./file-format-storage.md) - Core file format
- [State Sync Engine](../state-sync-engine.md) - Real-time sync
- [Cloud Storage Abstraction](../cloud-storage-abstraction.md) - Storage API

---

## Table of Contents

1. [Save Ownership Model](#1-save-ownership-model)
2. [Save Coordination Protocol](#2-save-coordination-protocol)
3. [Operation Capture](#3-operation-capture)
4. [Conflict Prevention](#4-conflict-prevention)
5. [Incremental Save](#5-incremental-save)
6. [Save Failure Recovery](#6-save-failure-recovery)
7. [Implementation](#7-implementation)

---

## 1. Save Ownership Model

### 1.1 Who Can Save Where

```
┌─────────────────────────────────────────────────────────────────┐
│                    SAVE PERMISSION MODEL                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  OWNER (File Creator / Storage Account Owner)                  │
│  ├── ✅ Save to cloud storage (primary location)               │
│  ├── ✅ Autosave to cloud                                      │
│  ├── ✅ Save to local file                                     │
│  ├── ✅ Export copies                                          │
│  └── ✅ Save version snapshots                                 │
│                                                                 │
│  COLLABORATOR (Shared Access)                                   │
│  ├── ❌ Cannot save to owner's cloud storage                   │
│  ├── ✅ Export local copy (.str file)                          │
│  ├── ✅ Export PDF/images                                      │
│  ├── ✅ Changes flow via SignalR to owner                      │
│  └── ⚠️ Must trust owner to save their contributions          │
│                                                                 │
│  VIEWER (Read-Only)                                             │
│  ├── ❌ Cannot save anywhere                                   │
│  ├── ✅ Export PDF (watermarked if configured)                 │
│  └── ✅ View only                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Save Triggers

| Trigger | Who | Action |
|---------|-----|--------|
| Ctrl+S / Cmd+S | Owner only | Immediate save to cloud |
| Autosave timer (30s) | Owner only | Background save to cloud |
| Window blur | Owner only | Save if dirty |
| Before close | Owner | Save; Collaborators: warning |
| Manual "Save As" | Anyone | Local file export |
| Export PDF | Anyone | Generate and download |

---

## 2. Save Coordination Protocol

### 2.1 Pre-Save Announcement

Before saving, the owner broadcasts intent to capture pending operations:

```typescript
interface SaveCoordinationProtocol {
    // Phase 1: Announce save intent
    preSave: {
        message: 'save:starting';
        initiator: string;          // Owner's userId
        timestamp: number;
        requestId: string;
    };
    
    // Phase 2: Collaborators flush pending operations
    flush: {
        message: 'save:flush';
        operations: Operation[];
        fromUser: string;
        vectorClock: VectorClock;
    };
    
    // Phase 3: Owner confirms receipt
    acknowledge: {
        message: 'save:ack';
        receivedFrom: string[];
        capturedClock: VectorClock;
    };
    
    // Phase 4: Owner performs save
    execute: {
        message: 'save:executing';
        // No response expected
    };
    
    // Phase 5: Save complete notification
    complete: {
        message: 'save:complete';
        success: boolean;
        savedClock: VectorClock;
        newEtag: string;
        savedAt: number;
    };
}
```

### 2.2 Coordination Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│              SAVE COORDINATION TIMELINE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  T=0    Owner presses Ctrl+S                                   │
│         │                                                       │
│  T=10   Owner broadcasts "save:starting"                       │
│         │                                                       │
│         ├──────────────────────────────────────────────┐       │
│         │ Collaborators receive "save:starting"         │       │
│         │                                               │       │
│  T=50   │ Alice sends pending ops (3 operations)       │       │
│  T=80   │ Bob sends pending ops (1 operation)          │       │
│  T=120  │ Carol sends pending ops (0 operations)       │       │
│         └──────────────────────────────────────────────┘       │
│                                                                 │
│  T=200  Owner waits for all responses (timeout: 2000ms)        │
│         │                                                       │
│  T=250  Owner applies received operations                      │
│         │                                                       │
│  T=300  Owner broadcasts "save:executing"                      │
│         │                                                       │
│  T=500  Owner writes to cloud storage                          │
│         │                                                       │
│  T=800  Owner broadcasts "save:complete"                       │
│         │                                                       │
│         ├──────────────────────────────────────────────┐       │
│         │ All collaborators update their lastSavedClock │       │
│         │ Clear pending save warnings                   │       │
│         └──────────────────────────────────────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Timeout Handling

If a collaborator doesn't respond to save:starting:

```typescript
class SaveCoordinator {
    private readonly FLUSH_TIMEOUT = 2000;  // 2 seconds
    
    async coordinateSave(): Promise<SaveResult> {
        // 1. Broadcast save intent
        await this.signalR.broadcast('save:starting', {
            requestId: this.generateRequestId(),
            timestamp: Date.now()
        });
        
        // 2. Collect responses with timeout
        const responses = await this.collectResponses(this.FLUSH_TIMEOUT);
        
        // 3. Check for missing responses
        const activeUsers = this.presence.getActiveUsers();
        const respondedUsers = new Set(responses.map(r => r.fromUser));
        const missingUsers = activeUsers.filter(u => !respondedUsers.has(u.id));
        
        if (missingUsers.length > 0) {
            // Some users didn't respond - they may have pending changes
            console.warn('Missing responses from:', missingUsers);
            
            // Decision: Save anyway but log the gap
            this.logPotentialGap(missingUsers);
        }
        
        // 4. Apply received operations
        for (const response of responses) {
            for (const op of response.operations) {
                await this.applyOperation(op);
            }
        }
        
        // 5. Perform actual save
        return await this.executeSave();
    }
}
```

### 2.4 Collaborator Flush Behavior

When collaborators receive save:starting:

```typescript
class CollaboratorSaveHandler {
    async handleSaveStarting(message: SaveStartingMessage): Promise<void> {
        // 1. Stop accepting new operations temporarily
        this.operationQueue.pause();
        
        // 2. Get any pending operations not yet sent
        const pendingOps = this.operationQueue.getPending();
        
        // 3. Send flush response
        await this.signalR.send('save:flush', {
            operations: pendingOps,
            fromUser: this.userId,
            vectorClock: this.vectorClock.current(),
            requestId: message.requestId
        });
        
        // 4. Resume accepting operations
        this.operationQueue.resume();
        
        // 5. Wait for save:complete to update our state
    }
    
    async handleSaveComplete(message: SaveCompleteMessage): Promise<void> {
        if (message.success) {
            // Update our knowledge of what's persisted
            this.lastSavedClock = message.savedClock;
            this.pendingSaveWarning = false;
            
            // Show "All changes saved" indicator
            this.ui.showSaveStatus('saved', message.savedAt);
        } else {
            // Owner's save failed - show warning
            this.ui.showSaveStatus('save_failed', null);
        }
    }
}
```

---

## 3. Operation Capture

### 3.1 What Gets Saved

The save captures the complete document state including all applied operations:

```typescript
interface SaveSnapshot {
    // Full document state at save time
    document: {
        metadata: DocumentMetadata;
        slides: Slide[];
        theme: Theme;
        masters: MasterSlide[];
    };
    
    // Collaboration state for resync
    collaboration: {
        vectorClock: VectorClock;
        operationLog: {
            startClock: VectorClock;
            operations: Operation[];
        };
        lastSavedBy: string;
        lastSavedAt: number;
    };
    
    // Asset manifest
    assets: {
        index: AssetIndex;
        newAssets: Asset[];      // Added since last save
        deletedAssets: string[]; // Removed since last save
    };
}
```

### 3.2 Operation Log Retention

Keep recent operations for collaborators to resync:

```typescript
class OperationLogManager {
    private readonly MAX_OPERATIONS = 1000;
    private readonly MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
    
    /**
     * Trim operation log before save
     */
    prepareForSave(operations: Operation[]): OperationLog {
        const now = Date.now();
        const cutoffTime = now - this.MAX_AGE_MS;
        
        // Filter by age
        let retained = operations.filter(op => op.timestamp > cutoffTime);
        
        // Limit by count
        if (retained.length > this.MAX_OPERATIONS) {
            retained = retained.slice(-this.MAX_OPERATIONS);
        }
        
        // Calculate clock range
        const startClock = this.calculateMinClock(retained);
        const endClock = this.calculateMaxClock(retained);
        
        return {
            startClock,
            endClock,
            operations: retained,
            retentionPolicy: {
                maxOperations: this.MAX_OPERATIONS,
                maxAge: this.MAX_AGE_MS
            }
        };
    }
    
    /**
     * Check if we can provide ops for a given clock
     */
    canResyncFrom(requestedClock: VectorClock): boolean {
        return this.vectorClockCompare(requestedClock, this.operationLog.startClock) >= 0;
    }
}
```

### 3.3 Asset Handling During Save

New assets from collaborators must be included:

```typescript
class CollaborativeAssetManager {
    /**
     * Track assets added by collaborators
     */
    private pendingAssets = new Map<string, PendingAsset>();
    
    /**
     * When collaborator adds an asset, they send the data via SignalR
     * (for small assets) or upload to temporary location
     */
    async handleAssetFromCollaborator(message: AssetMessage): Promise<void> {
        if (message.dataUrl) {
            // Small asset sent inline
            this.pendingAssets.set(message.assetId, {
                id: message.assetId,
                blob: this.dataUrlToBlob(message.dataUrl),
                fromUser: message.userId,
                addedAt: Date.now()
            });
        } else if (message.tempUrl) {
            // Large asset uploaded to temp storage
            this.pendingAssets.set(message.assetId, {
                id: message.assetId,
                tempUrl: message.tempUrl,
                fromUser: message.userId,
                addedAt: Date.now()
            });
        }
    }
    
    /**
     * On save, include all pending assets in the .str file
     */
    async getPendingAssetsForSave(): Promise<Asset[]> {
        const assets: Asset[] = [];
        
        for (const [id, pending] of this.pendingAssets) {
            if (pending.blob) {
                assets.push({
                    id,
                    blob: pending.blob,
                    metadata: await this.extractMetadata(pending.blob)
                });
            } else if (pending.tempUrl) {
                // Download from temp location
                const blob = await fetch(pending.tempUrl).then(r => r.blob());
                assets.push({
                    id,
                    blob,
                    metadata: await this.extractMetadata(blob)
                });
            }
        }
        
        return assets;
    }
}
```

---

## 4. Conflict Prevention

### 4.1 ETag-Based Conflict Detection

Prevent overwriting changes made outside of Story:

```typescript
class ConflictPreventor {
    private expectedEtag: string | null = null;
    
    async save(content: Blob): Promise<SaveResult> {
        try {
            const result = await this.storage.save({
                fileId: this.fileId,
                content,
                expectedEtag: this.expectedEtag,
                onConflict: 'fail'
            });
            
            this.expectedEtag = result.newEtag;
            return { success: true, etag: result.newEtag };
            
        } catch (error) {
            if (error.code === 'ETAG_MISMATCH') {
                // File was modified externally
                return await this.handleConflict();
            }
            throw error;
        }
    }
    
    private async handleConflict(): Promise<SaveResult> {
        // Fetch remote version
        const remoteFile = await this.storage.load(this.fileId);
        const remoteManifest = await this.parseManifest(remoteFile);
        
        // Check if it was another Story session
        if (remoteManifest.collaboration?.documentId === this.documentId) {
            // Same document - try to merge
            return await this.attemptMerge(remoteManifest);
        } else {
            // Different file entirely - prompt user
            return await this.promptConflictResolution(remoteFile);
        }
    }
}
```

### 4.2 Save Lock

Prevent multiple simultaneous saves:

```typescript
class SaveLock {
    private isSaving = false;
    private saveQueue: Array<() => void> = [];
    
    /**
     * Acquire save lock (only one save at a time)
     */
    async acquire(): Promise<SaveLockHandle> {
        if (this.isSaving) {
            // Wait for current save to complete
            await new Promise<void>(resolve => {
                this.saveQueue.push(resolve);
            });
        }
        
        this.isSaving = true;
        
        return {
            release: () => {
                this.isSaving = false;
                const next = this.saveQueue.shift();
                if (next) next();
            }
        };
    }
}

// Usage
async function saveDocument(): Promise<void> {
    const lock = await saveLock.acquire();
    
    try {
        await performSave();
    } finally {
        lock.release();
    }
}
```

---

## 5. Incremental Save

### 5.1 Change Detection

Only update changed slides and assets:

```typescript
interface IncrementalSaveStrategy {
    // Track what changed since last save
    changeTracker: {
        modifiedSlides: Set<string>;
        addedSlides: Set<string>;
        deletedSlides: Set<string>;
        modifiedAssets: Set<string>;
        addedAssets: Set<string>;
        deletedAssets: Set<string>;
        metadataChanged: boolean;
        themeChanged: boolean;
    };
    
    // Determine what to update
    plan(): IncrementalSavePlan;
}

interface IncrementalSavePlan {
    // What to write
    writeSlides: string[];      // Slide IDs to update in ZIP
    writeAssets: string[];      // Asset IDs to add/update
    
    // What to remove
    deleteSlides: string[];
    deleteAssets: string[];
    
    // Always update
    updateManifest: true;
    updateOperationLog: true;
    
    // Estimated size/time
    estimatedBytes: number;
    estimatedTimeMs: number;
}
```

### 5.2 Partial ZIP Update

Modify ZIP without rewriting entire file:

```typescript
class IncrementalZipWriter {
    /**
     * Update specific entries in ZIP without full rewrite
     * Note: Only works if cloud storage supports partial updates
     */
    async updateEntries(
        fileId: string,
        updates: Map<string, Blob>,
        deletes: Set<string>
    ): Promise<void> {
        // Most cloud providers don't support partial file updates
        // Fall back to full rewrite with smart caching
        
        // 1. Read current ZIP structure (headers only)
        const structure = await this.readZipStructure(fileId);
        
        // 2. Identify unchanged entries (can copy bytes directly)
        const unchanged = this.findUnchangedEntries(structure, updates, deletes);
        
        // 3. Build new ZIP
        const newZip = new ZipWriter();
        
        // Copy unchanged entries (fast, just copy bytes)
        for (const entry of unchanged) {
            await newZip.copyEntry(fileId, entry);
        }
        
        // Add updated entries
        for (const [path, blob] of updates) {
            await newZip.addEntry(path, blob);
        }
        
        // 4. Upload new ZIP
        await this.storage.save({
            fileId,
            content: await newZip.finalize()
        });
    }
}
```

### 5.3 Smart Autosave

Autosave intelligently based on change volume:

```typescript
class SmartAutosave {
    private pendingChanges = 0;
    private lastSave = Date.now();
    private timer: number | null = null;
    
    private readonly MIN_INTERVAL = 10000;   // 10 seconds min
    private readonly MAX_INTERVAL = 60000;   // 60 seconds max
    private readonly CHANGE_THRESHOLD = 5;   // Save after 5 changes
    
    /**
     * Called when any change occurs
     */
    onchange(): void {
        this.pendingChanges++;
        
        if (this.pendingChanges >= this.CHANGE_THRESHOLD) {
            // Many changes - save soon
            this.scheduleAutosave(this.MIN_INTERVAL);
        } else {
            // Few changes - save later
            this.scheduleAutosave(this.MAX_INTERVAL);
        }
    }
    
    private scheduleAutosave(delay: number): void {
        if (this.timer) {
            clearTimeout(this.timer);
        }
        
        const timeSinceLastSave = Date.now() - this.lastSave;
        const adjustedDelay = Math.max(delay - timeSinceLastSave, 0);
        
        this.timer = setTimeout(async () => {
            await this.performAutosave();
            this.pendingChanges = 0;
            this.lastSave = Date.now();
            this.timer = null;
        }, adjustedDelay);
    }
}
```

---

## 6. Save Failure Recovery

### 6.1 Failure Modes

| Failure | Cause | Recovery |
|---------|-------|----------|
| **Network timeout** | Slow/unstable connection | Retry with backoff |
| **Auth expired** | Token expired mid-save | Refresh token, retry |
| **Quota exceeded** | Storage full | Save locally, prompt cleanup |
| **Conflict** | External edit | Merge or prompt |
| **Corruption** | Incomplete write | Retry, verify checksum |
| **Service down** | Provider outage | Queue for later, save locally |

### 6.2 Recovery Implementation

```typescript
class SaveRecovery {
    private readonly MAX_RETRIES = 3;
    private saveQueue: SaveRequest[] = [];
    
    async saveWithRecovery(content: Blob): Promise<SaveResult> {
        for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
            try {
                return await this.attemptSave(content);
            } catch (error) {
                if (!this.isRetryable(error)) {
                    return await this.handleNonRetryableError(error, content);
                }
                
                // Wait before retry (exponential backoff)
                await this.sleep(1000 * Math.pow(2, attempt - 1));
            }
        }
        
        // All retries failed - save locally
        return await this.fallbackToLocal(content);
    }
    
    private isRetryable(error: Error): boolean {
        return [
            'NETWORK_TIMEOUT',
            'NETWORK_UNSTABLE',
            'SERVICE_UNAVAILABLE'
        ].includes((error as any).code);
    }
    
    private async handleNonRetryableError(
        error: Error, 
        content: Blob
    ): Promise<SaveResult> {
        switch ((error as any).code) {
            case 'AUTH_EXPIRED':
                await this.refreshAuth();
                return await this.saveWithRecovery(content);
                
            case 'QUOTA_EXCEEDED':
                return await this.promptQuotaResolution(content);
                
            case 'CONFLICT_DETECTED':
                return await this.resolveConflict(content);
                
            default:
                // Unknown error - save locally and report
                await this.fallbackToLocal(content);
                throw error;
        }
    }
    
    private async fallbackToLocal(content: Blob): Promise<SaveResult> {
        // Save to IndexedDB
        const recoveryId = await this.saveToIndexedDB(content);
        
        // Queue for cloud sync when possible
        this.saveQueue.push({
            id: recoveryId,
            content,
            queuedAt: Date.now()
        });
        
        // Notify user
        this.ui.showNotification({
            type: 'warning',
            message: 'Saved locally. Will sync when connection restores.',
            action: {
                label: 'Save to File',
                callback: () => this.promptLocalSave(content)
            }
        });
        
        return { success: true, location: 'local', recoveryId };
    }
}
```

### 6.3 Pending Save Warning

Warn collaborators if owner hasn't saved recently:

```typescript
class PendingSaveWarning {
    private readonly WARN_AFTER = 5 * 60 * 1000;  // 5 minutes
    
    checkPendingSave(): void {
        const timeSinceSave = Date.now() - this.lastSaveTimestamp;
        const pendingChanges = this.changeTracker.getChangeCount();
        
        if (timeSinceSave > this.WARN_AFTER && pendingChanges > 0) {
            if (this.isOwner) {
                // Owner: prompt to save
                this.ui.showNotification({
                    type: 'info',
                    message: `${pendingChanges} unsaved changes`,
                    action: { label: 'Save Now', callback: () => this.save() }
                });
            } else {
                // Collaborator: warn that owner should save
                this.ui.showNotification({
                    type: 'warning',
                    message: 'Changes not saved. Ask owner to save.',
                    persistent: true
                });
            }
        }
    }
}
```

---

## 7. Implementation

### 7.1 SaveCoordinator Class

```typescript
class SaveCoordinator {
    private lock = new SaveLock();
    private recovery = new SaveRecovery();
    private changeTracker = new ChangeTracker();
    private assetManager = new CollaborativeAssetManager();
    
    constructor(
        private storage: CloudStorageProvider,
        private signalR: SignalRClient,
        private stateManager: StateManager
    ) {
        this.setupListeners();
    }
    
    /**
     * Main save entry point (for owner)
     */
    async save(options: SaveOptions = {}): Promise<SaveResult> {
        if (!this.isOwner()) {
            throw new Error('Only owner can save to cloud storage');
        }
        
        const lockHandle = await this.lock.acquire();
        
        try {
            // Phase 1: Coordinate with collaborators
            await this.signalR.broadcast('save:starting', {
                requestId: crypto.randomUUID(),
                timestamp: Date.now()
            });
            
            // Phase 2: Wait for flush responses
            const responses = await this.collectFlushResponses(2000);
            
            // Phase 3: Apply any received operations
            for (const response of responses) {
                for (const op of response.operations) {
                    await this.stateManager.applyOperation(op);
                }
            }
            
            // Phase 4: Prepare save content
            const content = await this.prepareSaveContent();
            
            // Phase 5: Execute save with recovery
            const result = await this.recovery.saveWithRecovery(content);
            
            // Phase 6: Notify collaborators
            await this.signalR.broadcast('save:complete', {
                success: result.success,
                savedClock: this.stateManager.getVectorClock(),
                newEtag: result.etag,
                savedAt: Date.now()
            });
            
            // Phase 7: Update local state
            this.changeTracker.reset();
            this.ui.showSaveStatus('saved');
            
            return result;
            
        } finally {
            lockHandle.release();
        }
    }
    
    /**
     * Handle save coordination from owner (for collaborators)
     */
    private setupListeners(): void {
        this.signalR.on('save:starting', async (message) => {
            if (!this.isOwner()) {
                await this.handleSaveStarting(message);
            }
        });
        
        this.signalR.on('save:complete', (message) => {
            if (!this.isOwner()) {
                this.handleSaveComplete(message);
            }
        });
    }
}
```

### 7.2 Usage Examples

```typescript
// Owner saves
await saveCoordinator.save();

// Owner autosaves
autoSaveManager.start({
    interval: 30000,
    onSave: () => saveCoordinator.save({ silent: true })
});

// Collaborator exports local copy
await exportManager.exportLocal({
    format: 'str',
    filename: 'My Presentation (Copy).str'
});
```

---

## Summary

| Role | Can Save To | How Changes Persist |
|------|-------------|---------------------|
| **Owner** | Cloud storage | Direct save via Ctrl+S or autosave |
| **Collaborator** | Local only | Operations sent to owner via SignalR |
| **Viewer** | N/A | Export PDF only |

| Phase | Action | Timeout |
|-------|--------|---------|
| 1 | Announce save:starting | - |
| 2 | Collect flush responses | 2s |
| 3 | Apply received operations | - |
| 4 | Write to cloud storage | 30s |
| 5 | Broadcast save:complete | - |

---

## Related Documents

- [File Format & Storage](./file-format-storage.md)
- [State Sync Engine](../state-sync-engine.md)
- [Cloud Storage Abstraction](../cloud-storage-abstraction.md)
- [Error Handling (Section 17)](./file-format-storage.md#17-error-handling)

---

*This protocol ensures all collaborator changes are captured before save, preventing data loss in real-time collaboration.*
