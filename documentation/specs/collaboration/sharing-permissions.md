# Sharing & Permissions - Specification

## Overview

This specification defines the **sharing and permission models** for Story presentations. The system supports three sharing methods, all working **without a server database**:

| Model | Security | User Management | Best For |
|-------|----------|-----------------|----------|
| **Anyone with link** | Low | None | Quick sharing, public content |
| **Link + Password** | Medium | None (password = access) | Semi-private sharing |
| **Email-based (Cloud)** | High | Cloud provider handles | Team collaboration |

**Design Principles:**
- No server-side user database required
- Security data stored in the file itself or cloud provider
- OAuth identity for accountability (who's editing)
- All verification happens client-side or via cloud APIs

**Related Specifications:**
- [Authentication](./authentication.md) - OAuth providers
- [Cloud Storage Abstraction](./cloud-storage-abstraction.md) - Storage APIs
- [Collaboration Protocol](./collaboration-protocol.md) - Real-time messaging
- [Real-Time Collaboration](./realtime-collaboration.md) - Architecture overview

---

## Table of Contents

1. [Sharing Models Overview](#1-sharing-models-overview)
2. [Anyone with Link](#2-anyone-with-link)
3. [Link + Password](#3-link--password)
4. [Email-based (Cloud Provider)](#4-email-based-cloud-provider)
5. [Permission Levels](#5-permission-levels)
6. [File Manifest Schema](#6-file-manifest-schema)
7. [Access Verification Flow](#7-access-verification-flow)
8. [Share Dialog UI](#8-share-dialog-ui)
9. [Security Considerations](#9-security-considerations)

---

## 1. Sharing Models Overview

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      SHARING FLOW                               │
│                                                                 │
│  Owner creates share ──► Share config stored in:                │
│                          • manifest.json (in .str file)         │
│                          • Cloud provider (for email-based)     │
│                                                                 │
│  Recipient opens link ──► Must authenticate (OAuth)             │
│                       ──► Access check:                         │
│                          • Link mode: Always allowed            │
│                          • Password: Verify hash                │
│                          • Email: Check cloud permissions       │
│                                                                 │
│  Access granted ──► Join SignalR group with OAuth identity     │
│                 ──► All participants see who's editing          │
└─────────────────────────────────────────────────────────────────┘
```

### Comparison Matrix

| Feature | Anyone with Link | Link + Password | Email-based |
|---------|------------------|-----------------|-------------|
| **Setup complexity** | Lowest | Low | Medium |
| **Recipient needs account** | Any OAuth | Any OAuth | Specific email |
| **Can forward to others** | Yes | Yes (if shared) | No |
| **Revoke access** | Change link | Change password | Remove email |
| **Audit trail** | OAuth identity | OAuth identity | Full cloud audit |
| **Works offline** | Yes | Yes | Depends on cache |
| **Where permissions stored** | In file | In file | Cloud provider |

---

## 2. Anyone with Link

### Overview

The simplest sharing model - anyone who has the link can access the presentation. They must still authenticate via OAuth for identity/accountability.

```
┌─────────────────────────────────────────────────────────────────┐
│  ANYONE WITH LINK                                               │
│                                                                 │
│  1. Owner clicks "Create share link"                            │
│  2. Selects role: Viewer or Editor                              │
│  3. Shares link via any channel (email, chat, etc.)            │
│  4. Recipient clicks link                                       │
│  5. Prompted to sign in (Google/Microsoft)                     │
│  6. Access granted with selected role                           │
│                                                                 │
│  ✅ Simple and fast                                             │
│  ⚠️ Anyone with link can access                                 │
│  ✅ OAuth identity visible to all (accountability)              │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation

```typescript
interface LinkShareConfig {
    mode: 'link';
    role: 'viewer' | 'editor';
    createdAt: string;      // ISO date
    createdBy: {
        id: string;         // OAuth user ID
        email: string;
    };
    expiresAt?: string;     // Optional expiration
}

// Create share link
function createLinkShare(role: 'viewer' | 'editor', expiresAt?: Date): LinkShareConfig {
    return {
        mode: 'link',
        role,
        createdAt: new Date().toISOString(),
        createdBy: {
            id: currentUser.id,
            email: currentUser.email
        },
        expiresAt: expiresAt?.toISOString()
    };
}

// Verify access
function verifyLinkAccess(config: LinkShareConfig): AccessResult {
    // Check expiration
    if (config.expiresAt && new Date(config.expiresAt) < new Date()) {
        return { allowed: false, reason: 'link_expired' };
    }
    
    // Link mode - always allowed (OAuth required for identity)
    return { 
        allowed: true, 
        role: config.role 
    };
}
```

### Share URL Format

```
https://story.app/p/{cloudFileId}

Examples:
- OneDrive: https://story.app/p/onedrive:ABC123XYZ
- Google Drive: https://story.app/p/gdrive:1a2b3c4d5e
```

### Revoking Access

To revoke "anyone with link" access:

1. **Option A**: Disable link sharing in the file
2. **Option B**: Delete and re-upload with new ID
3. **Option C**: Switch to password or email-based mode

```typescript
// Disable link sharing
async function revokePublicLink(): Promise<void> {
    const manifest = await loadManifest();
    
    // Remove or disable sharing config
    manifest.sharing = {
        mode: 'none',
        previousMode: manifest.sharing  // Keep for audit
    };
    
    await saveManifest(manifest);
}
```

---

## 3. Link + Password

### Overview

A balance between convenience and security. Recipients need both the link AND a password to access.

```
┌─────────────────────────────────────────────────────────────────┐
│  LINK + PASSWORD                                                │
│                                                                 │
│  1. Owner creates share link with password                      │
│  2. Owner shares link via one channel (e.g., email)            │
│  3. Owner shares password via different channel (e.g., SMS)    │
│  4. Recipient clicks link                                       │
│  5. Prompted to sign in (OAuth)                                │
│  6. Prompted for password                                       │
│  7. Password verified client-side against hash in file         │
│  8. Access granted                                              │
│                                                                 │
│  ✅ More secure than plain link                                 │
│  ✅ No need to know recipient's email                          │
│  ✅ Password can be changed to revoke access                   │
│  ⚠️ Password can still be shared                               │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation

```typescript
interface PasswordShareConfig {
    mode: 'password';
    role: 'viewer' | 'editor';
    passwordHash: string;   // PBKDF2 hash (base64)
    salt: string;           // Random salt (base64)
    iterations: number;     // PBKDF2 iterations (100000+)
    createdAt: string;
    createdBy: {
        id: string;
        email: string;
    };
    expiresAt?: string;
    hint?: string;          // Optional password hint
}

// Password hashing utilities
class PasswordHasher {
    private static readonly ITERATIONS = 100000;
    private static readonly KEY_LENGTH = 256;
    
    /**
     * Hash a password using PBKDF2 (browser-native crypto)
     */
    static async hash(password: string): Promise<{ hash: string; salt: string }> {
        // Generate random salt
        const salt = crypto.getRandomValues(new Uint8Array(16));
        
        // Import password as key material
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(password),
            'PBKDF2',
            false,
            ['deriveBits']
        );
        
        // Derive hash
        const hashBuffer = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: this.ITERATIONS,
                hash: 'SHA-256'
            },
            keyMaterial,
            this.KEY_LENGTH
        );
        
        return {
            hash: this.arrayBufferToBase64(hashBuffer),
            salt: this.arrayBufferToBase64(salt)
        };
    }
    
    /**
     * Verify a password against stored hash
     */
    static async verify(password: string, storedHash: string, salt: string): Promise<boolean> {
        const saltBuffer = this.base64ToArrayBuffer(salt);
        
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(password),
            'PBKDF2',
            false,
            ['deriveBits']
        );
        
        const hashBuffer = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: saltBuffer,
                iterations: this.ITERATIONS,
                hash: 'SHA-256'
            },
            keyMaterial,
            this.KEY_LENGTH
        );
        
        const computedHash = this.arrayBufferToBase64(hashBuffer);
        return computedHash === storedHash;
    }
    
    private static arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
    
    private static base64ToArrayBuffer(base64: string): Uint8Array {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }
}

// Create password-protected share
async function createPasswordShare(
    password: string, 
    role: 'viewer' | 'editor',
    hint?: string
): Promise<PasswordShareConfig> {
    const { hash, salt } = await PasswordHasher.hash(password);
    
    return {
        mode: 'password',
        role,
        passwordHash: hash,
        salt,
        iterations: 100000,
        createdAt: new Date().toISOString(),
        createdBy: {
            id: currentUser.id,
            email: currentUser.email
        },
        hint
    };
}

// Verify password access
async function verifyPasswordAccess(
    config: PasswordShareConfig, 
    inputPassword: string
): Promise<AccessResult> {
    // Check expiration
    if (config.expiresAt && new Date(config.expiresAt) < new Date()) {
        return { allowed: false, reason: 'link_expired' };
    }
    
    // Verify password
    const isValid = await PasswordHasher.verify(
        inputPassword, 
        config.passwordHash, 
        config.salt
    );
    
    if (!isValid) {
        return { allowed: false, reason: 'invalid_password' };
    }
    
    return { allowed: true, role: config.role };
}
```

### Password Entry UI

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                   🔒 Password Required                          │
│                                                                 │
│     This presentation is password protected.                   │
│                                                                 │
│     ┌─────────────────────────────────────────────────────┐    │
│     │                                           👁️        │    │
│     └─────────────────────────────────────────────────────┘    │
│     Hint: Project code name                                    │
│                                                                 │
│                    [Open Presentation]                          │
│                                                                 │
│     ─────────────────────────────────────────────────────     │
│                                                                 │
│     Don't have the password?                                   │
│     Contact: alice@example.com                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Changing/Revoking Password

```typescript
// Change password (revokes old access)
async function changeSharePassword(newPassword: string): Promise<void> {
    const manifest = await loadManifest();
    const { hash, salt } = await PasswordHasher.hash(newPassword);
    
    manifest.sharing = {
        ...manifest.sharing,
        passwordHash: hash,
        salt,
        modifiedAt: new Date().toISOString()
    };
    
    await saveManifest(manifest);
}

// Remove password protection
async function removePasswordProtection(): Promise<void> {
    const manifest = await loadManifest();
    
    // Switch to link mode or disable
    manifest.sharing = {
        mode: 'link',
        role: manifest.sharing.role,
        createdAt: manifest.sharing.createdAt,
        createdBy: manifest.sharing.createdBy
    };
    
    await saveManifest(manifest);
}
```

---

## 4. Email-based (Cloud Provider)

### Overview

Highest security model using cloud provider's native sharing. Permissions are managed by OneDrive/Google Drive.

```
┌─────────────────────────────────────────────────────────────────┐
│  EMAIL-BASED (CLOUD PROVIDER)                                   │
│                                                                 │
│  1. Owner clicks "Share with people"                            │
│  2. Enters recipient email: bob@example.com                    │
│  3. App calls cloud provider API to share                      │
│  4. Cloud provider sends invitation email                      │
│  5. Bob clicks link in email                                   │
│  6. Bob authenticates with HIS cloud account                   │
│  7. Cloud provider verifies his email matches                  │
│  8. Access granted                                              │
│                                                                 │
│  ✅ Highest security                                            │
│  ✅ Cannot be forwarded (tied to email)                        │
│  ✅ Full audit trail in cloud provider                         │
│  ✅ Easy to revoke (remove from share list)                    │
│  ⚠️ Recipient needs compatible account                         │
└─────────────────────────────────────────────────────────────────┘
```

### OneDrive Implementation

```typescript
class OneDriveSharing {
    private graphClient: Client;
    
    /**
     * Share with specific email addresses
     */
    async shareWithEmails(
        fileId: string, 
        recipients: ShareRecipient[]
    ): Promise<void> {
        await this.graphClient
            .api(`/me/drive/items/${fileId}/invite`)
            .post({
                requireSignIn: true,
                sendInvitation: true,
                roles: this.mapRoles(recipients),
                recipients: recipients.map(r => ({ email: r.email })),
                message: 'You have been invited to collaborate on a Story presentation.'
            });
    }
    
    /**
     * Get current sharing permissions
     */
    async getSharingInfo(fileId: string): Promise<CloudSharingInfo> {
        const item = await this.graphClient
            .api(`/me/drive/items/${fileId}`)
            .expand('permissions')
            .get();
        
        return {
            owner: {
                email: item.createdBy.user.email,
                displayName: item.createdBy.user.displayName
            },
            collaborators: item.permissions
                ?.filter((p: any) => p.grantedTo?.user)
                .map((p: any) => ({
                    email: p.grantedTo.user.email,
                    displayName: p.grantedTo.user.displayName,
                    role: p.roles.includes('write') ? 'editor' : 'viewer',
                    permissionId: p.id
                })) || [],
            linkSharing: this.extractLinkSharing(item.permissions)
        };
    }
    
    /**
     * Remove a collaborator
     */
    async removeCollaborator(fileId: string, permissionId: string): Promise<void> {
        await this.graphClient
            .api(`/me/drive/items/${fileId}/permissions/${permissionId}`)
            .delete();
    }
    
    /**
     * Update collaborator role
     */
    async updateCollaboratorRole(
        fileId: string, 
        permissionId: string, 
        newRole: 'viewer' | 'editor'
    ): Promise<void> {
        await this.graphClient
            .api(`/me/drive/items/${fileId}/permissions/${permissionId}`)
            .patch({
                roles: [newRole === 'editor' ? 'write' : 'read']
            });
    }
    
    private mapRoles(recipients: ShareRecipient[]): string[] {
        // OneDrive uses single role for all recipients in one invite
        const hasEditor = recipients.some(r => r.role === 'editor');
        return hasEditor ? ['write'] : ['read'];
    }
    
    private extractLinkSharing(permissions: any[]): LinkSharingInfo | null {
        const linkPerm = permissions?.find((p: any) => p.link);
        if (!linkPerm) return null;
        
        return {
            enabled: true,
            url: linkPerm.link.webUrl,
            role: linkPerm.roles.includes('write') ? 'editor' : 'viewer',
            type: linkPerm.link.scope // 'anonymous' | 'organization'
        };
    }
}

interface ShareRecipient {
    email: string;
    role: 'viewer' | 'editor';
    message?: string;
}

interface CloudSharingInfo {
    owner: { email: string; displayName: string };
    collaborators: {
        email: string;
        displayName: string;
        role: 'viewer' | 'editor';
        permissionId: string;
    }[];
    linkSharing: LinkSharingInfo | null;
}
```

### Google Drive Implementation

```typescript
class GoogleDriveSharing {
    /**
     * Share with specific email addresses
     */
    async shareWithEmails(
        fileId: string, 
        recipients: ShareRecipient[]
    ): Promise<void> {
        // Google Drive requires individual permission requests
        const batch = gapi.client.newBatch();
        
        for (const recipient of recipients) {
            batch.add(
                gapi.client.drive.permissions.create({
                    fileId,
                    sendNotificationEmail: true,
                    emailMessage: 'You have been invited to collaborate on a Story presentation.',
                    resource: {
                        type: 'user',
                        role: recipient.role === 'editor' ? 'writer' : 'reader',
                        emailAddress: recipient.email
                    }
                }),
                { id: recipient.email }
            );
        }
        
        await batch.execute();
    }
    
    /**
     * Get current sharing permissions
     */
    async getSharingInfo(fileId: string): Promise<CloudSharingInfo> {
        const response = await gapi.client.drive.permissions.list({
            fileId,
            fields: 'permissions(id,type,role,emailAddress,displayName)'
        });
        
        const permissions = response.result.permissions || [];
        
        const owner = permissions.find(p => p.role === 'owner');
        const collaborators = permissions
            .filter(p => p.type === 'user' && p.role !== 'owner')
            .map(p => ({
                email: p.emailAddress,
                displayName: p.displayName,
                role: p.role === 'writer' ? 'editor' : 'viewer',
                permissionId: p.id
            }));
        
        const linkPerm = permissions.find(p => p.type === 'anyone');
        
        return {
            owner: {
                email: owner?.emailAddress || '',
                displayName: owner?.displayName || ''
            },
            collaborators,
            linkSharing: linkPerm ? {
                enabled: true,
                url: `https://drive.google.com/file/d/${fileId}/view`,
                role: linkPerm.role === 'writer' ? 'editor' : 'viewer',
                type: 'anyone'
            } : null
        };
    }
    
    /**
     * Remove a collaborator
     */
    async removeCollaborator(fileId: string, permissionId: string): Promise<void> {
        await gapi.client.drive.permissions.delete({
            fileId,
            permissionId
        });
    }
}
```

---

## 5. Permission Levels

### Role Definitions

| Role | Can View | Can Edit | Can Share | Can Delete |
|------|----------|----------|-----------|------------|
| **Viewer** | ✅ | ❌ | ❌ | ❌ |
| **Editor** | ✅ | ✅ | ❌ | ❌ |
| **Owner** | ✅ | ✅ | ✅ | ✅ |

### Role Capabilities

```typescript
interface RoleCapabilities {
    // Viewing
    canView: boolean;
    canPresent: boolean;
    canExport: boolean;
    
    // Editing
    canEdit: boolean;
    canAddSlides: boolean;
    canDeleteSlides: boolean;
    canEditMasters: boolean;
    
    // Collaboration
    canComment: boolean;
    canResolveComments: boolean;
    
    // Sharing
    canShare: boolean;
    canChangePermissions: boolean;
    canRevokeAccess: boolean;
    
    // Ownership
    canDelete: boolean;
    canTransferOwnership: boolean;
}

const ROLE_CAPABILITIES: Record<string, RoleCapabilities> = {
    viewer: {
        canView: true,
        canPresent: true,
        canExport: true,
        canEdit: false,
        canAddSlides: false,
        canDeleteSlides: false,
        canEditMasters: false,
        canComment: true,
        canResolveComments: false,
        canShare: false,
        canChangePermissions: false,
        canRevokeAccess: false,
        canDelete: false,
        canTransferOwnership: false
    },
    editor: {
        canView: true,
        canPresent: true,
        canExport: true,
        canEdit: true,
        canAddSlides: true,
        canDeleteSlides: true,
        canEditMasters: true,
        canComment: true,
        canResolveComments: true,
        canShare: false,
        canChangePermissions: false,
        canRevokeAccess: false,
        canDelete: false,
        canTransferOwnership: false
    },
    owner: {
        canView: true,
        canPresent: true,
        canExport: true,
        canEdit: true,
        canAddSlides: true,
        canDeleteSlides: true,
        canEditMasters: true,
        canComment: true,
        canResolveComments: true,
        canShare: true,
        canChangePermissions: true,
        canRevokeAccess: true,
        canDelete: true,
        canTransferOwnership: true
    }
};
```

---

## 6. File Manifest Schema

### Sharing Section in manifest.json

```typescript
interface ManifestSharing {
    /**
     * Current sharing mode
     */
    mode: 'none' | 'link' | 'password' | 'cloud';
    
    /**
     * For 'link' and 'password' modes
     */
    linkConfig?: {
        role: 'viewer' | 'editor';
        createdAt: string;
        createdBy: {
            id: string;
            email: string;
        };
        expiresAt?: string;
    };
    
    /**
     * For 'password' mode only
     */
    passwordConfig?: {
        hash: string;       // PBKDF2 hash
        salt: string;       // Random salt
        iterations: number; // 100000+
        hint?: string;      // Optional hint
    };
    
    /**
     * For 'cloud' mode - reference only (actual permissions in cloud)
     */
    cloudConfig?: {
        provider: 'onedrive' | 'google-drive';
        managedExternally: true;
    };
    
    /**
     * Owner information (always present)
     */
    owner: {
        id: string;
        email: string;
        displayName: string;
    };
}
```

### Example Configurations

```javascript
// Anyone with link (viewer)
{
    "sharing": {
        "mode": "link",
        "linkConfig": {
            "role": "viewer",
            "createdAt": "2025-11-28T10:00:00Z",
            "createdBy": {
                "id": "google_123456789",
                "email": "alice@example.com"
            }
        },
        "owner": {
            "id": "google_123456789",
            "email": "alice@example.com",
            "displayName": "Alice Smith"
        }
    }
}

// Password protected (editor)
{
    "sharing": {
        "mode": "password",
        "linkConfig": {
            "role": "editor",
            "createdAt": "2025-11-28T10:00:00Z",
            "createdBy": {
                "id": "microsoft_abc123",
                "email": "alice@company.com"
            }
        },
        "passwordConfig": {
            "hash": "base64_pbkdf2_hash...",
            "salt": "base64_random_salt...",
            "iterations": 100000,
            "hint": "Project code name"
        },
        "owner": {
            "id": "microsoft_abc123",
            "email": "alice@company.com",
            "displayName": "Alice Smith"
        }
    }
}

// Cloud provider managed
{
    "sharing": {
        "mode": "cloud",
        "cloudConfig": {
            "provider": "onedrive",
            "managedExternally": true
        },
        "owner": {
            "id": "microsoft_abc123",
            "email": "alice@company.com",
            "displayName": "Alice Smith"
        }
    }
}
```

---

## 7. Access Verification Flow

### Unified Access Check

```typescript
class AccessVerifier {
    constructor(
        private cloudStorage: CloudStorageProvider,
        private authManager: AuthenticationManager
    ) {}
    
    /**
     * Verify if current user can access the file
     */
    async verifyAccess(
        fileId: string, 
        manifest: Manifest,
        passwordInput?: string
    ): Promise<AccessResult> {
        const currentUser = await this.authManager.getCurrentUser();
        
        if (!currentUser) {
            return { 
                allowed: false, 
                reason: 'not_authenticated',
                action: 'sign_in'
            };
        }
        
        const sharing = manifest.sharing;
        
        // Owner always has full access
        if (sharing.owner.id === currentUser.id) {
            return { allowed: true, role: 'owner' };
        }
        
        switch (sharing.mode) {
            case 'none':
                return this.verifyNoSharing(sharing, currentUser);
                
            case 'link':
                return this.verifyLinkAccess(sharing);
                
            case 'password':
                return this.verifyPasswordAccess(sharing, passwordInput);
                
            case 'cloud':
                return this.verifyCloudAccess(fileId, currentUser);
                
            default:
                return { allowed: false, reason: 'unknown_mode' };
        }
    }
    
    private verifyNoSharing(sharing: ManifestSharing, user: AuthUser): AccessResult {
        // No sharing - only owner can access
        return { 
            allowed: false, 
            reason: 'not_shared',
            ownerEmail: sharing.owner.email
        };
    }
    
    private verifyLinkAccess(sharing: ManifestSharing): AccessResult {
        const config = sharing.linkConfig!;
        
        // Check expiration
        if (config.expiresAt && new Date(config.expiresAt) < new Date()) {
            return { allowed: false, reason: 'link_expired' };
        }
        
        return { allowed: true, role: config.role };
    }
    
    private async verifyPasswordAccess(
        sharing: ManifestSharing, 
        passwordInput?: string
    ): Promise<AccessResult> {
        const config = sharing.linkConfig!;
        const pwConfig = sharing.passwordConfig!;
        
        // Check expiration first
        if (config.expiresAt && new Date(config.expiresAt) < new Date()) {
            return { allowed: false, reason: 'link_expired' };
        }
        
        // No password provided - prompt for it
        if (!passwordInput) {
            return { 
                allowed: false, 
                reason: 'password_required',
                action: 'enter_password',
                hint: pwConfig.hint
            };
        }
        
        // Verify password
        const isValid = await PasswordHasher.verify(
            passwordInput,
            pwConfig.hash,
            pwConfig.salt
        );
        
        if (!isValid) {
            return { allowed: false, reason: 'invalid_password' };
        }
        
        return { allowed: true, role: config.role };
    }
    
    private async verifyCloudAccess(
        fileId: string, 
        user: AuthUser
    ): Promise<AccessResult> {
        try {
            // Try to access via cloud provider
            // If successful, cloud provider has already verified permissions
            const metadata = await this.cloudStorage.getMetadata(fileId);
            
            // Determine role from cloud permissions
            const sharingInfo = await this.cloudStorage.getSharingInfo(fileId);
            const userPerm = sharingInfo.collaborators.find(
                c => c.email.toLowerCase() === user.email.toLowerCase()
            );
            
            if (userPerm) {
                return { allowed: true, role: userPerm.role };
            }
            
            // Check if there's link sharing enabled
            if (sharingInfo.linkSharing?.enabled) {
                return { allowed: true, role: sharingInfo.linkSharing.role };
            }
            
            return { allowed: false, reason: 'no_permission' };
        } catch (error) {
            if (error.status === 403 || error.status === 404) {
                return { allowed: false, reason: 'no_permission' };
            }
            throw error;
        }
    }
}

interface AccessResult {
    allowed: boolean;
    role?: 'viewer' | 'editor' | 'owner';
    reason?: string;
    action?: 'sign_in' | 'enter_password' | 'request_access';
    hint?: string;
    ownerEmail?: string;
}
```

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    ACCESS VERIFICATION FLOW                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User clicks share link                                         │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────────┐                                           │
│  │ Authenticated?  │──No──► Show sign-in prompt                │
│  └────────┬────────┘                                           │
│           │ Yes                                                 │
│           ▼                                                     │
│  ┌─────────────────┐                                           │
│  │ Is owner?       │──Yes──► Full access (owner)               │
│  └────────┬────────┘                                           │
│           │ No                                                  │
│           ▼                                                     │
│  ┌─────────────────┐                                           │
│  │ Sharing mode?   │                                           │
│  └────────┬────────┘                                           │
│           │                                                     │
│     ┌─────┼─────┬──────────┐                                   │
│     ▼     ▼     ▼          ▼                                   │
│   none   link  password   cloud                                │
│     │     │     │          │                                   │
│     ▼     │     ▼          ▼                                   │
│  Denied   │  Password   Cloud API                              │
│           │  prompt      check                                 │
│           │     │          │                                   │
│           ▼     ▼          ▼                                   │
│       Access granted with role                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Share Dialog UI

### Main Share Dialog

```
┌─────────────────────────────────────────────────────────────────┐
│ Share "Marketing Presentation"                            [×]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 👤 Add people by email                                  │   │
│  │ ┌─────────────────────────────────────────────────────┐ │   │
│  │ │ Enter email addresses...                            │ │   │
│  │ └─────────────────────────────────────────────────────┘ │   │
│  │                                          [Invite]       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  People with access                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 👤 Alice Smith (you)                           Owner    │   │
│  │    alice@example.com                                    │   │
│  │                                                         │   │
│  │ 👤 Bob Johnson                          [Editor ▼] [×]  │   │
│  │    bob@example.com                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  🔗 Get shareable link                                         │
│                                                                 │
│  Access level:                                                  │
│  ○ Anyone with the link can view                               │
│  ○ Anyone with the link can edit                               │
│  ● Require password                                             │
│                                                                 │
│    Password: [••••••••••••]  [👁️]                              │
│    Hint:     [Project code  ]  (optional)                      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ https://story.app/p/abc123xyz              [Copy] 📋   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Link expires: [Never ▼]                                       │
│                                                                 │
│                                               [Done]            │
└─────────────────────────────────────────────────────────────────┘
```

### Access Denied Screen

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                      🚫 Access Denied                           │
│                                                                 │
│     You don't have permission to view this presentation.       │
│                                                                 │
│     ┌─────────────────────────────────────────────────────┐    │
│     │ 👤 Signed in as: bob@example.com                    │    │
│     │    [Sign in with a different account]               │    │
│     └─────────────────────────────────────────────────────┘    │
│                                                                 │
│                           ─ or ─                               │
│                                                                 │
│     ┌─────────────────────────────────────────────────────┐    │
│     │              [Request Access]                        │    │
│     └─────────────────────────────────────────────────────┘    │
│                                                                 │
│     This will send a request to: alice@example.com             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Password Entry Screen

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                   🔒 Password Required                          │
│                                                                 │
│     "Marketing Presentation" is password protected.           │
│                                                                 │
│     ┌─────────────────────────────────────────────────────┐    │
│     │                                              👁️     │    │
│     └─────────────────────────────────────────────────────┘    │
│     💡 Hint: Project code name                                 │
│                                                                 │
│                    [Open Presentation]                          │
│                                                                 │
│     ─────────────────────────────────────────────────────     │
│                                                                 │
│     Don't know the password?                                   │
│     Contact owner: alice@example.com                           │
│                                                                 │
│     ┌─────────────────────────────────────────────────────┐    │
│     │ 👤 Signed in as: bob@example.com                    │    │
│     └─────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Security Considerations

### Password Security

```typescript
// Password requirements
const PASSWORD_REQUIREMENTS = {
    minLength: 8,
    maxLength: 128,
    requireUppercase: false,  // Keep simple for sharing passwords
    requireNumber: false,
    requireSpecial: false
};

// PBKDF2 parameters
const PBKDF2_CONFIG = {
    iterations: 100000,      // Minimum recommended
    keyLength: 256,          // bits
    hash: 'SHA-256'
};

// Never store plaintext passwords
// Never transmit passwords over network (client-side only)
// Use constant-time comparison to prevent timing attacks
```

### Link Security

```typescript
// URL security measures
const LINK_SECURITY = {
    // Use random IDs, not sequential
    idGeneration: 'crypto.randomUUID()',
    
    // HTTPS only
    protocol: 'https',
    
    // Short-lived links option
    defaultExpiration: null,  // Never (user chooses)
    expirationOptions: ['1 hour', '1 day', '7 days', '30 days', 'Never'],
    
    // Rate limiting (in cloud provider)
    maxRequestsPerMinute: 60
};
```

### Audit Trail

```typescript
// Track access for security
interface AccessLog {
    timestamp: string;
    userId: string;
    userEmail: string;
    action: 'view' | 'edit' | 'share' | 'password_attempt';
    success: boolean;
    ipAddress?: string;  // If available
    userAgent?: string;
}

// Store in localStorage (client-side only)
// Owner can export for review
function logAccess(action: AccessLog['action'], success: boolean): void {
    const log: AccessLog = {
        timestamp: new Date().toISOString(),
        userId: currentUser?.id || 'anonymous',
        userEmail: currentUser?.email || 'unknown',
        action,
        success
    };
    
    const logs = JSON.parse(localStorage.getItem('story:access-logs') || '[]');
    logs.push(log);
    
    // Keep last 1000 entries
    localStorage.setItem('story:access-logs', JSON.stringify(logs.slice(-1000)));
}
```

### Best Practices

| Practice | Implementation |
|----------|----------------|
| **OAuth required** | All users must authenticate before accessing |
| **Identity visible** | All participants see each other's OAuth identity |
| **Password hashing** | PBKDF2 with 100k+ iterations |
| **No plaintext** | Passwords never stored or transmitted in clear |
| **Client-side verification** | Password check happens in browser |
| **Expiration support** | Links can have time limits |
| **Easy revocation** | Change password or remove access anytime |

---

## Related Documents

- [Authentication](./authentication.md) - OAuth providers
- [Cloud Storage Abstraction](./cloud-storage-abstraction.md) - Storage APIs
- [Collaboration Protocol](./collaboration-protocol.md) - Real-time messaging
- [Real-Time Collaboration](./realtime-collaboration.md) - Architecture overview
- [Security Model](./security-model.md) - Security architecture

---

*All sharing models work without a server database. Security is maintained through OAuth identity, client-side verification, and cloud provider infrastructure.*
