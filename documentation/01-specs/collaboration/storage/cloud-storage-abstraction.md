# Cloud Storage Abstraction - Specification

## Overview

This specification defines the unified abstraction layer for cloud storage providers (OneDrive, Google Drive, future providers). The abstraction ensures consistent behavior regardless of backend while exposing provider-specific capabilities where beneficial.

**Design Goals:**
- Unified API for all storage operations
- Provider-agnostic file operations
- Graceful handling of provider differences
- Consistent error taxonomy
- Ownership and quota transparency

**Related Specifications:**
- [File Format & Storage](./file-format-storage.md) - .str file format
- [Collaborative Save Protocol](./collaborative-save-protocol.md) - Multi-user saves
- [Large File Handling](./large-file-handling.md) - Chunked transfers

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Provider Abstraction Interface](#2-provider-abstraction-interface)
3. [Authentication](#3-authentication)
4. [File Operations](#4-file-operations)
5. [Folder Operations](#5-folder-operations)
6. [Sharing & Permissions](#6-sharing--permissions)
7. [Ownership & Quota](#7-ownership--quota)
8. [Sync & Conflict Resolution](#8-sync--conflict-resolution)
9. [Provider-Specific Features](#9-provider-specific-features)
10. [Error Handling](#10-error-handling)
11. [Implementation](#11-implementation)

---

## 1. Architecture Overview

### 1.1 Abstraction Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Story Application                             │
├─────────────────────────────────────────────────────────────────────┤
│                    StorageManager (Unified API)                      │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐        │
│  │ save()         │  │ load()         │  │ share()        │        │
│  │ delete()       │  │ list()         │  │ getQuota()     │        │
│  │ copy()         │  │ move()         │  │ setPermission()│        │
│  └────────────────┘  └────────────────┘  └────────────────┘        │
├─────────────────────────────────────────────────────────────────────┤
│                  CloudStorageAbstraction                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                   IStorageProvider Interface                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│           │                     │                     │             │
│           ▼                     ▼                     ▼             │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐   │
│  │ OneDriveProvider│   │ GoogleDriveProvider│ │ FutureProvider │   │
│  │                 │   │                   │   │                │   │
│  │ • Graph API     │   │ • Drive API v3    │   │ • Custom API   │   │
│  │ • MSAL Auth     │   │ • OAuth2          │   │ • TBD          │   │
│  └─────────────────┘   └─────────────────┘   └─────────────────┘   │
│           │                     │                     │             │
└───────────│─────────────────────│─────────────────────│─────────────┘
            ▼                     ▼                     ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   OneDrive      │     │   Google Drive  │     │   Future        │
│   (Microsoft)   │     │   (Google)      │     │   Provider      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 1.2 Provider Comparison

| Feature | OneDrive | Google Drive | Notes |
|---------|----------|--------------|-------|
| **Max file size** | 250 GB | 5 TB | Both exceed our needs |
| **Resumable upload** | ✅ createUploadSession | ✅ Resumable upload | Similar approach |
| **Byte-range download** | ✅ Range header | ✅ Range header | Identical |
| **Real-time sync** | ✅ delta API | ✅ Changes API | Similar patterns |
| **Sharing** | ✅ Invite/link | ✅ Permissions | Slightly different models |
| **Versioning** | ✅ Version history | ✅ Revisions | Similar |
| **Trash** | ✅ Recycle bin | ✅ Trash | Similar |
| **Webhooks** | ✅ Subscriptions | ✅ Push notifications | Different setup |

---

## 2. Provider Abstraction Interface

### 2.1 Core Interface

```typescript
/**
 * Unified interface all storage providers must implement
 */
interface IStorageProvider {
    // Identity
    readonly providerType: 'onedrive' | 'google-drive' | 'dropbox' | 'local';
    readonly displayName: string;
    
    // Authentication
    authenticate(): Promise<AuthResult>;
    refreshToken(): Promise<AuthResult>;
    signOut(): Promise<void>;
    isAuthenticated(): boolean;
    
    // File operations
    uploadFile(options: UploadOptions): Promise<FileMetadata>;
    downloadFile(fileId: string, options?: DownloadOptions): Promise<Blob>;
    deleteFile(fileId: string): Promise<void>;
    copyFile(fileId: string, destinationFolderId: string, newName?: string): Promise<FileMetadata>;
    moveFile(fileId: string, destinationFolderId: string): Promise<FileMetadata>;
    renameFile(fileId: string, newName: string): Promise<FileMetadata>;
    
    // Folder operations
    createFolder(name: string, parentId?: string): Promise<FolderMetadata>;
    listFolder(folderId: string, options?: ListOptions): Promise<ListResult>;
    deleteFolder(folderId: string): Promise<void>;
    
    // Metadata
    getMetadata(fileId: string): Promise<FileMetadata>;
    updateMetadata(fileId: string, metadata: Partial<FileMetadata>): Promise<FileMetadata>;
    
    // Sharing
    shareFile(fileId: string, options: ShareOptions): Promise<ShareLink>;
    getSharedWith(fileId: string): Promise<Permission[]>;
    updatePermission(fileId: string, permissionId: string, role: PermissionRole): Promise<void>;
    revokePermission(fileId: string, permissionId: string): Promise<void>;
    
    // Quota & ownership
    getQuota(): Promise<QuotaInfo>;
    getOwnership(fileId: string): Promise<OwnershipInfo>;
    transferOwnership(fileId: string, newOwnerId: string): Promise<void>;
    
    // Sync
    getChanges(cursor?: string): Promise<ChangeSet>;
    watchFile(fileId: string, callback: ChangeCallback): Unsubscribe;
    
    // Versioning
    getVersions(fileId: string): Promise<FileVersion[]>;
    restoreVersion(fileId: string, versionId: string): Promise<FileMetadata>;
    
    // Trash
    trashFile(fileId: string): Promise<void>;
    restoreFromTrash(fileId: string): Promise<FileMetadata>;
    emptyTrash(): Promise<void>;
    
    // Special
    getDownloadUrl(fileId: string): Promise<string>;
    getByteRange(fileId: string, start: number, end: number): Promise<ArrayBuffer>;
}
```

### 2.2 Type Definitions

```typescript
interface AuthResult {
    success: boolean;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    user?: UserInfo;
    error?: AuthError;
}

interface UserInfo {
    id: string;
    email: string;
    name: string;
    photoUrl?: string;
}

interface FileMetadata {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    
    createdAt: string;       // ISO 8601
    modifiedAt: string;      // ISO 8601
    
    parentId: string;
    path: string;            // Full path from root
    
    owner: UserInfo;
    lastModifiedBy?: UserInfo;
    
    // Provider-specific
    providerFileId: string;  // Raw ID from provider
    webUrl?: string;         // Link to view in web UI
    downloadUrl?: string;    // Direct download link (may expire)
    
    // Versioning
    version: string;
    etag?: string;
    
    // Hashes
    sha256?: string;
    quickXorHash?: string;   // OneDrive-specific
    md5Checksum?: string;    // Google Drive-specific
    
    // Collaboration
    isShared: boolean;
    permissions?: Permission[];
}

interface UploadOptions {
    file: File | Blob;
    filename: string;
    parentFolderId?: string;
    mimeType?: string;
    
    // Resumable upload
    resumable?: boolean;
    sessionId?: string;      // For resume
    
    // Conflict handling
    conflictBehavior?: 'fail' | 'replace' | 'rename';
    
    // Progress
    onProgress?: (progress: UploadProgress) => void;
    
    // Cancellation
    signal?: AbortSignal;
}

interface DownloadOptions {
    // Byte range for partial download
    rangeStart?: number;
    rangeEnd?: number;
    
    // Stream to OPFS instead of memory
    streamToOPFS?: boolean;
    opfsPath?: string;
    
    // Progress
    onProgress?: (progress: DownloadProgress) => void;
    
    // Cancellation
    signal?: AbortSignal;
}

interface ShareOptions {
    type: 'view' | 'edit' | 'comment';
    
    // Invite specific people
    recipients?: string[];   // Email addresses
    message?: string;
    
    // Create anonymous link
    createLink?: boolean;
    linkType?: 'anyone' | 'organization' | 'specific';
    
    // Expiration
    expiresAt?: string;      // ISO 8601
    
    // Password protection (if supported)
    password?: string;
}

interface ShareLink {
    url: string;
    type: 'view' | 'edit';
    expiresAt?: string;
    password?: boolean;
}

interface Permission {
    id: string;
    type: 'user' | 'group' | 'anyone' | 'organization';
    role: PermissionRole;
    
    // For user/group types
    email?: string;
    name?: string;
    
    // Link info (for link types)
    link?: {
        url: string;
        type: 'view' | 'edit';
    };
}

type PermissionRole = 'owner' | 'editor' | 'commenter' | 'viewer';

interface QuotaInfo {
    used: number;           // Bytes used
    total: number;          // Total quota in bytes
    remaining: number;      // Available bytes
    percentUsed: number;    // 0-100
    
    // Breakdown (if available)
    breakdown?: {
        files: number;
        trash: number;
        other: number;
    };
}

interface OwnershipInfo {
    ownerId: string;
    ownerEmail: string;
    ownerName: string;
    
    // Does this count against my quota?
    countsAgainstMyQuota: boolean;
    
    // Can ownership be transferred?
    transferable: boolean;
}

interface ChangeSet {
    changes: Change[];
    cursor: string;         // For getting next changes
    hasMore: boolean;
}

interface Change {
    type: 'created' | 'modified' | 'deleted' | 'renamed' | 'moved';
    fileId: string;
    file?: FileMetadata;
    timestamp: string;
}

interface FileVersion {
    id: string;
    version: string;
    size: number;
    modifiedAt: string;
    modifiedBy: UserInfo;
    isCurrent: boolean;
}
```

---

## 3. Authentication

### 3.1 Authentication Flow

```typescript
class AuthenticationManager {
    private providers: Map<string, IStorageProvider> = new Map();
    private activeProvider: IStorageProvider | null = null;
    
    /**
     * Register available providers
     */
    registerProvider(provider: IStorageProvider): void {
        this.providers.set(provider.providerType, provider);
    }
    
    /**
     * Authenticate with a specific provider
     */
    async authenticate(providerType: string): Promise<AuthResult> {
        const provider = this.providers.get(providerType);
        if (!provider) {
            throw new Error(`Unknown provider: ${providerType}`);
        }
        
        const result = await provider.authenticate();
        
        if (result.success) {
            this.activeProvider = provider;
            
            // Store tokens securely
            await this.secureStorage.set(`auth:${providerType}`, {
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                expiresAt: result.expiresAt,
                user: result.user
            });
            
            // Emit auth event
            this.emit('authenticated', {
                provider: providerType,
                user: result.user
            });
        }
        
        return result;
    }
    
    /**
     * Restore session from stored tokens
     */
    async restoreSession(): Promise<boolean> {
        for (const [providerType, provider] of this.providers) {
            const stored = await this.secureStorage.get(`auth:${providerType}`);
            
            if (stored && stored.expiresAt > Date.now()) {
                // Token still valid
                this.activeProvider = provider;
                return true;
            } else if (stored?.refreshToken) {
                // Try refresh
                try {
                    const result = await provider.refreshToken();
                    if (result.success) {
                        this.activeProvider = provider;
                        return true;
                    }
                } catch (e) {
                    console.warn('Token refresh failed:', e);
                }
            }
        }
        
        return false;
    }
    
    /**
     * Sign out from active provider
     */
    async signOut(): Promise<void> {
        if (this.activeProvider) {
            const providerType = this.activeProvider.providerType;
            await this.activeProvider.signOut();
            await this.secureStorage.delete(`auth:${providerType}`);
            this.activeProvider = null;
            
            this.emit('signedOut', { provider: providerType });
        }
    }
}
```

### 3.2 Token Management

```typescript
class TokenManager {
    private readonly TOKEN_REFRESH_MARGIN = 5 * 60 * 1000; // 5 minutes
    
    /**
     * Check if token needs refresh
     */
    needsRefresh(expiresAt: number): boolean {
        return Date.now() + this.TOKEN_REFRESH_MARGIN >= expiresAt;
    }
    
    /**
     * Auto-refresh tokens before expiry
     */
    startAutoRefresh(provider: IStorageProvider, expiresAt: number): void {
        const refreshTime = expiresAt - this.TOKEN_REFRESH_MARGIN;
        const delay = Math.max(0, refreshTime - Date.now());
        
        setTimeout(async () => {
            try {
                const result = await provider.refreshToken();
                if (result.success && result.expiresAt) {
                    this.startAutoRefresh(provider, result.expiresAt);
                }
            } catch (e) {
                console.error('Auto token refresh failed:', e);
                this.emit('tokenRefreshFailed', { provider: provider.providerType });
            }
        }, delay);
    }
}
```

---

## 4. File Operations

### 4.1 Unified Upload

```typescript
class StorageManager {
    private provider: IStorageProvider;
    
    /**
     * Upload file with unified handling
     */
    async uploadFile(options: UploadOptions): Promise<FileMetadata> {
        const { file, filename } = options;
        
        // Validate file size
        const maxSize = await this.getMaxFileSize();
        if (file.size > maxSize) {
            throw new StorageError(
                'FILE_TOO_LARGE',
                `File exceeds maximum size of ${this.formatBytes(maxSize)}`
            );
        }
        
        // Check quota before upload
        const quota = await this.provider.getQuota();
        if (file.size > quota.remaining) {
            throw new StorageError(
                'QUOTA_EXCEEDED',
                'Insufficient storage quota'
            );
        }
        
        // Use resumable upload for large files
        const useResumable = file.size > 10 * 1024 * 1024; // 10 MB
        
        try {
            if (useResumable) {
                return await this.resumableUpload(options);
            } else {
                return await this.simpleUpload(options);
            }
        } catch (error) {
            // Handle conflict
            if (error.code === 'CONFLICT' && options.conflictBehavior === 'rename') {
                const newName = this.generateUniqueName(filename);
                return await this.uploadFile({ ...options, filename: newName });
            }
            throw error;
        }
    }
    
    /**
     * Simple upload for small files
     */
    private async simpleUpload(options: UploadOptions): Promise<FileMetadata> {
        return await this.provider.uploadFile({
            ...options,
            resumable: false
        });
    }
    
    /**
     * Resumable upload for large files
     */
    private async resumableUpload(options: UploadOptions): Promise<FileMetadata> {
        // Store session for resume capability
        const session = await this.createUploadSession(options);
        
        try {
            // Upload in chunks
            const chunkSize = 5 * 1024 * 1024; // 5 MB
            let offset = 0;
            
            while (offset < options.file.size) {
                const chunk = options.file.slice(offset, offset + chunkSize);
                
                await this.uploadChunk(session, chunk, offset);
                offset += chunk.size;
                
                options.onProgress?.({
                    bytesUploaded: offset,
                    bytesTotal: options.file.size,
                    percentage: (offset / options.file.size) * 100
                });
            }
            
            // Complete upload
            const result = await this.completeUpload(session);
            
            // Clear session
            await this.clearUploadSession(session.id);
            
            return result;
            
        } catch (error) {
            // Store session for potential resume
            await this.persistUploadSession(session, offset);
            throw error;
        }
    }
}
```

### 4.2 Unified Download

```typescript
class StorageManager {
    /**
     * Download file with unified handling
     */
    async downloadFile(
        fileId: string, 
        options: DownloadOptions = {}
    ): Promise<Blob> {
        const metadata = await this.provider.getMetadata(fileId);
        
        // Byte-range download for large files
        if (options.rangeStart !== undefined || options.rangeEnd !== undefined) {
            const data = await this.provider.getByteRange(
                fileId,
                options.rangeStart ?? 0,
                options.rangeEnd ?? metadata.size - 1
            );
            return new Blob([data]);
        }
        
        // Stream to OPFS for very large files
        if (options.streamToOPFS && metadata.size > 100 * 1024 * 1024) {
            return await this.streamToOPFS(fileId, options);
        }
        
        // Regular download
        return await this.provider.downloadFile(fileId, options);
    }
    
    /**
     * Stream large file directly to OPFS
     */
    private async streamToOPFS(
        fileId: string, 
        options: DownloadOptions
    ): Promise<Blob> {
        const url = await this.provider.getDownloadUrl(fileId);
        const opfsRoot = await navigator.storage.getDirectory();
        const fileHandle = await opfsRoot.getFileHandle(
            options.opfsPath || `download-${fileId}`,
            { create: true }
        );
        
        const writable = await fileHandle.createWritable();
        
        const response = await fetch(url, { signal: options.signal });
        const reader = response.body!.getReader();
        const contentLength = parseInt(response.headers.get('Content-Length') || '0');
        
        let receivedBytes = 0;
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            await writable.write(value);
            receivedBytes += value.length;
            
            options.onProgress?.({
                bytesDownloaded: receivedBytes,
                bytesTotal: contentLength,
                percentage: contentLength ? (receivedBytes / contentLength) * 100 : 0
            });
        }
        
        await writable.close();
        
        return await fileHandle.getFile();
    }
}
```

---

## 5. Folder Operations

### 5.1 Folder Management

```typescript
class StorageManager {
    /**
     * Create folder with path support
     */
    async createFolderPath(path: string): Promise<FolderMetadata> {
        const parts = path.split('/').filter(p => p);
        let parentId: string | undefined;
        let currentFolder: FolderMetadata | undefined;
        
        for (const folderName of parts) {
            // Check if folder exists
            const existing = await this.findFolder(folderName, parentId);
            
            if (existing) {
                currentFolder = existing;
                parentId = existing.id;
            } else {
                // Create folder
                currentFolder = await this.provider.createFolder(folderName, parentId);
                parentId = currentFolder.id;
            }
        }
        
        return currentFolder!;
    }
    
    /**
     * List folder with pagination
     */
    async listFolderComplete(folderId: string): Promise<(FileMetadata | FolderMetadata)[]> {
        const items: (FileMetadata | FolderMetadata)[] = [];
        let cursor: string | undefined;
        
        do {
            const result = await this.provider.listFolder(folderId, { cursor });
            items.push(...result.items);
            cursor = result.hasMore ? result.cursor : undefined;
        } while (cursor);
        
        return items;
    }
    
    /**
     * Find folder by name
     */
    private async findFolder(
        name: string, 
        parentId?: string
    ): Promise<FolderMetadata | null> {
        const result = await this.provider.listFolder(
            parentId || 'root',
            { filter: 'folders' }
        );
        
        return result.items.find(
            item => item.name.toLowerCase() === name.toLowerCase()
        ) as FolderMetadata || null;
    }
}
```

---

## 6. Sharing & Permissions

### 6.1 Unified Sharing Model

```typescript
class SharingManager {
    private provider: IStorageProvider;
    
    /**
     * Share file with people
     */
    async shareWithPeople(
        fileId: string,
        emails: string[],
        role: PermissionRole,
        message?: string
    ): Promise<void> {
        await this.provider.shareFile(fileId, {
            type: role === 'viewer' ? 'view' : 'edit',
            recipients: emails,
            message
        });
        
        // Notify via collaboration service
        await this.collaborationService.notifyInvite(fileId, emails, role);
    }
    
    /**
     * Create shareable link
     */
    async createShareLink(
        fileId: string,
        options: {
            type: 'view' | 'edit';
            expiresIn?: number;  // milliseconds
            password?: string;
        }
    ): Promise<ShareLink> {
        const expiresAt = options.expiresIn 
            ? new Date(Date.now() + options.expiresIn).toISOString()
            : undefined;
        
        return await this.provider.shareFile(fileId, {
            type: options.type,
            createLink: true,
            linkType: 'anyone',
            expiresAt,
            password: options.password
        });
    }
    
    /**
     * Get all people who have access
     */
    async getCollaborators(fileId: string): Promise<Collaborator[]> {
        const permissions = await this.provider.getSharedWith(fileId);
        
        return permissions
            .filter(p => p.type === 'user')
            .map(p => ({
                email: p.email!,
                name: p.name,
                role: p.role,
                permissionId: p.id
            }));
    }
    
    /**
     * Change someone's access level
     */
    async updateAccess(
        fileId: string,
        email: string,
        newRole: PermissionRole
    ): Promise<void> {
        const permissions = await this.provider.getSharedWith(fileId);
        const permission = permissions.find(p => p.email === email);
        
        if (!permission) {
            throw new Error(`No permission found for ${email}`);
        }
        
        if (newRole === 'owner') {
            await this.provider.transferOwnership(fileId, permission.id);
        } else {
            await this.provider.updatePermission(fileId, permission.id, newRole);
        }
    }
    
    /**
     * Remove someone's access
     */
    async removeAccess(fileId: string, email: string): Promise<void> {
        const permissions = await this.provider.getSharedWith(fileId);
        const permission = permissions.find(p => p.email === email);
        
        if (permission) {
            await this.provider.revokePermission(fileId, permission.id);
        }
    }
}
```

### 6.2 Permission Normalization

```typescript
/**
 * Normalize permissions across providers
 */
function normalizePermission(
    providerPermission: any,
    providerType: string
): Permission {
    if (providerType === 'onedrive') {
        return {
            id: providerPermission.id,
            type: providerPermission.grantedTo?.user ? 'user' : 
                  providerPermission.grantedToIdentities ? 'group' :
                  providerPermission.link ? 'anyone' : 'unknown',
            role: mapOneDriveRole(providerPermission.roles?.[0]),
            email: providerPermission.grantedTo?.user?.email,
            name: providerPermission.grantedTo?.user?.displayName,
            link: providerPermission.link ? {
                url: providerPermission.link.webUrl,
                type: providerPermission.link.type === 'view' ? 'view' : 'edit'
            } : undefined
        };
    }
    
    if (providerType === 'google-drive') {
        return {
            id: providerPermission.id,
            type: providerPermission.type,
            role: mapGoogleRole(providerPermission.role),
            email: providerPermission.emailAddress,
            name: providerPermission.displayName,
            link: providerPermission.type === 'anyone' ? {
                url: `https://drive.google.com/file/d/${providerPermission.fileId}`,
                type: providerPermission.role === 'reader' ? 'view' : 'edit'
            } : undefined
        };
    }
    
    throw new Error(`Unknown provider: ${providerType}`);
}

function mapOneDriveRole(role: string): PermissionRole {
    switch (role) {
        case 'owner': return 'owner';
        case 'write': return 'editor';
        case 'read': return 'viewer';
        default: return 'viewer';
    }
}

function mapGoogleRole(role: string): PermissionRole {
    switch (role) {
        case 'owner': return 'owner';
        case 'organizer':
        case 'fileOrganizer':
        case 'writer': return 'editor';
        case 'commenter': return 'commenter';
        case 'reader': return 'viewer';
        default: return 'viewer';
    }
}
```

---

## 7. Ownership & Quota

### 7.1 Ownership Model

The file owner is the only user whose storage quota is used. Collaborators can access and edit without using their quota.

```typescript
interface OwnershipModel {
    /**
     * Only the owner's quota is affected
     */
    ownerEmail: string;
    ownerId: string;
    
    /**
     * Collaborators access via sharing, not quota
     */
    collaborators: CollaboratorInfo[];
    
    /**
     * File counts toward owner's quota
     */
    quotaUsage: {
        bytes: number;
        countedInOwnerQuota: true;
    };
}

class OwnershipManager {
    /**
     * Get ownership info for a file
     */
    async getOwnership(fileId: string): Promise<OwnershipInfo> {
        const metadata = await this.provider.getMetadata(fileId);
        const currentUser = await this.getCurrentUser();
        
        return {
            ownerId: metadata.owner.id,
            ownerEmail: metadata.owner.email,
            ownerName: metadata.owner.name,
            countsAgainstMyQuota: metadata.owner.id === currentUser.id,
            transferable: metadata.owner.id === currentUser.id
        };
    }
    
    /**
     * Transfer ownership to another user
     * Note: Quota moves with ownership
     */
    async transferOwnership(fileId: string, newOwnerEmail: string): Promise<void> {
        // Verify current user is owner
        const ownership = await this.getOwnership(fileId);
        const currentUser = await this.getCurrentUser();
        
        if (ownership.ownerId !== currentUser.id) {
            throw new StorageError(
                'NOT_OWNER',
                'Only the owner can transfer ownership'
            );
        }
        
        // Transfer
        await this.provider.transferOwnership(fileId, newOwnerEmail);
        
        // Notify new owner
        await this.notificationService.notifyOwnershipTransfer(fileId, newOwnerEmail);
    }
    
    /**
     * Check if user is the owner
     */
    async isOwner(fileId: string): Promise<boolean> {
        const ownership = await this.getOwnership(fileId);
        const currentUser = await this.getCurrentUser();
        return ownership.ownerId === currentUser.id;
    }
}
```

### 7.2 Quota Management

```typescript
class QuotaManager {
    /**
     * Get quota across all connected providers
     */
    async getAllQuotas(): Promise<Map<string, QuotaInfo>> {
        const quotas = new Map<string, QuotaInfo>();
        
        for (const provider of this.providers.values()) {
            if (provider.isAuthenticated()) {
                quotas.set(provider.providerType, await provider.getQuota());
            }
        }
        
        return quotas;
    }
    
    /**
     * Check if enough space exists for an operation
     */
    async hasSpace(
        providerType: string,
        requiredBytes: number
    ): Promise<boolean> {
        const provider = this.getProvider(providerType);
        const quota = await provider.getQuota();
        return quota.remaining >= requiredBytes;
    }
    
    /**
     * Estimate quota impact of a file
     * (For shared files, only owner is affected)
     */
    async estimateQuotaImpact(
        fileId: string,
        newSizeBytes: number
    ): Promise<QuotaImpact> {
        const ownership = await this.getOwnership(fileId);
        const currentUser = await this.getCurrentUser();
        
        if (ownership.ownerId !== currentUser.id) {
            // Not owner - no impact on our quota
            return {
                impactsMyQuota: false,
                bytesAdded: 0,
                ownerEmail: ownership.ownerEmail
            };
        }
        
        const currentMetadata = await this.provider.getMetadata(fileId);
        const bytesAdded = newSizeBytes - currentMetadata.size;
        
        return {
            impactsMyQuota: true,
            bytesAdded,
            ownerEmail: ownership.ownerEmail
        };
    }
    
    /**
     * Show quota warning if low
     */
    async checkQuotaWarning(): Promise<QuotaWarning | null> {
        const quota = await this.provider.getQuota();
        
        if (quota.percentUsed >= 95) {
            return {
                level: 'critical',
                message: 'Storage almost full. Delete files or upgrade storage.',
                percentUsed: quota.percentUsed,
                remaining: quota.remaining
            };
        }
        
        if (quota.percentUsed >= 80) {
            return {
                level: 'warning',
                message: 'Storage is getting full.',
                percentUsed: quota.percentUsed,
                remaining: quota.remaining
            };
        }
        
        return null;
    }
}
```

---

## 8. Sync & Conflict Resolution

### 8.1 Change Tracking

```typescript
class SyncManager {
    private lastCursor: string | null = null;
    private syncInterval: NodeJS.Timer | null = null;
    
    /**
     * Start periodic sync
     */
    startSync(intervalMs: number = 30000): void {
        this.syncInterval = setInterval(() => this.sync(), intervalMs);
        this.sync(); // Initial sync
    }
    
    /**
     * Stop sync
     */
    stopSync(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }
    
    /**
     * Sync changes from cloud
     */
    async sync(): Promise<ChangeSet> {
        const changes = await this.provider.getChanges(this.lastCursor || undefined);
        
        for (const change of changes.changes) {
            await this.processChange(change);
        }
        
        this.lastCursor = changes.cursor;
        return changes;
    }
    
    /**
     * Process a single change
     */
    private async processChange(change: Change): Promise<void> {
        switch (change.type) {
            case 'created':
            case 'modified':
                this.emit('fileChanged', change);
                break;
            case 'deleted':
                this.emit('fileDeleted', change);
                break;
            case 'renamed':
                this.emit('fileRenamed', change);
                break;
            case 'moved':
                this.emit('fileMoved', change);
                break;
        }
    }
    
    /**
     * Watch specific file for changes
     */
    watchFile(fileId: string, callback: (change: Change) => void): Unsubscribe {
        return this.provider.watchFile(fileId, callback);
    }
}
```

### 8.2 Conflict Resolution

```typescript
enum ConflictResolution {
    KEEP_LOCAL = 'keep-local',
    KEEP_REMOTE = 'keep-remote',
    KEEP_BOTH = 'keep-both',
    MERGE = 'merge'
}

interface ConflictInfo {
    fileId: string;
    localVersion: FileVersion;
    remoteVersion: FileVersion;
    localModifiedAt: string;
    remoteModifiedAt: string;
    localModifiedBy: UserInfo;
    remoteModifiedBy: UserInfo;
}

class ConflictResolver {
    /**
     * Detect if conflict exists
     */
    async detectConflict(
        fileId: string,
        localEtag: string
    ): Promise<ConflictInfo | null> {
        const remote = await this.provider.getMetadata(fileId);
        
        if (remote.etag !== localEtag) {
            return {
                fileId,
                localVersion: await this.getLocalVersion(fileId),
                remoteVersion: await this.getVersionInfo(remote),
                localModifiedAt: this.localState.getModifiedAt(fileId),
                remoteModifiedAt: remote.modifiedAt,
                localModifiedBy: this.currentUser,
                remoteModifiedBy: remote.lastModifiedBy!
            };
        }
        
        return null;
    }
    
    /**
     * Resolve conflict based on strategy
     */
    async resolveConflict(
        conflict: ConflictInfo,
        resolution: ConflictResolution
    ): Promise<void> {
        switch (resolution) {
            case ConflictResolution.KEEP_LOCAL:
                // Force upload local version
                await this.forceUpload(conflict.fileId);
                break;
                
            case ConflictResolution.KEEP_REMOTE:
                // Discard local changes, reload remote
                await this.discardLocal(conflict.fileId);
                await this.reloadFromRemote(conflict.fileId);
                break;
                
            case ConflictResolution.KEEP_BOTH:
                // Create a copy of local version
                const copyName = this.generateConflictName(conflict);
                await this.saveAsCopy(conflict.fileId, copyName);
                await this.reloadFromRemote(conflict.fileId);
                break;
                
            case ConflictResolution.MERGE:
                // Attempt automatic merge (for supported file types)
                await this.attemptMerge(conflict);
                break;
        }
    }
    
    /**
     * Generate conflict copy name
     */
    private generateConflictName(conflict: ConflictInfo): string {
        const original = this.getFileName(conflict.fileId);
        const ext = original.split('.').pop();
        const base = original.replace(`.${ext}`, '');
        const date = new Date().toISOString().slice(0, 10);
        const user = conflict.localModifiedBy.name.split(' ')[0];
        
        return `${base} (${user}'s copy ${date}).${ext}`;
    }
}
```

---

## 9. Provider-Specific Features

### 9.1 Feature Detection

```typescript
interface ProviderCapabilities {
    // Upload
    maxFileSize: number;
    supportsResumableUpload: boolean;
    
    // Download
    supportsByteRange: boolean;
    supportsDirectDownloadUrl: boolean;
    
    // Sharing
    supportsPasswordProtectedLinks: boolean;
    supportsExpiringLinks: boolean;
    supportsOrganizationLinks: boolean;
    
    // Versioning
    supportsVersionHistory: boolean;
    maxVersions: number;
    versionRetentionDays: number;
    
    // Collaboration
    supportsRealTimeEditing: boolean;
    supportsComments: boolean;
    
    // Other
    supportsWebhooks: boolean;
    supportsSearch: boolean;
    supportsThumbnails: boolean;
}

const PROVIDER_CAPABILITIES: Record<string, ProviderCapabilities> = {
    'onedrive': {
        maxFileSize: 250 * 1024 * 1024 * 1024, // 250 GB
        supportsResumableUpload: true,
        supportsByteRange: true,
        supportsDirectDownloadUrl: true,
        supportsPasswordProtectedLinks: true,
        supportsExpiringLinks: true,
        supportsOrganizationLinks: true,
        supportsVersionHistory: true,
        maxVersions: 500,
        versionRetentionDays: 30,
        supportsRealTimeEditing: true,
        supportsComments: true,
        supportsWebhooks: true,
        supportsSearch: true,
        supportsThumbnails: true
    },
    'google-drive': {
        maxFileSize: 5 * 1024 * 1024 * 1024 * 1024, // 5 TB
        supportsResumableUpload: true,
        supportsByteRange: true,
        supportsDirectDownloadUrl: true,
        supportsPasswordProtectedLinks: false,
        supportsExpiringLinks: true,
        supportsOrganizationLinks: true,
        supportsVersionHistory: true,
        maxVersions: 100,
        versionRetentionDays: 30,
        supportsRealTimeEditing: true,
        supportsComments: true,
        supportsWebhooks: true,
        supportsSearch: true,
        supportsThumbnails: true
    }
};

class CapabilityChecker {
    /**
     * Check if feature is supported
     */
    supports(providerType: string, feature: keyof ProviderCapabilities): boolean {
        const caps = PROVIDER_CAPABILITIES[providerType];
        if (!caps) return false;
        return !!caps[feature];
    }
    
    /**
     * Get all capabilities for provider
     */
    getCapabilities(providerType: string): ProviderCapabilities | null {
        return PROVIDER_CAPABILITIES[providerType] || null;
    }
}
```

### 9.2 OneDrive-Specific

```typescript
class OneDriveProvider implements IStorageProvider {
    readonly providerType = 'onedrive';
    readonly displayName = 'OneDrive';
    
    private graphClient: Client;
    
    /**
     * OneDrive-specific: Use delta API for efficient sync
     */
    async getChanges(deltaLink?: string): Promise<ChangeSet> {
        const url = deltaLink || '/me/drive/root/delta';
        const response = await this.graphClient.api(url).get();
        
        return {
            changes: response.value.map(this.mapToChange),
            cursor: response['@odata.deltaLink'],
            hasMore: !!response['@odata.nextLink']
        };
    }
    
    /**
     * OneDrive-specific: Quick XOR hash for fast comparison
     */
    async getQuickXorHash(fileId: string): Promise<string> {
        const metadata = await this.graphClient
            .api(`/me/drive/items/${fileId}`)
            .select('file')
            .get();
        
        return metadata.file?.hashes?.quickXorHash;
    }
    
    /**
     * OneDrive-specific: Get Office-like real-time co-authoring URL
     */
    async getCoAuthoringUrl(fileId: string): Promise<string> {
        const response = await this.graphClient
            .api(`/me/drive/items/${fileId}/createLink`)
            .post({
                type: 'edit',
                scope: 'organization'
            });
        
        return response.link.webUrl;
    }
}
```

### 9.3 Google Drive-Specific

```typescript
class GoogleDriveProvider implements IStorageProvider {
    readonly providerType = 'google-drive';
    readonly displayName = 'Google Drive';
    
    private gapi: typeof gapi;
    
    /**
     * Google Drive-specific: Use Changes API for sync
     */
    async getChanges(pageToken?: string): Promise<ChangeSet> {
        if (!pageToken) {
            // Get start page token
            const startResponse = await this.gapi.client.drive.changes.getStartPageToken({});
            pageToken = startResponse.result.startPageToken;
        }
        
        const response = await this.gapi.client.drive.changes.list({
            pageToken,
            includeRemoved: true,
            spaces: 'drive'
        });
        
        return {
            changes: response.result.changes.map(this.mapToChange),
            cursor: response.result.newStartPageToken,
            hasMore: !!response.result.nextPageToken
        };
    }
    
    /**
     * Google Drive-specific: Export Google Docs to different format
     */
    async exportFile(
        fileId: string, 
        mimeType: string
    ): Promise<Blob> {
        const response = await this.gapi.client.drive.files.export({
            fileId,
            mimeType
        });
        
        return new Blob([response.body], { type: mimeType });
    }
    
    /**
     * Google Drive-specific: Generate thumbnail
     */
    async getThumbnail(
        fileId: string, 
        size: 'small' | 'medium' | 'large' = 'medium'
    ): Promise<string> {
        const sizes = { small: 's220', medium: 's440', large: 's880' };
        
        const response = await this.gapi.client.drive.files.get({
            fileId,
            fields: 'thumbnailLink'
        });
        
        // Modify thumbnail URL for desired size
        return response.result.thumbnailLink?.replace('s220', sizes[size]) || '';
    }
}
```

---

## 10. Error Handling

### 10.1 Storage Error Taxonomy

```typescript
enum StorageErrorCode {
    // Authentication
    AUTH_REQUIRED = 'AUTH_REQUIRED',
    AUTH_EXPIRED = 'AUTH_EXPIRED',
    AUTH_INVALID = 'AUTH_INVALID',
    
    // File operations
    FILE_NOT_FOUND = 'FILE_NOT_FOUND',
    FILE_TOO_LARGE = 'FILE_TOO_LARGE',
    CONFLICT = 'CONFLICT',
    LOCKED = 'LOCKED',
    
    // Permissions
    ACCESS_DENIED = 'ACCESS_DENIED',
    NOT_OWNER = 'NOT_OWNER',
    SHARING_DISABLED = 'SHARING_DISABLED',
    
    // Quota
    QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
    
    // Network
    NETWORK_ERROR = 'NETWORK_ERROR',
    TIMEOUT = 'TIMEOUT',
    RATE_LIMITED = 'RATE_LIMITED',
    
    // Provider
    PROVIDER_ERROR = 'PROVIDER_ERROR',
    PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE',
    
    // Internal
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    NOT_SUPPORTED = 'NOT_SUPPORTED'
}

class StorageError extends Error {
    constructor(
        public readonly code: StorageErrorCode,
        message: string,
        public readonly retryable: boolean = false,
        public readonly providerError?: any
    ) {
        super(message);
        this.name = 'StorageError';
    }
    
    /**
     * Convert provider-specific error to StorageError
     */
    static fromProviderError(
        providerType: string, 
        error: any
    ): StorageError {
        if (providerType === 'onedrive') {
            return StorageError.fromGraphError(error);
        }
        if (providerType === 'google-drive') {
            return StorageError.fromGoogleError(error);
        }
        return new StorageError(
            StorageErrorCode.PROVIDER_ERROR,
            error.message || 'Unknown provider error',
            false,
            error
        );
    }
    
    private static fromGraphError(error: any): StorageError {
        const code = error.code || error.error?.code;
        const message = error.message || error.error?.message;
        
        switch (code) {
            case 'itemNotFound':
                return new StorageError(StorageErrorCode.FILE_NOT_FOUND, message);
            case 'accessDenied':
                return new StorageError(StorageErrorCode.ACCESS_DENIED, message);
            case 'quotaLimitReached':
                return new StorageError(StorageErrorCode.QUOTA_EXCEEDED, message);
            case 'nameAlreadyExists':
                return new StorageError(StorageErrorCode.CONFLICT, message);
            case 'resyncRequired':
                return new StorageError(StorageErrorCode.CONFLICT, message, true);
            case 'activityLimitReached':
            case 'rateLimitExceeded':
                return new StorageError(StorageErrorCode.RATE_LIMITED, message, true);
            default:
                return new StorageError(StorageErrorCode.PROVIDER_ERROR, message, false, error);
        }
    }
}
```

### 10.2 Error Recovery

```typescript
class ErrorRecoveryHandler {
    /**
     * Attempt automatic recovery
     */
    async tryRecover(error: StorageError): Promise<boolean> {
        switch (error.code) {
            case StorageErrorCode.AUTH_EXPIRED:
                return await this.refreshAuth();
                
            case StorageErrorCode.RATE_LIMITED:
                return await this.waitAndRetry(error);
                
            case StorageErrorCode.NETWORK_ERROR:
            case StorageErrorCode.TIMEOUT:
                return await this.retryWithBackoff();
                
            case StorageErrorCode.CONFLICT:
                return await this.resolveConflict(error);
                
            default:
                return false;
        }
    }
    
    /**
     * Refresh authentication and retry
     */
    private async refreshAuth(): Promise<boolean> {
        try {
            await this.authManager.refreshToken();
            return true;
        } catch {
            // Show re-auth prompt
            this.ui.showReAuthDialog();
            return false;
        }
    }
    
    /**
     * Wait for rate limit and retry
     */
    private async waitAndRetry(error: StorageError): Promise<boolean> {
        const retryAfter = error.providerError?.retryAfter || 60;
        await this.sleep(retryAfter * 1000);
        return true;
    }
    
    /**
     * Retry with exponential backoff
     */
    private async retryWithBackoff(): Promise<boolean> {
        const delays = [1000, 2000, 4000, 8000, 16000];
        
        for (const delay of delays) {
            await this.sleep(delay);
            
            if (await this.checkConnectivity()) {
                return true;
            }
        }
        
        return false;
    }
}
```

---

## 11. Implementation

### 11.1 CloudStorageAbstraction Class

```typescript
class CloudStorageAbstraction {
    private providers: Map<string, IStorageProvider> = new Map();
    private activeProvider: IStorageProvider | null = null;
    private authManager: AuthenticationManager;
    private quotaManager: QuotaManager;
    private syncManager: SyncManager;
    private errorHandler: ErrorRecoveryHandler;
    
    constructor() {
        this.authManager = new AuthenticationManager();
        this.quotaManager = new QuotaManager();
        this.syncManager = new SyncManager();
        this.errorHandler = new ErrorRecoveryHandler();
    }
    
    /**
     * Initialize with available providers
     */
    async initialize(): Promise<void> {
        // Register providers
        this.registerProvider(new OneDriveProvider());
        this.registerProvider(new GoogleDriveProvider());
        
        // Try to restore session
        await this.authManager.restoreSession();
        
        // Start sync if authenticated
        if (this.activeProvider) {
            this.syncManager.startSync();
        }
    }
    
    /**
     * Register a storage provider
     */
    registerProvider(provider: IStorageProvider): void {
        this.providers.set(provider.providerType, provider);
        this.authManager.registerProvider(provider);
    }
    
    /**
     * Get active provider
     */
    getActiveProvider(): IStorageProvider {
        if (!this.activeProvider) {
            throw new StorageError(
                StorageErrorCode.AUTH_REQUIRED,
                'No storage provider authenticated'
            );
        }
        return this.activeProvider;
    }
    
    /**
     * Execute operation with error handling
     */
    private async withErrorHandling<T>(
        operation: () => Promise<T>
    ): Promise<T> {
        try {
            return await operation();
        } catch (error) {
            const storageError = error instanceof StorageError
                ? error
                : StorageError.fromProviderError(
                    this.activeProvider?.providerType || 'unknown',
                    error
                );
            
            // Attempt recovery
            if (storageError.retryable) {
                const recovered = await this.errorHandler.tryRecover(storageError);
                if (recovered) {
                    return await operation(); // Retry
                }
            }
            
            throw storageError;
        }
    }
    
    // Delegate methods with error handling
    
    async uploadFile(options: UploadOptions): Promise<FileMetadata> {
        return this.withErrorHandling(() => 
            this.getActiveProvider().uploadFile(options)
        );
    }
    
    async downloadFile(fileId: string, options?: DownloadOptions): Promise<Blob> {
        return this.withErrorHandling(() => 
            this.getActiveProvider().downloadFile(fileId, options)
        );
    }
    
    async shareFile(fileId: string, options: ShareOptions): Promise<ShareLink> {
        return this.withErrorHandling(() => 
            this.getActiveProvider().shareFile(fileId, options)
        );
    }
    
    async getQuota(): Promise<QuotaInfo> {
        return this.withErrorHandling(() => 
            this.getActiveProvider().getQuota()
        );
    }
    
    async getOwnership(fileId: string): Promise<OwnershipInfo> {
        return this.withErrorHandling(() => 
            this.getActiveProvider().getOwnership(fileId)
        );
    }
}
```

### 11.2 Usage Example

```typescript
// Initialize
const storage = new CloudStorageAbstraction();
await storage.initialize();

// Authenticate
await storage.authenticate('onedrive');

// Check quota
const quota = await storage.getQuota();
console.log(`Storage: ${quota.percentUsed}% used`);

// Upload presentation
const result = await storage.uploadFile({
    file: strBlob,
    filename: 'My Presentation.str',
    parentFolderId: 'story-presentations',
    onProgress: (p) => console.log(`${p.percentage}% uploaded`)
});

// Share with collaborator
await storage.shareFile(result.id, {
    type: 'edit',
    recipients: ['colleague@example.com'],
    message: 'Please review this deck'
});

// Check ownership
const ownership = await storage.getOwnership(result.id);
console.log(`Owner: ${ownership.ownerEmail}`);
console.log(`Counts against my quota: ${ownership.countsAgainstMyQuota}`);

// Start sync
storage.syncManager.startSync();
storage.syncManager.on('fileChanged', (change) => {
    console.log(`File ${change.fileId} was modified`);
});
```

---

## Summary

| Component | Purpose |
|-----------|---------|
| **IStorageProvider** | Unified interface for all providers |
| **AuthenticationManager** | Token management, session restore |
| **QuotaManager** | Storage quota tracking |
| **OwnershipManager** | File ownership, quota attribution |
| **SharingManager** | Sharing, permissions |
| **SyncManager** | Change tracking, conflict detection |
| **ErrorRecoveryHandler** | Automatic error recovery |

---

## Related Documents

- [File Format & Storage](./file-format-storage.md)
- [Collaborative Save Protocol](./collaborative-save-protocol.md)
- [Large File Handling](./large-file-handling.md)
- [Cross-Tab Coordination](./cross-tab-coordination.md)

---

*The cloud storage abstraction enables Story to work seamlessly with multiple cloud providers while presenting a unified experience to users.*
