# Layer Management Specification

## 1. Overview
The Layer Panel provides a hierarchical view of all elements on the current slide. It allows users to manage the stacking order (Z-index), visibility, locking status, and organization (grouping) of elements.

## 2. Data Model
The state for layers is derived from the `slides` data structure.
- **Source of Truth:** `store.state.slides[activeSlideId].elements` (Map of ID -> Element) and `store.state.slides[activeSlideId].elementOrder` (Array of IDs).
- **Stacking Order:** The `elementOrder` array defines the Z-index.
    - Index `0` is the **bottom-most** element (Back).
    - Index `length - 1` is the **top-most** element (Front).
- **UI Representation:** The Layer Tree displays this order in **reverse** (Top element at the top of the list).

### 2.1 Grouping
- Elements can be grouped. A Group is a special element type (`type: 'group'`).
- **Data Structure:**
    - A Group element has a `children` property (Array of IDs).
    - Child elements are *removed* from the main `elementOrder` array and exist only within the Group's `children` array.
    - This creates a recursive tree structure.

## 3. User Interface (Layer Tree)
The Layer Tree is located in the Left Sidebar.

### 3.1 Layer Item Component
Each row in the tree represents an element or group.
- **Indentation:** Based on nesting depth (16px per level).
- **Expand/Collapse:** Groups have a chevron icon to toggle visibility of children.
- **Icon:** Type-specific icon (Text, Image, Shape, Group).
- **Label:** Element name (editable).
- **Controls (Hover):**
    - **Lock:** Toggle `locked` state.
    - **Visible:** Toggle `hidden` state.

### 3.2 Selection State
- **Sync:** Selection must be synchronized between the Canvas and Layer Tree.
    - Clicking a layer selects the element on the Canvas.
    - Selecting an element on the Canvas highlights the layer in the Tree.
- **Multi-Select:**
    - `Shift + Click`: Select range of layers.
    - `Cmd/Ctrl + Click`: Toggle selection of individual layers.

## 4. Interactions

### 4.1 Reordering (Drag & Drop)
- Users can drag layers to reorder them.
- **Visual Feedback:** A blue line indicates the drop target position.
- **Logic:**
    - **Reorder:** Moving within the same parent (or root). Updates `elementOrder` or parent's `children` array.
    - **Reparenting:** Dragging an element *into* a group, or *out* of a group.
    - **Auto-Scroll:** The list should scroll if dragging near the edges.

### 4.2 Visibility & Locking
- **Visibility:**
    - Toggling `hidden` on a Group hides all children.
    - Hidden elements cannot be selected on the Canvas.
- **Locking:**
    - Locked elements cannot be selected or manipulated on the Canvas.
    - They *can* still be selected in the Layer Tree (to unlock them).

### 4.3 Renaming
- Double-click the layer name to enter edit mode.
- `Enter` to commit, `Esc` to cancel.
- Empty names should revert to default (e.g., "Text", "Rectangle").

### 4.4 Context Menu
Right-clicking a layer shows a context menu:
- Rename
- Group / Ungroup
- Lock / Unlock
- Hide / Show
- Bring to Front / Send to Back
- Delete

## 5. Implementation Details

### 5.1 State Actions
- `REORDER_ELEMENTS(slideId, sourceId, targetId, position)`: Moves an element.
- `TOGGLE_LOCK(id)`
- `TOGGLE_VISIBILITY(id)`
- `RENAME_ELEMENT(id, newName)`

### 5.2 Performance
- The Layer Tree should only re-render when:
    - `elementOrder` changes.
    - An element's `name`, `locked`, or `hidden` state changes.
    - Selection changes.
- Avoid re-rendering the entire tree for simple selection changes (use CSS classes).

## 6. Edge Cases & Constraints
- **Master Slide Layers:** Elements from the Master Slide should be visible but locked/distinguishable (maybe a separate section or different styling).
- **Background:** The Slide Background is technically a layer but usually sits permanently at the bottom. It might be represented as a fixed "Background" item at the bottom of the list.
