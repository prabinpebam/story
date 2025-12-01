/**
 * TextEditManager
 * 
 * Central orchestrator for text editing operations.
 * Manages edit mode lifecycle, delegates to specialized managers.
 * 
 * @see documentation/tech-specs/core/text-editing/01-text-edit-manager.md
 */

import { store } from '../Store.js';
import { historyBridge } from './HistoryBridge.js';
import { selectionManager } from './SelectionManager.js';
import { contentSanitizer } from './ContentSanitizer.js';
import { imeHandler } from './IMEHandler.js';
import { PlaceholderManager } from './PlaceholderManager.js';
import { 
    ACTION_TYPES, 
    EVENTS, 
    CSS_CLASSES,
    TIMING,
    FEATURE_FLAGS 
} from './constants.js';

export class TextEditManager {
    constructor() {
        // Current editing state
        this.isEditing = false;
        this.currentElementId = null;
        this.currentElement = null; // DOM element reference
        
        // Track if element was newly created (no user input yet)
        this.isNewlyCreated = false;
        this.hasReceivedInput = false;
        
        // Debounce timer for saves
        this.saveTimer = null;
        
        // Event callbacks
        this.eventCallbacks = new Map();
        
        // Bind methods for event listeners
        this._handleInput = this._handleInput.bind(this);
        this._handleKeyDown = this._handleKeyDown.bind(this);
        this._handleBlur = this._handleBlur.bind(this);
        this._handlePaste = this._handlePaste.bind(this);
    }

    /**
     * Enter edit mode for a text element.
     * @param {string} elementId - ID of the element to edit
     * @param {Element} domElement - The DOM element (contentEditable container)
     * @param {Object} options - Entry options
     * @param {string} options.entryMode - 'doubleClick', 'enter', 'typing', 'click'
     * @param {Object} [options.clickPosition] - { x, y } for caret positioning
     * @param {boolean} [options.isNewlyCreated] - True if element was just created
     * @returns {boolean} True if edit mode was entered
     */
    enterEditMode(elementId, domElement, options = {}) {
        // Prevent entering edit mode if already editing
        if (this.isEditing) {
            if (this.currentElementId === elementId) {
                // Already editing this element
                return true;
            }
            // Exit current edit first
            this.exitEditMode();
        }

        // Get element data from store (handle both slides and masters)
        const state = store.getState();
        const mode = state.editor.mode;
        const activeId = mode === 'master' ? state.editor.activeMasterId : state.editor.activeSlideId;
        const container = mode === 'master' ? state.masters[activeId] : state.slides[activeId];
        const elementData = container?.elements?.[elementId];

        if (!elementData) {
            console.warn('TextEditManager: Element not found', elementId, 'in', mode, 'mode, activeId:', activeId);
            return false;
        }

        // Prepare for editing
        this.isEditing = true;
        this.currentElementId = elementId;
        this.currentElement = domElement;
        
        // Track newly created state
        this.isNewlyCreated = options.isNewlyCreated === true;
        this.hasReceivedInput = false;

        // Start history session
        historyBridge.beginSession(elementId, {
            content: elementData.content || '',
            inlineStyles: elementData.inlineStyles || {}
        });

        // Handle placeholder preparation
        if (PlaceholderManager.isPlaceholder(elementData)) {
            const prepared = PlaceholderManager.prepareForEdit(elementData);
            if (prepared._wasEmpty) {
                // Clear the DOM content (will show empty, ready for typing)
                domElement.textContent = '';
            }
        }

        // Set up contentEditable
        domElement.contentEditable = 'true';
        domElement.classList.add(CSS_CLASSES.EDITING);
        domElement.setAttribute('data-editing', 'true');
        
        // Ensure pointer events are enabled for interaction
        domElement.style.pointerEvents = 'auto';
        domElement.style.cursor = 'text';
        domElement.style.outline = 'none';

        // Attach event listeners
        this._attachEventListeners(domElement);

        // Attach IME handler
        if (FEATURE_FLAGS.ENABLE_IME_SUPPORT) {
            imeHandler.attach(domElement);
        }

        // Set initial selection based on entry mode
        this._setInitialSelection(domElement, options);

        // Focus the element
        domElement.focus();

        // Dispatch store action
        store.dispatch(ACTION_TYPES.ENTER_TEXT_EDIT, { elementId });

        // Emit event
        this._emit(EVENTS.TEXT_EDIT_START, { elementId, entryMode: options.entryMode });

        return true;
    }

    /**
     * Exit edit mode and save content.
     * @param {Object} options - Exit options
     * @param {boolean} options.save - Whether to save changes (default: true)
     * @param {boolean} options.keepSelection - Keep element selected after exit
     * @returns {boolean} True if exit was successful
     */
    exitEditMode(options = {}) {
        const { save = true, keepSelection = true } = options;

        if (!this.isEditing || !this.currentElement) {
            return false;
        }

        // Block exit during IME composition
        if (FEATURE_FLAGS.ENABLE_IME_SUPPORT && imeHandler.isCompositionInProgress()) {
            return false;
        }

        // Clear any pending save
        this._clearSaveTimer();

        // Get final content
        const rawContent = this.currentElement.innerHTML;
        const sanitizedContent = contentSanitizer.sanitize(rawContent);

        // Get element data for placeholder handling (handle both slides and masters)
        const state = store.getState();
        const mode = state.editor.mode;
        const activeId = mode === 'master' ? state.editor.activeMasterId : state.editor.activeSlideId;
        const container = mode === 'master' ? state.masters[activeId] : state.slides[activeId];
        const elementData = container?.elements?.[this.currentElementId];

        // Handle exit based on placeholder status
        const exitResult = PlaceholderManager.handleEditExit(elementData, sanitizedContent);

        // Remove contentEditable and reset styles
        this.currentElement.contentEditable = 'false';
        this.currentElement.classList.remove(CSS_CLASSES.EDITING);
        this.currentElement.removeAttribute('data-editing');
        this.currentElement.style.cursor = '';
        this.currentElement.style.pointerEvents = '';

        // Detach event listeners
        this._detachEventListeners(this.currentElement);

        // Detach IME handler
        if (FEATURE_FLAGS.ENABLE_IME_SUPPORT) {
            imeHandler.detach(this.currentElement);
        }

        // End history session
        const changesSaved = save && historyBridge.endSession(true, {
            content: exitResult.content,
            inlineStyles: elementData?.inlineStyles || {}
        });

        // Save content to store
        if (save) {
            store.dispatch(ACTION_TYPES.SAVE_TEXT_CONTENT, {
                elementId: this.currentElementId,
                content: exitResult.content,
                hasUserContent: exitResult.hasUserContent
            });

            // Handle element deletion for empty non-placeholders
            if (exitResult.shouldDelete || (this.isNewlyCreated && !this.hasReceivedInput)) {
                // Delete empty element
                store.dispatch('REMOVE_ELEMENT', { id: this.currentElementId });
                // Clear selection since element is deleted
                store.dispatch('UPDATE_SELECTION', []);
            }

            // Update DOM with final content (may include prompt text)
            this.currentElement.innerHTML = exitResult.content;
            
            if (exitResult.showPrompt) {
                this.currentElement.classList.add(CSS_CLASSES.CONTENT_PROMPT);
            } else {
                this.currentElement.classList.remove(CSS_CLASSES.CONTENT_PROMPT);
            }
        } else {
            // Discard changes - restore original content
            const originalState = historyBridge.cancelSession();
            if (originalState) {
                this.currentElement.innerHTML = originalState.content;
            }
        }

        // Dispatch exit action
        store.dispatch(ACTION_TYPES.EXIT_TEXT_EDIT, { 
            elementId: this.currentElementId,
            keepSelection 
        });

        // Emit event
        this._emit(EVENTS.TEXT_EDIT_END, { 
            elementId: this.currentElementId,
            saved: save,
            changesSaved 
        });

        // Clear state
        const elementId = this.currentElementId;
        this.isEditing = false;
        this.currentElementId = null;
        this.currentElement = null;
        this.isNewlyCreated = false;
        this.hasReceivedInput = false;

        // Clear selection manager
        selectionManager.clear();

        return true;
    }

    /**
     * Check if currently editing.
     * @returns {boolean}
     */
    isInEditMode() {
        return this.isEditing;
    }

    /**
     * Get the currently editing element ID.
     * @returns {string|null}
     */
    getCurrentElementId() {
        return this.currentElementId;
    }

    /**
     * Save current selection (for Property Inspector interaction).
     * @returns {boolean}
     */
    saveSelection() {
        if (!this.currentElement) return false;
        return selectionManager.save(this.currentElement);
    }

    /**
     * Restore saved selection.
     * @returns {boolean}
     */
    restoreSelection() {
        return selectionManager.restore();
    }

    /**
     * Apply formatting to current selection.
     * @param {string} format - Format type: 'bold', 'italic', 'underline', 'strikethrough'
     */
    applyFormat(format) {
        if (!this.isEditing || !this.currentElement) return;

        // Block during IME
        if (imeHandler.shouldBlockAction('format')) return;

        const commandMap = {
            bold: 'bold',
            italic: 'italic',
            underline: 'underline',
            strikethrough: 'strikeThrough'
        };

        const command = commandMap[format];
        if (command) {
            document.execCommand(command, false, null);
            this._markDirty();
        }
    }

    /**
     * Apply list style to the current selection/paragraph.
     * @param {'bullet'|'numbered'|'none'} listType - Type of list to apply
     * @returns {boolean} True if applied successfully, false otherwise
     */
    applyListStyle(listType) {
        if (!this.isEditing || !this.currentElement) return false;

        // Block during IME
        if (imeHandler.shouldBlockAction('format')) return false;

        // Focus the element to ensure execCommand works
        this.currentElement.focus();

        if (listType === 'bullet') {
            document.execCommand('insertUnorderedList', false, null);
        } else if (listType === 'numbered') {
            document.execCommand('insertOrderedList', false, null);
        } else if (listType === 'none') {
            // Check if we're in a list and remove it
            if (this._isInList()) {
                // Get current list type and toggle it off
                const listItem = this._getCurrentListItem();
                if (listItem) {
                    const parentList = listItem.parentElement;
                    if (parentList?.nodeName === 'UL') {
                        document.execCommand('insertUnorderedList', false, null);
                    } else if (parentList?.nodeName === 'OL') {
                        document.execCommand('insertOrderedList', false, null);
                    }
                }
            }
        }

        this._markDirty();
        return true;
    }

    /**
     * Get the current list type at the caret position.
     * @returns {'bullet'|'numbered'|'none'}
     */
    getCurrentListType() {
        if (!this.isEditing || !this.currentElement) return 'none';
        
        const listItem = this._getCurrentListItem();
        if (!listItem) return 'none';
        
        const parentList = listItem.parentElement;
        if (parentList?.nodeName === 'UL') return 'bullet';
        if (parentList?.nodeName === 'OL') return 'numbered';
        return 'none';
    }

    /**
     * Subscribe to text edit events.
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    on(event, callback) {
        if (!this.eventCallbacks.has(event)) {
            this.eventCallbacks.set(event, []);
        }
        this.eventCallbacks.get(event).push(callback);
    }

    /**
     * Unsubscribe from text edit events.
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    off(event, callback) {
        if (!this.eventCallbacks.has(event)) return;
        const callbacks = this.eventCallbacks.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    /**
     * Set initial selection based on entry mode.
     * @param {Element} element - DOM element
     * @param {Object} options - Entry options
     * @private
     */
    _setInitialSelection(element, options) {
        const { entryMode, clickPosition } = options;

        switch (entryMode) {
            case 'enter':
            case 'typing':
                // Select all content
                selectionManager.selectAll(element);
                break;
            
            case 'doubleClick':
                // Place caret at click position (simplified - place at end)
                selectionManager.placeCaretAtEnd(element);
                break;
            
            case 'click':
            default:
                // Place caret at end
                selectionManager.placeCaretAtEnd(element);
                break;
        }
    }

    /**
     * Attach event listeners to contentEditable element.
     * @param {Element} element
     * @private
     */
    _attachEventListeners(element) {
        element.addEventListener('input', this._handleInput);
        element.addEventListener('keydown', this._handleKeyDown, true); // Capture phase
        element.addEventListener('blur', this._handleBlur);
        element.addEventListener('paste', this._handlePaste);
    }

    /**
     * Detach event listeners from contentEditable element.
     * @param {Element} element
     * @private
     */
    _detachEventListeners(element) {
        element.removeEventListener('input', this._handleInput);
        element.removeEventListener('keydown', this._handleKeyDown, true);
        element.removeEventListener('blur', this._handleBlur);
        element.removeEventListener('paste', this._handlePaste);
    }

    /**
     * Handle input event.
     * @param {InputEvent} event
     * @private
     */
    _handleInput(event) {
        // Skip during IME composition
        if (imeHandler.isCompositionInProgress()) return;

        // Track that user has typed something
        this.hasReceivedInput = true;
        
        this._markDirty();
        this._scheduleSave();
    }

    /**
     * Handle keydown event.
     * @param {KeyboardEvent} event
     * @private
     */
    _handleKeyDown(event) {
        // Let history bridge handle undo/redo
        if (historyBridge.handleKeyboardEvent(event)) {
            return;
        }

        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const modKey = isMac ? event.metaKey : event.ctrlKey;

        // Exit shortcuts
        if (event.key === 'Escape') {
            event.preventDefault();
            this.exitEditMode({ keepSelection: true });
            return;
        }

        if (modKey && event.key === 'Enter') {
            event.preventDefault();
            this.exitEditMode({ keepSelection: true });
            return;
        }

        // Formatting shortcuts (block during IME)
        if (modKey && !imeHandler.isCompositionInProgress()) {
            switch (event.key.toLowerCase()) {
                case 'b':
                    event.preventDefault();
                    this.applyFormat('bold');
                    return;
                case 'i':
                    event.preventDefault();
                    this.applyFormat('italic');
                    return;
                case 'u':
                    event.preventDefault();
                    this.applyFormat('underline');
                    return;
            }

            if (event.shiftKey && event.key.toLowerCase() === 'x') {
                event.preventDefault();
                this.applyFormat('strikethrough');
                return;
            }
        }

        // List handling
        if (this._isInList()) {
            // Tab/Shift+Tab for list indentation
            if (event.key === 'Tab') {
                event.preventDefault();
                if (event.shiftKey) {
                    this._outdentListItem();
                } else {
                    this._indentListItem();
                }
                return;
            }

            // Enter in empty list item exits the list
            if (event.key === 'Enter' && !event.shiftKey) {
                const listItem = this._getCurrentListItem();
                if (listItem && this._isListItemEmpty(listItem)) {
                    event.preventDefault();
                    this._exitList(listItem);
                    return;
                }
            }

            // Backspace at start of list item
            if (event.key === 'Backspace') {
                if (this._isCaretAtListItemStart()) {
                    event.preventDefault();
                    this._handleBackspaceInList();
                    return;
                }
            }
        }

        // Shift+Tab for outdent (when not in a list, acts as general outdent)
        if (event.key === 'Tab' && event.shiftKey && !this._isInList()) {
            event.preventDefault();
            document.execCommand('outdent', false, null);
            this._markDirty();
            return;
        }

        // Tab to exit and select next object (when not in a list)
        if (event.key === 'Tab' && !event.shiftKey && !this._isInList()) {
            event.preventDefault();
            this.exitEditMode({ keepSelection: false });
            this._selectAdjacentElement('next');
            return;
        }
    }

    /**
     * Handle blur event.
     * @param {FocusEvent} event
     * @private
     */
    _handleBlur(event) {
        // Don't exit if focus moved to Property Inspector
        // Check if new focus target is within PI
        const relatedTarget = event.relatedTarget;
        if (relatedTarget) {
            const isPI = relatedTarget.closest('.property-inspector');
            if (isPI) {
                // Save selection for PI interaction
                this.saveSelection();
                return;
            }
        }

        // Use timeout to allow click handlers to run first
        setTimeout(() => {
            if (this.isEditing && this.currentElement && !this.currentElement.contains(document.activeElement)) {
                this.exitEditMode({ keepSelection: false });
            }
        }, 100);
    }

    /**
     * Handle paste event.
     * @param {ClipboardEvent} event
     * @private
     */
    _handlePaste(event) {
        if (!FEATURE_FLAGS.ENABLE_RICH_PASTE) {
            // Plain text paste
            event.preventDefault();
            const text = event.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
            this._markDirty();
            return;
        }

        // Rich paste with sanitization
        event.preventDefault();
        
        let content = event.clipboardData.getData('text/html');
        if (!content) {
            content = event.clipboardData.getData('text/plain');
            // Convert plain text to HTML (preserve line breaks)
            content = content.replace(/\n/g, '<br>');
        }

        const sanitized = contentSanitizer.sanitizePaste(content);
        document.execCommand('insertHTML', false, sanitized);
        this._markDirty();
    }

    /**
     * Mark content as dirty.
     * @private
     */
    _markDirty() {
        historyBridge.markDirty();
        
        store.dispatch(ACTION_TYPES.MARK_TEXT_DIRTY, { elementId: this.currentElementId });
    }

    /**
     * Schedule a debounced save.
     * @private
     */
    _scheduleSave() {
        this._clearSaveTimer();
        
        this.saveTimer = setTimeout(() => {
            if (this.isEditing && this.currentElement) {
                this._emit(EVENTS.TEXT_CONTENT_SAVE, {
                    elementId: this.currentElementId,
                    content: this.currentElement.innerHTML
                });
            }
        }, TIMING.DEBOUNCE_SAVE_MS);
    }

    /**
     * Clear the save timer.
     * @private
     */
    _clearSaveTimer() {
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
            this.saveTimer = null;
        }
    }

    /**
     * Emit an event to subscribers.
     * @param {string} event - Event name
     * @param {Object} data - Event data
     * @private
     */
    _emit(event, data) {
        const callbacks = this.eventCallbacks.get(event);
        if (callbacks) {
            for (const callback of callbacks) {
                try {
                    callback(data);
                } catch (e) {
                    console.error('TextEditManager: Event callback error', e);
                }
            }
        }
    }

    /**
     * Get the formatting state of the current selection.
     * Returns which styles are applied (for Property Inspector to show active states).
     * @returns {Object} Style states
     */
    getSelectionStyles() {
        if (!this.isEditing || !this.currentElement) {
            return { bold: false, italic: false, underline: false, strikethrough: false };
        }

        return {
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            strikethrough: document.queryCommandState('strikeThrough')
        };
    }

    /**
     * Get extended selection info including formatting.
     * @returns {Object|null}
     */
    getSelectionInfo() {
        if (!this.isEditing || !this.currentElement) return null;

        const baseInfo = selectionManager.getSelectionInfo(this.currentElement);
        if (!baseInfo) return null;

        return {
            ...baseInfo,
            styles: this.getSelectionStyles()
        };
    }

    /**
     * Check if caret is currently inside a list.
     * @returns {boolean}
     * @private
     */
    _isInList() {
        if (!this.currentElement) return false;
        
        const selection = window.getSelection();
        if (!selection.rangeCount) return false;
        
        let node = selection.anchorNode;
        while (node && node !== this.currentElement) {
            if (node.nodeName === 'UL' || node.nodeName === 'OL' || node.nodeName === 'LI') {
                return true;
            }
            node = node.parentNode;
        }
        
        return false;
    }

    /**
     * Select the next or previous element on the slide.
     * @param {'next'|'previous'} direction - Direction to move
     * @private
     */
    _selectAdjacentElement(direction) {
        const state = store.getState();
        const mode = state.editor.mode;
        const activeId = mode === 'master' ? state.editor.activeMasterId : state.editor.activeSlideId;
        const container = mode === 'master' ? state.masters[activeId] : state.slides[activeId];
        
        if (!container) return;

        // Get effective elements for slides (includes layout elements)
        let elementOrder;
        if (mode === 'edit' || mode === 'slide') {
            const effectiveSlide = store.getEffectiveSlide(activeId);
            elementOrder = effectiveSlide?.effectiveOrder || [];
        } else {
            elementOrder = container.elementOrder || [];
        }

        if (elementOrder.length === 0) return;

        // Find current element index
        const currentIndex = elementOrder.indexOf(this.currentElementId);
        
        // Calculate next index
        let nextIndex;
        if (direction === 'next') {
            nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % elementOrder.length;
        } else {
            nextIndex = currentIndex === -1 ? elementOrder.length - 1 : (currentIndex - 1 + elementOrder.length) % elementOrder.length;
        }

        const nextElementId = elementOrder[nextIndex];
        
        // Select the next element
        store.dispatch('UPDATE_SELECTION', [nextElementId]);
    }

    /**
     * Get the current list item element.
     * @returns {Element|null}
     * @private
     */
    _getCurrentListItem() {
        if (!this.currentElement) return null;
        
        const selection = window.getSelection();
        if (!selection.rangeCount) return null;
        
        let node = selection.anchorNode;
        while (node && node !== this.currentElement) {
            if (node.nodeName === 'LI') {
                return node;
            }
            node = node.parentNode;
        }
        
        return null;
    }

    /**
     * Check if a list item is empty (no text content).
     * @param {Element} listItem - The LI element
     * @returns {boolean}
     * @private
     */
    _isListItemEmpty(listItem) {
        if (!listItem) return false;
        
        // Get text content, excluding nested lists
        const text = Array.from(listItem.childNodes)
            .filter(n => n.nodeType === Node.TEXT_NODE || 
                        (n.nodeType === Node.ELEMENT_NODE && 
                         n.nodeName !== 'UL' && n.nodeName !== 'OL'))
            .map(n => n.textContent)
            .join('')
            .trim();
        
        return text === '';
    }

    /**
     * Check if caret is at the start of a list item.
     * @returns {boolean}
     * @private
     */
    _isCaretAtListItemStart() {
        const selection = window.getSelection();
        if (!selection.isCollapsed || !selection.rangeCount) return false;
        
        const range = selection.getRangeAt(0);
        const listItem = this._getCurrentListItem();
        if (!listItem) return false;
        
        // Check if we're at the very start
        if (range.startOffset > 0) return false;
        
        // Walk up from anchor to list item, ensuring we're at first position
        let node = selection.anchorNode;
        while (node && node !== listItem) {
            const parent = node.parentNode;
            if (!parent) break;
            
            const siblings = Array.from(parent.childNodes);
            const index = siblings.indexOf(node);
            
            // Check if there are any text-bearing nodes before us
            for (let i = 0; i < index; i++) {
                const sibling = siblings[i];
                if (sibling.nodeType === Node.TEXT_NODE && sibling.textContent.length > 0) {
                    return false;
                }
                if (sibling.nodeType === Node.ELEMENT_NODE && 
                    sibling.nodeName !== 'UL' && sibling.nodeName !== 'OL' &&
                    sibling.textContent.length > 0) {
                    return false;
                }
            }
            
            node = parent;
        }
        
        return true;
    }

    /**
     * Indent the current list item.
     * @private
     */
    _indentListItem() {
        const listItem = this._getCurrentListItem();
        if (!listItem) return;
        
        const prevSibling = listItem.previousElementSibling;
        if (!prevSibling || prevSibling.nodeName !== 'LI') {
            // Can't indent if no previous sibling
            return;
        }
        
        // Find or create nested list in previous sibling
        const parentList = listItem.parentElement;
        const listType = parentList.nodeName; // UL or OL
        
        let nestedList = prevSibling.querySelector(listType);
        if (!nestedList) {
            nestedList = document.createElement(listType);
            prevSibling.appendChild(nestedList);
        }
        
        // Move current item into nested list
        nestedList.appendChild(listItem);
        this._markDirty();
    }

    /**
     * Outdent the current list item.
     * @private
     */
    _outdentListItem() {
        const listItem = this._getCurrentListItem();
        if (!listItem) return;
        
        const parentList = listItem.parentElement;
        if (!parentList || (parentList.nodeName !== 'UL' && parentList.nodeName !== 'OL')) {
            return;
        }
        
        const grandparentLi = parentList.parentElement;
        if (!grandparentLi || grandparentLi.nodeName !== 'LI') {
            // Already at top level, can't outdent
            return;
        }
        
        const greatGrandparentList = grandparentLi.parentElement;
        if (!greatGrandparentList) return;
        
        // Move item after the grandparent LI
        greatGrandparentList.insertBefore(listItem, grandparentLi.nextSibling);
        
        // Clean up empty nested list
        if (parentList.children.length === 0) {
            parentList.remove();
        }
        
        this._markDirty();
    }

    /**
     * Exit the list when Enter is pressed on empty item.
     * @param {Element} listItem - The empty list item
     * @private
     */
    _exitList(listItem) {
        const parentList = listItem.parentElement;
        if (!parentList) return;
        
        // Check if this is a nested list
        const grandparentLi = parentList.parentElement;
        if (grandparentLi && grandparentLi.nodeName === 'LI') {
            // Nested list: outdent instead of exiting completely
            this._outdentListItem();
            return;
        }
        
        // Top-level list: remove item and insert paragraph after list
        listItem.remove();
        
        // If list is now empty, remove it
        if (parentList.children.length === 0) {
            // Insert a <br> or empty text after the list position
            const br = document.createElement('br');
            if (parentList.nextSibling) {
                parentList.parentNode.insertBefore(br, parentList.nextSibling);
            } else {
                parentList.parentNode.appendChild(br);
            }
            parentList.remove();
            
            // Place caret after the br
            const selection = window.getSelection();
            const range = document.createRange();
            range.setStartAfter(br);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        }
        
        this._markDirty();
    }

    /**
     * Handle backspace at the start of a list item.
     * @private
     */
    _handleBackspaceInList() {
        const listItem = this._getCurrentListItem();
        if (!listItem) return;
        
        const parentList = listItem.parentElement;
        const isNested = parentList?.parentElement?.nodeName === 'LI';
        
        if (isNested) {
            // Outdent nested item
            this._outdentListItem();
        } else {
            // Top-level: convert to regular text
            const content = listItem.innerHTML;
            const prevSibling = listItem.previousElementSibling;
            
            listItem.remove();
            
            // If list is now empty, replace with content
            if (parentList.children.length === 0) {
                const div = document.createElement('div');
                div.innerHTML = content || '<br>';
                parentList.replaceWith(div);
                
                // Place caret at start of new content
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(div);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
            } else if (prevSibling) {
                // Merge with previous item
                const selection = window.getSelection();
                const range = document.createRange();
                
                // Find end of previous item content
                if (prevSibling.lastChild) {
                    range.setStartAfter(prevSibling.lastChild);
                } else {
                    range.setStart(prevSibling, 0);
                }
                range.collapse(true);
                
                // Append content
                prevSibling.innerHTML += content;
                
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
        
        this._markDirty();
    }
}

// Singleton instance
export const textEditManager = new TextEditManager();
