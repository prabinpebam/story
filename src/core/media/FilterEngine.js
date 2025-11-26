/**
 * FilterEngine - CSS and SVG Filter Generation
 * 
 * Converts filter property values to CSS filter strings and SVG filters.
 * Handles both simple CSS filters and complex SVG filters for temperature/tint.
 * 
 * Filter Pipeline Order:
 * 1. temperature/tint (SVG feColorMatrix)
 * 2. exposure (brightness)
 * 3. contrast
 * 4. saturation
 * 5. hue-rotate
 * 6. grayscale
 * 7. sepia
 * 8. invert
 * 9. blur (ALWAYS LAST - for performance)
 */

export class FilterEngine {
    
    /**
     * Build CSS filter string from filter properties
     * @param {Object} filters - Filter properties object
     * @returns {string} - CSS filter string
     */
    static buildCssFilter(filters) {
        if (!filters) return 'none';
        
        const parts = [];
        
        // NOTE: temperature and tint are handled via SVG filter, not CSS
        // They need to be applied separately via url(#filter-id)
        
        // Order matters for predictable results
        // brightness before contrast for exposure behavior
        
        // Exposure → brightness
        // exposure of 0 = brightness(1), exposure of 100 = brightness(2), -100 = brightness(0)
        if (filters.exposure !== undefined && filters.exposure !== 0) {
            const brightness = 1 + (filters.exposure / 100);
            parts.push(`brightness(${brightness.toFixed(3)})`);
        }
        
        // Contrast
        // contrast of 0 = contrast(1), 100 = contrast(2), -100 = contrast(0)
        if (filters.contrast !== undefined && filters.contrast !== 0) {
            const contrast = 1 + (filters.contrast / 100);
            parts.push(`contrast(${contrast.toFixed(3)})`);
        }
        
        // Saturation
        // saturation of 0 = saturate(1), 100 = saturate(2), -100 = saturate(0)
        if (filters.saturation !== undefined && filters.saturation !== 0) {
            const saturate = 1 + (filters.saturation / 100);
            parts.push(`saturate(${saturate.toFixed(3)})`);
        }
        
        // Hue Rotate
        if (filters.hueRotate !== undefined && filters.hueRotate !== 0) {
            parts.push(`hue-rotate(${filters.hueRotate}deg)`);
        }
        
        // Grayscale
        if (filters.grayscale !== undefined && filters.grayscale !== 0) {
            parts.push(`grayscale(${filters.grayscale}%)`);
        }
        
        // Sepia
        if (filters.sepia !== undefined && filters.sepia !== 0) {
            parts.push(`sepia(${filters.sepia}%)`);
        }
        
        // Invert
        if (filters.invert !== undefined && filters.invert !== 0) {
            parts.push(`invert(${filters.invert}%)`);
        }
        
        // Blur - ALWAYS LAST for GPU optimization
        if (filters.blur !== undefined && filters.blur !== 0) {
            parts.push(`blur(${filters.blur}px)`);
        }
        
        return parts.length > 0 ? parts.join(' ') : 'none';
    }

    /**
     * Check if filters have any temperature/tint values (needs SVG filter)
     * @param {Object} filters
     * @returns {boolean}
     */
    static needsSvgFilter(filters) {
        if (!filters) return false;
        return (filters.temperature !== undefined && filters.temperature !== 0) ||
               (filters.tint !== undefined && filters.tint !== 0) ||
               (filters.highlights !== undefined && filters.highlights !== 0) ||
               (filters.shadows !== undefined && filters.shadows !== 0);
    }

    /**
     * Build SVG filter for temperature and tint
     * Uses feColorMatrix with color transformation matrix
     * 
     * @param {Object} filters - Filter properties
     * @param {string} id - Unique filter ID
     * @returns {string} - SVG filter element markup
     */
    static buildTemperatureTintFilter(filters, id) {
        const temperature = filters.temperature || 0;
        const tint = filters.tint || 0;
        
        // Temperature affects R-B balance (warm = more R, cool = more B)
        // Tint affects G-M balance (green = more G, magenta = less G)
        
        // Normalize to 0-1 range for matrix
        const tempFactor = temperature / 100;
        const tintFactor = tint / 100;
        
        // Color matrix for temperature/tint
        // [R, 0, 0, 0, offset]
        // [0, G, 0, 0, offset]  
        // [0, 0, B, 0, offset]
        // [0, 0, 0, 1, 0]
        
        // Temperature: warm adds R and subtracts B
        const rMult = 1 + (tempFactor * 0.3);
        const bMult = 1 - (tempFactor * 0.3);
        
        // Tint: positive adds G, negative subtracts
        const gMult = 1 + (tintFactor * 0.2);
        
        const matrix = [
            rMult, 0, 0, 0, 0,
            0, gMult, 0, 0, 0,
            0, 0, bMult, 0, 0,
            0, 0, 0, 1, 0
        ].join(' ');
        
        return `
            <filter id="${id}" color-interpolation-filters="sRGB">
                <feColorMatrix type="matrix" values="${matrix}" />
            </filter>
        `;
    }

    /**
     * Build SVG filter for highlights and shadows adjustment
     * Uses feComponentTransfer with gamma curves
     * 
     * @param {Object} filters - Filter properties
     * @param {string} id - Unique filter ID
     * @returns {string} - SVG filter element markup
     */
    static buildHighlightsShadowsFilter(filters, id) {
        const highlights = filters.highlights || 0;
        const shadows = filters.shadows || 0;
        
        // Highlights affects bright areas (gamma > 1 darkens, < 1 brightens)
        // Shadows affects dark areas
        
        // Using gamma function: output = input^gamma
        // gamma < 1 = brighter, gamma > 1 = darker
        
        // For highlights: affect high values more
        // For shadows: affect low values more
        
        // This is simplified - real implementation would use more complex curves
        const highlightGamma = 1 - (highlights / 200);  // Range: 0.5 to 1.5
        const shadowAmplitude = 1 + (shadows / 100);    // Range: 0 to 2
        
        return `
            <filter id="${id}" color-interpolation-filters="sRGB">
                <feComponentTransfer>
                    <feFuncR type="gamma" amplitude="${shadowAmplitude}" exponent="${highlightGamma}" offset="0"/>
                    <feFuncG type="gamma" amplitude="${shadowAmplitude}" exponent="${highlightGamma}" offset="0"/>
                    <feFuncB type="gamma" amplitude="${shadowAmplitude}" exponent="${highlightGamma}" offset="0"/>
                </feComponentTransfer>
            </filter>
        `;
    }

    /**
     * Build combined SVG filter with all advanced adjustments
     * @param {Object} filters - Filter properties
     * @param {string} id - Unique filter ID
     * @returns {string} - Complete SVG filter element
     */
    static buildAdvancedFilter(filters, id) {
        const temperature = filters.temperature || 0;
        const tint = filters.tint || 0;
        const highlights = filters.highlights || 0;
        const shadows = filters.shadows || 0;
        
        // Skip if no advanced filters needed
        if (temperature === 0 && tint === 0 && highlights === 0 && shadows === 0) {
            return '';
        }
        
        // Build filter chain
        const filterParts = [];
        let lastResult = 'SourceGraphic';
        
        // Temperature/Tint color matrix
        if (temperature !== 0 || tint !== 0) {
            const tempFactor = temperature / 100;
            const tintFactor = tint / 100;
            
            const rMult = 1 + (tempFactor * 0.3);
            const bMult = 1 - (tempFactor * 0.3);
            const gMult = 1 + (tintFactor * 0.2);
            
            const matrix = [
                rMult, 0, 0, 0, 0,
                0, gMult, 0, 0, 0,
                0, 0, bMult, 0, 0,
                0, 0, 0, 1, 0
            ].join(' ');
            
            filterParts.push(`
                <feColorMatrix in="${lastResult}" result="tempTint" type="matrix" values="${matrix}" />
            `);
            lastResult = 'tempTint';
        }
        
        // Highlights/Shadows gamma curves
        if (highlights !== 0 || shadows !== 0) {
            const highlightGamma = 1 - (highlights / 200);
            const shadowAmplitude = 1 + (shadows / 100);
            
            filterParts.push(`
                <feComponentTransfer in="${lastResult}" result="highlightsShadows">
                    <feFuncR type="gamma" amplitude="${shadowAmplitude}" exponent="${highlightGamma}" offset="0"/>
                    <feFuncG type="gamma" amplitude="${shadowAmplitude}" exponent="${highlightGamma}" offset="0"/>
                    <feFuncB type="gamma" amplitude="${shadowAmplitude}" exponent="${highlightGamma}" offset="0"/>
                </feComponentTransfer>
            `);
            lastResult = 'highlightsShadows';
        }
        
        return `
            <filter id="${id}" color-interpolation-filters="sRGB">
                ${filterParts.join('\n')}
            </filter>
        `;
    }

    /**
     * Get the complete filter value for an element
     * Combines CSS filters with SVG filter reference if needed
     * 
     * @param {Object} filters - Filter properties
     * @param {string} elementId - Element ID for unique SVG filter ID
     * @returns {{cssFilter: string, svgFilter: string, filterValue: string}}
     */
    static getFilterStyle(filters, elementId) {
        const cssFilter = this.buildCssFilter(filters);
        const needsSvg = this.needsSvgFilter(filters);
        
        let svgFilter = '';
        let filterValue = cssFilter;
        
        if (needsSvg) {
            const svgId = `media-filter-${elementId}`;
            svgFilter = this.buildAdvancedFilter(filters, svgId);
            
            // Prepend SVG filter reference to CSS filters
            if (cssFilter === 'none') {
                filterValue = `url(#${svgId})`;
            } else {
                filterValue = `url(#${svgId}) ${cssFilter}`;
            }
        }
        
        return { cssFilter, svgFilter, filterValue };
    }

    /**
     * Reset all filters to default values
     * @returns {Object}
     */
    static getDefaultFilters() {
        return {
            exposure: 0,
            contrast: 0,
            saturation: 0,
            temperature: 0,
            tint: 0,
            highlights: 0,
            shadows: 0,
            blur: 0,
            hueRotate: 0,
            invert: 0,
            sepia: 0,
            grayscale: 0
        };
    }

    /**
     * Check if filters are at default values
     * @param {Object} filters
     * @returns {boolean}
     */
    static isDefault(filters) {
        if (!filters) return true;
        
        const defaults = this.getDefaultFilters();
        for (const key of Object.keys(defaults)) {
            if (filters[key] !== undefined && filters[key] !== defaults[key]) {
                return false;
            }
        }
        return true;
    }

    /**
     * Clamp filter value to valid range
     * @param {string} property - Filter property name
     * @param {number} value - Value to clamp
     * @returns {number}
     */
    static clampValue(property, value) {
        const ranges = {
            exposure: [-100, 100],
            contrast: [-100, 100],
            saturation: [-100, 100],
            temperature: [-100, 100],
            tint: [-100, 100],
            highlights: [-100, 100],
            shadows: [-100, 100],
            blur: [0, 100],
            hueRotate: [0, 360],
            invert: [0, 100],
            sepia: [0, 100],
            grayscale: [0, 100]
        };
        
        const [min, max] = ranges[property] || [-100, 100];
        return Math.max(min, Math.min(max, value));
    }
}
