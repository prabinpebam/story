/**
 * ContentSanitizer
 * 
 * Sanitizes HTML content from contentEditable elements.
 * Uses an allowlist approach for security.
 * 
 * @see documentation/tech-specs/core/text-editing/04-content-sanitizer.md
 */

import { 
    ALLOWED_ELEMENTS_LIST, 
    ALLOWED_CSS_PROPERTIES,
    LIMITS 
} from './constants.js';

export class ContentSanitizer {
    constructor(options = {}) {
        this.allowedElements = options.allowedElements || ALLOWED_ELEMENTS_LIST;
        this.allowedCssProperties = options.allowedCssProperties || ALLOWED_CSS_PROPERTIES;
        this.maxNestedTags = options.maxNestedTags || LIMITS.MAX_NESTED_TAGS;
    }

    /**
     * Sanitize HTML content, removing disallowed elements and attributes.
     * @param {string} html - Raw HTML content
     * @returns {string} Sanitized HTML
     */
    sanitize(html) {
        if (!html || typeof html !== 'string') {
            return '';
        }

        // Create a temporary container to parse HTML
        const template = document.createElement('template');
        template.innerHTML = html;
        
        // Process the content
        this._processNode(template.content, 0);
        
        return template.innerHTML;
    }

    /**
     * Recursively process a DOM node and its children.
     * @param {Node} node - DOM node to process
     * @param {number} depth - Current nesting depth
     * @private
     */
    _processNode(node, depth) {
        // Prevent excessive nesting (security)
        if (depth > this.maxNestedTags) {
            // Flatten content at this depth
            const text = node.textContent;
            while (node.firstChild) {
                node.removeChild(node.firstChild);
            }
            node.textContent = text;
            return;
        }

        // Process children (iterate backwards to safely remove nodes)
        const children = Array.from(node.childNodes);
        for (const child of children) {
            if (child.nodeType === Node.ELEMENT_NODE) {
                this._processElement(child, node, depth);
            } else if (child.nodeType === Node.TEXT_NODE) {
                // Text nodes are safe, keep them
            } else {
                // Remove comments, CDATA, etc.
                node.removeChild(child);
            }
        }
    }

    /**
     * Process an element node, removing or sanitizing as needed.
     * @param {Element} element - Element to process
     * @param {Node} parent - Parent node
     * @param {number} depth - Current nesting depth
     * @private
     */
    _processElement(element, parent, depth) {
        const tagName = element.tagName.toLowerCase();

        // Check if element is allowed
        if (!this.allowedElements.includes(tagName)) {
            // Unwrap: keep children, remove element
            this._unwrapElement(element, parent);
            return;
        }

        // Sanitize attributes
        this._sanitizeAttributes(element);

        // Recursively process children
        this._processNode(element, depth + 1);
    }

    /**
     * Unwrap an element, keeping its children in place.
     * @param {Element} element - Element to unwrap
     * @param {Node} parent - Parent node
     * @private
     */
    _unwrapElement(element, parent) {
        const fragment = document.createDocumentFragment();
        while (element.firstChild) {
            fragment.appendChild(element.firstChild);
        }
        parent.replaceChild(fragment, element);
    }

    /**
     * Sanitize attributes on an element.
     * @param {Element} element - Element to sanitize
     * @private
     */
    _sanitizeAttributes(element) {
        const tagName = element.tagName.toLowerCase();
        
        // Get list of attributes to remove
        const attributesToRemove = [];
        
        for (const attr of element.attributes) {
            const attrName = attr.name.toLowerCase();
            
            // Always remove event handlers and dangerous attributes
            if (this._isDangerousAttribute(attrName)) {
                attributesToRemove.push(attr.name);
                continue;
            }

            // Handle style attribute specially
            if (attrName === 'style') {
                const sanitizedStyle = this._sanitizeStyle(attr.value);
                if (sanitizedStyle) {
                    element.setAttribute('style', sanitizedStyle);
                } else {
                    attributesToRemove.push(attr.name);
                }
                continue;
            }

            // Handle specific allowed attributes
            if (tagName === 'a' && attrName === 'href') {
                // Validate href
                if (!this._isValidHref(attr.value)) {
                    attributesToRemove.push(attr.name);
                }
                continue;
            }

            // Remove other attributes (class, id, data-*, etc.)
            // We're strict: only allow explicitly handled attributes
            if (!['style', 'href'].includes(attrName)) {
                attributesToRemove.push(attr.name);
            }
        }

        // Remove collected attributes
        for (const attrName of attributesToRemove) {
            element.removeAttribute(attrName);
        }
    }

    /**
     * Check if an attribute name is dangerous.
     * @param {string} attrName - Attribute name (lowercase)
     * @returns {boolean}
     * @private
     */
    _isDangerousAttribute(attrName) {
        // Event handlers
        if (attrName.startsWith('on')) {
            return true;
        }
        
        // Dangerous attributes
        const dangerous = [
            'javascript',
            'formaction',
            'xlink:href',
            'xmlns'
        ];
        
        return dangerous.includes(attrName);
    }

    /**
     * Sanitize a style attribute value.
     * @param {string} styleValue - Raw style string
     * @returns {string|null} Sanitized style or null if empty
     * @private
     */
    _sanitizeStyle(styleValue) {
        if (!styleValue) return null;

        const sanitizedParts = [];
        
        // Parse style declarations
        const declarations = styleValue.split(';');
        
        for (const decl of declarations) {
            const trimmed = decl.trim();
            if (!trimmed) continue;

            const colonIndex = trimmed.indexOf(':');
            if (colonIndex === -1) continue;

            const property = trimmed.substring(0, colonIndex).trim().toLowerCase();
            const value = trimmed.substring(colonIndex + 1).trim();

            // Check if property is allowed
            if (this.allowedCssProperties.includes(property)) {
                // Validate value doesn't contain dangerous content
                if (!this._isDangerousStyleValue(value)) {
                    sanitizedParts.push(`${property}: ${value}`);
                }
            }
        }

        return sanitizedParts.length > 0 ? sanitizedParts.join('; ') : null;
    }

    /**
     * Check if a style value contains dangerous content.
     * @param {string} value - Style value
     * @returns {boolean}
     * @private
     */
    _isDangerousStyleValue(value) {
        const dangerous = [
            'javascript:',
            'expression(',
            'url(',
            'behavior:',
            '-moz-binding'
        ];
        
        const lowerValue = value.toLowerCase();
        return dangerous.some(d => lowerValue.includes(d));
    }

    /**
     * Validate an href attribute value.
     * @param {string} href - Href value
     * @returns {boolean}
     * @private
     */
    _isValidHref(href) {
        if (!href) return false;
        
        const lower = href.toLowerCase().trim();
        
        // Block dangerous protocols
        const dangerous = ['javascript:', 'data:', 'vbscript:'];
        if (dangerous.some(d => lower.startsWith(d))) {
            return false;
        }
        
        // Allow relative URLs, http, https, mailto
        const allowed = ['http://', 'https://', 'mailto:', '#', '/'];
        return allowed.some(a => lower.startsWith(a)) || !lower.includes(':');
    }

    /**
     * Clean content for paste operations.
     * More aggressive cleaning than regular sanitize.
     * @param {string} html - Pasted HTML content
     * @returns {string} Clean HTML
     */
    sanitizePaste(html) {
        // First do regular sanitization
        let clean = this.sanitize(html);
        
        // Additional paste-specific cleaning:
        // Remove empty spans, normalize whitespace
        const template = document.createElement('template');
        template.innerHTML = clean;
        
        this._removeEmptyElements(template.content);
        this._normalizeWhitespace(template.content);
        
        return template.innerHTML;
    }

    /**
     * Remove empty elements (no text content).
     * @param {Node} node - Node to process
     * @private
     */
    _removeEmptyElements(node) {
        const children = Array.from(node.childNodes);
        
        for (const child of children) {
            if (child.nodeType === Node.ELEMENT_NODE) {
                // Recursively clean children first
                this._removeEmptyElements(child);
                
                // Check if element is now empty
                if (child.tagName.toLowerCase() !== 'br' && 
                    !child.textContent.trim() &&
                    child.children.length === 0) {
                    node.removeChild(child);
                }
            }
        }
    }

    /**
     * Normalize whitespace in text nodes.
     * @param {Node} node - Node to process
     * @private
     */
    _normalizeWhitespace(node) {
        const walker = document.createTreeWalker(
            node,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const textNodes = [];
        while (walker.nextNode()) {
            textNodes.push(walker.currentNode);
        }

        for (const textNode of textNodes) {
            // Collapse multiple spaces
            textNode.textContent = textNode.textContent.replace(/\s+/g, ' ');
        }
    }

    /**
     * Extract plain text from HTML.
     * @param {string} html - HTML content
     * @returns {string} Plain text
     */
    toPlainText(html) {
        if (!html) return '';
        
        const template = document.createElement('template');
        template.innerHTML = html;
        
        return template.content.textContent || '';
    }

    /**
     * Check if content is empty (no meaningful text).
     * @param {string} html - HTML content
     * @returns {boolean}
     */
    isEmpty(html) {
        const text = this.toPlainText(html);
        return text.trim().length === 0;
    }
}

// Singleton instance
export const contentSanitizer = new ContentSanitizer();
