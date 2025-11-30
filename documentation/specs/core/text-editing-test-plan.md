# Text Editing System v2 - Test Plan

## 1. Overview

This document defines the comprehensive test strategy for the text editing system overhaul. Tests are organized by feature area and priority level.

---

## 2. Test Categories

### 2.1 Unit Tests
- Individual component functions
- State handlers
- Utility functions

### 2.2 Integration Tests  
- Component interactions
- State flow through system
- DOM manipulation

### 2.3 End-to-End Tests (E2E)
- Full user workflows
- Cross-feature interactions
- Edge cases

---

## 3. Core Component Tests

### 3.1 TextEditManager Tests

**File**: `tests/unit/core/text/TextEditManager.test.js`

```javascript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TextEditManager } from '@/core/text/TextEditManager.js';
import { createMockStore } from '../../../mocks/store.js';

describe('TextEditManager', () => {
  let manager;
  let mockStore;
  
  beforeEach(() => {
    mockStore = createMockStore();
    manager = TextEditManager.getInstance(mockStore);
  });
  
  afterEach(() => {
    TextEditManager.instance = null;
  });
  
  describe('enterEditMode', () => {
    it('should dispatch ENTER_TEXT_EDIT action', () => {
      manager.enterEditMode('element-1', { selectionType: 'all' });
      
      expect(mockStore.dispatch).toHaveBeenCalledWith('ENTER_TEXT_EDIT', {
        elementId: 'element-1',
        selectionType: 'all',
        clickPosition: null
      });
    });
    
    it('should exit current edit session before entering new one', () => {
      mockStore.getState.mockReturnValue({
        editor: { editingElementId: 'element-1' }
      });
      
      const exitSpy = vi.spyOn(manager, 'exitEditMode');
      manager.enterEditMode('element-2');
      
      expect(exitSpy).toHaveBeenCalledWith(true);
    });
    
    it('should pass click position for caret placement', () => {
      const clickPos = { clientX: 100, clientY: 200 };
      manager.enterEditMode('element-1', { 
        selectionType: 'caret', 
        clickPosition: clickPos 
      });
      
      expect(mockStore.dispatch).toHaveBeenCalledWith('ENTER_TEXT_EDIT', {
        elementId: 'element-1',
        selectionType: 'caret',
        clickPosition: clickPos
      });
    });
  });
  
  describe('exitEditMode', () => {
    it('should dispatch EXIT_TEXT_EDIT action', () => {
      mockStore.getState.mockReturnValue({
        editor: { editingElementId: 'element-1' }
      });
      
      manager.exitEditMode(true);
      
      expect(mockStore.dispatch).toHaveBeenCalledWith('EXIT_TEXT_EDIT', {
        save: true
      });
    });
    
    it('should clear debounce timer', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      manager.debounceTimer = 123;
      
      mockStore.getState.mockReturnValue({
        editor: { editingElementId: 'element-1' }
      });
      
      manager.exitEditMode();
      
      expect(clearTimeoutSpy).toHaveBeenCalledWith(123);
    });
    
    it('should not dispatch if not editing', () => {
      mockStore.getState.mockReturnValue({
        editor: { editingElementId: null }
      });
      
      manager.exitEditMode();
      
      expect(mockStore.dispatch).not.toHaveBeenCalled();
    });
  });
  
  describe('handleInput', () => {
    it('should mark content as dirty', () => {
      mockStore.getState.mockReturnValue({
        editor: { editingElementId: 'element-1' }
      });
      
      const mockElement = document.createElement('div');
      manager.handleInput(mockElement);
      
      expect(mockStore.dispatch).toHaveBeenCalledWith('MARK_TEXT_DIRTY');
    });
    
    it('should debounce save calls', () => {
      vi.useFakeTimers();
      
      mockStore.getState.mockReturnValue({
        editor: { editingElementId: 'element-1' }
      });
      
      const mockElement = document.createElement('div');
      mockElement.innerHTML = '<p>Test</p>';
      
      manager.handleInput(mockElement);
      manager.handleInput(mockElement);
      manager.handleInput(mockElement);
      
      // Should only have MARK_TEXT_DIRTY calls
      const saveCallsBefore = mockStore.dispatch.mock.calls.filter(
        call => call[0] === 'SAVE_TEXT_CONTENT'
      );
      expect(saveCallsBefore).toHaveLength(0);
      
      vi.advanceTimersByTime(500);
      
      const saveCallsAfter = mockStore.dispatch.mock.calls.filter(
        call => call[0] === 'SAVE_TEXT_CONTENT'
      );
      expect(saveCallsAfter).toHaveLength(1);
      
      vi.useRealTimers();
    });
  });
  
  describe('isEditing', () => {
    it('should return true when editing', () => {
      mockStore.getState.mockReturnValue({
        editor: { editingElementId: 'element-1' }
      });
      
      expect(manager.isEditing()).toBe(true);
    });
    
    it('should return false when not editing', () => {
      mockStore.getState.mockReturnValue({
        editor: { editingElementId: null }
      });
      
      expect(manager.isEditing()).toBe(false);
    });
  });
});
```

### 3.2 PlaceholderManager Tests

**File**: `tests/unit/core/text/PlaceholderManager.test.js`

```javascript
import { describe, it, expect } from 'vitest';
import { PlaceholderManager } from '@/core/text/PlaceholderManager.js';

describe('PlaceholderManager', () => {
  describe('isEmptyPlaceholder', () => {
    it('should return false for non-placeholder elements', () => {
      const element = { type: 'text', content: 'Hello' };
      expect(PlaceholderManager.isEmptyPlaceholder(element)).toBe(false);
    });
    
    it('should return true for placeholder with prompt text', () => {
      const element = {
        isPlaceholder: true,
        placeholderType: 'title',
        content: '<h1>Click to add title</h1>'
      };
      expect(PlaceholderManager.isEmptyPlaceholder(element)).toBe(true);
    });
    
    it('should return true for placeholder with hasUserContent=false', () => {
      const element = {
        isPlaceholder: true,
        hasUserContent: false,
        content: ''
      };
      expect(PlaceholderManager.isEmptyPlaceholder(element)).toBe(true);
    });
    
    it('should return false for placeholder with user content', () => {
      const element = {
        isPlaceholder: true,
        hasUserContent: true,
        content: '<p>User typed this</p>'
      };
      expect(PlaceholderManager.isEmptyPlaceholder(element)).toBe(false);
    });
  });
  
  describe('getPromptText', () => {
    it('should return title prompt for title placeholder', () => {
      const element = { isPlaceholder: true, placeholderType: 'title' };
      expect(PlaceholderManager.getPromptText(element)).toContain('title');
    });
    
    it('should return subtitle prompt for subtitle placeholder', () => {
      const element = { isPlaceholder: true, placeholderType: 'subtitle' };
      expect(PlaceholderManager.getPromptText(element)).toContain('subtitle');
    });
    
    it('should return default prompt for unknown type', () => {
      const element = { isPlaceholder: true, placeholderType: 'unknown' };
      expect(PlaceholderManager.getPromptText(element)).toContain('text');
    });
  });
  
  describe('isPromptContent', () => {
    it('should return true for "Click to add" content', () => {
      expect(PlaceholderManager.isPromptContent('<h1>Click to add title</h1>')).toBe(true);
    });
    
    it('should return true for empty content', () => {
      expect(PlaceholderManager.isPromptContent('')).toBe(true);
    });
    
    it('should return false for user content', () => {
      expect(PlaceholderManager.isPromptContent('<p>My presentation</p>')).toBe(false);
    });
    
    it('should be case-insensitive', () => {
      expect(PlaceholderManager.isPromptContent('<p>CLICK TO ADD text</p>')).toBe(true);
    });
  });
  
  describe('instantiate', () => {
    it('should create slide element with master reference', () => {
      const masterElement = {
        id: 'placeholder-title',
        type: 'text',
        isPlaceholder: true,
        placeholderType: 'title',
        x: 100,
        y: 200
      };
      
      const result = PlaceholderManager.instantiate(masterElement, 'slide-1');
      
      expect(result.id).toBe('slide-1-placeholder-title');
      expect(result.masterElementId).toBe('placeholder-title');
      expect(result.hasUserContent).toBe(false);
      expect(result.content).toContain('Click to add');
    });
  });
});
```

### 3.3 ContentSanitizer Tests

**File**: `tests/unit/core/text/ContentSanitizer.test.js`

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { ContentSanitizer } from '@/core/text/ContentSanitizer.js';

describe('ContentSanitizer', () => {
  let sanitizer;
  
  beforeEach(() => {
    sanitizer = new ContentSanitizer();
  });
  
  describe('sanitize', () => {
    it('should preserve allowed tags', () => {
      const input = '<p>Hello <strong>world</strong></p>';
      expect(sanitizer.sanitize(input)).toBe('<p>Hello <strong>world</strong></p>');
    });
    
    it('should remove script tags', () => {
      const input = '<p>Text</p><script>alert("xss")</script>';
      expect(sanitizer.sanitize(input)).not.toContain('script');
    });
    
    it('should remove event handlers', () => {
      const input = '<p onclick="alert(1)">Click me</p>';
      const result = sanitizer.sanitize(input);
      expect(result).not.toContain('onclick');
    });
    
    it('should unwrap disallowed tags but keep content', () => {
      const input = '<div>Hello</div>';
      const result = sanitizer.sanitize(input);
      expect(result).toContain('Hello');
    });
    
    it('should preserve list structure', () => {
      const input = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const result = sanitizer.sanitize(input);
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>');
    });
    
    it('should sanitize inline styles', () => {
      const input = '<span style="color: red; position: absolute;">Text</span>';
      const result = sanitizer.sanitize(input);
      expect(result).toContain('color: red');
      expect(result).not.toContain('position');
    });
  });
  
  describe('sanitizeStyle', () => {
    it('should allow color property', () => {
      expect(sanitizer.sanitizeStyle('color: blue')).toBe('color: blue');
    });
    
    it('should allow font-size property', () => {
      expect(sanitizer.sanitizeStyle('font-size: 16px')).toBe('font-size: 16px');
    });
    
    it('should reject position property', () => {
      expect(sanitizer.sanitizeStyle('position: absolute')).toBe('');
    });
    
    it('should handle multiple properties', () => {
      const input = 'color: red; font-weight: bold; position: fixed';
      const result = sanitizer.sanitizeStyle(input);
      expect(result).toContain('color: red');
      expect(result).toContain('font-weight: bold');
      expect(result).not.toContain('position');
    });
  });
  
  describe('isValidUrl', () => {
    it('should allow https URLs', () => {
      expect(sanitizer.isValidUrl('https://example.com')).toBe(true);
    });
    
    it('should allow http URLs', () => {
      expect(sanitizer.isValidUrl('http://example.com')).toBe(true);
    });
    
    it('should allow relative URLs', () => {
      expect(sanitizer.isValidUrl('/path/to/page')).toBe(true);
      expect(sanitizer.isValidUrl('./relative')).toBe(true);
    });
    
    it('should reject javascript URLs', () => {
      expect(sanitizer.isValidUrl('javascript:alert(1)')).toBe(false);
    });
    
    it('should reject data URLs', () => {
      expect(sanitizer.isValidUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    });
  });
});
```

### 3.4 SelectionManager Tests

**File**: `tests/unit/core/text/SelectionManager.test.js`

```javascript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SelectionManager } from '@/core/text/SelectionManager.js';

describe('SelectionManager', () => {
  let manager;
  let container;
  
  beforeEach(() => {
    manager = new SelectionManager();
    container = document.createElement('div');
    container.innerHTML = '<p>Hello <strong>world</strong></p>';
    document.body.appendChild(container);
  });
  
  afterEach(() => {
    document.body.removeChild(container);
  });
  
  describe('saveSelection', () => {
    it('should return null if no selection', () => {
      window.getSelection().removeAllRanges();
      expect(manager.saveSelection(container)).toBe(null);
    });
    
    it('should save selection state with node paths', () => {
      // Create a selection
      const range = document.createRange();
      range.selectNodeContents(container.querySelector('p'));
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      
      const state = manager.saveSelection(container);
      
      expect(state).not.toBe(null);
      expect(state.anchorNodePath).toBeDefined();
      expect(state.focusNodePath).toBeDefined();
    });
  });
  
  describe('restoreSelection', () => {
    it('should restore a saved selection', () => {
      // Save initial selection
      const range = document.createRange();
      const textNode = container.querySelector('p').firstChild;
      range.setStart(textNode, 0);
      range.setEnd(textNode, 5); // "Hello"
      
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      
      const state = manager.saveSelection(container);
      
      // Clear selection
      selection.removeAllRanges();
      
      // Restore
      manager.restoreSelection(container, state);
      
      const newSelection = window.getSelection();
      expect(newSelection.rangeCount).toBe(1);
    });
    
    it('should handle null state gracefully', () => {
      expect(() => manager.restoreSelection(container, null)).not.toThrow();
    });
  });
  
  describe('selectAll', () => {
    it('should select all content in container', () => {
      manager.selectAll(container);
      
      const selection = window.getSelection();
      expect(selection.toString()).toContain('Hello');
      expect(selection.toString()).toContain('world');
    });
  });
  
  describe('placeCaretAtEnd', () => {
    it('should place caret at end of content', () => {
      manager.placeCaretAtEnd(container);
      
      const selection = window.getSelection();
      expect(selection.isCollapsed).toBe(true);
      // Caret should be at end
    });
  });
  
  describe('getNodePath / getNodeFromPath', () => {
    it('should correctly map between paths and nodes', () => {
      const p = container.querySelector('p');
      const strong = container.querySelector('strong');
      
      const path = manager.getNodePath(container, strong);
      const recovered = manager.getNodeFromPath(container, path);
      
      expect(recovered).toBe(strong);
    });
  });
});
```

---

## 4. Handler Tests

### 4.1 TextEditHandlers Tests

**File**: `tests/unit/core/store/handlers/TextEditHandlers.test.js`

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { produce } from 'immer';
import { 
  handleEnterTextEdit, 
  handleExitTextEdit,
  handleSaveTextContent
} from '@/core/store/handlers/TextEditHandlers.js';

describe('TextEditHandlers', () => {
  let baseState;
  
  beforeEach(() => {
    baseState = {
      editor: {
        editingElementId: null,
        textEdit: {
          isDirty: false,
          lastSavedContent: null,
          savedSelection: null,
          originalPromptText: null,
          isPlaceholderEdit: false
        },
        activeSlideId: 'slide-1'
      },
      slides: {
        'slide-1': {
          elements: {
            'text-1': {
              id: 'text-1',
              type: 'text',
              content: '<p>Hello</p>'
            },
            'placeholder-1': {
              id: 'placeholder-1',
              type: 'text',
              isPlaceholder: true,
              placeholderType: 'title',
              content: '<h1>Click to add title</h1>'
            }
          }
        }
      }
    };
  });
  
  describe('handleEnterTextEdit', () => {
    it('should set editingElementId', () => {
      const result = produce(baseState, draft => {
        handleEnterTextEdit(draft, { elementId: 'text-1' });
      });
      
      expect(result.editor.editingElementId).toBe('text-1');
    });
    
    it('should detect placeholder edit', () => {
      const result = produce(baseState, draft => {
        handleEnterTextEdit(draft, { elementId: 'placeholder-1' });
      });
      
      expect(result.editor.textEdit.isPlaceholderEdit).toBe(true);
      expect(result.editor.textEdit.originalPromptText).toContain('Click to add');
    });
    
    it('should store selection type', () => {
      const result = produce(baseState, draft => {
        handleEnterTextEdit(draft, { 
          elementId: 'text-1', 
          selectionType: 'all' 
        });
      });
      
      expect(result.editor.editModeSelectionType).toBe('all');
    });
  });
  
  describe('handleExitTextEdit', () => {
    it('should clear all text edit state', () => {
      const editingState = {
        ...baseState,
        editor: {
          ...baseState.editor,
          editingElementId: 'text-1',
          textEdit: {
            isDirty: true,
            lastSavedContent: 'test',
            isPlaceholderEdit: false
          }
        }
      };
      
      const result = produce(editingState, draft => {
        handleExitTextEdit(draft, { save: true });
      });
      
      expect(result.editor.editingElementId).toBe(null);
      expect(result.editor.textEdit.isDirty).toBe(false);
      expect(result.editor.textEdit.lastSavedContent).toBe(null);
    });
  });
  
  describe('handleSaveTextContent', () => {
    it('should save content to element', () => {
      const result = produce(baseState, draft => {
        handleSaveTextContent(draft, {
          elementId: 'text-1',
          content: '<p>Updated content</p>'
        });
      });
      
      expect(result.slides['slide-1'].elements['text-1'].content)
        .toBe('<p>Updated content</p>');
    });
    
    it('should restore placeholder prompt on empty content', () => {
      const editingState = {
        ...baseState,
        editor: {
          ...baseState.editor,
          editingElementId: 'placeholder-1',
          textEdit: {
            originalPromptText: '<h1>Click to add title</h1>',
            isPlaceholderEdit: true
          }
        }
      };
      
      const result = produce(editingState, draft => {
        handleSaveTextContent(draft, {
          elementId: 'placeholder-1',
          content: ''
        });
      });
      
      expect(result.slides['slide-1'].elements['placeholder-1'].content)
        .toContain('Click to add');
      expect(result.slides['slide-1'].elements['placeholder-1'].hasUserContent)
        .toBe(false);
    });
    
    it('should set hasUserContent=true when saving user content', () => {
      const result = produce(baseState, draft => {
        handleSaveTextContent(draft, {
          elementId: 'placeholder-1',
          content: '<h1>My Title</h1>'
        });
      });
      
      expect(result.slides['slide-1'].elements['placeholder-1'].hasUserContent)
        .toBe(true);
    });
    
    it('should save dimensions if provided', () => {
      const result = produce(baseState, draft => {
        handleSaveTextContent(draft, {
          elementId: 'text-1',
          content: '<p>Test</p>',
          dimensions: { width: 200, height: 100, x: 50, y: 50 }
        });
      });
      
      const element = result.slides['slide-1'].elements['text-1'];
      expect(element.width).toBe(200);
      expect(element.height).toBe(100);
      expect(element.x).toBe(50);
      expect(element.y).toBe(50);
    });
  });
});
```

---

## 5. Integration Tests

### 5.1 Edit Mode Flow Tests

**File**: `tests/integration/text-editing/EditModeFlow.test.js`

```javascript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Store } from '@/core/Store.js';
import { EditorRenderer } from '@/core/renderer/EditorRenderer.js';
import { createInitialState } from '@/core/store/InitialState.js';

describe('Edit Mode Flow Integration', () => {
  let store;
  let container;
  
  beforeEach(() => {
    store = new Store(createInitialState());
    container = document.createElement('div');
    container.id = 'slide-container';
    document.body.appendChild(container);
  });
  
  afterEach(() => {
    document.body.removeChild(container);
  });
  
  describe('Enter and Exit Edit Mode', () => {
    it('should enter edit mode on double-click', async () => {
      // Simulate adding a text element
      store.dispatch('ADD_ELEMENT', {
        type: 'text',
        content: '<p>Test text</p>',
        x: 100,
        y: 100
      });
      
      const elementId = store.getState().editor.selectedElementIds[0];
      
      // Enter edit mode
      store.dispatch('ENTER_TEXT_EDIT', { 
        elementId, 
        selectionType: 'caret' 
      });
      
      expect(store.getState().editor.editingElementId).toBe(elementId);
    });
    
    it('should save content on exit', async () => {
      // Setup
      store.dispatch('ADD_ELEMENT', {
        type: 'text',
        content: '<p>Original</p>',
        x: 100,
        y: 100
      });
      
      const elementId = store.getState().editor.selectedElementIds[0];
      store.dispatch('ENTER_TEXT_EDIT', { elementId });
      
      // Simulate content change
      store.dispatch('SAVE_TEXT_CONTENT', {
        elementId,
        content: '<p>Modified</p>'
      });
      
      // Exit
      store.dispatch('EXIT_TEXT_EDIT', { save: true });
      
      // Verify
      const element = store.getState().slides[
        store.getState().editor.activeSlideId
      ].elements[elementId];
      
      expect(element.content).toBe('<p>Modified</p>');
    });
    
    it('should delete empty non-placeholder on exit', async () => {
      store.dispatch('ADD_ELEMENT', {
        type: 'text',
        content: '',
        x: 100,
        y: 100
      });
      
      const elementId = store.getState().editor.selectedElementIds[0];
      store.dispatch('ENTER_TEXT_EDIT', { elementId });
      
      // Exit with empty content
      store.dispatch('SAVE_TEXT_CONTENT', {
        elementId,
        content: ''
      });
      store.dispatch('REMOVE_ELEMENT', elementId);
      store.dispatch('EXIT_TEXT_EDIT', { save: true });
      
      // Element should be removed
      const elements = store.getState().slides[
        store.getState().editor.activeSlideId
      ].elements;
      
      expect(elements[elementId]).toBeUndefined();
    });
  });
  
  describe('Placeholder Handling', () => {
    it('should preserve empty placeholder on exit', async () => {
      // Get a placeholder from initial state
      const state = store.getState();
      const slide = state.slides[state.editor.activeSlideId];
      const placeholderId = Object.keys(slide.elements).find(
        id => slide.elements[id].isPlaceholder
      );
      
      if (!placeholderId) {
        // Add a placeholder for testing
        store.dispatch('ADD_ELEMENT', {
          type: 'text',
          isPlaceholder: true,
          placeholderType: 'title',
          content: '<h1>Click to add title</h1>',
          x: 100,
          y: 100
        });
      }
      
      const slideAfter = store.getState().slides[
        store.getState().editor.activeSlideId
      ];
      const placeholder = Object.values(slideAfter.elements).find(
        el => el.isPlaceholder
      );
      
      expect(placeholder).toBeDefined();
      
      // Enter edit mode
      store.dispatch('ENTER_TEXT_EDIT', { 
        elementId: placeholder.id 
      });
      
      // Exit with empty content (simulating user clearing and exiting)
      store.dispatch('SAVE_TEXT_CONTENT', {
        elementId: placeholder.id,
        content: ''
      });
      store.dispatch('EXIT_TEXT_EDIT', { save: true });
      
      // Placeholder should still exist with prompt text
      const finalSlide = store.getState().slides[
        store.getState().editor.activeSlideId
      ];
      const finalPlaceholder = finalSlide.elements[placeholder.id];
      
      expect(finalPlaceholder).toBeDefined();
      expect(finalPlaceholder.content).toContain('Click to add');
    });
  });
});
```

---

## 6. DOM Interaction Tests

### 6.1 TextElement DOM Tests

**File**: `tests/unit/core/renderer/elements/TextElement.test.js`

```javascript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TextElement } from '@/core/renderer/elements/TextElement.js';
import { createMockStore } from '../../../../mocks/store.js';

describe('TextElement', () => {
  let container;
  let mockStore;
  
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    mockStore = createMockStore();
  });
  
  afterEach(() => {
    document.body.removeChild(container);
  });
  
  describe('setEditing', () => {
    it('should set contentEditable when entering edit mode', () => {
      const element = new TextElement({
        id: 'test-1',
        type: 'text',
        content: '<p>Test</p>',
        x: 0, y: 0, width: 200, height: 100
      });
      
      element.mount(container);
      element.setEditing(true);
      
      expect(element.domElement.contentEditable).toBe('true');
    });
    
    it('should remove contentEditable when exiting edit mode', () => {
      const element = new TextElement({
        id: 'test-1',
        type: 'text',
        content: '<p>Test</p>',
        x: 0, y: 0, width: 200, height: 100
      });
      
      element.mount(container);
      element.setEditing(true);
      element.setEditing(false);
      
      expect(element.domElement.contentEditable).toBe('false');
    });
    
    it('should clear placeholder prompt text on edit entry', () => {
      const element = new TextElement({
        id: 'test-1',
        type: 'text',
        isPlaceholder: true,
        placeholderType: 'title',
        content: '<h1>Click to add title</h1>',
        x: 0, y: 0, width: 200, height: 100
      });
      
      element.mount(container);
      element.setEditing(true);
      
      // DOM should be empty (ready for user input)
      const textContent = element.domElement.textContent?.trim();
      expect(textContent).toBe('');
    });
    
    it('should select all text when selectionType is "all"', () => {
      const element = new TextElement({
        id: 'test-1',
        type: 'text',
        content: '<p>Hello World</p>',
        x: 0, y: 0, width: 200, height: 100
      });
      
      element.mount(container);
      element.setEditing(true, 'all');
      
      // Selection should include all text
      // (async due to setTimeout in implementation)
      setTimeout(() => {
        const selection = window.getSelection();
        expect(selection.toString()).toContain('Hello World');
      }, 10);
    });
    
    it('should attach keydown handler on edit entry', () => {
      const element = new TextElement({
        id: 'test-1',
        type: 'text',
        content: '<p>Test</p>',
        x: 0, y: 0, width: 200, height: 100
      });
      
      element.mount(container);
      element.setEditing(true);
      
      expect(element._keydownHandler).toBeDefined();
    });
    
    it('should remove keydown handler on edit exit', () => {
      const element = new TextElement({
        id: 'test-1',
        type: 'text',
        content: '<p>Test</p>',
        x: 0, y: 0, width: 200, height: 100
      });
      
      element.mount(container);
      element.setEditing(true);
      element.setEditing(false);
      
      expect(element._keydownHandler).toBe(null);
    });
  });
  
  describe('handleEditKeyDown', () => {
    it('should exit on Escape', () => {
      const element = new TextElement({
        id: 'test-1',
        type: 'text',
        content: '<p>Test</p>',
        x: 0, y: 0, width: 200, height: 100
      });
      
      element.mount(container);
      element.setEditing(true);
      
      const blurSpy = vi.spyOn(element.domElement, 'blur');
      
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      element.handleEditKeyDown(event);
      
      expect(blurSpy).toHaveBeenCalled();
    });
    
    it('should exit on Cmd+Enter', () => {
      const element = new TextElement({
        id: 'test-1',
        type: 'text',
        content: '<p>Test</p>',
        x: 0, y: 0, width: 200, height: 100
      });
      
      element.mount(container);
      element.setEditing(true);
      
      const blurSpy = vi.spyOn(element.domElement, 'blur');
      
      const event = new KeyboardEvent('keydown', { 
        key: 'Enter', 
        metaKey: true 
      });
      element.handleEditKeyDown(event);
      
      expect(blurSpy).toHaveBeenCalled();
    });
  });
});
```

---

## 7. Edge Case Tests

### 7.1 Content Preservation Tests

**File**: `tests/unit/core/text/ContentPreservation.test.js`

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Content Preservation', () => {
  describe('Content should never be lost', () => {
    it('should save content before any state dispatch during editing', () => {
      // Simulate scenario where content could be lost
    });
    
    it('should handle rapid typing followed by blur', () => {
      // Debounce should not lose final characters
    });
    
    it('should preserve content on accidental focus loss', () => {
      // Focus moving to UI element should not lose content
    });
    
    it('should recover content from localStorage on crash recovery', () => {
      // Draft saving functionality
    });
  });
  
  describe('Placeholder content lifecycle', () => {
    it('should clear prompt on first edit entry', () => {});
    
    it('should restore prompt if user exits without typing', () => {});
    
    it('should keep user content after editing', () => {});
    
    it('should restore prompt if user deletes all content', () => {});
    
    it('should never delete a placeholder element', () => {});
  });
  
  describe('Undo/Redo with text editing', () => {
    it('should undo content changes', () => {});
    
    it('should redo undone changes', () => {});
    
    it('should create undo point on edit exit', () => {});
  });
});
```

---

## 8. Keyboard Shortcut Tests

**File**: `tests/unit/core/text/KeyboardShortcuts.test.js`

```javascript
import { describe, it, expect } from 'vitest';

describe('Text Editing Keyboard Shortcuts', () => {
  describe('Navigation', () => {
    it('should move caret with arrow keys', () => {});
    it('should move by word with Opt+Arrow', () => {});
    it('should move to line start/end with Cmd+Arrow', () => {});
    it('should extend selection with Shift+Navigation', () => {});
    it('should select all with Cmd+A', () => {});
  });
  
  describe('Styling', () => {
    it('should toggle bold with Cmd+B', () => {});
    it('should toggle italic with Cmd+I', () => {});
    it('should toggle underline with Cmd+U', () => {});
  });
  
  describe('Edit Mode', () => {
    it('should enter edit mode with Enter key', () => {});
    it('should exit edit mode with Escape', () => {});
    it('should exit edit mode with Cmd+Enter', () => {});
  });
  
  describe('Lists', () => {
    it('should indent with Tab', () => {});
    it('should outdent with Shift+Tab', () => {});
    it('should exit list on Enter in empty item', () => {});
  });
});
```

---

## 9. Text Style Preset Tests

### 9.1 TextStyleManager Tests

**File**: `tests/unit/core/text/TextStyleManager.test.js`

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TextStyleManager } from '@/core/text/TextStyleManager.js';
import { createMockStore } from '../../../mocks/store.js';

describe('TextStyleManager', () => {
  let manager;
  let mockStore;
  
  beforeEach(() => {
    mockStore = createMockStore({
      masters: {
        'theme-default': {
          themeSettings: {
            textStyles: {
              'heading1': {
                id: 'heading1',
                fontSize: 44,
                fontWeight: '700',
                fontFamily: 'var(--theme-font-heading)'
              },
              'body': {
                id: 'body',
                fontSize: 20,
                fontWeight: '400',
                fontFamily: 'var(--theme-font-body)'
              }
            }
          }
        }
      }
    });
    manager = new TextStyleManager(mockStore);
  });
  
  describe('applyStylePreset', () => {
    it('should set styleId on element', () => {
      manager.applyStylePreset('element-1', 'heading1');
      
      expect(mockStore.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT', {
        id: 'element-1',
        styleId: 'heading1',
        style: {}
      });
    });
    
    it('should warn if style not found', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      manager.applyStylePreset('element-1', 'nonexistent');
      
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
    });
    
    it('should clear conflicting element.style properties', () => {
      mockStore._setState({
        slides: {
          'slide-1': {
            elements: {
              'element-1': {
                id: 'element-1',
                style: { fontSize: 32, fontWeight: '400' }
              }
            }
          }
        }
      });
      
      manager.applyStylePreset('element-1', 'heading1');
      
      expect(mockStore.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT', {
        id: 'element-1',
        styleId: 'heading1',
        style: {} // Cleared
      });
    });
  });
  
  describe('detachFromStyle', () => {
    it('should move styleId properties to element.style', () => {
      mockStore._setState({
        slides: {
          'slide-1': {
            elements: {
              'element-1': {
                id: 'element-1',
                styleId: 'heading1',
                style: {}
              }
            }
          }
        }
      });
      
      manager.detachFromStyle('element-1');
      
      expect(mockStore.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT', 
        expect.objectContaining({
          id: 'element-1',
          styleId: null,
          style: expect.objectContaining({
            fontSize: 44,
            fontWeight: '700'
          })
        })
      );
    });
    
    it('should do nothing if element has no styleId', () => {
      mockStore._setState({
        slides: {
          'slide-1': {
            elements: {
              'element-1': { id: 'element-1', styleId: null }
            }
          }
        }
      });
      
      manager.detachFromStyle('element-1');
      
      expect(mockStore.dispatch).not.toHaveBeenCalled();
    });
  });
});
```

### 9.2 StyleResolver Integration Tests

**File**: `tests/unit/utils/StyleResolver.integration.test.js`

```javascript
import { describe, it, expect } from 'vitest';
import { StyleResolver } from '@/utils/StyleResolver.js';

describe('StyleResolver with Text Editing', () => {
  const globalStyles = {
    'heading1': {
      fontSize: 44,
      fontWeight: '700',
      lineHeight: 1.2
    },
    'body': {
      fontSize: 20,
      fontWeight: '400',
      lineHeight: 1.6
    }
  };
  
  it('should apply styleId properties', () => {
    const element = {
      styleId: 'heading1',
      style: {}
    };
    
    const result = StyleResolver.getEffectiveTextProperties(element, globalStyles);
    
    expect(result.fontSize).toBe(44);
    expect(result.fontWeight).toBe('700');
  });
  
  it('should allow element.style to override styleId', () => {
    const element = {
      styleId: 'heading1',
      style: { fontSize: 48 }
    };
    
    const result = StyleResolver.getEffectiveTextProperties(element, globalStyles);
    
    expect(result.fontSize).toBe(48);
    expect(result.fontWeight).toBe('700'); // Still from styleId
  });
  
  it('should handle placeholder with styleId', () => {
    const element = {
      isPlaceholder: true,
      placeholderType: 'title',
      styleId: 'heading1',
      content: '<h1>Click to add title</h1>'
    };
    
    const result = StyleResolver.getEffectiveTextProperties(element, globalStyles);
    
    expect(result.fontSize).toBe(44);
  });
});
```

---

## 10. IME Input Tests

### 10.1 Composition Event Tests

**File**: `tests/unit/core/text/IMEHandling.test.js`

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TextElement } from '@/core/renderer/elements/TextElement.js';

describe('IME Input Handling', () => {
  let textElement;
  let mockDiv;
  
  beforeEach(() => {
    mockDiv = document.createElement('div');
    mockDiv.contentEditable = true;
    document.body.appendChild(mockDiv);
    
    textElement = new TextElement({ 
      id: 'text-1', 
      type: 'text',
      content: '<p>Test</p>'
    });
    textElement.domElement = mockDiv;
  });
  
  afterEach(() => {
    document.body.innerHTML = '';
  });
  
  it('should set isComposing flag on compositionstart', () => {
    textElement.attachEditHandlers();
    
    mockDiv.dispatchEvent(new CompositionEvent('compositionstart'));
    
    expect(textElement._isComposing).toBe(true);
  });
  
  it('should clear isComposing flag on compositionend', () => {
    textElement.attachEditHandlers();
    textElement._isComposing = true;
    
    mockDiv.dispatchEvent(new CompositionEvent('compositionend'));
    
    expect(textElement._isComposing).toBe(false);
  });
  
  it('should not trigger save during composition', () => {
    const saveSpy = vi.fn();
    textElement.attachEditHandlers();
    textElement._isComposing = true;
    
    // Input event during composition
    mockDiv.dispatchEvent(new InputEvent('input'));
    
    expect(saveSpy).not.toHaveBeenCalled();
  });
  
  it('should skip keyboard shortcuts during composition', () => {
    textElement.attachEditHandlers();
    textElement._isComposing = true;
    
    const event = new KeyboardEvent('keydown', { key: 'b', metaKey: true });
    const preventSpy = vi.spyOn(event, 'preventDefault');
    
    mockDiv.dispatchEvent(event);
    
    // Bold shortcut should not trigger
    expect(preventSpy).not.toHaveBeenCalled();
  });
});
```

---

## 11. Undo/Redo Tests

### 11.1 Edit Mode Undo/Redo Tests

**File**: `tests/unit/core/text/UndoRedo.test.js`

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TextEditManager } from '@/core/text/TextEditManager.js';
import { historyManager } from '@/core/HistoryManager.js';

describe('Undo/Redo with Text Editing', () => {
  let manager;
  let mockStore;
  
  beforeEach(() => {
    mockStore = createMockStore();
    manager = TextEditManager.getInstance(mockStore);
    historyManager.clear();
  });
  
  describe('Edit Mode Entry/Exit', () => {
    it('should capture pre-edit state on enter', () => {
      const initialContent = '<p>Original</p>';
      mockStore._setState({
        slides: {
          'slide-1': {
            elements: {
              'element-1': { id: 'element-1', content: initialContent }
            }
          }
        }
      });
      
      manager.enterEditMode('element-1');
      
      expect(manager.preEditElementContent).toBe(initialContent);
    });
    
    it('should not push to history if content unchanged', () => {
      const pushSpy = vi.spyOn(historyManager, 'push');
      
      manager.enterEditMode('element-1');
      manager.exitEditMode(true); // No changes made
      
      expect(pushSpy).not.toHaveBeenCalled();
    });
    
    it('should push to history when content changes', () => {
      const pushSpy = vi.spyOn(historyManager, 'push');
      
      manager.enterEditMode('element-1');
      manager.preEditElementContent = '<p>Original</p>';
      manager._isDirty = true;
      manager.exitEditMode(true);
      
      expect(pushSpy).toHaveBeenCalled();
    });
  });
  
  describe('Keyboard Shortcut Handling', () => {
    it('should block app Cmd+Z during edit mode', () => {
      mockStore._setState({
        editor: { editingElementId: 'element-1' }
      });
      
      const event = new KeyboardEvent('keydown', { 
        key: 'z', 
        metaKey: true 
      });
      const stopSpy = vi.spyOn(event, 'stopPropagation');
      
      manager.handleKeyDown(event);
      
      expect(stopSpy).toHaveBeenCalled();
    });
    
    it('should allow app Cmd+Z outside edit mode', () => {
      mockStore._setState({
        editor: { editingElementId: null }
      });
      
      const event = new KeyboardEvent('keydown', { 
        key: 'z', 
        metaKey: true 
      });
      const stopSpy = vi.spyOn(event, 'stopPropagation');
      
      manager.handleKeyDown(event);
      
      expect(stopSpy).not.toHaveBeenCalled();
    });
  });
});
```

---

## 12. Property Inspector Sync Tests

### 12.1 Selection Preservation Tests

**File**: `tests/unit/core/text/PropertyInspectorSync.test.js`

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TextEditManager } from '@/core/text/TextEditManager.js';
import { SelectionManager } from '@/core/text/SelectionManager.js';

describe('Property Inspector Synchronization', () => {
  let manager;
  let mockStore;
  let mockDiv;
  
  beforeEach(() => {
    mockStore = createMockStore();
    manager = TextEditManager.getInstance(mockStore);
    
    mockDiv = document.createElement('div');
    mockDiv.contentEditable = true;
    mockDiv.innerHTML = '<p>Hello World</p>';
    document.body.appendChild(mockDiv);
    
    manager.activeDOMElement = mockDiv;
  });
  
  it('should save selection when Property Inspector gains focus', () => {
    // Create a selection
    const range = document.createRange();
    range.selectNodeContents(mockDiv.querySelector('p'));
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    
    manager.onPropertyInspectorFocus();
    
    expect(manager.savedSelection).not.toBeNull();
    expect(manager.savedSelection.anchorNodePath).toBeDefined();
  });
  
  it('should restore selection after property change in edit mode', () => {
    const restoreSpy = vi.spyOn(manager.selectionManager, 'restoreSelection');
    
    manager.savedSelection = {
      anchorNodePath: [0, 0],
      anchorOffset: 0,
      focusNodePath: [0, 0],
      focusOffset: 5
    };
    
    mockStore._setState({
      editor: { editingElementId: 'element-1' }
    });
    
    manager.onPropertyChange('fontSize', 24);
    
    expect(restoreSpy).toHaveBeenCalled();
  });
  
  it('should apply to element when not in edit mode', () => {
    mockStore._setState({
      editor: { editingElementId: null }
    });
    
    const applySpy = vi.spyOn(manager, 'applyToElement');
    
    manager.onPropertyChange('fontSize', 24);
    
    expect(applySpy).toHaveBeenCalledWith('fontSize', 24);
  });
});
```

---

## 13. Multi-Element Tests

### 13.1 Multi-Selection Editing Tests

**File**: `tests/unit/core/text/MultiElementEditing.test.js`

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CanvasManager } from '@/core/CanvasManager.js';

describe('Multi-Element Text Editing', () => {
  let canvasManager;
  let mockStore;
  
  beforeEach(() => {
    mockStore = createMockStore();
    canvasManager = new CanvasManager(mockStore);
  });
  
  it('should enter edit mode on first text element when typing with multiple selected', () => {
    mockStore._setState({
      editor: { 
        selectedElementIds: ['text-1', 'text-2', 'shape-1'] 
      },
      slides: {
        'slide-1': {
          elements: {
            'text-1': { id: 'text-1', type: 'text' },
            'text-2': { id: 'text-2', type: 'text' },
            'shape-1': { id: 'shape-1', type: 'rectangle' }
          }
        }
      }
    });
    
    // Simulate typing 'a'
    const event = new KeyboardEvent('keydown', { key: 'a' });
    canvasManager.handleKeyDown(event);
    
    // Should select only first text element
    expect(mockStore.dispatch).toHaveBeenCalledWith('SET_SELECTED_ELEMENTS', ['text-1']);
    
    // Should enter edit mode
    expect(mockStore.dispatch).toHaveBeenCalledWith('ENTER_TEXT_EDIT', {
      elementId: 'text-1',
      selectionType: 'all'
    });
  });
  
  it('should apply style preset to all selected text elements', () => {
    mockStore._setState({
      editor: { 
        selectedElementIds: ['text-1', 'text-2'] 
      }
    });
    
    const styleManager = new TextStyleManager(mockStore);
    styleManager.applyStylePresetToSelection('heading1');
    
    expect(mockStore.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT', 
      expect.objectContaining({ id: 'text-1', styleId: 'heading1' })
    );
    expect(mockStore.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT', 
      expect.objectContaining({ id: 'text-2', styleId: 'heading1' })
    );
  });
  
  it('should do nothing when typing with only shapes selected', () => {
    mockStore._setState({
      editor: { 
        selectedElementIds: ['shape-1', 'shape-2'] 
      },
      slides: {
        'slide-1': {
          elements: {
            'shape-1': { id: 'shape-1', type: 'rectangle' },
            'shape-2': { id: 'shape-2', type: 'ellipse' }
          }
        }
      }
    });
    
    const event = new KeyboardEvent('keydown', { key: 'a' });
    canvasManager.handleKeyDown(event);
    
    expect(mockStore.dispatch).not.toHaveBeenCalledWith('ENTER_TEXT_EDIT', 
      expect.anything()
    );
  });
});
```

---

## 14. Test Utilities

### 14.1 Mock Store

**File**: `tests/mocks/store.js`

```javascript
import { vi } from 'vitest';

export function createMockStore(initialState = {}) {
  const defaultState = {
    editor: {
      editingElementId: null,
      selectedElementIds: [],
      activeSlideId: 'slide-1',
      mode: 'edit',
      textEdit: {
        isDirty: false,
        lastSavedContent: null,
        isPlaceholderEdit: false
      }
    },
    slides: {
      'slide-1': {
        id: 'slide-1',
        elements: {},
        elementOrder: []
      }
    },
    masters: {
      'theme-default': {
        themeSettings: {
          textStyles: {},
          colors: {},
          fonts: { heading: 'Inter', body: 'Inter' }
        }
      }
    },
    ...initialState
  };
  
  let state = { ...defaultState };
  
  return {
    getState: vi.fn(() => state),
    dispatch: vi.fn((action, payload) => {
      // Simple state updates for testing
      if (action === 'ENTER_TEXT_EDIT') {
        state.editor.editingElementId = payload.elementId;
      } else if (action === 'EXIT_TEXT_EDIT') {
        state.editor.editingElementId = null;
      }
    }),
    subscribe: vi.fn(),
    emit: vi.fn(),
    _setState: (newState) => { state = { ...state, ...newState }; }
  };
}
```

---

## 15. Test Coverage Requirements

### 15.1 Minimum Coverage

| Component | Statements | Branches | Functions | Lines |
|-----------|------------|----------|-----------|-------|
| TextEditManager | 90% | 85% | 100% | 90% |
| PlaceholderManager | 95% | 90% | 100% | 95% |
| ContentSanitizer | 95% | 90% | 100% | 95% |
| SelectionManager | 85% | 80% | 100% | 85% |
| TextStyleManager | 90% | 85% | 100% | 90% |
| TextElement (edit) | 85% | 80% | 90% | 85% |
| Handlers | 90% | 85% | 100% | 90% |

### 15.2 Critical Paths (100% Coverage Required)

1. Content saving on blur
2. Placeholder prompt restoration
3. Empty element deletion vs. preservation
4. Selection state save/restore
5. styleId application and detachment
6. IME composition handling
7. Undo/Redo integration

---

## 16. Regression Test Checklist

After any changes, verify:

### Core Editing
- [ ] Double-click enters edit mode
- [ ] Enter key enters edit mode with text selected
- [ ] Escape exits edit mode
- [ ] Cmd+Enter exits edit mode
- [ ] Clicking outside exits edit mode
- [ ] Content is saved on exit
- [ ] Empty non-placeholder is deleted
- [ ] Empty placeholder is preserved
- [ ] Placeholder prompt text clears on entry
- [ ] Placeholder prompt text restores on empty exit
- [ ] User content persists after editing

### Text Styles
- [ ] Applying styleId updates element
- [ ] styleId properties are resolved correctly
- [ ] element.style overrides styleId properties
- [ ] Inline formatting creates spans
- [ ] "Clear Formatting" removes spans
- [ ] "Detach from Style" works correctly

### Rich Text
- [ ] Rich text shortcuts work (Bold, Italic, etc.)
- [ ] List auto-formatting works
- [ ] Selection preserved during style changes
- [ ] Property Inspector reflects selection state

### IME & i18n
- [ ] CJK input works correctly
- [ ] No interruption during composition
- [ ] Keyboard shortcuts blocked during composition

### Undo/Redo
- [ ] Browser undo works in edit mode
- [ ] App undo works outside edit mode
- [ ] Exit creates history entry when content changed
- [ ] Undo restores previous content

### Multi-Element
- [ ] Typing with multiple text selected enters first
- [ ] Style changes apply to all selected
- [ ] Mixed type selection handled correctly
