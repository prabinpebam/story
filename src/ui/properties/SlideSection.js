import { Section } from '../components/Section.js';
import { TextInput } from '../components/TextInput.js';
import { NumberInput } from '../components/NumberInput.js';
import { Dropdown } from '../components/Dropdown.js';
import { Switch } from '../components/Switch.js';
import { Flyout } from '../components/Flyout.js';
import { store } from '../../core/Store.js';
import { FillSection } from './FillSection.js';
import { panelManager } from '../PanelManager.js';
import { Icons } from '../Icons.js';

export class SlideSection {
    constructor() {
        this.section = new Section({ title: 'Slide' });
        this.layoutFlyout = null;
        
        this.fillSection = new FillSection({
            title: 'Slide Background',
            manualVisibility: true,
            getElement: (selection) => selection[0],
            onUpdate: (fills, isTransient) => this.updateBackground(fills, isTransient)
        });

        this.createContent();
    }

    createContent() {
        // 1. Name (Master Mode)
        this.nameRow = document.createElement('div');
        this.nameRow.className = 'pi-row';
        this.nameInput = new TextInput({
            placeholder: 'Name',
            onChange: (val) => this.updateName(val)
        });
        this.nameRow.appendChild(this.nameInput.element);
        this.section.appendChild(this.nameRow);

        // 2. Layout Picker (Slide Mode) - Using flyout
        this.layoutRow = document.createElement('div');
        this.layoutRow.className = 'pi-row';
        this.layoutRow.style.cssText = 'flex-direction: column; align-items: stretch; gap: 4px;';
        
        // Layout label
        const layoutLabel = document.createElement('span');
        layoutLabel.style.cssText = 'font-size: var(--font-size-sm); color: var(--color-text-secondary);';
        layoutLabel.textContent = 'Layout';
        this.layoutRow.appendChild(layoutLabel);
        
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
        
        this.section.appendChild(this.layoutRow);

        // Remove old grid rows - no longer needed inline
        // (flyout will contain the grid)

        // 3. Hide Graphics Toggle
        this.hideGraphicsRow = document.createElement('div');
        this.hideGraphicsRow.style.marginBottom = 'var(--spacing-2)';
        this.hideGraphicsSwitch = new Switch('Hide Background Graphics', false, (val) => {
            this.updateHideGraphics(val);
        });
        this.hideGraphicsRow.appendChild(this.hideGraphicsSwitch.element);
        this.section.appendChild(this.hideGraphicsRow);

        // 4. Dimensions
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
        this.section.appendChild(dimRow);

        // 5. Theme Button Row
        this.themeRow = document.createElement('div');
        this.themeRow.className = 'pi-row';
        this.themeRow.style.cssText = 'margin-top: var(--spacing-2); padding-top: var(--spacing-2); border-top: 1px solid var(--color-border);';
        
        const themeLabel = document.createElement('div');
        themeLabel.style.cssText = 'flex: 1; font-size: var(--font-size-sm); color: var(--color-text-secondary);';
        themeLabel.textContent = 'Theme';
        this.themeRow.appendChild(themeLabel);
        
        // Button container for Colors and Typography
        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = 'display: flex; gap: var(--spacing-1);';
        
        const colorBtn = document.createElement('button');
        colorBtn.className = 'theme-manager-btn';
        colorBtn.innerHTML = `${Icons.PALETTE || '<i class="fa-solid fa-palette"></i>'} <span>Colors</span>`;
        colorBtn.title = 'Open Color Theme Manager (Ctrl+Shift+C)';
        colorBtn.style.cssText = `
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 4px 8px;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-sm);
            background: var(--color-bg-well);
            color: var(--color-text-primary);
            font-size: var(--font-size-sm);
            cursor: pointer;
            transition: background 0.15s;
        `;
        colorBtn.addEventListener('mouseenter', () => {
            colorBtn.style.background = 'var(--color-bg-hover)';
        });
        colorBtn.addEventListener('mouseleave', () => {
            colorBtn.style.background = 'var(--color-bg-well)';
        });
        colorBtn.addEventListener('click', () => {
            panelManager.toggle('color-theme-manager');
        });
        btnContainer.appendChild(colorBtn);
        
        const typoBtn = document.createElement('button');
        typoBtn.className = 'theme-manager-btn';
        typoBtn.innerHTML = `${Icons.FONT || '<i class="fa-solid fa-font"></i>'} <span>Fonts</span>`;
        typoBtn.title = 'Open Typography Style Manager (Ctrl+Shift+T)';
        typoBtn.style.cssText = `
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 4px 8px;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-sm);
            background: var(--color-bg-well);
            color: var(--color-text-primary);
            font-size: var(--font-size-sm);
            cursor: pointer;
            transition: background 0.15s;
        `;
        typoBtn.addEventListener('mouseenter', () => {
            typoBtn.style.background = 'var(--color-bg-hover)';
        });
        typoBtn.addEventListener('mouseleave', () => {
            typoBtn.style.background = 'var(--color-bg-well)';
        });
        typoBtn.addEventListener('click', () => {
            panelManager.toggle('typography-style-manager');
        });
        btnContainer.appendChild(typoBtn);
        
        this.themeRow.appendChild(btnContainer);
        this.section.appendChild(this.themeRow);

        // 6. Background (FillSection) - Removed from here to avoid nesting. 
        // It will be appended separately in PropertyInspector.
    }

    update(selection) {
        // This section is shown when NO selection exists (or explicit slide selection)
        if (selection && selection.length > 0) {
            this.section.element.style.display = 'none';
            return;
        }
        
        this.section.element.style.display = 'block';
        
        const state = store.getState();
        const mode = state.editor.mode;
        const currentObject = this.getActiveContainer(state);

        if (!currentObject) return;

        // Update Title
        this.section.options.title = mode === 'master' ? 'Master / Layout' : 'Slide';
        this.section.element.querySelector('.pi-section-title').textContent = this.section.options.title;

        // 1. Name (Master only)
        if (mode === 'master') {
            this.nameRow.style.display = 'flex';
            this.nameInput.setValue(currentObject.name || '');
        } else {
            this.nameRow.style.display = 'none';
        }

        // 2. Layout Picker (Slide only)
        if (mode !== 'master') {
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
            this.layoutRow.style.display = 'none';
        }

        // 3. Hide Graphics
        if ((mode === 'master' && currentObject.type === 'layout') || mode === 'edit') {
            this.hideGraphicsRow.style.display = 'block';
            // Update switch value (need to add setValue to Switch component or recreate)
            // For now, let's assume we can recreate or update manually
            // this.hideGraphicsSwitch.setValue(currentObject.hideBackgroundGraphics);
        } else {
            this.hideGraphicsRow.style.display = 'none';
        }

        // 4. Dimensions
        this.wInput.setValue(currentObject.width, false);
        this.hInput.setValue(currentObject.height, false);

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
        
        const proxyElement = {
            id: currentObject.id,
            style: {
                fills: fills
            }
        };
        
        this.fillSection.update([proxyElement]);
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

    updateHideGraphics(val) {
        const state = store.getState();
        const mode = state.editor.mode;
        const action = mode === 'master' ? 'UPDATE_MASTER' : 'UPDATE_SLIDE';
        const id = mode === 'master' ? state.editor.activeMasterId : state.editor.activeSlideId;
        
        store.dispatch(action, { id, hideBackgroundGraphics: val });
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
        
        store.dispatch(action, { id, background: fills }, { skipHistory: isTransient });
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
