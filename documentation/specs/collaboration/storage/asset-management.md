# Asset Management & Caching - Specification

## Overview

This specification defines the asset pipeline including import, optimization, caching, and memory management for Story presentations.

**Related Specifications:**
- [Memory Management](./memory-management.md) - Comprehensive memory strategy
- [Progressive Loading](./progressive-loading.md) - Streaming and phased loading
- [Presentation Performance and Caching](../../slides/presentation-mode/02-performance-and-caching.md) - Presentation-specific caching

---

## 1. Asset Pipeline

### Import Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    User Drops File                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Validation & Type Detection                 │
│  • Check file signature (magic bytes)                        │
│  • Verify file size within limits                            │
│  • Detect actual MIME type                                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Hash Computation                          │
│  • SHA-256 hash of file content                              │
│  • Check for duplicates in asset index                       │
│  • Skip if already exists (deduplication)                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Optimization                              │
│  • Image: resize if > 4K, convert to WebP                   │
│  • Video: extract poster frame                               │
│  • Generate multiple sizes for responsive loading            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Registration                              │
│  • Create asset entry with metadata                          │
│  • Generate blob URL for immediate use                       │
│  • Store in appropriate cache layer                          │
└─────────────────────────────────────────────────────────────┘
```

### Asset Metadata

```javascript
interface AssetMetadata {
    id: string;              // Unique identifier (hash-based)
    originalName: string;    // User's filename
    type: string;            // MIME type
    size: number;            // Original size in bytes
    hash: string;            // SHA-256 hash
    
    // Image-specific
    dimensions?: {
        width: number;
        height: number;
    };
    
    // Video-specific
    duration?: number;       // Seconds
    hasAudio?: boolean;
    posterFrame?: string;    // Asset ID of poster image
    
    // Processing info
    optimized?: {
        format: string;      // e.g., 'webp'
        size: number;
        savedBytes: number;
    };
    
    // Variants (responsive images)
    variants?: {
        sm: string;          // Asset ID for small version
        md: string;          // Asset ID for medium version
        lg: string;          // Asset ID for large version
    };
    
    // Usage tracking
    references: string[];    // Element paths using this asset
    lastUsed: string;        // ISO timestamp
    
    // Source info
    importedAt: string;      // ISO timestamp
    source?: 'local' | 'url' | 'cloud';
    sourceUrl?: string;      // If imported from URL
}
```

---

## 2. Image Optimization

### Automatic Resizing

```javascript
const IMAGE_SIZE_LIMITS = {
    maxWidth: 4096,
    maxHeight: 4096,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    
    // Responsive variants
    variants: {
        sm: { maxWidth: 400, maxHeight: 300 },
        md: { maxWidth: 800, maxHeight: 600 },
        lg: { maxWidth: 1600, maxHeight: 1200 }
    }
};

class ImageOptimizer {
    async optimize(file) {
        const img = await this.loadImage(file);
        
        // Check if optimization needed
        const needsResize = img.width > IMAGE_SIZE_LIMITS.maxWidth || 
                           img.height > IMAGE_SIZE_LIMITS.maxHeight;
        const needsConvert = !['image/webp', 'image/avif'].includes(file.type);
        
        if (!needsResize && !needsConvert && file.size < IMAGE_SIZE_LIMITS.maxFileSize) {
            return { original: file, variants: {} };
        }
        
        // Create optimized version
        const optimized = await this.resizeAndConvert(img, {
            maxWidth: IMAGE_SIZE_LIMITS.maxWidth,
            maxHeight: IMAGE_SIZE_LIMITS.maxHeight,
            format: 'webp',
            quality: 0.85
        });
        
        // Create responsive variants
        const variants = {};
        for (const [size, limits] of Object.entries(IMAGE_SIZE_LIMITS.variants)) {
            if (img.width > limits.maxWidth || img.height > limits.maxHeight) {
                variants[size] = await this.resizeAndConvert(img, {
                    maxWidth: limits.maxWidth,
                    maxHeight: limits.maxHeight,
                    format: 'webp',
                    quality: 0.80
                });
            }
        }
        
        return { optimized, variants };
    }
    
    async resizeAndConvert(img, options) {
        const canvas = new OffscreenCanvas(1, 1);
        const ctx = canvas.getContext('2d');
        
        // Calculate dimensions maintaining aspect ratio
        const scale = Math.min(
            options.maxWidth / img.width,
            options.maxHeight / img.height,
            1 // Don't upscale
        );
        
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        
        // Draw resized image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Convert to WebP
        const blob = await canvas.convertToBlob({
            type: 'image/webp',
            quality: options.quality
        });
        
        return blob;
    }
}
```

### Video Processing

```javascript
class VideoProcessor {
    async process(file) {
        const video = await this.loadVideo(file);
        
        // Extract metadata
        const metadata = {
            duration: video.duration,
            dimensions: { width: video.videoWidth, height: video.videoHeight },
            hasAudio: this.hasAudioTrack(video)
        };
        
        // Extract poster frame (first frame or middle frame)
        const posterFrame = await this.extractFrame(video, video.duration / 2);
        
        // For large videos, we don't re-encode (too slow in browser)
        // Just store original and let streaming handle it
        
        return {
            original: file,
            posterFrame,
            metadata
        };
    }
    
    async extractFrame(video, time) {
        const canvas = new OffscreenCanvas(video.videoWidth, video.videoHeight);
        const ctx = canvas.getContext('2d');
        
        // Seek to time
        video.currentTime = time;
        await new Promise(resolve => video.onseeked = resolve);
        
        // Draw frame
        ctx.drawImage(video, 0, 0);
        
        // Convert to WebP
        return canvas.convertToBlob({ type: 'image/webp', quality: 0.85 });
    }
}
```

---

## 3. Cache Architecture

### Multi-Layer Cache

```
┌─────────────────────────────────────────────────────────────┐
│  L1: Memory Cache (LRU)                                      │
│  • Size: 100MB default (configurable)                        │
│  • Contents: Active slide assets, thumbnails                 │
│  • Eviction: LRU when at capacity                           │
│  • Access: < 1ms                                             │
├─────────────────────────────────────────────────────────────┤
│  L2: IndexedDB                                               │
│  • Size: Up to 1GB (browser-dependent)                       │
│  • Contents: All loaded assets, presentation data            │
│  • Eviction: Age-based + size-based                         │
│  • Access: 5-50ms                                            │
├─────────────────────────────────────────────────────────────┤
│  L3: OPFS (Origin Private File System)                       │
│  • Size: Large, separate quota                               │
│  • Contents: Large videos, high-res images                   │
│  • Eviction: Manual / on presentation close                  │
│  • Access: 10-100ms                                          │
├─────────────────────────────────────────────────────────────┤
│  L4: Source (File / Cloud)                                   │
│  • Contents: Original .str file or cloud storage            │
│  • Access: 100ms - seconds (network)                        │
└─────────────────────────────────────────────────────────────┘
```

### Cache Manager Implementation

```javascript
class AssetCacheManager {
    constructor() {
        this.l1 = new LRUCache({ maxSize: 100 * 1024 * 1024 }); // 100MB
        this.l2 = null; // IndexedDB, initialized async
        this.l3 = null; // OPFS, initialized async
        
        this.pending = new Map(); // Prevent duplicate fetches
    }
    
    async initialize() {
        // Initialize IndexedDB
        this.l2 = await this.openIndexedDB();
        
        // Initialize OPFS if available
        if ('storage' in navigator && 'getDirectory' in navigator.storage) {
            try {
                this.l3 = await navigator.storage.getDirectory();
            } catch (e) {
                console.warn('OPFS not available:', e);
            }
        }
    }
    
    async get(assetId, options = {}) {
        // Check L1 (memory)
        let data = this.l1.get(assetId);
        if (data) {
            this.recordHit('l1', assetId);
            return data;
        }
        
        // Prevent duplicate fetches
        if (this.pending.has(assetId)) {
            return this.pending.get(assetId);
        }
        
        const promise = this.fetchFromLowerLayers(assetId, options);
        this.pending.set(assetId, promise);
        
        try {
            data = await promise;
            return data;
        } finally {
            this.pending.delete(assetId);
        }
    }
    
    async fetchFromLowerLayers(assetId, options) {
        // Check L2 (IndexedDB)
        let data = await this.l2Get(assetId);
        if (data) {
            this.recordHit('l2', assetId);
            this.l1.set(assetId, data);
            return data;
        }
        
        // Check L3 (OPFS) for large files
        if (this.l3) {
            data = await this.l3Get(assetId);
            if (data) {
                this.recordHit('l3', assetId);
                // Don't promote large files to L1
                if (data.size < 10 * 1024 * 1024) {
                    this.l1.set(assetId, data);
                }
                return data;
            }
        }
        
        // Fetch from source (L4)
        data = await options.fetchFromSource(assetId);
        if (data) {
            await this.store(assetId, data);
        }
        
        return data;
    }
    
    async store(assetId, data) {
        const size = data.size || data.byteLength;
        
        // Small/medium: L1 + L2
        if (size < 10 * 1024 * 1024) {
            this.l1.set(assetId, data);
            await this.l2Set(assetId, data);
        } 
        // Large: L3 only
        else if (this.l3) {
            await this.l3Set(assetId, data);
        } 
        // Fallback: L2 only
        else {
            await this.l2Set(assetId, data);
        }
    }
    
    // OPFS operations
    async l3Set(assetId, data) {
        const handle = await this.l3.getFileHandle(assetId, { create: true });
        const writable = await handle.createWritable();
        await writable.write(data);
        await writable.close();
    }
    
    async l3Get(assetId) {
        try {
            const handle = await this.l3.getFileHandle(assetId);
            const file = await handle.getFile();
            return file;
        } catch (e) {
            return null;
        }
    }
}
```

### LRU Cache Implementation

```javascript
class LRUCache {
    constructor({ maxSize }) {
        this.maxSize = maxSize;
        this.currentSize = 0;
        this.map = new Map(); // key -> { data, size }
        this.order = []; // Most recent at end
    }
    
    get(key) {
        const entry = this.map.get(key);
        if (!entry) return null;
        
        // Move to end (most recently used)
        this.order = this.order.filter(k => k !== key);
        this.order.push(key);
        
        return entry.data;
    }
    
    set(key, data) {
        const size = this.getSize(data);
        
        // Evict until we have space
        while (this.currentSize + size > this.maxSize && this.order.length > 0) {
            this.evictOldest();
        }
        
        // Remove existing entry if present
        if (this.map.has(key)) {
            this.currentSize -= this.map.get(key).size;
            this.order = this.order.filter(k => k !== key);
        }
        
        // Add new entry
        this.map.set(key, { data, size });
        this.order.push(key);
        this.currentSize += size;
    }
    
    evictOldest() {
        const key = this.order.shift();
        if (key) {
            const entry = this.map.get(key);
            this.currentSize -= entry.size;
            this.map.delete(key);
            
            // Revoke blob URL if applicable
            if (entry.data instanceof Blob) {
                URL.revokeObjectURL(entry.blobUrl);
            }
        }
    }
    
    getSize(data) {
        if (data instanceof Blob) return data.size;
        if (data instanceof ArrayBuffer) return data.byteLength;
        if (typeof data === 'string') return data.length * 2;
        return JSON.stringify(data).length * 2;
    }
}
```

---

## 4. Memory Management

### Memory Budget

```javascript
const MEMORY_BUDGETS = {
    // L1 cache limits
    thumbnails: 20 * 1024 * 1024,      // 20MB
    images: 80 * 1024 * 1024,          // 80MB
    slideData: 20 * 1024 * 1024,       // 20MB
    computed: 30 * 1024 * 1024,        // 30MB (rendered canvases)
    
    // Total L1
    total: 150 * 1024 * 1024,          // 150MB
    
    // Videos never in L1 (stream from L3/L4)
    videos: 0
};

class MemoryManager {
    constructor() {
        this.budgets = { ...MEMORY_BUDGETS };
        this.usage = {
            thumbnails: 0,
            images: 0,
            slideData: 0,
            computed: 0
        };
    }
    
    canAllocate(category, size) {
        const available = this.budgets[category] - this.usage[category];
        const totalAvailable = this.budgets.total - this.getTotalUsage();
        
        return size <= available && size <= totalAvailable;
    }
    
    allocate(category, size) {
        if (!this.canAllocate(category, size)) {
            this.evictCategory(category, size);
        }
        
        this.usage[category] += size;
    }
    
    free(category, size) {
        this.usage[category] = Math.max(0, this.usage[category] - size);
    }
    
    getTotalUsage() {
        return Object.values(this.usage).reduce((a, b) => a + b, 0);
    }
    
    getStats() {
        return {
            usage: { ...this.usage },
            budgets: { ...this.budgets },
            totalUsage: this.getTotalUsage(),
            percentUsed: (this.getTotalUsage() / this.budgets.total) * 100
        };
    }
}
```

### Garbage Collection

```javascript
class AssetGarbageCollector {
    constructor(assetManager) {
        this.assetManager = assetManager;
        this.interval = null;
    }
    
    start() {
        // Run GC every 5 minutes
        this.interval = setInterval(() => this.collect(), 5 * 60 * 1000);
    }
    
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
    
    async collect() {
        // Find unreferenced assets
        const allAssets = await this.assetManager.getAllAssetIds();
        const referencedAssets = this.getReferencedAssets();
        
        const orphans = allAssets.filter(id => !referencedAssets.has(id));
        
        // Remove orphaned assets from cache
        for (const assetId of orphans) {
            await this.assetManager.remove(assetId);
        }
        
        console.log(`GC: Removed ${orphans.length} unreferenced assets`);
    }
    
    getReferencedAssets() {
        const state = store.getState();
        const referenced = new Set();
        
        // Walk through all slides and elements
        for (const slide of Object.values(state.slides)) {
            for (const element of Object.values(slide.elements)) {
                this.collectAssetReferences(element, referenced);
            }
        }
        
        // Also check masters
        for (const master of Object.values(state.masters)) {
            for (const element of Object.values(master.elements)) {
                this.collectAssetReferences(element, referenced);
            }
        }
        
        return referenced;
    }
    
    collectAssetReferences(element, referenced) {
        // Check fills
        if (element.style?.fills) {
            for (const fill of element.style.fills) {
                if (fill.assetId) referenced.add(fill.assetId);
            }
        }
        
        // Check background
        if (element.style?.backgroundAssetId) {
            referenced.add(element.style.backgroundAssetId);
        }
        
        // Check children
        if (element.children) {
            for (const child of element.children) {
                this.collectAssetReferences(child, referenced);
            }
        }
    }
}
```

---

## 5. Prefetching

### Slide-Based Prefetching

```javascript
class AssetPrefetcher {
    constructor(cacheManager) {
        this.cacheManager = cacheManager;
        this.prefetchQueue = [];
        this.isPrefetching = false;
    }
    
    onSlideChange(currentSlideIndex, totalSlides) {
        // Clear existing queue
        this.prefetchQueue = [];
        
        // Prefetch adjacent slides
        const adjacentSlides = [
            currentSlideIndex - 1,
            currentSlideIndex + 1,
            currentSlideIndex - 2,
            currentSlideIndex + 2
        ].filter(i => i >= 0 && i < totalSlides);
        
        for (const slideIndex of adjacentSlides) {
            const assets = this.getSlideAssets(slideIndex);
            for (const assetId of assets) {
                this.prefetchQueue.push({
                    assetId,
                    priority: Math.abs(slideIndex - currentSlideIndex)
                });
            }
        }
        
        // Sort by priority (closest slides first)
        this.prefetchQueue.sort((a, b) => a.priority - b.priority);
        
        this.startPrefetching();
    }
    
    async startPrefetching() {
        if (this.isPrefetching) return;
        this.isPrefetching = true;
        
        while (this.prefetchQueue.length > 0) {
            const { assetId } = this.prefetchQueue.shift();
            
            // Check if already cached
            if (await this.cacheManager.has(assetId)) continue;
            
            // Prefetch in background
            try {
                await this.cacheManager.get(assetId, { 
                    priority: 'low',
                    prefetch: true 
                });
            } catch (e) {
                console.warn('Prefetch failed:', assetId, e);
            }
            
            // Yield to other tasks
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        this.isPrefetching = false;
    }
    
    getSlideAssets(slideIndex) {
        const state = store.getState();
        const slideId = state.slides.order[slideIndex];
        const slide = state.slides[slideId];
        
        const assets = [];
        
        for (const element of Object.values(slide.elements)) {
            if (element.style?.fills) {
                for (const fill of element.style.fills) {
                    if (fill.assetId) assets.push(fill.assetId);
                }
            }
        }
        
        return assets;
    }
}
```

### Network-Aware Prefetching

```javascript
class NetworkAwarePrefetcher extends AssetPrefetcher {
    constructor(cacheManager) {
        super(cacheManager);
        this.connection = navigator.connection;
    }
    
    shouldPrefetch() {
        // Don't prefetch on slow connections
        if (this.connection) {
            if (this.connection.saveData) return false;
            if (this.connection.effectiveType === '2g') return false;
            if (this.connection.effectiveType === 'slow-2g') return false;
        }
        
        return true;
    }
    
    getPrefetchLimit() {
        if (!this.connection) return 5; // Default
        
        switch (this.connection.effectiveType) {
            case '4g': return 10;
            case '3g': return 3;
            default: return 1;
        }
    }
}
```

---

## 6. Blob URL Management

### Blob URL Registry

```javascript
class BlobUrlRegistry {
    constructor() {
        this.urls = new Map(); // assetId -> { url, refCount, createdAt }
    }
    
    getUrl(assetId, blob) {
        if (this.urls.has(assetId)) {
            const entry = this.urls.get(assetId);
            entry.refCount++;
            return entry.url;
        }
        
        const url = URL.createObjectURL(blob);
        this.urls.set(assetId, {
            url,
            refCount: 1,
            createdAt: Date.now()
        });
        
        return url;
    }
    
    release(assetId) {
        const entry = this.urls.get(assetId);
        if (!entry) return;
        
        entry.refCount--;
        
        if (entry.refCount <= 0) {
            URL.revokeObjectURL(entry.url);
            this.urls.delete(assetId);
        }
    }
    
    releaseAll() {
        for (const [assetId, entry] of this.urls) {
            URL.revokeObjectURL(entry.url);
        }
        this.urls.clear();
    }
    
    getStats() {
        return {
            totalUrls: this.urls.size,
            entries: Array.from(this.urls.entries()).map(([id, entry]) => ({
                assetId: id,
                refCount: entry.refCount,
                age: Date.now() - entry.createdAt
            }))
        };
    }
}
```

---

## 7. Storage Quota Management

```javascript
class StorageQuotaManager {
    async getQuota() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            return {
                usage: estimate.usage,
                quota: estimate.quota,
                percentUsed: (estimate.usage / estimate.quota) * 100
            };
        }
        
        return null;
    }
    
    async requestPersistentStorage() {
        if ('storage' in navigator && 'persist' in navigator.storage) {
            const isPersisted = await navigator.storage.persisted();
            
            if (!isPersisted) {
                const granted = await navigator.storage.persist();
                return granted;
            }
            
            return true;
        }
        
        return false;
    }
    
    async ensureSpace(neededBytes) {
        const quota = await this.getQuota();
        if (!quota) return true; // Can't check, assume OK
        
        const available = quota.quota - quota.usage;
        
        if (available < neededBytes) {
            // Evict old cached data
            await this.evictOldCacheEntries(neededBytes - available);
            
            // Check again
            const newQuota = await this.getQuota();
            return (newQuota.quota - newQuota.usage) >= neededBytes;
        }
        
        return true;
    }
    
    async evictOldCacheEntries(bytesToFree) {
        // Get all cached assets sorted by last used
        const assets = await this.getAllCachedAssets();
        assets.sort((a, b) => a.lastUsed - b.lastUsed);
        
        let freedBytes = 0;
        
        for (const asset of assets) {
            if (freedBytes >= bytesToFree) break;
            
            await this.cacheManager.remove(asset.id);
            freedBytes += asset.size;
        }
        
        return freedBytes;
    }
}
```

---

## 8. Performance Monitoring

```javascript
class AssetPerformanceMonitor {
    constructor() {
        this.metrics = {
            cacheHits: { l1: 0, l2: 0, l3: 0, miss: 0 },
            loadTimes: [],
            errors: []
        };
    }
    
    recordCacheHit(layer) {
        this.metrics.cacheHits[layer]++;
    }
    
    recordLoadTime(assetId, startTime, layer) {
        this.metrics.loadTimes.push({
            assetId,
            layer,
            duration: performance.now() - startTime,
            timestamp: Date.now()
        });
        
        // Keep only last 1000 entries
        if (this.metrics.loadTimes.length > 1000) {
            this.metrics.loadTimes.shift();
        }
    }
    
    getStats() {
        const totalHits = Object.values(this.metrics.cacheHits).reduce((a, b) => a + b, 0);
        const hitRate = totalHits > 0 
            ? (totalHits - this.metrics.cacheHits.miss) / totalHits 
            : 0;
        
        const avgLoadTime = this.metrics.loadTimes.length > 0
            ? this.metrics.loadTimes.reduce((a, b) => a + b.duration, 0) / this.metrics.loadTimes.length
            : 0;
        
        return {
            cacheHitRate: hitRate,
            cacheHitsByLayer: this.metrics.cacheHits,
            averageLoadTime: avgLoadTime,
            totalAssetsLoaded: this.metrics.loadTimes.length
        };
    }
}
```

---

## Implementation Checklist

### Core
- [ ] AssetManager with import pipeline
- [ ] Image optimizer (resize, WebP conversion)
- [ ] Video processor (metadata, poster frame)
- [ ] Hash computation (Web Worker)

### Caching
- [ ] LRU memory cache
- [ ] IndexedDB storage layer
- [ ] OPFS for large files
- [ ] Cache manager with multi-layer support

### Memory
- [ ] Memory budget enforcement
- [ ] Garbage collector for orphan assets
- [ ] Blob URL registry

### Prefetching
- [ ] Slide-based prefetching
- [ ] Network-aware loading
- [ ] Priority queue

### Monitoring
- [ ] Performance metrics
- [ ] Storage quota monitoring
- [ ] Cache hit rate tracking

---

*This spec should be implemented alongside the progressive loading system.*
