import { ScrubbableControl } from '../../components/ScrubbableControl.js';
import { SegmentedControl } from '../../components/SegmentedControl.js';
import { ColorInput } from '../../components/ColorInput.js';
import { Button } from '../../components/Button.js';
import { Icons } from '../../Icons.js';
import { aiService } from '../../../core/ai/AIService.js';
import { createControlGroup, createInputRow, updateProperty, updateStyle } from './LegacyUtils.js';

export class LegacyTextSection {
    constructor(container, sectionStates) {
        this.container = container;
        this.sectionStates = sectionStates;
    }

    render(element, selection) {
        const { group, content } = createControlGroup('TEXT', this.sectionStates);
        const style = element.style || {};

        // Content (HTML)
        const contentInput = document.createElement('input');
        contentInput.type = 'text';
        contentInput.style.width = '100%';
        contentInput.style.background = 'var(--color-bg-input)';
        contentInput.style.border = '1px solid var(--color-border)';
        contentInput.style.borderRadius = 'var(--radius-sm)';
        contentInput.style.color = 'var(--color-text-primary)';
        contentInput.style.padding = '4px';
        contentInput.style.fontSize = '11px';
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = element.content;
        contentInput.value = tempDiv.innerText;
        
        contentInput.addEventListener('change', (e) => {
            updateProperty(selection, 'content', `<h2>${e.target.value}</h2>`);
        });
        
        const contentRow = createInputRow('Content', contentInput);
        
        // AI Button
        const aiBtnComponent = new Button({
            icon: '<i class="fa-solid fa-wand-magic-sparkles"></i>',
            variant: 'text',
            size: 'xs',
            title: 'AI Text Refinement'
        });
        const aiBtn = aiBtnComponent.element;
        aiBtn.style.marginLeft = '4px';
        aiBtn.style.position = 'relative'; // For popover positioning
        
        aiBtn.onclick = (e) => {
            e.stopPropagation();
            
            // Remove existing popover if any
            const existing = document.querySelector('.ai-popover');
            if (existing) existing.remove();

            const popover = document.createElement('div');
            popover.className = 'ai-popover';
            popover.style.position = 'absolute';
            popover.style.top = '100%';
            popover.style.right = '0';
            popover.style.width = '160px';
            popover.style.background = 'var(--color-bg-panel)';
            popover.style.border = '1px solid var(--color-border)';
            popover.style.borderRadius = '4px';
            popover.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
            popover.style.zIndex = '1000';
            popover.style.padding = '4px';
            popover.style.display = 'flex';
            popover.style.flexDirection = 'column';
            popover.style.gap = '2px';

            const actions = [
                { label: 'Summarize', prompt: 'Summarize this text into a concise bullet point or sentence.' },
                { label: 'Expand', prompt: 'Expand on this text with more detail and context.' },
                { label: 'Make Professional', prompt: 'Rewrite this text to sound more professional and corporate.' },
                { label: 'Make Witty', prompt: 'Rewrite this text to be more witty and engaging.' },
                { label: 'Translate to Spanish', prompt: 'Translate this text to Spanish.' },
                { label: 'Custom...', custom: true }
            ];

            actions.forEach(action => {
                const btn = document.createElement('button');
                btn.innerText = action.label;
                btn.style.textAlign = 'left';
                btn.style.padding = '6px 8px';
                btn.style.background = 'none';
                btn.style.border = 'none';
                btn.style.color = 'var(--color-text-primary)';
                btn.style.fontSize = '11px';
                btn.style.cursor = 'pointer';
                btn.style.borderRadius = '2px';
                
                btn.onmouseover = () => btn.style.background = 'var(--color-bg-well)';
                btn.onmouseout = () => btn.style.background = 'none';

                btn.onclick = async () => {
                    popover.remove();
                    let instruction = action.prompt;
                    
                    if (action.custom) {
                        instruction = prompt('How should I refine this text?', 'Make it more concise');
                        if (!instruction) return;
                    }

                    try {
                        aiBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                        const currentText = tempDiv.innerText;
                        const newText = await aiService.generate(`${instruction}: "${currentText}"`);
                        // Strip quotes if AI adds them
                        const cleanText = newText.replace(/^"|"$/g, '');
                        updateProperty(selection, 'content', `<h2>${cleanText}</h2>`);
                    } catch (err) {
                        alert(err.message);
                    } finally {
                        aiBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i>';
                    }
                };
                popover.appendChild(btn);
            });

            // Close on click outside
            const closeHandler = (evt) => {
                if (!popover.contains(evt.target) && evt.target !== aiBtn) {
                    popover.remove();
                    document.removeEventListener('click', closeHandler);
                }
            };
            setTimeout(() => document.addEventListener('click', closeHandler), 0);

            aiBtn.appendChild(popover);
        };
        
        contentRow.appendChild(aiBtn);
        content.appendChild(contentRow);

        // Font Family
        const fontRow = document.createElement('div');
        fontRow.style.marginBottom = '8px';
        const fontSelect = document.createElement('select');
        fontSelect.className = 'input-select';
        fontSelect.style.width = '100%';
        fontSelect.style.background = 'var(--color-bg-input)';
        fontSelect.style.border = '1px solid var(--color-border)';
        fontSelect.style.borderRadius = 'var(--radius-sm)';
        fontSelect.style.color = 'var(--color-text-primary)';
        fontSelect.style.padding = '4px';
        fontSelect.style.fontSize = '11px';
        
        ['Inter', 'Roboto', 'Arial', 'Times New Roman', 'Courier New', 'JetBrains Mono'].forEach(font => {
            const option = document.createElement('option');
            option.value = font;
            option.text = font;
            option.selected = (style.fontFamily || 'Inter') === font;
            fontSelect.appendChild(option);
        });
        
        fontSelect.addEventListener('change', (e) => updateStyle(selection, 'fontFamily', e.target.value));
        fontRow.appendChild(fontSelect);
        content.appendChild(fontRow);

        // Weight & Size Row
        const weightSizeRow = document.createElement('div');
        weightSizeRow.style.display = 'flex';
        weightSizeRow.style.gap = '8px';
        weightSizeRow.style.marginBottom = '8px';

        // Weight
        const weightSelect = document.createElement('select');
        weightSelect.className = 'input-select';
        weightSelect.style.flex = '1';
        weightSelect.style.background = 'var(--color-bg-input)';
        weightSelect.style.border = '1px solid var(--color-border)';
        weightSelect.style.borderRadius = 'var(--radius-sm)';
        weightSelect.style.color = 'var(--color-text-primary)';
        weightSelect.style.padding = '4px';
        weightSelect.style.fontSize = '11px';

        const weights = [
            { label: 'Light', value: '300' },
            { label: 'Regular', value: '400' },
            { label: 'Medium', value: '500' },
            { label: 'Bold', value: '700' },
            { label: 'Black', value: '900' }
        ];

        weights.forEach(w => {
            const option = document.createElement('option');
            option.value = w.value;
            option.text = w.label;
            option.selected = (style.fontWeight || '400') === w.value;
            weightSelect.appendChild(option);
        });

        weightSelect.addEventListener('change', (e) => updateStyle(selection, 'fontWeight', e.target.value));
        weightSizeRow.appendChild(weightSelect);

        // Size
        const sizeControl = new ScrubbableControl('Size', style.fontSize || 16, (val) => {
            updateStyle(selection, 'fontSize', Math.max(1, val));
        });
        // Hack to make it fit in the flex row nicely
        sizeControl.element.style.flex = '0 0 60px'; 
        weightSizeRow.appendChild(sizeControl.element);

        content.appendChild(weightSizeRow);

        // Line Height & Letter Spacing Row
        const spacingRow = document.createElement('div');
        spacingRow.style.display = 'flex';
        spacingRow.style.gap = '8px';
        spacingRow.style.marginBottom = '8px';

        // Line Height
        const lhControl = new ScrubbableControl('LH', parseFloat(style.lineHeight) || 1.2, (val) => {
            updateStyle(selection, 'lineHeight', Math.max(0.5, val));
        }, { step: 0.1 });
        spacingRow.appendChild(lhControl.element);

        // Letter Spacing
        const lsControl = new ScrubbableControl('LS', parseFloat(style.letterSpacing) || 0, (val) => {
            updateStyle(selection, 'letterSpacing', val);
        }, { step: 0.1 });
        spacingRow.appendChild(lsControl.element);

        content.appendChild(spacingRow);

        // Alignment Segmented Control
        const alignControl = new SegmentedControl([
            { label: 'L', value: 'left', icon: 'fa-align-left' },
            { label: 'C', value: 'center', icon: 'fa-align-center' },
            { label: 'R', value: 'right', icon: 'fa-align-right' },
            { label: 'J', value: 'justify', icon: 'fa-align-justify' }
        ], style.textAlign || 'left', (val) => {
            updateStyle(selection, 'textAlign', val);
        });
        content.appendChild(alignControl.element);

        // Resizing Segmented Control
        const resizingControl = new SegmentedControl([
            { label: 'Auto Size', value: 'autoSize', icon: 'fa-arrows-left-right' },
            { label: 'Fixed Width', value: 'fixedWidth', icon: 'fa-arrows-up-down' },
            { label: 'Fixed Size', value: 'fixed', icon: 'fa-expand' }
        ], style.resizing || 'fixedWidth', (val) => {
            updateStyle(selection, 'resizing', val);
        });
        content.appendChild(resizingControl.element);

        // Color
        const colorInput = new ColorInput(style.color || '#000000', (val) => {
            updateStyle(selection, 'color', val);
        });
        content.appendChild(createInputRow('Color', colorInput.element));

        this.container.appendChild(group);
    }
}
