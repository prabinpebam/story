# Feature Spec: Slide Management & Architecture

## 1. Overview
The Slide Management system is the backbone of the application. It handles the creation, organization, and rendering of slides, as well as the inheritance model via Master Slides.

## 2. Data Structure
### 2.1 The Slide Object
```json
{
  "id": "slide_12345",
  "masterId": "master_default", // ID of the master slide it inherits from
  "elements": [ ... ], // Array of Element objects
  "background": { ... }, // Override background (optional)
  "notes": "Speaker notes here...",
  "transition": {
    "type": "fade",
    "duration": 500
  }
}
```

### 2.2 The Master Slide
Master slides are templates. Elements on a master slide are:
- **Locked:** Cannot be moved/deleted on child slides.
- **Placeholders:** Special elements (Text, Image) that can be overridden on child slides without breaking the layout.

## 3. Functional Requirements

### 3.1 Slide Operations
- **Add Slide:** Inserts a new slide after the currently selected one. Default master is applied.
- **Duplicate:** Deep copy of the current slide (including elements and animations).
- **Delete:** Removes slide. If it was the only slide, create a new blank one.
- **Reorder:** Drag and drop in the thumbnail view. Updates the `slides` array order.

### 3.2 Master Slide Inheritance
- When a Master Slide is updated (e.g., logo moved), all child slides must re-render immediately.
- **Overrides:**
    - If a user edits a Placeholder text on a child slide, that content is saved in the child slide.
    - If the Master changes the font of that Placeholder, the child slide updates the font but keeps the user's content.

### 3.3 Layer Management (The Layer Tree)
- **Visual Representation:** A vertical list in the Left Sidebar.
- **Order:** Top of the list = Highest Z-Index (Front).
- **Interactions:**
    - **Reorder:** Drag and drop items in the list to change Z-index.
    - **Visibility:** Toggle "Eye" icon to show/hide. Hidden elements are not rendered but exist in data.
    - **Lock:** Toggle "Padlock" icon. Locked elements cannot be selected on the canvas.
    - **Rename:** Double click layer name to rename.
- **Grouping:**
    - Users can select multiple elements and "Group" (`Ctrl+G`).
    - Groups appear as a folder in the Layer Tree.
    - Transformations applied to a group affect all children.

## 4. UI/UX Details

### 4.1 Slide Thumbnails
- **Real-Time Preview:** Thumbnails must accurately reflect the slide content.
- **Implementation:**
    - **DOM Scaling:** Render the slide content into a container that is scaled down using CSS `transform: scale(0.15)`.
    - **Isolation:** Use Shadow DOM or a scoped container to ensure styles don't bleed, but since we use atomic CSS/inline styles for objects, a simple `div` wrapper works.
    - **Performance:** Only render visible thumbnails (Virtualization) if the deck is large (>50 slides).
- **Active State:** The current slide in the sidebar has a high-contrast border (TE Blue).
- **Drag Feedback:** When reordering, show a blue line indicator between slides.

### 4.2 Context Menu (Right Click)
**[See Context Menu Spec](./context-menu.md)**
- Right-clicking a slide provides options to Duplicate, Delete, or Add New.
