/**
 * PlaceholderManager
 * 
 * Manages placeholder text elements from master slides.
 * Handles prompt text display and hasUserContent tracking.
 * 
 * @see documentation/tech-specs/core/text-editing/02-placeholder-manager.md
 */

import { PLACEHOLDER_PROMPTS } from './constants.js';
import { contentSanitizer } from './ContentSanitizer.js';

export class PlaceholderManager {
    /**
     * Get the prompt text for a placeholder type.
     * @param {string} placeholderType - Type of placeholder (title, body, etc.)
     * @returns {string} Prompt text
     */
    static getPromptText(placeholderType) {
        return PLACEHOLDER_PROMPTS[placeholderType] || PLACEHOLDER_PROMPTS.text;
    }

    /**
     * Check if an element is a placeholder.
     * @param {Object} element - Element data from store
     * @returns {boolean}
     */
    static isPlaceholder(element) {
        return element?.isPlaceholder === true || element?.fromMaster === true;
    }

    /**
     * Check if a placeholder has user content.
     * @param {Object} element - Element data from store
     * @returns {boolean}
     */
    static hasUserContent(element) {
        if (!element) return false;
        
        // Check explicit flag first
        if (typeof element.hasUserContent === 'boolean') {
            return element.hasUserContent;
        }

        // Fall back to content check
        return !this.isContentEmpty(element.content, element.placeholderType);
    }

    /**
     * Check if content is empty or only contains prompt text.
     * @param {string} content - HTML content
     * @param {string} [placeholderType] - Type of placeholder
     * @returns {boolean}
     */
    static isContentEmpty(content, placeholderType) {
        if (!content) return true;

        const plainText = contentSanitizer.toPlainText(content).trim();
        
        if (plainText.length === 0) return true;

        // Check if content matches prompt text
        if (placeholderType) {
            const prompt = this.getPromptText(placeholderType);
            if (plainText === prompt) return true;
        }

        return false;
    }

    /**
     * Prepare a placeholder for editing.
     * Clears prompt text if content is empty.
     * @param {Object} element - Element data
     * @returns {Object} Updated element data for editing
     */
    static prepareForEdit(element) {
        if (!this.isPlaceholder(element)) {
            return element;
        }

        const isEmpty = this.isContentEmpty(element.content, element.placeholderType);

        return {
            ...element,
            // Clear content if it's just prompt text
            _editContent: isEmpty ? '' : element.content,
            _showPrompt: false,
            _wasEmpty: isEmpty
        };
    }

    /**
     * Handle exit from editing a placeholder.
     * Restores prompt text if still empty.
     * @param {Object} element - Element data
     * @param {string} newContent - New content from editing
     * @returns {Object} Result with content and flags
     */
    static handleEditExit(element, newContent) {
        const isPlaceholder = this.isPlaceholder(element);
        const isEmpty = this.isContentEmpty(newContent, element?.placeholderType);

        if (isPlaceholder) {
            if (isEmpty) {
                // Restore prompt text for empty placeholder
                const prompt = this.getPromptText(element.placeholderType);
                return {
                    content: prompt,
                    hasUserContent: false,
                    shouldDelete: false,
                    showPrompt: true
                };
            } else {
                // User added content
                return {
                    content: newContent,
                    hasUserContent: true,
                    shouldDelete: false,
                    showPrompt: false
                };
            }
        } else {
            // Regular text element (not placeholder)
            return {
                content: isEmpty ? '' : newContent,
                hasUserContent: !isEmpty,
                shouldDelete: isEmpty, // Delete empty non-placeholder
                showPrompt: false
            };
        }
    }

    /**
     * Get the display content for a placeholder.
     * @param {Object} element - Element data
     * @returns {Object} Display configuration
     */
    static getDisplayConfig(element) {
        if (!this.isPlaceholder(element)) {
            return {
                content: element.content || '',
                isPrompt: false,
                cssClass: ''
            };
        }

        const hasContent = this.hasUserContent(element);

        if (hasContent) {
            return {
                content: element.content,
                isPrompt: false,
                cssClass: ''
            };
        } else {
            return {
                content: this.getPromptText(element.placeholderType),
                isPrompt: true,
                cssClass: 'text-content--prompt'
            };
        }
    }

    /**
     * Check if content was cleared (transition from hasContent to empty).
     * @param {Object} previousElement - Previous element state
     * @param {string} newContent - New content
     * @returns {boolean}
     */
    static wasContentCleared(previousElement, newContent) {
        const hadContent = this.hasUserContent(previousElement);
        const hasContent = !this.isContentEmpty(newContent, previousElement?.placeholderType);
        
        return hadContent && !hasContent;
    }

    /**
     * Check if a placeholder should show the reset option.
     * @param {Object} element - Element data
     * @returns {boolean}
     */
    static canResetToMaster(element) {
        if (!this.isPlaceholder(element)) {
            return false;
        }

        // Can reset if has user content or custom styling
        return this.hasUserContent(element) || element.hasCustomStyle === true;
    }

    /**
     * Reset a placeholder to its master state.
     * @param {Object} element - Element data
     * @param {Object} masterElement - Original master element data
     * @returns {Object} Reset element data
     */
    static resetToMaster(element, masterElement) {
        if (!masterElement) {
            // No master reference, just clear content
            return {
                ...element,
                content: this.getPromptText(element.placeholderType),
                hasUserContent: false,
                hasCustomStyle: false,
                inlineStyles: {}
            };
        }

        return {
            ...element,
            content: masterElement.content || this.getPromptText(element.placeholderType),
            hasUserContent: false,
            hasCustomStyle: false,
            inlineStyles: masterElement.inlineStyles || {},
            styleId: masterElement.styleId
        };
    }

    /**
     * Get placeholder types for a layout.
     * @param {string} layoutId - Layout identifier
     * @returns {string[]} Array of placeholder types
     */
    static getPlaceholderTypes(layoutId) {
        // Standard layouts and their placeholders
        const layouts = {
            'title': ['title', 'subtitle'],
            'title-content': ['title', 'body'],
            'section-header': ['title'],
            'two-column': ['title', 'body', 'body'],
            'comparison': ['title', 'body', 'body'],
            'title-only': ['title'],
            'blank': []
        };

        return layouts[layoutId] || ['title', 'body'];
    }
}
