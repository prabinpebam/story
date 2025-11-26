# Media Asset Integration - Technical Bridge Document

## Purpose

This document bridges the **Media Fill System** and **File Format & Storage System** specifications, providing the exact interfaces and data transformations needed for image/video support implementation.

---

## Key Principle: Session vs Persisted State

Media fills operate in two modes:

| Mode | `src` Value | When |
|------|-------------|------|
| **Session** | `blob:http://...` | During editing session |
| **Persisted** | `assets/images/abc123.jpg` | In saved .str files |

The system must seamlessly convert between these formats.

---

## 1. MediaAssetManager Class

This is the **single source of truth** for all media assets during a session.

### 1.1 Interface

```javascript
// src/core/media/MediaAssetManager.js

class MediaAssetManager {
    constructor() {
        this.assets = new Map();      // assetId → AssetEntry
        this.blobToAsset = new Map(); // blobUrl → assetId
        this.pathToAsset = new Map(); // assetPath → assetId
        this.hashToAsset = new Map(); // contentHash → assetId
    }

    // ─────────────────────────────────────────────────────────────
    // IMPORT: User adds media
    // ─────────────────────────────────────────────────────────────
    
    /**
     * Import a file from user action (drop, paste, file picker)
     * @param {File} file - The file to import
     * @returns {Promise<AssetHandle>} - Handle for use in fills
     */
    async importFile(file) { }

    /**
     * Import from a remote URL
     * @param {string} url - HTTP(S) URL
     * @returns {Promise<AssetHandle>}
     */
    async importUrl(url) { }

    /**
     * Import from clipboard
     * @param {ClipboardEvent} event
     * @returns {Promise<AssetHandle|null>}
     */
    async importFromClipboard(event) { }

    // ─────────────────────────────────────────────────────────────
    // ACCESS: Get asset data for rendering
    // ─────────────────────────────────────────────────────────────

    /**
     * Get blob URL for rendering (creates if needed)
     * @param {string} assetId - The asset identifier
     * @returns {string} - Blob URL for use in img/video src
     */
    getBlobUrl(assetId) { }

    /**
     * Get asset metadata
     * @param {string} assetId
     * @returns {AssetMetadata}
     */
    getMetadata(assetId) { }

    /**
     * Check if asset exists
     * @param {string} assetId
     * @returns {boolean}
     */
    has(assetId) { }

    // ─────────────────────────────────────────────────────────────
    // REFERENCE COUNTING: For undo/redo safety
    // ─────────────────────────────────────────────────────────────

    /**
     * Increment reference count (called when asset used in fill)
     * @param {string} assetId
     */
    retain(assetId) { }

    /**
     * Decrement reference count (called when fill removed)
     * @param {string} assetId
     */
    release(assetId) { }

    /**
     * Mark asset as referenced by history
     * @param {string} assetId
     */
    retainForHistory(assetId) { }

    /**
     * Release history reference
     * @param {string} assetId
     */
    releaseFromHistory(assetId) { }

    // ─────────────────────────────────────────────────────────────
    // SERIALIZATION: For save/load
    // ─────────────────────────────────────────────────────────────

    /**
     * Convert blob URL in state to asset path for saving
     * Used when preparing state for .str file
     * @param {string} blobUrl
     * @returns {string} - Asset path like "assets/images/abc123.jpg"
     */
    blobUrlToAssetPath(blobUrl) { }

    /**
     * Convert asset path to blob URL for runtime use
     * Used when loading from .str file
     * @param {string} assetPath
     * @returns {string} - Blob URL
     */
    assetPathToBlobUrl(assetPath) { }

    /**
     * Get all assets for saving (files to include in .str)
     * @returns {Map<string, Blob>} - assetPath → blob data
     */
    getAssetsForSave() { }

    /**
     * Load assets from .str file
     * @param {Map<string, Blob>} assets - assetPath → blob data
     */
    loadAssets(assets) { }

    /**
     * Build asset index for .str file
     * @returns {Object} - The assets/index.json content
     */
    buildAssetIndex() { }
}

export const mediaAssetManager = new MediaAssetManager();
```

### 1.2 AssetEntry Structure

```javascript
/**
 * @typedef {Object} AssetEntry
 * @property {string} id - Unique identifier (hash-based)
 * @property {string} contentHash - SHA-256 of file content
 * @property {string} originalName - Original filename
 * @property {string} mimeType - MIME type
 * @property {number} size - File size in bytes
 * @property {Blob} blob - The actual file data
 * @property {string|null} blobUrl - Current blob URL (lazy created)
 * @property {'image'|'video'|'font'} category
 * @property {Object} metadata - Type-specific metadata
 * @property {number} refCount - Active references
 * @property {number} historyRefCount - History stack references
 * @property {number} createdAt - Timestamp
 */

/**
 * @typedef {Object} AssetHandle
 * @property {string} assetId - The asset identifier
 * @property {string} blobUrl - Blob URL for immediate use
 * @property {Object} metadata - Asset metadata
 */

/**
 * @typedef {Object} AssetMetadata
 * @property {number} width - For images/videos
 * @property {number} height
 * @property {number} [duration] - For videos (seconds)
 * @property {boolean} [animated] - For GIFs
 * @property {string} [posterFrame] - Data URL of first frame (videos)
 */
```

---

## 2. Fill `src` Value Strategy

### 2.1 During Editing (Runtime)

Fills use **asset IDs** internally, rendered via **blob URLs**:

```javascript
// In state (what's stored in Store)
{
    type: 'image',
    assetId: 'img_abc123def456',  // ← Asset ID reference
    // ... other fill properties
}

// At render time (ShapeElement.js)
const blobUrl = mediaAssetManager.getBlobUrl(fill.assetId);
imgElement.src = blobUrl;
```

### 2.2 In Saved .str File

Fills use **relative paths**:

```javascript
// In presentation.json (inside .str file)
{
    type: 'image',
    assetId: 'img_abc123def456',
    assetPath: 'assets/images/abc123def456.jpg',  // ← Relative path
    // ... other fill properties
}
```

### 2.3 Transformation During Save/Load

```javascript
// StateSerializer.js

function prepareStateForSave(state) {
    return transformFills(state, (fill) => {
        if (fill.type === 'image' || fill.type === 'video') {
            return {
                ...fill,
                assetPath: mediaAssetManager.blobUrlToAssetPath(fill.assetId)
            };
        }
        return fill;
    });
}

function hydrateStateFromLoad(state) {
    return transformFills(state, (fill) => {
        if (fill.type === 'image' || fill.type === 'video') {
            // Asset was already loaded, just need to link
            const assetId = mediaAssetManager.getAssetIdForPath(fill.assetPath);
            return {
                ...fill,
                assetId
            };
        }
        return fill;
    });
}
```

---

## 3. Updated Fill Schema (Revised)

Based on the above, here's the updated fill schema:

```javascript
/**
 * @typedef {Object} ImageFill
 * @property {'image'} type
 * @property {string} assetId - Reference to MediaAssetManager entry
 * @property {string} [assetPath] - Only present in saved files
 * 
 * // Display properties
 * @property {boolean} visible
 * @property {number} opacity - 0-100
 * @property {string} blendMode
 * @property {'fill'|'fit'|'stretch'|'tile'} scaleMode
 * @property {{x: number, y: number}} position
 * @property {number} scale
 * @property {number} rotation
 * @property {Object} filters
 * 
 * // Cached from asset metadata (for quick access)
 * @property {number} originalWidth
 * @property {number} originalHeight
 * @property {boolean} [animated] - For GIFs
 * @property {boolean} [playing] - For animated GIFs
 */

/**
 * @typedef {Object} VideoFill
 * @property {'video'} type
 * @property {string} assetId
 * @property {string} [assetPath]
 * 
 * // All image properties plus:
 * @property {number} playbackRate
 * @property {number} volume
 * @property {boolean} loop
 * @property {boolean} autoplay
 * @property {boolean} muted
 * @property {number} startTime
 * @property {number|null} endTime
 * @property {string} [posterAssetId] - Poster frame as separate asset
 */
```

---

## 4. Asset ID Generation

Asset IDs are deterministic based on content:

```javascript
async function generateAssetId(file) {
    const hash = await computeSHA256(file);
    const prefix = file.type.startsWith('video/') ? 'vid' : 'img';
    const ext = getExtension(file.type);
    
    // Example: img_a1b2c3d4e5f6.jpg
    return `${prefix}_${hash.substring(0, 12)}.${ext}`;
}

// This ensures:
// 1. Same file always gets same ID (deduplication)
// 2. ID includes type hint and extension
// 3. ID is valid as filename
```

---

## 5. Save Flow (Detailed)

```javascript
// FileWriter.js

async function saveToFile(state, fileHandle) {
    // 1. Collect all asset IDs from state
    const usedAssetIds = collectAssetIdsFromState(state);
    
    // 2. Build asset index
    const assetIndex = {};
    const assetFiles = new Map(); // path → Blob
    
    for (const assetId of usedAssetIds) {
        const entry = mediaAssetManager.getEntry(assetId);
        const assetPath = `assets/${entry.category}s/${assetId}`;
        
        assetIndex[assetId] = {
            originalName: entry.originalName,
            type: entry.mimeType,
            size: entry.size,
            hash: entry.contentHash,
            dimensions: entry.metadata,
            path: assetPath
        };
        
        assetFiles.set(assetPath, entry.blob);
    }
    
    // 3. Transform state (add assetPath to fills)
    const savedState = prepareStateForSave(state);
    
    // 4. Generate thumbnails
    const thumbnails = await generateSlideThumbnails(state);
    
    // 5. Create ZIP structure
    const zip = new JSZip();
    
    zip.file('manifest.json', JSON.stringify(buildManifest(state)));
    zip.file('presentation.json', JSON.stringify(savedState));
    zip.file('assets/index.json', JSON.stringify(assetIndex));
    
    for (const [path, blob] of assetFiles) {
        zip.file(path, blob);
    }
    
    for (const [name, data] of thumbnails) {
        zip.file(`assets/thumbnails/${name}`, data);
    }
    
    // 6. Write atomically
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const writable = await fileHandle.createWritable();
    await writable.write(zipBlob);
    await writable.close();
}
```

---

## 6. Load Flow (Detailed)

```javascript
// FileReader.js

async function loadFromFile(fileHandle) {
    // 1. Read ZIP
    const file = await fileHandle.getFile();
    const zip = await JSZip.loadAsync(file);
    
    // 2. Validate manifest
    const manifest = JSON.parse(await zip.file('manifest.json').async('string'));
    validateManifest(manifest);
    
    // 3. Load asset index
    const assetIndex = JSON.parse(await zip.file('assets/index.json').async('string'));
    
    // 4. Load all assets into MediaAssetManager
    for (const [assetId, info] of Object.entries(assetIndex)) {
        const assetBlob = await zip.file(info.path).async('blob');
        
        await mediaAssetManager.loadAsset(assetId, {
            blob: assetBlob,
            originalName: info.originalName,
            mimeType: info.type,
            size: info.size,
            contentHash: info.hash,
            metadata: info.dimensions
        });
    }
    
    // 5. Load and hydrate state
    const savedState = JSON.parse(await zip.file('presentation.json').async('string'));
    const state = hydrateStateFromLoad(savedState);
    
    // 6. Load into store
    store.dispatch('LOAD_STATE', state);
    
    return { manifest, state };
}
```

---

## 7. Interim Storage (Before Save)

During editing, before the user saves to a `.str` file, we need somewhere to persist changes.

### 7.1 IndexedDB Schema

```javascript
// Database: story_db
// Object Stores:

// 1. Session store (auto-save)
{
    store: 'sessions',
    keyPath: 'id',
    schema: {
        id: 'session_123',           // Session ID
        state: { ... },              // Full state tree
        assetIds: ['img_abc...'],    // Referenced asset IDs
        modified: 1699999999999,
        name: 'Untitled'
    }
}

// 2. Asset blob store
{
    store: 'assets',
    keyPath: 'id',
    schema: {
        id: 'img_abc123...',
        blob: Blob,
        mimeType: 'image/jpeg',
        size: 1048576,
        hash: 'sha256:...',
        metadata: { width: 1920, height: 1080 }
    }
}

// 3. Recent files
{
    store: 'recent',
    keyPath: 'id',
    schema: {
        id: 'file_123',
        name: 'My Presentation',
        path: '/path/to/file.str',   // Or handle reference
        thumbnail: 'data:image/...',
        modified: 1699999999999
    }
}
```

### 7.2 Auto-Save Implementation

```javascript
// AutosaveManager.js

class AutosaveManager {
    constructor() {
        this.sessionId = generateSessionId();
        this.saveDebounce = null;
        this.DEBOUNCE_MS = 3000;
    }

    init() {
        // Subscribe to state changes
        store.on('state-changed', () => this.scheduleSave());
    }

    scheduleSave() {
        clearTimeout(this.saveDebounce);
        this.saveDebounce = setTimeout(() => this.save(), this.DEBOUNCE_MS);
    }

    async save() {
        const state = store.getState();
        const assetIds = collectAssetIdsFromState(state);
        
        // Save to IndexedDB
        await db.sessions.put({
            id: this.sessionId,
            state,
            assetIds,
            modified: Date.now(),
            name: state.meta.title
        });
        
        // Also persist any new assets
        for (const assetId of assetIds) {
            if (!(await db.assets.get(assetId))) {
                const entry = mediaAssetManager.getEntry(assetId);
                await db.assets.put({
                    id: assetId,
                    blob: entry.blob,
                    mimeType: entry.mimeType,
                    size: entry.size,
                    hash: entry.contentHash,
                    metadata: entry.metadata
                });
            }
        }
    }

    async recover() {
        const session = await db.sessions.get(this.sessionId);
        if (!session) return null;
        
        // Load assets first
        for (const assetId of session.assetIds) {
            const asset = await db.assets.get(assetId);
            if (asset) {
                await mediaAssetManager.loadAsset(assetId, asset);
            }
        }
        
        return session.state;
    }
}
```

---

## 8. Implementation Order

For media fill implementation to proceed, implement in this order:

### Phase 1: Core Asset Manager (Required for any media)
1. `MediaAssetManager` class with import/access methods
2. Asset ID generation (hash-based)
3. Blob URL management
4. Reference counting basics

### Phase 2: Rendering (Can now display media)
5. ShapeElement media rendering
6. FilterEngine

### Phase 3: UI (Can now edit media)
7. Fill flyout Image/Video tabs
8. Import via drag-drop, paste

### Phase 4: Persistence (Can now save/load)
9. IndexedDB schema & auto-save
10. StateSerializer (blob ↔ path conversion)
11. FileWriter / FileReader
12. ZIP integration

---

## 9. Temporary Shortcuts (Before Full Save/Load)

If you need to ship media fills before full `.str` file support:

### Option A: Data URL Only (Small Files)
- Store images < 5MB as data URLs in state
- Works with current JSON serialization
- No asset manager needed for MVP

```javascript
// Simplified for MVP
{
    type: 'image',
    src: 'data:image/jpeg;base64,...',  // Inline data URL
    // ...
}
```

### Option B: Session-Only Blobs
- Use blob URLs but don't persist across sessions
- Requires reimport after refresh
- Good for testing

### Recommended: Option A + Asset Manager
- Use data URLs for small files
- Use AssetManager + blob URLs for large files
- AssetManager falls back to data URL conversion if no persistence

```javascript
// MediaAssetManager simplified
getBlobOrDataUrl(assetId) {
    const entry = this.assets.get(assetId);
    
    // Small files: return data URL (persists in state)
    if (entry.size < 5 * 1024 * 1024) {
        return entry.dataUrl;  // Pre-computed
    }
    
    // Large files: return blob URL (session only until save/load works)
    return this.getOrCreateBlobUrl(assetId);
}
```

---

## 10. Testing Checklist

Before media fills are complete, verify:

- [ ] Import image → displays correctly
- [ ] Import video → plays correctly  
- [ ] Same image imported twice → deduplicated (same assetId)
- [ ] Delete shape with image → asset released (eventually)
- [ ] Undo delete → asset still available
- [ ] Copy/paste shape with image → works
- [ ] Refresh page → autosave recovered (Phase 4)
- [ ] Save to .str → all assets bundled (Phase 4)
- [ ] Load from .str → all assets restored (Phase 4)
- [ ] Open .str from another computer → works (Phase 4)

---

## Summary

| Question | Answer |
|----------|--------|
| What does `src` contain at runtime? | Asset ID (resolved to blob URL for rendering) |
| What does `src` contain in saved file? | Asset path (`assets/images/...`) |
| Where are asset blobs stored? | MediaAssetManager (memory) → IndexedDB (persist) → .str file (export) |
| How is deduplication done? | SHA-256 content hash → same hash = same asset ID |
| Can I implement media fills now? | Yes, start with MediaAssetManager + inline data URLs for < 5MB |
| What's the minimum for media to work? | MediaAssetManager + ShapeElement rendering |
| What's needed for full persistence? | Add IndexedDB + FileWriter/FileReader + ZIP |
