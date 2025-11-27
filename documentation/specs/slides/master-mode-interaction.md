# Master Mode Interaction Specification

## 1. Overview
The goal is to unify the interaction logic for "Edit Mode" (Slides) and "Master Mode" (Themes/Layouts). Users should experience the same rich editing capabilities (selection, resizing, snapping, guides, property editing) in both modes without code duplication.

## 2. Core Concept: "Active Container"
The application state distinguishes between `slides` and `masters`. However, the interaction logic should be agnostic to the specific data source.

- **Edit Mode**: The Active Container is the currently active **Slide**.
- **Master Mode**: The Active Container is the currently active **Master Theme** or **Layout**.

### 2.1 Abstraction Layer
All interaction components (`CanvasManager`, `PropertyInspector`, `SlideRenderer`) must retrieve the target object via a unified helper method (e.g., `getActiveContainer(state)`), rather than accessing `state.slides` directly.

## 3. Interaction Requirements

### 3.1 Selection
- **Hit Testing**: Must occur against the elements of the Active Container.
- **Inherited Elements**:
    - In **Layout** view, elements inherited from the **Master Theme** are visible.
    - **Requirement**: Inherited elements should be selectable but **read-only** (locked) by default, or strictly non-selectable depending on design choice.
    - **Current Decision**: Inherited elements are visual reference only and cannot be selected or modified in the child Layout view. Only elements defined directly on the Layout are interactive.

### 3.2 Manipulation (Drag, Resize, Rotate)
- **Coordinate System**: Works identically. Coordinates are relative to the slide/master origin (0,0).
- **Snapping & Guides**:
    - Snapping should work against other elements in the **same** Active Container.
    - **Future**: Snapping to inherited elements (e.g., aligning a Layout placeholder to a Master logo) is desirable.

### 3.3 Creation
- **New Elements**: Created elements are added to the `elements` map of the Active Container.
- **Tools**: Text, Shape, Image tools function identically.

### 3.4 Property Inspection
- **Display**: Properties of the selected element(s) in the Active Container are displayed.
- **Updates**: Changes in the inspector dispatch `UPDATE_ELEMENT` which targets the Active Container.

## 4. Visual Feedback
- **Hover Effects**: Blue outline on hover for interactive elements.
- **Selection Box**: Standard gizmos (handles, rotation) for selected elements.
- **Mode Indication**:
    - **Edit Mode**: Standard UI.
    - **Master Mode**: Orange border around the viewport/app to indicate "System Level" editing.
    - **Layout Stability**: The visual indication (border) must be implemented as a pointer-events-none overlay (pseudo-element) to prevent layout shifts and ensure visibility over other UI elements.

## 5. Data Isolation
- **Strict Separation**: Actions performed in Master Mode must **never** affect normal slides, and vice versa.
- **Store Logic**: Redux-style actions (`ADD_ELEMENT`, `UPDATE_ELEMENT`, etc.) must use the `getActiveContainer()` helper to determine the target collection (`state.slides` vs `state.masters`).

## 6. Implementation Strategy (Code Reuse)
Instead of branching logic like:
```javascript
if (mode === 'master') { ... } else { ... }
```
We use:
```javascript
const container = getActiveContainer(state);
// operate on container
```
This ensures 100% consistency. Branching is only allowed in the `Store` (inside `getActiveContainer`) or when specific mode-dependent constraints apply (e.g., preventing deletion of the last Master).
This pattern applies to:
- `CanvasManager` (Interaction)
- `PropertyInspector` (UI)
- `Store` (State Mutations)
- `LayerTree` (Hierarchy)
