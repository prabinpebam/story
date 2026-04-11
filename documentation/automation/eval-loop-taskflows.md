# Eval Loop Taskflow Catalog

> Exhaustive inventory of every discrete user taskflow in Story, organized by category.
> Each taskflow maps to one eval loop test scenario.

---

## Table of Contents

1. [Selection & Hit-Testing](#1-selection--hit-testing)
2. [Viewport & Navigation](#2-viewport--navigation)
3. [Element Creation](#3-element-creation)
4. [Element Movement & Dragging](#4-element-movement--dragging)
5. [Element Resize](#5-element-resize)
6. [Element Rotation](#6-element-rotation)
7. [Text Editing](#7-text-editing)
8. [Context Menu](#8-context-menu)
9. [Layer Management](#9-layer-management)
10. [Undo / Redo](#10-undo--redo)
11. [Property Inspector](#11-property-inspector)
12. [Numeric Input Interaction](#12-numeric-input-interaction)
13. [Snapping & Alignment](#13-snapping--alignment)
14. [Fills System](#14-fills-system)
15. [Typography Styles](#15-typography-styles)
16. [Color Picker](#16-color-picker)
17. [Shapes](#17-shapes)
18. [Slide Management](#18-slide-management)
19. [Master Slides & Layouts](#19-master-slides--layouts)
20. [Themes](#20-themes)
21. [Transitions](#21-transitions)
22. [Slide Notes](#22-slide-notes)
23. [Presentation Mode](#23-presentation-mode)
24. [AI Features](#24-ai-features)
25. [Collaboration](#25-collaboration)
26. [Column System & Layout Guides](#26-column-system--layout-guides)
27. [Keyboard Shortcuts](#27-keyboard-shortcuts)
28. [File Operations](#28-file-operations)
29. [Cursor Behavior](#29-cursor-behavior)

---

## 1. Selection & Hit-Testing

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| SEL-01 | Single select | Click on element | Deselect all, select clicked element, show gizmo |
| SEL-02 | Add to selection | Shift + Click on unselected element | Add element to selection, expand gizmo to encompass all |
| SEL-03 | Remove from selection | Shift + Click on selected element | Remove element from selection, recalculate gizmo |
| SEL-04 | Deselect all | Click on empty canvas | Deselect all elements, hide gizmo |
| SEL-05 | Marquee select | Drag on empty canvas | Draw selection box, select all intersecting elements |
| SEL-06 | Select all | Ctrl+A (canvas context) | Select all elements on current slide |
| SEL-07 | Deep select child | Ctrl/Cmd + Click on group member | Select specific child, not group |
| SEL-08 | Deep select on double-click | Double-click on group | Enter group, select child under cursor |
| SEL-09 | Sync highlight in layer tree | Click element on canvas | Corresponding layer highlighted in tree, scroll into view |
| SEL-10 | Sync selection from layer tree | Click layer in tree | Select element on canvas |
| SEL-11 | Multi-select layers | Shift + Click in layer tree | Select range of layers |
| SEL-12 | Toggle layer selection | Ctrl/Cmd + Click in layer tree | Toggle individual layer selection |
| SEL-13 | Tab to next element | Tab key (text edit context) | Exit text edit, select next element |

---

## 2. Viewport & Navigation

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| VP-01 | Pan with space | Space + Drag | Cursor changes to grab hand, drag moves viewport |
| VP-02 | Pan with middle mouse | Middle mouse button drag | Pan viewport without holding space |
| VP-03 | Pan with trackpad | Two-finger scroll | Pan viewport |
| VP-04 | Zoom in (scroll) | Ctrl + Scroll wheel up | Zoom toward mouse cursor position |
| VP-05 | Zoom out (scroll) | Ctrl + Scroll wheel down | Zoom away from mouse cursor position |
| VP-06 | Zoom in (keyboard) | Ctrl + `+` | Zoom in toward center of view |
| VP-07 | Zoom out (keyboard) | Ctrl + `-` | Zoom out from center of view |
| VP-08 | Pinch to zoom | Trackpad pinch | Zoom proportional to pinch gesture toward pinch center |
| VP-09 | Fit to view | Shift + 1 | Center slide and scale to fit available window with padding |
| VP-10 | Zoom range enforcement | Any zoom action | Enforce 10% (min) to 500% (max) range |
| VP-11 | Zoom toward cursor | Ctrl + Scroll | Zoom maintains cursor position in world space |

---

## 3. Element Creation

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| CRE-01 | Create rectangle (click) | R tool → click canvas | Default 200×50px element at viewport center, auto-select all text, enter select tool |
| CRE-02 | Create rectangle (drag) | R tool → click-drag on canvas | Drag defines bounding box (min 50×50px), select tool activates |
| CRE-03 | Create rectangle (constrained) | R tool → Shift + drag | Constrain proportions to square |
| CRE-04 | Create text (click) | T tool → click canvas | AutoSize text element (200×50px), enter text edit mode with all text selected |
| CRE-05 | Create text (drag) | T tool → click-drag canvas | FixedWidth text element, enter text edit mode |
| CRE-06 | Create ellipse | O tool → drag canvas | Ellipse from drag bounding box; Shift constrains to circle |
| CRE-07 | Create line | L tool → drag canvas | Line drawn from start to end point |
| CRE-08 | Create arrow | Shift+L tool → drag canvas | Arrow drawn from start to end point |
| CRE-09 | Create polygon | Shift+P tool → drag canvas | Polygon from drag bounding box |
| CRE-10 | Create star | Shift+S tool → drag canvas | Star from drag bounding box |
| CRE-11 | Place image | Shift+K tool → click canvas | Image placement UI appears, user selects image, element created with image fill |
| CRE-12 | Double-click tool | Double-click shape tool | Add element to center of viewport with default dimensions |
| CRE-13 | Drag from toolbar | Click-hold-drag tool from toolbar | Ghost icon follows cursor, drop on canvas places element at that location |
| CRE-14 | Newly created flag | Post-creation | Element flagged `isNewlyCreated: true` for 3 seconds (enables inline rename, disables undo on backspace) |

---

## 4. Element Movement & Dragging

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| MOV-01 | Drag element | Drag gizmo body (not handle) | Element moves seamlessly, GPU-accelerated transform |
| MOV-02 | Nudge 1px | Arrow keys (selection on canvas) | Move element 1px in arrow direction |
| MOV-03 | Nudge 10px | Shift + Arrow keys | Move element 10px in arrow direction |
| MOV-04 | Multi-element drag | Drag when multiple selected | All selected elements move together, maintaining relative positions |
| MOV-05 | Drag with snapping | Drag element near snap target | Magenta snap lines appear at 5px threshold, element sticks with hysteresis |
| MOV-06 | Escape during drag | Escape key while dragging | Cancel drag, revert to start position |
| MOV-07 | Drop on target | Release mouse after drag | Finalize position, push to undo stack |
| MOV-08 | Reorder via layer tree | Drag layer in layer tree | Blue line shows drop target position, element reorder committed on drop |
| MOV-09 | Reparent to group | Drag layer into group in tree | Element moved from root to group's children array |
| MOV-10 | Reparent out of group | Drag layer out of group | Element removed from group, added back to root elementOrder |
| MOV-11 | Auto-scroll during drag | Drag near tree edges | Layer tree auto-scrolls near top/bottom |

---

## 5. Element Resize

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| RSZ-01 | Resize edge handle | Drag N/S/E/W handle | Resize in one dimension only |
| RSZ-02 | Resize corner handle | Drag NW/NE/SE/SW corner | Free resize (both width and height) |
| RSZ-03 | Constrained resize | Shift + drag corner handle | Maintain aspect ratio |
| RSZ-04 | Resize from center | Alt + drag any handle | Expand/contract from center point |
| RSZ-05 | Resize multi-selection | Drag handle on multi-selection gizmo | All selected elements scale proportionally relative to selection bounding box |
| RSZ-06 | Resize group | Drag handle on group gizmo | All children scale proportionally; positions adjusted relative to group origin |
| RSZ-07 | Toggle text resizing mode | UI button in layout section | Switch between autoSize / fixedWidth / fixed modes |
| RSZ-08 | Manual resize triggers fixed | Drag text element handles | Text element auto-switches to `fixed` resizing mode |
| RSZ-09 | Hide selection during resize | Start property interaction | Gizmo and handles hidden during scrubbing/dragging (except text elements) |
| RSZ-10 | Show selection after resize | End property interaction | Gizmo and handles reappear |
| RSZ-11 | Text auto-resize adjustment | Text auto-resizes | Position adjusted based on alignment to maintain visual anchor |
| RSZ-12 | Scale tool | K key or tool selection | Resize and scale font size uniformly |

---

## 6. Element Rotation

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| ROT-01 | Rotate element | Drag rotation handle (top-center) | Element rotates around center; angle updates in real-time |
| ROT-02 | Snap to 15° increments | Shift + drag rotation handle | Rotation snaps to 0°, 15°, 30°, etc. |
| ROT-03 | Rotate resize cursor | Element rotated → hover resize handles | Resize cursor rotates to match element orientation (per 45° segment) |
| ROT-04 | Hide rotation handle | Element < 50px at current zoom | Rotation handle hidden if too small to interact with |

---

## 7. Text Editing

### 7.1 Text Element Creation

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| TXT-01 | Single click creation | T tool → single-click canvas | AutoSize element (200×50px), enter edit mode with select-all, `isNewlyCreated: true` |
| TXT-02 | Drag creation | T tool → click-drag canvas | FixedWidth element, user-defined size (min 50×50), enter edit mode with select-all |
| TXT-03 | Master mode creation | T tool (master mode) → click canvas | Fixed mode, default 400×80px, enter edit mode with select-all |
| TXT-04 | Empty element deletion | Create text → exit without typing | If newly created with no input, element deleted |

### 7.2 Resizing Modes

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| TXT-05 | Switch to auto size | Click Auto Size button in layout section | Both W/H inputs disabled, dimensions follow content |
| TXT-06 | Switch to fixed width | Click Fixed Width button | W input enabled, H disabled, width fixed, height expands with content |
| TXT-07 | Switch to fixed size | Click Fixed Size button | Both W/H inputs enabled, text overflows if exceeds bounds |
| TXT-08 | Manual resize via handles | Drag resize handle on text element | Changes to `fixed` mode, font size unchanged, content reflows |
| TXT-09 | Scale transform | Shift + drag resize handle | Font size AND dimensions scale proportionally |

### 7.3 Alignment & Anchoring

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| TXT-10 | Left alignment resize | `textAlign: 'left'` + content expands | Anchored at left edge, grows rightward |
| TXT-11 | Center alignment resize | `textAlign: 'center'` + content expands | Anchored at center, grows both directions equally |
| TXT-12 | Right alignment resize | `textAlign: 'right'` + content expands | Anchored at right edge, grows leftward |
| TXT-13 | Vertical top alignment | `verticalAlign: 'top'` + content expands | Anchored at top, grows downward |
| TXT-14 | Vertical middle alignment | `verticalAlign: 'middle'` + content expands | Anchored at middle, grows both directions |
| TXT-15 | Vertical bottom alignment | `verticalAlign: 'bottom'` + content expands | Anchored at bottom, grows upward |

### 7.4 Edit Mode Entry

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| TXT-16 | Double-click entry | Double-click text element | Caret at click position, contentEditable enabled, TEXT_EDIT_START emitted |
| TXT-17 | Enter key entry | Press Enter with text selected | Enter edit mode, select all content |
| TXT-18 | Text tool creation entry | Create new text with T tool | Enter edit mode immediately, select all content |
| TXT-19 | Blur to non-PI element | Clicks outside element (not on PI) | Exit edit mode, saves content, deselect |

### 7.5 Edit Mode Exit

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| TXT-20 | Escape key exit | Escape during edit | Exit without saving, element selection kept |
| TXT-21 | Ctrl+Enter exit | Ctrl+Enter during edit | Exit WITH saving, element selection kept |
| TXT-22 | Click outside exit | Click outside element | Exit WITH saving, element deselected |
| TXT-23 | Tab key exit | Tab (not in list) during edit | Exit WITH saving, next element selected |
| TXT-24 | Shift+Tab exit | Shift+Tab during edit | Exit WITH saving, previous element selected |
| TXT-25 | Empty element after edit | Create text → edit → exit empty | Element deleted (if newly created) or kept (if existing) |
| TXT-26 | Placeholder after edit | Exit placeholder without typing | Reverts to prompt text, `hasUserContent: false` |

### 7.6 Selection & Caret

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| TXT-27 | Single click in edit | Click at position in edit mode | Caret placed at click position |
| TXT-28 | Double-click word select | Double-click in edit mode | Word at click position selected |
| TXT-29 | Triple-click line select | Triple-click in edit mode | Entire paragraph/line selected |
| TXT-30 | Quadruple-click select all | Four clicks in edit mode | All content selected |
| TXT-31 | Drag selection | Click-drag in edit mode | Text selection range matching drag |
| TXT-32 | Shift+Click extend | Shift + Click in edit mode | Selection extended from caret to click position |
| TXT-33 | Selection with PI blur | Click Property Inspector during edit | Selection saved, PI action executed, selection restored |

### 7.7 Text Formatting Shortcuts

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| TXT-34 | Bold | Ctrl+B during edit | Toggle bold on selection |
| TXT-35 | Italic | Ctrl+I during edit | Toggle italic on selection |
| TXT-36 | Underline | Ctrl+U during edit | Toggle underline on selection |
| TXT-37 | Strikethrough | Ctrl+Shift+X during edit | Toggle strikethrough on selection |

### 7.8 Text Navigation Shortcuts

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| TXT-38 | Arrow keys | Arrow keys during edit | Caret moves per direction |
| TXT-39 | Shift+Arrow extend | Shift+Arrow during edit | Selection extends per direction |
| TXT-40 | Home key | Home during edit | Caret to line start |
| TXT-41 | End key | End during edit | Caret to line end |
| TXT-42 | Ctrl+Home | Ctrl+Home during edit | Caret to document start |
| TXT-43 | Ctrl+End | Ctrl+End during edit | Caret to document end |
| TXT-44 | Select all text | Ctrl+A during edit | All text selected |

### 7.9 Text Clipboard

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| TXT-45 | Copy text | Ctrl+C (text selected) | Text copied to clipboard |
| TXT-46 | Cut text | Ctrl+X (text selected) | Text cut to clipboard |
| TXT-47 | Rich paste | Ctrl+V during edit | Rich paste with HTML sanitization |
| TXT-48 | Plain text paste | Ctrl+Shift+V during edit | Strips formatting, pastes plain text |

### 7.10 Text Undo/Redo

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| TXT-49 | Undo text edit | Ctrl+Z during edit | Browser-native undo, does NOT trigger global undo |
| TXT-50 | Redo text edit | Ctrl+Y / Ctrl+Shift+Z during edit | Browser-native redo |

### 7.11 List Handling

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| TXT-51 | Auto-detect bullet list | Type "- " or "* " at line start | Line converts to `<ul>`, bullet appears |
| TXT-52 | Auto-detect numbered list | Type "1. " at line start | Line converts to `<ol>`, number appears |
| TXT-53 | Auto-detect lettered list | Type "a. " or "A. " at line start | Line converts to lettered list |
| TXT-54 | Indent list item | Tab in list item | Nesting level increases |
| TXT-55 | Outdent list item | Shift+Tab in indented list item | Nesting level decreases |
| TXT-56 | Enter in list item | Enter in list item | New list item at same level |
| TXT-57 | Enter in empty list item | Enter in empty list item | Exit list or outdent (converts to paragraph) |
| TXT-58 | Backspace at list start | Backspace at start of list item | Outdent or convert to paragraph |

### 7.12 Placeholder System

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| TXT-59 | Click empty placeholder | Click placeholder with prompt text | Selected, dashed border, 50% opacity |
| TXT-60 | Double-click placeholder | Double-click empty placeholder | Enter edit mode, prompt text cleared |
| TXT-61 | Type into placeholder | Type content in placeholder edit | `hasUserContent: true`, becomes normal text |
| TXT-62 | Exit empty placeholder | Escape from empty placeholder edit | Reverts to prompt text, `hasUserContent: false` |
| TXT-63 | Inherited placeholder double-click | Double-click inherited placeholder | `INSTANTIATE_PLACEHOLDER` dispatched, element copied to slide, edit mode entered |

### 7.13 IME Support

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| TXT-64 | IME composition start | Begin CJK input | Composition detected, formatting/exit/undo blocked |
| TXT-65 | IME composition end | Commit CJK character | Composition ends, normal operations resume |

### 7.14 Formatting via Property Inspector

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| TXT-66 | Bold via PI | Click Bold button in PI | Selection saved, bold applied, selection restored |
| TXT-67 | Italic via PI | Click Italic button in PI | Selection saved, italic applied, selection restored |
| TXT-68 | Underline via PI | Click Underline button in PI | Selection saved, underline applied, selection restored |
| TXT-69 | Strikethrough via PI | Click Strikethrough button in PI | Selection saved, strikethrough applied, selection restored |
| TXT-70 | Left align | Click Left align button | `textAlign = 'left'` |
| TXT-71 | Center align | Click Center align button | `textAlign = 'center'` |
| TXT-72 | Right align | Click Right align button | `textAlign = 'right'` |
| TXT-73 | Justify align | Click Justify button | `textAlign = 'justify'` |
| TXT-74 | Font size direct entry | Enter value in Font Size input | Font size applied, text reflows |
| TXT-75 | Font size scrubbing | Scrub Font Size input horizontally | Font size changes incrementally |

### 7.15 Content Safety

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| TXT-76 | Sanitize on commit | Exit text edit | HTML sanitized, malicious code removed before store update |
| TXT-77 | Match canvas styles | Enter text edit | DOM overlay matches canvas styles (font, size, color, transform, alignment) |
| TXT-78 | Live auto-resize | Type in autoSize mode | Element width/height expands to fit, position adjusts per alignment |

---

## 8. Context Menu

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| CTX-01 | Open on empty canvas | Right-click empty space | Menu: Paste, Select All, Grid Settings, Background, Reset View |
| CTX-02 | Open on selected element | Right-click element | Menu: Cut, Copy, Paste, Duplicate, Delete, Arrange, Group, Transform, AI |
| CTX-03 | Open on slide thumbnail | Right-click slide in sidebar | Menu: New Slide, Duplicate, Delete, Rename, Apply Master |
| CTX-04 | Open on layer | Right-click layer in tree | Menu: Rename, Lock/Unlock, Hide/Show, Delete, Arrange, Group/Ungroup |
| CTX-05 | Close by click outside | Click outside menu | Menu dismissed |
| CTX-06 | Close by escape | Press Escape | Menu dismissed |
| CTX-07 | Boundary detection | Context menu near viewport edge | Menu repositions to stay within viewport |
| CTX-08 | Arrow key navigation | Up/Down arrow while menu open | Focus moves within menu items |
| CTX-09 | Activate menu item | Enter or Space on focused item | Action executed |
| CTX-10 | Typeahead navigation | Press A-Z while menu open | Jump to first item starting with that letter |
| CTX-11 | Paste | Right-click → Paste | Internal clipboard content pasted; system clipboard checked first |
| CTX-12 | Cut | Right-click → Cut | Copy element to clipboard, delete element |
| CTX-13 | Copy | Right-click → Copy | Copy element to internal clipboard |
| CTX-14 | Duplicate | Right-click → Duplicate (or Ctrl+D) | Clone element(s), paste at offset |
| CTX-15 | Delete | Right-click → Delete (or Delete key) | Delete selected element(s) |
| CTX-16 | Bring to front | Right-click → Bring to Front | Move to end of elementOrder (top visually) |
| CTX-17 | Bring forward | Right-click → Bring Forward | Move up one position |
| CTX-18 | Send backward | Right-click → Send Backward | Move down one position |
| CTX-19 | Send to back | Right-click → Send to Back | Move to start of elementOrder (bottom visually) |
| CTX-20 | Group | Right-click → Group (or Ctrl+G) | Create group container for selected elements |
| CTX-21 | Ungroup | Right-click → Ungroup (or Ctrl+Shift+G) | Dissolve group, move children to parent level |
| CTX-22 | Flip horizontal | Right-click → Flip Horizontal | Mirror element left-right |
| CTX-23 | Flip vertical | Right-click → Flip Vertical | Mirror element top-bottom |
| CTX-24 | AI shorten text | Right-click → Shorten Text (text) | AI rewrites text shorter |
| CTX-25 | AI rewrite | Right-click → Rewrite (text) | AI rewrites with variation |
| CTX-26 | Grid settings | Right-click → Grid Settings (empty) | Toggle grid visibility / snap-to-grid |
| CTX-27 | Edit background | Right-click → Background (empty) | Open background editing UI |
| CTX-28 | Fit to view | Right-click → Reset View (empty) | Zoom and pan to fit slide |

---

## 9. Layer Management

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| LYR-01 | Toggle visibility | Click eye icon on layer | Toggle `hidden` state; hidden elements cannot be selected on canvas |
| LYR-02 | Hide group | Toggle visibility on group | All children also hidden |
| LYR-03 | Toggle lock | Click lock icon on layer | Toggle `locked` state; locked elements unselectable on canvas |
| LYR-04 | Rename layer | Double-click layer name | Enter edit mode, text field editable |
| LYR-05 | Commit rename | Press Enter during rename | Save new name, exit rename mode |
| LYR-06 | Cancel rename | Press Escape during rename | Discard changes, exit rename mode |
| LYR-07 | Default name on empty | Rename to empty string | Revert to default ("Text", "Rectangle", etc.) |
| LYR-08 | Expand group | Click chevron on group | Show group's children |
| LYR-09 | Collapse group | Click chevron on expanded group | Hide group's children |
| LYR-10 | Indentation display | Group expanded | Child layers indented 16px per nesting level |
| LYR-11 | Sync tree with canvas | Element selected on canvas | Layer highlighted and scrolled into view |
| LYR-12 | Master slide layers | Master element in tree | Shown with distinct styling/locking |
| LYR-13 | Background layer | Bottom of layer tree | Fixed "Background" item at bottom; cannot be reordered |
| LYR-14 | Reorder indicator | Drag layer in tree | Blue line shows drop target position |
| LYR-15 | Tree auto-scroll | Drag layer near edge | Tree scrolls to reveal drop target |
| LYR-16 | Reparent on drop | Drop layer into group | Element moved to group's children array |
| LYR-17 | Promote on drop | Drop layer outside group | Element moved from group back to root |

---

## 10. Undo / Redo

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| UND-01 | Undo | Ctrl+Z (global) | Restore previous state + selection + viewport |
| UND-02 | Redo | Ctrl+Y / Ctrl+Shift+Z (global) | Restore next state from redo stack |
| UND-03 | Undo text change | Ctrl+Z during text edit | Browser-native undo on contenteditable (local, not global) |
| UND-04 | Redo text change | Ctrl+Y during text edit | Browser-native redo (local, not global) |
| UND-05 | Discrete action snapshot | Simple action completed (e.g., color change) | Immediate push to undo stack |
| UND-06 | Interaction batch start | Drag/resize/rotate starts (mousedown) | Push current state, mark "Interaction Active" |
| UND-07 | Interaction batch update | Mousemove during interaction | Update state without new history push |
| UND-08 | Interaction batch end | Mouseup after interaction | Finalize state |
| UND-09 | Scrubbing as single step | Numeric input drag → mouseup | Entire drag = ONE undo step |
| UND-10 | Typing as single step | Text input in number field → blur/enter | All typed characters = ONE undo step |
| UND-11 | Selection preservation | Undo/Redo executed | Previous selection restored from metadata |
| UND-12 | Viewport preservation | Undo/Redo executed | Previous pan/zoom restored from metadata |
| UND-13 | History limit (count) | Undoable actions exceed 50 | Oldest snapshots discarded |
| UND-14 | Structural sharing | Immer-based undo/redo | Only changed portions cloned; unchanged parts share memory |
| UND-15 | Asset reference lifecycle | Asset in undo stack | Asset never deleted while in history |

---

## 11. Property Inspector

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| PI-01 | Open property inspector | Element selected on canvas | PI shows relevant sections for element type |
| PI-02 | Show mixed state | Multiple elements with different values | Field shows "—" or "Mixed" |
| PI-03 | Position X input | Scrubbable input in Position section | Drag to change X; Shift=10px, Alt=0.1px |
| PI-04 | Position Y input | Scrubbable input in Position section | Drag to change Y |
| PI-05 | Width input | Scrubbable input in Layout section | Drag to change width |
| PI-06 | Height input | Scrubbable input in Layout section | Drag to change height |
| PI-07 | Rotation input | Scrubbable input in Position section | Drag to change rotation (0-360°) |
| PI-08 | Flip horizontal button | Button in Position section | Mirror element left-right |
| PI-09 | Flip vertical button | Button in Position section | Mirror element top-bottom |
| PI-10 | Opacity input | Scrubbable input in Appearance | Drag to change opacity 0-100% |
| PI-11 | Blend mode dropdown | Dropdown in Appearance | Select blend mode |
| PI-12 | Fill color input | ColorInput in Fill section | Click to open color picker |
| PI-13 | Stroke color input | ColorInput in Stroke section | Click to open color picker |
| PI-14 | Stroke width input | Scrubbable input in Stroke | Drag to change stroke width |
| PI-15 | Corner radius input | Scrubbable input in Appearance | Drag to change border radius |
| PI-16 | Font family dropdown | Dropdown in Typography | Select font from loaded fonts |
| PI-17 | Font size input | Scrubbable input in Typography | Drag to change font size |
| PI-18 | Font weight dropdown | Dropdown in Typography | Select weight (normal, bold, etc.) |
| PI-19 | Text alignment buttons | SegmentedControl in Typography | Select left, center, right, justify |
| PI-20 | Line height input | Scrubbable input in Typography | Drag to change line height |
| PI-21 | Letter spacing input | Scrubbable input in Typography | Drag to change letter spacing |
| PI-22 | Resizing mode buttons | SegmentedControl in Layout (text) | Select autoSize, fixedWidth, fixed |
| PI-23 | Shadow effect toggle | Toggle switch in Effects | Enable/disable drop shadow |
| PI-24 | Shadow blur input | Scrubbable input in Effects | Drag to change shadow blur |
| PI-25 | Shadow offset input | Scrubbable input in Effects | Drag to change shadow X/Y offset |
| PI-26 | Blur effect toggle | Toggle switch in Effects | Enable/disable layer blur |
| PI-27 | Blur amount input | Scrubbable input in Effects | Drag to change blur radius |
| PI-28 | Background blur toggle | Toggle switch in Effects | Enable/disable background blur |
| PI-29 | Scrub during change | Drag NumberInput label | Hide selection overlay, update in real-time |
| PI-30 | Release scrub | Release mouse after scrub | Show selection overlay, commit to undo stack |
| PI-31 | Escape revert | Escape during numeric input | Revert to initial value |
| PI-32 | Multi-element update | Multiple selected → change property | Update all selected elements |
| PI-33 | PI-to-canvas sync | Change property in PI | Canvas reflects change at 60fps |
| PI-34 | Canvas-to-PI sync | Change element on canvas | PI updates to reflect canvas state |
| PI-35 | Text object overlay | Text selected + property changing | Selection overlay REMAINS visible |
| PI-36 | Non-text hide overlay | Non-text element + property changing | Selection overlay hidden during scrubbing |

---

## 12. Numeric Input Interaction

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| NUM-01 | Scrub default | Drag on label/input | 1px drag = 1 unit |
| NUM-02 | Scrub coarse | Shift + drag | 1px drag = 10 units |
| NUM-03 | Scrub fine | Alt + drag | 1px drag = 0.1 units |
| NUM-04 | Infinite scrub | Drag during scrub | Cursor hidden, pointer lock, never hits screen edge |
| NUM-05 | Distinguish click from scrub | Mousedown on input → wait | > 3px move = scrub; release without move = click (select all text) |
| NUM-06 | Arrow up increment | Arrow Up while input focused | Increment by 1 step |
| NUM-07 | Arrow down decrement | Arrow Down while input focused | Decrement by 1 step |
| NUM-08 | Shift+Arrow coarse | Shift + Arrow (input focused) | Increment/decrement by 10 |
| NUM-09 | Alt+Arrow fine | Alt + Arrow (input focused) | Increment/decrement by 0.1 |
| NUM-10 | Commit on enter | Enter during edit | Save value, blur |
| NUM-11 | Revert on escape | Escape during edit | Revert to initial value, blur |
| NUM-12 | Remember initial value | Focus or mousedown | Store initial value for escape revert |
| NUM-13 | Local undo in text | Ctrl+Z during input focus | Browser-native undo (does NOT trigger app undo) |
| NUM-14 | Prevent global undo | App undo listener | Ignore Ctrl+Z when input focused |
| NUM-15 | Transient updates | Scrubbing/typing during drag | Update store with transient flag (no undo push) |
| NUM-16 | Batch on release | Mouseup after scrub | Final value pushed to undo stack as atomic action |

---

## 13. Snapping & Alignment

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| SNP-01 | Snap during move | Drag element near snap target | Magenta line at 5px threshold; element sticks with hysteresis |
| SNP-02 | Snap during resize | Drag resize handle near target | Snap line appears; edge aligns |
| SNP-03 | Slide edge snap | Element near slide boundary | Snap to slide left/right/top/bottom/center |
| SNP-04 | Object edge snap | Element near other object edge | Snap to other object edges |
| SNP-05 | Object center snap | Element near other object center | Snap to other object center X/Y |
| SNP-06 | Deterministic tie-break | Multiple snap candidates at 5px | Prefer smallest distance; tie-break by category then axis then ID |
| SNP-07 | Anti-jitter (hysteresis) | Snapped element, small move | Remain snapped until cursor exits larger release threshold |
| SNP-08 | Distance markers | 3+ objects with equal spacing | Display pixel gap indicator |
| SNP-09 | Stable target keys | Snap candidates generated | Each has unique key `category:type:id:axis` |
| SNP-10 | Disable during marquee | Marquee selection start | Snapping disabled; re-enable after release |

---

## 14. Fills System

### 14.1 Gradient Fill

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| FIL-01 | Apply gradient fill | Fill control → select "Gradient" | Default linear gradient applied, preview shown |
| FIL-02 | Change gradient type | Gradient edit → select "Radial" or "Linear" | Gradient type changes, element updates |
| FIL-03 | Add gradient stop | Click on gradient line/preview | New stop created at click position |
| FIL-04 | Change stop color | Select stop → click color picker | Stop color updated, gradient updates live |
| FIL-05 | Adjust stop position | Drag stop along gradient line | Stop position updates, blending recalculated |
| FIL-06 | Remove gradient stop | Select stop → Delete | Stop removed (min 2 enforced), gradient updates |
| FIL-07 | Rotate gradient | Adjust angle/rotation value | Gradient direction changes |
| FIL-08 | Adjust gradient scale | Adjust scale slider (radial) | Gradient size changes |

### 14.2 Media Fill

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| FIL-09 | Apply media fill | Fill control → select "Media" | File picker or URL input appears |
| FIL-10 | Upload media file | Click "Upload" or drag-drop into zone | File dialog opens, media applied to shape fill |
| FIL-11 | Enter media URL | Enter URL in input → Enter | Media loads from URL, applied to shape fill |
| FIL-12 | Adjust media scale | Adjust scale slider | Media size within shape changes |
| FIL-13 | Adjust media position | Drag preview or adjust x/y offsets | Media position within shape changes |
| FIL-14 | Adjust media opacity | Adjust opacity slider | Media opacity changes |
| FIL-15 | Adjust media rotation | Adjust rotation angle | Media rotates within shape |

### 14.3 Code Fill

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| FIL-16 | Enter code mode | Background panel → code input option | Code input field appears |
| FIL-17 | Type code | Type JavaScript in code input | Code entered, syntax highlighting applied |
| FIL-18 | Apply code | Press Enter or click Apply | Code executed in Canvas render context, background updates |

---

## 15. Typography Styles

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| TYP-01 | Apply standard style | Select text → Style Role dropdown → select "Heading 1" | `textStyleId = 'heading1'`, clears overrides, re-renders with theme properties |
| TYP-02 | Create manual override | Change property on styled text (e.g., font size) | Keeps textStyleId, adds manualOverride, dropdown shows "(Modified)" |
| TYP-03 | Reset to style | Click "Reset to Style" or re-select style | Clears manualOverrides, snaps back to theme definition |
| TYP-04 | Update master slide style | Master view → change style property | Override propagates to all inheriting slides |
| TYP-05 | Select font family | Open font family dropdown | Populated by FontManager, selectable |
| TYP-06 | Select font weight | Open font weight dropdown | Options shown (Regular, Bold, etc.) |
| TYP-07 | Adjust line height | Enter line height value | `lineHeight` updated, text reflows |
| TYP-08 | Adjust letter spacing | Enter letter spacing value | `letterSpacing` updated, text adjusts |
| TYP-09 | View inheritance indicator | Hover Style Role dropdown | Tooltip shows source ("Inherited from Master Slide", etc.) |

---

## 16. Color Picker

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| CLR-01 | Open color picker | Click color picker button in Text/Fill section | Picker opens, shows current color and theme swatches |
| CLR-02 | Select theme color | Click theme color swatch (e.g., `text1`) | Color applied to selection |
| CLR-03 | Create manual color override | Select different theme color than current | Override created, "Modified" state shown |

---

## 17. Shapes

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| SHP-01 | Create shape with tool | Select tool (R/O/L/etc.) → drag canvas | Shape created matching tool type |
| SHP-02 | Constrain shape | Shift + drag shape tool | Constrain aspect ratio (square/circle) |
| SHP-03 | Delete shape | Delete key with shape selected | Shape removed from slide |
| SHP-04 | Duplicate shape | Ctrl+D or context menu | Clone at offset |
| SHP-05 | Drag to reorder | Drag shape body | Move in world space; snapping applies |
| SHP-06 | Rotate shape | Drag rotation handle | Continuous rotation around center |
| SHP-07 | Snap rotation | Shift + rotate handle | Snap to 15° increments |
| SHP-08 | Flip horizontal | Context menu or transform | Mirror left-right |
| SHP-09 | Flip vertical | Context menu or transform | Mirror top-bottom |
| SHP-10 | Group shapes | Select multiple → Ctrl+G | Combine into group container |
| SHP-11 | Ungroup shapes | Group selected → Ctrl+Shift+G | Dissolve into root elements |
| SHP-12 | Arrange z-order | Context menu or keyboard | Bring forward/back, send to front/back |
| SHP-13 | Edit shape properties | Property Inspector or double-click | Access fill, stroke, effects |
| SHP-14 | Apply fill | PI fill section | Solid, gradient, image, video, or code fill |
| SHP-15 | Apply stroke | PI stroke section | Line color, width, dash pattern, per-side strokes |
| SHP-16 | Apply effects | PI effects section | Drop shadow, layer blur, background blur |
| SHP-17 | Resize preserving fill | Resize handles | Fill pattern scales proportionally |

---

## 18. Slide Management

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| SLD-01 | Add slide | Click Add button | New slide inserted after current |
| SLD-02 | Delete slide | Select + delete | Slide removed (confirmation required) |
| SLD-03 | Duplicate slide | Select + duplicate | New copy created |
| SLD-04 | Change active slide | Click thumbnail or keyboard nav | Canvas and PI update context |
| SLD-05 | Thumbnail re-render | Theme assignment changes | Thumbnails update to reflect new theme |
| SLD-06 | New slide shortcut | Ctrl+Enter | Insert new slide after current |

---

## 19. Master Slides & Layouts

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| MST-01 | Enter master mode | Click master/layout in UI | Active container switches to master; becomes editable |
| MST-02 | View inherited elements | In layout master | Master root elements visible but NOT interactive |
| MST-03 | Apply master preset | User applies preset | Replaces template geometry, child layouts, style references |
| MST-04 | Block preset on used master | Apply preset to in-use master | Blocked notification; user directed to resolve usage |
| MST-05 | Apply theme to theme master | Theme applied at master level | Becomes DEFAULT for all slides (cascade fallback) |
| MST-06 | Apply theme to layout master | Theme applied at layout level | Applies to slides using that layout (if no slide override) |
| MST-07 | Apply theme to slide | Theme applied at slide level | Override for that slide only |
| MST-08 | Reset to inherited | Click reset in PI | Reverts and re-resolves cascade |
| MST-09 | Toggle master mode | Ctrl+Shift+M | Switch between edit and master editing mode |

---

## 20. Themes

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| THM-01 | Apply color theme | Apply at Master/Layout/Slide level | Effective theme resolved via cascade |
| THM-02 | Reset theme | Click reset | Revert to inherited value |
| THM-03 | Thumbnail update on theme change | Theme changed | Thumbnails re-render with new theme |
| THM-04 | Reduced-motion preference | System detects preference | Force transitions to `type: 'none'` |
| THM-05 | Toggle theme manager | Ctrl+Shift+C | Open/close color theme manager panel |

---

## 21. Transitions

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| TRN-01 | Transition on navigate | Navigate to next/previous slide | System resolves effective transition from cascade |
| TRN-02 | Transition execution | During navigation | Outgoing exit + incoming entrance with direction/duration/easing |
| TRN-03 | Supported types | Configuration | None, Cross Fade, Wipe (8-dir), Push/Cover/Uncover (4-dir) |
| TRN-04 | Duration range | Configuration | Clamped [0–5000]ms; default 300ms Cross Fade (ease-in-out) |

---

## 22. Slide Notes

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| NTS-01 | Open notes panel | Click sidebar icon | Floating, resizable panel appears |
| NTS-02 | Toggle panel | Click icon again | Close/reopen panel |
| NTS-03 | Edit notes | Type in editor | Write to slide state immediately |
| NTS-04 | Navigate with panel open | Change slides | Panel stays open, updates to new slide's notes |
| NTS-05 | Formatting | B/I/strikethrough, H1-H3, bullets, numbered, indent/outdent | Rendered accordingly |
| NTS-06 | Remember position | Session | Panel remembers size/location |
| NTS-07 | Empty state | No notes written | Show empty editor (no placeholder HTML) |
| NTS-08 | Notes in presenter view | Presentation with notes | Speaker notes display (audience never sees) |

---

## 23. Presentation Mode

### 23.1 Activation

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| PRS-01 | Start from beginning | Play button or F5 | Full-screen Viewer Mode from slide 1 |
| PRS-02 | Start from current | Shift+F5 or Ctrl+Enter | Start from active slide |
| PRS-03 | Exit presentation | Escape or End Show menu | Restore edit mode + all UI |

### 23.2 Navigation

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| PRS-04 | Next slide | Right arrow, Space, Enter, N, PgDn | Advance slide (or build step) |
| PRS-05 | Previous slide | Left arrow, Backspace, P, PgUp | Go back (or previous build step) |
| PRS-06 | Jump to slide | Number + Enter | Direct jump to slide number |
| PRS-07 | Grid view | G key | Zoomed grid overlay; click to jump |
| PRS-08 | First slide | Home key | Jump to first slide |
| PRS-09 | Last slide | End key | Jump to last slide |
| PRS-10 | Context menu | Right-click | Options: Next, Previous, Jump, End Show |

### 23.3 Interactive Tools

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| PRS-11 | Laser pointer | L toggle | Red trail follows cursor |
| PRS-12 | Black screen | B or `.` toggle | Blank black; toggle to resume |
| PRS-13 | White screen | W or `,` toggle | Blank white; toggle to resume |
| PRS-14 | Hide cursor | H key or auto after 3s | Cursor disappears/auto-hides |

### 23.4 Presenter View

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| PRS-15 | Dual-screen sync | Second display detected | Presenter window: current slide, next preview, notes, timer, progress |
| PRS-16 | Notes display | Presenter view | Notes shown only in presenter window, never audience |

### 23.5 Touch Gestures

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| PRS-17 | Swipe navigation | Swipe left/right | Next/previous slide |
| PRS-18 | Long press laser | Long press on screen | Laser pointer activated |
| PRS-19 | Pinch grid view | Pinch in/out | Grid view enter/exit |

### 23.6 Shortcut Isolation

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| PRS-20 | App shortcuts disabled | Presentation mode active | Editing shortcuts (V, T, R, etc.) do NOT mutate document |

---

## 24. AI Features

### 24.1 Content Copilot

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| AI-01 | Text summarization | Select text → AI icon → "Summarize" | AI shortens to bullet points, preview shown |
| AI-02 | Text expansion | Select text → AI icon → "Expand" | AI elaborates, preview shown |
| AI-03 | Tone shift — professional | AI icon → "Make Professional" | AI rewrites professionally |
| AI-04 | Tone shift — witty | AI icon → "Make Witty" | AI rewrites with humor |
| AI-05 | Tone shift — minimal | AI icon → "Make Minimal" | AI condenses minimally |
| AI-06 | Text translation | AI icon → "Translate" → select language | AI translates to target language |

### 24.2 Design Copilot

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| AI-07 | Auto-layout | Click "Auto-Layout" on multi-element slide | Serialize elements, AI returns coordinates, app applies with animation |

### 24.3 Code-Based Background Generator

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| AI-08 | Open code background prompt | Background panel → "Code Background" | Chat-like prompt input appears |
| AI-09 | Enter background description | Type natural language description | Description entered, awaiting submission |
| AI-10 | Generate code | Submit prompt (Enter or Generate) | AI generates `render(ctx, width, height, time)` function, live preview updates |
| AI-11 | Refine generated code | Type refinement prompt | AI modifies existing code, preview updates |
| AI-12 | View generated code | Click "View Code" | Code editor opens showing AI-generated code |
| AI-13 | Customize generated code | Edit code directly | Changes applied live to background preview |

### 24.4 AI Configuration

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| AI-14 | Open AI settings | Settings → AI Configuration | Configuration options appear |
| AI-15 | Select AI provider | Provider dropdown | Options: OpenAI, Anthropic, Azure AI Foundry, Local LLM |
| AI-16 | Enter API key | Secure input field | API key stored |
| AI-17 | Select model | Model dropdown | Models for selected provider |
| AI-18 | Set custom endpoint | Enter custom Base URL | Subsequent AI requests use custom endpoint |

---

## 25. Collaboration

### 25.1 Presence & Cursors

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| COL-01 | User joins session | Open shared presentation | Presence broadcast via SignalR, cursor assigned |
| COL-02 | Moving cursor | Mouse move during collaboration | Position broadcast ~20/sec via SignalR, 50ms latency |
| COL-03 | User leaves session | Close presentation or disconnect | Leave message broadcast, removed from presence lists |
| COL-04 | View collaborator selection | Collaborator selects element | Selection highlighted with collaborator label |

### 25.2 Real-Time Operations

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| COL-05 | Add shape (broadcast) | Add shape during collab | Operation serialized, sent via SignalR (~100ms) |
| COL-06 | Move element (broadcast) | Drag element during collab | Move operation broadcast, others see element move |
| COL-07 | Delete element (broadcast) | Delete during collab | Delete operation broadcast, others see removal |
| COL-08 | Edit text (broadcast) | Edit text during collab | Character ops broadcast, near real-time sync |
| COL-09 | Change property (broadcast) | Change property during collab | Update broadcast, others see change |
| COL-10 | Upload media (broadcast) | Upload image/video during collab | Media to cloud, reference broadcast, collaborators download |

### 25.3 Offline & Sync

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| COL-11 | Disconnect during edit | Network lost during editing | Local edits continue (draft recovery), OT merge on reconnect |
| COL-12 | Reconnect after offline | Reconnect with local edits | OT resolves conflicts, per-user undo maintained |

---

## 26. Column System & Layout Guides

### 26.1 Configuration

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| COL-SYS-01 | Open layout guide section | Master view → no element selected | "Layout guide" section in PI |
| COL-SYS-02 | Set linked margin | Enter margin value (linked mode) | All 4 margins set to same value |
| COL-SYS-03 | Unlink margins | Click unlink icon | Controls expand to Left/Top/Right/Bottom separately |
| COL-SYS-04 | Set individual margins | Enter per-side values (unlinked) | Each margin edge positioned independently |
| COL-SYS-05 | Set column count | Enter column count (e.g., 4) | Columns rendered within content bounds |
| COL-SYS-06 | Set gutter width | Enter gutter value (e.g., 30) | Spacing applied between adjacent columns |
| COL-SYS-07 | Set guide color | Click color picker | Guide overlay rendered in selected color |
| COL-SYS-08 | Set guide opacity | Adjust opacity slider | Opacity applied to guide overlay |
| COL-SYS-09 | Inherit guide from master | Create slide inheriting from master | Layout guide settings inherited, rendered on slide |
| COL-SYS-10 | Override at layout level | Layout master → adjust column count | This layout's slides use overridden value |

### 26.2 Visibility

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| COL-SYS-11 | Toggle guide visibility | Viewport controls → toggle button | Guide overlay shown/hidden |

### 26.3 Snapping Integration

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| COL-SYS-12 | Open snapping options | Viewport controls → snapping button | Flyout panel opens |
| COL-SYS-13 | Enable snap to objects | Toggle "Snap to Object" ON | Dragging snaps to nearby objects |
| COL-SYS-14 | Enable snap to slide | Toggle "Snap to slide" ON | Snap to slide edges, center, margins |
| COL-SYS-15 | Enable snap to columns | Toggle "Snap to columns" ON | Snap to column edges and centers |
| COL-SYS-16 | Drag with column snap | "Snap to columns" ON → drag element | Element snaps to column edges at 5px threshold |
| COL-SYS-17 | Drag with margin snap | "Snap to slide" ON → drag near margin | Element snaps to margin edge |
| COL-SYS-18 | Snap with multiple candidates | Drag near multiple targets | Deterministic tie-break applied |

---

## 27. Keyboard Shortcuts

### 27.1 Tool Selection

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| KEY-01 | Select tool | V key | Activate selection/move tool, arrow cursor |
| KEY-02 | Hand tool | H key | Activate pan tool, grab cursor |
| KEY-03 | Text tool | T key | Activate text creation, crosshair cursor |
| KEY-04 | Rectangle tool | R key | Activate rectangle creation |
| KEY-05 | Ellipse tool | O key | Activate ellipse tool |
| KEY-06 | Line tool | L key | Activate line tool |
| KEY-07 | Arrow tool | Shift+L | Activate arrow tool |
| KEY-08 | Polygon tool | Shift+P | Activate polygon tool |
| KEY-09 | Star tool | Shift+S | Activate star tool |
| KEY-10 | Image tool | Shift+K | Activate image placement |
| KEY-11 | Toggle icon library | Shift+I | Open/close icon library panel |

### 27.2 File Operations

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| KEY-12 | New document | Ctrl+N | Create new document |
| KEY-13 | Open document | Ctrl+O | Open file dialog |
| KEY-14 | Save document | Ctrl+S | Save document |
| KEY-15 | Save As | Ctrl+Shift+S | Save with new name |

### 27.3 View Controls

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| KEY-16 | Fit to screen | Ctrl+0 or Shift+1 | Zoom and pan to fit slide |
| KEY-17 | Zoom 100% | Ctrl+1 | Reset zoom to 100% |
| KEY-18 | Zoom in | Ctrl+`+` | Increase zoom level |
| KEY-19 | Zoom out | Ctrl+`-` | Decrease zoom level |
| KEY-20 | Toggle grid | Ctrl+`'` | Show/hide grid overlay |
| KEY-21 | Toggle guides | Ctrl+`;` | Show/hide alignment guides |
| KEY-22 | Toggle rulers | Ctrl+R | Show/hide rulers |

### 27.4 Element Operations

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| KEY-23 | Lock selection | Ctrl+L | Lock selected elements |
| KEY-24 | Unlock all | Ctrl+Shift+L | Unlock all elements on slide |
| KEY-25 | Copy as PNG | Ctrl+Shift+C | Copy selected as PNG image |

### 27.5 Panel Toggles

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| KEY-26 | Toggle master mode | Ctrl+Shift+M | Switch edit/master mode |
| KEY-27 | Toggle theme manager | Ctrl+Shift+C | Open/close theme manager |
| KEY-28 | Toggle typography manager | Ctrl+Shift+T | Open/close typography styles |
| KEY-29 | Toggle code fill panel | Ctrl+Shift+K | Open/close code fill panel |
| KEY-30 | Open settings | Ctrl+, | Open application settings |

### 27.6 Shortcut Context Priority

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| KEY-31 | Suppress during text edit | App shortcut + text input focused | Shortcuts DISABLED except Ctrl+Z/Y, Ctrl+C/V/X, Ctrl+A, Arrows |
| KEY-32 | Allow text editing shortcuts | Text edit mode active | Ctrl+Z/Y, Ctrl+C/V/X, Ctrl+A, arrows pass through |
| KEY-33 | Escape from text input | Escape with input focused | Blur input, return focus to canvas, re-enable shortcuts |
| KEY-34 | Context priority | Multiple contexts active | Priority: Modals > Menus > Text Edit > Presentation > Panels > Canvas > Global |

### 27.7 Menu Navigation

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| KEY-35 | Navigate up | Arrow Up (menu open) | Focus previous menu item |
| KEY-36 | Navigate down | Arrow Down (menu open) | Focus next menu item |
| KEY-37 | Open submenu | Arrow Right (menu open) | Open focused submenu |
| KEY-38 | Close submenu | Arrow Left (menu open) | Close submenu, return to parent |
| KEY-39 | Activate item | Enter/Space (menu focused) | Execute menu action |
| KEY-40 | Typeahead | A-Z (menu open) | Jump to first item starting with letter |
| KEY-41 | Close menus | Escape | Close all menus |
| KEY-42 | Close modal | Escape (modal open) | Close modal dialog |

---

## 28. File Operations

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| FILE-01 | Save to cloud | Initiate save | Cloud browser or SaveToCloudModal appears |
| FILE-02 | Sign in to provider | First-time or expired auth | OAuth flow triggered |
| FILE-03 | Select cloud location | Save dialog | User picks destination folder |
| FILE-04 | View file settings | Menu | Pill/menu shows save state and provider |
| FILE-05 | File browser navigate up | Backspace (file browser, not in input) | Navigate up one directory level |

---

## 29. Cursor Behavior

| ID | Taskflow | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| CUR-01 | Hover text element | Mouse over text on canvas (object mode) | Cursor changes to text I-beam |
| CUR-02 | Hover resize handle | Mouse over handle | Cursor changes to directional resize (rotated for rotated elements) |
| CUR-03 | Hover rotation handle | Mouse over rotation handle | Cursor changes to grab |
| CUR-04 | Hover empty canvas | Mouse over background | Cursor remains default arrow |
| CUR-05 | Hover locked element | Mouse over locked element | Cursor shows "not-allowed" |
| CUR-06 | Hover hidden element | Element hidden in layer tree | Element unselectable/unhoverable on canvas |

---

## Summary

| Category | Count |
|----------|-------|
| Selection & Hit-Testing | 13 |
| Viewport & Navigation | 11 |
| Element Creation | 14 |
| Element Movement & Dragging | 11 |
| Element Resize | 12 |
| Element Rotation | 4 |
| Text Editing | 78 |
| Context Menu | 28 |
| Layer Management | 17 |
| Undo / Redo | 15 |
| Property Inspector | 36 |
| Numeric Input Interaction | 16 |
| Snapping & Alignment | 10 |
| Fills System | 18 |
| Typography Styles | 9 |
| Color Picker | 3 |
| Shapes | 17 |
| Slide Management | 6 |
| Master Slides & Layouts | 9 |
| Themes | 5 |
| Transitions | 4 |
| Slide Notes | 8 |
| Presentation Mode | 20 |
| AI Features | 18 |
| Collaboration | 12 |
| Column System & Layout Guides | 18 |
| Keyboard Shortcuts | 42 |
| File Operations | 5 |
| Cursor Behavior | 6 |
| **TOTAL** | **409** |
