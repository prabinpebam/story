import { getEffectiveSlotIndex, COLOR_MODES, generateThemeColors, DEFAULT_ADJUSTMENTS } from '../ui/panels/color-theme/ColorThemeUtils.js';
import { THEME_PRESETS, getPresetById } from '../ui/panels/color-theme/ThemePresets.js';
import { ThemeDiag } from './ThemeDiagnostics.js';

// Lazy import to avoid circular dependency with Store
// We access store through window global which is set after Store is initialized
function getStore() {
    return window._storyAppStore;
}

/**
 * StyleResolver - Resolves style tokens through the cascade hierarchy
 * 
 * This is the SINGLE SOURCE OF TRUTH for style resolution.
 * All UI components and renderers go through this service.
 * 
 * The cascade hierarchy: Master → Layout → Slide → Element
 * 
 * Designed to be reusable for both Color Themes and Typography Styles.
 */
export const StyleResolver = {

    // ============================================
    // CASCADING STYLE SYSTEM
    // ============================================

    /**
     * Get the effective color theme for a slide by walking up the hierarchy.
     * Hierarchy: Slide → Layout Master → Theme Master
     * 
     * @param {string} slideId - The slide ID to resolve theme for
     * @returns {{themeId: string|null, source: 'slide'|'layout'|'master', sourceId: string, sourceLabel: string}}
     */
    getEffectiveColorTheme(slideId) {
        const store = getStore();
        if (!store) {
            // Store not yet initialized
            return { themeId: null, source: 'master', sourceId: null, sourceLabel: 'master-default' };
        }
        const state = store.getState();
        const slide = state.slides?.[slideId];
        
        if (!slide) {
            // No slide found - return master default
            return this._getMasterThemeInfo(state);
        }
        
        // 1. Check slide's own colorThemeId
        if (slide.colorThemeId) {
            return {
                themeId: slide.colorThemeId,
                source: 'slide',
                sourceId: slideId,
                sourceLabel: 'slide-specific'
            };
        }
        
        // 2. Check layout master
        const layout = slide.layoutId ? state.slideMasterPresets?.[slide.layoutId] : null;
        if (layout?.colorThemeId) {
            return {
                themeId: layout.colorThemeId,
                source: 'layout',
                sourceId: layout.id,
                sourceLabel: `inherited from ${layout.name || 'Layout'}`
            };
        }
        
        // 3. Check theme master (parent of layout)
        const themeMaster = layout?.parentMasterId ? state.slideMasterPresets?.[layout.parentMasterId] : null;
        if (themeMaster?.colorThemeId) {
            return {
                themeId: themeMaster.colorThemeId,
                source: 'master',
                sourceId: themeMaster.id,
                sourceLabel: 'inherited from Master'
            };
        }
        
        // 4. Fallback: Find theme master with lumaTheme
        return this._getMasterThemeInfo(state);
    },
    
    /**
     * Get theme info from master level (fallback)
     * @private
     */
    _getMasterThemeInfo(state) {
        const themeMaster = Object.values(state.slideMasterPresets || {}).find(m => m.type === 'slideMasterPreset');
        const themeId = themeMaster?.colorThemeId || 
                       (themeMaster?.themeSettings?.lumaTheme ? 'default' : null);
        
        return {
            themeId,
            source: 'master',
            sourceId: themeMaster?.id || 'master-default',
            sourceLabel: 'inherited from Master'
        };
    },
    
    /**
     * Get the effective color mode (light/dark).
     * Color mode is only set at master level.
     * 
     * @returns {string} 'light' or 'dark'
     */
    getColorMode() {
        const store = getStore();
        if (!store) return COLOR_MODES.LIGHT;
        const state = store.getState();
        const themeMaster = Object.values(state.slideMasterPresets || {}).find(m => m.type === 'slideMasterPreset');
        
        // Check colorModeId first
        if (themeMaster?.colorModeId) {
            return themeMaster.colorModeId;
        }
        
        // Check referenced color theme (New Architecture)
        if (themeMaster?.colorThemeId) {
            const preset = state.colorThemePresets?.[themeMaster.colorThemeId];
            if (preset) {
                // Check lumaTheme specific mode
                if (preset.lumaTheme?.colorMode) {
                    return preset.lumaTheme.colorMode;
                }
                // Check standard isDark property
                return preset.isDark ? COLOR_MODES.DARK : COLOR_MODES.LIGHT;
            }
        }
        
        // Fallback to lumaTheme colorMode (Legacy)
        return themeMaster?.themeSettings?.lumaTheme?.colorMode || COLOR_MODES.LIGHT;
    },
    
    /**
     * Get the lumaTheme object for a given slide.
     * Resolves through the cascade hierarchy:
     * 1. If slide has colorThemeId, look up that theme
     * 2. If layout has colorThemeId, look up that theme
     * 3. Fall back to master's lumaTheme
     * 
     * @param {string} slideId - The slide ID (optional, uses active slide if not provided)
     * @returns {Object|null} The lumaTheme object
     */
    getLumaTheme(slideId = null) {
        const store = getStore();
        if (!store) return null;
        const state = store.getState();
        
        // If no slideId, try to get active slide
        if (!slideId) {
            slideId = state.editor?.activeSlideId;
        }
        
        // Get the theme master
        const themeMaster = Object.values(state.slideMasterPresets || {}).find(m => m.type === 'slideMasterPreset');
        
        // Resolve Master Luma Theme
        let masterLumaTheme = null;
        
        // 1. Try Reference (New Architecture)
        if (themeMaster?.colorThemeId) {
            const preset = state.colorThemePresets?.[themeMaster.colorThemeId];
            if (preset?.lumaTheme) {
                masterLumaTheme = preset.lumaTheme;
            }
        }
        
        // 2. Fallback to Embedded (Legacy)
        if (!masterLumaTheme) {
            masterLumaTheme = themeMaster?.themeSettings?.lumaTheme || null;
        }
        
        // If we have a slideId, check for slide-level override
        if (slideId) {
            const themeInfo = this.getEffectiveColorTheme(slideId);
            
            // If the slide or layout has a specific theme assigned, look it up
            if (themeInfo.themeId && themeInfo.source !== 'master') {
                // Try to find in state first
                const statePreset = state.colorThemePresets?.[themeInfo.themeId];
                if (statePreset?.lumaTheme) {
                    return statePreset.lumaTheme;
                }

                const resolvedTheme = this._lookupThemeById(themeInfo.themeId);
                if (resolvedTheme) {
                    return resolvedTheme;
                }
            }
        }
        
        // Fall back to master's lumaTheme
        return masterLumaTheme;
    },
    
    /**
     * Look up a theme by ID from presets or custom themes.
     * Converts theme slot data to lumaTheme format.
     * 
     * @param {string} themeId - The theme ID to look up
     * @returns {Object|null} The lumaTheme object or null
     * @private
     */
    _lookupThemeById(themeId) {
        if (!themeId) return null;
        
        // Check presets first
        const preset = getPresetById(themeId);
        if (preset) {
            return this._themeToLumaTheme(preset);
        }
        
        // Check custom themes from localStorage
        try {
            const customThemes = JSON.parse(localStorage.getItem('colorThemes') || '[]');
            const customTheme = customThemes.find(t => t.id === themeId);
            if (customTheme) {
                return this._themeToLumaTheme(customTheme);
            }
        } catch (e) {
            console.warn('[StyleResolver] Failed to load custom themes:', e);
        }
        
        return null;
    },
    
    /**
     * Convert a theme object (from presets/custom) to lumaTheme format.
     * 
     * @param {Object} theme - Theme object with slots and adjustments
     * @returns {Object} The lumaTheme object
     * @private
     */
    _themeToLumaTheme(theme) {
        if (!theme || !theme.slots) return null;
        
        const adjustments = theme.adjustments || DEFAULT_ADJUSTMENTS;
        const colors = generateThemeColors(theme.slots, adjustments);
        
        return {
            id: theme.id,
            name: theme.name,
            slots: theme.slots.map((slot, index) => ({
                h: slot.h,
                s: slot.s,
                hex: colors[index]
            })),
            adjustments,
            resolvedColors: colors,
            colorMode: COLOR_MODES.LIGHT // Default, will be overridden by master setting
        };
    },
    
    /**
     * Get full theme info for UI display (e.g., Fill Panel)
     * 
     * @param {string} slideId - The slide ID
     * @returns {{lumaTheme: Object, source: string, sourceId: string, sourceLabel: string, isInherited: boolean}}
     */
    getThemeInfoForSlide(slideId) {
        const themeInfo = this.getEffectiveColorTheme(slideId);
        const lumaTheme = this.getLumaTheme(slideId);
        const colorMode = this.getColorMode();
        
        const result = {
            lumaTheme,
            colorMode,
            source: themeInfo.source,
            sourceId: themeInfo.sourceId,
            sourceLabel: themeInfo.sourceLabel,
            isInherited: themeInfo.source !== 'slide'
        };
        
        // Diagnostic logging
        ThemeDiag.logStyleResolverCascade(slideId, result);
        
        return result;
    },
    
    /**
     * Get theme info for master mode (theme master or layout master).
     * This is used when editing in master mode to show the effective theme for that master.
     * 
     * @param {string} masterId - The master ID being edited
     * @returns {{lumaTheme: Object, source: string, sourceId: string, sourceLabel: string, isInherited: boolean}}
     */
    getThemeInfoForMaster(masterId) {
        const store = getStore();
        if (!store) {
            return { lumaTheme: null, source: 'master', sourceId: null, sourceLabel: 'Not available', isInherited: true };
        }
        const state = store.getState();
        const master = state.slideMasterPresets?.[masterId];
        
        if (!master) {
            return { lumaTheme: null, source: 'master', sourceId: null, sourceLabel: 'Master not found', isInherited: true };
        }
        
        const colorMode = this.getColorMode();
        
        if (master.type === 'slideMasterPreset') {
            // Theme master - show its lumaTheme directly
            const lumaTheme = master.themeSettings?.lumaTheme || null;
            return {
                lumaTheme,
                colorMode,
                source: 'master',
                sourceId: masterId,
                sourceLabel: master.name || 'Theme Master',
                isInherited: false
            };
        } else if (master.type === 'layoutMaster') {
            // Layout master - check for override, otherwise inherit from parent (theme master)
            if (master.colorThemeId) {
                // Layout has its own theme override
                const lumaTheme = this._lookupThemeById(master.colorThemeId);
                return {
                    lumaTheme,
                    colorMode,
                    source: 'layout',
                    sourceId: masterId,
                    sourceLabel: `${master.name || 'Layout'} (override)`,
                    isInherited: false
                };
            } else {
                // Layout inherits from parent theme master
                const parentMaster = master.parentMasterId ? state.slideMasterPresets?.[master.parentMasterId] : null;
                const lumaTheme = parentMaster?.themeSettings?.lumaTheme || null;
                return {
                    lumaTheme,
                    colorMode,
                    source: 'master',
                    sourceId: parentMaster?.id || 'theme-default',
                    sourceLabel: `Inherited from ${parentMaster?.name || 'Theme Master'}`,
                    isInherited: true
                };
            }
        }
        
        // Fallback
        return { lumaTheme: null, source: 'master', sourceId: null, sourceLabel: 'Unknown', isInherited: true };
    },
    
    /**
     * Get theme info based on current editor mode.
     * Automatically switches between slide and master context.
     * 
     * @returns {{lumaTheme: Object, source: string, sourceId: string, sourceLabel: string, isInherited: boolean}}
     */
    getThemeInfoForCurrentContext() {
        const store = getStore();
        if (!store) {
            return { lumaTheme: null, source: 'master', sourceId: null, sourceLabel: 'Not available', isInherited: true };
        }
        const state = store.getState();
        const mode = state.editor?.mode;
        
        if (mode === 'master') {
            // Master mode - use the active master
            const activeMasterId = state.editor?.activeMasterId;
            return this.getThemeInfoForMaster(activeMasterId);
        } else {
            // Edit mode - use the active slide
            const activeSlideId = state.editor?.activeSlideId;
            return this.getThemeInfoForSlide(activeSlideId);
        }
    },

    /**
     * Check if multiple slides have the same effective theme.
     * Used for multi-slide selection UI.
     * 
     * @param {string[]} slideIds - Array of slide IDs
     * @returns {{sameTheme: boolean, themeInfo: Object|null}}
     */
    checkThemeConsistency(slideIds) {
        if (!slideIds || slideIds.length === 0) {
            return { sameTheme: true, themeInfo: null };
        }
        
        const firstTheme = this.getEffectiveColorTheme(slideIds[0]);
        const firstLumaTheme = this.getLumaTheme(slideIds[0]);
        
        for (let i = 1; i < slideIds.length; i++) {
            const currentTheme = this.getEffectiveColorTheme(slideIds[i]);
            // Compare by source hierarchy, not just themeId
            // Different sources with same underlying theme is still consistent
            if (currentTheme.source !== firstTheme.source || 
                currentTheme.sourceId !== firstTheme.sourceId) {
                return { sameTheme: false, themeInfo: null };
            }
        }
        
        return { 
            sameTheme: true, 
            themeInfo: {
                ...firstTheme,
                lumaTheme: firstLumaTheme
            }
        };
    },

    // ============================================
    // SLOT RESOLUTION (with slide context)
    // ============================================

    /**
     * Resolves a theme slot index to an actual hex color value.
     * Uses the current theme's lumaTheme slots.
     * Respects dark mode by mapping slots through getEffectiveSlotIndex.
     * 
     * In light mode: slot N resolves to slot N
     * In dark mode: slot N resolves to slot (11 - N), swapping shadows↔highlights
     * 
     * @param {number} slotIndex - The 0-based slot index (0-11)
     * @param {string} fallback - Fallback color if slot not found
     * @param {string} slideId - Optional slide ID for context-aware resolution
     * @returns {string} The hex color value
     */
    resolveThemeSlot(slotIndex, fallback = '#000000', slideId = null) {
        if (slotIndex === undefined || slotIndex === null) return fallback;
        
        // Get the lumaTheme (currently at master level)
        const lumaTheme = this.getLumaTheme(slideId);
        
        // Get the color mode
        const colorMode = this.getColorMode();
        
        // Map the slot index based on color mode
        // In dark mode, this will flip shadow/highlight clusters
        const effectiveSlotIndex = getEffectiveSlotIndex(slotIndex, colorMode);
        
        if (lumaTheme?.slots?.[effectiveSlotIndex]) {
            return lumaTheme.slots[effectiveSlotIndex].hex || fallback;
        }
        
        // Try resolvedColors array as fallback
        if (lumaTheme?.resolvedColors?.[effectiveSlotIndex]) {
            return lumaTheme.resolvedColors[effectiveSlotIndex];
        }
        
        // Last resort: try CSS variable
        const slotNumber = effectiveSlotIndex + 1;
        const cssValue = getComputedStyle(document.documentElement)
            .getPropertyValue(`--theme-slot${slotNumber}`).trim();
        
        return cssValue || fallback;
    },

    /**
     * Resolves a fill object - returns fill with resolved value.
     * Handles both solid fills and gradient fills with theme slot references.
     * 
     * @param {Object} fill - The fill object
     * @param {string} slideId - Optional slide ID for context-aware resolution
     * @returns {Object} The fill object with resolved value
     */
    resolveFill(fill, slideId = null) {
        if (!fill) return null;
        
        // Theme-linked solid fill
        if (fill.type === 'solid' && fill.themeSlot !== null && fill.themeSlot !== undefined) {
            const resolvedColor = this.resolveThemeSlot(fill.themeSlot, fill.value, slideId);
            return {
                ...fill,
                value: resolvedColor,
                cssVar: `var(--theme-slot${fill.themeSlot + 1})`,
                // Preserve the themeSlot reference so we know it's theme-linked
                themeSlot: fill.themeSlot
            };
        }
        
        // Gradient fill - resolve each stop
        if (fill.type === 'gradient' && fill.stops) {
            const resolvedStops = fill.stops.map(stop => {
                if (stop.themeSlot !== null && stop.themeSlot !== undefined) {
                    const resolvedColor = this.resolveThemeSlot(stop.themeSlot, stop.color, slideId);
                    return {
                        ...stop,
                        color: resolvedColor,
                        themeSlot: stop.themeSlot
                    };
                }
                return stop;
            });
            return {
                ...fill,
                stops: resolvedStops
            };
        }
        
        // Custom fill - return as-is
        return fill;
    },

    /**
     * Resolves a textFill object that may contain a themeSlot reference.
     * Returns a fill object with the actual hex value resolved.
     * @param {Object} fill - The textFill object
     * @param {string} slideId - Optional slide ID for context-aware resolution
     * @returns {Object} The fill object with resolved value
     */
    resolveTextFill(fill, slideId = null) {
        if (!fill) return { type: 'solid', value: '#000000' };
        
        if (fill.type === 'solid' && fill.themeSlot !== undefined && fill.themeSlot !== null) {
            const resolvedColor = this.resolveThemeSlot(fill.themeSlot, fill.value, slideId);
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
