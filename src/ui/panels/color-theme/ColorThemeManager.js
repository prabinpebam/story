/**
 * ColorThemeManager.js
 * 
 * Main color theme manager panel using the luma-locked tonal system.
 * Two-column layout: Theme list (left) + Editor (right)
 * 
 * Architecture:
 * - 12 slots with fixed luma values (5%, 10%, 18%, 25%, 35%, 45%, 55%, 65%, 70%, 80%, 90%, 97%)
 * - Only H (hue) and S (saturation) are editable per slot
 * - Photo-style adjustments affect all slots: Brightness, Contrast, Highlights, Shadows, Whites, Blacks, Saturation
 */

import { DraggablePanel } from '../../components/DraggablePanel.js';
import { SliderControl } from '../../components/SliderControl.js';
import { IconButton } from '../../components/IconButton.js';
import { Icons } from '../../Icons.js';
import {
    LUMA_SLOTS,
    DEFAULT_ADJUSTMENTS,
    COLOR_HARMONIES,
    MIN_LUMA_DELTA,
    hslToHex,
    hexToHsl,
    generateThemeColors,
    generateInvertedThemeColors,
    generateHarmonyTheme,
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
    isColorDark
} from './ColorThemeUtils.js';
import { THEME_PRESETS, isPresetTheme } from './ThemePresets.js';

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
        
        this.managerOptions = {
            onThemeChange: options.onThemeChange || (() => {}),
            onThemeApply: options.onThemeApply || (() => {}),
            ...options
        };
        
        // State
        this.themes = [...THEME_PRESETS];
        this.customThemes = [];
        this.selectedThemeId = null;
        this.selectedSlotIndex = null;
        this.isInverted = false;
        this.adjustmentsExpanded = true;
        this.generateExpanded = true;
        this.selectedHarmony = COLOR_HARMONIES.COMPLEMENTARY;
        this.lockedSlots = new Set(); // Slots locked from Generate
        this.generateHues = true;      // Generate will randomize hues
        this.generateAdjustments = true; // Generate will randomize adjustments (default checked)
        
        // Load custom themes from storage
        this.loadCustomThemes();
        
        // DOM references
        this.themeListEl = null;
        this.themeEditorEl = null;
        this.slotEditorEl = null;
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
        
        const importBtn = new IconButton({
            icon: Icons.IMAGE,
            size: 'small',
            title: 'Extract from Image',
            onClick: () => this.showImagePicker()
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
        
        // Slot grid
        editorContent.appendChild(this.createSlotGrid(theme));
        
        // Slot editor (when a slot is selected)
        const slotEditor = document.createElement('div');
        slotEditor.className = 'ctm__slot-editor';
        slotEditor.style.display = 'none';
        this.slotEditorEl = slotEditor;
        editorContent.appendChild(slotEditor);
        
        // Generate section
        editorContent.appendChild(this.createGenerateSection(theme));
        
        // Adjustments section
        editorContent.appendChild(this.createAdjustments(theme));
        
        editor.appendChild(editorContent);
    }
    
    /**
     * Create editor header
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
        
        // Invert button
        const invertBtn = new IconButton({
            icon: Icons.FLIP_V,
            size: 'small',
            title: 'Invert (Light/Dark)',
            active: this.isInverted,
            onClick: () => this.toggleInvert()
        });
        actions.appendChild(invertBtn.element);
        
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
     * Create slot grid - organized by 3 tonal clusters
     */
    createSlotGrid(theme) {
        const section = document.createElement('div');
        section.className = 'ctm__section ctm__slots-section';
        
        const colors = this.isInverted 
            ? generateInvertedThemeColors(theme.slots, theme.adjustments || DEFAULT_ADJUSTMENTS)
            : generateThemeColors(theme.slots, theme.adjustments || DEFAULT_ADJUSTMENTS);
        
        // Calculate effective luma values for real-time display
        const effectiveLumaValues = calculateEffectiveLumaValues(theme.adjustments || DEFAULT_ADJUSTMENTS);
        
        // Define the 3 clusters
        const clusters = [
            { name: 'Shadows', slots: [0, 1, 2, 3] },
            { name: 'Midtones', slots: [4, 5, 6, 7] },
            { name: 'Highlights', slots: [8, 9, 10, 11] }
        ];
        
        clusters.forEach(cluster => {
            const row = document.createElement('div');
            row.className = 'ctm__cluster-row';
            
            // Cluster label
            const label = document.createElement('div');
            label.className = 'ctm__cluster-label';
            label.textContent = cluster.name;
            row.appendChild(label);
            
            // Swatches container
            const swatches = document.createElement('div');
            swatches.className = 'ctm__cluster-swatches';
            
            cluster.slots.forEach(i => {
                const slot = LUMA_SLOTS[i];
                const color = colors[i];
                const isLocked = this.lockedSlots.has(i);
                const effectiveLuma = Math.round(effectiveLumaValues[i]);
                
                const slotEl = document.createElement('button');
                slotEl.className = 'ctm__slot';
                slotEl.dataset.slotIndex = i;
                
                if (i === this.selectedSlotIndex) {
                    slotEl.classList.add('ctm__slot--selected');
                }
                if (isLocked) {
                    slotEl.classList.add('ctm__slot--locked');
                }
                
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
                
                // Lock indicator on swatch
                if (isLocked) {
                    const lockIcon = document.createElement('div');
                    lockIcon.className = 'ctm__slot-lock-icon';
                    lockIcon.innerHTML = Icons.LOCK;
                    lockIcon.style.color = isColorDark(color) ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)';
                    swatch.appendChild(lockIcon);
                }
                
                slotEl.appendChild(swatch);
                
                slotEl.addEventListener('click', (e) => {
                    if (e.shiftKey) {
                        this.toggleSlotLock(i);
                    } else {
                        this.selectSlot(i);
                    }
                });
                
                slotEl.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.toggleSlotLock(i);
                });
                
                swatches.appendChild(slotEl);
            });
            
            row.appendChild(swatches);
            section.appendChild(row);
        });
        
        // Hint text
        const hint = document.createElement('div');
        hint.className = 'ctm__hint';
        hint.textContent = 'Shift+click or right-click to lock slots';
        section.appendChild(hint);
        
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
                onChange: (value) => this.updateAdjustment(config.key, value)
            });
            
            this.adjustmentSliders[config.key] = slider;
            content.appendChild(slider.element);
        });
        
        // Reset button
        const resetBtn = document.createElement('button');
        resetBtn.className = 'ctm__adjustments-reset btn btn--text btn--sm';
        resetBtn.innerHTML = Icons.RESET + ' Reset';
        resetBtn.title = 'Reset All Adjustments';
        resetBtn.addEventListener('click', () => this.resetAdjustments());
        content.appendChild(resetBtn);
        
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
        const generateBtn = document.createElement('button');
        generateBtn.className = 'ctm__generate-button btn btn--accent';
        generateBtn.innerHTML = Icons.SPARKLE + ' Generate';
        generateBtn.addEventListener('click', () => this.generateRandomColors());
        controlsRow.appendChild(generateBtn);
        
        content.appendChild(controlsRow);
        
        // Note about locked slots
        const note = document.createElement('div');
        note.className = 'ctm__generate-note';
        const lockedCount = this.lockedSlots.size;
        if (lockedCount > 0) {
            note.textContent = `${lockedCount} slot${lockedCount > 1 ? 's' : ''} locked`;
        } else {
            note.textContent = 'Lock slots to preserve during generation';
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
    
    /**
     * Render slot editor for selected slot
     */
    renderSlotEditor() {
        const editor = this.slotEditorEl;
        if (!editor) return;
        
        const theme = this.getSelectedTheme();
        if (!theme || this.selectedSlotIndex === null) {
            editor.style.display = 'none';
            return;
        }
        
        editor.style.display = 'block';
        editor.innerHTML = '';
        
        const slot = theme.slots[this.selectedSlotIndex];
        const lumaSlot = LUMA_SLOTS[this.selectedSlotIndex];
        const color = hslToHex(slot.h, slot.s, lumaSlot.luma);
        
        // Header
        const header = document.createElement('div');
        header.className = 'ctm__slot-editor-header';
        
        const title = document.createElement('div');
        title.className = 'ctm__slot-editor-title';
        title.textContent = `Slot ${this.selectedSlotIndex + 1}`;
        header.appendChild(title);
        
        const preview = document.createElement('div');
        preview.className = 'ctm__slot-editor-preview';
        preview.style.backgroundColor = color;
        header.appendChild(preview);
        
        editor.appendChild(header);
        
        // Controls
        const controls = document.createElement('div');
        controls.className = 'ctm__slot-editor-controls';
        
        // Hue slider
        const hueSlider = new SliderControl({
            label: 'Hue',
            value: slot.h,
            min: 0,
            max: 360,
            step: 1,
            onChange: (value) => this.updateSlotHue(value)
        });
        controls.appendChild(hueSlider.element);
        
        // Saturation slider
        const satSlider = new SliderControl({
            label: 'Saturation',
            value: slot.s,
            min: 0,
            max: 100,
            step: 1,
            onChange: (value) => this.updateSlotSaturation(value)
        });
        controls.appendChild(satSlider.element);
        
        // Luma (locked, display only)
        const lumaRow = document.createElement('div');
        lumaRow.className = 'ctm__slot-editor-row';
        
        const lumaLabel = document.createElement('div');
        lumaLabel.className = 'ctm__slot-editor-label';
        lumaLabel.textContent = 'Lightness';
        lumaRow.appendChild(lumaLabel);
        
        const lumaLocked = document.createElement('div');
        lumaLocked.className = 'ctm__slot-editor-locked';
        lumaLocked.innerHTML = `🔒 ${lumaSlot.luma}% (locked)`;
        lumaRow.appendChild(lumaLocked);
        
        controls.appendChild(lumaRow);
        
        editor.appendChild(controls);
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
        this.selectedSlotIndex = null;
        this.isInverted = false;
        
        this.renderThemeList();
        this.renderThemeEditor();
        
        const theme = this.getSelectedTheme();
        if (theme) {
            this.managerOptions.onThemeChange(theme);
        }
    }
    
    /**
     * Select a slot
     */
    selectSlot(index) {
        const theme = this.getSelectedTheme();
        if (!theme || isPresetTheme(theme.id)) {
            // Can't edit presets, duplicate first
            this.duplicateTheme(theme.id);
            setTimeout(() => this.selectSlot(index), 100);
            return;
        }
        
        this.selectedSlotIndex = index;
        this.renderThemeEditor();
        this.renderSlotEditor();
    }
    
    /**
     * Update slot hue
     */
    updateSlotHue(hue) {
        const theme = this.getSelectedTheme();
        if (!theme || this.selectedSlotIndex === null) return;
        
        theme.slots[this.selectedSlotIndex].h = hue;
        theme.modifiedAt = Date.now();
        
        this.renderThemeEditor();
        this.renderThemeList(); // Update preview in left column in real-time
        this.managerOptions.onThemeChange(theme);
    }
    
    /**
     * Update slot saturation
     */
    updateSlotSaturation(saturation) {
        const theme = this.getSelectedTheme();
        if (!theme || this.selectedSlotIndex === null) return;
        
        theme.slots[this.selectedSlotIndex].s = saturation;
        theme.modifiedAt = Date.now();
        
        this.renderThemeEditor();
        this.renderThemeList(); // Update preview in left column in real-time
        this.managerOptions.onThemeChange(theme);
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
        
        if (!theme.adjustments) {
            theme.adjustments = { ...DEFAULT_ADJUSTMENTS };
        }
        
        theme.adjustments[key] = value;
        theme.modifiedAt = Date.now();
        
        this.renderThemeEditor();
        this.renderThemeList(); // Update preview in left column in real-time
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
     * Toggle invert mode
     */
    toggleInvert() {
        this.isInverted = !this.isInverted;
        this.renderThemeEditor();
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
     * Toggle slot lock
     */
    toggleSlotLock(index) {
        if (this.lockedSlots.has(index)) {
            this.lockedSlots.delete(index);
        } else {
            this.lockedSlots.add(index);
        }
        this.renderThemeEditor();
    }
    
    /**
     * Generate random colors using selected harmony
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
        
        // Check if all slots are locked (only matters for hues)
        if (this.generateHues && this.lockedSlots.size >= 12) {
            console.warn('All slots are locked');
            return;
        }
        
        // Generate new hues if checkbox is checked
        if (this.generateHues) {
            const newSlots = generateHarmonyTheme(
                this.selectedHarmony,
                Array.from(this.lockedSlots),
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
        
        applyThemeToCSSVariables(colors);
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
    // Cleanup
    // =========================================
    
    /**
     * Destroy the panel - override to clean up internal references
     */
    destroy() {
        this.adjustmentSliders = {};
        this.themeListEl = null;
        this.themeEditorEl = null;
        this.slotEditorEl = null;
        
        // Call parent destroy
        super.destroy();
    }
}

export default ColorThemeManager;
