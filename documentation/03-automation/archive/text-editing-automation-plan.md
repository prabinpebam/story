# Comprehensive Text Editing Automation Plan

**Status:** Draft
**Date:** December 8, 2025
**Focus:** Frontend Automation (E2E & Integration) for Text Editing

## 1. Objectives
To implement a rigorous, industry-standard test suite for the Text Editing system in Story. The goal is to ensure "Figma-like" precision and reliability.

## 2. Testing Strategy (The Pyramid)

### 2.1 Unit Tests (Vitest)
*   **Scope:** Core logic, state management, command history.
*   **Key Cases:**
    *   `TextElement` model validation.
    *   `UpdateTextCommand` undo/redo logic.
    *   HTML sanitization (paste handling).

### 2.2 Integration Tests (Vitest + DOM)
*   **Scope:** Component rendering, event handling without full browser overhead.
*   **Key Cases:**
    *   `TextEditor` component mounting/unmounting.
    *   Property propagation (Store -> Component).

### 2.3 E2E Tests (Playwright) - **Primary Focus**
*   **Scope:** Full user interaction, canvas events, visual validation, browser quirks.
*   **Environment:** Chromium, Firefox, WebKit.

---

## 3. E2E Test Scenarios (Playwright)

### 3.1 Text Object Creation & Lifecycle
| ID | Scenario | Expected Behavior |
|----|----------|-------------------|
| TC-01 | Click to create | Creates auto-width text box at coordinates. Focuses immediately. |
| TC-02 | Drag to create | Creates fixed-width text box. Focuses immediately. |
| TC-03 | Cancel creation | Pressing `Esc` during initial empty state removes the object. |
| TC-04 | Commit creation | Clicking outside or `Cmd+Enter` saves the object. |
| TC-05 | Delete empty | Committing an empty text object should remove it automatically. |

### 3.2 Text Selection & Navigation (Edit Mode)
| ID | Scenario | Expected Behavior |
|----|----------|-------------------|
| TC-06 | Double-click text object | Enters Edit Mode. Selects all text (or places cursor). |
| TC-07 | Double-click word | Selects the specific word. |
| TC-08 | Triple-click | Selects the entire paragraph/line. |
| TC-09 | Shift + Arrow | Extends selection character by character. |
| TC-10 | Cmd/Ctrl + A | Selects all text within the object. |
| TC-11 | Mouse Drag Selection | Selects text range corresponding to drag. |

### 3.3 Text Editing Interactions
| ID | Scenario | Expected Behavior |
|----|----------|-------------------|
| TC-12 | Typing | Inserts characters at caret. Expands box if auto-width. |
| TC-13 | Backspace/Delete | Removes characters. Merges lines if at line start. |
| TC-14 | Enter | Inserts newline. Increases box height. |
| TC-15 | Paste Plain Text | Inserts text without formatting. |
| TC-16 | Paste Rich Text | Strips unsupported formatting, keeps supported (B/I). |

### 3.4 Property Editing (Inspector & Shortcuts)
| ID | Scenario | Validation Method |
|----|----------|-------------------|
| TC-17 | Change Font Family | Visual Snapshot + Computed Style check. |
| TC-18 | Change Font Size | Visual Snapshot + Computed Style check. |
| TC-19 | Change Font Weight | Visual Snapshot + Computed Style check. |
| TC-20 | Change Text Color | Visual Snapshot + Computed Style check. |
| TC-21 | Alignment (L/C/R/J) | Visual Snapshot (text position relative to box). |
| TC-22 | Shortcut: Bold (Cmd+B) | Toggles `font-weight`. |
| TC-23 | Shortcut: Italic (Cmd+I)| Toggles `font-style`. |

### 3.5 Visual Validation & Caret
| ID | Scenario | Validation Method |
|----|----------|-------------------|
| TC-24 | Caret Visibility | Assert `caret-color` or pseudo-element visibility. |
| TC-25 | Selection Highlight | Assert `::selection` background color (if possible) or native behavior. |
| TC-26 | Text Rendering | Pixel-perfect match against "Golden Master" snapshots. |

### 3.6 Master Mode & Placeholders
| ID | Scenario | Expected Behavior |
|----|----------|-------------------|
| TC-27 | Edit Title Placeholder | Updates the layout definition. Instance slides inherit style/position but keep their own content. |
| TC-28 | Edit Body Placeholder | Updates layout. Checks bullet point behavior in placeholders. |
| TC-29 | Static Text in Master | Text added to Master appears on all slides as uneditable (locked) background text. |
| TC-30 | Master -> Instance Propagation | Changing font in Master Title immediately updates Slide Title font. |

---

## 4. Benchmarking Standards
We benchmark against **Figma** and **Google Slides**:
1.  **Commit on Blur:** Clicking canvas commits text.
2.  **Esc Behavior:**
    *   During Creation: Cancel & Delete.
    *   During Editing: Commit & Exit to Selection Mode.
3.  **Auto-Resize:** Text box grows with content unless fixed width.

## 5. Implementation Plan
1.  **Enhance `CanvasHelper`**: Add methods for `doubleClick`, `dragSelect`, `getComputedStyle`.
2.  **Create `TextInspectorPage`**: POM for the text section of the Property Inspector.
3.  **Implement `text-selection.spec.ts`**: Focus on TC-06 to TC-11.
4.  **Implement `text-properties.spec.ts`**: Focus on TC-17 to TC-23.
5.  **Implement `text-lifecycle.spec.ts`**: Focus on TC-01 to TC-05.

## 6. Risks & Gaps
*   **Canvas vs DOM:** If text is rendered on Canvas (not DOM), Playwright cannot "see" it easily. *Assumption: Text editing uses a DOM overlay.*
*   **Caret Testing:** Testing exact caret position is notoriously hard in E2E. We may rely on `window.getSelection()` assertions.
*   **Flakiness:** Visual regression can be flaky across OSs. We will use Docker or high-tolerance thresholds.
