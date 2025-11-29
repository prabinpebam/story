# App Menu - UX Specification

## Overview

The App Menu is the primary navigation hub accessed via the Story logo in the sidebar header. It provides comprehensive access to all application functionality through a hierarchical dropdown menu system.

**Related Specifications:**
- [Design System Variables](../../plans/design-token-standardization-plan.md)
- [File Format & Storage](../storage/file-format-storage.md)

---

## 1. Visual Design

### 1.1 Trigger Button

The menu trigger consists of the Story logo and application name:

```
┌─────────────────────────────────────────┐
│  [Logo]  STORY                     ▼    │
│   24px   12px semibold                  │
└─────────────────────────────────────────┘
```

**Specifications:**
- Logo: 24x24px (`assets/story.png`)
- Text: "STORY" in `--font-size-lg` (13px), `--font-weight-semibold`
- Gap between logo and text: `--spacing-2` (8px)
- Dropdown indicator: Small chevron, `--color-text-tertiary`
- Padding: `--spacing-2` horizontal, `--spacing-1` vertical
- Border-radius: `--radius-md`
- Hover: `--color-bg-hover`
- Active/Open: `--color-bg-active` with accent tint

### 1.2 Dropdown Menu

The dropdown appears below the trigger with a subtle animation:

```
┌────────────────────────────────────────┐
│  [Logo]  STORY  ▼                      │
├────────────────────────────────────────┤
│ ┌────────────────────────────────────┐ │
│ │  📄  New Presentation    ⌘N       │ │
│ │  📂  Open...             ⌘O       │ │
│ │  📥  Open Recent         ▸         │ │
│ │  ────────────────────────────────  │ │
│ │  💾  Save                ⌘S       │ │
│ │  💾  Save As...          ⌘⇧S      │ │
│ │  📤  Export              ▸         │ │
│ │  ────────────────────────────────  │ │
│ │  ✂️  Edit                ▸         │ │
│ │  👁  View                ▸         │ │
│ │  🎞  Slide               ▸         │ │
│ │  ────────────────────────────────  │ │
│ │  ⚙️  Settings...         ⌘,       │ │
│ │  ❓  Help                ▸         │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

**Menu Specifications:**
- Width: 240px minimum, auto-expand for content
- Background: `--color-bg-elevated`
- Border: 1px `--color-border`
- Border-radius: `--radius-lg`
- Shadow: `--shadow-lg`
- Padding: `--spacing-1` top/bottom

**Menu Item Specifications:**
- Height: 32px
- Padding: `--spacing-3` horizontal
- Font: `--font-size-md` (12px)
- Icon: 16px, `--spacing-3` gap from text
- Shortcut: Right-aligned, `--color-text-tertiary`, `--font-size-sm`
- Hover: `--color-bg-hover`
- Active: `--color-bg-active`
- Submenu indicator: Chevron right icon

---

## 2. Information Architecture

### 2.1 Complete Menu Structure

```
STORY Menu
├── File
│   ├── New Presentation        ⌘N
│   ├── Open...                 ⌘O
│   ├── Open Recent             ▸
│   │   ├── [Recent File 1]
│   │   ├── [Recent File 2]
│   │   ├── [Recent File 3]
│   │   ├── ──────────────
│   │   └── Clear Recent
│   ├── ──────────────────
│   ├── Save                    ⌘S
│   ├── Save As...              ⌘⇧S
│   ├── Save to Cloud           ▸
│   │   ├── OneDrive
│   │   └── Google Drive
│   ├── ──────────────────
│   ├── Export                  ▸
│   │   ├── PDF...
│   │   ├── PNG Images...
│   │   ├── JPEG Images...
│   │   └── HTML...
│   ├── ──────────────────
│   ├── Close Presentation
│   └── ──────────────────
│
├── Edit
│   ├── Undo                    ⌘Z
│   ├── Redo                    ⌘⇧Z
│   ├── ──────────────────
│   ├── Cut                     ⌘X
│   ├── Copy                    ⌘C
│   ├── Paste                   ⌘V
│   ├── Paste in Place          ⌘⇧V
│   ├── Duplicate               ⌘D
│   ├── Delete                  ⌫
│   ├── ──────────────────
│   ├── Select All              ⌘A
│   └── Deselect All            ⎋
│
├── View
│   ├── Zoom In                 ⌘+
│   ├── Zoom Out                ⌘-
│   ├── Fit to Screen           ⌘0
│   ├── Actual Size             ⌘1
│   ├── ──────────────────
│   ├── Show Grid               ⌘'
│   ├── Show Guides             ⌘;
│   ├── Snap to Grid
│   ├── Snap to Objects
│   ├── ──────────────────
│   ├── Show Rulers             ⌘R
│   └── ──────────────────
│   └── Theme                   ▸
│       ├── Dark (Default)
│       └── Light
│
├── Slide
│   ├── New Slide               ⌘⏎
│   ├── Duplicate Slide         ⌘⇧D
│   ├── Delete Slide            ⌘⌫
│   ├── ──────────────────
│   ├── Edit Master             (toggle)
│   ├── ──────────────────
│   ├── Move Slide Up           ⌘↑
│   └── Move Slide Down         ⌘↓
│
├── Arrange (Elements)
│   ├── Bring to Front          ⌘⇧]
│   ├── Bring Forward           ⌘]
│   ├── Send Backward           ⌘[
│   ├── Send to Back            ⌘⇧[
│   ├── ──────────────────
│   ├── Align                   ▸
│   │   ├── Left
│   │   ├── Center Horizontal
│   │   ├── Right
│   │   ├── ──────────────
│   │   ├── Top
│   │   ├── Center Vertical
│   │   └── Bottom
│   ├── Distribute              ▸
│   │   ├── Horizontal
│   │   └── Vertical
│   ├── ──────────────────
│   ├── Group                   ⌘G
│   ├── Ungroup                 ⌘⇧G
│   ├── ──────────────────
│   ├── Lock                    ⌘L
│   └── Unlock All              ⌘⇧L
│
├── Insert
│   ├── Rectangle               R
│   ├── Ellipse                 O
│   ├── Line                    L
│   ├── ──────────────────
│   ├── Text                    T
│   ├── Image...                ⇧K
│   ├── Video...
│   ├── ──────────────────
│   ├── Icon...                 ⇧I
│   └── Code Block
│
├── Present
│   ├── From Beginning          ⌘⏎
│   ├── From Current Slide      ⌘⇧⏎
│   ├── ──────────────────
│   ├── Presenter View          (opens in new window)
│   └── ──────────────────
│   └── Rehearse Timings
│
├── ──────────────────────────
│
├── Settings...                 ⌘,
│
└── Help
    ├── Keyboard Shortcuts      ⌘/
    ├── Documentation
    ├── ──────────────────
    ├── Report an Issue
    ├── ──────────────────
    └── About Story
```

### 2.2 Keyboard Shortcuts Legend

| Symbol | Key |
|--------|-----|
| ⌘ | Ctrl (Windows) / Cmd (Mac) |
| ⇧ | Shift |
| ⌥ | Alt (Windows) / Option (Mac) |
| ⌫ | Backspace/Delete |
| ⏎ | Enter |
| ⎋ | Escape |

---

## 3. Behavior Specifications

### 3.1 Opening the Menu

- **Click**: Opens menu on mouse down
- **Hover**: Optional hover-to-open after initial click (configurable)
- **Keyboard**: 
  - `Alt+F` opens File menu directly (Windows convention)
  - Arrow keys navigate menu items
  - `Enter` activates item
  - `Escape` closes menu

### 3.2 Submenus

- Submenus appear on hover with 150ms delay
- Submenus position to the right of parent item
- If insufficient space, flip to left side
- Maintain submenu open while mouse travels to it (generous hover zone)

### 3.3 Menu State

The menu reflects current application state:
- Disabled items show in `--color-text-disabled`
- Checkmarks show for toggle items (e.g., "Show Grid" ✓)
- Radio buttons for exclusive options (e.g., Theme selection)

### 3.4 Context Awareness

Menu items may be disabled based on context:
- "Paste" disabled when clipboard empty
- "Undo/Redo" disabled when history empty
- "Delete Slide" disabled when only one slide exists
- "Arrange" items disabled when no element selected

---

## 4. Animation

### 4.1 Menu Open

```css
/* Dropdown appearance */
animation: menuSlideDown 150ms ease-out;

@keyframes menuSlideDown {
    from {
        opacity: 0;
        transform: translateY(-8px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
```

### 4.2 Submenu Open

```css
/* Submenu appearance */
animation: submenuSlideIn 100ms ease-out;

@keyframes submenuSlideIn {
    from {
        opacity: 0;
        transform: translateX(-4px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}
```

---

## 5. Accessibility

### 5.1 ARIA Attributes

```html
<button 
    aria-haspopup="true" 
    aria-expanded="false|true"
    aria-label="Story application menu"
>
    <img src="assets/story.png" alt="" />
    STORY
</button>

<div role="menu" aria-label="Application menu">
    <div role="menuitem" tabindex="-1">New Presentation</div>
    <div role="menuitem" tabindex="-1" aria-haspopup="true">Open Recent</div>
    <div role="separator"></div>
    ...
</div>
```

### 5.2 Keyboard Navigation

| Key | Action |
|-----|--------|
| `↓` | Move to next item |
| `↑` | Move to previous item |
| `→` | Open submenu / Move to submenu |
| `←` | Close submenu / Return to parent |
| `Enter` | Activate item |
| `Space` | Activate item |
| `Escape` | Close menu |
| `Home` | Jump to first item |
| `End` | Jump to last item |
| `A-Z` | Jump to item starting with letter |

---

## 6. File Operations UX

### 6.1 New Presentation

1. If current presentation has unsaved changes:
   - Show "Unsaved Changes" modal
   - Options: "Save", "Don't Save", "Cancel"
2. Create new blank presentation
3. Clear file handle (no associated file)

### 6.2 Open

1. If current presentation has unsaved changes:
   - Show "Unsaved Changes" modal
2. Show native file picker for `.str` files
3. Load and deserialize file
4. Update UI with loaded presentation

### 6.3 Save

1. If no file handle exists (new file):
   - Trigger "Save As" flow
2. If file handle exists:
   - Serialize current state
   - Write to existing file
   - Show brief "Saved" toast notification

### 6.4 Save As

1. Show native save file picker
2. Serialize current state
3. Write to selected location
4. Update file handle
5. Show brief "Saved" toast notification

### 6.5 Error Handling

All file operations show custom modal dialogs (not browser alerts):

```
┌─────────────────────────────────────────┐
│  ⚠️  Unable to Save                     │
├─────────────────────────────────────────┤
│                                         │
│  The file could not be saved.           │
│  Please check permissions and           │
│  try again.                             │
│                                         │
│                        [Try Again] [OK] │
└─────────────────────────────────────────┘
```

---

## 7. Recent Files

### 7.1 Storage

Recent files are stored in localStorage:

```javascript
{
    recentFiles: [
        {
            name: "Marketing Deck.str",
            path: "/Documents/Presentations/...",
            lastOpened: "2025-11-29T10:30:00Z",
            thumbnail: "data:image/png;base64,..."
        }
    ]
}
```

### 7.2 Limits

- Maximum 10 recent files
- Remove entries when file no longer exists (checked on hover)
- "Clear Recent" removes all entries

---

## 8. Implementation Notes

### 8.1 Component Structure

```
src/ui/components/
├── AppMenu/
│   ├── AppMenu.js           # Main menu component
│   ├── AppMenuTrigger.js    # Logo button trigger
│   ├── MenuDropdown.js      # Dropdown container
│   ├── MenuItem.js          # Single menu item
│   ├── MenuDivider.js       # Separator line
│   └── Submenu.js           # Submenu container
```

### 8.2 Dependencies

- Uses existing design system tokens (no custom colors)
- Uses existing modal component for dialogs
- Integrates with Store for state management
- Uses FileSystemAccess for file operations

---

## 9. Testing Requirements

### 9.1 Unit Tests

- Menu opens on click
- Menu closes on outside click
- Menu closes on Escape key
- Keyboard navigation works
- Submenus open on hover
- Disabled items not activatable
- Shortcuts trigger correct actions

### 9.2 Integration Tests

- File > New creates blank presentation
- File > Open loads .str file correctly
- File > Save writes to file
- Unsaved changes prompt appears appropriately
- Recent files list updates correctly

---

*This specification defines the complete App Menu experience for Story.*
