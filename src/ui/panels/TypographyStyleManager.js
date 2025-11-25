/**
 * TypographyStyleManager.js
 * A draggable panel for managing typography with font presets, custom styles, and AI generation.
 */

import { DraggablePanel } from '../components/DraggablePanel.js';
import { SegmentedControl } from '../components/SegmentedControl.js';
import { Dropdown } from '../components/Dropdown.js';
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
        container.className = 'tsm-presets-tab';
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            height: 100%;
        `;
        
        // Search bar
        const searchContainer = document.createElement('div');
        searchContainer.className = 'tsm-search';
        searchContainer.style.cssText = `
            padding: var(--spacing-2);
            border-bottom: 1px solid var(--color-border);
        `;
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search font presets...';
        searchInput.className = 'tsm-search-input';
        searchInput.style.cssText = `
            width: 100%;
            padding: var(--spacing-2);
            background: var(--color-bg-secondary);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-sm);
            color: var(--color-text-primary);
            font-size: var(--font-size-sm);
        `;
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.renderPresetGrid();
        });
        
        searchContainer.appendChild(searchInput);
        container.appendChild(searchContainer);
        
        // Category filter
        const filterContainer = document.createElement('div');
        filterContainer.className = 'tsm-filter';
        filterContainer.style.cssText = `
            padding: var(--spacing-2);
            border-bottom: 1px solid var(--color-border);
        `;
        
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
        this.presetGrid.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: var(--spacing-2);
            display: flex;
            flex-direction: column;
            gap: var(--spacing-2);
        `;
        
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
            emptyMessage.style.cssText = `
                color: var(--color-text-tertiary);
                text-align: center;
                padding: var(--spacing-4);
                font-size: var(--font-size-sm);
            `;
            this.presetGrid.appendChild(emptyMessage);
        }
    }

    createPresetCard(preset) {
        const card = document.createElement('div');
        card.className = 'tsm-preset-card';
        card.style.cssText = `
            padding: var(--spacing-3);
            background: var(--color-bg-secondary);
            border: 2px solid ${this.selectedPreset?.id === preset.id ? 'var(--color-accent)' : 'transparent'};
            border-radius: var(--radius-md);
            cursor: pointer;
            transition: all 0.15s ease;
        `;
        
        // Preset name and category
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: var(--spacing-2);
        `;
        
        const name = document.createElement('div');
        name.textContent = preset.name;
        name.style.cssText = `
            font-weight: 600;
            font-size: var(--font-size-sm);
            color: var(--color-text-primary);
        `;
        
        const category = document.createElement('div');
        category.textContent = preset.category;
        category.style.cssText = `
            font-size: var(--font-size-xs);
            color: var(--color-text-tertiary);
            text-transform: capitalize;
        `;
        
        header.appendChild(name);
        header.appendChild(category);
        card.appendChild(header);
        
        // Font preview
        const preview = document.createElement('div');
        preview.className = 'tsm-font-preview';
        preview.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: var(--spacing-1);
        `;
        
        // Heading preview
        const headingPreview = document.createElement('div');
        headingPreview.textContent = 'Heading Text';
        headingPreview.style.cssText = `
            font-family: "${preset.fonts.heading.family}", ${preset.fonts.heading.fallback || 'sans-serif'};
            font-weight: ${preset.fonts.heading.weight || '700'};
            font-size: 18px;
            color: var(--color-text-primary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        `;
        
        // Body preview
        const bodyPreview = document.createElement('div');
        bodyPreview.textContent = 'Body text sample';
        bodyPreview.style.cssText = `
            font-family: "${preset.fonts.body.family}", ${preset.fonts.body.fallback || 'sans-serif'};
            font-weight: ${preset.fonts.body.weight || '400'};
            font-size: 13px;
            color: var(--color-text-secondary);
        `;
        
        // Font names
        const fontNames = document.createElement('div');
        fontNames.textContent = `${preset.fonts.heading.family} / ${preset.fonts.body.family}`;
        fontNames.style.cssText = `
            font-size: 10px;
            color: var(--color-text-tertiary);
            margin-top: var(--spacing-1);
        `;
        
        preview.appendChild(headingPreview);
        preview.appendChild(bodyPreview);
        preview.appendChild(fontNames);
        card.appendChild(preview);
        
        // Click handler
        card.addEventListener('click', () => {
            this.selectPreset(preset, card);
        });
        
        // Hover effects
        card.addEventListener('mouseenter', () => {
            card.style.background = 'var(--color-bg-hover)';
            this.previewPreset(preset);
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.background = 'var(--color-bg-secondary)';
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
        
        // Update card borders
        const cards = this.presetGrid.querySelectorAll('.tsm-preset-card');
        cards.forEach(c => {
            c.style.borderColor = 'transparent';
        });
        card.style.borderColor = 'var(--color-accent)';
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
        if (this.originalFonts) {
            const masterId = store.getState().editor.activeMasterId;
            const state = store.getState();
            const master = state.masters[masterId];
            
            if (master && master.themeSettings) {
                // Restore original fonts
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
        const master = state.masters[masterId];
        
        if (master?.themeSettings?.fonts) {
            this.originalFonts = { ...master.themeSettings.fonts };
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
        container.style.cssText = `
            display: none;
            flex-direction: column;
            height: 100%;
            overflow-y: auto;
        `;
        
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
        section.style.cssText = `
            padding: var(--spacing-3);
            border-bottom: 1px solid var(--color-border);
        `;
        
        const header = document.createElement('div');
        header.textContent = 'Font Pairing';
        header.style.cssText = `
            font-weight: 600;
            font-size: var(--font-size-sm);
            color: var(--color-text-primary);
            margin-bottom: var(--spacing-2);
        `;
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
        row.style.cssText = `
            display: flex;
            align-items: center;
            gap: var(--spacing-2);
            margin-bottom: var(--spacing-2);
        `;
        
        const labelEl = document.createElement('div');
        labelEl.textContent = label;
        labelEl.style.cssText = `
            width: 60px;
            font-size: var(--font-size-sm);
            color: var(--color-text-secondary);
        `;
        row.appendChild(labelEl);
        
        const fontOptions = AVAILABLE_FONTS.map(f => ({
            value: f.family,
            label: f.family
        }));
        
        const dropdown = new Dropdown({
            options: fontOptions,
            value: 'Inter',
            onChange: (fontFamily) => {
                this.updateThemeFont(fontType, fontFamily);
            }
        });
        
        dropdown.element.style.flex = '1';
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
        section.style.cssText = `
            padding: var(--spacing-3);
        `;
        
        const header = document.createElement('div');
        header.textContent = 'Text Styles';
        header.style.cssText = `
            font-weight: 600;
            font-size: var(--font-size-sm);
            color: var(--color-text-primary);
            margin-bottom: var(--spacing-2);
        `;
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
        container.style.cssText = `
            background: var(--color-bg-secondary);
            border-radius: var(--radius-md);
            margin-bottom: var(--spacing-2);
            overflow: hidden;
        `;
        
        // Header (clickable to expand)
        const header = document.createElement('div');
        header.className = 'tsm-style-header';
        header.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: var(--spacing-2) var(--spacing-3);
            cursor: pointer;
            transition: background 0.15s ease;
        `;
        
        header.addEventListener('mouseenter', () => {
            header.style.background = 'var(--color-bg-hover)';
        });
        header.addEventListener('mouseleave', () => {
            header.style.background = 'transparent';
        });
        
        const titleContainer = document.createElement('div');
        titleContainer.style.cssText = `
            display: flex;
            align-items: center;
            gap: var(--spacing-2);
        `;
        
        const expandIcon = document.createElement('div');
        expandIcon.innerHTML = this.expandedStyles.has(styleDef.id) ? '▼' : '▶';
        expandIcon.style.cssText = `
            font-size: 8px;
            color: var(--color-text-tertiary);
            transition: transform 0.15s ease;
        `;
        
        const styleLabel = document.createElement('div');
        styleLabel.textContent = styleDef.name;
        styleLabel.style.cssText = `
            font-size: var(--font-size-sm);
            color: var(--color-text-primary);
        `;
        
        titleContainer.appendChild(expandIcon);
        titleContainer.appendChild(styleLabel);
        
        // Preview text
        const previewText = document.createElement('div');
        previewText.textContent = 'Aa';
        previewText.style.cssText = `
            font-size: 16px;
            color: var(--color-text-secondary);
        `;
        
        header.appendChild(titleContainer);
        header.appendChild(previewText);
        
        // Properties panel (collapsible)
        const propertiesPanel = document.createElement('div');
        propertiesPanel.className = 'tsm-style-properties';
        propertiesPanel.style.cssText = `
            display: ${this.expandedStyles.has(styleDef.id) ? 'block' : 'none'};
            padding: var(--spacing-2) var(--spacing-3);
            border-top: 1px solid var(--color-border);
        `;
        
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
                propertiesPanel.style.display = 'none';
                expandIcon.innerHTML = '▶';
            } else {
                this.expandedStyles.add(styleDef.id);
                propertiesPanel.style.display = 'block';
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
        row.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: var(--spacing-2);
        `;
        
        const labelEl = document.createElement('div');
        labelEl.textContent = label;
        labelEl.style.cssText = `
            font-size: var(--font-size-xs);
            color: var(--color-text-secondary);
        `;
        row.appendChild(labelEl);
        
        let input;
        
        if (type === 'select') {
            const dropdown = new Dropdown({
                options: config.options,
                value: '400',
                onChange: (value) => {
                    this.updateTextStyle(styleId, property, value);
                }
            });
            dropdown.element.style.width = '100px';
            input = dropdown.element;
        } else if (type === 'number') {
            input = document.createElement('input');
            input.type = 'number';
            input.min = config.min;
            input.max = config.max;
            input.step = config.step;
            input.style.cssText = `
                width: 70px;
                padding: var(--spacing-1) var(--spacing-2);
                background: var(--color-bg-tertiary);
                border: 1px solid var(--color-border);
                border-radius: var(--radius-sm);
                color: var(--color-text-primary);
                font-size: var(--font-size-xs);
                text-align: right;
            `;
            input.addEventListener('change', (e) => {
                this.updateTextStyle(styleId, property, parseFloat(e.target.value));
            });
        } else {
            input = document.createElement('input');
            input.type = 'text';
            input.style.cssText = `
                width: 70px;
                padding: var(--spacing-1) var(--spacing-2);
                background: var(--color-bg-tertiary);
                border: 1px solid var(--color-border);
                border-radius: var(--radius-sm);
                color: var(--color-text-primary);
                font-size: var(--font-size-xs);
                text-align: right;
            `;
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
        const master = state.masters[masterId];
        
        if (!master?.themeSettings) return;
        
        // Update font dropdowns
        if (this.headingFontDropdown && master.themeSettings.fonts?.heading) {
            this.headingFontDropdown.setValue(master.themeSettings.fonts.heading);
        }
        if (this.bodyFontDropdown && master.themeSettings.fonts?.body) {
            this.bodyFontDropdown.setValue(master.themeSettings.fonts.body);
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
        container.style.cssText = `
            display: none;
            flex-direction: column;
            height: 100%;
            padding: var(--spacing-3);
        `;
        
        // AI coming soon message
        const message = document.createElement('div');
        message.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            text-align: center;
            color: var(--color-text-secondary);
        `;
        
        const icon = document.createElement('div');
        icon.innerHTML = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
        </svg>`;
        icon.style.marginBottom = 'var(--spacing-3)';
        icon.style.opacity = '0.5';
        
        const title = document.createElement('div');
        title.textContent = 'AI Typography Generator';
        title.style.cssText = `
            font-weight: 600;
            font-size: var(--font-size-md);
            margin-bottom: var(--spacing-2);
            color: var(--color-text-primary);
        `;
        
        const subtitle = document.createElement('div');
        subtitle.textContent = 'Describe your desired typography style and let AI generate custom font pairings and text styles for you.';
        subtitle.style.cssText = `
            font-size: var(--font-size-sm);
            max-width: 240px;
            line-height: 1.5;
        `;
        
        const comingSoon = document.createElement('div');
        comingSoon.textContent = 'Coming Soon';
        comingSoon.style.cssText = `
            margin-top: var(--spacing-3);
            padding: var(--spacing-1) var(--spacing-2);
            background: var(--color-bg-secondary);
            border-radius: var(--radius-sm);
            font-size: var(--font-size-xs);
            color: var(--color-text-tertiary);
        `;
        
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
        footer.style.cssText = `
            display: flex;
            gap: var(--spacing-2);
            padding: var(--spacing-3);
            border-top: 1px solid var(--color-border);
            background: var(--color-bg-primary);
        `;
        
        // Apply button
        const applyBtn = document.createElement('button');
        applyBtn.textContent = 'Apply';
        applyBtn.className = 'tsm-btn-primary';
        applyBtn.style.cssText = `
            flex: 1;
            padding: var(--spacing-2) var(--spacing-3);
            background: var(--color-accent);
            color: white;
            border: none;
            border-radius: var(--radius-sm);
            font-size: var(--font-size-sm);
            font-weight: 500;
            cursor: pointer;
            transition: opacity 0.15s ease;
        `;
        applyBtn.addEventListener('mouseenter', () => {
            applyBtn.style.opacity = '0.9';
        });
        applyBtn.addEventListener('mouseleave', () => {
            applyBtn.style.opacity = '1';
        });
        applyBtn.addEventListener('click', () => this.applySelection());
        
        // Reset button
        const resetBtn = document.createElement('button');
        resetBtn.textContent = 'Reset';
        resetBtn.className = 'tsm-btn-secondary';
        resetBtn.style.cssText = `
            padding: var(--spacing-2) var(--spacing-3);
            background: var(--color-bg-secondary);
            color: var(--color-text-primary);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-sm);
            font-size: var(--font-size-sm);
            font-weight: 500;
            cursor: pointer;
            transition: background 0.15s ease;
        `;
        resetBtn.addEventListener('mouseenter', () => {
            resetBtn.style.background = 'var(--color-bg-hover)';
        });
        resetBtn.addEventListener('mouseleave', () => {
            resetBtn.style.background = 'var(--color-bg-secondary)';
        });
        resetBtn.addEventListener('click', () => this.resetFonts());
        
        footer.appendChild(resetBtn);
        footer.appendChild(applyBtn);
        
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
        
        // Update UI
        this.renderPresetGrid();
        this.showToast('Typography reset to default');
    }

    showToast(message) {
        // Simple toast notification
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: var(--spacing-4);
            left: 50%;
            transform: translateX(-50%);
            padding: var(--spacing-2) var(--spacing-4);
            background: var(--color-bg-elevated);
            color: var(--color-text-primary);
            border-radius: var(--radius-md);
            font-size: var(--font-size-sm);
            box-shadow: var(--shadow-lg);
            z-index: 10000;
            animation: fadeInUp 0.2s ease;
        `;
        
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
