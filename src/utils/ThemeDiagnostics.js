/**
 * ThemeDiagnostics.js
 * 
 * Centralized diagnostic logging for per-slide theme debugging.
 * Enable/disable via localStorage: localStorage.setItem('THEME_DEBUG', 'true')
 * 
 * Features:
 * 1. Complete JSON snapshot of all slide theme assignments
 * 2. Event log tracking all CTAs (Call-to-Actions) that modify themes
 * 3. Before/After state comparison
 * 4. Export capability for bug reports
 */

const DEBUG_KEY = 'THEME_DEBUG';
const VERBOSE_KEY = 'THEME_DEBUG_VERBOSE';

// Event log storage (in-memory, max 100 events)
let eventLog = [];
const MAX_LOG_SIZE = 100;
let eventCounter = 0;

/**
 * Check if theme debugging is enabled
 */
function isDebugEnabled() {
    try {
        return localStorage.getItem(DEBUG_KEY) === 'true';
    } catch {
        return false;
    }
}

/**
 * Check if verbose mode is enabled (includes full color arrays)
 */
function isVerboseEnabled() {
    try {
        return localStorage.getItem(VERBOSE_KEY) === 'true';
    } catch {
        return false;
    }
}

/**
 * Get current timestamp in ISO format
 */
function getTimestamp() {
    return new Date().toISOString();
}

/**
 * Format a color array for compact display
 */
function formatColors(colors, count = 3) {
    if (!colors || !Array.isArray(colors)) return 'null';
    const sample = colors.slice(0, count).join(', ');
    return `[${sample}...] (${colors.length} total)`;
}

/**
 * Get a compact representation of colors
 */
function getColorSample(colors) {
    if (!colors || !Array.isArray(colors)) return null;
    return {
        slot1: colors[0] || null,
        slot6: colors[5] || null,
        slot12: colors[11] || null,
        total: colors.length
    };
}

/**
 * Add event to the log
 */
function addToEventLog(event) {
    eventCounter++;
    const logEntry = {
        eventId: eventCounter,
        timestamp: getTimestamp(),
        ...event
    };
    
    eventLog.push(logEntry);
    
    // Keep log size bounded
    if (eventLog.length > MAX_LOG_SIZE) {
        eventLog = eventLog.slice(-MAX_LOG_SIZE);
    }
    
    return logEntry;
}

/**
 * Log theme data at various levels of the hierarchy
 */
export const ThemeDiag = {
    
    // =========================================
    // COMPLETE STATE SNAPSHOT
    // =========================================
    
    /**
     * Generate a complete JSON snapshot of all slide theme assignments
     * This is the primary troubleshooting tool
     * @param {Object} state - The store state (optional, will fetch if not provided)
     * @returns {Object} Complete theme state snapshot
     */
    captureThemeSnapshot(state = null) {
        if (!state) {
            state = window._storyAppStore?.getState();
        }
        if (!state) {
            return { error: 'Store not available' };
        }
        
        const snapshot = {
            capturedAt: getTimestamp(),
            eventId: eventCounter,
            
            // Editor context
            editor: {
                mode: state.editor?.mode,
                activeSlideId: state.editor?.activeSlideId,
                activeMasterId: state.editor?.activeMasterId
            },
            
            // Theme Master (source of truth for default theme)
            themeMaster: null,
            
            // Layout Masters (can override theme)
            layoutMasters: {},
            
            // All slides with their theme assignments
            slides: {},
            
            // Computed: What theme each slide actually uses
            effectiveThemes: {},
            
            // Color mode
            colorMode: null
        };
        
        // Find and capture theme master
        const themeMaster = Object.values(state.masters || {}).find(m => m.type === 'theme');
        if (themeMaster) {
            const lumaTheme = themeMaster.themeSettings?.lumaTheme;
            snapshot.themeMaster = {
                id: themeMaster.id,
                lumaTheme: lumaTheme ? {
                    id: lumaTheme.id,
                    name: lumaTheme.name,
                    colorMode: lumaTheme.colorMode,
                    colors: isVerboseEnabled() ? lumaTheme.resolvedColors : getColorSample(lumaTheme.resolvedColors)
                } : null,
                styleAssignments: themeMaster.styleAssignments || null
            };
            snapshot.colorMode = lumaTheme?.colorMode || 'light';
        }
        
        // Capture all layout masters
        Object.values(state.masters || {}).forEach(master => {
            if (master.type === 'layout') {
                snapshot.layoutMasters[master.id] = {
                    id: master.id,
                    name: master.name,
                    parentId: master.parentId,
                    styleAssignments: master.styleAssignments ? {
                        colorTheme: master.styleAssignments.colorTheme || null
                    } : null,
                    hasThemeOverride: !!master.styleAssignments?.colorTheme
                };
            }
        });
        
        // Capture all slides
        const slideOrder = state.slideOrder || [];
        slideOrder.forEach((slideId, index) => {
            const slide = state.slides?.[slideId];
            if (!slide) return;
            
            const layout = slide.layoutId ? state.masters?.[slide.layoutId] : null;
            
            snapshot.slides[slideId] = {
                id: slideId,
                index: index,
                layoutId: slide.layoutId || null,
                layoutName: layout?.name || null,
                styleAssignments: slide.styleAssignments ? {
                    colorTheme: slide.styleAssignments.colorTheme || null
                } : null,
                hasThemeOverride: !!slide.styleAssignments?.colorTheme
            };
            
            // Compute effective theme for this slide
            snapshot.effectiveThemes[slideId] = this._computeEffectiveTheme(slide, layout, themeMaster);
        });
        
        return snapshot;
    },
    
    /**
     * Compute effective theme for a slide (internal helper)
     */
    _computeEffectiveTheme(slide, layout, themeMaster) {
        // Priority: Slide > Layout > Theme Master
        if (slide?.styleAssignments?.colorTheme) {
            return {
                themeId: slide.styleAssignments.colorTheme,
                source: 'slide',
                sourceId: slide.id,
                reason: 'Slide has explicit colorTheme override'
            };
        }
        
        if (layout?.styleAssignments?.colorTheme) {
            return {
                themeId: layout.styleAssignments.colorTheme,
                source: 'layout',
                sourceId: layout.id,
                sourceLabel: layout.name,
                reason: `Inherited from layout "${layout.name}"`
            };
        }
        
        if (themeMaster?.themeSettings?.lumaTheme) {
            return {
                themeId: themeMaster.themeSettings.lumaTheme.id || 'master-default',
                themeName: themeMaster.themeSettings.lumaTheme.name,
                source: 'master',
                sourceId: themeMaster.id,
                reason: 'Inherited from Theme Master'
            };
        }
        
        return {
            themeId: null,
            source: 'none',
            reason: 'No theme found in hierarchy'
        };
    },
    
    /**
     * Capture actual CSS variables from the DOM for each slide
     * This shows what's ACTUALLY rendered, not just what the state says
     */
    captureDOMState() {
        const domState = {
            capturedAt: getTimestamp(),
            slides: {},
            documentRoot: {},
            propertyInspector: {},
            colorThemeManager: {}
        };
        
        // Capture CSS vars from document root (should NOT have theme vars if per-slide works)
        const rootStyle = getComputedStyle(document.documentElement);
        domState.documentRoot = {
            slot1: rootStyle.getPropertyValue('--theme-slot1').trim() || 'NOT SET',
            slot6: rootStyle.getPropertyValue('--theme-slot6').trim() || 'NOT SET',
            slot12: rootStyle.getPropertyValue('--theme-slot12').trim() || 'NOT SET'
        };
        
        // Find all slide containers in the DOM
        const slideContainers = document.querySelectorAll('.slide-container, [class*="slide-view"]');
        slideContainers.forEach(container => {
            // Try to get slide ID from data attribute or container
            const slideId = container.dataset?.slideId || 
                            container.id || 
                            container.closest('[data-slide-id]')?.dataset?.slideId ||
                            'unknown';
            
            const style = getComputedStyle(container);
            domState.slides[slideId] = {
                element: container.className,
                cssVars: {
                    slot1: style.getPropertyValue('--theme-slot1').trim() || 'NOT SET',
                    slot6: style.getPropertyValue('--theme-slot6').trim() || 'NOT SET',
                    slot12: style.getPropertyValue('--theme-slot12').trim() || 'NOT SET'
                },
                backgroundColor: style.backgroundColor,
                // Check if this slide has its own CSS vars (not inherited from root)
                hasOwnVars: style.getPropertyValue('--theme-slot1').trim() !== 
                           rootStyle.getPropertyValue('--theme-slot1').trim()
            };
        });
        
        // Capture Property Inspector display (what text is actually shown)
        domState.propertyInspector = this._capturePropertyInspectorDOM();
        
        // Capture ColorThemeManager display (what's selected in the panel)
        domState.colorThemeManager = this._captureColorThemeManagerDOM();
        
        return domState;
    },
    
    /**
     * Capture what the Property Inspector is actually displaying in the DOM
     */
    _capturePropertyInspectorDOM() {
        const result = {
            visible: false,
            themeName: null,
            badge: null,
            sourceLabel: null
        };
        
        // Find the color section in Property Inspector
        const colorThemeNameEl = document.querySelector('.property-colors .theme-detail-value, .property-colors .theme-name, [class*="colorThemeName"]');
        const colorBadgeEl = document.querySelector('.property-colors .theme-detail-badge');
        const sourceLabel = document.querySelector('.property-colors .theme-source-label, [class*="themeSourceLabel"]');
        
        // Try alternative selectors
        const panelContent = document.querySelector('.property-inspector, .properties-panel');
        if (panelContent) {
            result.visible = true;
            
            // Look for theme name in various possible locations
            const themeNameCandidates = panelContent.querySelectorAll('.theme-detail-value, .theme-name, h4, span');
            for (const el of themeNameCandidates) {
                const text = el.textContent?.trim();
                if (text && !['Colors', 'Typography', 'Inherited', 'Override', 'Master', 'Slide'].includes(text) && 
                    text.length > 2 && text.length < 50) {
                    // Check if this looks like a theme name
                    if (el.closest('.theme-detail, .color-section, .property-colors')) {
                        result.themeName = text;
                        break;
                    }
                }
            }
            
            // Get badge text
            if (colorBadgeEl) {
                result.badge = colorBadgeEl.textContent?.trim() || null;
            }
            
            // Get source label  
            if (sourceLabel) {
                result.sourceLabel = sourceLabel.textContent?.trim() || null;
            }
        }
        
        return result;
    },
    
    /**
     * Capture what the ColorThemeManager panel is displaying in the DOM
     */
    _captureColorThemeManagerDOM() {
        const result = {
            visible: false,
            selectedThemeName: null,
            selectedThemeId: null,
            allThemeItems: []
        };
        
        // Find ColorThemeManager panel
        const ctmPanel = document.querySelector('.ctm, .color-theme-manager, [class*="ColorThemeManager"]');
        if (!ctmPanel) {
            return result;
        }
        
        result.visible = true;
        
        // Find selected theme item
        const selectedItem = ctmPanel.querySelector('.ctm__theme-item--selected, [class*="selected"]');
        if (selectedItem) {
            result.selectedThemeId = selectedItem.dataset?.themeId || null;
            const nameEl = selectedItem.querySelector('.ctm__theme-name, .theme-name');
            result.selectedThemeName = nameEl?.textContent?.trim() || null;
        }
        
        // Capture all visible theme items for reference
        const themeItems = ctmPanel.querySelectorAll('.ctm__theme-item');
        themeItems.forEach(item => {
            const nameEl = item.querySelector('.ctm__theme-name');
            result.allThemeItems.push({
                id: item.dataset?.themeId || 'unknown',
                name: nameEl?.textContent?.trim() || 'unknown',
                isSelected: item.classList.contains('ctm__theme-item--selected')
            });
        });
        
        return result;
    },
    
    /**
     * Print the actual DOM state showing rendered colors
     */
    printDOMState() {
        const domState = this.captureDOMState();
        
        console.group('%c[DOM REALITY] ' + domState.capturedAt, 'color: #00BCD4; font-weight: bold; font-size: 14px');
        
        console.log('%c🌍 Document Root CSS Vars (should be empty if per-slide works)', 'color: #F44336; font-weight: bold');
        console.table(domState.documentRoot);
        
        console.log('%c🖼️ Slide DOM Elements', 'color: #4CAF50; font-weight: bold');
        Object.entries(domState.slides).forEach(([slideId, data]) => {
            console.group(`Slide: ${slideId}`);
            console.log('Element:', data.element);
            console.log('CSS Vars:', data.cssVars);
            console.log('Background:', data.backgroundColor);
            console.log('Has own vars:', data.hasOwnVars);
            console.groupEnd();
        });
        
        console.log('%c📋 Property Inspector (DOM)', 'color: #E91E63; font-weight: bold');
        console.log({
            visible: domState.propertyInspector.visible,
            themeName: domState.propertyInspector.themeName || '(not found)',
            badge: domState.propertyInspector.badge || '(none)',
            sourceLabel: domState.propertyInspector.sourceLabel || '(none)'
        });
        
        console.log('%c🎨 ColorThemeManager Panel (DOM)', 'color: #9C27B0; font-weight: bold');
        console.log({
            visible: domState.colorThemeManager.visible,
            selectedTheme: domState.colorThemeManager.selectedThemeName || '(none)',
            selectedThemeId: domState.colorThemeManager.selectedThemeId || '(none)',
            totalThemes: domState.colorThemeManager.allThemeItems?.length || 0
        });
        if (domState.colorThemeManager.visible && domState.colorThemeManager.allThemeItems.length > 0) {
            console.table(domState.colorThemeManager.allThemeItems);
        }
        
        console.groupEnd();
        
        return domState;
    },
    
    /**
     * Print combined snapshot: State + DOM Reality
     */
    printFullDiagnostics() {
        console.group('%c[FULL THEME DIAGNOSTICS]', 'color: #673AB7; font-weight: bold; font-size: 16px');
        
        // State snapshot
        const stateSnapshot = this.printSnapshot();
        
        // DOM reality
        const domState = this.printDOMState();
        
        // Comparison: Do state and DOM match?
        console.log('%c🔍 State vs DOM Comparison', 'color: #FF5722; font-weight: bold');
        Object.keys(stateSnapshot.effectiveThemes).forEach(slideId => {
            const stateTheme = stateSnapshot.effectiveThemes[slideId];
            const domSlide = Object.entries(domState.slides).find(([id]) => id.includes(slideId));
            
            if (domSlide) {
                const [domId, domData] = domSlide;
                console.log(`  Slide ${slideId}:`);
                console.log(`    State says: ${stateTheme.themeId || 'none'}`);
                console.log(`    DOM shows: slot1=${domData.cssVars.slot1}, slot6=${domData.cssVars.slot6}`);
            } else {
                console.log(`  Slide ${slideId}: State says ${stateTheme.themeId || 'none'}, but no DOM element found`);
            }
        });
        
        console.groupEnd();
        
        return { stateSnapshot, domState };
    },
    
    /**
     * Print a formatted snapshot to console
     * Includes detection of shapes with theme-linked colors and their rendered values
     */
    printSnapshot() {
        const snapshot = this.captureThemeSnapshot();
        const state = window._storyAppStore?.getState();
        const activeSlideId = state?.editor?.activeSlideId;
        
        console.group('%c[THEME SNAPSHOT] ' + snapshot.capturedAt, 'color: #FF5722; font-weight: bold; font-size: 14px');
        
        console.log('%c📋 Editor Context', 'color: #9C27B0; font-weight: bold');
        console.table(snapshot.editor);
        
        console.log('%c🎨 Theme Master', 'color: #4CAF50; font-weight: bold');
        console.log(JSON.stringify(snapshot.themeMaster, null, 2));
        
        console.log('%c📐 Layout Masters', 'color: #2196F3; font-weight: bold');
        console.table(snapshot.layoutMasters);
        
        console.log('%c📄 All Slides', 'color: #FF9800; font-weight: bold');
        console.table(snapshot.slides);
        
        console.log('%c✨ Effective Themes (Computed)', 'color: #E91E63; font-weight: bold');
        Object.entries(snapshot.effectiveThemes).forEach(([slideId, theme]) => {
            const icon = theme.source === 'slide' ? '🎯' : theme.source === 'layout' ? '📐' : '🏠';
            console.log(`  ${icon} Slide ${slideId}: ${theme.themeId || 'none'} (${theme.reason})`);
        });
        
        // Detect and log shapes with theme-linked colors
        console.log('%c🎨 Shapes with Theme-Linked Colors', 'color: #00BCD4; font-weight: bold');
        console.log('⚠️ Note: Only the active slide is rendered in DOM. Navigate to the slide to see actual colors.');
        
        const slideOrder = state?.slideOrder || [];
        slideOrder.forEach((slideId, index) => {
            const slide = state.slides?.[slideId];
            if (!slide) return;
            
            const isActive = slideId === activeSlideId;
            const elements = slide.elements || {};
            
            // Find shapes with theme-linked fills (solid fills with themeSlot)
            const themedShapes = [];
            Object.values(elements).forEach(element => {
                if (element.fill?.type === 'solid' && element.fill?.themeSlot !== undefined) {
                    themedShapes.push({
                        id: element.id,
                        name: element.name || element.id,
                        type: element.type,
                        themeSlot: element.fill.themeSlot,
                        slotNumber: element.fill.themeSlot + 1
                    });
                }
            });
            
            if (themedShapes.length > 0) {
                const activeMarker = isActive ? '🟢 ACTIVE' : '⚪ (not rendered)';
                console.group(`  📄 Slide ${index + 1}: ${slideId} ${activeMarker}`);
                
                const effectiveTheme = this._getSlideEffectiveTheme(slideId, state);
                console.log('Effective Theme:', effectiveTheme?.name || 'none', `(${effectiveTheme?.source || 'unknown'})`);
                
                const slideEl = isActive ? document.getElementById(`view-${slideId}`) : null;
                
                themedShapes.forEach(shape => {
                    let resolvedColor = 'NOT IN THEME';
                    let domCssVar = 'NOT RENDERED';
                    let actualBgColor = 'NOT RENDERED';
                    
                    // Get expected color from theme data
                    if (effectiveTheme?.resolvedColors) {
                        resolvedColor = effectiveTheme.resolvedColors[shape.themeSlot] || 'INDEX OUT OF RANGE';
                    }
                    
                    if (isActive && slideEl) {
                        // Get CSS variable value from the slide element
                        const slideStyle = getComputedStyle(slideEl);
                        domCssVar = slideStyle.getPropertyValue(`--theme-slot${shape.slotNumber}`).trim() || 'NOT SET';
                        
                        // Find the shape element and get actual rendered color
                        const shapeEl = document.getElementById(shape.id);
                        if (shapeEl) {
                            const fillLayer = shapeEl.querySelector('.fill-layer');
                            if (fillLayer) {
                                actualBgColor = getComputedStyle(fillLayer).backgroundColor || 'NO BG';
                            } else {
                                actualBgColor = getComputedStyle(shapeEl).backgroundColor || 'NO FILL LAYER';
                            }
                        } else {
                            actualBgColor = 'ELEMENT NOT FOUND';
                        }
                    }
                    
                    const colorMatch = isActive && resolvedColor === domCssVar ? '✅' : isActive ? '❌' : '⚪';
                    
                    console.log(
                        `    🎨 ${shape.name}: Slot ${shape.slotNumber} ${colorMatch}`,
                        `\n        Theme expects: %c${resolvedColor}%c`,
                        `background: ${resolvedColor}; color: ${this._getContrastColor(resolvedColor)}; padding: 2px 8px; border-radius: 3px;`,
                        '',
                        `\n        CSS Var: ${domCssVar}`,
                        `\n        Rendered BG: ${actualBgColor}`
                    );
                });
                
                console.groupEnd();
            }
        });
        
        console.groupEnd();
        
        return snapshot;
    },
    
    // =========================================
    // HELPER FUNCTIONS FOR SHAPE COLOR DETECTION
    // =========================================
    
    /**
     * Get effective theme for a slide (helper)
     */
    _getSlideEffectiveTheme(slideId, state) {
        const slide = state.slides?.[slideId];
        if (!slide) return null;
        
        // Check slide override
        if (slide.styleAssignments?.colorTheme) {
            return { 
                id: slide.styleAssignments.colorTheme, 
                source: 'slide',
                name: this._getThemeName(slide.styleAssignments.colorTheme)
            };
        }
        
        // Check layout override
        const layout = slide.layoutId ? state.masters?.[slide.layoutId] : null;
        if (layout?.styleAssignments?.colorTheme) {
            return { 
                id: layout.styleAssignments.colorTheme, 
                source: 'layout',
                name: this._getThemeName(layout.styleAssignments.colorTheme)
            };
        }
        
        // Fall back to theme master
        const themeMaster = Object.values(state.masters || {}).find(m => m.type === 'theme');
        if (themeMaster?.themeSettings?.lumaTheme) {
            return {
                id: themeMaster.themeSettings.lumaTheme.id,
                name: themeMaster.themeSettings.lumaTheme.name,
                source: 'master',
                resolvedColors: themeMaster.themeSettings.lumaTheme.resolvedColors
            };
        }
        
        return null;
    },
    
    /**
     * Get theme name by ID (helper)
     */
    _getThemeName(themeId) {
        // Check presets
        const presets = [
            { id: 'preset_neutral', name: 'Neutral' },
            { id: 'preset_ocean_sunset', name: 'Ocean Sunset' },
            { id: 'preset_tropical_paradise', name: 'Tropical Paradise' },
            { id: 'preset_emerald_gold', name: 'Emerald & Gold' },
            { id: 'preset_electric_dreams', name: 'Electric Dreams' },
            { id: 'preset_sunset_boulevard', name: 'Sunset Boulevard' }
        ];
        const preset = presets.find(p => p.id === themeId);
        if (preset) return preset.name;
        return themeId;
    },
    
    /**
     * Get contrast color for readability
     */
    _getContrastColor(hexColor) {
        if (!hexColor || hexColor === 'NOT SET' || hexColor === 'NOT RENDERED' || hexColor === 'NOT FOUND') {
            return '#000';
        }
        try {
            const hex = hexColor.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            return luminance > 0.5 ? '#000' : '#fff';
        } catch {
            return '#000';
        }
    },
    
    // =========================================
    // CTA EVENT LOGGING
    // =========================================
    
    /**
     * Log a theme-related CTA (Call-to-Action) event
     * @param {string} action - The action name
     * @param {Object} details - Event details
     * @param {Object} stateBefore - State snapshot before the action (optional)
     */
    logCTA(action, details, stateBefore = null) {
        if (!isDebugEnabled()) return;
        
        const stateAfter = this.captureThemeSnapshot();
        
        const event = addToEventLog({
            type: 'CTA',
            action,
            details,
            stateBefore: stateBefore ? {
                effectiveThemes: stateBefore.effectiveThemes
            } : null,
            stateAfter: {
                effectiveThemes: stateAfter.effectiveThemes
            }
        });
        
        // Console output
        console.group(`%c[THEME CTA #${event.eventId}] ${action}`, 'color: #9C27B0; font-weight: bold; font-size: 12px');
        console.log('Details:', details);
        if (stateBefore) {
            console.log('Before:', stateBefore.effectiveThemes);
        }
        console.log('After:', stateAfter.effectiveThemes);
        console.groupEnd();
        
        return event;
    },
    
    /**
     * Log when Store.getEffectiveSlide resolves a theme
     */
    logStoreResolve(slideId, result) {
        if (!isDebugEnabled()) return;
        
        const event = addToEventLog({
            type: 'RESOLVE',
            component: 'Store.getEffectiveSlide',
            slideId,
            result: {
                themeSource: result.themeSource,
                themeName: result.resolvedLumaTheme?.name || 'none',
                hasResolvedTheme: !!result.resolvedLumaTheme,
                slideStyleAssignments: result.styleAssignments?.colorTheme || 'none'
            }
        });
        
        console.log(`%c[THEME #${event.eventId}] Store.getEffectiveSlide(${slideId})`, 'color: #4CAF50; font-weight: bold', event.result);
    },

    /**
     * Log when SlideView applies CSS variables
     */
    logSlideViewApply(slideId, lumaTheme, domElement) {
        if (!isDebugEnabled()) return;
        
        const colors = lumaTheme?.resolvedColors || lumaTheme?.slots?.map(s => s.hex);
        
        const event = addToEventLog({
            type: 'CSS_APPLY',
            component: 'SlideView.update',
            slideId,
            theme: {
                id: lumaTheme?.id,
                name: lumaTheme?.name || 'none',
                colors: isVerboseEnabled() ? colors : getColorSample(colors)
            },
            targetElement: domElement?.className || 'unknown',
            targetId: domElement?.id || null
        });
        
        console.log(`%c[THEME #${event.eventId}] SlideView.update(${slideId}) - CSS vars applied`, 'color: #2196F3; font-weight: bold', {
            themeName: event.theme.name,
            colors: formatColors(colors),
            target: event.targetElement
        });
    },

    /**
     * Log when StyleResolver resolves cascade
     */
    logStyleResolverCascade(slideId, themeInfo) {
        if (!isDebugEnabled()) return;
        
        const event = addToEventLog({
            type: 'CASCADE_RESOLVE',
            component: 'StyleResolver.getThemeInfoForSlide',
            slideId,
            resolution: {
                source: themeInfo.source,
                sourceId: themeInfo.sourceId,
                sourceLabel: themeInfo.sourceLabel,
                themeId: themeInfo.lumaTheme?.id || 'none',
                themeName: themeInfo.lumaTheme?.name || 'none',
                colorMode: themeInfo.colorMode,
                isInherited: themeInfo.isInherited
            }
        });
        
        const icon = themeInfo.source === 'slide' ? '🎯' : themeInfo.source === 'layout' ? '📐' : '🏠';
        console.log(`%c[THEME #${event.eventId}] ${icon} StyleResolver cascade for ${slideId}`, 'color: #FF9800; font-weight: bold', event.resolution);
    },

    /**
     * Log when ColorThemeManager applies a theme (CTA)
     */
    logColorThemeManagerApply(mode, slideId, theme) {
        if (!isDebugEnabled()) return;
        
        // Capture state before the action
        const stateBefore = this.captureThemeSnapshot();
        
        const event = addToEventLog({
            type: 'CTA',
            action: 'ColorThemeManager.applyThemeToStore',
            component: 'ColorThemeManager',
            details: {
                editorMode: mode,
                targetSlideId: slideId || null,
                themeId: theme?.id,
                themeName: theme?.name,
                // What WILL change based on mode
                expectedTarget: mode === 'master' ? 
                    'Theme Master or Layout Master (depending on activeMasterId)' : 
                    `Slide ${slideId}`
            },
            stateBefore: {
                effectiveThemes: stateBefore.effectiveThemes
            }
        });
        
        console.group(`%c[THEME CTA #${event.eventId}] 🎬 ColorThemeManager.applyThemeToStore()`, 'color: #9C27B0; font-weight: bold; font-size: 12px');
        console.log('Mode:', mode);
        console.log('Target:', slideId || '(master mode)');
        console.log('Theme:', { id: theme?.id, name: theme?.name });
        console.log('State Before:', stateBefore.effectiveThemes);
        console.groupEnd();
    },

    /**
     * Log when Property Inspector displays theme info
     */
    logPropertyInspectorDisplay(slideId, themeInfo, mode) {
        if (!isDebugEnabled()) return;
        
        const event = addToEventLog({
            type: 'UI_DISPLAY',
            component: 'SlideSection.updateThemeDisplay',
            slideId,
            mode,
            display: {
                source: themeInfo?.source,
                themeName: themeInfo?.lumaTheme?.name || 'none',
                isInherited: themeInfo?.isInherited
            }
        });
        
        console.log(`%c[THEME #${event.eventId}] SlideSection display update`, 'color: #E91E63; font-weight: bold', event.display);
    },

    /**
     * Log ThemeSwatches color resolution
     */
    logThemeSwatchesUpdate(slideId, themeInfo) {
        if (!isDebugEnabled()) return;
        
        const colors = themeInfo.lumaTheme?.resolvedColors || themeInfo.lumaTheme?.slots?.map(s => s.hex);
        
        const event = addToEventLog({
            type: 'UI_UPDATE',
            component: 'ThemeSwatches.updateSwatches',
            slideId: slideId || 'active',
            theme: {
                source: themeInfo.source,
                name: themeInfo.lumaTheme?.name || 'none',
                colors: isVerboseEnabled() ? colors : getColorSample(colors)
            }
        });
        
        console.log(`%c[THEME #${event.eventId}] ThemeSwatches update`, 'color: #00BCD4; font-weight: bold', {
            slideId: event.slideId,
            source: event.theme.source,
            themeName: event.theme.name,
            colors: formatColors(colors)
        });
    },
    
    /**
     * Log what theme is being displayed in a UI component
     * Used for Property Inspector and ColorThemeManager panel
     * @param {string} component - 'PropertyInspector' or 'ColorThemeManager'
     * @param {Object} details - Display details
     */
    logUIDisplay(component, details) {
        if (!isDebugEnabled()) return;
        
        const event = addToEventLog({
            type: 'UI_DISPLAY',
            component,
            ...details
        });
        
        const icons = {
            'PropertyInspector': '📋',
            'ColorThemeManager': '🎨'
        };
        const icon = icons[component] || '🖥️';
        
        if (component === 'PropertyInspector') {
            console.log(
                `%c[THEME #${event.eventId}] ${icon} Property Inspector showing:`,
                'color: #E91E63; font-weight: bold',
                {
                    slideId: details.slideId,
                    mode: details.mode,
                    theme: details.displayedTheme?.name || 'none',
                    themeId: details.displayedTheme?.id || 'none',
                    source: details.displayedTheme?.source,
                    isOverride: details.displayedTheme?.isOverride,
                    isInherited: details.displayedTheme?.isInherited
                }
            );
        } else if (component === 'ColorThemeManager') {
            console.log(
                `%c[THEME #${event.eventId}] ${icon} ColorThemeManager selected:`,
                'color: #9C27B0; font-weight: bold',
                {
                    theme: details.selectedThemeName,
                    themeId: details.selectedThemeId,
                    mode: details.editorMode,
                    willApplyTo: details.willApplyTo
                }
            );
        } else {
            console.log(
                `%c[THEME #${event.eventId}] ${icon} ${component} display:`,
                'color: #607D8B; font-weight: bold',
                details
            );
        }
    },

    /**
     * Log full hierarchy snapshot for a slide
     */
    logHierarchySnapshot(slideId, state) {
        if (!isDebugEnabled()) return;
        
        const slide = state.slides?.[slideId];
        const layout = slide?.layoutId ? state.masters?.[slide.layoutId] : null;
        const themeMaster = Object.values(state.masters || {}).find(m => m.type === 'theme');
        
        const hierarchy = {
            slideId,
            timestamp: getTimestamp(),
            levels: {
                themeMaster: {
                    id: themeMaster?.id,
                    lumaThemeName: themeMaster?.themeSettings?.lumaTheme?.name || 'none',
                    styleAssignments: themeMaster?.styleAssignments?.colorTheme || null
                },
                layout: {
                    id: layout?.id,
                    name: layout?.name,
                    styleAssignments: layout?.styleAssignments?.colorTheme || null
                },
                slide: {
                    id: slide?.id,
                    styleAssignments: slide?.styleAssignments?.colorTheme || null
                }
            },
            cssVarsOnRoot: {
                slot1: getComputedStyle(document.documentElement).getPropertyValue('--theme-slot1').trim() || 'not set',
                slot6: getComputedStyle(document.documentElement).getPropertyValue('--theme-slot6').trim() || 'not set',
                slot12: getComputedStyle(document.documentElement).getPropertyValue('--theme-slot12').trim() || 'not set'
            }
        };
        
        addToEventLog({
            type: 'HIERARCHY_SNAPSHOT',
            ...hierarchy
        });
        
        console.group(`%c[THEME] Hierarchy Snapshot for Slide: ${slideId}`, 'color: #FF5722; font-weight: bold');
        console.log('📊 Full Hierarchy JSON:', JSON.stringify(hierarchy, null, 2));
        console.groupEnd();
    },
    
    // =========================================
    // EVENT LOG MANAGEMENT
    // =========================================
    
    /**
     * Get all logged events
     */
    getEventLog() {
        return [...eventLog];
    },
    
    /**
     * Get events filtered by type
     */
    getEventsByType(type) {
        return eventLog.filter(e => e.type === type);
    },
    
    /**
     * Get only CTA events (user actions that modify state)
     */
    getCTAEvents() {
        return eventLog.filter(e => e.type === 'CTA');
    },
    
    /**
     * Clear the event log
     */
    clearEventLog() {
        eventLog = [];
        eventCounter = 0;
        console.log('%c[THEME] Event log cleared', 'color: #FF9800; font-weight: bold');
    },
    
    /**
     * Print event log summary
     */
    printEventLog() {
        console.group('%c[THEME EVENT LOG]', 'color: #3F51B5; font-weight: bold; font-size: 14px');
        console.log(`Total events: ${eventLog.length}`);
        console.log(`CTAs: ${eventLog.filter(e => e.type === 'CTA').length}`);
        console.log(`Cascade Resolves: ${eventLog.filter(e => e.type === 'CASCADE_RESOLVE').length}`);
        console.log(`CSS Applies: ${eventLog.filter(e => e.type === 'CSS_APPLY').length}`);
        console.table(eventLog.map(e => ({
            id: e.eventId,
            time: e.timestamp.split('T')[1].split('.')[0],
            type: e.type,
            component: e.component || e.action,
            slideId: e.slideId || e.details?.targetSlideId || '-'
        })));
        console.groupEnd();
    },
    
    /**
     * Export complete diagnostic data for bug report
     */
    exportDiagnostics() {
        const data = {
            exportedAt: getTimestamp(),
            snapshot: this.captureThemeSnapshot(),
            eventLog: eventLog,
            summary: {
                totalEvents: eventLog.length,
                ctaCount: eventLog.filter(e => e.type === 'CTA').length,
                lastCTA: eventLog.filter(e => e.type === 'CTA').slice(-1)[0] || null
            }
        };
        
        const json = JSON.stringify(data, null, 2);
        
        // Copy to clipboard if available
        if (navigator.clipboard) {
            navigator.clipboard.writeText(json).then(() => {
                console.log('%c[THEME] Diagnostics copied to clipboard!', 'color: #4CAF50; font-weight: bold');
            });
        }
        
        console.log('%c[THEME DIAGNOSTICS EXPORT]', 'color: #3F51B5; font-weight: bold; font-size: 14px');
        console.log(json);
        
        return data;
    },

    // =========================================
    // ENABLE/DISABLE
    // =========================================
    
    /**
     * Enable debugging
     */
    enable() {
        localStorage.setItem(DEBUG_KEY, 'true');
        console.log('%c[THEME] Debugging ENABLED', 'color: #4CAF50; font-weight: bold');
        console.log('Commands available:');
        console.log('  ThemeDiag.printSnapshot()       - Print theme state + shape colors from Store/DOM');
        console.log('  ThemeDiag.printDOMState()       - Print actual CSS vars from DOM elements');
        console.log('  ThemeDiag.printUIState()        - Print what Property Inspector & ColorThemeManager show');
        console.log('  ThemeDiag.printFullDiagnostics()- Print both State + DOM comparison');
        console.log('  ThemeDiag.printEventLog()       - Print event log');
        console.log('  ThemeDiag.exportDiagnostics()   - Export all data (copies to clipboard)');
        console.log('  ThemeDiag.enableVerbose()       - Include full color arrays');
        console.log('  ThemeDiag.disable()             - Turn off logging');
    },
    
    /**
     * Print just the UI panel state (Property Inspector & ColorThemeManager)
     * Quick way to see what the user actually sees
     */
    printUIState() {
        const timestamp = getTimestamp();
        const piState = this._capturePropertyInspectorDOM();
        const ctmState = this._captureColorThemeManagerDOM();
        
        // Also get the store state for comparison
        const state = window._storyAppStore?.getState();
        const activeSlideId = state?.editor?.activeSlideId;
        const mode = state?.editor?.mode;
        
        console.group('%c[UI STATE] ' + timestamp, 'color: #FF4081; font-weight: bold; font-size: 14px');
        
        console.log('%c📋 Property Inspector (what user sees)', 'color: #E91E63; font-weight: bold');
        console.log({
            visible: piState.visible,
            themeName: piState.themeName || '❌ NOT FOUND',
            badge: piState.badge || '(none)',
            sourceLabel: piState.sourceLabel || '(none)'
        });
        
        console.log('%c🎨 ColorThemeManager Panel (what user sees)', 'color: #9C27B0; font-weight: bold');
        if (ctmState.visible) {
            console.log({
                selectedTheme: ctmState.selectedThemeName || '❌ NONE SELECTED',
                selectedThemeId: ctmState.selectedThemeId || '(none)',
                totalThemesListed: ctmState.allThemeItems?.length || 0
            });
        } else {
            console.log('Panel not visible/open');
        }
        
        console.log('%c🔍 Context', 'color: #607D8B; font-weight: bold');
        console.log({
            mode: mode || 'unknown',
            activeSlideId: activeSlideId || 'none'
        });
        
        console.groupEnd();
        
        return { timestamp, propertyInspector: piState, colorThemeManager: ctmState, mode, activeSlideId };
    },

    /**
     * Disable debugging  
     */
    disable() {
        localStorage.removeItem(DEBUG_KEY);
        localStorage.removeItem(VERBOSE_KEY);
        console.log('%c[THEME] Debugging DISABLED', 'color: #F44336; font-weight: bold');
    },
    
    /**
     * Enable verbose mode (full color arrays)
     */
    enableVerbose() {
        localStorage.setItem(VERBOSE_KEY, 'true');
        console.log('%c[THEME] Verbose mode ENABLED - full color arrays will be logged', 'color: #4CAF50; font-weight: bold');
    },
    
    /**
     * Disable verbose mode
     */
    disableVerbose() {
        localStorage.removeItem(VERBOSE_KEY);
        console.log('%c[THEME] Verbose mode DISABLED', 'color: #FF9800; font-weight: bold');
    }
};

// Expose to window for easy console access
if (typeof window !== 'undefined') {
    window.ThemeDiag = ThemeDiag;
}
