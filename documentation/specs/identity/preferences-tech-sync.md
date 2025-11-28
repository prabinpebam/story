# User Preferences: Sync Architecture

## Overview
This specification details the synchronization logic between the local client and the cloud storage provider, handling conflicts and connectivity issues.

## 1. Sync Logic

### 1.1 Master-Slave Relationship
- **Cloud File**: The "Source of Truth" for multi-device consistency.
- **Local Cache**: The "Source of Truth" for the current session and offline work.

### 1.2 Sync Lifecycle

1.  **Startup (Hydration)**:
    - Load from IndexedDB (Instant).
    - Background: Fetch Cloud Metadata (ETag/LastModified).
    - If Cloud is newer -> Download & Merge -> Update UI.
    - If Local is newer (Dirty) -> Upload to Cloud.

2.  **Runtime (Polling/Push)**:
    - Poll Cloud Metadata every 5 minutes (optional).
    - Or rely on "Last Write Wins" during save operations.

## 2. Conflict Resolution

### 2.1 Strategy: Last Write Wins (Field Level)
Since preferences are a JSON object, we can merge them granularly.

**Scenario**:
- Device A changes Theme to Dark (Time: 10:00).
- Device B changes Grid Size to 20px (Time: 10:01).
- Device A syncs. Device B syncs.

**Merge Logic**:
- Compare timestamps of the file modification? No, that's too coarse.
- **Solution**: The `UserPreferences` schema includes a `lastModified` timestamp.
- Ideally, we just overwrite. It's rare for users to change settings on two devices simultaneously.
- **Simple Approach**:
    - If `Cloud.ETag != LastKnown.ETag`:
        - Download Cloud Version.
        - Local changes take precedence if they are "pending" (dirty).
        - Otherwise, Cloud changes overwrite Local.

### 2.2 Optimistic Locking
- Use HTTP `If-Match` headers with ETags when writing to OneDrive/Google Drive.
- If write fails (412 Precondition Failed):
    1.  Read new Cloud File.
    2.  Re-apply local pending changes on top of new Cloud File.
    3.  Retry Write.

## 3. Offline Handling

### 3.1 Dirty Flagging
- In IndexedDB, store a metadata key: `sync_status`.
- Values: `synced`, `dirty`, `error`.

### 3.2 Reconnection Flow
1.  Event: `window.addEventListener('online', ...)`
2.  Check `sync_status`.
3.  If `dirty`:
    - Read Local Preferences.
    - Trigger `SaveQueue.flush()`.

## 4. Security in Transit
- All traffic uses HTTPS (TLS 1.2+).
- The file payload itself is Encrypted (AES-256-GCM) *before* it leaves the client.
- Cloud Provider (Google/Microsoft) only sees a binary blob; they cannot read the settings.
