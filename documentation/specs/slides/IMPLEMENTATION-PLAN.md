# Slide System - Comprehensive Implementation Plan

**Version:** 1.0  
**Last Updated:** December 7, 2025  
**Status:** Ready for Implementation

---

## Document Purpose

This is the **master implementation plan** for the complete slide system, broken into small, incremental phases that strictly adhere to the project's principles:

- ✅ Small incremental changes (each testable)
- ✅ Strict design system adherence (CSS variables, theme support)
- ✅ Performance mandatory (benchmarks, optimization)
- ✅ Undo/redo support for all operations
- ✅ Security by design
- ✅ Realtime collaboration compatibility
- ✅ File serialization/storage compatibility

**Transition Strategy:** Basic transitions first, advanced transitions last.

---

## Implementation Principles Compliance

### 1. Design System Adherence

**All UI components must:**
- Use CSS variables from `styles/modules/variables.css`
- Support theme switching (accent color changes)
- Work in both dark and light modes
- Use existing components from `src/ui/components/`
- No inline styles or hardcoded colors

**Theme Switching Test:**
```
Change accent from blue → purple → green
All interactions (hover, active, selected) must change color
No hardcoded blues should remain
```

**Visual Translation Principle:**
- Slide thumbnails = miniature canvas with same design language
- Context menus = consistent with app-wide menus
- Animation pane = matches property inspector design
- Master editor = same toolbar style as main editor

### 2. Performance Requirements

**Benchmarks:**
| Operation | Target | Mandatory |
|-----------|--------|-----------|
| Slide switch | < 50ms | YES |
| Thumbnail render | < 100ms | YES |
| Master change propagation | < 200ms | YES |
| Animation playback | 60fps | YES |
| 100 slides load | < 2s | YES |

**Optimization Strategies:**
- Virtual scrolling for thumbnails
- Web Workers for thumbnail generation
- Canvas caching for repeated renders
- Lazy loading for media assets
- Progressive enhancement

### 3. Undo/Redo Compatibility

**All operations must be undoable:**
```typescript
interface UndoableAction {
  type: string;
  description: string;
  undo: () => void;
  redo: () => void;
  timestamp: Date;
}
```

**Test Pattern:**
```
1. Perform action
2. Press Ctrl+Z (should undo)
3. Press Ctrl+Y (should redo)
4. State should match original after redo
```

### 4. Storage & Collaboration

**File Format:**
- JSON-based `.story` format
- Incremental saves (delta updates)
- Conflict-free replicated data types (CRDTs) for collaboration
- Asset references (not embedded binaries)

**Collaboration:**
- Operational transformation for concurrent edits
- Presence indicators (user cursors)
- Lock-free editing where possible
- Optimistic UI updates

### 5. Security by Design

**Data Protection:**
- Input sanitization for all user text
- XSS prevention in slide content
- Safe HTML rendering (no `dangerouslySetInnerHTML`)
- Asset URL validation
- Permission checks before operations

**Access Control:**
- Role-based permissions (Owner, Editor, Commenter, Viewer)
- Secure share links with tokens
- Audit log for sensitive operations

---

## Phase Overview

| Phase | Focus | Duration | Risk |
|-------|-------|----------|------|
| **Phase 0** | Foundation & Infrastructure | 2 weeks | LOW |
| **Phase 1** | Master Slide System | 3 weeks | MEDIUM |
| **Phase 2** | Slide Operations & Navigation | 2 weeks | LOW |
| **Phase 3** | Presenter View & Modes | 3 weeks | MEDIUM |
| **Phase 4** | Comments & Collaboration | 4 weeks | HIGH |
| **Phase 5** | Animations System | 4 weeks | HIGH |
| **Phase 6** | Advanced Features | 3 weeks | MEDIUM |
| **Phase 7** | Transitions (Basic) | 2 weeks | LOW |
| **Phase 8** | Polish & Optimization | 2 weeks | LOW |

**Total Estimated Time:** 25 weeks (6 months)

---

## Phase 0: Foundation & Infrastructure (2 weeks)

### Goals
- Establish core data models
- Create base UI components
- Setup testing infrastructure
- Performance monitoring tools

### Tasks

#### Week 1: Data Models & State Management

**Task 0.1: Core Data Structures**
- [ ] Create TypeScript interfaces for Presentation, Slide, Master, Layout
- [ ] Implement `PresentationManager` class
- [ ] Implement `SlideManager` class
- [ ] Add to existing `src/core/models/` directory
- **Test:** Create/read/update/delete operations
- **Undo:** All CRUD operations undoable
- **Risk:** LOW - No UI dependencies

**Task 0.2: File Serialization**
- [ ] Implement `.story` file format serialization
- [ ] Add slide data to existing `FileStorageManager`
- [ ] Delta compression for saves
- [ ] Asset reference system
- **Test:** Save/load presentations, verify data integrity
- **Undo:** N/A (file operations)
- **Risk:** LOW - Isolated functionality

**Task 0.3: Undo/Redo Extension**
- [ ] Extend existing `HistoryManager` for slide operations
- [ ] Add slide-specific action types
- [ ] Implement composite actions (multi-slide operations)
- **Test:** Undo/redo 20+ consecutive operations
- **Undo:** Meta-test: undo the undo system ;)
- **Risk:** LOW - Extends existing system

#### Week 2: Base UI Components

**Task 0.4: Design System Tokens for Slides**
- [ ] Add slide-specific CSS variables to `styles/modules/variables.css`
- [ ] `--slide-thumbnail-bg`, `--slide-thumbnail-border`, etc.
- [ ] Ensure all tokens support theme switching
- [ ] Test with purple/green accent themes
- **Test:** Theme switch verification
- **Design:** All tokens use existing palette
- **Risk:** LOW - CSS only

**Task 0.5: Slide Thumbnail Component**
- [ ] Create `<SlideThumbnail>` component in `src/ui/components/slides/`
- [ ] Use CSS variables exclusively
- [ ] Support selected/hover states with accent color
- [ ] Canvas-based rendering with caching
- **Test:** Render 100 thumbnails < 2s
- **Design:** Matches panel design language
- **Risk:** LOW - Reusable component

**Task 0.6: Slide Panel Component**
- [ ] Create `<SlidePanel>` component (left sidebar)
- [ ] Virtual scrolling for 100+ slides
- [ ] Drag-and-drop preview
- [ ] Resize handle
- **Test:** Smooth scrolling, no jank
- **Design:** Matches existing panels (layers, components)
- **Risk:** LOW - Standard panel

**Task 0.7: Testing Infrastructure**
- [ ] Add Vitest tests for slide data models
- [ ] Add Playwright E2E tests for slide panel
- [ ] Performance benchmarks with Lighthouse
- **Test:** All tests pass on main branch
- **Risk:** LOW - Test setup

### Deliverables
- ✅ Core data models with TypeScript
- ✅ File serialization working
- ✅ Base UI components themed
- ✅ Undo/redo extended
- ✅ Test coverage > 80%

### Exit Criteria
- Can create/save/load empty presentation
- Slide panel renders with theme support
- All Phase 0 tests passing (unit + E2E)
- Performance benchmarks established

---

## Phase 1: Master Slide System (3 weeks)

### Goals
- Implement slide masters and layouts
- Master editing mode UI
- Placeholder system
- Theme management

### Dependencies
- Phase 0 complete

### Tasks

#### Week 3: Master Data & Logic

**Task 1.1: Master Slide Data Model**
- [ ] Implement `SlideMaster` interface
- [ ] Implement `LayoutMaster` interface
- [ ] Implement `SlideMasterManager` class
- [ ] Master-Layout-Slide inheritance chain
- **Test:** Create master with 3 layouts, verify inheritance
- **Undo:** Create/delete/rename master
- **Risk:** LOW - Data layer only

**Task 1.2: Placeholder System**
- [ ] Implement `Placeholder` interface (10 types)
- [ ] Placeholder rendering logic
- [ ] Content placeholder icon grid
- [ ] Placeholder edit/resize in master mode
- **Test:** Insert all placeholder types, verify behavior
- **Undo:** Add/remove/move placeholders
- **Risk:** MEDIUM - Complex interaction

**Task 1.3: Theme System (Colors/Fonts)**
- [ ] Implement `PresentationTheme` interface
- [ ] 12-color palette system
- [ ] Theme fonts (heading + body)
- [ ] Theme application to masters
- **Test:** Apply theme, verify colors propagate
- **Undo:** Change theme
- **Risk:** LOW - Color mapping

#### Week 4: Master Editor UI

**Task 1.4: Master View Mode**
- [ ] Create `<MasterView>` component
- [ ] Mode toggle button in toolbar
- [ ] Master thumbnail sidebar (left panel)
- [ ] Master canvas (different from slide canvas)
- **Test:** Enter/exit master mode smoothly
- **Design:** Use existing toolbar button style
- **Risk:** MEDIUM - Mode switching complexity

**Task 1.5: Layout Picker UI**
- [ ] Create `<LayoutPicker>` modal component
- [ ] Grid of layout thumbnails
- [ ] Apply layout to selected slides
- [ ] Built-in layouts (10 types)
- **Test:** Change layout, verify content preservation
- **Design:** Use existing modal component
- **Undo:** Change layout
- **Risk:** LOW - UI only

**Task 1.6: Insert Placeholder Tool**
- [ ] Add "Insert Placeholder" dropdown to master toolbar
- [ ] Click-and-drag to create placeholder
- [ ] Placeholder properties panel
- [ ] Visual bounds/handles
- **Test:** Insert 5 placeholders, resize, delete
- **Design:** Matches shape insert tool
- **Undo:** All placeholder operations
- **Risk:** MEDIUM - Interaction complexity

#### Week 5: Theme Management UI

**Task 1.7: Theme Picker UI**
- [ ] Create `<ThemePicker>` modal
- [ ] Theme preview thumbnails
- [ ] Color variant selector
- [ ] Built-in themes (5 themes)
- **Test:** Switch between themes rapidly
- **Design:** Use existing picker pattern
- **Undo:** Apply theme
- **Risk:** LOW - UI only

**Task 1.8: Custom Theme Colors Dialog**
- [ ] Create `<CustomThemeColors>` dialog
- [ ] 12 color inputs with pickers
- [ ] Preview panel
- [ ] Save custom theme
- **Test:** Create custom theme, verify it persists
- **Design:** Use existing color picker
- **Undo:** Create/modify theme
- **Risk:** LOW - Form UI

**Task 1.9: Multiple Masters Support**
- [ ] Add "New Master" button in master view
- [ ] Master management (rename, delete, duplicate)
- [ ] Switch slide to different master
- [ ] Master usage tracking
- **Test:** Create 3 masters, assign slides to each
- **Design:** Use existing + button pattern
- **Undo:** All master management operations
- **Risk:** MEDIUM - Data relationships

### Deliverables
- ✅ Master editing mode functional
- ✅ 10 built-in layouts available
- ✅ Placeholder system working
- ✅ 5 built-in themes + custom themes
- ✅ Multiple masters per presentation

### Exit Criteria
- Can create master with 3 layouts
- Can insert all placeholder types
- Theme changes propagate to all slides
- All Phase 1 tests passing
- Performance: Master change < 200ms

---

## Phase 2: Slide Operations & Navigation (2 weeks)

### Goals
- CRUD operations for slides
- Copy/paste functionality
- Section management
- Keyboard navigation

### Dependencies
- Phase 1 complete

### Tasks

#### Week 6: Slide Operations

**Task 2.1: Create/Duplicate/Delete Slides**
- [ ] Implement slide CRUD operations
- [ ] "New Slide" button with layout picker
- [ ] Duplicate slide (Ctrl+D)
- [ ] Delete slide with confirmation
- **Test:** Create 10 slides, duplicate, delete
- **Undo:** All CRUD operations
- **Risk:** LOW - Standard operations

**Task 2.2: Copy/Cut/Paste Slides**
- [ ] Implement clipboard for slides
- [ ] Copy slide (Ctrl+C)
- [ ] Cut slide (Ctrl+X) with visual feedback
- [ ] Paste slide (Ctrl+V)
- [ ] Cross-presentation paste with master mapping
- **Test:** Copy 5 slides, paste to new presentation
- **Undo:** Paste/cut operations
- **Risk:** MEDIUM - Cross-presentation complexity

**Task 2.3: Slide Reordering**
- [ ] Drag-and-drop slide reordering in thumbnail panel
- [ ] Visual drop indicator
- [ ] Multi-select drag
- [ ] "Move to position" dialog
- **Test:** Reorder 20 slides smoothly (60fps)
- **Design:** Use accent color for drop indicator
- **Undo:** Reorder operation
- **Risk:** LOW - Standard drag-drop

**Task 2.4: Hide/Show Slides**
- [ ] Toggle slide visibility (H key)
- [ ] Visual indicator on thumbnail (eye icon)
- [ ] Skip hidden slides in presentation
- [ ] "Show all hidden slides" command
- **Test:** Hide 3 slides, verify skip in presentation
- **Design:** Use consistent icon library
- **Undo:** Hide/show operation
- **Risk:** LOW - Toggle state

#### Week 7: Sections & Navigation

**Task 2.5: Section Management**
- [ ] Create `Section` data model
- [ ] Add section header to thumbnail panel
- [ ] Create/rename/delete sections
- [ ] Drag slides between sections
- **Test:** Create 3 sections with 5 slides each
- **Undo:** All section operations
- **Risk:** MEDIUM - Hierarchical data

**Task 2.6: Section Collapse/Expand**
- [ ] Collapse section (hide slides)
- [ ] Expand section (show slides)
- [ ] Chevron icon indicator
- [ ] Remember collapsed state
- **Test:** Collapse 2 sections, navigate, verify state persists
- **Design:** Use accent color for section headers
- **Undo:** Not applicable (UI state)
- **Risk:** LOW - Visual state

**Task 2.7: Keyboard Shortcuts**
- [ ] Implement 30+ keyboard shortcuts (see 02-slide-navigation.md)
- [ ] Navigation: Up/Down, Home/End, PgUp/PgDn
- [ ] Selection: Shift+Click, Ctrl+A
- [ ] Editing: Ctrl+M (new), Ctrl+D (duplicate), Delete
- [ ] Keyboard shortcut cheat sheet UI
- **Test:** Verify all shortcuts work consistently
- **Risk:** LOW - Event handling

**Task 2.8: Slide Sorter View**
- [ ] Create `<SlideSorterView>` component
- [ ] Grid layout (4-6 columns)
- [ ] Zoom levels (50%-200%)
- [ ] Responsive grid reflow
- **Test:** Switch to sorter view, reorder slides
- **Design:** Use existing grid pattern
- **Performance:** 100 slides render < 2s
- **Risk:** MEDIUM - Layout complexity

### Deliverables
- ✅ Full slide CRUD with undo
- ✅ Copy/paste working cross-presentation
- ✅ Section management functional
- ✅ Keyboard navigation complete
- ✅ Slide sorter view

### Exit Criteria
- Can create 50 slides in 3 sections
- Copy/paste works between presentations
- All keyboard shortcuts functional
- Slide sorter renders 100 slides < 2s
- All Phase 2 tests passing

---

## Phase 3: Presenter View & Modes (3 weeks)

### Goals
- Presenter view with notes
- Full-screen presentation mode
- Reading view
- Dual-screen support

### Dependencies
- Phase 2 complete

### Tasks

#### Week 8: Presenter Notes

**Task 3.1: Presenter Notes Data Model**
- [ ] Add `notes` field to Slide model (HTML)
- [ ] Rich text editing support
- [ ] Auto-save notes (debounced)
- **Test:** Add notes to 10 slides, verify save
- **Undo:** Edit notes
- **Risk:** LOW - Text field

**Task 3.2: Notes Editor UI**
- [ ] Create `<NotesEditor>` component below canvas
- [ ] Rich text toolbar (bold, italic, underline)
- [ ] Character count
- [ ] Resizable panel
- **Test:** Edit notes with formatting, verify HTML output
- **Design:** Use existing text editor component
- **Undo:** Text editing
- **Risk:** LOW - Reuse existing editor

**Task 3.3: Notes Export**
- [ ] Export notes to PDF (slide + notes)
- [ ] Export notes to plain text
- [ ] Export options dialog
- **Test:** Export 10 slides with notes, verify PDF
- **Risk:** MEDIUM - PDF generation library

#### Week 9: Presentation Modes

**Task 3.4: Full-Screen Presentation Mode**
- [ ] Implement full-screen API
- [ ] HUD (heads-up display) with timer/slide count
- [ ] Auto-hide mouse after 3s
- [ ] Click navigation (left/right sides)
- **Test:** Present 20 slides, verify navigation smooth
- **Design:** Minimal UI, accent color for HUD
- **Performance:** < 50ms slide switch
- **Risk:** LOW - Standard API

**Task 3.5: Reading View**
- [ ] Create `<ReadingView>` component
- [ ] Minimal toolbar at top
- [ ] Navigation controls
- [ ] Exit button
- **Test:** Navigate in reading view, verify no jank
- **Design:** Consistent with app chrome
- **Risk:** LOW - Simple view

**Task 3.6: Presentation Timer**
- [ ] Implement timer (elapsed, countdown, target, pacer)
- [ ] Timer UI in presenter view
- [ ] Alerts at 5min, 1min remaining
- [ ] Restart/pause controls
- **Test:** Run timer for 30min, verify accuracy
- **Design:** Use existing time display patterns
- **Undo:** Not applicable (runtime state)
- **Risk:** LOW - Timer logic

#### Week 10: Presenter View & Dual Screen

**Task 3.7: Presenter View Layout**
- [ ] Create `<PresenterView>` component
- [ ] Current slide (large), next slide (preview)
- [ ] Notes panel
- [ ] Timer and navigation controls
- [ ] Customizable layout
- **Test:** Present with presenter view, verify sync
- **Design:** Consistent panel styling
- **Risk:** MEDIUM - Complex layout

**Task 3.8: Dual-Screen Support**
- [ ] Detect multiple displays
- [ ] Display picker dialog
- [ ] Open presentation on secondary display
- [ ] Sync navigation between screens
- **Test:** Present on dual screen, verify sync
- **Risk:** HIGH - Browser API limitations
- **Fallback:** Single-screen presenter overlay

**Task 3.9: Blank Screen & Pointer Control**
- [ ] Black screen (B key)
- [ ] White screen (W key)
- [ ] Show/hide pointer (A key)
- [ ] Auto-hide pointer after 3s
- **Test:** Toggle blank screens during presentation
- **Risk:** LOW - Simple toggles

### Deliverables
- ✅ Presenter notes with rich text
- ✅ Full-screen presentation mode
- ✅ Presenter view with dual-screen
- ✅ Reading view
- ✅ Timer with multiple modes

### Exit Criteria
- Can present with notes on dual screen
- Full-screen navigation < 50ms
- Timer accurate within 1 second
- All Phase 3 tests passing
- Browser compatibility tested (Chrome, Firefox, Safari)

---

## Phase 4: Comments & Collaboration (4 weeks)

### Goals
- Comments system
- Review workflow
- Version history
- Real-time co-authoring

### Dependencies
- Phase 3 complete
- Backend API for collaboration

### Tasks

#### Week 11: Comments System

**Task 4.1: Comment Data Model**
- [ ] Create `Comment` interface
- [ ] Thread structure (parent/replies)
- [ ] Comment storage in presentation file
- **Test:** Add 20 comments with replies, verify structure
- **Undo:** Add/delete/edit comment
- **Risk:** LOW - Data structure

**Task 4.2: Comments Panel UI**
- [ ] Create `<CommentsPanel>` component
- [ ] Comment list with filtering
- [ ] Resolved/unresolved states
- [ ] Reply threading
- **Test:** Add comments, reply, resolve, filter
- **Design:** Use existing panel component
- **Risk:** LOW - UI list

**Task 4.3: Add Comment UI**
- [ ] Comment button in toolbar
- [ ] Slide-level vs element-level comments
- [ ] Comment indicators on thumbnails
- [ ] Mention system (@username)
- **Test:** Add 10 comments to different elements
- **Design:** Use accent color for comment indicators
- **Undo:** Add comment
- **Risk:** LOW - Modal UI

**Task 4.4: Comment Notifications**
- [ ] In-app notification system
- [ ] Notification for mentions
- [ ] Notification for replies
- [ ] Email notification integration
- **Test:** Mention user, verify notification
- **Risk:** MEDIUM - Notification backend

#### Week 12: Review Workflow

**Task 4.5: Review States**
- [ ] Implement review state machine (Draft → In Review → Approved)
- [ ] State change UI
- [ ] Review request dialog
- **Test:** Send for review, approve, verify state changes
- **Undo:** State changes
- **Risk:** LOW - State enum

**Task 4.6: Review Panel UI**
- [ ] Create `<ReviewPanel>` component
- [ ] Reviewer checklist
- [ ] Progress indicator
- [ ] Complete review button
- **Test:** Complete review as reviewer
- **Design:** Use existing form components
- **Risk:** LOW - Form UI

**Task 4.7: Accept/Reject Changes**
- [ ] Track changes with before/after
- [ ] Review changes UI
- [ ] Accept/reject individual changes
- [ ] Accept/reject all
- **Test:** Make 10 changes, review as second user
- **Undo:** Accept/reject operations
- **Risk:** MEDIUM - Change tracking

#### Week 13: Version History

**Task 4.8: Automatic Versioning**
- [ ] Auto-save versions every 15min
- [ ] Manual save version
- [ ] Version metadata (author, timestamp, label)
- **Test:** Make changes, verify auto-save creates versions
- **Storage:** Incremental deltas for efficiency
- **Risk:** MEDIUM - Delta compression

**Task 4.9: Version History Panel UI**
- [ ] Create `<VersionHistoryPanel>` component
- [ ] Version list with thumbnails
- [ ] Restore version
- [ ] Name/label versions
- **Test:** Restore version 5, verify state
- **Design:** Use existing timeline component pattern
- **Undo:** Restore version creates new version
- **Risk:** LOW - List UI

**Task 4.10: Version Comparison UI**
- [ ] Create `<VersionCompare>` view
- [ ] Side-by-side slide comparison
- [ ] Highlight differences
- [ ] Navigation between differences
- **Test:** Compare version 1 vs version 10
- **Design:** Split-view layout
- **Risk:** MEDIUM - Diff algorithm

#### Week 14: Real-Time Collaboration

**Task 4.11: WebSocket Connection**
- [ ] Setup WebSocket client
- [ ] Presence broadcasting
- [ ] Cursor position sync
- [ ] Edit operation sync
- **Test:** Two users editing simultaneously
- **Risk:** HIGH - Concurrency

**Task 4.12: Conflict Resolution**
- [ ] Operational transformation (OT) implementation
- [ ] Last-write-wins fallback
- [ ] Conflict notification UI
- **Test:** Simultaneous edits to same element
- **Risk:** HIGH - OT complexity

**Task 4.13: Presence Indicators**
- [ ] User avatars in toolbar
- [ ] Remote cursors with name labels
- [ ] User activity indicators (editing, viewing)
- **Test:** 3 users in same presentation
- **Design:** Use accent colors for user cursors
- **Risk:** MEDIUM - Performance with many users

**Task 4.14: Share & Permissions**
- [ ] Share dialog UI
- [ ] Permission levels (Owner, Editor, Commenter, Viewer)
- [ ] Share link generation
- [ ] Permission checks before operations
- **Test:** Share with 3 users with different permissions
- **Security:** Token-based auth, permission validation
- **Risk:** HIGH - Security critical

### Deliverables
- ✅ Full comments system
- ✅ Review workflow functional
- ✅ Version history with restore
- ✅ Real-time co-authoring (basic)
- ✅ Share and permissions

### Exit Criteria
- Comments work on slides and elements
- Review workflow tested with 2 users
- Version history with 50+ versions loads quickly
- 3 users can edit simultaneously without data loss
- All Phase 4 tests passing
- Security audit passed

---

## Phase 5: Animations System (4 weeks)

### Goals
- Animation effects library (50+ effects)
- Animation pane UI
- Text animation (by paragraph, word, letter)
- Motion paths

### Dependencies
- Phase 2 complete (for element selection)

### Tasks

#### Week 15: Animation Data & Engine

**Task 5.1: Animation Data Model**
- [ ] Create `Animation` interface
- [ ] 4 categories: Entrance, Exit, Emphasis, Motion Paths
- [ ] Trigger types: On Click, With Previous, After Previous
- **Test:** Create animations with all trigger types
- **Undo:** Add/remove/reorder animations
- **Risk:** LOW - Data structure

**Task 5.2: Animation Engine Core**
- [ ] Implement `AnimationEngine` class
- [ ] Web Animations API integration
- [ ] Keyframe generation for effects
- [ ] Timing and sequencing logic
- **Test:** Play 10 animations in sequence
- **Performance:** 60fps animation playback
- **Risk:** MEDIUM - Performance critical

**Task 5.3: Basic Effects (20 effects)**
- [ ] Entrance: Fade, Fly In, Zoom, Wipe, Appear (10 effects)
- [ ] Exit: Fade Out, Fly Out, Disappear (5 effects)
- [ ] Emphasis: Pulse, Spin, Grow/Shrink (5 effects)
- **Test:** Apply each effect, verify appearance
- **Performance:** Hardware acceleration (CSS transforms)
- **Risk:** LOW - Standard animations

#### Week 16: Animation Pane UI

**Task 5.4: Animation Pane Component**
- [ ] Create `<AnimationPane>` component (right panel)
- [ ] Animation list with timeline bars
- [ ] Reorder animations via drag-drop
- [ ] Play/pause controls
- **Test:** Add 10 animations, reorder, play
- **Design:** Matches property inspector style
- **Risk:** MEDIUM - Complex UI

**Task 5.5: Add Animation Dialog**
- [ ] Create `<AddAnimation>` modal
- [ ] Effect picker with categories
- [ ] Effect preview
- [ ] Quick add from toolbar
- **Test:** Add all effect types
- **Design:** Use existing modal component
- **Risk:** LOW - Picker UI

**Task 5.6: Effect Options Dialog**
- [ ] Create `<EffectOptions>` dialog
- [ ] Direction picker
- [ ] Duration slider
- [ ] After animation options (dim, hide)
- **Test:** Customize 10 animations
- **Design:** Use existing form controls
- **Undo:** Change effect options
- **Risk:** LOW - Form UI

**Task 5.7: Timing Options Dialog**
- [ ] Create `<TimingOptions>` dialog
- [ ] Start trigger radio buttons
- [ ] Delay input
- [ ] Duration presets + custom
- [ ] Repeat options
- **Test:** Configure complex timing
- **Design:** Consistent form styling
- **Undo:** Change timing
- **Risk:** LOW - Form UI

#### Week 17: Text & Motion Path Animations

**Task 5.8: Text Animation (By Paragraph)**
- [ ] Implement text splitting by paragraph
- [ ] Sequential paragraph animation
- [ ] Stagger delay between paragraphs
- **Test:** Animate 5-paragraph text
- **Performance:** Smooth stagger animation
- **Risk:** MEDIUM - DOM manipulation

**Task 5.9: Text Animation (By Word/Letter)**
- [ ] Implement text splitting by word
- [ ] Implement text splitting by letter (typewriter)
- [ ] Configurable stagger timing
- **Test:** Typewriter effect on 100 letters
- **Performance:** 60fps with many elements
- **Risk:** MEDIUM - Performance with many DOM nodes

**Task 5.10: Motion Paths (Basic)**
- [ ] Implement Line and Arc paths
- [ ] Path preview while drawing
- [ ] Path editing (control points)
- **Test:** Animate object along path
- **Risk:** MEDIUM - Path math

**Task 5.11: Motion Paths (Custom)**
- [ ] Freeform path drawing
- [ ] Bezier curve smoothing
- [ ] Closed vs open paths
- **Test:** Draw complex custom path
- **Risk:** MEDIUM - Path editing UI

#### Week 18: Advanced Animation Features

**Task 5.12: Animation Painter (Copy/Paste)**
- [ ] Copy animations from one element
- [ ] Paste animations to multiple elements
- [ ] Animation painter cursor
- **Test:** Copy animation to 10 elements
- **Undo:** Paste animations
- **Risk:** LOW - Copy operation

**Task 5.13: Animation Timeline View**
- [ ] Timeline scrubber
- [ ] Visual bars showing duration
- [ ] Zoom in/out timeline
- [ ] Scrub to preview
- **Test:** Scrub through 20-second animation
- **Design:** Use accent color for timeline
- **Risk:** MEDIUM - Timeline UI complexity

**Task 5.14: Advanced Effects (30 more effects)**
- [ ] Entrance: Bounce, Spiral, Swirl, Boomerang, etc. (15)
- [ ] Exit: Sink Down, Collapse, Whip Out, etc. (10)
- [ ] Emphasis: Wave, Shimmer, Blink, etc. (5)
- **Test:** Visual verification of all effects
- **Risk:** LOW - More keyframe definitions

**Task 5.15: Performance Optimization**
- [ ] Animation caching
- [ ] GPU acceleration validation
- [ ] Batch simultaneous animations
- [ ] Memory cleanup after animations
- **Test:** 50 animations on single slide play smoothly
- **Performance:** Maintain 60fps
- **Risk:** MEDIUM - Optimization required

### Deliverables
- ✅ 50+ animation effects
- ✅ Animation pane with timeline
- ✅ Text animation (paragraph, word, letter)
- ✅ Motion paths (lines, arcs, custom)
- ✅ Animation painter
- ✅ 60fps animation playback

### Exit Criteria
- All 50+ effects visually verified
- Animation pane renders 100 animations smoothly
- Text animation works with 1000-word document
- Custom motion path drawing functional
- All Phase 5 tests passing
- Performance: 60fps maintained

---

## Phase 6: Advanced Features (3 weeks)

### Goals
- Slide thumbnails with caching
- Slide sizing options
- Grid and guides
- Additional polish features

### Dependencies
- Phase 1 (for masters)
- Phase 2 (for slides)

### Tasks

#### Week 19: Thumbnail Generation & Caching

**Task 6.1: Thumbnail Generator (Web Worker)**
- [ ] Implement thumbnail generation in Web Worker
- [ ] Canvas-based rendering
- [ ] Multiple resolutions (small, medium, large)
- **Test:** Generate 100 thumbnails < 5s
- **Performance:** Use worker to avoid blocking UI
- **Risk:** MEDIUM - Worker communication

**Task 6.2: Thumbnail Cache System**
- [ ] Implement LRU cache for thumbnails
- [ ] IndexedDB persistence
- [ ] Lazy loading on scroll
- **Test:** Load 500 slides, verify lazy loading
- **Performance:** < 100ms per thumbnail
- **Risk:** LOW - Caching strategy

**Task 6.3: Thumbnail Updates**
- [ ] Detect slide changes
- [ ] Invalidate cache on edit
- [ ] Progressive rendering (low-res → high-res)
- **Test:** Edit slide, verify thumbnail updates
- **Risk:** LOW - Change detection

#### Week 20: Slide Sizing & Grid System

**Task 6.4: Slide Size Options**
- [ ] Standard (4:3), Widescreen (16:9), Widescreen (16:10)
- [ ] Custom dimensions dialog
- [ ] Portrait orientation
- [ ] Slide size migration (resize all slides)
- **Test:** Create presentation in 4:3, convert to 16:9
- **Undo:** Change slide size
- **Risk:** MEDIUM - Content reflow

**Task 6.5: Grid System**
- [ ] Configurable grid (spacing, subdivisions)
- [ ] Grid visibility toggle
- [ ] Snap to grid option
- [ ] Grid settings persist
- **Test:** Enable grid, snap elements
- **Design:** Use subtle grid lines
- **Risk:** LOW - Visual overlay

**Task 6.6: Ruler & Guides**
- [ ] Horizontal and vertical rulers
- [ ] Drag to create guides
- [ ] Snap to guides
- [ ] Smart guides (alignment)
- **Test:** Create 5 guides, align elements
- **Design:** Match canvas ruler style
- **Risk:** LOW - Overlay UI

**Task 6.7: Alignment Tools**
- [ ] Align left, center, right, top, middle, bottom
- [ ] Distribute horizontally/vertically
- [ ] Align to slide vs align to selection
- **Test:** Align 10 elements
- **Undo:** Alignment operations
- **Risk:** LOW - Math calculations

#### Week 21: Additional Features

**Task 6.8: Slide Background Options**
- [ ] Solid fill
- [ ] Gradient fill (linear, radial)
- [ ] Picture fill
- [ ] Texture fill
- [ ] Format background panel
- **Test:** Apply each background type
- **Design:** Use existing color/gradient pickers
- **Undo:** Change background
- **Risk:** LOW - Reuse existing fills

**Task 6.9: Header & Footer System**
- [ ] Header/footer settings dialog
- [ ] Date/time placeholder (auto-update)
- [ ] Slide number placeholder
- [ ] Footer text placeholder
- [ ] "Don't show on title slide" option
- **Test:** Enable footer, verify on all slides except title
- **Undo:** Header/footer changes
- **Risk:** LOW - Placeholder system

**Task 6.10: Slide Library (Reusable Slides)**
- [ ] Browse slides from other presentations
- [ ] Import selected slides
- [ ] Keep vs update formatting
- [ ] Recently used presentations
- **Test:** Import 5 slides from another presentation
- **Risk:** MEDIUM - Cross-presentation operations

**Task 6.11: Format Painter**
- [ ] Copy formatting from element
- [ ] Apply to single element
- [ ] Apply to multiple elements (lock painter)
- [ ] Visual painter cursor
- **Test:** Copy format to 10 elements
- **Undo:** Apply format
- **Risk:** LOW - Copy properties

### Deliverables
- ✅ Thumbnail generation with caching
- ✅ Slide size options (4:3, 16:9, 16:10, custom)
- ✅ Grid and guides system
- ✅ Alignment tools
- ✅ Header/footer system
- ✅ Format painter

### Exit Criteria
- 100 thumbnails generate in < 5s
- Slide size change works without breaking content
- Grid and guides functional
- All Phase 6 tests passing
- Performance: Thumbnail cache hit rate > 90%

---

## Phase 7: Transitions (Basic) (2 weeks)

### Goals
- Basic slide transitions (10 effects)
- Transition settings UI
- Transition preview
- Apply to all slides

### Dependencies
- Phase 2 complete (for slides)

### Tasks

#### Week 22: Basic Transitions

**Task 7.1: Transition Data Model**
- [ ] Create `SlideTransition` interface
- [ ] Transition types: None, Fade, Push, Wipe, Cover, Zoom
- [ ] Duration and easing options
- [ ] Direction options (left, right, up, down)
- **Test:** Apply transitions to 10 slides
- **Undo:** Change transition
- **Risk:** LOW - Data structure

**Task 7.2: Transition Engine**
- [ ] Implement transition playback
- [ ] CSS-based transitions for performance
- [ ] Transition between slides in presentation mode
- **Test:** Play transitions in full-screen mode
- **Performance:** Smooth 60fps transitions
- **Risk:** LOW - CSS animations

**Task 7.3: Basic Transition Effects (10)**
- [ ] None (cut)
- [ ] Fade
- [ ] Push (4 directions)
- [ ] Wipe (4 directions)
- [ ] Cover/Uncover (4 directions)
- [ ] Zoom In/Out
- **Test:** Visual verification of each effect
- **Risk:** LOW - Standard transitions

**Task 7.4: Transition Settings UI**
- [ ] Create `<TransitionSettings>` panel
- [ ] Effect dropdown
- [ ] Duration slider
- [ ] Direction selector
- [ ] Preview button
- **Test:** Configure transitions, preview
- **Design:** Matches effect options panel
- **Undo:** Change transition
- **Risk:** LOW - Settings UI

#### Week 23: Transition Features

**Task 7.5: Transition Preview**
- [ ] Preview in thumbnail
- [ ] Full-size preview on canvas
- [ ] Scrub through transition
- **Test:** Preview 5 different transitions
- **Risk:** LOW - Playback control

**Task 7.6: Apply to All Slides**
- [ ] "Apply to all" checkbox
- [ ] Confirmation dialog
- [ ] Bulk transition update
- **Test:** Apply fade to 50 slides
- **Undo:** Bulk apply
- **Risk:** LOW - Batch operation

**Task 7.7: Transition Sound Effects (Optional)**
- [ ] Sound effect library (10 sounds)
- [ ] Volume control
- [ ] Sound preview
- **Test:** Add sound to transition
- **Risk:** LOW - Audio playback

**Task 7.8: Random Transition (Optional)**
- [ ] Random transition option
- [ ] Exclude certain effects from random pool
- **Test:** Present with random transitions
- **Risk:** LOW - Random selection

### Deliverables
- ✅ 10 basic transition effects
- ✅ Transition settings panel
- ✅ Transition preview
- ✅ Apply to all functionality
- ✅ Smooth 60fps transitions

### Exit Criteria
- All 10 transitions work smoothly
- Transition settings easy to configure
- Preview functional
- All Phase 7 tests passing
- Performance: Transitions run at 60fps

**Note:** Advanced transitions (Morph, 3D effects) deferred to future phases.

---

## Phase 8: Polish & Optimization (2 weeks)

### Goals
- Performance optimization
- Accessibility improvements
- Bug fixes
- Documentation
- Launch preparation

### Dependencies
- All previous phases complete

### Tasks

#### Week 24: Performance & Optimization

**Task 8.1: Performance Audit**
- [ ] Run Lighthouse on all views
- [ ] Identify performance bottlenecks
- [ ] Optimize slow operations
- **Target:** All operations meet benchmarks
- **Risk:** LOW - Measurement

**Task 8.2: Bundle Size Optimization**
- [ ] Code splitting by feature
- [ ] Lazy load heavy features (animations, collaboration)
- [ ] Tree shaking
- **Target:** Initial bundle < 200KB gzipped
- **Risk:** LOW - Build optimization

**Task 8.3: Memory Leak Detection**
- [ ] Profile memory usage
- [ ] Fix any leaks (event listeners, timers)
- [ ] Test long-running sessions (1 hour+)
- **Target:** No memory growth over time
- **Risk:** MEDIUM - Debugging required

**Task 8.4: Rendering Optimization**
- [ ] Virtual scrolling validation
- [ ] Canvas caching validation
- [ ] Minimize reflows/repaints
- **Target:** 60fps maintained at all times
- **Risk:** LOW - Verification

#### Week 25: Accessibility & Polish

**Task 8.5: Accessibility Audit**
- [ ] WCAG AA compliance check
- [ ] Keyboard navigation verification
- [ ] Screen reader testing (NVDA, JAWS)
- [ ] Focus indicators on all interactive elements
- **Target:** WCAG AA compliance
- **Risk:** MEDIUM - Remediation work

**Task 8.6: Keyboard Shortcut Coverage**
- [ ] Verify all 50+ shortcuts work
- [ ] Keyboard shortcut cheat sheet
- [ ] Shortcut conflicts resolution
- **Test:** Navigate entire app with keyboard only
- **Risk:** LOW - Testing

**Task 8.7: Error Handling & Empty States**
- [ ] Add error boundaries
- [ ] User-friendly error messages
- [ ] Empty state designs (no slides, no animations, etc.)
- [ ] Offline mode handling
- **Test:** Force errors, verify graceful degradation
- **Risk:** LOW - UI polish

**Task 8.8: Browser Compatibility**
- [ ] Test on Chrome, Firefox, Safari, Edge
- [ ] Mobile browser testing (iOS Safari, Android Chrome)
- [ ] Fallbacks for unsupported features
- **Target:** Works on latest 2 versions of major browsers
- **Risk:** MEDIUM - Cross-browser issues

**Task 8.9: Documentation**
- [ ] User guide for slide features
- [ ] Developer documentation
- [ ] API documentation
- [ ] Keyboard shortcut reference
- **Risk:** LOW - Writing

**Task 8.10: Final Bug Fixes**
- [ ] Triage and fix P0/P1 bugs
- [ ] Regression testing
- [ ] UAT (user acceptance testing)
- **Target:** Zero P0 bugs, < 5 P1 bugs
- **Risk:** MEDIUM - Bug volume

### Deliverables
- ✅ Performance benchmarks met
- ✅ WCAG AA compliance
- ✅ Browser compatibility verified
- ✅ Documentation complete
- ✅ All P0 bugs fixed

### Exit Criteria
- Lighthouse score > 90
- All benchmarks met
- WCAG AA compliant
- Works on 4 major browsers
- Zero P0 bugs
- All tests passing (unit + E2E + integration)
- Ready for production release

---

## Testing Strategy

### Unit Tests (Vitest)
- Data models (Presentation, Slide, Master, Layout, etc.)
- Business logic (SlideManager, AnimationEngine, etc.)
- Utility functions
- **Target:** > 80% code coverage

### Integration Tests (Vitest)
- Master-Layout-Slide inheritance
- Animation sequencing
- Undo/redo operations
- File serialization
- **Target:** All critical paths tested

### E2E Tests (Playwright)
- User workflows (create presentation, add slides, present)
- Keyboard navigation
- Collaboration (multi-user scenarios)
- Cross-browser compatibility
- **Target:** 30+ E2E test scenarios

### Performance Tests (Lighthouse + Custom)
- Slide switch time < 50ms
- Thumbnail render < 100ms
- 100 slides load < 2s
- Animation playback 60fps
- Memory usage stable

### Accessibility Tests
- axe DevTools automated scan
- Manual keyboard navigation
- Screen reader testing (NVDA, JAWS)
- WCAG AA compliance

### Security Tests
- Input sanitization
- XSS prevention
- Permission checks
- Audit log verification

---

## Risk Mitigation

### High-Risk Areas

**1. Real-Time Collaboration (Phase 4)**
- **Risk:** Conflict resolution complexity, data loss
- **Mitigation:**
  - Start with simple last-write-wins
  - Add OT incrementally
  - Extensive multi-user testing
  - Auto-save every 10 seconds
  - Version history as safety net

**2. Animation Performance (Phase 5)**
- **Risk:** Janky animations, dropped frames
- **Mitigation:**
  - Use CSS transforms (GPU accelerated)
  - Limit simultaneous animations
  - Profiling with Chrome DevTools
  - Fallback to simpler effects on low-end devices

**3. Browser Compatibility (Phase 8)**
- **Risk:** Features not working on Safari/Firefox
- **Mitigation:**
  - Progressive enhancement
  - Polyfills for missing APIs
  - Feature detection with fallbacks
  - Cross-browser testing throughout

**4. Dual-Screen Support (Phase 3)**
- **Risk:** Limited browser API support
- **Mitigation:**
  - Fallback to single-screen presenter overlay
  - Clear messaging about requirements
  - Test on different OS/browser combinations

### Medium-Risk Areas

**1. Thumbnail Generation Performance (Phase 6)**
- **Risk:** Slow thumbnail rendering
- **Mitigation:**
  - Web Workers for off-main-thread rendering
  - Progressive rendering (low-res first)
  - Aggressive caching
  - Virtual scrolling

**2. File Size Growth (All Phases)**
- **Risk:** Large presentation files
- **Mitigation:**
  - Delta compression for versions
  - Asset deduplication
  - Lazy loading of media
  - External asset references

**3. Undo/Redo Complexity (All Phases)**
- **Risk:** Undo breaking state
- **Mitigation:**
  - Comprehensive undo tests
  - State snapshots for complex operations
  - Undo limit (50 operations)
  - Clear undo stack on certain actions

---

## Design System Integration Checklist

**Every new component must:**
- [ ] Use CSS variables from `styles/modules/variables.css`
- [ ] Support theme switching (test with purple/green accents)
- [ ] Work in dark and light modes
- [ ] Use existing components where possible
- [ ] Match visual language of similar components
- [ ] No inline styles
- [ ] No hardcoded colors

**Theme Switch Test:**
```javascript
// Before merging, test this sequence:
1. Switch accent color: Blue → Purple → Green → Orange
2. Toggle dark/light mode for each
3. Verify all interactions use new accent color:
   - Hover states
   - Active states
   - Selected states
   - Focus rings
4. No hardcoded colors should remain
```

**Visual Consistency Map:**
| New Component | Matches Design Of |
|---------------|-------------------|
| Slide Panel | Layers Panel |
| Animation Pane | Property Inspector |
| Master View Toolbar | Main Toolbar |
| Layout Picker | Component Picker |
| Comments Panel | Activity Panel |
| Version History | File History |
| Theme Picker | Color Picker |
| Transition Settings | Effect Options |

---

## Performance Benchmarks

**Mandatory Targets:**
| Operation | Target | Test Method |
|-----------|--------|-------------|
| Slide switch | < 50ms | Lighthouse, manual timing |
| Thumbnail render | < 100ms | Chrome DevTools profiler |
| Master change | < 200ms | Manual timing with 50 slides |
| Animation playback | 60fps | requestAnimationFrame counter |
| 100 slides load | < 2s | Lighthouse, manual timing |
| Search 1000 slides | < 500ms | Manual timing |
| Undo operation | < 30ms | Manual timing |
| Redo operation | < 30ms | Manual timing |

**Performance Testing Script:**
```javascript
// Run this before each phase release
async function performanceBenchmark() {
  // Test 1: Slide switch time
  const start = performance.now();
  await slideManager.switchToSlide(slideId);
  const switchTime = performance.now() - start;
  console.assert(switchTime < 50, `Slide switch too slow: ${switchTime}ms`);
  
  // Test 2: Thumbnail render
  const thumbStart = performance.now();
  await thumbnailGenerator.generateThumbnail(slideId);
  const thumbTime = performance.now() - thumbStart;
  console.assert(thumbTime < 100, `Thumbnail render too slow: ${thumbTime}ms`);
  
  // Test 3: Load 100 slides
  const loadStart = performance.now();
  await presentation.loadSlides(100);
  const loadTime = performance.now() - loadStart;
  console.assert(loadTime < 2000, `Load too slow: ${loadTime}ms`);
  
  // Test 4: Animation FPS
  let frameCount = 0;
  const fpsStart = performance.now();
  function countFrames() {
    frameCount++;
    if (performance.now() - fpsStart < 1000) {
      requestAnimationFrame(countFrames);
    } else {
      console.assert(frameCount >= 55, `FPS too low: ${frameCount}`);
    }
  }
  requestAnimationFrame(countFrames);
}
```

---

## Security Checklist

**Every feature must:**
- [ ] Sanitize user input (text, URLs, file names)
- [ ] Prevent XSS attacks (no `innerHTML` with user content)
- [ ] Validate permissions before operations
- [ ] Use HTTPS for all API calls
- [ ] Implement CSRF protection
- [ ] Rate limit API requests
- [ ] Audit log for sensitive operations (delete, share, export)
- [ ] Encrypt sensitive data at rest

**Security Review Points:**
- Before Phase 4 (Collaboration): Review permission system
- Before Phase 7 (Transitions): Review asset loading (XSS risk)
- Before Phase 8 (Launch): Full security audit

---

## Success Criteria

**Phase-by-Phase:**
- Each phase has exit criteria (see above)
- All tests passing before moving to next phase
- Performance benchmarks met
- Design system compliance verified
- Undo/redo working for all operations

**Overall Launch Criteria:**
- All 8 phases complete
- 500+ unit tests passing
- 30+ E2E tests passing
- Lighthouse score > 90
- WCAG AA compliant
- Works on 4 major browsers (Chrome, Firefox, Safari, Edge)
- Zero P0 bugs, < 5 P1 bugs
- User documentation complete
- Developer documentation complete
- Security audit passed
- Performance benchmarks met

---

## Timeline & Resources

**Total Duration:** 25 weeks (6 months)

**Team Composition (Suggested):**
- 2 Frontend Engineers (full-time)
- 1 Backend Engineer (50% for collaboration features)
- 1 Designer (30% for UI reviews)
- 1 QA Engineer (50% for testing)

**Milestones:**
- **Month 1:** Phases 0-1 complete (Foundation + Masters)
- **Month 2:** Phases 2-3 complete (Operations + Presenter View)
- **Month 3:** Phase 4 complete (Collaboration)
- **Month 4:** Phase 5 complete (Animations)
- **Month 5:** Phase 6-7 complete (Advanced Features + Transitions)
- **Month 6:** Phase 8 complete (Polish + Launch)

**Review Cadence:**
- Weekly: Progress review, risk assessment
- End of Phase: Demo, performance review, design review
- Month 3: Mid-project review (collaboration ready?)
- Month 6: Launch readiness review

---

## Future Phases (Post-Launch)

**Phase 9: Advanced Transitions (1 month)**
- Morph transition (intelligent object animation)
- 3D transitions (Cube, Flip, Rotate)
- Dissolve, Origami, Fracture
- Transition preview improvements

**Phase 10: Slide Zoom (2 weeks)**
- Slide zoom, section zoom, summary zoom
- Interactive navigation
- Zoom transition effects

**Phase 11: Design Assistant (3 weeks)**
- AI-powered design suggestions
- Layout recommendations
- Color scheme suggestions
- Image placement optimization

**Phase 12: SmartArt & Diagrams (4 weeks)**
- SmartArt layouts (process, hierarchy, relationship, etc.)
- Diagram editor
- Convert text to SmartArt
- Custom diagram templates

**Phase 13: Media Management (2 weeks)**
- Video editing tools (trim, fade, bookmarks)
- Audio editing (trim, fade in/out)
- Media compression
- Media library

**Phase 14: Export & Print (2 weeks)**
- PowerPoint (.pptx) export
- PDF export with notes
- Handout master
- Notes master
- Print settings

**Phase 15: Advanced Features (4 weeks)**
- Equation editor (LaTeX)
- Action buttons and hyperlinks
- Rehearse timings with auto-save
- Compare presentations
- Package presentation (with fonts/media)

---

## Appendix: Principles Compliance Matrix

| Phase | Small Increments | Design System | Performance | Undo/Redo | Security | Collaboration | File Format |
|-------|------------------|---------------|-------------|-----------|----------|---------------|-------------|
| 0 | ✅ Data models only | ✅ CSS variables | ✅ Benchmarks set | ✅ Extended | ✅ Input validation | ✅ Data structure | ✅ Serialization |
| 1 | ✅ Masters per week | ✅ Theme tokens | ✅ < 200ms propagate | ✅ All ops | ✅ Safe HTML | ✅ Master sharing | ✅ Masters serialized |
| 2 | ✅ CRUD then sections | ✅ Accent colors | ✅ < 50ms switch | ✅ All ops | ✅ Sanitize input | ✅ Section sync | ✅ Sections serialized |
| 3 | ✅ Notes then modes | ✅ Minimal UI | ✅ < 50ms present | ✅ Notes edits | ✅ Notes sanitized | ✅ Notes sync | ✅ Notes in file |
| 4 | ✅ Comments then collab | ✅ Panels match | ✅ Optimistic UI | ✅ Comments | ✅ CRITICAL | ✅ CORE FEATURE | ✅ Comments delta |
| 5 | ✅ 20 effects then 50 | ✅ Timeline accent | ✅ 60fps MANDATORY | ✅ Add/remove | ✅ Safe effects | ✅ Animation sync | ✅ Animations array |
| 6 | ✅ Thumbnails first | ✅ Grid subtle | ✅ < 100ms thumb | ✅ Size/align | ✅ Asset URLs | ✅ Thumbnails shared | ✅ Settings persist |
| 7 | ✅ 10 basic only | ✅ Settings panel | ✅ 60fps MANDATORY | ✅ Transition change | ✅ Safe CSS | ✅ Transitions sync | ✅ Transition object |
| 8 | ✅ Audit then fix | ✅ Consistency check | ✅ Final validation | ✅ Final test | ✅ Final audit | ✅ Final test | ✅ Migration test |

---

**Next Steps:**
1. Review and approve this plan
2. Setup project board with all tasks
3. Assign Phase 0 tasks to team
4. Begin implementation Week 1

---

**Document Status:** READY FOR REVIEW  
**Approval Required:** Product Manager, Engineering Lead, Design Lead  
**Tracking:** This document will be the source of truth for implementation progress
