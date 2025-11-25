export const StyleResolver = {
    /**
     * Resolves the final text properties for an element.
     * @param {Object} element - The text element.
     * @param {Object} globalStyles - Map of styleId -> styleObject (from theme.themeSettings.textStyles).
     * @returns {Object} The resolved properties ready for rendering.
     */
    getEffectiveTextProperties(element, globalStyles = {}) {
        // Default properties for text elements
        const defaults = {
            fontFamily: 'Inter',
            fontSize: 16,
            fontWeight: '400',
            fontStyle: 'normal',
            textFill: { type: 'solid', value: '#000000' },
            lineHeight: 1.5,
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

        // Apply Global Style if present (from theme.themeSettings.textStyles)
        if (element.styleId && globalStyles[element.styleId]) {
            const styleProps = globalStyles[element.styleId];
            // Apply style properties, skipping id and name
            Object.keys(styleProps).forEach(key => {
                if (key !== 'id' && key !== 'name' && styleProps[key] !== undefined) {
                    finalProps[key] = styleProps[key];
                }
            });
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
        // Skip metadata properties
        const skipKeys = ['id', 'type', 'x', 'y', 'width', 'height', 'rotation', 
                          'opacity', 'content', 'style', 'styleId', 'isPlaceholder', 
                          'placeholderType', 'locked', 'visible'];
        
        Object.keys(element).forEach(key => {
            if (!skipKeys.includes(key) && element[key] !== undefined && element[key] !== null) {
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
            finalProps.computedLineHeight = (finalProps.fontSize || 16) * 1.2;
        } else if (typeof finalProps.lineHeight === 'number' && finalProps.lineHeight <= 10) {
            // Line height as multiplier (e.g., 1.5)
            finalProps.computedLineHeight = (finalProps.fontSize || 16) * finalProps.lineHeight;
        } else {
            // Line height as absolute value
            finalProps.computedLineHeight = finalProps.lineHeight;
        }

        return finalProps;
    },

    /**
     * Resolves CSS variable references to actual values.
     * @param {string} value - The value that may contain CSS variables.
     * @param {Object} theme - The theme object with themeSettings.
     * @returns {string} The resolved value.
     */
    resolveThemeVariable(value, theme) {
        if (typeof value !== 'string' || !value.includes('var(')) return value;
        
        const fonts = theme?.themeSettings?.fonts || { heading: 'Inter', body: 'Inter' };
        const colors = theme?.themeSettings?.colors || { 
            textPrimary: '#333333', 
            textSecondary: '#888888',
            accent: '#18A0FB'
        };
        
        return value
            .replace('var(--theme-font-heading)', fonts.heading)
            .replace('var(--theme-font-body)', fonts.body)
            .replace('var(--theme-text-primary)', colors.textPrimary)
            .replace('var(--theme-text-secondary)', colors.textSecondary)
            .replace('var(--theme-accent)', colors.accent);
    }
};
