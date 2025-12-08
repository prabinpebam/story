# Cloud Storage Abstraction Layer - Specification

## Overview

This specification defines a **provider-agnostic cloud storage interface** that enables Story to work with multiple cloud storage providers (OneDrive, Google Drive, Dropbox, etc.) through a unified API. This abstraction ensures:

1. **Minimal code changes** when adding new providers
2. **Consistent user experience** across providers
3. **Easy migration** if we later move to self-hosted storage

**Related Specifications:**
- [Real-Time Collaboration](./realtime-collaboration.md) - Overall collaboration architecture
- [Azure SignalR Integration](./azure-signalr-integration.md) - Real-time messaging
- [Authentication](./authentication.md) - OAuth and identity management
- [File Format Storage](../storage/file-format-storage.md) - .str file format

---

## Table of Contents

1. [Architecture](#1-architecture)
2. [Provider Interface](#2-provider-interface)
3. [OneDrive Provider](#3-onedrive-provider)
4. [Google Drive Provider](#4-google-drive-provider)
5. [Conflict Resolution](#5-conflict-resolution)
6. [Offline Queue](#6-offline-queue)
7. [Implementation Guide](#7-implementation-guide)

---

## 1. Architecture

### 1.1 Layered Design

```
┌─────────────────────────────────────────────────────────────────┐
│                      Story Application                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  StorageManager                          │   │
│  │  • Unified API for all storage operations                │   │
│  │  • Provider selection and switching                      │   │
│  │  • Caching and offline queue                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              CloudStorageProvider (Interface)            │   │
│  │  • authenticate()    • save()       • getVersions()      │   │
│  │  • listFiles()       • load()       • share()            │   │
│  │  • getMetadata()     • delete()     • watchChanges()     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│         ┌────────────────────┼────────────────────┐            │
│         ▼                    ▼                    ▼            │
│  ┌─────────────┐    ┌─────────────────┐    ┌─────────────┐    │
│  │  OneDrive   │    │  Google Drive   │    │   Dropbox   │    │
│  │  Provider   │    │    Provider     │    │  Provider   │    │
│  │             │    │                 │    │   (Future)  │    │
│  └─────────────┘    └─────────────────┘    └─────────────┘    │
│         │                    │                    │            │
└─────────│────────────────────│────────────────────│────────────┘
          ▼                    ▼                    ▼
   ┌─────────────┐    ┌─────────────────┐    ┌─────────────┐
   │  Microsoft  │    │   Google APIs   │    │   Dropbox   │
   │  Graph API  │    │                 │    │     API     │
   └─────────────┘    └─────────────────┘    └─────────────┘
```

### 1.2 Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Provider Agnostic** | All business logic uses abstract interface, never provider-specific APIs |
| **Graceful Degradation** | Features unavailable in some providers are handled gracefully |
| **Offline First** | All operations queue locally, sync when online |
| **Conflict Safe** | ETags/checksums prevent accidental overwrites |
| **Extensible** | New providers require only implementing the interface |

---

## 2. Provider Interface

### 2.1 TypeScript Interface

```typescript
/**
 * Abstract interface for cloud storage providers.
 * Implement this interface to add support for a new provider.
 */
interface CloudStorageProvider {
    /** Provider identifier */
    readonly providerId: 'onedrive' | 'google-drive' | 'dropbox' | 'local';
    
    /** Human-readable name */
    readonly displayName: string;
    
    /** Provider capabilities */
    readonly capabilities: ProviderCapabilities;
    
    // ─────────────────────────────────────────────────────────
    // Authentication
    // ─────────────────────────────────────────────────────────
    
    /** Check if user is authenticated */
    isAuthenticated(): boolean;
    
    /** Initiate OAuth flow */
    authenticate(): Promise<AuthResult>;
    
    /** Sign out and clear tokens */
    signOut(): Promise<void>;
    
    /** Get current user info */
    getCurrentUser(): Promise<UserInfo | null>;
    
    // ─────────────────────────────────────────────────────────
    // File Operations
    // ─────────────────────────────────────────────────────────
    
    /** List files in a folder */
    listFiles(folderId?: string): Promise<CloudFile[]>;
    
    /** Get file metadata without downloading content */
    getMetadata(fileId: string): Promise<CloudFileMetadata>;
    
    /** Download file content */
    load(fileId: string): Promise<Blob>;
    
    /** Upload/update file content */
    save(options: SaveOptions): Promise<SaveResult>;
    
    /** Delete a file */
    delete(fileId: string): Promise<void>;
    
    /** Move/rename a file */
    move(fileId: string, newParentId: string, newName?: string): Promise<CloudFile>;
    
    // ─────────────────────────────────────────────────────────
    // Byte-Range Access (Critical for Collaboration)
    // Enables lazy loading assets from self-contained .story files
    // ─────────────────────────────────────────────────────────
    
    /** 
     * Read a specific byte range from a file.
     * Used to extract individual assets from .story ZIP files
     * without downloading the entire file.
     * 
     * @example
     * // Read embedded video (bytes 50001-500000000) from 500MB file
     * const videoBlob = await provider.readRange(fileId, 50001, 499949999);
     */
    readRange(fileId: string, byteOffset: number, byteLength: number): Promise<Blob>;
    
    /**
     * Get a streamable URL that supports HTTP Range requests.
     * Used for video streaming where browser handles range requests.
     * 
     * @returns URL that can be used directly in <video src="...">
     */
    getStreamableUrl(fileId: string): Promise<string>;
    
    /**
     * Append bytes to the end of a file.
     * Used when collaborators add assets - appends to owner's file.
     * 
     * @returns New byte offset where content was appended
     */
    appendBytes(fileId: string, content: Blob): Promise<{ byteOffset: number }>;
    
    // ─────────────────────────────────────────────────────────
    // Version History
    // ─────────────────────────────────────────────────────────
    
    /** Get version history for a file */
    getVersions(fileId: string): Promise<FileVersion[]>;
    
    /** Download a specific version */
    loadVersion(fileId: string, versionId: string): Promise<Blob>;
    
    /** Restore a previous version */
    restoreVersion(fileId: string, versionId: string): Promise<CloudFile>;
    
    // ─────────────────────────────────────────────────────────
    // Sharing
    // ─────────────────────────────────────────────────────────
    
    /** Share file with specific users */
    shareWithUsers(fileId: string, users: ShareRecipient[]): Promise<void>;
    
    /** Generate shareable link */
    createShareLink(fileId: string, options: ShareLinkOptions): Promise<string>;
    
    /** Get current sharing settings */
    getSharingInfo(fileId: string): Promise<SharingInfo>;
    
    /** Remove sharing */
    revokeAccess(fileId: string, userId?: string): Promise<void>;
    
    // ─────────────────────────────────────────────────────────
    // Change Notifications (Optional)
    // ─────────────────────────────────────────────────────────
    
    /** Subscribe to file changes (if supported) */
    watchChanges?(fileId: string, callback: ChangeCallback): Promise<WatchSubscription>;
    
    /** Unsubscribe from changes */
    unwatchChanges?(subscriptionId: string): Promise<void>;
}
```

### 2.2 Supporting Types

```typescript
interface ProviderCapabilities {
    /** Supports real-time change notifications */
    realTimeNotifications: boolean;
    
    /** Supports file versioning */
    versionHistory: boolean;
    
    /** Maximum versions retained */
    maxVersions: number | 'unlimited';
    
    /** Supports shared links */
    shareLinks: boolean;
    
    /** Supports password-protected links */
    passwordProtectedLinks: boolean;
    
    /** Supports link expiration */
    expiringLinks: boolean;
    
    /** Supports HTTP Range requests for partial file download */
    rangeRequests: boolean;
    
    /** Supports appending to existing files */
    appendBytes: boolean;
    
    /** Supports collaborative editing metadata */
    collaborativeEditing: boolean;
    
    /** Maximum file size in bytes */
    maxFileSize: number;
    
    /** Supports delta uploads */
    deltaSync: boolean;
}

interface CloudFile {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    createdAt: Date;
    modifiedAt: Date;
    etag: string;              // For conflict detection
    parentId: string | null;
    isFolder: boolean;
    thumbnailUrl?: string;
    webUrl?: string;           // URL to open in provider's web UI
}

interface CloudFileMetadata extends CloudFile {
    owner: UserInfo;
    lastModifiedBy: UserInfo;
    shared: boolean;
    sharingInfo?: SharingInfo;
}

interface SaveOptions {
    /** File ID for updates, undefined for new files */
    fileId?: string;
    
    /** Parent folder ID */
    parentId?: string;
    
    /** File name */
    name: string;
    
    /** File content */
    content: Blob;
    
    /** Expected etag for conflict detection */
    expectedEtag?: string;
    
    /** Conflict resolution strategy */
    onConflict: 'fail' | 'overwrite' | 'rename';
    
    /** Progress callback */
    onProgress?: (progress: number) => void;
}

interface SaveResult {
    file: CloudFile;
    conflictDetected: boolean;
    serverVersion?: CloudFile;   // If conflict detected
}

interface FileVersion {
    versionId: string;
    modifiedAt: Date;
    modifiedBy: UserInfo;
    size: number;
    isCurrentVersion: boolean;
}

interface ShareRecipient {
    email: string;
    role: 'viewer' | 'editor' | 'owner';
    sendNotification?: boolean;
    message?: string;
}

interface ShareLinkOptions {
    role: 'viewer' | 'editor';
    expiresAt?: Date;
    password?: string;
}

interface SharingInfo {
    owner: UserInfo;
    collaborators: Array<{
        user: UserInfo;
        role: 'viewer' | 'editor' | 'owner';
    }>;
    linkSharing?: {
        enabled: boolean;
        url: string;
        role: 'viewer' | 'editor';
        expiresAt?: Date;
    };
}

interface UserInfo {
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
}

interface AuthResult {
    success: boolean;
    user?: UserInfo;
    error?: string;
}

type ChangeCallback = (change: FileChange) => void;

interface FileChange {
    type: 'modified' | 'deleted' | 'moved';
    fileId: string;
    newMetadata?: CloudFileMetadata;
}

interface WatchSubscription {
    subscriptionId: string;
    expiresAt: Date;
}
```

---

## 3. OneDrive Provider

### 3.1 Implementation

```typescript
import { Client } from '@microsoft/microsoft-graph-client';
import { AuthenticationProvider } from './authentication';

class OneDriveProvider implements CloudStorageProvider {
    readonly providerId = 'onedrive';
    readonly displayName = 'OneDrive';
    
    readonly capabilities: ProviderCapabilities = {
        realTimeNotifications: true,  // Via Graph webhooks
        versionHistory: true,
        maxVersions: 500,
        shareLinks: true,
        passwordProtectedLinks: true,  // Business/Enterprise only
        expiringLinks: true,
        collaborativeEditing: true,
        maxFileSize: 250 * 1024 * 1024 * 1024,  // 250 GB
        deltaSync: true,
        rangeRequests: true,          // ✅ Supports byte-range access
        appendBytes: true             // ✅ Supports appending to files
    };
    
    private graphClient: Client | null = null;
    private authProvider: AuthenticationProvider;
    
    constructor(authProvider: AuthenticationProvider) {
        this.authProvider = authProvider;
    }
    
    // ─────────────────────────────────────────────────────────
    // Authentication
    // ─────────────────────────────────────────────────────────
    
    isAuthenticated(): boolean {
        return this.authProvider.isAuthenticated('microsoft');
    }
    
    async authenticate(): Promise<AuthResult> {
        try {
            const tokens = await this.authProvider.authenticate('microsoft', {
                scopes: [
                    'Files.ReadWrite',
                    'User.Read',
                    'offline_access'
                ]
            });
            
            this.graphClient = Client.init({
                authProvider: (done) => {
                    done(null, tokens.accessToken);
                }
            });
            
            const user = await this.getCurrentUser();
            return { success: true, user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async getCurrentUser(): Promise<UserInfo | null> {
        if (!this.graphClient) return null;
        
        const me = await this.graphClient.api('/me').get();
        
        return {
            id: me.id,
            email: me.mail || me.userPrincipalName,
            displayName: me.displayName,
            avatarUrl: await this.getAvatarUrl(me.id)
        };
    }
    
    private async getAvatarUrl(userId: string): Promise<string | undefined> {
        try {
            const photo = await this.graphClient!
                .api(`/users/${userId}/photo/$value`)
                .get();
            return URL.createObjectURL(photo);
        } catch {
            return undefined;
        }
    }
    
    // ─────────────────────────────────────────────────────────
    // File Operations
    // ─────────────────────────────────────────────────────────
    
    async listFiles(folderId?: string): Promise<CloudFile[]> {
        const path = folderId 
            ? `/me/drive/items/${folderId}/children`
            : '/me/drive/root/children';
        
        const response = await this.graphClient!
            .api(path)
            .filter("file/mimeType eq 'application/x-story' or folder ne null")
            .select('id,name,size,createdDateTime,lastModifiedDateTime,eTag,parentReference,folder,file,thumbnails,webUrl')
            .expand('thumbnails')
            .get();
        
        return response.value.map(this.mapToCloudFile);
    }
    
    async getMetadata(fileId: string): Promise<CloudFileMetadata> {
        const item = await this.graphClient!
            .api(`/me/drive/items/${fileId}`)
            .expand('permissions,createdByUser,lastModifiedByUser')
            .get();
        
        return this.mapToCloudFileMetadata(item);
    }
    
    async load(fileId: string): Promise<Blob> {
        const response = await this.graphClient!
            .api(`/me/drive/items/${fileId}/content`)
            .get();
        
        return response;
    }
    
    async save(options: SaveOptions): Promise<SaveResult> {
        const { fileId, parentId, name, content, expectedEtag, onConflict, onProgress } = options;
        
        // Check for conflicts if updating existing file
        if (fileId && expectedEtag) {
            const current = await this.getMetadata(fileId);
            if (current.etag !== expectedEtag) {
                if (onConflict === 'fail') {
                    return {
                        file: null!,
                        conflictDetected: true,
                        serverVersion: current
                    };
                } else if (onConflict === 'rename') {
                    // Create new file with different name
                    return this.save({
                        ...options,
                        fileId: undefined,
                        name: this.generateConflictName(name)
                    });
                }
                // 'overwrite' - continue with save
            }
        }
        
        // Determine upload path
        const uploadPath = fileId
            ? `/me/drive/items/${fileId}/content`
            : `/me/drive/items/${parentId || 'root'}:/${name}:/content`;
        
        // Use resumable upload for large files
        if (content.size > 4 * 1024 * 1024) {
            return this.resumableUpload(uploadPath, content, onProgress);
        }
        
        // Simple upload for small files
        const response = await this.graphClient!
            .api(uploadPath)
            .put(content);
        
        return {
            file: this.mapToCloudFile(response),
            conflictDetected: false
        };
    }
    
    private async resumableUpload(
        path: string, 
        content: Blob, 
        onProgress?: (progress: number) => void
    ): Promise<SaveResult> {
        // Create upload session
        const session = await this.graphClient!
            .api(`${path}/createUploadSession`)
            .post({
                item: { "@microsoft.graph.conflictBehavior": "replace" }
            });
        
        const uploadUrl = session.uploadUrl;
        const chunkSize = 10 * 1024 * 1024; // 10 MB chunks
        let offset = 0;
        let response;
        
        while (offset < content.size) {
            const chunk = content.slice(offset, offset + chunkSize);
            const end = Math.min(offset + chunkSize, content.size);
            
            response = await fetch(uploadUrl, {
                method: 'PUT',
                headers: {
                    'Content-Range': `bytes ${offset}-${end - 1}/${content.size}`,
                    'Content-Length': String(chunk.size)
                },
                body: chunk
            }).then(r => r.json());
            
            offset = end;
            onProgress?.(offset / content.size);
        }
        
        return {
            file: this.mapToCloudFile(response),
            conflictDetected: false
        };
    }
    
    async delete(fileId: string): Promise<void> {
        await this.graphClient!
            .api(`/me/drive/items/${fileId}`)
            .delete();
    }
    
    // ─────────────────────────────────────────────────────────
    // Byte-Range Access (for Asset Streaming)
    // ─────────────────────────────────────────────────────────
    
    /**
     * Read a specific byte range from a file.
     * Critical for loading individual assets from self-contained .story files.
     * 
     * @example
     * // Load manifest (first 10KB) from a 500MB presentation
     * const manifest = await provider.readRange(fileId, 0, 10000);
     * 
     * // Load embedded video (bytes 50001-500000000)
     * const video = await provider.readRange(fileId, 50001, 499949999);
     */
    async readRange(fileId: string, byteOffset: number, byteLength: number): Promise<Blob> {
        // Get download URL (supports Range requests)
        const item = await this.graphClient!
            .api(`/me/drive/items/${fileId}`)
            .select('@microsoft.graph.downloadUrl')
            .get();
        
        const downloadUrl = item['@microsoft.graph.downloadUrl'];
        
        // Use Range header to get specific bytes
        const response = await fetch(downloadUrl, {
            headers: {
                'Range': `bytes=${byteOffset}-${byteOffset + byteLength - 1}`
            }
        });
        
        if (response.status !== 206) {
            throw new Error(`Range request failed: ${response.status}`);
        }
        
        return response.blob();
    }
    
    /**
     * Get a URL that supports HTTP Range requests.
     * Used for video streaming - browser handles range requests automatically.
     */
    async getStreamableUrl(fileId: string): Promise<string> {
        const item = await this.graphClient!
            .api(`/me/drive/items/${fileId}`)
            .select('@microsoft.graph.downloadUrl')
            .get();
        
        // OneDrive download URLs support Range requests natively
        return item['@microsoft.graph.downloadUrl'];
    }
    
    /**
     * Append bytes to the end of a file.
     * Used when collaborators add assets to owner's .story file.
     * 
     * Note: OneDrive doesn't support direct append, so we:
     * 1. Create upload session for new total size
     * 2. Upload only the new bytes at the end
     */
    async appendBytes(fileId: string, content: Blob): Promise<{ byteOffset: number }> {
        // Get current file size
        const metadata = await this.getMetadata(fileId);
        const currentSize = metadata.size;
        const newSize = currentSize + content.size;
        
        // Create upload session for the new total size
        const session = await this.graphClient!
            .api(`/me/drive/items/${fileId}/createUploadSession`)
            .post({
                item: { "@microsoft.graph.conflictBehavior": "replace" }
            });
        
        // Upload only the new bytes at the end
        await fetch(session.uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Range': `bytes ${currentSize}-${newSize - 1}/${newSize}`,
                'Content-Length': String(content.size)
            },
            body: content
        });
        
        return { byteOffset: currentSize };
    }
    
    // ─────────────────────────────────────────────────────────
    // Version History
    // ─────────────────────────────────────────────────────────
    
    async getVersions(fileId: string): Promise<FileVersion[]> {
        const response = await this.graphClient!
            .api(`/me/drive/items/${fileId}/versions`)
            .get();
        
        return response.value.map((v: any, index: number) => ({
            versionId: v.id,
            modifiedAt: new Date(v.lastModifiedDateTime),
            modifiedBy: {
                id: v.lastModifiedBy?.user?.id,
                email: v.lastModifiedBy?.user?.email,
                displayName: v.lastModifiedBy?.user?.displayName
            },
            size: v.size,
            isCurrentVersion: index === 0
        }));
    }
    
    async loadVersion(fileId: string, versionId: string): Promise<Blob> {
        return this.graphClient!
            .api(`/me/drive/items/${fileId}/versions/${versionId}/content`)
            .get();
    }
    
    async restoreVersion(fileId: string, versionId: string): Promise<CloudFile> {
        const response = await this.graphClient!
            .api(`/me/drive/items/${fileId}/versions/${versionId}/restoreVersion`)
            .post({});
        
        return this.getMetadata(fileId);
    }
    
    // ─────────────────────────────────────────────────────────
    // Sharing
    // ─────────────────────────────────────────────────────────
    
    async shareWithUsers(fileId: string, users: ShareRecipient[]): Promise<void> {
        await this.graphClient!
            .api(`/me/drive/items/${fileId}/invite`)
            .post({
                requireSignIn: true,
                sendInvitation: users.some(u => u.sendNotification),
                roles: users.map(u => u.role === 'editor' ? 'write' : 'read'),
                recipients: users.map(u => ({
                    email: u.email
                })),
                message: users.find(u => u.message)?.message
            });
    }
    
    async createShareLink(fileId: string, options: ShareLinkOptions): Promise<string> {
        const response = await this.graphClient!
            .api(`/me/drive/items/${fileId}/createLink`)
            .post({
                type: options.role === 'editor' ? 'edit' : 'view',
                scope: 'anonymous',
                expirationDateTime: options.expiresAt?.toISOString(),
                password: options.password
            });
        
        return response.link.webUrl;
    }
    
    async getSharingInfo(fileId: string): Promise<SharingInfo> {
        const item = await this.graphClient!
            .api(`/me/drive/items/${fileId}`)
            .expand('permissions')
            .get();
        
        return {
            owner: {
                id: item.createdBy.user.id,
                email: item.createdBy.user.email,
                displayName: item.createdBy.user.displayName
            },
            collaborators: item.permissions
                ?.filter((p: any) => p.grantedTo)
                .map((p: any) => ({
                    user: {
                        id: p.grantedTo.user.id,
                        email: p.grantedTo.user.email,
                        displayName: p.grantedTo.user.displayName
                    },
                    role: p.roles.includes('write') ? 'editor' : 'viewer'
                })) || [],
            linkSharing: item.permissions
                ?.find((p: any) => p.link)
                ? {
                    enabled: true,
                    url: item.permissions.find((p: any) => p.link).link.webUrl,
                    role: item.permissions.find((p: any) => p.link).roles.includes('write') ? 'editor' : 'viewer'
                }
                : undefined
        };
    }
    
    // ─────────────────────────────────────────────────────────
    // Change Notifications
    // ─────────────────────────────────────────────────────────
    
    async watchChanges(fileId: string, callback: ChangeCallback): Promise<WatchSubscription> {
        // OneDrive uses delta queries + polling or webhooks
        // For client-side, we use polling with delta
        const pollInterval = 30000; // 30 seconds
        
        let deltaLink: string | null = null;
        
        const poll = async () => {
            const endpoint = deltaLink || `/me/drive/items/${fileId}/delta`;
            const response = await this.graphClient!.api(endpoint).get();
            
            deltaLink = response['@odata.deltaLink'];
            
            for (const change of response.value) {
                if (change.deleted) {
                    callback({ type: 'deleted', fileId: change.id });
                } else {
                    callback({ 
                        type: 'modified', 
                        fileId: change.id,
                        newMetadata: this.mapToCloudFileMetadata(change)
                    });
                }
            }
        };
        
        const intervalId = setInterval(poll, pollInterval);
        
        return {
            subscriptionId: String(intervalId),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        };
    }
    
    async unwatchChanges(subscriptionId: string): Promise<void> {
        clearInterval(Number(subscriptionId));
    }
    
    // ─────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────
    
    private mapToCloudFile(item: any): CloudFile {
        return {
            id: item.id,
            name: item.name,
            mimeType: item.file?.mimeType || 'application/vnd.ms-folder',
            size: item.size,
            createdAt: new Date(item.createdDateTime),
            modifiedAt: new Date(item.lastModifiedDateTime),
            etag: item.eTag,
            parentId: item.parentReference?.id || null,
            isFolder: !!item.folder,
            thumbnailUrl: item.thumbnails?.[0]?.medium?.url,
            webUrl: item.webUrl
        };
    }
    
    private mapToCloudFileMetadata(item: any): CloudFileMetadata {
        return {
            ...this.mapToCloudFile(item),
            owner: {
                id: item.createdByUser?.id || item.createdBy?.user?.id,
                email: item.createdByUser?.email || item.createdBy?.user?.email,
                displayName: item.createdByUser?.displayName || item.createdBy?.user?.displayName
            },
            lastModifiedBy: {
                id: item.lastModifiedByUser?.id || item.lastModifiedBy?.user?.id,
                email: item.lastModifiedByUser?.email || item.lastModifiedBy?.user?.email,
                displayName: item.lastModifiedByUser?.displayName || item.lastModifiedBy?.user?.displayName
            },
            shared: item.shared?.scope === 'users'
        };
    }
    
    private generateConflictName(name: string): string {
        const ext = name.lastIndexOf('.');
        const base = ext > 0 ? name.slice(0, ext) : name;
        const extension = ext > 0 ? name.slice(ext) : '';
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        return `${base} (Conflict ${timestamp})${extension}`;
    }
}
```

### 3.2 OneDrive-Specific Features

| Feature | Graph API Endpoint | Notes |
|---------|-------------------|-------|
| **Delta sync** | `/drive/root/delta` | Efficient incremental sync |
| **Thumbnails** | `/items/{id}/thumbnails` | Preview images |
| **Search** | `/drive/root/search(q='...')` | Full-text search |
| **Recent files** | `/me/drive/recent` | Recently accessed |
| **Shared with me** | `/me/drive/sharedWithMe` | Files others shared |

---

## 4. Google Drive Provider

### 4.1 Implementation

```typescript
class GoogleDriveProvider implements CloudStorageProvider {
    readonly providerId = 'google-drive';
    readonly displayName = 'Google Drive';
    
    readonly capabilities: ProviderCapabilities = {
        realTimeNotifications: true,  // Via Changes API
        versionHistory: true,
        maxVersions: 100,             // Keep 100 revisions
        shareLinks: true,
        passwordProtectedLinks: false, // Not supported
        expiringLinks: true,
        collaborativeEditing: true,
        maxFileSize: 5 * 1024 * 1024 * 1024 * 1024,  // 5 TB
        deltaSync: false,              // No delta uploads
        rangeRequests: true,          // ✅ Supports byte-range access
        appendBytes: true             // ✅ Supports appending to files
    };
    
    private gapiClient: any;
    private authProvider: AuthenticationProvider;
    
    constructor(authProvider: AuthenticationProvider) {
        this.authProvider = authProvider;
    }
    
    // ─────────────────────────────────────────────────────────
    // Authentication
    // ─────────────────────────────────────────────────────────
    
    async authenticate(): Promise<AuthResult> {
        try {
            const tokens = await this.authProvider.authenticate('google', {
                scopes: [
                    'https://www.googleapis.com/auth/drive.file',
                    'https://www.googleapis.com/auth/userinfo.profile',
                    'https://www.googleapis.com/auth/userinfo.email'
                ]
            });
            
            // Initialize gapi client
            await this.initGapiClient(tokens.accessToken);
            
            const user = await this.getCurrentUser();
            return { success: true, user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    // ─────────────────────────────────────────────────────────
    // File Operations
    // ─────────────────────────────────────────────────────────
    
    async listFiles(folderId?: string): Promise<CloudFile[]> {
        const query = folderId
            ? `'${folderId}' in parents and trashed = false`
            : `'root' in parents and trashed = false`;
        
        const response = await gapi.client.drive.files.list({
            q: `${query} and (mimeType = 'application/x-story' or mimeType = 'application/vnd.google-apps.folder')`,
            fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,parents,thumbnailLink,webViewLink,version)',
            pageSize: 100
        });
        
        return response.result.files.map(this.mapToCloudFile);
    }
    
    async load(fileId: string): Promise<Blob> {
        const response = await gapi.client.drive.files.get({
            fileId,
            alt: 'media'
        });
        
        return new Blob([response.body]);
    }
    
    async save(options: SaveOptions): Promise<SaveResult> {
        const { fileId, parentId, name, content, onProgress } = options;
        
        const metadata = {
            name,
            mimeType: 'application/x-story',
            parents: fileId ? undefined : [parentId || 'root']
        };
        
        // Use resumable upload
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', content);
        
        const url = fileId
            ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
            : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
        
        const response = await fetch(url, {
            method: fileId ? 'PATCH' : 'POST',
            headers: {
                'Authorization': `Bearer ${this.authProvider.getAccessToken('google')}`
            },
            body: form
        });
        
        const result = await response.json();
        
        return {
            file: this.mapToCloudFile(result),
            conflictDetected: false
        };
    }
    
    // ─────────────────────────────────────────────────────────
    // Version History
    // ─────────────────────────────────────────────────────────
    
    async getVersions(fileId: string): Promise<FileVersion[]> {
        const response = await gapi.client.drive.revisions.list({
            fileId,
            fields: 'revisions(id,modifiedTime,lastModifyingUser,size)'
        });
        
        return response.result.revisions.map((r: any, i: number, arr: any[]) => ({
            versionId: r.id,
            modifiedAt: new Date(r.modifiedTime),
            modifiedBy: {
                id: r.lastModifyingUser?.permissionId,
                email: r.lastModifyingUser?.emailAddress,
                displayName: r.lastModifyingUser?.displayName
            },
            size: parseInt(r.size),
            isCurrentVersion: i === arr.length - 1
        }));
    }
    
    // ─────────────────────────────────────────────────────────
    // Byte-Range Access (for Asset Streaming)
    // ─────────────────────────────────────────────────────────
    
    /**
     * Read a specific byte range from a file.
     * Critical for loading individual assets from self-contained .story files.
     */
    async readRange(fileId: string, byteOffset: number, byteLength: number): Promise<Blob> {
        const accessToken = this.authProvider.getAccessToken('google');
        
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Range': `bytes=${byteOffset}-${byteOffset + byteLength - 1}`
                }
            }
        );
        
        if (response.status !== 206) {
            throw new Error(`Range request failed: ${response.status}`);
        }
        
        return response.blob();
    }
    
    /**
     * Get a URL that supports HTTP Range requests for video streaming.
     */
    async getStreamableUrl(fileId: string): Promise<string> {
        const accessToken = this.authProvider.getAccessToken('google');
        
        // Google Drive media endpoint supports Range requests
        // Note: Token must be included, so we return a function-generated URL
        return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&access_token=${accessToken}`;
    }
    
    /**
     * Append bytes to the end of a file.
     * Uses resumable upload with Content-Range header.
     */
    async appendBytes(fileId: string, content: Blob): Promise<{ byteOffset: number }> {
        const accessToken = this.authProvider.getAccessToken('google');
        
        // Get current file size
        const metadata = await this.getMetadata(fileId);
        const currentSize = metadata.size;
        const newSize = currentSize + content.size;
        
        // Create resumable upload session
        const initResponse = await fetch(
            `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=resumable`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'X-Upload-Content-Length': String(content.size)
                },
                body: JSON.stringify({})
            }
        );
        
        const uploadUrl = initResponse.headers.get('Location')!;
        
        // Upload the new bytes
        await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Range': `bytes ${currentSize}-${newSize - 1}/${newSize}`
            },
            body: content
        });
        
        return { byteOffset: currentSize };
    }
    
    // ─────────────────────────────────────────────────────────
    // Sharing
    // ─────────────────────────────────────────────────────────
    
    async shareWithUsers(fileId: string, users: ShareRecipient[]): Promise<void> {
        for (const user of users) {
            await gapi.client.drive.permissions.create({
                fileId,
                sendNotificationEmail: user.sendNotification ?? true,
                emailMessage: user.message,
                resource: {
                    type: 'user',
                    role: user.role === 'editor' ? 'writer' : 'reader',
                    emailAddress: user.email
                }
            });
        }
    }
    
    async createShareLink(fileId: string, options: ShareLinkOptions): Promise<string> {
        // Create "anyone with link" permission
        await gapi.client.drive.permissions.create({
            fileId,
            resource: {
                type: 'anyone',
                role: options.role === 'editor' ? 'writer' : 'reader'
            }
        });
        
        // Get the shareable link
        const file = await gapi.client.drive.files.get({
            fileId,
            fields: 'webViewLink'
        });
        
        return file.result.webViewLink;
    }
    
    // Helper mappings...
    private mapToCloudFile(item: any): CloudFile {
        return {
            id: item.id,
            name: item.name,
            mimeType: item.mimeType,
            size: parseInt(item.size) || 0,
            createdAt: new Date(item.createdTime),
            modifiedAt: new Date(item.modifiedTime),
            etag: item.version,
            parentId: item.parents?.[0] || null,
            isFolder: item.mimeType === 'application/vnd.google-apps.folder',
            thumbnailUrl: item.thumbnailLink,
            webUrl: item.webViewLink
        };
    }
}
```

### 4.2 Google Drive-Specific Features

| Feature | API Endpoint | Notes |
|---------|-------------|-------|
| **Changes API** | `changes.list` | Track modifications |
| **App data folder** | `appDataFolder` | Private app storage |
| **Shortcuts** | Shortcut files | Reference other files |
| **Comments** | `comments` API | File annotations |

---

## 5. Conflict Resolution

### 5.1 Detection Strategy

```typescript
class ConflictDetector {
    /**
     * Check if local changes conflict with server version
     */
    async checkConflict(
        provider: CloudStorageProvider,
        fileId: string,
        localEtag: string
    ): Promise<ConflictResult> {
        const serverMetadata = await provider.getMetadata(fileId);
        
        if (serverMetadata.etag === localEtag) {
            return { hasConflict: false };
        }
        
        return {
            hasConflict: true,
            localEtag,
            serverEtag: serverMetadata.etag,
            serverModifiedAt: serverMetadata.modifiedAt,
            serverModifiedBy: serverMetadata.lastModifiedBy
        };
    }
}

interface ConflictResult {
    hasConflict: boolean;
    localEtag?: string;
    serverEtag?: string;
    serverModifiedAt?: Date;
    serverModifiedBy?: UserInfo;
}
```

### 5.2 Resolution UI

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️  File Modified by Someone Else                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  "Marketing Presentation.str" was modified while you were      │
│  editing.                                                       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Your Version              │  Their Version              │   │
│  │  Modified: Just now        │  Modified: 5 min ago        │   │
│  │  By: You                   │  By: Jane Smith             │   │
│  │  Changes: 3 slides         │  Changes: 1 slide           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  What would you like to do?                                     │
│                                                                 │
│  [Keep Mine]     Overwrite their changes with yours             │
│  [Keep Theirs]   Discard your changes                           │
│  [Save as Copy]  Save your version as a new file                │
│  [View Diff]     Compare changes side-by-side                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Automatic Resolution for Non-Conflicting Changes

```typescript
class SmartMerger {
    /**
     * Attempt automatic merge when changes don't overlap
     */
    async tryAutoMerge(
        localState: PresentationState,
        serverState: PresentationState,
        commonAncestor: PresentationState
    ): Promise<MergeResult> {
        const localChanges = this.diffStates(commonAncestor, localState);
        const serverChanges = this.diffStates(commonAncestor, serverState);
        
        // Check for overlapping changes
        const conflicts = this.findConflicts(localChanges, serverChanges);
        
        if (conflicts.length === 0) {
            // Safe to auto-merge
            const merged = this.applyChanges(commonAncestor, [
                ...localChanges,
                ...serverChanges
            ]);
            return { success: true, merged };
        }
        
        // Cannot auto-merge, need user decision
        return { 
            success: false, 
            conflicts,
            localChanges,
            serverChanges
        };
    }
}
```

---

## 6. Offline Queue

### 6.1 Queue Manager

```typescript
class OfflineQueue {
    private queue: QueuedOperation[] = [];
    private db: IDBDatabase;
    
    constructor() {
        this.initDatabase();
        this.setupNetworkListeners();
    }
    
    async enqueue(operation: FileOperation): Promise<void> {
        const queued: QueuedOperation = {
            id: crypto.randomUUID(),
            operation,
            queuedAt: new Date(),
            retryCount: 0,
            status: 'pending'
        };
        
        this.queue.push(queued);
        await this.persistQueue();
        
        if (navigator.onLine) {
            this.processQueue();
        }
    }
    
    private async processQueue(): Promise<void> {
        for (const item of this.queue) {
            if (item.status !== 'pending') continue;
            
            try {
                item.status = 'processing';
                await this.executeOperation(item.operation);
                item.status = 'completed';
            } catch (error) {
                item.status = 'failed';
                item.retryCount++;
                item.lastError = error.message;
                
                if (item.retryCount >= 3) {
                    this.notifyUser(item);
                }
            }
        }
        
        // Remove completed items
        this.queue = this.queue.filter(i => i.status !== 'completed');
        await this.persistQueue();
    }
    
    private setupNetworkListeners(): void {
        window.addEventListener('online', () => {
            this.processQueue();
        });
    }
}

interface QueuedOperation {
    id: string;
    operation: FileOperation;
    queuedAt: Date;
    retryCount: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    lastError?: string;
}

interface FileOperation {
    type: 'save' | 'delete' | 'move' | 'share';
    providerId: string;
    fileId?: string;
    data?: any;
}
```

### 6.2 Sync Status UI

```
┌─────────────────────────────────────────────────────────────────┐
│  Toolbar                                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📄 My Presentation.str    ☁️ Saved to OneDrive          │   │
│  │                            ↑                              │   │
│  │                     Status indicator                      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

Status States:
• ☁️ Saved to OneDrive     - All changes synced
• 🔄 Saving...             - Upload in progress  
• ⚠️ Offline - 2 changes   - Queued for sync
• ❌ Sync failed           - Click to retry
```

---

## 7. Implementation Guide

### 7.1 Adding a New Provider

1. **Create provider class** implementing `CloudStorageProvider`
2. **Register in StorageManager**:
   ```typescript
   storageManager.registerProvider(new DropboxProvider(authProvider));
   ```
3. **Add to provider picker UI**
4. **Test all interface methods**

### 7.2 StorageManager Usage

```typescript
// Initialize
const authProvider = new AuthenticationProvider();
const storage = new StorageManager([
    new OneDriveProvider(authProvider),
    new GoogleDriveProvider(authProvider)
]);

// User selects provider
await storage.setActiveProvider('onedrive');

// Authenticate
const result = await storage.authenticate();
if (!result.success) {
    showError(result.error);
    return;
}

// List files
const files = await storage.listFiles();

// Load presentation
const blob = await storage.load(fileId);
const presentation = await parseStrFile(blob);

// Save with conflict check
const saveResult = await storage.save({
    fileId,
    name: 'My Presentation.str',
    content: await serializeToStr(presentation),
    expectedEtag: currentEtag,
    onConflict: 'fail'
});

if (saveResult.conflictDetected) {
    showConflictDialog(saveResult.serverVersion);
}
```

### 7.3 Future Provider: Self-Hosted

```typescript
/**
 * Provider for self-hosted storage (S3-compatible, WebDAV, etc.)
 * Allows enterprises to use their own infrastructure
 */
class SelfHostedProvider implements CloudStorageProvider {
    readonly providerId = 'self-hosted';
    readonly displayName = 'Custom Server';
    
    private serverUrl: string;
    
    constructor(config: { serverUrl: string }) {
        this.serverUrl = config.serverUrl;
    }
    
    // Implement interface methods using fetch to custom API
    async load(fileId: string): Promise<Blob> {
        const response = await fetch(`${this.serverUrl}/files/${fileId}`);
        return response.blob();
    }
    
    // ... etc
}
```

---

## Related Documents

- [Real-Time Collaboration](./realtime-collaboration.md)
- [Azure SignalR Integration](./azure-signalr-integration.md)
- [Authentication](./authentication.md)
- [File Format Storage](../storage/file-format-storage.md)

---

*This abstraction layer ensures Story can work with any cloud storage provider with minimal code changes.*
