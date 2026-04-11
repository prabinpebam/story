# User Preferences: Import, Export & Migration

## Overview
This specification covers the manual management of preference files, including importing existing files, exporting for backup, and migrating from legacy storage systems.

## 1. Import Preferences Flow

### 1.1 Use Case
- User stores preferences in a non-standard location.
- User wants to switch to a backup preferences file.
- Automatic discovery failed.

### 1.2 UI Flow
1.  **Trigger**: User clicks "Settings" -> "Manage Preferences" -> "Import".
2.  **File Picker**: System native file picker opens (accepts `.str`).
3.  **Validation**:
    - App reads `manifest.json` inside the ZIP.
    - Checks `formatType: "story-preferences"`.
4.  **Decryption Attempt**:
    - App attempts to decrypt using current OAuth session.
5.  **Outcome**:
    - **Success**: "Preferences loaded successfully." App reloads to apply settings.
    - **Wrong Identity**: "This file belongs to [Email]. Please sign in with that account to import."
    - **Invalid Format**: "This is not a valid preferences file."

## 2. Export Preferences Flow

### 2.1 Use Case
- User wants a manual backup.
- User wants to move preferences to a different cloud provider manually.

### 2.2 UI Flow
1.  **Trigger**: User clicks "Settings" -> "Manage Preferences" -> "Export".
2.  **Generation**: App bundles current state into `story-preferences.str`.
3.  **Download**: Browser triggers file download.
4.  **Filename**: Defaults to `story-preferences-[date].str`.

## 3. Identity Linking (Merge) Flow

### 3.1 Use Case
- User has preferences created with Google Account A.
- User wants to access them with Microsoft Account B.

### 3.2 Flow
1.  **Initial State**: User signed in with Account A (Owner).
2.  **Action**: User goes to "Profile" -> "Linked Accounts" -> "Add Account".
3.  **Auth Challenge**: User performs OAuth flow for Account B.
4.  **Key Wrapping**:
    - App uses Account A's key to decrypt the master key.
    - App derives Account B's key from the new token.
    - App wraps the master key with Account B's key.
    - App updates `access/allowed.json` and `identity.json`.
5.  **Save**: Updated file saved to cloud.
6.  **Result**: Account B can now decrypt the file independently.

## 4. Migration from LocalStorage (Legacy)

### 4.1 Context
- Existing users have settings in browser `localStorage`.
- We want to move them to the new `.str` file system.

### 4.2 Automatic Migration Flow
1.  **Detection**: On app load, check `localStorage.getItem('story:preferences')`.
2.  **Condition**: If `localStorage` exists AND no cloud file exists.
3.  **Action**:
    - Read legacy JSON.
    - Map fields to new schema (see `user-preferences-file.md`).
    - Create new `story-preferences.str`.
    - Upload to cloud.
4.  **Cleanup**:
    - Rename `story:preferences` to `story:preferences:migrated` (keep as backup).
    - Notify user: "We've upgraded your settings storage. They are now synced to your account."

### 4.3 Mapping Table

| Legacy Key | New Schema Path | Notes |
|------------|-----------------|-------|
| `theme` | `theme` | Direct map |
| `grid_snap` | `gridSettings.snapToGrid` | |
| `recent_docs`| `recentFiles` | Validate paths |
