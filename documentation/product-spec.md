# Story — Product Specification

> **Role:** This document is the central entry point and exhaustive catalog for all Story documentation.  
> **Last Updated:** December 2025

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Documentation Structure](#2-documentation-structure)
3. [Quick Reference — Key Specs](#3-quick-reference--key-specs)
4. [Feature Specifications (specs/)](#4-feature-specifications-specs)
5. [Technical Specifications (tech-specs/)](#5-technical-specifications-tech-specs)
6. [Implementation Plans (plans/)](#6-implementation-plans-plans)
7. [Supporting Documents](#7-supporting-documents)
8. [Document Status & Maintenance](#8-document-status--maintenance)
9. [Product Summary](#9-product-summary)

---

## 1. Product Overview

### 1.1 Vision

"Story" redefines presentation creation by combining the precision of professional design tools (Figma-like interaction) with the ease of modern web applications. It bridges the gap between static slides and interactive, dynamic storytelling.

### 1.2 Target Audience

| Audience | Needs |
|----------|-------|
| **Designers** | Granular control over typography, layout, and motion |
| **Developers** | Code-based backgrounds, high-performance rendering |
| **Business Professionals** | Quick, stunning decks via master slides and smart layouts |

### 1.3 Core Principles

All development must adhere to [**principles.md**](./principles.md), which covers:
- App integrity (incremental changes, mandatory testing)
- Design & craft (design system consistency, theming)
- Security & privacy
- Performance standards
- Feature compatibility (undo/redo, storage, collaboration)

---

## 2. Documentation Structure

```
documentation/
├── product-spec.md              ← YOU ARE HERE (Main Entry Point)
├── principles.md                 # Development principles & guidelines
├── oauth-setup-guide.md          # OAuth provider configuration
├── REORG-REPORT.md               # Documentation reorganization history
│
├── specs/                        # Feature & UX specifications
│   ├── ai/                       # AI features
│   ├── canvas/                   # Canvas interaction & layers
│   ├── collaboration/            # Real-time collaboration & auth
│   ├── core/                     # Core behaviors (input, undo, text)
│   ├── design-system/            # UI design system & theming
│   ├── fills/                    # Fill system (color, gradient, code)
│   ├── identity/                 # Identity & user preferences
│   ├── presentation/             # Presentation mode & animations
│   ├── property-inspector/       # Property panel UI specs
│   ├── rendering/                # Rendering architecture
│   ├── slides/                   # Slide & master slide system
│   ├── storage/                  # File format, caching, memory
│   └── toolbar/                  # Toolbar & app menu
│
├── tech-specs/                   # Technical implementation details
│   ├── ai/                       # AI integration architecture
│   ├── core/                     # Core architecture & data structures
│   ├── fills/                    # Fill system implementation
│   ├── rendering/                # Rendering pipeline & engines
│   └── slides/                   # Master slide implementation
│
├── plans/                        # Implementation plans (historical)
│   └── [30 implementation plans]
│
└── ui-reference-images/          # UI mockups & visual references
```

### Document Types

| Prefix/Location | Purpose | Audience |
|-----------------|---------|----------|
| `specs/` | Feature behavior, UX flows, UI design | Designers, PMs, Developers |
| `tech-specs/` | Implementation details, architecture | Developers |
| `plans/` | Implementation roadmaps (often historical) | Developers, PMs |

---

## 3. Quick Reference — Key Specs

These are the most important specifications for understanding Story:

### Design & UI
| Document | Description |
|----------|-------------|
| [**UI Design System**](./specs/design-system/ui-design-system.md) | ⭐ Source of truth for UI tokens, components, patterns |
| [Design System UX Guide](./specs/design-system/design-system-ux-guide.md) | UX patterns and interaction guidelines |
| [Color Theme Manager](./specs/design-system/color-theme-manager.md) | Theme architecture and color system |
| [Typography Style Manager](./specs/design-system/typography-style-manager.md) | Typography tokens and text styles |

### Core Architecture
| Document | Description |
|----------|-------------|
| [**Architecture Overview**](./tech-specs/core/architecture-overview.md) | ⭐ System architecture and design patterns |
| [Data Structures](./tech-specs/core/data-structures.md) | Core data models (slides, elements, etc.) |
| [Interaction Model](./tech-specs/core/interaction-model.md) | Figma-like canvas interaction |
| [Component System](./tech-specs/core/component-system.md) | UI component architecture |

### Key Features
| Document | Description |
|----------|-------------|
| [**Master Slide System**](./tech-specs/slides/master-slide-system.md) | ⭐ Master/layout inheritance model |
| [Canvas Interaction](./specs/canvas/canvas-interaction.md) | Selection, transform, navigation |
| [Text Editing v2](./specs/core/text-editing-v2.md) | Text editing behavior |
| [Undo/Redo](./specs/core/undo-redo.md) | History management |

---

## 4. Feature Specifications (specs/)

### 4.1 AI (`specs/ai/`)
| File | Description | Status |
|------|-------------|--------|
| [ai-copilot.md](./specs/ai/ai-copilot.md) | AI assistant integration, content generation | 🔶 Experimental |

### 4.2 Canvas (`specs/canvas/`)
| File | Description | Status |
|------|-------------|--------|
| [canvas-interaction.md](./specs/canvas/canvas-interaction.md) | Selection, marquee, transform behaviors | ✅ Active |
| [context-menu.md](./specs/canvas/context-menu.md) | Right-click context menu system | ✅ Active |
| [cursor-behavior.md](./specs/canvas/cursor-behavior.md) | Cursor states and visual feedback | ✅ Active |
| [layer-management.md](./specs/canvas/layer-management.md) | Layer tree, z-index, grouping | ✅ Active |

### 4.3 Collaboration (`specs/collaboration/`)
| File | Description | Status |
|------|-------------|--------|
| [realtime-collaboration.md](./specs/collaboration/realtime-collaboration.md) | Real-time sync architecture | 🔶 In Development |
| [collaboration-protocol.md](./specs/collaboration/collaboration-protocol.md) | Message protocol for sync | 🔶 In Development |
| [authentication.md](./specs/collaboration/authentication.md) | OAuth authentication flow | ✅ Active |
| [azure-signalr-integration.md](./specs/collaboration/azure-signalr-integration.md) | SignalR server integration | 🔶 In Development |
| [security-model.md](./specs/collaboration/security-model.md) | Security architecture | ✅ Active |
| [sharing-permissions.md](./specs/collaboration/sharing-permissions.md) | Sharing and access control | 🔶 In Development |
| [cloud-storage-abstraction.md](./specs/collaboration/cloud-storage-abstraction.md) | Storage provider abstraction | ✅ Active |
| [asset-streaming.md](./specs/collaboration/asset-streaming.md) | Media asset streaming | 🔶 Planned |
| [state-sync-engine.md](./specs/collaboration/state-sync-engine.md) | State synchronization engine | 🔶 In Development |

### 4.4 Core (`specs/core/`)
| File | Description | Status |
|------|-------------|--------|
| [global-input-behavior.md](./specs/core/global-input-behavior.md) | Keyboard/mouse input handling | ✅ Active |
| [text-editing-v2.md](./specs/core/text-editing-v2.md) | Text editing interactions | ✅ Active |
| [text-editing-interaction.md](./specs/core/text-editing-interaction.md) | Text editing details | ⚠️ Superseded by v2 |
| [text-editing-test-plan.md](./specs/core/text-editing-test-plan.md) | Text editing test cases | ✅ Active |
| [undo-redo.md](./specs/core/undo-redo.md) | History management system | ✅ Active |
| [context-menu-system.md](./specs/core/context-menu-system.md) | Context menu architecture | ✅ Active |
| [property-memory-system.md](./specs/core/property-memory-system.md) | Property value memory | ✅ Active |
| [url-routing-strategy.md](./specs/core/url-routing-strategy.md) | URL and routing patterns | ✅ Active |

### 4.5 Design System (`specs/design-system/`)
| File | Description | Status |
|------|-------------|--------|
| [**ui-design-system.md**](./specs/design-system/ui-design-system.md) | ⭐ Complete design system | ✅ Active |
| [design-system-ux-guide.md](./specs/design-system/design-system-ux-guide.md) | UX guidelines | ✅ Active |
| [color-theme-manager.md](./specs/design-system/color-theme-manager.md) | Theme and color management | ✅ Active |
| [typography-style-manager.md](./specs/design-system/typography-style-manager.md) | Typography system | ✅ Active |
| [**linked-properties-system.md**](./specs/design-system/linked-properties-system.md) | ⭐ Theme/style property binding | ✅ Active |
| [theme-architecture.md](./specs/design-system/theme-architecture.md) | Theme implementation details | ✅ Active |
| [design-consistency-audit.md](./specs/design-system/design-consistency-audit.md) | Audit results and fixes | 📋 Reference |

### 4.6 Fills (`specs/fills/`)
| File | Description | Status |
|------|-------------|--------|
| [code-fill-panel.md](./specs/fills/code-fill-panel.md) | Code-based fill editor | ✅ Active |
| [codefill-presets.md](./specs/fills/codefill-presets.md) | Code fill presets system | ✅ Active |
| [color-picker-ui.md](./specs/fills/color-picker-ui.md) | Color picker component | ✅ Active |
| [gradient-fill.md](./specs/fills/gradient-fill.md) | Gradient fill system | ✅ Active |
| [media-fill-system.md](./specs/fills/media-fill-system.md) | Image/video fills | ✅ Active |

### 4.7 Identity (`specs/identity/`)

> See [specs/identity/README.md](./specs/identity/README.md) for the full catalog.

| Category | Key Files | Status |
|----------|-----------|--------|
| **Core Identity** | `identity-architecture.md`, `oauth-identity-flow.md`, `user-profile-model.md` | ✅ Active |
| **Session Lifecycle** | `session-lifecycle.md`, `cross-device-identity.md` | ✅ Active |
| **User Preferences** | `user-preferences-file.md`, `preferences-*.md` (15+ files) | ✅ Active |
| **Collaboration Identity** | `collaboration-identity.md`, `trust-relationships.md` | 🔶 In Development |
| **Privacy & Security** | `privacy-model.md`, `identity-security.md` | ✅ Active |

### 4.8 Presentation (`specs/presentation/`)
| File | Description | Status |
|------|-------------|--------|
| [presentation-mode.md](./specs/presentation/presentation-mode.md) | Fullscreen presentation runner | ✅ Active |
| [presentation-mode-caching.md](./specs/presentation/presentation-mode-caching.md) | Slide caching for performance | ✅ Active |
| [animation-transitions.md](./specs/presentation/animation-transitions.md) | Slide transitions & animations | ✅ Active |

### 4.9 Property Inspector (`specs/property-inspector/`)
| File | Description | Status |
|------|-------------|--------|
| [property-inspector-ui.md](./specs/property-inspector/property-inspector-ui.md) | Overall property panel design | ✅ Active |
| [property-inspector-position.md](./specs/property-inspector/property-inspector-position.md) | Position & transform properties | ✅ Active |
| [property-inspector-layout-appearance.md](./specs/property-inspector/property-inspector-layout-appearance.md) | Layout & appearance | ✅ Active |
| [property-inspector-fill.md](./specs/property-inspector/property-inspector-fill.md) | Fill properties | ✅ Active |
| [property-inspector-stroke.md](./specs/property-inspector/property-inspector-stroke.md) | Stroke properties | ✅ Active |
| [property-inspector-typography.md](./specs/property-inspector/property-inspector-typography.md) | Text properties | ✅ Active |
| [property-inspector-effects.md](./specs/property-inspector/property-inspector-effects.md) | Effects (shadow, blur) | ✅ Active |
| [property-inspector-slide.md](./specs/property-inspector/property-inspector-slide.md) | Slide-level properties | ✅ Active |
| [property-inspector-export.md](./specs/property-inspector/property-inspector-export.md) | Export settings | 🔶 Planned |

### 4.10 Rendering (`specs/rendering/`)
| File | Description | Status |
|------|-------------|--------|
| [rendering-architecture.md](./specs/rendering/rendering-architecture.md) | Hybrid DOM/Canvas rendering | ✅ Active |
| [background-system.md](./specs/rendering/background-system.md) | Background types and rendering | ✅ Active |

### 4.11 Slides (`specs/slides/`)
| File | Description | Status |
|------|-------------|--------|
| [slide-management.md](./specs/slides/slide-management.md) | Slide CRUD, reordering | ✅ Active |
| [slide-master-system.md](./specs/slides/slide-master-system.md) | Master slide UX | ✅ Active |
| [master-mode-interaction.md](./specs/slides/master-mode-interaction.md) | Master editing mode | ✅ Active |
| [master-placeholder-integration.md](./specs/slides/master-placeholder-integration.md) | Placeholder system | ✅ Active |

### 4.12 Storage (`specs/storage/`)
| File | Description | Status |
|------|-------------|--------|
| [file-format-storage.md](./specs/storage/file-format-storage.md) | `.story` file format | ✅ Active |
| [file-storage-ux.md](./specs/storage/file-storage-ux.md) | Save/load UX flows | ✅ Active |
| [file-storage-ui-components.md](./specs/storage/file-storage-ui-components.md) | File browser UI | ✅ Active |
| [cloud-file-browser-ux-spec.md](./specs/storage/cloud-file-browser-ux-spec.md) | Cloud file browser | ✅ Active |
| [cloud-storage-abstraction.md](./specs/storage/cloud-storage-abstraction.md) | Storage provider abstraction | ✅ Active |
| [asset-management.md](./specs/storage/asset-management.md) | Asset handling | ✅ Active |
| [memory-management.md](./specs/storage/memory-management.md) | Memory optimization | ✅ Active |
| [progressive-loading.md](./specs/storage/progressive-loading.md) | Progressive file loading | ✅ Active |
| [large-file-handling.md](./specs/storage/large-file-handling.md) | Large file strategies | ✅ Active |
| [collaborative-save-protocol.md](./specs/storage/collaborative-save-protocol.md) | Collaborative save | 🔶 In Development |
| [cross-tab-coordination.md](./specs/storage/cross-tab-coordination.md) | Multi-tab coordination | ✅ Active |
| [data-model-properties.md](./specs/storage/data-model-properties.md) | Data model reference | 📋 Reference |
| [file-format-benchmark.md](./specs/storage/file-format-benchmark.md) | Performance benchmarks | 📋 Reference |

### 4.13 Toolbar (`specs/toolbar/`)
| File | Description | Status |
|------|-------------|--------|
| [toolbar-redesign.md](./specs/toolbar/toolbar-redesign.md) | Toolbar layout and tools | ✅ Active |
| [app-menu.md](./specs/toolbar/app-menu.md) | Application menu structure | ✅ Active |

---

## 5. Technical Specifications (tech-specs/)

### 5.1 AI (`tech-specs/ai/`)
| File | Description | Status |
|------|-------------|--------|
| [ai-integration.md](./tech-specs/ai/ai-integration.md) | AI service integration architecture | 🔶 Experimental |

### 5.2 Core (`tech-specs/core/`)
| File | Description | Status |
|------|-------------|--------|
| [**architecture-overview.md**](./tech-specs/core/architecture-overview.md) | ⭐ System architecture | ✅ Active |
| [data-structures.md](./tech-specs/core/data-structures.md) | Core data models | ✅ Active |
| [interaction-model.md](./tech-specs/core/interaction-model.md) | Input handling architecture | ✅ Active |
| [component-system.md](./tech-specs/core/component-system.md) | UI component patterns | ✅ Active |
| [text-editing-v2.md](./tech-specs/core/text-editing-v2.md) | Text editing implementation | ✅ Active |
| `text-editing/` | Text editing subsystem details | ✅ Active |

### 5.3 Fills (`tech-specs/fills/`)
| File | Description | Status |
|------|-------------|--------|
| [media-fill-system.md](./tech-specs/fills/media-fill-system.md) | Media fill implementation | ✅ Active |
| [media-asset-integration.md](./tech-specs/fills/media-asset-integration.md) | Asset manager integration | ✅ Active |
| [text-fill-system.md](./tech-specs/fills/text-fill-system.md) | Text fill implementation | ✅ Active |
| [codefill-mouse-interaction.md](./tech-specs/fills/codefill-mouse-interaction.md) | Code fill interaction | ✅ Active |

### 5.4 Rendering (`tech-specs/rendering/`)
| File | Description | Status |
|------|-------------|--------|
| [rendering-pipeline.md](./tech-specs/rendering/rendering-pipeline.md) | Render pipeline architecture | ✅ Active |
| [background-engine.md](./tech-specs/rendering/background-engine.md) | Background rendering engine | ✅ Active |
| [text-engine.md](./tech-specs/rendering/text-engine.md) | Text rendering engine | ✅ Active |
| [rendering-navigation-details.md](./tech-specs/rendering/rendering-navigation-details.md) | Navigation rendering | ✅ Active |

### 5.5 Slides (`tech-specs/slides/`)
| File | Description | Status |
|------|-------------|--------|
| [**master-slide-system.md**](./tech-specs/slides/master-slide-system.md) | ⭐ Master slide implementation | ✅ Active |

---

## 6. Implementation Plans (plans/)

Implementation plans document the roadmap for specific features. Many are **historical** — completed or superseded.

### Status Legend
| Symbol | Meaning |
|--------|---------|
| ✅ | Completed |
| 🔶 | In Progress / Partially Complete |
| ⏸️ | On Hold |
| 📋 | Reference Only (superseded) |

### Plan Catalog

| Plan | Description | Status |
|------|-------------|--------|
| [master-implementation-plan-v2.md](./plans/master-implementation-plan-v2.md) | Master implementation roadmap v2 | 📋 Reference |
| [master-implementation-plan.md](./plans/master-implementation-plan.md) | Original master plan | 📋 Superseded |
| [implementation-plan.md](./plans/implementation-plan.md) | General implementation plan | 📋 Reference |
| [comprehensive-test-plan.md](./plans/comprehensive-test-plan.md) | Testing strategy | ✅ Active |
| [validation-framework.md](./plans/validation-framework.md) | Validation patterns | ✅ Active |
| | | |
| **Core Systems** | | |
| [undo-redo-implementation-plan.md](./plans/undo-redo-implementation-plan.md) | Undo/redo system | ✅ Completed |
| [global-input-behavior-plan.md](./plans/global-input-behavior-plan.md) | Input handling | ✅ Completed |
| [cursor-system-implementation-plan.md](./plans/cursor-system-implementation-plan.md) | Cursor management | ✅ Completed |
| | | |
| **Slide System** | | |
| [slide-master-implementation-plan.md](./plans/slide-master-implementation-plan.md) | Master slides | ✅ Completed |
| [master-slide-design-plan.md](./plans/master-slide-design-plan.md) | Master slide design | ✅ Completed |
| [master-mode-unification-plan.md](./plans/master-mode-unification-plan.md) | Mode unification | ✅ Completed |
| | | |
| **Text Editing** | | |
| [text-editing-v2-implementation-plan.md](./plans/text-editing-v2-implementation-plan.md) | Text editing v2 | ✅ Completed |
| [text-editing-implementation-plan.md](./plans/text-editing-implementation-plan.md) | Text editing v1 | 📋 Superseded |
| | | |
| **Typography & Design** | | |
| [typography-implementation-plan.md](./plans/typography-implementation-plan.md) | Typography system | ✅ Completed |
| [typography-style-manager-implementation-plan.md](./plans/typography-style-manager-implementation-plan.md) | Typography manager | ✅ Completed |
| [design-token-standardization-plan.md](./plans/design-token-standardization-plan.md) | Design tokens | ✅ Completed |
| [color-theme-manager-implementation-plan.md](./plans/color-theme-manager-implementation-plan.md) | Theme manager | ✅ Completed |
| | | |
| **Fill System** | | |
| [code-fill-panel-implementation-plan.md](./plans/code-fill-panel-implementation-plan.md) | Code fill panel | ✅ Completed |
| [codefill-mouse-interaction-plan.md](./plans/codefill-mouse-interaction-plan.md) | Code fill interaction | ✅ Completed |
| [codefill-presets-implementation-plan.md](./plans/codefill-presets-implementation-plan.md) | Code fill presets | ✅ Completed |
| [media-fill-implementation-plan.md](./plans/media-fill-implementation-plan.md) | Media fills | ✅ Completed |
| | | |
| **Property Inspector** | | |
| [property-inspector-implementation-plan.md](./plans/property-inspector-implementation-plan.md) | Property panel | ✅ Completed |
| | | |
| **Presentation Mode** | | |
| [presentation-mode-implementation-plan.md](./plans/presentation-mode-implementation-plan.md) | Presentation runner | ✅ Completed |
| [presentation-mode-caching-plan.md](./plans/presentation-mode-caching-plan.md) | Slide caching | ✅ Completed |
| | | |
| **Storage & Performance** | | |
| [file-format-implementation-plan.md](./plans/file-format-implementation-plan.md) | File format | ✅ Completed |
| [file-storage-implementation-plan.md](./plans/file-storage-implementation-plan.md) | File storage | ✅ Completed |
| [memory-management-plan.md](./plans/memory-management-plan.md) | Memory optimization | ✅ Completed |
| [rendering-overhaul-plan.md](./plans/rendering-overhaul-plan.md) | Rendering improvements | ✅ Completed |
| | | |
| **Identity & Collaboration** | | |
| [identity-management-implementation-plan.md](./plans/identity-management-implementation-plan.md) | Identity system | 🔶 In Progress |
| [realtime-collaboration-implementation-plan.md](./plans/realtime-collaboration-implementation-plan.md) | Real-time collab | 🔶 In Progress |

---

## 7. Supporting Documents

| Document | Description |
|----------|-------------|
| [principles.md](./principles.md) | Development principles and guidelines |
| [oauth-setup-guide.md](./oauth-setup-guide.md) | OAuth provider configuration |
| [REORG-REPORT.md](./REORG-REPORT.md) | Documentation reorganization history (Nov 2025) |
| [oritinal-starting-prompt.md](./oritinal-starting-prompt.md) | Original project prompt (historical) |
| `ui-reference-images/` | UI mockups and visual references |

---

## 8. Document Status & Maintenance

### Status Definitions

| Status | Symbol | Description |
|--------|--------|-------------|
| **Active** | ✅ | Current, maintained, source of truth |
| **In Development** | 🔶 | Being actively worked on, may be incomplete |
| **Experimental** | 🔶 | Exploratory, subject to significant change |
| **Planned** | 🔶 | Specified but not yet implemented |
| **Superseded** | ⚠️ | Replaced by newer document, kept for reference |
| **Reference** | 📋 | Historical or reference material only |

### Maintenance Guidelines

1. **Update this catalog** when adding new specs
2. **Mark documents as superseded** rather than deleting them
3. **Include status** in individual document headers
4. **Cross-reference** related documents within each spec
5. **Date updates** using "Last Updated" headers

### Finding Outdated Documents

Documents may be outdated if they:
- Reference deprecated patterns or APIs
- Conflict with newer specifications
- Haven't been updated in >6 months during active development
- Are marked with ⚠️ Superseded status

---

## 9. Product Summary

### 9.1 Core Features

| Feature | Spec | Tech Spec |
|---------|------|-----------|
| **Slide Management** | [slide-management.md](./specs/slides/slide-management.md) | [data-structures.md](./tech-specs/core/data-structures.md) |
| **Master Slides** | [slide-master-system.md](./specs/slides/slide-master-system.md) | [master-slide-system.md](./tech-specs/slides/master-slide-system.md) |
| **Canvas Interaction** | [canvas-interaction.md](./specs/canvas/canvas-interaction.md) | [interaction-model.md](./tech-specs/core/interaction-model.md) |
| **Text Editing** | [text-editing-v2.md](./specs/core/text-editing-v2.md) | [text-engine.md](./tech-specs/rendering/text-engine.md) |
| **Fill System** | [specs/fills/](./specs/fills/) | [tech-specs/fills/](./tech-specs/fills/) |
| **Presentation Mode** | [presentation-mode.md](./specs/presentation/presentation-mode.md) | — |
| **Cloud Storage** | [specs/storage/](./specs/storage/) | — |
| **Collaboration** | [specs/collaboration/](./specs/collaboration/) | — |
| **Identity** | [specs/identity/](./specs/identity/) | — |

### 9.2 Technical Stack

| Component | Technology |
|-----------|------------|
| **Language** | Vanilla JavaScript (ES6+), no TypeScript |
| **Styling** | CSS3 with CSS Variables |
| **Animation** | Anime.js |
| **Icons** | FontAwesome |
| **Build** | Vite |
| **Testing** | Vitest |
| **Rendering** | Hybrid DOM + Canvas |

### 9.3 Key Interaction Patterns

Story follows **Figma-like interactions**:

- **Selection:** Click, Shift+Click, Marquee, Deep Select (Cmd/Ctrl+Click)
- **Transform:** Resize handles, rotation, constrained resize (Shift), center resize (Alt)
- **Navigation:** Spacebar+Drag pan, Cmd/Ctrl+Scroll zoom
- **Shortcuts:** Cmd/Ctrl+G group, ] bring forward, [ send back

See [Interaction Model](./tech-specs/core/interaction-model.md) for complete details.

### 9.4 UI Design Philosophy

Story's UI is inspired by **Teenage Engineering** — industrial, tactile, high-density:

- **7-Step Scales:** All tokens follow XXS→XXL progression
- **Accent Color Philosophy:** All interactions use accent color (not gray)
- **Visual Translation:** Components solving same problem look identical
- **Theme Support:** Light/Dark with full accent color customization

See [UI Design System](./specs/design-system/ui-design-system.md) for complete details.


