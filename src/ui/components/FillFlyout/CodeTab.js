import { IconButton } from '../IconButton.js';
import { Icons } from '../../Icons.js';
import { CodeRunner } from '../../../core/effects/CodeRunner.js';
import { AIService } from '../../../core/ai/AIService.js';
import { CODE_FILL_PROMPT, CODE_FILL_UPDATE_PROMPT } from '../../../core/ai/prompts/templates.js';

export class CodeTab {
    constructor(options = {}) {
        this.fill = options.fill || {};
        this.onChange = options.onChange || (() => {});
        
        this.element = document.createElement('div');
        this.element.style.display = 'flex';
        this.element.style.flexDirection = 'column';
        this.element.style.gap = '12px';
        
        this.render();
    }

    render() {
        this.element.innerHTML = '';

        // 1. Canvas Preview
        const previewContainer = document.createElement('div');
        previewContainer.style.width = '100%';
        previewContainer.style.height = '160px';
        previewContainer.style.backgroundColor = '#000';
        previewContainer.style.borderRadius = '4px';
        previewContainer.style.position = 'relative';
        previewContainer.style.overflow = 'hidden';
        previewContainer.style.border = '1px solid #444';

        const canvas = document.createElement('canvas');
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        // Set actual resolution
        canvas.width = 240; 
        canvas.height = 160;
        
        previewContainer.appendChild(canvas);
        this.element.appendChild(previewContainer);

        // Initialize CodeRunner for preview
        this.runner = new CodeRunner(canvas);
        const codeToRun = this.fill.code || CodeRunner.DEFAULT_CODE;
        this.runner.setCode(codeToRun);
        this.runner.play();
        
        // Note: We do NOT trigger onChange here to avoid re-render loops.
        // The parent (FillFlyout) should have set the default code if it was missing.
        // If it didn't, we just show the default code locally.

        // 2. AI Generation
        const aiSection = document.createElement('div');
        aiSection.style.display = 'flex';
        aiSection.style.flexDirection = 'column';
        aiSection.style.gap = '8px';

        const promptInput = document.createElement('textarea');
        promptInput.placeholder = 'Describe a pattern or animation...';
        promptInput.style.width = '100%';
        promptInput.style.height = '40px';
        promptInput.style.backgroundColor = '#383838';
        promptInput.style.border = '1px solid transparent';
        promptInput.style.borderRadius = '4px';
        promptInput.style.color = '#FFF';
        promptInput.style.padding = '8px';
        promptInput.style.fontSize = '11px';
        promptInput.style.resize = 'none';
        promptInput.style.fontFamily = 'Inter, sans-serif';

        const buttonRow = document.createElement('div');
        buttonRow.style.display = 'flex';
        buttonRow.style.gap = '8px';

        const updateBtn = document.createElement('button');
        updateBtn.textContent = 'Update';
        updateBtn.style.flex = '1';
        updateBtn.style.backgroundColor = '#0055FF';
        updateBtn.style.color = '#FFF';
        updateBtn.style.border = 'none';
        updateBtn.style.borderRadius = '4px';
        updateBtn.style.padding = '6px';
        updateBtn.style.fontSize = '11px';
        updateBtn.style.cursor = 'pointer';
        updateBtn.onclick = () => this.handleAIGenerate(promptInput.value, 'update');

        const generateBtn = document.createElement('button');
        generateBtn.textContent = 'Generate New';
        generateBtn.style.flex = '1';
        generateBtn.style.backgroundColor = '#444';
        generateBtn.style.color = '#FFF';
        generateBtn.style.border = 'none';
        generateBtn.style.borderRadius = '4px';
        generateBtn.style.padding = '6px';
        generateBtn.style.fontSize = '11px';
        generateBtn.style.cursor = 'pointer';
        generateBtn.onclick = () => this.handleAIGenerate(promptInput.value, 'new');

        buttonRow.appendChild(updateBtn);
        buttonRow.appendChild(generateBtn);
        
        aiSection.appendChild(promptInput);
        aiSection.appendChild(buttonRow);
        this.element.appendChild(aiSection);

        // 3. Code Editor
        const editorContainer = document.createElement('div');
        editorContainer.style.position = 'relative';
        
        const editor = document.createElement('textarea');
        editor.value = this.fill.code || this.runner.userCode;
        editor.style.width = '100%';
        editor.style.height = '120px';
        editor.style.backgroundColor = '#1E1E1E';
        editor.style.border = '1px solid #444';
        editor.style.borderRadius = '4px';
        editor.style.color = '#D4D4D4';
        editor.style.padding = '8px';
        editor.style.fontSize = '11px';
        editor.style.fontFamily = 'monospace';
        editor.style.resize = 'vertical';
        editor.spellcheck = false;
        
        editor.addEventListener('input', (e) => {
            const newCode = e.target.value;
            this.runner.setCode(newCode);
            this.onChange({ code: newCode });
        });

        editorContainer.appendChild(editor);
        this.element.appendChild(editorContainer);
        
        this.editor = editor;
    }

    async handleAIGenerate(prompt, mode) {
        if (!prompt) return;
        
        const btn = mode === 'update' ? this.element.querySelectorAll('button')[0] : this.element.querySelectorAll('button')[1];
        const originalText = btn.textContent;
        btn.textContent = 'Generating...';
        btn.disabled = true;
        
        try {
            let systemPrompt = '';
            let userPrompt = '';
            
            if (mode === 'new') {
                systemPrompt = CODE_FILL_PROMPT.replace('{description}', prompt);
                userPrompt = `Generate a canvas animation code for: ${prompt}`;
            } else {
                systemPrompt = CODE_FILL_UPDATE_PROMPT
                    .replace('{existingCode}', this.editor.value)
                    .replace('{request}', prompt);
                userPrompt = `Update the code to: ${prompt}`;
            }

            // Call AI Service
            const ai = new AIService();
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
    
    destroy() {
        if (this.runner) {
            this.runner.stop();
        }
    }
}
