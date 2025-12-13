/**
 * TypographyStyleManager.js
 * A draggable panel for managing typography with font presets, custom styles, and AI generation.
 */

import { DraggablePanel } from '../components/DraggablePanel.js';
import { SegmentedControl } from '../components/SegmentedControl.js';
import { Dropdown } from '../components/Dropdown.js';
import { Button } from '../components/Button.js';
import { store } from '../../core/Store.js';
import { AVAILABLE_FONTS } from '../../core/constants/FontPresets.js';
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

        this._presetFontsPreloadPromise = null;
        
        this.buildUI();
    }

    onOpen() {
        // Keep the list up to date and ensure previews render with correct fonts.
        if (this.activeTab === 'presets') {
            this.renderPresetGrid();
        }
        this.preloadAllPresetFonts();
    }

    preloadAllPresetFonts() {
        if (this._presetFontsPreloadPromise) return this._presetFontsPreloadPromise;

        const state = store.getState();
        const presets = Object.values(state.typographyStylePresets || {});

        const fontFamilies = new Set();
        presets.forEach(preset => {
            if (preset?.fonts?.heading) fontFamilies.add(preset.fonts.heading);
            if (preset?.fonts?.body) fontFamilies.add(preset.fonts.body);

            // Defensive: some presets may include explicit per-style families.
            if (preset?.textStyles) {
                Object.values(preset.textStyles).forEach(style => {
                    if (style?.fontFamily) fontFamilies.add(style.fontFamily);
                });
            }
        });

        this._presetFontsPreloadPromise = Promise.allSettled(
            Array.from(fontFamilies)
                .filter(Boolean)
                .map(family => fontManager.loadFont(family))
        ).catch(() => {
            // Avoid breaking panel open if font loading fails.
        });

        return this._presetFontsPreloadPromise;
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
            options: [
                { label: 'All', value: 'all' },
                { label: 'Sans Serif', value: 'Sans Serif' },
                { label: 'Serif', value: 'Serif' },
                { label: 'Monospace', value: 'Monospace' },
                { label: 'Display', value: 'Display' }
            ],
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
        
        // Get typography presets from state
        const state = store.getState();
        const typographyPresets = Object.values(state.typographyStylePresets || {});
        
        // Filter by category
        let presets = this.currentCategory === 'all' 
            ? typographyPresets
            : typographyPresets.filter(p => p.category === this.currentCategory);
        
        // Filter by search query
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            presets = presets.filter(p => 
                p.name.toLowerCase().includes(query) ||
                p.description?.toLowerCase().includes(query) ||
                p.fonts?.heading?.toLowerCase().includes(query) ||
                p.fonts?.body?.toLowerCase().includes(query)
            );
        }
        
        presets.forEach(preset => {
            const card = this.createPresetCard(preset);
            this.presetGrid.appendChild(card);
        });
        
        if (presets.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.textContent = 'No typography presets found';
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
        headingPreview.style.fontFamily = `"${preset.fonts.heading}", sans-serif`;
        headingPreview.style.fontWeight = '700';
        
        // Body preview
        const bodyPreview = document.createElement('div');
        bodyPreview.textContent = 'Body text sample';
        bodyPreview.className = 'tsm-body-preview';
        bodyPreview.style.fontFamily = `"${preset.fonts.body}", sans-serif`;
        bodyPreview.style.fontWeight = '400';
        
        // Font names
        const fontNames = document.createElement('div');
        fontNames.textContent = `${preset.fonts.heading} / ${preset.fonts.body}`;
        fontNames.className = 'tsm-font-names';
        
        preview.appendChild(headingPreview);
        preview.appendChild(bodyPreview);
        preview.appendChild(fontNames);
        card.appendChild(preview);
        
        // Click handler - apply immediately (like Color Theme)
        card.addEventListener('click', () => {
            this.selectPreset(preset, card);
        });
        
        return card;
    }

    selectPreset(preset, card) {
        this.selectedPreset = preset;
        
        // Update card borders via class
        const cards = this.presetGrid.querySelectorAll('.tsm-preset-card');
        cards.forEach(c => {
            c.classList.remove('selected');
        });
        card.classList.add('selected');
        
        // Apply immediately (like Color Theme click-to-apply)
        this.applyPreset(preset);
    }

    applyPreset(preset) {
        const state = store.getState();
        const mode = state.editor.mode;
        
        // Load fonts first
        this.loadPresetFonts(preset);
        
        if (mode === 'master') {
            // Master mode: apply to master
            const masterId = state.editor.activeMasterId || 'theme-default';
            store.dispatch('UPDATE_MASTER_STYLE_ASSIGNMENTS', {
                masterId,
                styleAssignments: { typographyStyle: preset.id }
            });
        } else {
            // Slide mode: apply to slide (per-slide override)
            const slideId = state.editor.activeSlideId;
            store.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
                slideId,
                styleAssignments: { typographyStyle: preset.id }
            });
        }
        
        this.showToast(`Applied "${preset.name}" typography`);
    }

    async loadPresetFonts(preset) {
        const fontsToLoad = [
            preset.fonts?.heading,
            preset.fonts?.body
        ].filter(Boolean);
        
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
        
        // Reset button (like Color Theme - resets to inherited)
        this.resetBtn = new Button({
            label: 'Reset to Inherited',
            variant: 'secondary',
            size: 'md',
            onClick: () => this.resetFonts()
        });
        
        footer.appendChild(this.resetBtn.element);
        
        return footer;
    }

    // ========================================
    // ACTIONS
    // ========================================
    resetFonts() {
        const state = store.getState();
        const mode = state.editor.mode;
        
        if (mode === 'master') {
            // For masters, reset to default preset
            const masterId = state.editor.activeMasterId || 'theme-default';
            store.dispatch('UPDATE_MASTER_STYLE_ASSIGNMENTS', {
                masterId,
                styleAssignments: { typographyStyle: 'typo-style-default' }
            });
        } else {
            // For slides, reset to null (inherit from cascade)
            const slideId = state.editor.activeSlideId;
            store.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
                slideId,
                styleAssignments: { typographyStyle: null }
            });
        }
        
        this.selectedPreset = null;
        
        // Update UI
        this.renderPresetGrid();
        this.showToast('Typography reset to inherited');
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
