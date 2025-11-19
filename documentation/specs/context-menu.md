# Feature Spec: Context Menu System

## 1. Overview
The application features a custom, context-aware right-click menu system. It replaces the native browser context menu within the app workspace to provide relevant actions.

## 2. Global Behavior
- **Trigger:** Right-click (Mouse) or Two-finger click (Trackpad).
- **Appearance:**
    - Dark gray background (`#262626`).
    - White text.
    - Thin border (`#404040`).
    - Slight drop shadow.
- **Dismissal:** Clicking outside the menu or pressing `Esc`.

## 3. Contexts

### 3.1 Canvas (Empty Space)
When clicking on the background or scratchpad area:
- **Paste:** Paste copied elements.
- **Select All:** (`Ctrl+A`) Selects all elements on the slide.
- **Grid Settings:** Toggle Grid / Snap to Grid.
- **Background:** Quick access to "Edit Background".
- **Reset View:** "Fit to Screen" (`Shift+1`).

### 3.2 Selected Object(s)
When clicking on a Text, Shape, or Image:
- **Edit:**
    - **Cut** (`Ctrl+X`)
    - **Copy** (`Ctrl+C`)
    - **Paste** (`Ctrl+V`)
    - **Duplicate** (`Ctrl+D`)
    - **Delete** (`Del`)
- **Arrange:**
    - **Bring to Front** (`]`)
    - **Bring Forward**
    - **Send Backward**
    - **Send to Back** (`[`)
- **Grouping:**
    - **Group** (`Ctrl+G`) / **Ungroup** (`Ctrl+Shift+G`)
- **Transform:**
    - **Flip Horizontal**
    - **Flip Vertical**
- **AI Actions:** (If Text is selected)
    - "Shorten Text"
    - "Rewrite"

### 3.3 Slide List (Thumbnail)
When clicking on a slide in the left sidebar:
- **New Slide:** Insert after current.
- **Duplicate Slide:** Clone current slide.
- **Delete Slide:** Remove.
- **Rename:** (If applicable to internal ID).
- **Apply Master:** Submenu to choose a Master Slide.

### 3.4 Layer Tree
When clicking on an item in the layer list:
- **Rename**
- **Lock/Unlock**
- **Hide/Show**
- **Delete**

## 4. Technical Implementation
- **Event Listener:** `contextmenu` event on the `#app` container. `e.preventDefault()` to stop native menu.
- **Positioning:**
    - Calculate `e.clientX` and `e.clientY`.
    - **Boundary Detection:** If the menu would overflow the right/bottom edge of the viewport, shift it left/up.
- **State:** The menu content is dynamic based on the `store.state.selection` and the `e.target`.
