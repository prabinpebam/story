# Critique & Gap Analysis: Text Editing Automation Plan

**Date:** December 8, 2025
**Reviewer:** GitHub Copilot

## 1. Critical Gaps Identified

### 1.1 Mixed Formatting States (The "Rich Text" Complexity)
*   **Gap:** The plan covers changing properties for the *whole* object, but misses **partial selection**.
*   **Scenario:** Select only one word in a sentence and bold it.
*   **Scenario:** Select a range containing both Bold and Regular text. The Inspector should show a "Mixed" state (often represented as blank or a dash).
*   **Risk:** This is the most common source of bugs in text editors.

### 1.2 Undo/Redo Granularity
*   **Gap:** The plan treats Undo as a generic command.
*   **Nuance:**
    *   **While Editing:** `Cmd+Z` should undo the last *typing burst* (browser native behavior).
    *   **After Commit:** `Cmd+Z` should undo the entire text update.
*   **Risk:** Users expect browser-native undo while typing. If our custom undo stack interferes, it creates a jarring experience.

### 1.3 Canvas Transformation (Zoom/Pan)
*   **Gap:** Text editing usually happens in a DOM overlay on top of a Canvas.
*   **Scenario:** Zoom to 200%, Pan to (1000, 1000), then Double Click to edit.
*   **Risk:** The DOM overlay might be misaligned (wrong x/y or scale) if the coordinate conversion logic is flawed. This needs a specific visual regression test.

### 1.4 Font Loading & Layout Shift
*   **Gap:** Visual snapshots will fail if web fonts (e.g., Inter, Roboto) haven't finished loading.
*   **Mitigation:** Tests must await `document.fonts.ready` before asserting dimensions or taking snapshots.

### 1.5 Clipboard Security
*   **Gap:** `TC-15` and `TC-16` (Paste) often trigger browser security prompts in automated environments.
*   **Mitigation:** Playwright context needs `permissions: ['clipboard-read', 'clipboard-write']` explicitly configured.

## 2. Refined Implementation Strategy

### 2.1 Updated Test Structure
We should split the implementation into three distinct spec files to avoid a monolithic 500-line file:

1.  `text-manipulation.spec.ts`: Typing, Selection, Deletion, Undo/Redo (internal).
2.  `text-properties.spec.ts`: Inspector, Shortcuts, Mixed States.
3.  `text-canvas-integration.spec.ts`: Zoom/Pan alignment, Creation, Lifecycle.

### 2.2 Technical Requirements
*   **Helper Function:** `await editor.waitForFonts()`
*   **Helper Function:** `await editor.selectTextRange(start, end)` (using `evaluate` to manipulate DOM selection directly for precision).

## 3. Conclusion
The original plan is a solid foundation but lacks the "Power User" depth required for a design tool. We must add **Mixed State** and **Zoom/Pan** tests to be truly "Rigorous".
