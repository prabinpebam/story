# User Preferences: Auto-Save Architecture

## Overview
This specification details the technical implementation of the auto-save mechanism for user preferences, ensuring performance and data integrity.

## 1. Save Strategy

### 1.1 "Save on Change" Model
- Unlike traditional "Apply/Cancel" dialogs, Story preferences save automatically as the user modifies them.
- This aligns with modern web app expectations (e.g., Google Docs, VS Code settings).

### 1.2 The Save Pipeline

```mermaid
graph LR
    A[UI Change Event] --> B[Update In-Memory State]
    B --> C[Debounce Timer]
    C --> D[Write to IndexedDB (Local)]
    D --> E[Encrypt Data]
    E --> F[Upload to Cloud]
```

## 2. Debouncing & Throttling

To prevent excessive writes and network requests:

- **Local Write (IndexedDB)**: Debounce **500ms**.
    - Fast enough to feel instant.
    - Prevents thrashing during slider drags (e.g., Grid Size slider).
- **Cloud Sync**: Debounce **5000ms** (5 seconds) or **On Close**.
    - Batches multiple changes into one network request.
    - Reduces API quota usage.

## 3. Implementation Logic

### 3.1 State Management
- Use a reactive store (e.g., Signals or Observable) for preferences.
- Listeners trigger the save pipeline.

### 3.2 Save Queue
```typescript
class SaveQueue {
    private pendingChanges: Partial<UserPreferences> = {};
    private saveTimer: any;

    enqueue(change: Partial<UserPreferences>) {
        // Merge changes
        this.pendingChanges = { ...this.pendingChanges, ...change };
        
        // Update UI immediately
        this.store.update(change);
        
        // Reset timer
        clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => this.flush(), 5000);
        
        // Immediate local save
        this.localCache.save(this.store.get());
    }

    async flush() {
        if (Object.keys(this.pendingChanges).length === 0) return;
        
        try {
            await this.cloudSync.save(this.store.get());
            this.pendingChanges = {};
        } catch (err) {
            // Retry logic handled by Sync Manager
        }
    }
}
```

## 4. Critical Events

### 4.1 App Closure / Tab Close
- Listen for `beforeunload`.
- Attempt to flush pending changes immediately.
- Note: Network requests in `beforeunload` are unreliable.
- **Mitigation**: The Local IndexedDB save happens much faster (500ms). On next launch, the Sync Manager checks if Local is newer than Cloud and syncs up.

### 4.2 Offline Mode
- If offline, the Cloud Sync step is skipped.
- `isDirty` flag is set in IndexedDB.
- `NetworkOnline` event triggers a flush of dirty state.
