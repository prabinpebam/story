# File Format & Storage - Implementation Plan

## Overview

This plan implements the `.str` file format (ZIP-based) with progressive loading, cloud storage integration (OneDrive/Google Drive), and offline support.

**Related Specifications:**
- [File Format & Storage](../specs/storage/file-format-storage.md)
- [Progressive Loading](../specs/storage/progressive-loading.md)
- [Asset Management & Caching](../specs/storage/asset-management.md)
- [Cloud Storage Abstraction](../specs/collaboration/cloud-storage-abstraction.md)

**Validation:**
- [Validation Framework](./validation-framework.md) - Testing and quality gates

**Dependencies:**
- ✅ Identity Management (Phase 1-5 complete for cloud access)
- ✅ Design system
- ⚠️ No breaking changes to existing save/load

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing save/load | CRITICAL | Implement parallel, feature flag |
| Large file performance | HIGH | Progressive loading, streaming |
| Browser storage limits | HIGH | IndexedDB quota management |
| Cloud API rate limits | MEDIUM | Exponential backoff, caching |

---

## Phase 1: Core File Format (ZIP) - No Breaking Changes

**Goal:** Create ZIP archive reader/writer without changing existing save logic.

**Duration:** 3-4 days

### Tasks

#### 1.1 Install JSZip Library
```bash
npm install jszip
```

#### 1.2 ZIP File Writer
**File:** `src/core/storage/ZipFileWriter.js` (NEW)
```javascript
import JSZip from 'jszip';

/**
 * Create .str file (ZIP archive)
 */
export class ZipFileWriter {
    constructor() {
        this.zip = new JSZip();
    }
    
    /**
     * Add manifest.json
     */
    addManifest(manifest) {
        this.zip.file('manifest.json', JSON.stringify(manifest, null, 2));
    }
    
    /**
     * Add document metadata
     */
    addMetadata(metadata) {
        this.zip.file('document/metadata.json', 
            JSON.stringify(metadata, null, 2));
    }
    
    /**
     * Add individual slide
     */
    addSlide(slideId, slideData) {
        this.zip.file(`document/slides/${slideId}.json`, 
            JSON.stringify(slideData, null, 2));
    }
    
    /**
     * Add theme
     */
    addTheme(theme) {
        this.zip.file('document/theme.json', 
            JSON.stringify(theme, null, 2));
    }
    
    /**
     * Add asset (image, video, font)
     */
    async addAsset(path, blob) {
        this.zip.file(`assets/${path}`, blob);
    }
    
    /**
     * Add thumbnail
     */
    async addThumbnail(blob) {
        this.zip.file('preview/thumbnail.png', blob);
    }
    
    /**
     * Generate .str file
     */
    async generate() {
        return this.zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });
    }
}
```

#### 1.3 ZIP File Reader
**File:** `src/core/storage/ZipFileReader.js` (NEW)
```javascript
import JSZip from 'jszip';

/**
 * Read .str file (ZIP archive)
 */
export class ZipFileReader {
    constructor(fileBlob) {
        this.zip = null;
        this.fileBlob = fileBlob;
    }
    
    /**
     * Initialize (async unzip)
     */
    async init() {
        this.zip = await JSZip.loadAsync(this.fileBlob);
    }
    
    /**
     * Read manifest
     */
    async readManifest() {
        const content = await this.zip.file('manifest.json').async('text');
        return JSON.parse(content);
    }
    
    /**
     * Read metadata
     */
    async readMetadata() {
        const content = await this.zip.file('document/metadata.json').async('text');
        return JSON.parse(content);
    }
    
    /**
     * List all slides
     */
    async listSlides() {
        const slideFiles = Object.keys(this.zip.files)
            .filter(path => path.startsWith('document/slides/'))
            .filter(path => path.endsWith('.json'));
        
        return slideFiles.map(path => {
            const match = path.match(/slide-(\d+)\.json/);
            return match ? match[1] : null;
        }).filter(Boolean);
    }
    
    /**
     * Read single slide
     */
    async readSlide(slideId) {
        const path = `document/slides/slide-${slideId}.json`;
        const content = await this.zip.file(path).async('text');
        return JSON.parse(content);
    }
    
    /**
     * Read theme
     */
    async readTheme() {
        const content = await this.zip.file('document/theme.json').async('text');
        return JSON.parse(content);
    }
    
    /**
     * Read asset as blob
     */
    async readAsset(path) {
        return this.zip.file(`assets/${path}`).async('blob');
    }
    
    /**
     * Check if file exists
     */
    hasFile(path) {
        return this.zip.file(path) !== null;
    }
}
```

**Testing:**
- ✅ Can create ZIP with multiple files
- ✅ Can read ZIP and extract files
- ✅ Compression works (file size reduced)
- ✅ Can handle large files (>10MB)

**What might break:** Nothing (not integrated yet)

---

## Phase 2: Manifest & Metadata Structure

**Goal:** Define file metadata following spec.

**Duration:** 2 days

### Tasks

#### 2.1 Manifest Builder
**File:** `src/core/storage/ManifestBuilder.js` (NEW)
```javascript
/**
 * Build manifest.json following spec
 */
export class ManifestBuilder {
    constructor() {
        this.manifest = {
            formatType: 'story-presentation',
            formatVersion: '1.0.0',
            appVersion: APP_VERSION,
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            chunkIndex: {
                slides: [],
                assets: []
            }
        };
    }
    
    setTitle(title) {
        this.manifest.title = title;
    }
    
    setAuthor(author) {
        this.manifest.author = author;
    }
    
    addSlideChunk(slideId, size) {
        this.manifest.chunkIndex.slides.push({
            id: slideId,
            path: `document/slides/slide-${slideId}.json`,
            size: size
        });
    }
    
    addAssetChunk(assetId, path, size, hash) {
        this.manifest.chunkIndex.assets.push({
            id: assetId,
            path: `assets/${path}`,
            size: size,
            hash: hash
        });
    }
    
    build() {
        return this.manifest;
    }
}
```

#### 2.2 Metadata Builder
**File:** `src/core/storage/MetadataBuilder.js` (NEW)
```javascript
export class MetadataBuilder {
    constructor() {
        this.metadata = {
            title: 'Untitled Presentation',
            description: '',
            author: null,
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            slideCount: 0,
            tags: []
        };
    }
    
    setTitle(title) {
        this.metadata.title = title;
    }
    
    setAuthor(user) {
        this.metadata.author = {
            id: user.id,
            name: user.name,
            email: user.email
        };
    }
    
    setSlideCount(count) {
        this.metadata.slideCount = count;
    }
    
    build() {
        return this.metadata;
    }
}
```

**Testing:**
- ✅ Manifest follows spec structure
- ✅ Metadata includes required fields
- ✅ Timestamps in ISO format

**What might break:** Nothing (data structures only)

---

## Phase 3: File Serialization (Save to .str)

**Goal:** Convert current app state to .str file format.

**Duration:** 4-5 days

### Tasks

#### 3.1 Presentation Serializer
**File:** `src/core/storage/PresentationSerializer.js` (NEW)
```javascript
import { ZipFileWriter } from './ZipFileWriter.js';
import { ManifestBuilder } from './ManifestBuilder.js';
import { MetadataBuilder } from './MetadataBuilder.js';

/**
 * Serialize app state to .str file
 */
export class PresentationSerializer {
    constructor(appState) {
        this.state = appState;
        this.writer = new ZipFileWriter();
    }
    
    async serialize() {
        // 1. Build manifest
        const manifest = await this.buildManifest();
        this.writer.addManifest(manifest);
        
        // 2. Build metadata
        const metadata = this.buildMetadata();
        this.writer.addMetadata(metadata);
        
        // 3. Add theme
        this.writer.addTheme(this.state.theme);
        
        // 4. Add slides (one file per slide)
        for (const slide of this.state.slides) {
            this.writer.addSlide(slide.id, this.serializeSlide(slide));
        }
        
        // 5. Add assets
        await this.addAssets();
        
        // 6. Generate thumbnail
        await this.addThumbnail();
        
        // 7. Generate ZIP
        return this.writer.generate();
    }
    
    async buildManifest() {
        const builder = new ManifestBuilder();
        builder.setTitle(this.state.metadata.title);
        
        const user = await authManager.getCurrentUser();
        if (user) {
            builder.setAuthor(user.name);
        }
        
        // Add chunk info
        for (const slide of this.state.slides) {
            const slideJson = JSON.stringify(this.serializeSlide(slide));
            builder.addSlideChunk(slide.id, slideJson.length);
        }
        
        return builder.build();
    }
    
    buildMetadata() {
        const builder = new MetadataBuilder();
        builder.setTitle(this.state.metadata.title);
        builder.setSlideCount(this.state.slides.length);
        
        const user = authManager.getCurrentUser();
        if (user) {
            builder.setAuthor(user);
        }
        
        return builder.build();
    }
    
    serializeSlide(slide) {
        return {
            id: slide.id,
            elements: slide.elements.map(el => this.serializeElement(el)),
            background: slide.background,
            layout: slide.layout,
            notes: slide.notes || ''
        };
    }
    
    serializeElement(element) {
        // Convert element to JSON-safe format
        return {
            id: element.id,
            type: element.type,
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
            rotation: element.rotation || 0,
            props: element.props
        };
    }
    
    async addAssets() {
        // Get all referenced assets
        const assetIds = this.collectAssetIds();
        
        for (const assetId of assetIds) {
            const asset = this.state.assets.get(assetId);
            if (asset && asset.blob) {
                const hash = await this.hashAsset(asset.blob);
                const ext = asset.type.split('/')[1];
                const path = `images/${hash}.${ext}`;
                
                await this.writer.addAsset(path, asset.blob);
            }
        }
    }
    
    collectAssetIds() {
        const ids = new Set();
        
        for (const slide of this.state.slides) {
            for (const element of slide.elements) {
                if (element.type === 'image' && element.props.assetId) {
                    ids.add(element.props.assetId);
                }
                if (element.type === 'video' && element.props.assetId) {
                    ids.add(element.props.assetId);
                }
            }
        }
        
        return Array.from(ids);
    }
    
    async hashAsset(blob) {
        const buffer = await blob.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    async addThumbnail() {
        // Render first slide to canvas
        const canvas = await this.renderSlideToCanvas(this.state.slides[0]);
        
        // Convert to blob
        const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/png');
        });
        
        await this.writer.addThumbnail(blob);
    }
    
    async renderSlideToCanvas(slide) {
        // Use existing rendering engine
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 675;
        
        // Render slide (implementation depends on rendering system)
        // For now, simple implementation
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = slide.background?.color || '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        return canvas;
    }
}
```

#### 3.2 Integration with Save Button
**File:** Update existing save handler
```javascript
import { PresentationSerializer } from './core/storage/PresentationSerializer.js';

async function handleSave() {
    try {
        // Get current state
        const state = getCurrentAppState();
        
        // Serialize to .str
        const serializer = new PresentationSerializer(state);
        const strBlob = await serializer.serialize();
        
        // Trigger download
        const url = URL.createObjectURL(strBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${state.metadata.title || 'presentation'}.str`;
        a.click();
        URL.revokeObjectURL(url);
        
        showToast('Presentation saved');
    } catch (err) {
        console.error('Save failed:', err);
        showToast('Save failed', 'error');
    }
}
```

**Testing:**
- ✅ Save creates valid .str ZIP file
- ✅ File can be opened in ZIP utility
- ✅ manifest.json is valid JSON
- ✅ Slides are in separate files
- ✅ Assets are included
- ✅ Thumbnail is generated

**What might break:**
- Existing save button behavior
- **Mitigation:** Keep old save as fallback, feature flag

---

## Phase 4: File Deserialization (Load from .str)

**Goal:** Load .str files back into app state.

**Duration:** 4-5 days

### Tasks

#### 4.1 Presentation Deserializer
**File:** `src/core/storage/PresentationDeserializer.js` (NEW)
```javascript
import { ZipFileReader } from './ZipFileReader.js';

export class PresentationDeserializer {
    constructor(strBlob) {
        this.reader = new ZipFileReader(strBlob);
        this.assetCache = new Map();
    }
    
    async deserialize() {
        await this.reader.init();
        
        // 1. Read manifest (version check)
        const manifest = await this.reader.readManifest();
        this.validateManifest(manifest);
        
        // 2. Read metadata
        const metadata = await this.reader.readMetadata();
        
        // 3. Read theme
        const theme = await this.reader.readTheme();
        
        // 4. Read slides (progressive)
        const slideIds = await this.reader.listSlides();
        const slides = [];
        
        for (const slideId of slideIds) {
            const slideData = await this.reader.readSlide(slideId);
            slides.push(this.deserializeSlide(slideData));
        }
        
        // 5. Load assets (lazy)
        // Assets loaded on-demand when elements are rendered
        
        return {
            metadata,
            theme,
            slides,
            assetLoader: (assetId) => this.loadAsset(assetId)
        };
    }
    
    validateManifest(manifest) {
        if (manifest.formatType !== 'story-presentation') {
            throw new Error('Invalid file format');
        }
        
        if (manifest.formatVersion !== '1.0.0') {
            console.warn('File version mismatch, attempting migration');
        }
    }
    
    deserializeSlide(slideData) {
        return {
            id: slideData.id,
            elements: slideData.elements.map(el => this.deserializeElement(el)),
            background: slideData.background,
            layout: slideData.layout,
            notes: slideData.notes || ''
        };
    }
    
    deserializeElement(elementData) {
        return {
            id: elementData.id,
            type: elementData.type,
            x: elementData.x,
            y: elementData.y,
            width: elementData.width,
            height: elementData.height,
            rotation: elementData.rotation || 0,
            props: elementData.props
        };
    }
    
    async loadAsset(assetId) {
        // Check cache
        if (this.assetCache.has(assetId)) {
            return this.assetCache.get(assetId);
        }
        
        // Find asset path in manifest
        const manifest = await this.reader.readManifest();
        const assetInfo = manifest.chunkIndex.assets.find(
            a => a.id === assetId
        );
        
        if (!assetInfo) {
            throw new Error(`Asset not found: ${assetId}`);
        }
        
        // Load from ZIP
        const blob = await this.reader.readAsset(
            assetInfo.path.replace('assets/', '')
        );
        
        // Cache
        this.assetCache.set(assetId, blob);
        
        return blob;
    }
}
```

#### 4.2 Integration with Open File
**File:** Update file open handler
```javascript
import { PresentationDeserializer } from './core/storage/PresentationDeserializer.js';

async function handleOpen(file) {
    try {
        // Check file extension
        if (!file.name.endsWith('.str')) {
            throw new Error('Invalid file type');
        }
        
        // Deserialize
        const deserializer = new PresentationDeserializer(file);
        const presentation = await deserializer.deserialize();
        
        // Load into app
        loadPresentationIntoApp(presentation);
        
        showToast('Presentation opened');
    } catch (err) {
        console.error('Open failed:', err);
        showToast('Failed to open file', 'error');
    }
}

function loadPresentationIntoApp(presentation) {
    // Update app state
    appState.metadata = presentation.metadata;
    appState.theme = presentation.theme;
    appState.slides = presentation.slides;
    appState.assetLoader = presentation.assetLoader;
    
    // Render first slide
    renderSlide(presentation.slides[0]);
    
    // Update UI
    updateSlideList(presentation.slides);
    updateTitle(presentation.metadata.title);
}
```

**Testing:**
- ✅ Can load previously saved .str files
- ✅ Slides render correctly
- ✅ Assets load on-demand
- ✅ Invalid files show error message
- ✅ Version mismatch handled gracefully

**What might break:**
- Existing file open handler
- **Mitigation:** Keep old format support for migration

---

## Phase 5: IndexedDB Caching

**Goal:** Cache opened files in browser for offline access and fast re-open.

**Duration:** 3-4 days

### Tasks

#### 5.1 IndexedDB File Cache
**File:** `src/core/storage/FileCache.js` (NEW)
```javascript
/**
 * IndexedDB cache for .str files
 */
export class FileCache {
    constructor() {
        this.dbName = 'StoryFileCache';
        this.dbVersion = 1;
        this.db = null;
    }
    
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Store: files
                if (!db.objectStoreNames.contains('files')) {
                    const store = db.createObjectStore('files', { 
                        keyPath: 'id' 
                    });
                    store.createIndex('lastOpened', 'lastOpened');
                }
            };
        });
    }
    
    async cacheFile(fileId, strBlob, metadata) {
        const transaction = this.db.transaction(['files'], 'readwrite');
        const store = transaction.objectStore('files');
        
        await store.put({
            id: fileId,
            blob: strBlob,
            metadata: metadata,
            lastOpened: Date.now()
        });
    }
    
    async getFile(fileId) {
        const transaction = this.db.transaction(['files'], 'readonly');
        const store = transaction.objectStore('files');
        
        return new Promise((resolve, reject) => {
            const request = store.get(fileId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async listRecentFiles(limit = 10) {
        const transaction = this.db.transaction(['files'], 'readonly');
        const store = transaction.objectStore('files');
        const index = store.index('lastOpened');
        
        return new Promise((resolve, reject) => {
            const request = index.openCursor(null, 'prev');
            const results = [];
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && results.length < limit) {
                    results.push({
                        id: cursor.value.id,
                        metadata: cursor.value.metadata,
                        lastOpened: cursor.value.lastOpened
                    });
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
            
            request.onerror = () => reject(request.error);
        });
    }
    
    async clearOldFiles(maxAge = 30 * 24 * 60 * 60 * 1000) {
        const transaction = this.db.transaction(['files'], 'readwrite');
        const store = transaction.objectStore('files');
        const index = store.index('lastOpened');
        
        const cutoff = Date.now() - maxAge;
        
        return new Promise((resolve, reject) => {
            const request = index.openCursor();
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    if (cursor.value.lastOpened < cutoff) {
                        cursor.delete();
                    }
                    cursor.continue();
                } else {
                    resolve();
                }
            };
            
            request.onerror = () => reject(request.error);
        });
    }
}
```

#### 5.2 Integration with Open/Save
```javascript
const fileCache = new FileCache();
await fileCache.init();

// On file open
async function handleOpen(file) {
    const presentation = await deserializer.deserialize();
    
    // Cache for offline
    const fileId = generateFileId(file.name);
    await fileCache.cacheFile(fileId, file, presentation.metadata);
    
    loadPresentationIntoApp(presentation);
}

// Recent files UI
async function showRecentFiles() {
    const recent = await fileCache.listRecentFiles();
    // Display in UI...
}
```

**Testing:**
- ✅ Files cached after opening
- ✅ Recent files list populated
- ✅ Old files cleaned up
- ✅ Works offline (can re-open cached files)

**What might break:**
- Browser storage limits
- **Mitigation:** Quota management, LRU eviction

---

## Phase 6: Cloud Storage Abstraction

**Goal:** Abstract interface for OneDrive and Google Drive.

**Duration:** 5-6 days

### Tasks

#### 6.1 Storage Provider Interface
**File:** `src/core/storage/IStorageProvider.js` (NEW)
```javascript
/**
 * Interface for cloud storage providers
 */
export class IStorageProvider {
    /**
     * List files in user's storage
     */
    async listFiles(folderPath = '/') {
        throw new Error('Not implemented');
    }
    
    /**
     * Read file
     */
    async readFile(filePath) {
        throw new Error('Not implemented');
    }
    
    /**
     * Write file
     */
    async writeFile(filePath, blob, options = {}) {
        throw new Error('Not implemented');
    }
    
    /**
     * Delete file
     */
    async deleteFile(filePath) {
        throw new Error('Not implemented');
    }
    
    /**
     * Get file metadata
     */
    async getMetadata(filePath) {
        throw new Error('Not implemented');
    }
    
    /**
     * Create folder
     */
    async createFolder(folderPath) {
        throw new Error('Not implemented');
    }
}
```

#### 6.2 OneDrive Provider
**File:** `src/core/storage/providers/OneDriveProvider.js` (NEW)
```javascript
import { IStorageProvider } from '../IStorageProvider.js';
import { authManager } from '../../auth/AuthManager.js';

export class OneDriveProvider extends IStorageProvider {
    constructor() {
        super();
        this.baseUrl = 'https://graph.microsoft.com/v1.0';
    }
    
    async listFiles(folderPath = '/Story') {
        const token = await authManager.getAccessToken('microsoft');
        
        const url = folderPath === '/'
            ? `${this.baseUrl}/me/drive/root/children`
            : `${this.baseUrl}/me/drive/root:${folderPath}:/children`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to list files');
        }
        
        const data = await response.json();
        
        return data.value.map(item => ({
            id: item.id,
            name: item.name,
            size: item.size,
            modified: item.lastModifiedDateTime,
            isFolder: !!item.folder
        }));
    }
    
    async readFile(filePath) {
        const token = await authManager.getAccessToken('microsoft');
        
        const url = `${this.baseUrl}/me/drive/root:${filePath}:/content`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to read file');
        }
        
        return response.blob();
    }
    
    async writeFile(filePath, blob, options = {}) {
        const token = await authManager.getAccessToken('microsoft');
        
        const url = `${this.baseUrl}/me/drive/root:${filePath}:/content`;
        
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/octet-stream'
        };
        
        // Optimistic locking with etag
        if (options.ifMatch) {
            headers['If-Match'] = options.ifMatch;
        }
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: headers,
            body: blob
        });
        
        if (!response.ok) {
            if (response.status === 412) {
                throw new Error('PRECONDITION_FAILED');
            }
            throw new Error('Failed to write file');
        }
        
        return response.json();
    }
    
    async deleteFile(filePath) {
        const token = await authManager.getAccessToken('microsoft');
        
        const url = `${this.baseUrl}/me/drive/root:${filePath}`;
        
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete file');
        }
    }
    
    async getMetadata(filePath) {
        const token = await authManager.getAccessToken('microsoft');
        
        const url = `${this.baseUrl}/me/drive/root:${filePath}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to get metadata');
        }
        
        const data = await response.json();
        
        return {
            id: data.id,
            name: data.name,
            size: data.size,
            modified: data.lastModifiedDateTime,
            etag: data.eTag
        };
    }
}
```

#### 6.3 Google Drive Provider
**File:** `src/core/storage/providers/GoogleDriveProvider.js` (NEW)
```javascript
// Similar implementation for Google Drive API
// Uses different endpoints but same interface
```

**Testing:**
- ✅ Can list files from OneDrive
- ✅ Can read/write files to OneDrive
- ✅ Can list files from Google Drive
- ✅ Can read/write files to Google Drive
- ✅ Error handling works (401, 404, etc.)

**What might break:**
- API rate limits hit during testing
- **Mitigation:** Exponential backoff, mock in tests

---

## Phase 7: Cloud Save/Load Integration

**Goal:** Save to and load from cloud storage.

**Duration:** 4-5 days

### Tasks

#### 7.1 Cloud Storage Manager
**File:** `src/core/storage/CloudStorageManager.js` (NEW)
```javascript
import { OneDriveProvider } from './providers/OneDriveProvider.js';
import { GoogleDriveProvider } from './providers/GoogleDriveProvider.js';

export class CloudStorageManager {
    constructor() {
        this.providers = {
            onedrive: new OneDriveProvider(),
            google: new GoogleDriveProvider()
        };
        this.currentProvider = null;
    }
    
    setProvider(providerName) {
        if (!this.providers[providerName]) {
            throw new Error(`Unknown provider: ${providerName}`);
        }
        this.currentProvider = this.providers[providerName];
    }
    
    async saveToCloud(filePath, strBlob) {
        if (!this.currentProvider) {
            throw new Error('No cloud provider selected');
        }
        
        try {
            const result = await this.currentProvider.writeFile(
                filePath, 
                strBlob
            );
            return result;
        } catch (err) {
            console.error('Cloud save failed:', err);
            throw err;
        }
    }
    
    async loadFromCloud(filePath) {
        if (!this.currentProvider) {
            throw new Error('No cloud provider selected');
        }
        
        try {
            const blob = await this.currentProvider.readFile(filePath);
            return blob;
        } catch (err) {
            console.error('Cloud load failed:', err);
            throw err;
        }
    }
    
    async listCloudFiles(folderPath = '/Story') {
        if (!this.currentProvider) {
            throw new Error('No cloud provider selected');
        }
        
        return this.currentProvider.listFiles(folderPath);
    }
}
```

#### 7.2 Save Dialog with Cloud Option
**File:** `src/ui/dialogs/SaveDialog.js` (NEW)
```javascript
export class SaveDialog {
    constructor(cloudManager) {
        this.cloudManager = cloudManager;
    }
    
    show() {
        const dialog = document.createElement('div');
        dialog.className = 'modal-overlay';
        dialog.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Save Presentation</h2>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    <div class="save-options">
                        <button class="save-option" data-target="local">
                            <svg><!-- Download icon --></svg>
                            <div>
                                <div class="option-title">Save to Computer</div>
                                <div class="option-desc">Download .str file</div>
                            </div>
                        </button>
                        
                        <button class="save-option" data-target="onedrive">
                            <svg><!-- OneDrive icon --></svg>
                            <div>
                                <div class="option-title">Save to OneDrive</div>
                                <div class="option-desc">Auto-sync across devices</div>
                            </div>
                        </button>
                        
                        <button class="save-option" data-target="google">
                            <svg><!-- Google Drive icon --></svg>
                            <div>
                                <div class="option-title">Save to Google Drive</div>
                                <div class="option-desc">Auto-sync across devices</div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        dialog.querySelectorAll('.save-option').forEach(btn => {
            btn.onclick = () => this.handleSave(btn.dataset.target);
        });
        
        document.body.appendChild(dialog);
    }
    
    async handleSave(target) {
        const state = getCurrentAppState();
        const serializer = new PresentationSerializer(state);
        const strBlob = await serializer.serialize();
        
        if (target === 'local') {
            // Download
            const url = URL.createObjectURL(strBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${state.metadata.title}.str`;
            a.click();
            URL.revokeObjectURL(url);
        } else {
            // Cloud save
            this.cloudManager.setProvider(target);
            const filePath = `/Story/${state.metadata.title}.str`;
            await this.cloudManager.saveToCloud(filePath, strBlob);
            showToast('Saved to cloud');
        }
        
        this.hide();
    }
}
```

**Testing:**
- ✅ Save dialog shows all options
- ✅ Local download works
- ✅ OneDrive save works
- ✅ Google Drive save works
- ✅ Error handling shows user-friendly messages

**What might break:**
- Existing save button
- **Mitigation:** Replace progressively, feature flag

---

## Phase 8: Auto-Save & Conflict Resolution

**Goal:** Auto-save to cloud and handle conflicts.

**Duration:** 3-4 days

### Tasks

#### 8.1 Auto-Save Manager
**File:** `src/core/storage/AutoSaveManager.js` (NEW)
```javascript
export class AutoSaveManager {
    constructor(cloudManager) {
        this.cloudManager = cloudManager;
        this.saveTimer = null;
        this.isDirty = false;
        this.currentFile = null;
    }
    
    markDirty() {
        this.isDirty = true;
        this.scheduleSave();
    }
    
    scheduleSave() {
        clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => {
            this.save();
        }, 5000); // 5 second debounce
    }
    
    async save() {
        if (!this.isDirty || !this.currentFile) return;
        
        try {
            const state = getCurrentAppState();
            const serializer = new PresentationSerializer(state);
            const strBlob = await serializer.serialize();
            
            await this.cloudManager.saveToCloud(
                this.currentFile.path,
                strBlob,
                { ifMatch: this.currentFile.etag }
            );
            
            this.isDirty = false;
            showToast('Auto-saved', 'success');
        } catch (err) {
            if (err.message === 'PRECONDITION_FAILED') {
                this.handleConflict();
            } else {
                console.error('Auto-save failed:', err);
                showToast('Auto-save failed', 'warning');
            }
        }
    }
    
    handleConflict() {
        // Show conflict dialog
        showDialog({
            title: 'Conflict Detected',
            message: 'This file was modified elsewhere. What would you like to do?',
            actions: [
                { label: 'Overwrite', action: () => this.forceSave() },
                { label: 'Reload', action: () => this.reloadFromCloud() }
            ]
        });
    }
}
```

**Testing:**
- ✅ Auto-save triggers after inactivity
- ✅ Conflict detection works
- ✅ User can choose to overwrite or reload

**What might break:**
- Performance (frequent saves)
- **Mitigation:** Debouncing, incremental saves

---

## Phase 9: Offline Support

**Goal:** Full offline capability with sync on reconnect.

**Duration:** 2-3 days

### Tasks

#### 9.1 Offline Detection
```javascript
window.addEventListener('online', () => {
    console.log('Back online');
    autoSaveManager.syncPendingChanges();
});

window.addEventListener('offline', () => {
    console.log('Offline mode');
    showToast('Working offline', 'info');
});
```

#### 9.2 Sync Queue
```javascript
// Queue changes while offline
// Sync when back online
```

**Testing:**
- ✅ App works fully offline
- ✅ Changes queued when offline
- ✅ Sync happens on reconnect

---

## Phase 10: Testing & Rollout

**Duration:** 4-5 days

### Testing Checklist
- [ ] Save to .str format
- [ ] Load from .str format
- [ ] Save to OneDrive
- [ ] Load from OneDrive
- [ ] Save to Google Drive
- [ ] Load from Google Drive
- [ ] Auto-save works
- [ ] Conflict resolution works
- [ ] Offline mode works
- [ ] Recent files list works
- [ ] Asset lazy loading works
- [ ] Large file handling (>50MB)

### Rollout Strategy
1. Feature flag: `ENABLE_STR_FORMAT=true`
2. Beta test with small group
3. Monitor error rates
4. Full rollout

---

## Files Created

```
src/core/storage/
  ZipFileWriter.js
  ZipFileReader.js
  ManifestBuilder.js
  MetadataBuilder.js
  PresentationSerializer.js
  PresentationDeserializer.js
  FileCache.js
  IStorageProvider.js
  CloudStorageManager.js
  AutoSaveManager.js
  providers/
    OneDriveProvider.js
    GoogleDriveProvider.js
src/ui/dialogs/
  SaveDialog.js
```

**Total:** 13 new files

---

*This plan implements the complete .str file format with cloud storage integration, offline support, and progressive loading.*
