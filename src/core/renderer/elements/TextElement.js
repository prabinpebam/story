import { VisualElement } from './VisualElement.js';
import { StyleResolver } from '../../../utils/StyleResolver.js';
import { store } from '../../Store.js';
import { CodeRunner } from '../../effects/CodeRunner.js';

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
        if (this.codeRunner) {
            this.codeRunner.stop();
            this.codeRunner = null;
        }
        super.unmount();
    }

    handleResize(entry) {
        const state = store.getState();
        // Don't update if we are dragging/resizing manually or interacting
        if (state.ui && state.ui.isInteracting) return;
        
        // Don't dispatch updates while editing - let the blur handler save final size
        // This prevents re-renders during typing which can cause focus issues
        if (state.editor.editingElementId === this.data.id) return;

        const el = this.data;
        const resizing = el.style?.resizing || 'autoHeight';
        
        // Only sync if auto-sizing is enabled (not fixed)
        if (resizing === 'fixed') return;

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

        // Auto Height: width is fixed, height auto-adjusts to content
        if (resizing === 'autoHeight' && Math.abs(height - el.height) > 1) {
            updates.height = height;
            changed = true;
        }
        
        // Auto Width: height is fixed, width auto-adjusts to content
        if (resizing === 'autoWidth' && Math.abs(width - el.width) > 1) {
            updates.width = width;
            changed = true;
        }

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

        // Content - only update if not currently being edited
        // When editing, the user's changes are in the DOM and we don't want to overwrite them
        if (!div.isContentEditable && div.innerHTML !== el.content) {
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
        
        // Auto Resize Mode Override
        // VisualElement sets fixed width/height from element data. We override based on resizing mode.
        const resizing = el.style?.resizing || 'autoHeight';
        
        if (resizing === 'autoHeight' && !props.truncate) {
            // Auto Height: Width is fixed (from element data), height auto-adjusts to content
            div.style.width = `${el.width}px`;
            div.style.height = 'auto';
            div.style.minHeight = '1em'; // Prevent complete collapse
            div.style.whiteSpace = 'pre-wrap'; // Allow text to wrap within fixed width
            div.style.wordWrap = 'break-word';
            div.style.overflow = 'visible';
        } else if (resizing === 'autoWidth') {
            // Auto Width: Height is fixed (from element data), width auto-adjusts to content
            div.style.width = 'auto';
            div.style.minWidth = '1em'; // Prevent complete collapse
            div.style.maxWidth = 'none';
            div.style.height = `${el.height}px`;
            div.style.whiteSpace = 'nowrap'; // Single line, width expands
            div.style.overflow = 'visible';
        } else {
            // Fixed: Both width and height are fixed from element data
            div.style.width = `${el.width}px`;
            div.style.height = `${el.height}px`;
            div.style.whiteSpace = 'pre-wrap'; // Allow text to wrap
            div.style.wordWrap = 'break-word';
            div.style.overflow = 'hidden'; // Hide overflow in fixed mode
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
        // Stop previous runner if exists
        if (this.codeRunner && (!fill || fill.type !== 'code')) {
            this.codeRunner.stop();
            this.codeRunner = null;
        }

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
        } else if (fill.type === 'code') {
            this.applyCodeFill(div, fill);
        }
    }

    applyCodeFill(div, fill) {
        if (!this.codeRunner) {
            const canvas = document.createElement('canvas');
            // Set resolution based on element size (or fixed high res)
            // We need to update this if element resizes
            canvas.width = div.offsetWidth || 100;
            canvas.height = div.offsetHeight || 100;
            
            this.codeRunner = new CodeRunner(canvas);
            
            // Override draw to update div background
            const originalRun = this.codeRunner.run.bind(this.codeRunner);
            this.codeRunner.run = () => {
                // We hook into the animation loop by wrapping the draw function?
                // CodeRunner uses requestAnimationFrame calling this.drawFunction
                // We can't easily hook into the loop without modifying CodeRunner.
                // But CodeRunner.play() starts the loop.
                // Let's just use a separate loop to sync?
                // Or better: CodeRunner renders to canvas. We just need to sync canvas to div.
                
                // Start the runner
                originalRun();
                
                // Start our sync loop
                const sync = () => {
                    if (!this.codeRunner || !this.codeRunner.isPlaying) return;
                    
                    // Update background from canvas
                    // This is heavy!
                    const dataUrl = canvas.toDataURL();
                    div.style.backgroundImage = `url(${dataUrl})`;
                    div.style.backgroundSize = '100% 100%';
                    div.style.backgroundPosition = 'center';
                    
                    requestAnimationFrame(sync);
                };
                sync();
            };
        }
        
        // Update size if needed
        if (this.codeRunner.canvas.width !== div.offsetWidth || this.codeRunner.canvas.height !== div.offsetHeight) {
             this.codeRunner.resize(div.offsetWidth || 100, div.offsetHeight || 100);
        }

        // Set Code
        if (this.codeRunner.userCode !== fill.code) {
            this.codeRunner.setCode(fill.code || CodeRunner.DEFAULT_CODE);
            this.codeRunner.play();
        }
        
        // Apply CSS
        div.style.webkitBackgroundClip = 'text';
        div.style.webkitTextFillColor = 'transparent';
        div.style.color = 'transparent';
    }

    getGradientCss(gradient) {
        const stops = gradient.stops.map(s => `${s.color} ${s.position}%`).join(', ');
        
        if (gradient.type === 'linear') {
            return `linear-gradient(${gradient.angle}deg, ${stops})`;
        } else if (gradient.type === 'radial') {
             return `radial-gradient(circle, ${stops})`;
        } else if (gradient.type === 'angular') {
             return `conic-gradient(from ${gradient.angle || 0}deg at center, ${stops})`;
        } else if (gradient.type === 'diamond') {
             // CSS doesn't have native diamond gradient. 
             // We can approximate with a radial gradient or use a mask.
             // For now, let's use a radial gradient as fallback or try a complex linear combo?
             // Actually, diamond is often just a rotated square radial.
             // But standard CSS radial is circle or ellipse.
             // Let's stick to radial fallback for now to avoid breaking.
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

    setEditing(isEditing, selectionType = null, clickPosition = null) {
        const div = this.domElement;
        console.log('[DEBUG] TextElement.setEditing called:', isEditing, 'selectionType:', selectionType, 'clickPosition:', clickPosition);
        console.log('[DEBUG] div:', div, 'div.isContentEditable:', div?.isContentEditable);
        if (!div) return;

        if (isEditing) {
            if (!div.isContentEditable) {
                console.log('[DEBUG] Setting contentEditable = true');
                div.contentEditable = true;
                div.style.outline = 'none';
                div.style.cursor = 'text';
                div.style.pointerEvents = 'auto';
                div.focus({ preventScroll: true });
                console.log('[DEBUG] Called focus(), document.activeElement:', document.activeElement);
                
                // Handle initial selection based on selectionType
                if (selectionType === 'all') {
                    // Select all text when entering via Enter key
                    console.log('[DEBUG] Calling selectAllText()');
                    this.selectAllText();
                } else if (selectionType === 'caret' && clickPosition) {
                    // Place caret at click position (double-click)
                    console.log('[DEBUG] Calling placeCaretAtPosition()');
                    this.placeCaretAtPosition(clickPosition.clientX, clickPosition.clientY);
                }
                
                // Add keyboard listener for Escape and Cmd+Enter to exit edit mode
                if (!this._keydownHandler) {
                    this._keydownHandler = (e) => this.handleEditKeyDown(e);
                    div.addEventListener('keydown', this._keydownHandler);
                }
                
                // Add input listener for list auto-formatting
                if (!this._inputHandler) {
                    this._inputHandler = (e) => this.handleInput(e);
                    div.addEventListener('input', this._inputHandler);
                }
            }
        } else {
            if (div.isContentEditable) {
                div.contentEditable = false;
                div.style.outline = 'none';
                div.style.cursor = 'default';
                div.blur();
                
                // Remove keyboard listener
                if (this._keydownHandler) {
                    div.removeEventListener('keydown', this._keydownHandler);
                    this._keydownHandler = null;
                }
                
                // Remove input listener
                if (this._inputHandler) {
                    div.removeEventListener('input', this._inputHandler);
                    this._inputHandler = null;
                }
            }
        }
    }

    selectAllText() {
        const div = this.domElement;
        if (!div) return;
        
        // Use setTimeout to ensure focus is complete before selecting
        setTimeout(() => {
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(div);
            selection.removeAllRanges();
            selection.addRange(range);
        }, 0);
    }

    placeCaretAtPosition(clientX, clientY) {
        const div = this.domElement;
        if (!div) return;
        
        console.log('[DEBUG] placeCaretAtPosition - clientX:', clientX, 'clientY:', clientY);
        
        // Use setTimeout to ensure focus is complete before placing caret
        setTimeout(() => {
            console.log('[DEBUG] placeCaretAtPosition setTimeout fired');
            console.log('[DEBUG] document.activeElement:', document.activeElement);
            
            // Temporarily disable pointer-events on the interaction canvas
            // so caretRangeFromPoint can "see through" to the text element
            const canvas = document.getElementById('interaction-canvas');
            let originalPointerEvents = null;
            if (canvas) {
                originalPointerEvents = canvas.style.pointerEvents;
                canvas.style.pointerEvents = 'none';
            }
            
            // Use caretRangeFromPoint (standard) or caretPositionFromPoint (Firefox)
            let range;
            if (document.caretRangeFromPoint) {
                range = document.caretRangeFromPoint(clientX, clientY);
                console.log('[DEBUG] caretRangeFromPoint result:', range);
                // Verify the range is within our text element
                if (range && !div.contains(range.commonAncestorContainer)) {
                    console.log('[DEBUG] Range not in text element, using fallback');
                    range = null;
                }
            } else if (document.caretPositionFromPoint) {
                const pos = document.caretPositionFromPoint(clientX, clientY);
                console.log('[DEBUG] caretPositionFromPoint result:', pos);
                if (pos && div.contains(pos.offsetNode)) {
                    range = document.createRange();
                    range.setStart(pos.offsetNode, pos.offset);
                    range.collapse(true);
                }
            }
            
            // Restore pointer-events on canvas
            if (canvas && originalPointerEvents !== null) {
                canvas.style.pointerEvents = originalPointerEvents;
            }
            
            if (range) {
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
                console.log('[DEBUG] Selection set with range');
            } else {
                // Fallback: place caret at end of text
                console.log('[DEBUG] No valid range found, using fallback - placing caret at end');
                const selection = window.getSelection();
                const textRange = document.createRange();
                textRange.selectNodeContents(div);
                textRange.collapse(false); // Collapse to end
                selection.removeAllRanges();
                selection.addRange(textRange);
            }
        }, 0);
    }

    handleEditKeyDown(e) {
        // Escape or Cmd/Ctrl+Enter to exit edit mode
        if (e.key === 'Escape' || (e.key === 'Enter' && (e.metaKey || e.ctrlKey))) {
            e.preventDefault();
            e.stopPropagation();
            store.dispatch('SET_EDITING_ELEMENT', null);
            // Keep the element selected
            return;
        }
        
        // Handle Tab for list indentation
        if (e.key === 'Tab') {
            const selection = window.getSelection();
            const node = selection.anchorNode;
            const li = node?.nodeType === Node.TEXT_NODE 
                ? node.parentElement?.closest('li') 
                : node?.closest?.('li');
            
            if (li) {
                e.preventDefault();
                e.stopPropagation();
                if (e.shiftKey) {
                    // Outdent
                    document.execCommand('outdent');
                } else {
                    // Indent
                    document.execCommand('indent');
                }
            }
            return;
        }
        
        // Handle Enter key - for regular text, let browser handle it (creates newline)
        // Only intercept Enter in specific cases (lists)
        if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
            const selection = window.getSelection();
            const node = selection.anchorNode;
            const li = node?.nodeType === Node.TEXT_NODE 
                ? node.parentElement?.closest('li') 
                : node?.closest?.('li');
            
            if (li) {
                const isEmpty = li.textContent.trim() === '';
                
                if (isEmpty) {
                    e.preventDefault();
                    e.stopPropagation();
                    // Exit list by removing empty li and inserting a line break after the list
                    const list = li.closest('ul, ol');
                    if (list) {
                        li.remove();
                        // If list is now empty, remove it too
                        if (list.children.length === 0) {
                            list.remove();
                        }
                        // Place cursor after the list
                        const br = document.createElement('br');
                        if (list.parentNode) {
                            list.parentNode.insertBefore(br, list.nextSibling);
                            const range = document.createRange();
                            range.setStartAfter(br);
                            range.collapse(true);
                            selection.removeAllRanges();
                            selection.addRange(range);
                        }
                    }
                    return;
                }
                // If li is not empty, let browser handle Enter (creates new li)
            }
            // For regular text (not in list), let browser handle Enter (creates newline)
            // Do NOT call e.preventDefault() here - we want the default behavior
            e.stopPropagation(); // But stop propagation to prevent global handlers from interfering
        }
    }

    handleInput(e) {
        // Auto-detect list patterns at the start of a line
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        const node = range.startContainer;
        
        // Get the current line content
        const lineContent = this.getCurrentLineContent(node, range.startOffset);
        if (!lineContent) return;
        
        // Check for bullet list patterns: "- " or "* " at start of line
        if (/^[-*]\s$/.test(lineContent.text)) {
            this.convertToList('ul', lineContent);
            return;
        }
        
        // Check for numbered list pattern: "1. " at start of line
        if (/^\d+\.\s$/.test(lineContent.text)) {
            this.convertToList('ol', lineContent);
            return;
        }
    }

    getCurrentLineContent(node, offset) {
        // Find the text content from the start of the current line to the cursor
        if (node.nodeType !== Node.TEXT_NODE) return null;
        
        const textContent = node.textContent;
        const beforeCursor = textContent.substring(0, offset);
        
        // Find the last newline before cursor (or start of text)
        const lastNewline = beforeCursor.lastIndexOf('\n');
        const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
        const lineText = beforeCursor.substring(lineStart);
        
        return {
            text: lineText,
            node: node,
            lineStart: lineStart,
            cursorOffset: offset
        };
    }

    convertToList(listType, lineContent) {
        const { node, lineStart, cursorOffset } = lineContent;
        const selection = window.getSelection();
        
        // Remove the pattern from the text
        const patternLength = cursorOffset - lineStart;
        
        // Select the pattern text
        const range = document.createRange();
        range.setStart(node, lineStart);
        range.setEnd(node, cursorOffset);
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Delete the pattern
        document.execCommand('delete');
        
        // Insert list using execCommand
        if (listType === 'ul') {
            document.execCommand('insertUnorderedList');
        } else {
            document.execCommand('insertOrderedList');
        }
    }
}
