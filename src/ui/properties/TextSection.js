import { Section } from '../components/Section.js';
import { NumberInput } from '../components/NumberInput.js';
import { IconButton } from '../components/IconButton.js';
import { Dropdown } from '../components/Dropdown.js';
import { Button } from '../components/Button.js';
import { Icons } from '../Icons.js';
import { store } from '../../core/Store.js';
import { StyleResolver } from '../../utils/StyleResolver.js';
import FontManager from '../../core/FontManager.js';
import { FillFlyout } from '../components/FillFlyout/FillFlyout.js';
import { TypeSettingsFlyout } from '../components/TypeSettingsFlyout.js';
import { ColorUtils } from '../../utils/ColorUtils.js';
import { textEditManager } from '../../core/text/TextEditManager.js';
import { propertyMemory } from '../../core/services/PropertyMemoryManager.js';

export class TextSection {
    constructor() {
        this.section = new Section({ title: 'Typography' });
        this.createContent();
        this.activeFlyout = null;
        this.pendingStyles = {}; // Styles to apply to next typed character
        this.currentStyleId = null; // Track current text style
        this.hasStyleOverrides = false; // Track if style has local overrides
    }

    createContent() {
        // 0. Text Style Selector Row (New)
        const styleRow = document.createElement('div');
        styleRow.className = 'pi-row pi-style-row';

        // Style Dropdown
        this.styleDropdown = new Dropdown({
            options: this.getTextStyleOptions(),
            value: '',
            placeholder: 'No Style',
            size: 'fill',
            onChange: (val) => this.applyTextStyle(val)
        });
        styleRow.appendChild(this.styleDropdown.element);

        // Style Action Menu Button (Edit/Detach)
        this.styleMenuBtn = new IconButton({
            icon: Icons.MORE,
            title: 'Style Options',
            onClick: (e) => this.openStyleMenu(e)
        });
        this.styleMenuBtn.element.style.visibility = 'hidden'; // Hidden when no style
        styleRow.appendChild(this.styleMenuBtn.element);

        this.section.appendChild(styleRow);

        // Style Override Indicator
        this.overrideIndicator = document.createElement('div');
        this.overrideIndicator.className = 'pi-style-override';
        
        const overrideText = document.createElement('span');
        overrideText.textContent = 'Style has local overrides';
        this.overrideIndicator.appendChild(overrideText);
        
        const resetBtn = new Button({
            label: 'Reset',
            variant: 'text',
            size: 'xs',
            onClick: () => this.resetToStyle()
        });
        this.overrideIndicator.appendChild(resetBtn.element);
        
        this.overrideIndicator.style.display = 'none';
        this.section.appendChild(this.overrideIndicator);

        // 1. Font Family & Style & Size
        const fontRow = document.createElement('div');
        fontRow.className = 'pi-row';
        fontRow.style.display = 'grid';
        fontRow.style.gridTemplateColumns = '2fr 1fr 1fr';
        fontRow.style.gap = '8px';

        this.fontFamilyInput = new Dropdown({
            options: FontManager.getAvailableFonts().map(f => ({ label: f.family, value: f.family })),
            value: 'Inter',
            onChange: (val) => {
                FontManager.loadFont(val);
                this.updateProperty('fontFamily', val);
            }
        });

        this.fontWeightInput = new Dropdown({
            options: [
                { label: 'Light', value: '300' },
                { label: 'Regular', value: '400' },
                { label: 'Medium', value: '500' },
                { label: 'Bold', value: '700' },
                { label: 'Black', value: '900' }
            ],
            value: '400',
            onChange: (val) => this.updateProperty('fontWeight', val)
        });
        
        this.fontSizeInput = new NumberInput({
            value: 16,
            min: 1,
            scrubbable: true,
            onChange: (val) => this.updateProperty('fontSize', val)
        });

        fontRow.appendChild(this.fontFamilyInput.element);
        fontRow.appendChild(this.fontWeightInput.element);
        fontRow.appendChild(this.fontSizeInput.element);
        this.section.appendChild(fontRow);

        // 2. Text Fill
        this.fillRow = document.createElement('div');
        this.fillRow.className = 'pi-row';
        this.fillRow.style.marginTop = '8px';
        this.fillRow.style.display = 'flex';
        this.fillRow.style.alignItems = 'center';
        this.fillRow.style.height = '28px';
        
        this.createFillControl();
        this.section.appendChild(this.fillRow);

        // 3. Line Height & Letter Spacing
        const spacingRow = document.createElement('div');
        spacingRow.className = 'pi-row';
        spacingRow.style.display = 'grid';
        spacingRow.style.gridTemplateColumns = '1fr 1fr';
        spacingRow.style.gap = '8px';

        this.lineHeightInput = new NumberInput({
            label: 'LH',
            value: 1.2,
            step: 0.1,
            onChange: (val) => this.updateProperty('lineHeight', val)
        });

        this.letterSpacingInput = new NumberInput({
            label: 'LS',
            value: 0,
            step: 0.1,
            units: '%',
            onChange: (val) => this.updateProperty('letterSpacing', val + '%')
        });

        spacingRow.appendChild(this.lineHeightInput.element);
        spacingRow.appendChild(this.letterSpacingInput.element);
        this.section.appendChild(spacingRow);

        // 4. Alignment
        const alignRow = document.createElement('div');
        alignRow.className = 'pi-row';
        alignRow.style.display = 'flex';
        alignRow.style.justifyContent = 'space-between';
        alignRow.style.alignItems = 'center';

        const alignGroup = document.createElement('div');
        alignGroup.style.display = 'flex';
        alignGroup.style.gap = '2px';

        const aligns = [
            { icon: Icons.ALIGN_LEFT, value: 'left', prop: 'textAlign' },
            { icon: Icons.ALIGN_CENTER, value: 'center', prop: 'textAlign' },
            { icon: Icons.ALIGN_RIGHT, value: 'right', prop: 'textAlign' },
            { icon: Icons.ALIGN_TOP, value: 'top', prop: 'verticalAlign' },
            { icon: Icons.ALIGN_MIDDLE, value: 'middle', prop: 'verticalAlign' },
            { icon: Icons.ALIGN_BOTTOM, value: 'bottom', prop: 'verticalAlign' }
        ];

        this.alignButtons = aligns.map(a => {
            const btn = new IconButton({
                icon: a.icon,
                onClick: () => this.updateProperty(a.prop, a.value)
            });
            alignGroup.appendChild(btn.element);
            return { btn, value: a.value, prop: a.prop };
        });
        
        const settingsBtn = new IconButton({
            icon: Icons.SETTINGS,
            onClick: (e) => {
                const btn = e.target.closest('button') || e.target;
                this.openTypeSettings(btn);
            }
        });

        alignRow.appendChild(alignGroup);
        alignRow.appendChild(settingsBtn.element);
        this.section.appendChild(alignRow);
    }

    openTypeSettings(target) {
        if (this.activeFlyout) {
            this.activeFlyout.close();
            this.activeFlyout = null;
        }

        const state = store.getState();
        const selection = state.editor.selectedElementIds;
        const el = this.getElement(state, selection[0]);
        const props = StyleResolver.getEffectiveTextProperties(el);

        const flyout = new TypeSettingsFlyout({
            trigger: target,
            props: props,
            onChange: (updates) => {
                Object.keys(updates).forEach(key => {
                    this.updateProperty(key, updates[key]);
                });
            },
            onClose: () => {
                this.activeFlyout = null;
            }
        });

        flyout.open();
        this.activeFlyout = flyout;
    }

    createFillControl() {
        // Combined Input Group (Swatch + Hex + Opacity)
        const combinedInput = document.createElement('div');
        combinedInput.style.flex = '1';
        combinedInput.style.display = 'flex';
        combinedInput.style.alignItems = 'center';
        combinedInput.style.border = '1px solid var(--color-border)';
        combinedInput.style.borderRadius = 'var(--radius-sm)';
        combinedInput.style.height = '24px';
        combinedInput.style.overflow = 'hidden';
        combinedInput.style.backgroundColor = 'var(--color-bg-input)';

        // Swatch
        this.fillSwatch = document.createElement('div');
        this.fillSwatch.className = 'color-swatch-trigger';
        this.fillSwatch.style.width = '22px';
        this.fillSwatch.style.height = '100%';
        this.fillSwatch.style.cursor = 'pointer';
        this.fillSwatch.style.display = 'flex';
        this.fillSwatch.style.alignItems = 'center';
        this.fillSwatch.style.justifyContent = 'center';
        
        this.fillPreview = document.createElement('div');
        this.fillPreview.style.width = 'var(--swatch-size-sm)';
        this.fillPreview.style.height = 'var(--swatch-size-sm)';
        this.fillPreview.style.borderRadius = 'var(--radius-xs)';
        this.fillSwatch.appendChild(this.fillPreview);
        
        // Hover handlers for border opacity
        this.fillSwatch.addEventListener('mouseenter', () => {
            if (this._currentFillColor) {
                this.updateSwatchBorder(this.fillPreview, this._currentFillColor, true);
            }
        });
        this.fillSwatch.addEventListener('mouseleave', () => {
            if (this._currentFillColor) {
                this.updateSwatchBorder(this.fillPreview, this._currentFillColor, false);
            }
        });
        
        this.fillSwatch.onclick = (e) => {
            e.stopPropagation();
            this.openFillFlyout(this.fillSwatch);
        };
        
        combinedInput.appendChild(this.fillSwatch);

        // Hex Input
        this.fillHexInput = document.createElement('input');
        this.fillHexInput.type = 'text';
        this.fillHexInput.style.flex = '1';
        this.fillHexInput.style.minWidth = '0';
        this.fillHexInput.style.border = 'none';
        this.fillHexInput.style.background = 'transparent';
        this.fillHexInput.style.color = 'var(--color-text-secondary)';
        this.fillHexInput.style.fontSize = '11px';
        this.fillHexInput.style.fontFamily = 'monospace';
        this.fillHexInput.style.padding = '0 2px';
        this.fillHexInput.spellcheck = false;
        
        this.fillHexInput.onchange = (e) => {
            let val = e.target.value.trim();
            if (!val.startsWith('#')) val = '#' + val;
            if (/^#[0-9A-F]{6}$/i.test(val) || /^#[0-9A-F]{3}$/i.test(val)) {
                this.updateTextFill({ type: 'solid', value: val });
            } else {
                // Revert handled in update
            }
        };
        
        combinedInput.appendChild(this.fillHexInput);

        // Separator
        const separator = document.createElement('div');
        separator.style.width = '1px';
        separator.style.height = '12px';
        separator.style.backgroundColor = 'var(--color-border)';
        combinedInput.appendChild(separator);

        // Opacity
        this.fillOpacityInput = new NumberInput({
            value: 100,
            min: 0,
            max: 100,
            step: 1,
            units: '%',
            scrubbable: true,
            onChange: (val) => {
                this.updateTextFillOpacity(val);
            }
        });
        
        this.fillOpacityInput.element.style.width = '40px';
        this.fillOpacityInput.element.style.flex = '0 0 40px';
        this.fillOpacityInput.element.style.border = 'none';
        this.fillOpacityInput.element.style.background = 'transparent';
        this.fillOpacityInput.element.querySelector('input').style.padding = '0';
        this.fillOpacityInput.element.querySelector('input').style.textAlign = 'center';
        
        combinedInput.appendChild(this.fillOpacityInput.element);
        
        this.fillRow.appendChild(combinedInput);
    }

    update(selection) {
        const state = store.getState();
        const textElements = selection
            .map(id => this.getElement(state, id))
            .filter(el => el && el.type === 'text');

        if (textElements.length === 0) {
            this.section.element.style.display = 'none';
            return;
        }

        this.section.element.style.display = 'block';
        const el = textElements[0];
        
        // Update style dropdown options (in case theme changed)
        this.styleDropdown.setOptions(this.getTextStyleOptions());
        
        // Handle Text Style
        this.currentStyleId = el.styleId || null;
        
        // Check for style overrides
        if (this.currentStyleId) {
            const themeId = this.getActiveThemeId(state);
            const theme = state.masters[themeId];
            const style = theme?.themeSettings?.textStyles?.[this.currentStyleId];
            this.hasStyleOverrides = this.checkForStyleOverrides(el, style);
        } else {
            this.hasStyleOverrides = false;
        }
        
        this.updateStyleUI();
        
        // Use StyleResolver to get effective properties
        const props = StyleResolver.getEffectiveTextProperties(el);
        
        this.fontFamilyInput.setValue(props.fontFamily, false);
        this.fontWeightInput.setValue(props.fontWeight, false);
        this.fontSizeInput.setValue(props.fontSize, false);
        
        // Line Height
        if (props.lineHeight === 'auto') {
            this.lineHeightInput.setValue(1.2, false); 
        } else {
            this.lineHeightInput.setValue(props.lineHeight, false);
        }
        
        // Letter Spacing
        let ls = props.letterSpacing;
        if (typeof ls === 'string' && ls.endsWith('%')) {
            ls = parseFloat(ls);
        } else {
            ls = parseFloat(ls) || 0;
        }
        this.letterSpacingInput.setValue(ls, false);
        
        // Alignment
        this.alignButtons.forEach(({ btn, value, prop }) => {
            if (props[prop] === value) {
                btn.element.classList.add('active');
                btn.element.style.backgroundColor = 'var(--color-bg-hover)';
            } else {
                btn.element.classList.remove('active');
                btn.element.style.backgroundColor = 'transparent';
            }
        });
        
        // Text Fill
        this.updateFillUI(props.textFill);
        this.currentTextFill = props.textFill;
    }

    updateFillUI(fill) {
        if (!fill) fill = { type: 'solid', value: '#000000' };
        
        if (fill.type === 'image') {
             this.fillPreview.style.backgroundImage = `url(${fill.value.src})`;
             this.fillPreview.style.backgroundSize = 'cover';
             this.fillPreview.style.backgroundColor = 'transparent';
             this.fillPreview.style.boxShadow = 'inset 0 0 0 1px rgba(0, 0, 0, 0.3)';
             this._currentFillColor = null;
             this.fillHexInput.value = 'Image';
             this.fillHexInput.disabled = true;
        } else if (fill.type === 'gradient') {
             this.fillPreview.style.background = this.getGradientCss(fill.value);
             this.fillPreview.style.boxShadow = 'inset 0 0 0 1px rgba(0, 0, 0, 0.3)';
             this._currentFillColor = null;
             this.fillHexInput.value = 'Gradient';
             this.fillHexInput.disabled = true;
        } else if (fill.type === 'code') {
             this.fillPreview.style.background = 'var(--color-bg-app)';
             this.fillPreview.style.backgroundImage = 'linear-gradient(45deg, var(--color-surface-tertiary) 25%, transparent 25%), linear-gradient(-45deg, var(--color-surface-tertiary) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--color-surface-tertiary) 75%), linear-gradient(-45deg, transparent 75%, var(--color-surface-tertiary) 75%)';
             this.fillPreview.style.backgroundSize = '8px 8px';
             this.fillPreview.style.boxShadow = 'inset 0 0 0 1px rgba(0, 0, 0, 0.3)';
             this._currentFillColor = null;
             this.fillHexInput.value = 'Code';
             this.fillHexInput.disabled = true;
        } else {
             // Solid
             this._currentFillColor = fill.value;
             this.fillPreview.style.background = fill.value;
             this.fillPreview.style.backgroundImage = 'none';
             this.updateSwatchBorder(this.fillPreview, fill.value, false);
             this.fillHexInput.value = fill.value;
             this.fillHexInput.disabled = false;
        }
        
        let opacity = 100;
        if (fill.type === 'solid') {
             opacity = this.getOpacity(fill.value);
        } else {
             opacity = fill.opacity !== undefined ? fill.opacity : 100;
        }
        this.fillOpacityInput.setValue(opacity, false);
    }

    getGradientCss(gradient) {
        const stops = gradient.stops.map(s => `${s.color} ${s.position}%`).join(', ');
        
        if (gradient.type === 'linear') {
            return `linear-gradient(${gradient.angle || 90}deg, ${stops})`;
        } else if (gradient.type === 'radial') {
            return `radial-gradient(circle, ${stops})`;
        } else if (gradient.type === 'angular') {
            return `conic-gradient(from ${gradient.angle || 0}deg at center, ${stops})`;
        } else if (gradient.type === 'diamond') {
            return `radial-gradient(circle, ${stops})`; // Fallback for diamond as CSS doesn't support it natively easily without mask
        }
        return 'linear-gradient(90deg, #000, #fff)';
    }

    getOpacity(colorString) {
        if (!colorString) return 100;
        if (colorString.startsWith('rgba')) {
            const match = colorString.match(/rgba?\(.*,\s*([\d.]+)\)/);
            if (match) {
                return Math.round(parseFloat(match[1]) * 100);
            }
        }
        return 100;
    }

    getElement(state, id) {
        const mode = state.editor.mode;
        if (mode === 'master') {
            const master = state.masters[state.editor.activeMasterId];
            return master?.elements[id];
        } else {
            const slide = state.slides[state.editor.activeSlideId];
            return slide?.elements[id];
        }
    }

    updateProperty(prop, value) {
        const state = store.getState();
        const selection = state.editor.selectedElementIds;
        const editingElementId = state.editor.editingElementId;
        
        // If we're editing a text element, check for text selection
        if (editingElementId && selection.includes(editingElementId)) {
            // Save selection before any PI interaction
            textEditManager.saveSelection();
            
            const textSelection = window.getSelection();
            
            if (textSelection && !textSelection.isCollapsed) {
                // Apply style to selected text range only
                this.applyInlineStyle(prop, value);
                return;
            } else {
                // No selection (caret only) - store as pending style for next typed character
                // For now, still apply to element (future: queue for next input)
            }
        }
        
        // Apply to whole element
        selection.forEach(id => {
            store.dispatch('UPDATE_ELEMENT', { id, [prop]: value });
        });
    }

    applyInlineStyle(prop, value) {
        // Map property names to CSS and execCommand equivalents
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) return;
        
        // Save selection via TextEditManager before applying style
        textEditManager.saveSelection();
        
        switch (prop) {
            case 'fontWeight':
                if (value === '700' || value === 'bold') {
                    document.execCommand('bold');
                } else if (value === '400' || value === 'normal') {
                    // Check if currently bold, then toggle off
                    if (document.queryCommandState('bold')) {
                        document.execCommand('bold');
                    }
                }
                break;
                
            case 'fontStyle':
                if (value === 'italic') {
                    document.execCommand('italic');
                } else {
                    if (document.queryCommandState('italic')) {
                        document.execCommand('italic');
                    }
                }
                break;
                
            case 'textDecoration':
                if (value === 'underline') {
                    document.execCommand('underline');
                } else if (value === 'line-through') {
                    document.execCommand('strikeThrough');
                }
                break;
                
            case 'fontSize':
                // Wrap selection in span with font-size
                this.wrapSelectionWithStyle('font-size', value + 'px');
                break;
                
            case 'fontFamily':
                // Use execCommand for font name
                document.execCommand('fontName', false, value);
                break;
                
            case 'color':
            case 'textFill':
                // Apply color to selection
                const colorValue = typeof value === 'object' ? value.value : value;
                document.execCommand('foreColor', false, colorValue);
                break;
                
            default:
                // For other properties, wrap in span
                const cssProp = this.toCssProperty(prop);
                if (cssProp) {
                    this.wrapSelectionWithStyle(cssProp, value);
                }
        }
        
        // Restore selection via TextEditManager
        textEditManager.restoreSelection();
    }

    wrapSelectionWithStyle(cssProp, cssValue) {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) return;
        
        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.style[this.toCamelCase(cssProp)] = cssValue;
        
        try {
            range.surroundContents(span);
        } catch (e) {
            // surroundContents fails if selection crosses element boundaries
            // Fallback: extract and wrap
            const contents = range.extractContents();
            span.appendChild(contents);
            range.insertNode(span);
        }
    }

    toCssProperty(jsProp) {
        // Convert camelCase to kebab-case
        return jsProp.replace(/([A-Z])/g, '-$1').toLowerCase();
    }

    toCamelCase(cssProp) {
        // Convert kebab-case to camelCase
        return cssProp.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    }

    updateTextFill(newFill) {
        const state = store.getState();
        const editingElementId = state.editor.editingElementId;
        const selection = state.editor.selectedElementIds;
        
        // If we're editing and have a text selection, apply color inline
        if (editingElementId && selection.includes(editingElementId)) {
            const textSelection = window.getSelection();
            
            if (textSelection && !textSelection.isCollapsed && newFill.type === 'solid') {
                // Apply color to selected text only
                document.execCommand('foreColor', false, newFill.value);
                return;
            }
        }
        
        // Apply to whole element
        this.updateProperty('textFill', newFill);
    }
    
    updateTextFillOpacity(opacity) {
        if (!this.currentTextFill) return;
        
        const fill = { ...this.currentTextFill };
        if (fill.type === 'solid') {
            let rgb = ColorUtils.parseColor(fill.value);
            fill.value = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity / 100})`;
        } else {
            fill.opacity = opacity;
        }
        this.updateTextFill(fill);
    }

    openFillFlyout(target) {
        if (this.activeFlyout) {
            this.activeFlyout.close();
            this.activeFlyout = null;
        }

        const flyout = new FillFlyout({
            trigger: target,
            fill: this.currentTextFill || { type: 'solid', value: '#000000' },
            contextKey: 'fill.text', // Text fill uses its own memory context
            onChange: (updates, isTransient) => {
                const current = this.currentTextFill || { type: 'solid', value: '#000000' };
                const newFill = { ...current, ...updates };
                
                if (updates.type && updates.type !== current.type) {
                    if (updates.type === 'solid') newFill.value = '#000000';
                    
                    // Only set default if value is not provided in updates
                    if (updates.type === 'gradient' && !updates.value) {
                        newFill.value = { type: 'linear', stops: [{color:'#000', position:0}, {color:'#fff', position:100}], angle: 90 };
                    }
                    
                    // For code, we leave value/code undefined so the renderer uses the default
                    if (updates.type === 'code') delete newFill.code;
                }
                
                if (updates.color && newFill.type === 'solid') {
                    newFill.value = updates.color;
                }
                
                this.updateTextFill(newFill);
            },
            onClose: () => {
                this.activeFlyout = null;
            }
        });

        flyout.open();
        this.activeFlyout = flyout;
    }

    // Text Style Methods
    getTextStyleOptions() {
        const state = store.getState();
        const themeId = this.getActiveThemeId(state);
        const theme = state.masters[themeId];
        const textStyles = theme?.themeSettings?.textStyles || {};
        
        const options = [{ label: 'No Style', value: '' }];
        
        Object.values(textStyles).forEach(style => {
            options.push({
                label: style.name,
                value: style.id
            });
        });
        
        // Add divider and action options
        options.push({ divider: true });
        options.push({ label: '+ Create Style...', value: '__create__', action: true });
        
        return options;
    }

    getActiveThemeId(state) {
        // Find the theme master (type === 'theme')
        const masters = state.masters;
        for (const id in masters) {
            if (masters[id].type === 'theme') {
                return id;
            }
        }
        return 'theme-default';
    }

    applyTextStyle(styleId) {
        if (styleId === '__create__') {
            // Future: Open create style dialog
            console.log('Create style dialog - coming soon');
            return;
        }
        
        const state = store.getState();
        const selection = state.editor.selectedElementIds;
        
        if (styleId === '') {
            // Detach style - just remove styleId, keep current properties
            selection.forEach(id => {
                store.dispatch('UPDATE_ELEMENT', { id, styleId: null });
            });
            this.currentStyleId = null;
            this.updateStyleUI();
            return;
        }
        
        // Get the style definition
        const themeId = this.getActiveThemeId(state);
        const theme = state.masters[themeId];
        const style = theme?.themeSettings?.textStyles?.[styleId];
        
        if (!style) return;
        
        // Apply style properties to selected elements
        selection.forEach(id => {
            const styleProps = this.resolveStyleVariables(style, theme);
            store.dispatch('UPDATE_ELEMENT', { 
                id, 
                styleId: styleId,
                ...styleProps
            });
        });
        
        this.currentStyleId = styleId;
        this.hasStyleOverrides = false;
        this.updateStyleUI();
    }

    resolveStyleVariables(style, theme) {
        // Resolve CSS variable references to actual values
        const resolved = {};
        const fonts = theme?.themeSettings?.fonts || { heading: 'Inter', body: 'Inter' };
        const colors = theme?.themeSettings?.colors || { 
            text1: '#333333', 
            text2: '#666666',
            textPrimary: '#333333', 
            textSecondary: '#666666',
            accent1: '#18A0FB',
            accent: '#18A0FB'
        };
        
        for (const [key, value] of Object.entries(style)) {
            if (key === 'id' || key === 'name') continue;
            
            if (typeof value === 'string') {
                // Resolve font variables
                let resolved_value = value
                    .replace('var(--theme-font-heading)', fonts.heading)
                    .replace('var(--theme-font-body)', fonts.body);
                resolved[key] = resolved_value;
            } else if (typeof value === 'object' && value?.type === 'solid') {
                // Resolve color variables in textFill (support both old and new schema)
                let colorValue = value.value
                    .replace('var(--theme-text1)', colors.text1 || colors.textPrimary)
                    .replace('var(--theme-text2)', colors.text2 || colors.textSecondary)
                    .replace('var(--theme-text-primary)', colors.textPrimary || colors.text1)
                    .replace('var(--theme-text-secondary)', colors.textSecondary || colors.text2)
                    .replace('var(--theme-accent1)', colors.accent1 || colors.accent)
                    .replace('var(--theme-accent)', colors.accent || colors.accent1);
                resolved[key] = { ...value, value: colorValue };
            } else {
                resolved[key] = value;
            }
        }
        
        return resolved;
    }

    openStyleMenu(e) {
        // Simple context menu for style actions
        const existingMenu = document.querySelector('.style-action-menu');
        if (existingMenu) existingMenu.remove();
        
        const menu = document.createElement('div');
        menu.className = 'style-action-menu';
        menu.style.position = 'fixed';
        menu.style.backgroundColor = 'var(--menu-bg)';
        menu.style.border = '1px solid var(--color-border)';
        menu.style.borderRadius = 'var(--radius-sm)';
        menu.style.padding = '4px 0';
        menu.style.zIndex = 'var(--z-popover)';
        menu.style.minWidth = '120px';
        
        const rect = e.target.getBoundingClientRect();
        menu.style.top = (rect.bottom + 4) + 'px';
        menu.style.left = rect.left + 'px';
        
        const actions = [
            { label: 'Edit Style...', action: () => this.editStyle() },
            { label: 'Detach Style', action: () => this.detachStyle() },
            { label: 'Reset to Style', action: () => this.resetToStyle() }
        ];
        
        actions.forEach(({ label, action }) => {
            const item = document.createElement('div');
            item.textContent = label;
            item.style.padding = '6px 12px';
            item.style.fontSize = 'var(--font-size-md)';
            item.style.cursor = 'pointer';
            item.style.color = 'var(--color-text-primary)';
            item.onmouseenter = () => item.style.backgroundColor = 'var(--color-bg-hover)';
            item.onmouseleave = () => item.style.backgroundColor = 'transparent';
            item.onclick = () => {
                menu.remove();
                action();
            };
            menu.appendChild(item);
        });
        
        document.body.appendChild(menu);
        
        // Close on click outside
        const closeHandler = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('mousedown', closeHandler);
            }
        };
        setTimeout(() => document.addEventListener('mousedown', closeHandler), 0);
    }

    editStyle() {
        // Future: Open typography style manager to edit the current style
        console.log('Edit style - Typography Style Manager coming soon');
    }

    detachStyle() {
        const state = store.getState();
        const selection = state.editor.selectedElementIds;
        
        // Remove styleId but keep all current properties
        selection.forEach(id => {
            store.dispatch('UPDATE_ELEMENT', { id, styleId: null });
        });
        
        this.currentStyleId = null;
        this.hasStyleOverrides = false;
        this.updateStyleUI();
    }

    resetToStyle() {
        if (!this.currentStyleId) return;
        
        // Re-apply the style to reset overrides
        this.applyTextStyle(this.currentStyleId);
    }

    updateStyleUI() {
        // Update dropdown value
        this.styleDropdown.setValue(this.currentStyleId || '', false);
        
        // Show/hide style menu button
        this.styleMenuBtn.element.style.visibility = this.currentStyleId ? 'visible' : 'hidden';
        
        // Show/hide override indicator
        this.overrideIndicator.style.display = (this.currentStyleId && this.hasStyleOverrides) ? 'flex' : 'none';
    }

    checkForStyleOverrides(element, style) {
        if (!style) return false;
        
        const state = store.getState();
        const themeId = this.getActiveThemeId(state);
        const theme = state.masters[themeId];
        const resolvedStyle = this.resolveStyleVariables(style, theme);
        
        // Check if any style property differs from element
        for (const key of Object.keys(resolvedStyle)) {
            if (key === 'id' || key === 'name') continue;
            
            const styleVal = resolvedStyle[key];
            const elemVal = element[key];
            
            // Simple comparison (could be more sophisticated for objects)
            if (JSON.stringify(styleVal) !== JSON.stringify(elemVal)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Determines if a color is dark using WCAG luminance formula
     */
    isColorDark(color) {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            const ctx = canvas.getContext('2d');
            if (!ctx) return false; // Fallback for test environment
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, 1, 1);
            const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
            
            const toLinear = (c) => {
                const sRGB = c / 255;
                return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
            };
            const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
            return luminance < 0.5;
        } catch (e) {
            // Fallback for environments without canvas support
            return false;
        }
    }

    /**
     * Updates the swatch border based on color darkness
     */
    updateSwatchBorder(preview, color, isHover = false) {
        const isDark = this.isColorDark(color);
        const opacity = isHover ? 1 : 0.3;
        preview.style.border = 'none';
        preview.style.boxShadow = isDark 
            ? `inset 0 0 0 1px rgba(255, 255, 255, ${opacity})`
            : `inset 0 0 0 1px rgba(0, 0, 0, ${opacity})`;
    }
}
