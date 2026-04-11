# User Preferences: Caching Strategy (IndexedDB)

## Overview
This specification details the local storage strategy using IndexedDB to ensure fast startup times and offline capability.

## 1. Database Schema

### 1.1 Database Info
- **Name**: `StoryAppDB`
- **Store**: `preferences`
- **Version**: 1

### 1.2 Key-Value Structure
The store acts as a simple Key-Value store for the preferences system.

| Key | Value Type | Description |
|-----|------------|-------------|
| `active_file` | `ArrayBuffer` | The raw encrypted .str file bytes. |
| `decrypted_cache` | `JSON Object` | The decrypted preferences object (for fast read). |
| `meta:etag` | `String` | ETag of the file currently in `active_file`. |
| `meta:dirty` | `Boolean` | True if local changes haven't been pushed to cloud. |
| `meta:location` | `Object` | `{ provider: 'onedrive', path: '/...' }` |

## 2. Security Considerations

### 2.1 Local Encryption?
- **Decision**: We store the `active_file` (Encrypted) AND `decrypted_cache` (Plaintext).
- **Risk**: If someone has physical access to the machine and can open DevTools, they can read `decrypted_cache`.
- **Mitigation**: This is standard behavior for web apps (cookies, localStorage are readable). The primary threat model is protecting the *cloud file* and *portability*.
- **Refinement**: Ideally, we only store `active_file` (Encrypted). On app load, we ask the Identity Provider for the token to decrypt it in memory.
    - **Trade-off**: Requires network for key derivation? No, OAuth tokens might be cached.
    - **Selected Approach**: Store `active_file` (Encrypted). Do NOT store `decrypted_cache` persistently if high security is required.
    - **Pragmatic Approach**: Store `decrypted_cache` for performance, clear it on "Sign Out".

## 3. Cache Invalidation

### 3.1 Sign Out
- When user signs out:
    - **Clear** `decrypted_cache`.
    - **Keep** `active_file`?
        - If it's a shared computer, we should clear it.
        - If it's personal, keeping it allows faster sign-in later.
    - **Policy**: Clear all preference data from IndexedDB on explicit Sign Out.

### 3.2 File Change
- When a new file is loaded (Import/Sync):
    - Overwrite `active_file`.
    - Update `meta:etag`.
    - Clear `meta:dirty`.

## 4. Startup Sequence

1.  **Init DB**: Open `StoryAppDB`.
2.  **Read**: Get `active_file` and `meta:location`.
3.  **Check Auth**: Is there a valid OAuth session?
4.  **Decrypt**:
    - If Yes: Derive key -> Decrypt `active_file` -> Load into Memory.
    - If No: Show "Sign in to load preferences" or load Defaults.
