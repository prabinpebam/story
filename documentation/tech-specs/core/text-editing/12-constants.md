# Constants and Configuration

## 1. Purpose

Centralize shared constants, configuration values, and prompt text definitions.

## 2. Timing Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| `DEBOUNCE_SAVE_MS` | 500 | Debounce interval for content saves |
| `AUTO_SAVE_INTERVAL_MS` | 5000 | Draft auto-save interval |
| `DRAFT_MAX_AGE_MS` | 7 * 24 * 60 * 60 * 1000 | Draft expiration (7 days) |
| `COALESCE_WINDOW_MS` | 1000 | History entry coalescing window |

## 3. Placeholder Prompt Text

| Type | Prompt Text |
|------|-------------|
| `title` | "Click to add title" |
| `subtitle` | "Click to add subtitle" |
| `body` | "Click to add text" |
| `text` | "Click to add text" |
| `date` | "Date" |
| `slideNumber` | "#" |
| `footer` | "Footer text" |

## 4. Allowed HTML Elements

For ContentSanitizer:
- Structure: `p`, `div`, `br`
- Formatting: `b`, `strong`, `i`, `em`, `u`, `s`, `del`
- Inline: `span`
- Future: `ul`, `ol`, `li`, `a`

## 5. Allowed CSS Properties

For ContentSanitizer:
- Typography: `font-size`, `font-family`, `font-weight`, `font-style`, `text-decoration`, `text-align`
- Color: `color`, `background-color`
- Spacing: `line-height`, `letter-spacing`

## 6. Keyboard Shortcuts

| Key Combo | Action |
|-----------|--------|
| `Cmd/Ctrl + B` | Toggle bold |
| `Cmd/Ctrl + I` | Toggle italic |
| `Cmd/Ctrl + U` | Toggle underline |
| `Escape` | Exit edit mode |
| `Cmd/Ctrl + Enter` | Exit edit mode |
| `Cmd/Ctrl + A` | Select all (in edit mode) |

## 7. CSS Class Names

| Class | Applied When |
|-------|--------------|
| `text-element` | Always |
| `text-element--editing` | In edit mode |
| `text-element--placeholder-empty` | Empty placeholder |
| `text-element--selected` | Selected, not editing |
| `text-content` | Inner content div |
| `text-content--prompt` | Showing prompt text |

## 8. Data Attributes

| Attribute | Purpose |
|-----------|---------|
| `data-element-id` | DOM lookup |
| `data-placeholder-type` | Placeholder type |
| `data-editing` | Edit state flag |

## 9. Store Action Types

| Action | Description |
|--------|-------------|
| `ENTER_TEXT_EDIT` | Start editing |
| `EXIT_TEXT_EDIT` | Stop editing |
| `SAVE_TEXT_CONTENT` | Save content |
| `MARK_TEXT_DIRTY` | Mark changed |

## 10. Event Names

| Event | Description |
|-------|-------------|
| `text-edit-start` | Editing began |
| `text-edit-end` | Editing ended |
| `text-selection-change` | Selection moved |
| `text-content-save` | Content saved |
| `recoverable-content` | Drafts found |

## 11. Error Messages

| Code | Message |
|------|---------|
| `ELEMENT_NOT_FOUND` | "Element not found" |
| `ALREADY_EDITING` | "Already editing another element" |
| `INVALID_CONTENT` | "Content validation failed" |
| `SAVE_FAILED` | "Failed to save content" |
| `RECOVERY_FAILED` | "Failed to recover drafts" |

## 12. Default Style Values

| Property | Default |
|----------|---------|
| `fontFamily` | System UI font |
| `fontSize` | 24 |
| `fontWeight` | 400 |
| `lineHeight` | 1.5 |
| `letterSpacing` | 0 |
| `color` | Theme text color |

## 13. Limits

| Limit | Value | Reason |
|-------|-------|--------|
| `MAX_CONTENT_LENGTH` | 100000 | Performance |
| `MAX_UNDO_ENTRIES` | 50 | Memory |
| `MAX_DRAFT_COUNT` | 100 | Storage |
| `MAX_NESTED_TAGS` | 10 | Sanitizer depth |

## 14. Feature Flags

| Flag | Default | Description |
|------|---------|-------------|
| `ENABLE_IME_SUPPORT` | true | IME composition handling |
| `ENABLE_DRAFT_RECOVERY` | true | Auto-save and recovery |
| `ENABLE_COALESCING` | false | History entry coalescing |
| `ENABLE_RICH_PASTE` | true | Formatted paste support |

## 15. Storage Keys

| Key Pattern | Purpose |
|-------------|---------|
| `draft:${elementId}` | localStorage draft |
| `story-drafts` | IndexedDB database name |
| `drafts` | IndexedDB object store |