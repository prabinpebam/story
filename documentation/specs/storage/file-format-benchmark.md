# File Format & Storage - Industry Benchmark Analysis

**Date:** November 27, 2025  
**Purpose:** Compare Story's `.str` format against industry leaders and identify improvement opportunities

---

## Table of Contents

1. [Industry Comparison Matrix](#1-industry-comparison-matrix)
2. [Detailed Tool Analysis](#2-detailed-tool-analysis)
3. [Gap Analysis - Story vs Industry](#3-gap-analysis---story-vs-industry)
4. [Recommended Improvements](#4-recommended-improvements)
5. [Priority Roadmap](#5-priority-roadmap)

---

## 1. Industry Comparison Matrix

| Feature | PowerPoint (.pptx) | Keynote (.key) | Figma (.fig) | Google Slides | Story (.str) | Gap |
|---------|-------------------|----------------|--------------|---------------|--------------|-----|
| **Format Type** | ZIP/XML (OOXML) | ZIP/Protobuf | Binary + Cloud | Cloud-only | ZIP/JSON | ✅ Modern |
| **Progressive Loading** | No | No | Yes (streaming) | Yes | Planned | 🟡 Need |
| **Real-time Collab** | Yes (Office 365) | Yes (iCloud) | Yes (core) | Yes (core) | Planned | 🟡 Need |
| **Offline Editing** | Full | Full | Limited | Limited | Planned | ✅ Good |
| **Content Addressing** | No | No | Yes (hashes) | No | Yes | ✅ Great |
| **Incremental Save** | No | Partial | Yes | Auto | Planned | 🟡 Need |
| **Auto-recovery** | Yes | Yes (Versions) | Yes | Always saved | Planned | 🟡 Need |
| **Version History** | No (needs SharePoint) | Yes (native) | Yes (native) | Yes (native) | No | ❌ Missing |
| **Conflict Resolution** | Last-write-wins | Manual merge | CRDT | OT (auto) | Planned | 🟡 Need |
| **File Size Efficiency** | Medium | Good | Excellent | N/A | Medium | 🟡 Improve |
| **Cross-platform** | Yes | Apple only | Yes | Yes | Yes | ✅ Good |
| **Import/Export** | Wide support | Limited | Limited | Good | Limited | 🟡 Need |
| **Password Protection** | Yes | Yes | Team/Org | Link sharing | Planned | 🟡 Need |
| **Digital Signatures** | Yes | Yes | N/A | N/A | No | ❌ Missing |
| **Thumbnail Preview** | Yes (quick view) | Yes | Yes | N/A | Planned | 🟡 Need |

---

## 2. Detailed Tool Analysis

### 2.1 Microsoft PowerPoint (PPTX - Office Open XML)

**Architecture:**
```
presentation.pptx (ZIP)
├── [Content_Types].xml          # MIME type declarations
├── _rels/                       # Relationship files
│   └── .rels
├── ppt/
│   ├── presentation.xml         # Main presentation
│   ├── presProps.xml            # Presentation properties
│   ├── tableStyles.xml
│   ├── viewProps.xml
│   ├── _rels/
│   │   └── presentation.xml.rels
│   ├── slides/
│   │   ├── slide1.xml
│   │   └── _rels/slide1.xml.rels
│   ├── slideLayouts/
│   ├── slideMasters/
│   ├── theme/
│   └── media/                   # Assets with original names
└── docProps/
    ├── core.xml                 # Dublin Core metadata
    └── app.xml                  # Application metadata
```

**Strengths:**
- ✅ Standardized format (ECMA-376, ISO/IEC 29500)
- ✅ Explicit relationship model for extensibility
- ✅ Separate files per slide (parallel processing potential)
- ✅ Dublin Core metadata standard
- ✅ Enterprise features (digital signatures, IRM)

**Weaknesses:**
- ❌ XML verbosity increases file size
- ❌ No built-in progressive loading
- ❌ No content addressing (duplicates stored multiple times)
- ❌ Complex relationship model adds overhead

**Key Learnings for Story:**
1. **Relationship model** - Explicit relationships enable extensions without breaking compatibility
2. **Standardized metadata** - Dublin Core is widely supported
3. **Per-slide files** - Enables selective loading and parallel processing

---

### 2.2 Apple Keynote (.key)

**Architecture:**
```
presentation.key (Package/ZIP)
├── Index.zip                    # Protobuf-encoded document model
├── Data/                        # Media assets
│   ├── image-1.png
│   └── movie-1.mov
├── Metadata/
│   ├── Properties.plist
│   ├── DocumentIdentifier
│   └── BuildVersionHistory.plist
└── preview.jpg                  # Quick Look thumbnail
```

**Strengths:**
- ✅ Protobuf encoding (compact, fast parsing)
- ✅ Native macOS integration (Quick Look, Versions)
- ✅ Automatic version history
- ✅ iCloud sync with conflict resolution
- ✅ Magic Move (smart transitions)

**Weaknesses:**
- ❌ Proprietary format, limited interoperability
- ❌ Apple ecosystem lock-in
- ❌ Binary format harder to debug

**Key Learnings for Story:**
1. **Binary encoding** - Consider MessagePack/Protobuf for presentation.json
2. **Thumbnail at root** - Quick Look/file browser preview without parsing
3. **Build version tracking** - Helps with migration and debugging

---

### 2.3 Figma (Cloud-first, .fig export)

**Architecture:**
- Primary storage: Cloud-native (proprietary)
- Export: `.fig` binary file
- Real-time: WebSocket + custom CRDT-like sync

**Unique Features:**
```
┌─────────────────────────────────────────────────────────────────────┐
│  Multiplayer Architecture (What Story should emulate)              │
│                                                                     │
│  1. Operational Transformation for document sync                   │
│  2. Component instances linked to sources                          │
│  3. Assets deduplicated by content hash                            │
│  4. Branching & merging for design systems                         │
│  5. Thumbnail generation per frame/page                            │
│  6. Comment threads with position anchoring                        │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Learnings for Story:**
1. **Component instances** - Like Story's master slides, but more granular
2. **Design system branching** - Version control for themes/masters
3. **Position-anchored comments** - Future feature consideration
4. **LiveGraph pattern** - Real-time data subscriptions via GraphQL

---

### 2.4 Google Slides

**Architecture:**
- Fully cloud-native, no file format per se
- Export: PPTX, PDF, PNG, SVG, ODP

**Unique Features:**
- Real-time collaboration (Operational Transformation)
- Comment threads with @mentions
- Version history with named versions
- Linked slides from other presentations
- Add-ons/extensions API

**Key Learnings for Story:**
1. **Named versions** - Allow users to mark significant states
2. **Linked content** - Reference slides/assets from other files
3. **Extension API** - Third-party integrations

---

## 3. Gap Analysis - Story vs Industry

### 3.1 Critical Gaps (Must Address)

| Gap | Impact | Current State | Industry Standard |
|-----|--------|---------------|-------------------|
| **No Version History** | Users lose work, can't compare versions | None | Native in Keynote, Figma, Google |
| **No Incremental Save** | Large files = slow saves | Full re-save | Delta-only saves |
| **No Auto-recovery UI** | Risk of data loss | Autosave to IDB, no prompts | Clear recovery dialogs |
| **Monolithic JSON** | Slow parsing for large files | Single presentation.json | Per-slide files or chunks |

### 3.2 Important Gaps (Should Address)

| Gap | Impact | Current State | Industry Standard |
|-----|--------|---------------|-------------------|
| **No Binary Encoding** | Larger files, slower parsing | JSON text | Protobuf/MessagePack |
| **No Relationship Model** | Less extensible | Flat structure | OOXML relationships |
| **Limited Import/Export** | Interop friction | .str only | PPTX, PDF, KEY |
| **No Linked Content** | Can't reuse across files | Copy-paste only | Linked slides/assets |
| **No Comment System** | Collaboration limitation | None | Position-anchored threads |

### 3.3 Competitive Advantages (Maintain)

| Feature | Story Advantage | Keep/Improve |
|---------|----------------|--------------|
| **Content Addressing** | Deduplication, integrity | ✅ Expand |
| **JSON Transparency** | Debuggable, scriptable | 🤔 Consider hybrid |
| **Offline-First** | Works without internet | ✅ Maintain |
| **Code Fills** | Unique differentiator | ✅ Strengthen |
| **Modern Stack** | No legacy baggage | ✅ Leverage |

---

## 4. Recommended Improvements

### 4.1 File Structure Improvements

#### Current Structure
```
presentation.str (ZIP)
├── manifest.json
├── presentation.json      # ❌ Monolithic, can be 10MB+
├── assets/
│   └── index.json
└── ...
```

#### Proposed Structure (Phase 1 - Chunked)
```
presentation.str (ZIP)
├── manifest.json
├── document/
│   ├── metadata.json           # Title, author, summary
│   ├── theme.json              # Design tokens, masters
│   ├── slides/
│   │   ├── slide-001.json      # Individual slide data
│   │   ├── slide-002.json
│   │   └── ...
│   └── relationships.json      # Cross-references
├── assets/
│   ├── index.json
│   └── ...
├── history/                    # NEW: Version snapshots
│   ├── versions.json
│   └── snapshots/
│       ├── v1.json.gz
│       └── ...
├── comments/                   # NEW: Collaboration data
│   └── threads.json
└── preview/
    ├── thumbnail.png           # File browser preview
    └── slides/
        ├── slide-001.png
        └── ...
```

**Benefits:**
- Per-slide loading (progressive)
- Parallel processing
- Smaller diffs for version control
- Easier debugging

#### Proposed Structure (Phase 2 - Binary Hybrid)
```
presentation.str (ZIP)
├── manifest.json               # Always JSON for tooling
├── document.msgpack            # MessagePack for speed
├── assets/
│   ├── index.msgpack
│   └── ...
└── ...
```

**Benefits:**
- 30-50% smaller than JSON
- 5-10x faster parsing
- Still debuggable (msgpack has tools)

---

### 4.2 New Manifest Fields

```javascript
// manifest.json - Enhanced
{
    // Existing fields...
    version: "1.1.0",
    
    // NEW: Quick preview support
    preview: {
        thumbnail: "preview/thumbnail.png",
        slideCount: 24,
        aspectRatio: "16:9",
        primaryColors: ["#FF5733", "#3366FF"]  // For smart thumbnails
    },
    
    // NEW: Version history metadata
    versions: {
        enabled: true,
        count: 15,
        latestSnapshot: "history/snapshots/v15.json.gz",
        retentionPolicy: "30-days"  // or "50-versions"
    },
    
    // NEW: Chunk manifest for progressive loading
    chunks: {
        metadata: { offset: 0, size: 1024, priority: "critical" },
        theme: { offset: 1024, size: 4096, priority: "high" },
        slides: [
            { id: "slide-001", offset: 5120, size: 2048, priority: "high" },
            { id: "slide-002", offset: 7168, size: 3072, priority: "medium" }
        ]
    },
    
    // NEW: Integrity and recovery
    integrity: {
        algorithm: "sha256",
        documentHash: "abc123...",
        assetHashes: { /* per-asset hashes */ },
        lastValidState: "history/snapshots/v14.json.gz"  // Recovery fallback
    },
    
    // NEW: Collaboration metadata
    collaboration: {
        // Existing...
        comments: {
            threadCount: 5,
            unresolvedCount: 2
        },
        activeEditors: []  // For real-time (future)
    },
    
    // NEW: Extension/plugin data
    extensions: {
        "ai-assistant": { version: "1.0", data: "extensions/ai-assistant.json" }
    }
}
```

---

### 4.3 Version History System

**Approach:** Lightweight snapshots with smart diffing

```javascript
// history/versions.json
{
    "currentVersion": 15,
    "versions": [
        {
            "id": 15,
            "timestamp": "2024-01-15T14:45:00Z",
            "author": { "id": "user_abc", "name": "John Doe" },
            "type": "auto",  // "auto" | "manual" | "milestone"
            "label": null,   // User-provided name for milestones
            "changeSummary": {
                "slidesModified": ["slide-005"],
                "slidesAdded": [],
                "slidesDeleted": [],
                "themeChanged": false
            },
            "snapshotPath": "history/snapshots/v15.json.gz",
            "parentVersion": 14
        }
        // ... more versions
    ],
    "retentionPolicy": {
        "maxVersions": 50,
        "maxAge": "30d",
        "keepMilestones": true
    }
}
```

**Snapshot Strategy:**
1. **Auto-save snapshots** - Every 5 minutes during editing (compressed diffs)
2. **Session snapshots** - When closing file
3. **Milestone snapshots** - User-triggered "Save Version"
4. **Delta compression** - Store only changes from parent version

---

### 4.4 Incremental Save System

**Current:** Full re-save every time  
**Proposed:** Track dirty state and save only changes

```javascript
// SaveManager with dirty tracking
class IncrementalSaveManager {
    constructor() {
        this.dirtyChunks = new Set();  // ["slide-005", "theme"]
        this.dirtyAssets = new Set();  // New/modified assets
    }
    
    markDirty(chunkId) {
        this.dirtyChunks.add(chunkId);
    }
    
    async save(fileHandle) {
        if (this.dirtyChunks.size === 0 && this.dirtyAssets.size === 0) {
            return;  // Nothing to save
        }
        
        // For local files: Read existing ZIP, update only dirty entries
        const zip = await this.openExistingZip(fileHandle);
        
        for (const chunkId of this.dirtyChunks) {
            const data = this.serializeChunk(chunkId);
            zip.updateEntry(`document/slides/${chunkId}.json`, data);
        }
        
        for (const assetId of this.dirtyAssets) {
            const asset = this.getAsset(assetId);
            zip.updateEntry(`assets/images/${assetId}`, asset.blob);
        }
        
        // Update manifest
        zip.updateEntry('manifest.json', this.generateManifest());
        
        await zip.write(fileHandle);
        
        this.dirtyChunks.clear();
        this.dirtyAssets.clear();
    }
}
```

---

### 4.5 Recovery System

**Goal:** Never lose more than 30 seconds of work

```javascript
// RecoveryManager
class RecoveryManager {
    constructor() {
        this.recoveryStore = 'story:recovery';
        this.checkpointInterval = 30000;  // 30 seconds
    }
    
    async createCheckpoint(state) {
        const checkpoint = {
            timestamp: Date.now(),
            fileId: state.fileId,
            state: JSON.stringify(state.document),
            version: state.version
        };
        
        await idb.put(this.recoveryStore, checkpoint);
    }
    
    async checkForRecovery(fileId) {
        const checkpoint = await idb.get(this.recoveryStore, fileId);
        
        if (!checkpoint) return null;
        
        // Check if checkpoint is newer than file
        const fileModified = await this.getFileModifiedTime(fileId);
        
        if (checkpoint.timestamp > fileModified) {
            return {
                hasRecovery: true,
                timestamp: checkpoint.timestamp,
                preview: this.generatePreview(checkpoint.state),
                recover: () => this.applyRecovery(checkpoint),
                discard: () => this.discardRecovery(fileId)
            };
        }
        
        return null;
    }
}
```

**Recovery UI Flow:**
```
┌─────────────────────────────────────────────────────────────────────┐
│  ⚠️ Unsaved Changes Found                                          │
│                                                                     │
│  Story found unsaved changes from your last session.               │
│  Last edit: 5 minutes ago                                          │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────┐       │
│  │  Preview of recovered content...                        │       │
│  │  • Slide 5 modified                                     │       │
│  │  • 2 new text boxes                                     │       │
│  └─────────────────────────────────────────────────────────┘       │
│                                                                     │
│  [Recover Changes]   [Open Last Saved]   [Compare Both]            │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 4.6 Performance Optimizations

#### Compression Strategy

| Content Type | Compression | Rationale |
|--------------|-------------|-----------|
| manifest.json | Store (no compression) | Fast access, small file |
| thumbnail.png | Store | Already compressed |
| slide-*.json | Deflate (level 6) | Good balance |
| theme.json | Deflate (level 6) | Good balance |
| Large assets | Store | Already compressed (JPEG, MP4) |
| History snapshots | Deflate (level 9) | Max compression, rarely accessed |

#### Parallel Loading

```javascript
// Progressive load with worker pool
class ProgressiveLoader {
    async loadPresentation(file) {
        // Phase 1: Critical path (blocking)
        const manifest = await this.loadManifest(file);
        const metadata = await this.loadChunk(file, 'metadata');
        
        // Emit: Can show title, slide count
        this.emit('metadata-ready', metadata);
        
        // Phase 2: Theme + first slide (high priority)
        const [theme, firstSlide] = await Promise.all([
            this.loadChunk(file, 'theme'),
            this.loadSlide(file, manifest.chunks.slides[0])
        ]);
        
        // Emit: Can render first slide
        this.emit('first-slide-ready', { theme, slide: firstSlide });
        
        // Phase 3: Remaining slides (background, prioritized)
        const slidePromises = manifest.chunks.slides.slice(1).map((chunk, i) => 
            this.loadSlideWithPriority(file, chunk, i < 5 ? 'high' : 'low')
        );
        
        // Phase 4: Assets (lazy, on-demand)
        // Assets loaded by MediaAssetManager when needed
    }
}
```

---

### 4.7 Import/Export Improvements

#### PPTX Import (Priority: High)

```javascript
// PPTXImporter - Basic structure mapping
const pptxMapping = {
    // Slide mapping
    'ppt/slides/slide*.xml': (xml) => ({
        type: 'slide',
        elements: parseShapes(xml)
    }),
    
    // Shape mapping
    'p:sp': (shape) => ({
        type: 'shape',
        geometry: mapGeometry(shape),
        fill: mapFill(shape),
        stroke: mapStroke(shape)
    }),
    
    // Text mapping
    'p:txBody': (textBody) => ({
        type: 'text',
        content: parseRichText(textBody),
        style: mapTextStyle(textBody)
    }),
    
    // Unsupported features
    unsupported: [
        'p:oleObj',      // Embedded OLE objects
        'p:chart',       // Charts (future)
        'a:hlinkClick',  // Hyperlinks (future)
        'mc:AlternateContent'  // Fallback content
    ]
};
```

#### PDF Export (Priority: High)

**Approach:** Client-side with pdf-lib or jsPDF

```javascript
// PDFExporter
class PDFExporter {
    async export(presentation, options = {}) {
        const pdf = await PDFDocument.create();
        
        for (const slide of presentation.slides) {
            const page = pdf.addPage([1920, 1080]);  // 16:9
            
            // Render each element
            for (const element of slide.elements) {
                await this.renderElement(page, element);
            }
        }
        
        return pdf.save();
    }
    
    async renderElement(page, element) {
        switch (element.type) {
            case 'text':
                await this.renderText(page, element);
                break;
            case 'shape':
                await this.renderShape(page, element);
                break;
            case 'image':
                await this.embedImage(page, element);
                break;
            // CodeFill: Render as rasterized image
            case 'codeFill':
                await this.rasterizeCodeFill(page, element);
                break;
        }
    }
}
```

---

## 5. Priority Roadmap

### Phase 1: Foundation (4-6 weeks)
1. ✅ Chunked slide structure
2. ✅ Manifest v1.1 with chunk offsets
3. ✅ Preview thumbnail at root
4. ✅ Incremental save for local files
5. ✅ Basic recovery system

### Phase 2: History & Recovery (3-4 weeks)
1. Version history with snapshots
2. Recovery UI with preview
3. Named versions (milestones)
4. Delta compression for history

### Phase 3: Import/Export (4-5 weeks)
1. PDF export (client-side)
2. PPTX import (basic)
3. HTML export (self-contained)
4. PNG/JPEG slide export

### Phase 4: Performance (2-3 weeks)
1. MessagePack encoding option
2. Worker-based parallel loading
3. Streaming ZIP writes
4. Asset optimization on import

### Phase 5: Collaboration Prep (3-4 weeks)
1. Comment system data model
2. Conflict detection
3. Merge UI for conflicts
4. Real-time awareness (presence)

---

## Summary: Key Takeaways

| Area | Current Strength | Key Improvement |
|------|-----------------|-----------------|
| **Format** | Modern JSON/ZIP | Add chunking + binary option |
| **Assets** | Content-addressed | Already ahead of industry |
| **Loading** | Basic | Add progressive + parallel |
| **Saving** | Full re-save | Add incremental saves |
| **History** | None | Add version snapshots |
| **Recovery** | Autosave | Add recovery UI |
| **Import** | None | Add PPTX basic support |
| **Export** | None | Add PDF + HTML |

---

## Related Documents

- [File Format & Storage Specification](./file-format-storage.md)
- [Progressive Loading Specification](./progressive-loading.md)
- [Asset Management & Caching](./asset-management.md)
- [Memory Management](./memory-management.md)

---

*This benchmark analysis should be reviewed quarterly as industry tools evolve.*
