# User Preferences: UI Dialogs

## Overview
This specification details the modal dialogs and prompts associated with preference management, ensuring consistency with the global design system.

## 1. Import Preferences Dialog

### 1.1 Purpose
Allows user to select and confirm importing a `.str` preferences file.

### 1.2 UI Structure
- **Title**: "Import Preferences"
- **Body**:
    - "Select a Story preferences file (.str) to load your settings."
    - "Current unsaved settings will be overwritten."
- **File Drop Zone**:
    - Dashed border area.
    - Text: "Drag file here or click to browse".
- **Preview (Post-selection)**:
    - Show metadata from `manifest.json` (Owner, Last Modified).
    - "Created by: alice@example.com"
- **Actions**:
    - "Cancel" (Ghost)
    - "Import" (Primary)

## 2. Link Identity Dialog

### 2.1 Purpose
Explains the linking process before redirecting to OAuth provider.

### 2.2 UI Structure
- **Title**: "Link Account"
- **Body**:
    - "Authorize another account to access your preferences file."
    - "This allows you to sync settings across different logins."
- **Provider Selection**:
    - Button: "Sign in with Google"
    - Button: "Sign in with Microsoft"
- **Security Note**: "We will use your current session to encrypt the key for the new account."

## 3. "Preferences Not Found" Prompt

### 3.1 Purpose
Shown when a returning user logs in but the system cannot auto-locate the file.

### 3.2 UI Structure
- **Type**: Small Modal / Alert.
- **Icon**: Search/Question mark.
- **Title**: "Setup Preferences"
- **Message**: "We couldn't find a preferences file for this account. How would you like to proceed?"
- **Options**:
    - **Card 1**: "Create New" (Icon: Plus) - "Start with fresh default settings."
    - **Card 2**: "Import File" (Icon: Upload) - "I have a preferences file saved."
- **Checkbox**: "Don't ask again (Use defaults)"

## 4. Confirmation Dialogs

### 4.1 Reset Defaults
- **Title**: "Reset all settings?"
- **Message**: "This will revert all appearance, editor, and shortcut settings to their defaults. This action cannot be undone."
- **Actions**: "Cancel", "Reset" (Danger).

### 4.2 Remove Linked Identity
- **Title**: "Remove access?"
- **Message**: "Are you sure you want to remove access for **bob@example.com**? They will no longer be able to decrypt this preferences file."
- **Actions**: "Cancel", "Remove" (Danger).
