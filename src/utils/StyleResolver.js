export const StyleResolver = {
    /**
     * Resolves the final text properties for an element.
     * @param {Object} element - The text element.
     * @param {Object} globalStyles - Map of styleId -> styleObject.
     * @returns {Object} The resolved properties ready for rendering.
     */
    getEffectiveTextProperties(element, globalStyles = {}) {
        // Default properties for text elements
        const defaults = {
            fontFamily: 'Inter',
            fontSize: 12,
            fontWeight: 'normal',
            fontStyle: 'normal',
            textFill: { type: 'solid', value: '#000000' },
            lineHeight: 'auto',
            letterSpacing: '0%',
            textAlign: 'left',
            verticalAlign: 'top',
            textDecoration: 'none',
            textTransform: 'none',
            paragraphSpacing: 0,
            paragraphIndent: 0,
            // New Typography Features
            verticalTrim: 'standard',
            listStyle: 'none',
            listSpacing: 0,
            truncate: false,
            maxLines: 1
        };

        // Start with defaults
        let finalProps = { ...defaults };

        // Apply Global Style if present
        if (element.styleId && globalStyles[element.styleId]) {
            finalProps = { ...finalProps, ...globalStyles[element.styleId] };
        }

        // Apply Legacy/Nested Style Overrides (for backward compatibility)
        if (element.style) {
             Object.keys(element.style).forEach(key => {
                if (element.style[key] !== undefined && element.style[key] !== null) {
                    finalProps[key] = element.style[key];
                }
            });
        }

        // Apply Element Overrides
        // We iterate over keys in element to see what's explicitly set.
        // We assume element properties override style properties.
        Object.keys(element).forEach(key => {
            if (element[key] !== undefined && element[key] !== null && key !== 'style') {
                finalProps[key] = element[key];
            }
        });

        // Handle Legacy Color Migration (if element has color string but no textFill)
        if (element.color && !element.textFill) {
            finalProps.textFill = { type: 'solid', value: element.color };
        }

        // Compute Derived Values
        
        // Line Height
        if (finalProps.lineHeight === 'auto') {
            // Default to 1.2 * fontSize
            finalProps.computedLineHeight = (finalProps.fontSize || 12) * 1.2;
        } else {
            finalProps.computedLineHeight = finalProps.lineHeight;
        }

        return finalProps;
    }
};
