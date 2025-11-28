# Large File Handling - Specification

## Overview

Story presentations can include large video files (up to 500MB+) and many high-resolution images. This specification defines how to efficiently handle large files in browser memory, during upload/download, and within .str archives.

**Key Challenges:**
- Browser memory limits (~2GB typical)
- Upload/download of large files over unreliable networks
- Streaming video without downloading entire file
- ZIP archive handling for files >100MB

**Related Specifications:**
- [File Format & Storage](./file-format-storage.md) - Core file format
- [Asset Management](./asset-management.md) - Asset pipeline
- [Progressive Loading](./progressive-loading.md) - Lazy loading
- [Memory Management](./memory-management.md) - Memory budgets

---

## Table of Contents

1. [Size Limits & Budgets](#1-size-limits--budgets)
2. [Chunked Upload](#2-chunked-upload)
3. [Chunked Download](#3-chunked-download)
4. [Streaming from ZIP](#4-streaming-from-zip)
5. [Video Handling](#5-video-handling)
6. [Memory Management](#6-memory-management)
7. [Progress & Cancellation](#7-progress--cancellation)
8. [Error Recovery](#8-error-recovery)
9. [Implementation](#9-implementation)

---

## 1. Size Limits & Budgets

### 1.1 File Size Limits

| Category | Limit | Rationale |
|----------|-------|-----------|
| **Single image** | 50 MB | Practical limit for browser handling |
| **Single video** | 500 MB | Balance between quality and usability |
| **Total presentation** | 2 GB | Cloud storage and browser limits |
| **Slide count** | 500 slides | Performance and UX |
| **Assets per slide** | 20 | Rendering performance |

### 1.2 Memory Budgets

```typescript
const MEMORY_BUDGETS = {
    // Maximum decoded images in memory
    decodedImages: 200 * 1024 * 1024,      // 200 MB
    
    // Maximum video frames buffered
    videoBuffer: 100 * 1024 * 1024,         // 100 MB
    
    // Maximum blobs in memory
    blobCache: 300 * 1024 * 1024,           // 300 MB
    
    // Working memory for operations
    workingMemory: 100 * 1024 * 1024,       // 100 MB
    
    // Total budget
    total: 700 * 1024 * 1024                // 700 MB
};
```

### 1.3 Size Thresholds

```typescript
const SIZE_THRESHOLDS = {
    // Below this: load entirely into memory
    smallFile: 2 * 1024 * 1024,             // 2 MB
    
    // Below this: stream, but can cache
    mediumFile: 50 * 1024 * 1024,           // 50 MB
    
    // Above this: must stream, never cache fully
    largeFile: 100 * 1024 * 1024,           // 100 MB
    
    // Chunk size for uploads/downloads
    chunkSize: 5 * 1024 * 1024,             // 5 MB
    
    // Parallel chunk limit
    parallelChunks: 4
};
```

---

## 2. Chunked Upload

### 2.1 Overview

Large files are uploaded in chunks to handle network interruptions:

```
┌─────────────────────────────────────────────────────────────────┐
│                    CHUNKED UPLOAD FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  500 MB File                                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Chunk 1 │ Chunk 2 │ Chunk 3 │ ... │ Chunk 100 │         │   │
│  │  5 MB   │  5 MB   │  5 MB   │     │   5 MB    │         │   │
│  └─────────────────────────────────────────────────────────┘   │
│       │         │         │               │                     │
│       ▼         ▼         ▼               ▼                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           Cloud Storage (OneDrive/Google Drive)         │   │
│  │                                                          │   │
│  │  1. Initiate resumable upload session                   │   │
│  │  2. Upload chunks in parallel (up to 4)                 │   │
│  │  3. Resume from last successful chunk on failure        │   │
│  │  4. Complete upload, receive file ID                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Chunked Upload Implementation

```typescript
class ChunkedUploader {
    private readonly CHUNK_SIZE = 5 * 1024 * 1024;  // 5 MB
    private readonly MAX_PARALLEL = 4;
    private readonly MAX_RETRIES = 3;
    
    /**
     * Upload large file in chunks
     */
    async upload(
        file: File,
        options: UploadOptions
    ): Promise<UploadResult> {
        // Step 1: Initialize upload session
        const session = await this.initializeSession(file, options);
        
        // Step 2: Split file into chunks
        const chunks = this.createChunks(file);
        
        // Step 3: Upload chunks with progress tracking
        const results = await this.uploadChunks(session, chunks, options.onProgress);
        
        // Step 4: Complete upload
        return await this.completeUpload(session);
    }
    
    /**
     * Initialize resumable upload session
     */
    private async initializeSession(
        file: File,
        options: UploadOptions
    ): Promise<UploadSession> {
        // Google Drive: resumable upload
        if (options.provider === 'google-drive') {
            const response = await fetch(
                'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${options.accessToken}`,
                        'Content-Type': 'application/json',
                        'X-Upload-Content-Type': file.type,
                        'X-Upload-Content-Length': file.size.toString()
                    },
                    body: JSON.stringify({
                        name: options.filename,
                        mimeType: file.type,
                        parents: options.parentId ? [options.parentId] : undefined
                    })
                }
            );
            
            return {
                uploadUrl: response.headers.get('Location')!,
                fileSize: file.size,
                uploadedBytes: 0
            };
        }
        
        // OneDrive: createUploadSession
        if (options.provider === 'onedrive') {
            const response = await fetch(
                `https://graph.microsoft.com/v1.0/me/drive/items/${options.parentId}:/${options.filename}:/createUploadSession`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${options.accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        item: {
                            '@microsoft.graph.conflictBehavior': 'rename'
                        }
                    })
                }
            );
            
            const data = await response.json();
            return {
                uploadUrl: data.uploadUrl,
                fileSize: file.size,
                uploadedBytes: 0
            };
        }
        
        throw new Error(`Unsupported provider: ${options.provider}`);
    }
    
    /**
     * Create chunks from file
     */
    private createChunks(file: File): Chunk[] {
        const chunks: Chunk[] = [];
        let offset = 0;
        let index = 0;
        
        while (offset < file.size) {
            const end = Math.min(offset + this.CHUNK_SIZE, file.size);
            chunks.push({
                index,
                start: offset,
                end,
                size: end - offset,
                blob: file.slice(offset, end),
                status: 'pending'
            });
            offset = end;
            index++;
        }
        
        return chunks;
    }
    
    /**
     * Upload chunks with parallel execution
     */
    private async uploadChunks(
        session: UploadSession,
        chunks: Chunk[],
        onProgress?: (progress: UploadProgress) => void
    ): Promise<void> {
        const queue = [...chunks];
        const inProgress = new Set<number>();
        const completed = new Set<number>();
        let totalUploaded = 0;
        
        return new Promise((resolve, reject) => {
            const processNext = async () => {
                while (inProgress.size < this.MAX_PARALLEL && queue.length > 0) {
                    const chunk = queue.shift()!;
                    inProgress.add(chunk.index);
                    
                    this.uploadChunk(session, chunk)
                        .then(() => {
                            inProgress.delete(chunk.index);
                            completed.add(chunk.index);
                            totalUploaded += chunk.size;
                            
                            onProgress?.({
                                uploadedBytes: totalUploaded,
                                totalBytes: session.fileSize,
                                percentage: (totalUploaded / session.fileSize) * 100,
                                chunksCompleted: completed.size,
                                chunksTotal: chunks.length
                            });
                            
                            if (completed.size === chunks.length) {
                                resolve();
                            } else {
                                processNext();
                            }
                        })
                        .catch((error) => {
                            // Retry logic
                            chunk.retries = (chunk.retries || 0) + 1;
                            if (chunk.retries < this.MAX_RETRIES) {
                                queue.unshift(chunk);  // Add back to front
                                inProgress.delete(chunk.index);
                                processNext();
                            } else {
                                reject(error);
                            }
                        });
                }
            };
            
            processNext();
        });
    }
    
    /**
     * Upload single chunk
     */
    private async uploadChunk(session: UploadSession, chunk: Chunk): Promise<void> {
        const response = await fetch(session.uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Range': `bytes ${chunk.start}-${chunk.end - 1}/${session.fileSize}`,
                'Content-Length': chunk.size.toString()
            },
            body: chunk.blob
        });
        
        if (!response.ok && response.status !== 308) {
            throw new Error(`Chunk upload failed: ${response.status}`);
        }
    }
}

interface Chunk {
    index: number;
    start: number;
    end: number;
    size: number;
    blob: Blob;
    status: 'pending' | 'uploading' | 'completed' | 'failed';
    retries?: number;
}

interface UploadProgress {
    uploadedBytes: number;
    totalBytes: number;
    percentage: number;
    chunksCompleted: number;
    chunksTotal: number;
}
```

### 2.3 Resume Upload

```typescript
class ResumableUpload {
    /**
     * Resume interrupted upload
     */
    async resume(session: UploadSession, file: File): Promise<UploadResult> {
        // Query how much was already uploaded
        const response = await fetch(session.uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Range': `bytes */${file.size}`
            }
        });
        
        if (response.status === 308) {
            // Get range header to know where to resume
            const range = response.headers.get('Range');
            if (range) {
                const match = range.match(/bytes=0-(\d+)/);
                session.uploadedBytes = match ? parseInt(match[1]) + 1 : 0;
            }
        } else if (response.ok) {
            // Upload already complete
            return await response.json();
        }
        
        // Resume from where we left off
        const remainingChunks = this.createChunks(file)
            .filter(c => c.start >= session.uploadedBytes);
        
        await this.uploadChunks(session, remainingChunks);
        return await this.completeUpload(session);
    }
    
    /**
     * Store session for later resume
     */
    async persistSession(session: UploadSession): Promise<void> {
        await this.db.uploadSessions.put({
            id: session.uploadUrl,
            ...session,
            persistedAt: Date.now()
        });
    }
    
    /**
     * Recover interrupted sessions on app load
     */
    async recoverSessions(): Promise<UploadSession[]> {
        const sessions = await this.db.uploadSessions.toArray();
        const validSessions: UploadSession[] = [];
        
        for (const session of sessions) {
            // Check if session is still valid (typically 7 days)
            if (Date.now() - session.persistedAt < 7 * 24 * 60 * 60 * 1000) {
                validSessions.push(session);
            } else {
                await this.db.uploadSessions.delete(session.id);
            }
        }
        
        return validSessions;
    }
}
```

---

## 3. Chunked Download

### 3.1 Overview

Download large files in chunks for resumability:

```typescript
class ChunkedDownloader {
    private readonly CHUNK_SIZE = 5 * 1024 * 1024;  // 5 MB
    
    /**
     * Download file with resume support
     */
    async download(
        url: string,
        options: DownloadOptions
    ): Promise<Blob> {
        // Get file size
        const headResponse = await fetch(url, { method: 'HEAD' });
        const totalSize = parseInt(headResponse.headers.get('Content-Length') || '0');
        
        if (totalSize === 0) {
            throw new Error('Cannot determine file size');
        }
        
        // Check for resume data
        const resumeData = await this.getResumeData(url);
        let downloadedChunks: ArrayBuffer[] = resumeData?.chunks || [];
        let downloadedBytes = resumeData?.downloadedBytes || 0;
        
        // Download remaining chunks
        while (downloadedBytes < totalSize) {
            const start = downloadedBytes;
            const end = Math.min(start + this.CHUNK_SIZE - 1, totalSize - 1);
            
            const chunk = await this.downloadChunk(url, start, end);
            downloadedChunks.push(chunk);
            downloadedBytes += chunk.byteLength;
            
            // Persist progress for resume
            await this.persistProgress(url, downloadedChunks, downloadedBytes);
            
            options.onProgress?.({
                downloadedBytes,
                totalBytes: totalSize,
                percentage: (downloadedBytes / totalSize) * 100
            });
        }
        
        // Combine chunks into blob
        const blob = new Blob(downloadedChunks);
        
        // Clear resume data
        await this.clearResumeData(url);
        
        return blob;
    }
    
    /**
     * Download single chunk with Range header
     */
    private async downloadChunk(
        url: string,
        start: number,
        end: number
    ): Promise<ArrayBuffer> {
        const response = await fetch(url, {
            headers: {
                'Range': `bytes=${start}-${end}`
            }
        });
        
        if (response.status !== 206) {
            throw new Error(`Expected 206 Partial Content, got ${response.status}`);
        }
        
        return await response.arrayBuffer();
    }
}
```

### 3.2 Streaming Download to OPFS

For very large files, stream directly to Origin Private File System:

```typescript
class StreamingDownloader {
    /**
     * Stream download directly to OPFS (avoids memory pressure)
     */
    async downloadToOPFS(
        url: string,
        filename: string,
        onProgress?: (progress: DownloadProgress) => void
    ): Promise<FileSystemFileHandle> {
        // Get OPFS root
        const opfsRoot = await navigator.storage.getDirectory();
        const tempDir = await opfsRoot.getDirectoryHandle('downloads', { create: true });
        const fileHandle = await tempDir.getFileHandle(filename, { create: true });
        
        // Create writable stream
        const writable = await fileHandle.createWritable();
        
        // Fetch with streaming
        const response = await fetch(url);
        const reader = response.body!.getReader();
        const contentLength = parseInt(response.headers.get('Content-Length') || '0');
        
        let receivedBytes = 0;
        
        try {
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;
                
                await writable.write(value);
                receivedBytes += value.length;
                
                onProgress?.({
                    downloadedBytes: receivedBytes,
                    totalBytes: contentLength,
                    percentage: contentLength ? (receivedBytes / contentLength) * 100 : 0
                });
            }
        } finally {
            await writable.close();
        }
        
        return fileHandle;
    }
}
```

---

## 4. Streaming from ZIP

### 4.1 Byte-Range Access

Read specific files from ZIP without downloading entire archive:

```typescript
class ZipByteRangeReader {
    private centralDirectory: ZipCentralDirectory | null = null;
    
    /**
     * Read ZIP central directory from end of file
     */
    async loadCentralDirectory(url: string): Promise<void> {
        // Read last 64KB (should contain central directory)
        const size = await this.getFileSize(url);
        const endBytes = await this.readRange(url, size - 65536, size - 1);
        
        // Parse central directory
        this.centralDirectory = this.parseCentralDirectory(endBytes);
    }
    
    /**
     * Read specific file from ZIP via byte-range
     */
    async readFile(url: string, path: string): Promise<Blob> {
        if (!this.centralDirectory) {
            await this.loadCentralDirectory(url);
        }
        
        const entry = this.centralDirectory!.entries.get(path);
        if (!entry) {
            throw new Error(`File not found in ZIP: ${path}`);
        }
        
        // Read compressed data
        const compressed = await this.readRange(
            url,
            entry.localHeaderOffset,
            entry.localHeaderOffset + entry.compressedSize + 30 + entry.filenameLength
        );
        
        // Decompress if needed
        if (entry.compressionMethod === 0) {
            // Stored (uncompressed) - extract directly
            return new Blob([compressed.slice(30 + entry.filenameLength)]);
        } else if (entry.compressionMethod === 8) {
            // Deflate - decompress
            return await this.inflate(compressed.slice(30 + entry.filenameLength));
        }
        
        throw new Error(`Unsupported compression: ${entry.compressionMethod}`);
    }
    
    /**
     * Read byte range via HTTP Range request
     */
    private async readRange(url: string, start: number, end: number): Promise<ArrayBuffer> {
        const response = await fetch(url, {
            headers: {
                'Range': `bytes=${start}-${end}`
            }
        });
        
        if (response.status !== 206) {
            throw new Error(`Range request failed: ${response.status}`);
        }
        
        return await response.arrayBuffer();
    }
}
```

### 4.2 Manifest-Based Access

Use manifest for fast asset lookup:

```typescript
class ManifestBasedZipReader {
    private manifest: Manifest;
    
    /**
     * Read asset using manifest byte offsets
     */
    async readAsset(url: string, assetId: string): Promise<Blob> {
        const assetInfo = this.manifest.assetIndex[assetId];
        
        if (!assetInfo) {
            throw new Error(`Asset not found: ${assetId}`);
        }
        
        // Use pre-calculated byte offset from manifest
        const data = await this.readRange(
            url,
            assetInfo.byteOffset,
            assetInfo.byteOffset + assetInfo.byteLength - 1
        );
        
        return new Blob([data], { type: assetInfo.mimeType });
    }
    
    /**
     * Stream video directly from ZIP
     */
    createVideoStream(url: string, assetId: string): ReadableStream {
        const assetInfo = this.manifest.assetIndex[assetId];
        
        return new ReadableStream({
            start: async (controller) => {
                // Implementation for streaming video chunks
            },
            
            pull: async (controller) => {
                // Fetch next chunk
            }
        });
    }
}
```

---

## 5. Video Handling

### 5.1 Video Size Strategy

```typescript
const VIDEO_STRATEGY = {
    // Below 50MB: embed in .str, preload
    small: {
        maxSize: 50 * 1024 * 1024,
        storage: 'embedded',
        preload: 'metadata'
    },
    
    // 50MB - 200MB: embed in .str, stream
    medium: {
        maxSize: 200 * 1024 * 1024,
        storage: 'embedded',
        preload: 'none',
        stream: true
    },
    
    // Above 200MB: external storage, stream only
    large: {
        storage: 'external',
        preload: 'none',
        stream: true,
        cdn: true
    }
};
```

### 5.2 Video Streaming Implementation

```typescript
class VideoStreamer {
    /**
     * Create video element that streams from ZIP
     */
    createStreamingVideo(
        zipUrl: string,
        assetInfo: AssetInfo
    ): HTMLVideoElement {
        const video = document.createElement('video');
        
        // Create MediaSource for adaptive streaming
        const mediaSource = new MediaSource();
        video.src = URL.createObjectURL(mediaSource);
        
        mediaSource.addEventListener('sourceopen', async () => {
            const sourceBuffer = mediaSource.addSourceBuffer(assetInfo.mimeType);
            
            // Stream video in chunks
            let offset = assetInfo.byteOffset;
            const chunkSize = 2 * 1024 * 1024;  // 2MB chunks
            
            while (offset < assetInfo.byteOffset + assetInfo.byteLength) {
                // Wait for buffer space
                while (sourceBuffer.updating || 
                       sourceBuffer.buffered.length > 0 && 
                       sourceBuffer.buffered.end(0) - video.currentTime > 30) {
                    await this.sleep(100);
                }
                
                // Fetch next chunk
                const end = Math.min(
                    offset + chunkSize,
                    assetInfo.byteOffset + assetInfo.byteLength
                );
                
                const chunk = await this.readRange(zipUrl, offset, end - 1);
                sourceBuffer.appendBuffer(chunk);
                
                offset = end;
            }
            
            mediaSource.endOfStream();
        });
        
        return video;
    }
}
```

### 5.3 Video Thumbnail Generation

```typescript
class VideoThumbnailGenerator {
    /**
     * Generate thumbnail from video without loading full file
     */
    async generateThumbnail(
        videoUrl: string,
        assetInfo: AssetInfo,
        time: number = 0
    ): Promise<Blob> {
        // Create video element
        const video = document.createElement('video');
        video.muted = true;
        video.preload = 'metadata';
        
        // Set source with time fragment
        video.src = videoUrl + `#t=${time}`;
        
        return new Promise((resolve, reject) => {
            video.addEventListener('loadeddata', () => {
                // Seek to desired time
                video.currentTime = time;
            });
            
            video.addEventListener('seeked', () => {
                // Draw to canvas
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                
                const ctx = canvas.getContext('2d')!;
                ctx.drawImage(video, 0, 0);
                
                canvas.toBlob((blob) => {
                    URL.revokeObjectURL(video.src);
                    resolve(blob!);
                }, 'image/jpeg', 0.8);
            });
            
            video.addEventListener('error', reject);
        });
    }
}
```

---

## 6. Memory Management

### 6.1 LRU Cache for Blobs

```typescript
class BlobLRUCache {
    private cache = new Map<string, CacheEntry>();
    private totalSize = 0;
    private readonly maxSize: number;
    
    constructor(maxSizeBytes: number) {
        this.maxSize = maxSizeBytes;
    }
    
    /**
     * Get blob from cache
     */
    get(key: string): Blob | null {
        const entry = this.cache.get(key);
        if (!entry) return null;
        
        // Update access time (move to end)
        this.cache.delete(key);
        entry.lastAccess = Date.now();
        this.cache.set(key, entry);
        
        return entry.blob;
    }
    
    /**
     * Add blob to cache
     */
    set(key: string, blob: Blob): void {
        // Evict if necessary
        while (this.totalSize + blob.size > this.maxSize && this.cache.size > 0) {
            this.evictOldest();
        }
        
        // Don't cache if too large
        if (blob.size > this.maxSize * 0.5) {
            console.log('Blob too large to cache:', blob.size);
            return;
        }
        
        this.cache.set(key, {
            blob,
            size: blob.size,
            lastAccess: Date.now()
        });
        this.totalSize += blob.size;
    }
    
    /**
     * Evict least recently used entry
     */
    private evictOldest(): void {
        const oldest = this.cache.keys().next().value;
        if (oldest) {
            const entry = this.cache.get(oldest)!;
            this.totalSize -= entry.size;
            this.cache.delete(oldest);
        }
    }
    
    /**
     * Clear cache
     */
    clear(): void {
        this.cache.clear();
        this.totalSize = 0;
    }
    
    /**
     * Get cache statistics
     */
    getStats(): CacheStats {
        return {
            entryCount: this.cache.size,
            totalSize: this.totalSize,
            maxSize: this.maxSize,
            utilization: this.totalSize / this.maxSize
        };
    }
}
```

### 6.2 Memory Pressure Handler

```typescript
class MemoryPressureHandler {
    private isLowMemory = false;
    
    constructor() {
        // Monitor memory pressure
        if ('memory' in navigator) {
            this.startMemoryMonitor();
        }
    }
    
    private startMemoryMonitor(): void {
        setInterval(() => {
            const memory = (navigator as any).memory;
            const usedHeap = memory.usedJSHeapSize;
            const totalHeap = memory.totalJSHeapSize;
            const limit = memory.jsHeapSizeLimit;
            
            // Check if we're using too much memory
            if (usedHeap > limit * 0.8) {
                this.handleHighMemory();
            } else if (usedHeap > limit * 0.6) {
                this.handleMediumMemory();
            } else {
                this.isLowMemory = false;
            }
        }, 5000);
    }
    
    private handleHighMemory(): void {
        console.warn('High memory pressure detected');
        this.isLowMemory = true;
        
        // Aggressive cleanup
        this.blobCache.clear();
        this.imageCache.evict(0.5);  // Evict 50%
        this.videoBuffers.flush();
        
        // Force garbage collection hint
        if (window.gc) window.gc();
    }
    
    private handleMediumMemory(): void {
        // Gentle cleanup
        this.blobCache.evict(0.2);   // Evict 20%
        this.imageCache.evict(0.1);  // Evict 10%
    }
    
    /**
     * Check if we should avoid loading large files
     */
    shouldDeferLargeFile(sizeBytes: number): boolean {
        if (this.isLowMemory && sizeBytes > 10 * 1024 * 1024) {
            return true;
        }
        return false;
    }
}
```

---

## 7. Progress & Cancellation

### 7.1 Progress Tracking

```typescript
interface TransferProgress {
    type: 'upload' | 'download';
    filename: string;
    bytesTransferred: number;
    totalBytes: number;
    percentage: number;
    speed: number;           // bytes per second
    remainingTime: number;   // seconds
    status: 'pending' | 'active' | 'paused' | 'completed' | 'failed';
}

class TransferProgressTracker {
    private transfers = new Map<string, TransferState>();
    
    /**
     * Start tracking a transfer
     */
    startTransfer(id: string, totalBytes: number, type: 'upload' | 'download'): void {
        this.transfers.set(id, {
            id,
            type,
            totalBytes,
            bytesTransferred: 0,
            startTime: Date.now(),
            samples: []
        });
    }
    
    /**
     * Update transfer progress
     */
    updateProgress(id: string, bytesTransferred: number): TransferProgress {
        const state = this.transfers.get(id)!;
        state.bytesTransferred = bytesTransferred;
        
        // Calculate speed using sliding window
        const now = Date.now();
        state.samples.push({ time: now, bytes: bytesTransferred });
        
        // Keep last 5 seconds of samples
        state.samples = state.samples.filter(s => now - s.time < 5000);
        
        const speed = this.calculateSpeed(state.samples);
        const remainingBytes = state.totalBytes - bytesTransferred;
        const remainingTime = speed > 0 ? remainingBytes / speed : 0;
        
        return {
            type: state.type,
            filename: state.filename,
            bytesTransferred,
            totalBytes: state.totalBytes,
            percentage: (bytesTransferred / state.totalBytes) * 100,
            speed,
            remainingTime,
            status: bytesTransferred >= state.totalBytes ? 'completed' : 'active'
        };
    }
    
    private calculateSpeed(samples: Sample[]): number {
        if (samples.length < 2) return 0;
        
        const first = samples[0];
        const last = samples[samples.length - 1];
        const timeDiff = (last.time - first.time) / 1000;
        const bytesDiff = last.bytes - first.bytes;
        
        return timeDiff > 0 ? bytesDiff / timeDiff : 0;
    }
}
```

### 7.2 Cancellation

```typescript
class CancellableTransfer {
    private abortController: AbortController;
    
    constructor() {
        this.abortController = new AbortController();
    }
    
    /**
     * Cancel the transfer
     */
    cancel(): void {
        this.abortController.abort();
    }
    
    /**
     * Get abort signal for fetch
     */
    get signal(): AbortSignal {
        return this.abortController.signal;
    }
    
    /**
     * Upload with cancellation support
     */
    async upload(url: string, data: Blob): Promise<Response> {
        return fetch(url, {
            method: 'PUT',
            body: data,
            signal: this.signal
        });
    }
}

// Usage
const transfer = new CancellableTransfer();

// Start upload
const uploadPromise = transfer.upload(url, data);

// Cancel if user clicks cancel button
cancelButton.onclick = () => {
    transfer.cancel();
};

try {
    await uploadPromise;
} catch (error) {
    if (error.name === 'AbortError') {
        console.log('Upload cancelled by user');
    }
}
```

---

## 8. Error Recovery

### 8.1 Network Error Handling

```typescript
class NetworkErrorHandler {
    /**
     * Retry with exponential backoff
     */
    async retryWithBackoff<T>(
        operation: () => Promise<T>,
        maxRetries: number = 3
    ): Promise<T> {
        let lastError: Error | null = null;
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error as Error;
                
                // Don't retry non-network errors
                if (!this.isNetworkError(error)) {
                    throw error;
                }
                
                // Wait before retry
                const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
                await this.sleep(delay);
            }
        }
        
        throw lastError;
    }
    
    private isNetworkError(error: any): boolean {
        return (
            error.name === 'TypeError' ||  // Network failure
            error.name === 'AbortError' ||  // Timeout
            (error.status >= 500 && error.status < 600)  // Server error
        );
    }
}
```

### 8.2 Partial Upload Recovery

```typescript
class PartialUploadRecovery {
    /**
     * Check and recover partial uploads on app startup
     */
    async recoverPartialUploads(): Promise<void> {
        const pendingSessions = await this.db.uploadSessions.toArray();
        
        for (const session of pendingSessions) {
            const choice = await this.ui.promptRecovery({
                filename: session.filename,
                progress: session.uploadedBytes / session.fileSize * 100,
                startedAt: session.startedAt
            });
            
            if (choice === 'resume') {
                const file = await this.getLocalFile(session.localFileId);
                if (file) {
                    await this.uploader.resume(session, file);
                } else {
                    await this.ui.showError('Original file not found');
                }
            } else if (choice === 'cancel') {
                await this.cancelSession(session);
            }
        }
    }
    
    /**
     * Cancel and cleanup partial upload
     */
    private async cancelSession(session: UploadSession): Promise<void> {
        // Cancel upload on server
        try {
            await fetch(session.uploadUrl, { method: 'DELETE' });
        } catch {
            // Ignore - session may have expired
        }
        
        // Remove from local database
        await this.db.uploadSessions.delete(session.id);
    }
}
```

---

## 9. Implementation

### 9.1 LargeFileManager Class

```typescript
class LargeFileManager {
    private uploader: ChunkedUploader;
    private downloader: ChunkedDownloader;
    private blobCache: BlobLRUCache;
    private memoryHandler: MemoryPressureHandler;
    private progressTracker: TransferProgressTracker;
    
    constructor() {
        this.uploader = new ChunkedUploader();
        this.downloader = new ChunkedDownloader();
        this.blobCache = new BlobLRUCache(MEMORY_BUDGETS.blobCache);
        this.memoryHandler = new MemoryPressureHandler();
        this.progressTracker = new TransferProgressTracker();
    }
    
    /**
     * Upload file with appropriate strategy
     */
    async uploadFile(file: File, options: UploadOptions): Promise<UploadResult> {
        if (file.size > SIZE_THRESHOLDS.largeFile) {
            // Large file: chunked upload with resume
            return await this.uploader.upload(file, {
                ...options,
                onProgress: (progress) => {
                    this.progressTracker.updateProgress(file.name, progress.uploadedBytes);
                    options.onProgress?.(progress);
                }
            });
        } else {
            // Small file: direct upload
            return await this.directUpload(file, options);
        }
    }
    
    /**
     * Download file with appropriate strategy
     */
    async downloadFile(url: string, options: DownloadOptions): Promise<Blob> {
        const size = await this.getFileSize(url);
        
        if (size > SIZE_THRESHOLDS.largeFile) {
            // Large file: chunked download
            return await this.downloader.download(url, options);
        } else if (size > SIZE_THRESHOLDS.mediumFile) {
            // Medium file: stream to OPFS
            const handle = await this.streamToOPFS(url, options);
            return await handle.getFile();
        } else {
            // Small file: direct download
            return await this.directDownload(url);
        }
    }
    
    /**
     * Get cached blob or download
     */
    async getBlob(url: string, cacheKey: string): Promise<Blob> {
        // Check cache first
        const cached = this.blobCache.get(cacheKey);
        if (cached) return cached;
        
        // Download
        const blob = await this.downloadFile(url, {});
        
        // Cache if small enough
        if (blob.size < SIZE_THRESHOLDS.mediumFile) {
            this.blobCache.set(cacheKey, blob);
        }
        
        return blob;
    }
}
```

---

## Summary

| File Size | Strategy | Memory | Resume |
|-----------|----------|--------|--------|
| < 2 MB | Direct load | In memory | No |
| 2-50 MB | Cache | LRU cache | Optional |
| 50-100 MB | Stream | Minimal | Yes |
| > 100 MB | OPFS/Stream | None | Yes |

| Operation | Implementation |
|-----------|----------------|
| Upload | Chunked, resumable sessions |
| Download | Range requests, streaming |
| ZIP access | Byte-range, manifest |
| Video | MediaSource streaming |

---

## Related Documents

- [File Format & Storage](./file-format-storage.md)
- [Asset Management](./asset-management.md)
- [Memory Management](./memory-management.md)
- [Progressive Loading](./progressive-loading.md)

---

*Large file handling ensures Story can work with media-rich presentations without exhausting browser resources.*
