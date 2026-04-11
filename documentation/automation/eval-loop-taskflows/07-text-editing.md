# 07 — Text Editing

> Taskflows for text creation, edit-mode entry/exit, selection, formatting, lists, clipboard, placeholder handling, and IME composition.

## Edit Mode Entry

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| TXT-01 | Enter edit mode by double-click | Double-click text element | contentEditable=true, caret placed at click position via `caretRangeFromPoint` | `ENTER_TEXT_EDIT` |
| TXT-02 | Enter edit mode by Enter key | Press Enter with single text selected | contentEditable=true, ALL content selected | `ENTER_TEXT_EDIT` |
| TXT-03 | Type-to-edit | Type any character with single text selected | Replace content with typed character, caret at end | `ENTER_TEXT_EDIT` |
| TXT-04 | Text tool click creates element | Click canvas with text tool active | New text element created at click position, enters edit mode, all selected; if no input before exit → element deleted | `ADD_ELEMENT` → `ENTER_TEXT_EDIT` |
| TXT-05 | Text tool drag creates sized element | Click-drag on canvas with text tool | New text element with drawn dimensions, `resizing: 'fixedWidth'` | `ADD_ELEMENT` → `ENTER_TEXT_EDIT` |
| TXT-06 | Edit placeholder from context menu | Right-click inherited placeholder → "Edit Placeholder" | `INSTANTIATE_PLACEHOLDER` dispatched first, then enters edit, all selected | `INSTANTIATE_PLACEHOLDER` → `ENTER_TEXT_EDIT` |
| TXT-07 | Double-click inherited placeholder | Double-click inherited placeholder element | `INSTANTIATE_PLACEHOLDER` then enters edit, caret at click position | `INSTANTIATE_PLACEHOLDER` → `ENTER_TEXT_EDIT` |

## Edit Mode Exit

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| TXT-08 | Exit without saving | Press Escape in edit mode | Exit edit, contentEditable=false, changes discarded | `EXIT_TEXT_EDIT` |
| TXT-09 | Exit with save | Press Ctrl+Enter in edit mode | Exit edit, content saved | `SAVE_TEXT_CONTENT` → `EXIT_TEXT_EDIT` |
| TXT-10 | Exit by clicking canvas | Click empty canvas area while editing | Exit edit after 100ms timeout (allows click handlers to run) | `SAVE_TEXT_CONTENT` → `EXIT_TEXT_EDIT` |
| TXT-11 | Exit by clicking another element | Click different element while editing | Exit current edit, save, select new element | `SAVE_TEXT_CONTENT` → `EXIT_TEXT_EDIT` → `UPDATE_SELECTION` |
| TXT-12 | Tab to next element | Press Tab (not in list context) | Exit edit mode, select next element via `_selectAdjacentElement('next')` | `EXIT_TEXT_EDIT` → `UPDATE_SELECTION` |
| TXT-13 | Stay editing when PI focused | Click on Property Inspector control | Edit mode persists; caret position saved via `selectionManager.save()` | — |
| TXT-14 | Stay editing when toolbar focused | Click on toolbar button | Edit mode persists; caret position saved | — |
| TXT-15 | Empty non-placeholder deleted on exit | Exit edit mode when text is empty (non-placeholder) | Element automatically deleted | `DELETE_ELEMENTS` |
| TXT-16 | Empty placeholder shows prompt | Exit edit mode when placeholder text is empty | Restores prompt text ("Click to add title"), `hasUserContent: false` | `SAVE_TEXT_CONTENT` |
| TXT-17 | IME blocks exit | Press Escape during IME composition | Exit blocked; `isCompositionInProgress()` returns true | — |

## Text Selection

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| TXT-18 | Place caret by click | Single click in edit mode | Caret placed at click position using `caretRangeFromPoint` | — |
| TXT-19 | Select word | Double-click word in edit mode | Word selected (native browser behavior on contentEditable) | — |
| TXT-20 | Select paragraph | Triple-click in edit mode | Paragraph selected (native browser behavior) | — |
| TXT-21 | Select all | Ctrl+A in edit mode | All content selected (native browser behavior) | — |
| TXT-22 | Extend selection | Shift+Arrow keys in edit mode | Selection extended character by character (native) | — |
| TXT-23 | Extend selection by word | Ctrl+Shift+Arrow in edit mode | Selection extended word by word (native) | — |
| TXT-24 | Save/restore selection on PI focus | Focus moves to PI → returns to text | Selection saved as node paths; restored when focus returns | — |

## Inline Formatting

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| TXT-25 | Apply bold | Ctrl+B in edit mode | `execCommand('bold')` on selection | — |
| TXT-26 | Apply italic | Ctrl+I in edit mode | `execCommand('italic')` on selection | — |
| TXT-27 | Apply underline | Ctrl+U in edit mode | `execCommand('underline')` on selection | — |
| TXT-28 | Apply strikethrough | Ctrl+Shift+X in edit mode | `execCommand('strikeThrough')` on selection | — |
| TXT-29 | Toggle bold off | Ctrl+B on already-bold text | Bold removed (execCommand toggles) | — |
| TXT-30 | Query active formats | Selection changes in edit mode | `queryCommandState()` for bold/italic/underline/strikethrough; PI reflects state | — |
| TXT-31 | Apply bold from context menu | Right-click → Bold in text edit context menu | Same as Ctrl+B | — |
| TXT-32 | Apply format from PI | Click B/I/U button in Text section of PI | `applyFormat()` called; caret/selection restored from saved position | — |
| TXT-33 | Create link | Ctrl+K in edit mode | `prompt('Enter URL:')` → `execCommand('createLink', false, url)` | — |

## Text Alignment

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| TXT-34 | Align left | Context menu → Text Align → Left | `execCommand('justifyLeft')` | — |
| TXT-35 | Align center | Context menu → Text Align → Center | `execCommand('justifyCenter')` | — |
| TXT-36 | Align right | Context menu → Text Align → Right | `execCommand('justifyRight')` | — |
| TXT-37 | Justify | Context menu → Text Align → Justify | `execCommand('justifyFull')` | — |

## List Handling

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| TXT-38 | Apply bullet list | PI list style → bullet | `execCommand('insertUnorderedList')` | — |
| TXT-39 | Apply numbered list | PI list style → numbered | `execCommand('insertOrderedList')` | — |
| TXT-40 | Remove list | PI list style → none | Toggle off current list type | — |
| TXT-41 | Auto-detect bullet | Type `- ` or `* ` at line start | Auto-converts to `<ul>` | — |
| TXT-42 | Auto-detect numbered | Type `1. ` at line start | Auto-converts to `<ol>` | — |
| TXT-43 | Auto-detect alpha | Type `a. ` or `A. ` at line start | Auto-converts to `<ol>` | — |
| TXT-44 | Indent list item | Tab inside list item | Nests item one level deeper | — |
| TXT-45 | Outdent list item | Shift+Tab inside list item | Unnests item one level | — |
| TXT-46 | Exit list on empty enter | Press Enter on empty list item | Exits list, creates plain paragraph | — |
| TXT-47 | Backspace at list item start | Backspace at start of list item | Special handling via `_handleBackspaceInList()` | — |

## Clipboard Operations

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| TXT-48 | Paste plain text | Ctrl+V (ENABLE_RICH_PASTE=false) | `getData('text/plain')` → `execCommand('insertText')` | — |
| TXT-49 | Paste rich HTML | Ctrl+V (ENABLE_RICH_PASTE=true) | `getData('text/html')` → sanitize → `execCommand('insertHTML')` | — |
| TXT-50 | Paste fallback | Ctrl+V when no HTML in clipboard | `getData('text/plain')`, `\n`→`<br>`, sanitize, insert | — |
| TXT-51 | Paste sanitization | Paste content with scripts/events | Dangerous elements/attributes stripped; allowed: p,div,br,b,strong,i,em,u,s,del,sub,sup,span,ul,ol,li | — |
| TXT-52 | Paste max nesting | Paste deeply nested HTML (>10 levels) | Content flattened at MAX_NESTED_TAGS=10 | — |
| TXT-53 | Paste link validation | Paste content with `javascript:` links | Blocked; only http/https/mailto/relative allowed | — |
| TXT-54 | Cut text | Ctrl+X in edit mode | Selected text cut (native browser) | — |
| TXT-55 | Copy text | Ctrl+C in edit mode | Selected text copied (native browser) | — |

## Resizing Modes

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| TXT-56 | Auto-size mode | PI Layout → auto-size button | Width and height grow to fit content | `UPDATE_ELEMENT({resizing: 'autoSize'})` |
| TXT-57 | Fixed-width mode | PI Layout → fixed-width button (default) | Width fixed, height auto-grows | `UPDATE_ELEMENT({resizing: 'fixedWidth'})` |
| TXT-58 | Fixed mode | Resize with height handle | Both dimensions fixed; mode changed on resize | `UPDATE_ELEMENT({resizing: 'fixed'})` |
| TXT-59 | Resize converts to fixed | Drag any handle that includes height | `resizing` changes from `fixedWidth` to `fixed` | `UPDATE_ELEMENT({resizing: 'fixed', width, height})` |

## Placeholder System

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| TXT-60 | Placeholder shows prompt text | View empty placeholder element | Displays type-specific prompt: "Click to add title", "Click to add subtitle", etc. | — |
| TXT-61 | Prompt cleared on edit entry | Enter edit mode on placeholder | DOM content cleared if just prompt text (`_wasEmpty: true`) | — |
| TXT-62 | Prompt restored on empty exit | Exit edit with empty content on placeholder | Prompt text restored, `hasUserContent: false` | `SAVE_TEXT_CONTENT` |
| TXT-63 | User content marks placeholder | Type content in placeholder and exit | `hasUserContent: true` | `SAVE_TEXT_CONTENT` |
| TXT-64 | Reset to master | Context menu → "Reset to Master" | Clears user content, restores master styles | `RESET_PLACEHOLDER` |
| TXT-65 | Placeholder type prompts | Various placeholder types | title→"Click to add title", subtitle→"Click to add subtitle", body/text→"Click to add text", date→"Date", slideNumber→"#", footer→"Footer text" | — |

## IME Composition

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| TXT-66 | IME composition start | Begin typing with CJK/complex input method | `isCompositionInProgress()` = true; blocks exit/format/undo | — |
| TXT-67 | IME blocks formatting | Ctrl+B during composition | Action blocked via `shouldBlockAction()` | — |
| TXT-68 | IME blocks exit | Escape during composition | Exit blocked; composition must finish first | — |
| TXT-69 | IME composition end | Select character from IME candidate | Composition ends; normal editing resumes | — |
| TXT-70 | Force end composition | Edge case requiring forced IME end | `forceEndComposition()` called | — |

## Undo/Redo in Text Edit

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| TXT-71 | Text undo (browser-native) | Ctrl+Z in edit mode | Browser handles contentEditable undo; `stopPropagation` prevents app undo | — |
| TXT-72 | Text redo (browser-native) | Ctrl+Y or Ctrl+Shift+Z in edit mode | Browser handles contentEditable redo | — |
| TXT-73 | Session collapses to one undo | Enter edit → make changes → exit | Entire edit session = one `pushTextEdit()` entry in HistoryManager | `pushTextEdit` |
| TXT-74 | Cancel session discards | Cancel text edit session | `historyBridge.cancelSession()` restores original state | — |

## Content Debounce & Auto-Save

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| TXT-75 | Debounced content save | Input event during editing | Content saved every 500ms via `text-content-save` event | `MARK_TEXT_DIRTY` |
| TXT-76 | Dirty flag on change | Any content change in edit mode | `historyBridge.markDirty()` sets dirty flag | — |
| TXT-77 | No-op save on unchanged | Exit edit with no actual changes | `pushTextEdit` skipped; string comparison detects no diff | — |

## Content Safety

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| TXT-78 | Strip event handlers on paste | Paste HTML with `onclick`, `onerror` etc. | All `on*` attributes removed by sanitizer | — |
| TXT-79 | Block javascript: URLs | Paste link with `javascript:` protocol | Link blocked; allowed: http, https, mailto, relative | — |
| TXT-80 | Block data: URLs | Paste link with `data:` protocol | Link blocked | — |
| TXT-81 | Strip dangerous CSS | Paste styled content with `expression()`, `url()` | Dangerous CSS values removed | — |
| TXT-82 | Unwrap disallowed elements | Paste `<script>`, `<iframe>`, `<form>` etc. | Elements unwrapped (children preserved, wrapper removed) | — |
