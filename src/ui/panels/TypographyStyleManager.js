/**
 * TypographyStyleManager.js
 * A draggable panel for managing typography with font presets, custom styles, and AI generation.
 */

import { DraggablePanel } from '../components/DraggablePanel.js';
import { SegmentedControl } from '../components/SegmentedControl.js';
import { Dropdown } from '../components/Dropdown.js';
import { Button } from '../components/Button.js';
import { store } from '../../core/Store.js';
import { FONT_PRESETS, FONT_CATEGORIES, AVAILABLE_FONTS, getPresetsByCategory, searchPresets, getFontsByCategory } from '../../core/constants/FontPresets.js';
import fontManager from '../../core/FontManager.js';

/**
 * Text style definitions for the Custom tab
 */
const TEXT_STYLES = [
    { id: 'title', name: 'Title', description: 'Large display text' },
    { id: 'subtitle', name: 'Subtitle', description: 'Secondary display text' },
    { id: 'heading1', name: 'Heading 1', description: 'Primary heading' },
    { id: 'heading2', name: 'Heading 2', description: 'Secondary heading' },
    { id: 'body', name: 'Body', description: 'Main body text' },
    { id: 'bodySmall', name: 'Body Small', description: 'Smaller body text' },
    { id: 'caption', name: 'Caption', description: 'Image captions' },
    { id: 'label', name: 'Label', description: 'Form labels' }
];

export class TypographyStyleManager extends DraggablePanel {
    constructor() {
        super({
            id: 'typography-style-manager',
            title: 'Typography',
            defaultWidth: 360,
            defaultHeight: 560,
            minWidth: 320,
            minHeight: 450,
            maxWidth: 500,
            maxHeight: 800
        });
        
        this.activeTab = 'presets';
        this.selectedPreset = null;
        this.currentCategory = 'all';
        this.searchQuery = '';
        this.originalFonts = null; // For preview/cancel
        this.expandedStyles = new Set(['title', 'body']); // Expanded style editors
        
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
        tabContainer.className = 'tsm-tabs';
        tabContainer.appendChild(this.tabControl.element);
        
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
        container.className = 'tsm-presets-tab';
        
        // Search bar
        const searchContainer = document.createElement('div');
        searchContainer.className = 'tsm-search';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search font presets...';
        searchInput.className = 'tsm-search-input';
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.renderPresetGrid();
        });
        
        searchContainer.appendChild(searchInput);
        container.appendChild(searchContainer);
        
        // Category filter
        const filterContainer = document.createElement('div');
        filterContainer.className = 'tsm-filter';
        
        this.categoryDropdown = new Dropdown({
            options: FONT_CATEGORIES.map(c => ({ value: c.id, label: c.name })),
            value: 'all',
            onChange: (category) => {
                this.currentCategory = category;
                this.renderPresetGrid();
            }
        });
        
        filterContainer.appendChild(this.categoryDropdown.element);
        container.appendChild(filterContainer);
        
        // Preset grid
        this.presetGrid = document.createElement('div');
        this.presetGrid.className = 'tsm-preset-grid';
        
        container.appendChild(this.presetGrid);
        this.renderPresetGrid();
        
        return container;
    }

    renderPresetGrid() {
        this.presetGrid.innerHTML = '';
        
        let presets = this.currentCategory === 'all' 
            ? FONT_PRESETS 
            : getPresetsByCategory(this.currentCategory);
        
        if (this.searchQuery) {
            presets = searchPresets(this.searchQuery);
        }
        
        presets.forEach(preset => {
            const card = this.createPresetCard(preset);
            this.presetGrid.appendChild(card);
        });
        
        if (presets.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.textContent = 'No font presets found';
            emptyMessage.className = 'tsm-empty-message';
            this.presetGrid.appendChild(emptyMessage);
        }
    }

    createPresetCard(preset) {
        const card = document.createElement('div');
        card.className = 'tsm-preset-card' + (this.selectedPreset?.id === preset.id ? ' selected' : '');
        
        // Preset name and category
        const header = document.createElement('div');
        header.className = 'tsm-preset-header';
        
        const name = document.createElement('div');
        name.textContent = preset.name;
        name.className = 'tsm-preset-name';
        
        const category = document.createElement('div');
        category.textContent = preset.category;
        category.className = 'tsm-preset-category';
        
        header.appendChild(name);
        header.appendChild(category);
        card.appendChild(header);
        
        // Font preview
        const preview = document.createElement('div');
        preview.className = 'tsm-font-preview';
        
        // Heading preview
        const headingPreview = document.createElement('div');
        headingPreview.textContent = 'Heading Text';
        headingPreview.className = 'tsm-heading-preview';
        headingPreview.style.fontFamily = `"${preset.fonts.heading.family}", ${preset.fonts.heading.fallback || 'sans-serif'}`;
        headingPreview.style.fontWeight = preset.fonts.heading.weight || '700';
        
        // Body preview
        const bodyPreview = document.createElement('div');
        bodyPreview.textContent = 'Body text sample';
        bodyPreview.className = 'tsm-body-preview';
        bodyPreview.style.fontFamily = `"${preset.fonts.body.family}", ${preset.fonts.body.fallback || 'sans-serif'}`;
        bodyPreview.style.fontWeight = preset.fonts.body.weight || '400';
        
        // Font names
        const fontNames = document.createElement('div');
        fontNames.textContent = `${preset.fonts.heading.family} / ${preset.fonts.body.family}`;
        fontNames.className = 'tsm-font-names';
        
        preview.appendChild(headingPreview);
        preview.appendChild(bodyPreview);
        preview.appendChild(fontNames);
        card.appendChild(preview);
        
        // Click handler
        card.addEventListener('click', () => {
            this.selectPreset(preset, card);
        });
        
        // Hover effects (preview managed separately, hover styles in CSS)
        card.addEventListener('mouseenter', () => {
            this.previewPreset(preset);
        });
        
        card.addEventListener('mouseleave', () => {
            if (!this.selectedPreset) {
                this.cancelPreview();
            }
        });
        
        return card;
    }

    selectPreset(preset, card) {
        // Save original fonts for cancel
        if (!this.originalFonts) {
            this.saveOriginalFonts();
        }
        
        this.selectedPreset = preset;
        
        // Update card borders via class
        const cards = this.presetGrid.querySelectorAll('.tsm-preset-card');
        cards.forEach(c => {
            c.classList.remove('selected');
        });
        card.classList.add('selected');
    }

    previewPreset(preset) {
        if (!this.originalFonts) {
            this.saveOriginalFonts();
        }
        
        // Load fonts for preview
        this.loadPresetFonts(preset);
        
        // Apply preview (don't snapshot history)
        const masterId = store.getState().editor.activeMasterId;
        store.dispatch('APPLY_FONT_PRESET', { 
            masterId, 
            preset 
        }, { skipHistory: true });
    }

    cancelPreview() {
        if (this.originalFonts || this.originalTypographyStyleId) {
            const masterId = store.getState().editor.activeMasterId;
            
            // Restore original typography style reference if available
            if (this.originalTypographyStyleId) {
                 store.dispatch('UPDATE_MASTER_STYLE_ASSIGNMENTS', {
                    masterId,
                    styleAssignments: { typographyStyle: this.originalTypographyStyleId }
                }, { skipHistory: true });
            } 
            // Fallback to restoring embedded fonts (legacy)
            else if (this.originalFonts) {
                store.dispatch('UPDATE_THEME_SETTINGS', {
                    id: masterId,
                    settings: { fonts: this.originalFonts }
                }, { skipHistory: true });
            }
        }
    }

    saveOriginalFonts() {
        const state = store.getState();
        const masterId = state.editor.activeMasterId;
        const master = state.slideMasterPresets[masterId];
        
        if (master) {
            this.originalTypographyStyleId = master.typographyStyleId;
            // Also store fonts just in case (legacy support)
            if (master.themeSettings?.fonts) {
                this.originalFonts = { ...master.themeSettings.fonts };
            }
        }
    }

    async loadPresetFonts(preset) {
        const fontsToLoad = [
            preset.fonts.heading.family,
            preset.fonts.body.family
        ];
        
        for (const fontFamily of fontsToLoad) {
            try {
                await fontManager.loadFont(fontFamily);
            } catch (e) {
                console.warn(`Failed to load font: ${fontFamily}`, e);
            }
        }
    }

    // ========================================
    // CUSTOM TAB
    // ========================================
    createCustomTab() {
        const container = document.createElement('div');
        container.className = 'tsm-custom-tab';
        
        // Font Pairings Section
        const fontSection = this.createFontPairingSection();
        container.appendChild(fontSection);
        
        // Text Styles Section
        const stylesSection = this.createTextStylesSection();
        container.appendChild(stylesSection);
        
        return container;
    }

    createFontPairingSection() {
        const section = document.createElement('div');
        section.className = 'tsm-section';
        
        const header = document.createElement('div');
        header.textContent = 'Font Pairing';
        header.className = 'tsm-section-header';
        section.appendChild(header);
        
        // Heading font dropdown
        const headingRow = this.createFontRow('Heading', 'heading');
        section.appendChild(headingRow);
        
        // Body font dropdown
        const bodyRow = this.createFontRow('Body', 'body');
        section.appendChild(bodyRow);
        
        return section;
    }

    createFontRow(label, fontType) {
        const row = document.createElement('div');
        row.className = 'tsm-font-row';
        
        const labelEl = document.createElement('div');
        labelEl.textContent = label;
        labelEl.className = 'tsm-font-label';
        row.appendChild(labelEl);
        
        const fontOptions = AVAILABLE_FONTS.map(f => ({
            value: f.family,
            label: f.family
        }));
        
        const dropdown = new Dropdown({
            options: fontOptions,
            value: 'Inter',
            size: 'fill',
            onChange: (fontFamily) => {
                this.updateThemeFont(fontType, fontFamily);
            }
        });
        
        row.appendChild(dropdown.element);
        
        // Store reference for updating
        if (fontType === 'heading') {
            this.headingFontDropdown = dropdown;
        } else {
            this.bodyFontDropdown = dropdown;
        }
        
        return row;
    }

    createTextStylesSection() {
        const section = document.createElement('div');
        section.className = 'tsm-styles-section';
        
        const header = document.createElement('div');
        header.textContent = 'Text Styles';
        header.className = 'tsm-section-header';
        section.appendChild(header);
        
        // Style editors container
        this.styleEditorsContainer = document.createElement('div');
        this.styleEditorsContainer.className = 'tsm-style-editors';
        
        TEXT_STYLES.forEach(style => {
            const editor = this.createStyleEditor(style);
            this.styleEditorsContainer.appendChild(editor);
        });
        
        section.appendChild(this.styleEditorsContainer);
        
        return section;
    }

    createStyleEditor(styleDef) {
        const container = document.createElement('div');
        container.className = 'tsm-style-editor';
        
        // Header (clickable to expand)
        const header = document.createElement('div');
        header.className = 'tsm-style-header';
        
        const titleContainer = document.createElement('div');
        titleContainer.className = 'tsm-style-title-container';
        
        const expandIcon = document.createElement('div');
        expandIcon.innerHTML = this.expandedStyles.has(styleDef.id) ? '▼' : '▶';
        expandIcon.className = 'tsm-expand-icon';
        
        const styleLabel = document.createElement('div');
        styleLabel.textContent = styleDef.name;
        styleLabel.className = 'tsm-style-label';
        
        titleContainer.appendChild(expandIcon);
        titleContainer.appendChild(styleLabel);
        
        // Preview text
        const previewText = document.createElement('div');
        previewText.textContent = 'Aa';
        previewText.className = 'tsm-preview-text';
        
        header.appendChild(titleContainer);
        header.appendChild(previewText);
        
        // Properties panel (collapsible)
        const propertiesPanel = document.createElement('div');
        propertiesPanel.className = 'tsm-style-properties' + (this.expandedStyles.has(styleDef.id) ? '' : ' collapsed');
        
        // Font size row
        const fontSizeRow = this.createPropertyRow('Size', 'fontSize', styleDef.id, 'number', { min: 8, max: 200, step: 1 });
        propertiesPanel.appendChild(fontSizeRow);
        
        // Font weight row
        const fontWeightRow = this.createPropertyRow('Weight', 'fontWeight', styleDef.id, 'select', {
            options: [
                { value: '300', label: 'Light' },
                { value: '400', label: 'Regular' },
                { value: '500', label: 'Medium' },
                { value: '600', label: 'Semibold' },
                { value: '700', label: 'Bold' }
            ]
        });
        propertiesPanel.appendChild(fontWeightRow);
        
        // Line height row
        const lineHeightRow = this.createPropertyRow('Line Height', 'lineHeight', styleDef.id, 'number', { min: 0.8, max: 3, step: 0.05 });
        propertiesPanel.appendChild(lineHeightRow);
        
        // Letter spacing row
        const letterSpacingRow = this.createPropertyRow('Letter Spacing', 'letterSpacing', styleDef.id, 'text');
        propertiesPanel.appendChild(letterSpacingRow);
        
        // Toggle expand on header click
        header.addEventListener('click', () => {
            const isExpanded = this.expandedStyles.has(styleDef.id);
            if (isExpanded) {
                this.expandedStyles.delete(styleDef.id);
                propertiesPanel.classList.add('collapsed');
                expandIcon.innerHTML = '▶';
            } else {
                this.expandedStyles.add(styleDef.id);
                propertiesPanel.classList.remove('collapsed');
                expandIcon.innerHTML = '▼';
            }
        });
        
        container.appendChild(header);
        container.appendChild(propertiesPanel);
        
        return container;
    }

    createPropertyRow(label, property, styleId, type, config = {}) {
        const row = document.createElement('div');
        row.className = 'tsm-property-row';
        
        const labelEl = document.createElement('div');
        labelEl.textContent = label;
        labelEl.className = 'tsm-property-label';
        row.appendChild(labelEl);
        
        let input;
        
        if (type === 'select') {
            const dropdown = new Dropdown({
                options: config.options,
                value: '400',
                size: 'md',
                onChange: (value) => {
                    this.updateTextStyle(styleId, property, value);
                }
            });
            input = dropdown.element;
        } else if (type === 'number') {
            input = document.createElement('input');
            input.type = 'number';
            input.className = 'tsm-property-input';
            input.min = config.min;
            input.max = config.max;
            input.step = config.step;
            input.addEventListener('change', (e) => {
                this.updateTextStyle(styleId, property, parseFloat(e.target.value));
            });
        } else {
            input = document.createElement('input');
            input.type = 'text';
            input.className = 'tsm-property-input';
            input.addEventListener('change', (e) => {
                this.updateTextStyle(styleId, property, e.target.value);
            });
        }
        
        row.appendChild(input);
        
        return row;
    }

    refreshCustomTab() {
        const state = store.getState();
        const masterId = state.editor.activeMasterId;
        const master = state.slideMasterPresets[masterId];
        
        if (!master) return;
        
        // Get current fonts from referenced preset
        let currentFonts = { heading: 'Inter', body: 'Inter' };
        
        if (master.typographyStyleId) {
            const preset = state.typographyStylePresets?.[master.typographyStyleId];
            if (preset?.fonts) {
                currentFonts = preset.fonts;
            }
        } else if (master.themeSettings?.fonts) {
            // Legacy fallback
            currentFonts = master.themeSettings.fonts;
        }
        
        // Update font dropdowns
        if (this.headingFontDropdown) {
            this.headingFontDropdown.setValue(currentFonts.heading.family || currentFonts.heading);
        }
        if (this.bodyFontDropdown) {
            this.bodyFontDropdown.setValue(currentFonts.body.family || currentFonts.body);
        }
    }

    updateThemeFont(fontType, fontFamily) {
        const masterId = store.getState().editor.activeMasterId;
        
        // Load the font first
        fontManager.loadFont(fontFamily).then(() => {
            store.dispatch('UPDATE_THEME_FONT', {
                masterId,
                fontType,
                value: fontFamily
            });
        });
    }

    updateTextStyle(styleId, property, value) {
        const masterId = store.getState().editor.activeMasterId;
        store.dispatch('UPDATE_TEXT_STYLE', {
            masterId,
            styleId,
            property,
            value
        });
    }

    // ========================================
    // AI TAB
    // ========================================
    createAITab() {
        const container = document.createElement('div');
        container.className = 'tsm-ai-tab';
        
        // AI coming soon message
        const message = document.createElement('div');
        message.className = 'tsm-ai-message';
        
        const icon = document.createElement('div');
        icon.innerHTML = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
        </svg>`;
        icon.className = 'tsm-ai-icon';
        
        const title = document.createElement('div');
        title.textContent = 'AI Typography Generator';
        title.className = 'tsm-ai-title';
        
        const subtitle = document.createElement('div');
        subtitle.textContent = 'Describe your desired typography style and let AI generate custom font pairings and text styles for you.';
        subtitle.className = 'tsm-ai-subtitle';
        
        const comingSoon = document.createElement('div');
        comingSoon.textContent = 'Coming Soon';
        comingSoon.className = 'tsm-coming-soon';
        
        message.appendChild(icon);
        message.appendChild(title);
        message.appendChild(subtitle);
        message.appendChild(comingSoon);
        container.appendChild(message);
        
        return container;
    }

    // ========================================
    // FOOTER
    // ========================================
    createFooter() {
        const footer = document.createElement('div');
        footer.className = 'tsm-footer';
        
        // Reset button
        this.resetBtn = new Button({
            label: 'Reset',
            variant: 'secondary',
            size: 'md',
            onClick: () => this.resetFonts()
        });
        
        // Apply button
        this.applyBtn = new Button({
            label: 'Apply',
            variant: 'primary',
            size: 'md',
            onClick: () => this.applySelection()
        });
        
        footer.appendChild(this.resetBtn.element);
        footer.appendChild(this.applyBtn.element);
        
        return footer;
    }

    // ========================================
    // ACTIONS
    // ========================================
    applySelection() {
        if (this.selectedPreset) {
            const masterId = store.getState().editor.activeMasterId;
            
            // Load fonts first
            this.loadPresetFonts(this.selectedPreset).then(() => {
                store.dispatch('APPLY_FONT_PRESET', {
                    masterId,
                    preset: this.selectedPreset
                });
                
                // Clear original fonts reference
                this.originalFonts = null;
                this.originalTypographyStyleId = null;
                
                // Show feedback
                this.showToast(`Applied "${this.selectedPreset.name}" typography`);
            });
        }
    }

    resetFonts() {
        const masterId = store.getState().editor.activeMasterId;
        store.dispatch('RESET_THEME_FONTS', { masterId });
        
        this.selectedPreset = null;
        this.originalFonts = null;
        this.originalTypographyStyleId = null;
        
        // Update UI
        this.renderPresetGrid();
        this.showToast('Typography reset to default');
    }

    showToast(message) {
        // Simple toast notification
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.className = 'tsm-toast';
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.2s ease forwards';
            setTimeout(() => toast.remove(), 200);
        }, 2000);
    }

    // ========================================
    // TAB SWITCHING
    // ========================================
    switchTab(tab) {
        this.activeTab = tab;
        
        // Hide all tabs
        this.presetsContent.style.display = 'none';
        this.customContent.style.display = 'none';
        this.aiContent.style.display = 'none';
        
        // Show active tab
        switch(tab) {
            case 'presets':
                this.presetsContent.style.display = 'flex';
                break;
            case 'custom':
                this.customContent.style.display = 'flex';
                this.refreshCustomTab();
                break;
            case 'ai':
                this.aiContent.style.display = 'flex';
                break;
        }
    }
}
