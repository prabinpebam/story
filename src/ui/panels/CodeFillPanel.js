/**
 * CodeFillPanel.js
 * A dedicated draggable, resizable panel for managing code-based dynamic fills.
 * Follows patterns from TypographyStyleManager and ColorThemeManager.
 */

import { DraggablePanel } from '../components/DraggablePanel.js';
import { SegmentedControl } from '../components/SegmentedControl.js';
import { Dropdown } from '../components/Dropdown.js';
import { store } from '../../core/Store.js';
import { CodeRunner } from '../../core/effects/CodeRunner.js';
import { PresetManager } from '../../core/services/PresetManager.js';
import { AIService } from '../../core/ai/AIService.js';
import { CODE_FILL_PROMPT, CODE_FILL_UPDATE_PROMPT, PROMPT_REFINEMENT_PROMPT } from '../../core/ai/prompts/templates.js';
import { Icons } from '../Icons.js';
import { FillLayerBar } from './components/FillLayerBar.js';

// Singleton instance
let instance = null;

export class CodeFillPanel extends DraggablePanel {
    constructor() {
        super({
            id: 'code-fill-panel',
            title: 'Code Fill',
            defaultWidth: 380,
            defaultHeight: 600,
            minWidth: 340,
            minHeight: 500,
            maxWidth: 600,
            maxHeight: 900
        });
        
        this.activeTab = 'presets';
        this.selectedCodeFillIndex = -1;
        this.currentFills = [];
        this.currentElementId = null;
        this.isSlideBackground = false;
        
        // Code editing
        this.runner = null;
        this.codeEditor = null;
        this.updateDebounceTimer = null;
        
        // AI history
        this.aiHistory = [];
        
        // Preset search/filter
        this.presetSearchQuery = '';
        this.presetCategory = 'all';
        
        // Bind store listener
        this.boundHandleStoreChange = this.handleStoreChange.bind(this);
        
        this.buildUI();
    }

    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!instance) {
            instance = new CodeFillPanel();
        }
        return instance;
    }

    /**
     * Open the panel (singleton pattern)
     */
    static open() {
        const panel = CodeFillPanel.getInstance();
        panel.open();
        return panel;
    }

    /**
     * Toggle the panel
     */
    static toggle() {
        const panel = CodeFillPanel.getInstance();
        panel.toggle();
        return panel;
    }

    buildUI() {
        // Add panel-specific class
        this.element.classList.add('code-fill-panel');
        
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
        
        // Tab container
        const tabContainer = document.createElement('div');
        tabContainer.className = 'cfp-tabs';
        tabContainer.appendChild(this.tabControl.element);
        
        // Insert tabs after header
        this.element.insertBefore(tabContainer, this.contentElement);
        
        // Fill Layer Bar container
        this.fillBarContainer = document.createElement('div');
        this.fillBarContainer.className = 'cfp-fill-bar-container';
        this.element.insertBefore(this.fillBarContainer, tabContainer);
        
        // Context indicator (for slide background mode)
        this.contextIndicator = document.createElement('div');
        this.contextIndicator.className = 'cfp-context-indicator';
        this.contextIndicator.style.display = 'none';
        this.element.insertBefore(this.contextIndicator, this.fillBarContainer);
        
        // Create tab content containers
        this.presetsContent = this.createPresetsTab();
        this.customContent = this.createCustomTab();
        this.aiContent = this.createAITab();
        
        this.contentElement.appendChild(this.presetsContent);
        this.contentElement.appendChild(this.customContent);
        this.contentElement.appendChild(this.aiContent);
        
        // Create empty state
        this.emptyState = this.createEmptyState();
        this.contentElement.appendChild(this.emptyState);
        
        // Create footer
        this.footerElement = this.createFooter();
        this.element.appendChild(this.footerElement);
        
        // Show initial tab
        this.switchTab('presets');
    }

    // ========================================
    // FILL LAYER BAR
    // ========================================
    
    updateFillLayerBar() {
        this.fillBarContainer.innerHTML = '';
        
        if (!this.currentElementId && !this.isSlideBackground) {
            this.fillBarContainer.style.display = 'none';
            return;
        }
        
        this.fillBarContainer.style.display = 'block';
        
        this.fillLayerBar = new FillLayerBar({
            fills: this.currentFills,
            selectedIndex: this.selectedCodeFillIndex,
            onSelect: (index) => this.handleFillSelect(index),
            onAdd: () => this.handleAddCodeFill(),
            onDelete: (index) => this.handleDeleteCodeFill(index),
            onReorder: (fromIndex, toIndex) => this.handleReorderFill(fromIndex, toIndex),
            onDuplicate: (index) => this.handleDuplicateFill(index)
        });
        
        this.fillBarContainer.appendChild(this.fillLayerBar.element);
    }

    handleFillSelect(index) {
        const fill = this.currentFills[index];
        if (fill && fill.type === 'code') {
            this.selectedCodeFillIndex = index;
            this.updateFillLayerBar();
            this.updateCustomTabContent();
            this.updateAITabContent();
        }
    }

    handleAddCodeFill() {
        if (!this.currentElementId && !this.isSlideBackground) return;
        
        const newFill = {
            type: 'code',
            code: CodeRunner.DEFAULT_CODE,
            opacity: 100,
            visible: true
        };
        
        // Add to fills array
        const newFills = [...this.currentFills, newFill];
        this.updateElementFills(newFills);
        
        // Select the new fill
        this.selectedCodeFillIndex = newFills.length - 1;
        this.currentFills = newFills;
        this.updateFillLayerBar();
        this.updateCustomTabContent();
        
        // Switch to Custom tab
        this.switchTab('custom');
    }

    handleDeleteCodeFill(index) {
        if (!this.currentElementId && !this.isSlideBackground) return;
        
        const newFills = this.currentFills.filter((_, i) => i !== index);
        this.updateElementFills(newFills);
        
        // Update selection
        if (this.selectedCodeFillIndex >= newFills.length) {
            this.selectedCodeFillIndex = this.findFirstCodeFillIndex(newFills);
        } else if (this.selectedCodeFillIndex === index) {
            this.selectedCodeFillIndex = this.findFirstCodeFillIndex(newFills);
        }
        
        this.currentFills = newFills;
        this.updateFillLayerBar();
        this.updateCustomTabContent();
        this.updateAITabContent();
    }

    handleReorderFill(fromIndex, toIndex) {
        if (!this.currentElementId && !this.isSlideBackground) return;
        
        const newFills = [...this.currentFills];
        const [moved] = newFills.splice(fromIndex, 1);
        newFills.splice(toIndex, 0, moved);
        
        this.updateElementFills(newFills);
        
        // Update selection index if needed
        if (this.selectedCodeFillIndex === fromIndex) {
            this.selectedCodeFillIndex = toIndex;
        } else if (fromIndex < this.selectedCodeFillIndex && toIndex >= this.selectedCodeFillIndex) {
            this.selectedCodeFillIndex--;
        } else if (fromIndex > this.selectedCodeFillIndex && toIndex <= this.selectedCodeFillIndex) {
            this.selectedCodeFillIndex++;
        }
        
        this.currentFills = newFills;
        this.updateFillLayerBar();
    }

    handleDuplicateFill(index) {
        if (!this.currentElementId && !this.isSlideBackground) return;
        
        const fillToDuplicate = this.currentFills[index];
        if (!fillToDuplicate || fillToDuplicate.type !== 'code') return;
        
        const newFill = { ...fillToDuplicate };
        const newFills = [...this.currentFills];
        newFills.splice(index + 1, 0, newFill);
        
        this.updateElementFills(newFills);
        
        this.selectedCodeFillIndex = index + 1;
        this.currentFills = newFills;
        this.updateFillLayerBar();
        this.updateCustomTabContent();
    }

    findFirstCodeFillIndex(fills) {
        return fills.findIndex(f => f.type === 'code');
    }

    updateElementFills(fills) {
        store.snapshot('Update Code Fill');
        
        if (this.isSlideBackground) {
            const state = store.getState();
            const slideId = state.editor.activeSlideId;
            store.dispatch('UPDATE_SLIDE', {
                id: slideId,
                background: { ...state.slides[slideId]?.background, fills }
            });
        } else if (this.currentElementId) {
            store.dispatch('UPDATE_ELEMENT', {
                id: this.currentElementId,
                style: { fills }
            });
        }
    }

    // ========================================
    // PRESETS TAB
    // ========================================
    
    createPresetsTab() {
        const container = document.createElement('div');
        container.className = 'cfp-presets-tab cfp-tab-content';
        
        // Search bar
        const searchContainer = document.createElement('div');
        searchContainer.className = 'cfp-search';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search presets...';
        searchInput.className = 'cfp-search-input';
        searchInput.addEventListener('input', (e) => {
            this.presetSearchQuery = e.target.value;
            this.renderPresetGrid();
        });
        
        searchContainer.appendChild(searchInput);
        container.appendChild(searchContainer);
        
        // Category filter
        const filterContainer = document.createElement('div');
        filterContainer.className = 'cfp-filter';
        
        const categories = [
            { value: 'all', label: 'All Categories' },
            { value: 'gradients', label: 'Gradients' },
            { value: 'particles', label: 'Particles' },
            { value: 'geometric', label: 'Geometric' },
            { value: 'organic', label: 'Organic' },
            { value: 'interactive', label: 'Interactive' }
        ];
        
        this.categoryDropdown = new Dropdown({
            options: categories,
            value: 'all',
            onChange: (category) => {
                this.presetCategory = category;
                this.renderPresetGrid();
            }
        });
        
        filterContainer.appendChild(this.categoryDropdown.element);
        container.appendChild(filterContainer);
        
        // Preset grid
        this.presetGrid = document.createElement('div');
        this.presetGrid.className = 'cfp-preset-grid';
        container.appendChild(this.presetGrid);
        
        return container;
    }

    renderPresetGrid() {
        this.presetGrid.innerHTML = '';
        this.destroyPresetCards();
        
        const builtIn = PresetManager.getBuiltInPresets();
        const userPresets = PresetManager.getUserPresets();
        
        // Filter presets
        let filteredBuiltIn = builtIn;
        let filteredUser = userPresets;
        
        if (this.presetCategory !== 'all') {
            filteredBuiltIn = builtIn.filter(p => 
                p.category?.toLowerCase() === this.presetCategory.toLowerCase()
            );
        }
        
        if (this.presetSearchQuery) {
            const query = this.presetSearchQuery.toLowerCase();
            filteredBuiltIn = filteredBuiltIn.filter(p => 
                p.name.toLowerCase().includes(query) ||
                p.description?.toLowerCase().includes(query)
            );
            filteredUser = filteredUser.filter(p => 
                p.name.toLowerCase().includes(query)
            );
        }
        
        // Built-in section
        if (filteredBuiltIn.length > 0) {
            const section = this.createPresetSection('Built-in', filteredBuiltIn, false);
            this.presetGrid.appendChild(section);
        }
        
        // User presets section
        const userSection = this.createPresetSection('My Presets', filteredUser, true);
        this.presetGrid.appendChild(userSection);
        
        // Empty state
        if (filteredBuiltIn.length === 0 && filteredUser.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'cfp-empty-message';
            emptyMsg.textContent = 'No presets found';
            this.presetGrid.appendChild(emptyMsg);
        }
    }

    createPresetSection(title, presets, isUserSection) {
        const section = document.createElement('div');
        section.className = 'cfp-preset-section';
        
        // Header
        const header = document.createElement('div');
        header.className = 'cfp-preset-section-header';
        header.textContent = title;
        section.appendChild(header);
        
        // Grid
        const grid = document.createElement('div');
        grid.className = 'cfp-preset-cards-grid';
        
        if (presets.length === 0 && isUserSection) {
            const emptyState = document.createElement('div');
            emptyState.className = 'cfp-user-empty';
            emptyState.innerHTML = `
                <div class="cfp-user-empty-text">No saved presets yet</div>
                <div class="cfp-user-empty-hint">Create one from the Custom tab</div>
            `;
            grid.appendChild(emptyState);
        } else {
            presets.forEach(preset => {
                const card = this.createPresetCard(preset, isUserSection);
                grid.appendChild(card);
            });
        }
        
        section.appendChild(grid);
        return section;
    }

    createPresetCard(preset, isUserPreset) {
        const card = document.createElement('div');
        card.className = 'cfp-preset-card';
        
        // Preview container
        const previewContainer = document.createElement('div');
        previewContainer.className = 'cfp-preset-preview';
        
        // Canvas for live preview
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 120;
        previewContainer.appendChild(canvas);
        
        // Initialize CodeRunner for preview
        const runner = new CodeRunner(canvas);
        runner.setCode(preset.code);
        this.startThrottledPreview(runner);
        
        // Store for cleanup
        if (!this.presetRunners) this.presetRunners = [];
        this.presetRunners.push(runner);
        
        card.appendChild(previewContainer);
        
        // Info row
        const infoRow = document.createElement('div');
        infoRow.className = 'cfp-preset-info';
        
        const name = document.createElement('span');
        name.className = 'cfp-preset-name';
        name.textContent = preset.name;
        infoRow.appendChild(name);
        
        // Options button for user presets
        if (isUserPreset) {
            const optionsBtn = document.createElement('button');
            optionsBtn.className = 'cfp-preset-options';
            optionsBtn.innerHTML = '⋮';
            optionsBtn.onclick = (e) => {
                e.stopPropagation();
                this.showPresetOptionsMenu(e, preset);
            };
            infoRow.appendChild(optionsBtn);
        }
        
        card.appendChild(infoRow);
        
        // Click handler
        card.addEventListener('click', () => {
            this.applyPreset(preset);
        });
        
        return card;
    }

    startThrottledPreview(runner) {
        const targetFPS = 15;
        const frameInterval = 1000 / targetFPS;
        let lastFrameTime = 0;
        
        const loop = () => {
            if (!runner || !runner.isPlaying) return;
            
            const now = performance.now();
            const elapsed = now - lastFrameTime;
            
            if (elapsed >= frameInterval) {
                lastFrameTime = now - (elapsed % frameInterval);
                
                const time = (now - runner.startTime) / 1000;
                if (runner.drawFunction) {
                    runner.ctx.setTransform(1, 0, 0, 1, 0, 0);
                    try {
                        runner.drawFunction(time);
                    } catch (e) {
                        // Ignore errors in preview
                    }
                }
            }
            
            runner.previewFrame = requestAnimationFrame(loop);
        };
        
        runner.isPlaying = true;
        runner.startTime = performance.now();
        runner.run();
        
        if (runner.animationFrame) {
            cancelAnimationFrame(runner.animationFrame);
        }
        loop();
    }

    applyPreset(preset) {
        // Ensure we have a code fill selected
        if (this.selectedCodeFillIndex < 0) {
            // Auto-create a code fill if none exists
            this.handleAddCodeFill();
        }
        
        // Update the selected code fill with preset code
        const newFills = [...this.currentFills];
        if (this.selectedCodeFillIndex >= 0 && newFills[this.selectedCodeFillIndex]) {
            newFills[this.selectedCodeFillIndex] = {
                ...newFills[this.selectedCodeFillIndex],
                code: preset.code
            };
            
            this.updateElementFills(newFills);
            this.currentFills = newFills;
            
            // Switch to Custom tab
            this.switchTab('custom');
            this.updateCustomTabContent();
        }
    }

    showPresetOptionsMenu(e, preset) {
        // Create context menu
        const menu = document.createElement('div');
        menu.className = 'cfp-context-menu';
        
        const items = [
            { label: 'Rename', action: () => this.renamePreset(preset) },
            { label: 'Duplicate', action: () => this.duplicatePreset(preset) },
            { type: 'divider' },
            { label: 'Delete', action: () => this.deletePreset(preset), danger: true }
        ];
        
        items.forEach(item => {
            if (item.type === 'divider') {
                const divider = document.createElement('div');
                divider.className = 'cfp-context-divider';
                menu.appendChild(divider);
            } else {
                const menuItem = document.createElement('div');
                menuItem.className = 'cfp-context-item' + (item.danger ? ' danger' : '');
                menuItem.textContent = item.label;
                menuItem.onclick = () => {
                    menu.remove();
                    item.action();
                };
                menu.appendChild(menuItem);
            }
        });
        
        // Position menu
        menu.style.position = 'fixed';
        menu.style.left = `${e.clientX}px`;
        menu.style.top = `${e.clientY}px`;
        menu.style.zIndex = '10001';
        
        document.body.appendChild(menu);
        
        // Close on click outside
        const closeHandler = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeHandler);
            }
        };
        setTimeout(() => document.addEventListener('click', closeHandler), 0);
    }

    renamePreset(preset) {
        const newName = prompt('Enter new name:', preset.name);
        if (!newName || newName === preset.name) return;
        
        if (PresetManager.isNameTaken(newName, preset.id)) {
            alert('A preset with this name already exists.');
            return;
        }
        
        PresetManager.updateUserPreset(preset.id, { name: newName });
        this.renderPresetGrid();
    }

    duplicatePreset(preset) {
        PresetManager.duplicatePreset(preset.id);
        this.renderPresetGrid();
    }

    deletePreset(preset) {
        if (!confirm(`Delete "${preset.name}"?`)) return;
        
        PresetManager.deleteUserPreset(preset.id);
        this.renderPresetGrid();
    }

    destroyPresetCards() {
        if (this.presetRunners) {
            this.presetRunners.forEach(runner => {
                if (runner.previewFrame) {
                    cancelAnimationFrame(runner.previewFrame);
                }
                runner.stop();
            });
            this.presetRunners = [];
        }
    }

    // ========================================
    // CUSTOM TAB
    // ========================================
    
    createCustomTab() {
        const container = document.createElement('div');
        container.className = 'cfp-custom-tab cfp-tab-content';
        
        // Canvas preview area
        const previewSection = document.createElement('div');
        previewSection.className = 'cfp-preview-section';
        
        this.previewCanvas = document.createElement('canvas');
        this.previewCanvas.className = 'cfp-preview-canvas';
        this.previewCanvas.width = 320;
        this.previewCanvas.height = 180;
        previewSection.appendChild(this.previewCanvas);
        
        container.appendChild(previewSection);
        
        // Playback controls
        const playbackControls = document.createElement('div');
        playbackControls.className = 'cfp-playback-controls';
        
        this.playPauseBtn = document.createElement('button');
        this.playPauseBtn.className = 'cfp-control-btn';
        this.playPauseBtn.innerHTML = Icons.PLAY || '▶';
        this.playPauseBtn.title = 'Play/Pause';
        this.playPauseBtn.onclick = () => this.togglePlayback();
        
        this.resetBtn = document.createElement('button');
        this.resetBtn.className = 'cfp-control-btn';
        this.resetBtn.innerHTML = Icons.RESET || '↻';
        this.resetBtn.title = 'Reset';
        this.resetBtn.onclick = () => this.resetPlayback();
        
        this.errorIndicator = document.createElement('div');
        this.errorIndicator.className = 'cfp-error-indicator success';
        this.errorIndicator.innerHTML = '✓ No errors';
        
        playbackControls.appendChild(this.playPauseBtn);
        playbackControls.appendChild(this.resetBtn);
        playbackControls.appendChild(this.errorIndicator);
        
        container.appendChild(playbackControls);
        
        // Code editor
        const editorSection = document.createElement('div');
        editorSection.className = 'cfp-editor-section';
        
        this.codeEditor = document.createElement('textarea');
        this.codeEditor.className = 'cfp-code-editor';
        this.codeEditor.spellcheck = false;
        this.codeEditor.placeholder = 'Enter your canvas code here...';
        this.codeEditor.addEventListener('input', (e) => this.handleCodeChange(e.target.value));
        this.codeEditor.addEventListener('keydown', (e) => this.handleEditorKeydown(e));
        
        editorSection.appendChild(this.codeEditor);
        container.appendChild(editorSection);
        
        return container;
    }

    updateCustomTabContent() {
        if (this.selectedCodeFillIndex < 0 || !this.currentFills[this.selectedCodeFillIndex]) {
            // No code fill selected
            this.codeEditor.value = '';
            if (this.runner) {
                this.runner.stop();
            }
            return;
        }
        
        const fill = this.currentFills[this.selectedCodeFillIndex];
        const code = fill.code || CodeRunner.DEFAULT_CODE;
        
        this.codeEditor.value = code;
        
        // Initialize or update runner
        if (!this.runner) {
            this.runner = new CodeRunner(this.previewCanvas);
        }
        
        this.runner.setCode(code);
        this.runner.play();
        
        this.updatePlayPauseButton();
        this.updateErrorIndicator();
    }

    handleCodeChange(newCode) {
        // Clear existing debounce
        if (this.updateDebounceTimer) {
            clearTimeout(this.updateDebounceTimer);
        }
        
        // Update preview immediately
        if (this.runner) {
            this.runner.setCode(newCode);
            this.updateErrorIndicator();
        }
        
        // Debounce store update
        this.updateDebounceTimer = setTimeout(() => {
            if (this.selectedCodeFillIndex >= 0) {
                const newFills = [...this.currentFills];
                newFills[this.selectedCodeFillIndex] = {
                    ...newFills[this.selectedCodeFillIndex],
                    code: newCode
                };
                this.updateElementFills(newFills);
                this.currentFills = newFills;
            }
        }, 300);
    }

    handleEditorKeydown(e) {
        // Tab key inserts spaces instead of changing focus
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = this.codeEditor.selectionStart;
            const end = this.codeEditor.selectionEnd;
            const spaces = '  ';
            
            this.codeEditor.value = 
                this.codeEditor.value.substring(0, start) + 
                spaces + 
                this.codeEditor.value.substring(end);
            
            this.codeEditor.selectionStart = this.codeEditor.selectionEnd = start + spaces.length;
            this.handleCodeChange(this.codeEditor.value);
        }
    }

    togglePlayback() {
        if (!this.runner) return;
        
        if (this.runner.isPlaying) {
            this.runner.pause();
        } else {
            this.runner.play();
        }
        
        this.updatePlayPauseButton();
    }

    resetPlayback() {
        if (!this.runner) return;
        
        this.runner.reset();
        this.runner.play();
        this.updatePlayPauseButton();
    }

    updatePlayPauseButton() {
        if (!this.runner) return;
        
        if (this.runner.isPlaying) {
            this.playPauseBtn.innerHTML = Icons.PAUSE || '⏸';
            this.playPauseBtn.title = 'Pause';
        } else {
            this.playPauseBtn.innerHTML = Icons.PLAY || '▶';
            this.playPauseBtn.title = 'Play';
        }
    }

    updateErrorIndicator() {
        if (!this.runner) return;
        
        if (this.runner.hasError) {
            this.errorIndicator.className = 'cfp-error-indicator error';
            this.errorIndicator.innerHTML = `⚠ ${this.runner.errorMessage || 'Error'}`;
            this.errorIndicator.title = this.runner.errorMessage || 'Code execution error';
        } else {
            this.errorIndicator.className = 'cfp-error-indicator success';
            this.errorIndicator.innerHTML = '✓ No errors';
            this.errorIndicator.title = 'Code is valid';
        }
    }

    // ========================================
    // AI TAB
    // ========================================
    
    createAITab() {
        const container = document.createElement('div');
        container.className = 'cfp-ai-tab cfp-tab-content';
        
        // Canvas preview
        const previewSection = document.createElement('div');
        previewSection.className = 'cfp-preview-section';
        
        this.aiPreviewCanvas = document.createElement('canvas');
        this.aiPreviewCanvas.className = 'cfp-preview-canvas';
        this.aiPreviewCanvas.width = 320;
        this.aiPreviewCanvas.height = 180;
        previewSection.appendChild(this.aiPreviewCanvas);
        
        container.appendChild(previewSection);
        
        // Prompt section
        const promptSection = document.createElement('div');
        promptSection.className = 'cfp-prompt-section';
        
        const promptLabel = document.createElement('label');
        promptLabel.className = 'cfp-label';
        promptLabel.textContent = 'Describe your animation:';
        promptSection.appendChild(promptLabel);
        
        this.aiPromptInput = document.createElement('textarea');
        this.aiPromptInput.className = 'cfp-prompt-input';
        this.aiPromptInput.placeholder = 'Create a subtle flowing gradient with gentle movement...';
        promptSection.appendChild(this.aiPromptInput);
        
        // Refine option
        const refineContainer = document.createElement('div');
        refineContainer.className = 'cfp-refine-container';
        
        this.refineCheckbox = document.createElement('input');
        this.refineCheckbox.type = 'checkbox';
        this.refineCheckbox.id = 'cfp-refine-checkbox';
        this.refineCheckbox.checked = true;
        
        const refineLabel = document.createElement('label');
        refineLabel.htmlFor = 'cfp-refine-checkbox';
        refineLabel.textContent = 'Refine prompt before generating';
        
        refineContainer.appendChild(this.refineCheckbox);
        refineContainer.appendChild(refineLabel);
        promptSection.appendChild(refineContainer);
        
        // Action buttons
        const buttonRow = document.createElement('div');
        buttonRow.className = 'cfp-ai-buttons';
        
        this.updateBtn = document.createElement('button');
        this.updateBtn.className = 'cfp-btn cfp-btn-secondary';
        this.updateBtn.textContent = 'Update';
        this.updateBtn.onclick = () => this.handleAIGenerate('update');
        
        this.generateBtn = document.createElement('button');
        this.generateBtn.className = 'cfp-btn cfp-btn-primary';
        this.generateBtn.textContent = 'Generate';
        this.generateBtn.onclick = () => this.handleAIGenerate('new');
        
        buttonRow.appendChild(this.updateBtn);
        buttonRow.appendChild(this.generateBtn);
        promptSection.appendChild(buttonRow);
        
        container.appendChild(promptSection);
        
        // History section
        const historySection = document.createElement('div');
        historySection.className = 'cfp-history-section';
        
        const historyLabel = document.createElement('div');
        historyLabel.className = 'cfp-history-label';
        historyLabel.textContent = 'Generation History:';
        historySection.appendChild(historyLabel);
        
        this.historyContainer = document.createElement('div');
        this.historyContainer.className = 'cfp-history-grid';
        historySection.appendChild(this.historyContainer);
        
        container.appendChild(historySection);
        
        return container;
    }

    updateAITabContent() {
        // Update AI preview with current code
        if (this.selectedCodeFillIndex >= 0 && this.currentFills[this.selectedCodeFillIndex]) {
            const fill = this.currentFills[this.selectedCodeFillIndex];
            const code = fill.code || CodeRunner.DEFAULT_CODE;
            
            if (!this.aiRunner) {
                this.aiRunner = new CodeRunner(this.aiPreviewCanvas);
            }
            
            this.aiRunner.setCode(code);
            this.aiRunner.play();
        }
    }

    async handleAIGenerate(mode) {
        const prompt = this.aiPromptInput.value.trim();
        if (!prompt) {
            alert('Please enter a description');
            return;
        }
        
        // Ensure we have a code fill
        if (this.selectedCodeFillIndex < 0) {
            this.handleAddCodeFill();
        }
        
        const btn = mode === 'update' ? this.updateBtn : this.generateBtn;
        const originalText = btn.textContent;
        btn.textContent = 'Generating...';
        btn.disabled = true;
        this.updateBtn.disabled = true;
        this.generateBtn.disabled = true;
        
        try {
            const ai = new AIService();
            let finalPrompt = prompt;
            
            // Refine prompt if requested
            if (this.refineCheckbox.checked) {
                btn.textContent = 'Refining...';
                const refinementSystemPrompt = PROMPT_REFINEMENT_PROMPT.replace('{userPrompt}', prompt);
                
                const refined = await ai.generate("Refine the prompt.", { 
                    systemPrompt: refinementSystemPrompt 
                });
                
                finalPrompt = refined.trim();
                this.aiPromptInput.value = finalPrompt;
                btn.textContent = 'Generating...';
            }
            
            let systemPrompt = '';
            let userPrompt = '';
            
            const currentCode = this.currentFills[this.selectedCodeFillIndex]?.code || '';
            
            if (mode === 'new') {
                systemPrompt = CODE_FILL_PROMPT.replace('{description}', finalPrompt);
                userPrompt = `Generate a canvas animation code for: ${finalPrompt}`;
            } else {
                systemPrompt = CODE_FILL_UPDATE_PROMPT
                    .replace('{existingCode}', currentCode)
                    .replace('{request}', finalPrompt);
                userPrompt = `Update the code to: ${finalPrompt}`;
            }
            
            const generatedCode = await ai.generate(userPrompt, { systemPrompt });
            
            // Clean up code
            let cleanCode = generatedCode.replace(/```javascript/g, '').replace(/```/g, '').trim();
            
            // Add to history
            this.addToHistory(cleanCode);
            
            // Apply code
            const newFills = [...this.currentFills];
            newFills[this.selectedCodeFillIndex] = {
                ...newFills[this.selectedCodeFillIndex],
                code: cleanCode
            };
            
            this.updateElementFills(newFills);
            this.currentFills = newFills;
            
            // Update AI preview
            if (this.aiRunner) {
                this.aiRunner.setCode(cleanCode);
            }
            
        } catch (error) {
            console.error('AI Generation failed:', error);
            alert('Failed to generate code. Please check your AI settings.');
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
            this.updateBtn.disabled = false;
            this.generateBtn.disabled = false;
        }
    }

    addToHistory(code) {
        // Add to beginning, limit to 5 entries
        this.aiHistory.unshift(code);
        if (this.aiHistory.length > 5) {
            this.aiHistory.pop();
        }
        
        this.renderHistory();
    }

    renderHistory() {
        this.historyContainer.innerHTML = '';
        
        // Clean up old runners
        if (this.historyRunners) {
            this.historyRunners.forEach(r => r.stop());
        }
        this.historyRunners = [];
        
        this.aiHistory.forEach((code, index) => {
            const thumb = document.createElement('div');
            thumb.className = 'cfp-history-thumb';
            
            const canvas = document.createElement('canvas');
            canvas.width = 80;
            canvas.height = 45;
            thumb.appendChild(canvas);
            
            const label = document.createElement('span');
            label.textContent = `Ver ${this.aiHistory.length - index}`;
            thumb.appendChild(label);
            
            // Create runner
            const runner = new CodeRunner(canvas);
            runner.setCode(code);
            this.startThrottledPreview(runner);
            this.historyRunners.push(runner);
            
            // Click to restore
            thumb.onclick = () => {
                this.restoreFromHistory(code);
            };
            
            this.historyContainer.appendChild(thumb);
        });
    }

    restoreFromHistory(code) {
        if (this.selectedCodeFillIndex < 0) return;
        
        const newFills = [...this.currentFills];
        newFills[this.selectedCodeFillIndex] = {
            ...newFills[this.selectedCodeFillIndex],
            code
        };
        
        this.updateElementFills(newFills);
        this.currentFills = newFills;
        
        if (this.aiRunner) {
            this.aiRunner.setCode(code);
        }
    }

    // ========================================
    // EMPTY STATE
    // ========================================
    
    createEmptyState() {
        const container = document.createElement('div');
        container.className = 'cfp-empty-state';
        
        this.emptyStateIcon = document.createElement('div');
        this.emptyStateIcon.className = 'cfp-empty-icon';
        container.appendChild(this.emptyStateIcon);
        
        this.emptyStateTitle = document.createElement('div');
        this.emptyStateTitle.className = 'cfp-empty-title';
        container.appendChild(this.emptyStateTitle);
        
        this.emptyStateSubtitle = document.createElement('div');
        this.emptyStateSubtitle.className = 'cfp-empty-subtitle';
        container.appendChild(this.emptyStateSubtitle);
        
        this.emptyStateCTA = document.createElement('button');
        this.emptyStateCTA.className = 'cfp-btn cfp-btn-primary';
        this.emptyStateCTA.style.display = 'none';
        container.appendChild(this.emptyStateCTA);
        
        return container;
    }

    showEmptyState(type) {
        this.emptyState.style.display = 'flex';
        this.presetsContent.style.display = 'none';
        this.customContent.style.display = 'none';
        this.aiContent.style.display = 'none';
        
        if (type === 'no-selection') {
            this.emptyStateIcon.innerHTML = Icons.CURSOR || '↖';
            this.emptyStateTitle.textContent = 'Select an object';
            this.emptyStateSubtitle.textContent = 'Select an object to edit its code fills';
            this.emptyStateCTA.style.display = 'none';
        } else if (type === 'no-code-fills') {
            this.emptyStateIcon.innerHTML = Icons.CODE || '</>';
            this.emptyStateTitle.textContent = 'No code fills yet';
            this.emptyStateSubtitle.textContent = 'Add a code fill to get started';
            this.emptyStateCTA.textContent = '+ Add Code Fill';
            this.emptyStateCTA.style.display = 'block';
            this.emptyStateCTA.onclick = () => this.handleAddCodeFill();
        }
    }

    hideEmptyState() {
        this.emptyState.style.display = 'none';
    }

    // ========================================
    // FOOTER
    // ========================================
    
    createFooter() {
        const footer = document.createElement('div');
        footer.className = 'cfp-footer';
        
        const savePresetBtn = document.createElement('button');
        savePresetBtn.className = 'cfp-btn cfp-btn-secondary';
        savePresetBtn.textContent = 'Save as Preset';
        savePresetBtn.onclick = () => this.showSavePresetDialog();
        
        footer.appendChild(savePresetBtn);
        
        return footer;
    }

    showSavePresetDialog() {
        if (this.selectedCodeFillIndex < 0 || !this.currentFills[this.selectedCodeFillIndex]) {
            alert('Please select a code fill first');
            return;
        }
        
        const fill = this.currentFills[this.selectedCodeFillIndex];
        const name = prompt('Enter a name for your preset:');
        
        if (!name) return;
        
        if (PresetManager.isNameTaken(name)) {
            alert('A preset with this name already exists.');
            return;
        }
        
        try {
            PresetManager.saveUserPreset({
                name,
                description: '',
                code: fill.code
            });
            
            if (this.activeTab === 'presets') {
                this.renderPresetGrid();
            }
            
            alert('Preset saved successfully!');
        } catch (e) {
            alert('Failed to save preset: ' + e.message);
        }
    }

    // ========================================
    // TAB SWITCHING
    // ========================================
    
    switchTab(tab) {
        this.activeTab = tab;
        
        // Update tab control
        const buttons = this.tabControl.element.querySelectorAll('div');
        buttons.forEach((btn, i) => {
            const tabValue = this.tabControl.options[i]?.value;
            if (tabValue === tab) {
                btn.style.backgroundColor = 'var(--color-accent)';
                btn.style.color = 'var(--color-text-on-accent)';
            } else {
                btn.style.backgroundColor = 'transparent';
                btn.style.color = 'var(--color-text-primary)';
            }
        });
        
        // Check if we should show empty state
        if (!this.currentElementId && !this.isSlideBackground) {
            this.showEmptyState('no-selection');
            return;
        }
        
        const hasCodeFills = this.currentFills.some(f => f.type === 'code');
        if (!hasCodeFills && (tab === 'custom' || tab === 'ai')) {
            this.showEmptyState('no-code-fills');
            return;
        }
        
        this.hideEmptyState();
        
        // Show/hide tab content
        this.presetsContent.style.display = tab === 'presets' ? 'flex' : 'none';
        this.customContent.style.display = tab === 'custom' ? 'flex' : 'none';
        this.aiContent.style.display = tab === 'ai' ? 'flex' : 'none';
        
        // Refresh content
        if (tab === 'presets') {
            this.renderPresetGrid();
        } else if (tab === 'custom') {
            this.updateCustomTabContent();
        } else if (tab === 'ai') {
            this.updateAITabContent();
        }
    }

    // ========================================
    // STORE INTEGRATION
    // ========================================
    
    handleStoreChange(state) {
        const selectedIds = state.editor.selectedElementIds || [];
        
        if (selectedIds.length === 0) {
            // Check for slide background context
            // For now, just show no selection state
            this.currentElementId = null;
            this.isSlideBackground = false;
            this.currentFills = [];
            this.selectedCodeFillIndex = -1;
            
            this.contextIndicator.style.display = 'none';
            this.updateFillLayerBar();
            this.switchTab(this.activeTab);
            return;
        }
        
        // Use first selected element
        const elementId = selectedIds[0];
        
        // Get container (slide or master)
        let container;
        if (state.editor.mode === 'master') {
            container = state.masters[state.editor.activeMasterId];
        } else {
            container = state.slides[state.editor.activeSlideId];
        }
        
        if (!container || !container.elements[elementId]) {
            this.currentElementId = null;
            this.currentFills = [];
            return;
        }
        
        const element = container.elements[elementId];
        const fills = element.style?.fills || [];
        
        // Check if element changed
        if (this.currentElementId !== elementId) {
            this.currentElementId = elementId;
            this.isSlideBackground = false;
            this.currentFills = fills;
            this.selectedCodeFillIndex = this.findFirstCodeFillIndex(fills);
            
            this.contextIndicator.style.display = 'none';
            this.updateFillLayerBar();
            this.switchTab(this.activeTab);
        } else {
            // Same element, just update fills
            this.currentFills = fills;
            this.updateFillLayerBar();
            
            // Update current tab content
            if (this.activeTab === 'custom') {
                // Only update if code actually changed (avoid cursor jump)
                const currentCode = this.currentFills[this.selectedCodeFillIndex]?.code;
                if (currentCode && this.codeEditor.value !== currentCode) {
                    this.codeEditor.value = currentCode;
                }
            } else if (this.activeTab === 'ai') {
                this.updateAITabContent();
            }
        }
    }

    // ========================================
    // LIFECYCLE
    // ========================================
    
    onOpen() {
        // Subscribe to store changes
        store.on('state-changed', this.boundHandleStoreChange);
        
        // Initial state
        this.handleStoreChange(store.getState());
        
        // Render presets
        this.renderPresetGrid();
    }

    onClose() {
        // Unsubscribe from store
        store.off('state-changed', this.boundHandleStoreChange);
        
        // Stop runners
        if (this.runner) {
            this.runner.stop();
        }
        if (this.aiRunner) {
            this.aiRunner.stop();
        }
        
        this.destroyPresetCards();
        
        if (this.historyRunners) {
            this.historyRunners.forEach(r => r.stop());
        }
    }

    destroy() {
        this.onClose();
        super.destroy();
        instance = null;
    }
}

export default CodeFillPanel;
