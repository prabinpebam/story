import { Section } from '../components/Section.js';
import { TextInput } from '../components/TextInput.js';
import { NumberInput } from '../components/NumberInput.js';
import { Dropdown } from '../components/Dropdown.js';
import { Flyout } from '../components/Flyout.js';
import { Button } from '../components/Button.js';
import { SegmentedControl } from '../components/SegmentedControl.js';
import { store } from '../../core/Store.js';
import { FillSection } from './FillSection.js';
import { panelManager } from '../PanelManager.js';
import { Icons } from '../Icons.js';
import { ThemeSwatches } from '../components/ThemeSwatches.js';
import { SLIDE_MASTER_PRESETS, getPresetById, getPresetList, getFullPresetById } from '../../core/store/SlideMasterPresets.js';
import { THEME_PRESETS } from '../panels/color-theme/ThemePresets.js';
import { applyThemeToCSSVariables, COLOR_MODES } from '../panels/color-theme/ColorThemeUtils.js';
import { StyleResolver } from '../../utils/StyleResolver.js';
import { ThemeDiag } from '../../utils/ThemeDiagnostics.js';
import { ThumbnailRenderer } from '../../core/renderer/ThumbnailRenderer.js';

export class SlideSection {
    constructor() {
        // Container for all slide-related sections (no outer wrapper section)
        this.element = document.createElement('div');
        this.element.className = 'slide-properties';
        
        this.layoutFlyout = null;
        this.presetFlyout = null;
        
        this.fillSection = new FillSection({
            title: 'Background',
            manualVisibility: true,
            getElement: (selection) => selection[0],
            onUpdate: (fills, isTransient) => this.updateBackground(fills, isTransient)
        });

        this.createContent();
        this.setupThemeListener();
    }

    createContent() {
        // 1. Name Row (Master Mode only) - standalone, no section
        this.nameRow = document.createElement('div');
        this.nameRow.className = 'pi-row';
        this.nameRow.style.padding = '0 var(--spacing-2)';
        this.nameInput = new TextInput({
            placeholder: 'Name',
            onChange: (val) => this.updateName(val)
        });
        this.nameRow.appendChild(this.nameInput.element);
        this.element.appendChild(this.nameRow);

        // 1.5 Master Preset Section (Theme Master only)
        this.createPresetSection();

        // 2. Layout Section (Slide Mode)
        this.layoutSection = new Section({ title: 'Layout' });
        
        // Layout picker row
        this.layoutRow = document.createElement('div');
        this.layoutRow.className = 'pi-row layout-picker-row';
        
        // Layout trigger button (shows current layout)
        this.layoutTriggerBtn = new Button({
            label: 'Select Layout',
            variant: 'secondary',
            size: 'sm',
            className: 'layout-trigger-btn',
            onClick: () => this.openLayoutFlyout()
        });
        this.layoutTrigger = this.layoutTriggerBtn.element;
        this.layoutRow.appendChild(this.layoutTrigger);
        
        // Hidden dropdown for value storage
        this.layoutSelect = new Dropdown({
            onChange: (val) => this.updateLayout(val)
        });
        this.layoutSelect.element.style.display = 'none';
        this.layoutRow.appendChild(this.layoutSelect.element);
        
        this.layoutSection.appendChild(this.layoutRow);

        // Dimensions row (inside Layout section)
        const dimRow = document.createElement('div');
        dimRow.className = 'pi-row';
        
        this.wInput = new NumberInput({
            label: 'W',
            onChange: (val, isTransient) => this.updateDimension('width', val, isTransient)
        });
        
        this.hInput = new NumberInput({
            label: 'H',
            onChange: (val, isTransient) => this.updateDimension('height', val, isTransient)
        });

        dimRow.appendChild(this.wInput.element);
        dimRow.appendChild(this.hInput.element);
        this.layoutSection.appendChild(dimRow);
        
        this.element.appendChild(this.layoutSection.element);

        // 3. Theme Section
        this.createThemeSection();

        // 4. Background (FillSection) - Appended separately in PropertyInspector
    }

    createPresetSection() {
        this.presetSection = new Section({ title: 'Template' });
        
        const presetRow = document.createElement('div');
        presetRow.className = 'pi-row preset-picker-row';
        
        // Preset trigger button
        this.presetTriggerBtn = new Button({
            label: 'Select Template',
            variant: 'secondary',
            size: 'sm',
            className: 'preset-trigger-btn',
            onClick: () => this.openPresetFlyout()
        });
        this.presetTrigger = this.presetTriggerBtn.element;
        presetRow.appendChild(this.presetTrigger);
        
        this.presetSection.appendChild(presetRow);
        
        // Description text
        this.presetDescription = document.createElement('div');
        this.presetDescription.className = 'preset-description';
        this.presetDescription.style.cssText = 'font-size: var(--font-size-xs); color: var(--color-text-secondary); padding: 0 var(--spacing-1); margin-top: var(--spacing-1);';
        this.presetSection.appendChild(this.presetDescription);
        
        this.element.appendChild(this.presetSection.element);
    }

    createThemeSection() {
        // Colors Section
        this.colorsSection = new Section({ title: 'Colors' });
        this.colorsContent = this.createColorsSectionContent();
        this.colorsSection.appendChild(this.colorsContent);
        this.element.appendChild(this.colorsSection.element);

        // Typography Section
        this.typographySection = new Section({ title: 'Typography' });
        this.typographyContent = this.createTypographySectionContent();
        this.typographySection.appendChild(this.typographyContent);
        this.element.appendChild(this.typographySection.element);
    }

    createColorsSectionContent() {
        const container = document.createElement('div');
        container.className = 'theme-colors-content';

        // Current theme name/preset row
        const headerRow = document.createElement('div');
        headerRow.className = 'theme-detail-header';
        
        this.colorThemeName = document.createElement('span');
        this.colorThemeName.className = 'theme-detail-name';
        this.colorThemeName.textContent = 'Default';
        headerRow.appendChild(this.colorThemeName);

        // Inheritance badge (cascade-aware)
        this.colorBadge = document.createElement('span');
        this.colorBadge.className = 'theme-detail-badge';
        headerRow.appendChild(this.colorBadge);

        // Edit button
        const colorEditBtn = new Button({
            icon: '<i class="fa-solid fa-pen"></i>',
            variant: 'text',
            size: 'xs',
            title: 'Edit colors',
            className: 'theme-detail-edit',
            onClick: () => panelManager.toggle('color-theme-manager')
        });
        headerRow.appendChild(colorEditBtn.element);

        // Reset button (clears styleAssignments.colorTheme)
        this.colorResetBtn = new Button({
            icon: '<i class="fa-solid fa-arrow-rotate-left"></i>',
            variant: 'text',
            size: 'xs',
            title: 'Reset to inherited',
            className: 'theme-detail-reset',
            onClick: () => this.resetColors()
        });
        headerRow.appendChild(this.colorResetBtn.element);

        container.appendChild(headerRow);

        // Theme source indicator row (shows where the theme comes from in cascade)
        const sourceRow = document.createElement('div');
        sourceRow.className = 'theme-source-row';
        sourceRow.style.cssText = `
            font-size: var(--font-size-xs);
            color: var(--color-text-tertiary);
            display: flex;
            align-items: center;
            gap: var(--spacing-1);
            margin-bottom: var(--spacing-2);
        `;
        
        this.themeSourceIcon = document.createElement('span');
        this.themeSourceIcon.style.fontSize = '10px';
        sourceRow.appendChild(this.themeSourceIcon);
        
        this.themeSourceLabel = document.createElement('span');
        sourceRow.appendChild(this.themeSourceLabel);
        
        container.appendChild(sourceRow);

        // Mode toggle row (Light ☀️ / Dark 🌙)
        const modeRow = document.createElement('div');
        modeRow.className = 'pi-row theme-mode-row';
        modeRow.style.marginBottom = 'var(--spacing-2)';
        
        const modeLabel = document.createElement('span');
        modeLabel.className = 'pi-label';
        modeLabel.textContent = 'Mode';
        modeLabel.style.marginRight = 'var(--spacing-2)';
        modeRow.appendChild(modeLabel);
        
        // Get current color mode from store
        const state = store.getState();
        const themeMaster = state.slideMasterPresets?.['master-default'];
        const currentMode = themeMaster?.colorModeId || COLOR_MODES.LIGHT;
        
        this.modeToggle = new SegmentedControl({
            options: [
                { value: COLOR_MODES.LIGHT, label: 'Light', icon: '<i class="fa-solid fa-sun"></i>' },
                { value: COLOR_MODES.DARK, label: 'Dark', icon: '<i class="fa-solid fa-moon"></i>' }
            ],
            value: currentMode,
            onChange: (mode) => this.updateColorMode(mode)
        });
        modeRow.appendChild(this.modeToggle.element);
        
        container.appendChild(modeRow);

        // Use ThemeSwatches component for luma-locked 12-slot display
        // Now cascade-aware - will show theme from the correct cascade level
        this.themeSwatchesComponent = new ThemeSwatches({
            onColorSelect: () => {}, // No-op for display-only in SlideSection
            showThemeName: false, // We show the name in the header row
            showThemeSource: false, // We show source in our own row
            columns: 6
        });
        container.appendChild(this.themeSwatchesComponent.element);

        return container;
    }
    
    /**
     * Update the color mode (light/dark)
     * @param {string} mode - 'light' or 'dark'
     */
    updateColorMode(mode) {
        const state = store.getState();
        const themeMasterId = 'theme-default';
        const themeMaster = state.slideMasterPresets?.[themeMasterId];
        
        if (!themeMaster) return;
        
        // Dispatch the color mode change
        store.dispatch('SET_COLOR_MODE', {
            masterId: themeMasterId,
            colorMode: mode
        });
        
        // NOTE: CSS variables are NOT applied globally.
        // SlideView.update() applies per-slide CSS vars via StyleResolver.
        // The state-changed event from dispatch will trigger re-renders.
        document.dispatchEvent(new CustomEvent('style:color-mode-changed', {
            detail: { masterId: themeMasterId, colorMode: mode }
        }));
    }

    createTypographySectionContent() {
        const container = document.createElement('div');
        container.className = 'theme-typography-content';

        // Heading font row
        const headingRow = document.createElement('div');
        headingRow.className = 'theme-font-row';
        
        const headingLabel = document.createElement('span');
        headingLabel.className = 'theme-font-label';
        headingLabel.textContent = 'Heading';
        headingRow.appendChild(headingLabel);

        this.headingFontName = document.createElement('span');
        this.headingFontName.className = 'theme-font-name';
        this.headingFontName.textContent = 'Inter';
        headingRow.appendChild(this.headingFontName);

        this.headingFontPreview = document.createElement('span');
        this.headingFontPreview.className = 'theme-font-preview';
        this.headingFontPreview.textContent = 'Aa';
        headingRow.appendChild(this.headingFontPreview);

        container.appendChild(headingRow);

        // Body font row
        const bodyRow = document.createElement('div');
        bodyRow.className = 'theme-font-row';
        
        const bodyLabel = document.createElement('span');
        bodyLabel.className = 'theme-font-label';
        bodyLabel.textContent = 'Body';
        bodyRow.appendChild(bodyLabel);

        this.bodyFontName = document.createElement('span');
        this.bodyFontName.className = 'theme-font-name';
        this.bodyFontName.textContent = 'Inter';
        bodyRow.appendChild(this.bodyFontName);

        this.bodyFontPreview = document.createElement('span');
        this.bodyFontPreview.className = 'theme-font-preview';
        this.bodyFontPreview.textContent = 'Aa';
        bodyRow.appendChild(this.bodyFontPreview);

        container.appendChild(bodyRow);

        // Actions row
        const actionsRow = document.createElement('div');
        actionsRow.className = 'theme-detail-header theme-detail-actions';

        // Inheritance badge
        this.typoBadge = document.createElement('span');
        this.typoBadge.className = 'theme-detail-badge';
        actionsRow.appendChild(this.typoBadge);

        // Edit button
        const typoEditBtn = new Button({
            icon: '<i class="fa-solid fa-pen"></i>',
            variant: 'text',
            size: 'xs',
            title: 'Edit typography',
            className: 'theme-detail-edit',
            onClick: () => panelManager.toggle('typography-style-manager')
        });
        actionsRow.appendChild(typoEditBtn.element);

        // Reset button
        this.typoResetBtn = new Button({
            icon: '<i class="fa-solid fa-arrow-rotate-left"></i>',
            variant: 'text',
            size: 'xs',
            title: 'Reset to inherited',
            className: 'theme-detail-reset',
            onClick: () => this.resetTypography()
        });
        actionsRow.appendChild(this.typoResetBtn.element);

        container.appendChild(actionsRow);

        return container;
    }

    updateThemeDisplay() {
        const state = store.getState();
        const currentObject = this.getActiveContainer(state);
        if (!currentObject) return;

        // Get theme master for inherited values
        const themeMaster = Object.values(state.slideMasterPresets || {}).find(m => m.type === 'slideMasterPreset');
        if (!themeMaster || !themeMaster.themeSettings) return;

        // Use cascade-aware StyleResolver to get theme info
        const mode = state.editor.mode;
        let themeInfo;
        
        if (mode === 'master') {
            // For masters, we show the master's own theme (no cascade)
            const lumaTheme = themeMaster.themeSettings.lumaTheme || null;
            themeInfo = {
                lumaTheme,
                source: 'master',
                sourceLabel: 'Master theme',
                isInherited: false
            };
        } else {
            // For slides, use cascade-aware resolution
            const slideId = state.editor.activeSlideId;
            themeInfo = StyleResolver.getThemeInfoForSlide(slideId);
        }

        // Diagnostic logging
        const slideId = mode === 'master' ? null : state.editor.activeSlideId;
        ThemeDiag.logPropertyInspectorDisplay(slideId, themeInfo, mode);

        const themeFonts = themeMaster.themeSettings.fonts || {};

        // Check if slide has style assignment override (cascade-aware)
        const hasColorOverride = mode !== 'master' && 
            currentObject.styleAssignments?.colorTheme !== undefined && 
            currentObject.styleAssignments?.colorTheme !== null;
        const hasTypoOverride = currentObject.typographyOverride !== undefined;

        // Update Colors Section with cascade-aware theme info
        this.updateColorsSectionDisplay(themeInfo, hasColorOverride);

        // Update Typography Section
        this.updateTypographySectionDisplay(themeFonts, hasTypoOverride);
    }

    updateColorsSectionDisplay(themeInfo, isOverride) {
        const lumaTheme = themeInfo?.lumaTheme;
        
        // Update theme name from luma theme
        const themeName = lumaTheme?.name || 'Default';
        this.colorThemeName.textContent = themeName;
        
        // Diagnostic logging for Property Inspector display
        const state = store.getState();
        const slideId = state.editor.mode === 'master' ? null : state.editor.activeSlideId;
        ThemeDiag.logUIDisplay('PropertyInspector', {
            slideId,
            mode: state.editor.mode,
            displayedTheme: {
                name: themeName,
                id: lumaTheme?.id || null,
                source: themeInfo?.source,
                isOverride,
                isInherited: themeInfo?.isInherited
            }
        });

        // Update badge based on cascade source
        if (isOverride) {
            this.colorBadge.textContent = 'Override';
            this.colorBadge.className = 'theme-detail-badge override';
            this.colorResetBtn.element.style.display = 'flex';
        } else if (themeInfo?.isInherited) {
            this.colorBadge.textContent = 'Inherited';
            this.colorBadge.className = 'theme-detail-badge inherited';
            this.colorResetBtn.element.style.display = 'none';
        } else {
            this.colorBadge.textContent = '';
            this.colorBadge.className = 'theme-detail-badge';
            this.colorResetBtn.element.style.display = 'none';
        }

        // Update source indicator (cascade info)
        if (this.themeSourceIcon && this.themeSourceLabel) {
            if (themeInfo?.isInherited) {
                this.themeSourceIcon.textContent = '↑';
                this.themeSourceIcon.style.color = 'var(--color-text-tertiary)';
                this.themeSourceLabel.textContent = themeInfo.sourceLabel || 'from Master';
                this.themeSourceLabel.style.color = 'var(--color-text-tertiary)';
            } else if (isOverride) {
                this.themeSourceIcon.textContent = '◆';
                this.themeSourceIcon.style.color = 'var(--color-accent)';
                this.themeSourceLabel.textContent = 'slide-specific';
                this.themeSourceLabel.style.color = 'var(--color-accent)';
            } else {
                this.themeSourceIcon.textContent = '';
                this.themeSourceLabel.textContent = '';
            }
        }

        // NOTE: We no longer apply CSS variables globally here.
        // CSS variables are now applied per-slide in SlideView.update()
        // This prevents per-slide themes from polluting other slides.

        // Update mode toggle to reflect current color mode
        const colorMode = lumaTheme?.colorMode || COLOR_MODES.LIGHT;
        if (this.modeToggle && this.modeToggle.selectedValue !== colorMode) {
            this.modeToggle.selectedValue = colorMode;
            // Update visual state of toggle buttons
            Array.from(this.modeToggle.element.children).forEach((child, i) => {
                const option = this.modeToggle.options[i];
                if (colorMode === option.value) {
                    child.style.backgroundColor = 'var(--color-accent)';
                    child.style.color = 'var(--color-text-on-accent)';
                } else {
                    child.style.backgroundColor = 'transparent';
                    child.style.color = 'var(--color-text-primary)';
                }
            });
        }

        // ThemeSwatches component auto-updates from store via StyleResolver
        // Update its slideId to ensure cascade context is correct
        if (this.themeSwatchesComponent) {
            const state = store.getState();
            const slideId = state.editor.mode === 'master' ? null : state.editor.activeSlideId;
            this.themeSwatchesComponent.setSlideId(slideId);
        }
    }

    updateTypographySectionDisplay(fonts, isOverride) {
        const headingFont = fonts.heading || 'Inter';
        const bodyFont = fonts.body || 'Inter';

        // Update heading font
        this.headingFontName.textContent = headingFont;
        this.headingFontPreview.style.fontFamily = headingFont;

        // Update body font
        this.bodyFontName.textContent = bodyFont;
        this.bodyFontPreview.style.fontFamily = bodyFont;

        // Update badge
        if (isOverride) {
            this.typoBadge.textContent = 'Override';
            this.typoBadge.className = 'theme-detail-badge override';
            this.typoResetBtn.element.style.display = 'flex';
        } else {
            this.typoBadge.textContent = 'Inherited';
            this.typoBadge.className = 'theme-detail-badge inherited';
            this.typoResetBtn.element.style.display = 'none';
        }
    }

    updateInheritanceUI(row, isOverride) {
        // Kept for backward compatibility
        const { badge, resetBtn } = row;
        
        if (isOverride) {
            badge.textContent = 'Override';
            badge.style.display = 'inline-block';
            badge.classList.add('override');
            badge.classList.remove('inherited');
            resetBtn.style.display = 'flex';
        } else {
            badge.textContent = 'Inherited';
            badge.style.display = 'inline-block';
            badge.classList.add('inherited');
            badge.classList.remove('override');
            resetBtn.style.display = 'none';
        }
    }

    resetColors() {
        const state = store.getState();
        const mode = state.editor.mode;
        
        if (mode === 'master') {
            // For masters, clear colorOverride (legacy behavior)
            const id = state.editor.activeMasterId;
            store.dispatch('UPDATE_MASTER', { id, colorOverride: undefined });
        } else {
            // For slides, use the cascade-aware style assignment system
            const slideId = state.editor.activeSlideId;
            store.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
                slideId,
                styleAssignments: {
                    colorTheme: null // null = inherit from cascade
                }
            });
        }
        
        this.updateThemeDisplay();
    }

    resetTypography() {
        const state = store.getState();
        const mode = state.editor.mode;
        const action = mode === 'master' ? 'UPDATE_MASTER' : 'UPDATE_SLIDE';
        const id = mode === 'master' ? state.editor.activeMasterId : state.editor.activeSlideId;
        
        store.dispatch(action, { id, typographyOverride: undefined });
        this.updateThemeDisplay();
    }

    update(selection) {
        // This is shown when NO selection exists (or explicit slide selection)
        if (selection && selection.length > 0) {
            this.element.style.display = 'none';
            return;
        }
        
        this.element.style.display = 'block';
        
        const state = store.getState();
        const mode = state.editor.mode;
        const currentObject = this.getActiveContainer(state);

        if (!currentObject) return;

        // 0. Template Preset (Theme Master only)
        const isThemeMaster = mode === 'master' && currentObject.type === 'theme';
        if (isThemeMaster) {
            this.presetSection.element.style.display = 'block';
            // Update preset button label with current preset name
            const currentPresetId = currentObject.presetId || 'preset_minimal';
            const currentPreset = getPresetById(currentPresetId);
            this.presetTriggerBtn.setLabel(currentPreset ? currentPreset.name : 'Select Template');
            this.presetDescription.textContent = currentPreset?.description || '';
        } else {
            this.presetSection.element.style.display = 'none';
        }

        // 1. Name (Master only) - show standalone row
        if (mode === 'master') {
            this.nameRow.style.display = 'flex';
            this.nameInput.setValue(currentObject.name || '');
        } else {
            this.nameRow.style.display = 'none';
        }

        // 2. Layout Section (Slide only) - update title based on mode
        if (mode !== 'master') {
            this.layoutSection.element.style.display = 'block';
            this.layoutSection.element.querySelector('.pi-section-title').textContent = 'Layout';
            this.layoutRow.style.display = 'flex';
            
            // Update layout options for hidden dropdown
            const layouts = Object.values(state.slideMasterPresets || {}).filter(m => m.type === 'layoutMaster');
            const options = layouts.map(l => ({ label: l.name, value: l.id }));
            this.layoutSelect.setOptions(options);
            this.layoutSelect.setValue(currentObject.layoutId);
            
            // Update trigger button text with current layout name
            const currentLayout = layouts.find(l => l.id === currentObject.layoutId);
            this.layoutTriggerBtn.setLabel(currentLayout ? currentLayout.name : 'Select Layout');
            
            // Store current state for flyout
            this.currentLayouts = layouts;
            this.currentLayoutId = currentObject.layoutId;
            this.currentState = state;
        } else {
            // In master mode, show as "Dimensions" section (no layout picker)
            this.layoutSection.element.style.display = 'block';
            this.layoutSection.element.querySelector('.pi-section-title').textContent = 'Dimensions';
            this.layoutRow.style.display = 'none';
        }

        // 3. Dimensions
        this.wInput.setValue(currentObject.width, false);
        this.hInput.setValue(currentObject.height, false);

        // 4. Theme Display
        this.updateThemeDisplay();

        // 5. Background
        const bg = currentObject.background;
        let fills = [];
        
        if (Array.isArray(bg)) {
            fills = bg;
        } else if (bg && bg.type !== 'inherited') {
             fills = [{
                 type: bg.type,
                 value: bg.value,
                 color: bg.value,
                 opacity: 100,
                 visible: true
             }];
        }
        
        // Get inherited background for display
        const inheritedBg = this.getInheritedBackground(state, currentObject);
        
        const proxyElement = {
            id: currentObject.id,
            style: {
                fills: fills
            },
            // Pass inherited info to FillSection
            inheritedFill: inheritedBg,
            hasOwnBackground: bg !== null && bg !== undefined && (Array.isArray(bg) ? bg.length > 0 : bg.type !== 'inherited')
        };
        
        this.fillSection.update([proxyElement]);
    }

    /**
     * Resolve the inherited background from layout or master
     */
    getInheritedBackground(state, currentObject) {
        const mode = state.editor.mode;
        
        if (mode === 'master') {
            // Masters don't inherit (except layouts from theme master)
            const master = currentObject;
            if (master.type === 'layoutMaster' && master.parentMasterId) {
                const themeMaster = state.slideMasterPresets[master.parentMasterId];
                if (themeMaster && themeMaster.background) {
                    return this.normalizeFill(themeMaster.background);
                }
            }
            return null;
        } else {
            // Slides inherit from layout, which may inherit from theme master
            const slide = currentObject;
            const layout = state.slideMasterPresets[slide.layoutId];
            
            if (layout) {
                // Check if layout has its own background
                if (layout.background && layout.background.type !== 'inherited') {
                    return this.normalizeFill(layout.background);
                }
                
                // Otherwise, get from theme master
                if (layout.parentMasterId) {
                    const themeMaster = state.slideMasterPresets[layout.parentMasterId];
                    if (themeMaster && themeMaster.background) {
                        return this.normalizeFill(themeMaster.background);
                    }
                }
            }
            return null;
        }
    }

    /**
     * Normalize background object to a fill object format
     */
    normalizeFill(bg) {
        if (!bg) return null;
        
        if (Array.isArray(bg)) {
            // If it's already an array, return the first visible fill
            const visible = bg.find(f => f.visible !== false);
            return visible || bg[0] || null;
        }
        
        return {
            type: bg.type || 'solid',
            value: bg.value,
            color: bg.value,
            opacity: 100,
            visible: true
        };
    }

    getActiveContainer(state) {
        if (state.editor.mode === 'master') {
            return state.slideMasterPresets[state.editor.activeMasterId];
        } else {
            return state.slides[state.editor.activeSlideId];
        }
    }

    updateName(name) {
        const state = store.getState();
        const id = state.editor.activeMasterId;
        store.dispatch('UPDATE_MASTER', { id, name });
    }

    updateLayout(layoutId) {
        const state = store.getState();
        const id = state.editor.activeSlideId;
        store.dispatch('UPDATE_SLIDE', { id, layoutId });
    }

    updateDimension(prop, val, isTransient = false) {
        const state = store.getState();
        const mode = state.editor.mode;
        const action = mode === 'master' ? 'UPDATE_MASTER' : 'UPDATE_SLIDE';
        const id = mode === 'master' ? state.editor.activeMasterId : state.editor.activeSlideId;
        
        store.dispatch(action, { id, [prop]: Math.max(100, val) }, { skipHistory: isTransient });
    }

    updateBackground(fills, isTransient) {
        const state = store.getState();
        const mode = state.editor.mode;
        const action = mode === 'master' ? 'UPDATE_MASTER' : 'UPDATE_SLIDE';
        const id = mode === 'master' ? state.editor.activeMasterId : state.editor.activeSlideId;
        
        // If fills is empty, set to null to inherit from parent
        const background = (fills && fills.length > 0) ? fills : null;
        
        store.dispatch(action, { id, background }, { skipHistory: isTransient });
    }
    
    openLayoutFlyout() {
        // Create flyout content
        const content = document.createElement('div');
        content.className = 'layout-flyout-content';
        
        // Title
        const title = document.createElement('div');
        title.className = 'layout-flyout-title';
        title.textContent = 'Select Layout';
        content.appendChild(title);
        
        // Grid container
        const grid = document.createElement('div');
        grid.className = 'layout-flyout-grid';
        
        // Populate with layouts
        const layouts = this.currentLayouts || [];
        const currentLayoutId = this.currentLayoutId;
        const state = this.currentState;
        
        layouts.forEach(layout => {
            const thumbnail = document.createElement('div');
            thumbnail.className = 'layout-thumbnail' + (layout.id === currentLayoutId ? ' selected' : '');
            thumbnail.dataset.layoutId = layout.id;
            thumbnail.title = layout.name;
            
            // Get effective layout data (with theme inheritance)
            const effectiveLayout = store.getEffectiveSlide(layout.id);
            
            // Create accurate preview using ThumbnailRenderer
            const preview = ThumbnailRenderer.createThumbnail(layout.id, effectiveLayout);
            preview.className = 'layout-preview';
            
            thumbnail.appendChild(preview);
            
            // Label
            const label = document.createElement('div');
            label.className = 'layout-label';
            label.textContent = layout.name;
            thumbnail.appendChild(label);
            
            // Click handler
            thumbnail.addEventListener('click', () => {
                if (layout.id !== currentLayoutId) {
                    this.layoutSelect.setValue(layout.id);
                    this.updateLayout(layout.id);
                    // Update button text
                    this.layoutTriggerBtn.setLabel(layout.name);
                }
                // Close flyout
                if (this.layoutFlyout) {
                    this.layoutFlyout.close();
                }
            });
            
            grid.appendChild(thumbnail);
        });
        
        content.appendChild(grid);
        
        // Create or update flyout
        if (this.layoutFlyout) {
            this.layoutFlyout.close();
        }
        
        this.layoutFlyout = new Flyout({
            trigger: this.layoutTrigger,
            content: content,
            position: 'left'
        });
        
        this.layoutFlyout.open();
    }

    openPresetFlyout() {
        // Create flyout content
        const content = document.createElement('div');
        content.className = 'preset-flyout-content';
        
        // Title
        const title = document.createElement('div');
        title.className = 'preset-flyout-title';
        title.textContent = 'Select Template';
        content.appendChild(title);
        
        // Grid container
        const grid = document.createElement('div');
        grid.className = 'preset-flyout-grid';
        
        // Get current preset
        const state = store.getState();
        const themeMaster = state.slideMasterPresets[state.editor.activeMasterId];
        const currentPresetId = themeMaster?.presetId || 'preset_minimal';
        
        // Populate with presets
        const presets = getPresetList();
        
        presets.forEach(preset => {
            const thumbnail = document.createElement('div');
            thumbnail.className = 'preset-thumbnail' + (preset.id === currentPresetId ? ' selected' : '');
            thumbnail.dataset.presetId = preset.id;
            thumbnail.title = preset.name;
            
            // Create preview with background color
            const preview = document.createElement('div');
            preview.className = 'preset-preview';
            
            // Set background from preset's background fill
            const bgFill = preset.background?.[0];
            if (bgFill) {
                if (bgFill.themeSlot) {
                    // Use theme color from preset's theme
                    const themePreset = this.getThemePresetColors(preset.colorThemeId);
                    if (themePreset) {
                        const slot = themePreset.slots[bgFill.themeSlot - 1];
                        if (slot) {
                            preview.style.backgroundColor = slot.hex;
                        }
                    }
                } else if (bgFill.value) {
                    preview.style.backgroundColor = bgFill.value;
                }
            }
            
            // Add accent color swatches to preview
            const swatches = document.createElement('div');
            swatches.className = 'preset-swatches';
            
            const themePreset = this.getThemePresetColors(preset.colorThemeId);
            if (themePreset) {
                // Show first 4 accent colors
                [1, 2, 3, 4].forEach(slotIndex => {
                    const slot = themePreset.slots[slotIndex - 1];
                    if (slot) {
                        const swatch = document.createElement('div');
                        swatch.className = 'preset-swatch';
                        swatch.style.backgroundColor = slot.hex;
                        swatches.appendChild(swatch);
                    }
                });
            }
            preview.appendChild(swatches);
            
            thumbnail.appendChild(preview);
            
            // Label
            const label = document.createElement('div');
            label.className = 'preset-label';
            label.textContent = preset.name;
            thumbnail.appendChild(label);
            
            // Click handler
            thumbnail.addEventListener('click', () => {
                if (preset.id !== currentPresetId) {
                    this.applyPreset(preset.id);
                    // Update button text
                    this.presetTriggerBtn.setLabel(preset.name);
                }
                // Close flyout
                if (this.presetFlyout) {
                    this.presetFlyout.close();
                }
            });
            
            grid.appendChild(thumbnail);
        });
        
        content.appendChild(grid);
        
        // Create or update flyout
        if (this.presetFlyout) {
            this.presetFlyout.close();
        }
        
        this.presetFlyout = new Flyout({
            trigger: this.presetTrigger,
            content: content,
            position: 'left'
        });
        
        this.presetFlyout.open();
    }

    getThemePresetColors(colorThemeId) {
        // Use the imported THEME_PRESETS to get color values for previews
        return THEME_PRESETS.find(p => p.id === colorThemeId);
    }

    applyPreset(presetId) {
        const state = store.getState();
        const themeMasterId = state.editor.activeMasterId;
        
        // Get the full preset to access computed hex colors
        const fullPreset = getFullPresetById(presetId);
        
        // First dispatch the store action to update the state
        store.dispatch('APPLY_SLIDE_MASTER_PRESET', { 
            masterId: themeMasterId, 
            presetId 
        });
        
        // After dispatch, update panels (CSS vars are applied per-slide by SlideView)
        if (fullPreset) {
            const lumaTheme = fullPreset.theme.themeSettings?.lumaTheme;
            
            // NOTE: CSS variables are NOT applied globally.
            // SlideView.update() applies per-slide CSS vars via StyleResolver.
            // Dispatch event to notify listeners that the master theme changed.
            if (lumaTheme?.id) {
                document.dispatchEvent(new CustomEvent('style:theme-updated', {
                    detail: { masterId: themeMasterId, themeId: lumaTheme.id, affectedSlides: 'all' }
                }));
            }
            
            // Update ColorThemeManager to show the selected color theme
            const colorThemeManager = panelManager.get('color-theme-manager');
            if (colorThemeManager && lumaTheme?.id) {
                // Just update the visual selection without triggering another store dispatch
                colorThemeManager.selectedThemeId = lumaTheme.id;
                colorThemeManager.renderThemeList();
                colorThemeManager.renderThemeEditor();
            }
            
            // Force a full state refresh to ensure all UI components update
            // This emits 'state-changed' again to re-render PropertyInspector
            // Use setTimeout to allow CSS variables to propagate first
            setTimeout(() => {
                store.emit('state-changed', store.getState());
                store.emit('selection-changed');
            }, 0);
        }
    }

    setupThemeListener() {
        const updateTheme = (theme) => {
            const isLight = theme === 'light';
            // Target the layout trigger button element
            if (this.layoutTriggerBtn && this.layoutTriggerBtn.element) {
                if (isLight) {
                    this.layoutTriggerBtn.element.style.setProperty('transition', 'none', 'important');
                    this.layoutTriggerBtn.element.style.setProperty('background-color', '#FFFFFF', 'important');
                    this.layoutTriggerBtn.element.style.setProperty('color', '#333333', 'important');
                    this.layoutTriggerBtn.element.style.setProperty('border-color', '#E0E0E0', 'important');
                } else {
                    this.layoutTriggerBtn.element.style.removeProperty('background-color');
                    this.layoutTriggerBtn.element.style.removeProperty('color');
                    this.layoutTriggerBtn.element.style.removeProperty('border-color');
                    this.layoutTriggerBtn.element.style.removeProperty('transition');
                }
            }
        };

        // Initial check
        const initialTheme = localStorage.getItem('story-theme') || localStorage.getItem('themeMode');
        updateTheme(initialTheme);

        // Listen for changes
        window.addEventListener('theme-changed', (e) => updateTheme(e.detail.theme));
    }
}
