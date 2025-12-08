# User Preferences: UI Indicators & Notifications

## Overview
This specification defines the subtle UI indicators and notification states that keep the user informed about their preferences sync status without being intrusive.

## 1. Sync Status Indicator

### 1.1 Location
- **Placement**: Bottom-left corner of the application status bar, or within the User Profile flyout.

### 1.2 States

| State | Icon | Color | Tooltip Text |
|-------|------|-------|--------------|
| **Synced** | Cloud Check | `var(--color-text-tertiary)` | "Preferences saved" |
| **Syncing** | Refresh (Spin) | `var(--color-accent)` | "Syncing preferences..." |
| **Dirty (Local)** | Cloud Up Arrow | `var(--color-warning)` | "Changes saved locally (Waiting for connection)" |
| **Error** | Cloud Warning | `var(--color-error)` | "Sync failed. Click to retry." |

### 1.3 Interaction
- **Click**: Opens the "Account & Sync" tab in the Preferences Modal.

## 2. Toast Notifications

Used for transient feedback after user actions.

### 2.1 Scenarios
- **Save Success**: "Preferences saved." (Auto-dismiss: 2s)
- **Import Success**: "Preferences imported successfully." (Auto-dismiss: 4s)
- **Link Success**: "Account linked. You can now access settings with both identities." (Auto-dismiss: 5s)

### 2.2 Design
- **Component**: `Toast`
- **Position**: Bottom-center.
- **Style**: Dark background, white text, rounded corners.

## 3. Banner Notifications

Used for persistent issues requiring user attention.

### 3.1 "Missing Preferences" Banner
- **Context**: User opens a file linked to preferences, but isn't signed in.
- **Message**: "Sign in to load your personalized settings for this file."
- **Action**: "Sign In" button.
- **Dismiss**: "X" button (Applies defaults for session).

### 3.2 "Sync Conflict" Banner
- **Context**: Cloud version is newer than local version.
- **Message**: "Your preferences were updated on another device."
- **Action**: "Refresh" (Reloads settings).

## 4. Input Validation Indicators

Within the Preferences Panel:
- **Invalid Shortcut**: Red border on input. Text: "Shortcut already in use."
- **Invalid Grid Size**: Red border. Text: "Must be between 2px and 100px."
