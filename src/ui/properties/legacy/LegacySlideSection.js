import { Switch } from '../../components/Switch.js';
import { ScrubbableControl } from '../../components/ScrubbableControl.js';
import { ColorInput } from '../../components/ColorInput.js';
import { aiService } from '../../../core/ai/AIService.js';
import { store } from '../../../core/Store.js';
import { createControlGroup } from './LegacyUtils.js';

export class LegacySlideSection {
    constructor(container, sectionStates) {
        this.container = container;
        this.sectionStates = sectionStates;
    }

    render(slide, mode) {
        let effectiveBg;
        let isInherited = false;

        if (mode === 'master') {
            if (slide.background && slide.background.type !== 'inherited') {
                effectiveBg = slide.background;
            } else {
                effectiveBg = slide.background || { type: 'solid', value: '#ffffff' };
                isInherited = !slide.background || slide.background.type === 'inherited';
            }
        } else {
            const effectiveSlide = store.getEffectiveSlide(slide.id);
            effectiveBg = effectiveSlide ? effectiveSlide.effectiveBackground : (slide.background || { type: 'solid', value: '#ffffff' });
            isInherited = !slide.background;
        }

        const updateAction = mode === 'master' ? 'UPDATE_MASTER' : 'UPDATE_SLIDE';

        const { group, content } = createControlGroup(mode === 'master' ? 'MASTER / LAYOUT' : 'SLIDE', this.sectionStates, true);
        
        // Rename (Master Mode Only)
        if (mode === 'master') {
            const nameLabel = document.createElement('div');
            nameLabel.innerText = 'Name';
            nameLabel.style.fontSize = 'var(--font-size-xs)';
            nameLabel.style.color = 'var(--color-text-secondary)';
            nameLabel.style.marginBottom = 'var(--spacing-2)';
            content.appendChild(nameLabel);

            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.value = slide.name || '';
            nameInput.className = 'settings-input';
            nameInput.style.width = '100%';
            nameInput.style.marginBottom = 'var(--spacing-3)';
            
            nameInput.onchange = (e) => {
                store.dispatch(updateAction, { id: slide.id, name: e.target.value });
            };
            content.appendChild(nameInput);
        }

        // Hide Background Graphics Toggle
        // Show for Layouts (hides Theme) and Slides (hides Layout)
        if ((mode === 'master' && slide.type === 'layout') || mode === 'edit') {
            const hideBgRow = document.createElement('div');
            hideBgRow.style.display = 'flex';
            hideBgRow.style.justifyContent = 'space-between';
            hideBgRow.style.alignItems = 'center';
            hideBgRow.style.marginBottom = 'var(--spacing-3)';

            const hideBgLabel = document.createElement('span');
            hideBgLabel.innerText = mode === 'master' ? 'Hide Theme Graphics' : 'Hide Background Graphics';
            hideBgLabel.style.fontSize = '11px';
            hideBgLabel.style.color = 'var(--color-text-secondary)';

            const hideBgSwitch = new Switch('', slide.hideBackgroundGraphics || false, (checked) => {
                store.dispatch(updateAction, { id: slide.id, hideBackgroundGraphics: checked });
            });

            hideBgRow.appendChild(hideBgLabel);
            hideBgRow.appendChild(hideBgSwitch.element);
            content.appendChild(hideBgRow);
        }

        // Layout Picker (Only in Slide Mode)
        if (mode !== 'master') {
            const state = store.getState();
            const currentLayoutId = slide.layoutId;
            const currentLayout = state.masters[currentLayoutId];
            
            if (currentLayout) {
                const themeId = currentLayout.parentId;
                const layouts = Object.values(state.masters).filter(m => m.type === 'layout' && m.parentId === themeId);
                
                const layoutLabel = document.createElement('div');
                layoutLabel.innerText = 'Layout';
                layoutLabel.style.fontSize = 'var(--font-size-xs)';
                layoutLabel.style.color = 'var(--color-text-secondary)';
                layoutLabel.style.marginBottom = 'var(--spacing-2)';
                content.appendChild(layoutLabel);

                const layoutSelect = document.createElement('select');
                layoutSelect.className = 'input-select';
                layoutSelect.style.width = '100%';
                layoutSelect.style.marginBottom = 'var(--spacing-3)';
                layoutSelect.style.background = 'var(--color-bg-input)';
                layoutSelect.style.border = '1px solid var(--color-border)';
                layoutSelect.style.borderRadius = 'var(--radius-sm)';
                layoutSelect.style.color = 'var(--color-text-primary)';
                layoutSelect.style.padding = '4px';
                layoutSelect.style.fontSize = '11px';

                layouts.forEach(layout => {
                    const opt = document.createElement('option');
                    opt.value = layout.id;
                    opt.text = layout.name;
                    if (layout.id === currentLayoutId) opt.selected = true;
                    layoutSelect.appendChild(opt);
                });

                layoutSelect.onchange = (e) => {
                    store.dispatch('UPDATE_SLIDE', { id: slide.id, layoutId: e.target.value });
                };

                content.appendChild(layoutSelect);
            }
        }

        // Theme Settings (Only for Theme Master)
        if (mode === 'master' && slide.type === 'theme') {
            const themeSettings = slide.themeSettings || { colors: {}, fonts: {} };
            
            const themeLabel = document.createElement('div');
            themeLabel.innerText = 'Theme Settings';
            themeLabel.className = 'section-title';
            themeLabel.style.marginTop = '0';
            themeLabel.style.marginBottom = '12px';
            themeLabel.style.fontSize = '12px';
            themeLabel.style.fontWeight = '600';
            content.appendChild(themeLabel);

            // Colors
            const colorsLabel = document.createElement('div');
            colorsLabel.innerText = 'Colors';
            colorsLabel.style.fontSize = '11px';
            colorsLabel.style.color = 'var(--color-text-secondary)';
            colorsLabel.style.marginBottom = '8px';
            content.appendChild(colorsLabel);

            const colorMap = {
                accent: 'Accent',
                textPrimary: 'Text Primary',
                textSecondary: 'Text Secondary'
            };

            Object.entries(colorMap).forEach(([key, label]) => {
                const row = document.createElement('div');
                row.style.display = 'flex';
                row.style.justifyContent = 'space-between';
                row.style.alignItems = 'center';
                row.style.marginBottom = '4px';
                
                const lbl = document.createElement('span');
                lbl.innerText = label;
                lbl.style.fontSize = '11px';
                
                const colorInput = new ColorInput(themeSettings.colors[key] || '#000000', (val) => {
                    store.dispatch('UPDATE_THEME_SETTINGS', { 
                        id: slide.id, 
                        settings: { colors: { [key]: val } } 
                    });
                });
                
                row.appendChild(lbl);
                row.appendChild(colorInput.element);
                content.appendChild(row);
            });

            // Fonts
            const fontsLabel = document.createElement('div');
            fontsLabel.innerText = 'Fonts';
            fontsLabel.style.fontSize = '11px';
            fontsLabel.style.color = 'var(--color-text-secondary)';
            fontsLabel.style.marginTop = '12px';
            fontsLabel.style.marginBottom = '8px';
            content.appendChild(fontsLabel);

            const fontMap = {
                heading: 'Heading',
                body: 'Body'
            };
            
            const availableFonts = ['Inter', 'Roboto', 'Arial', 'Helvetica', 'Times New Roman', 'Courier New'];

            Object.entries(fontMap).forEach(([key, label]) => {
                const row = document.createElement('div');
                row.style.marginBottom = '8px';
                
                const lbl = document.createElement('div');
                lbl.innerText = label;
                lbl.style.fontSize = '11px';
                lbl.style.marginBottom = '4px';
                
                const select = document.createElement('select');
                select.className = 'input-select';
                select.style.width = '100%';
                
                availableFonts.forEach(font => {
                    const opt = document.createElement('option');
                    opt.value = font;
                    opt.text = font;
                    if (themeSettings.fonts[key] === font) opt.selected = true;
                    select.appendChild(opt);
                });
                
                select.onchange = (e) => {
                    store.dispatch('UPDATE_THEME_SETTINGS', { 
                        id: slide.id, 
                        settings: { fonts: { [key]: e.target.value } } 
                    });
                };
                
                row.appendChild(lbl);
                row.appendChild(select);
                content.appendChild(row);
            });
            
            const divider = document.createElement('div');
            divider.style.height = '1px';
            divider.style.backgroundColor = 'var(--color-border)';
            divider.style.margin = '16px 0';
            content.appendChild(divider);
        }

        // Dimensions
        const dimRow = document.createElement('div');
        dimRow.style.display = 'flex';
        dimRow.style.gap = 'var(--spacing-2)';
        dimRow.style.marginBottom = 'var(--spacing-3)';
        
        const wControl = new ScrubbableControl('W', slide.width, (val) => {
            store.dispatch(updateAction, { id: slide.id, width: Math.max(100, val) });
        });
        
        const hControl = new ScrubbableControl('H', slide.height, (val) => {
            store.dispatch(updateAction, { id: slide.id, height: Math.max(100, val) });
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
        
        ['Inherited', 'Solid', 'Gradient', 'Image', 'Code'].forEach(type => {
            // Theme Masters cannot inherit background
            if (type === 'Inherited' && mode === 'master' && slide.type === 'theme') return;

            const opt = document.createElement('option');
            opt.value = type.toLowerCase();
            opt.text = type;
            
            if (type === 'Inherited') {
                if (isInherited) opt.selected = true;
            } else {
                if (!isInherited && slide.background && slide.background.type === type.toLowerCase()) opt.selected = true;
            }
            bgTypeSelect.appendChild(opt);
        });
        
        bgTypeSelect.onchange = (e) => {
            const newType = e.target.value;
            
            if (newType === 'inherited') {
                store.dispatch(updateAction, { id: slide.id, background: null });
                return;
            }

            // If switching from inherited, use effective value as base, otherwise use current explicit value
            let newValue = isInherited ? effectiveBg.value : (slide.background ? slide.background.value : '#ffffff');
            
            if (newType === 'gradient' && (!newValue || !newValue.includes('gradient'))) {
                newValue = 'linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%)';
            } else if (newType === 'solid' && newValue && newValue.includes('gradient')) {
                newValue = '#ffffff';
            } else if (newType === 'image') {
                newValue = 'https://placehold.co/1920x1080';
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
            store.dispatch(updateAction, { id: slide.id, background: { type: newType, value: newValue } });
        };
        content.appendChild(bgTypeSelect);

        // Determine which background to show controls for
        const bgToEdit = isInherited ? effectiveBg : slide.background;

        if (bgToEdit.type === 'solid') {
            const colorInput = new ColorInput(bgToEdit.value, (val) => {
                store.dispatch(updateAction, { id: slide.id, background: { type: 'solid', value: val } });
            });
            content.appendChild(colorInput.element);
        } else if (bgToEdit.type === 'gradient') {
            // Simple Gradient Input (Text for now, could be enhanced)
            const gradientInput = document.createElement('input');
            gradientInput.type = 'text';
            gradientInput.value = bgToEdit.value;
            gradientInput.style.width = '100%';
            gradientInput.style.background = 'var(--color-bg-input)';
            gradientInput.style.border = '1px solid var(--color-border)';
            gradientInput.style.borderRadius = 'var(--radius-sm)';
            gradientInput.style.color = 'var(--color-text-primary)';
            gradientInput.style.padding = '4px';
            gradientInput.style.fontSize = '11px';
            gradientInput.className = 'settings-input';
            
            gradientInput.onchange = (e) => {
                store.dispatch(updateAction, { id: slide.id, background: { type: 'gradient', value: e.target.value } });
            };
            content.appendChild(gradientInput);
        } else if (bgToEdit.type === 'image') {
            const urlInput = document.createElement('input');
            urlInput.type = 'text';
            urlInput.value = bgToEdit.value;
            urlInput.placeholder = 'Image URL';
            urlInput.style.width = '100%';
            urlInput.style.background = 'var(--color-bg-input)';
            urlInput.style.border = '1px solid var(--color-border)';
            urlInput.style.borderRadius = 'var(--radius-sm)';
            urlInput.style.color = 'var(--color-text-primary)';
            urlInput.style.padding = '4px';
            urlInput.style.fontSize = '11px';
            
            urlInput.onchange = (e) => {
                store.dispatch(updateAction, { id: slide.id, background: { type: 'image', value: e.target.value } });
            };
            content.appendChild(urlInput);
        } else if (bgToEdit.type === 'code') {
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
                    
                    const currentCode = isReplace ? '' : (bgToEdit.value || '');
                    
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
                    
                    store.dispatch(updateAction, { id: slide.id, background: { type: 'code', value: cleanCode } });
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
            textarea.value = bgToEdit.value || '';
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
                store.dispatch(updateAction, { id: slide.id, background: { type: 'code', value: e.target.value } });
            };
            
            codeContainer.appendChild(textarea);
            content.appendChild(codeContainer);
        }

        this.container.appendChild(group);

        // Insert Placeholders (Master Mode Only)
        if (mode === 'master') {
            const { group: phGroup, content: phContent } = createControlGroup('INSERT PLACEHOLDER', this.sectionStates, true);
            phContent.style.display = 'grid';
            phContent.style.gridTemplateColumns = '1fr 1fr';
            phContent.style.gap = '8px';
            phContent.style.padding = '4px';

            const placeholders = [
                { label: 'Title', type: 'title', icon: 'fa-heading' },
                { label: 'Subtitle', type: 'subtitle', icon: 'fa-font' },
                { label: 'Body', type: 'body', icon: 'fa-align-left' },
                { label: 'Image', type: 'image', icon: 'fa-image' }
            ];

            placeholders.forEach(ph => {
                const btn = document.createElement('button');
                btn.className = 'btn-secondary';
                btn.style.display = 'flex';
                btn.style.flexDirection = 'column';
                btn.style.alignItems = 'center';
                btn.style.justifyContent = 'center';
                btn.style.padding = '12px';
                btn.style.gap = '4px';
                btn.style.height = 'auto';
                
                const icon = document.createElement('i');
                icon.className = `fa-solid ${ph.icon}`;
                icon.style.fontSize = '16px';
                icon.style.marginBottom = '4px';
                
                const label = document.createElement('span');
                label.innerText = ph.label;
                label.style.fontSize = '11px';
                
                btn.appendChild(icon);
                btn.appendChild(label);
                
                btn.onclick = () => {
                    const id = 'ph-' + Date.now();
                    const payload = {
                        id,
                        type: ph.type === 'image' ? 'image' : 'text',
                        x: 100,
                        y: 100,
                        width: 400,
                        height: ph.type === 'image' ? 300 : 100,
                        isPlaceholder: true,
                        placeholderType: ph.type,
                        text: ph.label + ' Placeholder',
                        fontSize: ph.type === 'title' ? 60 : (ph.type === 'subtitle' ? 40 : 24),
                        fontFamily: 'Inter',
                        color: '#000000'
                    };
                    
                    if (ph.type === 'image') {
                        payload.src = 'https://placehold.co/400x300?text=Image+Placeholder';
                    }
                    
                    store.dispatch('ADD_ELEMENT', payload);
                };
                
                phContent.appendChild(btn);
            });

            this.container.appendChild(phGroup);
        }
    }
}
