/**
 * CodeFillPanel.js
 * A dedicated draggable, resizable panel for managing code-based dynamic fills.
 * Follows patterns from TypographyStyleManager and ColorThemeManager.
 * 
 * Features:
 * - Two tabs: Presets and Custom
 * - Custom tab includes AI generation as an inline feature
 * - Uses CodeMirror for syntax highlighting
 * - Native text undo/redo support
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
            defaultWidth: 420,
            defaultHeight: 650,
            minWidth: 380,
            minHeight: 550,
            maxWidth: 650,
            maxHeight: 900
        });
        
        this.activeTab = 'presets';
        this.selectedCodeFillIndex = -1;
        this.currentFills = [];
        this.currentElementId = null;
        this.isSlideBackground = false;
        
        // Code editing
        this.runner = null;
        this.codeMirror = null;
        this.updateDebounceTimer = null;
        
        // AI state
        this.refinePromptEnabled = true;
        
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
        
        // Create tab control - only 2 tabs now
        this.tabControl = new SegmentedControl({
            options: [
                { value: 'presets', label: 'Presets' },
                { value: 'custom', label: 'Custom' }
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
        
        this.contentElement.appendChild(this.presetsContent);
        this.contentElement.appendChild(this.customContent);
        
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
    // CUSTOM TAB (with integrated AI)
    // ========================================
    
    createCustomTab() {
        const container = document.createElement('div');
        container.className = 'cfp-custom-tab cfp-tab-content';
        
        // Canvas preview area with overlaid controls
        const previewSection = document.createElement('div');
        previewSection.className = 'cfp-preview-section';
        
        this.previewCanvas = document.createElement('canvas');
        this.previewCanvas.className = 'cfp-preview-canvas';
        this.previewCanvas.width = 360;
        this.previewCanvas.height = 180;
        previewSection.appendChild(this.previewCanvas);
        
        // Playback controls (overlaid on preview)
        const playbackControls = document.createElement('div');
        playbackControls.className = 'cfp-playback-controls';
        
        this.playPauseBtn = document.createElement('button');
        this.playPauseBtn.className = 'cfp-control-btn';
        this.playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        this.playPauseBtn.title = 'Play/Pause';
        this.playPauseBtn.onclick = () => this.togglePlayback();
        
        this.resetBtn = document.createElement('button');
        this.resetBtn.className = 'cfp-control-btn';
        this.resetBtn.innerHTML = '<i class="fa-solid fa-rotate-left"></i>';
        this.resetBtn.title = 'Reset';
        this.resetBtn.onclick = () => this.resetPlayback();
        
        this.errorIndicator = document.createElement('div');
        this.errorIndicator.className = 'cfp-error-indicator success';
        this.errorIndicator.innerHTML = '✓ No errors';
        
        playbackControls.appendChild(this.playPauseBtn);
        playbackControls.appendChild(this.resetBtn);
        playbackControls.appendChild(this.errorIndicator);
        
        previewSection.appendChild(playbackControls);
        
        container.appendChild(previewSection);
        
        // AI Generation Section (always visible, prominently displayed)
        const aiSection = this.createAISection();
        container.appendChild(aiSection);
        
        // Code editor section with CodeMirror
        const editorSection = document.createElement('div');
        editorSection.className = 'cfp-editor-section';
        
        const editorHeader = document.createElement('div');
        editorHeader.className = 'cfp-editor-header';
        editorHeader.innerHTML = '<span>Code</span>';
        editorSection.appendChild(editorHeader);
        
        // CodeMirror container
        this.editorContainer = document.createElement('div');
        this.editorContainer.className = 'cfp-codemirror-container';
        editorSection.appendChild(this.editorContainer);
        
        container.appendChild(editorSection);
        
        return container;
    }

    createAISection() {
        const aiSection = document.createElement('div');
        aiSection.className = 'cfp-ai-section';
        
        // Header (non-collapsible, always visible)
        const aiHeader = document.createElement('div');
        aiHeader.className = 'cfp-ai-header';
        aiHeader.innerHTML = `
            <span class="cfp-ai-header-icon">✨</span>
            <span class="cfp-ai-header-title">AI Generate</span>
        `;
        aiSection.appendChild(aiHeader);
        
        // AI content (always visible)
        const aiContent = document.createElement('div');
        aiContent.className = 'cfp-ai-content';
        
        // Prompt input
        const promptContainer = document.createElement('div');
        promptContainer.className = 'cfp-ai-prompt-container';
        
        this.aiPromptInput = document.createElement('textarea');
        this.aiPromptInput.className = 'cfp-ai-prompt';
        this.aiPromptInput.placeholder = 'Describe the animation you want, e.g. "flowing gradient with gentle blue waves"';
        this.aiPromptInput.rows = 2;
        promptContainer.appendChild(this.aiPromptInput);
        
        aiContent.appendChild(promptContainer);
        
        // Refine prompt option
        const refineContainer = document.createElement('div');
        refineContainer.className = 'cfp-refine-container';
        
        this.refineCheckbox = document.createElement('input');
        this.refineCheckbox.type = 'checkbox';
        this.refineCheckbox.id = 'cfp-refine-prompt';
        this.refineCheckbox.checked = this.refinePromptEnabled;
        this.refineCheckbox.onchange = (e) => {
            this.refinePromptEnabled = e.target.checked;
        };
        
        const refineLabel = document.createElement('label');
        refineLabel.htmlFor = 'cfp-refine-prompt';
        refineLabel.textContent = 'Refine prompt before generating';
        
        refineContainer.appendChild(this.refineCheckbox);
        refineContainer.appendChild(refineLabel);
        aiContent.appendChild(refineContainer);
        
        // AI buttons row
        const aiButtonRow = document.createElement('div');
        aiButtonRow.className = 'cfp-ai-buttons';
        
        this.aiUpdateBtn = document.createElement('button');
        this.aiUpdateBtn.className = 'cfp-btn cfp-btn-secondary cfp-btn-sm';
        this.aiUpdateBtn.textContent = 'Modify';
        this.aiUpdateBtn.title = 'Modify existing code based on prompt';
        this.aiUpdateBtn.onclick = () => this.handleAIGenerate('update');
        
        this.aiGenerateBtn = document.createElement('button');
        this.aiGenerateBtn.className = 'cfp-btn cfp-btn-primary cfp-btn-sm';
        this.aiGenerateBtn.textContent = 'Generate New';
        this.aiGenerateBtn.title = 'Generate entirely new code';
        this.aiGenerateBtn.onclick = () => this.handleAIGenerate('new');
        
        aiButtonRow.appendChild(this.aiUpdateBtn);
        aiButtonRow.appendChild(this.aiGenerateBtn);
        
        aiContent.appendChild(aiButtonRow);
        
        aiSection.appendChild(aiContent);
        
        return aiSection;
    }

    initCodeMirror() {
        // Only init if not already done and CodeMirror is available
        if (this.codeMirror || !window.CodeMirror) {
            return;
        }
        
        // Clear container
        this.editorContainer.innerHTML = '';
        
        // Create CodeMirror instance
        this.codeMirror = CodeMirror(this.editorContainer, {
            value: '',
            mode: 'javascript',
            theme: 'dracula',
            lineNumbers: true,
            lineWrapping: true,
            indentUnit: 2,
            tabSize: 2,
            indentWithTabs: false,
            autoCloseBrackets: true,
            matchBrackets: true,
            scrollbarStyle: 'native',
            viewportMargin: Infinity
        });
        
        // Handle changes - uses native undo/redo
        this.codeMirror.on('change', (cm) => {
            this.handleCodeChange(cm.getValue());
        });
        
        // Refresh after a short delay to ensure proper rendering
        setTimeout(() => {
            if (this.codeMirror) {
                this.codeMirror.refresh();
            }
        }, 100);
    }

    updateCustomTabContent() {
        // Initialize CodeMirror if needed
        this.initCodeMirror();
        
        if (this.selectedCodeFillIndex < 0 || !this.currentFills[this.selectedCodeFillIndex]) {
            // No code fill selected
            if (this.codeMirror) {
                this.codeMirror.setValue('');
            }
            if (this.runner) {
                this.runner.stop();
            }
            return;
        }
        
        const fill = this.currentFills[this.selectedCodeFillIndex];
        const code = fill.code || CodeRunner.DEFAULT_CODE;
        
        // Update CodeMirror value
        if (this.codeMirror && this.codeMirror.getValue() !== code) {
            // Save cursor position
            const cursor = this.codeMirror.getCursor();
            const scrollInfo = this.codeMirror.getScrollInfo();
            
            this.codeMirror.setValue(code);
            
            // Restore cursor if possible
            try {
                this.codeMirror.setCursor(cursor);
                this.codeMirror.scrollTo(scrollInfo.left, scrollInfo.top);
            } catch (e) {
                // Ignore if cursor position is invalid
            }
        }
        
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
            this.playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
            this.playPauseBtn.title = 'Pause';
        } else {
            this.playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
            this.playPauseBtn.title = 'Play';
        }
    }

    updateErrorIndicator() {
        if (!this.runner) return;
        
        if (this.runner.hasError) {
            this.errorIndicator.className = 'cfp-error-indicator error';
            this.errorIndicator.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Error`;
            this.errorIndicator.title = this.runner.errorMessage || 'Code execution error';
        } else {
            this.errorIndicator.className = 'cfp-error-indicator success';
            this.errorIndicator.innerHTML = '✓';
            this.errorIndicator.title = 'Code is valid';
        }
    }

    // ========================================
    // AI GENERATION
    // ========================================
    
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
        
        const btn = mode === 'update' ? this.aiUpdateBtn : this.aiGenerateBtn;
        const originalText = btn.textContent;
        btn.textContent = 'Working...';
        btn.disabled = true;
        this.aiUpdateBtn.disabled = true;
        this.aiGenerateBtn.disabled = true;
        
        try {
            const ai = new AIService();
            let finalPrompt = prompt;
            
            // Refine prompt if enabled
            if (this.refinePromptEnabled) {
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
            
            // Clean up code - remove markdown code blocks
            let cleanCode = generatedCode.replace(/```javascript/g, '').replace(/```/g, '').trim();
            
            // Apply code
            const newFills = [...this.currentFills];
            newFills[this.selectedCodeFillIndex] = {
                ...newFills[this.selectedCodeFillIndex],
                code: cleanCode
            };
            
            this.updateElementFills(newFills);
            this.currentFills = newFills;
            
            // Update editor
            if (this.codeMirror) {
                this.codeMirror.setValue(cleanCode);
            }
            
            // Update preview
            if (this.runner) {
                this.runner.setCode(cleanCode);
            }
            
            this.updateErrorIndicator();
            
        } catch (error) {
            console.error('AI Generation failed:', error);
            alert('Failed to generate code. Please check your AI settings.');
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
            this.aiUpdateBtn.disabled = false;
            this.aiGenerateBtn.disabled = false;
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
        
        // Update tab control visually
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
        if (!hasCodeFills && tab === 'custom') {
            this.showEmptyState('no-code-fills');
            return;
        }
        
        this.hideEmptyState();
        
        // Show/hide tab content
        this.presetsContent.style.display = tab === 'presets' ? 'flex' : 'none';
        this.customContent.style.display = tab === 'custom' ? 'flex' : 'none';
        
        // Refresh content
        if (tab === 'presets') {
            this.renderPresetGrid();
        } else if (tab === 'custom') {
            this.updateCustomTabContent();
            // Refresh CodeMirror after display
            setTimeout(() => {
                if (this.codeMirror) {
                    this.codeMirror.refresh();
                }
            }, 50);
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
            
            // Update current tab content if on custom
            if (this.activeTab === 'custom') {
                // Only update if code actually changed (avoid cursor jump)
                const currentCode = this.currentFills[this.selectedCodeFillIndex]?.code;
                if (currentCode && this.codeMirror && this.codeMirror.getValue() !== currentCode) {
                    const cursor = this.codeMirror.getCursor();
                    this.codeMirror.setValue(currentCode);
                    try {
                        this.codeMirror.setCursor(cursor);
                    } catch (e) {
                        // Ignore
                    }
                }
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
        
        this.destroyPresetCards();
    }

    destroy() {
        this.onClose();
        
        // Cleanup CodeMirror
        if (this.codeMirror) {
            this.codeMirror.toTextArea();
            this.codeMirror = null;
        }
        
        super.destroy();
        instance = null;
    }
}

export default CodeFillPanel;
