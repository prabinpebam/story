/**
 * SelectionManager
 * 
 * Manages text selection state for contentEditable elements.
 * Saves and restores selection when focus moves to Property Inspector.
 * 
 * @see documentation/tech-specs/core/text-editing/03-selection-manager.md
 */

export class SelectionManager {
    constructor() {
        // Store selection as node paths for robustness
        this.savedSelection = null;
        this.targetElement = null;
    }

    /**
     * Save the current text selection within a contentEditable element.
     * @param {Element} element - The contentEditable element
     * @returns {boolean} True if selection was saved
     */
    save(element) {
        if (!element) {
            this.savedSelection = null;
            this.targetElement = null;
            return false;
        }

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            this.savedSelection = null;
            this.targetElement = null;
            return false;
        }

        const range = selection.getRangeAt(0);
        
        // Verify selection is within our element
        if (!element.contains(range.commonAncestorContainer)) {
            this.savedSelection = null;
            this.targetElement = null;
            return false;
        }

        // Store selection as node paths
        this.savedSelection = {
            start: this._getNodePath(element, range.startContainer, range.startOffset),
            end: this._getNodePath(element, range.endContainer, range.endOffset),
            isCollapsed: range.collapsed
        };
        this.targetElement = element;

        return true;
    }

    /**
     * Restore a previously saved selection.
     * @returns {boolean} True if selection was restored
     */
    restore() {
        if (!this.savedSelection || !this.targetElement) {
            return false;
        }

        // Check element still exists and is editable
        if (!document.body.contains(this.targetElement) || 
            !this.targetElement.isContentEditable) {
            this.clear();
            return false;
        }

        try {
            const selection = window.getSelection();
            const range = document.createRange();

            const start = this._resolveNodePath(this.targetElement, this.savedSelection.start);
            const end = this._resolveNodePath(this.targetElement, this.savedSelection.end);

            if (!start.node || !end.node) {
                this.clear();
                return false;
            }

            range.setStart(start.node, start.offset);
            range.setEnd(end.node, end.offset);

            selection.removeAllRanges();
            selection.addRange(range);

            return true;
        } catch (e) {
            console.warn('SelectionManager: Failed to restore selection', e);
            this.clear();
            return false;
        }
    }

    /**
     * Clear saved selection state.
     */
    clear() {
        this.savedSelection = null;
        this.targetElement = null;
    }

    /**
     * Check if there's a saved selection.
     * @returns {boolean}
     */
    hasSavedSelection() {
        return this.savedSelection !== null;
    }

    /**
     * Get the current selection's text content.
     * @returns {string}
     */
    getSelectedText() {
        const selection = window.getSelection();
        return selection ? selection.toString() : '';
    }

    /**
     * Check if current selection is collapsed (cursor, no range).
     * @returns {boolean}
     */
    isCollapsed() {
        const selection = window.getSelection();
        return selection ? selection.isCollapsed : true;
    }

    /**
     * Select all content within an element.
     * @param {Element} element - The contentEditable element
     */
    selectAll(element) {
        if (!element) return;

        const range = document.createRange();
        range.selectNodeContents(element);
        
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }

    /**
     * Place caret at the end of an element's content.
     * @param {Element} element - The contentEditable element
     */
    placeCaretAtEnd(element) {
        if (!element) return;

        const range = document.createRange();
        range.selectNodeContents(element);
        range.collapse(false); // false = collapse to end
        
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }

    /**
     * Place caret at the start of an element's content.
     * @param {Element} element - The contentEditable element
     */
    placeCaretAtStart(element) {
        if (!element) return;

        const range = document.createRange();
        range.selectNodeContents(element);
        range.collapse(true); // true = collapse to start
        
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }

    /**
     * Place caret at a specific position within text.
     * @param {Element} element - The contentEditable element
     * @param {number} offset - Character offset from start
     */
    placeCaretAtOffset(element, offset) {
        if (!element) return;

        const { node, offset: nodeOffset } = this._findTextNodeAtOffset(element, offset);
        
        if (node) {
            const range = document.createRange();
            range.setStart(node, nodeOffset);
            range.collapse(true);
            
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

    /**
     * Get a path from root element to a node.
     * @param {Element} root - Root element
     * @param {Node} node - Target node
     * @param {number} offset - Offset within node
     * @returns {Object} Path object
     * @private
     */
    _getNodePath(root, node, offset) {
        const path = [];
        let current = node;

        // Walk up to root, recording child indices
        while (current && current !== root) {
            const parent = current.parentNode;
            if (!parent) break;
            
            const index = Array.from(parent.childNodes).indexOf(current);
            path.unshift(index);
            current = parent;
        }

        return { path, offset, nodeType: node.nodeType };
    }

    /**
     * Resolve a node path back to a node.
     * @param {Element} root - Root element
     * @param {Object} pathInfo - Path object from _getNodePath
     * @returns {Object} { node, offset }
     * @private
     */
    _resolveNodePath(root, pathInfo) {
        let node = root;
        
        for (const index of pathInfo.path) {
            if (!node.childNodes[index]) {
                // Path is invalid, try to get closest valid position
                return this._getFallbackPosition(root);
            }
            node = node.childNodes[index];
        }

        // Validate offset
        let offset = pathInfo.offset;
        if (node.nodeType === Node.TEXT_NODE) {
            offset = Math.min(offset, node.textContent.length);
        } else {
            offset = Math.min(offset, node.childNodes.length);
        }

        return { node, offset };
    }

    /**
     * Get a fallback position (end of content).
     * @param {Element} root - Root element
     * @returns {Object} { node, offset }
     * @private
     */
    _getFallbackPosition(root) {
        // Find last text node
        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let lastTextNode = null;
        while (walker.nextNode()) {
            lastTextNode = walker.currentNode;
        }

        if (lastTextNode) {
            return { 
                node: lastTextNode, 
                offset: lastTextNode.textContent.length 
            };
        }

        // No text nodes, return root
        return { node: root, offset: 0 };
    }

    /**
     * Find the text node and offset for a character position.
     * @param {Element} root - Root element
     * @param {number} targetOffset - Character offset
     * @returns {Object} { node, offset }
     * @private
     */
    _findTextNodeAtOffset(root, targetOffset) {
        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let currentOffset = 0;
        let textNode = null;

        while (walker.nextNode()) {
            textNode = walker.currentNode;
            const length = textNode.textContent.length;
            
            if (currentOffset + length >= targetOffset) {
                return { 
                    node: textNode, 
                    offset: targetOffset - currentOffset 
                };
            }
            
            currentOffset += length;
        }

        // Past end, return last position
        if (textNode) {
            return { 
                node: textNode, 
                offset: textNode.textContent.length 
            };
        }

        return { node: root, offset: 0 };
    }

    /**
     * Get selection info for Property Inspector.
     * @param {Element} element - The contentEditable element
     * @returns {Object|null} Selection info or null
     */
    getSelectionInfo(element) {
        if (!element) return null;

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return null;

        const range = selection.getRangeAt(0);
        if (!element.contains(range.commonAncestorContainer)) return null;

        return {
            isCollapsed: range.collapsed,
            selectedText: selection.toString(),
            startOffset: this._getAbsoluteOffset(element, range.startContainer, range.startOffset),
            endOffset: this._getAbsoluteOffset(element, range.endContainer, range.endOffset)
        };
    }

    /**
     * Get absolute character offset from start of content.
     * @param {Element} root - Root element
     * @param {Node} node - Target node
     * @param {number} offset - Offset within node
     * @returns {number}
     * @private
     */
    _getAbsoluteOffset(root, node, offset) {
        let absoluteOffset = 0;
        
        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        while (walker.nextNode()) {
            const textNode = walker.currentNode;
            
            if (textNode === node) {
                return absoluteOffset + offset;
            }
            
            // Check if target is ancestor of this text node
            if (node.contains && node.contains(textNode)) {
                return absoluteOffset + offset;
            }
            
            absoluteOffset += textNode.textContent.length;
        }

        return absoluteOffset + offset;
    }
}

// Singleton instance
export const selectionManager = new SelectionManager();
