# User Preferences: File Linking

## Overview
This specification describes how presentation files (`.str`) link to the User Preferences file, enabling automatic discovery and loading of personalized settings when opening a document.

## 1. The Link Mechanism

### 1.1 Metadata in Presentation File
Every `presentation.str` file contains a reference to the creator's (or last editor's) preference file ID. This is strictly a *hint* for discovery.

**File Path**: `presentation.str/metadata/context.json`

```json
{
  "lastModifiedBy": {
    "userId": "google_123456",
    "preferencesFileId": "pref_xyz789",
    "preferencesProvider": "onedrive" 
  }
}
```

### 1.2 Why Link?
- **Scenario**: User opens `ProjectA.str` on a new computer.
- **Goal**: The app sees `preferencesFileId`, checks if the user can access it, and automatically sets up the environment (Theme, Shortcuts) without the user needing to manually find their preferences file.

## 2. Auto-Fetch Flow

1.  **Open File**: User opens `presentation.str`.
2.  **Read Metadata**: App reads `context.json`.
3.  **Check Identity**:
    - App checks current signed-in user.
    - Does `current_user.id` match `lastModifiedBy.userId`?
4.  **Fetch Attempt**:
    - If match: App attempts to find `pref_xyz789` in the user's default storage location.
    - Note: We cannot rely on absolute paths as they change across devices. We rely on the *File ID* or standard naming convention.
5.  **Validation**:
    - If found, decrypt and apply.

## 3. Privacy & Security

- **No Leaking**: The presentation file does NOT contain the preferences data. It only contains a pointer (ID).
- **Access Control**: Even if someone else opens the file and sees the ID, they cannot access the preferences file because it is encrypted with the owner's identity key and stored in the owner's private cloud storage.

## 4. Fallback Behavior

If the link is broken (file moved, deleted, or user is offline):

1.  **Silent Fail**: Do not interrupt the user with an error modal.
2.  **Use Defaults**: Load application default settings.
3.  **Indicator**: Show a small "Using default settings" indicator in the status bar.
4.  **Opportunity**: When the user saves the presentation, update the link to point to their *current* valid preferences file (if one exists).
