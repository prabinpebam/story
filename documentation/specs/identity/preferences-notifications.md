# User Preferences: Notifications System

## Overview
This specification catalogs all user-facing notifications related to the preferences system, ensuring clear communication of system state and errors.

## 1. Notification Types

We use three levels of notification:
1.  **Toast**: Transient, non-blocking, success/info messages.
2.  **Banner**: Persistent, non-blocking, warning/action needed.
3.  **Modal**: Blocking, critical errors or required decisions.

## 2. Notification Catalog

### 2.1 Success Messages (Toasts)

| ID | Trigger | Message | Duration |
|----|---------|---------|----------|
| `PREF_SAVE` | Auto-save completes | "Preferences saved" | 2s |
| `PREF_IMPORT` | Import successful | "Settings imported successfully" | 3s |
| `PREF_RESET` | Reset to defaults | "Settings reset to defaults" | 3s |
| `LINK_ADD` | Identity linked | "Account linked successfully" | 4s |

### 2.2 Warnings & Action Prompts (Banners)

| ID | Trigger | Message | Actions |
|----|---------|---------|---------|
| `SYNC_OFFLINE` | Network lost | "You are offline. Changes saved locally." | None |
| `SYNC_CONFLICT` | ETag mismatch | "Settings updated on another device." | [Refresh] |
| `NO_PREFS` | Login on new device | "No preferences found for this account." | [Create] [Import] |
| `LINK_BROKEN` | Linked file missing | "Linked preferences file not found." | [Ignore] [Locate...] |

### 2.3 Critical Errors (Modals)

| ID | Trigger | Title | Body | Actions |
|----|---------|-------|------|---------|
| `DECRYPT_FAIL` | Wrong identity | "Access Denied" | "Your current account cannot unlock this preferences file." | [Switch Account] [Cancel] |
| `CORRUPT_FILE` | Checksum fail | "File Error" | "The preferences file is corrupted." | [Use Defaults] [Restore Backup] |
| `STORAGE_FULL` | Quota exceeded | "Storage Full" | "Cannot save preferences. Cloud storage is full." | [OK] |

## 3. Implementation Guidelines

- **Debouncing**: Do not show `PREF_SAVE` toast on every keystroke. Only show it after a "batch" save or manual action.
- **Quiet Mode**: During presentation mode, suppress all non-critical notifications.
- **Action Handling**: Banners with actions must persist until the action is taken or explicitly dismissed.
