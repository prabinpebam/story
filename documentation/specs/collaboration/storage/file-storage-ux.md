# File Storage UX Specification

## Overview

This specification defines the complete user experience for opening, saving, and managing files in Story. It covers local and cloud file operations, file picker integration, encryption/access control, and visual indicators.

**Principles Compliance:**
- ✅ Small incremental changes - Each UI component is self-contained
- ✅ Stick to Design System - Uses existing Modal, Button, Input patterns
- ✅ Don't break existing features - Additive to current file menu
- ✅ Create multiple small files - UI components are separate modules

**Related Specifications:**
- [Cloud Storage Abstraction](./cloud-storage-abstraction.md) - Provider APIs
- [File Format Storage](./file-format-storage.md) - .str file format
- [App Menu](../../ui-system/toolbar/app-menu.md) - Menu integration
- [User Preferences File](../identity/user-preferences-file.md) - Encryption model

---

## Table of Contents

1. [Information Architecture](#1-information-architecture)
2. [File Indicator (Filename Pill)](#2-file-indicator-filename-pill)
3. [Open File Flow](#3-open-file-flow)
4. [Save File Flow](#4-save-file-flow)
5. [Cloud File Picker](#5-cloud-file-picker)
6. [Encryption & Access Control](#6-encryption--access-control)
7. [Guest vs Authenticated User](#7-guest-vs-authenticated-user)
8. [Sharing Files](#8-sharing-files)
9. [Error States & Recovery](#9-error-states--recovery)
10. [Component Specifications](#10-component-specifications)
11. [Implementation Priority](#11-implementation-priority)

---

## 1. Information Architecture

### 1.1 Updated App Menu Structure

The App Menu (File section) is updated to support both local and cloud operations:

```
STORY Menu
├── File
│   ├── New Presentation        ⌘N
│   ├── ──────────────────
│   ├── Open                    ▸
│   │   ├── Open Local File...           ⌘O
│   │   ├── Open from OneDrive...
│   │   └── Open from Google Drive...
│   ├── Open Recent             ▸
│   │   ├── [Recent files with source icons]
│   │   ├── ──────────────
│   │   └── Clear Recent
│   ├── ──────────────────
│   ├── Save                    ⌘S
│   ├── Save As                 ▸
│   │   ├── Save to Local...             ⌘⇧S
│   │   ├── Save to OneDrive...
│   │   └── Save to Google Drive...
│   ├── ──────────────────
│   ├── Make a Copy...
│   ├── ──────────────────
│   ├── Export                  ▸
│   │   ├── PDF...
│   │   ├── PNG Images...
│   │   └── HTML...
│   ├── ──────────────────
│   └── Close Presentation
```

### 1.2 Source Icons

Each storage location has a distinct icon:

| Source | Icon | Description |
|--------|------|-------------|
| Local | 💻 (Laptop icon) | File stored on device |
| OneDrive | OneDrive cloud logo | Microsoft OneDrive |
| Google Drive | Google Drive logo | Google Drive |
| Unsaved | ◯ (Empty circle) | New, never saved |

### 1.3 Entry Points

Users can access file operations from:

1. **App Menu** → File submenu
2. **Keyboard Shortcuts** → ⌘O (Open), ⌘S (Save), ⌘⇧S (Save As)
3. **File Indicator Pill** → Click to see file options
4. **Drag & Drop** → Drop .str file onto canvas
5. **Welcome Screen** → Recent files + Open button (future)

---

## 2. File Indicator (Filename Pill)

### 2.1 Purpose

A floating pill in the top-left corner of the viewport that shows:
- Current file name
- Storage source (icon)
- Save status
- Encryption/access status

### 2.2 Visual Design

```
┌─────────────────────────────────────────────────────────────────────────┐
│  VIEWPORT                                                                │
│                                                                          │
│  ┌──────────────────────────────────┐                                   │
│  │ [📁] My Presentation.str  ●  🔒 │                                   │
│  │ ↑      ↑                  ↑   ↑  │                                   │
│  │ Icon   Name              Dot Lock│                                   │
│  └──────────────────────────────────┘                                   │
│                                                                          │
│                        ┌────────────────────┐                           │
│                        │     CANVAS         │                           │
│                        │                    │                           │
│                        └────────────────────┘                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**States:**

| State | Icon | Name | Indicator | Lock |
|-------|------|------|-----------|------|
| New/Unsaved | ◯ | "Untitled" | ● (blue dot) | - |
| Local Unsaved | 💻 | "filename.str" | ● (blue dot) | - |
| Local Saved | 💻 | "filename.str" | - | - |
| Cloud Saving | ☁️ | "filename.str" | ⟳ (spinner) | 🔒 |
| Cloud Saved | [Provider] | "filename.str" | ✓ (brief) | 🔒 |
| Cloud Offline | [Provider] | "filename.str" | ⚠️ | 🔒 |
| Account Locked | [Provider] | "filename.str" | - | 🔐 |
| Public File | [Provider] | "filename.str" | - | 🌐 |

### 2.3 Pill Interactions

**Hover:** Shows tooltip with full path and last saved time.

**Click:** Opens a dropdown menu:

```
┌─────────────────────────────────────────┐
│ My Presentation.str                      │
│ ─────────────────────────────────────── │
│ 📍 OneDrive > Story > Presentations     │
│ 💾 Saved 2 minutes ago                  │
│ 🔐 Account locked (you@email.com)       │
│ ─────────────────────────────────────── │
│ Rename...                               │
│ Move to...                              │
│ Make a Copy...                          │
│ ─────────────────────────────────────── │
│ Share Settings...                       │
│ Version History                         │
└─────────────────────────────────────────┘
```

### 2.4 Specifications

```css
.file-indicator-pill {
    position: fixed;
    top: var(--spacing-3);      /* 12px from top */
    left: var(--spacing-3);     /* 12px from left */
    z-index: var(--z-floating);
    
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    
    padding: var(--spacing-1) var(--spacing-3);
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);  /* Pill shape */
    
    font-size: var(--font-size-sm);
    color: var(--color-text-primary);
    
    cursor: pointer;
    transition: var(--transition-fast);
}

.file-indicator-pill:hover {
    background: var(--color-bg-hover);
    border-color: var(--color-border-strong);
}

.file-indicator-pill .source-icon {
    width: 16px;
    height: 16px;
}

.file-indicator-pill .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-accent);
}

.file-indicator-pill .lock-icon {
    width: 12px;
    height: 12px;
    color: var(--color-text-tertiary);
}
```

---

## 3. Open File Flow

### 3.1 Open Local File

Standard browser file picker:

```
User clicks "Open Local File..."
        ↓
Native file picker appears (showOpenFilePicker)
        ↓
User selects .str file
        ↓
Load and parse file
        ↓
Update file indicator with local icon
        ↓
Add to recent files list
```

### 3.2 Open from Cloud

Cloud file picker modal:

```
User clicks "Open from OneDrive/Google Drive..."
        ↓
If not signed in → Show sign-in prompt
        ↓
Cloud File Picker modal opens
        ↓
User navigates and selects file
        ↓
Download file to memory
        ↓
Check encryption/access
        ↓
If access granted → Load presentation
If access denied → Show access denied message
        ↓
Update file indicator with cloud icon + lock status
        ↓
Add to recent files list
```

### 3.3 Open from Recent Files

```
User hovers "Open Recent" submenu
        ↓
Show recent files with:
  - Thumbnail preview
  - File name
  - Source icon (local/OneDrive/Google)
  - Last opened time
        ↓
User clicks file
        ↓
If local file exists → Open directly
If cloud file → Download and open
If file missing → Show "File not found" message
```

### 3.4 Access Control on Open

When opening an encrypted file:

```
┌─────────────────────────────────────────────────────────────────┐
│  🔒  This file is account-locked                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  This presentation can only be opened by authorized accounts.   │
│                                                                 │
│  File owner: alice@gmail.com                                    │
│                                                                 │
│  You are signed in as: bob@gmail.com                           │
│                                                                 │
│  [ Request Access ]                    [ Cancel ]              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Save File Flow

### 4.1 Save (⌘S)

```
User presses ⌘S
        ↓
If never saved before:
    → Show Save As submenu (choose local or cloud)
        ↓
If saved to local:
    → Overwrite local file
    → Show "Saved" indicator briefly
        ↓
If saved to cloud:
    → Upload to cloud (show progress in pill)
    → Apply encryption if logged in
    → Show "Saved" indicator briefly
        ↓
If offline + cloud file:
    → Queue for sync
    → Show offline indicator
```

### 4.2 Save As Flow

```
User clicks "Save to OneDrive/Google Drive..."
        ↓
If not signed in → Prompt sign-in first
        ↓
Cloud Save Modal opens:
  - Folder browser
  - File name input
  - Encryption options (if signed in)
        ↓
User navigates to folder, enters name
        ↓
User chooses access level:
  [ ] Account-locked (only you)    ← Default for signed-in users
  [ ] Public (anyone with link)
        ↓
Click Save
        ↓
Upload with encryption
        ↓
Update file indicator
        ↓
Add to recent files
```

### 4.3 Encryption Decision Matrix

| User State | Default Access | Can Change To |
|------------|----------------|---------------|
| Guest (not signed in) | Public | - |
| Signed in, saving | Account-locked | Public |
| Signed in, existing file | Keep current | Account-locked / Public |

---

## 5. Cloud File Picker

### 5.1 Overview

Both OneDrive and Google Drive provide their own file picker UI components that can be embedded in our app:

- **OneDrive File Picker**: Microsoft Graph file picker SDK
- **Google Picker API**: Google Drive picker component

### 5.2 Unified Wrapper

We wrap both pickers in a consistent Story-styled modal:

```
┌─────────────────────────────────────────────────────────────────┐
│  Open from OneDrive                                    [ × ]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │   [OneDrive File Picker Component - provider SDK]         │ │
│  │                                                            │ │
│  │   Shows: Folders, .str files, navigation                 │ │
│  │                                                            │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Selected: My Presentation.str                                  │
│                                                                 │
│                              [ Cancel ]        [ Open ]        │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Provider SDK Integration

**OneDrive File Picker:**
```javascript
// Using @microsoft/file-browser package
import { GraphFileBrowser } from '@microsoft/file-browser';

// Configuration
const pickerOptions = {
    sdk: '8.0',
    entry: {
        oneDrive: {
            files: {},
        }
    },
    authentication: {},
    messaging: {
        origin: window.location.origin,
        channelId: 'story-picker'
    },
    typesAndSources: {
        filters: ['.str'],
        options: 'files'
    }
};
```

**Google Picker:**
```javascript
// Using Google Picker API
const picker = new google.picker.PickerBuilder()
    .addView(google.picker.ViewId.DOCS)
    .setOAuthToken(oauthToken)
    .setDeveloperKey(API_KEY)
    .setCallback(pickerCallback)
    .build();
```

### 5.4 Custom File Browser (Fallback)

If provider SDKs are not suitable, implement a custom file browser:

```
┌─────────────────────────────────────────────────────────────────┐
│  Open from OneDrive                                    [ × ]    │
├─────────────────────────────────────────────────────────────────┤
│  ◄ Back   📁 Story > Presentations                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📁  2024 Projects                              Modified today  │
│  📁  Archive                                    Nov 15, 2025    │
│  📄  Q4 Review.str                    🔒        Nov 28, 2025    │
│  📄  Marketing Deck.str               🌐        Nov 20, 2025    │
│  📄  Product Launch.str               🔒        Nov 18, 2025    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Selected: Q4 Review.str                                        │
│                              [ Cancel ]        [ Open ]        │
└─────────────────────────────────────────────────────────────────┘
```

**List Item Indicators:**
- 📁 Folder
- 📄 .str file
- 🔒 Account-locked file
- 🌐 Public file

---

## 6. Encryption & Access Control

### 6.1 Encryption Model

Files created while signed in are **encrypted by default** using the user's OAuth identity:

```
┌─────────────────────────────────────────────────────────────────┐
│                    FILE ENCRYPTION MODEL                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ACCOUNT-LOCKED FILE:                                           │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  presentation.str                                          │ │
│  │  ├── manifest.json                                        │ │
│  │  │   └── encryption: { locked: true, owner: "email" }    │ │
│  │  ├── access/                                              │ │
│  │  │   └── allowed.json  ← List of authorized emails       │ │
│  │  ├── document/                                            │ │
│  │  │   └── *.json.enc   ← Encrypted content                │ │
│  │  └── assets/                                              │ │
│  │      └── *.enc        ← Encrypted assets                 │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  PUBLIC FILE:                                                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  presentation.str                                          │ │
│  │  ├── manifest.json                                        │ │
│  │  │   └── encryption: { locked: false }                   │ │
│  │  ├── document/                                            │ │
│  │  │   └── *.json       ← Unencrypted content              │ │
│  │  └── assets/                                              │ │
│  │      └── *.*          ← Unencrypted assets               │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Access List (Stored in File)

The `access/allowed.json` inside the .str file contains:

```json
{
    "owner": {
        "email": "alice@gmail.com",
        "provider": "google",
        "addedAt": "2025-01-15T10:30:00Z"
    },
    "allowedEmails": [
        {
            "email": "bob@company.com",
            "role": "editor",
            "addedAt": "2025-01-20T14:00:00Z",
            "addedBy": "alice@gmail.com"
        },
        {
            "email": "carol@example.com",
            "role": "viewer",
            "addedAt": "2025-01-22T09:00:00Z",
            "addedBy": "alice@gmail.com"
        }
    ],
    "publicAccess": false
}
```

### 6.3 Lock Indicator in UI

The filename pill shows access status:

| Icon | Meaning | Tooltip |
|------|---------|---------|
| 🔐 | Account-locked (you own) | "Only you can access this file" |
| 🔒 | Account-locked (shared) | "Shared with 3 people" |
| 🌐 | Public | "Anyone with link can access" |
| (none) | Local file | - |

---

## 7. Guest vs Authenticated User

### 7.1 Guest User (Not Signed In)

| Action | Behavior |
|--------|----------|
| Open local file | ✅ Works normally |
| Open cloud file | ❌ Prompt to sign in first |
| Save local file | ✅ Works normally |
| Save to cloud | ❌ Prompt to sign in first |
| New file | Public by default (no encryption) |

**Guest Mode Indicator:**
```
┌──────────────────────────────────────────┐
│ [◯] Untitled.str                         │
│     ↑                                    │
│  Empty circle = not saved                │
└──────────────────────────────────────────┘
```

### 7.2 Authenticated User

| Action | Behavior |
|--------|----------|
| Open local file | ✅ Works normally |
| Open cloud file | ✅ Works with access check |
| Save local file | ✅ Works normally |
| Save to cloud | ✅ Works with encryption |
| New file | Account-locked by default |

**Authenticated Indicator:**
```
┌────────────────────────────────────────────┐
│ [OneDrive] My Deck.str  ✓  🔐              │
│  ↑                       ↑   ↑              │
│  Provider icon         Saved Locked        │
└────────────────────────────────────────────┘
```

### 7.3 Sign-In Prompt

When a guest tries to access cloud features:

```
┌─────────────────────────────────────────────────────────────────┐
│  Sign in to access cloud storage                       [ × ]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Sign in to save and open files from your cloud storage.       │
│                                                                 │
│  Your files will be encrypted by default for privacy.          │
│                                                                 │
│  ┌─────────────────────────┐  ┌─────────────────────────┐     │
│  │                         │  │                          │     │
│  │  [Microsoft Logo]       │  │  [Google Logo]           │     │
│  │  Sign in with Microsoft │  │  Sign in with Google     │     │
│  │                         │  │                          │     │
│  └─────────────────────────┘  └─────────────────────────┘     │
│                                                                 │
│                              [ Continue as Guest ]             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Sharing Files

### 8.1 Share Settings Modal

Accessed from file pill menu or App Menu:

```
┌─────────────────────────────────────────────────────────────────┐
│  Share "My Presentation.str"                           [ × ]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Access Level                                                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  ○ Account-locked (only invited people)                   │ │
│  │  ○ Anyone with link can view                              │ │
│  │  ○ Anyone with link can edit                              │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Invite people                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Enter email addresses...                          [Invite]│ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  People with access                                             │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  👤 alice@gmail.com               Owner        (you)      │ │
│  │  👤 bob@company.com               Editor       [Remove]   │ │
│  │  👤 carol@example.com             Viewer       [Remove]   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│                                            [ Done ]            │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Changing Access Level

When changing from account-locked to public:

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️  Make file public?                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  This will remove encryption and allow anyone with the link    │
│  to access this file.                                           │
│                                                                 │
│  This action cannot be undone without re-encrypting the file.  │
│                                                                 │
│                    [ Cancel ]        [ Make Public ]           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Error States & Recovery

### 9.1 Network Errors

```
┌──────────────────────────────────────────────────────────────┐
│ [OneDrive] My Deck.str  ⚠️                                   │
└──────────────────────────────────────────────────────────────┘
                ↓ (on click)
┌──────────────────────────────────────────────────────────────┐
│  ⚠️  Unable to sync                                          │
│                                                              │
│  Your changes are saved locally and will sync when online.  │
│                                                              │
│  Last synced: 5 minutes ago                                  │
│                                                              │
│                            [ Retry Now ]    [ Work Offline ] │
└──────────────────────────────────────────────────────────────┘
```

### 9.2 Access Revoked

```
┌─────────────────────────────────────────────────────────────────┐
│  🚫  Access Revoked                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  You no longer have access to this file.                        │
│                                                                 │
│  The owner may have changed the sharing settings.              │
│                                                                 │
│                    [ Request Access ]        [ Close ]         │
└─────────────────────────────────────────────────────────────────┘
```

### 9.3 File Not Found

```
┌─────────────────────────────────────────────────────────────────┐
│  📄❌  File Not Found                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  "My Presentation.str" could not be found.                      │
│                                                                 │
│  It may have been moved, renamed, or deleted.                  │
│                                                                 │
│                    [ Remove from Recent ]    [ OK ]            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Component Specifications

### 10.1 New UI Components

| Component | File Path | Purpose |
|-----------|-----------|---------|
| FileIndicatorPill | `src/ui/file/FileIndicatorPill.js` | Filename + status display |
| FileIndicatorMenu | `src/ui/file/FileIndicatorMenu.js` | Dropdown from pill |
| CloudFilePicker | `src/ui/file/CloudFilePicker.js` | Unified cloud browser |
| SaveToCloudModal | `src/ui/file/SaveToCloudModal.js` | Cloud save dialog |
| ShareSettingsModal | `src/ui/file/ShareSettingsModal.js` | Access control UI |
| AccessDeniedDialog | `src/ui/file/AccessDeniedDialog.js` | Permission error |
| SignInPrompt | `src/ui/file/SignInPrompt.js` | Auth prompt |

### 10.2 Updated Components

| Component | Changes |
|-----------|---------|
| `AppMenu.js` | Add cloud submenus to Open/Save As |
| `HUD.js` | Position file indicator pill |
| `RecentFiles.js` | Add source icons, handle cloud files |

### 10.3 New Services

| Service | File Path | Purpose |
|---------|-----------|---------|
| FileStorageService | `src/core/storage/FileStorageService.js` | Unified open/save API |
| FileEncryptionService | `src/core/storage/FileEncryptionService.js` | Encrypt/decrypt files |
| CloudPickerService | `src/core/storage/CloudPickerService.js` | Provider picker adapters |

### 10.4 CSS Modules

| File | Contents |
|------|----------|
| `styles/modules/file-indicator.css` | Pill styles |
| `styles/modules/cloud-picker.css` | Cloud browser styles |
| `styles/modules/share-settings.css` | Share modal styles |

---

## 11. Implementation Priority

### Phase 1: Core File Operations (Week 1)

1. **FileIndicatorPill** - Basic filename display
2. **Update AppMenu** - Add Open/Save submenus
3. **Local open/save** - Already exists, verify working
4. **Basic cloud open** - Using provider APIs

### Phase 2: Cloud Integration (Week 2)

1. **CloudFilePicker** - OneDrive picker integration
2. **CloudFilePicker** - Google Drive picker integration
3. **SaveToCloudModal** - Save with folder selection
4. **Recent files update** - Add cloud file tracking

### Phase 3: Encryption & Access (Week 3)

1. **FileEncryptionService** - Encrypt on save for signed-in users
2. **Access control on open** - Check access/allowed.json
3. **Lock indicator in pill** - Show 🔐/🔒/🌐
4. **ShareSettingsModal** - Manage access list

### Phase 4: Polish & Edge Cases (Week 4)

1. **Error states** - Network, access, not found
2. **Offline mode** - Queue and sync
3. **Guest mode** - Public-only workflow
4. **Keyboard shortcuts** - ⌘O, ⌘S working with cloud

---

## Design System Checklist

Before implementation, verify:

- [ ] All colors use `--color-*` CSS variables
- [ ] All spacing uses `--spacing-*` tokens
- [ ] All radii use `--radius-*` tokens
- [ ] Dark mode tested
- [ ] Light mode tested
- [ ] Reuses existing Modal component
- [ ] Reuses existing Button component
- [ ] Reuses existing Input component
- [ ] Keyboard navigation works
- [ ] Focus states visible

---

## Related Documents

- [Cloud Storage Abstraction](./cloud-storage-abstraction.md) - Provider API details
- [File Format Storage](./file-format-storage.md) - .str file structure
- [User Preferences File](../identity/user-preferences-file.md) - Encryption details
- [App Menu](../../ui-system/toolbar/app-menu.md) - Menu integration

---

*This specification enables Story to work seamlessly with local and cloud files while maintaining security through identity-based encryption.*
