# Property Inspector: Position & Alignment Specification

## Overview
This document details the "Position" section of the Property Inspector. This section is the primary interface for controlling the placement, alignment, and orientation of selected layers on the canvas.

## 1. Alignment Controls
A row of six icon buttons located at the top of the Position section. These tools align selected layers relative to their parent frame or, if multiple layers are selected, relative to the selection bounds.

### UI Elements
The controls are arranged in two groups (Horizontal and Vertical) or a single row depending on width.

**Horizontal Alignment (Left to Right):**
1.  **Align Left**: Aligns selected object(s) to the left edge of the container/selection.
2.  **Align Horizontal Center**: Centers the object(s) horizontally within the container/selection.
3.  **Align Right**: Aligns object(s) to the right edge of the container/selection.

**Vertical Alignment (Left to Right):**
4.  **Align Top**: Aligns object(s) to the top edge.
5.  **Align Vertical Center**: Aligns object(s) to the vertical center.
6.  **Align Bottom**: Aligns object(s) to the bottom edge.

### Behavior & Interaction
- **Type**: Momentary Action Buttons (Stateless).
- **Interaction**: Click to trigger.
- **Feedback**:
    - **Hover**: Background color change (`--color-bg-hover`).
    - **Active/Press**: Brief flash or darker background.
    - **State**: They do *not* retain a "selected" state after the action is complete.
- **Logic**:
    - **Single Selection**: Aligns relative to the immediate parent Frame/Artboard.
    - **Multi-Selection**: Aligns relative to the bounding box of the selection itself (e.g., "Align Left" aligns all items to the leftmost item's X position).

## 2. Position Coordinates (X & Y)
Two numeric input fields defining the precise location of the layer's anchor point (usually top-left).

### UI Elements
- **X Input**:
    - **Label**: "X" (Prefix).
    - **Value**: Numeric (e.g., `22460`).
- **Y Input**:
    - **Label**: "Y" (Prefix).
    - **Value**: Numeric (e.g., `-4334`).

### Behavior & Interaction
- **Editable**: Users can type directly into the field.
- **Scrubbable**: Dragging the "X" or "Y" label horizontally increments/decrements the value.
- **Keyboard Support**:
    - `Arrow Up/Down`: Increment/Decrement by 1.
    - `Shift + Arrow Up/Down`: Increment/Decrement by 10 (Big Nudge).
- **Units**: Pixels (default).
- **Range**: Supports negative and positive values. Canvas is infinite.
- **Real-time**: Changing the value immediately updates the layer position on the canvas.

## 3. Rotation & Transform
A row containing the rotation angle input and three quick-transform utility buttons.

### UI Elements

**1. Rotation Angle Input**
- **Label**: Rotation Icon (or "L" shape symbol).
- **Value**: Numeric degrees (e.g., `180°`).
- **Behavior**:
    - Accepts positive (0 to 360) and negative values.
    - Values > 360 wrap visually (e.g., 370° displays as 10° or keeps value depending on implementation preference, usually normalized).
    - Scrubbable label.

**2. Transform Buttons (Right of Input)**
- **Rotate -90°**:
    - **Icon**: Curved arrow rotating left (Counter-clockwise).
    - **Action**: Subtracts 90° from the current rotation.
- **Flip Horizontal**:
    - **Icon**: Two triangles mirrored horizontally (|< >| style).
    - **Action**: Mirrors the object along the X-axis (Sets `scaleX = -1`).
- **Flip Vertical**:
    - **Icon**: Two triangles mirrored vertically.
    - **Action**: Mirrors the object along the Y-axis (Sets `scaleY = -1`).

### Behavior & Interaction
- **Transform Origin**: Rotations and flips occur around the layer's center point (default) or transform origin if adjustable.
- **Toggle State**: Flip buttons may show an active state (highlighted) if the object is currently flipped (scale is negative).

## Summary Table

| Feature | Type | Description |
| :--- | :--- | :--- |
| **Align Left** | Action Button | Align to left edge. |
| **Align H. Center** | Action Button | Align to horizontal center. |
| **Align Right** | Action Button | Align to right edge. |
| **Align Top** | Action Button | Align to top edge. |
| **Align V. Center** | Action Button | Align to vertical center. |
| **Align Bottom** | Action Button | Align to bottom edge. |
| **X Position** | Numeric Input | Horizontal coordinate. |
| **Y Position** | Numeric Input | Vertical coordinate. |
| **Rotation** | Numeric Input | Angle in degrees. |
| **Rotate -90°** | Action Button | Quick counter-clockwise rotation. |
| **Flip Horizontal** | Toggle/Action | Mirror left ↔ right. |
| **Flip Vertical** | Toggle/Action | Mirror top ↔ bottom. |
