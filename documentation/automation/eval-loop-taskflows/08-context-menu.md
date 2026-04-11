# 08 — Context Menu

> Taskflows for all context menu zones, items, keyboard navigation, and submenu behavior.

## Canvas Empty Zone

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| CTX-01 | Open canvas empty menu | Right-click on empty canvas area | Menu shows Paste, Select All, Insert submenu | — |
| CTX-02 | Paste from empty canvas | Canvas empty menu → Paste (Ctrl+V) | Paste element from `window.elementClipboard`; disabled if no clipboard | `PASTE_ELEMENTS` |
| CTX-03 | Select all from canvas | Canvas empty menu → Select All (Ctrl+A) | All slide elements selected | `UPDATE_SELECTION` |
| CTX-04 | Insert text from menu | Canvas empty → Insert → Text (T) | Activates text tool | `SET_TOOL('text')` |
| CTX-05 | Insert rectangle from menu | Canvas empty → Insert → Rectangle (R) | Activates rectangle tool | `SET_TOOL('rectangle')` |
| CTX-06 | Insert ellipse from menu | Canvas empty → Insert → Ellipse (O) | Activates ellipse tool | `SET_TOOL('ellipse')` |
| CTX-07 | Insert line from menu | Canvas empty → Insert → Line (L) | Activates line tool | `SET_TOOL('line')` |

## Canvas Element Zone

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| CTX-08 | Open element context menu | Right-click on selected element | Menu shows clipboard ops, arrange, align, lock, visibility | — |
| CTX-09 | Cut element | Element menu → Cut (Ctrl+X) | Element copied to clipboard and deleted | `CUT_ELEMENTS` |
| CTX-10 | Copy element | Element menu → Copy (Ctrl+C) | Element copied to clipboard | `COPY_ELEMENTS` |
| CTX-11 | Paste on element | Element menu → Paste (Ctrl+V) | Paste from clipboard; disabled if empty | `PASTE_ELEMENTS` |
| CTX-12 | Duplicate element | Element menu → Duplicate (Ctrl+D) | Clone element with offset | `DUPLICATE_ELEMENTS` |
| CTX-13 | Delete element | Element menu → Delete (Del) | Element removed; danger-styled item | `DELETE_ELEMENTS` |
| CTX-14 | Group elements | Element menu → Group (Ctrl+G) | Selected elements wrapped in group | `GROUP_ELEMENTS` |
| CTX-15 | Ungroup | Element menu → Ungroup (Ctrl+Shift+G) | Group dissolved, children promoted | `UNGROUP_ELEMENTS` |
| CTX-16 | Bring to front | Element menu → Arrange → Bring to Front (Ctrl+Shift+]) | Element moved to top of z-order | `REORDER_ELEMENTS` |
| CTX-17 | Bring forward | Element menu → Arrange → Bring Forward (Ctrl+]) | Element moved up one step | `REORDER_ELEMENTS` |
| CTX-18 | Send backward | Element menu → Arrange → Send Backward (Ctrl+[) | Element moved down one step | `REORDER_ELEMENTS` |
| CTX-19 | Send to back | Element menu → Arrange → Send to Back (Ctrl+Shift+[) | Element moved to bottom of z-order | `REORDER_ELEMENTS` |
| CTX-20 | Align left | Element menu → Align → Left | Selected elements aligned to leftmost | `ALIGN_ELEMENTS` |
| CTX-21 | Align center | Element menu → Align → Center | Horizontal center alignment | `ALIGN_ELEMENTS` |
| CTX-22 | Align right | Element menu → Align → Right | Right-edge alignment | `ALIGN_ELEMENTS` |
| CTX-23 | Align top | Element menu → Align → Top | Top-edge alignment | `ALIGN_ELEMENTS` |
| CTX-24 | Align middle | Element menu → Align → Middle | Vertical center alignment | `ALIGN_ELEMENTS` |
| CTX-25 | Align bottom | Element menu → Align → Bottom | Bottom-edge alignment | `ALIGN_ELEMENTS` |
| CTX-26 | Lock element | Element menu → Lock (Ctrl+Shift+L) | Element locked; label toggles to "Unlock" | `TOGGLE_ELEMENT_LOCK` |
| CTX-27 | Hide element | Element menu → Hide (Ctrl+Shift+H) | Element hidden; label toggles to "Show" | `TOGGLE_ELEMENT_VISIBILITY` |
| CTX-28 | Reset placeholder | Element menu → Reset to Placeholder | Hidden if not placeholder; resets to master content | `RESET_PLACEHOLDER` |

## Canvas Text Editing Zone

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| CTX-29 | Open text editing menu | Right-click while in text edit mode | Text-specific menu: clipboard, formatting, alignment, links | — |
| CTX-30 | Cut text | Text edit menu → Cut (Ctrl+X) | `execCommand('cut')` | — |
| CTX-31 | Copy text | Text edit menu → Copy (Ctrl+C) | `execCommand('copy')` | — |
| CTX-32 | Paste text | Text edit menu → Paste (Ctrl+V) | Paste with sanitization | — |
| CTX-33 | Bold from menu | Text edit menu → Bold (Ctrl+B) | `execCommand('bold')` | — |
| CTX-34 | Italic from menu | Text edit menu → Italic (Ctrl+I) | `execCommand('italic')` | — |
| CTX-35 | Underline from menu | Text edit menu → Underline (Ctrl+U) | `execCommand('underline')` | — |
| CTX-36 | Strikethrough from menu | Text edit menu → Strikethrough | `execCommand('strikeThrough')` | — |
| CTX-37 | Create link from menu | Text edit menu → Create Link (Ctrl+K) | Prompts for URL → `execCommand('createLink')` | — |
| CTX-38 | Exit editing from menu | Text edit menu → Exit Text Editing (Escape) | Exits text edit mode | `EXIT_TEXT_EDIT` |

## Layer Item Zone

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| CTX-39 | Open layer context menu | Right-click on layer tree row | Menu shows rename, delete, lock, visibility, placeholder actions | — |
| CTX-40 | Rename from layer menu | Layer menu → Rename (Enter) | Triggers inline rename on layer row | — |
| CTX-41 | Delete from layer menu | Layer menu → Delete (Del) | Element deleted; danger style | `DELETE_ELEMENTS` |
| CTX-42 | Lock from layer menu | Layer menu → Lock/Unlock (Ctrl+L) | Toggle lock state | `TOGGLE_ELEMENT_LOCK` |
| CTX-43 | Visibility from layer menu | Layer menu → Show/Hide (Ctrl+H) | Toggle visibility | `TOGGLE_ELEMENT_VISIBILITY` |
| CTX-44 | Edit placeholder from layer | Layer menu → Edit Placeholder (inherited) | Instantiate placeholder and enter edit | `INSTANTIATE_PLACEHOLDER` |
| CTX-45 | Reset to master from layer | Layer menu → Reset to Master (user content) | Reset placeholder to master state | `RESET_PLACEHOLDER` |
| CTX-46 | Toggle placeholder visibility | Layer menu → Show/Hide Placeholder | Toggle placeholder element visibility | `TOGGLE_ELEMENT_VISIBILITY` |

## Slide Thumbnail Zone

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| CTX-47 | Open slide context menu | Right-click on slide thumbnail | Slide management options | — |
| CTX-48 | Add slide above | Slide menu → Add Slide Above | New slide inserted before current | `ADD_SLIDE` |
| CTX-49 | Add slide below | Slide menu → Add Slide Below | New slide inserted after current | `ADD_SLIDE` |
| CTX-50 | Duplicate slide | Slide menu → Duplicate (Ctrl+D) | Clone slide with all elements | `DUPLICATE_SLIDE` |
| CTX-51 | Cut slide | Slide menu → Cut (Ctrl+X) | Slide copied and removed | `CUT_SLIDE` |
| CTX-52 | Copy slide | Slide menu → Copy (Ctrl+C) | Slide data copied | `COPY_SLIDE` |
| CTX-53 | Paste slide | Slide menu → Paste (Ctrl+V) | Paste slide from clipboard | `PASTE_SLIDE` |
| CTX-54 | Change layout | Slide menu → Change Layout → [layout] | Apply layout to slide; checkmark on current | `CHANGE_SLIDE_LAYOUT` |
| CTX-55 | Rename slide | Slide menu → Rename (F2) | Inline rename | — |
| CTX-56 | Delete slide | Slide menu → Delete (Del) | Remove slide; disabled if only 1 slide; danger style | `DELETE_SLIDE` |

## Fill Layer Zone

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| CTX-57 | Move fill up | Fill layer menu → Move Up | Reorder fill in stack | `REORDER_FILL` |
| CTX-58 | Move fill down | Fill layer menu → Move Down | Reorder fill in stack | `REORDER_FILL` |
| CTX-59 | Duplicate fill | Fill layer menu → Duplicate (Ctrl+D) | Clone fill entry | `DUPLICATE_FILL` |
| CTX-60 | Delete fill | Fill layer menu → Delete (Del) | Remove fill; danger style | `DELETE_FILL` |

## Fill Preset Zone

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| CTX-61 | Rename fill preset | Fill preset menu → Rename | Inline rename | — |
| CTX-62 | Duplicate fill preset | Fill preset menu → Duplicate | Clone preset | — |
| CTX-63 | Delete fill preset | Fill preset menu → Delete | Remove preset; danger style | — |

## Asset Icon Zone

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| CTX-64 | Insert icon | Asset icon menu → Insert Icon | Add icon element to canvas | `ADD_ELEMENT` |
| CTX-65 | Copy icon class | Asset icon menu → Copy Icon Class | Copy Font Awesome class to clipboard | — |

## Asset Image Zone

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| CTX-66 | Insert image | Asset image menu → Insert Image | Add image element to canvas | `ADD_ELEMENT` |
| CTX-67 | Copy image URL | Asset image menu → Copy Image URL | Copy URL to clipboard | — |
| CTX-68 | Download image | Asset image menu → Download | Download image file | — |

## Keyboard Navigation

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| CTX-69 | Navigate down | ArrowDown in open menu | Focus next non-separator, non-disabled item; wraps to first | — |
| CTX-70 | Navigate up | ArrowUp in open menu | Focus previous item; wraps to last | — |
| CTX-71 | Open submenu | ArrowRight on item with submenu | Child submenu opens adjacent | — |
| CTX-72 | Close submenu | ArrowLeft in submenu | Returns focus to parent menu item | — |
| CTX-73 | Activate item | Enter or Space on focused item | Fire item action and close menu | — |
| CTX-74 | Close menu | Escape on root menu | Close entire context menu | — |
| CTX-75 | Close submenu only | Escape on open submenu | Close submenu, return to parent | — |
| CTX-76 | Focus first item | Home key in menu | Jump to first menu item | — |
| CTX-77 | Focus last item | End key in menu | Jump to last menu item | — |
| CTX-78 | Type-ahead | Type single character in menu | Focus first item starting with that character; cycles on repeat | — |

## Menu Rendering

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| CTX-79 | Filter invisible items | Menu builds with `visible:false` items | Hidden items removed; consecutive/leading/trailing separators cleaned | — |
| CTX-80 | Submenu hover delay | Hover over item with submenu | `scheduleSubmenu()` delay before opening; only one submenu at a time | — |
| CTX-81 | Viewport flip | Submenu would overflow right edge | Position flips horizontally | — |
| CTX-82 | ARIA attributes | Menu renders | `role="menu"`, `role="menuitem"`, `role="separator"`, `aria-disabled`, `aria-haspopup`, `aria-expanded` | — |
