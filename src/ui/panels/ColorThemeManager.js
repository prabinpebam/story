/**
 * ColorThemeManager.js
 * A draggable panel for managing color themes with presets, custom colors, and AI generation.
 */

import { DraggablePanel } from '../components/DraggablePanel.js';
import { SegmentedControl } from '../components/SegmentedControl.js';
import { Dropdown } from '../components/Dropdown.js';
import { ColorInput } from '../components/ColorInput.js';
import { store } from '../../core/Store.js';
import { COLOR_PRESETS, COLOR_CATEGORIES, getPresetsByCategory, searchPresets } from '../../core/constants/ColorPresets.js';

/**
 * Color role definitions for the Custom tab
 */
const COLOR_ROLES = [
    { id: 'background1', name: 'Background 1', description: 'Primary background' },
    { id: 'background2', name: 'Background 2', description: 'Secondary background' },
    { id: 'text1', name: 'Text Primary', description: 'Main text color' },
    { id: 'text2', name: 'Text Secondary', description: 'Secondary text color' },
    { id: 'accent1', name: 'Accent 1', description: 'Primary accent' },
    { id: 'accent2', name: 'Accent 2', description: 'Secondary accent' },
    { id: 'accent3', name: 'Accent 3', description: 'Tertiary accent' },
    { id: 'accent4', name: 'Accent 4', description: 'Fourth accent' },
    { id: 'accent5', name: 'Accent 5', description: 'Fifth accent' },
    { id: 'accent6', name: 'Accent 6', description: 'Sixth accent' },
    { id: 'hyperlink', name: 'Hyperlink', description: 'Unvisited link color' },
    { id: 'followedHyperlink', name: 'Visited Link', description: 'Visited link color' }
];

export class ColorThemeManager extends DraggablePanel {
    constructor() {
        super({
            id: 'color-theme-manager',
            title: 'Color Theme',
            defaultWidth: 320,
            defaultHeight: 520,
            minWidth: 280,
            minHeight: 400,
            maxWidth: 500,
            maxHeight: 800
        });
        
        this.activeTab = 'presets';
        this.selectedPreset = null;
        this.currentCategory = 'all';
        this.searchQuery = '';
        this.originalColors = null; // For preview/cancel
        
        this.buildUI();
    }

    buildUI() {
        // Create tab control
        this.tabControl = new SegmentedControl({
            options: [
                { value: 'presets', label: 'Presets' },
                { value: 'custom', label: 'Custom' },
                { value: 'ai', label: 'AI' }
            ],
            value: 'presets',
            onChange: (tab) => this.switchTab(tab)
        });
        
        // Insert tabs after header title but before buttons
        const tabContainer = document.createElement('div');
        tabContainer.className = 'ctm-tabs';
        tabContainer.style.cssText = `
            padding: 0 var(--spacing-2) var(--spacing-2);
            background: var(--color-bg-hover);
        `;
        tabContainer.appendChild(this.tabControl.element);
        this.tabControl.element.style.marginBottom = '0';
        
        // Insert after header
        this.element.insertBefore(tabContainer, this.contentElement);
        
        // Create tab content containers
        this.presetsContent = this.createPresetsTab();
        this.customContent = this.createCustomTab();
        this.aiContent = this.createAITab();
        
        this.contentElement.appendChild(this.presetsContent);
        this.contentElement.appendChild(this.customContent);
        this.contentElement.appendChild(this.aiContent);
        
        // Create footer
        this.footerElement = this.createFooter();
        this.element.appendChild(this.footerElement);
        
        // Show initial tab
        this.switchTab('presets');
    }

    // ========================================
    // PRESETS TAB
    // ========================================
    createPresetsTab() {
        const container = document.createElement('div');
        container.className = 'ctm-presets-tab';
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: var(--spacing-2);
            height: 100%;
        `;
        
        // Search and filter row
        const filterRow = document.createElement('div');
        filterRow.style.cssText = `
            display: flex;
            gap: var(--spacing-2);
            padding-bottom: var(--spacing-2);
            border-bottom: 1px solid var(--color-border);
        `;
        
        // Search input
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search themes...';
        searchInput.className = 'ctm-search';
        searchInput.style.cssText = `
            flex: 1;
            padding: 6px 8px;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-sm);
            background: var(--color-bg-input);
            color: var(--color-text-primary);
            font-size: var(--font-size-sm);
            outline: none;
        `;
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.renderPresetGrid();
        });
        searchInput.addEventListener('focus', () => {
            searchInput.style.borderColor = 'var(--color-border-focus)';
        });
        searchInput.addEventListener('blur', () => {
            searchInput.style.borderColor = 'var(--color-border)';
        });
        filterRow.appendChild(searchInput);
        
        // Category dropdown
        this.categoryDropdown = new Dropdown({
            options: COLOR_CATEGORIES.map(c => ({ value: c.id, label: c.name })),
            value: 'all',
            onChange: (category) => {
                this.currentCategory = category;
                this.renderPresetGrid();
            }
        });
        this.categoryDropdown.element.style.width = '100px';
        filterRow.appendChild(this.categoryDropdown.element);
        
        container.appendChild(filterRow);
        
        // Preset grid
        this.presetGrid = document.createElement('div');
        this.presetGrid.className = 'ctm-preset-grid';
        this.presetGrid.style.cssText = `
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: var(--spacing-2);
            overflow-y: auto;
            flex: 1;
            padding-right: var(--spacing-1);
        `;
        container.appendChild(this.presetGrid);
        
        this.renderPresetGrid();
        
        return container;
    }

    renderPresetGrid() {
        this.presetGrid.innerHTML = '';
        
        let presets = getPresetsByCategory(this.currentCategory);
        
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            presets = presets.filter(p => 
                p.name.toLowerCase().includes(query) ||
                p.category.toLowerCase().includes(query)
            );
        }
        
        if (presets.length === 0) {
            const empty = document.createElement('div');
            empty.style.cssText = `
                grid-column: 1 / -1;
                text-align: center;
                padding: var(--spacing-4);
                color: var(--color-text-secondary);
                font-size: var(--font-size-sm);
            `;
            empty.textContent = 'No themes found';
            this.presetGrid.appendChild(empty);
            return;
        }
        
        presets.forEach(preset => {
            const card = this.createPresetCard(preset);
            this.presetGrid.appendChild(card);
        });
    }

    createPresetCard(preset) {
        const card = document.createElement('div');
        card.className = 'ctm-preset-card';
        card.dataset.presetId = preset.id;
        card.style.cssText = `
            background: var(--color-bg-well);
            border: 2px solid transparent;
            border-radius: var(--radius-sm);
            padding: var(--spacing-2);
            cursor: pointer;
            transition: border-color 0.15s, transform 0.1s;
        `;
        
        // Color swatches - show main 6 colors
        const swatches = document.createElement('div');
        swatches.style.cssText = `
            display: flex;
            gap: 2px;
            margin-bottom: var(--spacing-1);
        `;
        
        const displayColors = [
            preset.colors.background1,
            preset.colors.text1,
            preset.colors.accent1,
            preset.colors.accent2,
            preset.colors.accent3,
            preset.colors.accent4
        ];
        
        displayColors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.style.cssText = `
                width: 100%;
                height: 20px;
                background: ${color};
                flex: 1;
            `;
            swatches.appendChild(swatch);
        });
        
        // Round corners on first and last swatch
        swatches.firstChild.style.borderRadius = '2px 0 0 2px';
        swatches.lastChild.style.borderRadius = '0 2px 2px 0';
        
        card.appendChild(swatches);
        
        // Name
        const name = document.createElement('div');
        name.style.cssText = `
            font-size: var(--font-size-sm);
            color: var(--color-text-primary);
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        `;
        name.textContent = preset.name;
        card.appendChild(name);
        
        // Hover effect
        card.addEventListener('mouseenter', () => {
            if (this.selectedPreset?.id !== preset.id) {
                card.style.borderColor = 'var(--color-border)';
            }
            card.style.transform = 'scale(1.02)';
        });
        card.addEventListener('mouseleave', () => {
            if (this.selectedPreset?.id !== preset.id) {
                card.style.borderColor = 'transparent';
            }
            card.style.transform = 'scale(1)';
        });
        
        // Click to select
        card.addEventListener('click', () => this.selectPreset(preset, card));
        
        // Double-click to apply
        card.addEventListener('dblclick', () => this.applyPreset(preset));
        
        return card;
    }

    selectPreset(preset, cardElement) {
        this.selectedPreset = preset;
        
        // Update visual selection
        this.presetGrid.querySelectorAll('.ctm-preset-card').forEach(card => {
            card.style.borderColor = card.dataset.presetId === preset.id 
                ? 'var(--color-accent)' 
                : 'transparent';
        });
        
        // Preview the preset
        this.previewPreset(preset);
    }

    previewPreset(preset) {
        // Store original colors for cancel
        if (!this.originalColors) {
            this.originalColors = this.getCurrentColors();
        }
        
        // Temporarily apply colors to slide view
        const slideView = document.querySelector('.slide-view');
        if (slideView) {
            Object.entries(preset.colors).forEach(([key, value]) => {
                const cssKey = `--theme-${this.camelToKebab(key)}`;
                slideView.style.setProperty(cssKey, value);
            });
            // Also set legacy variables
            slideView.style.setProperty('--theme-accent', preset.colors.accent1);
            slideView.style.setProperty('--theme-text-primary', preset.colors.text1);
            slideView.style.setProperty('--theme-text-secondary', preset.colors.text2);
        }
    }

    cancelPreview() {
        if (this.originalColors) {
            const slideView = document.querySelector('.slide-view');
            if (slideView) {
                Object.entries(this.originalColors).forEach(([key, value]) => {
                    const cssKey = `--theme-${this.camelToKebab(key)}`;
                    slideView.style.setProperty(cssKey, value);
                });
            }
            this.originalColors = null;
        }
    }

    applyPreset(preset) {
        const state = store.getState();
        const masterId = this.getActiveMasterId(state);
        
        if (masterId) {
            store.dispatch('APPLY_COLOR_PRESET', { masterId, preset });
            this.originalColors = null; // Clear preview state
        }
    }

    // ========================================
    // CUSTOM TAB
    // ========================================
    createCustomTab() {
        const container = document.createElement('div');
        container.className = 'ctm-custom-tab';
        container.style.cssText = `
            display: none;
            flex-direction: column;
            gap: var(--spacing-2);
            height: 100%;
            overflow-y: auto;
        `;
        
        // Color role editors
        const colorList = document.createElement('div');
        colorList.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: var(--spacing-1);
        `;
        
        COLOR_ROLES.forEach(role => {
            const row = this.createColorRoleRow(role);
            colorList.appendChild(row);
        });
        
        container.appendChild(colorList);
        
        return container;
    }

    createColorRoleRow(role) {
        const row = document.createElement('div');
        row.className = 'ctm-color-row';
        row.style.cssText = `
            display: flex;
            align-items: center;
            gap: var(--spacing-2);
            padding: var(--spacing-1) 0;
        `;
        
        // Label
        const label = document.createElement('div');
        label.style.cssText = `
            flex: 1;
            font-size: var(--font-size-sm);
            color: var(--color-text-primary);
        `;
        label.textContent = role.name;
        label.title = role.description;
        row.appendChild(label);
        
        // Color input
        const colorInput = new ColorInput({
            value: this.getCurrentColorValue(role.id),
            onChange: (color) => this.updateColor(role.id, color)
        });
        colorInput.element.style.width = '80px';
        row.appendChild(colorInput.element);
        
        // Store reference for updates
        row.colorInput = colorInput;
        row.roleId = role.id;
        
        return row;
    }

    updateCustomTabColors() {
        const rows = this.customContent.querySelectorAll('.ctm-color-row');
        rows.forEach(row => {
            if (row.colorInput && row.roleId) {
                const value = this.getCurrentColorValue(row.roleId);
                row.colorInput.setValue(value);
            }
        });
    }

    getCurrentColorValue(roleId) {
        const state = store.getState();
        const masterId = this.getActiveMasterId(state);
        if (masterId) {
            const master = state.masters[masterId];
            return master?.themeSettings?.colors?.[roleId] || '#000000';
        }
        return '#000000';
    }

    updateColor(roleId, color) {
        const state = store.getState();
        const masterId = this.getActiveMasterId(state);
        
        if (masterId) {
            store.dispatch('UPDATE_THEME_COLOR', { masterId, colorRole: roleId, value: color });
        }
    }

    getCurrentColors() {
        const state = store.getState();
        const masterId = this.getActiveMasterId(state);
        if (masterId) {
            const master = state.masters[masterId];
            return { ...master?.themeSettings?.colors };
        }
        return {};
    }

    // ========================================
    // AI TAB
    // ========================================
    createAITab() {
        const container = document.createElement('div');
        container.className = 'ctm-ai-tab';
        container.style.cssText = `
            display: none;
            flex-direction: column;
            gap: var(--spacing-3);
            height: 100%;
            padding: var(--spacing-2) 0;
        `;
        
        // Placeholder content
        const placeholder = document.createElement('div');
        placeholder.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            flex: 1;
            text-align: center;
            color: var(--color-text-secondary);
            gap: var(--spacing-2);
        `;
        
        const icon = document.createElement('div');
        icon.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles" style="font-size: 32px;"></i>';
        placeholder.appendChild(icon);
        
        const text = document.createElement('div');
        text.innerHTML = `
            <div style="font-size: var(--font-size-lg); margin-bottom: 4px;">AI Theme Generator</div>
            <div style="font-size: var(--font-size-sm);">Coming soon! Describe your ideal color theme and let AI create it for you.</div>
        `;
        placeholder.appendChild(text);
        
        container.appendChild(placeholder);
        
        return container;
    }

    // ========================================
    // FOOTER
    // ========================================
    createFooter() {
        const footer = document.createElement('div');
        footer.className = 'ctm-footer';
        footer.style.cssText = `
            display: flex;
            gap: var(--spacing-2);
            padding: var(--spacing-2) var(--spacing-3);
            border-top: 1px solid var(--color-border);
            background: var(--color-bg-hover);
        `;
        
        // Reset button
        const resetBtn = document.createElement('button');
        resetBtn.textContent = 'Reset';
        resetBtn.style.cssText = this.getButtonStyle(false);
        resetBtn.addEventListener('click', () => this.resetColors());
        resetBtn.addEventListener('mouseenter', () => {
            resetBtn.style.background = 'var(--color-bg-active)';
        });
        resetBtn.addEventListener('mouseleave', () => {
            resetBtn.style.background = 'transparent';
        });
        footer.appendChild(resetBtn);
        
        // Spacer
        const spacer = document.createElement('div');
        spacer.style.flex = '1';
        footer.appendChild(spacer);
        
        // Apply button
        const applyBtn = document.createElement('button');
        applyBtn.textContent = 'Apply';
        applyBtn.style.cssText = this.getButtonStyle(true);
        applyBtn.addEventListener('click', () => {
            if (this.selectedPreset) {
                this.applyPreset(this.selectedPreset);
            }
        });
        applyBtn.addEventListener('mouseenter', () => {
            applyBtn.style.background = 'var(--color-accent-hover)';
        });
        applyBtn.addEventListener('mouseleave', () => {
            applyBtn.style.background = 'var(--color-accent)';
        });
        footer.appendChild(applyBtn);
        
        return footer;
    }

    getButtonStyle(isPrimary) {
        if (isPrimary) {
            return `
                padding: 6px 16px;
                border: none;
                border-radius: var(--radius-sm);
                background: var(--color-accent);
                color: var(--color-text-on-accent);
                font-size: var(--font-size-sm);
                cursor: pointer;
                transition: background 0.15s;
            `;
        }
        return `
            padding: 6px 12px;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-sm);
            background: transparent;
            color: var(--color-text-primary);
            font-size: var(--font-size-sm);
            cursor: pointer;
            transition: background 0.15s;
        `;
    }

    resetColors() {
        const state = store.getState();
        const masterId = this.getActiveMasterId(state);
        
        if (masterId) {
            store.dispatch('RESET_THEME_COLORS', { masterId });
            this.selectedPreset = null;
            this.originalColors = null;
            
            // Update UI
            this.renderPresetGrid();
            this.updateCustomTabColors();
        }
    }

    // ========================================
    // TAB SWITCHING
    // ========================================
    switchTab(tab) {
        this.activeTab = tab;
        
        // Update visibility
        this.presetsContent.style.display = tab === 'presets' ? 'flex' : 'none';
        this.customContent.style.display = tab === 'custom' ? 'flex' : 'none';
        this.aiContent.style.display = tab === 'ai' ? 'flex' : 'none';
        
        // Update custom tab colors when switching to it
        if (tab === 'custom') {
            this.updateCustomTabColors();
        }
    }

    // ========================================
    // UTILITIES
    // ========================================
    getActiveMasterId(state) {
        // Get the theme master for the current slide
        const activeSlideId = state.editor?.activeSlideId;
        if (activeSlideId) {
            const slide = state.slides[activeSlideId];
            if (slide?.layoutId) {
                const layout = state.masters[slide.layoutId];
                if (layout?.parentId) {
                    return layout.parentId;
                }
            }
        }
        // Fallback to first theme master
        for (const [id, master] of Object.entries(state.masters)) {
            if (master.type === 'theme') {
                return id;
            }
        }
        return null;
    }

    camelToKebab(str) {
        return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    }

    // ========================================
    // LIFECYCLE
    // ========================================
    onOpen() {
        // Refresh preset grid and custom colors
        this.renderPresetGrid();
        if (this.activeTab === 'custom') {
            this.updateCustomTabColors();
        }
        
        // Subscribe to state changes
        this.stateHandler = () => {
            if (this.activeTab === 'custom') {
                this.updateCustomTabColors();
            }
        };
        store.on('state-changed', this.stateHandler);
    }

    onClose() {
        // Cancel any preview
        this.cancelPreview();
        this.selectedPreset = null;
        
        // Unsubscribe from state changes
        if (this.stateHandler) {
            store.off('state-changed', this.stateHandler);
        }
    }
}

export default ColorThemeManager;
