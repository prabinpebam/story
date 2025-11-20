# Layer Management System

## Overview
The Layer Management System allows users to organize elements on a slide using a hierarchical tree structure. It supports grouping, reordering via drag-and-drop, and visibility/locking toggles.

## Components

### 1. Store (`src/core/Store.js`)
The `Store` manages the state of the layers.
- **State Structure**:
  - `slide.elementOrder`: Array of root element IDs.
  - `element.children`: Array of child element IDs (for groups).
  - `element.parentId`: ID of the parent group (or null for root).
- **Actions**:
  - `REORDER_ELEMENTS`: Handles moving elements within the same parent, reparenting (moving into/out of groups), and reordering.
  - `TOGGLE_ELEMENT_LOCK`: Toggles the locked state.
  - `TOGGLE_ELEMENT_VISIBILITY`: Toggles visibility.
  - `RENAME_ELEMENT`: Renames an element.

### 2. Layer Tree UI (`src/ui/LayerTree.js`)
The `LayerTree` provides the visual interface.
- **Features**:
  - **Recursive Rendering**: Displays nested groups.
  - **Drag and Drop**: Uses HTML5 Drag & Drop API to reorder elements.
    - Visual indicators for drop targets (before, after, inside).
    - Auto-expansion of groups on hover.
  - **Inline Renaming**: Double-click to rename.
  - **Selection**: Click to select elements (syncs with Canvas).
  - **Context Menu**: (Planned) For additional actions.

### 3. Slide Renderer (`src/core/SlideRenderer.js`)
The `SlideRenderer` is responsible for rendering the elements to the DOM.
- **Rendering Logic**:
  - Iterates through `slide.elementOrder` to render root elements.
  - Recursively renders children of groups.
  - **Z-Index / Stacking**:
    - Relies on DOM order to determine stacking context.
    - `updateCurrentSlide` ensures elements are appended to the DOM in the order defined by `elementOrder`.
    - `updateElementDOM` ensures children are appended in the correct order.

## Usage

### Reordering
- Drag an element to move it.
- Drop **between** items to reorder.
- Drop **on top** of a group to move it inside.

### Grouping
- (Future) Select multiple elements and press `Ctrl+G` to group.

### Locking/Hiding
- Click the "Eye" icon to toggle visibility.
- Click the "Lock" icon to prevent selection/editing on the canvas.
