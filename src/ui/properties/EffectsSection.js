import { Section } from '../components/Section.js';
import { ColorInput } from '../components/ColorInput.js';
import { NumberInput } from '../components/NumberInput.js';
import { IconButton } from '../components/IconButton.js';
import { Dropdown } from '../components/Dropdown.js';
import { Flyout } from '../components/Flyout.js';
import { SegmentedControl } from '../components/SegmentedControl.js';
import { Icons } from '../Icons.js';
import { store } from '../../core/Store.js';
import { EmptyState } from '../components/EmptyState.js';

export class EffectsSection {
    constructor() {
        this.section = new Section({ 
            title: 'Effects',
            collapsed: false,
            actions: [
                { icon: Icons.STYLES, title: 'Effect Styles', onClick: () => {} },
                { icon: Icons.PLUS, title: 'Add Effect', onClick: () => this.addEffect() }
            ]
        });
        this.container = document.createElement('div');
        this.container.className = 'pi-section-content pi-gap-0';
        this.section.appendChild(this.container);
        this.activeFlyout = null;
        this.activeEffectType = null;
    }

    update(selection) {
        if (!selection || selection.length === 0) {
            this.section.element.classList.add('hidden');
            return;
        }
        
        this.section.element.classList.remove('hidden');
        this.selection = selection;
        
        const state = store.getState();
        const element = this.getElement(state, selection[0]);
        
        if (element) {
            this.render(element);
        }
    }

    getElement(state, id) {
        const mode = state.editor.mode;
        if (mode === 'master') {
            const master = state.slideMasterPresets[state.editor.activeMasterId];
            return master?.elements[id];
        } else {
            const slide = state.slides[state.editor.activeSlideId];
            return slide?.elements[id];
        }
    }

    render(element) {
        this.container.innerHTML = '';
        
        const style = element.style || {};
        const dropShadow = style.dropShadow;
        const blur = style.blur;
        const backgroundBlur = style.backgroundBlur;
        
        const hasEffects = dropShadow || blur || backgroundBlur;

        // Auto-collapse/expand based on content
        // If effects exist, expand. If not, collapse.
        // this.section.setCollapsed(!hasEffects); // User wants empty state visible

        if (!hasEffects) {
            const empty = new EmptyState('No effects');
            this.container.appendChild(empty.element);
            return;
        }

        if (dropShadow) {
            this.renderEffectRow(
                'dropShadow',
                'Drop Shadow', 
                Icons.EFFECT_SHADOW, 
                this.activeEffectType === 'dropShadow',
                dropShadow.visible !== false,
                (trigger) => this.openShadowFlyout(dropShadow, trigger), 
                () => this.toggleVisibility('dropShadow'),
                () => this.removeEffect('dropShadow')
            );
        }

        if (blur) {
            this.renderEffectRow(
                'blur',
                'Layer Blur', 
                Icons.EFFECT_BLUR, 
                this.activeEffectType === 'blur',
                blur.visible !== false,
                (trigger) => this.openBlurFlyout(blur, trigger), 
                () => this.toggleVisibility('blur'),
                () => this.removeEffect('blur')
            );
        }

        if (backgroundBlur) {
            this.renderEffectRow(
                'backgroundBlur',
                'Background Blur', 
                Icons.EFFECT_BG_BLUR, 
                this.activeEffectType === 'backgroundBlur',
                backgroundBlur.visible !== false,
                (trigger) => this.openBackgroundBlurFlyout(backgroundBlur, trigger), 
                () => this.toggleVisibility('backgroundBlur'),
                () => this.removeEffect('backgroundBlur')
            );
        }
    }

    renderEffectRow(type, name, icon, isActive, isVisible, onEdit, onToggleVisibility, onRemove) {
        const row = document.createElement('div');
        row.dataset.effectType = type;
        row.className = 'pi-row pi-effect-row';
        if (isActive) row.classList.add('active');
        if (!isVisible) row.classList.add('invisible');
        
        // Left: Icon + Name
        const left = document.createElement('div');
        left.className = 'pi-effect-row-left';
        
        // Small indicator icon
        const indicator = document.createElement('div');
        indicator.innerHTML = icon;
        indicator.className = 'pi-effect-indicator';
        
        const label = document.createElement('div');
        label.textContent = name;
        label.className = 'pi-effect-label';
        
        left.appendChild(indicator);
        left.appendChild(label);
        
        // Click on row opens flyout
        left.onclick = (e) => {
            // Use the row itself as trigger if needed, or just pass the event target
            onEdit(row);
        };
        
        // Right: Visibility + Remove
        const right = document.createElement('div');
        right.className = 'pi-effect-row-right';
        
        const visibleBtn = new IconButton({
            icon: isVisible ? Icons.VISIBLE : Icons.HIDDEN,
            title: 'Toggle Visibility',
            onClick: (e) => {
                e.stopPropagation();
                onToggleVisibility();
            }
        });

        const removeBtn = new IconButton({
            icon: Icons.MINUS,
            title: 'Remove Effect',
            onClick: (e) => {
                e.stopPropagation();
                onRemove();
            }
        });
        
        right.appendChild(visibleBtn.element);
        right.appendChild(removeBtn.element);
        
        row.appendChild(left);
        row.appendChild(right);
        
        this.container.appendChild(row);
    }

    openShadowFlyout(shadow, trigger) {
        this.setActiveEffect('dropShadow');
        const newTrigger = this.container.querySelector('[data-effect-type="dropShadow"]');
        if (this.activeFlyout) this.activeFlyout.close();

        const content = document.createElement('div');
        content.className = 'pi-flyout-content';

        // Header: Type + Blend + Close
        const header = document.createElement('div');
        header.className = 'pi-flyout-header';

        const typeSelect = new Dropdown({
            options: [
                { label: 'Drop Shadow', value: 'dropShadow' },
                { label: 'Layer Blur', value: 'blur' },
                { label: 'Background Blur', value: 'backgroundBlur' }
            ],
            value: 'dropShadow',
            size: 'lg',
            onChange: (val) => this.changeEffectType('dropShadow', val)
        });

        const headerRight = document.createElement('div');
        headerRight.className = 'pi-effect-row-right';

        // Blend Mode Dropdown (replacing the icon button)
        const blendModes = [
            { label: 'Normal', value: 'normal' },
            { label: 'Multiply', value: 'multiply' },
            { label: 'Screen', value: 'screen' },
            { label: 'Overlay', value: 'overlay' },
            { label: 'Darken', value: 'darken' },
            { label: 'Lighten', value: 'lighten' },
            { label: 'Color Dodge', value: 'color-dodge' },
            { label: 'Color Burn', value: 'color-burn' },
            { label: 'Hard Light', value: 'hard-light' },
            { label: 'Soft Light', value: 'soft-light' },
            { label: 'Difference', value: 'difference' },
            { label: 'Exclusion', value: 'exclusion' },
            { label: 'Hue', value: 'hue' },
            { label: 'Saturation', value: 'saturation' },
            { label: 'Color', value: 'color' },
            { label: 'Luminosity', value: 'luminosity' }
        ];

        // Note: This sets the blend mode of the SHADOW.
        // We need to fetch the current blend mode from the shadow style.
        const state = store.getState();
        const element = this.getElement(state, this.selection[0]);
        const currentBlendMode = element.style?.dropShadow?.blendMode || 'normal';

        const blendDropdown = new Dropdown({
            options: blendModes,
            value: currentBlendMode,
            size: 'sm',
            onChange: (val) => this.updateDropShadow('blendMode', val)
        });

        const closeBtn = new IconButton({ icon: Icons.CLOSE, title: 'Close', onClick: () => this.activeFlyout.close() });

        headerRight.appendChild(blendDropdown.element);
        headerRight.appendChild(closeBtn.element);

        header.appendChild(typeSelect.element);
        header.appendChild(headerRight);
        content.appendChild(header);

        // X / Y
        const row1 = document.createElement('div');
        row1.className = 'pi-flyout-row';
        
        const xInput = new NumberInput({ value: shadow.x, label: 'X', onChange: (v, isTransient) => this.updateDropShadow('x', v, isTransient) });
        const yInput = new NumberInput({ value: shadow.y, label: 'Y', onChange: (v, isTransient) => this.updateDropShadow('y', v, isTransient) });
        
        xInput.element.classList.add('pi-flex-1');
        yInput.element.classList.add('pi-flex-1');
        
        row1.appendChild(xInput.element);
        row1.appendChild(yInput.element);
        content.appendChild(row1);

        // Blur / Spread
        const row2 = document.createElement('div');
        row2.className = 'pi-flyout-row';
        
        const bInput = new NumberInput({ value: shadow.blur, label: 'Blur', min: 0, onChange: (v, isTransient) => this.updateDropShadow('blur', v, isTransient) });
        const sInput = new NumberInput({ value: shadow.spread, label: 'Spread', onChange: (v, isTransient) => this.updateDropShadow('spread', v, isTransient) });
        
        bInput.element.classList.add('pi-flex-1');
        sInput.element.classList.add('pi-flex-1');
        
        row2.appendChild(bInput.element);
        row2.appendChild(sInput.element);
        content.appendChild(row2);

        // Color & Opacity
        const row3 = document.createElement('div');
        row3.className = 'pi-flyout-row-center';

        const colorInput = new ColorInput(
            shadow.color,
            (v, isTransient) => this.updateShadowColor(v, isTransient)
        );
        colorInput.element.classList.add('pi-flex-1');

        const opacityInput = new NumberInput({ 
            value: this.getOpacityFromColor(shadow.color),
            label: '%', 
            min: 0, max: 100,
            onChange: (v, isTransient) => this.updateShadowOpacity(v, isTransient)
        });
        opacityInput.element.classList.add('pi-width-60');

        row3.appendChild(colorInput.element);
        row3.appendChild(opacityInput.element);
        content.appendChild(row3);

        this.activeFlyout = new Flyout({
            trigger: newTrigger || trigger,
            content: content,
            position: 'left',
            onClose: () => { 
                this.activeFlyout = null; 
                this.setActiveEffect(null);
            }
        });
        this.activeFlyout.open();
    }

    openBlurFlyout(blurData, trigger) {
        this.setActiveEffect('blur');
        const newTrigger = this.container.querySelector('[data-effect-type="blur"]');
        if (this.activeFlyout) this.activeFlyout.close();

        const content = document.createElement('div');
        content.className = 'pi-flyout-content';

        // Header
        const header = document.createElement('div');
        header.className = 'pi-flyout-header';

        const typeSelect = new Dropdown({
            options: [
                { label: 'Drop Shadow', value: 'dropShadow' },
                { label: 'Layer Blur', value: 'blur' },
                { label: 'Background Blur', value: 'backgroundBlur' }
            ],
            value: 'blur',
            size: 'lg',
            onChange: (val) => this.changeEffectType('blur', val)
        });

        const closeBtn = new IconButton({ icon: Icons.CLOSE, title: 'Close', onClick: () => this.activeFlyout.close() });
        header.appendChild(typeSelect.element);
        header.appendChild(closeBtn.element);
        content.appendChild(header);

        // Blur Mode Toggle (Uniform vs Progressive)
        const modeControl = new SegmentedControl(
            [
                { label: 'Uniform', value: 'uniform' },
                { label: 'Progressive', value: 'progressive' }
            ],
            blurData.type || 'uniform',
            (val) => this.updateBlur('type', val)
        );
        content.appendChild(modeControl.element);

        // Blur Intensity
        const radiusValue = (typeof blurData === 'number') ? blurData : (blurData.radius !== undefined ? blurData.radius : 4);
        const blurInput = new NumberInput({ 
            value: radiusValue,
            label: Icons.GRID_3X3, // Grid icon
            min: 0, 
            onChange: (v, isTransient) => this.updateBlur('radius', v, isTransient) 
        });
        content.appendChild(blurInput.element);

        this.activeFlyout = new Flyout({
            trigger: newTrigger || trigger,
            content: content,
            position: 'left',
            onClose: () => { 
                this.activeFlyout = null; 
                this.setActiveEffect(null);
            }
        });
        this.activeFlyout.open();
    }

    openBackgroundBlurFlyout(blurData, trigger) {
        this.setActiveEffect('backgroundBlur');
        const newTrigger = this.container.querySelector('[data-effect-type="backgroundBlur"]');
        if (this.activeFlyout) this.activeFlyout.close();

        const content = document.createElement('div');
        content.className = 'pi-flyout-content';

        // Header
        const header = document.createElement('div');
        header.className = 'pi-flyout-header';

        const typeSelect = new Dropdown({
            options: [
                { label: 'Drop Shadow', value: 'dropShadow' },
                { label: 'Layer Blur', value: 'blur' },
                { label: 'Background Blur', value: 'backgroundBlur' }
            ],
            value: 'backgroundBlur',
            size: 'lg',
            onChange: (val) => this.changeEffectType('backgroundBlur', val)
        });

        const closeBtn = new IconButton({ icon: Icons.CLOSE, title: 'Close', onClick: () => this.activeFlyout.close() });
        header.appendChild(typeSelect.element);
        header.appendChild(closeBtn.element);
        content.appendChild(header);

        // Blur Intensity
        const radiusValue = (typeof blurData === 'number') ? blurData : (blurData.radius !== undefined ? blurData.radius : 4);
        const blurInput = new NumberInput({ 
            value: radiusValue,
            label: Icons.GRID_3X3,
            min: 0, 
            onChange: (v, isTransient) => this.updateBackgroundBlur('radius', v, isTransient) 
        });
        content.appendChild(blurInput.element);

        this.activeFlyout = new Flyout({
            trigger: newTrigger || trigger,
            content: content,
            position: 'left',
            onClose: () => { 
                this.activeFlyout = null; 
                this.setActiveEffect(null);
            }
        });
        this.activeFlyout.open();
    }

    addEffect() {
        // Ensure section is expanded when adding an effect
        this.section.setCollapsed(false);

        this.selection.forEach(id => {
            const state = store.getState();
            const el = this.getElement(state, id);
            const style = el.style || {};
            
            if (!style.dropShadow) {
                this.updateStyle('dropShadow', { x: 0, y: 4, blur: 4, spread: 0, color: '#00000080' });
            } else if (!style.blur) {
                this.updateStyle('blur', { radius: 4, type: 'uniform' });
            }
        });
    }

    removeEffect(type) {
        this.updateStyle(type, null);
    }

    updateDropShadow(prop, value, isTransient = false) {
        this.selection.forEach(id => {
            const state = store.getState();
            const el = this.getElement(state, id);
            const current = el.style?.dropShadow || {};
            this.updateStyle('dropShadow', { ...current, [prop]: value }, isTransient);
        });
    }

    updateBlur(prop, value, isTransient = false) {
        this.selection.forEach(id => {
            const state = store.getState();
            const el = this.getElement(state, id);
            // Handle legacy number format if necessary, though we should migrate to object
            let current = el.style?.blur;
            if (typeof current === 'number') current = { radius: current, type: 'uniform' };
            else if (!current) current = { radius: 4, type: 'uniform' };
            
            this.updateStyle('blur', { ...current, [prop]: value }, isTransient);
        });
    }

    updateBackgroundBlur(prop, value, isTransient = false) {
        this.selection.forEach(id => {
            const state = store.getState();
            const el = this.getElement(state, id);
            const current = el.style?.backgroundBlur || {};
            this.updateStyle('backgroundBlur', { ...current, [prop]: value }, isTransient);
        });
    }

    updateStyle(prop, value, isTransient = false) {
        this.selection.forEach(id => {
            const state = store.getState();
            const el = this.getElement(state, id);
            const newStyle = { ...(el.style || {}), [prop]: value };
            store.dispatch('UPDATE_ELEMENT', { id, style: newStyle }, { skipHistory: isTransient });
        });
        // Force re-render if needed, though store subscription should handle it
        const state = store.getState();
        const element = this.getElement(state, this.selection[0]);
        this.render(element);
    }

    setActiveEffect(type) {
        this.activeEffectType = type;
        // Re-render to update highlights
        if (this.selection && this.selection.length > 0) {
            const state = store.getState();
            const element = this.getElement(state, this.selection[0]);
            if (element) this.render(element);
        }
    }

    changeEffectType(oldType, newType) {
        if (oldType === newType) return;

        // 1. Remove old effect
        this.removeEffect(oldType);

        // 2. Add new effect with defaults
        let defaultData;
        if (newType === 'dropShadow') {
            defaultData = { x: 0, y: 4, blur: 4, spread: 0, color: '#00000080' };
        } else if (newType === 'blur') {
            defaultData = { radius: 4, type: 'uniform' };
        } else if (newType === 'backgroundBlur') {
            defaultData = { radius: 4 };
        }

        this.updateStyle(newType, defaultData);

        // 3. Re-open flyout for new type
        this.activeEffectType = newType;
        if (this.activeFlyout) this.activeFlyout.close();
    }

    toggleVisibility(type) {
        this.selection.forEach(id => {
            const state = store.getState();
            const el = this.getElement(state, id);
            const current = el.style?.[type] || {};
            // If visible is undefined, it's true. So toggle means false.
            const newVisible = current.visible === false ? true : false;
            this.updateStyle(type, { ...current, visible: newVisible });
        });
    }

    getOpacityFromColor(color) {
        if (!color) return 100;
        if (color.startsWith('#')) {
            if (color.length === 9) {
                const alpha = parseInt(color.slice(7, 9), 16);
                return Math.round((alpha / 255) * 100);
            }
            return 100;
        }
        if (color.startsWith('rgba')) {
            const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
            if (match && match[4] !== undefined) {
                return Math.round(parseFloat(match[4]) * 100);
            }
            return 100;
        }
        return 100;
    }

    applyOpacityToColor(color, opacity) {
        // Ensure opacity is 0-100
        opacity = Math.max(0, Math.min(100, opacity));
        const alpha = Math.round((opacity / 100) * 255);
        const alphaHex = alpha.toString(16).padStart(2, '0');

        if (!color) return '#000000' + alphaHex;

        if (color.startsWith('#')) {
            // Strip existing alpha if present (length 9)
            const base = color.length === 9 ? color.slice(0, 7) : color;
            return base + alphaHex;
        }
        
        if (color.startsWith('rgb')) {
            // Parse rgb/rgba and reconstruct
            const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (match) {
                return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${opacity / 100})`;
            }
        }
        
        return color; // Fallback
    }

    updateShadowOpacity(opacity, isTransient = false) {
        this.selection.forEach(id => {
            const state = store.getState();
            const el = this.getElement(state, id);
            const current = el.style?.dropShadow || {};
            const newColor = this.applyOpacityToColor(current.color || '#000000', opacity);
            this.updateStyle('dropShadow', { ...current, color: newColor }, isTransient);
        });
    }

    updateShadowColor(newBaseColor, isTransient = false) {
        this.selection.forEach(id => {
            const state = store.getState();
            const el = this.getElement(state, id);
            const current = el.style?.dropShadow || {};
            const currentOpacity = this.getOpacityFromColor(current.color);
            
            // newBaseColor is likely #RRGGBB from the picker
            // We want to preserve the current opacity
            const finalColor = this.applyOpacityToColor(newBaseColor, currentOpacity);
            
            this.updateStyle('dropShadow', { ...current, color: finalColor }, isTransient);
        });
    }

    updateBlendMode(mode) {
        this.selection.forEach(id => {
            store.dispatch('UPDATE_ELEMENT', { id, blendMode: mode });
        });
    }
}
