import { VisualElement } from './VisualElement.js';
import { StyleResolver } from '../../../utils/StyleResolver.js';
import { store } from '../../Store.js';

export class TextElement extends VisualElement {
    mount(container) {
        const el = super.mount(container);
        
        this.resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                if (entry.target === this.domElement) {
                    this.handleResize(entry);
                }
            }
        });
        this.resizeObserver.observe(this.domElement);
        
        return el;
    }

    unmount() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        super.unmount();
    }

    handleResize(entry) {
        const state = store.getState();
        // Don't update if we are dragging/resizing manually or interacting
        if (state.ui && state.ui.isInteracting) return;

        const el = this.data;
        const resizing = el.style?.resizing || 'autoHeight';
        
        // Only sync if auto-sizing is enabled
        if (resizing !== 'autoHeight' && resizing !== 'autoWidth') return;

        let width, height;
        if (entry.borderBoxSize && entry.borderBoxSize.length > 0) {
            width = entry.borderBoxSize[0].inlineSize;
            height = entry.borderBoxSize[0].blockSize;
        } else {
            width = entry.contentRect.width;
            height = entry.contentRect.height;
        }

        const updates = {};
        let changed = false;

        if (resizing === 'autoHeight' && Math.abs(height - el.height) > 1) {
            updates.height = height;
            changed = true;
        }
        
        // Prevent update loops by checking if we are already editing this element
        // If we are editing, the blur handler will save the final size.
        // But we want the selection box to update LIVE.
        // CanvasManager draws based on store. So we DO need to update store.
        // But updating store triggers render...
        // TextElement.update() sets style.height.
        // If we update store, TextElement.update() is called.
        // It sets style.height = 'auto' (if autoHeight).
        // DOM size remains same. ResizeObserver shouldn't fire again.
        // So it should be safe.

        if (changed) {
            store.dispatch('UPDATE_ELEMENT', { id: el.id, ...updates });
        }
    }

    update(newData) {
        super.update(newData);
        const el = this.data;
        const div = this.domElement;

        if (!div) return;

        // Ensure no padding/border/margin interferes with size calculations
        div.style.padding = '0';
        div.style.margin = '0';
        div.style.border = 'none';
        div.style.boxSizing = 'border-box';
        div.style.overflow = 'visible'; // Allow text to be seen, but box is defined by ResizeObserver

        // Content
        if (div.innerHTML !== el.content) {
             div.innerHTML = el.content;
        }

        // Aggressively reset children margins/padding on EVERY update
        const resetChild = (child) => {
            child.style.margin = '0';
            child.style.padding = '0';
            child.style.border = 'none';
            child.style.outline = 'none';
            child.style.verticalAlign = 'baseline';
            
            // List specific
            if (child.tagName === 'UL' || child.tagName === 'OL') {
                child.style.paddingLeft = '1.5em';
            }
        };

        Array.from(div.children).forEach(resetChild);
        
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
        div.style.textIndent = `${props.paragraphIndent || 0}px`;
        
        // Lists
        if (props.listStyle && props.listStyle !== 'none') {
            div.style.listStyleType = props.listStyle === 'bullet' ? 'disc' : 'decimal';
            div.style.listStylePosition = 'inside'; // Or outside with padding
            // For list spacing, we might need to target children or use line-height
            // But without structure, it's hard.
        } else {
            div.style.listStyleType = 'none';
        }

        // Vertical Trim (Cap Height)
        if (props.verticalTrim === 'capHeight') {
            // This is a simplification. Real cap-height trim requires font metrics.
            // We'll just tighten the line-height.
            div.style.lineHeight = '1'; 
        }

        // Truncation
        if (props.truncate) {
            div.style.display = '-webkit-box';
            div.style.webkitLineClamp = props.maxLines || 1;
            div.style.webkitBoxOrient = 'vertical';
            div.style.overflow = 'hidden';
            div.style.textOverflow = 'ellipsis';
        } else {
            // Reset if not truncated (but keep flex for vertical align if needed?)
            // Vertical Align uses flex. Truncation uses -webkit-box. They conflict.
            // If truncated, vertical align might break.
            // -webkit-box behaves like block/flex.
            
            if (!props.truncate) {
                div.style.display = 'flex';
                div.style.webkitLineClamp = 'unset';
                div.style.webkitBoxOrient = 'unset';
                div.style.overflow = 'visible';
                div.style.textOverflow = 'clip';
            }
        }
        
        // Vertical Align (Only if not truncated, or try to combine)
        if (!props.truncate) {
            div.style.display = 'flex';
            div.style.flexDirection = 'column';
            div.style.justifyContent = this.getJustifyContentForVerticalAlign(props.verticalAlign);
        }
        
        // Auto Resize Override
        // VisualElement sets fixed width/height. We override height if auto-sizing.
        const resizing = el.style?.resizing || 'autoHeight';
        if (resizing === 'autoHeight' && !props.truncate) {
            div.style.height = 'auto';
            div.style.minHeight = '1em'; // Prevent complete collapse
            div.style.alignItems = 'flex-start'; // Ensure content aligns to top
            div.style.display = 'flex';
            div.style.flexDirection = 'column';
        }

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
                // div.style.outline = '2px solid #0055FF'; // Removed: Canvas handles selection box now
                div.style.outline = 'none';
                div.style.cursor = 'text';
                div.style.pointerEvents = 'auto';
                div.focus({ preventScroll: true });
                
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
