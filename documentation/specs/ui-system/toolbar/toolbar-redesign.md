# Toolbar Redesign Spec

## Overview
A complete redesign of the toolbar to match modern design tools like Figma. The toolbar will be floating, positioned at the bottom-center of the viewport, and use icon-based tools with keyboard shortcuts.

## Visual Design
- **Position**: Fixed at the bottom-center of the screen (e.g., `bottom: 20px; left: 50%; transform: translateX(-50%)`).
- **Appearance**:
  - Floating pill shape.
  - Dark/Light mode compatible (dark background with light icons usually).
  - Drop shadow for depth.
  - Rounded corners.
- **Icons**: Use FontAwesome or SVG icons for tools.
- **Active State**: Highlighted background (e.g., blue or accent color) for the selected tool.

## Tools & Shortcuts

| Tool | Icon | Shortcut | Cursor | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Move** | `fa-arrow-pointer` | `V` | `default` | Select and move objects. |
| **Hand** | `fa-hand` | `H` (or Space) | `grab` | Pan around the canvas. |
| **Frame/Slide** | `fa-hashtag` | `F` | `crosshair` | Create new slides (future). |
| **Rectangle** | `fa-square` | `R` | `crosshair` | Draw rectangles. |
| **Text** | `fa-font` | `T` | `text` | Create text boxes. |
| **Image** | `fa-image` | `Shift+K` | `crosshair` | Place images. |
| **Resources** | `fa-shapes` | `Shift+I` | `default` | Open Icon/Component library. |

## Interaction Behavior
1.  **Selection**: Clicking a tool activates it.
2.  **Keyboard Shortcuts**: Pressing the shortcut key activates the tool immediately.
3.  **Cursor**: The mouse cursor changes based on the active tool.
    - Move: Default arrow.
    - Hand: Open hand.
    - Rectangle/Image: Crosshair.
    - Text: I-beam.
4.  **Floating Panels**:
    - "Resources" (Icon Library) opens a floating panel near the toolbar or centered.
    - Clicking the button again closes the panel.

## Implementation Plan

### 1. HTML Structure
- Remove existing `#toolbar-top`.
- Add `#floating-toolbar` container.
- Add `#floating-panels-container` for things like the Icon Library.

### 2. CSS Styling
- Define `.floating-toolbar` styles.
- Define `.tool-btn` styles (icon only).
- Define cursor classes (`.cursor-move`, `.cursor-text`, etc.) to be applied to the `#interaction-canvas` or `body`.

### 3. JavaScript Logic (`Toolbar.js`)
- **State Management**: Track `activeTool`.
- **Event Listeners**:
  - Click events for buttons.
  - Global `keydown` listener for shortcuts.
- **Cursor Management**: Update the cursor style on the canvas container based on the active tool.
- **Panel Management**: Toggle visibility of the Icon Library panel.

### 4. Migration
- Move `IconLibrary` from Sidebar to a floating panel.
