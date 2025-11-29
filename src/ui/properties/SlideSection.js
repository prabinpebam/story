import { Section } from '../components/Section.js';
import { TextInput } from '../components/TextInput.js';
import { NumberInput } from '../components/NumberInput.js';
import { Dropdown } from '../components/Dropdown.js';
import { Flyout } from '../components/Flyout.js';
import { store } from '../../core/Store.js';
import { FillSection } from './FillSection.js';
import { panelManager } from '../PanelManager.js';
import { Icons } from '../Icons.js';

export class SlideSection {
    constructor() {
        // Container for all slide-related sections (no outer wrapper section)
        this.element = document.createElement('div');
        this.element.className = 'slide-properties';
        
        this.layoutFlyout = null;
        
        this.fillSection = new FillSection({
            title: 'Background',
            manualVisibility: true,
            getElement: (selection) => selection[0],
            onUpdate: (fills, isTransient) => this.updateBackground(fills, isTransient)
        });

        this.createContent();
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

        // 2. Layout Section (Slide Mode)
        this.layoutSection = new Section({ title: 'Layout' });
        
        // Layout picker row
        this.layoutRow = document.createElement('div');
        this.layoutRow.className = 'pi-row layout-picker-row';
        
        // Layout trigger button (shows current layout)
        this.layoutTrigger = document.createElement('button');
        this.layoutTrigger.className = 'layout-trigger-btn';
        this.layoutTrigger.addEventListener('click', () => this.openLayoutFlyout());
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

        // Inheritance badge
        this.colorBadge = document.createElement('span');
        this.colorBadge.className = 'theme-detail-badge';
        headerRow.appendChild(this.colorBadge);

        // Edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'theme-detail-edit';
        editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
        editBtn.title = 'Edit colors';
        editBtn.addEventListener('click', () => panelManager.toggle('color-theme-manager'));
        headerRow.appendChild(editBtn);

        // Reset button
        this.colorResetBtn = document.createElement('button');
        this.colorResetBtn.className = 'theme-detail-reset';
        this.colorResetBtn.innerHTML = '<i class="fa-solid fa-arrow-rotate-left"></i>';
        this.colorResetBtn.title = 'Reset to inherited';
        this.colorResetBtn.addEventListener('click', () => this.resetColors());
        headerRow.appendChild(this.colorResetBtn);

        container.appendChild(headerRow);

        // Swatches preview
        this.colorSwatches = document.createElement('div');
        this.colorSwatches.className = 'theme-swatches-preview';
        container.appendChild(this.colorSwatches);

        return container;
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
        const editBtn = document.createElement('button');
        editBtn.className = 'theme-detail-edit';
        editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
        editBtn.title = 'Edit typography';
        editBtn.addEventListener('click', () => panelManager.toggle('typography-style-manager'));
        actionsRow.appendChild(editBtn);

        // Reset button
        this.typoResetBtn = document.createElement('button');
        this.typoResetBtn.className = 'theme-detail-reset';
        this.typoResetBtn.innerHTML = '<i class="fa-solid fa-arrow-rotate-left"></i>';
        this.typoResetBtn.title = 'Reset to inherited';
        this.typoResetBtn.addEventListener('click', () => this.resetTypography());
        actionsRow.appendChild(this.typoResetBtn);

        container.appendChild(actionsRow);

        return container;
    }

    updateThemeDisplay() {
        const state = store.getState();
        const currentObject = this.getActiveContainer(state);
        if (!currentObject) return;

        // Get theme master for inherited values
        const themeMaster = Object.values(state.masters).find(m => m.type === 'theme');
        if (!themeMaster || !themeMaster.themeSettings) return;

        const themeColors = themeMaster.themeSettings.colors || {};
        const themeFonts = themeMaster.themeSettings.fonts || {};
        const themeName = themeMaster.themeSettings.name || 'Default Theme';

        // Check if slide has overrides
        const hasColorOverride = currentObject.colorOverride !== undefined;
        const hasTypoOverride = currentObject.typographyOverride !== undefined;

        // Update Colors Section
        this.updateColorsSectionDisplay(themeColors, themeName, hasColorOverride);

        // Update Typography Section
        this.updateTypographySectionDisplay(themeFonts, hasTypoOverride);
    }

    updateColorsSectionDisplay(colors, themeName, isOverride) {
        // Update theme name
        this.colorThemeName.textContent = themeName;

        // Update badge
        if (isOverride) {
            this.colorBadge.textContent = 'Override';
            this.colorBadge.className = 'theme-detail-badge override';
            this.colorResetBtn.style.display = 'flex';
        } else {
            this.colorBadge.textContent = 'Inherited';
            this.colorBadge.className = 'theme-detail-badge inherited';
            this.colorResetBtn.style.display = 'none';
        }

        // Update swatches preview
        this.colorSwatches.innerHTML = '';

        // Create two rows: backgrounds/text and accents
        const bgTextRow = document.createElement('div');
        bgTextRow.className = 'theme-swatch-row';
        
        // Background & Text colors
        const bgTextColors = [
            { color: colors.background1, label: 'BG1' },
            { color: colors.background2, label: 'BG2' },
            { color: colors.text1, label: 'Text1' },
            { color: colors.text2, label: 'Text2' }
        ];

        bgTextColors.forEach(item => {
            if (item.color) {
                const swatch = this.createColorSwatch(item.color, item.label);
                bgTextRow.appendChild(swatch);
            }
        });

        this.colorSwatches.appendChild(bgTextRow);

        // Accent colors row
        const accentRow = document.createElement('div');
        accentRow.className = 'theme-swatch-row';
        
        const accentColors = [
            colors.accent1, colors.accent2, colors.accent3,
            colors.accent4, colors.accent5, colors.accent6
        ].filter(Boolean);

        accentColors.forEach((color, i) => {
            const swatch = this.createColorSwatch(color, `Accent ${i + 1}`);
            accentRow.appendChild(swatch);
        });

        this.colorSwatches.appendChild(accentRow);
    }

    createColorSwatch(color, label) {
        const swatch = document.createElement('div');
        swatch.className = 'theme-color-swatch';
        swatch.style.background = color;
        swatch.title = label;
        return swatch;
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
            this.typoResetBtn.style.display = 'flex';
        } else {
            this.typoBadge.textContent = 'Inherited';
            this.typoBadge.className = 'theme-detail-badge inherited';
            this.typoResetBtn.style.display = 'none';
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
        const action = mode === 'master' ? 'UPDATE_MASTER' : 'UPDATE_SLIDE';
        const id = mode === 'master' ? state.editor.activeMasterId : state.editor.activeSlideId;
        
        store.dispatch(action, { id, colorOverride: undefined });
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
            const layouts = Object.values(state.masters).filter(m => m.type === 'layout');
            const options = layouts.map(l => ({ label: l.name, value: l.id }));
            this.layoutSelect.setOptions(options);
            this.layoutSelect.setValue(currentObject.layoutId);
            
            // Update trigger button text with current layout name
            const currentLayout = layouts.find(l => l.id === currentObject.layoutId);
            this.layoutTrigger.textContent = currentLayout ? currentLayout.name : 'Select Layout';
            
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
            if (master.type === 'layout' && master.parentId) {
                const themeMaster = state.masters[master.parentId];
                if (themeMaster && themeMaster.background) {
                    return this.normalizeFill(themeMaster.background);
                }
            }
            return null;
        } else {
            // Slides inherit from layout, which may inherit from theme master
            const slide = currentObject;
            const layout = state.masters[slide.layoutId];
            
            if (layout) {
                // Check if layout has its own background
                if (layout.background && layout.background.type !== 'inherited') {
                    return this.normalizeFill(layout.background);
                }
                
                // Otherwise, get from theme master
                if (layout.parentId) {
                    const themeMaster = state.masters[layout.parentId];
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
            return state.masters[state.editor.activeMasterId];
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
            
            // Create preview
            const preview = document.createElement('div');
            preview.className = 'layout-preview';
            
            // Draw placeholder representations
            if (layout.elements) {
                Object.values(layout.elements).forEach(el => {
                    if (el.isPlaceholder) {
                        const placeholder = document.createElement('div');
                        placeholder.className = 'layout-placeholder';
                        
                        // Scale down to thumbnail size
                        const scale = 80 / 1920;
                        placeholder.style.left = (el.x * scale) + 'px';
                        placeholder.style.top = (el.y * scale) + 'px';
                        placeholder.style.width = (el.width * scale) + 'px';
                        placeholder.style.height = (el.height * scale) + 'px';
                        
                        preview.appendChild(placeholder);
                    }
                });
            }
            
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
                    this.layoutTrigger.textContent = layout.name;
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
}
