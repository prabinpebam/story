# Implementation Plan: Text Editing Interaction

This plan outlines the steps to implement the world-class text editing experience as defined in `text-editing-interaction.md`. The current implementation has a basic foundation (double-click to edit, `contentEditable`), but requires significant enhancements.

## Principles
- **Small Incremental Steps:** Each phase should be testable independently.
- **Non-breaking:** Existing text editing functionality must remain operational.
- **Design System:** Use existing components and create new ones only if necessary.
- **Validation:** Verify against the spec at each step.

---

## Current State Analysis

### What Works:
1.  **Double-Click to Edit:** `CanvasManager.handleDoubleClick` dispatches `SET_EDITING_ELEMENT`.
2.  **ContentEditable Activation:** `TextElement.setEditing(true)` sets `contentEditable = true`.
3.  **Content Sync:** `EditorRenderer.handleTextBlur` saves `innerHTML` to store on blur.
4.  **Exit on Click Outside:** Handled via blur event.

### Gaps vs. Spec:
1.  **Enter Key to Edit:** Not implemented. Pressing Enter should enter edit mode with all text selected.
2.  **Initial Selection State:** Double-click enters edit mode but doesn't place cursor at click position or select all text.
3.  **Exit on Escape/Cmd+Enter:** Not explicitly handled; relies on blur.
4.  **Empty Element Deletion:** New empty text elements are not auto-deleted on exit.
5.  **Advanced Selection (Word/Paragraph):** Browser default double/triple-click may work, but quadruple-click is not standard.
6.  **List Auto-formatting:** Not implemented. Typing `- ` should trigger bullet list.
7.  **List Continuation/Termination:** Not implemented. Enter on list item should continue; Enter on empty should exit list.
8.  **Rich Text / Mixed Styles:** Currently uses block-level `innerHTML`. Character-level style ranges are not managed.
9.  **Layout Modes (Auto Width/Height/Fixed):** Partially implemented via `ResizeObserver` and `style.resizing`. UI toggle is pending (Phase 4 in typography plan).
10. **Visual Feedback (Cursor, Selection Highlight):** Relies on browser defaults; can be enhanced with CSS.

---

## Phase 0: Foundation & State Management
**Goal:** Clean up the editing state machine and ensure reliable entry/exit.

### Tasks:
1.  **Audit `SET_EDITING_ELEMENT` handler:**
    -   Ensure it correctly sets `state.editor.editingElementId`.
    -   Emit a dedicated `editing-changed` event for listeners.
2.  **Audit `TextElement.setEditing()`:**
    -   Ensure `contentEditable` is toggled correctly.
    -   Ensure focus is given on `true`.
    -   Ensure the element is removed from interactive hit testing while in edit mode (canvas clicks should not select it).
3.  **Audit `EditorRenderer.renderOverlay`:**
    -   Ensure it calls `setEditing` for all text elements based on `editingElementId`.
    -   Ensure blur handler is attached once.

**Validation:**
-   Double-click text element: enters edit mode, cursor visible.
-   Click outside: exits edit mode, content saved.

---

## Phase 1: Enter/Exit Enhancements
**Goal:** Implement all entry and exit paths per spec.

### 1.1 Enter via Enter Key
-   **Location:** `CanvasManager.handleKeyDown` (or dedicated input handler).
-   **Logic:**
    ```
    if (key === 'Enter' && !editingElementId && selectedElementIds.length === 1) {
        const el = getElement(selectedElementIds[0]);
        if (el.type === 'text') {
            dispatch('SET_EDITING_ELEMENT', el.id);
            // Mark that we need to select all text after edit mode activates
            dispatch('SET_EDIT_MODE_SELECTION', 'all');
        }
    }
    ```
-   **TextElement Side:** After `setEditing(true)` and focus, check `state.editor.editModeSelection`:
    -   If `'all'`: `document.execCommand('selectAll')` or use `Selection` API.
    -   Clear the flag.

### 1.2 Exit via Escape Key
-   **Location:** `TextElement` (listen for keydown on the `div`).
-   **Logic:**
    ```
    if (key === 'Escape' || (key === 'Enter' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        e.stopPropagation();
        dispatch('SET_EDITING_ELEMENT', null);
        // Keep the element selected
    }
    ```

### 1.3 Delete Empty Elements on Exit
-   **Location:** `EditorRenderer.handleTextBlur` or a central blur handler.
-   **Logic:**
    ```
    const textContent = div.textContent.trim();
    if (textContent === '' && wasNewlyCreated) {
        dispatch('REMOVE_ELEMENT', el.id);
        dispatch('UPDATE_SELECTION', []);
    }
    ```
-   **Requirement:** Track if an element was "newly created and never had content". This could be a flag on the element or in the editor state.

### 1.4 Double-Click Cursor Placement
-   **Location:** `TextElement.setEditing(true)` or in a callback from `CanvasManager.handleDoubleClick`.
-   **Logic:**
    -   The browser's `contenteditable` naturally places the cursor on focus where the click happened *if* the click event propagates correctly.
    -   Verify this behavior. If not working, use `document.caretRangeFromPoint(clientX, clientY)` to get the offset and `Selection.setBaseAndExtent()` to place the cursor.

**Validation:**
-   Select text element, press Enter: edit mode activates, all text selected.
-   Press Escape while editing: exit, element remains selected.
-   Create new text element, type nothing, click outside: element deleted.
-   Double-click on a specific word: cursor lands at that position (not selecting all).

---

## Phase 2: List Auto-formatting
**Goal:** Implement bullet and numbered list auto-detection and management.

### 2.1 Auto-Detection Trigger
-   **Location:** Input event listener on the `contentEditable` div.
-   **Logic:**
    ```
    onInput(e) {
        const currentLine = getCurrentLineContent(); // Use Selection API to find current line start/end
        
        // Check for patterns at start of line
        if (/^-\s$/.test(currentLine)) {
            convertToBulletList();
            removePatternFromLine();
        } else if (/^\*\s$/.test(currentLine)) {
            convertToBulletList();
        } else if (/^\d+\.\s$/.test(currentLine)) {
            convertToNumberedList();
        }
        // ... more patterns
    }
    ```
-   **convertToBulletList():**
    -   Wrap the current line in `<li>` inside a `<ul>`.
    -   This requires careful DOM manipulation within `contentEditable`. Using `document.execCommand('insertUnorderedList')` is the simplest approach but has limited control.
    -   For finer control, use the Selection API to wrap/restructure nodes.

### 2.2 List Continuation
-   **Location:** `keydown` listener on the `contentEditable` div.
-   **Logic:**
    ```
    onKeyDown(e) {
        if (e.key === 'Enter') {
            const currentNode = getSelectionNode();
            const isInList = currentNode.closest('li');
            
            if (isInList) {
                const isEmpty = isInList.textContent.trim() === '';
                
                if (isEmpty) {
                    e.preventDefault();
                    // Remove empty li and exit list
                    isInList.remove();
                    // Add a <br> or <p> after the list?
                } else {
                    // Browser default: creates new <li>. Let it happen.
                    // But if numbered, we might need to renumber? Browser handles <ol>.
                }
            }
        }
    }
    ```

### 2.3 List Indentation (Tab / Shift+Tab)
-   **Location:** `keydown` listener.
-   **Logic:**
    ```
    if (e.key === 'Tab') {
        e.preventDefault();
        const li = getSelectionNode().closest('li');
        if (li) {
            if (e.shiftKey) {
                // Outdent: Move li to parent list (or unwrap)
                // document.execCommand('outdent')
            } else {
                // Indent: Wrap li in new ul/ol inside previous li
                // document.execCommand('indent')
            }
        }
    }
    ```

### 2.4 Backspace at Start of List Item
-   **Location:** `keydown` listener.
-   **Logic:**
    ```
    if (e.key === 'Backspace') {
        const selection = window.getSelection();
        const li = selection.anchorNode.closest?.('li');
        
        if (li && selection.anchorOffset === 0 && selection.isCollapsed) {
            e.preventDefault();
            // Convert li to paragraph (remove from list)
        }
    }
    ```

**Validation:**
-   Type `- ` at start of line: converts to bullet list.
-   Type `1. ` at start of line: converts to numbered list.
-   Press Enter in list: adds new list item.
-   Press Enter on empty list item: exits list.
-   Press Tab in list: indents.
-   Press Shift+Tab in list: outdents.
-   Press Backspace at start of list item: converts to paragraph.

---

## Phase 3: Rich Text / Mixed Styles
**Goal:** Support applying different styles to character ranges within a single text element.

### 3.1 Selection-Based Styling
-   **Location:** `TextSection` (Property Inspector) or a dedicated text toolbar.
-   **Logic:**
    -   When a style property (e.g., Bold, Font Size) is changed:
        1.  Check if `editingElementId` is set AND there is a text selection (`!selection.isCollapsed`).
        2.  If yes: Apply style ONLY to selected range using `document.execCommand('bold')` etc., or wrap selection in `<span style="...">`.
        3.  If no selection (caret only): Store as "pending style" in state. The `input` handler applies this to newly typed characters.

### 3.2 Data Model for Mixed Styles
-   **Option A (HTML Content):** Store `content` as HTML string (`<span style="font-weight:700">Hello</span> World`). This is the current approach. Pros: Simple. Cons: Parsing HTML is messy, hard to enforce consistency.
-   **Option B (Attributed String):**
    ```json
    {
        "content": "Hello World",
        "styleRanges": [
            { "start": 0, "end": 5, "styles": { "fontWeight": 700 } }
        ]
    }
    ```
    Pros: Clean data model. Cons: Requires converting to/from HTML for rendering.

-   **Recommendation:** Start with Option A (HTML) as it leverages browser `contentEditable` behavior. Migrate to Option B later if more control is needed.

### 3.3 Property Inspector Integration
-   When editing a text element:
    -   If there's a selection, the Property Inspector should:
        -   Show "mixed" values if the selection spans different styles.
        -   Apply changes only to the selection.
    -   If there's no selection (caret):
        -   Show the style of the character *before* the caret.
        -   Queue style changes for the next typed character.

**Validation:**
-   Select part of text, change color: only selected part changes.
-   Move caret, change font: next typed character uses new font.
-   Select text spanning bold and non-bold: Property Inspector shows "mixed" for font weight.

---

## Phase 4: Layout Modes (Integration with Typography Plan)
**Goal:** Wire up the Auto Width / Auto Height / Fixed Size buttons from the Layout Section to text elements.

*This is covered in the existing Typography Implementation Plan, Phase 4. Ensure coordination.*

### Key Integration Points:
-   **Data:** `element.style.resizing` = `'autoWidth' | 'autoHeight' | 'fixed'`.
-   **UI:** `LayoutSection` adds buttons for text elements.
-   **Renderer:** `TextElement.update()` sets `div.style.width = 'auto'` etc. based on mode.
-   **Canvas Interaction:** In `autoWidth` or `autoHeight` mode, dragging handles to resize should switch mode to `fixed`.

**Validation:**
-   Select text, click Auto Width: text box expands horizontally as typed.
-   Select text, click Auto Height: text wraps at fixed width, height expands.
-   Select text, click Fixed: text box fixed, overflow clipped or visible.

---

## Phase 5: Visual Polish
**Goal:** Enhance cursor and selection visuals.

### 5.1 Cursor Styling
-   **CSS:** `caret-color: var(--color-accent);` on `.slide-element[contenteditable="true"]`.

### 5.2 Selection Highlight
-   **CSS:** `::selection { background: rgba(24, 160, 251, 0.3); }`.

### 5.3 Edit Mode Bounding Box
-   While editing, ensure the bounding box outline remains visible (thin blue line).
-   **Location:** `CanvasManager.drawSelectionBox` or `TextElement` style.
-   Currently, `CanvasManager` skips drawing handles if `isEditing`. Ensure the outline is still drawn.

**Validation:**
-   Enter edit mode: cursor is blue (or accent color).
-   Select text: highlight is semi-transparent blue.
-   Edit mode: bounding box is visible but handles are hidden.

---

## Risks & Dependencies

1.  **`document.execCommand` Deprecation:** This API is deprecated. Modern alternatives are the `Clipboard API` and `InputEvent` with `beforeinput`. For complex formatting, we may eventually need a custom rich-text engine (like ProseMirror or Slate). For now, `execCommand` is acceptable for MVP.
2.  **Cross-Browser Behavior:** `contentEditable` behavior varies. Test on Chrome, Firefox, Safari.
3.  **Performance:** Live sync of `innerHTML` to store can be slow for very long text. Consider debouncing updates.
4.  **Undo/Redo:** Browser's native undo stack for `contentEditable` is separate from application's `HistoryManager`. This can lead to inconsistencies. Consider disabling browser undo (`Cmd+Z` while editing) and using app-level undo, or syncing the two.

---

## Summary / Prioritization

| Phase | Effort | Impact | Priority |
|-------|--------|--------|----------|
| 0: Foundation | Low | High | **P0** |
| 1: Enter/Exit Enhancements | Medium | High | **P0** |
| 2: List Auto-formatting | High | Medium | P1 |
| 3: Rich Text / Mixed Styles | High | High | P1 |
| 4: Layout Modes | Low | Medium | P2 (Depends on Typography Plan) |
| 5: Visual Polish | Low | Low | P2 |

**Recommended Starting Point:** Phase 0, then Phase 1.
