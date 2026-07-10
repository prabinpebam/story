# Text Editing Architecture Overview

## 1. System Context

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              STORY APPLICATION                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐         │
│  │   Canvas    │   │  Property   │   │   Layer     │   │  Typography │         │
│  │  Manager    │   │  Inspector  │   │    Tree     │   │    Panel    │         │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘         │
│         │                 │                 │                 │                 │
│         └────────────────┬┴─────────────────┴─────────────────┘                 │
│                          │                                                       │
│                          ▼                                                       │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                     TEXT EDITING SYSTEM (New)                              │  │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐              │  │
│  │  │ TextEditManager │ │ PlaceholderMgr  │ │ TextStyleManager│              │  │
│  │  │  (Orchestrator) │ │ (Master/Slide)  │ │  (Inline/Preset)│              │  │
│  │  └────────┬────────┘ └────────┬────────┘ └────────┬────────┘              │  │
│  │           │                   │                   │                        │  │
│  │  ┌────────┴────────┐ ┌────────┴────────┐ ┌────────┴────────┐              │  │
│  │  │SelectionManager │ │ContentSanitizer │ │ ContentRecovery │              │  │
│  │  │  (Save/Restore) │ │  (HTML Clean)   │ │  (Draft/Backup) │              │  │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────┘              │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                          │                                                       │
│                          ▼                                                       │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                           EXISTING SYSTEMS                                 │  │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐              │  │
│  │  │     Store       │ │  StyleResolver  │ │  HistoryManager │              │  │
│  │  │ (State + Disp)  │ │ (Style Cascade) │ │   (Undo/Redo)   │              │  │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────┘              │  │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐              │  │
│  │  │  TextElement    │ │ EditorRenderer  │ │    Events       │              │  │
│  │  │   (Renderer)    │ │  (DOM Overlay)  │ │   (Pub/Sub)     │              │  │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────┘              │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 2. Component Responsibilities

| Component | Responsibility | Dependencies |
|-----------|---------------|--------------|
| TextEditManager | Central orchestrator, mode transitions | Store, All sub-managers |
| PlaceholderManager | Master/slide placeholder logic | Store, Masters |
| TextStyleManager | Inline formatting, style presets | StyleResolver, Store |
| SelectionManager | Save/restore text selection | None (DOM only) |
| ContentSanitizer | Clean/validate HTML content | None |
| ContentRecovery | Draft backup, crash recovery | localStorage, IndexedDB |

## 3. Data Flow

### 3.1 Enter Edit Mode

```
User Action (double-click/Enter)
        │
        ▼
  CanvasManager
        │
        ├──► TextEditManager.enterEditMode()
        │           │
        │           ├──► Store.dispatch('ENTER_TEXT_EDIT')
        │           │
        │           ├──► PlaceholderManager.prepareForEdit()
        │           │          └──► Clear prompt text if empty
        │           │
        │           └──► Capture pre-edit state for undo
        │
        ▼
  TextElement.setEditing(true)
        │
        ├──► Set contenteditable = true
        ├──► Attach event handlers
        └──► SelectionManager.setInitialSelection()
```

### 3.2 During Editing

```
User Input (typing, formatting)
        │
        ▼
  TextElement.handleInput()
        │
        ├──► Check IME composition state
        │         └──► If composing, skip processing
        │
        ├──► TextEditManager.handleInput()
        │         │
        │         ├──► Mark as dirty
        │         │
        │         └──► Schedule debounced save (500ms)
        │
        └──► ContentRecovery.saveDraft() (async)
```

### 3.3 Exit Edit Mode

```
User Action (Escape/click outside/Cmd+Enter)
        │
        ▼
  TextEditManager.exitEditMode()
        │
        ├──► ContentSanitizer.sanitize(content)
        │
        ├──► PlaceholderManager.handleExit(isEmpty)
        │         ├──► Empty placeholder: restore prompt
        │         └──► Empty non-placeholder: delete element
        │
        ├──► Store.dispatch('SAVE_TEXT_CONTENT')
        │
        ├──► HistoryManager.push() (if content changed)
        │
        └──► ContentRecovery.clearDraft()
```

## 4. File Structure

```
src/core/text/
├── index.js                    # Public API exports
├── TextEditManager.js          # Main orchestrator (200 lines)
├── PlaceholderManager.js       # Placeholder logic (150 lines)
├── SelectionManager.js         # Selection state (120 lines)
├── ContentSanitizer.js         # HTML sanitization (100 lines)
├── ContentRecovery.js          # Draft backup (80 lines)
├── TextStyleManager.js         # Style application (180 lines)
├── IMEHandler.js               # IME composition (60 lines)
├── KeyboardHandler.js          # Shortcut handling (100 lines)
└── constants.js                # Shared constants (50 lines)
```

## 5. Integration Points

### 5.1 With Store
- New state: `editor.textEdit`
- New actions: `ENTER_TEXT_EDIT`, `EXIT_TEXT_EDIT`, `SAVE_TEXT_CONTENT`
- Existing actions: `UPDATE_ELEMENT`, `REMOVE_ELEMENT`

### 5.2 With StyleResolver
- Call `getEffectiveTextProperties()` for style resolution
- Respect `styleId` → `element.style` → `inline` cascade

### 5.3 With HistoryManager
- Capture state on edit entry
- Push to history on dirty exit
- Block app undo during edit mode

### 5.4 With TextElement
- Delegate to TextEditManager
- Pass DOM events
- Use SelectionManager for selection

## 6. Key Design Decisions

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| Use native contenteditable | Performance, IME support | Less control over selection |
| Singleton TextEditManager | Single source of truth | Must manage state carefully |
| Debounced saves | Avoid re-renders during typing | Potential data loss window |
| IndexedDB for large drafts | localStorage limits | More complexity |
| Browser undo in edit mode | User expectation | Two undo systems |

## 7. See Also

- [01-text-edit-manager.md](01-text-edit-manager.md) - Core orchestrator
- [02-placeholder-manager.md](02-placeholder-manager.md) - Master/slide placeholders
- [03-selection-manager.md](03-selection-manager.md) - Selection handling
- [04-content-sanitizer.md](04-content-sanitizer.md) - Content sanitization
- [05-style-bridge.md](05-style-bridge.md) - Style system
- [06-history-bridge.md](06-history-bridge.md) - History integration
- [07-ime-handler.md](07-ime-handler.md) - IME support
- [08-content-recovery.md](08-content-recovery.md) - Recovery
- [10-store-handlers.md](10-store-handlers.md) - Store integration

## 8. Principles Compliance

This architecture adheres to the project principles defined in `documentation/principles.md`:

### Design System & Craft

| Requirement | How Addressed |
|-------------|---------------|
| Use global CSS variables | All colors, typography, spacing reference `--color-*`, `--font-*`, `--spacing-*` tokens |
| Use global common components | Leverage existing tooltip, button, input components where applicable |
| Avoid inline styles | CSS classes only; inline styles stripped on paste |
| Dark/light mode support | All colors via CSS variables that respond to theme |
| No duplicate components | Use variants of existing text components |

### Undo/Redo Compatibility

| Requirement | How Addressed | Modifications Needed |
|-------------|---------------|---------------------|
| Compatible with existing system | Edit mode isolation strategy | HistoryManager needs `pause()` and `resume()` methods |
| Call out modifications | See [06-history-bridge.md](06-history-bridge.md) | Add text-edit entry type handler |

**Risk**: HistoryManager may not currently support `pause()/resume()`. 
**Mitigation**: Implement as first task; simple boolean flag approach.

### File Storage & Serialization

| Requirement | How Addressed |
|-------------|---------------|
| Compatible with storage | Content saved as sanitized HTML string |
| Serialization format | Same `content` field on text elements |
| No breaking changes | Backward compatible; existing files work |

### Realtime Collaboration

| Requirement | How Addressed |
|-------------|---------------|
| Compatible with collab | Content changes go through Store |
| Conflict resolution | Text content is atomic (last-write-wins per element) |
| Awareness | `editor.textEdit.elementId` in state shows who is editing what |

**Risk**: Concurrent edits to same text element.
**Mitigation**: Lock element during edit; show "User X is editing" indicator.

### Security & Privacy

| Requirement | How Addressed |
|-------------|---------------|
| Secure by design | ContentSanitizer strips scripts, event handlers |
| No data leakage | Drafts stored locally only, cleared on save |
