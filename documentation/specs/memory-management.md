# Memory Management & Performance Optimization - Specification

## Overview

This specification defines comprehensive memory management strategies for Story, ensuring optimal performance across all usage scenarios while preventing memory exhaustion. It addresses single-tab editing, presentation mode, and critically, multi-tab usage patterns.

**Related Specifications:**
- [Asset Management & Caching](./asset-management.md) - Cache layer architecture
- [Presentation Mode Caching](./presentation-mode-caching.md) - Presentation-specific caching
- [Progressive Loading](./progressive-loading.md) - Loading strategies

---

## Table of Contents

1. [Memory Landscape Analysis](#1-memory-landscape-analysis)
2. [Industry Analysis](#2-industry-analysis)
3. [Memory Budget Strategy](#3-memory-budget-strategy)
4. [Multi-Tab Coordination](#4-multi-tab-coordination)
5. [Garbage Collection](#5-garbage-collection)
6. [Performance Optimization](#6-performance-optimization)
7. [Resource Pooling](#7-resource-pooling)
8. [Monitoring & Telemetry](#8-monitoring--telemetry)
9. [Best Practices](#9-best-practices)
10. [Edge Cases & Recovery](#10-edge-cases--recovery)
11. [Implementation Architecture](#11-implementation-architecture)

---

## 1. Memory Landscape Analysis

### 1.1 Browser Memory Model

Understanding how browsers allocate memory is crucial:

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Browser Process                                │
├──────────────────────────────────────────────────────────────────────┤
│  Tab 1 (Story)          │  Tab 2 (Story)         │  Other Tabs      │
│  ┌────────────────────┐ │  ┌────────────────────┐│                  │
│  │ JS Heap            │ │  │ JS Heap            ││                  │
│  │ • Objects          │ │  │ • Objects          ││                  │
│  │ • Arrays           │ │  │ • Arrays           ││                  │
│  │ • Closures         │ │  │ • Closures         ││                  │
│  ├────────────────────┤ │  ├────────────────────┤│                  │
│  │ DOM Memory         │ │  │ DOM Memory         ││                  │
│  │ • Elements         │ │  │ • Elements         ││                  │
│  │ • Detached trees   │ │  │ • Detached trees   ││                  │
│  ├────────────────────┤ │  ├────────────────────┤│                  │
│  │ GPU Memory         │ │  │ GPU Memory         ││                  │
│  │ • Textures         │ │  │ • Textures         ││                  │
│  │ • Canvas buffers   │ │  │ • Canvas buffers   ││                  │
│  └────────────────────┘ │  └────────────────────┘│                  │
├─────────────────────────┴────────────────────────┴──────────────────┤
│                    Shared Resources                                  │
│  • SharedArrayBuffer (if enabled)                                   │
│  • IndexedDB (per origin, ~1GB typical)                             │
│  • Cache Storage (per origin)                                       │
│  • OPFS (Origin Private File System)                                │
└──────────────────────────────────────────────────────────────────────┘
```

### 1.2 Memory Types in Story

| Type | Description | Typical Size | Shareable |
|------|-------------|--------------|-----------|
| **JS Heap** | Objects, state, JSON | 50-200MB | No |
| **DOM** | Elements, text nodes | 20-100MB | No |
| **Canvas/GPU** | Decoded images, renders | 100-500MB | No |
| **Web Workers** | Each has own heap | 10-50MB each | Partially |
| **IndexedDB** | Persistent blobs | 0-1GB | Yes (origin) |
| **OPFS** | Large file storage | 0-10GB | Yes (origin) |
| **Blob URLs** | Temporary references | Varies | No |

### 1.3 Memory Pressure Thresholds

```javascript
const MEMORY_THRESHOLDS = {
    // Per-tab thresholds
    perTab: {
        healthy: 300 * 1024 * 1024,     // < 300MB: Green zone
        elevated: 500 * 1024 * 1024,     // 300-500MB: Yellow zone  
        critical: 800 * 1024 * 1024,     // 500-800MB: Orange zone
        emergency: 1024 * 1024 * 1024    // > 1GB: Red zone, immediate action
    },
    
    // System-wide thresholds (when available via Performance API)
    system: {
        healthyPercent: 50,    // < 50% of available memory
        elevatedPercent: 70,   // 50-70%
        criticalPercent: 85,   // 70-85%
        emergencyPercent: 95   // > 95%
    }
};
```

---

## 2. Industry Analysis

### 2.1 How Competitors Solve This

#### Google Slides

| Strategy | Implementation |
|----------|---------------|
| **Lazy rendering** | Only renders visible + adjacent slides |
| **Server-side images** | Images served from CDN, not stored in tab memory |
| **Slide virtualization** | DOM elements recycled, not all in memory |
| **Collaboration focus** | State synced to server, minimal local state |
| **Tab suspension** | Background tabs suspend after 5 minutes |

**Key Insight:** Google offloads heavy assets to cloud, keeping tab memory minimal.

#### Figma

| Strategy | Implementation |
|----------|---------------|
| **WebAssembly rendering** | C++ engine compiled to WASM, efficient memory |
| **GPU acceleration** | WebGL for all rendering, managed textures |
| **Level of detail** | Simplified geometry when zoomed out |
| **Viewport culling** | Only render what's visible |
| **Background tab throttling** | Reduced activity in background |
| **Multiplexed files** | Single persistent connection for all tabs |

**Key Insight:** Figma uses a custom rendering engine with explicit memory control.

#### Canva

| Strategy | Implementation |
|----------|---------------|
| **Progressive quality** | Low-res placeholders → full quality on zoom |
| **Element pooling** | Reuse DOM elements for performance |
| **Asset CDN** | All assets served externally |
| **Design size limits** | Maximum canvas size enforced |
| **Export offloading** | Heavy operations done server-side |

**Key Insight:** Canva limits scope and offloads work to servers.

#### Microsoft PowerPoint Online

| Strategy | Implementation |
|----------|---------------|
| **Slide streaming** | Slides loaded on demand from OneDrive |
| **Co-authoring chunks** | Only changed data synced |
| **Asset deduplication** | Images shared across presentations |
| **Background save** | Continuous sync reduces memory accumulation |

**Key Insight:** Deep OneDrive integration for seamless state management.

### 2.2 Key Lessons for Story

1. **Virtualize aggressively** - Don't render what's not visible
2. **Stream don't store** - Videos and large images should stream
3. **Offload to IndexedDB/OPFS** - Not everything needs to be in heap
4. **Pool and reuse** - DOM elements, canvas contexts, workers
5. **Measure continuously** - Can't optimize what you don't measure
6. **Coordinate across tabs** - Shared resources need shared management
7. **Fail gracefully** - Memory issues should degrade, not crash

---

## 3. Memory Budget Strategy

### 3.1 Dynamic Budget Allocation

```javascript
class DynamicMemoryBudget {
    constructor() {
        this.baseBudget = this.calculateBaseBudget();
        this.currentMode = 'edit'; // 'edit' | 'present' | 'background'
    }
    
    calculateBaseBudget() {
        // Try to use Performance API (Chrome 102+)
        if (performance.measureUserAgentSpecificMemory) {
            return this.calculateFromDeviceCapabilities();
        }
        
        // Fallback: Conservative estimate
        return {
            jsHeap: 150 * 1024 * 1024,      // 150MB
            domNodes: 5000,                   // ~50MB
            canvasMemory: 200 * 1024 * 1024, // 200MB
            total: 400 * 1024 * 1024         // 400MB target
        };
    }
    
    calculateFromDeviceCapabilities() {
        const memory = navigator.deviceMemory || 4; // GB, default 4
        const cores = navigator.hardwareConcurrency || 4;
        
        // Scale budget based on device capabilities
        // Assume 10% of device memory is reasonable per tab
        const targetMemoryGB = Math.min(memory * 0.1, 1); // Cap at 1GB
        
        return {
            jsHeap: targetMemoryGB * 0.3 * 1024 * 1024 * 1024,
            domNodes: Math.min(cores * 2000, 10000),
            canvasMemory: targetMemoryGB * 0.5 * 1024 * 1024 * 1024,
            total: targetMemoryGB * 1024 * 1024 * 1024
        };
    }
    
    getBudgetForMode(mode) {
        const multipliers = {
            edit: 1.0,         // Full budget for active editing
            present: 1.5,      // Extra budget for presentation caching
            background: 0.3,   // Reduced budget when tab not visible
            suspended: 0.1     // Minimal budget for suspended tabs
        };
        
        const multiplier = multipliers[mode] || 1.0;
        
        return {
            jsHeap: this.baseBudget.jsHeap * multiplier,
            domNodes: Math.round(this.baseBudget.domNodes * multiplier),
            canvasMemory: this.baseBudget.canvasMemory * multiplier,
            total: this.baseBudget.total * multiplier
        };
    }
    
    adjustForTabCount(tabCount) {
        // Reduce budget when multiple Story tabs open
        if (tabCount <= 1) return 1.0;
        if (tabCount === 2) return 0.6;  // Each tab gets 60%
        if (tabCount === 3) return 0.45; // Each tab gets 45%
        return 0.35; // 4+ tabs: each gets 35%
    }
}
```

### 3.2 Category-Based Budgets

```javascript
const MEMORY_CATEGORIES = {
    // Core application state
    state: {
        slides: 10 * 1024 * 1024,        // 10MB - JSON data
        history: 20 * 1024 * 1024,        // 20MB - Undo stack
        clipboard: 5 * 1024 * 1024,       // 5MB - Copied content
        selection: 1 * 1024 * 1024        // 1MB - Selection state
    },
    
    // Rendering caches
    render: {
        thumbnails: 30 * 1024 * 1024,     // 30MB - Slide thumbnails
        activeSlide: 50 * 1024 * 1024,    // 50MB - Current slide render
        adjacentSlides: 100 * 1024 * 1024, // 100MB - Next/prev slides
        codeFills: 30 * 1024 * 1024       // 30MB - Code fill outputs
    },
    
    // Asset caches
    assets: {
        decodedImages: 100 * 1024 * 1024, // 100MB - Decoded bitmaps
        videoFrames: 50 * 1024 * 1024,    // 50MB - Video frame buffer
        fonts: 20 * 1024 * 1024           // 20MB - Custom fonts
    },
    
    // UI components
    ui: {
        domPool: 20 * 1024 * 1024,        // 20MB - DOM element pool
        canvasPool: 30 * 1024 * 1024      // 30MB - OffscreenCanvas pool
    }
};
```

### 3.3 Adaptive Budget Adjustment

```javascript
class AdaptiveBudgetController {
    constructor(memoryManager) {
        this.memoryManager = memoryManager;
        this.adjustmentHistory = [];
        this.lastAdjustment = Date.now();
    }
    
    async checkAndAdjust() {
        const stats = await this.memoryManager.getMemoryStats();
        const pressure = this.calculatePressure(stats);
        
        if (pressure > 0.9) {
            // Emergency: Aggressive eviction
            await this.emergencyEviction();
        } else if (pressure > 0.7) {
            // High pressure: Reduce budgets
            this.reduceBudgets(0.8);
        } else if (pressure < 0.4 && this.budgetsWereReduced()) {
            // Low pressure: Restore budgets
            this.restoreBudgets();
        }
        
        this.recordAdjustment(pressure);
    }
    
    async emergencyEviction() {
        console.warn('Memory emergency: Starting aggressive eviction');
        
        // 1. Clear all non-essential caches
        await this.memoryManager.clearCategory('thumbnails');
        await this.memoryManager.clearCategory('adjacentSlides');
        
        // 2. Reduce history depth
        this.memoryManager.reduceHistoryDepth(10);
        
        // 3. Unload code fill outputs
        await this.memoryManager.clearCategory('codeFills');
        
        // 4. Force garbage collection (if available)
        if (window.gc) window.gc();
        
        // 5. Notify user if still critical
        const newStats = await this.memoryManager.getMemoryStats();
        if (this.calculatePressure(newStats) > 0.8) {
            this.notifyUser('Memory is low. Consider closing other tabs or reducing presentation size.');
        }
    }
}
```

---

## 4. Multi-Tab Coordination

### 4.1 The Multi-Tab Problem

When users open multiple Story tabs:

```
┌─────────────────────────────────────────────────────────────────────┐
│                     THE MULTI-TAB PROBLEM                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Tab 1: "Sales Deck" (300MB)                                        │
│  ├─ 50 slides with images                                          │
│  ├─ 3 videos                                                        │
│  └─ Active editing                                                  │
│                                                                     │
│  Tab 2: "Q4 Report" (250MB)                                         │
│  ├─ 30 slides with charts                                          │
│  └─ Background (not visible)                                        │
│                                                                     │
│  Tab 3: "Training Materials" (400MB)                                │
│  ├─ 100 slides with animations                                      │
│  └─ In presentation mode                                            │
│                                                                     │
│  SHARED RESOURCES:                                                  │
│  ├─ IndexedDB: 500MB of cached assets                              │
│  ├─ OPFS: 2GB of presentation files                                │
│  └─ Service Worker: 50MB cache                                      │
│                                                                     │
│  TOTAL: 950MB in tabs + 2.5GB shared = POTENTIAL CRASH             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Cross-Tab Communication

```javascript
class TabCoordinator {
    constructor() {
        this.channel = new BroadcastChannel('story-memory-coordinator');
        this.tabId = this.generateTabId();
        this.peerTabs = new Map();
        this.isLeader = false;
        
        this.setupListeners();
        this.announcePresence();
    }
    
    generateTabId() {
        return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    setupListeners() {
        this.channel.onmessage = (event) => {
            const { type, senderId, data } = event.data;
            
            switch (type) {
                case 'TAB_ANNOUNCE':
                    this.handleTabAnnounce(senderId, data);
                    break;
                case 'TAB_CLOSE':
                    this.handleTabClose(senderId);
                    break;
                case 'MEMORY_REPORT':
                    this.handleMemoryReport(senderId, data);
                    break;
                case 'EVICTION_REQUEST':
                    this.handleEvictionRequest(data);
                    break;
                case 'LEADER_ELECTION':
                    this.handleLeaderElection(senderId, data);
                    break;
            }
        };
        
        window.addEventListener('beforeunload', () => {
            this.channel.postMessage({
                type: 'TAB_CLOSE',
                senderId: this.tabId
            });
        });
        
        // Periodic memory report
        setInterval(() => this.reportMemoryUsage(), 30000);
    }
    
    announcePresence() {
        this.channel.postMessage({
            type: 'TAB_ANNOUNCE',
            senderId: this.tabId,
            data: {
                mode: this.getCurrentMode(),
                memoryUsage: this.getMemoryUsage(),
                priority: this.getPriority()
            }
        });
        
        // Elect leader after announcement
        setTimeout(() => this.electLeader(), 100);
    }
    
    electLeader() {
        // Leader is the tab with lowest ID (oldest)
        const allTabIds = [this.tabId, ...this.peerTabs.keys()].sort();
        this.isLeader = allTabIds[0] === this.tabId;
        
        if (this.isLeader) {
            console.log('This tab is the memory coordinator leader');
            this.startLeaderDuties();
        }
    }
    
    startLeaderDuties() {
        // Only leader coordinates memory across tabs
        setInterval(() => this.coordinateMemory(), 10000);
    }
    
    async coordinateMemory() {
        if (!this.isLeader) return;
        
        const totalMemory = this.calculateTotalMemory();
        const threshold = 1.5 * 1024 * 1024 * 1024; // 1.5GB total
        
        if (totalMemory > threshold) {
            // Find the best eviction candidate
            const candidate = this.findEvictionCandidate();
            
            if (candidate) {
                this.channel.postMessage({
                    type: 'EVICTION_REQUEST',
                    senderId: this.tabId,
                    data: {
                        targetTab: candidate.tabId,
                        amount: candidate.suggestedEviction
                    }
                });
            }
        }
    }
    
    findEvictionCandidate() {
        // Priority order for eviction:
        // 1. Background tabs with high memory
        // 2. Tabs with stale caches
        // 3. Oldest unused tabs
        
        const candidates = [...this.peerTabs.entries()]
            .filter(([_, data]) => data.mode === 'background')
            .sort((a, b) => b[1].memoryUsage - a[1].memoryUsage);
        
        if (candidates.length > 0) {
            const [tabId, data] = candidates[0];
            return {
                tabId,
                suggestedEviction: data.memoryUsage * 0.5 // Request 50% reduction
            };
        }
        
        return null;
    }
    
    handleEvictionRequest(data) {
        if (data.targetTab === this.tabId) {
            console.log(`Received eviction request for ${data.amount} bytes`);
            this.performEviction(data.amount);
        }
    }
    
    async performEviction(targetBytes) {
        // Evict in order of priority
        const evicted = await this.memoryManager.evictBytes(targetBytes);
        
        // Report new usage
        this.reportMemoryUsage();
    }
}
```

### 4.3 Tab Priority System

```javascript
const TAB_PRIORITIES = {
    // Highest priority - never evict
    ACTIVE_PRESENTING: 100,
    ACTIVE_EDITING: 90,
    
    // Medium priority
    BACKGROUND_UNSAVED: 70,  // Has unsaved changes
    BACKGROUND_RECENT: 50,   // Used recently
    
    // Lower priority - candidates for eviction
    BACKGROUND_IDLE: 30,     // No activity for 5+ minutes
    BACKGROUND_OLD: 10       // No activity for 30+ minutes
};

function calculateTabPriority(tabState) {
    let priority = 0;
    
    // Mode-based priority
    if (tabState.isPresenting) priority = TAB_PRIORITIES.ACTIVE_PRESENTING;
    else if (tabState.isVisible) priority = TAB_PRIORITIES.ACTIVE_EDITING;
    else if (tabState.hasUnsavedChanges) priority = TAB_PRIORITIES.BACKGROUND_UNSAVED;
    else {
        const idleMinutes = (Date.now() - tabState.lastActivity) / 60000;
        if (idleMinutes < 5) priority = TAB_PRIORITIES.BACKGROUND_RECENT;
        else if (idleMinutes < 30) priority = TAB_PRIORITIES.BACKGROUND_IDLE;
        else priority = TAB_PRIORITIES.BACKGROUND_OLD;
    }
    
    // Boost for important content
    if (tabState.hasVideoPlaying) priority += 10;
    if (tabState.isExporting) priority += 20;
    
    return priority;
}
```

### 4.4 Shared Resource Management

```javascript
class SharedResourceManager {
    constructor() {
        this.db = null;
        this.locks = new Map();
    }
    
    async initialize() {
        // Use IndexedDB to track shared resource usage
        this.db = await this.openDatabase();
    }
    
    async openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('story-shared-resources', 1);
            
            request.onerror = reject;
            request.onsuccess = () => resolve(request.result);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Track asset usage across tabs
                db.createObjectStore('assetUsage', { keyPath: 'assetId' });
                
                // Track quota usage
                db.createObjectStore('quotaUsage', { keyPath: 'category' });
            };
        });
    }
    
    async trackAssetUsage(assetId, tabId, size) {
        const tx = this.db.transaction('assetUsage', 'readwrite');
        const store = tx.objectStore('assetUsage');
        
        const existing = await this.promisify(store.get(assetId));
        
        if (existing) {
            existing.tabs.add(tabId);
            existing.lastUsed = Date.now();
            await this.promisify(store.put(existing));
        } else {
            await this.promisify(store.add({
                assetId,
                tabs: new Set([tabId]),
                size,
                lastUsed: Date.now()
            }));
        }
    }
    
    async findEvictableAssets(targetBytes) {
        // Find assets only used by background tabs
        const tx = this.db.transaction('assetUsage', 'readonly');
        const store = tx.objectStore('assetUsage');
        
        const allAssets = await this.promisify(store.getAll());
        
        // Sort by recency, oldest first
        allAssets.sort((a, b) => a.lastUsed - b.lastUsed);
        
        const evictable = [];
        let accumulated = 0;
        
        for (const asset of allAssets) {
            if (accumulated >= targetBytes) break;
            
            // Only evict if no active tab is using it
            const hasActiveUser = await this.hasActiveTabUser(asset.tabs);
            if (!hasActiveUser) {
                evictable.push(asset.assetId);
                accumulated += asset.size;
            }
        }
        
        return evictable;
    }
}
```

---

## 5. Garbage Collection

### 5.1 Proactive Garbage Collection

```javascript
class ProactiveGarbageCollector {
    constructor(memoryManager) {
        this.memoryManager = memoryManager;
        this.gcScheduled = false;
        this.gcHistory = [];
    }
    
    scheduleGC(urgency = 'normal') {
        if (this.gcScheduled) return;
        
        const delays = {
            immediate: 0,
            urgent: 100,
            normal: 1000,
            lazy: 5000
        };
        
        this.gcScheduled = true;
        setTimeout(() => this.runGC(urgency), delays[urgency]);
    }
    
    async runGC(urgency) {
        const startTime = performance.now();
        const startMemory = await this.memoryManager.getHeapUsage();
        
        try {
            // 1. Clear completed promises
            this.clearCompletedPromises();
            
            // 2. Release blob URLs
            this.releaseUnusedBlobUrls();
            
            // 3. Clear event listener references
            this.cleanEventListeners();
            
            // 4. Trim caches based on urgency
            if (urgency === 'immediate' || urgency === 'urgent') {
                await this.memoryManager.trimCaches(0.5); // Keep 50%
            } else {
                await this.memoryManager.trimCaches(0.8); // Keep 80%
            }
            
            // 5. Clear WeakRef targets
            this.clearDeadWeakRefs();
            
            // 6. Trigger browser GC if available
            if (window.gc) {
                window.gc();
            }
            
            const endMemory = await this.memoryManager.getHeapUsage();
            const duration = performance.now() - startTime;
            
            this.gcHistory.push({
                timestamp: Date.now(),
                urgency,
                freedBytes: startMemory - endMemory,
                duration
            });
            
            console.log(`GC complete: freed ${this.formatBytes(startMemory - endMemory)} in ${duration.toFixed(2)}ms`);
            
        } finally {
            this.gcScheduled = false;
        }
    }
    
    releaseUnusedBlobUrls() {
        // Get all blob URLs we've created
        const activeBlobUrls = this.memoryManager.getActiveBlobUrls();
        const referencedUrls = this.findReferencedBlobUrls();
        
        for (const url of activeBlobUrls) {
            if (!referencedUrls.has(url)) {
                URL.revokeObjectURL(url);
                this.memoryManager.removeBlobUrl(url);
            }
        }
    }
    
    findReferencedBlobUrls() {
        const referenced = new Set();
        
        // Check all img elements
        document.querySelectorAll('img').forEach(img => {
            if (img.src.startsWith('blob:')) {
                referenced.add(img.src);
            }
        });
        
        // Check all video elements
        document.querySelectorAll('video source, video').forEach(el => {
            const src = el.src || el.currentSrc;
            if (src?.startsWith('blob:')) {
                referenced.add(src);
            }
        });
        
        // Check canvas background images in CSS
        // ... additional checks
        
        return referenced;
    }
}
```

### 5.2 Detecting Memory Leaks

```javascript
class MemoryLeakDetector {
    constructor() {
        this.snapshots = [];
        this.suspectedLeaks = new Map();
    }
    
    async takeSnapshot() {
        const snapshot = {
            timestamp: Date.now(),
            heapUsage: await this.getHeapUsage(),
            domNodes: document.getElementsByTagName('*').length,
            eventListeners: this.countEventListeners(),
            canvases: document.querySelectorAll('canvas').length,
            workers: this.countWorkers(),
            detachedNodes: await this.countDetachedNodes()
        };
        
        this.snapshots.push(snapshot);
        
        // Keep last 60 snapshots (1 per minute = 1 hour history)
        if (this.snapshots.length > 60) {
            this.snapshots.shift();
        }
        
        this.analyzeForLeaks();
    }
    
    analyzeForLeaks() {
        if (this.snapshots.length < 5) return;
        
        const recent = this.snapshots.slice(-5);
        
        // Check for monotonically increasing memory
        const heapTrend = this.calculateTrend(recent.map(s => s.heapUsage));
        const domTrend = this.calculateTrend(recent.map(s => s.domNodes));
        
        if (heapTrend > 0.1) { // 10% increase per snapshot
            this.suspectedLeaks.set('heap', {
                type: 'heap',
                trend: heapTrend,
                lastValue: recent[recent.length - 1].heapUsage
            });
        }
        
        if (domTrend > 0.05) { // 5% increase per snapshot
            this.suspectedLeaks.set('dom', {
                type: 'dom',
                trend: domTrend,
                lastValue: recent[recent.length - 1].domNodes
            });
        }
        
        // Check for detached nodes (strong leak indicator)
        const lastDetached = recent[recent.length - 1].detachedNodes;
        if (lastDetached > 100) {
            this.suspectedLeaks.set('detached', {
                type: 'detached',
                count: lastDetached
            });
        }
        
        if (this.suspectedLeaks.size > 0) {
            console.warn('Suspected memory leaks:', Object.fromEntries(this.suspectedLeaks));
        }
    }
    
    async countDetachedNodes() {
        // This requires DevTools or Performance API
        if (performance.measureUserAgentSpecificMemory) {
            const measurement = await performance.measureUserAgentSpecificMemory();
            // Parse breakdown for detached nodes
            // This is simplified; actual API is more complex
            return measurement.breakdown
                ?.find(b => b.types.includes('DetachedDOMTree'))
                ?.bytes || 0;
        }
        return 0;
    }
}
```

---

## 6. Performance Optimization

### 6.1 Rendering Optimization

```javascript
class RenderingOptimizer {
    constructor() {
        this.frameDrops = 0;
        this.lastFrameTime = 0;
        this.qualityLevel = 'high'; // 'high' | 'medium' | 'low'
    }
    
    measureFrameRate() {
        let frames = 0;
        let lastTime = performance.now();
        
        const measure = () => {
            frames++;
            const now = performance.now();
            
            if (now - lastTime >= 1000) {
                const fps = Math.round(frames * 1000 / (now - lastTime));
                this.adjustQuality(fps);
                frames = 0;
                lastTime = now;
            }
            
            requestAnimationFrame(measure);
        };
        
        requestAnimationFrame(measure);
    }
    
    adjustQuality(fps) {
        if (fps < 30 && this.qualityLevel !== 'low') {
            this.qualityLevel = fps < 20 ? 'low' : 'medium';
            this.applyQualitySettings();
        } else if (fps >= 55 && this.qualityLevel !== 'high') {
            this.qualityLevel = 'high';
            this.applyQualitySettings();
        }
    }
    
    applyQualitySettings() {
        const settings = {
            high: {
                imageQuality: 1.0,
                shadowsEnabled: true,
                blurEnabled: true,
                animationQuality: 60
            },
            medium: {
                imageQuality: 0.75,
                shadowsEnabled: true,
                blurEnabled: false,
                animationQuality: 30
            },
            low: {
                imageQuality: 0.5,
                shadowsEnabled: false,
                blurEnabled: false,
                animationQuality: 15
            }
        };
        
        const current = settings[this.qualityLevel];
        this.applySettings(current);
        
        console.log(`Quality adjusted to ${this.qualityLevel}`);
    }
}
```

### 6.2 Lazy Rendering

```javascript
class LazyRenderer {
    constructor() {
        this.visibleSlides = new Set();
        this.observer = null;
    }
    
    initialize() {
        // Use IntersectionObserver for viewport detection
        this.observer = new IntersectionObserver(
            (entries) => this.handleIntersection(entries),
            {
                root: null,
                rootMargin: '100px', // Pre-render 100px outside viewport
                threshold: [0, 0.1, 0.5, 1]
            }
        );
    }
    
    observeSlide(slideElement) {
        this.observer.observe(slideElement);
    }
    
    handleIntersection(entries) {
        for (const entry of entries) {
            const slideId = entry.target.dataset.slideId;
            
            if (entry.isIntersecting) {
                this.visibleSlides.add(slideId);
                this.renderSlide(slideId, entry.intersectionRatio);
            } else {
                this.visibleSlides.delete(slideId);
                this.unrenderSlide(slideId);
            }
        }
    }
    
    renderSlide(slideId, visibility) {
        // Full render for highly visible slides
        if (visibility > 0.5) {
            this.fullRender(slideId);
        } else {
            // Placeholder for barely visible slides
            this.placeholderRender(slideId);
        }
    }
    
    unrenderSlide(slideId) {
        // Replace with low-memory placeholder
        // Keep minimal data for quick re-render
    }
}
```

### 6.3 Debouncing & Throttling

```javascript
class UpdateOptimizer {
    constructor() {
        this.pendingUpdates = new Map();
        this.frameCallbacks = [];
        this.rafId = null;
    }
    
    // Debounce frequent operations
    debounce(key, callback, delay = 100) {
        if (this.pendingUpdates.has(key)) {
            clearTimeout(this.pendingUpdates.get(key));
        }
        
        this.pendingUpdates.set(key, setTimeout(() => {
            this.pendingUpdates.delete(key);
            callback();
        }, delay));
    }
    
    // Batch updates to next animation frame
    batchToFrame(callback) {
        this.frameCallbacks.push(callback);
        
        if (!this.rafId) {
            this.rafId = requestAnimationFrame(() => {
                const callbacks = [...this.frameCallbacks];
                this.frameCallbacks = [];
                this.rafId = null;
                
                // Execute all callbacks
                for (const cb of callbacks) {
                    try {
                        cb();
                    } catch (e) {
                        console.error('Batched callback error:', e);
                    }
                }
            });
        }
    }
    
    // Throttle to max N calls per second
    throttle(key, callback, maxPerSecond = 60) {
        const minInterval = 1000 / maxPerSecond;
        const lastCall = this.lastCalls?.get(key) || 0;
        const now = performance.now();
        
        if (now - lastCall >= minInterval) {
            this.lastCalls = this.lastCalls || new Map();
            this.lastCalls.set(key, now);
            callback();
        }
    }
}
```

---

## 7. Resource Pooling

### 7.1 DOM Element Pool

```javascript
class DOMElementPool {
    constructor() {
        this.pools = new Map();
        this.stats = {
            created: 0,
            reused: 0,
            returned: 0
        };
    }
    
    acquire(tagName, className = '') {
        const key = `${tagName}:${className}`;
        
        if (!this.pools.has(key)) {
            this.pools.set(key, []);
        }
        
        const pool = this.pools.get(key);
        
        if (pool.length > 0) {
            this.stats.reused++;
            const element = pool.pop();
            element.style.display = '';
            return element;
        }
        
        this.stats.created++;
        const element = document.createElement(tagName);
        if (className) element.className = className;
        return element;
    }
    
    release(element) {
        // Clean element before returning to pool
        element.style.display = 'none';
        element.innerHTML = '';
        element.removeAttribute('style');
        
        // Keep class for pool identification
        const key = `${element.tagName.toLowerCase()}:${element.className}`;
        
        if (!this.pools.has(key)) {
            this.pools.set(key, []);
        }
        
        const pool = this.pools.get(key);
        
        // Limit pool size
        if (pool.length < 50) {
            pool.push(element);
            this.stats.returned++;
        }
        // If pool is full, let GC collect it
    }
    
    getStats() {
        return {
            ...this.stats,
            reuseRatio: this.stats.reused / (this.stats.reused + this.stats.created)
        };
    }
}
```

### 7.2 Canvas Pool

```javascript
class CanvasPool {
    constructor() {
        this.pool = [];
        this.inUse = new Map();
        this.maxPoolSize = 20;
    }
    
    acquire(width, height) {
        // Try to find a matching canvas
        const matchIndex = this.pool.findIndex(
            c => c.width === width && c.height === height
        );
        
        let canvas;
        if (matchIndex >= 0) {
            canvas = this.pool.splice(matchIndex, 1)[0];
        } else if (this.pool.length > 0) {
            // Resize an existing canvas
            canvas = this.pool.pop();
            canvas.width = width;
            canvas.height = height;
        } else {
            // Create new canvas
            canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
        }
        
        const id = this.generateId();
        this.inUse.set(id, canvas);
        
        return { id, canvas };
    }
    
    release(id) {
        const canvas = this.inUse.get(id);
        if (!canvas) return;
        
        this.inUse.delete(id);
        
        // Clear canvas
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Return to pool if not full
        if (this.pool.length < this.maxPoolSize) {
            this.pool.push(canvas);
        }
        // Otherwise let GC collect
    }
    
    releaseAll() {
        for (const [id] of this.inUse) {
            this.release(id);
        }
    }
    
    generateId() {
        return `canvas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
```

### 7.3 Worker Pool

```javascript
class WorkerPool {
    constructor(workerScript, poolSize = navigator.hardwareConcurrency || 4) {
        this.workers = [];
        this.queue = [];
        this.poolSize = poolSize;
        this.workerScript = workerScript;
        
        this.initializePool();
    }
    
    initializePool() {
        for (let i = 0; i < this.poolSize; i++) {
            const worker = new Worker(this.workerScript);
            this.workers.push({
                worker,
                busy: false,
                taskCount: 0
            });
            
            worker.onmessage = (e) => this.handleWorkerMessage(i, e);
            worker.onerror = (e) => this.handleWorkerError(i, e);
        }
    }
    
    async execute(task) {
        return new Promise((resolve, reject) => {
            const job = { task, resolve, reject };
            
            const availableWorker = this.workers.find(w => !w.busy);
            
            if (availableWorker) {
                this.assignJob(availableWorker, job);
            } else {
                this.queue.push(job);
            }
        });
    }
    
    assignJob(workerInfo, job) {
        workerInfo.busy = true;
        workerInfo.currentJob = job;
        workerInfo.taskCount++;
        
        workerInfo.worker.postMessage(job.task);
    }
    
    handleWorkerMessage(workerIndex, event) {
        const workerInfo = this.workers[workerIndex];
        const job = workerInfo.currentJob;
        
        workerInfo.busy = false;
        workerInfo.currentJob = null;
        
        if (job) {
            job.resolve(event.data);
        }
        
        // Check for queued jobs
        if (this.queue.length > 0) {
            const nextJob = this.queue.shift();
            this.assignJob(workerInfo, nextJob);
        }
    }
    
    terminate() {
        for (const { worker } of this.workers) {
            worker.terminate();
        }
        this.workers = [];
    }
}
```

---

## 8. Monitoring & Telemetry

### 8.1 Memory Metrics Collection

```javascript
class MemoryMetrics {
    constructor() {
        this.metrics = [];
        this.interval = null;
    }
    
    startCollection(intervalMs = 10000) {
        this.interval = setInterval(() => this.collect(), intervalMs);
    }
    
    stopCollection() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
    
    async collect() {
        const metric = {
            timestamp: Date.now(),
            
            // JS Heap (Chrome)
            jsHeap: performance.memory ? {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            } : null,
            
            // DOM
            dom: {
                nodes: document.getElementsByTagName('*').length,
                depth: this.measureDOMDepth()
            },
            
            // Canvas
            canvases: {
                count: document.querySelectorAll('canvas').length,
                totalPixels: this.measureCanvasPixels()
            },
            
            // Workers
            workers: this.getWorkerCount(),
            
            // IndexedDB estimate
            storage: await this.getStorageEstimate(),
            
            // Custom app metrics
            app: {
                slidesLoaded: this.getSlidesLoadedCount(),
                assetsInMemory: this.getAssetsInMemoryCount(),
                historyDepth: this.getHistoryDepth()
            }
        };
        
        this.metrics.push(metric);
        
        // Keep last 100 metrics
        if (this.metrics.length > 100) {
            this.metrics.shift();
        }
        
        // Check for anomalies
        this.checkAnomalies(metric);
    }
    
    async getStorageEstimate() {
        if (navigator.storage && navigator.storage.estimate) {
            const estimate = await navigator.storage.estimate();
            return {
                usage: estimate.usage,
                quota: estimate.quota,
                percentUsed: (estimate.usage / estimate.quota) * 100
            };
        }
        return null;
    }
    
    checkAnomalies(metric) {
        const anomalies = [];
        
        // Check heap usage
        if (metric.jsHeap && metric.jsHeap.used > metric.jsHeap.limit * 0.8) {
            anomalies.push({
                type: 'heap_high',
                value: metric.jsHeap.used,
                threshold: metric.jsHeap.limit * 0.8
            });
        }
        
        // Check DOM size
        if (metric.dom.nodes > 10000) {
            anomalies.push({
                type: 'dom_large',
                value: metric.dom.nodes,
                threshold: 10000
            });
        }
        
        // Check storage
        if (metric.storage && metric.storage.percentUsed > 80) {
            anomalies.push({
                type: 'storage_high',
                value: metric.storage.percentUsed,
                threshold: 80
            });
        }
        
        if (anomalies.length > 0) {
            this.reportAnomalies(anomalies);
        }
    }
    
    reportAnomalies(anomalies) {
        console.warn('Memory anomalies detected:', anomalies);
        
        // Trigger remediation
        window.dispatchEvent(new CustomEvent('memory-anomaly', {
            detail: { anomalies }
        }));
    }
    
    getReport() {
        const recent = this.metrics.slice(-10);
        
        return {
            current: this.metrics[this.metrics.length - 1],
            trend: this.calculateTrend(recent),
            peak: this.findPeak(this.metrics),
            average: this.calculateAverage(this.metrics)
        };
    }
}
```

### 8.2 Performance Timeline

```javascript
class PerformanceTimeline {
    constructor() {
        this.marks = new Map();
        this.measures = [];
    }
    
    mark(name) {
        this.marks.set(name, performance.now());
    }
    
    measure(name, startMark, endMark) {
        const start = this.marks.get(startMark) || 0;
        const end = endMark ? this.marks.get(endMark) : performance.now();
        
        const measure = {
            name,
            start,
            end,
            duration: end - start,
            timestamp: Date.now()
        };
        
        this.measures.push(measure);
        
        // Warn if operation is slow
        if (measure.duration > 100) {
            console.warn(`Slow operation: ${name} took ${measure.duration.toFixed(2)}ms`);
        }
        
        return measure;
    }
    
    async measureAsync(name, fn) {
        this.mark(`${name}:start`);
        try {
            return await fn();
        } finally {
            this.measure(name, `${name}:start`);
        }
    }
    
    getSlowOperations(thresholdMs = 100) {
        return this.measures.filter(m => m.duration > thresholdMs);
    }
}
```

---

## 9. Best Practices

### 9.1 Memory-Efficient Patterns

```javascript
// ✅ DO: Use WeakMap for element-related data
const elementData = new WeakMap();
elementData.set(element, { customProp: 'value' });
// When element is GC'd, data is automatically released

// ❌ DON'T: Use Map with element keys
const badData = new Map();
badData.set(element, { customProp: 'value' });
// Element can never be GC'd while in map

// ✅ DO: Use object pooling for frequent allocations
const vectorPool = [];
function getVector() {
    return vectorPool.pop() || { x: 0, y: 0 };
}
function releaseVector(v) {
    v.x = 0;
    v.y = 0;
    vectorPool.push(v);
}

// ❌ DON'T: Create new objects in tight loops
for (let i = 0; i < 1000; i++) {
    doSomething({ x: i, y: i }); // Creates 1000 objects
}

// ✅ DO: Revoke blob URLs when done
const blobUrl = URL.createObjectURL(blob);
// ... use blobUrl ...
URL.revokeObjectURL(blobUrl);

// ❌ DON'T: Create blob URLs without cleanup
function createPreview(file) {
    return URL.createObjectURL(file); // Memory leak if not revoked
}

// ✅ DO: Use streaming for large data
async function* processLargeFile(file) {
    const reader = file.stream().getReader();
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield processChunk(value);
    }
}

// ❌ DON'T: Load entire file into memory
async function loadEntireFile(file) {
    return await file.arrayBuffer(); // Entire file in memory
}

// ✅ DO: Clean up event listeners
const handler = () => { ... };
element.addEventListener('click', handler);
// Later:
element.removeEventListener('click', handler);

// ❌ DON'T: Use anonymous functions for listeners
element.addEventListener('click', () => { ... }); // Can't remove
```

### 9.2 Image Optimization Checklist

```markdown
## Image Memory Optimization

1. **Use appropriate formats**
   - WebP for photos (30% smaller than JPEG)
   - SVG for icons and simple graphics
   - PNG only when transparency needed

2. **Size appropriately**
   - Never load 4K image for 200px thumbnail
   - Generate multiple sizes: sm (200px), md (800px), lg (full)
   - Use `srcset` for responsive loading

3. **Decode off main thread**
   - Use `createImageBitmap()` in worker
   - Avoid synchronous `drawImage()` on large images

4. **Manage decoded memory**
   - Decoded 4K image = ~32MB (4096×2160×4 bytes)
   - Cache only what's visible + adjacent
   - Evict distant images aggressively

5. **Use CSS for effects**
   - `filter: blur()` doesn't duplicate image
   - Avoid canvas operations for simple transforms
```

### 9.3 Video Memory Guidelines

```markdown
## Video Memory Guidelines

1. **Never load full video into memory**
   - Always stream from source
   - Use `preload="metadata"` initially
   - Switch to `preload="auto"` when needed

2. **Buffer conservatively**
   - 5 seconds ahead is usually enough
   - Don't buffer entire video

3. **Release when hidden**
   - Pause and unload videos not on current slide
   - Use poster frame when paused

4. **Pool video elements**
   - Reuse <video> elements
   - Don't create new element per video
```

---

## 10. Edge Cases & Recovery

### 10.1 Crash Recovery

```javascript
class CrashRecovery {
    constructor() {
        this.checkpointInterval = 30000; // 30 seconds
        this.lastCheckpoint = null;
    }
    
    initialize() {
        // Check for crash recovery on startup
        this.checkForRecovery();
        
        // Start checkpointing
        setInterval(() => this.checkpoint(), this.checkpointInterval);
        
        // Handle various failure modes
        window.addEventListener('beforeunload', () => this.cleanup());
        window.addEventListener('unhandledrejection', (e) => this.handleError(e));
    }
    
    async checkForRecovery() {
        const recovery = await this.loadFromStorage('story-recovery');
        
        if (recovery && recovery.crashDetected) {
            const proceed = await this.promptRecovery(recovery);
            
            if (proceed) {
                await this.restoreFromCheckpoint(recovery);
            }
            
            await this.clearRecoveryData();
        }
        
        // Mark session as started (crash detection)
        await this.saveToStorage('story-recovery', {
            sessionStart: Date.now(),
            crashDetected: true // Will be cleared on clean exit
        });
    }
    
    async checkpoint() {
        const state = this.getMinimalRecoveryState();
        
        await this.saveToStorage('story-recovery', {
            ...await this.loadFromStorage('story-recovery'),
            checkpoint: {
                timestamp: Date.now(),
                state
            }
        });
        
        this.lastCheckpoint = Date.now();
    }
    
    getMinimalRecoveryState() {
        // Only save essential data for recovery
        return {
            currentSlide: store.getState().currentSlide,
            unsavedChanges: this.getUnsavedChanges(),
            presentationId: store.getState().presentationId,
            version: store.getState().version
        };
    }
    
    async cleanup() {
        // Mark clean exit
        await this.saveToStorage('story-recovery', {
            crashDetected: false
        });
    }
}
```

### 10.2 Out of Memory Handling

```javascript
class OutOfMemoryHandler {
    constructor() {
        this.emergencyMode = false;
    }
    
    initialize() {
        // Monitor for memory pressure events
        if ('memory' in navigator && 'addEventListener' in navigator.memory) {
            navigator.memory.addEventListener('memorypressure', (e) => {
                this.handleMemoryPressure(e.pressure);
            });
        }
        
        // Fallback: periodic checks
        setInterval(() => this.checkMemory(), 5000);
    }
    
    async checkMemory() {
        if (!performance.memory) return;
        
        const usedRatio = performance.memory.usedJSHeapSize / 
                          performance.memory.jsHeapSizeLimit;
        
        if (usedRatio > 0.95) {
            this.handleMemoryPressure('critical');
        } else if (usedRatio > 0.85) {
            this.handleMemoryPressure('serious');
        } else if (usedRatio > 0.7) {
            this.handleMemoryPressure('moderate');
        }
    }
    
    handleMemoryPressure(level) {
        console.warn(`Memory pressure: ${level}`);
        
        switch (level) {
            case 'critical':
                this.criticalRecovery();
                break;
            case 'serious':
                this.seriousRecovery();
                break;
            case 'moderate':
                this.moderateRecovery();
                break;
        }
    }
    
    async criticalRecovery() {
        this.emergencyMode = true;
        
        // Save current work immediately
        await this.autoSave();
        
        // Clear everything non-essential
        this.clearAllCaches();
        
        // Reduce to minimal state
        this.reduceToEssentials();
        
        // Notify user
        this.showCriticalWarning();
    }
    
    async seriousRecovery() {
        // Clear thumbnails and non-visible slides
        await cacheManager.clearCategory('thumbnails');
        await cacheManager.clearCategory('non-visible');
        
        // Reduce history
        historyManager.truncate(10);
        
        // Force GC
        if (window.gc) window.gc();
    }
    
    moderateRecovery() {
        // Gentle cleanup
        cacheManager.trimLRU(0.7);
        
        // Schedule lazy cleanup
        requestIdleCallback(() => {
            this.lazyCleanup();
        });
    }
    
    showCriticalWarning() {
        // Show user a warning with options
        const dialog = createDialog({
            title: 'Low Memory Warning',
            message: 'Your browser is running low on memory. Your work has been saved.',
            options: [
                { text: 'Close Other Tabs', action: () => this.suggestCloseTabs() },
                { text: 'Reduce Presentation Size', action: () => this.showOptimizationTips() },
                { text: 'Continue Anyway', action: () => this.dismissWarning() }
            ]
        });
    }
}
```

---

## 11. Implementation Architecture

### 11.1 Class Diagram

```
MemoryManagementSystem
├── DynamicMemoryBudget
│   ├── calculateBaseBudget()
│   ├── getBudgetForMode()
│   └── adjustForTabCount()
├── TabCoordinator (Cross-tab communication)
│   ├── BroadcastChannel
│   ├── electLeader()
│   ├── coordinateMemory()
│   └── SharedResourceManager
├── ProactiveGarbageCollector
│   ├── scheduleGC()
│   ├── runGC()
│   ├── releaseUnusedBlobUrls()
│   └── MemoryLeakDetector
├── ResourcePools
│   ├── DOMElementPool
│   ├── CanvasPool
│   └── WorkerPool
├── MemoryMetrics
│   ├── collect()
│   ├── checkAnomalies()
│   └── getReport()
├── RenderingOptimizer
│   ├── measureFrameRate()
│   ├── adjustQuality()
│   └── LazyRenderer
├── CrashRecovery
│   ├── checkpoint()
│   └── restoreFromCheckpoint()
└── OutOfMemoryHandler
    ├── handleMemoryPressure()
    ├── criticalRecovery()
    └── showCriticalWarning()
```

### 11.2 Initialization Sequence

```javascript
async function initializeMemoryManagement() {
    // 1. Calculate device-appropriate budgets
    const budgetManager = new DynamicMemoryBudget();
    
    // 2. Initialize cross-tab coordination
    const tabCoordinator = new TabCoordinator();
    await tabCoordinator.initialize();
    
    // 3. Set up resource pools
    const pools = {
        dom: new DOMElementPool(),
        canvas: new CanvasPool(),
        workers: new WorkerPool('compression-worker.js', 2)
    };
    
    // 4. Start garbage collection
    const gc = new ProactiveGarbageCollector(memoryManager);
    gc.scheduleGC('normal');
    
    // 5. Start monitoring
    const metrics = new MemoryMetrics();
    metrics.startCollection();
    
    // 6. Initialize crash recovery
    const recovery = new CrashRecovery();
    await recovery.initialize();
    
    // 7. Set up OOM handler
    const oomHandler = new OutOfMemoryHandler();
    oomHandler.initialize();
    
    // 8. Start rendering optimizer
    const renderOptimizer = new RenderingOptimizer();
    renderOptimizer.measureFrameRate();
    
    return {
        budgetManager,
        tabCoordinator,
        pools,
        gc,
        metrics,
        recovery,
        oomHandler,
        renderOptimizer
    };
}
```

---

## Summary: Key Principles

| Principle | Implementation |
|-----------|----------------|
| **Measure First** | MemoryMetrics collects data continuously |
| **Budget Per Mode** | Edit, Present, Background have different limits |
| **Coordinate Tabs** | TabCoordinator uses BroadcastChannel |
| **Pool Resources** | DOM, Canvas, Workers are pooled |
| **Fail Gracefully** | OutOfMemoryHandler degrades, not crashes |
| **Recover Quickly** | CrashRecovery checkpoints every 30s |
| **Optimize Rendering** | RenderingOptimizer adjusts quality dynamically |
| **Clean Proactively** | GC runs before problems, not after |

---

*This specification ensures Story remains performant and stable regardless of presentation size, device capabilities, or multi-tab usage patterns.*
