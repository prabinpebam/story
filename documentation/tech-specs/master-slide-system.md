# Technical Specification: Master Slide System

## 1. Concept
Master Slides (or "Layouts") act as templates. Regular slides can "inherit" from a Master Slide. Elements on the Master Slide appear on the child slide but are locked/uneditable by default unless "detached".

## 2. Data Model

### 2.1 Master Slide Schema
Identical to `SlideModel` but stored in a separate collection.
```javascript
const MasterSlide = {
  id: "master-1",
  name: "Title & Body",
  background: { ... },
  elements: {
    "m-el-1": { ...TextElement, placeholder: "Title" }, // Placeholders
    "m-el-2": { ...ShapeElement } // Static design elements
  }
};
```

### 2.2 Slide Reference
Regular slides reference a master ID.
```javascript
const Slide = {
  id: "slide-1",
  masterId: "master-1", // Link to parent
  // ...
};
```

## 3. Rendering Logic
When rendering a slide:
1.  **Fetch Master:** Look up `slide.masterId`.
2.  **Render Master Layer:** Render all elements from the Master Slide first (at the bottom of the stack).
    - *Optimization:* These can be rendered into a cached canvas or separate DOM container (`#slide-master-layer`) to avoid re-rendering static assets.
3.  **Render Slide Layer:** Render the slide's own elements on top.

## 4. Editing Master Slides
- **Mode Switch:** A toggle in the UI switches the view from "Slide Editor" to "Master Editor".
- **UI Changes:** The slide list sidebar is replaced by the "Master Layouts" list.
- **Actions:**
    - Create new Master.
    - Duplicate existing Master.
    - Add "Placeholders" (Text/Image areas that users can fill in child slides).

## 5. Applying Masters
- **Slide Properties:** In the Property Inspector (when no element is selected), a dropdown "Layout" allows changing the assigned Master Slide.
- **Effect:**
    - The background updates immediately.
    - Master elements appear.
    - *Smart Match:* If the previous master had a "Title" placeholder and the new one does too, the content is preserved.

## 6. Detaching/Overriding
- **Override:** If a user wants to move a Master element on *just one* slide, they can "Unlock/Detach" it.
- **Implementation:** The element is copied from the Master `elements` map to the Slide's `elements` map, and the link is broken for that specific element.
