/**
 * SelectionUtils - Utility functions for multi-selection value handling
 * 
 * Provides helpers for detecting mixed values when multiple elements are selected,
 * and for applying changes to all selected elements consistently.
 * 
 * @module SelectionUtils
 */

/**
 * Check if all selected elements have the same value for a property.
 * Returns the common value or indicates mixed state.
 * 
 * @param {Array} elements - Array of element objects
 * @param {string} property - Property name to check (supports dot notation: 'fill.color')
 * @returns {{ value: any, mixed: boolean }} - The value if uniform, or mixed=true if values differ
 * 
 * @example
 * const result = getMixedValue(elements, 'x');
 * if (result.mixed) {
 *     xInput.setMixed(true);
 * } else {
 *     xInput.setValue(result.value);
 * }
 */
export function getMixedValue(elements, property) {
    if (!elements || elements.length === 0) {
        return { value: null, mixed: false };
    }

    if (elements.length === 1) {
        return { value: getNestedProperty(elements[0], property), mixed: false };
    }

    // Get values from all elements
    const values = elements.map(el => getNestedProperty(el, property));
    
    // Check if all values are the same
    const firstValue = values[0];
    const allSame = values.every(v => valuesEqual(v, firstValue));
    
    if (allSame) {
        return { value: firstValue, mixed: false };
    }
    
    return { value: null, mixed: true };
}

/**
 * Get a nested property value using dot notation.
 * @param {Object} obj - Object to get property from
 * @param {string} path - Property path (e.g., 'fill.color' or 'x')
 * @returns {any} - Property value or undefined
 */
function getNestedProperty(obj, path) {
    if (!obj || !path) return undefined;
    
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
        if (current === null || current === undefined) {
            return undefined;
        }
        current = current[part];
    }
    
    return current;
}

/**
 * Compare two values for equality (handles objects and arrays).
 * @param {any} a - First value
 * @param {any} b - Second value
 * @returns {boolean} - True if values are equal
 */
function valuesEqual(a, b) {
    // Handle null/undefined
    if (a === b) return true;
    if (a === null || b === null) return false;
    if (a === undefined || b === undefined) return false;
    
    // Handle objects/arrays (simple JSON comparison)
    if (typeof a === 'object' && typeof b === 'object') {
        return JSON.stringify(a) === JSON.stringify(b);
    }
    
    return a === b;
}

/**
 * Get unique values from multiple elements for a property.
 * Useful for showing "Mixed (3 values)" type labels.
 * 
 * @param {Array} elements - Array of element objects
 * @param {string} property - Property name to check
 * @returns {Array} - Array of unique values
 */
export function getUniqueValues(elements, property) {
    if (!elements || elements.length === 0) return [];
    
    const values = elements.map(el => getNestedProperty(el, property));
    const uniqueSet = new Set(values.map(v => JSON.stringify(v)));
    
    return Array.from(uniqueSet).map(v => JSON.parse(v));
}

/**
 * Calculate bounding box for multiple elements.
 * Returns the combined bounding box of all elements.
 * 
 * @param {Array} elements - Array of element objects with x, y, width, height
 * @returns {{ x: number, y: number, width: number, height: number, mixed: boolean }}
 */
export function getBoundingBox(elements) {
    if (!elements || elements.length === 0) {
        return { x: 0, y: 0, width: 0, height: 0, mixed: false };
    }

    if (elements.length === 1) {
        const el = elements[0];
        return {
            x: el.x || 0,
            y: el.y || 0,
            width: el.width || 0,
            height: el.height || 0,
            mixed: false
        };
    }

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    elements.forEach(el => {
        const x = el.x || 0;
        const y = el.y || 0;
        const w = el.width || 0;
        const h = el.height || 0;

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + w);
        maxY = Math.max(maxY, y + h);
    });

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        mixed: true  // Indicates multiple elements
    };
}
