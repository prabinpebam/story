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
├── 00-product/                   # High-level product vision & requirements
│   ├── product-spec.md           ← YOU ARE HERE (Main Entry Point)
│   └── principles.md             # Development principles & guidelines
│
├── 01-specs/                     # THE Single Source of Truth (Merged specs & tech-specs)
│   ├── ai/                       # AI features
│   ├── canvas/                   # Canvas interactions, Rendering, Fills
│   ├── collaboration/            # Real-time, Identity, Storage
│   ├── core/                     # Core architecture (Store, Undo/Redo, Input)
│   ├── slides/                   # Slide data model, Master slides, Presentation
│   ├── text-editing/             # Text editing (consolidated v1/v2)
│   └── ui-system/                # Design System, Themes, Components
│
├── 02-guides/                    # Developer guides & How-tos
│   ├── oauth-setup-guide.md
│   └── ...
│
├── 03-automation/                # Frontend automation docs
│   └── ...
│
└── archive/                      # OLD plans and superseded specs
    ├── plans/                    # Completed implementation plans
    └── reports/                  # Old analysis reports
```

### Document Types

| Location | Purpose | Audience |
|----------|---------|----------|
| `00-product/` | Vision, principles, and high-level requirements | Everyone |
| `01-specs/` | **Source of Truth** for features (UX + Technical) | Designers, Developers |
| `02-guides/` | Setup guides and how-tos | Developers |
| `archive/` | Historical context and completed plans | Reference |

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
| [**Architecture Overview**](../01-specs/core/architecture-overview.md) | ⭐ System architecture and design patterns |
| [Data Structures](../01-specs/core/data-structures.md) | Core data models (slides, elements, etc.) |
| [Interaction Model](../01-specs/core/interaction-model.md) | Figma-like canvas interaction |
| [Component System](../01-specs/core/component-system.md) | UI component architecture |

### Key Features
| Document | Description |
|----------|-------------|
| [**Master Slide System**](../01-specs/slides/master-slide-system.md) | ⭐ Master/layout inheritance model |
| [Canvas Interaction](../01-specs/canvas/canvas-interaction.md) | Selection, transform, navigation |
| [Text Editing v2](../01-specs/text-editing/text-editing-v2.md) | Text editing behavior |
| [Undo/Redo](../01-specs/core/undo-redo.md) | History management |

---

## 4. Feature Specifications (01-specs/)

### 4.1 AI (`01-specs/ai/`)
| File | Description | Status |
|------|-------------|--------|
| [ai-copilot.md](../01-specs/ai/ai-copilot.md) | AI assistant integration, content generation | 🔶 Experimental |

### 4.2 Canvas (`01-specs/canvas/`)
| File | Description | Status |
|------|-------------|--------|
| [canvas-interaction.md](../01-specs/canvas/canvas-interaction.md) | Selection, marquee, transform behaviors | ✅ Active |
| [context-menu.md](../01-specs/canvas/context-menu.md) | Right-click context menu system | ✅ Active |
| [cursor-behavior.md](../01-specs/canvas/cursor-behavior.md) | Cursor states and visual feedback | ✅ Active |
| [layer-management.md](../01-specs/canvas/layer-management.md) | Layer tree, z-index, grouping | ✅ Active |

### 4.3 Collaboration (`01-specs/collaboration/`)
| File | Description | Status |
|------|-------------|--------|
| [realtime-collaboration.md](../01-specs/collaboration/realtime-collaboration.md) | Real-time sync architecture | 🔶 In Development |
| [collaboration-protocol.md](../01-specs/collaboration/collaboration-protocol.md) | Message protocol for sync | 🔶 In Development |
| [authentication.md](../01-specs/collaboration/authentication.md) | OAuth authentication flow | ✅ Active |
| [azure-signalr-integration.md](../01-specs/collaboration/azure-signalr-integration.md) | SignalR server integration | 🔶 In Development |
| [security-model.md](../01-specs/collaboration/security-model.md) | Security architecture | ✅ Active |
| [sharing-permissions.md](../01-specs/collaboration/sharing-permissions.md) | Sharing and access control | 🔶 In Development |
| [cloud-storage-abstraction.md](../01-specs/collaboration/cloud-storage-abstraction.md) | Storage provider abstraction | ✅ Active |
| [asset-streaming.md](../01-specs/collaboration/asset-streaming.md) | Media asset streaming | 🔶 Planned |
| [state-sync-engine.md](../01-specs/collaboration/state-sync-engine.md) | State synchronization engine | 🔶 In Development |

### 4.4 Core (`01-specs/core/`)
| File | Description | Status |
|------|-------------|--------|
| [global-input-behavior.md](../01-specs/core/global-input-behavior.md) | Keyboard/mouse input handling | ✅ Active |
| [text-editing-v2.md](../01-specs/text-editing/text-editing-v2.md) | Text editing interactions | ✅ Active |
| [text-editing-interaction.md](../01-specs/text-editing/text-editing-interaction.md) | Text editing details | ⚠️ Superseded by v2 |
| [text-editing-test-plan.md](../01-specs/text-editing/text-editing-test-plan.md) | Text editing test cases | ✅ Active |
| [undo-redo.md](../01-specs/core/undo-redo.md) | History management system | ✅ Active |
| [context-menu-system.md](../01-specs/core/context-menu-system.md) | Context menu architecture | ✅ Active |
| [property-memory-system.md](../01-specs/core/property-memory-system.md) | Property value memory | ✅ Active |
| [url-routing-strategy.md](../01-specs/core/url-routing-strategy.md) | URL and routing patterns | ✅ Active |

### 4.5 Design System (`01-specs/ui-system/`)
| File | Description | Status |
|------|-------------|--------|
| [**ui-design-system.md**](../01-specs/ui-system/ui-design-system.md) | ⭐ Complete design system | ✅ Active |
| [design-system-ux-guide.md](../01-specs/ui-system/design-system-ux-guide.md) | UX guidelines | ✅ Active |
| [color-theme-manager.md](../01-specs/ui-system/color-theme-manager.md) | Theme and color management | ✅ Active |
| [typography-style-manager.md](../01-specs/slides/themes/typography-style-manager.md) | Typography system | ✅ Active |
| [**linked-properties-system.md**](../01-specs/slides/themes/linked-properties-system.md) | ⭐ Theme/style property binding | ✅ Active |
| [theme-architecture.md](../01-specs/ui-system/theme-architecture.md) | Theme implementation details | ✅ Active |
| [design-consistency-audit.md](../01-specs/ui-system/design-consistency-audit.md) | Audit results and fixes | 📋 Reference |

### 4.6 Fills (`01-specs/canvas/fills/`)
| File | Description | Status |
|------|-------------|--------|
| [code-fill-panel.md](../01-specs/canvas/fills/code-fill-panel.md) | Code-based fill editor | ✅ Active |
| [codefill-presets.md](../01-specs/canvas/fills/codefill-presets.md) | Code fill presets system | ✅ Active |
| [color-picker-ui.md](../01-specs/canvas/fills/color-picker-ui.md) | Color picker component | ✅ Active |
| [gradient-fill.md](../01-specs/canvas/fills/gradient-fill.md) | Gradient fill system | ✅ Active |
| [media-fill-system.md](../01-specs/canvas/fills/media-fill-system.md) | Image/video fills | ✅ Active |

### 4.7 Identity (`01-specs/collaboration/identity/`)

> See [01-specs/collaboration/identity/README.md](../01-specs/collaboration/identity/README.md) for the full catalog.

| Category | Key Files | Status |
|----------|-----------|--------|
| **Core Identity** | `identity-architecture.md`, `oauth-identity-flow.md`, `user-profile-model.md` | ✅ Active |
| **Session Lifecycle** | `session-lifecycle.md`, `cross-device-identity.md` | ✅ Active |
| **User Preferences** | `user-preferences-file.md`, `preferences-*.md` (15+ files) | ✅ Active |
| **Collaboration Identity** | `collaboration-identity.md`, `trust-relationships.md` | 🔶 In Development |
| **Privacy & Security** | `privacy-model.md`, `identity-security.md` | ✅ Active |

### 4.8 Presentation (`01-specs/slides/presentation/`)
| File | Description | Status |
|------|-------------|--------|
| [presentation-mode.md](../01-specs/slides/presentation/presentation-mode.md) | Fullscreen presentation runner | ✅ Active |
| [presentation-mode-caching.md](../01-specs/slides/presentation/presentation-mode-caching.md) | Slide caching for performance | ✅ Active |
| [animation-transitions.md](../01-specs/slides/presentation/animation-transitions.md) | Slide transitions & animations | ✅ Active |

### 4.9 Property Inspector (`01-specs/ui-system/property-inspector/`)
| File | Description | Status |
|------|-------------|--------|
| [property-inspector-ui.md](../01-specs/ui-system/property-inspector/property-inspector-ui.md) | Overall property panel design | ✅ Active |
| [property-inspector-position.md](../01-specs/ui-system/property-inspector/property-inspector-position.md) | Position & transform properties | ✅ Active |
| [property-inspector-layout-appearance.md](../01-specs/ui-system/property-inspector/property-inspector-layout-appearance.md) | Layout & appearance | ✅ Active |
| [property-inspector-fill.md](../01-specs/ui-system/property-inspector/property-inspector-fill.md) | Fill properties | ✅ Active |
| [property-inspector-stroke.md](../01-specs/ui-system/property-inspector/property-inspector-stroke.md) | Stroke properties | ✅ Active |
| [property-inspector-typography.md](../01-specs/ui-system/property-inspector/property-inspector-typography.md) | Text properties | ✅ Active |
| [property-inspector-effects.md](../01-specs/ui-system/property-inspector/property-inspector-effects.md) | Effects (shadow, blur) | ✅ Active |
| [property-inspector-slide.md](../01-specs/ui-system/property-inspector/property-inspector-slide.md) | Slide-level properties | ✅ Active |
| [property-inspector-export.md](../01-specs/ui-system/property-inspector/property-inspector-export.md) | Export settings | 🔶 Planned |

### 4.10 Rendering (`01-specs/canvas/rendering/`)
| File | Description | Status |
|------|-------------|--------|
| [rendering-architecture.md](../01-specs/canvas/rendering/rendering-architecture.md) | Hybrid DOM/Canvas rendering | ✅ Active |
| [background-system.md](../01-specs/canvas/rendering/background-system.md) | Background types and rendering | ✅ Active |

### 4.11 Slides (`01-specs/slides/`)
| File | Description | Status |
|------|-------------|--------|
| [slide-management.md](../01-specs/slides/slide-management.md) | Slide CRUD, reordering | ✅ Active |
| [slide-master-system.md](../01-specs/slides/01-slide-master-system.md) | Master slide UX | ✅ Active |
| [master-mode-interaction.md](../01-specs/slides/master-mode-interaction.md) | Master editing mode | ✅ Active |
| [master-placeholder-integration.md](../01-specs/slides/master-placeholder-integration.md) | Placeholder system | ✅ Active |

### 4.12 Storage (`01-specs/collaboration/storage/`)
| File | Description | Status |
|------|-------------|--------|
| [file-format-storage.md](../01-specs/collaboration/storage/file-format-storage.md) | `.story` file format | ✅ Active |
| [file-storage-ux.md](../01-specs/collaboration/storage/file-storage-ux.md) | Save/load UX flows | ✅ Active |
| [file-storage-ui-components.md](../01-specs/collaboration/storage/file-storage-ui-components.md) | File browser UI | ✅ Active |
| [cloud-file-browser-ux-spec.md](../01-specs/collaboration/storage/cloud-file-browser-ux-spec.md) | Cloud file browser | ✅ Active |
| [cloud-storage-abstraction.md](../01-specs/collaboration/storage/cloud-storage-abstraction.md) | Storage provider abstraction | ✅ Active |
| [asset-management.md](../01-specs/collaboration/storage/asset-management.md) | Asset handling | ✅ Active |
| [memory-management.md](../01-specs/collaboration/storage/memory-management.md) | Memory optimization | ✅ Active |
| [progressive-loading.md](../01-specs/collaboration/storage/progressive-loading.md) | Progressive file loading | ✅ Active |
| [large-file-handling.md](../01-specs/collaboration/storage/large-file-handling.md) | Large file strategies | ✅ Active |
| [collaborative-save-protocol.md](../01-specs/collaboration/storage/collaborative-save-protocol.md) | Collaborative save | 🔶 In Development |
| [cross-tab-coordination.md](../01-specs/collaboration/storage/cross-tab-coordination.md) | Multi-tab coordination | ✅ Active |
| [data-model-properties.md](../01-specs/collaboration/storage/data-model-properties.md) | Data model reference | 📋 Reference |
| [file-format-benchmark.md](../01-specs/collaboration/storage/file-format-benchmark.md) | Performance benchmarks | 📋 Reference |

### 4.13 Toolbar (`01-specs/ui-system/toolbar/`)
| File | Description | Status |
|------|-------------|--------|
| [toolbar-redesign.md](../01-specs/ui-system/toolbar/toolbar-redesign.md) | Toolbar layout and tools | ✅ Active |
| [app-menu.md](../01-specs/ui-system/toolbar/app-menu.md) | Application menu structure | ✅ Active |

---

## 5. Technical Specifications (Merged into 01-specs)

> **Note:** Technical specifications have been merged into the main `01-specs` directory to keep functional and technical details together.

### 5.1 AI (`01-specs/ai/`)
| File | Description | Status |
|------|-------------|--------|
| [ai-integration.md](../01-specs/ai/ai-integration.md) | AI service integration architecture | 🔶 Experimental |

### 5.2 Core (`01-specs/core/`)
| File | Description | Status |
|------|-------------|--------|
| [**architecture-overview.md**](../01-specs/core/architecture-overview.md) | ⭐ System architecture | ✅ Active |
| [data-structures.md](../01-specs/core/data-structures.md) | Core data models | ✅ Active |
| [interaction-model.md](../01-specs/core/interaction-model.md) | Input handling architecture | ✅ Active |
| [component-system.md](../01-specs/core/component-system.md) | UI component patterns | ✅ Active |
| [text-editing-v2-technical.md](../01-specs/text-editing/text-editing-v2-technical.md) | Text editing implementation | ✅ Active |
| `text-editing/technical/` | Text editing subsystem details | ✅ Active |

### 5.3 Fills (`01-specs/canvas/fills/`)
| File | Description | Status |
|------|-------------|--------|
| [media-fill-system-technical.md](../01-specs/canvas/fills/media-fill-system-technical.md) | Media fill implementation | ✅ Active |
| [media-asset-integration.md](../01-specs/canvas/fills/media-asset-integration.md) | Asset manager integration | ✅ Active |
| [text-fill-system.md](../01-specs/canvas/fills/text-fill-system.md) | Text fill implementation | ✅ Active |
| [codefill-mouse-interaction.md](../01-specs/canvas/fills/codefill-mouse-interaction.md) | Code fill interaction | ✅ Active |

### 5.4 Rendering (`01-specs/canvas/rendering/`)
| File | Description | Status |
|------|-------------|--------|
| [rendering-pipeline.md](../01-specs/canvas/rendering/rendering-pipeline.md) | Render pipeline architecture | ✅ Active |
| [background-engine.md](../01-specs/canvas/rendering/background-engine.md) | Background rendering engine | ✅ Active |
| [text-engine.md](../01-specs/canvas/rendering/text-engine.md) | Text rendering engine | ✅ Active |
| [rendering-navigation-details.md](../01-specs/canvas/rendering/rendering-navigation-details.md) | Navigation rendering | ✅ Active |

### 5.5 Slides (`01-specs/slides/`)
| File | Description | Status |
|------|-------------|--------|
| [**master-slide-system.md**](../01-specs/slides/master-slide-system.md) | ⭐ Master slide implementation | ✅ Active |

---

## 6. Implementation Plans (Archived)

> **Note:** All implementation plans have been moved to `documentation/archive/plans/`. They are kept for historical reference but are no longer active documents.

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
| [master-implementation-plan-v2.md](../archive/plans/master-implementation-plan-v2.md) | Master implementation roadmap v2 | 📋 Reference |
| [master-implementation-plan.md](../archive/plans/master-implementation-plan.md) | Original master plan | 📋 Superseded |
| [implementation-plan.md](../archive/plans/implementation-plan.md) | General implementation plan | 📋 Reference |
| [comprehensive-test-plan.md](../archive/plans/comprehensive-test-plan.md) | Testing strategy | ✅ Active |
| [validation-framework.md](../archive/plans/validation-framework.md) | Validation patterns | ✅ Active |
| | | |
| **Core Systems** | | |
| [undo-redo-implementation-plan.md](../archive/plans/undo-redo-implementation-plan.md) | Undo/redo system | ✅ Completed |
| [global-input-behavior-plan.md](../archive/plans/global-input-behavior-plan.md) | Input handling | ✅ Completed |
| [cursor-system-implementation-plan.md](../archive/plans/cursor-system-implementation-plan.md) | Cursor management | ✅ Completed |
| | | |
| **Slide System** | | |
| [slide-master-implementation-plan.md](../archive/plans/slide-master-implementation-plan.md) | Master slides | ✅ Completed |
| [master-slide-design-plan.md](../archive/plans/master-slide-design-plan.md) | Master slide design | ✅ Completed |
| [master-mode-unification-plan.md](../archive/plans/master-mode-unification-plan.md) | Mode unification | ✅ Completed |
| | | |
| **Text Editing** | | |
| [text-editing-v2-implementation-plan.md](../archive/plans/text-editing-v2-implementation-plan.md) | Text editing v2 | ✅ Completed |
| [text-editing-implementation-plan.md](../archive/plans/text-editing-implementation-plan.md) | Text editing v1 | 📋 Superseded |
| | | |
| **Typography & Design** | | |
| [typography-implementation-plan.md](../archive/plans/typography-implementation-plan.md) | Typography system | ✅ Completed |
| [typography-style-manager-implementation-plan.md](../archive/plans/typography-style-manager-implementation-plan.md) | Typography manager | ✅ Completed |
| [design-token-standardization-plan.md](../archive/plans/design-token-standardization-plan.md) | Design tokens | ✅ Completed |
| [color-theme-manager-implementation-plan.md](../archive/plans/color-theme-manager-implementation-plan.md) | Theme manager | ✅ Completed |
| | | |
| **Fill System** | | |
| [code-fill-panel-implementation-plan.md](../archive/plans/code-fill-panel-implementation-plan.md) | Code fill panel | ✅ Completed |
| [codefill-mouse-interaction-plan.md](../archive/plans/codefill-mouse-interaction-plan.md) | Code fill interaction | ✅ Completed |
| [codefill-presets-implementation-plan.md](../archive/plans/codefill-presets-implementation-plan.md) | Code fill presets | ✅ Completed |
| [media-fill-implementation-plan.md](../archive/plans/media-fill-implementation-plan.md) | Media fills | ✅ Completed |
| | | |
| **Property Inspector** | | |
| [property-inspector-implementation-plan.md](../archive/plans/property-inspector-implementation-plan.md) | Property panel | ✅ Completed |
| | | |
| **Presentation Mode** | | |
| [presentation-mode-implementation-plan.md](../archive/plans/presentation-mode-implementation-plan.md) | Presentation runner | ✅ Completed |
| [presentation-mode-caching-plan.md](../archive/plans/presentation-mode-caching-plan.md) | Slide caching | ✅ Completed |
| | | |
| **Storage & Performance** | | |
| [file-format-implementation-plan.md](../archive/plans/file-format-implementation-plan.md) | File format | ✅ Completed |
| [file-storage-implementation-plan.md](../archive/plans/file-storage-implementation-plan.md) | File storage | ✅ Completed |
| [memory-management-plan.md](../archive/plans/memory-management-plan.md) | Memory optimization | ✅ Completed |
| [rendering-overhaul-plan.md](../archive/plans/rendering-overhaul-plan.md) | Rendering improvements | ✅ Completed |
| | | |
| **Identity & Collaboration** | | |
| [identity-management-implementation-plan.md](../archive/plans/identity-management-implementation-plan.md) | Identity system | 🔶 In Progress |
| [realtime-collaboration-implementation-plan.md](../archive/plans/realtime-collaboration-implementation-plan.md) | Real-time collab | 🔶 In Progress |

---

## 7. Supporting Documents

| Document | Description |
|----------|-------------|
| [principles.md](./principles.md) | Development principles and guidelines |
| [oauth-setup-guide.md](../02-guides/oauth-setup-guide.md) | OAuth provider configuration |
| [REORG-REPORT.md](../archive/reports/REORG-REPORT.md) | Documentation reorganization history (Nov 2025) |
| [original-starting-prompt.md](../archive/reports/original-starting-prompt.md) | Original project prompt (historical) |
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
| **Slide Management** | [slide-management.md](../01-specs/slides/slide-management.md) | [data-structures.md](../01-specs/core/data-structures.md) |
| **Master Slides** | [slide-master-system.md](../01-specs/slides/01-slide-master-system.md) | [master-slide-system.md](../01-specs/slides/master-slide-system.md) |
| **Canvas Interaction** | [canvas-interaction.md](../01-specs/canvas/canvas-interaction.md) | [interaction-model.md](../01-specs/core/interaction-model.md) |
| **Text Editing** | [text-editing-v2.md](../01-specs/text-editing/text-editing-v2.md) | [text-engine.md](../01-specs/canvas/rendering/text-engine.md) |
| **Fill System** | [01-specs/canvas/fills/](../01-specs/canvas/fills/) | [01-specs/canvas/fills/](../01-specs/canvas/fills/) |
| **Presentation Mode** | [presentation-mode.md](../01-specs/slides/presentation/presentation-mode.md) | — |
| **Cloud Storage** | [01-specs/collaboration/storage/](../01-specs/collaboration/storage/) | — |
| **Collaboration** | [01-specs/collaboration/](../01-specs/collaboration/) | — |
| **Identity** | [01-specs/collaboration/identity/](../01-specs/collaboration/identity/) | — |

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

See [Interaction Model](../01-specs/core/interaction-model.md) for complete details.

### 9.4 UI Design Philosophy

Story's UI is inspired by **Teenage Engineering** — industrial, tactile, high-density:

- **7-Step Scales:** All tokens follow XXS→XXL progression
- **Accent Color Philosophy:** All interactions use accent color (not gray)
- **Visual Translation:** Components solving same problem look identical
- **Theme Support:** Light/Dark with full accent color customization

See [UI Design System](../01-specs/ui-system/ui-design-system.md) for complete details.


