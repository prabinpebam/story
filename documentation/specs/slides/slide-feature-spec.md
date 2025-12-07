# Slide System - Master Feature Specification

**Version:** 1.0  
**Last Updated:** December 7, 2025  
**Status:** Comprehensive Specification

## Document Structure

This master document serves as the central hub for the complete slide system specification, adapted from Microsoft PowerPoint's capabilities and optimized for modern web-based presentation applications.

### Documentation Suite

The slide system is documented across multiple focused specifications:

| Document | Description |
|----------|-------------|
| **[01-slide-master-system.md](./01-slide-master-system.md)** | Master slides, layout masters, multiple masters, inheritance |
| **[02-slide-navigation.md](./02-slide-navigation.md)** | Navigation UI/UX, keyboard shortcuts, slide sorter |
| **[03-slide-sections.md](./03-slide-sections.md)** | Section management, organization, collapsing |
| **[04-slide-operations.md](./04-slide-operations.md)** | CRUD operations, copy/paste, duplicate, transitions |
| **[05-slide-thumbnails.md](./05-slide-thumbnails.md)** | Thumbnail generation, caching, performance |
| **[06-presenter-view.md](./06-presenter-view.md)** | Presenter notes, presenter display, timer, navigation |
| **[07-presentation-modes.md](./07-presentation-modes.md)** | Full screen, reading view, presenter view, recording |
| **[08-slide-sizing.md](./08-slide-sizing.md)** | Aspect ratios, custom sizes, responsive handling |
| **[09-slide-grid-guides.md](./09-slide-grid-guides.md)** | Grid system, ruler, guides, alignment |
| **[10-slide-animations.md](./10-slide-animations.md)** | Entrance/exit animations, motion paths, timing |
| **[11-slide-transitions.md](./11-slide-transitions.md)** | Slide transitions, timing, sound effects |
| **[12-slide-collaboration.md](./12-slide-collaboration.md)** | Comments, reviewing, co-authoring |

---

## 1. System Overview

### 1.1 Core Concepts

The slide system implements a hierarchical template-based architecture with four primary layers:

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION                         │
│  • Global settings (size, theme, metadata)              │
│  • Multiple slide masters                               │
│  • Sections for organization                            │
│  • Presentation-level assets (fonts, media)             │
└────────────────┬────────────────────────────────────────┘
                 │
                 ├─► Slide Masters (Multiple allowed)
                 │   └─► Layout Masters (1+ per master)
                 │       └─► Slides (instances of layouts)
                 │
                 └─► Sections (Logical grouping)
                     └─► Slides (within sections)
```

### 1.2 Design Principles

1. **Template-Driven**: Master slides drive consistency
2. **Non-Destructive**: User content preserved through template changes
3. **Performance-First**: Efficient rendering and caching
4. **Keyboard-Accessible**: Complete keyboard navigation
5. **Collaboration-Ready**: Multi-user editing support
6. **Format-Agnostic**: Export to multiple formats

### 1.3 Key Features Adapted from PowerPoint

#### Implemented Features
- ✅ Slide Masters with inheritance
- ✅ Layout Masters (templates)
- ✅ Placeholder system
- ✅ Slide navigation (thumbnails)
- ✅ Basic transitions
- ✅ Grid and guides
- ✅ Copy/paste operations
- ✅ Presentation mode

#### Features to Implement (Per This Spec)
- 📋 Multiple slide masters per presentation
- 📋 Slide sections with collapse/expand
- 📋 Presenter notes with rich formatting
- 📋 Presenter view (dual display)
- 📋 Slide zoom and focus modes
- 📋 Advanced transitions library
- 📋 Animation pane and timeline
- 📋 Comment and review system
- 📋 Custom slide sizes
- 📋 Slide master isolation mode
- 📋 Header/footer management
- 📋 Slide lining and alignment tools

---

## 2. Architecture Overview

### 2.1 Data Model Hierarchy

```typescript
interface Presentation {
  id: string;
  title: string;
  settings: PresentationSettings;
  slideMasters: SlideMaster[];        // Multiple masters allowed
  sections: Section[];                 // Organizational grouping
  slides: Slide[];                     // All slides in order
  assets: AssetLibrary;                // Shared media/fonts
  metadata: PresentationMetadata;
}

interface PresentationSettings {
  slideSize: {
    type: 'standard' | 'widescreen' | 'custom';
    width: number;
    height: number;
    orientation: 'landscape' | 'portrait';
  };
  defaultMaster: string;               // ID of default master
  showGuides: boolean;
  showGrid: boolean;
  gridSpacing: number;
  snapToGrid: boolean;
  snapToGuides: boolean;
}

interface SlideMaster {
  id: string;
  name: string;
  theme: ThemeSettings;
  layouts: LayoutMaster[];
  preserveAspectRatio: boolean;
  headerFooter: HeaderFooterSettings;
}

interface LayoutMaster {
  id: string;
  name: string;
  placeholders: Placeholder[];
  background: FillSettings | 'inherit';
  elements: Element[];                 // Non-placeholder elements
}

interface Slide {
  id: string;
  masterId: string;                    // Parent master
  layoutId: string;                    // Parent layout
  sectionId?: string;                  // Optional section membership
  position: number;                    // 0-based index
  elements: Element[];                 // Content elements
  placeholderOverrides: PlaceholderOverride[];
  notes: string;                       // Presenter notes (HTML)
  transition: TransitionSettings;
  animations: Animation[];
  hidden: boolean;                     // Hide in presentation
  background?: FillSettings;           // Override master background
}

interface Section {
  id: string;
  name: string;
  position: number;
  collapsed: boolean;
  slideIds: string[];                  // Slides in this section
}
```

### 2.2 Rendering Pipeline

```
User Input → State Manager → Renderer → Canvas/DOM
     ↓            ↓              ↓
  History     Validation    Optimization
  Manager      Engine        (Caching)
```

### 2.3 Performance Considerations

- **Thumbnail Caching**: Pre-render thumbnails at multiple resolutions
- **Virtual Scrolling**: Only render visible thumbnails in slide sorter
- **Lazy Loading**: Load media assets on-demand
- **Worker Threads**: Offload thumbnail generation to Web Workers
- **Incremental Updates**: Only re-render changed elements

---

## 3. User Workflows

### 3.1 Creating a Presentation

1. **New Presentation**: Choose from templates or blank
2. **Select Master**: Apply theme or create custom master
3. **Add Slides**: Choose layouts from master
4. **Add Content**: Fill placeholders or add custom elements
5. **Organize**: Create sections, reorder slides
6. **Present**: Enter presentation mode

### 3.2 Working with Masters

1. **Access Master Mode**: View → Master → Slide Master
2. **Edit Master**: Modify background, colors, fonts
3. **Create Layouts**: Add new layout templates
4. **Define Placeholders**: Set content zones
5. **Apply Changes**: Exit master mode (propagates to slides)

### 3.3 Presenting Content

1. **Presenter View**: Dual-screen setup with notes
2. **Full Screen**: Standard presentation mode
3. **Reading View**: Navigate at your own pace
4. **Recording**: Record narration and timings

---

## 4. Technical Implementation Priorities

### Phase 1: Foundation (Current)
- ✅ Single master with multiple layouts
- ✅ Basic navigation and thumbnails
- ✅ Placeholder system
- ✅ Simple transitions

### Phase 2: Advanced Masters (Next)
- 📋 Multiple slide masters
- 📋 Master isolation mode
- 📋 Layout management UI
- 📋 Theme inheritance

### Phase 3: Organization & Navigation
- 📋 Slide sections
- 📋 Zoom/focus modes
- 📋 Advanced keyboard shortcuts
- 📋 Slide sorter improvements

### Phase 4: Presentation Features
- 📋 Presenter view with notes
- 📋 Dual-display support
- 📋 Recording mode
- 📋 Slide timings

### Phase 5: Collaboration
- 📋 Comments system
- 📋 Review workflow
- 📋 Version history
- 📋 Co-authoring

---

## 5. Design System Integration

### 5.1 Component Library

All slide UI components use the design system tokens:

- **Colors**: `--color-bg-panel`, `--color-text-primary`, etc.
- **Spacing**: `--spacing-1` through `--spacing-8`
- **Typography**: `--font-size-*`, `--font-weight-*`
- **Shadows**: `--shadow-sm`, `--shadow-md`, `--shadow-lg`
- **Radius**: `--radius-sm`, `--radius-md`, `--radius-lg`

### 5.2 Accessibility

- **Keyboard Navigation**: Full keyboard support for all operations
- **Screen Readers**: ARIA labels and roles throughout
- **Focus Indicators**: Clear focus states for all interactive elements
- **Color Contrast**: WCAG AA compliance for text and UI elements

---

## 6. Cross-Document Reference

### Quick Navigation

- **Master System Details**: See [01-slide-master-system.md](./01-slide-master-system.md)
- **Navigation & UX**: See [02-slide-navigation.md](./02-slide-navigation.md)
- **Section Management**: See [03-slide-sections.md](./03-slide-sections.md)
- **Operations & Editing**: See [04-slide-operations.md](./04-slide-operations.md)
- **Presenter Features**: See [06-presenter-view.md](./06-presenter-view.md)
- **Presentation Modes**: See [07-presentation-modes.md](./07-presentation-modes.md)

---

## 7. Success Metrics

### 7.1 Performance Targets

- Thumbnail rendering: < 100ms per slide
- Slide switching: < 50ms
- Master changes propagation: < 200ms
- Presentation mode startup: < 500ms

### 7.2 User Experience Goals

- Zero-friction slide creation
- Intuitive master editing
- Smooth navigation at any scale
- Professional presentation delivery

---

## 8. Future Considerations

### 8.1 Advanced Features

- **Smart Layouts**: AI-suggested layouts based on content
- **Design Ideas**: Automated design recommendations
- **Morph Transitions**: Object-level animations between slides
- **3D Models**: Embedded 3D content support
- **Live Captions**: Real-time speech-to-text during presentation

### 8.2 Export Formats

- PowerPoint (.pptx)
- PDF with notes
- Video export
- HTML5 export
- Image sequence

---

## 9. Related Documentation

- **[Product Specification](../../product-spec.md)**: Overall app vision
- **[Design System](../design-system/)**: UI component specifications
- **[Implementation Plans](../../plans/)**: Development roadmaps
- **[API Reference](../core/)**: Core system APIs

---

**Next Steps**: Review individual feature documents for detailed specifications, implementation guidance, and user workflows.
