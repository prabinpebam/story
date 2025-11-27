import { IconButton } from '../IconButton.js';
import { Icons } from '../../Icons.js';
import { CodeRunner } from '../../../core/effects/CodeRunner.js';
import { AIService } from '../../../core/ai/AIService.js';
import { CODE_FILL_PROMPT, CODE_FILL_UPDATE_PROMPT, PROMPT_REFINEMENT_PROMPT } from '../../../core/ai/prompts/templates.js';
import { PresetsTab } from './PresetsTab.js';
import { PresetManager } from '../../../core/services/PresetManager.js';
import { CodeFillPanel } from '../../panels/CodeFillPanel.js';
import { SegmentedControl } from '../SegmentedControl.js';

export class CodeTab {
    constructor(options = {}) {
        this.fill = options.fill || {};
        this.onChange = options.onChange || (() => {});
        
        this.activeSubTab = 'presets'; // 'presets' | 'custom'
        this.presetsTab = null;
        this.runner = null;
        
        this.element = document.createElement('div');
        this.element.className = 'flyout-content';
        
        this.render();
    }

    render() {
        this.element.innerHTML = '';
        this.destroySubComponents();

        // Tab control using SegmentedControl (same as dedicated panel)
        const tabContainer = document.createElement('div');
        tabContainer.className = 'code-tab-header';
        
        this.tabControl = new SegmentedControl({
            options: [
                { value: 'presets', label: 'Presets' },
                { value: 'custom', label: 'Custom' }
            ],
            value: this.activeSubTab,
            onChange: (tab) => this.switchSubTab(tab)
        });
        
        tabContainer.appendChild(this.tabControl.element);
        this.element.appendChild(tabContainer);

        // Content area
        const content = document.createElement('div');
        content.className = 'code-tab-content';

        if (this.activeSubTab === 'presets') {
            this.renderPresetsContent(content);
        } else {
            this.renderCustomContent(content);
        }

        this.element.appendChild(content);
    }

    switchSubTab(tab) {
        if (this.activeSubTab === tab) return;
        this.activeSubTab = tab;
        this.render();
    }

    renderPresetsContent(container) {
        this.presetsTab = new PresetsTab({
            onSelect: (preset) => this.handlePresetSelect(preset)
        });
        container.appendChild(this.presetsTab.element);
    }

    handlePresetSelect(preset) {
        // Apply preset code and switch to custom tab
        // Note: Don't modify this.fill directly as it may be frozen
        this.onChange({ code: preset.code });
        this.activeSubTab = 'custom';
        this.render();
    }

    renderCustomContent(container) {
        // 1. Canvas Preview
        const previewContainer = document.createElement('div');
        previewContainer.className = 'code-preview-container';

        const canvas = document.createElement('canvas');
        canvas.className = 'code-preview-canvas';
        canvas.width = 240; 
        canvas.height = 140;
        
        previewContainer.appendChild(canvas);
        container.appendChild(previewContainer);

        // Initialize CodeRunner for preview
        this.runner = new CodeRunner(canvas);
        const codeToRun = this.fill.code || CodeRunner.DEFAULT_CODE;
        this.runner.setCode(codeToRun);
        this.runner.play();

        // 2. AI Generation
        const aiSection = document.createElement('div');
        aiSection.className = 'code-ai-section';

        const promptInput = document.createElement('textarea');
        promptInput.placeholder = 'Describe a pattern or animation...';
        promptInput.className = 'code-prompt-input';

        // Refine Prompt Checkbox
        const refineContainer = document.createElement('div');
        refineContainer.className = 'code-refine-container';

        const refineCheckbox = document.createElement('input');
        refineCheckbox.type = 'checkbox';
        refineCheckbox.id = 'refine-prompt-checkbox-' + Date.now();
        refineCheckbox.checked = true;
        refineCheckbox.style.cursor = 'pointer';
        
        const refineLabel = document.createElement('label');
        refineLabel.htmlFor = refineCheckbox.id;
        refineLabel.textContent = 'Refine prompt';
        refineLabel.className = 'code-refine-label';

        refineContainer.appendChild(refineCheckbox);
        refineContainer.appendChild(refineLabel);
        this.refineCheckbox = refineCheckbox;

        const buttonRow = document.createElement('div');
        buttonRow.className = 'code-button-row';

        const updateBtn = document.createElement('button');
        updateBtn.textContent = 'Update';
        updateBtn.className = 'code-btn-update';
        updateBtn.onclick = () => this.handleAIGenerate(promptInput.value, 'update');

        const generateBtn = document.createElement('button');
        generateBtn.textContent = 'Generate';
        generateBtn.className = 'code-btn-generate';
        generateBtn.onclick = () => this.handleAIGenerate(promptInput.value, 'new');

        buttonRow.appendChild(updateBtn);
        buttonRow.appendChild(generateBtn);
        
        aiSection.appendChild(promptInput);
        aiSection.appendChild(refineContainer);
        aiSection.appendChild(buttonRow);
        container.appendChild(aiSection);

        // 3. Code Editor
        const editorContainer = document.createElement('div');
        editorContainer.className = 'code-editor-container';
        
        const editor = document.createElement('textarea');
        editor.value = this.fill.code || this.runner.userCode;
        editor.className = 'code-editor';
        editor.spellcheck = false;
        
        editor.addEventListener('input', (e) => {
            const newCode = e.target.value;
            this.runner.setCode(newCode);
            this.onChange({ code: newCode });
        });

        editorContainer.appendChild(editor);
        container.appendChild(editorContainer);
        
        this.editor = editor;

        // 4. Save as Preset Button
        const saveBtn = document.createElement('button');
        saveBtn.textContent = '+ Save as Preset';
        saveBtn.className = 'code-save-btn';
        saveBtn.onclick = () => this.showSavePresetDialog();
        
        container.appendChild(saveBtn);
    }

    showSavePresetDialog() {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'code-modal-overlay';

        const modal = document.createElement('div');
        modal.className = 'code-modal';

        // Title
        const title = document.createElement('div');
        title.textContent = 'Save Preset';
        title.className = 'code-modal-title';
        modal.appendChild(title);

        // Name input
        const nameLabel = document.createElement('label');
        nameLabel.textContent = 'Name';
        nameLabel.className = 'code-modal-label';
        modal.appendChild(nameLabel);

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = 'My Custom Preset';
        nameInput.className = 'code-modal-input';
        modal.appendChild(nameInput);

        // Preview
        const previewLabel = document.createElement('div');
        previewLabel.textContent = 'Preview';
        previewLabel.className = 'code-modal-label';
        modal.appendChild(previewLabel);

        const previewContainer = document.createElement('div');
        previewContainer.className = 'code-modal-preview';

        const previewCanvas = document.createElement('canvas');
        previewCanvas.width = 240;
        previewCanvas.height = 80;
        previewContainer.appendChild(previewCanvas);
        modal.appendChild(previewContainer);

        // Start preview
        const previewRunner = new CodeRunner(previewCanvas);
        previewRunner.setCode(this.editor?.value || this.fill.code || CodeRunner.DEFAULT_CODE);
        previewRunner.play();

        // Buttons
        const buttonRow = document.createElement('div');
        buttonRow.className = 'code-modal-buttons';

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.className = 'code-modal-btn-cancel';
        cancelBtn.onclick = () => {
            previewRunner.stop();
            overlay.remove();
        };

        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save';
        saveBtn.className = 'code-modal-btn-save';
        saveBtn.onclick = () => {
            const name = nameInput.value.trim();
            if (!name) {
                alert('Please enter a name for your preset.');
                nameInput.focus();
                return;
            }

            if (PresetManager.isNameTaken(name)) {
                alert('A preset with this name already exists. Please choose a different name.');
                nameInput.focus();
                return;
            }

            try {
                PresetManager.saveUserPreset({
                    name,
                    description: '',
                    code: this.editor?.value || this.fill.code || CodeRunner.DEFAULT_CODE
                });
                
                previewRunner.stop();
                overlay.remove();
                
                // Refresh presets tab if visible
                if (this.presetsTab) {
                    this.presetsTab.render();
                }
            } catch (e) {
                alert('Failed to save preset: ' + e.message);
            }
        };

        buttonRow.appendChild(cancelBtn);
        buttonRow.appendChild(saveBtn);
        modal.appendChild(buttonRow);

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Close on overlay click
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                previewRunner.stop();
                overlay.remove();
            }
        };

        // Focus input
        setTimeout(() => nameInput.focus(), 100);
    }

    async handleAIGenerate(prompt, mode) {
        if (!prompt) return;
        
        const buttons = this.element.querySelectorAll('button');
        const btn = mode === 'update' ? buttons[0] : buttons[1];
        if (!btn) return;
        
        const originalText = btn.textContent;
        btn.textContent = 'Generating...';
        btn.disabled = true;
        
        try {
            const ai = new AIService();
            let finalPrompt = prompt;

            // Step 1: Refine Prompt if requested
            if (this.refineCheckbox && this.refineCheckbox.checked) {
                btn.textContent = 'Refining...';
                const refinementSystemPrompt = PROMPT_REFINEMENT_PROMPT.replace('{userPrompt}', prompt);
                
                const refined = await ai.generate("Refine the prompt.", { 
                    systemPrompt: refinementSystemPrompt 
                });
                
                finalPrompt = refined.trim();
                
                // Update UI with refined prompt
                const promptInput = this.element.querySelector('textarea:not([spellcheck="false"])');
                if (promptInput) {
                    promptInput.value = finalPrompt;
                }
                
                btn.textContent = 'Generating Code...';
            }

            let systemPrompt = '';
            let userPrompt = '';
            
            if (mode === 'new') {
                systemPrompt = CODE_FILL_PROMPT.replace('{description}', finalPrompt);
                userPrompt = `Generate a canvas animation code for: ${finalPrompt}`;
            } else {
                systemPrompt = CODE_FILL_UPDATE_PROMPT
                    .replace('{existingCode}', this.editor.value)
                    .replace('{request}', finalPrompt);
                userPrompt = `Update the code to: ${finalPrompt}`;
            }

            // Call AI Service
            const generatedCode = await ai.generate(userPrompt, { systemPrompt });
            
            // Clean up code (remove markdown blocks if any)
            let cleanCode = generatedCode.replace(/```javascript/g, '').replace(/```/g, '').trim();
            
            this.editor.value = cleanCode;
            this.runner.setCode(cleanCode);
            this.onChange({ code: cleanCode });
            
        } catch (error) {
            console.error('AI Generation failed:', error);
            alert('Failed to generate code. Please check your AI settings.');
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }

    destroySubComponents() {
        if (this.presetsTab) {
            this.presetsTab.destroy();
            this.presetsTab = null;
        }
        if (this.runner) {
            this.runner.stop();
            this.runner = null;
        }
    }
    
    destroy() {
        this.destroySubComponents();
    }
}
