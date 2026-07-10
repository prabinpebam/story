# Progressive Loading System - Specification

## Overview

Progressive loading enables users to start viewing and interacting with presentations before the entire file is loaded. This is critical for large files (50MB+) to avoid UI freezing and provide a responsive experience.

**Related Specifications:**
- [Memory Management](./memory-management.md) - Memory budgets and optimization
- [Asset Management](./asset-management.md) - Cache layer architecture
- [Presentation Performance and Caching](../../slides/presentation-mode/02-performance-and-caching.md) - Presentation-specific loading

---

## Loading Phases

```
┌─────────────────────────────────────────────────────────────┐
│ Phase 1: Instant (< 100ms)                                  │
│ - manifest.json (< 5KB)                                     │
│ - thumbnail.png (< 50KB)                                    │
│ - First slide JSON only                                     │
├─────────────────────────────────────────────────────────────┤
│ Phase 2: Interactive (< 500ms)                              │
│ - presentation.json (metadata, slide order)                 │
│ - Current slide + adjacent slides JSON                      │
│ - Small assets for visible slide                            │
├─────────────────────────────────────────────────────────────┤
│ Phase 3: Background (streaming)                             │
│ - Remaining slide JSONs                                     │
│ - All thumbnails                                            │
│ - Assets on-demand or prefetch                              │
├─────────────────────────────────────────────────────────────┤
│ Phase 4: Lazy (on navigation)                               │
│ - Large videos                                              │
│ - High-res images                                           │
│ - Assets for non-visible slides                             │
└─────────────────────────────────────────────────────────────┘
```

---

## File Structure for Progressive Loading

The `.str` file structure must support partial reading:

```
presentation.str (ZIP archive)
├── manifest.json           # Version, metadata, table of contents
├── presentation.json       # ONLY slide order, masters, themes (no element data)
├── thumbnail.png           # 16:9, 400x225px cover image
├── slides/
│   ├── 001.json           # Individual slide data with elements
│   ├── 002.json
│   └── ...
├── masters/
│   ├── default.json
│   └── title.json
├── assets/
│   ├── index.json         # Asset registry with hashes, sizes
│   ├── abc123.png         # Hash-based naming
│   └── def456.mp4
├── thumbnails/
│   ├── slide-001-sm.png   # 100x75
│   ├── slide-001-md.png   # 200x150
│   └── slide-001-lg.png   # 400x300
└── cache/
    └── computed.json      # Pre-computed values (optional)
```

---

## Manifest Extensions for Progressive Loading

```javascript
// manifest.json
{
    "version": "1.0.0",
    "appVersion": "2.0.0",
    "minAppVersion": "1.5.0",
    
    // Table of contents for progressive access
    "chunks": {
        "slides/001.json": { 
            "size": 1234, 
            "hash": "sha256:abc...",
            "compressed": true 
        },
        "slides/002.json": { 
            "size": 2345, 
            "hash": "sha256:def..." 
        }
    },
    
    // Assets that should be loaded lazily (large files)
    "lazyAssets": [
        "assets/video-large.mp4",
        "assets/high-res-image.png"
    ],
    
    // Precomputed asset sizes for progress calculation
    "totalSize": 52428800,
    "slideCount": 24,
    
    // Thumbnail sizes available
    "thumbnailSizes": ["sm", "md", "lg"],
    
    // Feature flags
    "features": {
        "codeFills": true,
        "videoFills": true,
        "meshGradients": true,
        "animations": false
    }
}
```

---

## Streaming ZIP Reading

Instead of extracting the entire ZIP, use streaming access:

```javascript
class StreamingZipReader {
    constructor(file) {
        this.file = file;
        this.centralDirectory = null;
    }
    
    async initialize() {
        // Read only the central directory (at end of ZIP)
        // This gives us the file list without decompressing
        this.centralDirectory = await this.readCentralDirectory();
    }
    
    async readFile(path) {
        // Read only the specific file from ZIP
        const entry = this.centralDirectory.get(path);
        const slice = this.file.slice(entry.offset, entry.offset + entry.compressedSize);
        return this.decompress(await slice.arrayBuffer());
    }
    
    async *streamFiles(paths) {
        // Generator for streaming multiple files
        for (const path of paths) {
            yield { path, data: await this.readFile(path) };
        }
    }
}
```

---

## Loading State Machine

```javascript
const LoadingStates = {
    IDLE: 'idle',
    READING_MANIFEST: 'reading_manifest',
    LOADING_FIRST_SLIDE: 'loading_first_slide',
    INTERACTIVE: 'interactive',        // User can start working
    LOADING_BACKGROUND: 'loading_background',
    COMPLETE: 'complete',
    ERROR: 'error'
};

class ProgressiveLoader {
    constructor() {
        this.state = LoadingStates.IDLE;
        this.progress = {
            phase: 1,
            slidesLoaded: 0,
            totalSlides: 0,
            assetsLoaded: 0,
            totalAssets: 0,
            bytesLoaded: 0,
            totalBytes: 0
        };
    }
    
    async load(file) {
        try {
            // Phase 1: Instant
            this.setState(LoadingStates.READING_MANIFEST);
            const manifest = await this.loadManifest(file);
            this.emit('manifest-ready', manifest);
            
            // Phase 2: First slide
            this.setState(LoadingStates.LOADING_FIRST_SLIDE);
            const firstSlide = await this.loadSlide(file, 0);
            this.emit('first-slide-ready', firstSlide);
            
            // Now interactive
            this.setState(LoadingStates.INTERACTIVE);
            this.emit('interactive');
            
            // Phase 3: Background loading
            this.setState(LoadingStates.LOADING_BACKGROUND);
            await this.loadRemainingSlides(file);
            
            // Phase 4: Complete
            this.setState(LoadingStates.COMPLETE);
            this.emit('complete');
            
        } catch (error) {
            this.setState(LoadingStates.ERROR);
            this.emit('error', error);
        }
    }
}
```

---

## Asset Loading Priority

```javascript
const AssetPriority = {
    CRITICAL: 0,    // Current slide, visible immediately
    HIGH: 1,        // Adjacent slides (prev/next)
    MEDIUM: 2,      // Visible in slide panel thumbnails
    LOW: 3,         // Off-screen slides
    LAZY: 4         // Large videos, load on demand
};

class AssetPriorityQueue {
    constructor() {
        this.queues = new Map();
        for (const priority of Object.values(AssetPriority)) {
            this.queues.set(priority, []);
        }
        this.loading = new Set();
        this.maxConcurrent = 4;
    }
    
    enqueue(assetId, priority) {
        this.queues.get(priority).push(assetId);
        this.processQueue();
    }
    
    reprioritize(assetId, newPriority) {
        // Move asset to different priority (e.g., when user navigates)
        for (const [priority, queue] of this.queues) {
            const index = queue.indexOf(assetId);
            if (index !== -1) {
                queue.splice(index, 1);
                break;
            }
        }
        this.enqueue(assetId, newPriority);
    }
    
    async processQueue() {
        while (this.loading.size < this.maxConcurrent) {
            const assetId = this.getNextAsset();
            if (!assetId) break;
            
            this.loading.add(assetId);
            this.loadAsset(assetId).finally(() => {
                this.loading.delete(assetId);
                this.processQueue();
            });
        }
    }
    
    getNextAsset() {
        for (const priority of Object.values(AssetPriority)) {
            const queue = this.queues.get(priority);
            if (queue.length > 0) {
                return queue.shift();
            }
        }
        return null;
    }
}
```

---

## UI States During Loading

### Phase 1: Skeleton + Thumbnail

```
┌─────────────────────────────────────────────────────────────┐
│ [Story Logo]                              Opening...        │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                                                         │ │
│ │                    [File Thumbnail]                     │ │
│ │                      Blurred/Faded                      │ │
│ │                                                         │ │
│ │               "Marketing Presentation"                  │ │
│ │                  24 slides • 15.2 MB                    │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│                    ████████░░░░░░░░░░ Loading...            │
└─────────────────────────────────────────────────────────────┘
```

### Phase 2: First Slide Ready

```
┌─────────────────────────────────────────────────────────────┐
│ [Toolbar - Fully Functional]                                │
├─────────────────────────────────────────────────────────────┤
│ ┌─────┐ ┌─────────────────────────────────────────────────┐ │
│ │[1]  │ │                                                 │ │
│ │     │ │           First Slide Content                   │ │
│ ├─────┤ │              (Fully Rendered)                   │ │
│ │░░░░░│ │                                                 │ │
│ │░░░░░│ │                                                 │ │
│ ├─────┤ └─────────────────────────────────────────────────┘ │
│ │░░░░░│                                                     │
│ │░░░░░│ Status: Loading slides... 1/24                      │
│ └─────┘                                                     │
└─────────────────────────────────────────────────────────────┘

░░░░░ = Placeholder skeleton for slides not yet loaded
```

### Phase 3: Progressive Thumbnails

```
┌─────────────────────────────────────────────────────────────┐
│ [Toolbar]                                                   │
├─────────────────────────────────────────────────────────────┤
│ ┌─────┐ ┌─────────────────────────────────────────────────┐ │
│ │[1] ✓│ │                                                 │ │
│ │     │ │           Current Slide                         │ │
│ ├─────┤ │                                                 │ │
│ │[2] ✓│ │                                                 │ │
│ │     │ │                                                 │ │
│ ├─────┤ └─────────────────────────────────────────────────┘ │
│ │[3] ⟳│                                                     │
│ │     │ Status: Loading assets... 45%                       │
│ ├─────┤                                                     │
│ │[4]░░│                                                     │
│ └─────┘                                                     │
└─────────────────────────────────────────────────────────────┘

✓ = Loaded    ⟳ = Loading    ░░ = Not started
```

---

## Navigation During Loading

When user navigates to an unloaded slide:

```javascript
class SlideNavigator {
    async navigateTo(slideIndex) {
        const slide = this.slides[slideIndex];
        
        if (slide.loaded) {
            // Instant navigation
            this.showSlide(slide);
            return;
        }
        
        // Show loading state for this slide
        this.showSlideLoading(slideIndex);
        
        // Prioritize this slide and its assets
        this.loader.prioritizeSlide(slideIndex);
        
        // Wait for slide to load (with timeout)
        try {
            await this.loader.waitForSlide(slideIndex, { timeout: 5000 });
            this.showSlide(this.slides[slideIndex]);
        } catch (error) {
            this.showSlideError(slideIndex, error);
        }
    }
}
```

---

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Time to manifest | < 50ms | ZIP central directory read |
| Time to first slide | < 500ms | For 50MB file |
| Time to interactive | < 500ms | User can edit |
| Time to all slides loaded | < 5s | For 50MB file |
| Slide navigation (cached) | < 50ms | Instant feel |
| Slide navigation (uncached) | < 200ms | Acceptable delay |
| Asset load (image) | < 100ms | After decompression |
| Asset load (video start) | < 500ms | Stream, don't wait for full |

---

## Web Worker Architecture

Heavy operations run in Web Workers to avoid blocking UI:

```javascript
// Main thread
class LoaderCoordinator {
    constructor() {
        this.zipWorker = new Worker('zip-worker.js');
        this.hashWorker = new Worker('hash-worker.js');
    }
    
    async loadFile(file) {
        // Transfer file to worker (zero-copy with transferable)
        this.zipWorker.postMessage({ 
            type: 'INIT', 
            file 
        }, [file]);
        
        // Receive chunks as they're extracted
        this.zipWorker.onmessage = (e) => {
            switch (e.data.type) {
                case 'MANIFEST':
                    this.handleManifest(e.data.manifest);
                    break;
                case 'SLIDE':
                    this.handleSlide(e.data.index, e.data.data);
                    break;
                case 'ASSET':
                    this.handleAsset(e.data.id, e.data.blob);
                    break;
            }
        };
    }
}

// zip-worker.js
self.onmessage = async (e) => {
    if (e.data.type === 'INIT') {
        const zip = await initZip(e.data.file);
        
        // Send manifest first
        const manifest = await zip.readFile('manifest.json');
        self.postMessage({ type: 'MANIFEST', manifest });
        
        // Send slides one by one
        for (let i = 0; i < manifest.slideCount; i++) {
            const slide = await zip.readFile(`slides/${String(i+1).padStart(3, '0')}.json`);
            self.postMessage({ type: 'SLIDE', index: i, data: slide });
        }
    }
};
```

---

## Error Handling

```javascript
const LoadingErrors = {
    INVALID_FORMAT: 'invalid_format',
    CORRUPT_FILE: 'corrupt_file',
    VERSION_TOO_NEW: 'version_too_new',
    ASSET_MISSING: 'asset_missing',
    NETWORK_ERROR: 'network_error',
    QUOTA_EXCEEDED: 'quota_exceeded'
};

class LoadingErrorHandler {
    handle(error, context) {
        switch (error.type) {
            case LoadingErrors.VERSION_TOO_NEW:
                return this.showUpgradePrompt(error.requiredVersion);
                
            case LoadingErrors.ASSET_MISSING:
                // Continue loading, mark asset as missing
                return this.markAssetMissing(context.assetId);
                
            case LoadingErrors.CORRUPT_FILE:
                return this.showCorruptFileDialog(error);
                
            default:
                return this.showGenericError(error);
        }
    }
}
```

---

## Integration with Presentation Mode

> **See [Presentation Performance and Caching](../../slides/presentation-mode/02-performance-and-caching.md) for the presentation caching architecture.**

Presentation mode has unique loading requirements compared to edit mode:

### Differences from Edit Mode Loading

| Aspect | Edit Mode | Presentation Mode |
|--------|-----------|-------------------|
| Priority | Current slide only | Current + adjacent slides |
| Quality | Can show loading states | Must be instant |
| Memory budget | ~500MB for editing | ~800MB for caching |
| Eviction | LRU globally | Distance from current |
| Video | Load on demand | Pre-buffer 5 seconds |

### Presentation Mode Loading Strategy

```javascript
// Before presentation starts
async function preparePresentationMode(startSlide) {
    // Verify critical slides are cached
    const required = [startSlide, startSlide + 1, startSlide - 1];
    for (const index of required) {
        await ensureSlideFullyLoaded(index);
    }
    
    // Start aggressive background preload
    scheduleBackgroundPreload({
        direction: 'forward',
        depth: 5,  // More slides than edit mode
        priority: 'high'
    });
    
    // Pre-buffer any videos in first 5 slides
    await prebufferNearbyVideos(startSlide, 5);
}
```

### Key Presentation Requirements

1. **Next slide must be instant** - Always in GPU memory
2. **Previous slide must be instant** - Always in GPU memory
3. **Jump to any slide <100ms** - Thumbnails always cached
4. **No loading spinners** - Skeleton states unacceptable
5. **Transitions at 60fps** - No frame drops during animation

---

## Integration with Collaboration

For real-time collaboration, progressive loading works with the sync system:

```javascript
// When opening a shared document
async function openSharedDocument(documentId) {
    // Phase 1: Get manifest from server
    const manifest = await api.getManifest(documentId);
    
    // Phase 2: Load first slide from server
    const firstSlide = await api.getSlide(documentId, 0);
    
    // Phase 3: Connect to real-time sync
    const syncSession = await collaboration.connect(documentId);
    
    // Phase 4: Receive incremental updates
    syncSession.on('slide-update', (slideIndex, operations) => {
        this.applyOperations(slideIndex, operations);
    });
    
    // Background: Load remaining slides
    this.loadRemainingFromServer(documentId);
}
```

---

## Implementation Checklist

### Core
- [ ] Streaming ZIP reader (fflate or custom)
- [ ] Manifest-first loading
- [ ] Slide chunk loader
- [ ] Asset priority queue

### Workers
- [ ] ZIP decompression worker
- [ ] Hash computation worker
- [ ] Thumbnail generation worker

### UI
- [ ] Loading skeleton component
- [ ] Progress indicator
- [ ] Slide placeholder component
- [ ] Asset loading indicator

### State
- [ ] Loading state machine
- [ ] Partial state hydration
- [ ] Asset reference resolution

### Presentation Mode
- [ ] Presentation cache controller
- [ ] Slide preload scheduler
- [ ] Navigation predictor
- [ ] Video prebuffer system

---

*This spec should be implemented as part of Phase 1.5 of the file format implementation plan.*
