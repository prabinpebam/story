# User Preferences: UI Panels Design

## Overview
This specification defines the visual design and layout of the Preferences Panel, adhering to the Story Design System.

## 1. Main Preferences Panel

### 1.1 Layout Structure
- **Component**: `Modal` (Centered, fixed width 800px, height 600px).
- **Sidebar**: Category navigation (Left, 200px width).
- **Content Area**: Scrollable settings form (Right, flex-grow).

### 1.2 Design Tokens Usage
- **Background**: `var(--color-bg-elevated)`
- **Text**: `var(--color-text-primary)`
- **Border**: `var(--color-border)`
- **Shadow**: `var(--shadow-floating)`
- **Radius**: `var(--radius-lg)`

### 1.3 Sidebar Navigation
- **List Items**:
    - General (Icon: Settings)
    - Appearance (Icon: Eye)
    - Editor (Icon: Grid)
    - Shortcuts (Icon: Keyboard)
    - Account & Sync (Icon: Cloud)
- **State**:
    - Active Item: `bg: var(--color-accent-subtle)`, `text: var(--color-accent)`
    - Hover: `bg: var(--color-bg-hover)`

### 1.4 Content Area Layout
- **Header**: Category Title (`h2`, `var(--font-size-xl)`).
- **Sections**: Grouped settings with dividers.
- **Form Controls**:
    - **Toggles**: Standard switch component.
    - **Dropdowns**: Standard select component.
    - **Inputs**: Standard text input.

## 2. Account & Sync Tab

This is a new section specific to the file-based preferences system.

### 2.1 Sync Status Card
- **Container**: Bordered box with `var(--color-bg-subtle)`.
- **Content**:
    - **Status Icon**: Green check (Synced), Yellow warning (Unsaved), Red (Error).
    - **Text**: "Preferences saved to OneDrive" / "Last synced: Just now".
    - **Path**: Display truncated path `/Apps/Story/story-preferences.str`.

### 2.2 File Management Actions
- **Buttons Row**:
    - `Button (Secondary)`: "Import Settings..."
    - `Button (Secondary)`: "Export Backup..."
    - `Button (Danger/Ghost)`: "Reset to Defaults"

### 2.3 Linked Identities List
- **Header**: "Authorized Accounts"
- **List Item**:
    - Avatar (Circle)
    - Name & Email
    - Provider Icon (Google/Microsoft)
    - Action: "Remove" (Trash icon) - *Cannot remove current owner*.
- **Add Button**: "+ Link another account"

## 3. CSS Reference (Mockup)

```css
.preferences-modal {
    background: var(--color-bg-elevated);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-floating);
    display: flex;
    overflow: hidden;
}

.prefs-sidebar {
    width: 200px;
    background: var(--color-bg-secondary);
    border-right: 1px solid var(--color-border);
    padding: var(--spacing-4);
}

.prefs-nav-item {
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
}

.prefs-nav-item.active {
    background: var(--color-accent-subtle);
    color: var(--color-accent);
    font-weight: 500;
}

.prefs-content {
    flex: 1;
    padding: var(--spacing-6);
    overflow-y: auto;
}

.sync-status-card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--spacing-4);
    background: var(--color-bg-subtle);
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-6);
}
```
