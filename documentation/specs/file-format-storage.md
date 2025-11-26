# File Format & Storage System - Specification Outline

## Overview

Story presentations are saved as `.str` files - a single portable archive containing all presentation data and assets. This document outlines the complete file format, storage strategies, cloud integration, and browser caching systems.

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

---

## 1. .str File Format

### 1.1 Format Structure

`.str` files are ZIP archives with a specific internal structure:

```
presentation.str (ZIP archive)
├── manifest.json           # File format version, metadata
├── presentation.json       # Main document data (slides, elements, theme)
├── assets/
│   ├── index.json          # Asset registry with hashes
│   ├── images/
│   │   ├── abc123.jpg      # Hash-named original files
│   │   ├── def456.png
│   │   └── ...
│   ├── videos/
│   │   ├── ghi789.mp4
│   │   └── ...
│   ├── fonts/
│   │   └── custom-font.woff2
│   └── thumbnails/         # Preview images
│       ├── slide-1.png
│       └── ...
├── code/                   # CodeFill presets & user code
│   └── presets.json
└── history/                # (Optional) Local history snapshots
    └── ...
```

### 1.2 Manifest.json

```javascript
{
    version: "1.0.0",           // File format version
    appVersion: "0.1.0",        // Story app version that created this
    created: "2024-01-15T10:30:00Z",
    modified: "2024-01-15T14:45:00Z",
    author: "User Name",
    title: "Presentation Title",
    description: "Optional description",
    thumbnail: "assets/thumbnails/cover.png",
    
    // Feature flags for forward compatibility
    features: {
        hasVideo: true,
        hasCodeFill: true,
        hasAnimations: false
    },
    
    // Integrity
    checksum: "sha256:abc123..."
}
```

### 1.3 Presentation.json

- Contains full state tree (slides, elements, theme, masterSlides)
- Media references use relative paths: `"assets/images/abc123.jpg"`
- No blob URLs or data URLs - all media externalized

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
        references: ["slide-1/element-5", "slide-3/element-2"]
    },
    "ghi789.mp4": {
        originalName: "intro-video.mp4",
        type: "video/mp4",
        size: 52428800,
        hash: "sha256:ghi789...",
        dimensions: { width: 1920, height: 1080 },
        duration: 30.5,
        references: ["slide-2/element-1"]
    }
}
```

### 1.5 Sections to Detail

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

### 10.1 Password Protection

- Optional password on .str files
- AES-256 encryption of ZIP contents
- Key derivation with PBKDF2/Argon2

### 10.2 Sharing Security

- Read-only export option
- Expiring share links
- Watermarking for shared presentations

### 10.3 Sections to Detail

- [ ] Encryption implementation
- [ ] Key management
- [ ] Secure cloud token storage
- [ ] Content sanitization (XSS prevention in CodeFill)
- [ ] Audit logging

---

## Implementation Priority

### Phase 1: Local Save/Load (MVP)
1. [ ] .str file structure
2. [ ] Save to local file (File System Access API)
3. [ ] Load from local file
4. [ ] Basic IndexedDB caching

### Phase 2: Cloud Integration
1. [ ] OneDrive integration
2. [ ] Google Drive integration
3. [ ] Sync status UI

### Phase 3: Offline & Advanced
1. [ ] Service Worker for offline
2. [ ] Autosave & recovery
3. [ ] Version migration system

### Phase 4: Import/Export
1. [ ] PDF export
2. [ ] HTML export
3. [ ] PPTX import (basic)

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

## Open Questions

1. **Compression**: Use DEFLATE or store uncompressed for faster access?
2. **Streaming**: Can we support streaming large videos without full download?
3. **Collaboration**: How does this format support real-time collaboration?
4. **Asset CDN**: For shared presentations, should assets be CDN-hosted?
5. **Versioning**: Do we need to support opening multiple versions simultaneously?

---

## Next Steps

1. Detail the manifest.json and presentation.json schemas
2. Design the AssetManager class
3. Prototype File System Access API integration
4. Evaluate ZIP library options (JSZip, fflate)
5. Plan IndexedDB schema
6. Research OAuth flows for OneDrive/Google Drive

---

*This document is a high-level outline. Each section will be expanded into detailed specifications as implementation progresses.*
