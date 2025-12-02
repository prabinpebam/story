import { store } from '../core/Store.js';

export const StyleResolver = {
    /**
     * Resolves a theme slot index to an actual hex color value.
     * Uses the current theme's lumaTheme slots.
     * @param {number} slotIndex - The 0-based slot index (0-11)
     * @param {string} fallback - Fallback color if slot not found
     * @returns {string} The hex color value
     */
    resolveThemeSlot(slotIndex, fallback = '#000000') {
        if (slotIndex === undefined || slotIndex === null) return fallback;
        
        const state = store.getState();
        const themeMaster = Object.values(state.masters).find(m => m.type === 'theme');
        const lumaTheme = themeMaster?.themeSettings?.lumaTheme;
        
        if (lumaTheme?.slots?.[slotIndex]) {
            return lumaTheme.slots[slotIndex].hex || fallback;
        }
        
        // Try resolvedColors array as fallback
        if (lumaTheme?.resolvedColors?.[slotIndex]) {
            return lumaTheme.resolvedColors[slotIndex];
        }
        
        // Last resort: try CSS variable
        const slotNumber = slotIndex + 1;
        const cssValue = getComputedStyle(document.documentElement)
            .getPropertyValue(`--theme-slot${slotNumber}`).trim();
        
        return cssValue || fallback;
    },

    /**
     * Resolves a textFill object that may contain a themeSlot reference.
     * Returns a fill object with the actual hex value resolved.
     * @param {Object} fill - The textFill object
     * @returns {Object} The fill object with resolved value
     */
    resolveTextFill(fill) {
        if (!fill) return { type: 'solid', value: '#000000' };
        
        if (fill.type === 'solid' && fill.themeSlot !== undefined && fill.themeSlot !== null) {
            const resolvedColor = this.resolveThemeSlot(fill.themeSlot, fill.value);
            return {
                ...fill,
                value: resolvedColor,
                // Preserve the themeSlot reference so we know it's theme-linked
                themeSlot: fill.themeSlot
            };
        }
        
        return fill;
    },

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
            maxLines: 1,
            // OpenType Features
            opentypeFeatures: {
                liga: true,      // Standard ligatures (default on)
                calt: true,      // Contextual alternates (default on)
                dlig: false,     // Discretionary ligatures
                figureStyle: 'default',
                figureSpacing: 'default',
                fractions: 'off',
                position: 'normal',
                stylisticSet: 0
            },
            // Variable Font Axes
            variableAxes: {}
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

        // Resolve theme slot references in textFill to actual hex colors
        if (finalProps.textFill) {
            finalProps.textFill = this.resolveTextFill(finalProps.textFill);
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
            // 12-color schema defaults
            background1: '#FFFFFF',
            background2: '#F5F5F5',
            text1: '#333333',
            text2: '#666666',
            accent1: '#18A0FB',
            accent2: '#7B61FF',
            accent3: '#1BC47D',
            accent4: '#F24822',
            accent5: '#FFBE0B',
            accent6: '#FF006E',
            hyperlink: '#0066CC',
            followedHyperlink: '#954F72',
            // Legacy aliases
            textPrimary: '#333333', 
            textSecondary: '#666666',
            accent: '#18A0FB'
        };
        
        return value
            // Font variables
            .replace('var(--theme-font-heading)', fonts.heading)
            .replace('var(--theme-font-body)', fonts.body)
            // 12-color schema variables (new format)
            .replace('var(--theme-background1)', colors.background1 || '#FFFFFF')
            .replace('var(--theme-background2)', colors.background2 || '#F5F5F5')
            .replace('var(--theme-text1)', colors.text1 || '#333333')
            .replace('var(--theme-text2)', colors.text2 || '#666666')
            .replace('var(--theme-accent1)', colors.accent1 || '#18A0FB')
            .replace('var(--theme-accent2)', colors.accent2 || '#7B61FF')
            .replace('var(--theme-accent3)', colors.accent3 || '#1BC47D')
            .replace('var(--theme-accent4)', colors.accent4 || '#F24822')
            .replace('var(--theme-accent5)', colors.accent5 || '#FFBE0B')
            .replace('var(--theme-accent6)', colors.accent6 || '#FF006E')
            .replace('var(--theme-hyperlink)', colors.hyperlink || '#0066CC')
            .replace('var(--theme-followed-hyperlink)', colors.followedHyperlink || '#954F72')
            // Dash-separated accent format (used in templates)
            .replace('var(--theme-accent-1)', colors.accent1 || '#18A0FB')
            .replace('var(--theme-accent-2)', colors.accent2 || '#7B61FF')
            .replace('var(--theme-accent-3)', colors.accent3 || '#1BC47D')
            .replace('var(--theme-accent-4)', colors.accent4 || '#F24822')
            .replace('var(--theme-accent-5)', colors.accent5 || '#FFBE0B')
            .replace('var(--theme-accent-6)', colors.accent6 || '#FF006E')
            // Legacy variables (backwards compatibility)
            .replace('var(--theme-text-primary)', colors.textPrimary || colors.text1 || '#333333')
            .replace('var(--theme-text-secondary)', colors.textSecondary || colors.text2 || '#666666')
            .replace('var(--theme-accent)', colors.accent || colors.accent1 || '#18A0FB');
    }
};
