# File Format & Storage System - Specification

## Overview

Story presentations are saved as `.str` files - a single portable archive containing all presentation data and assets. This document outlines the complete file format, storage strategies, cloud integration, and browser caching systems.

**Related Specifications:**
- [Progressive Loading](./progressive-loading.md) - Streaming and phased loading
- [Asset Management & Caching](./asset-management.md) - Asset pipeline and cache layers
- [Industry Benchmark](./file-format-benchmark.md) - Comparison with PowerPoint, Keynote, Figma

**Collaboration Specifications:**
- [Real-Time Collaboration](../collaboration/realtime-collaboration.md) - Collaboration architecture overview
- [Cloud Storage Abstraction](../collaboration/cloud-storage-abstraction.md) - OneDrive/Google Drive integration
- [Azure SignalR Integration](../collaboration/azure-signalr-integration.md) - Real-time messaging
- [Authentication](../collaboration/authentication.md) - OAuth with Microsoft/Google
- [Security Model](../collaboration/security-model.md) - Sandboxing, encryption, validation

---

## Table of Contents

1. [.str File Format](#1-str-file-format)
2. [Asset Management](#2-asset-management)
3. [Serialization & Deserialization](#3-serialization--deserialization)
4. [Storage Locations](#4-storage-locations)
5. [Cloud Storage Integration](#5-cloud-storage-integration)
6. [Browser Caching System](#6-browser-caching-system)
7. [Offline Support](#7-offline-support)
8. [Import/Export](#8-importexport)
9. [Version Control & Migration](#9-version-control--migration)
10. [Security & Encryption](#10-security--encryption)
11. [UX Flows](#11-ux-flows)
12. [Performance Targets](#12-performance-targets)
13. [Version History System](#13-version-history-system) *(NEW)*
14. [Recovery System](#14-recovery-system) *(NEW)*

---

## 1. .str File Format

### 1.1 Format Structure

`.str` files are ZIP archives with a **chunked structure** optimized for progressive loading:

```
presentation.str (ZIP archive)
├── manifest.json           # File format version, metadata, chunk index
├── preview/
│   ├── thumbnail.png       # 1200x675 cover image for file browsers
│   └── slides/             # Per-slide thumbnails (optional)
│       ├── slide-001.png
│       └── ...
├── document/
│   ├── metadata.json       # Title, author, description
│   ├── theme.json          # Design tokens, color themes, typography
│   ├── masters.json        # Master slide definitions
│   ├── slides/
│   │   ├── slide-001.json  # Individual slide data (enables progressive load)
│   │   ├── slide-002.json
│   │   └── ...
│   └── relationships.json  # Cross-references between elements
├── assets/
│   ├── index.json          # Asset registry with hashes
│   ├── images/
│   │   ├── abc123.jpg      # Hash-named original files
│   │   └── ...
│   ├── videos/
│   │   └── ...
│   └── fonts/
│       └── ...
├── code/                   # CodeFill presets & user code
│   └── presets.json
├── history/                # Version history (optional)
│   ├── versions.json       # Version manifest
│   └── snapshots/
│       ├── v001.json.gz    # Compressed state snapshots
│       └── ...
├── comments/               # Collaboration data (future)
│   └── threads.json
└── extensions/             # Plugin data (future)
    └── ...
```

> **Design Decision:** Per-slide JSON files enable:
> - Progressive loading (show slide 1 while loading others)
> - Incremental saves (only update changed slides)
> - Parallel processing in Web Workers
> - Smaller diffs for version control

### 1.2 Manifest.json

```javascript
{
    // Format & App Version
    version: "1.0.0",           // File format version (semver)
    appVersion: "0.1.0",        // Story app version that created this
    
    // Timestamps
    created: "2024-01-15T10:30:00Z",
    modified: "2024-01-15T14:45:00Z",
    
    // Authorship
    author: {
        id: "user_abc123",      // For collaboration
        name: "User Name",
        email: "user@example.com"  // Optional
    },
    
    // Document Info
    title: "Presentation Title",
    description: "Optional description",
    thumbnail: "preview/thumbnail.png",
    
    // Content Summary (for quick preview without full parse)
    summary: {
        slideCount: 24,
        totalAssetSize: 52428800,  // bytes
        hasVideo: true,
        hasCodeFill: true,
        hasAnimations: false
    },
    
    // ─────────────────────────────────────────────────────────
    // ASSET INDEX (Critical for Collaboration)
    // Enables byte-range requests for lazy loading assets
    // Collaborators can read specific assets without downloading entire file
    // ─────────────────────────────────────────────────────────
    assetIndex: {
        "hero-image.jpg": {
            path: "assets/images/hero-image.jpg",
            byteOffset: 10001,          // Start position in ZIP file
            byteLength: 39999,          // Size in bytes
            mimeType: "image/jpeg",
            checksum: "sha256:abc123...",
            dimensions: { width: 1920, height: 1080 },
            compression: "store"        // MUST be "store" for streaming
        },
        "intro-video.mp4": {
            path: "assets/videos/intro-video.mp4",
            byteOffset: 50001,
            byteLength: 499949999,      // ~500MB
            mimeType: "video/mp4",
            checksum: "sha256:def456...",
            dimensions: { width: 1920, height: 1080 },
            duration: 120.5,
            compression: "store"        // REQUIRED for video streaming
        }
    },
    
    // Chunk Index (enables random access without decompressing all)
    chunks: {
        "document/metadata.json": { offset: 1024, size: 512 },
        "document/slides/slide-001.json": { offset: 1536, size: 2048 },
        // ... indexed for each file
    },
    
    // Progressive Loading Hints
    loading: {
        priority: ["document/metadata.json", "document/slides/slide-001.json"],
        criticalAssets: ["abc123.jpg", "def456.png"],  // Hero images
        deferrable: ["history/*", "comments/*"]  // Load last
    },
    
    // Relationships Index (PowerPoint-style _rels equivalent)
    relationships: {
        "document/slides/slide-001.json": {
            master: "document/masters.json#default",
            assets: ["assets/images/abc123.jpg"],
            linkedSlides: ["document/slides/slide-003.json"]
        }
    },
    
    // Collaboration Hooks
    collaboration: {
        documentId: "doc_xyz789",   // Unique ID for sync
        lastSyncedAt: "2024-01-15T14:45:00Z",
        conflictResolution: "last-write-wins"  // or "manual"
    },
    
    // Integrity & Validation
    checksum: "sha256:abc123...",
    validation: {
        schema: "https://story.app/schemas/v1.0/str-format.json",
        signatures: []  // For enterprise signing
    }
}
```

### 1.3 Compression Requirements for Streaming

For byte-range asset streaming to work (especially during collaboration), assets must be stored **uncompressed** in the ZIP archive:

```javascript
// ZIP compression settings by file type
const compressionSettings = {
    // MUST be uncompressed for byte-range streaming
    'assets/images/*': 'store',     // Images already compressed (JPEG, PNG)
    'assets/videos/*': 'store',     // Videos already compressed (H.264)
    'assets/audio/*': 'store',      // Audio already compressed (MP3, AAC)
    'assets/fonts/*': 'store',      // Fonts need fast access
    'preview/*': 'store',           // Thumbnails need fast access
    
    // Can be compressed (small, not streamed individually)
    'document/*': 'deflate',        // JSON files benefit from compression
    'manifest.json': 'deflate',     // Small, loaded once
    'history/*': 'deflate',         // Version snapshots
};
```

**Why uncompressed assets?**
- Compressed data cannot be randomly accessed (must decompress from start)
- Video seeking requires reading specific byte offsets
- Most media formats (JPEG, PNG, MP4) are already compressed
- Compression ratio for pre-compressed media is <1%

**Collaboration benefit:** Collaborators can load a 500MB presentation and only download the specific assets they need via HTTP Range requests.

### 1.4 Document Structure

**metadata.json:**
```javascript
{
    title: "Presentation Title",
    description: "Description text",
    keywords: ["design", "product"],
    language: "en-US",
    
    // Compatibility flags
    features: {
        codeEffects: true,
        animations: false,
        interactivity: false
    }
}
```

**slides/slide-001.json:**
```javascript
{
    id: "slide-001",
    order: 0,
    masterId: "master-default",
    
    // Layout
    background: { ... },
    
    // Elements (indexed for efficient updates)
    elements: [
        {
            id: "elem-001",
            type: "text",
            position: { x: 100, y: 200 },
            // ... element data
        }
    ],
    
    // Metadata
    notes: "Speaker notes here",
    duration: null,  // For timed slides
    
    // Hash for change detection
    contentHash: "sha256:..."
}
```

**relationships.json:**
```javascript
{
    // Cross-reference map (inspired by PPTX _rels)
    slideToAssets: {
        "slide-001": ["abc123.jpg", "def456.woff2"],
        "slide-002": ["ghi789.mp4"]
    },
    assetUsage: {
        "abc123.jpg": ["slide-001/elem-001", "slide-003/elem-002"]
    },
    slideLinks: {
        "slide-001/elem-003": { target: "slide-005", action: "navigate" }
    }
}
```

### 1.4 Asset Index

```javascript
// assets/index.json
{
    "abc123.jpg": {
        originalName: "hero-image.jpg",
        type: "image/jpeg",
        size: 1048576,          // bytes
        hash: "sha256:abc123...",
        dimensions: { width: 1920, height: 1080 },
        colorProfile: "sRGB",
        references: ["slide-001/elem-005", "slide-003/elem-002"],
        
        // Processing hints
        optimizations: {
            hasWebP: true,       // WebP variant available
            hasAvif: false,
            thumbnailSizes: [200, 400, 800]
        }
    },
    "ghi789.mp4": {
        originalName: "intro-video.mp4",
        type: "video/mp4",
        size: 52428800,
        hash: "sha256:ghi789...",
        dimensions: { width: 1920, height: 1080 },
        duration: 30.5,
        codec: "h264",
        references: ["slide-002/elem-001"],
        
        // Streaming hints
        hasHLS: false,
        previewFrame: "ghi789-preview.jpg"
    },
    "custom-font.woff2": {
        originalName: "Roboto-Bold.woff2",
        type: "font/woff2",
        size: 45056,
        hash: "sha256:jkl012...",
        fontFamily: "Roboto",
        fontWeight: 700,
        fontStyle: "normal",
        glyphCount: 256,
        references: ["theme"]
    }
}
```

### 1.5 Content Types (PPTX-Inspired)

For maximum tool interoperability, include content type declarations:

```javascript
// document/content-types.json
{
    "defaults": {
        ".json": "application/json",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".woff2": "font/woff2",
        ".mp4": "video/mp4"
    },
    "overrides": {
        "/manifest.json": "application/vnd.story.manifest+json",
        "/document/slides/*.json": "application/vnd.story.slide+json"
    }
}
```

### 1.6 Implementation Guidelines

- [ ] Complete manifest.json schema
- [ ] presentation.json structure (reference data-structures.md)
- [ ] Asset hashing algorithm
- [ ] Thumbnail generation (sizes, formats)
- [ ] Compression settings (ZIP deflate level)
- [ ] Maximum file size considerations
- [ ] Partial/incremental saves

---

## 2. Asset Management

### 2.1 Asset Lifecycle

```
Import Flow:
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  [User drops file]                                               │
│         ↓                                                        │
│  [Hash file content] → Check if already exists in assets/       │
│         ↓                                                        │
│  [Create blob URL for session] → Display immediately            │
│         ↓                                                        │
│  [Register in AssetManager] → Track references                  │
│         ↓                                                        │
│  [On Save] → Copy to assets/ folder → Replace blob with path    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Deduplication

- Assets are content-addressed (named by hash)
- Same image used in multiple places = one file
- Reference counting tracks usage

### 2.3 Sections to Detail

- [ ] AssetManager class design
- [ ] Hash-based deduplication
- [ ] Garbage collection (unreferenced assets)
- [ ] Lazy loading strategies
- [ ] Asset optimization (resize, compress on import)
- [ ] External asset references (URLs)

---

## 3. Serialization & Deserialization

### 3.1 Save Process

```
Save Flow:
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  1. Serialize state to JSON                                      │
│         ↓                                                        │
│  2. Convert blob URLs to asset paths                             │
│         ↓                                                        │
│  3. Copy new assets to temp folder                               │
│         ↓                                                        │
│  4. Generate thumbnails                                          │
│         ↓                                                        │
│  5. Create/update manifest                                       │
│         ↓                                                        │
│  6. ZIP all files                                                │
│         ↓                                                        │
│  7. Write to destination (with atomic replace)                   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 Load Process

```
Load Flow:
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  1. Read ZIP file                                                │
│         ↓                                                        │
│  2. Validate manifest & version                                  │
│         ↓                                                        │
│  3. Parse presentation.json                                      │
│         ↓                                                        │
│  4. Register assets (create blob URLs for immediate use)         │
│         ↓                                                        │
│  5. Hydrate state tree                                           │
│         ↓                                                        │
│  6. Lazy load assets as needed (IntersectionObserver)            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 3.3 Sections to Detail

- [ ] State tree sanitization before save
- [ ] Blob URL to path conversion
- [ ] Path to blob URL conversion on load
- [ ] Progress reporting for large files
- [ ] Error handling & recovery
- [ ] Autosave implementation
- [ ] File locking for concurrent access

---

## 4. Storage Locations

### 4.1 Supported Locations

| Location | API | Use Case |
|----------|-----|----------|
| **Local File System** | File System Access API | Desktop-like experience |
| **Browser Storage** | IndexedDB + OPFS | Web app default |
| **Cloud: OneDrive** | Microsoft Graph API | Microsoft users |
| **Cloud: Google Drive** | Google Drive API | Google users |
| **Cloud: Dropbox** | Dropbox API | Cross-platform |
| **Custom Server** | REST API | Enterprise/self-hosted |

### 4.2 File System Access API

```javascript
// Modern browsers: direct file system access
const handle = await window.showOpenFilePicker({
    types: [{
        description: 'Story Presentation',
        accept: { 'application/x-story': ['.str'] }
    }]
});

// Save to same file
await handle.createWritable().then(w => w.write(data));
```

### 4.3 Sections to Detail

- [ ] File System Access API usage
- [ ] Fallback for unsupported browsers
- [ ] IndexedDB storage for web
- [ ] Origin Private File System (OPFS)
- [ ] Recent files list
- [ ] File associations (OS integration)

---

## 5. Cloud Storage Integration

### 5.1 OneDrive Integration

```
OneDrive Flow:
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  1. OAuth 2.0 authentication with Microsoft                     │
│         ↓                                                        │
│  2. User picks folder/file from OneDrive picker                 │
│         ↓                                                        │
│  3. Download .str to browser memory/cache                       │
│         ↓                                                        │
│  4. Work on presentation locally                                │
│         ↓                                                        │
│  5. On save: Upload .str back to OneDrive                       │
│         ↓                                                        │
│  6. Handle conflicts (last-write-wins or merge dialog)          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 5.2 Google Drive Integration

Similar flow with Google OAuth and Google Drive API.

### 5.3 Sections to Detail

- [ ] OAuth flow for each provider
- [ ] File picker integration
- [ ] Download to local cache
- [ ] Upload with progress
- [ ] Conflict resolution strategies
- [ ] Sync status indicators
- [ ] Offline queue for pending uploads
- [ ] Sharing permissions mapping

---

## 6. Browser Caching System

### 6.1 Cache Architecture

```
Cache Layers:
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Layer 1: Memory Cache (Map)                                     │
│           - Currently viewed slides' assets                      │
│           - Hot path, immediate access                          │
│           - Limited size (500MB)                                 │
│                                                                  │
│  Layer 2: IndexedDB                                              │
│           - Full presentation data                               │
│           - Persists across sessions                            │
│           - Asset blobs stored here                             │
│                                                                  │
│  Layer 3: Cache API / Service Worker                            │
│           - Static app assets                                    │
│           - Offline functionality                               │
│                                                                  │
│  Layer 4: OPFS (Origin Private File System)                     │
│           - Large files (videos)                                │
│           - File-system-like API                                │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 6.2 Cache Keys

- Presentations: `story:presentation:{id}`
- Assets: `story:asset:{hash}`
- Thumbnails: `story:thumb:{slideId}`
- User preferences: `story:prefs`

### 6.3 Cache Eviction

- LRU (Least Recently Used) for memory cache
- Size-based eviction for IndexedDB
- Manual clear for OPFS

### 6.4 Sections to Detail

- [ ] IndexedDB schema design
- [ ] OPFS for large video files
- [ ] Cache warming strategies
- [ ] Background prefetching
- [ ] Storage quota management
- [ ] Cache invalidation
- [ ] Cross-tab coordination

---

## 7. Offline Support

### 7.1 Service Worker Strategy

```javascript
// Service Worker: stale-while-revalidate for app shell
// Network-first for presentation files
// Cache-first for assets (immutable by hash)
```

### 7.2 Offline Editing

- Full editing capabilities offline
- Changes queued for sync
- Conflict resolution on reconnect

### 7.3 Sections to Detail

- [ ] Service worker registration
- [ ] Caching strategies per resource type
- [ ] Sync queue implementation
- [ ] Conflict detection & resolution
- [ ] "Last synced" indicators
- [ ] Background sync API usage

---

## 8. Import/Export

### 8.1 Import Formats

| Format | Support | Notes |
|--------|---------|-------|
| **.str** | Full | Native format |
| **.pptx** | Partial | Basic slides, text, images |
| **.key** | Future | Keynote import |
| **.pdf** | Future | PDF to slides |
| **Images** | Full | Drag/drop creates slides |

### 8.2 Export Formats

| Format | Support | Notes |
|--------|---------|-------|
| **.str** | Full | Native format |
| **.pptx** | Future | PowerPoint compatibility |
| **.pdf** | Full | Print/share format |
| **.html** | Full | Self-contained web page |
| **.mp4** | Future | Video export |
| **Images** | Full | PNG/JPEG per slide |

### 8.3 Sections to Detail

- [ ] PPTX parsing library selection
- [ ] Mapping Story elements to PPTX
- [ ] PDF generation (server vs client)
- [ ] HTML export (bundled assets)
- [ ] Video export pipeline
- [ ] Export progress & cancellation

---

## 9. Version Control & Migration

### 9.1 File Format Versions

```javascript
const MIGRATIONS = {
    "0.9.0": migrateFromV09,   // Legacy beta format
    "1.0.0": identity,          // Current version
    "1.1.0": migrateToV11       // Future version
};
```

### 9.2 Migration Strategy

- Check manifest version on load
- Apply migrations sequentially
- Never modify original file during migration
- Save migrated version to new file

### 9.3 Sections to Detail

- [ ] Version comparison logic
- [ ] Migration function patterns
- [ ] Rollback strategies
- [ ] Version compatibility matrix
- [ ] "Open with older version" warnings

---

## 10. Security & Encryption

> **See [Security Model Specification](../collaboration/security-model.md) for complete details.**

### 10.1 Password Protection

- Optional password on .str files
- AES-256-GCM encryption of sensitive content
- Key derivation with Argon2id (memory-hard)
- Per-chunk encryption for progressive loading

### 10.2 Code Execution Security

- **Sandboxed Web Workers** for all CodeFill execution
- **Content Security Policy** headers
- **Asset validation** for uploaded files
- No network access from code fills (offline-first execution)

### 10.3 Sharing Security

- Read-only export option
- Expiring share links
- Watermarking for shared presentations

---

## 11. UX Flows

### 11.1 New User First Open

```
┌─────────────────────────────────────────────────────────────────────┐
│  User opens app → Blank presentation                                │
│         ↓                                                           │
│  User makes first change → "Untitled" appears in title bar         │
│         ↓                                                           │
│  User clicks Save (or Cmd+S) → Native file picker appears          │
│         ↓                                                           │
│  Suggest: Documents/Story/[Untitled].str                            │
│         ↓                                                           │
│  On first cloud save → Prompt for Google OAuth                      │
│         ↓                                                           │
│  After auth → Remember preference for this browser                  │
└─────────────────────────────────────────────────────────────────────┘
```

### 11.2 Returning User Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│  User opens app → Recent files grid + "Open File" button           │
│         ↓                                                           │
│  Recent files show: thumbnail, title, last modified, location icon │
│         ↓                                                           │
│  Click recent file → Progressive load with skeleton UI             │
│         ↓                                                           │
│  Loading states: Skeleton cards → Basic content → Full fidelity    │
└─────────────────────────────────────────────────────────────────────┘
```

### 11.3 Save Status Indicators

| State | Visual | Behavior |
|-------|--------|----------|
| Clean | No indicator | All changes saved |
| Dirty | • dot in title | Unsaved changes |
| Saving | Spinner | Save in progress |
| Error | ⚠️ Warning | Save failed, retry available |
| Offline | Cloud-off icon | Changes queued for sync |

### 11.4 Error Recovery

- Failed saves: Toast with "Retry" button + auto-retry after 30s
- Conflict detected: Side-by-side diff view with merge options
- Corrupt file: Attempt recovery from last autosave, offer export as PDF

---

## 12. Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to first paint | <100ms | Show skeleton immediately |
| Time to interactive | <500ms | User can navigate slides |
| Small presentation load | <1s | <10 slides, <10MB assets |
| Large presentation load | <5s | 100 slides, 500MB assets |
| Autosave latency | <200ms | Debounced, non-blocking |
| Export to PDF | <10s | 50 slides |

### Memory Budgets

| Component | Limit |
|-----------|-------|
| Memory LRU Cache | 100MB |
| Decoded images (active) | 200MB |
| Total heap (target) | 500MB |
| IndexedDB per presentation | 500MB |

---

## 13. Version History System

> **Inspired by:** Figma's named versions, Google Docs version history, Git-style snapshots

### 13.1 Overview

Version history enables users to track changes, create named milestones, and restore previous states without leaving the application.

### 13.2 Version Types

| Type | Trigger | Retention | Storage |
|------|---------|-----------|---------|
| **Auto-checkpoint** | Every 10 edits or 5 minutes | 24 hours rolling | Local only |
| **Session snapshot** | On close/open | 7 days | Local + cloud |
| **Named version** | User creates | Permanent | Full history |
| **Collaborative checkpoint** | On sync conflict | Until resolved | Temp storage |

### 13.3 Storage Structure

```javascript
// history/versions.json
{
    currentHead: "v-2024-01-15-001",
    versions: [
        {
            id: "v-2024-01-15-001",
            type: "named",
            name: "Final Draft",
            description: "Ready for review",
            created: "2024-01-15T14:30:00Z",
            author: { id: "user_abc", name: "User" },
            slideCount: 24,
            checksum: "sha256:...",
            
            // Storage optimization
            storage: {
                type: "delta",         // or "full"
                baseVersion: "v-2024-01-14-003",
                deltaSize: 4096        // bytes
            }
        }
    ]
}
```

### 13.4 Delta Storage

To minimize storage, use delta compression:

```javascript
// history/snapshots/v-2024-01-15-001.json.gz
{
    base: "v-2024-01-14-003",
    operations: [
        { op: "replace", path: "/slides/slide-003/elements/0/text", value: "Updated" },
        { op: "add", path: "/slides/slide-025", value: { ... } },
        { op: "remove", path: "/slides/slide-010" }
    ]
}
```

**Storage savings (typical):**
- 100-slide presentation: ~5MB full state
- Average delta: ~10-50KB
- 50 versions with delta: ~7MB (vs. 250MB full)

### 13.5 Version Operations

```javascript
// Version History API
class VersionHistoryManager {
    async createVersion(name, description) {
        const snapshot = this.captureState();
        const delta = this.computeDelta(this.lastCheckpoint, snapshot);
        await this.storeVersion({ name, description, delta });
    }
    
    async restoreVersion(versionId) {
        const state = await this.reconstructState(versionId);
        await this.setState(state);
        this.createAutoCheckpoint("Restored from: " + versionId);
    }
    
    async compareVersions(v1, v2) {
        return this.diffStates(
            await this.reconstructState(v1),
            await this.reconstructState(v2)
        );
    }
}
```

### 13.6 UI Integration

- **Version panel:** Sidebar showing version timeline
- **Quick compare:** Overlay showing diff between versions
- **Restore with copy:** "Restore as new file" option
- **Version naming:** Prompted on significant actions (before share, before export)

---

## 14. Recovery System

> **Inspired by:** Word/Excel crash recovery, VS Code file recovery, native app autosave

### 14.1 Overview

Robust recovery system to prevent data loss from crashes, browser closures, or storage failures.

### 14.2 Recovery Layers

```
Recovery Priority Stack:
┌─────────────────────────────────────────────────────────────────┐
│  Layer 1: In-Memory State (Lost on crash)                       │
│           - Current working state                               │
│           - Undo/redo stack                                     │
│                                                                 │
│  Layer 2: Autosave (Every 30s to IndexedDB)                     │
│           - Full state snapshot                                 │
│           - Recovery flag set                                   │
│                                                                 │
│  Layer 3: Session Storage (On tab close)                        │
│           - Captured via beforeunload                           │
│           - Quick recovery on accidental close                  │
│                                                                 │
│  Layer 4: OPFS Checkpoint (Every 5 min)                         │
│           - File-system-level durability                        │
│           - Survives browser storage pressure                   │
│                                                                 │
│  Layer 5: Original File (User's last explicit save)             │
│           - Always preserved until user saves                   │
│           - Never overwritten during editing                    │
└─────────────────────────────────────────────────────────────────┘
```

### 14.3 Recovery Data Structure

```javascript
// Stored in IndexedDB: story:recovery:{presentationId}
{
    presentationId: "pres_abc123",
    timestamp: "2024-01-15T14:45:00Z",
    
    // Recovery state
    state: { /* full state tree */ },
    
    // Metadata
    metadata: {
        slideCount: 24,
        dirtyChanges: true,
        lastSavedFile: "My Presentation.str",
        originalChecksum: "sha256:..."
    },
    
    // Operation log (last 100 actions)
    recentOperations: [
        { type: "UPDATE_ELEMENT", timestamp: "...", summary: "Changed text" }
    ],
    
    // Recovery hints
    recovery: {
        cursorPosition: { slideId: "slide-003", elementId: "elem-001" },
        scrollPosition: { x: 0, y: 250 },
        selectedElements: ["elem-001", "elem-002"],
        panelStates: { propertyInspector: "open" }
    }
}
```

### 14.4 Recovery Detection

```javascript
// On app startup
async function checkForRecovery() {
    const recoveryData = await db.recovery.toArray();
    
    for (const data of recoveryData) {
        // Check if file was properly closed
        if (data.metadata.dirtyChanges) {
            // Show recovery dialog
            const choice = await showRecoveryDialog({
                title: data.metadata.lastSavedFile,
                savedAt: data.timestamp,
                slideCount: data.metadata.slideCount
            });
            
            if (choice === 'recover') {
                await loadRecoveredState(data);
            } else if (choice === 'discard') {
                await db.recovery.delete(data.presentationId);
            } else if (choice === 'saveCopy') {
                await saveRecoveredAsCopy(data);
            }
        }
    }
}
```

### 14.5 Recovery UI

**Recovery Dialog:**
```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️  Recovered Unsaved Changes                                  │
│                                                                 │
│  "My Presentation.str"                                          │
│  Last autosaved: 2 minutes ago (24 slides)                      │
│                                                                 │
│  Would you like to:                                             │
│                                                                 │
│  [Recover Changes]  [Open Original]  [Save as Copy]             │
│                                                                 │
│  ☐ Don't ask again for this file                                │
└─────────────────────────────────────────────────────────────────┘
```

### 14.6 Failure Scenarios

| Scenario | Detection | Recovery |
|----------|-----------|----------|
| Browser crash | Recovery flag not cleared | Full autosave restore |
| Tab closed | beforeunload captured | Session storage restore |
| Storage quota exceeded | StorageError caught | OPFS fallback + warning |
| Corrupt autosave | Checksum mismatch | Previous checkpoint or original |
| Cloud sync failure | Network error | Local-first, queue for retry |

### 14.7 Recovery Guarantees

- **Maximum data loss:** 30 seconds of work (autosave interval)
- **Recovery success rate:** 99%+ (multiple fallback layers)
- **Recovery time:** <2 seconds (immediate state hydration)
- **User notification:** Always shown for recovered files

---

## Implementation Priority

> **Based on [Industry Benchmark Analysis](./file-format-benchmark.md)**

### Phase 0: Foundation (Prerequisites)
1. [ ] Web Worker infrastructure for background operations
2. [ ] Streaming ZIP library evaluation (fflate recommended)
3. [ ] Error boundary and recovery system
4. [ ] Basic telemetry for performance monitoring

### Phase 1: Local Save/Load (MVP)
1. [ ] .str file structure with per-slide JSON files *(Updated)*
2. [ ] Manifest with chunk index for random access *(New)*
3. [ ] Save to local file (File System Access API)
4. [ ] Load from local file with skeleton UI
5. [ ] Content-addressable asset naming *(Improved)*
6. [ ] Basic IndexedDB caching (LRU)
7. [ ] Autosave to IndexedDB (every 30s or on blur)

### Phase 2: Recovery & Versioning *(New Priority)*
1. [ ] Multi-layer recovery system (Section 14)
2. [ ] Auto-checkpoint on edit threshold
3. [ ] Session storage capture on tab close
4. [ ] Recovery dialog and restoration flow
5. [ ] Basic version history (named versions)
6. [ ] Delta compression for version storage

### Phase 3: Cloud Integration
1. [ ] Google OAuth 2.0 with PKCE flow
2. [ ] Google Drive integration (save/load)
3. [ ] Sync status UI and offline queue
4. [ ] OneDrive integration (future)

### Phase 4: Progressive Loading & Caching
1. [ ] Chunk-based slide loading
2. [ ] Asset lazy loading with prefetch
3. [ ] Multi-layer cache system
4. [ ] Background prefetch strategies
5. [ ] Per-slide thumbnail generation

### Phase 5: Offline & Sync
1. [ ] Service Worker for offline
2. [ ] Conflict resolution UI
3. [ ] Background sync API usage
4. [ ] Sync queue persistence

### Phase 6: Import/Export *(Updated)*
1. [ ] PDF export with code effect rasterization
2. [ ] HTML export (self-contained)
3. [ ] PPTX import (slides, text, images)
4. [ ] PPTX export (future)
5. [ ] Keynote import (future)

### Phase 7: Advanced Features
1. [ ] End-to-end encryption for sensitive presentations
2. [ ] Digital signatures for enterprise
3. [ ] Comment threads (collaboration foundation)
4. [ ] Extension data hooks

---

## Dependencies

| Feature | Depends On |
|---------|------------|
| .str format | Media fill system (for asset handling) |
| Cloud sync | Authentication system |
| Offline support | Service worker infrastructure |
| PDF export | PDF generation library |
| PPTX import | Office format parser |

---

## MVP Strategy: Media Before Full Persistence

To enable media fill development before full `.str` file support, use this phased approach:

### MVP Phase 1: Inline Data URLs (Works Now)

For images < 2MB, store as data URLs directly in state:

```javascript
// In fill object (works with current JSON state)
{
    type: 'image',
    assetId: 'img_abc123',
    inlineDataUrl: 'data:image/jpeg;base64,...',  // Stored in state
    // ... other properties
}
```

- ✅ Works with existing save/load (JSON stringify)
- ✅ Copy/paste works automatically
- ✅ Undo/redo works automatically
- ❌ Large files will bloat state
- ❌ Not suitable for videos

### MVP Phase 2: Hybrid (Recommended)

```javascript
// MediaAssetManager with hybrid storage
class MediaAssetManager {
    async importFile(file) {
        const assetId = await this.generateAssetId(file);
        
        if (file.size < 2 * 1024 * 1024) {
            // Small: convert to data URL, store inline
            const dataUrl = await this.fileToDataUrl(file);
            this.assets.set(assetId, {
                id: assetId,
                dataUrl,  // Persists with state
                blob: null,
                category: 'image'
            });
        } else {
            // Large: store blob, session-only until proper save
            const blobUrl = URL.createObjectURL(file);
            this.assets.set(assetId, {
                id: assetId,
                dataUrl: null,
                blob: file,
                blobUrl,
                category: file.type.startsWith('video/') ? 'video' : 'image'
            });
        }
        
        return { assetId, ... };
    }

    getBlobUrl(assetId) {
        const entry = this.assets.get(assetId);
        if (entry.dataUrl) return entry.dataUrl;  // Works as src
        if (entry.blobUrl) return entry.blobUrl;
        // Create blob URL if needed
        entry.blobUrl = URL.createObjectURL(entry.blob);
        return entry.blobUrl;
    }

    // For state serialization
    getInlineDataForState(assetId) {
        const entry = this.assets.get(assetId);
        return entry?.dataUrl || null;  // Only small files
    }
}
```

### MVP Phase 3: IndexedDB Persistence

Add IndexedDB to persist large files across sessions:

```javascript
// On import of large file
await db.assets.put({ id: assetId, blob: file, metadata: {...} });

// On load
for (const asset of await db.assets.toArray()) {
    mediaAssetManager.loadFromDb(asset);
}
```

### MVP Phase 4: Full .str Support

Finally implement FileWriter/FileReader to bundle everything.

### What Media Fills Need from Storage

| Capability | MVP 1 | MVP 2 | MVP 3 | Full |
|------------|-------|-------|-------|------|
| Small images work | ✅ | ✅ | ✅ | ✅ |
| Large images work | ❌ | ⚠️ Session | ✅ | ✅ |
| Videos work | ❌ | ⚠️ Session | ✅ | ✅ |
| Survives refresh | ✅ | ⚠️ Small only | ✅ | ✅ |
| Saves to file | ✅ | ⚠️ Small only | ❌ | ✅ |
| Portable .str file | ❌ | ❌ | ❌ | ✅ |

**Recommendation**: Implement MVP Phase 2 first. This allows full media fill UI/UX development with the limitation that large files are session-only.

---

## Open Questions (Resolved)

| Question | Resolution |
|----------|------------|
| **Compression** | Use streaming ZIP (fflate) with per-chunk compression; store thumbnails uncompressed for fast preview |
| **Streaming** | Chunk-based loading allows streaming; large videos use range requests |
| **Collaboration** | Future-proofed with Google OAuth; see [Real-Time Collaboration](../collaboration/realtime-collaboration.md) |
| **Asset CDN** | For shared presentations, assets uploaded to CDN with signed URLs |
| **Versioning** | Migration functions applied sequentially; no multi-version support needed |

---

## Related Documents

- [Industry Benchmark Analysis](./file-format-benchmark.md) *(New)*
- [Progressive Loading Specification](./progressive-loading.md)
- [Asset Management & Caching](./asset-management.md)
- [Security Model](../collaboration/security-model.md)
- [Real-Time Collaboration](../collaboration/realtime-collaboration.md)
- [Media Asset Integration (Tech Spec)](../../tech-specs/fills/media-asset-integration.md)
- [File Format Implementation Plan](../../plans/file-format-implementation-plan.md)

---

## Next Steps

1. ✅ Detail the manifest.json and presentation.json schemas
2. ✅ Design the AssetManager class → See [Media Asset Integration](../../tech-specs/fills/media-asset-integration.md)
3. ✅ Document progressive loading strategy → See [Progressive Loading](./progressive-loading.md)
4. ✅ Document real-time collaboration architecture → See [Real-Time Collaboration](../collaboration/realtime-collaboration.md)
5. ✅ Document security model → See [Security Model](../collaboration/security-model.md)
6. ✅ Document asset caching system → See [Asset Management](./asset-management.md)
7. Prototype File System Access API integration
8. Evaluate ZIP library options (fflate recommended)
9. Plan IndexedDB schema
10. Implement Google OAuth 2.0 with PKCE flow

---

*This document is a high-level outline. Each section will be expanded into detailed specifications as implementation progresses.*