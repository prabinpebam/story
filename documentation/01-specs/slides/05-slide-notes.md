# Slide Notes / Presenter Notes (Editor + Presenter View)

**Purpose:** a per-slide notes feature that powers:
- Presenter View “Notes” pane during a show
- An editor-side notes panel for authors

This spec defines the **UX/UI**, the **data format**, and the **rendering/sanitization** contract so Presenter View and edit mode remain consistent.

---

## 1) Scope

### In scope
- Notes are attached to a slide and update when the active slide changes.
- Notes are editable in the editor using a floating, resizable panel.
- Notes render in Presenter View using the exact same underlying format.

### Out of scope
- Images, tables, embeds, media inside notes.
- Comments, mentions, and collaboration cursors.
- Export/print of notes.

---

## 2) UX / UI (Editor)

### 2.1 Entry point
- When a slide is active, the sidebar header MUST show a Notes icon button.
- Clicking the button MUST open the Slide Notes panel.
- Clicking again MUST toggle (close) the panel.

### 2.2 Panel behavior
- Notes MUST be shown in an independent floating panel.
- The panel MUST use the same underlying component style as Color Theme and Typography panels (draggable + resizable).
- The panel MUST be persistent across slide navigation:
  - It remains open as the user changes slides.
  - Its content updates to the notes of the newly active slide.
- The panel MUST remember its last position and size for the session.

### 2.3 Panel layout (minimum)
- Header: “Notes” title + close button.
- Body: rich text editor surface.

### 2.4 Rich text features (supported)
The editor MUST support:
- Bold
- Italics
- Strikethrough
- Headings (H1/H2/H3)
- Bullet list
- Numbered list
- Indent / outdent for list items

The editor MUST NOT support:
- Images
- Tables
- Media embeds

### 2.5 Editing model
- Notes edits MUST be written to the current slide’s notes state immediately (or with a very short debounce), so that Presenter View can show up-to-date notes.
- Notes edits MUST not affect the slide canvas content.

### 2.6 Empty states
- If a slide has no notes, the panel MUST show an empty editor state (not HTML).
- Presenter View MAY show a “No notes” placeholder for empty notes.

### 2.7 Accessibility
- The notes panel MUST be keyboard reachable.
- The notes editor MUST have an accessible name (e.g., `aria-label="Slide notes"`).

---

## 3) Notes data format (single source of truth)

Notes MUST use a shared canonical document format used by both:
- the editor notes panel
- presenter view rendering

### 3.1 Canonical format: `NotesDoc v1`
Notes MUST be stored as a structured rich-text document (not arbitrary HTML):

```ts
type NotesDocV1 = {
  version: 1;
  blocks: NotesBlock[];
};

type NotesBlock =
  | { type: 'paragraph'; inlines: Inline[] }
  | { type: 'heading'; level: 1 | 2 | 3; inlines: Inline[] }
  | { type: 'bulletList'; items: ListItem[] }
  | { type: 'orderedList'; items: ListItem[] };

type ListItem = { inlines: Inline[] };

type Inline =
  | { type: 'text'; text: string; marks?: Array<'bold' | 'italic' | 'strikethrough'> }
  | { type: 'link'; href: string; inlines: Inline[] };
```

### 3.2 Storage on slide objects
- Slides SHOULD store notes as `slide.notesDoc` (object).
- `slide.notes` (string) is legacy and MUST NOT be treated as trusted HTML.

### 3.3 Migration / compatibility
- If legacy `slide.notes` exists:
  - it MUST be imported into `NotesDoc v1` via a safe converter,
  - unsupported tags/features MUST be dropped,
  - the result MUST be sanitized.

---

## 4) Rendering + sanitization contract

### 4.1 Rendering pipeline
- Notes MUST render by converting `NotesDoc v1` → HTML via a dedicated renderer.
- The renderer MUST output only a constrained safe subset.
- Presenter View MUST NOT directly inject arbitrary user-provided HTML.

### 4.2 Allowed HTML output subset
Renderer output MAY contain:
- Block tags: `p`, `h1`, `h2`, `h3`, `ul`, `ol`, `li`
- Inline tags: `strong`, `em`, `s`, `a`

### 4.3 Link rules
- Links MUST be sanitized.
- Allowed protocols: `http:`, `https:`, `mailto:`.
- `javascript:` and other executable URLs MUST be rejected.

---

## 5) Test hooks (DOM contract)

### 5.1 Editor
- Notes panel root MUST have a stable selector: `[data-testid="slide-notes-panel"]`.
- Notes editor surface MUST have: `[data-testid="slide-notes-editor"]`.
- Notes toggle button in the sidebar header MUST have: `[data-testid="sidebar-notes-btn"]`.

### 5.2 Presenter View
- Presenter notes container MUST remain: `[data-testid="presenter-notes"]`.

---

## 6) Non-negotiable privacy boundary
- Notes MUST never appear in the audience DOM.
- Notes MUST never be included in cross-window sync messages.
- Notes MUST never be logged or sent in telemetry.
