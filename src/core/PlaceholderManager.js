/**
 * PlaceholderManager.js
 * Manages the creation, validation, and behavior of slide master placeholders.
 */

import { PLACEHOLDER_TYPES, PLACEHOLDER_DEFAULTS } from './constants/PlaceholderTypes.js';

export class PlaceholderManager {
    /**
     * Creates a new placeholder element data object.
     * @param {string} type - One of PLACEHOLDER_TYPES
     * @param {Object} options - Position, size, etc.
     * @returns {Object} The new placeholder element
     */
    createPlaceholder(type, options = {}) {
        const defaults = PLACEHOLDER_DEFAULTS[type] || {};
        
        return {
            id: crypto.randomUUID(),
            type: 'placeholder',
            isPlaceholder: true,
            placeholderType: type,
            x: options.x || 100,
            y: options.y || 100,
            width: options.width || 400,
            height: options.height || 200,
            rotation: 0,
            content: defaults.text || '', // Use content for TextElement compatibility
            text: defaults.text || '',    // Keep text for reference
            style: {
                fontFamily: defaults.fontFamily || 'Inter',
                fontSize: defaults.fontSize || 24,
                fontWeight: defaults.fontWeight || 'normal',
                textAlign: defaults.align || 'left',
                color: defaults.color || 'var(--color-text-primary)',
                fill: 'transparent',
                stroke: null
            },
            // Content constraints
            allowedContent: this.getAllowedContentForType(type),
            ...options
        };
    }

    /**
     * Returns the list of allowed content types for a given placeholder type.
     * @param {string} type 
     * @returns {string[]} Array of allowed types ('text', 'image', 'video', etc.)
     */
    getAllowedContentForType(type) {
        switch (type) {
            case PLACEHOLDER_TYPES.TITLE:
            case PLACEHOLDER_TYPES.SUBTITLE:
            case PLACEHOLDER_TYPES.BODY:
            case PLACEHOLDER_TYPES.SLIDE_NUMBER:
            case PLACEHOLDER_TYPES.DATE:
            case PLACEHOLDER_TYPES.FOOTER:
                return ['text'];
            case PLACEHOLDER_TYPES.PICTURE:
                return ['image'];
            case PLACEHOLDER_TYPES.MEDIA:
                return ['video', 'audio'];
            case PLACEHOLDER_TYPES.CHART:
                return ['chart'];
            case PLACEHOLDER_TYPES.TABLE:
                return ['table'];
            case PLACEHOLDER_TYPES.SMART_ART:
                return ['smartArt'];
            case PLACEHOLDER_TYPES.CONTENT:
            default:
                return ['text', 'image', 'video', 'chart', 'table', 'smartArt'];
        }
    }

    /**
     * Checks if an element is a placeholder.
     * @param {Object} element 
     * @returns {boolean}
     */
    isPlaceholder(element) {
        return !!element?.isPlaceholder;
    }
    
    /**
     * Gets the prompt text for a placeholder.
     * @param {Object} element 
     * @returns {string}
     */
    getPromptText(element) {
        if (!this.isPlaceholder(element)) return '';
        // If the element has custom text (user edited prompt), use it.
        // Otherwise fall back to default for type.
        // Note: In a real implementation, we might want to distinguish between "user typed content" and "prompt text".
        // For a master placeholder, the 'text' property IS the prompt text.
        return element.text || PLACEHOLDER_DEFAULTS[element.placeholderType]?.text || '';
    }

    /**
     * Checks if a placeholder accepts a specific content type.
     * @param {Object} placeholder 
     * @param {string} contentType 
     * @returns {boolean}
     */
    acceptsContent(placeholder, contentType) {
        if (!this.isPlaceholder(placeholder)) return false;
        const allowed = placeholder.allowedContent || [];
        return allowed.includes(contentType);
    }
}

export const placeholderManager = new PlaceholderManager();
