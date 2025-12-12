/**
 * ColorThemeManager.js
 * 
 * Main color theme manager panel using the luma-locked tonal system.
 * Two-column layout: Theme list (left) + Editor (right)
 * 
 * Architecture:
 * - 12 slots organized in 4 columns (roles) × 3 rows (tonal clusters)
 * - Columns: Secondary 1, Primary, Accent, Secondary 2
 * - Rows: Shadows (L: 5-25%), Midtones (L: 35-65%), Highlights (L: 70-97%)
 * - Column headers are editable via ColorPicker with luma locked at 60%
 * - Grid swatches are read-only displays
 * - Photo-style adjustments affect all slots: Brightness, Contrast, Highlights, Shadows, Whites, Blacks, Saturation
 * 
 * Theme Hierarchy:
 * - Master slide → Layout master slide → Individual slide → Individual object property
 * - More specific theme choice overrides less specific
 * 
 * Light/Dark Mode:
 * - Controlled at Master Slide level, NOT in this panel
 * - Same theme works for both modes
 */

import { DraggablePanel } from '../../components/DraggablePanel.js';
import { SliderControl } from '../../components/SliderControl.js';
import { IconButton } from '../../components/IconButton.js';
import { Button } from '../../components/Button.js';
import { Icons } from '../../Icons.js';
import { store } from '../../../core/Store.js';
import {
    LUMA_SLOTS,
    COLUMN_DEFINITIONS,
    COLUMN_HEADER_LUMA,
    DEFAULT_ADJUSTMENTS,
    COLOR_HARMONIES,
    MIN_LUMA_DELTA,
    COLOR_MODES,
    hslToHex,
    hexToHsl,
    generateThemeColors,
    generateInvertedThemeColors,
    generateHarmonyTheme,
    generateColumnHarmonyTheme,
    generateRandomAdjustments,
    generateThemeName,
    calculateEffectiveLumaValues,
    validateAdjustments,
    extractThemeFromImage,
    applyThemeToCSSVariables,
    createTheme,
    cloneTheme,
    generateThemeId,
    validateTheme,
    isColorDark,
    updateColumnHue,
    getColumnHueSaturation,
    getColumnHeaderColor,
    getSlotColumn,
    getSlotRow
} from './ColorThemeUtils.js';
import { HueSaturationPopover } from './HueSaturationPopover.js';
import { THEME_PRESETS, isPresetTheme } from './ThemePresets.js';
import { ThemeDiag } from '../../../utils/ThemeDiagnostics.js';

export class ColorThemeManager extends DraggablePanel {
    constructor(options = {}) {
        super({
            id: 'color-theme-manager',
            title: 'Color Themes',
            defaultWidth: 520,
            defaultHeight: 580,
            minWidth: 480,
            minHeight: 400,
            maxWidth: 720,
            maxHeight: 900,
            resizable: true,
            closable: true,
            minimizable: true
        });
        
        // Default onThemeChange dispatches to store
        const defaultOnThemeChange = (theme) => {
            this.applyThemeToStore(theme);
        };
        
        this.managerOptions = {
            onThemeChange: options.onThemeChange || defaultOnThemeChange,
            onThemeApply: options.onThemeApply || (() => {}),
            ...options
        };
        
        // State
        this.themes = [...THEME_PRESETS];
        this.customThemes = [];
        this.selectedThemeId = null;
        this.selectedColumnIndex = null; // Column being edited (0-3)
        this.adjustmentsExpanded = true;
        this.generateExpanded = true;
        this.selectedHarmony = COLOR_HARMONIES.COMPLEMENTARY;
        this.lockedColumns = new Set(); // Columns locked from Generate (0-3)
        this.generateHues = true;      // Generate will randomize hues
        this.generateAdjustments = true; // Generate will randomize adjustments (default checked)
        this.hueSatPopover = null; // Reference to open hue/saturation popover
        
        // Load custom themes from storage
        this.loadCustomThemes();
        
        // DOM references
        this.themeListEl = null;
        this.themeEditorEl = null;
        this.columnEditEl = null; // Column color picker element
        this.dropzoneEl = null;
        this.adjustmentSliders = {};
        
        this.buildUI();
    }
    
    /**
     * Build the panel UI
     */
    buildUI() {
        // Use contentElement from DraggablePanel
        this.contentElement.classList.add('ctm');
        
        // Create columns container
        const columns = document.createElement('div');
        columns.className = 'ctm__columns';
        
        // Left column: Theme list
        columns.appendChild(this.createThemeList());
        
        // Divider
        const divider = document.createElement('div');
        divider.className = 'ctm__divider';
        columns.appendChild(divider);
        
        // Right column: Theme editor
        columns.appendChild(this.createThemeEditor());
        
        this.contentElement.appendChild(columns);
        
        // Select first theme by default
        if (this.themes.length > 0) {
            this.selectTheme(this.themes[0].id);
        }
    }
    
    /**
     * Create the theme list (left column)
     */
    createThemeList() {
        const list = document.createElement('div');
        list.className = 'ctm__left-column';
        this.themeListEl = list;
        
        // Header
        const header = document.createElement('div');
        header.className = 'ctm__list-header';
        
        const title = document.createElement('h3');
        title.className = 'ctm__list-title';
        title.textContent = 'Themes';
        header.appendChild(title);
        
        const actions = document.createElement('div');
        actions.className = 'ctm__list-actions';
        
        const addBtn = new IconButton({
            icon: Icons.PLUS,
            size: 'small',
            title: 'New Theme',
            onClick: () => this.createNewTheme()
        });
        actions.appendChild(addBtn.element);
        
        const extractBtn = new IconButton({
            icon: Icons.IMAGE,
            size: 'small',
            title: 'Extract from Image',
            onClick: () => this.showImagePicker()
        });
        actions.appendChild(extractBtn.element);
        
        const importBtn = new IconButton({
            icon: Icons.IMPORT,
            size: 'small',
            title: 'Import Theme from JSON',
            onClick: () => this.showImportDialog()
        });
        actions.appendChild(importBtn.element);
        
        header.appendChild(actions);
        list.appendChild(header);
        
        // Items container
        const items = document.createElement('div');
        items.className = 'ctm__theme-list';
        list.appendChild(items);
        
        this.renderThemeList();
        
        return list;
    }
    
    /**
     * Render the theme list items
     */
    renderThemeList() {
        const items = this.themeListEl.querySelector('.ctm__theme-list');
        items.innerHTML = '';
        
        // Presets section
        const presetsTitle = document.createElement('div');
        presetsTitle.className = 'ctm__section-title';
        presetsTitle.textContent = 'Presets';
        items.appendChild(presetsTitle);
        
        THEME_PRESETS.forEach(theme => {
            items.appendChild(this.createThemeItem(theme));
        });
        
        // Custom section
        if (this.customThemes.length > 0) {
            const customTitle = document.createElement('div');
            customTitle.className = 'ctm__section-title';
            customTitle.textContent = 'Custom';
            items.appendChild(customTitle);
            
            this.customThemes.forEach(theme => {
                items.appendChild(this.createThemeItem(theme, true));
            });
        }
    }
    
    /**
     * Create a theme list item
     */
    createThemeItem(theme, isCustom = false) {
        const item = document.createElement('button');
        item.className = 'ctm__theme-item';
        item.dataset.themeId = theme.id;
        
        if (theme.id === this.selectedThemeId) {
            item.classList.add('ctm__theme-item--selected');
        }
        
        // Preview swatches (6x2 grid)
        const preview = document.createElement('div');
        preview.className = 'ctm__theme-preview';
        
        const colors = generateThemeColors(theme.slots, theme.adjustments || DEFAULT_ADJUSTMENTS);
        
        colors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'ctm__preview-swatch';
            swatch.style.backgroundColor = color;
            preview.appendChild(swatch);
        });
        
        item.appendChild(preview);
        
        // Name
        const name = document.createElement('span');
        name.className = 'ctm__theme-name';
        name.textContent = theme.name;
        item.appendChild(name);
        
        // Lock icon for presets
        if (!isCustom) {
            const lock = document.createElement('span');
            lock.className = 'ctm__theme-lock';
            lock.innerHTML = Icons.LOCK;
            item.appendChild(lock);
        }
        
        // Actions for custom themes
        if (isCustom) {
            const actions = document.createElement('div');
            actions.className = 'ctm__theme-actions';
            
            const deleteBtn = new IconButton({
                icon: Icons.TRASH,
                title: 'Delete theme',
                onClick: (e) => {
                    e.stopPropagation();
                    this.deleteTheme(theme.id);
                }
            });
            actions.appendChild(deleteBtn.element);
            
            item.appendChild(actions);
        }
        
        // Click handler
        item.addEventListener('click', () => this.selectTheme(theme.id));
        
        return item;
    }
    
    /**
     * Create the theme editor (right column)
     */
    createThemeEditor() {
        const editor = document.createElement('div');
        editor.className = 'ctm__right-column';
        this.themeEditorEl = editor;
        
        // Will be populated when a theme is selected
        this.renderThemeEditor();
        
        return editor;
    }
    
    /**
     * Render the theme editor content
     */
    renderThemeEditor() {
        const editor = this.themeEditorEl;
        editor.innerHTML = '';
        
        // Close any open color picker
        this.closeColorPicker();
        
        const theme = this.getSelectedTheme();
        if (!theme) {
            this.renderEmptyState(editor);
            return;
        }
        
        // Main editor container
        const editorContent = document.createElement('div');
        editorContent.className = 'ctm__editor';
        
        // Header with name and actions
        editorContent.appendChild(this.createEditorHeader(theme));
        
        // Column headers (editable swatches at 60% luma)
        editorContent.appendChild(this.createColumnHeaders(theme));
        
        // Slot grid (4 columns × 3 rows, read-only)
        editorContent.appendChild(this.createSlotGrid(theme));
        
        // Generate section
        editorContent.appendChild(this.createGenerateSection(theme));
        
        // Adjustments section
        editorContent.appendChild(this.createAdjustments(theme));
        
        editor.appendChild(editorContent);
    }
    
    /**
     * Create editor header (without invert button - Light/Dark mode is at Master Slide level)
     */
    createEditorHeader(theme) {
        const header = document.createElement('div');
        header.className = 'ctm__editor-header';
        
        // Editable name (only for custom themes)
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'ctm__editor-name';
        nameInput.value = theme.name;
        nameInput.disabled = isPresetTheme(theme.id);
        
        if (!isPresetTheme(theme.id)) {
            nameInput.addEventListener('change', () => {
                this.updateThemeName(theme.id, nameInput.value);
            });
        }
        
        header.appendChild(nameInput);
        
        // Actions
        const actions = document.createElement('div');
        actions.className = 'ctm__editor-actions';
        
        // Export button
        const exportBtn = new IconButton({
            icon: Icons.EXPORT,
            size: 'small',
            title: 'Export Theme as JSON',
            onClick: () => this.exportTheme(theme.id)
        });
        actions.appendChild(exportBtn.element);
        
        // Duplicate button
        const duplicateBtn = new IconButton({
            icon: '<i class="fa-regular fa-copy"></i>',
            size: 'small',
            title: 'Duplicate Theme',
            onClick: () => this.duplicateTheme(theme.id)
        });
        actions.appendChild(duplicateBtn.element);
        
        header.appendChild(actions);
        
        return header;
    }
    
    /**
     * Create column header swatches (editable via ColorPicker at 60% luma)
     */
    createColumnHeaders(theme) {
        const section = document.createElement('div');
        section.className = 'ctm__column-headers';
        
        // Header row with role labels
        const headerRow = document.createElement('div');
        headerRow.className = 'ctm__column-header-row';
        
        COLUMN_DEFINITIONS.forEach((colDef, columnIndex) => {
            const column = document.createElement('div');
            column.className = 'ctm__column-header';
            
            // Get the column's current hue and saturation
            const { h, s } = getColumnHueSaturation(theme.slots, columnIndex);
            const headerColor = hslToHex(h, s, COLUMN_HEADER_LUMA);
            const isLocked = this.lockedColumns.has(columnIndex);
            
            // Clickable swatch
            const swatch = document.createElement('button');
            swatch.className = 'ctm__column-swatch';
            swatch.style.backgroundColor = headerColor;
            swatch.title = `${colDef.label}: Click to edit hue & saturation`;
            swatch.dataset.columnIndex = columnIndex;
            
            if (this.selectedColumnIndex === columnIndex) {
                swatch.classList.add('ctm__column-swatch--selected');
            }
            if (isLocked) {
                swatch.classList.add('ctm__column-swatch--locked');
                const lockIcon = document.createElement('div');
                lockIcon.className = 'ctm__column-lock-icon';
                lockIcon.innerHTML = Icons.LOCK;
                lockIcon.style.color = isColorDark(headerColor) ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)';
                swatch.appendChild(lockIcon);
            }
            
            // Click to open color picker
            swatch.addEventListener('click', (e) => {
                if (e.shiftKey) {
                    this.toggleColumnLock(columnIndex);
                } else {
                    this.openColumnColorPicker(columnIndex, swatch);
                }
            });
            
            // Right-click to toggle lock
            swatch.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.toggleColumnLock(columnIndex);
            });
            
            column.appendChild(swatch);
            
            // Role label below swatch
            const label = document.createElement('div');
            label.className = 'ctm__column-label';
            label.textContent = colDef.label;
            column.appendChild(label);
            
            headerRow.appendChild(column);
        });
        
        section.appendChild(headerRow);
        
        // Hint text
        const hint = document.createElement('div');
        hint.className = 'ctm__hint';
        hint.textContent = 'Click header to edit column color • Shift+click to lock';
        section.appendChild(hint);
        
        return section;
    }
    
    /**
     * Create slot grid - 4 columns × 3 rows (read-only display)
     * Rows: Shadows, Midtones, Highlights
     * Columns: Secondary 1, Primary, Accent, Secondary 2
     */
    createSlotGrid(theme) {
        const section = document.createElement('div');
        section.className = 'ctm__section ctm__slots-section';
        
        // Generate colors using current adjustments
        const colors = generateThemeColors(theme.slots, theme.adjustments || DEFAULT_ADJUSTMENTS);
        
        // Calculate effective luma values for real-time display
        const effectiveLumaValues = calculateEffectiveLumaValues(theme.adjustments || DEFAULT_ADJUSTMENTS);
        
        // Define the 3 rows (clusters) - each contains 4 slots (one per column)
        const rows = [
            { name: 'Shadows', slots: [0, 1, 2, 3] },      // Slots 1-4
            { name: 'Midtones', slots: [4, 5, 6, 7] },     // Slots 5-8
            { name: 'Highlights', slots: [8, 9, 10, 11] }   // Slots 9-12
        ];
        
        rows.forEach(row => {
            const rowEl = document.createElement('div');
            rowEl.className = 'ctm__cluster-row';
            
            // Row label
            const label = document.createElement('div');
            label.className = 'ctm__cluster-label';
            label.textContent = row.name;
            rowEl.appendChild(label);
            
            // Swatches container (4 columns)
            const swatches = document.createElement('div');
            swatches.className = 'ctm__cluster-swatches';
            
            row.slots.forEach(i => {
                const slot = LUMA_SLOTS[i];
                const color = colors[i];
                const effectiveLuma = Math.round(effectiveLumaValues[i]);
                
                // Read-only swatch (not a button)
                const slotEl = document.createElement('div');
                slotEl.className = 'ctm__slot ctm__slot--readonly';
                slotEl.dataset.slotIndex = i;
                slotEl.title = `Slot ${i + 1}: H:${theme.slots[i]?.h || 0}° S:${theme.slots[i]?.s || 0}% L:${slot.luma}%`;
                
                // Swatch with luma label inside
                const swatch = document.createElement('div');
                swatch.className = 'ctm__slot-swatch';
                swatch.style.backgroundColor = color;
                
                // Check if color is clipped
                const hsl = hexToHsl(color);
                if (hsl.l <= 1 || hsl.l >= 99) {
                    swatch.classList.add('ctm__slot-swatch--clipped');
                }
                
                // Luma value inside swatch - contrast-aware color
                const lumaLabel = document.createElement('div');
                lumaLabel.className = 'ctm__slot-luma-inner';
                lumaLabel.textContent = `${effectiveLuma}`;
                // Use light text on dark backgrounds, dark text on light
                lumaLabel.style.color = isColorDark(color) ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)';
                swatch.appendChild(lumaLabel);
                
                slotEl.appendChild(swatch);
                swatches.appendChild(slotEl);
            });
            
            rowEl.appendChild(swatches);
            section.appendChild(rowEl);
        });
        
        return section;
    }
    
    /**
     * Create adjustments section
     */
    createAdjustments(theme) {
        const section = document.createElement('div');
        section.className = 'ctm__adjustments';
        
        // Header (collapsible)
        const header = document.createElement('div');
        header.className = 'ctm__adjustments-header';
        header.addEventListener('click', () => this.toggleAdjustments());
        
        const title = document.createElement('div');
        title.className = 'ctm__adjustments-title';
        title.textContent = 'Adjustments';
        header.appendChild(title);
        
        const toggle = document.createElement('div');
        toggle.className = 'ctm__adjustments-toggle';
        if (this.adjustmentsExpanded) {
            toggle.classList.add('ctm__adjustments-toggle--expanded');
        }
        toggle.innerHTML = Icons.CHEVRON_DOWN;
        header.appendChild(toggle);
        
        section.appendChild(header);
        
        // Content
        const content = document.createElement('div');
        content.className = 'ctm__adjustments-content';
        if (!this.adjustmentsExpanded) {
            content.classList.add('ctm__adjustments-content--collapsed');
        }
        
        const adjustments = theme.adjustments || DEFAULT_ADJUSTMENTS;
        
        const sliderConfigs = [
            { key: 'brightness', label: 'Brightness', min: -100, max: 100 },
            { key: 'contrast', label: 'Contrast', min: -100, max: 100 },
            { key: 'highlights', label: 'Highlights', min: -100, max: 100 },
            { key: 'shadows', label: 'Shadows', min: -100, max: 100 },
            { key: 'whites', label: 'Whites', min: -100, max: 100 },
            { key: 'blacks', label: 'Blacks', min: -100, max: 100 },
            { key: 'saturation', label: 'Saturation', min: -100, max: 100 }
        ];
        
        sliderConfigs.forEach(config => {
            const slider = new SliderControl({
                label: config.label,
                value: adjustments[config.key],
                min: config.min,
                max: config.max,
                step: 1,
                defaultValue: 0, // All adjustments default to 0 for double-click reset
                onChange: (value) => this.updateAdjustment(config.key, value)
            });
            
            this.adjustmentSliders[config.key] = slider;
            content.appendChild(slider.element);
        });
        
        // Reset button
        const resetBtn = new Button({
            icon: Icons.RESET,
            label: 'Reset',
            variant: 'text',
            size: 'sm',
            title: 'Reset All Adjustments',
            onClick: () => this.resetAdjustments()
        });
        resetBtn.element.classList.add('ctm__adjustments-reset');
        content.appendChild(resetBtn.element);
        
        section.appendChild(content);
        
        return section;
    }
    
    /**
     * Create Generate section
     */
    createGenerateSection(theme) {
        const section = document.createElement('div');
        section.className = 'ctm__generate';
        
        // Header (collapsible)
        const header = document.createElement('div');
        header.className = 'ctm__generate-header';
        header.addEventListener('click', () => this.toggleGenerate());
        
        const title = document.createElement('div');
        title.className = 'ctm__generate-title';
        title.textContent = 'Generate';
        header.appendChild(title);
        
        const toggle = document.createElement('div');
        toggle.className = 'ctm__generate-toggle';
        if (this.generateExpanded) {
            toggle.classList.add('ctm__generate-toggle--expanded');
        }
        toggle.innerHTML = Icons.CHEVRON_DOWN;
        header.appendChild(toggle);
        
        section.appendChild(header);
        
        // Content
        const content = document.createElement('div');
        content.className = 'ctm__generate-content';
        if (!this.generateExpanded) {
            content.classList.add('ctm__generate-content--collapsed');
        }
        
        // Harmony dropdown row
        const harmonyRow = document.createElement('div');
        harmonyRow.className = 'ctm__generate-row';
        
        const harmonyLabel = document.createElement('label');
        harmonyLabel.className = 'ctm__generate-label';
        harmonyLabel.textContent = 'Harmony';
        harmonyRow.appendChild(harmonyLabel);
        
        const harmonySelect = document.createElement('select');
        harmonySelect.className = 'ctm__generate-select';
        
        const harmonies = [
            { value: COLOR_HARMONIES.COMPLEMENTARY, label: 'Complementary' },
            { value: COLOR_HARMONIES.MONOCHROMATIC, label: 'Monochromatic' },
            { value: COLOR_HARMONIES.ANALOGOUS, label: 'Analogous' },
            { value: COLOR_HARMONIES.TRIADIC, label: 'Triadic' },
            { value: COLOR_HARMONIES.SPLIT_COMPLEMENTARY, label: 'Split Complementary' },
            { value: COLOR_HARMONIES.TETRADIC, label: 'Tetradic' },
            { value: COLOR_HARMONIES.SQUARE, label: 'Square' }
        ];
        
        harmonies.forEach(h => {
            const option = document.createElement('option');
            option.value = h.value;
            option.textContent = h.label;
            if (h.value === this.selectedHarmony) {
                option.selected = true;
            }
            harmonySelect.appendChild(option);
        });
        
        harmonySelect.addEventListener('change', (e) => {
            this.selectedHarmony = e.target.value;
        });
        
        harmonyRow.appendChild(harmonySelect);
        content.appendChild(harmonyRow);
        
        // Generate controls row (checkboxes + button)
        const controlsRow = document.createElement('div');
        controlsRow.className = 'ctm__generate-row';
        
        // Checkboxes container
        const checkboxes = document.createElement('div');
        checkboxes.className = 'ctm__generate-checkboxes';
        
        // Hues checkbox
        const huesLabel = document.createElement('label');
        huesLabel.className = 'ctm__generate-checkbox-label';
        const huesCheck = document.createElement('input');
        huesCheck.type = 'checkbox';
        huesCheck.checked = this.generateHues;
        huesCheck.addEventListener('change', (e) => {
            this.generateHues = e.target.checked;
        });
        huesLabel.appendChild(huesCheck);
        huesLabel.appendChild(document.createTextNode(' Hues'));
        checkboxes.appendChild(huesLabel);
        
        // Adjustments checkbox
        const adjLabel = document.createElement('label');
        adjLabel.className = 'ctm__generate-checkbox-label';
        const adjCheck = document.createElement('input');
        adjCheck.type = 'checkbox';
        adjCheck.checked = this.generateAdjustments;
        adjCheck.addEventListener('change', (e) => {
            this.generateAdjustments = e.target.checked;
        });
        adjLabel.appendChild(adjCheck);
        adjLabel.appendChild(document.createTextNode(' Adjustments'));
        checkboxes.appendChild(adjLabel);
        
        controlsRow.appendChild(checkboxes);
        
        // Generate button
        const generateBtn = new Button({
            icon: Icons.SPARKLE,
            label: 'Generate',
            variant: 'primary',
            size: 'md',
            onClick: () => this.generateRandomColors()
        });
        generateBtn.element.classList.add('ctm__generate-button');
        controlsRow.appendChild(generateBtn.element);
        
        content.appendChild(controlsRow);
        
        // Note about locked columns
        const note = document.createElement('div');
        note.className = 'ctm__generate-note';
        const lockedCount = this.lockedColumns.size;
        if (lockedCount > 0) {
            note.textContent = `${lockedCount} column${lockedCount > 1 ? 's' : ''} locked`;
        } else {
            note.textContent = 'Lock columns to preserve during generation';
        }
        content.appendChild(note);
        
        section.appendChild(content);
        
        return section;
    }
    
    /**
     * Create image dropzone
     */
    createImageDropzone() {
        const section = document.createElement('div');
        section.className = 'ctm__dropzone-section';
        
        const dropzone = document.createElement('div');
        dropzone.className = 'ctm__dropzone';
        this.dropzoneEl = dropzone;
        
        const icon = document.createElement('div');
        icon.className = 'ctm__dropzone-icon';
        icon.innerHTML = Icons.IMAGE;
        dropzone.appendChild(icon);
        
        const text = document.createElement('div');
        text.className = 'ctm__dropzone-text';
        text.textContent = 'Drop image to create theme';
        dropzone.appendChild(text);
        
        const formats = document.createElement('div');
        formats.className = 'ctm__dropzone-formats';
        formats.textContent = 'JPG, PNG, WebP';
        dropzone.appendChild(formats);
        
        // Click to browse
        dropzone.addEventListener('click', () => this.showImagePicker());
        
        // Drag and drop events
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('ctm__dropzone--dragover');
        });
        
        dropzone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropzone.classList.remove('ctm__dropzone--dragover');
        });
        
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('ctm__dropzone--dragover');
            
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.extractThemeFromFile(file);
            }
        });
        
        section.appendChild(dropzone);
        
        return section;
    }
    
    /**
     * Render empty state
     */
    renderEmptyState(container) {
        const empty = document.createElement('div');
        empty.className = 'ctm__empty';
        
        const icon = document.createElement('div');
        icon.className = 'ctm__empty-icon';
        icon.innerHTML = '🎨';
        empty.appendChild(icon);
        
        const text = document.createElement('div');
        text.className = 'ctm__empty-text';
        text.textContent = 'Select a theme to edit';
        empty.appendChild(text);
        
        container.appendChild(empty);
    }
    
    // =========================================
    // State Management
    // =========================================
    
    /**
     * Get selected theme
     */
    getSelectedTheme() {
        if (!this.selectedThemeId) return null;
        
        const preset = THEME_PRESETS.find(t => t.id === this.selectedThemeId);
        if (preset) return preset;
        
        return this.customThemes.find(t => t.id === this.selectedThemeId);
    }
    
    /**
     * Select a theme
     */
    selectTheme(themeId) {
        this.selectedThemeId = themeId;
        this.selectedColumnIndex = null;
        this.closeColorPicker();
        
        this.renderThemeList();
        this.renderThemeEditor();
        
        const theme = this.getSelectedTheme();
        if (theme) {
            // Diagnostic logging for ColorThemeManager panel display
            const state = store.getState();
            ThemeDiag.logUIDisplay('ColorThemeManager', {
                selectedThemeId: themeId,
                selectedThemeName: theme.name,
                editorMode: state.editor.mode,
                activeSlideId: state.editor.activeSlideId,
                activeMasterId: state.editor.activeMasterId,
                willApplyTo: state.editor.mode === 'master' ? 
                    (state.slideMasterPresets?.[state.editor.activeMasterId]?.type === 'slideMasterPreset' ? 'Theme Master' : `Layout: ${state.slideMasterPresets?.[state.editor.activeMasterId]?.name}`) :
                    `Slide: ${state.editor.activeSlideId}`
            });
            
            this.managerOptions.onThemeChange(theme);
        }
    }
    
    /**
     * Open hue/saturation popover for a column
     */
    openColumnColorPicker(columnIndex, swatchElement) {
        const theme = this.getSelectedTheme();
        if (!theme) return;
        
        // If editing a preset, duplicate first
        if (isPresetTheme(theme.id)) {
            this.duplicateTheme(theme.id);
            setTimeout(() => this.openColumnColorPicker(columnIndex, swatchElement), 100);
            return;
        }
        
        // Close existing popover
        this.closeColorPicker();
        
        this.selectedColumnIndex = columnIndex;
        
        // Get current column hue and saturation
        const { h, s } = getColumnHueSaturation(theme.slots, columnIndex);
        
        // Create hue/saturation popover
        this.hueSatPopover = new HueSaturationPopover({
            hue: h,
            saturation: s,
            onChange: (hue, saturation) => this.updateColumnColor(columnIndex, hue, saturation),
            onClose: () => this.closeColorPicker()
        });
        
        // Position the popover near the swatch
        this.hueSatPopover.positionRelativeTo(swatchElement, this.element);
        
        // Update UI to show selected state
        this.updateColumnHeaderSelection();
    }
    
    /**
     * Close color picker
     */
    closeColorPicker() {
        if (this.hueSatPopover) {
            this.hueSatPopover.destroy();
            this.hueSatPopover = null;
        }
        this.selectedColumnIndex = null;
        this.updateColumnHeaderSelection();
    }
    
    /**
     * Update visual selection state of column headers (without full re-render)
     */
    updateColumnHeaderSelection() {
        const swatches = this.themeEditorEl?.querySelectorAll('.ctm__column-swatch');
        if (!swatches) return;
        
        swatches.forEach((swatch, index) => {
            swatch.classList.toggle('ctm__column-swatch--selected', index === this.selectedColumnIndex);
        });
    }
    
    /**
     * Update column color (hue and saturation for all slots in column)
     */
    updateColumnColor(columnIndex, hue, saturation) {
        const theme = this.getSelectedTheme();
        if (!theme) return;
        
        // Update all slots in the column with the new hue and saturation
        theme.slots = updateColumnHue(theme.slots, columnIndex, hue, saturation);
        theme.modifiedAt = Date.now();
        
        // Update only the affected column header swatch and grid column
        this.updateColumnSwatches(columnIndex, theme);
        this.renderThemeList();
        
        // Save custom theme changes to localStorage BEFORE applying
        // This ensures StyleResolver can look up the updated colors
        if (!isPresetTheme(theme.id)) {
            this.saveCustomThemes();
        }
        
        this.managerOptions.onThemeChange(theme);
    }
    
    /**
     * Update the visual display for a specific column (header + grid swatches)
     */
    updateColumnSwatches(columnIndex, theme) {
        // Update column header swatch
        const headerSwatch = this.themeEditorEl?.querySelector(`.ctm__column-swatch[data-column-index="${columnIndex}"]`);
        if (headerSwatch) {
            const { h, s } = getColumnHueSaturation(theme.slots, columnIndex);
            const headerColor = hslToHex(h, s, COLUMN_HEADER_LUMA);
            headerSwatch.style.backgroundColor = headerColor;
            
            // Update lock icon color if present
            const lockIcon = headerSwatch.querySelector('.ctm__column-lock-icon');
            if (lockIcon) {
                lockIcon.style.color = isColorDark(headerColor) ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)';
            }
        }
        
        // Update grid swatches for this column
        const colors = generateThemeColors(theme.slots, theme.adjustments || DEFAULT_ADJUSTMENTS);
        const effectiveLumaValues = calculateEffectiveLumaValues(theme.adjustments || DEFAULT_ADJUSTMENTS);
        
        // Column slots: 0,4,8 for col0; 1,5,9 for col1; etc.
        const slotIndices = [columnIndex, columnIndex + 4, columnIndex + 8];
        
        slotIndices.forEach(slotIndex => {
            const slotEl = this.themeEditorEl?.querySelector(`.ctm__slot[data-slot-index="${slotIndex}"]`);
            if (slotEl) {
                const swatch = slotEl.querySelector('.ctm__slot-swatch');
                const color = colors[slotIndex];
                if (swatch) {
                    swatch.style.backgroundColor = color;
                    
                    // Update clipped state
                    const hsl = hexToHsl(color);
                    swatch.classList.toggle('ctm__slot-swatch--clipped', hsl.l <= 1 || hsl.l >= 99);
                    
                    // Update luma label color
                    const lumaLabel = swatch.querySelector('.ctm__slot-luma-inner');
                    if (lumaLabel) {
                        lumaLabel.textContent = `${Math.round(effectiveLumaValues[slotIndex])}`;
                        lumaLabel.style.color = isColorDark(color) ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)';
                    }
                }
            }
        });
    }
    
    /**
     * Toggle column lock
     */
    toggleColumnLock(columnIndex) {
        if (this.lockedColumns.has(columnIndex)) {
            this.lockedColumns.delete(columnIndex);
        } else {
            this.lockedColumns.add(columnIndex);
        }
        this.renderThemeEditor();
    }
    
    /**
     * Update adjustment value
     */
    updateAdjustment(key, value) {
        const theme = this.getSelectedTheme();
        if (!theme) return;
        
        // If editing a preset, duplicate first
        if (isPresetTheme(theme.id)) {
            this.duplicateTheme(theme.id);
            setTimeout(() => this.updateAdjustment(key, value), 100);
            return;
        }
        
        // Always create a new adjustments object to avoid mutating frozen objects
        const currentAdjustments = theme.adjustments || DEFAULT_ADJUSTMENTS;
        theme.adjustments = { ...currentAdjustments, [key]: value };
        theme.modifiedAt = Date.now();
        
        this.renderThemeEditor();
        this.renderThemeList(); // Update preview in left column in real-time
        
        // Save custom theme changes to localStorage BEFORE applying
        // This ensures StyleResolver can look up the updated colors
        this.saveCustomThemes();
        
        this.managerOptions.onThemeChange(theme);
    }
    
    /**
     * Reset all adjustments
     */
    resetAdjustments() {
        const theme = this.getSelectedTheme();
        if (!theme || isPresetTheme(theme.id)) return;
        
        theme.adjustments = { ...DEFAULT_ADJUSTMENTS };
        theme.modifiedAt = Date.now();
        
        // Update sliders
        Object.keys(this.adjustmentSliders).forEach(key => {
            this.adjustmentSliders[key].setValue(0);
        });
        
        this.renderThemeEditor();
        this.managerOptions.onThemeChange(theme);
    }
    
    /**
     * Toggle adjustments section
     */
    toggleAdjustments() {
        this.adjustmentsExpanded = !this.adjustmentsExpanded;
        this.renderThemeEditor();
    }
    
    /**
     * Toggle generate section
     */
    toggleGenerate() {
        this.generateExpanded = !this.generateExpanded;
        this.renderThemeEditor();
    }
    
    /**
     * Generate random colors using selected harmony (4-column system)
     */
    generateRandomColors() {
        let theme = this.getSelectedTheme();
        if (!theme) return;
        
        // Check if at least one option is selected
        if (!this.generateHues && !this.generateAdjustments) {
            console.warn('Select at least Hues or Adjustments to generate');
            return;
        }
        
        // If editing a preset, duplicate first
        if (isPresetTheme(theme.id)) {
            this.duplicateTheme(theme.id);
            setTimeout(() => this.generateRandomColors(), 100);
            return;
        }
        
        // Check if all columns are locked (only matters for hues)
        if (this.generateHues && this.lockedColumns.size >= 4) {
            console.warn('All columns are locked');
            return;
        }
        
        // Generate new hues if checkbox is checked
        if (this.generateHues) {
            const newSlots = generateColumnHarmonyTheme(
                this.selectedHarmony,
                Array.from(this.lockedColumns),
                theme.slots
            );
            theme.slots = newSlots;
            
            // Generate a creative name based on the new colors
            theme.name = generateThemeName(newSlots);
        }
        
        // Generate new adjustments if checkbox is checked
        if (this.generateAdjustments) {
            const newAdjustments = generateRandomAdjustments();
            theme.adjustments = newAdjustments;
        }
        
        theme.modifiedAt = Date.now();
        
        this.renderThemeEditor();
        this.renderThemeList(); // Update preview in left column
        
        // Save custom theme changes to localStorage BEFORE applying
        // This ensures StyleResolver can look up the updated colors
        this.saveCustomThemes();
        
        this.managerOptions.onThemeChange(theme);
    }
    
    /**
     * Extract theme from file
     */
    async extractThemeFromFile(file) {
        const image = new Image();
        
        image.onload = async () => {
            const slots = await extractThemeFromImage(image);
            
            const id = generateThemeId();
            const theme = createTheme(
                id,
                `From ${file.name.replace(/\.[^/.]+$/, '')}`,
                slots,
                false
            );
            
            this.customThemes.push(theme);
            this.saveCustomThemes();
            this.selectTheme(id);
            
            URL.revokeObjectURL(image.src);
        };
        
        image.onerror = () => {
            console.error('Failed to load image');
            URL.revokeObjectURL(image.src);
        };
        
        image.src = URL.createObjectURL(file);
    }
    
    // =========================================
    // Theme Operations
    // =========================================
    
    /**
     * Create a new theme
     */
    createNewTheme() {
        const id = generateThemeId();
        const theme = createTheme(
            id,
            'New Theme',
            LUMA_SLOTS.map(() => ({ h: 0, s: 0 })),
            false
        );
        
        this.customThemes.push(theme);
        this.saveCustomThemes();
        this.selectTheme(id);
    }
    
    /**
     * Duplicate a theme
     */
    duplicateTheme(themeId) {
        const original = this.getSelectedTheme() || 
            THEME_PRESETS.find(t => t.id === themeId) ||
            this.customThemes.find(t => t.id === themeId);
        
        if (!original) return;
        
        const newId = generateThemeId();
        const newTheme = cloneTheme(original, newId, `${original.name} Copy`);
        
        this.customThemes.push(newTheme);
        this.saveCustomThemes();
        this.selectTheme(newId);
    }
    
    /**
     * Delete a theme
     */
    deleteTheme(themeId) {
        if (isPresetTheme(themeId)) return;
        
        const index = this.customThemes.findIndex(t => t.id === themeId);
        if (index === -1) return;
        
        this.customThemes.splice(index, 1);
        this.saveCustomThemes();
        
        if (this.selectedThemeId === themeId) {
            this.selectTheme(THEME_PRESETS[0].id);
        } else {
            this.renderThemeList();
        }
    }
    
    /**
     * Update theme name
     */
    updateThemeName(themeId, name) {
        const theme = this.customThemes.find(t => t.id === themeId);
        if (!theme) return;
        
        theme.name = name;
        theme.modifiedAt = Date.now();
        
        this.saveCustomThemes();
        this.renderThemeList();
    }
    
    /**
     * Save the current theme
     */
    saveTheme() {
        this.saveCustomThemes();
    }
    
    /**
     * Apply the current theme
     */
    applyTheme() {
        const theme = this.getSelectedTheme();
        if (!theme) return;
        
        const colors = this.isInverted
            ? generateInvertedThemeColors(theme.slots, theme.adjustments || DEFAULT_ADJUSTMENTS)
            : generateThemeColors(theme.slots, theme.adjustments || DEFAULT_ADJUSTMENTS);
        
        // NOTE: We no longer apply CSS variables globally here.
        // CSS variables are applied per-slide in SlideView.update() via StyleResolver.
        // This prevents theme changes from polluting all slides.
        // The applyThemeToStore() method handles dispatching the appropriate store action.
        
        this.managerOptions.onThemeApply(theme, colors);
    }
    
    // =========================================
    // Image Extraction
    // =========================================
    
    /**
     * Show image picker dialog
     */
    showImagePicker() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.className = 'image-picker__input';
        
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const image = new Image();
            image.onload = async () => {
                const slots = await extractThemeFromImage(image);
                
                const id = generateThemeId();
                const theme = createTheme(
                    id,
                    `Theme from ${file.name}`,
                    slots,
                    false
                );
                
                this.customThemes.push(theme);
                this.saveCustomThemes();
                this.selectTheme(id);
            };
            
            image.src = URL.createObjectURL(file);
        });
        
        input.click();
    }
    
    // =========================================
    // Export/Import
    // =========================================
    
    /**
     * Export theme schema version for compatibility checking
     */
    static get THEME_SCHEMA_VERSION() {
        return '1.0';
    }
    
    /**
     * Export a theme to JSON file
     * @param {string} themeId - ID of the theme to export
     */
    exportTheme(themeId) {
        const theme = this.getThemeById(themeId);
        if (!theme) {
            console.warn('Theme not found for export:', themeId);
            return;
        }
        
        // Create export data with schema version and metadata
        const exportData = {
            schemaVersion: ColorThemeManager.THEME_SCHEMA_VERSION,
            exportedAt: new Date().toISOString(),
            theme: {
                name: theme.name,
                slots: theme.slots.map(slot => ({
                    h: slot.h,
                    s: slot.s
                })),
                adjustments: { ...(theme.adjustments || DEFAULT_ADJUSTMENTS) }
            }
        };
        
        // Create JSON blob and download
        const json = JSON.stringify(exportData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.sanitizeFilename(theme.name)}.theme.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(url);
    }
    
    /**
     * Get a theme by ID (from presets or custom themes)
     * @param {string} themeId - Theme ID
     * @returns {Object|null} Theme object or null
     */
    getThemeById(themeId) {
        const preset = THEME_PRESETS.find(t => t.id === themeId);
        if (preset) return preset;
        return this.customThemes.find(t => t.id === themeId);
    }
    
    /**
     * Sanitize a string for use as filename
     * @param {string} name - Name to sanitize
     * @returns {string} Sanitized filename
     */
    sanitizeFilename(name) {
        return name
            .replace(/[^a-z0-9\s-]/gi, '') // Remove invalid chars
            .replace(/\s+/g, '-')           // Replace spaces with dashes
            .replace(/-+/g, '-')            // Replace multiple dashes with single
            .toLowerCase()
            .substring(0, 50);              // Limit length
    }
    
    /**
     * Show the import dialog for loading a theme from JSON
     */
    showImportDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.className = 'theme-import__input';
        
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const result = this.importThemeFromJSON(text);
                
                if (result.success) {
                    this.selectTheme(result.themeId);
                } else {
                    alert(`Failed to import theme: ${result.error}`);
                }
            } catch (err) {
                console.error('Error reading theme file:', err);
                alert('Failed to read theme file. Please ensure it is a valid JSON file.');
            }
        });
        
        input.click();
    }
    
    /**
     * Import a theme from JSON string
     * @param {string} jsonString - JSON string containing theme data
     * @returns {{success: boolean, themeId?: string, error?: string}} Import result
     */
    importThemeFromJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            
            // Validate schema version
            if (!data.schemaVersion) {
                return { success: false, error: 'Missing schema version. This may not be a valid theme file.' };
            }
            
            // Check for future incompatible versions
            const [major] = data.schemaVersion.split('.').map(Number);
            const [currentMajor] = ColorThemeManager.THEME_SCHEMA_VERSION.split('.').map(Number);
            if (major > currentMajor) {
                return { success: false, error: `Theme file version ${data.schemaVersion} is newer than supported version ${ColorThemeManager.THEME_SCHEMA_VERSION}. Please update the application.` };
            }
            
            // Validate theme data structure
            if (!data.theme) {
                return { success: false, error: 'Missing theme data in file.' };
            }
            
            const { theme } = data;
            
            // Validate name
            if (!theme.name || typeof theme.name !== 'string') {
                return { success: false, error: 'Theme must have a valid name.' };
            }
            
            // Validate slots
            if (!Array.isArray(theme.slots) || theme.slots.length !== 12) {
                return { success: false, error: 'Theme must have exactly 12 color slots.' };
            }
            
            // Validate each slot
            for (let i = 0; i < theme.slots.length; i++) {
                const slot = theme.slots[i];
                if (typeof slot.h !== 'number' || slot.h < 0 || slot.h > 360) {
                    return { success: false, error: `Slot ${i + 1}: hue must be a number between 0 and 360.` };
                }
                if (typeof slot.s !== 'number' || slot.s < 0 || slot.s > 100) {
                    return { success: false, error: `Slot ${i + 1}: saturation must be a number between 0 and 100.` };
                }
            }
            
            // Validate adjustments if present
            const adjustmentKeys = ['brightness', 'contrast', 'highlights', 'shadows', 'whites', 'blacks', 'saturation'];
            let adjustments = { ...DEFAULT_ADJUSTMENTS };
            
            if (theme.adjustments) {
                for (const key of adjustmentKeys) {
                    if (theme.adjustments[key] !== undefined) {
                        const value = theme.adjustments[key];
                        if (typeof value !== 'number' || value < -100 || value > 100) {
                            return { success: false, error: `Adjustment "${key}" must be a number between -100 and 100.` };
                        }
                        adjustments[key] = value;
                    }
                }
            }
            
            // Create the new theme
            const id = generateThemeId();
            const newTheme = createTheme(
                id,
                theme.name,
                theme.slots.map(slot => ({ h: slot.h, s: slot.s })),
                false
            );
            newTheme.adjustments = adjustments;
            newTheme.importedAt = Date.now();
            newTheme.importedFrom = data.exportedAt || null;
            
            // Add to custom themes
            this.customThemes.push(newTheme);
            this.saveCustomThemes();
            this.renderThemeList();
            
            return { success: true, themeId: id };
            
        } catch (err) {
            console.error('Error parsing theme JSON:', err);
            return { success: false, error: 'Invalid JSON format. Please check the file contents.' };
        }
    }
    
    // =========================================
    // Persistence
    // =========================================
    
    /**
     * Load custom themes from storage
     */
    loadCustomThemes() {
        try {
            const stored = localStorage.getItem('colorThemes');
            if (stored) {
                const parsed = JSON.parse(stored);
                this.customThemes = parsed.filter(t => validateTheme(t).valid);
            }
        } catch (e) {
            console.warn('Failed to load custom themes:', e);
            this.customThemes = [];
        }
    }
    
    /**
     * Save custom themes to storage
     */
    saveCustomThemes() {
        try {
            localStorage.setItem('colorThemes', JSON.stringify(this.customThemes));
        } catch (e) {
            console.warn('Failed to save custom themes:', e);
        }
    }
    
    // =========================================
    // Store Integration
    // =========================================

    /**
     * Apply theme to the store - mode-aware
     * In Master Mode: 
     *   - If editing theme master: Updates the master's lumaTheme directly (affects all slides)
     *   - If editing layout master: Assigns theme ID to layout's styleAssignments.colorTheme (layout-level override)
     * In Slide Mode: Assigns the theme ID to the slide's styleAssignments.colorTheme (per-slide override)
     * @param {Object} theme - The theme to apply
     */
    applyThemeToStore(theme) {
        if (!theme) return;
        
        const state = store.getState();
        const mode = state.editor.mode;
        const themeMasterId = 'theme-default';
        
        console.log('[ColorThemeManager.applyThemeToStore]', {
            mode,
            activeMasterId: state.editor.activeMasterId,
            activeSlideId: state.editor.activeSlideId,
            themeId: theme.id,
            themeName: theme.name
        });
        
        // Diagnostic logging
        ThemeDiag.logColorThemeManagerApply(mode, state.editor.activeSlideId, theme);
        
        // Generate the resolved colors from slots and adjustments
        const colors = generateThemeColors(theme.slots, theme.adjustments || DEFAULT_ADJUSTMENTS);
        
        // Get current color mode for CSS variable application
        const currentColorMode = state.slideMasterPresets?.[themeMasterId]?.colorModeId || COLOR_MODES.LIGHT;
        
        if (mode === 'master') {
            // Master Mode: Check what type of master we're editing
            const activeMasterId = state.editor.activeMasterId;
            const activeMaster = state.slideMasterPresets?.[activeMasterId];
            
            console.log('[ColorThemeManager.applyThemeToStore] Master mode:', {
                activeMasterId,
                masterType: activeMaster?.type,
                masterName: activeMaster?.name
            });
            
            if (!activeMaster) {
                console.warn('[ColorThemeManager] No active master found');
                return;
            }
            
            if (activeMaster.type === 'slideMasterPreset') {
                // Editing the Theme Master itself - apply the full lumaTheme
                // This sets the default theme for all slides that inherit from master
                console.log('[ColorThemeManager] Applying lumaTheme to theme master:', themeMasterId);
                store.dispatch('APPLY_LUMA_THEME', {
                    masterId: themeMasterId,
                    theme: {
                        id: theme.id,
                        name: theme.name,
                        slots: theme.slots,
                        adjustments: theme.adjustments || DEFAULT_ADJUSTMENTS,
                        colors: colors
                    }
                });
                
                // NOTE: CSS variables are NOT applied globally.
                // SlideView.update() applies per-slide CSS vars via StyleResolver.
                // Dispatch event to notify listeners that the master theme changed.
                document.dispatchEvent(new CustomEvent('style:theme-updated', {
                    detail: { masterId: themeMasterId, themeId: theme.id, affectedSlides: 'all' }
                }));
            } else if (activeMaster.type === 'layoutMaster') {
                // Editing a Layout Master - assign styleAssignments.colorTheme override
                // This only affects slides using this specific layout
                console.log('[ColorThemeManager] Applying styleAssignments.colorTheme to layout master:', activeMasterId);
                store.dispatch('UPDATE_MASTER_STYLE_ASSIGNMENTS', {
                    masterId: activeMasterId,
                    styleAssignments: {
                        colorTheme: theme.id
                    }
                });
                
                // NOTE: CSS variables are NOT applied globally.
                // Only slides using this layout should show the new theme.
                // Dispatch event to notify listeners that a layout theme changed.
                document.dispatchEvent(new CustomEvent('style:theme-assignment-changed', {
                    detail: { 
                        targetType: 'layout', 
                        targetId: activeMasterId, 
                        themeId: theme.id 
                    }
                }));
                
                // Also emit custom-theme-edited for real-time updates when editing
                // This handles the case where the theme ID doesn't change but colors do
                if (!isPresetTheme(theme.id)) {
                    document.dispatchEvent(new CustomEvent('style:custom-theme-edited', {
                        detail: { 
                            themeId: theme.id,
                            colors: colors
                        }
                    }));
                }
            }
        } else {
            // Slide Mode: Assign theme ID to the slide's styleAssignments
            // This creates a per-slide override, NOT affecting other slides
            const slideId = state.editor.activeSlideId;
            if (!slideId) return;
            
            console.log('[ColorThemeManager] Applying styleAssignments.colorTheme to slide:', slideId);
            
            // Only dispatch the style assignment - DO NOT apply global CSS vars
            // SlideView will handle applying the theme's CSS vars locally on the slide DOM
            store.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
                slideId,
                styleAssignments: {
                    colorTheme: theme.id
                }
            });
            
            // Also emit custom-theme-edited for real-time updates when editing
            // This handles the case where the theme ID doesn't change but colors do
            if (!isPresetTheme(theme.id)) {
                document.dispatchEvent(new CustomEvent('style:custom-theme-edited', {
                    detail: { 
                        themeId: theme.id,
                        colors: colors
                    }
                }));
            }
            
            // NOTE: We no longer apply CSS variables globally here in slide mode.
            // CSS variables are now applied per-slide in SlideView.update()
            // This prevents per-slide themes from polluting other slides.
        }
    }

    /**
     * Get the current theme from the store
     * @returns {Object|null} The current luma theme or null
     */
    getThemeFromStore() {
        const state = store.getState();
        const themeMaster = state.slideMasterPresets?.['master-default'];
        if (!themeMaster?.colorThemeId) return null;
        return state.colorThemePresets?.[themeMaster.colorThemeId] || null;
    }
    
    // =========================================
    // Cleanup
    // =========================================
    
    /**
     * Destroy the panel - override to clean up internal references
     */
    destroy() {
        this.closeColorPicker();
        this.adjustmentSliders = {};
        this.themeListEl = null;
        this.themeEditorEl = null;
        this.columnEditEl = null;
        
        // Call parent destroy
        super.destroy();
    }
}

export default ColorThemeManager;
