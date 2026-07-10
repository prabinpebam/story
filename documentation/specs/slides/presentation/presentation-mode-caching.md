# Presentation Mode Caching & Performance - Specification

## Overview

Presentation mode has unique performance requirements compared to edit mode. Users expect **zero-delay transitions**, **instant navigation**, and **seamless media playback**. This document specifies the intelligent pre-caching system that makes this possible.

**Related Specifications:**
- [Memory Management](../../collaboration/storage/memory-management.md) - Memory budgets and multi-tab coordination
- [Presentation Mode](./presentation-mode.md) - Core presentation mode behavior
- [Animation & Transitions](./animation-transitions.md) - Transition types and timing
- [Progressive Loading](../../collaboration/storage/progressive-loading.md) - General loading strategy
- [Asset Management & Caching](../../collaboration/storage/asset-management.md) - Cache layer architecture
- [Rendering Architecture](../../canvas/rendering/rendering-architecture.md) - Renderer design

---

## Table of Contents

1. [Performance Requirements](#1-performance-requirements)
2. [Pre-Caching Strategy](#2-pre-caching-strategy)
3. [Content Classification](#3-content-classification)
4. [Slide Prediction Engine](#4-slide-prediction-engine)
5. [Asset Priority System](#5-asset-priority-system)
6. [Memory Management](#6-memory-management)
7. [Media Handling](#7-media-handling)
8. [Network Considerations](#8-network-considerations)
9. [Code Fill Execution](#9-code-fill-execution)
10. [Presenter View Sync](#10-presenter-view-sync)
11. [Implementation Architecture](#11-implementation-architecture)
12. [Performance Budgets](#12-performance-budgets)

---

## 1. Performance Requirements

### 1.1 Transition Timing Targets

| Transition Type | Target Latency | Maximum Acceptable |
|-----------------|----------------|-------------------|
| Next/Previous slide | 0ms (instant) | 16ms (1 frame) |
| Jump to any slide | <50ms | 100ms |
| Grid view entry | <100ms | 200ms |
| Grid view jump | <50ms | 100ms |
| First slide entry | <500ms | 1000ms |

### 1.2 User Perception Thresholds

```
┌─────────────────────────────────────────────────────────────────┐
│ 0-16ms    │ Perceived as INSTANT (60fps frame)                 │
│ 16-100ms  │ Perceived as RESPONSIVE (user won't notice delay)  │
│ 100-300ms │ Perceived as FAST (acceptable for complex ops)     │
│ 300-1000ms│ Perceived as SLOW (user notices, may be annoyed)   │
│ 1000ms+   │ Perceived as BROKEN (unacceptable for transitions) │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Zero-Compromise Requirements

These must NEVER be compromised:

1. **Next slide must be instant** - Pre-rendered and in memory
2. **Previous slide must be instant** - Pre-rendered and in memory
3. **Keyboard response must be immediate** - Input never blocked
4. **Transition animations must be 60fps** - No frame drops
5. **Exit to edit mode must be fast** - <300ms to interactive editor

---

## 2. Pre-Caching Strategy

### 2.1 Sliding Window Model

```
                     CURRENT SLIDE
                           │
    ◄──── PRE-CACHED ─────►│◄──── PRE-CACHED ────►
                           │
┌───────────────────────────────────────────────────────┐
│ Slide  │ Slide  │ Slide  │ SLIDE │ Slide │ Slide │ Slide │
│  N-3   │  N-2   │  N-1   │   N   │  N+1  │  N+2  │  N+3  │
│        │        │        │       │       │       │        │
│ WARM   │ HOT    │ HOT    │ACTIVE │ HOT   │ HOT   │ WARM   │
│ (GPU)  │ (GPU)  │ (GPU)  │(GPU)  │ (GPU) │ (GPU) │ (GPU)  │
└───────────────────────────────────────────────────────────┘
                           │
                           ▼
           COLD STORAGE (Memory/IndexedDB)
                    │
    ┌───────────────┴───────────────┐
    │ All other slides: JSON ready  │
    │ Assets: Fetched on demand     │
    └───────────────────────────────┘
```

### 2.2 Cache Temperature Levels

| Level | State | Contents | Count |
|-------|-------|----------|-------|
| **ACTIVE** | GPU-rendered, visible | Current slide fully rendered | 1 |
| **HOT** | GPU-rendered, hidden | Adjacent slides pre-rendered in DOM | 2-4 |
| **WARM** | Decoded, in memory | Slide data parsed, assets decoded | 4-8 |
| **COLD** | Raw data available | JSON loaded, blobs in memory | All |
| **FROZEN** | On disk only | Not yet loaded from .str file | External |

### 2.3 Preloading Flow

```javascript
// When user navigates to slide N:

async function onSlideChange(n, direction) {
    // 1. IMMEDIATE: Render current slide (should already be HOT)
    await renderSlideImmediate(n);
    
    // 2. URGENT: Preload in direction of travel
    if (direction === 'forward') {
        schedulePreload([n+1, n+2, n+3], 'high');  // Ahead
        schedulePreload([n-1], 'medium');           // Behind
    } else {
        schedulePreload([n-1, n-2, n-3], 'high');  // Behind
        schedulePreload([n+1], 'medium');           // Ahead
    }
    
    // 3. BACKGROUND: Warm up nearby slides
    schedulePreload(getNeighborhood(n, 5), 'low');
    
    // 4. CLEANUP: Evict distant slides from HOT cache
    evictDistantSlides(n, MAX_HOT_SLIDES);
}
```

---

## 3. Content Classification

### 3.1 Element Weight Classification

Each element type has a "weight" affecting cache priority:

| Element Type | Weight | Reason |
|--------------|--------|--------|
| Vector shapes | Low | Fast to render from data |
| Text blocks | Low | Fast to layout and render |
| Static images | Medium | Need decode time |
| Animated GIFs | Medium-High | Multiple frames to decode |
| Code Fills | High | Require execution |
| Videos | Very High | Large files, buffering needed |
| Mesh Gradients | Medium | GPU computation required |
| Linked slides | Variable | Depends on target slide |

### 3.2 Slide Complexity Score

```javascript
function calculateSlideComplexity(slide) {
    let score = 0;
    
    for (const element of slide.elements) {
        score += getElementWeight(element.type);
        
        // Modifiers
        if (element.fill?.type === 'image') score += 2;
        if (element.fill?.type === 'video') score += 10;
        if (element.fill?.type === 'code') score += 5;
        if (element.animations?.length > 0) score += element.animations.length;
        if (element.effects?.length > 0) score += element.effects.length;
    }
    
    // Slide-level modifiers
    if (slide.transition !== 'none') score += 2;
    if (slide.transition === 'morph') score += 5; // Needs both slides rendered
    if (slide.hasVideo) score += 10;
    
    return score;
}
```

### 3.3 Adaptive Preload Depth

```javascript
const PRELOAD_DEPTH = {
    simple: 5,      // Score < 20: Can keep more slides hot
    medium: 3,      // Score 20-50: Balance memory
    complex: 2,     // Score > 50: Limit to adjacent only
    video: 1        // Has video: Only next slide
};

function getPreloadDepth(averageComplexity, hasVideoNearby) {
    if (hasVideoNearby) return PRELOAD_DEPTH.video;
    if (averageComplexity > 50) return PRELOAD_DEPTH.complex;
    if (averageComplexity > 20) return PRELOAD_DEPTH.medium;
    return PRELOAD_DEPTH.simple;
}
```

---

## 4. Slide Prediction Engine

### 4.1 Navigation Patterns

The system predicts which slides are likely to be visited next:

```
┌────────────────────────────────────────────────────────────────┐
│ Pattern                  │ Prediction                         │
├────────────────────────────────────────────────────────────────┤
│ Linear forward           │ N+1, N+2, N+3 (90% probability)    │
│ Linear backward          │ N-1, N-2 (if going back)           │
│ Jump from grid           │ Any slide (prepare thumbnails)     │
│ Linked navigation        │ Target slides (explicit links)     │
│ Section jumps            │ First slide of next section        │
│ Q&A / Discussion         │ Random access (all thumbnails)     │
└────────────────────────────────────────────────────────────────┘
```

### 4.2 Linked Slide Detection

Elements can link to other slides. These links create priority paths:

```javascript
function detectLinkedSlides(slide) {
    const linkedSlides = new Set();
    
    for (const element of slide.elements) {
        // Check for explicit slide links
        if (element.link?.type === 'slide') {
            linkedSlides.add(element.link.targetSlideId);
        }
        
        // Check for navigation actions in animations
        if (element.animations) {
            for (const anim of element.animations) {
                if (anim.onComplete?.action === 'goToSlide') {
                    linkedSlides.add(anim.onComplete.targetSlideId);
                }
            }
        }
    }
    
    return linkedSlides;
}
```

### 4.3 Section Awareness

Presentations often have sections. The first slide of each section is a priority:

```javascript
function getSectionFirstSlides(presentation) {
    const sectionStarts = [];
    
    for (let i = 0; i < presentation.slides.length; i++) {
        const slide = presentation.slides[i];
        if (slide.isSection || slide.masterType === 'section-header') {
            sectionStarts.push(i);
        }
    }
    
    return sectionStarts;
}
```

### 4.4 Prediction Priority Queue

```javascript
class SlidePreloadQueue {
    constructor() {
        this.queue = new PriorityQueue();
    }
    
    addSlide(slideIndex, priority, reason) {
        const finalPriority = this.calculateFinalPriority(slideIndex, priority, reason);
        this.queue.enqueue({ slideIndex, priority: finalPriority, reason });
    }
    
    calculateFinalPriority(slideIndex, basePriority, reason) {
        let priority = basePriority;
        
        // Boost priority based on reason
        switch (reason) {
            case 'adjacent':
                priority += 100;  // Highest priority
                break;
            case 'linked':
                priority += 80;   // Very high
                break;
            case 'section-start':
                priority += 60;   // High
                break;
            case 'nearby':
                priority += 40;   // Medium
                break;
            case 'background':
                priority += 10;   // Low
                break;
        }
        
        return priority;
    }
}
```

---

## 5. Asset Priority System

### 5.1 Asset Loading Order

Within a slide, assets are loaded in priority order:

```
Priority Order (highest first):
┌─────────────────────────────────────────────────────────────────┐
│ 1. Background image/video                                       │
│    - User sees this first, covers entire slide                 │
├─────────────────────────────────────────────────────────────────┤
│ 2. Hero element (largest by area)                              │
│    - Usually the main visual focus                             │
├─────────────────────────────────────────────────────────────────┤
│ 3. Above-the-fold elements                                     │
│    - Elements in top 60% of slide                              │
├─────────────────────────────────────────────────────────────────┤
│ 4. First animation targets                                     │
│    - Elements that animate in first                            │
├─────────────────────────────────────────────────────────────────┤
│ 5. Remaining visible elements                                  │
│    - Other elements with media fills                           │
├─────────────────────────────────────────────────────────────────┤
│ 6. Initially hidden elements                                   │
│    - Elements that build in later                              │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Progressive Quality Loading

For images, load progressive quality:

```javascript
class ProgressiveImageLoader {
    async loadForPresentation(assetId, urgency) {
        // Phase 1: Thumbnail (immediate)
        const thumbnail = await this.loadThumbnail(assetId); // ~10KB
        yield { assetId, quality: 'thumbnail', data: thumbnail };
        
        if (urgency === 'low') return; // Background slide
        
        // Phase 2: Preview quality (fast)
        const preview = await this.loadPreview(assetId); // ~50KB, 800px
        yield { assetId, quality: 'preview', data: preview };
        
        if (urgency === 'medium') return; // Nearby slide
        
        // Phase 3: Full quality (background)
        const full = await this.loadFull(assetId);
        yield { assetId, quality: 'full', data: full };
    }
}
```

### 5.3 Asset Readiness States

```javascript
const AssetReadiness = {
    NOT_LOADED: 'not-loaded',      // Not in memory
    LOADING: 'loading',             // Fetch in progress
    THUMBNAIL: 'thumbnail',         // Low-res available
    PREVIEW: 'preview',             // Medium-res available
    DECODED: 'decoded',             // Full-res, needs GPU upload
    GPU_READY: 'gpu-ready',         // Ready to render instantly
    ERROR: 'error'                  // Failed to load
};
```

---

## 6. Memory Management

### 6.1 Memory Budget for Presentation Mode

```javascript
const PRESENTATION_MEMORY_BUDGET = {
    // GPU Memory (decoded images, video frames)
    gpu: {
        hotSlides: 150 * 1024 * 1024,      // 150MB for HOT slides
        activeAssets: 100 * 1024 * 1024,   // 100MB for current slide
        videoBuffer: 200 * 1024 * 1024,    // 200MB for video frames
        total: 450 * 1024 * 1024           // 450MB total GPU
    },
    
    // Heap Memory (JSON, blobs, decoded data)
    heap: {
        slideData: 50 * 1024 * 1024,       // 50MB for slide JSONs
        assetBlobs: 200 * 1024 * 1024,     // 200MB for raw blobs
        renderCache: 100 * 1024 * 1024,    // 100MB for render cache
        total: 350 * 1024 * 1024           // 350MB total heap
    },
    
    // Total target: ~800MB during presentation
    // This leaves headroom for browser and OS
};
```

### 6.2 Eviction Strategy

```javascript
class PresentationCacheManager {
    evictIfNeeded(currentSlideIndex) {
        const memoryUsage = this.measureMemoryUsage();
        
        if (memoryUsage.gpu > BUDGET.gpu.total * 0.9) {
            // Evict GPU resources from distant slides
            const distantSlides = this.getSlidesOutsideWindow(
                currentSlideIndex, 
                EVICTION_WINDOW
            );
            
            for (const slide of distantSlides) {
                this.evictSlideGPUResources(slide);
                // Keep JSON and blobs, just release GPU textures
            }
        }
        
        if (memoryUsage.heap > BUDGET.heap.total * 0.9) {
            // Evict blob data from very distant slides
            const veryDistantSlides = this.getSlidesOutsideWindow(
                currentSlideIndex,
                EVICTION_WINDOW * 2
            );
            
            for (const slide of veryDistantSlides) {
                this.evictSlideBlobs(slide);
                // Keep only JSON structure
            }
        }
    }
}
```

### 6.3 Emergency Eviction

If memory is critical, aggressively evict:

```javascript
function emergencyEviction(currentSlideIndex) {
    console.warn('Memory pressure: Emergency eviction triggered');
    
    // Keep only current + immediately adjacent
    const keepSlides = new Set([
        currentSlideIndex,
        currentSlideIndex - 1,
        currentSlideIndex + 1
    ]);
    
    for (const [index, cache] of slideCache) {
        if (!keepSlides.has(index)) {
            cache.evictAll();
        }
    }
    
    // Force garbage collection if available
    if (window.gc) window.gc();
}
```

---

## 7. Media Handling

### 7.1 Video Pre-buffering

Videos require special handling for seamless playback:

```javascript
class VideoPrebuffer {
    constructor() {
        this.buffers = new Map(); // slideIndex -> VideoBuffer
    }
    
    async prepareVideo(slideIndex, videoElement) {
        const video = document.createElement('video');
        video.src = videoElement.src;
        video.preload = 'auto';
        video.muted = true; // Allow autoplay
        
        // Buffer first 5 seconds
        await this.bufferUntil(video, 5);
        
        // Store reference
        this.buffers.set(slideIndex, {
            element: video,
            buffered: 5,
            autoplay: videoElement.autoplay,
            loop: videoElement.loop
        });
    }
    
    async bufferUntil(video, seconds) {
        return new Promise((resolve, reject) => {
            const checkBuffer = () => {
                if (video.buffered.length > 0) {
                    const bufferedEnd = video.buffered.end(0);
                    if (bufferedEnd >= seconds) {
                        resolve();
                        return;
                    }
                }
                requestAnimationFrame(checkBuffer);
            };
            
            video.addEventListener('error', reject);
            video.load();
            checkBuffer();
        });
    }
    
    getVideoForSlide(slideIndex) {
        return this.buffers.get(slideIndex);
    }
}
```

### 7.2 Audio Preparation

```javascript
class AudioPreparer {
    async prepareSlideAudio(slideIndex, audioElements) {
        const prepared = [];
        
        for (const audio of audioElements) {
            const audioNode = document.createElement('audio');
            audioNode.src = audio.src;
            audioNode.preload = 'auto';
            
            // Wait for enough data
            await new Promise(resolve => {
                audioNode.addEventListener('canplaythrough', resolve, { once: true });
                audioNode.load();
            });
            
            prepared.push({
                element: audioNode,
                trigger: audio.trigger, // 'onEnter', 'onClick', 'afterAnimation'
                timing: audio.timing
            });
        }
        
        return prepared;
    }
}
```

### 7.3 Media Sync During Transitions

```javascript
class MediaTransitionCoordinator {
    async transitionWithMedia(fromSlide, toSlide, transition) {
        // 1. Pause any playing media on from-slide
        this.pauseSlideMedia(fromSlide);
        
        // 2. Prepare to-slide media
        const toMedia = await this.getSlideMedia(toSlide);
        
        // 3. Execute transition
        await this.animator.runTransition(fromSlide, toSlide, transition);
        
        // 4. Start auto-play media on to-slide
        for (const media of toMedia) {
            if (media.autoplay) {
                await media.element.play();
            }
        }
        
        // 5. Clean up from-slide media (reset to start)
        this.resetSlideMedia(fromSlide);
    }
}
```

---

## 8. Network Considerations

### 8.1 Offline-First Presentation

Once presentation mode starts, network should not be required:

```javascript
class PresentationNetworkManager {
    async prepareForPresentation(presentation) {
        // Verify all assets are cached locally
        const missingAssets = [];
        
        for (const slide of presentation.slides) {
            for (const element of slide.elements) {
                const assets = this.getElementAssets(element);
                for (const asset of assets) {
                    if (!await this.isAssetCached(asset.id)) {
                        missingAssets.push(asset);
                    }
                }
            }
        }
        
        if (missingAssets.length > 0) {
            // Show warning and offer to download
            return {
                ready: false,
                missing: missingAssets,
                downloadSize: this.calculateTotalSize(missingAssets)
            };
        }
        
        return { ready: true };
    }
}
```

### 8.2 Bandwidth-Adaptive Quality

If network is slow, adapt quality:

```javascript
class AdaptiveQualityLoader {
    constructor() {
        this.networkSpeed = this.measureNetworkSpeed();
    }
    
    selectQuality(assetId, urgency) {
        if (urgency === 'immediate') {
            // Always load best cached version for current slide
            return this.getBestCachedQuality(assetId) || 'thumbnail';
        }
        
        if (this.networkSpeed < 1) { // < 1 Mbps
            return 'preview'; // Skip full quality
        }
        
        if (this.networkSpeed < 5) { // < 5 Mbps
            return urgency === 'high' ? 'full' : 'preview';
        }
        
        return 'full'; // Fast network, load everything
    }
}
```

### 8.3 Preload Status Indicator

Show preload progress before presentation starts:

```javascript
function renderPreloadProgress(status) {
    return {
        total: status.totalAssets,
        loaded: status.loadedAssets,
        percentage: Math.round((status.loadedAssets / status.totalAssets) * 100),
        currentlyLoading: status.currentAsset?.name,
        estimatedTimeRemaining: status.estimatedMs,
        canStart: status.minimumLoaded  // First N slides ready
    };
}
```

---

## 9. Code Fill Execution

### 9.1 Pre-Execution for Presentation

Code fills must be pre-executed so their output is ready:

```javascript
class CodeFillPreparer {
    async prepareSlideCodeFills(slide) {
        const codeFills = this.getCodeFills(slide);
        
        for (const codeFill of codeFills) {
            // Execute in sandboxed worker
            const result = await this.codeExecutor.execute(codeFill.code, {
                width: codeFill.width,
                height: codeFill.height,
                frameTime: 0, // Static frame for preparation
                seed: codeFill.seed
            });
            
            // Cache the rendered output
            this.cacheCodeFillOutput(codeFill.id, result);
        }
    }
}
```

### 9.2 Animated Code Fill Handling

For animated code fills, prepare multiple frames:

```javascript
class AnimatedCodeFillPreparer {
    async prepareAnimatedCodeFill(codeFill, transitionDuration) {
        const fps = 60;
        const totalFrames = Math.ceil((transitionDuration / 1000) * fps);
        const frames = [];
        
        // Pre-render transition frames
        for (let i = 0; i < totalFrames; i++) {
            const frameTime = i / fps;
            const frame = await this.codeExecutor.execute(codeFill.code, {
                width: codeFill.width,
                height: codeFill.height,
                frameTime,
                seed: codeFill.seed
            });
            frames.push(frame);
        }
        
        return frames;
    }
}
```

---

## 10. Presenter View Sync

### 10.1 Multi-Window Communication

```javascript
class PresenterViewSync {
    constructor() {
        this.channel = new BroadcastChannel('story-presenter');
        this.windows = new Map();
    }
    
    // Sync slide navigation
    syncSlideChange(slideIndex, direction) {
        this.channel.postMessage({
            type: 'SLIDE_CHANGE',
            slideIndex,
            direction,
            timestamp: performance.now()
        });
    }
    
    // Sync cache status
    syncCacheStatus(status) {
        this.channel.postMessage({
            type: 'CACHE_STATUS',
            hotSlides: status.hotSlides,
            warmSlides: status.warmSlides,
            pendingAssets: status.pendingAssets
        });
    }
    
    // Request cache from presenter window
    requestSlideFromPresenter(slideIndex) {
        this.channel.postMessage({
            type: 'REQUEST_SLIDE_CACHE',
            slideIndex
        });
    }
}
```

### 10.2 Shared Cache Pool

```javascript
class SharedPresentationCache {
    constructor() {
        this.sharedArrayBuffer = new SharedArrayBuffer(100 * 1024 * 1024); // 100MB
        this.view = new Uint8Array(this.sharedArrayBuffer);
    }
    
    // Transfer rendered slide data between windows
    async shareSlideRender(slideIndex, renderData) {
        const encoded = await this.encodeRenderData(renderData);
        const offset = this.allocateSpace(encoded.byteLength);
        this.view.set(new Uint8Array(encoded), offset);
        
        return { buffer: this.sharedArrayBuffer, offset, size: encoded.byteLength };
    }
}
```

---

## 11. Implementation Architecture

### 11.1 Class Hierarchy

```
PresentationCacheController
├── SlidePreloadScheduler
│   ├── PriorityQueue
│   └── NavigationPredictor
├── AssetLoader
│   ├── ImageLoader
│   ├── VideoLoader
│   └── CodeFillExecutor
├── MemoryManager
│   ├── GPUMemoryTracker
│   └── HeapMemoryTracker
├── SlideCachePool
│   ├── HotCache (WeakMap<SlideIndex, RenderedSlide>)
│   ├── WarmCache (Map<SlideIndex, DecodedSlide>)
│   └── ColdCache (Map<SlideIndex, SlideJSON>)
└── MediaCoordinator
    ├── VideoPrebuffer
    ├── AudioPreparer
    └── TransitionSync
```

### 11.2 Initialization Sequence

```javascript
async function initializePresentationMode(presentation, startSlide) {
    // 1. Create cache controller
    const cacheController = new PresentationCacheController(presentation);
    
    // 2. Analyze presentation structure
    await cacheController.analyzePresentation();
    
    // 3. Determine complexity and memory budget
    const budget = cacheController.calculateOptimalBudget();
    
    // 4. Pre-cache critical slides
    await cacheController.precacheSlides([
        startSlide,
        startSlide + 1,
        startSlide - 1
    ], 'hot');
    
    // 5. Start background preload
    cacheController.startBackgroundPreload(startSlide);
    
    // 6. Initialize media handlers
    await cacheController.initializeMedia();
    
    // 7. Report ready
    return {
        ready: true,
        preloadProgress: cacheController.getProgress(),
        controller: cacheController
    };
}
```

### 11.3 Event Handlers

```javascript
class PresentationCacheController {
    onSlideTransitionStart(fromIndex, toIndex, transitionType) {
        // Begin preparing slides beyond destination
        const direction = toIndex > fromIndex ? 1 : -1;
        this.preloadInDirection(toIndex, direction, 2);
        
        // If morph transition, ensure both slides are GPU-ready
        if (transitionType === 'morph') {
            this.ensureGPUReady(fromIndex);
            this.ensureGPUReady(toIndex);
        }
    }
    
    onSlideTransitionEnd(newIndex) {
        // Evict distant slides from HOT cache
        this.evictDistantSlides(newIndex);
        
        // Continue background preload
        this.resumeBackgroundPreload(newIndex);
    }
    
    onGridViewEnter() {
        // Ensure all thumbnails are cached
        this.preloadAllThumbnails();
        
        // Reduce individual slide cache to make room
        this.reduceHotCacheForGrid();
    }
    
    onGridViewExit(selectedIndex) {
        // Rapidly cache selected slide and neighbors
        this.prioritizeSlide(selectedIndex);
    }
}
```

---

## 12. Performance Budgets

### 12.1 Timing Budgets

| Operation | Budget | Notes |
|-----------|--------|-------|
| Slide change (cached) | 8ms | Must complete in 1 frame |
| Slide change (warm) | 32ms | 2 frames acceptable |
| Transition start | 4ms | Input → first animation frame |
| Transition duration | 300-500ms | Configurable by user |
| Grid view render | 100ms | All thumbnails visible |
| Exit presentation | 200ms | Return to editor |

### 12.2 Memory Budgets

| Resource | Limit | Notes |
|----------|-------|-------|
| GPU textures | 450MB | ~8 full HD slides |
| Decoded images | 200MB | Held in memory for fast access |
| Video buffers | 200MB | ~5s of 1080p per video |
| Slide JSON data | 50MB | All slides can be kept |
| Render cache | 100MB | Pre-computed layouts |
| **Total** | **~1GB** | Peak presentation memory |

### 12.3 Network Budgets

| Scenario | Budget | Strategy |
|----------|--------|----------|
| First slide visible | 500ms | Show skeleton → load assets |
| All adjacent slides cached | 5s | Background preload |
| All slides cached | 30s | For 100-slide presentation |
| Minimum for start | 2s | First 3 slides ready |

---

## Appendix A: Preload Decision Flowchart

```
                        ┌─────────────────┐
                        │ Slide Change to │
                        │    Slide N      │
                        └────────┬────────┘
                                 │
                    ┌────────────▼────────────┐
                    │ Is N+1 in HOT cache?    │
                    └────────────┬────────────┘
                          │             │
                         Yes           No
                          │             │
                          ▼             ▼
                    ┌─────────┐   ┌──────────────┐
                    │ Great!  │   │ URGENT: Load │
                    │ No-op   │   │ N+1 now      │
                    └─────────┘   └──────────────┘
                                         │
                    ┌────────────────────┘
                    ▼
           ┌────────────────────┐
           │ Check N+2, N-1     │
           │ in WARM cache?     │
           └────────┬───────────┘
                    │
         ┌──────────┴──────────┐
        Yes                    No
         │                      │
         ▼                      ▼
   ┌───────────┐     ┌────────────────┐
   │ Schedule  │     │ HIGH priority  │
   │ promotion │     │ background     │
   │ to HOT    │     │ fetch          │
   └───────────┘     └────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │ Check for linked  │
                    │ slides from N     │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │ Add to MEDIUM     │
                    │ priority queue    │
                    └───────────────────┘
```

---

## Appendix B: Example Timeline

For a user presenting a 50-slide presentation:

```
T=0s     User clicks "Present"
         ├─ Load manifest, slide list
         ├─ Render slide 1 skeleton
         └─ Start preload queue

T=0.3s   Slide 1 fully rendered
         ├─ Slides 2, 3 loading (HOT)
         └─ Show "Ready to present"

T=1.0s   User navigates to slide 2
         ├─ Instant transition (was HOT)
         ├─ Slide 1 stays HOT
         ├─ Slides 3, 4 promoted to HOT
         └─ Slide 5-10 loading (WARM)

T=15s    User on slide 10
         ├─ Slides 8, 9, 10, 11, 12 are HOT
         ├─ Slides 1-7 demoted to WARM
         ├─ Linked slide 45 preloading
         └─ Memory at 450MB

T=30s    User jumps to slide 45 (from link)
         ├─ Slide 45 was WARM → renders in 50ms
         ├─ Evict slides 1-5 from memory
         ├─ Preload 44, 46, 47
         └─ Memory stable

T=60s    User opens Grid View
         ├─ All 50 thumbnails display
         ├─ Reduce HOT cache to 3 slides
         └─ Memory drops to 300MB

T=65s    User selects slide 25 from grid
         ├─ Slide 25 loads in 80ms (was COLD)
         ├─ Preload 24, 26, 27
         └─ Return to normal caching
```

---

*This specification ensures presentation mode delivers a professional, reliable experience regardless of presentation size or complexity.*
