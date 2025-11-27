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
        // Theme as a proper pi-section
        this.themeSection = new Section({ title: 'Theme' });

        // Colors Row
        this.colorsRow = this.createThemeRow({
            label: 'Colors',
            icon: Icons.PALETTE || '<i class="fa-solid fa-palette"></i>',
            onClick: () => panelManager.toggle('color-theme-manager'),
            onReset: () => this.resetColors()
        });
        this.themeSection.appendChild(this.colorsRow.element);

        // Typography Row
        this.typographyRow = this.createThemeRow({
            label: 'Typography',
            icon: Icons.FONT || '<i class="fa-solid fa-font"></i>',
            onClick: () => panelManager.toggle('typography-style-manager'),
            onReset: () => this.resetTypography()
        });
        this.themeSection.appendChild(this.typographyRow.element);

        this.element.appendChild(this.themeSection.element);
    }

    createThemeRow(options) {
        const row = document.createElement('div');
        row.className = 'theme-property-row';
        // CSS handles: display: flex; align-items: center; gap; padding; border-radius; cursor; transition
        // CSS also handles :hover state
        row.addEventListener('click', (e) => {
            if (!e.target.closest('.theme-row-reset')) {
                options.onClick();
            }
        });

        // Icon
        const icon = document.createElement('span');
        icon.className = 'theme-row-icon';
        icon.innerHTML = options.icon;
        row.appendChild(icon);

        // Label
        const label = document.createElement('span');
        label.className = 'theme-row-label';
        label.textContent = options.label;
        row.appendChild(label);

        // Preview container (will be populated by update)
        const preview = document.createElement('div');
        preview.className = 'theme-row-preview';
        row.appendChild(preview);

        // Inheritance badge
        const badge = document.createElement('span');
        badge.className = 'theme-row-badge';
        badge.style.display = 'none';
        row.appendChild(badge);

        // Reset button
        const resetBtn = document.createElement('button');
        resetBtn.className = 'theme-row-reset';
        resetBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        resetBtn.title = 'Reset to inherited';
        resetBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            options.onReset();
        });
        row.appendChild(resetBtn);

        return { element: row, preview, badge, resetBtn };
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

        // Check if slide has overrides
        const hasColorOverride = currentObject.colorOverride !== undefined;
        const hasTypoOverride = currentObject.typographyOverride !== undefined;

        // Update Colors Row
        this.updateColorsPreview(themeColors, hasColorOverride);

        // Update Typography Row
        this.updateTypographyPreview(themeFonts, hasTypoOverride);
    }

    updateColorsPreview(colors, isOverride) {
        const preview = this.colorsRow.preview;
        preview.innerHTML = '';

        // Show accent color swatches (up to 6)
        const accentColors = [
            colors.accent1, colors.accent2, colors.accent3,
            colors.accent4, colors.accent5, colors.accent6
        ].filter(Boolean);

        accentColors.slice(0, 6).forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'theme-preview-swatch';
            swatch.style.background = color; // Color must be inline
            preview.appendChild(swatch);
        });

        // Update badge and reset button
        this.updateInheritanceUI(this.colorsRow, isOverride);
    }

    updateTypographyPreview(fonts, isOverride) {
        const preview = this.typographyRow.preview;
        preview.innerHTML = '';

        // Show font names
        const fontLabel = document.createElement('span');
        fontLabel.className = 'theme-preview-fonts';
        fontLabel.textContent = `${fonts.heading || 'Inter'} / ${fonts.body || 'Inter'}`;
        preview.appendChild(fontLabel);

        // Update badge and reset button
        this.updateInheritanceUI(this.typographyRow, isOverride);
    }

    updateInheritanceUI(row, isOverride) {
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
