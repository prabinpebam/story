# Cloud File Browser UX Specification

## Overview

This document defines the user experience for the cloud file browser, used when opening or saving files to OneDrive or Google Drive.

## Current Issues

1. **No sidebar navigation** - Users can't quickly access common locations (Recent, My Files, Shared with me)
2. **Poor visual hierarchy** - Files and folders look too similar, no thumbnails
3. **No search** - Users must manually navigate to find files
4. **No file preview** - Can't preview file contents before opening
5. **No sorting/filtering options** - Files always sorted alphabetically
6. **Breadcrumb issues** - Back button isn't intuitive, can't click breadcrumb segments
7. **No "New folder" option** in save mode
8. **No file size display** - Important for understanding what you're opening
9. **No keyboard navigation** - Can't use arrow keys to navigate
10. **No recent files section** - Users often want to access recently opened files
11. **Modal too tall** - Content area can exceed screen height on smaller screens

## Design Goals

1. **Familiar** - Follow conventions from OneDrive web, Finder, Windows Explorer
2. **Fast** - Quick access to common locations, search, recent files
3. **Clear** - Strong visual hierarchy, file type icons, thumbnails where possible
4. **Accessible** - Full keyboard navigation, screen reader support
5. **Responsive** - Works well on different screen sizes

---

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │  [OneDrive icon] Open from OneDrive                           [×]  │ │ ← Header
│ └─────────────────────────────────────────────────────────────────────┘ │
│ ┌───────────┬─────────────────────────────────────────────────────────┐ │
│ │           │  ┌──────────────────────────────────────────────────┐  │ │
│ │  QUICK    │  │ [🔍] Search files...                             │  │ │ ← Search bar
│ │  ACCESS   │  └──────────────────────────────────────────────────┘  │ │
│ │           │  ┌──────────────────────────────────────────────────┐  │ │
│ │  ⏱ Recent │  │ ← Back   My Files > Projects > Story            │  │ │ ← Breadcrumb
│ │  📁 My Files│  └──────────────────────────────────────────────────┘  │ │
│ │  👥 Shared │  ┌────────────┬────────────┬────────────┬──────────┐  │ │
│ │           │  │ Name ▲     │ Modified   │ Size       │          │  │ │ ← Column headers
│ │           │  ├────────────┴────────────┴────────────┴──────────┤  │ │
│ │           │  │ 📁 Presentations                      Today     │  │ │
│ │           │  │ 📁 Templates                          Dec 28    │  │ │
│ │  ─────────│  │ 📄 Pitch-deck.str         1.2 MB     Dec 27    │  │ │ ← File list
│ │           │  │ 📄 Quarterly-review.str   890 KB     Dec 20    │  │ │
│ │  STORAGE  │  │ 📄 Product-demo.str       2.1 MB     Dec 15    │  │ │
│ │  ━━━━━━━━ │  │                                                 │  │ │
│ │  4.2 GB   │  │                                                 │  │ │
│ │  used     │  │                                                 │  │ │
│ │           │  │                                                 │  │ │
│ └───────────┴─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │  ● Pitch-deck.str                      [Cancel]  [Open]            │ │ ← Footer
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Component Specifications

### 1. Header

- **Title**: "Open from OneDrive" / "Save to OneDrive" (or Google Drive)
- **Provider icon**: OneDrive or Google Drive logo (24×24)
- **Close button**: × icon, positioned right

### 2. Sidebar (Left Panel)

#### Quick Access Section
| Item | Icon | Description |
|------|------|-------------|
| Recent | `clock` | Recently opened .str files (last 10) |
| My Files | `folder` | Root of user's drive |
| Shared with me | `users` | Files shared by others |

#### Storage Info
- Progress bar showing used/total storage
- Text: "X.X GB of Y GB used"
- Only shown if API provides this data

**Sidebar Width**: 180px fixed

### 3. Search Bar

- Placeholder: "Search files..."
- Icon: Magnifying glass (left)
- Clear button: × (right, appears when text entered)
- Searches current folder and subfolders
- Debounced input (300ms)
- Shows "Searching..." indicator while loading

### 4. Toolbar / Breadcrumb Bar

#### Navigation
- **Back button**: ← icon + "Back" text, disabled when at root
- **Forward button**: → icon, disabled when no forward history

#### Breadcrumb
- Each segment is clickable
- Current folder is bold
- Segments separated by "›" chevron
- Truncates middle segments on overflow (e.g., "My Files > ... > Current")
- Root always shows provider name: "OneDrive" or "Google Drive"

#### View Toggle (right side)
- List view icon (default)
- Grid view icon
- Persisted in localStorage

### 5. Column Headers (List View)

| Column | Width | Sortable | Default Sort |
|--------|-------|----------|--------------|
| Name | flex | Yes | Ascending |
| Modified | 120px | Yes | - |
| Size | 80px | Yes | - |

- Click column header to sort
- Arrow indicator shows sort direction
- Folders always sorted before files

### 6. File List

#### List View Item
```
┌──────────────────────────────────────────────────────────────────┐
│ [Icon] [Name.................................] [Modified] [Size] │
│  24px   flex                                    120px      80px  │
└──────────────────────────────────────────────────────────────────┘
```

#### Grid View Item
```
┌─────────────┐
│ ┌─────────┐ │
│ │ Preview │ │  120 × 90px thumbnail
│ │  /Icon  │ │
│ └─────────┘ │
│  File name  │  Truncated with ellipsis
│  Dec 27     │  Muted text
└─────────────┘
  Width: 140px
```

#### File Icons
| Type | Icon | Color |
|------|------|-------|
| Folder | `fa-folder` | #FFB900 (yellow) |
| .str file | Custom Story icon | Brand color |
| Other files | `fa-file` | Gray (dimmed) |

#### States
- **Default**: Normal appearance
- **Hover**: Light background highlight
- **Selected**: Accent color background, white text
- **Disabled**: 50% opacity (non-.str files in open mode)

### 7. Footer

#### Left Side (Selection Info)
- Open mode: "Selected: **filename.str**" or "No file selected"
- Save mode: Filename input with .str extension

#### Right Side (Actions)
- **Cancel button**: Secondary style
- **Confirm button**: Primary style, "Open" or "Save"
  - Disabled until valid selection/input

#### Save Mode Footer
```
┌─────────────────────────────────────────────────────────────────────┐
│ File name: [                    ].str   [New Folder] [Cancel] [Save]│
└─────────────────────────────────────────────────────────────────────┘
```

---

## Interactions

### Navigation

| Action | Behavior |
|--------|----------|
| Click folder | Navigate into folder |
| Double-click folder | Navigate into folder |
| Click file | Select file |
| Double-click file | Select and confirm |
| Click breadcrumb segment | Navigate to that folder |
| Click Back | Go to previous folder |
| Press Backspace | Go to parent folder |

### Keyboard Navigation

| Key | Action |
|-----|--------|
| ↑ / ↓ | Move selection |
| Enter | Open folder / Confirm selection |
| Backspace | Go to parent folder |
| ⌘/Ctrl + F | Focus search |
| Escape | Close modal or clear search |
| Tab | Move between sections |

### Drag and Drop (Future)
- Drag files to folder to move
- Drag files to sidebar locations

---

## Empty States

### No Files Found
```
    📁
  ┌─────┐
  │     │
  └─────┘
  
No .str files in this folder
Create a new presentation or navigate to another folder.
```

### Search No Results
```
    🔍
    
No results for "query"
Try a different search term.
```

### Not Signed In
```
    ☁️
    
Sign in to access your files

Connect your Microsoft account to browse
and open files from OneDrive.

[🪟 Sign in with Microsoft]
```

---

## Loading States

### Initial Load
- Skeleton loaders for file list (8 items)
- Sidebar shows static items
- Search input disabled

### Navigation Load
- Show spinner in content area
- Keep breadcrumb visible
- Previous content hidden

### Search Load
- Show "Searching..." text below search input
- Keep previous results visible but dimmed

---

## Error States

### Network Error
```
    ⚠️
    
Couldn't load files
Check your internet connection and try again.

[Retry]
```

### Permission Error
```
    🔒
    
You don't have access to this folder
Request access from the owner or choose a different location.
```

---

## Responsive Design

### < 600px (Mobile)
- Sidebar collapses to icons only
- Grid view uses 2 columns
- Footer stacks vertically

### 600-900px (Tablet)
- Sidebar 160px
- List view hides Size column
- Grid view uses 4 columns

### > 900px (Desktop)
- Full layout as shown
- Grid view uses 5-6 columns

---

## Animation

| Action | Animation |
|--------|-----------|
| Modal open | Scale 0.95 → 1.0, Opacity 0 → 1, Duration: 200ms |
| Modal close | Scale 1.0 → 0.95, Opacity 1 → 0, Duration: 150ms |
| Folder navigation | Slide left/right, Duration: 200ms |
| Loading spinner | Rotate, Duration: 800ms linear |
| Selection highlight | Background color transition, Duration: 150ms |

---

## Technical Considerations

### Caching
- Cache folder contents for 5 minutes
- Invalidate on navigation back
- Show "last updated" indicator if stale

### Pagination
- Load 50 items per request
- Infinite scroll or "Load more" button
- Show loading indicator at bottom

### Search
- Client-side search for current folder
- API search for global search (if available)
- Highlight matching text in results

### File Type Detection
- Use file extension primarily
- Fall back to MIME type if available
- Show generic icon for unknown types

---

## Accessibility

- All interactive elements focusable
- ARIA labels for icons and buttons
- Announce navigation changes to screen readers
- High contrast mode support
- Reduced motion support

---

## Implementation Phases

### Phase 1: Core Redesign
- [ ] New layout with sidebar
- [ ] Improved file list with columns
- [ ] Click-able breadcrumb segments
- [ ] Column sorting
- [ ] Better visual hierarchy

### Phase 2: Enhanced Features
- [ ] Search functionality
- [ ] Grid view option
- [ ] Recent files section
- [ ] Storage info display

### Phase 3: Polish
- [ ] Keyboard navigation
- [ ] Animations and transitions
- [ ] Loading skeletons
- [ ] Error states

### Phase 4: Advanced (Future)
- [ ] File preview panel
- [ ] Drag and drop
- [ ] Context menu (right-click)
- [ ] Multi-select
