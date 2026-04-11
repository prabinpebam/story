# 10 — Undo / Redo

> Taskflows for history stack operations, text edit isolation, batching, and state preservation.

## Core Operations

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| UND-01 | Undo last action | Ctrl+Z (not in text edit mode) | Pop undoStack, push current to redoStack, restore previous state | `UNDO` |
| UND-02 | Redo undone action | Ctrl+Y or Ctrl+Shift+Z (not in text edit mode) | Pop redoStack, push current to undoStack, restore next state | `REDO` |
| UND-03 | Undo disabled when empty | No items in undoStack | `canUndo()` returns false; Undo action/button disabled | — |
| UND-04 | Redo disabled when empty | No items in redoStack | `canRedo()` returns false; Redo action/button disabled | — |
| UND-05 | Redo cleared on new action | Any new action dispatched after undo | `redoStack` cleared (new branch); redo unavailable | — |
| UND-06 | History limit enforcement | undoStack exceeds 50 entries | Oldest entry removed via `shift()` | — |

## Text Edit Isolation

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| UND-07 | Pause on text edit start | Enter text edit mode | `historyBridge.beginSession()` → `historyManager.pause()`; stores `before` state | — |
| UND-08 | Skip push while paused | Any dispatch during text editing | `push()` calls silently skipped while `isPaused` | — |
| UND-09 | Browser undo in text edit | Ctrl+Z during text editing | `stopPropagation` (prevents app undo) but NOT `preventDefault` (browser handles contentEditable undo) | — |
| UND-10 | Browser redo in text edit | Ctrl+Y during text editing | Same pattern; browser handles contentEditable redo | — |
| UND-11 | Resume on text edit end | Exit text edit mode | `historyBridge.endSession()` → `historyManager.resume()` | — |
| UND-12 | Session collapses to one entry | Exit after making changes | If dirty AND content actually changed: single `pushTextEdit()` entry | `pushTextEdit` |
| UND-13 | No-op on unchanged session | Exit without making changes | String comparison detects no diff; `pushTextEdit` skipped | — |
| UND-14 | Cancel session | `historyBridge.cancelSession()` | Discards all changes, returns to original `before` state | — |

## Text Edit Undo Entry

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| UND-15 | Text edit entry structure | `pushTextEdit()` called | Entry: `{ state: null, meta: { type: 'text-edit', elementId, before, after } }` | — |
| UND-16 | Undo text edit | Ctrl+Z on text edit entry | `entryHandler('text-edit')` returns `before` state; element content restored | `UNDO` |
| UND-17 | Redo text edit | Ctrl+Y on text edit entry | `entryHandler('text-edit')` returns `after` state; element content re-applied | `REDO` |

## State Preservation

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| UND-18 | Selection state preserved | Undo/redo full snapshot | `meta` contains selection state; restored alongside snapshot | — |
| UND-19 | Viewport state preserved | Undo/redo full snapshot | `meta` contains viewport info; caller can restore | — |
| UND-20 | Clear all history | `historyManager.clear()` called | Both stacks emptied; fresh start | — |

## Interaction Patterns

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| UND-21 | Scrubbing as single undo step | NumberInput scrub: mousedown → scrub → mouseup | Entire scrub sequence = one undo entry (only final value pushed) | — |
| UND-22 | Multiple property changes | Rapid property changes | Each dispatch creates one entry (no coalescing; `ENABLE_COALESCING = false`) | — |
