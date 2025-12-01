/**
 * PropertyMemoryManager
 * 
 * Manages property memory for fills, typography, and effects.
 * Memory is READ FROM selection (not applied TO objects).
 * Memory updates only when panels are opened.
 * 
 * @see documentation/specs/core/property-memory-system.md
 */

// Storage key prefix
const STORAGE_PREFIX = 'story.memory';

// Memory version for future migrations
const MEMORY_VERSION = 1;

/**
 * Default values for each memory type
 */
const DEFAULTS = {
    'fill.object': {
        solid: { color: '#000000', opacity: 100 },
        gradient: {
            type: 'linear',
            angle: 90,
            stops: [
                { color: '#000000', position: 0 },
                { color: '#FFFFFF', position: 100 }
            ]
        },
        codeFill: { code: '', presetId: null },
        lastActiveMode: 'solid'
    },
    'fill.slide': {
        solid: { color: '#FFFFFF', opacity: 100 },
        gradient: {
            type: 'linear',
            angle: 180,
            stops: [
                { color: '#000000', position: 0 },
                { color: '#FFFFFF', position: 100 }
            ]
        },
        codeFill: { code: '', presetId: null },
        lastActiveMode: 'solid'
    },
    'fill.text': {
        solid: { color: '#000000', opacity: 100 },
        gradient: {
            type: 'linear',
            angle: 90,
            stops: [
                { color: '#000000', position: 0 },
                { color: '#FFFFFF', position: 100 }
            ]
        },
        codeFill: { code: '', presetId: null },
        lastActiveMode: 'solid'
    },
    'stroke.object': {
        solid: { color: '#000000', opacity: 100 },
        gradient: {
            type: 'linear',
            angle: 90,
            stops: [
                { color: '#000000', position: 0 },
                { color: '#FFFFFF', position: 100 }
            ]
        },
        lastActiveMode: 'solid'
    },
    'effect.dropShadow': {
        x: 0,
        y: 4,
        blur: 8,
        spread: 0,
        color: '#000000',
        opacity: 25
    },
    'effect.innerShadow': {
        x: 0,
        y: 2,
        blur: 4,
        spread: 0,
        color: '#000000',
        opacity: 25
    },
    'typography': {
        fontFamily: 'Inter',
        fontWeight: 400,
        fontStyle: 'normal',
        textAlign: 'left',
        verticalAlign: 'top'
    }
};

/**
 * Keys that should persist to localStorage (vs session-only)
 */
const PERSISTENT_KEYS = [
    'fill.object',
    'fill.slide', 
    'fill.text',
    'stroke.object',
    'effect.dropShadow',
    'effect.innerShadow',
    'typography'
];

/**
 * For fill memory: which modes persist across sessions
 */
const PERSISTENT_FILL_MODES = ['solid', 'gradient', 'codeFill'];

class PropertyMemoryManager {
    constructor() {
        /** @type {Map<string, any>} Session memory (in-memory only) */
        this.sessionMemory = new Map();
        
        // Load persistent memory on init
        this._loadPersistentMemory();
    }

    /**
     * Get memory for a context key
     * Session memory takes precedence over persistent memory
     * @param {string} contextKey - e.g., 'fill.object', 'typography'
     * @returns {any|null}
     */
    getMemory(contextKey) {
        // Session memory first
        if (this.sessionMemory.has(contextKey)) {
            return this.sessionMemory.get(contextKey);
        }
        
        // Then persistent memory
        const persistent = this._loadFromStorage(contextKey);
        if (persistent) {
            return persistent;
        }
        
        // Finally, defaults
        return this._getDefaults(contextKey);
    }

    /**
     * Set session memory for a context key
     * @param {string} contextKey
     * @param {any} value
     */
    setSessionMemory(contextKey, value) {
        this.sessionMemory.set(contextKey, value);
    }

    /**
     * Clear session memory for a context key
     * @param {string} contextKey
     */
    clearSessionMemory(contextKey) {
        this.sessionMemory.delete(contextKey);
    }

    /**
     * Update memory from a selected object's fill
     * This is the PRIMARY way memory is updated - from selection, not to selection
     * @param {string} contextKey - e.g., 'fill.object'
     * @param {Object} fill - The fill object from the selected element
     */
    updateFromSelection(contextKey, fill) {
        if (!fill) return;
        
        const current = this.getMemory(contextKey) || this._getDefaults(contextKey);
        const updated = { ...current };
        
        // Update the appropriate mode based on fill type
        const fillType = fill.type || 'solid';
        updated.lastActiveMode = fillType;
        
        if (fillType === 'solid') {
            updated.solid = {
                color: fill.color || fill.value || '#000000',
                opacity: fill.opacity !== undefined ? fill.opacity : 100
            };
        } else if (fillType === 'gradient') {
            if (fill.value && typeof fill.value === 'object') {
                updated.gradient = {
                    type: fill.value.type || 'linear',
                    angle: fill.value.angle || 90,
                    stops: fill.value.stops ? [...fill.value.stops] : updated.gradient?.stops || []
                };
            }
        } else if (fillType === 'code') {
            updated.codeFill = {
                code: fill.code || fill.value || '',
                presetId: fill.presetId || null
            };
        }
        // Note: image and video are NOT persisted to memory
        
        this.setSessionMemory(contextKey, updated);
    }

    /**
     * Update memory from typography properties
     * @param {string} contextKey - e.g., 'typography'
     * @param {Object} typography - Typography properties from selected element
     */
    updateTypographyFromSelection(contextKey, typography) {
        if (!typography) return;
        
        const current = this.getMemory(contextKey) || this._getDefaults(contextKey);
        const updated = { ...current };
        
        // Only update properties that are defined
        if (typography.fontFamily) updated.fontFamily = typography.fontFamily;
        if (typography.fontWeight) updated.fontWeight = typography.fontWeight;
        if (typography.fontStyle) updated.fontStyle = typography.fontStyle;
        if (typography.textAlign) updated.textAlign = typography.textAlign;
        if (typography.verticalAlign) updated.verticalAlign = typography.verticalAlign;
        
        this.setSessionMemory(contextKey, updated);
    }

    /**
     * Update memory from effect properties
     * @param {string} contextKey - e.g., 'effect.dropShadow'
     * @param {Object} effect - Effect properties from selected element
     */
    updateEffectFromSelection(contextKey, effect) {
        if (!effect) return;
        
        const current = this.getMemory(contextKey) || this._getDefaults(contextKey);
        const updated = { ...current, ...effect };
        
        this.setSessionMemory(contextKey, updated);
    }

    /**
     * Get fill defaults for creating a new fill
     * Used when adding a new fill to an object with no existing fill
     * @param {string} contextKey
     * @param {string} mode - 'solid', 'gradient', 'code', etc.
     * @returns {Object}
     */
    getFillDefaults(contextKey, mode = 'solid') {
        const memory = this.getMemory(contextKey);
        
        if (mode === 'solid') {
            return {
                type: 'solid',
                color: memory?.solid?.color || '#000000',
                opacity: memory?.solid?.opacity || 100,
                value: memory?.solid?.color || '#000000'
            };
        } else if (mode === 'gradient') {
            const grad = memory?.gradient || DEFAULTS[contextKey]?.gradient;
            return {
                type: 'gradient',
                value: grad ? { ...grad, stops: [...grad.stops] } : null
            };
        } else if (mode === 'code') {
            return {
                type: 'code',
                code: memory?.codeFill?.code || '',
                presetId: memory?.codeFill?.presetId || null
            };
        }
        
        return { type: mode };
    }

    /**
     * Called when a flyout/panel closes - persist appropriate data
     * @param {string} contextKey
     */
    onPanelClose(contextKey) {
        if (!PERSISTENT_KEYS.includes(contextKey)) return;
        
        const memory = this.sessionMemory.get(contextKey);
        if (!memory) return;
        
        // For fill contexts, only persist certain modes
        if (contextKey.startsWith('fill.') || contextKey.startsWith('stroke.')) {
            this._persistFillMemory(contextKey, memory);
        } else {
            // For typography/effects, persist everything
            this._saveToStorage(contextKey, memory);
        }
    }

    /**
     * Persist fill memory - only solid, gradient, and code
     * @private
     */
    _persistFillMemory(contextKey, memory) {
        const persistedData = {
            solid: memory.solid,
            gradient: memory.gradient,
            codeFill: memory.codeFill,
            lastActiveMode: PERSISTENT_FILL_MODES.includes(memory.lastActiveMode) 
                ? memory.lastActiveMode 
                : 'solid'
        };
        
        this._saveToStorage(contextKey, persistedData);
    }

    /**
     * Save to localStorage with version info
     * @private
     */
    _saveToStorage(contextKey, data) {
        try {
            const key = `${STORAGE_PREFIX}.${contextKey}`;
            const wrapper = {
                version: MEMORY_VERSION,
                data: data
            };
            localStorage.setItem(key, JSON.stringify(wrapper));
        } catch (e) {
            console.warn(`PropertyMemoryManager: Failed to save ${contextKey}`, e);
        }
    }

    /**
     * Load from localStorage with version check
     * @private
     */
    _loadFromStorage(contextKey) {
        try {
            const key = `${STORAGE_PREFIX}.${contextKey}`;
            const stored = localStorage.getItem(key);
            if (!stored) return null;
            
            const wrapper = JSON.parse(stored);
            
            // Version check for future migrations
            if (wrapper.version !== MEMORY_VERSION) {
                return this._migrateMemory(contextKey, wrapper.version, wrapper.data);
            }
            
            return wrapper.data;
        } catch (e) {
            console.warn(`PropertyMemoryManager: Failed to load ${contextKey}`, e);
            return null;
        }
    }

    /**
     * Migrate old memory formats
     * @private
     */
    _migrateMemory(contextKey, fromVersion, data) {
        // Future: handle migrations here
        // For now, just return the data as-is
        return data;
    }

    /**
     * Get default values for a context key
     * @private
     */
    _getDefaults(contextKey) {
        if (DEFAULTS[contextKey]) {
            return JSON.parse(JSON.stringify(DEFAULTS[contextKey]));
        }
        
        // Generic fill default for unknown contexts
        if (contextKey.startsWith('fill.') || contextKey.startsWith('stroke.')) {
            return JSON.parse(JSON.stringify(DEFAULTS['fill.object']));
        }
        
        return null;
    }

    /**
     * Load all persistent memory on init
     * @private
     */
    _loadPersistentMemory() {
        for (const key of PERSISTENT_KEYS) {
            const data = this._loadFromStorage(key);
            if (data) {
                this.sessionMemory.set(key, data);
            }
        }
    }

    /**
     * Clear all memory (for testing or reset)
     */
    clearAll() {
        this.sessionMemory.clear();
        for (const key of PERSISTENT_KEYS) {
            try {
                localStorage.removeItem(`${STORAGE_PREFIX}.${key}`);
            } catch (e) {
                // Ignore
            }
        }
    }
}

// Export singleton instance
export const propertyMemory = new PropertyMemoryManager();
