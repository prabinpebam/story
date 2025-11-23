import { VisualElement } from './VisualElement.js';

export class TextElement extends VisualElement {
    update(newData) {
        super.update(newData);
        const el = this.data;
        const div = this.domElement;

        if (!div) return;

        // Content
        // We check inequality to avoid resetting cursor position if this update comes from typing
        if (div.innerHTML !== el.content) {
             div.innerHTML = el.content;
        }
        
        // Typography
        div.style.fontFamily = el.style?.fontFamily || 'Inter';
        div.style.fontSize = `${el.style?.fontSize || 16}px`;
        div.style.fontWeight = el.style?.fontWeight || '400';
        div.style.lineHeight = el.style?.lineHeight || '1.2';
        div.style.letterSpacing = `${el.style?.letterSpacing || 0}px`;
        div.style.color = el.style?.color || 'black';
        div.style.textAlign = el.style?.textAlign || 'left';
        
        this.applyEffects(div, el);
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
