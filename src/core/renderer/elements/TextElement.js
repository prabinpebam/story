import { VisualElement } from './VisualElement.js';
import { StyleResolver } from '../../../utils/StyleResolver.js';

export class TextElement extends VisualElement {
    update(newData) {
        super.update(newData);
        const el = this.data;
        const div = this.domElement;

        if (!div) return;

        // Content
        if (div.innerHTML !== el.content) {
             div.innerHTML = el.content;
        }
        
        // Resolve Properties
        const props = StyleResolver.getEffectiveTextProperties(el);

        // Typography
        div.style.fontFamily = props.fontFamily;
        div.style.fontSize = `${props.fontSize}px`;
        div.style.fontWeight = props.fontWeight;
        div.style.fontStyle = props.fontStyle;
        div.style.lineHeight = props.computedLineHeight ? `${props.computedLineHeight}px` : 'normal';
        
        // Letter Spacing
        if (typeof props.letterSpacing === 'string' && props.letterSpacing.endsWith('%')) {
            const percent = parseFloat(props.letterSpacing);
            div.style.letterSpacing = `${percent / 100}em`;
        } else if (typeof props.letterSpacing === 'number') {
             div.style.letterSpacing = `${props.letterSpacing}px`;
        } else {
             div.style.letterSpacing = props.letterSpacing;
        }

        div.style.textAlign = props.textAlign;
        div.style.textDecoration = props.textDecoration;
        div.style.textTransform = props.textTransform;
        
        // Vertical Align
        div.style.display = 'flex';
        div.style.flexDirection = 'column';
        div.style.justifyContent = this.getJustifyContentForVerticalAlign(props.verticalAlign);
        
        // Text Fill
        this.applyTextFill(div, props.textFill);
        
        this.applyEffects(div, el);
    }

    getJustifyContentForVerticalAlign(align) {
        switch (align) {
            case 'middle': return 'center';
            case 'bottom': return 'flex-end';
            case 'top': default: return 'flex-start';
        }
    }

    applyTextFill(div, fill) {
        if (!fill) {
            // Fallback to black if no fill
            div.style.color = 'black';
            div.style.background = 'none';
            div.style.webkitBackgroundClip = 'border-box';
            div.style.webkitTextFillColor = 'currentcolor';
            return;
        }

        if (fill.type === 'solid') {
            div.style.color = fill.value;
            div.style.background = 'none';
            div.style.webkitBackgroundClip = 'border-box';
            div.style.webkitTextFillColor = 'currentcolor';
        } else if (fill.type === 'gradient') {
            const gradientCss = this.getGradientCss(fill.value);
            div.style.background = gradientCss;
            div.style.webkitBackgroundClip = 'text';
            div.style.webkitTextFillColor = 'transparent';
            div.style.color = 'transparent'; 
        } else if (fill.type === 'image') {
             div.style.background = `url(${fill.value.src}) center / cover no-repeat`;
             div.style.webkitBackgroundClip = 'text';
             div.style.webkitTextFillColor = 'transparent';
             div.style.color = 'transparent';
        }
    }

    getGradientCss(gradient) {
        if (gradient.type === 'linear') {
            const stops = gradient.stops.map(s => `${s.color} ${s.position * 100}%`).join(', ');
            return `linear-gradient(${gradient.angle}deg, ${stops})`;
        } else if (gradient.type === 'radial') {
             const stops = gradient.stops.map(s => `${s.color} ${s.position * 100}%`).join(', ');
             return `radial-gradient(circle, ${stops})`;
        }
        return 'black';
    }

    applyEffects(div, el) {
        // Shadow
        if (el.style?.dropShadow && el.style.dropShadow.visible !== false) {
            const { x, y, blur, color } = el.style.dropShadow;
            div.style.textShadow = `${x}px ${y}px ${blur}px ${color}`;
            div.style.boxShadow = 'none';
        } else {
            div.style.textShadow = 'none';
            div.style.boxShadow = 'none';
        }

        // Blur
        const blur = el.style?.blur;
        if (blur && blur.visible !== false) {
            const radius = (typeof blur === 'object') ? blur.radius : blur;
            div.style.filter = `blur(${radius}px)`;
        } else {
            div.style.filter = 'none';
        }
    }

    setEditing(isEditing) {
        const div = this.domElement;
        if (!div) return;

        if (isEditing) {
            if (!div.isContentEditable) {
                div.contentEditable = true;
                div.style.outline = '2px solid #0055FF';
                div.style.cursor = 'text';
                div.style.pointerEvents = 'auto';
                div.focus();
                
                // We need to import store to dispatch updates?
                // Or pass a callback?
                // VisualElement shouldn't depend on store ideally.
                // But for now, let's dispatch custom event on the element?
                // Or just import store.
            }
        } else {
            if (div.isContentEditable) {
                div.contentEditable = false;
                div.style.outline = 'none';
                div.style.cursor = 'default';
                div.blur();
            }
        }
    }
}
