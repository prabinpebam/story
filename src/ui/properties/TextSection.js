import { BaseSection } from './BaseSection.js';
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

export class TextSection extends BaseSection {
    constructor() {
        super({ title: 'Typography' });
        
        this.container = document.createElement('div');
        this.container.className = 'pi-section-content';
        this.section.appendChild(this.container);

        this.createContent();
        this.activeFlyout = null;
        this.pendingStyles = {}; // Styles to apply to next typed character
        this.currentStyleId = null; // Track current text style
        this.hasStyleOverrides = false; // Track if style has local overrides
        this.isMixedStyleSelection = false;
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
        this.styleDropdown.element.dataset.testid = 'text-style-dropdown';
        styleRow.appendChild(this.styleDropdown.element);

        // Linked/Unlinked Icon Button
        this.linkBtn = new IconButton({
            icon: Icons.LINK,
            title: 'Unlink from style',
            onClick: () => this.unlinkFromStyle()
        });
        this.linkBtn.element.classList.add('text-style-link-btn', 'hidden'); // Hidden when no style
        this.linkBtn.element.dataset.testid = 'text-style-unlink';
        styleRow.appendChild(this.linkBtn.element);

        this.container.appendChild(styleRow);

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
        
        // Hidden by default, shown via .visible class
        this.container.appendChild(this.overrideIndicator);

        // 1. Font Family & Style & Size
        const fontRow = document.createElement('div');
        fontRow.className = 'pi-grid-row cols-2-1-1';

        this.fontFamilyInput = new Dropdown({
            options: FontManager.getAvailableFonts().map(f => ({ label: f.family, value: f.family })),
            value: 'Inter',
            onChange: (val) => {
                FontManager.loadFont(val);
                this.updateProperty('fontFamily', val);
            }
        });
        
        // Store reference to input element for disabling
        this.fontFamilyInput.element.dataset.testid = 'font-family-select';
        this.styleableInputs = [this.fontFamilyInput.element]; // Start tracking styleable inputs

        this.fontWeightInput = new Dropdown({
            options: [
                { label: 'Thin', value: '100' },
                { label: 'Extra Light', value: '200' },
                { label: 'Light', value: '300' },
                { label: 'Regular', value: '400' },
                { label: 'Medium', value: '500' },
                { label: 'Semi Bold', value: '600' },
                { label: 'Bold', value: '700' },
                { label: 'Extra Bold', value: '800' },
                { label: 'Black', value: '900' }
            ],
            value: '400',
            onChange: (val) => this.updateProperty('fontWeight', val)
        });
        this.fontWeightInput.element.dataset.testid = 'font-weight-select';
        this.styleableInputs.push(this.fontWeightInput.element);
        
        this.fontSizeInput = new NumberInput({
            value: 16,
            min: 1,
            scrubbable: true,
            onChange: (val) => this.updateProperty('fontSize', val)
        });
        this.fontSizeInput.element.dataset.testid = 'font-size-input';
        this.styleableInputs.push(this.fontSizeInput.element);

        fontRow.appendChild(this.fontFamilyInput.element);
        fontRow.appendChild(this.fontWeightInput.element);
        fontRow.appendChild(this.fontSizeInput.element);
        this.container.appendChild(fontRow);

        // 2. Text Fill
        this.fillRow = document.createElement('div');
        this.fillRow.className = 'pi-fill-row';
        
        this.createFillControl();
        this.container.appendChild(this.fillRow);

        // 3. Line Height & Letter Spacing
        const spacingRow = document.createElement('div');
        spacingRow.className = 'pi-grid-row cols-1-1';

        this.lineHeightInput = new NumberInput({
            label: 'LH',
            value: 1.2,
            step: 0.1,
            onChange: (val) => this.updateProperty('lineHeight', val)
        });
        this.lineHeightInput.element.dataset.testid = 'line-height-input';
        this.styleableInputs.push(this.lineHeightInput.element);

        this.letterSpacingInput = new NumberInput({
            label: 'LS',
            value: 0,
            step: 0.1,
            units: '%',
            onChange: (val) => this.updateProperty('letterSpacing', val + '%')
        });
        this.letterSpacingInput.element.dataset.testid = 'letter-spacing-input';
        this.styleableInputs.push(this.letterSpacingInput.element);

        spacingRow.appendChild(this.lineHeightInput.element);
        spacingRow.appendChild(this.letterSpacingInput.element);
        this.container.appendChild(spacingRow);

        // 4. Alignment
        const alignRow = document.createElement('div');
        alignRow.className = 'pi-align-row';

        const alignGroup = document.createElement('div');
        alignGroup.className = 'pi-btn-group';

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
            btn.element.dataset.testid = 'align-' + a.value;
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
        this.container.appendChild(alignRow);
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
        combinedInput.className = 'fill-input-group';

        // Swatch
        this.fillSwatch = document.createElement('div');
        this.fillSwatch.className = 'fill-swatch-trigger';
        this.fillSwatch.dataset.testid = 'text-color-swatch';
        
        this.fillPreview = document.createElement('div');
        this.fillPreview.className = 'fill-preview';
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
        this.fillHexInput.className = 'fill-hex-input';
        this.fillHexInput.spellcheck = false;
        this.fillHexInput.dataset.testid = 'text-color-hex';
        
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
        separator.className = 'fill-separator';
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
        
        this.fillOpacityInput.element.className = 'fill-opacity-input';
        this.fillOpacityInput.element.dataset.testid = 'text-color-opacity';
        
        combinedInput.appendChild(this.fillOpacityInput.element);
        
        this.fillRow.appendChild(combinedInput);
    }

    update(selection) {
        super.update(selection);
        const state = store.getState();
        const textElements = this.selection
            .map(id => this.getElement(state, id))
            .filter(el => el && el.type === 'text');

        if (textElements.length === 0) {
            this.element.classList.add('hidden');
            return;
        }
        this.element.classList.remove('hidden');

        // Detect mixed style selection (multiple text elements selected)
        const styleIds = textElements.map(el => el.textStyleId || null);
        const uniqueStyleIds = Array.from(new Set(styleIds));
        this.isMixedStyleSelection = uniqueStyleIds.length > 1;

        const el = textElements[0];
        
        // Update style dropdown options (in case theme changed)
        this.styleDropdown.setOptions(this.getTextStyleOptions());
        
        // Handle Text Style (no legacy support)
        this.currentStyleId = this.isMixedStyleSelection ? null : (el.textStyleId || null);

        // If the element references a style that doesn't exist, show a dedicated option
        if (!this.isMixedStyleSelection && this.currentStyleId) {
            const slideId = state.editor?.activeSlideId;
            const typography = StyleResolver.getTypographyStyle(slideId);
            const textStyles = typography?.textStyles || {};
            if (!textStyles[this.currentStyleId]) {
                const opts = this.getTextStyleOptions();
                opts.splice(1, 0, {
                    label: `Missing Style (${this.currentStyleId})`,
                    value: this.currentStyleId
                });
                this.styleDropdown.setOptions(opts);
            }
        }
        
        // Strict linking UX: do not surface local overrides UI.
        this.hasStyleOverrides = false;
        
        // Use StyleResolver to get effective properties with slide context
        const slideId = state.editor?.activeSlideId;
        const props = StyleResolver.getEffectiveTextProperties(el, {}, slideId);
        
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
        
        // Alignment - toggle active class, CSS handles styling
        this.alignButtons.forEach(({ btn, value, prop }) => {
            if (props[prop] === value) {
                btn.element.classList.add('active');
            } else {
                btn.element.classList.remove('active');
            }
        });
        
        // Text Fill
        this.updateFillUI(props.textFill);
        this.currentTextFill = props.textFill;

        // Apply linked/mixed UI locking after updating displayed values
        // (prevents later UI updates from re-enabling locked controls)
        this.updateStyleUI();
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
             // fill.value should already be resolved from themeSlot by StyleResolver
             const colorValue = fill.value || '#000000';
             this._currentFillColor = colorValue;
             this.fillPreview.style.background = colorValue;
             this.fillPreview.style.backgroundImage = 'none';
             this.updateSwatchBorder(this.fillPreview, colorValue, false);
             
             // Show hex value - if theme-linked, show a visual indicator
             if (fill.themeSlot !== undefined && fill.themeSlot !== null) {
                 // Theme-linked color - show slot number with hex
                 this.fillHexInput.value = colorValue;
                 this.fillHexInput.title = `Theme Slot ${fill.themeSlot + 1}`;
             } else {
                 this.fillHexInput.value = colorValue;
                 this.fillHexInput.title = '';
             }
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

    updateProperty(prop, value) {
        const state = store.getState();
        const selection = state.editor.selectedElementIds;
        const editingElementId = state.editor.editingElementId;
        
        // Check if any selected element has a typography style linked
        // If so, block changes to styleable properties (user must unlink first)
        const styleableProps = [
            'fontFamily',
            'fontWeight',
            'fontSize',
            'fontStyle',
            'lineHeight',
            'letterSpacing',
            'textAlign',
            'verticalAlign',
            'textDecoration',
            'textFill'
        ];
        
        if (styleableProps.includes(prop) && this.currentStyleId) {
            console.warn(`Cannot change ${prop} while linked to typography style. Unlink first.`);
            return;
        }
        
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
        this.updateProperties({ [prop]: value });
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
        const slideId = state.editor?.activeSlideId;
        
        // Use StyleResolver to get typography from cascade
        const typography = StyleResolver.getTypographyStyle(slideId);
        const textStyles = typography?.textStyles || {};
        
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

    applyTextStyle(styleId) {
        if (styleId === '__create__') {
            // Future: Open create style dialog
            console.log('Create style dialog - coming soon');
            return;
        }
        
        const state = store.getState();
        const slideId = state.editor?.activeSlideId;
        
        if (styleId === '') {
            // Detach style - remove textStyleId, keep current rendered properties as manual overrides
            this.updateProperties({ textStyleId: null });
            this.currentStyleId = null;
            this.updateStyleUI();
            return;
        }
        
        // Get the typography style from cascade
        const typography = StyleResolver.getTypographyStyle(slideId);
        const style = typography?.textStyles?.[styleId];
        
        if (!style) return;
        
        // Clear all manual overrides and just set textStyleId
        // The StyleResolver will handle the cascade
        const updates = { 
            textStyleId: styleId,
            // Clear manual overrides to let theme take over
            fontFamily: undefined,
            fontSize: undefined,
            fontWeight: undefined,
            fontStyle: undefined,
            lineHeight: undefined,
            letterSpacing: undefined,
            textAlign: undefined,
            // Keep textFill if custom, or clear to use theme
            // textFill: undefined
        };
        
        this.updateProperties(updates);
        
        this.currentStyleId = styleId;
        this.hasStyleOverrides = false;
        this.updateStyleUI();
    }

    openStyleMenu(e) {
        // Simple context menu for style actions using design system classes
        const existingMenu = document.querySelector('.style-action-menu');
        if (existingMenu) existingMenu.remove();
        
        const menu = document.createElement('div');
        menu.className = 'style-action-menu context-menu visible';
        
        // Position relative to trigger (dynamic positioning required)
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
            item.className = 'context-menu-item';
            
            const labelSpan = document.createElement('span');
            labelSpan.className = 'context-menu-label';
            labelSpan.textContent = label;
            item.appendChild(labelSpan);
            
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
        // Remove textStyleId but keep all current properties as manual overrides
        this.updateProperties({ textStyleId: null });
        
        this.currentStyleId = null;
        this.hasStyleOverrides = false;
        this.updateStyleUI();
    }

    unlinkFromStyle() {
        if (!this.currentStyleId) return;
        
        // Get current element to preserve its rendered properties
        const state = store.getState();
        const textElements = this.selection
            .map(id => this.getElement(state, id))
            .filter(el => el && el.type === 'text');
        
        if (textElements.length === 0) return;
        
        const el = textElements[0];
        const slideId = state.editor?.activeSlideId;
        
        // Get the effective properties from StyleResolver (what's currently rendered)
        const props = StyleResolver.getEffectiveTextProperties(el, {}, slideId);
        
        // Remove textStyleId but set all properties explicitly to maintain appearance
        const updates = {
            textStyleId: null,
            fontFamily: props.fontFamily,
            fontSize: props.fontSize,
            fontWeight: props.fontWeight,
            fontStyle: props.fontStyle,
            lineHeight: props.lineHeight,
            letterSpacing: props.letterSpacing,
            textAlign: props.textAlign,
            textFill: props.textFill
        };
        
        this.updateProperties(updates);
        
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
        if (this.isMixedStyleSelection) {
            if (typeof this.styleDropdown.setMixed === 'function') {
                this.styleDropdown.setMixed(true);
            }
        } else {
            if (typeof this.styleDropdown.setMixed === 'function') {
                this.styleDropdown.setMixed(false);
            }
            this.styleDropdown.setValue(this.currentStyleId || '', false);
        }
        
        // Show/hide link button - visible when style is linked
        const isLinked = !!this.currentStyleId && !this.isMixedStyleSelection;
        this.linkBtn.element.classList.toggle('hidden', !isLinked);
        this.linkBtn.element.title = isLinked ? 'Unlink from style (keeps current values)' : '';

        // Mixed selection should lock controls as well (no single source of truth)
        const shouldLock = isLinked || this.isMixedStyleSelection;
        
        // Disable/enable property inputs based on style link
        this.styleableInputs.forEach(input => {
            if (shouldLock) {
                input.classList.add('disabled');
                input.style.pointerEvents = 'none';
                input.style.opacity = '0.5';
            } else {
                input.classList.remove('disabled');
                input.style.pointerEvents = 'auto';
                input.style.opacity = '1';
            }
        });

        // Disable/enable alignment controls when linked
        if (this.alignButtons) {
            this.alignButtons.forEach(({ btn }) => {
                if (typeof btn?.setDisabled === 'function') {
                    btn.setDisabled(shouldLock);
                } else if (btn?.element) {
                    btn.element.disabled = shouldLock;
                    btn.element.style.pointerEvents = shouldLock ? 'none' : 'auto';
                    btn.element.style.opacity = shouldLock ? '0.5' : '1';
                }
            });
        }

        // Disable/enable fill controls when linked
        if (this.fillSwatch) {
            this.fillSwatch.style.pointerEvents = shouldLock ? 'none' : 'auto';
            this.fillSwatch.style.opacity = shouldLock ? '0.5' : '1';
        }
        if (this.fillHexInput) {
            this.fillHexInput.disabled = shouldLock;
        }
        if (this.fillOpacityInput?.element) {
            this.fillOpacityInput.element.classList.toggle('disabled', shouldLock);
            this.fillOpacityInput.element.style.pointerEvents = shouldLock ? 'none' : 'auto';
            this.fillOpacityInput.element.style.opacity = shouldLock ? '0.5' : '1';
        }
        
        // Strict linking UX: no local overrides UI in the inspector.
        // Keep the indicator hidden even if older documents contain override data.
        this.overrideIndicator.classList.add('hidden');
    }

    checkForStyleOverrides(element, style) {
        if (!style) return false;
        
        // Check if any typography property has been manually overridden
        const overridableProps = [
            'fontFamily', 'fontSize', 'fontWeight', 'fontStyle',
            'lineHeight', 'letterSpacing', 'textAlign', 'textDecoration',
            'textTransform', 'textFill'
        ];
        
        // If element has any of these properties set directly, it's an override
        for (const prop of overridableProps) {
            if (element[prop] !== undefined && element[prop] !== null) {
                // Property exists on element = override
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
