import { IconButton } from '../IconButton.js';
import { Icons } from '../../Icons.js';
import { CodeRunner } from '../../../core/effects/CodeRunner.js';
import { AIService } from '../../../core/ai/AIService.js';
import { CODE_FILL_PROMPT, CODE_FILL_UPDATE_PROMPT, PROMPT_REFINEMENT_PROMPT } from '../../../core/ai/prompts/templates.js';
import { PresetsTab } from './PresetsTab.js';
import { PresetManager } from '../../../core/services/PresetManager.js';

export class CodeTab {
    constructor(options = {}) {
        this.fill = options.fill || {};
        this.onChange = options.onChange || (() => {});
        
        this.activeSubTab = 'presets'; // 'presets' | 'custom'
        this.presetsTab = null;
        this.runner = null;
        
        this.element = document.createElement('div');
        this.element.style.display = 'flex';
        this.element.style.flexDirection = 'column';
        this.element.style.gap = '12px';
        
        this.render();
    }

    render() {
        this.element.innerHTML = '';
        this.destroySubComponents();

        // Sub-tabs header
        const tabsHeader = document.createElement('div');
        tabsHeader.style.cssText = `
            display: flex;
            gap: 0;
            border-bottom: 1px solid #444;
            margin-bottom: 4px;
        `;

        const presetsTabBtn = this.createTabButton('Presets', this.activeSubTab === 'presets');
        presetsTabBtn.onclick = () => this.switchSubTab('presets');

        const customTabBtn = this.createTabButton('Custom', this.activeSubTab === 'custom');
        customTabBtn.onclick = () => this.switchSubTab('custom');

        tabsHeader.appendChild(presetsTabBtn);
        tabsHeader.appendChild(customTabBtn);
        this.element.appendChild(tabsHeader);

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

    createTabButton(label, isActive) {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.style.cssText = `
            flex: 1;
            padding: 8px 12px;
            border: none;
            background: ${isActive ? '#383838' : 'transparent'};
            color: ${isActive ? '#fff' : '#888'};
            font-size: 11px;
            font-weight: ${isActive ? '600' : '400'};
            cursor: pointer;
            transition: all 0.15s ease;
            border-bottom: 2px solid ${isActive ? '#0055FF' : 'transparent'};
        `;
        btn.onmouseenter = () => {
            if (!isActive) btn.style.background = '#333';
        };
        btn.onmouseleave = () => {
            if (!isActive) btn.style.background = 'transparent';
        };
        return btn;
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
        previewContainer.style.cssText = `
            width: 100%;
            height: 140px;
            background-color: #000;
            border-radius: 4px;
            position: relative;
            overflow: hidden;
            border: 1px solid #444;
        `;

        const canvas = document.createElement('canvas');
        canvas.style.width = '100%';
        canvas.style.height = '100%';
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
        aiSection.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 8px;
        `;

        const promptInput = document.createElement('textarea');
        promptInput.placeholder = 'Describe a pattern or animation...';
        promptInput.style.cssText = `
            width: 100%;
            height: 36px;
            background-color: #383838;
            border: 1px solid transparent;
            border-radius: 4px;
            color: #FFF;
            padding: 8px;
            font-size: 11px;
            resize: none;
            font-family: Inter, sans-serif;
        `;

        // Refine Prompt Checkbox
        const refineContainer = document.createElement('div');
        refineContainer.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 0 4px;
        `;

        const refineCheckbox = document.createElement('input');
        refineCheckbox.type = 'checkbox';
        refineCheckbox.id = 'refine-prompt-checkbox-' + Date.now();
        refineCheckbox.checked = true;
        refineCheckbox.style.cursor = 'pointer';
        
        const refineLabel = document.createElement('label');
        refineLabel.htmlFor = refineCheckbox.id;
        refineLabel.textContent = 'Refine prompt';
        refineLabel.style.cssText = `
            color: #D4D4D4;
            font-size: 11px;
            user-select: none;
            cursor: pointer;
        `;

        refineContainer.appendChild(refineCheckbox);
        refineContainer.appendChild(refineLabel);
        this.refineCheckbox = refineCheckbox;

        const buttonRow = document.createElement('div');
        buttonRow.style.cssText = `
            display: flex;
            gap: 8px;
        `;

        const updateBtn = document.createElement('button');
        updateBtn.textContent = 'Update';
        updateBtn.style.cssText = `
            flex: 1;
            background-color: #0055FF;
            color: #FFF;
            border: none;
            border-radius: 4px;
            padding: 6px;
            font-size: 11px;
            cursor: pointer;
        `;
        updateBtn.onclick = () => this.handleAIGenerate(promptInput.value, 'update');

        const generateBtn = document.createElement('button');
        generateBtn.textContent = 'Generate';
        generateBtn.style.cssText = `
            flex: 1;
            background-color: #444;
            color: #FFF;
            border: none;
            border-radius: 4px;
            padding: 6px;
            font-size: 11px;
            cursor: pointer;
        `;
        generateBtn.onclick = () => this.handleAIGenerate(promptInput.value, 'new');

        buttonRow.appendChild(updateBtn);
        buttonRow.appendChild(generateBtn);
        
        aiSection.appendChild(promptInput);
        aiSection.appendChild(refineContainer);
        aiSection.appendChild(buttonRow);
        container.appendChild(aiSection);

        // 3. Code Editor
        const editorContainer = document.createElement('div');
        editorContainer.style.position = 'relative';
        
        const editor = document.createElement('textarea');
        editor.value = this.fill.code || this.runner.userCode;
        editor.style.cssText = `
            width: 100%;
            height: 100px;
            background-color: #1E1E1E;
            border: 1px solid #444;
            border-radius: 4px;
            color: #D4D4D4;
            padding: 8px;
            font-size: 11px;
            font-family: monospace;
            resize: vertical;
        `;
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
        saveBtn.style.cssText = `
            width: 100%;
            background-color: transparent;
            color: #888;
            border: 1px dashed #555;
            border-radius: 4px;
            padding: 8px;
            font-size: 11px;
            cursor: pointer;
            transition: all 0.15s ease;
        `;
        saveBtn.onmouseenter = () => {
            saveBtn.style.borderColor = '#0055FF';
            saveBtn.style.color = '#0055FF';
        };
        saveBtn.onmouseleave = () => {
            saveBtn.style.borderColor = '#555';
            saveBtn.style.color = '#888';
        };
        saveBtn.onclick = () => this.showSavePresetDialog();
        
        container.appendChild(saveBtn);
    }

    showSavePresetDialog() {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            z-index: 10002;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        const modal = document.createElement('div');
        modal.style.cssText = `
            background: #2c2c2c;
            border-radius: 8px;
            padding: 16px;
            width: 280px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        `;

        // Title
        const title = document.createElement('div');
        title.textContent = 'Save Preset';
        title.style.cssText = `
            font-size: 14px;
            font-weight: 600;
            color: #fff;
            margin-bottom: 16px;
        `;
        modal.appendChild(title);

        // Name input
        const nameLabel = document.createElement('label');
        nameLabel.textContent = 'Name';
        nameLabel.style.cssText = `
            display: block;
            font-size: 11px;
            color: #888;
            margin-bottom: 4px;
        `;
        modal.appendChild(nameLabel);

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = 'My Custom Preset';
        nameInput.style.cssText = `
            width: 100%;
            padding: 8px;
            background: #383838;
            border: 1px solid #555;
            border-radius: 4px;
            color: #fff;
            font-size: 12px;
            margin-bottom: 16px;
        `;
        modal.appendChild(nameInput);

        // Preview
        const previewLabel = document.createElement('div');
        previewLabel.textContent = 'Preview';
        previewLabel.style.cssText = `
            font-size: 11px;
            color: #888;
            margin-bottom: 4px;
        `;
        modal.appendChild(previewLabel);

        const previewContainer = document.createElement('div');
        previewContainer.style.cssText = `
            width: 100%;
            height: 100px;
            background: #1a1a1a;
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 16px;
        `;

        const previewCanvas = document.createElement('canvas');
        previewCanvas.width = 240;
        previewCanvas.height = 100;
        previewCanvas.style.cssText = `
            width: 100%;
            height: 100%;
        `;
        previewContainer.appendChild(previewCanvas);
        modal.appendChild(previewContainer);

        // Start preview
        const previewRunner = new CodeRunner(previewCanvas);
        previewRunner.setCode(this.editor?.value || this.fill.code || CodeRunner.DEFAULT_CODE);
        previewRunner.play();

        // Buttons
        const buttonRow = document.createElement('div');
        buttonRow.style.cssText = `
            display: flex;
            gap: 8px;
            justify-content: flex-end;
        `;

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.cssText = `
            padding: 8px 16px;
            background: #444;
            color: #fff;
            border: none;
            border-radius: 4px;
            font-size: 11px;
            cursor: pointer;
        `;
        cancelBtn.onclick = () => {
            previewRunner.stop();
            overlay.remove();
        };

        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save';
        saveBtn.style.cssText = `
            padding: 8px 16px;
            background: #0055FF;
            color: #fff;
            border: none;
            border-radius: 4px;
            font-size: 11px;
            cursor: pointer;
        `;
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
