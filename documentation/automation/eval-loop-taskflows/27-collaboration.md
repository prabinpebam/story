# 27 — Collaboration

> Taskflows for real-time collaboration, presence, cursor sharing, state sync, and conflict resolution.

## Connection Lifecycle

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| COL-01 | Connect to session | Open shared document | State: DISCONNECTED → CONNECTING → CONNECTED → JOINING → ACTIVE | — |
| COL-02 | Reconnect | Connection lost | Exponential backoff reconnection (configurable max attempts/delay) | — |
| COL-03 | Error state | Max retries exceeded | State: ERROR; user notified | — |
| COL-04 | SignalR negotiation | Initial connection | Azure Function endpoint negotiation; joins document group | — |
| COL-05 | Offline message queue | Operations while disconnected | Pending messages buffered; flushed on reconnect | — |

## Presence

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| COL-06 | Heartbeat presence | Active session | Regular heartbeat broadcasts presence to participants | — |
| COL-07 | Activity detection | mousemove, mousedown, keydown, touchstart, scroll | User status: ACTIVE. Auto color assignment per user. | — |
| COL-08 | Idle detection | No activity for timeout | Status transitions: ACTIVE → IDLE → AWAY | — |
| COL-09 | Tab switch detection | Browser tab loses focus | Visibility change → AWAY status | — |

## Cursor Sharing

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| COL-10 | Broadcast local cursor | Mouse moves on canvas | Throttled position broadcast to all participants | — |
| COL-11 | Render remote cursors | Receive cursor positions from others | Remote cursors rendered with user color; smooth interpolation | — |
| COL-12 | Canvas coordinate mapping | Remote cursor received | World coordinates mapped to local viewport position | — |

## State Synchronization (OT)

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| COL-13 | Local-first operation | User makes an edit | Applied immediately locally; queued for remote sync | Per-action dispatch |
| COL-14 | Vector clock update | Operation created | `VectorClock.increment()` for causality tracking | — |
| COL-15 | Operation batching | Rapid edits | Queued with 50ms debounce; max batch size 10; auto-flush | — |
| COL-16 | Receive remote operation | Operation from peer | Vector clock merge; apply if causally ready; conflict resolution if concurrent | — |
| COL-17 | Conflict resolution | Concurrent operations detected | `isConcurrent()` check; `previousValue` for inverse/undo; OT transform applied | — |
| COL-18 | Acknowledgment tracking | Operation sent | 30s timeout for ACK; retry on timeout | — |
| COL-19 | Operation history cap | History grows | Capped at 1000 entries | — |

## Operation Types

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| COL-20 | Element insert | Add element | `INSERT` operation synced | — |
| COL-21 | Element delete | Delete element | `DELETE` operation synced | — |
| COL-22 | Element update | Modify property | `UPDATE` operation synced | — |
| COL-23 | Element move | Drag element | `MOVE` operation synced | — |
| COL-24 | Style change | Change fill/stroke/effect | `STYLE` operation synced | — |
| COL-25 | Slide operations | Add/delete/reorder slides | `ADD_SLIDE`, `DELETE_SLIDE`, `REORDER_SLIDES` operations synced | — |
| COL-26 | Batch operations | Group of related edits | `BATCH` operation (single undo unit) | — |
