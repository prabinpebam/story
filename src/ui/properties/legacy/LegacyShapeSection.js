import { ScrubbableControl } from '../../components/ScrubbableControl.js';
import { SegmentedControl } from '../../components/SegmentedControl.js';
import { ColorInput } from '../../components/ColorInput.js';
import { aiService } from '../../../core/ai/AIService.js';
import { store } from '../../../core/Store.js';
import { createControlGroup, updateStyle, updateGradient, getActiveContainer } from './LegacyUtils.js';

export class LegacyShapeSection {
    constructor(container, sectionStates) {
        this.container = container;
        this.sectionStates = sectionStates;
    }

    render(element, selection) {
        const { group, content } = createControlGroup('STYLE', this.sectionStates);
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

            updateStyle(selection, 'fillType', newType); // This will trigger re-render
            
            // Dispatch updates for all selected elements
            selection.forEach(id => {
                const state = store.getState();
                const slide = getActiveContainer(state);
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
                updateGradient(selection, { type: e.target.value });
            };
            
            typeRow.appendChild(typeSelect);
            content.appendChild(typeRow);

            // Angle (Only for Linear and Conic)
            if (!style.gradientType || style.gradientType === 'linear' || style.gradientType === 'conic') {
                const angleRow = document.createElement('div');
                angleRow.style.marginBottom = '8px';
                const angleControl = new ScrubbableControl('Angle', style.gradientAngle !== undefined ? style.gradientAngle : 180, (val) => {
                    const angle = Math.round(val) % 360;
                    updateGradient(selection, { angle });
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

                const colorInput = new ColorInput(stop.color, (val) => {
                    const newStops = [...stops];
                    newStops[index] = { ...newStops[index], color: val };
                    updateGradient(selection, { stops: newStops });
                }, { compact: true });

                stopContainer.appendChild(colorInput.element);
                
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
                        updateStyle(selection, 'fillValue', evt.target.result);
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

            scaleSelect.addEventListener('change', (e) => updateStyle(selection, 'fillScaleMode', e.target.value));
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
                const colorInput = new ColorInput(color, (val) => {
                    const newColors = [...colors];
                    newColors[index] = val;
                    updateStyle(selection, 'meshColors', newColors);
                });
                
                meshRow.appendChild(colorInput.element);
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
                    
                    updateStyle(selection, 'code', cleanCode);
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
                textarea.value = defaultCode.trim();
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
                    updateStyle(selection, 'code', defaultCode.trim());
                }, 0);
            }

            textarea.onchange = (e) => {
                updateStyle(selection, 'code', e.target.value);
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
                    updateStyle(selection, 'code', e.target.value);
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
            
            const colorInput = new ColorInput(style.backgroundColor || '#D9D9D9', (val) => {
                updateStyle(selection, 'backgroundColor', val);
            });
            
            colorRow.appendChild(colorInput.element);
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

        strokeStyleSelect.addEventListener('change', (e) => updateStyle(selection, 'borderStyle', e.target.value));

        const strokeInput = new ColorInput(style.borderColor || '#000000', (val) => {
            updateStyle(selection, 'borderColor', val);
        }, { compact: true });

        const strokeRight = document.createElement('div');
        strokeRight.style.display = 'flex';
        strokeRight.style.alignItems = 'center';
        strokeRight.style.gap = '8px';
        strokeRight.appendChild(strokeStyleSelect);
        strokeRight.appendChild(strokeInput.element);

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
            updateStyle(selection, 'borderWidth', Math.max(0, val));
            // Ensure border style is solid if width > 0
            if (val > 0 && (!style.borderStyle || style.borderStyle === 'none')) {
                updateStyle(selection, 'borderStyle', 'solid');
            }
        });
        borderRow.appendChild(borderWidthControl.element);

        // Border Radius
        const radiusControl = new ScrubbableControl('Radius', parseFloat(style.borderRadius) || 0, (val) => {
            updateStyle(selection, 'borderRadius', Math.max(0, val));
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
            (val) => updateStyle(selection, 'strokeAlign', val)
        );
        content.appendChild(strokePosControl.element);

        this.container.appendChild(group);
    }
}
