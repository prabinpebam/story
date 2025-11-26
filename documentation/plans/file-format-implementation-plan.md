# File Format & Storage System - Implementation Plan

## Overview

This plan outlines the phased implementation of the `.str` file format, storage backends, cloud integration, and caching systems.

**Estimated Total Time**: 80-100 hours (across multiple phases)

---

## Phase 1: Core File Format (16-20 hours)

### 1.1 ZIP Library Integration

**Tasks**:
- [ ] Evaluate ZIP libraries (JSZip vs fflate)
- [ ] Install and configure chosen library
- [ ] Create utility functions for ZIP operations
- [ ] Test compression/decompression performance

**Validation**:
- [ ] Can create ZIP with multiple files
- [ ] Can read files from ZIP
- [ ] Performance acceptable for 100MB+ files

---

### 1.2 Manifest Schema

**File**: `src/core/storage/ManifestSchema.js`

**Tasks**:
- [ ] Define manifest.json TypeScript/JSDoc schema
- [ ] Implement manifest validation
- [ ] Implement version comparison utilities
- [ ] Add manifest generation from state

**Validation**:
- [ ] Schema validates correctly
- [ ] Version comparison works
- [ ] Manifest generates with all required fields

---

### 1.3 Asset Index

**File**: `src/core/storage/AssetIndex.js`

**Tasks**:
- [ ] Define asset index schema
- [ ] Implement asset hashing (SHA-256)
- [ ] Implement reference tracking
- [ ] Implement deduplication check

**Validation**:
- [ ] Same file produces same hash
- [ ] References tracked correctly
- [ ] Duplicates detected

---

### 1.4 State Serializer

**File**: `src/core/storage/StateSerializer.js`

**Tasks**:
- [ ] Convert blob URLs to asset paths
- [ ] Convert asset paths to blob URLs
- [ ] Handle circular references
- [ ] Strip transient/editor state

**Validation**:
- [ ] Round-trip serialization works
- [ ] No blob URLs in serialized output
- [ ] Editor state not persisted

---

### 1.5 File Writer

**File**: `src/core/storage/FileWriter.js`

**Tasks**:
- [ ] Implement `saveToFile(state, handle)`
- [ ] Create manifest
- [ ] Serialize state
- [ ] Copy assets to ZIP
- [ ] Generate thumbnails
- [ ] Atomic write (temp file → rename)

**Validation**:
- [ ] .str file created with correct structure
- [ ] All assets included
- [ ] Thumbnails generated
- [ ] File openable after save

---

### 1.6 File Reader

**File**: `src/core/storage/FileReader.js`

**Tasks**:
- [ ] Implement `loadFromFile(handle)`
- [ ] Read and validate manifest
- [ ] Parse presentation.json
- [ ] Register assets (create blob URLs)
- [ ] Hydrate state tree

**Validation**:
- [ ] .str file loads correctly
- [ ] Assets accessible via blob URLs
- [ ] State fully restored
- [ ] Old versions can be opened

---

## Phase 2: Local Storage Integration (12-16 hours)

### 2.1 File System Access API

**File**: `src/core/storage/FileSystemAccess.js`

**Tasks**:
- [ ] Implement file picker for open
- [ ] Implement file picker for save
- [ ] Implement save to existing handle
- [ ] Handle permission prompts
- [ ] Feature detection & fallback

**Validation**:
- [ ] Can open .str file
- [ ] Can save .str file
- [ ] Can overwrite existing file
- [ ] Works without File System Access API

---

### 2.2 IndexedDB Storage

**File**: `src/core/storage/IndexedDBStorage.js`

**Tasks**:
- [ ] Design database schema
- [ ] Implement presentation store
- [ ] Implement asset blob store
- [ ] Implement recent files list
- [ ] Implement quota management

**Schema**:
```javascript
{
    presentations: { id, name, modified, thumbnail, data },
    assets: { hash, blob, size, lastUsed },
    recentFiles: { id, path, name, modified, thumbnail }
}
```

**Validation**:
- [ ] Can store/retrieve presentations
- [ ] Can store/retrieve assets
- [ ] Recent files list works
- [ ] Storage limits respected

---

### 2.3 Autosave System

**File**: `src/core/storage/AutosaveManager.js`

**Tasks**:
- [ ] Implement debounced autosave
- [ ] Store to IndexedDB on change
- [ ] Track "unsaved changes" state
- [ ] Implement recovery on crash

**Validation**:
- [ ] Changes saved within 5 seconds
- [ ] Recovery works after browser crash
- [ ] Unsaved indicator shows correctly

---

### 2.4 Storage UI

**Tasks**:
- [ ] New/Open/Save menu items
- [ ] Recent files dropdown
- [ ] Unsaved changes indicator
- [ ] Save progress dialog
- [ ] Storage quota warning

**Validation**:
- [ ] All menu items work
- [ ] Progress shown for large files
- [ ] Warning at 80% quota

---

## Phase 3: Cloud Storage (20-24 hours)

### 3.1 Authentication System

**File**: `src/core/auth/AuthManager.js`

**Tasks**:
- [ ] OAuth 2.0 PKCE flow implementation
- [ ] Token storage (secure)
- [ ] Token refresh handling
- [ ] Multi-provider support
- [ ] Sign out functionality

**Validation**:
- [ ] OAuth flow completes
- [ ] Tokens stored securely
- [ ] Auto-refresh works
- [ ] Sign out clears tokens

---

### 3.2 OneDrive Integration

**File**: `src/core/storage/providers/OneDriveProvider.js`

**Tasks**:
- [ ] Microsoft OAuth configuration
- [ ] OneDrive file picker integration
- [ ] Download file to browser
- [ ] Upload file to OneDrive
- [ ] Handle upload conflicts
- [ ] Track sync status

**Validation**:
- [ ] Can browse OneDrive
- [ ] Can open .str from OneDrive
- [ ] Can save .str to OneDrive
- [ ] Conflicts handled gracefully

---

### 3.3 Google Drive Integration

**File**: `src/core/storage/providers/GoogleDriveProvider.js`

**Tasks**:
- [ ] Google OAuth configuration
- [ ] Google Drive picker integration
- [ ] Download file to browser
- [ ] Upload file to Google Drive
- [ ] Handle upload conflicts
- [ ] Track sync status

**Validation**:
- [ ] Can browse Google Drive
- [ ] Can open .str from Google Drive
- [ ] Can save .str to Google Drive
- [ ] Conflicts handled gracefully

---

### 3.4 Storage Provider Interface

**File**: `src/core/storage/StorageProvider.js`

**Tasks**:
- [ ] Define abstract provider interface
- [ ] Implement provider factory
- [ ] Unified open/save API
- [ ] Error handling abstraction

**Interface**:
```javascript
interface StorageProvider {
    name: string;
    icon: string;
    isAuthenticated(): boolean;
    authenticate(): Promise<void>;
    showPicker(): Promise<FileHandle>;
    read(handle: FileHandle): Promise<ArrayBuffer>;
    write(handle: FileHandle, data: ArrayBuffer): Promise<void>;
}
```

---

## Phase 4: Caching & Offline (16-20 hours)

### 4.1 Asset Cache Manager

**File**: `src/core/cache/AssetCacheManager.js`

**Tasks**:
- [ ] Memory cache with LRU eviction
- [ ] IndexedDB cache layer
- [ ] OPFS for large videos
- [ ] Cache warming on load
- [ ] Background prefetching

**Validation**:
- [ ] Memory cache evicts at limit
- [ ] Assets persist in IndexedDB
- [ ] Large videos use OPFS
- [ ] Prefetching improves performance

---

### 4.2 Service Worker

**File**: `src/service-worker.js`

**Tasks**:
- [ ] App shell caching
- [ ] Asset caching (by hash)
- [ ] Offline detection
- [ ] Background sync registration

**Validation**:
- [ ] App loads offline
- [ ] Cached assets served offline
- [ ] Online/offline status detected

---

### 4.3 Sync Queue

**File**: `src/core/storage/SyncQueue.js`

**Tasks**:
- [ ] Queue offline changes
- [ ] Sync when online
- [ ] Conflict detection
- [ ] Retry with backoff

**Validation**:
- [ ] Offline edits saved locally
- [ ] Edits sync when online
- [ ] Conflicts surfaced to user

---

### 4.4 Offline UI

**Tasks**:
- [ ] Online/offline indicator
- [ ] Pending sync indicator
- [ ] Conflict resolution dialog
- [ ] "Working offline" banner

---

## Phase 5: Import/Export (16-20 hours)

### 5.1 PDF Export

**File**: `src/core/export/PdfExporter.js`

**Tasks**:
- [ ] Choose PDF library (jsPDF, pdfkit)
- [ ] Render slides to canvas
- [ ] Generate PDF pages
- [ ] Include metadata
- [ ] Progress reporting

**Validation**:
- [ ] PDF contains all slides
- [ ] Quality acceptable
- [ ] Metadata preserved

---

### 5.2 HTML Export

**File**: `src/core/export/HtmlExporter.js`

**Tasks**:
- [ ] Generate self-contained HTML
- [ ] Embed assets as base64/blob
- [ ] Include presentation viewer
- [ ] Support slide navigation
- [ ] Optimize for file size

**Validation**:
- [ ] HTML opens in browser
- [ ] All slides viewable
- [ ] Navigation works
- [ ] Videos play

---

### 5.3 Image Export

**File**: `src/core/export/ImageExporter.js`

**Tasks**:
- [ ] Export individual slides as PNG/JPEG
- [ ] Export all slides as ZIP
- [ ] Resolution options (1x, 2x)
- [ ] Transparent background option

**Validation**:
- [ ] Images render correctly
- [ ] Resolution matches setting
- [ ] Transparency works for PNG

---

### 5.4 PPTX Import (Basic)

**File**: `src/core/import/PptxImporter.js`

**Tasks**:
- [ ] Parse PPTX (OpenXML)
- [ ] Extract slides
- [ ] Convert text elements
- [ ] Convert image elements
- [ ] Handle unsupported features gracefully

**Validation**:
- [ ] Basic PPTX imports
- [ ] Text and images preserved
- [ ] Unsupported features noted

---

## Phase 6: Version Migration (8-10 hours)

### 6.1 Migration Framework

**File**: `src/core/storage/MigrationManager.js`

**Tasks**:
- [ ] Version comparison utilities
- [ ] Migration registry
- [ ] Sequential migration application
- [ ] Backup before migration

**Validation**:
- [ ] Old files migrate successfully
- [ ] Data preserved through migration
- [ ] Backup created

---

### 6.2 Initial Migrations

**Tasks**:
- [ ] Define v1.0.0 baseline schema
- [ ] Create migration tests
- [ ] Document migration procedures

---

## Dependency Order

```
Phase 1 (Core Format)
    ↓
Phase 2 (Local Storage)
    ↓
Phase 3 (Cloud Storage) ←─── Requires Auth System
    ↓
Phase 4 (Caching & Offline)
    ↓
Phase 5 (Import/Export)
    ↓
Phase 6 (Version Migration)
```

---

## File Checklist

### New Files
- [ ] `src/core/storage/ManifestSchema.js`
- [ ] `src/core/storage/AssetIndex.js`
- [ ] `src/core/storage/StateSerializer.js`
- [ ] `src/core/storage/FileWriter.js`
- [ ] `src/core/storage/FileReader.js`
- [ ] `src/core/storage/FileSystemAccess.js`
- [ ] `src/core/storage/IndexedDBStorage.js`
- [ ] `src/core/storage/AutosaveManager.js`
- [ ] `src/core/storage/StorageProvider.js`
- [ ] `src/core/storage/providers/OneDriveProvider.js`
- [ ] `src/core/storage/providers/GoogleDriveProvider.js`
- [ ] `src/core/storage/SyncQueue.js`
- [ ] `src/core/storage/MigrationManager.js`
- [ ] `src/core/cache/AssetCacheManager.js`
- [ ] `src/core/auth/AuthManager.js`
- [ ] `src/core/export/PdfExporter.js`
- [ ] `src/core/export/HtmlExporter.js`
- [ ] `src/core/export/ImageExporter.js`
- [ ] `src/core/import/PptxImporter.js`
- [ ] `src/service-worker.js`

### UI Files
- [ ] `src/ui/dialogs/SaveDialog.js`
- [ ] `src/ui/dialogs/OpenDialog.js`
- [ ] `src/ui/dialogs/ExportDialog.js`
- [ ] `src/ui/dialogs/CloudPicker.js`
- [ ] `src/ui/dialogs/ConflictDialog.js`
- [ ] `src/ui/components/SyncStatus.js`
- [ ] `src/ui/components/StorageIndicator.js`

---

## Success Criteria

1. **File Format**
   - [ ] .str files save and load correctly
   - [ ] Assets embedded and extracted properly
   - [ ] Thumbnails generated

2. **Local Storage**
   - [ ] File System Access API works
   - [ ] IndexedDB fallback works
   - [ ] Autosave prevents data loss

3. **Cloud Storage**
   - [ ] OneDrive integration works
   - [ ] Google Drive integration works
   - [ ] Sync status visible

4. **Offline**
   - [ ] App works offline
   - [ ] Edits queue for sync
   - [ ] Conflicts resolved

5. **Export**
   - [ ] PDF export works
   - [ ] HTML export works
   - [ ] Image export works

---

## Libraries to Evaluate

| Purpose | Options |
|---------|---------|
| ZIP | JSZip, fflate, zipjs |
| PDF | jsPDF, pdfkit, pdf-lib |
| IndexedDB | Dexie, idb, localforage |
| OAuth | oauth4webapi, oidc-client |
| PPTX | pptxgenjs (export), officegen |

---

*This plan will be refined as implementation progresses. Each phase should be fully validated before moving to the next.*
