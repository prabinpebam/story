# Asset Streaming - Specification

## Overview

This specification defines how **embedded assets** (videos, images, fonts) are streamed to collaborators from a self-contained `.story` file. Unlike external asset references, all media is embedded inside the ZIP archive, ensuring files remain portable and can't be accidentally deleted or moved.

**Key Design Goals:**
- **Self-contained files** - All assets embedded in .story ZIP
- **Owner-only storage** - Only file owner uses storage quota
- **Lazy loading** - Assets loaded on-demand via byte-range requests
- **Efficient streaming** - Videos play without full download

**Related Specifications:**
- [File Format & Storage](storage/file-format-storage.md) - ZIP structure
- [Cloud Storage Abstraction](./cloud-storage-abstraction.md) - OneDrive/Google Drive APIs
- [State Sync Engine](./state-sync-engine.md) - How operations are synced

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Asset Index](#2-asset-index)
3. [Byte-Range Requests](#3-byte-range-requests)
4. [Lazy Loading Strategy](#4-lazy-loading-strategy)
5. [Video Streaming](#5-video-streaming)
6. [Collaborator Access](#6-collaborator-access)
7. [Storage Quota](#7-storage-quota)
8. [Implementation](#8-implementation)

---

## 1. Architecture Overview

### 1.1 The Problem

When Collaborator B joins a session with a 500MB presentation containing embedded videos:

- ❌ Download entire 500MB file? Too slow
- ❌ Store videos as separate files? Can be deleted/moved
- ✅ Read specific bytes from the .story file via HTTP Range requests

### 1.2 The Solution

```
┌─────────────────────────────────────────────────────────────────┐
│  .story file in Owner's OneDrive (1 file, 500MB)               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ZIP Archive Structure                                    │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ Bytes 0-1000:        manifest.json (with asset index)   │   │
│  │ Bytes 1001-5000:     document/slides/slide-001.json     │   │
│  │ Bytes 5001-10000:    document/slides/slide-002.json     │   │
│  │ Bytes 10001-50000:   assets/images/hero.jpg             │   │
│  │ Bytes 50001-500MB:   assets/videos/intro.mp4            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
    ┌─────────────────────────┼─────────────────────────────┐
    │                         │                             │
    ▼                         ▼                             ▼
┌───────────────┐    ┌────────────────────┐    ┌──────────────────┐
│ Owner         │    │ HTTP Range Request │    │ Collaborator B   │
│               │    │                    │    │                  │
│ Full file     │    │ GET /file.story    │    │ Range: bytes=    │
│ access        │    │ Range: 50001-...   │    │ 50001-500MB      │
│               │    │                    │    │                  │
│ Uses 500MB    │    │ Returns ONLY the   │    │ Uses 0 MB quota  │
│ quota         │    │ video bytes        │    │ (reads owner's)  │
└───────────────┘    └────────────────────┘    └──────────────────┘
```

### 1.3 Key Insight

Cloud storage providers (OneDrive, Google Drive, Dropbox) all support **HTTP Range requests**. This allows reading specific byte ranges from a file without downloading the entire file.

---

## 2. Asset Index

### 2.1 Manifest with Byte Offsets

The manifest.json includes an index of all embedded assets with their byte locations:

```javascript
// manifest.json (at beginning of .story file)
{
    "version": "1.0",
    "title": "My Presentation",
    
    // Asset index for byte-range access
    "assetIndex": {
        "hero-image.jpg": {
            "path": "assets/images/hero-image.jpg",
            "byteOffset": 10001,
            "byteLength": 39999,
            "mimeType": "image/jpeg",
            "checksum": "sha256:abc123...",
            "dimensions": { "width": 1920, "height": 1080 },
            "compression": "store"  // Not compressed (for streaming)
        },
        "intro-video.mp4": {
            "path": "assets/videos/intro-video.mp4",
            "byteOffset": 50001,
            "byteLength": 499949999,
            "mimeType": "video/mp4",
            "checksum": "sha256:def456...",
            "dimensions": { "width": 1920, "height": 1080 },
            "duration": 120.5,
            "compression": "store"  // MUST be uncompressed for video streaming
        },
        "custom-font.woff2": {
            "path": "assets/fonts/custom-font.woff2",
            "byteOffset": 8001,
            "byteLength": 2000,
            "mimeType": "font/woff2",
            "checksum": "sha256:ghi789...",
            "compression": "store"
        }
    },
    
    // Chunk index for document files
    "chunks": {
        "manifest.json": { "offset": 0, "size": 1000 },
        "document/metadata.json": { "offset": 1001, "size": 500 },
        "document/slides/slide-001.json": { "offset": 1501, "size": 3500 }
    }
}
```

### 2.2 ZIP Compression Requirements

For byte-range streaming to work, assets must be stored **uncompressed** in the ZIP:

```javascript
// When creating ZIP file
const zip = new ZipWriter(output, {
    // Use "store" (no compression) for streamable assets
    compressionMethod: {
        'assets/images/*': 'store',   // Fast access
        'assets/videos/*': 'store',   // REQUIRED for streaming
        'assets/fonts/*': 'store',    // Fast access
        'document/*': 'deflate',      // Compress JSON (small, not streamed)
        'preview/*': 'store'          // Thumbnails need fast access
    }
});
```

**Why uncompressed?**
- Compressed data can't be randomly accessed
- Video seeking requires specific byte offsets
- Compression ratio for media is minimal anyway (JPG, MP4 already compressed)

---

## 3. Byte-Range Requests

### 3.1 HTTP Range Header

Cloud storage APIs support the standard HTTP Range header:

```http
GET /v1.0/drives/{driveId}/items/{itemId}/content
Host: graph.microsoft.com
Authorization: Bearer {token}
Range: bytes=50001-100000

HTTP/1.1 206 Partial Content
Content-Range: bytes 50001-100000/500000000
Content-Length: 49999
Content-Type: application/octet-stream

[Binary data...]
```

### 3.2 OneDrive Range Request

```typescript
async function readAssetFromOneDrive(
    fileId: string,
    byteOffset: number,
    byteLength: number,
    accessToken: string
): Promise<ArrayBuffer> {
    const response = await fetch(
        `https://graph.microsoft.com/v1.0/drives/me/items/${fileId}/content`,
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Range': `bytes=${byteOffset}-${byteOffset + byteLength - 1}`
            }
        }
    );
    
    if (response.status !== 206) {
        throw new Error('Range request not supported or failed');
    }
    
    return response.arrayBuffer();
}
```

### 3.3 Google Drive Range Request

```typescript
async function readAssetFromGoogleDrive(
    fileId: string,
    byteOffset: number,
    byteLength: number,
    accessToken: string
): Promise<ArrayBuffer> {
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
        throw new Error('Range request not supported or failed');
    }
    
    return response.arrayBuffer();
}
```

### 3.4 Provider-Agnostic Interface

```typescript
interface AssetStreamProvider {
    /**
     * Read a range of bytes from the file
     */
    readRange(
        byteOffset: number, 
        byteLength: number
    ): Promise<ArrayBuffer>;
    
    /**
     * Create a URL that supports range requests
     * (for use with <video> src)
     */
    createStreamableUrl(): Promise<string>;
    
    /**
     * Check if range requests are supported
     */
    supportsRangeRequests(): boolean;
}

class OneDriveAssetStream implements AssetStreamProvider {
    constructor(
        private fileId: string,
        private accessToken: string
    ) {}
    
    async readRange(byteOffset: number, byteLength: number): Promise<ArrayBuffer> {
        // ... implementation above
    }
    
    async createStreamableUrl(): Promise<string> {
        // OneDrive provides downloadable URLs that support Range
        const response = await fetch(
            `https://graph.microsoft.com/v1.0/drives/me/items/${this.fileId}`,
            {
                headers: { 'Authorization': `Bearer ${this.accessToken}` }
            }
        );
        const data = await response.json();
        return data['@microsoft.graph.downloadUrl'];
    }
    
    supportsRangeRequests(): boolean {
        return true;
    }
}
```

---

## 4. Lazy Loading Strategy

### 4.1 Loading Phases

Assets are loaded progressively based on visibility and priority:

```
Phase 1: CRITICAL (Immediate)
├── manifest.json (always first)
├── document/metadata.json
├── document/slides/slide-001.json (first slide)
└── preview/thumbnail.png

Phase 2: VISIBLE (When slide becomes visible)
├── Assets on current slide
└── Assets on adjacent slides (prefetch)

Phase 3: BACKGROUND (Idle time)
├── Remaining slide definitions
├── Preview thumbnails
└── Remaining assets

Phase 4: ON-DEMAND (User interaction)
├── Videos (load when play pressed)
└── High-res images (load when zoomed)
```

### 4.2 Asset Loader

```typescript
class LazyAssetLoader {
    private manifest: AssetIndex;
    private assetStream: AssetStreamProvider;
    private cache: Map<string, Blob> = new Map();
    private loadingPromises: Map<string, Promise<Blob>> = new Map();
    
    constructor(manifest: AssetIndex, assetStream: AssetStreamProvider) {
        this.manifest = manifest;
        this.assetStream = assetStream;
    }
    
    /**
     * Get an asset, loading if necessary
     */
    async getAsset(assetId: string): Promise<Blob> {
        // Check cache first
        if (this.cache.has(assetId)) {
            return this.cache.get(assetId)!;
        }
        
        // Check if already loading
        if (this.loadingPromises.has(assetId)) {
            return this.loadingPromises.get(assetId)!;
        }
        
        // Start loading
        const promise = this.loadAsset(assetId);
        this.loadingPromises.set(assetId, promise);
        
        try {
            const blob = await promise;
            this.cache.set(assetId, blob);
            return blob;
        } finally {
            this.loadingPromises.delete(assetId);
        }
    }
    
    private async loadAsset(assetId: string): Promise<Blob> {
        const assetInfo = this.manifest[assetId];
        
        if (!assetInfo) {
            throw new Error(`Asset not found: ${assetId}`);
        }
        
        const buffer = await this.assetStream.readRange(
            assetInfo.byteOffset,
            assetInfo.byteLength
        );
        
        // Verify checksum
        const actualChecksum = await this.computeChecksum(buffer);
        if (actualChecksum !== assetInfo.checksum) {
            throw new Error(`Checksum mismatch for ${assetId}`);
        }
        
        return new Blob([buffer], { type: assetInfo.mimeType });
    }
    
    /**
     * Prefetch assets for upcoming slides
     */
    prefetch(assetIds: string[]): void {
        for (const assetId of assetIds) {
            if (!this.cache.has(assetId) && !this.loadingPromises.has(assetId)) {
                // Low priority fetch
                requestIdleCallback(() => {
                    this.getAsset(assetId).catch(() => {});
                });
            }
        }
    }
    
    /**
     * Get blob URL for use in img/video src
     */
    async getBlobUrl(assetId: string): Promise<string> {
        const blob = await this.getAsset(assetId);
        return URL.createObjectURL(blob);
    }
    
    /**
     * Clean up blob URLs to prevent memory leaks
     */
    releaseBlobUrl(url: string): void {
        URL.revokeObjectURL(url);
    }
    
    /**
     * Evict assets from cache to free memory
     */
    evictLeastRecentlyUsed(targetSize: number): void {
        // LRU eviction logic
        while (this.getCacheSize() > targetSize && this.cache.size > 0) {
            const [oldestKey] = this.cache.keys();
            this.cache.delete(oldestKey);
        }
    }
}
```

### 4.3 Slide-Based Prefetching

```typescript
class SlidePrefetcher {
    private loader: LazyAssetLoader;
    private slideAssets: Map<string, string[]>;  // slideId -> assetIds
    
    /**
     * Called when user navigates to a slide
     */
    onSlideChange(currentSlideId: string, allSlideIds: string[]): void {
        const currentIndex = allSlideIds.indexOf(currentSlideId);
        
        // Priority 1: Current slide assets
        const currentAssets = this.slideAssets.get(currentSlideId) || [];
        for (const assetId of currentAssets) {
            this.loader.getAsset(assetId);  // Immediate load
        }
        
        // Priority 2: Next slide (likely to navigate)
        const nextSlideId = allSlideIds[currentIndex + 1];
        if (nextSlideId) {
            const nextAssets = this.slideAssets.get(nextSlideId) || [];
            this.loader.prefetch(nextAssets);
        }
        
        // Priority 3: Previous slide (might go back)
        const prevSlideId = allSlideIds[currentIndex - 1];
        if (prevSlideId) {
            const prevAssets = this.slideAssets.get(prevSlideId) || [];
            this.loader.prefetch(prevAssets);
        }
    }
}
```

---

## 5. Video Streaming

### 5.1 The Challenge

Videos embedded in ZIP can be large (100MB+). We need:
- Play without downloading entire video
- Seeking to any point
- Buffering indicators
- Memory-efficient playback

### 5.2 Solution: Range-Enabled Video URL

Cloud storage providers return URLs that support Range requests natively:

```typescript
class VideoStreamer {
    private assetStream: AssetStreamProvider;
    private assetIndex: AssetIndex;
    
    /**
     * Get a streaming URL for embedded video
     */
    async getVideoStreamUrl(assetId: string): Promise<string> {
        const assetInfo = this.assetIndex[assetId];
        
        // Get base URL that supports Range requests
        const baseUrl = await this.assetStream.createStreamableUrl();
        
        // Create a custom URL with byte offset info
        // This is used by our custom fetch handler
        return this.createOffsetUrl(baseUrl, assetInfo.byteOffset, assetInfo.byteLength);
    }
    
    /**
     * Alternative: Use MediaSource API for fine-grained control
     */
    async createMediaSource(assetId: string): Promise<MediaSource> {
        const assetInfo = this.assetIndex[assetId];
        const mediaSource = new MediaSource();
        
        mediaSource.addEventListener('sourceopen', async () => {
            const sourceBuffer = mediaSource.addSourceBuffer(assetInfo.mimeType);
            
            // Load video in chunks
            const chunkSize = 1024 * 1024;  // 1MB chunks
            let offset = assetInfo.byteOffset;
            const end = assetInfo.byteOffset + assetInfo.byteLength;
            
            while (offset < end && !sourceBuffer.updating) {
                const chunkEnd = Math.min(offset + chunkSize, end);
                const chunk = await this.assetStream.readRange(offset, chunkEnd - offset);
                
                sourceBuffer.appendBuffer(chunk);
                offset = chunkEnd;
                
                // Wait for buffer to process
                await new Promise(resolve => {
                    sourceBuffer.addEventListener('updateend', resolve, { once: true });
                });
            }
            
            mediaSource.endOfStream();
        });
        
        return mediaSource;
    }
}
```

### 5.3 Using with HTML5 Video

```typescript
// Option 1: Direct URL (if cloud provider supports offset in URL)
const videoElement = document.createElement('video');
videoElement.src = await videoStreamer.getVideoStreamUrl('intro-video.mp4');
videoElement.controls = true;

// Option 2: MediaSource API (more control)
const mediaSource = await videoStreamer.createMediaSource('intro-video.mp4');
videoElement.src = URL.createObjectURL(mediaSource);

// Option 3: Service Worker interception (most flexible)
// Register service worker that intercepts video requests
// and translates them to byte-range requests
```

### 5.4 Service Worker for Video

```typescript
// service-worker.js
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Intercept requests to our virtual video URLs
    if (url.pathname.startsWith('/story-asset/')) {
        event.respondWith(handleAssetRequest(event.request, url));
    }
});

async function handleAssetRequest(request: Request, url: URL): Promise<Response> {
    const assetId = url.pathname.replace('/story-asset/', '');
    const assetInfo = await getAssetInfo(assetId);
    
    // Check if Range header is present (video seeking)
    const rangeHeader = request.headers.get('Range');
    
    if (rangeHeader) {
        // Parse range: "bytes=1000-2000"
        const [start, end] = parseRange(rangeHeader, assetInfo.byteLength);
        
        // Map to actual byte offset in the .story file
        const actualStart = assetInfo.byteOffset + start;
        const actualEnd = assetInfo.byteOffset + (end || assetInfo.byteLength - 1);
        
        // Fetch from cloud storage with mapped range
        const response = await fetch(assetInfo.cloudUrl, {
            headers: {
                'Range': `bytes=${actualStart}-${actualEnd}`,
                'Authorization': `Bearer ${await getAccessToken()}`
            }
        });
        
        // Return with correct headers for video player
        return new Response(response.body, {
            status: 206,
            headers: {
                'Content-Type': assetInfo.mimeType,
                'Content-Range': `bytes ${start}-${end || assetInfo.byteLength - 1}/${assetInfo.byteLength}`,
                'Accept-Ranges': 'bytes'
            }
        });
    }
    
    // Full file request
    const buffer = await readAssetFromCloud(assetInfo);
    return new Response(buffer, {
        headers: {
            'Content-Type': assetInfo.mimeType,
            'Content-Length': assetInfo.byteLength.toString(),
            'Accept-Ranges': 'bytes'
        }
    });
}
```

---

## 6. Collaborator Access

### 6.1 How Collaborators Access Assets

When Collaborator B joins a session:

```
┌─────────────────────────────────────────────────────────────────┐
│  SESSION JOIN FLOW                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. SignalR tells Collaborator B the file location             │
│     {                                                           │
│       type: "session:info",                                     │
│       fileId: "abc123",                                         │
│       provider: "onedrive",                                     │
│       accessType: "shared"                                      │
│     }                                                           │
│                                                                 │
│  2. Collaborator B gets shared access token                    │
│     (Either from owner's share link or direct permission)      │
│                                                                 │
│  3. Collaborator B reads ONLY the manifest (first few KB)      │
│     Range: bytes=0-10000                                        │
│                                                                 │
│  4. Now Collaborator B has the asset index                     │
│     They can lazy-load any asset without downloading 500MB     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Access Token Sharing

The owner's shared access allows collaborators to read the file:

```typescript
interface CollaboratorSession {
    /** File ID in cloud storage */
    fileId: string;
    
    /** Storage provider */
    provider: 'onedrive' | 'google-drive';
    
    /** Shared access method */
    accessType: 'share-link' | 'direct-permission' | 'organization';
    
    /** Share link URL (for share-link access) */
    shareLink?: string;
    
    /** Access token (for direct permission) */
    accessToken?: string;
}

class CollaboratorAssetAccess {
    private session: CollaboratorSession;
    
    async getAccessToken(): Promise<string> {
        switch (this.session.accessType) {
            case 'share-link':
                // Anonymous access via share link
                return this.getAnonymousToken();
                
            case 'direct-permission':
                // User has been granted access to owner's file
                return this.session.accessToken!;
                
            case 'organization':
                // Same organization, use user's own token
                return this.getUserToken();
        }
    }
    
    async readAsset(assetId: string): Promise<Blob> {
        const token = await this.getAccessToken();
        const assetInfo = this.manifest.assetIndex[assetId];
        
        const buffer = await this.readRange(
            assetInfo.byteOffset,
            assetInfo.byteLength,
            token
        );
        
        return new Blob([buffer], { type: assetInfo.mimeType });
    }
}
```

### 6.3 When Collaborator Adds Media

If a collaborator adds a video to the presentation:

```
┌─────────────────────────────────────────────────────────────────┐
│  COLLABORATOR ADDS VIDEO                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Collaborator B selects 200MB video file                    │
│                                                                 │
│  2. Video is uploaded directly to OWNER's file                 │
│     (Collaborator has edit permission)                          │
│     POST /v1.0/drives/{ownerId}/items/{fileId}/content         │
│     Range: bytes=*/*  (append)                                  │
│                                                                 │
│  3. Asset index is updated via SignalR operation               │
│     {                                                           │
│       type: "operation",                                        │
│       operation: {                                              │
│         type: "update",                                         │
│         path: ["assets", "new-video.mp4"],                     │
│         value: { byteOffset: 500000000, byteLength: 200000000 }│
│       }                                                         │
│     }                                                           │
│                                                                 │
│  4. All collaborators can now access the new video             │
│                                                                 │
│  Storage impact:                                                │
│  • Owner's quota: +200MB                                        │
│  • Collaborator B's quota: 0 (they uploaded TO owner)          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Storage Quota

### 7.1 Owner-Only Quota

The key principle: **only the file owner uses storage quota**.

```
┌─────────────────────────────────────────────────────────────────┐
│                     STORAGE USAGE                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  OWNER (You)                                                    │
│  ├── presentation.story (500MB)                                │
│  │   └── Stored in YOUR OneDrive                               │
│  └── Quota used: 500MB                                          │
│                                                                 │
│  COLLABORATOR B                                                 │
│  ├── Reads from YOUR file via shared access                    │
│  ├── Streams video via Range requests                          │
│  ├── No copy stored in their drive                             │
│  └── Quota used: 0 MB                                           │
│                                                                 │
│  COLLABORATOR C                                                 │
│  ├── Same - reads from YOUR file                               │
│  └── Quota used: 0 MB                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Browser Cache (Temporary)

Collaborators may cache assets locally in browser storage:

```typescript
interface CachePolicy {
    /** Max size for browser cache */
    maxCacheSize: number;  // e.g., 200MB
    
    /** How long to keep cached assets */
    maxAge: number;  // e.g., 24 hours
    
    /** What to cache */
    cacheTypes: ('image' | 'video' | 'font')[];
}

class CollaboratorCache {
    private cache: Cache;  // Browser Cache API
    private policy: CachePolicy;
    
    async cacheAsset(assetId: string, blob: Blob): Promise<void> {
        // Only cache if within policy limits
        if (blob.size > this.policy.maxCacheSize) {
            return;  // Don't cache huge files
        }
        
        // Check current cache size
        const currentSize = await this.getCacheSize();
        if (currentSize + blob.size > this.policy.maxCacheSize) {
            await this.evictOldest(blob.size);
        }
        
        // Store in cache with expiry
        await this.cache.put(
            `/cached-asset/${assetId}`,
            new Response(blob, {
                headers: {
                    'X-Cache-Expires': (Date.now() + this.policy.maxAge).toString()
                }
            })
        );
    }
    
    async getCachedAsset(assetId: string): Promise<Blob | null> {
        const response = await this.cache.match(`/cached-asset/${assetId}`);
        
        if (!response) return null;
        
        // Check expiry
        const expires = parseInt(response.headers.get('X-Cache-Expires') || '0');
        if (Date.now() > expires) {
            await this.cache.delete(`/cached-asset/${assetId}`);
            return null;
        }
        
        return response.blob();
    }
}
```

---

## 8. Implementation

### 8.1 Complete Asset Manager

```typescript
class CollaborativeAssetManager {
    private manifest: Manifest;
    private streamProvider: AssetStreamProvider;
    private loader: LazyAssetLoader;
    private videoStreamer: VideoStreamer;
    private cache: CollaboratorCache;
    private isOwner: boolean;
    
    constructor(options: {
        manifest: Manifest;
        fileId: string;
        provider: 'onedrive' | 'google-drive';
        accessToken: string;
        isOwner: boolean;
    }) {
        this.manifest = options.manifest;
        this.isOwner = options.isOwner;
        
        // Create provider-specific stream
        this.streamProvider = options.provider === 'onedrive'
            ? new OneDriveAssetStream(options.fileId, options.accessToken)
            : new GoogleDriveAssetStream(options.fileId, options.accessToken);
        
        this.loader = new LazyAssetLoader(this.manifest.assetIndex, this.streamProvider);
        this.videoStreamer = new VideoStreamer(this.streamProvider, this.manifest.assetIndex);
        this.cache = new CollaboratorCache();
    }
    
    /**
     * Get image for display
     */
    async getImage(assetId: string): Promise<string> {
        // Check cache first
        const cached = await this.cache.getCachedAsset(assetId);
        if (cached) {
            return URL.createObjectURL(cached);
        }
        
        // Load from cloud
        const blob = await this.loader.getAsset(assetId);
        
        // Cache for future
        await this.cache.cacheAsset(assetId, blob);
        
        return URL.createObjectURL(blob);
    }
    
    /**
     * Get video element ready for playback
     */
    async prepareVideo(assetId: string, videoElement: HTMLVideoElement): Promise<void> {
        const assetInfo = this.manifest.assetIndex[assetId];
        
        if (assetInfo.byteLength > 50 * 1024 * 1024) {
            // Large video: use streaming
            const streamUrl = await this.videoStreamer.getVideoStreamUrl(assetId);
            videoElement.src = streamUrl;
        } else {
            // Small video: load entirely
            const blobUrl = await this.loader.getBlobUrl(assetId);
            videoElement.src = blobUrl;
        }
    }
    
    /**
     * Add new asset (upload to owner's storage)
     */
    async addAsset(file: File): Promise<AssetReference> {
        const assetId = await this.generateAssetId(file);
        
        if (this.isOwner) {
            // Owner: write directly to file
            return this.appendToFile(file, assetId);
        } else {
            // Collaborator: upload to owner's file
            return this.uploadToOwner(file, assetId);
        }
    }
    
    private async uploadToOwner(file: File, assetId: string): Promise<AssetReference> {
        // Get current file size (new asset goes at end)
        const fileInfo = await this.streamProvider.getFileInfo();
        const byteOffset = fileInfo.size;
        
        // Append to file
        await this.streamProvider.appendBytes(await file.arrayBuffer());
        
        // Update manifest (broadcast via SignalR)
        const assetInfo: AssetInfo = {
            path: `assets/${this.getAssetFolder(file.type)}/${assetId}`,
            byteOffset,
            byteLength: file.size,
            mimeType: file.type,
            checksum: await this.computeChecksum(file)
        };
        
        // Broadcast asset addition to all collaborators
        await this.broadcastAssetAdded(assetId, assetInfo);
        
        return { assetId, ...assetInfo };
    }
}
```

### 8.2 Manifest Update Protocol

When assets are added/removed, the manifest must be updated:

```typescript
// Operation broadcast for new asset
{
    type: "operation",
    operation: {
        type: "update",
        path: ["assetIndex", "new-video.mp4"],
        value: {
            path: "assets/videos/new-video.mp4",
            byteOffset: 500000000,
            byteLength: 200000000,
            mimeType: "video/mp4",
            checksum: "sha256:xyz..."
        }
    },
    userId: "collaborator-b",
    timestamp: 1732780000000,
    vectorClock: { ... }
}
```

---

## Summary

| Feature | Implementation |
|---------|----------------|
| **Self-contained files** | All assets in ZIP archive |
| **Efficient access** | HTTP Range requests for byte-level access |
| **Video streaming** | MediaSource API or Service Worker |
| **Lazy loading** | Load on-demand with prefetching |
| **Owner-only storage** | Collaborators read owner's file |
| **Asset addition** | Append to file, broadcast index update |

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Manifest load | < 200ms |
| Image load (1MB) | < 500ms |
| Video start (streaming) | < 1s |
| Prefetch (adjacent slides) | Background |

---

## Related Documents

- [File Format & Storage](storage/file-format-storage.md)
- [Cloud Storage Abstraction](./cloud-storage-abstraction.md)
- [State Sync Engine](./state-sync-engine.md)
- [Sharing & Permissions](./sharing-permissions.md)

---

*This specification enables efficient asset access for self-contained .story files in collaborative sessions.*
