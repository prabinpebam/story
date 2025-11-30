# ContentRecovery - Draft Saving and Restoration

## 1. Purpose

Protect user content from data loss during editing. Save drafts periodically and on page unload. Recover unsaved content on page load.

## 2. Scenarios Covered

- Browser crash during editing
- Accidental tab close
- Power loss / system crash
- Network failure before cloud sync
- User navigating away accidentally

## 3. Storage Strategy

```
┌──────────────────────────────────────────────────────┐
│                  ContentRecovery                     │
│                                                      │
│  Primary: IndexedDB                                  │
│    ✓ Large content support (no size limit)          │
│    ✓ Structured data with indexes                   │
│    ✓ Async API                                      │
│                                                      │
│  Fallback: localStorage                              │
│    ✓ Sync API (works in beforeunload)               │
│    ✗ Size limited (~5MB total)                      │
│                                                      │
│  Approach: Write to both, prefer IndexedDB on read  │
└──────────────────────────────────────────────────────┘
```

## 4. Responsibilities

| Responsibility | Description |
|----------------|-------------|
| Auto-save | Save drafts periodically during editing |
| Unload save | Sync save on page unload |
| Recovery check | Detect recoverable content on app load |
| Recovery UI | Show recovery dialog to user |
| Cleanup | Clear drafts after successful save |
| Expiration | Remove old drafts |

## 5. Draft Structure

Each draft stores:
- **elementId**: Stable identifier for the element
- **slideId**: Parent slide ID
- **content**: HTML content
- **inlineStyles**: Style overrides
- **timestamp**: When saved
- **metadata**: projectId, sessionId for multi-doc support

## 6. Stable Element Keys

**Problem**: Element IDs may change between sessions (e.g., after import/export).

**Solution**: Generate stable keys based on:
- Slide index (ordinal position)
- Element type (title, body, etc.)
- Creation order within type

This allows matching drafts to elements across sessions even if UUIDs change.

## 7. Auto-Save Approach

During editing:
1. Timer fires every N seconds (e.g., 5 seconds)
2. If dirty, save current content to IndexedDB + localStorage
3. Timer resets after each save

Also save on:
- `visibilitychange` (tab hidden)
- `beforeunload` (page closing - sync to localStorage only)

## 8. Recovery Flow

On app initialization:
1. Check IndexedDB for drafts
2. Check localStorage for drafts (may have more recent due to sync API)
3. Merge, preferring newer timestamps
4. If recoverable content exists, show recovery dialog

Recovery dialog options:
- **Recover**: Apply draft content to elements
- **Dismiss**: Clear drafts without applying

## 9. Cleanup Strategy

Clear drafts:
- After content successfully saved to Store
- After user dismisses recovery dialog
- Periodically for drafts older than N days (e.g., 7 days)

## 10. IndexedDB Schema

**Database**: `story-drafts`

**Object Store**: `drafts`
- Primary key: `elementId`
- Index: `timestamp` (for expiration queries)
- Index: `slideId` (for slide-specific queries)

## 11. Sync vs Async Considerations

| Event | API | Notes |
|-------|-----|-------|
| Auto-save timer | IndexedDB (async) | Can wait for completion |
| Visibility change | IndexedDB (async) | Can wait for completion |
| beforeunload | localStorage (sync) | Must complete immediately |

`beforeunload` event doesn't wait for async operations, so we must use synchronous localStorage for unload saves.

## 12. Integration Points

| Component | Integration |
|-----------|-------------|
| TextEditManager | Calls saveDraft on input, clearDraft on exit |
| App initialization | Checks for recovery on startup |
| Store | After successful save, clear draft |
| UI | Recovery dialog component |

## 13. Recovery Dialog UX

Show modal with:
- List of recoverable content (element type, timestamp)
- "Recover" button - applies all drafts
- "Dismiss" button - clears drafts
- Per-item recovery (future enhancement)

Position: Center of screen, modal overlay, cannot be dismissed by clicking outside.

## 14. Performance Considerations

- Debounce saves to avoid excessive writes
- Limit cache size in localStorage
- Use IndexedDB cursors for cleanup queries
- Don't block UI for save operations

## 15. Testing Approach

| Test | How |
|------|-----|
| Auto-save fires | Mock timer, verify save called |
| Unload save | Mock beforeunload, verify localStorage |
| Recovery detection | Seed storage, verify dialog shown |
| Cleanup | Seed old drafts, verify removal |
| Large content | Test near localStorage limit |

## 16. Open Questions

1. What's the right auto-save interval? 5 seconds proposed.
2. How long to keep old drafts? 7 days proposed.
3. Should there be per-element recovery or all-or-nothing?
4. Should we show a notification when auto-save happens?
