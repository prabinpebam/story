# Test Scenarios Catalog

This document serves as the source of truth for what needs to be tested. It should be updated as new features are added.

## Priority 1: Critical Paths (Smoke Tests)
*These must pass for any release.*

1.  **App Load:** Application loads without console errors.
2.  **Create Slide:** User can add a new slide to the deck.
3.  **Basic Editing:**
    *   Add a text element.
    *   Edit text content.
    *   Move an element on the canvas.
4.  **Theme Application:**
    *   Switching a theme updates the slide background/colors.
5.  **Presentation Mode:**
    *   Enter presentation mode.
    *   Navigate next/previous.
    *   Exit presentation mode.

## Priority 2: Functional Flows
*Important features that should work correctly.*

1.  **Text Formatting:** Bold, Italic, Font Size changes.
2.  **Image Handling:** Upload image, resize image.
3.  **Undo/Redo:** Perform action, undo, verify state, redo, verify state.
4.  **Slide Management:** Reorder slides, delete slide, duplicate slide.
5.  **Master Slides:** Edit a master slide and verify changes propagate to child slides.

## Priority 3: Edge Cases & Error Handling
1.  **Invalid Input:** Entering invalid values in property inputs.
2.  **Performance:** Loading a deck with 50+ slides.
3.  **Responsive:** Verify UI layout on smaller window sizes.

## Priority 4: Accessibility (A11y)
1.  **Keyboard Navigation:** Ensure all toolbar buttons are reachable via Tab.
2.  **Screen Reader:** Ensure slide content is readable by screen readers (if applicable).
3.  **Contrast:** Verify text contrast ratios in the UI panels.

## Priority 5: Visual Regression Candidates
1.  **Theme Gallery:** Verify all theme thumbnails render correctly.
2.  **Complex Slide:** A slide with all element types (Text, Image, Shape) to ensure rendering consistency.
