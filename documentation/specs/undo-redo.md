# Undo/Redo System Specification

## 1. Overview
This document outlines the strategy and implementation plan for adding robust Undo/Redo functionality to the application. The system will use a **Command Pattern** approach where every state-modifying action generates an inverse action that is stored in a history stack.

## 2. Architecture

### 2.1 History Manager (`src/core/HistoryManager.js`)
The existing `HistoryManager` class will be used to manage the undo and redo stacks.
*   **Structure**: Stores objects of shape `{ undo: { type, payload }, redo: { type, payload } }`.
*   **Capacity**: Limited to 50 steps (configurable) to manage memory.
*   **Persistence**: History is transient and clears on page reload (for now).

### 2.2 Store Integration (`src/core/Store.js`)
The `Store` class is the central point for state mutations. The `dispatch` method will be enhanced to:
1.  **Intercept** undoable actions.
2.  **Capture** the necessary state *before* the mutation occurs.
3.  **Construct** the inverse action (Undo) and the forward action (Redo).
4.  **Push** this pair to the `HistoryManager` if the action did not originate from a history operation (i.e., `!fromHistory`).

## 3. Undoable Actions & Inverse Logic

The following table defines the mapping between user actions and their inverse operations.

| Action Type | Payload | Inverse Action | Inverse Payload Logic |
| :--- | :--- | :--- | :--- |
| `ADD_SLIDE` | `{ id, ... }` | `DELETE_SLIDE` | `id` |
| `DELETE_SLIDE` | `id` | `RESTORE_SLIDE` | `{ slideObject, index }` (Requires capturing slide state before delete) |
| `DUPLICATE_SLIDE` | `sourceId` | `DELETE_SLIDE` | `newSlideId` (Need to capture the ID of the created slide) |
| `REORDER_SLIDES` | `{ fromIndex, toIndex }` | `REORDER_SLIDES` | `{ fromIndex: toIndex, toIndex: fromIndex }` |
| `ADD_ELEMENT` | `{ element }` | `REMOVE_ELEMENT` | `element.id` |
| `REMOVE_ELEMENT` | `id` or `[ids]` | `RESTORE_ELEMENTS` | `{ elements: [objects], indices: [indices], parentIds: [ids] }` |
| `UPDATE_ELEMENT` | `{ id, props }` | `UPDATE_ELEMENT` | `{ id, oldProps }` (Capture old values of changed props) |
| `BATCH_UPDATE_ELEMENTS` | `[{ id, props }]` | `BATCH_UPDATE_ELEMENTS` | `[{ id, oldProps }]` |
| `REORDER_ELEMENTS` | `{ id, targetIndex, ... }` | `REORDER_ELEMENTS` | `{ id, targetIndex: oldIndex, ... }` |
| `TOGGLE_ELEMENT_LOCK` | `{ id }` | `TOGGLE_ELEMENT_LOCK` | `{ id }` |
| `TOGGLE_ELEMENT_VISIBILITY`| `{ id }` | `TOGGLE_ELEMENT_VISIBILITY`| `{ id }` |
| `PASTE_ELEMENTS` | `{ elements }` | `REMOVE_ELEMENT` | `[newElementIds]` |
| `ALIGN_ELEMENTS` | `type` | `BATCH_UPDATE_ELEMENTS` | `[{ id, x, y }]` (Capture positions before align) |

## 4. Implementation Plan

### Phase 1: Infrastructure
1.  **Verify `HistoryManager`**: Ensure it correctly handles stack limits and clearing redo stack on new actions.
2.  **Enhance `Store.dispatch`**: Add the logic to check for `options.fromHistory`.

### Phase 2: Slide Operations
1.  **`ADD_SLIDE`**: Capture the generated ID. Inverse: `DELETE_SLIDE`.
2.  **`DELETE_SLIDE`**: Before deleting, clone the slide object and note its index. Inverse: `RESTORE_SLIDE` (New Action).
3.  **`REORDER_SLIDES`**: Simple index swap.

### Phase 3: Element Operations
1.  **`UPDATE_ELEMENT`**: This is the most frequent action.
    *   **Logic**: Before applying `payload.props`, read `state.elements[id]` to get old values for those specific keys.
    *   **Inverse**: `UPDATE_ELEMENT` with old values.
2.  **`REMOVE_ELEMENT`**: Complex because elements can be in groups or root.
    *   **Logic**: Recursively capture all deleted elements (if group), their parents, and their indices.
    *   **Inverse**: `RESTORE_ELEMENTS` (New Action) which puts them back in the exact structure.
3.  **`ADD_ELEMENT` / `PASTE_ELEMENTS`**: Inverse is simple delete.
4.  **`ALIGN_ELEMENTS`**: Capture positions of all selected elements before alignment. Inverse is `BATCH_UPDATE_ELEMENTS`.

### Phase 4: Batching & Transactions (Future)
*   For continuous operations like dragging (Resize/Move), the UI currently dispatches `UPDATE_ELEMENT` continuously.
*   **Strategy**: The UI must dispatch a `START_INTERACTION` and `END_INTERACTION` or similar.
*   **Interim Solution**: Assume the UI calls a final `UPDATE_ELEMENT` at `mouseup`. We will treat every `UPDATE_ELEMENT` as a discrete undo step for now, or implement a simple debounce if needed. *Refinement: The UI likely already handles "final" updates or we can modify the tool to only dispatch the "commit" action on release.*

## 5. New Actions Required
To support the inverse logic, we need to implement these new action types in `Store.js`:
*   `RESTORE_SLIDE`: Adds a slide back at a specific index.
*   `RESTORE_ELEMENTS`: Adds elements back to their specific parents/indices.
*   `BATCH_UPDATE_ELEMENTS`: Updates multiple elements in one go (atomic).

## 6. Edge Cases
*   **Selection State**: Ideally, Undo should restore the selection state to what it was. We can include `selectedElementIds` in the history payload or handle it separately.
*   **External Resources**: If an image is deleted and the user Undoes, the image URL must still be valid.
