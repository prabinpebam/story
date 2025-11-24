import { Section } from '../components/Section.js';
import { NumberInput } from '../components/NumberInput.js';
import { IconButton } from '../components/IconButton.js';
import { Dropdown } from '../components/Dropdown.js';
import { Icons } from '../Icons.js';
import { store } from '../../core/Store.js';
import { StyleResolver } from '../../utils/StyleResolver.js';
import FontManager from '../../core/FontManager.js';
import { FillFlyout } from '../components/FillFlyout/FillFlyout.js';
import { ColorUtils } from '../../utils/ColorUtils.js';

export class TextSection {
    constructor() {
        this.section = new Section({ title: 'Typography' });
        this.createContent();
        this.activeFlyout = null;
    }

    createContent() {
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
            onClick: () => {
                console.log('Open Type Settings');
            }
        });

        alignRow.appendChild(alignGroup);
        alignRow.appendChild(settingsBtn.element);
        this.section.appendChild(alignRow);
    }

    createFillControl() {
        // Combined Input Group (Swatch + Hex + Opacity)
        const combinedInput = document.createElement('div');
        combinedInput.style.flex = '1';
        combinedInput.style.display = 'flex';
        combinedInput.style.alignItems = 'center';
        combinedInput.style.border = '1px solid #444';
        combinedInput.style.borderRadius = '4px';
        combinedInput.style.height = '24px';
        combinedInput.style.overflow = 'hidden';
        combinedInput.style.backgroundColor = '#262626';

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
        this.fillPreview.style.width = '14px';
        this.fillPreview.style.height = '14px';
        this.fillPreview.style.borderRadius = '2px';
        this.fillPreview.style.border = '1px solid rgba(255,255,255,0.1)';
        this.fillSwatch.appendChild(this.fillPreview);
        
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
        this.fillHexInput.style.color = '#ccc';
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
        separator.style.backgroundColor = '#444';
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
             this.fillHexInput.value = 'Image';
             this.fillHexInput.disabled = true;
        } else if (fill.type === 'gradient') {
             this.fillPreview.style.background = this.getGradientCss(fill.value);
             this.fillHexInput.value = 'Gradient';
             this.fillHexInput.disabled = true;
        } else {
             // Solid
             this.fillPreview.style.background = fill.value;
             this.fillPreview.style.backgroundImage = 'none';
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
        if (gradient.type === 'linear') {
            const stops = gradient.stops.map(s => `${s.color} ${s.position * 100}%`).join(', ');
            return `linear-gradient(90deg, ${stops})`;
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
        selection.forEach(id => {
            store.dispatch('UPDATE_ELEMENT', { id, [prop]: value });
        });
    }

    updateTextFill(newFill) {
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
            this.activeFlyout.element.remove();
            this.activeFlyout = null;
        }

        const flyout = new FillFlyout({
            fill: this.currentTextFill || { type: 'solid', value: '#000000' },
            onChange: (updates, isTransient) => {
                const current = this.currentTextFill || { type: 'solid', value: '#000000' };
                const newFill = { ...current, ...updates };
                
                if (updates.type && updates.type !== current.type) {
                    if (updates.type === 'solid') newFill.value = '#000000';
                    if (updates.type === 'gradient') newFill.value = { type: 'linear', stops: [{color:'#000', position:0}, {color:'#fff', position:1}], angle: 90 };
                }
                
                if (updates.color && newFill.type === 'solid') {
                    newFill.value = updates.color;
                }
                
                this.updateTextFill(newFill);
            },
            onClose: () => {
                if (this.activeFlyout) {
                    this.activeFlyout.element.remove();
                    this.activeFlyout = null;
                }
            }
        });

        document.body.appendChild(flyout.element);
        
        const rect = target.getBoundingClientRect();
        const flyoutRect = flyout.element.getBoundingClientRect();
        
        let left = rect.left - flyoutRect.width - 10;
        let top = rect.top;
        
        if (left < 0) left = rect.right + 10;
        
        flyout.element.style.left = `${left}px`;
        flyout.element.style.top = `${top}px`;
        
        this.activeFlyout = flyout;
        
        const closeHandler = (e) => {
            if (this.activeFlyout && !this.activeFlyout.element.contains(e.target) && !target.contains(e.target)) {
                this.activeFlyout.element.remove();
                this.activeFlyout = null;
                document.removeEventListener('mousedown', closeHandler);
            }
        };
        setTimeout(() => document.addEventListener('mousedown', closeHandler), 0);
    }
}
