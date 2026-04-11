# User Preferences File Specification

## Overview

This specification defines the **User Preferences File** (`.str` format) - a portable, encrypted file that stores all user preferences and can sync across devices. The file is identity-locked using OAuth, ensuring only the authenticated owner can decrypt it.

**Related Specifications:**
- [User Profile Model](./user-profile-model.md) - What preferences exist
- [Cross-Device Identity](./cross-device-identity.md) - Multi-device sync
- [Identity Security](./identity-security.md) - Security model
- [File Format Storage](../storage/file-format-storage.md) - Base .str format

---

## Table of Contents

1. [Design Decision: Separate File vs. Embedded](#1-design-decision)
2. [Preferences File Format](#2-preferences-file-format)
3. [Identity-Locked Encryption](#3-identity-locked-encryption)
4. [File Location & Discovery](#4-file-location--discovery)
5. [Sharing Access](#5-sharing-access)
6. [Sync Strategy](#6-sync-strategy)
7. [Preference Schema](#7-preference-schema)
8. [Implementation](#8-implementation)
9. [Gaps and Edge Cases](#9-gaps-and-edge-cases)
10. [Alternative: Embedded Preferences](#10-alternative-embedded-preferences)

---

## 1. Design Decision

### 1.1 Separate File vs. Embedded in Every .str

```
┌─────────────────────────────────────────────────────────────────┐
│           PREFERENCES STORAGE OPTIONS COMPARISON                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  OPTION A: SEPARATE PREFERENCES FILE (Recommended)              │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  username-preferences.str (or story-preferences.str)      │ │
│  │  ├── manifest.json                                        │ │
│  │  ├── preferences.json.enc (encrypted)                     │ │
│  │  └── access.json (who can open)                          │ │
│  │                                                            │ │
│  │  Pros:                                                     │ │
│  │  ✅ Single source of truth                                │ │
│  │  ✅ Syncs via cloud storage automatically                 │ │
│  │  ✅ Small file (~10-50KB)                                 │ │
│  │  ✅ Presentation files stay lean                          │ │
│  │  ✅ User controls where to store it                       │ │
│  │                                                            │ │
│  │  Cons:                                                     │ │
│  │  ❌ Extra file to manage                                  │ │
│  │  ❌ User must remember location                           │ │
│  │  ❌ Not portable with presentation                        │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  OPTION B: EMBEDDED IN EVERY .str FILE                          │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  presentation.str                                         │ │
│  │  ├── ... presentation data ...                            │ │
│  │  └── user-preferences/                                    │ │
│  │      └── {userId}/                                        │ │
│  │          └── preferences.json.enc                         │ │
│  │                                                            │ │
│  │  Pros:                                                     │ │
│  │  ✅ Preferences travel with files                         │ │
│  │  ✅ No extra file to manage                               │ │
│  │                                                            │ │
│  │  Cons:                                                     │ │
│  │  ❌ Duplicated across every file                          │ │
│  │  ❌ Files grow larger                                     │ │
│  │  ❌ Sync conflicts when editing same file                 │ │
│  │  ❌ Privacy: Your preferences in shared files             │ │
│  │  ❌ Merge complexity on collaboration                     │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  RECOMMENDATION: Use OPTION A (Separate File)                   │
│                                                                 │
│  Why:                                                           │
│  • Preferences are user-owned, not file-owned                  │
│  • One small file syncs via existing cloud storage             │
│  • No impact on presentation file size                         │
│  • Clean separation of concerns                                │
│  • Privacy: Preferences never shared with collaborators        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Size Impact Analysis

```
┌─────────────────────────────────────────────────────────────────┐
│                 EMBEDDED PREFERENCES SIZE IMPACT                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Typical preferences size: ~5-20KB (JSON + encryption overhead) │
│                                                                 │
│  Scenario: User with 50 presentations                           │
│  • Separate file: 1 × 20KB = 20KB total                        │
│  • Embedded: 50 × 20KB = 1MB total (50× overhead)              │
│                                                                 │
│  Scenario: 10 collaborators on same file (embedded approach)    │
│  • Each user's preferences embedded: 10 × 20KB = 200KB         │
│  • Every edit syncs all preferences (wasteful)                 │
│  • Potential privacy leak                                       │
│                                                                 │
│  VERDICT: Embedding causes unnecessary bloat and complexity    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Preferences File Format

### 2.1 File Structure

```
story-preferences.str (ZIP archive)
├── manifest.json           # File metadata and format version
├── identity.json           # Owner identity information
├── access/
│   └── allowed.json        # List of authorized identities
├── preferences/
│   └── data.json.enc       # Encrypted preferences data
└── metadata/
    └── sync.json           # Last sync timestamps per device
```

### 2.2 Manifest.json

```javascript
{
    // File format
    "formatType": "story-preferences",
    "formatVersion": "1.0.0",
    "appVersion": "0.1.0",
    
    // Timestamps
    "created": "2024-01-15T10:30:00Z",
    "modified": "2024-11-28T14:45:00Z",
    
    // Owner (the identity that created this file)
    "owner": {
        "id": "google_abc123def456",
        "email": "user@gmail.com",
        "provider": "google"
    },
    
    // Encryption info (for decryption)
    "encryption": {
        "algorithm": "AES-256-GCM",
        "keyDerivation": "identity-bound",
        "version": 1
    },
    
    // File identification
    "fileId": "pref_xyz789",
    "checksum": "sha256:abc123..."
}
```

### 2.3 Identity.json

```javascript
{
    // Primary owner identity (from OAuth)
    "owner": {
        "id": "google_abc123def456",
        "provider": "google",
        "email": "user@gmail.com",
        "name": "Alice Smith",
        
        // OAuth token binding (for key derivation)
        "tokenBinding": {
            "sub": "abc123def456",          // OAuth sub claim
            "iss": "https://accounts.google.com",
            "createdAt": "2024-01-15T10:30:00Z"
        }
    },
    
    // Secondary linked identities (same person, different providers)
    "linkedIdentities": [
        {
            "id": "microsoft_xyz789",
            "provider": "microsoft",
            "email": "alice@outlook.com",
            "linkedAt": "2024-02-20T08:00:00Z"
        }
    ]
}
```

### 2.4 Access/allowed.json

```javascript
{
    // Access control list
    // Each entry can decrypt and read the preferences
    "allowedIdentities": [
        {
            "id": "google_abc123def456",
            "type": "owner",
            "addedAt": "2024-01-15T10:30:00Z"
        },
        {
            "id": "microsoft_xyz789",
            "type": "linked",
            "addedAt": "2024-02-20T08:00:00Z"
        }
    ],
    
    // Future: Allow trusted devices
    "trustedDevices": []
}
```

---

## 3. Identity-Locked Encryption

### 3.1 Encryption Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│               IDENTITY-LOCKED ENCRYPTION                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PROBLEM: How to encrypt so only the OAuth owner can decrypt?  │
│                                                                 │
│  SOLUTION: Derive encryption key from OAuth token claims        │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  OAuth ID Token                                            │ │
│  │  ├── sub: "abc123def456"  ◄── Stable user ID              │ │
│  │  ├── iss: "accounts.google.com"  ◄── Provider             │ │
│  │  └── (other claims)                                        │ │
│  └────────────────────┬──────────────────────────────────────┘ │
│                       │                                         │
│                       ▼                                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Key Derivation                                            │ │
│  │  ┌─────────────────────────────────────────────────────┐  │ │
│  │  │  Input:                                              │  │ │
│  │  │  • sub claim (user identifier)                       │  │ │
│  │  │  • issuer (provider identifier)                      │  │ │
│  │  │  • salt (stored in preferences file)                 │  │ │
│  │  │                                                       │  │ │
│  │  │  Algorithm: HKDF-SHA256                              │  │ │
│  │  │  Output: 256-bit AES key                             │  │ │
│  │  └─────────────────────────────────────────────────────┘  │ │
│  └────────────────────┬──────────────────────────────────────┘ │
│                       │                                         │
│                       ▼                                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Encrypted Preferences                                     │ │
│  │  • Only decryptable with matching OAuth identity          │ │
│  │  • No password needed (OAuth IS the key)                  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  SECURITY PROPERTIES:                                           │
│  ✅ Only the OAuth owner can decrypt                           │
│  ✅ Revoking OAuth access = can't decrypt                      │
│  ✅ File is useless without valid OAuth session                │
│  ✅ No separate password to remember                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Key Derivation

```typescript
/**
 * Derive encryption key from OAuth identity
 */
class IdentityKeyDerivation {
    private readonly SALT_LENGTH = 32;
    private readonly KEY_LENGTH = 256;
    
    /**
     * Generate encryption key from OAuth token
     * This key will be identical for the same user across sessions
     */
    async deriveKey(
        idTokenClaims: IDTokenClaims,
        storedSalt: Uint8Array
    ): Promise<CryptoKey> {
        // Create identity material from stable claims
        const identityMaterial = this.createIdentityMaterial(idTokenClaims);
        
        // Import as key material
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            identityMaterial,
            'HKDF',
            false,
            ['deriveKey']
        );
        
        // Derive AES key using HKDF
        return crypto.subtle.deriveKey(
            {
                name: 'HKDF',
                salt: storedSalt,
                info: new TextEncoder().encode('story-preferences-v1'),
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: this.KEY_LENGTH },
            false,
            ['encrypt', 'decrypt']
        );
    }
    
    /**
     * Create stable identity material from OAuth claims
     */
    private createIdentityMaterial(claims: IDTokenClaims): Uint8Array {
        // Combine stable, unique identifiers
        const material = JSON.stringify({
            sub: claims.sub,        // Unique user ID (stable)
            iss: claims.iss,        // Issuer (provider)
            // Note: Do NOT include email (can change)
            // Note: Do NOT include name (can change)
        });
        
        return new TextEncoder().encode(material);
    }
    
    /**
     * Generate new salt for first-time encryption
     */
    generateSalt(): Uint8Array {
        return crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
    }
}

interface IDTokenClaims {
    sub: string;        // Subject (unique user ID)
    iss: string;        // Issuer URL
    email?: string;
    name?: string;
}
```

### 3.3 Encryption Operations

```typescript
/**
 * Encrypt and decrypt preferences using identity-bound key
 */
class IdentityEncryption {
    private keyDerivation = new IdentityKeyDerivation();
    
    /**
     * Encrypt preferences data
     */
    async encrypt(
        preferences: UserPreferences,
        idTokenClaims: IDTokenClaims,
        salt: Uint8Array
    ): Promise<EncryptedData> {
        // Derive key from identity
        const key = await this.keyDerivation.deriveKey(idTokenClaims, salt);
        
        // Generate IV
        const iv = crypto.getRandomValues(new Uint8Array(12));
        
        // Encrypt preferences
        const plaintext = new TextEncoder().encode(
            JSON.stringify(preferences)
        );
        
        const ciphertext = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            plaintext
        );
        
        return {
            iv: Array.from(iv),
            ciphertext: Array.from(new Uint8Array(ciphertext)),
            salt: Array.from(salt)
        };
    }
    
    /**
     * Decrypt preferences data
     */
    async decrypt(
        encryptedData: EncryptedData,
        idTokenClaims: IDTokenClaims
    ): Promise<UserPreferences> {
        // Derive key from identity
        const salt = new Uint8Array(encryptedData.salt);
        const key = await this.keyDerivation.deriveKey(idTokenClaims, salt);
        
        // Decrypt
        const iv = new Uint8Array(encryptedData.iv);
        const ciphertext = new Uint8Array(encryptedData.ciphertext);
        
        try {
            const plaintext = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                key,
                ciphertext
            );
            
            return JSON.parse(new TextDecoder().decode(plaintext));
        } catch (error) {
            throw new DecryptionError(
                'Unable to decrypt preferences. ' +
                'This file was created with a different identity.'
            );
        }
    }
    
    /**
     * Verify if current identity can decrypt
     */
    async canDecrypt(
        encryptedData: EncryptedData,
        idTokenClaims: IDTokenClaims
    ): Promise<boolean> {
        try {
            await this.decrypt(encryptedData, idTokenClaims);
            return true;
        } catch {
            return false;
        }
    }
}

interface EncryptedData {
    iv: number[];
    ciphertext: number[];
    salt: number[];
}
```

### 3.4 Security Considerations

```
┌─────────────────────────────────────────────────────────────────┐
│                 ENCRYPTION SECURITY ANALYSIS                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  THREAT: Someone steals the preferences file                    │
│  MITIGATION: File is encrypted with identity-derived key        │
│              Attacker cannot decrypt without OAuth access       │
│              ✅ PROTECTED                                       │
│                                                                 │
│  THREAT: OAuth token is compromised                             │
│  MITIGATION: Token has limited lifetime                         │
│              User can revoke access at OAuth provider           │
│              ⚠️ RISK: Attacker can decrypt while token valid   │
│                                                                 │
│  THREAT: Key derivation is weak                                 │
│  MITIGATION: Using HKDF with SHA-256                           │
│              Salt prevents rainbow table attacks                │
│              ✅ PROTECTED (cryptographically sound)            │
│                                                                 │
│  THREAT: User forgets which OAuth they used                     │
│  MITIGATION: Store provider info in unencrypted manifest        │
│              Show user which identity created the file          │
│              ✅ HANDLED                                        │
│                                                                 │
│  THREAT: OAuth provider changes 'sub' claim                     │
│  MITIGATION: 'sub' is guaranteed stable per OAuth 2.0 spec     │
│              If it changes, user must recreate preferences     │
│              ⚠️ RARE but possible (provider account issue)     │
│                                                                 │
│  THREAT: File corruption                                        │
│  MITIGATION: Checksum in manifest                               │
│              Can detect corruption                              │
│              ✅ PROTECTED                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. File Location & Discovery

### 4.1 Default Locations

```
┌─────────────────────────────────────────────────────────────────┐
│                DEFAULT PREFERENCES FILE LOCATIONS               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ONEDRIVE:                                                      │
│  /Apps/Story/story-preferences.str                              │
│  └── Uses OneDrive app folder (isolated, app-specific)          │
│                                                                 │
│  GOOGLE DRIVE:                                                  │
│  /Story/story-preferences.str                                   │
│  └── Top-level folder (Google Drive doesn't have app folder)   │
│                                                                 │
│  LOCAL (fallback):                                              │
│  IndexedDB: story:preferences-file                              │
│  └── For offline use or if user declines cloud storage         │
│                                                                 │
│  CUSTOM:                                                        │
│  User can choose any location via file picker                   │
│  Location remembered in localStorage                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Discovery Flow

```typescript
/**
 * Find and load user preferences file
 */
class PreferencesDiscovery {
    private readonly LOCATION_KEY = 'story:preferences-location';
    
    /**
     * Try to find preferences file
     */
    async discover(
        cloudStorage: CloudStorageProvider,
        idTokenClaims: IDTokenClaims
    ): Promise<PreferencesFileResult> {
        // 1. Check saved location
        const savedLocation = localStorage.getItem(this.LOCATION_KEY);
        if (savedLocation) {
            try {
                const file = await this.loadFromLocation(savedLocation, cloudStorage);
                if (await this.verifyOwnership(file, idTokenClaims)) {
                    return { status: 'found', file };
                }
            } catch (error) {
                console.log('Saved location no longer valid');
            }
        }
        
        // 2. Check default cloud location
        const defaultPath = this.getDefaultPath(cloudStorage.providerId);
        try {
            const file = await cloudStorage.readFile(defaultPath);
            if (await this.verifyOwnership(file, idTokenClaims)) {
                this.saveLocation(defaultPath, cloudStorage.providerId);
                return { status: 'found', file };
            }
        } catch (error) {
            // File doesn't exist at default location
        }
        
        // 3. Check local fallback
        try {
            const localFile = await this.loadFromIndexedDB();
            if (localFile && await this.verifyOwnership(localFile, idTokenClaims)) {
                return { status: 'found_local', file: localFile };
            }
        } catch (error) {
            // No local file
        }
        
        // 4. No preferences file found
        return { status: 'not_found', file: null };
    }
    
    /**
     * Create new preferences file
     */
    async create(
        cloudStorage: CloudStorageProvider,
        idTokenClaims: IDTokenClaims,
        initialPreferences: UserPreferences
    ): Promise<PreferencesFile> {
        const file = await PreferencesFile.create(
            idTokenClaims,
            initialPreferences
        );
        
        // Save to default location
        const path = this.getDefaultPath(cloudStorage.providerId);
        await cloudStorage.writeFile(path, file.toBytes());
        
        this.saveLocation(path, cloudStorage.providerId);
        
        return file;
    }
    
    private getDefaultPath(providerId: string): string {
        switch (providerId) {
            case 'onedrive':
                return '/Apps/Story/story-preferences.str';
            case 'google-drive':
                return '/Story/story-preferences.str';
            default:
                return '/Story/story-preferences.str';
        }
    }
    
    private saveLocation(path: string, provider: string): void {
        localStorage.setItem(this.LOCATION_KEY, JSON.stringify({ path, provider }));
    }
    
    private async verifyOwnership(
        file: PreferencesFile,
        claims: IDTokenClaims
    ): Promise<boolean> {
        // Check if this identity can decrypt the file
        return file.canDecrypt(claims);
    }
}

interface PreferencesFileResult {
    status: 'found' | 'found_local' | 'not_found';
    file: PreferencesFile | null;
}
```

---

## 5. Sharing Access

### 5.1 Multi-Identity Access

```
┌─────────────────────────────────────────────────────────────────┐
│                 MULTI-IDENTITY ACCESS MODEL                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SCENARIO: Same person, multiple OAuth accounts                 │
│                                                                 │
│  Alice has:                                                     │
│  • alice@gmail.com (Google)      - Primary                     │
│  • alice@work.com (Microsoft)    - Work                        │
│                                                                 │
│  She wants preferences accessible from both identities          │
│                                                                 │
│  SOLUTION: Identity Linking + Multi-Key Encryption              │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Preferences File                                          │ │
│  │                                                            │ │
│  │  access/allowed.json:                                      │ │
│  │  {                                                         │ │
│  │    "allowedIdentities": [                                  │ │
│  │      { "id": "google_alice123", "type": "owner" },        │ │
│  │      { "id": "microsoft_alice456", "type": "linked" }     │ │
│  │    ]                                                       │ │
│  │  }                                                         │ │
│  │                                                            │ │
│  │  preferences/                                              │ │
│  │  └── data.json.enc                                        │ │
│  │      ├── Encrypted with Key A (Google identity)           │ │
│  │      └── Key A wrapped with Key B (Microsoft identity)    │ │
│  │                                                            │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  FLOW:                                                          │
│  1. Owner creates file → encrypted with owner's key            │
│  2. Owner links new identity → key wrapped for new identity    │
│  3. Either identity can unwrap key and decrypt                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Key Wrapping for Multi-Access

```typescript
/**
 * Support multiple identities accessing same preferences
 */
class MultiIdentityAccess {
    /**
     * Add a linked identity that can access the preferences
     */
    async addLinkedIdentity(
        preferencesFile: PreferencesFile,
        ownerClaims: IDTokenClaims,
        newIdentityClaims: IDTokenClaims
    ): Promise<void> {
        // 1. Derive the data encryption key (DEK) using owner's identity
        const ownerKey = await this.deriveKey(ownerClaims, preferencesFile.salt);
        const dek = await this.unwrapDEK(preferencesFile.wrappedKeys.owner, ownerKey);
        
        // 2. Derive key for new identity
        const newKey = await this.deriveKey(newIdentityClaims, preferencesFile.salt);
        
        // 3. Wrap DEK for new identity
        const wrappedForNew = await this.wrapDEK(dek, newKey);
        
        // 4. Store wrapped key
        const newIdentityId = this.getIdentityId(newIdentityClaims);
        preferencesFile.wrappedKeys[newIdentityId] = wrappedForNew;
        
        // 5. Update access list
        preferencesFile.access.allowedIdentities.push({
            id: newIdentityId,
            type: 'linked',
            addedAt: new Date().toISOString()
        });
    }
    
    /**
     * Remove a linked identity's access
     */
    async removeLinkedIdentity(
        preferencesFile: PreferencesFile,
        identityToRemove: string
    ): Promise<void> {
        // Remove wrapped key
        delete preferencesFile.wrappedKeys[identityToRemove];
        
        // Remove from access list
        preferencesFile.access.allowedIdentities = 
            preferencesFile.access.allowedIdentities.filter(
                i => i.id !== identityToRemove
            );
    }
    
    /**
     * Decrypt using any authorized identity
     */
    async decrypt(
        preferencesFile: PreferencesFile,
        claims: IDTokenClaims
    ): Promise<UserPreferences> {
        const identityId = this.getIdentityId(claims);
        
        // Check if this identity has access
        const wrappedKey = preferencesFile.wrappedKeys[identityId];
        if (!wrappedKey) {
            throw new AccessDeniedError(
                'This identity does not have access to these preferences'
            );
        }
        
        // Derive identity key
        const identityKey = await this.deriveKey(claims, preferencesFile.salt);
        
        // Unwrap DEK
        const dek = await this.unwrapDEK(wrappedKey, identityKey);
        
        // Decrypt preferences
        return this.decryptWithDEK(preferencesFile.encryptedData, dek);
    }
    
    private getIdentityId(claims: IDTokenClaims): string {
        const provider = this.getProvider(claims.iss);
        return `${provider}_${claims.sub}`;
    }
}
```

---

## 6. Sync Strategy

### 6.1 Sync Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                 PREFERENCES SYNC STRATEGY                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CLOUD SYNC (via cloud storage provider)                        │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │  ┌─────────┐    Cloud Storage    ┌─────────┐             │ │
│  │  │ Laptop  │◄───(OneDrive/GDrive)──►│ Tablet  │             │ │
│  │  └────┬────┘         │           └────┬────┘             │ │
│  │       │              │                │                   │ │
│  │       ▼              ▼                ▼                   │ │
│  │  story-preferences.str ◄──────────────────────────────►  │ │
│  │  (Same file, synced automatically by cloud provider)      │ │
│  │                                                            │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  CONFLICT HANDLING:                                             │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  1. On load: Check cloud file etag/modified time          │ │
│  │  2. If changed: Download and merge                        │ │
│  │  3. On save: Use etag for optimistic locking             │ │
│  │  4. On conflict: Merge preferences (last-write-wins)      │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  LOCAL CACHE:                                                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  • IndexedDB cache for offline access                     │ │
│  │  • Synced when online                                     │ │
│  │  • Marked as dirty when local changes pending             │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Sync Manager Implementation

```typescript
/**
 * Manage preferences sync across devices
 */
class PreferencesSyncManager {
    private localCache: IndexedDBCache;
    private cloudStorage: CloudStorageProvider;
    private lastKnownEtag: string | null = null;
    private isDirty: boolean = false;
    
    /**
     * Load preferences (from cache or cloud)
     */
    async load(claims: IDTokenClaims): Promise<UserPreferences> {
        // Try cloud first if online
        if (navigator.onLine) {
            try {
                const cloudFile = await this.cloudStorage.readFile(this.filePath);
                const cloudPrefs = await this.decrypt(cloudFile, claims);
                
                // Update local cache
                await this.localCache.set('preferences', cloudFile);
                await this.localCache.set('preferences:etag', cloudFile.etag);
                
                this.lastKnownEtag = cloudFile.etag;
                return cloudPrefs;
            } catch (error) {
                console.warn('Failed to load from cloud, using cache');
            }
        }
        
        // Fall back to local cache
        const cached = await this.localCache.get('preferences');
        if (cached) {
            return this.decrypt(cached, claims);
        }
        
        throw new Error('No preferences found');
    }
    
    /**
     * Save preferences (local + cloud)
     */
    async save(
        preferences: UserPreferences,
        claims: IDTokenClaims
    ): Promise<void> {
        // Encrypt
        const encrypted = await this.encrypt(preferences, claims);
        
        // Save locally first
        await this.localCache.set('preferences', encrypted);
        this.isDirty = true;
        
        // Sync to cloud if online
        if (navigator.onLine) {
            await this.syncToCloud(encrypted);
        } else {
            // Queue for later sync
            await this.localCache.set('preferences:dirty', true);
        }
    }
    
    /**
     * Sync local changes to cloud
     */
    private async syncToCloud(encrypted: PreferencesFile): Promise<void> {
        try {
            // Optimistic locking with etag
            await this.cloudStorage.writeFile(
                this.filePath,
                encrypted.toBytes(),
                { ifMatch: this.lastKnownEtag }
            );
            
            this.isDirty = false;
            await this.localCache.set('preferences:dirty', false);
        } catch (error) {
            if (error.code === 'PRECONDITION_FAILED') {
                // Conflict! File was modified by another device
                await this.handleConflict(encrypted);
            } else {
                throw error;
            }
        }
    }
    
    /**
     * Handle sync conflict
     */
    private async handleConflict(localFile: PreferencesFile): Promise<void> {
        // Download latest from cloud
        const cloudFile = await this.cloudStorage.readFile(this.filePath);
        
        // Merge preferences (simple strategy: last-write-wins per field)
        const merged = await this.mergePreferences(
            await this.decrypt(localFile),
            await this.decrypt(cloudFile)
        );
        
        // Save merged version
        const encrypted = await this.encrypt(merged);
        await this.cloudStorage.writeFile(this.filePath, encrypted.toBytes());
        
        // Update local cache
        await this.localCache.set('preferences', encrypted);
        this.lastKnownEtag = encrypted.etag;
    }
    
    /**
     * Merge preferences from two sources
     */
    private mergePreferences(
        local: UserPreferences,
        cloud: UserPreferences
    ): UserPreferences {
        return {
            // Use timestamps to determine winner for each field
            theme: this.pickNewer('theme', local, cloud),
            language: this.pickNewer('language', local, cloud),
            displayNameOverride: this.pickNewer('displayNameOverride', local, cloud),
            preferredColor: this.pickNewer('preferredColor', local, cloud),
            
            // Always use local for device-specific
            defaultStorageProvider: local.defaultStorageProvider,
            
            // Merge arrays (union)
            recentFiles: this.mergeRecentFiles(local.recentFiles, cloud.recentFiles)
        };
    }
}
```

---

## 7. Preference Schema

### 7.1 Complete Preferences Structure

```typescript
/**
 * Full preferences schema stored in preferences file
 */
interface UserPreferences {
    // ─────────────────────────────────────────────────────────
    // Appearance (synced across devices)
    // ─────────────────────────────────────────────────────────
    
    /** Theme preference */
    theme: 'light' | 'dark' | 'system';
    
    /** UI language */
    language: string;
    
    /** Custom display name override */
    displayNameOverride?: string;
    
    /** Preferred collaboration cursor color */
    preferredColor?: string;
    
    // ─────────────────────────────────────────────────────────
    // Editor Preferences (synced)
    // ─────────────────────────────────────────────────────────
    
    /** Grid snap settings */
    gridSettings: {
        showGrid: boolean;
        snapToGrid: boolean;
        gridSize: number;
    };
    
    /** Default font for new text elements */
    defaultFont: {
        family: string;
        size: number;
    };
    
    /** Auto-save interval (ms) */
    autoSaveInterval: number;
    
    // ─────────────────────────────────────────────────────────
    // Keyboard Shortcuts (synced)
    // ─────────────────────────────────────────────────────────
    
    /** Custom keyboard shortcuts */
    shortcuts: Record<string, string>;
    
    // ─────────────────────────────────────────────────────────
    // Device-Specific (NOT synced - stored locally)
    // ─────────────────────────────────────────────────────────
    
    /** Default storage provider for this device */
    defaultStorageProvider: 'onedrive' | 'google-drive' | 'local';
    
    /** Window state (per device) */
    windowState?: {
        panelWidths: Record<string, number>;
        expandedPanels: string[];
    };
    
    // ─────────────────────────────────────────────────────────
    // Recent Activity (merged across devices)
    // ─────────────────────────────────────────────────────────
    
    /** Recently opened files */
    recentFiles: RecentFile[];
    
    /** Recently used colors */
    recentColors: string[];
    
    /** Recently used fonts */
    recentFonts: string[];
    
    // ─────────────────────────────────────────────────────────
    // Collaboration Contacts (synced)
    // ─────────────────────────────────────────────────────────
    
    /** Recent collaborators for quick sharing */
    recentCollaborators: CollaboratorContact[];
    
    // ─────────────────────────────────────────────────────────
    // Metadata (managed by system)
    // ─────────────────────────────────────────────────────────
    
    /** Schema version for migrations */
    schemaVersion: number;
    
    /** Last modified timestamp */
    lastModified: string;
    
    /** Per-device sync metadata */
    deviceSync: {
        [deviceId: string]: {
            lastSeen: string;
            deviceType: string;
        };
    };
}

interface RecentFile {
    id: string;
    name: string;
    provider: string;
    path?: string;
    lastOpened: string;
    thumbnailUrl?: string;
}

interface CollaboratorContact {
    id: string;
    displayName: string;
    email: string;
    avatarUrl?: string;
    lastCollaboration: string;
}
```

---

## 8. Implementation

### 8.1 Preferences File Class

```typescript
/**
 * Main preferences file handler
 */
class PreferencesFile {
    private manifest: PreferencesManifest;
    private identity: IdentityInfo;
    private access: AccessInfo;
    private encryptedData: EncryptedData;
    private salt: Uint8Array;
    
    /**
     * Create new preferences file
     */
    static async create(
        claims: IDTokenClaims,
        initialPreferences: UserPreferences
    ): Promise<PreferencesFile> {
        const encryption = new IdentityEncryption();
        const salt = new IdentityKeyDerivation().generateSalt();
        
        const identityId = `${getProvider(claims.iss)}_${claims.sub}`;
        
        const file = new PreferencesFile();
        file.salt = salt;
        
        // Create manifest
        file.manifest = {
            formatType: 'story-preferences',
            formatVersion: '1.0.0',
            appVersion: APP_VERSION,
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            owner: {
                id: identityId,
                email: claims.email,
                provider: getProvider(claims.iss)
            },
            encryption: {
                algorithm: 'AES-256-GCM',
                keyDerivation: 'identity-bound',
                version: 1
            },
            fileId: generateFileId(),
            checksum: '' // Computed on save
        };
        
        // Create identity info
        file.identity = {
            owner: {
                id: identityId,
                provider: getProvider(claims.iss),
                email: claims.email,
                name: claims.name,
                tokenBinding: {
                    sub: claims.sub,
                    iss: claims.iss,
                    createdAt: new Date().toISOString()
                }
            },
            linkedIdentities: []
        };
        
        // Create access control
        file.access = {
            allowedIdentities: [
                {
                    id: identityId,
                    type: 'owner',
                    addedAt: new Date().toISOString()
                }
            ],
            trustedDevices: []
        };
        
        // Encrypt preferences
        file.encryptedData = await encryption.encrypt(
            initialPreferences,
            claims,
            salt
        );
        
        return file;
    }
    
    /**
     * Load from bytes (ZIP file)
     */
    static async fromBytes(data: ArrayBuffer): Promise<PreferencesFile> {
        const zip = await JSZip.loadAsync(data);
        
        const file = new PreferencesFile();
        
        // Read components
        file.manifest = JSON.parse(await zip.file('manifest.json').async('text'));
        file.identity = JSON.parse(await zip.file('identity.json').async('text'));
        file.access = JSON.parse(await zip.file('access/allowed.json').async('text'));
        
        const encryptedBytes = await zip.file('preferences/data.json.enc').async('uint8array');
        file.encryptedData = JSON.parse(new TextDecoder().decode(encryptedBytes));
        file.salt = new Uint8Array(file.encryptedData.salt);
        
        return file;
    }
    
    /**
     * Export to bytes (ZIP file)
     */
    async toBytes(): Promise<ArrayBuffer> {
        const zip = new JSZip();
        
        // Update modified time and checksum
        this.manifest.modified = new Date().toISOString();
        
        zip.file('manifest.json', JSON.stringify(this.manifest, null, 2));
        zip.file('identity.json', JSON.stringify(this.identity, null, 2));
        zip.file('access/allowed.json', JSON.stringify(this.access, null, 2));
        zip.file('preferences/data.json.enc', JSON.stringify(this.encryptedData));
        
        return zip.generateAsync({ type: 'arraybuffer' });
    }
    
    /**
     * Check if identity can decrypt this file
     */
    canDecrypt(claims: IDTokenClaims): boolean {
        const identityId = `${getProvider(claims.iss)}_${claims.sub}`;
        return this.access.allowedIdentities.some(i => i.id === identityId);
    }
    
    /**
     * Decrypt and get preferences
     */
    async getPreferences(claims: IDTokenClaims): Promise<UserPreferences> {
        if (!this.canDecrypt(claims)) {
            throw new AccessDeniedError('Identity not authorized');
        }
        
        const encryption = new IdentityEncryption();
        return encryption.decrypt(this.encryptedData, claims);
    }
    
    /**
     * Update preferences
     */
    async setPreferences(
        preferences: UserPreferences,
        claims: IDTokenClaims
    ): Promise<void> {
        if (!this.canDecrypt(claims)) {
            throw new AccessDeniedError('Identity not authorized');
        }
        
        const encryption = new IdentityEncryption();
        this.encryptedData = await encryption.encrypt(preferences, claims, this.salt);
        this.manifest.modified = new Date().toISOString();
    }
}
```

### 8.2 Integration with App

```typescript
/**
 * Preferences manager integrating with Story app
 */
class PreferencesManager {
    private file: PreferencesFile | null = null;
    private preferences: UserPreferences | null = null;
    private syncManager: PreferencesSyncManager;
    private discovery: PreferencesDiscovery;
    
    /**
     * Initialize preferences on app start
     */
    async initialize(
        cloudStorage: CloudStorageProvider,
        claims: IDTokenClaims
    ): Promise<UserPreferences> {
        // Discover or create preferences file
        const result = await this.discovery.discover(cloudStorage, claims);
        
        if (result.status === 'not_found') {
            // First time user - create with defaults
            const defaults = this.getDefaultPreferences();
            this.file = await this.discovery.create(cloudStorage, claims, defaults);
            this.preferences = defaults;
        } else {
            // Load existing preferences
            this.file = result.file!;
            this.preferences = await this.file.getPreferences(claims);
        }
        
        // Start sync manager
        this.syncManager.start(this.file, claims);
        
        return this.preferences;
    }
    
    /**
     * Update a preference
     */
    async updatePreference<K extends keyof UserPreferences>(
        key: K,
        value: UserPreferences[K],
        claims: IDTokenClaims
    ): Promise<void> {
        if (!this.preferences || !this.file) {
            throw new Error('Preferences not initialized');
        }
        
        // Update in memory
        this.preferences[key] = value;
        this.preferences.lastModified = new Date().toISOString();
        
        // Save to file
        await this.file.setPreferences(this.preferences, claims);
        
        // Sync (async, non-blocking)
        this.syncManager.save(this.preferences, claims).catch(error => {
            console.warn('Failed to sync preferences:', error);
        });
    }
    
    /**
     * Get current preferences
     */
    getPreferences(): UserPreferences {
        if (!this.preferences) {
            throw new Error('Preferences not initialized');
        }
        return { ...this.preferences };
    }
    
    private getDefaultPreferences(): UserPreferences {
        return {
            theme: 'system',
            language: navigator.language || 'en-US',
            defaultStorageProvider: 'local',
            gridSettings: {
                showGrid: true,
                snapToGrid: true,
                gridSize: 10
            },
            defaultFont: {
                family: 'Inter',
                size: 16
            },
            autoSaveInterval: 30000,
            shortcuts: {},
            recentFiles: [],
            recentColors: [],
            recentFonts: [],
            recentCollaborators: [],
            schemaVersion: 1,
            lastModified: new Date().toISOString(),
            deviceSync: {}
        };
    }
}
```

---

## 9. Gaps and Edge Cases

### 9.1 Identified Issues

```
┌─────────────────────────────────────────────────────────────────┐
│                 GAPS AND EDGE CASES                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  GAP 1: What if user changes OAuth provider email?              │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Issue: Email in identity.json becomes stale               │ │
│  │  Impact: Minor - we use 'sub' claim, not email, for auth   │ │
│  │  Solution: Update email on each sign-in                    │ │
│  │  Status: ✅ Handled (sub is stable, email is informational)│ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  GAP 2: What if cloud storage is inaccessible?                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Issue: Can't read preferences file                        │ │
│  │  Impact: User starts with defaults, loses settings         │ │
│  │  Solution: Always cache locally in IndexedDB              │ │
│  │  Status: ✅ Handled (local cache as fallback)             │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  GAP 3: What if user deletes preferences file accidentally?     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Issue: Preferences lost                                   │ │
│  │  Impact: User must reconfigure settings                    │ │
│  │  Solution: Local cache survives until new file created    │ │
│  │  Future: Add backup/restore capability                    │ │
│  │  Status: ⚠️ Partially handled                             │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  GAP 4: What if user has files in multiple cloud providers?     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Issue: Preferences file can only be in one location      │ │
│  │  Impact: User must choose primary cloud for preferences   │ │
│  │  Solution: Preferences file location is user choice       │ │
│  │            Presentations can be anywhere                  │ │
│  │  Status: ✅ By design                                     │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  GAP 5: Migration from localStorage to preferences file?        │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Issue: Existing users have preferences in localStorage   │ │
│  │  Impact: Would lose settings on first use of new system   │ │
│  │  Solution: Migration path - import from localStorage      │ │
│  │  Status: ⏳ Needs implementation                          │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  GAP 6: What if OAuth 'sub' claim changes?                      │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Issue: User can't decrypt their preferences              │ │
│  │  Impact: Preferences inaccessible                         │ │
│  │  Likelihood: Very rare (OAuth spec guarantees stability)  │ │
│  │  Solution: User must create new preferences file          │ │
│  │            Could add recovery email option in future      │ │
│  │  Status: ⚠️ Edge case, acceptable risk                   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  GAP 7: Preferences file becomes corrupted?                     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Issue: Can't parse or decrypt file                        │ │
│  │  Impact: User loses preferences                            │ │
│  │  Solution: Checksum validation                            │ │
│  │            Local cache as backup                          │ │
│  │            Offer to recreate file from cache              │ │
│  │  Status: ✅ Handled via checksum + cache                  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  GAP 8: User wants to share preferences with team?              │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Issue: Preferences are personal, identity-locked         │ │
│  │  Impact: Can't share settings with teammates              │ │
│  │  Solution: Future: Export/import settings as JSON         │ │
│  │            Future: Team settings files (different format) │ │
│  │  Status: ⏳ Out of scope for v1                          │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  GAP 9: What about .str file extension collision?               │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Issue: Preferences use .str like presentations           │ │
│  │  Impact: User might confuse file types                    │ │
│  │  Solution: formatType in manifest distinguishes           │ │
│  │            Could use .str-prefs extension alternatively   │ │
│  │  Status: ✅ Handled via manifest formatType               │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Migration Strategy

```typescript
/**
 * Migrate from localStorage to preferences file
 */
class PreferencesMigration {
    /**
     * Check if migration needed
     */
    needsMigration(): boolean {
        // Check for legacy localStorage preferences
        return localStorage.getItem('story:preferences') !== null;
    }
    
    /**
     * Migrate legacy preferences to new file
     */
    async migrate(
        cloudStorage: CloudStorageProvider,
        claims: IDTokenClaims
    ): Promise<PreferencesFile> {
        // 1. Read legacy preferences
        const legacyJson = localStorage.getItem('story:preferences');
        const legacyPrefs = legacyJson ? JSON.parse(legacyJson) : {};
        
        // 2. Convert to new schema
        const newPrefs = this.convertToNewSchema(legacyPrefs);
        
        // 3. Create new preferences file
        const file = await PreferencesFile.create(claims, newPrefs);
        
        // 4. Save to cloud
        const path = '/Story/story-preferences.str';
        await cloudStorage.writeFile(path, await file.toBytes());
        
        // 5. Clear legacy storage (optional - could keep as backup)
        // localStorage.removeItem('story:preferences');
        
        console.log('Migrated preferences from localStorage to cloud file');
        
        return file;
    }
    
    private convertToNewSchema(legacy: any): UserPreferences {
        return {
            theme: legacy.theme || 'system',
            language: legacy.language || navigator.language,
            displayNameOverride: legacy.displayNameOverride,
            preferredColor: legacy.preferredColor,
            defaultStorageProvider: legacy.defaultStorageProvider || 'local',
            gridSettings: legacy.gridSettings || {
                showGrid: true,
                snapToGrid: true,
                gridSize: 10
            },
            defaultFont: legacy.defaultFont || {
                family: 'Inter',
                size: 16
            },
            autoSaveInterval: legacy.autoSaveInterval || 30000,
            shortcuts: legacy.shortcuts || {},
            recentFiles: legacy.recentFiles || [],
            recentColors: legacy.recentColors || [],
            recentFonts: legacy.recentFonts || [],
            recentCollaborators: [],
            schemaVersion: 1,
            lastModified: new Date().toISOString(),
            deviceSync: {}
        };
    }
}
```

---

## 10. Alternative: Embedded Preferences

### 10.1 Hybrid Approach (If Needed)

If certain preferences MUST travel with the file, use a minimal embedding:

```
┌─────────────────────────────────────────────────────────────────┐
│                 HYBRID: FILE-SPECIFIC PREFERENCES               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Separate preferences file: Global user preferences             │
│  • Theme, language, shortcuts                                   │
│  • Recent files list                                            │
│  • Collaboration contacts                                       │
│                                                                 │
│  Embedded in .str file: File-specific preferences               │
│  • Last viewed slide (per user)                                 │
│  • Zoom level (per user)                                        │
│  • Panel states when editing this file                          │
│                                                                 │
│  This keeps files small while allowing per-file state.          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 10.2 File-Specific Preferences Schema

```typescript
/**
 * Minimal preferences embedded in presentation file
 * (If hybrid approach is chosen)
 */
interface FileSpecificPreferences {
    // Keyed by user ID
    [userId: string]: {
        lastViewedSlide: string;
        zoomLevel: number;
        scrollPosition: { x: number; y: number };
        lastAccessed: string;
    };
}

// In presentation.str/document/user-state.json
{
    "google_alice123": {
        "lastViewedSlide": "slide-005",
        "zoomLevel": 1.5,
        "scrollPosition": { "x": 0, "y": 200 },
        "lastAccessed": "2024-11-28T14:30:00Z"
    }
}
```

---

## Summary

The **User Preferences File** system provides:

1. **Separate encrypted file** (`story-preferences.str`) for user settings
2. **Identity-locked encryption** using OAuth token claims
3. **Automatic sync** via user's cloud storage provider
4. **Multi-identity support** for users with multiple OAuth accounts
5. **Local cache** for offline access and fast startup
6. **Migration path** from legacy localStorage

Key design decisions:
- ✅ Preferences file is separate from presentation files
- ✅ No password needed - OAuth IS the key
- ✅ User controls file location in their cloud storage
- ✅ Small file size (~10-50KB)
- ✅ Privacy preserved - preferences never shared

---

## Related Specifications

- [User Profile Model](./user-profile-model.md) - Profile schema
- [Cross-Device Identity](./cross-device-identity.md) - Sync strategy
- [Identity Security](./identity-security.md) - Encryption details
- [File Format Storage](../storage/file-format-storage.md) - Base format

---

*The preferences file is your personal settings vault, unlocked by your identity.*
