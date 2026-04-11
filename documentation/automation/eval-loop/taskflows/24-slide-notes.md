# 24 — Slide Notes

> Taskflows for the notes panel, formatting, auto-save, and notes document model.

## Panel Management

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| NOT-01 | Open notes panel | Click notes button in sidebar header | `SlideNotesPanel` DraggablePanel (360×420) opens; contentEditable editor with spellcheck | `panelManager.toggle('slide-notes-panel')` |
| NOT-02 | Close notes panel | Click close on panel or toggle button | Panel closes; pending save flushed | — |
| NOT-03 | Panel position persistence | Move/resize panel | Position stored in `sessionStorage` (session-only) | — |
| NOT-04 | Auto-close in presentation | Enter presentation mode | Notes panel hidden | — |
| NOT-05 | Button hidden conditions | Presentation mode or no active slide | Notes toggle button hidden in sidebar | — |

## Editing & Formatting

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| NOT-06 | Type notes content | Type in contentEditable editor | Content edited; debounced save scheduled | — |
| NOT-07 | Apply bold | Click Bold button in toolbar | `execCommand('bold')` | — |
| NOT-08 | Apply italic | Click Italic button | `execCommand('italic')` | — |
| NOT-09 | Apply strikethrough | Click Strikethrough button | `execCommand('strikeThrough')` | — |
| NOT-10 | Apply heading 1 | Click H1 button | `execCommand('formatBlock', 'h1')` | — |
| NOT-11 | Apply heading 2 | Click H2 button | `execCommand('formatBlock', 'h2')` | — |
| NOT-12 | Apply heading 3 | Click H3 button | `execCommand('formatBlock', 'h3')` | — |
| NOT-13 | Apply bullet list | Click bullet list button | `execCommand('insertUnorderedList')` | — |
| NOT-14 | Apply numbered list | Click numbered list button | `execCommand('insertOrderedList')` | — |
| NOT-15 | Indent | Click indent button | `execCommand('indent')` | — |
| NOT-16 | Outdent | Click outdent button | `execCommand('outdent')` | — |

## Auto-Save

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| NOT-17 | Debounced save | Input event in notes editor | `_scheduleSave()` → 200ms → `_flushSave()` | `UPDATE_SLIDE({notesDoc})` |
| NOT-18 | Flush on slide switch | Active slide changes | Pending save for old slide flushed before loading new notes | `UPDATE_SLIDE({notesDoc})` |

## Notes Document Model

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| NOT-19 | Paragraph block | Notes has plain paragraph | `{type:'paragraph', inlines:[{type:'text', text, marks:[]}]}` | — |
| NOT-20 | Heading block | Notes has heading | `{type:'heading', level:1|2|3, inlines:[...]}` | — |
| NOT-21 | Bullet list block | Notes has bullet list | `{type:'bulletList', items:[{inlines:[...]}]}` | — |
| NOT-22 | Ordered list block | Notes has numbered list | `{type:'orderedList', items:[{inlines:[...]}]}` | — |
| NOT-23 | Inline marks | Bold/italic/strikethrough text | `marks: ['bold'|'italic'|'strikethrough']` on inline text | — |
| NOT-24 | Link inline | Notes has hyperlink | `{type:'link', href, inlines:[...]}` with sanitized href (http/https/mailto only) | — |
| NOT-25 | Legacy migration | Old slide with HTML notes string | `legacyNotesToNotesDoc()` parses HTML via DOMParser into NotesDoc | — |
| NOT-26 | Safe HTML rendering | Notes rendered for presenter view | `notesDocToSafeHtml()` with `escapeHtml` and protocol whitelist | — |
