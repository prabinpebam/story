# Text Editing System v2 - Technical Specification

## 1. Overview

This document specifies the technical implementation for the overhauled text editing system. The design prioritizes:

1. **Reliability**: Defensive programming to prevent content loss
2. **Performance**: Leverage native browser capabilities
3. **Maintainability**: Clear separation of concerns, testable units
4. **Compatibility**: Works with existing Store, Renderer, and Master systems

---

## 2. Architecture

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Text Editing System                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐       │
│  │  TextEditManager │───>│   TextElement    │───>│  ContentSanitizer │      │
│  │  (Orchestrator)  │    │   (Renderer)     │    │  (HTML Cleanup)   │      │
│  └────────┬─────────┘    └────────┬─────────┘    └──────────────────┘       │
│           │                       │                                          │
│           │                       │                                          │
│  ┌────────▼─────────┐    ┌────────▼─────────┐    ┌──────────────────┐       │
│  │  PlaceholderMgr  │    │ SelectionManager │    │  TextStyleManager │      │
│  │  (Master/Slide)  │    │ (Selection State)│    │  (Apply Styles)   │      │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                   Store                                      │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐       │
│  │  editor.         │    │  slides.         │    │  masters.        │       │
│  │  editingElementId│    │  [id].elements   │    │  [id].elements   │       │
│  │  textEditState   │    │                  │    │                  │       │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 New Files

| File | Purpose |
|------|---------|
| `src/core/text/TextEditManager.js` | Central orchestrator for text editing |
| `src/core/text/PlaceholderManager.js` | Handle master/slide placeholder logic |
| `src/core/text/SelectionManager.js` | Track and restore text selection |
| `src/core/text/ContentSanitizer.js` | Sanitize HTML content |
| `src/core/text/TextStyleManager.js` | Apply inline text styles |
| `src/core/text/constants.js` | Text editing constants |

### 2.3 Modified Files

| File | Changes |
|------|---------|
| `src/core/renderer/elements/TextElement.js` | Delegate to TextEditManager |
| `src/core/renderer/EditorRenderer.js` | Simplified blur handling |
| `src/core/store/handlers/EditorHandlers.js` | New text edit actions |
| `src/core/Store.js` | New text edit state |

---

## 3. State Management

### 3.1 Editor State Extensions

```javascript
// In Store state
{
  editor: {
    // Existing
    editingElementId: string | null,
    
    // New text editing state
    textEdit: {
      // Tracks if content has been modified since entering edit mode
      isDirty: boolean,
      
      // Last saved content (for recovery)
      lastSavedContent: string | null,
      
      // Selection state for restoration
      savedSelection: {
        anchorOffset: number,
        focusOffset: number,
        anchorNodePath: number[],  // Path to anchor node
        focusNodePath: number[]    // Path to focus node
      } | null,
      
      // For placeholder handling
      originalPromptText: string | null,  // The "Click to add..." text
      isPlaceholderEdit: boolean,
      
      // Debounce timer ID
      saveTimerId: number | null
    }
  }
}
```

### 3.2 New Actions

```javascript
// Editor actions for text editing
const TEXT_EDIT_ACTIONS = {
  // Enter edit mode with metadata
  ENTER_TEXT_EDIT: 'ENTER_TEXT_EDIT',
  // payload: { elementId, selectionType: 'all' | 'caret' | null, clickPosition? }
  
  // Exit edit mode
  EXIT_TEXT_EDIT: 'EXIT_TEXT_EDIT',
  // payload: { save: boolean }
  
  // Save content during editing (debounced)
  SAVE_TEXT_CONTENT: 'SAVE_TEXT_CONTENT',
  // payload: { elementId, content, dimensions? }
  
  // Mark content as dirty
  MARK_TEXT_DIRTY: 'MARK_TEXT_DIRTY',
  // payload: null
  
  // Save selection state
  SAVE_TEXT_SELECTION: 'SAVE_TEXT_SELECTION',
  // payload: { anchorOffset, focusOffset, ... }
  
  // Restore placeholder to prompt
  RESTORE_PLACEHOLDER_PROMPT: 'RESTORE_PLACEHOLDER_PROMPT',
  // payload: { elementId }
};
```

### 3.3 Action Handlers

```javascript
// handlers/TextEditHandlers.js

export function handleEnterTextEdit(draft, payload) {
  const { elementId, selectionType, clickPosition } = payload;
  
  draft.editor.editingElementId = elementId;
  draft.editor.textEdit = {
    isDirty: false,
    lastSavedContent: null,
    savedSelection: null,
    originalPromptText: null,
    isPlaceholderEdit: false,
    saveTimerId: null
  };
  
  // Check if this is a placeholder
  const element = getElement(draft, elementId);
  if (element?.isPlaceholder) {
    draft.editor.textEdit.isPlaceholderEdit = true;
    
    // Store the original prompt text for restoration
    if (element.content?.includes('Click to add')) {
      draft.editor.textEdit.originalPromptText = element.content;
    }
  }
  
  // Store selection type for TextElement to use
  draft.editor.editModeSelectionType = selectionType;
  draft.editor.textEditClickPosition = clickPosition;
}

export function handleExitTextEdit(draft, payload) {
  const { save } = payload;
  
  if (save && draft.editor.textEdit.isDirty) {
    // Content will be saved by the blur handler
    // This just confirms we want to save
  }
  
  // Clear all text edit state
  draft.editor.editingElementId = null;
  draft.editor.textEdit = {
    isDirty: false,
    lastSavedContent: null,
    savedSelection: null,
    originalPromptText: null,
    isPlaceholderEdit: false,
    saveTimerId: null
  };
  draft.editor.editModeSelectionType = null;
  draft.editor.textEditClickPosition = null;
}

export function handleSaveTextContent(draft, payload) {
  const { elementId, content, dimensions } = payload;
  const element = getElement(draft, elementId);
  
  if (!element) return;
  
  // Check if content is effectively empty
  const textContent = content.replace(/<[^>]*>/g, '').trim();
  const isEmpty = textContent === '' || content === '<br>' || content === '<br/>';
  
  if (isEmpty) {
    if (element.isPlaceholder) {
      // Restore placeholder prompt text
      const promptText = draft.editor.textEdit.originalPromptText || 
                         getDefaultPromptText(element.placeholderType);
      element.content = promptText;
      element.hasUserContent = false;
    } else {
      // Delete non-placeholder empty elements
      // (handled by EditorRenderer.handleTextBlur)
    }
  } else {
    element.content = content;
    element.hasUserContent = true;
    
    // Update dimensions if provided
    if (dimensions) {
      if (dimensions.width) element.width = dimensions.width;
      if (dimensions.height) element.height = dimensions.height;
      if (dimensions.x !== undefined) element.x = dimensions.x;
      if (dimensions.y !== undefined) element.y = dimensions.y;
    }
  }
  
  draft.editor.textEdit.isDirty = false;
  draft.editor.textEdit.lastSavedContent = content;
}
```

---

## 4. TextEditManager

Central orchestrator for text editing operations.

### 4.1 Interface

```javascript
// src/core/text/TextEditManager.js

export class TextEditManager {
  constructor(store) {
    this.store = store;
    this.activeElement = null;
    this.debounceTimer = null;
  }
  
  /**
   * Enter edit mode for an element
   * @param {string} elementId - Element to edit
   * @param {Object} options - Entry options
   * @param {'all' | 'caret' | null} options.selectionType - Initial selection
   * @param {{clientX: number, clientY: number}} options.clickPosition - For caret placement
   */
  enterEditMode(elementId, options = {}) { ... }
  
  /**
   * Exit edit mode, saving content
   * @param {boolean} save - Whether to save content
   */
  exitEditMode(save = true) { ... }
  
  /**
   * Handle input event (debounced save)
   * @param {HTMLElement} element - The contenteditable element
   */
  handleInput(element) { ... }
  
  /**
   * Handle blur event
   * @param {HTMLElement} element - The contenteditable element
   */
  handleBlur(element) { ... }
  
  /**
   * Get the current content (sanitized)
   * @returns {string} Sanitized HTML content
   */
  getContent() { ... }
  
  /**
   * Apply a text style to the current selection
   * @param {string} style - Style name (bold, italic, etc.)
   * @param {any} value - Style value
   */
  applyStyle(style, value) { ... }
  
  /**
   * Check if currently in edit mode
   * @returns {boolean}
   */
  isEditing() { ... }
  
  /**
   * Get placeholder prompt text for a type
   * @param {string} placeholderType
   * @returns {string}
   */
  static getPromptText(placeholderType) { ... }
}
```

### 4.2 Implementation

```javascript
import { ContentSanitizer } from './ContentSanitizer.js';
import { SelectionManager } from './SelectionManager.js';
import { DEBOUNCE_INTERVAL, PROMPT_TEXTS } from './constants.js';

export class TextEditManager {
  static instance = null;
  
  static getInstance(store) {
    if (!TextEditManager.instance) {
      TextEditManager.instance = new TextEditManager(store);
    }
    return TextEditManager.instance;
  }
  
  constructor(store) {
    this.store = store;
    this.activeElement = null;
    this.activeDOMElement = null;
    this.debounceTimer = null;
    this.selectionManager = new SelectionManager();
    this.sanitizer = new ContentSanitizer();
  }
  
  enterEditMode(elementId, options = {}) {
    const { selectionType = null, clickPosition = null } = options;
    
    // Exit any current edit session first
    if (this.isEditing()) {
      this.exitEditMode(true);
    }
    
    // Dispatch to store
    this.store.dispatch('ENTER_TEXT_EDIT', {
      elementId,
      selectionType,
      clickPosition
    });
    
    // The actual DOM manipulation happens in TextElement.setEditing()
    // which is triggered by the renderer responding to state change
  }
  
  exitEditMode(save = true) {
    if (!this.isEditing()) return;
    
    // Clear debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    
    // Save content if requested and dirty
    if (save && this.activeDOMElement) {
      this.saveContent(this.activeDOMElement);
    }
    
    // Dispatch exit
    this.store.dispatch('EXIT_TEXT_EDIT', { save });
    
    this.activeElement = null;
    this.activeDOMElement = null;
  }
  
  handleInput(domElement) {
    if (!this.isEditing()) return;
    
    // Mark as dirty
    this.store.dispatch('MARK_TEXT_DIRTY');
    
    // Debounced save
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(() => {
      this.saveContent(domElement);
    }, DEBOUNCE_INTERVAL);
  }
  
  handleBlur(domElement) {
    // Delay to allow focus to settle (UI interactions)
    setTimeout(() => {
      const state = this.store.getState();
      
      // Check if we're still supposed to be editing
      if (!state.editor.editingElementId) return;
      
      // Check if focus moved to a related element (property inspector, etc.)
      // If so, don't exit yet
      if (this.isFocusInRelatedUI()) {
        return;
      }
      
      // Actually exit
      this.exitEditMode(true);
    }, 50);
  }
  
  saveContent(domElement) {
    const state = this.store.getState();
    const elementId = state.editor.editingElementId;
    
    if (!elementId || !domElement) return;
    
    const rawContent = domElement.innerHTML;
    const content = this.sanitizer.sanitize(rawContent);
    
    // Get dimensions for auto-resize modes
    const dimensions = {
      width: domElement.offsetWidth,
      height: domElement.offsetHeight
    };
    
    // Include position if live values exist (for alignment-based resize)
    const textElement = this.getTextElementInstance(elementId);
    if (textElement?._liveX !== undefined) {
      dimensions.x = textElement._liveX;
      dimensions.y = textElement._liveY;
    }
    
    this.store.dispatch('SAVE_TEXT_CONTENT', {
      elementId,
      content,
      dimensions
    });
  }
  
  isFocusInRelatedUI() {
    const activeElement = document.activeElement;
    if (!activeElement) return false;
    
    // Check if focus is in property inspector or other panels
    const panels = [
      '.property-inspector',
      '.toolbar',
      '.color-picker',
      '.flyout'
    ];
    
    return panels.some(selector => 
      activeElement.closest(selector) !== null
    );
  }
  
  isEditing() {
    const state = this.store.getState();
    return state.editor.editingElementId !== null;
  }
  
  getTextElementInstance(elementId) {
    // Get from renderer's element map
    const renderer = this.store.renderer;
    return renderer?.elements?.get(elementId);
  }
  
  static getPromptText(placeholderType) {
    return PROMPT_TEXTS[placeholderType] || '<p>Click to add text</p>';
  }
}
```

---

## 5. PlaceholderManager

Handles master/slide placeholder interactions.

### 5.1 Interface

```javascript
// src/core/text/PlaceholderManager.js

export class PlaceholderManager {
  /**
   * Check if an element is an empty placeholder
   * @param {Object} element - Element data
   * @returns {boolean}
   */
  static isEmptyPlaceholder(element) { ... }
  
  /**
   * Get the prompt text for a placeholder
   * @param {Object} element - Element data
   * @returns {string}
   */
  static getPromptText(element) { ... }
  
  /**
   * Check if content is prompt text
   * @param {string} content - HTML content
   * @returns {boolean}
   */
  static isPromptContent(content) { ... }
  
  /**
   * Clear placeholder for editing (returns empty string)
   * @param {Object} element - Element data
   * @returns {string} Empty content for editing
   */
  static clearForEditing(element) { ... }
  
  /**
   * Restore placeholder after empty edit
   * @param {Object} element - Element data
   * @returns {string} Prompt content
   */
  static restorePrompt(element) { ... }
  
  /**
   * Instantiate a master placeholder onto a slide
   * @param {Object} masterElement - Master placeholder definition
   * @param {string} slideId - Target slide
   * @returns {Object} Slide element with master reference
   */
  static instantiate(masterElement, slideId) { ... }
}
```

### 5.2 Implementation

```javascript
import { PROMPT_TEXTS } from './constants.js';

export class PlaceholderManager {
  static isEmptyPlaceholder(element) {
    if (!element?.isPlaceholder) return false;
    
    const content = element.content || '';
    return this.isPromptContent(content) || 
           content.trim() === '' || 
           element.hasUserContent === false;
  }
  
  static getPromptText(element) {
    if (!element?.isPlaceholder) return '';
    
    const type = element.placeholderType || 'text';
    return PROMPT_TEXTS[type] || PROMPT_TEXTS.text;
  }
  
  static isPromptContent(content) {
    if (!content) return true;
    
    // Check for common prompt patterns
    const promptPatterns = [
      'Click to add',
      'Add text',
      'Enter title',
      'Type here'
    ];
    
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    return promptPatterns.some(pattern => 
      textContent.toLowerCase().includes(pattern.toLowerCase())
    );
  }
  
  static clearForEditing(element) {
    // Return empty content - DOM will show empty, cursor at start
    return '';
  }
  
  static restorePrompt(element) {
    return this.getPromptText(element);
  }
  
  static instantiate(masterElement, slideId) {
    return {
      ...masterElement,
      id: `${slideId}-${masterElement.id}`,
      masterElementId: masterElement.id,
      // Content starts as prompt text
      content: this.getPromptText(masterElement),
      hasUserContent: false
    };
  }
}
```

---

## 6. ContentSanitizer

Cleans and sanitizes HTML content.

### 6.1 Implementation

```javascript
// src/core/text/ContentSanitizer.js

export class ContentSanitizer {
  constructor() {
    this.allowedTags = new Set([
      'p', 'br', 'div',
      'strong', 'b', 'em', 'i', 'u', 's', 'strike',
      'ul', 'ol', 'li',
      'span',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'a'
    ]);
    
    this.allowedAttributes = {
      'span': ['style', 'class'],
      'a': ['href', 'target'],
      'p': ['style'],
      'div': ['style']
    };
    
    this.allowedStyleProperties = new Set([
      'color',
      'background-color',
      'font-size',
      'font-weight',
      'font-style',
      'text-decoration',
      'font-family'
    ]);
  }
  
  sanitize(html) {
    if (!html) return '';
    
    // Create a temporary container
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Recursively sanitize
    this.sanitizeNode(temp);
    
    return temp.innerHTML;
  }
  
  sanitizeNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return; // Text nodes are safe
    }
    
    if (node.nodeType !== Node.ELEMENT_NODE) {
      node.remove();
      return;
    }
    
    const tagName = node.tagName.toLowerCase();
    
    // Check if tag is allowed
    if (!this.allowedTags.has(tagName)) {
      // Replace with children (unwrap)
      const parent = node.parentNode;
      while (node.firstChild) {
        parent.insertBefore(node.firstChild, node);
      }
      parent.removeChild(node);
      return;
    }
    
    // Sanitize attributes
    const allowed = this.allowedAttributes[tagName] || [];
    const attrs = Array.from(node.attributes);
    
    for (const attr of attrs) {
      if (!allowed.includes(attr.name)) {
        node.removeAttribute(attr.name);
      } else if (attr.name === 'style') {
        node.setAttribute('style', this.sanitizeStyle(attr.value));
      } else if (attr.name === 'href') {
        // Only allow http(s) and relative URLs
        if (!this.isValidUrl(attr.value)) {
          node.removeAttribute(attr.name);
        }
      }
    }
    
    // Remove event handlers (security)
    for (const attr of Array.from(node.attributes)) {
      if (attr.name.startsWith('on')) {
        node.removeAttribute(attr.name);
      }
    }
    
    // Recursively sanitize children
    Array.from(node.childNodes).forEach(child => this.sanitizeNode(child));
  }
  
  sanitizeStyle(styleString) {
    if (!styleString) return '';
    
    const result = [];
    const pairs = styleString.split(';');
    
    for (const pair of pairs) {
      const [prop, ...valueParts] = pair.split(':');
      if (!prop) continue;
      
      const property = prop.trim().toLowerCase();
      const value = valueParts.join(':').trim();
      
      if (this.allowedStyleProperties.has(property) && value) {
        result.push(`${property}: ${value}`);
      }
    }
    
    return result.join('; ');
  }
  
  isValidUrl(url) {
    if (!url) return false;
    
    // Allow relative URLs
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      return true;
    }
    
    // Allow http(s)
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
```

---

## 7. SelectionManager

Tracks and restores text selection.

### 7.1 Implementation

```javascript
// src/core/text/SelectionManager.js

export class SelectionManager {
  /**
   * Save the current selection state
   * @param {HTMLElement} container - The contenteditable container
   * @returns {Object|null} Selection state
   */
  saveSelection(container) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return null;
    
    const range = selection.getRangeAt(0);
    
    // Check if selection is within our container
    if (!container.contains(range.commonAncestorContainer)) {
      return null;
    }
    
    return {
      anchorNodePath: this.getNodePath(container, selection.anchorNode),
      anchorOffset: selection.anchorOffset,
      focusNodePath: this.getNodePath(container, selection.focusNode),
      focusOffset: selection.focusOffset
    };
  }
  
  /**
   * Restore a saved selection state
   * @param {HTMLElement} container - The contenteditable container
   * @param {Object} state - Saved selection state
   */
  restoreSelection(container, state) {
    if (!state) return;
    
    try {
      const anchorNode = this.getNodeFromPath(container, state.anchorNodePath);
      const focusNode = this.getNodeFromPath(container, state.focusNodePath);
      
      if (!anchorNode || !focusNode) return;
      
      const selection = window.getSelection();
      selection.removeAllRanges();
      
      const range = document.createRange();
      range.setStart(anchorNode, Math.min(state.anchorOffset, anchorNode.length || 0));
      range.setEnd(focusNode, Math.min(state.focusOffset, focusNode.length || 0));
      
      selection.addRange(range);
    } catch (e) {
      console.warn('Failed to restore selection:', e);
    }
  }
  
  /**
   * Get the path to a node within a container
   * @param {HTMLElement} container
   * @param {Node} node
   * @returns {number[]}
   */
  getNodePath(container, node) {
    const path = [];
    let current = node;
    
    while (current && current !== container) {
      const parent = current.parentNode;
      if (!parent) break;
      
      const index = Array.from(parent.childNodes).indexOf(current);
      path.unshift(index);
      current = parent;
    }
    
    return path;
  }
  
  /**
   * Get a node from a path
   * @param {HTMLElement} container
   * @param {number[]} path
   * @returns {Node|null}
   */
  getNodeFromPath(container, path) {
    let current = container;
    
    for (const index of path) {
      if (!current.childNodes || index >= current.childNodes.length) {
        return null;
      }
      current = current.childNodes[index];
    }
    
    return current;
  }
  
  /**
   * Select all content in a container
   * @param {HTMLElement} container
   */
  selectAll(container) {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(container);
    selection.removeAllRanges();
    selection.addRange(range);
  }
  
  /**
   * Place caret at a specific client position
   * @param {HTMLElement} container
   * @param {number} clientX
   * @param {number} clientY
   */
  placeCaretAtPoint(container, clientX, clientY) {
    let range;
    
    if (document.caretRangeFromPoint) {
      range = document.caretRangeFromPoint(clientX, clientY);
      if (range && !container.contains(range.commonAncestorContainer)) {
        range = null;
      }
    } else if (document.caretPositionFromPoint) {
      const pos = document.caretPositionFromPoint(clientX, clientY);
      if (pos && container.contains(pos.offsetNode)) {
        range = document.createRange();
        range.setStart(pos.offsetNode, pos.offset);
        range.collapse(true);
      }
    }
    
    if (range) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      // Fallback: place at end
      this.placeCaretAtEnd(container);
    }
  }
  
  /**
   * Place caret at the end of content
   * @param {HTMLElement} container
   */
  placeCaretAtEnd(container) {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(container);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}
```

---

## 8. Constants

```javascript
// src/core/text/constants.js

// Debounce interval for auto-save (ms)
export const DEBOUNCE_INTERVAL = 500;

// Prompt texts for placeholder types
export const PROMPT_TEXTS = {
  title: '<h1>Click to add title</h1>',
  subtitle: '<p>Click to add subtitle</p>',
  body: '<p>Click to add text</p>',
  text: '<p>Click to add text</p>',
  picture: '<p>Click to add picture</p>',
  date: '<p>Date</p>',
  slideNumber: '<p>#</p>'
};

// Allowed HTML tags for sanitization
export const ALLOWED_TAGS = [
  'p', 'br', 'div',
  'strong', 'b', 'em', 'i', 'u', 's', 'strike',
  'ul', 'ol', 'li',
  'span',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'a'
];

// Text styling commands
export const STYLE_COMMANDS = {
  bold: 'bold',
  italic: 'italic',
  underline: 'underline',
  strikethrough: 'strikeThrough',
  orderedList: 'insertOrderedList',
  unorderedList: 'insertUnorderedList',
  indent: 'indent',
  outdent: 'outdent'
};

// Keyboard shortcuts for text styling
export const STYLE_SHORTCUTS = {
  'b': 'bold',           // Cmd/Ctrl + B
  'i': 'italic',         // Cmd/Ctrl + I
  'u': 'underline',      // Cmd/Ctrl + U
  'shift+x': 'strikethrough' // Cmd/Ctrl + Shift + X
};
```

---

## 9. TextElement Updates

The existing `TextElement.js` needs updates to integrate with the new system.

### 9.1 Key Changes

```javascript
// In TextElement.js

import { TextEditManager } from '../../text/TextEditManager.js';
import { PlaceholderManager } from '../../text/PlaceholderManager.js';
import { SelectionManager } from '../../text/SelectionManager.js';

export class TextElement extends VisualElement {
  constructor(data) {
    super(data);
    this.selectionManager = new SelectionManager();
  }
  
  setEditing(isEditing, selectionType = null, clickPosition = null) {
    const div = this.domElement;
    if (!div) return;
    
    if (isEditing) {
      // Clear live values
      this._liveX = undefined;
      this._liveY = undefined;
      this._liveWidth = undefined;
      this._liveHeight = undefined;
      
      if (!div.isContentEditable) {
        // Handle placeholder clearing
        if (PlaceholderManager.isEmptyPlaceholder(this.data)) {
          // Clear the prompt text visually
          div.innerHTML = '';
        }
        
        div.contentEditable = true;
        div.style.outline = 'none';
        div.style.cursor = 'text';
        div.style.pointerEvents = 'auto';
        div.focus({ preventScroll: true });
        
        // Handle initial selection
        if (selectionType === 'all') {
          this.selectionManager.selectAll(div);
        } else if (selectionType === 'caret' && clickPosition) {
          this.selectionManager.placeCaretAtPoint(
            div, 
            clickPosition.clientX, 
            clickPosition.clientY
          );
        }
        
        // Attach handlers
        this.attachEditHandlers();
      }
    } else {
      this.cleanupEditMode();
    }
  }
  
  attachEditHandlers() {
    const div = this.domElement;
    
    if (!this._keydownHandler) {
      this._keydownHandler = (e) => this.handleEditKeyDown(e);
      div.addEventListener('keydown', this._keydownHandler);
    }
    
    if (!this._inputHandler) {
      this._inputHandler = (e) => this.handleInput(e);
      div.addEventListener('input', this._inputHandler);
    }
  }
  
  cleanupEditMode() {
    const div = this.domElement;
    if (!div) return;
    
    // Handle empty placeholder restoration
    const textContent = div.textContent?.trim() || '';
    const isEmptyContent = textContent === '';
    
    if (isEmptyContent && this.data.isPlaceholder) {
      // Restore prompt text
      div.innerHTML = PlaceholderManager.getPromptText(this.data);
    }
    
    // Clear live values
    this._liveX = undefined;
    this._liveY = undefined;
    this._liveWidth = undefined;
    this._liveHeight = undefined;
    
    if (div.isContentEditable) {
      div.contentEditable = false;
      div.style.cursor = 'default';
      div.blur();
      
      // Remove handlers
      if (this._keydownHandler) {
        div.removeEventListener('keydown', this._keydownHandler);
        this._keydownHandler = null;
      }
      
      if (this._inputHandler) {
        div.removeEventListener('input', this._inputHandler);
        this._inputHandler = null;
      }
    }
  }
  
  handleInput(e) {
    // Delegate to TextEditManager for debounced save
    const manager = TextEditManager.getInstance(store);
    manager.handleInput(this.domElement);
  }
}
```

---

## 10. EditorRenderer Updates

```javascript
// In EditorRenderer.js - handleTextBlur

handleTextBlur(el) {
  const state = store.getState();
  
  // Only handle if this element is being edited
  if (state.editor.editingElementId !== el.data.id) {
    return;
  }
  
  const div = el.domElement;
  const content = div.innerHTML;
  
  // Check if empty
  const textContent = div.textContent?.trim() || '';
  const isEmptyContent = textContent === '' || content === '<br>' || content === '<br/>';
  
  if (isEmptyContent) {
    if (el.data.isPlaceholder) {
      // Restore placeholder - DO NOT DELETE
      const promptText = PlaceholderManager.getPromptText(el.data);
      store.dispatch('UPDATE_ELEMENT', {
        id: el.data.id,
        content: promptText,
        hasUserContent: false
      });
    } else {
      // Delete empty non-placeholder
      store.dispatch('REMOVE_ELEMENT', el.data.id);
    }
    store.dispatch('SET_EDITING_ELEMENT', null);
    return;
  }
  
  // Save content
  const updates = {
    id: el.data.id,
    content: content,
    hasUserContent: true
  };
  
  // Handle auto-resize dimensions
  const resizing = el.data.style?.resizing || 'fixedWidth';
  if (resizing === 'autoSize' || resizing === 'fixedWidth') {
    updates.width = div.offsetWidth;
    updates.height = div.offsetHeight;
    
    if (el._liveX !== undefined) {
      updates.x = el._liveX;
      updates.y = el._liveY;
    }
  }
  
  store.dispatch('UPDATE_ELEMENT', updates);
  store.dispatch('SET_EDITING_ELEMENT', null);
}
```

---

## 11. Error Handling & Recovery

### 11.1 Content Recovery

```javascript
// src/core/text/ContentRecovery.js

export class ContentRecovery {
  static STORAGE_KEY = 'story-text-drafts';
  
  /**
   * Save a draft to localStorage
   */
  static saveDraft(elementId, content) {
    try {
      const drafts = this.getDrafts();
      drafts[elementId] = {
        content,
        timestamp: Date.now()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(drafts));
    } catch (e) {
      console.warn('Failed to save draft:', e);
    }
  }
  
  /**
   * Get all saved drafts
   */
  static getDrafts() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }
  
  /**
   * Clear a draft after successful save
   */
  static clearDraft(elementId) {
    try {
      const drafts = this.getDrafts();
      delete drafts[elementId];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(drafts));
    } catch (e) {
      console.warn('Failed to clear draft:', e);
    }
  }
  
  /**
   * Clean up old drafts (older than 24 hours)
   */
  static cleanupOldDrafts() {
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const now = Date.now();
    
    try {
      const drafts = this.getDrafts();
      const cleaned = {};
      
      for (const [id, draft] of Object.entries(drafts)) {
        if (now - draft.timestamp < maxAge) {
          cleaned[id] = draft;
        }
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cleaned));
    } catch (e) {
      console.warn('Failed to cleanup drafts:', e);
    }
  }
}
```

---

## 12. Text Style Preset Integration

### 12.1 Overview

The system has a robust text style (preset) system in `themeSettings.textStyles`. Elements can reference these via `styleId`. This section defines how text editing integrates with this system.

### 12.2 Style Resolution Chain

```
┌─────────────────────────────────────────────────────────────────┐
│                    STYLE RESOLUTION ORDER                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Defaults (from StyleResolver)                               │
│     ↓                                                           │
│  2. Global Style (element.styleId → textStyles[styleId])        │
│     ↓                                                           │
│  3. Element Style Override (element.style)                      │
│     ↓                                                           │
│  4. Inline Character Style (<span style="...">)                 │
│                                                                  │
│  Example:                                                        │
│  styleId: "heading1" → fontSize: 44, fontWeight: 700            │
│  element.style: { fontSize: 48 } → overrides to 48              │
│  <span style="font-weight: 400"> → that text is normal weight  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 12.3 StyleResolver Integration

```javascript
// TextEditManager must use StyleResolver for effective properties
import { StyleResolver } from '../../utils/StyleResolver.js';

getEffectiveStyle(element) {
  const state = this.store.getState();
  const theme = state.masters['theme-default'];
  const globalStyles = theme?.themeSettings?.textStyles || {};
  
  return StyleResolver.getEffectiveTextProperties(element, globalStyles);
}
```

### 12.4 styleId Behavior

| Scenario | Behavior |
|----------|----------|
| New placeholder | Inherits `styleId` from master placeholder |
| Apply style from panel | Sets `element.styleId`, clears conflicting `element.style` |
| Apply inline formatting | Creates `<span>` with inline style, keeps `styleId` |
| "Clear Formatting" | Removes spans, resets to `styleId` only |
| "Detach from Style" | Moves `styleId` properties to `element.style`, clears `styleId` |

### 12.5 Mixed Content Handling

When text has mixed inline styles:

```javascript
// Property Inspector shows "Mixed" state
function getSelectionStyle(property) {
  const range = window.getSelection().getRangeAt(0);
  const styles = getStylesInRange(range, property);
  
  if (styles.size === 0) {
    // No inline styles - use element/styleId value
    return { value: getEffectiveStyle(element)[property], mixed: false };
  } else if (styles.size === 1) {
    return { value: [...styles][0], mixed: false };
  } else {
    return { value: null, mixed: true };
  }
}
```

### 12.6 TextStyleManager Class

```javascript
// src/core/text/TextStyleManager.js

import { StyleResolver } from '../../utils/StyleResolver.js';

export class TextStyleManager {
  constructor(store) {
    this.store = store;
  }
  
  /**
   * Apply a text style preset to an element
   */
  applyStylePreset(elementId, styleId) {
    const state = this.store.getState();
    const theme = state.masters['theme-default'];
    const presetStyle = theme?.themeSettings?.textStyles?.[styleId];
    
    if (!presetStyle) {
      console.warn(`Style "${styleId}" not found in theme`);
      return;
    }
    
    // Set styleId and clear conflicting element.style properties
    this.store.dispatch('UPDATE_ELEMENT', {
      id: elementId,
      styleId: styleId,
      style: {} // Clear element-level overrides
    });
  }
  
  /**
   * Apply inline formatting to selection
   */
  applyInlineFormat(format, value) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    switch (format) {
      case 'bold':
        document.execCommand('bold', false, null);
        break;
      case 'italic':
        document.execCommand('italic', false, null);
        break;
      case 'underline':
        document.execCommand('underline', false, null);
        break;
      case 'fontSize':
        // Wrap in span with style
        this.wrapSelectionWithStyle('font-size', `${value}px`);
        break;
      case 'color':
        document.execCommand('foreColor', false, value);
        break;
    }
  }
  
  /**
   * Wrap selection with a style span
   */
  wrapSelectionWithStyle(property, value) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.style[property] = value;
    
    range.surroundContents(span);
  }
  
  /**
   * Clear all inline formatting from selection
   */
  clearFormatting() {
    document.execCommand('removeFormat', false, null);
  }
  
  /**
   * Detach element from style preset
   */
  detachFromStyle(elementId) {
    const state = this.store.getState();
    const element = this.getElement(elementId);
    
    if (!element?.styleId) return;
    
    // Get effective properties from styleId
    const theme = state.masters['theme-default'];
    const globalStyles = theme?.themeSettings?.textStyles || {};
    const effectiveStyle = StyleResolver.getEffectiveTextProperties(element, globalStyles);
    
    // Move to element.style
    this.store.dispatch('UPDATE_ELEMENT', {
      id: elementId,
      styleId: null,
      style: {
        ...element.style,
        fontFamily: effectiveStyle.fontFamily,
        fontSize: effectiveStyle.fontSize,
        fontWeight: effectiveStyle.fontWeight,
        // ... other properties
      }
    });
  }
}
```

---

## 13. Undo/Redo Integration

### 13.1 The Problem

Browser `contenteditable` has its own undo stack. Application has `HistoryManager`. These conflict.

### 13.2 Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    UNDO/REDO STRATEGY                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  DURING EDIT MODE:                                              │
│  - Cmd+Z → Browser handles (character-level undo)               │
│  - Block app-level undo while editing                           │
│  - Store "before" snapshot on ENTER_TEXT_EDIT                   │
│                                                                  │
│  ON EXIT EDIT MODE:                                             │
│  - Compare content: if changed, push to HistoryManager          │
│  - "Before" state is the undo point                             │
│                                                                  │
│  OUTSIDE EDIT MODE:                                             │
│  - Cmd+Z → App undo (restores full state including content)     │
│  - Cmd+Shift+Z → App redo                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 13.3 Implementation

```javascript
// In TextEditManager

enterEditMode(elementId, options = {}) {
  // Capture state BEFORE editing for undo
  const currentState = this.store.getState();
  this.preEditState = structuredClone(currentState);
  this.preEditElementContent = this.getElement(elementId)?.content;
  
  // ... rest of enter logic
}

exitEditMode(save = true) {
  if (save && this.isDirty()) {
    // Content changed - this is an undoable action
    // The SAVE_TEXT_CONTENT dispatch will create history point
    this.saveContent(this.activeDOMElement);
  }
  
  this.preEditState = null;
  this.preEditElementContent = null;
  
  // ... rest of exit logic
}

// Block app-level Cmd+Z during editing
handleKeyDown(e) {
  // Check if Cmd/Ctrl+Z
  if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
    // Let browser handle it (don't propagate to app)
    e.stopPropagation();
    return;
  }
}
```

### 13.4 History Entry Granularity

| Action | Creates History Entry? |
|--------|----------------------|
| Enter edit mode | No (snapshot saved internally) |
| Typing characters | No (browser handles internally) |
| Exit edit mode (content changed) | Yes |
| Exit edit mode (no change) | No |
| Apply style preset | Yes |
| Delete element | Yes |

---

## 14. IME (Input Method Editor) Support

### 14.1 Overview

IME is critical for CJK (Chinese, Japanese, Korean) input. During IME composition, we must not interfere with the input process.

### 14.2 Composition Events

```javascript
// In TextElement.js

attachEditHandlers() {
  const div = this.domElement;
  
  // Track composition state
  this._isComposing = false;
  
  this._compositionStartHandler = () => {
    this._isComposing = true;
  };
  
  this._compositionEndHandler = () => {
    this._isComposing = false;
    // Now safe to process input
    this.handleInput();
  };
  
  div.addEventListener('compositionstart', this._compositionStartHandler);
  div.addEventListener('compositionend', this._compositionEndHandler);
}

handleInput(e) {
  // Skip during IME composition
  if (this._isComposing) return;
  
  // Proceed with normal input handling
  TextEditManager.getInstance().handleInput(this.domElement);
}

handleEditKeyDown(e) {
  // Skip keyboard shortcuts during IME composition
  if (this._isComposing) return;
  
  // ... rest of keydown handling
}
```

### 14.3 Debounce Adjustment

```javascript
// Delay debounced save slightly after composition ends
handleCompositionEnd() {
  this._isComposing = false;
  
  // Small delay to let final character settle
  setTimeout(() => {
    this.handleInput();
  }, 50);
}
```

---

## 15. Property Inspector Synchronization

### 15.1 The Focus Problem

When user clicks a Property Inspector input, `contenteditable` loses focus and selection is lost.

### 15.2 Solution: Selection Preservation

```javascript
// In TextEditManager

// Called when Property Inspector gains focus
onPropertyInspectorFocus() {
  if (!this.isEditing()) return;
  
  // Save current selection
  this.savedSelection = this.selectionManager.saveSelection(this.activeDOMElement);
}

// Called when property changes
onPropertyChange(property, value) {
  if (!this.isEditing()) {
    // Not in edit mode - apply to whole element
    this.applyToElement(property, value);
  } else {
    // In edit mode - apply to selection
    this.restoreSelectionAndApply(property, value);
  }
}

restoreSelectionAndApply(property, value) {
  const div = this.activeDOMElement;
  
  // Restore focus to text
  div.focus();
  
  // Restore selection
  if (this.savedSelection) {
    this.selectionManager.restoreSelection(div, this.savedSelection);
  }
  
  // Apply style to selection
  this.textStyleManager.applyInlineFormat(property, value);
}
```

### 15.3 Property Inspector Updates

```javascript
// TextSection.js (Property Inspector) integration

class TextSection {
  constructor() {
    // Listen for selection changes in text
    events.on('text-selection-change', (data) => {
      this.updateFromSelection(data);
    });
  }
  
  updateFromSelection(data) {
    const { bold, italic, fontSize, color, mixed } = data;
    
    // Update UI to reflect selection state
    this.boldButton.classList.toggle('active', bold);
    this.italicButton.classList.toggle('active', italic);
    
    if (mixed.fontSize) {
      this.fontSizeInput.value = '';
      this.fontSizeInput.placeholder = 'Mixed';
    } else {
      this.fontSizeInput.value = fontSize;
    }
  }
}
```

### 15.4 Focus Return Behavior

| Setting | Behavior |
|---------|----------|
| Auto-return (default) | After property change, focus returns to text |
| Stay in panel | Focus stays in Property Inspector for multiple changes |
| Enter/Tab to return | User explicitly returns to text |

---

## 16. Multi-Element Text Editing

### 16.1 Behavior Definition

When multiple text elements are selected:

| Action | Behavior |
|--------|----------|
| Start typing | Enter edit mode on FIRST text element, deselect others |
| Enter key | Enter edit mode on FIRST text element |
| Double-click one | Enter edit mode on that element only |
| Property change | Apply to ALL selected elements |
| Style preset | Apply to ALL selected elements |
| Delete | Delete ALL selected elements |

### 16.2 Implementation

```javascript
// In CanvasManager.handleKeyDown

handleKeyDown(e) {
  const selectedIds = store.getState().editor.selectedElementIds;
  
  if (selectedIds.length > 1 && isTypingKey(e)) {
    // Multiple elements selected, user starts typing
    const firstTextElement = this.getFirstTextElement(selectedIds);
    
    if (firstTextElement) {
      // Deselect all, select only first text
      store.dispatch('SET_SELECTED_ELEMENTS', [firstTextElement.id]);
      
      // Enter edit mode
      store.dispatch('ENTER_TEXT_EDIT', {
        elementId: firstTextElement.id,
        selectionType: 'all' // Replace all on typing
      });
    }
    
    return;
  }
  
  // ... rest of keydown handling
}

getFirstTextElement(ids) {
  const state = store.getState();
  for (const id of ids) {
    const element = this.getElement(id);
    if (element?.type === 'text') return element;
  }
  return null;
}
```

---

## 17. Paste Handling

### 17.1 Paste Detection

```javascript
// Detect paste source
handlePaste(e) {
  const clipboardData = e.clipboardData;
  
  // Check for internal copy (from this app)
  const internalData = clipboardData.getData('application/x-story-elements');
  if (internalData) {
    return this.handleInternalPaste(JSON.parse(internalData));
  }
  
  // Check for HTML
  const htmlData = clipboardData.getData('text/html');
  if (htmlData) {
    return this.handleRichPaste(htmlData, e);
  }
  
  // Plain text fallback
  const textData = clipboardData.getData('text/plain');
  if (textData) {
    return this.handlePlainPaste(textData, e);
  }
}
```

### 17.2 External HTML Cleaning

```javascript
handleRichPaste(html, e) {
  e.preventDefault();
  
  // Heavy cleaning for external content (Word, Google Docs, web pages)
  const cleaned = this.cleanExternalHtml(html);
  
  // Insert at caret
  document.execCommand('insertHTML', false, cleaned);
}

cleanExternalHtml(html) {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Remove Word-specific cruft
  this.removeWordJunk(temp);
  
  // Remove Google Docs wrapper
  this.removeGoogleDocsWrapper(temp);
  
  // Strip to allowed tags only
  this.sanitizer.sanitizeNode(temp);
  
  // Normalize styles to our format
  this.normalizeStyles(temp);
  
  return temp.innerHTML;
}

removeWordJunk(node) {
  // Remove Word namespace prefixes
  const wordElements = node.querySelectorAll('[class^="Mso"]');
  wordElements.forEach(el => {
    el.className = '';
  });
  
  // Remove Word conditional comments
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_COMMENT);
  const comments = [];
  while (walker.nextNode()) {
    comments.push(walker.currentNode);
  }
  comments.forEach(c => c.remove());
}
```

### 17.3 Image Paste

```javascript
handlePaste(e) {
  // Check for images
  const items = Array.from(e.clipboardData.items);
  const imageItem = items.find(item => item.type.startsWith('image/'));
  
  if (imageItem) {
    // If in text edit mode, exit and create image element
    if (this.isEditing()) {
      this.exitEditMode(true);
    }
    
    // Create image element from clipboard
    const file = imageItem.getAsFile();
    this.createImageFromFile(file);
    
    e.preventDefault();
    return;
  }
  
  // ... continue with text paste
}
```

---

## 18. Content Recovery (Improved)

### 18.1 Robust Key Generation

```javascript
// Use stable identifiers instead of random element IDs
static getDraftKey(element, slideId) {
  if (element.isPlaceholder) {
    // Placeholders have stable types
    return `${slideId}:placeholder:${element.placeholderType}`;
  } else {
    // Regular elements: use slide + position as backup
    return `${slideId}:text:${element.x}:${element.y}`;
  }
}
```

### 18.2 IndexedDB for Large Drafts

```javascript
// For content over localStorage limit
class DraftStorage {
  static DB_NAME = 'story-drafts';
  static STORE_NAME = 'drafts';
  
  static async saveDraft(key, content) {
    // Try localStorage first (fast, synchronous)
    if (content.length < 10000) {
      return ContentRecovery.saveDraft(key, content);
    }
    
    // Use IndexedDB for large content
    const db = await this.openDB();
    const tx = db.transaction(this.STORE_NAME, 'readwrite');
    const store = tx.objectStore(this.STORE_NAME);
    
    await store.put({
      key,
      content,
      timestamp: Date.now()
    });
  }
  
  static async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: 'key' });
        }
      };
    });
  }
}
```

### 18.3 beforeunload Handler

```javascript
// Guarantee save on tab close
window.addEventListener('beforeunload', (e) => {
  const manager = TextEditManager.getInstance();
  
  if (manager.isEditing() && manager.isDirty()) {
    // Force synchronous save
    manager.saveContentSync();
    
    // Optionally warn user
    e.preventDefault();
    e.returnValue = 'You have unsaved changes in a text box.';
  }
});
```

---

## 19. Performance Considerations

### 19.1 Debounced Saves
- Content saved to store every 500ms during typing
- Prevents re-renders during active editing
- Final save on blur guarantees persistence
- Immediate save on significant events (paste, style change)

### 19.2 DOM Updates
- No store updates during typing (would break focus)
- Use `element-live-resize` event for selection box updates
- Batch style changes

### 19.3 Large Content
- Consider virtual scrolling for very long text (future)
- Efficient diff for undo/redo

---

## 20. Accessibility

### 20.1 ARIA Attributes

```javascript
// In TextElement.render()
setupAccessibility() {
  const div = this.domElement;
  
  div.setAttribute('role', 'textbox');
  div.setAttribute('aria-multiline', 'true');
  
  if (this.data.isPlaceholder) {
    div.setAttribute('aria-placeholder', this.getPromptTextContent());
  }
  
  // Update on edit mode change
  div.setAttribute('aria-readonly', !div.isContentEditable);
}

// On entering edit mode
setEditing(true) {
  div.setAttribute('aria-readonly', 'false');
  
  // Announce to screen reader
  this.announceToScreenReader('Editing text. Press Escape to exit.');
}
```

### 20.2 Screen Reader Announcements

```javascript
announceToScreenReader(message) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => announcement.remove(), 1000);
}
```

---

## 21. Testing Strategy

See `text-editing-test-plan.md` for comprehensive test coverage.

Key test categories:
1. Edit mode entry/exit
2. Content saving
3. Placeholder behavior
4. Selection management
5. Style application
6. Keyboard shortcuts
7. IME input
8. styleId integration
9. Undo/Redo
10. Edge cases

---

## 22. Migration Notes

### 22.1 Breaking Changes
None - new system is additive.

### 22.2 Deprecations
- Direct use of `SET_EDITING_ELEMENT` should migrate to `ENTER_TEXT_EDIT`
- Direct blur handlers should delegate to `TextEditManager`

### 22.3 Rollout
Phase-by-phase as defined in UX spec.
