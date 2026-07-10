# File Indicator & Cloud Picker UI Components

## Overview

This specification defines the UI components for file management in Story, including the file indicator pill, cloud file picker, and related dialogs.

**Principles Compliance:**
- ✅ Uses existing design tokens - No magic numbers
- ✅ Component reuse - Extends Modal, Button, Input patterns
- ✅ Dark/Light mode support - All components theme-aware
- ✅ Multiple small files - Each component is a separate module

**Related Specifications:**
- [File Storage UX](./file-storage-ux.md) - Overall UX flows
- [UI Design System](../../ui-system/ui-design-system.md) - Design tokens
- [App Menu](../../ui-system/toolbar/app-menu.md) - Menu integration

---

## Table of Contents

1. [File Indicator Pill](#1-file-indicator-pill)
2. [File Indicator Menu](#2-file-indicator-menu)
3. [Cloud File Picker Modal](#3-cloud-file-picker-modal)
4. [Save to Cloud Modal](#4-save-to-cloud-modal)
5. [Access Settings Modal](#5-access-settings-modal)
6. [Sign-In Prompt](#6-sign-in-prompt)
7. [Error Dialogs](#7-error-dialogs)
8. [Provider Icons](#8-provider-icons)

---

## 1. File Indicator Pill

### 1.1 Component Structure

```
FileIndicatorPill
├── SourceIcon          (provider logo or placeholder)
├── FileName            (truncated if needed)
├── StatusIndicator     (save status dot/spinner)
└── LockIcon           (access level indicator)
```

### 1.2 Visual States

```
┌─────────────────────────────────────────────────────────────────┐
│  STATE: New Unsaved                                             │
│  ┌────────────────────────────────┐                            │
│  │  ○  Untitled                ●  │                            │
│  └────────────────────────────────┘                            │
│  • Empty circle icon                                            │
│  • Name: "Untitled"                                             │
│  • Blue dot: unsaved changes                                   │
│  • No lock icon                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  STATE: Local File Saved                                        │
│  ┌────────────────────────────────┐                            │
│  │  💻  My Deck.str               │                            │
│  └────────────────────────────────┘                            │
│  • Laptop icon                                                  │
│  • Actual filename                                              │
│  • No status indicator (all saved)                              │
│  • No lock icon (local files aren't encrypted)                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  STATE: Cloud File Saved (Account-Locked)                       │
│  ┌──────────────────────────────────────┐                      │
│  │  [OneDrive]  My Deck.str       🔐   │                      │
│  └──────────────────────────────────────┘                      │
│  • OneDrive logo icon                                           │
│  • Actual filename                                              │
│  • Lock with keyhole: account-locked                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  STATE: Cloud File (Public)                                     │
│  ┌──────────────────────────────────────┐                      │
│  │  [Google]  Public Deck.str      🌐   │                      │
│  └──────────────────────────────────────┘                      │
│  • Google Drive logo icon                                       │
│  • Actual filename                                              │
│  • Globe icon: public access                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  STATE: Saving to Cloud                                         │
│  ┌──────────────────────────────────────┐                      │
│  │  [OneDrive]  My Deck.str    ⟳  🔐   │                      │
│  └──────────────────────────────────────┘                      │
│  • Spinner animation: saving in progress                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  STATE: Offline (Queued)                                        │
│  ┌──────────────────────────────────────┐                      │
│  │  [OneDrive]  My Deck.str    ⚠️  🔐   │                      │
│  └──────────────────────────────────────┘                      │
│  • Warning icon: offline, changes queued                       │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 CSS Specification

```css
/* File Indicator Pill */
.file-indicator {
    position: fixed;
    top: var(--spacing-3);
    left: var(--spacing-3);
    z-index: var(--z-floating);
    
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    
    height: var(--input-height-sm);           /* 28px */
    padding: 0 var(--spacing-3);
    
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);        /* Pill shape */
    
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
    
    cursor: pointer;
    user-select: none;
    transition: all var(--transition-fast);
}

.file-indicator:hover {
    background: var(--color-bg-hover);
    border-color: var(--color-border-strong);
}

.file-indicator:active,
.file-indicator[aria-expanded="true"] {
    background: var(--color-bg-active);
}

/* Source Icon */
.file-indicator__source-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
}

.file-indicator__source-icon--placeholder {
    width: 12px;
    height: 12px;
    border: 1.5px solid var(--color-text-tertiary);
    border-radius: 50%;
}

/* File Name */
.file-indicator__name {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* Status Indicator */
.file-indicator__status {
    flex-shrink: 0;
}

.file-indicator__status--dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-accent);
}

.file-indicator__status--spinner {
    width: 12px;
    height: 12px;
    border: 1.5px solid var(--color-text-tertiary);
    border-top-color: var(--color-accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

.file-indicator__status--warning {
    color: var(--color-warning);
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

/* Lock Icon */
.file-indicator__lock {
    width: 12px;
    height: 12px;
    flex-shrink: 0;
    color: var(--color-text-tertiary);
}

.file-indicator__lock--owned {
    color: var(--color-text-secondary);
}
```

### 1.4 Component API

```typescript
interface FileIndicatorPillProps {
    /** Current file state */
    file: {
        name: string;
        source: 'local' | 'onedrive' | 'google-drive' | 'unsaved';
        path?: string;
        lastSaved?: Date;
    };
    
    /** Save status */
    status: 'saved' | 'unsaved' | 'saving' | 'error' | 'offline';
    
    /** Access level for cloud files */
    accessLevel?: 'account-locked' | 'public' | 'shared';
    
    /** Number of people file is shared with (for shared files) */
    sharedCount?: number;
    
    /** Click handler - opens menu */
    onClick: () => void;
    
    /** Whether menu is open */
    isMenuOpen: boolean;
}
```

---

## 2. File Indicator Menu

### 2.1 Menu Structure

```
┌─────────────────────────────────────────────┐
│  My Presentation.str                         │  ← File name (header)
│  ─────────────────────────────────────────  │
│  📍 OneDrive > Story > Presentations        │  ← Path breadcrumb
│  💾 Saved 2 minutes ago                     │  ← Last saved
│  🔐 Account locked (you@email.com)          │  ← Access info
│  ─────────────────────────────────────────  │
│  Rename...                                  │
│  Move to...                                 │
│  Make a Copy...                             │
│  ─────────────────────────────────────────  │
│  Share Settings...                          │
│  Version History                            │
└─────────────────────────────────────────────┘
```

### 2.2 CSS Specification

```css
/* File Indicator Menu */
.file-indicator-menu {
    position: absolute;
    top: calc(100% + var(--spacing-1));
    left: 0;
    z-index: var(--z-dropdown);
    
    min-width: 280px;
    padding: var(--spacing-1) 0;
    
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
}

/* Header */
.file-indicator-menu__header {
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
}

/* Info Row */
.file-indicator-menu__info {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-1) var(--spacing-3);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
}

.file-indicator-menu__info-icon {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
}

/* Divider */
.file-indicator-menu__divider {
    height: 1px;
    margin: var(--spacing-1) 0;
    background: var(--color-border-subtle);
}

/* Menu Item */
.file-indicator-menu__item {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    width: 100%;
    padding: var(--spacing-2) var(--spacing-3);
    
    font-size: var(--font-size-md);
    color: var(--color-text-primary);
    text-align: left;
    
    background: none;
    border: none;
    cursor: pointer;
    transition: background var(--transition-fast);
}

.file-indicator-menu__item:hover {
    background: var(--color-bg-hover);
}

.file-indicator-menu__item:disabled {
    color: var(--color-text-disabled);
    cursor: not-allowed;
}
```

---

## 3. Cloud File Picker Modal

### 3.1 Visual Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Open from OneDrive                                    [×]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  ◄ Back    📁 My Files > Story > Presentations            │ │  ← Breadcrumb
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  📁  2024 Projects                     Modified: Today    │ │
│  │  📁  Archive                           Modified: Nov 15   │ │
│  │  ──────────────────────────────────────────────────────── │ │
│  │  📄  Q4 Review.str            🔐       Modified: Nov 28   │ │
│  │  📄  Marketing Deck.str       🌐       Modified: Nov 20   │ │
│  │  📄  Product Launch.str       🔐       Modified: Nov 18   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Selected: Q4 Review.str                                        │
│                                                                 │
│                                   [Cancel]     [Open]          │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 CSS Specification

```css
/* Cloud File Picker */
.cloud-picker-modal {
    width: 600px;
    max-height: 80vh;
}

.cloud-picker-modal__content {
    display: flex;
    flex-direction: column;
    height: 400px;
}

/* Breadcrumb Navigation */
.cloud-picker__breadcrumb {
    display: flex;
    align-items: center;
    gap: var(--spacing-1);
    padding: var(--spacing-2) var(--spacing-3);
    background: var(--color-bg-tertiary);
    border-bottom: 1px solid var(--color-border);
}

.cloud-picker__breadcrumb-back {
    display: flex;
    align-items: center;
    gap: var(--spacing-1);
    padding: var(--spacing-1) var(--spacing-2);
    
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    
    background: none;
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
}

.cloud-picker__breadcrumb-back:hover {
    background: var(--color-bg-hover);
    color: var(--color-text-primary);
}

.cloud-picker__breadcrumb-path {
    display: flex;
    align-items: center;
    gap: var(--spacing-1);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
}

.cloud-picker__breadcrumb-segment {
    color: var(--color-text-primary);
    cursor: pointer;
}

.cloud-picker__breadcrumb-segment:hover {
    color: var(--color-accent);
}

/* File List */
.cloud-picker__list {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-1) 0;
}

.cloud-picker__item {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    width: 100%;
    padding: var(--spacing-2) var(--spacing-3);
    
    background: none;
    border: none;
    cursor: pointer;
    transition: background var(--transition-fast);
}

.cloud-picker__item:hover {
    background: var(--color-bg-hover);
}

.cloud-picker__item--selected {
    background: var(--color-accent-subtle);
}

.cloud-picker__item--folder {
    /* Folders can be navigated into */
}

.cloud-picker__item-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
}

.cloud-picker__item-name {
    flex: 1;
    text-align: left;
    font-size: var(--font-size-md);
    color: var(--color-text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.cloud-picker__item-lock {
    width: 14px;
    height: 14px;
    color: var(--color-text-tertiary);
}

.cloud-picker__item-date {
    font-size: var(--font-size-sm);
    color: var(--color-text-tertiary);
    white-space: nowrap;
}

/* Selection Footer */
.cloud-picker__selection {
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    border-top: 1px solid var(--color-border);
}

/* Loading State */
.cloud-picker__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: var(--spacing-3);
    color: var(--color-text-secondary);
}

/* Empty State */
.cloud-picker__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: var(--spacing-2);
    color: var(--color-text-tertiary);
}
```

### 3.3 Component API

```typescript
interface CloudFilePickerProps {
    /** Which cloud provider */
    provider: 'onedrive' | 'google-drive';
    
    /** File type filter */
    fileTypes?: string[];    // Default: ['.str']
    
    /** Mode: open or save */
    mode: 'open' | 'save';
    
    /** Suggested file name (for save mode) */
    suggestedName?: string;
    
    /** Called when user selects a file */
    onSelect: (file: CloudFile) => void;
    
    /** Called when user cancels */
    onCancel: () => void;
}

interface CloudFile {
    id: string;
    name: string;
    path: string;
    provider: 'onedrive' | 'google-drive';
    modifiedAt: Date;
    size: number;
    accessLevel: 'account-locked' | 'public' | 'shared';
}
```

---

## 4. Save to Cloud Modal

### 4.1 Visual Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Save to OneDrive                                      [×]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  File name                                                      │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  My Presentation                                      .str │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Save to                                                        │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  📁 Story > Presentations                      [Browse...] │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Access                                                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  ● Account-locked (only you)                              │ │
│  │    Only you can access this file with your account        │ │
│  │                                                            │ │
│  │  ○ Public (anyone with link)                              │ │
│  │    Anyone with the link can view this file                │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│                                   [Cancel]     [Save]          │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 CSS Specification

```css
/* Save to Cloud Modal */
.save-cloud-modal {
    width: 480px;
}

.save-cloud-modal__field {
    margin-bottom: var(--spacing-4);
}

.save-cloud-modal__label {
    display: block;
    margin-bottom: var(--spacing-1);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);
}

/* Filename Input with Extension */
.save-cloud-modal__filename {
    display: flex;
    align-items: center;
}

.save-cloud-modal__filename-input {
    flex: 1;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
}

.save-cloud-modal__filename-ext {
    display: flex;
    align-items: center;
    height: var(--input-height-md);
    padding: 0 var(--spacing-3);
    
    font-size: var(--font-size-md);
    color: var(--color-text-tertiary);
    
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
    border-left: none;
    border-radius: 0 var(--radius-md) var(--radius-md) 0;
}

/* Location Picker */
.save-cloud-modal__location {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
}

.save-cloud-modal__location-path {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    height: var(--input-height-md);
    padding: 0 var(--spacing-3);
    
    font-size: var(--font-size-md);
    color: var(--color-text-primary);
    
    background: var(--color-bg-input);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
}

.save-cloud-modal__location-icon {
    width: 16px;
    height: 16px;
    color: var(--color-text-tertiary);
}

/* Access Options */
.save-cloud-modal__access {
    padding: var(--spacing-3);
    background: var(--color-bg-secondary);
    border-radius: var(--radius-md);
}

.save-cloud-modal__access-option {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-2);
    padding: var(--spacing-2);
    border-radius: var(--radius-sm);
    cursor: pointer;
}

.save-cloud-modal__access-option:hover {
    background: var(--color-bg-hover);
}

.save-cloud-modal__access-option + .save-cloud-modal__access-option {
    margin-top: var(--spacing-2);
}

.save-cloud-modal__access-radio {
    margin-top: 2px;
    accent-color: var(--color-accent);
}

.save-cloud-modal__access-label {
    flex: 1;
}

.save-cloud-modal__access-title {
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
}

.save-cloud-modal__access-desc {
    margin-top: 2px;
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
}
```

---

## 5. Access Settings Modal

### 5.1 Visual Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Share "My Presentation.str"                           [×]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Access level                                                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  ● Only invited people can access                         │ │
│  │  ○ Anyone with link can view                              │ │
│  │  ○ Anyone with link can edit                              │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Invite people                                                  │
│  ┌─────────────────────────────────────────────────┐ [Invite] │
│  │  Enter email addresses...                        │          │
│  └─────────────────────────────────────────────────┘          │
│                                                                 │
│  People with access                                             │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  👤 Alice Smith (alice@gmail.com)                         │ │
│  │     Owner                                              you │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │  👤 Bob Jones (bob@company.com)                           │ │
│  │     Can edit                                      [Remove] │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │  👤 Carol White (carol@example.com)                       │ │
│  │     Can view                                      [Remove] │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│                                              [Done]            │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 CSS Specification

```css
/* Access Settings Modal */
.access-settings-modal {
    width: 520px;
}

/* Access Level Section */
.access-settings__level {
    margin-bottom: var(--spacing-4);
}

.access-settings__level-options {
    padding: var(--spacing-3);
    background: var(--color-bg-secondary);
    border-radius: var(--radius-md);
}

.access-settings__level-option {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-2);
    font-size: var(--font-size-md);
    color: var(--color-text-primary);
    cursor: pointer;
    border-radius: var(--radius-sm);
}

.access-settings__level-option:hover {
    background: var(--color-bg-hover);
}

/* Invite Section */
.access-settings__invite {
    display: flex;
    gap: var(--spacing-2);
    margin-bottom: var(--spacing-4);
}

.access-settings__invite-input {
    flex: 1;
}

/* People List */
.access-settings__people {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: hidden;
}

.access-settings__person {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    padding: var(--spacing-3);
}

.access-settings__person + .access-settings__person {
    border-top: 1px solid var(--color-border-subtle);
}

.access-settings__person-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--color-bg-tertiary);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
}

.access-settings__person-info {
    flex: 1;
}

.access-settings__person-name {
    font-size: var(--font-size-md);
    color: var(--color-text-primary);
}

.access-settings__person-role {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
}

.access-settings__person-you {
    font-size: var(--font-size-xs);
    color: var(--color-text-tertiary);
    padding: var(--spacing-1) var(--spacing-2);
    background: var(--color-bg-secondary);
    border-radius: var(--radius-sm);
}

.access-settings__person-remove {
    padding: var(--spacing-1) var(--spacing-2);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    background: none;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    cursor: pointer;
}

.access-settings__person-remove:hover {
    color: var(--color-error);
    border-color: var(--color-error);
}
```

---

## 6. Sign-In Prompt

### 6.1 Visual Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Sign in to access cloud storage                       [×]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                    ☁️                                           │
│                                                                 │
│  Sign in to save and open files from your cloud storage.       │
│                                                                 │
│  Your files will be encrypted by default for privacy.          │
│                                                                 │
│  ┌───────────────────────┐    ┌───────────────────────┐       │
│  │                       │    │                        │       │
│  │   [Microsoft Logo]    │    │   [Google Logo]        │       │
│  │                       │    │                        │       │
│  │   Sign in with        │    │   Sign in with         │       │
│  │   Microsoft           │    │   Google               │       │
│  │                       │    │                        │       │
│  └───────────────────────┘    └───────────────────────┘       │
│                                                                 │
│                      [Continue as Guest]                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 CSS Specification

```css
/* Sign-In Prompt */
.signin-prompt {
    width: 440px;
    text-align: center;
}

.signin-prompt__icon {
    font-size: 48px;
    margin-bottom: var(--spacing-4);
}

.signin-prompt__title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-2);
}

.signin-prompt__description {
    font-size: var(--font-size-md);
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-6);
}

/* Provider Buttons */
.signin-prompt__providers {
    display: flex;
    gap: var(--spacing-4);
    justify-content: center;
    margin-bottom: var(--spacing-4);
}

.signin-prompt__provider {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-3);
    
    width: 160px;
    padding: var(--spacing-4);
    
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    
    cursor: pointer;
    transition: all var(--transition-fast);
}

.signin-prompt__provider:hover {
    background: var(--color-bg-hover);
    border-color: var(--color-border-strong);
}

.signin-prompt__provider-icon {
    width: 32px;
    height: 32px;
}

.signin-prompt__provider-name {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
}

/* Guest Link */
.signin-prompt__guest {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    background: none;
    border: none;
    cursor: pointer;
    text-decoration: underline;
}

.signin-prompt__guest:hover {
    color: var(--color-text-primary);
}
```

---

## 7. Error Dialogs

### 7.1 Access Denied

```css
.access-denied-dialog {
    width: 400px;
    text-align: center;
}

.access-denied-dialog__icon {
    font-size: 48px;
    color: var(--color-warning);
    margin-bottom: var(--spacing-3);
}

.access-denied-dialog__title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--spacing-2);
}

.access-denied-dialog__message {
    font-size: var(--font-size-md);
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-4);
}

.access-denied-dialog__owner {
    padding: var(--spacing-3);
    background: var(--color-bg-secondary);
    border-radius: var(--radius-md);
    margin-bottom: var(--spacing-4);
}

.access-denied-dialog__owner-label {
    font-size: var(--font-size-sm);
    color: var(--color-text-tertiary);
    margin-bottom: var(--spacing-1);
}

.access-denied-dialog__owner-email {
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-medium);
}
```

---

## 8. Provider Icons

### 8.1 Icon Specifications

| Provider | Icon Asset | Size | Fallback |
|----------|------------|------|----------|
| OneDrive | `assets/icons/onedrive.svg` | 16x16, 24x24, 32x32 | Cloud icon |
| Google Drive | `assets/icons/google-drive.svg` | 16x16, 24x24, 32x32 | Cloud icon |
| Local | `assets/icons/laptop.svg` | 16x16, 24x24 | Laptop icon |
| Unsaved | (CSS shape) | 12x12 | Empty circle |

### 8.2 Icon Usage

```css
/* Provider Icon Component */
.provider-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
}

.provider-icon--sm { width: 12px; height: 12px; }
.provider-icon--md { width: 16px; height: 16px; }
.provider-icon--lg { width: 24px; height: 24px; }
.provider-icon--xl { width: 32px; height: 32px; }

.provider-icon img,
.provider-icon svg {
    width: 100%;
    height: 100%;
    object-fit: contain;
}
```

---

## Implementation Files

### Component Files

```
src/ui/file/
├── FileIndicatorPill.js      # Filename pill component
├── FileIndicatorMenu.js      # Dropdown menu from pill
├── CloudFilePicker.js        # Cloud file browser modal
├── SaveToCloudModal.js       # Save to cloud dialog
├── AccessSettingsModal.js    # Share/access control modal
├── SignInPrompt.js           # Auth prompt dialog
├── AccessDeniedDialog.js     # Permission error dialog
├── ProviderIcon.js           # Provider logo component
└── index.js                  # Module exports
```

### Style Files

```
styles/modules/
├── file-indicator.css        # Pill and menu styles
├── cloud-picker.css          # File picker modal
├── access-settings.css       # Share settings modal
└── signin-prompt.css         # Auth prompt styles
```

### Test Files

```
tests/unit/ui/file/
├── FileIndicatorPill.test.js
├── FileIndicatorMenu.test.js
├── CloudFilePicker.test.js
├── SaveToCloudModal.test.js
├── AccessSettingsModal.test.js
└── SignInPrompt.test.js
```

---

## Design Tokens Used

All components use existing design tokens. No new tokens required.

| Category | Tokens Used |
|----------|-------------|
| Colors | `--color-bg-*`, `--color-text-*`, `--color-border-*`, `--color-accent-*` |
| Spacing | `--spacing-1` through `--spacing-6` |
| Typography | `--font-size-sm`, `--font-size-md`, `--font-size-lg`, `--font-weight-*` |
| Borders | `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-full` |
| Shadows | `--shadow-lg` |
| Z-Index | `--z-floating`, `--z-dropdown`, `--z-modal` |
| Transitions | `--transition-fast` |

---

*These components provide a complete file management UI for Story.*
