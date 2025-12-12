/**
 * LinkedPropertyManager.js
 * 
 * Core service for managing linked properties between elements and design system slots.
 * Handles color theme slot bindings and typography style bindings.
 * 
 * Properties can be either:
 * - Hardcoded: { color: "#FF5500" }
 * - Linked: { themeSlot: "accent1" } - value derived from theme at render time
 */

import { store } from '../Store.js';
import { EventEmitter } from '../Events.js';

/**
 * Color slot definitions matching the design system
 */
export const COLOR_SLOTS = {
    background1: { id: 'background1', name: 'Background 1', description: 'Primary background' },
    background2: { id: 'background2', name: 'Background 2', description: 'Secondary background' },
    text1: { id: 'text1', name: 'Text Primary', description: 'Main text color' },
    text2: { id: 'text2', name: 'Text Secondary', description: 'Secondary text color' },
    accent1: { id: 'accent1', name: 'Accent 1', description: 'Primary accent' },
    accent2: { id: 'accent2', name: 'Accent 2', description: 'Secondary accent' },
    accent3: { id: 'accent3', name: 'Accent 3', description: 'Tertiary accent' },
    accent4: { id: 'accent4', name: 'Accent 4', description: 'Fourth accent' },
    accent5: { id: 'accent5', name: 'Accent 5', description: 'Fifth accent' },
    accent6: { id: 'accent6', name: 'Accent 6', description: 'Sixth accent' },
    hyperlink: { id: 'hyperlink', name: 'Hyperlink', description: 'Link color' },
    followedHyperlink: { id: 'followedHyperlink', name: 'Visited Link', description: 'Visited link color' }
};

/**
 * Typography style definitions
 */
export const TYPOGRAPHY_STYLES = {
    display: { id: 'display', name: 'Display' },
    title: { id: 'title', name: 'Title' },
    subtitle: { id: 'subtitle', name: 'Subtitle' },
    heading1: { id: 'heading1', name: 'Heading 1' },
    heading2: { id: 'heading2', name: 'Heading 2' },
    heading3: { id: 'heading3', name: 'Heading 3' },
    body: { id: 'body', name: 'Body' },
    bodyLarge: { id: 'bodyLarge', name: 'Body Large' },
    bodySmall: { id: 'bodySmall', name: 'Body Small' },
    caption: { id: 'caption', name: 'Caption' },
    label: { id: 'label', name: 'Label' }
};

class LinkedPropertyManager extends EventEmitter {
    constructor() {
        super();
        
        // Index: slotId -> Set<elementId> for efficient propagation
        this.colorSlotIndex = new Map();
        
        // Index: styleId -> Set<elementId> for typography propagation
        this.styleIndex = new Map();
        
        // Initialize indexes
        Object.keys(COLOR_SLOTS).forEach(slot => {
            this.colorSlotIndex.set(slot, new Set());
        });
        
        Object.keys(TYPOGRAPHY_STYLES).forEach(style => {
            this.styleIndex.set(style, new Set());
        });
        
        // Listen for state changes to rebuild indexes
        if (store.on) {
            store.on('state-changed', () => this.onStateChanged());
            store.on('presentation-loaded', () => this.rebuildIndexes());
        }
    }

    // ========================================
    // COLOR SLOT LINKING
    // ========================================

    /**
     * Check if a fill property is linked to a theme slot
     * @param {Object} fill - The fill object
     * @returns {boolean}
     */
    isColorLinked(fill) {
        return fill && typeof fill === 'object' && !!fill.themeSlot;
    }

    /**
     * Get the theme slot ID from a fill
     * @param {Object} fill - The fill object
     * @returns {string|null} - The slot ID or null
     */
    getColorSlot(fill) {
        if (!this.isColorLinked(fill)) return null;
        return fill.themeSlot;
    }

    /**
     * Get the slot display name
     * @param {string} slotId - The slot ID
     * @returns {string}
     */
    getSlotDisplayName(slotId) {
        return COLOR_SLOTS[slotId]?.name || slotId;
    }

    /**
     * Resolve a fill's color value (handles both linked and hardcoded)
     * @param {Object} fill - The fill object
     * @param {Object} themeColors - The theme colors object
     * @returns {string} - The resolved color hex value
     */
    resolveColor(fill, themeColors) {
        if (!fill) return '#000000';
        
        if (fill.themeSlot && themeColors) {
            return themeColors[fill.themeSlot] || fill.color || '#000000';
        }
        
        return fill.color || fill.value || '#000000';
    }

    /**
     * Create a linked fill object that references a theme slot
     * @param {string} slotId - The theme slot ID
     * @param {Object} options - Additional options (opacity, blendMode, etc.)
     * @returns {Object} - The linked fill object
     */
    createLinkedFill(slotId, options = {}) {
        return {
            type: 'solid',
            themeSlot: slotId,
            opacity: options.opacity !== undefined ? options.opacity : 100,
            visible: options.visible !== undefined ? options.visible : true,
            blendMode: options.blendMode || 'normal'
        };
    }

    /**
     * Convert a linked fill to a hardcoded fill (detach)
     * @param {Object} fill - The linked fill object
     * @param {Object} themeColors - The theme colors for resolving
     * @returns {Object} - The detached (hardcoded) fill object
     */
    detachColor(fill, themeColors) {
        if (!this.isColorLinked(fill)) return fill;
        
        const resolvedColor = this.resolveColor(fill, themeColors);
        
        return {
            ...fill,
            themeSlot: undefined,
            color: resolvedColor,
            value: resolvedColor
        };
    }

    // ========================================
    // TYPOGRAPHY STYLE LINKING
    // ========================================

    /**
     * Check if a text element is linked to a typography style
     * @param {Object} element - The text element
     * @returns {boolean}
     */
    isStyleLinked(element) {
        return element && !!element.styleId;
    }

    /**
     * Get the style ID from a text element
     * @param {Object} element - The text element
     * @returns {string|null}
     */
    getStyleId(element) {
        if (!this.isStyleLinked(element)) return null;
        return element.styleId;
    }

    /**
     * Get the style display name
     * @param {string} styleId - The style ID
     * @returns {string}
     */
    getStyleDisplayName(styleId) {
        return TYPOGRAPHY_STYLES[styleId]?.name || styleId;
    }

    /**
     * Check if an element has style overrides
     * @param {Object} element - The text element
     * @returns {boolean}
     */
    hasStyleOverrides(element) {
        return element && element.overrides && Object.keys(element.overrides).length > 0;
    }

    /**
     * Get the list of overridden properties
     * @param {Object} element - The text element
     * @returns {string[]}
     */
    getOverriddenProperties(element) {
        if (!element?.overrides) return [];
        return Object.keys(element.overrides);
    }

    /**
     * Check if a specific property is overridden
     * @param {Object} element - The text element
     * @param {string} property - The property name
     * @returns {boolean}
     */
    isPropertyOverridden(element, property) {
        return element?.overrides && property in element.overrides;
    }

    /**
     * Resolve typography properties for an element
     * @param {Object} element - The text element
     * @param {Object} textStyles - The theme text styles
     * @param {Object} themeFonts - The theme fonts (heading/body)
     * @param {Object} themeColors - The theme colors (for text color)
     * @returns {Object} - Resolved typography properties
     */
    resolveTypography(element, textStyles, themeFonts, themeColors) {
        if (!element.styleId || !textStyles?.[element.styleId]) {
            // No linked style, return element's own properties
            return {
                fontFamily: element.style?.fontFamily || 'Inter',
                fontSize: element.style?.fontSize || 20,
                fontWeight: element.style?.fontWeight || '400',
                lineHeight: element.style?.lineHeight || 1.5,
                letterSpacing: element.style?.letterSpacing || '0%',
                textTransform: element.style?.textTransform || 'none',
                color: element.style?.color || 'var(--theme-text-primary)'
            };
        }

        const baseStyle = textStyles[element.styleId];
        const resolved = { ...baseStyle };

        // Apply overrides
        if (element.overrides) {
            Object.assign(resolved, element.overrides);
        }

        // Resolve font family from theme fonts
        if (resolved.fontFamily === 'var(--theme-font-heading)' && themeFonts?.heading) {
            resolved.fontFamily = themeFonts.heading;
        } else if (resolved.fontFamily === 'var(--theme-font-body)' && themeFonts?.body) {
            resolved.fontFamily = themeFonts.body;
        }

        return resolved;
    }

    /**
     * Create a style override for an element
     * @param {Object} element - The text element
     * @param {string} property - The property to override
     * @param {any} value - The override value
     * @returns {Object} - Updated overrides object
     */
    createOverride(element, property, value) {
        return {
            ...element.overrides,
            [property]: value
        };
    }

    /**
     * Remove a style override
     * @param {Object} element - The text element
     * @param {string} property - The property to remove override for
     * @returns {Object} - Updated overrides object
     */
    removeOverride(element, property) {
        const overrides = { ...element.overrides };
        delete overrides[property];
        return overrides;
    }

    /**
     * Clear all style overrides (reset to style)
     * @param {Object} element - The text element
     * @returns {Object} - Empty overrides object
     */
    clearOverrides(element) {
        return {};
    }

    /**
     * Detach from typography style (convert to hardcoded)
     * @param {Object} element - The text element
     * @param {Object} textStyles - Theme text styles for resolving
     * @param {Object} themeFonts - Theme fonts for resolving
     * @param {Object} themeColors - Theme colors for resolving
     * @returns {Object} - Updated element properties
     */
    detachStyle(element, textStyles, themeFonts, themeColors) {
        const resolved = this.resolveTypography(element, textStyles, themeFonts, themeColors);
        
        return {
            styleId: null,
            overrides: {},
            style: {
                ...element.style,
                fontFamily: resolved.fontFamily,
                fontSize: resolved.fontSize,
                fontWeight: resolved.fontWeight,
                lineHeight: resolved.lineHeight,
                letterSpacing: resolved.letterSpacing,
                textTransform: resolved.textTransform,
                color: resolved.color
            }
        };
    }

    // ========================================
    // INDEX MANAGEMENT
    // ========================================

    /**
     * Register an element's use of a color slot
     */
    registerColorSlot(slotId, elementId) {
        if (!this.colorSlotIndex.has(slotId)) {
            this.colorSlotIndex.set(slotId, new Set());
        }
        this.colorSlotIndex.get(slotId).add(elementId);
    }

    /**
     * Unregister an element from a color slot
     */
    unregisterColorSlot(slotId, elementId) {
        if (this.colorSlotIndex.has(slotId)) {
            this.colorSlotIndex.get(slotId).delete(elementId);
        }
    }

    /**
     * Get all elements using a specific color slot
     */
    getElementsUsingSlot(slotId) {
        return this.colorSlotIndex.get(slotId) || new Set();
    }

    /**
     * Register an element's use of a typography style
     */
    registerStyle(styleId, elementId) {
        if (!this.styleIndex.has(styleId)) {
            this.styleIndex.set(styleId, new Set());
        }
        this.styleIndex.get(styleId).add(elementId);
    }

    /**
     * Unregister an element from a typography style
     */
    unregisterStyle(styleId, elementId) {
        if (this.styleIndex.has(styleId)) {
            this.styleIndex.get(styleId).delete(elementId);
        }
    }

    /**
     * Get all elements using a specific typography style
     */
    getElementsUsingStyle(styleId) {
        return this.styleIndex.get(styleId) || new Set();
    }

    /**
     * Rebuild all indexes from current state
     */
    rebuildIndexes() {
        // Clear existing indexes
        this.colorSlotIndex.forEach(set => set.clear());
        this.styleIndex.forEach(set => set.clear());

        const state = store.getState();
        
        // Index all slides
        Object.values(state.slides || {}).forEach(slide => {
            this.indexSlideElements(slide);
        });
        
        // Index all masters
        Object.values(state.slideMasterPresets || {}).forEach(master => {
            this.indexSlideElements(master);
        });
    }

    /**
     * Index elements in a slide/master
     */
    indexSlideElements(container) {
        if (!container?.elements) return;
        
        Object.values(container.elements).forEach(element => {
            // Index color slots from fills
            const fills = element.style?.fills || [];
            fills.forEach(fill => {
                if (fill.themeSlot) {
                    this.registerColorSlot(fill.themeSlot, element.id);
                }
            });
            
            // Index text fill color
            if (element.style?.textFill?.themeSlot) {
                this.registerColorSlot(element.style.textFill.themeSlot, element.id);
            }
            
            // Index stroke color
            if (element.style?.stroke?.themeSlot) {
                this.registerColorSlot(element.style.stroke.themeSlot, element.id);
            }
            
            // Index typography style
            if (element.styleId) {
                this.registerStyle(element.styleId, element.id);
            }
        });
    }

    /**
     * Handle state changes for index updates
     */
    onStateChanged() {
        // For now, we'll rebuild indexes on demand
        // In production, we'd do incremental updates based on the action type
    }

    // ========================================
    // THEME COLORS HELPER
    // ========================================

    /**
     * Get the current theme colors from state
     * @returns {Object} Theme colors object
     */
    getThemeColors() {
        const state = store.getState();
        const activeSlideId = state.editor?.activeSlideId;

        const resolveThemeId = () => {
            const slide = activeSlideId ? state.slides?.[activeSlideId] : null;
            if (slide) {
                const slideThemeId = slide.styleAssignments?.colorTheme || slide.colorThemeId;
                if (slideThemeId) return slideThemeId;

                const layout = slide.layoutId ? state.slideMasterPresets?.[slide.layoutId] : null;
                const layoutThemeId = layout?.styleAssignments?.colorTheme || layout?.colorThemeId;
                if (layoutThemeId) return layoutThemeId;

                const master = layout?.parentMasterId ? state.slideMasterPresets?.[layout.parentMasterId] : null;
                const masterThemeId = master?.styleAssignments?.colorTheme || master?.colorThemeId;
                if (masterThemeId) return masterThemeId;
            }

            const themeMaster = Object.values(state.slideMasterPresets || {}).find(m => m.type === 'slideMasterPreset');
            return themeMaster?.styleAssignments?.colorTheme || themeMaster?.colorThemeId || 'color-theme-default';
        };

        const themeId = resolveThemeId();
        const preset = state.colorThemePresets?.[themeId];
        if (preset?.colors) return preset.colors;
        if (preset?.lumaTheme?.resolvedColors && Array.isArray(preset.lumaTheme.resolvedColors)) {
            const order = ['background1','background2','text1','text2','accent1','accent2','accent3','accent4','accent5','accent6','hyperlink','followedHyperlink'];
            const obj = {};
            order.forEach((key, index) => {
                if (preset.lumaTheme.resolvedColors[index]) obj[key] = preset.lumaTheme.resolvedColors[index];
            });
            return obj;
        }
        return {};
    }

    /**
     * Get the current typography styles from state
     * @returns {Object} Text styles object
     */
    getTypographyStyles() {
        const state = store.getState();
        const activeSlideId = state.editor?.activeSlideId;

        const resolveTypographyId = () => {
            const slide = activeSlideId ? state.slides?.[activeSlideId] : null;
            if (slide) {
                const slideId = slide.styleAssignments?.typographyStyle || slide.typographyStyleId;
                if (slideId) return slideId;

                const layout = slide.layoutId ? state.slideMasterPresets?.[slide.layoutId] : null;
                const layoutId = layout?.styleAssignments?.typographyStyle || layout?.typographyStyleId;
                if (layoutId) return layoutId;

                const master = layout?.parentMasterId ? state.slideMasterPresets?.[layout.parentMasterId] : null;
                const masterId = master?.styleAssignments?.typographyStyle || master?.typographyStyleId;
                if (masterId) return masterId;
            }

            const themeMaster = Object.values(state.slideMasterPresets || {}).find(m => m.type === 'slideMasterPreset');
            return themeMaster?.styleAssignments?.typographyStyle || themeMaster?.typographyStyleId || 'typo-style-default';
        };

        const styleId = resolveTypographyId();
        const preset = state.typographyStylePresets?.[styleId];
        return preset?.textStyles || {};
    }

    /**
     * Get the current theme fonts
     * @returns {Object} { heading, body }
     */
    getThemeFonts() {
        const state = store.getState();
        const activeSlideId = state.editor?.activeSlideId;

        const resolveTypographyId = () => {
            const slide = activeSlideId ? state.slides?.[activeSlideId] : null;
            if (slide) {
                const slideId = slide.styleAssignments?.typographyStyle || slide.typographyStyleId;
                if (slideId) return slideId;

                const layout = slide.layoutId ? state.slideMasterPresets?.[slide.layoutId] : null;
                const layoutId = layout?.styleAssignments?.typographyStyle || layout?.typographyStyleId;
                if (layoutId) return layoutId;

                const master = layout?.parentMasterId ? state.slideMasterPresets?.[layout.parentMasterId] : null;
                const masterId = master?.styleAssignments?.typographyStyle || master?.typographyStyleId;
                if (masterId) return masterId;
            }

            const themeMaster = Object.values(state.slideMasterPresets || {}).find(m => m.type === 'slideMasterPreset');
            return themeMaster?.styleAssignments?.typographyStyle || themeMaster?.typographyStyleId || 'typo-style-default';
        };

        const styleId = resolveTypographyId();
        const preset = state.typographyStylePresets?.[styleId];
        return preset?.fonts || { heading: 'Inter', body: 'Inter' };
    }

    /**
     * Get all available color slots with their current values
     * @returns {Array<{id, name, color}>}
     */
    getColorSlotsWithValues() {
        const themeColors = this.getThemeColors();
        
        return Object.values(COLOR_SLOTS).map(slot => ({
            id: slot.id,
            name: slot.name,
            description: slot.description,
            color: themeColors[slot.id] || '#000000'
        }));
    }
}

// Export singleton instance
export const linkedPropertyManager = new LinkedPropertyManager();
export default linkedPropertyManager;
