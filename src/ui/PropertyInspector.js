import { store } from '../core/Store.js';
import { Knob } from './components/Knob.js';
import { Switch } from './components/Switch.js';
import { SegmentedControl } from './components/SegmentedControl.js';
import { ScrubbableControl } from './components/ScrubbableControl.js';
import { aiService } from '../core/ai/AIService.js';

export class PropertyInspector {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.sectionStates = {}; // Persist section collapse state
        this.init();
    }

    init() {
        this.render();
        store.on('state-changed', () => this.render());
        store.on('selection-changed', () => this.render());
    }

    render() {
        const state = store.getState();
        const selection = state.editor.selectedElementIds;
        const activeSlideId = state.editor.activeSlideId;
        const currentSlide = state.slides[activeSlideId];
        
        this.container.innerHTML = '';

        if (!currentSlide) return;

        if (!selection || selection.length === 0) {
            this.renderSlideProperties(currentSlide);
            return;
        }

        // Get all selected elements
        const elements = selection.map(id => currentSlide.elements[id]).filter(el => el);
        if (elements.length === 0) return;

        // Calculate common properties
        const commonProps = this.getCommonProperties(elements);

        // Render Controls
        this.renderCommonProperties(commonProps, selection);

        // Type specific properties (only if all same type)
        const firstType = elements[0].type;
        const allSameType = elements.every(el => el.type === firstType);

        if (allSameType) {
            if (firstType === 'text') {
                this.renderTextProperties(elements[0], selection);
            } else if (firstType === 'rect') {
                this.renderShapeProperties(elements[0], selection);
            } else if (firstType === 'image') {
                this.renderImageProperties(elements[0], selection);
            }
        }

        // Effects (Shadow) - Only for single selection for now
        if (selection.length === 1) {
            this.renderEffectsProperties(elements[0], selection);
            this.renderAnimationProperties(elements[0], selection);
        }
    }

    renderSlideProperties(slide) {
        const { group, content } = this.createControlGroup('SLIDE', true);
        
        // Dimensions
        const dimRow = document.createElement('div');
        dimRow.style.display = 'flex';
        dimRow.style.gap = 'var(--spacing-2)';
        dimRow.style.marginBottom = 'var(--spacing-3)';
        
        const wControl = new ScrubbableControl('W', slide.width, (val) => {
            store.dispatch('UPDATE_SLIDE', { id: slide.id, width: Math.max(100, val) });
        });
        
        const hControl = new ScrubbableControl('H', slide.height, (val) => {
            store.dispatch('UPDATE_SLIDE', { id: slide.id, height: Math.max(100, val) });
        });
        
        dimRow.appendChild(wControl.element);
        dimRow.appendChild(hControl.element);
        content.appendChild(dimRow);

        // Background
        const bgLabel = document.createElement('div');
        bgLabel.innerText = 'Background';
        bgLabel.style.fontSize = 'var(--font-size-xs)';
        bgLabel.style.color = 'var(--color-text-secondary)';
        bgLabel.style.marginBottom = 'var(--spacing-2)';
        content.appendChild(bgLabel);

        const bgTypeSelect = document.createElement('select');
        bgTypeSelect.className = 'input-select';
        bgTypeSelect.style.width = '100%';
        bgTypeSelect.style.marginBottom = 'var(--spacing-2)';
        bgTypeSelect.style.background = 'var(--color-bg-input)';
        bgTypeSelect.style.border = '1px solid var(--color-border)';
        bgTypeSelect.style.borderRadius = 'var(--radius-sm)';
        bgTypeSelect.style.color = 'var(--color-text-primary)';
        bgTypeSelect.style.padding = '4px';
        bgTypeSelect.style.fontSize = '11px';
        
        ['Solid', 'Gradient', 'Code'].forEach(type => {
            const opt = document.createElement('option');
            opt.value = type.toLowerCase();
            opt.text = type;
            if (slide.background.type === type.toLowerCase()) opt.selected = true;
            bgTypeSelect.appendChild(opt);
        });
        
        bgTypeSelect.onchange = (e) => {
            const newType = e.target.value;
            let newValue = slide.background.value;
            
            if (newType === 'gradient' && !newValue.includes('gradient')) {
                newValue = 'linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%)';
            } else if (newType === 'solid' && newValue.includes('gradient')) {
                newValue = '#ffffff';
            } else if (newType === 'code') {
                // Default Pastel Mesh Gradient
                newValue = `
return {
    draw: function(t) {
        const w = canvas.width;
        const h = canvas.height;
        const grd = ctx.createLinearGradient(0, 0, w, h);
        const c1 = Math.sin(t * 0.5) * 50 + 200;
        const c2 = Math.cos(t * 0.3) * 50 + 200;
        grd.addColorStop(0, \`rgb(\${c1}, 200, 255)\`);
        grd.addColorStop(1, \`rgb(255, \${c2}, 200)\`);
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, w, h);
        for(let i=0; i<5; i++) {
            const x = (Math.sin(t * 0.2 + i) * 0.5 + 0.5) * w;
            const y = (Math.cos(t * 0.3 + i) * 0.5 + 0.5) * h;
            const r = 100 + Math.sin(t + i) * 50;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = \`rgba(255, 255, 255, 0.2)\`;
            ctx.fill();
        }
    }
};`.trim();
            }
            store.dispatch('UPDATE_SLIDE', { id: slide.id, background: { type: newType, value: newValue } });
        };
        content.appendChild(bgTypeSelect);

        if (slide.background.type === 'solid') {
            const colorInput = document.createElement('input');
            colorInput.type = 'color';
            colorInput.value = slide.background.value;
            colorInput.style.width = '100%';
            colorInput.style.height = '24px';
            colorInput.style.border = 'none';
            colorInput.style.padding = '0';
            colorInput.style.cursor = 'pointer';
            
            colorInput.onchange = (e) => {
                store.dispatch('UPDATE_SLIDE', { id: slide.id, background: { type: 'solid', value: e.target.value } });
            };
            content.appendChild(colorInput);
        } else if (slide.background.type === 'gradient') {
            // Simple Gradient Input (Text for now, could be enhanced)
            const gradientInput = document.createElement('input');
            gradientInput.type = 'text';
            gradientInput.value = slide.background.value;
            gradientInput.style.width = '100%';
            gradientInput.style.background = 'var(--color-bg-input)';
            gradientInput.style.border = '1px solid var(--color-border)';
            gradientInput.style.borderRadius = 'var(--radius-sm)';
            gradientInput.style.color = 'var(--color-text-primary)';
            gradientInput.style.padding = '4px';
            gradientInput.style.fontSize = '11px';
            gradientInput.className = 'settings-input';
            
            gradientInput.onchange = (e) => {
                store.dispatch('UPDATE_SLIDE', { id: slide.id, background: { type: 'gradient', value: e.target.value } });
            };
            content.appendChild(gradientInput);
        } else if (slide.background.type === 'code') {
            // Code Editor for Slide Background
            const codeContainer = document.createElement('div');
            codeContainer.style.marginBottom = '8px';
            
            // AI Chat Interface
            const aiContainer = document.createElement('div');
            aiContainer.style.marginBottom = 'var(--spacing-2)';
            aiContainer.style.background = 'var(--color-bg-well)';
            aiContainer.style.padding = 'var(--spacing-2)';
            aiContainer.style.borderRadius = 'var(--radius-md)';
            aiContainer.style.border = '1px solid var(--color-border)';
            
            const aiLabel = document.createElement('div');
            aiLabel.innerText = 'AI Generator';
            aiLabel.style.fontSize = 'var(--font-size-xs)';
            aiLabel.style.fontWeight = 'var(--font-weight-bold)';
            aiLabel.style.marginBottom = 'var(--spacing-1)';
            aiLabel.style.color = 'var(--color-text-secondary)';
            
            const promptInput = document.createElement('textarea');
            promptInput.placeholder = 'Describe an animation...';
            promptInput.style.width = '100%';
            promptInput.style.height = '60px';
            promptInput.style.background = 'var(--color-bg-input)';
            promptInput.style.border = '1px solid var(--color-border)';
            promptInput.style.color = 'var(--color-text-primary)';
            promptInput.style.fontSize = 'var(--font-size-sm)';
            promptInput.style.padding = 'var(--spacing-2)';
            promptInput.style.resize = 'none';
            promptInput.style.marginBottom = 'var(--spacing-2)';
            promptInput.style.borderRadius = 'var(--radius-sm)';
            promptInput.style.fontFamily = 'var(--font-sans)';

            // Buttons Row
            const btnRow = document.createElement('div');
            btnRow.style.display = 'flex';
            btnRow.style.gap = 'var(--spacing-2)';
            btnRow.style.marginBottom = 'var(--spacing-2)';

            const newBtn = document.createElement('button');
            newBtn.className = 'btn-secondary';
            newBtn.innerText = 'New';
            newBtn.style.flex = '1';
            newBtn.style.fontSize = 'var(--font-size-xs)';
            newBtn.style.padding = '4px 8px';
            
            const updateBtn = document.createElement('button');
            updateBtn.className = 'btn-primary';
            updateBtn.innerText = 'Update';
            updateBtn.style.flex = '1';
            updateBtn.style.fontSize = 'var(--font-size-xs)';
            updateBtn.style.padding = '4px 8px';

            btnRow.appendChild(newBtn);
            btnRow.appendChild(updateBtn);
            
            const handleGenerate = async (isReplace) => {
                const promptText = promptInput.value.trim();
                if (!promptText) return;
                
                const activeBtn = isReplace ? newBtn : updateBtn;
                const originalText = activeBtn.innerText;
                
                try {
                    newBtn.disabled = true;
                    updateBtn.disabled = true;
                    activeBtn.innerText = '...';
                    
                    const currentCode = isReplace ? '' : (slide.background.value || '');
                    
                    let systemPrompt = `You are an expert HTML5 Canvas artist. 
                    Generate a JavaScript object with a 'draw(time)' function. 
                    Context: 'ctx' is the 2D context, 'canvas' is the DOM element.
                    ALWAYS use 'canvas.width' and 'canvas.height' for dimensions.
                    Time 't' is passed to draw().
                    Return ONLY the code for the object. No markdown.`;

                    if (!isReplace && currentCode) {
                        systemPrompt += `\nIf code already exists, modify it based on the user request.\nExisting Code: ${currentCode}`;
                    } else {
                        systemPrompt += `\nCreate a new effect from scratch.`;
                    }
                    
                    const newCode = await aiService.generate(promptText, { systemPrompt });
                    let cleanCode = newCode.replace(/```javascript|```/g, '').trim();
                    
                    store.dispatch('UPDATE_SLIDE', { id: slide.id, background: { type: 'code', value: cleanCode } });
                    textarea.value = cleanCode;
                    promptInput.value = '';
                    
                } catch (err) {
                    alert('AI Error: ' + err.message);
                } finally {
                    newBtn.disabled = false;
                    updateBtn.disabled = false;
                    activeBtn.innerText = originalText;
                }
            };

            newBtn.onclick = () => handleGenerate(true);
            updateBtn.onclick = () => handleGenerate(false);
            
            aiContainer.appendChild(aiLabel);
            aiContainer.appendChild(promptInput);
            aiContainer.appendChild(btnRow);
            codeContainer.appendChild(aiContainer);
            
            const textarea = document.createElement('textarea');
            textarea.value = slide.background.value || '';
            textarea.style.width = '100%';
            textarea.style.height = '200px';
            textarea.style.background = 'var(--color-bg-input)';
            textarea.style.color = 'var(--color-text-primary)';
            textarea.style.border = '1px solid var(--color-border)';
            textarea.style.borderRadius = 'var(--radius-sm)';
            textarea.style.fontSize = '11px';
            textarea.style.fontFamily = 'var(--font-mono)';
            textarea.style.padding = '8px';
            textarea.spellcheck = false;
            
            textarea.onchange = (e) => {
                store.dispatch('UPDATE_SLIDE', { id: slide.id, background: { type: 'code', value: e.target.value } });
            };
            
            codeContainer.appendChild(textarea);
            content.appendChild(codeContainer);
        }

        this.container.appendChild(group);
    }

    getCommonProperties(elements) {
        const props = {};
        // Add all potential properties
        const keys = ['x', 'y', 'width', 'height', 'rotation', 'opacity', 'fontFamily', 'fontSize', 'fontWeight', 'textAlign', 'color', 'backgroundColor', 'cornerRadius'];
        
        keys.forEach(key => {
            const firstVal = this.getPropertyValue(elements[0], key);
            const allSame = elements.every(el => this.getPropertyValue(el, key) === firstVal);
            props[key] = allSame ? firstVal : 'Mixed';
        });
        
        return props;
    }

    getPropertyValue(el, key) {
        if (key in el) return el[key];
        if (el.style && key in el.style) return el.style[key];
        return undefined;
    }

    renderEmptyState() {
        const div = document.createElement('div');
        div.className = 'empty-state';
        div.innerText = 'No selection';
        div.style.padding = '16px';
        div.style.color = 'var(--color-text-secondary)';
        div.style.textAlign = 'center';
        this.container.appendChild(div);
    }

    createControlGroup(title, defaultOpen = true) {
        const group = document.createElement('div');
        group.className = 'panel-section';
        
        // Determine open state
        const isOpen = this.sectionStates[title] !== undefined ? this.sectionStates[title] : defaultOpen;

        const header = document.createElement('div');
        header.className = 'section-header';
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.cursor = 'pointer';
        header.style.marginBottom = '8px';
        header.style.userSelect = 'none';

        const icon = document.createElement('i');
        icon.className = `fa-solid fa-chevron-${isOpen ? 'down' : 'right'}`;
        icon.style.fontSize = '10px';
        icon.style.width = '16px';
        icon.style.color = 'var(--color-text-secondary)';
        
        const label = document.createElement('div');
        label.className = 'section-title';
        label.innerText = title;
        label.style.marginBottom = '0'; // Override default
        label.style.flex = '1';
        
        header.appendChild(icon);
        header.appendChild(label);
        
        const content = document.createElement('div');
        content.style.display = isOpen ? 'block' : 'none';
        
        header.onclick = () => {
            const wasOpen = content.style.display !== 'none';
            const nowOpen = !wasOpen;
            content.style.display = nowOpen ? 'block' : 'none';
            icon.className = `fa-solid fa-chevron-${nowOpen ? 'down' : 'right'}`;
            this.sectionStates[title] = nowOpen;
        };

        group.appendChild(header);
        group.appendChild(content);
        
        // Return content container so we append controls there
        return { group, content };
    }

    createInputRow(label, input) {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.marginBottom = '8px';
        
        const labelEl = document.createElement('label');
        labelEl.innerText = label;
        labelEl.style.width = '80px';
        labelEl.style.fontSize = '11px';
        labelEl.style.color = 'var(--color-text-secondary)';
        
        row.appendChild(labelEl);
        row.appendChild(input);
        return row;
    }

    updateProperty(ids, key, value) {
        const idArray = Array.isArray(ids) ? ids : [ids];
        idArray.forEach(id => {
            store.dispatch('UPDATE_ELEMENT', { id, [key]: value });
        });
    }

    updateStyle(ids, key, value) {
        const idArray = Array.isArray(ids) ? ids : [ids];
        const state = store.getState();
        const slide = state.slides[state.editor.activeSlideId];
        
        idArray.forEach(id => {
            const el = slide.elements[id];
            if (el) {
                const newStyle = { ...el.style, [key]: value };
                store.dispatch('UPDATE_ELEMENT', { id, style: newStyle });
            }
        });
    }

    renderCommonProperties(props, selection) {
        // Alignment Row
        const alignRow = document.createElement('div');
        alignRow.style.display = 'flex';
        alignRow.style.justifyContent = 'space-between';
        alignRow.style.marginBottom = '8px';
        alignRow.style.padding = '0 4px';

        const aligns = [
            { icon: 'fa-align-left', action: 'left', title: 'Align Left' },
            { icon: 'fa-align-center', action: 'center', title: 'Align Center' },
            { icon: 'fa-align-right', action: 'right', title: 'Align Right' },
            { icon: 'fa-align-left', action: 'top', title: 'Align Top', rotate: 90 },
            { icon: 'fa-align-center', action: 'middle', title: 'Align Middle', rotate: 90 },
            { icon: 'fa-align-right', action: 'bottom', title: 'Align Bottom', rotate: 90 }
        ];

        aligns.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'icon-btn';
            btn.style.width = '24px';
            btn.style.height = '24px';
            btn.title = item.title;
            btn.innerHTML = `<i class="fa-solid ${item.icon}" style="${item.rotate ? `transform: rotate(${item.rotate}deg)` : ''}"></i>`;
            btn.onclick = () => store.dispatch('ALIGN_ELEMENTS', item.action);
            alignRow.appendChild(btn);
        });

        this.container.appendChild(alignRow);

        // Distribution Row (Only if > 2 elements)
        if (selection.length > 2) {
            const distRow = document.createElement('div');
            distRow.style.display = 'flex';
            distRow.style.justifyContent = 'center';
            distRow.style.gap = '8px';
            distRow.style.marginBottom = '16px';
            
            const dists = [
                { icon: 'fa-grip-lines-vertical', action: 'horizontal', title: 'Distribute Horizontal Spacing' },
                { icon: 'fa-grip-lines', action: 'vertical', title: 'Distribute Vertical Spacing' }
            ];

            dists.forEach(item => {
                const btn = document.createElement('button');
                btn.className = 'icon-btn';
                btn.style.width = '24px';
                btn.style.height = '24px';
                btn.title = item.title;
                btn.innerHTML = `<i class="fa-solid ${item.icon}"></i>`;
                btn.onclick = () => store.dispatch('DISTRIBUTE_ELEMENTS', item.action);
                distRow.appendChild(btn);
            });
            
            this.container.appendChild(distRow);
        } else {
            alignRow.style.marginBottom = '16px';
        }

        const { group, content } = this.createControlGroup('TRANSFORM');
        
        // Position Row (X, Y)
        const posRow = document.createElement('div');
        posRow.style.display = 'flex';
        posRow.style.gap = '8px';
        posRow.style.marginBottom = '8px';

        // X Position
        const xControl = new ScrubbableControl('X', props.x, (val) => {
            this.updateProperty(selection, 'x', val);
        });
        posRow.appendChild(xControl.element);

        // Y Position
        const yControl = new ScrubbableControl('Y', props.y, (val) => {
            this.updateProperty(selection, 'y', val);
        });
        posRow.appendChild(yControl.element);

        content.appendChild(posRow);

        // Size Row (W, H)
        const sizeRow = document.createElement('div');
        sizeRow.style.display = 'flex';
        sizeRow.style.gap = '8px';
        sizeRow.style.marginBottom = '8px';

        // Width
        const wControl = new ScrubbableControl('W', props.width, (val) => {
            this.updateProperty(selection, 'width', Math.max(1, val));
        }, { min: 1 });
        sizeRow.appendChild(wControl.element);

        // Height
        const hControl = new ScrubbableControl('H', props.height, (val) => {
            this.updateProperty(selection, 'height', Math.max(1, val));
        }, { min: 1 });
        sizeRow.appendChild(hControl.element);

        content.appendChild(sizeRow);

        // Rotation & Radius Row
        const rotRow = document.createElement('div');
        rotRow.style.display = 'flex';
        rotRow.style.gap = '8px';
        rotRow.style.marginBottom = '8px';
        
        const rotControl = new ScrubbableControl('°', props.rotation, (val) => {
            this.updateProperty(selection, 'rotation', val % 360);
        });
        rotRow.appendChild(rotControl.element);
        
        // Corner Radius (Common for all)
        const radiusControl = new ScrubbableControl('R', props.cornerRadius || 0, (val) => {
            this.updateStyle(selection, 'radius', Math.max(0, val));
        });
        rotRow.appendChild(radiusControl.element);

        content.appendChild(rotRow);

        this.container.appendChild(group);
    }

    createLabelInputPair(labelText, inputElement) {
        const wrapper = document.createElement('div');
        wrapper.style.flex = '1';
        const label = document.createElement('div');
        label.innerText = labelText;
        label.style.fontSize = '10px';
        label.style.color = 'var(--color-text-secondary)';
        wrapper.appendChild(label);
        wrapper.appendChild(inputElement);
        return wrapper;
    }

    renderTextProperties(element, selection) {
        const { group, content } = this.createControlGroup('TEXT');
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
            this.updateProperty(selection, 'content', `<h2>${e.target.value}</h2>`);
        });
        
        const contentRow = this.createInputRow('Content', contentInput);
        
        // AI Button
        const aiBtn = document.createElement('button');
        aiBtn.className = 'icon-btn';
        aiBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i>';
        aiBtn.title = 'AI Text Refinement';
        aiBtn.style.marginLeft = '4px';
        aiBtn.style.width = '24px';
        aiBtn.style.height = '24px';
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
                        this.updateProperty(selection, 'content', `<h2>${cleanText}</h2>`);
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
        
        fontSelect.addEventListener('change', (e) => this.updateStyle(selection, 'fontFamily', e.target.value));
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

        weightSelect.addEventListener('change', (e) => this.updateStyle(selection, 'fontWeight', e.target.value));
        weightSizeRow.appendChild(weightSelect);

        // Size
        const sizeControl = new ScrubbableControl('Size', style.fontSize || 16, (val) => {
            this.updateStyle(selection, 'fontSize', Math.max(1, val));
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
            this.updateStyle(selection, 'lineHeight', Math.max(0.5, val));
        }, { step: 0.1 });
        spacingRow.appendChild(lhControl.element);

        // Letter Spacing
        const lsControl = new ScrubbableControl('LS', parseFloat(style.letterSpacing) || 0, (val) => {
            this.updateStyle(selection, 'letterSpacing', val);
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
            this.updateStyle(selection, 'textAlign', val);
        });
        content.appendChild(alignControl.element);

        // Resizing Segmented Control
        const resizingControl = new SegmentedControl([
            { label: 'Auto Width', value: 'autoWidth', icon: 'fa-arrows-left-right' },
            { label: 'Auto Height', value: 'autoHeight', icon: 'fa-arrows-up-down' },
            { label: 'Fixed Size', value: 'fixed', icon: 'fa-expand' }
        ], style.resizing || 'autoHeight', (val) => {
            this.updateStyle(selection, 'resizing', val);
        });
        content.appendChild(resizingControl.element);

        // Color
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = style.color || '#000000';
        colorInput.addEventListener('change', (e) => this.updateStyle(selection, 'color', e.target.value));
        content.appendChild(this.createInputRow('Color', colorInput));

        this.container.appendChild(group);
    }

    renderShapeProperties(element, selection) {
        const { group, content } = this.createControlGroup('STYLE');
        const style = element.style || {};

        // Fill Section
        const fillHeader = document.createElement('div');
        fillHeader.style.display = 'flex';
        fillHeader.style.justifyContent = 'space-between';
        fillHeader.style.alignItems = 'center';
        fillHeader.style.marginBottom = '8px';

        const fillLabel = document.createElement('span');
        fillLabel.textContent = 'Fill';
        fillLabel.style.fontSize = '11px';
        fillLabel.style.color = 'var(--color-text-secondary)';
        fillHeader.appendChild(fillLabel);

        // Fill Type Dropdown (Solid / Gradient)
        const fillTypeSelect = document.createElement('select');
        fillTypeSelect.className = 'input-select';
        fillTypeSelect.style.background = 'var(--color-bg-panel)';
        fillTypeSelect.style.border = 'none';
        fillTypeSelect.style.color = 'var(--color-text-primary)';
        fillTypeSelect.style.fontSize = '11px';
        fillTypeSelect.style.textAlign = 'right';
        fillTypeSelect.style.cursor = 'pointer';
        fillTypeSelect.style.appearance = 'none'; // Remove default arrow
        fillTypeSelect.style.paddingRight = '0';

        ['Solid', 'Gradient', 'Image', 'Mesh', 'Code'].forEach(type => {
            const opt = document.createElement('option');
            opt.value = type.toLowerCase();
            opt.text = type;
            opt.selected = (style.fillType || 'solid') === type.toLowerCase();
            fillTypeSelect.appendChild(opt);
        });

        fillTypeSelect.addEventListener('change', (e) => {
            const newType = e.target.value;
            const updates = { fillType: newType };
            
            if (newType === 'gradient') {
                // Initialize or Restore Gradient
                if (style.gradientStops) {
                    // Restore from existing state
                    const angle = style.gradientAngle !== undefined ? style.gradientAngle : 180;
                    const type = style.gradientType || 'linear';
                    const stops = style.gradientStops;
                    const stopsString = stops.map(s => `${s.color} ${s.position}%`).join(', ');
                    
                    let gradientString = '';
                    if (type === 'linear') gradientString = `linear-gradient(${angle}deg, ${stopsString})`;
                    else if (type === 'radial') gradientString = `radial-gradient(circle, ${stopsString})`;
                    else if (type === 'conic') gradientString = `conic-gradient(from ${angle}deg, ${stopsString})`;
                    
                    updates.fillValue = gradientString;
                } else {
                    // Set default gradient
                    updates.fillValue = `linear-gradient(180deg, ${style.backgroundColor || '#D9D9D9'} 0%, #000000 100%)`;
                    updates.gradientAngle = 180;
                    updates.gradientStops = [
                        { color: style.backgroundColor || '#D9D9D9', position: 0 },
                        { color: '#000000', position: 100 }
                    ];
                }
            } else if (newType === 'image' && !style.fillValue) {
                // No default image, user must select
                updates.fillScaleMode = 'cover';
            } else if (newType === 'mesh' && !style.meshColors) {
                updates.meshColors = ['#18A0FB', '#F24822', '#1BC47D', '#FF0080']; // Blue, Red, Green, Pink
            } else if (newType === 'code' && !style.code) {
                updates.code = `
return {
    draw: function(t) {
        const w = canvas.width;
        const h = canvas.height;
        const grd = ctx.createLinearGradient(0, 0, w, h);
        const c1 = Math.sin(t * 0.5) * 50 + 200;
        const c2 = Math.cos(t * 0.3) * 50 + 200;
        grd.addColorStop(0, \`rgb(\${c1}, 200, 255)\`);
        grd.addColorStop(1, \`rgb(255, \${c2}, 200)\`);
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, w, h);
        for(let i=0; i<5; i++) {
            const x = (Math.sin(t * 0.2 + i) * 0.5 + 0.5) * w;
            const y = (Math.cos(t * 0.3 + i) * 0.5 + 0.5) * h;
            const r = 100 + Math.sin(t + i) * 50;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = \`rgba(255, 255, 255, 0.2)\`;
            ctx.fill();
        }
    }
};`.trim();
            }

            this.updateStyle(selection, 'fillType', newType); // This will trigger re-render
            
            // Dispatch updates for all selected elements
            selection.forEach(id => {
                const state = store.getState();
                const slide = state.slides[state.editor.activeSlideId];
                const el = slide.elements[id];
                if (el) {
                    const newStyle = { ...el.style, ...updates };
                    store.dispatch('UPDATE_ELEMENT', { id, style: newStyle });
                }
            });
        });

        fillHeader.appendChild(fillTypeSelect);
        content.appendChild(fillHeader);

        // Fill Controls based on Type
        if (style.fillType === 'gradient') {
            // Gradient Type Selector
            const typeRow = document.createElement('div');
            typeRow.style.display = 'flex';
            typeRow.style.marginBottom = '8px';
            
            const typeSelect = document.createElement('select');
            typeSelect.className = 'input-select';
            typeSelect.style.width = '100%';
            typeSelect.style.background = 'var(--color-bg-input)';
            typeSelect.style.border = '1px solid var(--color-border)';
            typeSelect.style.borderRadius = 'var(--radius-sm)';
            typeSelect.style.padding = '4px';
            typeSelect.style.color = 'var(--color-text-primary)';
            
            ['Linear', 'Radial', 'Conic'].forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.toLowerCase();
                opt.innerText = t;
                if ((style.gradientType || 'linear') === t.toLowerCase()) opt.selected = true;
                typeSelect.appendChild(opt);
            });
            
            typeSelect.onchange = (e) => {
                this.updateGradient(selection, { type: e.target.value });
            };
            
            typeRow.appendChild(typeSelect);
            content.appendChild(typeRow);

            // Angle (Only for Linear and Conic)
            if (!style.gradientType || style.gradientType === 'linear' || style.gradientType === 'conic') {
                const angleRow = document.createElement('div');
                angleRow.style.marginBottom = '8px';
                const angleControl = new ScrubbableControl('Angle', style.gradientAngle !== undefined ? style.gradientAngle : 180, (val) => {
                    const angle = Math.round(val) % 360;
                    this.updateGradient(selection, { angle });
                });
                angleRow.appendChild(angleControl.element);
                content.appendChild(angleRow);
            }

            // 2. Stops (Simplified: Start & End)
            const stops = style.gradientStops || [
                { color: '#D9D9D9', position: 0 },
                { color: '#000000', position: 100 }
            ];

            const stopsRow = document.createElement('div');
            stopsRow.style.display = 'flex';
            stopsRow.style.justifyContent = 'space-between';
            stopsRow.style.marginBottom = '8px';

            stops.forEach((stop, index) => {
                const stopContainer = document.createElement('div');
                stopContainer.style.display = 'flex';
                stopContainer.style.alignItems = 'center';
                stopContainer.style.gap = '4px';

                const colorInput = document.createElement('input');
                colorInput.type = 'color';
                colorInput.value = stop.color;
                colorInput.style.width = '20px';
                colorInput.style.height = '20px';
                colorInput.style.border = 'none';
                colorInput.style.padding = '0';
                colorInput.style.background = 'none';
                colorInput.style.cursor = 'pointer';

                const updateStopColor = (e) => {
                    const newStops = [...stops];
                    newStops[index] = { ...newStops[index], color: e.target.value };
                    this.updateGradient(selection, { stops: newStops });
                };

                colorInput.addEventListener('input', updateStopColor);
                colorInput.addEventListener('change', updateStopColor); // Fallback

                stopContainer.appendChild(colorInput);
                
                // Label (0% or 100%)
                const label = document.createElement('span');
                label.innerText = `${stop.position}%`;
                label.style.fontSize = '10px';
                label.style.color = 'var(--color-text-secondary)';
                stopContainer.appendChild(label);

                stopsRow.appendChild(stopContainer);
            });
            content.appendChild(stopsRow);

        } else if (style.fillType === 'image') {
            // Image Fill Controls
            const imgRow = document.createElement('div');
            imgRow.style.display = 'flex';
            imgRow.style.flexDirection = 'column';
            imgRow.style.gap = '8px';
            imgRow.style.marginBottom = '8px';

            // Choose Image Button
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.style.display = 'none';
            fileInput.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        this.updateStyle(selection, 'fillValue', evt.target.result);
                    };
                    reader.readAsDataURL(file);
                }
            };

            const btn = document.createElement('button');
            btn.innerText = 'Choose Image...';
            btn.style.width = '100%';
            btn.style.padding = '6px';
            btn.style.background = 'var(--color-bg-input)';
            btn.style.border = '1px solid var(--color-border)';
            btn.style.color = 'var(--color-text-primary)';
            btn.style.cursor = 'pointer';
            btn.style.fontSize = '11px';
            btn.style.borderRadius = 'var(--radius-sm)';
            btn.onclick = () => fileInput.click();

            imgRow.appendChild(fileInput);
            imgRow.appendChild(btn);

            // Scale Mode
            const scaleSelect = document.createElement('select');
            scaleSelect.className = 'input-select';
            scaleSelect.style.width = '100%';
            scaleSelect.style.background = 'var(--color-bg-input)';
            scaleSelect.style.border = '1px solid var(--color-border)';
            scaleSelect.style.borderRadius = 'var(--radius-sm)';
            scaleSelect.style.color = 'var(--color-text-primary)';
            scaleSelect.style.padding = '4px';
            scaleSelect.style.fontSize = '11px';

            ['Cover', 'Contain', 'Auto'].forEach(mode => {
                const opt = document.createElement('option');
                opt.value = mode.toLowerCase();
                opt.text = mode;
                opt.selected = (style.fillScaleMode || 'cover') === mode.toLowerCase();
                scaleSelect.appendChild(opt);
            });

            scaleSelect.addEventListener('change', (e) => this.updateStyle(selection, 'fillScaleMode', e.target.value));
            imgRow.appendChild(scaleSelect);

            content.appendChild(imgRow);

        } else if (style.fillType === 'mesh') {
            // Mesh Controls (4 Colors)
            const meshRow = document.createElement('div');
            meshRow.style.display = 'grid';
            meshRow.style.gridTemplateColumns = '1fr 1fr';
            meshRow.style.gap = '8px';
            meshRow.style.marginBottom = '8px';

            const colors = style.meshColors || ['#18A0FB', '#F24822', '#1BC47D', '#FF0080'];

            colors.forEach((color, index) => {
                const colorInput = document.createElement('input');
                colorInput.type = 'color';
                colorInput.value = color;
                colorInput.style.width = '100%';
                colorInput.style.height = '24px';
                colorInput.style.border = 'none';
                colorInput.style.padding = '0';
                colorInput.style.background = 'none';
                colorInput.style.cursor = 'pointer';
                
                colorInput.addEventListener('change', (e) => {
                    const newColors = [...colors];
                    newColors[index] = e.target.value;
                    this.updateStyle(selection, 'meshColors', newColors);
                });
                
                meshRow.appendChild(colorInput);
            });
            
            content.appendChild(meshRow);

        } else if (style.fillType === 'code') {
            // Code Editor
            const codeContainer = document.createElement('div');
            codeContainer.style.marginBottom = '8px';
            
            // AI Chat Interface
            const aiContainer = document.createElement('div');
            aiContainer.style.marginBottom = '8px';
            aiContainer.style.background = 'var(--color-bg-well)';
            aiContainer.style.padding = '8px';
            aiContainer.style.borderRadius = '4px';
            aiContainer.style.border = '1px solid var(--color-border)';
            
            const aiLabel = document.createElement('div');
            aiLabel.innerText = 'AI Generator';
            aiLabel.style.fontSize = '10px';
            aiLabel.style.fontWeight = '600';
            aiLabel.style.marginBottom = '4px';
            aiLabel.style.color = 'var(--color-text-secondary)';
            
            const promptInput = document.createElement('textarea');
            promptInput.placeholder = 'Describe an animation (e.g. "Retro synthwave grid moving forward")...';
            promptInput.style.width = '100%';
            promptInput.style.height = '60px';
            promptInput.style.background = 'var(--color-bg-input)';
            promptInput.style.border = '1px solid var(--color-border)';
            promptInput.style.color = 'var(--color-text-primary)';
            promptInput.style.fontSize = '11px';
            promptInput.style.padding = '8px';
            promptInput.style.resize = 'none';
            promptInput.style.marginBottom = '4px';
            promptInput.style.borderRadius = 'var(--radius-sm)';
            promptInput.style.fontFamily = 'var(--font-sans)';

            // Buttons Row
            const btnRow = document.createElement('div');
            btnRow.style.display = 'flex';
            btnRow.style.gap = '8px';
            btnRow.style.marginBottom = '8px';

            const newBtn = document.createElement('button');
            newBtn.className = 'btn-secondary';
            newBtn.innerText = 'New';
            newBtn.style.flex = '1';
            newBtn.style.fontSize = '11px';
            newBtn.style.padding = '4px 8px';
            
            const updateBtn = document.createElement('button');
            updateBtn.className = 'btn-primary';
            updateBtn.innerText = 'Update';
            updateBtn.style.flex = '1';
            updateBtn.style.fontSize = '11px';
            updateBtn.style.padding = '4px 8px';

            btnRow.appendChild(newBtn);
            btnRow.appendChild(updateBtn);
            
            const handleGenerate = async (isReplace) => {
                const promptText = promptInput.value.trim();
                if (!promptText) return;
                
                const activeBtn = isReplace ? newBtn : updateBtn;
                const originalText = activeBtn.innerText;
                
                try {
                    newBtn.disabled = true;
                    updateBtn.disabled = true;
                    activeBtn.innerText = '...';
                    
                    const currentCode = isReplace ? '' : (style.code || '');
                    
                    let systemPrompt = `You are an expert HTML5 Canvas artist. 
                    Generate a JavaScript object with a 'draw(time)' function. 
                    Context: 'ctx' is the 2D context, 'canvas' is the DOM element.
                    ALWAYS use 'canvas.width' and 'canvas.height' for dimensions to support resizing.
                    Mouse interaction: Use 'canvas.mouseX' and 'canvas.mouseY' for coordinates, and 'canvas.isMouseDown' for click state. DO NOT add event listeners.
                    Time 't' is passed to draw().
                    Return ONLY the code for the object. No markdown.`;

                    if (!isReplace && currentCode) {
                        systemPrompt += `\nIf code already exists, modify it based on the user request.\nExisting Code: ${currentCode}`;
                    } else {
                        systemPrompt += `\nCreate a new effect from scratch.`;
                    }
                    
                    const newCode = await aiService.generate(promptText, { systemPrompt });
                    
                    // Clean up code (remove markdown blocks if any)
                    let cleanCode = newCode.replace(/```javascript|```/g, '').trim();
                    
                    this.updateStyle(selection, 'code', cleanCode);
                    textarea.value = cleanCode; // Update editor
                    promptInput.value = ''; // Clear prompt
                    
                } catch (err) {
                    alert('AI Error: ' + err.message);
                } finally {
                    newBtn.disabled = false;
                    updateBtn.disabled = false;
                    activeBtn.innerText = originalText;
                }
            };

            newBtn.onclick = () => handleGenerate(true);
            updateBtn.onclick = () => handleGenerate(false);
            
            aiContainer.appendChild(aiLabel);
            aiContainer.appendChild(promptInput);
            aiContainer.appendChild(btnRow);
            codeContainer.appendChild(aiContainer);
            
            const textarea = document.createElement('textarea');
            // Default pastel mesh gradient animation if code is empty
            const defaultCode = `
return {
    draw: function(t) {
        // Pastel Mesh Gradient
        const w = canvas.width;
        const h = canvas.height;
        
        // Create gradient
        const grd = ctx.createLinearGradient(0, 0, w, h);
        
        // Animated stops
        const c1 = Math.sin(t * 0.5) * 50 + 200; // 150-250
        const c2 = Math.cos(t * 0.3) * 50 + 200;
        
        grd.addColorStop(0, \`rgb(\${c1}, 200, 255)\`);
        grd.addColorStop(1, \`rgb(255, \${c2}, 200)\`);
        
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, w, h);
        
        // Floating circles
        for(let i=0; i<5; i++) {
            const x = (Math.sin(t * 0.2 + i) * 0.5 + 0.5) * w;
            const y = (Math.cos(t * 0.3 + i) * 0.5 + 0.5) * h;
            const r = 100 + Math.sin(t + i) * 50;
            
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = \`rgba(255, 255, 255, 0.2)\`;
            ctx.fill();
        }
    }
};`;
            
            if (!style.code) {
                // If no code exists, set default but don't save it yet unless user edits?
                // Or maybe we should save it immediately so it renders?
                // Let's just show it in textarea, and if they switch type it might be lost if not saved.
                // Better to save it if they explicitly chose 'code' type.
                // But here we are just rendering the inspector.
                // If style.code is empty, we can show default in textarea.
                textarea.value = defaultCode.trim();
                // Also trigger update so it renders immediately?
                // This might cause infinite loop if not careful.
                // Let's just set the value. If they click away, it won't save unless we bind change.
            } else {
                textarea.value = style.code;
            }

            textarea.style.width = '100%';
            textarea.style.height = '200px';
            textarea.style.background = 'var(--color-bg-input)';
            textarea.style.color = 'var(--color-text-primary)';
            textarea.style.border = '1px solid var(--color-border)';
            textarea.style.borderRadius = 'var(--radius-sm)';
            textarea.style.fontSize = '11px';
            textarea.style.fontFamily = 'var(--font-mono)';
            textarea.style.padding = '8px';
            textarea.spellcheck = false;

            // If we just switched to code type and it's empty, save the default immediately so it renders
            if (style.fillType === 'code' && !style.code) {
                setTimeout(() => {
                    this.updateStyle(selection, 'code', defaultCode.trim());
                }, 0);
            }

            textarea.onchange = (e) => {
                this.updateStyle(selection, 'code', e.target.value);
            };
            textarea.style.border = '1px solid var(--color-border)';
            textarea.style.fontFamily = 'var(--font-mono)';
            textarea.style.fontSize = '11px';
            textarea.style.padding = '8px';
            textarea.style.resize = 'vertical';
            textarea.spellcheck = false;
            
            // Debounce update
            let timeout;
            textarea.addEventListener('input', (e) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    this.updateStyle(selection, 'code', e.target.value);
                }, 500);
            });
            
            codeContainer.appendChild(textarea);
            content.appendChild(codeContainer);
            
            const helpText = document.createElement('div');
            helpText.innerText = 'Return an object with a draw(time) function for animation.';
            helpText.style.fontSize = '10px';
            helpText.style.color = 'var(--color-text-secondary)';
            content.appendChild(helpText);

        } else {
            // Solid Color
            const colorRow = document.createElement('div');
            colorRow.style.display = 'flex';
            colorRow.style.alignItems = 'center';
            colorRow.style.justifyContent = 'flex-end'; // Align with dropdown
            colorRow.style.marginBottom = '8px';
            
            const colorInput = document.createElement('input');
            colorInput.type = 'color';
            colorInput.value = style.backgroundColor || '#D9D9D9';
            colorInput.style.width = '100%'; // Full width bar
            colorInput.style.height = '24px';
            colorInput.style.border = 'none';
            colorInput.style.padding = '0';
            colorInput.style.background = 'none';
            colorInput.style.cursor = 'pointer';
            
            colorInput.addEventListener('change', (e) => this.updateStyle(selection, 'backgroundColor', e.target.value));
            
            colorRow.appendChild(colorInput);
            content.appendChild(colorRow);
        }

        // Stroke (Border)
        const strokeRow = document.createElement('div');
        strokeRow.style.display = 'flex';
        strokeRow.style.alignItems = 'center';
        strokeRow.style.justifyContent = 'space-between';
        strokeRow.style.marginBottom = '8px';

        const strokeLabel = document.createElement('span');
        strokeLabel.textContent = 'Stroke';
        strokeLabel.style.fontSize = '11px';
        strokeLabel.style.color = 'var(--color-text-secondary)';

        // Stroke Style Dropdown (Solid, Dashed, Dotted)
        const strokeStyleSelect = document.createElement('select');
        strokeStyleSelect.style.background = 'var(--color-bg-panel)';
        strokeStyleSelect.style.border = 'none';
        strokeStyleSelect.style.color = 'var(--color-text-primary)';
        strokeStyleSelect.style.fontSize = '11px';
        strokeStyleSelect.style.textAlign = 'right';
        strokeStyleSelect.style.marginRight = '8px';
        strokeStyleSelect.style.cursor = 'pointer';

        ['Solid', 'Dashed', 'Dotted'].forEach(type => {
            const opt = document.createElement('option');
            opt.value = type.toLowerCase();
            opt.text = type;
            opt.selected = (style.borderStyle || 'solid') === type.toLowerCase();
            strokeStyleSelect.appendChild(opt);
        });

        strokeStyleSelect.addEventListener('change', (e) => this.updateStyle(selection, 'borderStyle', e.target.value));

        const strokeInput = document.createElement('input');
        strokeInput.type = 'color';
        strokeInput.value = style.borderColor || '#000000';
        strokeInput.style.width = '20px';
        strokeInput.style.height = '20px';
        strokeInput.style.border = 'none';
        strokeInput.style.padding = '0';
        strokeInput.style.background = 'none';
        strokeInput.style.cursor = 'pointer';

        strokeInput.addEventListener('change', (e) => this.updateStyle(selection, 'borderColor', e.target.value));

        const strokeRight = document.createElement('div');
        strokeRight.style.display = 'flex';
        strokeRight.style.alignItems = 'center';
        strokeRight.appendChild(strokeStyleSelect);
        strokeRight.appendChild(strokeInput);

        strokeRow.appendChild(strokeLabel);
        strokeRow.appendChild(strokeRight);
        content.appendChild(strokeRow);

        // Border Width & Radius Row
        const borderRow = document.createElement('div');
        borderRow.style.display = 'flex';
        borderRow.style.gap = '8px';
        borderRow.style.marginBottom = '8px';

        // Border Width
        const borderWidthControl = new ScrubbableControl('Width', parseFloat(style.borderWidth) || 0, (val) => {
            this.updateStyle(selection, 'borderWidth', Math.max(0, val));
            // Ensure border style is solid if width > 0
            if (val > 0 && (!style.borderStyle || style.borderStyle === 'none')) {
                this.updateStyle(selection, 'borderStyle', 'solid');
            }
        });
        borderRow.appendChild(borderWidthControl.element);

        // Border Radius
        const radiusControl = new ScrubbableControl('Radius', parseFloat(style.borderRadius) || 0, (val) => {
            this.updateStyle(selection, 'borderRadius', Math.max(0, val));
        });
        borderRow.appendChild(radiusControl.element);

        content.appendChild(borderRow);

        // Stroke Position
        const strokePosControl = new SegmentedControl(
            [
                { label: 'Inside', value: 'inside' },
                { label: 'Center', value: 'center' },
                { label: 'Outside', value: 'outside' }
            ],
            style.strokeAlign || 'inside',
            (val) => this.updateStyle(selection, 'strokeAlign', val)
        );
        content.appendChild(strokePosControl.element);

        this.container.appendChild(group);
    }

    renderAnimationProperties(element, selection) {
        const { group, content } = this.createControlGroup('Animations', false);
        
        const animations = element.animations || { entrance: 'none', exit: 'none', duration: 1000, delay: 0 };

        // Entrance
        const entranceRow = document.createElement('div');
        entranceRow.className = 'control-row';
        
        const entranceLabel = document.createElement('label');
        entranceLabel.innerText = 'Entrance';
        
        const entranceSelect = document.createElement('select');
        entranceSelect.className = 'input-select';
        ['none', 'fade-in', 'slide-in-left', 'slide-in-right', 'slide-in-bottom', 'slide-in-top', 'zoom-in'].forEach(opt => {
            const option = document.createElement('option');
            option.value = opt;
            option.innerText = opt.replace(/-/g, ' ');
            if (animations.entrance === opt) option.selected = true;
            entranceSelect.appendChild(option);
        });
        
        entranceSelect.onchange = (e) => {
            this.updateAnimation(selection, 'entrance', e.target.value);
        };
        
        entranceRow.appendChild(entranceLabel);
        entranceRow.appendChild(entranceSelect);
        content.appendChild(entranceRow);

        // Exit
        const exitRow = document.createElement('div');
        exitRow.className = 'control-row';
        
        const exitLabel = document.createElement('label');
        exitLabel.innerText = 'Exit';
        
        const exitSelect = document.createElement('select');
        exitSelect.className = 'input-select';
        ['none', 'fade-out', 'slide-out-left', 'slide-out-right', 'slide-out-bottom', 'slide-out-top', 'zoom-out'].forEach(opt => {
            const option = document.createElement('option');
            option.value = opt;
            option.innerText = opt.replace(/-/g, ' ');
            if (animations.exit === opt) option.selected = true;
            exitSelect.appendChild(option);
        });
        
        exitSelect.onchange = (e) => {
            this.updateAnimation(selection, 'exit', e.target.value);
        };
        
        exitRow.appendChild(exitLabel);
        exitRow.appendChild(exitSelect);
        content.appendChild(exitRow);

        // Duration & Delay
        const timingRow = document.createElement('div');
        timingRow.style.display = 'flex';
        timingRow.style.gap = '8px';
        timingRow.style.marginBottom = '8px';

        const durationControl = new ScrubbableControl('Duration', animations.duration || 1000, (val) => {
            this.updateAnimation(selection, 'duration', Math.max(0, val));
        });
        
        const delayControl = new ScrubbableControl('Delay', animations.delay || 0, (val) => {
            this.updateAnimation(selection, 'delay', Math.max(0, val));
        });

        timingRow.appendChild(durationControl.element);
        timingRow.appendChild(delayControl.element);
        content.appendChild(timingRow);

        // Preview Button
        const previewBtn = document.createElement('button');
        previewBtn.className = 'btn-secondary';
        previewBtn.innerText = 'Preview';
        previewBtn.style.width = '100%';
        previewBtn.onclick = () => {
            import('../core/AnimationManager.js').then(({ animationManager }) => {
                const domEl = document.getElementById(element.id);
                if (domEl) {
                    animationManager.playElementAnimation(domEl, animations);
                }
            });
        };
        content.appendChild(previewBtn);

        this.container.appendChild(group);
    }

    updateProperty(ids, key, value) {
        const idArray = Array.isArray(ids) ? ids : [ids];
        idArray.forEach(id => {
            store.dispatch('UPDATE_ELEMENT', { id, [key]: value });
        });
    }

    updateStyle(ids, key, value) {
        const idArray = Array.isArray(ids) ? ids : [ids];
        const state = store.getState();
        const slide = state.slides[state.editor.activeSlideId];

        idArray.forEach(id => {
            const el = slide.elements[id];
            if (el) {
                const newStyle = { ...el.style, [key]: value };
                store.dispatch('UPDATE_ELEMENT', { id, style: newStyle });
            }
        });
    }

    updateShadow(ids, key, value) {
        const idArray = Array.isArray(ids) ? ids : [ids];
        const state = store.getState();
        const slide = state.slides[state.editor.activeSlideId];

        idArray.forEach(id => {
            const el = slide.elements[id];
            if (el) {
                const current = el.style?.dropShadow || { x: 0, y: 4, blur: 4, spread: 0, color: '#00000040' };
                const newShadow = { ...current, [key]: value };
                const newStyle = { ...el.style, dropShadow: newShadow };
                store.dispatch('UPDATE_ELEMENT', { id, style: newStyle });
            }
        });
    }

    updateAnimation(ids, key, value) {
        const idArray = Array.isArray(ids) ? ids : [ids];
        const state = store.getState();
        const slide = state.slides[state.editor.activeSlideId];

        idArray.forEach(id => {
            const el = slide.elements[id];
            if (el) {
                const current = el.animations || { entrance: 'none', exit: 'none', duration: 1000, delay: 0 };
                const newAnim = { ...current, [key]: value };
                store.dispatch('UPDATE_ELEMENT', { id, animations: newAnim });
            }
        });
    }

    updateGradient(ids, updates) {
        const idArray = Array.isArray(ids) ? ids : [ids];
        const state = store.getState();
        const slide = state.slides[state.editor.activeSlideId];

        idArray.forEach(id => {
            const element = slide.elements[id];
            if (!element) return;

            const style = element.style || {};
            const currentAngle = style.gradientAngle !== undefined ? style.gradientAngle : 180;
            const currentStops = style.gradientStops || [
                { color: '#D9D9D9', position: 0 },
                { color: '#000000', position: 100 }
            ];
            const currentType = style.gradientType || 'linear';

            const newAngle = updates.angle !== undefined ? updates.angle : currentAngle;
            const newStops = updates.stops !== undefined ? updates.stops : currentStops;
            const newType = updates.type !== undefined ? updates.type : currentType;

            // Construct CSS String
            let gradientString = '';
            const stopsString = newStops.map(s => `${s.color} ${s.position}%`).join(', ');

            if (newType === 'linear') {
                gradientString = `linear-gradient(${newAngle}deg, ${stopsString})`;
            } else if (newType === 'radial') {
                gradientString = `radial-gradient(circle, ${stopsString})`;
            } else if (newType === 'conic') {
                gradientString = `conic-gradient(from ${newAngle}deg, ${stopsString})`;
            }

            const newStyle = {
                ...style,
                fillValue: gradientString,
                gradientAngle: newAngle,
                gradientStops: newStops,
                gradientType: newType
            };

            store.dispatch('UPDATE_ELEMENT', { id, style: newStyle });
        });
    }

    getAlphaFromHex(hex) {
        if (hex.length === 9) {
            return hex.slice(7, 9);
        }
        return 'ff';
    }

    renderImageProperties(element, selection) {
        const { group, content } = this.createControlGroup('Image', true);
        const style = element.style || {};

        // Replace Image
        const btn = document.createElement('button');
        btn.innerText = 'Replace Image...';
        btn.style.width = '100%';
        btn.style.marginBottom = '8px';
        btn.className = 'btn-secondary';
        
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    selection.forEach(id => {
                        store.dispatch('UPDATE_ELEMENT', { id, src: evt.target.result });
                    });
                };
                reader.readAsDataURL(file);
            }
        };
        btn.onclick = () => fileInput.click();
        content.appendChild(fileInput);
        content.appendChild(btn);

        // Border Radius
        const radiusControl = new ScrubbableControl('Radius', parseFloat(style.borderRadius) || 0, (val) => {
            this.updateStyle(selection, 'borderRadius', Math.max(0, val));
        });
        content.appendChild(radiusControl.element);

        this.container.appendChild(group);
    }

    renderEffectsProperties(element, selection) {
        const { group, content } = this.createControlGroup('Effects', false);
        const style = element.style || {};

        // Drop Shadow
        const shadow = style.dropShadow || { x: 0, y: 0, blur: 0, spread: 0, color: '#000000' };
        const hasShadow = shadow.blur > 0 || shadow.x !== 0 || shadow.y !== 0;

        const shadowHeader = document.createElement('div');
        shadowHeader.style.display = 'flex';
        shadowHeader.style.justifyContent = 'space-between';
        shadowHeader.style.alignItems = 'center';
        shadowHeader.style.marginBottom = '8px';
        
        const shadowLabel = document.createElement('span');
        shadowLabel.innerText = 'Drop Shadow';
        shadowLabel.style.fontSize = '11px';
        shadowLabel.style.color = 'var(--color-text-secondary)';
        
        const shadowToggle = new Switch('', hasShadow, (checked) => {
            if (checked) {
                this.updateStyle(selection, 'dropShadow', { x: 0, y: 4, blur: 4, spread: 0, color: '#00000040' });
            } else {
                this.updateStyle(selection, 'dropShadow', null);
            }
        });
        
        shadowHeader.appendChild(shadowLabel);
        shadowHeader.appendChild(shadowToggle.element);
        content.appendChild(shadowHeader);

        if (style.dropShadow) {
            // X / Y
            const posRow = document.createElement('div');
            posRow.style.display = 'flex';
            posRow.style.gap = '8px';
            posRow.style.marginBottom = '8px';
            
            const xControl = new ScrubbableControl('X', shadow.x, (val) => this.updateShadow(selection, 'x', val));
            const yControl = new ScrubbableControl('Y', shadow.y, (val) => this.updateShadow(selection, 'y', val));
            
            posRow.appendChild(xControl.element);
            posRow.appendChild(yControl.element);
            content.appendChild(posRow);

            // Blur / Spread
            const blurRow = document.createElement('div');
            blurRow.style.display = 'flex';
            blurRow.style.gap = '8px';
            blurRow.style.marginBottom = '8px';
            
            const blurControl = new ScrubbableControl('Blur', shadow.blur, (val) => this.updateShadow(selection, 'blur', Math.max(0, val)));
            const spreadControl = new ScrubbableControl('Spread', shadow.spread, (val) => this.updateShadow(selection, 'spread', val));
            
            blurRow.appendChild(blurControl.element);
            blurRow.appendChild(spreadControl.element);
            content.appendChild(blurRow);

            // Color
            const colorRow = document.createElement('div');
            colorRow.style.display = 'flex';
            colorRow.style.justifyContent = 'flex-end';
            
            const colorInput = document.createElement('input');
            colorInput.type = 'color';
            colorInput.value = shadow.color.substring(0, 7); // Hex only
            colorInput.style.border = 'none';
            colorInput.style.background = 'none';
            colorInput.style.cursor = 'pointer';
            
            colorInput.addEventListener('change', (e) => {
                // Preserve alpha if possible, or just use hex
                this.updateShadow(selection, 'color', e.target.value);
            });
            
            colorRow.appendChild(colorInput);
            content.appendChild(colorRow);
        }

        // Layer Blur
        const blur = style.blur;
        const blurHeader = document.createElement('div');
        blurHeader.style.display = 'flex';
        blurHeader.style.justifyContent = 'space-between';
        blurHeader.style.alignItems = 'center';
        blurHeader.style.marginTop = '16px';
        blurHeader.style.marginBottom = '8px';
        
        const blurLabel = document.createElement('span');
        blurLabel.innerText = 'Layer Blur';
        blurLabel.style.fontSize = '11px';
        blurLabel.style.color = 'var(--color-text-secondary)';
        
        const blurToggle = new Switch('', blur !== undefined && blur !== null, (checked) => {
            if (checked) {
                this.updateStyle(selection, 'blur', 4);
            } else {
                this.updateStyle(selection, 'blur', null);
            }
        });
        
        blurHeader.appendChild(blurLabel);
        blurHeader.appendChild(blurToggle.element);
        content.appendChild(blurHeader);

        if (blur !== undefined && blur !== null) {
            const blurAmountControl = new ScrubbableControl('Amount', blur, (val) => {
                this.updateStyle(selection, 'blur', Math.max(0, val));
            });
            content.appendChild(blurAmountControl.element);
        }

        this.container.appendChild(group);
    }
}
