# 29 — Keyboard Shortcuts

> Complete catalog of every keyboard shortcut across all contexts.

## Tool Shortcuts

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| KEY-01 | Select tool | `V` | Switch to select/move tool | `SET_TOOL('select')` |
| KEY-02 | Hand tool | `H` | Switch to pan/hand tool | `SET_TOOL('hand')` |
| KEY-03 | Text tool | `T` | Switch to text creation tool | `SET_TOOL('text')` |
| KEY-04 | Rectangle tool | `R` | Switch to rectangle shape tool | `SET_TOOL('rectangle')` |
| KEY-05 | Ellipse tool | `O` | Switch to ellipse shape tool | `SET_TOOL('ellipse')` |
| KEY-06 | Line tool | `L` | Switch to line tool | `SET_TOOL('line')` |
| KEY-07 | Arrow tool | `Shift+L` | Switch to arrow (line with endcap) | `SET_TOOL('arrow')` |
| KEY-08 | Toggle resources | `Shift+I` | Toggle icon/asset library panel | — |
| KEY-09 | Image tool | `Shift+K` | Switch to image insertion tool | `SET_TOOL('image')` |

## Edit Shortcuts

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| KEY-10 | Undo | `Ctrl+Z` | Undo last action | `UNDO` |
| KEY-11 | Redo | `Ctrl+Shift+Z` / `Ctrl+Y` | Redo undone action | `REDO` |
| KEY-12 | Cut | `Ctrl+X` | Cut selected elements | `CUT_ELEMENTS` |
| KEY-13 | Copy | `Ctrl+C` | Copy selected elements | `COPY_ELEMENTS` |
| KEY-14 | Paste | `Ctrl+V` | Paste from clipboard | `PASTE_ELEMENTS` |
| KEY-15 | Paste in place | `Ctrl+Shift+V` | Paste at original position | `PASTE_ELEMENTS_IN_PLACE` |
| KEY-16 | Duplicate | `Ctrl+D` | Duplicate selected elements | `DUPLICATE_ELEMENTS` |
| KEY-17 | Delete | `Delete` / `Backspace` | Delete selected elements | `DELETE_ELEMENTS` |
| KEY-18 | Select all | `Ctrl+A` | Select all elements on slide | `UPDATE_SELECTION` |
| KEY-19 | Deselect all | `Escape` | Clear selection | `UPDATE_SELECTION([])` |

## Arrange Shortcuts

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| KEY-20 | Bring to front | `Ctrl+Shift+]` | Move to top of z-order | `REORDER_ELEMENTS` |
| KEY-21 | Bring forward | `Ctrl+]` | Move up one step | `REORDER_ELEMENTS` |
| KEY-22 | Send backward | `Ctrl+[` | Move down one step | `REORDER_ELEMENTS` |
| KEY-23 | Send to back | `Ctrl+Shift+[` | Move to bottom of z-order | `REORDER_ELEMENTS` |
| KEY-24 | Group | `Ctrl+G` | Group selected elements | `GROUP_ELEMENTS` |
| KEY-25 | Ungroup | `Ctrl+Shift+G` | Ungroup selected group | `UNGROUP_ELEMENTS` |
| KEY-26 | Lock | `Ctrl+L` | Lock selected element | `TOGGLE_ELEMENT_LOCK` |
| KEY-27 | Unlock all | `Ctrl+Shift+L` | Unlock all elements | — |

## View Shortcuts

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| KEY-28 | Zoom in | `Ctrl++` | Increase zoom level | — |
| KEY-29 | Zoom out | `Ctrl+-` | Decrease zoom level | — |
| KEY-30 | Fit to screen | `Ctrl+0` | Fit slide to viewport | — |
| KEY-31 | Actual size | `Ctrl+1` | Zoom to 100% | — |
| KEY-32 | Show grid | `Ctrl+'` | Toggle grid overlay | — |
| KEY-33 | Show guides | `Ctrl+;` | Toggle column/layout guides | `TOGGLE_LAYOUT_GUIDES` |
| KEY-34 | Show rulers | `Ctrl+R` | Toggle ruler display | — |

## File Shortcuts

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| KEY-35 | New presentation | `Ctrl+N` | Create new presentation | — |
| KEY-36 | Open file | `Ctrl+O` | Open file picker | — |
| KEY-37 | Save | `Ctrl+S` | Save current presentation | — |
| KEY-38 | Save as | `Ctrl+Shift+S` | Save with new name/location | — |

## Slide Shortcuts

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| KEY-39 | New slide | `Ctrl+M` | Add new slide after current | `ADD_SLIDE` |
| KEY-40 | Duplicate slide | `Ctrl+Shift+D` | Duplicate current slide | `DUPLICATE_SLIDE` |
| KEY-41 | Delete slide | `Ctrl+Backspace` | Delete current slide | `DELETE_SLIDE` |
| KEY-42 | Move slide up | `Ctrl+ArrowUp` | Reorder slide earlier | `REORDER_SLIDES` |
| KEY-43 | Move slide down | `Ctrl+ArrowDown` | Reorder slide later | `REORDER_SLIDES` |

## Panel Shortcuts

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| KEY-44 | Color theme manager | `Ctrl+Shift+C` | Toggle color theme panel | — |
| KEY-45 | Typography manager | `Ctrl+Shift+T` | Toggle typography style panel | — |
| KEY-46 | Code fill panel | `Ctrl+Shift+K` | Toggle code fill expanded editor | — |

## Presentation Shortcuts

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| KEY-47 | Start from beginning | `Ctrl+Enter` | Enter presentation from slide 1 | `SET_MODE('presentation')` |
| KEY-48 | Start from current | `Ctrl+Shift+Enter` | Enter presentation from active slide | `SET_MODE('presentation')` |

## Text Editing Shortcuts (in edit mode)

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| KEY-49 | Bold | `Ctrl+B` | Toggle bold on selection | — |
| KEY-50 | Italic | `Ctrl+I` | Toggle italic on selection | — |
| KEY-51 | Underline | `Ctrl+U` | Toggle underline on selection | — |
| KEY-52 | Strikethrough | `Ctrl+Shift+X` | Toggle strikethrough on selection | — |
| KEY-53 | Create link | `Ctrl+K` | Prompt for URL, create link on selection | — |
| KEY-54 | Exit text edit (no save) | `Escape` | Exit without saving | `EXIT_TEXT_EDIT` |
| KEY-55 | Exit text edit (save) | `Ctrl+Enter` | Exit with save | `SAVE_TEXT_CONTENT` → `EXIT_TEXT_EDIT` |

## Help / Settings

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| KEY-56 | Keyboard shortcuts overlay | `?` or `Ctrl+/` | Toggle shortcuts reference overlay | — |
| KEY-57 | Settings | `Ctrl+,` | Open settings panel | — |

## Input Blocking

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| KEY-58 | Block shortcuts in inputs | Focus on `<input>`, `<textarea>`, `<select>`, or `contentEditable` | All global shortcuts blocked except `Ctrl+/` | — |
